import { createSafeActionClient } from "next-safe-action"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export const actionClient = createSafeActionClient()

export const adminActionClient = createSafeActionClient().use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (dbUser?.role !== "ADMIN") throw new Error("Forbidden")

  return next({ ctx: { userId: session.user.id } })
})
