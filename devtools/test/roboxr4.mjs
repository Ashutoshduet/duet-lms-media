// DUET Robotics Lab 360, batch 4, in a headset: the new boards' lessons in WebXR on an emulated Meta Quest 3 (IWER), with
// the controllers' rays, as roboxr.mjs does for the others (this file is a copy of it with the new lessons' actions):
// the board box (swap the Uno for the Nano), the touch plate, the magnet (drag its lower half, press its top), and the
// phone on the bench (open BT Terminal, connect, send 1 and 0) are all used with the ray and the trigger.
//   node devtools/test/roboxr4.mjs [lesson,...|all] [outdir]      env: PORT (8809), HANDS=id, SLOW=n
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ALL4 = ['nano_meet', 'nano_traffic', 'mega_meet', 'mega_bar', 'esp_meet', 'esp_knob', 'esp_touch', 'esp_wifi', 'esp_iot', 'esp_bt', 'esp_hall'];
const ids = process.argv[2] === 'all' ? ALL4 : (process.argv[2] || 'esp_meet,esp_bt,esp_hall,nano_traffic').split(','); const out = process.argv[3] || '/tmp/claude-0/agent-robo4/xr4'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8809, HANDS = (process.env.HANDS || '').split(','), SLOW = +(process.env.SLOW || 1); // SLOW=n: a busy machine (waits ×n)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
await ctx.addInitScript(() => {
  try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ }
  document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'module'; s.textContent = "import { XRDevice, metaQuest3 } from '/science/test/iwer.module.js'; const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; d.position.set(0, 1.35, 0.15); d.quaternion.set(-0.3, 0, 0, 0.954); window.xrdev = d;"; document.head.appendChild(s); });
});
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'commit' });
await page.waitForFunction(() => document.title === 'READY' && !!window.xrdev, null, { timeout: 240000 });
const sleep = (ms) => page.waitForTimeout(ms); const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let hand = 'controller';
// point input `side` (right/left) at a world point: put it 0.3 m from the point towards the eye, and turn it so its ray hits
async function aim(p, side = 'right') {
  await ev(([p, side, hand]) => {
    const d = window.xrdev; const inp = hand === 'hand' ? d.hands[side] : d.controllers[side]; const eye = [0, 1.32, 0.12];
    const v = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]]; const L = Math.hypot(...v); const o = [p[0] - v[0] / L * 0.3, p[1] - v[1] / L * 0.3, p[2] - v[2] / L * 0.3];
    inp.position.set(...o);
    // the rotation that turns −z towards the point
    const f = [-v[0] / L, -v[1] / L, -v[2] / L]; const up = [0, 1, 0]; const x = [up[1] * f[2] - up[2] * f[1], up[2] * f[0] - up[0] * f[2], up[0] * f[1] - up[1] * f[0]]; const xl = Math.hypot(...x); x[0] /= xl; x[1] /= xl; x[2] /= xl;
    const y = [f[1] * x[2] - f[2] * x[1], f[2] * x[0] - f[0] * x[2], f[0] * x[1] - f[1] * x[0]]; const m = [x, y, f]; const tr = m[0][0] + m[1][1] + m[2][2]; let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m[1][2] - m[2][1]) / s, (m[2][0] - m[0][2]) / s, (m[0][1] - m[1][0]) / s, 0.25 * s]; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [0.25 * s, (m[1][0] + m[0][1]) / s, (m[2][0] + m[0][2]) / s, (m[1][2] - m[2][1]) / s]; }
    else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[1][0] + m[0][1]) / s, 0.25 * s, (m[2][1] + m[1][2]) / s, (m[2][0] - m[0][2]) / s]; }
    else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[2][0] + m[0][2]) / s, (m[2][1] + m[1][2]) / s, 0.25 * s, (m[0][1] - m[1][0]) / s]; }
    inp.quaternion.set(...q);
  }, [p, side, hand]);
  await frames(2);
}
async function frames(n) { const f0 = await ev(() => window.app.stage.frames || 0); const t0 = Date.now(); while (Date.now() - t0 < 8000) { await sleep(60); if ((await ev(() => window.app.stage.frames || 0)) >= f0 + n) return; } }
async function trigger(v, side = 'right') { await ev(([v, side, hand]) => { const d = window.xrdev; if (hand === 'hand') d.hands[side].updatePinchValue(v); else d.controllers[side].updateButtonValue('trigger', v); }, [v, side, hand]); await frames(2); }
async function click(p) { await aim(p); await trigger(1); await trigger(0); }
// a part of the board, as a student points at it: its middle, or (when something taller is in front of it from where the
// student stands, as the Nano's chip before its back row of pins) another point of it that the ray reaches first
async function tapRegion(r) {
  const at = (fx, fz) => ev(([r2, x, z]) => { const a = window.app; const R = a.lab.def.regions.find((q) => q.id === r2); return window.robo.toWorld([a.lab.board.x + R.at[0] + x * R.hw, a.lab.def.pcbY + 1.6 + R.h * 0.8, a.lab.board.z + R.at[1] + z * R.hd]); }, [r, fx, fz]);
  for (const [fx, fz] of [[0, 0], [0.6, 0], [-0.6, 0], [0.8, 0.5], [-0.8, 0.5], [0, 0.6]]) {
    await aim(await at(fx, fz)); const id = await ev((r2) => [0, 1].map((i) => window.app.xr.ui.aim(i)).some((q) => q && q.hit && q.hit.kind === 'region' && q.hit.id === r2) ? r2 : null, r);
    if (id === r) { await trigger(1); await trigger(0); return; }
  }
  await click(await at(0, 0));
}
async function pressItem(id) { const p = await ev((id) => window.robo.xrItem(id), id); if (!p) throw new Error('no panel item ' + id + ' (have ' + (await ev(() => window.robo.xrItems())).slice(0, 40).join(' ') + ')'); await click(p); }
async function dragEp(a, bb) { await aim(await ev((e) => window.robo.epWorld(e), a)); if (process.env.DEBUG) console.log('aim', a, JSON.stringify(await ev(() => { const ui = window.app.xr.ui; return (ui.aimCache || []).map((x) => x && { kind: x.kind, ep: x.ep, hit: x.hit && x.hit.kind }); }))); await trigger(1); if (process.env.DEBUG) console.log('drag', JSON.stringify(await ev(() => window.robo.xrState()))); for (let k = 1; k <= 4; k++) { const pa = await ev((e) => window.robo.epWorld(e), a), pb = await ev((e) => window.robo.epWorld(e), bb); await aim(pa.map((x, j) => x + (pb[j] - x) * k / 4)); } await sleep(200); await trigger(0); }
async function waitFor(fn, ms, what) { ms *= SLOW; const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(300); } throw new Error('timed out: ' + what); }
let curStep = 0; // a step counts as done when it is done, or when the lesson has already moved on past it (it goes on by itself)
const stepDone = (ms, what) => waitFor(async () => { const s = await st(); return s.done || s.step > curStep; }, ms, what);
async function next(i) { const t0 = Date.now(); while (Date.now() - t0 < 12000) { const s = await st(); if (s.step !== i || i === s.of - 1) return; if (Date.now() - t0 > 1800) await pressItem('next').catch(() => {}); await sleep(400); } }
async function selectPart(tag) { const w = await ev((t) => window.robo.partWorld(t), tag); await click(w); await sleep(300); }
const stick = (dx, dz) => async () => { const p = await ev(() => window.robo.roleWorld('js', 'stick')); await aim(p); await trigger(1); for (let k = 1; k <= 6; k++) await aim([p[0] + 0.009 * k * dx, p[1], p[2] + 0.009 * k * dz]); await sleep(3400); await trigger(0); await sleep(400); };
const phoneTap = async (id) => { await waitFor(async () => !!(await ev((i) => window.robo4.phoneWorld(i), id)), 8000, 'phone item ' + id); await click(await ev((i) => window.robo4.phoneWorld(i), id)); await sleep(300); };
const boxWorld = (id) => ev((id) => window.robo4.boxWorld(id), id);
async function xrOpenPage() {
  await waitFor(async () => !!(await ev(() => window.robo4.net().ip)), 60000, 'the ESP32 on the WiFi'); const ip = await ev(() => window.robo4.net().ip);
  if ((await ev(() => window.robo4.phone().app)) !== 'browser') { await phoneTap('home'); await phoneTap('app:browser'); }
  await phoneTap('addr'); for (let i = 0; i < 24 && (await ev(() => window.robo4.phone().kbText)); i++) await phoneTap('key:⌫');
  for (const ch of ip) await phoneTap('key:' + ch); await phoneTap('key:Go');
  await waitFor(async () => { const p = await ev(() => window.robo4.phone()); return !!(p.page && p.page.code === 200); }, 12000, 'the page on the phone');
}
const ACT = {
  // batch 4: the board box, the touch plate, the magnet, the phone (with the ray)
  nano_traffic: [async () => { await click(await boxWorld('nano')); }],
  // the knob with the ray: click the part, then its − / + on the panel until the step is done
  mega_bar: [async () => { await selectPart('pot1'); for (let k = 0; k < 14 && !(await st()).done; k++) await pressItem('k+'); }, async () => { await selectPart('pot1'); for (let k = 0; k < 14 && !(await st()).done; k++) await pressItem('k-'); }],
  esp_knob: [async () => { await selectPart('pot1'); for (let k = 0; k < 14 && !(await st()).done; k++) await pressItem('k+'); }, async () => { await selectPart('pot1'); for (let k = 0; k < 14 && !(await st()).done; k++) await pressItem('k-'); }],
  // the phone's browser with the ray: its address bar, the ESP32's address typed on its keys, Go, then the page's links
  esp_wifi: [async () => { await xrOpenPage(); }, async () => { await phoneTap('link:/on'); }, async () => { await waitFor(async () => (await ev(() => window.robo4.phone().page && window.robo4.phone().page.links.length)), 8000, 'page'); await phoneTap('link:/off'); }],
  esp_iot: [async () => { await xrOpenPage(); }, async () => { await selectPart('t1'); for (let k = 0; k < 12 && !(await st()).done; k++) await pressItem('t+'); }],
  esp_touch: [async () => { const p = await ev(() => window.robo.roleWorld('pad1', 'cap')); await aim(p); await trigger(1); await sleep(400); await trigger(0); }, async () => { await sleep(600); const p = await ev(() => window.robo.roleWorld('pad1', 'cap')); await aim(p); await trigger(1); await sleep(400); await trigger(0); }],
  esp_bt: [async () => { await phoneTap('home'); await phoneTap('app:bt'); await phoneTap('bt:dev:DUET-ESP32'); }, async () => { await phoneTap('bt:send:1'); }, async () => { await phoneTap('bt:send:0'); }],
  esp_hall: [async () => { const p = await ev(() => window.robo4.roleCenterWorld('mag1', 'knob')); /* the middle of the lower half: its top edge meets the upper half */ await aim(p); await trigger(1); for (let k = 1; k <= 10; k++) { await aim([p[0] + 0.007 * k, p[1], p[2] - 0.007 * k]); } await trigger(0); },
    async () => { const p = await ev(() => window.robo.roleWorld('mag1', 'cap')); await aim(p); await trigger(1); await sleep(200); await trigger(0); }],
  arm5: [stick(1, 0), stick(0, -1)], // push the joystick with the ray and hold it: right, then up (away from you)
  // the old lessons' actions, with the ray and the panel's controls for the clicked part
  button: [async () => { const p = await ev(() => window.robo.roleWorld('b1', 'cap')); await aim(p); await trigger(1); await sleep(1600); await trigger(0); await sleep(800); }, async () => { await sleep(600); }],
  knob: [async () => { await selectPart('pot1'); for (let k = 0; k < 7; k++) await pressItem('k-'); }, async () => { for (let k = 0; k < 12; k++) await pressItem('k+'); }],
  servoknob: [async () => { await selectPart('pot1'); for (let k = 0; k < 7; k++) await pressItem('k-'); }, async () => { for (let k = 0; k < 12; k++) await pressItem('k+'); }],
  parking: [async () => { await selectPart('us1'); for (let k = 0; k < 6; k++) await pressItem('d+'); await sleep(2500); for (let k = 0; k < 14; k++) await pressItem('d-'); await sleep(2500); }],
  night: [async () => { await selectPart('ldr1'); for (let k = 0; k < 6; k++) await pressItem('l-'); }, async () => { for (let k = 0; k < 6; k++) await pressItem('l+'); }],
  ledres: [async () => { await selectPart('r1'); for (let k = 0; k < 4 && !(await st()).done; k++) await pressItem('r+'); }],
};

await ev(() => window.app.xr.supported().then((ok) => { document.getElementById('b-vr').hidden = !ok; }));
await page.click('#b-vr', { timeout: 20000 }).catch(() => ev(() => window.app.xr.enter())); await waitFor(() => ev(() => window.robo.xrState().presenting), 20000, 'enter VR');
const results = [];
for (const id of ids) {
  hand = HANDS.includes(id) ? 'hand' : 'controller';
  await ev((m) => { window.xrdev.primaryInputMode = m; }, hand); await sleep(400);
  const t0 = Date.now(); let ok = false, why = '';
  try {
    await ev((id) => window.app.openLesson(id), id); await sleep(600);
    await waitFor(() => ev(() => !window.app.world || window.app.world.ready), 60000, 'world');
    await ev(() => window.app.speed = 2);
    let acts = 0;
    for (let guard = 0; guard < 45; guard++) {
      const s = await st(); curStep = s.step; const step = await ev(() => { const s = window.robo.step(); return s && { k: s.k, region: s.region, place: s.place, wire: s.wire }; });
      if (step.k === 'info') await next(s.step);
      else if (step.k === 'tap') { await tapRegion(step.region); await stepDone(5000, 'tap'); await next(s.step); }
      else if (step.k === 'place') {
        await pressItem('tab:parts'); await pressItem('take:' + step.place.type);
        const p = await ev(([ty, at, rot]) => { const a = window.app; const [cx, cz] = window.robo._pins(ty, rot); if (at.hole) { const h = window.robo._hole(at.hole); return window.robo.toWorld([a.lab.bb.x + h.x + cx, 8.5, a.lab.bb.z + h.z + cz]); } return window.robo.toWorld([at.x + cx, 0, at.z + cz]); }, [step.place.type, step.place.at, step.place.rot]);
        await aim(p); await sleep(300); await trigger(1); await trigger(0); await stepDone(5000, 'place ' + step.place.tag); await pressItem('tab:step'); await next(s.step);
      } else if (step.k === 'wire') { const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w) throw new Error('no ghost wire'); await dragEp(w[0], w[1]); await stepDone(5000, 'wire ' + step.wire.join('→')); await next(s.step); }
      else if (step.k === 'check') { await pressItem('check'); await sleep(300); const c = await st(); if (!c.done && !(c.step > curStep)) throw new Error('check failed: ' + (await ev(() => window.app.checkMsg && window.app.checkMsg.text))); await next(s.step); }
      else if (step.k === 'run') { await pressItem('run'); await stepDone(8000, 'run'); await next(s.step); }
      else if (step.k === 'edit') { await pressItem('tab:code'); if (process.env.DEBUG) console.log('items', (await ev(() => window.robo.xrItems())).filter((x) => !x.startsWith('num')).join(' ')); await pressItem('apply'); if (process.env.DEBUG) console.log('after apply', JSON.stringify(await ev(() => ({ code: window.app.code().match(/base\.write\(\d+\)/g), step: window.robo.state() })))); await pressItem('run'); await stepDone(8000, 'edit'); await pressItem('tab:step'); await next(s.step); }
      else if (step.k === 'watch') { await stepDone(60000, 'watch'); await next(s.step); }
      else if (step.k === 'act') { const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(30000, 'act'); await next(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 30000, 'lesson complete'); ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); if (process.env.DEBUG) console.log('wires', JSON.stringify(await ev(() => window.app.lab.wires.map((w) => [w.a, w.b])))); }
  { const u = await ev(() => window.robo.xrShot()).catch(() => null); if (u) fs.writeFileSync(`${out}/xr-${id}${ok ? '' : '-FAIL'}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
  const info = await ev(() => ({ x: window.robo.xrState(), c: window.robo.calls() }));
  results.push({ id, ok, why, hand, secs: Math.round((Date.now() - t0) / 1000), calls: info.c });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(10) + ` ${hand} ${Math.round((Date.now() - t0) / 1000)}s calls ${info.c.calls}` + (ok ? '' : '  · ' + why));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
console.log(`${results.filter((r) => r.ok).length}/${results.length} lessons complete in XR${errors.length ? ', ' + errors.length + ' page errors' : ''}`);
await b.close(); process.exit(results.every((r) => r.ok) && !errors.length ? 0 : 1);
