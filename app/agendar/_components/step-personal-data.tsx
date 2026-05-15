"use client"

import { useBookingStore } from "@/lib/store/booking-store"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { Scissors, Calendar, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

function PremiumInput({
  label, value, onChange, placeholder, type = "text", autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative">
      <label
        className={cn(
          "absolute left-4 z-10 transition-all duration-200 pointer-events-none",
          focused || hasValue
            ? "top-2 text-[9px] font-bold uppercase tracking-[0.35em] text-[#c9a227]"
            : "top-1/2 -translate-y-1/2 text-sm text-white/35"
        )}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ""}
        autoComplete={autoComplete}
        className={cn(
          "w-full border bg-white/[0.03] px-4 pb-3 pt-7 text-sm text-white outline-none transition-all duration-200 placeholder:text-white/25",
          focused
            ? "border-[#c9a227]/50 shadow-[0_0_0_3px_rgba(201,162,39,0.08)]"
            : "border-white/[0.07] hover:border-white/[0.12]"
        )}
      />
    </div>
  )
}

export default function StepPersonalData() {
  const { personalData, service, date, time, setPersonalData, next } = useBookingStore()

  const [name, setName] = useState(personalData?.name ?? "")
  const [phone, setPhone] = useState(personalData?.phone ?? "")
  const [notes, setNotes] = useState(personalData?.notes ?? "")

  const isValid = name.trim().length >= 2 && phone.trim().length >= 8

  const handleContinue = () => {
    setPersonalData({ name: name.trim(), phone: phone.trim(), notes: notes.trim() })
    next()
  }

  return (
    <div className="flex flex-col px-5 pb-10 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-7"
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-px w-5 bg-[#c9a227]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
            Só mais um passo
          </span>
        </div>
        <h1 className="font-bebas text-white leading-[0.86]" style={{ fontSize: "clamp(2rem,10vw,2.8rem)" }}>
          SEUS <span className="text-[#c9a227]">DADOS</span>
        </h1>
      </motion.div>

      {service && date && time && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
          className="mb-6 overflow-hidden border border-white/[0.07] bg-white/[0.03]"
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
          <div className="grid grid-cols-2 gap-0 p-4">
            {[
              { icon: Scissors, label: "Serviço", value: service.name },
              { icon: DollarSign, label: "Valor", value: formatPrice(service.priceInCents) },
              { icon: Calendar, label: "Data", value: format(date, "dd 'de' MMM", { locale: ptBR }) },
              { icon: Clock, label: "Horário", value: time },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 py-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center border border-[#c9a227]/20">
                  <Icon className="size-3.5 text-[#c9a227]" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/30">{label}</p>
                  <p className="text-sm font-semibold text-white leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col gap-2.5"
      >
        <PremiumInput label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" autoComplete="name" />
        <PremiumInput label="Telefone / WhatsApp" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" type="tel" autoComplete="tel" />
        <PremiumInput label="Observações (opcional)" value={notes} onChange={setNotes} placeholder="Ex: prefiro degradê curto nas laterais" />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="mt-8 w-full bg-[#c9a227] py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(201,162,39,0.25)] disabled:shadow-none"
        >
          Continuar para confirmação
        </button>
      </motion.div>
    </div>
  )
}
