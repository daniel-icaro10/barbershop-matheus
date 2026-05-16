"use client"

import { useBookingStore } from "@/lib/store/booking-store"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarPlus, RotateCcw, ArrowLeft, QrCode, MapPin, Navigation, Map } from "lucide-react"
import Link from "next/link"

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

interface LocationData {
  address: string
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
}

export default function StepConfirmation({
  whatsappPhone,
  location,
}: {
  whatsappPhone: string
  location?: LocationData | null
}) {
  const { service, date, time, personalData, reset } = useBookingStore()
  const firstName = personalData?.name?.split(" ")[0] ?? ""

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

  const mapsUrl = location?.googleMapsUrl
    ?? (location?.latitude && location?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
      : null)

  const wazeUrl = location?.latitude && location?.longitude
    ? `https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`
    : null

  return (
    <div className="relative flex min-h-dvh flex-col px-5 pb-10 pt-14">
      {/* Back to home button */}
      <Link
        href="/"
        onClick={reset}
        className="absolute left-5 top-5 flex size-9 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all hover:border-[#c9a227]/30 hover:bg-[#c9a227]/[0.06] hover:text-[#c9a227] active:scale-95"
        aria-label="Voltar ao início"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <div className="flex flex-col items-center">
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
          className="mt-7 flex w-full flex-col items-center gap-5"
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

          {/* Payment + Calendar buttons */}
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex w-full gap-2.5">
            {/* PIX — em breve */}
            <div className="group relative flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-1.5 border border-white/[0.07] bg-white/[0.03] py-3.5 opacity-60">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/40">
                <QrCode className="size-4" />
                Pagar via PIX
              </div>
              <span className="border border-amber-500/20 bg-amber-500/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.3em] text-amber-400/70">
                Em breve
              </span>
            </div>

            {/* Google Calendar */}
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

          {/* Location card */}
          {location?.address && (
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="w-full border border-white/[0.07] bg-white/[0.03]"
            >
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
                <MapPin className="size-3.5 shrink-0 text-[#c9a227]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                  Como chegar
                </p>
              </div>
              <div className="p-4">
                <p className="mb-4 text-sm text-white/60 leading-relaxed">{location.address}</p>
                <div className="flex gap-2.5">
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 border border-white/[0.07] bg-white/[0.03] py-2.5 text-xs font-semibold text-white/50 transition-all hover:border-[#c9a227]/30 hover:bg-[#c9a227]/[0.06] hover:text-[#c9a227]"
                    >
                      <Map className="size-3.5" />
                      Google Maps
                    </a>
                  )}
                  {wazeUrl && (
                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 border border-white/[0.07] bg-white/[0.03] py-2.5 text-xs font-semibold text-white/50 transition-all hover:border-blue-400/30 hover:bg-blue-400/[0.06] hover:text-blue-400"
                    >
                      <Navigation className="size-3.5" />
                      Waze
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

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
    </div>
  )
}
