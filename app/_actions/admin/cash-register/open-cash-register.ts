"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"
import { z } from "zod"

const TZ = "America/Sao_Paulo"

const inputSchema = z.object({
  initialAmountInCents: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
})

export const openCashRegister = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const now = new Date()
    const zoned = toZonedTime(now, TZ)
    const dayStart = fromZonedTime(startOfDay(zoned), TZ)
    const dayEnd = fromZonedTime(endOfDay(zoned), TZ)

    const existing = await prisma.cashRegister.findFirst({
      where: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        openedAt: { gte: dayStart, lte: dayEnd },
        closedAt: null,
      },
      select: { id: true },
    })
    if (existing) throw new Error("Já existe um caixa aberto para hoje.")

    const register = await prisma.cashRegister.create({
      data: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        initialAmountInCents: parsedInput.initialAmountInCents,
        notes: parsedInput.notes ?? null,
        openedById: ctx.userId,
      },
    })

    revalidatePath("/admin/caixa")
    return { register }
  })
