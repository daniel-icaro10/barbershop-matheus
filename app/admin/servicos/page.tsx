export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import Image from "next/image"
import { Clock, ScissorsIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ServiceEditor } from "./_components/service-editor"

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  )

export default async function ServicosPage() {
  const services = (
    await prisma.barbershopService.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID },
      orderBy: { priceInCents: "asc" },
    })
  ).sort((a, b) => Number(b.isActive) - Number(a.isActive))

  const activeCount = services.filter((s) => s.isActive).length

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          SERVIÇOS
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35">
          {activeCount} ativo{activeCount !== 1 ? "s" : ""} · {services.length} total
        </p>
      </div>

      {/* Service list */}
      <div className="flex flex-col gap-2.5">
        {services.length === 0 ? (
          <div className="flex flex-col items-center gap-4 border border-white/[0.07] bg-white/[0.03] py-20">
            <ScissorsIcon className="size-10 text-white/15" />
            <p className="text-sm text-white/30">Nenhum serviço cadastrado</p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "overflow-hidden border border-white/[0.07] bg-white/[0.03] transition-colors hover:bg-white/[0.05]",
                !service.isActive && "opacity-50",
              )}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Service image */}
                <div className="relative size-16 shrink-0 overflow-hidden">
                  <Image src={service.imageUrl} alt={service.name} fill className="object-cover" />
                  {!service.isActive && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bebas text-[1rem] tracking-wide text-white leading-tight">{service.name}</p>
                    {service.isActive ? (
                      <span className="border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                        Ativo
                      </span>
                    ) : (
                      <span className="border border-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/25">
                        Inativo
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/35">{service.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-white/30">
                      <Clock className="size-3" />
                      <span>{service.durationInMinutes} min</span>
                    </div>
                    <span className="text-sm font-bold text-[#c9a227]">{fmt(service.priceInCents)}</span>
                  </div>
                </div>

                <ServiceEditor service={service} />
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-6 text-center text-[11px] text-white/20">
        Serviços inativos ficam ocultos no agendamento de clientes.
      </p>
    </div>
  )
}
