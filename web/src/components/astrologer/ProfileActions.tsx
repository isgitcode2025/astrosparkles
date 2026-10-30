"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiRequestError, session } from "@/lib/api";
import { Spinner } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/Toaster";

/** Follow / unfollow and share buttons on the astrologer profile card. */
export function ProfileActions({ astrologerId, slug, name, followers }: { astrologerId: string; slug: string; name: string; followers: number }) {
  const router = useRouter();
  const [state, setState] = useState({ following: false, followerCount: followers });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { status, me } = useAuth();
  // follow state belongs to the signed-in person: reset it on logout or a different login
  useEffect(() => {
    if (status !== "ready") {
      setState((st) => ({ following: false, followerCount: st.followerCount }));
      return;
    }
    api<{ following: boolean; followerCount: number }>(`/astrologers/${astrologerId}/follow`, { auth: true })
      .then(setState)
      .catch(() => undefined);
  }, [astrologerId, status, me?.id]);

  const toggle = async () => {
    if (!session.get()) return router.push(`/login?next=/astrologer/${slug}`);
    setBusy(true);
    try {
      const r = await api<{ following: boolean; followerCount: number }>(`/astrologers/${astrologerId}/follow`, { method: state.following ? "DELETE" : "POST", auth: true });
      setState(r);
      toast.success(r.following ? `You follow ${name}.` : `You unfollowed ${name}.`);
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 sm:flex-col">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={state.following}
        className={`flex items-center gap-1 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition-colors disabled:opacity-60 ${
          state.following ? "border-brand-dark bg-brand-dark text-white hover:bg-brand-indigo" : "border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white"
        }`}
      >
        {busy ? <Spinner className="text-[11px]" /> : <i className={`fa-solid ${state.following ? "fa-check" : "fa-plus"} text-[11px]`} aria-hidden />}
        <span>{state.following ? "Following" : "Follow"}</span>
      </button>
      {state.followerCount > 0 && <span className="text-[11px] text-stone-500">{state.followerCount.toLocaleString("en-IN")} followers</span>}
      <button type="button" onClick={share} aria-label="Share profile" className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800">
        <i className={`fa-solid ${copied ? "fa-check text-emerald-600" : "fa-share-nodes"}`} aria-hidden />
      </button>
      {copied && <span className="text-[11px] text-emerald-600">Link copied</span>}
    </div>
  );
}
