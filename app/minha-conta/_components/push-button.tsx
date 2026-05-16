"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    ),
  ])
}

type Status = "idle" | "loading" | "subscribed" | "denied" | "unsupported"

export function PushButton() {
  const [status, setStatus] = useState<Status>("idle")

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") { setStatus("denied"); return }

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) setStatus("subscribed")
    }).catch(() => {})
  }, [])

  if (status === "unsupported") return null

  const subscribe = async () => {
    if (status === "loading") return
    setStatus("loading")
    try {
      // 1. Solicitar permissão explicitamente (obrigatório em alguns iOS)
      const permission = await Notification.requestPermission()
      if (permission === "denied") {
        setStatus("denied")
        return
      }
      if (permission !== "granted") {
        // Usuário fechou o dialog sem responder
        setStatus("idle")
        return
      }

      // 2. Aguardar SW ficar ativo (max 15s)
      let reg: ServiceWorkerRegistration
      try {
        reg = await withTimeout(navigator.serviceWorker.ready, 15_000)
      } catch {
        // SW não ficou pronto — tenta registrar novamente
        await navigator.serviceWorker.register("/sw.js")
        reg = await withTimeout(navigator.serviceWorker.ready, 10_000)
      }

      // 3. Subscrever ao push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      })

      // 4. Salvar no servidor
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erro ${res.status} ao salvar`)
      }

      setStatus("subscribed")
      toast.success("Notificações ativadas!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Falha: ${msg}`)
      setStatus(Notification.permission === "denied" ? "denied" : "idle")
    }
  }

  const unsubscribe = async () => {
    setStatus("loading")
    try {
      const reg = await withTimeout(navigator.serviceWorker.ready, 10_000)
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus("idle")
      toast.success("Notificações desativadas.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Falha: ${msg}`)
      setStatus("idle")
    }
  }

  if (status === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a227] transition-colors hover:text-[#c9a227]/60"
      >
        <BellOff className="size-3.5" />
        Desativar notificações
      </button>
    )
  }

  if (status === "denied") {
    return (
      <p className="text-[11px] text-white/25">
        Notificações bloqueadas. Ative nas configurações do celular.
      </p>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      className="flex items-center gap-2 border border-[#c9a227]/20 bg-[#c9a227]/[0.06] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a227] transition-all hover:bg-[#c9a227]/10 disabled:opacity-40"
    >
      {status === "loading" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Bell className="size-3.5" />
      )}
      Ativar notificações
    </button>
  )
}
