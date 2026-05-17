export const dynamic = "force-dynamic"

import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { formatCurrency } from "@/lib/utils/money"
import { formatInTimeZone } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import { startOfDay, endOfDay, subDays } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { Vault, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { OpenRegisterForm } from "./_components/open-register-form"
import { CloseRegisterForm } from "./_components/close-register-form"

const TZ = "America/Sao_Paulo"

export default async function CaixaPage() {
  await requireAdmin()

  const now = new Date()
  const zoned = toZonedTime(now, TZ)
  const todayStart = fromZonedTime(startOfDay(zoned), TZ)
  const todayEnd = fromZonedTime(endOfDay(zoned), TZ)

  const [todayRegister, history] = await Promise.all([
    prisma.cashRegister.findFirst({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        openedAt: { gte: todayStart, lte: todayEnd },
      },
      include: { openedBy: { select: { name: true } }, closedBy: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
    }),
    prisma.cashRegister.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        openedAt: { gte: fromZonedTime(startOfDay(toZonedTime(subDays(now, 30), TZ)), TZ) },
        closedAt: { not: null },
      },
      include: { openedBy: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
      take: 10,
    }),
  ])

  const isOpen = todayRegister && !todayRegister.closedAt

  let expectedRevenue = 0
  if (isOpen) {
    const agg = await prisma.payment.aggregate({
      _sum: { paidAmountInCents: true },
      where: {
        order: { barbershopId: DEFAULT_BARBERSHOP_ID },
        status: "APPROVED",
        paidAt: { gte: todayRegister!.openedAt },
      },
    })
    expectedRevenue = agg._sum.paidAmountInCents ?? 0
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Financeiro</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          CAIXA DIÁRIO
        </h1>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Today status */}
        <div>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Hoje</h2>
          {!todayRegister && <OpenRegisterForm />}
          {todayRegister && isOpen && (
            <CloseRegisterForm
              register={{
                id: todayRegister.id,
                openedAt: todayRegister.openedAt,
                initialAmountInCents: todayRegister.initialAmountInCents,
                openedBy: todayRegister.openedBy,
              }}
              expectedRevenue={expectedRevenue}
            />
          )}
          {todayRegister && !isOpen && (
            <div className="border border-emerald-500/20 bg-emerald-500/[0.06] p-6 max-w-md">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-2">Caixa fechado</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/30">Inicial</p>
                  <p className="text-sm font-bold text-white/70">{formatCurrency(todayRegister.initialAmountInCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30">Final</p>
                  <p className="text-sm font-bold text-white/70">{formatCurrency(todayRegister.finalAmountInCents ?? 0)}</p>
                </div>
                {todayRegister.differenceInCents != null && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-white/30">Diferença</p>
                    <p className={`text-base font-bold flex items-center gap-1 ${
                      todayRegister.differenceInCents > 0 ? "text-emerald-400" : todayRegister.differenceInCents < 0 ? "text-red-400" : "text-white/50"
                    }`}>
                      {todayRegister.differenceInCents > 0 ? <TrendingUp className="size-4" /> : todayRegister.differenceInCents < 0 ? <TrendingDown className="size-4" /> : <Minus className="size-4" />}
                      {todayRegister.differenceInCents < 0 ? "- " : "+ "}{formatCurrency(Math.abs(todayRegister.differenceInCents))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent history */}
        <div>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
            Histórico (30 dias)
          </h2>
          {history.length === 0 ? (
            <div className="flex items-center justify-center border border-white/[0.07] bg-white/[0.03] py-10">
              <p className="text-sm text-white/25">Sem histórico</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {history.map((reg) => (
                <div key={reg.id} className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <div className="flex size-8 items-center justify-center border border-white/[0.06]">
                    <Vault className="size-3.5 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/70 capitalize">
                      {formatInTimeZone(reg.openedAt, TZ, "EEEE dd/MM", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-white/25">{reg.openedBy.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white/60">{formatCurrency(reg.finalAmountInCents ?? 0)}</p>
                    {reg.differenceInCents != null && (
                      <p className={`text-[10px] font-bold ${reg.differenceInCents >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {reg.differenceInCents >= 0 ? "+" : ""}{formatCurrency(reg.differenceInCents)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
