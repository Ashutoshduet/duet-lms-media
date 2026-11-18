// DUET Robotics Lab 360, batch 4: plays every new-board lesson end to end through the real UI, as a student would, in
// headless Chromium (puppeteer-core): taps the board's parts, swaps the Uno for the Nano in the board box, drags wires
// from the strips of a breadboard board, presses Check and Run, types the WiFi password, turns knobs, holds the touch
// plate, and uses the phone on the bench by tapping its 3D screen (browser: types the ESP32's address on the phone's
// keyboard and taps the page's ON / OFF buttons; BT Terminal: connects and taps 1 and 0). Fails on a page error.
//   node devtools/test/robotest4.mjs [lesson,...|all] [outdir]     env: PORT (8809), PHONE=1 (915×412 touch), SHOTS=1
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire('/root/tools/node_modules/'); const puppeteer = require('puppeteer-core');
const ALL = ['nano_meet', 'nano_traffic', 'mega_meet', 'mega_bar', 'esp_meet', 'esp_knob', 'esp_touch', 'esp_wifi', 'esp_iot', 'esp_bt', 'esp_hall'];
const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : ALL;
const out = process.argv[3] || '/tmp/claude-0/agent-robo4/robotest4'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8809, PHONE = !!process.env.PHONE, SHOTS = !!process.env.SHOTS;
const W = PHONE ? 915 : 1280, H = PHONE ? 412 : 720;
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', protocolTimeout: 240000, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
const page = await b.newPage();
await page.setViewport(PHONE ? { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: W, height: H });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForFunction(() => document.title === 'READY', { timeout: 240000 });
await page.evaluate(() => { window.__lost = 0; window.app.stage.renderer.domElement.addEventListener('webglcontextlost', () => { window.__lost++; }); }); // (a dark bench in a screenshot: the software GPU lost its context)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let shot = 0; const snap = async (name) => { if (SHOTS) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${name}.png` }); };

async function drag(a, p, steps = 14) {
  if (PHONE) { await page.touchscreen.touchStart(a.x, a.y); await sleep(60); for (let i = 1; i <= steps; i++) { await page.touchscreen.touchMove(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(16); } await sleep(120); await page.touchscreen.touchEnd(); return; }
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await sleep(40);
  for (let i = 1; i <= steps; i++) { await page.mouse.move(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(12); }
  await sleep(100); await page.mouse.up();
}
async function tap(p) { if (PHONE) { await page.touchscreen.tap(p.x, p.y); } else await page.mouse.click(p.x, p.y); }
async function hold(p, ms) { if (PHONE) { await page.touchscreen.touchStart(p.x, p.y); await sleep(ms); await page.touchscreen.touchEnd(); return; } await page.mouse.move(p.x, p.y); await page.mouse.down(); await sleep(ms); await page.mouse.up(); }
// press and keep the finger there until something happens (a slow software renderer may take a while to see it)
async function holdUntil(p, fn, ms = 6000) {
  if (PHONE) await page.touchscreen.touchStart(p.x, p.y); else { await page.mouse.move(p.x, p.y); await page.mouse.down(); }
  const t0 = Date.now(); await sleep(150); while (Date.now() - t0 < ms && !(await fn())) await sleep(60);
  if (PHONE) await page.touchscreen.touchEnd(); else await page.mouse.up();
}
async function selectPart(tag) { await ev((t) => { const a = window.app; a.select({ part: a.lab.byTag(t) }); }, tag); await sleep(300); } // as a tap on the part's body opens its card
async function waitFor(fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
async function stepDone(ms = 20000, what) { await waitFor(async () => (await st()).done, ms * 3, what); }
async function nextIfNeeded(i) {
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) { // (a slow software renderer: the card moves on at its next frame)
    const s = await st(); if (s.step !== i || i === s.of - 1) return;
    if (Date.now() - t0 > 2500 && await ev(() => !document.querySelector('#b-next').disabled)) { await ev(() => document.querySelector('#b-next').click()); await sleep(300); }
    await sleep(200);
  }
}
async function settle() { await waitFor(() => ev(() => window.robo.settled()), 90000, 'camera'); await sleep(250); } // (a slow software renderer on a busy machine: give the camera time)
async function openPart(tag) { const p = await ev((t) => window.robo.partScreen(t), tag); await tap(p); await sleep(400); }
async function setRange(sel, v) { await ev(([s, v]) => { const i = document.querySelector(s); i.value = String(v); i.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]); await sleep(150); }
async function knob(tag, dir) {
  const p = await ev((t) => window.robo.roleScreen(t, 'knob'), tag); await drag(p, { x: p.x + dir * 260, y: p.y - dir * 40 }, 16);
  // a wire in front of the knob took the drag: do what the card says, tap the part and use its slider
  if (await ev(() => !!(window.app.sel && window.app.sel.wire))) { await selectPart(tag); if (await ev(() => !!document.querySelector('#co-pos'))) await setRange('#co-pos', dir > 0 ? 100 : 0); }
}
// the phone: look at it, then tap its items on the 3D screen
async function phoneView() { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView('phone4'); }); await settle(); }
async function ptap(id) { if (await ev(() => window.app.stage.viewName !== 'phone4')) await phoneView(); /* a new step may have turned the camera to the board: the phone first */ await waitFor(async () => !!(await ev((i) => window.robo4.phoneItem(i), id)), 8000, 'phone item ' + id); const p = await ev((i) => window.robo4.phoneItem(i), id); await tap(p); await sleep(260); }
async function typeOnPhone(text) { for (const ch of text) await ptap('key:' + ch); }
async function openPage() {
  await waitFor(async () => !!(await ev(() => window.robo4.net().ip)), 60000, 'the ESP32 on the WiFi'); const ip = await ev(() => window.robo4.net().ip);
  await phoneView(); const ph = await ev(() => window.robo4.phone()); if (ph.app !== 'browser') { await ptap('home'); await ptap('app:browser'); }
  await ptap('addr');
  // the computer's own keys type into the phone (the address bar has focus), then the small keys on the 3D phone
  if (!PHONE && await ev(() => document.activeElement && document.activeElement.id === 'phone4in')) { for (let i = 0; i < 24; i++) await page.keyboard.press('Backspace'); }
  else for (let i = 0; i < 24; i++) await ptap('key:⌫');
  await waitFor(async () => (await ev(() => window.robo4.phone().kbText)) === '', 4000, 'the address bar empty');
  await typeOnPhone(ip); await ptap('key:Go');
  await waitFor(async () => { const p = await ev(() => window.robo4.phone()); return !!(p.page && p.page.code === 200); }, 12000, 'the page on the phone');
}
const ACT = {
  nano_traffic: [async () => { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView('swap4'); }); await settle(); await tap(await ev(() => window.robo4.boxScreen('nano'))); }],
  mega_bar: [async () => { await knob('pot1', 1); }, async () => { await knob('pot1', -1); }],
  esp_knob: [async () => { await knob('pot1', 1); }, async () => { await knob('pot1', -1); }],
  esp_touch: [async () => { await holdUntil(await ev(() => window.robo.roleScreen('pad1', 'cap')), () => ev(() => window.app.rt.ledLit('led1'))); }, async () => { await sleep(800); await holdUntil(await ev(() => window.robo.roleScreen('pad1', 'cap')), () => ev(() => !window.app.rt.ledLit('led1'))); }],
  esp_wifi: [async () => { await openPage(); }, async () => { await ptap('link:/on'); }, async () => { await waitFor(async () => (await ev(() => window.robo4.phone().page && window.robo4.phone().page.links.length)), 8000, 'page'); await ptap('link:/off'); }],
  esp_iot: [async () => { await openPage(); }, async () => { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView('esp4'); }); await settle(); await openPart('t1'); await setRange('#co-temp', 40); await phoneView(); }],
  esp_bt: [async () => { await phoneView(); await ptap('home'); await ptap('app:bt'); await ptap('bt:dev:DUET-ESP32'); }, async () => { await ptap('bt:send:1'); }, async () => { await ptap('bt:send:0'); }],
  // the magnet: drag it down to the chip, then tap its top to turn it over (its card's slider and Flip button if that missed)
  esp_hall: [async () => { const p = await ev(() => window.robo4.roleCenter('mag1', 'knob')); await drag(p, { x: p.x + 260, y: p.y - 40 }, 16); await sleep(2500);
    if (!(await st()).done) { await selectPart('mag1'); if (await ev(() => window.app.lab.byTag('mag1').state.pole === 'S')) await ev(() => document.querySelector('#co-flip').click()); await setRange('#co-mdist', 5); } },
    async () => { await tap(await ev(() => window.robo.roleScreen('mag1', 'cap'))); await sleep(2500); if (!(await st()).done) { await selectPart('mag1'); await ev(() => document.querySelector('#co-flip').click()); } }],
};

const results = [];
for (const id of ids) {
  const t0 = Date.now(); let ok = false, why = '';
  try {
    if (PHONE) { await ev(() => document.querySelector('#b-menu').click()); await sleep(200); }
    await ev((i) => document.querySelector(`#strip [data-lesson="${i}"]`).click(), id); await sleep(900);
    const s0 = await st(); if (s0.lesson !== id) throw new Error('lesson did not open');
    await ev(() => { const s = document.querySelector('#s-speed'); s.value = '2'; s.dispatchEvent(new Event('change')); });
    let acts = 0;
    for (let guard = 0; guard < 40; guard++) {
      const s = await st(); const step = await ev(() => { const s = window.robo.step(); return s && { k: s.k, region: s.region, place: s.place, wire: s.wire, set: s.set && s.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`);
      if (step.k === 'info') await nextIfNeeded(s.step);
      else if (step.k === 'tap') { await settle(); await tap(await ev((r) => window.robo4.regionScreen(r), step.region)); await stepDone(5000, 'tap ' + step.region); await nextIfNeeded(s.step); }
      else if (step.k === 'place') {
        await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await settle();
        const card = await ev((t) => { const r = document.querySelector(`#plist .pc[data-type="${t}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 - 6 }; }, step.place.type);
        const to = await ev(([ty, at, rot]) => window.robo.dropFor(ty, at, rot), [step.place.type, step.place.at, step.place.rot]);
        await drag(card, to, 18); await stepDone(5000, 'place ' + step.place.tag); await nextIfNeeded(s.step);
      } else if (step.k === 'wire') {
        await settle(); await ev(() => document.querySelector('#bar [data-tool="wire"]').click());
        const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w && (await st()).done) { await nextIfNeeded(s.step); continue; } if (!w) throw new Error('no ghost wire for ' + step.wire.join('→'));
        const a = await ev((e) => window.robo.screen(e), w[0]), bb = await ev((e) => window.robo.screen(e), w[1]);
        await drag(a, bb, 16); await stepDone(5000, 'wire ' + step.wire.join('→'));
        await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await nextIfNeeded(s.step);
      } else if (step.k === 'check') { await ev(() => document.querySelector('#b-check').click()); await sleep(300); if (!(await st()).done) throw new Error('check failed: ' + await ev(() => (document.querySelector('#c-x .msg') || {}).textContent)); await nextIfNeeded(s.step); }
      else if (step.k === 'run') { await ev(() => document.querySelector('#b-run').click()); await stepDone(8000, 'run'); await nextIfNeeded(s.step); }
      else if (step.k === 'edit') {
        await ev((set) => { const ta = document.querySelector('#editor textarea'); let src = ta.value; for (const [re, fl, v] of set) src = src.replace(new RegExp(re, fl), v); ta.value = src; ta.dispatchEvent(new Event('input', { bubbles: true })); window.app.editor.value = src; }, step.set);
        await ev(() => document.querySelector('#b-run').click()); await stepDone(8000, 'edit'); await nextIfNeeded(s.step);
      } else if (step.k === 'watch') { await stepDone(45000, 'watch'); await nextIfNeeded(s.step); }
      else if (step.k === 'act') { await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(40000, 'act ' + acts); await nextIfNeeded(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 120000, 'lesson complete');
    await page.screenshot({ path: `${out}/${id}-complete.png` });
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); await page.screenshot({ path: `${out}/FAIL-${id}.png` }).catch(() => {}); }
  const s = await st().catch(() => ({}));
  const lost = await page.evaluate(() => window.__lost).catch(() => null);
  results.push({ id, ok, why, secs: Math.round((Date.now() - t0) / 1000), step: s.step, mcu: s.mcu, err: s.err && s.err.code, glLost: lost });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(13) + ` ${Math.round((Date.now() - t0) / 1000)}s` + (ok ? "" : `  step ${s.step} · ${why}`) + (lost ? `  (GL context lost ${lost}x)` : ""));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, size: [W, H], phone: PHONE }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
const failed = results.filter((r) => !r.ok).length + (errors.length ? 1 : 0);
console.log(`${results.length - results.filter((r) => !r.ok).length}/${results.length} lessons complete${errors.length ? ', ' + errors.length + ' page errors' : ', 0 page errors'}`);
await b.close(); process.exit(failed ? 1 : 0);
