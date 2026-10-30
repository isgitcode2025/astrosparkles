import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { ConsultCta, ToolHero } from "@/components/site/ToolHero";
import { ProductCardView } from "@/components/shop/ProductCardView";
import { api, type ProductCard } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";
import { pageLang } from "@/lib/server-lang";

export async function generateMetadata({ searchParams }: { searchParams: { lang?: string } }): Promise<Metadata> {
  const lang = pageLang(searchParams.lang);
  return lang === "hi"
    ? {
        title: "ऑनलाइन पूजा और ज्योतिष कोर्स",
        description: "सत्यापित पुरोहितों द्वारा आपके नाम पर की जाने वाली पूजा बुक करें, और ऑनलाइन वैदिक ज्योतिष व अंकशास्त्र सीखें।",
      }
    : {
        title: "Online Poojas & Astrology Courses",
        description: "Book poojas performed in your name by verified purohits, and learn Vedic astrology and numerology online.",
      };
}
export const dynamic = "force-dynamic";

const tabs = {
  en: [
    { key: "", label: "All" },
    { key: "pooja", label: "Poojas" },
    { key: "course", label: "Courses" },
  ],
  hi: [
    { key: "", label: "सभी" },
    { key: "pooja", label: "पूजा" },
    { key: "course", label: "कोर्स" },
  ],
} as const;

export default async function ShopPage({ searchParams }: { searchParams: { type?: string; lang?: string } }) {
  const lang = pageLang(searchParams.lang);
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
        lang={lang}
        crumbs={[[lang === "hi" ? "स्टोर" : "Store"]]}
        eyebrow={lang === "hi" ? "ऑनलाइन पूजा और सीखना" : "Online pooja & learning"}
        title={lang === "hi" ? "पूजा और कोर्स" : "Poojas & Courses"}
        subtitle={
          lang === "hi"
            ? "हमारे पुरोहितों द्वारा आपके नाम पर की जाने वाली पूजा, जिसकी रिकॉर्डिंग साझा की जाती है, और स्वयं ज्योतिष सीखने के कोर्स।"
            : "Poojas performed in your name by our purohits with the recording shared, and courses to learn astrology yourself."
        }
        chips={
          lang === "hi"
            ? [
                ["fa-video", "पूजा के बाद रिकॉर्डिंग साझा की जाएगी"],
                ["fa-wallet", "अपने वॉलेट से भुगतान करें"],
                ["fa-hands-praying", "आपके नाम और गोत्र में संकल्प"],
              ]
            : [
                ["fa-video", "Recording shared after the pooja"],
                ["fa-wallet", "Pay from your wallet"],
                ["fa-hands-praying", "Sankalp in your name and gotra"],
              ]
        }
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            {tabs[lang].map((t) => (
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
            {lang === "hi" ? "मेरे ऑर्डर" : "My orders"}
          </Link>
          <Link href="/shop/my-courses" className="text-sm font-semibold text-brand-gold hover:underline">
            {lang === "hi" ? "मेरे कोर्स" : "My courses"}
          </Link>
        </div>
      </ToolHero>
      <div className="container-site relative -mt-14 pb-16">
        {!items ? (
          <ErrorState lang={lang} title={lang === "hi" ? "पूजा और कोर्स लोड नहीं हो सके" : "Poojas and courses could not be loaded"} />
        ) : items.length === 0 ? (
          <p className="card">{lang === "hi" ? "यहाँ अभी कुछ नहीं है।" : "Nothing here yet."}</p>
        ) : (
          <div className="space-y-10">
            {poojas.length > 0 && (
              <section>
                {!type && (
                  <h2 className="mb-4 inline-block rounded-full bg-white px-4 py-1 shadow-soft font-heading text-xl font-bold text-brand-indigo">
                    {lang === "hi" ? "ऑनलाइन पूजा" : "Online poojas"}
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {poojas.map((p) => (
                    <ProductCardView key={p.id} p={p} lang={lang} />
                  ))}
                </div>
              </section>
            )}
            {courses.length > 0 && (
              <section>
                {!type && <h2 className="mb-4 font-heading text-xl font-bold text-brand-indigo">{lang === "hi" ? "कोर्स" : "Courses"}</h2>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.map((p) => (
                    <ProductCardView key={p.id} p={p} lang={lang} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="mt-10">
          <ConsultCta
            text={lang === "hi" ? "निश्चित नहीं कि आपकी कुंडली के लिए कौन सी पूजा उपयुक्त है? पहले किसी ज्योतिषी से पूछें।" : "Not sure which pooja suits your chart? Ask an astrologer first."}
            cta={lang === "hi" ? "ज्योतिषी से बात करें" : "Talk to an astrologer"}
          />
        </div>
      </div>
    </>
  );
}
