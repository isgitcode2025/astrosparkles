"use client";

import { useEffect, useState } from "react";
import { api, ApiRequestError, session, type Me } from "@/lib/api";

export type VerifyResult = { accessToken: string; isNewUser: boolean; user: Me };

/** Mobile OTP flow shared by login and sign-up: send, resend countdown, verify. */
export function useOtp() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ resendAfterSeconds: number }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) });
      setStep("otp");
      setCode("");
      setResendIn(r.resendAfterSeconds);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /** Verifies the code and stores the session. Returns the result, or null on failure. */
  const verify = async (): Promise<VerifyResult | null> => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<VerifyResult>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
      session.set(r.accessToken);
      return r;
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not verify the OTP");
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { step, setStep, phone, setPhone, code, setCode, busy, setBusy, error, setError, resendIn, send, verify };
}
