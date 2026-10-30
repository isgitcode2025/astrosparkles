"use client";

import { Spinner } from "@/components/ui/Button";

import { Link, useLang } from "@/components/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Divider, OtpStep, PhoneInput } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useOtp, type VerifyResult } from "@/components/auth/useOtp";
import { useAuth } from "@/components/auth/AuthProvider";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { api } from "@/lib/api";
import { defaultBrand, type Brand } from "@/lib/brand";

const field =
  "w-full rounded-lg bg-[#F9F1FF] py-3 pl-11 pr-4 text-base text-brand-text outline-none transition-all placeholder:text-[#7b7581]/70 focus:bg-white focus:shadow-[0_0_0_2px_#ffa440]";

const valueText = {
  en: {
    verified: "Verified Vedic astrologers",
    offer: "Welcome offer",
    offerLine: "First chat free for 5 minutes + free Vedic kundli with PDF",
    bullets: [
      ["Verified", " Vedic astrologers, tarot readers & numerologists"],
      ["Private", " chats: your phone number is never shown"],
      ["Free tools:", " kundli, matching, panchang & daily horoscope"],
    ] as [string, string][],
    blessing: "May all beings be happy and free from illness",
  },
  hi: {
    verified: "सत्यापित वैदिक ज्योतिषी",
    offer: "स्वागत ऑफर",
    offerLine: "पहली चैट 5 मिनट मुफ़्त + मुफ़्त वैदिक कुंडली PDF के साथ",
    bullets: [
      ["सत्यापित", " वैदिक ज्योतिषी, टैरो रीडर और अंक ज्योतिषी"],
      ["निजी", " चैट: आपका फ़ोन नंबर कभी नहीं दिखाया जाता"],
      ["मुफ़्त टूल्स:", " कुंडली, मिलान, पंचांग और दैनिक राशिफल"],
    ] as [string, string][],
    blessing: "सभी प्राणी सुखी और स्वस्थ रहें",
  },
};

function ValuePanel({ lang }: { lang: "en" | "hi" }) {
  const l = valueText[lang];
  return (
    <div className="relative order-2 flex flex-col justify-between overflow-hidden bg-brand-indigo text-[#f6edff] lg:order-1 lg:col-span-5">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#ffa440]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-brand-dark/40 blur-3xl" />
      <div className="relative h-[300px] w-full overflow-hidden sm:h-[340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth-signup.jpg"
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo via-brand-indigo/40 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-brand-indigo/85 px-3 py-1 shadow-md backdrop-blur-md">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ffa440]" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#ffdcbe]">
            {l.verified}
          </span>
        </div>
      </div>
      <div className="relative z-10 -mt-8 flex flex-1 flex-col justify-between px-6 pb-6">
        <div className="mb-4 rounded-xl bg-white/15 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffa440] text-[#6d3e00] shadow-sm">
              <i className="fa-solid fa-gift" aria-hidden />
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#ffdcbe]">
                {l.offer}
              </span>
              <p className="font-heading text-lg font-semibold leading-snug text-[#f6edff]">
                {l.offerLine}
              </p>
            </div>
          </div>
        </div>
        <ul className="mb-4 space-y-2.5 text-sm">
          {l.bullets.map(([b, t]) => (
            <li key={b} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffa440]/20 text-[10px] text-[#ffa440]">
                <i className="fa-solid fa-check" aria-hidden />
              </span>
              <span className="text-[#f6edff]/90">
                <span className="font-semibold text-[#ffdcbe]">{b}</span>
                {t}
              </span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg bg-brand-dark/30 p-3 text-center">
          <p
            className="font-heading text-base font-medium tracking-wide text-[#ffa440]"
            lang="sa"
          >
            “सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः”
          </p>
          <p className="mt-0.5 text-[11px] text-[#f6edff]/70">
            {l.blessing}
          </p>
        </div>
      </div>
    </div>
  );
}

function SignupForm() {
  const lang = useLang();
  const router = useRouter();
  const rawNext = useSearchParams().get("next") || "/";
  // only same-site paths, never another website
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const { status } = useAuth();
  // already signed in (for example in another tab): go straight on
  useEffect(() => {
    if (status === "ready" && otp.step === "phone") router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const otp = useOtp();
  const [brand, setBrand] = useState<Brand>(defaultBrand);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    api<Brand>("/config/brand")
      .then((b) => setBrand({ ...defaultBrand, ...b }))
      .catch(() => undefined);
  }, []);
  const q = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  /** After OTP: save the name (and email) on the new account, then continue. */
  const finish = async (r: VerifyResult) => {
    const patch: Record<string, string> = {};
    if (name.trim() && (r.isNewUser || !r.user.name)) patch.name = name.trim();
    if (email.trim() && (r.isNewUser || !r.user.email))
      patch.email = email.trim();
    if (Object.keys(patch).length)
      await api("/users/me", {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(patch),
      }).catch(() => undefined);
    window.dispatchEvent(new Event("kj-wallet"));
    startNavProgress();
    router.push(next);
  };
  const googleDone = useCallback(() => {
    startNavProgress();
    router.push(next);
  }, [router, next]);

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] items-center bg-[#fef7ff]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-10">
        <div className="grid min-h-[680px] w-full grid-cols-1 overflow-hidden rounded-xl bg-white shadow-[0_16px_40px_-8px_rgba(59,31,110,0.12),0_4px_12px_-2px_rgba(232,145,45,0.06)] lg:grid-cols-12">
          <ValuePanel lang={lang} />
          <div className="order-1 flex flex-col justify-between bg-white p-6 sm:p-10 lg:order-2 lg:col-span-7">
            <div className="mx-auto w-full max-w-[540px]">
              <div className="mb-5">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#ffdcbe]/50 px-2.5 py-1 text-[#8b5000]">
                  <i className="fa-solid fa-gift text-xs" aria-hidden />
                  <span className="text-[11px] font-semibold tracking-wide">
                    {lang === "hi" ? "पहली चैट 5 मिनट मुफ़्त" : "First chat free for 5 minutes"}
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-dark">
                  {lang === "hi" ? `अपना ${brand.name} खाता बनाएं` : `Create your ${brand.name} Account`}
                </h1>
                <p className="mt-1 text-base text-[#494550]">
                  {lang === "hi" ? "अपने मोबाइल नंबर से कुछ ही सेकंड में जुड़ें।" : "Join in seconds with your mobile number."}
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (otp.step === "phone") return otp.send();
                  const r = await otp.verify();
                  if (r) await finish(r);
                }}
              >
                {otp.step === "phone" ? (
                  <>
                    <div>
                      <label
                        htmlFor="fullname"
                        className="mb-1.5 block text-xs font-medium text-brand-dark"
                      >
                        {lang === "hi" ? (
                          <span className="font-mukta">पूरा नाम</span>
                        ) : (
                          <>Full Name / <span className="font-mukta">पूरा नाम</span></>
                        )}{" "}
                        <span className="font-bold text-red-600">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <i
                          className="fa-regular fa-user pointer-events-none absolute left-4 text-[#7b7581]"
                          aria-hidden
                        />
                        <input
                          id="fullname"
                          required
                          minLength={2}
                          maxLength={80}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={lang === "hi" ? "जैसे अदिति सिंघल" : "e.g. Aditi Singhal"}
                          autoComplete="name"
                          className={field}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label
                          htmlFor="mobile"
                          className="text-xs font-medium text-brand-dark"
                        >
                          {lang === "hi" ? (
                            <span className="font-mukta">मोबाइल नंबर</span>
                          ) : (
                            <>
                              Mobile Number / <span className="font-mukta">मोबाइल नंबर</span>
                            </>
                          )}{" "}
                          <span className="font-bold text-red-600">*</span>
                        </label>
                        <span className="text-[10px] font-semibold text-[#494550]">
                          {lang === "hi" ? "सत्यापन के लिए ओटीपी भेजा जाएगा" : "OTP will be sent to verify"}
                        </span>
                      </div>
                      <PhoneInput value={otp.phone} onChange={otp.setPhone} lang={lang} />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-xs font-medium text-brand-dark"
                      >
                        {lang === "hi" ? "ईमेल पता" : "Email Address"}{" "}
                        <span className="font-normal text-[#494550]">
                          {lang === "hi" ? "(वैकल्पिक)" : "(Optional)"}
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <i
                          className="fa-regular fa-envelope pointer-events-none absolute left-4 text-[#7b7581]"
                          aria-hidden
                        />
                        <input
                          id="email"
                          type="email"
                          maxLength={120}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className={field}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={
                        otp.busy ||
                        otp.phone.length !== 10 ||
                        name.trim().length < 2
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#8b5000] px-6 py-3.5 font-heading text-lg font-bold text-white shadow-[0_8px_20px_rgba(139,80,0,0.22)] transition-all duration-200 hover:bg-[#ffa440] hover:text-[#6d3e00] active:scale-[0.99] disabled:opacity-60"
                    >
                      {otp.busy && <Spinner />}
                      <span>
                        {otp.busy ? (lang === "hi" ? "ओटीपी भेजा जा रहा है…" : "Sending OTP…") : lang === "hi" ? "साइन अप करें और ओटीपी पाएं" : "Sign Up & Get OTP"}
                      </span>
                      <i
                        className={`fa-solid fa-arrow-right text-base ${otp.busy ? "hidden" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </>
                ) : (
                  <OtpStep
                    phone={otp.phone}
                    code={otp.code}
                    setCode={otp.setCode}
                    busy={otp.busy}
                    resendIn={otp.resendIn}
                    onResend={otp.send}
                    onChangeNumber={() => otp.setStep("phone")}
                    submitLabel={lang === "hi" ? "सत्यापित करें और खाता बनाएं" : "Verify & create account"}
                    lang={lang}
                  />
                )}
                {otp.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {otp.error}
                  </p>
                )}
              </form>

              {google && <Divider label={lang === "hi" ? "या इसके साथ साइन अप करें" : "Or sign up with"} />}
              <GoogleButton
                onDone={googleDone}
                text="signup_with"
                onAvailable={setGoogle}
              />

              <p className="mt-4 text-center text-[11px] leading-relaxed text-[#7b7581]">
                {lang === "hi" ? (
                  <>
                    साइन अप करके, आप हमारी{" "}
                    <Link href="/terms" className="font-semibold text-brand-dark hover:underline">
                      सेवा शर्तों
                    </Link>{" "}
                    और{" "}
                    <Link href="/privacy-policy" className="font-semibold text-brand-dark hover:underline">
                      गोपनीयता नीति
                    </Link>{" "}
                    से सहमत होते हैं। आपके जन्म विवरण और चैट निजी रखे जाते हैं।
                  </>
                ) : (
                  <>
                    By signing up, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    &amp;{" "}
                    <Link
                      href="/privacy-policy"
                      className="font-semibold text-brand-dark hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    . Your birth details and chats are kept private.
                  </>
                )}
              </p>
            </div>

            <div className="mx-auto mt-5 w-full max-w-[540px] space-y-1 rounded-xl bg-[#F9F1FF]/60 p-4 text-center">
              <p className="text-sm text-brand-text">
                {lang === "hi" ? "पहले से खाता है?" : "Already have an account?"}
                <Link
                  href={`/login${q}`}
                  className="ml-1 inline-flex items-center gap-1 font-heading text-lg font-bold text-[#8b5000] hover:underline"
                >
                  <span>{lang === "hi" ? "साइन इन / लॉगिन करें" : "Sign In / Login"}</span>
                  <i
                    className="fa-solid fa-right-to-bracket text-sm"
                    aria-hidden
                  />
                </Link>
              </p>
              <Link
                href="/join-astrologer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark transition-colors hover:text-[#8b5000]"
              >
                <i className="fa-solid fa-star text-[#ffa440]" aria-hidden />
                <span>{lang === "hi" ? "क्या आप ज्योतिषी हैं? ज्योतिषी पार्टनर के रूप में जुड़ें →" : "Are you an astrologer? Join as Astrologer Partner →"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
