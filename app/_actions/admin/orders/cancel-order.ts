"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

    await prisma.$transaction(async (tx) => {
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
    })

    revalidatePath("/admin/comandas")
    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
