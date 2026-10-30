"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { api, ApiRequestError, session, type Consultation } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

/** Starts a chat with an astrologer (login, balance and "already in a session" handled). */
export function useStartChat(astrologerId: string, slug: string, lang: Lang = "en") {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; recharge?: boolean } | null>(null);

  const start = async () => {
    if (!session.get()) {
      startNavProgress();
      return router.push(`/login?next=/astrologer/${slug}`);
    }
    setBusy(true);
    setError(null);
    try {
      const c = await api<Consultation>("/consultations/request", { method: "POST", auth: true, body: JSON.stringify({ astrologerId, mode: "chat" }) });
      startNavProgress();
      router.push(`/consultation/${c.id}`);
      return; // keep the button busy until the chat page opens
    } catch (e) {
      const text = e instanceof ApiRequestError ? e.message : lang === "hi" ? "परामर्श शुरू नहीं हो सका" : "Could not start the consultation";
      setError({ text, recharge: /balance|recharge/i.test(text) });
      if (e instanceof ApiRequestError && e.status === 409 && /ongoing/.test(text)) {
        const active = await api<Consultation | null>("/consultations/active", { auth: true }).catch(() => null);
        if (active) {
          startNavProgress();
          router.push(`/consultation/${active.id}`);
          return;
        }
      }
    }
    setBusy(false);
  };

  return { start, busy, error };
}
