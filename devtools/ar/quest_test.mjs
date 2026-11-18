// DUET AR on an emulated Meta Quest 3 (IWER, the Science Lab's local test copy): opening a card's link shows the "On my
// table" button; a tap starts mixed reality; with no room surfaces (IWER has none) the model is put in front of the user
// with the trigger; pointing at it and pulling the trigger shows the part's label; the buttons work; "End" leaves.
// Needs the static server on AR_BASE (default http://127.0.0.1:8817/). Usage: node devtools/ar/quest_test.mjs [card id]
import puppeteer from 'puppeteer-core';
const BASE = process.env.AR_BASE || 'http://127.0.0.1:8817/', S = process.env.AR_SCRATCH || '/tmp/claude-0/agent-ar2/';
const id = process.argv[2] || 'heart', sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 300000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const pg = await b.newPage(); await pg.setViewport({ width: 900, height: 700 });
const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
await pg.goto(BASE + 'ar/index.html?iwer=1&c=' + id, { waitUntil: 'load' });
await pg.waitForSelector('#b-mr', { timeout: 30000 });
const banner = await pg.evaluate(() => document.querySelector('.quest').innerText.replace(/\s+/g, ' '));
console.log('headset found, banner:', banner.slice(0, 160));
await pg.screenshot({ path: S + 'shots/quest-home.png' });
await pg.click('#b-mr');
await pg.waitForFunction(() => window.__mr && window.__mr.holder, { timeout: 60000 });
console.log('mixed reality started for', await pg.evaluate(() => window.__mr.item.id));
await sleep(3500);   // no surface in the emulator: the hint changes to "put it in front of you"
const press = async () => pg.evaluate(async () => { const c = window.xrdev.controllers.right; c.updateButtonValue('trigger', 1); await new Promise((r) => setTimeout(r, 200)); c.updateButtonValue('trigger', 0); await new Promise((r) => setTimeout(r, 300)); });
await pg.evaluate(() => { const c = window.xrdev.controllers.right; c.position.set(0.15, 1.3, -0.1); c.quaternion.set(-0.2588, 0, 0, 0.9659); });   // pointing ahead, a little down
await press();
const placed = await pg.evaluate(() => ({ placed: window.__mr.placed, at: window.__mr.holder.position.toArray().map((v) => +v.toFixed(2)), visible: window.__mr.holder.visible }));
console.log('trigger → placed', placed.placed, 'at', placed.at.join(', '), 'visible', placed.visible);
// point at the model and pull the trigger: its label
await pg.evaluate(() => {
  const h = window.__mr.holder, c = window.xrdev.controllers.right, from = [0.15, 1.3, -0.1];
  const box = new h.position.constructor(); const p = h.position.clone(); p.y += 0.06; const d = p.clone().sub(box.set(...from)).normalize();
  // a quaternion turning -z onto d
  const z = new h.position.constructor(0, 0, -1), ax = z.clone().cross(d), w = 1 + z.dot(d), l = Math.hypot(ax.x, ax.y, ax.z, w);
  c.position.set(...from); c.quaternion.set(ax.x / l, ax.y / l, ax.z / l, w / l);
});
await press(); await sleep(500);
const label = await pg.evaluate(() => { let v = false; window.__mr.scene.traverse((o) => { if (o.userData && o.userData.redraw && o.geometry && o.geometry.parameters && o.geometry.parameters.width === 0.34 && o.visible) v = true; }); return v; });
console.log('point at the model + trigger → label shown:', label);
await pg.evaluate(() => { window.__mr.press('apart', { userData: { redraw() {} } }); window.__mr.press('turn', { userData: { redraw() {} } }); });
await sleep(1500); await pg.screenshot({ path: S + 'shots/quest-mr.png' });
await pg.evaluate(() => window.__mr.press('exit'));
await pg.waitForFunction(() => !window.__mr, { timeout: 30000 }).then(() => console.log('End → back to the page')).catch(() => console.log('End: session did not end'));
console.log('page errors:', errs.length, errs.slice(0, 3).join(' | '));
await b.close();
