import PDFDocument = require('pdfkit');
import { ChartPoint, DashaPeriod, SIGN_NAMES } from './kundli.normalize';

type Kundli = {
  input: { name: string | null; gender: string | null; dateOfBirth: string; timeOfBirth: string; place: string; latitude: number; longitude: number; timezone: string; utcOffset: number; ayanamsha: string };
  summary: { ascendant: string | null; moonSign: string | null; sunSign: string | null; nakshatra: string | null; nakshatraPada: number | null; nakshatraLord: string | null };
  ascendant: ChartPoint;
  planets: ChartPoint[];
  dasha: { periods: DashaPeriod[]; current: string | null; birthBalance: { lord: string; years: number } | null } | null;
  mangalDosha: { present: boolean; explanation: string } | null;
};
type Brand = { name: string; tagline: string; colors: { primary: string; accent: string; gold: string; text: string; background: string }; supportEmail?: string };

// ---- chart geometry (same layout as the website) ----

/** North Indian chart on a 0..S square: where each house's planets and sign number go. */
function northHouses(S: number) {
  const k = S / 400;
  const pts: Record<number, { p: [number, number]; n: [number, number] }> = {
    1: { p: [200, 92], n: [200, 178] },
    2: { p: [100, 36], n: [100, 84] },
    3: { p: [36, 100], n: [84, 100] },
    4: { p: [100, 200], n: [178, 200] },
    5: { p: [36, 300], n: [84, 300] },
    6: { p: [100, 364], n: [100, 316] },
    7: { p: [200, 308], n: [200, 222] },
    8: { p: [300, 364], n: [300, 316] },
    9: { p: [364, 300], n: [316, 300] },
    10: { p: [300, 200], n: [222, 200] },
    11: { p: [364, 100], n: [316, 100] },
    12: { p: [300, 36], n: [300, 84] },
  };
  return Object.fromEntries(Object.entries(pts).map(([h, v]) => [h, { p: [v.p[0] * k, v.p[1] * k], n: [v.n[0] * k, v.n[1] * k] }])) as Record<
    number,
    { p: [number, number]; n: [number, number] }
  >;
}

/** South Indian chart: fixed sign cells in a 4×4 grid (col, row). */
const SOUTH_CELLS: Record<number, [number, number]> = {
  12: [0, 0], 1: [1, 0], 2: [2, 0], 3: [3, 0], 4: [3, 1], 5: [3, 2], 6: [3, 3], 7: [2, 3], 8: [1, 3], 9: [0, 3], 10: [0, 2], 11: [0, 1],
};

const label = (p: ChartPoint) => `${p.abbr}${p.retro ? '(R)' : ''} ${Math.floor(p.degreeInSign)}°`;

function drawChart(doc: PDFKit.PDFDocument, x: number, y: number, S: number, style: 'north' | 'south', ascSign: number, items: { sign: number; text: string }[], title: string, brand: Brand) {
  const line = brand.colors.primary;
  doc.save();
  doc.lineWidth(1).strokeColor(line);
  doc.rect(x, y, S, S).fillAndStroke('#FFFDF8', line);

  if (style === 'north') {
    doc.moveTo(x, y).lineTo(x + S, y + S).moveTo(x + S, y).lineTo(x, y + S).stroke();
    doc.moveTo(x + S / 2, y).lineTo(x + S, y + S / 2).lineTo(x + S / 2, y + S).lineTo(x, y + S / 2).closePath().stroke();
    const houses = northHouses(S);
    for (let h = 1; h <= 12; h++) {
      const sign = ((ascSign - 1 + h - 1) % 12) + 1;
      const { p, n } = houses[h];
      doc.fillColor('#9A8FB0').fontSize(8).text(String(sign), x + n[0] - 10, y + n[1] - 4, { width: 20, align: 'center' });
      const here = items.filter((i) => i.sign === sign);
      const lh = 10;
      here.forEach((it, i) => {
        const ty = y + p[1] - (here.length * lh) / 2 + i * lh;
        doc.fillColor(it.text.startsWith('Asc') ? brand.colors.accent : brand.colors.text).fontSize(8).text(it.text, x + p[0] - 30, ty, { width: 60, align: 'center' });
      });
    }
  } else {
    const c = S / 4;
    for (let i = 1; i < 4; i++) {
      doc.moveTo(x + i * c, y).lineTo(x + i * c, y + (i === 2 ? c : S)).stroke();
      doc.moveTo(x, y + i * c).lineTo(x + (i === 2 ? c : S), y + i * c).stroke();
    }
    doc.moveTo(x + 2 * c, y + 3 * c).lineTo(x + 2 * c, y + S).stroke();
    doc.moveTo(x + 3 * c, y + 2 * c).lineTo(x + S, y + 2 * c).stroke();
    doc.rect(x + c, y + c, 2 * c, 2 * c).fill('#FFFDF8');
    for (let sign = 1; sign <= 12; sign++) {
      const [col, row] = SOUTH_CELLS[sign];
      const cx = x + col * c;
      const cy = y + row * c;
      if (sign === ascSign) doc.moveTo(cx, cy + 12).lineTo(cx + 12, cy).stroke();
      doc.fillColor('#9A8FB0').fontSize(7).text(SIGN_NAMES[sign - 1].slice(0, 3), cx + 2, cy + c - 10, { width: c - 4, align: 'right' });
      items
        .filter((i) => i.sign === sign)
        .forEach((it, i) => doc.fillColor(it.text.startsWith('Asc') ? brand.colors.accent : brand.colors.text).fontSize(8).text(it.text, cx + 2, cy + 6 + i * 10, { width: c - 4, align: 'center' }));
    }
  }
  doc.fillColor(brand.colors.primary).fontSize(10).font('Helvetica-Bold').text(title, x, y + S + 6, { width: S, align: 'center' });
  doc.font('Helvetica');
  doc.restore();
}

function table(doc: PDFKit.PDFDocument, x: number, y: number, cols: { title: string; w: number }[], rows: string[][], brand: Brand, highlight?: (i: number) => boolean) {
  const rowH = 17;
  let cy = y;
  doc.rect(x, cy, cols.reduce((s, c) => s + c.w, 0), rowH).fill(brand.colors.primary);
  let cx = x;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
  cols.forEach((c) => {
    doc.text(c.title, cx + 4, cy + 5, { width: c.w - 8 });
    cx += c.w;
  });
  doc.font('Helvetica');
  rows.forEach((r, i) => {
    cy += rowH;
    if (highlight?.(i)) doc.rect(x, cy, cols.reduce((s, c) => s + c.w, 0), rowH).fill('#FDEBD3');
    else if (i % 2) doc.rect(x, cy, cols.reduce((s, c) => s + c.w, 0), rowH).fill('#F7F4FB');
    cx = x;
    doc.fillColor(brand.colors.text).fontSize(8.5);
    cols.forEach((c, j) => {
      doc.text(r[j] ?? '', cx + 4, cy + 5, { width: c.w - 8, lineBreak: false, ellipsis: true });
      cx += c.w;
    });
  });
  return cy + rowH;
}

/** Builds a branded kundli PDF (A4, English). Returns the file as a Buffer. */
export function buildKundliPdf(k: Kundli, brand: Brand, style: 'north' | 'south' = 'north'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `${k.input.name ?? 'Kundli'} – ${brand.name}`, Author: brand.name } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const M = 40;
    const footer = () => {
      // write inside the bottom margin without pdfkit starting a new page
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fontSize(7.5).fillColor('#8A8299').text(
        `${brand.name} · Calculated with ${k.input.ayanamsha} ayanamsha. For guidance only.${brand.supportEmail ? ` · ${brand.supportEmail}` : ''}`,
        M,
        doc.page.height - 30,
        { width: W - 2 * M, align: 'center', lineBreak: false },
      );
      doc.page.margins.bottom = bottom;
    };

    // ---------- page 1: details, summary, charts ----------
    doc.rect(0, 0, W, 70).fill(brand.colors.primary);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text(brand.name, M, 22);
    doc.font('Helvetica').fontSize(9).fillColor(brand.colors.gold).text(brand.tagline, M, 46);
    doc.fillColor('#FFFFFF').fontSize(12).text('Janam Kundli', M, 28, { width: W - 2 * M, align: 'right' });

    doc.fillColor(brand.colors.primary).font('Helvetica-Bold').fontSize(16).text(k.input.name ? `${k.input.name}` : 'Birth chart', M, 90);
    doc.font('Helvetica').fillColor(brand.colors.text).fontSize(9.5);
    const details = [
      ['Date of birth', k.input.dateOfBirth],
      ['Time of birth', k.input.timeOfBirth],
      ['Place of birth', k.input.place || '—'],
      ['Latitude / Longitude', `${k.input.latitude.toFixed(4)}, ${k.input.longitude.toFixed(4)}`],
      ['Time zone', `${k.input.timezone} (UTC${k.input.utcOffset >= 0 ? '+' : ''}${k.input.utcOffset})`],
      ['Gender', k.input.gender ? k.input.gender[0].toUpperCase() + k.input.gender.slice(1) : '—'],
    ];
    details.forEach(([a, b], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.fillColor('#8A8299').text(a, M + col * 260, 116 + row * 16, { continued: true }).fillColor(brand.colors.text).text(`   ${b}`);
    });

    const boxes = [
      ['Ascendant (Lagna)', k.summary.ascendant ?? '—'],
      ['Moon sign (Rashi)', k.summary.moonSign ?? '—'],
      ['Sun sign', k.summary.sunSign ?? '—'],
      ['Nakshatra', k.summary.nakshatra ? `${k.summary.nakshatra}${k.summary.nakshatraPada ? `, pada ${k.summary.nakshatraPada}` : ''}` : '—'],
    ];
    const bw = (W - 2 * M - 30) / 4;
    boxes.forEach(([a, b], i) => {
      const bx = M + i * (bw + 10);
      doc.roundedRect(bx, 172, bw, 44, 6).fill('#FFF4E5');
      doc.fillColor('#8A8299').fontSize(8).text(a, bx, 180, { width: bw, align: 'center' });
      doc.fillColor(brand.colors.primary).font('Helvetica-Bold').fontSize(11).text(b, bx + 4, 195, { width: bw - 8, align: 'center' });
      doc.font('Helvetica');
    });

    const S = 240;
    const d1 = [{ sign: k.ascendant.sign, text: 'Asc' }, ...k.planets.map((p) => ({ sign: p.sign, text: label(p) }))];
    const d9 = [{ sign: k.ascendant.navamsaSign, text: 'Asc' }, ...k.planets.map((p) => ({ sign: p.navamsaSign, text: p.abbr + (p.retro ? '(R)' : '') }))];
    drawChart(doc, M, 240, S, style, k.ascendant.sign, d1, 'Lagna chart (D1)', brand);
    drawChart(doc, W - M - S, 240, S, style, k.ascendant.navamsaSign, d9, 'Navamsa chart (D9)', brand);

    if (k.mangalDosha) {
      doc.roundedRect(M, 520, W - 2 * M, 50, 6).fill(k.mangalDosha.present ? '#FDECEC' : '#EAF7EE');
      doc.fillColor(brand.colors.text).font('Helvetica-Bold').fontSize(10).text(`Mangal dosha: ${k.mangalDosha.present ? 'Present' : 'Not present'}`, M + 10, 528);
      doc.font('Helvetica').fontSize(8.5).text(k.mangalDosha.explanation, M + 10, 543, { width: W - 2 * M - 20 });
    }
    footer();

    // ---------- page 2: planets and dasha ----------
    doc.addPage();
    doc.fillColor(brand.colors.primary).font('Helvetica-Bold').fontSize(14).text('Planetary positions', M, 40);
    doc.font('Helvetica');
    const pRows = [k.ascendant, ...k.planets].map((p) => [
      p.name,
      p.signName,
      p.dms,
      String(p.house),
      p.nakshatra ? `${p.nakshatra}${p.pada ? ` (${p.pada})` : ''}` : '—',
      p.signLord ?? '—',
      p.nakshatraLord ?? '—',
      p.retro ? 'Yes' : '',
    ]);
    let y = table(
      doc,
      M,
      64,
      [
        { title: 'Planet', w: 62 },
        { title: 'Sign', w: 72 },
        { title: 'Degree', w: 64 },
        { title: 'House', w: 40 },
        { title: 'Nakshatra (pada)', w: 100 },
        { title: 'Sign lord', w: 62 },
        { title: 'Nak. lord', w: 62 },
        { title: 'Retro', w: 53 },
      ],
      pRows,
      brand,
    );

    if (k.dasha && k.dasha.periods.length) {
      doc.fillColor(brand.colors.primary).font('Helvetica-Bold').fontSize(14).text('Vimshottari Mahadasha', M, y + 28);
      doc.font('Helvetica').fontSize(8.5).fillColor('#8A8299');
      if (k.dasha.birthBalance) doc.text(`Balance at birth: ${k.dasha.birthBalance.lord} ${k.dasha.birthBalance.years} years`, M, y + 46);
      y = table(
        doc,
        M,
        y + 62,
        [
          { title: 'Mahadasha', w: 120 },
          { title: 'From', w: 120 },
          { title: 'To', w: 120 },
          { title: 'Years', w: 155 },
        ],
        k.dasha.periods.map((p) => [p.lord + (p.current ? '  (running)' : ''), p.start, p.end, String(p.years)]),
        brand,
        (i) => k.dasha!.periods[i].current,
      );
    }

    doc.fontSize(8.5).fillColor('#8A8299').text(
      'This report is generated from astronomical calculations. For a personal reading of your chart, consult one of our verified astrologers.',
      M,
      y + 30,
      { width: W - 2 * M },
    );
    footer();
    doc.end();
  });
}
