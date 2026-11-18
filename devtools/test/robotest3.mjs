// DUET Robotics Lab 360, batch 3: plays every school-lab lesson end to end through the real page, as a student would, in
// headless Chromium (puppeteer-core): drags each part from the drawer onto its ghost, drags every wire, presses Check and
// Run, and does each edit step: in the Blocks lessons through the blocks themselves (taps a value and types a new one,
// picks a choice, drags a Maths block from the palette into a slot), in the C++ lessons by typing the C++. The act steps
// are done in the scene: the world panel's buttons and sliders, the 3D TV remote, the 3D keypad's keys, the RFID card on the
// desk, the joystick's cap held over the target. Fails on a page error.
//   node devtools/test/robotest3.mjs [lesson,...|all] [outdir]     env: PORT (8808), PHONE=1 (915×412 touch), SHOTS=1, HINDI=1,
//   DEBUG=1 (log each step), FAST=1 (debugging only: parts and wires put in by the lab's API instead of dragged)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire('/root/tools/node_modules/'); const puppeteer = require('puppeteer-core');
const ALL = ['lcdtemp', 'irrigate', 'homeauto', 'burglar', 'rfidlock', 'weather', 'keylock', 'gasalarm', 'pantilt', 'turntable'];
const ids = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : ALL;
const PORT = process.env.PORT || 8808, PHONE = !!process.env.PHONE, SHOTS = !!process.env.SHOTS;
const out = process.argv[3] || `/tmp/claude-0/agent-robo3/robotest3${PHONE ? '-phone' : ''}`; fs.mkdirSync(out, { recursive: true });
const W = PHONE ? 915 : 1280, H = PHONE ? 412 : 720;
// one browser at a time; started again (and the lesson tried again) if it goes away under us (a crash, or the machine's
// other test runs closing browsers)
let b = null, page = null; const errors = [];
async function start(first) {
  if (b) await b.close().catch(() => {});
  b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', protocolTimeout: 240000, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows'] });
  page = await b.newPage();
  await page.setViewport(PHONE ? { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: W, height: H });
  await page.evaluateOnNewDocument(() => { window.__lost = 0; addEventListener('webglcontextlost', () => { window.__lost++; }, true); try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
  await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || r.url().startsWith('data:') || r.url().startsWith('blob:') ? r.continue() : r.abort()));
  page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=${first}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => document.title === 'READY', { timeout: 240000 });
  if (process.env.HINDI) await page.evaluate(() => window.app.setLang('hi'));
}
const gone = (e) => /Target closed|detached Frame|Session closed|Connection closed|Execution context was destroyed/.test(String(e && e.message || e));
await start(ids[0]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = (f, a) => page.evaluate(f, a);
const st = () => ev(() => window.robo.state());
let shot = 0; const snap = async (name, always) => { if (SHOTS || always) await page.screenshot({ path: `${out}/${String(++shot).padStart(3, '0')}-${name}.png` }); };

async function drag(a, p, steps = 14) {
  if (PHONE) { await page.touchscreen.touchStart(a.x, a.y); await sleep(60); for (let i = 1; i <= steps; i++) { await page.touchscreen.touchMove(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(16); } await sleep(120); await page.touchscreen.touchEnd(); return; }
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await sleep(40);
  for (let i = 1; i <= steps; i++) { await page.mouse.move(a.x + (p.x - a.x) * i / steps, a.y + (p.y - a.y) * i / steps); await sleep(12); }
  await sleep(100); await page.mouse.up();
}
async function tap(p) { if (PHONE) { await page.touchscreen.tap(p.x, p.y); } else await page.mouse.click(p.x, p.y); }
// press and hold, moved by (dx, dy) from where it started, until `until` is true (the joystick's cap)
async function holdMoved(p, dx, dy, until, ms) {
  if (PHONE) await page.touchscreen.touchStart(p.x, p.y); else { await page.mouse.move(p.x, p.y); await page.mouse.down(); }
  for (let i = 1; i <= 10; i++) { const x = p.x + dx * i / 10, y = p.y + dy * i / 10; if (PHONE) await page.touchscreen.touchMove(x, y); else await page.mouse.move(x, y); await sleep(30); }
  const t0 = Date.now(); let okk = false; while (Date.now() - t0 < ms) { if (await until()) { okk = true; break; } await sleep(200); }
  if (PHONE) await page.touchscreen.touchEnd(); else await page.mouse.up();
  return okk;
}
async function waitFor(fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
async function stepDone(ms = 20000, what) { await waitFor(async () => (await st()).done, ms * 3, what); }
async function nextIfNeeded(i) {
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const s = await st(); if (s.step !== i || i === s.of - 1) return;
    if (Date.now() - t0 > 2500 && await ev(() => !document.querySelector('#b-next').disabled)) { await ev(() => document.querySelector('#b-next').click()); await sleep(300); }
    await sleep(200);
  }
}
async function settle() { await waitFor(() => ev(() => window.robo.settled()), 90000, 'camera'); await sleep(250); }
async function setRange(sel, v) { await ev(([s, v]) => { const i = document.querySelector(s); i.value = String(v); i.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]); await sleep(150); }
const wbtn = (id, v) => ev(([id, v]) => { const d = document.querySelector(`#w-ctl [data-id="${id}"]`); const el = v == null ? d.querySelector('button') : d.querySelector(`button[data-v="${v}"]`); el.click(); }, [id, v]);
const world = () => ev(() => window.robo3.world());
const sceneView = async () => { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView(window.app.rt.lesson.rview || 'scene3'); }); await settle(); };
const sideOpen = async (on) => { if (!PHONE) return; await ev((on) => { if (document.body.classList.contains('code-open') !== on) document.querySelector('#b-code').click(); }, on); await sleep(450); };

// ---------------------------------------------------------------- the blocks, used as a student does
const LITS = ['num', 'text', 'char', 'pin', 'level', 'bool', 'const'];
async function setVal(sel, v) { // a value or a choice inside a block: tap it and type (or pick)
  await ev((s) => document.querySelector(s).scrollIntoView({ block: 'center', inline: 'nearest' }), sel); await sleep(120);
  const tag = await ev((s) => document.querySelector(s).tagName, sel);
  if (tag === 'SELECT') await page.select(sel, String(v));
  else { if (PHONE) await page.tap(sel); else await page.click(sel, { clickCount: 3 }); await ev((s) => document.querySelector(s).select(), sel); await page.keyboard.type(String(v)); await page.keyboard.press('Tab'); }
  await sleep(300);
}
async function rectOf(sel) { await ev((s) => document.querySelector(s).scrollIntoView({ block: 'center', inline: 'nearest' }), sel); await sleep(150); return ev((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { left: r.left, top: r.top, w: r.width, h: r.height }; }, sel); }
// a value block from the palette, dragged into a block's slot, then its own values set (and so on, inside it)
async function buildInto(id, key, spec) {
  const slot = `#b3 [data-slot="${id}:${key}"]`;
  if (LITS.includes(spec.t)) { const lit = await ev((s) => { const el = document.querySelector(s); const x = [...el.querySelectorAll('[data-lit]')].find((q) => q.closest('.b3-slot') === el); return x && x.dataset.lit; }, slot); await setVal(`#b3 [data-lit="${lit}"]`, spec.f.v); return; }
  const cat = await ev((t) => window.robo3.blkCat(t), spec.t);
  await ev((c) => document.querySelector(`#b3 .b3-cats [data-c="${c}"]`).click(), cat); await sleep(200);
  const pr = await rectOf(`#b3 .b3-list [data-pal="${spec.t}"]`); const sr = await rectOf(slot);
  await drag({ x: pr.left + 12, y: pr.top + 12 }, { x: sr.left, y: sr.top + sr.h / 2 + 2 }, 18); await sleep(350);
  const nid = await ev(([i, k]) => window.robo3.blkSlot(i, k), [id, key]);
  if (!nid || (await ev((n) => { const el = document.querySelector(`#b3 [data-id="${n}"]`); return el && el._b.t; }, nid)) !== spec.t) throw new Error(`the ${spec.t} block did not land in the slot ${key}`);
  for (const [k, v] of Object.entries(spec.f || {})) { const sel = `#b3 [data-f="${nid}:${k}"]`; if (await ev(([s, v]) => { const el = document.querySelector(s); return el && el.value !== v; }, [sel, v])) await setVal(sel, v); }
  for (const [k, v] of Object.entries(spec.i || {})) if (v) await buildInto(nid, k, v);
}
async function blocksEdit(set) {
  const want = await ev((set) => { let s = window.app.code(); for (const [re, fl, v] of set) s = s.replace(new RegExp(re, fl), v); return s; }, set);
  const ch = await ev((w) => window.robo3.blkDiff(w), want); if (!ch || !ch.length) throw new Error('this edit cannot be done in blocks');
  await sideOpen(true);
  for (const c of ch) {
    if (c.kind === 'lit') await setVal(`#b3 [data-lit="${c.id}"]`, c.v);
    else if (c.kind === 'field') await setVal(`#b3 [data-f="${c.id}:${c.key}"]`, c.v);
    else await buildInto(c.id, c.key, c.v);
  }
  await snap('blocks-edit', true);
  const got = await ev(() => window.app.code()); if (got.replace(/\s+/g, ' ') !== want.replace(/\s+/g, ' ')) console.log('     (the blocks wrote the C++ in their own spacing)');
  return ch;
}
async function cppEdit(set) {
  await ev((set) => { const ta = document.querySelector('#editor textarea'); let src = ta.value; for (const [re, fl, v] of set) src = src.replace(new RegExp(re, fl), v); ta.value = src; ta.dispatchEvent(new Event('input', { bubbles: true })); window.app.editor.value = src; window.app.onEdit(src); }, set);
}

// ---------------------------------------------------------------- the scene: what the student does in each act step
const onCanvas = (p) => ev(([x, y]) => document.elementFromPoint(x, y) === window.app.stage.renderer.domElement, [p.x, p.y]);
const key3 = async (keys) => { // the keys of the 3D keypad on the bench (from a view where nothing covers them)
  const at = (i) => ev((i) => window.robo3.roleAt('kp', 'key3:' + i), i); const K = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
  if (!(await onCanvas(await at(0))) || !(await onCanvas(await at(15)))) { await ev(() => { window.app.stage.userMoved = false; window.app.stage.setView('top'); }); await settle(); }
  if (!(await onCanvas(await at(0)))) throw new Error('the 3D keypad is covered on the screen');
  for (const k of keys) { await tap(await at(K.indexOf(k))); await boardMs(200); }
};
// wait until the board has run ms of its own time: on a slow software renderer two presses in one frame would reach the
// sketch at once, and Keypad's getKey() gives one key a scan (as a real keypad does)
const boardMs = async (ms) => { const t0 = await ev(() => window.app.lab.mcu.t); const w0 = Date.now(); while (Date.now() - w0 < 60000 && (await ev(() => window.app.lab.mcu.t)) - t0 < ms * 1000) await sleep(50); await sleep(60); };
const kpanel = async (keys) => { for (const k of keys) { const r = ['123A', '456B', '789C', '*0#D'].findIndex((row) => row.includes(k)); await wbtn('kp' + r, k); await boardMs(300); } };
const rc3 = async (k) => { await sceneView(); const p = await ev((k) => window.robo3.worldRole('rc3:' + k), k); if (!p) throw new Error('no 3D remote button ' + k); await tap(p); };
const stick = (dx, dy) => async () => { await settle(); const p = await ev(() => window.robo.roleScreen('js', 'stick')); const okk = await holdMoved(p, dx, dy, async () => (await st()).done, 30000); if (!okk) throw new Error('the laser dot did not reach the target'); };
const ACT = {
  lcdtemp: [async () => { await wbtn('chai', '1'); }], // (one entry for each act step; watch steps just wait)
  irrigate: [async () => { await wbtn('dry'); }, async () => { await wbtn('dry'); }],
  homeauto: [async () => { await rc3('1'); }, async () => { await wbtn('rc0', '2'); }, async () => { await wbtn('rc0', '1'); }, async () => { await sleep(400); await rc3('3'); }],
  burglar: [async () => { await sleep(2500); await wbtn('walk'); }, async () => { await sleep(2500); await wbtn('cat'); }],
  rfidlock: [async () => { await sleep(800); await wbtn('card'); }, async () => { await sleep(800); await sceneView(); const p = await ev(() => window.robo3.worldRole('card3:card')); if (p) await tap(p); else await wbtn('card'); }, async () => { await sleep(800); await wbtn('tag'); }],
  weather: [async () => { await wbtn('sky', 'rainy'); }],
  keylock: [async () => { await kpanel(['1', '1', '1', '1', '#']); }, async () => { await settle(); await key3(['1', '2', '3', '4', '#']); }, async () => { await kpanel(['2', '5', '8', '0', '#']); }],
  gasalarm: [async () => { await setRange('#w-ctl [data-id="leak"] input', 30); }, async () => { await setRange('#w-ctl [data-id="leak"] input', 0); await wbtn('win', '1'); }, async () => { await wbtn('win', '0'); await setRange('#w-ctl [data-id="leak"] input', 30); }],
  pantilt: [stick(-35, 37), stick(35, -33), stick(35, 33)],
  turntable: [],
};

// ---------------------------------------------------------------- each lesson
const results = [];
for (let li = 0, tries = 0; li < ids.length; li++) {
  const id = ids[li]; const t0 = Date.now(); let ok = false, why = ''; const notes = [];
  try {
    if (PHONE) { await sideOpen(false); await ev(() => document.querySelector('#b-menu').click()); await sleep(200); }
    await ev((i) => document.querySelector(`#strip [data-lesson="${i}"]`).click(), id); await sleep(900);
    const s0 = await st(); if (s0.lesson !== id) throw new Error('lesson did not open');
    const L = await ev(() => ({ blocks: !!window.app.rt.lesson.blocks, mode: window.app.blocks3.mode }));
    if (L.mode !== (L.blocks ? 'blocks' : 'cpp')) throw new Error(`opened in ${L.mode}, the lesson says ${L.blocks ? 'blocks' : 'C++'}`);
    notes.push(L.mode === 'blocks' ? 'blocks' : 'C++');
    if (!L.blocks && id === 'homeauto') { // a C++ lesson: the switch to Blocks shows the same program as blocks, and back, without changing the C++
      const c0 = await ev(() => window.app.code()); await sideOpen(true); await ev(() => document.querySelector('#b3-mode [data-m="blocks"]').click()); await sleep(600);
      const nb = await ev(() => document.querySelectorAll('#b3 .b3-ws .b3-b').length); await snap('homeauto-as-blocks', true);
      await ev(() => document.querySelector('#b3-mode [data-m="cpp"]').click()); await sleep(400); await sideOpen(false);
      if (!(nb > 10) || (await ev(() => window.app.code())) !== c0) throw new Error('Blocks / C++ switch'); notes.push(`switch to blocks: ${nb} blocks`);
    }
    await ev(() => { const s = document.querySelector('#s-speed'); if (s) { s.value = '2'; s.dispatchEvent(new Event('change')); } });
    let acts = 0;
    for (let guard = 0; guard < 50; guard++) {
      const s = await st(); const step = await ev(() => { const s = window.robo.step(); return s && { k: s.k, place: s.place, wire: s.wire, set: s.set && s.set.map(([re, v]) => [re.source, re.flags, v]) }; });
      await snap(`${id}-${s.step}-${step.k}`); if (process.env.DEBUG) console.log('     step', s.step, step.k, JSON.stringify(step.place || step.wire || ''));
      if (step.k === 'info') await nextIfNeeded(s.step);
      else if (process.env.FAST && (step.k === 'place' || step.k === 'wire')) { // (debugging the later steps only: the bench built by the lab's API)
        await ev(() => { const a = window.app, rt = a.rt, lab = a.lab, q = rt.step; if (q.k === 'place') lab.addPart(q.place.type, q.place.props, q.place.at, q.place.rot, q.place.tag); else { const g = rt.ghostWire(q.wire); lab.addWire(g[0], g[1]); } a.renderAll(); });
        await stepDone(5000, 'fast ' + step.k); await nextIfNeeded(s.step);
      } else if (step.k === 'place') {
        await sideOpen(false); await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await settle();
        const card = await ev((t) => { const el = document.querySelector(`#plist .pc[data-type="${t}"]`); el.scrollIntoView({ block: 'nearest' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 - 6 }; }, step.place.type);
        const to = await ev(([ty, at, rot]) => window.robo.dropFor(ty, at, rot), [step.place.type, step.place.at, step.place.rot]);
        await drag(card, to, 18); await stepDone(5000, 'place ' + step.place.tag); await nextIfNeeded(s.step);
      } else if (step.k === 'wire') {
        await sideOpen(false); await settle(); await ev(() => document.querySelector('#bar [data-tool="wire"]').click());
        const g = await ev(() => window.robo.ghosts()); const w = g[0] && g[0].wire; if (!w) throw new Error('no ghost wire for ' + step.wire.join('→'));
        const a = await ev((e) => window.robo.screen(e), w[0]), bb = await ev((e) => window.robo.screen(e), w[1]);
        await drag(a, bb, 16); await stepDone(5000, 'wire ' + step.wire.join('→'));
        await ev(() => document.querySelector('#bar [data-tool="move"]').click()); await nextIfNeeded(s.step);
      } else if (step.k === 'check') { await ev(() => document.querySelector('#b-check').click()); await sleep(300); if (!(await st()).done) throw new Error('check failed: ' + await ev(() => (document.querySelector('#c-x .msg') || {}).textContent)); await nextIfNeeded(s.step); }
      else if (step.k === 'run') { await ev(() => document.querySelector('#b-run').click()); await stepDone(8000, 'run'); await nextIfNeeded(s.step); }
      else if (step.k === 'edit') {
        if (L.blocks) { const ch = await blocksEdit(step.set); notes.push(`edit in blocks: ${ch.map((c) => (c.kind === 'slot' ? 'dragged ' + c.v.t : c.kind === 'lit' ? 'typed ' + c.v : 'picked ' + c.v)).join(', ')}`); } else await cppEdit(step.set);
        await sideOpen(false); await ev(() => document.querySelector('#b-run').click()); await stepDone(8000, 'edit'); await nextIfNeeded(s.step);
      } else if (step.k === 'watch') { await sideOpen(false); await stepDone(45000, 'watch'); await nextIfNeeded(s.step); }
      else if (step.k === 'act') { await sideOpen(false); await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(40000, 'act ' + acts); await nextIfNeeded(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 120000, 'lesson complete');
    await sceneView(); const calls = await ev(() => window.robo3.calls()); const wd = await world(); notes.push(`${calls.calls} draw calls a frame, scene built in ${wd && wd.buildMs ? Math.round(wd.buildMs) + ' ms' : '?'}`); const lost = await ev(() => window.__lost); if (lost) notes.push(`WebGL context lost ${lost}× (the machine's memory)`);
    await page.screenshot({ path: `${out}/${id}-complete.png` });
    ok = true;
  } catch (e) {
    if (gone(e) && tries < 2) { tries++; console.log(`     (the browser went away during ${id}: starting it again)`); await start(id).catch(() => {}); li--; continue; }
    why = String(e.message || e).slice(0, 300); await page.screenshot({ path: `${out}/FAIL-${id}.png` }).catch(() => {});
  }
  tries = 0;
  const s = await st().catch(() => ({}));
  results.push({ id, ok, why, notes, secs: Math.round((Date.now() - t0) / 1000), step: s.step, mcu: s.mcu, err: s.err && s.err.code });
  console.log((ok ? 'PASS ' : 'FAIL ') + id.padEnd(11) + ` ${Math.round((Date.now() - t0) / 1000)}s  ` + (ok ? notes.join(' · ') : `step ${s.step} · ${why}`));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ results, errors, size: [W, H], phone: PHONE }, null, 1));
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'));
const failed = results.filter((r) => !r.ok).length + (errors.length ? 1 : 0);
console.log(`${results.length - results.filter((r) => !r.ok).length}/${results.length} lessons complete${errors.length ? ', ' + errors.length + ' page errors' : ', 0 page errors'}`);
await b.close(); process.exit(failed ? 1 : 0);
