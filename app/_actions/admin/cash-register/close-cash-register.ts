"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { subMinutes } from "date-fns"
import { z } from "zod"

const inputSchema = z.object({
  registerId: z.string().uuid(),
  finalAmountInCents: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
  force: z.boolean().default(false),
})

export const closeCashRegister = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx }) => {
    const register = await prisma.cashRegister.findUniqueOrThrow({
      where: { id: parsedInput.registerId },
      select: { id: true, closedAt: true, initialAmountInCents: true, openedAt: true, barbershopId: true },
    })

    if (register.closedAt) throw new Error("Caixa já foi fechado.")

    // Payments stuck in PENDING for more than 10 minutes are likely expired
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: subMinutes(new Date(), 10) },
        order: { barbershopId: register.barbershopId },
      },
      select: { id: true, transactionAmountInCents: true, createdAt: true },
    })

    if (!parsedInput.force && pendingPayments.length > 0) {
      return { pendingPayments }
    }

    if (parsedInput.force && pendingPayments.length > 0) {
      await prisma.payment.updateMany({
        where: { id: { in: pendingPayments.map((p) => p.id) } },
        data: { status: "CANCELED" },
      })
    }

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
