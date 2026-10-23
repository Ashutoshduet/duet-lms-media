// DUET Drone Simulator offline support. Page and code: network first, but never wait more than 2.5 s
// (school Wi-Fi often has no internet). Libraries, fonts and icons: cache first.
const VERSION = 'dsim-v2';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './lib/three.module.js', './lib/addons/objects/Sky.js', './lib/addons/controls/OrbitControls.js', './lib/addons/utils/BufferGeometryUtils.js',
  './fonts/chakra-petch-latin-600-normal.woff2', './fonts/chakra-petch-latin-700-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-500-normal.woff2', './fonts/ibm-plex-mono-latin-700-normal.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './brand/duet-stem-logo-light.png',
];
const NETWORK_FIRST = /\.(html|webmanifest)$|\/$/;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // only this app's own older caches: the other DUET apps share this web address and its cache store
    for (const k of await caches.keys()) if (k !== VERSION && k.startsWith('dsim-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith((async () => {
      const saved = caches.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); } return res; });
      const first = await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(() => r(null), 2500))]);
      if (first) return first;
      return (await saved) || net;
    })());
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
