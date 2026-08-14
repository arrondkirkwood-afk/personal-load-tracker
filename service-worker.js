const APP_VERSION = '1.14.0';
const CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`;
const REDESIGN_STYLES = [
  './redesign.css',
  './records-reports-redesign.css',
  './settings-redesign.css'
];
const EXPORT_SCRIPTS = [
  './export-cleanup.js',
  './professional-export.js',
  './export-integration.js'
];
const APP_FILES = [
  './',
  './index.html',
  './repair.html',
  './manifest.json',
  './manifest.json?v=1.14.0',
  './style.css',
  './style.css?v=1.14.0',
  ...REDESIGN_STYLES,
  './script.js',
  './script.js?v=1.14.0',
  ...EXPORT_SCRIPTS,
  './vendor/exceljs.min.js',
  './vendor/exceljs.min.js?v=1.14.0',
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

async function buildCombinedResponse(request, supplementalPaths, contentType) {
  try {
    const responses = await Promise.all([
      fetch(new Request(request, { cache: 'reload' })),
      ...supplementalPaths.map((path) => fetch(new Request(new URL(path, self.location.href).toString(), { cache: 'reload' })))
    ]);

    if (responses.some((response) => !response || response.status !== 200)) {
      return responses[0];
    }

    const parts = await Promise.all(responses.map((response) => response.text()));
    const response = new Response(parts.join('\n\n'), {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': contentType }
    });

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
  } catch {
    const cachedResponses = await Promise.all([
      caches.match(request),
      ...supplementalPaths.map((path) => caches.match(path))
    ]);

    if (cachedResponses.every(Boolean)) {
      const parts = await Promise.all(cachedResponses.map((response) => response.text()));
      return new Response(parts.join('\n\n'), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': contentType }
      });
    }

    return cachedResponses[0] || Response.error();
  }
}

function buildRedesignedStylesheet(request) {
  return buildCombinedResponse(request, REDESIGN_STYLES, 'text/css; charset=utf-8');
}

function buildEnhancedScript(request) {
  return buildCombinedResponse(request, EXPORT_SCRIPTS, 'application/javascript; charset=utf-8');
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
      self.clients.claim(),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'APP_VERSION', version: APP_VERSION, cacheName: CACHE_NAME }));
      })
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

  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({ type: 'APP_VERSION', version: APP_VERSION, cacheName: CACHE_NAME });
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.destination === 'style' && url.pathname.endsWith('/style.css')) {
    event.respondWith(buildRedesignedStylesheet(request));
    return;
  }

  if (request.destination === 'script' && url.pathname.endsWith('/script.js')) {
    event.respondWith(buildEnhancedScript(request));
    return;
  }

  const shouldBypassHttpCache = request.mode === 'navigate'
    || ['script', 'style', 'manifest'].includes(request.destination)
    || ['/', '/personal-load-tracker/', '/personal-load-tracker/index.html', '/personal-load-tracker/repair.html'].includes(url.pathname);
  let networkRequest = request;

  if (shouldBypassHttpCache) {
    try {
      networkRequest = new Request(request, { cache: 'reload' });
    } catch {
      networkRequest = request;
    }
  }

  event.respondWith(
    fetch(networkRequest)
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
