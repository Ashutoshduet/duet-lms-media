// DUET STEM 360: pictures of the hub's pages on a phone (both ways round), a 1080p screen and a 4K classroom panel,
// on the website and inside the Android app (the download bridge played by mock.js).
//   node devtools/hub/shots.mjs [outdir]      (default $HUB_WORK/screens)
import fs from 'fs';
import path from 'path';
import { REPO, WORK, ORIGIN, launch, newPage, closePage, sleep } from './lib.mjs';

const OUT = process.argv[2] || path.join(WORK, 'screens'); fs.mkdirSync(OUT, { recursive: true });
const MOCK = fs.readFileSync(path.join(REPO, 'devtools/hub/mock.js'), 'utf8');
const packs = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/packs.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/catalog.json'), 'utf8'));
// a phone that already has a few activities: the mock's saved state
const pick = (ids) => ids.filter((id) => packs.items[id] && packs.items[id].files.length);
const readyIds = pick(['body.lab-heart', 'space.planets', 'maths.w10_flagpole', 'science.p10_prism', 'science.mg_burn', 'body.j-breathing']);
const have = {}; let used = 0; for (const id of readyIds) for (const i of packs.items[id].files) if (!have[i]) { have[i] = 1; used += packs.files[i][2]; }
const seed = { items: Object.fromEntries(readyIds.map((id) => [id, 'ready'])), have, used };
const detailId = (cat.items.find((it) => it.id === 'body.lab-eye' && it.thumb) || cat.items.find((it) => it.thumb && !readyIds.includes(it.id) && packs.items[it.id] && packs.items[it.id].files.length > 3) || cat.items[0]).id;

const SHOTS = [
  // name, width, height, scale, native, lang, hash, action
  ['phone-land-home', 915, 412, 2, true, 'en', '#home'],
  ['phone-land-detail-downloading', 915, 412, 2, true, 'en', '#item/' + detailId, 'download'],
  ['phone-land-downloads', 915, 412, 2, true, 'en', '#downloads'],
  ['phone-port-home', 412, 915, 2, true, 'en', '#home'],
  ['phone-port-detail', 412, 915, 2, true, 'hi', '#item/' + readyIds[0]],
  ['phone-port-more-hinglish', 412, 915, 2, true, 'hg', '#more'],
  ['phone-land-vrbox-models', 915, 412, 2, true, 'en', '#models', 'box'],
  ['web-1080-home', 1920, 1080, 1, false, 'en', '#home'],
  ['web-1080-detail', 1920, 1080, 1, false, 'en', '#item/' + detailId],
  ['web-1080-search', 1920, 1080, 1, false, 'en', '#search/' + encodeURIComponent('magnet')],
  ['panel-4k-home', 3840, 2160, 1, true, 'en', '#home', 'focus'],
  ['panel-4k-detail', 3840, 2160, 1, true, 'hi', '#item/' + detailId],
];
const b = await launch();
const only = process.argv.slice(3);
for (const [name, w, h, scale, native, lang, hash, action] of SHOTS) {
  if (only.length && !only.includes(name)) continue;
  const p = await newPage(b, { width: w, height: h, scale, native });
  if (native) await p.evaluateOnNewDocument(`localStorage.setItem('hubmock.v1', ${JSON.stringify(JSON.stringify(seed))});(${MOCK})(${JSON.stringify({ speed: 2.5e6 })})`);
  await p.evaluateOnNewDocument((l, m) => { localStorage.setItem('hub.lang', l); localStorage.setItem('hub.mode', m); localStorage.setItem('hub.cls', ''); localStorage.setItem('hub.subj', ''); }, lang, action === 'box' ? 'box' : 'screen');
  await p.goto(ORIGIN + 'hub/index.html' + hash, { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => document.documentElement.classList.contains('ready'), { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).every((i) => i.complete), { timeout: 20000 }).catch(() => {});
  if (action === 'download') { if (await p.$('[data-dl]')) await p.click('[data-dl]'); await sleep(1600); }
  if (action === 'focus') { await p.keyboard.press('ArrowDown'); await sleep(200); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowRight'); await sleep(600); }
  await sleep(500);
  await p.screenshot({ path: path.join(OUT, name + '.png') });
  if (p.rec.errors.length) console.log(name, 'page errors:', p.rec.errors);
  console.log(name);
  await closePage(p);
}
await b.close();
console.log('screens in', OUT);
