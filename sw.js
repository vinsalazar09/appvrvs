
const CACHE = 'vrvs-cache-v2';
const ASSETS = [
  './',
  './index.html?v=2',
  './manifest.json',
  './icons/vrvs-192.png',
  './icons/vrvs-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

// Network-first for index.html, cache-first for others
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.pathname.endsWith('index.html') || url.pathname === '/' ) {
    e.respondWith((async () => {
      try { 
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        return cached || Response.error();
      }
    } )());
  } else {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })).catch(() => caches.match('./index.html?v=2'))
    );
  }
});
