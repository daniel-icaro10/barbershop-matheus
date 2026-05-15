"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({ id: z.string().uuid() })

export const deleteBlockedTime = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { id } }) => {
    await prisma.blockedTime.delete({ where: { id } })
    revalidatePath("/admin/bloqueios")
    return { success: true }
  })
