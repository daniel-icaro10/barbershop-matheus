"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  orderId: z.string().uuid(),
  discountInCents: z.number().int().nonnegative(),
})

export const applyDiscount = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: parsedInput.orderId },
      select: { status: true, subtotalInCents: true },
    })

    if (order.status !== "OPEN") throw new Error("Comanda não está aberta.")
    if (parsedInput.discountInCents > order.subtotalInCents) {
      throw new Error("Desconto não pode ser maior que o subtotal.")
    }

    const { orderId, discountInCents } = parsedInput
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          discountInCents,
          totalInCents: order.subtotalInCents - discountInCents,
        },
      })
      await tx.orderTimelineEvent.create({ data: timelineEvent(orderId, "DISCOUNT_APPLIED", `Desconto de ${discountInCents / 100} aplicado`, { discountInCents }) })
    })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
