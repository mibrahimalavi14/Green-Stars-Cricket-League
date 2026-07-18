const CACHE = "gscl-v1"
const urls = ["/", "/about", "/contact", "/fixtures", "/news", "/players", "/players/stats", "/points-table", "/seasons", "/teams", "/toss-analysis", "/manifest.json"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(urls))
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      return caches.open(CACHE).then((cache) => {
        if (event.request.url.startsWith(self.location.origin)) cache.put(event.request, res.clone())
        return res
      })
    }))
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
})
