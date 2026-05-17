import { prisma } from "@/lib/prisma"

/**
 * DB-based rate limiter — safe on multi-instance Vercel deployments.
 * Counts bookings created by the user within the last `windowMs` ms.
 */
export async function rateLimitBooking(userId: string, limit: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs)
  const count = await prisma.booking.count({
    where: { userId, createdAt: { gte: since } },
  })
  return count < limit
}
