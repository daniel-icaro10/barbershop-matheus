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
import {
  ArrowLeft, Calendar, Clock, Scissors, CheckCircle2,
  XCircle, History, User, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CancelButton } from "./_components/cancel-button"
import { LogoutButton } from "./_components/logout-button"
import { PushButton } from "./_components/push-button"

const TZ = "America/Sao_Paulo"

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)

export default async function MinhaContaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/login")

  const now = new Date()

  const [bookings, allServices] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        service: {
          select: {
            id: true, name: true, priceInCents: true,
            durationInMinutes: true, imageUrl: true, description: true,
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.barbershopItem.findMany({
      where: { barbershopId: DEFAULT_BARBERSHOP_ID, isActive: true, type: "SERVICE" },
    }),
  ])

  const upcoming = bookings.filter((b) => !b.cancelled && new Date(b.date) >= now)
  const past = bookings.filter((b) => b.cancelled || new Date(b.date) < now)
  const nextBooking = upcoming[0] ?? null

  const bookedServiceIds = new Set(bookings.filter((b) => !b.cancelled).map((b) => b.serviceId))
  const suggestions = allServices.filter((s) => !bookedServiceIds.has(s.id)).slice(0, 4)
  const fallbackSuggestions =
    suggestions.length > 0
      ? suggestions
      : allServices.filter((s) => s.id !== nextBooking?.serviceId).slice(0, 4)

  const firstName = session.user.name?.split(" ")[0] ?? "Cliente"

  return (
    <div className="min-h-dvh bg-[#060504] text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060504]/95 backdrop-blur-xl">
        <div className="safe-top flex min-h-14 items-center justify-between px-5">
          <Link
            href="/"
            aria-label="Voltar ao início"
            className="flex size-9 shrink-0 items-center justify-center border border-white/[0.07] bg-white/[0.03] text-white/50 transition-all hover:border-[#c9a227]/40 hover:bg-[#c9a227]/[0.06] hover:text-[#c9a227] active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <PushButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pb-20 pt-6">

        {/* ── Identidade do usuário ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-px w-5 bg-[#c9a227]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-[#c9a227]">
              Minha Conta
            </span>
          </div>

          <div className="flex items-center gap-4 border border-white/[0.07] bg-white/[0.03] p-4">
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-white/[0.07] bg-white/[0.03]">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="size-6 text-white/20" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bebas text-[1.6rem] leading-none text-white tracking-wide">
                {firstName}
              </h1>
              <p className="mt-1 truncate text-[11px] text-white/30">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* ── Próximo agendamento ── */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
              Próximo horário
            </span>
            <Link
              href="/agendar"
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a227]/60 transition-colors hover:text-[#c9a227]"
            >
              + Agendar
            </Link>
          </div>

          {nextBooking ? (
            <div className="border border-white/[0.07] bg-white/[0.03]">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a227]/60 to-transparent" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-[#c9a227]/20 bg-[#c9a227]/[0.06]">
                      <Scissors className="size-4 text-[#c9a227]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white/90 leading-tight">
                        {nextBooking.service.name}
                      </p>
                      <p className="text-sm font-bold text-[#c9a227]">
                        {fmt(nextBooking.service.priceInCents)}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 border border-[#c9a227]/20 bg-[#c9a227]/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#c9a227]">
                    <CheckCircle2 className="size-2.5" />
                    Confirmado
                  </span>
                </div>

                <div className="flex items-center gap-4 border border-white/[0.06] bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <Calendar className="size-3 text-[#c9a227]/50" />
                    <span className="capitalize">
                      {formatInTimeZone(new Date(nextBooking.date), TZ, "EEE, dd 'de' MMM", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/[0.08]" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="size-3 text-[#c9a227]/50" />
                    <span className="font-bold text-white">
                      {formatInTimeZone(new Date(nextBooking.date), TZ, "HH:mm")}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/[0.08]" />
                  <span className="text-[10px] text-white/30">
                    {nextBooking.service.durationInMinutes} min
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <CancelButton bookingId={nextBooking.id} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 border border-white/[0.07] bg-white/[0.03] py-10">
              <div className="flex size-12 items-center justify-center border border-white/[0.07] bg-white/[0.03]">
                <Scissors className="size-5 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/60">Nenhum horário agendado</p>
                <p className="mt-0.5 text-xs text-white/25">Reserve agora e garanta seu horário</p>
              </div>
              <Link
                href="/agendar"
                className="bg-[#c9a227] px-8 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-all hover:bg-white"
              >
                Agendar agora
              </Link>
            </div>
          )}
        </section>

        {/* ── Sugestões ── */}
        {fallbackSuggestions.length > 0 && (
          <section className="mb-6">
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">
                {suggestions.length > 0 ? "Experimente também" : "Que tal repetir?"}
              </span>
            </div>

            <div className="border border-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.04]">
              {fallbackSuggestions.map((service) => (
                <Link
                  key={service.id}
                  href={`/agendar?serviceId=${service.id}`}
                  className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                      {service.name}
                    </p>
                    {service.description && (
                      <p className="mt-0.5 text-[11px] text-white/30 truncate">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-[#c9a227]">
                      {fmt(service.priceInCents)}
                    </span>
                    <ChevronRight className="size-3.5 text-white/20 group-hover:text-[#c9a227]/60 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Histórico ── */}
        {past.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <History className="size-3 text-white/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/30">
                Histórico
              </span>
            </div>

            <div className="border border-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.04]">
              {past.map((booking) => {
                const isCancelled = booking.cancelled
                return (
                  <div
                    key={booking.id}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-3.5",
                      isCancelled && "opacity-40",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white/80">
                        {booking.service.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/30">
                        {formatInTimeZone(
                          new Date(booking.date),
                          TZ,
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
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
                        <span className="text-[10px] text-white/20">Concluído</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {bookings.length === 0 && (
          <p className="mt-4 text-center text-xs text-white/20">
            Seu histórico aparecerá aqui após o primeiro agendamento.
          </p>
        )}
      </div>
    </div>
  )
}
