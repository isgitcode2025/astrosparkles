/**
 * Draws a Vedic birth chart (North or South Indian style) from planet signs.
 * Same layout as the PDF so web, app and download look alike.
 */

export type ChartItem = { sign: number; text: string; highlight?: boolean };

const SIGN_ABBR = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

/** North Indian: centre of each house's planet list (p) and its sign number (n) on a 400×400 square. */
const NORTH: Record<number, { p: [number, number]; n: [number, number] }> = {
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

/** South Indian: fixed sign cells (column, row) in a 4×4 grid. */
const SOUTH: Record<number, [number, number]> = {
  12: [0, 0], 1: [1, 0], 2: [2, 0], 3: [3, 0], 4: [3, 1], 5: [3, 2], 6: [3, 3], 7: [2, 3], 8: [1, 3], 9: [0, 3], 10: [0, 2], 11: [0, 1],
};

const LINE = "var(--brand-primary)";

export function KundliChart({ style, ascSign, items, title }: { style: "north" | "south"; ascSign: number; items: ChartItem[]; title: string }) {
  const S = 400;
  const LH = 15;

  return (
    <figure>
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={title} className="mx-auto w-full max-w-md" fontFamily="inherit">
        <rect x="1" y="1" width={S - 2} height={S - 2} fill="#FFFDF8" stroke={LINE} strokeWidth="2" />
        {style === "north" ? (
          <>
            <path d={`M1 1L${S - 1} ${S - 1}M${S - 1} 1L1 ${S - 1}M${S / 2} 1L${S - 1} ${S / 2}L${S / 2} ${S - 1}L1 ${S / 2}Z`} fill="none" stroke={LINE} strokeWidth="1.5" />
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
              const sign = ((ascSign - 1 + h - 1) % 12) + 1;
              const here = items.filter((it) => it.sign === sign);
              const { p, n } = NORTH[h];
              return (
                <g key={h}>
                  <text x={n[0]} y={n[1] + 4} textAnchor="middle" fontSize="12" fill="#9A8FB0">
                    {sign}
                  </text>
                  {here.map((it, i) => (
                    <text
                      key={it.text}
                      x={p[0]}
                      y={p[1] - ((here.length - 1) * LH) / 2 + i * LH + 4}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={it.highlight ? 700 : 600}
                      fill={it.highlight ? "var(--brand-accent)" : "var(--brand-text)"}
                    >
                      {it.text}
                    </text>
                  ))}
                </g>
              );
            })}
          </>
        ) : (
          <>
            {[1, 2, 3].map((i) => (
              <g key={i} stroke={LINE} strokeWidth="1.5">
                <line x1={i * 100} y1="0" x2={i * 100} y2={i === 2 ? 100 : S} />
                <line x1="0" y1={i * 100} x2={i === 2 ? 100 : S} y2={i * 100} />
              </g>
            ))}
            <line x1="200" y1="300" x2="200" y2={S} stroke={LINE} strokeWidth="1.5" />
            <line x1="300" y1="200" x2={S} y2="200" stroke={LINE} strokeWidth="1.5" />
            <text x="200" y="205" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--brand-primary)">
              {title}
            </text>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((sign) => {
              const [c, r] = SOUTH[sign];
              const x = c * 100;
              const y = r * 100;
              const here = items.filter((it) => it.sign === sign);
              return (
                <g key={sign}>
                  {sign === ascSign && <line x1={x} y1={y + 18} x2={x + 18} y2={y} stroke="var(--brand-accent)" strokeWidth="2" />}
                  <text x={x + 94} y={y + 94} textAnchor="end" fontSize="11" fill="#9A8FB0">
                    {SIGN_ABBR[sign - 1]}
                  </text>
                  {here.map((it, i) => (
                    <text
                      key={it.text}
                      x={x + 50}
                      y={y + 22 + i * LH}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={it.highlight ? 700 : 600}
                      fill={it.highlight ? "var(--brand-accent)" : "var(--brand-text)"}
                    >
                      {it.text}
                    </text>
                  ))}
                </g>
              );
            })}
          </>
        )}
      </svg>
      <figcaption className="mt-2 text-center text-sm font-medium text-brand-primary">{title}</figcaption>
    </figure>
  );
}
