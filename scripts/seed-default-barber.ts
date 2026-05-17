import { prisma } from "../lib/prisma"
import { DEFAULT_BARBERSHOP_ID } from "../lib/constants/barbershop"

const DEFAULT_BARBER_ID = "00000000-0000-0000-0000-000000000001"

async function main() {
  console.log("🌱 Inserindo barbeiro padrão...")

  const barber = await prisma.barber.upsert({
    where: { id: DEFAULT_BARBER_ID },
    update: { name: "Matheus", isActive: true },
    create: {
      id: DEFAULT_BARBER_ID,
      barbershopId: DEFAULT_BARBERSHOP_ID,
      name: "Matheus",
      isActive: true,
    },
  })
  console.log(`✅ Barbeiro criado/atualizado: ${barber.name} (${barber.id})`)

  const result = await prisma.booking.updateMany({
    where: { barberId: null },
    data: { barberId: DEFAULT_BARBER_ID },
  })
  console.log(`✅ ${result.count} booking(s) associados ao barbeiro padrão`)

  console.log("\n🎉 Backfill concluído com sucesso!")
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
