// Renders a thumbnail for every model in ar/catalog.json with the viewer itself (Screen 3D, three-quarter view, studio
// backdrop) and saves them as small WebP files in ar/thumbs/<id>.webp (480×360, about 15–30 KB each).
// Needs the static server on AR_BASE (default http://127.0.0.1:8804/). Usage: node devtools/ar/make_thumbs.mjs [id …]
import puppeteer from 'puppeteer-core';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
const sharp = createRequire('/root/tools/node_modules/')('sharp');
const ROOT = new URL('../../', import.meta.url).pathname, BASE = process.env.AR_BASE || 'http://127.0.0.1:8804/';
const cat = JSON.parse(readFileSync(ROOT + 'ar/catalog.json', 'utf8'));
const want = process.argv.slice(2), ids = cat.items.map((x) => x.id).filter((id) => !want.length || want.includes(id));
mkdirSync(ROOT + 'ar/thumbs', { recursive: true });
// this machine is shared and busy: a renderer that dies is relaunched and the list carries on (3 tries per model)
async function open() {
  const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 900000,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 640, height: 480, deviceScaleFactor: 1.5 });
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(BASE + 'ar/index.html?thumb=1&model=' + ids[0] + '&mode=screen', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => document.title === 'READY', { timeout: 300000 });
  return { b, pg };
}
const errs = [];
let S = await open();
for (const id of ids) {
  for (let tries = 0; tries < 3; tries++) {
    try {
      await S.pg.evaluate((i) => window.__thumb(i), id);
      const png = await S.pg.screenshot({ type: 'png' });
      const out = ROOT + 'ar/thumbs/' + id + '.webp';
      await sharp(png).resize(480, 360, { fit: 'cover' }).webp({ quality: 82, effort: 6 }).toFile(out);
      console.log(id, Math.round(statSync(out).size / 1024) + ' KB');
      break;
    } catch (e) {
      console.log(id, 'failed (' + e.message.slice(0, 60) + '), retrying');
      try { await S.b.close(); } catch (e2) { /* gone */ }
      S = await open();
    }
  }
}
if (errs.length) console.log('page errors:', errs);
await S.b.close();
