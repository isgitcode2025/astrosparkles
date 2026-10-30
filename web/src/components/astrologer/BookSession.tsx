"use client";

import { Spinner } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading as SkelLoading, Skel } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";

import { Link } from "@/components/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiRequestError, fmtSlotDate, fmtSlotTime, session, type Booking, type SlotsResponse } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

/** "Book Session" button plus a slot picker dialog. The price is paid from the wallet when booking. */
export function BookSession({ astrologerId, slug, name, lang = "en" }: { astrologerId: string; slug: string; name?: string; lang?: Lang }) {
  const hi = lang === "hi";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; recharge?: boolean } | null>(null);
  const [done, setDone] = useState<Booking | null>(null);

  const load = () =>
    api<SlotsResponse>(`/astrologers/${astrologerId}/slots?days=7`)
      .then((d) => {
        setData(d);
        setLoadError(false);
        const first = d.days.findIndex((x) => x.slots.some((s) => s.available));
        setDayIdx(first < 0 ? 0 : first);
      })
      .catch(() => setLoadError(true));

  // know up front whether this astrologer takes bookings, so the button can say so
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astrologerId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const enabled = !!data?.enabled && data.days.some((d) => d.slots.length > 0);
  const tz = data?.timezone ?? "Asia/Kolkata";
  const day = data?.days[dayIdx];

  const openDialog = () => {
    setPick(null);
    setError(null);
    setDone(null);
    setOpen(true);
    load();
  };

  const book = async () => {
    if (!pick) return;
    if (!session.get()) return router.push(`/login?next=/astrologer/${slug}`);
    setBusy(true);
    setError(null);
    try {
      const b = await api<Booking>("/bookings", { method: "POST", auth: true, body: JSON.stringify({ astrologerId, start: pick, ...(topic.trim() ? { topic: topic.trim() } : {}) }) });
      setDone(b);
      toast.success(hi ? `सत्र बुक हो गया। आपके वॉलेट से ₹${b.amount} भुगतान किया गया।` : `Session booked. ₹${b.amount} paid from your wallet.`);
      window.dispatchEvent(new Event("kj-wallet"));
    } catch (e) {
      const text = e instanceof ApiRequestError ? e.message : hi ? "यह स्लॉट बुक नहीं हो सका" : "Could not book this slot";
      setError({ text, recharge: /balance/i.test(text) });
      if (e instanceof ApiRequestError && e.status === 409) {
        setPick(null);
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={!enabled}
        title={enabled ? (hi ? "प्रीपेड चैट सत्र के लिए समय चुनें" : "Pick a time for a prepaid chat session") : hi ? "इस ज्योतिषी ने अभी तक शेड्यूल्ड सत्र शुरू नहीं किए हैं" : "This astrologer has not opened scheduled sessions yet"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 font-heading text-sm font-bold tracking-wide text-white shadow transition-all hover:bg-brand-indigo disabled:cursor-not-allowed disabled:opacity-60"
      >
        {!data && !loadError ? <Spinner /> : <i className="fa-regular fa-calendar" aria-hidden />}
        <span>{hi ? "सत्र बुक करें" : "BOOK SESSION"}</span>
        {data && !enabled && <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">{hi ? "उपलब्ध नहीं" : "NOT OPEN"}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-elevated sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-stone-100 bg-white px-6 py-4">
              <div>
                <h2 id="book-title" className="font-heading text-lg font-bold text-brand-indigo">
                  {hi ? "चैट सत्र बुक करें" : "Book a chat session"}
                </h2>
                {data && (
                  <p className="text-xs text-stone-500">
                    {name ? `${name} · ` : ""}
                    {data.slotMinutes} {hi ? "मिनट" : "min"} · ₹{data.price} {hi ? "वॉलेट से प्रीपेड" : "prepaid from wallet"}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={hi ? "बंद करें" : "Close"} className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
            </div>

            {done ? (
              <div className="space-y-4 px-6 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
                  <i className="fa-solid fa-check" aria-hidden />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold text-brand-indigo">{hi ? "सत्र बुक हो गया" : "Session booked"}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {fmtSlotDate(done.start, tz)}, {fmtSlotTime(done.start, tz)} – {fmtSlotTime(done.end, tz)} · ₹{done.amount} {hi ? "भुगतान किया गया" : "paid"}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    {hi
                      ? "शुरुआत के समय “मेरी बुकिंग्स” खोलें और जॉइन दबाएं। शुरुआत से 2 घंटे पहले तक रद्द करने पर पूरा रिफंड मिलेगा।"
                      : "Open “My bookings” at the start time and press Join. You can cancel for a full refund up to 2 hours before."}
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Link href="/bookings" className="rounded-full bg-brand-saffron px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-saffronHover">
                    {hi ? "मेरी बुकिंग्स" : "My bookings"}
                  </Link>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50">
                    {hi ? "बंद करें" : "Close"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                {loadError && <ErrorState compact title={hi ? "उपलब्ध समय लोड नहीं हो सके" : "Could not load the available times"} onRetry={load} lang={lang} />}
                {!data && !loadError && (
                  <SkelLoading label={hi ? "उपलब्ध समय लोड हो रहे हैं" : "Loading available times"} className="space-y-5">
                    <div className="flex gap-2 overflow-hidden">
                      {Array.from({ length: 6 }, (_, i) => (
                        <Skel key={i} className="h-[74px] w-[72px] shrink-0 !rounded-2xl" />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 12 }, (_, i) => (
                        <Skel key={i} className="h-9 !rounded-xl" />
                      ))}
                    </div>
                  </SkelLoading>
                )}
                {data && (
                  <>
                    <div className="thin-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      {data.days.map((d, i) => {
                        const free = d.slots.filter((s) => s.available).length;
                        const active = i === dayIdx;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => {
                              setDayIdx(i);
                              setPick(null);
                            }}
                            className={`flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-2 text-center transition-colors ${
                              active ? "border-brand-saffron bg-brand-saffron text-white" : free ? "border-stone-200 bg-white text-brand-indigo hover:border-brand-saffron" : "border-stone-100 bg-stone-50 text-stone-400"
                            }`}
                          >
                            <span className="text-[11px] font-semibold uppercase">{new Date(`${d.date}T12:00:00Z`).toLocaleDateString(hi ? "hi-IN" : "en-IN", { weekday: "short", timeZone: "UTC" })}</span>
                            <span className="font-heading text-lg font-bold leading-tight">{Number(d.date.slice(8))}</span>
                            <span className={`text-[10px] ${active ? "text-white/80" : ""}`}>{free ? (hi ? `${free} खाली` : `${free} free`) : "—"}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
                        {hi ? "समय" : "Times"} ({tz === "Asia/Kolkata" ? "IST" : tz})
                      </p>
                      {day && day.slots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {day.slots.map((s) => (
                            <button
                              key={s.start}
                              type="button"
                              disabled={!s.available}
                              onClick={() => setPick(s.start)}
                              aria-pressed={pick === s.start}
                              className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                                pick === s.start
                                  ? "border-brand-indigo bg-brand-indigo text-white"
                                  : s.available
                                    ? "border-stone-200 text-brand-indigo hover:border-brand-saffron hover:text-brand-saffron"
                                    : "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300 line-through"
                              }`}
                            >
                              {fmtSlotTime(s.start, tz)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-stone-50 px-3 py-6 text-center text-sm text-stone-500">{hi ? "इस दिन कोई समय उपलब्ध नहीं है।" : "No hours on this day."}</p>
                      )}
                    </div>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-400">{hi ? "आपका सवाल (वैकल्पिक)" : "Your question (optional)"}</span>
                      <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        maxLength={300}
                        rows={2}
                        placeholder={hi ? "आप क्या पूछना चाहेंगे?" : "What would you like to ask?"}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-brand-saffron focus:ring-2 focus:ring-brand-saffron/20"
                      />
                    </label>

                    {error && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error.text}{" "}
                        {error.recharge && (
                          <Link href="/wallet" className="font-semibold underline">
                            {hi ? "अभी रिचार्ज करें" : "Recharge now"}
                          </Link>
                        )}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                      <div className="text-sm">
                        {pick ? (
                          <span className="font-semibold text-brand-indigo">
                            {fmtSlotDate(pick, tz)}, {fmtSlotTime(pick, tz)}
                          </span>
                        ) : (
                          <span className="text-stone-500">{hi ? "समय चुनें" : "Pick a time"}</span>
                        )}
                        <span className="block text-xs text-stone-500">{hi ? "2 घंटे पहले रद्द करने पर पूरा रिफंड" : "Full refund if cancelled 2 h before"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={book}
                        disabled={!pick || busy}
                        className="shrink-0 whitespace-nowrap rounded-full bg-brand-saffron px-5 py-3 font-heading text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-saffronHover disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                      >
                        {busy && <Spinner className="mr-2" />}
                        {busy ? (hi ? "बुक हो रहा है…" : "Booking…") : hi ? `₹${data.price} भुगतान करें और बुक करें` : `Pay ₹${data.price} & book`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
