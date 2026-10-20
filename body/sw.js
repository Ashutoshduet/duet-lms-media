// Offline support. Code and text: network first (so updates show at once), cache when offline.
// Models, fonts, images and narration audio: cache first. Narration is saved in the background after the first visit.
const VERSION = 'hb360-v4';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './js/main.js', './js/body.js', './js/flows.js', './js/anim.js', './js/micro.js', './js/labels.js', './js/audio.js', './js/vrui.js',
  './js/data.js', './js/content.js', './js/journeys_bd.js',
  './lib/three.module.js', './lib/addons/loaders/GLTFLoader.js', './lib/addons/utils/BufferGeometryUtils.js', './lib/addons/controls/OrbitControls.js',
  './lib/addons/environments/RoomEnvironment.js', './lib/addons/libs/meshopt_decoder.module.js',
  './models/body.glb', './models/muscles.glb', './models/kidney.glb', './models/paths.json', './models/meta.json', './models/content.json',
  './fonts/nsd-latin-400.woff2', './fonts/nsd-latin-600.woff2', './fonts/nsd-latin-700.woff2',
  './fonts/nsd-deva-400.woff2', './fonts/nsd-deva-600.woff2', './fonts/nsd-deva-700.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './brand/duet-stem-logo-light.png',
];
const NETWORK_FIRST = /\.(js|json|html|webmanifest)$|\/$/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  // keep narration audio from older versions (it rarely changes); drop everything else old
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const cur = await caches.open(VERSION);
    for (const k of keys) {
      if (k === VERSION) continue;
      const old = await caches.open(k);
      for (const req of await old.keys()) if (req.url.includes('/audio/')) { const r = await old.match(req); if (r) await cur.put(req, r); }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'prefetch') return;
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    for (const u of e.data.urls) {
      try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } catch (err) { /* offline: try next time */ }
    }
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
