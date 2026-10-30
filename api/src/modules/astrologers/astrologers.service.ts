import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import slugify from 'slugify';
import { Role, User } from '../users/user.schema';
import { Astrologer, AstrologerDocument, AstrologerStatus, Presence } from './astrologer.schema';
import { ApplyAstrologerDto, ListAstrologersQuery, ReviewApplicationDto } from './dto/astrologer.dto';
import { Follow } from './follow.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@Injectable()
export class AstrologersService {
  constructor(
    @InjectModel(Astrologer.name) private readonly astrologers: Model<Astrologer>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Follow.name) private readonly follows: Model<Follow>,
  ) {}

  /** Live counts for the home page: totals, online now, per concern and per language. */
  async stats() {
    const [r] = await this.astrologers.aggregate([
      { $match: { status: AstrologerStatus.Approved } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          online: [{ $match: { presence: Presence.Online } }, { $count: 'n' }],
          women: [{ $match: { gender: 'female' } }, { $count: 'n' }],
          totals: [{ $group: { _id: null, consultations: { $sum: '$consultationCount' }, maxExperience: { $max: '$experienceYears' } } }],
          concerns: [{ $unwind: '$concerns' }, { $group: { _id: '$concerns', n: { $sum: 1 } } }],
          languages: [{ $unwind: '$languages' }, { $group: { _id: '$languages', n: { $sum: 1 } } }],
        },
      },
    ]);
    const count = (a: { n: number }[]) => a[0]?.n ?? 0;
    const map = (a: { _id: string; n: number }[]) => Object.fromEntries(a.map((x) => [x._id, x.n]));
    return {
      total: count(r.total),
      online: count(r.online),
      women: count(r.women),
      consultations: r.totals[0]?.consultations ?? 0,
      maxExperienceYears: r.totals[0]?.maxExperience ?? 0,
      byConcern: map(r.concerns),
      byLanguage: map(r.languages),
    };
  }

  async list(q: ListAstrologersQuery) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const filter: FilterQuery<Astrologer> = { status: AstrologerStatus.Approved };
    if (q.expertise?.length) filter.expertise = { $in: q.expertise };
    if (q.concern) filter.concerns = q.concern;
    if (q.languages?.length) filter.languages = { $in: q.languages };
    if (q.gender) filter.gender = q.gender;
    if (q.onlineOnly) filter.presence = Presence.Online;
    if (q.mode) filter[`rates.${q.mode}`] = { $gt: 0 };
    if (q.q) filter.displayName = { $regex: q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const priceField = `rates.${q.mode ?? 'chat'}`;
    const sorts: Record<string, Record<string, SortOrder>> = {
      // online first, then busy, then offline; within that admin weight and rating
      recommended: { presenceRank: 1, sortWeight: -1, ratingAverage: -1, consultationCount: -1 },
      rating: { ratingAverage: -1, ratingCount: -1 },
      experience: { experienceYears: -1 },
      'price-low': { [priceField]: 1 },
      'price-high': { [priceField]: -1 },
    };
    const sort = sorts[q.sort ?? 'recommended'];

    const [items, total] = await Promise.all([
      this.astrologers
        .aggregate([
          { $match: filter },
          {
            $addFields: {
              presenceRank: { $switch: { branches: [{ case: { $eq: ['$presence', 'online'] }, then: 0 }, { case: { $eq: ['$presence', 'busy'] }, then: 1 }], default: 2 } },
            },
          },
          { $sort: { ...sort, _id: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ])
        .exec(),
      this.astrologers.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => AstrologersService.toCard(a)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  // ---------- follow ----------

  private async approvedById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Astrologer not found');
    const a = await this.astrologers.findOne({ _id: id, status: AstrologerStatus.Approved }).select('_id followerCount');
    if (!a) throw new NotFoundException('Astrologer not found');
    return a;
  }

  async followStatus(userId: string, astrologerId: string) {
    const a = await this.approvedById(astrologerId);
    const following = await this.follows.exists({ userId: new Types.ObjectId(userId), astrologerId: a._id });
    return { following: Boolean(following), followerCount: a.followerCount };
  }

  async follow(userId: string, astrologerId: string) {
    const a = await this.approvedById(astrologerId);
    const r = await this.follows.updateOne(
      { userId: new Types.ObjectId(userId), astrologerId: a._id },
      { $setOnInsert: { userId: new Types.ObjectId(userId), astrologerId: a._id } },
      { upsert: true },
    );
    if (r.upsertedCount) await this.astrologers.updateOne({ _id: a._id }, { $inc: { followerCount: 1 } });
    return this.followStatus(userId, astrologerId);
  }

  async unfollow(userId: string, astrologerId: string) {
    const a = await this.approvedById(astrologerId);
    const r = await this.follows.deleteOne({ userId: new Types.ObjectId(userId), astrologerId: a._id });
    if (r.deletedCount) await this.astrologers.updateOne({ _id: a._id, followerCount: { $gt: 0 } }, { $inc: { followerCount: -1 } });
    return this.followStatus(userId, astrologerId);
  }

  async getBySlug(slug: string) {
    const a = await this.astrologers.findOne({ slug, status: AstrologerStatus.Approved }).lean();
    if (!a) throw new NotFoundException('Astrologer not found');
    return AstrologersService.toProfile(a);
  }

  async getMine(userId: string) {
    const a = await this.astrologers.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!a) throw new NotFoundException('No astrologer profile for this account');
    return { ...AstrologersService.toProfile(a), status: a.status, rejectionReason: a.rejectionReason, commissionPercent: a.commissionPercent };
  }

  async apply(userId: string, dto: ApplyAstrologerDto) {
    const existing = await this.astrologers.findOne({ userId: new Types.ObjectId(userId) });
    if (existing && existing.status !== AstrologerStatus.Rejected) {
      throw new ConflictException(`You already have an application (${existing.status})`);
    }
    const data = { ...dto, rates: { ...dto.rates, video: dto.rates.video ?? 0 }, status: AstrologerStatus.Pending, rejectionReason: undefined };
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      return { id: existing.id, status: existing.status };
    }
    const slug = await this.uniqueSlug(dto.displayName);
    const created = await this.astrologers.create({ ...data, userId: new Types.ObjectId(userId), slug, badges: ['new'] });
    return { id: created.id, status: created.status };
  }

  async listApplications(status: AstrologerStatus = AstrologerStatus.Pending) {
    return this.astrologers.find({ status }).sort({ createdAt: 1 }).lean();
  }

  async review(id: string, dto: ReviewApplicationDto) {
    const a = await this.astrologers.findById(id);
    if (!a) throw new NotFoundException('Application not found');
    if (dto.decision === 'reject') {
      if (!dto.reason) throw new BadRequestException('A reason is required when rejecting');
      a.status = AstrologerStatus.Rejected;
      a.rejectionReason = dto.reason;
    } else {
      a.status = AstrologerStatus.Approved;
      a.rejectionReason = undefined;
      if (dto.commissionPercent !== undefined) a.commissionPercent = dto.commissionPercent;
      if (!a.code) a.code = await this.nextCode();
      await this.users.updateOne({ _id: a.userId }, { $addToSet: { roles: Role.Astrologer } });
      JwtAuthGuard.forget(String(a.userId));
    }
    await a.save();
    return { id: a.id, status: a.status, code: a.code };
  }

  async setPresence(userId: string, presence: Presence) {
    const a = await this.astrologers.findOne({ userId: new Types.ObjectId(userId) });
    if (!a || a.status !== AstrologerStatus.Approved) throw new BadRequestException('Only approved astrologers can go online');
    a.presence = presence;
    if (presence === Presence.Online) a.lastOnlineAt = new Date();
    await a.save();
    return { presence: a.presence };
  }

  async findApprovedById(id: string): Promise<AstrologerDocument> {
    const a = await this.astrologers.findOne({ _id: id, status: AstrologerStatus.Approved });
    if (!a) throw new NotFoundException('Astrologer not found');
    return a;
  }

  private async uniqueSlug(name: string) {
    const base = slugify(name, { lower: true, strict: true }) || 'astrologer';
    let slug = base;
    for (let i = 2; await this.astrologers.exists({ slug }); i++) slug = `${base}-${i}`;
    return slug;
  }

  private async nextCode() {
    const count = await this.astrologers.countDocuments({ code: { $exists: true } });
    return `KJ${1001 + count}`;
  }

  /** Compact shape for listing cards. */
  static toCard(a: Astrologer & { _id: unknown }) {
    return {
      id: String(a._id),
      slug: a.slug,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl ?? null,
      gender: a.gender,
      expertise: a.expertise,
      languages: a.languages,
      experienceYears: a.experienceYears,
      rates: a.rates,
      badges: a.badges,
      presence: a.presence,
      rating: { average: Math.round(a.ratingAverage * 10) / 10, count: a.ratingCount },
      consultationCount: a.consultationCount,
    };
  }

  /** Full public profile. */
  static toProfile(a: Astrologer & { _id: unknown }) {
    return {
      ...AstrologersService.toCard(a),
      code: a.code,
      bioEn: a.bioEn,
      bioHi: a.bioHi,
      concerns: a.concerns,
      qualifications: a.qualifications,
      followerCount: a.followerCount,
      lastOnlineAt: a.lastOnlineAt,
      verified: a.status === AstrologerStatus.Approved,
    };
  }
}
