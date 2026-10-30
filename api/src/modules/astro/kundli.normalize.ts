/**
 * Turns Navamsha's kundli output into a clean, stable shape for web, mobile and PDF.
 *
 * Provider shape (per body/point, keyed by name, e.g. "Sun", "Ascendant"):
 *   current_sign 1-12, fullDegree 0-360 (sidereal), normDegree 0-30, isRetro "true"/"false",
 *   house_number, zodiac_sign_name, zodiac_sign_lord, nakshatra_name, nakshatra_pada,
 *   nakshatra_vimsottari_lord
 */

export const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const SIGN_NAMES_HI = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'];

/** The nine grahas in traditional order, with chart abbreviations. Outer planets are not used in Vedic charts. */
export const GRAHAS = [
  { name: 'Sun', abbr: 'Su', hi: 'सूर्य' },
  { name: 'Moon', abbr: 'Mo', hi: 'चंद्र' },
  { name: 'Mars', abbr: 'Ma', hi: 'मंगल' },
  { name: 'Mercury', abbr: 'Me', hi: 'बुध' },
  { name: 'Jupiter', abbr: 'Ju', hi: 'गुरु' },
  { name: 'Venus', abbr: 'Ve', hi: 'शुक्र' },
  { name: 'Saturn', abbr: 'Sa', hi: 'शनि' },
  { name: 'Rahu', abbr: 'Ra', hi: 'राहु' },
  { name: 'Ketu', abbr: 'Ke', hi: 'केतु' },
];

export interface ChartPoint {
  name: string;
  abbr: string;
  nameHi: string;
  sign: number; // 1-12
  signName: string;
  fullDegree: number;
  degreeInSign: number;
  dms: string; // 23°12'01"
  house: number;
  retro: boolean;
  nakshatra: string | null;
  pada: number | null;
  signLord: string | null;
  nakshatraLord: string | null;
  navamsaSign: number; // D9 sign 1-12
}

type Raw = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

export function dms(deg: number) {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d}°${pad(m)}'${pad(s === 60 ? 59 : s)}"`;
}

/** Navamsa (D9): each sign is split into nine parts of 3°20′, counted continuously from Aries. */
export function navamsaSign(fullDegree: number) {
  return (Math.floor(fullDegree / (30 / 9)) % 12) + 1;
}

function point(name: string, raw: Raw | undefined, ascSign: number | null): ChartPoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const full = num(raw.fullDegree) ?? num(raw.full_degree) ?? num(raw.longitude);
  const sign = num(raw.current_sign) ?? num(raw.sign) ?? (full !== null ? Math.floor(full / 30) + 1 : null);
  if (sign === null || full === null) return null;
  const inSign = num(raw.normDegree) ?? full - (sign - 1) * 30;
  const g = GRAHAS.find((x) => x.name === name);
  const house = num(raw.house_number) ?? (ascSign ? ((sign - ascSign + 12) % 12) + 1 : 0);
  return {
    name,
    abbr: g?.abbr ?? (name === 'Ascendant' ? 'Asc' : name.slice(0, 2)),
    nameHi: g?.hi ?? (name === 'Ascendant' ? 'लग्न' : name),
    sign,
    signName: str(raw.zodiac_sign_name) ?? SIGN_NAMES[sign - 1],
    fullDegree: full,
    degreeInSign: inSign,
    dms: dms(inSign),
    house,
    retro: raw.isRetro === true || raw.isRetro === 'true' || raw.retrograde === true,
    nakshatra: str(raw.nakshatra_name),
    pada: num(raw.nakshatra_pada),
    signLord: str(raw.zodiac_sign_lord),
    nakshatraLord: str(raw.nakshatra_vimsottari_lord),
    navamsaSign: navamsaSign(full),
  };
}

/** Accepts the /planets output (object keyed by name, includes Ascendant) or /kundali/basic ({ ascendant, planets }). */
export function normalisePlanets(planetsOut: unknown, basicOut: unknown) {
  const p = (planetsOut && typeof planetsOut === 'object' ? planetsOut : {}) as Raw;
  const b = (basicOut && typeof basicOut === 'object' ? basicOut : {}) as Raw;
  const bPlanets = (b.planets && typeof b.planets === 'object' ? b.planets : {}) as Raw;

  const ascRaw = (p.Ascendant ?? b.ascendant) as Raw | undefined;
  const asc = point('Ascendant', ascRaw, null);
  const ascSign = asc?.sign ?? null;

  const planets = GRAHAS.map((g) => point(g.name, (p[g.name] ?? bPlanets[g.name]) as Raw | undefined, ascSign)).filter(
    (x): x is ChartPoint => x !== null,
  );
  return { ascendant: asc, planets };
}

export function summary(asc: ChartPoint | null, planets: ChartPoint[]) {
  const moon = planets.find((x) => x.name === 'Moon');
  const sun = planets.find((x) => x.name === 'Sun');
  return {
    ascendant: asc?.signName ?? null,
    ascendantSign: asc?.sign ?? null,
    moonSign: moon?.signName ?? null,
    moonSignHi: moon ? SIGN_NAMES_HI[moon.sign - 1] : null,
    sunSign: sun?.signName ?? null,
    nakshatra: moon?.nakshatra ?? null,
    nakshatraPada: moon?.pada ?? null,
    nakshatraLord: moon?.nakshatraLord ?? null,
  };
}

export interface DashaPeriod {
  lord: string;
  start: string; // YYYY-MM-DD
  end: string;
  years: number;
  current: boolean;
}

export function normaliseDasha(out: unknown, now = new Date()) {
  const o = (out && typeof out === 'object' ? out : {}) as Raw;
  const list = Array.isArray(o.mahadashas) ? (o.mahadashas as Raw[]) : [];
  const day = (s: unknown) => (typeof s === 'string' ? s.slice(0, 10) : '');
  const periods: DashaPeriod[] = list
    .map((m) => ({
      lord: String(m.lord ?? ''),
      start: day(m.start),
      end: day(m.end),
      years: Math.round(((num(m.duration_days) ?? 0) / 365.25) * 10) / 10,
      current: typeof m.start === 'string' && typeof m.end === 'string' && new Date(m.start) <= now && now < new Date(m.end),
    }))
    .filter((p) => p.lord);
  const bal = (o.balance ?? {}) as Raw;
  const balanceYears = num(bal.balance_years);
  return {
    periods,
    current: periods.find((p) => p.current)?.lord ?? null,
    birthBalance: balanceYears !== null ? { lord: String(bal.lord ?? ''), years: Math.round(balanceYears * 100) / 100 } : null,
  };
}

export function normaliseMangal(out: unknown) {
  const o = (out && typeof out === 'object' ? out : {}) as Raw;
  const present = o.is_present === true;
  const triggered = Array.isArray(o.triggered_references) ? (o.triggered_references as string[]) : [];
  const houses = (o.checked_houses && typeof o.checked_houses === 'object' ? o.checked_houses : {}) as Record<string, number>;
  const ruleHouses = Array.isArray(o.rule_houses) ? (o.rule_houses as number[]) : [1, 4, 7, 8, 12];
  const from = (ref: string) => (ref === 'Lagna' ? 'the Ascendant (Lagna)' : `the ${ref}`);
  return {
    present,
    triggeredBy: triggered,
    marsHouseFrom: houses,
    ruleHouses,
    explanation: present
      ? `Mangal dosha is present: Mars is in house ${triggered.map((t) => `${houses[t]} from ${from(t)}`).join(' and ')}. ` +
        `Dosha is checked when Mars is in houses ${ruleHouses.join(', ')}.`
      : `No Mangal dosha: Mars is not in houses ${ruleHouses.join(', ')} from the Ascendant, Moon or Venus.`,
  };
}
