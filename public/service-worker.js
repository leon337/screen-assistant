const CACHE_LINEAGE = [
  'screen-assistant-v20-saas-auth',
  'screen-assistant-v21-design-experience-hotfix-1',
  'screen-assistant-v22-mobile-result-simplification',
];
const CACHE = 'screen-assistant-v22a-progressive-first-screen';
const APP_SHELL = [
  '/', '/index.html', '/styles.css', '/status.css', '/premium-v18.css', '/intent-v19.css',
  '/auth-v20.css', '/auth-v21.css', '/design-v21.css', '/result-v22.css', '/first-screen-v22a.css',
  '/app.js', '/design.js', '/design-v21.js', '/result-v22.js', '/first-screen-v22a.js', '/status.js', '/premium-v18.js',
  '/intent-v19.js', '/intent-v22a.js', '/auth-v20.js', '/auth-v20-ui.js', '/analysis.js', '/response.js', '/pwa.js', '/markdown.js',
  '/http.js', '/image.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'
];

void CACHE_LINEAGE;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/ready' || url.pathname === '/health') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
