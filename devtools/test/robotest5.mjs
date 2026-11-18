// DUET Robotics Lab 360, batch 5: plays every micro:bit lesson end to end in the real page, as a student would: taps the
// board's parts, presses A and B on the 3D board (mouse or finger), drags it to tilt it and shakes it to and fro, clips
// crocodile leads from a pad to a part, moves the panel's sliders, edits the Python, presses Run / Check / Next. With
// XR=1 it plays lessons in WebXR on an emulated Meta Quest 3 (IWER: science/test/iwer.module.js) with the controller's ray:
// the trigger on A / B presses them, the trigger on the board and a turn of the hand tilts it, a quick wave shakes it,
// trigger on a pad and then on a part clips a lead. Fails on a lesson that cannot be completed, or on any page error.
//   node devtools/test/robotest5.mjs [lesson,...|all] [outdir]
//   env: PORT (8810), PHONE=1 (915×412, touch, CPU ×4), XR=1, SHOTS=1, CHROME (the browser)
//   XR=1 HANDS=1: the same in the headset with bare hands (pinch for the trigger, the hand's pose for the ray)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const puppeteer = require('puppeteer-core');
const ALL = ['mbmeet', 'mbbadge', 'mbheart', 'mbcount', 'mbsteps', 'mbtemp', 'mbcompass', 'mbnight', 'mbrps', 'mbplant', 'mbgate'];
const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : ALL;
const out = process.argv[3] || '/tmp/robotest5'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8810, PHONE = !!process.env.PHONE, XR = !!process.env.XR, SHOTS = !!process.env.SHOTS;
const INP = process.env.HANDS ? 'hands' : 'controllers'; // XR: the controllers, or bare hands (HANDS=1)
const W = PHONE ? 915 : XR ? 900 : 1280, H = PHONE ? 412 : XR ? 600 : 720;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: 'new', protocolTimeout: 600000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', `--window-size=${W},${H}`] });
const page = await b.newPage();
await page.setViewport(PHONE ? { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: W, height: H });
if (PHONE) { await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'); const cdp = await page.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
await page.evaluateOnNewDocument((xr) => {
  try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); localStorage.removeItem('rl360.mb5blocks'); } catch (e) { /* none */ }
  window.__ctxLost = 0; addEventListener('webglcontextlost', () => { window.__ctxLost++; }, true);
  if (xr) document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'module'; s.textContent = "import { XRDevice, metaQuest3 } from '/science/test/iwer.module.js'; const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; window.xrdev = d;"; document.head.appendChild(s); });
}, XR);
await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForFunction((xr) => document.title === 'READY' && (!xr || !!window.xrdev), { timeout: 300000 }, XR);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
async function waitFor(fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
// wait for the step to be done, by the board's clock: a slow machine (software WebGL, a busy CPU) draws few frames, and
// the board's time only moves with the frames. Fails when the board has run `secs` seconds (or, stopped, after `ms` of
// real time) without the step being done; never waits more than 6 minutes.
let curStep = 0; // a step counts as done when it is done, or when the lesson has already gone on past it (a done edit, run, … step goes on by itself after 0.9 s)
async function waitStep(secs, ms, what) {
  const t0 = Date.now(); let ran = 0, last = null;
  for (;;) {
    const s = await ev(() => ({ done: window.robo.state().done, step: window.robo.state().step, t: window.app.lab.mcu.t / 1e6, on: window.app.lab.mcu.state === 'running' })); if (s.done || s.step > curStep) return true;
    if (last !== null && s.t > last) ran += s.t - last; last = s.t; const wall = Date.now() - t0;
    if ((ran > secs && wall > 3000) || (!s.on && wall > ms) || wall > 360000) throw new Error(`timed out: ${what} (${ran.toFixed(1)} s on the board, ${Math.round(wall / 1000)} s real)`);
    await sleep(250);
  }
}
let shot = 0; const snap = async (n) => { if (SHOTS) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${n}.png` }); };

// ---------------------------------------------------------------- the page: mouse or finger
// the camera glides to a new view over a few frames, and the board turns over over a few more: aim only when both are still
const steady = () => waitFor(() => ev(() => !window.app.stage.goal && (!window.mb5 || !window.mb5.still || window.mb5.still())), 120000, 'the camera and the board to be still');
const nextFrame = () => ev(() => new Promise((ok, no) => { const f0 = window.app.stage.frames || 0, t0 = performance.now(); const tick = () => ((window.app.stage.frames || 0) > f0 ? ok() : performance.now() - t0 > 30000 ? no(new Error('timed out: a frame')) : setTimeout(tick, 4)); tick(); })); // the very next frame (waitFor polls only every 250 ms)
// let the board's own clock move on (a slow machine draws few frames; two shakes in the same board instant are one shake)
const boardWait = async (secs) => { const t0 = await ev(() => window.app.lab.mcu.t); await waitFor(() => ev(([t, s]) => window.app.lab.mcu.t - t > s * 1e6 || window.app.lab.mcu.state !== 'running', [t0, secs]), 90000, 'the board clock'); };
async function at(role, k = 0) { await steady(); const p = await ev(([r, k2]) => window.mb5 && window.mb5.screen(r, k2), [role, k]); if (!p) throw new Error('not on the desk: ' + role); return p; }
async function touch(type, x, y) { const cdp = await page.createCDPSession(); await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); await cdp.detach(); }
async function down(p) { if (PHONE) await touch('touchStart', p.x, p.y); else { await page.mouse.move(p.x, p.y); await page.mouse.down(); } }
async function moveTo(p) { if (PHONE) await touch('touchMove', p.x, p.y); else await page.mouse.move(p.x, p.y); }
async function up() { if (PHONE) await touch('touchEnd'); else await page.mouse.up(); }
async function tapRole(role, k = 0, hold = 120) { const p = await at(role, k); await down(p); await sleep(hold); await up(); await sleep(250); }
// a quick shake at a hand's own pace: 8 moves 45 ms apart, each carrying its time (the page reads the moves' own times, so a
// busy page that handles them late still sees a quick shake; one move at a time from here would be as slow as the page)
async function wave(p, n = 8, dx = 60, gap = 0.045) {
  const cdp = await page.createCDPSession(); const t0 = Date.now() / 1000 - n * gap; const sends = [];
  for (let i = 0; i < n; i++) { const x = p.x + (i % 2 ? -dx : dx), y = p.y, timestamp = t0 + i * gap; sends.push(PHONE ? cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }], timestamp }) : cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1, timestamp })); }
  await Promise.all(sends); await cdp.detach();
}
async function shakeBoard(k = 0) { const p = await at('mbbody', k); await down(p); await wave(p); await sleep(100); await moveTo(p); await sleep(60); await up(); await sleep(400); await boardWait(0.7); }
async function tiltBoard(dx, dy, ms = 1500) { const p = await at('mbbody'); await down(p); for (let i = 1; i <= 8; i++) { await moveTo({ x: p.x + dx * i / 8, y: p.y + dy * i / 8 }); await sleep(40); } await sleep(ms); await up(); await sleep(300); }
async function clip(a, bb) { await tapRole(a.startsWith('P') || a === '3V' || a === 'GND' ? 'mbpad:' + a : 'mbterm:' + a); await tapRole(bb.startsWith('P') || bb === '3V' || bb === 'GND' ? 'mbpad:' + bb : 'mbterm:' + bb); }
const settled = () => waitFor(() => ev(() => window.mb5.still()), 120000, 'the board to lie still'); // turning over takes frames, and a slow machine draws few
async function hud(id, v) { // the world panel's own controls
  if (v === undefined) { await page.click(`#w-ctl [data-id="${id}"] button`); await sleep(350); return; }
  await page.evaluate(([id2, v2]) => { const i = document.querySelector(`#w-ctl [data-id="${id2}"] input`); i.value = v2; i.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]); await sleep(300);
}
const ACT = {
  mbmeet: [() => tapRole('mbregion:mb_leds'), async () => { await tapRole('mbbtn:a'); await tapRole('mbbtn:b'); }, () => tapRole('mbbtn:logo'), () => tapRole('mbpad:P1'), () => hud('flip'),
    async () => { await settled(); for (const r of ['mb_cpu', 'mb_motion', 'mb_speaker']) await tapRole('mbregion:' + r); }, async () => { for (const r of ['mb_usb', 'mb_battery', 'mb_radio']) await tapRole('mbregion:' + r); }, () => hud('flip')],
  mbcount: [async () => { for (let i = 0; i < 3; i++) await tapRole('mbbtn:a', 0, 150); }, () => tapRole('mbbtn:b'), async () => { for (let i = 0; i < 3; i++) await tapRole('mbbtn:a', 0, 150); }],
  mbsteps: [() => tiltBoard(220, 0, 1600), async () => { for (let i = 0; i < 3; i++) await shakeBoard(); }, async () => { for (let i = 0; i < 4; i++) await shakeBoard(); }],
  mbtemp: [() => hud('temp', 40)],
  mbcompass: [() => hud('calib'), () => hud('heading', 90), () => hud('heading', 180), () => tapRole('mbbtn:a')],
  mbnight: [() => hud('light', 10), () => hud('light', 90), () => hud('light', 10)],
  mbrps: [() => shakeBoard(0), () => shakeBoard(1), async () => { for (let i = 0; i < 3; i++) { await shakeBoard(0); await shakeBoard(1); await sleep(1600); } }, async () => { await shakeBoard(0); await shakeBoard(1); }],
  mbplant: [() => clip('3V', 'soil.N1'), () => clip('P0', 'soil.N2'), () => clip('P1', 'led1.A'), () => clip('GND', 'led1.K'), () => tapRole('mbwater')],
  mbgate: [() => clip('P0', 'sv1.SIG'), () => clip('3V', 'sv1.VP'), () => clip('GND', 'sv1.GND'), () => tapRole('mbbtn:a'), () => tapRole('mbbtn:b'), () => tapRole('mbbtn:a')],
};

// ---------------------------------------------------------------- the headset: aim the right controller's ray, pull its trigger
async function aim(p, side = 'right') {
  await ev(([p2, s2]) => {
    const d = window.xrdev; const inp = d[window.__inp || 'controllers'][s2]; const eye = [0, 1.32, 0.12];
    const v = [p2[0] - eye[0], p2[1] - eye[1], p2[2] - eye[2]]; const L = Math.hypot(...v); inp.position.set(p2[0] - v[0] / L * 0.3, p2[1] - v[1] / L * 0.3, p2[2] - v[2] / L * 0.3);
    const f = [-v[0] / L, -v[1] / L, -v[2] / L]; const x = [f[2], 0, -f[0]]; const xl = Math.hypot(...x); x[0] /= xl; x[2] /= xl;
    const y = [f[1] * x[2] - f[2] * x[1], f[2] * x[0] - f[0] * x[2], f[0] * x[1] - f[1] * x[0]]; const m = [x, y, f]; const tr = m[0][0] + m[1][1] + m[2][2]; let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m[1][2] - m[2][1]) / s, (m[2][0] - m[0][2]) / s, (m[0][1] - m[1][0]) / s, 0.25 * s]; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [0.25 * s, (m[1][0] + m[0][1]) / s, (m[2][0] + m[0][2]) / s, (m[1][2] - m[2][1]) / s]; }
    else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[1][0] + m[0][1]) / s, 0.25 * s, (m[2][1] + m[1][2]) / s, (m[2][0] - m[0][2]) / s]; }
    else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[2][0] + m[0][2]) / s, (m[2][1] + m[1][2]) / s, 0.25 * s, (m[0][1] - m[1][0]) / s]; }
    inp.quaternion.set(...q);
  }, [p, side]); await sleep(150); await nextFrame();
}
const trigger = async (v) => { await ev((v2) => { const d = window.xrdev; if (window.__inp === 'hands') d.hands.right.updatePinchValue(v2); else d.controllers.right.updateButtonValue('trigger', v2); }, v); await sleep(160); await nextFrame(); await nextFrame(); }; // the headset sees it (frames can be slower than 160 ms)
const xrAt = async (role, k = 0) => { await steady(); const p = await ev(([r, k2]) => window.mb5 && window.mb5.world(r, k2), [role, k]); if (!p) throw new Error('not on the desk: ' + role); return p; };
async function xrTap(role, k = 0, hold = 150) { await aim(await xrAt(role, k)); await trigger(1); await sleep(hold); await trigger(0); await sleep(250); }
async function xrItem(id) { const p = await ev((i) => window.robo.xrItem(i), id); if (!p) throw new Error('no panel item ' + id); await aim(p); await trigger(1); await trigger(0); }
// the world panel's own controls in the headset: its tab, then a button, or − / + until a slider reaches v
async function xrWorld(id) { await xrItem('tab:robot'); await xrItem('w:' + id); await sleep(300); }
async function xrRange(id, v) { await xrItem('tab:robot'); let dir = 0; for (let k = 0; k < 40; k++) { const cur = await ev((i) => { const c = (window.app.world.hud().controls || []).find((q) => q.id === i); return c ? c.value : null; }, id); if (cur === null) throw new Error('no world control ' + id); if (!dir) dir = cur < v ? 1 : -1; if (dir > 0 ? cur >= v : cur <= v) return; await xrItem('w:' + id + (dir > 0 ? '+' : '-')); await sleep(200); } }
async function xrShake(k = 0) { // a quick wave: the hand to and fro 8 cm, a new place every frame (in the page: a round trip from here takes several frames)
  const p = await xrAt('mbbody', k); await aim(p); await trigger(1);
  await ev(() => new Promise((ok) => { const c = window.xrdev[window.__inp || 'controllers'].right; let i = 0, f0 = window.app.stage.frames || 0; const tick = () => { const f = window.app.stage.frames || 0; if (f > f0) { f0 = f; c.position.set(c.position.x + (i % 2 ? -0.08 : 0.08), c.position.y, c.position.z); if (++i >= 10) { ok(); return; } } setTimeout(tick, 4); }; tick(); }));
  await nextFrame(); await nextFrame(); await trigger(0); await sleep(400); await boardWait(0.7); }
async function xrTilt(deg) { const p = await xrAt('mbbody'); await aim(p); await trigger(1); for (let i = 1; i <= 6; i++) { await ev((a) => { const c = window.xrdev[window.__inp || 'controllers'].right; const q = c.quaternion; const h = a / 2 * Math.PI / 180; const r = [0, 0, Math.sin(h), Math.cos(h)]; const [x, y, z, w] = [q.x, q.y, q.z, q.w]; q.set(w * r[0] + x * r[3] + y * r[2] - z * r[1], w * r[1] - x * r[2] + y * r[3] + z * r[0], w * r[2] + x * r[1] - y * r[0] + z * r[3], w * r[3] - x * r[0] - y * r[1] - z * r[2]); }, -deg / 6); await sleep(80); await nextFrame(); } await sleep(1500); await trigger(0); await sleep(300); }
const XACT = {
  mbtemp: [() => xrRange('temp', 40)],
  mbcompass: [() => xrWorld('calib'), () => xrRange('heading', 90), () => xrRange('heading', 180), () => xrTap('mbbtn:a')],
  mbnight: [() => xrRange('light', 10), () => xrRange('light', 90), () => xrRange('light', 10)],
  mbcount: [async () => { for (let i = 0; i < 3; i++) await xrTap('mbbtn:a'); }, () => xrTap('mbbtn:b'), async () => { for (let i = 0; i < 3; i++) await xrTap('mbbtn:a'); }],
  mbsteps: [() => xrTilt(70), async () => { for (let i = 0; i < 3; i++) await xrShake(); }, async () => { for (let i = 0; i < 4; i++) await xrShake(); }],
  mbplant: [async () => { await xrTap('mbpad:3V'); await xrTap('mbterm:soil.N1'); }, async () => { await xrTap('mbpad:P0'); await xrTap('mbterm:soil.N2'); }, async () => { await xrTap('mbpad:P1'); await xrTap('mbterm:led1.A'); }, async () => { await xrTap('mbpad:GND'); await xrTap('mbterm:led1.K'); }, () => xrTap('mbwater')],
  mbgate: [async () => { await xrTap('mbpad:P0'); await xrTap('mbterm:sv1.SIG'); }, async () => { await xrTap('mbpad:3V'); await xrTap('mbterm:sv1.VP'); }, async () => { await xrTap('mbpad:GND'); await xrTap('mbterm:sv1.GND'); }, () => xrTap('mbbtn:a'), () => xrTap('mbbtn:b'), () => xrTap('mbbtn:a')],
  mbrps: [() => xrShake(0), () => xrShake(1), async () => { for (let i = 0; i < 3; i++) { await xrShake(0); await xrShake(1); await sleep(1600); } }, async () => { await xrShake(0); await xrShake(1); }],
  mbmeet: [() => xrTap('mbregion:mb_leds'), async () => { await xrTap('mbbtn:a'); await xrTap('mbbtn:b'); }, () => xrTap('mbbtn:logo'), () => xrTap('mbpad:P1'), async () => { await xrItem('go:robot'); await xrItem('w:flip'); }, async () => { await settled(); for (const r of ['mb_cpu', 'mb_motion', 'mb_speaker']) await xrTap('mbregion:' + r); }, async () => { for (const r of ['mb_usb', 'mb_battery', 'mb_radio']) await xrTap('mbregion:' + r); }, async () => { await xrItem('tab:robot'); await xrItem('w:flip'); }],
};

// ---------------------------------------------------------------- one lesson
async function nextIfNeeded(i) {
  const t0 = Date.now();
  while (Date.now() - t0 < 15000) {
    const s = await st(); if (s.step !== i || i === s.of - 1) return;
    if (Date.now() - t0 > 1500) { if (XR) await xrItem('next').catch(() => {}); else await page.click('#b-next').catch(() => {}); await sleep(300); }
    await sleep(250);
  }
}
async function pressRun() { if (XR) { await xrItem('run'); return; } if (PHONE) { await page.click('#b-code'); await sleep(300); } await page.click('#b-run'); if (PHONE) { await page.click('#b-side').catch(() => {}); await sleep(200); } }
if (XR) { await ev((m) => { window.__inp = m; window.xrdev.primaryInputMode = m === 'hands' ? 'hand' : 'controller'; }, INP); await ev(() => window.app.xr.supported().then((ok) => { document.getElementById('b-vr').hidden = !ok; })); await page.click('#b-vr'); await waitFor(() => ev(() => window.robo.xrState().presenting), 30000, 'enter VR'); }
const results = [];
for (const id of ids) {
  const t0 = Date.now(); let ok = false, why = '';
  try {
    if (XR) await ev((i) => window.app.openLesson(i), id);
    else { if (PHONE) { await page.click('#b-menu'); await sleep(250); } await page.click(`#strip [data-lesson="${id}"]`); }
    await sleep(800);
    await waitFor(() => ev(() => !!(window.app.world && window.app.world.ready && window.mb5)), 240000, 'the desk');
    if ((await st()).lesson !== id) throw new Error('lesson did not open');
    await ev(() => { window.app.speed = 2; const s = document.getElementById('s-speed'); if (s) s.value = '2'; }); // 2×
    await sleep(600); let acts = 0; const A = (XR ? XACT : ACT)[id] || [];
    for (let guard = 0; guard < 30; guard++) {
      const s = await st(); curStep = s.step; const step = await ev(() => { const q = window.robo.step(); return q && { k: q.k, set: q.set && q.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`);
      if (step.k === 'info') await nextIfNeeded(s.step);
      else if (step.k === 'run') { await pressRun(); await waitStep(10, 15000, 'run'); await nextIfNeeded(s.step); }
      else if (step.k === 'edit') {
        if (XR) { await xrItem('tab:code'); await xrItem('apply'); await xrItem('run'); await xrItem('tab:step'); }
        else {
          let src = await page.$eval('#editor textarea', (t) => t.value); for (const [re, fl, v] of step.set) src = src.replace(new RegExp(re, fl), v);
          if (PHONE) { await page.click('#b-code'); await sleep(300); }
          await page.$eval('#editor textarea', (t, v) => { t.value = v; t.dispatchEvent(new Event('input', { bubbles: true })); }, src); await page.click('#b-run'); if (PHONE) { await page.click('#b-side').catch(() => {}); }
        }
        await waitStep(10, 15000, 'edit'); await nextIfNeeded(s.step);
      } else if (step.k === 'check') { if (XR) await xrItem('check'); else await page.click('#b-check'); await sleep(400); if (!(await st()).done && !((await st()).step > curStep)) throw new Error('check failed: ' + await ev(() => window.app.checkMsg && window.app.checkMsg.text)); await nextIfNeeded(s.step); }
      else if (step.k === 'watch') { await waitStep(30, 60000, 'watch'); await nextIfNeeded(s.step); }
      else if (step.k === 'act') { const f = A[acts++]; if (f) await f(); await waitStep(30, 45000, 'act ' + acts); await nextIfNeeded(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 30000, 'lesson complete'); await snap(`${id}-complete`); ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); }
  await page.screenshot({ path: `${out}/${XR ? 'xr-' : PHONE ? 'phone-' : ''}${id}${ok ? '' : '-FAIL'}.png` });
  const info = await ev(() => ({ s: window.robo.state(), mb: window.mb5 && window.mb5.state(), build: window.app.world && window.app.world.buildMs })).catch(() => ({}));
  results.push({ id, ok, why, secs: Math.round((Date.now() - t0) / 1000), build: info.build, step: info.s && info.s.step, mb: info.mb });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(10) + ` ${Math.round((Date.now() - t0) / 1000)}s (desk built in ${info.build} ms)` + (ok ? '' : `  step ${info.s && info.s.step} · ${why} · ${JSON.stringify(info.mb && { shown: info.mb.shown, nums: info.mb.nums, texts: info.mb.texts, clips: info.mb.clips })}`));
}
const ctxLost = await ev(() => window.__ctxLost || 0).catch(() => -1); if (ctxLost) console.log(`note: the browser lost its WebGL context ${ctxLost} time(s) (software WebGL on a busy machine): pictures after that may be blank or untextured`);
fs.writeFileSync(`${out}/results${XR ? '-xr' : PHONE ? '-phone' : ''}.json`, JSON.stringify({ results, errors, ctxLost, size: [W, H], phone: PHONE, xr: XR }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
console.log(`${results.filter((r) => r.ok).length}/${results.length} micro:bit lessons complete${XR ? ' in XR' : PHONE ? ' on a phone' : ''}${errors.length ? ', ' + errors.length + ' page errors' : ', 0 page errors'}`);
await b.close(); process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
