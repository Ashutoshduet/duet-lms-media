// DUET Robotics Lab 360: the installed Quest app. It has no page to look at before VR, so it must go into VR by itself
// (Meta Quest 3 emulated by IWER: science/test/iwer.module.js), and in VR a student must be able to pick any lesson, get
// from a finished lesson back to the list, and leave. Cases, each in a fresh page:
//   app    ?app=vr                                   VR starts by itself; Lessons → a section → a lesson; Free build;
//                                                    a finished lesson → All lessons; Exit → out of VR, the big
//                                                    "Enter VR" button; the button → VR again
//   ref    opened by the Android app (document.referrer android-app://…)       VR starts by itself
//   quest  a Quest browser in a standalone window (display-mode: standalone)   VR starts by itself
//   page   the plain page on a computer (no app)                               no VR by itself, no big button
//   noxr   ?app=vr where the browser has no WebXR                              the big button, no error
//   node devtools/test/roboapp.mjs [case,...] (default all)     env: PORT (8810), CHROME
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const puppeteer = require('puppeteer-core');
const PORT = process.env.PORT || 8810; const CASES = process.argv[2] ? process.argv[2].split(',') : ['app', 'ref', 'quest', 'page', 'noxr'];
const LIC = { h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() };
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: 'new', protocolTimeout: 600000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--no-proxy-server', '--autoplay-policy=no-user-gesture-required', '--window-size=900,600'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function open(c) {
  const page = await b.newPage(); await page.setViewport({ width: 900, height: 600 });
  const xr = c.name !== 'noxr';
  if (c.ua) await page.setUserAgent(c.ua);
  await page.evaluateOnNewDocument(([lic, xr2, ref, noxr, standalone]) => {
    try { localStorage.setItem('duet.lic.v1', JSON.stringify(lic)); } catch (e) { /* none */ }
    if (ref) Object.defineProperty(Document.prototype, 'referrer', { get: () => ref, configurable: true }); // (a page cannot be given an android-app:// referrer by a desktop browser)
    if (noxr) Object.defineProperty(Navigator.prototype, 'xr', { get: () => undefined, configurable: true });
    if (standalone) { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); } // (headless Chrome cannot emulate an installed window)
    window.__closed = 0; window.close = () => { window.__closed++; }; // (Exit asks the app window to close: counted here, the test page stays)
    if (xr2) document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'module'; s.textContent = "import { XRDevice, metaQuest3 } from '/science/test/iwer.module.js'; const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; window.xrdev = d;"; document.head.appendChild(s); });
  }, [LIC, xr, c.ref || '', c.name === 'noxr', !!c.standalone]);
  await page.setRequestInterception(true); page.on('request', (r) => (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(r.url()) || /^(data|blob):/.test(r.url()) ? r.continue() : r.abort()));
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|No runtimes supported the requested configuration/.test(m.text())) errors.push('console: ' + m.text()); }); // (the last: Chrome's own WebXR, asked by the app's first try before the emulator has installed itself; the next try, 3 s on, gets it)
  await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute&lesson=meet${c.q || ''}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => document.title === 'READY', { timeout: 300000 });
  return { page, errors, ev: (f, a) => page.evaluate(f, a) };
}
async function waitFor(ev, fn, ms, what, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(fn, arg)) return true; await sleep(300); } throw new Error('timed out: ' + what); }
const presenting = () => !!(window.app.xr.session && window.app.stage.renderer.xr.isPresenting && document.body.classList.contains('in-vr'));
const bigButton = () => getComputedStyle(document.getElementById('xr-wait')).display !== 'none';

// the controller's ray on a panel item, and a click of the trigger (as robotest5.mjs)
function vr(ev) {
  const nextFrame = () => ev(() => new Promise((ok) => { const f0 = window.app.stage.frames || 0, t0 = performance.now(); const tick = () => ((window.app.stage.frames || 0) > f0 || performance.now() - t0 > 20000 ? ok() : setTimeout(tick, 4)); tick(); }));
  const aim = async (p) => { await ev((p2) => {
    const inp = window.xrdev.controllers.right; const eye = [0, 1.32, 0.12];
    const v = [p2[0] - eye[0], p2[1] - eye[1], p2[2] - eye[2]]; const L = Math.hypot(...v); inp.position.set(p2[0] - v[0] / L * 0.3, p2[1] - v[1] / L * 0.3, p2[2] - v[2] / L * 0.3);
    const f = [-v[0] / L, -v[1] / L, -v[2] / L]; const x = [f[2], 0, -f[0]]; const xl = Math.hypot(...x); x[0] /= xl; x[2] /= xl;
    const y = [f[1] * x[2] - f[2] * x[1], f[2] * x[0] - f[0] * x[2], f[0] * x[1] - f[1] * x[0]]; const m = [x, y, f]; const tr = m[0][0] + m[1][1] + m[2][2]; let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(m[1][2] - m[2][1]) / s, (m[2][0] - m[0][2]) / s, (m[0][1] - m[1][0]) / s, 0.25 * s]; }
    else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) { const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = [0.25 * s, (m[1][0] + m[0][1]) / s, (m[2][0] + m[0][2]) / s, (m[1][2] - m[2][1]) / s]; }
    else if (m[1][1] > m[2][2]) { const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = [(m[1][0] + m[0][1]) / s, 0.25 * s, (m[2][1] + m[1][2]) / s, (m[2][0] - m[0][2]) / s]; }
    else { const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = [(m[2][0] + m[0][2]) / s, (m[2][1] + m[1][2]) / s, 0.25 * s, (m[0][1] - m[1][0]) / s]; }
    inp.quaternion.set(...q); }, p); await sleep(150); await nextFrame(); };
  const trigger = async (v) => { await ev((v2) => window.xrdev.controllers.right.updateButtonValue('trigger', v2), v); await sleep(160); await nextFrame(); await nextFrame(); };
  const item = async (id) => { const p = await ev((i) => window.robo.xrItem(i), id); if (!p) throw new Error('no panel item ' + id + ' (have ' + (await ev(() => window.robo.xrItems())).join(' ') + ')'); await aim(p); await trigger(1); await trigger(0); await sleep(300); };
  return { item };
}

for (const name of CASES) {
  const c = { name, q: '' };
  if (name === 'app' || name === 'noxr') c.q = '&app=vr';
  if (name === 'ref') c.ref = 'android-app://in.duetpower.roboticslab.vr/';
  if (name === 'quest') { c.ua = 'Mozilla/5.0 (X11; Linux x86_64; Quest 3) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/37.0.0.0 SamsungBrowser/4.0 Chrome/130.0.0.0 VR Safari/537.36'; c.standalone = true; }
  const t0 = Date.now(); let ok = false, why = ''; const notes = [];
  let P = null;
  try {
    P = await open(c); const { ev } = P;
    if (name === 'page') { await sleep(8000); if (await ev(presenting)) throw new Error('VR started by itself on the plain page'); if (await ev(bigButton)) throw new Error('the big Enter VR button shows on the plain page'); }
    else if (name === 'noxr') { await waitFor(ev, bigButton, 30000, 'the big Enter VR button'); if (await ev(presenting)) throw new Error('presenting without WebXR?'); }
    else {
      if (name === 'quest' && !(await ev(() => matchMedia('(display-mode: standalone)').matches))) throw new Error('this browser cannot emulate display-mode: standalone');
      await waitFor(ev, presenting, 60000, 'VR to start by itself'); notes.push('VR by itself');
      if (name === 'app') {
        const X = vr(ev); const st = () => ev(() => ({ id: window.app.lessonId, mode: window.app.mode, tab: window.app.xr.ui.tab }));
        await X.item('lessons'); if ((await st()).tab !== 'lessons') throw new Error('Lessons did not open the list');
        { const u = await ev(() => window.robo.xrShot && window.robo.xrShot()).catch(() => null); if (u) fs.writeFileSync('/tmp/roboapp-vr-lessons.jpg', Buffer.from(u.split(',')[1], 'base64')); } // (what the student sees)
        await X.item('lgrp:robots'); await X.item('lesson:arm1'); await waitFor(ev, () => window.app.lessonId === 'arm1' && window.app.xr.ui.tab === 'step', 30000, 'arm1 to open from the list'); notes.push('Lessons → Robots → arm1');
        await X.item('lessons'); await X.item('lgrp:microbit'); await X.item('lesson:mbheart'); await waitFor(ev, () => window.app.lessonId === 'mbheart', 30000, 'mbheart to open'); notes.push('Lessons → micro:bit → mbheart');
        await X.item('lessons'); await X.item('lfree'); await waitFor(ev, () => window.app.mode === 'free', 15000, 'Free build'); notes.push('Free build');
        // a finished lesson: from its last step back to the list
        await X.item('lessons'); await X.item('lgrp:basics'); await X.item('lesson:meet'); await waitFor(ev, () => window.app.lessonId === 'meet' && window.app.mode === 'lesson', 30000, 'meet');
        await ev(() => { const r = window.app.rt; r.go(r.lesson.steps.length - 1); r.complete = true; window.app.renderCard(); window.app.xr.ui.sig = ''; });
        await X.item('alllessons'); if ((await st()).tab !== 'lessons') throw new Error('All lessons did not open the list'); notes.push('finished lesson → All lessons');
        // leave: out of VR, the app asked to close; the big button brings VR back
        await X.item('exit'); await waitFor(ev, () => !window.app.xr.session, 20000, 'the session to end');
        await sleep(1500); if (!(await ev(() => window.__closed > 0))) throw new Error('Exit did not ask the app window to close');
        await waitFor(ev, bigButton, 10000, 'the big Enter VR button after the session'); notes.push('Exit → closes, big button');
        // (headless Chrome delivers no mouse events to the page after an emulated session has ended: the button is checked to be
        // the topmost thing at its middle, then clicked from the page with a user gesture, as a student's click gives one)
        if (!(await ev(() => { const r = document.getElementById('xr-go').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && e.id === 'xr-go'; }))) throw new Error('something covers the big Enter VR button');
        await P.page.$eval('#xr-go', (el) => el.click()); await waitFor(ev, presenting, 30000, 'VR again from the big button'); notes.push('big button → VR');
      }
    }
    if (P.errors.length) throw new Error('page errors: ' + P.errors.slice(0, 3).join(' | '));
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); }
  if (P) { try { await P.page.screenshot({ path: `/tmp/roboapp-${name}${ok ? '' : '-FAIL'}.png` }); } catch (e) { /* gone */ } await P.page.close().catch(() => {}); }
  results.push({ name, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(6) + ` ${Math.round((Date.now() - t0) / 1000)}s` + (notes.length ? '  ' + notes.join(' · ') : '') + (ok ? '' : '  · ' + why));
}
await b.close();
console.log(`${results.filter((r) => r.ok).length}/${results.length} cases pass`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
