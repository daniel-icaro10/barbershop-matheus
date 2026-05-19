"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { calculateCommission } from "@/lib/utils/commission"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  customerId: z.string(),
  bookingId: z.string().uuid().optional(),
  serviceItemId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export const createOrder = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    if (parsedInput.bookingId) {
      const existing = await prisma.order.findUnique({
        where: { bookingId: parsedInput.bookingId },
        select: { id: true },
      })
      if (existing) return { order: existing }
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          customerId: parsedInput.customerId,
          bookingId: parsedInput.bookingId ?? null,
          notes: parsedInput.notes ?? null,
        },
      })
      await tx.orderTimelineEvent.create({ data: timelineEvent(newOrder.id, "ORDER_CREATED", "Comanda criada") })

      if (parsedInput.serviceItemId) {
        const item = await tx.barbershopItem.findUniqueOrThrow({ where: { id: parsedInput.serviceItemId } })
        const commission = calculateCommission(item.priceInCents, item.commissionType, item.commissionValue)
        const commissionSnapshot = item.commissionType
          ? { type: item.commissionType, value: item.commissionValue, amount: commission }
          : undefined

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            itemId: item.id,
            itemType: item.type,
            quantity: 1,
            unitPriceInCents: item.priceInCents,
            totalInCents: item.priceInCents,
            ...(commissionSnapshot !== undefined && { commissionSnapshot }),
          },
        })
        await tx.order.update({
          where: { id: newOrder.id },
          data: { subtotalInCents: item.priceInCents, totalInCents: item.priceInCents },
        })
        await tx.orderTimelineEvent.create({
          data: timelineEvent(newOrder.id, "ITEM_ADDED", `${item.name} adicionado`, {
            itemName: item.name, quantity: 1, totalInCents: item.priceInCents,
          }),
        })
      }

      return newOrder
    })
    revalidatePath("/admin/comandas")
    return { order }
  })
