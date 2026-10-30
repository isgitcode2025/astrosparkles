import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Astrologer, AstrologerStatus, Presence } from '../astrologers/astrologer.schema';
import { Booking, BookingStatus } from '../consultations/booking.schema';
import { Consultation, ConsultationDocument, ConsultStatus } from '../consultations/consultation.schemas';
import { ConsultationEvents } from '../consultations/consultation.events';
import { ConsultationsService } from '../consultations/consultations.service';
import { Gift } from '../gifts/gift.schema';
import { Subscriber } from '../newsletter/newsletter.module';
import { OrderStatus, ShopOrder } from '../shop/shop.schemas';
import { Role, User } from '../users/user.schema';
import { PaymentOrder, PaymentStatus, TxnReason, WalletTransaction } from '../wallet/wallet.schemas';
import { WalletService } from '../wallet/wallet.service';
import {
  AdminAstrologersQuery,
  AdminBookingsQuery,
  AdminConsultationsQuery,
  AdminPaymentsQuery,
  AdminReviewsQuery,
  AdminTxnQuery,
  AdminUpdateAstrologerDto,
  AdminUpdateUserDto,
  AdminUsersQuery,
  PageQuery,
  WalletAdjustDto,
} from './admin.dto';

const TZ = 'Asia/Kolkata';
const rupees = (paise: number) => Math.round(paise) / 100;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Midnight today in IST, as a UTC instant. */
function startOfTodayIst() {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 330 * 60_000);
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Astrologer.name) private readonly astrologers: Model<Astrologer>,
    @InjectModel(Consultation.name) private readonly consultations: Model<Consultation>,
    @InjectModel(PaymentOrder.name) private readonly payments: Model<PaymentOrder>,
    @InjectModel(WalletTransaction.name) private readonly txns: Model<WalletTransaction>,
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Gift.name) private readonly gifts: Model<Gift>,
    @InjectModel(ShopOrder.name) private readonly orders: Model<ShopOrder>,
    @InjectModel(Subscriber.name) private readonly subscribers: Model<Subscriber>,
    private readonly wallet: WalletService,
    private readonly consult: ConsultationsService,
    private readonly events: ConsultationEvents,
  ) {}

  private paging(q: PageQuery) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    return { page, limit, skip: (page - 1) * limit };
  }

  private async paged<T>(model: Model<T>, filter: FilterQuery<T>, q: PageQuery, sort: Record<string, 1 | -1>, map: (d: any) => unknown) {
    const { page, limit, skip } = this.paging(q);
    const [rows, total] = await Promise.all([model.find(filter).sort(sort).skip(skip).limit(limit).lean(), model.countDocuments(filter)]);
    return { items: rows.map(map), page, limit, total, hasMore: skip + rows.length < total };
  }

  // ---------- overview ----------

  async overview() {
    const today = startOfTodayIst();
    const since = new Date(today.getTime() - 13 * 86_400_000);
    const sum = async <T>(model: Model<T>, match: FilterQuery<T>, field: string, minus?: string) => {
      const [r] = await model.aggregate([
        { $match: match },
        { $group: { _id: null, n: { $sum: 1 }, total: { $sum: minus ? { $subtract: [`$${field}`, `$${minus}`] } : `$${field}` } } },
      ]);
      return { count: r?.n ?? 0, paise: r?.total ?? 0 };
    };
    const done = { status: ConsultStatus.Completed };
    const [
      usersTotal,
      usersToday,
      astro,
      online,
      consultAll,
      consultToday,
      shareAll,
      shareToday,
      rechargeAll,
      rechargeToday,
      shopAll,
      giftAll,
      upcomingBookings,
      subscribers,
      openPoojas,
      daily,
    ] = await Promise.all([
      this.users.countDocuments({}),
      this.users.countDocuments({ createdAt: { $gte: today } }),
      this.astrologers.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      this.astrologers.countDocuments({ status: AstrologerStatus.Approved, presence: { $in: [Presence.Online, Presence.Busy] } }),
      sum(this.consultations, done, 'amountPaise'),
      sum(this.consultations, { ...done, endedAt: { $gte: today } }, 'amountPaise'),
      sum(this.consultations, done, 'amountPaise', 'astrologerEarningPaise'),
      sum(this.consultations, { ...done, endedAt: { $gte: today } }, 'amountPaise', 'astrologerEarningPaise'),
      sum(this.payments, { status: PaymentStatus.Paid }, 'rechargePaise'),
      sum(this.payments, { status: PaymentStatus.Paid, paidAt: { $gte: today } }, 'rechargePaise'),
      sum(this.orders, { status: OrderStatus.Paid }, 'amountPaise'),
      sum(this.gifts, {}, 'amountPaise'),
      this.bookings.countDocuments({ status: BookingStatus.Confirmed, end: { $gt: new Date() } }),
      this.subscribers.countDocuments({ active: true }),
      this.orders.countDocuments({ status: OrderStatus.Paid, type: 'pooja', 'pooja.status': 'scheduled' }),
      this.dailySeries(since),
    ]);
    const byStatus = Object.fromEntries(astro.map((a: { _id: string; n: number }) => [a._id, a.n]));
    return {
      users: { total: usersTotal, today: usersToday },
      astrologers: {
        approved: byStatus.approved ?? 0,
        pending: byStatus.pending ?? 0,
        suspended: byStatus.suspended ?? 0,
        rejected: byStatus.rejected ?? 0,
        onlineNow: online,
      },
      consultations: {
        completed: consultAll.count,
        completedToday: consultToday.count,
        gross: rupees(consultAll.paise),
        grossToday: rupees(consultToday.paise),
        platformShare: rupees(shareAll.paise),
        platformShareToday: rupees(shareToday.paise),
      },
      recharges: { count: rechargeAll.count, total: rupees(rechargeAll.paise), today: rupees(rechargeToday.paise), countToday: rechargeToday.count },
      shop: { paidOrders: shopAll.count, revenue: rupees(shopAll.paise), poojasToPerform: openPoojas },
      gifts: { count: giftAll.count, total: rupees(giftAll.paise) },
      upcomingBookings,
      subscribers,
      daily,
    };
  }

  /** Per-day IST totals for the last 14 days: recharges, consultation billing, shop sales. */
  private async dailySeries(since: Date) {
    const day = (field: string) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TZ } });
    const group = async <T>(model: Model<T>, match: FilterQuery<T>, dateField: string, amount: string) => {
      const rows = await model.aggregate([
        { $match: { ...match, [dateField]: { $gte: since } } },
        { $group: { _id: day(dateField), total: { $sum: `$${amount}` }, n: { $sum: 1 } } },
      ]);
      return new Map(rows.map((r: { _id: string; total: number; n: number }) => [r._id, r]));
    };
    const [rech, cons, shop] = await Promise.all([
      group(this.payments, { status: PaymentStatus.Paid }, 'paidAt', 'rechargePaise'),
      group(this.consultations, { status: ConsultStatus.Completed }, 'endedAt', 'amountPaise'),
      group(this.orders, { status: OrderStatus.Paid }, 'createdAt', 'amountPaise'),
    ]);
    const out = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 86_400_000 + 330 * 60_000).toISOString().slice(0, 10);
      out.push({
        date: d,
        recharges: rupees(rech.get(d)?.total ?? 0),
        consultations: rupees(cons.get(d)?.total ?? 0),
        sessions: cons.get(d)?.n ?? 0,
        shop: rupees(shop.get(d)?.total ?? 0),
      });
    }
    return out;
  }

  // ---------- users ----------

  async listUsers(q: AdminUsersQuery) {
    const filter: FilterQuery<User> = {};
    if (q.role) filter.roles = q.role;
    if (q.status) filter.status = q.status;
    if (q.q) {
      const rx = new RegExp(escape(q.q.trim()), 'i');
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }
    return this.paged(this.users, filter, q, { createdAt: -1 }, (u) => ({
      id: String(u._id),
      name: u.name ?? null,
      phone: u.phone ?? null,
      email: u.email ?? null,
      roles: u.roles,
      status: u.status,
      balance: rupees(u.walletBalancePaise ?? 0),
      freeConsultationUsed: !!u.freeConsultationUsed,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt ?? null,
    }));
  }

  async updateUser(adminId: string, id: string, dto: AdminUpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException('User not found');
    if (id === adminId && (dto.status === 'blocked' || (dto.staffRoles && !dto.staffRoles.includes('admin')))) {
      throw new BadRequestException('You cannot block yourself or remove your own admin role');
    }
    if (dto.status) u.status = dto.status;
    if (dto.staffRoles) {
      const keep = u.roles.filter((r) => r !== Role.Admin && r !== Role.Editor);
      u.roles = [...new Set([...keep, ...(dto.staffRoles as Role[])])];
    }
    await u.save();
    JwtAuthGuard.forget(id);
    if (dto.status === 'blocked') this.events.emitEvent('user.signedOut', { userId: id, reason: 'blocked' });
    return { id: u.id as string, status: u.status, roles: u.roles };
  }

  async adjustWallet(id: string, dto: WalletAdjustDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const paise = Math.round(dto.amount * 100);
    if (paise === 0) throw new BadRequestException('Amount cannot be zero');
    const meta = { description: `Admin adjustment: ${dto.note}`, refType: 'admin' };
    const t = paise > 0 ? await this.wallet.credit(id, paise, TxnReason.Adjustment, meta) : await this.wallet.debit(id, -paise, TxnReason.Adjustment, meta);
    return { balance: rupees(t?.balanceAfterPaise ?? 0) };
  }

  // ---------- astrologers ----------

  async listAstrologers(q: AdminAstrologersQuery) {
    const filter: FilterQuery<Astrologer> = {};
    if (q.status) filter.status = q.status;
    if (q.q) {
      const rx = new RegExp(escape(q.q.trim()), 'i');
      filter.$or = [{ displayName: rx }, { code: rx }, { slug: rx }];
    }
    const res = await this.paged(this.astrologers, filter, q, { createdAt: -1 }, (a) => a);
    const phones = new Map(
      (await this.users.find({ _id: { $in: res.items.map((a: any) => a.userId) } }).select('phone').lean()).map((u) => [String(u._id), u.phone]),
    );
    return {
      ...res,
      items: res.items.map((a: any) => ({
        id: String(a._id),
        userId: String(a.userId),
        phone: phones.get(String(a.userId)) ?? null,
        displayName: a.displayName,
        slug: a.slug,
        code: a.code ?? null,
        avatarUrl: a.avatarUrl ?? null,
        status: a.status,
        presence: a.presence,
        gender: a.gender ?? null,
        expertise: a.expertise,
        languages: a.languages,
        experienceYears: a.experienceYears,
        rates: a.rates,
        commissionPercent: a.commissionPercent,
        badges: a.badges,
        sortWeight: a.sortWeight,
        rating: { average: Math.round((a.ratingAverage ?? 0) * 10) / 10, count: a.ratingCount ?? 0 },
        consultationCount: a.consultationCount ?? 0,
        bioEn: a.bioEn,
        qualifications: a.qualifications,
        rejectionReason: a.rejectionReason ?? null,
        scheduleEnabled: !!a.schedule?.enabled,
        createdAt: a.createdAt,
      })),
    };
  }

  async updateAstrologer(id: string, dto: AdminUpdateAstrologerDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Astrologer not found');
    const a = await this.astrologers.findById(id);
    if (!a) throw new NotFoundException('Astrologer not found');
    if (dto.status) {
      if (a.status === AstrologerStatus.Pending || a.status === AstrologerStatus.Rejected) {
        throw new BadRequestException('Use the application review to approve or reject new applications');
      }
      a.status = dto.status;
      if (dto.status === AstrologerStatus.Suspended) a.presence = Presence.Offline;
    }
    if (dto.commissionPercent !== undefined) a.commissionPercent = dto.commissionPercent;
    if (dto.badges) a.badges = dto.badges;
    if (dto.sortWeight !== undefined) a.sortWeight = dto.sortWeight;
    await a.save();
    return { id: a.id as string, status: a.status, commissionPercent: a.commissionPercent, badges: a.badges, sortWeight: a.sortWeight };
  }

  // ---------- activity ----------

  listConsultations(q: AdminConsultationsQuery) {
    return this.paged(this.consultations, q.status ? { status: q.status } : {}, q, { requestedAt: -1 }, (c) => ({
      id: String(c._id),
      userName: c.userName ?? null,
      astrologerName: c.astrologerName,
      mode: c.mode,
      status: c.status,
      prepaid: !!c.prepaid,
      requestedAt: c.requestedAt,
      startedAt: c.startedAt ?? null,
      endedAt: c.endedAt ?? null,
      endReason: c.endReason ?? null,
      billedMinutes: c.billedMinutes ?? 0,
      freeMinutes: c.freeMinutes ?? 0,
      amount: rupees(c.amountPaise ?? 0),
      astrologerEarning: rupees(c.astrologerEarningPaise ?? 0),
      platformShare: rupees((c.amountPaise ?? 0) - (c.astrologerEarningPaise ?? 0)),
      rating: c.review?.rating ?? null,
    }));
  }

  async listPayments(q: AdminPaymentsQuery) {
    const res = await this.paged(this.payments, q.status ? { status: q.status } : {}, q, { createdAt: -1 }, (p) => p);
    const users = await this.userNames(res.items.map((p: any) => p.userId));
    return {
      ...res,
      items: res.items.map((p: any) => ({
        id: String(p._id),
        user: users.get(String(p.userId)) ?? null,
        gatewayOrderId: p.gatewayOrderId,
        gatewayPaymentId: p.gatewayPaymentId ?? null,
        mock: !!p.mock,
        status: p.status,
        recharge: rupees(p.rechargePaise),
        bonus: rupees(p.bonusPaise ?? 0),
        gst: rupees(p.gstPaise ?? 0),
        total: rupees(p.totalPaise),
        createdAt: p.createdAt,
        paidAt: p.paidAt ?? null,
        failureReason: p.failureReason ?? null,
      })),
    };
  }

  async listTransactions(q: AdminTxnQuery) {
    const filter: FilterQuery<WalletTransaction> = {};
    if (q.userId) {
      if (!Types.ObjectId.isValid(q.userId)) throw new BadRequestException('Invalid user id');
      filter.userId = new Types.ObjectId(q.userId);
    }
    const res = await this.paged(this.txns, filter, q, { createdAt: -1, _id: -1 }, (t) => t);
    const users = await this.userNames(res.items.map((t: any) => t.userId));
    return {
      ...res,
      items: res.items.map((t: any) => ({
        id: String(t._id),
        user: users.get(String(t.userId)) ?? null,
        type: t.type,
        amount: rupees(t.amountPaise),
        balanceAfter: rupees(t.balanceAfterPaise),
        reason: t.reason,
        description: t.description ?? null,
        createdAt: t.createdAt,
      })),
    };
  }

  listBookings(q: AdminBookingsQuery) {
    return this.paged(this.bookings, q.status ? { status: q.status } : {}, q, { start: -1 }, (b) => ({
      id: String(b._id),
      userName: b.userName ?? null,
      astrologerName: b.astrologerName,
      start: b.start,
      end: b.end,
      minutes: b.minutes,
      amount: rupees(b.amountPaise),
      status: b.status,
      cancelledBy: b.cancelledBy ?? null,
      refunded: rupees(b.refundedPaise ?? 0),
      topic: b.topic ?? null,
      createdAt: b.createdAt,
    }));
  }

  listReviews(q: AdminReviewsQuery) {
    const filter: FilterQuery<Consultation> = { 'review.rating': { $gte: 1 } };
    if (q.filter === 'hidden') filter['review.hidden'] = true;
    if (q.filter === 'low') filter['review.rating'] = { $gte: 1, $lte: 2 };
    return this.paged(this.consultations, filter, q, { 'review.createdAt': -1 }, (c) => ({
      consultationId: String(c._id),
      userName: c.userName ?? null,
      astrologerName: c.astrologerName,
      rating: c.review.rating,
      comment: c.review.comment ?? null,
      reply: c.review.reply ?? null,
      hidden: !!c.review.hidden,
      createdAt: c.review.createdAt,
    }));
  }

  async hideReview(consultationId: string, hidden: boolean) {
    if (!Types.ObjectId.isValid(consultationId)) throw new NotFoundException('Review not found');
    const c = (await this.consultations.findOne({ _id: consultationId, 'review.rating': { $gte: 1 } })) as ConsultationDocument | null;
    if (!c) throw new NotFoundException('Review not found');
    c.review.hidden = hidden;
    c.markModified('review');
    await c.save();
    await this.consult.recomputeRating(c.astrologerId);
    return { consultationId, hidden };
  }

  listSubscribers(q: PageQuery) {
    return this.paged(this.subscribers, {}, q, { createdAt: -1 }, (s) => ({
      id: String(s._id),
      email: s.email,
      lang: s.lang,
      source: s.source,
      active: s.active,
      createdAt: s.createdAt,
    }));
  }

  private async userNames(ids: Types.ObjectId[]) {
    const rows = await this.users.find({ _id: { $in: ids } }).select('name phone').lean();
    return new Map(rows.map((u) => [String(u._id), { id: String(u._id), name: u.name ?? null, phone: u.phone ?? null }]));
  }
}
