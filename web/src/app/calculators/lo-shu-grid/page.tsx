"use client";

import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import { ToolHero } from "@/components/site/ToolHero";
import { Btn } from "@/components/ui/Button";

type Result = {
  driver: number;
  conductor: number;
  grid: { number: number; count: number }[][];
  missing: number[];
  repeated: number[];
  completePlanes: string[];
};

export default function LoShuPage() {
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
      setError(e instanceof ApiRequestError ? e.message : "Could not calculate");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ToolHero
        crumbs={[["Calculators"], ["Lo Shu Grid"]]}
        eyebrow="Numerology grid"
        title="Lo Shu Grid Calculator"
        subtitle="See which numbers are strong, repeated or missing in your date of birth."
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
            Show my grid
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
                <strong>Driver (moolank):</strong> {r.driver}
              </p>
              <p>
                <strong>Conductor (bhagyank):</strong> {r.conductor}
              </p>
              <p>
                <strong>Missing numbers:</strong> {r.missing.length ? r.missing.join(", ") : "None"}
              </p>
              <p>
                <strong>Repeated numbers:</strong> {r.repeated.length ? r.repeated.join(", ") : "None"}
              </p>
              <p>
                <strong>Complete planes:</strong> {r.completePlanes.length ? r.completePlanes.map((p) => p[0].toUpperCase() + p.slice(1)).join(", ") : "None"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
