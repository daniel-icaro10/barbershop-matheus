export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { LandingPage } from "./_components/landing-page"
import { headers } from "next/headers"

export default async function HomePage() {
  const [barbershop, services, session] = await Promise.all([
    prisma.barbershop.findUnique({ where: { id: DEFAULT_BARBERSHOP_ID } }),
    prisma.barbershopService.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true },
      orderBy: { priceInCents: "asc" },
    }),
    auth.api.getSession({ headers: await headers() }),
  ])

  let isAdmin = false
  if (session?.user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    isAdmin = dbUser?.role === "ADMIN"
  }

  return <LandingPage barbershop={barbershop} services={services} isAdmin={isAdmin} />
}
