"use server"

import { actionClient } from "@/lib/action-client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { getAvailableSlots } from "@/lib/availability"
import { returnValidationErrors } from "next-safe-action"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const inputSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.coerce.date(),
})

const UNAVAILABLE_MSG = "Horário não disponível. Por favor, escolha outro horário."

export const createBooking = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { serviceId, date } }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return returnValidationErrors(inputSchema, { _errors: ["Não autorizado. Faça login novamente."] })
    }

    const service = await prisma.barbershopService.findUnique({
      where: { id: serviceId },
    })
    if (!service) {
      return returnValidationErrors(inputSchema, { _errors: ["Serviço não encontrado."] })
    }

    // First pass: full availability check (working hours, blocked times, existing bookings)
    const available = await getAvailableSlots({
      date,
      barbershopId: service.barbershopId,
      durationInMinutes: service.durationInMinutes,
    })

    const requestedSlot = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    if (!available.includes(requestedSlot)) {
      return returnValidationErrors(inputSchema, { _errors: [UNAVAILABLE_MSG] })
    }

    const endDate = new Date(date.getTime() + service.durationInMinutes * 60_000)

    // Atomic second pass: re-check + create inside a transaction.
    // Prevents race condition where two concurrent requests both pass the first check.
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: {
            barbershopId: service.barbershopId,
            cancelled: false,
            OR: [
              { date: { gte: date, lt: endDate } },
              { date: { lt: date }, endDate: { gt: date } },
            ],
          },
          select: { id: true },
        })
        if (conflict) throw new Error("SLOT_TAKEN")

        return tx.booking.create({
          data: {
            serviceId,
            date,
            endDate,
            userId: session.user.id,
            barbershopId: service.barbershopId,
          },
        })
      })

      revalidatePath("/admin")
      revalidatePath("/admin/agenda")
      return booking
    } catch (e) {
      if (e instanceof Error && e.message === "SLOT_TAKEN") {
        return returnValidationErrors(inputSchema, { _errors: [UNAVAILABLE_MSG] })
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        return returnValidationErrors(inputSchema, { _errors: [UNAVAILABLE_MSG] })
      }
      throw e
    }
  })
