"use client"

import { useState, useTransition } from "react"
import { closeCashRegister } from "@/app/_actions/admin/cash-register/close-cash-register"
import { toast } from "sonner"
import { Loader2, LockKeyhole } from "lucide-react"
import { parseCurrencyInput, formatCurrencyInput, formatCurrency } from "@/lib/utils/money"
import { useRouter } from "next/navigation"
import { formatInTimeZone } from "date-fns-tz"

const TZ = "America/Sao_Paulo"

interface Props {
  register: {
    id: string
    openedAt: Date
    initialAmountInCents: number
    openedBy: { name: string }
  }
}

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function CloseRegisterForm({ register }: Props) {
  const [finalStr, setFinalStr] = useState(formatCurrencyInput(register.initialAmountInCents))
  const [notes, setNotes] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const finalAmountInCents = parseCurrencyInput(finalStr)
  const difference = finalAmountInCents - register.initialAmountInCents

  const handleClose = () => {
    startTransition(async () => {
      const result = await closeCashRegister({
        registerId: register.id,
        finalAmountInCents,
        notes: notes.trim() || undefined,
      })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Caixa fechado.")
      router.refresh()
    })
  }

  return (
    <div className="border border-amber-500/20 bg-amber-500/[0.04] p-6 max-w-md">
      <div className="mb-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400 mb-1">Caixa aberto</p>
        <p className="text-sm font-bold text-white/80">
          Aberto por {register.openedBy.name} às {formatInTimeZone(register.openedAt, TZ, "HH:mm")}
        </p>
        <p className="text-xs text-white/30 mt-0.5">
          Valor inicial: {formatCurrency(register.initialAmountInCents)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Valor final em caixa (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={finalStr}
            onChange={(e) => setFinalStr(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </div>

        {/* Difference indicator */}
        {finalAmountInCents > 0 && (
          <div className={`border px-4 py-2.5 ${difference >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-red-500/20 bg-red-500/[0.06]"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${difference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {difference >= 0 ? "Sobra" : "Falta"}
            </p>
            <p className={`text-lg font-bold ${difference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {difference < 0 ? "- " : "+ "}{formatCurrency(Math.abs(difference))}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Observações
          </label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" maxLength={500} className={inputClass} />
        </div>

        <button
          onClick={handleClose}
          disabled={pending}
          className="flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/[0.08] py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/[0.12] disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
          Fechar caixa
        </button>
      </div>
    </div>
  )
}
