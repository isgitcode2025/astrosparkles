"use client";

import { Link } from "@/components/i18n";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, session, type AstrologerCard, type Master } from "@/lib/api";
import { useStartChat } from "./useStartChat";
import { Spinner } from "@/components/ui/Button";
import type { Lang } from "@/lib/i18n";

const BADGE: Record<string, [string, string]> = {
  "top-rated": ["Top Rated", "border-brand-gold/30 bg-[#FEF9E7] text-brand-gold"],
  new: ["New", "border-indigo-200 bg-indigo-50 text-brand-indigo"],
  celebrity: ["Celebrity", "border-amber-200 bg-amber-50 text-amber-800"],
  verified: ["Verified", "border-emerald-200 bg-emerald-50 text-emerald-700"],
};
const BADGE_HI: Record<string, [string, string]> = {
  "top-rated": ["टॉप रेटेड", "border-brand-gold/30 bg-[#FEF9E7] text-brand-gold"],
  new: ["नया", "border-indigo-200 bg-indigo-50 text-brand-indigo"],
  celebrity: ["सेलिब्रिटी", "border-amber-200 bg-amber-50 text-amber-800"],
  verified: ["सत्यापित", "border-emerald-200 bg-emerald-50 text-emerald-700"],
};
const AVATAR_BG = ["bg-brand-dark text-amber-300 border-amber-200", "bg-brand-indigo text-white border-indigo-200"];

/** Astrologer card for the listing page (Stitch "Astrologer Listing" design). */
export function ListingCard({ a, master, index, lang = "en" }: { a: AstrologerCard; master: Master | null; index: number; lang?: Lang }) {
  const router = useRouter();
  const { start, busy, error } = useStartChat(a.id, a.slug, lang);
  const hi = lang === "hi";
  const [followed, setFollowed] = useState(false);
  const label = (list: { slug?: string; code?: string; en: string }[] | undefined, key: string) => list?.find((x) => (x.slug ?? x.code) === key)?.en ?? key;
  const offer = a.rates.chatOffer !== undefined && a.rates.chatOffer < a.rates.chat;
  const price = offer ? a.rates.chatOffer! : a.rates.chat;
  const badge = a.badges.map((b) => (hi ? BADGE_HI[b] : BADGE[b])).find(Boolean);
  const initials = a.displayName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const follow = async () => {
    if (!session.get()) return router.push(`/login?next=/astrologers`);
    await api(`/astrologers/${a.id}/follow`, { method: "POST", auth: true }).catch(() => undefined);
    setFollowed(true);
  };

  const outline = "flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo";

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle transition-all duration-200 hover:border-[#E8DCF8] hover:shadow-elevated">
      <Link href={`/astrologer/${a.slug}`} className="flex gap-3.5">
        <div className="relative shrink-0">
          {a.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.avatarUrl} alt={a.displayName} width={64} height={64} loading="lazy" className="h-16 w-16 rounded-full border-2 border-amber-100 object-cover" />
          ) : (
            <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 font-heading text-xl font-bold ${AVATAR_BG[index % 2]}`}>{initials}</div>
          )}
          <span
            className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
              a.presence === "online" ? "pulse-online bg-emerald-500" : a.presence === "busy" ? "bg-amber-400" : "bg-slate-300"
            }`}
            title={
              a.presence === "online"
                ? hi
                  ? "अभी ऑनलाइन"
                  : "Online now"
                : a.presence === "busy"
                  ? hi
                    ? "परामर्श में व्यस्त"
                    : "Busy in a consultation"
                  : hi
                    ? "ऑफ़लाइन"
                    : "Offline"
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h3 className="truncate font-heading text-base font-semibold text-brand-text">{a.displayName}</h3>
            {badge && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge[1]}`}>{badge[0]}</span>}
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{a.expertise.map((e) => label(master?.expertise, e)).join(", ")}</p>
          <p className="truncate text-xs font-normal text-slate-500">
            {a.languages.map((l) => label(master?.languages, l)).join(", ")} · {a.experienceYears} {hi ? "वर्ष" : "yrs"}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            {a.rating.count > 0 ? (
              <>
                <span className="flex items-center gap-0.5 text-brand-gold">
                  <i className="fa-solid fa-star text-xs" aria-hidden /> {a.rating.average.toFixed(1)}
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {hi ? `(${a.rating.count} समीक्षा${a.rating.count === 1 ? "" : "एं"})` : `(${a.rating.count} review${a.rating.count === 1 ? "" : "s"})`}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">{hi ? "अभी तक कोई समीक्षा नहीं" : "No reviews yet"}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex flex-col">
          {offer && <span className="text-xs text-slate-400 line-through">₹{a.rates.chat}/{hi ? "मिनट" : "min"}</span>}
          <span className={`font-heading text-sm font-bold ${offer ? "text-brand-saffron" : "text-brand-text"}`}>
            ₹{price}
            <span className="text-xs font-medium text-slate-500">/{hi ? "मिनट" : "min"}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {a.presence === "online" ? (
            <>
              <button
                type="button"
                onClick={start}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-full bg-brand-saffron px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-saffronHover disabled:opacity-60"
              >
                {busy ? <Spinner className="text-xs" /> : <i className="fa-solid fa-comment-dots text-xs" aria-hidden />}
                <span>{busy ? (hi ? "शुरू हो रहा है…" : "Starting…") : hi ? "चैट" : "Chat"}</span>
              </button>
              <button type="button" disabled title={hi ? "वॉइस कॉल जल्द आ रही है" : "Voice calls are coming soon"} className={`${outline} cursor-not-allowed opacity-50`}>
                <i className="fa-solid fa-phone text-xs" aria-hidden />
                <span>{hi ? "कॉल" : "Call"}</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={follow} disabled={followed} className={outline}>
                <i className={`fa-solid ${followed ? "fa-check text-emerald-600" : "fa-bell text-amber-500"} text-xs`} aria-hidden />
                <span>{followed ? (hi ? "फॉलो किया" : "Following") : hi ? "फॉलो करें" : "Follow"}</span>
              </button>
              {a.presence === "busy" ? (
                <span className="cursor-not-allowed rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-400">{hi ? "व्यस्त" : "Busy"}</span>
              ) : (
                <Link href={`/astrologer/${a.slug}`} className={outline}>
                  <i className="fa-regular fa-user text-xs" aria-hidden />
                  <span>{hi ? "प्रोफ़ाइल" : "Profile"}</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error.text}{" "}
          {error.recharge && (
            <Link href="/wallet" className="font-semibold underline">
              {hi ? "रिचार्ज करें" : "Recharge"}
            </Link>
          )}
        </p>
      )}
    </article>
  );
}
