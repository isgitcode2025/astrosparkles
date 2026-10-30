"use client";

import { Spinner } from "@/components/ui/Button";
import type { Lang } from "@/lib/i18n";

/** Mobile number input with the Indian country code (the API accepts Indian numbers). */
export function PhoneInput({ value, onChange, autoFocus, lang = "en" }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; lang?: Lang }) {
  return (
    <div className="flex overflow-hidden rounded-xl bg-[#F9F1FF] shadow-sm transition-all focus-within:bg-white focus-within:shadow-[0_0_0_2px_#ffa440]">
      <div className="flex select-none items-center gap-1 bg-[#F4EAFF] px-3 text-sm">
        <span className="text-[18px]" aria-hidden>
          🇮🇳
        </span>
        <span className="font-semibold text-brand-dark">+91</span>
      </div>
      <input
        id="mobile"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={lang === "hi" ? "10 अंकों का मोबाइल नंबर दर्ज करें" : "Enter 10-digit mobile number"}
        className="w-full bg-transparent px-4 py-3.5 text-base text-brand-text outline-none placeholder:text-[#7b7581]"
      />
    </div>
  );
}

/** Step 2 of the OTP flow. */
export function OtpStep({
  phone,
  code,
  setCode,
  busy,
  resendIn,
  onResend,
  onChangeNumber,
  submitLabel,
  lang = "en",
}: {
  phone: string;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  resendIn: number;
  onResend: () => void;
  onChangeNumber: () => void;
  submitLabel: string;
  lang?: Lang;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#494550]">
        {lang === "hi" ? (
          <>
            हमने <strong className="text-brand-dark">+91 {phone}</strong> पर 6 अंकों का कोड भेजा है{" "}
          </>
        ) : (
          <>
            We sent a 6-digit code to <strong className="text-brand-dark">+91 {phone}</strong>{" "}
          </>
        )}
        <button type="button" onClick={onChangeNumber} className="font-semibold text-brand-saffron hover:underline">
          {lang === "hi" ? "बदलें" : "Change"}
        </button>
      </p>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-brand-dark">
          {lang === "hi" ? "ओटीपी दर्ज करें" : "Enter OTP"} <span className="text-red-600">*</span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          className="w-full rounded-xl bg-[#F9F1FF] px-4 py-3.5 text-center text-2xl tracking-[0.6em] text-brand-dark shadow-sm outline-none transition-all focus:bg-white focus:shadow-[0_0_0_2px_#ffa440]"
        />
      </label>
      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#ffa440] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-saffronHover hover:shadow-lg disabled:opacity-60"
      >
        {busy && <Spinner />}
        <span>{busy ? (lang === "hi" ? "सत्यापित हो रहा है…" : "Verifying…") : submitLabel}</span>
        {!busy && <i className="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1" aria-hidden />}
      </button>
      <button type="button" disabled={resendIn > 0 || busy} onClick={onResend} className="w-full text-sm font-semibold text-brand-indigo disabled:text-[#7b7581]">
        {resendIn > 0
          ? lang === "hi"
            ? `${resendIn} सेकंड में ओटीपी फिर से भेजें`
            : `Resend OTP in ${resendIn}s`
          : lang === "hi"
            ? "ओटीपी फिर से भेजें"
            : "Resend OTP"}
      </button>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="h-px w-full bg-[#EFE3FF]" />
      <span className="absolute bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-[#7b7581]">{label}</span>
    </div>
  );
}
