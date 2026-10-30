"use client";

import { Loading as SkelLoading, Skel, SkelAvatar, SkelText } from "@/components/ui/Skeleton";

import { useState } from "react";
import { api, type AstrologerReviews, type PublicReviewItem } from "@/lib/api";
import { Spinner } from "@/components/ui/Button";
import type { Lang } from "@/lib/i18n";

type Filter = "reviews" | "all" | "5";
const TABS: Record<Lang, [Filter, string][]> = {
  en: [
    ["reviews", "Reviews"],
    ["all", "All ratings"],
    ["5", "5 stars"],
  ],
  hi: [
    ["reviews", "समीक्षाएं"],
    ["all", "सभी रेटिंग्स"],
    ["5", "5 स्टार"],
  ],
};
const TONES = ["bg-purple-100 text-purple-700", "bg-amber-100 text-amber-800", "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700"];
const MODE: Record<string, string> = { chat: "Chat", call: "Call", video: "Video call" };
const MODE_HI: Record<string, string> = { chat: "चैट", call: "कॉल", video: "वीडियो कॉल" };

function Stars({ n }: { n: number }) {
  return (
    <div className="flex text-sm text-amber-400" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`fa-${i <= n ? "solid" : "regular"} fa-star text-xs`} aria-hidden />
      ))}
    </div>
  );
}

/** Reviews list with filter tabs, astrologer replies and Load more. Only verified consultations can be reviewed. */
export function ReviewsPanel({
  astrologerId,
  name,
  avatarUrl,
  initial,
  lang = "en",
}: {
  astrologerId: string;
  name: string;
  avatarUrl: string | null;
  initial: AstrologerReviews | null;
  lang?: Lang;
}) {
  const hi = lang === "hi";
  const [filter, setFilter] = useState<Filter>("reviews");
  const [data, setData] = useState<{ items: PublicReviewItem[]; page: number; hasMore: boolean; total: number }>({
    items: initial?.items ?? [],
    page: 1,
    hasMore: initial?.hasMore ?? false,
    total: initial?.total ?? 0,
  });
  const [loading, setLoading] = useState(false);

  const load = async (f: Filter, page: number) => {
    setLoading(true);
    try {
      const r = await api<AstrologerReviews>(`/consultations/reviews/astrologer/${astrologerId}?filter=${f}&page=${page}&limit=5`);
      setData((d) => ({ items: page === 1 ? r.items : [...d.items, ...r.items], page, hasMore: r.hasMore, total: r.total }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" id="reviews">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-100 pb-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-lg font-bold text-brand-dark">{hi ? "रेटिंग और समीक्षाएं" : "Rating & Reviews"}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
            <i className="fa-solid fa-circle-check text-emerald-600" aria-hidden />
            {hi ? "केवल सत्यापित परामर्शकों द्वारा" : "By verified consultees only"}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1 text-xs font-semibold" role="tablist">
          {TABS[lang].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => {
                setFilter(key);
                load(key, 1);
              }}
              className={`rounded px-3 py-1 uppercase ${filter === key ? "bg-white text-brand-dark shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && data.items.length === 0 ? (
        <SkelLoading label={hi ? "समीक्षाएं लोड हो रही हैं" : "Loading reviews"} className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <SkelAvatar size="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skel className="h-3.5 w-40" />
                <SkelText lines={2} />
              </div>
            </div>
          ))}
        </SkelLoading>
      ) : data.items.length === 0 ? (
        <p className="rounded-xl bg-brand-cream p-4 text-sm text-stone-600">
          {filter === "reviews"
            ? hi
              ? "अभी तक कोई लिखित समीक्षा नहीं। परामर्श पूरा होने के बाद समीक्षाएं यहां दिखेंगी।"
              : "No written reviews yet. Reviews appear here after completed consultations."
            : hi
              ? "इस फ़िल्टर में अभी तक कोई रेटिंग नहीं।"
              : "No ratings in this filter yet."}
        </p>
      ) : (
        <div className="space-y-6">
          {data.items.map((r, i) => (
            <article key={r.id} className={`space-y-3 ${i < data.items.length - 1 ? "border-b border-stone-100 pb-5" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${TONES[i % TONES.length]}`}>{r.name[0]}</div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">{r.name}</h4>
                    <span className="text-[11px] text-stone-400">
                      {hi ? "माध्यम" : "Via"} {(hi ? MODE_HI : MODE)[r.mode] ?? r.mode} • {new Date(r.createdAt).toLocaleDateString(hi ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <Stars n={r.rating} />
              </div>
              {r.comment && <p className="text-sm leading-relaxed text-stone-600">{r.comment}</p>}
              {r.reply && (
                <div className="ml-4 space-y-1 rounded-r-xl border-l-2 border-brand-saffron bg-[#FEFBF6] p-3 pl-4">
                  <div className="flex items-center gap-2">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <i className="fa-solid fa-user-astronaut text-xs text-brand-saffron" aria-hidden />
                    )}
                    <span className="text-xs font-bold text-brand-dark">{name} {hi ? "ने जवाब दिया:" : "replied:"}</span>
                  </div>
                  <p className="text-xs italic text-stone-600">{r.reply}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {data.hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(filter, data.page + 1)}
            className="rounded-full border border-stone-200 px-6 py-2 font-heading text-xs font-bold uppercase tracking-wider text-brand-dark transition-colors hover:border-brand-saffron hover:text-brand-saffron disabled:opacity-60"
          >
            {loading && <Spinner className="mr-2" />}
            {loading ? (hi ? "लोड हो रहा है…" : "Loading more…") : hi ? `और देखें (${data.total - data.items.length} शेष)` : `View more (${data.total - data.items.length} left)`}
          </button>
        </div>
      )}
    </section>
  );
}
