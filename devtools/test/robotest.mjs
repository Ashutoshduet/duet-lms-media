// DUET Robotics Lab 360: plays every lesson end to end through the real UI, as a student would: drags parts from the
// drawer onto the breadboard, drags wires from pin to hole, presses Check, edits the code, presses Run, presses buttons,
// turns knobs, slides the room light. Fails if a lesson cannot be completed or the page throws.
// `all` plays every lesson in the strip but the micro:bit's (robotest5.mjs): the robots, the new boards (board box, the phone
// on the bench, the magnet) and the school-lab projects (the scene's controls, the 3D remote and keypad, the card).
//   node devtools/test/robotest.mjs [lesson,lesson,...|all] [outdir]
//   env: PORT (8790), W, H (1280×720), PHONE=1 (915×412 touch, CPU ×4), PANEL=1 (teacher board on: big text), DEMO=1 (no school code),
//        SHOTS=1 (a picture per step), SLOW=n (a busy machine: every wait n times longer)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url); const { chromium, devices } = require('playwright');
const NEW = ['arm1', 'arm2', 'arm3', 'arm4', 'arm5', 'linecar', 'avoidcar', 'smartbin', 'btcar', 'hydarm'];
const ids = process.argv[2] === 'new' ? NEW : (process.argv[2] && process.argv[2] !== 'all') ? process.argv[2].split(',') : null;
const out = process.argv[3] || '/tmp/robotest'; fs.mkdirSync(out, { recursive: true });
const PORT = process.env.PORT || 8790, PHONE = !!process.env.PHONE, SHOTS = !!process.env.SHOTS, SLOW = +(process.env.SLOW || 1); // SLOW=3: a busy machine (all waits ×3)
const W = +(process.env.W || (PHONE ? 915 : 1280)), H = +(process.env.H || (PHONE ? 412 : 720));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext(PHONE ? { viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent } : { viewport: { width: W, height: H } });
if (!process.env.DEMO) await ctx.addInitScript(() => { try { localStorage.setItem('duet.lic.v1', JSON.stringify({ h: '9f2c7ab614f3df7c8bd3042fc66449b1ed96d8e750dd75323f4454448492e3e2', u: '2027-12-31', a: ['*'], n: 'Test school', k: 'TEST', t: Date.now() })); } catch (e) { /* none */ } });
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort()); // offline: nothing from the internet
const page = await ctx.newPage(); page.setDefaultTimeout(30000 * SLOW);
const errors = []; page.on('pageerror', (e) => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
if (PHONE) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
await page.goto(`http://127.0.0.1:${PORT}/robotics/index.html?test&pr=1&mute${process.env.PANEL ? '&panel=1' : ''}`, { waitUntil: 'commit' });
await page.waitForFunction(() => document.title === 'READY', null, { timeout: 180000 * SLOW });
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
async function waitFor(fn, ms, what) { ms *= SLOW; const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(250); } throw new Error('timed out: ' + what); }
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
// hold a joystick's stick pushed (dx, dy: −1 .. 1, screen directions) for ms, then let it spring back
async function stickHold(tag, dx, dy, ms) {
  const p = await ev((t) => window.robo.roleScreen(t, 'stick'), tag); const to = { x: p.x + dx * 80, y: p.y + dy * 80 };
  if (PHONE) { const cdp = await ctx.newCDPSession(page); const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); await tp('touchStart', p.x, p.y); for (let i = 1; i <= 8; i++) { await tp('touchMove', p.x + (to.x - p.x) * i / 8, p.y + (to.y - p.y) * i / 8); await sleep(16); } await sleep(ms); await tp('touchEnd'); await cdp.detach(); return; }
  await page.mouse.move(p.x, p.y); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(p.x + (to.x - p.x) * i / 8, p.y + (to.y - p.y) * i / 8); await sleep(16); } await sleep(ms); await page.mouse.up();
}
// hold a button of the robot's panel (the phone pad) down until the robot's state says so (or ms runs out)
async function holdUntil(sel, cond, ms = 15000) {
  const bx = await page.locator(sel).boundingBox(); const p = { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 }; const t0 = Date.now();
  const done = async () => (Date.now() - t0 > ms) || await ev(cond);
  if (PHONE) { const cdp = await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); while (!(await done())) await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); return; }
  await page.mouse.move(p.x, p.y); await page.mouse.down(); while (!(await done())) await sleep(40); await page.mouse.up();
}
const wbtn = (id) => page.click(`#w-ctl [data-id="${id}"] button`);
const wseg = async (id, v) => { await page.click(`#w-ctl [data-id="${id}"] button[data-v="${v}"]`); await sleep(150); };
const wrange = async (id, v) => { await page.locator(`#w-ctl [data-id="${id}"] input`).fill(String(v)); await sleep(150); };
async function knob(tag, dir) { const p = await ev((t) => window.robo.roleScreen(t, 'knob'), tag); await drag(p, { x: p.x + dir * 260, y: p.y - dir * 40 }, 16); }

// drive the Bluetooth car through a plan of letters, checked every 10 ms of simulated time inside the page (a test on a
// busy machine reacts too late to stop the car in P from outside it)
const parkPlan = () => ev(() => new Promise((res) => { const W = window.app.world; const u0 = W.update.bind(W); const P = [['F', (S) => S.x > 360], ['L', (S) => S.h > Math.PI - 0.1], ['F', (S) => S.z < 50]]; let i = 0, sent = null, t = 0;
  W.update = (dt) => { const r = u0(dt); t += dt; if (i >= P.length || t > 60) { W.update = u0; W.control('key', 'S'); res(i); return r; } const [k, c] = P[i]; if (c(W.sim)) { W.control('key', 'S'); i++; sent = null; } else if (sent !== k) { W.control('key', k); sent = k; } return r; }; }));
// batch 3 and 4 (the same actions robotest3.mjs / robotest4.mjs do, so `all` plays every lesson end to end)
const viewTo = async (v) => { await ev((v) => { window.app.stage.userMoved = false; window.app.stage.setView(v); }, v); await settle(); };
const sceneView = () => ev(() => window.app.rt.lesson.rview || 'scene3').then(viewTo);
const onCanvas = (p) => ev(([x, y]) => document.elementFromPoint(x, y) === window.app.stage.renderer.domElement, [p.x, p.y]);
const rc3 = async (k) => { await sceneView(); const p = await ev((k) => window.robo3.worldRole('rc3:' + k), k); if (!p) throw new Error('no 3D remote button ' + k); await tap(p); };
const key3 = async (keys) => { // the 3D keypad's keys on the bench
  const K = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D']; const at = (i) => ev((i) => window.robo3.roleAt('kp', 'key3:' + i), i);
  if (!(await onCanvas(await at(0))) || !(await onCanvas(await at(15)))) await viewTo('top');
  if (!(await onCanvas(await at(0)))) throw new Error('the 3D keypad is covered on the screen');
  for (const k of keys) { await tap(await at(K.indexOf(k))); await boardMs(200); }
};
// wait until the board has run ms of its own time (a slow software renderer: two key presses in one frame would reach the
// sketch at once, and Keypad's getKey() gives one key a scan, as on a real keypad)
const boardMs = async (ms) => { const t0 = await ev(() => window.app.lab.mcu.t); const w0 = Date.now(); while (Date.now() - w0 < 20000 * SLOW && (await ev(() => window.app.lab.mcu.t)) - t0 < ms * 1000) await sleep(50); await sleep(60); };
const kpanel = async (keys) => { for (const k of keys) { const r = ['123A', '456B', '789C', '*0#D'].findIndex((row) => row.includes(k)); await wseg('kp' + r, k); await boardMs(300); } };
// press a handle and keep it moved by (dx, dy) px until the step is done (the pan-tilt joystick held on a target)
async function holdMovedUntil(p, dx, dy, ms) {
  let cdp = null; const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  if (PHONE) { cdp = await ctx.newCDPSession(page); await tp('touchStart', p.x, p.y); } else { await page.mouse.move(p.x, p.y); await page.mouse.down(); }
  for (let i = 1; i <= 10; i++) { const x = p.x + dx * i / 10, y = p.y + dy * i / 10; if (PHONE) await tp('touchMove', x, y); else await page.mouse.move(x, y); await sleep(30); }
  const t0 = Date.now(); let ok = false; while (Date.now() - t0 < ms * SLOW) { if ((await st()).done) { ok = true; break; } await sleep(200); }
  if (PHONE) { await tp('touchEnd'); await cdp.detach(); } else await page.mouse.up();
  return ok;
}
const stick3 = (dx, dy) => async () => { await settle(); const p = await ev(() => window.robo.roleScreen('js', 'stick')); if (!(await holdMovedUntil(p, dx, dy, 30000))) throw new Error('the laser dot did not reach the target'); };
async function holdUntilAt(p, cond, ms = 6000) { // a finger kept on a point until the page says so
  let cdp = null; if (PHONE) { cdp = await ctx.newCDPSession(page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); } else { await page.mouse.move(p.x, p.y); await page.mouse.down(); }
  const t0 = Date.now(); await sleep(150); while (Date.now() - t0 < ms * SLOW && !(await ev(cond))) await sleep(60);
  if (PHONE) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); } else await page.mouse.up();
}
const selectPart = async (tag) => { await ev((t) => { const a = window.app; a.select({ part: a.lab.byTag(t) }); }, tag); await sleep(300); };
const phoneView = () => viewTo('phone4');
async function ptap(id) { // an item on the 3D phone's screen
  if (await ev(() => window.app.stage.viewName !== 'phone4')) await phoneView();
  await waitFor(async () => !!(await ev((i) => window.robo4.phoneItem(i), id)), 8000, 'phone item ' + id); await tap(await ev((i) => window.robo4.phoneItem(i), id)); await sleep(260);
}
async function openPage() { // the phone's browser: type the ESP32's address on the phone's keys, Go
  await waitFor(async () => !!(await ev(() => window.robo4.net().ip)), 60000, 'the ESP32 on the WiFi'); const ip = await ev(() => window.robo4.net().ip);
  await phoneView(); if ((await ev(() => window.robo4.phone().app)) !== 'browser') { await ptap('home'); await ptap('app:browser'); }
  await ptap('addr');
  if (!PHONE && await ev(() => document.activeElement && document.activeElement.id === 'phone4in')) { for (let i = 0; i < 24; i++) await page.keyboard.press('Backspace'); } else for (let i = 0; i < 24; i++) await ptap('key:⌫');
  await waitFor(async () => (await ev(() => window.robo4.phone().kbText)) === '', 4000, 'the address bar empty');
  for (const ch of ip) await ptap('key:' + ch); await ptap('key:Go');
  await waitFor(async () => { const p = await ev(() => window.robo4.phone()); return !!(p.page && p.page.code === 200); }, 12000, 'the page on the phone');
}
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
  // batch 2
  arm5: [async () => { for (let i = 0; i < 4 && !(await st()).done; i++) await stickHold('js', 1, 0, 2600); }, async () => { for (let i = 0; i < 4 && !(await st()).done; i++) await stickHold('js', 0, -1, 2400); }],
  smartbin: [async () => { await wbtn('wave'); await sleep(7000); }, async () => { await wbtn('wave'); }],
  btcar: [async () => { await page.click('#w-ctl .ph-pair'); },
    async () => { await holdUntil('#w-ctl [data-k="F"]', () => window.app.world.sim.odo > 250, 8000); await sleep(400); await holdUntil('#w-ctl [data-k="L"]', () => window.app.world.sim.flags.has('left'), 6000); },
    async () => { await sleep(500); await parkPlan(); }],
  // batch 3: the scene's controls, the 3D remote, the 3D keypad, the card, the joystick held on a target
  lcdtemp: [async () => { await wseg('chai', '1'); }],
  irrigate: [async () => { await wbtn('dry'); }, async () => { await wbtn('dry'); }],
  homeauto: [async () => { await rc3('1'); }, async () => { await wseg('rc0', '2'); }, async () => { await wseg('rc0', '1'); }, async () => { await sleep(400); await rc3('3'); }],
  burglar: [async () => { await sleep(2500); await wbtn('walk'); }, async () => { await sleep(2500); await wbtn('cat'); }],
  rfidlock: [async () => { await sleep(800); await wbtn('card'); }, async () => { await sleep(800); await sceneView(); const p = await ev(() => window.robo3.worldRole('card3:card')); if (p) await tap(p); else await wbtn('card'); }, async () => { await sleep(800); await wbtn('tag'); }],
  weather: [async () => { await wseg('sky', 'rainy'); }],
  keylock: [async () => { await kpanel(['1', '1', '1', '1', '#']); }, async () => { await settle(); await key3(['1', '2', '3', '4', '#']); }, async () => { await kpanel(['2', '5', '8', '0', '#']); }],
  gasalarm: [async () => { await wrange('leak', 30); }, async () => { await wrange('leak', 0); await wseg('win', '1'); }, async () => { await wseg('win', '0'); await wrange('leak', 30); }],
  pantilt: [stick3(-35, 37), stick3(35, -33), stick3(35, 33)],
  // batch 4: the board box, knobs, the touch plate, the phone on the bench, the magnet
  nano_traffic: [async () => { await viewTo('swap4'); await tap(await ev(() => window.robo4.boxScreen('nano'))); }],
  mega_bar: [async () => { await knob('pot1', 1); }, async () => { await knob('pot1', -1); }],
  esp_knob: [async () => { await knob('pot1', 1); }, async () => { await knob('pot1', -1); }],
  esp_touch: [async () => { await holdUntilAt(await ev(() => window.robo.roleScreen('pad1', 'cap')), () => window.app.rt.ledLit('led1')); }, async () => { await sleep(800); await holdUntilAt(await ev(() => window.robo.roleScreen('pad1', 'cap')), () => !window.app.rt.ledLit('led1')); }],
  esp_wifi: [async () => { await openPage(); }, async () => { await ptap('link:/on'); }, async () => { await waitFor(async () => (await ev(() => window.robo4.phone().page && window.robo4.phone().page.links.length)), 8000, 'page'); await ptap('link:/off'); }],
  esp_iot: [async () => { await openPage(); }, async () => { await viewTo('esp4'); await openPart('t1'); await setRange('#co-temp', 40); await phoneView(); }],
  esp_bt: [async () => { await phoneView(); await ptap('home'); await ptap('app:bt'); await ptap('bt:dev:DUET-ESP32'); }, async () => { await ptap('bt:send:1'); }, async () => { await ptap('bt:send:0'); }],
  esp_hall: [async () => { const p = await ev(() => window.robo4.roleCenter('mag1', 'knob')); await drag(p, { x: p.x + 260, y: p.y - 40 }, 16); await sleep(2500);
    if (!(await st()).done) { await selectPart('mag1'); if (await ev(() => window.app.lab.byTag('mag1').state.pole === 'S')) await page.click('#co-flip'); await setRange('#co-mdist', 5); } },
  async () => { await tap(await ev(() => window.robo.roleScreen('mag1', 'cap'))); await sleep(2500); if (!(await st()).done) { await selectPart('mag1'); await page.click('#co-flip'); } }],
  hydarm: [async () => { await wrange('push', 100); },
    async () => { await wseg('master', '5'); await wseg('slave', '20'); await wrange('push', 100); },
    async () => { await wseg('master', '20'); await wseg('slave', '5'); await wrange('push', 100); },
    async () => { await wseg('master', '10'); await wseg('slave', '10'); await wseg('fluid', 'air'); await wrange('push', 100); }],
};

const results = [];
const lessons = await ev(() => (window.app ? [...document.querySelectorAll('#strip .chip')].map((c) => c.dataset.lesson) : []));
for (const id of ids || lessons) {
  if (!ids && /^mb/.test(id)) { console.log('--   ' + id + ': a micro:bit lesson, played by robotest5.mjs'); continue; } // batch 5
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
      } else if (step.k === 'watch') { await stepDone(NEW.includes(id) ? 150000 : 40000, 'watch'); await nextIfNeeded(s.step); } // (a robot on a slow software renderer needs longer)
      else if (step.k === 'act') { await settle(); const f = (ACT[id] || [])[acts++]; if (f) await f(); await stepDone(30000, 'act ' + acts); await nextIfNeeded(s.step); }
      const s2 = await st(); if (s2.step === s.step && s.step === s.of - 1) break;
      if (s2.step === s.step && !s2.done) throw new Error(`stuck at step ${s.step} (${step.k})`);
    }
    await waitFor(async () => (await st()).complete, 30000, 'lesson complete');
    await snap(`${id}-complete`);
    ok = true;
  } catch (e) { why = String(e.message || e).slice(0, 300); await page.screenshot({ path: `${out}/FAIL-${id}.png` }).catch(() => {}); }
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
