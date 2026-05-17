"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["SERVICE", "PRODUCT"]),
  priceInCents: z.number().int().positive(),
  costInCents: z.number().int().nonnegative().optional(),
  durationInMinutes: z.number().int().min(15).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  commissionValue: z.number().int().nonnegative().optional(),
  isActive: z.boolean(),
})

export const updateItem = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput
    await prisma.barbershopItem.update({
      where: { id },
      data: {
        ...data,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
      },
    })
    revalidatePath("/admin/itens")
    revalidatePath("/agendar")
    revalidatePath("/")
    revalidateTag("services", "default")
    return { success: true }
  })
