// Shared by the DUET STEM 360 tools (packs.mjs, check.mjs, shots.mjs): the repo's published file list, a headless Chrome
// set up like the Android hub (an Android phone with the DuetNative bridge), a test school code, and request recording.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

export const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const WORK = process.env.HUB_WORK || '/tmp/duet-hub-work';
export const PORT = +(process.env.PORT || 8797);
export const ORIGIN = `http://127.0.0.1:${PORT}/`;
export const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const require = createRequire(import.meta.url);
export function puppeteer() {
  for (const p of [process.env.PUPPETEER, '/root/tools/node_modules/puppeteer-core', 'puppeteer-core']) {
    if (!p) continue; try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('puppeteer-core not found (set PUPPETEER to its folder)');
}

// the files that go on the website: in git (committed or staged) and new files git does not ignore (the work being
// reviewed for the next commit), that are on disk now. Build packs.json again just before committing.
let TRACKED = null;
export function tracked() {
  if (TRACKED) return TRACKED;
  const ls = (...a) => execFileSync('git', ['-C', REPO, 'ls-files', '-z', ...a], { maxBuffer: 1 << 28 }).toString('utf8').split('\0').filter(Boolean);
  TRACKED = new Set([...ls(), ...ls('--others', '--exclude-standard')].filter((p) => !/(^|\/)\.|\.(md|txt|py|sh|bat|command|map)$/.test(p) && fs.existsSync(path.join(REPO, p))));
  return TRACKED;
}
const HASH = new Map();
export function fileInfo(p) { // [sha1 first 12 hex, size], as in offline.json
  if (HASH.has(p)) return HASH.get(p);
  const d = fs.readFileSync(path.join(REPO, p)); const v = [crypto.createHash('sha1').update(d).digest('hex').slice(0, 12), d.length];
  HASH.set(p, v); return v;
}
// a request URL -> repo path (null for other sites, data: and blob: URLs)
export function repoPath(u) {
  if (!u.startsWith(ORIGIN)) return null;
  let p = u.slice(ORIGIN.length).replace(/[?#].*$/, '');
  try { p = decodeURIComponent(p); } catch (e) { /* as is */ }
  p = path.posix.normalize(p); if (p.endsWith('/') || p === '.' || p === '') p += 'index.html';
  return p.replace(/^\/+/, '');
}

// a school code for tests: the list says it opens every app until 2099
export const TEST_HASH = 'f'.repeat(64);
export const TEST_LIST = JSON.stringify({ codes: { [TEST_HASH]: { u: '2099-12-31', a: ['*'] } } });
export const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 13; CPH2461) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

export async function launch(extra = []) {
  const P = puppeteer();
  return P.launch({ protocolTimeout: 900000, executablePath: CHROME, headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage', ...extra] });
}

// a page set up like the Android hub: phone user agent, DuetNative bridge (optionally with the hub's methods), a school code
// opts: { native: true|false|object, licence: true, allow: Set|null (only these repo files are served, others 404 and are recorded),
//         width, height, scale }
export async function newPage(browser, opts = {}) {
  // a fresh context for each page: no offline worker or saved copy of an earlier page answers instead of the network
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage(); page.ctx = ctx;
  await page.setBypassServiceWorker(true);
  const W = opts.width || 640, H = opts.height || 360;
  await page.setViewport({ width: W, height: H, deviceScaleFactor: opts.scale || 1, isMobile: opts.native !== false, hasTouch: opts.native !== false });
  if (opts.native !== false) await page.setUserAgent(ANDROID_UA);
  await page.evaluateOnNewDocument((lic, hash, native) => {
    if (lic) { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: hash, u: '2099-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } }
    if (native) {
      const n = { platform: () => 'android', version: () => 'test', vrMode: () => {}, deviceId: () => 'test0device0id0000', deviceName: () => 'Test phone', openChrome: () => {}, openExternal: () => {} };
      if (typeof native === 'object') Object.assign(n, native);
      window.DuetNative = n;
    }
  }, opts.licence !== false, TEST_HASH, opts.native === false ? null : (opts.native || true));
  const rec = { reqs: [], missing: [], errors: [], failed: [] };
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    const u = r.url();
    if (/\/licences\.json(\?|$)/.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: TEST_LIST });
    const p = repoPath(u);
    if (p && /(^|\/)sw\.js$/.test(p)) return r.respond({ status: 404, body: '' }); // no offline worker in tests
    if (p) {
      rec.reqs.push(p);
      if (opts.allow && tracked().has(p) && !opts.allow.has(p)) { rec.missing.push(p); return r.respond({ status: 404, body: '' }); }
    } else if (!/^(data|blob):/.test(u) && !u.startsWith(ORIGIN)) { rec.failed.push('external ' + u.slice(0, 120)); return r.abort(); }
    r.continue();
  });
  page.on('pageerror', (e) => rec.errors.push(String(e.message || e).slice(0, 300)));
  page.on('requestfailed', (r) => { const p = repoPath(r.url()); if (p && tracked().has(p)) rec.failed.push(p + ' ' + (r.failure() && r.failure().errorText)); });
  page.rec = rec;
  return page;
}
export async function closePage(page) { try { await page.close(); } catch (e) { /* gone */ } try { await page.ctx.close(); } catch (e) { /* gone */ } }
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// waits until no request has started for `quiet` ms (or `max` ms passed)
export async function idle(page, quiet = 1200, max = 20000) {
  const t0 = Date.now(); let n = page.rec.reqs.length, last = Date.now();
  while (Date.now() - t0 < max) { await sleep(200); if (page.rec.reqs.length !== n) { n = page.rec.reqs.length; last = Date.now(); } else if (Date.now() - last >= quiet) return true; }
  return false;
}
// runs fn over items with n pages at once
export async function pool(list, n, fn) {
  let i = 0; const run = async (w) => { while (i < list.length) { const k = i++; await fn(list[k], k, w); } };
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, (_, w) => run(w)));
}
export function readJSON(p, d = null) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } }
