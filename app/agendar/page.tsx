import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import BookingFlow from "./_components/booking-flow"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ serviceId?: string }>
}

export default async function AgendarPage({ searchParams }: Props) {
  const { serviceId } = await searchParams

  const [services, barbershop] = await Promise.all([
    prisma.barbershopItem.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true, type: "SERVICE" },
      orderBy: { priceInCents: "asc" },
    }),
    prisma.barbershop.findUnique({
      where: { id: DEFAULT_BARBERSHOP_ID },
      select: { phones: true },
    }),
  ])

  const rawPhone = barbershop?.phones?.[0]?.replace(/\D/g, "") ?? ""
  const whatsappPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`
  const initialService = serviceId ? services.find((s) => s.id === serviceId) ?? null : null

  return <BookingFlow services={services} whatsappPhone={whatsappPhone} initialService={initialService} />
}
