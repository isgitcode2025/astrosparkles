/**
 * UTC offset in hours for an IANA zone at a given LOCAL wall-clock time.
 * Handles historical changes and daylight saving (e.g. a 1975 birth in New York),
 * which a fixed "+5.5" style offset cannot.
 */
export function utcOffsetHours(timeZone: string, y: number, m: number, d: number, hh = 12, mm = 0): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const offsetAt = (utcMs: number) => {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return (asUtc - utcMs) / 60_000; // minutes
  };
  // treat the wall time as UTC, then correct twice (enough to settle across DST edges)
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let offset = offsetAt(wall);
  offset = offsetAt(wall - offset * 60_000);
  return Math.round((offset / 60) * 100) / 100;
}

/** Today's calendar date (YYYY-MM-DD) in a time zone. */
export function todayIn(timeZone: string, at = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}
