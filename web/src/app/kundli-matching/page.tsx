"use client";

import { Link } from "@/components/i18n";
import { useState } from "react";
import { BirthForm, emptyBirth, isBirthComplete, toBirthInput } from "@/components/astro/BirthForm";
import { ToolHero } from "@/components/site/ToolHero";
import { api, ApiRequestError } from "@/lib/api";
import { Btn } from "@/components/ui/Button";
import { ResultSkeleton } from "@/components/ui/ResultSkeleton";
import { useLang } from "@/components/i18n";

type PersonInfo = {
  name: string | null;
  place: string;
  moonSign: string | null;
  nakshatra: string | null;
  pada: number | null;
  varna: string | null;
  gana: string | null;
  nadi: string | null;
  yoni: string | null;
};
type Koota = {
  key: string;
  name: string;
  nameHi: string;
  about: string;
  score: number | null;
  max: number | null;
  boy: string | number | null;
  girl: string | number | null;
  dosha: boolean;
};
type Mangal = { present: boolean; explanation: string } | null;
type Match = {
  score: number;
  maxScore: number;
  verdict: "excellent" | "acceptable" | "not_recommended";
  boy: PersonInfo;
  girl: PersonInfo;
  kootas: Koota[];
  nadiDosha: boolean;
  bhakootDosha: boolean;
  mangalDosha: { boy: Mangal; girl: Mangal };
};

const verdicts = {
  excellent: {
    en: "Excellent match",
    hi: "उत्कृष्ट मेल",
    tone: "text-emerald-700",
    bar: "bg-green-600",
  },
  acceptable: {
    en: "Acceptable match",
    hi: "स्वीकार्य मेल",
    tone: "text-brand-accent",
    bar: "bg-brand-accent",
  },
  not_recommended: {
    en: "Below the recommended 18 gunas",
    hi: "अनुशंसित 18 गुणों से कम",
    tone: "text-red-700",
    bar: "bg-red-600",
  },
};

export default function KundliMatchingPage() {
  const lang = useLang();
  const hi = lang === "hi";
  const [boy, setBoy] = useState(emptyBirth("male"));
  const [girl, setGirl] = useState(emptyBirth("female"));
  const [r, setR] = useState<Match | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setR(
        await api<Match>("/astro/matching", {
          method: "POST",
          body: JSON.stringify({
            boy: toBirthInput(boy),
            girl: toBirthInput(girl),
          }),
        }),
      );
      setTimeout(() => document.getElementById("match-result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : hi ? "कुंडली मिलान नहीं हो सका" : "Could not match the kundlis");
    } finally {
      setBusy(false);
    }
  };

  const v = r ? verdicts[r.verdict] : null;
  const boyName = r?.boy.name || (hi ? "वर" : "Boy");
  const girlName = r?.girl.name || (hi ? "वधू" : "Girl");

  return (
    <>
      <ToolHero
        crumbs={[[hi ? "कुंडली मिलान" : "Kundli Matching"]]}
        eyebrow={hi ? "गुण मिलान" : "Guna Milan"}
        title={hi ? "विवाह के लिए कुंडली मिलान" : "Kundli Matching for Marriage"}
        subtitle={
          hi
            ? "36 गुणों में से अष्टकूट मिलान, नाड़ी और भकूट दोष के साथ दोनों साथियों के लिए मंगल दोष जांच।"
            : "Ashtakoot matching out of 36 gunas, with Nadi and Bhakoot dosha and a Mangal dosha check for both partners."
        }
        chips={[
          ["fa-heart", hi ? "36 गुण अष्टकूट" : "36 guna Ashtakoot"],
          ["fa-fire", hi ? "दोनों के लिए मंगल दोष" : "Mangal dosha for both"],
          ["fa-bolt", hi ? "तुरंत परिणाम" : "Instant result"],
        ]}
      />
      <div className="container-site relative -mt-16 pb-16">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card border-t-4 border-t-brand-indigo">
              <BirthForm value={boy} onChange={setBoy} title={hi ? "वर का विवरण" : "Boy's details"} fixedGender />
            </div>
            <div className="card border-t-4 border-t-brand-saffron">
              <BirthForm value={girl} onChange={setGirl} title={hi ? "वधू का विवरण" : "Girl's details"} fixedGender />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Btn
              type="submit"
              busy={busy}
              busyText={hi ? "चार्ट का मिलान हो रहा है…" : "Matching the charts…"}
              icon="fa-heart"
              disabled={!isBirthComplete(boy) || !isBirthComplete(girl)}
              className="btn-primary w-full max-w-sm"
            >
              {hi ? "कुंडली मिलाएं" : "Match kundli"}
            </Btn>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>
        </form>

        {busy && <ResultSkeleton />}
        {!busy && r && v && (
          <div id="match-result" className="mt-8 scroll-mt-24 space-y-6">
            <div className="card grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
              {[{ p: r.boy, n: boyName }, null, { p: r.girl, n: girlName }].map((x, i) =>
                x === null ? (
                  <div key="score" className="text-center">
                    <p className="font-heading text-6xl font-extrabold text-brand-primary">
                      {r.score}
                      <span className="text-2xl text-slate-400">/{r.maxScore}</span>
                    </p>
                    <p className="text-sm text-slate-500">{hi ? "गुण मिले" : "gunas matched"}</p>
                    <p className={`mt-1 font-semibold ${v.tone}`}>{hi ? v.hi : v.en}</p>
                    <div className="mx-auto mt-3 h-2.5 w-56 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${v.bar}`} style={{ width: `${(r.score / r.maxScore) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <div key={i} className="rounded-xl bg-brand-cream/60 p-4 text-sm">
                    <p className="font-heading text-base font-bold text-brand-indigo">{x.n}</p>
                    <p className="text-slate-500">{x.p.place}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt className="text-slate-500">{hi ? "चंद्र राशि" : "Moon sign"}</dt>
                      <dd>{x.p.moonSign ?? "—"}</dd>
                      <dt className="text-slate-500">{hi ? "नक्षत्र" : "Nakshatra"}</dt>
                      <dd>{x.p.nakshatra ? `${x.p.nakshatra}${x.p.pada ? ` (${x.p.pada})` : ""}` : "—"}</dd>
                      <dt className="text-slate-500">{hi ? "गण" : "Gana"}</dt>
                      <dd>{x.p.gana ?? "—"}</dd>
                      <dt className="text-slate-500">{hi ? "नाड़ी" : "Nadi"}</dt>
                      <dd>{x.p.nadi ?? "—"}</dd>
                    </dl>
                  </div>
                ),
              )}
            </div>

            {(r.nadiDosha || r.bhakootDosha) && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {hi ? (
                  <>
                    {[r.nadiDosha && "नाड़ी दोष", r.bhakootDosha && "भकूट दोष"].filter(Boolean).join(" और ")} पाया गया। एक ज्योतिषी यह जांच सकते हैं कि
                    इस जोड़े पर अपवाद (निवारण) लागू होते हैं या नहीं।
                  </>
                ) : (
                  <>
                    {[r.nadiDosha && "Nadi dosha", r.bhakootDosha && "Bhakoot dosha"].filter(Boolean).join(" and ")} found. An astrologer can check whether
                    exceptions (cancellations) apply to this pair.
                  </>
                )}
              </p>
            )}

            <div className="card overflow-x-auto">
              <h2 className="font-heading text-lg font-bold text-brand-primary">{hi ? "अष्टकूट विवरण" : "Ashtakoot breakdown"}</h2>
              <table className="mt-3 w-full min-w-max text-left text-sm">
                <thead className="bg-brand-cream/60 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">{hi ? "कूट" : "Koota"}</th>
                    <th className="px-2 py-2 font-medium">{hi ? "यह क्या दर्शाता है" : "What it shows"}</th>
                    <th className="px-2 py-2 font-medium">{boyName}</th>
                    <th className="px-2 py-2 font-medium">{girlName}</th>
                    <th className="px-2 py-2 text-right font-medium">{hi ? "अंक" : "Score"}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.kootas.map((k) => (
                    <tr key={k.key} className={`border-t border-brand-border ${k.dosha ? "bg-red-50/60" : ""}`}>
                      <td className="px-2 py-2 font-medium">
                        {k.name} <span className="text-slate-400">{k.nameHi}</span>
                      </td>
                      <td className="px-2 py-2 text-slate-600">{k.about}</td>
                      <td className="px-2 py-2">{k.boy ?? "—"}</td>
                      <td className="px-2 py-2">{k.girl ?? "—"}</td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {k.score ?? "—"}
                        <span className="font-normal text-slate-400">/{k.max ?? "—"}</span>
                        {k.dosha && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] text-white">{hi ? "दोष" : "Dosha"}</span>}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-brand-border font-semibold">
                    <td className="px-2 py-2" colSpan={4}>
                      {hi ? "कुल" : "Total"}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {r.score}/{r.maxScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(
                [
                  ["boy", boyName],
                  ["girl", girlName],
                ] as const
              ).map(([k, name]) => {
                const m = r.mangalDosha[k];
                return (
                  <div key={k} className={`card ${m?.present ? "border-red-200" : ""}`}>
                    <h2 className="font-heading font-bold text-brand-primary">
                      {hi ? "मंगल दोष" : "Mangal dosha"} – {name}
                    </h2>
                    {m ? (
                      <>
                        <p className={`mt-2 font-semibold ${m.present ? "text-red-700" : "text-emerald-700"}`}>
                          {m.present ? (hi ? "मौजूद है" : "Present") : hi ? "मौजूद नहीं है" : "Not present"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{m.explanation}</p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">{hi ? "उपलब्ध नहीं है" : "Not available"}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {r.mangalDosha.boy && r.mangalDosha.girl && (
              <p className="text-sm text-slate-600">
                {r.mangalDosha.boy.present === r.mangalDosha.girl.present
                  ? hi
                    ? "दोनों साथियों की मंगल दोष स्थिति समान है, जिसे परंपरागत रूप से संतुलित माना जाता है।"
                    : "Both partners have the same Mangal dosha status, which is traditionally considered balanced."
                  : hi
                    ? "केवल एक साथी को मंगल दोष है। निर्णय लेने से पहले कृपया किसी ज्योतिषी से परामर्श करें।"
                    : "Only one partner has Mangal dosha. Please consult an astrologer before deciding."}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-indigo to-brand-midnight p-6 font-heading font-semibold text-white shadow-celestial">
              <p>{hi ? "किसी विशेषज्ञ से विस्तृत विवाह अनुकूलता रीडिंग प्राप्त करें।" : "Get a detailed marriage compatibility reading from an expert."}</p>
              <Link href="/astrologers?concern=marriage" className="btn-primary">
                {hi ? "विवाह ज्योतिषी से पूछें" : "Ask a marriage astrologer"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
