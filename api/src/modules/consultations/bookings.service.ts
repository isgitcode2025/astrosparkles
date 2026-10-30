import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Astrologer, AstrologerStatus } from '../astrologers/astrologer.schema';
import { User } from '../users/user.schema';
import { TxnReason } from '../wallet/wallet.schemas';
import { WalletService } from '../wallet/wallet.service';
import { Booking, BookingDocument, BookingStatus } from './booking.schema';
import { ConsultationsService } from './consultations.service';
import { CreateBookingDto, UpdateScheduleDto } from './dto/booking.dto';

const MIN_LEAD_MS = 30 * 60_000; // slots must start at least 30 min from now
const USER_CANCEL_BEFORE_MS = 2 * 60 * 60_000; // users may cancel up to 2 h before start
const JOIN_EARLY_MS = 5 * 60_000; // the session can be opened 5 min early
const MAX_DAYS_AHEAD = 14;
const SWEEP_MS = 30_000;

export type Slot = { start: string; end: string; available: boolean };

/** Minutes east of UTC for a time zone at a given instant (handles zones with DST too). */
export function zoneOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000);
}

/** YYYY-MM-DD of an instant in a time zone. */
export function localDate(timeZone: string, at: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Bookings');
  private sweeper?: NodeJS.Timeout;

  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Astrologer.name) private readonly astrologers: Model<Astrologer>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly wallet: WalletService,
    private readonly consult: ConsultationsService,
  ) {}

  onModuleInit() {
    this.sweeper = setInterval(() => this.sweep().catch((e) => this.logger.error(e)), SWEEP_MS);
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  // ---------- astrologer schedule ----------

  private async myAstrologer(userId: string) {
    const a = await this.astrologers.findOne({ userId: new Types.ObjectId(userId) });
    if (!a) throw new NotFoundException('Astrologer profile not found');
    return a;
  }

  static scheduleView(a: Pick<Astrologer, 'schedule'>) {
    const s = a.schedule ?? ({} as Astrologer['schedule']);
    return {
      enabled: s.enabled ?? false,
      slotMinutes: s.slotMinutes ?? 30,
      timezone: s.timezone ?? 'Asia/Kolkata',
      days: (s.days ?? []).map((d) => ({ day: d.day, start: d.start, end: d.end })),
    };
  }

  async getSchedule(userId: string) {
    return BookingsService.scheduleView(await this.myAstrologer(userId));
  }

  async updateSchedule(userId: string, dto: UpdateScheduleDto) {
    const a = await this.myAstrologer(userId);
    for (const d of dto.days) {
      if (toMin(d.end) - toMin(d.start) < dto.slotMinutes) {
        throw new BadRequestException(`Window ${d.start}–${d.end} is shorter than one ${dto.slotMinutes}-minute slot`);
      }
    }
    // reject overlapping windows on the same day
    for (let day = 0; day < 7; day++) {
      const w = dto.days.filter((d) => d.day === day).sort((x, y) => toMin(x.start) - toMin(y.start));
      for (let i = 1; i < w.length; i++) {
        if (toMin(w[i].start) < toMin(w[i - 1].end)) throw new BadRequestException('Time windows on the same day overlap');
      }
    }
    if (dto.enabled && !a.rates?.chat) throw new BadRequestException('Set a chat rate before accepting scheduled sessions');
    a.schedule = {
      enabled: dto.enabled,
      slotMinutes: dto.slotMinutes,
      timezone: a.schedule?.timezone ?? 'Asia/Kolkata',
      days: dto.days.map((d) => ({ day: d.day, start: d.start, end: d.end })),
    };
    await a.save();
    return BookingsService.scheduleView(a);
  }

  // ---------- slots ----------

  private ratePaise(a: Astrologer) {
    const r = a.rates?.chatOffer != null && a.rates.chatOffer < a.rates.chat ? a.rates.chatOffer : a.rates?.chat ?? 0;
    return Math.round(r * 100);
  }

  /** All slots (taken or not) defined by the weekly schedule for one local date. */
  private slotsFor(a: Astrologer, date: string): Array<{ start: Date; end: Date }> {
    const s = a.schedule;
    if (!s?.enabled) return [];
    const [y, m, d] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const out: Array<{ start: Date; end: Date }> = [];
    const offset = zoneOffsetMinutes(s.timezone, new Date(Date.UTC(y, m - 1, d, 12)));
    for (const w of s.days.filter((x) => x.day === weekday)) {
      for (let t = toMin(w.start); t + s.slotMinutes <= toMin(w.end); t += s.slotMinutes) {
        const start = new Date(Date.UTC(y, m - 1, d, 0, t) - offset * 60_000);
        out.push({ start, end: new Date(start.getTime() + s.slotMinutes * 60_000) });
      }
    }
    return out;
  }

  private async approved(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Astrologer not found');
    const a = await this.astrologers.findOne({ _id: id, status: AstrologerStatus.Approved });
    if (!a) throw new NotFoundException('Astrologer not found');
    return a;
  }

  async slots(astrologerId: string, from?: string, days = 7) {
    const a = await this.approved(astrologerId);
    const view = BookingsService.scheduleView(a);
    const now = Date.now();
    const today = localDate(view.timezone, new Date(now));
    const lastDay = localDate(view.timezone, new Date(now + (MAX_DAYS_AHEAD - 1) * 86_400_000));
    let first = from && from > today ? from : today;
    if (first > lastDay) first = lastDay;

    const dates: string[] = [];
    const [y, m, d] = first.split('-').map(Number);
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
      if (date > lastDay) break;
      dates.push(date);
    }

    const all = dates.map((date) => ({ date, slots: this.slotsFor(a, date) }));
    const starts = all.flatMap((x) => x.slots.map((s) => s.start));
    const taken = starts.length
      ? await this.bookings.find({ astrologerId: a._id, holdsSlot: true, start: { $in: starts } }).select('start').lean()
      : [];
    const takenSet = new Set(taken.map((b) => b.start.getTime()));

    const minutes = view.slotMinutes;
    const rate = this.ratePaise(a);
    return {
      astrologerId: a.id as string,
      enabled: view.enabled && rate > 0,
      slotMinutes: minutes,
      timezone: view.timezone,
      ratePerMin: rate / 100,
      price: (rate * minutes) / 100,
      days: all.map(({ date, slots }) => ({
        date,
        weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
        slots: slots.map<Slot>((s) => ({
          start: s.start.toISOString(),
          end: s.end.toISOString(),
          available: s.start.getTime() - now >= MIN_LEAD_MS && !takenSet.has(s.start.getTime()),
        })),
      })),
    };
  }

  // ---------- booking ----------

  async create(userId: string, dto: CreateBookingDto) {
    const a = await this.approved(dto.astrologerId);
    if (String(a.userId) === userId) throw new BadRequestException('You cannot book your own slot');
    const start = new Date(dto.start);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Invalid start time');
    if (start.getTime() - Date.now() < MIN_LEAD_MS) throw new BadRequestException('This slot is too soon. Pick a later time.');
    if (start.getTime() - Date.now() > MAX_DAYS_AHEAD * 86_400_000) throw new BadRequestException('Slots open 14 days ahead');

    const date = localDate(a.schedule?.timezone ?? 'Asia/Kolkata', start);
    const slot = this.slotsFor(a, date).find((s) => s.start.getTime() === start.getTime());
    if (!slot) throw new BadRequestException('This time is not in the astrologer\'s schedule');
    const rate = this.ratePaise(a);
    if (rate <= 0) throw new BadRequestException('This astrologer does not offer chat right now');
    if (await this.bookings.exists({ astrologerId: a._id, start, holdsSlot: true })) {
      throw new ConflictException('This slot was just booked. Please pick another.');
    }
    const clash = await this.bookings.exists({
      userId: new Types.ObjectId(userId),
      holdsSlot: true,
      status: { $in: [BookingStatus.Confirmed, BookingStatus.Started] },
      start: { $lt: slot.end },
      end: { $gt: slot.start },
    });
    if (clash) throw new ConflictException('You already have a session booked at this time');

    const minutes = a.schedule.slotMinutes;
    const amountPaise = rate * minutes;
    const user = await this.users.findById(userId).select('name');
    const id = new Types.ObjectId();
    const when = start.toLocaleString('en-IN', { timeZone: a.schedule.timezone, dateStyle: 'medium', timeStyle: 'short' });
    await this.wallet.debit(userId, amountPaise, TxnReason.Consultation, {
      description: `Scheduled chat with ${a.displayName} on ${when} (${minutes} min)`,
      refType: 'booking',
      refId: String(id),
    });
    try {
      const b = await this.bookings.create({
        _id: id,
        userId: new Types.ObjectId(userId),
        astrologerId: a._id,
        astrologerUserId: a.userId,
        mode: 'chat',
        start: slot.start,
        end: slot.end,
        minutes,
        ratePerMinPaise: rate,
        amountPaise,
        commissionPercent: a.commissionPercent,
        userName: user?.name,
        astrologerName: a.displayName,
        topic: dto.topic,
      });
      return this.view(b, 'user');
    } catch (e) {
      // lost a race for the same slot: give the money back
      await this.wallet.credit(userId, amountPaise, TxnReason.Refund, {
        description: `Refund: slot with ${a.displayName} was taken`,
        refType: 'booking',
        refId: String(id),
      });
      if ((e as { code?: number }).code === 11000) throw new ConflictException('This slot was just booked. Please pick another.');
      throw e;
    }
  }

  private async find(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Booking not found');
    const b = await this.bookings.findById(id);
    if (!b) throw new NotFoundException('Booking not found');
    return b;
  }

  private sideOf(b: BookingDocument, userId: string): 'user' | 'astrologer' {
    if (String(b.userId) === userId) return 'user';
    if (String(b.astrologerUserId) === userId) return 'astrologer';
    throw new ForbiddenException('Not your booking');
  }

  async list(userId: string, side: 'user' | 'astrologer', scope: 'upcoming' | 'past' | 'all' = 'upcoming') {
    const filter: Record<string, unknown> = side === 'user' ? { userId: new Types.ObjectId(userId) } : { astrologerUserId: new Types.ObjectId(userId) };
    const now = new Date();
    if (scope === 'upcoming') {
      filter.status = { $in: [BookingStatus.Confirmed, BookingStatus.Started] };
      filter.end = { $gt: new Date(now.getTime() - 10 * 60_000) };
    } else if (scope === 'past') {
      filter.$or = [{ status: { $in: [BookingStatus.Completed, BookingStatus.Cancelled, BookingStatus.Expired] } }, { end: { $lte: now } }];
    }
    const items = await this.bookings
      .find(filter)
      .sort({ start: scope === 'upcoming' ? 1 : -1 })
      .limit(100);
    return items.map((b) => this.view(b, side));
  }

  async cancel(userId: string, id: string) {
    const b = await this.find(id);
    const side = this.sideOf(b, userId);
    if (b.status !== BookingStatus.Confirmed) throw new BadRequestException('Only an upcoming booking can be cancelled');
    if (side === 'user' && b.start.getTime() - Date.now() < USER_CANCEL_BEFORE_MS) {
      throw new BadRequestException('Bookings can be cancelled up to 2 hours before the start time');
    }
    const updated = await this.refundAndClose(b, BookingStatus.Cancelled, side);
    if (!updated) throw new BadRequestException('Only an upcoming booking can be cancelled');
    return this.view(updated, side);
  }

  /** Atomically closes a confirmed booking, frees the slot and refunds the full amount. */
  private async refundAndClose(b: BookingDocument, status: BookingStatus, by: 'user' | 'astrologer' | 'system') {
    const updated = await this.bookings.findOneAndUpdate(
      { _id: b._id, status: BookingStatus.Confirmed },
      { $set: { status, holdsSlot: false, cancelledBy: by, refundedPaise: b.amountPaise } },
      { new: true },
    );
    if (!updated) return null;
    const reason =
      status === BookingStatus.Expired ? 'session was not started' : by === 'astrologer' ? 'cancelled by the astrologer' : 'cancelled';
    await this.wallet.credit(b.userId, b.amountPaise, TxnReason.Refund, {
      description: `Refund: scheduled chat with ${b.astrologerName} (${reason})`,
      refType: 'booking',
      refId: b.id as string,
    });
    return updated;
  }

  /** Opens the prepaid chat. Either side can start it from 5 minutes before the slot until it ends. */
  async start(userId: string, id: string) {
    const b = await this.find(id);
    const side = this.sideOf(b, userId);
    if (b.status === BookingStatus.Started && b.consultationId) {
      return { booking: this.view(b, side), consultationId: String(b.consultationId) };
    }
    if (b.status !== BookingStatus.Confirmed) throw new BadRequestException(`This booking is ${b.status}`);
    const now = Date.now();
    if (now < b.start.getTime() - JOIN_EARLY_MS) throw new BadRequestException('You can join 5 minutes before the start time');
    if (now >= b.end.getTime()) throw new BadRequestException('This slot has ended');

    // claim the booking first so two clicks cannot open two sessions
    const claimed = await this.bookings.findOneAndUpdate(
      { _id: b._id, status: BookingStatus.Confirmed },
      { $set: { status: BookingStatus.Started } },
      { new: true },
    );
    if (!claimed) {
      const again = await this.find(id);
      if (again.consultationId) return { booking: this.view(again, side), consultationId: String(again.consultationId) };
      throw new ConflictException('This session is being opened. Please try again.');
    }
    try {
      const c = await this.consult.startBooked(claimed);
      claimed.consultationId = c._id;
      await claimed.save();
      return { booking: this.view(claimed, side), consultationId: c.id as string };
    } catch (e) {
      await this.bookings.updateOne({ _id: claimed._id, status: BookingStatus.Started }, { $set: { status: BookingStatus.Confirmed } });
      throw e;
    }
  }

  /** Refunds bookings nobody started before the slot ended. */
  async sweep() {
    const due = await this.bookings.find({ status: BookingStatus.Confirmed, end: { $lte: new Date() } }).limit(200);
    for (const b of due) await this.refundAndClose(b, BookingStatus.Expired, 'system');
  }

  view(b: BookingDocument, side: 'user' | 'astrologer') {
    const now = Date.now();
    const start = b.start.getTime();
    const end = b.end.getTime();
    return {
      id: b.id as string,
      astrologerId: String(b.astrologerId),
      astrologerName: b.astrologerName,
      userName: b.userName ?? 'User',
      mode: b.mode,
      start: b.start,
      end: b.end,
      minutes: b.minutes,
      ratePerMin: b.ratePerMinPaise / 100,
      amount: b.amountPaise / 100,
      astrologerEarning: Math.floor((b.amountPaise * (100 - b.commissionPercent)) / 100) / 100,
      status: b.status,
      topic: b.topic ?? null,
      consultationId: b.consultationId ? String(b.consultationId) : null,
      cancelledBy: b.cancelledBy ?? null,
      refunded: (b.refundedPaise ?? 0) / 100,
      canJoin:
        (b.status === BookingStatus.Confirmed && now >= start - JOIN_EARLY_MS && now < end) ||
        (b.status === BookingStatus.Started && !!b.consultationId),
      canCancel: b.status === BookingStatus.Confirmed && (side === 'astrologer' ? now < end : start - now >= USER_CANCEL_BEFORE_MS),
    };
  }
}

