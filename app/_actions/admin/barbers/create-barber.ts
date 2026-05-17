"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  photoUrl: z.string().url().optional().or(z.literal("")),
})

export const createBarber = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const barber = await prisma.barber.create({
      data: {
        name: parsedInput.name,
        photoUrl: parsedInput.photoUrl || null,
        barbershopId: DEFAULT_BARBERSHOP_ID,
      },
    })
    revalidatePath("/admin/barbeiros")
    return { barber }
  })
