// DUET Science Lab 360, biology in real places, batch BW4 (the ocean and animals), part 2: by the village pond and in
// the forest. The five classes of animals with a backbone, tested by hand (an infrared thermometer, a hand lens); life
// cycles in still water (a frog's, and the mosquito's in a forgotten tyre); the beaks and feet of birds; animals hidden
// by their colours, and a crow that hunts them. Every mesh drawn here uses the shared BW4 material (oceanworld1.js).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';
import { mergeGeoms } from './bioworld1.js';
import { carry } from './bioworld4.js';
import { BENCH_Y } from './room.js';
import { LITE } from './lite.js';
import { lm, oModel, zoomBubble, thing, spot, done1, dryLand, clock } from './oceanworld1.js';
import { flyT } from './oceanworld1.js';

const TAU = Math.PI * 2;
const N3 = (en, hi, hg) => ({ en, hi, hg: hg || en });
const Y = BENCH_Y;
const ang = (x, z) => Math.atan2(-z, x);
const lathe = (pts, mat, seg = 32) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };
const T = {};
const steelM = () => T.steel || (T.steel = lm({ color: 0xc9ced2 }));
const waterBasic = (c = 0x6f9fb0, op = 0.45) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false });
// a word or two printed on a card, mat or label (a canvas texture on the shared material)
function cardTex(lines, w = 256, h = 128, bg = '#f4efe2', fg = '#222', sz = 34) { return tex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  lines.forEach((l, i) => { x.font = `${i ? 600 : 800} ${i ? sz * 0.7 : sz}px ${FONT}`; x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * sz * 1.1); }); }); }
// a holder whose contents can be carried as one thing (an animal with its stone, perch or basin)
const holder = (...ch) => { const g = new THREE.Group(); for (const c of ch) g.add(c); return g; };
const clampV = (v) => v;

// ------------------------------------------------------------------ Class 9 (6): five animals with a backbone, five classes
// A cold winter morning (15 °C) by the village pond. On the table: a small fish in a basin of pond water, a frog on a wet
// stone, a house gecko on a piece of bark, a kingfisher on a perch and a hare on a straw mat; in front, five cloth mats,
// one for each class. An infrared thermometer reads a body's surface heat from a distance; a hand lens shows the skin
// up close in the bubble.
export const VERT = { fish: { cls: 'pisces', t: 15.3 }, frog: { cls: 'amphibia', t: 15.8 }, gecko: { cls: 'reptilia', t: 16.6 }, kingfisher: { cls: 'aves', t: 40.6 }, hare: { cls: 'mammalia', t: 38.4 } };
export const CLASSES = ['pisces', 'amphibia', 'reptilia', 'aves', 'mammalia'];
export function vertTable(o = {}) {
  const it = new Item('bvert', { ...o, name: N3('Five animals with a backbone', 'रीढ़ की हड्डी वाले पाँच जानवर', 'Reedh ki haddi wale paanch jaanwar') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand();
  const XS = [-0.92, -0.46, 0, 0.46, 0.92], ZB = -0.92, ZM = -0.55;
  // the class mats: woven cotton squares with the class written on them
  const NAMES = { pisces: ['Pisces', 'fish'], amphibia: ['Amphibia', 'amphibians'], reptilia: ['Reptilia', 'reptiles'], aves: ['Aves', 'birds'], mammalia: ['Mammalia', 'mammals'] };
  it.mats = CLASSES.map((c, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.006, 0.24), lm({ map: cardTex([w_(NAMES[c][0]), w_(NAMES[c][1])], 256, 180, ['#e9dcc0', '#dfe6d2', '#e6d9cc', '#d9e2ea', '#ead8d8'][i]) })); m.position.set(XS[i], Y + 0.003, ZM); m.receiveShadow = true; g.add(m); return { c, p: V(XS[i], Y + 0.006, ZM), n: 0 }; });
  const rings = it.mats.map((m) => { const r = spot(0.15); r.position.copy(m.p).add(V(0, 0.01, 0)); g.add(r); return r; });
  it.slotOn = (i) => it.mats[i].p.clone();
  // temperature tags over the animals, the bubble, the sign
  it.tTags = {}; const sign = liveSign(0.09, 4.6); sign.position.set(0, Y + 0.75, -1.15); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(0.0, Y + 0.55, -1.28), r: 0.15, hide: [sign] }); g.add(bub); it.bubble = bub;
  it.open = null; animator(it); const up0 = it.update;
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); rings.forEach((r, i) => { r.visible = !!it.open && it.open(i); if (r.visible) r.scale.setScalar(1 + 0.06 * Math.sin(tt * 5)); }); };
  it.XS = XS; it.ZB = ZB; it.ticks = ticks;
  it.views = { all: { p: V(0, 1.75, 1.0), t: V(0, Y - 0.1, -0.7) }, table: { p: V(0, 1.6, 0.65), t: V(0, Y, -0.7) }, pond: { p: V(0, 2.0, 1.3), t: V(0, 0.4, -2.0) } };
  it.say([w_('15 °C on a winter morning')], '#ffffff');
  return done1(it, { height: 0.5, radius: 1.2 });
}
// the five animals, each with its own base, as things to carry
export function vertAnimal(kind, label) {
  let grp; const r = rnd(kind.length * 7);
  if (kind === 'fish') { const basin = lathe([[0, 0], [0.09, 0.002], [0.12, 0.03], [0.13, 0.07], [0.125, 0.07], [0.115, 0.03], [0.088, 0.006], [0, 0.006]], steelM(), 36);
    const w = new THREE.Mesh(new THREE.CircleGeometry(0.118, 32).rotateX(-Math.PI / 2), waterBasic(0x5f8f80, 0.5)); w.position.y = 0.055; w.renderOrder = 8;
    const f = oModel('bluegill', { len: 0.11, face: [1, 0] }); const fh = new THREE.Group(); fh.add(f); grp = holder(basin, fh, w); let a = 0; grp.tick = (dt) => { a += dt * 0.8; fh.position.set(Math.cos(a) * 0.045, 0.018, Math.sin(a) * 0.045); fh.rotation.y = ang(-Math.sin(a), Math.cos(a)); f.tick(dt); }; grp.skin = fh; }
  else if (kind === 'frog') { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 1).scale(1.4, 0.45, 1.1), lm({ color: 0x6e6a5e })); st.position.y = 0.02; const f = oModel('frog_lo', { face: [0.3, 1] }); f.position.y = 0.045; grp = holder(st, f); grp.tick = (dt) => f.tick(dt); grp.skin = f; }
  else if (kind === 'gecko') { const bark = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), lm({ map: T.bark || (T.bark = tex(128, 64, (x) => { x.fillStyle = '#6b5236'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(30,20,10,${0.3 + r() * 0.4})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const yy = r() * 64; x.moveTo(0, yy); x.lineTo(128, yy + (r() - 0.5) * 8); x.stroke(); } })) }));
    bark.position.y = 0.01; const gk = oModel('gecko', { face: [1, 0.3], speed: 0.0 }); gk.position.y = 0.02; grp = holder(bark, gk); grp.tick = (dt) => gk.tick(dt); grp.skin = gk; }
  else if (kind === 'kingfisher') { const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 16), lm({ color: 0x7a5a3a })); base.position.y = 0.01; const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 8), lm({ color: 0x8a6a45 })); stick.position.y = 0.09;
    const k = oModel('kingfisher', { face: [0.4, 1] }); k.position.y = 0.16; grp = holder(base, stick, k); grp.skin = k; }
  else { const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 24), lm({ color: 0xc8a96a })); mat.position.y = 0.005; const h = oModel('hare', { face: [0.3, 1], h: 0.36 }); h.position.y = 0.01; grp = holder(mat, h); grp.skin = h; }
  const it = thing(label, grp, { hitR: kind === 'hare' ? 0.16 : 0.11, hitY: kind === 'hare' ? 0.15 : 0.07, kind: 'v_' + kind }); it.vkind = kind; it.on = -1; it.measured = false; it.looked = false; return it;
}
// the thermometer: a yellow infrared gun (its red dot shows where it reads)
export function irGun() { const g = new THREE.Group(); const y = lm({ color: 0xe8b52a }), d = lm({ color: 0x2c2f33 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.045, 0.035), y); body.position.set(0.0, 0.07, 0); g.add(body);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.03), d); grip.position.set(-0.035, 0.03, 0); grip.rotation.z = 0.25; g.add(grip);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.025), new THREE.MeshBasicMaterial({ color: 0x9fd8c0, toneMapped: false })); scr.position.set(-0.045, 0.085, 0); scr.rotation.y = -Math.PI / 2; g.add(scr);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.02, 12), d); tip.rotation.z = Math.PI / 2; tip.position.set(0.072, 0.07, 0); g.add(tip); noHit(g); return g; }
export function bindVert(vt, an, tools, app, s, done = {}) {
  const st = () => app.runner.i;
  vt.open = (i) => stepNow(app, s.sort) && an.some((a) => a.held);
  // reading: the gun flies to the animal, a red dot on its body, the number climbs to its surface heat
  vt.read = (a, gun, cb) => { if (vt.busy) return false; vt.busy = true; gun.flying = true; const p0 = gun.g.position.clone(), at = a.g.position.clone().add(V(-0.18, 0.16, 0.12)); let k = 0; const info = VERT[a.vkind];
    if (!vt.tTags[a.vkind]) { const tg = tag('', '#ffffff', 0.05); vt.g.add(tg); vt.tTags[a.vkind] = tg; } const tg = vt.tTags[a.vkind];
    const __dt1 = clock(); const step = () => { k = Math.min(1, k + __dt1() * 60 / 150); gun.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.25))); if (k > 0.8) gun.g.position.lerpVectors(at, gun.home.p, ease((k - 0.8) / 0.2)); gun.g.rotation.y = Math.atan2(at.z - a.g.position.z, a.g.position.x - at.x) * 0 + ang(a.g.position.x - at.x, a.g.position.z - at.z);
      const v = 12 + (info.t - 12) * clamp01((k - 0.25) / 0.4); tg.position.copy(a.g.position).add(V(0, a.vkind === 'hare' ? 0.48 : 0.3, 0)); tg.setText(`${v.toFixed(1)} °C`, info.t > 30 ? '#ff9a6a' : '#7cd3ff');
      if (k < 1) requestAnimationFrame(step); else { gun.flying = false; gun.placed = false; gun.g.rotation.set(0, 0, 0); a.measured = true; vt.busy = false; if (cb) cb(a); } }; step(); };
  vt.look = (a, lens, cb) => { if (vt.busy) return false; vt.busy = true; lens.flying = true; const p0 = lens.g.position.clone(), at = a.g.position.clone().add(V(0, a.vkind === 'hare' ? 0.4 : 0.22, 0.08)); let k = 0;
    const CAP = { fish: 'Fish: scales, and gills under the gill cover', frog: 'Frog: moist, smooth skin with no scales', gecko: 'Gecko: dry skin covered in small scales', kingfisher: 'Kingfisher: feathers', hare: 'Hare: fur (hair)' };
    const __dt2 = clock(); const step = () => { k = Math.min(1, k + __dt2() * 60 / 120); lens.g.position.lerpVectors(p0, at, ease(clamp01(k / 0.3))); if (k > 0.85) lens.g.position.lerpVectors(at, lens.home.p, ease((k - 0.85) / 0.15));
      if (k > 0.3 && !a.looked) { a.looked = true; const sk = (a.model.skin || a.model).getWorldPosition(V()).add(V(0, a.vkind === 'hare' ? 0.18 : a.vkind === 'kingfisher' ? 0.08 : 0.02, 0)); vt.bubble.look(sk, sk.clone().add(V(0.05, 0.1, 0.16)), vt.W(CAP[a.vkind])); }
      if (k < 1) requestAnimationFrame(step); else { lens.flying = false; lens.placed = false; vt.busy = false; if (cb) cb(a); } }; step(); };
  vt.put = (a, i, cb) => { const M = vt.mats[i]; if (a.on >= 0 && a.on !== i) vt.mats[a.on].n--; if (a.on !== i) M.n++; a.on = i; a.placed = true;
    flyT(a, M.p.clone(), 0, 0.8, () => { a.home = { p: a.g.position.clone(), q: a.g.quaternion.clone() }; a.placed = false; if (cb) cb(a, i); }); };
  for (const a of an) carry(a, vt.mats.map((M, i) => ({ at: () => M.p.clone(), r: 0.17, open: () => stepNow(app, s.sort) && !vt.busy, put: (x) => vt.put(x, i, () => done.put && done.put(x, i)) })), { carryY: Y + 0.18 });
  carry(tools.gun, an.map((a) => ({ at: () => a.g.position.clone(), r: 0.17, open: () => stepNow(app, s.temp) && !vt.busy, put: () => vt.read(a, tools.gun, () => done.temp && done.temp(a)) })), { carryY: Y + 0.2 });
  carry(tools.lens, an.map((a) => ({ at: () => a.g.position.clone(), r: 0.17, open: () => stepNow(app, s.lens) && !vt.busy, put: () => vt.look(a, tools.lens, () => done.lens && done.lens(a)) })), { carryY: Y + 0.2 });
  void st;
}

// ------------------------------------------------------------------ Class 8 (10): life cycles in still water
// By the pond: a glass tank of pond water on the table, a clump of frog spawn on a lotus leaf, and on the ground an old
// tyre and a clay pot full of last week's rain. The calendar runs on: eggs → tadpoles → legs → froglets → frogs in the
// tank, and mosquitoes breed in whichever rain-water container the student has left full.
export function stillWater(o = {}) {
  const it = new Item('bstill', { ...o, name: N3('A tank of pond water, a tyre and a pot of rain water', 'तालाब के पानी का टैंक, टायर और बारिश के पानी का घड़ा', 'Talaab ke paani ka tank, tyre aur baarish ke paani ka ghada') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(41);
  // the tank: glass walls, pond water, gravel, Hydrilla, a stone island
  const TC = V(0.05, Y, -0.8), TW = 0.6, TD = 0.3, TH = 0.3, WL = 0.24;
  const glassM = new THREE.MeshBasicMaterial({ color: 0xdff2f2, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const tank = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TD), glassM); tank.position.copy(TC).add(V(0, TH / 2, 0)); tank.renderOrder = 9; g.add(tank);
  const water = new THREE.Mesh(new THREE.BoxGeometry(TW - 0.01, WL, TD - 0.01), waterBasic(0x7fa58a, 0.22)); water.position.copy(TC).add(V(0, WL / 2 + 0.01, 0)); water.renderOrder = 8; g.add(water);
  const grav = new THREE.Mesh(new THREE.BoxGeometry(TW - 0.012, 0.02, TD - 0.012), lm({ map: T.grav || (T.grav = tex(128, 64, (x) => { x.fillStyle = '#7a6a52'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${150 + r() * 80},${130 + r() * 70},${100 + r() * 60},0.9)`; x.beginPath(); x.arc(r() * 128, r() * 64, 1 + r() * 2.5, 0, TAU); x.fill(); } })) })); grav.position.copy(TC).add(V(0, 0.012, 0)); g.add(grav);
  const isl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 1).scale(1.3, 2.4, 1), lm({ color: 0x77705f })); isl.position.copy(TC).add(V(0.2, 0.12, 0.02)); g.add(isl);
  const hy = []; for (let i = 0; i < 9; i++) { const h = 0.12 + r() * 0.1, x0 = TC.x - 0.22 + r() * 0.3, z0 = TC.z - 0.1 + r() * 0.18; hy.push(new THREE.CylinderGeometry(0.0015, 0.002, h, 4).translate(x0, TC.y + 0.02 + h / 2, z0)); for (let k = 0; k < 12; k++) { const y = TC.y + 0.03 + (k / 12) * h; for (let j = 0; j < 3; j++) hy.push(new THREE.BoxGeometry(0.012, 0.0015, 0.003).translate(0.006, 0, 0).rotateY(j * 2.1 + k).translate(x0, y, z0)); } }
  const hyM = new THREE.Mesh(mergeGeoms(hy), lm({ color: 0x4f8a2a })); g.add(hyM);
  it.at = { tank: () => TC.clone().add(V(-0.1, WL, 0)) };
  // frog spawn: a clump of eggs in jelly
  const spawn = new THREE.Group(); { const jel = [], dots = []; for (let i = 0; i < 46; i++) { const p = V((r() - 0.5) * 0.07, r() * 0.02, (r() - 0.5) * 0.05); jel.push(new THREE.SphereGeometry(0.0065, 8, 6).translate(p.x, p.y, p.z)); dots.push(new THREE.SphereGeometry(0.0022, 6, 4).translate(p.x, p.y, p.z)); }
    const jm = new THREE.Mesh(mergeGeoms(jel), new THREE.MeshBasicMaterial({ color: 0xe8efe6, transparent: true, opacity: 0.45, depthWrite: false })); jm.renderOrder = 10; spawn.add(jm); spawn.add(new THREE.Mesh(mergeGeoms(dots), lm({ color: 0x15140f }))); spawn.userData.dots = spawn.children[1]; noHit(spawn); }
  it.spawnGroup = spawn;
  // the tadpoles, froglets and frogs (they appear as the days pass)
  const tads = []; for (let i = 0; i < 8; i++) { const m = oModel('tadpole', { face: [1, 0], sw: { amp: 0.16 }, rate: 2.2 }); const h = new THREE.Group(); h.add(m); h.visible = false;
    const legs = new THREE.Group(); for (const sd of [-1, 1]) { const lg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0012, 0.008, 2, 4), lm({ color: 0x5b5a3a })); lg.position.set(-0.004, -0.001, sd * 0.004); lg.rotation.x = sd * 1.1; legs.add(lg); } legs.visible = false; h.add(legs); h.userData.legs = legs; g.add(h); tads.push({ h, m, a: r() * TAU, rx: 0.08 + r() * 0.12, rz: 0.04 + r() * 0.06, y: 0.05 + r() * 0.15 }); }
  const frogs = [0, 1, 2].map((i) => { const f = oModel('frog_lo', { face: [0.2 - i * 0.5, 1], len: 0.03 }); f.visible = false; g.add(f); return f; });
  const tails = frogs.map((f) => { const t = new THREE.Mesh(new THREE.ConeGeometry(0.004, 0.025, 6), lm({ color: 0x4d4a32 })); t.rotation.z = Math.PI / 2; t.position.set(-0.018, 0.005, 0); f.add(t); return t; });
  // the containers of rain water on the ground, right of the table
  const tyreM = lm({ color: 0x1b1b1d }); const tyre = new THREE.Group(); { const t = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.1, 12, 32), tyreM); t.rotation.x = Math.PI / 2; t.position.y = 0.1; tyre.add(t); const w = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24).rotateX(-Math.PI / 2), waterBasic(0x4a5a46, 0.8)); w.position.y = 0.13; tyre.add(w); tyre.userData.water = w; tyre.userData.wy = 0.13; }
  const potM = lm({ map: T.clay || (T.clay = tex(128, 64, (x) => { x.fillStyle = '#b4613a'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '90,40,20' : '230,170,130'},0.2)`; x.fillRect(r() * 128, r() * 64, 2, 1); } })) });
  const pot = new THREE.Group(); { pot.add(lathe([[0, 0], [0.1, 0], [0.17, 0.12], [0.16, 0.24], [0.12, 0.3], [0.13, 0.32], [0.115, 0.32], [0.11, 0.3], [0.15, 0.24], [0.16, 0.12], [0.095, 0.01], [0, 0.01]], potM, 28)); const w = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20).rotateX(-Math.PI / 2), waterBasic(0x4a5a46, 0.85)); w.position.y = 0.29; pot.add(w); pot.userData.water = w; pot.userData.wy = 0.29; }
  // the soil patch beside the drain where water is tipped out
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24).rotateX(-Math.PI / 2), lm({ color: 0x4f3e2a })); soil.position.set(1.55, 0.004, -1.4); g.add(soil); it.at.soil = () => V(1.55, 0, -1.4);
  // mosquitoes: eggs as rafts, larvae (wrigglers) hanging from the surface, pupae (tumblers), adults flying off
  const NL = 26; const larvaG = mergeGeoms([new THREE.CapsuleGeometry(0.0009, 0.0065, 2, 5).translate(0, -0.004, 0), new THREE.SphereGeometry(0.0011, 6, 4).translate(0, -0.0085, 0), new THREE.CylinderGeometry(0.00025, 0.00025, 0.002, 3).translate(0, 0.0003, 0)]);
  const pupaG = mergeGeoms([new THREE.SphereGeometry(0.0016, 8, 6).scale(1, 1.1, 1).translate(0, -0.002, 0), new THREE.CapsuleGeometry(0.0005, 0.004, 2, 4).translate(0.0012, -0.005, 0)]);
  const mosqG = mergeGeoms([new THREE.CapsuleGeometry(0.0006, 0.004, 2, 4).rotateZ(Math.PI / 2), new THREE.PlaneGeometry(0.0035, 0.0012).translate(0.0005, 0.0006, 0.0012).rotateX(-Math.PI / 2), new THREE.PlaneGeometry(0.0035, 0.0012).translate(0.0005, 0.0006, -0.0012).rotateX(-Math.PI / 2)]);
  const mkIM = (geo, col, n) => { const m = new THREE.InstancedMesh(geo, lm({ color: col }), n); m.count = 0; m.frustumCulled = false; m.userData.noHit = true; return m; };
  const cont = [{ grp: tyre, name: 'tyre', at: V(1.25, 0, -0.55), R: 0.18 }, { grp: pot, name: 'pot', at: V(1.25, 0, -1.05), R: 0.1 }];
  for (const c of cont) { c.lar = mkIM(larvaG, 0x3a3326, NL); c.pup = mkIM(pupaG, 0x2a2620, NL); c.ad = mkIM(mosqG, 0x2b2a28, NL); c.grp.add(c.lar, c.pup, c.ad); c.full = true; c.seed = cont.indexOf(c) + 3;
    c.bits = Array.from({ length: NL }, () => ({ a: r() * TAU, d: Math.sqrt(r()) * c.R * 0.9, ph: r() * TAU, fly: V((r() - 0.5) * 2, 0.6 + r() * 1.2, (r() - 0.5) * 2) })); }
  it.cont = cont;
  // the calendar
  const sign = liveSign(0.09, 4.8); sign.position.set(0, Y + 0.72, -1.1); g.add(sign); it.say = (l, c) => sign.set(l, c);
  const bub = zoomBubble({ at: V(0.85, Y + 0.6, -1.15), r: 0.15, hide: [sign] }); g.add(bub); it.bubble = bub;
  it.t = 0; it.tMax = 112; it.spawnIn = false;
  const dm = new THREE.Object3D(); let TT = 0;
  const stageOf = (d) => (d < 6 ? 'Eggs in jelly' : d < 42 ? 'Tadpoles: gills, a tail, no legs' : d < 63 ? 'Tadpoles with back legs' : d < 84 ? 'Four legs; the tail shrinks' : d < 100 ? 'Froglets leave the water' : 'Young frogs');
  it.mosq = (c) => { const d = it.t - (c.emptied != null ? 1e9 : 0); if (!c.full) return 'empty'; return d < 2 ? 'eggs' : d < 8 ? 'larvae' : d < 10 ? 'pupae' : 'adults'; };
  const drawMosq = (c) => { const d = it.t; const L = c.full && d >= 2 && d < 10 ? NL : 0, P = c.full && d >= 7 && d < 11 ? Math.round(NL * clamp01((d - 7) / 1.5) * (d < 10 ? 1 : 1 - (d - 10))) : 0, A = c.full && d >= 9.5 ? NL : 0; const wy = c.grp.userData.wy;
    let n = 0; c.bits.forEach((b, i) => { if (i >= L || i < P) return; dm.position.set(Math.cos(b.a) * b.d, wy - 0.001, Math.sin(b.a) * b.d); dm.rotation.set(Math.sin(TT * 8 + b.ph) * 0.4, 0, Math.sin(TT * 6 + b.ph) * 0.5); dm.scale.setScalar(0.6 + 0.4 * clamp01((d - 2) / 5)); dm.updateMatrix(); c.lar.setMatrixAt(n++, dm.matrix); }); c.lar.count = n; c.lar.instanceMatrix.needsUpdate = true;
    n = 0; c.bits.forEach((b, i) => { if (i >= P) return; dm.position.set(Math.cos(b.a) * b.d, wy - 0.002, Math.sin(b.a) * b.d); dm.rotation.set(0, b.a, Math.sin(TT * 2 + b.ph) * 0.2); dm.scale.setScalar(1); dm.updateMatrix(); c.pup.setMatrixAt(n++, dm.matrix); }); c.pup.count = n; c.pup.instanceMatrix.needsUpdate = true;
    n = 0; c.bits.forEach((b, i) => { if (i >= A) return; const f = clamp01((d - 9.5 - i * 0.02) / 1.5); dm.position.set(Math.cos(b.a) * b.d, wy + 0.004, Math.sin(b.a) * b.d).lerp(b.fly.clone().add(V(Math.sin(TT * 3 + b.ph) * 0.05, Math.sin(TT * 5 + b.ph) * 0.04, 0)), f); dm.rotation.set(0, b.a + TT * 0.5, 0); dm.scale.setScalar(1); dm.updateMatrix(); c.ad.setMatrixAt(n++, dm.matrix); }); c.ad.count = n; c.ad.instanceMatrix.needsUpdate = true; };
  it.setT = (t) => { it.t = Math.max(0, Math.min(it.tMax, t)); const d = it.t;
    spawn.visible = !it.spawnIn || d < 7; spawn.userData.dots.scale.setScalar(1 + clamp01(d / 6) * 0.4);
    tads.forEach((tp, i) => { tp.h.visible = it.spawnIn && d >= 6 && d < 84 + i * 2; const grow = 0.6 + 0.9 * clamp01((d - 6) / 50); tp.h.scale.setScalar(grow); tp.h.userData.legs.visible = d > 42; });
    frogs.forEach((f, i) => { const born = 80 + i * 6; f.visible = it.spawnIn && d >= born; const k = clamp01((d - born) / 25); f.scale.setScalar(0.6 + 0.9 * k); tails[i].scale.setScalar(Math.max(0.001, 1 - clamp01((d - born) / 14))); });
    for (const c of cont) drawMosq(c);
    const wk = Math.floor(d / 7), dd = Math.round(d % 7);
    it.say([`${w_('Day')} ${Math.round(d)} (${w_('week')} ${wk}${dd ? ' + ' + dd : ''})`, `${w_('Tank')}: ${it.spawnIn ? w_(stageOf(d)) : w_('no spawn yet')}`, `${w_('Tyre')}: ${w_(mosqWord(it.mosq(cont[0])))} · ${w_('Pot')}: ${w_(mosqWord(it.mosq(cont[1])))}`], ['#ffffff', '#8be07a', '#ffd23f']); };
  const mosqWord = (m) => ({ empty: 'emptied, dry', eggs: 'still water', larvae: 'wriggling larvae', pupae: 'pupae', adults: 'mosquitoes flying out' }[m]);
  it.limFor = (i) => it.lims ? it.lims[i] ?? it.tMax : it.tMax;
  it.knobPath = () => [V(-0.45, Y + 0.02, -0.42), V(0.45, Y + 0.02, -0.42)];
  // tip a container out onto the soil: it is carried there, tilts, the water and anything in it pours out
  it.empty = (c, cb) => { if (it.busy) return false; const g0 = c.thing.g; const p0 = g0.position.clone(), to = V(1.55, 0, -1.4); c.thing.flying = true; it.busy = true; let k = 0;
    const __dt3 = clock(); const step = () => { k = Math.min(1, k + __dt3() * 60 / 120); const e = ease(clamp01(k / 0.35)); g0.position.lerpVectors(p0, to, e); g0.position.y += Math.sin(e * Math.PI) * 0.15; g0.rotation.z = -1.4 * clamp01((k - 0.35) / 0.3) * (1 - clamp01((k - 0.8) / 0.2));
      if (k > 0.5) { c.full = false; c.grp.userData.water.visible = false; } if (k < 1) requestAnimationFrame(step); else { g0.rotation.z = 0; c.thing.flying = false; c.thing.placed = false; c.thing.home = { p: g0.position.clone(), q: g0.quaternion.clone() }; it.busy = false; it.setT(it.t); if (cb) cb(c); } }; step(); return true; };
  it.putSpawn = (sp, cb) => { sp.flying = true; flyT(sp, it.at.tank(), 0, 0.8, () => { sp.flying = false; sp.noGrab = true; sp.used = true; it.spawnIn = true; it.setT(it.t); if (cb) cb(); }); };
  animator(it); const up0 = it.update;
  it.update = (dt, tt) => { up0(dt); const d = Math.min(dt || 0.016, 0.05); TT += d;
    tads.forEach((tp) => { if (!tp.h.visible) return; tp.a += d * 0.6; tp.h.position.set(TC.x - 0.05 + Math.cos(tp.a) * tp.rx, TC.y + tp.y, TC.z + Math.sin(tp.a) * tp.rz); tp.h.rotation.y = ang(-Math.sin(tp.a) * tp.rx, Math.cos(tp.a) * tp.rz); tp.m.tick(d); });
    frogs.forEach((f, i) => { if (!f.visible) return; const k = clamp01((it.t - (80 + i * 6)) / 20); f.position.set(TC.x + 0.2 - i * 0.03 + (k > 0.8 ? (k - 0.8) * 1.5 : 0), TC.y + 0.2 + (k > 0.8 ? 0.04 : 0), TC.z - 0.02 + i * 0.05 + (k > 0.8 ? 0.25 : 0)); f.tick(d); });
    if (it.t > 1 && it.t < 12) for (const c of cont) drawMosq(c);
    for (const f of ticks) f(d, tt); };
  it.views = { all: { p: V(0.3, 1.6, 0.7), t: V(0.4, Y - 0.2, -0.9) }, tank: { p: V(0.05, 1.3, 0.05), t: V(0.05, Y + 0.12, -0.8) }, pots: { p: V(1.75, 1.35, 0.35), t: V(1.35, 0.1, -0.95) } };
  it.tadOne = () => { const tp = tads.find((x) => x.h.visible); return tp && tp.h; };
  it.setT(0);
  return done1(it, { height: 0.6, radius: 1.4 });
}
export function bindStill(sw, th, app, s, done = {}) {
  carry(th.spawn, [{ at: sw.at.tank, r: 0.25, open: () => stepNow(app, s.spawn) && !sw.spawnIn, put: (x) => sw.putSpawn(x, () => done.spawn && done.spawn()) }], { carryY: Y + 0.12 });
  for (const c of sw.cont) carry(c.thing, [{ at: sw.at.soil, r: 0.35, open: () => (stepNow(app, s.empty1) || stepNow(app, s.empty2)) && c.full && !sw.busy, put: () => sw.empty(c, () => done.empty && done.empty(c)) }], { carryY: 0.35 });
  const steps = [s.t1, s.t2, s.t3]; sw.lims = { [s.t1]: 14, [s.t2]: 56, [s.t3]: 112 };
  const sync = slideKnob(th.knob, { path: () => sw.knobPath(), active: () => steps.some((i) => stepNow(app, i)) && !sw.busy, keepVisible: () => steps.includes(app.runner.i), k: () => sw.t / sw.tMax,
    set: (k) => { const L = sw.limFor(app.runner.i); sw.setT(Math.min(L, Math.max(sw.t, Math.round(k * sw.tMax * 2) / 2))); if (sw.t >= L - 1e-6 && done.end) done.end(app.runner.i); } });
  const s0 = sw.setT; sw.setT = (t) => { s0(t); sync(); };
  const u0 = sw.update; sw.update = (dt, t) => { u0(dt, t); const i = app.runner.i; if (i === s.t1 || i === s.empty2) { const c = sw.cont.find((x) => x.full); if (c && sw.t > 2) { const p = c.thing.g.position.clone().add(V(0, c.grp.userData.wy, 0)); sw.bubble.look(p.clone().add(V(0, -0.004, 0)), p.clone().add(V(0.0, 0.04, 0.05)), sw.W(sw.t < 8 ? 'Larvae hang from the surface to breathe' : sw.t < 10 ? 'Pupae: the larvae are turning into adults' : 'Adult mosquitoes fly off')); } else sw.bubble.hideBubble(); }
    else if (i === s.t2 || i === s.t3) { const tp = sw.tadOne && sw.tadOne(); if (tp) { const p = tp.getWorldPosition(V()); sw.bubble.look(p, p.clone().add(V(0.02, 0.05, 0.08)), sw.W(sw.t < 42 ? 'Tadpole: gills and a tail' : sw.t < 84 ? 'Back legs growing' : 'A froglet')); } } else sw.bubble.hideBubble(); };
}

// ------------------------------------------------------------------ Class 6: the beaks and feet of birds
// By the pond: a sparrow on a twig, a kingfisher on its bamboo perch, a duck on the bank, a woodpecker on a dead stump
// and a hawk on a stump. On the table: grain, a small fish, grubs in a piece of bark, a lizard, and snails with duckweed.
// The student takes each food to the bird whose beak can eat it, then puts a card for what each bird's feet do.
export const BIRDS = { sparrow: { food: 'grain', feet: 'perch' }, kingfisher: { food: 'fish', feet: 'perch' }, duck: { food: 'snails', feet: 'swim' }, woodpecker: { food: 'grubs', feet: 'climb' }, hawk: { food: 'lizard', feet: 'grasp' } };
export function birdBank(o = {}) {
  const it = new Item('bbirds', { ...o, name: N3('Birds round the pond', 'तालाब के आसपास के पक्षी', 'Talaab ke aaspaas ke pakshi') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(5);
  const B = it.birds = {};
  const bird = (key, name, p, face, extra = {}) => { const m = oModel(name, { face, ...extra }); m.position.copy(p); g.add(m); B[key] = { m, p: p.clone(), top: p.clone().add(V(0, extra.top ?? 0.3, 0)), foot: p.clone().add(V(0, extra.foot ?? 0.05, 0)) }; ticks.push((dt) => m.tick(dt)); return m; };
  // perches: a twig stand on the table, the pond's bamboo post (from the pond scene), the bank, two stumps
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 16), lm({ color: 0x6f5232 })); stand.position.set(0.1, Y + 0.01, -1.0); g.add(stand);
  bird('sparrow', 'sparrow', V(0.1, Y + 0.02, -1.0), [0, 1], { top: 0.2, foot: 0.06 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.05, 10), lm({ color: 0x8a7a52 })); post.position.set(0.72, 0.525, -1.45); g.add(post);
  bird('kingfisher', 'kingfisher', V(0.72, 1.05, -1.45), [-0.4, 1], { top: 0.22, foot: 0.02 });
  // the duck stands on a rock at the water's edge, the woodpecker clings to a dead snag, the hawk sits on a tall stump
  const rock = oModel('boulder_04', { k: 0.4, tint: 0xa09a8a }); rock.position.set(-1.0, -0.02, -1.5); g.add(rock);
  bird('duck', 'duck', V(-1.0, 0.72, -1.5), [0.5, 1], { top: 0.4, foot: 0.03 });
  const snag = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.75, 10), lm({ map: T.bark || (T.bark = tex(128, 64, (x) => { const r = rnd(9); x.fillStyle = '#6b5236'; x.fillRect(0, 0, 128, 64); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(30,20,10,${0.3 + r() * 0.4})`; x.lineWidth = 1 + r() * 2; x.beginPath(); const yy = r() * 64; x.moveTo(0, yy); x.lineTo(128, yy + (r() - 0.5) * 8); x.stroke(); } })) }));
  snag.position.set(-0.4, 0.375, -1.55); g.add(snag);
  bird('woodpecker', 'woodpecker', V(-0.4, 0.72, -1.55), [0.3, 1], { top: 0.4, foot: 0.2 });
  const stump = oModel('tree_stump_01', { k: 0.85 }); stump.position.set(1.28, 0, -1.3); g.add(stump);
  bird('hawk', 'hawk_low', V(1.28, 0.47, -1.3), [-0.7, 1], { top: 0.5, foot: 0.08 });
  // foods on the table
  const F = it.foods = {};
  it.bubble = zoomBubble({ at: V(-0.9, Y + 0.48, -0.95), r: 0.15 }); g.add(it.bubble);
  const sign = liveSign(0.085, 4.8); sign.position.set(0.1, Y + 0.78, -1.2); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.at = (key, part) => (part === 'feet' ? B[key].foot.clone() : B[key].top.clone());
  animator(it); const up0 = it.update;
  it.update = (dt, t) => { up0(dt); for (const f of ticks) f(dt || 0.016, t); };
  it.views = { all: { p: V(0.1, 1.55, 0.75), t: V(0.1, 0.8, -1.35) }, table: { p: V(0, 1.45, 0.3), t: V(0, Y, -0.8) } };
  void F; void r;
  return done1(it, { height: 0.6, radius: 1.6 });
}
// the foods (each a thing on the table)
export function birdFood(kind, label) {
  const r = rnd(kind.length * 13); let grp;
  if (kind === 'grain') { const bowl = lathe([[0, 0], [0.04, 0], [0.06, 0.02], [0.062, 0.03], [0.058, 0.03], [0.055, 0.02], [0.038, 0.004], [0, 0.004]], lm({ map: T.clay2 || (T.clay2 = tex(32, 32, (x) => { x.fillStyle = '#a65a34'; x.fillRect(0, 0, 32, 32); })) }), 24);
    const gr = []; for (let i = 0; i < 70; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.045; gr.push(new THREE.SphereGeometry(0.0028, 5, 4).scale(1.3, 0.8, 0.9).rotateY(r() * TAU).translate(Math.cos(a) * d, 0.02 + r() * 0.006, Math.sin(a) * d)); }
    grp = holder(bowl, new THREE.Mesh(mergeGeoms(gr), lm({ color: 0xd9b56a }))); }
  else if (kind === 'fish') { const f = oModel('bluegill', { len: 0.075, face: [1, 0], play: false }); const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16).rotateX(-Math.PI / 2), lm({ color: 0x4f7a2e })); leaf.position.y = 0.002; f.position.y = 0.004; f.rotation.z = Math.PI / 2 * 0; grp = holder(leaf, f); }
  else if (kind === 'grubs') { const bark = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.07), lm({ map: T.bark2 || (T.bark2 = tex(64, 32, (x) => { x.fillStyle = '#5d4630'; x.fillRect(0, 0, 64, 32); for (let i = 0; i < 20; i++) { x.fillStyle = 'rgba(20,12,6,0.6)'; x.fillRect(r() * 64, r() * 32, 6, 1.5); } })) })); bark.position.y = 0.0125;
    const gm = []; for (let i = 0; i < 3; i++) gm.push(new THREE.CapsuleGeometry(0.004, 0.012, 3, 6).rotateZ(Math.PI / 2).rotateY(r() * 2).translate(-0.04 + i * 0.035, 0.028, (r() - 0.5) * 0.03)); grp = holder(bark, new THREE.Mesh(mergeGeoms(gm), lm({ color: 0xf0e2c0 }))); }
  else if (kind === 'lizard') { const gk = oModel('gecko', { len: 0.12, face: [1, 0.2], speed: 0 }); grp = holder(gk); grp.tick = (dt) => gk.tick(dt); }
  else { const bowl = lathe([[0, 0], [0.05, 0], [0.07, 0.025], [0.066, 0.025], [0.046, 0.004], [0, 0.004]], lm({ color: 0xbfc5c8 }), 24); const w = new THREE.Mesh(new THREE.CircleGeometry(0.064, 20).rotateX(-Math.PI / 2), waterBasic(0x5a7a52, 0.6)); w.position.y = 0.02;
    const dw = []; for (let i = 0; i < 30; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.055; dw.push(new THREE.CircleGeometry(0.004, 6).rotateX(-Math.PI / 2).translate(Math.cos(a) * d, 0.021, Math.sin(a) * d)); }
    const s1 = oModel('snail_lo', { len: 0.035, face: [1, 0] }), s2 = oModel('snail_lo', { len: 0.03, face: [-1, 0.5] }); s1.position.set(0.02, 0.008, 0.0); s2.position.set(-0.025, 0.008, 0.015); grp = holder(bowl, w, new THREE.Mesh(mergeGeoms(dw), lm({ color: 0x6fae3a })), s1, s2); }
  const it = thing(label, grp, { hitR: 0.07, hitY: 0.03, kind: 'food_' + kind }); it.food = kind; it.to = null; return it;
}
// the cards for the feet
export function feetCard(job, lines) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.08), lm({ map: cardTex(lines, 256, 160, '#fbf6e6', '#1d2b3a', 40) })); m.position.y = 0.002; const it = thing(lines[0], holder(m), { hitR: 0.07, hitY: 0.01, kind: 'card_' + job }); it.job = job; it.to = null; return it; }
export function bindBirds(bb, foods, cards, app, s, done = {}) {
  const CAPF = { sparrow: 'Sparrow: a short, thick beak cracks seeds', kingfisher: 'Kingfisher: a long, pointed beak spears fish', duck: 'Duck: a broad, flat beak strains food from mud and water', woodpecker: 'Woodpecker: a strong, chisel beak digs grubs out of wood', hawk: 'Hawk: a sharp, hooked beak tears flesh' };
  const CAPT = { sparrow: 'Sparrow: three toes in front, one behind, to grip a twig', kingfisher: 'Kingfisher: small feet, for sitting on a perch', duck: 'Duck: webbed feet, paddles for swimming', woodpecker: 'Woodpecker: two toes in front, two behind, for climbing tree trunks', hawk: 'Hawk: sharp, curved talons to catch and hold prey' };
  const give = (it, key, part, cb) => { it.flying = true; const at = bb.at(key, part).add(V(0.06, part === 'feet' ? 0.02 : 0.05, 0.08)); flyT(it, at, 0, 0.8, () => { it.flying = false; it.to = key; it.placed = false; it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() };
    const B = bb.birds[key]; const p = part === 'feet' ? B.foot.clone() : B.top.clone().add(V(0, -0.04, 0)); bb.bubble.look(p, p.clone().add(V(0.08, 0.06, 0.22)), bb.W(part === 'feet' ? CAPT[key] : CAPF[key])); if (cb) cb(); }); };
  bb.give = give;
  for (const f of foods) carry(f, Object.keys(BIRDS).map((key) => ({ at: () => bb.at(key, 'beak'), r: key === 'kingfisher' || key === 'woodpecker' ? 0.3 : 0.22, open: () => stepNow(app, s.food) && !Object.values(foods).some((x) => x.flying), put: (x) => give(x, key, 'beak', () => done.food && done.food(x)) })), { carryY: Y + 0.15 });
  for (const c of cards) carry(c, Object.keys(BIRDS).map((key) => ({ at: () => bb.at(key, 'feet'), r: 0.25, open: () => stepNow(app, s.feet), put: (x) => give(x, key, 'feet', () => done.feet && done.feet(x)) })), { carryY: Y + 0.15 });
}

// ------------------------------------------------------------------ Class 6: hidden by their colours (camouflage)
// On a forest path: a stick insect lies along a twig in a pile of twigs, a grasshopper sits in green grass, a house
// gecko clings to the bark of a fallen trunk and a chameleon grips its branch among ferns. A crow watches from a stump.
// The student finds them, moves two to new backgrounds, and lets the crow hunt: it finds whatever does not match.
export const SPOTS = { twigs: { col: 'brown' }, grass: { col: 'green' }, fern: { col: 'green' }, soil: { col: 'dark' } };
export function hideSeek(o = {}) {
  const it = new Item('bhide', { ...o, name: N3('Animals hiding on a forest path', 'जंगल की पगडंडी पर छिपे जानवर', 'Jungle ki pagdandi par chhupe jaanwar') });
  const g = it.g, w_ = o.W || ((k) => k), ticks = []; dryLand(); const r = rnd(77);
  // the twig pile
  const tw = []; for (let i = 0; i < 70; i++) { const L = 0.08 + r() * 0.22, a = r() * TAU; const c = new THREE.CylinderGeometry(0.0025 + r() * 0.002, 0.003 + r() * 0.003, L, 5).rotateZ(Math.PI / 2).rotateY(a).translate(-0.55 + (r() - 0.5) * 0.4, 0.004 + r() * 0.035, -0.95 + (r() - 0.5) * 0.3); tw.push(c); }
  const twM = new THREE.Mesh(mergeGeoms(tw), lm({ color: 0x7b5f3e })); twM.castShadow = true; g.add(twM);
  // green grass, dry leaves, ferns, a fallen trunk, a patch of bare soil
  for (let i = 0; i < 5; i++) { const m = oModel('grass_medium_02', { k: 0.6 + r() * 0.3, face: [r() - 0.5, r() - 0.5] }); m.position.set(0.55 + (r() - 0.5) * 0.35, 0, -0.95 + (r() - 0.5) * 0.3); g.add(m); }
  for (let i = 0; i < 4; i++) { const m = oModel('fern_02', { k: 0.55 + r() * 0.25, face: [r() - 0.5, r() - 0.5] }); m.position.set(-1.15 + (r() - 0.5) * 0.4, 0, -0.45 + (r() - 0.5) * 0.4); g.add(m); }
  const fernMat = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = oModel('fern_02', { k: 0.5, face: [r() - 0.5, r() - 0.5] }); m.position.set(0.95 + (r() - 0.5) * 0.2, 0, -0.35 + (r() - 0.5) * 0.2); fernMat.add(m); } g.add(fernMat);
  const trunk = oModel('dead_tree_trunk', { k: 0.6 }); trunk.position.set(0.05, 0, -1.55); trunk.rotation.y = 0.15; g.add(trunk);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24).rotateX(-Math.PI / 2), lm({ map: T.soil || (T.soil = tex(128, 128, (x) => { x.fillStyle = '#3b2e22'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '20,14,8' : '90,70,50'},0.5)`; x.beginPath(); x.arc(r() * 128, r() * 128, 1 + r() * 2, 0, TAU); x.fill(); } })) }));
  soil.position.set(-0.1, 0.006, -0.45); g.add(soil);
  it.spots = { twigs: V(-0.55, 0.04, -0.95), grass: V(0.55, 0.02, -0.95), fern: V(0.95, 0.05, -0.35), soil: V(-0.1, 0.01, -0.45) };
  const rings = Object.entries(it.spots).map(([k, p]) => { const m = spot(0.16); m.position.copy(p).add(V(0, 0.02, 0)); g.add(m); return [m, k]; });
  // the crow on a stump
  const stump = oModel('tree_stump_01', { k: 0.55 }); stump.position.set(1.4, 0, -1.6); g.add(stump);
  const crow = oModel('crow', { face: [-1, 0.6] }); const crowG = new THREE.Group(); crowG.add(crow); crowG.position.set(1.4, 0.31, -1.6); g.add(crowG); it.crow = crowG; it.crowHome = crowG.position.clone();
  const sign = liveSign(0.09, 4.6); sign.position.set(0, 1.55, -1.5); g.add(sign); it.say = (l, c) => sign.set(l, c);
  it.bubble = zoomBubble({ at: V(-0.62, 1.4, -1.0), r: 0.15, hide: [sign] }); g.add(it.bubble);
  animator(it); const up0 = it.update; it.open = null;
  it.update = (dt, t) => { up0(dt); const tt = t ?? performance.now() / 1000; for (const f of ticks) f(dt || 0.016, tt); for (const [m, k] of rings) { m.visible = !!it.open && it.open(k); if (m.visible) m.scale.setScalar(1 + 0.06 * Math.sin(tt * 5)); } };
  it.views = { all: { p: V(0, 1.55, 0.6), t: V(0, 0.2, -0.9) }, crow: { p: V(0.1, 1.55, 0.75), t: V(0.85, 0.4, -1.2) } };
  return done1(it, { height: 0.5, radius: 1.5 });
}
// the hidden animals: where each hides and what colour it is
export const HIDERS = { stickinsect: { home: 'twigs', col: 'brown', at: [-0.5, 0.045, -0.93], face: [1, 0.2] }, locust: { home: 'grass', col: 'green', at: [0.52, 0.06, -0.92], face: [-1, 0.3] },
  gecko: { home: 'bark', col: 'grey', at: [0.15, 0.165, -1.5], face: [1, 0] }, chameleon: { home: 'branch', col: 'green', at: [-1.1, 0.05, -0.42], face: [1, -0.4] } };
export function hider(name, label) { const H = HIDERS[name]; const m = oModel(name, { face: H.face, speed: 0, hit: true }); const it = thing(label, m, { hitR: name === 'chameleon' ? 0.12 : 0.07, hitY: 0.03, kind: 'hide_' + name }); it.hid = name; it.found = false; it.spot = H.home; it.caught = false; return it; }
export function bindHide(hs, an, app, s, done = {}) {
  const movable = an.filter((a) => a.hid === 'stickinsect' || a.hid === 'locust');
  hs.open = (k) => stepNow(app, s.move) && movable.some((a) => a.held) && k;
  // finding: picking an animal up (any way) marks it found; let go, it goes back where it was
  for (const a of an) { const u0 = a.update; a.update = (dt, t) => { u0(dt, t); if (a.held && !a.found && stepNow(app, s.find)) { a.found = true; const p = a.g.position.clone(); hs.bubble.look(p, p.clone().add(V(0.05, 0.1, 0.18)), hs.W(a.hid === 'stickinsect' ? 'Stick insect: shaped and coloured like a twig' : a.hid === 'locust' ? 'Grasshopper: green like the grass' : a.hid === 'gecko' ? 'Gecko: grey-brown like the bark' : 'Chameleon: green among green leaves'));
      if (done.found) done.found(a); } }; }
  for (const a of movable) carry(a, Object.keys(hs.spots).map((k) => ({ at: () => hs.spots[k].clone(), r: 0.2, open: () => stepNow(app, s.move), put: (x) => { x.flying = true; flyT(x, hs.spots[k].clone(), 0, 0.7, () => { x.flying = false; x.placed = false; x.spot = k; x.moved = true; x.home = { p: x.g.position.clone(), q: x.g.quaternion.clone() }; if (done.moved) done.moved(x); }); } })),
    { carryY: 0.35, free: (x) => { if (stepNow(app, s.find)) { flyT(x, x.home.p.clone(), new THREE.Euler().setFromQuaternion(x.home.q).y, 0.6, () => { x.placed = false; }); return true; } return false; } });
  for (const a of an.filter((x) => !movable.includes(x))) carry(a, [], { carryY: 0.35 });
  // the hunt: the crow flies to each moved animal; it sees an animal whose colour differs from where it sits
  hs.matches = (a) => (a.hid === 'stickinsect' ? a.spot === 'twigs' : a.spot === 'grass' || a.spot === 'fern');
  hs.hunt = (cb) => { if (hs.busy) return false; hs.busy = true; const list = movable.slice(); let i = 0; hs.caught = [];
    const next = () => { if (i >= list.length) { const p0 = hs.crow.position.clone(); let k = 0; const __dt4 = clock(); const back = () => { k = Math.min(1, k + __dt4() * 60 / 60); hs.crow.position.lerpVectors(p0, hs.crowHome, ease(k)); if (k < 1) requestAnimationFrame(back); else { hs.busy = false; if (cb) cb(); } }; back(); return; }
      const a = list[i++]; const see = !hs.matches(a); const p0 = hs.crow.position.clone(), to = a.g.position.clone().add(V(0.05, see ? 0.04 : 0.45, 0.05)); let k = 0;
      const __dt5 = clock(); const fly = () => { k = Math.min(1, k + __dt5() * 60 / 70); hs.crow.position.lerpVectors(p0, to, ease(k)); hs.crow.position.y += Math.sin(k * Math.PI) * 0.4; hs.crow.rotation.y = ang(to.x - p0.x, to.z - p0.z) - ang(-1, 0.6);
        if (k < 1) { requestAnimationFrame(fly); return; } if (see) { a.caught = true; hs.caught.push(a.hid); a.g.visible = false; a.noGrab = true; } setTimeout(next, 900); }; fly(); };
    next(); return true; };
}
