// Działanie offline: strona z sieci, gdy jest zasięg (żeby widzieć aktualizacje), z pamięci, gdy go nie ma.
// Do pamięci trafiają tylko poprawne odpowiedzi – błąd serwera (np. 404 po usunięciu repo) nie nadpisze zapisanej książki.
const CACHE = 'para-v2';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const save = (key, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => res.ok ? save('index.html', res) : caches.match('index.html').then(hit => hit || res))
      .catch(() => caches.match('index.html')));
  } else if (isFont || url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (isFont) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; } return save(req, res); })));
  }
});
