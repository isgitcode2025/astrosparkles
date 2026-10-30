import { pageLang } from "@/lib/server-lang";
import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { ZODIAC } from "@/components/home/Sections";
import { ConsultCta, ToolHero } from "@/components/site/ToolHero";
import { api } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";

export const metadata: Metadata = {
  title: "Daily Horoscope – Rashifal for all 12 signs",
  description: "Daily, weekly and monthly horoscope for Aries to Pisces in English and Hindi, written by our astrologers.",
};
export const dynamic = "force-dynamic";

type Sign = {
  slug: string;
  en: string;
  hi: string;
  dates: string;
  lord: string;
};
type Item = {
  sign: Sign;
  text: string | null;
  luckyNumber: string | null;
  luckyColor: string | null;
};
type All = {
  period: string;
  periodKey: string;
  lang: "en" | "hi";
  items: Item[];
};

const periods = [
  { key: "daily", en: "Today", hi: "आज" },
  { key: "weekly", en: "This week", hi: "इस सप्ताह" },
  { key: "monthly", en: "This month", hi: "इस माह" },
];
const ICON = Object.fromEntries(ZODIAC.map(([slug, , , icon]) => [slug, icon]));

export default async function HoroscopePage({ searchParams }: { searchParams: { period?: string; lang?: string } }) {
  const period = periods.some((p) => p.key === searchParams.period) ? (searchParams.period as string) : "daily";
  const lang = pageLang(searchParams.lang);
  const hi = lang === "hi";
  let data: All | null = null;
  try {
    data = await api<All>(`/horoscope?period=${period}&lang=${lang}`, {
      cache: "no-store",
    });
  } catch {
    /* API down */
  }
  const q = (p: Partial<{ period: string; lang: string }>) => `/horoscope?period=${p.period ?? period}&lang=${p.lang ?? lang}`;

  return (
    <>
      <ToolHero
        crumbs={[[hi ? "राशिफल" : "Horoscope"]]}
        eyebrow={hi ? "दैनिक राशिफल" : "Rashifal"}
        title={hi ? "आज का राशिफल" : "Horoscope for all 12 signs"}
        subtitle={
          hi
            ? "मेष से मीन तक दैनिक, साप्ताहिक और मासिक राशिफल, हमारे ज्योतिषियों द्वारा लिखा गया।"
            : "Daily, weekly and monthly predictions from Aries to Pisces, written by our astrologers."
        }
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            {periods.map((p) => (
              <Link
                key={p.key}
                href={q({ period: p.key })}
                aria-current={period === p.key ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${period === p.key ? "bg-white text-brand-indigo" : "text-white/80 hover:text-white"}`}
              >
                {hi ? p.hi : p.en}
              </Link>
            ))}
          </div>
          <Link href={q({ lang: hi ? "en" : "hi" })} className="text-sm font-semibold text-brand-gold hover:underline">
            {hi ? "Read in English" : "हिन्दी में पढ़ें"}
          </Link>
        </div>
      </ToolHero>
      <div className="container-site relative -mt-14 space-y-10 pb-16">
        {!data ? (
          <ErrorState title="The horoscope could not be loaded" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((i) => (
              <Link
                key={i.sign.slug}
                href={`/horoscope/${i.sign.slug}?period=${period}&lang=${lang}`}
                className="group flex flex-col rounded-2xl border border-brand-border bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-saffron/60 hover:shadow-hover"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-borderLight bg-brand-cream text-brand-gold transition-colors group-hover:text-brand-saffron">
                    <i className={`fa-solid ${ICON[i.sign.slug] ?? "fa-star"} text-lg`} aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-brand-indigo">{hi ? i.sign.hi : i.sign.en}</h2>
                    <p className="text-xs text-slate-500">
                      {hi ? i.sign.en : i.sign.hi} · {i.sign.dates}
                    </p>
                  </div>
                </div>
                <p className={`mt-3 line-clamp-4 text-sm ${i.text ? "text-slate-700" : "italic text-slate-400"}`}>
                  {i.text ?? (hi ? "राशिफल जल्द प्रकाशित होगा।" : "Will be published soon.")}
                </p>
                {(i.luckyNumber || i.luckyColor) && (
                  <p className="mt-3 flex gap-3 text-xs text-slate-500">
                    {i.luckyNumber && (
                      <span>
                        {hi ? "शुभ अंक" : "Lucky no."} <strong className="text-brand-indigo">{i.luckyNumber}</strong>
                      </span>
                    )}
                    {i.luckyColor && (
                      <span>
                        {hi ? "शुभ रंग" : "Colour"} <strong className="text-brand-indigo">{i.luckyColor}</strong>
                      </span>
                    )}
                  </p>
                )}
                <span className="mt-auto pt-4 text-sm font-bold text-brand-saffron">
                  {hi ? "पूरा पढ़ें" : "Read more"}{" "}
                  <i className="fa-solid fa-arrow-right ml-1 text-xs transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
        <ConsultCta
          text={hi ? "अपनी कुंडली के अनुसार सटीक मार्गदर्शन चाहिए?" : "Want guidance based on your own birth chart?"}
          cta={hi ? "ज्योतिषी से बात करें" : "Talk to an astrologer"}
        />
      </div>
    </>
  );
}
