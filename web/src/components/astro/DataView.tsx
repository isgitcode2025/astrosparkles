/**
 * Renders any JSON returned by the astrology provider in a readable way:
 * objects as label/value lists, arrays of objects as tables, and plain values as text.
 * Used where we show the provider's full output without hand-mapping every field.
 */

const label = (k: string) =>
  k
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const isPlain = (v: unknown) => v === null || ["string", "number", "boolean"].includes(typeof v);

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  return String(v);
}

const HIDDEN = new Set(["metadata", "formula_policy", "rule_id", "rule_ids", "settings", "request", "input"]);

export function DataView({ data, depth = 0 }: { data: unknown; depth?: number }) {
  if (isPlain(data)) return <span>{fmt(data)}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-brand-text/50">None</span>;
    if (data.every(isPlain)) return <span>{data.map(fmt).join(", ")}</span>;
    if (data.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
      const cols = Array.from(new Set(data.flatMap((r) => Object.keys(r as object)))).filter(
        (c) => !HIDDEN.has(c) && data.every((r) => isPlain((r as Record<string, unknown>)[c])),
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="text-brand-text/50">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-2 py-1 font-medium">
                    {label(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={i} className="border-t border-black/5">
                  {cols.map((c) => (
                    <td key={c} className="px-2 py-1.5">
                      {fmt((r as Record<string, unknown>)[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  if (data && typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>).filter(([k]) => !HIDDEN.has(k));
    if (depth > 4) return <span className="text-brand-text/50">…</span>;
    return (
      <dl className={depth === 0 ? "grid gap-x-6 gap-y-2 sm:grid-cols-2" : "space-y-1 pl-3"}>
        {entries.map(([k, v]) => (
          <div key={k} className={isPlain(v) ? "flex justify-between gap-3 border-b border-black/5 py-1" : "sm:col-span-2"}>
            <dt className="text-brand-text/60">{label(k)}</dt>
            <dd className={isPlain(v) ? "text-right font-medium" : "mt-1"}>
              <DataView data={v} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return null;
}

/** Shows an SVG chart from the provider safely as an image (scripts inside cannot run). */
export function SvgChart({ svg, title }: { svg: string | null; title: string }) {
  if (!svg) return <p className="text-sm text-brand-text/50">{title} not available</p>;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} alt={title} className="mx-auto w-full max-w-sm" />
      <figcaption className="mt-1 text-center text-sm text-brand-text/60">{title}</figcaption>
    </figure>
  );
}
