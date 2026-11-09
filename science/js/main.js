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
import { loadModels, loadLabHDR, furnish } from './models.js';
import { ParticleView, HAS_PARTICLES } from './particles.js';
import { PHOTOS, photoImage } from './photos.js';
import { T, tx, LANGS } from './strings.js';

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
    r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor'); r.xr.setFoveation(0.1); r.xr.setFramebufferScaleFactor(1.3);
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
    this.xr = new XRInput(this);
    this.particles = new ParticleView(this); this.hasParticles = HAS_PARTICLES;
    this.clock = new THREE.Clock();
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
  openExp(id, o = {}) {
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
    const word = (DICT[e.eq.word] && DICT[e.eq.word][this.lang]) || e.eq.word;
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
    if (cv) { const p = cv.g.position.clone().add(cv.camView.p), t = cv.g.position.clone().add(cv.camView.t); if (!(this.camGoal && this.camGoal.p.distanceTo(p) < 0.003)) this.camGoal = { p, t, slow: true }; return; }
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
      for (const it of this.lab.items) { const h = ray.intersectObjects(it.hitMeshes(), false)[0]; if (h && (!best || h.distance < best.d)) best = { it: this.xr.owner(h.object) || it, d: h.distance }; }
      return best && best.it;
    };
    el.addEventListener('pointerdown', (e) => { this.audio.unlock(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    el.addEventListener('pointerup', (e) => {
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const quick = performance.now() - down.t < 450; down = null;
      if (moved > 7 || !quick) return;
      const it = pick(e); const r = this.runner;
      if (it && r.state === 'todo' && r.target() === it) r.doStep();
      else if (it && r.state === 'done') r.next();
      else if (it) this.showTip(it, e.clientX, e.clientY, true);
    });
    let raf = 0, last = null;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return; last = e; if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; if (!last || down) return; const it = pick(last); this.hover = it; el.style.cursor = it && this.runner.state === 'todo' && this.runner.target() === it ? 'pointer' : it ? 'help' : ''; if (it) this.showTip(it, last.clientX, last.clientY); else tip.classList.remove('show'); });
    });
    el.addEventListener('pointerleave', () => tip.classList.remove('show'));
  }
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
    const b = document.getElementById('xr-btn'); let ok = false;
    try { ok = !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) {}
    b.hidden = !ok; if (!ok) return;
    b.onclick = async () => {
      this.audio.unlock();
      if (this.renderer.xr.isPresenting) { this.renderer.xr.getSession().end(); return; }
      try {
        const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
        await this.renderer.xr.setSession(s); this.enterVR(s);
      } catch (e) { this.ui.toast('VR: ' + e.message); }
    };
    if (Q.has('vr')) setTimeout(() => b.click(), 300);
    // installed headset app (?app=vr): go straight into VR; if the browser wants a tap first, show one big button
    if (Q.get('app') === 'vr') {
      const go = document.getElementById('xr-go'); go.textContent = tx(T.enterVR, 'en') + ' · ' + tx(T.enterVR, 'hi');
      go.onclick = () => this.startVR(true);
      const t0 = performance.now(); const tryVR = () => { if (this.renderer.xr.isPresenting || this._vrEnded) return; this.startVR(false); if (performance.now() - t0 < 30000) setTimeout(tryVR, 2500); };
      tryVR(); // the headset may need a moment (a previous session can still be closing)
    }
  }
  async startVR(user) {
    if (this._starting || this.renderer.xr.isPresenting) return; this._starting = true;
    this.audio.unlock(); document.body.classList.remove('xr-wait');
    try {
      const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
      await this.renderer.xr.setSession(s); this.enterVR(s);
    } catch (e) { document.body.classList.add('xr-wait'); if (user) this.ui.toast('VR: ' + e.message); }
    this._starting = false;
  }
  enterVR(s) {
    document.body.classList.add('in-vr'); this.ui.vr.visible = true; this.ui.layoutVR(); this.ui.dirty = true;
    this._cam = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    s.addEventListener('end', () => { document.body.classList.remove('in-vr'); this.ui.vr.visible = false; if (Q.get('app') === 'vr') { this._vrEnded = true; document.body.classList.add('xr-wait'); } if (this._cam) { this.camera.position.copy(this._cam.p); this.controls.target.copy(this._cam.t); } });
  }
  // ------------------------------------------------------------ the loop
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta()); this.t += dt;
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
    while (rem > 1e-6 && n++ < 40) { const sd = Math.min(rem, 1 / 30); K.update(sd); this.simT += sd; this.lab.update(sd, this.simT); this.follow(); rem -= sd; }
    this.runner.update(dt, this.t); this.particles.update(dt); if (this.runner.auto) this._wasAuto = true; else if (this.runner.state !== 'finished') this._wasAuto = false;
    this.xr.update(dt);
    this.audio.frame(this.audio.pourT > 0, this.fx.bubbles.length); this.audio.pourT = Math.max(0, this.audio.pourT - dt);
    if (this.lapseShown !== this._lapse) { this._lapse = this.lapseShown; this.ui.renderStory(); }
    if (xr && this.ui.dirty && this.t - (this._vrDraw || 0) > 0.08) { this.ui.drawVR(); this.ui.dirty = false; this._vrDraw = this.t; }
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
