"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { timelineEvent } from "./_timeline"

const inputSchema = z.object({
  orderId: z.string().uuid(),
})

export const closeOrder = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: parsedInput.orderId },
      include: {
        payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } },
      },
    })

    if (order.status !== "OPEN") throw new Error("Comanda não está aberta.")

    const totalPaid = order.payments.reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)
    if (totalPaid < order.totalInCents) {
      throw new Error(`Saldo pendente de ${((order.totalInCents - totalPaid) / 100).toFixed(2)}`)
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: parsedInput.orderId },
        data: { status: "CLOSED", closedAt: new Date() },
      })
      await tx.orderTimelineEvent.create({ data: timelineEvent(parsedInput.orderId, "ORDER_CLOSED", "Comanda fechada") })
    })

    revalidatePath("/admin/comandas")
    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { success: true }
  })
