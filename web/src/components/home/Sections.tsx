import { Link } from "@/components/i18n";
import type { AstrologerCard, Master, ProductCard } from "@/lib/api";
import type { HomeCopy } from "./copy";
import { ArrowCircle, FIG, SectionHead, Sparkle, StarOutline } from "./fig";
import type { AstrologerStats } from "./types";

type L = "en" | "hi";

/** 1440px-wide decoration layer, centred, so it lines up with the 1280px content like in the design. */
function Decor({ src, top = 0, height }: { src: string; top?: number; height: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${FIG}/${src}`}
      alt=""
      aria-hidden
      width={1440}
      height={height}
      loading="lazy"
      className="pointer-events-none absolute left-1/2 hidden w-[1440px] max-w-none -translate-x-1/2 select-none lg:block"
      style={{ top }}
    />
  );
}

const wrap = "relative mx-auto w-full max-w-[1312px] px-4";

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-4 font-ui text-sm font-medium text-brand-saffron">
      {label}
      <ArrowCircle className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

// ---------- Top online astrologers ----------

function initials(name: string) {
  return name
    .replace(/^(pandit|acharya|swami|dr\.?)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopAstrologers({ c, items, master, lang }: { c: HomeCopy; items: AstrologerCard[]; master: Master | null; lang: L }) {
  const label = (list: { slug?: string; code?: string; en: string; hi: string }[] | undefined, key: string) => {
    const m = list?.find((x) => (x.slug ?? x.code) === key);
    return m ? m[lang] : key;
  };
  const tag = (a: AstrologerCard): string => {
    if (a.presence === "busy") return c.top.busy;
    if (a.presence === "offline") return c.top.offline;
    if (a.rates.chatOffer !== undefined && a.rates.chatOffer < a.rates.chat) return c.top.offer;
    const b = a.badges.find((x) => c.top.badges[x]);
    if (b) return c.top.badges[b];
    return c.top.firstFree;
  };

  return (
    <section id="consult-experts" className="relative scroll-mt-24 bg-fig-mist pb-[51px]">
      <Decor src="decor-astro.png" top={-77} height={1180} />
      <div className={wrap}>
        <SectionHead title={c.top.title} text={c.top.text} action={<ViewAll href="/astrologers" label={c.top.viewAll} />} />
        {items.length === 0 ? (
          <p className="mt-10 bg-white p-6 text-center font-ui text-sm text-fig-muted">{c.top.empty}</p>
        ) : (
          <div className="fig-astro-grid mt-10 grid grid-cols-1 gap-x-5 gap-y-[19px] sm:grid-cols-2 lg:grid-cols-4">
            {items.map((a, i) => {
              const offer = a.rates.chatOffer !== undefined && a.rates.chatOffer < a.rates.chat;
              const price = offer ? a.rates.chatOffer! : a.rates.chat;
              return (
                <article key={a.id} className={`fig-astro-card group relative mx-auto h-[458px] w-full max-w-[305px] ${i === 1 ? "is-featured" : ""}`}>
                  <Link href={`/astrologer/${a.slug}`} className="absolute inset-0 z-0" aria-label={a.displayName} />
                  {/* rating */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 font-ui text-xs font-medium">
                    {a.rating.count > 0 ? (
                      <>
                        <span className="flex items-center gap-[5px] text-fig-ink">
                          <StarOutline className="text-brand-saffron" />
                          {a.rating.average.toFixed(2)}
                        </span>
                        <span className="text-fig-faint">|</span>
                        <span className="text-fig-muted">({a.rating.count})</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-[5px] text-fig-ink">
                        <StarOutline className="text-brand-saffron" />
                        {c.top.newBadge}
                      </span>
                    )}
                  </div>
                  {/* arched photo */}
                  <div className="pointer-events-none absolute left-1/2 top-6 h-[250px] w-[240px] -translate-x-1/2 rounded-t-full border border-fig-ink">
                    <div className="absolute inset-[11px] overflow-hidden rounded-t-full bg-fig-sand">
                      {a.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                      ) : (
                        <div className="flex h-full w-full items-end justify-center bg-gradient-to-b from-fig-sand to-brand-saffron/25 pb-14 font-display text-6xl font-medium text-brand-dark/70">
                          {initials(a.displayName)}
                        </div>
                      )}
                    </div>
                    <Sparkle className="absolute right-[-7px] top-[163px] text-fig-ink" />
                    <span
                      className={`absolute bottom-3 left-3 h-3 w-3 rounded-full border-2 border-white ${a.presence === "online" ? "bg-emerald-500" : a.presence === "busy" ? "bg-amber-500" : "bg-gray-400"}`}
                      title={a.presence === "busy" ? c.top.busy : a.presence === "offline" ? c.top.offline : c.stats.online}
                    />
                  </div>
                  {/* details */}
                  <div className="pointer-events-none absolute left-[14px] right-[14px] top-[288px] flex flex-col gap-2">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="truncate font-display text-xl font-medium text-fig-ink group-hover:text-brand-saffron">{a.displayName}</h3>
                      <p className="truncate font-ui text-xs text-fig-muted">
                        {a.expertise
                          .slice(0, 2)
                          .map((e) => label(master?.expertise, e))
                          .join(", ")}
                      </p>
                    </div>
                    <div className="h-px w-full border-t border-dashed border-fig-faint" />
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 flex-col gap-1.5 font-ui text-xs text-fig-muted">
                        <span className="flex items-center gap-2">
                          <span className="bg-brand-saffron/10 p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`${FIG}/ic-lang.png`} alt="" width={14} height={14} />
                          </span>
                          <span className="truncate">
                            {a.languages
                              .slice(0, 2)
                              .map((l) => label(master?.languages, l))
                              .join(", ")}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="bg-brand-saffron/10 p-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`${FIG}/ic-exp.png`} alt="" width={14} height={14} />
                          </span>
                          {c.top.exp(a.experienceYears)}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="-mb-1 flex items-baseline whitespace-nowrap font-ui">
                          {offer && <span className="mr-1 text-[11px] text-fig-faint line-through">₹{a.rates.chat}</span>}
                          <span className="text-xl font-light text-brand-saffron">₹</span>
                          <span className="text-xl font-medium text-fig-ink">{price}</span>
                          <span className="text-xs text-fig-muted">{c.top.perMin}</span>
                        </span>
                        <span className="font-ui text-[11px] text-fig-ink">{tag(a)}</span>
                      </div>
                    </div>
                    <div className="pointer-events-auto relative z-10 mt-2 flex gap-3">
                      <Link
                        href={`/astrologer/${a.slug}?mode=chat`}
                        className="flex flex-1 items-center justify-center gap-2 border border-brand-dark py-1.5 font-ui text-sm font-medium text-brand-dark transition-colors hover:bg-brand-dark/5"
                      >
                        {c.top.chat}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${FIG}/ic-chat.png`} alt="" width={17} height={17} />
                      </Link>
                      <Link
                        href={`/astrologer/${a.slug}?mode=call`}
                        className="flex flex-1 items-center justify-center gap-2 border border-brand-saffron py-1.5 font-ui text-sm font-medium text-brand-saffron transition-colors hover:bg-brand-saffron/5"
                      >
                        {c.top.call}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${FIG}/ic-call.png`} alt="" width={17} height={17} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Zodiac ----------

export const ZODIAC: [string, string, string, string][] = [
  ["aries", "Aries", "मेष", "♈"],
  ["taurus", "Taurus", "वृषभ", "♉"],
  ["gemini", "Gemini", "मिथुन", "♊"],
  ["cancer", "Cancer", "कर्क", "♋"],
  ["leo", "Leo", "सिंह", "♌"],
  ["virgo", "Virgo", "कन्या", "♍"],
  ["libra", "Libra", "तुला", "♎"],
  ["scorpio", "Scorpio", "वृश्चिक", "♏"],
  ["sagittarius", "Sagittarius", "धनु", "♐"],
  ["capricorn", "Capricorn", "मकर", "♑"],
  ["aquarius", "Aquarius", "कुंभ", "♒"],
  ["pisces", "Pisces", "मीन", "♓"],
];
// line icons drawn in the design (the other six signs use the zodiac glyph)
const ZODIAC_ART = new Set(["aries", "taurus", "gemini", "cancer", "leo", "virgo"]);

export function ZodiacStrip({ c, lang }: { c: HomeCopy; lang: L }) {
  return (
    <section id="zodiac" className="relative scroll-mt-24 bg-fig-mist pb-20 pt-16 lg:pt-[150px]">
      <Decor src="decor-zodiac.png" height={535} />
      <div className={wrap}>
        <SectionHead center eyebrow={c.zodiac.eyebrow} title={c.zodiac.title} text={c.zodiac.text} />
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {ZODIAC.map(([slug, en, hi, glyph]) => (
            <Link key={slug} href={`/horoscope/${slug}`} className="fig-zod-shadow group relative block h-[161px]">
              {/* card body with the round notch */}
              <div className="fig-zod-body absolute inset-x-0 bottom-0 top-10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${FIG}/zod-leaf.png`} alt="" aria-hidden width={66} height={56} className="absolute bottom-0 left-0" />
                <svg className="absolute left-1/2 top-0 h-[90px] w-[100px] -translate-x-[8px] overflow-visible" viewBox="90 0 100 90" fill="none" aria-hidden>
                  <path d="M90 51.3A52 52 0 0 0 150 8H190V86" stroke="#e4e4e6" strokeWidth="1" />
                </svg>
              </div>
              <span className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-brand-saffron shadow-[0_0_16.5px_rgba(232,145,45,0.44)] transition-transform duration-200 group-hover:scale-105">
                {ZODIAC_ART.has(slug) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${FIG}/zod-${slug}.png`} alt="" width={48} height={48} />
                ) : (
                  <span className="font-display text-[40px] leading-none text-white" aria-hidden>
                    {glyph}&#xFE0E;
                  </span>
                )}
              </span>
              <span className="absolute inset-x-0 top-[97px] flex flex-col items-center gap-1 text-center">
                <span className="font-display text-xl font-medium leading-tight text-fig-ink group-hover:text-brand-saffron">{lang === "hi" ? hi : en}</span>
                <span className="font-ui text-sm leading-tight text-fig-muted">{lang === "hi" ? en : hi}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Free astrology readings ----------

const READINGS: { href: string | ((l: L) => string); img: string }[] = [
  { href: "/kundli-matching", img: "match-making" },
  { href: "/free-kundli", img: "free-kundli" },
  { href: () => "/horoscope", img: "daily-horoscope" },
  { href: "/shop?type=pooja", img: "vedic-remedies" },
  { href: "/calculators/love", img: "love-calculator" },
  { href: "/panchang", img: "panchang" },
  { href: "/tarot", img: "tarot" },
  { href: "/calculators/numerology", img: "numerology" },
  { href: "/astrologers?expertise=vastu", img: "vastu" },
  { href: "/calculators/lo-shu-grid", img: "lo-shu-grid" },
  { href: "/free-kundli", img: "mangal-dosha" },
];

function ReadingTile({ href, img, title, sub }: { href: string; img: string; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex w-[150px] flex-col items-center gap-4 lg:w-auto lg:min-w-[114px]">
      <span className="relative block h-[136px] w-24 shrink-0 rounded-full border border-fig-ink">
        <span className="absolute inset-2 overflow-hidden rounded-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${FIG}/read-${img}.jpg`}
            alt=""
            loading="lazy"
            width={80}
            height={120}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </span>
        <Sparkle className="absolute left-[82px] top-4 text-fig-ink" />
      </span>
      <span className="flex flex-col items-center gap-3">
        <span className="flex flex-col items-center gap-1 text-center">
          <span className="font-display text-[22px] font-medium capitalize leading-tight text-fig-ink group-hover:text-brand-saffron lg:whitespace-nowrap lg:text-2xl">
            {title}
          </span>
          <span className="font-ui text-sm text-fig-muted lg:whitespace-nowrap">{sub}</span>
        </span>
        <ArrowCircle className="text-brand-saffron transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function Readings({ c, lang }: { c: HomeCopy; lang: L }) {
  const tiles = READINGS.map((r, i) => ({
    href: typeof r.href === "function" ? r.href(lang) : r.href,
    img: r.img,
    title: c.readings.items[i][0],
    sub: c.readings.items[i][1],
  }));
  return (
    <section id="readings" className="relative scroll-mt-24 bg-fig-cream py-[60px]">
      <Decor src="decor-readings.png" height={782} />
      <div className={wrap}>
        <SectionHead title={c.readings.title} text={c.readings.text} action={<ViewAll href="/free-kundli" label={c.readings.all} />} />
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-10 lg:flex-nowrap lg:justify-between lg:gap-x-4">
          {tiles.slice(0, 6).map((t) => (
            <ReadingTile key={t.img} {...t} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-10 lg:gap-x-[57px]">
          {tiles.slice(6).map((t) => (
            <ReadingTile key={t.img} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Consult by category ----------

const CATEGORIES: { href: string; img: string; key: string }[] = [
  { href: "/astrologers?concern=love", img: "love", key: "love" },
  { href: "/astrologers?concern=marriage", img: "marriage", key: "marriage" },
  { href: "/astrologers?concern=career", img: "career", key: "career" },
  { href: "/astrologers?gender=female", img: "women", key: "women" },
  { href: "/astrologers?concern=business", img: "business", key: "business" },
  { href: "/astrologers?concern=health", img: "health", key: "health" },
];

function CategoryItem({ c, i, n }: { c: HomeCopy; i: number; n: number | undefined }) {
  const cat = CATEGORIES[i];
  return (
    <Link href={cat.href} className="group flex items-center gap-4">
      <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border border-brand-saffron bg-fig-cream shadow-[0_4px_37.4px_rgba(232,145,45,0.15)] transition-transform group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${FIG}/cons-${cat.img}.png`} alt="" width={34} height={34} />
      </span>
      <span className="flex min-w-[152px] flex-col gap-[7px]">
        <span className="whitespace-nowrap font-display text-2xl font-medium capitalize leading-tight text-fig-ink group-hover:text-brand-saffron">
          {c.consult.items[i][0]}
        </span>
        <span className="flex items-center justify-between gap-3 font-ui text-sm text-fig-muted">
          {n ? c.consult.count(n) : c.consult.items[i][1]}
          <ArrowCircle width={31} height={24} className="text-brand-saffron transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  );
}

export function ConsultCategories({ c, stats }: { c: HomeCopy; stats: AstrologerStats | null }) {
  const count = (i: number) => (CATEGORIES[i].key === "women" ? stats?.women : stats?.byConcern[CATEGORIES[i].key]);
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-[60px] lg:pb-0">
      <Decor src="decor-consult.png" height={803} />
      <div className={wrap}>
        <SectionHead center title={c.consult.title} text={c.consult.text} />
        <div className="relative mt-10 flex flex-col gap-12 lg:mt-[39px] lg:block lg:h-[627px]">
          <div className="flex flex-col gap-8 sm:flex-row sm:gap-[60px] lg:static">
            <div className="flex flex-col gap-8 lg:absolute lg:left-0 lg:top-[74px] lg:gap-[60px]">
              {[0, 1, 2].map((i) => (
                <CategoryItem key={i} c={c} i={i} n={count(i)} />
              ))}
            </div>
            <div className="flex flex-col gap-8 lg:absolute lg:left-[325px] lg:top-[144px] lg:gap-[60px]">
              {[3, 4, 5].map((i) => (
                <CategoryItem key={i} c={c} i={i} n={count(i)} />
              ))}
            </div>
          </div>

          {/* photos with the arch line (drawn at design size, scaled down on phones) */}
          <div className="relative mx-auto h-[330px] w-full sm:h-[485px] lg:absolute lg:left-[758px] lg:top-0 lg:w-[507px]">
            <div className="absolute left-1/2 top-0 h-[485px] w-[507px] origin-top -translate-x-1/2 scale-[0.68] sm:scale-100 lg:left-0 lg:translate-x-0">
              <svg className="absolute left-[212px] top-[-1px] h-[450px] w-[296px]" viewBox="1050 3733 296 450" fill="none" aria-hidden>
                <path d="M1050 3734.5H1150A194 194 0 0 1 1344 3928.5V4183" stroke="#100d17" strokeWidth="1.4" />
              </svg>
              <span className="absolute left-[432px] top-[51px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white">
                <Sparkle size={23} className="text-fig-ink" />
              </span>
              <div className="absolute left-[193px] top-[21px] h-[464px] w-[300px] overflow-hidden rounded-tr-[180px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${FIG}/consult-big.jpg`} alt="" loading="lazy" width={300} height={464} className="h-full w-full object-cover" />
              </div>
              <div className="absolute left-0 top-[84px] h-[360px] w-[219px] overflow-hidden rounded-tl-[187px] border-r-[7px] border-t-[7px] border-white bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${FIG}/consult-small.jpg`}
                  alt=""
                  loading="lazy"
                  width={212}
                  height={353}
                  className="h-full w-full rounded-tl-[180px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Online pooja ----------

/** Category slug -> label ("graha-shanti" -> "Graha Shanti"), translated when the copy knows it. */
const categoryLabel = (c: HomeCopy, slug: string) => c.pooja.categories[slug] ?? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function Poojas({ c, items, lang }: { c: HomeCopy; items: ProductCard[]; lang: L }) {
  return (
    <section id="pooja" className="relative scroll-mt-24 bg-white pb-[112px] pt-[34px]">
      <Decor src="decor-pooja.png" height={840} />
      <div className={wrap}>
        <SectionHead title={c.pooja.title} text={c.pooja.text} action={<ViewAll href="/shop?type=pooja" label={c.pooja.all} />} />
        {items.length === 0 ? (
          <p className="mt-10 p-6 text-center font-ui text-sm text-fig-muted">{c.pooja.empty}</p>
        ) : (
          <div className="mt-[59px] flex flex-wrap justify-center gap-10">
            {items.map((p) => {
              return (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="group relative block h-[557px] w-[360px] max-w-full overflow-hidden rounded-[180px] bg-[#2a1a12]"
                >
                  {/* background photo: the product image fills the top; a mirrored, softened copy shows round the white panel */}
                  {p.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="absolute inset-x-0 top-[279px] h-[278px] w-full -scale-y-100 object-cover blur-[2px] brightness-75"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={lang === "hi" && p.titleHi ? p.titleHi : p.title}
                        loading="lazy"
                        className="absolute inset-x-0 top-0 h-[280px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-saffron to-brand-dark" />
                  )}
                  {(lang === "hi" ? p.badgeHi || p.badge : p.badge) && (
                    <span className="absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/30 px-2 py-1 font-ui text-xs font-medium text-white backdrop-blur-sm">
                      {lang === "hi" ? p.badgeHi || p.badge : p.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-[10px] bottom-[10px] top-[279px] rounded-b-[170px] bg-white">
                    {p.category && (
                      <span className="absolute left-1/2 top-[-13px] -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-dark px-2 py-1 font-ui text-[11px] font-medium text-white">
                        {categoryLabel(c, p.category)}
                      </span>
                    )}
                    <div className="mx-auto mt-8 flex w-[300px] max-w-[90%] flex-col items-center gap-4 text-center">
                      <div className="flex flex-col gap-2">
                        <h3 className="truncate font-display text-[22px] font-medium leading-tight text-fig-ink sm:text-2xl">
                          {lang === "hi" && p.titleHi ? p.titleHi : p.title}
                        </h3>
                        <p className="line-clamp-2 px-3 font-ui text-sm leading-[21px] text-fig-muted">{p.summary}</p>
                      </div>
                      <span className="h-px w-[240px] max-w-full border-t border-dashed border-fig-faint" />
                      <span className="flex items-baseline gap-2 font-ui">
                        <span className="text-[11px] text-fig-ink">{c.pooja.from}</span>
                        <span className="text-2xl font-medium text-fig-ink">
                          <span className="font-light text-brand-saffron">₹</span>
                          {p.price.toLocaleString("en-IN")}
                        </span>
                      </span>
                      <span className="-mt-2 flex items-center gap-4 font-ui text-sm font-medium text-brand-saffron">
                        {c.pooja.book}
                        <ArrowCircle className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- Trust stats (live numbers) ----------

export function TrustStats({ c, stats }: { c: HomeCopy; stats: AstrologerStats | null }) {
  if (!stats || stats.total === 0) return null;
  const two = (n: number | undefined) => String(n ?? 0).padStart(2, "0");
  const items: [string, string][] = [
    [two(stats.total), c.stats.astrologers],
    [two(stats.online), c.stats.online],
    [(stats.consultations ?? 0).toLocaleString("en-IN"), c.stats.consultations],
    [`${stats.maxExperienceYears ?? 0}+`, c.stats.experience],
  ];
  return (
    <section className="bg-white pb-[52px] pt-[38px]">
      <div className={wrap}>
        <div className="relative overflow-hidden bg-fig-cream shadow-[0_4px_37px_rgba(0,0,0,0.05)] lg:h-[180px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${FIG}/decor-stats.png`}
            alt=""
            aria-hidden
            width={1280}
            height={180}
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          />
          <div className="relative grid grid-cols-2 gap-y-8 px-6 py-8 lg:flex lg:h-full lg:items-center lg:justify-between lg:px-[69px] lg:py-0">
            {items.map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-3 text-center">
                <span className="font-display text-[48px] font-medium leading-none text-brand-saffron lg:text-[64px]">{value}</span>
                <span className="font-ui text-sm text-fig-muted lg:text-lg">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------

export function Faq({ c, brand }: { c: HomeCopy; brand: string }) {
  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden bg-white pb-16 pt-12 lg:pb-[51px]">
      <Decor src="decor-faq.png" height={780} />
      <div className={wrap}>
        <SectionHead center eyebrow={c.faq.eyebrow} title={c.faq.title} text={c.faq.text(brand)} />
        <div className="relative mt-10 flex flex-col gap-12 lg:mt-[28px] lg:block lg:h-[600px]">
          {/* photos with the arch line (drawn at design size, scaled down on phones) */}
          <div className="relative mx-auto h-[340px] w-full sm:h-[496px] lg:absolute lg:left-[22px] lg:top-0 lg:mx-0 lg:w-[530px]">
            <div className="absolute left-1/2 top-0 h-[496px] w-[530px] origin-top -translate-x-1/2 scale-[0.66] sm:scale-100 lg:left-0 lg:translate-x-0">
              <svg className="absolute left-[-2px] top-[10px] h-[452px] w-[296px]" viewBox="100 5660 296 452" fill="none" aria-hidden>
                <path d="M395 5661.5H301.5A200 200 0 0 0 101.5 5861.5V6112" stroke="#100d17" strokeWidth="1.4" />
              </svg>
              <span className="absolute left-[37px] top-[57px] flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <Sparkle size={23} className="text-fig-ink" />
              </span>
              <div className="absolute left-[13px] top-[32px] h-[464px] w-[300px] overflow-hidden rounded-tl-[150px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${FIG}/faq-big.jpg`} alt="" loading="lazy" width={300} height={464} className="h-full w-full object-cover" />
              </div>
              <div className="absolute left-[287px] top-[95px] h-[360px] w-[220px] overflow-hidden rounded-tr-[197px] border-l-[7px] border-t-[7px] border-white bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${FIG}/faq-small.jpg`} alt="" loading="lazy" width={213} height={353} className="h-full w-full rounded-tr-[190px] object-cover" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:absolute lg:left-[650px] lg:top-[55px] lg:w-[630px]">
            {c.faq.items(brand).map(([q, a], i) => (
              <details key={q} open={i === 0} className="group border-b border-fig-faint pb-4 pt-8 first:pt-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="font-display text-xl font-medium capitalize leading-[26px] text-fig-ink">{q}</span>
                  <span className="text-fig-ink group-open:hidden">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <circle cx="12" cy="12" r="11.4" strokeWidth="1.1" />
                      <path d="M6.5 12h11M12 6.5v11" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="hidden text-brand-saffron group-open:block">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                      <circle cx="12" cy="12" r="11.4" strokeWidth="1.1" />
                      <path d="M6.5 12h11" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 font-ui text-sm leading-[21px] text-fig-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** FAQ structured data so search engines can show the questions. */
export function FaqJsonLd({ c, brand }: { c: HomeCopy; brand: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items(brand).map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
