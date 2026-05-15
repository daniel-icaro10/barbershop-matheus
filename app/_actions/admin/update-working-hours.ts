"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isOpen: z.boolean(),
}).refine(
  (data) => !data.isOpen || data.openTime < data.closeTime,
  { message: "O horário de abertura deve ser anterior ao de fechamento", path: ["closeTime"] },
)

export const updateWorkingHours = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const { dayOfWeek, openTime, closeTime, isOpen } = parsedInput

    await prisma.workingHours.upsert({
      where: {
        barbershopId_dayOfWeek: {
          barbershopId: DEFAULT_BARBERSHOP_ID,
          dayOfWeek,
        },
      },
      update: { openTime, closeTime, isOpen },
      create: {
        barbershopId: DEFAULT_BARBERSHOP_ID,
        dayOfWeek,
        openTime,
        closeTime,
        isOpen,
      },
    })

    revalidatePath("/admin/horarios")
    return { success: true }
  })
