import { pageLang } from "@/lib/server-lang";
import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { notFound } from "next/navigation";
import { ZODIAC } from "@/components/home/Sections";
import { ToolHero } from "@/components/site/ToolHero";
import { api, ApiRequestError } from "@/lib/api";

export const dynamic = "force-dynamic";

type Sign = {
  slug: string;
  en: string;
  hi: string;
  dates: string;
  lord: string;
};
type One = {
  sign: Sign;
  period: string;
  periodKey: string;
  lang: "en" | "hi";
  text: string | null;
  luckyNumber: string | null;
  luckyColor: string | null;
  mantra: string | null;
  remedy: string | null;
  scores: {
    love?: number;
    career?: number;
    money?: number;
    health?: number;
  } | null;
};

const periods = [
  { key: "daily", en: "Today", hi: "आज" },
  { key: "weekly", en: "This week", hi: "इस सप्ताह" },
  { key: "monthly", en: "This month", hi: "इस माह" },
];

async function load(sign: string, period: string, lang: string) {
  try {
    return await api<One>(`/horoscope/${encodeURIComponent(sign)}?period=${period}&lang=${lang}`, { cache: "no-store" });
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { sign: string };
  searchParams: { period?: string; lang?: string };
}): Promise<Metadata> {
  try {
    const r = await load(params.sign, searchParams.period ?? "daily", pageLang(searchParams.lang));
    return {
      title: `${r.sign.en} (${r.sign.hi}) ${r.period} horoscope`,
      description: r.text?.slice(0, 155) ?? undefined,
    };
  } catch {
    return { title: "Horoscope" };
  }
}

export default async function SignPage({ params, searchParams }: { params: { sign: string }; searchParams: { period?: string; lang?: string } }) {
  const period = periods.some((p) => p.key === searchParams.period) ? (searchParams.period as string) : "daily";
  const lang = pageLang(searchParams.lang);
  const r = await load(params.sign, period, lang);
  const hi = lang === "hi";

  const icon = ZODIAC.find(([slug]) => slug === r.sign.slug)?.[3] ?? "fa-star";

  return (
    <>
      <ToolHero
        crumbs={[[hi ? "राशिफल" : "Horoscope", "/horoscope"], [hi ? r.sign.hi : r.sign.en]]}
        eyebrow={`${r.sign.dates} · ${hi ? "स्वामी" : "Ruling planet"}: ${r.sign.lord}`}
        title={hi ? `${r.sign.hi} राशिफल` : `${r.sign.en} Horoscope`}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            {periods.map((p) => (
              <Link
                key={p.key}
                href={`/horoscope/${r.sign.slug}?period=${p.key}&lang=${lang}`}
                aria-current={period === p.key ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${period === p.key ? "bg-white text-brand-indigo" : "text-white/80 hover:text-white"}`}
              >
                {hi ? p.hi : p.en}
              </Link>
            ))}
          </div>
          <Link href={`/horoscope/${r.sign.slug}?period=${period}&lang=${hi ? "en" : "hi"}`} className="text-sm font-semibold text-brand-gold hover:underline">
            {hi ? "Read in English" : "हिन्दी में पढ़ें"}
          </Link>
        </div>
      </ToolHero>
      <div className="container-site relative -mt-14 pb-16">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <article className="card lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-borderLight bg-brand-cream text-brand-saffron">
                <i className={`fa-solid ${icon} text-2xl`} aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-xl font-bold text-brand-indigo">{hi ? r.sign.hi : r.sign.en}</h2>
                <p className="text-sm text-slate-500">{periods.find((p) => p.key === period)?.[hi ? "hi" : "en"]}</p>
              </div>
            </div>
            <p className={`mt-6 whitespace-pre-line text-lg leading-relaxed ${r.text ? "text-slate-700" : "italic text-slate-400"}`}>
              {r.text ?? (hi ? "इस अवधि का राशिफल जल्द प्रकाशित होगा।" : "The horoscope for this period will be published soon.")}
            </p>
            {(r.mantra || r.remedy) && (
              <div className="mt-6 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-slate-700">
                {r.mantra && (
                  <p>
                    <i className="fa-solid fa-om mr-2 text-brand-saffron" aria-hidden />
                    <strong className="text-brand-indigo">{hi ? "मंत्र" : "Mantra"}:</strong> {r.mantra}
                  </p>
                )}
                {r.remedy && (
                  <p>
                    <i className="fa-solid fa-hand-holding-heart mr-2 text-brand-saffron" aria-hidden />
                    <strong className="text-brand-indigo">{hi ? "उपाय" : "Remedy"}:</strong> {r.remedy}
                  </p>
                )}
              </div>
            )}
          </article>

          <aside className="space-y-4">
            {(r.luckyNumber || r.luckyColor) && (
              <div className="card grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{hi ? "शुभ अंक" : "Lucky number"}</p>
                  <p className="mt-1 font-heading text-2xl font-extrabold text-brand-indigo">{r.luckyNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{hi ? "शुभ रंग" : "Lucky colour"}</p>
                  <p className="mt-1 font-heading text-2xl font-extrabold text-brand-indigo">{r.luckyColor ?? "—"}</p>
                </div>
              </div>
            )}
            {r.scores && (
              <div className="card space-y-2 text-sm">
                {(["love", "career", "money", "health"] as const)
                  .filter((k) => r.scores?.[k])
                  .map((k) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-brand-indigo">{k}</span>
                      <span className="text-brand-saffron">
                        {"★".repeat(r.scores?.[k] ?? 0)}
                        <span className="text-slate-200">{"★".repeat(5 - (r.scores?.[k] ?? 0))}</span>
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-midnight p-6 text-white shadow-celestial">
              <p className="font-heading text-lg font-bold">
                {hi ? "अपनी कुंडली के अनुसार सटीक मार्गदर्शन पाएं।" : "Want guidance based on your own birth chart?"}
              </p>
              <Link href="/astrologers" className="btn-primary mt-4">
                {hi ? "ज्योतिषी से बात करें" : "Talk to an astrologer"}
              </Link>
            </div>
            <div className="card">
              <p className="mb-3 text-sm font-bold text-brand-indigo">{hi ? "अन्य राशियाँ" : "Other signs"}</p>
              <div className="grid grid-cols-4 gap-2">
                {ZODIAC.filter(([slug]) => slug !== r.sign.slug).map(([slug, en, hiName, ic]) => (
                  <Link
                    key={slug}
                    href={`/horoscope/${slug}?period=${period}&lang=${lang}`}
                    title={hi ? hiName : en}
                    className="flex flex-col items-center rounded-xl p-2 text-center hover:bg-brand-cream"
                  >
                    <i className={`fa-solid ${ic} text-brand-gold`} aria-hidden />
                    <span className="mt-1 text-[10px] font-semibold text-slate-600">{hi ? hiName : en}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
