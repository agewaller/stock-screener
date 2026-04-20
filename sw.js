// Service Worker for 健康日記 PWA
// Provides offline shell so the app loads even without network.
// Strategy: cache-first for shell (index.html + CDN assets),
// network-first for API calls (never cache those).

const CACHE = 'kenkodiary-v1';
const SHELL = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept API / Firebase / CDN calls — let them go to network.
  if (
    url.hostname !== location.hostname ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/firebase') ||
    e.request.method !== 'GET'
  ) {
    return;
  }

  // Cache-first for navigation (the SPA shell).
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('/').then(cached => cached || fetch(e.request))
    );
    return;
  }

  // Stale-while-revalidate for other same-origin assets.
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request);
      const fresh = fetch(e.request).then(res => {
        if (res.ok) c.put(e.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
