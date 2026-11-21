/**
 * SOMLENG Music Player - Service Worker
 * Progressive Web App (PWA) Offline Cache & Background Management
 */

const CACHE_NAME = 'somleng-pwa-v3'
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

async function cacheOfflineShell(cache) {
  const response = await fetch('/')
  if (!response.ok) throw new Error(`Failed to cache app shell (${response.status})`)

  const html = await response.text()

  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], self.location.origin))
    .filter((url) =>
      url.origin === self.location.origin &&
      url.pathname.startsWith('/_nuxt/') &&
      /\.(?:js|css)$/.test(url.pathname)
    )

  if (!assets.length) throw new Error('No built Nuxt assets were found in the app shell.')

  await Promise.all(assets.map(async (url) => {
    const request = new Request(url.href)
    const assetResponse = await fetch(request)
    if (!assetResponse.ok) {
      throw new Error(`Failed to cache app asset ${url.pathname} (${assetResponse.status})`)
    }
    await cache.put(request, assetResponse)
  }))
}

// Install event: cache the shell, its versioned Nuxt assets, and SQLite WebAssembly.
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(STATIC_ASSETS)
      await cacheOfflineShell(cache)

      const wasmUrl = new URL('/sql-wasm.wasm?v=2', self.location.origin)
      const wasmRequest = new Request(wasmUrl.href)
      const wasmResponse = await fetch(wasmRequest)
      if (!await isValidWasm(wasmResponse)) {
        throw new Error('SQLite WebAssembly asset failed validation during install')
      }
      await cache.put(wasmRequest, wasmResponse)
    })()
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
