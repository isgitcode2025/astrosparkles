"use client";

import { Link } from "@/components/i18n";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkelAccount, SkelRows } from "@/components/ui/Skeleton";
import { useLoad } from "@/lib/useLoad";
import { api, type ShopOrder } from "@/lib/api";
import { AccountTabs } from "@/components/site/AccountTabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/site/PageShell";

function MyOrders() {
  const { data: orders, error, reload } = useLoad<ShopOrder[]>(() => api<ShopOrder[]>("/shop/orders", { auth: true }));


  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader title="My orders" subtitle="Pooja bookings and course purchases." />
      <AccountTabs />
      {error ? (
        <ErrorState compact onRetry={reload} />
      ) : !orders ? (
        <SkelRows rows={3} />
      ) : orders.length === 0 ? (
        <EmptyState icon="fa-bag-shopping" title="No orders yet">
          <Link href="/shop" className="font-semibold text-brand-saffron hover:underline">
            Browse poojas and courses
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-bold text-brand-indigo">{o.title}</p>
                  <p className="text-sm text-slate-500">
                    {o.orderNumber} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · ₹{o.amount}
                  </p>
                </div>
                <StatusPill status={o.status} />
              </div>
              {o.pooja && (
                <div className="mt-3 rounded-xl bg-brand-cream/60 p-3 text-sm">
                  <p>
                    Sankalp: <strong>{o.pooja.sankalpName}</strong>
                    {o.pooja.gotra && <> · Gotra {o.pooja.gotra}</>}
                  </p>
                  <p className="mt-1">
                    Status:{" "}
                    <strong className={o.pooja.status === "performed" ? "text-emerald-700" : ""}>
                      {o.pooja.status === "performed" ? "Performed" : "Scheduled"}
                    </strong>
                    {o.pooja.scheduledAt && o.pooja.status !== "performed" && <> · {new Date(o.pooja.scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</>}
                  </p>
                  {o.pooja.noteToUser && <p className="mt-1 text-slate-600">{o.pooja.noteToUser}</p>}
                  {o.pooja.recordingUrl && (
                    <a href={o.pooja.recordingUrl} target="_blank" rel="noreferrer" className="btn-primary mt-3 px-4 py-2">
                      <i className="fa-solid fa-circle-play" aria-hidden />
                      Watch recording
                    </a>
                  )}
                </div>
              )}
              {o.type === "course" && o.status === "paid" && (
                <Link href="/shop/my-courses" className="mt-2 inline-block text-sm font-bold text-brand-saffron hover:underline">
                  Go to my courses →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <RequireAuth skeleton={<SkelAccount><SkelRows rows={3} /></SkelAccount>}>
      <MyOrders />
    </RequireAuth>
  );
}
