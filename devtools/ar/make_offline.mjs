// Writes ar/borrow.json: every file DUET AR uses from its neighbours (../body, ../space, ../science), so that its offline
// worker (ar/sw.js, made by devtools/offline/build_sw.py . ar) saves them too and the AR page works with no internet
// after the first open: the models and maps of every catalog item, the 360° pictures, the narration clips (each card's
// and every body part's, in each language that has one), three.js and its add-ons, the fonts and the logo.
// Usage: node devtools/ar/make_offline.mjs     (then: python3 devtools/offline/build_sw.py . ar)
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';
const ROOT = new URL('../../', import.meta.url).pathname;
const cat = JSON.parse(readFileSync(ROOT + 'ar/catalog.json', 'utf8')), info = JSON.parse(readFileSync(ROOT + 'ar/info.json', 'utf8'));
const out = new Set(), rel = (p) => posix.normalize(p);   // paths as the worker lists them: '../app/…'
const add = (p) => { if (p && p.startsWith('../')) out.add(rel(p)); };
// code, fonts, logo (index.html's import map and css/ar.css)
for (const f of ['three.module.js', 'addons/loaders/GLTFLoader.js', 'addons/libs/meshopt_decoder.module.js', 'addons/controls/OrbitControls.js', 'addons/environments/RoomEnvironment.js', 'addons/utils/SkeletonUtils.js', 'addons/utils/BufferGeometryUtils.js']) add('../science/lib/' + f);
for (const w of [400, 600, 700]) for (const s of ['latin', 'deva']) add(`../science/fonts/nsd-${s}-${w}.woff2`);
add('../science/brand/duet-stem-logo-light.png');
// models, maps, 360° pictures
for (const it of cat.items) {
  add(it.src); add(it.map); add(it.pano);
  if (it.planet) { add(it.planet.map); add(it.planet.ring); }
}
// narration: the cards' own clips and every body part's
const L = ['en', 'hi', 'hg'];
for (const it of cat.items) {
  const [src, id] = (it.say || '').split(':');
  if (src === 'body') for (const l of (info.steps[id] || { clip: [] }).clip) add(`../body/audio/${l}/${id}.mp3`);
  if (src === 'space') for (const l of L) if (existsSync(`${ROOT}space/audio/${l}/${id}.mp3`)) add(`../space/audio/${l}/${id}.mp3`);
}
for (const [id, p] of Object.entries(info.parts)) for (const l of p.clip) add(`../body/audio/${l}/part-${id}.mp3`);
// every file must exist and be published (in git), or the offline copy would wait for it for ever
const tracked = new Set(execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' }).split('\n'));
const list = [...out].sort(), bad = list.filter((p) => !existsSync(ROOT + p.slice(3)) || !tracked.has(p.slice(3)));
if (bad.length) { console.error('missing or not in git:', bad.join(' ')); process.exit(1); }
writeFileSync(ROOT + 'ar/borrow.json', JSON.stringify(list, null, 0).replace(/","/g, '",\n"') + '\n');
const mb = list.reduce((s, p) => s + statSync(ROOT + p.slice(3)).size, 0) / 1e6;
const by = {}; for (const p of list) { const k = p.split('/').slice(1, 3).join('/'); by[k] = (by[k] || 0) + statSync(ROOT + p.slice(3)).size / 1e6; }
console.log(`borrow.json: ${list.length} files, ${mb.toFixed(1)} MB`, Object.entries(by).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '));
