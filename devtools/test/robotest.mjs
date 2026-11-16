// DUET Robotics Lab 360: plays every lesson end to end through the real UI, as a student would: drags parts from the
// drawer onto the breadboard, drags wires from pin to hole, presses Check, edits the code, presses Run, presses buttons,
// turns knobs, slides the room light. Fails if a lesson cannot be completed or the page throws.
//   node devtools/test/robotest.mjs [lesson,lesson,...|all] [outdir]
//   env: PORT (8790), W, H (1280×720), PHONE=1 (915×412 touch, CPU ×4), PANEL=1 (teacher board on: big text), DEMO=1 (no school code),
//        SHOTS=1 (a picture per step)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
const ids = (process.argv[2] && process.argv[2] !== 'all') ? process.argv[2].split(',') : null;
const out = process.argv[3] || '/tmp/robotest'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8790, PHONE = !!process.env.PHONE, SHOTS = !!process.env.SHOTS;
const W = +(process.env.W || (PHONE ? 915 : 1280)), H = +(process.env.H || (PHONE ? 412 : 720));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext(PHONE ? { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent } : { viewport: { width: W, height: H } });
if (!process.env.DEMO) await ctx.addInitScript(() => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort()); // offline: nothing from the internet
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
if (PHONE) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute${process.env.PANEL ? '&panel=1' : ''}`, { waitUntil: 'commit' });
await page.waitForFunction(() => document.title === 'READY', null, { timeout: 180000 });
if (process.env.DEMO) { await page.waitForTimeout(800); const demo = page.locator('#duet-gate .alt'); if (await demo.count()) await demo.click(); }
await page.waitForTimeout(500);
const sleep = (ms) => page.waitForTimeout(ms);
const st = () => page.evaluate(() => window.robo.state());
const ev = (f, a) => page.evaluate(f, a);
let shot = 0;
const snap = async (name) => { if (SHOTS) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${name}.png` }); };

// pointer helpers: a mouse on a computer, a finger on a phone (both as pointer events)
async function drag(a, bpt, steps = 14) {
  if (PHONE) {
    const cdp = await ctx.newCDPSession(page);
    const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await tp('touchStart', a.x, a.y); await sleep(60);
    for (let i = 1; i <= steps; i++) { await tp('touchMove', a.x + (bpt.x - a.x) * i / steps, a.y + (bpt.y - a.y) * i / steps); await sleep(16); }
    await sleep(120); await tp('touchEnd'); await cdp.detach(); return;
  }
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await sleep(40);
  for (let i = 1; i <= steps; i++) { await page.mouse.move(a.x + (bpt.x - a.x) * i / steps, a.y + (bpt.y - a.y) * i / steps); await sleep(12); }
  await sleep(100); await page.mouse.up();
}
async function tap(p) { if (PHONE) { await page.touchscreen.tap(p.x, p.y); } else await page.mouse.click(p.x, p.y); }
async function hold(p, ms) {
  if (PHONE) { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); return; }
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await sleep(ms); await page.mouse.up();
}
async function waitFor(fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
async function stepDone(ms = 20000, what) { await waitFor(async () => (await st()).done, ms, what); }
async function nextIfNeeded(i) { // place/wire/… go on by themselves; the others need Next (never on the last step)
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const s = await st(); if (s.step !== i || i === s.of - 1) return;
    if (Date.now() - t0 > 2500 && await page.locator('#b-next').isEnabled()) { await page.click('#b-next', { force: true, timeout: 5000 }).catch(() => {}); await sleep(300); }
    await sleep(200);
  }
}
async function settle() { await waitFor(() => ev(() => window.robo.settled()), 15000, 'camera'); await sleep(250); }
async function openPart(tag) { const p = await ev((t) => window.robo.partScreen(t), tag); await tap(p); await sleep(300); }
async function setRange(sel, v) { await page.locator(sel).fill(String(v)); await sleep(100); }
async function knob(tag, dir) { const p = await ev((t) => window.robo.roleScreen(t, 'knob'), tag); await drag(p, { x: p.x + dir * 260, y: p.y - dir * 40 }, 16); }

// what to do in each lesson's "act" steps (the rest is read from the lesson itself)
const ACT = {
  ledres: [async () => { await tap(await ev(() => window.robo.roleScreen('r1', 'body'))); await sleep(400); await page.selectOption('#co-ohm', '1000'); }],
  button: [async () => { const p = await ev(() => window.robo.roleScreen('b1', 'cap')); await hold(p, 1400); }, async () => { await sleep(600); }],
  knob: [async () => { await knob('pot1', -1); }, async () => { await knob('pot1', 1); }],
  piano: [async () => { for (let round = 0; round < 3; round++) { for (const k of ['k1', 'k2', 'k3']) { const p = await ev((t) => window.robo.roleScreen(t, 'cap'), k); await hold(p, 1300); await sleep(250); } if ((await st()).done) break; } }],
  night: [async () => { await setRange('#r-light', 8); }, async () => { await setRange('#r-light', 90); }],
  servoknob: [async () => { await knob('pot1', -1); }, async () => { await knob('pot1', 1); }],
  parking: [async () => { await openPart('us1'); await setRange('#co-dist', 60); await sleep(2500); await setRange('#co-dist', 10); }],
  iralarm: [async () => { await openPart('ir1'); await setRange('#co-dist', 5); }, async () => { await setRange('#co-dist', 35); }],
  temp: [async () => { await openPart('t1'); await setRange('#co-temp', 40); }],
};

const results = [];
const lessons = await ev(() => (window.app ? [...document.querySelectorAll('#strip .chip')].map((c) => c.dataset.lesson) : []));
for (const id of ids || lessons) {
  const t0 = Date.now(); let ok = false, why = '';
  try {
    if (PHONE) { await page.click('#b-menu'); await sleep(200); }
    await page.click(`#strip [data-lesson="${id}"]`); await sleep(900);
    const s0 = await st(); if (s0.lesson !== id) throw new Error('lesson did not open (locked?)');
    await page.selectOption('#s-speed', '2'); // the test runs the sketch at 2×
    let acts = 0;
    for (let guard = 0; guard < 40; guard++) {
      const s = await st(); const step = await ev(() => { const s = window.robo.step(); return s && { k: s.k, region: s.region, place: s.place, wire: s.wire, set: s.set && s.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`);
      if (step.k === 'info') { await nextIfNeeded(s.step); }
      else if (step.k === 'tap') { await settle(); await tap(await ev((r) => window.robo.regionScreen(r), step.region)); await stepDone(5000, 'tap ' + step.region); await nextIfNeeded(s.step); }
      else if (step.k === 'place') {
        await page.click('#bar [data-tool="move"]');
        const card = await page.locator(`#plist .pc[data-type="${step.place.type}"]`).boundingBox(); if (!card) throw new Error('no drawer card for ' + step.place.type);
        await settle(); // the camera flies to the breadboard
        const to = await ev(([ty, at, rot]) => window.robo.dropFor(ty, at, rot), [step.place.type, step.place.at, step.place.rot]);
        await drag({ x: card.x + card.width / 2, y: card.y + card.height / 2 - 6 }, to, 18);
        await stepDone(4000, 'place ' + step.place.tag); await nextIfNeeded(s.step);
      } else if (step.k === 'wire') {
        await settle(); await page.click('#bar [data-tool="wire"]');
        const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w) throw new Error('no ghost wire for ' + step.wire.join('→'));
        const a = await ev((e) => window.robo.screen(e), w[0]), bb = await ev((e) => window.robo.screen(e), w[1]);
        await drag(a, bb, 16); await stepDone(4000, 'wire ' + step.wire.join('→'));
        await page.click('#bar [data-tool="move"]'); await nextIfNeeded(s.step);
      } else if (step.k === 'check') {
        await page.click('#b-check'); await sleep(300);
        if (!(await st()).done) throw new Error('check failed: ' + (await page.locator('#c-x .msg').textContent().catch(() => '?')));
        await nextIfNeeded(s.step);
      } else if (step.k === 'run') { if (PHONE) { await page.click('#b-code'); await sleep(300); } await page.click('#b-run'); if (PHONE) { await page.click('#b-side'); } await stepDone(8000, 'run'); await nextIfNeeded(s.step); }
      else if (step.k === 'edit') {
        let src = await page.locator('#editor textarea').inputValue();
        for (const [re, fl, v] of step.set) src = src.replace(new RegExp(re, fl), v);
        if (PHONE) { await page.click('#b-code'); await sleep(300); }
        await page.locator('#editor textarea').fill(src); await page.click('#b-run'); if (PHONE) await page.click('#b-side');
        await stepDone(8000, 'edit'); await nextIfNeeded(s.step);
      } else if (step.k === 'watch') { await stepDone(40000, 'watch'); await nextIfNeeded(s.step); }
      else if (step.k === 'act') { await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(30000, 'act ' + acts); await nextIfNeeded(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 30000, 'lesson complete');
    await snap(`${id}-complete`);
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); await page.screenshot({ path: `${out}/FAIL-${id}.png` }); }
  const s = await st().catch(() => ({}));
  results.push({ id, ok, why, secs: Math.round((Date.now() - t0) / 1000), step: s.step, mcu: s.mcu, err: s.err && s.err.code });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(10) + ` ${Math.round((Date.now() - t0) / 1000)}s` + (ok ? '' : `  step ${s.step} · ${why}`));
}
const board = await ev(() => window.DuetBoard ? DuetBoard.info() : null).catch(() => null);
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, board, size: [W, H], phone: PHONE }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
const failed = results.filter((r) => !r.ok).length + (errors.length ? 1 : 0);
console.log(`${results.length - results.filter((r) => !r.ok).length}/${results.length} lessons complete${errors.length ? ', ' + errors.length + ' page errors' : ''}`);
await b.close(); process.exit(failed ? 1 : 0);
