"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { getPaymentProvider } from "@/lib/payments"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  paymentId: z.string().uuid(),
})

export const cancelPayment = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: parsedInput.paymentId },
      select: { id: true, status: true, externalPaymentId: true, orderId: true, provider: true },
    })

    if (payment.status !== "PENDING") throw new Error("Apenas pagamentos pendentes podem ser cancelados.")

    if (payment.externalPaymentId && payment.provider === "MERCADO_PAGO") {
      try {
        const provider = getPaymentProvider()
        await provider.cancelPayment(payment.externalPaymentId)
      } catch {
        // Log but don't block — update status regardless
      }
    }

    await prisma.payment.update({
      where: { id: parsedInput.paymentId },
      data: { status: "CANCELED" },
    })

    revalidatePath(`/admin/comandas/${payment.orderId}`)
    return { success: true }
  })
