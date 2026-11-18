// DUET Robotics Lab 360 on a slow device: opens lessons on an emulated phone (Pixel UA, light mode, CPU ×4) or a Quest
// (QUEST=1: the Quest browser's UA), and reports for each: the longest main-thread task while it opens (the freeze), the
// draw calls of the bench view and of the robot's view, and the JavaScript time per frame while the robot runs (the
// sketch, the circuit, the robot's physics and the 3D updates; the GPU's time is not measurable here: software GL).
//   node devtools/test/robophone.mjs [lesson,...|all] [outdir]      env: PORT (8807), QUEST=1, RATE (4)
// The phone run hides KHR_parallel_shader_compile, as the test phone (Adreno 610) has none: every new shader then compiles
// on the page's own thread, so a lesson that brings many new materials shows it as a long task (PARALLEL=1 keeps it).
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
let ids = (process.argv[2] || 'arm4,linecar,avoidcar,iralarm').split(','); const out = process.argv[3] || '/tmp/robophone'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8807, QUEST = !!process.env.QUEST, RATE = +(process.env.RATE || 4), SLOW = +(process.env.SLOW || 1);
const UA = QUEST ? 'Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/35.2 Chrome/126.0 VR Safari/537.36' : devices['Pixel 7'].userAgent;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext(QUEST ? { viewport: { width: 1280, height: 720 }, userAgent: UA } : { viewport: { width: 915, height: 412 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
await ctx.addInitScript(() => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
if (!QUEST && !process.env.PARALLEL) await ctx.addInitScript(() => { for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue; const ge = C.prototype.getExtension, gs = C.prototype.getSupportedExtensions; C.prototype.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? null : ge.call(this, n); }; C.prototype.getSupportedExtensions = function () { return (gs.call(this) || []).filter((n) => n !== 'KHR_parallel_shader_compile'); }; } });
const page = await ctx.newPage(); page.setDefaultTimeout(30000 * SLOW); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=meet`, { waitUntil: 'commit' });
await page.waitForFunction(() => document.title === 'READY', null, { timeout: 300000 }); const firstLoad = Date.now() - t0;
const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
await page.waitForTimeout(2000);
const ev = (f, a) => page.evaluate(f, a);
if (ids[0] === 'all') ids = await ev(() => [...document.querySelectorAll('#strip .chip')].map((c) => c.dataset.lesson)); // every lesson in the strip
const rows = [];
for (const id of ids) {
  await ev(() => { window.__lt = []; if (window.__po) window.__po.disconnect(); window.__po = new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }); window.__po.observe({ entryTypes: ['longtask'] }); });
  await ev((id) => window.app.openLesson(id), id);
  await page.waitForFunction(() => !window.app.world || window.app.world.ready, null, { timeout: 180000 });
  await page.waitForTimeout(2500);
  const open = await ev(() => ({ lt: window.__lt.slice(), build: window.app.world && window.app.world.buildMs }));
  const calls = async () => ev(() => new Promise((res) => { const a = window.app; a.stage.kick(3); requestAnimationFrame(() => requestAnimationFrame(() => res(window.robo.calls()))); }));
  const bench = await calls(); let robot = null, js = null;
  // finish the circuit as the steps say, run, and time the JavaScript of each frame while the robot works
  await ev(() => { const a = window.app, rt = a.rt, lab = a.lab; for (const s of rt.lesson.steps) { if (s.k === 'place' && !lab.byTag(s.place.tag)) lab.addPart(s.place.type, s.place.props, s.place.at, s.place.rot, s.place.tag); if (s.k === 'wire' && !rt.conn(s.wire[0], s.wire[1])) { const g = rt.ghostWire(s.wire); if (g) lab.addWire(g[0], g[1]); } } a.run(); });
  if (await ev(() => !!window.app.world)) { await ev(() => { const L = window.app.rt.lesson; window.app.stage.setView(L.rview || L.view, true); }); await page.waitForTimeout(1500); robot = await calls(); }
  js = await ev(() => new Promise((res) => { const a = window.app; const f0 = a.frame.bind(a); const ts = []; a.frame = (dt) => { const t = performance.now(); f0(dt); ts.push(performance.now() - t); }; setTimeout(() => { a.frame = f0; ts.sort((x, y) => x - y); res(ts.length ? { n: ts.length, avg: +(ts.reduce((s, x) => s + x, 0) / ts.length).toFixed(1), p95: +ts[Math.floor(ts.length * 0.95)].toFixed(1) } : { n: 0, avg: 0, p95: 0 }); }, 5000); })); // (n 0: no frame in 5 s, a starved machine)
  const w = await ev(() => window.robo.world());
  await page.screenshot({ path: `${out}/${id}-${QUEST ? 'quest' : 'phone'}.png` });
  const row = { id, maxTask: Math.max(0, ...open.lt), longTasks: open.lt, worldBuildMs: open.build, benchCalls: bench.calls, robotCalls: robot && robot.calls, tris: bench.tris, robotTris: robot && robot.tris, progs: (robot || bench).progs, jsFrameMs: js, driven: w && w.vals && w.vals.odo && Math.round(w.vals.odo) };
  rows.push(row); console.log(JSON.stringify(row));
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ firstLoadMs: firstLoad, rows, errors, quest: QUEST, rate: RATE }, null, 1));
console.log('first load', firstLoad, 'ms · errors', JSON.stringify(errors.slice(0, 5)));
await b.close();
