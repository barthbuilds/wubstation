// WUBSTATION 9000 — Service Worker (Cache-first, update in background)
const CACHE = 'wubstation-v6.4';
const FILES = [
  './', './index.html', './style.css', './manifest.json',
  './js/state.js', './js/engine.js', './js/scope.js',
  './js/sequencer.js', './js/ui.js', './js/presets.js',
  './js/midi.js', './js/export.js',
  './js/worklets/bitcrush-processor.js',
  './js/worklets/noise-processor.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Return cached, but also update cache in background
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
