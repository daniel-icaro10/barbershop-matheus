export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { ptBR } from "date-fns/locale"
import { formatInTimeZone } from "date-fns-tz"

const TZ = "America/Sao_Paulo"
import Image from "next/image"
import { Users } from "lucide-react"

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

export default async function ClientesPage() {
  const bookings = await prisma.booking.findMany({
    where: { barbershopId: DEFAULT_BARBERSHOP_ID, cancelled: false },
    include: {
      service: { select: { priceInCents: true } },
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { date: "desc" },
  })

  const clientMap = new Map<
    string,
    { id: string; name: string; email: string; image: string | null; visits: number; totalSpent: number; lastVisit: Date }
  >()

  for (const b of bookings) {
    const existing = clientMap.get(b.user.id)
    if (existing) {
      existing.visits += 1
      existing.totalSpent += b.service.priceInCents
      if (b.date > existing.lastVisit) existing.lastVisit = b.date
    } else {
      clientMap.set(b.user.id, {
        id: b.user.id,
        name: b.user.name,
        email: b.user.email,
        image: b.user.image,
        visits: 1,
        totalSpent: b.service.priceInCents,
        lastVisit: b.date,
      })
    }
  }

  const clients = [...clientMap.values()].sort((a, b) => b.visits - a.visits)

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          CLIENTES
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35">
          {clients.length} cliente{clients.length !== 1 ? "s" : ""} cadastrado{clients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-white/[0.07] bg-white/[0.03] py-16">
          <Users className="size-10 text-white/15" />
          <p className="text-sm text-white/25">Nenhum cliente ainda</p>
        </div>
      ) : (
        <>
          {/* ── Tabela desktop ── */}
          <div className="hidden sm:block border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="grid grid-cols-[1fr_150px_90px_120px] gap-4 border-b border-white/[0.06] px-5 py-3">
              {["Cliente", "Último agendamento", "Visitas", "Total gasto"].map((h) => (
                <p key={h} className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/30">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="grid grid-cols-[1fr_150px_90px_120px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-white/60">
                      {client.image ? (
                        <Image src={client.image} alt={client.name} width={36} height={36} className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold">{client.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white/80">{client.name}</p>
                      <p className="truncate text-xs text-white/30">{client.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/35 capitalize">
                    {formatInTimeZone(client.lastVisit, TZ, "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white/80">{client.visits}</span>
                    <span className="text-xs text-white/30">{client.visits === 1 ? "visita" : "visitas"}</span>
                  </div>
                  <p className="text-sm font-bold text-[#c9a227]">{fmt(client.totalSpent)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cards mobile ── */}
          <div className="sm:hidden flex flex-col gap-2.5">
            {clients.map((client) => (
              <div
                key={client.id}
                className="border border-white/[0.07] bg-white/[0.03] p-4"
              >
                {/* Linha superior: avatar + nome + email */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-white/60">
                    {client.image ? (
                      <Image src={client.image} alt={client.name} width={40} height={40} className="object-cover" />
                    ) : (
                      <span className="text-base font-bold">{client.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/90">{client.name}</p>
                    <p className="truncate text-xs text-white/35">{client.email}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#c9a227]">{fmt(client.totalSpent)}</p>
                </div>

                {/* Linha inferior: stats */}
                <div className="flex items-center gap-4 border-t border-white/[0.05] pt-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/25 mb-0.5">Visitas</p>
                    <p className="text-sm font-bold text-white/70">
                      {client.visits}
                      <span className="ml-1 text-xs font-normal text-white/30">
                        {client.visits === 1 ? "vez" : "vezes"}
                      </span>
                    </p>
                  </div>
                  <div className="h-6 w-px bg-white/[0.06]" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/25 mb-0.5">Última visita</p>
                    <p className="text-sm text-white/50 capitalize">
                      {formatInTimeZone(client.lastVisit, TZ, "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
