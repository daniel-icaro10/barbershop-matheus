"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  reviewId: z.string().uuid(),
})

export const deleteReview = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.review.delete({ where: { id: parsedInput.reviewId } })
    revalidatePath("/admin/avaliacoes")
    return { success: true }
  })
