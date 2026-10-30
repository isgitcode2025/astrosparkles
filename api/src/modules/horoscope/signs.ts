/** The 12 zodiac signs with English and Hindi (rashi) names. Slugs are used in URLs. */
export const SIGNS = [
  { slug: 'aries', en: 'Aries', hi: 'मेष', rashi: 'mesh', dates: 'Mar 21 – Apr 19', lord: 'Mars' },
  { slug: 'taurus', en: 'Taurus', hi: 'वृषभ', rashi: 'vrishabh', dates: 'Apr 20 – May 20', lord: 'Venus' },
  { slug: 'gemini', en: 'Gemini', hi: 'मिथुन', rashi: 'mithun', dates: 'May 21 – Jun 20', lord: 'Mercury' },
  { slug: 'cancer', en: 'Cancer', hi: 'कर्क', rashi: 'kark', dates: 'Jun 21 – Jul 22', lord: 'Moon' },
  { slug: 'leo', en: 'Leo', hi: 'सिंह', rashi: 'singh', dates: 'Jul 23 – Aug 22', lord: 'Sun' },
  { slug: 'virgo', en: 'Virgo', hi: 'कन्या', rashi: 'kanya', dates: 'Aug 23 – Sep 22', lord: 'Mercury' },
  { slug: 'libra', en: 'Libra', hi: 'तुला', rashi: 'tula', dates: 'Sep 23 – Oct 22', lord: 'Venus' },
  { slug: 'scorpio', en: 'Scorpio', hi: 'वृश्चिक', rashi: 'vrishchik', dates: 'Oct 23 – Nov 21', lord: 'Mars' },
  { slug: 'sagittarius', en: 'Sagittarius', hi: 'धनु', rashi: 'dhanu', dates: 'Nov 22 – Dec 21', lord: 'Jupiter' },
  { slug: 'capricorn', en: 'Capricorn', hi: 'मकर', rashi: 'makar', dates: 'Dec 22 – Jan 19', lord: 'Saturn' },
  { slug: 'aquarius', en: 'Aquarius', hi: 'कुंभ', rashi: 'kumbh', dates: 'Jan 20 – Feb 18', lord: 'Saturn' },
  { slug: 'pisces', en: 'Pisces', hi: 'मीन', rashi: 'meen', dates: 'Feb 19 – Mar 20', lord: 'Jupiter' },
] as const;

export const SIGN_SLUGS = SIGNS.map((s) => s.slug) as string[];
export const PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type Period = (typeof PERIODS)[number];

/** Period key in India time: daily 2026-10-24, weekly 2026-W43 (ISO week), monthly 2026-10. */
export function periodKey(period: Period, date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (period === 'daily') return date;
  if (period === 'monthly') return `${y}-${String(m).padStart(2, '0')}`;
  const t = new Date(Date.UTC(y, m - 1, d));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
