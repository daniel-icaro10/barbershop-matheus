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
      select: { id: true, name: true, priceInCents: true, durationInMinutes: true, barbershopId: true, imageUrl: true, description: true, isActive: true, type: true },
    }),
    prisma.barbershop.findUnique({
      where: { id: DEFAULT_BARBERSHOP_ID },
      select: { phones: true, address: true, latitude: true, longitude: true, googleMapsUrl: true },
    }),
  ])

  const initialService = serviceId ? services.find((s) => s.id === serviceId) ?? null : null

  const location = barbershop ? {
    address: barbershop.address ?? "",
    latitude: barbershop.latitude ?? null,
    longitude: barbershop.longitude ?? null,
    googleMapsUrl: barbershop.googleMapsUrl ?? null,
  } : null

  return <BookingFlow services={services} initialService={initialService} location={location} />
}
