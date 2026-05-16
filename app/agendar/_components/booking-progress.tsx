"use client"

import { ChevronLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useBookingStore } from "@/lib/store/booking-store"
import Link from "next/link"

const STEP_LABELS = ["Serviço", "Horário", "Dados", "Acesso"]
const TOTAL = STEP_LABELS.length

export default function BookingProgress({ currentStep }: { currentStep: number }) {
  const { back } = useBookingStore()
  const progress = ((currentStep + 1) / TOTAL) * 100

  return (
    <header className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="safe-top flex items-center gap-3 px-4 py-3.5">
        {currentStep === 0 ? (
          <Link
            href="/"
            aria-label="Voltar ao início"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white transition-all hover:bg-[#c9a227]/15 hover:border-[#c9a227]/50 hover:text-[#c9a227] active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </Link>
        ) : (
          <button
            onClick={back}
            aria-label="Voltar ao passo anterior"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white transition-all hover:bg-[#c9a227]/15 hover:border-[#c9a227]/50 hover:text-[#c9a227] active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-[#c9a227]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
                {STEP_LABELS[currentStep]}
              </span>
            </div>
            <span className="text-[10px] text-white/25 tabular-nums">
              {currentStep + 1}&thinsp;/&thinsp;{TOTAL}
            </span>
          </div>

          <div className="h-[2px] w-full overflow-hidden bg-white/[0.06]">
            <motion.div
              className="h-full bg-[#c9a227]"
              style={{ boxShadow: "0 0 8px rgba(201,162,39,0.6)" }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: [0.32, 0, 0.08, 1] }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
