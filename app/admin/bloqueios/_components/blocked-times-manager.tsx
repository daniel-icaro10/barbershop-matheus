"use client"

import { useState, useTransition } from "react"
import { createBlockedTime } from "@/app/_actions/admin/create-blocked-time"
import { deleteBlockedTime } from "@/app/_actions/admin/delete-blocked-time"
import { toast } from "sonner"
import { ptBR } from "date-fns/locale"
import { formatInTimeZone } from "date-fns-tz"

const TZ = "America/Sao_Paulo"
import { Trash2, Plus, Ban } from "lucide-react"

interface BlockedEntry {
  id: string
  startDate: string
  endDate: string
  reason: string | null
}

interface Props {
  initial: BlockedEntry[]
}

export function BlockedTimesManager({ initial }: Props) {
  const [items, setItems] = useState<BlockedEntry[]>(initial)
  const [pending, startTransition] = useTransition()

  // Form state
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("12:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("13:00")
  const [reason, setReason] = useState("")

  const handleAdd = () => {
    if (!startDate || !endDate) {
      toast.error("Preencha as datas de início e fim.")
      return
    }
    const start = new Date(`${startDate}T${startTime}:00`)
    const end = new Date(`${endDate}T${endTime}:00`)
    if (end <= start) {
      toast.error("A data de fim deve ser após o início.")
      return
    }
    startTransition(async () => {
      const result = await createBlockedTime({ startDate: start, endDate: end, reason: reason || undefined })
      if (result?.serverError || !result?.data) {
        toast.error("Erro ao criar bloqueio.")
        return
      }
      toast.success("Bloqueio criado.")
      // Use the real DB record (id is needed for delete)
      setItems((prev) => [...prev, result.data!])
      setStartDate("")
      setEndDate("")
      setReason("")
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteBlockedTime({ id })
      if (result?.serverError) {
        toast.error("Erro ao remover bloqueio.")
        return
      }
      toast.success("Bloqueio removido.")
      setItems((prev) => prev.filter((i) => i.id !== id))
    })
  }

  const inputClass =
    "rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <p className="mb-4 text-sm font-semibold">Novo bloqueio</p>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hora início
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data fim
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hora fim
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-3">
          <input
            type="text"
            placeholder="Motivo (opcional) — ex: Almoço, Férias, Manutenção"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={handleAdd}
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="text-sm font-semibold">Bloqueios ativos</h2>
        </div>
        <div className="divide-y divide-border/40">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <Ban className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhum bloqueio cadastrado
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-400/10">
                  <Ban className="size-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {item.reason ?? "Indisponibilidade"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatInTimeZone(new Date(item.startDate), TZ, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    {" → "}
                    {formatInTimeZone(new Date(item.endDate), TZ, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={pending}
                  aria-label={`Remover bloqueio${item.reason ? `: ${item.reason}` : ""}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
