import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { ListingGrid } from "@/components/astrologer/ListingGrid";
import { api, type AstrologerCard, type Master, type Paged } from "@/lib/api";
import { getBrand } from "@/lib/brand";
import { ErrorState } from "@/components/ui/ErrorState";
import { pageLang } from "@/lib/server-lang";

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const brand = await getBrand();
  const lang = pageLang(searchParams.lang);
  return lang === "hi"
    ? {
        title: "ऑनलाइन ज्योतिषियों से बात करें",
        description: `${brand.name} पर सत्यापित वैदिक ज्योतिषियों, टैरो रीडर्स और अंकशास्त्रियों से चैट या कॉल करें। समस्या, भाषा और कीमत के अनुसार फ़िल्टर करें।`,
      }
    : {
        title: "Talk to Astrologers Online",
        description: `Chat or call verified Vedic astrologers, tarot readers and numerologists on ${brand.name}. Filter by concern, language and price.`,
      };
}
export const dynamic = "force-dynamic";

type Search = {
  concern?: string;
  language?: string;
  sort?: string;
  online?: string;
  page?: string;
  gender?: string;
  expertise?: string;
  mode?: string;
  q?: string;
  lang?: string;
};

const SORTS = {
  en: [
    { value: "recommended", label: "Recommended" },
    { value: "rating", label: "Top rated" },
    { value: "experience", label: "Most experienced" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
  ],
  hi: [
    { value: "recommended", label: "अनुशंसित" },
    { value: "rating", label: "सर्वोच्च रेटेड" },
    { value: "experience", label: "सबसे अनुभवी" },
    { value: "price-low", label: "कीमत: कम से अधिक" },
    { value: "price-high", label: "कीमत: अधिक से कम" },
  ],
};
const LANGS = ["hi", "en", "bho", "bn", "mr", "gu"];
const PAGE_SIZE = 12;

const text = {
  en: {
    title: "Talk to an astrologer",
    subtitle: "Pick your concern and language. Pay per minute from your wallet.",
    errorTitle: "Astrologers could not be loaded",
    all: "All",
    anyLanguage: "Any language",
    onlineNow: "Online now",
    women: "Women astrologers",
    searchPlaceholder: "Search astrologer by name...",
    searchLabel: "Search astrologer by name",
    verifiedOne: "verified astrologer",
    verifiedMany: "verified astrologers",
    matching: (q: string) => ` matching “${q}”`,
    sort: "Sort:",
    noResults: "No astrologers match these filters.",
    clearFilters: "Clear all filters",
    whyConsult: (name: string) => `Why consult on ${name}`,
    whySubtitle: "Verified astrologers, Vedic roots and complete privacy.",
    trust: [
      ["fa-user-shield", "bg-purple-50 text-brand-indigo", "100% Private", "Your phone number is never shown. Chats are visible only to you and your astrologer."],
      ["fa-certificate", "bg-amber-50 text-brand-saffron", "Verified Astrologers", "Every profile is reviewed by our team before it goes live."],
      ["fa-coins", "bg-emerald-50 text-emerald-600", "Pay Per Minute", "You pay only for the minutes you talk. No charge if the astrologer doesn't accept."],
      ["fa-language", "bg-indigo-50 text-brand-indigo", "Your Language", "Hindi, English, Bhojpuri, Bengali, Marathi, Gujarati and more."],
    ],
  },
  hi: {
    title: "ज्योतिषी से बात करें",
    subtitle: "अपनी समस्या और भाषा चुनें। अपने वॉलेट से प्रति मिनट भुगतान करें।",
    errorTitle: "ज्योतिषी लोड नहीं हो सके",
    all: "सभी",
    anyLanguage: "कोई भी भाषा",
    onlineNow: "अभी ऑनलाइन",
    women: "महिला ज्योतिषी",
    searchPlaceholder: "नाम से ज्योतिषी खोजें...",
    searchLabel: "नाम से ज्योतिषी खोजें",
    verifiedOne: "सत्यापित ज्योतिषी",
    verifiedMany: "सत्यापित ज्योतिषी",
    matching: (q: string) => ` “${q}” से मेल खाते हुए`,
    sort: "क्रमबद्ध करें:",
    noResults: "इन फ़िल्टर से कोई ज्योतिषी नहीं मिला।",
    clearFilters: "सभी फ़िल्टर हटाएं",
    whyConsult: (name: string) => `${name} पर परामर्श क्यों लें`,
    whySubtitle: "सत्यापित ज्योतिषी, वैदिक जड़ें और पूर्ण गोपनीयता।",
    trust: [
      ["fa-user-shield", "bg-purple-50 text-brand-indigo", "100% निजी", "आपका फ़ोन नंबर कभी नहीं दिखाया जाता। चैट केवल आपको और आपके ज्योतिषी को दिखती है।"],
      ["fa-certificate", "bg-amber-50 text-brand-saffron", "सत्यापित ज्योतिषी", "हर प्रोफ़ाइल लाइव होने से पहले हमारी टीम द्वारा जांची जाती है।"],
      ["fa-coins", "bg-emerald-50 text-emerald-600", "प्रति मिनट भुगतान", "आप केवल बात किए गए मिनटों का भुगतान करते हैं। ज्योतिषी के स्वीकार न करने पर कोई शुल्क नहीं।"],
      ["fa-language", "bg-indigo-50 text-brand-indigo", "आपकी भाषा", "हिंदी, अंग्रेज़ी, भोजपुरी, बंगाली, मराठी, गुजराती और अधिक।"],
    ],
  },
};

function hrefWith(current: Search, patch: Partial<Search>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch, page: undefined })) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/astrologers?${qs}` : "/astrologers";
}

function Chip({ href, active, children, small }: { href: string; active: boolean; children: React.ReactNode; small?: boolean }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-full transition-all ${small ? "px-3.5 py-1.5" : "px-4 py-2"} ${
        active ? "bg-brand-indigo font-semibold text-white shadow-sm hover:bg-brand-dark" : "border border-slate-200 bg-white font-medium text-slate-700 hover:border-brand-indigo hover:text-brand-indigo"
      }`}
    >
      {children}
    </Link>
  );
}

/** Astrologer listing from the Stitch "Astrologer Listing & Live Consultations" design. */
export default async function AstrologersPage({ searchParams }: { searchParams: Search }) {
  const lang = pageLang(searchParams.lang);
  const l = text[lang];
  const sorts = SORTS[lang];
  const qs = new URLSearchParams({ page: "1", limit: String(PAGE_SIZE), sort: searchParams.sort ?? "recommended" });
  if (searchParams.concern) qs.set("concern", searchParams.concern);
  if (searchParams.language) qs.set("languages", searchParams.language);
  if (searchParams.online === "1") qs.set("onlineOnly", "true");
  if (searchParams.gender === "female" || searchParams.gender === "male") qs.set("gender", searchParams.gender);
  if (searchParams.expertise) qs.set("expertise", searchParams.expertise);
  if (searchParams.mode === "chat" || searchParams.mode === "call") qs.set("mode", searchParams.mode);
  if (searchParams.q?.trim()) qs.set("q", searchParams.q.trim().slice(0, 60));

  const [brand, master, result] = await Promise.all([
    getBrand(),
    api<Master>("/config/master", { revalidate: 3600 }).catch(() => null),
    api<Paged<AstrologerCard>>(`/astrologers?${qs}`, { cache: "no-store" }).catch(() => null),
  ]);
  const sort = searchParams.sort ?? "recommended";
  const expertiseItem = searchParams.expertise ? master?.expertise.find((e) => e.slug === searchParams.expertise) : null;
  const expertiseLabel = expertiseItem ? (lang === "hi" ? expertiseItem.hi : expertiseItem.en) : null;
  const trust = l.trust;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-indigo sm:text-4xl">{l.title}</h1>
        <p className="mt-1 text-base font-normal text-slate-600 sm:text-lg">{l.subtitle}</p>
      </div>

      {!result ? (
        <ErrorState title={l.errorTitle} lang={lang} />
      ) : (
        <>
          <section className="mb-8 space-y-4">
            <div className="thin-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1.5 text-sm">
              <Chip href={hrefWith(searchParams, { concern: undefined })} active={!searchParams.concern}>
                {l.all}
              </Chip>
              {(master?.concerns ?? []).map((c) => (
                <Chip key={c.slug} href={hrefWith(searchParams, { concern: c.slug })} active={searchParams.concern === c.slug}>
                  {lang === "hi" ? c.hi : c.en}
                </Chip>
              ))}
            </div>
            <div className="thin-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1.5 text-xs sm:text-sm">
              <Chip small href={hrefWith(searchParams, { language: undefined })} active={!searchParams.language}>
                {l.anyLanguage}
              </Chip>
              {(master?.languages ?? [])
                .filter((lg) => LANGS.includes(lg.code))
                .map((lg) => (
                  <Chip small key={lg.code} href={hrefWith(searchParams, { language: lg.code })} active={searchParams.language === lg.code}>
                    {lang === "hi" ? lg.hi : lg.en}
                  </Chip>
                ))}
              <Chip small href={hrefWith(searchParams, { online: searchParams.online === "1" ? undefined : "1" })} active={searchParams.online === "1"}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{l.onlineNow}</span>
              </Chip>
              <Chip small href={hrefWith(searchParams, { gender: searchParams.gender === "female" ? undefined : "female" })} active={searchParams.gender === "female"}>
                {l.women}
              </Chip>
              {expertiseLabel && (
                <Chip small href={hrefWith(searchParams, { expertise: undefined })} active>
                  {expertiseLabel} <i className="fa-solid fa-xmark text-[10px]" aria-hidden />
                </Chip>
              )}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 border-t border-indigo-100/60 pt-3 md:flex-row md:items-center">
              <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                <form action="/astrologers" className="relative w-full sm:w-72">
                  {Object.entries(searchParams)
                    .filter(([k, v]) => v && k !== "q" && k !== "page")
                    .map(([k, v]) => (
                      <input key={k} type="hidden" name={k} value={v} />
                    ))}
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden />
                  <input
                    type="search"
                    name="q"
                    defaultValue={searchParams.q ?? ""}
                    maxLength={60}
                    placeholder={l.searchPlaceholder}
                    aria-label={l.searchLabel}
                    className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo"
                  />
                </form>
                <span className="text-xs font-medium text-slate-500">
                  <span className="font-bold text-brand-indigo">{result.total}</span> {result.total === 1 ? l.verifiedOne : l.verifiedMany}
                  {searchParams.q ? l.matching(searchParams.q) : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 sm:text-sm">
                <span className="font-medium text-slate-500">{l.sort}</span>
                {sorts.map((s, i) => (
                  <span key={s.value} className="flex items-center gap-2">
                    {i > 0 && <span className="text-slate-300">|</span>}
                    <Link
                      href={hrefWith(searchParams, { sort: s.value === "recommended" ? undefined : s.value })}
                      scroll={false}
                      className={sort === s.value ? "font-bold text-brand-indigo underline decoration-brand-indigo decoration-2 underline-offset-4" : "transition hover:text-brand-indigo"}
                    >
                      {s.label}
                    </Link>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600">{l.noResults}</p>
              <Link href="/astrologers" className="mt-3 inline-block font-semibold text-brand-saffron underline">
                {l.clearFilters}
              </Link>
            </div>
          ) : (
            <ListingGrid key={qs.toString()} initial={result} query={qs.toString()} master={master} lang={lang} />
          )}
        </>
      )}

      <section className="mt-16 border-t border-slate-200/80 pt-12">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="font-heading text-xl font-bold text-brand-indigo">{l.whyConsult(brand.name)}</h2>
          <p className="mt-1 text-sm text-slate-600">{l.whySubtitle}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(([icon, tone, title, desc]) => (
            <div key={title} className="flex items-start gap-4 rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${tone}`}>
                <i className={`fa-solid ${icon}`} aria-hidden />
              </div>
              <div>
                <h4 className="font-heading text-sm font-semibold text-brand-text">{title}</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
