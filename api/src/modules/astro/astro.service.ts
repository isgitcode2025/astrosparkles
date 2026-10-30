import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Place, PlacesService } from '../places/places.service';
import { todayIn, utcOffsetHours } from '../places/timezone.util';
import { BirthInputDto } from './dto/astro.dto';
import { normaliseMatching, normalisePanchang } from './daily.normalize';
import { normaliseDasha, normaliseMangal, normalisePlanets, summary } from './kundli.normalize';
import { NavamshaClient, ProviderValidationError } from './navamsha.client';

/** The request body Navamsha's Vedic routes take. */
export interface ProviderBirth {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  latitude: number;
  longitude: number;
  timezone: number; // UTC offset in hours
  settings: { ayanamsha: string };
}

type Section<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

/** Provider field names for the two people in compatibility routes are tried in this order. */
const PAIR_SHAPES: [string, string][] = [
  ['bride', 'groom'],
  ['female', 'male'],
  ['girl', 'boy'],
  ['person_a', 'person_b'],
  ['person1', 'person2'],
];

@Injectable()
export class AstroService {
  private readonly logger = new Logger('Astro');
  private pairShape: [string, string] | null = null;

  constructor(
    private readonly provider: NavamshaClient,
    private readonly places: PlacesService,
    private readonly config: ConfigService,
  ) {}

  // ---------- input handling ----------

  resolvePlace(input: { placeId?: string; latitude?: number; longitude?: number; timezone?: string; placeName?: string }) {
    if (input.placeId) {
      const p = this.places.getById(input.placeId);
      return { latitude: p.latitude, longitude: p.longitude, timezone: p.timezone, label: p.label };
    }
    if (input.latitude === undefined || input.longitude === undefined || !input.timezone) {
      throw new BadRequestException('Birth place is required');
    }
    try {
      utcOffsetHours(input.timezone, 2000, 1, 1);
    } catch {
      throw new BadRequestException('Unknown time zone');
    }
    return { latitude: input.latitude, longitude: input.longitude, timezone: input.timezone, label: input.placeName ?? '' };
  }

  toProviderBirth(input: BirthInputDto): { body: ProviderBirth; place: ReturnType<AstroService['resolvePlace']> } {
    const place = this.resolvePlace(input);
    const [year, month, date] = input.dateOfBirth.split('-').map(Number);
    const [hours, minutes] = input.timeOfBirth.split(':').map(Number);
    const check = new Date(Date.UTC(year, month - 1, date));
    if (check.getUTCMonth() !== month - 1 || year < 1800 || year > 2100) throw new BadRequestException('Invalid date of birth');
    return {
      place,
      body: {
        year,
        month,
        date,
        hours,
        minutes,
        seconds: 0,
        latitude: Math.round(place.latitude * 10000) / 10000,
        longitude: Math.round(place.longitude * 10000) / 10000,
        timezone: utcOffsetHours(place.timezone, year, month, date, hours, minutes),
        settings: { ayanamsha: this.config.get<string>('astrologyApi.ayanamsha') ?? 'lahiri' },
      },
    };
  }

  private async section<T>(fn: () => Promise<T>): Promise<Section<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  // ---------- features ----------

  /**
   * Free kundli. Uses 4 provider calls (cached); charts (D1 and D9) are drawn by our own
   * website/app/PDF from the planet positions, so they are clean and match the brand.
   */
  async kundli(input: BirthInputDto) {
    const { body, place } = this.toProviderBirth(input);
    const [basic, planets, dasha, mangal] = await Promise.all([
      this.section(() => this.provider.post('/kundali/basic', { ...body })),
      this.section(() => this.provider.post('/planets', { ...body })),
      this.section(() => this.provider.post('/dasha/vimshottari', { ...body })),
      this.section(() => this.provider.post('/dosha/mangal', { ...body })),
    ]);
    if (!basic.ok && !planets.ok) throw new BadRequestException((basic as { error: string }).error);

    const { ascendant, planets: grahas } = normalisePlanets(
      planets.ok ? (planets as { data: unknown }).data : null,
      basic.ok ? (basic as { data: unknown }).data : null,
    );
    if (!ascendant || grahas.length === 0) throw new BadRequestException('Could not read the birth chart. Please try again.');

    return {
      input: {
        name: input.name ?? null,
        gender: input.gender ?? null,
        dateOfBirth: input.dateOfBirth,
        timeOfBirth: input.timeOfBirth,
        place: place.label,
        latitude: body.latitude,
        longitude: body.longitude,
        timezone: place.timezone,
        utcOffset: body.timezone,
        ayanamsha: body.settings.ayanamsha,
      },
      summary: summary(ascendant, grahas),
      ascendant,
      planets: grahas,
      dasha: dasha.ok ? normaliseDasha((dasha as { data: unknown }).data) : null,
      mangalDosha: mangal.ok ? normaliseMangal((mangal as { data: unknown }).data) : null,
    };
  }

  async mangalDosha(input: BirthInputDto) {
    const { body } = this.toProviderBirth(input);
    return this.provider.post('/dosha/mangal', { ...body });
  }

  /** Ashtakoot (36 guna) matching. The provider's field names for the pair are discovered once and remembered. */
  async matching(boy: BirthInputDto, girl: BirthInputDto) {
    const b = this.toProviderBirth(boy);
    const g = this.toProviderBirth(girl);
    const shapes = this.pairShape ? [this.pairShape] : PAIR_SHAPES;
    let lastError: unknown = null;
    for (const [femaleKey, maleKey] of shapes) {
      try {
        const out = await this.provider.post('/compatibility/ashtakoot', { [femaleKey]: g.body, [maleKey]: b.body });
        this.pairShape = [femaleKey, maleKey];
        const [boyMangal, girlMangal] = await Promise.all([
          this.section(() => this.provider.post('/dosha/mangal', { ...b.body }).then(normaliseMangal)),
          this.section(() => this.provider.post('/dosha/mangal', { ...g.body }).then(normaliseMangal)),
        ]);
        const m = normaliseMatching(out as Record<string, unknown>, femaleKey, maleKey);
        return {
          ...m,
          boy: { name: boy.name ?? null, place: b.place.label, ...m.boy },
          girl: { name: girl.name ?? null, place: g.place.label, ...m.girl },
          mangalDosha: {
            boy: boyMangal.ok ? (boyMangal as { data: ReturnType<typeof normaliseMangal> }).data : null,
            girl: girlMangal.ok ? (girlMangal as { data: ReturnType<typeof normaliseMangal> }).data : null,
          },
        };
      } catch (e) {
        if (!(e instanceof ProviderValidationError)) throw e;
        lastError = e.detail;
      }
    }
    this.logger.error(`ashtakoot request shape not accepted: ${JSON.stringify(lastError).slice(0, 400)}`);
    throw new BadRequestException('Kundli matching is temporarily unavailable');
  }

  async panchang(dateStr?: string, placeId?: string) {
    const place: Place = placeId ? this.places.getById(placeId) : this.places.search('new delhi')[0];
    const date = dateStr ?? todayIn(place.timezone);
    const [year, month, day] = date.split('-').map(Number);
    const body = {
      year,
      month,
      date: day,
      hours: 6,
      minutes: 0,
      seconds: 0,
      latitude: Math.round(place.latitude * 10000) / 10000,
      longitude: Math.round(place.longitude * 10000) / 10000,
      timezone: utcOffsetHours(place.timezone, year, month, day, 6, 0),
      settings: { ayanamsha: this.config.get<string>('astrologyApi.ayanamsha') ?? 'lahiri' },
    };
    const [full, choghadiya, inauspicious, abhijit] = await Promise.all([
      this.section(() => this.provider.post('/panchang/full', body)),
      this.section(() => this.provider.post('/panchang/choghadiya', body)),
      this.section(() => this.provider.post('/panchang/inauspicious-periods', body)),
      this.section(() => this.provider.post('/panchang/abhijit-muhurat', body)),
    ]);
    if (!full.ok) throw new BadRequestException((full as { error: string }).error);
    const data = <T>(sec: { ok: boolean }) => (sec.ok ? (sec as unknown as { data: T }).data : null);
    return {
      date,
      place: { id: place.id, label: place.label, timezone: place.timezone },
      ...normalisePanchang(
        data<Record<string, unknown>>(full) as Record<string, unknown>,
        data<Record<string, unknown>>(choghadiya),
        data<Record<string, unknown>>(inauspicious),
        data<Record<string, unknown>>(abhijit),
        place.timezone,
      ),
    };
  }

  // ---------- helpers for loosely-typed provider output ----------

  static svgOnly(out: unknown): string {
    const s = typeof out === 'string' ? out : (AstroService.findString(out, ['svg', 'svg_code', 'chart', 'code']) ?? '');
    if (!s.trim().startsWith('<svg')) throw new Error('Chart image not available');
    return s;
  }

  /** Depth-first search for the first value under any of the given keys. */
  static find(obj: unknown, keys: string[], depth = 0): unknown {
    if (!obj || typeof obj !== 'object' || depth > 6) return undefined;
    const rec = obj as Record<string, unknown>;
    for (const k of Object.keys(rec)) if (keys.includes(k.toLowerCase())) return rec[k];
    for (const v of Object.values(rec)) {
      const hit = AstroService.find(v, keys, depth + 1);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }

  static findString(obj: unknown, keys: string[]): string | undefined {
    const v = AstroService.find(obj, keys);
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const name = AstroService.find(v, ['name', 'sign', 'sign_name', 'rashi']);
      if (typeof name === 'string') return name;
    }
    return undefined;
  }

  static findNumber(obj: unknown, keys: string[]): number | null {
    const v = AstroService.find(obj, keys);
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
    return null;
  }

  /** Best-effort headline facts; the full provider output is always returned alongside. */
  static summarise(basic: unknown, planets: unknown) {
    const src = { basic, planets };
    return {
      ascendant: AstroService.findString(src, ['ascendant', 'lagna', 'ascendant_sign', 'lagna_sign']) ?? null,
      moonSign: AstroService.findString(src, ['moon_sign', 'rashi', 'chandra_rashi', 'moonsign']) ?? AstroService.findString(src, ['moon']) ?? null,
      sunSign: AstroService.findString(src, ['sun_sign', 'surya_rashi']) ?? AstroService.findString(src, ['sun']) ?? null,
      nakshatra: AstroService.findString(src, ['nakshatra', 'moon_nakshatra', 'janma_nakshatra']) ?? null,
    };
  }
}
