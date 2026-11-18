// The DUET AR card scanner end to end in headless Chrome: a fake camera video of a printed card (card_video.py) is the
// camera; the real page (ar/index.html?scan=1) must find the card by itself, load that card's model and stand it on the card.
// Saves a screenshot per card, and on the first card also taps a part, takes it apart, opens 360° and VR and comes back.
// Also: a card laid on the DUET Pad (pad mode and scan mode), and the tracker speed with the CPU slowed 4× (a low-end phone).
// Needs the static server on AR_BASE (default http://127.0.0.1:8817/). Usage: node devtools/ar/scan_test.mjs [card numbers…]
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname, BASE = process.env.AR_BASE || 'http://127.0.0.1:8817/';
const S = process.env.AR_SCRATCH || '/tmp/claude-0/agent-ar2/', SHOTS = S + 'shots/', VID = S + 'video/';
mkdirSync(SHOTS, { recursive: true }); mkdirSync(VID, { recursive: true });
const cat = JSON.parse(readFileSync(ROOT + 'ar/catalog.json', 'utf8'));
const byCard = (n) => cat.items.find((x) => x.card === n);
const want = process.argv.slice(2).map(Number);
const CARDS = want.length ? want : [0, 10, 21, 24, 30, 36, 49, 52];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function video(name, args) { const f = VID + name + '.mjpeg'; if (!existsSync(f)) execFileSync('python3', [ROOT + 'devtools/ar/card_video.py', f, ...args.map(String)], { env: { ...process.env, AR_SCRATCH: S } }); return f; }
async function open(file, url, vp, throttle) {
  const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 300000,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + file] });
  const pg = await b.newPage(); await pg.setViewport(vp);
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
  if (throttle) { const c = await pg.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
  await pg.goto(BASE + 'ar/index.html' + url, { waitUntil: 'load', timeout: 120000 });
  return { b, pg, errs };
}
/** waits until the page shows card n's model on the card; returns the state */
async function waitCard(pg, n, ms = 90000) {
  await pg.waitForFunction((n) => { const a = window.__ar; if (!a || !a.ctl || !a.item || a.item.card !== n || !a.model) return false; const s = a.ctl.state(); return s.track === 'tracking' && a.ctl.anchor.visible; }, { timeout: ms, polling: 200 }, n);
  return pg.evaluate(() => window.__ar.ctl.state());
}
const results = [];
// ---------------------------------------------------------------- each card: found by itself, model on the card, screenshot
for (const n of CARDS) {
  const it = byCard(n), f = video('card' + n, [n, 45, '--dist', 0.34, '--tilt', 40]);
  const { b, pg, errs } = await open(f, '?scan=1&lang=en', { width: 960, height: 540, deviceScaleFactor: 1 });
  const t0 = Date.now(); let st = null, ok = false;
  try { st = await waitCard(pg, n); ok = true; } catch (e) { st = await pg.evaluate(() => window.__ar && window.__ar.ctl && window.__ar.ctl.state()).catch(() => null); }
  const secs = (Date.now() - t0) / 1000;
  await sleep(2500);
  await pg.screenshot({ path: SHOTS + `card-${String(n).padStart(2, '0')}-${it.id}.png` });
  const fps = await pg.evaluate(async () => { const a = window.__ar, f0 = a.frames, t = performance.now(); await new Promise((r) => setTimeout(r, 2000)); return (a.frames - f0) * 1000 / (performance.now() - t); });
  const s2 = await pg.evaluate(() => ({ ...window.__ar.ctl.state(), calls: window.__ar.renderer.info.render.calls, tris: window.__ar.renderer.info.render.triangles, item: window.__ar.item && window.__ar.item.id }));
  results.push({ n, id: it.id, ok, secs, item: s2.item, fps, tracker: s2.fps, ms: s2.ms, roi: s2.roi, frames: s2.frames, found: s2.found, calls: s2.calls, tris: s2.tris, errs: errs.length });
  console.log(`card ${n} ${it.id}: ${ok ? 'model on the card' : 'NOT FOUND'} after ${secs.toFixed(1)} s · shows ${s2.item} · draw ${fps.toFixed(1)} fps (software GL) · tracker ${s2.fps.toFixed(1)} fps ${s2.ms.toFixed(1)} ms · crops ${s2.roi}/${s2.frames} · found ${s2.found}/${s2.frames} · ${s2.calls} draw calls ${s2.tris} tris · errors ${errs.length}${errs.length ? ' ' + errs.slice(0, 2).join(' | ') : ''}`);
  // the first card: the buttons and a tap on a part
  if (n === CARDS[0] && ok) {
    let at = null, tag = null;
    for (let k = 0; k < 6 && !tag; k++) {   // (software GL draws a frame in ~0.5 s here: tap while the model is shown)
      await pg.waitForFunction(() => window.__ar.ctl.anchor.visible, { timeout: 30000, polling: 100 }).catch(() => {});
      at = await pg.evaluate(() => { const a = window.__ar, v = a.ctl.rig.getWorldPosition(a.camera.position.clone()); v.project(a.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
      await pg.mouse.click(at[0], at[1]); await sleep(800);
      tag = await pg.evaluate(() => { const el = document.getElementById('v-tag'); return el && !el.hidden ? el.querySelector('b').textContent : null; });
    }
    console.log('  tap on the model at', at.map(Math.round).join(','), '→ label:', tag);
    await pg.click('#b-apart'); await sleep(1500);
    const ex = await pg.evaluate(() => window.__ar.ctl.state().explode); await pg.screenshot({ path: SHOTS + `card-${n}-apart.png` });
    console.log('  take apart →', ex === 1 ? 'apart' : 'NOT apart', `(${await pg.evaluate(() => window.__ar.ctl.parts.length)} parts)`);
    await pg.click('#b-apart'); await sleep(300);
    await pg.click('#b-360'); await pg.waitForFunction(() => window.__ar.ctl && window.__ar.mode === 'gyro360', { timeout: 30000 }); await sleep(1200); await pg.screenshot({ path: SHOTS + `card-${n}-360.png` });
    await pg.click('#b-360'); await pg.waitForFunction(() => window.__ar.ctl && window.__ar.mode === 'scan', { timeout: 30000 });
    await pg.click('#b-vr'); await pg.waitForFunction(() => window.__ar.ctl && window.__ar.mode === 'vrbox', { timeout: 30000 }); await sleep(1200); await pg.screenshot({ path: SHOTS + `card-${n}-vr.png` });
    await pg.evaluate(() => document.getElementById('b-vrx').click()); await pg.waitForFunction(() => window.__ar.ctl && window.__ar.mode === 'scan', { timeout: 30000 });
    const back = await waitCard(pg, n).then(() => true).catch(() => false);
    console.log('  360° → back to the card, VR box → back to the card:', back ? 'ok' : 'FAILED', '· errors', errs.length);
  }
  await b.close();
}
// ---------------------------------------------------------------- a card on the DUET Pad
{
  const f = video('pad-card0', [0, 45, '--pad', '--dist', 0.45, '--tilt', 40]);
  for (const [mode, url] of [['scan', '?scan=1'], ['pad (heart chosen)', '?model=sun&mode=pad']]) {
    const { b, pg, errs } = await open(f, url, { width: 960, height: 540, deviceScaleFactor: 1 });
    let ok = false; try { await pg.waitForFunction(() => { const a = window.__ar; return a && a.ctl && a.item && a.item.card === 0 && a.ctl.state().track === 'tracking' && a.ctl.anchor.visible; }, { timeout: 60000, polling: 200 }); ok = true; } catch (e) { /* no */ }
    await sleep(2500);
    const st = await pg.evaluate(() => window.__ar.ctl && window.__ar.ctl.state());
    await pg.screenshot({ path: SHOTS + `pad-${mode.split(' ')[0]}.png` });
    console.log(`card on the pad, ${mode}: ${ok ? 'heart on the pad' : 'FAILED'} · on pad ${st && st.onPad} · item ${await pg.evaluate(() => window.__ar.item && window.__ar.item.id)} · errors ${errs.length}`);
    await b.close();
  }
}
// ---------------------------------------------------------------- a slow phone: CPU 4× slower, portrait 720×1280 camera
{
  const f = video('portrait36', [36, 60, '--w', 720, '--h', 1280, '--dist', 0.33, '--tilt', 35]);
  const { b, pg, errs } = await open(f, '?scan=1', { width: 412, height: 860, deviceScaleFactor: 2 }, 4);
  let ok = false; try { await waitCard(pg, 36, 120000); ok = true; } catch (e) { /* no */ }
  await sleep(4000);
  const s = await pg.evaluate(() => window.__ar.ctl.state());
  await pg.screenshot({ path: SHOTS + 'phone-portrait-kingfisher.png' });
  console.log(`portrait phone, CPU ×4 slower: ${ok ? 'found' : 'NOT FOUND'} · tracker ${s.fps.toFixed(1)} fps, ${s.ms.toFixed(1)} ms a frame, ${s.px} px · crops ${s.roi}/${s.frames} · errors ${errs.length}`);
  await b.close();
}
