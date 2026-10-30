import { api, type AstrologerCard, type Master, type Paged, type ProductCard } from "@/lib/api";
import { getBrand } from "@/lib/brand";
import type { Lang } from "@/lib/i18n";
import { homeCopy } from "./home/copy";
import { Hero } from "./home/Hero";
import { ConsultCategories, Faq, FaqJsonLd, Poojas, Readings, TopAstrologers, TrustStats, ZodiacStrip } from "./home/Sections";
import type { AstrologerStats } from "./home/types";

/** A failing section must never break the home page, so every call falls back to null. */
const safe = <T,>(p: Promise<T>) => p.catch(() => null);

/** Home page built from the Figma "Home Page" design, wired to live API data. */
export async function HomeContent({ lang }: { lang: Lang }) {
  const c = homeCopy(lang);
  const hl = lang === "hi" ? "hi" : "en";
  const [brand, stats, top, master, poojas] = await Promise.all([
    getBrand(),
    safe(api<AstrologerStats>("/astrologers/stats", { revalidate: 60 })),
    safe(api<Paged<AstrologerCard>>("/astrologers?limit=8&sort=recommended", { revalidate: 30 })),
    safe(api<Master>("/config/master", { revalidate: 3600 })),
    safe(api<ProductCard[]>("/shop/products?type=pooja", { revalidate: 300 })),
  ]);

  return (
    <>
      <Hero c={c} online={stats?.online ?? 0} />
      <TopAstrologers c={c} items={top?.items ?? []} master={master} lang={hl} />
      <ZodiacStrip c={c} lang={hl} />
      <Readings c={c} lang={hl} />
      <ConsultCategories c={c} stats={stats} />
      <Poojas c={c} items={(poojas ?? []).slice(0, 3)} lang={hl} />
      <TrustStats c={c} stats={stats} />
      <Faq c={c} brand={brand.name} />
      <FaqJsonLd c={c} brand={brand.name} />
    </>
  );
}
