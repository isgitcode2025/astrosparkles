"use client";

import { Spinner } from "@/components/ui/Button";

import { Link, useLang, useLocaleRouter } from "@/components/i18n";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Divider, OtpStep, PhoneInput } from "@/components/auth/Fields";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useOtp } from "@/components/auth/useOtp";
import { useAuth } from "@/components/auth/AuthProvider";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { api, session, type SignOutReason } from "@/lib/api";
import { defaultBrand, type Brand } from "@/lib/brand";

type Review = {
  name: string;
  rating: number;
  comment: string;
  astrologerName: string;
};

/** Left panel: photo, live counts and a real recent review (or a plain value card). */
function TrustPanel({ lang }: { lang: "en" | "hi" }) {
  const [online, setOnline] = useState<number | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  useEffect(() => {
    api<{ online: number }>("/astrologers/stats")
      .then((s) => setOnline(s.online))
      .catch(() => undefined);
    api<Review[]>("/consultations/reviews/recent?limit=1")
      .then((r) => setReview(r[0] ?? null))
      .catch(() => undefined);
  }, []);

  return (
    <div className="relative order-2 flex min-h-[420px] flex-col justify-between overflow-hidden bg-brand-indigo lg:order-1 lg:col-span-6 lg:min-h-[680px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        aria-hidden
      >
        <svg className="h-full w-full" fill="none" viewBox="0 0 800 800">
          <circle
            cx="400"
            cy="400"
            r="360"
            stroke="#ffdf9a"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <circle
            cx="400"
            cy="400"
            r="280"
            stroke="#ffa440"
            strokeWidth="1.5"
          />
          <polygon
            points="400,80 677,560 123,560"
            stroke="#ffdf9a"
            strokeWidth="1.5"
          />
          <polygon
            points="400,720 123,240 677,240"
            stroke="#ffa440"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth-login.jpg"
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo via-brand-indigo/20 to-brand-indigo/40" />
      </div>
      <div className="relative z-10 flex items-center justify-between gap-2 p-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-1.5 shadow-sm backdrop-blur-md">
          <i
            className="fa-solid fa-certificate text-brand-saffron"
            aria-hidden
          />
          <span className="text-xs font-bold tracking-tight text-brand-dark">
            {lang === "hi" ? "सत्यापित वैदिक ज्योतिषी" : "Verified Vedic astrologers"}
          </span>
        </div>
        {online !== null && online > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full bg-brand-dark/60 px-4 py-1.5 text-xs text-white backdrop-blur-md sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>{lang === "hi" ? `${online} अभी ऑनलाइन` : `${online} online now`}</span>
          </div>
        )}
      </div>
      <div className="relative z-10 p-6">
        <div className="rounded-2xl bg-white/90 p-4 shadow-[0_12px_32px_rgba(37,2,89,0.18)] backdrop-blur-xl">
          {review ? (
            <>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <i
                      key={i}
                      className={`fa-${i <= review.rating ? "solid" : "regular"} fa-star text-sm`}
                      aria-hidden
                    />
                  ))}
                  <span className="ml-1 text-sm font-bold text-brand-dark">
                    {review.rating} / 5
                  </span>
                </div>
                <span className="rounded-full bg-[#ffdcbe]/60 px-2 py-0.5 text-[10px] font-semibold text-[#8b5000]">
                  {lang === "hi" ? "वास्तविक समीक्षा" : "Real review"}
                </span>
              </div>
              <p className="line-clamp-3 text-sm font-medium leading-snug text-brand-text">
                “{review.comment}”
              </p>
              <div className="mt-2 flex items-center justify-between pt-1 text-[11px] text-[#494550]">
                <span className="font-medium">{review.name}</span>
                <span className="text-[#7b7581]">
                  {lang === "hi" ? `${review.astrologerName} से परामर्श लिया` : `Consulted ${review.astrologerName}`}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffa440] text-white">
                <i className="fa-solid fa-gift" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-dark">
                  {lang === "hi" ? "आपकी पहली चैट 5 मिनट मुफ़्त है" : "Your first chat is free for 5 minutes"}
                </p>
                <p className="mt-0.5 text-xs text-[#494550]">
                  {lang === "hi"
                    ? "किसी सत्यापित ज्योतिषी से निजी तौर पर बात करें। आपका फ़ोन नंबर कभी नहीं दिखाया जाता।"
                    : "Talk privately with a verified astrologer. Your phone number is never shown."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const lang = useLang();
  const router = useLocaleRouter();
  const rawNext = useSearchParams().get("next") || "/";
  // only same-site paths, never another website
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const { status } = useAuth();
  const [reason, setReason] = useState<SignOutReason | null>(null);
  useEffect(() => setReason(session.takeReason()), []);
  // already signed in (for example in another tab): go straight on
  useEffect(() => {
    if (status === "ready" && otp.step === "phone") router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const otp = useOtp();
  const [brand, setBrand] = useState<Brand>(defaultBrand);
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    api<Brand>("/config/brand")
      .then((b) => setBrand({ ...defaultBrand, ...b }))
      .catch(() => undefined);
  }, []);
  const done = useCallback(() => {
    startNavProgress();
    router.push(next);
  }, [router, next]);
  const q = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] items-center bg-[#fef7ff]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-10">
        <div className="grid grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_-12px_rgba(59,31,110,0.12)] lg:grid-cols-12">
          <TrustPanel lang={lang} />
          <div className="order-1 flex flex-col justify-center bg-white p-6 md:p-10 lg:order-2 lg:col-span-6">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-6 text-center sm:text-left">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#F4EAFF] px-3 py-1 text-xs font-semibold text-brand-dark">
                  <i
                    className="fa-solid fa-circle-check text-[#8b5000]"
                    aria-hidden
                  />
                  <span>{lang === "hi" ? "सनातन ज्योतिष पोर्टल" : "Sanatan Jyotish Portal"}</span>
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-dark">
                  {lang === "hi" ? `${brand.name} में आपका स्वागत है` : `Welcome to ${brand.name}`}
                </h1>
                <p className="mt-1 text-base text-[#494550]">
                  {lang === "hi"
                    ? "सत्यापित वैदिक ज्योतिषियों से जुड़ने और अपनी कुंडली व परामर्श एक ही जगह रखने के लिए अपना मोबाइल नंबर दर्ज करें।"
                    : "Enter your mobile number to connect with verified Vedic astrologers and keep your kundli and consultations in one place."}
                </p>
              </div>

              {(reason === "expired" || reason === "blocked") && (
                <p role="alert" className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${reason === "blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                  <i className={`fa-solid ${reason === "blocked" ? "fa-ban" : "fa-clock-rotate-left"} mt-0.5`} aria-hidden />
                  {reason === "blocked"
                    ? lang === "hi"
                      ? "यह खाता सक्रिय नहीं है। यदि आपको लगता है कि यह गलती है, तो कृपया सहायता टीम से संपर्क करें।"
                      : "This account is not active. Please contact support if you think this is a mistake."
                    : lang === "hi"
                      ? "आपका सत्र समाप्त हो गया है। जारी रखने के लिए कृपया फिर से लॉगिन करें।"
                      : "Your session has ended. Please log in again to continue."}
                </p>
              )}
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (otp.step === "phone") return otp.send();
                  if (await otp.verify()) done();
                }}
              >
                {otp.step === "phone" ? (
                  <>
                    <label
                      htmlFor="mobile"
                      className="block text-xs font-semibold text-brand-dark"
                    >
                      {lang === "hi" ? "मोबाइल नंबर" : "Mobile Number"} <span className="text-red-600">*</span>
                    </label>
                    <PhoneInput
                      value={otp.phone}
                      onChange={otp.setPhone}
                      autoFocus
                      lang={lang}
                    />
                    <button
                      type="submit"
                      disabled={otp.busy || otp.phone.length !== 10}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#ffa440] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-saffronHover hover:shadow-lg disabled:opacity-60"
                    >
                      {otp.busy && <Spinner />}
                      <span>{otp.busy ? (lang === "hi" ? "ओटीपी भेजा जा रहा है…" : "Sending OTP…") : lang === "hi" ? "ओटीपी भेजें" : "Send OTP"}</span>
                      {!otp.busy && <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden />}
                    </button>
                    <p className="text-xs text-[#7b7581]">
                      {lang === "hi"
                        ? "नए हैं? अपने नंबर से लॉगिन करने पर आपका खाता अपने आप बन जाता है।"
                        : "New here? Logging in with your number creates your account automatically."}
                    </p>
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
                    submitLabel={lang === "hi" ? "सत्यापित करें और जारी रखें" : "Verify & continue"}
                    lang={lang}
                  />
                )}
                {otp.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {otp.error}
                  </p>
                )}
              </form>

              {google && <Divider label={lang === "hi" ? "या इसके साथ जारी रखें" : "Or continue with"} />}
              <GoogleButton
                onDone={done}
                text="signin_with"
                onAvailable={setGoogle}
              />

              <p className="mt-5 text-center text-sm leading-relaxed text-[#7b7581]">
                {lang === "hi" ? (
                  <>
                    आगे बढ़ने पर, आप {brand.name} की{" "}
                    <Link href="/terms" className="font-semibold text-brand-dark hover:underline">
                      सेवा शर्तों
                    </Link>{" "}
                    और{" "}
                    <Link href="/privacy-policy" className="font-semibold text-brand-dark hover:underline">
                      गोपनीयता नीति
                    </Link>{" "}
                    से सहमत होते हैं।
                  </>
                ) : (
                  <>
                    By proceeding, you agree to {brand.name}{" "}
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
                    .
                  </>
                )}
              </p>
              <p className="mt-6 text-center text-base text-[#494550]">
                {lang === "hi" ? "पहली बार आए हैं?" : "First time here?"}
                <Link
                  href={`/signup${q}`}
                  className="ml-1 font-bold text-[#8b5000] transition-colors hover:text-brand-dark"
                >
                  {lang === "hi" ? "खाता बनाएं और पहली चैट मुफ़्त पाएं →" : "Create account & get your first chat free →"}
                </Link>
              </p>
              <div className="mt-6 flex items-center justify-center gap-5 text-[11px] font-semibold text-[#7b7581]">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[#8b5000]" aria-hidden />{" "}
                  {lang === "hi" ? "100% निजी" : "100% Private"}
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-bolt text-[#8b5000]" aria-hidden />{" "}
                  {lang === "hi" ? "तुरंत पहुंच" : "Instant Access"}
                </span>
                <span className="flex items-center gap-1">
                  <i
                    className="fa-solid fa-user-shield text-[#8b5000]"
                    aria-hidden
                  />{" "}
                  {lang === "hi" ? "सत्यापित ज्योतिषी" : "Verified Astrologers"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
