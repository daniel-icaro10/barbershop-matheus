"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Calendar, Users, Clock, Ban, Package, LogOut, X,
  ShoppingBag, Vault, MapPin, Star, TrendingUp,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/financeiro", label: "Financeiro", icon: TrendingUp },
  { href: "/admin/agenda", label: "Agenda", icon: Calendar },
  { href: "/admin/comandas", label: "Comandas", icon: ShoppingBag },
  { href: "/admin/itens", label: "Itens & Produtos", icon: Package },
  { href: "/admin/caixa", label: "Caixa", icon: Vault },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/horarios", label: "Horários", icon: Clock },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: Ban },
  { href: "/admin/localizacao", label: "Localização", icon: MapPin },
]

interface AdminSidebarProps {
  user: { name: string; email: string; image: string | null }
  open?: boolean
  onClose?: () => void
}

export function AdminSidebar({ user, open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/" } } })
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#060504] border-r border-white/[0.06]",
        "transition-transform duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Brand */}
      <div className="safe-top flex min-h-14 items-center gap-3 border-b border-white/[0.06] px-5">
        <Image src="/logo.png" alt="Matheus Barbeiro" width={32} height={22} className="opacity-90" />
        <div className="flex-1 leading-tight">
          <p className="font-bebas text-[1.1rem] text-white tracking-wide leading-none">
            Matheus <span className="text-[#c9a227]">Barbeiro</span>
          </p>
          <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/25 mt-0.5">Admin</p>
        </div>
        <button
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white transition-all hover:bg-[#c9a227]/15 hover:border-[#c9a227]/50 hover:text-[#c9a227] active:scale-95 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#c9a227]/[0.08] text-[#c9a227] border-l-2 border-[#c9a227] pl-[10px]"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/80 border-l-2 border-transparent pl-[10px]",
              )}
            >
              <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-[#c9a227]" : "text-white/30 group-hover:text-white/60")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center gap-2.5 p-2">
          <Avatar className="size-8 shrink-0 ring-1 ring-white/10">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs bg-[#c9a227]/10 text-[#c9a227]">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white/80">{user.name}</p>
            <p className="truncate text-[10px] text-white/30">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/30 transition-colors hover:bg-red-500/[0.06] hover:text-red-400"
        >
          <LogOut className="size-3.5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
