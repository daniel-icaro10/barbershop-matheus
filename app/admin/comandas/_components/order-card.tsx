"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils/money"
import { formatInTimeZone } from "date-fns-tz"
import { ShoppingBag, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const TZ = "America/Sao_Paulo"

type OrderStatus = "OPEN" | "CLOSED" | "CANCELED"

interface Props {
  order: {
    id: string
    status: OrderStatus
    totalInCents: number
    createdAt: Date
    customer: { name: string; email: string }
    items: { id: string }[]
    payments: { status: string; paidAmountInCents: number | null }[]
  }
}

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  OPEN: { label: "Aberta", icon: Clock, color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/[0.08]" },
  CLOSED: { label: "Fechada", icon: CheckCircle2, color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/[0.08]" },
  CANCELED: { label: "Cancelada", icon: XCircle, color: "text-red-400", bg: "border-red-500/20 bg-red-500/[0.06]" },
}

export function OrderCard({ order }: Props) {
  const cfg = statusConfig[order.status]
  const Icon = cfg.icon
  const paidTotal = order.payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)

  return (
    <Link
      href={`/admin/comandas/${order.id}`}
      className={cn(
        "block border border-white/[0.07] bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]",
        order.status === "CANCELED" && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center border border-white/[0.07] bg-white/[0.03]">
            <ShoppingBag className="size-4 text-white/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{order.customer.name}</p>
            <p className="text-xs text-white/30">{order.customer.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.25em]", cfg.bg, cfg.color)}>
                <Icon className="size-2.5" />
                {cfg.label}
              </span>
              <span className="text-[10px] text-white/25">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-[#c9a227]">{formatCurrency(order.totalInCents)}</p>
          {paidTotal > 0 && paidTotal < order.totalInCents && (
            <p className="text-[10px] text-white/30">pago {formatCurrency(paidTotal)}</p>
          )}
          <p className="mt-1 text-[10px] text-white/20">
            {formatInTimeZone(order.createdAt, TZ, "dd/MM HH:mm")}
          </p>
        </div>
      </div>
    </Link>
  )
}
