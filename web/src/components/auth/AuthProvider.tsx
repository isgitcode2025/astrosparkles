"use client";

import { Link, useLocaleRouter } from "@/components/i18n";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiRequestError, session, TOKEN_KEY, type Me, type SignOutReason } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "@/components/ui/Toaster";

type Status = "loading" | "guest" | "ready" | "error";
type AuthState = {
  status: Status;
  me: Me | null;
  /** Reloads the signed-in user (balance, roles). Quiet: keeps showing the current data meanwhile. */
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState>({ status: "loading", me: null, refresh: async () => undefined, logout: () => undefined });
export const useAuth = () => useContext(AuthContext);

const FOCUS_RECHECK_MS = 15_000;
const SIGNED_OUT_TEXT: Record<SignOutReason, string> = {
  logout: "You have been logged out.",
  expired: "Your session has ended. Please log in again.",
  blocked: "This account is not active. Please contact support.",
};

/**
 * One source of truth for "who is signed in". Every private page reads it, so a logout,
 * an expired session, a blocked account or a removed role updates every page at once,
 * in this tab and in the user's other open tabs.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const lastCheck = useRef(0);
  const seq = useRef(0);

  const signedOut = useCallback(() => {
    seq.current++; // ignore any request still in flight for the old user
    setMe(null);
    setStatus("guest");
    disconnectSocket();
  }, []);

  const refresh = useCallback(async () => {
    if (!session.get()) return signedOut();
    const mine = ++seq.current;
    lastCheck.current = Date.now();
    try {
      const m = await api<Me>("/users/me", { auth: true });
      if (mine !== seq.current) return;
      setMe(m);
      setStatus("ready");
    } catch (e) {
      if (mine !== seq.current) return;
      // 401/403 already cleared the session (which calls signedOut via the event)
      if (e instanceof ApiRequestError && (e.status === 401 || e.status === 403)) return signedOut();
      setStatus((s) => (s === "ready" ? s : "error")); // server unreachable: keep current data if we have it
    }
  }, [signedOut]);

  const logout = useCallback(() => session.clear("logout"), []);

  useEffect(() => {
    refresh();
    const onSession = (e: Event) => {
      const d = (e as CustomEvent<{ signedIn: boolean; reason?: SignOutReason }>).detail;
      if (!d) return void refresh(); // plain "something changed" signal
      if (d.signedIn) {
        setStatus("loading");
        refresh();
      } else {
        signedOut();
        if (d?.reason) (d.reason === "logout" ? toast.info : toast.error)(SIGNED_OUT_TEXT[d.reason]);
      }
    };
    // another tab logged in or out
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY && e.key !== null) return;
      if (!session.get()) {
        signedOut();
        toast.info("You were logged out in another tab.");
      } else {
        setStatus("loading");
        refresh();
      }
    };
    const recheck = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > FOCUS_RECHECK_MS) refresh();
    };
    // back/forward cache restores a frozen page: check again before showing anything private
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh();
    };
    const onWallet = () => refresh();
    const onForbidden = () => refresh();
    window.addEventListener("kj-session", onSession);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("kj-wallet", onWallet);
    window.addEventListener("kj-forbidden", onForbidden);
    return () => {
      window.removeEventListener("kj-session", onSession);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("kj-wallet", onWallet);
      window.removeEventListener("kj-forbidden", onForbidden);
    };
  }, [refresh, signedOut]);

  return <AuthContext.Provider value={{ status, me, refresh, logout }}>{children}</AuthContext.Provider>;
}

/** Path to log in and come back here afterwards. */
export function useLoginHref() {
  const pathname = usePathname() ?? "/";
  return `/login?next=${encodeURIComponent(pathname + (typeof window !== "undefined" ? window.location.search : ""))}`;
}

/**
 * Guards a private page. Shows `skeleton` while the session is checked, sends signed-out
 * visitors to login (or home after a logout), shows a "no access" card when a role is missing,
 * and remounts the page for each user so nothing from a previous session is ever shown.
 */
export function RequireAuth({
  children,
  skeleton,
  roles,
  deniedTitle = "You don't have access to this page",
  deniedText = "Your account doesn't have permission to open this page.",
}: {
  children: ReactNode;
  skeleton: ReactNode;
  roles?: string[];
  deniedTitle?: string;
  deniedText?: string;
}) {
  const { status, me, refresh } = useAuth();
  const router = useLocaleRouter();
  const loginHref = useLoginHref();

  useEffect(() => {
    if (status !== "guest") return;
    let reason: string | null = null;
    try {
      reason = window.sessionStorage.getItem("kj_signout_reason");
    } catch {
      /* ignore */
    }
    router.replace(reason === "logout" ? "/" : loginHref);
  }, [status, router, loginHref]);

  if (status === "loading" || status === "guest") return <>{skeleton}</>;
  if (status === "error" || !me)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Could not check your account" onRetry={refresh} />
      </div>
    );
  if (roles && !roles.some((r) => me.roles.includes(r)))
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-brand-border bg-white px-6 py-10 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-cream text-xl text-brand-saffron">
            <i className="fa-solid fa-lock" aria-hidden />
          </div>
          <p className="font-heading text-lg font-bold text-brand-indigo">{deniedTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{deniedText}</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-saffron hover:underline">
            Back to the home page
          </Link>
        </div>
      </div>
    );
  return <div key={me.id}>{children}</div>;
}
