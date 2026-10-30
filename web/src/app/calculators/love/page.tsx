"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

export default function LoveCalculatorPage() {
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
      toast.error(e instanceof ApiRequestError ? e.message : "Could not calculate");
    } finally {
      setBusy(false);
    }
  };
  const input = "mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary";

  return (
    <>
      <ToolHero
        crumbs={[["Calculators"], ["Love Calculator"]]}
        eyebrow="Just for fun"
        title="Love Calculator"
        subtitle="A fun name match. For real compatibility, try Kundli Matching."
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
            Your name
            <input required value={a} onChange={(e) => setA(e.target.value)} maxLength={60} className={input} />
          </label>
          <label className="label">
            Partner&apos;s name
            <input required value={b} onChange={(e) => setB(e.target.value)} maxLength={60} className={input} />
          </label>
          <Btn type="submit" busy={busy} busyText="Calculating…" className="btn-primary">
            Calculate
          </Btn>
        </form>
        {score !== null && (
          <div className="card mt-6 text-center">
            <p className="text-6xl font-bold text-brand-accent">{score}%</p>
            <p className="mt-2 text-sm text-slate-500">For entertainment only</p>
          </div>
        )}
      </div>
    </>
  );
}
