import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { processWebhookPayload } from "@/lib/payments/process-webhook"
import type { Prisma } from "@/generated/prisma/client"
import { createHmac } from "crypto"
import { addMinutes } from "date-fns"

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

  try {
    await processWebhookPayload(body)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[mercadopago webhook] processing error — enqueuing retry", err)
    await prisma.webhookRetryQueue.create({
      data: {
        payload: body as Prisma.InputJsonValue,
        nextRetryAt: addMinutes(new Date(), 1),
        lastError: message.slice(0, 500),
      },
    })
  }

  return NextResponse.json({ received: true })
}
