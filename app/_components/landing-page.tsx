"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Calendar,
  ChevronDown,
  MessageCircle,
  Clock,
  Award,
  Scissors,
  Shield,
  Zap,
  Play,
  User,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

/* ── Types ──────────────────────────────────────────────────────────────── */

type ServiceData = {
  id: string
  name: string
  description: string | null
  imageUrl: string
  priceInCents: number
  durationInMinutes: number
}

type BarbershopData = {
  name: string
  address: string
  description: string
  phones: string[]
} | null

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

/* ── Service order (user-defined) ────────────────────────────────────────── */

const SERVICE_PRIORITY: Array<(n: string) => boolean> = [
  (n) => /corte/i.test(n),
  (n) => /barba/i.test(n) && !/pezinho/i.test(n),
  (n) => /p[eé]zinho/i.test(n),
  (n) => /sobrancelha/i.test(n),
  (n) => /limpeza/i.test(n),
  (n) => /hidrata/i.test(n),
]

function sortServices(services: ServiceData[]): ServiceData[] {
  return [...services].sort((a, b) => {
    const ai = SERVICE_PRIORITY.findIndex((fn) => fn(a.name))
    const bi = SERVICE_PRIORITY.findIndex((fn) => fn(b.name))
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

/* ── Portfolio videos — add your .mp4 files to /public/videos/ ─────────── */

const PORTFOLIO_VIDEOS = [
  { src: "/videos/reel-1.mp4" },
  { src: "/videos/reel-2.mp4" },
  { src: "/videos/reel-3.mp4" },
  { src: "/videos/reel-4.mp4" },
]

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.12 })
  return { ref, inView }
}

/* ── FadeUp ──────────────────────────────────────────────────────────────── */

function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { ref, inView } = useReveal()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 56 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── FadeIn ──────────────────────────────────────────────────────────────── */

function FadeIn({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number
}) {
  const { ref, inView } = useReveal()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 1.1, ease: "easeOut", delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

/* ── Ornamental section label ────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px w-7 bg-[#c9a227]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
        {children}
      </span>
    </div>
  )
}

/* ── Thin ornamental divider ─────────────────────────────────────────────── */

function Divider() {
  return (
    <div className="mx-5">
      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  )
}

/* ── Cinematic CSS Hero Background ──────────────────────────────────────── */

function CinematicBackground() {
  return (
    <>
      {/* 1. Base — deep warm black */}
      <div className="absolute inset-0 bg-[#060504]" />

      {/* 2. Marble-like stone veins */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(112deg, transparent 32.7%, rgba(255,255,255,0.016) 33%, rgba(255,255,255,0.008) 33.4%, transparent 33.8%)",
            "linear-gradient(68deg, transparent 55.3%, rgba(220,220,220,0.011) 55.6%, rgba(220,220,220,0.005) 55.9%, transparent 56.3%)",
            "linear-gradient(98deg, transparent 18.5%, rgba(201,162,39,0.022) 19%, rgba(201,162,39,0.01) 19.6%, transparent 20.2%)",
            "linear-gradient(140deg, transparent 69.8%, rgba(255,255,255,0.009) 70.1%, rgba(255,255,255,0.004) 70.4%, transparent 70.8%)",
            "linear-gradient(55deg, transparent 41.5%, rgba(180,140,30,0.015) 42%, rgba(180,140,30,0.007) 42.6%, transparent 43.1%)",
            "linear-gradient(125deg, transparent 77%, rgba(200,200,200,0.007) 77.3%, transparent 77.6%)",
            "linear-gradient(82deg, transparent 61%, rgba(201,162,39,0.013) 61.4%, rgba(201,162,39,0.005) 61.8%, transparent 62.2%)",
          ].join(", "),
        }}
      />

      {/* 3. Base grain */}
      <div className="absolute inset-0 cinema-grain opacity-[0.042] pointer-events-none" />

      {/* 4. Primary gold spotlight */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "-28%", left: "50%", marginLeft: "-40vw",
          width: "80vw", height: "88vh",
          background: "radial-gradient(ellipse at center, rgba(201,162,39,0.082) 0%, rgba(160,110,20,0.042) 42%, rgba(100,60,0,0.018) 62%, transparent 75%)",
          filter: "blur(48px)",
        }}
        animate={{ x: [0, 42, -28, 0], y: [0, -20, 12, 0], scale: [1, 1.07, 0.96, 1], opacity: [0.82, 1, 0.72, 0.82] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 5. Crimson orb — bottom left */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: "-22%", left: "-12%",
          width: "58vw", height: "68vh",
          background: "radial-gradient(ellipse at center, rgba(88,14,14,0.1) 0%, rgba(55,7,7,0.052) 48%, transparent 70%)",
          filter: "blur(58px)",
        }}
        animate={{ x: [0, -38, 20, 0], y: [0, 24, -15, 0], scale: [1, 1.09, 0.94, 1], opacity: [0.72, 1, 0.62, 0.72] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* 6. Charcoal fill orb — right */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "14%", right: "-20%",
          width: "52vw", height: "88vh",
          background: "radial-gradient(ellipse at center, rgba(44,44,58,0.072) 0%, transparent 70%)",
          filter: "blur(52px)",
        }}
        animate={{ x: [0, 20, -12, 0], y: [0, -30, 18, 0], opacity: [0.62, 0.92, 0.52, 0.62] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 11 }}
      />

      {/* 7. Center hotspot */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%", marginTop: "-26vh", marginLeft: "-26vw",
          width: "52vw", height: "52vh",
          background: "radial-gradient(ellipse at center, rgba(201,162,39,0.048) 0%, rgba(150,100,0,0.022) 45%, transparent 65%)",
          filter: "blur(38px)",
        }}
        animate={{ scale: [1, 1.06, 0.97, 1], opacity: [0.52, 0.82, 0.44, 0.52] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* 8. Upper-left warm orb */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "10%", left: "-8%",
          width: "40vw", height: "50vh",
          background: "radial-gradient(ellipse at center, rgba(140,90,10,0.052) 0%, transparent 65%)",
          filter: "blur(55px)",
        }}
        animate={{ x: [0, 25, -12, 0], y: [0, -18, 10, 0], opacity: [0.48, 0.75, 0.38, 0.48] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 8 }}
      />

      {/* 9. Diagonal god-rays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.028,
          backgroundImage: [
            "linear-gradient(108deg, transparent 39.5%, rgba(255,252,230,0.9) 40%, rgba(255,252,230,0.5) 40.8%, transparent 42%)",
            "linear-gradient(288deg, transparent 34.5%, rgba(255,252,230,0.6) 35%, rgba(255,252,230,0.25) 35.8%, transparent 37%)",
          ].join(", "),
        }}
      />

      {/* 10. Metallic sheen */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{ top: "47%", height: "4%", background: "linear-gradient(to right, transparent 0%, rgba(255,252,230,0.028) 50%, transparent 100%)" }}
      />

      {/* 11. Slow scan line */}
      <motion.div
        className="absolute inset-x-0 pointer-events-none"
        style={{ height: "1px", background: "linear-gradient(to right, transparent 5%, rgba(201,162,39,0.2) 28%, rgba(255,255,255,0.14) 50%, rgba(201,162,39,0.2) 72%, transparent 95%)" }}
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear", repeatDelay: 15 }}
      />

      {/* 12. Edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 78% 68% at 50% 40%, transparent 25%, rgba(4,3,2,0.62) 65%, rgba(2,1,1,0.94) 100%)" }}
      />

      {/* 13. Top dark cap */}
      <div className="absolute inset-x-0 top-0 h-[28%] pointer-events-none bg-gradient-to-b from-[#030302] via-[#030302]/55 to-transparent" />

      {/* 14. Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none bg-gradient-to-t from-[#080808] via-[#080808]/78 to-transparent" />

      {/* 15. Fine grain top */}
      <div className="absolute inset-0 cinema-grain-fine opacity-[0.022] pointer-events-none" />
    </>
  )
}

/* ── Nav user button ─────────────────────────────────────────────────────── */

function NavUserButton({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: session } = authClient.useSession()

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 border border-[#c9a227]/40 bg-[#c9a227]/8 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a227] backdrop-blur-sm transition-all duration-300 hover:bg-[#c9a227] hover:text-black"
          >
            Admin
          </Link>
        )}
        <Link
          href="/minha-conta"
          className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm transition-all duration-300 hover:border-[#c9a227]/40 hover:bg-[#c9a227]/8"
        >
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ""}
              width={20}
              height={20}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-[#c9a227]/20">
              <User className="size-3 text-[#c9a227]" />
            </div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {session.user.name?.split(" ")[0]}
          </span>
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/50 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:text-white/80"
    >
      <User className="size-3" />
      Entrar
    </Link>
  )
}

/* ── Instagram-style Reel card ───────────────────────────────────────────── */

function ReelCard({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { amount: 0.5 })

  useEffect(() => {
    if (!videoRef.current) return
    if (inView) videoRef.current.play().catch(() => {})
    else { videoRef.current.pause(); videoRef.current.currentTime = 0 }
  }, [inView])

  return (
    <div
      ref={containerRef}
      className="group relative shrink-0 overflow-hidden"
      style={{ width: 270, height: 360 }}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Placeholder — slot vazio */}
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0e0c0a]">
          <Play className="size-8 text-[#c9a227]/30" />
        </div>
      )}

      {/* Border on hover */}
      <div className="absolute inset-0 border border-transparent transition-all duration-300 group-hover:border-[#c9a227]/25" />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

export function LandingPage({
  barbershop,
  services,
  isAdmin = false,
}: {
  barbershop: BarbershopData
  services: ServiceData[]
  isAdmin?: boolean
}) {
  /* Parallax hero */
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroImgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"])
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  /* WhatsApp */
  const rawPhone = barbershop?.phones?.[0]?.replace(/\D/g, "") ?? "5581989759980"
  const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent("Olá! Gostaria de agendar um horário na Matheus Barbeiro.")}`

  /* Sorted services */
  const sortedServices = sortServices(services)

  return (
    <div className="bg-[#080808] text-white overflow-x-hidden selection:bg-[#c9a227]/25">

      {/* ── NAVBAR ── */}
      <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-auto">
          <Image
            src="/logo.png"
            alt="Matheus Barbeiro"
            width={72}
            height={50}
            className="brightness-110 drop-shadow-[0_0_12px_rgba(201,162,39,0.3)] lg:w-[100px] lg:h-[70px]"
          />
          <div className="flex items-center gap-2">
            <NavUserButton isAdmin={isAdmin} />
            <Link
              href="/agendar"
              className="flex items-center gap-2 border border-[#c9a227]/50 bg-[#c9a227]/5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a227] backdrop-blur-sm transition-all duration-300 hover:bg-[#c9a227] hover:text-black"
            >
              <Calendar className="size-3" />
              Agendar
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative h-dvh overflow-hidden">
        <motion.div
          style={{ y: heroImgY }}
          className="absolute inset-0 scale-[1.15] will-change-transform"
        >
          <CinematicBackground />
        </motion.div>

        <motion.div
          style={{ opacity: heroContentOpacity }}
          className="relative h-full flex flex-col items-center justify-center px-6 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-[#c9a227]/15 blur-3xl rounded-full scale-150" />
            <Image
              src="/logo.png"
              alt="Matheus Barbeiro"
              width={140}
              height={98}
              className="relative opacity-95 drop-shadow-[0_0_28px_rgba(201,162,39,0.5)] lg:w-[220px] lg:h-[154px]"
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-playfair italic text-lg text-white/60 tracking-wide mb-5"
          >
            Seu estilo, sua identidade.
          </motion.p>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 44 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-bebas leading-[0.86] tracking-wide">
              <span className="block text-white" style={{ fontSize: "clamp(3.8rem, 19vw, 11rem)" }}>O PADRÃO</span>
              <span className="block text-[#c9a227] drop-shadow-[0_0_30px_rgba(201,162,39,0.4)]" style={{ fontSize: "clamp(3.8rem, 19vw, 11rem)" }}>DO SEU</span>
              <span className="block text-white" style={{ fontSize: "clamp(3.8rem, 19vw, 11rem)" }}>VISUAL</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.3, delay: 1 }}
            className="mt-6 text-[11px] uppercase tracking-[0.28em] text-white/40 max-w-[260px]"
          >
            Precisão · Experiência · Identidade
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/agendar"
              className="flex items-center gap-2.5 bg-[#c9a227] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-all duration-300 hover:bg-white hover:scale-105 shadow-[0_0_50px_rgba(201,162,39,0.35)]"
            >
              <Calendar className="size-4" />
              Agendar Horário
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 transition-all duration-300 hover:border-white/40 hover:text-white"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        >
          <span className="text-[9px] uppercase tracking-[0.45em] text-white/25">scroll</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="size-4 text-white/25" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── SECTION 1 — SERVIÇOS ── */}
      {sortedServices.length > 0 && (
        <section className="px-5 py-20">
          <div className="max-w-5xl mx-auto">
          <FadeUp className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-7 bg-[#c9a227]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Nossos Serviços</span>
              <div className="h-px w-7 bg-[#c9a227]" />
            </div>
            <h2
              className="font-bebas text-white leading-[0.88] mt-1"
              style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)" }}
            >
              PRECISÃO EM CADA{" "}
              <span className="text-[#c9a227]">DETALHE.</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {sortedServices.map((service, i) => (
              <FadeUp key={service.id} delay={0.05 * (i % 8)}>
                <Link href={`/agendar?serviceId=${service.id}`} className="group block">
                  <div className="relative overflow-hidden aspect-[3/4] bg-[#111]">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-bebas text-[1.05rem] leading-tight text-white tracking-wide">{service.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-white/45">
                          <Clock className="size-2.5" />
                          {service.durationInMinutes}min
                        </span>
                        <span className="text-sm font-bold text-[#c9a227]">{fmt(service.priceInCents)}</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 border border-transparent transition-all duration-400 group-hover:border-[#c9a227]/35" />
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-[#c9a227] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.2} className="mt-10 text-center">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#c9a227] border border-[#c9a227]/30 px-7 py-3 transition-all duration-300 hover:bg-[#c9a227] hover:text-black"
            >
              <Calendar className="size-3.5" />
              Agendar agora
            </Link>
          </FadeUp>
          </div>
        </section>
      )}

      <Divider />

      {/* ── SECTION 2 — PORTFÓLIO EM VÍDEO ── */}
      <section className="py-20">
        <FadeUp className="px-5 mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-7 bg-[#c9a227]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Nosso Portfólio</span>
            <div className="h-px w-7 bg-[#c9a227]" />
          </div>
          <h2
            className="font-bebas text-white leading-[0.88] mt-1"
            style={{ fontSize: "clamp(2.4rem, 7vw, 4rem)" }}
          >
            ACOMPANHE NOSSO{" "}
            <span className="text-[#c9a227]">TRABALHO</span>
          </h2>
          <p className="mt-2 text-[11px] text-white/35 uppercase tracking-[0.22em]">
            Siga no Instagram · @matheus.luiz51
          </p>
        </FadeUp>

        {/* Vídeos centralizados */}
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none justify-start lg:justify-center" style={{ scrollSnapType: "x mandatory" }}>
            {PORTFOLIO_VIDEOS.map((v, i) => (
              <FadeIn key={v.src} delay={0.06 * i} className="shrink-0" style={{ scrollSnapAlign: "start" }}>
                <ReelCard src={v.src} />
              </FadeIn>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#080808] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#080808] to-transparent" />
        </div>

      </section>

      <Divider />

      {/* ── SECTION 3 — CURSO ── */}
      <section className="px-5 py-20">
        <div className="max-w-2xl mx-auto">
          <FadeUp className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-7 bg-[#c9a227]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Formação Profissional</span>
              <div className="h-px w-7 bg-[#c9a227]" />
            </div>
            <div className="inline-flex items-center gap-2 border border-red-900/50 bg-red-950/20 px-4 py-1.5">
              <div className="size-1.5 rounded-full bg-red-500/60 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-red-400/70">
                Brevemente Indisponível
              </span>
            </div>
          </FadeUp>

          {/* Imagem do curso */}
          <FadeUp delay={0.08}>
            <div className="relative w-full overflow-hidden">
              <Image
                src="/curso.png"
                alt="Curso de Barbeiro Iniciante"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
          </FadeUp>

          <FadeUp delay={0.18} className="mt-6">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 border border-white/12 bg-white/4 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.28em] text-white/45 transition-all duration-300 hover:border-[#c9a227]/30 hover:text-white/65"
            >
              <MessageCircle className="size-4" />
              Quero ser notificado
            </a>
          </FadeUp>
        </div>
      </section>

      <Divider />

      {/* ── SECTION 4 — QUEM SOMOS ── */}
      <section className="px-5 py-20 max-w-xl mx-auto">
        <FadeUp className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-7 bg-[#c9a227]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">Quem somos</span>
            <div className="h-px w-7 bg-[#c9a227]" />
          </div>
        </FadeUp>

        <FadeUp delay={0.08} className="text-center">
          <h2 className="font-bebas text-white leading-[0.88] mt-1"
              style={{ fontSize: "clamp(2.4rem, 10vw, 4.5rem)" }}>
            MAIS QUE UM CORTE.{" "}
            <span className="text-[#c9a227]">UMA TRANSFORMAÇÃO.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.16} className="mt-7 space-y-4">
          <p className="text-white/65 leading-relaxed text-[15px]">
            {barbershop?.description ||
              "Cada cliente que entra carrega uma história — e cada corte que sai daqui conta a sua versão mais confiante."}
          </p>
          <p className="text-white/40 leading-relaxed text-sm font-light">
            Não é sobre tendências passageiras. É precisão artesanal, atenção absoluta aos detalhes e a certeza de que cada milímetro importa. Do primeiro aperto de mão ao espelho final — a experiência é completa.
          </p>
        </FadeUp>

        <FadeUp delay={0.22} className="mt-10">
          <div className="h-px bg-gradient-to-r from-[#c9a227]/30 via-white/10 to-transparent" />
        </FadeUp>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { value: "500+", label: "Clientes atendidos" },
            { value: "4.9★", label: "Avaliação média" },
            { value: "5+", label: "Anos de experiência" },
          ].map(({ value, label }, i) => (
            <FadeUp key={label} delay={0.1 * i + 0.28}>
              <div className="text-center">
                <p className="font-bebas text-[2.4rem] leading-none text-[#c9a227]">{value}</p>
                <p className="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-white/35 leading-tight">{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Brand values */}
        <FadeUp delay={0.4} className="mt-10 grid grid-cols-2 gap-3">
          {[
            { icon: Scissors, label: "Precisão artesanal" },
            { icon: Shield, label: "Experiência premium" },
            { icon: Zap, label: "Agendamento rápido" },
            { icon: Award, label: "Resultado garantido" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 border border-white/7 bg-white/3 px-4 py-3">
              <Icon className="size-4 shrink-0 text-[#c9a227]" />
              <span className="text-[11px] font-medium text-white/60 tracking-wide">{label}</span>
            </div>
          ))}
        </FadeUp>
      </section>

      <Divider />

      {/* ── SECTION 5 — CTA FINAL ── */}
      <section className="relative px-5 py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 rounded-full bg-[#c9a227]/6 blur-[80px]"
            style={{ width: 500, height: 500 }}
          />
          <div
            className="absolute bottom-0 left-0 rounded-full bg-[#8B1A1A]/8 blur-[100px]"
            style={{ width: 300, height: 300 }}
          />
        </div>

        <div className="relative text-center max-w-lg mx-auto">
          <FadeUp>
            <Label>Pronto para o próximo nível?</Label>
            <h2
              className="font-bebas text-white leading-[0.86] mt-1"
              style={{ fontSize: "clamp(3.2rem, 15vw, 8rem)" }}
            >
              ELEVE SEU{" "}
              <span className="text-[#c9a227]" style={{ textShadow: "0 0 60px rgba(201,162,39,0.4)" }}>
                VISUAL
              </span>{" "}
              AGORA.
            </h2>
          </FadeUp>

          <FadeUp delay={0.12}>
            <p className="mt-5 text-[13px] text-white/45 tracking-wider">
              Agende seu horário e viva uma experiência premium.
            </p>
          </FadeUp>

          <FadeUp delay={0.22} className="mt-11 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/agendar"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#c9a227] px-10 text-[11px] font-bold uppercase tracking-[0.25em] text-black transition-all duration-300 hover:bg-white hover:scale-105 shadow-[0_0_60px_rgba(201,162,39,0.3)]"
              style={{ paddingTop: "1.125rem", paddingBottom: "1.125rem" }}
            >
              <Calendar className="size-4" />
              Agendar Agora
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 border border-white/18 bg-white/4 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65 transition-all duration-300 hover:border-white/35 hover:text-white"
            >
              <MessageCircle className="size-4" />
              Fale no WhatsApp
            </a>
          </FadeUp>

          {barbershop?.address && (
            <FadeIn delay={0.36} className="mt-9">
              <p className="text-[11px] text-white/28 tracking-[0.18em]">
                📍 {barbershop.address}
              </p>
            </FadeIn>
          )}
        </div>

        <div className="absolute top-0 inset-x-0">
          <div className="h-px bg-gradient-to-r from-transparent via-[#c9a227]/35 to-transparent" />
        </div>
        <div className="absolute bottom-0 inset-x-0">
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt="Matheus Barbeiro"
            width={56}
            height={40}
            className="opacity-30"
          />
          <div className="h-px w-12 bg-[#c9a227]/20" />
          <p className="text-[10px] text-white/22 tracking-[0.22em] uppercase">
            © 2025 Matheus Barbeiro · Todos os direitos reservados
          </p>
          <div className="flex items-center gap-5">
            <Link href="/agendar" className="text-[10px] text-[#c9a227]/45 tracking-[0.18em] uppercase transition-colors hover:text-[#c9a227]">
              Agendar
            </Link>
            <div className="h-2.5 w-px bg-white/10" />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-white/30 tracking-[0.18em] uppercase transition-colors hover:text-white/55"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
