"use client";

import { Link, useLang } from "@/components/i18n";
import { ProductImage } from "@/components/shop/ProductCardView";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkelAccount, SkelCard } from "@/components/ui/Skeleton";
import { useLoad } from "@/lib/useLoad";
import { api, type ProductCard } from "@/lib/api";
import { AccountTabs } from "@/components/site/AccountTabs";
import { EmptyState, PageHeader } from "@/components/site/PageShell";

type MyCourse = ProductCard & { completed: number; totalLessons: number };

function MyCourses() {
  const lang = useLang();
  const { data: items, error, reload } = useLoad<MyCourse[]>(() => api<MyCourse[]>("/shop/my-courses", { auth: true }));


  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PageHeader
        title={lang === "hi" ? "मेरे कोर्स" : "My courses"}
        subtitle={lang === "hi" ? "जहाँ से छोड़ा था वहीं से जारी रखें।" : "Continue where you left off."}
      />
      <AccountTabs lang={lang} />
      {error ? (
        <ErrorState lang={lang} compact onRetry={reload} />
      ) : !items ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <SkelCard key={i} image lines={1} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="fa-graduation-cap" title={lang === "hi" ? "अभी तक कोई कोर्स नहीं" : "No courses yet"}>
          <Link href="/shop?type=course" className="font-semibold text-brand-saffron hover:underline">
            {lang === "hi" ? "कोर्स देखें" : "See courses"}
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const pct = c.totalLessons ? Math.round((c.completed / c.totalLessons) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/shop/learn/${c.slug}`}
                className="group overflow-hidden rounded-2xl border border-brand-border bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover"
              >
                <ProductImage p={c} className="h-32 w-full" />
                <div className="p-4">
                  <p className="font-heading font-bold text-brand-indigo">{c.title}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-brand-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {lang === "hi" ? (
                      <>
                        {c.totalLessons} में से {c.completed} पाठ पूर्ण
                      </>
                    ) : (
                      <>
                        {c.completed} of {c.totalLessons} lessons done
                      </>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <RequireAuth skeleton={<SkelAccount><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <SkelCard key={i} image lines={1} />)}</div></SkelAccount>}>
      <MyCourses />
    </RequireAuth>
  );
}
