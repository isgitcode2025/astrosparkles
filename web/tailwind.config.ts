import type { Config } from "tailwindcss";

// Colours come from CSS variables set in layout.tsx from the white-label brand config,
// so a reseller changes colours in .env / admin without touching code.
// Variables hold "R G B" channels so opacity modifiers (bg-brand-primary/10) work.
const c = (name: string) => `rgb(var(--brand-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: c("primary"),
          "primary-dark": c("primary-dark"),
          accent: c("accent"),
          "accent-dark": c("accent-dark"),
          gold: c("gold"),
          "gold-light": c("gold-light"),
          bg: c("bg"),
          text: c("text"),
          border: c("border"),
          // names used by the Stitch home page design
          indigo: c("primary"),
          midnight: c("primary-dark"),
          saffron: c("accent"),
          saffronDark: c("accent-dark"),
          goldLight: c("gold-light"),
          cream: c("bg"),
          textDark: c("text"),
          borderCream: c("border"),
          // names used by the updated Stitch home page
          dark: c("primary-dark"),
          saffronHover: c("accent-dark"),
          borderLight: c("border"),
        },
        // fixed neutrals from the Figma home design; accent and dark indigo still come from the brand settings
        fig: {
          ink: "#100d17",
          muted: "#57555c",
          faint: "#abaaae",
          cream: "#fff8ef",
          sand: "#fcf5e9",
          mist: "#f8f7fa",
          night: "#0e0b14",
          green: "#02721a",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-body)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        poppins: ["var(--font-heading)", "var(--font-body)", "system-ui", "sans-serif"],
        mukta: ["var(--font-body)", "system-ui", "sans-serif"],
        // Figma home design: serif display headings + Poppins UI text (Mukta covers Hindi)
        display: ["var(--font-display)", "var(--font-body)", "Georgia", "serif"],
        ui: ["var(--font-heading)", "var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1rem" },
      boxShadow: {
        soft: "0 4px 20px -2px rgb(var(--brand-primary-rgb) / 0.06)",
        hover: "0 10px 25px -4px rgb(var(--brand-primary-rgb) / 0.12)",
        celestial: "0 0 25px rgb(var(--brand-accent-rgb) / 0.25)",
        subtle: "0 4px 20px -2px rgb(var(--brand-primary-rgb) / 0.06)",
        elevated: "0 10px 25px -5px rgb(var(--brand-primary-rgb) / 0.12)",
        goldGlow: "0 0 20px rgb(var(--brand-gold-rgb) / 0.35)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
