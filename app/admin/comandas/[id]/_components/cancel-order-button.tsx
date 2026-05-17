"use client"

import { useTransition } from "react"
import { cancelOrder } from "@/app/_actions/admin/orders/cancel-order"
import { toast } from "sonner"
import { XCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    if (!confirm("Cancelar esta comanda? Esta ação não pode ser desfeita.")) return
    startTransition(async () => {
      const result = await cancelOrder({ orderId })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Comanda cancelada.")
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex flex-1 items-center justify-center gap-2 border border-red-500/30 bg-red-500/[0.06] py-2.5 text-sm font-bold text-red-400 transition-all hover:bg-red-500/[0.10] disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
      Cancelar comanda
    </button>
  )
}
