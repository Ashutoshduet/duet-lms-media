// DUET classroom link, used by Science Lab 360, Maths Lab 360 and Human Body 360.
// science/js/classroom.js is the master copy; body/js/classroom.js is a copy kept in step by the pre-commit hook.
//
// A teacher opens the class page (duet-lms-media/class/) and gets a 4-digit class code. Each student types the code and
// a roll number in the app (keypad in the headset). The apps then talk to the teacher's page directly over WebRTC
// (PeerJS): the free public PeerJS server only introduces them, so inside a school the data goes over the school's own
// Wi-Fi. A student's app sends: what it is doing (activity, step, VR or screen, battery), a raised hand, a small picture
// of what the student sees (only while the teacher's page asks for it), and every quiz and activity result. Results are
// also kept on the device and sent again until the teacher's page confirms them, so nothing is lost when Wi-Fi drops.
// The teacher's page sends: "eyes on me" (pause), open an activity, start a quiz, a message, a language, end class.
import * as THREE from 'three';

export const CLASS_VER = 1;
const PREFIX = 'duetstem-class-v1-';
export const classPeerId = (code) => PREFIX + String(code).replace(/\D/g, '');
export const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }] };

const LS = 'duet.class.';
export const cstore = {
  get(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} },
};
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// PeerJS (MIT) is loaded only when a class is joined
let peerLib = null;
export function loadPeer(src) {
  if (typeof window !== 'undefined' && window.peerjs) return Promise.resolve(window.peerjs);
  if (!peerLib) peerLib = new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = src || new URL('../lib/peerjs.min.js', import.meta.url).href;
    s.onload = () => (window.peerjs ? ok(window.peerjs) : no(new Error('peerjs'))); s.onerror = () => { peerLib = null; no(new Error('peerjs')); };
    document.head.appendChild(s);
  });
  return peerLib;
}

// ---------------------------------------------------------------- a quiz: questions with 3 or 4 choices, answered one by one
// q: { q: {en,hi,hg}, opts: [{en,hi,hg}…], right: index, kind, img? , part? }
export class QuizRun {
  constructor(meta, questions) {
    this.meta = meta; // { id, title: {en,hi,hg}, kind: 'activity'|'chapter'|'parts' }
    this.qs = questions; this.i = 0; this.picks = []; this.t0 = Date.now(); this.state = 'ask'; // ask → shown (after a pick) → … → done
  }
  get cur() { return this.qs[this.i]; }
  get score() { return this.picks.filter((p, i) => p === this.qs[i].right).length; }
  pick(k) { if (this.state !== 'ask') return false; this.picks[this.i] = k; this.state = 'shown'; return k === this.cur.right; }
  next() { if (this.state !== 'shown') return; if (this.i + 1 < this.qs.length) { this.i++; this.state = 'ask'; } else { this.state = 'done'; this.t1 = Date.now(); } }
  result(lang = 'en') {
    const T = (o) => (o && (o.en || o[lang])) || '', TL = (o) => (o && (o[lang] || o.en)) || ''; const both = lang !== 'en';
    return { kind: 'quiz', id: this.meta.id, title: T(this.meta.title), qkind: this.meta.kind, score: this.score, total: this.qs.length, secs: Math.round(((this.t1 || Date.now()) - this.t0) / 1000), lang,
      items: this.qs.map((q, i) => { const p = this.picks[i] == null ? null : q.opts[this.picks[i]], r = q.opts[q.right];
        const it = { q: T(q.q), pick: p ? T(p) : '', right: T(r), ok: this.picks[i] === q.right };
        if (both) Object.assign(it, { lq: TL(q.q), lpick: p ? TL(p) : '', lright: TL(r) }); return it; }) };
  }
}
// shuffle a question's choices (the right one moves with them); deterministic for a seed
export function shuffled(arr, seed = Math.random() * 1e9) {
  const a = arr.slice(); let s = Math.floor(seed) % 2147483647 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function makeQ(q, right, wrong, extra = {}, seed) {
  const opts = shuffled([right, ...wrong.slice(0, 3)], seed);
  return { q, opts, right: opts.indexOf(right), ...extra };
}

// ---------------------------------------------------------------- what the student sees, as a small JPEG (for the teacher's screen)
const SNAP = { rt: null, cv: null, cam: new THREE.PerspectiveCamera(70, 16 / 9, 0.02, 60), px: null };
export function snapView(renderer, scene, camera, w = 192, h = 108) {
  try {
    if (!SNAP.rt || SNAP.rt.width !== w) { if (SNAP.rt) SNAP.rt.dispose(); SNAP.rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace }); SNAP.px = new Uint8Array(w * h * 4); SNAP.cv = document.createElement('canvas'); SNAP.cv.width = w; SNAP.cv.height = h; }
    const xr = renderer.xr, live = xr.enabled && xr.isPresenting; const src = live ? xr.getCamera() : camera;
    const C = SNAP.cam; src.updateMatrixWorld(); C.position.setFromMatrixPosition(src.matrixWorld); C.quaternion.setFromRotationMatrix(new THREE.Matrix4().extractRotation(src.matrixWorld));
    C.fov = live ? 80 : camera.fov; C.aspect = w / h; C.near = 0.02; C.far = 60; C.updateProjectionMatrix(); C.updateMatrixWorld(true);
    const prev = renderer.getRenderTarget(), en = xr.enabled, sh = renderer.shadowMap.autoUpdate;
    xr.enabled = false; renderer.shadowMap.autoUpdate = false; renderer.setRenderTarget(SNAP.rt); renderer.clear(); renderer.render(scene, C);
    renderer.readRenderTargetPixels(SNAP.rt, 0, 0, w, h, SNAP.px);
    renderer.setRenderTarget(prev); xr.enabled = en; renderer.shadowMap.autoUpdate = sh;
    const X = SNAP.cv.getContext('2d'), im = X.createImageData(w, h);
    for (let y = 0; y < h; y++) im.data.set(SNAP.px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); // the picture comes out upside down
    X.putImageData(im, 0, 0); return SNAP.cv.toDataURL('image/jpeg', 0.62);
  } catch (e) { return null; }
}

// ---------------------------------------------------------------- the student's side
// o: { app: 'science'|'maths'|'body', status(): {...}, command(msg), snap(w,h): dataURL|null, changed() }
export class ClassLink {
  constructor(o) {
    this.o = o; this.state = 'off'; this.err = ''; this.help = false; this.watch = 0; this.className = ''; this.frozen = null; this.msg = null;
    this.code = cstore.get('code', ''); this.roll = cstore.get('roll', ''); this.name = cstore.get('name', '');
    this.results = cstore.get('results', []); // every result of this device, newest last; .sent once the teacher confirmed it
    this.batt = null; this.retry = 0;
    if (typeof navigator !== 'undefined' && navigator.getBattery) navigator.getBattery().then((b) => { const f = () => { this.batt = { l: Math.round(b.level * 100), c: b.charging }; }; f(); b.addEventListener('levelchange', f); b.addEventListener('chargingchange', f); }).catch(() => {});
    // still in a class when the app opened again within 3 hours: join again by itself
    const was = cstore.get('in', 0); if (this.code && this.roll && was && Date.now() - was < 3 * 3600e3) setTimeout(() => this.join(this.code, this.roll, this.name), 600);
  }
  get on() { return this.state === 'on'; }
  get inClass() { return this.state !== 'off'; }
  changed() { this.o.changed && this.o.changed(); }
  join(code, roll, name = '') {
    code = String(code).replace(/\D/g, '').slice(0, 6); roll = String(roll).trim().slice(0, 12); name = String(name || '').trim().slice(0, 40);
    if (!code || !roll) return;
    this.leave(true); this.code = code; this.roll = roll; this.name = name; cstore.set('code', code); cstore.set('roll', roll); cstore.set('name', name); cstore.set('in', Date.now());
    this.state = 'connecting'; this.err = ''; this.gen = (this.gen || 0) + 1; const gen = this.gen; this.changed();
    loadPeer().then((P) => { if (gen === this.gen) this.open(P, gen); }).catch(() => { if (gen !== this.gen) return; this.err = 'offline'; this.state = 'lost'; this.changed(); this.later(gen); });
  }
  open(P, gen) {
    const peer = this.peer = new P.Peer(undefined, { config: ICE, debug: 0 });
    peer.on('open', () => { if (gen !== this.gen) return; this.connect(gen); });
    peer.on('error', (e) => { if (gen !== this.gen) return;
      this.err = e.type === 'peer-unavailable' ? 'nocode' : e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed' ? 'offline' : e.type || 'error';
      if (this.state !== 'on') { this.state = 'lost'; this.changed(); this.later(gen); } });
    peer.on('disconnected', () => { if (gen === this.gen && !peer.destroyed) setTimeout(() => { try { if (gen === this.gen && !peer.destroyed) peer.reconnect(); } catch (e) {} }, 1500); });
  }
  connect(gen) {
    if (gen !== this.gen || !this.peer || this.peer.destroyed) return;
    if (this.conn) { try { this.conn.close(); } catch (e) {} }
    const c = this.conn = this.peer.connect(classPeerId(this.code), { reliable: true, serialization: 'json', metadata: { roll: this.roll, name: this.name, app: this.o.app, v: CLASS_VER } });
    const t = setTimeout(() => { if (gen === this.gen && c === this.conn && !c.open) { this.err = this.err || 'slow'; this.state = 'lost'; this.changed(); this.later(gen); } }, 15000);
    c.on('open', () => { clearTimeout(t); if (gen !== this.gen || c !== this.conn) return; this.state = 'on'; this.err = ''; this.retry = 0; cstore.set('in', Date.now());
      this.send({ t: 'hello', roll: this.roll, name: this.name, app: this.o.app, v: CLASS_VER, ua: navigator.userAgent.slice(0, 160) }); this.lastSt = ''; this.tick(true); this.flush(); this.changed();
      clearInterval(this._iv); this._iv = setInterval(() => { if (gen === this.gen) this.tick(false); }, 1000); }); // the status goes out on a timer, so it keeps going while the page is hidden
    c.on('data', (m) => { if (gen === this.gen) this.onData(m); });
    c.on('close', () => { clearTimeout(t); if (gen !== this.gen || c !== this.conn) return; if (this.state === 'on') { this.state = 'lost'; this.changed(); } this.later(gen); });
    c.on('error', () => {});
  }
  later(gen) { // try again, a little later each time (3 s … 20 s)
    clearTimeout(this._rt); const d = Math.min(20000, 3000 * (1 + this.retry++));
    this._rt = setTimeout(() => { if (gen !== this.gen) return; if (!this.peer || this.peer.destroyed) { loadPeer().then((P) => gen === this.gen && this.open(P, gen)).catch(() => this.later(gen)); return; }
      if (this.peer.disconnected) { try { this.peer.reconnect(); } catch (e) {} setTimeout(() => this.connect(gen), 1500); } else this.connect(gen); }, d);
  }
  leave(quiet) {
    this.gen = (this.gen || 0) + 1; clearTimeout(this._rt); clearInterval(this._iv);
    if (this.conn && this.conn.open && !quiet) this.send({ t: 'bye' });
    const p = this.peer; this.peer = this.conn = null; if (p) setTimeout(() => { try { p.destroy(); } catch (e) {} }, 300);
    if (!quiet) { cstore.set('in', 0); this.frozen = null; this.watch = 0; this.help = false; this.className = ''; }
    this.state = 'off'; if (!quiet) this.changed();
  }
  send(m) { const c = this.conn; if (!c || !c.open) return false; try { c.send(m); return true; } catch (e) { return false; } }
  onData(m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'ack') { const r = this.results.find((x) => x.rid === m.rid); if (r && !r.sent) { r.sent = 1; cstore.set('results', this.results); this.changed(); } return; }
    if (m.t === 'welcome') { this.className = String(m.name || ''); if (m.watch != null) this.setWatch(m.watch); if (m.frozen) this.frozen = { msg: m.frozen.msg || '' }; this.changed(); return; }
    if (m.t === 'watch') { this.setWatch(m.every || 0, m.big); return; }
    if (m.t === 'cmd') {
      if (m.do === 'freeze') this.frozen = { msg: String(m.msg || '') };
      else if (m.do === 'unfreeze') this.frozen = null;
      else if (m.do === 'end') { this.leave(); this.o.command && this.o.command({ do: 'ended' }); return; }
      else if (m.do === 'msg') this.msg = { text: String(m.text || '').slice(0, 300), at: Date.now() };
      else if (m.do === 'help_off') this.help = false;
      this.o.command && this.o.command(m); this.tick(true); this.changed();
    }
  }
  setWatch(ms, big) { this.watch = ms ? Math.max(1200, ms) : 0; this.big = !!big; this.nextSnap = 0; }
  raiseHand(on = !this.help) { this.help = on; this.tick(true); this.changed(); }
  // called by the app every frame (cheap): the picture of what the student sees, while the teacher's page asks for it
  // (the status goes out on a timer: when it changes, and at least every 10 s)
  frame() {
    if (this.state !== 'on') return; const now = performance.now();
    if (this.watch && now > (this.nextSnap || 0)) { this.nextSnap = now + this.watch; const big = this.big; const img = this.o.snap && this.o.snap(big ? 480 : 192, big ? 270 : 108); if (img) this.send({ t: 'snap', img }); }
  }
  tick(force) {
    if (this.state !== 'on') return;
    let s = {}; try { s = this.o.status() || {}; } catch (e) {}
    s.help = this.help; s.batt = this.batt; s.frozen = !!this.frozen;
    const j = JSON.stringify(s); const now = Date.now();
    if (!force && j === this.lastSt && now - (this.lastStT || 0) < 10000) return;
    this.lastSt = j; this.lastStT = now; this.send({ t: 'st', s });
  }
  // a finished quiz or activity: kept on this device and sent to the teacher (again and again until confirmed)
  report(r) {
    const x = { ...r, rid: rid(), at: Date.now(), roll: this.roll || '', name: this.name || '', app: this.o.app, code: this.inClass ? this.code : '' };
    this.results.push(x); if (this.results.length > 300) this.results = this.results.slice(-300); cstore.set('results', this.results);
    if (x.code) this.send({ t: 'res', r: x }); this.changed(); return x;
  }
  flush() { for (const r of this.results) if (!r.sent && r.code === this.code) this.send({ t: 'res', r }); }
}
