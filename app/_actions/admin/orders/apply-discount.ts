"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

    await prisma.order.update({
      where: { id: parsedInput.orderId },
      data: {
        discountInCents: parsedInput.discountInCents,
        totalInCents: order.subtotalInCents - parsedInput.discountInCents,
      },
    })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
