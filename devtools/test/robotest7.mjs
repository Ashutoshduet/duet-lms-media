// DUET Robotics Lab 360, batch 7: plays every new Arduino project end to end in the real page, as a student would, with
// the mouse: drags parts from the drawer onto their ghosts, draws each wire from hole to hole (or pin / terminal), presses
// Check and Run, types the edits into the code, and does each act step on the bench: holds a push button, slides the room
// light, the temperature or a sensor's distance in the part's card, waves at the PIR, presses the 3D keypad's keys or the
// remote's buttons, pulls the joystick, turns the knob. Fails on a lesson that cannot be completed, or on any page error.
// Saves each lesson's last view (<id>-complete.png), and a picture per step with SHOTS=1.
//   node devtools/test/robotest7.mjs [lesson,...|all] [outdir]
//   env: PORT (8811), CHROME (the browser), SHOTS=1, SLOW=n (a busy machine: every wait n times longer)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire('/root/tools/node_modules/'); const puppeteer = require('puppeteer-core');
const ALL = ['sos', 'melody', 'theremin', 'rgbtemp', 'crossing', 'quizbuzz', 'reaction', 'segcount', 'dice', 'countdown',
  'lcdnotice', 'lcddist', 'speedgun', 'visitors', 'radar', 'sketch', 'calc', 'mathquiz', 'schoolbell', 'lightmeter',
  'corridor', 'autofan', 'stairtimer', 'sanitizer', 'remotefan', 'railgate', 'blinds', 'jsdrive', 'mega_chaser', 'esp_alarm'];
const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : ALL;
const SHOTS = !!process.env.SHOTS, SLOW = +(process.env.SLOW || 1);
const out = process.argv[3] || '/tmp/claude-0/b7/robotest7'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8811; const W = 1280, H = 720;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', protocolTimeout: 900000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', `--window-size=${W},${H}`] });
const page = await b.newPage(); await page.setViewport({ width: W, height: H });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
const t00 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${ids[0]}`, { waitUntil: 'domcontentloaded', timeout: 240000 * SLOW });
await page.waitForFunction(() => document.title === 'READY', { timeout: 300000 * SLOW });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let shot = 0; const snap = async (n) => { if (SHOTS) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${n}.png` }); };
async function waitFor(fn, ms, what) { ms *= SLOW; const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
let curStep = 0; // a step counts as done when it is done, or when the lesson has already gone on past it
const stepDone = (ms, what) => waitFor(async () => { const s = await st(); return s.done || s.step > curStep; }, ms, what);
const boardWait = async (secs) => { const t0 = await ev(() => window.app.lab.mcu.t); await waitFor(() => ev(([t, s]) => window.app.lab.mcu.t - t > s * 1e6 || window.app.lab.mcu.state !== 'running', [t0, secs]), 180000, 'the board clock'); };

// ---------------------------------------------------------------- the mouse
async function drag(a, p, steps = 16) { await page.mouse.move(a.x, a.y); await page.mouse.down(); await sleep(40); for (let i = 1; i <= steps; i++) { await page.mouse.move(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(12); } await sleep(100); await page.mouse.up(); }
async function settle() { await waitFor(() => ev(() => window.robo.settled()), 90000, 'camera'); await sleep(250); }
async function selectPart(tag) { await ev((t) => { const a = window.app; a.select({ part: a.lab.byTag(t) }); }, tag); await sleep(300); }
async function setRange(sel, v) { await ev(([s, v2]) => { const i = document.querySelector(s); i.value = String(v2); i.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]); await sleep(200); }
const onCanvas = (p) => ev(([x, y]) => document.elementFromPoint(x, y) === window.app.stage.renderer.domElement, [p.x, p.y]);
// a push button held down with the mouse on its cap (the view turned to the top if something covers it), then let go
async function press(tag, ms = 600) {
  await settle(); let p = await ev((t) => window.robo.roleScreen(t, 'cap'), tag);
  if (!p || !(await onCanvas(p))) { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView('top'); }); await settle(); p = await ev((t) => window.robo.roleScreen(t, 'cap'), tag); }
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await boardWait(ms / 1000); await page.mouse.up(); await sleep(200);
}
async function pressWhen(tag, cond, ms = 400) { await waitFor(() => ev(cond), 120000, 'the moment to press ' + tag); await press(tag, ms); }
const lightTo = async (v) => { await ev((x) => { const r = document.querySelector('#r-light'); r.value = String(x); r.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(v * 100)); await boardWait(0.8); };
async function tempTo(tag, c) { await selectPart(tag); await setRange('#co-temp', c); await boardWait(1); }
async function distTo(tag, cm) { await selectPart(tag); await setRange('#co-dist', cm); await boardWait(0.6); }
async function wave(tag) { await selectPart(tag); await ev(() => document.querySelector('#co3-wave').click()); await boardWait(1.2); }
async function knobTo(tag, v) { await selectPart(tag); await setRange('#co-pos', Math.round(v * 100)); await boardWait(0.5); }
// the keypad's keys, pressed one by one in the keypad's card (its 16 buttons; the 3D keys can be under the keypad's own
// wires), each held a moment of the board's time, as a finger does
async function keys(tag, list) {
  const K = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
  await selectPart(tag);
  for (const k of list) {
    const r = await ev((i) => { const b = document.querySelector(`#callout [data-kp3="${i}"]`); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const q = b.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, K.indexOf(k));
    if (!r) throw new Error('no key ' + k + ' in the keypad card');
    await page.mouse.move(r.x, r.y); await page.mouse.down(); await boardWait(0.15); await page.mouse.up(); await boardWait(0.2);
  }
}
// the remote's buttons in the IR receiver's card
async function remote(tag, k) { await selectPart(tag); await ev((k2) => document.querySelector(`#callout [data-rc3="${k2}"]`).click(), k); await boardWait(0.5); }
// the joystick: hold the stick pushed (dx, dy pixels) until fn() is true
async function stick(tag, dx, dy, fn, ms = 20000) {
  await settle(); const p = await ev((t) => window.robo.roleScreen(t, 'stick'), tag); await page.mouse.move(p.x, p.y); await page.mouse.down(); await sleep(60);
  for (let i = 1; i <= 8; i++) { await page.mouse.move(p.x + dx * i / 8, p.y + dy * i / 8); await sleep(30); }
  const t0 = Date.now(); while (Date.now() - t0 < ms * SLOW && !(await fn())) await sleep(150); await page.mouse.up(); await sleep(300);
}
const lcd = (re) => ev((r) => { const x = window.robo3.lcd('lcd'); return !!x && new RegExp(r).test(x.join('\n')); }, re.source);
const lit = (tag) => ev((t) => window.app.rt.ledLit(t), tag);
const memRun = (k) => ev((k2) => window.app.rt.memRun[k2], k);
const serial = () => ev(() => window.app.rt.serLines.join('\n'));

const ACT = {
  melody: [() => press('b1', 500), () => press('b1', 500)],
  theremin: [() => lightTo(0.15), () => lightTo(0.85), () => lightTo(0.15)],
  rgbtemp: [() => tempTo('t1', 15), () => tempTo('t1', 38)],
  crossing: [() => press('b1', 500), () => press('b1', 500)],
  quizbuzz: [() => press('b1', 400), async () => { if (!(await lit('led1'))) await press('b1', 300); await press('b2', 600); }, async () => { await waitFor(async () => /Ready!$/.test(await serial()), 60000, 'Ready!'); await press('b2', 500); }],
  reaction: [() => pressWhen('b1', () => window.app.rt.ledLit('led1')), () => pressWhen('b1', () => /Get ready/.test(window.robo3.lcd('lcd').join(' ')), 300)],
  dice: [async () => { for (let k = 0; k < 3; k++) { await press('b1', 300); await boardWait(1.2); } }, async () => { for (let k = 0; k < 12; k++) { if ((await st()).done) break; await press('b1', 300); await boardWait(1.2); } }],
  lcddist: [() => distTo('us1', 30), () => distTo('us1', 6), () => distTo('us1', 15)],
  speedgun: [async () => { await distTo('g1', 4); await boardWait(0.3); await distTo('g1', 30); await boardWait(2.5); await distTo('g2', 4); await boardWait(0.3); await distTo('g2', 30); },
    async () => { await boardWait(1.6); await distTo('g1', 4); await distTo('g1', 30); await distTo('g2', 4); await boardWait(0.3); await distTo('g2', 30); }],
  visitors: [async () => { for (let k = 0; k < 3; k++) { await distTo('din', 4); await boardWait(0.3); await distTo('din', 30); await boardWait(0.4); } }, async () => { await distTo('dout', 4); await boardWait(0.3); await distTo('dout', 30); },
    async () => { for (let k = 0; k < 3; k++) { await distTo('din', 4); await boardWait(0.3); await distTo('din', 30); await boardWait(0.4); } }],
  radar: [() => distTo('us1', 20), () => distTo('us1', 80)],
  sketch: [() => stick('js', 45, 0, () => ev(() => (window.app.rt.memRun.oledMax || 0) >= 40)), () => pressCo('js', 500), () => stick('js', -45, 0, () => ev(() => (window.app.rt.memRun.oledMax || 0) >= 100))],
  calc: [() => keys('kp', ['1', '2', 'A', '3', '0', '#']), () => keys('kp', ['7', 'D', '2', '#']), () => keys('kp', ['5', 'D', '0', '#'])],
  mathquiz: [() => quiz(true), () => quiz(false), () => quiz(true)],
  lightmeter: [() => lightTo(0.2), () => lightTo(0.85), () => lightTo(0.55)],
  corridor: [async () => { await boardWait(3); await wave('pir'); }, async () => { await lightTo(0.15); await boardWait(3); await wave('pir'); }],
  autofan: [() => tempTo('t1', 34), async () => { await tempTo('t1', 29); await boardWait(1.5); }, () => tempTo('t1', 25)],
  stairtimer: [() => press('b1', 400), () => press('b1', 400)],
  sanitizer: [() => distTo('ir1', 4), async () => { await distTo('ir1', 30); await boardWait(1); await distTo('ir1', 4); }, async () => { await distTo('ir1', 30); await boardWait(1); await distTo('ir1', 4); }],
  remotefan: [() => remote('ir', '3'), () => remote('ir', '1'), () => remote('ir', '0')],
  railgate: [() => distTo('ir1', 4), () => distTo('ir1', 30)],
  blinds: [async () => { await boardWait(4); await lightTo(0.1); }, () => lightTo(0.85)],
  jsdrive: [() => stick('js', 0, -45, () => ev(() => !!window.app.rt.memRun.fwd)), () => stick('js', 45, 0, () => ev(() => !!window.app.rt.memRun.spin))],
  mega_chaser: [() => knobTo('pot1', 0), () => knobTo('pot1', 1)],
  esp_alarm: [async () => { await boardWait(4); await wave('pir'); }, async () => { await boardWait(6); await wave('pir'); }],
};
// the times-table quiz: read the question on the LCD, type the answer (right, or one too many) and #
async function quiz(right) {
  await waitFor(() => ev(() => /^\d+ x \d+ = \?/.test(window.robo3.lcd('lcd')[0])), 60000, 'a question');
  const q = await ev(() => window.robo3.lcd('lcd')[0]); const m = /^(\d+) x (\d+)/.exec(q); const a = m[1] * m[2] + (right ? 0 : 1);
  await keys('kp', [...String(a), '#']);
}
// a part card's ● press button, held down a while (the joystick's switch)
async function pressCo(tag, ms) { await selectPart(tag); const r = await ev(() => { const b = document.querySelector('#co-press').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }); await page.mouse.move(r.x, r.y); await page.mouse.down(); await boardWait(ms / 1000); await page.mouse.up(); await sleep(200); }

const results = [];
for (const id of ids) {
  const t0 = Date.now(); let ok = false, why = '';
  try {
    await ev((i) => document.querySelector(`#strip [data-lesson="${i}"]`).click(), id); await sleep(900);
    const s0 = await st(); if (s0.lesson !== id) throw new Error('lesson did not open');
    await ev(() => { const s = document.querySelector('#s-speed'); s.value = '2'; s.dispatchEvent(new Event('change')); });
    let acts = 0;
    for (let guard = 0; guard < 45; guard++) {
      const s = await st(); curStep = s.step; const step = await ev(() => { const q = window.robo.step(); return q && { k: q.k, place: q.place, wire: q.wire, set: q.set && q.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`);
      if (step.k === 'place') {
        await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await settle();
        const card = await ev((t) => { const r = document.querySelector(`#plist .pc[data-type="${t}"]`).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 - 6 }; }, step.place.type);
        const to = await ev(([ty, at, rot]) => window.robo.dropFor(ty, at, rot), [step.place.type, step.place.at, step.place.rot]);
        await drag(card, to, 18); await stepDone(8000, 'place ' + step.place.tag);
      } else if (step.k === 'wire') {
        const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w && (await st()).done) continue; if (!w) throw new Error('no ghost wire for ' + step.wire.join('→'));
        await settle(); await ev(() => document.querySelector('#bar [data-tool="wire"]').click()); const a = await ev((e) => window.robo.screen(e), w[0]), bb = await ev((e) => window.robo.screen(e), w[1]); await drag(a, bb, 16);
        await stepDone(8000, 'wire ' + step.wire.join('→'));
        await ev(() => document.querySelector('#bar [data-tool="move"]').click());
      } else if (step.k === 'check') {
        await ev(() => document.querySelector('#b-check').click());
        await sleep(400); const c = await st(); if (!c.done && !(c.step > curStep)) throw new Error('check failed: ' + (await ev(() => window.app.checkMsg && window.app.checkMsg.text)));
      } else if (step.k === 'run') { await ev(() => document.querySelector('#b-run').click()); await stepDone(15000, 'run'); }
      else if (step.k === 'edit') {
        await ev((set) => { const ta = document.querySelector('#editor textarea'); let src = ta.value; for (const [re, fl, v] of set) src = src.replace(new RegExp(re, fl), v); ta.value = src; ta.dispatchEvent(new Event('input', { bubbles: true })); window.app.editor.value = src; window.app.onEdit(src); }, step.set);
        await ev(() => document.querySelector('#b-run').click()); await stepDone(15000, 'edit');
      } else if (step.k === 'watch') await stepDone(150000, 'watch');
      else if (step.k === 'act') { await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(120000, 'act ' + acts); }
      // on to the next step (the card goes on by itself after a done step; Next if it does not)
      const t1 = Date.now(); for (;;) { const q = await st(); if (q.step !== s.step || s.step === q.of - 1) break; if (Date.now() - t1 > 1800 * SLOW) await ev(() => { const n = document.querySelector('#b-next'); if (!n.disabled) n.click(); }); if (Date.now() - t1 > 20000 * SLOW) break; await sleep(300); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 120000, 'lesson complete');
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); }
  await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView(window.app.rt.lesson.view || 'wide'); }).catch(() => {}); await settle().catch(() => {});
  await page.screenshot({ path: `${out}/${ok ? '' : 'FAIL-'}${id}-complete.png` }).catch(() => {});
  const s = await st().catch(() => ({}));
  results.push({ id, ok, why, secs: Math.round((Date.now() - t0) / 1000), step: s.step, mcu: s.mcu, err: s.err });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(12) + ` ${Math.round((Date.now() - t0) / 1000)}s` + (ok ? '' : `  step ${s.step} · ${why}`));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, opened: Math.round((Date.now() - t00) / 1000) }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
const failed = results.filter((r) => !r.ok).length + (errors.length ? 1 : 0);
console.log(`${results.length - results.filter((r) => !r.ok).length}/${results.length} lessons complete, ${errors.length} page errors`);
await b.close(); process.exit(failed ? 1 : 0);
void lcd; void lit; void memRun; void wave; void knobTo; void distTo; void keys; void remote; void stick;
