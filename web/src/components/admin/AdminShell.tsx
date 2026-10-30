"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading, Skel, SkelStat } from "@/components/ui/Skeleton";

type NavItem = { href: string; label: string; icon: string; editor?: boolean };
const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "fa-gauge-high" },
  { href: "/admin/astrologers", label: "Astrologers", icon: "fa-user-tie" },
  { href: "/admin/users", label: "Users", icon: "fa-users" },
  { href: "/admin/consultations", label: "Consultations", icon: "fa-comments" },
  { href: "/admin/bookings", label: "Bookings", icon: "fa-calendar-check" },
  { href: "/admin/payments", label: "Payments & ledger", icon: "fa-indian-rupee-sign" },
  { href: "/admin/shop", label: "Poojas & courses", icon: "fa-om" },
  { href: "/admin/reviews", label: "Reviews", icon: "fa-star" },
  { href: "/admin/horoscope", label: "Horoscope", icon: "fa-sun", editor: true },
  { href: "/admin/subscribers", label: "Subscribers", icon: "fa-envelope-open-text" },
];

/** The signed-in admin or editor (always set inside the admin pages). */
export const useAdminMe = () => useAuth().me;

/** Admin frame: checks the signed-in user's role and shows the side navigation. Editors only see the horoscope editor. */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const { status, me, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isAdmin = !!me?.roles.includes("admin");
  const isStaff = isAdmin || !!me?.roles.includes("editor");
  const items = NAV.filter((n) => isAdmin || n.editor);
  const editorOnlyHere = status === "ready" && isStaff && !isAdmin && !pathname.startsWith("/admin/horoscope");

  // signed out (logout in this or another tab, expired or blocked): leave the admin area at once
  useEffect(() => {
    if (status !== "guest") return;
    let reason: string | null = null;
    try {
      reason = window.sessionStorage.getItem("kj_signout_reason");
    } catch {
      /* ignore */
    }
    router.replace(reason === "logout" ? "/" : `/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  useEffect(() => {
    if (editorOnlyHere) router.replace("/admin/horoscope");
  }, [editorOnlyHere, router]);

  if (status === "loading" || status === "guest") return <AdminSkeleton />;
  if (status === "error")
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Could not check your account" onRetry={refresh} />
      </div>
    );
  if (!isStaff)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-brand-cream/40 p-6">
        <div className="max-w-md rounded-2xl border border-brand-border bg-white p-8 text-center shadow-soft">
          <i className="fa-solid fa-lock mb-3 text-2xl text-brand-saffron" aria-hidden />
          <p className="font-heading text-lg font-bold text-brand-indigo">Admins only</p>
          <p className="mt-1 text-sm text-slate-600">Your account does not have access to the admin panel. Sign in with an admin account.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-saffron hover:underline">
            Back to the site
          </Link>
        </div>
      </div>
    );

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#fbf7f2]">
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 w-64 shrink-0 overflow-y-auto border-r border-brand-border bg-white px-3 py-5 transition-transform lg:sticky lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${
            open ? "translate-x-0 shadow-elevated" : "-translate-x-full"
          }`}
        >
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Manage</p>
          <nav className="space-y-0.5">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(n.href) ? "bg-brand-indigo text-white shadow-sm" : "text-slate-600 hover:bg-brand-cream hover:text-brand-indigo"
                }`}
              >
                <i className={`fa-solid ${n.icon} w-4 text-center text-xs ${isActive(n.href) ? "text-brand-gold" : "text-slate-400"}`} aria-hidden />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 rounded-xl bg-brand-cream/70 p-3 text-xs text-slate-600">
            Signed in as <strong className="text-brand-indigo">{me?.name || me?.phone}</strong>
            <br />
            Role: {isAdmin ? "Admin" : "Editor"}
          </div>
        </aside>
        {open && <div className="fixed inset-0 top-16 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setOpen(true)} className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-indigo lg:hidden">
            <i className="fa-solid fa-bars" aria-hidden /> Menu
          </button>
          {editorOnlyHere ? null : <div key={me?.id}>{children}</div>}
        </main>
      </div>
    </>
  );
}

function AdminSkeleton() {
  return (
    <Loading label="Opening the admin panel" className="flex min-h-[calc(100vh-4rem)] bg-[#fbf7f2]">
      <div className="hidden w-64 shrink-0 space-y-2 border-r border-brand-border bg-white px-3 py-5 lg:block">
        {Array.from({ length: 10 }, (_, i) => (
          <Skel key={i} className="h-9 w-full !rounded-xl" />
        ))}
      </div>
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skel className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkelStat key={i} />
          ))}
        </div>
        <Skel className="h-64 w-full !rounded-2xl" />
      </div>
    </Loading>
  );
}
