// Kit actions for physics: sliding holders along the optical bench, finding the sharpest image, wiring a circuit and
// reading the meters, fixing pins and drawing pencil lines on the sheet, tapping iron filings. Added to the Kit class.
import * as THREE from 'three';
import { Kit } from './actions.js';
import * as OP from './optics.js';
import * as EL from './electric.js';
import * as RF from './refraction.js';
import * as MG from './magnet.js';
import * as O2 from './optics2.js';
import * as MC from './mech.js';
import * as M2 from './mech2.js';
import * as M3 from './mech3.js';
import * as M4 from './mech4.js';
import * as L2 from './light2.js';
import * as M5 from './mech5.js';
import * as M6 from './mech6.js';
import * as M7 from './mech7.js';
import * as MT from './mathlab.js';
import * as MT2 from './mathlab2.js';
import * as MT3 from './mathlab3.js';
import * as A4 from './apparatus4.js';
import { Item } from './apparatus.js';
import { BENCH_Y } from './room.js';

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

Object.assign(Kit.prototype, {
  OP, EL, RF, MG, O2, MC, M2, M3, M4, L2, M5, M6, M7, MT, MT2, MT3,
  // a hidden item whose update runs a solver every frame (optics images, circuit currents)
  solver(fn) { const it = new Item('solver', { name: { en: 'solver', hi: 'solver', hg: 'solver' } }); it.noGrab = true; it.height = 0.001; it.radius = 0.001; it.update = fn; this.lab.add(it, 0, -2); return it; },
  // ---------------------------------------------------------- optical bench
  bench(x, z, len = 1) { const b = this.add(OP.opticalBench(len), x, z); this.optics = this.optics || new OP.Optics(this.lab); if (!this._opt) this._opt = this.solver(() => this.optics.update()); return b; },
  onBench(it, b, cm, dz = 0) { const lx = b.xAt(cm); const w = b.g.localToWorld(V3(lx, b.top, dz)); const a = this.add(it, w.x, w.z, { y: dz ? BENCH_Y : w.y }); a.bench = b; a.benchDz = dz; return a; }, // dz ≠ 0: on the table beside the bench (a raised stand)
  cmOf(it) { const b = it.bench; return b.cmAt(b.g.worldToLocal(it.g.position.clone()).x); },
  async slide(it, cm, dur = 1) { this.busy++; const b = it.bench; const p0 = it.g.position.clone(); const w = b.g.localToWorld(V3(b.xAt(cm), b.top, it.benchDz || 0)); w.y = p0.y; await this.tween(dur, (k) => it.g.position.lerpVectors(p0, w, ease(k))); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.lab.emit('slide', { obj: it.id, cm }); this.busy--; },
  // move the screen back and forth (as a student does) until the image on it is sharpest; returns the scale reading
  async focus(scr, from, to, step = 1) {
    this.busy++; let best = -1, bestCm = from; const dir = to > from ? 1 : -1;
    for (let cm = from; dir > 0 ? cm <= to : cm >= to; cm += dir * step * 2) { await this.slide(scr, cm, 0.12); await this.sleep(0.05); if (scr.sharp > best) { best = scr.sharp; bestCm = cm; } }
    for (let cm = bestCm - 2 * step; cm <= bestCm + 2 * step; cm += step / 2) { await this.slide(scr, cm, 0.12); await this.sleep(0.05); if (scr.sharp > best) { best = scr.sharp; bestCm = cm; } }
    await this.slide(scr, bestCm, 0.4); this.lab.emit('focus', { obj: scr.id, cm: bestCm, sharp: best }); this.busy--; return bestCm;
  },
  // a floating label with a value (a scale reading, a meter reading)
  async showTag(text, at, off = V3(0, 0.06, 0), sec = 2.2) { const tg = this.tag3D(text, at, off); await this.sleep(sec); for (const o of tg) this.app.scene.remove(o); },
  // ---------------------------------------------------------- circuits
  wires(links) { const out = []; this.dc = this.dc || new EL.DC(this.lab); if (!this._dc) this._dc = this.solver(() => this.dc.update()); this.wireList = this.wireList || []; for (const [[ia, ka], [ib, kb], col] of links) { const w = new A4.Wire(this.app.scene, col ?? 0xc62828, ia.terms[ka], ib.terms[kb]); this.extras.push(w.mesh, ...w.clips); this.wireList.push(w); const it = new Item('wireUpd', {}); it.noGrab = true; it.update = () => w.update(); it.height = 0.001; it.radius = 0.001; this.lab.add(it, 0, -2); w.link = [ia.terms[ka], ib.terms[kb]]; this.dc.links.push(w.link); out.push(w); } return out; },
  // swap the two wires at an item's terminals (e.g. reverse the connections to the cells): the current reverses
  async swapEnds(it, k1, k2) {
    const t1 = it.terms[k1], t2 = it.terms[k2]; const sw = (t) => (t === t1 ? t2 : t === t2 ? t1 : t);
    for (const w of this.wireList || []) { w.a = sw(w.a); w.b = sw(w.b); w.last[0].set(1e9, 0, 0); } if (this.dc) for (const l of this.dc.links) { l[0] = sw(l[0]); l[1] = sw(l[1]); }
    this.app.audio && this.app.audio.clink && this.app.audio.clink(); this.lab.emit('reverse', { obj: it.id }); await this.sleep(0.8);
  },
  // sprinkle iron filings evenly over a card / sheet
  async sprinkleOn(sh, sec = 1.6) { this.busy++; await this.tween(sec, (k) => sh.sprinkle(k)); this.lab.emit('sprinkle', { obj: sh.id }); this.busy--; },
  // follow field lines with a small compass on the sheet and draw them (dots where the needle ends were marked, then joined)
  async fieldLines(bd, cp, starts, o = {}) {
    this.busy++; const RF = this.RF; const src = this.lab.items.filter((q) => q.poles || q.segs); const W = (u, v) => bd.g.localToWorld(bd.toLocal(u, v));
    const trace = (u, v, sgn) => { const pts = [[u, v]]; for (let i = 0; i < 220; i++) { const w = W(u, v); w.y += 0.006; const B = MG.fieldAt(src, w, { noEarth: true }); const bu = B.x, bv = -B.z; const l = Math.hypot(bu, bv); if (l < 1e-9) break; u += (sgn * bu / l) * 0.004; v += (sgn * bv / l) * 0.004; if (Math.abs(u) > bd.W / 2 - 0.01 || Math.abs(v) > bd.H / 2 - 0.01) break; if (o.stop && o.stop(u, v)) break; pts.push([u, v]); } return pts; };
    let first = true;
    for (const [u0, v0] of starts) { const pts = trace(u0, v0, 1);
      if (first && cp) { for (let i = 0; i < pts.length; i += 6) { const w = W(...pts[i]); await this.moveTo(cp, w.clone().add(V3(0, 0.0005, 0)), new THREE.Quaternion(), i ? 0.18 : 0.7); bd.dot(pts[i], null, { col: '#1d4f9a' }); } first = false; await this.home(cp, 0.6); }
      for (let i = 1; i < pts.length; i++) bd.line(pts[i - 1], pts[i], { col: '#1d4f9a', w: 2 });
      const mid = pts[Math.floor(pts.length / 2)], nx = pts[Math.min(pts.length - 1, Math.floor(pts.length / 2) + 2)]; if (mid && nx) { const a = Math.atan2(nx[1] - mid[1], nx[0] - mid[0]); const L = 0.006; bd.line(mid, [mid[0] - L * Math.cos(a - 0.5), mid[1] - L * Math.sin(a - 0.5)], { col: '#1d4f9a', w: 2.5 }); bd.line(mid, [mid[0] - L * Math.cos(a + 0.5), mid[1] - L * Math.sin(a + 0.5)], { col: '#1d4f9a', w: 2.5 }); }
      await this.sleep(0.15); }
    this.lab.emit('lines', { obj: bd.id }); this.busy--;
  },
  // free wiring by the student: a new wire between any two terminals, or unclip the last wire on a terminal
  termKey(t) { return Object.keys(t.item.terms).find((k) => t.item.terms[k] === t); },
  connect(ta, tb, col) { if (!ta || !tb || ta === tb) return null; const cols = [0xc62828, 0x1d1d1d, 0x1d4f9a, 0xe0a020, 0x2e7d32]; this._wc = (this._wc || 0) + 1; const [w] = this.wires([[[ta.item, this.termKey(ta)], [tb.item, this.termKey(tb)], col ?? cols[this._wc % cols.length]]]); this.lab.emit('lead', { obj: tb.item.id, wired: true }); this.app.audio && this.app.audio.clink && this.app.audio.clink(); return w; },
  unwire(t) { const ws = (this.wireList || []).filter((w) => !w.gone && (w.a === t || w.b === t)); const w = ws[ws.length - 1]; if (!w) return false; w.gone = true; w.mesh.visible = false; w.clips.forEach((c) => (c.visible = false)); if (this.dc) { const i = this.dc.links.indexOf(w.link); if (i >= 0) this.dc.links.splice(i, 1); } w.update = () => {}; this.lab.emit('unwire', { obj: t.item.id }); this.app.audio && this.app.audio.clink && this.app.audio.clink(); return true; },
  // unclip one end of a wire and clip it on another terminal (the clip travels there in the hand); the circuit follows
  async moveLead(w, end, term, dur = 0.9) {
    this.busy++; const old = w[end]; const p0 = old.item.g.localToWorld(old.local.clone()); const at = () => term.item.g.localToWorld(term.local.clone());
    const h = new Item('lead', {}); h.noGrab = true; h.height = 0.001; h.radius = 0.001; this.lab.add(h, p0.x, p0.z, { y: p0.y }); h.g.position.copy(p0); h.terms = { h: { item: h, local: V3(0, 0, 0), dir: old.dir.clone().applyQuaternion(old.item.g.getWorldQuaternion(new THREE.Quaternion())) } };
    const k = end === 'a' ? 0 : 1; w[end] = h.terms.h; if (w.link) w.link[k] = h.terms.h; w.last[0].set(1e9, 0, 0);
    await this.tween(dur, (t) => { const e = ease(t); h.g.position.lerpVectors(p0, at(), e); h.g.position.y += Math.sin(Math.PI * e) * 0.05; });
    w[end] = term; if (w.link) w.link[k] = term; w.last[0].set(1e9, 0, 0); h.g.position.set(0, -2, 0);
    this.app.audio && this.app.audio.clink && this.app.audio.clink(); this.lab.emit('lead', { obj: term.item.id }); this.busy--;
  },
  async rheo(rh, k, dur = 1) { this.busy++; const k0 = rh.k; await this.tween(dur, (t) => rh.setK(k0 + (k - k0) * ease(t))); this.lab.emit('rheostat', { v: rh.id, k }); await this.sleep(0.8); this.busy--; },
  // ---------------------------------------------------------- drawing board
  async pinAt(pin, board, u, v) { this.busy++; const w = board.g.localToWorld(board.toLocal(u, v)); await this.moveTo(pin, w.clone().add(V3(0, 0.05, 0)), new THREE.Quaternion(), 0.8); await this.tween(0.35, (k) => { pin.g.position.y = w.y + 0.05 * (1 - k) - 0.006 * k; }); pin.home = { p: pin.g.position.clone(), q: pin.g.quaternion.clone() }; pin.uv = [u, v]; this.lab.emit('pin', { obj: pin.id }); this.busy--; },
  // a pencil draws a line on the sheet, from a to b (paper coordinates)
  async pencil(pc, board, a, b, o = {}) {
    this.busy++; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.35)); const tipL = V3(0, 0, 0).applyQuaternion(q); const W = (p) => board.g.localToWorld(board.toLocal(p[0], p[1])).sub(tipL);
    await this.moveTo(pc, W(a).add(V3(0, 0.03, 0)), q, 0.7); await this.tween(0.25, (k) => pc.g.position.lerpVectors(W(a).add(V3(0, 0.03, 0)), W(a), k));
    let last = a; const n = 12; for (let i = 1; i <= n; i++) { const p = [a[0] + (b[0] - a[0]) * (i / n), a[1] + (b[1] - a[1]) * (i / n)]; await this.tween(o.fast ? 0.03 : 0.06, (k) => pc.g.position.lerpVectors(W(last), W(p), k)); board.line(last, p, o); last = p; }
    await this.tween(0.25, (k) => { pc.g.position.y += 0.002; }); this.lab.emit('draw', { obj: board.id }); await this.home(pc, 0.6); this.busy--;
  },
  async lift(it, x, z) { this.busy++; await this.moveTo(it, V3(x, BENCH_Y + 0.0008, z), new THREE.Quaternion(), 0.9); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.lab.emit('lift', { obj: it.id }); this.busy--; },
  // ---------------------------------------------------------- magnets
  async tapSheet(sh, n = 3) { this.busy++; const p = sh.g.position.clone(); for (let i = 0; i < n; i++) { await this.tween(0.12, (k) => { sh.g.position.y = p.y + Math.sin(Math.PI * k) * 0.003; }); sh.tap(this.lab.items); this.app.audio && this.app.audio.tone && this.app.audio.tone(300, 0.05, 0.05, 'triangle'); await this.sleep(0.25); } sh.g.position.copy(p); this.lab.emit('tap', { obj: sh.id }); this.busy--; },
});
export { OP, EL, RF, MG, O2, MC, M2, M3, M4, L2, M5, M6, M7, MT, MT2, MT3 };
