import { Loading, Skel, SkelText } from "./Skeleton";

/** Placeholder for a calculated result (kundli, matching, panchang) while the server works. */
export function ResultSkeleton({ charts = false }: { charts?: boolean }) {
  return (
    <Loading label="Calculating" className="mt-8 space-y-6">
      <div className="card">
        <Skel className="h-6 w-56" />
        <Skel className="mt-2 h-3 w-72 max-w-full" />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} className="h-16 !rounded-xl" />
          ))}
        </div>
      </div>
      {charts ? (
        <div className="card grid gap-8 md:grid-cols-2">
          <Skel className="aspect-square w-full !rounded-xl" />
          <Skel className="aspect-square w-full !rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skel key={i} className="h-20 !rounded-2xl" />
          ))}
        </div>
      )}
      <div className="card">
        <Skel className="h-5 w-40" />
        <SkelText lines={5} className="mt-4" />
      </div>
    </Loading>
  );
}
