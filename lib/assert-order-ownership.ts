import { prisma } from "@/lib/prisma"

/**
 * Throws if the given order does not belong to the given barbershop.
 * Call at the start of any admin action that accepts an orderId, so that
 * a future multi-tenant scenario cannot leak operations across barbershops.
 */
export async function assertOrderOwnership(orderId: string, barbershopId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { barbershopId: true },
  })
  if (!order || order.barbershopId !== barbershopId) {
    throw new Error("Order não encontrada")
  }
}
