"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError, type Paged } from "@/lib/api";
import { AccountTabs } from "@/components/site/AccountTabs";
import { PageHeader } from "@/components/site/PageShell";
import { WalletSkeleton } from "@/components/ui/AppSkeletons";

type Pack = {
  amount: number;
  bonusPercent: number;
  bonus: number;
  gst: number;
  total: number;
};
type Settings = {
  gstPercent: number;
  minRecharge: number;
  maxRecharge: number;
  packs: Pack[];
  razorpayKeyId: string | null;
  mockMode: boolean;
};
type Txn = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reason: string;
  description?: string;
  createdAt: string;
};
type Order = {
  orderId: string;
  razorpayKeyId: string | null;
  amountPaise: number;
  currency: string;
  breakdown: Pack;
  mockMode: boolean;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function Wallet() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const setMessage = (m: { kind: "ok" | "err"; text: string } | null) => m && (m.kind === "ok" ? toast.success(m.text) : toast.error(m.text));

  const refresh = useCallback(async () => {
    const [b, t] = await Promise.all([
      api<{ balance: number }>("/wallet/balance", { auth: true }),
      api<Paged<Txn>>("/wallet/transactions?limit=20", { auth: true }),
    ]);
    setBalance(b.balance);
    setTxns(t.items);
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [st] = await Promise.all([api<Settings>("/wallet/recharge-settings"), refresh()]);
      setSettings(st);
      setSelected((cur) => cur ?? st.packs[2]?.amount ?? st.packs[0]?.amount ?? null);
    } catch {
      setLoadError(true);
    }
  }, [refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const amount = custom ? Number(custom) : selected;
  const pack = settings?.packs.find((p) => p.amount === amount);
  const gst = settings && amount ? Math.round(amount * settings.gstPercent) / 100 : 0;

  const verify = async (orderId: string, paymentId: string, signature: string) => {
    const res = await api<{ credited: number; bonus: number; balance: number }>("/wallet/verify-payment", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    setMessage({
      kind: "ok",
      text: `₹${res.credited}${res.bonus ? ` + ₹${res.bonus} bonus` : ""} added to your wallet.`,
    });
    window.dispatchEvent(new Event("kj-wallet"));
    await refresh();
  };

  const recharge = async () => {
    if (!amount) return;
    setBusy(true);
    setMessage(null);
    try {
      const order = await api<Order>("/wallet/create-order", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ amount }),
      });

      if (order.mockMode) {
        // Development without Razorpay keys: simulate a successful payment.
        await verify(order.orderId, `pay_mock_${Date.now()}`, "mock");
        return;
      }

      if (!(await loadRazorpayScript()) || !window.Razorpay) throw new Error("Could not load payment window");
      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Wallet recharge",
        description: `₹${order.breakdown.amount} + GST`,
        theme: {
          color: getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim() || "#3B1F6E",
        },
        handler: (r: RazorpayResponse) =>
          verify(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature).catch((e) =>
            setMessage({
              kind: "err",
              text: e instanceof ApiRequestError ? e.message : "Payment could not be verified",
            }),
          ),
        modal: {
          ondismiss: () => {
            api("/wallet/payment-cancelled", {
              method: "POST",
              auth: true,
              body: JSON.stringify({ orderId: order.orderId }),
            }).catch(() => undefined);
            setBusy(false);
          },
        },
      });
      rzp.open();
    } catch (e) {
      setMessage({
        kind: "err",
        text: e instanceof ApiRequestError || e instanceof Error ? e.message : "Recharge failed",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loadError)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Could not load your wallet" onRetry={load} />
      </div>
    );
  if (!settings || balance === null) return <WalletSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader title="My wallet" subtitle="Recharge once and pay per minute for chats, or for poojas and courses." />
      <AccountTabs />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-midnight p-6 text-white shadow-celestial">
            <div className="bg-mandala pointer-events-none absolute inset-0 opacity-[0.07]" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-saffron/25 blur-2xl" />
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">Available balance</p>
            <p className="relative mt-1 font-heading text-4xl font-extrabold">₹{balance?.toFixed(2) ?? "—"}</p>
            <p className="relative mt-1 text-sm text-white/70">Used for per-minute chats, scheduled sessions, gifts, poojas and courses.</p>
          </div>
          <div className="card">
            {settings?.mockMode && (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                Test mode: Razorpay keys are not set, so recharges are simulated and no money is charged.
              </p>
            )}

            <h2 className="font-heading text-lg font-bold text-brand-primary">Add money</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {settings?.packs.map((p) => (
                <button
                  key={p.amount}
                  onClick={() => {
                    setSelected(p.amount);
                    setCustom("");
                  }}
                  className={`relative rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                    !custom && selected === p.amount ? "border-brand-saffron bg-amber-50" : "border-brand-border bg-white hover:border-brand-saffron/50"
                  }`}
                >
                  <span className="block font-heading font-bold text-brand-indigo">₹{p.amount}</span>
                  {p.bonusPercent > 0 && <span className="block text-xs font-medium text-emerald-700">+{p.bonusPercent}% extra</span>}
                </button>
              ))}
            </div>
            <label className="label mt-4">
              Or enter amount
              <input
                type="number"
                min={settings?.minRecharge}
                max={settings?.maxRecharge}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={settings ? `₹${settings.minRecharge} – ₹${settings.maxRecharge}` : ""}
                className="field sm:w-60"
              />
            </label>

            {amount ? (
              <dl className="mt-5 space-y-1 rounded-xl bg-brand-cream/60 p-4 text-sm">
                <div className="flex justify-between">
                  <dt>Recharge amount</dt>
                  <dd>₹{amount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>GST ({settings?.gstPercent}%)</dt>
                  <dd>₹{gst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-brand-border pt-1 font-semibold">
                  <dt>You pay</dt>
                  <dd>₹{(amount + gst).toFixed(2)}</dd>
                </div>
                {pack && pack.bonus > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Bonus credited</dt>
                    <dd>₹{pack.bonus}</dd>
                  </div>
                )}
              </dl>
            ) : null}

            <Btn onClick={recharge} busy={busy} busyText="Opening payment…" disabled={!amount} icon="fa-lock" className="btn-primary mt-5 w-full sm:w-auto">
              {`Proceed to pay${amount ? ` ₹${(amount + gst).toFixed(2)}` : ""}`}
            </Btn>
          </div>
        </section>

        <section className="card">
          <h2 className="font-heading font-bold text-brand-primary">Recent transactions</h2>
          {txns.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-brand-border text-sm">
              {txns.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium text-slate-700 first-letter:uppercase">{t.description ?? t.reason}</p>
                    <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                  </div>
                  <p className={t.type === "credit" ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                    {t.type === "credit" ? "+" : "−"}₹{t.amount}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <RequireAuth skeleton={<WalletSkeleton />}>
      <Wallet />
    </RequireAuth>
  );
}
