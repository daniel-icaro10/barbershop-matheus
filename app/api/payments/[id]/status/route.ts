import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { status: true, order: { select: { customerId: true } } },
  })

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = payment.order.customerId === session.user.id
  const isAdmin = (session.user as { role?: string }).role === "ADMIN"
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json({ status: payment.status })
}
