import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { createHmac } from "crypto"

function validateSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) return true

  const xSignature = req.headers.get("x-signature") ?? ""
  const xRequestId = req.headers.get("x-request-id") ?? ""
  const url = new URL(req.url)
  const dataId = url.searchParams.get("data.id") ?? ""

  const parts: Record<string, string> = {}
  xSignature.split(",").forEach((part) => {
    const [k, v] = part.trim().split("=")
    if (k && v) parts[k] = v
  })

  const ts = parts["ts"] ?? ""
  const v1 = parts["v1"] ?? ""

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex")

  return hmac === v1
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!validateSignature(req, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const type = body.type as string
  const dataId = (body.data as Record<string, unknown>)?.id as string

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true })
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { externalPaymentId: String(dataId) },
      select: { id: true, orderId: true, status: true },
    })

    if (!payment) return NextResponse.json({ received: true })
    if (payment.status !== "PENDING") return NextResponse.json({ received: true })

    const { MercadoPagoProvider } = await import("@/lib/payments/mercadopago")
    const provider = new MercadoPagoProvider()
    const statusResult = await provider.getPaymentStatus(String(dataId))

    const statusMap: Record<string, string> = {
      approved: "APPROVED",
      rejected: "REJECTED",
      refunded: "REFUNDED",
      canceled: "CANCELED",
    }
    const newStatus = statusMap[statusResult.status] ?? null

    if (!newStatus || newStatus === payment.status) {
      return NextResponse.json({ received: true })
    }

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
        const order = await tx.order.findUnique({
          where: { id: payment.orderId },
          include: { payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } } },
        })

        if (order) {
          const totalPaid = order.payments.reduce((s, p) => s + (p.paidAmountInCents ?? 0), 0)
          if (totalPaid >= order.totalInCents) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "CLOSED", closedAt: new Date() },
            })
          }
        }
      }
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[mercadopago webhook]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
