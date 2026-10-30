"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiRequestError, session } from "@/lib/api";
import type { VerifyResult } from "./useOtp";

type GoogleId = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

/**
 * Google sign-in with Google Identity Services. Shown only when the API exposes a web client id
 * (first id in GOOGLE_CLIENT_IDS). Returns nothing otherwise, so the divider can be hidden too.
 */
export function GoogleButton({ onDone, text = "continue_with", onAvailable }: { onDone: (r: VerifyResult) => void; text?: "signin_with" | "signup_with" | "continue_with"; onAvailable?: (ok: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ googleWebClientId?: string }>("/config/public-keys")
      .then((k) => {
        setClientId(k.googleWebClientId || "");
        onAvailable?.(Boolean(k.googleWebClientId));
      })
      .catch(() => {
        setClientId("");
        onAvailable?.(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    const render = () => {
      const g = (window as unknown as { google?: GoogleId }).google;
      if (!g || !ref.current) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setError(null);
          try {
            const r = await api<VerifyResult>("/auth/google", { method: "POST", body: JSON.stringify({ idToken: credential }) });
            session.set(r.accessToken);
            onDone(r);
          } catch (e) {
            setError(e instanceof ApiRequestError ? e.message : "Google sign-in failed");
          }
        },
      });
      g.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text, width: ref.current.offsetWidth || 360 });
    };
    if ((window as unknown as { google?: GoogleId }).google) return render();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = render;
    document.head.appendChild(s);
  }, [clientId, onDone, text]);

  if (!clientId) return null;
  return (
    <div>
      <div ref={ref} className="flex w-full justify-center" />
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
