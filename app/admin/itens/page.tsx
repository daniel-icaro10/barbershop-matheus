export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { formatCurrency } from "@/lib/utils/money"
import { calculateMarginPercent } from "@/lib/utils/commission"
import { Clock, Package, ScissorsIcon, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ItemEditor } from "./_components/item-editor"
import { StockAlertBadge } from "./_components/stock-alert-badge"
import Image from "next/image"

export default async function ItensPage() {
  const items = await prisma.barbershopItem.findMany({
    where: { barbershopId: DEFAULT_BARBERSHOP_ID },
    orderBy: [{ type: "asc" }, { priceInCents: "asc" }],
  })

  const sorted = [...items].sort((a, b) => Number(b.isActive) - Number(a.isActive))
  const services = sorted.filter((i) => i.type === "SERVICE")
  const products = sorted.filter((i) => i.type === "PRODUCT")
  const activeCount = items.filter((i) => i.isActive).length
  const lowStockCount = products.filter(
    (p) => p.stockQuantity != null && p.minimumStock != null && p.stockQuantity <= p.minimumStock,
  ).length

  const ItemRow = ({
    item,
  }: {
    item: (typeof items)[number]
  }) => {
    const margin = calculateMarginPercent(item.priceInCents, item.costInCents)
    const isProduct = item.type === "PRODUCT"
    const isLowStock =
      isProduct &&
      item.stockQuantity != null &&
      item.minimumStock != null &&
      item.stockQuantity <= item.minimumStock

    return (
      <div
        className={cn(
          "overflow-hidden border border-white/[0.07] bg-white/[0.03] transition-colors hover:bg-white/[0.05]",
          !item.isActive && "opacity-50",
          isLowStock && "border-amber-500/20",
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Image / Icon */}
          <div className="relative size-16 shrink-0 overflow-hidden bg-white/[0.04]">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                {isProduct ? (
                  <Package className="size-6 text-white/20" />
                ) : (
                  <ScissorsIcon className="size-6 text-white/20" />
                )}
              </div>
            )}
            {!item.isActive && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className="font-bebas text-[1rem] tracking-wide text-white leading-tight">{item.name}</p>
              <span className={cn(
                "border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em]",
                isProduct
                  ? "border-blue-400/20 bg-blue-400/[0.08] text-blue-400"
                  : "border-[#c9a227]/20 bg-[#c9a227]/[0.06] text-[#c9a227]",
              )}>
                {isProduct ? "Produto" : "Serviço"}
              </span>
              {item.isActive ? (
                <span className="border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                  Ativo
                </span>
              ) : (
                <span className="border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/25">
                  Inativo
                </span>
              )}
              <StockAlertBadge stockQuantity={item.stockQuantity} minimumStock={item.minimumStock} />
            </div>

            {item.description && (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-white/35">{item.description}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {item.type === "SERVICE" && (
                <div className="flex items-center gap-1 text-[11px] text-white/30">
                  <Clock className="size-3" />
                  <span>{item.durationInMinutes} min</span>
                </div>
              )}
              {isProduct && item.stockQuantity != null && (
                <div className="flex items-center gap-1 text-[11px] text-white/30">
                  <Package className="size-3" />
                  <span>{item.stockQuantity} em estoque</span>
                </div>
              )}
              <span className="text-sm font-bold text-[#c9a227]">{formatCurrency(item.priceInCents)}</span>
              {item.costInCents != null && (
                <>
                  <span className="text-[11px] text-white/25">
                    custo {formatCurrency(item.costInCents)}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400">{margin}% margem</span>
                </>
              )}
            </div>
          </div>

          <ItemEditor item={item} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-px w-5 bg-[#c9a227]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
          </div>
          <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
            ITENS & PRODUTOS
          </h1>
          <p className="mt-1.5 text-[11px] text-white/35">
            {activeCount} ativo{activeCount !== 1 ? "s" : ""} · {items.length} total
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-400">
                · <AlertTriangle className="inline size-2.5" /> {lowStockCount} com estoque baixo
              </span>
            )}
          </p>
        </div>
        <ItemEditor />
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <ScissorsIcon className="size-3.5 text-[#c9a227]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
              Serviços ({services.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {services.map((item) => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Package className="size-3.5 text-blue-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
              Produtos ({products.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {products.map((item) => <ItemRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-4 border border-white/[0.07] bg-white/[0.03] py-20">
          <ScissorsIcon className="size-10 text-white/15" />
          <p className="text-sm text-white/30">Nenhum item cadastrado</p>
          <ItemEditor />
        </div>
      )}

      <p className="mt-6 text-center text-[11px] text-white/20">
        Serviços inativos ficam ocultos no agendamento. Produtos com estoque zerado exibem alerta.
      </p>
    </div>
  )
}
