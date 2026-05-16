"use client"

import { useState, useEffect } from "react"
import { Copy, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils/money"
import Image from "next/image"

interface Props {
  paymentId: string
  qrCodeBase64: string
  pixCopyPaste: string
  amountInCents: number
  onApproved?: () => void
}

export function PixDisplay({ paymentId, qrCodeBase64, pixCopyPaste, amountInCents, onApproved }: Props) {
  const [copied, setCopied] = useState(false)
  const [polling, setPolling] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  const copy = async () => {
    await navigator.clipboard.writeText(pixCopyPaste)
    setCopied(true)
    toast.success("Código PIX copiado!")
    setTimeout(() => setCopied(false), 3000)
  }

  useEffect(() => {
    if (!polling) return

    const interval = setInterval(() => {
      setElapsed((e) => e + 5)
    }, 5000)

    const check = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`)
        if (!res.ok) return
        const data = (await res.json()) as { status: string }
        if (data.status === "APPROVED") {
          setPolling(false)
          onApproved?.()
          toast.success("Pagamento aprovado!")
        }
      } catch {
        // silent
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      clearInterval(check)
    }
  }, [paymentId, polling, onApproved])

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Amount */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Total a pagar</p>
        <p className="font-bebas text-4xl text-[#c9a227]">{formatCurrency(amountInCents)}</p>
      </div>

      {/* QR Code */}
      <div className="relative size-48 overflow-hidden border-2 border-[#c9a227]/20 bg-white p-2">
        <Image
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          fill
          className="object-contain p-2"
        />
      </div>

      {/* Polling status */}
      <div className="flex items-center gap-2 text-xs text-white/40">
        {polling ? (
          <>
            <Loader2 className="size-3.5 animate-spin text-[#c9a227]" />
            Aguardando confirmação...
          </>
        ) : (
          <>
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            Pagamento confirmado
          </>
        )}
        {polling && elapsed > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {elapsed}s
          </span>
        )}
      </div>

      {/* Copy/paste */}
      <div className="w-full space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Pix copia e cola</p>
        <div className="flex gap-2">
          <div className="flex-1 overflow-hidden border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <p className="truncate text-xs text-white/50 font-mono">{pixCopyPaste}</p>
          </div>
          <button
            onClick={copy}
            className="flex shrink-0 items-center gap-1.5 border border-[#c9a227]/30 bg-[#c9a227]/[0.06] px-3 py-2 text-xs font-bold text-[#c9a227] transition-all hover:bg-[#c9a227]/10"
          >
            {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  )
}
