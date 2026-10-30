"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTitle, inr, Loading, Pager, Panel, Table, Tabs, td, useAdminList, when } from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";

type Row = {
  id: string;
  userName: string | null;
  astrologerName: string;
  mode: string;
  status: string;
  prepaid: boolean;
  requestedAt: string;
  startedAt: string | null;
  endReason: string | null;
  billedMinutes: number;
  freeMinutes: number;
  amount: number;
  astrologerEarning: number;
  platformShare: number;
  rating: number | null;
};
type S = "" | "active" | "completed" | "requested" | "missed" | "rejected" | "cancelled";

export default function AdminConsultations() {
  const [status, setStatus] = useState<S>("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/consultations", { status, page });
  return (
    <>
      <AdminTitle title="Consultations" subtitle="Every chat request and session, with billing and the platform share." />
      <Tabs<S>
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        options={[
          ["", "All"],
          ["active", "Live now"],
          ["completed", "Completed"],
          ["missed", "Missed"],
          ["rejected", "Declined"],
          ["cancelled", "Cancelled"],
        ]}
      />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["When", "User → Astrologer", "Status", "Minutes", "Billed", "Astrologer", "Platform", "Rating"]} empty={data.items.length === 0} minWidth={900}>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{when(c.requestedAt)}</td>
                  <td className={td}>
                    <Link href={`/consultation/${c.id}`} className="font-semibold text-brand-indigo hover:underline">
                      {c.userName || "User"} → {c.astrologerName}
                    </Link>
                    <span className="block text-xs capitalize text-slate-500">
                      {c.mode}
                      {c.prepaid ? " · scheduled (prepaid)" : ""}
                      {c.freeMinutes > 0 ? ` · ${c.freeMinutes} free min` : ""}
                    </span>
                  </td>
                  <td className={td}>
                    <StatusPill status={c.status} />
                    {c.endReason && <span className="mt-1 block text-[11px] text-slate-400">{c.endReason.replace(/_/g, " ")}</span>}
                  </td>
                  <td className={td}>{c.billedMinutes || "—"}</td>
                  {c.status === "completed" ? (
                    <>
                      <td className={`${td} font-semibold`}>{inr(c.amount)}</td>
                      <td className={td}>{inr(c.astrologerEarning)}</td>
                      <td className={`${td} text-emerald-700`}>{inr(c.platformShare)}</td>
                    </>
                  ) : (
                    <>
                      <td className={`${td} text-slate-500`}>{c.prepaid ? `${inr(c.amount)} prepaid` : "—"}</td>
                      <td className={`${td} text-slate-400`}>—</td>
                      <td className={`${td} text-slate-400`}>—</td>
                    </>
                  )}
                  <td className={`${td} text-amber-600`}>{c.rating ? `${c.rating} ★` : "—"}</td>
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
