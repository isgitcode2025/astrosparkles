/**
 * Numerology calculations done locally (no provider credits).
 * Pythagorean letter values (A=1 … I=9, J=1 …), master numbers 11, 22, 33 are kept.
 */

const MASTER = new Set([11, 22, 33]);

export function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && MASTER.has(n))) {
    n = String(n)
      .split('')
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

const letterValue = (ch: string) => ((ch.charCodeAt(0) - 97) % 9) + 1;
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function nameSum(name: string, filter: (c: string) => boolean) {
  return name
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split('')
    .filter(filter)
    .reduce((s, c) => s + letterValue(c), 0);
}

export interface NumerologyResult {
  lifePath: number;
  birthday: number;
  destiny: number | null;
  soulUrge: number | null;
  personality: number | null;
  personalYear: number;
}

export function numerology(dateOfBirth: string, fullName?: string, today = new Date()): NumerologyResult {
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  // reduce day, month and year separately, then add (standard life path method)
  const lifePath = reduce(reduce(d) + reduce(m) + reduce(String(y).split('').reduce((s, x) => s + Number(x), 0)));
  const hasName = Boolean(fullName && /[a-z]/i.test(fullName));
  return {
    lifePath,
    birthday: reduce(d),
    destiny: hasName ? reduce(nameSum(fullName as string, () => true)) : null,
    soulUrge: hasName ? reduce(nameSum(fullName as string, (c) => VOWELS.has(c))) : null,
    personality: hasName ? reduce(nameSum(fullName as string, (c) => !VOWELS.has(c))) : null,
    personalYear: reduce(reduce(d) + reduce(m) + reduce(today.getFullYear()), false),
  };
}

/** Lo Shu grid layout (rows top to bottom). */
export const LO_SHU_LAYOUT = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/**
 * Counts each digit 1–9 in the date of birth, plus the driver (birth day reduced)
 * and conductor (life path reduced to one digit), as commonly practised in Indian numerology.
 */
export function loShu(dateOfBirth: string) {
  const [, , d] = dateOfBirth.split('-').map(Number);
  const digits = dateOfBirth.replace(/\D/g, '').split('').map(Number).filter((n) => n > 0);
  const driver = reduce(d, false);
  const conductor = reduce(numerology(dateOfBirth).lifePath, false);
  const all = [...digits, driver, conductor];
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = all.filter((x) => x === n).length;
  const has = (n: number) => counts[n] > 0;
  const planes = {
    mental: [4, 9, 2],
    emotional: [3, 5, 7],
    practical: [8, 1, 6],
    thought: [4, 3, 8],
    will: [9, 5, 1],
    action: [2, 7, 6],
    golden: [4, 5, 6],
    silver: [2, 5, 8],
  };
  return {
    driver,
    conductor,
    counts,
    grid: LO_SHU_LAYOUT.map((row) => row.map((n) => ({ number: n, count: counts[n] }))),
    missing: Object.keys(counts).map(Number).filter((n) => counts[n] === 0),
    repeated: Object.keys(counts).map(Number).filter((n) => counts[n] > 1),
    completePlanes: Object.entries(planes)
      .filter(([, nums]) => nums.every(has))
      .map(([name]) => name),
  };
}

/** Light-hearted name compatibility percentage. Deterministic, for entertainment only. */
export function loveScore(a: string, b: string): number {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-zऀ-ॿ]/g, '');
  const pair = [clean(a), clean(b)].sort().join('|');
  let h = 2166136261;
  for (const ch of pair) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return 40 + (h % 61); // 40–100
}
