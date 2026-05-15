import { Skeleton } from "@/app/_components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-3 w-28" />
        <Skeleton className="h-8 w-44" />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
