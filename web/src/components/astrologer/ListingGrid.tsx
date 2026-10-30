"use client";

import { useState } from "react";
import { api, type AstrologerCard, type Master, type Paged } from "@/lib/api";
import { ListingCard } from "./ListingCard";
import { Spinner } from "@/components/ui/Button";

/** Grid with "View more" that appends the next page using the same filters. */
export function ListingGrid({ initial, query, master }: { initial: Paged<AstrologerCard>; query: string; master: Master | null }) {
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);

  const more = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(query);
      qs.set("page", String(page + 1));
      const r = await api<Paged<AstrologerCard>>(`/astrologers?${qs}`);
      setItems((x) => [...x, ...r.items.filter((n) => !x.some((o) => o.id === n.id))]);
      setPage(r.page);
      setHasMore(r.hasMore);
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(initial.total - items.length, 0);
  return (
    <>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a, i) => (
          <ListingCard key={a.id} a={a} master={master} index={i} />
        ))}
      </section>
      <div className="mt-10 flex flex-col items-center justify-center">
        {hasMore && (
          <button
            type="button"
            onClick={more}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border-2 border-brand-indigo px-8 py-3 font-heading text-sm font-semibold text-brand-indigo shadow-sm transition duration-200 hover:bg-brand-indigo hover:text-white disabled:opacity-60"
          >
            <span>{loading ? "Loading more…" : `View More Astrologers (${remaining} remaining)`}</span>
            {loading ? <Spinner className="text-xs" /> : <i className="fa-solid fa-arrow-down text-xs" aria-hidden />}
          </button>
        )}
        <p className="mt-2 text-xs font-medium text-slate-400">All consultations are private. Astrologers never see your phone number.</p>
      </div>
    </>
  );
}
