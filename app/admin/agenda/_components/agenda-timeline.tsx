"use client"

import { formatInTimeZone } from "date-fns-tz"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"
import { Loader2, ClipboardList } from "lucide-react"
import { createOrder } from "@/app/_actions/admin/orders/create-order"

const TZ = "America/Sao_Paulo"

// 32 px per 15-min block → same visual density as before (64 px/30 min)
const SLOT_HEIGHT = 32

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

interface BookingEntry {
  id: string
  date: string
  endDate: string | null
  service: { name: string; durationInMinutes: number; priceInCents: number }
  user: { id: string; name: string; email: string; image: string | null }
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

// Labels shown in the time column — every 30 min
function generateTimeLabels(openTime: string, closeTime: string): string[] {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const labels: string[] = []
  for (let m = open; m <= close; m += 30) {
    const h = Math.floor(m / 60)
    const min = m % 60
    labels.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`)
  }
  return labels
}

// Grid lines — every 15 min, major at 30-min boundaries
function generateGridLines(openTime: string, closeTime: string) {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const lines: { time: string; isMajor: boolean }[] = []
  for (let m = open; m <= close; m += 15) {
    const h = Math.floor(m / 60)
    const min = m % 60
    lines.push({
      time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      isMajor: min % 30 === 0,
    })
  }
  return lines
}

function OpenOrderButton({ bookingId, userId }: { bookingId: string; userId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      const result = await createOrder({ customerId: userId, bookingId })
      if (result?.serverError) { toast.error(result.serverError); return }
      const orderId = result?.data?.order?.id
      if (orderId) router.push(`/admin/comandas/${orderId}`)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="flex items-center gap-1 border border-white/15 bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 transition-all hover:border-[#c9a227]/40 hover:text-[#c9a227] disabled:opacity-50"
    >
      {pending ? <Loader2 className="size-2.5 animate-spin" /> : <ClipboardList className="size-2.5" />}
      {!pending && "Comanda"}
    </button>
  )
}

export function AgendaTimeline({ bookings, openTime, closeTime }: Props) {
  const openMin = timeToMinutes(openTime)
  const closeMin = timeToMinutes(closeTime)
  const totalSlots = (closeMin - openMin) / 15
  const totalHeight = totalSlots * SLOT_HEIGHT
  const timeLabels = generateTimeLabels(openTime, closeTime)
  const gridLines = generateGridLines(openTime, closeTime)

  function topOffset(isoDate: string): number {
    const d = new Date(isoDate)
    const minutes = d.getHours() * 60 + d.getMinutes() - openMin
    return (minutes / 15) * SLOT_HEIGHT
  }

  function blockHeight(durationInMinutes: number): number {
    return (durationInMinutes / 15) * SLOT_HEIGHT
  }

  // Color palette for service variety
  const colorPalette = [
    { bg: "bg-primary/15 border-primary/30", text: "text-primary", dot: "bg-primary" },
    { bg: "bg-blue-400/15 border-blue-400/30", text: "text-blue-400", dot: "bg-blue-400" },
    { bg: "bg-emerald-400/15 border-emerald-400/30", text: "text-emerald-400", dot: "bg-emerald-400" },
    { bg: "bg-violet-400/15 border-violet-400/30", text: "text-violet-400", dot: "bg-violet-400" },
  ]

  // Assign stable color to each unique service
  const serviceColorMap = new Map<string, number>()
  bookings.forEach((b) => {
    if (!serviceColorMap.has(b.service.name)) {
      serviceColorMap.set(b.service.name, serviceColorMap.size % colorPalette.length)
    }
  })

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 shrink-0 border-r border-border/40">
          <div style={{ height: totalHeight, position: "relative" }}>
            {timeLabels.map((label, i) => (
              <div
                key={label}
                className="absolute left-0 right-0 flex items-start justify-end pr-3"
                style={{ top: i * 2 * SLOT_HEIGHT - 8 }}
              >
                <span className="text-[10px] tabular-nums text-muted-foreground/70">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline area */}
        <div className="relative flex-1" style={{ height: totalHeight }}>
          {/* Grid lines — minor every 15 min, major every 30 min */}
          {gridLines.map((line, i) => (
            <div
              key={line.time}
              className={`absolute inset-x-0 border-t ${line.isMajor ? "border-border/30" : "border-border/12"}`}
              style={{ top: i * SLOT_HEIGHT }}
            />
          ))}

          {/* Booking blocks */}
          {bookings.map((booking) => {
            const top = topOffset(booking.date)
            const height = blockHeight(booking.service.durationInMinutes)
            const colorIdx = serviceColorMap.get(booking.service.name) ?? 0
            const colors = colorPalette[colorIdx]

            return (
              <div
                key={booking.id}
                className={`absolute left-2 right-2 overflow-hidden rounded-xl border ${colors.bg} px-3 py-2`}
                style={{ top: top + 2, height: height - 4 }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`size-1.5 shrink-0 rounded-full ${colors.dot}`} />
                        <p className={`truncate text-xs font-bold ${colors.text}`}>
                          {booking.service.name}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-foreground/80 font-medium">
                        {booking.user.name}
                      </p>
                    </div>
                    {height >= 64 && (
                      <span className={`shrink-0 text-xs font-bold ${colors.text}`}>
                        {fmt(booking.service.priceInCents)}
                      </span>
                    )}
                  </div>
                  {height >= 96 && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                          {booking.user.image ? (
                            <Image
                              src={booking.user.image}
                              alt={booking.user.name}
                              width={20}
                              height={20}
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[8px] font-bold">
                              {booking.user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="truncate text-[10px] text-muted-foreground">
                          {formatInTimeZone(new Date(booking.date), TZ, "HH:mm")}
                          {" · "}
                          {booking.service.durationInMinutes}min
                        </span>
                      </div>
                      <OpenOrderButton bookingId={booking.id} userId={booking.user.id} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {bookings.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Nenhum agendamento para este dia
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
