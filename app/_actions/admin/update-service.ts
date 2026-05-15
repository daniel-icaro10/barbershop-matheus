"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Nome obrigatório").max(100),
  description: z.string().max(500),
  priceInCents: z.number().int().positive("Preço inválido"),
  durationInMinutes: z.number().int().positive("Duração inválida"),
  isActive: z.boolean(),
})

export const updateService = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.barbershopService.update({
      where: { id: parsedInput.id },
      data: {
        name: parsedInput.name,
        description: parsedInput.description,
        priceInCents: parsedInput.priceInCents,
        durationInMinutes: parsedInput.durationInMinutes,
        isActive: parsedInput.isActive,
      },
    })
    revalidatePath("/admin/servicos")
    revalidatePath("/agendar")
    return { success: true }
  })
