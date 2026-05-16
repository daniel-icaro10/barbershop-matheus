"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  orderItemId: z.string().uuid(),
  orderId: z.string().uuid(),
})

export const removeOrderItem = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUniqueOrThrow({
        where: { id: parsedInput.orderItemId },
        include: { item: { select: { type: true, stockQuantity: true } } },
      })

      await tx.orderItem.delete({ where: { id: parsedInput.orderItemId } })

      if (orderItem.item.type === "PRODUCT" && orderItem.item.stockQuantity != null) {
        await tx.barbershopItem.update({
          where: { id: orderItem.itemId },
          data: { stockQuantity: { increment: orderItem.quantity } },
        })
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: parsedInput.orderId },
        select: { totalInCents: true },
      })
      const subtotal = items.reduce((s, i) => s + i.totalInCents, 0)
      const order = await tx.order.findUniqueOrThrow({
        where: { id: parsedInput.orderId },
        select: { discountInCents: true },
      })
      await tx.order.update({
        where: { id: parsedInput.orderId },
        data: { subtotalInCents: subtotal, totalInCents: Math.max(0, subtotal - order.discountInCents) },
      })
      await tx.orderTimelineEvent.create({ data: timelineEvent(orderItem.orderId, "ITEM_REMOVED", `Item removido`, {}) })
    })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
