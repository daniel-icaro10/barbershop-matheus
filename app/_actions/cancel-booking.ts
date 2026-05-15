"use server"

import { actionClient } from "@/lib/action-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { returnValidationErrors } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const inputSchema = z.object({
  bookingId: z.string().uuid(),
})

export const cancelBooking = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { bookingId } }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      returnValidationErrors(inputSchema, { _errors: ["Unauthorized"] })
    }

    // Atomic update: só cancela se não estiver cancelado ainda e for do usuário correto
    const updated = await prisma.booking.updateMany({
      where: {
        id: bookingId,
        userId: session.user.id,
        cancelled: false,
        date: { gt: new Date() },
      },
      data: {
        cancelled: true,
        cancelledAt: new Date(),
      },
    })

    if (updated.count === 0) {
      // Busca para dar mensagem específica
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { userId: true, cancelled: true, date: true },
      })
      if (!booking) {
        returnValidationErrors(inputSchema, { _errors: ["Reserva não encontrada"] })
      }
      if (booking.userId !== session.user.id) {
        returnValidationErrors(inputSchema, { _errors: ["Sem permissão para cancelar esta reserva"] })
      }
      if (booking.cancelled) {
        returnValidationErrors(inputSchema, { _errors: ["Esta reserva já foi cancelada"] })
      }
      if (booking.date <= new Date()) {
        returnValidationErrors(inputSchema, { _errors: ["Não é possível cancelar reservas passadas"] })
      }
    }

    revalidatePath("/minha-conta")
    revalidatePath("/bookings")
    revalidatePath("/admin")
    revalidatePath("/admin/agenda")
    return { success: true }
  })
