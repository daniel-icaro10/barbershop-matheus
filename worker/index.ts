/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Matheus Barbeiro", {
      body: data.body ?? "Você tem uma nova notificação.",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url ?? "/minha-conta" },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = (event.notification.data?.url as string) ?? "/minha-conta"
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
