"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const inputBase =
  "w-full rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all duration-200"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setError("As senhas não coincidem."); return }
    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres."); return }

    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: password, token })
      if (error) { setError("Link inválido ou expirado. Solicite um novo."); return }
      setDone(true)
      setTimeout(() => router.push("/login"), 2500)
    })
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Link inválido.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Voltar ao login
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <CheckCircle2 className="size-12 text-emerald-400" />
        <div>
          <p className="font-semibold text-white">Senha redefinida!</p>
          <p className="mt-1 text-sm text-muted-foreground">Redirecionando para o login...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className={inputBase}
      />
      <input
        type="password"
        placeholder="Confirmar nova senha"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        className={inputBase}
      />
      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{error}</p>
      )}
      <motion.button
        type="submit"
        disabled={pending}
        whileTap={{ scale: 0.98 }}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <><Loader2 className="size-4 animate-spin" />Salvando...</> : "Salvar nova senha"}
      </motion.button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 bg-background">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute left-5 top-6"
      >
        <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Login
        </Link>
      </motion.div>

      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <Image src="/logo.png" alt="Matheus Barbeiro" width={88} height={88} className="drop-shadow-[0_0_18px_rgba(201,162,39,0.35)]" />
          <div className="text-center">
            <p className="text-xl font-bold">
              <span className="text-primary">Matheus</span>
              <span className="text-foreground"> Barber</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Criar nova senha</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20"
        >
          <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  )
}
