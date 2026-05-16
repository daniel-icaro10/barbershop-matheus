"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  customerId: z.string(),
  bookingId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export const createOrder = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    if (parsedInput.bookingId) {
      const existing = await prisma.order.findUnique({
        where: { bookingId: parsedInput.bookingId },
        select: { id: true },
      })
      if (existing) return { order: existing }
    }

    const order = await prisma.order.create({
      data: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        customerId: parsedInput.customerId,
        bookingId: parsedInput.bookingId ?? null,
        notes: parsedInput.notes ?? null,
      },
    })
    revalidatePath("/admin/comandas")
    return { order }
  })
