export default function MinhaContaLoading() {
  return (
    <div className="min-h-dvh bg-[#080808] text-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl">
        <div className="safe-top flex min-h-14 items-center justify-between px-5">
          <div className="size-11 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-10 rounded skeleton-shimmer" />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-5 pb-20 pt-6">
        {/* User greeting skeleton */}
        <div className="mb-8 flex items-center gap-4">
          <div className="size-14 shrink-0 skeleton-shimmer" />
          <div className="flex flex-col gap-2">
            <div className="h-2.5 w-28 rounded skeleton-shimmer" />
            <div className="h-7 w-36 rounded skeleton-shimmer" />
            <div className="h-2 w-44 rounded skeleton-shimmer" />
          </div>
        </div>

        {/* Next booking card skeleton */}
        <div className="mb-8 border border-white/[0.06] p-5">
          <div className="h-2 w-28 rounded skeleton-shimmer mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="size-11 skeleton-shimmer shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-32 rounded skeleton-shimmer" />
              <div className="h-3 w-16 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="h-12 w-full skeleton-shimmer" />
        </div>

        {/* History skeletons */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border border-white/[0.04] px-4 py-3.5">
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-28 rounded skeleton-shimmer" />
                <div className="h-2.5 w-36 rounded skeleton-shimmer" />
              </div>
              <div className="h-3 w-14 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
