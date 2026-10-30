"use client";

import { useState } from "react";
import { BirthForm, emptyBirth, isBirthComplete, toBirthInput } from "@/components/astro/BirthForm";
import { KundliChart } from "@/components/astro/KundliChart";
import { ConsultCta, InfoList, ToolHero } from "@/components/site/ToolHero";
import { api, ApiRequestError, session } from "@/lib/api";
import { API_URL } from "@/lib/brand";
import { Btn } from "@/components/ui/Button";
import { ResultSkeleton } from "@/components/ui/ResultSkeleton";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { toast } from "@/components/ui/Toaster";
import { useLang, useLocaleRouter } from "@/components/i18n";

type Point = {
  name: string;
  abbr: string;
  sign: number;
  signName: string;
  dms: string;
  degreeInSign: number;
  house: number;
  retro: boolean;
  nakshatra: string | null;
  pada: number | null;
  signLord: string | null;
  nakshatraLord: string | null;
  navamsaSign: number;
};
type Kundli = {
  input: {
    name: string | null;
    dateOfBirth: string;
    timeOfBirth: string;
    place: string;
    timezone: string;
    utcOffset: number;
  };
  summary: {
    ascendant: string | null;
    moonSign: string | null;
    sunSign: string | null;
    nakshatra: string | null;
    nakshatraPada: number | null;
  };
  ascendant: Point;
  planets: Point[];
  dasha: {
    periods: {
      lord: string;
      start: string;
      end: string;
      years: number;
      current: boolean;
    }[];
    current: string | null;
    birthBalance: { lord: string; years: number } | null;
  } | null;
  mangalDosha: { present: boolean; explanation: string } | null;
};

const tabs = [
  { key: "planets", en: "Planets", hi: "ग्रह" },
  { key: "dasha", en: "Vimshottari Dasha", hi: "विंशोत्तरी दशा" },
  { key: "mangal", en: "Mangal Dosha", hi: "मंगल दोष" },
] as const;

export default function FreeKundliPage() {
  const router = useLocaleRouter();
  const lang = useLang();
  const hi = lang === "hi";
  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(hi ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const [birth, setBirth] = useState(emptyBirth());
  const [style, setStyle] = useState<"north" | "south">("north");
  const [result, setResult] = useState<Kundli | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("planets");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<Kundli>("/astro/kundli", {
        method: "POST",
        body: JSON.stringify(toBirthInput(birth)),
      });
      setResult(r);
      setTimeout(() => document.getElementById("kundli-result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : hi ? "कुंडली नहीं बन सकी" : "Could not create the kundli");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    const token = session.get();
    if (!token) {
      toast.info(hi ? "अपनी कुंडली को PDF के रूप में डाउनलोड करने के लिए लॉगिन करें।" : "Log in to download your kundli as a PDF.");
      startNavProgress();
      router.push("/login?next=/free-kundli");
      return;
    }
    setPdfBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/astro/kundli/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...toBirthInput(birth), chartStyle: style }),
      });
      if (res.status === 401) {
        session.clear("expired");
        router.push("/login?next=/free-kundli");
        return;
      }
      if (res.status === 403) {
        session.clear("blocked");
        return;
      }
      if (!res.ok) throw new Error(hi ? "PDF नहीं बन सका" : "PDF could not be created");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(result?.input.name || "kundli").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-kundli.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(hi ? "आपकी कुंडली PDF डाउनलोड हो रही है।" : "Your kundli PDF is downloading.");
    } catch (e) {
      toast.error(
        e instanceof TypeError ? (hi ? "सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।" : "Could not reach the server. Please try again.") : (e as Error).message,
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const label = (p: Point) => `${p.abbr}${p.retro ? "(R)" : ""} ${Math.floor(p.degreeInSign)}°`;

  return (
    <>
      <ToolHero
        crumbs={[[hi ? "मुफ़्त कुंडली" : "Free Kundli"]]}
        eyebrow={hi ? "जन्म कुंडली" : "Janam Kundli"}
        title={hi ? "मुफ़्त कुंडली ऑनलाइन" : "Free Kundli Online"}
        subtitle={
          hi
            ? "अपना वैदिक जन्म चार्ट, ग्रहों की स्थिति, विंशोत्तरी दशा और मंगल दोष जांच देखने के लिए जन्म विवरण दर्ज करें।"
            : "Enter birth details to see your Vedic birth chart, planet positions, Vimshottari dasha and Mangal dosha check."
        }
        chips={[
          ["fa-chart-pie", hi ? "लग्न और नवांश चार्ट" : "Lagna & Navamsa charts"],
          ["fa-hourglass-half", hi ? "विंशोत्तरी दशा" : "Vimshottari dasha"],
          ["fa-file-pdf", hi ? "PDF डाउनलोड" : "PDF download"],
        ]}
      />
      <div className="container-site relative -mt-16 pb-16">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h2 className="mb-4 font-heading text-xl font-bold text-brand-primary">{hi ? "जन्म विवरण" : "Birth details"}</h2>
            <BirthForm value={birth} onChange={setBirth} />
            <Btn
              type="submit"
              busy={busy}
              busyText={hi ? "आपकी कुंडली बनाई जा रही है…" : "Calculating your kundli…"}
              disabled={!isBirthComplete(birth)}
              className="btn-primary mt-6 w-full"
            >
              {hi ? "मेरी कुंडली प्राप्त करें" : "Get my kundli"} <i className="fa-solid fa-arrow-right" aria-hidden />
            </Btn>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <p className="mt-3 text-center text-xs text-slate-500">
              {hi ? "सटीक जन्म समय सबसे सही लग्न और भाव देता है।" : "An exact birth time gives the most accurate ascendant and houses."}
            </p>
          </form>
          <InfoList
            title={hi ? "आपको क्या मिलेगा" : "What you get"}
            items={[
              [
                "fa-chart-pie",
                hi ? "दो चार्ट" : "Two charts",
                hi ? "लग्न (D1) और नवांश (D9), उत्तर या दक्षिण भारतीय शैली में।" : "Lagna (D1) and Navamsa (D9), in North or South Indian style.",
              ],
              [
                "fa-globe",
                hi ? "सभी ग्रह" : "All planets",
                hi
                  ? "प्रत्येक ग्रह की राशि, डिग्री, भाव, नक्षत्र और स्वामी।"
                  : "Sign, degree, house, nakshatra and lords for each planet.",
              ],
              [
                "fa-hourglass-half",
                hi ? "दशा अवधि" : "Dasha periods",
                hi ? "अभी चल रही महादशा सहित आपकी विंशोत्तरी महादशाएं।" : "Your Vimshottari mahadashas with the one running now.",
              ],
              ["fa-fire", hi ? "मंगल दोष" : "Mangal dosha", hi ? "स्पष्टीकरण के साथ एक त्वरित जांच।" : "A quick check with an explanation."],
            ]}
          />
        </div>

        {busy && <ResultSkeleton charts />}
        {!busy && result && (
          <div id="kundli-result" className="mt-8 scroll-mt-24 space-y-6">
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold text-brand-primary">
                    {result.input.name
                      ? hi
                        ? `${result.input.name} की कुंडली`
                        : `${result.input.name}'s kundli`
                      : hi
                        ? "आपकी कुंडली"
                        : "Your kundli"}
                  </h2>
                  <p className="text-sm text-brand-text/60">
                    {fmtDate(result.input.dateOfBirth)} · {result.input.timeOfBirth} · {result.input.place}
                  </p>
                </div>
                <Btn onClick={downloadPdf} busy={pdfBusy} busyText={hi ? "PDF तैयार हो रहा है…" : "Preparing PDF…"} icon="fa-file-pdf" className="btn-outline px-4 py-2 text-sm">
                  {hi ? "PDF डाउनलोड करें" : "Download PDF"}
                </Btn>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                {(
                  [
                    [hi ? "लग्न (ascendant)" : "Ascendant (Lagna)", result.summary.ascendant],
                    [hi ? "चंद्र राशि" : "Moon sign (Rashi)", result.summary.moonSign],
                    [hi ? "सूर्य राशि" : "Sun sign", result.summary.sunSign],
                    [
                      hi ? "नक्षत्र" : "Nakshatra",
                      result.summary.nakshatra
                        ? `${result.summary.nakshatra}${result.summary.nakshatraPada ? `, ${hi ? "पद" : "pada"} ${result.summary.nakshatraPada}` : ""}`
                        : null,
                    ],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-brand-border bg-brand-cream/50 p-3">
                    <dt className="text-xs text-brand-text/60">{k}</dt>
                    <dd className="mt-1 font-heading font-bold text-brand-indigo">{v ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card">
              <div className="flex justify-end gap-2 text-sm">
                {(["north", "south"] as const).map((s) => (
                  <button key={s} onClick={() => setStyle(s)} className={`rounded-full px-4 py-1.5 pill ${style === s ? "pill-on" : "pill-off"}`}>
                    {s === "north" ? (hi ? "उत्तर भारतीय" : "North Indian") : hi ? "दक्षिण भारतीय" : "South Indian"}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-8 md:grid-cols-2">
                <KundliChart
                  style={style}
                  title={hi ? "लग्न चार्ट (D1)" : "Lagna chart (D1)"}
                  ascSign={result.ascendant.sign}
                  items={[
                    {
                      sign: result.ascendant.sign,
                      text: "Asc",
                      highlight: true,
                    },
                    ...result.planets.map((p) => ({
                      sign: p.sign,
                      text: label(p),
                    })),
                  ]}
                />
                <KundliChart
                  style={style}
                  title={hi ? "नवांश चार्ट (D9)" : "Navamsa chart (D9)"}
                  ascSign={result.ascendant.navamsaSign}
                  items={[
                    {
                      sign: result.ascendant.navamsaSign,
                      text: "Asc",
                      highlight: true,
                    },
                    ...result.planets.map((p) => ({
                      sign: p.navamsaSign,
                      text: `${p.abbr}${p.retro ? "(R)" : ""}`,
                    })),
                  ]}
                />
              </div>
              <p className="mt-3 text-center text-xs text-brand-text/50">
                {hi ? "(R) = वक्री। डिग्री राशि के भीतर है।" : "(R) = retrograde. Degrees are within the sign."}
              </p>
            </div>

            <div className="card">
              <div className="flex flex-wrap gap-2 border-b border-brand-border pb-3">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-full px-4 py-1.5 text-sm pill ${tab === t.key ? "pill-on" : "pill-off"}`}
                  >
                    {hi ? t.hi : t.en}
                  </button>
                ))}
              </div>

              <div className="mt-4 overflow-x-auto">
                {tab === "planets" && (
                  <table className="w-full min-w-max text-left text-sm">
                    <thead className="bg-brand-cream/60 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        {(hi
                          ? ["ग्रह", "राशि", "डिग्री", "भाव", "नक्षत्र (पद)", "राशि स्वामी", "नक्षत्र स्वामी", "वक्री"]
                          : ["Planet", "Sign", "Degree", "House", "Nakshatra (pada)", "Sign lord", "Nakshatra lord", "Retro"]
                        ).map((h) => (
                          <th key={h} className="px-2 py-2 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[result.ascendant, ...result.planets].map((p) => (
                        <tr key={p.name} className="border-t border-brand-border">
                          <td className="px-2 py-2 font-medium">{p.name}</td>
                          <td className="px-2 py-2">{p.signName}</td>
                          <td className="px-2 py-2 font-mono text-xs">{p.dms}</td>
                          <td className="px-2 py-2">{p.house}</td>
                          <td className="px-2 py-2">{p.nakshatra ? `${p.nakshatra}${p.pada ? ` (${p.pada})` : ""}` : "—"}</td>
                          <td className="px-2 py-2">{p.signLord ?? "—"}</td>
                          <td className="px-2 py-2">{p.nakshatraLord ?? "—"}</td>
                          <td className="px-2 py-2">{p.retro ? (hi ? "हां" : "Yes") : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {tab === "dasha" &&
                  (result.dasha ? (
                    <>
                      {result.dasha.birthBalance && (
                        <p className="mb-3 text-sm text-brand-text/70">
                          {hi ? "जन्म के समय शेष" : "Balance at birth"}: {result.dasha.birthBalance.lord} {result.dasha.birthBalance.years}{" "}
                          {hi ? "वर्ष" : "years"}
                          {result.dasha.current && (
                            <>
                              {" "}
                              · {hi ? "अभी चल रही है" : "Running now"}: <strong>{result.dasha.current}</strong> {hi ? "महादशा" : "mahadasha"}
                            </>
                          )}
                        </p>
                      )}
                      <table className="w-full min-w-max text-left text-sm">
                        <thead className="bg-brand-cream/60 text-[11px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-2 py-2 font-medium">{hi ? "महादशा" : "Mahadasha"}</th>
                            <th className="px-2 py-2 font-medium">{hi ? "से" : "From"}</th>
                            <th className="px-2 py-2 font-medium">{hi ? "तक" : "To"}</th>
                            <th className="px-2 py-2 font-medium">{hi ? "वर्ष" : "Years"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.dasha.periods.map((d) => (
                            <tr key={d.start} className={`border-t border-brand-border ${d.current ? "bg-brand-accent/10 font-semibold" : ""}`}>
                              <td className="px-2 py-2">
                                {d.lord}
                                {d.current && (
                                  <span className="ml-2 rounded-full bg-brand-accent px-2 py-0.5 text-xs text-white">{hi ? "चल रही है" : "Running"}</span>
                                )}
                              </td>
                              <td className="px-2 py-2">{fmtDate(d.start)}</td>
                              <td className="px-2 py-2">{fmtDate(d.end)}</td>
                              <td className="px-2 py-2">{d.years}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <p className="text-sm text-brand-text/60">{hi ? "दशा अभी उपलब्ध नहीं है।" : "Dasha is not available right now."}</p>
                  ))}

                {tab === "mangal" &&
                  (result.mangalDosha ? (
                    <div className={`rounded-xl p-4 ${result.mangalDosha.present ? "bg-red-50" : "bg-green-50"}`}>
                      <p className={`text-lg font-semibold ${result.mangalDosha.present ? "text-red-700" : "text-green-700"}`}>
                        {result.mangalDosha.present ? (hi ? "मंगल दोष मौजूद है" : "Mangal dosha is present") : hi ? "मंगल दोष नहीं है" : "No Mangal dosha"}
                      </p>
                      <p className="mt-1 text-sm text-brand-text/80">{result.mangalDosha.explanation}</p>
                      {result.mangalDosha.present && (
                        <p className="mt-2 text-sm text-brand-text/70">
                          {hi
                            ? "निवारण नियम और उपायों के लिए ज्योतिषी से व्यक्तिगत परामर्श आवश्यक है।"
                            : "Cancellation rules and remedies need a personal reading by an astrologer."}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-text/60">{hi ? "मंगल दोष जांच अभी उपलब्ध नहीं है।" : "Mangal dosha check is not available right now."}</p>
                  ))}
              </div>
            </div>

            <ConsultCta
              text={hi ? "इस चार्ट की व्यक्तिगत व्याख्या चाहिए? किसी सत्यापित ज्योतिषी से बात करें।" : "Want a personal reading of this chart? Talk to a verified astrologer."}
              cta={hi ? "ज्योतिषी से बात करें" : "Talk to an astrologer"}
            />
          </div>
        )}
      </div>
    </>
  );
}
