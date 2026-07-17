const APP_VERSION = '1.3.2';
const CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './script.js',
  './service-worker.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './README.md'
];

function deleteOldAppCaches() {
  return caches.keys().then((cacheNames) => Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName))
  ));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      deleteOldAppCaches(),
      self.clients.claim()
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_OLD_CACHES') {
    event.waitUntil(deleteOldAppCaches());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseCopy = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, responseCopy));

        return response;
      })
      .catch(() => caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return Response.error();
        }))
  );
});
