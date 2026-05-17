"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { assertOrderOwnership } from "@/lib/assert-order-ownership"
import { revalidatePath } from "next/cache"
import { calculateCommission } from "@/lib/utils/commission"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  orderId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  professionalId: z.string().optional(),
})

export const addOrderItem = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await assertOrderOwnership(parsedInput.orderId, DEFAULT_BARBERSHOP_ID)

    const [order, item] = await Promise.all([
      prisma.order.findUniqueOrThrow({ where: { id: parsedInput.orderId }, select: { id: true, status: true } }),
      prisma.barbershopItem.findUniqueOrThrow({ where: { id: parsedInput.itemId } }),
    ])

    if (order.status !== "OPEN") throw new Error("Comanda já foi fechada.")

    const unitPrice = item.priceInCents
    const total = unitPrice * parsedInput.quantity
    const commission = calculateCommission(unitPrice, item.commissionType, item.commissionValue)

    const commissionSnapshot = item.commissionType
      ? { type: item.commissionType, value: item.commissionValue, amount: commission }
      : undefined

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.create({
        data: {
          orderId: parsedInput.orderId,
          itemId: parsedInput.itemId,
          itemType: item.type,
          quantity: parsedInput.quantity,
          unitPriceInCents: unitPrice,
          totalInCents: total,
          professionalId: parsedInput.professionalId ?? null,
          ...(commissionSnapshot !== undefined && { commissionSnapshot }),
        },
      })

      if (item.type === "PRODUCT" && item.stockQuantity != null) {
        await tx.barbershopItem.update({
          where: { id: parsedInput.itemId },
          data: { stockQuantity: { decrement: parsedInput.quantity } },
        })
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: parsedInput.orderId },
        select: { totalInCents: true },
      })
      const subtotal = items.reduce((s, i) => s + i.totalInCents, 0)
      const orderData = await tx.order.findUniqueOrThrow({
        where: { id: parsedInput.orderId },
        select: { discountInCents: true },
      })
      await tx.order.update({
        where: { id: parsedInput.orderId },
        data: { subtotalInCents: subtotal, totalInCents: Math.max(0, subtotal - orderData.discountInCents) },
      })
      const itemTotal = unitPrice * parsedInput.quantity
      await tx.orderTimelineEvent.create({ data: timelineEvent(parsedInput.orderId, "ITEM_ADDED", `${item.name} adicionado`, { itemName: item.name, quantity: parsedInput.quantity, totalInCents: itemTotal }) })
    })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
