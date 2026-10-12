/* Roseachy Cloudflare service worker — mobile-safe network-first navigation.
   Business records remain in IndexedDB. The network is preferred for page loads
   so a stale cached app shell cannot pin an older deployment when online. */
const VERSION = '2.10.10-contrast-finance-lock';
const CACHE = 'roseachy-shell-inventory-v27-' + VERSION;
const SHELL = [
  '/index.html',
  '/manifest.json',
  '/js/pwa.js',
  '/icons/roseachy-logo.svg',
  '/icons/icon-48.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      // Keep the previous service worker alive if essential offline files cannot cache.
      // Never activate an update with a missing index or PWA glue script.
      await Promise.all(['/index.html','/js/pwa.js'].map(url => cache.add(new Request(url, {cache:'reload'}))));
      await Promise.allSettled(SHELL.filter(url => !['/index.html','/js/pwa.js'].includes(url))
        .map(url => cache.add(new Request(url, {cache:'reload'}))));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => {
      return key.startsWith('roseachy-') && key !== CACHE;
    }).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put('/index.html', copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.open(CACHE).then(cache => cache.match('/index.html')).then(hit => {
        if (hit) return hit;
        return new Response('Roseachy is offline and has not been cached on this device yet.', {
          status: 503,
          headers: {'Content-Type':'text/plain; charset=utf-8'}
        });
      }))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(cache => cache.match(req, {ignoreSearch:true}).then(hit => {
      if(hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
        return res;
      });
    }))
  );
});
