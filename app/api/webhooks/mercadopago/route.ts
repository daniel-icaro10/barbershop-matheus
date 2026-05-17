import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { createHmac } from "crypto"
import { sendPushToUser, sendPushToAdmins } from "@/lib/push"

// MP signature algorithm uses headers + query param only, not the raw body.
// Throws if MERCADO_PAGO_WEBHOOK_SECRET is not configured so the caller
// receives 500 instead of silently accepting an unauthenticated payload.
function validateSignature(req: NextRequest): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("MERCADO_PAGO_WEBHOOK_SECRET não configurado")
  }

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

  const tsNum = parseInt(ts, 10)
  const nowSec = Math.floor(Date.now() / 1000)
  if (isNaN(tsNum) || Math.abs(nowSec - tsNum) > 300) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex")

  return hmac === v1
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  let body: Record<string, unknown>
  try {
    // validateSignature is inside try so a missing secret throws → 500
    if (!validateSignature(req)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    body = JSON.parse(rawBody)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    console.error("[mercadopago webhook] setup error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
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
    })

    if (newStatus === "APPROVED") {
      const paidFormatted = statusResult.paidAmountInCents
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(statusResult.paidAmountInCents / 100)
        : "PIX"

      after(async () => {
        await Promise.allSettled([
          customerId
            ? sendPushToUser(customerId, {
                title: "✅ Pagamento confirmado!",
                body: `Seu PIX de ${paidFormatted} foi aprovado.`,
                url: "/minha-conta",
              })
            : Promise.resolve(),
          sendPushToAdmins({
            title: "💰 PIX aprovado",
            body: `Pagamento de ${paidFormatted} confirmado.`,
            url: `/admin/comandas/${payment.orderId}`,
          }),
        ])
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[mercadopago webhook]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
