"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
})

export const createBlockedTime = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { startDate, endDate, reason } }) => {
    const created = await prisma.blockedTime.create({
      data: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        startDate,
        endDate,
        reason,
      },
    })
    revalidatePath("/admin/bloqueios")
    return {
      id: created.id,
      startDate: created.startDate.toISOString(),
      endDate: created.endDate.toISOString(),
      reason: created.reason,
    }
  })
