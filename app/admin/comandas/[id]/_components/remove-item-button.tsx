"use client"

import { useTransition } from "react"
import { removeOrderItem } from "@/app/_actions/admin/orders/remove-order-item"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  orderItemId: string
  orderId: string
}

export function RemoveItemButton({ orderItemId, orderId }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    startTransition(async () => {
      const result = await removeOrderItem({ orderItemId, orderId })
      if (result?.serverError) { toast.error(result.serverError); return }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex size-7 shrink-0 items-center justify-center text-white/20 transition-colors hover:text-red-400 disabled:opacity-50"
      aria-label="Remover item"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  )
}
