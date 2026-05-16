"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["SERVICE", "PRODUCT"]),
  priceInCents: z.number().int().positive(),
  costInCents: z.number().int().nonnegative().optional(),
  durationInMinutes: z.number().int().positive().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  commissionValue: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
})

export const createItem = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const item = await prisma.barbershopItem.create({
      data: {
        ...parsedInput,
        barbershopId: DEFAULT_BARBERSHOP_ID,
        imageUrl: parsedInput.imageUrl || null,
        description: parsedInput.description || null,
        durationInMinutes: parsedInput.durationInMinutes ?? 30,
      },
    })
    revalidatePath("/admin/itens")
    revalidatePath("/agendar")
    return { item }
  })
