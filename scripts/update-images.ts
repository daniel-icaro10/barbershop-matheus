import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Update ALL "Barba" services
  const barba = await prisma.barbershopService.updateMany({
    where: { name: { contains: "Barba", mode: "insensitive" } },
    data: { imageUrl: "/barba.jpg" },
  })
  console.log(`✓ Barba: ${barba.count} registros atualizados → /barba.jpg`)

  // Update ALL "Corte de Cabelo" services
  const corte = await prisma.barbershopService.updateMany({
    where: {
      OR: [
        { name: { contains: "Corte", mode: "insensitive" } },
        { name: { contains: "Cabelo", mode: "insensitive" } },
        { name: { contains: "Hair", mode: "insensitive" } },
      ],
    },
    data: { imageUrl: "/corte.jpg" },
  })
  console.log(`✓ Corte de Cabelo: ${corte.count} registros atualizados → /corte.jpg`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
