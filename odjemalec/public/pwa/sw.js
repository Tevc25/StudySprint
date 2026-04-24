// sw.js – StudySprint Service Worker
// Handles: cache-first for static assets, push notifications, background sync

'use strict';

const CACHE_VERSION  = 'v7';
const STATIC_CACHE   = `ss-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE  = `ss-dynamic-${CACHE_VERSION}`;

// All static app-shell files that never change between deploys
const STATIC_ASSETS = [
  '/pwa/',
  '/pwa/index.html',
  '/pwa/style.css',
  '/pwa/app.js',
  '/pwa/db.js',
  '/pwa/manifest.json',
  '/pwa/icons/icon-192.png',
  '/pwa/icons/icon-512.png',
  '/pwa/icons/icon-maskable.png',
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: strategy by request type ──────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip API calls and OAuth – always network (they carry live data)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/oauth')) return;

  // Static app-shell assets: cache-first
  if (STATIC_ASSETS.some(a => url.pathname === a || url.pathname === a.replace('/pwa/', '/pwa'))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // /pwa/* files (CSS, JS, images): cache-first with network fallback
  if (url.pathname.startsWith('/pwa/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // External images (picsum etc.): stale-while-revalidate with dynamic cache
  if (url.origin !== location.origin) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline – vsebina ni na voljo.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => null);

  return cached ?? await networkPromise ?? new Response('', { status: 503 });
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let payload = { title: 'StudySprint', body: 'Nova obvestitev', icon: '/pwa/icons/icon-192.png', data: {} };

  if (event.data) {
    try { payload = { ...payload, ...event.data.json() }; }
    catch { payload.body = event.data.text() || payload.body; }
  }

  const options = {
    body:    payload.body,
    icon:    payload.icon ?? '/pwa/icons/icon-192.png',
    badge:   '/pwa/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data:    payload.data ?? {},
    actions: [
      { action: 'open',    title: 'Odpri' },
      { action: 'dismiss', title: 'Zapri' }
    ],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const target = event.notification.data?.url ?? '/pwa/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes('/pwa/') && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'ss-sync-pending') {
    event.waitUntil(syncPendingOperations());
  }
});

// Import the shared db module (works in SW via importScripts)
importScripts('/pwa/db.js');

async function getAuthToken() {
  try {
    const cache = await caches.open('ss-meta');
    const res   = await cache.match('/_meta/token');
    if (!res) return null;
    const json  = await res.json();
    return json?.token ?? null;
  } catch {
    return null;
  }
}

async function syncPendingOperations() {
  let pending;
  try { pending = await db.getPendingSync(); }
  catch { return; }

  if (!pending.length) return;

  // Try to recover auth token from IDB _meta store
  const token = await getAuthToken();

  // Notify all clients about sync start
  const allClients = await clients.matchAll({ includeUncontrolled: true });
  allClients.forEach(c => c.postMessage({ type: 'SYNC_START', count: pending.length }));

  let synced = 0;
  for (const op of pending) {
    try {
      const { method, resource, id, body } = op;
      const url    = id ? `/api/${resource}/${id}` : `/api/${resource}`;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok || res.status === 409) {
        await db.removeSyncEntry(op._syncId);
        synced++;
      }
    } catch {
      // Leave in queue for next sync attempt
    }
  }

  allClients.forEach(c => c.postMessage({ type: 'SYNC_DONE', synced, total: pending.length }));

  if (synced > 0) {
    await self.registration.showNotification('StudySprint – Sinhronizacija', {
      body:  `${synced} sprememb(a) sinhroniziranih.`,
      icon:  '/pwa/icons/icon-192.png',
      badge: '/pwa/icons/icon-192.png',
    });
  }
}

// ── Message handler (page → SW) ───────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'SAVE_TOKEN') {
    const { token } = event.data;
    caches.open('ss-meta').then(cache =>
      cache.put('/_meta/token', new Response(JSON.stringify({ token }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
  }
});
