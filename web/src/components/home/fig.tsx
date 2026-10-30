/**
 * Small drawing pieces shared by the home page, header and footer (Figma "Home Page" design).
 * Raster artwork lives in /public/images/home/fig.
 */

export const FIG = "/images/home/fig";

/** Arrow inside a circle, used for "View All", reading tiles and "Book Pooja" (41x32 in the design). */
export function ArrowCircle({ className = "", width = 41, height = 32 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 41 32" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="25" cy="16" r="15.4" strokeWidth="1" />
      <path d="M0 16h27.6M22.6 10.6 28 16l-5.4 5.4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small filled chevron used inside the hero buttons and the sign-up button. */
export function Chevron({ className = "", dir = "right" }: { className?: string; dir?: "right" | "down" }) {
  if (dir === "down") {
    return (
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
        <path d="m.6.8 3.4 3.2L7.4.8" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="6" height="12" viewBox="0 0 6 12" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <path d="m1 1.2 4 4.8-4 4.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Four-point sparkle that sits on the arch frames. */
export function Sparkle({ size = 13, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M13 0c.9 7.4 5.6 12.1 13 13-7.4.9-12.1 5.6-13 13-.9-7.4-5.6-12.1-13-13 7.4-.9 12.1-5.6 13-13Z" fill="currentColor" />
    </svg>
  );
}

/** Outline star used for the rating and the top bar. */
export function StarOutline({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <path d="m12 2.8 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 2.8Z" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Check mark in a circle ("Private & confidential"). */
export function CheckCircle({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <path d="M21 12a9 9 0 1 1-4.2-7.6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 11.5 3 3L21 4.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Gift outline (welcome offer chip). */
export function Gift({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <path
        d="M3.5 8.5h17v4h-17zM5 12.5V21h14v-8.5M12 8.5V21M12 8.5S10.7 3 7.8 3.8C5.6 4.4 6.4 8.5 12 8.5ZM12 8.5S13.3 3 16.2 3.8c2.2.6 1.4 4.7-4.2 4.7Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Plus / minus in a circle for the FAQ. */
export function PlusMinus({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="12" cy="12" r="11.4" strokeWidth="1.1" />
      <path d={open ? "M6.5 12h11" : "M6.5 12h11M12 6.5v11"} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Section heading used across the page: serif title, grey line under it, optional link with the arrow. */
export function SectionHead({
  title,
  text,
  action,
  center = false,
  eyebrow,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
  center?: boolean;
  eyebrow?: string;
}) {
  if (center) {
    return (
      <div className="mx-auto flex max-w-[760px] flex-col items-center gap-2 text-center">
        {eyebrow && <p className="font-ui text-xs uppercase text-brand-saffron">{eyebrow}</p>}
        <h2 className="font-display text-[30px] font-medium capitalize leading-tight text-fig-ink sm:text-[38px]">{title}</h2>
        <p className="font-ui text-sm text-fig-muted">{text}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex max-w-[532px] flex-col gap-2">
        <h2 className="font-display text-[30px] font-medium capitalize leading-tight text-fig-ink sm:text-[38px]">{title}</h2>
        <p className="font-ui text-sm text-fig-muted">{text}</p>
      </div>
      {action}
    </div>
  );
}
