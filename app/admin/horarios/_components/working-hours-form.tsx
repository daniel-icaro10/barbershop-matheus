"use client"

import { useState, useTransition } from "react"
import { updateWorkingHours } from "@/app/_actions/admin/update-working-hours"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

interface DayConfig {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isOpen: boolean
}

interface Props {
  initialConfig: DayConfig[]
}

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
}

export function WorkingHoursForm({ initialConfig }: Props) {
  const [configs, setConfigs] = useState<DayConfig[]>(
    Array.from({ length: 7 }, (_, i) => {
      const found = initialConfig.find((c) => c.dayOfWeek === i)
      return found ?? { dayOfWeek: i, openTime: "09:00", closeTime: "19:00", isOpen: i !== 0 }
    }),
  )
  const [pending, startTransition] = useTransition()
  const [savingDay, setSavingDay] = useState<number | null>(null)

  const update = (dayOfWeek: number, patch: Partial<DayConfig>) => {
    setConfigs((prev) =>
      prev.map((c) => (c.dayOfWeek === dayOfWeek ? { ...c, ...patch } : c)),
    )
  }

  const save = (dayOfWeek: number) => {
    const cfg = configs[dayOfWeek]
    setSavingDay(dayOfWeek)
    startTransition(async () => {
      const result = await updateWorkingHours({
        dayOfWeek: cfg.dayOfWeek,
        openTime: cfg.openTime,
        closeTime: cfg.closeTime,
        isOpen: cfg.isOpen,
      })
      setSavingDay(null)
      if (result?.serverError) {
        toast.error("Erro ao salvar horário.")
      } else {
        toast.success(`${DAYS[dayOfWeek]} atualizado.`)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* Desktop header — oculto em mobile */}
      <div className="hidden sm:grid grid-cols-[120px_80px_1fr_1fr_80px] gap-4 border-b border-border/60 px-5 py-3">
        {["Dia", "Aberto", "Abertura", "Fechamento", ""].map((h) => (
          <p key={h} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {h}
          </p>
        ))}
      </div>

      <div className="divide-y divide-border/40">
        {configs.map((cfg) => {
          const isSaving = savingDay === cfg.dayOfWeek
          return (
            <div
              key={cfg.dayOfWeek}
              className={cn(
                "px-4 sm:px-5 py-4 transition-colors",
                !cfg.isOpen && "opacity-60",
              )}
            >
              {/* Mobile layout */}
              <div className="sm:hidden">
                {/* Row 1: Dia + Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">{DAYS[cfg.dayOfWeek]}</p>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-white/40">{cfg.isOpen ? "Aberto" : "Fechado"}</span>
                    <button
                      role="switch"
                      aria-checked={cfg.isOpen}
                      aria-label={`${DAYS[cfg.dayOfWeek]} — ${cfg.isOpen ? "aberto" : "fechado"}`}
                      onClick={() => update(cfg.dayOfWeek, { isOpen: !cfg.isOpen })}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                        cfg.isOpen ? "bg-primary" : "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                          cfg.isOpen ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Row 2: Horários + Salvar */}
                <div className="flex items-center gap-2">
                  <select
                    value={cfg.openTime}
                    onChange={(e) => update(cfg.dayOfWeek, { openTime: e.target.value })}
                    disabled={!cfg.isOpen}
                    className="flex-1 rounded-lg border border-border/60 bg-background px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-xs text-white/30 shrink-0">até</span>
                  <select
                    value={cfg.closeTime}
                    onChange={(e) => update(cfg.dayOfWeek, { closeTime: e.target.value })}
                    disabled={!cfg.isOpen}
                    className="flex-1 rounded-lg border border-border/60 bg-background px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => save(cfg.dayOfWeek)}
                    disabled={pending}
                    className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    {isSaving ? "…" : "Salvar"}
                  </button>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[120px_80px_1fr_1fr_80px] items-center gap-4">
                <p className="text-sm font-medium">{DAYS[cfg.dayOfWeek]}</p>

                <button
                  role="switch"
                  aria-checked={cfg.isOpen}
                  aria-label={`${DAYS[cfg.dayOfWeek]} — ${cfg.isOpen ? "aberto" : "fechado"}`}
                  onClick={() => update(cfg.dayOfWeek, { isOpen: !cfg.isOpen })}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    cfg.isOpen ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                      cfg.isOpen ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>

                <select
                  value={cfg.openTime}
                  onChange={(e) => update(cfg.dayOfWeek, { openTime: e.target.value })}
                  disabled={!cfg.isOpen}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={cfg.closeTime}
                  onChange={(e) => update(cfg.dayOfWeek, { closeTime: e.target.value })}
                  disabled={!cfg.isOpen}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <button
                  onClick={() => save(cfg.dayOfWeek)}
                  disabled={pending}
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  {isSaving ? "..." : "Salvar"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
