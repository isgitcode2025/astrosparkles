"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AdminTitle,
  Btn,
  btnDanger,
  btnGhost,
  btnPrimary,
  Flash,
  inr,
  input,
  Loading,
  Modal,
  Pager,
  Panel,
  Table,
  Tabs,
  td,
  useAction,
  when,
} from "@/components/admin/kit";
import { StatusPill } from "@/components/site/PageShell";
import { confirmDialog } from "@/components/ui/Confirm";
import { api, ApiRequestError } from "@/lib/api";

type Pooja = {
  sankalpName: string;
  gotra?: string;
  preferredDate?: string;
  wishes?: string;
  status: "scheduled" | "performed";
  scheduledAt?: string;
  performedAt?: string;
  recordingUrl?: string;
  noteToUser?: string;
};
type Order = {
  id: string;
  orderNumber: string;
  type: "pooja" | "course";
  title: string;
  amount: number;
  status: string;
  pooja: Pooja | null;
  createdAt: string;
  user: { name?: string; phone?: string } | null;
};
type Product = {
  id: string;
  type: "pooja" | "course";
  slug: string;
  title: string;
  titleHi: string | null;
  summary: string;
  description: string;
  images: string[];
  category: string | null;
  badge: string | null;
  badgeHi: string | null;
  price: number;
  mrp: number | null;
  status: "draft" | "published";
  lessons: { id: string }[];
};
type OrderTab = "todo" | "poojas" | "courses" | "refunded";

/** "2026-11-02T07:00" in IST for a datetime-local input. */
const toLocalInput = (iso?: string) => (iso ? new Date(new Date(iso).getTime() + 330 * 60_000).toISOString().slice(0, 16) : "");

function PoojaModal({ o, onClose, onDone }: { o: Order; onClose: () => void; onDone: () => void }) {
  const p = o.pooja!;
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(p.scheduledAt));
  const [recordingUrl, setRecordingUrl] = useState(p.recordingUrl ?? "");
  const [note, setNote] = useState(p.noteToUser ?? "");
  const a = useAction();
  const save = (performed: boolean) =>
    a
      .run(
        () =>
          api(`/admin/shop/orders/${o.id}/pooja`, {
            method: "PATCH",
            auth: true,
            body: JSON.stringify({
              ...(scheduledAt ? { scheduledAt: `${scheduledAt}:00+05:30` } : {}),
              ...(recordingUrl ? { recordingUrl } : {}),
              noteToUser: note,
              ...(performed ? { status: "performed" } : {}),
            }),
          }),
        performed ? "Pooja marked as performed. The devotee can see it in My orders." : "Pooja order updated.",
        performed ? "performed" : "save",
      )
      .then((ok) => ok && onDone());
  return (
    <Modal title={`${o.title} · ${o.orderNumber}`} onClose={onClose}>
      <dl className="mb-4 grid grid-cols-3 gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-slate-500">Sankalp name</dt>
        <dd className="col-span-2 font-semibold text-brand-indigo">{p.sankalpName}</dd>
        {p.gotra && (
          <>
            <dt className="text-slate-500">Gotra</dt>
            <dd className="col-span-2">{p.gotra}</dd>
          </>
        )}
        {p.preferredDate && (
          <>
            <dt className="text-slate-500">Preferred date</dt>
            <dd className="col-span-2">{p.preferredDate}</dd>
          </>
        )}
        {p.wishes && (
          <>
            <dt className="text-slate-500">Wishes</dt>
            <dd className="col-span-2">{p.wishes}</dd>
          </>
        )}
        <dt className="text-slate-500">Devotee</dt>
        <dd className="col-span-2">{o.user?.name || o.user?.phone || "—"}</dd>
      </dl>
      <Flash msg={a.msg} />
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-slate-600">Scheduled for (IST)</span>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={`${input} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-slate-600">Recording link (shown to the devotee)</span>
          <input type="url" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://…" className={`${input} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-slate-600">Note to the devotee</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={`${input} w-full`} />
        </label>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Btn busy={a.is("save")} busyText="Saving…" disabled={a.busy} onClick={() => save(false)} className={btnGhost}>
            Save
          </Btn>
          {p.status !== "performed" && (
            <Btn busy={a.is("performed")} busyText="Saving…" disabled={a.busy} onClick={() => save(true)} className={btnPrimary}>
              Mark performed
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Orders() {
  const [tab, setTab] = useState<OrderTab>("todo");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Order[]; total: number; page: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Order | null>(null);
  const a = useAction();
  const params = { todo: "type=pooja&poojaStatus=scheduled&status=paid", poojas: "type=pooja", courses: "type=course", refunded: "status=refunded" }[tab];
  const load = useCallback(() => {
    setError(null);
    api<{ items: Order[]; total: number; page: number }>(`/admin/shop/orders?${params}&page=${page}`, { auth: true })
      .then(setData)
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Could not load"));
  }, [params, page]);
  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const refund = async (o: Order) => {
    const ok = await confirmDialog({
      title: `Refund ${inr(o.amount)} for ${o.orderNumber}?`,
      text: `The money goes back to the user's wallet.${o.type === "course" ? " Course access is removed." : ""}`,
      confirmText: "Refund",
      danger: true,
    });
    if (!ok) return;
    await a.run(() => api(`/admin/shop/orders/${o.id}/refund`, { method: "POST", auth: true }), `${inr(o.amount)} refunded to the wallet.`, `refund:${o.id}`);
    await load();
  };

  return (
    <>
      <Tabs<OrderTab>
        value={tab}
        onChange={(t) => {
          setTab(t);
          setPage(1);
        }}
        options={[
          ["todo", "Poojas to perform"],
          ["poojas", "All poojas"],
          ["courses", "Course sales"],
          ["refunded", "Refunded"],
        ]}
      />
      <Flash msg={a.msg} />
      <Panel>
        {!data ? (
          <Loading error={error} onRetry={load} />
        ) : (
          <>
            <Table head={["Order", "Customer", "Amount", "Status", "Pooja", ""]} empty={data.items.length === 0} minWidth={860}>
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td className={td}>
                    <p className="font-semibold text-brand-indigo">{o.title}</p>
                    <p className="text-xs text-slate-500">
                      {o.orderNumber} · {when(o.createdAt)}
                    </p>
                  </td>
                  <td className={td}>
                    {o.user?.name || "—"}
                    <span className="block text-xs text-slate-500">{o.user?.phone}</span>
                  </td>
                  <td className={`${td} font-semibold`}>{inr(o.amount)}</td>
                  <td className={td}>
                    <StatusPill status={o.status} />
                  </td>
                  <td className={`${td} text-xs`}>
                    {o.pooja ? (
                      <>
                        <span className="font-semibold">For {o.pooja.sankalpName}</span>
                        <span className="block text-slate-500">
                          {o.pooja.status === "performed"
                            ? `Performed ${when(o.pooja.performedAt)}`
                            : o.pooja.scheduledAt
                              ? `Scheduled ${when(o.pooja.scheduledAt)}`
                              : o.pooja.preferredDate
                                ? `Prefers ${o.pooja.preferredDate}`
                                : "Not scheduled"}
                        </span>
                        {o.pooja.recordingUrl && <span className="block text-emerald-700">Recording added</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <div className="flex justify-end gap-2">
                      {o.pooja && o.status === "paid" && (
                        <button type="button" onClick={() => setEdit(o)} className={btnGhost}>
                          Update
                        </button>
                      )}
                      {o.status === "paid" && (
                        <Btn busy={a.is(`refund:${o.id}`)} busyText="Refunding…" disabled={a.busy} onClick={() => refund(o)} className={btnDanger}>
                          Refund
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} total={data.total} limit={50} onPage={setPage} />
          </>
        )}
      </Panel>
      {edit && (
        <PoojaModal
          o={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}

const blank: Product = {
  id: "",
  type: "pooja",
  slug: "",
  title: "",
  titleHi: null,
  summary: "",
  description: "",
  images: [],
  category: null,
  badge: null,
  badgeHi: null,
  price: 0,
  mrp: null,
  status: "draft",
  lessons: [],
};

function ProductModal({ p, onClose, onDone }: { p: Product; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    type: p.type,
    slug: p.slug,
    title: p.title,
    titleHi: p.titleHi ?? "",
    summary: p.summary,
    description: p.description,
    image: p.images[0] ?? "",
    category: p.category ?? "",
    badge: p.badge ?? "",
    badgeHi: p.badgeHi ?? "",
    price: String(p.price),
    mrp: p.mrp ? String(p.mrp) : "",
    status: p.status,
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const a = useAction();
  const save = () =>
    a
      .run(
        () =>
          api(p.id ? `/admin/shop/products/${p.id}` : "/admin/shop/products", {
            method: p.id ? "PUT" : "POST",
            auth: true,
            body: JSON.stringify({
              type: f.type,
              slug: f.slug,
              title: f.title,
              ...(f.titleHi ? { titleHi: f.titleHi } : {}),
              summary: f.summary,
              description: f.description,
              images: f.image ? [f.image, ...p.images.slice(1)] : p.images.slice(1),
              ...(f.category ? { category: f.category } : {}),
              badge: f.badge.trim(),
              badgeHi: f.badgeHi.trim(),
              price: Number(f.price),
              ...(f.mrp ? { mrp: Number(f.mrp) } : {}),
              status: f.status,
            }),
          }),
        p.id ? "Changes saved." : "Created.",
      )
      .then((ok) => ok && onDone());
  const field = `${input} w-full`;
  return (
    <Modal title={p.id ? `Edit ${p.title}` : "New pooja or course"} onClose={onClose}>
      <Flash msg={a.msg} />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-1">
          <span className="mb-1 block text-slate-600">Type</span>
          <select value={f.type} onChange={set("type")} disabled={!!p.id} className={field}>
            <option value="pooja">Pooja</option>
            <option value="course">Course</option>
          </select>
        </label>
        <label className="col-span-1">
          <span className="mb-1 block text-slate-600">Status</span>
          <select value={f.status} onChange={set("status")} className={field}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Title</span>
          <input value={f.title} onChange={set("title")} maxLength={120} className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Hindi title (optional)</span>
          <input value={f.titleHi} onChange={set("titleHi")} maxLength={120} className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">URL slug</span>
          <input value={f.slug} onChange={set("slug")} placeholder="navgraha-shanti-pooja" className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Short summary</span>
          <textarea value={f.summary} onChange={set("summary")} maxLength={300} rows={2} className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Description</span>
          <textarea value={f.description} onChange={set("description")} rows={4} className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Main image URL</span>
          <input type="url" value={f.image} onChange={set("image")} placeholder="https://…" className={field} />
        </label>
        <label>
          <span className="mb-1 block text-slate-600">Price ₹</span>
          <input type="number" min={0} value={f.price} onChange={set("price")} className={field} />
        </label>
        <label>
          <span className="mb-1 block text-slate-600">MRP ₹ (optional, shown struck out)</span>
          <input type="number" min={0} value={f.mrp} onChange={set("mrp")} className={field} />
        </label>
        <label className="col-span-2">
          <span className="mb-1 block text-slate-600">Category</span>
          <input value={f.category} onChange={set("category")} placeholder="graha-shanti, prosperity, vedic…" maxLength={40} className={field} />
        </label>
        <label>
          <span className="mb-1 block text-slate-600">Card label (home page)</span>
          <input value={f.badge} onChange={set("badge")} placeholder="Live Sankalp" maxLength={30} className={field} />
        </label>
        <label>
          <span className="mb-1 block text-slate-600">Card label in Hindi</span>
          <input value={f.badgeHi} onChange={set("badgeHi")} placeholder="लाइव संकल्प" maxLength={30} className={field} />
        </label>
      </div>
      {p.type === "course" && p.id && (
        <p className="mt-3 text-xs text-slate-500">This course has {p.lessons.length} lessons. Lessons and videos are managed through the API for now.</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btnGhost}>
          Cancel
        </button>
        <Btn busy={a.busy} busyText="Saving…" disabled={!f.title || !f.slug || !f.summary} onClick={save} className={btnPrimary}>
          {p.id ? "Save" : "Create"}
        </Btn>
      </div>
    </Modal>
  );
}

function Products() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Product | null>(null);
  const load = useCallback(() => {
    api<Product[]>("/admin/shop/products", { auth: true })
      .then(setItems)
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Could not load"));
  }, []);
  useEffect(load, [load]);
  return (
    <>
      <Panel
        title="Catalogue"
        action={
          <button type="button" onClick={() => setEdit(blank)} className={btnPrimary}>
            <i className="fa-solid fa-plus" aria-hidden /> New
          </button>
        }
      >
        {!items ? (
          <Loading error={error} onRetry={load} />
        ) : (
          <Table head={["Product", "Type", "Price", "Status", ""]} empty={items.length === 0} minWidth={640}>
            {items.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-brand-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.images[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <Link href={`/shop/${p.slug}`} target="_blank" className="font-semibold text-brand-indigo hover:underline">
                        {p.title}
                      </Link>
                      <p className="max-w-md truncate text-xs text-slate-500">{p.summary}</p>
                    </div>
                  </div>
                </td>
                <td className={`${td} capitalize`}>{p.type}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {inr(p.price)}
                  {p.mrp && <span className="ml-1 text-xs text-slate-400 line-through">{inr(p.mrp)}</span>}
                </td>
                <td className={td}>
                  <StatusPill status={p.status === "published" ? "approved" : "pending"} label={p.status} />
                </td>
                <td className={`${td} text-right`}>
                  <button type="button" onClick={() => setEdit(p)} className={btnGhost}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
      {edit && (
        <ProductModal
          p={edit}
          onClose={() => setEdit(null)}
          onDone={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </>
  );
}

export default function AdminShop() {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  return (
    <>
      <AdminTitle title="Poojas & courses" subtitle="Schedule and complete pooja orders, add recordings, refund, and edit the catalogue." />
      <Tabs<"orders" | "products">
        value={tab}
        onChange={setTab}
        options={[
          ["orders", "Orders"],
          ["products", "Catalogue"],
        ]}
      />
      {tab === "orders" ? <Orders /> : <Products />}
    </>
  );
}
