"use client"

import { useBookingStore } from "@/lib/store/booking-store"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageCircle, CalendarPlus, RotateCcw } from "lucide-react"
import Link from "next/link"

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function StepConfirmation({ whatsappPhone }: { whatsappPhone: string }) {
  const { service, date, time, personalData, reset } = useBookingStore()
  const firstName = personalData?.name?.split(" ")[0] ?? ""

  const whatsappMsg =
    service && date && time && personalData
      ? `Olá! Agendei:\n✂️ ${service.name}\n📅 ${format(date, "dd/MM/yyyy")} às ${time}\nNome: ${personalData.name}`
      : ""
  const whatsappUrl = whatsappMsg && whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`
    : "#"

  const calendarUrl = () => {
    if (!date || !time || !service) return "#"
    const [h, m] = time.split(":").map(Number)
    const start = new Date(date)
    start.setHours(h, m, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + (service.durationInMinutes ?? 30))
    const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "")
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service.name + " · Matheus Barbeiro")}&dates=${fmt(start)}/${fmt(end)}`
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pb-10 pt-14">
      {/* Animated checkmark */}
      <div className="relative flex items-center justify-center">
        {[1, 1.8, 2.6].map((scale, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#c9a227]/10"
            style={{ width: 80, height: 80 }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale, opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.6, delay: 0.3 + i * 0.15, ease: "easeOut" }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
          className="relative flex size-24 items-center justify-center border border-[#c9a227]/25 bg-[#c9a227]/[0.08]"
        >
          <motion.svg viewBox="0 0 32 32" className="size-12" initial={{ pathLength: 0 }}>
            <motion.path
              d="M6 16 L13 23 L26 9"
              fill="none"
              stroke="#c9a227"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-7 flex w-full flex-col items-center gap-6"
      >
        {/* Title */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="text-center">
          <h1 className="font-bebas text-[2.2rem] text-white leading-[0.88]">
            TUDO <span className="text-[#c9a227]">CONFIRMADO!</span>
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {firstName ? `Até logo, ${firstName}! ` : ""}Te esperamos ✂️
          </p>
        </motion.div>

        {/* Booking card */}
        {service && (
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="w-full overflow-hidden border border-white/[0.07] bg-white/[0.03]"
          >
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
            <div className="flex flex-col gap-3 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/30">Detalhes</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  { label: "Serviço", value: service.name },
                  { label: "Valor", value: formatPrice(service.priceInCents), gold: true },
                  date && { label: "Data", value: format(date, "dd 'de' MMM", { locale: ptBR }) },
                  time && { label: "Horário", value: time },
                ].filter(Boolean).map((row) => {
                  if (!row) return null
                  const { label, value, gold } = row as { label: string; value: string; gold?: boolean }
                  return (
                    <div key={label}>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.28em] text-white/30">{label}</p>
                      <p className={gold ? "text-sm font-bold text-[#c9a227]" : "text-sm font-semibold text-white"}>
                        {value}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex w-full gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-1 items-center justify-center gap-2 border border-white/[0.07] bg-white/[0.03] py-3.5 text-sm font-semibold text-white/50 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] hover:text-emerald-400"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
          <a
            href={calendarUrl()}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-1 items-center justify-center gap-2 border border-white/[0.07] bg-white/[0.03] py-3.5 text-sm font-semibold text-white/50 transition-all duration-200 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/[0.06] hover:text-[#c9a227]"
          >
            <CalendarPlus className="size-4" />
            Calendário
          </a>
        </motion.div>

        {/* New booking */}
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
          <Link
            href="/"
            onClick={reset}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/25 transition-colors hover:text-white/50"
          >
            <RotateCcw className="size-3.5" />
            Novo agendamento
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
