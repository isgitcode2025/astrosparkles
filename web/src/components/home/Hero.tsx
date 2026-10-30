import { Link } from "@/components/i18n";
import type { HomeCopy } from "./copy";
import { ArrowCircle, Chevron, FIG, Gift } from "./fig";
import { HeroVideo } from "./HeroVideo";

const quick = [
  { href: "/astrologers?mode=call", img: "feat-talk" },
  { href: "/kundli-matching", img: "feat-love" },
  { href: "/horoscope", img: "feat-horoscope" },
  { href: "/free-kundli", img: "feat-kundli" },
];

/**
 * Hero from the Figma "Home Page" design: serif title over the animated celestial chart, arched photo on the right,
 * cream panel with the two offers, the astrologer sign-up link and four quick links.
 * The grey area with the curved top that runs behind the next sections starts here.
 */
export function Hero({ c, online }: { c: HomeCopy; online: number }) {
  const [t1, t2, t3] = c.hero.title;
  return (
    <section className="relative overflow-hidden bg-white">
      {/* grey background with the curved top (a very large circle), continued by the next sections */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[520px] h-[4530px] w-[4530px] -translate-x-[2275px] rounded-full bg-fig-mist lg:top-[691px]"
      />

      <div className="relative mx-auto w-full max-w-[1312px] px-4">
        {/* animated celestial chart behind the title */}
        <HeroVideo className="absolute left-1/2 top-[30px] w-[820px] max-w-none -translate-x-1/2 opacity-40 sm:w-[1000px] sm:opacity-70 lg:left-[65px] lg:top-[-10px] lg:w-[1190px] lg:translate-x-0 lg:opacity-100" />

        <div className="relative pt-14 lg:min-h-[528px] lg:pt-[105px]">
          <div className="flex max-w-[474px] flex-col items-start gap-3">
            <p className="bg-brand-saffron/10 px-1.5 py-1 font-ui text-xs text-fig-ink">{c.hero.live(online)}</p>
            <h1 className="font-display text-[48px] font-medium capitalize leading-[1.15] text-fig-ink sm:text-[60px] lg:text-[72px] lg:leading-[86px]">
              {t1} <span className="text-brand-saffron">{t2}</span>
              {t3 && <> {t3}</>}
            </h1>
          </div>
        </div>

        {/* arched photo */}
        <div className="relative mx-auto mt-8 w-[260px] sm:w-[309px] lg:absolute lg:right-[73px] lg:top-[306px] lg:z-20 lg:mt-0 lg:w-[309px]">
          <div className="overflow-hidden rounded-t-full border-[6px] border-fig-cream bg-fig-cream shadow-[0_0_46px_rgba(232,145,45,0.38)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${FIG}/hero-photo.jpg`} alt="" width={297} height={411} className="block h-auto w-full" />
          </div>
        </div>

        {/* cream panel */}
        <div className="relative z-10 mt-8 overflow-hidden bg-fig-cream shadow-[0_4px_37px_rgba(0,0,0,0.05)] lg:mt-0">
          {/* dashed circles on the left half of the panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-[103px] -top-4 h-[771px] w-[771px] rounded-full border border-dashed border-brand-saffron/40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-[39px] h-[597px] w-[597px] rounded-full border border-dashed border-brand-saffron/40"
          />

          <div className="relative px-5 pb-8 pt-8 sm:px-6 lg:min-h-[395px]">
            <div className="flex flex-col gap-10 lg:max-w-[606px]">
              <p className="font-ui text-base leading-relaxed text-fig-muted sm:text-lg sm:leading-[27px]">{c.hero.text}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/astrologers?mode=chat"
                  className="inline-flex items-center gap-2 border border-brand-dark px-6 py-3 font-ui text-base font-medium text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                >
                  <span>
                    {c.hero.cta[0]} <span className="text-brand-saffron">{c.hero.cta[1]}</span>
                  </span>
                  <Chevron />
                </Link>
                <Link
                  href="/astrologers?mode=chat"
                  className="inline-flex items-center gap-2 border border-brand-saffron px-6 py-3 font-ui text-base font-medium text-brand-saffron transition-colors hover:bg-brand-saffron hover:text-white"
                >
                  <span>{c.hero.firstChat[0]}</span>
                  <span className="text-[11px] font-normal text-fig-muted">{c.hero.firstChat[1]}</span>
                  <Chevron className="text-fig-ink" />
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:mt-14 lg:flex-row lg:items-start lg:justify-between">
              <p className="inline-flex items-center gap-2 self-start bg-fig-green/[0.07] px-1.5 py-1 font-ui text-xs text-fig-green">
                <Gift className="text-fig-green" />
                {c.hero.offer}
              </p>
              <Link href="/join-astrologer" className="group flex w-full flex-col gap-3 sm:w-auto lg:-mt-[9px] lg:w-[375px]">
                <span className="flex items-center justify-between gap-4 font-ui text-sm font-medium">
                  <span>
                    <span className="text-fig-ink">{c.hero.join}</span> <span className="text-brand-saffron">{c.hero.joinLink}</span>
                  </span>
                  <ArrowCircle className="text-fig-ink transition-transform group-hover:translate-x-1" />
                </span>
                <span className="h-px w-full bg-brand-saffron" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-10 lg:flex lg:items-center lg:justify-between">
              {quick.map((q, i) => (
                <Link key={q.href} href={q.href} className="group flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${FIG}/${q.img}.png`} alt="" width={56} height={56} className="h-14 w-14 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="flex flex-col">
                    <span className="font-ui text-base font-medium text-fig-ink group-hover:text-brand-saffron">{c.hero.quick[i][0]}</span>
                    <span className="font-ui text-xs text-fig-muted">{c.hero.quick[i][1]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-10 lg:h-[100px]" />
    </section>
  );
}
