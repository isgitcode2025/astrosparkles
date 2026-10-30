"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";
import { useLang } from "@/components/i18n";

type Result = {
  lifePath: number;
  birthday: number;
  destiny: number | null;
  soulUrge: number | null;
  personality: number | null;
  personalYear: number;
};

const text = {
  en: {
    crumbs: ["Calculators", "Numerology"],
    eyebrow: "Ank Jyotish",
    title: "Numerology Calculator",
    subtitle: "Find your life path, destiny, soul urge and personal year numbers.",
    name: "Full name (as commonly used)",
    dob: "Date of birth",
    calculate: "Calculate",
    calculating: "Calculating…",
    error: "Could not calculate",
    meaning: {
      lifePath: "Your core path and natural strengths",
      birthday: "A special talent you were born with",
      destiny: "What you are meant to achieve (from your full name)",
      soulUrge: "Your inner wishes (vowels of your name)",
      personality: "How others first see you (consonants of your name)",
      personalYear: "The theme of the current year for you",
    } as Record<string, string>,
    titles: {
      lifePath: "Life path",
      birthday: "Birthday number",
      destiny: "Destiny (expression)",
      soulUrge: "Soul urge",
      personality: "Personality",
      personalYear: "Personal year",
    } as Record<string, string>,
  },
  hi: {
    crumbs: ["कैलकुलेटर", "अंक ज्योतिष"],
    eyebrow: "अंक ज्योतिष",
    title: "अंक ज्योतिष कैलकुलेटर",
    subtitle: "अपना जीवन पथ अंक, भाग्यांक, आत्मा की इच्छा और व्यक्तिगत वर्ष अंक जानें।",
    name: "पूरा नाम (जैसा आमतौर पर इस्तेमाल होता है)",
    dob: "जन्म तिथि",
    calculate: "गणना करें",
    calculating: "गणना हो रही है…",
    error: "गणना नहीं हो सकी",
    meaning: {
      lifePath: "आपका मूल मार्ग और स्वाभाविक शक्तियां",
      birthday: "वह विशेष प्रतिभा जिसके साथ आप जन्मे हैं",
      destiny: "आप क्या हासिल करने के लिए बने हैं (आपके पूरे नाम से)",
      soulUrge: "आपकी आंतरिक इच्छाएं (आपके नाम के स्वर)",
      personality: "दूसरे आपको पहली बार कैसे देखते हैं (आपके नाम के व्यंजन)",
      personalYear: "आपके लिए इस वर्ष की मुख्य थीम",
    } as Record<string, string>,
    titles: {
      lifePath: "जीवन पथ अंक",
      birthday: "जन्मदिन अंक",
      destiny: "भाग्यांक (एक्सप्रेशन)",
      soulUrge: "आत्मा की इच्छा",
      personality: "व्यक्तित्व",
      personalYear: "व्यक्तिगत वर्ष",
    } as Record<string, string>,
  },
};

export default function NumerologyPage() {
  const lang = useLang();
  const l = text[lang];
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [r, setR] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      setR(
        await api<Result>("/calculators/numerology", {
          method: "POST",
          body: JSON.stringify({
            dateOfBirth: dob,
            fullName: name || undefined,
          }),
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
          className="card grid items-end gap-4 sm:grid-cols-[1fr_200px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="label">
            {l.name}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary"
            />
          </label>
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
            {l.calculate}
          </Btn>
        </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {r && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(r)
              .filter(([, v]) => v !== null)
              .map(([k, v]) => (
                <div key={k} className="card">
                  <p className="text-sm text-slate-500">{l.titles[k]}</p>
                  <p className="font-heading text-4xl font-extrabold text-brand-primary">{v}</p>
                  <p className="mt-1 text-sm text-slate-600">{l.meaning[k]}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
