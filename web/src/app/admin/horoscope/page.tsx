"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminTitle, Btn, btnPrimary } from "@/components/admin/kit";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading as SkelLoading, Skel } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError } from "@/lib/api";

type Sign = { slug: string; en: string; hi: string };
type Row = { sign: Sign; status: string | null; text: string | null; luckyNumber: string | null; luckyColor: string | null; mantra: string | null; remedy: string | null };
type Draft = { text: string; luckyNumber: string; luckyColor: string; mantra: string; remedy: string };

const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const field = "w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-brand-saffron focus:ring-2 focus:ring-brand-saffron/20";

/** Content team screen: write all 12 signs for a day, week or month in English or Hindi. */
export default function HoroscopeEditor() {
  const [period, setPeriod] = useState("daily");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [date, setDate] = useState(todayIST());
  const [periodKey, setPeriodKey] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ periodKey: string; items: Row[] }>(`/admin/horoscope?period=${period}&lang=${lang}&date=${date}`, { auth: true });
      setPeriodKey(r.periodKey);
      setRows(r.items);
      setDrafts(
        Object.fromEntries(
          r.items.map((i) => [
            i.sign.slug,
            { text: i.text ?? "", luckyNumber: i.luckyNumber ?? "", luckyColor: i.luckyColor ?? "", mantra: i.mantra ?? "", remedy: i.remedy ?? "" },
          ]),
        ),
      );
      setSaved({});
    } catch (e) {
      setError(e instanceof ApiRequestError && e.status === 403 ? "Only admins and editors can open this page." : "Could not load horoscopes.");
    } finally {
      setLoading(false);
    }
  }, [period, lang, date]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (slug: string) => {
    const d = drafts[slug];
    setSaved((s) => ({ ...s, [slug]: "Saving…" }));
    try {
      await api("/admin/horoscope", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          sign: slug,
          period,
          date,
          lang,
          text: d.text,
          luckyNumber: d.luckyNumber || undefined,
          luckyColor: d.luckyColor || undefined,
          mantra: d.mantra || undefined,
          remedy: d.remedy || undefined,
        }),
      });
      setSaved((s) => ({ ...s, [slug]: "Published" }));
      toast.success("Published.");
    } catch (e) {
      setSaved((s) => ({ ...s, [slug]: e instanceof ApiRequestError ? e.message : "Failed" }));
    }
  };

  const set = (slug: string, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [slug]: { ...d[slug], ...patch } }));

  const written = rows.filter((r) => r.status === "published" || saved[r.sign.slug] === "Published").length;

  return (
    <>
      <AdminTitle title="Horoscope editor" subtitle="Write all 12 signs for a day, week or month, in English or Hindi. Published text goes live on the horoscope pages at once.">
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-indigo ring-1 ring-brand-border">
          {written} / {rows.length || 12} published · {periodKey}
        </span>
      </AdminTitle>
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-brand-border bg-white p-4 shadow-soft">
        <label className="text-sm font-semibold text-slate-600">
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${field} mt-1`}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Language
          <select value={lang} onChange={(e) => setLang(e.target.value as "en" | "hi")} className={`${field} mt-1`}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Date (any day in the period)
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} mt-1`} />
        </label>
      </div>
      {error && <ErrorState compact title="Could not load horoscopes" text={error} onRetry={load} />}

      {loading && !error && (
        <SkelLoading label="Loading horoscopes" className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
              <Skel className="h-5 w-40" />
              <Skel className="h-24 w-full !rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((j) => (
                  <Skel key={j} className="h-9 !rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </SkelLoading>
      )}

      <div className={`grid gap-4 xl:grid-cols-2 ${loading ? "hidden" : ""}`}>
        {rows.map((r) => {
          const d = drafts[r.sign.slug];
          if (!d) return null;
          const state = saved[r.sign.slug] ?? (r.status === "published" ? "Published" : r.status ? r.status : "Not written yet");
          return (
            <div key={r.sign.slug} className="rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-base font-bold text-brand-indigo">
                  {r.sign.en} <span className="font-normal text-slate-400">· {r.sign.hi}</span>
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${state === "Published" ? "bg-emerald-50 text-emerald-700" : state === "Saving…" ? "bg-slate-100 text-slate-600" : state === "Not written yet" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                  {state}
                </span>
              </div>
              <textarea value={d.text} onChange={(e) => set(r.sign.slug, { text: e.target.value })} rows={4} maxLength={6000} className={`${field} mt-3`} placeholder="Horoscope text (min 20 characters)" />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={d.luckyNumber} onChange={(e) => set(r.sign.slug, { luckyNumber: e.target.value })} placeholder="Lucky number" maxLength={20} className={field} />
                <input value={d.luckyColor} onChange={(e) => set(r.sign.slug, { luckyColor: e.target.value })} placeholder="Lucky colour" maxLength={40} className={field} />
                <input value={d.mantra} onChange={(e) => set(r.sign.slug, { mantra: e.target.value })} placeholder="Mantra" maxLength={300} className={field} />
                <input value={d.remedy} onChange={(e) => set(r.sign.slug, { remedy: e.target.value })} placeholder="Remedy" maxLength={500} className={field} />
              </div>
              <Btn
                onClick={() => save(r.sign.slug)}
                busy={saved[r.sign.slug] === "Saving…"}
                busyText="Publishing…"
                icon="fa-paper-plane"
                disabled={d.text.trim().length < 20}
                className={`${btnPrimary} mt-3`}
              >
                Publish
              </Btn>
            </div>
          );
        })}
      </div>
    </>
  );
}
