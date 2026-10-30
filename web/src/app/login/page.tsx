"use client";

import { Spinner } from "@/components/ui/Button";

import { Link } from "@/components/i18n";
import { useRouter, useSearchParams } from "next/navigation";
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
function TrustPanel() {
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
            Verified Vedic astrologers
          </span>
        </div>
        {online !== null && online > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full bg-brand-dark/60 px-4 py-1.5 text-xs text-white backdrop-blur-md sm:inline-flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>{online} online now</span>
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
                  Real review
                </span>
              </div>
              <p className="line-clamp-3 text-sm font-medium leading-snug text-brand-text">
                “{review.comment}”
              </p>
              <div className="mt-2 flex items-center justify-between pt-1 text-[11px] text-[#494550]">
                <span className="font-medium">{review.name}</span>
                <span className="text-[#7b7581]">
                  Consulted {review.astrologerName}
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
                  Your first chat is free for 5 minutes
                </p>
                <p className="mt-0.5 text-xs text-[#494550]">
                  Talk privately with a verified astrologer. Your phone number
                  is never shown.
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
  const router = useRouter();
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
          <TrustPanel />
          <div className="order-1 flex flex-col justify-center bg-white p-6 md:p-10 lg:order-2 lg:col-span-6">
            <div className="mx-auto w-full max-w-[440px]">
              <div className="mb-6 text-center sm:text-left">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#F4EAFF] px-3 py-1 text-xs font-semibold text-brand-dark">
                  <i
                    className="fa-solid fa-circle-check text-[#8b5000]"
                    aria-hidden
                  />
                  <span>Sanatan Jyotish Portal</span>
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-dark">
                  Welcome to {brand.name}
                </h1>
                <p className="mt-1 text-base text-[#494550]">
                  Enter your mobile number to connect with verified Vedic
                  astrologers and keep your kundli and consultations in one
                  place.
                </p>
              </div>

              {(reason === "expired" || reason === "blocked") && (
                <p role="alert" className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${reason === "blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
                  <i className={`fa-solid ${reason === "blocked" ? "fa-ban" : "fa-clock-rotate-left"} mt-0.5`} aria-hidden />
                  {reason === "blocked" ? "This account is not active. Please contact support if you think this is a mistake." : "Your session has ended. Please log in again to continue."}
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
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <PhoneInput
                      value={otp.phone}
                      onChange={otp.setPhone}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={otp.busy || otp.phone.length !== 10}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#ffa440] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-saffronHover hover:shadow-lg disabled:opacity-60"
                    >
                      {otp.busy && <Spinner />}
                      <span>{otp.busy ? "Sending OTP…" : "Send OTP"}</span>
                      {!otp.busy && <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden />}
                    </button>
                    <p className="text-xs text-[#7b7581]">
                      New here? Logging in with your number creates your account
                      automatically.
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
                    submitLabel="Verify & continue"
                  />
                )}
                {otp.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {otp.error}
                  </p>
                )}
              </form>

              {google && <Divider label="Or continue with" />}
              <GoogleButton
                onDone={done}
                text="signin_with"
                onAvailable={setGoogle}
              />

              <p className="mt-5 text-center text-sm leading-relaxed text-[#7b7581]">
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
              </p>
              <p className="mt-6 text-center text-base text-[#494550]">
                First time here?
                <Link
                  href={`/signup${q}`}
                  className="ml-1 font-bold text-[#8b5000] transition-colors hover:text-brand-dark"
                >
                  Create account & get your first chat free →
                </Link>
              </p>
              <div className="mt-6 flex items-center justify-center gap-5 text-[11px] font-semibold text-[#7b7581]">
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[#8b5000]" aria-hidden />{" "}
                  100% Private
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-solid fa-bolt text-[#8b5000]" aria-hidden />{" "}
                  Instant Access
                </span>
                <span className="flex items-center gap-1">
                  <i
                    className="fa-solid fa-user-shield text-[#8b5000]"
                    aria-hidden
                  />{" "}
                  Verified Astrologers
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
