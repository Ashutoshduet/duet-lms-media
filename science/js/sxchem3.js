// DUET Science Lab 360, batch SX-CGM: the hands-on joins for the bench chemistry of sxchem2.js — growing an alum
// crystal, measuring the density of liquids, and building molecules. Each "Do it" runs the same moves.
import * as THREE from 'three';
import { Item, clamp01, ease, liveSign, tag, tex, rnd, noHit, stepNow, V, carry, thing, clock, slider, button, mat, std, steel, glassM, glowM, box, cyl, sph, lathe, TAU, N3, lerp, BENCH_Y, LITE } from './sxkit.js';
import { alumSol, seedThread, RHO, rhoOf, ATOM, MOLS } from './sxchem2.js';

const Y = BENCH_Y;
function moveT(it, p, q, sec = 0.8, cb) { it.flying = true; const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(); let k = 0; const dt = clock(); const lift = Math.min(0.1, 0.4 * p0.distanceTo(p));
  const step = () => { k = Math.min(1, k + dt() / sec); const e = ease(k); it.g.position.lerpVectors(p0, p, e); it.g.position.y += Math.sin(e * Math.PI) * lift; if (q) it.g.quaternion.slerpQuaternions(q0, q, e); if (k < 1) requestAnimationFrame(step); else { it.flying = false; it.home = { p: p.clone(), q: it.g.quaternion.clone() }; if (cb) cb(); } };
  step(); }
const moveP = (it, p, q, sec) => new Promise((r) => moveT(it, p, q, sec, r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ================================================================== the alum crystal
// o: { bk (beaker with 100 mL water), tp (tripod), lamp, jar (alum jar), spoon (a thing), seed (pencil + thread),
// knob (the calendar) }. s: step numbers { heat, dissolve, hang, days }.
export function bindAlum(o, K, s, done = {}) {
  const app = K.app, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  const { bk, tp, lamp, jar, spoon, seed, knob, W } = o; const st = { g: 0, spoons: 0, hours: 0, T0: null, dis0: 0, grown: 0, hung: false, onTp: false };
  o.st = st;
  const water = () => bk.mix.liq.water || 100; const T = () => bk.mix.temp;
  // what is dissolved now (g) and what lies at the bottom
  st.cap = (t = T()) => alumSol(t) * water() / 100;
  st.dissolved = () => Math.min(st.g, st.cap());
  // lumps lying at the bottom of the beaker (as many as the grams not dissolved)
  const lumps = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.004, 0), std(0xf2f2ec, 0.4), 30); lumps.count = 0; lumps.userData.noHit = true; bk.g.add(lumps); const LR = rnd(11);
  const LP = Array.from({ length: 30 }, () => [LR() * TAU, Math.sqrt(LR()) * 0.024, LR() * 3]);
  const drawLumps = (gBottom) => { const n = Math.min(30, Math.round(gBottom * 1.6)); const d = new THREE.Object3D(); for (let i = 0; i < n; i++) { const [a, r, w] = LP[i]; d.position.set(Math.cos(a) * r, bk.inner[0].y + 0.003, Math.sin(a) * r); d.rotation.set(w, w * 2, w * 3); d.scale.setScalar(0.7 + (i % 3) * 0.25); d.updateMatrix(); lumps.setMatrixAt(i, d.matrix); } lumps.count = n; lumps.instanceMatrix.needsUpdate = true; };
  // small crystals that grow on the bottom and walls as it cools (the part that does not go onto the seed)
  const crust = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), std(0xf6f8f9, 0.15, 0, { op: 0.85 }), 40); crust.count = 0; crust.userData.noHit = true; bk.g.add(crust);
  const drawCrust = (g0) => { const n = Math.min(40, Math.round(g0 * 2.2)); const d = new THREE.Object3D(); const r = rnd(5); for (let i = 0; i < n; i++) { const a = r() * TAU, rr = 0.012 + r() * 0.018; d.position.set(Math.cos(a) * rr, bk.inner[0].y + 0.003, Math.sin(a) * rr); d.rotation.set(r() * 3, r() * 3, r() * 3); d.scale.setScalar(0.003 + 0.004 * Math.min(1, g0 / 8) * r()); d.updateMatrix(); crust.setMatrixAt(i, d.matrix); } crust.count = n; crust.instanceMatrix.needsUpdate = true; };
  // the sign: temperature, grams added, dissolved, crystal
  const sign = o.sign; const say = () => { const t = T(); const dis = st.dissolved(), bot = st.g - dis;
    if (st.hours > 0) { const m = st.grown; sign.set([`${W('Day')} ${(st.hours / 24).toFixed(1)} · ${t.toFixed(0)} °C · ${W('the water can hold')} ${st.cap().toFixed(1)} g`, m > 0.05 ? `${W('Crystal on the thread')}: ${m.toFixed(1)} g, ${(seed.size * 100).toFixed(1)} cm` : W('The seed crystal has dissolved')], ['#ffffff', m > 0.05 ? '#8be07a' : '#ffb46b']); return; }
    sign.set([`${W('Water')} 100 mL · ${t.toFixed(0)} °C · ${W('it can hold')} ${st.cap().toFixed(1)} g ${W('of alum')}`, `${W('Alum added')}: ${st.g} g · ${W('dissolved')}: ${dis.toFixed(1)} g${bot > 0.2 ? ' · ' + W('some stays at the bottom: saturated') : ''}`], ['#ffffff', bot > 0.2 ? '#8be07a' : '#ffd23f']); };
  // the beaker goes onto the tripod (by hand or Do it)
  const onTripod = async () => { if (st.onTp) return; st.onTp = true; await K.onTripod(bk, tp, lamp); };
  carry(bk, [{ open: () => stepNow(app, s.heat) && !st.onTp, at: () => tp.g.getWorldPosition(V(0, 0, 0)), r: 0.1, put: () => { bk.placed = true; onTripod(); } }], { lift: 0.18 }); bk.noGrab = true;
  // a spoonful of alum (5 g) carried from the jar into the beaker
  const addSpoon = async () => { st.g += 5; st.spoons++; drawLumps(st.g - st.dissolved()); app.audio && app.audio.clink && app.audio.clink(); say(); };
  carry(spoon, [{ open: () => stepNow(app, s.dissolve), at: () => bk.g.getWorldPosition(V(0, 0, 0)), r: 0.09, put: (t) => { t.placed = true; t.g.visible = false; addSpoon(); setTimeout(() => { t.g.position.copy(t.home.p); t.g.visible = true; t.placed = false; }, 400); } }], { lift: 0.2 });
  // the pencil across the beaker's mouth, the seed crystal hanging in the solution
  const hang = () => { if (st.hung) return Promise.resolve(); st.hung = true; const m = bk.mouthWorld(V(0, 0, 0)); seed.len = Math.max(0.01, m.y - bk.levelWorld() + 0.035); seed.setSize(seed.size); return moveP(seed, m.add(V(0, 0.004, 0)), new THREE.Quaternion(), 0.8); };
  carry(seed, [{ open: () => stepNow(app, s.hang), at: () => bk.g.getWorldPosition(V(0, 0, 0)), r: 0.1, put: () => { seed.placed = true; hang().then(chk); } }], { lift: 0.16 });
  const chk = () => { if (stepNow(app, s.hang) && st.hung && !lamp.lit) once('hang', done.hang); };
  // the calendar: hours after the lamp was put out (the solution cools to room temperature in about 3 hours)
  const T0 = 27, TAUH = 1.2, SEED0 = 0.4; // room temperature, cooling time (h), the seed (g)
  st.setH = (h) => { if (st.T0 == null) { st.T0 = T(); st.dis0 = st.dissolved(); st.bottom0 = st.g - st.dis0; } st.hours = Math.max(st.hours, h);
    const t = T0 + (st.T0 - T0) * Math.exp(-st.hours / TAUH); bk.mix.temp = t;
    const capNow = alumSol(t) * water() / 100; const excess = st.dis0 - capNow; // grams that must come out of the solution
    // slow cooling, a seed in the middle: a good part grows on the seed, the rest on the bottom and the walls
    const onSeed = Math.max(0, excess) * 0.45 * clamp01(st.hours / 30 + 0.3); st.grown = excess > 0 ? SEED0 + onSeed : Math.max(0, SEED0 + excess * 0.2 * clamp01(st.hours / 6));
    const vol = st.grown / 1.72; const edge = Math.cbrt(3 * vol / Math.SQRT2); seed.setSize(edge * Math.SQRT2 / 100); drawCrust(Math.max(0, excess) - onSeed); drawLumps(st.bottom0); say(); };
  slider(knob, { path: () => [V(0.12, Y + 0.02, -0.4), V(0.52, Y + 0.02, -0.4)], active: () => stepNow(app, s.days) && st.hung && !lamp.lit, keepVisible: () => app.runner.i === s.days, k: () => st.hours / 48,
    set: (k) => { st.setH(48 * k); if (st.hours >= 47.9) once('days', done.days); } });
  // the steps as they happen by hand
  const u0 = bk.update.bind(bk); let lastT = -1;
  bk.update = (dt) => { u0(dt); const i = app.runner.i;
    if (i === s.heat && st.onTp && lamp.lit && T() >= 55) once('heat', done.heat);
    if (i === s.dissolve && st.g - st.dissolved() > 0.4) once('dissolve', done.dissolve);
    if (i === s.hang) chk();
    // as the solution heats, what lay at the bottom dissolves
    if (i <= s.dissolve && Math.abs(T() - lastT) > 0.5) { lastT = T(); drawLumps(st.g - st.dissolved()); say(); }
    spoon.noGrab = !stepNow(app, s.dissolve); seed.noGrab = !stepNow(app, s.hang) || st.hung; bk.noGrab = !stepNow(app, s.heat) || st.onTp; };
  // Do it
  o.doHeat = async () => { await onTripod(); if (!lamp.lit) await K.light(lamp); while (T() < 60) await K.wait(0.5, 60); };
  o.doDissolve = async () => { let n = 0; while (st.g - st.dissolved() <= 0.4 && n++ < 30) { await moveP(spoon, bk.mouthWorld(V(0, 0, 0)).add(V(0, 0.04, 0)), null, 0.5); spoon.g.position.copy(spoon.home.p); await addSpoon(); await K.sleep(0.4); } };
  o.doHang = async () => { if (lamp.lit) await K.extinguish(lamp); await hang(); chk(); };
  say();
}

// ================================================================== the density of liquids
// o: { bal, jars: [water, oil, milk, salt water], cyls: [A, B, C, D], tare (knob), hyd, egg, sign }. s: { l0…l3, hyd, egg }.
export function bindDensity(o, K, s, done = {}) {
  const app = K.app, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  const { bal, jars, cyls, hyd, egg, W } = o; const KEYS = ['water', 'moil', 'milkfull', 'nacl'];
  const rec = o.rec = [null, null, null, null]; // what the student measured: { m, v, tared }
  // each cylinder's mass on the balance comes from the liquids really in it, at their own density
  for (const c of cyls) { c.glassG = 63.4 + cyls.indexOf(c) * 0.7; Object.defineProperty(c, 'ledger', { get: () => rhoOf(c).m, set: () => {}, configurable: true }); }
  const panW = () => bal.g.localToWorld(V(0, bal.panTop + 0.0005, -0.008));
  let tared = null; // the cylinder the balance was tared with
  const onPan = (c) => bal.on.includes(c);
  const putOnPan = (c) => { for (const x of [...bal.on]) if (x !== c) { bal.on.splice(bal.on.indexOf(x), 1); moveT(x, x.home0.p.clone(), x.home0.q.clone(), 0.7); } if (!bal.on.includes(c)) bal.on.push(c); bal.settle = 0.8; tared = null; return moveP(c, panW(), new THREE.Quaternion(), 0.7); };
  for (const c of cyls) { c.home0 = { p: c.g.position.clone(), q: c.g.quaternion.clone() }; carry(c, [{ open: () => app.runner.state === 'todo', at: panW, r: 0.07, put: (t) => { t.placed = true; putOnPan(t); } }], { lift: 0.16 }); }
  const tare = () => { bal.tare(); tared = bal.on[0] || null; app.audio && app.audio.tone && app.audio.tone(2000, 0.06, 0.05, 'square'); K.lab.emit('tare', { v: bal.id }); };
  button(o.tare, { path: () => [bal.g.localToWorld(V(0.046, 0.06, 0.1)), bal.g.localToWorld(V(0.046, 0.02, 0.1))], active: () => app.runner.state === 'todo', keepVisible: () => true, press: tare });
  // a measuring step is done when its cylinder is on the pan, has liquid in it, and nothing has been poured for a moment
  let lastPour = 0; K.lab.listeners.push((e) => { if (e.type === 'pouring') lastPour = performance.now(); });
  const table = () => { const L = [W('Water'), W('Mustard oil'), W('Milk'), W('Salt water')]; return rec.map((r, i) => (r ? `${L[i]}: ${r.m.toFixed(1)} g ÷ ${r.v} mL = ${(r.m / r.v).toFixed(2)} g/mL` : null)).filter(Boolean); };
  const say = (extra) => { const t = table(); const live = bal.on[0] ? `${W('Balance')}: ${bal.reading().toFixed(2)} g · ${W('cylinder')}: ${Math.round(bal.on[0].ml)} mL${tared === bal.on[0] ? '' : ' · ' + W('not tared')}` : W('Put a cylinder on the balance');
    o.sign.set([extra || live, ...(t.length ? [t.slice(-2).join('   ')] : [W('density = mass ÷ volume')])], [extra ? '#ffb46b' : '#ffffff', '#ffd23f']); };
  o.say = say;
  const u0 = bal.update; let tick = 0;
  bal.update = (dt) => { u0(dt); tick += dt; const i = app.runner.i; const li = [s.l0, s.l1, s.l2, s.l3].indexOf(i);
    if (li >= 0 && app.runner.state === 'todo') { const c = cyls[li]; if (onPan(c) && c.ml > 8 && performance.now() - lastPour > 1300) { rec[li] = { m: bal.reading(), v: Math.round(c.ml), tared: tared === c }; once('l' + li, done['l' + li]); } }
    if (tick > 0.25) { tick = 0; say(); } };
  // Do it: put the cylinder on, tare, pour 50 mL
  o.doMeasure = async (li) => { const c = cyls[li]; if (!onPan(c)) await putOnPan(c); await K.sleep(0.4); if (tared !== c) tare(); await K.sleep(0.5); await K.pour(jars[li], c, 50 - c.ml); await K.sleep(0.6); c.home = { p: c.g.position.clone(), q: c.g.quaternion.clone() }; await wait(1400); };
  // the hydrometer: let go over a jar, it floats at the depth set by that liquid's density, and bobs a little
  hyd.inJar = null; hyd.been = new Set();
  const floatIn = (j) => { const li = jars.indexOf(j); const rho = RHO[KEYS[li]]; const depth = hyd.depthCm(rho) / 100; const top = j.levelWorld(); hyd.inJar = j; hyd.rho = rho; hyd.been.add(li);
    const p = j.g.getWorldPosition(V(0, 0, 0)); p.y = top - depth; return moveP(hyd, p, new THREE.Quaternion(), 0.9).then(() => { hyd.bob = 1; }); };
  carry(hyd, jars.map((j) => ({ open: () => stepNow(app, s.hyd), at: () => j.g.getWorldPosition(V(0, 0, 0)), r: 0.045, put: (t) => { t.placed = true; floatIn(j); } })), { lift: 0.32 });
  const hTag = tag('1.00', '#ffd23f', 0.026); K.app.scene.add(hTag); K.extras.push(hTag); hTag.visible = false;
  hyd.update = (dt) => { if (hyd.bob > 0 && !hyd.held && !hyd.flying) { hyd.bob = Math.max(0, hyd.bob - dt * 0.5); hyd.g.position.y = hyd.home.p.y + Math.sin(performance.now() / 160) * 0.004 * hyd.bob; }
    hTag.visible = !!hyd.inJar && !hyd.held && !hyd.flying; if (hTag.visible) { hTag.position.copy(hyd.inJar.g.getWorldPosition(V(0, 0, 0))).add(V(0.06, 0.3, 0)); hTag.setText(`${hyd.rho.toFixed(2)} g/mL`); }
    if (stepNow(app, s.hyd) && hyd.been.size === 4) once('hyd', done.hyd); };
  // the egg (1.08 g/mL): sinks in water, oil and milk; floats in the strong salt water
  egg.inJar = null; egg.been = new Set(); egg.rho = 1.08;
  const dropEgg = (j) => { const li = jars.indexOf(j); const rho = RHO[KEYS[li]]; egg.inJar = j; egg.been.add(li); const p = j.g.getWorldPosition(V(0, 0, 0)); const fl = rho > egg.rho;
    const yB = j.g.localToWorld(V(0, j.inner[0].y + 0.001, 0)).y; p.y = fl ? j.levelWorld() - 0.028 * Math.min(0.97, egg.rho / rho) : yB; return moveP(egg, p, null, fl ? 1.2 : 1.6); };
  carry(egg, jars.map((j) => ({ open: () => stepNow(app, s.egg), at: () => j.g.getWorldPosition(V(0, 0, 0)), r: 0.045, put: (t) => { t.placed = true; dropEgg(j).then(() => { if (egg.been.has(0) && egg.been.has(3)) once('egg', done.egg); }); } })), { lift: 0.32 });
  o.doHyd = async () => { for (const j of jars) { await floatIn(j); await K.sleep(1.2); } };
  o.doEgg = async () => { await dropEgg(jars[0]); await K.sleep(1); await dropEgg(jars[3]); once('egg', done.egg); };
  say();
}

// ================================================================== the molecule kit
const EL = { H: N3('hydrogen', 'हाइड्रोजन', 'hydrogen'), C: N3('carbon', 'कार्बन', 'carbon'), N: N3('nitrogen', 'नाइट्रोजन', 'nitrogen'), O: N3('oxygen', 'ऑक्सीजन', 'oxygen'), Na: N3('sodium', 'सोडियम', 'sodium'), Cl: N3('chlorine', 'क्लोरीन', 'chlorine') };
// o: { mk (the kit), tray: world point, knobSpace, W, X (translator), L () → language }. s: step numbers by molecule.
export function bindMolecules(o, K, s, done = {}) {
  const app = K.app, mk = o.mk, fired = new Set(); const once = (k, f) => { if (fired.has(k)) return; fired.add(k); f && f(); };
  let pieces = [];
  const lang = () => app.lang; const tr = (x) => (x[lang()] || x.en);
  // the atoms laid out for a step (the right ones and a spare or two)
  const lay = (list) => { for (const p of pieces) { p.g.parent && p.g.parent.remove(p.g); const i = K.lab.items.indexOf(p); if (i >= 0) K.lab.items.splice(i, 1); } pieces = [];
    list.forEach((el, n) => { const grp = new THREE.Group(); let r = 0.012;
      if (el === 'bond') { const sp = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0026, 8, 20, Math.PI), std(0xb8bcc2, 0.35, 0.3)); sp.position.y = 0.004; grp.add(sp); }
      else if (el === 'OH') { const a = new THREE.Mesh(new THREE.SphereGeometry(ATOM.O.r, 20, 14), mat('sxballO', () => new THREE.MeshStandardMaterial({ color: ATOM.O.c, roughness: 0.32 }))); a.position.y = ATOM.O.r; const h = new THREE.Mesh(new THREE.SphereGeometry(ATOM.H.r, 16, 12), mat('sxballH', () => new THREE.MeshStandardMaterial({ color: ATOM.H.c, roughness: 0.32 }))); h.position.set(0.024, ATOM.O.r + 0.012, 0); grp.add(a, h); r = 0.02; }
      else { const A = ATOM[el]; const a = new THREE.Mesh(new THREE.SphereGeometry(A.r, 22, 16), mat('sxball' + el, () => new THREE.MeshStandardMaterial({ color: A.c, roughness: 0.32 }))); a.position.y = A.r; grp.add(a); r = A.r; }
      grp.traverse((m) => { m.castShadow = true; });
      const nm = el === 'bond' ? N3('Bond (a spring)', 'बंध (एक स्प्रिंग)', 'Bond (spring)') : el === 'OH' ? N3('–OH group', '–OH समूह', '–OH group') : EL[el];
      const p = K.add(thing(nm, grp, { hitR: Math.max(0.018, r * 1.4), hitY: r }), 0, 0, { y: Y }); const at = o.trayAt(n, list.length); p.g.position.copy(at); p.home = { p: at.clone(), q: new THREE.Quaternion() }; p.el = el;
      carry(p, [{ open: () => app.runner.state === 'todo', at: () => mk.cenW().setY(Y), r: 0.11, put: (t) => use(t) }], { lift: 0.16 }); pieces.push(p); }); };
  const back = (t) => { t.placed = true; moveT(t, t.home.p.clone(), t.home.q.clone(), 0.7, () => { t.placed = false; }); };
  // a piece let go over the board
  const use = (t) => { if (mk.key === 'salt') return salt(t);
    const res = t.el === 'bond' ? mk.tryBond(t.g.getWorldPosition(V(0, 0, 0))) : mk.tryAdd(t.el === 'OH' ? 'O' : t.el, t.g.getWorldPosition(V(0, 0, 0)), t.el === 'OH');
    if (res.ok) { t.g.visible = false; t.noGrab = true; t.used = true; app.audio && app.audio.clink && app.audio.clink(); check(); return; }
    mk.show(o.why(res, t.el, mk.M)); back(t); };
  const check = () => { if (!mk.complete()) return; const k = mk.key; once(k, done[k]); };
  // salt: sodium meets chlorine: one electron jumps across, the two become ions and pull together (no bond stick)
  const salt = (t) => { if (t.el !== 'Na') { mk.show(o.why({ why: 'ion' }, t.el)); back(t); return; } t.noGrab = true; t.used = true; const cl = mk.saltCl; const to = mk.mol.localToWorld(V(-0.07, 0, 0)); moveT(t, to.setY(to.y - ATOM.Na.r), null, 0.7, () => electron(t, cl)); };
  const electron = (na, cl) => { const e = sph(0.0035, glowM(0xffe14a), 0, 0, 0, 10); app.scene.add(e); K.extras.push(e); const a = na.g.getWorldPosition(V(0, 0, 0)).add(V(0, ATOM.Na.r + 0.012, 0)), b = mk.mol.localToWorld(V(0, 0.022, 0)); let k = 0; const dt = clock();
    const step = () => { k = Math.min(1, k + dt() / 1.4); e.position.lerpVectors(a, b, ease(k)); e.position.y += Math.sin(k * Math.PI) * 0.04; if (k < 1) requestAnimationFrame(step); else { app.scene.remove(e); ions(na); } }; step(); };
  const ions = (na) => { na.g.children[0].scale.setScalar(0.62); mk.saltCl.scale.setScalar(1.25); const to = mk.mol.localToWorld(V(-0.045, 0, 0)); moveT(na, to.setY(to.y - ATOM.Na.r * 0.62), null, 0.8, () => {
    const a = tag('Na⁺', '#c9a8ff', 0.026); a.position.copy(na.g.getWorldPosition(V(0, 0.05, 0))); const b = tag('Cl⁻', '#9be08f', 0.026); b.position.copy(mk.mol.localToWorld(V(0, 0.05, 0))); app.scene.add(a, b); K.extras.push(a, b); mk.saltNa = na; once('salt', done.salt); }); };
  mk.startSalt = () => { mk.start('water'); mk.mol.clear(); mk.key = 'salt'; mk.M = { f: 'NaCl', atoms: [], bonds: [] }; const cl = new THREE.Mesh(new THREE.SphereGeometry(ATOM.Cl.r, 24, 16), mat('sxballCl', () => new THREE.MeshStandardMaterial({ color: ATOM.Cl.c, roughness: 0.32 }))); mk.mol.add(cl); mk.saltCl = cl; mk.show(o.saltLine()); };
  // each step starts its molecule (the one before goes to the shelf)
  const SETS = { water: ['O', 'H', 'H', 'H', 'C'], co2: ['C', 'O', 'O', 'bond', 'bond', 'H'], methane: ['C', 'H', 'H', 'H', 'H', 'H'], ammonia: ['N', 'H', 'H', 'H', 'O'], ethanol: ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H', 'N'], glucose: ['OH', 'OH', 'OH', 'OH', 'OH', 'H'], salt: ['Na', 'H'] };
  let lastI = -1;
  const u0 = mk.update; mk.update = (dt, t) => { if (u0) u0(dt, t); const i = app.runner.i; if (i === lastI) return; lastI = i;
    const key = Object.keys(s).find((k) => s[k] === i && SETS[k]); if (!key) { for (const p of pieces) p.g.visible = false; return; }
    if (mk.M && mk.key !== 'salt' && mk.complete() && mk.key !== key) mk.toShelf(); else if (mk.key === 'salt' && mk.saltNa && key !== 'salt') { mk.saltNa.g.visible = false; }
    if (key === 'salt') mk.startSalt(); else if (mk.key !== key) mk.start(key); lay(SETS[key]); };
  mk._dbg = () => ({ pieces: pieces.length, lastI });
  // Do it: the right pieces, in an order that works
  o.build = async (key) => { const want = { water: ['O', 'H', 'H'], co2: ['C', 'O', 'O', 'bond', 'bond'], methane: ['C', 'H', 'H', 'H', 'H'], ammonia: ['N', 'H', 'H', 'H'], ethanol: ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H'], glucose: ['OH', 'OH', 'OH', 'OH', 'OH'], salt: ['Na'] }[key];
    for (const el of want) { const p = pieces.find((x) => !x.used && x.el === el); if (!p) continue; let to = mk.cenW(); if (mk.M && key !== 'salt') { const M = mk.M; const nxt = M.atoms.findIndex(([e], i) => !mk.placed.has(i) && e === (el === 'OH' ? 'O' : el) && (!M.groups || (el === 'OH') === M.groups.includes(i)) && (mk.placed.size === 0 || M.bonds.some(([a, b]) => (a === i && mk.placed.has(b)) || (b === i && mk.placed.has(a))))); if (nxt >= 0) { const q = M.atoms[nxt][1]; to = mk.mol.localToWorld(V(q[0] * 0.032, q[1] * 0.032, q[2] * 0.032)); } }
      await moveP(p, to, null, 0.45); use(p); await K.sleep(0.25); }
    if (key === 'salt') await K.sleep(3.2); };
  // ball-and-stick ↔ space-filling
  button(o.knobSpace, { path: () => [mk.g.localToWorld(V(0.3, 0.08, -0.25)), mk.g.localToWorld(V(0.3, 0.03, -0.25))], active: () => stepNow(app, s.space), keepVisible: () => app.runner.i === s.space, press: () => { mk.setSpace(!mk.space); once('space', done.space); } });
  o.doSpace = () => { mk.setSpace(true); once('space', done.space); };
}
