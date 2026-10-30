"use client";

import { useState } from "react";
import { AdminTitle, Btn, btnGhost, day, Loading, Pager, Panel, Table, td, useAction, useAdminList, Flash } from "@/components/admin/kit";
import { api, type Paged } from "@/lib/api";

type Row = { id: string; email: string; lang: string; source: string; active: boolean; createdAt: string };

export default function AdminSubscribers() {
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/subscribers", { page, limit: 50 });
  const a = useAction();

  /** Downloads every subscriber as CSV (fetched page by page). */
  const exportCsv = () =>
    a.run(async () => {
      const all: Row[] = [];
      for (let p = 1; p < 200; p++) {
        const r = await api<Paged<Row>>(`/admin/subscribers?page=${p}&limit=100`, { auth: true });
        all.push(...r.items);
        if (!r.hasMore) break;
      }
      const csv = ["email,language,source,active,subscribed_on", ...all.map((s) => [s.email, s.lang, s.source, s.active, s.createdAt.slice(0, 10)].join(","))].join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }, "CSV downloaded.");

  return (
    <>
      <AdminTitle title="Newsletter subscribers" subtitle="People who asked for the daily horoscope by email from the site footer.">
        <Btn onClick={exportCsv} busy={a.busy} busyText="Preparing CSV…" disabled={!data?.total} className={btnGhost}>
          <i className="fa-solid fa-file-csv" aria-hidden /> Export CSV
        </Btn>
      </AdminTitle>
      <Flash msg={a.msg} />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["Email", "Language", "Source", "Subscribed"]} empty={data.items.length === 0} minWidth={560}>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} font-medium text-brand-indigo`}>{s.email}</td>
                  <td className={`${td} uppercase`}>{s.lang}</td>
                  <td className={td}>{s.source}</td>
                  <td className={`${td} text-slate-500`}>{day(s.createdAt)}</td>
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
