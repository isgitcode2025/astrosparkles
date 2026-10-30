"use client";

import { Link } from "@/components/i18n";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkelAccount, SkelRows } from "@/components/ui/Skeleton";
import { useLoad } from "@/lib/useLoad";
import { api, type Consultation, type Paged } from "@/lib/api";
import { AccountTabs } from "@/components/site/AccountTabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/site/PageShell";

/** User's consultation history. */
function MyConsultations() {
  const { data: items, error, reload } = useLoad<Consultation[]>(() => api<Paged<Consultation>>("/consultations/my?limit=50", { auth: true }).then((r) => r.items));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader title="My consultations" subtitle="Your chats with astrologers, newest first." />
      <AccountTabs />
      {error ? (
        <ErrorState compact onRetry={reload} />
      ) : !items ? (
        <SkelRows rows={4} />
      ) : items.length === 0 ? (
        <EmptyState icon="fa-comments" title="No consultations yet">
          <Link href="/astrologers" className="font-semibold text-brand-saffron hover:underline">
            Talk to an astrologer
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/consultation/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white p-5 shadow-soft transition-all hover:border-brand-saffron/60 hover:shadow-hover"
              >
                <div>
                  <p className="font-heading font-bold text-brand-indigo">{c.astrologerName}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(c.requestedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · <span className="capitalize">{c.mode}</span>
                    {c.prepaid ? " · scheduled" : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <StatusPill status={c.status} />
                  {c.status === "completed" && (
                    <p className="text-slate-500">
                      {c.billedMinutes} min · ₹{c.amount}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyConsultationsPage() {
  return (
    <RequireAuth skeleton={<SkelAccount><SkelRows rows={4} /></SkelAccount>}>
      <MyConsultations />
    </RequireAuth>
  );
}
