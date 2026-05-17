export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { Star, MessageSquare } from "lucide-react"
import { ReviewCard } from "./_components/review-card"
import Link from "next/link"

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AvaliacoesPage({ searchParams }: Props) {
  await requireAdmin()

  const { filter } = await searchParams
  const showAll = filter === "all"

  const reviews = await prisma.review.findMany({
    where: {
      barbershopId: DEFAULT_BARBERSHOP_ID,
      ...(!showAll ? { approved: false } : {}),
    },
    include: {
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const allReviews = await prisma.review.findMany({
    where: { barbershopId: DEFAULT_BARBERSHOP_ID },
    select: { rating: true, approved: true },
  })

  const total = allReviews.length
  const avg = total > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    : "—"

  const pendingCount = allReviews.filter((r) => !r.approved).length

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          AVALIAÇÕES
        </h1>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="border border-white/[0.07] bg-white/[0.03] p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="size-3.5 fill-[#c9a227] text-[#c9a227]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Média</p>
          </div>
          <p className="font-bebas text-3xl text-white">{avg}</p>
        </div>
        <div className="border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30 mb-1">Total</p>
          <p className="font-bebas text-3xl text-white">{total}</p>
        </div>
        <div className="border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-400/60 mb-1">Pendentes</p>
          <p className="font-bebas text-3xl text-amber-400">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-1">
        <Link
          href="/admin/avaliacoes"
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            !showAll ? "border-[#c9a227]/30 bg-[#c9a227]/[0.08] text-[#c9a227]" : "border-white/[0.07] text-white/30 hover:text-white/60"
          }`}
        >
          Pendentes ({pendingCount})
        </Link>
        <Link
          href="/admin/avaliacoes?filter=all"
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            showAll ? "border-[#c9a227]/30 bg-[#c9a227]/[0.08] text-[#c9a227]" : "border-white/[0.07] text-white/30 hover:text-white/60"
          }`}
        >
          Todas ({total})
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-white/[0.07] bg-white/[0.03] py-20">
          <MessageSquare className="size-10 text-white/15" />
          <p className="text-sm text-white/30">
            {showAll ? "Nenhuma avaliação ainda" : "Nenhuma avaliação pendente"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
