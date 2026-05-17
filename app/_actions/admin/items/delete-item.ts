"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  id: z.string().uuid(),
})

export const deleteItem = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.barbershopItem.update({
      where: { id: parsedInput.id },
      data: { isActive: false },
    })
    revalidatePath("/admin/itens")
    revalidatePath("/agendar")
    revalidatePath("/")
    revalidateTag("services", "default")
    return { success: true }
  })
