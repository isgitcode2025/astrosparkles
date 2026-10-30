"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTitle, inr, Panel } from "@/components/admin/kit";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading as SkelLoading, Skel, SkelStat } from "@/components/ui/Skeleton";
import { useLoad } from "@/lib/useLoad";
import { api } from "@/lib/api";

type Overview = {
  users: { total: number; today: number };
  astrologers: { approved: number; pending: number; suspended: number; rejected: number; onlineNow: number };
  consultations: { completed: number; completedToday: number; gross: number; grossToday: number; platformShare: number; platformShareToday: number };
  recharges: { count: number; total: number; today: number; countToday: number };
  shop: { paidOrders: number; revenue: number; poojasToPerform: number };
  gifts: { count: number; total: number };
  upcomingBookings: number;
  subscribers: number;
  daily: { date: string; recharges: number; consultations: number; sessions: number; shop: number }[];
};

function Kpi({ label, value, sub, icon, tone, href }: { label: string; value: string; sub: string; icon: string; tone: string; href?: string }) {
  const body = (
    <div className="h-full rounded-2xl border border-brand-border bg-white p-4 shadow-soft transition-shadow hover:shadow-hover sm:p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full sm:flex ${tone}`}>
          <i className={`fa-solid ${icon} text-sm`} aria-hidden />
        </span>
      </div>
      <p className="mt-2 font-heading text-xl font-extrabold text-brand-indigo sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const SERIES = [
  { key: "recharges", label: "Wallet recharges", cls: "bg-brand-saffron" },
  { key: "consultations", label: "Consultation billing", cls: "bg-brand-indigo" },
  { key: "shop", label: "Poojas & courses", cls: "bg-emerald-500" },
] as const;

/** Grouped bar chart of the last 14 days (IST). */
function DailyChart({ daily }: { daily: Overview["daily"] }) {
  const max = Math.max(1, ...daily.flatMap((d) => [d.recharges, d.consultations, d.shop]));
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? daily[hover] : null;
  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.cls}`} />
              {s.label}
            </span>
          ))}
        </div>
        <p className="min-h-[1rem] text-xs text-slate-500">
          {h
            ? `${new Date(`${h.date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" })}: recharges ${inr(h.recharges)} · consultations ${inr(h.consultations)} (${h.sessions}) · shop ${inr(h.shop)}`
            : "Hover or tap a day for numbers"}
        </p>
      </div>
      <div className="flex h-48 items-end gap-1.5 border-b border-brand-border sm:gap-2" role="img" aria-label="Daily revenue for the last 14 days">
        {daily.map((d, i) => (
          <div
            key={d.date}
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex h-full flex-1 items-end justify-center gap-[2px] rounded-t-md ${hover === i ? "bg-brand-cream" : ""}`}
          >
            {SERIES.map((s) => (
              <div key={s.key} className={`w-full max-w-[10px] rounded-t-sm ${s.cls}`} style={{ height: `${(d[s.key] / max) * 100}%`, minHeight: d[s.key] > 0 ? 2 : 0 }} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-center text-[10px] text-slate-400 sm:gap-2">
        {daily.map((d, i) => (
          <span key={d.date} className="flex-1">
            {i % 2 === 1 || daily.length < 8 ? Number(d.date.slice(8)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { data: o, error, reload } = useLoad(() => api<Overview>("/admin/overview", { auth: true }));

  if (error)
    return (
      <div className="mx-auto max-w-xl py-10">
        <ErrorState title="Could not load the overview" text={error} onRetry={reload} />
      </div>
    );
  if (!o)
    return (
      <SkelLoading label="Loading the overview">
        <Skel className="h-8 w-40" />
        <Skel className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkelStat key={i} />
          ))}
        </div>
        <Skel className="mt-6 h-72 w-full !rounded-2xl" />
      </SkelLoading>
    );
  return (
    <>
      <AdminTitle title="Overview" subtitle="Live numbers from the platform. Today is counted from midnight IST." />

      {(o.astrologers.pending > 0 || o.shop.poojasToPerform > 0) && (
        <div className="mb-6 flex flex-wrap gap-3">
          {o.astrologers.pending > 0 && (
            <Link href="/admin/astrologers" className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">
              <i className="fa-solid fa-user-clock" aria-hidden /> {o.astrologers.pending} astrologer application{o.astrologers.pending === 1 ? "" : "s"} to review
            </Link>
          )}
          {o.shop.poojasToPerform > 0 && (
            <Link href="/admin/shop" className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-brand-indigo ring-1 ring-indigo-200 hover:bg-indigo-100">
              <i className="fa-solid fa-om" aria-hidden /> {o.shop.poojasToPerform} pooja{o.shop.poojasToPerform === 1 ? "" : "s"} to perform
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Wallet recharges" value={inr(o.recharges.total)} sub={`${inr(o.recharges.today)} today · ${o.recharges.count} payments`} icon="fa-wallet" tone="bg-amber-50 text-brand-saffron" href="/admin/payments" />
        <Kpi
          label="Platform share"
          value={inr(o.consultations.platformShare)}
          sub={`${inr(o.consultations.platformShareToday)} today · from ${inr(o.consultations.gross)} billed`}
          icon="fa-chart-line"
          tone="bg-indigo-50 text-brand-indigo"
          href="/admin/consultations"
        />
        <Kpi label="Consultations" value={o.consultations.completed.toLocaleString("en-IN")} sub={`${o.consultations.completedToday} completed today`} icon="fa-comments" tone="bg-emerald-50 text-emerald-600" href="/admin/consultations" />
        <Kpi label="Users" value={o.users.total.toLocaleString("en-IN")} sub={`${o.users.today} joined today`} icon="fa-users" tone="bg-purple-50 text-purple-600" href="/admin/users" />
        <Kpi
          label="Astrologers"
          value={String(o.astrologers.approved)}
          sub={`${o.astrologers.onlineNow} online now · ${o.astrologers.pending} pending · ${o.astrologers.suspended} suspended`}
          icon="fa-user-tie"
          tone="bg-indigo-50 text-brand-indigo"
          href="/admin/astrologers"
        />
        <Kpi label="Poojas & courses" value={inr(o.shop.revenue)} sub={`${o.shop.paidOrders} paid orders`} icon="fa-om" tone="bg-orange-50 text-orange-600" href="/admin/shop" />
        <Kpi label="Gifts" value={inr(o.gifts.total)} sub={`${o.gifts.count} gifts sent`} icon="fa-gift" tone="bg-pink-50 text-pink-600" />
        <Kpi label="Upcoming bookings" value={String(o.upcomingBookings)} sub={`${o.subscribers} newsletter subscribers`} icon="fa-calendar-check" tone="bg-sky-50 text-sky-600" href="/admin/bookings" />
      </div>

      <Panel title="Last 14 days" className="mt-6">
        <DailyChart daily={o.daily} />
      </Panel>
    </>
  );
}
