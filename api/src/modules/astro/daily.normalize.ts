/**
 * Clean shapes for kundli matching and panchang, built from Navamsha's output.
 * Times from the provider are UTC ISO strings; we convert them to the place's local HH:mm.
 */

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function localTime(iso: unknown, timeZone: string): string | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
}

// ---------- matching ----------

const KOOTAS: { key: string; name: string; nameHi: string; about: string }[] = [
  { key: 'varna', name: 'Varna', nameHi: 'वर्ण', about: 'Work nature and ego compatibility' },
  { key: 'vashya', name: 'Vashya', nameHi: 'वश्य', about: 'Mutual attraction and influence' },
  { key: 'tara', name: 'Tara', nameHi: 'तारा', about: 'Health and well-being of the couple' },
  { key: 'yoni', name: 'Yoni', nameHi: 'योनि', about: 'Physical compatibility' },
  { key: 'graha_maitri', name: 'Graha Maitri', nameHi: 'ग्रह मैत्री', about: 'Mental compatibility and friendship' },
  { key: 'gana', name: 'Gana', nameHi: 'गण', about: 'Temperament' },
  { key: 'bhakoot', name: 'Bhakoot', nameHi: 'भकूट', about: 'Family welfare and finances' },
  { key: 'nadi', name: 'Nadi', nameHi: 'नाड़ी', about: 'Health and progeny' },
];

function person(p: Raw | undefined) {
  if (!p) return null;
  return {
    moonSign: p.sign ?? null,
    nakshatra: p.nakshatra?.name ?? null,
    pada: p.nakshatra?.pada ?? null,
    varna: p.varna ?? null,
    vashya: p.vashya ?? null,
    gana: p.gana ?? null,
    nadi: p.nadi ?? null,
    yoni: p.yoni ?? null,
  };
}

/** femaleKey / maleKey are the provider field names the request used (e.g. bride / groom). */
export function normaliseMatching(out: Raw, femaleKey: string, maleKey: string) {
  const breakdown: Raw = out?.breakdown ?? {};
  const kootas = KOOTAS.map((k) => {
    const b = breakdown[k.key] ?? {};
    return {
      key: k.key,
      name: k.name,
      nameHi: k.nameHi,
      about: k.about,
      score: typeof b.score === 'number' ? b.score : null,
      max: typeof b.maximum === 'number' ? b.maximum : null,
      girl: b.bride_value ?? b[`${femaleKey}_value`] ?? null,
      boy: b.groom_value ?? b[`${maleKey}_value`] ?? null,
      dosha: b.has_dosha === true,
    };
  });
  const score = typeof out?.total_score === 'number' ? out.total_score : kootas.reduce((s, k) => s + (k.score ?? 0), 0);
  const max = typeof out?.maximum_score === 'number' ? out.maximum_score : 36;
  return {
    score,
    maxScore: max,
    effectiveScore: typeof out?.effective_total_score === 'number' ? out.effective_total_score : null,
    girl: person(out?.[femaleKey]),
    boy: person(out?.[maleKey]),
    kootas,
    nadiDosha: kootas.find((k) => k.key === 'nadi')?.dosha ?? false,
    bhakootDosha: kootas.find((k) => k.key === 'bhakoot')?.dosha ?? false,
    verdict: score >= 28 ? 'excellent' : score >= 18 ? 'acceptable' : 'not_recommended',
  };
}

// ---------- panchang ----------

const GOOD_CHOGHADIYA = new Set(['Amrit', 'Shubh', 'Labh', 'Char']);

export function normalisePanchang(full: Raw, chog: Raw | null, inaus: Raw | null, abhijit: Raw | null, tz: string) {
  const span = (x: Raw | undefined) => (x ? { start: localTime(x.start, tz), end: localTime(x.end, tz) } : null);
  const slots = (list: Raw[] | undefined) =>
    (list ?? []).map((s) => ({ name: s.name, start: localTime(s.start, tz), end: localTime(s.end, tz), good: GOOD_CHOGHADIYA.has(s.name) }));
  const abhi = abhijit?.interval?.period?.[0];
  return {
    weekday: full?.weekday ? { name: full.weekday.name, lord: full.weekday.lord } : null,
    tithi: full?.tithi ? { name: full.tithi.name, paksha: full.tithi.paksha, number: full.tithi.number } : null,
    nakshatra: full?.nakshatra ? { name: full.nakshatra.name, pada: full.nakshatra.pada, lord: full.nakshatra.lord } : null,
    yoga: full?.yoga ? { name: full.yoga.name } : null,
    karana: full?.karana ? { name: full.karana.name } : null,
    sunrise: localTime(inaus?.sunrise?.utc_datetime, tz),
    sunset: localTime(inaus?.sunset?.utc_datetime, tz),
    rahuKaal: span(inaus?.rahu_kaal),
    gulikaKaal: span(inaus?.gulika_kaal),
    yamaganda: span(inaus?.yamaganda),
    abhijitMuhurat: abhi ? { start: localTime(abhi.start, tz), end: localTime(abhi.end, tz) } : null,
    choghadiya: chog ? { day: slots(chog.day), night: slots(chog.night) } : null,
  };
}
