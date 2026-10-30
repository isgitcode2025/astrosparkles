"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { useLang } from "@/components/i18n";

const text = {
  en: {
    crumbs: ["Calculators", "Love Calculator"],
    eyebrow: "Just for fun",
    title: "Love Calculator",
    subtitle: "A fun name match. For real compatibility, try Kundli Matching.",
    yourName: "Your name",
    partnerName: "Partner's name",
    calculate: "Calculate",
    calculating: "Calculating…",
    error: "Could not calculate",
    forFunOnly: "For entertainment only",
  },
  hi: {
    crumbs: ["कैलकुलेटर", "लव कैलकुलेटर"],
    eyebrow: "सिर्फ मनोरंजन के लिए",
    title: "लव कैलकुलेटर",
    subtitle: "नामों का मज़ेदार मिलान। वास्तविक अनुकूलता के लिए कुंडली मिलान आज़माएं।",
    yourName: "आपका नाम",
    partnerName: "साथी का नाम",
    calculate: "गणना करें",
    calculating: "गणना हो रही है…",
    error: "गणना नहीं हो सकी",
    forFunOnly: "केवल मनोरंजन के लिए",
  },
};

export default function LoveCalculatorPage() {
  const lang = useLang();
  const l = text[lang];
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await api<{ score: number }>("/calculators/love", {
        method: "POST",
        body: JSON.stringify({ yourName: a, partnerName: b }),
      });
      setScore(r.score);
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : l.error);
    } finally {
      setBusy(false);
    }
  };
  const input = "mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary";

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
          className="card grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="label">
            {l.yourName}
            <input required value={a} onChange={(e) => setA(e.target.value)} maxLength={60} className={input} />
          </label>
          <label className="label">
            {l.partnerName}
            <input required value={b} onChange={(e) => setB(e.target.value)} maxLength={60} className={input} />
          </label>
          <Btn type="submit" busy={busy} busyText={l.calculating} className="btn-primary">
            {l.calculate}
          </Btn>
        </form>
        {score !== null && (
          <div className="card mt-6 text-center">
            <p className="text-6xl font-bold text-brand-accent">{score}%</p>
            <p className="mt-2 text-sm text-slate-500">{l.forFunOnly}</p>
          </div>
        )}
      </div>
    </>
  );
}
