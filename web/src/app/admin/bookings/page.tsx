"use client";

import { useState } from "react";
import { AdminTitle, inr, Loading, Pager, Panel, Table, Tabs, td, useAdminList, when } from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";

type Row = {
  id: string;
  userName: string | null;
  astrologerName: string;
  start: string;
  end: string;
  minutes: number;
  amount: number;
  status: string;
  cancelledBy: string | null;
  refunded: number;
  topic: string | null;
  createdAt: string;
};
type S = "" | "confirmed" | "started" | "completed" | "cancelled" | "expired";

export default function AdminBookings() {
  const [status, setStatus] = useState<S>("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/bookings", { status, page });
  return (
    <>
      <AdminTitle title="Scheduled sessions" subtitle="Prepaid slot bookings. Cancelled and expired bookings are refunded to the user's wallet automatically." />
      <Tabs<S>
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        options={[
          ["", "All"],
          ["confirmed", "Upcoming"],
          ["started", "In progress"],
          ["completed", "Completed"],
          ["cancelled", "Cancelled"],
          ["expired", "Expired"],
        ]}
      />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["Slot", "User → Astrologer", "Paid", "Status", "Booked"]} empty={data.items.length === 0}>
              {data.items.map((b) => (
                <tr key={b.id}>
                  <td className={`${td} whitespace-nowrap`}>
                    <span className="font-semibold text-brand-indigo">{when(b.start)}</span>
                    <span className="block text-xs text-slate-500">{b.minutes} min chat</span>
                  </td>
                  <td className={td}>
                    {b.userName || "User"} → {b.astrologerName}
                    {b.topic && <span className="block text-xs italic text-slate-500">“{b.topic}”</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {inr(b.amount)}
                    {b.refunded > 0 && <span className="block text-xs text-emerald-700">refunded {inr(b.refunded)}</span>}
                  </td>
                  <td className={td}>
                    <StatusPill status={b.status} />
                    {b.cancelledBy && <span className="mt-1 block text-[11px] text-slate-400">by {b.cancelledBy}</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{when(b.createdAt)}</td>
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
