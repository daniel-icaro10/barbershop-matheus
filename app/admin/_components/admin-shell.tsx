"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import Image from "next/image"
import { AdminSidebar } from "./admin-sidebar"

interface AdminShellProps {
  user: { name: string; email: string; image: string | null }
  children: React.ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex min-h-screen bg-[#080808]">
      {/* Mobile backdrop — só renderiza no cliente para evitar hydration mismatch */}
      {mounted && open && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <AdminSidebar user={user} open={open} onClose={() => setOpen(false)} />

      <main className="flex-1 overflow-auto lg:ml-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#060504]/95 backdrop-blur-xl lg:hidden">
          <div className="safe-top flex min-h-14 items-center gap-3 px-4">
            <button
              onClick={() => setOpen(true)}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white transition-all hover:bg-[#c9a227]/15 hover:border-[#c9a227]/50 hover:text-[#c9a227] active:scale-95"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Matheus Barbeiro" width={26} height={18} className="opacity-80" />
              <p className="font-bebas text-[1rem] text-white tracking-wide">
                Matheus <span className="text-[#c9a227]">Barbeiro</span>
                <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.35em] text-white/25">Admin</span>
              </p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}
