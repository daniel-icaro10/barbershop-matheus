"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { ScissorsIcon } from "lucide-react"
import Link from "next/link"

export default function AgendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-5 bg-background">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <ScissorsIcon className="size-4 text-primary" />
        </div>
        <p className="text-sm font-bold">
          <span className="text-primary">Matheus</span>
          <span className="text-foreground"> Barber</span>
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div>
          <p className="text-xl font-bold">Não foi possível carregar</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Erro ao iniciar o agendamento. Tente novamente.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="size-4" />
            Voltar ao início
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
