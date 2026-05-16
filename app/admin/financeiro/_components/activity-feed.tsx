import { formatInTimeZone } from "date-fns-tz"
import { CheckCircle2, XCircle, QrCode, Plus, Minus, Tag, Archive, User } from "lucide-react"
import { cn } from "@/lib/utils"

const TZ = "America/Sao_Paulo"

type EventType = "ORDER_CREATED" | "ITEM_ADDED" | "ITEM_REMOVED" | "DISCOUNT_APPLIED" | "PIX_GENERATED" | "PIX_APPROVED" | "PIX_CANCELED" | "PAYMENT_REJECTED" | "ORDER_CLOSED" | "ORDER_CANCELED"

interface TimelineEvent {
  id: string
  type: EventType
  message: string
  createdAt: Date
  orderId: string
}

const eventConfig: Record<EventType, { icon: React.ComponentType<{ className?: string }>; color: string; dot: string }> = {
  ORDER_CREATED:    { icon: User,          color: "text-blue-400",    dot: "bg-blue-400/60" },
  ITEM_ADDED:       { icon: Plus,          color: "text-white/50",    dot: "bg-white/20" },
  ITEM_REMOVED:     { icon: Minus,         color: "text-white/30",    dot: "bg-white/10" },
  DISCOUNT_APPLIED: { icon: Tag,           color: "text-emerald-400", dot: "bg-emerald-400/60" },
  PIX_GENERATED:    { icon: QrCode,        color: "text-amber-400",   dot: "bg-amber-400/60" },
  PIX_APPROVED:     { icon: CheckCircle2,  color: "text-emerald-400", dot: "bg-emerald-400" },
  PIX_CANCELED:     { icon: XCircle,       color: "text-red-400",     dot: "bg-red-400/60" },
  PAYMENT_REJECTED: { icon: XCircle,       color: "text-red-400",     dot: "bg-red-400/60" },
  ORDER_CLOSED:     { icon: Archive,       color: "text-[#c9a227]",   dot: "bg-[#c9a227]" },
  ORDER_CANCELED:   { icon: XCircle,       color: "text-red-400",     dot: "bg-red-400/60" },
}

export function ActivityFeed({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="border border-white/[0.07] bg-white/[0.03] h-full">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
          Atividade recente
        </h2>
      </div>
      <div className="divide-y divide-white/[0.04] overflow-y-auto" style={{ maxHeight: 320 }}>
        {events.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/25">Sem atividade recente</p>
        ) : events.map((ev) => {
          const cfg = eventConfig[ev.type] ?? eventConfig.ITEM_ADDED
          const Icon = cfg.icon
          return (
            <div key={ev.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center", "bg-white/[0.04]")}>
                <Icon className={cn("size-3", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 leading-snug">{ev.message}</p>
                <p className="mt-0.5 text-[10px] text-white/25">
                  {formatInTimeZone(ev.createdAt, TZ, "dd/MM HH:mm")}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
