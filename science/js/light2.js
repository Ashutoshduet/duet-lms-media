// Physics (Class 8): light. A ray-optics disc with a printed protractor, a ray box with one or three slits, a 2D beam tracer
// (plane / concave / convex mirror strips, thin cylindrical lenses, a glass block) that draws the beams as bright streaks on the
// black board, a shiny steel spoon that really reflects the room (cube-camera environment map), sunlight focused by a lens or a
// concave mirror onto paper that chars and smokes, a drop of water that magnifies print, a lamp-and-ball model of the Moon's
// phases, and a stick whose shadow follows a moving lamp "Sun".
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';
import * as RF from './refraction.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const D = Math.PI / 180;
const yawOf = (g) => { const e = V3(1, 0, 0).applyQuaternion(g.quaternion); return Math.atan2(-e.z, e.x); };

// ------------------------------------------------------------------ a black board with a white printed angle disc (a ray-optics kit); paper coordinates as on the drawing board
export function opticsDisc(o = {}) {
  const W = o.w ?? 0.44, H = o.h ?? 0.34; const it = new Item('odisc', { ...o, name: o.name || { en: 'Ray-optics board with an angle disc', hi: 'कोण-चक्र वाला किरण-प्रकाशिकी बोर्ड', hg: 'Angle disc wala ray-optics board' } });
  const R = o.r ?? 0.12; const tex = canvasTex(1024, Math.round((1024 * H) / W), (x, w, h) => { x.fillStyle = '#16181c'; x.fillRect(0, 0, w, h); const s = w / W; const cx = w / 2, cy = h / 2 + (o.cy ?? 0) * s;
    if (o.disc !== false) { x.strokeStyle = 'rgba(235,235,225,0.85)'; x.fillStyle = 'rgba(235,235,225,0.85)'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, R * s, 0, Math.PI * 2); x.stroke();
      for (let a = 0; a < 360; a += 5) { const r = a * D; const L = a % 10 === 0 ? 16 : 8; x.beginPath(); x.moveTo(cx + Math.cos(r) * R * s, cy - Math.sin(r) * R * s); x.lineTo(cx + Math.cos(r) * (R * s - L), cy - Math.sin(r) * (R * s - L)); x.stroke(); if (a % 30 === 0) { const ang = ((a + 360 - 90) % 180); const lab = String(ang > 90 ? 180 - ang : ang); x.font = '600 18px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(lab, cx + Math.cos(r) * (R * s - 30), cy - Math.sin(r) * (R * s - 30)); } }
      x.setLineDash([10, 8]); x.beginPath(); x.moveTo(cx, cy - R * s); x.lineTo(cx, cy + R * s); x.stroke(); x.setLineDash([]); x.font = '700 22px sans-serif'; x.fillText('N', cx + 14, cy + R * s - 14); x.beginPath(); x.moveTo(cx - R * s * 1.15, cy); x.lineTo(cx + R * s * 1.15, cy); x.stroke(); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(W, 0.006, H), [0, 1, 2, 3, 4, 5].map((i) => (i === 2 ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }) : new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.8 })))); m.position.y = 0.003; it.g.add(m);
  it.W = W; it.H = H; it.surfY = 0.0062; it.toLocal = (u, v) => V3(u, it.surfY, -v); it.R = R; it.height = 0.006; it.radius = Math.max(W, H) / 2; it.grabY = 0.003; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a ray box with 1 or 3 slits (parallel beams 1.2 cm apart); the beams leave along local +x
export function rayBox2(o = {}) {
  const n = o.slits ?? 1; const it = new Item('raybox', { ...o, name: o.name || (n > 1 ? { en: 'Ray box with three slits (parallel beams)', hi: 'तीन झिरियों वाला किरण बॉक्स (समांतर किरणें)', hg: 'Teen slits wala ray box (parallel beams)' } : { en: 'Ray box (lamp with a narrow slit)', hi: 'किरण बॉक्स (पतली झिरी वाला लैंप)', hg: 'Ray box (patli slit wala lamp)' }) });
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x26334a, roughness: 0.45, metalness: 0.5 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), bodyM); body.position.y = 0.02; it.g.add(body);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.04, 0.058), new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.5 })); plate.position.set(0.031, 0.02, 0); it.g.add(plate);
  const sm = new THREE.MeshBasicMaterial({ color: 0x3a3a3a }); it.slits = []; for (let i = 0; i < n; i++) { const z = (i - (n - 1) / 2) * 0.012; const s = new THREE.Mesh(new THREE.PlaneGeometry(0.0012, 0.026), sm); s.rotation.y = Math.PI / 2; s.position.set(0.0322, 0.017, z); it.g.add(s); it.slits.push(V3(0.0322, 0.002, z)); }
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.03, 0.01, 0), V3(-0.06, 0.003, 0.01), V3(-0.12, 0.002, 0.05)]), 16, 0.0015, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); it.g.add(cable);
  it.on = false; it.setOn = (on) => { it.on = on; sm.color.setHex(on ? 0xfffbea : 0x3a3a3a); };
  it.height = 0.04; it.radius = 0.04; it.grabY = 0.02; return it;
}
// ------------------------------------------------------------------ optics standing on the board (2D shapes in paper coordinates): a plane / concave / convex mirror strip, a cylindrical lens, a glass block
export function mirrorStrip(kind = 'plane', o = {}) {
  const it = new Item('mstrip', { ...o, name: o.name || { plane: { en: 'Plane mirror strip', hi: 'समतल दर्पण पट्टी', hg: 'Plane mirror strip' }, concave: { en: 'Concave mirror strip', hi: 'अवतल दर्पण पट्टी', hg: 'Concave mirror strip' }, convex: { en: 'Convex mirror strip', hi: 'उत्तल दर्पण पट्टी', hg: 'Convex mirror strip' } }[kind] });
  const Rc = o.R ?? 0.16, L = o.len ?? 0.08, H = 0.025; const sgn = kind === 'concave' ? 1 : kind === 'convex' ? -1 : 0; // the reflecting face looks along local +z (towards the student, −v on the paper)
  const pts = []; for (let i = 0; i <= 24; i++) { const u = -L / 2 + (L * i) / 24; pts.push([u, sgn ? sgn * (Rc - Math.sqrt(Rc * Rc - u * u)) : 0]); } // face curve: z(u) in local; concave bends towards +z at the ends
  const shape = new THREE.Shape(); pts.forEach(([u, z], i) => (i ? shape.lineTo(u, -z) : shape.moveTo(u, -z))); for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(pts[i][0], -pts[i][1] - 0.003); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, [new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 1, roughness: 0.08 }), new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.6 })]); it.g.add(m);
  it.kind2 = kind; it.Rc = Rc; it.L = L; it.face = pts; it.height = H; it.radius = L / 2; it.grabY = H / 2; return it;
}
export function cylLens(kind = 'convex', o = {}) {
  const it = new Item('clens', { ...o, name: o.name || { convex: { en: 'Convex lens (cylindrical)', hi: 'उत्तल लेंस (बेलनाकार)', hg: 'Convex lens (cylindrical)' }, concave: { en: 'Concave lens (cylindrical)', hi: 'अवतल लेंस (बेलनाकार)', hg: 'Concave lens (cylindrical)' }, slab: { en: 'Glass block', hi: 'काँच का गुटका', hg: 'Glass block' } }[kind] });
  const L = 0.07, H = 0.025, t = kind === 'slab' ? 0.03 : 0.016; const sh = new THREE.Shape(); const N = 20;
  const prof = (s) => (kind === 'convex' ? (t / 2) * (1 - s * s) + 0.002 : kind === 'concave' ? 0.002 + (t / 2) * s * s : t / 2); // half-thickness along the lens (s = −1 … 1)
  for (let i = 0; i <= N; i++) { const s = -1 + (2 * i) / N; const v = prof(s); i ? sh.lineTo(v, s * L / 2) : sh.moveTo(v, s * L / 2); } for (let i = N; i >= 0; i--) { const s = -1 + (2 * i) / N; sh.lineTo(-prof(s), s * L / 2); } sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: false }); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, glassMat({ opacity: 0.3, edge: 0.9 })); m.renderOrder = 6; it.g.add(m);
  it.kind2 = kind; it.f = kind === 'convex' ? 0.09 : kind === 'concave' ? -0.09 : Infinity; it.L = L; it.t = t; it.height = H; it.radius = L / 2; it.grabY = H / 2; return it; // the lens lies across local z; light crosses it along local x
}
// ------------------------------------------------------------------ the beam tracer: rays in the board's plane from every slit of every lit box, bouncing and bending, drawn as soft streaks
export class BeamTracer {
  constructor(scene, board) { this.scene = scene; this.board = board; this.pool = []; this.used = 0; this.tex = canvasTex(64, 8, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,250,230,1)'); g.addColorStop(0.7, 'rgba(255,250,230,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); this.items = []; this.boxes = []; this.segs = []; }
  uv(w) { const l = this.board.g.worldToLocal(w.clone()); return [l.x, -l.z]; }
  P(u, v) { const w = this.board.g.localToWorld(this.board.toLocal(u, v)); w.y += 0.0007; return w; }
  quad() { let m = this.pool[this.used]; if (!m) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]); m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 9; m.frustumCulled = false; m.userData.noHit = true; this.scene.add(m); this.pool.push(m); } this.used++; m.visible = true; return m; }
  strip(a, b, w = 0.003) { const d = RF.norm(RF.sub(b, a)); const n = [-d[1] * w / 2, d[0] * w / 2]; const m = this.quad(); const p = m.geometry.attributes.position; [RF.sub(a, n), RF.add(a, n), RF.add(b, n), RF.sub(b, n)].forEach((q, i) => { const w3 = this.P(q[0], q[1]); p.setXYZ(i, w3.x, w3.y, w3.z); }); p.needsUpdate = true; this.segs.push([a, b]); }
  // the 2D form of each optic on the board, from its pose
  shapes() { const out = []; for (const it of this.items) { if (!it.g.parent || Math.abs(it.g.position.y - (this.board.g.position.y + this.board.surfY)) > 0.006) continue; const c = this.uv(it.g.position); const a = yawOf(it.g); const R = (p) => RF.add(c, [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]); out.push({ it, c, a, R }); } return out; }
  update() {
    this.used = 0; this.segs = []; const S = this.shapes(); const B = this.board;
    const inBoard = (p) => Math.abs(p[0]) <= B.W / 2 && Math.abs(p[1]) <= B.H / 2;
    for (const bx of this.boxes) { if (!bx.on || !bx.g.parent) continue; const yaw = yawOf(bx.g); const d0 = [Math.cos(yaw), Math.sin(yaw)];
      for (const sl of bx.slits) { let p = this.uv(bx.g.localToWorld(sl.clone())); let d = d0.slice(); let last = null;
        for (let k = 0; k < 6; k++) { let best = null;
          for (const s of S) { if (s.it === last) continue; const it = s.it;
            if (it.kind === 'mstrip') { const F = it.face.map(([u, z]) => s.R([u, -z])); for (let i = 0; i < F.length - 1; i++) { const h = RF.hit(p, d, F[i], F[i + 1]); if (h && h.t > 1e-4 && (!best || h.t < best.t)) { const e = RF.norm(RF.sub(F[i + 1], F[i])); best = { t: h.t, p: h.p, s, kind: 'mirror', n: [-e[1], e[0]] }; } } }
            else if (it.kind === 'clens') { const mid = [s.R([0, -it.L / 2]), s.R([0, it.L / 2])]; const h = RF.hit(p, d, mid[0], mid[1]); if (h && h.t > 1e-4 && (!best || h.t < best.t)) best = { t: h.t, p: h.p, s, kind: 'lens', mid }; } }
          const end = best ? best.p : (() => { let t = 2; for (const [a, b] of [[[-B.W / 2, -B.H / 2], [B.W / 2, -B.H / 2]], [[B.W / 2, -B.H / 2], [B.W / 2, B.H / 2]], [[B.W / 2, B.H / 2], [-B.W / 2, B.H / 2]], [[-B.W / 2, B.H / 2], [-B.W / 2, -B.H / 2]]]) { const h = RF.hit(p, d, a, b); if (h && h.t < t) t = h.t; } return RF.add(p, RF.mul(d, t)); })();
          if (inBoard(p)) this.strip(p, end); if (!best) break;
          if (best.kind === 'mirror') { const n = best.n; d = RF.sub(d, RF.mul(n, 2 * RF.dot(d, n))); p = best.p; last = null; continue; } // reflect: d' = d − 2(d·n)n
          // a thin lens: bend the ray towards (or away from) the axis by the height above it: tan θ' = tan θ − h/f; a glass block only shifts it a little
          const it = best.s.it; const ax = RF.norm(RF.sub(best.mid[1], best.mid[0])); const nrm = [ax[1], -ax[0]]; const sgn = RF.dot(d, nrm) >= 0 ? 1 : -1; const nn = RF.mul(nrm, sgn); const h = RF.dot(RF.sub(best.p, best.s.c), ax);
          if (it.kind2 === 'slab') { const t = RF.traceThrough([best.s.R([-it.t / 2, -it.L / 2]), best.s.R([it.t / 2, -it.L / 2]), best.s.R([it.t / 2, it.L / 2]), best.s.R([-it.t / 2, it.L / 2])], RF.sub(p, RF.mul(d, 0.001)), d); if (t && t.dout) { this.strip(best.p, t.F, 0.004); p = t.F; d = t.dout; last = it; continue; } }
          const ta = RF.dot(d, ax) / Math.max(1e-6, RF.dot(d, nn)); const tb = ta - h / it.f; const nd = RF.norm(RF.add(nn, RF.mul(ax, tb))); const out = RF.add(best.p, RF.mul(nd, 0.0001)); p = out; d = nd; last = it;
        } }
    }
    for (let i = this.used; i < this.pool.length; i++) this.pool[i].visible = false;
  }
  dispose() { for (const m of this.pool) this.scene.remove(m); }
}
// ------------------------------------------------------------------ a steel spoon whose bowl reflects the room (a cube-camera picture of its surroundings): concave inside, convex outside
export function spoon(o = {}) {
  const it = new Item('spoon', { ...o, name: o.name || { en: 'Shiny steel spoon', hi: 'चमकीला स्टील का चम्मच', hg: 'Chamakdaar steel ka chammach' } });
  const rt = new THREE.WebGLCubeRenderTarget(256, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter }); const cam = new THREE.CubeCamera(0.02, 30, rt); it.cube = cam; it.rt = rt;
  const mirror = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.04, envMap: rt.texture, envMapIntensity: 1.2 });
  const bowl = new THREE.Group(); it.g.add(bowl); it.bowl = bowl;
  const cap = new THREE.SphereGeometry(0.05, 48, 24, 0, Math.PI * 2, 0, 0.62); const inner = new THREE.Mesh(cap, mirror.clone()); inner.material.side = THREE.BackSide; const outer = new THREE.Mesh(cap, mirror); outer.material.side = THREE.FrontSide; outer.scale.set(1, 1, 1); // inner: the concave face; outer: the convex face
  const sc = new THREE.Group(); sc.add(inner, outer); sc.rotation.x = -Math.PI / 2; sc.scale.set(0.62, 1, 0.92); sc.position.z = -0.05 * 0.92 * 0 ; bowl.add(sc);
  inner.position.y = -0.05; outer.position.y = -0.05; // the cap's rim sits near the bowl group's origin
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.13, 0.003), steel(0xd8dde2, 0.15)); handle.position.set(0, -0.092, 0.004); bowl.add(handle);
  it.capture = (renderer, scene) => { it.g.visible = false; const p = it.g.localToWorld(V3(0, 0, -0.01)); cam.position.copy(p); cam.update(renderer, scene); it.g.visible = true; };
  it.height = 0.12; it.radius = 0.08; it.grabY = 0.05; it.noRest = true; return it;
}
// a toy (a small doll made of coloured blocks) to look at in the spoon
export function toyDoll(o = {}) {
  const it = new Item('toy', { ...o, name: o.name || { en: 'Toy doll', hi: 'खिलौना गुड़िया', hg: 'Khilona gudiya' } });
  const add = (geo, col, x, y, z) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 })); m.position.set(x, y, z); it.g.add(m); return m; };
  add(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 20), 0xd62828, 0, 0.04, 0); add(new THREE.SphereGeometry(0.025, 20, 14), 0xf1c27d, 0, 0.105, 0); add(new THREE.ConeGeometry(0.028, 0.04, 20), 0x1d4f9a, 0, 0.145, 0); add(new THREE.SphereGeometry(0.006, 8, 6), 0xffe066, 0, 0.168, 0);
  it.height = 0.17; it.radius = 0.04; it.grabY = 0.08; return it;
}
// ------------------------------------------------------------------ a sheet of paper that a focused spot of sunlight heats: it browns, smokes and burns a hole
export function burnPaper(o = {}) {
  const it = new Item('bpaper', { ...o, name: o.name || { en: 'Sheet of paper', hi: 'कागज़ की शीट', hg: 'Kaagaz ki sheet' } });
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, 256, 256); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.y = 0.0008; it.g.add(m);
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d'); const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.4, 'rgba(255,240,190,0.7)'); gr.addColorStop(1, 'rgba(255,230,160,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
  const spot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); spot.rotation.x = -Math.PI / 2; spot.position.y = 0.0015; spot.visible = false; spot.renderOrder = 9; it.g.add(spot);
  it.heat = 0; it.burnt = 0; it.spot = (r, power) => { spot.visible = r > 0; spot.scale.setScalar(Math.max(0.002, r * 2)); spot.material.opacity = Math.min(1, power); it.power = power; it.r = r; };
  it.update = (dt) => { if (!spot.visible) return; const intensity = (it.power || 0) / Math.max(1e-5, (it.r || 1) ** 2) * 2.5e-5; it.heat += (Math.min(1.5, intensity) - it.heat * 0.1) * dt; if (it.heat > 0.4) { const k = Math.min(1, (it.heat - 0.4) / 0.9); if (k > it.burnt + 0.02) { it.burnt = k; x.save(); const gx = x.createRadialGradient(128, 128, 0, 128, 128, 6 + 18 * k); gx.addColorStop(0, k > 0.85 ? 'rgba(0,0,0,0)' : 'rgba(40,25,15,1)'); gx.addColorStop(0.55, 'rgba(70,40,20,0.9)'); gx.addColorStop(1, 'rgba(150,110,60,0)'); x.globalCompositeOperation = k > 0.85 ? 'destination-out' : 'source-over'; x.fillStyle = gx; x.beginPath(); x.arc(128, 128, 6 + 18 * k, 0, 6.29); x.fill(); x.restore(); if (k > 0.85) { x.save(); x.strokeStyle = 'rgba(40,20,10,0.9)'; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 8 + 10 * k, 0, 6.29); x.stroke(); x.restore(); } tex.needsUpdate = true; } } };
  it.height = 0.002; it.radius = 0.06; it.grabY = 0.001; return it;
}
// a magnifying (convex) lens in a handle, and a concave mirror on a little stand, both used to focus sunlight
export function handLens(o = {}) {
  const it = new Item('hlens', { ...o, name: o.name || { en: 'Convex lens (magnifying glass)', hi: 'उत्तल लेंस (आवर्धक लेंस)', hg: 'Convex lens (magnifying glass)' } });
  const R = 0.035, t = 0.008; const pts = []; for (let i = 0; i <= 16; i++) { const r = (i / 16) * R; pts.push(new THREE.Vector2(r, (t / 2) * (1 - (r / R) ** 2) + 0.0005)); } const all = [...pts.slice().reverse().map((p) => new THREE.Vector2(p.x, -p.y)), ...pts].sort((a, b) => a.y - b.y);
  const lens = new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x, p.y)).concat(pts.slice().reverse().map((p) => new THREE.Vector2(p.x, -p.y))), 40), glassMat({ opacity: 0.3, edge: 0.7 })); lens.renderOrder = 6; it.g.add(lens); void all;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.001, 0.0025, 8, 40), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5 })); rim.rotation.x = Math.PI / 2; it.g.add(rim);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.09, 12), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.5 })); h.rotation.z = Math.PI / 2; h.position.x = R + 0.048; it.g.add(h);
  it.f = 0.15; it.R = R; it.height = 0.01; it.radius = 0.08; it.grabY = 0; it.noRest = true; return it;
}
// ------------------------------------------------------------------ a drop of water on a clear plastic sheet lying on printed text: the letters under it look bigger
export function printSheet(o = {}) {
  const it = new Item('print', { ...o, name: o.name || { en: 'Newspaper with small print', hi: 'छोटे अक्षरों वाला अख़बार', hg: 'Chhote akshar wala akhbaar' } });
  const draw = (x, w, h, k = 1, cx = 0, cy = 0) => { x.fillStyle = '#efeadb'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = `500 ${14 * k}px serif`; const words = 'Science is the study of the world around us through observation and experiment. Light travels in straight lines and bends when it passes from one medium to another. A drop of water can act as a lens.'.split(' '); let xx = 8 * k - cx, yy = 22 * k - cy; for (let r = 0; r < 40; r++) { for (const wd of words) { const ww = x.measureText(wd + ' ').width; if (xx + ww > w * k - cx) { xx = 8 * k - cx; yy += 18 * k; } x.fillText(wd, xx, yy); xx += ww; if (yy > h * k) break; } } };
  const base = canvasTex(512, 512, (x, w, h) => draw(x, w, h)); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshStandardMaterial({ map: base, roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.0006; it.g.add(m);
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.001, 0.09), glassMat({ opacity: 0.12, edge: 0.6 })); sheet.position.y = 0.0016; sheet.renderOrder = 6; it.g.add(sheet);
  // the magnified patch under the drop: the same print drawn 1.8× larger around the drop's centre
  const zoom = canvasTex(256, 256, (x, w, h) => { x.save(); x.beginPath(); x.arc(128, 128, 126, 0, 6.29); x.clip(); const c = (0.021 * 3200) / 1.8; x.drawImage(base.image, 256 - c / 2, 256 - c / 2, c, c, 0, 0, 256, 256); x.restore(); }); // 1.8 times bigger than the print around it
  const zm = new THREE.Mesh(new THREE.CircleGeometry(0.0105, 40), new THREE.MeshBasicMaterial({ map: zoom, transparent: true })); zm.rotation.x = -Math.PI / 2; zm.position.y = 0.0021; zm.visible = false; it.g.add(zm);
  const dropM = new THREE.Mesh(new THREE.SphereGeometry(0.011, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 0.95, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false })); dropM.scale.y = 0.35; dropM.position.y = 0.0021; dropM.visible = false; dropM.renderOrder = 7; it.g.add(dropM);
  it.drop = (on) => { zm.visible = on; dropM.visible = on; }; it.height = 0.002; it.radius = 0.08; it.grabY = 0.001; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ the Moon model: a lamp (the Sun) and a white ball on a stick that moves round the observer's head
export function moonModel(o = {}) {
  const it = new Item('moonrig', { ...o, name: o.name || { en: 'Lamp (Sun) and a white ball on a stick (Moon)', hi: 'लैंप (सूर्य) और छड़ी पर सफ़ेद गेंद (चंद्रमा)', hg: 'Lamp (Sun) aur stick par white ball (Moon)' } });
  const lampP = V3(-1.1, 0.42, 0.0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff2c8 })); bulb.position.copy(lampP); it.g.add(bulb);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 10), steel(0x3a3f46, 0.5)); shade.position.set(lampP.x, 0.21, lampP.z); it.g.add(shade);
  const L = new THREE.PointLight(0xfff0d0, 0, 6, 1.2); L.position.copy(lampP); it.g.add(L); it.lamp = L;
  const ballG = new THREE.Group(); it.g.add(ballG); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 40, 28), new THREE.MeshLambertMaterial({ color: 0xf2f0ea })); ballG.add(ball); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0x8a5a33 })); stick.position.y = -0.17; ballG.add(stick);
  it.head = V3(0, 0.45, 0.0); it.R = 0.45; it.ang = 0; it.ball = ballG; it.lampP = lampP;
  it.setAng = (a) => { it.ang = a; const c = it.head; ballG.position.set(c.x + Math.cos(a) * it.R * -1, c.y + 0.02, c.z + Math.sin(a) * it.R); }; // a = 0: the ball is between the head and the lamp (new moon)
  it.setAng(0); it.height = 0.5; it.radius = 0.6; it.grabY = 0.3; it.noGrab = true; return it;
}
// ------------------------------------------------------------------ a stick standing on a board; a lamp "Sun" moves across the sky, the stick's shadow turns and changes length
export function shadowBoard(o = {}) {
  const it = new Item('sboard', { ...o, name: o.name || { en: 'Stick on a board in the sunlight', hi: 'धूप में बोर्ड पर खड़ी छड़ी', hg: 'Dhoop mein board par khadi stick' } });
  const W = 0.4, Dp = 0.3; const c = document.createElement('canvas'); c.width = 512; c.height = 384; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const clear = () => { x.fillStyle = '#f3efe4'; x.fillRect(0, 0, 512, 384); x.strokeStyle = 'rgba(80,80,80,0.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(256, 20); x.lineTo(256, 364); x.stroke(); x.fillStyle = '#555'; x.font = '700 22px sans-serif'; x.fillText('N', 262, 34); x.fillText('S', 262, 360); x.fillText('E', 488, 196); x.fillText('W', 10, 196); tex.needsUpdate = true; }; clear();
  const board = new THREE.Mesh(new THREE.BoxGeometry(W, 0.012, Dp), [0, 1, 2, 3, 4, 5].map((i) => (i === 2 ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }) : new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3c'), roughness: 0.7 })))); board.position.y = 0.006; it.g.add(board);
  const hS = 0.08; const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, hS, 10), new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.6 })); stick.position.y = 0.012 + hS / 2; it.g.add(stick);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.006), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.0125; sh.renderOrder = 5; it.g.add(sh);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe9a0 })); it.g.add(sunM); const arc = []; for (let i = 0; i <= 40; i++) { const t = i / 40; arc.push(sunAt(6 + 12 * t, 0.5)); } const arcL = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc), new THREE.LineDashedMaterial({ color: 0xc9a24a, dashSize: 0.02, gapSize: 0.015 })); arcL.computeLineDistances(); it.g.add(arcL);
  function sunAt(hr, R) { const H = ((hr - 12.25) / 12) * Math.PI; const el = Math.max(0.04, Math.cos(H) * (Math.PI / 2 - 0.35)); return V3(-Math.sin(H) * Math.cos(el) * R, 0.012 + Math.sin(el) * R, Math.cos(H) * Math.cos(el) * R); } // a model sky: rises in the east (+x), highest (in the south, +z) a little after noon, sets in the west
  it.hr = 6; it.marks = [];
  it.setTime = (hr) => { it.hr = hr; const s = sunAt(hr, 0.5); sunM.position.copy(s); const d = V3(-s.x, 0, -s.z).normalize(); const el = Math.atan2(s.y - 0.012, Math.hypot(s.x, s.z)); const len = Math.min(0.18, hS / Math.tan(Math.max(0.12, el))); sh.scale.x = len; sh.position.set(d.x * len / 2, 0.0125, d.z * len / 2); sh.rotation.set(-Math.PI / 2, 0, Math.atan2(-d.z, d.x)); it.tip = [d.x * len, d.z * len]; it.len = len; return len; };
  it.mark = (label) => { const [tx, tz] = it.tip; const px = 256 + (tx / W) * 512, py = 192 + (tz / Dp) * 384; x.fillStyle = '#c0392b'; x.beginPath(); x.arc(px, py, 5, 0, 6.29); x.fill(); if (label) { x.fillStyle = '#1d1d1d'; x.font = '600 16px sans-serif'; x.fillText(label, px + 7, py - 6); } tex.needsUpdate = true; it.marks.push({ hr: it.hr, len: it.len }); };
  it.setTime(6); it.height = 0.1; it.radius = 0.2; it.grabY = 0.006; it.noGrab = true; return it;
}
