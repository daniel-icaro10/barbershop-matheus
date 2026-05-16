export default function HomeLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#080808]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-16 rounded-full skeleton-shimmer" />
        <div className="h-3 w-32 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}
