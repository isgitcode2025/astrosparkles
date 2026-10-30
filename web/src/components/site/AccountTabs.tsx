"use client";

import { Link } from "@/components/i18n";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/consultations", label: "Consultations", icon: "fa-comments" },
  { href: "/bookings", label: "Bookings", icon: "fa-calendar-check" },
  { href: "/wallet", label: "Wallet", icon: "fa-wallet" },
  { href: "/shop/orders", label: "Orders", icon: "fa-bag-shopping" },
  { href: "/shop/my-courses", label: "Courses", icon: "fa-graduation-cap" },
];

/** Tabs that link the signed-in user's own pages. */
export function AccountTabs() {
  const path = usePathname();
  return (
    <nav aria-label="My account" className="thin-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "border-brand-indigo bg-brand-indigo text-white shadow-sm" : "border-brand-border bg-white text-slate-600 hover:border-brand-saffron hover:text-brand-saffron"
            }`}
          >
            <i className={`fa-solid ${t.icon} text-xs`} aria-hidden />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
