"use client"

import { useState, useTransition } from "react"
import { updateBarber } from "@/app/_actions/admin/barbers/update-barber"
import { deleteBarber } from "@/app/_actions/admin/barbers/delete-barber"
import { toast } from "sonner"
import { Loader2, Pencil, Trash2, Check, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils/money"

interface BarberStats {
  bookings30d: number
  revenue30d: number
}

interface Props {
  barber: {
    id: string
    name: string
    photoUrl: string | null
    isActive: boolean
  }
  stats: BarberStats
}

const inputClass = "border border-border/60 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function BarberCard({ barber, stats }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(barber.name)
  const [photoUrl, setPhotoUrl] = useState(barber.photoUrl ?? "")
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBarber({ id: barber.id, name, photoUrl, isActive: barber.isActive })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Barbeiro atualizado.")
      setEditing(false)
    })
  }

  const handleDeactivate = () => {
    startTransition(async () => {
      const result = await deleteBarber({ id: barber.id })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Barbeiro desativado.")
    })
  }

  return (
    <div className={`border p-5 ${barber.isActive ? "border-white/[0.08] bg-white/[0.02]" : "border-white/[0.04] bg-white/[0.01] opacity-50"}`}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className={inputClass} />
          <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="URL da foto (opcional)" className={inputClass} />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={pending} className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/[0.14] disabled:opacity-50">
              {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              Salvar
            </button>
            <button onClick={() => { setEditing(false); setName(barber.name); setPhotoUrl(barber.photoUrl ?? "") }} className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/40 hover:bg-white/[0.04]">
              <X className="size-3" />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {barber.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barber.photoUrl} alt={barber.name} className="size-10 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-[#c9a227]/10 text-[#c9a227] text-sm font-bold">
                {barber.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white/80">{barber.name}</p>
              <p className="text-[11px] text-white/30 mt-0.5">
                {stats.bookings30d} agendamento{stats.bookings30d !== 1 ? "s" : ""} · {formatCurrency(stats.revenue30d)} (30d)
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)} className="flex size-7 items-center justify-center border border-white/[0.07] text-white/30 hover:text-white/70 hover:bg-white/[0.04]">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={handleDeactivate} disabled={pending} className="flex size-7 items-center justify-center border border-white/[0.07] text-white/30 hover:text-red-400 hover:bg-red-500/[0.06] disabled:opacity-50">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
