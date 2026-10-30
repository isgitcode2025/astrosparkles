import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { ConsultCta, ToolHero } from "@/components/site/ToolHero";
import { ProductCardView } from "@/components/shop/ProductCardView";
import { api, type ProductCard } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";

export const metadata: Metadata = {
  title: "Online Poojas & Astrology Courses",
  description: "Book poojas performed in your name by verified purohits, and learn Vedic astrology and numerology online.",
};
export const dynamic = "force-dynamic";

const tabs = [
  { key: "", label: "All" },
  { key: "pooja", label: "Poojas" },
  { key: "course", label: "Courses" },
];

export default async function ShopPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type === "pooja" || searchParams.type === "course" ? searchParams.type : "";
  let items: ProductCard[] | null = null;
  try {
    items = await api<ProductCard[]>(`/shop/products${type ? `?type=${type}` : ""}`, { cache: "no-store" });
  } catch {
    /* API down */
  }
  const poojas = items?.filter((p) => p.type === "pooja") ?? [];
  const courses = items?.filter((p) => p.type === "course") ?? [];

  return (
    <>
      <ToolHero
        crumbs={[["Store"]]}
        eyebrow="Online pooja & learning"
        title="Poojas & Courses"
        subtitle="Poojas performed in your name by our purohits with the recording shared, and courses to learn astrology yourself."
        chips={[
          ["fa-video", "Recording shared after the pooja"],
          ["fa-wallet", "Pay from your wallet"],
          ["fa-hands-praying", "Sankalp in your name and gotra"],
        ]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.key ? `/shop?type=${t.key}` : "/shop"}
                aria-current={type === t.key ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${type === t.key ? "bg-white text-brand-indigo" : "text-white/80 hover:text-white"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <Link href="/shop/orders" className="text-sm font-semibold text-brand-gold hover:underline">
            My orders
          </Link>
          <Link href="/shop/my-courses" className="text-sm font-semibold text-brand-gold hover:underline">
            My courses
          </Link>
        </div>
      </ToolHero>
      <div className="container-site relative -mt-14 pb-16">
        {!items ? (
          <ErrorState title="Poojas and courses could not be loaded" />
        ) : items.length === 0 ? (
          <p className="card">Nothing here yet.</p>
        ) : (
          <div className="space-y-10">
            {poojas.length > 0 && (
              <section>
                {!type && (
                  <h2 className="mb-4 inline-block rounded-full bg-white px-4 py-1 shadow-soft font-heading text-xl font-bold text-brand-indigo">
                    Online poojas
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {poojas.map((p) => (
                    <ProductCardView key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}
            {courses.length > 0 && (
              <section>
                {!type && <h2 className="mb-4 font-heading text-xl font-bold text-brand-indigo">Courses</h2>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((p) => (
                    <ProductCardView key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="mt-10">
          <ConsultCta text="Not sure which pooja suits your chart? Ask an astrologer first." />
        </div>
      </div>
    </>
  );
}
