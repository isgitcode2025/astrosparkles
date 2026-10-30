import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { Astrologer, AstrologerStatus, Presence } from '../astrologers/astrologer.schema';
import { Gift } from '../gifts/gift.schema';
import { Booking, BookingDocument, BookingStatus } from './booking.schema';
import { User } from '../users/user.schema';
import { TxnReason } from '../wallet/wallet.schemas';
import { WalletService } from '../wallet/wallet.service';
import { ConsultationEvents } from './consultation.events';
import {
  ChatMessage,
  ConsultMode,
  Consultation,
  ConsultationDocument,
  ConsultStatus,
  OPEN_STATUSES,
} from './consultation.schemas';
import { AstrologerReviewsQuery, RequestConsultationDto, ReviewDto } from './dto/consultation.dto';

type Role = 'user' | 'astrologer';
const SWEEP_INTERVAL_MS = 5_000;
const LOW_BALANCE_WARNING_SECONDS = 60;

@Injectable()
export class ConsultationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Consultations');
  private sweeper?: NodeJS.Timeout;
  private warned = new Set<string>();

  constructor(
    @InjectModel(Consultation.name) private readonly consultations: Model<Consultation>,
    @InjectModel(ChatMessage.name) private readonly messages: Model<ChatMessage>,
    @InjectModel(Astrologer.name) private readonly astrologers: Model<Astrologer>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Gift.name) private readonly gifts: Model<Gift>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    private readonly wallet: WalletService,
    private readonly events: ConsultationEvents,
    private readonly config: ConfigService,
  ) {}

  // ---------- lifecycle of the background sweeper ----------

  onModuleInit() {
    this.sweeper = setInterval(() => this.sweep().catch((e) => this.logger.error(e)), SWEEP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  // ---------- helpers ----------

  private cfg(key: 'freeMinutes' | 'minBalanceMinutes' | 'requestTimeoutSeconds') {
    return this.config.get<number>(`consultation.${key}`) as number;
  }

  private async load(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Consultation not found');
    const c = await this.consultations.findById(id);
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  /** Returns the caller's role in this consultation, or throws. */
  roleOf(c: Consultation, userId: string): Role {
    if (String(c.userId) === userId) return 'user';
    if (String(c.astrologerUserId) === userId) return 'astrologer';
    throw new ForbiddenException('Not your consultation');
  }

  private publish(c: ConsultationDocument) {
    this.events.emitEvent('consultation.updated', ConsultationsService.toView(c));
  }

  private async systemMessage(c: ConsultationDocument, text: string) {
    const m = await this.messages.create({ consultationId: c._id, sender: 'system', text });
    this.events.emitEvent('message.created', ConsultationsService.messageView(m, c));
  }

  // ---------- user actions ----------

  async request(userId: string, dto: RequestConsultationDto) {
    const astro = await this.astrologers.findById(dto.astrologerId);
    if (!astro || astro.status !== AstrologerStatus.Approved) throw new NotFoundException('Astrologer not found');
    if (String(astro.userId) === userId) throw new BadRequestException('You cannot consult yourself');

    const rate = astro.rates[`${dto.mode}Offer`] ?? astro.rates[dto.mode];
    if (!rate || rate <= 0) throw new BadRequestException(`${astro.displayName} does not offer ${dto.mode}`);
    if (astro.presence !== Presence.Online) {
      throw new ConflictException(astro.presence === Presence.Busy ? 'Astrologer is in another consultation' : 'Astrologer is offline');
    }
    const open = await this.consultations.exists({ userId: new Types.ObjectId(userId), status: { $in: OPEN_STATUSES } });
    if (open) throw new ConflictException('You already have an ongoing consultation');

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const ratePaise = Math.round(rate * 100);
    const freeMinutes =
      dto.mode === ConsultMode.Chat && !user.freeConsultationUsed ? this.cfg('freeMinutes') : 0;
    const paidMinutesAffordable = Math.floor(user.walletBalancePaise / ratePaise);

    if (freeMinutes === 0 && paidMinutesAffordable < this.cfg('minBalanceMinutes')) {
      const needed = (ratePaise * this.cfg('minBalanceMinutes')) / 100;
      throw new BadRequestException(`Minimum balance of ₹${needed} needed for ${this.cfg('minBalanceMinutes')} minutes. Please recharge.`);
    }

    const c = await this.consultations.create({
      userId: user._id,
      astrologerId: astro._id,
      astrologerUserId: astro.userId,
      mode: dto.mode,
      status: ConsultStatus.Requested,
      userName: user.name ?? 'User',
      astrologerName: astro.displayName,
      ratePerMinPaise: ratePaise,
      freeMinutes,
      maxMinutes: freeMinutes + paidMinutesAffordable,
      commissionPercent: astro.commissionPercent,
      requestedAt: new Date(),
      intake: { name: user.name, gender: user.gender, birth: user.birth, topic: dto.topic },
    });
    this.publish(c);
    return ConsultationsService.toView(c);
  }

  /**
   * Opens the live session for a paid booking. No wallet check: the slot was paid when booked.
   * Runs at most until the slot's end plus a short grace period.
   */
  async startBooked(b: BookingDocument) {
    const astro = await this.astrologers.findById(b.astrologerId);
    if (!astro) throw new NotFoundException('Astrologer not found');
    const busy = await this.consultations.exists({ astrologerId: b.astrologerId, status: ConsultStatus.Active });
    if (busy) throw new ConflictException('The astrologer is finishing another session. Please try again in a minute.');
    const userBusy = await this.consultations.exists({ userId: b.userId, status: { $in: OPEN_STATUSES } });
    if (userBusy) throw new ConflictException('The user already has an ongoing consultation');

    const now = Date.now();
    const graceEnd = b.end.getTime() + 10 * 60_000;
    const maxMinutes = Math.max(1, Math.min(b.minutes, Math.ceil((graceEnd - now) / 60_000)));
    const user = await this.users.findById(b.userId).select('name gender birth');
    const c = await this.consultations.create({
      userId: b.userId,
      astrologerId: b.astrologerId,
      astrologerUserId: b.astrologerUserId,
      mode: ConsultMode.Chat,
      status: ConsultStatus.Active,
      userName: b.userName ?? user?.name ?? 'User',
      astrologerName: b.astrologerName,
      ratePerMinPaise: b.ratePerMinPaise,
      freeMinutes: 0,
      maxMinutes,
      commissionPercent: b.commissionPercent,
      requestedAt: new Date(now),
      startedAt: new Date(now),
      amountPaise: b.amountPaise,
      prepaid: true,
      bookingId: b._id,
      intake: { name: user?.name, gender: user?.gender, birth: user?.birth, topic: b.topic },
    });
    await this.astrologers.updateOne({ _id: b.astrologerId }, { $set: { presence: Presence.Busy } });
    this.publish(c);
    await this.systemMessage(c, `Scheduled session started. Prepaid for ${b.minutes} minutes.`);
    return c;
  }

  async cancel(userId: string, id: string) {
    const c = await this.consultations.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId), status: ConsultStatus.Requested },
      { $set: { status: ConsultStatus.Cancelled, endedAt: new Date(), endReason: 'user_cancelled', endedBy: 'user' } },
      { new: true },
    );
    if (!c) throw new BadRequestException('Only a pending request can be cancelled');
    this.publish(c);
    return ConsultationsService.toView(c);
  }

  // ---------- astrologer actions ----------

  async accept(astroUserId: string, id: string) {
    const c = await this.consultations.findOneAndUpdate(
      { _id: id, astrologerUserId: new Types.ObjectId(astroUserId), status: ConsultStatus.Requested },
      { $set: { status: ConsultStatus.Active, startedAt: new Date() } },
      { new: true },
    );
    if (!c) throw new BadRequestException('This request is no longer available');
    if (c.mode !== ConsultMode.Chat) c.channelName = `kj_${randomBytes(8).toString('hex')}`;
    await c.save();

    await this.astrologers.updateOne({ _id: c.astrologerId }, { $set: { presence: Presence.Busy } });
    if (c.freeMinutes > 0) await this.users.updateOne({ _id: c.userId }, { $set: { freeConsultationUsed: true } });

    // other people waiting for this astrologer cannot be served now
    const others = await this.consultations.find({ astrologerId: c.astrologerId, status: ConsultStatus.Requested });
    for (const o of others) {
      o.status = ConsultStatus.Missed;
      o.endedAt = new Date();
      o.endReason = 'astrologer_busy';
      o.endedBy = 'system';
      await o.save();
      this.publish(o);
    }

    this.publish(c);
    await this.systemMessage(
      c,
      c.freeMinutes > 0
        ? `Consultation started. Your first ${c.freeMinutes} minutes are free.`
        : `Consultation started at ₹${c.ratePerMinPaise / 100}/min.`,
    );
    return ConsultationsService.toView(c);
  }

  async reject(astroUserId: string, id: string) {
    const c = await this.consultations.findOneAndUpdate(
      { _id: id, astrologerUserId: new Types.ObjectId(astroUserId), status: ConsultStatus.Requested },
      { $set: { status: ConsultStatus.Rejected, endedAt: new Date(), endReason: 'astrologer_rejected', endedBy: 'astrologer' } },
      { new: true },
    );
    if (!c) throw new BadRequestException('This request is no longer available');
    this.publish(c);
    return ConsultationsService.toView(c);
  }

  async incoming(astroUserId: string) {
    const list = await this.consultations
      .find({ astrologerUserId: new Types.ObjectId(astroUserId), status: { $in: OPEN_STATUSES } })
      .sort({ requestedAt: 1 });
    return list.map((c) => ConsultationsService.toView(c));
  }

  // ---------- both sides ----------

  async end(actorUserId: string, id: string, reason?: string) {
    const c = await this.load(id);
    const role = this.roleOf(c, actorUserId);
    if (c.status !== ConsultStatus.Active) throw new BadRequestException('Consultation is not active');
    return ConsultationsService.toView(await this.finalize(c, role, reason ?? `${role}_ended`));
  }

  /**
   * Ends an active consultation and bills it. The status change active → completed is
   * conditional, so billing happens exactly once even if both sides end at the same moment.
   */
  private async finalize(c: ConsultationDocument, endedBy: Role | 'system', reason: string) {
    const endedAt = new Date();
    const claimed = await this.consultations.findOneAndUpdate(
      { _id: c._id, status: ConsultStatus.Active },
      { $set: { status: ConsultStatus.Completed, endedAt, endReason: reason, endedBy } },
      { new: true },
    );
    if (!claimed) return (await this.consultations.findById(c._id)) as ConsultationDocument;

    const seconds = Math.max(1, (endedAt.getTime() - (claimed.startedAt as Date).getTime()) / 1000);
    const billedMinutes = Math.min(Math.max(1, Math.ceil(seconds / 60)), Math.max(claimed.maxMinutes, 1));
    const paidMinutes = Math.max(0, billedMinutes - claimed.freeMinutes);
    let amountPaise = claimed.prepaid ? claimed.amountPaise : paidMinutes * claimed.ratePerMinPaise;

    if (amountPaise > 0 && !claimed.prepaid) {
      const user = await this.users.findById(claimed.userId).select('walletBalancePaise');
      amountPaise = Math.min(amountPaise, user?.walletBalancePaise ?? 0);
      if (amountPaise > 0) {
        await this.wallet.debit(claimed.userId, amountPaise, TxnReason.Consultation, {
          description: `${claimed.mode === 'chat' ? 'Chat' : 'Call'} with ${claimed.astrologerName} (${billedMinutes} min)`,
          refType: 'consultation',
          refId: claimed.id,
        });
      }
    }

    claimed.billedMinutes = billedMinutes;
    claimed.amountPaise = amountPaise;
    claimed.astrologerEarningPaise = Math.floor((amountPaise * (100 - claimed.commissionPercent)) / 100);
    await claimed.save();

    await this.astrologers.updateOne(
      { _id: claimed.astrologerId, presence: Presence.Busy },
      { $set: { presence: Presence.Online } },
    );
    await this.astrologers.updateOne({ _id: claimed.astrologerId }, { $inc: { consultationCount: 1 } });
    this.warned.delete(claimed.id);

    if (claimed.bookingId) {
      await this.bookings.updateOne({ _id: claimed.bookingId, status: BookingStatus.Started }, { $set: { status: BookingStatus.Completed } });
    }
    await this.systemMessage(
      claimed,
      claimed.prepaid
        ? `Scheduled session ended after ${billedMinutes} min (prepaid ₹${amountPaise / 100}).`
        : `Consultation ended. Duration ${billedMinutes} min, charged ₹${amountPaise / 100}.`,
    );
    this.publish(claimed);
    return claimed;
  }

  /** Runs every few seconds: expires unanswered requests and ends sessions when the balance runs out. */
  async sweep() {
    const now = Date.now();
    const timeout = this.cfg('requestTimeoutSeconds') * 1000;

    const stale = await this.consultations.find({ status: ConsultStatus.Requested, requestedAt: { $lte: new Date(now - timeout) } });
    for (const c of stale) {
      const updated = await this.consultations.findOneAndUpdate(
        { _id: c._id, status: ConsultStatus.Requested },
        { $set: { status: ConsultStatus.Missed, endedAt: new Date(), endReason: 'no_response', endedBy: 'system' } },
        { new: true },
      );
      if (updated) this.publish(updated);
    }

    const active = await this.consultations.find({ status: ConsultStatus.Active });
    for (const c of active) {
      const endsAt = (c.startedAt as Date).getTime() + c.maxMinutes * 60_000;
      if (now >= endsAt) {
        await this.finalize(c, 'system', c.prepaid ? 'time_up' : 'balance_exhausted');
      } else if (endsAt - now <= LOW_BALANCE_WARNING_SECONDS * 1000 && !this.warned.has(c.id)) {
        this.warned.add(c.id);
        this.events.emitEvent('consultation.warning', {
          consultationId: c.id,
          userId: String(c.userId),
          secondsLeft: Math.round((endsAt - now) / 1000),
          message: 'Less than 1 minute left. Recharge to continue.',
        });
      }
    }
  }

  async get(userId: string, id: string) {
    const c = await this.load(id);
    const role = this.roleOf(c, userId);
    return { ...ConsultationsService.toView(c), myRole: role };
  }

  async activeFor(userId: string) {
    const uid = new Types.ObjectId(userId);
    const c = await this.consultations
      .findOne({ status: { $in: OPEN_STATUSES }, $or: [{ userId: uid }, { astrologerUserId: uid }] })
      .sort({ requestedAt: -1 });
    return c ? { ...ConsultationsService.toView(c), myRole: this.roleOf(c, userId) } : null;
  }

  async history(userId: string, as: Role, page = 1, limit = 20) {
    const filter = as === 'user' ? { userId: new Types.ObjectId(userId) } : { astrologerUserId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.consultations.find(filter).sort({ requestedAt: -1 }).skip((page - 1) * limit).limit(limit),
      this.consultations.countDocuments(filter),
    ]);
    return { items: items.map((c) => ConsultationsService.toView(c)), page, limit, total, hasMore: page * limit < total };
  }

  async earnings(astroUserId: string) {
    const uid = new Types.ObjectId(astroUserId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [all, today] = await Promise.all(
      [{}, { endedAt: { $gte: startOfDay } }].map((extra) =>
        this.consultations.aggregate([
          { $match: { astrologerUserId: uid, status: ConsultStatus.Completed, ...extra } },
          { $group: { _id: null, count: { $sum: 1 }, minutes: { $sum: '$billedMinutes' }, earning: { $sum: '$astrologerEarningPaise' } } },
        ]),
      ),
    );
    const [giftsAll, giftsToday] = await Promise.all(
      [{}, { createdAt: { $gte: startOfDay } }].map((extra) =>
        this.gifts.aggregate([
          { $match: { astrologerUserId: uid, ...extra } },
          { $group: { _id: null, count: { $sum: 1 }, earning: { $sum: '$astrologerEarningPaise' } } },
        ]),
      ),
    );
    const pick = (r: { count: number; minutes: number; earning: number }[], g: { count: number; earning: number }[]) => ({
      consultations: r[0]?.count ?? 0,
      minutes: r[0]?.minutes ?? 0,
      earning: (r[0]?.earning ?? 0) / 100,
      gifts: g[0]?.count ?? 0,
      giftEarning: (g[0]?.earning ?? 0) / 100,
    });
    return { today: pick(today, giftsToday), allTime: pick(all, giftsAll) };
  }

  // ---------- messages ----------

  async listMessages(userId: string, id: string) {
    const c = await this.load(id);
    this.roleOf(c, userId);
    const msgs = await this.messages.find({ consultationId: c._id }).sort({ createdAt: 1, _id: 1 }).limit(1000);
    return msgs.map((m) => ConsultationsService.messageView(m, c));
  }

  async addMessage(userId: string, id: string, text: string, clientId?: string) {
    const c = await this.load(id);
    const role = this.roleOf(c, userId);
    if (c.status !== ConsultStatus.Active) throw new BadRequestException('Chat is not active');
    const clean = text.trim();
    if (!clean) throw new BadRequestException('Message is empty');
    const m = await this.messages.create({ consultationId: c._id, sender: role, text: clean, clientId });
    const view = ConsultationsService.messageView(m, c);
    this.events.emitEvent('message.created', view);
    return view;
  }

  // ---------- review ----------

  async review(userId: string, id: string, dto: ReviewDto) {
    const c = await this.load(id);
    if (this.roleOf(c, userId) !== 'user') throw new ForbiddenException('Only the user can review');
    if (c.status !== ConsultStatus.Completed) throw new BadRequestException('You can review after the consultation ends');
    if (c.review?.rating) throw new ConflictException('Already reviewed');
    c.review = { rating: dto.rating, comment: dto.comment, createdAt: new Date() };
    await c.save();

    await this.recomputeRating(c.astrologerId);
    return { reviewed: true };
  }

  /** True when the account exists and is not blocked or deleted (used by the realtime gateway). */
  async isActiveUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return false;
    return !!(await this.users.exists({ _id: userId, status: 'active' }));
  }

  /** Recalculates an astrologer's average rating from visible reviews. */
  async recomputeRating(astrologerId: Types.ObjectId) {
    const [agg] = await this.consultations.aggregate([
      { $match: { astrologerId, 'review.rating': { $gte: 1 }, 'review.hidden': { $ne: true } } },
      { $group: { _id: null, avg: { $avg: '$review.rating' }, count: { $sum: 1 } } },
    ]);
    await this.astrologers.updateOne({ _id: astrologerId }, { $set: { ratingAverage: agg?.avg ?? 0, ratingCount: agg?.count ?? 0 } });
  }

  /** The astrologer answers a review once; the reply is public. */
  async replyToReview(userId: string, id: string, text: string) {
    const c = await this.load(id);
    if (this.roleOf(c, userId) !== 'astrologer') throw new ForbiddenException('Only the astrologer can reply');
    if (!c.review?.rating) throw new BadRequestException('This consultation has no review yet');
    if (c.review.reply) throw new ConflictException('You have already replied');
    c.review.reply = text.trim();
    c.review.repliedAt = new Date();
    c.markModified('review');
    await c.save();
    return { replied: true };
  }

  /**
   * Public reviews of one astrologer with the rating breakdown and
   * the number of completed consultations in the last 7 days.
   * Reviewer names are shortened to an initial for privacy.
   */
  async astrologerReviews(astrologerId: string, q: AstrologerReviewsQuery) {
    if (!Types.ObjectId.isValid(astrologerId)) throw new NotFoundException('Astrologer not found');
    const aid = new Types.ObjectId(astrologerId);
    const page = q.page ?? 1;
    const limit = q.limit ?? 5;
    const base = { astrologerId: aid, 'review.rating': { $gte: 1 }, 'review.hidden': { $ne: true } };
    const filter =
      q.filter === 'all' ? base : q.filter === '5' ? { ...base, 'review.rating': 5 } : { ...base, 'review.comment': { $nin: [null, ''] } };
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const [rows, total, breakdownRows, week] = await Promise.all([
      this.consultations
        .find(filter)
        .sort({ 'review.createdAt': -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('userName mode review')
        .lean(),
      this.consultations.countDocuments(filter),
      this.consultations.aggregate([{ $match: base }, { $group: { _id: '$review.rating', n: { $sum: 1 } } }]),
      this.consultations.countDocuments({ astrologerId: aid, status: ConsultStatus.Completed, endedAt: { $gte: weekAgo } }),
    ]);

    const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    let sum = 0;
    let count = 0;
    for (const r of breakdownRows) {
      breakdown[String(r._id)] = r.n;
      sum += r._id * r.n;
      count += r.n;
    }
    return {
      summary: { average: count ? Math.round((sum / count) * 10) / 10 : 0, count, breakdown, consultationsLast7Days: week },
      items: rows.map((c) => {
        const first = (c.userName ?? '').trim().split(/\s+/)[0] ?? '';
        return {
          id: String(c._id),
          name: first ? `${first[0].toUpperCase()}…` : 'User',
          rating: c.review.rating,
          comment: c.review.comment ?? null,
          mode: c.mode,
          createdAt: c.review.createdAt,
          reply: c.review.reply ?? null,
          repliedAt: c.review.repliedAt ?? null,
        };
      }),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  // ---------- calls (provider added later) ----------

  async callToken(userId: string, id: string) {
    const c = await this.load(id);
    this.roleOf(c, userId);
    if (c.mode === ConsultMode.Chat) throw new BadRequestException('This is a chat consultation');
    if (!this.config.get<string>('agora.appId') || !this.config.get<string>('agora.appCertificate')) {
      throw new ServiceUnavailableException('Voice and video calls are not configured yet');
    }
    throw new ServiceUnavailableException('Call provider integration is pending');
  }

  // ---------- views ----------

  /**
   * Latest genuine reviews for the home page. Only the first name and last initial
   * of the reviewer are shown; reviews without a written comment are skipped.
   */
  async recentReviews(limit = 6) {
    const rows = await this.consultations
      .find({ 'review.rating': { $gte: 4 }, 'review.comment': { $nin: [null, ''] }, 'review.hidden': { $ne: true } })
      .sort({ 'review.createdAt': -1 })
      .limit(Math.min(Math.max(limit, 1), 20))
      .select('userName astrologerName mode review')
      .lean();
    return rows.map((c) => {
      const parts = (c.userName ?? '').trim().split(/\s+/).filter(Boolean);
      const name = parts.length ? `${parts[0]}${parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : ''}` : 'Verified user';
      return {
        name,
        rating: c.review.rating,
        comment: c.review.comment,
        astrologerName: c.astrologerName,
        mode: c.mode,
        createdAt: c.review.createdAt,
      };
    });
  }

  static toView(c: ConsultationDocument) {
    return {
      id: c.id as string,
      userId: String(c.userId),
      astrologerId: String(c.astrologerId),
      astrologerUserId: String(c.astrologerUserId),
      userName: c.userName,
      astrologerName: c.astrologerName,
      mode: c.mode,
      status: c.status,
      ratePerMin: c.ratePerMinPaise / 100,
      freeMinutes: c.freeMinutes,
      maxMinutes: c.maxMinutes,
      requestedAt: c.requestedAt,
      startedAt: c.startedAt ?? null,
      endedAt: c.endedAt ?? null,
      endReason: c.endReason ?? null,
      billedMinutes: c.billedMinutes,
      amount: c.amountPaise / 100,
      astrologerEarning: c.astrologerEarningPaise / 100,
      intake: c.intake ?? null,
      review: c.review?.rating ? { rating: c.review.rating, comment: c.review.comment, reply: c.review.reply ?? null } : null,
      channelName: c.channelName ?? null,
      prepaid: c.prepaid ?? false,
      bookingId: c.bookingId ? String(c.bookingId) : null,
    };
  }

  static messageView(m: ChatMessage & { _id: unknown; createdAt?: Date }, c: { _id: unknown }) {
    return {
      id: String(m._id),
      consultationId: String(c._id),
      sender: m.sender,
      text: m.text,
      clientId: m.clientId ?? null,
      createdAt: m.createdAt ?? new Date(),
    };
  }
}
