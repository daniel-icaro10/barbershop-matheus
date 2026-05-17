export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { LandingPage } from "./_components/landing-page"
import { headers } from "next/headers"
import { unstable_cache } from "next/cache"

// Dados cacheados e invalidados por tag — revalidateTag("services") nas actions de item
const getStaticData = unstable_cache(
  async () => {
    const [barbershop, services] = await Promise.all([
      prisma.barbershop.findUnique({ where: { id: DEFAULT_BARBERSHOP_ID } }),
      prisma.barbershopItem.findMany({
        where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true, type: "SERVICE" },
        orderBy: { priceInCents: "asc" },
      }),
    ])
    return { barbershop, services }
  },
  ["home-static"],
  { tags: ["services"], revalidate: false },
)

export default async function HomePage() {
  const headersData = await headers()

  // Sessão primeiro (necessária para o isAdmin em paralelo)
  const session = await auth.api.getSession({ headers: headersData })

  // Dados estáticos (cache) + isAdmin em paralelo
  const [{ barbershop, services }, dbUser] = await Promise.all([
    getStaticData(),
    session?.user?.id
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
      : Promise.resolve(null),
  ])

  const isAdmin = dbUser?.role === "ADMIN"

  return <LandingPage barbershop={barbershop} services={services} isAdmin={isAdmin} />
}
