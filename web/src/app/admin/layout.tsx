import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { serverLang } from "@/lib/server-lang";
import { splitLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin is English-only: a "/hi/admin..." URL would otherwise render fine but
  // mislabel itself as Hindi (<html lang="hi"> from the root layout), so bounce
  // it to the un-prefixed path.
  if (serverLang() !== "en") {
    const { path } = splitLang(headers().get("x-pathname") ?? "/admin");
    redirect(path);
  }
  return <AdminShell>{children}</AdminShell>;
}
