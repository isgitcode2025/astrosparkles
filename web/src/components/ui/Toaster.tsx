"use client";

import { useEffect, useState } from "react";

type Kind = "success" | "error" | "info";
type Item = { id: number; kind: Kind; text: string };
const EVENT = "kj-toast";

/** Show a short message at the bottom of the screen. Works from anywhere (components, hooks, plain functions). */
export const toast = {
  success: (text: string) => emit("success", text),
  error: (text: string) => emit("error", text),
  info: (text: string) => emit("info", text),
};
function emit(kind: Kind, text: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind, text } }));
}

const STYLE: Record<Kind, [string, string]> = {
  success: ["fa-circle-check text-emerald-400", "border-emerald-400/30"],
  error: ["fa-circle-exclamation text-red-400", "border-red-400/30"],
  info: ["fa-circle-info text-brand-gold", "border-white/15"],
};

/** Renders toasts; mounted once in the root layout. */
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const { kind, text } = (e as CustomEvent<{ kind: Kind; text: string }>).detail;
      const id = ++n;
      setItems((list) => [...list.filter((i) => i.text !== text).slice(-2), { id, kind, text }]);
      setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), kind === "error" ? 6000 : 4000);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`toast-in pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border bg-brand-midnight px-4 py-3 text-sm text-white shadow-elevated ${STYLE[t.kind][1]}`}
        >
          <i className={`fa-solid ${STYLE[t.kind][0]} mt-0.5`} aria-hidden />
          <span className="flex-1">{t.text}</span>
          <button type="button" onClick={() => setItems((l) => l.filter((i) => i.id !== t.id))} aria-label="Dismiss" className="text-white/50 hover:text-white">
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
