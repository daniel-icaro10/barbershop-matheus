export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { startOfDay, endOfDay, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays, DollarSign, TrendingUp, XCircle } from "lucide-react"
import Image from "next/image"

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

export default async function AdminDashboard() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const [bookingsToday, cancelledToday, upcomingBookings, topServices, recentClients] =
    await Promise.all([
      // All active bookings today
      prisma.booking.findMany({
        where: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          cancelled: false,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: { service: { select: { priceInCents: true } } },
      }),

      // Cancelled today
      prisma.booking.count({
        where: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          cancelled: true,
          cancelledAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // Upcoming from now (next 6)
      prisma.booking.findMany({
        where: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          cancelled: false,
          date: { gte: now, lte: todayEnd },
        },
        include: {
          service: { select: { name: true, durationInMinutes: true, priceInCents: true } },
          user: { select: { name: true, image: true } },
        },
        orderBy: { date: "asc" },
        take: 6,
      }),

      // Top services (all time)
      prisma.booking.groupBy({
        by: ["serviceId"],
        where: { barbershopId: DEFAULT_BARBERSHOP_ID, cancelled: false },
        _count: { serviceId: true },
        orderBy: { _count: { serviceId: "desc" } },
        take: 4,
      }),

      // Recent unique clients
      prisma.booking.findMany({
        where: { barbershopId: DEFAULT_BARBERSHOP_ID, cancelled: false },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { date: "desc" },
        take: 20,
      }),
    ])

  // Deduplicate clients
  const seenIds = new Set<string>()
  const uniqueClients = recentClients
    .filter((b) => { if (seenIds.has(b.user.id)) return false; seenIds.add(b.user.id); return true })
    .slice(0, 5)

  // Revenue today
  const revenueToday = bookingsToday.reduce((acc, b) => acc + b.service.priceInCents, 0)

  // Service names for top services
  const serviceIds = topServices.map((s) => s.serviceId)
  const serviceNames = await prisma.barbershopService.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true, priceInCents: true },
  })
  const serviceMap = Object.fromEntries(serviceNames.map((s) => [s.id, s]))

  const stats = [
    {
      label: "Agendamentos hoje",
      value: bookingsToday.length,
      icon: CalendarDays,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Receita do dia",
      value: fmt(revenueToday),
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Cancelamentos",
      value: cancelledToday,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Ticket médio",
      value: bookingsToday.length ? fmt(revenueToday / bookingsToday.length) : "—",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
  ]

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227] capitalize">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          DASHBOARD
        </h1>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="flex flex-col gap-3 border border-white/[0.07] bg-white/[0.03] p-5"
          >
            <div className={`flex size-10 items-center justify-center ${bg}`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className="font-bebas text-[1.9rem] leading-none text-white">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Upcoming bookings */}
        <div className="border border-white/[0.07] bg-white/[0.03]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Próximos agendamentos</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {upcomingBookings.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-white/30">
                Sem agendamentos para as próximas horas
              </p>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex w-14 flex-col items-center">
                    <span className="font-bebas text-[1.1rem] leading-none text-[#c9a227]">
                      {format(booking.date, "HH:mm")}
                    </span>
                    <span className="mt-0.5 text-[9px] text-white/30">
                      {booking.service.durationInMinutes}min
                    </span>
                  </div>
                  <div className="h-8 w-px bg-white/[0.06]" />
                  <div className="flex flex-1 items-center gap-2.5 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-white/60">
                      {booking.user.image ? (
                        <Image src={booking.user.image} alt={booking.user.name} width={32} height={32} className="object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{booking.user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight text-white/80">{booking.user.name}</p>
                      <p className="truncate text-xs text-white/35">{booking.service.name}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#c9a227]">
                    {fmt(booking.service.priceInCents)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Top services */}
          <div className="border border-white/[0.07] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Serviços mais agendados</h2>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {topServices.map((ts, i) => {
                const svc = serviceMap[ts.serviceId]
                if (!svc) return null
                const maxCount = topServices[0]._count.serviceId
                const pct = Math.round((ts._count.serviceId / maxCount) * 100)
                return (
                  <div key={ts.serviceId} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-5 text-[10px] font-bold text-[#c9a227]/60">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white/75">{svc.name}</span>
                        <span className="shrink-0 text-xs text-white/30">{ts._count.serviceId}×</span>
                      </div>
                      <div className="h-[2px] w-full overflow-hidden bg-white/[0.06]">
                        <div className="h-full bg-[#c9a227]/50 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
              {topServices.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-white/25">Sem dados ainda</p>
              )}
            </div>
          </div>

          {/* Recent clients */}
          <div className="border border-white/[0.07] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Clientes recentes</h2>
            </div>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {uniqueClients.map((b) => (
                <div key={b.user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-white/60">
                    {b.user.image ? (
                      <Image src={b.user.image} alt={b.user.name} width={32} height={32} className="object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{b.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/80">{b.user.name}</p>
                    <p className="truncate text-xs text-white/30">{b.user.email}</p>
                  </div>
                </div>
              ))}
              {uniqueClients.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-white/25">Sem clientes ainda</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
