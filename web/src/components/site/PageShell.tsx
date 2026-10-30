import type { ReactNode } from "react";

/** Standard page heading used across inner pages (Stitch theme: indigo title, slate subtitle). */
export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1 text-brand-saffron">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-indigo sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-slate-600 sm:text-lg">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Centred empty / info state with an icon and optional action. */
export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-cream text-xl text-brand-saffron">
        <i className={`fa-solid ${icon}`} aria-hidden />
      </div>
      <p className="font-heading text-lg font-bold text-brand-indigo">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  started: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  confirmed: "bg-indigo-50 text-brand-indigo ring-indigo-200",
  requested: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  refunded: "bg-red-50 text-red-700 ring-red-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-red-50 text-red-700 ring-red-200",
  missed: "bg-stone-100 text-stone-600 ring-stone-200",
  expired: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {label ?? status}
    </span>
  );
}
