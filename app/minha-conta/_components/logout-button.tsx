"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useTransition } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await authClient.signOut()
      router.push("/")
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm text-white/30 transition-colors hover:text-white/60 disabled:opacity-50"
    >
      <LogOut className="size-3.5" />
      Sair
    </button>
  )
}
