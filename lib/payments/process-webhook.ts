import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToUser, sendPushToAdmins } from "@/lib/push"
import type { Prisma } from "@/generated/prisma/client"

const FAILED_STATUSES = ["REJECTED", "CANCELED"] as const
type FailedStatus = typeof FAILED_STATUSES[number]

const STATUS_MAP: Record<string, string> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  refunded: "REFUNDED",
  canceled: "CANCELED",
  expired: "CANCELED",
}

export async function processWebhookPayload(body: Record<string, unknown>): Promise<void> {
  const type = body.type as string
  const dataId = (body.data as Record<string, unknown>)?.id as string

  if (type !== "payment" || !dataId) return

  const payment = await prisma.payment.findUnique({
    where: { externalPaymentId: String(dataId) },
    select: { id: true, orderId: true, status: true },
  })

  if (!payment) return
  if (payment.status !== "PENDING") return

  const { MercadoPagoProvider } = await import("@/lib/payments/mercadopago")
  const provider = new MercadoPagoProvider()
  const statusResult = await provider.getPaymentStatus(String(dataId))

  const newStatus = STATUS_MAP[statusResult.status] ?? null
  if (!newStatus || newStatus === payment.status) return

  const isFailed = (FAILED_STATUSES as readonly string[]).includes(newStatus)
  let customerId: string | null = null

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as "APPROVED" | "REJECTED" | "REFUNDED" | "CANCELED",
        paidAmountInCents: statusResult.paidAmountInCents ?? null,
        paidAt: statusResult.paidAt ?? null,
        webhookRaw: body as Prisma.InputJsonValue,
      },
    })

    if (newStatus === "APPROVED") {
      await tx.orderTimelineEvent.create({ data: { orderId: payment.orderId, type: "PIX_APPROVED", message: "PIX aprovado" } })

      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } } },
      })

      if (order) {
        customerId = order.customerId
        const totalPaid = order.payments.reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)
        if (totalPaid >= order.totalInCents) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "CLOSED", closedAt: new Date() },
          })
        }
      }
    }

    if (isFailed) {
      const eventType = newStatus === "REJECTED" ? "PAYMENT_REJECTED" : "PIX_CANCELED"
      const eventMsg = newStatus === "REJECTED" ? "PIX recusado" : "PIX cancelado/expirado"
      await tx.orderTimelineEvent.create({ data: { orderId: payment.orderId, type: eventType, message: eventMsg } })

      const order = await tx.order.findUnique({ where: { id: payment.orderId }, select: { customerId: true } })
      if (order) customerId = order.customerId
    }
  })

  if (newStatus === "APPROVED") {
    const paidFormatted = statusResult.paidAmountInCents
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(statusResult.paidAmountInCents / 100)
      : "PIX"

    after(async () => {
      await Promise.allSettled([
        customerId
          ? sendPushToUser(customerId, { title: "✅ Pagamento confirmado!", body: `Seu PIX de ${paidFormatted} foi aprovado.`, url: "/minha-conta" })
          : Promise.resolve(),
        sendPushToAdmins({ title: "💰 PIX aprovado", body: `Pagamento de ${paidFormatted} confirmado.`, url: `/admin/comandas/${payment.orderId}` }),
      ])
    })
  }

  if (isFailed) {
    const failLabel = (newStatus as FailedStatus) === "REJECTED" ? "recusado" : "cancelado"
    after(async () => {
      await Promise.allSettled([
        customerId
          ? sendPushToUser(customerId, { title: "⚠️ Pagamento não aprovado", body: `Seu PIX foi ${failLabel}. Acesse o app para tentar novamente ou escolher outro método.`, url: "/minha-conta" })
          : Promise.resolve(),
        sendPushToAdmins({ title: `PIX ${failLabel}`, body: `Um pagamento PIX foi ${failLabel}.`, url: `/admin/comandas/${payment.orderId}` }),
      ])
    })
  }
}
