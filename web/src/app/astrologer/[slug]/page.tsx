import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { notFound } from "next/navigation";
import { AboutBox } from "@/components/astrologer/AboutBox";
import { ConsultCard } from "@/components/astrologer/ConsultCard";
import { GiftPanel } from "@/components/astrologer/GiftPanel";
import { ProfileActions } from "@/components/astrologer/ProfileActions";
import { ReviewsPanel } from "@/components/astrologer/ReviewsPanel";
import { Avatar } from "@/components/AstrologerCardView";
import { api, ApiRequestError, type AstrologerProfile, type AstrologerReviews, type Master } from "@/lib/api";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return await api<AstrologerProfile>(`/astrologers/${encodeURIComponent(slug)}`, { cache: "no-store" });
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const a = await load(params.slug);
    return { title: `${a.displayName} – ${a.experienceYears} yrs astrologer`, description: a.bioEn.slice(0, 155) };
  } catch {
    return { title: "Astrologer" };
  }
}

const BADGE: Record<string, string> = { "top-rated": "Top Rated", celebrity: "Celebrity", new: "New Astrologer", verified: "Verified" };
const PRESENCE = {
  online: ["ONLINE", "bg-emerald-500"],
  busy: ["BUSY", "bg-amber-500"],
  offline: ["OFFLINE", "bg-stone-400"],
} as const;
const BAR = ["bg-emerald-600", "bg-emerald-500", "bg-amber-400", "bg-orange-400", "bg-rose-500"];

/** Astrologer detail page from the Stitch "Detail page" design. */
export default async function AstrologerPage({ params }: { params: { slug: string } }) {
  const a = await load(params.slug);
  const [master, reviews] = await Promise.all([
    api<Master>("/config/master", { revalidate: 3600 }).catch(() => null),
    api<AstrologerReviews>(`/consultations/reviews/astrologer/${a.id}?filter=reviews&limit=5`, { cache: "no-store" }).catch(() => null),
  ]);
  const label = (list: { slug?: string; code?: string; en: string }[] | undefined, key: string) => list?.find((x) => (x.slug ?? x.code) === key)?.en ?? key;
  const skills = a.expertise.map((e) => label(master?.expertise, e));
  const concerns = a.concerns.map((c) => label(master?.concerns, c));
  const langs = a.languages.map((l) => label(master?.languages, l));
  const summary = reviews?.summary ?? { average: a.rating.average, count: a.rating.count, breakdown: {}, consultationsLast7Days: 0 };
  const badge = a.badges.find((b) => BADGE[b] && b !== "new");
  const [presenceLabel, presenceTone] = PRESENCE[a.presence];

  return (
    <div className="bg-[#FAF7F2]">
      <nav className="mx-auto flex w-full max-w-7xl items-center space-x-2 px-4 pb-2 pt-4 text-xs text-stone-500 sm:px-6 lg:px-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-saffron">
          Home
        </Link>
        <span>›</span>
        <Link href="/astrologers" className="hover:text-brand-saffron">
          Astrologer
        </Link>
        {a.expertise[0] && (
          <>
            <span>›</span>
            <Link href={`/astrologers?expertise=${a.expertise[0]}`} className="hover:text-brand-saffron">
              {skills[0]}
            </Link>
          </>
        )}
        <span>›</span>
        <span className="truncate font-semibold text-stone-800">{a.displayName}</span>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 py-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* ---------- left column ---------- */}
          <div className="space-y-6 lg:col-span-8">
            <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-50 opacity-60" />
              <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className="h-28 w-28 rounded-full border-2 border-brand-saffron p-1 shadow-sm sm:h-32 sm:w-32">
                    {a.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatarUrl} alt={a.displayName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                        <Avatar name={a.displayName} url={null} size={120} />
                      </div>
                    )}
                  </div>
                  <span className={`absolute bottom-1 right-2 inline-flex items-center rounded-full border-2 border-white px-2 py-0.5 text-[11px] font-bold text-white shadow-xs ${presenceTone}`}>
                    {presenceLabel}
                  </span>
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">{a.displayName}</h1>
                    {a.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                        <i className="fa-solid fa-certificate text-amber-500" aria-hidden />
                        Verified
                      </span>
                    )}
                    {badge && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-brand-indigo">
                        {BADGE[badge]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-stone-600 sm:justify-start">
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-solid fa-language text-stone-400" aria-hidden />
                      {langs.join(", ")}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-regular fa-clock text-stone-400" aria-hidden />
                      {a.experienceYears}+ Years Exp
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="inline-flex items-center gap-1 font-bold text-brand-dark">
                      {summary.count > 0 ? (
                        <>
                          <span className="text-amber-500">★</span> {summary.average.toFixed(1)} ({summary.count} rating{summary.count === 1 ? "" : "s"})
                        </>
                      ) : (
                        <span className="font-semibold text-stone-500">No ratings yet</span>
                      )}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {[skills[0], ...concerns.slice(0, 2)].filter(Boolean).map((t) => (
                      <span key={t} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-brand-dark">
                        {t}
                      </span>
                    ))}
                  </div>
                  {a.code && <p className="mt-2 text-[11px] text-stone-400">ID {a.code}</p>}
                </div>

                <ProfileActions astrologerId={a.id} slug={a.slug} name={a.displayName} followers={a.followerCount} />
              </div>
            </section>

            {/* on phones the booking card comes right after the profile */}
            <div className="lg:hidden">
              <ConsultCard
                astrologerId={a.id}
                slug={a.slug}
                rates={a.rates}
                presence={a.presence}
                weekCount={summary.consultationsLast7Days}
                totalCount={a.consultationCount}
                name={a.displayName}
              />
            </div>

            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-dark">
                <span>About {a.displayName}</span>
                <span className="h-2 w-2 rounded-full bg-brand-saffron" />
              </h2>
              <AboutBox text={a.bioEn} textHi={a.bioHi || undefined} />
            </section>

            <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-lg font-bold text-brand-dark">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-2.5">
                {[...skills, ...concerns].map((t) => (
                  <span key={t} className="rounded-lg bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-800">
                    {t}
                  </span>
                ))}
              </div>
              {a.qualifications.length > 0 && (
                <div className="pt-2">
                  <h3 className="mb-2 text-sm font-bold text-brand-dark">Qualifications</h3>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {a.qualifications.map((q) => (
                      <li key={q} className="flex items-start gap-2">
                        <i className="fa-solid fa-graduation-cap mt-1 text-xs text-brand-saffron" aria-hidden />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <ReviewsPanel astrologerId={a.id} name={a.displayName} avatarUrl={a.avatarUrl} initial={reviews} />

            <GiftPanel astrologerId={a.id} slug={a.slug} name={a.displayName} gifts={master?.gifts ?? []} />
          </div>

          {/* ---------- right column ---------- */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
            <div className="hidden lg:block">
              <ConsultCard
                astrologerId={a.id}
                slug={a.slug}
                rates={a.rates}
                presence={a.presence}
                weekCount={summary.consultationsLast7Days}
                totalCount={a.consultationCount}
                name={a.displayName}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="font-heading text-base font-bold text-brand-dark">Ratings</h3>
                <span className="text-xs text-stone-500">{summary.count > 0 ? `Based on ${summary.count} verified user${summary.count === 1 ? "" : "s"}` : "No ratings yet"}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="font-heading text-4xl font-black text-brand-dark">
                    {summary.count > 0 ? summary.average.toFixed(1) : "–"} <span className="text-3xl text-amber-500">★</span>
                  </div>
                  <div className="text-xs font-medium text-stone-500">{summary.count} ratings</div>
                </div>
                <div className="flex-grow space-y-1.5 text-xs font-semibold text-stone-600">
                  {[5, 4, 3, 2, 1].map((s, i) => {
                    const n = summary.breakdown[String(s)] ?? 0;
                    const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="w-6">{s} ★</span>
                        <div className="h-2 flex-grow overflow-hidden rounded-full bg-stone-100">
                          <div className={`h-full rounded-full ${BAR[i]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3.5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              {[
                ["fa-stopwatch", "bg-amber-50 text-amber-600", "Pay only for the minutes you talk"],
                ["fa-check", "bg-emerald-50 text-emerald-600", "Verified expert astrologers"],
                ["fa-lock", "bg-indigo-50 text-brand-dark", "Secure payments, private chats"],
              ].map(([icon, tone, text]) => (
                <div key={text} className="flex items-center gap-3 text-xs font-semibold text-stone-700">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <i className={`fa-solid ${icon}`} aria-hidden />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
