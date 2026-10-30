/**
 * Shimmer placeholders shown while content loads. They copy the shape of the real
 * content so nothing jumps when it arrives. Screen readers hear one "Loading" label.
 */
export function Skel({ className = "", dark = false, style }: { className?: string; dark?: boolean; style?: React.CSSProperties }) {
  return <span aria-hidden style={style} className={`shimmer block rounded-lg ${dark ? "shimmer-dark" : ""} ${className}`} />;
}

/** Wraps a group of placeholders and announces loading once. */
export function Loading({ label = "Loading", children, className = "" }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

export function SkelText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <span className={`block space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skel key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </span>
  );
}

export function SkelAvatar({ size = "h-12 w-12", dark = false }: { size?: string; dark?: boolean }) {
  return <Skel dark={dark} className={`${size} shrink-0 !rounded-full`} />;
}

/** A white card with a title bar and a few text lines. */
export function SkelCard({ lines = 3, className = "", image = false }: { lines?: number; className?: string; image?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-brand-border bg-white shadow-soft ${className}`}>
      {image && <Skel className="h-40 w-full !rounded-none" />}
      <div className="space-y-3 p-5">
        <Skel className="h-4 w-1/2" />
        <SkelText lines={lines} />
      </div>
    </div>
  );
}

/** Astrologer card placeholder (listing and home). */
export function SkelAstrologer() {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-soft">
      <div className="flex gap-3">
        <SkelAvatar size="h-16 w-16" />
        <div className="flex-1 space-y-2 pt-1">
          <Skel className="h-4 w-3/4" />
          <Skel className="h-3 w-1/2" />
          <Skel className="h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skel className="h-5 w-16" />
        <div className="flex gap-2">
          <Skel className="h-8 w-16 !rounded-full" />
          <Skel className="h-8 w-16 !rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Stat tile placeholder (dashboards). */
export function SkelStat() {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
      <Skel className="h-3 w-24" />
      <Skel className="mt-3 h-7 w-28" />
      <Skel className="mt-2 h-3 w-32" />
    </div>
  );
}

/** List of row placeholders (orders, bookings, consultations). */
export function SkelRows({ rows = 4, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
          {avatar && <SkelAvatar />}
          <div className="flex-1 space-y-2">
            <Skel className="h-4 w-1/3" />
            <Skel className="h-3 w-1/2" />
          </div>
          <Skel className="h-8 w-20 !rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Table body placeholder (admin). */
export function SkelTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-brand-border">
      <div className="flex gap-4 bg-brand-cream/60 px-4 py-3">
        {Array.from({ length: cols }, (_, c) => (
          <Skel key={c} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }, (_, c) => (
            <Skel key={c} className={`h-3.5 flex-1 ${c === 0 ? "max-w-[220px]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Indigo hero band placeholder, same size as ToolHero. */
export function SkelHero({ pad = "pb-24" }: { pad?: string }) {
  return (
    <div className={`bg-gradient-to-br from-brand-indigo via-[#2d1a63] to-brand-midnight pt-10 ${pad}`}>
      <div className="container-site space-y-4">
        <Skel dark className="h-3 w-32" />
        <Skel dark className="h-10 w-2/3 max-w-xl" />
        <Skel dark className="h-4 w-1/2 max-w-md" />
      </div>
    </div>
  );
}

/** Placeholder for an account page: title, subtitle and the account tabs, then `children`. */
export function SkelAccount({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <Loading className={`mx-auto ${wide ? "max-w-6xl" : "max-w-5xl"} px-4 pb-16 pt-8 sm:px-6 lg:px-8`}>
      <Skel className="h-9 w-56" />
      <Skel className="mt-3 h-4 w-80 max-w-full" />
      <div className="mb-6 mt-7 flex gap-2 overflow-hidden">
        {[110, 96, 84, 80, 90].map((w, i) => (
          <Skel key={i} className="h-9 shrink-0 !rounded-full" style={{ width: w }} />
        ))}
      </div>
      {children}
    </Loading>
  );
}
