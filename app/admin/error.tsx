"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminError({
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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-5 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertCircle className="size-7 text-destructive" />
        </div>

        <div>
          <p className="text-lg font-bold">Erro ao carregar página</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Ocorreu um erro inesperado. Tente recarregar ou volte ao dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
          >
            <RefreshCw className="size-3.5" />
            Tentar novamente
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
