// Offline cache: the whole app (about 8 MB) is stored on first visit, then served from the device.
const VERSION = 'hb360-v2';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './js/main.js', './js/body.js', './js/flows.js', './js/anim.js', './js/micro.js', './js/labels.js', './js/audio.js', './js/vrui.js', './js/data.js',
  './lib/three.module.js', './lib/addons/loaders/GLTFLoader.js', './lib/addons/utils/BufferGeometryUtils.js', './lib/addons/controls/OrbitControls.js',
  './lib/addons/environments/RoomEnvironment.js', './lib/addons/libs/meshopt_decoder.module.js',
  './models/body.glb', './models/muscles.glb', './models/kidney.glb', './models/paths.json', './models/meta.json',
  './fonts/nsd-latin-400.woff2', './fonts/nsd-latin-600.woff2', './fonts/nsd-latin-700.woff2',
  './fonts/nsd-deva-400.woff2', './fonts/nsd-deva-600.woff2', './fonts/nsd-deva-700.woff2',
  './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
