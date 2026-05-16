"use server"

import { adminActionClient } from "@/lib/action-client"
import { prisma } from "@/lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "@/lib/constants/barbershop"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
})

export const updateLocation = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    await prisma.barbershop.update({
      where: { id: DEFAULT_BARBERSHOP_ID },
      data: {
        address: parsedInput.address,
        latitude: parsedInput.latitude ?? null,
        longitude: parsedInput.longitude ?? null,
        googleMapsUrl: parsedInput.googleMapsUrl || null,
      },
    })
    revalidatePath("/admin/localizacao")
    revalidatePath("/")
    return { success: true }
  })
