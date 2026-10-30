"use client";

import { Link, useLang, useLocaleRouter } from "@/components/i18n";
import type { Lang } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import { ScheduleEditor } from "@/components/dashboard/ScheduleEditor";
import { EmptyState, StatusPill } from "@/components/site/PageShell";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/Confirm";
import { ErrorState } from "@/components/ui/ErrorState";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError, fmtSlotDate, fmtSlotTime, type Booking, type Consultation, type Paged } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { DashboardSkeleton } from "@/components/ui/AppSkeletons";

type MyProfile = { displayName: string; status: string; presence: "online" | "busy" | "offline"; code?: string; slug: string; avatarUrl?: string | null };
type Period = { consultations: number; minutes: number; earning: number; gifts?: number; giftEarning?: number };
type Earnings = { today: Period; allTime: Period };
type Tab = "overview" | "schedule" | "history";

const card = "rounded-2xl border border-brand-border bg-white p-5 shadow-soft sm:p-6";
const h2 = "font-heading text-lg font-bold text-brand-indigo";

/** Rating cell: shows the review and lets the astrologer reply once. */
function ReviewCell({ c, onDone, lang }: { c: Consultation; onDone: () => void; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  if (!c.review) return <span className="text-slate-400">—</span>;
  return (
    <div className="space-y-1">
      <span className="font-semibold text-amber-600">{c.review.rating} ★</span>
      {c.review.comment && <p className="max-w-xs text-xs text-slate-500">“{c.review.comment}”</p>}
      {c.review.reply ? (
        <p className="max-w-xs text-xs text-emerald-700">{lang === "hi" ? "उत्तर दिया: " : "Replied: "}{c.review.reply}</p>
      ) : open ? (
        <form
          className="flex max-w-xs gap-1"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api(`/consultations/${c.id}/review/reply`, { method: "POST", auth: true, body: JSON.stringify({ text }) });
              toast.success(lang === "hi" ? "उत्तर प्रकाशित हो गया।" : "Reply published.");
              onDone();
            } catch (err) {
              toast.error(err instanceof ApiRequestError ? err.message : lang === "hi" ? "उत्तर नहीं भेजा जा सका" : "Could not send the reply");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            required
            minLength={2}
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-brand-border px-2 py-1 text-xs"
            placeholder={lang === "hi" ? "सार्वजनिक उत्तर" : "Public reply"}
          />
          <Btn type="submit" busy={busy} className="inline-flex items-center gap-1 rounded-lg bg-brand-saffron px-2 text-xs font-semibold text-white disabled:opacity-50">
            {lang === "hi" ? "भेजें" : "Send"}
          </Btn>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-brand-saffron hover:underline">
          {lang === "hi" ? "उत्तर दें" : "Reply"}
        </button>
      )}
    </div>
  );
}

function AstroDashboard() {
  const lang = useLang();
  const router = useLocaleRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [incoming, setIncoming] = useState<Consultation[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const setActionError = (m: string) => toast.error(m);

  const load = useCallback(async () => {
    try {
      const [p, inc, e, h, b] = await Promise.all([
        api<MyProfile>("/astrologers/me/profile", { auth: true }),
        api<Consultation[]>("/consultations/astrologer/incoming", { auth: true }),
        api<Earnings>("/consultations/astrologer/earnings", { auth: true }),
        api<Paged<Consultation>>("/consultations/astrologer/history?limit=20", { auth: true }),
        api<Booking[]>("/bookings/astrologer?scope=upcoming", { auth: true }).catch(() => []),
      ]);
      setProfile(p);
      setIncoming(inc);
      setEarnings(e);
      setHistory(h.items);
      setBookings(b);
      setError(null);
    } catch (e) {
      const denied = e instanceof ApiRequestError && e.status === 403;
      if (denied) setProfile(null); // access was removed: stop showing the old dashboard
      setError(denied ? "denied" : "failed");
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    const onUpdated = () => load();
    socket?.on("consultation:updated", onUpdated);
    const t = setInterval(load, 60_000); // keeps the booking Start buttons current
    return () => {
      socket?.off("consultation:updated", onUpdated);
      clearInterval(t);
    };
  }, [load]);

  const setPresence = async (presence: "online" | "offline") => {
    setBusy("presence");
    try {
      await api("/astrologers/me/presence", { method: "PATCH", auth: true, body: JSON.stringify({ presence }) });
      await load();
      toast.success(
        presence === "online"
          ? lang === "hi"
            ? "आप ऑनलाइन हैं। नए चैट अनुरोध यहाँ दिखाई देंगे।"
            : "You are online. New chat requests will appear here."
          : lang === "hi"
            ? "आप ऑफलाइन हैं।"
            : "You are offline.",
      );
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : lang === "hi" ? "स्थिति बदली नहीं जा सकी" : "Could not change status");
    } finally {
      setBusy(null);
    }
  };

  const act = async (id: string, action: "accept" | "reject") => {
    setBusy(`${action}:${id}`);
    try {
      await api(`/consultations/${id}/${action}`, { method: "POST", auth: true });
      if (action === "accept") {
        startNavProgress();
        router.push(`/consultation/${id}`);
        return;
      }
      toast.info(lang === "hi" ? "अनुरोध अस्वीकार कर दिया गया।" : "Request declined.");
      await load();
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : lang === "hi" ? "कार्रवाई विफल रही" : "Action failed");
      load();
    }
    setBusy(null);
  };

  const bookingAction = async (b: Booking, action: "start" | "cancel") => {
    if (
      action === "cancel" &&
      !(await confirmDialog({
        title: lang === "hi" ? `${b.userName} के साथ सेशन रद्द करें?` : `Cancel the session with ${b.userName}?`,
        text: lang === "hi" ? `उन्हें ₹${b.amount} का पूरा रिफंड मिलेगा।` : `They get a full refund of ₹${b.amount}.`,
        confirmText: lang === "hi" ? "सेशन रद्द करें" : "Cancel session",
        danger: true,
      }))
    )
      return;
    setBusy(`${action}:${b.id}`);
    try {
      if (action === "start") {
        const r = await api<{ consultationId: string }>(`/bookings/${b.id}/start`, { method: "POST", auth: true });
        startNavProgress();
        router.push(`/consultation/${r.consultationId}`);
        return;
      }
      await api(`/bookings/${b.id}/cancel`, { method: "POST", auth: true });
      toast.success(lang === "hi" ? `बुकिंग रद्द हो गई। ${b.userName} को ₹${b.amount} वापस मिल जाएंगे।` : `Booking cancelled. ${b.userName} gets ₹${b.amount} back.`);
      await load();
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : lang === "hi" ? "कार्रवाई विफल रही" : "Action failed");
    }
    setBusy(null);
  };

  if (error === "denied" && !profile)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon="fa-lock" title={lang === "hi" ? "यह पेज केवल स्वीकृत ज्योतिषियों के लिए है।" : "This page is only for approved astrologers."}>
          <Link href="/join-astrologer" className="font-semibold text-brand-saffron hover:underline">
            {lang === "hi" ? "ज्योतिषी बनने के लिए आवेदन करें" : "Apply to join as an astrologer"}
          </Link>
        </EmptyState>
      </div>
    );
  if (error && !profile)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title={lang === "hi" ? "डैशबोर्ड लोड नहीं हो सका" : "Could not load the dashboard"} onRetry={load} />
      </div>
    );
  if (!profile) return <DashboardSkeleton />;

  const requests = incoming.filter((c) => c.status === "requested");
  const active = incoming.find((c) => c.status === "active");
  const dot = profile.presence === "online" ? "bg-emerald-400" : profile.presence === "busy" ? "bg-amber-400" : "bg-slate-400";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-indigo to-brand-midnight p-6 text-white shadow-celestial sm:p-8">
        <div className="bg-mandala pointer-events-none absolute inset-0 opacity-10" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-brand-gold bg-white/10 font-heading text-2xl font-bold">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                profile.displayName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">{lang === "hi" ? "ज्योतिषी डैशबोर्ड" : "Astrologer dashboard"}</p>
              <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">{lang === "hi" ? `नमस्ते, ${profile.displayName}` : `Namaste, ${profile.displayName}`}</h1>
              <p className="text-sm text-white/70">
                {profile.code && <>ID {profile.code} · </>}
                <Link href={`/astrologer/${profile.slug}`} className="underline hover:text-white">
                  {lang === "hi" ? "सार्वजनिक प्रोफ़ाइल देखें" : "View public profile"}
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold capitalize">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              {lang === "hi" ? (profile.presence === "online" ? "ऑनलाइन" : profile.presence === "busy" ? "व्यस्त" : "ऑफलाइन") : profile.presence}
            </span>
            {profile.presence === "offline" ? (
              <Btn
                busy={busy === "presence"}
                busyText={lang === "hi" ? "ऑनलाइन हो रहे हैं…" : "Going online…"}
                onClick={() => setPresence("online")}
                className="inline-flex items-center gap-2 rounded-full bg-brand-saffron px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand-saffronHover"
              >
                {lang === "hi" ? "ऑनलाइन जाएं" : "Go online"}
              </Btn>
            ) : (
              <Btn
                busy={busy === "presence"}
                busyText={lang === "hi" ? "ऑफलाइन हो रहे हैं…" : "Going offline…"}
                onClick={() => setPresence("offline")}
                disabled={profile.presence === "busy"}
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-40"
              >
                {lang === "hi" ? "ऑफलाइन जाएं" : "Go offline"}
              </Btn>
            )}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="inline-flex rounded-full border border-brand-border bg-white p-1 text-sm font-semibold">
        {(
          lang === "hi"
            ? ([
                ["overview", "अवलोकन"],
                ["schedule", "शेड्यूल"],
                ["history", "इतिहास"],
              ] as const)
            : ([
                ["overview", "Overview"],
                ["schedule", "Schedule"],
                ["history", "History"],
              ] as const)
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={`rounded-full px-4 py-1.5 transition-colors ${tab === k ? "bg-brand-indigo text-white" : "text-slate-600 hover:text-brand-indigo"}`}
          >
            {label}
            {k === "overview" && requests.length > 0 && <span className="ml-1.5 rounded-full bg-brand-saffron px-1.5 text-[10px] text-white">{requests.length}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {active && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5">
              <p className="text-emerald-900">
                <span className="pulse-online mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {lang === "hi" ? (
                  <>
                    चल रही {active.mode === "chat" ? "चैट" : "कॉल"}
                    {active.prepaid ? " (शेड्यूल्ड)" : ""} <strong>{active.userName || "यूज़र"}</strong> के साथ
                  </>
                ) : (
                  <>
                    Ongoing {active.mode}
                    {active.prepaid ? " (scheduled)" : ""} with <strong>{active.userName || "user"}</strong>
                  </>
                )}
              </p>
              <Link href={`/consultation/${active.id}`} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                {lang === "hi" ? "चैट खोलें" : "Open chat"}
              </Link>
            </div>
          )}

          {earnings && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                lang === "hi"
                  ? ([
                      ["आज की कमाई", `₹${(earnings.today.earning + (earnings.today.giftEarning ?? 0)).toFixed(2)}`, `${earnings.today.consultations} सेशन · ${earnings.today.minutes} मिनट`, "fa-indian-rupee-sign", "bg-emerald-50 text-emerald-600"],
                      ["कुल कमाई", `₹${(earnings.allTime.earning + (earnings.allTime.giftEarning ?? 0)).toFixed(2)}`, `${earnings.allTime.consultations} सेशन · ${earnings.allTime.minutes} मिनट`, "fa-chart-line", "bg-indigo-50 text-brand-indigo"],
                      ["प्राप्त गिफ्ट", String(earnings.allTime.gifts ?? 0), `₹${(earnings.allTime.giftEarning ?? 0).toFixed(2)} आपका हिस्सा`, "fa-gift", "bg-amber-50 text-brand-saffron"],
                      ["आगामी बुकिंग", String(bookings.filter((b) => b.status === "confirmed").length), "प्रीपेड शेड्यूल्ड चैट", "fa-calendar-check", "bg-purple-50 text-purple-600"],
                    ] as const)
                  : ([
                      ["Today's earning", `₹${(earnings.today.earning + (earnings.today.giftEarning ?? 0)).toFixed(2)}`, `${earnings.today.consultations} sessions · ${earnings.today.minutes} min`, "fa-indian-rupee-sign", "bg-emerald-50 text-emerald-600"],
                      ["All-time earning", `₹${(earnings.allTime.earning + (earnings.allTime.giftEarning ?? 0)).toFixed(2)}`, `${earnings.allTime.consultations} sessions · ${earnings.allTime.minutes} min`, "fa-chart-line", "bg-indigo-50 text-brand-indigo"],
                      ["Gifts received", String(earnings.allTime.gifts ?? 0), `₹${(earnings.allTime.giftEarning ?? 0).toFixed(2)} your share`, "fa-gift", "bg-amber-50 text-brand-saffron"],
                      ["Upcoming bookings", String(bookings.filter((b) => b.status === "confirmed").length), "Prepaid scheduled chats", "fa-calendar-check", "bg-purple-50 text-purple-600"],
                    ] as const)
              ).map(([label, value, sub, icon, tone]) => (
                <div key={label} className={card}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
                      <i className={`fa-solid ${icon} text-sm`} aria-hidden />
                    </span>
                  </div>
                  <p className="mt-2 font-heading text-2xl font-extrabold text-brand-indigo">{value}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={card}>
              <h2 className={h2}>{lang === "hi" ? "आने वाले अनुरोध" : "Incoming requests"}</h2>
              {requests.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {lang === "hi"
                    ? profile.presence === "online"
                      ? "यूज़र्स की प्रतीक्षा है। नए अनुरोध तुरंत यहाँ दिखाई देंगे।"
                      : "चैट अनुरोध प्राप्त करने के लिए ऑनलाइन जाएं।"
                    : profile.presence === "online"
                      ? "Waiting for users. New requests appear here instantly."
                      : "Go online to receive chat requests."}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-brand-border">
                  {requests.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="text-sm">
                        <p className="font-semibold text-brand-indigo">
                          {r.userName || (lang === "hi" ? "यूज़र" : "User")} · <span className="capitalize">{r.mode}</span> ·{" "}
                          {r.freeMinutes > 0
                            ? lang === "hi"
                              ? `${r.freeMinutes} मिनट मुफ़्त`
                              : `${r.freeMinutes} free min`
                            : lang === "hi"
                              ? `अधिकतम ${r.maxMinutes} मिनट`
                              : `up to ${r.maxMinutes} min`}
                        </p>
                        {r.intake?.birth?.dateOfBirth && (
                          <p className="text-slate-500">
                            {lang === "hi" ? "जन्म" : "Born"} {r.intake.birth.dateOfBirth} {r.intake.birth.timeOfBirth} {r.intake.birth.place && `· ${r.intake.birth.place}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Btn
                          busy={busy === `accept:${r.id}`}
                          busyText={lang === "hi" ? "स्वीकार की जा रही है…" : "Accepting…"}
                          disabled={!!busy}
                          onClick={() => act(r.id, "accept")}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {lang === "hi" ? "स्वीकार करें" : "Accept"}
                        </Btn>
                        <Btn
                          busy={busy === `reject:${r.id}`}
                          busyText={lang === "hi" ? "अस्वीकार की जा रही है…" : "Declining…"}
                          disabled={!!busy}
                          onClick={() => act(r.id, "reject")}
                          className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-1.5 text-sm font-semibold text-stone-600 hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                        >
                          {lang === "hi" ? "अस्वीकार करें" : "Decline"}
                        </Btn>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <div className="flex items-center justify-between">
                <h2 className={h2}>{lang === "hi" ? "आगामी बुकिंग" : "Upcoming bookings"}</h2>
                <button type="button" onClick={() => setTab("schedule")} className="text-xs font-semibold text-brand-saffron hover:underline">
                  {lang === "hi" ? "समय संपादित करें" : "Edit hours"}
                </button>
              </div>
              {bookings.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  {lang === "hi"
                    ? "अभी तक कोई शेड्यूल्ड सेशन नहीं है। यूज़र्स आपको बुक कर सकें इसके लिए शेड्यूल में अपने साप्ताहिक घंटे खोलें।"
                    : "No scheduled sessions yet. Open your weekly hours under Schedule so users can book you."}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-brand-border">
                  {bookings.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="text-sm">
                        <p className="font-semibold text-brand-indigo">
                          {fmtSlotDate(b.start)}, {fmtSlotTime(b.start)} · {b.userName}
                        </p>
                        <p className="text-slate-500">
                          {b.minutes} {lang === "hi" ? "मिनट" : "min"} · {lang === "hi" ? `आप ₹${b.astrologerEarning} कमाते हैं` : `you earn ₹${b.astrologerEarning}`}
                          {b.topic && <> · “{b.topic}”</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status === "started" && b.consultationId ? (
                          <Link href={`/consultation/${b.consultationId}`} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white">
                            {lang === "hi" ? "चैट खोलें" : "Open chat"}
                          </Link>
                        ) : b.canJoin ? (
                          <Btn
                            busy={busy === `start:${b.id}`}
                            busyText={lang === "hi" ? "शुरू की जा रही है…" : "Starting…"}
                            disabled={!!busy}
                            onClick={() => bookingAction(b, "start")}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {lang === "hi" ? "शुरू करें" : "Start"}
                          </Btn>
                        ) : (
                          <StatusPill status={b.status} lang={lang} />
                        )}
                        {b.canCancel && (
                          <Btn
                            busy={busy === `cancel:${b.id}`}
                            busyText={lang === "hi" ? "रद्द की जा रही है…" : "Cancelling…"}
                            disabled={!!busy}
                            onClick={() => bookingAction(b, "cancel")}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-60"
                          >
                            {lang === "hi" ? "रद्द करें" : "Cancel"}
                          </Btn>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {tab === "schedule" && (
        <section className={card}>
          <h2 className={h2}>{lang === "hi" ? "शेड्यूल्ड सेशन के लिए साप्ताहिक घंटे" : "Weekly hours for scheduled sessions"}</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            {lang === "hi"
              ? "यूज़र्स एक स्लॉट बुक करते हैं और आपकी चैट दर पर पूरा भुगतान पहले से करते हैं। शुरुआत के समय अवलोकन टैब से जुड़ें। अगर आप रद्द करते हैं, तो यूज़र को पूरा रिफंड मिलता है।"
              : "Users book a slot and pay the full price up front at your chat rate. Join from the Overview tab at the start time. If you cancel, the user is refunded in full."}
          </p>
          <ScheduleEditor />
        </section>
      )}

      {tab === "history" && (
        <section className={card}>
          <h2 className={h2}>{lang === "hi" ? "हाल के परामर्श" : "Recent consultations"}</h2>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{lang === "hi" ? "अभी तक कोई परामर्श नहीं।" : "No consultations yet."}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 font-semibold">{lang === "hi" ? "यूज़र" : "User"}</th>
                    <th className="py-2 font-semibold">{lang === "hi" ? "तारीख" : "Date"}</th>
                    <th className="py-2 font-semibold">{lang === "hi" ? "स्थिति" : "Status"}</th>
                    <th className="py-2 font-semibold">{lang === "hi" ? "मिनट" : "Minutes"}</th>
                    <th className="py-2 font-semibold">{lang === "hi" ? "कमाई" : "Earning"}</th>
                    <th className="py-2 font-semibold">{lang === "hi" ? "रेटिंग" : "Rating"}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-brand-border align-top">
                      <td className="py-3">
                        <Link href={`/consultation/${h.id}`} className="font-semibold text-brand-indigo hover:underline">
                          {h.userName || (lang === "hi" ? "यूज़र" : "User")}
                        </Link>
                        {h.prepaid && <span className="ml-1 text-[10px] font-bold uppercase text-purple-600">{lang === "hi" ? "शेड्यूल्ड" : "scheduled"}</span>}
                      </td>
                      <td className="py-3 text-slate-500">{new Date(h.requestedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}</td>
                      <td className="py-3">
                        <StatusPill status={h.status} lang={lang} />
                      </td>
                      <td className="py-3">{h.billedMinutes || "—"}</td>
                      <td className="py-3">₹{h.astrologerEarning}</td>
                      <td className="py-3">
                        <ReviewCell c={h} onDone={load} lang={lang} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function AstroDashboardPage() {
  return (
    <RequireAuth skeleton={<DashboardSkeleton />}>
      <AstroDashboard />
    </RequireAuth>
  );
}
