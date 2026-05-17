"use client"

import { useState, useTransition } from "react"
import { closeCashRegister } from "@/app/_actions/admin/cash-register/close-cash-register"
import { toast } from "sonner"
import { Loader2, LockKeyhole, AlertTriangle, Clock } from "lucide-react"
import { parseCurrencyInput, formatCurrencyInput, formatCurrency } from "@/lib/utils/money"
import { useRouter } from "next/navigation"
import { formatInTimeZone } from "date-fns-tz"

const TZ = "America/Sao_Paulo"

interface PendingPayment {
  id: string
  transactionAmountInCents: number
  createdAt: Date | string
}

interface Props {
  register: {
    id: string
    openedAt: Date
    initialAmountInCents: number
    openedBy: { name: string }
  }
  expectedRevenue: number
}

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function CloseRegisterForm({ register, expectedRevenue }: Props) {
  const [finalStr, setFinalStr] = useState(formatCurrencyInput(register.initialAmountInCents))
  const [notes, setNotes] = useState("")
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[] | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const finalAmountInCents = parseCurrencyInput(finalStr)
  const difference = finalAmountInCents - register.initialAmountInCents
  const reconciliationDiff = finalAmountInCents - (register.initialAmountInCents + expectedRevenue)

  const handleClose = (force = false) => {
    startTransition(async () => {
      const result = await closeCashRegister({
        registerId: register.id,
        finalAmountInCents,
        notes: notes.trim() || undefined,
        force,
      })
      if (result?.serverError) { toast.error(result.serverError); return }
      if (result?.data && "pendingPayments" in result.data && result.data.pendingPayments) {
        setPendingPayments(result.data.pendingPayments)
        return
      }
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

        {/* Reconciliation against system revenue */}
        {finalAmountInCents > 0 && (
          <div className="border border-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.05]">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[11px] text-white/40">Receita apurada (sistema)</span>
              <span className="text-sm font-bold text-white/60">{formatCurrency(expectedRevenue)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[11px] text-white/40">Diferença de reconciliação</span>
              <span className={`text-sm font-bold ${reconciliationDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {reconciliationDiff >= 0 ? "+" : ""}{formatCurrency(reconciliationDiff)}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Observações
          </label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" maxLength={500} className={inputClass} />
        </div>

        {/* Pending payments warning */}
        {pendingPayments && (
          <div className="border border-amber-500/30 bg-amber-500/[0.08] p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-amber-400 shrink-0" />
              <p className="text-sm font-bold text-amber-400">
                {pendingPayments.length} pagamento{pendingPayments.length !== 1 ? "s" : ""} pendente{pendingPayments.length !== 1 ? "s" : ""} (mais de 10 min)
              </p>
            </div>
            <ul className="mb-4 flex flex-col gap-1">
              {pendingPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3 text-white/30" />
                    {formatInTimeZone(p.createdAt, TZ, "HH:mm")}
                  </span>
                  <span className="font-semibold">{formatCurrency(p.transactionAmountInCents)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => handleClose(true)}
                disabled={pending}
                className="flex-1 border border-red-500/30 bg-red-500/[0.08] py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/[0.14] disabled:opacity-50"
              >
                {pending ? <Loader2 className="size-3 animate-spin mx-auto" /> : "Marcar como expirado e fechar"}
              </button>
              <button
                onClick={() => setPendingPayments(null)}
                disabled={pending}
                className="flex-1 border border-white/10 bg-white/[0.03] py-2 text-xs font-bold text-white/50 transition-all hover:bg-white/[0.06] disabled:opacity-50"
              >
                Aguardar
              </button>
            </div>
          </div>
        )}

        {!pendingPayments && (
          <button
            onClick={() => handleClose(false)}
            disabled={pending}
            className="flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/[0.08] py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/[0.12] disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
            Fechar caixa
          </button>
        )}
      </div>
    </div>
  )
}
