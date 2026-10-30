"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminTitle, btnGhost, inr, Loading, Pager, Panel, Table, Tabs, td, useAdminList, when } from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";

type Payment = {
  id: string;
  user: { id: string; name: string | null; phone: string | null } | null;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  mock: boolean;
  status: string;
  recharge: number;
  bonus: number;
  gst: number;
  total: number;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
};
type Txn = { id: string; user: { id: string; name: string | null; phone: string | null } | null; type: "credit" | "debit"; amount: number; balanceAfter: number; reason: string; description: string | null; createdAt: string };
type PS = "" | "paid" | "created" | "failed" | "cancelled";
const who = (u: Txn["user"]) => (u ? u.name || u.phone || "User" : "—");

function Payments() {
  const [status, setStatus] = useState<PS>("paid");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Payment>("/admin/payments", { status, page });
  return (
    <>
      <Tabs<PS>
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        options={[
          ["paid", "Paid"],
          ["created", "Started, not paid"],
          ["failed", "Failed"],
          ["cancelled", "Cancelled"],
          ["", "All"],
        ]}
      />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["Date", "User", "Recharge", "Bonus", "GST", "Charged", "Status", "Gateway ref"]} empty={data.items.length === 0} minWidth={900}>
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{when(p.paidAt ?? p.createdAt)}</td>
                  <td className={td}>{who(p.user)}</td>
                  <td className={`${td} font-semibold`}>{inr(p.recharge)}</td>
                  <td className={td}>{p.bonus ? inr(p.bonus) : "—"}</td>
                  <td className={td}>{inr(p.gst)}</td>
                  <td className={td}>{inr(p.total)}</td>
                  <td className={td}>
                    <StatusPill status={p.status} />
                    {p.mock && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">TEST</span>}
                    {p.failureReason && <span className="mt-1 block text-[11px] text-slate-400">{p.failureReason}</span>}
                  </td>
                  <td className={`${td} font-mono text-[11px] text-slate-500`}>
                    {p.gatewayOrderId}
                    {p.gatewayPaymentId && <span className="block">{p.gatewayPaymentId}</span>}
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Panel>
    </>
  );
}

function Ledger({ userId, clear }: { userId?: string; clear: () => void }) {
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Txn>("/admin/transactions", { userId, page, limit: 30 });
  return (
    <Panel
      title={userId ? `Ledger for ${data?.items[0] ? who(data.items[0].user) : "this user"}` : "Wallet ledger (all users)"}
      action={
        userId ? (
          <button type="button" onClick={clear} className={btnGhost}>
            Show all users
          </button>
        ) : undefined
      }
    >
      {!data ? (
        <Loading error={error} onRetry={reload} />
      ) : (
        <>
          <Table head={["Date", "User", "Entry", "Amount", "Balance after", "Details"]} empty={data.items.length === 0} minWidth={860}>
            {data.items.map((t) => (
              <tr key={t.id}>
                <td className={`${td} whitespace-nowrap text-slate-500`}>{when(t.createdAt)}</td>
                <td className={td}>{who(t.user)}</td>
                <td className={`${td} capitalize`}>{t.reason}</td>
                <td className={`${td} whitespace-nowrap font-semibold ${t.type === "credit" ? "text-emerald-700" : "text-red-600"}`}>
                  {t.type === "credit" ? "+" : "−"}
                  {inr(t.amount)}
                </td>
                <td className={td}>{inr(t.balanceAfter)}</td>
                <td className={`${td} text-xs text-slate-500`}>{t.description ?? "—"}</td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}

function Inner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"payments" | "ledger">(params.get("tab") === "ledger" ? "ledger" : "payments");
  const [userId, setUserId] = useState<string | undefined>(params.get("userId") ?? undefined);
  return (
    <>
      <AdminTitle title="Payments & ledger" subtitle="Wallet recharges through the payment gateway, and every wallet credit and debit." />
      <Tabs<"payments" | "ledger">
        value={tab}
        onChange={setTab}
        options={[
          ["payments", "Recharges"],
          ["ledger", "Wallet ledger"],
        ]}
      />
      {tab === "payments" ? <Payments /> : <Ledger userId={userId} clear={() => setUserId(undefined)} />}
    </>
  );
}

export default function AdminPayments() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
