"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean(),
})

export const updateBarber = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput
    await prisma.barber.update({
      where: { id },
      data: { ...data, photoUrl: data.photoUrl || null },
    })
    revalidatePath("/admin/barbeiros")
    return { success: true }
  })
