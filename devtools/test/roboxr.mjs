// DUET Robotics Lab 360 in a headset: plays lessons end to end in WebXR on an emulated Meta Quest 3 (IWER, the
// Immersive Web Emulation Runtime: science/test/iwer.module.js), as a student would with the controllers' rays:
// parts are taken from the headset's panel and put down with the trigger, wires are pulled from end point to end point,
// Check / Run / Next and the code's numbers are pressed on the panel, a joystick is pushed with the ray. One lesson can
// be played with bare hands (pinch) instead: HANDS=lessonid. Fails on a lesson that cannot be completed, or a page error.
//   node devtools/test/roboxr.mjs [lesson,...|all] [outdir]      env: PORT (8807), HANDS=id, QUEST=1 (the Quest browser's UA), SLOW=n
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
let ids = (process.argv[2] || 'arm1,ledres').split(','); const ALL = ids[0] === 'all'; if (ALL) ids = ['meet']; // all: every lesson but the new boards' (roboxr4.mjs) and the micro:bit's (robotest5.mjs XR=1)
const out = process.argv[3] || '/tmp/roboxr'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8807, HANDS = (process.env.HANDS || '').split(','), SLOW = +(process.env.SLOW || 1); // SLOW=n: a busy machine (waits ×n)
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const QUEST_UA = 'Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/35.2 Chrome/126.0 VR Safari/537.36';
const ctx = await b.newContext(process.env.QUEST ? { viewport: { width: 900, height: 600 }, userAgent: QUEST_UA } : { viewport: { width: 900, height: 600 } }); // QUEST=1: the Quest browser's settings (light materials, no shadows)
await ctx.addInitScript(() => {
  try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ }
  document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'module'; s.textContent = "import { XRDevice, metaQuest3 } from '/science/test/iwer.module.js'; const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; d.position.set(0, 1.35, 0.15); d.quaternion.set(-0.3, 0, 0, 0.954); window.xrdev = d;"; document.head.appendChild(s); });
});
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
const page = await ctx.newPage(); page.setDefaultTimeout(30000 * SLOW); const errors = [];
page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'commit' });
await page.waitForFunction(() => document.title === 'READY' && !!window.xrdev, null, { timeout: 240000 * SLOW });
const sleep = (ms) => page.waitForTimeout(ms); const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let hand = 'controller';
// point input `side` (right/left) at a world point: put it 0.3 m from the point towards the eye, and turn it so its ray hits
const EYE0 = [0, 1.32, 0.12]; let EYE = EYE0; // where the student's head is (dragEp leans over the bench when an end is hidden)
async function aim(p, side = 'right') {
  await ev(([p, side, hand, eye]) => {
    const d = window.xrdev; const inp = hand === 'hand' ? d.hands[side] : d.controllers[side];
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
  }, [p, side, hand, EYE]);
  await frames(2);
}
async function frames(n) { const f0 = await ev(() => window.app.stage.frames || 0); const t0 = Date.now(); while (Date.now() - t0 < 8000 * SLOW) { await sleep(60); if ((await ev(() => window.app.stage.frames || 0)) >= f0 + n) return; } }
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
const aimsAt = (e) => ev((e2) => [0, 1].some((i) => { const q = window.app.xr.ui.aim(i); return !!q && q.ep === e2; }), e);
async function dragEp(a, bb) {
  const pa0 = await ev((e) => window.robo.epWorld(e), a); EYE = EYE0; await aim(pa0);
  if (!(await aimsAt(a))) { EYE = [pa0[0], pa0[1] + 0.42, pa0[2] + 0.2]; await aim(pa0); } // hidden from where the student stands (a module in front of it): lean over the bench
  try { await dragEp1(a, bb); } finally { EYE = EYE0; }
}
async function dragEp1(a, bb) { if (process.env.DEBUG) console.log('aim', a, JSON.stringify(await ev(() => { const ui = window.app.xr.ui; return (ui.aimCache || []).map((x) => x && { kind: x.kind, ep: x.ep, hit: x.hit && x.hit.kind }); }))); await trigger(1); if (process.env.DEBUG) console.log('drag', JSON.stringify(await ev(() => window.robo.xrState()))); for (let k = 1; k <= 4; k++) { const pa = await ev((e) => window.robo.epWorld(e), a), pb = await ev((e) => window.robo.epWorld(e), bb); await aim(pa.map((x, j) => x + (pb[j] - x) * k / 4)); } await sleep(200); await trigger(0); }
async function waitFor(fn, ms, what) { ms *= SLOW; const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(300); } throw new Error('timed out: ' + what); }
let curStep = 0; // a step counts as done when it is done, or when the lesson has already moved on past it (it goes on by itself)
const stepDone = (ms, what) => waitFor(async () => { const s = await st(); return s.done || s.step > curStep; }, ms, what);
async function next(i) { const t0 = Date.now(); while (Date.now() - t0 < 12000) { const s = await st(); if (s.step !== i || i === s.of - 1) return; if (Date.now() - t0 > 1800) await pressItem('next').catch(() => {}); await sleep(400); } }
async function selectPart(tag, role) {
  const w = role ? await ev(([t, r]) => { const a = window.app; const p = a.lab.byTag(t); const e = p && a.view.parts.get(p.uid); let o = null; if (e) e.obj.traverse((q) => { if (!o && q.userData.role === r && q.geometry) o = q; }); if (!o) return null; o.geometry.computeBoundingBox(); const c = o.geometry.boundingBox.getCenter(o.position.clone()); c.y = o.geometry.boundingBox.max.y; o.updateMatrixWorld(); return c.applyMatrix4(o.matrixWorld).toArray(); }, [tag, role]) : null;
  await click(w || await ev((t) => window.robo.partWorld(t), tag)); await sleep(300);
}
// hold a panel button (the phone pad's keys) with the trigger until the page says so
async function holdItem(id, cond, ms = 15000) { const p = await ev((id) => window.robo.xrItem(id), id); if (!p) throw new Error('no panel item ' + id); await aim(p); await trigger(1); const t0 = Date.now(); while (Date.now() - t0 < ms && !(await ev(cond))) await sleep(60); await trigger(0); await sleep(300); }
// drive the Bluetooth car through a plan of letters, checked every 10 ms of simulated time inside the page (a test on a
// busy machine reacts too late to stop the car in P from outside it)
const parkPlan = () => ev(() => new Promise((res) => { const W = window.app.world; const u0 = W.update.bind(W); const P = [['F', (S) => S.x > 360], ['L', (S) => S.h > Math.PI - 0.1], ['F', (S) => S.z < 50]]; let i = 0, sent = null, t = 0;
  W.update = (dt) => { const r = u0(dt); t += dt; if (i >= P.length || t > 60) { W.update = u0; W.control('key', 'S'); res(i); return r; } const [k, c] = P[i]; if (c(W.sim)) { W.control('key', 'S'); i++; sent = null; } else if (sent !== k) { W.control('key', k); sent = k; } return r; }; }));
const robotTab = () => pressItem('tab:robot');
const stick = (dx, dz) => async () => { const p = await ev(() => window.robo.roleWorld('js', 'stick')); await aim(p); await trigger(1); for (let k = 1; k <= 6; k++) await aim([p[0] + 0.009 * k * dx, p[1], p[2] + 0.009 * k * dz]); await sleep(3400); await trigger(0); await sleep(400); };
// the middle (top) of a thing beside the bench that the ray can press: a 3D remote's button, the RFID card
const worldRoleW = (role) => ev((role) => { const w = window.app.world; const o = w && (w.picks || []).find((q) => q.userData.role === role); if (!o) return null; o.updateMatrixWorld(true); const g = o.geometry; g.computeBoundingBox(); const c = g.boundingBox.min.clone().add(g.boundingBox.max).multiplyScalar(0.5); c.y = g.boundingBox.max.y; return c.applyMatrix4(o.matrixWorld).toArray(); }, role);
const rayPress = async (p, ms = 250) => { await aim(p); await trigger(1); await sleep(ms); await trigger(0); await sleep(300); };
const holdCap = async (tag, ms) => { const p = await ev((t) => window.robo.roleWorld(t, 'cap'), tag); await aim(p); await trigger(1); await sleep(ms); await trigger(0); await sleep(300); };
// a world control's − / + pressed until its value reaches v (the panel's Robot tab)
async function wRangeTo(id, v) { await robotTab(); let dir = 0; for (let k = 0; k < 40; k++) { const cur = await ev((id) => { const c = (window.app.world.hud().controls || []).find((q) => q.id === id); return c ? c.value : null; }, id); if (cur === null) throw new Error('no world control ' + id); if (!dir) dir = cur < v ? 1 : -1; if (cur === v || (dir > 0 ? cur >= v : cur <= v)) return; await pressItem('w:' + id + (dir > 0 ? '+' : '-')); } }
// the joystick pushed with the ray by (dx, dz) metres and held there until the step is done (the pan-tilt laser on a target)
const stickUntil = (dx, dz) => async () => { const p = await ev(() => window.robo.roleWorld('js', 'stick')); await aim(p); await trigger(1); for (let k = 1; k <= 6; k++) await aim([p[0] + dx * k / 6, p[1], p[2] + dz * k / 6]); const t0 = Date.now(); while (Date.now() - t0 < 30000 * SLOW && !(await st()).done) await sleep(300); await trigger(0); await sleep(400); };
const pressUntilDone = async (id, n = 24) => { for (let k = 0; k < n && !(await st()).done; k++) await pressItem(id); };
const ACT = {
  arm5: [stick(1, 0), stick(0, -1)], // push the joystick with the ray and hold it: right, then up (away from you)
  // the old lessons' actions, with the ray and the panel's controls for the clicked part
  button: [async () => { const p = await ev(() => window.robo.roleWorld('b1', 'cap')); await aim(p); await trigger(1); await sleep(1600); await trigger(0); await sleep(800); }, async () => { await sleep(600); }],
  knob: [async () => { await selectPart('pot1'); for (let k = 0; k < 7; k++) await pressItem('k-'); }, async () => { for (let k = 0; k < 12; k++) await pressItem('k+'); }],
  servoknob: [async () => { await selectPart('pot1'); for (let k = 0; k < 7; k++) await pressItem('k-'); }, async () => { for (let k = 0; k < 12; k++) await pressItem('k+'); }],
  parking: [async () => { await selectPart('us1'); for (let k = 0; k < 6; k++) await pressItem('d+'); await sleep(2500); for (let k = 0; k < 14; k++) await pressItem('d-'); await sleep(2500); }],
  night: [async () => { await selectPart('ldr1'); for (let k = 0; k < 6; k++) await pressItem('l-'); }, async () => { for (let k = 0; k < 6; k++) await pressItem('l+'); }],
  // batch 2, drop 2: the robot's own controls, on the headset panel's Robot tab
  smartbin: [async () => { await robotTab(); await pressItem('w:wave'); await sleep(4000); }, async () => { await robotTab(); await pressItem('w:wave'); }],
  btcar: [async () => { await robotTab(); await pressItem('w:pair'); },
    async () => { await robotTab(); await holdItem('key:F', () => window.app.world.sim.odo > 250, 8000); await holdItem('key:L', () => window.app.world.sim.flags.has('left'), 6000); },
    async () => { await robotTab(); await sleep(500); await parkPlan(); }],
  hydarm: [async () => { // first with the ray on the plunger itself (push it in: towards −x), then the panel if it is not up yet
    const p = await ev(() => { const pl = window.app.world.ms.userData.pl; const m = pl.children[0]; m.geometry.computeBoundingBox(); const c = m.geometry.boundingBox.max.clone(); m.updateMatrixWorld(); return c.applyMatrix4(m.matrixWorld).toArray(); });
    await aim(p); await trigger(1); for (let k = 1; k <= 8; k++) await aim([p[0] - 0.007 * k, p[1], p[2]]); await sleep(300); await trigger(0);
    console.log('  hydarm: the ray pushed the plunger to', await ev(() => Math.round(window.app.world.sim.push * 100)) + '%');
    await robotTab(); for (let k = 0; k < 20 && !(await st()).done; k++) await pressItem('w:push+'); },
    async () => { await robotTab(); await pressItem('w:master:5'); await pressItem('w:slave:20'); for (let k = 0; k < 20 && !(await st()).done; k++) await pressItem('w:push+'); },
    async () => { await robotTab(); await pressItem('w:master:20'); await pressItem('w:slave:5'); for (let k = 0; k < 20 && !(await st()).done; k++) await pressItem('w:push+'); },
    async () => { await robotTab(); await pressItem('w:master:10'); await pressItem('w:slave:10'); await pressItem('w:fluid:air'); for (let k = 0; k < 20 && !(await st()).done; k++) await pressItem('w:push+'); }],
  ledres: [async () => { await selectPart('r1', 'body'); for (let k = 0; k < 4 && !(await st()).done; k++) await pressItem('r+'); }],
  piano: [async () => { for (let round = 0; round < 3 && !(await st()).done; round++) for (const k of ['k1', 'k2', 'k3']) await holdCap(k, 1300); }],
  iralarm: [async () => { await selectPart('ir1'); await pressUntilDone('d-', 20); }, async () => { await selectPart('ir1'); await pressUntilDone('d+', 20); }],
  temp: [async () => { await selectPart('t1'); await pressUntilDone('t+', 20); }],
  // batch 3: the scene's controls on the panel's Robot tab, and the ray on the 3D remote, keypad and card
  lcdtemp: [async () => { await robotTab(); await pressItem('w:chai:1'); }],
  irrigate: [async () => { await robotTab(); await pressItem('w:dry'); }, async () => { await robotTab(); await pressItem('w:dry'); }],
  homeauto: [async () => { await rayPress(await worldRoleW('rc3:1')); }, async () => { await robotTab(); await pressItem('w:rc0:2'); }, async () => { await robotTab(); await pressItem('w:rc0:1'); }, async () => { await sleep(400); await rayPress(await worldRoleW('rc3:3')); }],
  burglar: [async () => { await sleep(2500); await robotTab(); await pressItem('w:walk'); }, async () => { await sleep(2500); await robotTab(); await pressItem('w:cat'); }],
  rfidlock: [async () => { await sleep(800); await robotTab(); await pressItem('w:card'); }, async () => { await sleep(800); const p = await worldRoleW('card3:card'); if (p) await rayPress(p); else { await robotTab(); await pressItem('w:card'); } }, async () => { await sleep(800); await robotTab(); await pressItem('w:tag'); }],
  weather: [async () => { await robotTab(); await pressItem('w:sky:rainy'); }],
  keylock: [async () => { await robotTab(); for (const [r, k] of [[0, '1'], [0, '1'], [0, '1'], [0, '1'], [3, '#']]) { await pressItem(`w:kp${r}:${k}`); await sleep(250); } },
    async () => { const K = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D']; for (const k of ['1', '2', '3', '4', '#']) { await rayPress(await ev((i) => window.robo.roleWorld('kp', 'key3:' + i), K.indexOf(k)), 200); } },
    async () => { await robotTab(); for (const [r, k] of [[0, '2'], [1, '5'], [2, '8'], [3, '0'], [3, '#']]) { await pressItem(`w:kp${r}:${k}`); await sleep(250); } }],
  gasalarm: [async () => { await wRangeTo('leak', 30); }, async () => { await wRangeTo('leak', 0); await pressItem('w:win:1'); }, async () => { await robotTab(); await pressItem('w:win:0'); await wRangeTo('leak', 30); }],
  pantilt: [stickUntil(-0.0172, 0.018), stickUntil(0.0172, -0.0162), stickUntil(0.0172, 0.0162)],
};

await ev(() => window.app.xr.supported().then((ok) => { document.getElementById('b-vr').hidden = !ok; }));
await page.click('#b-vr', { timeout: 20000 }).catch(() => ev(() => window.app.xr.enter())); await waitFor(() => ev(() => window.robo.xrState().presenting), 20000, 'enter VR');
const results = [];
if (ALL) ids = await ev(() => import('./js/lessons.js').then((m) => m.LESSONS.filter((l) => l.group !== 'boards' && l.group !== 'microbit').map((l) => l.id)));
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
