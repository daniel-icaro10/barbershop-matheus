export default function AgendarLoading() {
  return (
    <div className="min-h-dvh bg-[#080808]">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl">
        <div className="safe-top flex min-h-14 items-center gap-3 px-4 py-3.5">
          <div className="size-11 rounded-xl skeleton-shimmer shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-2 w-16 rounded skeleton-shimmer" />
            <div className="h-[2px] w-full rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Title skeleton */}
      <div className="px-5 pt-8 pb-6">
        <div className="h-3 w-24 rounded skeleton-shimmer mb-3" />
        <div className="h-10 w-64 rounded skeleton-shimmer mb-1" />
        <div className="h-10 w-48 rounded skeleton-shimmer" />
      </div>

      {/* Service card skeletons */}
      <div className="flex flex-col gap-3 px-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border border-white/[0.06] p-4">
            <div className="size-16 shrink-0 rounded skeleton-shimmer" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-32 rounded skeleton-shimmer" />
              <div className="h-2.5 w-48 rounded skeleton-shimmer" />
              <div className="h-2.5 w-20 rounded skeleton-shimmer" />
            </div>
            <div className="h-4 w-16 rounded skeleton-shimmer shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
