"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useBookingStore } from "@/lib/store/booking-store"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Scissors, Calendar, Clock, Loader2, RefreshCw, AlertCircle, Mail, ChevronLeft } from "lucide-react"

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

interface StepAuthProps {
  isLoggedIn: boolean
  onGoogleLogin: () => Promise<void>
  onBookingCreate: () => Promise<boolean>
}

type LoginMode = "options" | "email"
type BookingStatus = "idle" | "creating" | "error"

export default function StepAuth({ isLoggedIn, onGoogleLogin, onBookingCreate }: StepAuthProps) {
  const { service, date, time } = useBookingStore()
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("idle")
  const [loginMode, setLoginMode] = useState<LoginMode>("options")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailPending, setEmailPending] = useState(false)
  const [emailError, setEmailError] = useState("")

  useEffect(() => {
    if (isLoggedIn && bookingStatus === "idle") {
      setBookingStatus("creating")
      onBookingCreate().then((success) => { if (!success) setBookingStatus("error") })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, bookingStatus])

  const handleRetry = () => setBookingStatus("idle")

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setEmailPending(true)
    const { error } = await authClient.signIn.email({ email, password })
    setEmailPending(false)
    if (error) setEmailError("Email ou senha incorretos.")
  }

  // ── Spinner ──
  if (isLoggedIn && bookingStatus !== "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-16">
        <div className="relative flex items-center justify-center">
          {[1, 1.6, 2.2].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[#c9a227]/10"
              style={{ width: 56, height: 56 }}
              animate={{ scale, opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: i * 0.35 }}
            />
          ))}
          <div
            className="relative size-14 border-[3px] border-[#c9a227] border-t-transparent rounded-full"
            style={{ animation: "spin 0.9s linear infinite" }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="font-bebas text-[1.5rem] text-white">Confirmando seu horário…</p>
          <p className="mt-1 text-sm text-white/35">Só um segundo</p>
        </motion.div>
      </div>
    )
  }

  // ── Error ──
  if (bookingStatus === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-16"
      >
        <div className="flex size-16 items-center justify-center border border-red-500/20 bg-red-500/10">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-bebas text-[1.6rem] text-white">Horário Indisponível</p>
          <p className="mt-1.5 max-w-xs text-sm text-white/40">
            Este horário foi ocupado enquanto você confirmava. Escolha outro horário.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 bg-[#c9a227] py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all hover:bg-white"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
          <button
            onClick={() => useBookingStore.getState().setStep(1)}
            className="border border-white/[0.08] py-3.5 text-sm font-medium text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            Escolher outro horário
          </button>
        </div>
      </motion.div>
    )
  }

  // ── Auth form ──
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
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Último passo</span>
        </div>
        <h1 className="font-bebas text-white leading-[0.86]" style={{ fontSize: "clamp(2rem,10vw,2.8rem)" }}>
          CONFIRME O <span className="text-[#c9a227]">ACESSO</span>
        </h1>
        <p className="mt-2 text-sm text-white/35">Entre com sua conta para garantir o horário</p>
      </motion.div>

      {/* Booking summary */}
      {service && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.4 }}
          className="mb-8 overflow-hidden border border-white/[0.07] bg-white/[0.03]"
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
          <div className="flex flex-col gap-3 p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/30">Seu agendamento</p>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center border border-[#c9a227]/20">
                <Scissors className="size-4 text-[#c9a227]" />
              </div>
              <div>
                <p className="font-semibold leading-tight text-white">{service.name}</p>
                <p className="text-sm font-bold text-[#c9a227]">{formatPrice(service.priceInCents)}</p>
              </div>
            </div>
            {date && time && (
              <div className="flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <Calendar className="size-3.5 text-white/30" />
                  <span className="capitalize">{format(date, "EEE, dd 'de' MMM", { locale: ptBR })}</span>
                </div>
                <div className="h-3.5 w-px bg-white/[0.08]" />
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <Clock className="size-3.5 text-white/30" />
                  <span className="font-semibold text-white">{time}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Login options */}
      <AnimatePresence mode="wait" initial={false}>
        {loginMode === "options" ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-2.5"
          >
            {/* Google */}
            <button
              onClick={onGoogleLogin}
              className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden border border-white/[0.07] bg-white/[0.03] text-sm font-semibold text-white/70 transition-all duration-300 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/[0.04] hover:text-white active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="relative size-5 shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </button>

            {/* Email */}
            <button
              onClick={() => setLoginMode("email")}
              className="flex h-14 w-full items-center justify-center gap-2.5 border border-white/[0.07] bg-white/[0.03] text-sm font-semibold text-white/50 transition-all duration-200 hover:border-white/15 hover:text-white/80 active:scale-[0.98]"
            >
              <Mail className="size-4" />
              Entrar com Email
            </button>

            <p className="mt-2 text-center text-[11px] text-white/25">
              Seus dados estão seguros e não serão compartilhados
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <button
              onClick={() => { setLoginMode("options"); setEmailError("") }}
              className="mb-4 flex items-center gap-1 text-sm text-white/35 transition-colors hover:text-white/70"
            >
              <ChevronLeft className="size-4" />
              Outras opções
            </button>

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-2.5">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a227]/50 focus:ring-1 focus:ring-[#c9a227]/15 transition-all"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9a227]/50 focus:ring-1 focus:ring-[#c9a227]/15 transition-all"
              />

              <AnimatePresence>
                {emailError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400"
                  >
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={emailPending}
                className="mt-1 flex h-14 w-full items-center justify-center gap-2 bg-[#c9a227] text-[11px] font-bold uppercase tracking-[0.22em] text-black shadow-[0_0_30px_rgba(201,162,39,0.3)] transition-all hover:bg-white disabled:opacity-50"
              >
                {emailPending ? (
                  <><Loader2 className="size-4 animate-spin" />Entrando…</>
                ) : "Entrar e confirmar horário"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
