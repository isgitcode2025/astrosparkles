"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Btn } from "./Button";
import type { Lang } from "@/lib/i18n";

/**
 * Shown when something could not be loaded. Retry calls `onRetry`, or refreshes the
 * server-rendered page when no handler is given.
 */
export function ErrorState({
  title,
  text,
  onRetry,
  compact = false,
  lang = "en",
}: {
  title?: string;
  text?: string;
  onRetry?: () => unknown;
  compact?: boolean;
  lang?: Lang;
}) {
  const t = lang === "hi" ? "यह लोड नहीं हो सका" : "Could not load this";
  const d = lang === "hi" ? "कृपया अपना कनेक्शन जांचें और फिर से प्रयास करें।" : "Please check your connection and try again.";
  title = title ?? t;
  text = text ?? d;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    try {
      if (onRetry) await onRetry();
      else router.refresh();
    } finally {
      setTimeout(() => setBusy(false), 600);
    }
  };
  return (
    <div role="alert" className={`rounded-2xl border border-red-100 bg-white text-center shadow-soft ${compact ? "px-5 py-6" : "px-6 py-12"}`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
        <i className="fa-solid fa-plug-circle-exclamation" aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold text-brand-indigo">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
      <Btn busy={busy} busyText={lang === "hi" ? "पुनः प्रयास हो रहा है…" : "Retrying…"} icon="fa-rotate-right" onClick={retry} className="btn-outline mt-4">
        {lang === "hi" ? "पुनः प्रयास करें" : "Retry"}
      </Btn>
    </div>
  );
}
