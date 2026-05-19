"use client"

import { formatInTimeZone, toZonedTime } from "date-fns-tz"
import { APP_TIMEZONE } from "@/lib/constants/timezone"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Loader2, ClipboardList, MessageCircle } from "lucide-react"
import { createOrder } from "@/app/_actions/admin/orders/create-order"

const TZ = APP_TIMEZONE
const SLOT_HEIGHT = 32

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

interface BookingEntry {
  id: string
  date: string
  endDate: string | null
  service: { id: string; name: string; durationInMinutes: number; priceInCents: number }
  user: { id: string; name: string; email: string; image: string | null; phone: string | null }
}

interface Props {
  bookings: BookingEntry[]
  openTime: string
  closeTime: string
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function generateTimeLabels(openTime: string, closeTime: string): string[] {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const labels: string[] = []
  for (let m = open; m <= close; m += 30) {
    labels.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
  }
  return labels
}

function generateGridLines(openTime: string, closeTime: string) {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const lines: { time: string; isMajor: boolean }[] = []
  for (let m = open; m <= close; m += 15) {
    lines.push({
      time: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
      isMajor: m % 30 === 0,
    })
  }
  return lines
}

function OpenOrderButton({ bookingId, userId, serviceItemId }: { bookingId: string; userId: string; serviceItemId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      const result = await createOrder({ customerId: userId, bookingId, serviceItemId })
      if (result?.serverError) { toast.error(result.serverError); return }
      const orderId = result?.data?.order?.id
      if (orderId) router.push(`/admin/comandas/${orderId}`)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      title="Abrir comanda"
      className="flex items-center gap-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 transition-all hover:border-[#c9a227]/40 hover:text-[#c9a227] disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-2.5 animate-spin" /> : <ClipboardList className="size-2.5" />}
      {!pending && "Comanda"}
    </button>
  )
}

function ReminderButton({ booking }: { booking: BookingEntry }) {
  const timeLabel = formatInTimeZone(new Date(booking.date), TZ, "HH:mm")
  const firstName = booking.user.name.split(" ")[0]

  const msg = [
    `Olá, ${firstName} tudo bem?`,
    `Seu horário hoje às ${timeLabel} está confirmado!`,
    `${booking.service.name} - ${fmt(booking.service.priceInCents)}`,
    `ATENÇÃO, não atrasar seu horário, Pois, devido à alta demanda nao consigo atender pra nao atrasar o proximo cliente!`,
  ].join("\n")

  const phone = booking.user.phone?.replace(/\D/g, "")
  const href = phone
    ? `https://wa.me/55${phone.startsWith("55") ? phone.slice(2) : phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`

  const hasPhone = !!phone

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={hasPhone ? `Enviar lembrete para ${firstName}` : "Cliente sem telefone — abrirá WhatsApp sem número"}
      className={`flex items-center justify-center rounded-md border px-2.5 py-1.5 transition-all ${
        hasPhone
          ? "border-green-500/20 bg-green-500/[0.08] text-green-400 hover:border-green-500/40 hover:bg-green-500/15"
          : "border-white/10 bg-white/[0.04] text-white/30 hover:border-white/20 hover:text-white/50"
      }`}
    >
      <MessageCircle className="size-3.5" />
    </a>
  )
}

const colorPalette = [
  { bg: "border-[#c9a227]/30 bg-[#c9a227]/10",  text: "text-[#c9a227]",    accent: "bg-[#c9a227]" },
  { bg: "border-blue-400/30 bg-blue-400/10",     text: "text-blue-400",     accent: "bg-blue-400" },
  { bg: "border-emerald-400/30 bg-emerald-400/10", text: "text-emerald-400", accent: "bg-emerald-400" },
  { bg: "border-violet-400/30 bg-violet-400/10", text: "text-violet-400",   accent: "bg-violet-400" },
]

export function AgendaTimeline({ bookings, openTime, closeTime }: Props) {
  const openMin  = timeToMinutes(openTime)
  const closeMin = timeToMinutes(closeTime)
  const totalHeight = ((closeMin - openMin) / 15) * SLOT_HEIGHT
  const timeLabels = generateTimeLabels(openTime, closeTime)
  const gridLines  = generateGridLines(openTime, closeTime)

  const serviceColorMap = new Map<string, number>()
  bookings.forEach((b) => {
    if (!serviceColorMap.has(b.service.name))
      serviceColorMap.set(b.service.name, serviceColorMap.size % colorPalette.length)
  })

  function topOffset(iso: string): number {
    const z = toZonedTime(new Date(iso), TZ)
    return ((z.getHours() * 60 + z.getMinutes() - openMin) / 15) * SLOT_HEIGHT
  }

  function blockHeight(dur: number): number {
    return (dur / 15) * SLOT_HEIGHT
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex">
        {/* Time column */}
        <div className="w-14 shrink-0 border-r border-white/[0.06]">
          <div className="relative" style={{ height: totalHeight }}>
            {timeLabels.map((label, i) => (
              <div
                key={label}
                className="absolute right-0 flex items-start justify-end pr-2.5"
                style={{ top: i * 2 * SLOT_HEIGHT - 7 }}
              >
                <span className="text-[9px] tabular-nums text-white/25">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative flex-1" style={{ height: totalHeight }}>
          {gridLines.map((line, i) => (
            <div
              key={line.time}
              className={`absolute inset-x-0 border-t ${line.isMajor ? "border-white/[0.08]" : "border-white/[0.03]"}`}
              style={{ top: i * SLOT_HEIGHT }}
            />
          ))}

          {bookings.map((booking) => {
            const top    = topOffset(booking.date)
            const height = blockHeight(booking.service.durationInMinutes)
            const colors = colorPalette[serviceColorMap.get(booking.service.name) ?? 0]
            const startLabel = formatInTimeZone(new Date(booking.date), TZ, "HH:mm")
            const endDate = booking.endDate
              ? new Date(booking.endDate)
              : new Date(new Date(booking.date).getTime() + booking.service.durationInMinutes * 60_000)
            const endLabel = formatInTimeZone(endDate, TZ, "HH:mm")

            return (
              <div
                key={booking.id}
                className={`absolute left-2 right-2 overflow-hidden rounded-2xl border ${colors.bg} flex flex-col`}
                style={{ top: top + 2, height: height - 4 }}
              >
                {/* Colored left accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${colors.accent}`} />

                <div className="flex h-full flex-col justify-between pl-3 pr-2.5 py-2">
                  {/* Top row: time range + actions */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>
                      {startLabel} — {endLabel}
                    </span>
                    {height >= 64 && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <ReminderButton booking={booking} />
                        <OpenOrderButton bookingId={booking.id} userId={booking.user.id} serviceItemId={booking.service.id} />
                      </div>
                    )}
                  </div>

                  {/* Bottom row: client + service */}
                  {height >= 56 && (
                    <div className="flex items-end justify-between gap-2 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {booking.user.image ? (
                            <Image
                              src={booking.user.image}
                              alt={booking.user.name}
                              width={16}
                              height={16}
                              className="size-4 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[8px] font-bold text-white/60">
                              {booking.user.name.charAt(0)}
                            </div>
                          )}
                          <p className="truncate text-xs font-bold text-white/90">{booking.user.name}</p>
                        </div>
                        <p className={`mt-0.5 truncate text-[10px] ${colors.text} opacity-80`}>
                          {booking.service.name}
                        </p>
                      </div>
                      {height >= 80 && (
                        <span className="shrink-0 text-[10px] font-bold text-white/40 tabular-nums">
                          {fmt(booking.service.priceInCents)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {bookings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white/25">Nenhum agendamento para este dia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
