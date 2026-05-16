"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { getPaymentProvider } from "@/lib/payments"
import { featureFlags } from "@/lib/feature-flags"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  orderId: z.string().uuid(),
  amountInCents: z.number().int().positive(),
  payerEmail: z.string().email(),
  payerName: z.string().min(1),
})

export const createPixPayment = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    if (!featureFlags.pixEnabled) throw new Error("PIX não está habilitado.")

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: parsedInput.orderId },
      select: { id: true, status: true, totalInCents: true },
    })

    if (order.status !== "OPEN") throw new Error("Comanda não está aberta.")
    if (parsedInput.amountInCents > order.totalInCents) {
      throw new Error("Valor não pode ser maior que o total da comanda.")
    }

    const pendingExists = await prisma.payment.findFirst({
      where: { orderId: parsedInput.orderId, status: "PENDING", method: "PIX" },
      select: { id: true },
    })
    if (pendingExists) throw new Error("Já existe um pagamento PIX pendente para esta comanda.")

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const provider = getPaymentProvider()

    const result = await provider.createPixPayment({
      orderId: parsedInput.orderId,
      amountInCents: parsedInput.amountInCents,
      description: "Matheus Barbeiro",
      payerEmail: parsedInput.payerEmail,
      payerName: parsedInput.payerName,
      notificationUrl: `${appUrl}/api/webhooks/mercadopago`,
    })

    const payment = await prisma.payment.create({
      data: {
        orderId: parsedInput.orderId,
        provider: "MERCADO_PAGO",
        method: "PIX",
        status: "PENDING",
        externalPaymentId: result.externalPaymentId,
        qrCode: result.qrCode,
        qrCodeBase64: result.qrCodeBase64,
        pixCopyPaste: result.pixCopyPaste,
        transactionAmountInCents: parsedInput.amountInCents,
      },
    })

    await prisma.orderTimelineEvent.create({ data: { orderId: parsedInput.orderId, type: "PIX_GENERATED", message: `PIX gerado — ${(parsedInput.amountInCents / 100).toFixed(2).replace(".", ",")}` } })

    revalidatePath(`/admin/comandas/${parsedInput.orderId}`)
    return { payment }
  })
