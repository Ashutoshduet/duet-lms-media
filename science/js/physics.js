// Real physics for the things on the bench (Rapier, Apache-2.0). Anything a student lets go of falls, rolls, tips over or
// can be thrown; glass that hits the bench or the floor hard enough breaks into pieces and whatever was in it spills.
// Things nobody has touched stay exactly where an experiment put them (they still block what is thrown at them).
import * as THREE from 'three';
import { BENCH_Y, BENCH } from './room.js';

let R = null;
export async function initPhysics(app) {
  try { const m = await import('../lib/rapier/rapier.mjs'); R = m.default || m; await R.init(); return new Physics(app); }
  catch (e) { console.warn('physics', e); return null; }
}
const GLASS = new Set(['beaker', 'testtube', 'boilingtube', 'flask', 'conical', 'rbflask', 'cylinder', 'measuring', 'watchglass', 'dish', 'bottle', 'dropbottle', 'jar', 'thermo', 'prism', 'slab', 'lens', 'pmirror', 'cmirror', 'burette', 'pipette', 'funnel', 'petri', 'bulb12', 'glass']);
// a soft, random wobble for the surface of spilled liquid: lights glint on it in small broken highlights, as on a real wet patch
let _ripple = null;
function rippleTex() {
  if (_ripple) return _ripple;
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'); const img = x.createImageData(N, N);
  const h = new Float32Array(N * N); for (let k = 0; k < 9; k++) { const cx = Math.random() * N, cy = Math.random() * N, r = 10 + Math.random() * 26, a = Math.random() * 2 - 1;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let dx = Math.abs(i - cx), dy = Math.abs(j - cy); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy); h[j * N + i] += a * Math.exp(-(dx * dx + dy * dy) / (r * r)); } }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const gx = h[j * N + (i + 1) % N] - h[j * N + (i + N - 1) % N], gy = h[((j + 1) % N) * N + i] - h[((j + N - 1) % N) * N + i]; const o = (j * N + i) * 4;
    img.data[o] = 128 - gx * 300; img.data[o + 1] = 128 - gy * 300; img.data[o + 2] = 255; img.data[o + 3] = 255; }
  x.putImageData(img, 0, 0); _ripple = new THREE.CanvasTexture(cv); _ripple.wrapS = _ripple.wrapT = THREE.RepeatWrapping; return _ripple;
}
const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4(), tmpB = new THREE.Box3();
const BREAK_DV = 2.4; // m/s: a beaker dropped from about 30 cm onto a hard top breaks

export class Physics {
  constructor(app) {
    this.app = app; this.lab = app.lab; this.world = new R.World({ x: 0, y: -9.81, z: 0 }); this.bodies = new Map(); this.puddles = []; this.shards = [];
    const fixed = (hx, hy, hz, x, y, z) => { const b = this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x, y, z)); this.world.createCollider(R.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.7).setRestitution(0.15), b); };
    fixed(6, 0.05, 6, 0, -0.05, 0); // floor
    const bw = (BENCH.x1 - BENCH.x0) / 2, bd = (BENCH.z1 - BENCH.z0) / 2; fixed(bw, BENCH_Y / 2, bd, (BENCH.x0 + BENCH.x1) / 2, BENCH_Y / 2, (BENCH.z0 + BENCH.z1) / 2); // our bench
    const ri = app.roomInfo || {}; const sz = ri.shelfZ ?? BENCH.z0 + 0.09; for (const y of ri.shelfY || []) fixed(0.75, 0.008, 0.075, -0.2, y - 0.008, sz); // the two-tier reagent rack
    for (const [x, z] of [[-2.2, 1.0], [2.2, 1.0], [-2.2, 2.6], [2.2, 2.6]]) fixed(1.1, BENCH_Y / 2, 0.375, x, BENCH_Y / 2, z); // the side benches
    for (const [hx, hz, x, z] of [[3.8, 0.05, 0, -3.65], [3.8, 0.05, 0, 3.65], [0.05, 3.6, -3.85, 0], [0.05, 3.6, 3.85, 0]]) fixed(hx, 1.7, hz, x, 1.7, z); // walls
    this.surfaces = [{ y: BENCH_Y, x0: BENCH.x0, x1: BENCH.x1, z0: BENCH.z0, z1: BENCH.z1 }, ...[[-2.2, 1.0], [2.2, 1.0], [-2.2, 2.6], [2.2, 2.6]].map(([x, z]) => ({ y: BENCH_Y, x0: x - 1.1, x1: x + 1.1, z0: z - 0.375, z1: z + 0.375 }))];
    this.lab.listeners.push((e) => { if (e.type === 'pouring' && e.spill && e.at) this.puddle(e.at, e.ml, e.color); });
  }
  // the top surface (bench or floor) under a point
  surfaceY(x, z) { for (const s of this.surfaces) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1) return s.y; return 0; }
  // ---------------------------------------------------------------- every item gets a body: kinematic while it is placed, dynamic once let go
  shapeOf(it) {
    const g = it.g; g.updateWorldMatrix(true, true); tmpB.makeEmpty();
    const inv = tmpM.copy(g.matrixWorld).invert(); g.traverse((o) => { if (o.isMesh && o.visible && o.geometry && !o.userData.noHit) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv); tmpB.union(b); } });
    if (tmpB.isEmpty()) tmpB.set(new THREE.Vector3(-0.02, 0, -0.02), new THREE.Vector3(0.02, 0.04, 0.02));
    const s = tmpB.getSize(new THREE.Vector3()), c = tmpB.getCenter(new THREE.Vector3());
    const round = it.inner || ['thermo', 'bottle', 'jar'].includes(it.kind);
    return { round, hx: Math.max(0.002, s.x / 2), hy: Math.max(0.002, s.y / 2), hz: Math.max(0.002, s.z / 2), c, r: Math.max(0.004, Math.max(s.x, s.z) / 2) };
  }
  track(it) {
    if (this.bodies.has(it) || it.noPhys || it.kind === 'circuit') return this.bodies.get(it);
    const sh = this.shapeOf(it); const p = it.g.getWorldPosition(new THREE.Vector3()), q = it.g.getWorldQuaternion(new THREE.Quaternion());
    const body = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x, p.y, p.z).setRotation(q).setCcdEnabled(true).setLinearDamping(0.05).setAngularDamping(0.25));
    const cd = sh.round ? R.ColliderDesc.cylinder(sh.hy, sh.r) : R.ColliderDesc.cuboid(sh.hx, sh.hy, sh.hz);
    const vol = sh.round ? Math.PI * sh.r * sh.r * sh.hy * 2 : 8 * sh.hx * sh.hy * sh.hz; const mass = it.mass ?? Math.min(1.2, Math.max(0.01, vol * (it.inner ? 450 : 900))); // hollow glass is light; solids heavier
    cd.setTranslation(sh.c.x, sh.c.y, sh.c.z).setMass(mass).setFriction(it.inner ? 0.45 : 0.6).setRestitution(this.isGlass(it) ? 0.08 : 0.25);
    const col = this.world.createCollider(cd, body); const rec = { body, col, dyn: false, still: 0, v0: new THREE.Vector3(), t: 0 }; this.bodies.set(it, rec); return rec;
  }
  isGlass(it) { return it.glass ?? (GLASS.has(it.kind) || (!!it.inner && !it.plastic && !it.metal)); }
  forget(it) { const r = this.bodies.get(it); if (!r) return; this.world.removeRigidBody(r.body); this.bodies.delete(it); }
  // let go: the item is now a real body (v and w: hand velocity and spin, for throwing)
  drop(it, v, w) {
    const r = this.track(it); if (!r) return false; const p = it.g.getWorldPosition(tmpV), q = it.g.getWorldQuaternion(tmpQ);
    r.body.setBodyType(R.RigidBodyType.Dynamic, true); if (r.body.recomputeMassPropertiesFromColliders) r.body.recomputeMassPropertiesFromColliders(); r.body.setTranslation(p, true); r.body.setRotation(q, true); r.body.wakeUp();
    if (v) r.body.setLinvel({ x: v.x, y: v.y, z: v.z }, true); if (w) r.body.setAngvel({ x: w.x, y: w.y, z: w.z }, true);
    r.dyn = true; r.still = 0; r.t = 0; r.v0.set(v ? v.x : 0, v ? v.y : 0, v ? v.z : 0); it.home = null; return true;
  }
  // ---------------------------------------------------------------- every frame
  step(dt) {
    dt = Math.min(dt, 1 / 30); if (dt <= 0) return;
    for (const it of this.lab.items) if (!this.bodies.has(it) && it.g.parent === this.app.scene) this.track(it);
    for (const [it, r] of this.bodies) {
      if (!this.lab.byId[it.id] || it.broken || (it.inVessel && !it.held)) { this.forget(it); continue; } // a solid lying in a vessel moves with it and must not push it from inside
      if (it.held || it.g.parent !== this.app.scene) { if (r.dyn) { r.body.setBodyType(R.RigidBodyType.KinematicPositionBased, true); r.dyn = false; } }
      if (!r.dyn) { it.g.getWorldPosition(tmpV); it.g.getWorldQuaternion(tmpQ); r.body.setNextKinematicTranslation(tmpV); r.body.setNextKinematicRotation(tmpQ); }
      else { const lv = r.body.linvel(); r.v0.set(lv.x, lv.y, lv.z); }
    }
    this.world.timestep = dt; this.world.step();
    for (const [it, r] of this.bodies) {
      if (!r.dyn) continue; r.t += dt;
      const t = r.body.translation(), q = r.body.rotation(); it.g.position.set(t.x, t.y, t.z); it.g.quaternion.set(q.x, q.y, q.z, q.w);
      const lv = r.body.linvel(); const dv = Math.hypot(lv.x - r.v0.x, lv.y - r.v0.y, lv.z - r.v0.z);
      if (dv > BREAK_DV && r.t > 0.05 && this.isGlass(it)) { this.shatter(it, Math.min(1, (dv - BREAK_DV) / 3), dv); continue; }
      if (dv > 0.8) { const a = this.app.audio; a && a.clink && a.clink(); this.lab.emit('hit', { obj: it.id, dv }); }
      const sp = Math.hypot(lv.x, lv.y, lv.z); r.still = sp < 0.03 ? r.still + dt : 0;
      if (t.y < -1 || r.still > 0.6 || r.body.isSleeping()) { // at rest again: it stays where it ended up
        r.body.setBodyType(R.RigidBodyType.KinematicPositionBased, true); r.dyn = false; it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.lab.emit('rest', { obj: it.id });
      }
    }
    this.updateShards(dt); this.updatePuddles(dt);
  }
  // ---------------------------------------------------------------- broken glass
  shatter(it, k = 0.5, dv = null) {
    if (it.broken) return; it.broken = true; const scene = this.app.scene; const p = it.g.getWorldPosition(new THREE.Vector3()); const top = this.surfaceY(p.x, p.z);
    const col = new THREE.Color(it.kind === 'prism' || it.kind === 'slab' || it.kind === 'lens' ? 0xd8eef2 : 0xe8f4f8);
    const mat = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const n = 26 + Math.round(18 * k); const r0 = Math.max(0.01, it.radius ?? 0.02);
    for (let i = 0; i < n; i++) {
      const s = r0 * (0.15 + Math.random() * 0.35); const g = new THREE.BufferGeometry(); const a = [0, 0, 0, s, (Math.random() - 0.3) * s, 0, (Math.random() - 0.5) * s, s * (0.4 + Math.random() * 0.6), 0];
      g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.renderOrder = 6;
      m.position.set(p.x + (Math.random() - 0.5) * r0, Math.max(top + 0.004, p.y + Math.random() * (it.height ?? 0.05) * 0.6), p.z + (Math.random() - 0.5) * r0); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); scene.add(m);
      const sp = 0.6 + 1.6 * Math.random() * (0.5 + k); const ang = Math.random() * Math.PI * 2;
      this.shards.push({ m, v: new THREE.Vector3(Math.cos(ang) * sp, 0.6 + Math.random() * 1.6, Math.sin(ang) * sp), w: new THREE.Vector3(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10), rest: false });
    }
    const a = this.app.audio; if (a && a.crash) a.crash(); else if (a && a.clink) { a.clink(); setTimeout(() => a.clink(), 60); setTimeout(() => a.clink(), 140); }
    if (it.mix && it.ml > 0.5) { const c = it.color ?? 0x9fc6ff; this.puddle(new THREE.Vector3(p.x, top, p.z), it.ml, c); it.mix.take(it.ml); it.ml = 0; }
    it.g.visible = false; this.forget(it); if (dv != null) this.lab.emit('broken', { obj: it.id, kind: it.kind, dv, floor: top < 0.1 });
  }
  updateShards(dt) {
    for (const s of this.shards) {
      if (s.rest) continue; const m = s.m; s.v.y -= 9.81 * dt; m.position.addScaledVector(s.v, dt); m.rotation.x += s.w.x * dt; m.rotation.y += s.w.y * dt; m.rotation.z += s.w.z * dt;
      const top = this.surfaceY(m.position.x, m.position.z) + 0.0008; if (m.position.y <= top) { m.position.y = top; if (Math.abs(s.v.y) < 0.4) { s.rest = true; m.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3; m.rotation.y = 0; } else { s.v.y *= -0.25; s.v.x *= 0.5; s.v.z *= 0.5; s.w.multiplyScalar(0.5); } }
    }
  }
  // ---------------------------------------------------------------- spilled liquid spreads into a thin pool on the bench or the floor
  // A spill should look like liquid on the bench: the wet patch is darker than the dry bench and glossy (it mirrors the room
  // and the lights), with an uneven edge. A coloured liquid (copper sulphate, ink) tints it; clear water only darkens and shines.
  puddle(at, ml, color = 0x9fc6ff) {
    const y = this.surfaceY(at.x, at.z) + 0.0006; let pd = this.puddles.find((q) => q.m.position.distanceTo(tmpV.set(at.x, y, at.z)) < Math.max(0.03, q.r * 0.8));
    if (!pd) {
      const sh = new THREE.Shape(); const n = 36, lobes = 3 + Math.floor(Math.random() * 3), ph = Math.random() * 6.28;
      for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; const r = 1 + 0.13 * Math.sin(lobes * a + ph) + 0.06 * Math.sin((lobes + 2) * a + ph * 1.7); const px = Math.cos(a) * r, pz = Math.sin(a) * r; if (i) sh.lineTo(px, pz); else sh.moveTo(px, pz); }
      const mat = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.34, roughness: 0.07, metalness: 0, envMapIntensity: 1.3, normalMap: rippleTex(), normalScale: new THREE.Vector2(0.18, 0.18), depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 2), mat); m.rotation.x = -Math.PI / 2; m.position.set(at.x, y, at.z); m.renderOrder = 4; m.scale.setScalar(0.001); this.app.scene.add(m);
      // the edge of a spill catches the light (the little raised rim of the liquid): a thin bright band along the outline
      const band = new THREE.Shape(sh.getPoints(n)); band.holes.push(new THREE.Path(sh.getPoints(n).map((p) => p.clone().multiplyScalar(0.955)).reverse()));
      const rim = new THREE.Mesh(new THREE.ShapeGeometry(band, 1), new THREE.MeshBasicMaterial({ color: 0xdfeaf2, transparent: true, opacity: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
      rim.position.z = 0.0002; rim.renderOrder = 5; m.add(rim);
      pd = { m, ml: 0, r: 0.001, grow: 0, col: new THREE.Color(0x000000), tw: 0 }; this.puddles.push(pd);
    }
    const c = new THREE.Color(color); const hsl = c.getHSL({}); const tinted = hsl.s > 0.25 && hsl.l < 0.85; // clear water and colourless solutions: no tint
    const w = Math.min(1, ml / Math.max(1, pd.ml + ml)); pd.ml += ml;
    // a thin coloured film on a black bench looks dark and only tinted (deep blue for copper sulphate), never like paint
    pd.col.lerp(tinted ? c.clone().lerp(new THREE.Color(0.02, 0.025, 0.03), 0.4).multiplyScalar(0.2) : new THREE.Color(0.012, 0.016, 0.02), w); pd.tw += ((tinted ? 1 : 0) - pd.tw) * w;
    pd.m.material.color.copy(pd.col); pd.m.material.opacity = 0.5 + 0.04 * pd.tw;
  }
  updatePuddles(dt) { for (const pd of this.puddles) { const want = Math.sqrt(pd.ml * 1e-6 / (Math.PI * 0.003)); if (pd.r < want) { pd.r = Math.min(want, pd.r + dt * 0.25); pd.m.scale.set(pd.r, pd.r * (0.85 + 0.15 * Math.sin(pd.ml)), 1); } } } // about 1.2 mm deep
  clear() {
    for (const s of this.shards) s.m.parent && s.m.parent.remove(s.m); for (const pd of this.puddles) pd.m.parent && pd.m.parent.remove(pd.m); this.shards = []; this.puddles = [];
    for (const it of [...this.bodies.keys()]) this.forget(it);
  }
}
