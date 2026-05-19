"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  reviewId: z.string().uuid(),
  approved: z.boolean(),
})

export const approveReview = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.review.update({
      where: { id: parsedInput.reviewId },
      data: { approved: parsedInput.approved },
    })
    revalidatePath("/admin/avaliacoes")
    revalidateTag("reviews", "default")
    return { success: true }
  })
