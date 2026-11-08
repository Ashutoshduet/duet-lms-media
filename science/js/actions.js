// "Kit": builds the apparatus for an experiment and performs each lab action with a smooth animation —
// the same physics runs whether the student does it by hand in VR or presses "Do it".
import * as THREE from 'three';
import * as A from './apparatus.js';
import * as A3 from './apparatus3.js';
import { asChem } from './lab.js';
import { SUBS, SOLIDS, stripColor } from './chem.js';
import { BENCH_Y } from './room.js';

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const tmp = new THREE.Vector3();

export class Kit {
  constructor(app) { this.app = app; this.lab = app.lab; this.fx = app.fx; this.tweens = []; this.speed = 1; this.busy = 0; this.A = A; this.A3 = A3; this.THREE = THREE; this.extras = []; }
  dispose() { for (const o of this.extras) o.parent && o.parent.remove(o); this.extras = []; this.tweens = []; }
  // ---------------------------------------------------------- tween engine (driven by the app loop)
  tween(dur, fn) { return new Promise((res) => { this.tweens.push({ t: 0, dur: Math.max(0.001, dur), fn, res }); }); }
  sleep(sec) { return this.tween(sec, () => {}); }
  update(dt) { // dt is already scaled by the app's simulation speed (this.speed)
    const d = dt;
    this.tweens = this.tweens.filter((w) => { w.t += d; const k = Math.min(1, w.t / w.dur); w.fn(k, d); if (k >= 1) { w.res(); return false; } return true; });
  }
  cancel() { for (const w of this.tweens) w.res(); this.tweens = []; }
  // world pose helpers
  detach(it) { // keep the world pose but hang directly on the scene
    const g = it.g; g.updateWorldMatrix(true, false); const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); g.matrixWorld.decompose(p, q, s);
    if (g.parent !== this.app.scene) { g.parent && g.parent.remove(g); this.app.scene.add(g); g.position.copy(p); g.quaternion.copy(q); }
  }
  async moveTo(it, p, q, dur = 0.8) {
    this.detach(it); const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(); const q1 = q || q0;
    const lift = Math.max(0, Math.min(0.12, 0.6 * p0.distanceTo(p)));
    await this.tween(dur, (k) => { const e = ease(k); it.g.position.lerpVectors(p0, p, e); it.g.position.y += Math.sin(Math.PI * e) * lift; it.g.quaternion.slerpQuaternions(q0, q1, e); });
  }
  up(it, h = 0.12, dur = 0.4) { const p = it.g.position.clone(); p.y += h; return this.moveTo(it, p, null, dur); }
  home(it, dur = 0.8) { return this.moveTo(it, it.home.p.clone(), it.home.q.clone(), dur); }
  // ---------------------------------------------------------- building the bench
  add(item, x, z, o) { const it = this.lab.add(item, x, z, o); return it; }
  rack(x, z) { return this.add(A.rack(6), x, z); }
  tube(rk, i, sub, ml, o = {}) {
    const t = o.boiling ? A.boilingTube() : A.testTube();
    this.add(t, rk.g.position.x + rk.slots[i].x, rk.g.position.z + rk.slots[i].z, { y: BENCH_Y + rk.slots[i].y });
    if (sub) this.lab.fill(t, sub, ml); t.rack = rk; t.slotI = i; return t;
  }
  label(sub) { const s = SUBS[sub]; return { formula: s.f.length > 12 ? s.f.split(' ')[0] : s.f, name: s.n.en, hazard: ['hcl', 'h2so4', 'naoh', 'pbno3', 'agno3', 'bacl2'].includes(sub), band: { hcl: '#b03a2e', h2so4: '#b03a2e', naoh: '#2f6b3a', cuso4: '#2c5d8a', limewater: '#5a6a7a' }[sub] || '#4a5a6a' }; }
  bottle(sub, x, z, o = {}) {
    const b = o.dropper ? A.dropperBottle(this.label(sub)) : A.reagentBottle(this.label(sub), { amber: o.amber || sub === 'agno3' });
    this.add(b, x, z, { y: o.shelf != null ? this.app.roomInfo.shelfY[o.shelf] : BENCH_Y }); this.lab.fill(b, sub, o.ml ?? (o.dropper ? 20 : 90)); b.sub = sub;
    b.name = SUBS[sub].n; return b;
  }
  beaker(x, z, sub, ml, size = 100) { const b = this.add(A.beaker(size), x, z); if (sub) this.lab.fill(b, sub, ml); return b; }
  flask(x, z, sub, ml) { const f = this.add(A.conicalFlask(100), x, z); if (sub) this.lab.fill(f, sub, ml); return f; }
  lamp(x, z) { return this.add(A.spiritLamp(), x, z); }
  burner(x, z) { return this.add(A.bunsen(), x, z); }
  splint(x, z) { const s = this.add(A.splint(), x, z, { ry: 0.4 }); s.g.rotation.set(Math.PI / 2, 0.4, 0); s.g.position.y = BENCH_Y + 0.003; s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; return s; }
  strip(kind, x, z) {
    const col = { blue: 0x4e6fbf, red: 0xd0424a, ph: 0xe9c46a, turmeric: 0xe8b422 }[kind];
    const s = this.add(A.strip(col, { name: { en: { blue: 'Blue litmus paper', red: 'Red litmus paper', ph: 'pH paper', turmeric: 'Turmeric paper' }[kind], hi: { blue: 'नीला लिटमस पत्र', red: 'लाल लिटमस पत्र', ph: 'pH पत्र', turmeric: 'हल्दी पत्र' }[kind], hg: { blue: 'Blue litmus paper', red: 'Red litmus paper', ph: 'pH paper', turmeric: 'Haldi paper' }[kind] } }), x, z);
    s.stripKind = kind; s.g.rotation.set(-Math.PI / 2, 0, 0.3); s.g.position.y = BENCH_Y + 0.001; s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; return s;
  }
  solid(chem, x, z, o = {}) {
    const S = SOLIDS[chem]; let it; const tex = S.tex;
    if (chem === 'fe') it = A.nail();
    else if (chem === 'mg') it = A.ribbon();
    else if (chem === 'cuso4x' || chem === 'feso4x') it = A.crystals(S.color, { n: 12, tex });
    else if (chem === 'kmno4') it = A.crystals(S.color, { n: 3, tex });
    else if (['sugar', 'salt', 'na2co3', 'nahco3', 'pbno3s', 'nh4cl', 'chalk'].includes(chem)) it = A.heap(S.color, { tex }); // powders: a small heap with the real grain
    else if (chem === 'sand') it = A.heap(S.color, { tex, loose: 16 });
    else if (chem === 'cao') it = A.granules(S.color, { n: 5, metal: 0, rough: 0.95, tex });
    else if (chem === 'cacl2') it = A.granules(S.color, { n: 10, metal: 0, rough: 0.85, tex, shape: 'pellet' });
    else if (chem === 'cu') it = A.granules(S.color, { n: 7, metal: 0.85, rough: 0.35 });
    else if (chem === 'caco3') it = A.granules(S.color, { metal: 0, rough: 0.8, tex, shape: 'chip' });
    else it = A.granules(S.color, { metal: 0.75, rough: 0.4, tex });
    asChem(it, chem, o.amount ?? 1); it.name = S.n;
    // the solid starts on a watch glass so it is easy to see on the black bench
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.004, 0.075), new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.35 })); // white tile: the solid is easy to see
    tile.position.set(x, BENCH_Y + 0.002, z); tile.receiveShadow = true; this.app.scene.add(tile); this.extras.push(tile);
    const wg = this.add(A.watchGlass(), x, z, { y: BENCH_Y + 0.004 }); wg.name = { en: 'Watch glass', hi: 'वॉच ग्लास', hg: 'Watch glass' };
    this.add(it, x, z, { y: BENCH_Y + 0.008 }); it.dish = wg; return it;
  }
  // a small paper sticker on the front of a vessel ("A", "1", "Lime water" …)
  sticker(v, text, o = {}) {
    const tex = A.labelSticker ? A.labelSticker(text) : null; if (!tex) return;
    const r = v.rInner ? v.rInner(Math.min(v.rimY * 0.55, 0.05)) + (v.wall ?? 0.0012) + 0.0004 : 0.02;
    const w = Math.min(0.03, r * 1.3), h = w * 0.62;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true, -w / r / 2, w / r), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true }));
    m.position.y = o.y ?? Math.min(v.rimY * 0.55, 0.05); m.renderOrder = 7; m.userData.noHit = true; v.g.add(m); v.stickerMesh = m; return m;
  }
  holder(x, z) { const h = this.add(A.holder(), x, z, { ry: -0.5 }); return h; }
  tongs(x, z) { const t = this.add(A.tongs(), x, z); t.g.rotation.set(Math.PI / 2, 0, 0.6); t.g.position.y = BENCH_Y + 0.004; t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; return t; }
  thermo(x, z) { const t = this.add(A.thermometer(), x, z); t.g.rotation.set(Math.PI / 2, 0, -0.4); t.g.position.y = BENCH_Y + 0.004; t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; return t; }
  cylinder(x, z, ml = 10) { return this.add(A.measuringCylinder(ml), x, z); }

  // ---------------------------------------------------------- actions
  // tilt a vessel over another one and let the physics pour until `ml` has gone in
  async pour(src, dst, ml, o = {}) {
    this.busy++;
    if (src.stopper) await this.moveStopper(src, true);
    const dm = dst.mouthWorld(new THREE.Vector3());
    const dir = new THREE.Vector3(dm.x - src.g.position.x, 0, dm.z - src.g.position.z); if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0); dir.normalize();
    const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize(); // tilt towards the target
    const place = (ang) => {
      const q = new THREE.Quaternion().setFromAxisAngle(axis, ang); // the mouth tips towards the target
      let lipW = null; // the rim point that is lowest after tilting is where the liquid leaves
      for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; const pt = new THREE.Vector3(Math.cos(a) * src.rimR, src.rimY, Math.sin(a) * src.rimR).applyQuaternion(q); if (!lipW || pt.y < lipW.y) lipW = pt; }
      const p = dm.clone().add(new THREE.Vector3(0, (o.above ?? 0.03) + 0.004, 0)).sub(lipW).sub(dir.clone().multiplyScalar(0.003));
      return { p, q };
    };
    const want = Math.min(ml, src.ml); const startMl = dst.ml;
    const wasClosed = src.closed; src.closed = true; // nothing flows while it is carried over
    const a0 = place(0.3);
    await this.moveTo(src, a0.p, a0.q, 0.9);
    src.closed = wasClosed; src.pourLimit = want; // the lab lets exactly this much flow out
    let ang = 0.3;
    await new Promise((res) => {
      const w = { t: 0, dur: 1e9, fn: (k, d) => {
        const got = dst.ml - startMl;
        if (got >= want - 0.05 || src.ml < 0.05 || w.t > 14 || src.pourLimit <= 0.001) { w.t = w.dur; return; }
        const left = want - got; const target = Math.min(2.6, ang + d * (left > want * 0.3 ? 0.9 : 0.35));
        // only tilt further while nothing is flowing yet / flow is slow
        ang = src._pouring > 0 && left < want * 0.5 ? ang : target; src._pouring = 0;
        const s = place(ang); src.g.position.copy(s.p); src.g.quaternion.copy(s.q);
      }, res };
      this.tweens.push(w);
    });
    src.closed = true; src.pourLimit = null; // stop the flow while the vessel turns back upright
    const back = place(0); await this.moveTo(src, back.p, back.q, 0.35);
    await this.home(src, 0.8); src.closed = wasClosed;
    if (src.stopper) await this.moveStopper(src, false);
    this.lab.emit('pour', { from: src.id, to: dst.id, ml: dst.ml - startMl });
    this.busy--;
  }
  async moveStopper(b, off) { const s = b.stopper; const y0 = s.position.y; await this.tween(0.3, (k) => { s.position.y = off ? y0 + k * 0.03 : y0 - (1 - k) * 0 - k * 0.03; s.visible = !(off && k > 0.95); }); if (!off) { s.position.y = b.rimY - 0.002; s.visible = true; } }
  // drops from a dropper bottle
  async drops(bot, dst, n = 2) {
    this.busy++;
    const d = bot.dropper; const dWorld = new THREE.Vector3(); d.getWorldPosition(dWorld);
    // move the dropper (as a separate object) above the vessel
    const drop = d.clone(); this.app.scene.add(drop); this.extras.push(drop); drop.position.copy(dWorld); d.visible = false;
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0012, 0.06, 10), A.makeColor ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 }) : null);
    tip.position.y = -0.03; drop.add(tip);
    const m = dst.mouthWorld(new THREE.Vector3()); const above = m.clone().add(new THREE.Vector3(0, 0.08, 0));
    const p0 = drop.position.clone();
    await this.tween(0.8, (k) => { const e = ease(k); drop.position.lerpVectors(p0, above, e); drop.position.y += Math.sin(Math.PI * e) * 0.06; });
    for (let i = 0; i < n; i++) {
      const sq = n > 4 ? 0.1 : 0.25;
      await this.tween(sq, (k) => { drop.children[0].scale.set(1 + 0.25 * Math.sin(Math.PI * k), 1 - 0.2 * Math.sin(Math.PI * k), 1 + 0.25 * Math.sin(Math.PI * k)); });
      const from = drop.position.clone().add(new THREE.Vector3(0, -0.062, 0)); const to = new THREE.Vector3(m.x, dst.levelWorld() + 0.001, m.z);
      await new Promise((res) => this.fx.drop(from, to, bot.color.clone(), () => { const p = bot.mix.take(0.05); dst.mix.put(p, 0.05); dst.ml = dst.mix.ml(); this.lab.emit('drop', { from: bot.id, to: dst.id }); res(); }));
      await this.sleep(n > 4 ? 0.06 : 0.25);
    }
    await this.tween(0.8, (k) => { const e = ease(k); drop.position.lerpVectors(above, dWorld, e); });
    this.app.scene.remove(drop); d.visible = true; this.lab.emit('drops', { from: bot.id, to: dst.id, n }); this.busy--;
  }
  // put a solid (granules, nail, ribbon, crystals) into a vessel
  async addSolid(s, v) {
    this.busy++;
    const m = v.mouthWorld(new THREE.Vector3());
    const tilt = s.kind === 'nail' ? new THREE.Quaternion() : new THREE.Quaternion();
    await this.moveTo(s, m.clone().add(new THREE.Vector3(0, 0.06, 0)), tilt, 0.9);
    const from = s.g.position.clone(); const bottom = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y + 0.004, 0));
    await this.tween(0.45, (k) => { s.g.position.lerpVectors(from, bottom, k * k); });
    this.lab.putSolid(s, v); this.app.audio && this.app.audio.clink && this.app.audio.clink();
    this.busy--;
  }
  async light(lamp) {
    this.busy++;
    // a matchstick strikes and lights the wick
    const match = A.splint(); match.g.scale.set(1, 0.35, 1); this.app.scene.add(match.g); match.setFlame(true); this.extras.push(match.g);
    const top = lamp.g.localToWorld(new THREE.Vector3(0, lamp.kind === 'bunsen' ? 0.135 : 0.08, 0));
    const p0 = top.clone().add(new THREE.Vector3(0.12, 0.05, 0.08)); match.g.position.copy(p0); match.g.rotation.set(0, 0, 0.9);
    this.lab.items.push(match);
    await this.tween(0.7, (k) => { match.g.position.lerpVectors(p0, top.clone().add(new THREE.Vector3(0.045, -0.01, 0)), ease(k)); });
    lamp.setLit(true); this.app.audio && this.app.audio.whoosh && this.app.audio.whoosh();
    await this.tween(0.5, (k) => { match.g.position.x += 0.002; match.g.position.y += k * 0.002; });
    this.lab.items.splice(this.lab.items.indexOf(match), 1); this.app.scene.remove(match.g);
    this.lab.emit('lit', { obj: lamp.id }); this.busy--;
  }
  async extinguish(lamp) { lamp.setLit(false); this.lab.emit('unlit', { obj: lamp.id }); }
  // hold a test tube in a holder over the flame for `sec` (time-lapse speeds up the slow part)
  async heat(v, lamp, sec = 6, o = {}) {
    this.busy++;
    const hp = lamp.g.localToWorld(lamp.heatPoint.clone());
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), o.tilt ?? 0.45);
    // bottom of the tube in the hot part of the flame
    const bottomLocal = new THREE.Vector3(0, v.inner[0].y, 0).applyQuaternion(q);
    const p = hp.clone().sub(bottomLocal).add(new THREE.Vector3(0, 0.004, 0));
    await this.moveTo(v, p, q, 1);
    const lapse0 = this.app.chem.lapse; this.app.chem.lapse = o.lapse ?? 1;
    await this.tween(sec, (k) => { v.g.position.x = p.x + Math.sin(k * 60) * 0.004; }); // gentle shaking, as a student does
    this.app.chem.lapse = lapse0;
    await this.home(v, 0.9); this.busy--;
  }
  async dip(s, v) {
    this.busy++;
    const m = v.mouthWorld(new THREE.Vector3());
    const q = new THREE.Quaternion();
    await this.moveTo(s, m.clone().add(new THREE.Vector3(0, 0.07, 0)), q, 0.8);
    const deep = v.g.localToWorld(new THREE.Vector3(0, Math.max(v.inner[0].y + 0.006, v.heightFor(v.ml) - 0.012), 0));
    const p0 = s.g.position.clone();
    await this.tween(0.6, (k) => { s.g.position.lerpVectors(p0, deep, ease(k)); });
    await this.sleep(0.6);
    await this.tween(0.6, (k) => { s.g.position.lerpVectors(deep, p0, ease(k)); });
    // lay it on the bench next to the vessel so the colour is easy to see
    const rest = v.g.position.clone().add(new THREE.Vector3(0.0, 0, 0.09)); rest.y = BENCH_Y + 0.001;
    await this.moveTo(s, rest, new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.2)), 0.8);
    s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; this.busy--;
  }
  async splintTest(sp, v, lamp, o = {}) {
    this.busy++;
    const lt = lamp.g.localToWorld(new THREE.Vector3(0, (lamp.kind === 'bunsen' ? 0.15 : 0.1), 0));
    const qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 1.2));
    await this.moveTo(sp, lt.clone().add(new THREE.Vector3(0.11, 0.0, 0)), qUp, 0.9);
    sp.setFlame(!o.glowing); if (o.glowing) { await this.sleep(0.6); sp.setFlame(false); sp.setGlow(true); }
    await this.sleep(0.5);
    const m = v.mouthWorld(new THREE.Vector3());
    const tipLocal = sp.tipLocal.clone().applyQuaternion(qUp);
    await this.moveTo(sp, m.clone().sub(tipLocal).add(new THREE.Vector3(0, 0.012, 0)), qUp, 1);
    await this.sleep(1.4);
    sp.setFlame(false); sp.setGlow(false);
    await this.home(sp, 0.9); this.busy--;
  }
  async wait(sec, lapse = 1) { const l0 = this.app.chem.lapse; this.app.chem.lapse = lapse; this.app.lapseShown = lapse > 1 ? lapse : 0; await this.tween(sec, () => {}); this.app.chem.lapse = l0; this.app.lapseShown = 0; }
  async shake(v, sec = 1.2) { this.busy++; await this.up(v, 0.08, 0.4); const p = v.g.position.clone(); v.shaking = true; await this.tween(sec, (k) => { v.g.position.x = p.x + Math.sin(k * 50) * 0.008; v.g.rotation.z = Math.sin(k * 50) * 0.12; }); v.shaking = false; await this.home(v, 0.6); this.busy--; }
  // delivery tube from a corked tube into another vessel (gas goes there)
  pipe(from, to) {
    const a = from.mouthWorld(new THREE.Vector3()); const b = to.mouthWorld(new THREE.Vector3());
    const end = to.g.localToWorld(new THREE.Vector3(0.002, to.inner[0].y + 0.012, 0));
    const pts = [a.clone().add(new THREE.Vector3(0, -0.008, 0)), a.clone().add(new THREE.Vector3(0, 0.06, 0)), new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.09, (a.z + b.z) / 2), b.clone().add(new THREE.Vector3(0, 0.06, 0)), end];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0028, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, depthWrite: false }));
    tube.renderOrder = 7; this.app.scene.add(tube); this.extras.push(tube);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(from.rimR * 1.05, from.rimR * 0.85, 0.016, 16), new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 }));
    cork.position.y = from.rimY - 0.004; from.g.add(cork);
    from.pipeTo = to; to.pipeEnd = to.g.worldToLocal(end.clone()); from.closed = true;
    this.lab.emit('pipe', { from: from.id, to: to.id });
    return { tube, cork };
  }
  async burnRibbon(rb, tg, lamp) {
    this.busy++;
    // the tongs grip one end of the ribbon; the free end (the ribbon's local y = 0) goes into the hot part of the flame
    const hp = lamp.g.localToWorld(lamp.heatPoint.clone());
    const u = new THREE.Vector3(0.55, 0.75, 0.35).normalize(); // tongs point down-left into the flame, handle towards the student
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), u);
    const rp = rb.g.getWorldPosition(new THREE.Vector3());
    await this.moveTo(tg, rp.clone().add(u.clone().multiplyScalar(0.07)), q, 0.8);
    this.detach(rb); tg.g.add(rb.g); rb.g.position.set(0, -0.07, 0); rb.g.quaternion.identity();
    await this.moveTo(tg, hp.clone().add(u.clone().multiplyScalar(0.07)).add(new THREE.Vector3(0, 0.004, 0)), q, 1);
    await new Promise((res) => { const w = { t: 0, dur: 1e9, fn: () => { if (rb.burnt || w.t > 40) w.t = w.dur; }, res }; this.tweens.push(w); });
    await this.sleep(0.6);
    await this.home(tg, 1); this.busy--;
  }
  // ---------------------------------------------------------- batch 2 actions
  rod(x, z) { const r = this.add(A.glassRod(), x, z); r.g.rotation.set(Math.PI / 2, 0, 0.5); r.g.position.y = BENCH_Y + 0.004; r.home = { p: r.g.position.clone(), q: r.g.quaternion.clone() }; return r; }
  // stir with a glass rod: the rod goes into the liquid and circles; the vessel counts as "stirred" meanwhile
  async stir(rod, v, sec = 3) {
    this.busy++;
    const m = v.mouthWorld(new THREE.Vector3()); const bottom = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y + 0.008, 0));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12));
    await this.moveTo(rod, m.clone().add(new THREE.Vector3(0, 0.05, 0)), q, 0.8);
    const p0 = rod.g.position.clone(); const p1 = new THREE.Vector3(bottom.x, bottom.y, bottom.z);
    await this.tween(0.5, (k) => rod.g.position.lerpVectors(p0, p1, ease(k)));
    const r = Math.max(0.002, v.rInner(v.inner[0].y + 0.02) * 0.45);
    await this.tween(sec, (k) => { const a = k * sec * 9; rod.g.position.set(p1.x + Math.cos(a) * r, p1.y, p1.z + Math.sin(a) * r); v.stirT = 0.4; v.wobV && v.wobV.set(Math.cos(a) * 0.01, Math.sin(a) * 0.01); });
    this.lab.emit('stir', { v: v.id, sec });
    await this.tween(0.5, (k) => rod.g.position.lerpVectors(p1, p0, ease(k)));
    await this.home(rod, 0.8); this.busy--;
  }
  tripod(x, z) { return this.add(A.tripod(), x, z); }
  // put a dish or beaker on the tripod, over the lamp (the lamp slides under it)
  async onTripod(v, tp, lamp) {
    this.busy++;
    const top = tp.g.localToWorld(new THREE.Vector3(0, tp.top + 0.001, 0));
    await this.moveTo(v, new THREE.Vector3(top.x, top.y - v.base, top.z), new THREE.Quaternion(), 0.9);
    v.onTripod = { over: lamp }; v.home = { p: v.g.position.clone(), q: v.g.quaternion.clone() };
    if (lamp) { const lp = lamp.g.position.clone(); await this.moveTo(lamp, new THREE.Vector3(top.x, lp.y, top.z), null, 0.8); lamp.home = { p: lamp.g.position.clone(), q: lamp.g.quaternion.clone() }; }
    this.busy--;
  }
  // blow gently through a straw into a liquid (breath has carbon dioxide)
  async blow(st, v, sec = 6) {
    this.busy++;
    const end = v.g.localToWorld(new THREE.Vector3(0.002, v.inner[0].y + 0.012, 0));
    await this.moveTo(st, end.clone().add(new THREE.Vector3(0, 0.06, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.08)), 0.8);
    const p0 = st.g.position.clone(); await this.tween(0.5, (k) => st.g.position.lerpVectors(p0, end, ease(k)));
    v.pipeEnd = v.g.worldToLocal(end.clone());
    await this.tween(sec, (k, d) => { v.gasIn.CO2 = (v.gasIn.CO2 || 0) + d * 0.35; v.gasIn.air = 1; if (!v.mix.has('limewater')) this.fx.bubbles_(v, 50, d, { from: () => v.pipeEnd.clone(), size: 0.0012 }); });
    this.lab.emit('blow', { v: v.id }); v.pipeEnd = null;
    await this.tween(0.4, (k) => st.g.position.lerpVectors(end, p0, ease(k))); await this.home(st, 0.8); this.busy--;
  }
  // shine a torch sideways through a beaker: the beam is visible only if particles scatter light
  async shine(tc, v, sec = 2.5) {
    this.busy++;
    const c = v.g.localToWorld(new THREE.Vector3(0, Math.min(v.heightFor(v.ml) * 0.55, 0.04), 0));
    const R = v.rInner(0.03);
    await this.moveTo(tc, new THREE.Vector3(c.x - R - 0.03, c.y - 0.012, c.z), new THREE.Quaternion(), 0.8); // held at the height of the liquid
    tc.setOn(true); this.app.audio && this.app.audio.tone && this.app.audio.tone(1400, 0.05, 0.05);
    if (!v.beam) { v.beam = A.beam(R * 2 * 0.98, 0.006); v.g.add(v.beam); }
    v.beam.position.set(0, c.y - v.g.position.y, 0); v.beam.visible = true;
    const L = v.mix.look(); let sc = 0.015; for (const k in v.mix.liq) if (SUBS[k]?.colloid) sc = Math.max(sc, 0.55);
    if (v.mix.cloud > 0.2) sc = Math.max(sc, 0.32); v.scatter = sc; void L;
    await this.tween(0.6, (k) => { v.beam.material.opacity = sc * k; });
    this.lab.emit('shine', { v: v.id, scatter: sc });
    await this.sleep(sec);
    await this.tween(0.4, (k) => { v.beam.material.opacity = sc * (1 - k); }); v.beam.visible = false;
    tc.setOn(false); this.busy--;
  }
  // hang a chromatography strip in a beaker so only the bottom edge dips in the water
  async hang(strip, v) {
    this.busy++;
    const lvl = v.levelWorld(); const m = v.mouthWorld(new THREE.Vector3());
    await this.moveTo(strip, new THREE.Vector3(m.x, lvl - 0.006, m.z), new THREE.Quaternion(), 1);
    strip.inV = v; this.lab.emit('hang', { obj: strip.id, v: v.id }); this.busy--;
  }
  async develop(strip, sec = 10, lapse = 60) { // the water climbs the paper (time-lapse)
    const l0 = this.app.chem.lapse; this.app.chem.lapse = lapse; this.app.lapseShown = lapse;
    await this.tween(sec, (k) => { strip.progress = Math.min(1, k); strip.draw(); });
    this.app.chem.lapse = l0; this.app.lapseShown = 0; this.lab.emit('developed', { obj: strip.id });
  }
  // a thin layer of oil floating on the liquid (keeps air out)
  oil(v) {
    const r = v.rInner(v.heightFor(v.ml)) - 0.0004; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.004, 32), new THREE.MeshStandardMaterial({ color: 0xe0b84a, roughness: 0.15, transparent: true, opacity: 0.75 }));
    m.position.y = v.heightFor(v.ml) + 0.002; m.renderOrder = 5; m.userData.noHit = true; v.g.add(m); v.oilMesh = m; return m;
  }
  cork(v) { const c = new THREE.Mesh(new THREE.CylinderGeometry(v.rimR * 1.08, v.rimR * 0.85, 0.016, 16), new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 })); c.position.y = v.rimY - 0.004; v.g.add(c); v.closed = true; return c; }
  pick(it) { return it; }

  // ---------------------------------------------------------- batch 3 (Class 6–8)
  place(it, x, z, o = {}) { return this.add(it, x, z, o); }
  // a funnel with filter paper on a stand, its stem inside the mouth of `dst`
  filterOver(dst, o = {}) {
    const m = dst.mouthWorld(new THREE.Vector3()); const tipY = m.y - 0.02;
    const st = this.add(A3.funnelStand(tipY + 0.075 - BENCH_Y), dst.g.position.x, dst.g.position.z + 0.0, { ry: o.ry ?? 0 });
    const f = this.add(A3.filterFunnel(), dst.g.position.x, dst.g.position.z, { y: tipY }); f.drainTo = dst; f.stand = st; return f;
  }
  async pourSlow(src, dst, ml, k = 0.35) { const k0 = src.pourK; src.pourK = k; await this.pour(src, dst, ml, { above: 0.02 }); src.pourK = k0; }
  // sweep a bar magnet slowly just above a mixture
  async sweepMagnet(mg, mix, passes = 3) {
    this.busy++; const c = mix.g.getWorldPosition(new THREE.Vector3()); const y = c.y + 0.016; mix.magnet = mg;
    await this.moveTo(mg, new THREE.Vector3(c.x - 0.03, y + 0.04, c.z), new THREE.Quaternion(), 0.8);
    for (let i = 0; i < passes; i++) {
      const z = c.z + (i - (passes - 1) / 2) * 0.016; const a = new THREE.Vector3(c.x - 0.035, y, z), b = new THREE.Vector3(c.x + 0.035, y, z);
      await this.moveTo(mg, i % 2 ? b : a, null, 0.5); await this.tween(1.4, (k) => { mg.g.position.lerpVectors(i % 2 ? b : a, i % 2 ? a : b, ease(k)); });
    }
    await this.tween(0.6, (k) => { mg.g.position.y = y + k * 0.05; }); this.lab.emit('magnet', { obj: mg.id, got: mg.stuck }); this.busy--;
  }
  async releaseFilings(mg, mix, sheet) {
    this.busy++; const c = sheet.g.getWorldPosition(new THREE.Vector3());
    await this.moveTo(mg, new THREE.Vector3(c.x, c.y + 0.03, c.z), null, 0.9); mix.release(sheet); await this.sleep(1.2);
    mix.magnet = null; await this.home(mg, 0.8); this.lab.emit('release', { obj: mg.id }); this.busy--;
  }
  ice(v, n = 4) { return A3.iceCubes(v, n); }
  // turn a tumbler upside down over a burning candle
  async cover(tum, cd) {
    this.busy++; const base = cd.g.getWorldPosition(new THREE.Vector3()); const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    tum.closed = true; tum.holdGas = true; tum.gas.CO2 = 0;
    await this.moveTo(tum, new THREE.Vector3(base.x, base.y + tum.rimY + 0.0025 + 0.16, base.z), q, 0.9);
    await this.tween(0.8, (k) => { tum.g.position.y = base.y + tum.rimY + 0.0025 + 0.16 * (1 - ease(k)); });
    cd.coveredBy = tum; this.lab.emit('cover', { obj: tum.id, over: cd.id }); this.busy--;
  }
  // lift the tumbler off and turn it the right way up quickly (the gas inside stays)
  async uncover(tum, cd, x, z) {
    this.busy++; if (cd) cd.coveredBy = null; const p = tum.g.position.clone(); await this.tween(0.5, (k) => { tum.g.position.y = p.y + 0.1 * ease(k); });
    await this.moveTo(tum, new THREE.Vector3(x, BENCH_Y + 0.0008, z), new THREE.Quaternion(), 0.9); tum.home = { p: tum.g.position.clone(), q: tum.g.quaternion.clone() }; tum.closed = false; this.busy--;
  }
  // hold an item (with tongs) so that its test point sits at a point of a flame
  async holdIn(it, lamp, pointLocal, sec = 4, o = {}) {
    this.busy++; const hp = lamp.g.localToWorld((pointLocal || lamp.heatPoint).clone()); const q = o.q || new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, o.tilt ?? 1.2));
    const tl = (it.tipLocal || it.centerLocal || it.cupLocal || new THREE.Vector3()).clone().applyQuaternion(q);
    await this.moveTo(it, hp.clone().sub(tl), q, 1); const l0 = this.app.chem.lapse; if (o.lapse) this.app.chem.lapse = o.lapse;
    await this.tween(sec, () => {}); this.app.chem.lapse = l0;
    if (!o.stay) await this.home(it, 0.9); this.busy--;
  }
  // lower the deflagrating spoon into a gas jar (its disc closes the mouth)
  async intoJar(sp, jar) {
    this.busy++; const m = jar.mouthWorld(new THREE.Vector3());
    await this.moveTo(sp, new THREE.Vector3(m.x, m.y + 0.06, m.z), new THREE.Quaternion(), 0.8);
    await this.tween(0.8, (k) => { sp.g.position.y = m.y + 0.06 + (-(sp.discY) + 0.002 - 0.06) * ease(k); });
    sp.inJar = jar; jar.closed = true; jar.holdGas = true; this.lab.emit('into_jar', { obj: sp.id, v: jar.id }); this.busy--;
  }
  async outOfJar(sp, jar) { this.busy++; const p = sp.g.position.clone(); await this.tween(0.8, (k) => { sp.g.position.y = p.y + 0.2 * ease(k); }); sp.inJar = null; sp.burning = false; jar.setLid(true); await this.home(sp, 0.8); this.busy--; }
  async lid(jar, on) { jar.setLid(on); this.app.audio && this.app.audio.clink && this.app.audio.clink(); this.lab.emit('lid', { v: jar.id, on }); }
  // one drop of a sample on a piece of litmus paper on the tile
  async dropOn(bot, tile, col, kind) {
    this.busy++; const d = bot.dropper; const dWorld = new THREE.Vector3(); d.getWorldPosition(dWorld);
    const drop = d.clone(); this.app.scene.add(drop); this.extras.push(drop); drop.position.copy(dWorld); d.visible = false;
    const tgt = tile.pieceWorld(col, kind); const above = tgt.clone().add(new THREE.Vector3(0, 0.07, 0)); const p0 = drop.position.clone();
    await this.tween(0.7, (k) => { const e = ease(k); drop.position.lerpVectors(p0, above, e); drop.position.y += Math.sin(Math.PI * e) * 0.05; });
    await new Promise((res) => this.fx.drop(above.clone().add(new THREE.Vector3(0, -0.01, 0)), tgt.clone().add(new THREE.Vector3(0, 0.001, 0)), bot.color.clone(), res));
    const pH = bot.mix.pH(); const pc = tile.pieces.find((q) => q.col === col && q.kind === kind); const c = stripColor(kind, pH); const wet = c.clone().multiplyScalar(0.85);
    pc.spot = '#' + wet.getHexString(); pc.draw(); this.lab.emit('spot', { tile: tile.id, col, kind, pH });
    await this.tween(0.7, (k) => { const e = ease(k); drop.position.lerpVectors(above, dWorld, e); });
    this.app.scene.remove(drop); d.visible = true; this.busy--;
  }
  // rub a sample on sandpaper: metals show their shine
  async rub(sm, sp) {
    this.busy++; const c = sp.g.getWorldPosition(new THREE.Vector3()); const p = new THREE.Vector3(c.x, c.y + 0.004, c.z);
    await this.moveTo(sm, p, null, 0.8); await this.tween(1.6, (k) => { sm.g.position.x = p.x + Math.sin(k * 30) * 0.012; });
    if (sm.metal) { sm.mat.color.setHex(sm.S.shine); sm.mat.metalness = 0.95; sm.mat.roughness = 0.18; }
    this.lab.emit('rub', { obj: sm.id, metal: sm.metal }); await this.home(sm, 0.8); this.busy--;
  }
  // beat a sample on the iron block: metals flatten into a sheet, non-metals break into powder
  async hammerHit(hm, sm, blk) {
    this.busy++; const top = blk.g.localToWorld(new THREE.Vector3(0, blk.top + 0.001, 0));
    await this.moveTo(sm, top.clone(), null, 0.8);
    const hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.2)); const up = top.clone().add(new THREE.Vector3(0.17, 0.06, 0));
    await this.moveTo(hm, up, hq, 0.8);
    for (let i = 0; i < 3; i++) {
      const down = top.clone().add(new THREE.Vector3(0.155, -0.012, 0)); const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.55));
      await this.tween(0.22, (k) => { hm.g.position.lerpVectors(up, down, k * k); hm.g.quaternion.slerpQuaternions(hq, q2, k * k); });
      const au = this.app.audio; if (au) { if (sm.metal) { au.tone(1800, 0.35, 0.12, 'triangle'); au.tone(3400, 0.25, 0.05); } else au.burst(0.12, 400, 0.6, 'lowpass'); }
      if (sm.metal) { const t = sm.mesh || sm.g; t.scale.y *= 0.55; t.scale.x *= 1.18; t.scale.z *= 1.18; }
      else if (i === 0) { const mm = sm.mesh; mm.visible = false; for (let j = 0; j < 14; j++) { const fr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.0012 + Math.random() * 0.0022, 0), sm.mat); const a = Math.random() * 6.28, r = Math.random() * 0.012; fr.position.set(Math.cos(a) * r, 0.0012, Math.sin(a) * r); fr.rotation.set(Math.random() * 3, Math.random() * 3, 0); sm.g.add(fr); } const dust = new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), new THREE.MeshStandardMaterial({ color: sm.S.c, roughness: 1, transparent: true, opacity: 0.85 })); dust.rotation.x = -Math.PI / 2; dust.position.y = 0.0004; sm.g.add(dust); }
      await this.tween(0.25, (k) => { hm.g.position.lerpVectors(down, up, k); hm.g.quaternion.slerpQuaternions(q2, hq, k); });
    }
    this.lab.emit('hammer', { obj: sm.id, metal: sm.metal }); await this.home(hm, 0.8); this.busy--;
  }
  // drop a sample from a little height: metals ring, non-metals give a dull thud
  async dropSound(sm) {
    this.busy++; const p = sm.g.position.clone(); await this.moveTo(sm, p.clone().add(new THREE.Vector3(0, 0.22, 0)), null, 0.7);
    await this.tween(0.21, (k) => { sm.g.position.y = p.y + 0.22 * (1 - k * k); });
    const au = this.app.audio; if (au) { if (sm.metal) { au.tone(2400, 1.4, 0.14, 'sine'); au.tone(3650, 1.0, 0.08, 'sine'); au.tone(5200, 0.6, 0.04, 'sine'); } else au.burst(0.15, 300, 0.7, 'lowpass'); }
    await this.tween(0.15, (k) => { sm.g.position.y = p.y + Math.sin(Math.PI * k) * (sm.metal ? 0.012 : 0.003); });
    this.lab.emit('drop_sound', { obj: sm.id, metal: sm.metal }); this.busy--;
  }
  // stand spoons in a beaker of hot water
  async spoonsInto(spoons, v) {
    this.busy++; const m = v.mouthWorld(new THREE.Vector3());
    for (const [i, sp] of spoons.entries()) { const off = (i - (spoons.length - 1) / 2) * 0.02; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, off > 0 ? -0.22 : 0.22)); await this.moveTo(sp, new THREE.Vector3(m.x + off * 0.6, v.g.position.y + v.inner[0].y + 0.004, m.z), q, 0.8); sp.inV = v; sp.home = { p: sp.g.position.clone(), q: sp.g.quaternion.clone() }; }
    this.lab.emit('spoons', { v: v.id }); this.busy--;
  }
  // one spoonful (spatula) of a solid from a stock heap into a vessel
  async spoonful(stock, v, o = {}) {
    this.busy++; const chem = stock.chem; const S = SOLIDS[chem];
    const piece = A.heap(S.color, { tex: S.tex, r: 0.006, h: 0.004, loose: 0 }); asChem(piece, chem, 1); piece.name = S.n;
    const c = stock.g.getWorldPosition(new THREE.Vector3()); this.add(piece, c.x, c.z, { y: c.y + 0.004 });
    stock.amount = Math.max(0.2, (stock.amount ?? 1) - 0.12); stock.g.scale.setScalar(Math.cbrt(stock.amount));
    await this.addSolid(piece, v); v.spoons = (v.spoons || 0) + 1; this.lab.emit('spoon', { v: v.id, n: v.spoons, chem }); this.busy--; return piece;
  }
  lamp3(x, z) { return this.add(A3.sunLamp(), x, z); }
  async lampOn(l, on) { l.setOn(on); this.app.audio && this.app.audio.clink && this.app.audio.clink(); this.lab.emit(on ? 'lamp_on' : 'lamp_off', { obj: l.id }); }
  // hold a vessel (paper cup) just above a candle flame
  async holdOver(v, cd, sec = 6, o = {}) {
    this.busy++; const hp = cd.g.localToWorld(cd.heatPoint.clone()); const p = hp.clone().sub(new THREE.Vector3(0, v.inner[0].y - 0.004, 0));
    await this.moveTo(v, p, new THREE.Quaternion(), 1); const l0 = this.app.chem.lapse; if (o.lapse) { this.app.chem.lapse = o.lapse; this.app.lapseShown = o.lapse; }
    await this.tween(sec, () => {}); this.app.chem.lapse = l0; this.app.lapseShown = 0;
    if (!v.burnt) await this.home(v, 0.9); this.lab.emit('held_over', { v: v.id }); this.busy--;
  }
  // stand a test tube in a beaker (a bath of hot water or a freezing mixture)
  async intoBath(t, b) {
    this.busy++; const m = b.g.position.clone(); const y = BENCH_Y + 0.0008 + b.inner[0].y + 0.004;
    await this.moveTo(t, new THREE.Vector3(m.x, y + 0.12, m.z), new THREE.Quaternion(), 0.8); await this.tween(0.7, (k) => { t.g.position.y = y + 0.12 * (1 - ease(k)); });
    t.bath = b; t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; this.lab.emit('bath', { v: t.id, in: b.id }); this.busy--;
  }
  async outOfBath(t, x, z) { this.busy++; t.bath = null; await this.moveTo(t, new THREE.Vector3(x, t.g.position.y + 0.14, z), null, 0.8); t.home = null; this.busy--; }
  // add drops one by one until the test passes (e.g. the colour changes); returns how many drops it took
  async dropsUntil(bot, dst, test, max = 40) { // the dropper stays over the tube; one drop, a swirl, look, next drop
    this.busy++; const d = bot.dropper; const dWorld = new THREE.Vector3(); d.getWorldPosition(dWorld);
    const drop = d.clone(); this.app.scene.add(drop); this.extras.push(drop); drop.position.copy(dWorld); d.visible = false;
    const m = dst.mouthWorld(new THREE.Vector3()); const above = m.clone().add(new THREE.Vector3(0, 0.08, 0)); const p0 = drop.position.clone();
    await this.tween(0.8, (k) => { const e = ease(k); drop.position.lerpVectors(p0, above, e); drop.position.y += Math.sin(Math.PI * e) * 0.06; });
    let n = 0;
    while (n < max && !test(dst)) {
      const from = drop.position.clone().add(new THREE.Vector3(0, -0.062, 0)); const to = new THREE.Vector3(m.x, dst.levelWorld() + 0.001, m.z);
      await new Promise((res) => this.fx.drop(from, to, bot.color.clone(), () => { const p = bot.mix.take(0.05); dst.mix.put(p, 0.05); dst.ml = dst.mix.ml(); this.lab.emit('drop', { from: bot.id, to: dst.id }); res(); }));
      n++; dst.wobV && dst.wobV.set(0.02, 0.01); await this.sleep(0.12);
    }
    await this.tween(0.8, (k) => { const e = ease(k); drop.position.lerpVectors(above, dWorld, e); });
    this.app.scene.remove(drop); d.visible = true; dst.dropCount = n; this.lab.emit('drops', { from: bot.id, to: dst.id, n }); this.busy--; return n;
  }
  // a label floating in the air with a thin line to a point (flame zones etc.)
  tag3D(text, at, off) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = 'rgba(14,20,28,0.85)'; x.beginPath(); x.roundRect(4, 8, 504, 80, 24); x.fill(); x.fillStyle = '#ffffff'; x.font = '600 40px "Noto Sans Devanagari", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 50, 490);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); sp.scale.set(0.1, 0.019, 1); sp.position.copy(at).add(off); sp.renderOrder = 30;
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([at, sp.position.clone().add(new THREE.Vector3(off.x > 0 ? -0.05 : 0.05, 0, 0))]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthTest: false })); ln.renderOrder = 30;
    this.app.scene.add(sp, ln); this.extras.push(sp, ln); return [sp, ln];
  }
  // swirl a vessel gently on the bench
  async swirl(v, sec = 1.6) { this.busy++; const p = v.g.position.clone(); v.shaking = true; await this.tween(sec, (k) => { v.g.position.x = p.x + Math.cos(k * 40) * 0.004; v.g.position.z = p.z + Math.sin(k * 40) * 0.004; }); v.shaking = false; v.g.position.copy(p); this.lab.emit('swirl', { v: v.id }); this.busy--; }
}
void tmp;
