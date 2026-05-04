// #13 PWA Service Worker + #19 Cache management
// Version is updated on each deploy via GitHub Actions sed replacement.
const CACHE_VERSION = 'v1-__COMMIT_HASH__';
const CACHE_NAME = 'health-diary-' + CACHE_VERSION;

// Assets pre-cached on SW install. Covers index.html + all js/* modules
// used by both the main app and the disease LP pages.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
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
  '/js/firebase-backend.js',
  '/js/app.js',
  '/js/pages.js',
  '/js/idb.js',
  '/js/analytics.js',
  '/js/disease-lp-enhancements.js',
  '/js/disease-affiliate-panel.js',
  '/js/inapp-browser-banner.js',
  '/js/social-share.js',
  '/js/newsletter-signup.js',
  '/js/a11y-enhancements.js',
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

  // Never intercept external requests (Firebase, Anthropic, CDNs).
  if (url.hostname !== location.hostname) return;

  const path = url.pathname;
  const isHtmlOrJs = /\.(html|js)$/.test(path) || path === '/' || !path.includes('.');

  if (isHtmlOrJs) {
    // Network-first for HTML and JS: users always get the latest deploy
    // when online; fall back to cache only when offline.
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for images, fonts, manifests — stable assets that
    // rarely change and benefit most from instant cache reads.
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

// Listen for update messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
