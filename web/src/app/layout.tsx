import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
// Fonts are bundled with the site (no Google Fonts call at build time).
// Poppins: UI text; Mukta: Hindi text; Bodoni Moda: display headings from the Figma home design.
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/mukta/300.css";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/500.css";
import "@fontsource/mukta/600.css";
import "@fontsource/mukta/700.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/500.css";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RouteProgress } from "@/components/ui/RouteProgress";
import { ConfirmHost } from "@/components/ui/Confirm";
import { Toaster } from "@/components/ui/Toaster";
import { Suspense } from "react";
import { brandCssVars, getBrand } from "@/lib/brand";
import { LangProvider } from "@/components/i18n";
import { serverLang } from "@/lib/server-lang";
import { headers } from "next/headers";
import { localePath, splitLang } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const lang = serverLang();
  const { path } = splitLang(headers().get("x-pathname") ?? "/");
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const site = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  const description =
    lang === "hi"
      ? `${brand.name}: चैट या कॉल से सत्यापित ज्योतिषियों से बात करें, मुफ़्त कुंडली, कुंडली मिलान, दैनिक राशिफल और पंचांग।`
      : `${brand.name}: talk to verified astrologers by chat or call, free kundli, kundli matching, daily horoscope and panchang.`;
  return {
    title: { default: `${brand.name} – ${brand.tagline}`, template: `%s | ${brand.name}` },
    description,
    metadataBase: site ? new URL(site) : undefined,
    // tells search engines the two language versions of this page are the same content
    alternates: { languages: { en: `${site}${localePath("en", path)}`, hi: `${site}${localePath("hi", path)}` } },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const brand = await getBrand();
  const lang = serverLang();
  return (
    <html lang={lang} className="scroll-smooth" style={brandCssVars(brand) as CSSProperties}>
      <body className="bg-brand-cream text-brand-textDark antialiased">
        <LangProvider lang={lang}>
          <AuthProvider>
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            <Header brand={brand} />
            <main>{children}</main>
            <Footer brand={brand} />
            <Toaster />
            <ConfirmHost />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
