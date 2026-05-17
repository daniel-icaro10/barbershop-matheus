"use client"

import { useState, useTransition } from "react"
import { createBarber } from "@/app/_actions/admin/barbers/create-barber"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function CreateBarberForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [pending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createBarber({ name: name.trim(), photoUrl })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Barbeiro criado.")
      setName("")
      setPhotoUrl("")
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-[#c9a227]/30 bg-[#c9a227]/[0.06] px-4 py-2.5 text-sm font-bold text-[#c9a227] transition-all hover:bg-[#c9a227]/[0.1]"
      >
        <Plus className="size-4" />
        Novo barbeiro
      </button>
    )
  }

  return (
    <div className="border border-[#c9a227]/20 bg-[#c9a227]/[0.04] p-5 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#c9a227]">Novo barbeiro</p>
        <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do barbeiro" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Foto (URL)</label>
          <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://... (opcional)" className={inputClass} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={pending || !name.trim()}
          className="flex items-center justify-center gap-2 border border-[#c9a227]/30 bg-[#c9a227]/[0.08] py-2.5 text-sm font-bold text-[#c9a227] hover:bg-[#c9a227]/[0.14] disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Criar barbeiro
        </button>
      </div>
    </div>
  )
}
