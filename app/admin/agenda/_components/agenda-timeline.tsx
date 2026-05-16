"use client"

import { formatInTimeZone } from "date-fns-tz"

const TZ = "America/Sao_Paulo"
import Image from "next/image"

const SLOT_HEIGHT = 64 // px per 30-min block

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

interface BookingEntry {
  id: string
  date: string
  endDate: string | null
  service: { name: string; durationInMinutes: number; priceInCents: number }
  user: { name: string; email: string; image: string | null }
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

function generateHourLabels(openTime: string, closeTime: string): string[] {
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  const labels: string[] = []
  // Show labels at every 30-minute mark
  for (let m = open; m <= close; m += 30) {
    const h = Math.floor(m / 60)
    const min = m % 60
    labels.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`)
  }
  return labels
}

export function AgendaTimeline({ bookings, openTime, closeTime }: Props) {
  const openMin = timeToMinutes(openTime)
  const closeMin = timeToMinutes(closeTime)
  const totalSlots = (closeMin - openMin) / 30
  const totalHeight = totalSlots * SLOT_HEIGHT
  const timeLabels = generateHourLabels(openTime, closeTime)

  function topOffset(isoDate: string): number {
    const d = new Date(isoDate)
    const minutes = d.getHours() * 60 + d.getMinutes() - openMin
    return (minutes / 30) * SLOT_HEIGHT
  }

  function blockHeight(durationInMinutes: number): number {
    return (durationInMinutes / 30) * SLOT_HEIGHT
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
                style={{ top: i * SLOT_HEIGHT - 8 }}
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
          {/* Grid lines */}
          {timeLabels.map((label, i) => (
            <div
              key={label}
              className="absolute inset-x-0 border-t border-border/30"
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
                  {height >= 80 && (
                    <div className="flex items-center gap-1.5">
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
