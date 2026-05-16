"use server"

import { actionClient } from "@/lib/action-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { featureFlags } from "@/lib/feature-flags"
import { z } from "zod"

const inputSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export const createReview = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    if (!featureFlags.reviewsEnabled) throw new Error("Avaliações não habilitadas.")

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error("Não autorizado.")

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: parsedInput.bookingId },
      select: { userId: true, barbershopId: true, cancelled: true, review: { select: { id: true } } },
    })

    if (booking.userId !== session.user.id) throw new Error("Não autorizado.")
    if (booking.cancelled) throw new Error("Não é possível avaliar um agendamento cancelado.")
    if (booking.review) throw new Error("Agendamento já foi avaliado.")

    const review = await prisma.review.create({
      data: {
        bookingId: parsedInput.bookingId,
        customerId: session.user.id,
        barbershopId: booking.barbershopId,
        rating: parsedInput.rating,
        comment: parsedInput.comment ?? null,
      },
    })

    return { review }
  })
