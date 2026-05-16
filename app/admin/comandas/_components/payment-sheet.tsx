"use client"

import { useState, useTransition } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/app/_components/ui/sheet"
import { createPixPayment } from "@/app/_actions/admin/payments/create-pix-payment"
import { cancelPayment } from "@/app/_actions/admin/payments/cancel-payment"
import { toast } from "sonner"
import { QrCode, Loader2, X } from "lucide-react"
import { formatCurrency, parseCurrencyInput, formatCurrencyInput } from "@/lib/utils/money"
import { PixDisplay } from "./pix-display"
import { useRouter } from "next/navigation"

interface Props {
  orderId: string
  totalInCents: number
  pendingInCents: number
  customerEmail: string
  customerName: string
  existingPix?: {
    id: string
    qrCodeBase64: string
    pixCopyPaste: string
    transactionAmountInCents: number
  } | null
}

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

export function PaymentSheet({ orderId, totalInCents, pendingInCents, customerEmail, customerName, existingPix }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amountStr, setAmountStr] = useState(formatCurrencyInput(pendingInCents))
  const [pending, startTransition] = useTransition()
  const [currentPix, setCurrentPix] = useState(existingPix)

  const amountInCents = parseCurrencyInput(amountStr)

  const handleCreatePix = () => {
    if (!amountInCents || amountInCents <= 0) return toast.error("Valor inválido.")
    if (amountInCents > pendingInCents) return toast.error("Valor maior que o saldo pendente.")

    startTransition(async () => {
      const result = await createPixPayment({
        orderId,
        amountInCents,
        payerEmail: customerEmail,
        payerName: customerName,
      })
      if (result?.serverError) { toast.error(result.serverError); return }
      const p = result?.data?.payment
      if (!p) return
      setCurrentPix({
        id: p.id,
        qrCodeBase64: p.qrCodeBase64 ?? "",
        pixCopyPaste: p.pixCopyPaste ?? "",
        transactionAmountInCents: p.transactionAmountInCents,
      })
      toast.success("Cobrança PIX gerada!")
    })
  }

  const handleCancelPix = () => {
    if (!currentPix) return
    startTransition(async () => {
      const result = await cancelPayment({ paymentId: currentPix.id })
      if (result?.serverError) { toast.error("Erro ao cancelar PIX."); return }
      setCurrentPix(null)
      toast.success("PIX cancelado.")
    })
  }

  const handleApproved = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 border border-[#c9a227]/30 bg-[#c9a227]/[0.06] px-4 py-2.5 text-sm font-bold text-[#c9a227] transition-all hover:bg-[#c9a227]/10">
          <QrCode className="size-4" />
          Cobrar via PIX
        </button>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="text-base font-bold">Pagamento via PIX</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Total comanda</p>
              <p className="mt-1 text-sm font-bold text-white/70">{formatCurrency(totalInCents)}</p>
            </div>
            <div className="border border-[#c9a227]/20 bg-[#c9a227]/[0.04] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#c9a227]/60">Saldo pendente</p>
              <p className="mt-1 text-sm font-bold text-[#c9a227]">{formatCurrency(pendingInCents)}</p>
            </div>
          </div>

          {currentPix ? (
            <div>
              <PixDisplay
                paymentId={currentPix.id}
                qrCodeBase64={currentPix.qrCodeBase64}
                pixCopyPaste={currentPix.pixCopyPaste}
                amountInCents={currentPix.transactionAmountInCents}
                onApproved={handleApproved}
              />
              <button
                onClick={handleCancelPix}
                disabled={pending}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-red-500/20 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/[0.06]"
              >
                <X className="size-3.5" />
                Cancelar PIX
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor a cobrar (R$)
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
                onClick={handleCreatePix}
                disabled={pending || !amountInCents}
                className="flex items-center justify-center gap-2 bg-[#c9a227] py-3 text-sm font-bold text-black shadow-lg shadow-[#c9a227]/20 transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? <><Loader2 className="size-4 animate-spin" />Gerando...</> : <><QrCode className="size-4" />Gerar QR Code PIX</>}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
