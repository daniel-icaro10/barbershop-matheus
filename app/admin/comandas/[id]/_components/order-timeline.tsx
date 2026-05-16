import { formatInTimeZone } from "date-fns-tz"
import { CheckCircle2, XCircle, QrCode, Plus, Minus, Tag, Archive, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const TZ = "America/Sao_Paulo"

interface Props {
  events: Array<{
    id: string
    type: string
    message: string
    createdAt: Date
  }>
}

const eventConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; ring: string }> = {
  ORDER_CREATED:    { icon: ShoppingBag,  color: "text-blue-400",    ring: "ring-blue-400/30" },
  ITEM_ADDED:       { icon: Plus,         color: "text-white/60",    ring: "ring-white/10" },
  ITEM_REMOVED:     { icon: Minus,        color: "text-white/30",    ring: "ring-white/10" },
  DISCOUNT_APPLIED: { icon: Tag,          color: "text-emerald-400", ring: "ring-emerald-400/30" },
  PIX_GENERATED:    { icon: QrCode,       color: "text-amber-400",   ring: "ring-amber-400/30" },
  PIX_APPROVED:     { icon: CheckCircle2, color: "text-emerald-400", ring: "ring-emerald-400/50" },
  PIX_CANCELED:     { icon: XCircle,      color: "text-red-400",     ring: "ring-red-400/30" },
  PAYMENT_REJECTED: { icon: XCircle,      color: "text-red-400",     ring: "ring-red-400/30" },
  ORDER_CLOSED:     { icon: Archive,      color: "text-[#c9a227]",   ring: "ring-[#c9a227]/50" },
  ORDER_CANCELED:   { icon: XCircle,      color: "text-red-400",     ring: "ring-red-400/30" },
}

export function OrderTimeline({ events }: Props) {
  if (events.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
        Timeline
      </h2>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/[0.06]" />

        <div className="flex flex-col gap-0">
          {events.map((ev, idx) => {
            const cfg = eventConfig[ev.type] ?? eventConfig.ITEM_ADDED
            const Icon = cfg.icon
            return (
              <div key={ev.id} className="relative flex items-start gap-4 pb-5 last:pb-0">
                {/* Dot */}
                <div className={cn(
                  "relative z-10 flex size-[23px] shrink-0 items-center justify-center bg-[#060504] ring-1",
                  cfg.ring,
                )}>
                  <Icon className={cn("size-3", cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-white/70">{ev.message}</p>
                  <p className="mt-0.5 text-[10px] text-white/25">
                    {formatInTimeZone(ev.createdAt, TZ, "HH:mm")} ·{" "}
                    {formatInTimeZone(ev.createdAt, TZ, "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
