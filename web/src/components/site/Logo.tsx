import { Link } from "@/components/i18n";
import type { Brand } from "@/lib/brand";

/** "AstroSparkles" -> ["Astro", "Sparkles"]: the second word is shown in the accent colour. */
export function splitName(name: string): [string, string] {
  const i = name.search(/(?<=[a-z])[A-Z]/);
  if (i > 0) return [name.slice(0, i), name.slice(i)];
  const sp = name.lastIndexOf(" ");
  return sp > 0 ? [name.slice(0, sp + 1), name.slice(sp + 1)] : [name, ""];
}

export function Logo({ brand, dark = false, href = "/" }: { brand: Brand; dark?: boolean; href?: string }) {
  const [a, b] = splitName(brand.name);
  return (
    <Link href={href} className="group flex shrink-0 items-center gap-2 sm:gap-3" aria-label={brand.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brand.logoMarkUrl} alt="" className="h-10 w-10 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11" />
      <span className="flex flex-col">
        <span className={`font-poppins text-xl font-bold sm:text-2xl leading-none tracking-tight ${dark ? "text-white" : "text-brand-indigo"}`}>
          {a}
          <span className="text-brand-saffron">{b}</span>
        </span>
        {!dark && brand.shortTagline && (
          <span className="mt-1 hidden whitespace-nowrap text-[9px] font-medium uppercase tracking-widest text-brand-indigo/80 sm:block">
            {brand.shortTagline}
          </span>
        )}
      </span>
    </Link>
  );
}

const DEFAULT_MARK = "/brand/logo-mark.svg";

/**
 * Logo from the Figma home design: line-art mark, serif name (second word in the accent colour)
 * and the small tagline. A reseller's own mark (brand settings) replaces the default artwork.
 */
export function FigLogo({ brand, href = "/", light = false }: { brand: Brand; href?: string; light?: boolean }) {
  const [a, b] = splitName(brand.name);
  const mark =
    brand.logoMarkUrl && brand.logoMarkUrl !== DEFAULT_MARK ? brand.logoMarkUrl : light ? "/images/home/fig/mark-white.png" : "/images/home/fig/mark-color.png";
  return (
    <Link href={href} className="group flex shrink-0 items-center gap-[7px]" aria-label={brand.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mark} alt="" width={light ? 60 : 40} height={light ? 60 : 40} className={light ? "h-[60px] w-[60px]" : "h-8 w-8 sm:h-10 sm:w-10"} />
      <span className="flex flex-col items-stretch">
        <span
          className={`whitespace-nowrap font-display font-medium leading-none ${light ? "text-[32px] text-white sm:text-[40px]" : "text-[21px] text-brand-dark sm:text-[27px]"}`}
        >
          {a}
          <span className={light ? "" : "text-brand-saffron"}>{b}</span>
        </span>
        {brand.shortTagline && (
          <span
            className={`mt-[3px] whitespace-nowrap border-t pt-[2px] text-center font-ui font-medium uppercase ${
              light
                ? "border-white/60 text-[8px] tracking-[0.14em] text-white"
                : "hidden border-brand-dark/60 text-[5.6px] tracking-[0.12em] text-brand-saffron sm:block"
            }`}
          >
            {brand.shortTagline}
          </span>
        )}
      </span>
    </Link>
  );
}
