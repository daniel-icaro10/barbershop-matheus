"use server"

import { actionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { getAvailableSlots } from "@/lib/availability"
import z from "zod"

const inputSchema = z.object({
  date: z.coerce.date(),
  serviceId: z.string().uuid(),
})

export const getAvailableSlotsPublic = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { date, serviceId } }) => {
    const service = await prisma.barbershopService.findUnique({
      where: { id: serviceId },
      select: { durationInMinutes: true },
    })

    return getAvailableSlots({
      date,
      barbershopId: DEFAULT_BARBERSHOP_ID,
      durationInMinutes: service?.durationInMinutes ?? 30,
    })
  })
