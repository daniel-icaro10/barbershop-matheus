"use client"

import { useBookingStore } from "@/lib/store/booking-store"
import type { BarbershopService } from "@/generated/prisma/client"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export default function StepService({ services }: { services: BarbershopService[] }) {
  const { setService, next } = useBookingStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = (service: BarbershopService) => {
    setSelectedId(service.id)
    setService(service)
    setTimeout(next, 220)
  }

  return (
    <div className="flex flex-col px-5 pb-10 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
            Matheus Barbeiro
          </span>
        </div>
        <h1 className="font-bebas text-white leading-[0.86]" style={{ fontSize: "clamp(2rem,10vw,2.8rem)" }}>
          QUAL SERVIÇO VOCÊ{" "}
          <span className="text-[#c9a227]">QUER HOJE?</span>
        </h1>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-2.5">
        {services.map((service) => (
          <motion.button
            key={service.id}
            variants={item}
            onClick={() => handleSelect(service)}
            className={cn(
              "group relative flex items-center gap-4 overflow-hidden border p-4 text-left transition-all duration-300",
              selectedId === service.id
                ? "border-[#c9a227]/50 bg-[#c9a227]/[0.06] shadow-[0_0_0_1px_rgba(201,162,39,0.2)]"
                : "border-white/[0.07] bg-white/[0.03] hover:border-[#c9a227]/25 hover:bg-white/[0.05] active:scale-[0.98]"
            )}
          >
            {/* Image */}
            <div className="relative size-[68px] shrink-0 overflow-hidden">
              <Image
                src={service.imageUrl}
                alt={service.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <p className="font-bebas text-[1.05rem] leading-tight tracking-wide text-white">
                {service.name}
              </p>
              {service.description && (
                <p className="line-clamp-2 text-[11px] leading-relaxed text-white/40">
                  {service.description}
                </p>
              )}
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-white/35">
                  <Clock className="size-2.5 shrink-0" />
                  <span>{service.durationInMinutes} min</span>
                </div>
                <p className="text-sm font-bold text-[#c9a227]">
                  {formatPrice(service.priceInCents)}
                </p>
              </div>
            </div>

            {/* Gold top accent line on hover / selected */}
            <div className={cn(
              "absolute top-0 inset-x-0 h-[2px] bg-[#c9a227] origin-left transition-transform duration-400",
              selectedId === service.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            )} />
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
