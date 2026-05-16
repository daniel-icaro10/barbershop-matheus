import type { Prisma } from "@/generated/prisma/client"
import type { TimelineEventType } from "@/generated/prisma/client"

export function timelineEvent(
  orderId: string,
  type: TimelineEventType,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return {
    orderId,
    type,
    message,
    ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
  }
}
