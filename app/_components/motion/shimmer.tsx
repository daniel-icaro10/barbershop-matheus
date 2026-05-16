"use client"
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/[0.04] ${className ?? ""}`}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
      aria-hidden="true"
    />
  )
}
