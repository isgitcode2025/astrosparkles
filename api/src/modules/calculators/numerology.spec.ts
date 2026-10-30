import { loShu, loveScore, numerology, reduce } from './numerology';

describe('numerology', () => {
  it('reduces numbers and keeps master numbers', () => {
    expect(reduce(29)).toBe(11);
    expect(reduce(38)).toBe(11);
    expect(reduce(29, false)).toBe(2);
    expect(reduce(1992)).toBe(3);
  });

  it('computes life path from a date of birth', () => {
    // 15 Aug 1992: 6 + 8 + 3 = 17 -> 8
    expect(numerology('1992-08-15').lifePath).toBe(8);
    expect(numerology('1992-08-15').birthday).toBe(6);
  });

  it('computes name numbers (Pythagorean)', () => {
    const r = numerology('1992-08-15', 'Ravi');
    // R9 A1 V4 I9 = 23 -> 5 ; vowels A1 I9 = 10 -> 1 ; consonants R9 V4 = 13 -> 4
    expect(r).toMatchObject({ destiny: 5, soulUrge: 1, personality: 4 });
    expect(numerology('1992-08-15').destiny).toBeNull();
  });
});

describe('lo shu grid', () => {
  it('counts digits with driver and conductor', () => {
    const r = loShu('1992-08-15');
    expect(r.driver).toBe(6);
    expect(r.conductor).toBe(8);
    // digits 1,9,9,2,8,1,5 + 6 + 8
    expect(r.counts).toMatchObject({ 1: 2, 2: 1, 3: 0, 4: 0, 5: 1, 6: 1, 7: 0, 8: 2, 9: 2 });
    expect(r.missing).toEqual([3, 4, 7]);
    expect(r.grid[0].map((c) => c.number)).toEqual([4, 9, 2]);
  });
});

describe('love score', () => {
  it('is stable and order independent', () => {
    expect(loveScore('Ravi', 'Priya')).toBe(loveScore('priya', 'RAVI'));
    expect(loveScore('Ravi', 'Priya')).toBeGreaterThanOrEqual(40);
  });
});
