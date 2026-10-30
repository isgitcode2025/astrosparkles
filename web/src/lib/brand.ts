export type Brand = {
  name: string;
  tagline: string;
  logoUrl: string;
  logoMarkUrl: string;
  colors: {
    primary: string;
    primaryDark: string;
    accent: string;
    gold: string;
    background: string;
    text: string;
  };
  fonts: { heading: string; body: string };
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  languages: string[];
  defaultLanguage: string;
  currency: string;
  shortTagline: string;
  announcement: string;
  announcementLabel: string;
  appLinks: { android: string; ios: string };
  social: { facebook: string; instagram: string; youtube: string; x: string };
};

/** Used when the API is not reachable (e.g. first local run before the API starts). */
export const defaultBrand: Brand = {
  name: "AstroSparkles",
  tagline: "Vedic astrology, kundli and live consultations",
  logoUrl: "/brand/logo.svg",
  logoMarkUrl: "/brand/logo-mark.svg",
  colors: {
    primary: "#3B1F6E",
    primaryDark: "#24124A",
    accent: "#E8912D",
    gold: "#D4A93C",
    background: "#FFF9F0",
    text: "#1E1630",
  },
  fonts: { heading: "Poppins", body: "Mukta" },
  supportEmail: "support@example.com",
  supportPhone: "",
  whatsapp: "",
  languages: ["en", "hi"],
  defaultLanguage: "en",
  currency: "INR",
  shortTagline: "Vedic Astrology & Live Consultations",
  announcement: "",
  announcementLabel: "",
  appLinks: { android: "", ios: "" },
  social: { facebook: "", instagram: "", youtube: "", x: "" },
};

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * The browser reaches the API at the public URL (localhost:4000 on your PC).
 * The Next.js server inside Docker cannot use "localhost" (that is its own container),
 * so server-side requests use API_INTERNAL_URL (http://api:4000/api/v1 in docker-compose).
 */
export const API_URL =
  typeof window === "undefined" ? process.env.API_INTERNAL_URL || PUBLIC_API_URL : PUBLIC_API_URL;

/** Loads white-label settings from the API; cached for 5 minutes. */
export async function getBrand(): Promise<Brand> {
  try {
    const res = await fetch(`${API_URL}/config/brand`, { next: { revalidate: 300 } });
    if (!res.ok) return defaultBrand;
    const json = (await res.json()) as { success: boolean; data: Brand };
    return json.success ? { ...defaultBrand, ...json.data } : defaultBrand;
  } catch {
    return defaultBrand;
  }
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB | null {
  const m = hex.trim().replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

/** Linear mix of two colours; t = share of the second colour. */
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t)) as RGB;
const channels = (x: RGB) => x.join(" ");

/**
 * CSS variables for the theme. Each colour is exposed as hex (--brand-primary) and as
 * "R G B" channels (--brand-primary-rgb) which Tailwind needs for opacity modifiers.
 * Hover / light / border tints are derived so a reseller only sets the main colours.
 */
export function brandCssVars(brand: Brand): Record<string, string> {
  const vars: Record<string, string> = {};
  const set = (name: string, hex: string, fallback: RGB) => {
    const rgb = hexToRgb(hex) ?? fallback;
    vars[`--brand-${name}`] = `rgb(${rgb.join(",")})`;
    vars[`--brand-${name}-rgb`] = channels(rgb);
    return rgb;
  };
  const primary = set("primary", brand.colors.primary, [59, 31, 110]);
  set("primary-dark", brand.colors.primaryDark, [36, 18, 74]);
  const accent = set("accent", brand.colors.accent, [232, 145, 45]);
  const gold = set("gold", brand.colors.gold, [212, 169, 60]);
  const bg = set("bg", brand.colors.background, [255, 249, 240]);
  set("text", brand.colors.text, [30, 22, 48]);
  vars["--brand-accent-dark-rgb"] = channels(mix(accent, [0, 0, 0], 0.1));
  vars["--brand-gold-light-rgb"] = channels(mix(gold, [255, 255, 255], 0.7));
  vars["--brand-border-rgb"] = channels(mix(mix(bg, gold, 0.15), primary, 0.04));
  return vars;
}
