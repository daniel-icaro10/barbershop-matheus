export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { formatInTimeZone } from "date-fns-tz"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, Clock, Scissors, CheckCircle2, XCircle, History, User } from "lucide-react"

const TZ = "America/Sao_Paulo"
import { cn } from "@/lib/utils"
import { CancelButton } from "./_components/cancel-button"
import { LogoutButton } from "./_components/logout-button"
import { PushButton } from "./_components/push-button"

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

export default async function MinhaContaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/login")

  const now = new Date()

  const [bookings, allServices] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { service: { select: { id: true, name: true, priceInCents: true, durationInMinutes: true, imageUrl: true, description: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.barbershopService.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true },
    }),
  ])

  const upcoming = bookings.filter((b) => !b.cancelled && new Date(b.date) >= now)
  const past = bookings.filter((b) => b.cancelled || new Date(b.date) < now)
  const nextBooking = upcoming[0] ?? null

  const bookedServiceIds = new Set(bookings.filter((b) => !b.cancelled).map((b) => b.serviceId))
  const suggestions = allServices
    .filter((s) => !bookedServiceIds.has(s.id))
    .slice(0, 4)
  const fallbackSuggestions = suggestions.length > 0
    ? suggestions
    : allServices.filter((s) => s.id !== nextBooking?.serviceId).slice(0, 4)

  const firstName = session.user.name?.split(" ")[0] ?? "Cliente"

  return (
    <div className="min-h-dvh bg-[#080808] text-white">
      {/* ── Header sticky com safe area ── */}
      <header className="sticky top-0 z-50 bg-[#080808]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="safe-top flex min-h-14 items-center justify-between px-5">
          <Link
            href="/"
            aria-label="Voltar ao início"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white transition-all hover:bg-[#c9a227]/15 hover:border-[#c9a227]/50 hover:text-[#c9a227] active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pb-20 pt-6">

        {/* ── User greeting ── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-[#c9a227]/20 bg-[#c9a227]/8">
            {session.user.image ? (
              <Image src={session.user.image} alt={session.user.name ?? ""} fill className="object-cover" />
            ) : (
              <User className="size-6 text-[#c9a227]/60" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#c9a227]">
              Bem-vindo de volta
            </p>
            <h1 className="mt-0.5 font-bebas text-[1.8rem] leading-none text-white">
              {firstName}
            </h1>
            <p className="mt-0.5 text-xs text-white/30">{session.user.email}</p>
          </div>
        </div>

        {/* ── Notificações (só aparece no PWA instalado) ── */}
        <div className="mb-8">
          <PushButton />
        </div>

        {/* ── Próximo agendamento ── */}
        {nextBooking ? (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-px w-5 bg-[#c9a227]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
                Próximo horário
              </span>
            </div>

            <div className="overflow-hidden border border-[#c9a227]/20 bg-[#c9a227]/[0.03]">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center border border-[#c9a227]/20 bg-[#c9a227]/8">
                      <Scissors className="size-4.5 text-[#c9a227]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{nextBooking.service.name}</p>
                      <p className="text-sm font-bold text-[#c9a227]">
                        {fmt(nextBooking.service.priceInCents)}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 border border-[#c9a227]/20 bg-[#c9a227]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#c9a227]">
                    <CheckCircle2 className="size-3" />
                    Confirmado
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-white/60">
                    <Calendar className="size-3.5 text-[#c9a227]/60" />
                    <span className="capitalize">
                      {formatInTimeZone(new Date(nextBooking.date), TZ, "EEE, dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="h-3.5 w-px bg-white/[0.08]" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="size-3.5 text-[#c9a227]/60" />
                    <span className="font-bold text-white">
                      {formatInTimeZone(new Date(nextBooking.date), TZ, "HH:mm")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href="/agendar"
                    className="flex min-h-[44px] items-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a227]/60 transition-colors hover:text-[#c9a227]"
                  >
                    + Novo agendamento
                  </Link>
                  <CancelButton bookingId={nextBooking.id} />
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="flex flex-col items-center gap-4 border border-white/[0.06] bg-white/[0.02] py-10">
              <div className="flex size-14 items-center justify-center border border-white/[0.08] bg-white/[0.03]">
                <Scissors className="size-6 text-white/20" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white/70">Nenhum horário agendado</p>
                <p className="mt-1 text-sm text-white/30">Reserve agora e garanta seu horário</p>
              </div>
              <Link
                href="/agendar"
                className="bg-[#c9a227] px-8 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-all hover:bg-white"
              >
                Agendar agora
              </Link>
            </div>
          </section>
        )}

        {/* ── Sugestões ── */}
        {fallbackSuggestions.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-px w-5 bg-[#c9a227]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
                {suggestions.length > 0 ? "Experimente também" : "Que tal repetir?"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {fallbackSuggestions.map((service) => (
                <Link
                  key={service.id}
                  href={`/agendar?serviceId=${service.id}`}
                  className="group flex flex-col gap-2 border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-[#c9a227]/25 hover:bg-[#c9a227]/[0.04]"
                >
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors leading-tight">
                    {service.name}
                  </p>
                  <p className="text-[11px] text-white/35 leading-snug line-clamp-2">
                    {service.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-[#c9a227]">
                      {fmt(service.priceInCents)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#c9a227]/50 group-hover:text-[#c9a227] transition-colors">
                      Agendar →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Histórico ── */}
        {past.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="h-px w-5 bg-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-white/30">
                Histórico
              </span>
              <History className="size-3 text-white/20" />
            </div>

            <div className="flex flex-col gap-2">
              {past.map((booking) => {
                const isCancelled = booking.cancelled
                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "flex items-center justify-between gap-3 border px-4 py-3.5 transition-opacity",
                      isCancelled
                        ? "border-white/[0.04] opacity-40"
                        : "border-white/[0.07] opacity-70",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {booking.service.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/40">
                        {formatInTimeZone(new Date(booking.date), TZ, "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-white/40">
                        {fmt(booking.service.priceInCents)}
                      </span>
                      {isCancelled ? (
                        <span className="flex items-center gap-1 text-[10px] text-red-400/70">
                          <XCircle className="size-2.5" />
                          Cancelado
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/25">Concluído</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {bookings.length === 0 && (
          <p className="mt-4 text-center text-sm text-white/25">
            Seu histórico aparecerá aqui após o primeiro agendamento.
          </p>
        )}
      </div>
    </div>
  )
}
