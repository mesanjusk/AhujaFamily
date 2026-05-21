const CACHE_NAME = 'sanju-routine-v1'
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon.svg']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (!e.request.url.startsWith(self.location.origin)) return

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request)
      const fetchPromise = fetch(e.request)
        .then(fresh => {
          if (fresh && fresh.ok) cache.put(e.request, fresh.clone())
          return fresh
        })
        .catch(() => null)
      return cached || (await fetchPromise) || new Response('Offline', { status: 503 })
    })
  )
})
