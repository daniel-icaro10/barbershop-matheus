"use client"

import { useBookingStore } from "@/lib/store/booking-store"
import { Calendar } from "@/app/_components/ui/calendar"
import { useQuery } from "@tanstack/react-query"
import { getAvailableSlotsPublic } from "@/app/_actions/get-available-slots-public"
import { motion, AnimatePresence } from "framer-motion"
import { isBefore, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export default function StepDateTime() {
  const { date, time, service, setDate, setTime, next } = useBookingStore()

  const { data: slotsResult, isLoading } = useQuery({
    queryKey: ["slots-public", date?.toDateString(), service?.id],
    queryFn: () => getAvailableSlotsPublic({ date: date!, serviceId: service!.id }),
    enabled: !!date && !!service,
    staleTime: 0,   // sempre busca dados frescos do servidor
    gcTime: 0,      // não guarda cache entre navegações
  })

  const slots = slotsResult?.data ?? []
  const morningSlots = slots.filter((s) => parseInt(s.split(":")[0]) < 12)
  const afternoonSlots = slots.filter((s) => parseInt(s.split(":")[0]) >= 12)

  return (
    <div className="flex flex-col px-5 pb-10 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
            Disponibilidade
          </span>
        </div>
        <h1 className="font-bebas text-white leading-[0.86]" style={{ fontSize: "clamp(2rem,10vw,2.8rem)" }}>
          QUANDO VOCÊ{" "}
          <span className="text-[#c9a227]">PREFERE?</span>
        </h1>
        {service && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-white/40">
            <Clock className="size-3 shrink-0 text-[#c9a227]/60" />
            <span>
              {service.name} ·{" "}
              <span className="text-[#c9a227]/70">{formatDuration(service.durationInMinutes)}</span>
            </span>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => { setDate(d ?? null); setTime(null) }}
          disabled={(d) => isBefore(d, startOfToday())}
          locale={ptBR}
          className="mx-auto p-0"
        />
      </motion.div>

      <AnimatePresence>
        {date && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.32, 0, 0.08, 1] }}
          >
            {/* Divider */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {["Manhã", "Tarde"].map((label) => (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px w-4 bg-[#c9a227]/40" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/30">{label}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton-shimmer min-h-[44px] w-16" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-white/35">
                Sem horários disponíveis para esta data. Escolha outro dia.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {morningSlots.length > 0 && (
                  <SlotGroup label="Manhã" slots={morningSlots} selected={time} onSelect={setTime} />
                )}
                {afternoonSlots.length > 0 && (
                  <SlotGroup label="Tarde" slots={afternoonSlots} selected={time} onSelect={setTime} />
                )}
              </div>
            )}

            <button
              onClick={next}
              disabled={!time}
              className="mt-8 w-full bg-[#c9a227] py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(201,162,39,0.25)] disabled:shadow-none"
            >
              Confirmar horário
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlotGroup({
  label, slots, selected, onSelect,
}: {
  label: string
  slots: string[]
  selected: string | null
  onSelect: (s: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px w-4 bg-[#c9a227]/50" />
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">{label}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => {
          const isSelected = selected === slot
          return (
            <motion.button
              key={slot}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025, duration: 0.22 }}
              onClick={() => onSelect(slot)}
              className={cn(
                "min-h-[44px] px-4 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-[#c9a227] text-black shadow-[0_0_16px_rgba(201,162,39,0.4)] scale-[1.04]"
                  : "border border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-[#c9a227]/30 hover:text-white hover:scale-[1.02] active:scale-[0.97]"
              )}
            >
              {slot}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
