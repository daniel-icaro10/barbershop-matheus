import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { processWebhookPayload } from "@/lib/payments/process-webhook"
import { sendPushToAdmins } from "@/lib/push"
import { addMinutes } from "date-fns"

const MAX_ATTEMPTS = 5

function backoffMinutes(attempts: number): number {
  return Math.pow(2, attempts) // 2, 4, 8, 16, 32 minutes
}

function safeCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
  // x-cron-secret kept for backward compatibility with manual calls.
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  const custom = req.headers.get("x-cron-secret") ?? ""
  if (!secret || (!safeCompare(bearer, secret) && !safeCompare(custom, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const pending = await prisma.webhookRetryQueue.findMany({
    where: {
      processedAt: null,
      attempts: { lt: MAX_ATTEMPTS },
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { nextRetryAt: "asc" },
    take: 20,
  })

  const results = await Promise.allSettled(
    pending.map(async (item) => {
      try {
        await processWebhookPayload(item.payload as Record<string, unknown>)
        await prisma.webhookRetryQueue.update({
          where: { id: item.id },
          data: { processedAt: new Date() },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const newAttempts = item.attempts + 1
        await prisma.webhookRetryQueue.update({
          where: { id: item.id },
          data: {
            attempts: newAttempts,
            lastError: message.slice(0, 500),
            nextRetryAt: addMinutes(new Date(), backoffMinutes(newAttempts)),
          },
        })
        if (newAttempts >= MAX_ATTEMPTS) {
          await sendPushToAdmins({
            title: "⚠️ Webhook falhou definitivamente",
            body: `ID: ${item.id.slice(0, 8)} — ${message.slice(0, 80)}`,
            url: "/admin",
          }).catch(() => undefined)
        }
      }
    }),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ processed: pending.length, succeeded, failed })
}
