// Athkar PWA Service Worker
const CACHE_NAME = 'athkar-v1';

// All files to cache for offline use
const ASSETS = [
  './Athkar_App.html',
  './athkar-data.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Google Fonts (cached on first load)
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Readex+Pro:wght@300;400;600;700&display=swap',
  // React & Babel from CDN
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local files strictly; CDN files best-effort
      const local = ASSETS.filter(u => u.startsWith('./'));
      const remote = ASSETS.filter(u => !u.startsWith('./'));
      return cache.addAll(local).then(() =>
        Promise.allSettled(remote.map(url =>
          fetch(url).then(r => cache.put(url, r)).catch(() => {})
        ))
      );
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses dynamically
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, show nothing (app is already loaded)
      });
    })
  );
});
