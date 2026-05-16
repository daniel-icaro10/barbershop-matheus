"use client"

import { useEffect } from "react"

export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const setup = async () => {
      try {
        // Remove SWs antigos do next-pwa (URLs diferentes de /sw.js)
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const reg of registrations) {
          const url = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? ""
          if (url && !url.endsWith("/sw.js")) {
            await reg.unregister()
          }
        }
        // Registra o nosso SW
        await navigator.serviceWorker.register("/sw.js")
      } catch {
        // Falha silenciosa — não bloqueia o app
      }
    }

    setup()
  }, [])

  return null
}
