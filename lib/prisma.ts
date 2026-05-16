import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!

// Strip sslmode from URL so pg doesn't override our explicit ssl config
const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")

// rejectUnauthorized: false is intentional — Supabase's connection pooler
// (port 6543) uses a self-signed certificate. The connection is still
// encrypted; we just skip CA verification, which is acceptable for a
// managed cloud DB where the hostname itself is the trust anchor.
const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
