export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils/money"
import { formatInTimeZone } from "date-fns-tz"
import { ChevronLeft, Package, ScissorsIcon, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AddItemSheet } from "../_components/add-item-sheet"
import { PaymentSheet } from "../_components/payment-sheet"
import { CashPaymentSheet } from "../_components/cash-payment-sheet"
import { CloseOrderButton } from "./_components/close-order-button"
import { CancelOrderButton } from "./_components/cancel-order-button"
import { RemoveItemButton } from "./_components/remove-item-button"
import { DiscountForm } from "./_components/discount-form"
import { OrderTimeline } from "./_components/order-timeline"

const TZ = "America/Sao_Paulo"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  await requireAdmin()

  const { id } = await params

  const [order, allItems] = await Promise.all([
    prisma.order.findUnique({
      where: { id, barbershopId: DEFAULT_BARBERSHOP_ID },
      include: {
        customer: { select: { name: true, email: true } },
        items: {
          include: { item: { select: { name: true, type: true } } },
          orderBy: { id: "asc" },
        },
        payments: { orderBy: { createdAt: "desc" } },
        timeline: { orderBy: { createdAt: "asc" }, select: { id: true, type: true, message: true, createdAt: true } },
      },
    }),
    prisma.barbershopItem.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
  ])

  if (!order) notFound()

  const approvedPayments = order.payments.filter((p) => p.status === "APPROVED")
  const pendingPayments = order.payments.filter((p) => p.status === "PENDING")
  const totalPaid = approvedPayments.reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)
  const pendingInCents = Math.max(0, order.totalInCents - totalPaid)
  const pendingPix = pendingPayments.find((p) => p.method === "PIX") ?? null

  const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendente", color: "text-amber-400" },
    APPROVED: { label: "Aprovado", color: "text-emerald-400" },
    REJECTED: { label: "Rejeitado", color: "text-red-400" },
    REFUNDED: { label: "Estornado", color: "text-blue-400" },
    CANCELED: { label: "Cancelado", color: "text-white/30" },
  }

  const methodLabel: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de crédito",
    CASH: "Dinheiro",
    DEBIT_CARD: "Débito",
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/admin/comandas"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ChevronLeft className="size-3.5" />
          Voltar
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-px w-5 bg-[#c9a227]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Comanda</span>
            </div>
            <h1 className="font-bebas text-white leading-tight" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)" }}>
              {order.customer.name}
            </h1>
            <p className="text-xs text-white/30">{order.customer.email}</p>
          </div>
          <span className={cn(
            "shrink-0 border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em]",
            order.status === "OPEN" && "border-amber-500/20 bg-amber-500/[0.08] text-amber-400",
            order.status === "CLOSED" && "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
            order.status === "CANCELED" && "border-red-500/20 bg-red-500/[0.06] text-red-400",
          )}>
            {order.status === "OPEN" ? "Aberta" : order.status === "CLOSED" ? "Fechada" : "Cancelada"}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-white/20">
          {formatInTimeZone(order.createdAt, TZ, "dd/MM/yyyy 'às' HH:mm")}
        </p>
      </div>

      {/* Items */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Itens</h2>
          {order.status === "OPEN" && <AddItemSheet orderId={order.id} items={allItems} />}
        </div>

        {order.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-white/[0.07] bg-white/[0.03] py-10">
            <AlertCircle className="size-6 text-white/15" />
            <p className="text-sm text-white/25">Nenhum item adicionado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {order.items.map((oi) => (
              <div key={oi.id} className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <div className="flex size-7 shrink-0 items-center justify-center">
                  {oi.item.type === "PRODUCT" ? (
                    <Package className="size-4 text-blue-400" />
                  ) : (
                    <ScissorsIcon className="size-4 text-[#c9a227]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80">{oi.item.name}</p>
                  <p className="text-xs text-white/30">
                    {oi.quantity}× {formatCurrency(oi.unitPriceInCents)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-white/70">
                  {formatCurrency(oi.totalInCents)}
                </span>
                {order.status === "OPEN" && (
                  <RemoveItemButton orderItemId={oi.id} orderId={order.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial summary */}
      <div className="mb-6 border border-white/[0.07] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Resumo</h2>
        </div>
        <div className="flex flex-col divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white/50">Subtotal</span>
            <span className="text-sm text-white/70">{formatCurrency(order.subtotalInCents)}</span>
          </div>
          {order.discountInCents > 0 && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-emerald-400">Desconto</span>
              <span className="text-sm text-emerald-400">- {formatCurrency(order.discountInCents)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="text-base font-bold text-[#c9a227]">{formatCurrency(order.totalInCents)}</span>
          </div>
          {totalPaid > 0 && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-emerald-400">Pago</span>
              <span className="text-sm font-semibold text-emerald-400">{formatCurrency(totalPaid)}</span>
            </div>
          )}
          {pendingInCents > 0 && order.status === "OPEN" && (
            <div className="flex items-center justify-between bg-amber-500/[0.04] px-5 py-3">
              <span className="text-sm font-bold text-amber-400">Saldo pendente</span>
              <span className="text-sm font-bold text-amber-400">{formatCurrency(pendingInCents)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Discount (OPEN only) */}
      {order.status === "OPEN" && order.items.length > 0 && (
        <div className="mb-6">
          <DiscountForm orderId={order.id} currentDiscountInCents={order.discountInCents} subtotalInCents={order.subtotalInCents} />
        </div>
      )}

      {/* Payments */}
      {order.payments.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Pagamentos</h2>
          <div className="flex flex-col gap-1.5">
            {order.payments.map((p) => {
              const cfg = paymentStatusConfig[p.status]
              return (
                <div key={p.id} className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white/80">{methodLabel[p.method] ?? p.method}</p>
                      <span className={cn("text-[10px] font-bold uppercase", cfg.color)}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-white/25">
                      {formatInTimeZone(p.createdAt, TZ, "dd/MM HH:mm")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white/70">
                      {formatCurrency(p.transactionAmountInCents)}
                    </p>
                    {p.status === "APPROVED" && p.paidAmountInCents != null && (
                      <p className="text-[10px] text-emerald-400">
                        <CheckCircle2 className="inline size-2.5 mr-0.5" />
                        Recebido
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {order.status === "OPEN" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <PaymentSheet
            orderId={order.id}
            totalInCents={order.totalInCents}
            pendingInCents={pendingInCents}
            customerEmail={order.customer.email}
            customerName={order.customer.name}
            existingPix={
              pendingPix
                ? {
                    id: pendingPix.id,
                    qrCodeBase64: pendingPix.qrCodeBase64 ?? "",
                    pixCopyPaste: pendingPix.pixCopyPaste ?? "",
                    transactionAmountInCents: pendingPix.transactionAmountInCents,
                  }
                : null
            }
          />
          {pendingInCents > 0 && (
            <CashPaymentSheet
              orderId={order.id}
              totalInCents={order.totalInCents}
              pendingInCents={pendingInCents}
            />
          )}
          <CancelOrderButton orderId={order.id} />
          {pendingInCents === 0 && order.items.length > 0 && (
            <CloseOrderButton orderId={order.id} />
          )}
        </div>
      )}

      {order.status === "CLOSED" && (
        <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">
            Comanda fechada em {formatInTimeZone(order.closedAt!, TZ, "dd/MM/yyyy 'às' HH:mm")}
          </span>
        </div>
      )}

      {order.timeline.length > 0 && (
        <div className="mt-8">
          <OrderTimeline events={order.timeline} />
        </div>
      )}
    </div>
  )
}
