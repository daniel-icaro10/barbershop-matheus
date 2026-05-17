import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type AdminUser = { id: string; role: string }

/**
 * API-route equivalent of requireAdmin() from lib/admin-guard.ts.
 * Returns a NextResponse (401/403) when the check fails, or the DB user on success.
 * Usage: const result = await requireAdminApi(); if (result instanceof NextResponse) return result;
 */
export async function requireAdminApi(): Promise<{ user: AdminUser } | NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  })

  if (!dbUser || dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return { user: { id: dbUser.id, role: dbUser.role } }
}
