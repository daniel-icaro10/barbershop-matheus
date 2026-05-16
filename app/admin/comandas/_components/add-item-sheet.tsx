"use client"

import { useState, useTransition } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/app/_components/ui/sheet"
import { addOrderItem } from "@/app/_actions/admin/orders/add-order-item"
import { toast } from "sonner"
import { Plus, Search, Loader2, Clock, Package, ScissorsIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils/money"
import { cn } from "@/lib/utils"
import type { BarbershopItem } from "@/generated/prisma/client"

interface Props {
  orderId: string
  items: BarbershopItem[]
}

export function AddItemSheet({ orderId, items }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [pending, startTransition] = useTransition()

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()),
  )

  const selected = items.find((i) => i.id === selectedId)

  const handleAdd = () => {
    if (!selectedId) return toast.error("Selecione um item.")
    if (quantity < 1) return toast.error("Quantidade inválida.")

    startTransition(async () => {
      const result = await addOrderItem({ orderId, itemId: selectedId, quantity })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success(`${selected?.name} adicionado.`)
      setOpen(false)
      setSelectedId(null)
      setQuantity(1)
      setQuery("")
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-1.5 border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary">
          <Plus className="size-3.5" />
          Adicionar item
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-bold">Adicionar item à comanda</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar serviço ou produto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-border/60 bg-background py-2.5 pl-9 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Item list */}
          <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum item encontrado</p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                className={cn(
                  "flex items-center gap-3 border p-3 text-left transition-all",
                  selectedId === item.id
                    ? "border-primary/50 bg-primary/[0.06]"
                    : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]",
                )}
              >
                <div className="flex size-9 shrink-0 items-center justify-center border border-white/[0.07] bg-white/[0.03]">
                  {item.type === "PRODUCT" ? (
                    <Package className="size-4 text-blue-400" />
                  ) : (
                    <ScissorsIcon className="size-4 text-[#c9a227]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-white/80">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.type === "SERVICE" && (
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <Clock className="size-2.5" />{item.durationInMinutes}min
                      </span>
                    )}
                    {item.type === "PRODUCT" && item.stockQuantity != null && (
                      <span className="text-[10px] text-white/30">
                        {item.stockQuantity} em estoque
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#c9a227]">
                  {formatCurrency(item.priceInCents)}
                </span>
              </button>
            ))}
          </div>

          {/* Quantity + Add */}
          {selected && (
            <div className="border-t border-border/60 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white/80">{selected.name}</p>
                <p className="text-sm font-bold text-[#c9a227]">
                  {formatCurrency(selected.priceInCents * quantity)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={pending}
                  className="mt-5 flex flex-1 items-center justify-center gap-2 bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
