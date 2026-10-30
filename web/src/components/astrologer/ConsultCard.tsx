"use client";

import { Link } from "@/components/i18n";
import type { Rates } from "@/lib/api";
import { BookSession } from "./BookSession";
import { useStartChat } from "./useStartChat";
import { Spinner } from "@/components/ui/Button";

/** Sticky booking card: per-minute fee, Chat / Call (coming soon) and prepaid scheduled sessions. */
export function ConsultCard({
  astrologerId,
  slug,
  rates,
  presence,
  weekCount,
  totalCount,
  name,
}: {
  astrologerId: string;
  slug: string;
  rates: Rates;
  presence: "online" | "busy" | "offline";
  weekCount: number;
  totalCount: number;
  name?: string;
}) {
  const { start: startChat, busy, error } = useStartChat(astrologerId, slug);
  const offer = rates.chatOffer !== undefined && rates.chatOffer < rates.chat;
  const price = offer ? rates.chatOffer! : rates.chat;
  const online = presence === "online";

  const cta =
    "flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-heading text-sm font-bold shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <span className="text-xs font-semibold uppercase text-stone-400">Consultation Fee</span>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-brand-dark">
              ₹ {price}
              <span className="text-sm font-medium text-stone-500">/Min</span>
            </span>
            {offer && <span className="text-sm text-stone-400 line-through">₹ {rates.chat}</span>}
          </div>
          {rates.call > 0 && rates.call !== price && <span className="text-[11px] text-stone-500">Call ₹{rates.callOffer ?? rates.call}/min</span>}
        </div>
        <a href="#gifts" className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-brand-saffron transition-colors hover:bg-amber-100">
          🎁 Gift
        </a>
      </div>

      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-medium text-[#854d0e]">
        <span>📞</span>
        {weekCount > 0 ? (
          <span>
            <strong>{weekCount} consultations</strong> in the past week
          </span>
        ) : totalCount > 0 ? (
          <span>
            <strong>{totalCount.toLocaleString("en-IN")} consultations</strong> completed
          </span>
        ) : (
          <span>New on the platform. First chat free for new users.</span>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={startChat} disabled={!online || busy} aria-busy={busy || undefined} className={`${cta} border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white`}>
            {busy ? <Spinner /> : <i className="fa-solid fa-comment-dots" aria-hidden />}
            <span>{busy ? "STARTING…" : "CHAT"}</span>
          </button>
          <button type="button" disabled title="Voice calls are coming soon" className={`${cta} border-emerald-600 bg-emerald-50 text-emerald-700`}>
            <i className="fa-solid fa-phone" aria-hidden />
            <span>CALL</span>
          </button>
        </div>
        <BookSession astrologerId={astrologerId} slug={slug} name={name} />
        <p className="text-center text-[11px] text-stone-500">
          {online ? "Available now · calls coming soon" : presence === "busy" ? "In another consultation. Try again in a few minutes." : "Offline right now. Follow to find them faster next time."}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.text}{" "}
          {error.recharge && (
            <Link href="/wallet" className="font-semibold underline">
              Recharge now
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
