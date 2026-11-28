// DUET STEM 360 (the hub app): which files each activity needs, so the hub can bundle a small base and download the rest.
//   node devtools/hub/packs.mjs crawl [--only <app|item id|prefix*>,…] [--jobs 2] [--redo]
//       opens every catalogue item in headless Chrome set up like the Android hub (a phone with the DuetNative bridge),
//       plays a Science/Maths activity's steps quickly, steps through a body lab or journey, records every request and
//       takes the card picture (raw PNGs and request lists in $HUB_WORK, default /tmp/duet-hub-work)
//   node devtools/hub/packs.mjs build
//       hub/packs.json: per app the base files (code, libraries, fonts, UI, the lab room: inside the APK) and per item the
//       extra files it downloads (models, textures, places, narration, pictures), each file once with its hash and size;
//       hub/thumbs/<item>.webp (640×360) from the pictures
// Needs the repo served at http://127.0.0.1:8797/ (python3 -m http.server 8797 --bind 127.0.0.1).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { REPO, WORK, ORIGIN, tracked, fileInfo, launch, newPage, closePage, sleep, idle, pool, readJSON } from './lib.mjs';
import { buildItems } from './catalog.mjs';

const CRAWL = path.join(WORK, 'crawl'), SHOTS = path.join(WORK, 'shots');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const q = (u, extra) => u + (u.includes('?') ? '&' : '?') + extra;
const HIDE_UI = 'body > *:not(#stage):not(#xrStage):not(canvas){visibility:hidden!important} #stage > *:not(canvas){visibility:hidden!important}';

// ------------------------------------------------------------------ how each app's activity is opened and looked at
async function hideUI(page, css = HIDE_UI) { await page.evaluate((c) => { const s = document.createElement('style'); s.id = '__hubshot'; s.textContent = c; document.head.appendChild(s); }, css); await sleep(700); }
async function showUI(page) { await page.evaluate(() => { const s = document.getElementById('__hubshot'); if (s) s.remove(); }); }
// a blank picture (the 3D view not drawn yet, or its context lost on a busy machine) is a few KB of one colour: it is taken
// again, after drawing the scene again (redraw), up to four times
async function shot(page, id, clip, redraw) {
  fs.mkdirSync(SHOTS, { recursive: true });
  let buf = null;
  for (let k = 0; k < 4; k++) {
    if (redraw) await page.evaluate(redraw).catch(() => {});
    await sleep(k ? 2000 : 300);
    buf = await page.screenshot({ ...(clip ? { clip } : {}) });
    if (buf.length > 12000) break;
  }
  if (buf.length <= 12000) page.rec.blank = true;
  fs.writeFileSync(path.join(SHOTS, id + '.png'), buf);
}

const OPEN = {
  async science(page, it, opt) { // Science Lab 360 and Maths Lab 360: open, picture, then play every step quickly
    const id = it.id.split('.')[1];
    const T = [Date.now()]; const mark = () => T.push(Date.now());
    await page.goto(ORIGIN + q(it.url, 'test&mute&fast&speed=20&pr=2&lang=en'), { waitUntil: 'load', timeout: 120000 }); mark();
    await page.waitForFunction((x) => document.title === 'READY' && window.app && app.runner && app.runner.exp && app.runner.exp.id === x, { timeout: 150000, polling: 300 }, id); mark();
    await idle(page, 1200, 30000); await sleep(800); mark();
    if (opt.thumb) { // the activity's own things framed: they fill most of the picture (no side offset for the step panel)
      await hideUI(page);
      const fit = await page.evaluate(async (isPlace) => {
        const T = await import(new URL('lib/three.module.js', document.baseURI).href); const a = app, cam = a.camera, ctl = a.controls;
        if (a.camGoal) { cam.position.copy(a.camGoal.p); ctl.target.copy(a.camGoal.t); a.camGoal = null; }
        a.__hubSave = { director: a.director, viewOffset: a.viewOffset }; a.director = () => {}; a.viewOffset = () => {}; // the app's own camera moves wait
        cam.clearViewOffset(); cam.updateProjectionMatrix();
        const objs = new Set(); for (const it of a.lab.items) if (it.g && it.g.visible !== false) objs.add(it.g);
        for (const v of Object.values((a.runner && a.runner.o) || {})) { const o = v && (v.g || (v.isObject3D ? v : null)); if (o && o.visible !== false) objs.add(o); }
        const box = new T.Box3(); for (const o of objs) { o.updateWorldMatrix(true, true); const bb = new T.Box3().setFromObject(o); if (!bb.isEmpty()) box.union(bb); }
        if (box.isEmpty()) return 'no box';
        const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
        const dir = cam.position.clone().sub(ctl.target).normalize(); const tall = size.y > Math.max(size.x, size.z) * 1.2;
        const el = Math.min(tall ? 0.5 : 0.9, Math.max(tall ? -0.1 : 0.42, Math.asin(Math.max(-1, Math.min(1, dir.y))))), az = Math.atan2(dir.x, dir.z);
        const D = new T.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
        const corners = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new T.Vector3(x, y, z));
        let d = Math.max(0.3, size.length() * 1.5);
        for (let k = 0; k < 8; k++) {
          cam.position.copy(c).addScaledVector(D, d); cam.lookAt(c); cam.updateMatrixWorld(); let m = 0;
          for (const p of corners) { const v = p.clone().project(cam); m = v.z > 1 ? Math.max(m, 4) : Math.max(m, Math.abs(v.x), Math.abs(v.y)); }
          d = Math.max(0.22, d * m / 0.82);
        }
        if (isPlace) d = Math.min(d, 18);
        cam.position.copy(c).addScaledVector(D, d); if (cam.position.y < 0.25) cam.position.y = 0.25;
        ctl.minDistance = 0; ctl.maxDistance = Infinity; ctl.minPolarAngle = 0; ctl.maxPolarAngle = Math.PI; ctl.target.copy(c); ctl.update();
        return { size: size.toArray().map((x) => +x.toFixed(2)), d: +d.toFixed(2) };
      }, !!it.place).catch((e) => 'fit failed: ' + e.message);
      page.rec.fit = fit;
      await shot(page, it.id, null, () => { const a = app; a.camGoal = null; a.camera.clearViewOffset(); a.camera.updateProjectionMatrix(); a.drawHold = false; if (a.renderer.shadowMap) a.renderer.shadowMap.needsUpdate = true; a.renderer.render(a.scene, a.camera); });
      await page.evaluate(() => { const a = app; if (a.__hubSave) { a.director = a.__hubSave.director; a.viewOffset = a.__hubSave.viewOffset; } }).catch(() => {});
      await showUI(page);
    }
    if (opt.play !== false) {
      await page.evaluate(() => { app.runner.play(); });
      mark(); await page.waitForFunction(() => app.runner.state === 'finished', { timeout: 60000, polling: 500 }).catch(() => { page.rec.note = 'steps did not finish in 60 s'; });
      mark(); await idle(page, 1000, 15000); mark();
    }
    page.rec.phases = T.slice(1).map((t, i) => t - T[i]);
  },
  async body(page, it, opt) { // Human Body 360: an organ lab or a journey, every step; or the free explore
    await page.goto(ORIGIN + q(it.url, 'pr=2'), { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => { const l = document.getElementById('loader'); return window.app && l && l.classList.contains('done'); }, { timeout: 150000, polling: 300 });
    await idle(page, 1500, 30000); await sleep(2500);
    if (opt.thumb) {
      await hideUI(page);
      // the camera where it is going, then closer: an organ lab's model fills the card, a journey's body a good part of it
      await page.evaluate((k) => { const a = app; if (a.camTween) { a.camera.position.copy(a.camTween.p1); a.controls.target.copy(a.camTween.t1); a.camTween = null; }
        if (k) a.camera.position.lerp(a.controls.target, k);
        a.controls.update(); a.camera.clearViewOffset(); a.camera.updateProjectionMatrix(); }, /^body\.lab-/.test(it.id) ? 0.55 : /^body\.j-/.test(it.id) ? 0.3 : 0);
      await shot(page, it.id, null, () => { const a = app; a.camTween = null; a.camera.clearViewOffset(); a.camera.updateProjectionMatrix(); a.renderer.render(a.scene, a.camera); });
      await showUI(page);
    }
    if (opt.play !== false) for (let k = 1; k < (it.steps || 0); k++) { await page.evaluate(() => app.next()); await sleep(900); await idle(page, 800, 8000); }
  },
  async space(page, it, opt) {
    if (it.view) { // a 3D page of the website (phone or tablet screen); an item with a VR scene too is then opened in the VR box as well
      await page.goto(ORIGIN + it.urls.screen, { waitUntil: 'load', timeout: 120000 });
      await idle(page, 1500, 30000); await sleep(2500);
      if (opt.thumb && !it.scene) { // the page's biggest 3D view alone (its labels and buttons hidden), else its first photos
        const has3d = await page.evaluate(() => { let best = null, ba = 0; for (const c of document.querySelectorAll('canvas')) { if (c.closest('[hidden]')) continue; const r = c.getBoundingClientRect(); if (r.width * r.height > ba && r.width > 200) { ba = r.width * r.height; best = c; } }
          document.querySelectorAll('[data-hubshot]').forEach((e) => e.removeAttribute('data-hubshot'));
          if (best) { best.setAttribute('data-hubshot', 'c'); best.scrollIntoView({ block: 'center' }); const st = document.createElement('style'); st.id = '__hubshot'; st.textContent = 'header,nav,.topbar,#top{visibility:hidden!important}'; document.head.appendChild(st);
            for (const sib of best.parentElement.children) if (sib !== best) sib.style.visibility = 'hidden'; return true; }
          const img = [...document.querySelectorAll('main img, section img')].find((i) => !i.closest('[hidden]') && i.getBoundingClientRect().width > 150); if (img) { img.setAttribute('data-hubshot', 'c'); img.closest('section, div').scrollIntoView({ block: 'start' }); } return false; });
        await sleep(1800);
        const el = await page.$('[data-hubshot]');
        if (el) { const b = await el.boundingBox(); const vp = page.viewport(); const box = has3d ? b : { x: 0, y: Math.max(0, b.y - 8), width: vp.width, height: vp.height - Math.max(0, b.y - 8) };
          const w = Math.min(box.width, vp.width), h = Math.min(box.height, w * 9 / 16); const ww = Math.min(w, h * 16 / 9);
          await shot(page, it.id, { x: Math.max(0, box.x + (box.width - ww) / 2), y: Math.max(0, box.y + (box.height - h) / 2), width: ww, height: h }); }
        else await shot(page, it.id);
        await showUI(page);
      }
      if (opt.play !== false) { // lazy pictures further down the page
        const hgt = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < hgt; y += 300) { await page.evaluate((v) => scrollTo(0, v), y); await sleep(150); }
        await idle(page, 1200, 15000);
      }
      if (!it.scene) return;
    }
    // a VR scene (phone VR box; the Quest opens the same scene)
    await page.goto(ORIGIN + it.urls.box, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('#boxGo', { visible: true, timeout: 60000 });
    await sleep(800); await page.click('#boxGo');
    await idle(page, 2000, 40000); await sleep(3500);
    if (opt.thumb) { // the left eye, middle part
      const vp = page.viewport(); const w = vp.width / 2, h = Math.min(vp.height, w * 9 / 16);
      await shot(page, it.id, { x: 0, y: (vp.height - h) / 2, width: w, height: h });
    }
  },
  async robotics(page, it, opt) {
    await page.goto(ORIGIN + q(it.url, 'pr=2'), { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.app && document.readyState === 'complete', { timeout: 120000, polling: 300 });
    await idle(page, 1500, 30000); await sleep(2500);
    if (opt.thumb) { await hideUI(page); await sleep(600); await shot(page, it.id); await showUI(page); }
  },
  async drone(page, it, opt) {
    await page.goto(ORIGIN + q(it.url, 'pr=2'), { waitUntil: 'load', timeout: 120000 });
    await idle(page, 2000, 40000); await sleep(1500);
    await page.evaluate(() => { const b = document.getElementById('bFly'); if (b) b.click(); }); // fly, seen from behind
    await sleep(2500); await page.evaluate(() => { const b = document.getElementById('bView'); if (b) b.click(); });
    await idle(page, 1500, 20000); await sleep(2000);
    if (opt.thumb) { await hideUI(page, 'body > *:not(#app){visibility:hidden!important} #app > *:not(#view){visibility:hidden!important} #view > *:not(canvas){visibility:hidden!important}'); await sleep(800); await shot(page, it.id); await showUI(page); }
  },
};
OPEN.maths = OPEN.science;
export { OPEN };

// the app opened with no activity: what every activity of it needs anyway (the base)
const BOOT = {
  science: async (page) => { await page.goto(ORIGIN + 'science/index.html?test&mute&pr=2', { waitUntil: 'load', timeout: 120000 }); await page.waitForFunction(() => document.title === 'READY', { timeout: 150000 }); await idle(page, 2000, 30000); },
  maths: async (page) => { await page.goto(ORIGIN + 'maths/index.html?test&mute&pr=2', { waitUntil: 'load', timeout: 120000 }); await page.waitForFunction(() => document.title === 'READY', { timeout: 150000 }); await idle(page, 2000, 30000); },
  body: async (page) => { await page.goto(ORIGIN + 'body/index.html?pr=2', { waitUntil: 'load', timeout: 120000 }); await page.waitForFunction(() => { const l = document.getElementById('loader'); return l && l.classList.contains('done'); }, { timeout: 150000 }); await idle(page, 2000, 30000); },
  // the Solar System's text page: its code only (the 3D home with every world's map is an activity of its own)
  space: async (page) => { await page.goto(ORIGIN + 'space/index.html#sources', { waitUntil: 'load', timeout: 120000 }); await idle(page, 2000, 30000); },
  robotics: async (page) => { await page.goto(ORIGIN + 'robotics/index.html?pr=2', { waitUntil: 'load', timeout: 120000 }); await idle(page, 2000, 30000); },
  drone: async (page) => { await page.goto(ORIGIN + 'drone/index.html?pr=2', { waitUntil: 'load', timeout: 120000 }); await idle(page, 2000, 30000); },
};

function pick(items) {
  const only = arg('--only'); if (!only) return items;
  const keys = only.split(',');
  return items.filter((it) => keys.some((k) => k === it.app || k === it.id || (k.endsWith('*') && it.id.startsWith(k.slice(0, -1)))));
}

async function crawl() {
  const items = pick(await buildItems()); const jobs = +arg('--jobs', 2);
  fs.mkdirSync(CRAWL, { recursive: true });
  // not crawled yet, or crawled with an error (an earlier run, a crash): (again)
  const fresh = (key) => { if (has('--redo')) return false; const c = readJSON(path.join(CRAWL, key + '.json')); return c && !c.err; };
  const todo = items.filter((it) => !fresh(it.id));
  const apps = [...new Set(items.map((i) => i.app))];
  const boots = apps.filter((a) => !fresh('_boot.' + a));
  console.log(`crawl: ${todo.length} of ${items.length} items, ${boots.length} boots, ${jobs} at once`);
  // each worker has its own browser (a crash costs one page, not all of them), started again when it dies and every 30 pages
  const B = [];
  // --shared: one browser for every page (a quiet machine); it is started again only when it has died
  const SHARED = has('--shared'); let starting = null;
  const getBrowser = async (w) => {
    if (SHARED) { w = 0; const b = B[0]; if (b && b.br && b.br.connected) return b; if (starting) return starting; starting = (async () => { B[0] = { br: await launch(), used: 0 }; return B[0]; })(); try { return await starting; } finally { starting = null; } }
    const b = B[w]; if (b && b.br && b.br.connected && b.used < 30) return b;
    if (b && b.br) await b.br.close().catch(() => {});
    B[w] = { br: await launch(), used: 0 }; return B[w];
  };
  const t0 = Date.now(); let done = 0; const total = todo.length + boots.length;
  const one = async (key, fn, info, w = 0) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const b = await getBrowser(w); b.used++; const br = b.br;
      let page; try { page = await newPage(br, { width: 640, height: 360, scale: 2 }); } catch (e) { b.used = 99; continue; }
      const t1 = Date.now(); let err = null;
      try { await Promise.race([fn(page), sleep(300000).then(() => { throw new Error('took over 5 min'); })]); } catch (e) { err = String(e.message || e).slice(0, 200); }
      const rec = page.rec; await closePage(page);
      if (err && attempt === 0) { if (!br.connected) b.used = 99; console.log(`   ${key}: ${err} (trying again)`); continue; }
      const out = { id: key, ms: Date.now() - t1, reqs: [...new Set(rec.reqs)], errors: rec.errors, failed: rec.failed, note: rec.note || null, phases: rec.phases, blank: rec.blank || undefined, err, ...info };
      fs.writeFileSync(path.join(CRAWL, key + '.json'), JSON.stringify(out));
      done++; console.log(`${done}/${total} ${key} ${out.ms} ms, ${out.reqs.length} files${err ? ' ERROR ' + err : ''}${rec.errors.length ? ' pageerrors ' + rec.errors.length : ''}${out.note ? ' ' + out.note : ''} [${Math.round((Date.now() - t0) / 1000)} s]`);
      return;
    }
  };
  for (const a of boots) await one('_boot.' + a, (p) => BOOT[a](p), { app: a });
  await pool(todo, jobs, async (it, k, w) => { await one(it.id, (p) => OPEN[it.app](p, it, { thumb: true }), { app: it.app }, w); });
  for (const b of B) if (b && b.br) await b.br.close().catch(() => {});
  console.log(`crawl done in ${Math.round((Date.now() - t0) / 1000)} s`);
}

// ------------------------------------------------------------------ the files each item needs that the crawl cannot see
const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
async function staticFiles(items) {
  const T = tracked(); const add = new Map(); const put = (id, p) => { if (!T.has(p)) return; if (!add.has(id)) add.set(id, new Set()); add.get(id).add(p); };
  const byId = new Map(items.map((i) => [i.id, i]));
  // Science and Maths Lab: the narration of the title, aim, steps and result (English and Hindi; Hinglish uses the Hindi voice)
  // and the 360° place photo of an activity in a real place
  const { ALL_EXPERIMENTS } = await import(path.join(REPO, 'science/js/experiments.js'));
  const t = (o, L) => (o ? o[L] || o.en || '' : '');
  const IMG = {}, BUILT = new Set();
  for (const f of fs.readdirSync(path.join(REPO, 'science/js'))) {
    if (!f.endsWith('.js')) continue; const src = fs.readFileSync(path.join(REPO, 'science/js', f), 'utf8');
    for (const m of src.matchAll(/(?:^|[\s{,])(?:PLACES\.)?([a-z_][a-z0-9_]*)\s*[:=]\s*\{\s*(build:\s*\w+,\s*)?img:\s*'([^']+)'/gm)) { IMG[m[1]] = m[3]; if (m[2]) BUILT.add(m[1]); }
  }
  for (const e of ALL_EXPERIMENTS) {
    const it = byId.get('science.' + e.id) || byId.get('maths.' + e.id); if (!it) continue;
    for (const L of ['en', 'hi']) {
      const v = (s) => s && put(it.id, `science/voice/${L}/${vkey(s)}.mp3`);
      v(t(e.title, L) + '.'); v(t(e.aim, L)); v(t(e.result && e.result.concl, L));
      for (const s of e.steps || []) { v(t(s.do, L)); v(t(s.see, L)); v(t(s.why, L)); }
    }
    if (e.place && !BUILT.has(e.place) && IMG[e.place]) for (const x of ['.jpg', '_1k.hdr']) put(it.id, `maths/places/${IMG[e.place]}${x}`);
  }
  // Human Body 360: each step's narration in English, Hindi and Hinglish; the parts a lab or journey shows; every part's
  // narration for the free explore
  const content = JSON.parse(fs.readFileSync(path.join(REPO, 'body/models/content.json'), 'utf8'));
  const { JOURNEYS } = await import(path.join(REPO, 'body/js/data.js'));
  const alias = {}; { const s = fs.readFileSync(path.join(REPO, 'body/js/content.js'), 'utf8'); const m = /export const GROUP_ALIAS = (\{[\s\S]*?\});/.exec(s); if (m) Object.assign(alias, new Function('return ' + m[1])()); }
  const partKey = (id) => (content.parts[id] ? id : alias[id] && content.parts[alias[id]] ? alias[id] : id);
  const aud = (id, key) => { for (const L of content.audio[key] || []) put(id, `body/audio/${L}/${key}.mp3`); };
  for (const it of items.filter((i) => i.app === 'body')) {
    if (it.id === 'body.explore') { for (const k of Object.keys(content.audio)) if (k.startsWith('part-')) aud(it.id, k); continue; }
    const m = /^body\.(lab|j)-(.+)$/.exec(it.id); if (!m) continue;
    if (m[1] === 'lab') {
      for (let n = 1; n <= (it.steps || 0); n++) aud(it.id, `lab-${m[2]}-${n}`);
      const lj = readJSON(path.join(REPO, `body/models/labs/${m[2]}.json`), {}); for (const p of lj.parts || []) aud(it.id, 'part-' + partKey(p));
    } else {
      const j = JOURNEYS.find((x) => x.id === m[2]); if (!j) continue;
      j.steps.forEach((s, i) => { aud(it.id, `${j.id}-${i + 1}`); for (const p of [...(s.labels || []), ...(s.focus || [])]) aud(it.id, 'part-' + partKey(p)); });
    }
  }
  // Solar System 360: what a scene can load later (each rocket, each landing site, each film), by folder, and its narration
  const SPACE = [
    [/^space\/(ch3\/|video\/ch3-)/, ['space.ch3']],
    [/^space\/pano\//, ['space.land360']], [/^space\/img\/land\//, ['space.land360']],
    [/^space\/rs\/pano\//, ['space.tours']],
    [/^space\/rs\/models\//, ['space.museum', 'space.rsizes', 'space.pad', 'space.rgame']], [/^space\/rs\/env\//, ['space.pad', 'space.rsizes', 'space.museum']],
    [/^space\/rs\/img\//, ['space.imissions']], [/^space\/img\/missions\//, ['space.imissions']],
    [/^space\/(models|img)\/craft\//, ['space.craft']],
    [/^space\/sfx\/planet\//, ['space.planets']], [/^space\/models\/(phobos|deimos)/, ['space.planets', 'space.mars', 'space.moons']], [/^space\/tex\/moons\//, ['space.planets', 'space.moons']],
    [/^space\/sky\//, ['space.stars']], [/^space\/img\/milkyway\//, ['space.stars', 'space.gallery']],
    [/^space\/audio\/[a-z]+\/ch3-/, ['space.ch3']], [/^space\/audio\/[a-z]+\/craft-/, ['space.craft']], [/^space\/audio\/[a-z]+\/mu-/, ['space.museum']],
    [/^space\/audio\/[a-z]+\/orb-/, ['space.orbits']], [/^space\/audio\/[a-z]+\/pano-/, ['space.tours']], [/^space\/audio\/[a-z]+\/rk-/, ['space.rsizes', 'space.pad']],
    [/^space\/audio\/[a-z]+\/ui-compare/, ['space.compare']], [/^space\/audio\/[a-z]+\/ui-(countdown|separate)/, ['space.pad', 'space.rgame']],
    [/^space\/audio\/[a-z]+\/ui-(game-rocket|win-rocket|grab|try|good)/, ['space.rgame', 'space.sgame']], [/^space\/audio\/[a-z]+\/ui-(game-solar|win-solar)/, ['space.sgame']],
    [/^space\/audio\/[a-z]+\/ui-stars/, ['space.stars']],
    [/^space\/audio\/[a-z]+\/(sun|mercury|venus|earth|moon|mars|jupiter|saturn|uranus|neptune|pluto|callisto|charon|deimos|enceladus|europa|ganymede|io|oberon|phobos|rhea|titan|titania|triton)\.mp3$/, ['space.planets', 'space.solar']],
  ];
  // (never the 8k panoramas and sky: the app loads those only on a headset or a computer, never on an Android phone)
  for (const p of T) if (p.startsWith('space/') && !/[-_]8k\.jpg$/.test(p)) for (const [re, ids] of SPACE) if (re.test(p)) for (const id of ids) if (byId.has(id)) put(id, p);
  for (const b of ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
    if (!byId.has('space.' + b)) continue;
    for (const p of T) if (p.startsWith(`space/img/${b}/`) || new RegExp(`^space/audio/[a-z]+/${b}\\.mp3$`).test(p)) put('space.' + b, p);
  }
  return add;
}

// files never in the base: narration, the other Indian languages, test files
// (and, for a phone: the fonts of the other Indian scripts, used only when the app is switched to those languages, and
// the Quest controller and hand models, used only inside a headset's WebXR view, which the Android app never opens)
const NEVER_BASE = /^(science\/voice\/(en|hi)\/|body\/audio\/|space\/audio\/|science\/i18n\/|body\/i18n\/|robotics\/i18n\/|[^/]+\/(test|tools|store-art)\/)|\/fonts\/ns-(beng|gujr|knda|mlym|orya|taml|telu)-|\/lib\/xr\/.*\.glb$/;
// always in the base: the code, libraries, fonts, logos and icons an app needs to start and to move between its activities
const CODE = /\.(js|mjs|css|html|webmanifest|wasm)$|\/(fonts|brand|lib|vendor)\//;

async function build() {
  const items = await buildItems(); const T = tracked();
  const crawl = new Map(); const raw = {};
  for (const it of items) { const c = readJSON(path.join(CRAWL, it.id + '.json')); if (c) crawl.set(it.id, c); }
  const appsOf = [...new Set(items.map((i) => i.app))];
  for (const a of appsOf) raw[a] = readJSON(path.join(CRAWL, '_boot.' + a + '.json'), { reqs: [] });
  const missingCrawl = items.filter((i) => !crawl.has(i.id)).map((i) => i.id);
  const extra = await staticFiles(items);
  const need = new Map(); // item -> Set of repo files it touches
  for (const it of items) {
    const s = new Set(); for (const p of (crawl.get(it.id) || { reqs: [] }).reqs) if (T.has(p)) s.add(p);
    // and what the check run saw this activity ask for (devtools/hub/check.mjs): a miss it found is in the next build
    const ck = readJSON(path.join(WORK, 'check', it.id + '.json')); if (ck) for (const p of [...(ck.reqs || []), ...(ck.missing || [])]) if (T.has(p)) s.add(p);
    for (const p of extra.get(it.id) || []) s.add(p);
    need.set(it.id, s);
  }
  // the base of each app: what it loads with no activity open, what every one of its activities loads, and its code
  const DIR = { science: ['science/'], maths: ['maths/'], body: ['body/'], space: ['space/'], robotics: ['robotics/'], drone: ['drone/'] };
  const base = {}; const inBase = new Set(); const common = new Set(); // common: what every activity of its app loads
  for (const a of appsOf) {
    const s = new Set(); const its = items.filter((i) => i.app === a && crawl.has(i.id));
    for (const p of raw[a].reqs) if (T.has(p) && !NEVER_BASE.test(p)) s.add(p);
    if (its.length) { const cnt = new Map(); for (const it of its) for (const p of need.get(it.id)) cnt.set(p, (cnt.get(p) || 0) + 1); for (const [p, n] of cnt) if (n === its.length) { common.add(p); if (!NEVER_BASE.test(p)) s.add(p); } }
    for (const p of T) if (DIR[a].some((d) => p.startsWith(d)) && CODE.test(p) && !NEVER_BASE.test(p) && !/\/(privacy|credits|support|QUEST|README)/.test(p) && !/(^|\/)sw\.js$/.test(p)) s.add(p);
    base[a] = s; for (const p of s) inBase.add(p);
  }
  // the hub's own files and the school-code list
  // (with the help, privacy and credits pages its More tab links to, and the credit lists the credits page reads)
  const hub = new Set([...T].filter((p) => p.startsWith('hub/') || p === 'licences.json' || p === 'support.html' || p === 'science/privacy.html' || p === 'science/credits.html' || /^science\/(.*\/)?credits\.json$/.test(p)));
  for (const p of fs.readdirSync(path.join(REPO, 'hub'), { recursive: true })) { const f = 'hub/' + p.replace(/\\/g, '/'); if (fs.statSync(path.join(REPO, f)).isFile() && !/\.(md|txt|py)$/.test(f) && !/(^|\/)(sw\.js|offline\.json|packs\.json)$/.test(f)) hub.add(f); }
  for (const p of hub) inBase.add(p);
  // files: one table, each file once
  const files = []; const idx = new Map();
  const ix = (p) => { if (!idx.has(p)) { const [h, n] = fileInfo(p); idx.set(p, files.length); files.push([p, h, n]); } return idx.get(p); };
  const out = { v: 1, built: new Date().toISOString(), remote: 'https://ashutoshduet.github.io/duet-lms-media/', files, apps: {}, items: {} };
  for (const a of appsOf) { const l = [...base[a]].sort(); out.apps[a] = { files: l.map(ix), bytes: l.reduce((t, p) => t + fileInfo(p)[1], 0) }; }
  out.apps.hub = { files: [...hub].sort().filter((p) => p !== 'hub/packs.json').map(ix), bytes: 0 };
  for (const it of items) {
    const l = [...need.get(it.id)].filter((p) => !inBase.has(p)).sort();
    // the 3D models this activity itself shows (not the lab room every activity of the app has): for a model viewer
    const models = [...need.get(it.id)].filter((p) => /\.(glb|gltf)$/.test(p) && !common.has(p) && !/\/lib\/xr\//.test(p)).sort();
    out.items[it.id] = { app: it.app, files: l.map(ix), bytes: l.reduce((t, p) => t + fileInfo(p)[1], 0), ...(models.length ? { models } : {}) };
  }
  out.apps.hub.bytes = out.apps.hub.files.reduce((t, i) => t + files[i][2], 0);
  fs.writeFileSync(path.join(REPO, 'hub/packs.json'), JSON.stringify(out));
  // report
  const mb = (b) => (b / 1e6).toFixed(1);
  console.log(`hub/packs.json: ${files.length} files, ${items.length} items${missingCrawl.length ? `, NOT CRAWLED: ${missingCrawl.length} (${missingCrawl.slice(0, 8).join(' ')}…)` : ''}`);
  const used = new Set(); for (const it of items) for (const i of out.items[it.id].files) used.add(files[i][0]);
  for (const a of [...appsOf, 'hub']) {
    const its = items.filter((i) => i.app === a); const dl = new Set(); for (const it of its) for (const i of out.items[it.id].files) dl.add(i);
    const dlb = [...dl].reduce((t, i) => t + files[i][2], 0);
    console.log(`  ${a.padEnd(9)} base ${mb(out.apps[a].bytes).padStart(6)} MB (${out.apps[a].files.length} files) · downloads ${mb(dlb).padStart(6)} MB over ${its.length} items`);
  }
  const all = new Set(); for (const a of Object.values(out.apps)) for (const i of a.files) all.add(i);
  console.log(`  APK content (all bases + hub): ${mb([...all].reduce((t, i) => t + files[i][2], 0))} MB`);
  // published files no item and no base uses (they are not reachable in the Android hub)
  const orphan = {}; for (const p of T) { const a = p.split('/')[0]; if (!DIR[a] || inBase.has(p) || used.has(p)) continue; orphan[a] = orphan[a] || [0, 0, {}]; orphan[a][0]++; orphan[a][1] += fs.statSync(path.join(REPO, p)).size; const d = p.split('/').slice(0, 3).join('/'); orphan[a][2][d] = (orphan[a][2][d] || 0) + 1; }
  for (const [a, [n, b, d]] of Object.entries(orphan)) console.log(`  not in any pack: ${a} ${n} files ${mb(b)} MB  ${Object.entries(d).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => k + ':' + v).join(' ')}`);
  fs.writeFileSync(path.join(WORK, 'orphans.json'), JSON.stringify(orphan));
  // the card pictures
  thumbs(items);
}

function thumbs(items) {
  const dir = path.join(REPO, 'hub/thumbs'); fs.mkdirSync(dir, { recursive: true });
  const list = items.filter((it) => fs.existsSync(path.join(SHOTS, it.id + '.png'))).map((it) => [path.join(SHOTS, it.id + '.png'), path.join(dir, it.id + '.webp')]);
  const job = path.join(WORK, 'thumbs.json'); fs.writeFileSync(job, JSON.stringify(list));
  const py = `import json,sys\nfrom PIL import Image, ImageStat\nfor a,b in json.load(open(sys.argv[1])):\n  im=Image.open(a).convert('RGB'); w,h=im.size; t=w*9/16\n  if h>t: im=im.crop((0,int((h-t)/2),w,int((h-t)/2+t)))\n  elif h<t: nw=h*16/9; im=im.crop((int((w-nw)/2),0,int((w-nw)/2+nw),h))\n  im=im.resize((640,360),Image.LANCZOS)\n  q=88\n  while True:\n    im.save(b,'WEBP',quality=q,method=6)\n    import os\n    if os.path.getsize(b)<=24000 or q<=60: break\n    q-=6\n`;
  const pf = path.join(WORK, 'thumbs.py'); fs.writeFileSync(pf, py);
  execFileSync('python3', [pf, job], { stdio: 'inherit' });
  let tot = 0; for (const [, b] of list) tot += fs.statSync(b).size;
  console.log(`hub/thumbs: ${list.length} pictures, ${(tot / 1e6).toFixed(1)} MB (${Math.round(tot / Math.max(1, list.length) / 1000)} KB each)`);
}

// the card pictures again, for items whose picture is missing or blank (or --only …): opened without playing the steps
async function reshoot() {
  const items = pick(await buildItems()); const forced = !!arg('--only');
  const todo = items.filter((it) => { const f = path.join(SHOTS, it.id + '.png'); return forced || !fs.existsSync(f) || fs.statSync(f).size <= 12000; });
  console.log(`reshoot: ${todo.length} pictures`);
  let br = await launch(); let n = 0; const t0 = Date.now();
  await pool(todo, +arg('--jobs', 2), async (it) => {
    for (let a = 0; a < 2; a++) {
      if (!br.connected) br = await launch();
      const page = await newPage(br, { width: 640, height: 360, scale: 2 }); let err = null;
      try { await Promise.race([OPEN[it.app](page, it, { thumb: true, play: false }), sleep(180000).then(() => { throw new Error('took over 3 min'); })]); } catch (e) { err = String(e.message || e).slice(0, 120); }
      const blank = page.rec.blank; await closePage(page);
      if (!err && !blank) { n++; console.log(`${n}/${todo.length} ${it.id} [${Math.round((Date.now() - t0) / 1000)} s]`); return; }
      console.log(`   ${it.id}: ${err || 'blank'}${a ? '' : ' (trying again)'}`);
    }
  });
  await br.close().catch(() => {});
}

const cmd = process.argv[1] && import.meta.url.endsWith('/' + path.basename(process.argv[1])) ? process.argv[2] : null; // not when imported
if (cmd === 'crawl') await crawl();
else if (cmd === 'build') await build();
else if (cmd === 'thumbs') thumbs(pick(await buildItems()));
else if (cmd === 'reshoot') await reshoot();
else if (cmd) { console.log('usage: packs.mjs crawl|build|thumbs [--only …] [--jobs n] [--redo]'); process.exit(1); }
