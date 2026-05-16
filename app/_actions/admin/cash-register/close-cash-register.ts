"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  registerId: z.string().uuid(),
  finalAmountInCents: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
})

export const closeCashRegister = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const register = await prisma.cashRegister.findUniqueOrThrow({
      where: { id: parsedInput.registerId },
      select: { id: true, closedAt: true, initialAmountInCents: true, openedAt: true, barbershopId: true },
    })

    if (register.closedAt) throw new Error("Caixa já foi fechado.")

    // Sum all approved payments received while this register was open
    const approvedPayments = await prisma.payment.aggregate({
      _sum: { paidAmountInCents: true },
      where: {
        order: { barbershopId: register.barbershopId },
        status: "APPROVED",
        paidAt: { gte: register.openedAt },
      },
    })
    const expectedRevenue = approvedPayments._sum.paidAmountInCents ?? 0
    const difference = parsedInput.finalAmountInCents - register.initialAmountInCents
    const reconciliationDiff = parsedInput.finalAmountInCents - (register.initialAmountInCents + expectedRevenue)

    await prisma.cashRegister.update({
      where: { id: parsedInput.registerId },
      data: {
        closedAt: new Date(),
        finalAmountInCents: parsedInput.finalAmountInCents,
        differenceInCents: difference,
        closedById: ctx.userId,
        notes: parsedInput.notes ?? null,
      },
    })

    revalidatePath("/admin/caixa")
    return { success: true, difference, expectedRevenue, reconciliationDiff }
  })
