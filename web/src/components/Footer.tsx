"use client";

import { Link, useLang } from "@/components/i18n";
import { usePathname } from "next/navigation";
import { splitLang } from "@/lib/i18n";
import { useState } from "react";
import { api, ApiRequestError } from "@/lib/api";
import type { Brand } from "@/lib/brand";
import type { Lang } from "@/lib/i18n";
import { ArrowCircle } from "./home/fig";
import { FigLogo } from "./site/Logo";
import { Spinner } from "@/components/ui/Button";

const copy = {
  en: {
    about: (n: string) =>
      `${n} brings verified Vedic astrologers, free kundli, matching, horoscope, panchang and online poojas together, with instant chat and call consultations.`,
    app: (n: string) => `Download ${n} Mobile App`,
    getOn: "GET IT ON",
    downloadOn: "Download on the",
    soon: "Coming soon",
    community: "Connect with our community",
    services: "Astrology Services",
    useful: "Useful Links",
    contact: "Contact & Support",
    contactText: "Have questions regarding consultations or bookings?",
    email: "Support Email",
    phone: "Support Phone",
    secure: "Secure payments",
    newsletter: "Daily horoscope by email",
    subscribe: "Subscribe",
    follow: "Follow us",
    emailPh: "Enter your email",
    thanks: "Subscribed. Thank you!",
    rights: "All rights reserved.",
    serviceLinks: [
      ["/astrologers?mode=call", "Talk to Astrologer"],
      ["/astrologers?mode=chat", "Chat with Astrologer"],
      ["/astrologers?expertise=tarot-reading", "Tarot Readers"],
      ["/astrologers?expertise=numerology", "Numerologists"],
      ["/astrologers?expertise=vastu", "Vastu Experts"],
      ["/astrologers?concern=love", "Love Astrologers"],
      ["/astrologers?concern=marriage", "Marriage Astrology"],
      ["/horoscope", "Daily Horoscope"],
    ],
    usefulLinks: [
      ["/join-astrologer", "Astrologer Registration"],
      ["/free-kundli", "Free Kundli"],
      ["/kundli-matching", "Kundli Matching"],
      ["/panchang", "Today's Panchang"],
      ["/shop?type=pooja", "Book Online Pooja"],
      ["/shop?type=course", "Astrology Courses"],
      ["/consultations", "My Consultations"],
      ["/wallet", "My Wallet"],
    ],
    legal: [
      ["/privacy-policy", "Privacy Policy"],
      ["/terms", "Terms of Service"],
      ["/refund-policy", "Refund Policy"],
      ["/disclaimer", "Disclaimer"],
      ["/#faq", "FAQS"],
    ],
  },
  hi: {
    about: (n: string) => `${n} पर सत्यापित वैदिक ज्योतिषी, मुफ़्त कुंडली, मिलान, राशिफल, पंचांग और ऑनलाइन पूजा, साथ में तुरंत चैट और कॉल परामर्श।`,
    app: (n: string) => `${n} मोबाइल ऐप डाउनलोड करें`,
    getOn: "डाउनलोड करें",
    downloadOn: "डाउनलोड करें",
    soon: "जल्द आ रहा है",
    community: "हमसे जुड़ें",
    services: "ज्योतिष सेवाएं",
    useful: "उपयोगी लिंक",
    contact: "संपर्क और सहायता",
    contactText: "परामर्श या बुकिंग से जुड़े सवाल?",
    email: "सहायता ईमेल:",
    phone: "सहायता फ़ोन:",
    secure: "सुरक्षित भुगतान",
    newsletter: "दैनिक राशिफल ईमेल पर",
    subscribe: "सदस्यता लें",
    follow: "हमें फ़ॉलो करें",
    emailPh: "अपना ईमेल लिखें",
    thanks: "धन्यवाद! सदस्यता हो गई।",
    rights: "सर्वाधिकार सुरक्षित।",
    serviceLinks: [
      ["/astrologers?mode=call", "ज्योतिषी से बात करें"],
      ["/astrologers?mode=chat", "ज्योतिषी से चैट करें"],
      ["/astrologers?expertise=tarot-reading", "टैरो रीडर"],
      ["/astrologers?expertise=numerology", "अंक ज्योतिषी"],
      ["/astrologers?expertise=vastu", "वास्तु विशेषज्ञ"],
      ["/astrologers?concern=love", "प्रेम ज्योतिष"],
      ["/astrologers?concern=marriage", "विवाह ज्योतिष"],
      ["/horoscope", "दैनिक राशिफल"],
    ],
    usefulLinks: [
      ["/join-astrologer", "ज्योतिषी पंजीकरण"],
      ["/free-kundli", "मुफ़्त कुंडली"],
      ["/kundli-matching", "कुंडली मिलान"],
      ["/panchang", "आज का पंचांग"],
      ["/shop?type=pooja", "ऑनलाइन पूजा बुक करें"],
      ["/shop?type=course", "ज्योतिष कोर्स"],
      ["/consultations", "मेरे परामर्श"],
      ["/wallet", "मेरा वॉलेट"],
    ],
    legal: [
      ["/privacy-policy", "गोपनीयता नीति"],
      ["/terms", "नियम और शर्तें"],
      ["/refund-policy", "रिफ़ंड नीति"],
      ["/disclaimer", "अस्वीकरण"],
      ["/hi#faq", "सामान्य प्रश्न"],
    ],
  },
};

function Newsletter({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<string>("idle");
  if (state === "done") return <p className="border-b border-white/40 pb-3 font-ui text-sm text-emerald-300">{c.thanks}</p>;
  return (
    <form
      className="flex items-center gap-4 border-b border-white/40 pb-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        try {
          await api("/newsletter/subscribe", { method: "POST", body: JSON.stringify({ email, lang }) });
          setState("done");
        } catch (err) {
          setState(err instanceof ApiRequestError ? err.message : "error");
        }
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={c.emailPh}
        aria-label={c.newsletter}
        className="w-full min-w-0 border-0 bg-transparent font-ui text-base text-white placeholder-fig-faint outline-none"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="flex shrink-0 items-center gap-4 font-ui text-sm font-medium text-brand-saffron disabled:opacity-60"
      >
        {c.subscribe}
        {state === "busy" ? <Spinner className="text-xs" /> : <ArrowCircle />}
      </button>
    </form>
  );
}

function StoreButton({ href, icon, small, big }: { href: string; icon: string; small: string; big: string }) {
  const inner = (
    <>
      <i className={`fa-brands ${icon} text-[22px]`} aria-hidden />
      <span className="text-left leading-none">
        <span className="block font-ui text-[8px]">{small}</span>
        <span className="font-ui text-base font-medium tracking-tight">{big}</span>
      </span>
    </>
  );
  const cls = "inline-flex h-10 items-center gap-2 rounded-md border border-white/50 bg-black px-2.5 text-white";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:border-white`}>
      {inner}
    </a>
  ) : (
    <span className={`${cls} cursor-default`} title="Coming soon">
      {inner}
    </span>
  );
}

/** Footer from the Figma home design. */
export function Footer({ brand }: { brand: Brand }) {
  const pathname = usePathname() ?? "/";
  const lang = useLang();
  const { path } = splitLang(pathname);
  const c = copy[lang];
  if (path.startsWith("/admin")) return null;
  if (path === "/login" || path === "/signup") {
    return (
      <footer className="w-full bg-[#F9F1FF]/70 py-4 shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
        <div className="container-site flex flex-col items-center justify-between gap-2 text-xs text-[#494550] sm:flex-row">
          <div className="flex items-center gap-1.5">
            <i className="fa-solid fa-user-shield text-[#8b5000]" aria-hidden />
            <span>Private &amp; confidential consultations</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#7b7581]">
              © {new Date().getFullYear()} {brand.name}
            </span>
            <Link href="/privacy-policy" className="transition-colors hover:text-brand-dark">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-brand-dark">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  const col = (title: string, links: string[][]) => (
    <div className="flex flex-col gap-4">
      <h4 className="font-ui text-sm font-semibold uppercase text-brand-saffron">{title}</h4>
      <ul className="flex flex-col gap-[7px] font-ui text-[13px] font-medium text-white">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="transition-colors hover:text-brand-saffron">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  const follow: [keyof Brand["social"], string][] = [
    ["instagram", "fa-instagram"],
    ["facebook", "fa-facebook"],
    ["youtube", "fa-youtube"],
  ];

  return (
    <footer className="relative overflow-hidden bg-fig-night text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/fig/footer-stars.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="relative mx-auto w-full max-w-[1312px] px-4 pb-6 pt-11">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <h2 className="font-display text-[30px] font-medium capitalize leading-tight text-white sm:text-[38px] lg:pl-3">{c.newsletter}</h2>
          <div className="w-full lg:w-[522px] lg:pt-2">
            <Newsletter lang={lang} />
          </div>
        </div>

        <div className="mt-10 flex items-center gap-6 lg:mt-[38px]">
          <span className="h-px flex-1 bg-white/25" />
          <FigLogo brand={brand} light href="/" />
          <span className="h-px flex-1 bg-white/25" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-[22px] lg:grid-cols-[307px_253px_253px_305px] lg:justify-between lg:gap-x-5">
          <div className="flex flex-col gap-6">
            <p className="font-ui text-xs leading-[18px] text-white/75">{c.about(brand.name)}</p>
            <div className="flex flex-col gap-3">
              <p className="font-ui text-xs font-medium uppercase text-brand-saffron">{c.app(brand.name)}</p>
              <div className="flex flex-wrap gap-2">
                <StoreButton href={brand.appLinks?.ios ?? ""} icon="fa-apple" small={c.downloadOn} big="App Store" />
                <StoreButton href={brand.appLinks?.android ?? ""} icon="fa-google-play" small={c.getOn} big="Google Play" />
              </div>
            </div>
          </div>
          {col(c.services, c.serviceLinks)}
          {col(c.useful, c.usefulLinks)}
          <div className="flex flex-col gap-4">
            <h4 className="font-ui text-sm font-semibold uppercase text-brand-saffron">{c.contact}</h4>
            <p className="font-ui text-[13px] font-medium leading-[18px] text-white">{c.contactText}</p>
            <div className="flex flex-col gap-0.5">
              <span className="font-ui text-xs text-brand-saffron">{c.email}</span>
              <a href={`mailto:${brand.supportEmail}`} className="font-ui text-[15px] font-medium text-white hover:text-brand-saffron">
                {brand.supportEmail}
              </a>
            </div>
            {brand.supportPhone && (
              <div className="flex flex-col gap-0.5">
                <span className="font-ui text-xs text-brand-saffron">{c.phone}</span>
                <a href={`tel:${brand.supportPhone}`} className="font-ui text-[15px] font-medium text-white hover:text-brand-saffron">
                  {brand.supportPhone}
                </a>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <span className="font-ui text-xs uppercase text-brand-saffron">{c.follow}</span>
              <div className="flex items-center gap-3">
                {follow.map(([k, icon]) =>
                  brand.social?.[k] ? (
                    <a
                      key={k}
                      href={brand.social[k]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={k}
                      className="text-white transition-colors hover:text-brand-saffron"
                    >
                      <i className={`fa-brands ${icon} text-lg`} aria-hidden />
                    </a>
                  ) : (
                    <span key={k} className="text-white/90" aria-hidden>
                      <i className={`fa-brands ${icon} text-lg`} />
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/25 pt-6 font-ui text-xs font-medium text-white md:flex-row lg:mt-[38px]">
          <div>
            © {new Date().getFullYear()} {brand.name}. {c.rights}
          </div>
          <div className="flex flex-wrap items-center justify-center">
            {c.legal.map(([href, label], i) => (
              <span key={href} className="flex items-center">
                {i > 0 && <span className="mx-4 h-4 w-px bg-white/30" />}
                <Link href={href} className="transition-colors hover:text-brand-saffron">
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
