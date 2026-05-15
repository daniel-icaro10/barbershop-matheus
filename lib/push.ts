import webpush from "web-push"
import { prisma } from "./prisma"

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? "contato@example.com"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Remove expired/invalid subscriptions (410 Gone)
  const toDelete: string[] = []
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        toDelete.push(subs[i].endpoint)
      }
    }
  })
  if (toDelete.length) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: toDelete } } })
  }
}
