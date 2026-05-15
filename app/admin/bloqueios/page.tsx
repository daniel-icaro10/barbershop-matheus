export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { BlockedTimesManager } from "./_components/blocked-times-manager"

export default async function BloqueiosPage() {
  const blockedTimes = await prisma.blockedTime.findMany({
    where: {
      barbershopId: DEFAULT_BARBERSHOP_ID,
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          BLOQUEIOS DE HORÁRIO
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35">
          Bloqueie períodos específicos — almoço, férias, manutenção ou encaixes manuais.
        </p>
      </div>

      <BlockedTimesManager
        initial={blockedTimes.map((b) => ({
          id: b.id,
          startDate: b.startDate.toISOString(),
          endDate: b.endDate.toISOString(),
          reason: b.reason,
        }))}
      />
    </div>
  )
}
