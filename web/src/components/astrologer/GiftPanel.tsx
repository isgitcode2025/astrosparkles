"use client";

import { Link, useLocaleRouter } from "@/components/i18n";
import { useState } from "react";
import { api, ApiRequestError, session, type GiftItem } from "@/lib/api";
import { Spinner } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import type { Lang } from "@/lib/i18n";

/** "Send Gift / सादर दक्षिणा": pick a gift and pay it from the wallet. */
export function GiftPanel({ astrologerId, slug, name, gifts, lang = "en" }: { astrologerId: string; slug: string; name: string; gifts: GiftItem[]; lang?: Lang }) {
  const hi = lang === "hi";
  const router = useLocaleRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; recharge?: boolean } | null>(null);
  const item = gifts.find((g) => g.slug === selected);

  const send = async () => {
    if (!item) return;
    if (!session.get()) return router.push(`/login?next=/astrologer/${slug}%23gifts`);
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ balance: number }>(`/astrologers/${astrologerId}/gifts`, { method: "POST", auth: true, body: JSON.stringify({ gift: item.slug }) });
      window.dispatchEvent(new Event("kj-wallet"));
      setMsg({
        ok: true,
        text: hi
          ? `${item.emoji} ${item.en} ${name} को भेजा गया। वॉलेट बैलेंस: ₹${r.balance.toLocaleString("en-IN")}।`
          : `${item.emoji} ${item.en} sent to ${name}. Wallet balance: ₹${r.balance.toLocaleString("en-IN")}.`,
      });
      toast.success(hi ? `${item.en} ${name} को भेजा गया।` : `${item.en} sent to ${name}.`);
      setSelected(null);
    } catch (e) {
      const text = e instanceof ApiRequestError ? e.message : hi ? "उपहार नहीं भेजा जा सका" : "Could not send the gift";
      setMsg({ ok: false, text, recharge: /balance|add ₹/i.test(text) });
    } finally {
      setBusy(false);
    }
  };

  if (gifts.length === 0) return null;
  return (
    <section id="gifts" className="scroll-mt-28 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-dark">
            <span>
              {hi ? <span className="font-mukta">सादर दक्षिणा</span> : "Send Gift"}
            </span>
            <span className="text-base">🎁</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">{hi ? "अपने ज्योतिषी के प्रति आभार व्यक्त करें। आपके वॉलेट से भुगतान होगा।" : "Express gratitude to your astrologer. Paid from your wallet."}</p>
        </div>
        <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 sm:inline">{hi ? "आभार का प्रतीक" : "Token of Gratitude"}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-2 sm:grid-cols-5" role="radiogroup" aria-label="Gifts">
        {gifts.map((g) => {
          const on = selected === g.slug;
          return (
            <button
              key={g.slug}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSelected(on ? null : g.slug)}
              className={`group flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 hover:border-brand-saffron hover:bg-[#FFF9F2] ${
                on ? "border-2 border-brand-saffron bg-[#FFF9F2] shadow-xs" : "border border-stone-200"
              }`}
            >
              <span className="mb-1 text-2xl transition-transform group-hover:scale-110">{g.emoji}</span>
              <span className={`text-xs ${on ? "font-bold text-brand-dark" : "font-semibold text-stone-700"}`}>{g.en}</span>
              <span className="mt-0.5 text-xs font-bold text-brand-saffron">₹{g.price}</span>
            </button>
          );
        })}
      </div>
      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text}{" "}
          {msg.recharge && (
            <Link href="/wallet" className="font-semibold underline">
              {hi ? "वॉलेट रिचार्ज करें" : "Recharge wallet"}
            </Link>
          )}
        </p>
      )}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={send}
          disabled={!item || busy}
          className={`w-full rounded-lg px-8 py-2.5 font-heading text-xs font-bold uppercase tracking-wider transition-all sm:w-auto ${
            item ? "bg-brand-saffron text-white hover:bg-brand-saffronHover" : "cursor-not-allowed bg-stone-100 text-stone-500"
          }`}
        >
          {busy && <Spinner className="mr-2" />}
          {busy ? (hi ? "भेजा जा रहा है…" : "Sending…") : item ? (hi ? `${item.en} भेजें · ₹${item.price}` : `Send ${item.en} · ₹${item.price}`) : hi ? "एक उपहार चुनें" : "Select a gift"}
        </button>
      </div>
    </section>
  );
}
