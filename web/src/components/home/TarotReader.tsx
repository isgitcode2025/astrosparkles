"use client";

import { Link } from "@/components/i18n";
import { useEffect, useState } from "react";
import { homeCopy } from "./copy";
import { CARD_BACK_ICONS, MAJOR_ARCANA, type TarotCard } from "./tarot-deck";

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Free 3-card tarot: pick three of eight face-down cards for Past, Present and Future. */
export function TarotReader({ lang }: { lang: "en" | "hi" }) {
  const c = homeCopy(lang);
  // the deck is shuffled in the browser only, so server and client render the same face-down cards
  const [deck, setDeck] = useState<TarotCard[]>(MAJOR_ARCANA.slice(0, 8));
  const [picked, setPicked] = useState<number[]>([]);
  useEffect(() => setDeck(shuffle(MAJOR_ARCANA).slice(0, 8)), []);

  const pick = (i: number) => {
    if (picked.includes(i) || picked.length >= 3) return;
    setPicked((p) => [...p, i]);
  };
  const reset = () => {
    setPicked([]);
    setDeck(shuffle(MAJOR_ARCANA).slice(0, 8));
  };
  const done = picked.length === 3;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-gold/30 bg-gradient-to-r from-brand-midnight to-[#31195E] p-8 text-white shadow-xl sm:p-10">
      <div className="relative z-10 mx-auto mb-8 max-w-xl text-center">
        <span className="mb-2 inline-block rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold">{c.tarot.label}</span>
        <h3 className="font-poppins text-2xl font-bold text-white sm:text-3xl">{c.tarot.title}</h3>
        <p className="mt-1 text-xs text-brand-goldLight/80">{c.tarot.text}</p>
        <p className="mt-3 text-sm font-semibold text-brand-saffron" aria-live="polite">
          {c.tarot.pick(picked.length)}
        </p>
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-4">
        {deck.map((card, i) => {
          const order = picked.indexOf(i);
          const chosen = order >= 0;
          return (
            <button
              key={`${card.name}-${i}`}
              type="button"
              onClick={() => pick(i)}
              disabled={done && !chosen}
              aria-label={chosen ? `${c.tarot.positions[order]}: ${card.name}` : `Card ${i + 1}`}
              className={`tarot-card group flex h-28 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-brand-gold bg-gradient-to-b from-[#201040] to-brand-midnight p-2 shadow-lg sm:h-36 sm:w-20 ${
                chosen ? "-translate-y-3 ring-4 ring-brand-saffron" : ""
              } ${done && !chosen ? "opacity-40" : ""}`}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-brand-gold/60 transition group-hover:bg-brand-saffron/10">
                {chosen ? (
                  <>
                    <i className={`fa-solid ${card.icon} text-lg text-brand-saffron`} aria-hidden />
                    <span className="mt-1 px-0.5 text-center text-[9px] font-semibold leading-tight text-brand-goldLight">{c.tarot.positions[order]}</span>
                  </>
                ) : (
                  <i className={`fa-solid ${CARD_BACK_ICONS[i % CARD_BACK_ICONS.length]} text-lg text-brand-gold transition-transform group-hover:scale-125`} aria-hidden />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {picked.length > 0 && (
        <div className="relative z-10 mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
          {picked.map((i, order) => {
            const card = deck[i];
            return (
              <div key={i} className="rounded-2xl border border-brand-gold/30 bg-white/5 p-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">{c.tarot.positions[order]}</p>
                <p className="mt-1 font-poppins text-sm font-bold text-white">
                  <i className={`fa-solid ${card.icon} mr-2 text-brand-saffron`} aria-hidden />
                  {lang === "hi" ? card.nameHi : card.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-brand-goldLight/85">{lang === "hi" ? card.hi : card.en}</p>
              </div>
            );
          })}
        </div>
      )}

      {done && (
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-full border border-brand-gold/60 px-5 py-2 text-xs font-semibold text-brand-gold transition hover:bg-brand-gold/10">
            <i className="fa-solid fa-shuffle mr-2" aria-hidden />
            {c.tarot.again}
          </button>
          <Link href="/astrologers?expertise=tarot-reading" className="rounded-full bg-brand-saffron px-5 py-2 text-xs font-semibold text-white transition hover:bg-brand-saffronDark">
            {c.tarot.talk}
          </Link>
        </div>
      )}

      <div className="relative z-10 mt-6 text-center">
        <span className="text-xs font-medium tracking-wide text-brand-gold">{c.tarot.note}</span>
      </div>
    </div>
  );
}
