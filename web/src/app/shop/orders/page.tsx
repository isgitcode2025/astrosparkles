"use client";

import { Link, useLang } from "@/components/i18n";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkelAccount, SkelRows } from "@/components/ui/Skeleton";
import { useLoad } from "@/lib/useLoad";
import { api, type ShopOrder } from "@/lib/api";
import { AccountTabs } from "@/components/site/AccountTabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/site/PageShell";

function MyOrders() {
  const lang = useLang();
  const { data: orders, error, reload } = useLoad<ShopOrder[]>(() => api<ShopOrder[]>("/shop/orders", { auth: true }));


  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={lang === "hi" ? "मेरे ऑर्डर" : "My orders"} subtitle={lang === "hi" ? "पूजा बुकिंग और कोर्स खरीद।" : "Pooja bookings and course purchases."} />
      <AccountTabs lang={lang} />
      {error ? (
        <ErrorState lang={lang} compact onRetry={reload} />
      ) : !orders ? (
        <SkelRows rows={3} />
      ) : orders.length === 0 ? (
        <EmptyState icon="fa-bag-shopping" title={lang === "hi" ? "अभी तक कोई ऑर्डर नहीं" : "No orders yet"}>
          <Link href="/shop" className="font-semibold text-brand-saffron hover:underline">
            {lang === "hi" ? "पूजा और कोर्स देखें" : "Browse poojas and courses"}
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
                    {new Date(o.createdAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · ₹{o.amount}
                  </p>
                </div>
                <StatusPill status={o.status} lang={lang} />
              </div>
              {o.pooja && (
                <div className="mt-3 rounded-xl bg-brand-cream/60 p-3 text-sm">
                  <p>
                    {lang === "hi" ? "संकल्प" : "Sankalp"}: <strong>{o.pooja.sankalpName}</strong>
                    {o.pooja.gotra && (
                      <>
                        {" "}
                        · {lang === "hi" ? "गोत्र" : "Gotra"} {o.pooja.gotra}
                      </>
                    )}
                  </p>
                  <p className="mt-1">
                    {lang === "hi" ? "स्थिति" : "Status"}:{" "}
                    <strong className={o.pooja.status === "performed" ? "text-emerald-700" : ""}>
                      {o.pooja.status === "performed" ? (lang === "hi" ? "सम्पन्न" : "Performed") : lang === "hi" ? "निर्धारित" : "Scheduled"}
                    </strong>
                    {o.pooja.scheduledAt && o.pooja.status !== "performed" && (
                      <> · {new Date(o.pooja.scheduledAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata" })}</>
                    )}
                  </p>
                  {o.pooja.noteToUser && <p className="mt-1 text-slate-600">{o.pooja.noteToUser}</p>}
                  {o.pooja.recordingUrl && (
                    <a href={o.pooja.recordingUrl} target="_blank" rel="noreferrer" className="btn-primary mt-3 px-4 py-2">
                      <i className="fa-solid fa-circle-play" aria-hidden />
                      {lang === "hi" ? "रिकॉर्डिंग देखें" : "Watch recording"}
                    </a>
                  )}
                </div>
              )}
              {o.type === "course" && o.status === "paid" && (
                <Link href="/shop/my-courses" className="mt-2 inline-block text-sm font-bold text-brand-saffron hover:underline">
                  {lang === "hi" ? "मेरे कोर्स पर जाएं →" : "Go to my courses →"}
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
