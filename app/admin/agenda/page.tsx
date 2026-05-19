export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { fromZonedTime, formatInTimeZone } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AgendaTimeline } from "./_components/agenda-timeline"

const TZ = "America/Sao_Paulo"
const DAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]

interface Props {
  searchParams: Promise<{ date?: string }>
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default async function AgendaPage({ searchParams }: Props) {
  await requireAdmin()

  const { date: dateParam } = await searchParams
  const now = new Date()
  const todayStr = formatInTimeZone(now, TZ, "yyyy-MM-dd")
  const dateStr = dateParam ?? todayStr

  const [yr, mo, dy] = dateStr.split("-").map(Number)

  const dayStart = fromZonedTime(new Date(yr, mo - 1, dy, 0, 0, 0), TZ)
  const dayEnd   = fromZonedTime(new Date(yr, mo - 1, dy, 23, 59, 59, 999), TZ)
  const dow      = new Date(yr, mo - 1, dy).getDay()

  // Monday of the selected week
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const mondayD  = new Date(yr, mo - 1, dy + mondayOffset)
  const sundayD  = new Date(mondayD.getFullYear(), mondayD.getMonth(), mondayD.getDate() + 6)

  const weekStartUTC = fromZonedTime(new Date(mondayD.getFullYear(), mondayD.getMonth(), mondayD.getDate(), 0, 0, 0), TZ)
  const weekEndUTC   = fromZonedTime(new Date(sundayD.getFullYear(), sundayD.getMonth(), sundayD.getDate(), 23, 59, 59, 999), TZ)

  const prevWeekD = new Date(mondayD.getFullYear(), mondayD.getMonth(), mondayD.getDate() - 7)
  const nextWeekD = new Date(mondayD.getFullYear(), mondayD.getMonth(), mondayD.getDate() + 7)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayD.getFullYear(), mondayD.getMonth(), mondayD.getDate() + i)
    return { str: toDateStr(d), day: d.getDate(), abbr: DAY_ABBR[d.getDay()] }
  })

  const [bookings, weekRaw, workingHours] = await Promise.all([
    prisma.booking.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        cancelled: false,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        service: { select: { name: true, durationInMinutes: true, priceInCents: true } },
        user:    { select: { id: true, name: true, email: true, image: true, phone: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        cancelled: false,
        date: { gte: weekStartUTC, lte: weekEndUTC },
      },
      select: { date: true },
    }),
    prisma.workingHours.findUnique({
      where: { barbershopId_dayOfWeek: { barbershopId: DEFAULT_BARBERSHOP_ID, dayOfWeek: dow } },
    }),
  ])

  const countsByDay: Record<string, number> = {}
  weekRaw.forEach((b) => {
    const d = formatInTimeZone(b.date, TZ, "yyyy-MM-dd")
    countsByDay[d] = (countsByDay[d] ?? 0) + 1
  })
  const weekTotal = Object.values(countsByDay).reduce((a, b) => a + b, 0)

  const openTime  = workingHours?.openTime ?? "09:00"
  const closeTime = workingHours?.closeTime ?? "19:00"
  const isClosed  = workingHours ? !workingHours.isOpen : false

  const mondayLabel = formatInTimeZone(weekStartUTC, TZ, "dd MMM", { locale: ptBR })
  const sundayLabel = formatInTimeZone(weekEndUTC,   TZ, "dd MMM yyyy", { locale: ptBR })

  return (
    <div className="p-4 sm:p-6">
      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/admin/agenda?date=${toDateStr(prevWeekD)}`}
          className="flex size-9 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-[#c9a227]/30 hover:text-[#c9a227]"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <p className="text-[11px] font-semibold capitalize text-white/50 tabular-nums">
          {mondayLabel} — {sundayLabel}
        </p>
        <Link
          href={`/admin/agenda?date=${toDateStr(nextWeekD)}`}
          className="flex size-9 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-[#c9a227]/30 hover:text-[#c9a227]"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Day strip */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {weekDays.map((d) => {
          const isSelected = d.str === dateStr
          const hasBookings = (countsByDay[d.str] ?? 0) > 0
          return (
            <Link
              key={d.str}
              href={`/admin/agenda?date=${d.str}`}
              className={`flex flex-col items-center gap-1 rounded-xl py-2.5 transition-all ${
                isSelected
                  ? "bg-[#c9a227] shadow-[0_0_20px_rgba(201,162,39,0.3)]"
                  : "border border-white/[0.07] bg-white/[0.03] hover:border-[#c9a227]/30"
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wide ${isSelected ? "text-black/60" : "text-white/35"}`}>
                {d.abbr}
              </span>
              <span className={`text-sm font-bold tabular-nums leading-none ${isSelected ? "text-black" : "text-white"}`}>
                {d.day}
              </span>
              <div className={`size-1.5 rounded-full transition-opacity ${hasBookings ? (isSelected ? "bg-black/30" : "bg-emerald-400") : "opacity-0"}`} />
            </Link>
          )
        })}
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="border border-[#c9a227]/20 bg-[#c9a227]/[0.06] p-4">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-[#c9a227]/60">Hoje</p>
          <p className="font-bebas text-5xl leading-none text-white">{countsByDay[todayStr] ?? 0}</p>
          <p className="mt-1 text-[10px] text-white/25">agendamentos</p>
        </div>
        <div className="border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">Esta semana</p>
          <p className="font-bebas text-5xl leading-none text-white">{weekTotal}</p>
          <p className="mt-1 text-[10px] text-white/25">agendamentos</p>
        </div>
      </div>

      {/* Timeline */}
      {isClosed ? (
        <div className="flex items-center justify-center border border-white/[0.07] bg-white/[0.03] py-16">
          <p className="text-sm text-white/30">Barbearia fechada este dia</p>
        </div>
      ) : (
        <AgendaTimeline
          bookings={bookings.map((b) => ({
            id:      b.id,
            date:    b.date.toISOString(),
            endDate: b.endDate?.toISOString() ?? null,
            service: b.service,
            user:    { ...b.user, phone: b.user.phone ?? null },
          }))}
          openTime={openTime}
          closeTime={closeTime}
        />
      )}
    </div>
  )
}
