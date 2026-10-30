"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type Place = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  label: string;
};

/** Birth place autocomplete backed by /places/search (offline city database on our API). */
export function PlaceSearch({
  value,
  onChange,
  label = "Birth place",
  required,
}: {
  value: Place | null;
  onChange: (p: Place | null) => void;
  label?: string;
  required?: boolean;
}) {
  const [q, setQ] = useState(value?.label ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => setQ(value?.label ?? ""), [value]);

  const search = (text: string) => {
    setQ(text);
    onChange(null);
    clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      api<Place[]>(`/places/search?q=${encodeURIComponent(text.trim())}`)
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 250);
  };

  return (
    <label className="label relative">
      {label}
      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing a city, e.g. Indore"
        autoComplete="off"
        required={required}
        className={`field ${q && !value ? "!border-amber-400" : ""}`}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-brand-border bg-white py-1 font-normal shadow-elevated">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-brand-cream"
              >
                {p.label}
                <span className="ml-2 text-xs text-brand-text/50">{p.timezone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q && !value && <span className="mt-1 block text-xs font-normal text-amber-700">Pick a place from the list</span>}
    </label>
  );
}
