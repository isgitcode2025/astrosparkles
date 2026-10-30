import { Link } from "@/components/i18n";
import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

/** Indigo hero band used on tool and content pages (Stitch theme). Content below can overlap it with -mt-*. */
export function ToolHero({
  crumbs = [],
  eyebrow,
  title,
  subtitle,
  chips = [],
  children,
  pad = "pb-24",
  lang = "en",
}: {
  crumbs?: [string, string?][];
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  chips?: [string, string][];
  children?: ReactNode;
  pad?: string;
  lang?: Lang;
}) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br from-brand-indigo via-[#2d1a63] to-brand-midnight pt-8 text-white sm:pt-10 ${pad}`}>
      <div className="bg-mandala pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-saffron/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl" />
      <div className="container-site relative">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="hover:text-white">
              {lang === "hi" ? "होम" : "Home"}
            </Link>
            {crumbs.map(([label, href]) => (
              <span key={label} className="flex items-center gap-1.5">
                <i className="fa-solid fa-chevron-right text-[8px]" aria-hidden />
                {href ? (
                  <Link href={href} className="hover:text-white">
                    {label}
                  </Link>
                ) : (
                  <span className="text-white/90">{label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">{eyebrow}</p>}
        <h1 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-base text-white/75 sm:text-lg">{subtitle}</p>}
        {chips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {chips.map(([icon, text]) => (
              <span
                key={text}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 ring-1 ring-white/15"
              >
                <i className={`fa-solid ${icon} text-brand-gold`} aria-hidden />
                {text}
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Small side card with an icon list, used next to forms ("What you get"). */
export function InfoList({ title, items }: { title: string; items: [string, string, string][] }) {
  return (
    <div className="card">
      <h2 className="font-heading text-base font-bold text-brand-primary">{title}</h2>
      <ul className="mt-4 space-y-4">
        {items.map(([icon, head, text]) => (
          <li key={head} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-saffron">
              <i className={`fa-solid ${icon} text-sm`} aria-hidden />
            </span>
            <span className="text-sm">
              <span className="block font-semibold text-brand-indigo">{head}</span>
              <span className="text-slate-600">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dark call-to-action strip linking to astrologers. */
export function ConsultCta({
  text = "Want a personal reading? Talk to a verified astrologer.",
  href = "/astrologers",
  cta = "Talk to an astrologer",
}: {
  text?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-indigo to-brand-midnight p-6 text-white shadow-celestial sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="bg-mandala pointer-events-none absolute inset-0 opacity-[0.06]" />
      <p className="relative font-heading text-lg font-bold">{text}</p>
      <Link href={href} className="btn-primary relative mt-4 shrink-0 sm:mt-0">
        <i className="fa-solid fa-comments" aria-hidden /> {cta}
      </Link>
    </div>
  );
}
