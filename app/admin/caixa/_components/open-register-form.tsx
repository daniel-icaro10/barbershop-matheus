"use client"

import { useState, useTransition } from "react"
import { openCashRegister } from "@/app/_actions/admin/cash-register/open-cash-register"
import { toast } from "sonner"
import { Loader2, Vault } from "lucide-react"
import { parseCurrencyInput, formatCurrencyInput } from "@/lib/utils/money"
import { useRouter } from "next/navigation"

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function OpenRegisterForm() {
  const [amountStr, setAmountStr] = useState("0,00")
  const [notes, setNotes] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleOpen = () => {
    const initialAmountInCents = parseCurrencyInput(amountStr)

    startTransition(async () => {
      const result = await openCashRegister({ initialAmountInCents, notes: notes.trim() || undefined })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Caixa aberto com sucesso!")
      router.refresh()
    })
  }

  return (
    <div className="border border-white/[0.07] bg-white/[0.03] p-6 max-w-md">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center border border-[#c9a227]/20 bg-[#c9a227]/[0.08]">
          <Vault className="size-5 text-[#c9a227]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/80">Abrir caixa</p>
          <p className="text-xs text-white/30">Informe o valor inicial em caixa</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Valor inicial (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Observações
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
            maxLength={500}
            className={inputClass}
          />
        </div>
        <button
          onClick={handleOpen}
          disabled={pending}
          className="flex items-center justify-center gap-2 bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Vault className="size-4" />}
          Abrir caixa
        </button>
      </div>
    </div>
  )
}
