"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminTitle, Btn, btnDanger, btnDark, btnGhost, btnPrimary, day, Flash, input, Loading, Modal, Pager, Panel, Table, Tabs, td, useAction, useAdminList } from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";
import { confirmDialog } from "@/components/ui/Confirm";
import { api, type Rates } from "@/lib/api";

type Row = {
  id: string;
  phone: string | null;
  displayName: string;
  slug: string;
  code: string | null;
  avatarUrl: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  presence: string;
  gender: string | null;
  expertise: string[];
  languages: string[];
  experienceYears: number;
  rates: Rates;
  commissionPercent: number;
  badges: string[];
  sortWeight: number;
  rating: { average: number; count: number };
  consultationCount: number;
  bioEn: string;
  qualifications: string[];
  rejectionReason: string | null;
  scheduleEnabled: boolean;
  createdAt: string;
};
type Status = Row["status"];
const BADGES = ["new", "top-rated", "celebrity", "rising-star"];

function Avatar({ r }: { r: Row }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-cream font-heading font-bold text-brand-indigo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" /> : r.displayName.charAt(0)}
    </div>
  );
}

/** Review a pending application: approve with a commission, or reject with a reason. */
function ReviewModal({ r, onClose, onDone }: { r: Row; onClose: () => void; onDone: () => void }) {
  const [commission, setCommission] = useState(String(r.commissionPercent));
  const [reason, setReason] = useState("");
  const a = useAction();
  const send = (decision: "approve" | "reject") =>
    a
      .run(
        () =>
        api(`/admin/astrologers/${r.id}/review`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify(decision === "approve" ? { decision, commissionPercent: Number(commission) } : { decision, reason }),
        }),
        decision === "approve" ? "Application approved. The profile is live." : "Application rejected.",
        decision,
      )
      .then((ok) => ok && onDone());
  return (
    <Modal title={`Application: ${r.displayName}`} onClose={onClose}>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
        <dt className="text-slate-500">Phone</dt>
        <dd className="col-span-2">{r.phone ?? "—"}</dd>
        <dt className="text-slate-500">Experience</dt>
        <dd className="col-span-2">{r.experienceYears} years</dd>
        <dt className="text-slate-500">Expertise</dt>
        <dd className="col-span-2">{r.expertise.join(", ")}</dd>
        <dt className="text-slate-500">Languages</dt>
        <dd className="col-span-2">{r.languages.join(", ")}</dd>
        <dt className="text-slate-500">Rates</dt>
        <dd className="col-span-2">
          Chat ₹{r.rates.chat}/min · Call ₹{r.rates.call}/min
        </dd>
        {r.qualifications.length > 0 && (
          <>
            <dt className="text-slate-500">Qualifications</dt>
            <dd className="col-span-2">{r.qualifications.join(", ")}</dd>
          </>
        )}
      </dl>
      <p className="mt-3 whitespace-pre-line rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-700">{r.bioEn}</p>
      <Flash msg={a.msg} />
      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-40 text-slate-600">Platform commission %</span>
          <input type="number" min={0} max={100} value={commission} onChange={(e) => setCommission(e.target.value)} className={`${input} w-24`} />
          <Btn busy={a.is("approve")} busyText="Approving…" disabled={a.busy} onClick={() => send("approve")} className={btnPrimary}>
            Approve
          </Btn>
        </label>
        <div className="flex items-center gap-3">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection (sent to applicant)" maxLength={500} className={`${input} flex-1`} />
          <Btn busy={a.is("reject")} busyText="Rejecting…" disabled={a.busy || reason.trim().length < 3} onClick={() => send("reject")} className={btnDanger}>
            Reject
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/** Commission, badges and listing weight for a live astrologer. */
function EditModal({ r, onClose, onDone }: { r: Row; onClose: () => void; onDone: () => void }) {
  const [commission, setCommission] = useState(String(r.commissionPercent));
  const [weight, setWeight] = useState(String(r.sortWeight));
  const [badges, setBadges] = useState<string[]>(r.badges.filter((b) => BADGES.includes(b)));
  const a = useAction();
  const save = () =>
    a
      .run(() =>
        api(`/admin/astrologers/${r.id}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({ commissionPercent: Number(commission), sortWeight: Number(weight), badges }),
        }),
        "Changes saved.",
      )
      .then((ok) => ok && onDone());
  return (
    <Modal title={`Edit ${r.displayName}`} onClose={onClose}>
      <Flash msg={a.msg} />
      <div className="space-y-4 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-600">
            Platform commission %<span className="block text-xs text-slate-400">Applies to new sessions and gifts</span>
          </span>
          <input type="number" min={0} max={100} value={commission} onChange={(e) => setCommission(e.target.value)} className={`${input} w-24`} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-600">
            Listing weight<span className="block text-xs text-slate-400">Higher shows earlier in Recommended (default 100)</span>
          </span>
          <input type="number" min={0} max={1000} value={weight} onChange={(e) => setWeight(e.target.value)} className={`${input} w-24`} />
        </label>
        <div>
          <span className="text-slate-600">Badges</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const on = badges.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setBadges(on ? badges.filter((x) => x !== b) : [...badges, b])}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${on ? "border-brand-indigo bg-brand-indigo text-white" : "border-brand-border text-slate-600"}`}
                >
                  {b.replace("-", " ")}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <Btn busy={a.busy} busyText="Saving…" onClick={save} className={btnPrimary}>
            Save
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminAstrologers() {
  const [status, setStatus] = useState<Status>("pending");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/astrologers", { status, q: search, page });
  const [review, setReview] = useState<Row | null>(null);
  const [edit, setEdit] = useState<Row | null>(null);
  const a = useAction();

  const setLive = async (r: Row, to: "approved" | "suspended") => {
    if (to === "suspended" && !(await confirmDialog({ title: `Suspend ${r.displayName}?`, text: "Their profile is hidden from users and they go offline.", confirmText: "Suspend", danger: true })))
      return;
    await a.run(
      () => api(`/admin/astrologers/${r.id}`, { method: "PATCH", auth: true, body: JSON.stringify({ status: to }) }),
      to === "suspended" ? `${r.displayName} is suspended.` : `${r.displayName} is live again.`,
      `live:${r.id}`,
    );
    await reload();
  };

  return (
    <>
      <AdminTitle title="Astrologers" subtitle="Review applications, set commission and badges, suspend or reinstate.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q);
          }}
          className="flex gap-2"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ID" className={input} aria-label="Search astrologers" />
          <button className={btnDark}>Search</button>
        </form>
      </AdminTitle>
      <Tabs<Status>
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        options={[
          ["pending", "Applications"],
          ["approved", "Approved"],
          ["suspended", "Suspended"],
          ["rejected", "Rejected"],
        ]}
      />
      <Flash msg={a.msg} />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["Astrologer", "Expertise", "Rates", status === "pending" ? "Applied" : "Commission", status === "approved" ? "Performance" : "Status", ""]} empty={data.items.length === 0}>
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar r={r} />
                      <div>
                        <p className="font-semibold text-brand-indigo">
                          {r.status === "approved" ? (
                            <Link href={`/astrologer/${r.slug}`} target="_blank" className="hover:underline">
                              {r.displayName}
                            </Link>
                          ) : (
                            r.displayName
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.code ?? "No ID yet"} · {r.phone ?? "—"} · {r.experienceYears} yrs
                        </p>
                        {r.badges.length > 0 && <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-saffron">{r.badges.join(" · ")}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={`${td} max-w-[220px] text-xs text-slate-600`}>
                    {r.expertise.join(", ")}
                    <span className="block text-slate-400">{r.languages.join(", ")}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-xs`}>
                    Chat ₹{r.rates.chat}
                    {r.rates.chatOffer !== undefined && r.rates.chatOffer !== null && <span className="text-emerald-600"> (offer ₹{r.rates.chatOffer})</span>}
                    <span className="block text-slate-500">Call ₹{r.rates.call}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{status === "pending" ? day(r.createdAt) : `${r.commissionPercent}%`}</td>
                  <td className={`${td} whitespace-nowrap text-xs`}>
                    {status === "approved" ? (
                      <>
                        <span className="font-semibold text-amber-600">{r.rating.count ? `${r.rating.average} ★ (${r.rating.count})` : "No ratings"}</span>
                        <span className="block text-slate-500">
                          {r.consultationCount} sessions · {r.presence}
                          {r.scheduleEnabled ? " · takes bookings" : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <StatusPill status={r.status} />
                        {r.rejectionReason && <span className="mt-1 block max-w-[200px] whitespace-normal text-slate-500">{r.rejectionReason}</span>}
                      </>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    {r.status === "pending" && (
                      <button type="button" onClick={() => setReview(r)} className={btnPrimary}>
                        Review
                      </button>
                    )}
                    {r.status === "approved" && (
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEdit(r)} className={btnGhost}>
                          Edit
                        </button>
                        <Btn busy={a.is(`live:${r.id}`)} busyText="Suspending…" disabled={a.busy} onClick={() => setLive(r, "suspended")} className={btnDanger}>
                          Suspend
                        </Btn>
                      </div>
                    )}
                    {r.status === "suspended" && (
                      <Btn busy={a.is(`live:${r.id}`)} busyText="Reinstating…" disabled={a.busy} onClick={() => setLive(r, "approved")} className={btnGhost}>
                        Reinstate
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Panel>
      {review && (
        <ReviewModal
          r={review}
          onClose={() => setReview(null)}
          onDone={() => {
            setReview(null);
            reload();
          }}
        />
      )}
      {edit && (
        <EditModal
          r={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null);
            reload();
          }}
        />
      )}
    </>
  );
}
