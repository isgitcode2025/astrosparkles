"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Brand } from "@/lib/brand";
import { splitLang } from "@/lib/i18n";
import { Link, useLang, useSwitchTo } from "./i18n";
import { AccountButton } from "./AccountButton";
import { CheckCircle, Chevron, StarOutline } from "./home/fig";
import { FigLogo, Logo } from "./site/Logo";

type NavItem = { label: string; href: string; children?: { label: string; href: string; icon: string }[] };

const text = {
  en: {
    home: "Home",
    announce: "New here? Your first chat with any astrologer is free for 5 minutes.",
    secure: "Private & confidential",
    become: "Become an Astrologer",
    help: "Help & Support",
    nav: [
      {
        label: "Consult Now",
        href: "/astrologers",
        children: [
          { label: "Chat with Astrologer", href: "/astrologers?mode=chat", icon: "fa-comment-dots" },
          { label: "Talk to Astrologer", href: "/astrologers?mode=call", icon: "fa-phone-volume" },
          { label: "Online now", href: "/astrologers?online=1", icon: "fa-circle-dot" },
          { label: "Women Astrologers", href: "/astrologers?gender=female", icon: "fa-venus" },
        ],
      },
      { label: "Horoscope", href: "/horoscope" },
      { label: "Panchang", href: "/panchang" },
      {
        label: "Kundli",
        href: "/free-kundli",
        children: [
          { label: "Free Janam Kundli", href: "/free-kundli", icon: "fa-circle-nodes" },
          { label: "Kundli Matching", href: "/kundli-matching", icon: "fa-heart" },
          { label: "Numerology", href: "/calculators/numerology", icon: "fa-hashtag" },
          { label: "Lo Shu Grid", href: "/calculators/lo-shu-grid", icon: "fa-border-all" },
          { label: "Love Calculator", href: "/calculators/love", icon: "fa-heart-pulse" },
        ],
      },
      { label: "Tarot", href: "/tarot" },
      { label: "Store", href: "/shop" },
    ] as NavItem[],
  },
  hi: {
    home: "होम",
    announce: "नए हैं? किसी भी ज्योतिषी से आपकी पहली चैट 5 मिनट मुफ़्त है।",
    secure: "निजी और गोपनीय",
    become: "ज्योतिषी बनें",
    help: "सहायता",
    nav: [
      {
        label: "परामर्श करें",
        href: "/astrologers",
        children: [
          { label: "ज्योतिषी से चैट", href: "/astrologers?mode=chat", icon: "fa-comment-dots" },
          { label: "ज्योतिषी से बात", href: "/astrologers?mode=call", icon: "fa-phone-volume" },
          { label: "अभी ऑनलाइन", href: "/astrologers?online=1", icon: "fa-circle-dot" },
          { label: "महिला ज्योतिषी", href: "/astrologers?gender=female", icon: "fa-venus" },
        ],
      },
      { label: "राशिफल", href: "/horoscope" },
      { label: "पंचांग", href: "/panchang" },
      {
        label: "कुंडली",
        href: "/free-kundli",
        children: [
          { label: "मुफ़्त जन्म कुंडली", href: "/free-kundli", icon: "fa-circle-nodes" },
          { label: "कुंडली मिलान", href: "/kundli-matching", icon: "fa-heart" },
          { label: "अंक ज्योतिष", href: "/calculators/numerology", icon: "fa-hashtag" },
          { label: "लो शू ग्रिड", href: "/calculators/lo-shu-grid", icon: "fa-border-all" },
          { label: "लव कैलकुलेटर", href: "/calculators/love", icon: "fa-heart-pulse" },
        ],
      },
      { label: "टैरो", href: "/tarot" },
      { label: "स्टोर", href: "/shop" },
    ] as NavItem[],
  },
};

/** Header from the Figma home design. Language follows the URL (/hi is Hindi). */
export function Header({ brand }: { brand: Brand }) {
  const pathname = usePathname() ?? "/";
  const lang = useLang();
  const switchTo = useSwitchTo();
  const { path } = splitLang(pathname);
  const l = text[lang];
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const isActive = (href: string) => href !== "/" && path.startsWith(href.split("?")[0]);

  // admin panel: slim top bar, the panel has its own navigation
  if (path.startsWith("/admin")) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-brand-border bg-white/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo brand={brand} />
            <span className="hidden rounded-full bg-brand-indigo px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-xs font-semibold text-slate-600 hover:text-brand-indigo sm:inline">
              <i className="fa-solid fa-arrow-up-right-from-square mr-1" aria-hidden />
              View site
            </Link>
            <AccountButton lang="en" />
          </div>
        </div>
      </header>
    );
  }

  // login and sign-up use a quiet header (Stitch auth design)
  if (path === "/login" || path === "/signup") {
    return (
      <header className="z-20 w-full bg-white/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="container-site flex h-16 items-center justify-between sm:h-20">
          <Logo brand={brand} />
          <a
            href={`mailto:${brand.supportEmail}`}
            className="flex items-center gap-1.5 text-xs font-medium text-[#494550] transition-colors hover:text-brand-text"
          >
            <i className="fa-solid fa-headset text-[#8b5000]" aria-hidden />
            <span className="hidden sm:inline">Help &amp; Support</span>
          </a>
        </div>
      </header>
    );
  }

  const navLeft = [{ label: l.home, href: "/" } as NavItem, ...l.nav.slice(0, 3)];
  const navRight = l.nav.slice(3);
  const home = "/";
  const linkCls = (href: string) =>
    `flex items-center gap-1 whitespace-nowrap py-2 font-ui text-sm font-medium transition-colors hover:text-brand-saffron ${
      (href === home ? path === home : isActive(href)) ? "text-brand-saffron" : "text-fig-muted"
    }`;
  const renderItem = (item: NavItem) =>
    item.children ? (
      <div key={item.label} className="group relative">
        <Link href={item.href} className={linkCls(item.href)} aria-haspopup="true">
          {item.label} <Chevron dir="down" />
        </Link>
        <div className="invisible absolute left-0 top-full z-50 w-60 pt-2 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          <div className="border border-fig-sand bg-white p-2 shadow-[0_10px_30px_rgba(16,13,23,0.08)]">
            {item.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="flex items-center gap-3 px-3 py-2 font-ui text-sm text-fig-ink hover:bg-fig-cream hover:text-brand-saffron"
              >
                <i className={`fa-solid ${c.icon} w-4 text-center text-brand-saffron`} aria-hidden />
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <Link key={item.label} href={item.href} className={linkCls(item.href)}>
        {item.label}
      </Link>
    );

  return (
    <>
      <div className="bg-fig-sand py-2 font-ui text-[11px] font-medium">
        <div className="mx-auto flex w-full max-w-[1312px] items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex min-w-0 items-center gap-1 text-fig-ink">
              <StarOutline size={18} className="text-brand-saffron" />
              <span className="truncate">{brand.announcement || l.announce}</span>
            </span>
            <span className="hidden text-brand-saffron md:inline">|</span>
            <span className="hidden items-center gap-1 text-fig-green md:inline-flex">
              <CheckCircle className="text-fig-green" /> {l.secure}
            </span>
          </div>
          <div className="hidden shrink-0 items-center gap-1.5 text-fig-ink sm:flex">
            <Link href="/join-astrologer" className="transition-colors hover:text-brand-saffron">
              {l.become}
            </Link>
            <span className="text-brand-saffron">|</span>
            <a href={`mailto:${brand.supportEmail}`} className="transition-colors hover:text-brand-saffron">
              {l.help}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex h-[80px] w-full max-w-[1312px] items-center justify-between gap-3 px-4">
          <nav aria-label="Main" className="hidden items-center gap-6 xl:flex">
            {navLeft.map(renderItem)}
          </nav>

          <div className="xl:absolute xl:left-1/2 xl:top-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2">
            <FigLogo brand={brand} href={home} />
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-[35px]">
            <nav aria-label="More" className="hidden items-center gap-6 xl:flex">
              {navRight.map(renderItem)}
              <div className="group relative">
                <button type="button" className={linkCls("#lang")} aria-haspopup="true">
                  {lang === "hi" ? "HI" : "EN"} <Chevron dir="down" />
                </button>
                <div className="invisible absolute right-0 top-full z-50 w-32 pt-2 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="border border-fig-sand bg-white p-1 shadow-[0_10px_30px_rgba(16,13,23,0.08)]">
                    <NextLink href={switchTo("en")} className={`block px-3 py-2 font-ui text-sm hover:bg-fig-cream ${lang === "en" ? "text-brand-saffron" : "text-fig-ink"}`}>
                      English
                    </NextLink>
                    <NextLink
                      href={switchTo("hi")}
                      className={`block px-3 py-2 font-mukta text-sm hover:bg-fig-cream ${lang === "hi" ? "text-brand-saffron" : "text-fig-ink"}`}
                    >
                      हिंदी
                    </NextLink>
                  </div>
                </div>
              </div>
            </nav>
            <AccountButton lang={lang} />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center text-fig-ink xl:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-lg`} aria-hidden />
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="max-h-[70vh] overflow-y-auto border-t border-fig-sand bg-white xl:hidden">
            <div className="mx-auto grid w-full max-w-[1312px] gap-1 px-4 py-3">
              {[...navLeft, ...navRight].map((item) => (
                <div key={item.label}>
                  <Link href={item.href} className="block px-3 py-2 font-ui text-sm font-medium text-fig-ink hover:bg-fig-cream">
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-3 grid border-l border-fig-sand pl-3">
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href} className="px-3 py-1.5 font-ui text-sm text-fig-muted hover:bg-fig-cream">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-2 flex gap-2 border-t border-fig-sand pt-3 text-sm">
                <NextLink href={switchTo(lang === "en" ? "hi" : "en")} className="border border-fig-sand px-3 py-1.5 font-ui font-medium text-fig-ink">
                  {lang === "en" ? "हिंदी" : "English"}
                </NextLink>
                <Link href="/join-astrologer" className="border border-fig-sand px-3 py-1.5 font-ui font-medium text-fig-ink">
                  {l.become}
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
