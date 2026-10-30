"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";
import { useLang } from "@/components/i18n";

type Result = {
  driver: number;
  conductor: number;
  grid: { number: number; count: number }[][];
  missing: number[];
  repeated: number[];
  completePlanes: string[];
};

const text = {
  en: {
    crumbs: ["Calculators", "Lo Shu Grid"],
    eyebrow: "Numerology grid",
    title: "Lo Shu Grid Calculator",
    subtitle: "See which numbers are strong, repeated or missing in your date of birth.",
    dob: "Date of birth",
    submit: "Show my grid",
    calculating: "Calculating…",
    error: "Could not calculate",
    driver: "Driver (moolank):",
    conductor: "Conductor (bhagyank):",
    missing: "Missing numbers:",
    repeated: "Repeated numbers:",
    planes: "Complete planes:",
    none: "None",
  },
  hi: {
    crumbs: ["कैलकुलेटर", "लो शू ग्रिड"],
    eyebrow: "अंक ज्योतिष ग्रिड",
    title: "लो शू ग्रिड कैलकुलेटर",
    subtitle: "जानें आपकी जन्मतिथि में कौन से अंक प्रबल, दोहराए गए या अनुपस्थित हैं।",
    dob: "जन्म तिथि",
    submit: "मेरा ग्रिड दिखाएं",
    calculating: "गणना हो रही है…",
    error: "गणना नहीं हो सकी",
    driver: "ड्राइवर (मूलांक):",
    conductor: "कंडक्टर (भाग्यांक):",
    missing: "अनुपस्थित अंक:",
    repeated: "दोहराए गए अंक:",
    planes: "पूर्ण रेखाएं:",
    none: "कोई नहीं",
  },
};

export default function LoShuPage() {
  const lang = useLang();
  const l = text[lang];
  const [dob, setDob] = useState("");
  const [r, setR] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      setR(
        await api<Result>("/calculators/lo-shu-grid", {
          method: "POST",
          body: JSON.stringify({ dateOfBirth: dob }),
        }),
      );
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : l.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ToolHero
        crumbs={[[l.crumbs[0]], [l.crumbs[1]]]}
        eyebrow={l.eyebrow}
        title={l.title}
        subtitle={l.subtitle}
        lang={lang}
      />
      <div className="container-site relative -mt-16 pb-16">
        <form
          className="card flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="label">
            {l.dob}
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary"
            />
          </label>
          <Btn type="submit" busy={busy} busyText={l.calculating} disabled={!dob} className="btn-primary">
            {l.submit}
          </Btn>
        </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {r && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="card">
              <div className="mx-auto grid w-fit grid-cols-3 gap-1">
                {r.grid.flat().map((c) => (
                  <div
                    key={c.number}
                    className={`flex h-20 w-20 flex-col items-center justify-center rounded-lg border text-2xl font-bold ${
                      c.count ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-dashed border-brand-border text-black/20"
                    }`}
                  >
                    {c.count ? String(c.number).repeat(c.count) : c.number}
                  </div>
                ))}
              </div>
            </div>
            <div className="card space-y-3">
              <p>
                <strong>{l.driver}</strong> {r.driver}
              </p>
              <p>
                <strong>{l.conductor}</strong> {r.conductor}
              </p>
              <p>
                <strong>{l.missing}</strong> {r.missing.length ? r.missing.join(", ") : l.none}
              </p>
              <p>
                <strong>{l.repeated}</strong> {r.repeated.length ? r.repeated.join(", ") : l.none}
              </p>
              <p>
                <strong>{l.planes}</strong> {r.completePlanes.length ? r.completePlanes.map((p) => p[0].toUpperCase() + p.slice(1)).join(", ") : l.none}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
