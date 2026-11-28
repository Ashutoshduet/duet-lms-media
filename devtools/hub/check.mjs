// DUET STEM 360: tests every catalogue item the way the Android hub will run it.
//   node devtools/hub/check.mjs [--only <app|id|prefix*>,…] [--jobs 2] [--redo] [--failed] [--quick]
// For each item: the hub page (website) opens the item, its Play link is followed (Science and Maths Lab get the quick test
// switches added, and play every step), and only the files the APK has (every app's base) plus the item's own download
// list are served: any other published file the page asks for is a miss (and 404, as on a phone that does not have it).
// Passes when there are no misses and no page errors. A sample is also opened by pressing the real Play button.
// Results: $HUB_WORK/check/<item>.json and a summary.
import fs from 'fs';
import path from 'path';
import { WORK, ORIGIN, REPO, tracked, launch, newPage, closePage, sleep, idle, pool, readJSON } from './lib.mjs';
import { OPEN } from './packs.mjs';

const OUT = path.join(WORK, 'check'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const packs = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/packs.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/catalog.json'), 'utf8'));
const F = packs.files.map((f) => f[0]);
const base = new Set(); for (const a of Object.values(packs.apps)) for (const i of a.files) base.add(F[i]);
let items = cat.items;
const only = arg('--only'); if (only) { const k = only.split(','); items = items.filter((it) => k.some((x) => x === it.app || x === it.id || (x.endsWith('*') && it.id.startsWith(x.slice(0, -1))))); }
if (process.argv.includes('--failed')) items = items.filter((it) => { const r = readJSON(path.join(OUT, it.id + '.json')); return !r || !r.ok; });
if (!process.argv.includes('--redo') && !process.argv.includes('--failed')) items = items.filter((it) => !fs.existsSync(path.join(OUT, it.id + '.json')));
const QUICK = process.argv.includes('--quick'); // open and settle only: no step-by-step play (the crawl played them)
const CLICK = new Set(['science.mg_burn', 'maths.w10_flagpole', 'body.lab-heart', 'body.j-breathing', 'space.planets', 'space.mars', 'robotics.blink', 'drone.sim']);
console.log(`check: ${items.length} items`);

// the browser is started again when it dies (a busy machine runs out of memory) and every 40 pages
let browser = null, used = 0, starting = null;
const getBrowser = async () => {
  if (browser && browser.connected && used < 40) return browser;
  if (starting) return starting;
  starting = (async () => { const old = browser; browser = null; if (old) { await sleep(500); await old.close().catch(() => {}); } browser = await launch(); used = 0; return browser; })();
  try { return await starting; } finally { starting = null; }
};
const t0 = Date.now(); let n = 0;
await pool(items, +arg('--jobs', 2), async (it) => {
  const allow = new Set(base); for (const i of (packs.items[it.id] || { files: [] }).files) allow.add(F[i]);
  let page; try { used++; page = await newPage(await getBrowser(), { width: 640, height: 360, scale: 1, allow }); } catch (e) { browser = null; used++; page = await newPage(await getBrowser(), { width: 640, height: 360, scale: 1, allow }); }
  const t1 = Date.now(); let err = null, url = null;
  try {
    await page.goto(ORIGIN + 'hub/index.html#item/' + encodeURIComponent(it.id), { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.classList.contains('ready') && document.querySelector('[data-play]'), { timeout: 30000 });
    url = await page.evaluate((id) => window.__hub.playUrl(window.__hub.CAT.items.find((x) => x.id === id)), it.id);
    const want = new URL(url, ORIGIN + 'hub/index.html').href;
    if (CLICK.has(it.id) && it.app !== 'science' && it.app !== 'maths') { // the real button
      await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 120000 }), page.click('[data-play]')]);
      if (page.url() !== want) throw new Error('Play went to ' + page.url());
    }
    // then the activity as the crawl opened it (Science / Maths Lab: with the quick-play switches)
    await Promise.race([OPEN[it.app](page, it, { thumb: false, play: !QUICK }), sleep(300000).then(() => { throw new Error('took over 5 min'); })]);
  } catch (e) { err = String(e.message || e).slice(0, 200); }
  const r = page.rec; await closePage(page);
  const miss = [...new Set(r.missing)];
  const out = { id: it.id, quick: QUICK, ok: !err && !miss.length && !r.errors.length, ms: Date.now() - t1, url, missing: miss, errors: r.errors, err, reqs: [...new Set(r.reqs)].filter((p) => tracked().has(p)) };
  fs.writeFileSync(path.join(OUT, it.id + '.json'), JSON.stringify(out));
  n++; console.log(`${n}/${items.length} ${out.ok ? 'ok  ' : 'FAIL'} ${it.id} ${out.ms} ms${miss.length ? ' missing: ' + miss.slice(0, 4).join(' ') : ''}${r.errors.length ? ' pageerrors: ' + r.errors.slice(0, 2).join(' | ') : ''}${err ? ' error: ' + err : ''} [${Math.round((Date.now() - t0) / 1000)} s]`);
});
if (browser) await browser.close().catch(() => {});
// summary over every item checked so far
const all = cat.items.map((it) => readJSON(path.join(OUT, it.id + '.json'))).filter(Boolean);
const per = {}; for (const r of all) { const a = r.id.split('.')[0]; per[a] = per[a] || { ok: 0, fail: 0 }; per[a][r.ok ? 'ok' : 'fail']++; }
console.log('summary', JSON.stringify(per), `checked ${all.length} of ${cat.items.length}`);
const bad = all.filter((r) => !r.ok); if (bad.length) console.log('failing:', bad.map((r) => r.id).join(' '));
