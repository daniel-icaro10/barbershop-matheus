export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { startOfDay, endOfDay, format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AgendaTimeline } from "./_components/agenda-timeline"

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function AgendaPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams
  const selectedDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date()
  selectedDate.setHours(0, 0, 0, 0)

  const prevDate = format(addDays(selectedDate, -1), "yyyy-MM-dd")
  const nextDate = format(addDays(selectedDate, 1), "yyyy-MM-dd")
  const todayParam = format(new Date(), "yyyy-MM-dd")

  const [bookings, workingHours] = await Promise.all([
    prisma.booking.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        cancelled: false,
        date: { gte: startOfDay(selectedDate), lte: endOfDay(selectedDate) },
      },
      include: {
        service: { select: { name: true, durationInMinutes: true, priceInCents: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { date: "asc" },
    }),

    prisma.workingHours.findUnique({
      where: {
        barbershopId_dayOfWeek: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          dayOfWeek: selectedDate.getDay(),
        },
      },
    }),
  ])

  const openTime = workingHours?.openTime ?? "09:00"
  const closeTime = workingHours?.closeTime ?? "19:00"
  const isClosed = workingHours ? !workingHours.isOpen : false

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-px w-5 bg-[#c9a227]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Agenda</span>
          </div>
          <h1 className="font-bebas text-white leading-[0.88] capitalize" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h1>
        </div>

        {/* Day navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/agenda?date=${prevDate}`}
            className="flex size-9 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-[#c9a227]/30 hover:text-[#c9a227]"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/admin/agenda?date=${todayParam}`}
            className="border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40 transition-all hover:border-[#c9a227]/30 hover:text-[#c9a227]"
          >
            Hoje
          </Link>
          <Link
            href={`/admin/agenda?date=${nextDate}`}
            className="flex size-9 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-[#c9a227]/30 hover:text-[#c9a227]"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {isClosed ? (
        <div className="flex items-center justify-center border border-white/[0.07] bg-white/[0.03] py-20">
          <p className="text-sm text-white/30">Barbearia fechada este dia</p>
        </div>
      ) : (
        <AgendaTimeline
          bookings={bookings.map((b) => ({
            id: b.id,
            date: b.date.toISOString(),
            endDate: b.endDate?.toISOString() ?? null,
            service: b.service,
            user: b.user,
          }))}
          openTime={openTime}
          closeTime={closeTime}
        />
      )}
    </div>
  )
}
