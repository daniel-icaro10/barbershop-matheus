"use server"

import { actionClient } from "@/lib/action-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { returnValidationErrors } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { after } from "next/server"
import { sendBookingCancellationEmail } from "@/lib/email/send-booking-emails"
import { z } from "zod"

const inputSchema = z.object({
  bookingId: z.string().uuid(),
})

export const cancelBooking = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { bookingId } }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return returnValidationErrors(inputSchema, { _errors: ["Não autorizado"] })
    }

    // Fetch booking details before cancelling so we have data for the email
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
        cancelled: true,
        date: true,
        service: { select: { name: true } },
      },
    })

    if (!bookingDetails) {
      return returnValidationErrors(inputSchema, { _errors: ["Reserva não encontrada"] })
    }
    if (bookingDetails.userId !== session.user.id) {
      return returnValidationErrors(inputSchema, { _errors: ["Sem permissão para cancelar esta reserva"] })
    }
    if (bookingDetails.cancelled) {
      return returnValidationErrors(inputSchema, { _errors: ["Esta reserva já foi cancelada"] })
    }
    if (bookingDetails.date <= new Date()) {
      return returnValidationErrors(inputSchema, { _errors: ["Não é possível cancelar reservas passadas"] })
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { cancelled: true, cancelledAt: new Date() },
    })

    revalidatePath("/minha-conta")
    revalidatePath("/bookings")
    revalidatePath("/admin")
    revalidatePath("/admin/agenda")

    const clientEmail = session.user.email ?? ""
    const clientName = session.user.name ?? "Cliente"
    const snapshot = bookingDetails
    after(async () => {
      if (!clientEmail) return
      await sendBookingCancellationEmail({
        to: clientEmail,
        clientName,
        serviceName: snapshot.service.name,
        bookingDate: snapshot.date,
      }).catch(() => null)
    })

    return { success: true }
  })
