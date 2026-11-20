// DUET Robotics Lab 360 — app shell: the bench (3D), the parts drawer, wiring by drag or tap, the multimeter, the code
// editor and Serial Monitor, the lessons with their step card, languages, the school code and the headset view.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Stage, nextFrame } from './stage.js';
import { View } from './view.js';
import { Lab } from './sim.js';
import { compile } from './cpp.js';
import { PARTS, DRAWER, pinsOf, fmtOhm, RES_VALUES, LED_COLORS } from './parts.js';
import { BB, holeAt, stripOf, BOARDS } from './boards.js';
import { T, t, tx, L, LANGS, msg, SPEC, REGIONS, BOARD_PIN } from './i18n.js';
import { LESSONS, BY_ID, FREE_CODE } from './lessons.js';
import { CURRICULUM } from './curriculum.js'; // Class 1-12: the live lessons of each class, in session order (devtools/curriculum)
import { LessonRT } from './lessonrt.js';
import { Editor } from './editor.js';
import { Sound } from './audio.js';
import { XR } from './xr.js';
import * as MD from './models.js';
import { makeWorld } from './worlds.js';
import { install4 } from './app4.js'; // batch 4: Nano, Mega, ESP32: the Board list and box, the phone and router, pin popups (app4.js)
import { install3 } from './app3.js'; // batch 3: block coding beside the C++ (blocks.js), the school-lab modules' panels and scenes (app3.js)
import { install22 } from './app22.js'; // batch 22: the digital sensor modules' callout buttons
import { install6 } from './app6.js'; // batch 6: Raspberry Pi Pico and Pi 4: Python editor, Shell / Terminal, the Pi's screen (app6.js)

const Q = new URLSearchParams(location.search);
const PADKEY = { ArrowUp: 'F', ArrowDown: 'B', ArrowLeft: 'L', ArrowRight: 'R' };
const WORLD_PAIR = { en: 'Connect HC-05', hi: 'HC-05 से जोड़िए', hg: 'HC-05 se jodiye' };
const WORLD_BT = { // why a letter from the phone did not reach the sketch
  none: { en: 'There is no HC-05 on the bench.', hi: 'बेंच पर HC-05 नहीं है।', hg: 'Bench par HC-05 nahi hai.' },
  off: { en: 'The HC-05 has no power: wire its VCC and GND.', hi: 'HC-05 को बिजली नहीं: इसके VCC और GND जोड़िए।', hg: 'HC-05 ko power nahi: iske VCC aur GND jodiye.' },
  unpaired: { en: 'Connect the phone to the HC-05 first.', hi: 'पहले फ़ोन को HC-05 से जोड़िए।', hg: 'Pehle phone ko HC-05 se jodiye.' },
  crossed: { en: 'TXD is on the Arduino\'s TX (pin 1): two talkers. Move it to RX (pin 0).', hi: 'TXD, Arduino के TX (पिन 1) पर है: दोनों बोल रहे हैं। इसे RX (पिन 0) पर लगाइए।', hg: 'TXD, Arduino ke TX (pin 1) par hai: dono bol rahe hain. Ise RX (pin 0) par lagaiye.' },
  nowire: { en: 'The HC-05\'s TXD is not wired to the Arduino\'s RX (pin 0).', hi: 'HC-05 का TXD, Arduino के RX (पिन 0) से नहीं जुड़ा।', hg: 'HC-05 ka TXD, Arduino ke RX (pin 0) se nahi juda.' },
  stopped: { en: 'The sketch is not running: press Run.', hi: 'स्केच नहीं चल रहा: "चलाइए" दबाइए।', hg: 'Sketch nahi chal raha: Run dabaiye.' },
  nobegin: { en: 'The sketch never called Serial.begin(9600).', hi: 'स्केच ने Serial.begin(9600) नहीं बुलाया।', hg: 'Sketch ne Serial.begin(9600) nahi bulaya.' },
  baud: { en: 'Wrong speed: the HC-05 talks at 9600 baud, the sketch listens at another. The letters come out as rubbish.', hi: 'ग़लत रफ़्तार: HC-05, 9600 बॉड पर बोलता है, स्केच दूसरी पर सुनता है। अक्षर बिगड़ जाते हैं।', hg: 'Galat speed: HC-05 9600 baud par bolta hai, sketch doosri par sunta hai. Letters bigad jaate hain.' },
};
const TEST = Q.has('test');
const SIM_MS = (window.DuetPerf && DuetPerf.phone) || /OculusBrowser|Quest|Pico/i.test(navigator.userAgent) ? 9 : 40; // the most JS time a frame gives the simulation (phones, headsets: 9 ms; a computer is fast enough not to need it)
const store = { get(k) { try { return localStorage.getItem('rl360.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('rl360.' + k, v); } catch (e) { /* private */ } } };
const APP_VR = Q.get('app') === 'vr' || /^android-app:/.test(document.referrer) || (/OculusBrowser|Quest/i.test(navigator.userAgent) && !!window.matchMedia && matchMedia('(display-mode: standalone)').matches); // the installed Quest app
const QUEST = /OculusBrowser|Quest|Pico/i.test(navigator.userAgent); // a standalone headset: phone-light materials, no shadows, no bloom (72 fps)
const LITE = Q.has('lite') || ((!!(window.DuetPerf && DuetPerf.phone) || QUEST) && !Q.has('full'));
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtV = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : (Math.abs(v) < 0.005 ? 0 : v).toFixed(2));
const fmtI = (i) => { const a = Math.abs(i); return a >= 1 ? a.toFixed(2) + ' A' : a >= 0.001 ? (a * 1000).toFixed(a < 0.01 ? 2 : 1) + ' mA' : a >= 1e-6 ? (a * 1e6).toFixed(0) + ' µA' : '0 mA'; };

class App {
  constructor() {
    this.lang = Q.get('lang') || store.get('lang') || 'en'; if (!LANGS.includes(this.lang)) this.lang = 'en';
    L.lang = this.lang; document.documentElement.lang = this.lang;
    MD.setLite(LITE);
    this.stage = new Stage($('#stage'), { lite: LITE, headset: QUEST });
    this.lab = new Lab('uno');
    this.view = new View(this.stage, this.lab);
    this.rt = new LessonRT(this);
    this.sound = new Sound(); this.sound.on = store.get('sound') !== '0' && !Q.has('mute');
    this.xr = new XR(this.stage, this);
    this.editor = new Editor($('#editor'), (v) => this.onEdit(v));
    this.mode = 'lesson'; this.lessonId = null; this.tool = 'move'; this.speed = 1; this.sel = null; this.drag = null; this.pendingWire = null; this.probes = [null, null];
    this.progress = (() => { try { return JSON.parse(store.get('done') || '{}') || {}; } catch (e) { return {}; } })();
    this.serText = ''; this.serLine = ''; this.serCount = 0; this.notes = []; this.ranSrc = null;
    this.lab.on((type, d) => this.onLab(type, d));
    this.initUI(); this.initPointer(); this.initKeys();
    if (window.DuetGate) {
      DuetGate.init({ app: 'robotics', title: 'Robotics Lab 360', lang: () => this.lang, demo: { en: T.demoText.en, hi: T.demoText.hi, hg: T.demoText.hg }, onChange: () => this.renderStrip() });
      DuetGate.attachVR({ THREE, renderer: this.stage.renderer, scene: this.stage.scene, camera: this.stage.camera });
    }
    this.stage.onFrame = (dt) => this.frame(dt);
    window.app = this;
    install4(this); // batch 4
    install3(this); // batch 3
    install6(this); // batch 6
    install22(this); // batch 22
    this.boot();
  }
  get licensed() { return !window.DuetGate || DuetGate.state === 'ok' || (DuetGate.licensedFor && DuetGate.licensedFor('robotics')); }
  async boot() {
    const bar = $('#loader .bar i');
    try { await Promise.all([this.stage.loadEnv('env/workshop_1k.hdr'), document.fonts ? document.fonts.ready : null]); } catch (e) { console.warn('env', e); }
    if (bar) { bar.style.animation = 'none'; bar.style.width = '100%'; bar.style.transform = 'none'; }
    const first = Q.get('lesson') || (Q.has('free') ? null : store.get('lesson')) || 'meet';
    if (Q.has('free')) this.openFree(); else this.openLesson(BY_ID[first] ? first : 'meet', true);
    this.layout();
    nextFrame().then(nextFrame).then(() => { document.body.classList.add('ready'); if (TEST) document.title = 'READY'; }); // (stage.js: also when the installed app is already in VR)
    setTimeout(() => this.makeThumbs(this.drawerList()), TEST ? 50 : 600);
    setTimeout(() => this.warmParts(), TEST ? 2500 : 1500);
    this.xr.supported().then((ok) => { $('#b-vr').hidden = !ok; });
    this.xr.supportedAR().then((ok) => { $('#b-ar').hidden = !ok; }); // AR: a Quest's passthrough, or a phone's camera (ARCore)
    $('#aroverlay').addEventListener('beforexrselect', (e) => e.preventDefault()); // (a tap on the overlay is not a tap in the room)
    if (APP_VR) this.autoVR();
  }
  // the installed headset app (Quest: ?app=vr, opened from its Android app, or a standalone window) has no page to look at
  // first: it goes straight into VR. If the headset wants a click first, or after the session ends, one big Enter VR button
  autoVR() {
    document.body.classList.add('app-vr'); $('#xr-go').onclick = () => this.startVR(true);
    const t0 = performance.now(); const tryVR = () => { if (this.xr.session || this.vrEnded) return; this.startVR(false); if (performance.now() - t0 < 180000) setTimeout(tryVR, 3000); };
    tryVR(); // (the headset may need a moment: a session before this one can still be closing, the page may still be loading)
    // back to the front (after the Meta button, or the headset taken off and put on): straight back into VR
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !this.xr.session) setTimeout(() => this.startVR(false), 600); });
  }
  async startVR(user) {
    if (this.xr.session || (this._vrTry && performance.now() - this._vrTry < 10000)) return; this._vrTry = performance.now(); // (a request that never answers does not block the next try)
    document.body.classList.remove('xr-wait'); this.sound.unlock && this.sound.unlock();
    let ok = await this.xr.enter(true); // (a click right after a session ended: that one can still be closing, so a few tries)
    for (let k = 0; !ok && user && k < 10; k++) { await new Promise((r) => setTimeout(r, 1000)); ok = await this.xr.enter(k < 9); } // (about 10 s: in the emulator a new session is refused for ~5 s after the last one ends)
    this._vrTry = 0;
    if (!ok) document.body.classList.add('xr-wait');
  }
  onVREnd() { if (APP_VR) { this.vrEnded = true; document.body.classList.add('xr-wait'); } } // (xr.js: the session is over)
  // ------------------------------------------------------------ every frame
  frame(dt) {
    const ms = dt * 1000; this.lab.speed = this.speed;
    let wmoved = false; const W = this.world && this.world.ready ? this.world : null;
    if (!(window.DuetGate && DuetGate.active)) {
      if (W) { // the bench and the robot step together in slices of 10 ms (sim time): a sensor never lags the sketch by a slow frame
        const real = Math.min(ms, 250), sim = real / 1000 * this.speed, n = Math.min(40, Math.max(1, Math.ceil(sim / 0.01)));
        // a slow phone or headset: at most SIM_MS of each frame for the sketch and the robot together; the slices left over
        // are skipped (both together, so they stay in step: the robot runs a little slower instead of the frame stopping)
        const f0 = performance.now();
        for (let i = 0; i < n; i++) { this.lab.step(real / n); if (W.update(sim / n)) wmoved = true; if (performance.now() - f0 > SIM_MS) break; }
      } else this.lab.step(ms);
    }
    for (const chunk of this.lab.mcu.ser.take()) this.serialIn(chunk);
    this.view.update(dt); this.view.pulse(performance.now());
    if (wmoved || (this.world && !W)) { this.stage.anim = 1; this.stage.kick(); }
    this.sound.update(this.lab.sounds, this.speed);
    this.rt.update(dt * this.speed);
    this.xr.update(dt);
    const m = this.lab.mcu;
    this._slowFor = m.slow && m.state === 'running' ? (this._slowFor || 0) + dt : 0; // the sketch has lagged behind real time for a while
    this._ui = (this._ui || 0) + dt;
    if (this._ui > 0.1) {
      this._ui = 0;
      this.editor.setRun(m.state === 'running' ? m.L : 0);
      this.renderStatus(); this.liveCallout(); this.liveMeter(); if (this.hoverEp || this.hoverPart) this.showTip(this.lastXY);
      const burnt = this.lab.parts.some((p) => p.state.burnt); document.body.classList.toggle('burnt', burnt);
      if (this.mode === 'lesson') this.renderCardLive();
      this.renderWorld(false);
    }
    if (this.world) this.placeLabels();
  }
  // ------------------------------------------------------------ lessons and free build
  openLesson(id, quiet) {
    const L0 = BY_ID[id]; if (!L0) return;
    if (!L0.free && window.DuetGate && !DuetGate.allow(false)) return;
    this.mode = 'lesson'; this.lessonId = id; store.set('lesson', id); document.body.classList.remove('free', 'menu-open');
    this.closeCallout(); this.cancelDrag(); if (this.tool !== 'move') this.setTool('move');
    this.rt.open(id); this.setLight(this.lab.env.light); this.setWorld(L0.world);
    this.editor.value = L0.code; this.ranSrc = null; this.clearErrs(); this.clearSerial();
    this.stage.userMoved = false; this.renderAll(); this.stage.setView(L0.view || 'home');
    if (L0.serial) this.sideTab('both');
    this.afterStep(); // the first step's camera and ghost
    clearTimeout(this._preT); this._preT = setTimeout(() => this.prefetchThumbs(), 3000);
  }
  // while a lesson is read, the next lesson's drawer pictures are made (one a frame), so it opens with them ready
  prefetchThumbs() { if (!this.thumbs) return; if (this._warmKeep) this.thumbRenderer(); if (this.mode !== 'lesson') return; const k = LESSONS.findIndex((l) => l.id === this.lessonId); const nx = LESSONS[k + 1]; this.makeThumbs([...this.drawerList(), ...(nx ? nx.drawer : [])]); }
  openFree() {
    if (window.DuetGate && !DuetGate.allow(false)) return;
    this.mode = 'free'; this.lessonId = null; document.body.classList.add('free'); document.body.classList.remove('menu-open');
    this.closeCallout(); this.cancelDrag();
    this.rt.lesson = null; this.lab.stop(); this.lab.clear(); this.lab.repair(); this.setWorld(null);
    const saved = store.get('freecode'); this.editor.value = saved || FREE_CODE; this.clearErrs(); this.clearSerial();
    this.stage.userMoved = false; this.renderAll(); this.stage.setView('home'); this.updateGhosts();
  }
  onStepDone(i, s) {
    this.renderCard();
    if (['place', 'wire', 'tap', 'run', 'check', 'edit'].includes(s.k) && i === this.rt.i && i < this.rt.lesson.steps.length - 1) {
      clearTimeout(this._adv); this._adv = setTimeout(() => { if (this.rt.i === i && this.rt.doneSteps.has(i)) this.next(); }, s.k === 'tap' ? 1600 : 900);
    }
  }
  onLessonComplete(lesson) {
    this.progress[lesson.id] = true; store.set('done', JSON.stringify(this.progress));
    this.renderStrip(); this.renderCard(); this.sound.click();
  }
  next() {
    const r = this.rt, Ls = r.lesson; if (!Ls) return;
    if (r.i >= Ls.steps.length - 1) { if (r.complete) { const k = LESSONS.indexOf(Ls); if (LESSONS[k + 1]) this.openLesson(LESSONS[k + 1].id); } return; }
    if (!r.doneSteps.has(r.i) && !r.stepDone(r.step)) return;
    r.go(r.i + 1); this.afterStep();
  }
  back() { const r = this.rt; if (!r.lesson || r.i === 0) return; r.go(r.i - 1); this.afterStep(); }
  afterStep() {
    const s = this.rt.step; this.renderCard(); this.updateGhosts(); if (s && s.k !== 'act') this.closeCallout();
    this.stage.fitPts = this.stepPoints(s); this.layout(); // (the camera keeps the ghost or the wire's ends out from under the panels, as tall as this step's card is)
    if (s && s.code) this.editor.setMarks(s.code); else this.editor.setMarks([]);
    if (s && s.k === 'place') { const p = this.rt.lesson; this.renderDrawer(); void p; }
    if (s && s.k === 'wire') { const ends = s.wire.map((x) => this.rt.pick(x, null) || ''); const wide = this.rt.lesson.view === 'wide' || ends.some((e) => e.startsWith('T:')); if (ends.some((e) => e.startsWith('B:')) || this.rt.lesson.wview) { this.stage.userMoved = false; this.stage.setView(this.rt.lesson.wview || (wide ? 'wide' : 'home')); } if (this.tool !== 'wire') this.setTool('wire'); }
    else if (s && this.tool === 'wire') this.setTool('move');
    if (s && s.k === 'place') { this.stage.userMoved = false; this.stage.setView(s.place.at.hole ? 'bb' : this.rt.lesson.wview || 'wide'); }
    if (s && s.k === 'wire' && this.stage.fitPts && !this.stage.userMoved && this.stage.viewName) this.stage.setView(this.stage.viewName); // (a wire step that keeps the view: its ends in sight)
    if (s && s.k === 'tap' && s.region) this.stage.setView('board');
    const want = s && ['run', 'watch', 'act'].includes(s.k) && this.rt.lesson.rview ? this.rt.lesson.rview : this.rt.lesson.view; // a robot on its floor is watched there
    if (s && ['run', 'watch', 'act', 'check'].includes(s.k) && this.stage.viewName !== want) { this.stage.userMoved = false; this.stage.setView(want || 'home'); } // see what the circuit does
  }
  updateGhosts() { this.view.setLessonGhosts(this.mode === 'lesson' ? this.rt.ghosts() : []); }
  stepPoints(s) { // bench points a place or wire step needs in view
    try {
      if (s && s.k === 'place') { const at = s.place.at; if (at.hole) { const h = holeAt(at.hole); return h ? [[this.lab.bb.x + h.x, BB.top, this.lab.bb.z + h.z]] : null; } return [[at.x - 15, 8, at.z - 15], [at.x + 15, 8, at.z + 15]]; }
      if (s && s.k === 'wire') { const g = this.rt.ghostWire(s.wire); return g ? g.map((e) => this.lab.epPos(e)).filter(Boolean) : null; }
    } catch (e) { /* no points */ }
    return null;
  }
  // ------------------------------------------------------------ the bench changed
  onLab(type, d) {
    if (type === 'parts' || type === 'wires') { this.rt.checkOk = false; this.updateGhosts(); if (this.sel) this.renderCallout(); }
    if (type === 'burn') { this.sound.pop(); this.view.smoke(d.part); this.toast(t('burn', { mA: d.mA }), 'bad', 7000); }
    if (type === 'fuse') this.toast(t('fuse', d), 'bad', 8000);
    if (type === 'pinOver') this.toast(t('pinOver', d), 'bad', 6000);
    if (type === 'power' && d) this.toast(t('power'));
    if (type === 'error') { this.showErr({ code: d.code, args: d.args, line: d.line }, 'e'); this.editor.setError({ line: d.line }); }
    if (type === 'note') this.addNote(d);
  }
  // ------------------------------------------------------------ code
  code() { return this.editor.value; }
  onEdit(v) {
    if (this.mode === 'free') store.set('freecode', v);
    if (this.lab.mcu.state === 'running' && this.ranSrc !== null && v !== this.ranSrc && !this._editWarned) { this._editWarned = true; this.toast(t('edited')); }
    if (this.mode === 'lesson') this.renderCard();
  }
  run() {
    this.sound.unlock(); this._editWarned = false; this.closeCallout();
    const src = this.code(); const r = this.world && this.world.compile ? this.world.compile(src) : compile(src, this.lab.def); // (batch 4: the board's pin names and libraries; batch 5: a world with its own language, the micro:bit's Python)
    this.clearErrs(); this.editor.setError(null);
    if (!r.ok) { const e = r.errors[0]; this.showErr(e, 'e'); this.editor.setError({ line: e.line }); this.lab.stop(); this.renderStatus(); return false; }
    for (const w of r.warnings.slice(0, 3)) this.showErr(w, 'w');
    if (!this.lab.powered) this.toast(t('noPower'), 'bad');
    this.lab.run(r); this.ranSrc = src; this.rt.onRun(src); this.clearSerial(true);
    if (r.info.serial) this.sideTab(this.sideMode === 'code' ? 'both' : this.sideMode || 'both');
    this.toast(t('compiled')); this.renderStatus(); this.renderCard();
    return true;
  }
  stop() { this.lab.stop(); this.sound.silence(); this.renderStatus(); }
  resetBoard() { this.lab.resetBoard(); const cap = this.view.board.userData.resetCap; if (cap) { cap.position.y -= 0.3; setTimeout(() => { cap.position.y += 0.3; this.stage.kick(); }, 180); } this.clearSerial(true); this.rt.onRun(this.ranSrc); this.stage.kick(); }
  showErr(e, kind) {
    const box = $('#errs'); const d = document.createElement('div'); d.className = kind;
    d.innerHTML = `<b>${kind === 'e' ? '⚠' : 'ⓘ'} ${e.line ? esc(t('line', { n: e.line })) : ''}</b>${esc(msg(e))}`;
    if (e.line) { const b = document.createElement('button'); b.textContent = '→'; b.onclick = () => this.editor.reveal(e.line); d.appendChild(b); }
    box.appendChild(d);
  }
  addNote(n) { const k = n.code + JSON.stringify(n.args); if (this.notes.includes(k)) return; this.notes.push(k); this.showErr(n, 'w'); }
  clearErrs() { $('#errs').innerHTML = ''; this.notes = []; }
  // ------------------------------------------------------------ Serial Monitor
  serialIn(chunk) {
    const baud = +$('#ser-baud').value; let s = '';
    if (chunk.baud === baud) s = String.fromCharCode(...chunk.bytes).replace(/\r/g, '');
    else for (const b of chunk.bytes) s += '⸮ÿ�xø'[(b * 7 + chunk.baud) % 5]; // the wrong speed: garbled, as on a real monitor
    this.view.rxBlink = 0;
    this.serText += s; if (this.serText.length > 20000) this.serText = this.serText.slice(-15000);
    this.serLine += s; const parts = this.serLine.split('\n'); this.serLine = parts.pop();
    for (const ln of parts) { this.serCount++; if (chunk.baud === baud) this.rt.onSerialLine(ln); }
    const out = $('#serout'); const atEnd = out.scrollTop + out.clientHeight >= out.scrollHeight - 30;
    out.textContent = this.serText; if (atEnd) out.scrollTop = out.scrollHeight;
  }
  clearSerial(keepTab) { this.serText = ''; this.serLine = ''; this.serCount = 0; const o = $('#serout'); o.innerHTML = `<span class="empty">${esc(t('serialEmpty'))}</span>`; void keepTab; }
  sendSerial() { const v = $('#ser-txt').value; if (!v) return; this.lab.mcu.ser.send(v + '\n'); $('#ser-txt').value = ''; this.view.rxBlink = 0.15; }
  sideTab(m) {
    this.sideMode = m; const s = $('#side'); s.classList.toggle('ser', m === 'ser'); s.classList.toggle('both', m === 'both');
    for (const b of document.querySelectorAll('#s-tabs .tab')) b.classList.toggle('on', m === 'both' || b.dataset.tab === m);
    document.body.classList.remove('side-off'); this.layout();
  }
  // ------------------------------------------------------------ UI
  initUI() {
    for (const b of document.querySelectorAll('#langs button')) b.onclick = () => this.setLang(b.dataset.l);
    $('#m-lessons').onclick = () => this.openLesson(this.lessonId || store.get('lesson') || 'meet');
    $('#m-free').onclick = () => this.openFree();
    $('#b-sound').onclick = () => { this.sound.on = !this.sound.on; store.set('sound', this.sound.on ? '1' : '0'); this.sound.unlock(); if (!this.sound.on) this.sound.silence(); this.renderTop(); };
    $('#b-menu').onclick = () => document.body.classList.toggle('menu-open');
    $('#b-code').onclick = () => { document.body.classList.toggle('code-open'); };
    $('#w-min').onclick = () => $('#world').classList.toggle('min');
    $('#b-side').onclick = () => { if (innerWidth <= 980) document.body.classList.remove('code-open'); else { document.body.classList.toggle('side-off'); this.layout(); } };
    $('#b-vr').onclick = () => this.xr.enter();
    $('#b-ar').onclick = () => this.xr.enter(false, true); $('#ar-exit').onclick = () => { const s = this.xr.session; if (s) s.end().catch(() => {}); };
    $('#b-run').onclick = () => this.run(); $('#b-stop').onclick = () => this.stop(); $('#b-reset').onclick = () => this.resetBoard();
    $('#s-speed').onchange = (e) => { this.speed = +e.target.value; };
    $('#b-send').onclick = () => this.sendSerial(); $('#ser-txt').onkeydown = (e) => { if (e.key === 'Enter') this.sendSerial(); };
    $('#b-sclear').onclick = () => this.clearSerial(); $('#ser-baud').onchange = () => {};
    for (const b of document.querySelectorAll('#s-tabs .tab')) b.onclick = () => this.sideTab(this.sideMode === 'both' ? b.dataset.tab : this.sideMode === b.dataset.tab ? 'both' : b.dataset.tab);
    for (const b of document.querySelectorAll('#bar [data-tool]')) b.onclick = () => this.setTool(b.dataset.tool);
    for (const b of document.querySelectorAll('#bar [data-view]')) b.onclick = () => { this.stage.userMoved = false; const Ls = this.mode === 'lesson' && this.rt.lesson; this.stage.setView(b.dataset.view === 'robot' ? (Ls && (Ls.rview || Ls.view)) || 'home' : b.dataset.view === 'home' && Ls && (Ls.view === 'wide' || Ls.view === 'side') ? Ls.view : b.dataset.view); };
    this.stage.controls.addEventListener('start', () => { this.stage.userMoved = true; this.stage.goal = null; });
    $('#r-light').oninput = (e) => this.setLight(e.target.value / 100);
    $('#b-repair').onclick = () => { this.lab.repair(); this.toast('✓'); };
    $('#b-next').onclick = () => this.next(); $('#b-back').onclick = () => this.back();
    $('#b-check').onclick = () => this.check();
    addEventListener('resize', () => this.layout());
    this.sideTab(innerWidth <= 980 ? 'code' : 'both');
  }
  setLang(l) { if (!LANGS.includes(l)) return; this.lang = l; L.lang = l; document.documentElement.lang = l; store.set('lang', l); this.renderAll(); }
  setTool(k) { this.tool = k; this.pendingWire = null; this.view.showHover(null); for (const b of document.querySelectorAll('#bar [data-tool]')) b.classList.toggle('on', b.dataset.tool === k); $('#meter').classList.toggle('show', k === 'probe'); if (k !== 'probe') { this.probes = [null, null]; this.view.showProbe(0, null); this.view.showProbe(1, null); } this.liveMeter(); if (k === 'wire') this.toast(t('wireHint')); if (k === 'probe') this.toast(t('probeHint')); }
  setLight(v) { this.lab.env.light = v; this.lab.stateV++; this.lab.instKey = null; this.stage.setLight(v); $('#r-light').value = Math.round(v * 100); }
  renderAll() {
    for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t);
    for (const el of document.querySelectorAll('[data-ph]')) el.placeholder = t(el.dataset.ph);
    this.renderTop(); this.renderStrip(); this.renderDrawer(); this.renderCard(); this.renderStatus();
    if (this.sel) this.renderCallout();
    if (!this.serText) this.clearSerial();
    this.layout();
  }
  renderTop() {
    for (const b of document.querySelectorAll('#langs button')) b.classList.toggle('on', b.dataset.l === this.lang);
    $('#m-lessons').classList.toggle('on', this.mode === 'lesson'); $('#m-free').classList.toggle('on', this.mode === 'free');
    $('#b-sound').textContent = this.sound.on ? '🔊' : '🔇';
  }
  renderStrip() {
    const s = $('#strip'); s.innerHTML = ''; let g0 = null;
    // the class filter: one class's lessons from the curriculum, in its session order (?cls=7 opens it so)
    if (this.clsF === undefined) this.clsF = Q.get('cls') || store.get('cls') || '';
    const sel = document.createElement('select'); sel.className = 'clsf'; sel.setAttribute('aria-label', tx(T.clsAll));
    sel.innerHTML = `<option value="">${esc(tx(T.clsAll))}</option>` + Object.keys(CURRICULUM).filter((k) => CURRICULUM[k].length || LESSONS.some((l) => { const m = /(\d+)(?:\s*[–-]\s*(\d+))?/.exec(String(l.cls || '')); return !!m && +k >= +m[1] && +k <= +(m[2] || m[1]); })).map((k) => `<option value="${k}">${esc(tx(T.clsN, { n: k }))}</option>`).join('');
    sel.value = CURRICULUM[this.clsF] ? this.clsF : ''; sel.onchange = () => { this.clsF = sel.value; store.set('cls', this.clsF); this.renderStrip(); };
    s.appendChild(sel);
    // search: a word from the title (any language), e.g. "soil", "पंप", "ESP32"
    const q = document.createElement('input'); q.type = 'search'; q.className = 'clsq'; q.placeholder = '🔍'; q.value = this.qF || ''; q.setAttribute('aria-label', 'Search');
    q.oninput = () => { this.qF = q.value; clearTimeout(this._qT); this._qT = setTimeout(() => { this.renderStrip(); const q2 = $('#strip .clsq'); if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); } }, 250); };
    s.appendChild(q);
    const qq = (this.qF || '').trim().toLowerCase();
    let list = CURRICULUM[this.clsF] ? CURRICULUM[this.clsF].map((x) => BY_ID[x.id] ? Object.assign(Object.create(BY_ID[x.id]), { n: x.n, group: null }) : null).filter(Boolean) : LESSONS;
    if (CURRICULUM[this.clsF]) { // after the class's sessions, the other live projects made for that class (the project bank): "More projects for Class N"
      const k = +this.clsF, inCur = new Set(list.map((l) => l.id));
      const fits = (c) => { const m = /(\d+)(?:\s*[–-]\s*(\d+))?/.exec(String(c || '')); return !!m && k >= +m[1] && k <= +(m[2] || m[1]); };
      list = list.concat(LESSONS.filter((l) => !inCur.has(l.id) && fits(l.cls)).map((l) => Object.assign(Object.create(l), { n: '+', group: 'more' })));
    }
    if (qq) list = list.filter((l) => ['en', 'hi', 'hg'].some((k) => String(l.title[k] || '').toLowerCase().includes(qq)));
    for (const l of list) {
      if (l.group && l.group !== g0) { g0 = l.group; const h = document.createElement('span'); h.className = 'sg'; h.textContent = t('grp_' + l.group); s.appendChild(h); } // a section: basics, robots, boards, modules, micro:bit
      const b = document.createElement('button'); const locked = !l.free && !this.licensed;
      b.className = 'chip' + (l.id === this.lessonId && this.mode === 'lesson' ? ' on' : '') + (this.progress[l.id] ? ' ok' : '') + (locked ? ' lock' : '');
      b.innerHTML = `<i>${this.progress[l.id] ? '✓' : l.n}</i>${esc(tx(l.title))}`; b.dataset.lesson = l.id;
      b.onclick = () => this.openLesson(l.id); s.appendChild(b);
    }
    const cur = s.querySelector('.chip.on'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  drawerList() { const Ls = this.mode === 'lesson' ? this.rt.lesson : null; return Ls ? Ls.drawer : DRAWER; }
  renderDrawer() {
    const box = $('#plist'); box.innerHTML = '';
    const Ls = this.mode === 'lesson' ? this.rt.lesson : null;
    const list = this.drawerList();
    if (this.thumbs && list.some((k) => !this.thumbs[k === 'led' ? 'led_red' : k])) { clearTimeout(this._thT); this._thT = setTimeout(() => this.makeThumbs(this.drawerList()), 250); }
    const need = Ls && this.rt.step && this.rt.step.k === 'place' ? this.rt.step.place.type : null;
    if (!list.length) { box.innerHTML = `<div class="none">${esc(t('noParts'))}</div>`; }
    this.ledColor = this.ledColor || 'red';
    for (const type of list) {
      const def = PARTS[type]; const c = document.createElement('div'); c.className = 'pc' + (need === type ? ' need' : ''); c.dataset.type = type;
      const img = document.createElement('img'); img.alt = ''; img.src = this.thumbs && this.thumbs[type === 'led' ? 'led_' + this.ledColor : type] || ''; c.appendChild(img);
      const sp = document.createElement('span'); sp.textContent = tx(def.name).replace(/ \(.*\)$/, ''); c.appendChild(sp);
      if (type === 'led') {
        const cols = document.createElement('div'); cols.className = 'cols';
        for (const k of Object.keys(LED_COLORS)) { const d = document.createElement('b'); d.style.background = '#' + LED_COLORS[k].body.toString(16).padStart(6, '0'); d.className = k === this.ledColor ? 'on' : ''; d.title = k; d.onpointerdown = (e) => { e.stopPropagation(); this.ledColor = k; this.renderDrawer(); }; cols.appendChild(d); }
        c.appendChild(cols);
      }
      c.addEventListener('pointerdown', (e) => this.startNew(e, type));
      box.appendChild(c);
    }
  }
  renderStatus() {
    const m = this.lab.mcu, st = $('#st'); const k = !this.lab.powered ? 'stopped' : m.state === 'running' ? 'running' : m.state === 'error' ? 'errorS' : m.state === 'done' ? 'done' : 'stopped';
    st.className = 'st' + (k === 'running' ? ' run' : k === 'errorS' ? ' err' : ''); st.lastChild.textContent = t(k) + (this._slowFor > 3 && k === 'running' ? ' · ⏳' : ''); st.title = this._slowFor > 3 ? t('slow') : '';
  }
  // ------------------------------------------------------------ the step card
  renderCard() {
    if (this.mode !== 'lesson' || !this.rt.lesson) return;
    const r = this.rt, Ls = r.lesson, s = r.step, done = r.doneSteps.has(r.i) || r.stepDone(s);
    $('#c-k').textContent = `${t('lessonN', { n: Ls.n })} · ${t('stepOf', { i: r.i + 1, n: Ls.steps.length })}`;
    $('#c-t').textContent = tx(Ls.title);
    let h = '';
    if (r.i === 0) h += `<p class="goal">${esc(tx(Ls.goal))}</p>`;
    h += `<p><span class="lb">${esc(t('doL'))}</span>${esc(tx(s.do))}</p>`;
    if (s.k === 'place') h += `<p class="see">${esc(t('ghostHint'))}</p>`;
    const see = tx(s.see); if (see) h += `<p class="see${done ? ' ok' : ''}"><span class="lb">${esc(done ? t('stepDone') : t('seeL'))}</span>${esc(see)}</p>`;
    if (this.checkMsg) h += `<div class="msg ${this.checkMsg.ok ? 'good' : 'bad'}">${esc(this.checkMsg.text)}</div>`;
    if (r.complete && r.i === Ls.steps.length - 1) h += `<p class="fin">🎉 ${esc(t('lessonDone'))}</p>`;
    $('#c-x').innerHTML = h;
    $('#c-d').innerHTML = Ls.steps.map((_, i) => `<i class="${r.doneSteps.has(i) ? 'on' : ''}${i === r.i ? ' cur' : ''}"></i>`).join('');
    const nx = $('#b-next'); const last = r.i === Ls.steps.length - 1;
    nx.textContent = last && r.complete ? t('nextLesson') : t('next');
    nx.disabled = last ? !r.complete || !LESSONS[LESSONS.indexOf(Ls) + 1] : !done; nx.classList.toggle('pulse', !nx.disabled && (s.k === 'info' || s.k === 'watch' || s.k === 'act' || last));
    $('#b-back').disabled = r.i === 0; $('#b-check').style.display = Ls.check ? '' : 'none';
    this._cardSig = this.cardSig();
  }
  cardSig() { const r = this.rt; return [r.i, r.doneSteps.size, r.complete, r.doneSteps.has(r.i) || r.stepDone(r.step)].join('|'); }
  renderCardLive() { if (this.cardSig() !== this._cardSig) { this.renderCard(); this.updateGhosts(); } }
  check() {
    const r = this.rt.runCheck();
    if (!r) { this.rt.checkOk = true; this.checkMsg = { ok: true, text: '✓ ' + t('checkOk') }; this.sound.click(); }
    else { this.rt.checkOk = false; const args = {}; for (const [k, v] of Object.entries(r[1] || {})) args[k] = typeof v === 'object' ? tx(v) : v; this.checkMsg = { ok: false, text: tx(r[0], args) }; }
    clearTimeout(this._cm); this._cm = setTimeout(() => { this.checkMsg = null; this.renderCard(); }, 9000);
    this.renderCard();
  }
  // (in the headset: on its panel too)
  toast(m, kind, ms = 3500) { if (this.xr && this.xr.session && this.xr.ui) this.xr.ui.toast(String(m)); const el = $('#toast'); el.textContent = m; el.className = 'panel show' + (kind ? ' ' + kind : ''); clearTimeout(this._tt); this._tt = setTimeout(() => { el.className = 'panel'; }, ms); }
  // keep the 3D bench centred in the space between the panels
  layout() {
    const W = innerWidth, H = innerHeight; const vis = (s) => { const e = $(s); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display === 'none' || r.width === 0 || r.right <= 0 || r.left >= W ? null : r; };
    const d = vis('#drawer'), s = vis('#side'), c = vis('#card');
    const st = vis('#strip'), tp = vis('#top'), br = vis('#bar');
    // the robot's panel: under the parts in the left column (computer), or on the right edge (phone: the code panel is folded away)
    const wp = vis('#world'); const dr = $('#drawer'); const narrow = W <= 980;
    if (dr) dr.style.bottom = wp && !narrow ? (H - wp.top + 10) + 'px' : '';
    const left = d ? d.right : 0, right = Math.max(s ? W - s.left : 0, wp && narrow ? W - wp.left : 0), bottom = c ? H - c.top : 0, top = Math.max(br ? br.bottom : 0, st ? st.bottom : 0, tp ? tp.bottom : 0);
    const cam = this.stage.camera; if (this.stage.renderer.xr.isPresenting) return;
    this.stage.resize();
    cam.setViewOffset(W, H, (right - left) / 2, (bottom - top) / 2, W, H); cam.updateProjectionMatrix();
    const fw = Math.max(0.3, (W - left - right) / W), fh = Math.max(0.3, (H - top - bottom) / H);
    const changed = !this.stage.free || Math.abs(this.stage.free.fw - fw) > 0.01 || Math.abs(this.stage.free.fh - fh) > 0.01;
    this.stage.free = { fw, fh }; this.stage.freeRect = { l: left / W, r: right / W, t: top / H, b: bottom / H }; if (changed && this.stage.viewName && !this.stage.userMoved) this.stage.setView(this.stage.viewName, !this._laidOut); this._laidOut = true;
    this.stage.kick();
  }
  isPhoneish() { return innerHeight <= 520 || (navigator.maxTouchPoints > 0 && innerWidth < 980); }
  // ------------------------------------------------------------ drawer thumbnails (rendered once, from the real models)
  // drawer pictures, rendered from the real models, only for the parts a drawer shows (a lesson's few, or all in Free build).
  // One small renderer is kept for them, and one picture is made a frame (a new part type's shaders compile then): a lesson
  // with new parts opens without a freeze on a slow phone, and the drawer fills in as the pictures come.
  makeThumbs(want) {
    this.thumbs = this.thumbs || {}; const q = this._thq || (this._thq = []);
    const kinds = (want || [...DRAWER.filter((k) => k !== 'led'), ...Object.keys(LED_COLORS).map((c) => 'led_' + c)]).flatMap((k) => (k === 'led' ? Object.keys(LED_COLORS).map((c) => 'led_' + c) : [k])).filter((k) => !this.thumbs[k]);
    for (const k of kinds) if (!q.includes(k)) q.push(k);
    if (!q.length || this._thBusy) return;
    this._thBusy = true;
    const pump = () => {
      const k = q.shift(); if (!k) { this._thBusy = false; return; }
      if (!this.thumbs[k]) { const u = this.thumbOne(k); if (u) { this.thumbs[k] = u; this.thumbShown(k); } else { q.length = 0; this._thBusy = false; return; } }
      setTimeout(() => requestAnimationFrame(pump), 0);
    };
    requestAnimationFrame(pump);
  }
  thumbRenderer() { // the small renderer of the drawer pictures (made once, kept: the shaders of its parts stay compiled)
    if (this._thr !== undefined) return this._thr;
    const w = 136, h = 104; let r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { this._thr = null; return null; }
    r.setSize(w, h); r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.9; pm.dispose();
    const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(-1, 2, 1.5); sc.add(dl);
    return (this._thr = { r, sc, cam: new THREE.PerspectiveCamera(30, w / h, 1, 2000) });
  }
  thumbOne(k) { // one drawer picture (a data URL), or null when no WebGL can be had for it
    const T = this.thumbRenderer(); if (!T) return null;
    const type = k.startsWith('led_') ? 'led' : k; const def = PARTS[type]; const { r, sc, cam } = T;
    const obj = MD.buildPart({ type, props: Object.assign({}, def.props, type === 'led' ? { color: k.slice(4) } : {}), rot: 0, state: Object.assign({}, def.state0 || {}) });
    sc.add(obj); const box = new THREE.Box3().setFromObject(obj); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3()).length();
    cam.position.set(c.x + sz * 0.62, c.y + sz * 0.72, c.z + sz * 1.25); cam.lookAt(c); r.render(sc, cam);
    const u = r.domElement.toDataURL('image/png'); sc.remove(obj); obj.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); }); return u; // (its materials stay: their shaders are kept for the next picture)
  }
  thumbShown(k) { // a new picture: into the drawer's card (no rebuild of the drawer) and the headset's panel
    const type = k.startsWith('led_') ? 'led' : k; if (type === 'led' && k !== 'led_' + (this.ledColor || 'red')) return;
    const img = document.querySelector(`#plist .pc[data-type="${type}"] img`); if (img) img.src = this.thumbs[k];
    if (this.xr && this.xr.ui) this.xr.ui.sig = '';
  }
  // the shaders of every part in the drawers, made while the first lesson is read, one part a frame: a later lesson's new
  // parts then appear without a pause on a phone that cannot compile shaders in the background (a headset that can does
  // them all in the background). The materials are kept (their shaders stay); the shapes are let go.
  async warmParts() {
    if (this._warmed) return; this._warmed = true; const g = new THREE.Group(); g.name = 'warm'; g.visible = false; this.stage.root.add(g);
    const frame = nextFrame;
    for (const type of new Set(DRAWER)) {
      const def = PARTS[type]; try { g.add(MD.buildPart({ type, props: Object.assign({}, def.props), rot: 0, state: Object.assign({}, def.state0 || {}) })); } catch (e) { /* a part that needs the bench to be built */ }
      await frame();
    }
    try { g.add(MD.buildWire([0, 0, 0], new THREE.Vector3(0, 1, 0), [30, 0, 0], new THREE.Vector3(0, 1, 0), 'red', 0)); } catch (e) { /* none */ }
    if (this.view.halo) g.add(new THREE.Sprite(new THREE.SpriteMaterial({ map: this.view.halo, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))); // (an LED's glow: its shader stays when the last LED goes)
    try { await this.stage.warm(g); } catch (e) { /* drawn when first needed */ }
    this.stage.root.remove(g); g.traverse((o) => { if (o.geometry && !o.isSprite && !o.geometry.userData.shared) o.geometry.dispose(); }); this._warmKeep = g;
    this.prefetchThumbs(); // (the pictures' own small renderer is made now too, not when a lesson with parts opens)
  }
  thumbImg(type) { // the drawer picture as an image (the headset's panel draws it)
    const k = type === 'led' ? 'led_' + (this.ledColor || 'red') : type; const u = this.thumbs && this.thumbs[k]; if (!u) return null; this._ti = this._ti || {};
    let im = this._ti[k]; if (!im) { im = new Image(); im.onload = () => { if (this.xr.ui) this.xr.ui.sig = ''; }; im.src = u; this._ti[k] = im; } return im;
  }
  // ------------------------------------------------------------ pointer: drag parts, wires, press, turn, probe
  ndc(x, y) { const r = this.stage.renderer.domElement.getBoundingClientRect(); return new THREE.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); }
  tol() { return this.isPhoneish() ? 22 : 13; }
  initPointer() {
    const host = $('#stage');
    host.addEventListener('pointerdown', (e) => this.down(e), true);
    addEventListener('pointermove', (e) => this.move(e));
    addEventListener('pointerup', (e) => this.up(e)); addEventListener('pointercancel', (e) => this.up(e, true));
    host.addEventListener('pointerleave', () => { if (!this.drag) { this.view.showHover(null); this.hideTip(); } });
    this.touches = new Set();
    host.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') this.touches.add(e.pointerId); });
    addEventListener('pointerup', (e) => this.touches.delete(e.pointerId)); addEventListener('pointercancel', (e) => this.touches.delete(e.pointerId));
  }
  block(e) { this.stage.controls.enabled = false; e.stopPropagation(); e.preventDefault(); }
  down(e) {
    this.sound.unlock();
    if (window.DuetGate && DuetGate.active) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'touch' && this.touches.size >= 1) { if (this.drag && this.drag.kind === 'maybe') this.drag = null; return; } // two fingers: zoom / pan
    const x = e.clientX, y = e.clientY; this.lastXY = { x, y };
    const ndc = this.ndc(x, y); const hit = this.view.pickObject(ndc); const ep = this.view.nearestEndpoint(x, y, this.tol());
    if (this.tool === 'probe') {
      if (ep) { this.setProbe(ep); this.block(e); return; }
      if (hit && hit.kind === 'part') { this.select({ part: this.lab.parts.find((p) => p.uid === hit.uid) }); this.probePart = hit.uid; this.liveMeter(); this.block(e); return; }
      return;
    }
    if (hit && hit.kind === 'part' && !(this.tool === 'wire' && ep && this.lab.endpointFree(ep))) {
      const part = this.lab.parts.find((p) => p.uid === hit.uid);
      if (hit.role === 'cap') { part.state.pressed = true; this.lab.rebuild(); this.sound.click(); this.drag = { kind: 'press', part }; this.block(e); return; }
      if (hit.role === 'knob') { this.drag = { kind: 'knob', part, x, y, pos: part.state.pos }; this.select({ part }); this.block(e); return; }
      if (hit.role === 'stick') { this.drag = { kind: 'stick', part, x, y }; this.select({ part }); this.block(e); return; }
    }
    const occ = ep ? this.lab.occupant(ep) : null;
    const partOnTop = hit && hit.kind === 'part' && !(occ && occ.part && occ.part.uid === hit.uid && this.tool === 'wire');
    if (ep && (this.tool === 'wire' || !partOnTop) && !(hit && hit.kind === 'wire' && this.tool !== 'wire' && !(occ && occ.wire))) {
      const more = this.tool === 'wire' && occ && occ.wire && this.lab.endpointFree(ep); // a screw terminal takes a second wire
      if (!occ || (occ.wire && this.tool !== 'wire') || more) {
        if (occ && occ.wire && !more) this.drag = { kind: 'wireEnd', wire: occ.wire, end: occ.wire.a === ep ? 'a' : 'b', from: occ.wire.a === ep ? occ.wire.b : occ.wire.a, x, y, moved: false };
        else this.drag = { kind: 'wire', from: ep, x, y, moved: false, region: hit && hit.kind === 'region' ? hit.id : null };
        this.block(e); return;
      }
    }
    if (hit && hit.kind === 'part') { const part = this.lab.parts.find((p) => p.uid === hit.uid); this.drag = { kind: 'maybe', part, x, y }; this.block(e); return; }
    if (hit && hit.kind === 'wire') { const w = this.lab.wires.find((q) => q.uid === hit.uid); this.select({ wire: w }); this.block(e); return; }
    if (hit && hit.kind === 'region') { this.drag = { kind: 'region', id: hit.id, x, y }; return; } // a drag over the board still turns the view
    if (hit && hit.kind === 'world' && this.world && this.world.drag) { this.drag = { kind: 'wdrag', role: hit.role, x, y, lx: x }; this.block(e); return; }
    if (this.pendingWire) { this.pendingWire = null; this.view.showHover(null); }
  }
  startNew(e, type) {
    if (window.DuetGate && DuetGate.active) return;
    e.preventDefault(); this.sound.unlock();
    const props = Object.assign({}, PARTS[type].props, (this.mode === 'lesson' && this.rt.propsFor(type)) || {}, type === 'led' && !(this.mode === 'lesson' && this.rt.propsFor('led')) ? { color: this.ledColor || 'red' } : {});
    const step = this.mode === 'lesson' ? this.rt.step : null;
    const rot = step && step.k === 'place' && step.place.type === type ? step.place.rot : (PARTS[type].axial ? 3 : 0);
    this.drag = { kind: 'pnew', type, props, rot, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse' };
  }
  move(e) {
    const x = e.clientX, y = e.clientY; this.lastXY = { x, y };
    const d = this.drag;
    if (!d) { if (e.pointerType === 'mouse' && e.target === this.stage.renderer.domElement) this.hover(x, y); return; }
    const dist = Math.hypot(x - d.x, y - d.y);
    if (d.kind === 'pnew') { // a drawer card: a drag towards the bench takes the part (an up-down swipe scrolls the list)
      const dx = x - d.x, dy = y - d.y; if (Math.hypot(dx, dy) < (d.touch ? 10 : 4)) return;
      if (d.touch && Math.abs(dy) > Math.abs(dx) * 1.2) { this.drag = null; return; }
      d.kind = 'new'; document.body.classList.add('dragging'); this.toast(t('dropHere'));
    }
    if (d.kind === 'stick') { this.stickTo(d.part, (x - d.x) / 90, -(y - d.y) / 90); return; }
    if (d.kind === 'wdrag') { this.world.drag(-(x - d.lx) / 260); d.lx = x; return; }
    if (d.kind === 'knob') { const dv = ((x - d.x) - (y - d.y)) / 220; d.part.state.pos = Math.max(0, Math.min(1, d.pos + dv)); this.lab.stateV++; this.lab.instKey = null; this.stage.kick(); return; }
    if (d.kind === 'maybe' && dist > 6) { d.kind = 'move'; d.rot = d.part.rot; document.body.classList.add('dragging'); this.view.setHidden(d.part.uid, true); this.closeCallout(); }
    if (d.kind === 'move' || d.kind === 'new') { this.dragPart(x, y); return; }
    if (d.kind === 'wire' || d.kind === 'wireEnd') {
      if (dist > 5) d.moved = true;
      const to = this.view.nearestEndpoint(x, y, this.tol(), (ep) => ep !== d.from && (this.lab.endpointFree(ep) || (d.kind === 'wireEnd' && ep === d.wire[d.end])));
      this.view.showHover(to || d.from, to ? 0x46e07a : 0x40e8ff);
      if (d.moved) this.previewWire(d.from, to, x, y);
      this.hoverEp = to; this.showTip({ x, y });
    }
  }
  up(e, cancel) {
    this.stage.controls.enabled = true;
    const d = this.drag; this.drag = null; document.body.classList.remove('dragging');
    if (!d) return;
    const x = e.clientX, y = e.clientY;
    if (d.kind === 'pnew') return;
    if (d.kind === 'press') { d.part.state.pressed = false; this.lab.rebuild(); return; }
    if (d.kind === 'pnew') { // a drawer card: a drag towards the bench takes the part (an up-down swipe scrolls the list)
      const dx = x - d.x, dy = y - d.y; if (Math.hypot(dx, dy) < (d.touch ? 10 : 4)) return;
      if (d.touch && Math.abs(dy) > Math.abs(dx) * 1.2) { this.drag = null; return; }
      d.kind = 'new'; document.body.classList.add('dragging'); this.toast(t('dropHere'));
    }
    if (d.kind === 'knob') { this.renderCallout(); return; }
    if (d.kind === 'stick') { this.stickTo(d.part, 0, 0); return; } // it springs back to the middle
    if (d.kind === 'wdrag') return;
    if (d.kind === 'region') { if (Math.hypot(x - d.x, y - d.y) < 6) this.tapRegion(d.id); return; }
    if (d.kind === 'maybe') { this.select({ part: d.part }); return; }
    if (d.kind === 'move' || d.kind === 'new') {
      this.view.hideGhost(); const tgt = cancel ? null : d.target;
      if (d.part) this.view.setHidden(d.part.uid, false);
      if (d.kind === 'new') {
        if (tgt && tgt.ok && this.overCanvas(x, y)) { const p = this.lab.addPart(d.type, d.props, tgt.at, d.rot); if (p) { p.tag = this.mode === 'lesson' ? this.rt.tagFor(p) : null; this.lab.emit('parts', p); this.sound.click(); this.select({ part: p }); } }
        else if (!cancel && this.overCanvas(x, y)) this.toast(t('noFit'), 'bad');
      } else if (tgt && tgt.ok) { if (!this.lab.movePart(d.part, tgt.at, d.rot)) this.toast(t('noFit'), 'bad'); else this.sound.click(); }
      else this.view.sync();
      this.updateGhosts(); return;
    }
    if (d.kind === 'wire' || d.kind === 'wireEnd') {
      this.view.hideGhostWire && this.view.hideGhostWire(); this.clearPreview();
      const to = this.view.nearestEndpoint(x, y, this.tol(), (ep) => ep !== d.from && this.lab.endpointFree(ep));
      if (d.kind === 'wireEnd') {
        if (d.moved && to) { const w = d.wire, color = w.color; this.lab.removeWire(w); const nw = d.end === 'a' ? this.lab.addWire(to, w.b, color) : this.lab.addWire(w.a, to, color); if (!nw) this.lab.addWire(w.a, w.b, color); }
        else if (!d.moved) this.select({ wire: d.wire });
        this.view.showHover(null); return;
      }
      if (d.moved) { if (to) this.makeWire(d.from, to); this.view.showHover(null); return; }
      // a tap. Move tool: what it is (a header pin also counts as a tap on that part of the board).
      // Wire tool: the first end of a wire, or the second end of the one already started
      if (this.tool !== 'wire') { if (d.region) this.tapRegion(d.region); this.hoverEp = d.from; this.view.showHover(d.from); this.showTip({ x, y }); return; }
      if (d.region) { this.rt.taps.add(d.region); this.renderCard(); }
      if (this.pendingWire && this.pendingWire !== d.from) { this.makeWire(this.pendingWire, d.from); this.pendingWire = null; this.view.showHover(null); return; }
      this.pendingWire = d.from; this.view.showHover(d.from, 0xffc040); this.hoverEp = d.from; this.showTip({ x, y });
    }
  }
  overCanvas(x, y) { const el = document.elementFromPoint(x, y); return el === this.stage.renderer.domElement; }
  makeWire(a, b) {
    const w = this.lab.addWire(a, b);
    if (!w) { this.toast(t('epBusy'), 'bad'); return; }
    this.sound.click(); this.toast(t('wireMade', { a: this.epName(a), b: this.epName(b) }));
  }
  previewWire(a, b, x, y) {
    let pb, db = new THREE.Vector3(0, 1, 0);
    if (b) pb = this.lab.epPos(b); else { const p = this.view.planePoint(this.ndc(x, y), 14); if (!p) return; pb = [p.x, p.y, p.z]; }
    this.clearPreview();
    this.previewObj = MD.buildWire(this.lab.epPos(a), this.view.epDir(a), pb, b ? this.view.epDir(b) : db, this.lab.wireColor(a, b || a), 3, null);
    this.previewObj.traverse((o) => { o.raycast = () => {}; }); this.stage.root.add(this.previewObj); this.stage.kick();
  }
  clearPreview() { if (this.previewObj) { this.stage.root.remove(this.previewObj); MD.dispose(this.previewObj); this.previewObj = null; this.stage.kick(); } }
  // where a dragged part would go: the nearest holes on the breadboard (or the mat, for free parts)
  dragPart(x, y) { const ndc = this.ndc(x, y); this.dragPartWith((yy) => this.view.planePoint(ndc, yy), 36); }
  // pp(y): the point (bench mm) on the level y that the pointer is over (a mouse, a finger, or a ray in the headset)
  dragPartWith(pp, lead = 36) {
    const d = this.drag; const type = d.kind === 'new' ? d.type : d.part.type; const def = PARTS[type];
    const fake = { type, props: d.kind === 'new' ? d.props : d.part.props, rot: d.rot, state: {} };
    const pins = pinsOf(fake); const cx = pins.reduce((s, p) => s + p.x, 0) / pins.length, cz = pins.reduce((s, p) => s + p.z, 0) / pins.length;
    let target = null;
    const step = this.mode === 'lesson' ? this.rt.step : null; const want = step && step.k === 'place' && step.place.type === type && !this.lab.byTag(step.place.tag) ? step.place : null;
    if (def.mount === 'bb') {
      const p = pp(BB.top); if (!p) return;
      const lx = p.x - this.lab.bb.x - cx, lz = p.z - this.lab.bb.z - cz;
      let best = null, bd = 9;
      for (const h of BB.holes.values()) { const dd = (h.x - lx) ** 2 + (h.z - lz) ** 2; if (dd < bd) { bd = dd; best = h; } }
      if (want && want.at.hole && d.rot === want.rot) { const g = holeAt(want.at.hole); if ((g.x - lx) ** 2 + (g.z - lz) ** 2 < 7.6 ** 2) best = g; } // close to the lesson's ghost: snap to it
      if (best) { const f = this.lab.fit(Object.assign({}, fake), best.id, d.part); target = { ok: f.ok, at: { hole: best.id } }; }
    } else {
      const p = pp(0); if (!p) return;
      let at = { x: Math.round(p.x - cx), z: Math.round(p.z - cz + lead) };
      if (want && !want.at.hole && Math.hypot(want.at.x - at.x, want.at.z - at.z) < 40) { at = { x: want.at.x, z: want.at.z }; d.rot = want.rot; }
      target = { ok: this.freeOk(at, type), at };
    }
    d.target = target;
    if (target) this.view.ghostPart(type, fake.props, d.rot, target.at, target.ok); else this.view.hideGhost();
  }
  freeOk(at, type) { // a free part sits on the mat, in front of or beside the board and breadboard
    const inBox = (x0, x1, z0, z1) => at.x > x0 && at.x < x1 && at.z > z0 && at.z < z1;
    if (inBox(this.lab.board.x - 40, this.lab.board.x + 40, -35, 30) || inBox(this.lab.bb.x - 88, this.lab.bb.x + 88, -32, 34)) return false;
    return Math.abs(at.x + 15) < 200 && at.z > -120 && at.z < 175; void type;
  }
  rotateDragOrSel() {
    if (this.drag && (this.drag.kind === 'move' || this.drag.kind === 'new')) { this.drag.rot = ((this.drag.rot || 0) + 1) % 4; this.dragPart(this.lastXY.x, this.lastXY.y); return; }
    if (this.sel && this.sel.part) { const p = this.sel.part; const nr = (p.rot + 1) % 4; if (!this.lab.movePart(p, p.at, nr)) { if (!this.lab.movePart(p, p.at, (nr + 1) % 4)) this.toast(t('noFit'), 'bad'); } }
  }
  cancelDrag() { if (this.drag) { this.view.hideGhost(); this.clearPreview(); if (this.drag.part) this.view.setHidden(this.drag.part.uid, false); } this.drag = null; this.pendingWire = null; document.body.classList.remove('dragging'); }
  initKeys() {
    addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.run(); } return; }
      if (e.key === 'r' || e.key === 'R') this.rotateDragOrSel();
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel) this.removeSel();
      if (e.key === 'Escape') { this.cancelDrag(); this.closeCallout(); this.view.showHover(null); }
      const k = PADKEY[e.key]; if (k && this.world && this.world.cfg.car === 'bt') { e.preventDefault(); if (!e.repeat) this.world.control('key', k); } // batch 2: the arrow keys are the phone pad's buttons
    });
    addEventListener('keyup', (e) => { if (PADKEY[e.key] && this.world && this.world.cfg.car === 'bt') this.world.control('key', 'S'); });
  }
  // ------------------------------------------------------------ hover: what is under the pointer, and its voltage
  hover(x, y) {
    if (performance.now() - (this._hv || 0) < 40) return; this._hv = performance.now();
    const ep = this.view.nearestEndpoint(x, y, this.tol());
    let part = null; if (!ep) { const h = this.view.pickObject(this.ndc(x, y)); if (h && h.kind === 'part') part = this.lab.parts.find((p) => p.uid === h.uid); else if (h && h.kind === 'region') part = { region: h.id }; }
    this.hoverEp = ep; this.hoverPart = part;
    if (!this.pendingWire) this.view.showHover(ep);
    this.showTip({ x, y });
  }
  epName(ep) {
    if (ep.startsWith('H:')) return ep.slice(2).replace(/^([a-j])(\d+)$/, '$2$1').replace(/^(tp|tn|bp|bn)(\d+)$/, (m, r) => (r.endsWith('p') ? '+' : '−') + ' rail');
    if (ep.startsWith('B:')) { const p = this.lab.def.pins.find((q) => q.id === ep.slice(2)); return p.gpio !== undefined ? (p.gpio >= 14 ? 'A' + (p.gpio - 14) : (this.lab.def.pwm.includes(p.gpio) ? '~' : '') + p.gpio) : p.label; }
    if (ep.startsWith('T:')) { const [, uid, pid] = ep.split(':'); const p = this.lab.parts.find((q) => q.uid === uid); const pin = p && PARTS[p.type].pins.find((q) => q.id === pid); return p ? tx(PARTS[p.type].name).split(' (')[0] + ' ' + (pin ? tx(pin.name).split(':')[0] : pid) : ep; }
    return ep;
  }
  pinInfo(pin) { // a board pin: its job and what the sketch does with it now
    const B = this.lab.def; let name;
    if (pin.gpio !== undefined) name = pin.gpio >= 14 ? tx(BOARD_PIN.ana, { n: 'A' + (pin.gpio - 14) }) : tx(B.pwm.includes(pin.gpio) ? BOARD_PIN.pwm : BOARD_PIN.dig, { n: pin.gpio }) + (pin.gpio <= 1 ? tx(BOARD_PIN.ser, { x: pin.gpio ? 'TX' : 'RX' }) : '');
    else name = tx(BOARD_PIN[pin.id.replace(/\d$/, '')] || BOARD_PIN[pin.net] || { en: pin.label });
    let mode = '', duty = null; const m = this.lab.mcu;
    if (pin.gpio !== undefined && (m.state === 'running' || m.state === 'done')) {
      const P = m.pins[pin.gpio];
      if (P.mode === 1) { if (P.tone) mode = `OUTPUT · tone ${P.tone} Hz`; else if (P.pwm >= 0) { mode = `OUTPUT · PWM ${Math.round(P.pwm / 2.55)}%`; duty = P.pwm / 255; } else if (P.servo) mode = 'OUTPUT · Servo'; else mode = 'OUTPUT ' + (P.level ? 'HIGH' : 'LOW'); }
      else mode = P.mode === 2 ? 'INPUT_PULLUP' : 'INPUT';
    }
    return { name, mode, duty };
  }
  showTip(xy) {
    const el = $('#tip'); if (!xy) return;
    let h = '';
    const ep = this.hoverEp, part = this.hoverPart;
    if (ep) {
      const v = this.lab.voltageAt(ep); const vs = v === null ? t('floating') : fmtV(v) + ' V';
      if (ep.startsWith('H:')) {
        const hl = holeAt(ep.slice(2)); const occ = this.lab.occupant(ep);
        const info = hl.rail ? t('stripRail', { s: hl.rail.endsWith('p') ? '+' : '−' }) : t('stripCol', { a: hl.col + (hl.row <= 'e' ? 'a' : 'f'), b: hl.col + (hl.row <= 'e' ? 'e' : 'j') });
        h = `<b>${esc(t('holeTip', { id: this.epName(ep) }))}</b><span>${esc(info)} · ${esc(occ ? t('busy') : t('free1'))}</span><span class="v">${esc(vs)}</span>`;
      } else if (ep.startsWith('B:')) {
        const pin = this.lab.def.pins.find((q) => q.id === ep.slice(2)); const I = this.pinInfo(pin);
        h = `<b>${esc(I.name)}</b>${I.mode ? `<span>${esc(I.mode)}</span>` : ''}<span class="v">${esc(vs)}</span>` + (I.duty !== null ? pwmSvg(I.duty) : '');
      } else h = `<b>${esc(this.epName(ep))}</b><span class="v">${esc(vs)}</span>`;
    } else if (part && part.region) {
      const R = REGIONS[part.region]; h = `<b>${esc(tx(R.n))}</b>`;
    } else if (part) h = `<b>${esc(tx(PARTS[part.type].name))}</b><span class="v">${esc(this.partLive(part))}</span>`;
    if (!h) { this.hideTip(); return; }
    el.innerHTML = h; el.classList.add('show');
    const r = el.getBoundingClientRect(); let X = xy.x + 16, Y = xy.y + 16; if (X + r.width > innerWidth - 8) X = xy.x - r.width - 12; if (Y + r.height > innerHeight - 8) Y = xy.y - r.height - 12;
    el.style.left = X + 'px'; el.style.top = Y + 'px';
  }
  hideTip() { $('#tip').classList.remove('show'); this.hoverEp = null; this.hoverPart = null; }
  partLive(p) {
    const s = p.state, lab = this.lab, I = lab.currentOf(p);
    const vd = (a, b) => { const va = lab.voltageAt(p.ep[a]), vb = lab.voltageAt(p.ep[b]); return va === null || vb === null ? null : va - vb; };
    switch (p.type) {
      case 'led': return s.burnt ? t('burnt') : `${fmtV(vd('A', 'K'))} V · ${fmtI(I)} · ${t('brightness')} ${Math.round(Math.min(1, (s.b || 0) / 1.2) * 100)}%`;
      case 'rgb': return s.burnt ? t('burnt') : `R ${fmtI((s.ch || {}).R || 0)} · G ${fmtI((s.ch || {}).G || 0)} · B ${fmtI((s.ch || {}).B || 0)}`;
      case 'resistor': return `${fmtOhm(p.props.ohms)} · ${fmtV(vd('1', '2'))} V · ${fmtI(I)}`;
      case 'button': return (s.pressed ? '● ' : '○ ') + fmtI(I);
      case 'pot': return `${Math.round(s.pos * 100)}% · wiper ${fmtV(lab.voltageAt(p.ep.W))} V`;
      case 'ldr': return `${fmtV(vd('1', '2'))} V · ${fmtI(I)}`;
      case 'npn': { const e = lab.els.find((q) => q.part === p); return `Ic ${fmtI(e ? e.iAvg : 0)} · Ib ${fmtI(e ? e.ibAvg || 0 : 0)}`; }
      case 'diode': return `${fmtV(vd('A', 'K'))} V · ${fmtI(I)}`;
      case 'motor': return `${Math.round(Math.abs(s.w || 0) * 60 / (2 * Math.PI))} rpm · ${fmtI(s.i || 0)}`;
      case 'servo': return `${Math.round(s.angle)}° · ${s.powered ? '5 V ✓' : '—'}`;
      case 'hcsr04': return `${s.dist} cm · ${s.powered ? 'ON' : 'OFF'}`;
      case 'ir': return `${s.dist} cm · OUT ${s.near ? 'LOW' : 'HIGH'}`;
      case 'lm35': return `${lab.env.temp} °C · OUT ${fmtV(lab.voltageAt(p.ep.OUT))} V`;
      case 'buzzer': return s.on ? '♪' : '—';
      case 'battery': case 'bat18650': case 'psu5': return `${fmtV(vd('P', 'N'))} V · ${fmtI(I)}`;
      case 'l298n': { const pc = (v) => (v ? (v > 0 ? '▲' : '▼') + Math.round(Math.abs(v) * 100) + '%' : '■'); return `A ${pc(s.a)} · B ${pc(s.b)} · ${fmtV(s.vs || 0)} V` + (s.logic === false ? ' · ⚠ GND' : ''); }
      case 'bomotor': return `${Math.round(Math.abs(s.w || 0) / 48 * 60 / (2 * Math.PI))} rpm ${s.w > 1 ? '▲' : s.w < -1 ? '▼' : ''} · ${fmtI(s.i || 0)}`;
      case 'mg996r': return `${Math.round(s.angle)}° · ${s.powered ? '5 V ✓' : '—'}${s.load ? ' · ✊' : ''}`;
      case 'hcsr04f': return `${s.dist} cm · ${s.powered ? 'ON' : 'OFF'}`;
      case 'joystick': return `VRx ${Math.round(s.x * 1023)} · VRy ${Math.round(s.y * 1023)}${s.pressed ? ' · ●' : ''}`;
      case 'hc05': return !s.powered ? 'OFF' : s.paired ? 'paired ✓' : 'waiting…';
    }
    return '';
  }
  // ------------------------------------------------------------ callouts
  select(s) { this.sel = s; this.renderCallout(); }
  closeCallout() { this.sel = null; $('#callout').classList.remove('show'); }
  tapRegion(id) {
    this.rt.taps.add(id); this.select({ region: id }); this.renderCard();
    if (id === 'reset') this.resetBoard();
  }
  renderCallout() {
    const el = $('#callout'), s = this.sel; if (!s) { el.classList.remove('show'); return; }
    let h = '<button class="x" aria-label="Close">×</button>';
    if (s.part) {
      const p = s.part; if (!this.lab.parts.includes(p)) { this.closeCallout(); return; }
      const def = PARTS[p.type];
      h += `<h3>${esc(tx(def.name))}${p.type === 'led' ? ' · ' + esc(p.props.color) : ''}</h3><p>${esc(tx(def.info))}</p><div class="live" id="co-live">${esc(this.partLive(p))}</div>`;
      h += this.controlsFor(p);
      h += `<h4>${esc(t('pins'))}</h4><div class="pins">${def.pins.map((q) => `<div>${esc(tx(q.name))}<span data-ep="${esc(p.ep[q.id])}"></span></div>`).join('')}</div>`;
      h += `<h4>${esc(t('specs'))}</h4><table>${def.specs(p).filter(([, v]) => v).map(([k, v]) => `<tr><td>${esc(tx(SPEC[k] || { en: k }))}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
      h += `<div class="row"><button class="btn" id="co-rot">⟳ ${esc(t('rotate'))}</button><button class="btn" id="co-del">🗑 ${esc(t('del'))}</button></div>`;
    } else if (s.wire) {
      const w = s.wire; if (!this.lab.wires.includes(w)) { this.closeCallout(); return; }
      h += `<h3>${esc(t('wireMade', { a: this.epName(w.a), b: this.epName(w.b) }))}</h3><div class="live" id="co-live">${esc(fmtV(this.lab.voltageAt(w.a)))} V</div><h4>${esc(t('wireColor'))}</h4><div class="row">`;
      for (const c of Object.keys(MD.WIRE_COLORS)) h += `<button class="sw${c === w.color ? ' on' : ''}" data-wc="${c}" style="background:#${MD.WIRE_COLORS[c].toString(16).padStart(6, '0')}" aria-label="${c}"></button>`;
      h += `</div><div class="row"><button class="btn" id="co-del">🗑 ${esc(t('del'))}</button></div>`;
    } else if (s.region) {
      const R = REGIONS[s.region], B = BOARDS.uno; const reg = B.regions.find((r) => r.id === s.region);
      h += `<h3>${esc(tx(R.n))}</h3><p>${esc(tx(R.d))}</p>`;
      if (reg && reg.pins) { const hdr = s.region === 'digital' ? ['dl', 'dh'] : s.region === 'analog' ? ['an'] : ['pw']; h += `<div class="pins">${B.pins.filter((p) => hdr.includes(p.hdr) && p.net !== 'NC').map((p) => `<div>${esc(this.pinInfo(p).name)}<span data-ep="B:${p.id}"></span></div>`).join('')}</div>`; }
      if (s.region === 'usb') h += `<div class="row"><label>${esc(t('usb'))}</label><button class="btn${this.lab.board.usb ? ' on' : ''}" id="co-usb">${esc(this.lab.board.usb ? t('plugged') : t('unplugged'))}</button></div>`;
      if (s.region === 'mcu') h += `<h4>${esc(t('specs'))}</h4><table>${B.specs.map(([k, v]) => `<tr><td>${esc(tx(SPEC[k]))}</td><td>${esc(v)}</td></tr>`).join('')}</table>`;
      if (s.region === 'reset') h += `<div class="row"><button class="btn" id="co-reset">⟲ ${esc(t('reset'))}</button></div>`;
    }
    el.innerHTML = h; el.classList.add('show'); this.fitCallout();
    el.querySelector('.x').onclick = () => this.closeCallout();
    const q = (id) => el.querySelector(id);
    if (q('#co-rot')) q('#co-rot').onclick = () => this.rotateDragOrSel();
    if (q('#co-del')) q('#co-del').onclick = () => this.removeSel();
    if (q('#co-usb')) q('#co-usb').onclick = () => { this.lab.board.usb = !this.lab.board.usb; if (this.lab.board.usb && this.lab.mcu.prog) this.lab.mcu.start(); this.lab.emit('power', this.lab.board.usb); this.renderCallout(); this.renderStatus(); };
    if (q('#co-reset')) q('#co-reset').onclick = () => this.resetBoard();
    for (const b of el.querySelectorAll('[data-wc]')) b.onclick = () => { s.wire.color = b.dataset.wc; this.view.sync(); this.renderCallout(); };
    this.bindControls(el);
    this.liveCallout();
  }
  fitCallout() { // over the code panel, but never over its Run bar
    const el = $('#callout'), rb = $('#runbar').getBoundingClientRect(), top = el.getBoundingClientRect().top;
    const z = parseFloat(getComputedStyle(el).zoom) || 1; // the teacher board draws the panels bigger (CSS zoom)
    el.style.maxHeight = rb.top > top + 160 * z && innerWidth > 980 && innerHeight > 520 ? (rb.top - top - 8) / z + 'px' : '';
  }
  controlsFor(p) {
    const r = (id, label, min, max, val, step = 1) => `<div class="row"><label>${esc(label)}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span id="${id}-v"></span></div>`;
    switch (p.type) {
      case 'led': return `<div class="row"><label>${esc(t('color'))}</label>${Object.keys(LED_COLORS).map((c) => `<button class="sw${c === p.props.color ? ' on' : ''}" data-col="${c}" style="background:#${LED_COLORS[c].body.toString(16).padStart(6, '0')}"></button>`).join('')}</div>`;
      case 'resistor': return `<div class="row"><label>${esc(t('value'))}</label><select id="co-ohm">${RES_VALUES.map((v) => `<option value="${v}"${v === p.props.ohms ? ' selected' : ''}>${fmtOhm(v)}</option>`).join('')}</select></div><div class="row"><label>${esc(t('span'))}</label><select id="co-span">${[3, 4, 5, 6, 7].map((v) => `<option value="${v}"${v === p.props.span ? ' selected' : ''}>${v} × 2.54 mm</option>`).join('')}</select></div>`;
      case 'diode': return `<div class="row"><label>${esc(t('span'))}</label><select id="co-span">${[3, 4, 5, 6, 7].map((v) => `<option value="${v}"${v === p.props.span ? ' selected' : ''}>${v} × 2.54 mm</option>`).join('')}</select></div>`;
      case 'pot': return r('co-pos', t('knob'), 0, 100, Math.round(p.state.pos * 100));
      case 'button': case 'joystick': return `<div class="row"><button class="btn" id="co-press">● ${esc(t('press'))}</button></div>`;
      case 'ldr': return r('co-light', t('light'), 0, 100, Math.round(this.lab.env.light * 100));
      case 'lm35': return r('co-temp', t('temp') + ' °C', 0, 100, this.lab.env.temp);
      case 'hcsr04': case 'hcsr04f': return p.state.ext ? '' : r('co-dist', t('dist') + ' (cm)', 2, 300, p.state.dist);
      case 'ir': return p.state.ext ? '' : r('co-dist', t('dist') + ' (cm)', 1, 40, p.state.dist) + r('co-thr', t('thr') + ' (cm)', 2, 30, p.state.thr);
    }
    return '';
  }
  bindControls(el) {
    const p = this.sel && this.sel.part; if (!p) return; const q = (s) => el.querySelector(s);
    const bump = () => { this.lab.stateV++; this.lab.instKey = null; this.stage.kick(); };
    for (const b of el.querySelectorAll('[data-col]')) b.onclick = () => { this.lab.setProps(p, { color: b.dataset.col }); this.renderCallout(); };
    if (q('#co-ohm')) q('#co-ohm').onchange = (e) => { this.lab.setProps(p, { ohms: +e.target.value }); this.renderCallout(); };
    if (q('#co-span')) q('#co-span').onchange = (e) => { if (!this.lab.setProps(p, { span: +e.target.value })) this.toast(t('noFit'), 'bad'); this.renderCallout(); };
    if (q('#co-pos')) q('#co-pos').oninput = (e) => { p.state.pos = e.target.value / 100; bump(); };
    if (q('#co-light')) q('#co-light').oninput = (e) => this.setLight(e.target.value / 100);
    if (q('#co-temp')) q('#co-temp').oninput = (e) => { this.lab.env.temp = +e.target.value; bump(); };
    if (q('#co-dist')) q('#co-dist').oninput = (e) => { p.state.dist = +e.target.value; bump(); };
    if (q('#co-thr')) q('#co-thr').oninput = (e) => { p.state.thr = +e.target.value; bump(); };
    const pr = q('#co-press'); if (pr) { const on = (v) => (e) => { e.preventDefault(); p.state.pressed = v; this.lab.rebuild(); if (v) this.sound.click(); }; pr.onpointerdown = on(true); pr.onpointerup = on(false); pr.onpointerleave = on(false); }
  }
  liveCallout() {
    const el = $('#callout'); if (!this.sel || !el.classList.contains('show')) return;
    const live = el.querySelector('#co-live'); if (live && this.sel.part) live.textContent = this.partLive(this.sel.part); else if (live && this.sel.wire) live.textContent = fmtV(this.lab.voltageAt(this.sel.wire.a)) + ' V';
    for (const sp of el.querySelectorAll('[data-ep]')) { const v = this.lab.voltageAt(sp.dataset.ep); sp.textContent = v === null ? '—' : fmtV(v) + ' V'; }
    for (const [id, f] of [['co-pos', (v) => v + '%'], ['co-light', (v) => v + '%'], ['co-temp', (v) => v + ' °C'], ['co-dist', (v) => v + ' cm'], ['co-thr', (v) => v + ' cm']]) { const i = el.querySelector('#' + id), o = el.querySelector('#' + id + '-v'); if (i && o) o.textContent = f(i.value); }
  }
  // ------------------------------------------------------------ the robot next to the bench (worlds.js) and its panel
  setWorld(cfg) {
    if (this.world) { this.world.dispose(); this.world = null; }
    this.view.worldPick = null; document.body.classList.toggle('has-world', !!cfg);
    if (cfg) {
      const w = this.world = (cfg.make || makeWorld)(this, cfg); this.view.worldPick = () => (this.world ? this.world.pickables() : []); // (batch 5: cfg.make, a world that makes itself: the micro:bit desk)
      w.build().then(() => { if (this.world === w) { this.renderWorld(true); this.stage.kick(); } });
    }
    this.renderWorld(true);
  }
  // the panel: live rows, and the robot's own controls (a hand, a syringe, the phone's buttons, back to the start)
  renderWorld(full) {
    const el = $('#world'); if (!el) return; const W = this.world;
    if (!W) { el.classList.remove('show'); $('#wlabels').innerHTML = ''; return; }
    const h = W.hud(); el.classList.add('show');
    if (full || this._wkey !== W) {
      this._wkey = W; $('#w-t').textContent = tx(h.title);
      const ctl = $('#w-ctl'); ctl.innerHTML = '';
      for (const c of h.controls || []) {
        const d = document.createElement('div'); d.className = 'wc wc-' + c.kind; d.dataset.id = c.id;
        if (c.kind === 'button') { d.innerHTML = `<button class="btn">${esc(tx(c.label))}</button>`; d.firstChild.onclick = () => { this.sound.unlock(); W.control(c.id); this.renderWorld(false); }; }
        if (c.kind === 'range') { d.innerHTML = `<label>${esc(tx(c.label))}</label><input type="range" min="${c.min}" max="${c.max}" value="${c.value}"><span></span>`; d.querySelector('input').oninput = (e) => { W.control(c.id, +e.target.value); this.stage.kick(); }; }
        if (c.kind === 'seg') { d.innerHTML = `<label>${esc(tx(c.label))}</label><div class="seg">${c.options.map(([v, l]) => `<button data-v="${esc(v)}">${esc(tx(l))}</button>`).join('')}</div>`; for (const b of d.querySelectorAll('button')) b.onclick = () => { W.control(c.id, b.dataset.v); this.renderWorld(false); }; }
        if (c.kind === 'pad') {
          d.innerHTML = `<div class="phone"><div class="ph-t">${esc(tx(c.label))}</div><div class="ph-s"></div><button class="btn ph-pair"></button><div class="ph-pad">${[['F', '▲'], ['L', '◀'], ['S', '■'], ['R', '▶'], ['B', '▼']].map(([k, g]) => `<button data-k="${k}" aria-label="${k}">${g}</button>`).join('')}</div></div>`;
          d.querySelector('.ph-pair').onclick = () => { W.control('pair'); this.renderWorld(false); };
          for (const b of d.querySelectorAll('[data-k]')) {
            const k = b.dataset.k; b.onpointerdown = (e) => { e.preventDefault(); b.classList.add('on'); W.control('key', k); };
            const upk = () => { if (!b.classList.contains('on')) return; b.classList.remove('on'); if (k !== 'S') W.control('key', 'S'); }; b.onpointerup = upk; b.onpointerleave = upk; b.onpointercancel = upk;
          }
        }
        ctl.appendChild(d);
      }
    }
    $('#w-rows').innerHTML = h.rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    if (full) requestAnimationFrame(() => this.layout());
    for (const c of h.controls || []) {
      const d = $('#w-ctl').querySelector(`[data-id="${c.id}"]`); if (!d) continue;
      if (c.kind === 'range') { const i = d.querySelector('input'); if (document.activeElement !== i) i.value = c.value; d.querySelector('span').textContent = c.value + (c.unit ? ' ' + c.unit : ''); }
      if (c.kind === 'seg') for (const b of d.querySelectorAll('button')) b.classList.toggle('on', b.dataset.v === c.value);
      if (c.kind === 'pad') { d.querySelector('.ph-s').textContent = c.status || ''; const pb = d.querySelector('.ph-pair'); pb.textContent = c.paired ? '✓ ' + c.status : tx(WORLD_PAIR); pb.disabled = !c.canPair || c.paired; d.classList.toggle('live', !!c.paired); }
    }
    this._wlabels = h.labels || [];
  }
  placeLabels() { // the arm's joint angles, next to the joints
    const box = $('#wlabels'); const L = this._wlabels || []; if (this.stage.renderer.xr.isPresenting) { box.innerHTML = ''; return; }
    while (box.children.length < L.length) box.appendChild(document.createElement('i')); while (box.children.length > L.length) box.lastChild.remove();
    L.forEach(([txt, pos], i) => { const e = box.children[i]; const s = this.stage.toScreen(pos); if (e.textContent !== txt) e.textContent = txt; e.style.transform = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px)`; e.style.display = s.z > 1 ? 'none' : ''; });
  }
  // the joystick's stick, pushed by dx, dy (−1 .. 1 from the middle)
  stickTo(p, dx, dy) { p.state.x = Math.max(0, Math.min(1, 0.5 + dx / 2)); p.state.y = Math.max(0, Math.min(1, 0.5 + dy / 2)); this.lab.stateV++; this.lab.instKey = null; this.stage.kick(); }
  onBT(r) { if (r !== 'ok' && WORLD_BT[r]) this.toast(tx(WORLD_BT[r]), 'bad', 4000); }
  removeSel() { const s = this.sel; if (!s) return; if (s.part) this.lab.removePart(s.part); if (s.wire) this.lab.removeWire(s.wire); this.closeCallout(); }
  // ------------------------------------------------------------ multimeter
  setProbe(ep) {
    if (!this.probes[0] || this.probes[1]) { this.probes = [ep, null]; } else this.probes[1] = ep;
    this.probePart = null; this.view.showProbe(0, this.probes[0]); this.view.showProbe(1, this.probes[1]); this.liveMeter();
  }
  liveMeter() {
    if (this.tool !== 'probe') return;
    const [a, b] = this.probes; let txt = '– – –', lab = '';
    if (this.probePart) { const p = this.lab.parts.find((x) => x.uid === this.probePart); if (p) { const I = this.lab.currentOf(p); txt = (Math.abs(I) >= 1 ? Math.abs(I).toFixed(2) : (Math.abs(I) * 1000).toFixed(Math.abs(I) < 0.01 ? 2 : 1)) + `<small>${Math.abs(I) >= 1 ? 'A' : 'mA'}</small>`; lab = t('current') + ' · ' + tx(PARTS[p.type].name); } }
    else if (a) {
      const va = this.lab.voltageAt(a), vb = b ? this.lab.voltageAt(b) : 0;
      txt = va === null || vb === null ? '0.00<small>V</small>' : (va - vb).toFixed(2) + '<small>V</small>';
      lab = va === null ? t('floating') : t('reading', { v: va === null || vb === null ? '—' : (va - vb).toFixed(2) });
    } else lab = t('probeHint');
    $('#m-lcd').innerHTML = txt; $('#m-r').textContent = a ? this.epName(a) : '–'; $('#m-b').textContent = b ? this.epName(b) : 'GND'; $('#m-lab').textContent = lab;
  }
}
function pwmSvg(d) { // a small picture of the PWM wave on a pin
  const w = 120, h = 22, n = 4, pw = w / n; let path = `M0 ${h - 3}`;
  for (let i = 0; i < n; i++) { const x0 = i * pw, x1 = x0 + pw * d; path += ` L${x0} 3 L${x1} 3 L${x1} ${h - 3} L${x0 + pw} ${h - 3}`; }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path}" fill="none" stroke="#9ff0b0" stroke-width="1.6"/></svg>`;
}

new App();
// offline: sw.js (made by devtools/offline/build_sw.py) saves every file of the app on the device the first time
if ('serviceWorker' in navigator && !TEST && !Q.has('shot') && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) navigator.serviceWorker.register('./sw.js').catch(() => {});
// test hooks (devtools/test/robotest.mjs): where things are on the screen, so the test can drag and tap like a student
window.robo = {
  screen(ep) { const a = window.app; const p = a.lab.epPos(ep); const s = a.stage.toScreen(p); return { x: s.x, y: s.y }; },
  holeScreen(hole) { return this.screen('H:' + hole); },
  partScreen(uid) { const a = window.app; const p = a.lab.parts.find((q) => q.uid === uid || q.tag === uid); if (!p) return null; const ud = a.view.parts.get(p.uid); const v = new THREE.Vector3(); const box = new THREE.Box3().setFromObject(ud.obj); box.getCenter(v); const s = a.stage.toScreen([v.x / a.stage.root.scale.x, v.y / a.stage.root.scale.y, v.z / a.stage.root.scale.z]); return { x: s.x, y: s.y }; },
  // where to drop a drawer part so that it lands on the lesson's ghost
  dropFor(type, at, rot) {
    const a = window.app; const fake = { type, props: Object.assign({}, PARTS[type].props), rot: rot || 0, state: {} }; const pins = pinsOf(fake);
    const cx = pins.reduce((s, p) => s + p.x, 0) / pins.length, cz = pins.reduce((s, p) => s + p.z, 0) / pins.length;
    if (at.hole) { const h = holeAt(at.hole); const s = a.stage.toScreen([a.lab.bb.x + h.x + cx, BB.top, a.lab.bb.z + h.z + cz]); return { x: s.x, y: s.y }; }
    const s = a.stage.toScreen([at.x + cx, 0, at.z + cz - 36]); return { x: s.x, y: s.y };
  },
  state() { const a = window.app, r = a.rt; return { lesson: a.lessonId, step: r.i, of: r.lesson ? r.lesson.steps.length : 0, kind: r.step && r.step.k, done: r.step ? r.stepDone(r.step) : false, complete: r.complete, mcu: a.lab.mcu.state, err: a.lab.mcu.err, parts: a.lab.parts.length, wires: a.lab.wires.length }; },
  ghosts() { return window.app.rt.ghosts(); },
  settled() { return !window.app.stage.goal; },
  regionScreen(id) { const a = window.app; const d = a.lab.def && a.lab.def.regions ? a.lab.def : BOARDS.uno; const r = d.regions.find((q) => q.id === id); if (!r) return null; const s = a.stage.toScreen([a.lab.board.x + r.at[0], (d.pcbY || 3) + 1.6 + r.h * 0.8, a.lab.board.z + r.at[1]]); return { x: s.x, y: s.y }; }, // (the board on the bench: Uno, Nano, Mega, ESP32)
  roleScreen(tag, role) { const a = window.app; const p = a.lab.byTag(tag); if (!p) return null; const e = a.view.parts.get(p.uid); let o = null; e.obj.traverse((q) => { if (q.userData.role === role) o = q; }); if (!o) return null; const box = new THREE.Box3().setFromObject(o); const c = box.getCenter(new THREE.Vector3()); c.y = box.max.y; const inv = new THREE.Matrix4().copy(a.stage.root.matrixWorld).invert(); c.applyMatrix4(inv); const s = a.stage.toScreen([c.x, c.y, c.z]); return { x: s.x, y: s.y }; },
  callout() { const el = document.getElementById('callout'); return el.classList.contains('show') ? el.querySelector('h3').textContent : null; },
  step() { return window.app.rt.step; },
  // batch 2: the robot beside the bench
  world() { const W = window.app.world; if (!W) return null; const h = W.ready ? W.hud() : { rows: [] }; return { kind: W.kind, ready: W.ready, buildMs: W.buildMs, flags: W.sim ? [...W.sim.flags] : [], rows: h.rows, vals: W.sim && { odo: W.sim.odo, laps: W.sim.lap && W.sim.lap.n, bumps: W.sim.bumps, x: W.sim.x, z: W.sim.z, h: W.sim.h } }; },
  worldCtl(id, v) { const W = window.app.world; if (W) W.control(id, v); },
  // the headset (devtools/test/roboxr.mjs drives an emulated Quest: IWER)
  _pins(type, rot) { const pins = pinsOf({ type, props: Object.assign({}, PARTS[type].props), rot: rot || 0 }); return [pins.reduce((s, p) => s + p.x, 0) / pins.length, pins.reduce((s, p) => s + p.z, 0) / pins.length]; },
  _hole(id) { const h = holeAt(id); return { x: h.x, z: h.z }; },
  partWorld(tag) { const a = window.app; const p = a.lab.byTag(tag); if (!p) return null; const e = a.view.parts.get(p.uid); const b = new THREE.Box3().setFromObject(e.obj); const c = b.getCenter(new THREE.Vector3()); c.y = b.max.y - 0.2 * (b.max.y - b.min.y); return c.toArray(); },
  roleWorld(tag, role) { const a = window.app; const p = a.lab.byTag(tag); if (!p) return null; const e = a.view.parts.get(p.uid); let o = null; e.obj.traverse((q) => { if (q.userData.role === role) o = q; }); if (!o) return null; const b = new THREE.Box3().setFromObject(o); const c = b.getCenter(new THREE.Vector3()); c.y = b.max.y; return c.toArray(); },
  xrRay(i) { const r = window.app.xr.ui.rayOf(i); return r && { o: r.o.toArray(), d: r.d.toArray() }; },
  toWorld(p) { const a = window.app; a.stage.root.updateMatrixWorld(true); return new THREE.Vector3(...p).applyMatrix4(a.stage.root.matrixWorld).toArray(); },
  epWorld(ep) { return this.toWorld(window.app.lab.epPos(ep)); },
  xrItem(id) { const ui = window.app.xr.ui; ui.sig = ''; ui.draw(); const it = ui.items.find((q) => q.id === id); if (!it) return null; ui.panel.updateMatrixWorld(true); const g = ui.panel.geometry.parameters; return new THREE.Vector3(((it.x + it.w / 2) / 1024 - 0.5) * g.width, (0.5 - (it.y + it.h / 2) / 1152) * g.height, 0).applyMatrix4(ui.panel.matrixWorld).toArray(); },
  xrItems() { const ui = window.app.xr.ui; ui.sig = ''; ui.draw(); return ui.items.map((q) => q.id).filter(Boolean); },
  xrShot() { // a picture of what the headset sees (the emulator draws its eyes elsewhere): one frame from the XR camera's pose
    const a = window.app, r = a.stage.renderer; const xc = r.xr.getCamera(); const cam = new THREE.PerspectiveCamera(70, r.domElement.width / r.domElement.height, 0.02, 200);
    xc.matrixWorld.decompose(cam.position, cam.quaternion, cam.scale); cam.scale.set(1, 1, 1); cam.updateMatrixWorld(true);
    r.xr.enabled = false; r.setRenderTarget(null); r.render(a.stage.scene, cam); const url = r.domElement.toDataURL('image/jpeg', 0.85); r.xr.enabled = true; return url;
  },
  xrState() { const ui = window.app.xr.ui; return { on: !!window.app.xr.session, tab: ui.tab, inHand: ui.inHand && ui.inHand.ad.type, drag: ui.drag.map((d) => d && d.kind), pending: ui.pending || null, focus: window.app.xr.focus, presenting: window.app.stage.renderer.xr.isPresenting }; },
  calls() { const r = window.app.stage.renderer; return { calls: r.info.render.calls, tris: r.info.render.triangles, progs: r.info.programs.length }; },
};
