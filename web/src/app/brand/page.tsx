import type { Metadata } from "next";
import { getBrand } from "@/lib/brand";
import { serverLang } from "@/lib/server-lang";

export const metadata: Metadata = { title: "Brand guide", robots: { index: false } };

// Internal brand guide: shows the active white-label palette, fonts and logos.
export default async function BrandGuidePage() {
  const brand = await getBrand();
  const lang = serverLang();
  const swatches =
    lang === "hi"
      ? [
          { name: "प्राइमरी · कॉस्मिक इंडिगो", hex: brand.colors.primary, use: "हेडर, हीरो, शीर्षक" },
          { name: "प्राइमरी डार्क", hex: brand.colors.primaryDark, use: "फ़ुटर, प्रेस्ड स्टेट" },
          { name: "एक्सेंट · केसरिया", hex: brand.colors.accent, use: "मुख्य बटन, हाइलाइट" },
          { name: "गोल्ड", hex: brand.colors.gold, use: "बैज, बॉर्डर, प्रीमियम" },
          { name: "बैकग्राउंड · क्रीम", hex: brand.colors.background, use: "पेज बैकग्राउंड" },
          { name: "टेक्स्ट", hex: brand.colors.text, use: "बॉडी टेक्स्ट" },
        ]
      : [
          { name: "Primary · Cosmic indigo", hex: brand.colors.primary, use: "Header, hero, headings" },
          { name: "Primary dark", hex: brand.colors.primaryDark, use: "Footer, pressed states" },
          { name: "Accent · Saffron", hex: brand.colors.accent, use: "Main buttons, highlights" },
          { name: "Gold", hex: brand.colors.gold, use: "Badges, borders, premium" },
          { name: "Background · Cream", hex: brand.colors.background, use: "Page background" },
          { name: "Text", hex: brand.colors.text, use: "Body text" },
        ];
  return (
    <div className="container-site py-12">
      <h1 className="text-3xl font-bold text-brand-primary">{lang === "hi" ? `${brand.name} ब्रांड गाइड` : `${brand.name} brand guide`}</h1>
      <p className="mt-2 text-brand-text/70">{brand.tagline}</p>

      <h2 className="mt-10 text-xl font-semibold">{lang === "hi" ? "लोगो" : "Logo"}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <div className="card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt={brand.name} className="h-14" />
        </div>
        <div className="card bg-brand-primary-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoMarkUrl} alt="" className="h-14 w-14" />
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">{lang === "hi" ? "रंग" : "Colours"}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {swatches.map((s) => (
          <div key={s.name} className="card p-0">
            <div className="h-20 rounded-t-card border-b border-black/5" style={{ background: s.hex }} />
            <div className="p-3 text-sm">
              <p className="font-semibold">{s.name}</p>
              <p className="font-mono">{s.hex}</p>
              <p className="text-brand-text/60">{s.use}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">{lang === "hi" ? "टाइपोग्राफी" : "Typography"}</h2>
      <div className="card mt-4 space-y-2">
        <p className="font-heading text-2xl font-semibold">
          {brand.fonts.heading} — {lang === "hi" ? "शीर्षक · Headings" : "Headings · शीर्षक"}
        </p>
        <p className="font-body text-lg">
          {brand.fonts.body} — {lang === "hi" ? "अंग्रेज़ी और हिन्दी में बॉडी टेक्स्ट" : "Body text in English and हिन्दी"}
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        <button className="btn-primary">{lang === "hi" ? "प्राइमरी बटन" : "Primary button"}</button>
        <button className="btn-outline">{lang === "hi" ? "आउटलाइन बटन" : "Outline button"}</button>
      </div>
    </div>
  );
}
