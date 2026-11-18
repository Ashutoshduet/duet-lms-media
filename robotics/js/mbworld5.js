// DUET Robotics Lab 360, batch 5: the micro:bit lessons' 3D desk (loaded by microbit.js MBCore.build(), in the browser).
// The desk stands away from the Arduino bench (MBX); the bench, its board and breadboard are hidden while a micro:bit
// lesson is open. What the student does here:
//   press A / B / the touch logo (hold), drag the board to tilt it (let go: it settles back), shake it (a quick drag to and
//   fro), turn it over, tap its parts (lesson 1), clip crocodile leads from a pad (0, 1, 2, 3V, GND) to a part (tap one end,
//   then the other; tap a lead twice to take it off) — with a mouse, a finger, a Meta Quest controller or hand (the trigger /
//   pinch on a button presses it; on the board, hold and turn your hand to tilt it, shake your hand to shake it), or by
//   tilting the phone itself.
// Everything goes through MBCore (microbit.js), as the lesson steps and the panel do. The page around it gets small
// changes while the lesson is open (body.mb5: no breadboard tools; Python in the editor; the Blocks / Python switch).
import * as THREE from 'three';
import { VIEWS, nextFrame } from './stage.js';
import * as MD from './models.js';
import * as M5 from './models5.js';
import { MBX, MB_PARTS } from './microbit.js';
import { highlight as pyHighlight } from './py.js';
import { tx, L, T as UIT } from './i18n.js';
import { BlockUI } from './blocks5.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const frame = nextFrame; // (also in a headset: stage.js)
// the camera's views of the micro:bit desk (stage.js setView): centre, half width / depth to fit, direction
Object.assign(VIEWS, {
  mb: { tgt: [MBX, 9, 3], hw: 32, hd: 22, dir: [0, 0.82, 0.57] },
  mbtwo: { tgt: [MBX, 9, 6], hw: 112, hd: 42, dir: [0, 0.78, 0.63] },
  mbwide: { tgt: [MBX + 5, 14, 2], hw: 130, hd: 82, dir: [0, 0.66, 0.75] },
  mbtop: { tgt: [MBX, 0, 4], hw: 90, hd: 70, dir: [0, 1, 0.06] },
});
const FEET = 5.6; // the rubber feet the board stands on
const SER_EMPTY = { en: 'What your program prints with print() shows here.', hi: 'आपका प्रोग्राम print() से जो लिखता है, वह यहाँ दिखेगा।', hg: 'Aapka program print() se jo likhta hai, woh yahan dikhega.' };
const PY_MODE = { hl: (s) => pyHighlight(s), open: /:\s*(#.*)?$/, ind: '    ', label: 'Python code' };
const UIW = {
  clipFrom: t3('Now tap where the other end of the clip goes', 'अब वहाँ छूइए जहाँ क्लिप का दूसरा सिरा जाएगा', 'Ab wahan touch karo jahan clip ka doosra sira jaayega'),
  clipMade: t3('Clip: {a} → {b}', 'क्लिप: {a} → {b}', 'Clip: {a} → {b}'),
  clipFull: t3('That pad already has two clips on it.', 'उस पैड पर पहले से दो क्लिप लगी हैं।', 'Us pad par pehle se do clip lagi hain.'),
  clipAgain: t3('Tap the lead again to take it off.', 'हटाने के लिए लीड को फिर से छूइए।', 'Hatane ke liye lead ko phir se touch karo.'),
  clipOff: t3('Clip taken off.', 'क्लिप हटा दी।', 'Clip hata di.'),
  clipped: t3('The clips hold the board down: take them off to pick it up.', 'क्लिप ने बोर्ड को पकड़ रखा है: उठाने के लिए क्लिप हटाइए।', 'Clips ne board ko pakad rakha hai: uthane ke liye clips hataiye.'),
  you: t3('Your micro:bit', 'आपका micro:bit', 'Aapka micro:bit'), friend: t3('Friend\'s micro:bit', 'दोस्त का micro:bit', 'Dost ka micro:bit'),
  blocks: t3('Blocks', 'ब्लॉक', 'Blocks'), python: t3('Python', 'Python', 'Python'),
};
const padName = (e) => { const p = e.replace(/^\d:/, ''); return p === 'P0' ? 'pin 0' : p === 'P1' ? 'pin 1' : p === 'P2' ? 'pin 2' : p; };

export class MBView {
  constructor(core) {
    this.core = core; this.app = core.app; this.stage = this.app.stage; this.cfg = core.cfg;
    this.root = new THREE.Group(); this.root.name = 'mbdesk'; this.root.position.set(MBX, 0, 0); this.root.visible = false;
    this.boards = []; this.partObjs = {}; this.picks = []; this.fx = []; this.sig = []; this.pending = null; this.dirtyKick = 2;
    this.lite = !!this.stage.lite; M5.setLite5(this.lite);
  }
  kick() { this.stage.kick(); this.dirtyKick = 2; }
  // ---------------------------------------------------------------- build (a few pieces per frame: no long freeze)
  async build() {
    const t0 = performance.now(); const S = this.stage; S.root.add(this.root);
    const steps = [() => this.buildDesk(), () => this.buildBoards(), () => this.buildScene(), () => this.buildClips(), () => this.hookPage()];
    this.times = []; for (const f of steps) { if (this.dead) return; const t1 = performance.now(); try { f(); } catch (e) { console.error('micro:bit desk:', e); } this.times.push(Math.round(performance.now() - t1)); await frame(); } // closed while building: stop
    try { this.compiling = S.warm(this.root); await this.compiling; } catch (e) { /* compiled when first drawn */ }
    this.compiling = null; if (this.dead) return;
    this.root.visible = true; this.buildMs = Math.round(performance.now() - t0);
    const v = this.app.rt && this.app.rt.lesson && this.app.rt.lesson.view; if (v && !S.userMoved) S.setView(v);
    this.kick();
  }
  buildDesk() {
    const V = this.app.view; this.hidden = [V.bench, V.board, V.bb].filter(Boolean).map((o) => [o, o.visible]);
    for (const [o] of this.hidden) o.visible = false;
    this.desk = V.bench.clone(); this.desk.visible = true; this.desk.position.set(0, 0, 0); this.root.add(this.desk); // the same oak desk and cutting mat (shared materials)
  }
  layout() { // where the boards and parts stand in this lesson's scene (desk mm, from the desk's centre)
    const sc = this.cfg.scene || 'desk';
    if (sc === 'rps') return { boards: [[-44, 0, 0], [44, 0, 0]] };
    if (sc === 'plant') return { boards: [[-62, 0, -6]], soil: [48, 0, -18], led1: [-14, 0, 40] };
    if (sc === 'gate') return { boards: [[-78, 0, 6]], sv1: [24, 0, 14] };
    return { boards: [[0, 0, 0]] };
  }
  buildBoards() {
    const lay = this.layout(); this.lay = lay;
    this.core.boards.forEach((b, k) => {
      const [x, y, z] = lay.boards[k] || [0, 0, 0];
      const holder = new THREE.Group(); holder.position.set(x, y, z); this.root.add(holder);
      const MM = MD.materials(); const feet = new THREE.Group();
      for (const [fx, fz] of [[-21, -16], [21, -16], [-21, 15], [21, 15]]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, FEET, 14), MM.rubber); f.position.set(fx, FEET / 2, fz); feet.add(f); }
      MD.mergeStatic(feet); holder.add(feet); holder.add(M5.contactShadow(70, 60, 0.5));
      const pivot = new THREE.Group(); pivot.position.y = FEET + 0.8; holder.add(pivot); // the board turns round its middle
      const mb = M5.buildMicrobit(k); mb.position.y = -0.8; pivot.add(mb);
      mb.userData.picks.traverse((o) => { if (o.userData.role) { o.userData.board = k; this.picks.push(o); } });
      const usb = this.cfg.scene === 'rps' || this.cfg.scene === 'badge' || this.cfg.battery ? null : M5.buildUsbCable(190);
      if (usb) { usb.position.set(0, -2.0, -21 - 6); usb.rotation.y = Math.PI; mb.add(usb); }
      if (this.cfg.scene === 'rps' || this.cfg.battery) { const bp = M5.buildBatteryPack(); bp.position.set(0, 0, -70); bp.rotation.y = k ? 0.25 : -0.25; holder.add(bp); }
      this.boards.push({ b, holder, pivot, mb, ud: mb.userData, flipA: 0, lift: 0, sig: '' });
    });
    if (this.cfg.scene === 'rps') this.core.boards.forEach((b, k) => { const s = labelSprite(tx(k ? UIW.friend : UIW.you), k ? '#7fd1ff' : '#f0a65a'); s.position.set(this.lay.boards[k][0], 1, 36); this.root.add(s); });
  }
  buildScene() {
    const sc = this.cfg.scene || 'desk', R = this.root;
    if (sc === 'compass') { this.card = M5.buildCompassCard(); R.add(this.card); }
    if (sc === 'badge') { const ly = M5.buildLanyard(); R.add(ly); const bp = M5.buildBatteryPack(); bp.position.set(70, 0, -40); R.add(bp); }
    if (sc === 'watch') { const st = M5.buildStrap(); st.position.y = FEET + 0.8; this.boards[0].pivot.add(st); this.strap = st; }
    if (sc === 'thermo') { const c = M5.buildChai(); c.position.set(62, 0, -8); const sh = M5.contactShadow(60, 60, 0.35); sh.position.set(62, 0.3, -8); R.add(c, sh); this.chai = c; }
    for (const p of Object.values(this.core.parts)) {
      const at = this.lay[p.tag] || [0, 0, 40]; let o;
      if (p.type === 'led') o = M5.buildLooseLED(p.color || 'red');
      if (p.type === 'buzzer') o = M5.buildLooseBuzzer();
      if (p.type === 'servo') o = M5.buildGate();
      if (p.type === 'soil') o = M5.buildPlant();
      if (!o) continue;
      o.position.set(at[0], at[1], at[2]); R.add(o); this.partObjs[p.tag] = o;
      const sh = M5.contactShadow(p.type === 'soil' ? 100 : p.type === 'servo' ? 180 : 40, p.type === 'soil' ? 100 : p.type === 'servo' ? 110 : 34, 0.4); sh.position.set(at[0] + (p.type === 'servo' ? 30 : 0), 0.3, at[2] + (p.type === 'servo' ? -40 : 0)); R.add(sh);
      // a clip point for each pin of the part: an invisible box to tap
      for (const [pin, [pos]] of Object.entries(o.userData.ends || {})) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 7), new THREE.MeshBasicMaterial({ visible: false })); b.position.copy(pos); b.userData.role = 'mbterm:' + p.tag + '.' + pin; o.add(b); this.picks.push(b);
      }
      if (p.type === 'soil') { const can = new THREE.Mesh(new THREE.BoxGeometry(70, 70, 70), new THREE.MeshBasicMaterial({ visible: false })); can.position.set(0, 35, -10); can.userData.role = 'mbwater'; o.add(can); this.picks.push(can); }
    }
    // the radio wave (a ring that grows from the board that sends)
    this.wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    this.wave.rotation.x = -Math.PI / 2; this.wave.position.y = 2; R.add(this.wave);
    // the hover / pending ring
    this.ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.4, 28), new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: 0.95, depthTest: false, toneMapped: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.renderOrder = 10; this.ring.visible = false; R.add(this.ring);
  }
  // ---------------------------------------------------------------- clips
  endPos(e) { // a clip end in desk mm: [position, direction the clip's body goes]
    if (this.core.isPad(e)) {
      const k = /^(\d):/.test(e) ? +e[0] : 0; const B = this.boards[k]; if (!B) return null; B.mb.updateMatrixWorld(true);
      const p = M5.padPos(e.replace(/^\d:/, '')).applyMatrix4(B.mb.matrixWorld); this.root.worldToLocal(p);
      return [p, V3(0, 0.55, 1)];
    }
    const [tag, pin] = e.split('.'); const o = this.partObjs[tag]; if (!o || !o.userData.ends[pin]) return null;
    const [pos, dir] = o.userData.ends[pin]; o.updateMatrixWorld(true); const p = pos.clone().applyMatrix4(o.matrixWorld); this.root.worldToLocal(p);
    return [p, dir.clone().applyQuaternion(o.quaternion)];
  }
  buildClips() {
    if (this.leads) { this.root.remove(this.leads); MD.dispose(this.leads); }
    this.leads = new THREE.Group(); this.leads.name = 'leads'; this.root.add(this.leads);
    this.picks = this.picks.filter((p) => !String(p.userData.role).startsWith('mbclip:'));
    let seed = 1;
    for (const c of this.core.clips) {
      const A = this.endPos(c.a), B = this.endPos(c.b); if (!A || !B) continue;
      const g = M5.buildLead(A[0], A[1], B[0], B[1], c.color, seed++);
      g.traverse((o) => { if (o.isMesh) { o.userData.role = 'mbclip:' + c.id; this.picks.push(o); } }); this.leads.add(g);
    }
    this.ghostKey = null; this.kick();
  }
  onClips() { this.buildClips(); this.updateGhost(true); }
  updateGhost(force) { // the lesson's next clip, shown where it goes (pulsing)
    const s = this.app.mode === 'lesson' && this.app.rt.step; const want = s && s.clip && !this.core.conn(s.clip[0], s.clip[1]) ? s.clip : null;
    const key = want ? want.join('~') : '';
    if (key === this.ghostKey && !force) return; this.ghostKey = key;
    if (this.ghost) { this.root.remove(this.ghost); MD.dispose(this.ghost); this.ghost = null; }
    if (!want) return;
    const A = this.endPos(want[0]), B = this.endPos(want[1]); if (!A || !B) return;
    this.ghost = M5.buildLead(A[0], A[1], B[0], B[1], 'white', 3); this.ghostM = this.ghostM || new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.4, depthWrite: false });
    this.ghost.traverse((o) => { if (o.isMesh) { o.material = this.ghostM; o.raycast = () => {}; } }); this.root.add(this.ghost);
  }
  // ---------------------------------------------------------------- the page around the desk
  hookPage() {
    const app = this.app; document.body.classList.add('mb5');
    if (!document.getElementById('mb5-css')) { const st = document.createElement('style'); st.id = 'mb5-css'; st.textContent = CSS; document.head.appendChild(st); }
    app.editor.mode = PY_MODE; app.editor.paint(); app.editor.t.setAttribute('aria-label', 'Python code');
    const baud = document.getElementById('ser-baud'); if (baud) { this.baud0 = baud.value; baud.value = '115200'; }
    // the Serial Monitor shows what print() writes (put back on dispose)
    this.serEmpty0 = UIT.serialEmpty; UIT.serialEmpty = SER_EMPTY; const se = document.querySelector('#serout .empty'); if (se) se.textContent = tx(SER_EMPTY);
    // the view buttons look at this desk
    this.onView = (e) => { const b = e.target.closest && e.target.closest('#bar [data-view]'); if (!b || this.dead) return; e.stopPropagation(); e.preventDefault(); const Ls = app.rt.lesson; const v = b.dataset.view; app.stage.userMoved = false; app.stage.setView(v === 'top' ? 'mbtop' : (Ls && Ls.view) || 'mb'); };
    document.getElementById('bar').addEventListener('click', this.onView, true);
    // pointer: mouse and touch
    this.canvas = this.stage.renderer.domElement;
    this.onDown = (e) => this.down(e); this.onMove = (e) => this.move(e); this.onUp = (e) => this.up(e);
    addEventListener('pointerdown', this.onDown, true); addEventListener('pointermove', this.onMove, true); addEventListener('pointerup', this.onUp, true); addEventListener('pointercancel', this.onUp, true);
    this.onKey = (e) => this.key(e, true); this.onKeyUp = (e) => this.key(e, false); addEventListener('keydown', this.onKey); addEventListener('keyup', this.onKeyUp);
    // the headset's controllers (or hands): xr.js gives them; their trigger / pinch also reaches xrui.js (its panel and cursor)
    this.xrL = []; const X = app.xr;
    if (X && X.ctrls) X.ctrls.forEach((c, i) => { const s = () => this.xrDown(i), u = () => this.xrUp(i); c.addEventListener('selectstart', s); c.addEventListener('selectend', u); this.xrL.push([c, s, u]); });
    // Blocks or Python
    try { this.blocks = new BlockUI(app, this.core); } catch (e) { console.warn('blocks', e); }
    window.mb5 = testHooks(this);
  }
  // ---------------------------------------------------------------- pointing at things
  raycastFrom(rc) { const hits = rc.intersectObjects(this.picks, false); for (const h of hits) { const ud = h.object.userData; if (ud.role) return { role: ud.role, board: ud.board || 0, point: h.point, distance: h.distance, obj: h.object }; } return null; }
  pick(x, y) {
    const r = this.canvas.getBoundingClientRect(); const ndc = new THREE.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.stage.camera); this.root.updateMatrixWorld(true); return this.raycastFrom(rc);
  }
  active() { return !this.dead && this.root.visible && !(window.DuetGate && DuetGate.active); }
  down(e) {
    if (!this.active() || this.ptr || (e.pointerType === 'mouse' && e.button !== 0) || e.target !== this.canvas || this.stage.renderer.xr.isPresenting) return;
    const hit = this.pick(e.clientX, e.clientY); if (!hit) { this.armRemove = null; return; }
    if (this.start(hit, 'p')) { e.stopPropagation(); e.preventDefault(); this.ptr = { id: e.pointerId, hit, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), rev: [], lastDx: 0 }; this.stage.controls.enabled = false; }
  }
  move(e) {
    const P = this.ptr; if (!P || e.pointerId !== P.id) { if (!this.ptr && e.pointerType === 'mouse' && e.target === this.canvas && this.active() && !(e.buttons & 1)) this.hover(e.clientX, e.clientY); return; }
    e.stopPropagation();
    // every movement since the last frame (the browser joins the moves of one frame into one event: on a slow phone a
    // quick shake would be lost), each at its own time
    const all = e.getCoalescedEvents ? e.getCoalescedEvents() : null; const tilting = P.hit.role === 'mbbody' || (this.grab && P.hit.role.startsWith('mbregion:'));
    for (const q of all && all.length ? all : [e]) { if (tilting) this.tiltBy(P.hit.board, q.clientX - P.x0, q.clientY - P.y0, q.clientX - P.x, q.timeStamp || performance.now()); P.x = q.clientX; P.y = q.clientY; }
    if (P.hit.role.startsWith('mbpad:') || P.hit.role.startsWith('mbterm:')) { const h = this.pick(e.clientX, e.clientY); this.showRing(h && /^mb(pad|term):/.test(h.role) ? this.endOf(h) : this.endOf(P.hit), h && h !== P.hit ? 0x46e07a : 0xffc040); }
  }
  up(e) {
    const P = this.ptr; if (!P || e.pointerId !== P.id) return;
    this.ptr = null; this.stage.controls.enabled = true; e.stopPropagation();
    const moved = Math.hypot(e.clientX - P.x0, e.clientY - P.y0) > 8;
    const end = moved && /^mb(pad|term):/.test(P.hit.role) ? this.pick(e.clientX, e.clientY) : null;
    this.finish(P.hit, end, moved);
  }
  hover(x, y) { if (performance.now() - (this._hv || 0) < 50) return; this._hv = performance.now(); const h = this.pick(x, y); this.canvas.style.cursor = h ? (h.role === 'mbbody' ? 'grab' : 'pointer') : ''; if (!this.pending) this.showRing(h && /^mb(pad|term):/.test(h.role) ? this.endOf(h) : null, 0x40e8ff); }
  endOf(h) { const r = h.role; if (r.startsWith('mbpad:')) return (h.board ? h.board + ':' : '') + r.slice(6); if (r.startsWith('mbterm:')) return r.slice(7); return null; }
  showRing(ep, col) { if (!ep) { if (this.ring.visible) { this.ring.visible = false; this.kick(); } return; } const p = this.endPos(ep); if (!p) return; this.ring.position.copy(p[0]).add(V3(0, 0.6, 0)); this.ring.material.color.set(col || 0xffc040); this.ring.visible = true; this.kick(); }
  // what a press starts (src: 'p' page, 'x' headset). Returns true when the desk takes the pointer.
  start(hit, src) {
    const r = hit.role, core = this.core, B = core.boards[hit.board || 0]; const learn = !!this.cfg.learn;
    if (r.startsWith('mbbtn:')) { const id = r.slice(6); B.press(id, true); this.app.sound.unlock(); this.app.sound.click(); if (learn) core.tap(id === 'logo' ? 'mb_logo' : 'mb_' + id); return true; }
    if (r.startsWith('mbregion:')) { if (!core.clips.length) this.grab = { k: hit.board || 0, src }; return true; } // a part of the board: a tap names it, a drag tilts the board
    if (r.startsWith('mbpad:') && this.touchOnly()) { const id = r.slice(6); if (B.btn[id]) { B.press(id, true); this.app.sound.unlock(); } return true; } // nothing to clip to: a finger on the pin
    if (r === 'mbbody') { if (this.core.clips.length) { this.app.toast(tx(UIW.clipped)); return false; } this.grab = { k: hit.board || 0, src }; return true; }
    if (/^mb(pad|term|clip):/.test(r) || r === 'mbwater') return true;
    return false;
  }
  finish(hit, end, moved) {
    const r = hit.role, core = this.core, B = core.boards[hit.board || 0];
    if (r.startsWith('mbbtn:')) { B.press(r.slice(6), false); return; }
    if (r.startsWith('mbregion:')) { if (this.grab) { this.grab = null; if (!core.holdTilt) this.settleTilt(hit.board || 0); } if (!moved) { const id = r.slice(9); core.tap(id); if (id === 'mb_reset') this.app.resetBoard(); } return; }
    if (r === 'mbbody') { this.grab = null; if (!core.holdTilt) this.settleTilt(hit.board || 0); if (!moved && this.cfg.learn) core.tap('mb_leds'); return; }
    if (r === 'mbwater') { core.control('water'); this.splash(); return; }
    if (r.startsWith('mbpad:') && this.touchOnly()) { const id = r.slice(6); if (B.btn[id]) B.press(id, false); if (this.cfg.learn) core.tap('mb_pins'); return; }
    if (r.startsWith('mbclip:')) { const id = r.slice(7); const c = core.clips.find((q) => q.id === id); if (!c) return; if (this.armRemove === id) { core.removeClip(c); this.armRemove = null; this.app.toast(tx(UIW.clipOff)); } else { this.armRemove = id; this.app.toast(tx(UIW.clipAgain)); } return; }
    const ep = this.endOf(hit); if (!ep) return;
    if (this.cfg.learn && ep.endsWith('P0') || this.cfg.learn && /^(\d:)?(P1|P2|3V|GND)$/.test(ep)) core.tap('mb_pins');
    const other = end && /^mb(pad|term):/.test(end.role) ? this.endOf(end) : null;
    if (other && other !== ep) { this.makeClip(ep, other); return; }
    if (this.pending && this.pending !== ep) { this.makeClip(this.pending, ep); return; }
    this.pending = ep; this.showRing(ep, 0xffc040); this.app.toast(tx(UIW.clipFrom));
  }
  touchOnly() { return !Object.keys(this.core.parts).length && this.core.boards.length < 2; } // no part on the desk to clip a lead to
  makeClip(a, b) {
    this.pending = null; this.showRing(null);
    const c = this.core.addClip(a, b);
    if (c === 'full') { this.app.toast(tx(UIW.clipFull), 'bad'); return; }
    if (!c) return;
    this.app.sound.click(); this.app.toast(tx(UIW.clipMade, { a: this.endName(c.a), b: this.endName(c.b) }));
  }
  endName(e) { if (this.core.isPad(e)) return padName(e); const [tag, pin] = e.split('.'); const p = this.core.parts[tag]; const d = p && MB_PARTS[p.type]; return d ? tx(d.name) + ' · ' + tx(d.pin[pin]) : e; }
  key(e, down) { // A and B on the keyboard (not while typing)
    if (this.dead || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
    const k = e.key.toLowerCase(); if ((k === 'a' || k === 'b') && !e.repeat) { this.core.boards[0].press(k, down); if (down) this.app.sound.click(); }
  }
  // ---------------------------------------------------------------- tilting and shaking
  tiltBy(k, dx, dy, ddx, t) {
    const b = this.core.boards[k]; b.tilt.roll = clamp(dx * 0.45, -88, 88); b.tilt.pitch = clamp(dy * 0.45, -88, 88);
    const P = this.ptr; if (P && Math.abs(ddx) > 2) { const s = Math.sign(ddx); if (P.lastDx && s !== P.lastDx) { P.rev.push(t); P.rev = P.rev.filter((x) => t - x < 700); if (P.rev.length >= 3) { b.shake(); P.rev = []; } } P.lastDx = s; }
    this.core.dirty();
  }
  settleTilt(k) { this.settle = this.settle || {}; this.settle[k] = true; }
  // ---------------------------------------------------------------- the headset
  xrRay(i) { const r = this.app.xr.ui && this.app.xr.ui.rayOf(i); if (!r) return null; const rc = new THREE.Raycaster(r.o, r.d, 0, 20); this.root.updateMatrixWorld(true); return rc; }
  xrDown(i) {
    if (!this.active() || !this.stage.renderer.xr.isPresenting) return;
    const ui = this.app.xr.ui; const rc = this.xrRay(i); if (!rc) return;
    const ph = ui && ui.panel && ui.panel.visible ? rc.intersectObject(ui.panel, false)[0] : null;
    const hit = this.raycastFrom(rc); if (!hit || (ph && ph.distance < hit.distance)) return;
    if (!this.start(hit, 'x')) return;
    const c = this.app.xr.ctrls[i]; c.updateMatrixWorld(true);
    this.xr = { i, hit, q0: c.getWorldQuaternion(new THREE.Quaternion()), p: [], t0: performance.now(), tilt0: Object.assign({}, this.core.boards[hit.board || 0].tilt), yaw0: this.core.boards[hit.board || 0].yaw };
  }
  xrUp(i) {
    const X = this.xr; if (!X || X.i !== i) return; this.xr = null;
    let end = null; const rc = this.xrRay(i); if (rc && /^mb(pad|term):/.test(X.hit.role)) { end = this.raycastFrom(rc); if (end && this.endOf(end) === this.endOf(X.hit)) end = null; }
    this.finish(X.hit, end, !!end || X.hit.role === 'mbbody' || !!(X.turned || X.shook)); // a part held and turned: a tilt, not a tap
  }
  xrUpdate() { // while the trigger holds the board: it turns with the hand, a quick shake shakes it
    const X = this.xr; if (!X || !(X.hit.role === 'mbbody' || (this.grab && X.hit.role.startsWith('mbregion:')))) return;
    const c = this.app.xr.ctrls[X.i]; c.updateMatrixWorld(true); const q = c.getWorldQuaternion(new THREE.Quaternion());
    const d = X.q0.clone().invert().multiply(q); const e = new THREE.Euler().setFromQuaternion(d, 'YXZ'); const b = this.core.boards[X.hit.board || 0];
    b.tilt.pitch = clamp(X.tilt0.pitch + e.x / D2R, -88, 88); b.tilt.roll = clamp(X.tilt0.roll - e.z / D2R, -88, 88); if (Math.abs(e.x) > 0.14 || Math.abs(e.z) > 0.14) X.turned = true;
    if (this.cfg.scene === 'compass') b.yaw = ((X.yaw0 - e.y / D2R) % 360 + 360) % 360;
    const f = this.stage.frames || 0; if (X.f === f) { this.core.dirty(); return; } X.f = f; // the hand is where it was this frame: one point a frame (update() runs once a sim slice, several a frame)
    const p = c.getWorldPosition(new THREE.Vector3()); const t = performance.now(); X.p.push([t, p]); X.p = X.p.filter(([tt], i) => t - tt < 600 || i >= X.p.length - 8); // the last 0.6 s, or 8 frames when frames are slow
    if (X.p.length > 4) { let rev = 0, last = 0; for (let k = 1; k < X.p.length; k++) { const v = X.p[k][1].clone().sub(X.p[k - 1][1]); if (v.length() < 0.012) continue; const s = Math.sign(v.x + v.y + v.z); if (last && s !== last) rev++; last = s; } if (rev >= 3 && t - (X.shook || 0) > 700) { b.shake(); X.shook = t; X.p = []; } } // a hand waved to and fro: a shake
    this.core.dirty();
  }
  splash() { this.waterT = 1.2; this.kick(); }
  // ---------------------------------------------------------------- every frame
  update(dt) {
    const core = this.core; let anim = false; const T = core.now; const step = this.app.rt && this.app.rt.step;
    if (this.stage.renderer.xr.isPresenting) this.xrUpdate();
    if (core.settleSoon) { core.settleSoon = false; this.settleTilt(0); } // the auto tilt (microbit.js) is over: it lies down again
    for (const V of this.boards) {
      const b = V.b; const k = b.k;
      // tilt: let go, it settles back flat
      if (this.settle && this.settle[k] && !(this.grab && this.grab.k === k) && !core.autoTilt) { b.tilt.roll *= Math.pow(0.0005, dt); b.tilt.pitch *= Math.pow(0.0005, dt); if (Math.abs(b.tilt.roll) < 0.3 && Math.abs(b.tilt.pitch) < 0.3) { b.tilt.roll = 0; b.tilt.pitch = 0; this.settle[k] = false; } anim = true; core.dirty(); }
      const held = Math.abs(b.tilt.roll) > 2 || Math.abs(b.tilt.pitch) > 2 || (this.grab && this.grab.k === k), turning = b.tilt.flip || Math.abs(V.flipA) > 0.01;
      if (turning && this.pending) { this.pending = null; this.showRing(null); }
      // lifted while held; turned over it rises only to clear its edges as it turns, then lies on its back just above the feet
      const lift = held ? 26 : turning ? 4 + 26 * Math.abs(Math.sin(V.flipA)) : 0; const nl = V.lift + (lift - V.lift) * Math.min(1, dt * 8); if (Math.abs(nl - V.lift) > 0.01) anim = true; V.lift = nl;
      const fa = b.tilt.flip ? Math.PI : 0; const nf = V.flipA + (fa - V.flipA) * Math.min(1, dt * 5); if (Math.abs(nf - V.flipA) > 0.002) anim = true; V.flipA = Math.abs(fa - nf) < 0.002 ? fa : nf;
      const shakeJ = b.shakeT >= 0 && T - b.shakeT < 450000 && core.running() ? Math.sin((T - b.shakeT) / 1e6 * 2 * Math.PI * 9) * 6 * (1 - (T - b.shakeT) / 450000) : 0; if (shakeJ) anim = true;
      V.pivot.position.set(shakeJ, FEET + 0.8 + V.lift, 0);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(b.tilt.pitch * D2R, -b.yaw * D2R, -b.tilt.roll * D2R + V.flipA, 'YXZ'));
      if (!V.pivot.quaternion.equals(q)) { V.pivot.quaternion.copy(q); anim = true; }
      // the display
      let px = b.pixelsAt(T); let lit = b.on && b.disp.lit;
      if (b.errScroll) { const f = Math.floor((performance.now() - b.errScroll.start) / 95); if (f < b.errScroll.frames.length) { px = b.errScroll.frames[f]; lit = true; anim = true; } else b.errScroll = null; }
      const sig = lit ? px.join('') : 'off';
      if (sig !== V.sig) {
        V.sig = sig; const ud = V.ud; const c = new THREE.Color();
        for (let i = 0; i < 25; i++) { const v = lit ? px[i] / 9 : 0; const I = v ? Math.pow(v, 1.5) : 0; c.setRGB(3.6 * I, 0.22 * I, 0.08 * I); ud.leds.setColorAt(i, c); c.setRGB(0.9 * I, 0.07 * I, 0.02 * I); ud.halo.setColorAt(i, c); }
        ud.leds.instanceColor.needsUpdate = true; ud.halo.instanceColor.needsUpdate = true; anim = true;
      }
      for (const id of ['a', 'b']) { const y = M5.MBG.T + (b.btn[id].down ? 2.1 : 2.45); if (V.ud.caps[id].position.y !== y) { V.ud.caps[id].position.y = y; anim = true; } }
      const lg = b.btn.logo.down ? 0.9 : 0; if (V.ud.logoGlow.material.opacity !== lg) { V.ud.logoGlow.material.opacity = lg; anim = true; }
      const mic = b.on && core.obs.mic && core.running() ? 2.2 : 0; if (V.ud.micM.emissiveIntensity !== mic) { V.ud.micM.emissiveIntensity = mic; anim = true; }
      const pw = b.on || (core.lab.mcu.state === 'error') ? 2.4 : 0; if (V.ud.backLeds.ledR.emissiveIntensity !== pw) V.ud.backLeds.ledR.emissiveIntensity = pw;
      const ser = core.lab.mcu.ser; const yl = b.k === 0 && b.on && core.lab.mcu.t - ser.lastTx < 80000 && ser.bytesSent ? 2 : 0; V.ud.backLeds.ledY.emissiveIntensity = yl;
    }
    // parts: LEDs glow, the gate turns, the plant droops when it is dry
    for (const p of Object.values(core.parts)) {
      const o = this.partObjs[p.tag]; if (!o) continue; const s = p.state;
      if (p.type === 'led') { const b = s.b || 0; const ei = b * 4.6; if (Math.abs(o.userData.domeM.emissiveIntensity - ei) > 0.01) { o.userData.domeM.emissiveIntensity = ei; o.userData.glow.material.opacity = Math.min(0.9, b * 0.65); anim = true; } }
      if (p.type === 'servo') { const a = (s.angle - 90) * D2R; if (Math.abs(o.userData.horn.rotation.y - a) > 0.001) { o.userData.horn.rotation.y = a; anim = true; } }
      if (p.type === 'soil') { const m = s.m; const k = clamp((m - 0.08) / 0.4, 0, 1); for (const lf of o.userData.leaves) { const rx = -0.15 - 0.85 * k; if (Math.abs(lf.rotation.x - rx) > 0.002) { lf.rotation.x = rx; anim = true; } } o.userData.soilM.color.setScalar(0.55 + 0.45 * (1 - m)); }
    }
    // the radio wave, the water
    if (core.flash && performance.now() - core.flash.at < 700) { const f = (performance.now() - core.flash.at) / 700; const B = this.boards[core.flash.k]; if (B) { this.wave.position.set(B.holder.position.x, 3, B.holder.position.z); this.wave.scale.setScalar(10 + f * 80); this.wave.material.opacity = 0.6 * (1 - f); anim = true; } }
    else if (this.wave.material.opacity) { this.wave.material.opacity = 0; anim = true; }
    if (this.waterT > 0) { this.waterT -= dt; anim = true; }
    // the lesson's ghost clip pulses
    if (step !== this._step) { this._step = step; this.updateGhost(true); }
    if (this.ghost) { this.ghostM.opacity = 0.28 + 0.22 * Math.sin(performance.now() / 260); anim = true; }
    if (this.dirtyKick > 0) { this.dirtyKick--; anim = true; }
    return anim;
  }
  pickables() { return this.picks; }
  dispose() {
    this.dead = true; const app = this.app;
    for (const [o, v] of this.hidden || []) o.visible = v;
    document.body.classList.remove('mb5');
    if (app.editor.mode === PY_MODE) { app.editor.mode = null; app.editor.paint(); app.editor.t.setAttribute('aria-label', 'Arduino code'); }
    const baud = document.getElementById('ser-baud'); if (baud && this.baud0) baud.value = this.baud0;
    if (this.serEmpty0) { UIT.serialEmpty = this.serEmpty0; const se = document.querySelector('#serout .empty'); if (se) se.textContent = tx(this.serEmpty0); }
    if (this.onView) document.getElementById('bar').removeEventListener('click', this.onView, true);
    if (this.onDown) { removeEventListener('pointerdown', this.onDown, true); removeEventListener('pointermove', this.onMove, true); removeEventListener('pointerup', this.onUp, true); removeEventListener('pointercancel', this.onUp, true); removeEventListener('keydown', this.onKey); removeEventListener('keyup', this.onKeyUp); }
    for (const [c, s, u] of this.xrL || []) { c.removeEventListener('selectstart', s); c.removeEventListener('selectend', u); }
    if (this.ptr) { this.stage.controls.enabled = true; this.ptr = null; }
    if (this.canvas) this.canvas.style.cursor = '';
    if (this.blocks) this.blocks.dispose();
    if (window.mb5 && window.mb5.view === this) delete window.mb5;
    this.stage.root.remove(this.root);
    if (this.desk) this.root.remove(this.desk); // shared with the bench: not freed
    const free = () => MD.dispose(this.root); if (this.compiling) this.compiling.then(free, free); else free();
    this.stage.kick();
  }
}
function labelSprite(text, color) {
  const C = document.createElement('canvas'); C.width = 512; C.height = 96; const c = C.getContext('2d');
  c.font = '800 46px "Noto Sans Devanagari", "Noto Sans", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(text, 256, 50);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(64, 12), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m;
}
// for the tests (devtools/test/robotest5.mjs): where the desk's things are on the screen or in the headset
function testHooks(view) {
  const toScreen = (o) => { const b = new THREE.Box3().setFromObject(o); const c = b.getCenter(new THREE.Vector3()); c.y = b.max.y; const v = c.project(view.stage.camera); const r = view.canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; };
  const find = (role, k = 0) => view.picks.find((p) => p.userData.role === role && (p.userData.board || 0) === k);
  return {
    view,
    screen(role, k) { const o = find(role, k); if (!o) return null; view.root.updateMatrixWorld(true); return toScreen(o); },
    world(role, k) { const o = find(role, k); if (!o) return null; view.root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); const c = b.getCenter(new THREE.Vector3()); c.y = b.max.y; return c.toArray(); },
    roles() { return view.picks.map((p) => p.userData.role); },
    state() { const c = view.core; const B = c.boards[0]; return { ready: c.ready, running: c.running(), shown: c.val('shownImg'), px: [...B.pixelsAt(c.now)].join(''), clips: c.clips.map((q) => q.a + '~' + q.b), tilt: Object.assign({}, B.tilt), shakes: c.obs.shakes, press: c.obs.press, nums: c.obs.nums.slice(-6), texts: c.obs.texts.slice(-4), radio: c.val('radio'), heading: B.heading(), cal: B.calibrated, gesture: B.gesture ? null : B.gestureOf(c.now), blocks: view.blocks ? view.blocks.mode : null }; },
    still() { return view.boards.every((V) => Math.abs(V.flipA - (V.b.tilt.flip ? Math.PI : 0)) < 0.003 && Math.abs(V.lift - (V.b.tilt.flip ? 4 : 0)) < 0.2); }, // not turning over
    calls() { const r = view.stage.renderer; return { calls: r.info.render.calls, tris: r.info.render.triangles }; },
  };
}
const CSS = `
body.mb5 #drawer,body.mb5 #bar [data-view="bb"],body.mb5 #bar [data-tool="wire"],body.mb5 #bar [data-tool="probe"],body.mb5 #b-repair{display:none!important}
body.mb5 #bar .wv{display:none!important}
`;
