"use client"

import { useState, useTransition } from "react"
import { authClient } from "@/lib/auth-client"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    startTransition(async () => {
      if (mode === "forgot") {
        const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/redefinir-senha" })
        if (error) { setError("Não foi possível enviar o email."); return }
        setSuccess("Link enviado! Verifique seu email.")
        return
      }
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({ name, email, password })
        if (error) { setError(error.message ?? "Erro ao criar conta."); return }
        window.location.href = "/"
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) { setError("Email ou senha incorretos."); return }
        window.location.href = "/"
      }
    })
  }

  const switchMode = (next: "login" | "signup" | "forgot") => {
    setMode(next)
    setError("")
    setSuccess("")
    setName("")
  }

  const inputBase =
    "w-full rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all duration-200"

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 bg-background">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute left-5 top-6"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Início
        </Link>
      </motion.div>

      <div className="w-full max-w-sm">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <Image
            src="/logo.png"
            alt="Matheus Barbeiro"
            width={88}
            height={88}
            className="drop-shadow-[0_0_18px_rgba(201,162,39,0.35)]"
          />
          <div className="text-center">
            <p className="text-xl font-bold">
              <span className="text-primary">Matheus</span>
              <span className="text-foreground"> Barber</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-1 text-sm text-muted-foreground"
              >
                {mode === "login" ? "Entre na sua conta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha"}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className={inputBase}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputBase}
            />

            <AnimatePresence initial={false}>
              {mode !== "forgot" && (
                <motion.div
                  key="password-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputBase}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={pending}
              whileTap={{ scale: 0.98 }}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === "forgot" ? "Enviando..." : mode === "login" ? "Entrando..." : "Criando conta..."}
                </>
              ) : (
                mode === "forgot" ? "Enviar link" : mode === "login" ? "Entrar" : "Criar conta"
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Toggle mode */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center text-sm text-muted-foreground"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {mode === "login" ? (
                <>
                  Não tem conta?{" "}
                  <button onClick={() => switchMode("signup")} className="font-semibold text-primary hover:underline">
                    Criar conta
                  </button>
                </>
              ) : mode === "signup" ? (
                <>
                  Já tem conta?{" "}
                  <button onClick={() => switchMode("login")} className="font-semibold text-primary hover:underline">
                    Entrar
                  </button>
                </>
              ) : (
                <>
                  Lembrou a senha?{" "}
                  <button onClick={() => switchMode("login")} className="font-semibold text-primary hover:underline">
                    Voltar ao login
                  </button>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.p>
      </div>
    </div>
  )
}
