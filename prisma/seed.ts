// Import the shared client so SSL config (SUPABASE_CA_CERT) is applied consistently.
import { prisma } from "../lib/prisma"

const BARBERSHOP_ID = "ac26abca-d0cc-49ab-a073-12ee35655e97"

async function main() {
  console.log("🌱 Iniciando seed...")

  // Barbearia
  await prisma.barbershop.upsert({
    where: { id: BARBERSHOP_ID },
    update: {},
    create: {
      id: BARBERSHOP_ID,
      name: "Matheus Barbeiro",
      address: "Rua da Barbearia, 123",
      description: "Barbearia premium com atendimento personalizado e técnicas modernas.",
      imageUrl: "/logo.png",
      phones: ["5581989759980"],
    },
  })
  console.log("✅ Barbearia criada")

  // Serviços
  const services = [
    {
      id: "2819e8d5-da87-4df8-b3e2-358d2bba750d",
      name: "Corte de Cabelo",
      description: "Corte profissional com acabamento perfeito.",
      imageUrl: "/corte.jpg",
      priceInCents: 3500,
      durationInMinutes: 30,
    },
    {
      id: "bc8d148f-72df-4bea-a0ea-1a8c976b2607",
      name: "Barba",
      description: "Barba na navalha com toalha quente.",
      imageUrl: "/barba.jpg",
      priceInCents: 3000,
      durationInMinutes: 30,
    },
    {
      id: "e226d9c5-56bc-4a05-944c-e9d1186e8680",
      name: "Pézinho",
      description: "Acabamento e alinhamento da nuca.",
      imageUrl: "/pezinho.png",
      priceInCents: 1000,
      durationInMinutes: 30,
    },
    {
      id: "eba7f2bb-3c15-4c85-9389-0b4ff875e00b",
      name: "Sobrancelha",
      description: "Design e alinhamento de sobrancelhas.",
      imageUrl: "/sobrancelha.png",
      priceInCents: 500,
      durationInMinutes: 30,
    },
    {
      id: "10d239da-8393-46f0-8791-15cef8f9037c",
      name: "Limpeza de Pele",
      description: "Limpeza profunda e cuidados com a pele.",
      imageUrl: "/limpeza.png",
      priceInCents: 2000,
      durationInMinutes: 30,
    },
    {
      id: "72ce8fb3-d010-4147-9a16-1e883d6a3fcf",
      name: "Hidratação",
      description: "Hidratação capilar profissional.",
      imageUrl: "/hidratacao.png",
      priceInCents: 1500,
      durationInMinutes: 30,
    },
  ]

  for (const service of services) {
    await prisma.barbershopItem.upsert({
      where: { id: service.id },
      update: { ...service },
      create: { ...service, barbershopId: BARBERSHOP_ID, isActive: true },
    })
  }
  console.log(`✅ ${services.length} serviços criados`)

  // Horários de funcionamento
  const workingHours = [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "19:00", isOpen: false }, // Domingo
    { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00", isOpen: true },  // Segunda
    { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00", isOpen: true },  // Terça
    { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00", isOpen: true },  // Quarta
    { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00", isOpen: true },  // Quinta
    { dayOfWeek: 5, openTime: "09:00", closeTime: "19:00", isOpen: true },  // Sexta
    { dayOfWeek: 6, openTime: "09:00", closeTime: "17:00", isOpen: true },  // Sábado
  ]

  for (const wh of workingHours) {
    await prisma.workingHours.upsert({
      where: { barbershopId_dayOfWeek: { barbershopId: BARBERSHOP_ID, dayOfWeek: wh.dayOfWeek } },
      update: { openTime: wh.openTime, closeTime: wh.closeTime, isOpen: wh.isOpen },
      create: { ...wh, barbershopId: BARBERSHOP_ID },
    })
  }
  console.log("✅ Horários de funcionamento configurados")

  console.log("\n🎉 Seed concluído com sucesso!")
}

main()
  .catch((e) => { console.error("❌ Erro no seed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
