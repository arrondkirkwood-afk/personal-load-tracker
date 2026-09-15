const APP_VERSION = '1.20.0';
const CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './repair.html',
  './manifest.json',
  './manifest.json?v=1.20.0',
  './style.css',
  './style.css?v=1.20.0',
  './redesign.css',
  './redesign.css?v=1.20.0',
  './records-reports-redesign.css',
  './records-reports-redesign.css?v=1.20.0',
  './settings-redesign.css',
  './settings-redesign.css?v=1.20.0',
  './workbook-builder.css',
  './workbook-builder.css?v=1.20.0',
  './timesheet.css',
  './timesheet.css?v=1.20.0',
  './app-enhancements.css',
  './app-enhancements.css?v=1.20.0',
  './script.js',
  './script.js?v=1.20.0',
  './export-cleanup.js',
  './export-cleanup.js?v=1.20.0',
  './professional-export.js',
  './professional-export.js?v=1.20.0',
  './complete-workbook-export.js',
  './complete-workbook-export.js?v=1.20.0',
  './export-integration.js',
  './export-integration.js?v=1.20.0',
  './timesheet.js',
  './timesheet.js?v=1.20.0',
  './daily-closeout.js',
  './daily-closeout.js?v=1.20.0',
  './paycheck-reconciliation.js',
  './paycheck-reconciliation.js?v=1.20.0',
  './vendor/exceljs.min.js',
  './vendor/exceljs.min.js?v=1.20.0',
  './vendor/EXCELJS-LICENSE.txt',
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
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    deleteOldAppCaches(),
    self.clients.claim(),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'APP_VERSION', version: APP_VERSION, cacheName: CACHE_NAME }));
    })
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_OLD_CACHES') event.waitUntil(deleteOldAppCaches());
  if (event.data?.type === 'GET_VERSION') event.source?.postMessage({ type: 'APP_VERSION', version: APP_VERSION, cacheName: CACHE_NAME });
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const shouldBypassHttpCache = request.mode === 'navigate'
    || ['script', 'style', 'manifest'].includes(request.destination)
    || ['/', '/personal-load-tracker/', '/personal-load-tracker/index.html', '/personal-load-tracker/repair.html'].includes(url.pathname);
  let networkRequest = request;
  if (shouldBypassHttpCache) {
    try { networkRequest = new Request(request, { cache: 'reload' }); } catch { networkRequest = request; }
  }

  event.respondWith(
    fetch(networkRequest)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        return response;
      })
      .catch(() => caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
