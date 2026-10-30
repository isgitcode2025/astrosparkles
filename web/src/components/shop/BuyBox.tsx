"use client";

import { Link } from "@/components/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiRequestError, session, type ProductDetail, type ShopOrder } from "@/lib/api";
import { Price } from "./ProductCardView";
import { Spinner } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { toast } from "@/components/ui/Toaster";

const field = "field";

/** Booking form for poojas and buy button for courses. Pays from the wallet. */
export function BuyBox({ p }: { p: ProductDetail }) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(p.enrolled);
  const [name, setName] = useState("");
  const [gotra, setGotra] = useState("");
  const [date, setDate] = useState("");
  const [wishes, setWishes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    text: string;
    recharge?: boolean;
  } | null>(null);
  const [done, setDone] = useState<ShopOrder | null>(null);

  // the page is rendered without login; check ownership in the browser
  const { status, me } = useAuth();
  useEffect(() => {
    if (p.type !== "course") return;
    if (status !== "ready") return setEnrolled(false); // signed out: never show someone else's access
    api<ProductDetail>(`/shop/products/${p.slug}`, { auth: true })
      .then((r) => setEnrolled(r.enrolled))
      .catch(() => undefined);
  }, [p.slug, p.type, status, me?.id]);

  const buy = async () => {
    if (!session.get()) {
      startNavProgress();
      router.push(`/login?next=/shop/${p.slug}`);
      return;
    }
    setBusy(true);
    setError(null);
    let navigating = false;
    try {
      const body =
        p.type === "pooja"
          ? {
              productId: p.id,
              pooja: {
                sankalpName: name,
                gotra: gotra || undefined,
                preferredDate: date || undefined,
                wishes: wishes || undefined,
              },
            }
          : { productId: p.id };
      const o = await api<ShopOrder>("/shop/orders", {
        method: "POST",
        auth: true,
        body: JSON.stringify(body),
      });
      window.dispatchEvent(new Event("kj-wallet"));
      if (p.type === "course") {
        toast.success("Course unlocked. Opening your first lesson…");
        startNavProgress();
        router.push(`/shop/learn/${p.slug}`);
        navigating = true; // keep the button busy until the course opens
        return;
      }
      toast.success("Pooja booked. You can follow it in My orders.");
      setDone(o);
    } catch (e) {
      const text = e instanceof ApiRequestError ? e.message : "Could not complete the order";
      setError({ text, recharge: /recharge|add ₹|balance/i.test(text) });
    } finally {
      if (!navigating) setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card space-y-2 border-emerald-200 bg-emerald-50">
        <p className="font-heading text-lg font-bold text-emerald-800">Pooja booked</p>
        <p className="text-sm">
          Order {done.orderNumber} · ₹{done.amount}
        </p>
        <p className="text-sm text-slate-600">We will confirm the date and share the recording after the pooja.</p>
        <Link href="/shop/orders" className="btn-primary mt-2">
          View my orders
        </Link>
      </div>
    );
  }

  return (
    <div className="card space-y-4 border-t-4 border-t-brand-saffron">
      <Price price={p.price} mrp={p.mrp} discountPercent={p.discountPercent} />
      <p className="text-xs text-slate-400">Price includes GST. Paid from your wallet.</p>

      {p.type === "course" && enrolled ? (
        <Link href={`/shop/learn/${p.slug}`} className="btn-primary w-full">
          Continue learning
        </Link>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            buy();
          }}
        >
          {p.type === "pooja" && (
            <>
              <label className="label">
                Name for the sankalp
                <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
              </label>
              <label className="label">
                Gotra (optional)
                <input maxLength={40} value={gotra} onChange={(e) => setGotra(e.target.value)} className={field} />
              </label>
              <label className="label">
                Preferred date (optional)
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
              </label>
              <label className="label">
                Your wish or concern (optional)
                <textarea rows={2} maxLength={500} value={wishes} onChange={(e) => setWishes(e.target.value)} className={field} />
              </label>
            </>
          )}
          <button type="submit" disabled={busy} aria-busy={busy || undefined} className="btn-primary w-full">
            {busy && <Spinner />}
            {busy ? "Processing…" : p.type === "pooja" ? `Book for ₹${p.price.toLocaleString("en-IN")}` : `Buy course for ₹${p.price.toLocaleString("en-IN")}`}
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.text}{" "}
          {error.recharge && (
            <Link href="/wallet" className="font-semibold underline">
              Recharge wallet
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
