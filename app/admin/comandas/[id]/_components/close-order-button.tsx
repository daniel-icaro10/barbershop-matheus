"use client"

import { useTransition } from "react"
import { closeOrder } from "@/app/_actions/admin/orders/close-order"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CloseOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    startTransition(async () => {
      const result = await closeOrder({ orderId })
      if (result?.serverError) { toast.error(result.serverError); return }
      toast.success("Comanda fechada com sucesso!")
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex flex-1 items-center justify-center gap-2 border border-emerald-500/30 bg-emerald-500/[0.08] py-2.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/[0.12] disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Fechar comanda
    </button>
  )
}
