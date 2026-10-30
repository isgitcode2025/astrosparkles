"use client";

import { Link } from "@/components/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { confirmDialog } from "@/components/ui/Confirm";
import { ErrorState } from "@/components/ui/ErrorState";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { SkelAccount, SkelRows } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { useLoad } from "@/lib/useLoad";
import { AccountTabs } from "@/components/site/AccountTabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/site/PageShell";
import { api, ApiRequestError, fmtSlotTime, type Booking } from "@/lib/api";

/** The user's scheduled (prepaid) sessions: join at the start time, or cancel for a refund. */
function MyBookings() {
  const router = useRouter();
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const { data: items, error, reload: load } = useLoad(() => api<Booking[]>(`/bookings/my?scope=${scope}`, { auth: true }), [scope]);
  const [busy, setBusy] = useState<string | null>(null);

  // refresh so the Join button appears at the right time
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const join = async (b: Booking) => {
    setBusy(`join:${b.id}`);
    try {
      const r = await api<{ consultationId: string }>(`/bookings/${b.id}/start`, { method: "POST", auth: true });
      startNavProgress();
      router.push(`/consultation/${r.consultationId}`);
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not open the session");
      setBusy(null);
    }
  };

  const cancel = async (b: Booking) => {
    const ok = await confirmDialog({
      title: `Cancel your session with ${b.astrologerName}?`,
      text: `₹${b.amount} will be refunded to your wallet.`,
      confirmText: "Cancel session",
      danger: true,
    });
    if (!ok) return;
    setBusy(`cancel:${b.id}`);
    try {
      await api<Booking>(`/bookings/${b.id}/cancel`, { method: "POST", auth: true });
      toast.success(`Booking cancelled. ₹${b.amount} is back in your wallet.`);
      window.dispatchEvent(new Event("kj-wallet"));
      await load();
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not cancel");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader title="My bookings" subtitle="Prepaid chat sessions you have scheduled with astrologers.">
        <Link href="/astrologers" className="inline-flex items-center gap-2 rounded-full bg-brand-saffron px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-saffronHover">
          <i className="fa-regular fa-calendar-plus" aria-hidden /> Book a session
        </Link>
      </PageHeader>
      <AccountTabs />

      <div className="mb-5 inline-flex rounded-full border border-brand-border bg-white p-1 text-sm font-semibold">
        {(["upcoming", "past"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={`rounded-full px-4 py-1.5 capitalize transition-colors ${scope === s ? "bg-brand-indigo text-white" : "text-slate-600 hover:text-brand-indigo"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState compact onRetry={load} />
      ) : !items ? (
        <SkelRows rows={3} />
      ) : items.length === 0 ? (
        <EmptyState icon="fa-calendar-days" title={scope === "upcoming" ? "No upcoming sessions" : "No past sessions"}>
          Open an astrologer&apos;s profile and press <strong>Book Session</strong> to pick a time.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <li key={b.id} className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-brand-cream py-2 text-brand-indigo">
                  <span className="text-[10px] font-bold uppercase">{new Date(b.start).toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" })}</span>
                  <span className="font-heading text-xl font-extrabold leading-tight">{new Date(b.start).toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" })}</span>
                  <span className="text-[10px] font-semibold">{new Date(b.start).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" })}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-bold text-brand-indigo">{b.astrologerName}</p>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {fmtSlotTime(b.start)} – {fmtSlotTime(b.end)} IST · Chat · {b.minutes} min · ₹{b.amount}
                  </p>
                  {b.topic && <p className="mt-1 text-sm italic text-slate-500">“{b.topic}”</p>}
                  {b.refunded > 0 && (
                    <p className="mt-1 text-xs text-emerald-700">
                      ₹{b.refunded} refunded{b.cancelledBy === "astrologer" ? " (cancelled by the astrologer)" : b.status === "expired" ? " (session was not started)" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {b.status === "started" && b.consultationId ? (
                  <Link href={`/consultation/${b.consultationId}`} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                    Open chat
                  </Link>
                ) : b.canJoin ? (
                  <Btn
                    busy={busy === `join:${b.id}`}
                    busyText="Opening…"
                    disabled={!!busy}
                    icon="fa-right-to-bracket"
                    onClick={() => join(b)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Join now
                  </Btn>
                ) : b.status === "confirmed" ? (
                  <span className="self-center text-xs text-slate-500">Join opens 5 min before</span>
                ) : null}
                {b.canCancel && (
                  <Btn
                    busy={busy === `cancel:${b.id}`}
                    busyText="Cancelling…"
                    disabled={!!busy}
                    onClick={() => cancel(b)}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:border-red-300 hover:text-red-600 disabled:opacity-60"
                  >
                    Cancel
                  </Btn>
                )}
                {b.status === "completed" && b.consultationId && (
                  <Link href={`/consultation/${b.consultationId}`} className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-indigo hover:border-brand-saffron">
                    View chat
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-slate-500">
        The full price is paid from your wallet when you book. Cancel up to 2 hours before the start for a full refund. If a session is not started before its slot ends, the
        amount is refunded automatically.
      </p>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <RequireAuth
      skeleton={
        <SkelAccount>
          <SkelRows rows={3} />
        </SkelAccount>
      }
    >
      <MyBookings />
    </RequireAuth>
  );
}
