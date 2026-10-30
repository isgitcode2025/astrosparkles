"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";

type Result = {
  lifePath: number;
  birthday: number;
  destiny: number | null;
  soulUrge: number | null;
  personality: number | null;
  personalYear: number;
};

const meaning: Record<string, string> = {
  lifePath: "Your core path and natural strengths",
  birthday: "A special talent you were born with",
  destiny: "What you are meant to achieve (from your full name)",
  soulUrge: "Your inner wishes (vowels of your name)",
  personality: "How others first see you (consonants of your name)",
  personalYear: "The theme of the current year for you",
};
const titles: Record<string, string> = {
  lifePath: "Life path",
  birthday: "Birthday number",
  destiny: "Destiny (expression)",
  soulUrge: "Soul urge",
  personality: "Personality",
  personalYear: "Personal year",
};

export default function NumerologyPage() {
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
      setError(e instanceof ApiRequestError ? e.message : "Could not calculate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ToolHero
        crumbs={[["Calculators"], ["Numerology"]]}
        eyebrow="Ank Jyotish"
        title="Numerology Calculator"
        subtitle="Find your life path, destiny, soul urge and personal year numbers."
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
            Full name (as commonly used)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary"
            />
          </label>
          <label className="label">
            Date of birth
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2.5 font-normal outline-none focus:border-brand-primary"
            />
          </label>
          <Btn type="submit" busy={busy} busyText="Calculating…" disabled={!dob} className="btn-primary">
            Calculate
          </Btn>
        </form>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {r && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(r)
              .filter(([, v]) => v !== null)
              .map(([k, v]) => (
                <div key={k} className="card">
                  <p className="text-sm text-slate-500">{titles[k]}</p>
                  <p className="font-heading text-4xl font-extrabold text-brand-primary">{v}</p>
                  <p className="mt-1 text-sm text-slate-600">{meaning[k]}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
