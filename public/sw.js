const CACHE = "gscl-v2"
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
