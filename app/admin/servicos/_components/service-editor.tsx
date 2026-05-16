"use client"

import { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/_components/ui/sheet"
import { updateService } from "@/app/_actions/admin/update-service"
import { toast } from "sonner"
import Image from "next/image"
import { Edit2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BarbershopItem } from "@/generated/prisma/client"

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

interface ServiceEditorProps {
  service: BarbershopItem
}

export function ServiceEditor({ service }: ServiceEditorProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(service.name)
  const [description, setDescription] = useState(service.description ?? "")
  const [priceStr, setPriceStr] = useState(
    (service.priceInCents / 100).toFixed(2).replace(".", ","),
  )
  const [duration, setDuration] = useState(service.durationInMinutes)
  const [isActive, setIsActive] = useState(service.isActive)
  const [pending, startTransition] = useTransition()

  const resetForm = () => {
    setName(service.name)
    setDescription(service.description ?? "")
    setPriceStr((service.priceInCents / 100).toFixed(2).replace(".", ","))
    setDuration(service.durationInMinutes)
    setIsActive(service.isActive)
  }

  const handleOpenChange = (v: boolean) => {
    resetForm()
    setOpen(v)
  }

  const handleSave = () => {
    const normalized = priceStr.replace(",", ".")
    const priceInCents = Math.round(parseFloat(normalized) * 100)

    if (!name.trim()) return toast.error("Nome é obrigatório.")
    if (isNaN(priceInCents) || priceInCents <= 0) return toast.error("Preço inválido.")
    if (!duration || duration <= 0) return toast.error("Duração inválida.")

    startTransition(async () => {
      const result = await updateService({
        id: service.id,
        name: name.trim(),
        description: description.trim(),
        priceInCents,
        durationInMinutes: duration,
        isActive,
      })
      if (result?.serverError) {
        toast.error("Erro ao salvar serviço.")
        return
      }
      toast.success(`"${name.trim()}" atualizado.`)
      setOpen(false)
    })
  }

  const inputClass =
    "w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`Editar serviço ${service.name}`}
        >
          <Edit2 className="size-3.5" />
          Editar
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
        {/* Header with service image */}
        <div className="relative h-32 shrink-0 overflow-hidden">
          <Image
            src={service.imageUrl ?? ""}
            alt={service.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
          <SheetHeader className="absolute bottom-0 left-0 right-0 p-5">
            <SheetTitle className="text-left text-base font-bold text-white">
              {service.name}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col gap-5 p-5">
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Serviço ativo</p>
              <p className="text-xs text-muted-foreground">
                {isActive ? "Visível para clientes" : "Oculto no agendamento"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isActive}
              aria-label="Ativar ou desativar serviço"
              onClick={() => setIsActive((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  isActive ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome do serviço
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              maxLength={100}
            />
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preço (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={cn(inputClass, "cursor-pointer")}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className={cn(inputClass, "resize-none leading-relaxed")}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {description.length}/500
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 p-5 pt-4">
          <div className="flex gap-3">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
