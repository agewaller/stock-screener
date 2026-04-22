// #13 PWA Service Worker + #19 Cache management
// Version is updated on each deploy via GitHub Actions sed replacement.
const CACHE_VERSION = 'v1-__COMMIT_HASH__';
const CACHE_NAME = 'health-diary-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/config.js',
  '/js/prompts.js',
  '/js/store.js',
  '/js/privacy.js',
  '/js/ai-engine.js',
  '/js/affiliate.js',
  '/js/components.js',
  '/js/i18n.js',
  '/js/calendar.js',
  '/js/integrations.js',
  '/js/idb.js',
  '/js/firebase-backend.js',
  '/js/app.js',
  '/js/pages.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Network-first for API calls, cache-first for static assets
  if (url.hostname !== location.hostname) {
    return; // Don't cache external API calls
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Listen for update messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
