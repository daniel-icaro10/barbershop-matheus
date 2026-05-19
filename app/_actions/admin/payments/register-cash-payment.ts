"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { assertOrderOwnership } from "@/lib/assert-order-ownership"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { timelineEvent } from "../orders/_timeline"

const inputSchema = z.object({
  orderId: z.string().uuid(),
  amountInCents: z.number().int().positive(),
})

export const registerCashPayment = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await assertOrderOwnership(parsedInput.orderId, DEFAULT_BARBERSHOP_ID)

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: parsedInput.orderId },
        include: {
          payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } },
        },
      })

      if (order.status !== "OPEN") throw new Error("Comanda não está aberta.")

      const totalPaid = order.payments.reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)
      const pending = Math.max(0, order.totalInCents - totalPaid)

      if (parsedInput.amountInCents > pending) {
        throw new Error("Valor maior que o saldo pendente.")
      }

      await tx.payment.create({
        data: {
          orderId: parsedInput.orderId,
          provider: "MANUAL",
          method: "CASH",
          status: "APPROVED",
          transactionAmountInCents: parsedInput.amountInCents,
          paidAmountInCents: parsedInput.amountInCents,
          paidAt: new Date(),
        },
      })

      await tx.orderTimelineEvent.create({
        data: timelineEvent(
          parsedInput.orderId,
          "CASH_PAYMENT_REGISTERED",
          `Pagamento em dinheiro registrado: R$ ${(parsedInput.amountInCents / 100).toFixed(2).replace(".", ",")}`,
        ),
      })
    })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    revalidatePath("/admin/comandas")
    return { success: true }
  })
