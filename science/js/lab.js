// The lab bench: keeps every item, and runs the physical side of experiments — pouring when a vessel tilts
// past its rim, drops, solids sitting in liquid, heating over a flame, litmus dipping and splint tests.
import * as THREE from 'three';
import { Mix, SOLIDS, SUBS, heatTick, stripColor, CTX } from './chem.js';
import { BENCH_Y } from './room.js';

const SOFT_GLASS = ['cylinder', 'measuring', 'bottle', 'dropbottle', 'jar']; // ordinary (soda-lime) glass cracks in a flame; test tubes, beakers and flasks are heat-proof glass
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion();

export class Lab {
  constructor(scene, fx, chem, audio) {
    this.scene = scene; this.fx = fx; this.chem = chem; this.audio = audio;
    this.items = []; this.byId = {}; this.vessels = [];
    this.events = []; this.listeners = [];
    this.t = 0;
  }
  emit(type, d = {}) { const e = { type, ...d, t: this.t }; for (const f of this.listeners) f(e); }
  add(item, x, z, o = {}) {
    item.g.position.set(x, (o.y ?? BENCH_Y) - item.base + 0.0008, z); item.g.rotation.set(0, o.ry ?? 0, 0); // a hair above the surface: no flicker
    item.home = { p: item.g.position.clone(), q: item.g.quaternion.clone() };
    this.scene.add(item.g); this.items.push(item); this.byId[item.id] = item; item.lab = this;
    if (item.inner) { item.mix = item.mix || new Mix(); item.gas = item.gas || {}; item.gasIn = item.gasIn || {}; this.vessels.push(item);
      item.gasOut = (type, amt) => { if (item.pipeTo) { item.pipeTo.gasIn[type] = (item.pipeTo.gasIn[type] || 0) + amt; } else item.gas[type] = (item.gas[type] || 0) + amt; if (!item.holdGas && type === 'CO2') item.ledger = (item.ledger || 0) - amt * 0.0063; }; } // gas that escapes takes its mass away (ledger: grams on a balance)
    item.g.traverse((m) => { if (m.isMesh && !m.material.transparent) { m.castShadow = true; m.receiveShadow = true; } });
    return item;
  }
  clear() {
    for (const it of this.items) { it.g.parent && it.g.parent.remove(it.g); }
    this.items = []; this.byId = {}; this.vessels = []; this.fx.bubbles = []; this.fx.flakes = []; this.fx.puffs = [];
  }
  fill(v, sub, ml) { v.mix.add(sub, ml); v.ml = v.mix.ml(); v.ledger = (v.ledger || 0) + ml; }
  // ---------------------------------------------------------- solids inside vessels
  putSolid(s, v, o = {}) {
    // move the solid's group into the vessel, resting at the bottom
    if (s.g.parent) s.g.parent.remove(s.g);
    v.g.add(s.g); s.inVessel = v; v.solids.push(s); if (s.chem0 == null) s.chem0 = s.chem; // chem0: what was put in (reactions may change s.chem later)
    const y0 = v.inner[0].y + 0.0015;
    if (s.kind === 'nail') { s.g.position.set(0.0022, y0 + 0.002, 0); s.g.rotation.set(0, 0, -0.06); s.localY = 0.01; }
    else if (s.kind === 'ribbon') { s.g.position.set(0, y0, 0); s.g.rotation.set(0, 0, 0.12); s.localY = 0.006; }
    else { s.g.position.set(0, y0, 0); s.g.rotation.set(0, 0, 0); s.localY = 0.004; }
    s.amount = s.amount ?? 1; v.ledger = (v.ledger || 0) + (s.gram ?? (SOLIDS[s.chem]?.spoonG ?? 2) * s.amount); if (s.carrier) s.carrier.gram = Math.max(0, (s.carrier.gram || 0) - (s.gram ?? 2));
    if (s.kind !== 'nail' && s.kind !== 'ribbon' && v.rInner) { s.fit = Math.min(1, (v.rInner(y0 + 0.004) * 0.92) / (s.radius || 0.008)) * (v.kind === 'dish' ? 2.2 : 1); s.g.scale.setScalar(s.fit * Math.max(0.05, Math.cbrt(s.amount))); } // shrink to fit a narrow tube
    s.surfacePoint = () => {
      if (s.kind === 'nail') return new THREE.Vector3(0.0022 + (Math.random() - 0.5) * 0.002, y0 + 0.004 + Math.random() * 0.04, (Math.random() - 0.5) * 0.002);
      if (s.kind === 'ribbon') return new THREE.Vector3((Math.random() - 0.5) * 0.002, y0 + Math.random() * 0.06 * Math.max(0.1, s.amount), (Math.random() - 0.5) * 0.001);
      return new THREE.Vector3((Math.random() - 0.5) * 0.008, y0 + 0.003, (Math.random() - 0.5) * 0.008);
    };
    // visual hooks
    if (s.mat) {
      const c0 = s.mat.color.clone();
      s.onCoat = (k, col) => { s.mat.color.copy(c0).lerp(new THREE.Color(col), Math.min(1, k * 1.15)); s.mat.metalness = 0.9 - 0.6 * k; s.mat.roughness = 0.35 + 0.45 * k; };
      if (s.chem === 'cuso4x') { const blue = c0.clone(); s.onWhite = (w) => { s.mat.color.copy(blue).lerp(new THREE.Color(0xf2f2ee), w); }; }
      if (s.chem === 'feso4x') { s.onStage = (st) => { const g = c0.clone(), w = new THREE.Color(0xf1f0e8), b = new THREE.Color(0x8b3a1a); s.mat.color.copy(st < 1 ? g.lerp(w, st) : w.lerp(b, st - 1)); }; }
      const ST = SOLIDS[s.chem]?.stages; if (ST) { const cs = ST.map((h) => new THREE.Color(h)); s.onStage = (st) => { const i = Math.min(cs.length - 2, Math.floor(st)); s.mat.color.copy(cs[i]).lerp(cs[i + 1], Math.min(1, st - i)); s.mat.roughness = st > 0.7 && st < 2 ? 0.25 : 0.9; }; }
      if (s.chem === 'pbno3s') { s.onStage = (st) => { s.mat.color.copy(new THREE.Color(0xf5f5f2).lerp(new THREE.Color(0xe8c437), st)); }; }
    }
    s.onAmount = () => { const k = Math.max(0, s.amount); if (s.kind === 'ribbon') { s.g.scale.y = Math.max(0.02, k); s.g.visible = k > 0.02; } else s.g.scale.setScalar((s.fit ?? 1) * Math.max(0.05, Math.cbrt(k))); if (s.heap) s.heap.scale.y = 0.35 * k; };
    this.emit('add', { obj: s.id, chem: s.chem, to: v.id });
    if (this.audio) this.audio.clink && this.audio.clink();
  }
  // ---------------------------------------------------------- per-frame physics
  update(dt, t) {
    this.t = t;
    for (const it of this.items) it.update && it.update(dt, t);
    this.pour(dt);
    this.overflow();
    this.heat(dt);
    this.tests(dt);
    this.chem.tick(this.vessels, dt);
    for (const v of this.vessels) { v.update(dt); if (v.glassT != null) { const t0 = v.ml > 0.5 ? v.mix.temp : 27; v.glassT += (t0 - v.glassT) * Math.min(1, dt * (v.ml > 0.5 ? 2 : 0.05)); } }
    this.fx.endStreams();
    this.fx.update(dt, t);
  }
  // more liquid than the vessel holds runs over the rim onto the bench (a boiling tube cannot take three bottles of reagent)
  overflow() {
    for (const v of this.vessels) {
      if (v.broken || !v.mix || !v.tab || !v.tab.length) continue; const full = v.tab[v.tab.length - 1][1]; if (!(full > 0) || v.ml <= full + 0.05) continue;
      const ex = v.ml - full; v.mix.take(ex); v.ml = v.mix.ml();
      const lip = v.lipLow(new THREE.Vector3()); const c = v.g.getWorldPosition(new THREE.Vector3()); const out = new THREE.Vector3(lip.x - c.x, 0, lip.z - c.z); if (out.lengthSq() < 1e-8) out.set(1, 0, 0); out.normalize();
      const from = lip.clone().addScaledVector(out, 0.002); const to = from.clone().addScaledVector(out, 0.012); to.y = (this.surfaceY ? this.surfaceY(to.x, to.z) : BENCH_Y) + 0.001;
      this.fx.stream(v.id + ':over', from, to, v.color, 0.0016);
      if (this.t - (v._overT ?? -9) > 2) { v._overT = this.t; this.emit('overflow', { obj: v.id, ml: Math.round(full) }); }
    }
  }
  pour(dt) {
    for (const v of this.vessels) {
      if (v.ml <= 0.05 || v.closed) continue;
      const up = v.worldUp(); if (up.y > 0.55) continue; // must be tilted well
      const lip = v.lipLow(tmp); const lvl = v.levelWorld();
      const head = lvl - lip.y; if (head <= 0) continue;
      let rate = Math.min(v.ml, (2 + 25 * head / Math.max(0.005, v.rimR)) * dt * (v.rimR / 0.01) * (v.pourK ?? 1));
      if (v.pourLimit != null) { rate = Math.min(rate, v.pourLimit); v.pourLimit -= rate; if (rate <= 1e-5) continue; }
      const asDrop = v.kind === 'dropbottle' && v.pourLimit == null; // a dropper bottle tilted over a vessel by hand gives drops, one at a time, not a stream
      if (asDrop) { v._dropT = (v._dropT || 0) + dt; if (v._dropT < 0.45) continue; v._dropT = 0; rate = Math.min(v.ml, 0.05); }
      // where does the stream land? look for an open vessel mouth below the lip
      const out = new THREE.Vector3(up.x, 0, up.z).normalize().multiplyScalar(0.004);
      const land = lip.clone().add(out); let target = null, best = 0.5;
      for (const w of this.vessels) {
        if (w === v || w.closed) continue; const m = w.mouthWorld(tmp2);
        const d = Math.hypot(m.x - land.x, m.z - land.z); const wup = w.worldUp();
        if (m.y < lip.y && d < Math.max(0.006, w.rimR * 1.15) && wup.y > 0.6 && lip.y - m.y < best) { best = lip.y - m.y; target = w; }
      }
      const portion = v.mix.take(rate); v.ml = v.mix.ml(); v.ledger = (v.ledger || 0) - rate; if (target) target.ledger = (target.ledger || 0) + rate;
      const bottom = target ? target.mouthWorld(tmp2).clone() : land.clone().setY((this.surfaceY ? this.surfaceY(land.x, land.z) : BENCH_Y) + 0.001);
      if (asDrop) {
        const to = target ? new THREE.Vector3(bottom.x, Math.max(target.levelWorld(), target.g.localToWorld(new THREE.Vector3(0, target.inner[0].y, 0)).y) + 0.001, bottom.z) : new THREE.Vector3(land.x, bottom.y, land.z);
        this.fx.drop(lip.clone().add(out), to, v.color.clone(), () => { if (target && !target.broken) { target.mix.put(portion, rate); target.ml = target.mix.ml(); this.emit('drop', { from: v.id, to: target.id }); } });
        this.emit('pouring', { from: v.id, to: target ? target.id : null, ml: rate, spill: false, drop: true }); continue;
      }
      if (target && this.phys && (target.glassT ?? 27) > 200 && !(target.solids && target.solids.length) && portion && portion.temp != null && portion.temp < 45 && !target.pyrex && Math.random() < 0.5) { this.emit('cracked', { obj: target.id, why: 'cold' }); this.phys.shatter(target, 0.2); }
      if (target) { const surf = target.levelWorld(); bottom.y = Math.max(surf, target.g.localToWorld(new THREE.Vector3(0, target.inner[0].y, 0)).y); target.mix.put(portion, rate); target.ml = target.mix.ml(); target._ripT = 0.6; }
      const look = target ? null : 'spill';
      this.fx.stream(v.id, lip.clone().add(out), new THREE.Vector3(land.x, bottom.y, land.z), v.color, 0.0012 + Math.min(0.0016, rate / dt * 0.0002));
      v._pouring = (v._pouring || 0) + rate;
      this.emit('pouring', { from: v.id, to: target ? target.id : null, ml: rate, spill: !!look, at: target ? null : new THREE.Vector3(land.x, bottom.y, land.z), color: v.color });
      if (this.audio && this.audio.pour) this.audio.pour(dt);
    }
  }
  heat(dt) {
    const flames = this.items.filter((i) => i.lit && i.heatPoint);
    for (const f of flames) {
      const hp = f.g.localToWorld(tmp.copy(f.heatPoint));
      for (const v of this.vessels) {
        if (v.bath || v.broken) continue; // a vessel standing in a bath is heated only by the bath
        // the lowest point of the vessel must sit in the flame
        const b = v.g.localToWorld(tmp2.set(0, v.inner[0].y, 0));
        const dxz = Math.hypot(b.x - hp.x, b.z - hp.z), dy = b.y - hp.y;
        const onTripod = v.onTripod && v.onTripod.over === f;
        if ((dxz < 0.03 && dy > -0.035 && dy < 0.05) || onTripod) {
          heatTick(v, dt * (onTripod ? 0.7 : 1) * this.chem.lapse, this.chem); v.heatNow = 0.2; v.glassT = (v.glassT ?? 27) + dt * this.chem.lapse * (v.ml < 0.5 ? 55 : 4) * (onTripod ? 0.3 : 1); // empty glass in a flame gets very hot
          if (this.phys && v.ml < 0.5 && !(v.solids && v.solids.length) && v.glassT > 380 && SOFT_GLASS.includes(v.kind) && Math.random() < dt * 0.4) { this.emit('cracked', { obj: v.id, why: 'empty' }); this.phys.shatter(v, 0.15); continue; } v._heated = (v._heated || 0) + dt; if (v.onHeat) { CTX.rule++; try { v.onHeat(dt * this.chem.lapse, this.chem); } finally { CTX.rule--; } }
          this.emit('heating', { v: v.id, by: f.id, sec: v._heated });
        }
      }
      // items that react to a flame themselves (spoon with sulphur, blade, slide, thin tube …)
      for (const it of this.items) if (it.flameTest && it !== f) it.flameTest(dt * this.chem.lapse, f, hp);
      // ribbon / other items held in the flame
      for (const it of this.items) {
        if (it.kind !== 'ribbon' || it.burnt || it.inVessel) continue; // a ribbon lying in water never catches fire
        const tip = it.g.localToWorld(tmp2.set(0, 0.002, 0));
        if (tip.distanceTo(hp) < 0.035) { it.burning = (it.burning || 0) + dt; }
      }
    }
    // burning magnesium: blinding white light, white ash
    for (const it of this.items) {
      if (it.kind !== 'ribbon' || !it.burning || it.burnt) continue;
      if (it.burning > 0.6) {
        it.left = (it.left ?? 1) - dt * 0.16; const tip = it.g.localToWorld(tmp2.set(0, 0.07 * (1 - it.left), 0));
        this.fx.glow(tip, true, 7, 0xffffff, 0.16);
        if (Math.random() < dt * 14) this.fx.puff(tip, '#f4f4f0', { alpha: 0.5, size: 0.008, grow: 0.05, life: 2.4, up: 0.08 });
        it.mat.color.setHex(0xf2f2ee); it.mat.metalness = 0.05; it.mat.roughness = 0.95;
        this.emit('mg_burning', { obj: it.id, left: it.left });
        if (it.left <= 0) { it.burnt = true; this.fx.glow(tip, false); this.emit('mg_burnt', { obj: it.id }); }
      }
    }
  }
  tests(dt) {
    for (const it of this.items) {
      // strips dipped in a liquid change colour
      if (it.kind === 'strip' && !it.dipped) {
        const tip = it.g.localToWorld(tmp.set(0, 0.004, 0));
        for (const v of this.vessels) {
          if (v.ml < 0.3) continue; const inv = v.g.worldToLocal(tmp2.copy(tip));
          if (inv.y > v.inner[0].y && inv.y < v.heightFor(v.ml) && Math.hypot(inv.x, inv.z) < v.rInner(inv.y)) {
            const pH = v.mix.pH(); const c = stripColor(it.stripKind, pH); it.wet.material.color.copy(c); it.wet.visible = true; it.dipped = v.id; it.pH = pH;
            this.emit('dip', { obj: it.id, in: v.id, pH, kind: it.stripKind }); break;
          }
        }
      }
      // splint tests at the mouth of a vessel
      if (it.kind === 'splint' && (it.burning || it.glowing)) {
        const tip = it.g.localToWorld(tmp.copy(it.tipLocal));
        for (const v of this.vessels) {
          const m = v.mouthWorld(tmp2); if (tip.distanceTo(m) > 0.03) continue;
          if (it.burning && (v.gas.H2 || 0) > 0.02 && !it.popped) { it.popped = true; this.fx.flashAt(m, 3, 0.18, 0xffd27a, 0.08); this.audio && this.audio.pop && this.audio.pop(); v.gas.H2 = 0; it.setFlame(false); this.emit('pop', { v: v.id }); }
          else if (it.burning && (v.gas.CO2 || 0) > 0.02) { it.setFlame(false); this.emit('extinguish', { v: v.id }); }
        }
      }
    }
  }
}

// make a solid item that knows its chemistry
export function asChem(item, chem, amount = 1) { item.chem = chem; item.amount = amount; if (!item.name || item.name.en === item.kind) item.name = SOLIDS[chem].n; return item; }
export { SUBS };
void tmpQ;
