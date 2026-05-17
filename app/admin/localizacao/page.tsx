export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { MapPin } from "lucide-react"
import { LocationForm } from "./_components/location-form"

export default async function LocalizacaoPage() {
  await requireAdmin()

  const barbershop = await prisma.barbershop.findUniqueOrThrow({
    where: { id: DEFAULT_BARBERSHOP_ID },
    select: { address: true, latitude: true, longitude: true, googleMapsUrl: true },
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Configurações</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          LOCALIZAÇÃO
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35 flex items-center gap-1.5">
          <MapPin className="size-3" />
          {barbershop.address}
        </p>
      </div>

      <LocationForm barbershop={barbershop} />
    </div>
  )
}
