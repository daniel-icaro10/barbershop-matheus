import { Skeleton } from "@/app/_components/ui/skeleton"

export default function BookingsLoading() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-lg px-5 pb-16 pt-6">
        <Skeleton className="mb-6 h-4 w-16" />

        <div className="mb-8">
          <Skeleton className="mb-1.5 h-3 w-20" />
          <Skeleton className="h-8 w-56" />
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
