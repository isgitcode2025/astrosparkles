import { Loading, Skel, SkelAccount, SkelCard, SkelStat, SkelText } from "./Skeleton";

export function WalletSkeleton() {
  return (
    <SkelAccount wide>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-midnight p-6">
            <Skel dark className="h-3 w-32" />
            <Skel dark className="mt-3 h-9 w-40" />
            <Skel dark className="mt-3 h-3 w-72 max-w-full" />
          </div>
          <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
            <Skel className="h-5 w-32" />
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skel key={i} className="h-16 !rounded-xl" />
              ))}
            </div>
            <Skel className="mt-5 h-10 w-60 !rounded-xl" />
            <Skel className="mt-5 h-11 w-48 !rounded-full" />
          </div>
        </div>
        <SkelCard lines={6} />
      </div>
    </SkelAccount>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-indigo to-brand-midnight p-6 sm:p-8">
        <Skel dark className="h-16 w-16 !rounded-full" />
        <div className="flex-1 space-y-2">
          <Skel dark className="h-3 w-40" />
          <Skel dark className="h-7 w-72 max-w-full" />
          <Skel dark className="h-3 w-48" />
        </div>
        <Skel dark className="hidden h-10 w-28 !rounded-full sm:block" />
      </div>
      <Skel className="h-10 w-72 !rounded-full" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkelStat key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkelCard lines={4} />
        <SkelCard lines={4} />
      </div>
    </Loading>
  );
}

export function ChatSkeleton() {
  return (
    <Loading label="Connecting to the consultation" className="container-site grid gap-5 py-6 lg:grid-cols-3">
      <div className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-elevated lg:col-span-2">
        <div className="flex items-center gap-3 bg-gradient-to-r from-brand-indigo to-brand-midnight px-5 py-3">
          <Skel dark className="h-10 w-10 !rounded-full" />
          <div className="space-y-1.5">
            <Skel dark className="h-4 w-40" />
            <Skel dark className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 space-y-3 bg-[#fbf7f2] p-5">
          <Skel className="mx-auto h-5 w-64 !rounded-full" />
          <Skel className="h-12 w-2/3 !rounded-2xl" />
          <Skel className="ml-auto h-10 w-1/2 !rounded-2xl" />
          <Skel className="h-14 w-3/5 !rounded-2xl" />
        </div>
        <div className="flex gap-2 border-t border-brand-border p-3">
          <Skel className="h-11 flex-1 !rounded-full" />
          <Skel className="h-11 w-24 !rounded-full" />
        </div>
      </div>
      <div className="hidden space-y-4 lg:block">
        <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
          <Skel className="h-4 w-32" />
          <div className="mt-4 space-y-2">
            <Skel className="h-3 w-full" />
            <Skel className="h-3 w-5/6" />
            <Skel className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </Loading>
  );
}

export function LearnSkeleton() {
  return (
    <Loading label="Loading the course" className="container-site grid gap-6 py-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skel className="h-7 w-2/3" />
        <Skel className="aspect-video w-full !rounded-xl" />
        <SkelText lines={3} />
      </div>
      <div className="space-y-2 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
        {Array.from({ length: 6 }, (_, i) => (
          <Skel key={i} className="h-10 w-full !rounded-xl" />
        ))}
      </div>
    </Loading>
  );
}

/** Account list pages (consultations, bookings, orders). */
export function AccountListSkeleton() {
  return (
    <SkelAccount>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-1/3" />
              <Skel className="h-3 w-1/2" />
            </div>
            <Skel className="h-8 w-20 !rounded-full" />
          </div>
        ))}
      </div>
    </SkelAccount>
  );
}

/** Course grid (my courses). */
export function CourseGridSkeleton() {
  return (
    <SkelAccount>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkelCard key={i} image lines={1} />
        ))}
      </div>
    </SkelAccount>
  );
}

/** Tool pages (kundli, matching, panchang, calculators, join): hero band with a form card over it. */
export function ToolSkeleton({ side = true }: { side?: boolean }) {
  return (
    <Loading label="Loading">
      <div className="bg-gradient-to-br from-brand-indigo via-[#2d1a63] to-brand-midnight pb-24 pt-10">
        <div className="container-site space-y-4">
          <Skel dark className="h-3 w-32" />
          <Skel dark className="h-10 w-2/3 max-w-xl" />
          <Skel dark className="h-4 w-1/2 max-w-md" />
        </div>
      </div>
      <div className={`container-site relative -mt-16 grid items-start gap-6 pb-16 ${side ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-6 shadow-soft">
          <Skel className="h-6 w-40" />
          <Skel className="h-11 w-full !rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skel className="h-11 !rounded-xl" />
            <Skel className="h-11 !rounded-xl" />
          </div>
          <Skel className="h-11 w-full !rounded-xl" />
          <Skel className="h-12 w-full !rounded-full" />
        </div>
        {side && <SkelCard lines={6} />}
      </div>
    </Loading>
  );
}

/** Admin content area (inside the admin frame). */
export function AdminContentSkeleton() {
  return (
    <Loading label="Loading">
      <Skel className="h-8 w-56" />
      <Skel className="mt-2 h-4 w-80 max-w-full" />
      <Skel className="mt-6 h-10 w-80 max-w-full !rounded-full" />
      <div className="mt-4 space-y-3 rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
        {Array.from({ length: 7 }, (_, i) => (
          <Skel key={i} className="h-5 w-full" />
        ))}
      </div>
    </Loading>
  );
}

/** Login and sign-up card. */
export function AuthSkeleton() {
  return (
    <Loading label="Loading" className="flex min-h-[calc(100vh-8.5rem)] items-center bg-[#fef7ff]">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-0 px-4 py-8 md:px-8 lg:grid-cols-12">
        <Skel className="hidden h-[560px] !rounded-l-[2rem] !rounded-r-none lg:col-span-6 lg:block" />
        <div className="space-y-4 rounded-[2rem] bg-white p-10 lg:col-span-6 lg:rounded-l-none">
          <Skel className="h-6 w-40 !rounded-full" />
          <Skel className="h-9 w-3/4" />
          <SkelText lines={2} />
          <Skel className="mt-6 h-12 w-full !rounded-xl" />
          <Skel className="h-12 w-full !rounded-full" />
        </div>
      </div>
    </Loading>
  );
}
