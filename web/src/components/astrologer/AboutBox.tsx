"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";

/** About text, collapsed to a few lines with Read more when it is long. */
export function AboutBox({ text, textHi, lang = "en" }: { text: string; textHi?: string; lang?: Lang }) {
  const [open, setOpen] = useState(false);
  const long = text.length + (textHi?.length ?? 0) > 360;
  return (
    <>
      <div className={`space-y-3 text-sm leading-relaxed text-stone-600 ${!open && long ? "line-clamp-4" : ""}`}>
        <p className="whitespace-pre-line">{text}</p>
        {textHi && <p className="whitespace-pre-line font-mukta">{textHi}</p>}
      </div>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-sm font-semibold text-brand-saffron hover:underline">
          <span>{open ? (lang === "hi" ? "कम दिखाएं" : "Show less") : lang === "hi" ? "और पढ़ें" : "Read more"}</span>
          <i className={`fa-solid fa-chevron-down text-[11px] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      )}
    </>
  );
}
