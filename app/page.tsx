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
    const [barbershop, services, reviews] = await Promise.all([
      prisma.barbershop.findUnique({ where: { id: DEFAULT_BARBERSHOP_ID } }),
      prisma.barbershopItem.findMany({
        where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true, type: "SERVICE" },
        orderBy: { priceInCents: "asc" },
      }),
      prisma.review.findMany({
        where: { barbershopId: DEFAULT_BARBERSHOP_ID, approved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
    ])
    return { barbershop, services, reviews }
  },
  ["home-static"],
  { tags: ["services", "reviews"], revalidate: false },
)

export default async function HomePage() {
  const headersData = await headers()

  // Sessão primeiro (necessária para o isAdmin em paralelo)
  const session = await auth.api.getSession({ headers: headersData })

  // Dados estáticos (cache) + isAdmin em paralelo
  const [{ barbershop, services, reviews }, dbUser] = await Promise.all([
    getStaticData(),
    session?.user?.id
      ? prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
      : Promise.resolve(null),
  ])

  const isAdmin = dbUser?.role === "ADMIN"

  const serializedReviews = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return <LandingPage barbershop={barbershop} services={services} isAdmin={isAdmin} reviews={serializedReviews} />
}
