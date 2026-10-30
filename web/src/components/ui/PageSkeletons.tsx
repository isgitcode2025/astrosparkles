import { Loading, Skel, SkelAstrologer, SkelAvatar, SkelCard, SkelHero, SkelText } from "./Skeleton";

/** Home page: hero, quick links and the astrologer grid. */
export function HomeSkeleton() {
  return (
    <Loading label="Loading the home page">
      <div className="bg-gradient-to-b from-[#fff7ec] to-brand-cream">
        <div className="container-site grid items-center gap-10 py-12 lg:grid-cols-2">
          <div className="space-y-4">
            <Skel className="h-6 w-48 !rounded-full" />
            <Skel className="h-12 w-4/5" />
            <Skel className="h-12 w-3/5" />
            <SkelText lines={2} className="max-w-lg" />
            <div className="flex gap-3 pt-2">
              <Skel className="h-12 w-44 !rounded-full" />
              <Skel className="h-12 w-36 !rounded-full" />
            </div>
          </div>
          <Skel className="hidden h-80 w-full !rounded-3xl lg:block" />
        </div>
        <div className="container-site grid grid-cols-2 gap-3 pb-8 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} className="h-16 !rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="container-site py-10">
        <Skel className="h-7 w-64" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkelAstrologer key={i} />
          ))}
        </div>
      </div>
    </Loading>
  );
}

/** Astrologer listing: title, filter chips and the card grid. */
export function ListingSkeleton() {
  return (
    <Loading label="Loading astrologers" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Skel className="h-9 w-72 max-w-full" />
      <Skel className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-7 flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <Skel key={i} className="h-9 w-28 shrink-0 !rounded-full" />
        ))}
      </div>
      <div className="mt-3 flex gap-2 overflow-hidden">
        {Array.from({ length: 9 }, (_, i) => (
          <Skel key={i} className="h-8 w-24 shrink-0 !rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <SkelAstrologer key={i} />
        ))}
      </div>
    </Loading>
  );
}

/** Astrologer profile: profile card, about, reviews and the fee card. */
export function ProfileSkeleton() {
  return (
    <Loading label="Loading the profile" className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Skel className="h-3 w-64" />
      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex gap-6 rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
            <SkelAvatar size="h-32 w-32" />
            <div className="flex-1 space-y-3 pt-2">
              <Skel className="h-8 w-2/3" />
              <Skel className="h-4 w-1/3" />
              <Skel className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skel className="h-7 w-24 !rounded-full" />
                <Skel className="h-7 w-24 !rounded-full" />
              </div>
            </div>
          </div>
          <SkelCard lines={4} />
          <SkelCard lines={6} />
        </div>
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
            <Skel className="h-3 w-32" />
            <Skel className="h-9 w-36" />
            <Skel className="h-10 w-full !rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skel className="h-12 !rounded-xl" />
              <Skel className="h-12 !rounded-xl" />
            </div>
            <Skel className="h-12 w-full !rounded-xl" />
          </div>
          <SkelCard lines={5} />
        </div>
      </div>
    </Loading>
  );
}

/** Indigo hero with a grid of cards (horoscope, shop). */
export function HeroGridSkeleton({ cards = 6, image = false }: { cards?: number; image?: boolean }) {
  return (
    <Loading label="Loading">
      <SkelHero />
      <div className="container-site relative -mt-14 grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <SkelCard key={i} lines={3} image={image} />
        ))}
      </div>
    </Loading>
  );
}

/** Indigo hero with an article and a side column (horoscope sign, product page). */
export function HeroArticleSkeleton({ image = false }: { image?: boolean }) {
  return (
    <Loading label="Loading">
      {image ? <div className="container-site pt-8" /> : <SkelHero />}
      <div className={`container-site relative grid items-start gap-6 pb-16 lg:grid-cols-3 ${image ? "" : "-mt-14"}`}>
        <div className="space-y-6 lg:col-span-2">
          <SkelCard lines={7} image={image} />
          <SkelCard lines={4} />
        </div>
        <SkelCard lines={5} />
      </div>
    </Loading>
  );
}
