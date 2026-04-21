'use strict';

const CACHE_NAME = 'studysprint-v1';

// All static assets that never change – cached on install
const STATIC_ASSETS = [
  '/pwa/',
  '/pwa/index.html',
  '/pwa/manifest.json',
  '/pwa/app.js',
  '/pwa/voice.js',
  '/pwa/style.css',
  '/pwa/icons/icon.svg'
];

// ── Install: pre-cache all static assets ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-first for API ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isDynamic =
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/oauth') ||
    url.pathname.startsWith('/push');

  if (isDynamic) {
    // Network only for API calls – let the app handle offline fallback
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for static PWA assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// ── Push: show OS notification ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = { title: 'StudySprint', body: 'Novo obvestilo', data: {} };

  try {
    if (event.data) payload = event.data.json();
  } catch (_) { /* keep defaults */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa/icons/icon.svg',
      badge: '/pwa/icons/icon.svg',
      data: payload.data,
      vibrate: [200, 100, 200],
      requireInteraction: false
    })
  );
});

// ── Notification click: focus or open the PWA ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes('/pwa/'));
        if (existing) return existing.focus();
        return clients.openWindow('/pwa/');
      })
  );
});
