"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { getPaymentProvider } from "@/lib/payments"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  orderId: z.string().uuid(),
})

export const cancelOrder = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: parsedInput.orderId },
      select: { status: true },
    })

    if (order.status === "CLOSED") throw new Error("Comanda já fechada não pode ser cancelada.")

    // Cancel any pending PIX payments at MP before touching the DB
    const pendingPixPayments = await prisma.payment.findMany({
      where: { orderId: parsedInput.orderId, status: "PENDING", provider: "MERCADO_PAGO" },
      select: { id: true, externalPaymentId: true },
    })

    const provider = pendingPixPayments.length > 0 ? getPaymentProvider() : null
    for (const p of pendingPixPayments) {
      if (p.externalPaymentId && provider) {
        await provider.cancelPayment(p.externalPaymentId).catch(() => {})
      }
    }

    await prisma.$transaction(async (tx) => {
      // Mark all pending payments as CANCELED
      if (pendingPixPayments.length > 0) {
        await tx.payment.updateMany({
          where: { id: { in: pendingPixPayments.map((p) => p.id) } },
          data: { status: "CANCELED" },
        })
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: parsedInput.orderId },
        include: { item: { select: { type: true } } },
      })

      for (const item of items) {
        if (item.item.type === "PRODUCT") {
          await tx.barbershopItem.update({
            where: { id: item.itemId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      }

      await tx.order.update({
        where: { id: parsedInput.orderId },
        data: { status: "CANCELED" },
      })
      await tx.orderTimelineEvent.create({ data: timelineEvent(parsedInput.orderId, "ORDER_CANCELED", "Comanda cancelada") })
    })

    revalidatePath("/admin/comandas")
    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
