"use client"

import { useState, useTransition } from "react"
import { cancelBooking } from "@/app/_actions/cancel-booking"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBooking({ bookingId })
      if (result?.validationErrors || result?.serverError) {
        const msg = result?.validationErrors?._errors?.[0] ?? "Erro ao cancelar"
        toast.error(msg)
      } else {
        toast.success("Agendamento cancelado")
        router.refresh()
      }
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-[11px] text-white/25 transition-colors hover:text-red-400"
      >
        Cancelar agendamento
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-white/40">Tem certeza?</span>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="flex items-center gap-1 text-[11px] font-bold text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="size-3 animate-spin" /> : "Cancelar"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-[11px] text-white/25 transition-colors hover:text-white/50"
      >
        Não
      </button>
    </div>
  )
}
