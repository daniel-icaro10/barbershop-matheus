import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// Anonymizes and deletes personal data while preserving financial records
// for legal/fiscal retention obligations under LGPD art. 16, II.
export async function DELETE(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Usuário Removido",
        email: `removed+${userId}@deleted.invalid`,
        phone: null,
        image: null,
        emailVerified: false,
      },
    }),
  ])

  return NextResponse.json({ deleted: true })
}
