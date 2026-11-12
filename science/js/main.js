// DUET Science Lab 360 — app shell: renderer, camera, the lab room, experiments, narration, screen + headset input.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRoom, BENCH_Y } from './room.js';
import { FX } from './fx.js';
import { Chem, SUBS, PPT } from './chem.js';
import { Lab } from './lab.js';
import { Runner } from './runner.js';
import { BY_ID } from './experiments.js';
import { I18N, DICT } from './exp_i18n.js';
import { Audio } from './audio.js';
import { UI } from './ui.js';
import { XRInput } from './xr.js';
import { loadModels, loadLabHDR, furnish, loadPhysModels } from './models.js';
import { initPhysics } from './physics.js';
import { ParticleView, HAS_PARTICLES } from './particles.js';
import { PHOTOS, photoImage } from './photos.js';
import { T, tx, LANGS, FONT } from './strings.js';
import { licenceGate, licenceInfo, licenceExpired, checkCode, licText } from './licence.js';
import { demoIds } from './topics.js';
import { LIQ_TIME } from './mats.js';

const Q = new URLSearchParams(location.search);
if (Q.has('iwer')) { try { await (await import('../test-iwer.js')).default(); } catch (e) { console.warn('no test hook', e); } } // test only
const store = { get(k) { try { return localStorage.getItem('sl360.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('sl360.' + k, v); } catch (e) {} } };
const SPEEDS = [1, 1.5, 2, 3];
const FAST = Q.has('fast');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// narration file key: djb2 over UTF-16 code units (the voice generator uses the same function)
export function vkey(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }

export class App {
  constructor() {
    this.lang = Q.get('lang') || store.get('lang') || 'en'; if (!LANGS.includes(this.lang)) this.lang = 'en';
    this.speed = +(Q.get('speed') || 1); this.muted = false; this.hideMarker = false; this.lapseShown = 0; this.t = 0; this.simT = 0; this._fc = 0;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.setSize(innerWidth, innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor'); r.xr.setFoveation(1); r.xr.setFramebufferScaleFactor(1.0); // measured on a Quest 3S: 1.3 + light foveation ran at 11 fps, 1.0 + full foveation at 84
    document.getElementById('stage').appendChild(r.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xdfe3e6);
    const pm = new THREE.PMREMGenerator(r); this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.55;
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.01, 40);
    this.camera.position.set(0, 1.36, 0.12);
    this.controls = new OrbitControls(this.camera, r.domElement); this.controls.target.set(0, BENCH_Y + 0.06, -0.62);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 0.12, maxDistance: 2.4, maxPolarAngle: Math.PI * 0.6, rotateSpeed: 0.6, zoomSpeed: 0.8, panSpeed: 0.6 });
    this.controls.update(); this.controls.addEventListener('start', () => { this.camGoal = null; this.userCam = true; });
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.roomInfo = buildRoom(this.world);
    this.audio = new Audio(); this.audio.voice = store.get('voice') !== '0' && !Q.has('mute');
    this.fx = new FX(this.scene); this.chem = new Chem(this.fx, this.audio); this.lab = new Lab(this.scene, this.fx, this.chem, this.audio);
    this.runner = new Runner(this);
    this.ui = new UI(this); this.ui.layoutVR();
    this.runner.on(() => { this.ui.renderStory(); this.ui.renderList(); this.ui.renderNotebook(); if (this.runner.i !== this._lastI) { this._lastI = this.runner.i; this.userCam = false; } });
    this.recent = new Map(); // item id -> time it last took part in something (the camera keeps those in view)
    this.lab.listeners.push((e) => { for (const k of ['to', 'from', 'v', 'in', 'obj', 'by']) if (e[k]) this.recent.set(e[k], this.t); });
    this.lab.listeners.push((e) => this.explain(e)); // when something goes wrong (or differently), say what happened and why
    this.initPourTag();
    this.xr = new XRInput(this);
    this.particles = new ParticleView(this); this.hasParticles = HAS_PARTICLES;
    this.clock = new THREE.Clock();
    // DUET STEM subscription: nothing opens without a valid code (local tests only skip it)
    // the installed headset app (?app=vr) opens straight into VR, where a page on the screen cannot be seen: there the code is typed on a keypad in the headset
    this.headsetApp = Q.get('app') === 'vr'; this.codeVR = null;
    this.lic = Q.has('test') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Promise.resolve({ ok: true })
      : this.headsetApp && !licenceInfo('science') ? Promise.resolve({ ok: false, demo: true }).then((r) => { this.codeVR = { code: '', first: true, exp: licenceExpired('science') }; return r; })
      : licenceGate('science', () => this.lang, (m) => this.ui && this.ui.toast(m, 9000), { demo: true });
    this.demoSet = demoIds(); this.demo = false; this.lic.then((r) => { this.demo = !(r && r.ok); if (this.ui) this.ui.renderAll(); });
    this.initPointer(); this.initXRButton(); this.initKeys();
    addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); r.setSize(innerWidth, innerHeight); });
    this.loadVoice();
    document.fonts && document.fonts.ready.then(() => { this.boardFor(this.runner.exp); this.ui.dirty = true; });
    r.setAnimationLoop(() => this.frame());
    window.app = this;
    this.boot();
  }
  async boot() { // real models and the 360° lab light load first (the loader screen shows progress)
    const bar = document.querySelector('#loader .bar i');
    await Promise.all([loadModels((k) => { if (bar) { bar.style.animation = 'none'; bar.style.width = Math.round(k * 100) + '%'; bar.style.transform = 'none'; } }), loadLabHDR(this.renderer, this.scene)]);
    furnish(this.roomInfo.room, this.roomInfo);
    const pm = loadPhysModels(); if (Q.has('test')) await pm; // real physics apparatus models load in the background
    const php = initPhysics(this).then((p) => { this.phys = p; if (p) { this.lab.surfaceY = (x, z) => p.surfaceY(x, z); this.lab.phys = p; const c0 = this.lab.clear.bind(this.lab); this.lab.clear = () => { c0(); p.clear(); }; } }); if (Q.has('test')) await php; // falling, throwing and breaking
    const first = Q.get('exp');
    if (Q.get('cls')) this.ui.setClass(+Q.get('cls') || 0);
    if (first && BY_ID[first]) this.openExp(first, { auto: Q.has('auto') });
    else if (!Q.has('test') && !Q.get('cls') && !store.get('cls')) this.ui.showPicker(true); // first visit: which class are you in?
    requestAnimationFrame(() => requestAnimationFrame(() => { document.body.classList.add('ready'); document.title = Q.has('test') ? 'READY' : document.title; }));
  }
  // ------------------------------------------------------------ text helpers
  expText(e, key) { const tr = I18N[e.id] && I18N[e.id][key]; const L = this.lang; return (tr && tr[L]) || (e[key] && (e[key][L] || e[key].en)) || ''; }
  setLang(l) { if (!LANGS.includes(l)) return; const v0 = this.voiceLang(); this.lang = l; store.set('lang', l); if (this.voiceLang() !== v0) this.prefetchVoice(); this.audio.stop(); this.ui.renderAll(); this.boardFor(this.runner.exp); }
  toggleVoice() { this.audio.voice = !this.audio.voice; store.set('voice', this.audio.voice ? '1' : '0'); if (!this.audio.voice) this.audio.stop(); this.ui.renderTop(); this.ui.dirty = true; }
  cycleSpeed() { this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length] || 1; this.runner.K.speed = this.speed; this.audio.rate = Math.min(1.5, 0.75 + this.speed * 0.25); this.ui.renderStory(); }
  isLocked(id) { return this.demo && !this.demoSet.has(id); } // free demo: only the demo experiments open without a code
  askCode(id) { // a locked experiment (or the "enter code" button): the code screen (in the headset: the keypad panel)
    if (this.renderer.xr.isPresenting || this.headsetApp) { this.codeVR = { code: '', id, locked: !!id }; if (this.ui) this.ui.dirty = true; return; }
    const s = this.renderer.xr.getSession && this.renderer.xr.getSession(); if (s) s.end();
    licenceGate('science', () => this.lang, null, { locked: true }).then((r) => { if (r && r.ok) { this.demo = false; this.ui.renderAll(); if (id) this.openExp(id); } });
  }
  codeKey(k) { // the headset code screen: a letter, ⌫, Activate, the free demo or Back
    const c = this.codeVR; if (!c || c.busy) return; const L = this.lang;
    if (k === 'del') { c.code = c.code.slice(0, -1); c.msg = ''; }
    else if (k === 'clr') { c.code = ''; c.msg = ''; }
    else if (k === 'demo') { const id = c.locked ? null : c.id; this.codeVR = null; if (id) this.openExp(id); }
    else if (k === 'go') {
      c.busy = true; c.msg = licText('wait', L); c.cls = '';
      checkCode('science', c.code).then((r) => {
        c.busy = false;
        if (!r.ok) { c.msg = licText(r.key, L, { d: r.d }); c.cls = 'e'; }
        else { const li = r.info || {}; c.msg = licText('ok', L, { n: li.name ? ' · ' + li.name : '', d: li.until }); c.cls = 'k'; c.done = true; this.demo = false;
          setTimeout(() => { const id = c.id; if (this.codeVR === c) this.codeVR = null; this.ui.renderAll(); if (id) this.openExp(id); this.ui.dirty = true; }, 1800); }
        this.ui.dirty = true;
      });
    } else if (k.length === 1 && c.code.length < 12) { c.code += k; c.msg = ''; }
    this.ui.dirty = true;
  }
  openExp(id, o = {}) {
    if (this.isLocked(id)) { this.askCode(id); return; }
    this.codeVR = null;
    this.audio.unlock(); document.body.classList.remove('list-open');
    if (this.particles.g.visible) this.particles.close();
    const sj = (BY_ID[id] && BY_ID[id].subj) || 'chemistry'; if (this.ui && this.ui.subj !== sj) { this.ui.subj = sj; this.ui.renderSubjects(); this.ui.renderPicker(); } // opening a physics experiment switches the list to physics
    this.userCam = false; this.recent.clear(); this.runner.load(id, o); this.focusBench();
  }
  primary() { // the big button: do the step, or after the experiment open/close the particle view
    const r = this.runner;
    if (r.state === 'finished' && r.exp && HAS_PARTICLES(r.exp.id)) { if (this.particles.g.visible) this.particles.close(); else this.particles.play(r.exp); this.ui.renderStory(); return; }
    r.doStep();
  }
  onParticles(open, done) {
    this.hideMarker = open || this.particles.g.visible;
    document.body.classList.toggle('pv-open', this.particles.g.visible);
    if (open && !this.renderer.xr.isPresenting) { const c = this.particles.g.position; const far = innerWidth / innerHeight < 1 ? 2.05 : 1.22; this.userCam = false; this.camGoal = { p: new THREE.Vector3(c.x, c.y - 0.041, c.z + far), t: new THREE.Vector3(c.x, c.y - 0.041, c.z) }; } // framed so the title above and the caption below are both in view
    if (!open && !done) { this.hideMarker = false; this.focusBench(); }
    this.ui.renderStory(); this.ui.dirty = true;
  }
  boardFor(e) {
    const draw = this.roomInfo.drawBoard;
    if (!e) { draw('DUET STEM · ' + tx(T[(this.ui && this.ui.subj) || 'chemistry'], this.lang), [{ t: tx(T.appTitle, this.lang), size: 54, c: 'rgba(240,166,90,0.95)' }, { t: tx(T.pickExp, this.lang), size: 44 }]); return; }
    const w0 = e.eq.word; const word = typeof w0 === 'object' && w0 ? (w0[this.lang] || w0.en) : (DICT[w0] && DICT[w0][this.lang]) || w0; // open labs give the word in all three languages
    const lines = [{ t: e.eq.sym, size: 64, w: 700 }, { t: word, size: 44, c: 'rgba(240,166,90,0.95)' }, { t: this.expText(e, 'kind'), size: 40, c: 'rgba(200,220,210,0.85)' }];
    const ph = PHOTOS[e.id] || []; const L = this.lang;
    draw(this.expText(e, 'title'), lines);
    if (ph.length) Promise.all(ph.map((p) => photoImage(p.f))).then((imgs) => { if (this.runner.exp === e && this.lang === L) draw(this.expText(e, 'title'), lines, ph.map((p, i) => ({ img: imgs[i], cap: p.cap[L] || p.cap.en }))); });
  }
  // ------------------------------------------------------------ narration
  async loadVoice() {
    try { const res = await fetch('voice/manifest.json', { cache: 'no-cache' }); if (res.ok) this.voiceSet = new Set(await res.json()); } catch (e) {}
    this.prefetchVoice();
  }
  prefetchVoice() { // save the narration for the chosen language for offline use (after the lab has loaded)
    if (!this.voiceSet || !('serviceWorker' in navigator)) return; const L = this.voiceLang();
    navigator.serviceWorker.ready.then((reg) => setTimeout(() => { const sw = navigator.serviceWorker.controller || reg.active; sw && sw.postMessage({ type: 'prefetch', urls: [...this.voiceSet].filter((k) => k.startsWith(L + '/')).map((k) => `./voice/${k}.mp3`) }); }, 8000)).catch(() => {});
  }
  voiceLang() { return this.lang === 'en' ? 'en' : 'hi'; } // Hinglish students hear the Hindi voice
  voiceUrl(text) { const L = this.voiceLang(); const k = vkey(text); return this.voiceSet && this.voiceSet.has(L + '/' + k) ? `voice/${L}/${k}.mp3` : null; }
  narrate(units, queue = false) {
    units = units.filter(Boolean); if (!units.length || this.muted) return;
    if (!queue) { this._nt = (this._nt || 0) + 1; this.audio.stop(); }
    const tok = this._nt; const prev = queue && this._narr ? this._narr : Promise.resolve(); const L = this.voiceLang();
    this._narrLen = units.join(' ').length; this._narrT0 = performance.now();
    this._narr = prev.then(async () => { this._narrT0 = performance.now(); for (const u of units) { if (tok !== this._nt) return; await this.audio.say(this.voiceUrl(u), u, L); } });
  }
  async waitNarration() {
    await (this._narr || Promise.resolve());
    const el = performance.now() - (this._narrT0 || 0); const read = Math.min(9000, 1200 + (this._narrLen || 0) * 40) / this.speed;
    if (!this.audio.voice || el < 700) await sleep(Math.max(0, read - el));
    await sleep(500 / this.speed);
  }
  stepUnits(r, i, part) {
    const L = this.voiceLang(); const s = r.exp.steps[i]; if (!s) return [];
    if (part === 'do') return [r.text(`steps.${i}.do`, L)];
    return [r.text(`steps.${i}.see`, L), r.text(`steps.${i}.why`, L)];
  }
  onStep(r, loaded, done) {
    if (this.muted) return; const L = this.voiceLang();
    if (loaded) this.narrate([`${r.text('title', L)}.`, r.text('aim', L), ...this.stepUnits(r, 0, 'do')]);
    else if (done) this.narrate(this.stepUnits(r, r.i, 'see'), true);
    else if (r.state === 'todo') this.narrate(this.stepUnits(r, r.i, 'do'));
    this.ui.dirty = true;
  }
  onFinished(r) {
    if (!r.incomplete().ok) { // steps skipped or done differently: not complete, and not ticked off in the class list
      this.ui.renderStory(); const t = this.ui.incompleteText(); this.ui.toast('⚠ ' + t, 7000); this.narrate([t], true); return; }
    this.ui.markDone(r.exp.id); this.ui.renderStory();
    const L = this.voiceLang(); this.narrate([tx(T.finished, L) + '.', r.text('result.concl', L)], true); this.ui.toast('✓ ' + tx(T.finished, this.lang));
    if (this._wasAuto && HAS_PARTICLES(r.exp.id)) { const id = r.exp.id; this.waitNarration().then(() => { if (r.exp && r.exp.id === id && r.state === 'finished' && !this.particles.g.visible) this.particles.play(r.exp); }); }
  }
  // ------------------------------------------------------------ camera
  focusBench() {
    const b = new THREE.Box3();
    for (const it of this.lab.items) { if (it.g.position.y > BENCH_Y + 0.15 || it.g.parent !== this.scene) continue; b.expandByObject(it.g); }
    if (b.isEmpty()) return;
    const c = b.getCenter(new THREE.Vector3()); const w = Math.max(0.45, b.max.x - b.min.x);
    const aspect = Math.max(0.6, Math.min(2, innerWidth / innerHeight));
    const dist = (w * 0.95 + 0.3) * (aspect < 1 ? 1.4 / aspect : 1);
    const tgt = new THREE.Vector3(c.x, BENCH_Y + 0.1, c.z - 0.02);
    const pos = tgt.clone().add(new THREE.Vector3(0, 0.52, 0.85).normalize().multiplyScalar(dist));
    this.camGoal = { p: pos, t: tgt };
  }
  // follow the action: frame the item to use next and everything that is moving, pouring or being heated
  director() {
    const r = this.runner; if (!r.exp || this.userCam || this.renderer.xr.isPresenting || this.particles.g.visible) return;
    if (r.state === 'todo' && r.i === 0 && !r.done.size) return; // the first view shows the whole kit
    const set = new Set(); const tg = r.state === 'todo' ? r.target() : null; if (tg) set.add(tg);
    for (const it of this.lab.items) {
      if (it.g.parent !== this.scene) continue;
      if (r.state === 'doing' && it.home && it.g.position.distanceTo(it.home.p) > 0.012) set.add(it);
      const t = this.recent.get(it.id); if (t != null && this.t - t < 3.5) set.add(it);
    }
    const cv = this.lab.items.find((it) => it.camView && it.g.parent === this.scene); // an experiment can ask for a particular point of view (e.g. low, just over the rim of a bowl)
    // (a phone held upright steps back, so the whole board fits across)
    if (cv) { const sc = Math.max(1, 1 / Math.max(0.3, innerWidth / innerHeight)); const p = cv.g.position.clone().add(cv.camView.p.clone().multiplyScalar(sc)), t = cv.g.position.clone().add(cv.camView.t); if (!(this.camGoal && this.camGoal.p.distanceTo(p) < 0.003)) this.camGoal = { p, t, slow: true }; return; }
    if (!set.size) return;
    const b = new THREE.Box3(); for (const it of set) b.expandByObject(it.g);
    const c = b.getCenter(new THREE.Vector3()); const size = Math.max(0.3, b.max.x - b.min.x, (b.max.y - b.min.y) * 1.3);
    // open dishes up on a tripod: look down into them
    const dish = [...set].find((it) => (it.kind === 'dish' || it.kind === 'watchglass') && it.g.position.y > BENCH_Y + 0.1);
    if (dish) { const m = dish.mouthWorld(new THREE.Vector3()); c.set(m.x, m.y, m.z); }
    const dir = dish ? new THREE.Vector3(0, 0.78, 0.62) : new THREE.Vector3(0, 0.5, 0.86);
    const aspect = Math.max(0.6, Math.min(2, innerWidth / innerHeight));
    const dist = (size * 1.05 + 0.14) * (aspect < 1 ? 1.4 / aspect : 1);
    const tgt = new THREE.Vector3(c.x, Math.max(BENCH_Y + 0.05, c.y), c.z);
    const pos = tgt.clone().add(dir.normalize().multiplyScalar(dist));
    if (this.camGoal && this.camGoal.t.distanceTo(tgt) < 0.02 && this.camGoal.p.distanceTo(pos) < 0.03) return;
    this.camGoal = { p: pos, t: tgt, slow: true };
  }
  // ------------------------------------------------------------ screen input: click the glowing item, hover to read labels
  initPointer() {
    const el = this.renderer.domElement; const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const tip = document.getElementById('tip');
    let down = null;
    const pick = (e) => {
      const rc = el.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera); let best = null;
      for (const it of this.lab.items) { if (it.broken || !it.g.visible) continue; const h = ray.intersectObjects(it.hitMeshes(), false)[0]; if (h && (!best || h.distance < best.d)) best = { it: this.xr.owner(h.object) || it, d: h.distance }; }
      return best && best.it;
    };
    let drag = null; const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); const hp = new THREE.Vector3();
    const canGrab = (it) => it && this.phys && !it.noGrab && !it.broken && !['rack', 'tripod', 'circuit'].includes(it.kind) && !this.renderer.xr.isPresenting;
    const startDrag = (it) => { if (!down || it.held) return; drag = { it, y: it.g.position.y + 0.06, hist: [] }; this.controls.enabled = false; it.held = 'pointer'; if (it.follow) it.follow = null; it.g.position.y = drag.y; this.lab.emit('grab', { obj: it.id }); this.audio.clink(); this.hint('drag'); };
    const moveDrag = (e) => { const rc = el.getBoundingClientRect(); ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, this.camera); plane.constant = -drag.y; if (!ray.ray.intersectPlane(plane, hp)) return;
      const g = drag.it.g.position; const lim = 3.4; g.set(Math.max(-lim, Math.min(lim, hp.x)), drag.y, Math.max(-lim, Math.min(lim, hp.z))); const now = performance.now(); drag.hist.push({ p: g.clone(), t: now }); while (drag.hist.length > 2 && now - drag.hist[0].t > 90) drag.hist.shift(); };
    const endDrag = () => { const it = drag.it; it.held = null; this.controls.enabled = true; const H = drag.hist; let v = null; if (H.length > 1) { const a = H[0], b = H[H.length - 1]; const dt = Math.max(0.016, (b.t - a.t) / 1000); v = b.p.clone().sub(a.p).divideScalar(dt); if (v.length() < 0.25) v.set(0, 0, 0); v.y = Math.min(2, v.length() * 0.25); }
      drag = null; if (this.xr.dropSolid(it)) return; if (!this.phys.drop(it, v, null)) { it.g.position.y -= 0.06; } }; // a solid let go over a vessel falls in
    el.addEventListener('wheel', (e) => { if (!drag) return; e.preventDefault(); const it = drag.it; if (e.shiftKey) { drag.y = Math.max(0.05, Math.min(2.2, drag.y - e.deltaY * 0.0006)); it.g.position.y = drag.y; return; } const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).setY(0).normalize(); it.g.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, e.deltaY * 0.0025)); }, { passive: false });
    el.addEventListener('pointerdown', (e) => { this.audio.unlock(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; const it = pick(e); if (canGrab(it)) { const d0 = down; d0.timer = setTimeout(() => { if (down === d0) startDrag(it); }, e.pointerType === 'mouse' ? 160 : 380); } });
    // the terminal under the pointer (within 16 px on the screen), for wiring by hand
    const termAt = (e) => { const rc = el.getBoundingClientRect(); let best = null, bd = 16; const v = new THREE.Vector3();
      for (const it of this.lab.items) { if (!it.terms || !it.g.visible || it.kind === 'lead') continue; for (const k in it.terms) { const t = it.terms[k]; v.copy(t.local); it.g.localToWorld(v); const d0 = v.distanceTo(this.camera.position); v.project(this.camera); if (v.z > 1) continue;
        const x = (v.x + 1) / 2 * rc.width + rc.left, y = (1 - v.y) / 2 * rc.height + rc.top; const d = Math.hypot(x - e.clientX, y - e.clientY); if (d < bd && d0 < 3) { bd = d; best = t; } } } return best; };
    el.addEventListener('pointerup', (e) => {
      if (down && down.timer) clearTimeout(down.timer); if (drag) { endDrag(); down = null; return; }
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 7) { const t = termAt(e); const tg = this.runner.state === 'todo' ? this.runner.target() : null; if (t && !(tg && pick(e) === tg)) { down = null; this.wireTap(t); return; } else if (!t && this.wirePend) this.wireTap(null); }
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const quick = performance.now() - down.t < 450; down = null;
      if (moved > 7 || !quick) return;
      const it = pick(e); const r = this.runner;
      if (it && r.state === 'todo' && r.target() === it) r.doStep();
      else if (it && r.state === 'done') r.next();
      else if (it && it.kind === 'key' && it.setOn) { it.setOn(!it.on); this.lab.emit('key', { v: it.id, on: it.on }); this.audio.tone(it.on ? 1500 : 900, 0.04, 0.06, 'square'); } // press a switch yourself
      else if (it && it.setLit && !it.held) { it.setLit(!it.lit); this.lab.emit(it.lit ? 'lit' : 'unlit', { obj: it.id }); if (it.lit) this.audio.whoosh(); } // light or put out a burner, lamp or candle
      else if (it) this.showTip(it, e.clientX, e.clientY, true);
    });
    let raf = 0, last = null;
    el.addEventListener('pointermove', (e) => {
      if (drag) { moveDrag(e); return; } if (down && down.timer && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { clearTimeout(down.timer); down.timer = null; }
      if (e.pointerType !== 'mouse') return; last = e; if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (!last || down) return; const it = pick(last); this.hover = it; el.style.cursor = it && this.runner.state === 'todo' && this.runner.target() === it ? 'pointer' : it ? 'help' : ''; if (it) this.showTip(it, last.clientX, last.clientY); else tip.classList.remove('show'); });
    });
    el.addEventListener('pointerleave', () => tip.classList.remove('show'));
  }
  // wiring by hand: tap a terminal, then another one to join them with a wire; tap the same terminal twice to unclip its last wire
  wireTap(t) {
    const K = this.runner.K; if (!this.wireDot) { this.wireDot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.85, depthTest: false })); this.wireDot.renderOrder = 60; this.scene.add(this.wireDot); this.wireDot.visible = false; }
    const p = this.wirePend; const L = this.lang; const say = (o) => this.ui && this.ui.toast(o[L] || o.en, 3200);
    if (!t) { this.wirePend = null; this.wireDot.visible = false; return; }
    if (!p) { this.wirePend = t; this.wireDot.visible = true; this.wireDot.userData.t = t; say({ en: 'Wire: now tap another terminal (tap this one again to unclip its wire).', hi: 'तार: अब कोई दूसरा टर्मिनल छूइए (इसी को दोबारा छुएँगे तो इसका तार हट जाएगा)।', hg: 'Wire: ab koi doosra terminal tap kijiye (isi ko dobara tap karenge to iska wire hat jayega).' }); return; }
    this.wirePend = null; this.wireDot.visible = false;
    if (p === t) { if (!K.unwire(t)) say({ en: 'No wire is clipped to this terminal.', hi: 'इस टर्मिनल पर कोई तार नहीं लगा है।', hg: 'Is terminal par koi wire nahi laga hai.' }); return; }
    K.connect(p, t);
  }
  // a short explanation of a breakage, burn-out, crack or spill, in the student's language
  explain(e) {
    const L = this.lang, it = e.obj ? this.lab.byId[e.obj] : null; const nm = it && it.name ? tx(it.name, L) : ''; const pick = (o) => o[L] || o.en; let m = null;
    if (e.type === 'broken') { const sp = (e.dv || 0).toFixed(1); const where = e.floor ? { en: 'the floor', hi: 'फ़र्श', hg: 'floor' } : { en: 'a hard surface', hi: 'किसी सख़्त सतह', hg: 'kisi hard surface' };
      m = { en: `${nm} hit ${where.en} at about ${sp} m/s and broke. Glass is brittle: it cannot bend, so a hard knock cracks it. Anything inside spilled.`, hi: `${nm} लगभग ${sp} m/s की स्पीड से ${where.hi} से टकराया और टूट गया। काँच भंगुर होता है, यानी वह मुड़ नहीं सकता — इसलिए ज़ोर की चोट लगते ही टूट जाता है। अंदर जो कुछ था, सब गिर गया।`, hg: `${nm} lagbhag ${sp} m/s ki speed se ${where.hg} se takraaya aur toot gaya. Glass brittle hota hai, yaani mud nahi sakta — isliye zor ki chot lagte hi toot jaata hai. Andar jo kuch tha, sab gir gaya.` }; }
    else if (e.type === 'cracked') m = e.why === 'cold' ? { en: `${nm} cracked when a cold liquid touched the very hot glass: the glass shrank suddenly (thermal shock). Let hot glass cool before adding a cold liquid.`, hi: `बहुत गरम काँच पर ठंडा द्रव पड़ते ही ${nm} चटक गया, क्योंकि काँच अचानक सिकुड़ गया (थर्मल शॉक)। ठंडा द्रव डालने से पहले गरम काँच को ठंडा होने दीजिए।`, hg: `Bahut garam glass par thanda liquid padte hi ${nm} chatak gaya, kyunki glass achanak sikud gaya (thermal shock). Thanda liquid daalne se pehle garam glass ko thanda hone dijiye.` }
      : { en: `${nm} cracked in the flame. Ordinary glass cannot take strong heating: one part expands more than another and it cracks. Only heat-proof test tubes, beakers and flasks go on a flame.`, hi: `${nm} लौ में चटक गया। साधारण काँच तेज़ गरमी नहीं झेल पाता — उसका एक हिस्सा दूसरे से ज़्यादा फैलता है, और वह चटक जाता है। लौ पर सिर्फ़ गरमी सहने वाले (हीट-प्रूफ़) टेस्ट ट्यूब, बीकर और फ़्लास्क ही रखे जाते हैं।`, hg: `${nm} flame mein chatak gaya. Ordinary glass tez garmi nahi jhel paata — uska ek hissa doosre se zyada phailta hai, aur wo chatak jaata hai. Flame par sirf heat-proof test tube, beaker aur flask hi rakhe jaate hain.` };
    else if (e.type === 'burnt' && e.kind === 'bulb') { const P = (e.P || 0).toFixed(1), Pr = e.Pr, k = Math.round((e.P || 0) / (e.Pr || 1)); m = { en: `The lamp burnt out: it took ${P} W, about ${k} times its rating of ${Pr} W, and its filament melted. It will not glow again.`, hi: `लैंप फ़्यूज़ हो गया। इसे ${P} W मिले, जो इसकी रेटिंग ${Pr} W का लगभग ${k} गुना है, और इसका फ़िलामेंट पिघल गया। अब यह फिर नहीं जलेगा।`, hg: `Lamp fuse ho gaya. Ise ${P} W mile, jo iski rating ${Pr} W ka lagbhag ${k} guna hai, aur iska filament pighal gaya. Ab yeh phir nahi jalega.` }; }
    else if (e.type === 'burnt') { const mA = Math.round((e.I || 0) * 1000); m = { en: `The LED burnt out: ${mA} mA flowed through it (a safe current is about 20 mA). An LED needs a resistor in series with it.`, hi: `LED जल गया — इसमें से ${mA} mA करंट बहा (सुरक्षित करंट लगभग 20 mA होता है)। LED के साथ सीरीज़ में एक रेज़िस्टर लगाना ज़रूरी है।`, hg: `LED jal gaya — isme se ${mA} mA current baha (safe current lagbhag 20 mA hota hai). LED ke saath series mein ek resistor lagana zaroori hai.` }; }
    else if (e.type === 'pouring' && e.spill && this.t - (this._spillT || -9) > 8) { this._spillT = this.t; m = { en: 'Liquid spilled. In a real lab wipe up spills at once — acids and alkalis harm skin and clothes.', hi: 'द्रव गिर गया। असली लैब में गिरा हुआ द्रव तुरंत पोंछ दीजिए — एसिड और क्षार त्वचा और कपड़ों को नुकसान पहुँचाते हैं।', hg: 'Liquid gir gaya. Real lab mein gira hua liquid turant pochh dijiye — acid aur alkali skin aur kapdon ko nuksaan pahunchate hain.' }; }
    else if (e.type === 'overflow' && this.t - (this._overT || -9) > 6) { this._overT = this.t; m = { en: `${nm} is full — it holds only about ${e.ml} mL, so the extra liquid ran over the rim onto the bench. Pour slowly and watch the level.`, hi: `${nm} भर गया है — इसमें लगभग ${e.ml} mL ही आता है, इसलिए बाकी द्रव किनारे से बहकर मेज़ पर गिर गया। धीरे-धीरे डालिए और लेवल पर नज़र रखिए।`, hg: `${nm} bhar gaya hai — isme lagbhag ${e.ml} mL hi aata hai, isliye baaki liquid kinare se behkar bench par gir gaya. Dheere-dheere daaliye aur level par nazar rakhiye.` }; }
    else if (e.type === 'mismatch') m = { en: 'Your result is different from the expected one — read “You see” and “Why” to find out what happened.', hi: 'आपका नतीजा उम्मीद से अलग आया है — क्या हुआ, यह जानने के लिए “आप देखेंगे” और “क्यों” पढ़िए।', hg: 'Aapka result expected result se alag hai — kya hua ye jaanne ke liye “You see” aur “Why” padhiye.' };
    if (m && this.ui && this.ui.toast) this.ui.toast(pick(m), 7000);
  }
  walkKeys(dt) {
    if (!this._keys) { this._keys = new Set(); addEventListener('keydown', (e) => { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; this._keys.add(e.key.toLowerCase()); }); addEventListener('keyup', (e) => this._keys.delete(e.key.toLowerCase())); addEventListener('blur', () => this._keys.clear()); }
    if (!this._joyMade) { this._joyMade = true; if (matchMedia('(pointer: coarse)').matches) this.makeJoystick(); }
    const k = this._keys, J = this._joy || { x: 0, y: 0 }; if ((!k.size && !J.x && !J.y) || this.renderer.xr.isPresenting) return; const f = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0) - J.y, sd = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + J.x; if (!f && !sd) return;
    const fw = this.controls.target.clone().sub(this.camera.position).setY(0); if (fw.lengthSq() < 1e-6) return; fw.normalize(); const rt = new THREE.Vector3(-fw.z, 0, fw.x); const mv = fw.multiplyScalar(f).add(rt.multiplyScalar(sd)).multiplyScalar(1.2 * dt);
    const c = this.camera.position; const nx = Math.max(-3.5, Math.min(3.5, c.x + mv.x)), nz = Math.max(-3.4, Math.min(3.4, c.z + mv.z)); mv.set(nx - c.x, 0, nz - c.z); c.add(mv); this.controls.target.add(mv); this.userCam = true; this.camGoal = null;
  }
  // phones and tablets: a small thumb joystick at the bottom left to walk round the lab
  makeJoystick() {
    const b = document.createElement('div'); b.id = 'joy'; b.style.cssText = 'position:fixed;left:18px;bottom:18px;width:96px;height:96px;border-radius:50%;background:rgba(20,24,30,.35);border:2px solid rgba(255,255,255,.25);z-index:30;touch-action:none';
    const n = document.createElement('div'); n.style.cssText = 'position:absolute;left:30px;top:30px;width:36px;height:36px;border-radius:50%;background:rgba(240,166,90,.85)'; b.appendChild(n); document.body.appendChild(b);
    const set = (x, y) => { const r = Math.hypot(x, y), m = 34; if (r > m) { x *= m / r; y *= m / r; } n.style.transform = `translate(${x}px,${y}px)`; this._joy = { x: x / m, y: y / m }; };
    let id = null, cx = 0, cy = 0; b.addEventListener('pointerdown', (e) => { id = e.pointerId; b.setPointerCapture(id); const rc = b.getBoundingClientRect(); cx = rc.left + rc.width / 2; cy = rc.top + rc.height / 2; set(e.clientX - cx, e.clientY - cy); e.stopPropagation(); });
    b.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e.clientX - cx, e.clientY - cy); }); const up = (e) => { if (e.pointerId !== id) return; id = null; set(0, 0); }; b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  hint(kind) { if (this._hinted) return; this._hinted = true; const t = { en: 'Mouse wheel: tilt (pour) · Shift + wheel: lift · let go to put it down or throw it', hi: 'माउस व्हील: झुकाइए (उँडेलने के लिए) · Shift + व्हील: ऊपर-नीचे कीजिए · छोड़ने पर चीज़ रख दी जाएगी या फेंक दी जाएगी', hg: 'Mouse wheel: tilt (pour) · Shift + wheel: upar-neeche · chhodne par cheez rakh di jaayegi ya phenk di jaayegi' }; if (this.ui && this.ui.toast) this.ui.toast(t[this.lang] || t.en); void kind; }
  describe(it) {
    const L = this.lang; const lines = [];
    if (it.mix) {
      const liq = Object.entries(it.mix.liq).filter(([, ml]) => ml > 0.04).sort((a, b) => b[1] - a[1]);
      for (const [k, ml] of liq.slice(0, 3)) lines.push(`${tx(SUBS[k].n, L)} · ${ml < 1 ? ml.toFixed(1) : Math.round(ml)} mL`);
      for (const k in it.mix.ppt) if (it.mix.ppt[k] > 0.02 && PPT[k]) lines.push(tx(PPT[k].n, L));
      if (it.mix.temp > 32) lines.push(`${Math.round(it.mix.temp)} °C`);
      if (!liq.length && !lines.length) lines.push({ en: 'empty', hi: 'खाली', hg: 'khaali' }[L]);
    }
    if (it.solids && it.solids.length) lines.push(...it.solids.map((s) => tx(s.name, L)));
    if (it.kind === 'thermo') lines.push(`${it.temp.toFixed(0)} °C`);
    if (it.lit) lines.push({ en: 'lit', hi: 'जल रहा है', hg: 'jal raha hai' }[L]);
    return { name: tx(it.name, L), lines };
  }
  showTip(it, x, y, sticky) {
    const tip = document.getElementById('tip'); const d = this.describe(it);
    tip.innerHTML = `<b>${d.name}</b>${d.lines.map((l) => `<span>${l}</span>`).join('')}`;
    tip.style.left = Math.min(innerWidth - 240, x + 14) + 'px'; tip.style.top = Math.max(60, y - 10) + 'px'; tip.classList.add('show');
    clearTimeout(this._tipT); if (sticky) this._tipT = setTimeout(() => tip.classList.remove('show'), 2600);
  }
  initKeys() {
    addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input,textarea')) return; const r = this.runner;
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.primary(); }
      else if (e.code === 'ArrowRight') r.next(); else if (e.code === 'ArrowLeft') r.prev();
    });
  }
  // ------------------------------------------------------------ headset
  async initXRButton() {
    const b = document.getElementById('xr-btn'); let ok = false; b.hidden = true;
    await this.lic; // VR only after the subscription code
    try { ok = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) {}
    // AR: the bench and the experiment in the real room (passthrough on a Quest; a phone camera in Chrome with ARCore)
    let okAR = false; try { okAR = !!navigator.xr && !window.DuetNative && await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) {}
    const ba = document.getElementById('ar-btn'), ga = document.getElementById('xr-go-ar'); ba.hidden = !okAR; ga.hidden = !okAR; this.canAR = okAR;
    ba.textContent = tx(T.enterAR, this.lang); ga.textContent = tx(T.enterAR, 'en') + ' · ' + tx(T.enterAR, 'hi');
    ba.onclick = () => { if (this.renderer.xr.isPresenting) this.renderer.xr.getSession().end(); else this.startAR(true); }; ga.onclick = () => this.startAR(true);
    b.hidden = !ok; if (!ok) return;
    b.onclick = async () => {
      this.audio.unlock();
      if (this.renderer.xr.isPresenting) { this.renderer.xr.getSession().end(); return; }
      try {
        const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
        this.renderer.xr.setReferenceSpaceType('local-floor'); await this.renderer.xr.setSession(s); this.enterVR(s);
      } catch (e) { this.ui.toast('VR: ' + e.message); }
    };
    if (Q.has('vr')) setTimeout(() => b.click(), 300);
    // installed headset app (?app=vr): go straight into VR; if the browser wants a tap first, show one big button
    if (Q.get('app') === 'vr') {
      const go = document.getElementById('xr-go'); go.textContent = tx(T.enterVR, 'en') + ' · ' + tx(T.enterVR, 'hi');
      go.onclick = () => this.startVR(true);
      const t0 = performance.now(); const tryVR = () => { if (this.renderer.xr.isPresenting || this._vrEnded) return; this.startVR(false); if (performance.now() - t0 < 180000) setTimeout(tryVR, 3000); };
      tryVR(); // the headset may need a moment (a previous session can still be closing, the page may still be loading)
      // the app comes back to the front (after the Meta button or the headset was taken off): straight back into VR
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !this.renderer.xr.isPresenting) setTimeout(() => this.startVR(false), 600); });
    }
  }
  async startVR(user) {
    if ((this._starting && performance.now() - this._starting < 10000) || this.renderer.xr.isPresenting) return; this._starting = performance.now(); // a request that never answers does not block the next try
    this.audio.unlock(); document.body.classList.remove('xr-wait');
    try {
      const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
      this.renderer.xr.setReferenceSpaceType('local-floor'); await this.renderer.xr.setSession(s); this.enterVR(s);
    } catch (e) { this.xrErr = `${e.name}: ${e.message}`; document.body.classList.add('xr-wait'); if (user) this.ui.toast('VR: ' + e.message); }
    this._starting = 0;
  }
  // AR: the real room is seen (headset passthrough, or the phone camera); only the bench and the experiment are drawn
  async startAR(user) {
    if ((this._starting && performance.now() - this._starting < 10000) || this.renderer.xr.isPresenting) return; this._starting = performance.now();
    this.audio.unlock(); document.body.classList.remove('xr-wait');
    try {
      const s = await navigator.xr.requestSession('immersive-ar', { optionalFeatures: ['local-floor', 'hand-tracking', 'dom-overlay'], domOverlay: { root: document.body } });
      const floor = !s.enabledFeatures || [...s.enabledFeatures].includes('local-floor');
      this.renderer.xr.setReferenceSpaceType(floor ? 'local-floor' : 'local');
      this.setAR(true); await this.renderer.xr.setSession(s); this.enterVR(s, !!s.domOverlayState);
      if (!floor) { this._hgtAuto = false; try { this.renderer.xr.setReferenceSpace(this.baseRef.getOffsetReferenceSpace(new XRRigidTransform({ x: 0, y: -(BENCH_Y + 0.35), z: 0.15 }))); } catch (e) { this.xrErr = 'ar: ' + e.message; } } // a phone: the bench a little below and in front of it
      s.addEventListener('end', () => this.setAR(false));
    } catch (e) { this.setAR(false); this.xrErr = `${e.name}: ${e.message}`; if (Q.get('app') === 'vr') document.body.classList.add('xr-wait'); if (user) this.ui.toast('AR: ' + e.message); }
    this._starting = 0;
  }
  // from inside the headset: leave VR for AR (the real room) or back; if the headset wants a tap first, the big buttons show
  switchXR() {
    const s = this.renderer.xr.getSession(); const toAR = !this.ar; if (!s) { if (toAR) this.startAR(true); else this.startVR(true); return; }
    this._vrEnded = true; s.addEventListener('end', () => setTimeout(() => { document.body.classList.add('xr-wait'); if (toAR) this.startAR(false); else this.startVR(false); }, 400)); s.end();
  }
  setAR(on) {
    this.ar = on; document.body.classList.toggle('in-ar', on);
    if (on) { this._bg = this._bg || this.scene.background; this.scene.background = null; this.renderer.setClearAlpha(0); } else if (this._bg) { this.scene.background = this._bg; this.renderer.setClearAlpha(1); }
    for (const c of this.roomInfo.room.children) if (!c.userData.ar) c.visible = !on;
  }
  enterVR(s, overlay) { // overlay: a phone in AR shows the page's own buttons over the camera view (no panels in the scene)
    if (!overlay) { document.body.classList.add('in-vr'); this.ui.vr.visible = true; this.ui.layoutVR(); this.ui.dirty = true; }
    try { const fr = s.supportedFrameRates; if (fr && s.updateTargetFrameRate) { const want = [...fr].filter((x) => x <= 90).sort((a, b) => b - a)[0]; if (want) s.updateTargetFrameRate(want).catch(() => {}); } } catch (e) {} // smooth 90 Hz where the headset offers it (after a restart a Quest may start at 72 Hz)
    this.baseRef = this.renderer.xr.getReferenceSpace(); this._hgtT = this.t; this._hgtAuto = store.get('hgt') === null; this.setHeight(+(store.get('hgt') || 0), true);
    this._cam = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    s.addEventListener('end', () => { document.body.classList.remove('in-vr'); this.ui.vr.visible = false; if (Q.get('app') === 'vr') { this._vrEnded = true; document.body.classList.add('xr-wait'); } if (this._cam) { this.camera.position.copy(this._cam.p); this.controls.target.copy(this._cam.t); } });
  }
  // the student's eye height in the headset: raise or lower the view (a seated student, a short or tall one); saved on this device
  setHeight(dy, quiet) {
    this.hgt = Math.max(-0.5, Math.min(0.9, Math.round(dy * 100) / 100)); if (!quiet) { store.set('hgt', String(this.hgt)); this._hgtAuto = false; }
    if (this.baseRef && typeof XRRigidTransform !== 'undefined') { try { this.renderer.xr.setReferenceSpace(this.baseRef.getOffsetReferenceSpace(new XRRigidTransform({ x: 0, y: -this.hgt, z: 0 }))); } catch (e) { this.xrErr = 'height: ' + e.message; } }
    if (this.ui) this.ui.dirty = true;
  }
  eyeY() { const c = this.renderer.xr.getCamera(); return c ? c.position.y : 0; } // with the height offset
  autoHeight() { // standing at the bench the eyes are about 1.5 m up; a student sitting down is lifted to that height (only until they set it themselves)
    const raw = this.eyeY() - this.hgt; if (raw < 0.3) return; this.setHeight(raw < 1.25 ? 1.5 - raw : 0, true);
  }
  // while liquid goes into a vessel, a small tag above it reads the volume now in it (like reading its graduations)
  initPourTag() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.scale.set(0.056, 0.021, 1); sp.renderOrder = 60; sp.visible = false; this.scene.add(sp);
    this._pt = { c, t, sp, v: null, until: 0, last: '' };
    this.lab.listeners.push((e) => { if ((e.type === 'pouring' || e.type === 'drop') && e.to) { const v = this.lab.byId[e.to]; if (v && v.mix) { this._pt.v = v; this._pt.until = this.t + 2.5; } } });
  }
  updPourTag() {
    const P = this._pt; const v = P && P.v; if (!P) return; if (!v || this.t > P.until || v.broken || !v.g.parent) { P.sp.visible = false; return; }
    const txt = `${v.ml >= 10 ? Math.round(v.ml) : v.ml.toFixed(1)} mL`;
    if (txt !== P.last) { P.last = txt; const x = P.c.getContext('2d'); x.clearRect(0, 0, 256, 96); x.fillStyle = 'rgba(12,15,22,0.88)'; x.beginPath(); x.roundRect(4, 4, 248, 88, 22); x.fill(); x.strokeStyle = 'rgba(240,166,90,0.9)'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#ffffff'; x.font = `700 52px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 128, 52); P.t.needsUpdate = true; }
    v.mouthWorld(P.sp.position); P.sp.position.y += 0.03; P.sp.visible = true;
  }
  // ------------------------------------------------------------ the loop
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta()); this.t += dt; LIQ_TIME.value = this.t;
    const xr = this.renderer.xr.isPresenting;
    if (!xr) {
      if (this.t - (this._voT || 0) > 0.25) { this._voT = this.t; this.viewOffset(); }
      if (this.t - (this._dirT || 0) > 0.3) { this._dirT = this.t; this.director(); }
      if (this.camGoal) { const k = 1 - Math.exp(-dt * (this.camGoal.slow ? 1.8 : 3.2)); this.camera.position.lerp(this.camGoal.p, k); this.controls.target.lerp(this.camGoal.t, k); if (this.camera.position.distanceTo(this.camGoal.p) < 0.003) this.camGoal = null; }
      this.controls.update();
    }
    // the simulation runs faster with the speed setting (and very fast while replaying steps after "Back")
    const K = this.runner.K; let rem = dt * (K.speed || 1), n = 0;
    this.audio.sfx = !this.muted;
    while (rem > 1e-6 && n++ < 40) { const sd = Math.min(rem, 1 / 30); K.update(sd); this.simT += sd; this.lab.update(sd, this.simT); if (this.phys) this.phys.step(sd); this.follow(); rem -= sd; }
    this.runner.update(dt, this.t); this.particles.update(dt); if (this.runner.auto) this._wasAuto = true; else if (this.runner.state !== 'finished') this._wasAuto = false;
    this.xr.update(dt); this.walkKeys(dt); if (this.wireDot && this.wireDot.visible) { const t = this.wireDot.userData.t; this.wireDot.position.copy(t.local); t.item.g.localToWorld(this.wireDot.position); }
    this.audio.frame(this.audio.pourT > 0, this.fx.bubbles.length); this.audio.pourT = Math.max(0, this.audio.pourT - dt);
    if (this.lapseShown !== this._lapse) { this._lapse = this.lapseShown; this.ui.renderStory(); }
    if (xr && this.t - (this._solT || 0) > 0.5) { this._solT = this.t; if (this.lab.vessels.some((v) => v.solLog)) this.ui.dirty = true; } // the dissolving read-out in the headset stays current
    if (xr && this._hgtAuto && this._hgtT != null && this.t - this._hgtT > 1.5) { this._hgtT = null; this.autoHeight(); }
    if (xr && this.ui.dirty && this.t - (this._vrDraw || 0) > 0.08) { this.ui.drawVR(); this.ui.dirty = false; this._vrDraw = this.t; }
    this.updPourTag();
    if (FAST && ++this._fc % 24) return; // test mode: simulate quickly, draw only now and then
    this.renderer.render(this.scene, this.camera);
  }
  // keep the bench centred in the part of the screen not covered by the list, step card and notebook
  viewOffset() {
    const w = innerWidth, h = innerHeight; const wide = w > 860;
    const lw = wide ? document.getElementById('list').offsetWidth + 12 : 0;
    const nbw = wide && document.body.classList.contains('nb-open') ? document.getElementById('notebook').offsetWidth + 12 : 0;
    const sh = document.getElementById('story').offsetHeight + 12;
    const key = `${w},${h},${lw},${nbw},${sh}`; if (key === this._voKey) return; this._voKey = key;
    this.camera.setViewOffset(w, h, Math.round(-(lw - nbw) / 2), Math.round(Math.max(0, sh - 50) * 0.5), w, h);
  }
  follow() { for (const it of this.lab.items) if (it.follow && it.setTemp && it.follow.mix) it.setTemp(it.follow.mix.temp); }
}
new App();
if ('serviceWorker' in navigator && !Q.has('test') && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(() => {});
