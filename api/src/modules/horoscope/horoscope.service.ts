import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { todayIn } from '../places/timezone.util';
import { UpsertHoroscopeDto } from './dto/horoscope.dto';
import { Horoscope } from './horoscope.schema';
import { Period, periodKey, SIGNS } from './signs';

const TZ = 'Asia/Kolkata';

@Injectable()
export class HoroscopeService {
  constructor(@InjectModel(Horoscope.name) private readonly horoscopes: Model<Horoscope>) {}

  signs() {
    return SIGNS;
  }

  /** All 12 signs for a period. Signs without published text come back with text null. */
  async all(period: Period = 'daily', lang: 'en' | 'hi' = 'en', date?: string) {
    const key = periodKey(period, date ?? todayIn(TZ));
    const rows = await this.horoscopes.find({ period, periodKey: key, lang, status: 'published' }).lean();
    const bySign = new Map(rows.map((r) => [r.sign, r]));
    return {
      period,
      periodKey: key,
      lang,
      items: SIGNS.map((s) => ({ sign: s, ...HoroscopeService.view(bySign.get(s.slug)) })),
    };
  }

  async one(sign: string, period: Period = 'daily', lang: 'en' | 'hi' = 'en', date?: string) {
    const meta = SIGNS.find((s) => s.slug === sign || s.rashi === sign);
    if (!meta) throw new NotFoundException('Unknown sign');
    const key = periodKey(period, date ?? todayIn(TZ));
    const row = await this.horoscopes.findOne({ sign: meta.slug, period, periodKey: key, lang, status: 'published' }).lean();
    return { sign: meta, period, periodKey: key, lang, ...HoroscopeService.view(row ?? undefined) };
  }

  /** Editor view: everything for a period, including drafts. */
  async editorList(period: Period, lang: 'en' | 'hi', date?: string) {
    const key = periodKey(period, date ?? todayIn(TZ));
    const rows = await this.horoscopes.find({ period, periodKey: key, lang }).lean();
    const bySign = new Map(rows.map((r) => [r.sign, r]));
    return {
      period,
      periodKey: key,
      lang,
      items: SIGNS.map((s) => {
        const r = bySign.get(s.slug);
        return { sign: s, status: r?.status ?? null, ...HoroscopeService.view(r) };
      }),
    };
  }

  async upsert(editorId: string, dto: UpsertHoroscopeDto) {
    const key = periodKey(dto.period, dto.date);
    const { date: _date, ...data } = dto;
    const row = await this.horoscopes.findOneAndUpdate(
      { sign: dto.sign, period: dto.period, periodKey: key, lang: dto.lang },
      { $set: { ...data, periodKey: key, status: dto.status ?? 'published', updatedBy: new Types.ObjectId(editorId) } },
      { upsert: true, new: true },
    );
    return { id: row.id, sign: row.sign, period: row.period, periodKey: row.periodKey, lang: row.lang, status: row.status };
  }

  static view(r?: Partial<Horoscope> & { updatedAt?: Date }) {
    return {
      text: r?.text ?? null,
      luckyNumber: r?.luckyNumber ?? null,
      luckyColor: r?.luckyColor ?? null,
      mantra: r?.mantra ?? null,
      remedy: r?.remedy ?? null,
      scores: r?.scores ?? null,
      updatedAt: r?.updatedAt ?? null,
    };
  }
}
