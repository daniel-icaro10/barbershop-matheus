import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { sendBookingReminderEmail } from "@/lib/email/send-booking-emails"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { startOfDay, endOfDay, addDays } from "date-fns"
import { APP_TIMEZONE } from "@/lib/constants/timezone"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const zonedNow = toZonedTime(now, APP_TIMEZONE)
  const tomorrowZoned = addDays(zonedNow, 1)

  const tomorrowStart = fromZonedTime(startOfDay(tomorrowZoned), APP_TIMEZONE)
  const tomorrowEnd = fromZonedTime(endOfDay(tomorrowZoned), APP_TIMEZONE)

  const bookings = await prisma.booking.findMany({
    where: {
      barbershopId: DEFAULT_BARBERSHOP_ID,
      cancelled: false,
      date: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: {
      user: { select: { name: true, email: true } },
      service: { select: { name: true, priceInCents: true, durationInMinutes: true } },
    },
  })

  const results = await Promise.allSettled(
    bookings.map((b) =>
      sendBookingReminderEmail({
        to: b.user.email,
        clientName: b.user.name ?? "Cliente",
        serviceName: b.service.name,
        servicePrice: b.service.priceInCents,
        durationInMinutes: b.service.durationInMinutes,
        bookingDate: b.date,
      })
    )
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ sent, failed, total: bookings.length })
}
