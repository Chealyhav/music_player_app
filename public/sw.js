/**
 * SOMLENG Music Player - Service Worker
 * Progressive Web App (PWA) Offline Cache & Background Management
 */

const CACHE_NAME = 'somleng-pwa-v2'
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
]

async function isValidWasm(response) {
  if (!response || !response.ok) return false
  const bytes = new Uint8Array(await response.clone().arrayBuffer())
  return bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x61 &&
    bytes[2] === 0x73 &&
    bytes[3] === 0x6d
}

// Install event: cache static app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll partial warning:', err)
      })
    })
  )
})

// Activate event: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', name)
            return caches.delete(name)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event: Network-first for dynamic requests, Cache-first for static icons/wasm
self.addEventListener('fetch', (event) => {
  const request = event.request

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) return

  const url = new URL(request.url)

  if (url.pathname.endsWith('.wasm')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedResponse = await cache.match(request)
        if (cachedResponse && await isValidWasm(cachedResponse)) return cachedResponse
        if (cachedResponse) await cache.delete(request)

        const networkResponse = await fetch(request)
        if (await isValidWasm(networkResponse)) {
          await cache.put(request, networkResponse.clone())
        }
        return networkResponse
      })()
    )
    return
  }

  // Cache-first strategy for static assets (icons, wasm, images, fonts)
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.includes('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        }).catch(() => {
          // If offline and request fails
          return cachedResponse || new Response('Offline asset unavailable', { status: 503 })
        })
      })
    )
    return
  }

  // Network-first strategy with cache fallback for navigation and HTML
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})
