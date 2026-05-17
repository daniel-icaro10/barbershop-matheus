import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!

// Strip sslmode from URL so pg doesn't override our explicit ssl config
const cleanUrl = connectionString.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")

// Returns SSL config for the pg Pool.
// If SUPABASE_CA_CERT is set (PEM or base64-encoded PEM), enables full CA
// verification. Otherwise falls back to rejectUnauthorized: false, which
// keeps traffic encrypted but skips CA chain validation — acceptable for
// Supabase's connection pooler (port 6543) that uses a self-signed cert.
// To enable full verification: download the CA cert from
// Supabase Dashboard → Settings → Database → SSL → Download certificate,
// then set SUPABASE_CA_CERT to the file contents (or base64 of them).
function getSslConfig(): { rejectUnauthorized: boolean; ca?: string } {
  const raw = process.env.SUPABASE_CA_CERT
  if (raw) {
    const ca = raw.startsWith("-----") ? raw : Buffer.from(raw, "base64").toString("utf-8")
    return { rejectUnauthorized: true, ca }
  }
  return { rejectUnauthorized: false }
}

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: getSslConfig(),
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
