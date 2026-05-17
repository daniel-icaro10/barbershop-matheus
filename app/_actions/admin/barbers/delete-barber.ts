"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  id: z.string().uuid(),
})

export const deleteBarber = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.barber.update({
      where: { id: parsedInput.id },
      data: { isActive: false },
    })
    revalidatePath("/admin/barbeiros")
    return { success: true }
  })
