"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminMe } from "@/components/admin/AdminShell";
import { AdminTitle, Btn, btnDanger, btnDark, btnGhost, btnPrimary, day, Flash, inr, input, Loading, Modal, Pager, Panel, Table, Tabs, td, useAction, useAdminList, when } from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";
import { confirmDialog } from "@/components/ui/Confirm";
import { api } from "@/lib/api";

type Row = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: string[];
  status: "active" | "blocked";
  balance: number;
  freeConsultationUsed: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};
type Role = "" | "user" | "astrologer" | "editor" | "admin";

function WalletModal({ u, onClose, onDone }: { u: Row; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const a = useAction();
  const n = Number(amount);
  const save = () =>
    a
      .run(
        () => api(`/admin/users/${u.id}/wallet`, { method: "POST", auth: true, body: JSON.stringify({ amount: n, note }) }),
        n < 0 ? `₹${-n} debited from the wallet.` : `₹${n} credited to the wallet.`,
      )
      .then((ok) => ok && onDone());
  return (
    <Modal title={`Adjust wallet: ${u.name || u.phone}`} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-600">
        Current balance <strong className="text-brand-indigo">{inr(u.balance)}</strong>. Use a negative amount to debit. Every change is written to the wallet ledger with your note.
      </p>
      <Flash msg={a.msg} />
      <div className="space-y-3">
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount in ₹, e.g. 50 or -20" className={`${input} w-full`} />
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note (shown in the user's wallet history)" className={`${input} w-full`} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <Btn busy={a.busy} busyText="Applying…" disabled={!n || note.trim().length < 3} onClick={save} className={btnPrimary}>
            {n < 0 ? `Debit ${inr(-n)}` : n > 0 ? `Credit ${inr(n)}` : "Apply"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function RolesModal({ u, onClose, onDone }: { u: Row; onClose: () => void; onDone: () => void }) {
  const [roles, setRoles] = useState(u.roles.filter((r) => r === "admin" || r === "editor"));
  const a = useAction();
  const save = () =>
    a
      .run(() => api(`/admin/users/${u.id}`, { method: "PATCH", auth: true, body: JSON.stringify({ staffRoles: roles }) }), "Access updated. It applies straight away.")
      .then((ok) => ok && onDone());
  return (
    <Modal title={`Staff access: ${u.name || u.phone}`} onClose={onClose}>
      <Flash msg={a.msg} />
      <div className="space-y-3 text-sm">
        {(
          [
            ["editor", "Editor", "Can write daily, weekly and monthly horoscopes."],
            ["admin", "Admin", "Full access to this admin panel, money and users."],
          ] as const
        ).map(([k, label, help]) => (
          <label key={k} className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-border p-3">
            <input type="checkbox" checked={roles.includes(k)} onChange={(e) => setRoles(e.target.checked ? [...roles, k] : roles.filter((r) => r !== k))} className="mt-1" />
            <span>
              <span className="font-semibold text-brand-indigo">{label}</span>
              <span className="block text-slate-500">{help}</span>
            </span>
          </label>
        ))}
        <p className="text-xs text-slate-500">The person needs to sign out and in again for new access to show.</p>
        <div className="flex justify-end gap-2">
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

export default function AdminUsers() {
  const me = useAdminMe();
  const [role, setRole] = useState<Role>("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useAdminList<Row>("/admin/users", { role, q: search, page });
  const [wallet, setWallet] = useState<Row | null>(null);
  const [roles, setRoles] = useState<Row | null>(null);
  const a = useAction();

  const setStatus = async (u: Row, status: "active" | "blocked") => {
    if (
      status === "blocked" &&
      !(await confirmDialog({ title: `Block ${u.name || u.phone}?`, text: "They are signed out on every device and cannot log in until unblocked.", confirmText: "Block", danger: true }))
    )
      return;
    await a.run(
      () => api(`/admin/users/${u.id}`, { method: "PATCH", auth: true, body: JSON.stringify({ status }) }),
      status === "blocked" ? "User blocked and signed out." : "User unblocked.",
      `status:${u.id}`,
    );
    await reload();
  };

  return (
    <>
      <AdminTitle title="Users" subtitle="Search accounts, adjust wallets, block abuse and grant staff access.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q);
          }}
          className="flex gap-2"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or email" className={input} aria-label="Search users" />
          <button className={btnDark}>Search</button>
        </form>
      </AdminTitle>
      <Tabs<Role>
        value={role}
        onChange={(r) => {
          setRole(r);
          setPage(1);
        }}
        options={[
          ["", "Everyone"],
          ["astrologer", "Astrologers"],
          ["editor", "Editors"],
          ["admin", "Admins"],
        ]}
      />
      <Flash msg={a.msg} />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={reload} />
        ) : (
          <>
            <Table head={["User", "Roles", "Wallet", "Joined", "Last login", "Status", ""]} empty={data.items.length === 0} minWidth={860}>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <td className={td}>
                    <p className="font-semibold text-brand-indigo">{u.name || "No name"}</p>
                    <p className="text-xs text-slate-500">{[u.phone, u.email].filter(Boolean).join(" · ") || "—"}</p>
                  </td>
                  <td className={`${td} text-xs capitalize text-slate-600`}>{u.roles.join(", ")}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <Link href={`/admin/payments?tab=ledger&userId=${u.id}`} className="font-semibold text-brand-indigo hover:underline">
                      {inr(u.balance)}
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{day(u.createdAt)}</td>
                  <td className={`${td} whitespace-nowrap text-slate-500`}>{when(u.lastLoginAt)}</td>
                  <td className={td}>
                    <StatusPill status={u.status === "blocked" ? "rejected" : "approved"} label={u.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setWallet(u)} className={btnGhost}>
                        Wallet
                      </button>
                      {u.id !== me?.id && (
                        <>
                          <button type="button" onClick={() => setRoles(u)} className={btnGhost}>
                            Access
                          </button>
                          {u.status === "active" ? (
                            <Btn busy={a.is(`status:${u.id}`)} busyText="Blocking…" disabled={a.busy} onClick={() => setStatus(u, "blocked")} className={btnDanger}>
                              Block
                            </Btn>
                          ) : (
                            <Btn busy={a.is(`status:${u.id}`)} busyText="Unblocking…" disabled={a.busy} onClick={() => setStatus(u, "active")} className={btnGhost}>
                              Unblock
                            </Btn>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} total={data.total} limit={data.limit} onPage={setPage} />
          </>
        )}
      </Panel>
      {wallet && (
        <WalletModal
          u={wallet}
          onClose={() => setWallet(null)}
          onDone={() => {
            setWallet(null);
            reload();
          }}
        />
      )}
      {roles && (
        <RolesModal
          u={roles}
          onClose={() => setRoles(null)}
          onDone={() => {
            setRoles(null);
            reload();
          }}
        />
      )}
    </>
  );
}
