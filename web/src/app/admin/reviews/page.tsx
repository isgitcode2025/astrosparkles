"use client";

import { useState } from "react";
import { AdminTitle, Btn, btnDanger, btnGhost, Flash, Loading, Pager, Panel, Tabs, useAction, useAdminList, when } from "@/components/admin/kit";
import { api } from "@/lib/api";

type Row = { consultationId: string; userName: string | null; astrologerName: string; rating: number; comment: string | null; reply: string | null; hidden: boolean; createdAt: string };
type F = "all" | "low" | "hidden";

export default function AdminReviews() {
  const [filter, setFilter] = useState<F>("all");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/reviews", { filter, page });
  const a = useAction();
  const toggle = async (r: Row) => {
    await a.run(
      () => api(`/admin/reviews/${r.consultationId}`, { method: "PATCH", auth: true, body: JSON.stringify({ hidden: !r.hidden }) }),
      r.hidden ? "Review restored." : "Review hidden. The rating was recalculated.",
      r.consultationId,
    );
    await reload();
  };

  return (
    <>
      <AdminTitle title="Reviews" subtitle="Hide abusive or off-topic reviews. Hidden reviews leave the public pages and the astrologer's rating." />
      <Tabs<F>
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        options={[
          ["all", "All"],
          ["low", "1–2 stars"],
          ["hidden", "Hidden"],
        ]}
      />
      <Flash msg={a.msg} />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : data.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No reviews here.</p>
        ) : (
          <>
            <ul className="divide-y divide-brand-border">
              {data.items.map((r) => (
                <li key={r.consultationId} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${r.hidden ? "bg-stone-50" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-amber-600">{"★".repeat(r.rating)}</span>
                      <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                      <span className="ml-2 font-semibold text-brand-indigo">{r.astrologerName}</span>
                      <span className="text-slate-500"> · by {r.userName || "User"} · {when(r.createdAt)}</span>
                      {r.hidden && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-600">Hidden</span>}
                    </p>
                    <p className={`mt-1 text-sm ${r.comment ? "text-slate-700" : "italic text-slate-400"}`}>{r.comment || "Rating only, no comment"}</p>
                    {r.reply && <p className="mt-1 text-xs text-emerald-700">Astrologer replied: {r.reply}</p>}
                  </div>
                  <Btn busy={a.is(r.consultationId)} busyText={r.hidden ? "Restoring…" : "Hiding…"} disabled={a.busy} onClick={() => toggle(r)} className={r.hidden ? btnGhost : btnDanger}>
                    {r.hidden ? "Restore" : "Hide"}
                  </Btn>
                </li>
              ))}
            </ul>
            <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Panel>
    </>
  );
}
