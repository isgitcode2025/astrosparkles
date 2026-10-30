"use client";

import { useEffect, useRef, useState } from "react";

type Ask = { title: string; text?: string; confirmText?: string; cancelText?: string; danger?: boolean };
type Pending = Ask & { resolve: (ok: boolean) => void };
const EVENT = "kj-confirm";

/** Themed replacement for window.confirm. Resolves true when the person confirms. */
export function confirmDialog(ask: Ask): Promise<boolean> {
  return new Promise((resolve) => window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...ask, resolve } })));
}

/** Renders confirm dialogs; mounted once in the root layout. */
export function ConfirmHost() {
  const [p, setP] = useState<Pending | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const on = (e: Event) => setP((e as CustomEvent<Pending>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  useEffect(() => {
    if (!p) return;
    okRef.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);
  const close = (ok: boolean) => {
    p?.resolve(ok);
    setP(null);
  };
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4" onClick={() => close(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="toast-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-elevated"
      >
        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full ${p.danger ? "bg-red-50 text-red-500" : "bg-brand-cream text-brand-saffron"}`}>
          <i className={`fa-solid ${p.danger ? "fa-triangle-exclamation" : "fa-circle-question"}`} aria-hidden />
        </div>
        <h2 id="confirm-title" className="font-heading text-lg font-bold text-brand-indigo">
          {p.title}
        </h2>
        {p.text && <p className="mt-1 text-sm text-slate-600">{p.text}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => close(false)} className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            {p.cancelText ?? "Keep it"}
          </button>
          <button
            ref={okRef}
            type="button"
            onClick={() => close(true)}
            className={`rounded-full px-4 py-2 text-sm font-bold text-white ${p.danger ? "bg-red-500 hover:bg-red-600" : "bg-brand-saffron hover:bg-brand-saffronHover"}`}
          >
            {p.confirmText ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
