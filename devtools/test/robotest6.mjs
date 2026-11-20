// DUET Robotics Lab 360, batch 6: plays every Raspberry Pi lesson end to end in the real page, as a student would. On the
// screen (mouse): taps the board's parts, drags parts from the drawer onto their ghosts and wires from the Pico's columns or
// the Pi's 40-pin header, presses Check, Run, edits the Python, holds the button, turns the knob, moves the sensor's
// sliders and the room light, waves at the PIR. With XR=1 the same in WebXR on an emulated Meta Quest 3 (IWER:
// science/test/iwer.module.js) with the controller's ray (HANDS=1: bare hands, pinch): the panel's Parts tab and the
// ghost, the ray from a header pin to a hole, the panel's Check / Run / apply-the-edit, and the panel's buttons for the
// part clicked last (knob − / +, cm − / +, light, °C, ✋ wave). Fails on a lesson that cannot be completed, or on any page
// error. Saves each lesson's last view (desktop: <id>-complete.png, XR: xr-<id>.jpg).
//   node devtools/test/robotest6.mjs [lesson,...|all] [outdir]
//   env: PORT (8811), XR=1, HANDS=1, SHOTS=1 (a picture per step), SLOW=n (a busy machine: every wait n times longer)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire('/root/tools/node_modules/'); const puppeteer = require('puppeteer-core');
const ALL = ['pico_blink', 'pico_led', 'pico_button', 'pico_fade', 'pico_pot', 'pico_servo', 'pico_sonar', 'pico_lamp', 'pi_led', 'pi_pir', 'pi_dht', 'pi_car'];
const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : ALL;
const XR = !!process.env.XR, INP = process.env.HANDS ? 'hands' : 'controllers', SHOTS = !!process.env.SHOTS, SLOW = +(process.env.SLOW || 1);
const out = process.argv[3] || `/tmp/claude-0/agent-pi/robotest6${XR ? '-xr' : ''}`; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8811; const W = XR ? 900 : 1280, H = XR ? 600 : 720;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', protocolTimeout: 600000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', `--window-size=${W},${H}`] });
const page = await b.newPage(); await page.setViewport({ width: W, height: H });
await page.evaluateOnNewDocument((xr) => {
  try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ }
  if (xr) document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'module'; s.textContent = "import { XRDevice, metaQuest3 } from '/science/test/iwer.module.js'; const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; window.xrdev = d;"; document.head.appendChild(s); });
}, XR);
await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
const t00 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'domcontentloaded', timeout: 240000 * SLOW });
await page.waitForFunction((xr) => document.title === 'READY' && (!xr || !!window.xrdev), { timeout: 300000 * SLOW }, XR);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let shot = 0; const snap = async (n) => { if (SHOTS) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${n}.png` }); };
async function waitFor(fn, ms, what) { ms *= SLOW; const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
let curStep = 0; // a step counts as done when it is done, or when the lesson has already gone on past it
const stepDone = (ms, what) => waitFor(async () => { const s = await st(); return s.done || s.step > curStep; }, ms, what);
const nextFrame = () => ev(() => new Promise((ok, no) => { const f0 = window.app.stage.frames || 0, t0 = performance.now(); const tick = () => ((window.app.stage.frames || 0) > f0 ? ok() : performance.now() - t0 > 30000 ? no(new Error('timed out: a frame')) : setTimeout(tick, 4)); tick(); }));
const boardWait = async (secs) => { const t0 = await ev(() => window.app.lab.mcu.t); await waitFor(() => ev(([t, s]) => window.app.lab.mcu.t - t > s * 1e6 || window.app.lab.mcu.state !== 'running', [t0, secs]), 120000, 'the board clock'); };

// ---------------------------------------------------------------- the screen: mouse
async function drag(a, p, steps = 16) { await page.mouse.move(a.x, a.y); await page.mouse.down(); await sleep(40); for (let i = 1; i <= steps; i++) { await page.mouse.move(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(12); } await sleep(100); await page.mouse.up(); }
async function tap(p) { await page.mouse.click(p.x, p.y); }
async function holdUntil(p, fn, ms = 8000) { await page.mouse.move(p.x, p.y); await page.mouse.down(); const t0 = Date.now(); await sleep(150); while (Date.now() - t0 < ms * SLOW && !(await fn())) await sleep(60); await page.mouse.up(); }
async function settle() { await waitFor(() => ev(() => window.robo.settled()), 90000, 'camera'); await sleep(250); }
async function selectPart(tag) {
  if (XR) { // the part's middle with the ray; a wire or a taller part in front took it: the hand over the part, pointing down
    const isSel = () => ev((t) => { const s2 = window.app.sel; return !!(s2 && s2.part && s2.part.tag === t); }, tag);
    for (const down of [false, true]) { const w = await ev((t) => window.robo.partWorld(t), tag); await aim(w, down); await trigger(1); await trigger(0); await sleep(300); if (await isSel()) return; }
    throw new Error('could not point at ' + tag);
  } await ev((t) => { const a = window.app; a.select({ part: a.lab.byTag(t) }); }, tag); await sleep(300); }
async function setRange(sel, v) { await ev(([s, v2]) => { const i = document.querySelector(s); i.value = String(v2); i.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]); await sleep(200); }
const light = (v) => ev((x) => { const r = document.querySelector('#r-light'); r.value = String(x); r.dispatchEvent(new Event('input', { bubbles: true })); }, v);

// ---------------------------------------------------------------- the headset: aim the right controller's ray, pull its trigger
// (down: the hand held over the point, pointing down at it, as a student reaches past a tall part in front of a hole)
async function aim(p, down) {
  await ev(([p2, dn]) => {
    const d = window.xrdev; const inp = d[window.__inp || 'controllers'].right; const eye = dn ? [p2[0], p2[1] + 0.25, p2[2] + 0.07] : [0, 1.32, 0.12];
    const v = [p2[0] - eye[0], p2[1] - eye[1], p2[2] - eye[2]]; const L = Math.hypot(...v); inp.position.set(p2[0] - v[0] / L * 0.3, p2[1] - v[1] / L * 0.3, p2[2] - v[2] / L * 0.3);
    const f = [-v[0] / L, -v[1] / L, -v[2] / L]; const x = [f[2], 0, -f[0]]; const xl = Math.hypot(...x); x[0] /= xl; x[2] /= xl;
    const y = [f[1] * x[2] - f[2] * x[1], f[2] * x[0] - f[0] * x[2], f[0] * x[1] - f[1] * x[0]]; const m = [x, y, f]; const tr = m[0][0] + m[1][1] + m[2][2]; let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m[1][2] - m[2][1]) / s, (m[2][0] - m[0][2]) / s, (m[0][1] - m[1][0]) / s, 0.25 * s]; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [0.25 * s, (m[1][0] + m[0][1]) / s, (m[2][0] + m[0][2]) / s, (m[1][2] - m[2][1]) / s]; }
    else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[1][0] + m[0][1]) / s, 0.25 * s, (m[2][1] + m[1][2]) / s, (m[2][0] - m[0][2]) / s]; }
    else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[2][0] + m[0][2]) / s, (m[2][1] + m[1][2]) / s, 0.25 * s, (m[0][1] - m[1][0]) / s]; }
    inp.quaternion.set(...q);
  }, [p, !!down]); await sleep(150); await nextFrame();
}
const trigger = async (v) => { await ev((v2) => { const d = window.xrdev; if (window.__inp === 'hands') d.hands.right.updatePinchValue(v2); else d.controllers.right.updateButtonValue('trigger', v2); }, v); await sleep(160); await nextFrame(); await nextFrame(); };
// the headset's head leaning in over the bench and looking at a point (for the picture of the lesson); unlook() puts it back
async function look(p) {
  await ev((p2) => { const d = window.xrdev; window.__head = [d.position.x, d.position.y, d.position.z]; d.position.set(p2[0], p2[1] + 0.30, p2[2] + 0.34); const e = [d.position.x, d.position.y, d.position.z]; const v = [p2[0] - e[0], p2[1] - e[1], p2[2] - e[2]]; const L = Math.hypot(...v);
    const yaw = Math.atan2(-v[0], -v[2]), pitch = Math.asin(v[1] / L); const cy = Math.cos(yaw / 2), sy = Math.sin(yaw / 2), cp = Math.cos(pitch / 2), sp = Math.sin(pitch / 2);
    d.quaternion.set(sp * cy, sy * cp, -sp * sy, cy * cp); }, p); // (yaw about y, then pitch about the turned x)
  await nextFrame(); await nextFrame();
}
async function xclick(p, hold = 0) { await aim(p); await trigger(1); if (hold) await sleep(hold); await trigger(0); }
async function xrItem(id) { const p = await ev((i) => window.robo.xrItem(i), id); if (!p) throw new Error('no panel item ' + id + ' (have ' + (await ev(() => window.robo.xrItems())).filter((q) => !q.startsWith('num')).slice(0, 40).join(' ') + ')'); await xclick(p); }
async function xrTapRegion(r) { // a part of the board, as a student points at it: its middle, or another point of it the ray reaches first
  const at = (fx, fz) => ev(([r2, x, z]) => { const a = window.app; const R = a.lab.def.regions.find((q) => q.id === r2); return window.robo.toWorld([a.lab.board.x + R.at[0] + x * R.hw, a.lab.def.pcbY + 1.6 + R.h * 0.8, a.lab.board.z + R.at[1] + z * R.hd]); }, [r, fx, fz]);
  for (const [fx, fz] of [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6], [0.8, 0.5]]) {
    await aim(await at(fx, fz)); const hit = await ev((r2) => [0, 1].map((i) => window.app.xr.ui.aim(i)).some((q) => q && q.hit && q.hit.kind === 'region' && q.hit.id === r2), r);
    if (hit) { await trigger(1); await trigger(0); return; }
  }
  await xclick(await at(0, 0));
}
const rayOn = (e) => ev((e2) => [0, 1].map((i) => window.app.xr.ui.aim(i)).some((q) => q && q.ep === e2), e); // does the ray point at this end (or does a part in front take it)?
async function xrDragEp(a, bb, down) {
  const pa0 = await ev((e) => window.robo.epWorld(e), a); await aim(pa0, down); if (!down && !(await rayOn(a))) { down = true; await aim(pa0, true); } // (a tall part in front: reach over it)
  await trigger(1); for (let k = 1; k <= 4; k++) { const pa = await ev((e) => window.robo.epWorld(e), a), pb = await ev((e) => window.robo.epWorld(e), bb); await aim(pa.map((x, j) => x + (pb[j] - x) * k / 4), down); } await sleep(200); await trigger(0); }

// ---------------------------------------------------------------- what the student does in an act step (screen / headset)
const tapRegion = async (r) => { if (XR) return xrTapRegion(r); await settle(); await tap(await ev((id) => window.robo4.regionScreen(id), r)); await sleep(300); };
async function pressButton(ms = 900) { // hold the push button down, then let go
  if (XR) { const p = await ev(() => window.robo.roleWorld('b1', 'cap')); await aim(p); await trigger(1); await sleep(ms); await boardWait(0.3); await trigger(0); await sleep(500); await boardWait(0.3); return; }
  await settle(); const p = await ev(() => window.robo.roleScreen('b1', 'cap')); await holdUntil(p, () => ev(() => window.app.rt.ledLit('led1')), ms * 6); await sleep(400); await boardWait(0.3);
}
async function knobTo(v) { // 0 or 1: the knob all the way down or up (screen: its card's slider; headset: the panel's − / +)
  await selectPart('pot1');
  if (XR) { for (let k = 0; k < 12; k++) { if (await ev((x) => Math.abs(window.app.lab.byTag('pot1').state.pos - x) < 0.01, v)) break; await xrItem(v > 0.5 ? 'k+' : 'k-'); } await boardWait(0.5); return; }
  await setRange('#co-pos', v * 100); await boardWait(0.5);
}
async function knobSweep() { if (XR) { await selectPart('pot1'); for (const id of ['k+', 'k+', 'k+', 'k+', 'k+', 'k+', 'k+', 'k+', 'k+', 'k+', 'k-', 'k-', 'k-']) { await xrItem(id); await boardWait(0.25); } return; } await selectPart('pot1'); for (const v of [10, 30, 50, 70, 90, 60, 20]) { await setRange('#co-pos', v); await boardWait(0.3); } }
async function distTo(cm) { await selectPart('us1'); if (XR) { for (let k = 0; k < 40; k++) { const d = await ev(() => window.app.lab.byTag('us1').state.dist); if (Math.abs(d - cm) < 4) break; await xrItem(d > cm ? 'd-' : 'd+'); } await boardWait(0.6); return; } await setRange('#co-dist', cm); await boardWait(0.6); }
async function lightTo(v) { // the room light, 0–1 (headset: the LDR's ☀ − / + on the panel)
  if (XR) { await selectPart('ldr1'); for (let k = 0; k < 10; k++) { const l = await ev(() => window.app.lab.env.light); if (Math.abs(l - v) < 0.08) break; await xrItem(l > v ? 'l-' : 'l+'); } await boardWait(0.8); return; }
  await light(Math.round(v * 100)); await boardWait(0.8);
}
async function wave() { await selectPart('pir1'); if (XR) await xrItem('wave6'); else await ev(() => document.querySelector('#co3-wave').click()); await boardWait(1.2); }
async function warmTo(c) { await selectPart('th1'); if (XR) { for (let k = 0; k < 12; k++) { if (await ev((x) => window.app.lab.env.temp >= x, c)) break; await xrItem('t+'); } } else await setRange('#co-temp', c); }
const ACT = {
  pico_button: [() => pressButton(), async () => { await pressButton(500); await sleep(600); await boardWait(0.4); await pressButton(500); }],
  pico_pot: [() => knobTo(1), () => knobTo(0), () => knobSweep()],
  pico_sonar: [() => distTo(10), () => distTo(80), () => distTo(12)],
  pico_lamp: [() => lightTo(0.2), () => lightTo(0.8), () => lightTo(0.45)],
  pi_led: [async () => { for (const r of ['q_soc', 'q_header', 'q_usbc']) await tapRegion(r); }, () => pressButton()],
  pi_pir: [async () => { await waitFor(() => ev(() => /Ready/.test(window.app.serText)), 60000, '"Ready"'); await wave(); }, async () => { await boardWait(6.5); await wave(); await boardWait(6.5); await wave(); }],
  pi_dht: [() => warmTo(40)],
};

if (XR) { await ev((m) => { window.__inp = m; window.xrdev.primaryInputMode = m === 'hands' ? 'hand' : 'controller'; }, INP); await ev(() => window.app.xr.supported().then((ok) => { document.getElementById('b-vr').hidden = !ok; })); await page.click('#b-vr'); await waitFor(() => ev(() => window.robo.xrState().presenting), 30000, 'enter VR'); }
const opened = Math.round((Date.now() - t00) / 1000);
const results = [];
for (const id of ids) {
  const t0 = Date.now(); let ok = false, why = '';
  try {
    if (XR) { await ev((i) => window.app.openLesson(i), id); await sleep(600); }
    else { await ev((i) => document.querySelector(`#strip [data-lesson="${i}"]`).click(), id); await sleep(900); }
    const s0 = await st(); if (s0.lesson !== id) throw new Error('lesson did not open');
    await waitFor(() => ev(() => !window.app.world || window.app.world.ready), 90000, 'world');
    if (XR) await ev(() => { window.app.speed = 2; }); else await ev(() => { const s = document.querySelector('#s-speed'); s.value = '2'; s.dispatchEvent(new Event('change')); });
    const b6 = await ev(() => ({ board: window.robo6.board(), mode: window.robo6.mode(), tab: window.robo6.serialTab() }));
    if (b6.mode !== 'py') throw new Error('the editor is not in Python: ' + JSON.stringify(b6));
    let acts = 0;
    for (let guard = 0; guard < 45; guard++) {
      const s = await st(); curStep = s.step; const step = await ev(() => { const q = window.robo.step(); return q && { k: q.k, region: q.region, place: q.place, wire: q.wire, set: q.set && q.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`);
      if (step.k === 'info') { /* read it */ }
      else if (step.k === 'tap') { await tapRegion(step.region); await stepDone(8000, 'tap ' + step.region); }
      else if (step.k === 'place') {
        if (XR) {
          await xrItem('tab:parts'); await xrItem('take:' + step.place.type);
          const p = await ev(([ty, at, rot]) => { const a = window.app; const [cx, cz] = window.robo._pins(ty, rot); if (at.hole) { const h = window.robo._hole(at.hole); return window.robo.toWorld([a.lab.bb.x + h.x + cx, 8.5, a.lab.bb.z + h.z + cz]); } return window.robo.toWorld([at.x + cx, 0, at.z + cz]); }, [step.place.type, step.place.at, step.place.rot]);
          await aim(p); await sleep(300); await trigger(1); await trigger(0); await stepDone(8000, 'place ' + step.place.tag); await xrItem('tab:step');
        } else {
          await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await settle();
          const card = await ev((t) => { const r = document.querySelector(`#plist .pc[data-type="${t}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 - 6 }; }, step.place.type);
          const to = await ev(([ty, at, rot]) => window.robo.dropFor(ty, at, rot), [step.place.type, step.place.at, step.place.rot]);
          await drag(card, to, 18); await stepDone(8000, 'place ' + step.place.tag);
        }
      } else if (step.k === 'wire') {
        const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w && (await st()).done) continue; if (!w) throw new Error('no ghost wire for ' + step.wire.join('→'));
        if (XR) await xrDragEp(w[0], w[1]);
        else { await settle(); await ev(() => document.querySelector('#bar [data-tool="wire"]').click()); const a = await ev((e) => window.robo.screen(e), w[0]), bb = await ev((e) => window.robo.screen(e), w[1]); await drag(a, bb, 16); }
        await stepDone(8000, 'wire ' + step.wire.join('→'));
        if (!XR) await ev(() => document.querySelector('#bar [data-tool="move"]').click());
      } else if (step.k === 'check') {
        if (XR) await xrItem('check'); else await ev(() => document.querySelector('#b-check').click());
        await sleep(400); const c = await st(); if (!c.done && !(c.step > curStep)) throw new Error('check failed: ' + (await ev(() => window.app.checkMsg && window.app.checkMsg.text)));
      } else if (step.k === 'run') { if (XR) await xrItem('run'); else await ev(() => document.querySelector('#b-run').click()); await stepDone(15000, 'run'); }
      else if (step.k === 'edit') {
        if (XR) { await xrItem('tab:code'); await xrItem('apply'); await xrItem('run'); await stepDone(15000, 'edit'); await xrItem('tab:step'); }
        else { await ev((set) => { const ta = document.querySelector('#editor textarea'); let src = ta.value; for (const [re, fl, v] of set) src = src.replace(new RegExp(re, fl), v); ta.value = src; ta.dispatchEvent(new Event('input', { bubbles: true })); window.app.editor.value = src; }, step.set); await ev(() => document.querySelector('#b-run').click()); await stepDone(15000, 'edit'); }
      } else if (step.k === 'watch') await stepDone(90000, 'watch');
      else if (step.k === 'act') { if (!XR) await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(60000, 'act ' + acts); }
      // on to the next step (the card goes on by itself after a done step; Next if it does not)
      const t1 = Date.now(); for (;;) { const q = await st(); if (q.step !== s.step || s.step === q.of - 1) break; if (Date.now() - t1 > 1800 * SLOW) { if (XR) await xrItem('next').catch(() => {}); else await ev(() => { const n = document.querySelector('#b-next'); if (!n.disabled) n.click(); }); } if (Date.now() - t1 > 20000 * SLOW) break; await sleep(300); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 120000, 'lesson complete');
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); }
  if (XR) { const at = await ev(() => { const a = window.app; const Ls = a.rt.lesson; const car = Ls && Ls.world && Ls.world.kind === 'car'; return window.robo.toWorld(car ? [-40, 0, 70] : a.lab.def.id === 'pi4' ? [-70, 0, -2] : [10, 0, 4]); }).catch(() => null); if (at) await look(at).catch(() => {});
    const u = await ev(() => window.robo.xrShot()).catch(() => null); await ev(() => { const d = window.xrdev; d.quaternion.set(0, 0, 0, 1); if (window.__head) d.position.set(...window.__head); }).catch(() => {}); await nextFrame().catch(() => {}); if (u) fs.writeFileSync(`${out}/xr-${id}${ok ? '' : '-FAIL'}.jpg`, Buffer.from(u.split(',')[1], 'base64')); }
  else await page.screenshot({ path: `${out}/${ok ? '' : 'FAIL-'}${id}-complete.png` }).catch(() => {});
  const s = await st().catch(() => ({})); const r6 = await ev(() => window.robo6.state()).catch(() => ({}));
  const calls = await ev(() => window.robo.calls()).catch(() => null);
  results.push({ id, ok, why, secs: Math.round((Date.now() - t0) / 1000), step: s.step, mcu: r6.mcu, err: r6.err, calls });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(12) + ` ${Math.round((Date.now() - t0) / 1000)}s` + (calls ? ` shaders ${calls.progs}` : '') + (ok ? '' : `  step ${s.step} · ${why}`));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, size: [W, H], xr: XR, input: INP, opened }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
const failed = results.filter((r) => !r.ok).length + (errors.length ? 1 : 0);
console.log(`${results.length - results.filter((r) => !r.ok).length}/${results.length} lessons complete${XR ? ' in XR (' + INP + ')' : ''}, ${errors.length} page errors (page ready in ${opened} s)`);
await b.close(); process.exit(failed ? 1 : 0);
