"use client";

import { Link, useLang } from "@/components/i18n";
import { useAuth } from "@/components/auth/AuthProvider";
import { Chevron } from "@/components/home/fig";
import { Skel } from "@/components/ui/Skeleton";
import type { Lang } from "@/lib/i18n";

const text = {
  en: {
    login: "Signup",
    dashboard: "Astrologer dashboard",
    admin: "Admin panel",
    consultations: "My consultations",
    bookings: "My bookings",
    orders: "My orders",
    courses: "My courses",
    recharge: "Recharge wallet",
    logout: "Logout",
  },
  hi: {
    login: "साइन अप",
    dashboard: "ज्योतिषी डैशबोर्ड",
    admin: "एडमिन पैनल",
    consultations: "मेरे परामर्श",
    bookings: "मेरी बुकिंग",
    orders: "मेरे ऑर्डर",
    courses: "मेरे कोर्स",
    recharge: "वॉलेट रिचार्ज",
    logout: "लॉगआउट",
  },
};

/** Login / Register when signed out; dashboard link, wallet balance and logout when signed in. */
export function AccountButton({ lang: langProp }: { lang?: Lang }) {
  const urlLang = useLang();
  const lang = langProp ?? urlLang;
  const { status, me, logout } = useAuth();
  const l = text[lang];

  // while the session is being checked, show a placeholder instead of flashing "Sign In"
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3" aria-hidden>
        <Skel className="h-8 w-20 !rounded-full" />
        <Skel className="h-9 w-9 !rounded-full" />
      </div>
    );
  }

  if (!me) {
    // OTP login creates the account on first sign-in, so one button covers sign in and sign up.
    return (
      <Link
        href="/login"
        className="inline-flex shrink-0 items-center justify-center gap-2 border border-brand-saffron px-3 py-1.5 sm:px-5 font-ui text-xs font-medium text-brand-saffron transition-colors hover:bg-brand-saffron hover:text-white"
      >
        <span>{l.login}</span>
        <Chevron />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/consultations" className="hidden items-center text-xs font-semibold text-slate-700 transition-colors hover:text-brand-indigo md:inline-flex">
        {l.consultations}
      </Link>
      <Link
        href="/wallet"
        title={l.recharge}
        className="flex items-center gap-1.5 rounded-full border border-brand-borderLight bg-brand-cream px-3 py-1.5 text-xs font-bold text-brand-indigo shadow-sm transition hover:border-brand-saffron"
      >
        <i className="fa-solid fa-wallet text-brand-saffron" aria-hidden />
        <span>₹{me.walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
        <i className="fa-solid fa-circle-plus ml-0.5 text-xs text-slate-400" aria-hidden />
      </Link>
      <div className="group relative">
        <button
          type="button"
          aria-haspopup="true"
          aria-label={me.name || "Account"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-indigo/20 bg-brand-indigo/10 text-brand-indigo transition-all hover:bg-brand-indigo hover:text-white"
        >
          <i className="fa-regular fa-user text-sm" aria-hidden />
        </button>
        <div className="invisible absolute right-0 top-full z-50 w-52 pt-2 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          <div className="rounded-2xl border border-brand-borderLight bg-white p-2 text-sm shadow-elevated">
            {me.name && <p className="truncate px-3 py-1.5 text-xs font-semibold text-slate-500">{me.name}</p>}
            {(me.roles.includes("admin") || me.roles.includes("editor")) && (
              <Link
                href={me.roles.includes("admin") ? "/admin" : "/admin/horoscope"}
                className="block rounded-xl px-3 py-2 font-semibold text-brand-indigo hover:bg-brand-cream"
              >
                {l.admin}
              </Link>
            )}
            {me.roles.includes("astrologer") && (
              <Link href="/astro-dashboard" className="block rounded-xl px-3 py-2 text-brand-indigo hover:bg-brand-cream">
                {l.dashboard}
              </Link>
            )}
            <Link href="/consultations" className="block rounded-xl px-3 py-2 text-brand-indigo hover:bg-brand-cream">
              {l.consultations}
            </Link>
            <Link href="/bookings" className="block rounded-xl px-3 py-2 text-brand-indigo hover:bg-brand-cream">
              {l.bookings}
            </Link>
            <Link href="/shop/orders" className="block rounded-xl px-3 py-2 text-brand-indigo hover:bg-brand-cream">
              {l.orders}
            </Link>
            <Link href="/shop/my-courses" className="block rounded-xl px-3 py-2 text-brand-indigo hover:bg-brand-cream">
              {l.courses}
            </Link>
            <button type="button" onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50">
              {l.logout}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
