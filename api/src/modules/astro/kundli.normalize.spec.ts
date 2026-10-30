import * as fixture from '../../../test/fixtures/navamsha-kundli.json';
import { buildKundliPdf } from './kundli.pdf';
import { navamsaSign, normaliseDasha, normaliseMangal, normalisePlanets, summary } from './kundli.normalize';

describe('kundli normalisation (real provider shape)', () => {
  const { ascendant, planets } = normalisePlanets(fixture.planets, fixture.basic);

  it('reads ascendant and the nine grahas in order, without outer planets', () => {
    expect(ascendant).toMatchObject({ sign: 3, signName: 'Gemini', house: 1 });
    expect(planets.map((p) => p.abbr)).toEqual(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']);
    expect(planets.find((p) => p.name === 'Jupiter')).toMatchObject({ retro: true, house: 10, dms: expect.stringMatching(/^26°08'/) });
  });

  it('builds the summary', () => {
    expect(summary(ascendant, planets)).toMatchObject({ ascendant: 'Gemini', moonSign: 'Cancer', sunSign: 'Scorpio', nakshatra: 'Pushya', nakshatraPada: 3 });
  });

  it('computes navamsa signs', () => {
    expect(navamsaSign(0)).toBe(1); // 0° Aries -> Aries
    expect(navamsaSign(3.34)).toBe(2);
    expect(navamsaSign(30)).toBe(10); // 0° Taurus -> Capricorn
    expect(navamsaSign(359.9)).toBe(12);
    expect(ascendant?.navamsaSign).toBe(7); // 60.59° (Gemini 0°35') -> Libra
  });

  it('reads dasha and marks the running one', () => {
    const d = normaliseDasha(fixture.dasha, new Date('2026-10-24'));
    expect(d.current).toBe('Venus');
    expect(d.periods[0]).toMatchObject({ lord: 'Saturn', start: '1978-02-09', years: 19 });
    expect(d.birthBalance).toEqual({ lord: 'Saturn', years: 9.17 });
  });

  it('explains Mangal dosha', () => {
    const m = normaliseMangal(fixture.mangal);
    expect(m.present).toBe(true);
    expect(m.explanation).toContain('house 4 from the Moon');
  });

  it('produces a PDF', async () => {
    const k = {
      input: { name: 'Test User', gender: 'male', dateOfBirth: '1987-12-09', timeOfBirth: '18:04', place: 'Jhalawar, India', latitude: 24.6, longitude: 76.16, timezone: 'Asia/Kolkata', utcOffset: 5.5, ayanamsha: 'lahiri' },
      summary: summary(ascendant, planets),
      ascendant: ascendant!,
      planets,
      dasha: normaliseDasha(fixture.dasha, new Date('2026-10-24')),
      mangalDosha: normaliseMangal(fixture.mangal),
    };
    const brand = { name: 'AstroSparkles', tagline: 'Vedic astrology', colors: { primary: '#3B1F6E', accent: '#E8912D', gold: '#D4A93C', text: '#1E1630', background: '#FFF9F0' } };
    const pdf = await buildKundliPdf(k, brand, 'north');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    if (process.env.SAVE_PDF) require('fs').writeFileSync(process.env.SAVE_PDF, pdf);
    const south = await buildKundliPdf(k, brand, 'south');
    if (process.env.SAVE_PDF) require('fs').writeFileSync(process.env.SAVE_PDF.replace('.pdf', '-south.pdf'), south);
  });
});
