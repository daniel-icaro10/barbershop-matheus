"use client"

import { useState, useTransition } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/app/_components/ui/sheet"
import { registerCashPayment } from "@/app/_actions/admin/payments/register-cash-payment"
import { toast } from "sonner"
import { Banknote, Loader2, CheckCircle2 } from "lucide-react"
import { formatCurrency, parseCurrencyInput, formatCurrencyInput } from "@/lib/utils/money"
import { useRouter } from "next/navigation"

interface Props {
  orderId: string
  totalInCents: number
  pendingInCents: number
}

const inputClass =
  "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function CashPaymentSheet({ orderId, totalInCents, pendingInCents }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amountStr, setAmountStr] = useState(formatCurrencyInput(pendingInCents))
  const [pending, startTransition] = useTransition()

  const amountInCents = parseCurrencyInput(amountStr)

  const handleConfirm = () => {
    if (!amountInCents || amountInCents <= 0) return toast.error("Valor inválido.")
    if (amountInCents > pendingInCents) return toast.error("Valor maior que o saldo pendente.")

    startTransition(async () => {
      const result = await registerCashPayment({ orderId, amountInCents })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Pagamento em dinheiro registrado!")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/10">
          <Banknote className="size-4" />
          Registrar dinheiro
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-bold">Pagamento em dinheiro</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Total comanda</p>
              <p className="mt-1 text-sm font-bold text-white/70">{formatCurrency(totalInCents)}</p>
            </div>
            <div className="border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400/60">Saldo pendente</p>
              <p className="mt-1 text-sm font-bold text-emerald-400">{formatCurrency(pendingInCents)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor recebido (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground">
                Máximo: {formatCurrency(pendingInCents)}
              </p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={pending || !amountInCents}
              className="flex items-center justify-center gap-2 bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending
                ? <><Loader2 className="size-4 animate-spin" />Registrando...</>
                : <><CheckCircle2 className="size-4" />Confirmar pagamento</>}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
