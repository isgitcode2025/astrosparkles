"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading, Skel } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError, type WeeklySchedule } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
type Window = { day: number; start: string; end: string };

/** Weekly hours editor for scheduled sessions. Several windows per day; times in IST. */
export function ScheduleEditor({ lang = "en" }: { lang?: Lang }) {
  const hi = lang === "hi";
  const [s, setS] = useState<WeeklySchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    setLoadFailed(false);
    return api<WeeklySchedule>("/astrologers/me/schedule", { auth: true })
      .then(setS)
      .catch(() => setLoadFailed(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loadFailed) return <ErrorState compact title={hi ? "आपका शेड्यूल लोड नहीं हो सका" : "Could not load your schedule"} onRetry={load} lang={lang} />;
  if (!s)
    return (
      <Loading label={hi ? "आपका शेड्यूल लोड हो रहा है" : "Loading your schedule"} className="space-y-3">
        <Skel className="h-8 w-80 max-w-full" />
        {Array.from({ length: 7 }, (_, i) => (
          <Skel key={i} className="h-12 w-full !rounded-xl" />
        ))}
      </Loading>
    );

  const update = (patch: Partial<WeeklySchedule>) => {
    setMsg(null);
    setS({ ...s, ...patch });
  };
  const setWindow = (i: number, patch: Partial<Window>) => update({ days: s.days.map((w, j) => (j === i ? { ...w, ...patch } : w)) });
  const addWindow = (day: number) => {
    const last = s.days.filter((w) => w.day === day).at(-1);
    const start = last ? last.end : "10:00";
    const h = Math.min(23, Number(start.slice(0, 2)) + 2);
    update({ days: [...s.days, { day, start, end: `${String(h).padStart(2, "0")}:${start.slice(3)}` }] });
  };
  const copyToWeekdays = (day: number) => {
    const src = s.days.filter((w) => w.day === day);
    const others = [1, 2, 3, 4, 5, 6].filter((d) => d !== day);
    update({ days: [...s.days.filter((w) => w.day === day || !others.includes(w.day)), ...others.flatMap((d) => src.map((w) => ({ ...w, day: d })))] });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const saved = await api<WeeklySchedule>("/astrologers/me/schedule", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ enabled: s.enabled, slotMinutes: s.slotMinutes, days: s.days }),
      });
      setS(saved);
      toast.success(
        saved.enabled
          ? hi
            ? "शेड्यूल सेव हो गया। यूज़र्स अब आपके खुले स्लॉट बुक कर सकते हैं।"
            : "Schedule saved. Users can now book your open slots."
          : hi
            ? "शेड्यूल सेव हो गया। शेड्यूल्ड सेशन बंद कर दिए गए हैं।"
            : "Schedule saved. Scheduled sessions are switched off.",
      );
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiRequestError ? e.message : hi ? "सेव नहीं हो सका" : "Could not save" });
      toast.error(e instanceof ApiRequestError ? e.message : hi ? "शेड्यूल सेव नहीं हो सका" : "Could not save the schedule");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-[8.25rem] rounded-lg border border-brand-border px-2 py-1.5 text-sm outline-none focus:border-brand-saffron";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-3">
          <span className="relative inline-flex">
            <input type="checkbox" className="peer sr-only" checked={s.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
            <span className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-saffron" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
          <span className="text-sm font-semibold text-brand-indigo">{hi ? "शेड्यूल्ड सेशन स्वीकार करें" : "Accept scheduled sessions"}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {hi ? "स्लॉट की अवधि" : "Slot length"}
          <select value={s.slotMinutes} onChange={(e) => update({ slotMinutes: Number(e.target.value) as WeeklySchedule["slotMinutes"] })} className="rounded-lg border border-brand-border px-2 py-1.5 text-sm">
            {[15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {hi ? `${m} मिनट` : `${m} min`}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-slate-500">{hi ? "समय IST में हैं।" : "Times are in IST."}</span>
      </div>

      <div className="divide-y divide-brand-border rounded-2xl border border-brand-border">
        {(hi ? DAYS_HI : DAYS).map((label, day) => {
          const windows = s.days.map((w, i) => ({ ...w, i })).filter((w) => w.day === day);
          return (
            <div key={day} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start">
              <span className="w-12 pt-1.5 text-sm font-bold text-brand-indigo">{label}</span>
              <div className="flex-1 space-y-2">
                {windows.length === 0 && <p className="pt-1.5 text-sm text-slate-400">{hi ? "अनुपलब्ध" : "Unavailable"}</p>}
                {windows.map((w) => (
                  <div key={w.i} className="flex flex-wrap items-center gap-2">
                    <input type="time" step={900} value={w.start} onChange={(e) => setWindow(w.i, { start: e.target.value })} className={input} aria-label={`${label} start`} />
                    <span className="text-slate-400">{hi ? "से" : "to"}</span>
                    <input type="time" step={900} value={w.end} onChange={(e) => setWindow(w.i, { end: e.target.value })} className={input} aria-label={`${label} end`} />
                    <button type="button" onClick={() => update({ days: s.days.filter((_, j) => j !== w.i) })} aria-label={hi ? "घंटे हटाएं" : "Remove hours"} className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <i className="fa-solid fa-trash-can text-xs" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 text-xs font-semibold">
                <button type="button" onClick={() => addWindow(day)} className="text-brand-saffron hover:underline">
                  {hi ? "+ घंटे जोड़ें" : "+ Add hours"}
                </button>
                {windows.length > 0 && day >= 1 && day <= 6 && (
                  <button type="button" onClick={() => copyToWeekdays(day)} className="text-slate-500 hover:text-brand-indigo hover:underline">
                    {hi ? "सोम–शनि में कॉपी करें" : "Copy to Mon–Sat"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn onClick={save} busy={saving} busyText={hi ? "सेव हो रहा है…" : "Saving…"} icon="fa-floppy-disk" className="btn-primary">
          {hi ? "शेड्यूल सेव करें" : "Save schedule"}
        </Btn>
        {msg && !msg.ok && <p className="text-sm text-red-600">{msg.text}</p>}
      </div>
    </div>
  );
}
