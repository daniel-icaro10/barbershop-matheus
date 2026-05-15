import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin-guard"
import { AdminShell } from "./_components/admin-shell"

export const metadata: Metadata = { title: "Admin · Matheus Barber" }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return <AdminShell user={user}>{children}</AdminShell>
}
