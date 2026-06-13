const CACHE_NAME = 'colorbridge-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './default.icc',
  './ICC-Profile165-CP1500.icc',
  './assets/tailwind.js',
  './assets/lucide.min.js',
  './assets/jszip.min.js',
  './assets/heic2any.min.js',
  './assets/lcms.js',
  './assets/lcms.wasm',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// Install Event: Pre-cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[Service Worker] Pre-cache failed:', err);
      })
  );
});

// Activate Event: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // If response is not valid, return it immediately
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the newly fetched file dynamically
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((err) => {
        console.error('[Service Worker] Fetch failed for:', event.request.url, err);
        // You could serve fallback content here if applicable
      });
    })
  );
});
