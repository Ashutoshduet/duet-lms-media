// Offline support. Code and text: network first (updates show at once), cache when offline.
// Fonts, images and narration: cache first. Narration for the chosen language is saved in the background.
const VERSION = 'sl360-v14';
const CORE = [
  './', './index.html', './manifest.webmanifest', './voice/manifest.json',
  './js/main.js', './js/ui.js', './js/xr.js', './js/runner.js', './js/actions.js', './js/lab.js', './js/chem.js', './js/fx.js', './js/apparatus.js',
  './js/mats.js', './js/room.js', './js/audio.js', './js/strings.js', './js/vrpanels.js', './js/experiments.js', './js/experiments2.js', './js/experiments3.js', './js/experiments4.js', './js/experiments5.js', './js/experiments6.js', './js/apparatus3.js', './js/apparatus4.js', './js/apparatus5.js', './js/apparatus6.js', './js/exp_i18n.js',
  './js/optics.js', './js/optics2.js', './js/electric.js', './js/refraction.js', './js/magnet.js', './js/actions_phys.js', './js/experiments_p1.js', './js/experiments_p2.js', './js/experiments_p3.js', './lib/addons/objects/Reflector.js',
  './js/mech.js', './js/mech2.js', './js/mech3.js', './js/mech4.js', './js/light2.js', './js/mech5.js', './js/mech6.js',
  ...[4, 5, 6, 7, 8, 9, 10, 11].map((n) => `./js/experiments_p${n}.js`), './js/experiments_free.js', './js/mech7.js', './js/physics.js', './lib/rapier/rapier.mjs', './js/chemcheck.js', './js/chem_expect.json', './js/topics.js',
  ...['lemon', 'alarm_clock_01', 'magnifying_glass_01', 'stone_01', 'small_plastic_torch', 'pastic_torch_6v', 'vintage_stapler', 'cross_pein_hammer', 'rubber_duck_toy', 'lightbulb_01'].map((n) => `./models/${n}.glb`),
  './tex/wood_grain.jpg', './tex/cardboard.jpg', './tex/earth.jpg',
  './lib/three.module.js', './lib/addons/controls/OrbitControls.js', './lib/addons/environments/RoomEnvironment.js',
  './fonts/nsd-latin-400.woff2', './fonts/nsd-latin-600.woff2', './fonts/nsd-latin-700.woff2',
  './fonts/nsd-deva-400.woff2', './fonts/nsd-deva-600.woff2', './fonts/nsd-deva-700.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './brand/duet-stem-logo-light.png',
  './js/models.js', './js/particles.js', './js/photos.js', './lib/addons/loaders/GLTFLoader.js', './lib/addons/libs/meshopt_decoder.module.js', './lib/addons/loaders/RGBELoader.js', './lib/addons/utils/BufferGeometryUtils.js', './env/lab_1k.hdr',
  ...['bunsen_burner', 'chemistry_set', 'metal_stool_02', 'mounted_fluorescent_lights', 'korean_fire_extinguisher_01', 'medical_box', 'vintage_microscope', 'plastic_bottle_gallon'].map((n) => `./models/${n}.glb`),
  ...['alfoil', 'bacl2', 'barite', 'cacl2', 'candle', 'cao', 'caoh2', 'chalk', 'chroma', 'cuso4', 'cuso4b', 'cuwire', 'feso4', 'filings', 'hibiscus', 'ki', 'kmno4', 'litmus', 'marble', 'mg', 'mgo', 'na2so4', 'nahco3', 'nail', 'naoh', 'naph', 'nh4cl', 'pbi2', 'pbno3', 'phenol', 'phpaper', 'rose', 'salt', 'sand', 'soap', 'soil', 'sugar', 'sulphur', 'thio', 'turmeric', 'zngran'].map((n) => `./products/${n}.webp`),
  ...['bacl2', 'barite', 'cacl2', 'cao', 'caoh2', 'chalk', 'coal', 'cuso4', 'cuso4b', 'femix', 'fes', 'feso4', 'filings', 'hibiscus', 'ki', 'kmno4', 'litmus', 'marble', 'mg', 'mgo', 'na2so4', 'nahco3', 'nail', 'naoh', 'naph', 'nh4cl', 'pbi2', 'pbno3', 'phenol', 'phpaper', 'salt', 'sand', 'soil', 'sugar', 'sulphur', 'turmeric', 'zngran'].map((n) => `./tex/${n}.jpg`),
];
const NETWORK_FIRST = /\.(js|json|html|webmanifest)$|\/$/;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k); await self.clients.claim(); })()); });
let running = null;
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'prefetch') return;
  const urls = [...new Set(e.data.urls)];
  const job = (async () => {
    if (running) await running.catch(() => {});
    const c = await caches.open(VERSION);
    for (const u of urls) { try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } catch (err) { /* offline: next time */ } }
  })();
  running = job; e.waitUntil(job);
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url); if (url.origin !== location.origin) return;
  if (NETWORK_FIRST.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
