"use client"

import { useState, useTransition } from "react"
import { applyDiscount } from "@/app/_actions/admin/orders/apply-discount"
import { toast } from "sonner"
import { Tag, Loader2 } from "lucide-react"
import { parseCurrencyInput, formatCurrencyInput, formatCurrency } from "@/lib/utils/money"
import { useRouter } from "next/navigation"

interface Props {
  orderId: string
  currentDiscountInCents: number
  subtotalInCents: number
}

export function DiscountForm({ orderId, currentDiscountInCents, subtotalInCents }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [discountStr, setDiscountStr] = useState(
    currentDiscountInCents > 0 ? formatCurrencyInput(currentDiscountInCents) : "",
  )
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const discountInCents = parseCurrencyInput(discountStr)

  const handleApply = () => {
    if (discountInCents < 0) return toast.error("Desconto inválido.")
    if (discountInCents > subtotalInCents) return toast.error("Desconto maior que subtotal.")

    startTransition(async () => {
      const result = await applyDiscount({ orderId, discountInCents })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Desconto aplicado.")
      setExpanded(false)
      router.refresh()
    })
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
      >
        <Tag className="size-3.5" />
        {currentDiscountInCents > 0
          ? `Desconto aplicado: ${formatCurrency(currentDiscountInCents)}`
          : "Aplicar desconto"}
      </button>

      {expanded && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={discountStr}
            onChange={(e) => setDiscountStr(e.target.value)}
            placeholder="0,00"
            className="flex-1 border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleApply}
            disabled={pending}
            className="flex items-center gap-1.5 border border-primary/40 bg-primary/[0.08] px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Aplicar"}
          </button>
        </div>
      )}
    </div>
  )
}
