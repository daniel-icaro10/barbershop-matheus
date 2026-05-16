export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { ShoppingBag } from "lucide-react"
import { OrderCard } from "./_components/order-card"
import Link from "next/link"

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function ComandasPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filter = (status === "CLOSED" || status === "CANCELED") ? status : undefined

  const orders = await prisma.order.findMany({
    where: {
      barbershopId: DEFAULT_BARBERSHOP_ID,
      ...(filter ? { status: filter } : { status: "OPEN" }),
    },
    include: {
      customer: { select: { name: true, email: true } },
      items: { select: { id: true } },
      payments: { select: { status: true, paidAmountInCents: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const activeStatus = filter ?? "OPEN"

  const tabs = [
    { label: "Abertas", value: "OPEN" },
    { label: "Fechadas", value: "CLOSED" },
    { label: "Canceladas", value: "CANCELED" },
  ]

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Gestão</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.88]" style={{ fontSize: "clamp(2.2rem,5vw,3rem)" }}>
          COMANDAS
        </h1>
        <p className="mt-1.5 text-[11px] text-white/35">
          {orders.length} comanda{orders.length !== 1 ? "s" : ""} {activeStatus === "OPEN" ? "abertas" : activeStatus === "CLOSED" ? "fechadas" : "canceladas"}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "OPEN" ? "/admin/comandas" : `/admin/comandas?status=${tab.value}`}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeStatus === tab.value
                ? "border-[#c9a227]/30 bg-[#c9a227]/[0.08] text-[#c9a227]"
                : "border-white/[0.07] text-white/30 hover:text-white/60"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 border border-white/[0.07] bg-white/[0.03] py-20">
          <ShoppingBag className="size-10 text-white/15" />
          <p className="text-sm text-white/30">Nenhuma comanda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
