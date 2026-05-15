export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { LandingPage } from "./_components/landing-page"

export default async function HomePage() {
  const [barbershop, services] = await Promise.all([
    prisma.barbershop.findUnique({
      where: { id: DEFAULT_BARBERSHOP_ID },
    }),
    prisma.barbershopService.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true },
      orderBy: { priceInCents: "asc" },
    }),
  ])

  return <LandingPage barbershop={barbershop} services={services} />
}
