export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { subDays } from "date-fns"
import { Users } from "lucide-react"
import { BarberCard } from "./_components/barber-card"
import { CreateBarberForm } from "./_components/create-barber-form"

export default async function BarbeirosPage() {
  await requireAdmin()

  const since30d = subDays(new Date(), 30)

  const barbers = await prisma.barber.findMany({
    where: { barbershopId: DEFAULT_BARBERSHOP_ID },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  })

  // Per-barber stats: bookings and revenue in the last 30 days
  const statsRaw = await prisma.booking.groupBy({
    by: ["barberId"],
    where: {
      barbershopId: DEFAULT_BARBERSHOP_ID,
      barberId: { not: null },
      cancelled: false,
      date: { gte: since30d },
    },
    _count: { id: true },
  })

  const revenueRaw = await prisma.payment.groupBy({
    by: ["orderId"],
    where: {
      status: "APPROVED",
      paidAt: { gte: since30d },
      order: { barbershopId: DEFAULT_BARBERSHOP_ID },
    },
    _sum: { paidAmountInCents: true },
  })

  // Map orderId → revenue
  const revenueByOrder = new Map(revenueRaw.map((r) => [r.orderId, r._sum.paidAmountInCents ?? 0]))

  // Fetch orders with barberId for revenue attribution
  const ordersWithBarber = await prisma.order.findMany({
    where: {
      id: { in: [...revenueByOrder.keys()] },
      booking: { barberId: { not: null } },
    },
    select: { id: true, booking: { select: { barberId: true } } },
  })

  const revenueByBarber = new Map<string, number>()
  for (const order of ordersWithBarber) {
    const bid = order.booking?.barberId
    if (!bid) continue
    revenueByBarber.set(bid, (revenueByBarber.get(bid) ?? 0) + (revenueByOrder.get(order.id) ?? 0))
  }

  const bookingsByBarber = new Map(statsRaw.map((s) => [s.barberId, s._count.id]))

  const total = barbers.filter((b) => b.isActive).length

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Equipe</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          BARBEIROS
        </h1>
        <p className="mt-1 text-sm text-white/30">{total} ativo{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="mb-6">
        <CreateBarberForm />
      </div>

      {barbers.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-white/[0.07] bg-white/[0.02] py-16 gap-3">
          <Users className="size-8 text-white/15" />
          <p className="text-sm text-white/25">Nenhum barbeiro cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <BarberCard
              key={barber.id}
              barber={barber}
              stats={{
                bookings30d: bookingsByBarber.get(barber.id) ?? 0,
                revenue30d: revenueByBarber.get(barber.id) ?? 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
