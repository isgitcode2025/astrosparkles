"use client";

import { ToolHero } from "@/components/site/ToolHero";
import { useCallback, useEffect, useState } from "react";
import { PlaceSearch, type Place } from "@/components/astro/PlaceSearch";
import { api, ApiRequestError } from "@/lib/api";
import { Btn } from "@/components/ui/Button";
import { ResultSkeleton } from "@/components/ui/ResultSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useLang } from "@/components/i18n";

type Span = { start: string | null; end: string | null } | null;
type Slot = {
  name: string;
  start: string | null;
  end: string | null;
  good: boolean;
};
type Panchang = {
  date: string;
  place: { id: string; label: string; timezone: string };
  weekday: { name: string; lord: string } | null;
  tithi: { name: string; paksha: string; number: number } | null;
  nakshatra: { name: string; pada: number; lord: string } | null;
  yoga: { name: string } | null;
  karana: { name: string } | null;
  sunrise: string | null;
  sunset: string | null;
  rahuKaal: Span;
  gulikaKaal: Span;
  yamaganda: Span;
  abhijitMuhurat: Span;
  choghadiya: { day: Slot[]; night: Slot[] } | null;
};

const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const span = (s: Span) => (s?.start && s?.end ? `${s.start} – ${s.end}` : "—");

export default function PanchangPage() {
  const lang = useLang();
  const hi = lang === "hi";
  const [place, setPlace] = useState<Place | null>(null);
  const [date, setDate] = useState(todayIST());
  const [p, setP] = useState<Panchang | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (d: string, pl: Place | null) => {
      setBusy(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ date: d });
        if (pl) qs.set("placeId", pl.id);
        setP(await api<Panchang>(`/astro/panchang?${qs}`));
      } catch (e) {
        setError(e instanceof ApiRequestError ? e.message : hi ? "पंचांग लोड नहीं हो सका" : "Could not load panchang");
      } finally {
        setBusy(false);
      }
    },
    [hi],
  );

  useEffect(() => {
    load(todayIST(), null);
  }, [load]);

  const facts = p
    ? [
        [hi ? "तिथि" : "Tithi", p.tithi ? `${p.tithi.paksha} ${p.tithi.name}` : "—"],
        [hi ? "नक्षत्र" : "Nakshatra", p.nakshatra ? `${p.nakshatra.name} (${hi ? "पद" : "pada"} ${p.nakshatra.pada})` : "—"],
        [hi ? "योग" : "Yoga", p.yoga?.name ?? "—"],
        [hi ? "करण" : "Karana", p.karana?.name ?? "—"],
        [hi ? "वार" : "Vaar", p.weekday ? `${p.weekday.name} (${p.weekday.lord})` : "—"],
        [hi ? "सूर्योदय / सूर्यास्त" : "Sunrise / Sunset", `${p.sunrise ?? "—"} / ${p.sunset ?? "—"}`],
      ]
    : [];

  return (
    <>
      <ToolHero
        crumbs={[[hi ? "पंचांग" : "Panchang"]]}
        eyebrow={hi ? "हिंदू पंचांग" : "Hindu calendar"}
        title={hi ? "आज का पंचांग" : "Today's Panchang"}
        subtitle={
          hi
            ? "किसी भी शहर और तिथि के लिए तिथि, नक्षत्र, योग, करण, राहु काल, अभिजीत मुहूर्त और चौघड़िया।"
            : "Tithi, nakshatra, yoga, karana, Rahu kaal, Abhijit muhurat and choghadiya for any city and date."
        }
      />
      <div className="container-site relative -mt-16 pb-16">
        <form
          className="card grid items-end gap-4 sm:grid-cols-[1fr_200px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            load(date, place);
          }}
        >
          <PlaceSearch value={place} onChange={setPlace} label={hi ? "शहर" : "City"} />
          <label className="label">
            {hi ? "तिथि" : "Date"}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </label>
          <Btn type="submit" busy={busy} busyText={hi ? "लोड हो रहा है…" : "Loading…"} icon="fa-magnifying-glass" className="btn-primary">
            {hi ? "दिखाएं" : "Show"}
          </Btn>
        </form>

        {error && (
          <div className="mt-6">
            <ErrorState compact title={hi ? "पंचांग लोड नहीं हो सका" : "Could not load the panchang"} text={error} onRetry={() => load(date, place)} />
          </div>
        )}

        {busy && <ResultSkeleton />}
        {!busy && p && (
          <div className="mt-6 space-y-6">
            <div className="card">
              <h2 className="font-heading text-xl font-bold text-brand-primary">
                {new Date(`${p.date}T00:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm text-slate-500">{p.place.label} · {hi ? "समय स्थानीय समय में" : "times in local time"}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-brand-border bg-brand-cream/50 p-3">
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-heading font-bold text-brand-indigo">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card border-green-200 bg-emerald-50/50">
                <p className="text-sm font-semibold text-emerald-800">
                  <i className="fa-solid fa-sun mr-1.5" aria-hidden />
                  {hi ? "अभिजीत मुहूर्त (शुभ)" : "Abhijit muhurat (auspicious)"}
                </p>
                <p className="mt-1 font-heading text-lg font-bold text-brand-indigo">{span(p.abhijitMuhurat)}</p>
              </div>
              {(
                [
                  [hi ? "राहु काल" : "Rahu kaal", p.rahuKaal],
                  [hi ? "गुलिक काल" : "Gulika kaal", p.gulikaKaal],
                  [hi ? "यमगंड" : "Yamaganda", p.yamaganda],
                ] as const
              ).map(([k, s]) => (
                <div key={k} className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
                  <p className="text-sm font-semibold text-red-800">
                    <i className="fa-solid fa-ban mr-1.5" aria-hidden />
                    {k} ({hi ? "नया काम शुरू न करें" : "avoid new work"})
                  </p>
                  <p className="mt-1 font-heading text-lg font-bold text-brand-indigo">{span(s)}</p>
                </div>
              ))}
            </div>

            {p.choghadiya && (
              <div className="grid gap-6 md:grid-cols-2">
                {(["day", "night"] as const).map((part) => (
                  <div key={part} className="card">
                    <h2 className="font-heading text-lg font-bold text-brand-primary">
                      {part === "day" ? (hi ? "दिन का चौघड़िया" : "Day choghadiya") : hi ? "रात का चौघड़िया" : "Night choghadiya"}
                    </h2>
                    <ul className="mt-3 divide-y divide-brand-border text-sm">
                      {p.choghadiya![part].map((s, i) => (
                        <li key={i} className="flex items-center justify-between py-2">
                          <span className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.good ? "bg-emerald-500" : "bg-red-500"}`} />
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-slate-400">{s.good ? (hi ? "शुभ" : "good") : hi ? "अशुभ" : "avoid"}</span>
                          </span>
                          <span className="font-mono text-xs">
                            {s.start} – {s.end}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
