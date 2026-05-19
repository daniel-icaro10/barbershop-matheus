import { render } from "@react-email/components"
import { resend, EMAIL_FROM } from "./resend"
import { BookingConfirmationEmail } from "./templates/booking-confirmation"
import { BookingCancellationEmail } from "./templates/booking-cancellation"
import { BookingReminderEmail } from "./templates/booking-reminder"
import { formatInTimeZone } from "date-fns-tz"
import { APP_TIMEZONE } from "@/lib/constants/timezone"
import { ptBR } from "date-fns/locale"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://matheusbarbe iro.com.br"
const WHATSAPP_NUMBER = "5581989759980"

function buildCalendarUrl(date: Date, serviceName: string, durationInMinutes: number): string {
  const end = new Date(date.getTime() + durationInMinutes * 60_000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "")
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName + " · Matheus Barbeiro")}&dates=${fmt(date)}/${fmt(end)}`
}

export async function sendBookingConfirmationEmail({
  to,
  clientName,
  serviceName,
  servicePrice,
  durationInMinutes,
  bookingDate,
}: {
  to: string
  clientName: string
  serviceName: string
  servicePrice: number
  durationInMinutes: number
  bookingDate: Date
}) {
  const dateLabel = formatInTimeZone(bookingDate, APP_TIMEZONE, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const calendarUrl = buildCalendarUrl(bookingDate, serviceName, durationInMinutes)
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Acabei de fazer meu agendamento pelo site. 📅")}`

  const html = await render(
    BookingConfirmationEmail({ clientName, serviceName, servicePrice, dateLabel, calendarUrl, whatsappUrl })
  )

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Agendamento confirmado — ${serviceName} · ${formatInTimeZone(bookingDate, APP_TIMEZONE, "dd/MM HH:mm")}`,
    html,
  })
}

export async function sendBookingCancellationEmail({
  to,
  clientName,
  serviceName,
  bookingDate,
}: {
  to: string
  clientName: string
  serviceName: string
  bookingDate: Date
}) {
  const dateLabel = formatInTimeZone(bookingDate, APP_TIMEZONE, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })

  const html = await render(
    BookingCancellationEmail({ clientName, serviceName, dateLabel, rebookUrl: APP_URL })
  )

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Agendamento cancelado — ${serviceName} · ${formatInTimeZone(bookingDate, APP_TIMEZONE, "dd/MM HH:mm")}`,
    html,
  })
}

export async function sendBookingReminderEmail({
  to,
  clientName,
  serviceName,
  servicePrice,
  durationInMinutes,
  bookingDate,
}: {
  to: string
  clientName: string
  serviceName: string
  servicePrice: number
  durationInMinutes: number
  bookingDate: Date
}) {
  const dateLabel = formatInTimeZone(bookingDate, APP_TIMEZONE, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const timeLabel = formatInTimeZone(bookingDate, APP_TIMEZONE, "HH:mm")
  const calendarUrl = buildCalendarUrl(bookingDate, serviceName, durationInMinutes)
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Tenho um agendamento amanhã. 📅")}`

  const html = await render(
    BookingReminderEmail({ clientName, serviceName, servicePrice, dateLabel, timeLabel, calendarUrl, whatsappUrl })
  )

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Lembrete: seu horário é amanhã às ${timeLabel} — ${serviceName}`,
    html,
  })
}
