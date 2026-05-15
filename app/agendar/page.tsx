import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import BookingFlow from "./_components/booking-flow"

export const dynamic = "force-dynamic"

export default async function AgendarPage() {
  const [services, barbershop] = await Promise.all([
    prisma.barbershopService.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true },
      orderBy: { priceInCents: "asc" },
    }),
    prisma.barbershop.findUnique({
      where: { id: DEFAULT_BARBERSHOP_ID },
      select: { phones: true },
    }),
  ])

  const rawPhone = barbershop?.phones?.[0]?.replace(/\D/g, "") ?? ""
  const whatsappPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`

  return <BookingFlow services={services} whatsappPhone={whatsappPhone} />
}
