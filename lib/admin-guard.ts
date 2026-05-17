import { cache } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

// Wrapped with React cache so that layout + page both calling requireAdmin()
// within the same request deduplicate to a single DB round-trip.
export const requireAdmin = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  })

  if (!dbUser || dbUser.role !== "ADMIN") redirect("/")

  return dbUser
})
