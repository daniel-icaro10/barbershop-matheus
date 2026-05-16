"use client"

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"

interface Props {
  data: Array<{ date: string; value: number }>
}

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100)

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-[#c9a227]/20 bg-[#060504] px-3 py-2 text-xs shadow-xl">
      <p className="text-white/40 mb-1">{label}</p>
      <p className="font-bold text-[#c9a227]">{fmt(payload[0].value)}</p>
    </div>
  )
}

export function RevenueChart({ data }: Props) {
  return (
    <div className="border border-white/[0.07] bg-white/[0.03]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
          Faturamento — últimos 30 dias
        </h2>
      </div>
      <div className="p-5 pt-4" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c9a227" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#c9a227" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `R$${Math.round(v / 100)}`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#c9a227"
              strokeWidth={1.5}
              fill="url(#goldGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#c9a227", stroke: "#060504", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
