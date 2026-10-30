import { Link } from "@/components/i18n";
import type { AstrologerCard, Master } from "@/lib/api";

const presenceStyle = {
  online: { dot: "bg-green-500", label: "Online" },
  busy: { dot: "bg-amber-500", label: "Busy" },
  offline: { dot: "bg-gray-400", label: "Offline" },
};

export function Price({ base, offer }: { base: number; offer?: number }) {
  if (offer !== undefined && offer < base) {
    return (
      <span>
        <span className="mr-1 text-xs text-brand-text/40 line-through">₹{base}</span>
        <span className="font-semibold">₹{offer}/min</span>
      </span>
    );
  }
  return <span className="font-semibold">₹{base}/min</span>;
}

export function Avatar({ name, url, size = 64 }: { name: string; url: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-brand-primary font-semibold text-brand-gold"
      style={{ width: size, height: size, fontSize: size / 3 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function AstrologerCardView({ a, master }: { a: AstrologerCard; master: Master }) {
  const p = presenceStyle[a.presence];
  const skill = (slug: string) => master.expertise.find((e) => e.slug === slug)?.en ?? slug;
  const lang = (code: string) => master.languages.find((l) => l.code === code)?.en ?? code;
  const available = a.presence === "online";

  return (
    <div className="card flex flex-col gap-3">
      <Link href={`/astrologer/${a.slug}`} className="flex gap-3">
        <div className="relative shrink-0">
          <Avatar name={a.displayName} url={a.avatarUrl} />
          <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${p.dot}`} title={p.label} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate font-semibold">{a.displayName}</h3>
            {a.badges.map((b) => (
              <span key={b} className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-primary">
                {b.replace("-", " ")}
              </span>
            ))}
          </div>
          <p className="truncate text-sm text-brand-text/70">{a.expertise.map(skill).join(", ")}</p>
          <p className="text-sm text-brand-text/60">
            {a.languages.map(lang).join(", ")} · {a.experienceYears} yrs
          </p>
          <p className="text-sm">
            {a.rating.count > 0 ? (
              <>
                <span className="text-brand-accent">★</span> {a.rating.average.toFixed(1)}{" "}
                <span className="text-brand-text/50">({a.rating.count})</span>
              </>
            ) : (
              <span className="text-brand-text/50">No reviews yet</span>
            )}
          </p>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/5 pt-3 text-sm">
        <Price base={a.rates.chat} offer={a.rates.chatOffer} />
        <div className="flex gap-2">
          {a.rates.chat > 0 && (
            <Link
              href={`/astrologer/${a.slug}?start=chat`}
              aria-disabled={!available}
              className={available ? "btn-primary px-4 py-1.5 text-sm" : "btn-outline pointer-events-none px-4 py-1.5 text-sm opacity-50"}
            >
              Chat
            </Link>
          )}
          {a.rates.call > 0 && (
            <Link
              href={`/astrologer/${a.slug}?start=call`}
              aria-disabled={!available}
              className={available ? "btn-outline px-4 py-1.5 text-sm" : "btn-outline pointer-events-none px-4 py-1.5 text-sm opacity-50"}
            >
              Call
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
