import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { prisma } from "@/lib/prisma"
import { APP_TIMEZONE } from "@/lib/constants/timezone"

export interface Interval {
  start: Date
  end: Date
}

// Half-open interval overlap: [startA, endA) vs [startB, endB)
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start
}

const TIMEZONE = APP_TIMEZONE
const DEFAULT_OPEN = "09:00"
const DEFAULT_CLOSE = "19:00"

export interface GetAvailableSlotsParams {
  date: Date
  barbershopId: string
  durationInMinutes: number
  barberId?: string
}

// Converts a "HH:mm" slot string to a UTC Date, interpreting the time in Brazil timezone
function slotToDate(date: Date, slot: string): Date {
  const [h, m] = slot.split(":").map(Number)
  const zoned = toZonedTime(date, TIMEZONE)
  zoned.setHours(h, m, 0, 0)
  return fromZonedTime(zoned, TIMEZONE)
}

// Generate slot start times aligned to the service duration.
// Step = durationInMinutes so a 45-min service yields 09:00, 09:45, 10:30…
// and a 60-min service yields 09:00, 10:00, 11:00…
// Minimum enforced at schema level (create-item / update-item): min(15).
function generateSlots(openTime: string, closeTime: string, durationInMinutes: number): string[] {
  const [oh, om] = openTime.split(":").map(Number)
  const [ch, cm] = closeTime.split(":").map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  const step = durationInMinutes
  const slots: string[] = []
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`)
    cur += step
  }
  return slots
}

export async function getAvailableSlots(params: GetAvailableSlotsParams): Promise<string[]> {
  const { date, barbershopId, durationInMinutes } = params

  // Use Brazil timezone for day-of-week and day boundaries
  const zonedDate = toZonedTime(date, TIMEZONE)
  const dayOfWeek = zonedDate.getDay()
  const dayStart = fromZonedTime(startOfDay(zonedDate), TIMEZONE)
  const dayEnd = fromZonedTime(endOfDay(zonedDate), TIMEZONE)

  const [workingHours, blockedTimes, bookings] = await Promise.all([
    prisma.workingHours.findUnique({
      where: { barbershopId_dayOfWeek: { barbershopId, dayOfWeek } },
    }),
    prisma.blockedTime.findMany({
      where: {
        barbershopId,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.booking.findMany({
      where: {
        barbershopId,
        cancelled: false,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { date: true, endDate: true },
    }),
  ])

  // Day is closed
  if (workingHours && !workingHours.isOpen) return []

  const openTime = workingHours?.openTime ?? DEFAULT_OPEN
  const closeTime = workingHours?.closeTime ?? DEFAULT_CLOSE
  const allSlots = generateSlots(openTime, closeTime, durationInMinutes)

  const closeDate = slotToDate(date, closeTime)
  const now = new Date()

  return allSlots.filter((slot) => {
    const slotStart = slotToDate(date, slot)
    const slotEnd = new Date(slotStart.getTime() + durationInMinutes * 60_000)

    // Skip past slots
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
