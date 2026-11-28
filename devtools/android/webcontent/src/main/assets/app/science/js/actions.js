// "Kit": builds the apparatus for an experiment and performs each lab action with a smooth animation —
// the same physics runs whether the student does it by hand in VR or presses "Do it".
import * as THREE from 'three';
import * as A from './apparatus.js';
import * as A3 from './apparatus3.js';
import * as A4 from './apparatus4.js';
import * as A5 from './apparatus5.js';
import * as A6 from './apparatus6.js';
import { asChem } from './lab.js';
import { SUBS, SOLIDS, stripColor } from './chem.js';
import { BENCH_Y } from './room.js';

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const tmp = new THREE.Vector3();

export class Kit {
  constructor(app) { this.app = app; this.lab = app.lab; this.fx = app.fx; this.tweens = []; this.speed = 1; this.busy = 0; this.A = A; this.A3 = A3; this.A4 = A4; this.A5 = A5; this.A6 = A6; this.THREE = THREE; this.extras = []; }
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
  label(sub) { const s = SUBS[sub]; return { formula: s.f.length > 12 ? s.f.split(' ')[0] : s.f, name: s.n.en, hazard: ['hcl', 'h2so4', 'naoh', 'pbno3', 'agno3', 'bacl2', 'h2so4c', 'naoh20', 'glacial', 'kmno4alk'].includes(sub), band: { hcl: '#b03a2e', h2so4: '#b03a2e', naoh: '#2f6b3a', cuso4: '#2c5d8a', limewater: '#5a6a7a' }[sub] || '#4a5a6a' }; }
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
    else if (chem === 'cuso4x' || chem === 'feso4x' || chem === 'cuso4d' || chem === 'cuso4i') it = A.crystals(S.color, { n: 12, tex });
    else if (chem === 'kmno4') it = A.crystals(S.color, { n: 3, tex });
    else if (chem === 'baoh2') it = A.crystals(S.color, { n: 12, tex });
    else if (chem === 'naohs') it = A.granules(S.color, { n: 6, metal: 0, rough: 0.35, tex, shape: 'pellet' });
    else if (chem === 'na') { it = A.granules(S.color, { n: 1, metal: 0.55, rough: 0.35 }); it.radius = 0.004; }
    else if (chem === 'ca') it = A.granules(S.color, { n: 4, metal: 0.3, rough: 0.7 });
    else if (['sugar', 'salt', 'na2co3', 'nahco3', 'pbno3s', 'nh4cl', 'chalk', 'kis', 'bacl2s', 'femix', 'fes', 'filings', 'spow', 'agcl', 'cupow', 'cuo'].includes(chem)) it = A.heap(S.color, { tex }); // powders: a small heap with the real grain
    else if (chem === 'sand') it = A.heap(S.color, { tex, loose: 16 });
    else if (chem === 'cao') it = A.granules(S.color, { n: 5, metal: 0, rough: 0.95, tex });
    else if (chem === 'naph') it = A.granules(S.color, { n: 3, metal: 0, rough: 0.85, tex, shape: 'pellet' });
    else if (chem === 'camphor') it = A.granules(S.color, { n: 4, metal: 0, rough: 0.6, tex, shape: 'chip' });
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
    v.stickerText = text;
    const tex = A.labelSticker ? A.labelSticker(text) : null; if (!tex) return;
    const r = v.rInner ? v.rInner(Math.min(v.rimY * 0.55, 0.05)) + (v.wall ?? 0.0012) + 0.0004 : 0.02;
    const w = Math.min(0.03, r * 1.3), h = w * 0.62;
    const a0 = v.grad ? Math.max(-w / r / 2, v.grad.a1 + 0.08) : -w / r / 2; // keep the mL scale on the glass visible: the sticker goes beside it
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true, a0, w / r), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true }));
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
    v._dipN = (v._dipN || 0) + 1; const rest = v.g.position.clone().add(new THREE.Vector3((v._dipN - 1) * 0.016, 0, 0.09)); rest.y = BENCH_Y + 0.001; // a second strip from the same vessel lies beside the first
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
  async dropsUntil(bot, dst, test, max = 40, gap = 0.12) { // the dropper stays over the tube; one drop, a swirl, look, next drop
    this.busy++; const d = bot.dropper; const dWorld = new THREE.Vector3(); d.getWorldPosition(dWorld);
    const drop = d.clone(); this.app.scene.add(drop); this.extras.push(drop); drop.position.copy(dWorld); d.visible = false;
    const m = dst.mouthWorld(new THREE.Vector3()); const above = m.clone().add(new THREE.Vector3(0, 0.08, 0)); const p0 = drop.position.clone();
    await this.tween(0.8, (k) => { const e = ease(k); drop.position.lerpVectors(p0, above, e); drop.position.y += Math.sin(Math.PI * e) * 0.06; });
    let n = 0;
    while (n < max && !test(dst)) {
      const from = drop.position.clone().add(new THREE.Vector3(0, -0.062, 0)); const to = new THREE.Vector3(m.x, dst.levelWorld() + 0.001, m.z);
      await new Promise((res) => this.fx.drop(from, to, bot.color.clone(), () => { const p = bot.mix.take(0.05); dst.mix.put(p, 0.05); dst.ml = dst.mix.ml(); this.lab.emit('drop', { from: bot.id, to: dst.id }); res(); }));
      n++; dst.wobV && dst.wobV.set(0.02, 0.01); await this.sleep(gap);
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

  // ---------------------------------------------------------- batch 4 (electricity)
  // join parts with wires; links: [[item, terminal], [item, terminal], colour]
  circuit(spec, links = []) {
    const c = new A4.Circuit(spec); this.lab.add(c, 0, -0.6); this.lab.items.splice(this.lab.items.indexOf(c), 1); this.lab.items.push(c); // updated after the parts have moved
    for (const [[ia, ka], [ib, kb], col] of links) { const w = new A4.Wire(this.app.scene, col, ia.terms[ka], ib.terms[kb]); c.wires.push(w); this.extras.push(w.mesh, ...w.clips); }
    return c;
  }
  lay(it, x, z, ry = 0) { const a = this.add(it, x, z); a.g.rotation.set(-Math.PI / 2, 0, ry); a.g.position.y = BENCH_Y + (it.layH ?? (it.radius ?? 0.002) * 0.4) + 0.0012; a.home = { p: a.g.position.clone(), q: a.g.quaternion.clone() }; return a; }
  async keyOn(k, on) { k.setOn(on); this.app.audio && this.app.audio.tone && this.app.audio.tone(on ? 1500 : 900, 0.04, 0.06, 'square'); this.lab.emit('key', { v: k.id, on }); await this.sleep(0.5); }
  // touch the two free ends of the tester together
  async touchEnds(c, sec = 1.8) {
    this.busy++; const [A, B] = c.ends.map((e) => e.item); const mid = A.home.p.clone().lerp(B.home.p, 0.5); mid.y = BENCH_Y + 0.07; mid.z += 0.03;
    const qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.7)), qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.7));
    await Promise.all([this.moveTo(A, mid.clone().add(new THREE.Vector3(-0.0012, 0, 0)), qa, 0.9), this.moveTo(B, mid.clone().add(new THREE.Vector3(0.0012, 0, 0)), qb, 0.9)]);
    await this.sleep(sec); await Promise.all([this.home(A, 0.8), this.home(B, 0.8)]); this.busy--;
  }
  // dip the two ends into a liquid, about 1 cm apart, not touching
  async dipEnds(c, v, o = {}) {
    this.busy++; const [A, B] = c.ends.map((e) => e.item); const m = v.mouthWorld(new THREE.Vector3());
    const bot = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y, 0)).y; const y = Math.max(bot + 0.003, v.levelWorld() - (o.depth ?? 0.009));
    const dx = Math.min(0.006, v.rInner(Math.max(v.inner[0].y + 0.002, y - v.g.position.y)) * 0.5); const tl = Math.min(0.25, Math.max(0, (v.rimR - dx - 0.002) / 0.07)); // narrow tube: hold the ends nearly upright
    const qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, tl)), qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -tl));
    const pa = new THREE.Vector3(m.x - dx, y, m.z), pb = new THREE.Vector3(m.x + dx, y, m.z);
    await Promise.all([this.moveTo(A, pa.clone().setY(m.y + 0.05), qa, 0.9), this.moveTo(B, pb.clone().setY(m.y + 0.05), qb, 0.9)]);
    const a0 = A.g.position.clone(), b0 = B.g.position.clone(); await this.tween(0.6, (k) => { A.g.position.lerpVectors(a0, pa, ease(k)); B.g.position.lerpVectors(b0, pb, ease(k)); });
    await this.sleep(o.sec ?? 2.6); if (o.stay) { this.busy--; return; }
    await this.tween(0.5, (k) => { A.g.position.lerpVectors(pa, a0, ease(k)); B.g.position.lerpVectors(pb, b0, ease(k)); });
    await Promise.all([this.home(A, 0.8), this.home(B, 0.8)]); this.busy--;
  }
  // press the two ends on a solid, a little apart
  async touchSample(c, s, o = {}) {
    this.busy++; const [A, B] = c.ends.map((e) => e.item); const cc = s.touchAt ? s.g.localToWorld(s.touchAt.clone()) : s.g.getWorldPosition(new THREE.Vector3()); const top = cc.y + (s.height ?? 0.008) + 0.0004; const dx = s.touchDx ?? Math.max(0.0035, Math.min(0.006, (s.radius ?? 0.01) * 0.5));
    const qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.35)), qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.35));
    const pa = new THREE.Vector3(cc.x - dx, top, cc.z), pb = new THREE.Vector3(cc.x + dx, top, cc.z);
    await Promise.all([this.moveTo(A, pa.clone().setY(top + 0.04), qa, 0.9), this.moveTo(B, pb.clone().setY(top + 0.04), qb, 0.9)]);
    const a0 = A.g.position.clone(), b0 = B.g.position.clone(); await this.tween(0.5, (k) => { A.g.position.lerpVectors(a0, pa, ease(k)); B.g.position.lerpVectors(b0, pb, ease(k)); });
    await this.sleep(o.sec ?? 2.2);
    await this.tween(0.4, (k) => { A.g.position.lerpVectors(pa, a0, ease(k)); B.g.position.lerpVectors(pb, b0, ease(k)); });
    await Promise.all([this.home(A, 0.8), this.home(B, 0.8)]); this.busy--;
  }
  // the card with two carbon electrodes: rest it on a beaker (rods in the liquid) or press it on a solid
  async pairInto(p, v, o = {}) {
    this.busy++; const m = v.mouthWorld(new THREE.Vector3()); const to = new THREE.Vector3(m.x, m.y - p.cardY - 0.001, m.z);
    await this.moveTo(p, to.clone().setY(to.y + 0.07), new THREE.Quaternion(), 0.9); const p0 = p.g.position.clone(); await this.tween(0.6, (k) => p.g.position.lerpVectors(p0, to, ease(k)));
    await this.sleep(o.sec ?? 2.4); if (o.stay) { this.busy--; return; } await this.tween(0.5, (k) => p.g.position.lerpVectors(to, p0, ease(k))); await this.home(p, 0.8); this.busy--;
  }
  async pairOn(p, s, o = {}) {
    this.busy++; const c = s.g.getWorldPosition(new THREE.Vector3()); const to = new THREE.Vector3(c.x, c.y + (s.height ?? 0.006) + 0.0003, c.z);
    await this.moveTo(p, to.clone().setY(to.y + 0.06), new THREE.Quaternion(), 0.9); const p0 = p.g.position.clone(); await this.tween(0.5, (k) => p.g.position.lerpVectors(p0, to, ease(k)));
    await this.sleep(o.sec ?? 2.2); await this.tween(0.4, (k) => p.g.position.lerpVectors(to, p0, ease(k))); await this.home(p, 0.8); this.busy--;
  }
  // stand an item inside a vessel (the 9 V battery in the beaker)
  async standIn(it, v) { this.busy++; const b = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y + 0.0005, 0)); await this.moveTo(it, b.clone().setY(b.y + 0.12), new THREE.Quaternion(), 0.9); await this.tween(0.8, (k) => { it.g.position.y = b.y + 0.12 * (1 - ease(k)); }); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.lab.emit('stand_in', { v: v.id, obj: it.id }); this.busy--; }
  // fill a test tube with the water of a vessel, close it with the thumb, turn it upside down and stand it (mouth under water) over a point
  async fillInvert(t, v, over, o = {}) {
    this.busy++; const V = (x, y, z) => new THREE.Vector3(x, y, z); const m = v.mouthWorld(V(0, 0, 0)); const lvl = v.levelWorld(); const Z = V(0, 0, 1);
    const qUp = new THREE.Quaternion().setFromAxisAngle(Z, Math.PI), qDip = new THREE.Quaternion().setFromAxisAngle(Z, Math.PI + (o.tilt ?? 1.0));
    const org = (c, q) => c.clone().sub(V(0, 1, 0).applyQuaternion(q).multiplyScalar(t.h / 2)); // tube origin (its mouth) from its centre
    const c0 = V(m.x + (o.dx ?? 0), m.y + t.h * 0.5 + 0.04, m.z + (o.dz ?? 0.018)); const c1 = V(m.x + (o.dx ?? 0), lvl - (o.depth ?? 0.02), m.z + (o.dz ?? 0.018));
    await this.moveTo(t, org(c0, qUp), qUp, 0.9); // mouth up above the water
    await this.moveTo(t, org(c1, qDip), qDip, 1.0); t.fill(); this.app.audio && this.app.audio.pour && this.app.audio.pour(0.3); await this.sleep(0.6); // tilted under the water: it fills
    await this.moveTo(t, org(c0, qUp), qUp, 0.8); // out again, the thumb on its mouth
    const target = typeof over === 'function' ? over() : over.clone(); const hi = target.clone().setY(Math.max(target.y, m.y) + 0.05);
    await this.moveTo(t, hi, new THREE.Quaternion(), 0.8); // turned over: mouth down
    const h0 = t.g.position.clone(); await this.tween(0.9, (k) => t.g.position.lerpVectors(h0, target, ease(k)));
    t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; this.lab.emit('tube_over', { v: t.id }); this.busy--;
  }
  // lift a gas tube out (mouth down) and bring it over a burning candle
  async gasTest(t, cd, o = {}) {
    this.busy++; t.lifted = true; const p0 = t.g.position.clone(); const rim = o.rimY ?? p0.y + 0.06;
    const lift = Math.max(0.03, rim - p0.y + 0.015); await this.tween(0.9, (k) => { t.g.position.y = p0.y + lift * ease(k); }); await this.sleep(0.5);
    const ft = cd.g.localToWorld(new THREE.Vector3(0, (cd.flameTop ?? cd.height + 0.046) - 0.006, 0));
    await this.moveTo(t, ft.clone().setY(ft.y + 0.05), new THREE.Quaternion(), 1); const a = t.g.position.clone(); await this.tween(0.6, (k) => t.g.position.lerpVectors(a, ft, ease(k)));
    const g = t.mainGas(); const m = t.mouthWorld(new THREE.Vector3());
    if (g === 'H2' && (t.gas.H2 || 0) > 0.2) { this.fx.flashAt(m, 3, 0.22, 0xffd27a, 0.09); this.app.audio && this.app.audio.pop && this.app.audio.pop(); t.gas = {}; cd.flick = 0.6; this.lab.emit('pop', { v: t.id }); }
    else if (g === 'O2' && (t.gas.O2 || 0) > 0.2) { cd.boost = 3; this.lab.emit('brighter', { v: t.id }); }
    await this.sleep(o.sec ?? 2.2); const b = t.g.position.clone(); await this.tween(0.5, (k) => { t.g.position.y = b.y + 0.05 * ease(k); });
    if (o.rest) await this.moveTo(t, o.rest, t.g.quaternion.clone(), 0.9); this.busy--;
  }
  // flame test: take a little salt on the spatula, hold it in the flame
  async loadSpat(sp, stock) {
    this.busy++; const c = stock.g.getWorldPosition(new THREE.Vector3()); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.9)); const tl = sp.tipLocal.clone().applyQuaternion(q);
    const to = c.clone().add(new THREE.Vector3(0, (stock.height ?? 0.006) * 0.6, 0)).sub(tl); await this.moveTo(sp, to.clone().setY(to.y + 0.04), q, 0.8); const p0 = sp.g.position.clone();
    await this.tween(0.4, (k) => sp.g.position.lerpVectors(p0, to, ease(k))); sp.load(stock.chem); stock.amount = Math.max(0.3, (stock.amount ?? 1) - 0.08); stock.g.scale.setScalar(Math.cbrt(stock.amount));
    await this.tween(0.4, (k) => sp.g.position.lerpVectors(to, p0, ease(k))); this.busy--;
  }
  async flameTest(sp, burner, stock, sec = 5) { await this.loadSpat(sp, stock); await this.holdIn(sp, burner, burner.heatPoint.clone().add(new THREE.Vector3(0, -0.022, 0)), sec, { tilt: 0.9 }); }
  async cleanSpat(sp) { this.busy++; const p = sp.g.position.clone(); await this.up(sp, 0.03, 0.3); sp.clean(); await this.home(sp, 0.5); void p; this.busy--; }
  // a spoonful of a solid into a vessel, then swirl so it can dissolve
  async dissolveIn(stock, v, o = {}) { await this.spoonful(stock, v); v.stirT = o.stir ?? 4; await this.swirl(v, 1.2); }
  // put a lid on a vessel / hang a plate through a slit of the lid
  async lidOn(lid, v) { this.busy++; const m = v.mouthWorld(new THREE.Vector3()); await this.moveTo(lid, m.clone().setY(m.y + 0.0004), new THREE.Quaternion(), 0.9); lid.home = { p: lid.g.position.clone(), q: lid.g.quaternion.clone() }; this.busy--; }
  async hangPlate(p, v, lid, side) {
    this.busy++; const m = v.mouthWorld(new THREE.Vector3()); const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    const to = new THREE.Vector3(m.x + side * lid.slitX, m.y + 0.006 - p.height, m.z); await this.moveTo(p, to.clone().setY(to.y + 0.1), q, 0.9); const p0 = p.g.position.clone();
    await this.tween(0.8, (k) => p.g.position.lerpVectors(p0, to, ease(k))); p.home = { p: p.g.position.clone(), q: p.g.quaternion.clone() }; this.lab.emit('hang', { obj: p.id, v: v.id }); this.busy--;
  }
  async liftOut(it, to, flat = true) { this.busy++; const p0 = it.g.position.clone(); await this.tween(0.8, (k) => { it.g.position.y = p0.y + 0.1 * ease(k); }); await this.moveTo(it, to, flat ? new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)) : null, 0.9); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.busy--; }
  // pour everything out into a waste beaker and rinse with a little water
  async rinse(v, waste) { await this.pour(v, waste, v.ml + 1); this.lab.fill(v, 'water', 12); await this.swirl(v, 0.8); await this.pour(v, waste, v.ml + 1); for (const k in v.mix.liq) delete v.mix.liq[k]; v.ml = 0; }

  // ---------------------------------------------------------- batch 5 (Class 9)
  // put something on the pan of a balance / take it off
  async onBalance(it, bal, dx = 0, dz = 0) {
    this.busy++; const top = bal.g.localToWorld(new THREE.Vector3(dx, bal.panTop + 0.0005, -0.008 + dz)); await this.moveTo(it, top.clone().setY(top.y - (it.base ?? 0)), new THREE.Quaternion(), 0.9);
    it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; if (!bal.on.includes(it)) bal.on.push(it); bal.settle = 0.8; this.lab.emit('weigh', { v: it.id, g: bal.reading() }); this.busy--;
  }
  async offBalance(it, bal, x, z) { this.busy++; bal.on.splice(bal.on.indexOf(it), 1); bal.settle = 0.5; await this.moveTo(it, new THREE.Vector3(x, BENCH_Y + 0.0008 - (it.base ?? 0), z), new THREE.Quaternion(), 0.9); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.busy--; }
  async tareBal(bal) { bal.tare(); this.app.audio && this.app.audio.tone && this.app.audio.tone(2000, 0.06, 0.05, 'square'); this.lab.emit('tare', { v: bal.id }); await this.sleep(0.8); }
  // stretch the balloon over the flask mouth (the powder stays in the balloon), then lift it so the powder falls in
  async balloonOn(bl, fl) {
    this.busy++; const m = fl.mouthWorld(new THREE.Vector3()); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 2.3));
    await this.moveTo(bl, m.clone().add(new THREE.Vector3(0, 0.002, 0)), q, 1); bl.onFlask = fl; fl.closed = true; fl.holdGas = true; fl.g.attach(bl.g);
    bl.update = () => { if (bl.onFlask) bl.setFill(Math.min(1.25, (bl.onFlask.gas.CO2 || 0) / 120)); };
    this.lab.emit('balloon', { v: fl.id }); this.busy--;
  }
  async tipBalloon(bl, fl) {
    this.busy++; const q0 = bl.g.quaternion.clone(); const q1 = new THREE.Quaternion(); await this.tween(0.8, (k) => bl.g.quaternion.slerpQuaternions(q0, q1, ease(k)));
    const S = SOLIDS.nahco3; const piece = A.heap(S.color, { tex: S.tex, r: 0.009, h: 0.005, loose: 4 }); asChem(piece, 'nahco3', 1); piece.gram = 2; piece.carrier = bl;
    const m = fl.mouthWorld(new THREE.Vector3()); this.add(piece, m.x, m.z, { y: m.y }); const b = fl.g.localToWorld(new THREE.Vector3(0, fl.inner[0].y + 0.004, 0)); const p0 = piece.g.position.clone();
    await this.tween(0.5, (k) => piece.g.position.lerpVectors(p0, b, k * k)); this.lab.putSolid(piece, fl); this.lab.emit('tip', { v: fl.id }); this.busy--;
  }
  // a funnel with a stopcock: stopper on/off, open/close the tap
  async stopper(sf, on) { sf.stopper2.visible = on; sf.closed = on; this.app.audio && this.app.audio.clink && this.app.audio.clink(); this.lab.emit('stopper', { v: sf.id, on }); await this.sleep(0.4); }
  async cock(sf, open) { sf.setOpen(open); this.app.audio && this.app.audio.tone && this.app.audio.tone(700, 0.05, 0.05, 'square'); this.lab.emit(open ? 'cock_open' : 'cock_close', { v: sf.id }); await this.sleep(0.3); }
  async drainUntil(sf, test, max = 40) { let t = 0; while (!test() && t < max) { await this.sleep(0.25); t += 0.25; } }
  // centrifuge: tubes in, lid closed, spin, stop, tubes out
  async loadTube(t, cf, i) {
    this.busy++; const sl = cf.slots[i]; const w = sl.getWorldPosition(new THREE.Vector3()); await this.moveTo(t, w.clone().add(new THREE.Vector3(0, 0.1, 0)), new THREE.Quaternion(), 0.9);
    await this.tween(0.6, (k) => { t.g.position.y = w.y + 0.1 - (0.1 + 0.048) * ease(k); }); sl.attach(t.g); t.inCf = cf; this.lab.emit('tube_in', { v: t.id }); this.busy--;
  }
  async spin(cf, sec = 6, lapse = 30) {
    this.busy++; cf.setLid(false); await this.sleep(0.6); cf.target = 60; this.app.lapseShown = lapse; const l0 = this.app.chem.lapse; this.app.chem.lapse = lapse;
    await this.tween(sec, (k, d) => { for (const t of this.lab.items) if (t.inCf === cf && t.setCream) { t.spun = (t.spun || 0) + d * lapse * (cf.spin / 60); t.setCream(Math.min(1, t.spun / 120)); } });
    cf.target = 0; await this.sleep(2.2); this.app.chem.lapse = l0; this.app.lapseShown = 0; cf.setLid(true); await this.sleep(0.6); this.lab.emit('spun', { v: cf.id }); this.busy--;
  }
  async unloadTube(t, x, z) { this.busy++; this.detach(t); t.inCf = null; await this.moveTo(t, new THREE.Vector3(x, BENCH_Y + 0.12, z), new THREE.Quaternion(), 1); t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; this.busy--; }
  // hold a piece of moist lead acetate paper at the mouth of a tube: it turns black with hydrogen sulphide
  async paperAt(strip, v, sec = 2) {
    this.busy++; const m = v.mouthWorld(new THREE.Vector3()); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.3));
    await this.moveTo(strip, m.clone().add(new THREE.Vector3(0.004, 0.012, 0)), q, 0.9); await this.tween(sec, () => { if ((v.gas.H2S || 0) > 0.003 && strip.wet) { strip.wet.material.color.lerp(new THREE.Color(0x1a1a1a), 0.05); strip.wet.visible = true; strip.black = true; } });
    this.lab.emit('paper', { v: v.id, black: !!strip.black }); await this.home(strip, 0.8); this.busy--;
  }
  // stir two powders together on a watch glass: one mixed heap
  async mixPowders(a, b, rod, mixChem) {
    this.busy++; const wg = a.dish; const c = wg.g.getWorldPosition(new THREE.Vector3()); await this.moveTo(b, c.clone().add(new THREE.Vector3(0.006, 0.012, 0)), null, 0.9);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.5)); await this.moveTo(rod, c.clone().add(new THREE.Vector3(0, 0.006, 0)), q, 0.8);
    const p = rod.g.position.clone(); await this.tween(2.4, (k) => { rod.g.position.set(p.x + Math.cos(k * 30) * 0.008, p.y, p.z + Math.sin(k * 30) * 0.008); });
    a.g.visible = false; b.g.visible = false; const S = SOLIDS[mixChem]; const m = A.heap(S.color, { tex: S.tex, r: 0.014, h: 0.008, loose: 12 }); asChem(m, mixChem, 1.6); m.name = S.n; this.add(m, c.x, c.z, { y: BENCH_Y + 0.008 }); m.dish = wg;
    a.chem = null; b.chem = null; await this.home(rod, 0.8); this.lab.emit('mixed', { obj: m.id }); this.busy--; return m;
  }
  // swirl a vessel gently on the bench
  async swirl(v, sec = 1.6) { this.busy++; const p = v.g.position.clone(); v.shaking = true; await this.tween(sec, (k) => { v.g.position.x = p.x + Math.cos(k * 40) * 0.004; v.g.position.z = p.z + Math.sin(k * 40) * 0.004; }); v.shaking = false; v.g.position.copy(p); this.lab.emit('swirl', { v: v.id }); this.busy--; }

  // ---------------------------------------------------------- batch 6 (Class 10)
  // a glass delivery tube along points, with a cork in the mouth of the vessel it starts from
  glassTube(pts, from) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.0028, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, depthWrite: false }));
    tube.renderOrder = 7; this.app.scene.add(tube); this.extras.push(tube); let cork = null;
    if (from) { cork = new THREE.Mesh(new THREE.CylinderGeometry(from.rimR * 1.05, from.rimR * 0.85, 0.016, 16), new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 })); cork.position.y = from.rimY - 0.004; from.g.add(cork); }
    return { tube, cork };
  }
  // a delivery tube that ends in the open air (the gas comes out at its end)
  outlet(from, end) {
    const a = from.mouthWorld(new THREE.Vector3()); const pts = [a.clone().add(new THREE.Vector3(0, -0.008, 0)), a.clone().add(new THREE.Vector3(0, 0.05, 0)), new THREE.Vector3((a.x + end.x) / 2, Math.max(a.y, end.y) + 0.06, (a.z + end.z) / 2), end.clone().add(new THREE.Vector3(0, 0.025, 0)), end.clone()];
    const P = this.glassTube(pts, from); from.outletWorld = () => end.clone(); from.closed = true; this.lab.emit('pipe', { from: from.id }); return P;
  }
  unpipe(from, P) { if (P.tube) this.app.scene.remove(P.tube); if (P.cork) P.cork.parent && P.cork.parent.remove(P.cork); from.pipeTo = null; }
  // clamp a tube on a stand with its bottom at a given height (so a lamp can be slid under it later)
  clampTube(v, x, z, bottomY, o = {}) {
    const len = 0.15; const st = this.add(A5.labStand(o.h ?? 0.3), x + 0.03, z + 0.05 - len); st.clamp(bottomY - BENCH_Y + (o.grip ?? 0.09), len);
    this.detach(v); v.g.position.set(x, bottomY - v.inner[0].y, z); v.g.rotation.set(0, 0, o.tilt ?? 0); v.home = { p: v.g.position.clone(), q: v.g.quaternion.clone() }; v.noGrab = true; v.stand = st; return st;
  }
  // slide a lit lamp / burner under a clamped vessel
  async under(lamp, v) {
    this.busy++; const b = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y, 0)); await this.moveTo(lamp, new THREE.Vector3(b.x, lamp.g.position.y, b.z), null, 0.9);
    lamp.home = { p: lamp.g.position.clone(), q: lamp.g.quaternion.clone() }; this.lab.emit('under', { obj: lamp.id, v: v.id }); this.busy--;
  }
  // bring a vessel or strip up towards the face and waft the smell: a label says what it smells of
  async sniff(it, text, sec = 2.6) {
    this.busy++; const cam = this.app.camera; const cp = cam.getWorldPosition(new THREE.Vector3()); const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion())); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
    const to = cp.clone().add(fwd.multiplyScalar(0.32)); to.y = Math.max(BENCH_Y + 0.14, cp.y - 0.18);
    const c0 = it.closed; it.closed = true; await this.moveTo(it, to, null, 1);
    const tg = this.tag3D(text, it.g.position.clone().add(new THREE.Vector3(0, (it.height ?? 0.08) * 0.9, 0)), new THREE.Vector3(0, 0.05, 0)); const p = it.g.position.clone();
    await this.tween(sec, (k) => { it.g.position.x = p.x + Math.sin(k * 16) * 0.006; }); for (const o of tg) this.app.scene.remove(o);
    this.lab.emit('sniff', { v: it.id }); await this.home(it, 0.9); it.closed = c0; this.busy--;
  }
  // hold a strip of paper at a point (a gas outlet, the mouth of a jar): its colour may change with the gas there
  async holdPaper(strip, at, sec, colorFn) {
    this.busy++; const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.25)); const p = (typeof at === 'function' ? at() : at).clone();
    await this.moveTo(strip, p.clone().add(new THREE.Vector3(0.002, -0.006, 0)), q, 0.9); strip.dipped = strip.dipped || 'gas'; let changed = false;
    await this.tween(sec, () => { const c = colorFn(); if (c) { strip.wet.material.color.lerp(c, 0.05); strip.wet.visible = true; changed = true; } });
    this.lab.emit('paper', { obj: strip.id, changed }); await this.home(strip, 0.8); this.busy--; return changed;
  }
  // make a paper strip moist (a drop of water): it looks darker
  moisten(strip) { strip.moist = true; strip.wet.visible = true; strip.wet.material.color.copy(strip.g.children[0].material.color).multiplyScalar(0.82); strip.name = { en: 'Moist ' + strip.name.en.toLowerCase(), hi: 'गीला ' + strip.name.hi, hg: 'Geela ' + strip.name.hg }; }
  // drops from a dropper bottle onto something lying on the bench (a cloth strip)
  async dropsOn(bot, it, n = 3) {
    this.busy++; const d = bot.dropper; const dWorld = new THREE.Vector3(); d.getWorldPosition(dWorld); const drop = d.clone(); this.app.scene.add(drop); this.extras.push(drop); drop.position.copy(dWorld); d.visible = false;
    const tgt = it.g.localToWorld((it.mouthLocal || new THREE.Vector3(0, 0.01, 0)).clone()); const above = tgt.clone().add(new THREE.Vector3(0, 0.075, 0)); const p0 = drop.position.clone();
    await this.tween(0.7, (k) => { const e = ease(k); drop.position.lerpVectors(p0, above, e); drop.position.y += Math.sin(Math.PI * e) * 0.05; });
    for (let i = 0; i < n; i++) { await new Promise((res) => this.fx.drop(above.clone().add(new THREE.Vector3(0, -0.012, 0)), tgt.clone(), bot.color.clone(), res)); await this.sleep(0.15); }
    it.got = it.got || {}; it.got[bot.sub] = (it.got[bot.sub] || 0) + n; if (it.wet) it.wet.visible = true;
    await this.tween(0.7, (k) => drop.position.lerpVectors(above, dWorld, ease(k))); this.app.scene.remove(drop); d.visible = true; this.lab.emit('drops_on', { from: bot.id, obj: it.id }); this.busy--;
  }
  // rinse a cloth strip in a beaker of water and lay it back
  async rinseIn(it, v) {
    this.busy++; const m = v.mouthWorld(new THREE.Vector3()); const q = new THREE.Quaternion(); await this.moveTo(it, m.clone().add(new THREE.Vector3(0, 0.03, 0)), q, 0.9);
    const p0 = it.g.position.clone(); const lo = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y + 0.006, 0)); await this.tween(0.6, (k) => it.g.position.lerpVectors(p0, lo, ease(k)));
    await this.tween(1.2, (k) => { it.g.position.x = lo.x + Math.sin(k * 20) * 0.006; v.stirT = 0.3; }); await this.tween(0.6, (k) => it.g.position.lerpVectors(lo, p0, ease(k)));
    it.rinsed = true; this.lab.emit('rinse', { obj: it.id, v: v.id }); await this.home(it, 0.9); this.busy--;
  }
  // close / open the air hole of a Bunsen burner: closed gives a tall, wavy, yellow, sooty flame; open gives a short blue flame
  async airHole(bn, open) {
    if (!bn.lumF) { bn.lumF = A6.lumFlame(); bn.lumF.position.copy(bn.flame.position); bn.lumF.visible = false; bn.g.add(bn.lumF); const u0 = bn.update; bn.update = (dt, t) => { u0(dt, t); if (bn.lumF.visible) bn.lumF.userData.tick(t); }; bn.setLit = (on) => { bn.lit = on; bn.flame.visible = on && !bn.airClosed; bn.lumF.visible = on && !!bn.airClosed; }; }
    bn.airClosed = !open; bn.flameTop = bn.height + (open ? 0.08 : 0.15); bn.setLit(bn.lit); this.app.audio && this.app.audio.tone && this.app.audio.tone(open ? 900 : 600, 0.05, 0.05, 'square');
    this.lab.emit('air', { v: bn.id, open }); await this.sleep(0.6);
  }
  // light a small dish of fuel with a burning splint
  async ignite(dish, sp, lamp) {
    this.busy++; const lt = lamp.g.localToWorld(new THREE.Vector3(0, lamp.kind === 'bunsen' ? 0.15 : 0.1, 0)); const qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 1.2));
    await this.moveTo(sp, lt.clone().add(new THREE.Vector3(0.11, 0, 0)), qUp, 0.9); sp.setFlame(true); await this.sleep(0.4);
    const tgt = dish.g.localToWorld(new THREE.Vector3(0, 0.012, 0)); const tl = sp.tipLocal.clone().applyQuaternion(qUp); await this.moveTo(sp, tgt.clone().sub(tl).add(new THREE.Vector3(0, 0.004, 0)), qUp, 1);
    dish.setLit(true); this.app.audio && this.app.audio.whoosh && this.app.audio.whoosh(); await this.sleep(0.5); sp.setFlame(false); this.lab.emit('lit', { obj: dish.id }); await this.home(sp, 0.8); this.busy--;
  }
  // tap iron filings from a spatula into a flame: they burn as bright sparks
  async sprinkle(sp, stock, burner, spk, sec = 3) {
    await this.loadSpat(sp, stock); this.busy++; const hp = burner.g.localToWorld(burner.heatPoint.clone()); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.9)); const tl = sp.tipLocal.clone().applyQuaternion(q);
    await this.moveTo(sp, hp.clone().add(new THREE.Vector3(0.004, 0.055, 0)).sub(tl), q, 0.9); const p0 = sp.g.position.clone();
    await this.tween(sec, (k, d) => { sp.g.position.y = p0.y + Math.abs(Math.sin(k * 40)) * 0.004; if (Math.random() < d * 25) spk.burst(hp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.012, (Math.random() - 0.3) * 0.03, (Math.random() - 0.5) * 0.012)), 3); if (Math.random() < d * 4) this.app.audio && this.app.audio.crackle && this.app.audio.crackle(); });
    sp.clean(); this.lab.emit('sparks', { obj: sp.id }); await this.home(sp, 0.8); this.busy--;
  }
  // shake a test tube with the thumb on its mouth (nothing spills)
  async shakeThumb(v, sec = 2) { const c0 = v.closed; v.closed = true; await this.shake(v, sec); v.closed = c0; this.lab.emit('shake', { v: v.id }); }
  // hold the scale beside the tube (zero at the liquid surface) and read the height of the lather
  async measureFoam(rl, v, label) {
    this.busy++; const b = v.g.localToWorld(new THREE.Vector3(0, v.heightFor(v.ml), 0)); const to = new THREE.Vector3(b.x + v.rimR + 0.014, b.y - rl.zeroY, b.z + 0.006);
    await this.moveTo(rl, to, new THREE.Quaternion(), 0.9); const cm = (v.foam || 0) * 100; const top = b.clone().add(new THREE.Vector3(0, v.foam || 0, 0));
    const tg = this.tag3D(label(cm), top, new THREE.Vector3(-0.08, 0.03, 0)); await this.sleep(2.4); for (const o of tg) this.app.scene.remove(o);
    this.lab.emit('measure', { v: v.id, cm }); await this.home(rl, 0.8); this.busy--; return cm;
  }
  // put a black paper cover over a dish / take it off
  async coverOn(cv, v) { this.busy++; const m = v.g.getWorldPosition(new THREE.Vector3()); await this.moveTo(cv, new THREE.Vector3(m.x, BENCH_Y + 0.0008, m.z), new THREE.Quaternion(), 1); cv.home = { p: cv.g.position.clone(), q: cv.g.quaternion.clone() }; v.dark = true; this.lab.emit('cover', { obj: cv.id, over: v.id }); this.busy--; }
  async coverOff(cv, v, x, z) { this.busy++; v.dark = false; await this.moveTo(cv, new THREE.Vector3(x, BENCH_Y + 0.0008, z), new THREE.Quaternion(), 0.9); cv.home = { p: cv.g.position.clone(), q: cv.g.quaternion.clone() }; this.lab.emit('uncover', { obj: cv.id }); this.busy--; }
  // tilt a jar of carbon dioxide over a burning candle: the heavy gas flows down onto the flame
  async pourGas(jar, cd) {
    this.busy++; const top = cd.g.localToWorld(new THREE.Vector3(0, (cd.flameTop ?? 0.1) + 0.02, 0)); const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 1.85);
    const mouthL = new THREE.Vector3(0, jar.rimY, 0).applyQuaternion(q); const c0 = jar.closed; jar.closed = true;
    await this.moveTo(jar, top.clone().add(new THREE.Vector3(0.012, 0.02, 0)).sub(mouthL), q, 1.2); const co2 = jar.gas.CO2 || 0;
    await this.tween(2.6, (k, d) => { if (co2 > 1 && cd.lit) cd.o2 = Math.max(0.3, cd.o2 - d * 0.45); }); jar.gas.CO2 = co2 * 0.2;
    this.lab.emit('pour_gas', { v: jar.id, over: cd.id }); await this.home(jar, 1); jar.closed = c0; this.busy--;
  }
  // lift the set soap out of the beaker as a cake
  takeSoap(v, x, z) { v.setCurd && v.setCurd(0); const c = this.add(A6.soapCake(), x, z); this.lab.emit('soap_cake', { v: v.id }); return c; }
}
void tmp;
