"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({ bookingId: z.string().uuid() })

export const cancelBookingAdmin = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { bookingId } }) => {
    // Atomic: só cancela se ainda não estiver cancelado
    const updated = await prisma.booking.updateMany({
      where: { id: bookingId, cancelled: false },
      data: { cancelled: true, cancelledAt: new Date() },
    })

    if (updated.count === 0) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { cancelled: true },
      })
      if (!booking) throw new Error("Agendamento não encontrado")
      if (booking.cancelled) throw new Error("Agendamento já estava cancelado")
    }

    revalidatePath("/admin")
    revalidatePath("/admin/agenda")
    return { success: true }
  })
