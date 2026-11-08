// Runs one experiment: builds the bench, shows each step (what to do → what you see → why),
// performs it on "Do it" / click / auto-play, or completes it when the student does it by hand in VR.
import * as THREE from 'three';
import { Kit } from './actions.js';
import { EXPERIMENTS, BY_ID } from './experiments.js';
import { I18N, DICT } from './exp_i18n.js';

export const tx = (o, L) => (o ? (o[L] || o.en || '') : '');

export class Runner {
  constructor(app) {
    this.app = app; this.K = new Kit(app); this.exp = null; this.o = {}; this.i = 0; this.state = 'idle'; this.auto = false;
    this.listeners = [];
    app.lab.listeners.push((e) => this.onLabEvent(e));
    // target marker: a soft ring + bobbing arrow over the item to use next
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 40), new THREE.MeshBasicMaterial({ color: 0xf0a65a, transparent: true, opacity: 0.85, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 11;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 16), new THREE.MeshBasicMaterial({ color: 0xf0a65a, depthWrite: false })); arrow.rotation.x = Math.PI; arrow.renderOrder = 11;
    this.marker = new THREE.Group(); this.marker.add(ring, arrow); this.marker.visible = false; app.scene.add(this.marker); this.mRing = ring; this.mArrow = arrow;
  }
  on(f) { this.listeners.push(f); }
  changed() { for (const f of this.listeners) f(this); }
  list() { return EXPERIMENTS; }
  text(key, L) { // experiment text with translation
    const e = this.exp; if (!e) return '';
    const tr = I18N[e.id] || {}; const parts = key.split('.');
    let base = e; for (const p of parts) base = base?.[p];
    let t = tr; for (const p of parts) t = t?.[p];
    if (typeof base === 'string') return (DICT[base] && DICT[base][L]) || base;
    return (t && t[L]) || (base && (base[L] || base.en)) || '';
  }
  async load(id, o = {}) {
    if (this.K) this.K.dispose();
    this.K = new Kit(this.app); this.K.speed = this.app.speed || 1; this.auto = false; // a fresh kit: actions of the old bench simply stop
    this.gen = (this.gen || 0) + 1; this.app.lab.clear(); this.app.fx.glow(null, false);
    this.exp = BY_ID[id]; this.i = 0; this.state = 'todo'; this.done = new Set(); this.evAcc = 0;
    this.o = this.exp.setup(this.K); for (const k in this.o) { if (this.o[k] && this.o[k].g) this.o[k].key = k; }
    // vessels named "Beaker A — …" / "Test tube B — …" get a sticker with their letter
    for (const it of this.app.lab.vessels) { const n = it.name && it.name.en; const m = n && n.match(/^(?:Beaker|Test tube|Tube)\s+([A-E1-5])\b/); if (m && !it.stickerMesh) this.K.sticker(it, m[1]); else if (it.tag && !it.stickerMesh) this.K.sticker(it, it.tag); }
    this.app.chem.lapse = 1; this.app.boardFor(this.exp);
    this.changed(); this.app.onStep && this.app.onStep(this, true);
    if (o.auto) this.play();
  }
  step() { return this.exp?.steps[this.i]; }
  target() { const s = this.step(); return s && this.o[s.target]; }
  async doStep(o = {}) {
    if (!this.exp || this.state === 'doing') return;
    const s = this.step(); if (!s) return;
    if (this.state === 'done') { this.next(); return; }
    this.state = 'doing'; this.changed(); const gen = this.gen;
    try { if (s.act) await s.act(this.K, this.o); } catch (err) { console.warn('step failed', err); }
    if (gen === this.gen && this.state === 'doing') this.finish();
  }
  finish() {
    if (this.state === 'done' || this.state === 'finished') return;
    this.state = 'done'; this.done.add(this.i); this.changed();
    this.app.onStep && this.app.onStep(this, false, true);
    if (this.auto) this.autoNext();
  }
  next() {
    if (!this.exp) return;
    if (this.i < this.exp.steps.length - 1) { this.i++; this.state = this.done.has(this.i) ? 'done' : 'todo'; this.evAcc = 0; this.changed(); this.app.onStep && this.app.onStep(this, false); if (this.auto && this.state === 'todo') this.doStep(); }
    else { this.state = 'finished'; this.auto = false; this.changed(); this.app.onFinished && this.app.onFinished(this); }
  }
  async prev() { // rebuild the bench and fast-forward to the previous step
    if (!this.exp || this.i === 0) return;
    const target = this.i - 1; const id = this.exp.id;
    this.app.muted = true; await this.load(id); this.K.speed = 40; const gen = this.gen;
    for (let k = 0; k < target; k++) { const s = this.exp.steps[k]; this.state = 'doing'; this.i = k; this.changed(); if (s.act) await s.act(this.K, this.o); if (gen !== this.gen) return; this.done.add(k); this.i = k + 1; }
    this.K.speed = this.app.speed || 1; this.app.muted = false; this.state = 'todo'; this.changed(); this.app.onStep && this.app.onStep(this, false);
  }
  play() { this.auto = true; this.changed(); if (this.state === 'todo') this.doStep(); else if (this.state === 'done') this.autoNext(); }
  pause() { this.auto = false; this.changed(); }
  async autoNext() { await this.app.waitNarration(); if (this.auto && this.state === 'done') this.next(); }
  reset() { if (this.exp) this.load(this.exp.id); }
  // a student did something by hand: see if it completes the current step
  onLabEvent(e) {
    const s = this.step(); if (!s || !s.ev || this.state !== 'todo') return;
    const ev = s.ev; if (ev.type !== e.type) return;
    const id = (k) => this.o[k]?.id;
    if (ev.to && e.to !== id(ev.to)) return; if (ev.from && e.from !== id(ev.from)) return; if (ev.in && e.in !== id(ev.in)) return; if (ev.v && e.v !== id(ev.v)) return;
    if (ev.ml) { this.evAcc += e.ml || 0; if (this.evAcc < ev.ml) return; }
    if (ev.sec && (e.sec || 0) < ev.sec) return;
    this.finish();
  }
  update(dt, t) {
    const tg = this.state === 'todo' ? this.target() : null;
    this.marker.visible = !!tg && !this.app.hideMarker;
    if (tg) {
      const b = new THREE.Box3().setFromObject(tg.g); const c = b.getCenter(new THREE.Vector3());
      this.mRing.position.set(c.x, b.min.y + 0.002, c.z); const r = Math.max(0.02, Math.min(0.09, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.62));
      this.mRing.scale.setScalar(r / 0.033 * (1 + Math.sin(t * 4) * 0.05)); this.mArrow.position.set(c.x, b.max.y + 0.04 + Math.sin(t * 4) * 0.01, c.z);
    }
  }
}
export { EXPERIMENTS };
