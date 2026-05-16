"use client"

import { useTransition } from "react"
import { approveReview } from "@/app/_actions/admin/reviews/approve-review"
import { deleteReview } from "@/app/_actions/admin/reviews/delete-review"
import { toast } from "sonner"
import { Star, Trash2, CheckCircle2, EyeOff, Loader2 } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"
import { useRouter } from "next/navigation"

const TZ = "America/Sao_Paulo"

interface Props {
  review: {
    id: string
    rating: number
    comment: string | null
    approved: boolean
    createdAt: Date
    customer: { name: string; email: string }
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-[#c9a227] text-[#c9a227]" : "text-white/15"}`}
        />
      ))}
    </div>
  )
}

export function ReviewCard({ review }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await approveReview({ reviewId: review.id, approved: !review.approved })
      if (result?.serverError) { toast.error("Erro ao atualizar avaliação."); return }
      toast.success(review.approved ? "Avaliação ocultada." : "Avaliação aprovada.")
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteReview({ reviewId: review.id })
      if (result?.serverError) { toast.error("Erro ao excluir avaliação."); return }
      toast.success("Avaliação excluída.")
      router.refresh()
    })
  }

  return (
    <div className={`border border-white/[0.07] bg-white/[0.03] p-4 ${!review.approved ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Stars rating={review.rating} />
            {!review.approved && (
              <span className="border border-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.3em] text-white/25">
                Oculta
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white/80">{review.customer.name}</p>
          {review.comment && (
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed">{review.comment}</p>
          )}
          <p className="mt-2 text-[10px] text-white/20">
            {formatInTimeZone(review.createdAt, TZ, "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleToggle}
            disabled={pending}
            className={`flex size-8 items-center justify-center border transition-all ${
              review.approved
                ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/[0.06]"
                : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/[0.06]"
            } disabled:opacity-50`}
            aria-label={review.approved ? "Ocultar" : "Aprovar"}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : review.approved ? <EyeOff className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="flex size-8 items-center justify-center border border-red-500/20 text-red-400 transition-all hover:bg-red-500/[0.06] disabled:opacity-50"
            aria-label="Excluir avaliação"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
