const CACHE = "gscl-v3"
const staticUrls = ["/manifest.json"]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(staticUrls)))
})

self.addEventListener("fetch", (event) => {
  const isNav = event.request.mode === "navigate" || event.request.headers.get("Accept")?.includes("text/html")
  if (isNav) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        return res
      }).catch(() => caches.match(event.request))
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
})

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : { title: "GSCL", body: "New update", link: "/" }
  const options = {
    body: data.body,
    icon: "/images/logo/gscl-logo.png",
    badge: "/images/logo/gscl-logo.png",
    data: { url: data.link || "/" },
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const url = event.notification.data.url || "/"
  event.waitUntil(clients.matchAll({ type: "window" }).then((windowClients) => {
    for (const client of windowClients) {
      if (client.url.includes(self.location.origin) && "focus" in client) {
        client.navigate(url)
        return client.focus()
      }
    }
    return clients.openWindow(url)
  }))
})
