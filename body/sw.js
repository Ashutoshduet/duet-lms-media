// Offline support. Code and text: network first (so updates show at once), cache when offline.
// Models, fonts, images and narration audio: cache first. Narration and Organ Lab models are saved in the
// background after the first visit, with progress sent back to the page.
const VERSION = 'hb360-v6';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './js/main.js', './js/body.js', './js/flows.js', './js/anim.js', './js/micro.js', './js/labels.js', './js/audio.js', './js/vrui.js',
  './js/data.js', './js/content.js', './js/journeys_bd.js', './js/zoom.js', './js/lab.js', './js/proc.js', './js/dismantle.js',
  './lib/three.module.js', './lib/addons/loaders/GLTFLoader.js', './lib/addons/utils/BufferGeometryUtils.js', './lib/addons/controls/OrbitControls.js',
  './lib/addons/environments/RoomEnvironment.js', './lib/addons/libs/meshopt_decoder.module.js',
  './models/body.glb', './models/paths.json', './models/meta3.json', './models/objects.json', './models/content.json', './models/kidney.glb',
  './fonts/nsd-latin-400.woff2', './fonts/nsd-latin-600.woff2', './fonts/nsd-latin-700.woff2',
  './fonts/nsd-deva-400.woff2', './fonts/nsd-deva-600.woff2', './fonts/nsd-deva-700.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './brand/duet-stem-logo-light.png',
];
const NETWORK_FIRST = /\.(js|json|html|webmanifest)$|\/$/;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  // narration was re-recorded in v6 (information style), so old caches are dropped completely
  e.waitUntil((async () => {
    // only this app's own older caches: the Solar System / Space Lab apps share this web address and its cache store
    for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('hb360-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
let running = null;
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'prefetch') return;
  const urls = [...new Set(e.data.urls)];
  const job = (async () => {
    if (running) await running.catch(() => {});
    const c = await caches.open(VERSION);
    const all = await self.clients.matchAll();
    const tell = (have) => all.forEach((cl) => cl.postMessage({ type: 'progress', have, total: urls.length }));
    let have = 0, i = 0;
    for (const u of urls) {
      try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } have++; } catch (err) { /* offline: try next time */ }
      if (++i % 10 === 0) tell(have);
    }
    tell(have);
  })();
  running = job;
  e.waitUntil(job);
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/models/labs/')) { cacheFirst(e); return; }
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  cacheFirst(e);
});
function cacheFirst(e) {
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
}
