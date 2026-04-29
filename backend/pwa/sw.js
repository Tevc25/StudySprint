const CACHE_NAME = 'studysprint-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/app.js',
  './js/auth.js',
  './js/db.js',
  './js/sync.js',
  './js/push.js',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png',
  './icons/taptaptap.png',
];

// --- Install: cachira vse statične fajle ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// --- Activate: pobriše stare cache-e ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// --- Fetch: cache-first za statiko, network-first za API ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/goals') ||
      url.pathname.startsWith('/tasks') ||
      url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/push') ||
      url.pathname.startsWith('/users')) {
    // Network-first za API
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then(cached =>
          cached ?? new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      )
    );
  } else {
    // Cache-first za statiko
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request))
    );
  }
});

// --- Push: prikaži OS obvestilo ---
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'StudySprint';
  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Sync: offline queue ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_QUEUE' }));
      })
    );
  }
});

// --- Message: skip waiting ---
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
