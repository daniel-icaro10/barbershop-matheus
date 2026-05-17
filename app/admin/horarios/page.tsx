export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { WorkingHoursForm } from "./_components/working-hours-form"

export default async function HorariosPage() {
  await requireAdmin()

  const workingHours = await prisma.workingHours.findMany({
    where: { barbershopId: DEFAULT_BARBERSHOP_ID },
    orderBy: { dayOfWeek: "asc" },
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Configuração</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          HORÁRIOS DE FUNCIONAMENTO
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35">
          Configure os horários de abertura e fechamento para cada dia da semana.
        </p>
      </div>

      <WorkingHoursForm
        initialConfig={workingHours.map((wh) => ({
          dayOfWeek: wh.dayOfWeek,
          openTime: wh.openTime,
          closeTime: wh.closeTime,
          isOpen: wh.isOpen,
        }))}
      />
    </div>
  )
}
