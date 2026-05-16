export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays, format } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils/money"
import { calculateCommission } from "@/lib/utils/commission"
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Clock, BarChart2, Zap, Package, Scissors, AlertTriangle } from "lucide-react"
import { RevenueChart } from "./_components/revenue-chart"
import { ActivityFeed } from "./_components/activity-feed"
import { cn } from "@/lib/utils"

const TZ = "America/Sao_Paulo"

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default async function FinanceiroDashboard() {
  const now = new Date()
  const zonedNow = toZonedTime(now, TZ)

  const todayStart = fromZonedTime(startOfDay(zonedNow), TZ)
  const todayEnd = fromZonedTime(endOfDay(zonedNow), TZ)
  const weekStart = fromZonedTime(startOfWeek(zonedNow, { locale: ptBR }), TZ)
  const weekEnd = fromZonedTime(endOfWeek(zonedNow, { locale: ptBR }), TZ)
  const monthStart = fromZonedTime(startOfMonth(zonedNow), TZ)
  const monthEnd = fromZonedTime(endOfMonth(zonedNow), TZ)
  const prevMonthStart = fromZonedTime(startOfMonth(toZonedTime(subMonths(now, 1), TZ)), TZ)
  const prevMonthEnd = fromZonedTime(endOfMonth(toZonedTime(subMonths(now, 1), TZ)), TZ)

  // Last 30 days for chart
  const last30Start = fromZonedTime(startOfDay(toZonedTime(subDays(now, 29), TZ)), TZ)

  const [
    closedOrdersMonth,
    closedOrdersPrevMonth,
    closedOrdersWeek,
    closedOrdersToday,
    pendingPayments,
    approvedPaymentsMonth,
    recentTimeline,
    ,
    last30Orders,
    lowStockItems,
  ] = await Promise.all([
    // Closed orders this month (with items for cost/commission/top-items)
    prisma.order.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        status: "CLOSED",
        closedAt: { gte: monthStart, lte: monthEnd },
      },
      include: {
        items: { include: { item: { select: { name: true, type: true, costInCents: true, commissionType: true, commissionValue: true } } } },
        payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } },
      },
    }),
    // Prev month
    prisma.order.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        status: "CLOSED",
        closedAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      include: {
        payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } },
      },
    }),
    // This week
    prisma.order.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        status: "CLOSED",
        closedAt: { gte: weekStart, lte: weekEnd },
      },
      include: { payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } } },
    }),
    // Today
    prisma.order.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        status: "CLOSED",
        closedAt: { gte: todayStart, lte: todayEnd },
      },
      include: { payments: { where: { status: "APPROVED" }, select: { paidAmountInCents: true } } },
    }),
    // Pending PIX payments
    prisma.payment.findMany({
      where: {
        order: { barbershopId: DEFAULT_BARBERSHOP_ID },
        status: "PENDING",
        provider: "MERCADO_PAGO",
      },
      select: { transactionAmountInCents: true },
    }),
    // Approved payments this month
    prisma.payment.count({
      where: {
        order: { barbershopId: DEFAULT_BARBERSHOP_ID },
        status: "APPROVED",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Recent timeline events for activity feed
    prisma.orderTimelineEvent.findMany({
      where: { order: { barbershopId: DEFAULT_BARBERSHOP_ID } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, type: true, message: true, createdAt: true, orderId: true },
    }),
    // Placeholder — top items derived in-memory from closedOrdersMonth
    Promise.resolve([] as never[]),
    // Last 30 days orders for chart
    prisma.order.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        status: "CLOSED",
        closedAt: { gte: last30Start },
      },
      select: { closedAt: true, totalInCents: true },
    }),
    // Low stock products
    prisma.barbershopItem.findMany({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        type: "PRODUCT",
        isActive: true,
        stockQuantity: { not: null },
      },
      select: { id: true, name: true, stockQuantity: true, minimumStock: true },
    }),
  ])

  // ── Calculations ──────────────────────────────────────────────────────────

  const revenueMonth = closedOrdersMonth.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + (p.paidAmountInCents ?? 0), 0), 0)
  const revenueWeek = closedOrdersWeek.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + (p.paidAmountInCents ?? 0), 0), 0)
  const revenueToday = closedOrdersToday.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + (p.paidAmountInCents ?? 0), 0), 0)
  const revenuePrevMonth = closedOrdersPrevMonth.reduce((s, o) => s + o.payments.reduce((ps, p) => ps + (p.paidAmountInCents ?? 0), 0), 0)

  const ticketAvg = closedOrdersMonth.length > 0 ? Math.round(revenueMonth / closedOrdersMonth.length) : 0
  const pendingTotal = pendingPayments.reduce((s, p) => s + p.transactionAmountInCents, 0)

  // Net profit: revenue - product costs - commissions
  let totalCost = 0
  let totalCommission = 0
  for (const order of closedOrdersMonth) {
    for (const oi of order.items) {
      if (oi.item.costInCents) totalCost += oi.item.costInCents * oi.quantity
      if (oi.item.commissionType && oi.item.commissionValue) {
        totalCommission += calculateCommission(oi.totalInCents, oi.item.commissionType, oi.item.commissionValue)
      }
    }
  }
  const netProfit = revenueMonth - totalCost - totalCommission

  const growthPct = pct(revenueMonth, revenuePrevMonth)

  // Last 30 days chart data
  const chartData: Array<{ date: string; value: number }> = []
  for (let i = 29; i >= 0; i--) {
    const d = toZonedTime(subDays(now, i), TZ)
    const dayStr = format(d, "dd/MM")
    const dayStart = fromZonedTime(startOfDay(d), TZ)
    const dayEnd = fromZonedTime(endOfDay(d), TZ)
    const dayRevenue = last30Orders
      .filter((o) => o.closedAt && o.closedAt >= dayStart && o.closedAt <= dayEnd)
      .reduce((s, o) => s + o.totalInCents, 0)
    chartData.push({ date: dayStr, value: dayRevenue })
  }

  // Top items derived in-memory from already-fetched closedOrdersMonth data (no extra query)
  const itemAgg = new Map<string, { name: string; type: string; total: number; count: number }>()
  for (const order of closedOrdersMonth) {
    for (const oi of order.items) {
      const existing = itemAgg.get(oi.itemId)
      if (existing) {
        existing.total += oi.totalInCents
        existing.count += oi.quantity
      } else {
        itemAgg.set(oi.itemId, { name: oi.item.name, type: oi.item.type, total: oi.totalInCents, count: oi.quantity })
      }
    }
  }
  const topItemsWithNames = Array.from(itemAgg.entries())
    .map(([id, v]) => ({ itemId: id, name: v.name, type: v.type, _sum: { totalInCents: v.total }, _count: { itemId: v.count } }))
    .sort((a, b) => b._sum.totalInCents - a._sum.totalInCents)
    .slice(0, 5)

  const alertItems = lowStockItems.filter((i) => {
    const min = i.minimumStock ?? 2
    return (i.stockQuantity ?? 0) <= min
  })

  // Insights
  const insights: string[] = []
  if (growthPct > 0) insights.push(`Faturamento cresceu ${growthPct}% vs mês anterior`)
  if (growthPct < 0) insights.push(`Faturamento caiu ${Math.abs(growthPct)}% vs mês anterior`)
  if (ticketAvg > 0) insights.push(`Ticket médio de ${formatCurrency(ticketAvg)} este mês`)
  if (pendingTotal > 0) insights.push(`${formatCurrency(pendingTotal)} em PIX aguardando aprovação`)
  if (alertItems.length > 0) insights.push(`${alertItems.length} produto${alertItems.length > 1 ? "s" : ""} com estoque baixo`)
  if (netProfit > 0) insights.push(`Lucro líquido estimado: ${formatCurrency(netProfit)}`)

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
            Central Financeira
          </span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          FINANCIAL COMMAND CENTER
        </h1>
        <p className="mt-1 text-xs text-white/25">Visão completa do desempenho financeiro</p>
      </div>

      {/* Hero card */}
      <div className="relative mb-8 overflow-hidden border border-[#c9a227]/20 bg-gradient-to-br from-[#c9a227]/[0.06] via-transparent to-transparent p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,162,39,0.08),transparent_70%)]" />
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a227]/50 to-transparent" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#c9a227]/60 mb-2">
            Faturamento do mês
          </p>
          <div className="flex items-end gap-4 flex-wrap">
            <p className="font-bebas text-white" style={{ fontSize: "clamp(2.8rem,8vw,4.5rem)", lineHeight: 1 }}>
              {formatCurrency(revenueMonth)}
            </p>
            <div className={cn(
              "flex items-center gap-1.5 mb-2 border px-2.5 py-1 text-xs font-bold",
              growthPct >= 0
                ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                : "border-red-500/20 bg-red-500/[0.08] text-red-400"
            )}>
              {growthPct >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {growthPct >= 0 ? "+" : ""}{growthPct}% vs mês anterior
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-5">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Esta semana</p>
              <p className="mt-0.5 text-sm font-bold text-white/80">{formatCurrency(revenueWeek)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Hoje</p>
              <p className="mt-0.5 text-sm font-bold text-white/80">{formatCurrency(revenueToday)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Comandas</p>
              <p className="mt-0.5 text-sm font-bold text-white/80">{closedOrdersMonth.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Ticket médio",
            value: formatCurrency(ticketAvg),
            icon: BarChart2,
            color: "text-[#c9a227]",
            bg: "bg-[#c9a227]/10",
            sub: `${closedOrdersMonth.length} comandas`,
          },
          {
            label: "PIX aprovados",
            value: String(approvedPaymentsMonth),
            icon: CreditCard,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            sub: "este mês",
          },
          {
            label: "PIX pendentes",
            value: formatCurrency(pendingTotal),
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            sub: `${pendingPayments.length} transações`,
          },
          {
            label: "Lucro líquido est.",
            value: formatCurrency(netProfit),
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            sub: "receita − custo − comissão",
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="flex flex-col gap-3 border border-white/[0.07] bg-white/[0.03] p-5">
            <div className={`flex size-10 items-center justify-center ${bg}`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <div>
              <p className="font-bebas text-[1.7rem] leading-none text-white">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</p>
              <p className="mt-0.5 text-[10px] text-white/20">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Revenue chart */}
        <div className="xl:col-span-2">
          <RevenueChart data={chartData} />
        </div>

        {/* Activity feed */}
        <div>
          <ActivityFeed events={recentTimeline} />
        </div>
      </div>

      {/* Bottom grid: top items + insights */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Top items */}
        <div className="border border-white/[0.07] bg-white/[0.03]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
              Top itens — mês atual
            </h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topItemsWithNames.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-white/25">Sem dados</p>
            ) : topItemsWithNames.map((item, idx) => (
              <div key={item.itemId} className="flex items-center gap-3 px-5 py-3.5">
                <span className="font-bebas text-lg w-5 text-white/20">{idx + 1}</span>
                <div className="flex size-7 shrink-0 items-center justify-center">
                  {item.type === "PRODUCT"
                    ? <Package className="size-4 text-blue-400" />
                    : <Scissors className="size-4 text-[#c9a227]" />}
                </div>
                <p className="flex-1 truncate text-sm font-semibold text-white/80">{item.name}</p>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#c9a227]">{formatCurrency(item._sum.totalInCents ?? 0)}</p>
                  <p className="text-[10px] text-white/25">{item._count.itemId}×</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights + alerts */}
        <div className="flex flex-col gap-4">
          {/* Insights */}
          <div className="border border-white/[0.07] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] px-5 py-4 flex items-center gap-2">
              <Zap className="size-3.5 text-[#c9a227]" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Insights</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {insights.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-white/25">Sem insights disponíveis</p>
              ) : insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#c9a227]/60" />
                  <p className="text-sm text-white/60">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          {alertItems.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/[0.04]">
              <div className="border-b border-amber-500/10 px-5 py-4 flex items-center gap-2">
                <AlertTriangle className="size-3.5 text-amber-400" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/70">Estoque baixo</h2>
              </div>
              <div className="divide-y divide-amber-500/[0.06]">
                {alertItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm text-white/70">{item.name}</p>
                    <span className="text-xs font-bold text-amber-400">
                      {item.stockQuantity ?? 0} un.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
