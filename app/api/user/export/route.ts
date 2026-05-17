import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const [user, bookings, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { userId },
      select: {
        id: true,
        date: true,
        service: { select: { name: true, durationInMinutes: true, priceInCents: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.order.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        status: true,
        totalInCents: true,
        createdAt: true,
        items: { select: { itemType: true, quantity: true, unitPriceInCents: true, totalInCents: true } },
        payments: { select: { status: true, paidAmountInCents: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), user, bookings, orders },
    {
      headers: {
        "Content-Disposition": `attachment; filename="meus-dados-${userId.slice(0, 8)}.json"`,
        "Content-Type": "application/json",
      },
    },
  )
}
