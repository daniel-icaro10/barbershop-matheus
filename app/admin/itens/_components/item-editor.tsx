"use client"

import { useState, useTransition } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/app/_components/ui/sheet"
import { createItem } from "@/app/_actions/admin/items/create-item"
import { updateItem } from "@/app/_actions/admin/items/update-item"
import { toast } from "sonner"
import { Edit2, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money"
import { calculateMarginPercent } from "@/lib/utils/commission"
import type { BarbershopItem } from "@/generated/prisma/client"

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

interface Props {
  item?: BarbershopItem
}

const inputClass =
  "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"

export function ItemEditor({ item }: Props) {
  const isNew = !item
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"SERVICE" | "PRODUCT">(item?.type ?? "SERVICE")
  const [name, setName] = useState(item?.name ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "")
  const [priceStr, setPriceStr] = useState(item ? formatCurrencyInput(item.priceInCents) : "")
  const [costStr, setCostStr] = useState(item?.costInCents ? formatCurrencyInput(item.costInCents) : "")
  const [duration, setDuration] = useState(item?.durationInMinutes ?? 30)
  const [stockQuantity, setStockQuantity] = useState<string>(item?.stockQuantity?.toString() ?? "")
  const [minimumStock, setMinimumStock] = useState<string>(item?.minimumStock?.toString() ?? "")
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED" | "">(
    item?.commissionType ?? "",
  )
  const [commissionValue, setCommissionValue] = useState<string>(
    item?.commissionValue?.toString() ?? "",
  )
  const [isActive, setIsActive] = useState(item?.isActive ?? true)
  const [pending, startTransition] = useTransition()

  const priceInCents = parseCurrencyInput(priceStr)
  const costInCents = costStr ? parseCurrencyInput(costStr) : undefined
  const margin = calculateMarginPercent(priceInCents, costInCents)

  const reset = () => {
    setType(item?.type ?? "SERVICE")
    setName(item?.name ?? "")
    setDescription(item?.description ?? "")
    setImageUrl(item?.imageUrl ?? "")
    setPriceStr(item ? formatCurrencyInput(item.priceInCents) : "")
    setCostStr(item?.costInCents ? formatCurrencyInput(item.costInCents) : "")
    setDuration(item?.durationInMinutes ?? 30)
    setStockQuantity(item?.stockQuantity?.toString() ?? "")
    setMinimumStock(item?.minimumStock?.toString() ?? "")
    setCommissionType(item?.commissionType ?? "")
    setCommissionValue(item?.commissionValue?.toString() ?? "")
    setIsActive(item?.isActive ?? true)
  }

  const handleSave = () => {
    if (!name.trim()) return toast.error("Nome é obrigatório.")
    if (!priceInCents || priceInCents <= 0) return toast.error("Preço inválido.")

    const payload = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      type,
      priceInCents,
      costInCents,
      durationInMinutes: type === "SERVICE" ? duration : undefined,
      stockQuantity: type === "PRODUCT" && stockQuantity ? parseInt(stockQuantity) : undefined,
      minimumStock: type === "PRODUCT" && minimumStock ? parseInt(minimumStock) : undefined,
      commissionType: commissionType || undefined,
      commissionValue: commissionValue ? parseInt(commissionValue) : undefined,
      isActive,
    }

    startTransition(async () => {
      const result = isNew
        ? await createItem(payload)
        : await updateItem({ id: item!.id, ...payload })

      if (result?.serverError) { toast.error("Erro ao salvar."); return }
      toast.success(isNew ? `"${name}" criado.` : `"${name}" atualizado.`)
      setOpen(false)
    })
  }

  const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v) }}>
      <SheetTrigger asChild>
        {isNew ? (
          <button className="flex items-center gap-1.5 border border-[#c9a227]/30 bg-[#c9a227]/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#c9a227] transition-all hover:bg-[#c9a227]/10">
            <Plus className="size-3.5" />
            Novo item
          </button>
        ) : (
          <button
            className="flex shrink-0 items-center gap-1.5 border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
            aria-label={`Editar ${item.name}`}
          >
            <Edit2 className="size-3.5" />
            Editar
          </button>
        )}
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-bold">
            {isNew ? "Novo item" : `Editar: ${item.name}`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["SERVICE", "PRODUCT"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "border py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                  type === t
                    ? "border-primary/50 bg-primary/[0.08] text-primary"
                    : "border-border/60 text-muted-foreground hover:border-border",
                )}
              >
                {t === "SERVICE" ? "Serviço" : "Produto"}
              </button>
            ))}
          </div>

          {/* Active */}
          <div className="flex items-center justify-between border border-border/60 bg-card px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ativo</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Visível" : "Oculto"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-transparent transition-colors",
                isActive ? "bg-primary" : "bg-muted",
              )}
            >
              <span className={cn("inline-block size-5 bg-white shadow-sm transition-transform", isActive ? "translate-x-5" : "translate-x-0")} />
            </button>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={100} />
          </div>

          {/* Price / Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Preço (R$)</label>
              <input type="text" inputMode="decimal" value={priceStr} onChange={(e) => setPriceStr(e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Custo (R$)</label>
              <input type="text" inputMode="decimal" value={costStr} onChange={(e) => setCostStr(e.target.value)} placeholder="0,00" className={inputClass} />
            </div>
          </div>

          {/* Margin indicator */}
          {costInCents != null && priceInCents > 0 && (
            <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400">Margem</p>
                <p className="text-sm font-bold text-emerald-400">{margin}%</p>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Lucro unit.</p>
                <p className="text-sm font-bold text-white/60">
                  R$ {((priceInCents - costInCents) / 100).toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          )}

          {/* Duration (SERVICE only) */}
          {type === "SERVICE" && (
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Duração</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={cn(inputClass, "cursor-pointer")}>
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          )}

          {/* Stock (PRODUCT only) */}
          {type === "PRODUCT" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Estoque</label>
                <input type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="0" className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Estoque mín.</label>
                <input type="number" min={0} value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} placeholder="0" className={inputClass} />
              </div>
            </div>
          )}

          {/* Commission */}
          <div className="flex flex-col gap-3">
            <label className={labelClass}>Comissão</label>
            <div className="grid grid-cols-3 gap-2">
              {(["", "PERCENTAGE", "FIXED"] as const).map((ct) => (
                <button
                  key={ct}
                  onClick={() => setCommissionType(ct)}
                  className={cn(
                    "border py-2 text-xs font-bold uppercase tracking-wider transition-all",
                    commissionType === ct
                      ? "border-primary/50 bg-primary/[0.08] text-primary"
                      : "border-border/60 text-muted-foreground hover:border-border",
                  )}
                >
                  {ct === "" ? "Nenhuma" : ct === "PERCENTAGE" ? "%" : "Fixo"}
                </button>
              ))}
            </div>
            {commissionType && (
              <input
                type="number"
                min={0}
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder={commissionType === "PERCENTAGE" ? "Ex: 1000 = 10%" : "Ex: 500 = R$5,00"}
                className={inputClass}
              />
            )}
            {commissionType === "PERCENTAGE" && (
              <p className="text-[10px] text-muted-foreground">
                Valor em centésimos de porcento: 1000 = 10%, 500 = 5%
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className={cn(inputClass, "resize-none leading-relaxed")} />
          </div>

          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>URL da imagem</label>
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputClass} />
          </div>
        </div>

        <div className="border-t border-border/60 p-5 pt-4">
          <div className="flex gap-3">
            <button onClick={() => setOpen(false)} className="flex-1 border border-border/60 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <><Loader2 className="size-3.5 animate-spin" />Salvando…</> : "Salvar"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
