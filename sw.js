/* DATA COACH 360° — Service Worker: λειτουργία offline σε κινητό/τάμπλετ.
   Network-first για τα αρχεία της εφαρμογής (πάντα η νεότερη έκδοση όταν υπάρχει σύνδεση),
   με εφεδρεία την cache όταν δεν υπάρχει. Τα εξωτερικά αιτήματα (StatsBomb, YouTube) δεν αποθηκεύονται. */
const CACHE = 'datacoach360-v5';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png',
  './js/charts.js','./js/data.js','./js/content.js','./js/app.js','./js/views-performance.js','./js/views-scouting.js',
  './js/views-tools.js','./js/views-systems.js','./js/views-fitcfg.js','./js/views-club.js','./js/views-ux.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
