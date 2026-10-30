import { Link } from "@/components/i18n";
import type { ProductCard } from "@/lib/api";

/** Product image, or a branded placeholder until real photos are uploaded. */
export function ProductImage({ p, className = "" }: { p: Pick<ProductCard, "image" | "title" | "type">; className?: string }) {
  if (p.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.image} alt={p.title} className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-primary-dark ${className}`}>
      <div className="text-center text-brand-gold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.svg" alt="" className="mx-auto h-12 w-12 opacity-80" />
        <p className="mt-2 px-4 text-sm font-medium text-white/90">{p.title}</p>
      </div>
    </div>
  );
}

export function Price({ price, mrp, discountPercent }: { price: number; mrp: number | null; discountPercent: number }) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-heading text-lg font-extrabold text-brand-indigo">₹{price.toLocaleString("en-IN")}</span>
      {mrp && <span className="text-sm text-slate-400 line-through">₹{mrp.toLocaleString("en-IN")}</span>}
      {discountPercent > 0 && <span className="text-xs font-semibold text-emerald-700">{discountPercent}% off</span>}
    </span>
  );
}

export function ProductCardView({ p }: { p: ProductCard }) {
  return (
    <Link
      href={`/shop/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-saffron/60 hover:shadow-hover"
    >
      <div className="overflow-hidden">
        <ProductImage p={p} className="h-44 w-full transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-base font-bold text-brand-indigo">{p.title}</h3>
        {p.titleHi && <p className="text-sm text-slate-400">{p.titleHi}</p>}
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.summary}</p>
        <p className="mt-2 text-xs text-slate-400">
          {p.type === "pooja"
            ? `Performed online${p.durationMinutes ? ` · ${p.durationMinutes} min` : ""}`
            : `${p.lessonCount} lessons${p.language ? ` · ${p.language}` : ""}${p.level ? ` · ${p.level}` : ""}`}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <Price price={p.price} mrp={p.mrp} discountPercent={p.discountPercent} />
          <span className="rounded-full bg-brand-saffron px-4 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-brand-saffronHover">
            {p.type === "pooja" ? "Book pooja" : "View course"}
          </span>
        </div>
      </div>
    </Link>
  );
}
