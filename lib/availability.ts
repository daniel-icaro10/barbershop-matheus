import { endOfDay, startOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

export interface Interval {
  start: Date
  end: Date
}

// Half-open interval overlap: [startA, endA) vs [startB, endB)
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start
}

const DEFAULT_OPEN = "09:00"
const DEFAULT_CLOSE = "19:00"

export interface GetAvailableSlotsParams {
  date: Date
  barbershopId: string
  durationInMinutes: number
  barberId?: string // reserved: future multi-barber support
}

function slotToDate(date: Date, slot: string): Date {
  const [h, m] = slot.split(":").map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d
}

// Generate 30-min interval start times between openTime and closeTime
function generateSlots(openTime: string, closeTime: string): string[] {
  const [oh, om] = openTime.split(":").map(Number)
  const [ch, cm] = closeTime.split(":").map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  const slots: string[] = []
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`)
    cur += 30
  }
  return slots
}

export async function getAvailableSlots(params: GetAvailableSlotsParams): Promise<string[]> {
  const { date, barbershopId, durationInMinutes } = params

  const dayOfWeek = date.getDay()

  const [workingHours, blockedTimes, bookings] = await Promise.all([
    prisma.workingHours.findUnique({
      where: { barbershopId_dayOfWeek: { barbershopId, dayOfWeek } },
    }),
    prisma.blockedTime.findMany({
      where: {
        barbershopId,
        startDate: { lte: endOfDay(date) },
        endDate: { gte: startOfDay(date) },
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.booking.findMany({
      where: {
        barbershopId,
        cancelled: false,
        date: { gte: startOfDay(date), lte: endOfDay(date) },
        // Future: ...(params.barberId ? { barberId: params.barberId } : {}),
      },
      select: { date: true, endDate: true },
    }),
  ])

  // Day is closed
  if (workingHours && !workingHours.isOpen) return []

  const openTime = workingHours?.openTime ?? DEFAULT_OPEN
  const closeTime = workingHours?.closeTime ?? DEFAULT_CLOSE
  const allSlots = generateSlots(openTime, closeTime)

  const closeDate = slotToDate(date, closeTime)

  const now = new Date()

  return allSlots.filter((slot) => {
    const slotStart = slotToDate(date, slot)
    const slotEnd = new Date(slotStart.getTime() + durationInMinutes * 60_000)

    // Skip past slots (only relevant for today)
    if (slotStart <= now) return false

    // Service must finish before or at closing time
    if (slotEnd > closeDate) return false

    // Check against blocked times
    const blockedConflict = blockedTimes.some((bt) =>
      intervalsOverlap(
        { start: slotStart, end: slotEnd },
        { start: bt.startDate, end: bt.endDate },
      ),
    )
    if (blockedConflict) return false

    // Check against existing bookings
    return !bookings.some((booking) => {
      const bookingEnd =
        booking.endDate ?? new Date(booking.date.getTime() + 30 * 60_000)
      return intervalsOverlap(
        { start: slotStart, end: slotEnd },
        { start: booking.date, end: bookingEnd },
      )
    })
  })
}
