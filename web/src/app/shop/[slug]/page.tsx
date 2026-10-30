import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/shop/BuyBox";
import { ProductImage } from "@/components/shop/ProductCardView";
import { api, ApiRequestError, type ProductDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await api<ProductDetail>(`/shop/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const p = await load(params.slug);
    return { title: p.title, description: p.summary };
  } catch {
    return { title: "Shop" };
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  return (
    <div className="container-site py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-indigo">
          Home
        </Link>
        <i className="fa-solid fa-chevron-right text-[8px]" aria-hidden />
        <Link href="/shop" className="hover:text-brand-indigo">
          Poojas &amp; Courses
        </Link>
        <i className="fa-solid fa-chevron-right text-[8px]" aria-hidden />
        <span className="font-semibold text-brand-indigo">{p.title}</span>
      </nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <article className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden p-0">
            <ProductImage p={p} className="h-64 w-full sm:h-80" />
            <div className="p-6">
              <span className="rounded-full bg-brand-cream px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-saffron">
                {p.type === "pooja" ? "Online pooja" : "Course"}
              </span>
              <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-indigo sm:text-3xl">{p.title}</h1>
              {p.titleHi && <p className="text-slate-400">{p.titleHi}</p>}
              <p className="mt-2 text-slate-700">{p.summary}</p>
              <p className="mt-2 text-sm text-slate-500">
                {p.type === "pooja"
                  ? [p.performedBy, p.durationMinutes ? `${p.durationMinutes} minutes` : null, "Performed online"].filter(Boolean).join(" · ")
                  : [p.instructor, p.language, p.level, `${p.lessonCount} lessons`].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {p.description && (
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-brand-primary">About</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{p.description}</p>
            </div>
          )}

          {p.includes.length > 0 && (
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-brand-primary">What you get</h2>
              <ul className="mt-3 space-y-2">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-2.5 text-slate-700">
                    <i className="fa-solid fa-circle-check mt-1 text-emerald-600" aria-hidden />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.type === "course" && p.lessons.length > 0 && (
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-brand-primary">Lessons</h2>
              <ol className="mt-3 divide-y divide-brand-border">
                {p.lessons.map((l, i) => (
                  <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {i + 1}. {l.title}
                      {l.freePreview && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Free preview</span>}
                    </span>
                    {l.durationMinutes > 0 && <span className="text-slate-400">{l.durationMinutes} min</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {p.type === "pooja" && (
            <div className="card">
              <h2 className="font-heading text-lg font-bold text-brand-primary">How it works</h2>
              <ol className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ["fa-pen-to-square", "Book and share the name (and gotra) for the sankalp."],
                  ["fa-calendar-check", "We confirm the muhurat and date with you."],
                  ["fa-om", "The purohit performs the pooja in your name."],
                  ["fa-video", "You receive the recording in My orders."],
                ].map(([icon, text], i) => (
                  <li key={text} className="flex gap-3 rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-heading text-sm font-bold text-brand-saffron shadow-xs">
                      {i + 1}
                    </span>
                    <span>
                      <i className={`fa-solid ${icon} mr-1.5 text-brand-indigo`} aria-hidden />
                      {text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </article>

        <aside className="h-fit lg:sticky lg:top-20">
          <BuyBox p={p} />
        </aside>
      </div>
    </div>
  );
}
