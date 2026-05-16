"use client"

import { AlertTriangle } from "lucide-react"

interface Props {
  stockQuantity: number | null
  minimumStock: number | null
}

export function StockAlertBadge({ stockQuantity, minimumStock }: Props) {
  if (stockQuantity == null) return null

  const isLow = minimumStock != null && stockQuantity <= minimumStock
  const isEmpty = stockQuantity === 0

  if (!isLow && !isEmpty) return null

  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] ${
      isEmpty
        ? "border-red-500/20 bg-red-500/[0.08] text-red-400"
        : "border-amber-500/20 bg-amber-500/[0.08] text-amber-400"
    }`}>
      <AlertTriangle className="size-2.5" />
      {isEmpty ? "Sem estoque" : "Estoque baixo"}
    </span>
  )
}
