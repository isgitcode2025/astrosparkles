// UI strings for English and Hindi. Every new screen adds its keys to both.
export const dictionaries = {
  en: {
    "nav.astrologers": "Astrologers",
    "nav.kundli": "Free Kundli",
    "nav.matching": "Kundli Matching",
    "nav.horoscope": "Horoscope",
    "nav.panchang": "Panchang",
    "nav.shop": "Poojas & Courses",
    "nav.login": "Login",
    "hero.title": "Ask an expert astrologer, get clarity today",
    "hero.subtitle": "Chat or call verified astrologers about love, marriage, career and money. Pay only for the minutes you talk.",
    "hero.chat": "Start a chat",
    "hero.call": "Call an astrologer",
    "hero.firstFree": "First consultation free",
    "section.tools": "Free astrology tools",
    "section.horoscope": "Today's horoscope",
    "section.panchang": "Today's panchang",
    "section.how": "How it works",
    "how.1": "Choose an astrologer by concern, language and price",
    "how.2": "Add money to your wallet",
    "how.3": "Chat or call and pay per minute",
    "footer.rights": "All rights reserved.",
    "lang.switch": "हिन्दी",
  },
  hi: {
    "nav.astrologers": "ज्योतिषी",
    "nav.kundli": "मुफ़्त कुंडली",
    "nav.matching": "कुंडली मिलान",
    "nav.horoscope": "राशिफल",
    "nav.panchang": "पंचांग",
    "nav.shop": "पूजा और कोर्स",
    "nav.login": "लॉगिन",
    "hero.title": "अनुभवी ज्योतिषी से पूछें, आज ही स्पष्टता पाएं",
    "hero.subtitle": "प्रेम, विवाह, करियर और धन पर सत्यापित ज्योतिषियों से चैट या कॉल करें। केवल बात किए गए मिनटों का भुगतान करें।",
    "hero.chat": "चैट शुरू करें",
    "hero.call": "ज्योतिषी को कॉल करें",
    "hero.firstFree": "पहला परामर्श मुफ़्त",
    "section.tools": "मुफ़्त ज्योतिष टूल्स",
    "section.horoscope": "आज का राशिफल",
    "section.panchang": "आज का पंचांग",
    "section.how": "यह कैसे काम करता है",
    "how.1": "समस्या, भाषा और शुल्क के अनुसार ज्योतिषी चुनें",
    "how.2": "अपने वॉलेट में राशि जोड़ें",
    "how.3": "चैट या कॉल करें और प्रति मिनट भुगतान करें",
    "footer.rights": "सर्वाधिकार सुरक्षित।",
    "lang.switch": "English",
  },
} as const;

export type Lang = keyof typeof dictionaries;
export type DictKey = keyof (typeof dictionaries)["en"];

/** Every language the site routes for. English lives at "/", the others under "/<code>". */
export const LANGS = ["en", "hi"] as const;
export const DEFAULT_LANG: Lang = "en";

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "hi";
}

/**
 * Splits a pathname into its language prefix and the rest.
 * "/hi/panchang" -> { lang: "hi", path: "/panchang" };  "/panchang" -> { lang: "en", path: "/panchang" }
 */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  const m = /^\/(en|hi)(?=\/|$)/.exec(pathname);
  if (!m) return { lang: DEFAULT_LANG, path: pathname || "/" };
  return { lang: m[1] as Lang, path: pathname.slice(m[0].length) || "/" };
}

/**
 * The URL of a page in a given language. The default language keeps the bare path
 * so existing English URLs never change; the others get a "/<code>" prefix.
 * Query and hash are preserved; anything that is not a site path is returned as is.
 */
export function localePath(lang: Lang, href: string): string {
  if (!href.startsWith("/")) return href;
  const [beforeHash, hash] = splitOnce(href, "#");
  const [rawPath, query] = splitOnce(beforeHash, "?");
  const { path } = splitLang(rawPath);
  const prefixed = lang === DEFAULT_LANG ? path : `/${lang}${path === "/" ? "" : path}`;
  return `${prefixed || "/"}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function splitOnce(value: string, sep: string): [string, string | undefined] {
  const i = value.indexOf(sep);
  return i === -1 ? [value, undefined] : [value.slice(0, i), value.slice(i + 1)];
}

export function t(lang: Lang, key: DictKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key];
}
