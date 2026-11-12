// Hands-on tools for the body (Explore):
//  - Take out: any part comes out of the body as a piece of its own. Hold it, turn it, leave it in the air,
//    pass it to the other hand, resize it with both hands, or bring it near its place to put it back.
//  - Cut: a slice that removes everything in front of it, so the inside of the body can be seen.
//    In VR it is a see-through blade held in the hand (push it into the body, pull the trigger to leave it there);
//    on a screen it faces the viewer and moves deeper or back with buttons.
import * as THREE from 'three';
import { lookFor } from './body.js';

export const OUT = 32; // part flag: this part is out of the body (its piece is drawn instead)
const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _s = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const ID = new THREE.Quaternion();
const ease = (e) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2);

export class Handson {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group(); this.group.name = 'handson'; // lives in bodyRoot: body space
    this.pieces = [];
    this.held = new Map(); // controller -> { piece, rel }
  }
  count() { return this.pieces.length; }
  find(pid) { return this.pieces.find((p) => p.userData.pid === pid) || null; }
  isOut(pid) { return !!this.find(pid); }

  // a copy of the part (one side of the body when the part has two) replaces it
  take(pid, oid = -1) {
    const have = this.find(pid); if (have) return have;
    const b = this.app.body;
    const side = oid >= 0 && b.objects[oid] ? b.objects[oid].side : '';
    const oids = (b.partObjs[pid] || []).filter((o) => {
      const ob = b.objects[o]; const mesh = ob && b.parts[ob.group];
      if (!mesh || !mesh.visible || ob.group === 'skin' || !mesh.geometry.attributes.partId) return false;
      if (b.state.flags(o) & 1) return false;
      return !side || !ob.side || ob.side === side;
    });
    if (!oids.length) return null;
    const byGroup = {}; for (const o of oids) (byGroup[b.objects[o].group] ||= []).push(o);
    const piece = new THREE.Group(); const box = new THREE.Box3();
    for (const [g, list] of Object.entries(byGroup)) {
      const geo = b.extract(list); if (!geo.attributes.position.count) { geo.dispose(); continue; }
      const [c, r] = lookFor(g);
      const mat = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.9 });
      const m = new THREE.Mesh(geo, mat); m.userData.piece = piece;
      piece.add(m); box.union(geo.boundingBox);
    }
    if (!piece.children.length) return null;
    const home = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    for (const m of piece.children) m.position.sub(home);
    piece.position.copy(home);
    piece.userData = { pid, oids, home: home.clone(), size: size.length(), height: size.y, anim: null };
    for (const o of oids) b.state.bit(o, OUT, true);
    this.group.add(piece); this.pieces.push(piece);
    return piece;
  }

  // ------------------------------------------------------------ hands (VR)
  // reel: bring it from where it was towards the hand (a part pulled out of the body)
  grab(piece, c, reel = false) {
    piece.userData.anim = null;
    this.group.updateWorldMatrix(true, true);
    const rel = new THREE.Matrix4().copy(c.matrixWorld).invert().multiply(piece.matrixWorld);
    this.held.set(c, { piece, rel, reel });
  }
  // thumbstick: push the held piece away or pull it closer
  reach(c, d) {
    const h = this.held.get(c); if (!h) return;
    const e = h.rel.elements, v = _a.set(e[12], e[13], e[14]), L = v.length();
    if (L < 1e-4) return;
    v.setLength(THREE.MathUtils.clamp(L + d, 0.12, 3)); e[12] = v.x; e[13] = v.y; e[14] = v.z; h.reel = false;
  }
  holding(c) { const h = this.held.get(c); return h ? h.piece : null; }
  isHeld(p) { for (const h of this.held.values()) if (h.piece === p) return true; return false; }
  // let go: 'back' when it was near its place (it goes back in), 'left' when it stays in the air
  release(c) {
    const h = this.held.get(c); if (!h) return null;
    this.held.delete(c);
    const p = h.piece; p.userData.pinch = null;
    if (this.isHeld(p)) { for (const [c2, h2] of this.held) if (h2.piece === p) this.grab(p, c2); return 'still'; }
    if (this.nearHome(p)) { this.putBack(p); return 'back'; }
    return 'left';
  }
  nearHome(p) { return p.position.distanceTo(p.userData.home) < Math.max(0.035, p.userData.size * 0.22) && p.scale.x < 1.6; }
  // every VR frame: held pieces follow the hand; two hands on one piece resize it
  follow() {
    if (!this.held.size) return;
    this.group.updateWorldMatrix(true, false);
    _inv.copy(this.group.matrixWorld).invert();
    const done = new Set();
    for (const [c, h] of this.held) {
      const p = h.piece; if (done.has(p)) continue; done.add(p);
      const hands = []; for (const [c2, h2] of this.held) if (h2.piece === p) hands.push(c2);
      if (hands.length > 1) {
        _a.setFromMatrixPosition(hands[0].matrixWorld); _b.setFromMatrixPosition(hands[1].matrixWorld);
        const d = _a.distanceTo(_b);
        if (!p.userData.pinch) p.userData.pinch = { d0: Math.max(d, 0.03), s0: p.scale.x, p0: p.position.clone(), m0: _a.clone().add(_b).multiplyScalar(0.5).applyMatrix4(_inv) };
        const pi = p.userData.pinch;
        p.scale.setScalar(THREE.MathUtils.clamp(pi.s0 * d / pi.d0, 0.3, 8));
        const mid = _a.add(_b).multiplyScalar(0.5).applyMatrix4(_inv);
        p.position.copy(pi.p0).add(mid.sub(pi.m0));
        continue;
      }
      if (h.reel) {
        const e = h.rel.elements, v = _a.set(e[12], e[13], e[14]), L = v.length(), want = 0.3 + p.userData.size * 0.35;
        if (L > want + 0.005) { v.setLength(L + (want - L) * Math.min(1, 6 * (this._dt || 0.016))); e[12] = v.x; e[13] = v.y; e[14] = v.z; } else h.reel = false;
      }
      _m.multiplyMatrices(c.matrixWorld, h.rel).premultiply(_inv);
      _m.decompose(p.position, p.quaternion, _s);
    }
  }

  // ------------------------------------------------------------ moving without hands (screen, buttons)
  // float the piece out of the body towards the viewer (point in body space)
  floatOut(p, toward) {
    const h = p.userData.home, dir = toward.clone().sub(h); dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    const reach = THREE.MathUtils.clamp(0.16 + p.userData.size * 0.55, 0.18, 0.42);
    const to = h.clone().addScaledVector(dir.normalize(), reach); to.y += 0.04;
    p.userData.anim = { p0: p.position.clone(), p1: to, q0: p.quaternion.clone(), q1: p.quaternion.clone(), s0: p.scale.x, s1: p.scale.x, t: 0, dur: 0.7, back: false };
  }
  turn(p, a = Math.PI / 3) {
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a).multiply(p.quaternion);
    p.userData.anim = { p0: p.position.clone(), p1: p.position.clone(), q0: p.quaternion.clone(), q1, s0: p.scale.x, s1: p.scale.x, t: 0, dur: 0.45, back: false };
  }
  putBack(p) {
    for (const [c, h] of [...this.held]) if (h.piece === p) this.held.delete(c);
    p.userData.anim = { p0: p.position.clone(), p1: p.userData.home.clone(), q0: p.quaternion.clone(), q1: ID, s0: p.scale.x, s1: 1, t: 0, dur: 0.6, back: true };
  }
  putAllBack() { for (const p of this.pieces) this.putBack(p); }
  // the part is drawn in the body again
  restore(p) {
    const b = this.app.body;
    for (const o of p.userData.oids) b.state.bit(o, OUT, false);
    for (const m of p.children) { m.geometry.dispose(); m.material.dispose(); }
    this.group.remove(p); this.pieces = this.pieces.filter((x) => x !== p);
    for (const [c, h] of [...this.held]) if (h.piece === p) this.held.delete(c);
    if (this.onBack) this.onBack(p);
  }
  clear() { for (const p of [...this.pieces]) this.restore(p); this.held.clear(); }

  pick(raycaster) {
    const ms = []; for (const p of this.pieces) if (!(p.userData.anim && p.userData.anim.back)) for (const m of p.children) ms.push(m);
    const h = ms.length ? raycaster.intersectObjects(ms, false)[0] : null;
    return h ? { piece: h.object.userData.piece, point: h.point, distance: h.distance } : null;
  }
  // world point -> body space
  toBody(v) { this.group.updateWorldMatrix(true, false); return this.group.worldToLocal(v.clone()); }

  update(dt, t) {
    this._dt = dt;
    const selPid = this.app.sel && this.app.sel.pid;
    for (const p of [...this.pieces]) {
      const u = p.userData, A = u.anim;
      if (A) {
        A.t += dt; const e = ease(Math.min(1, A.t / A.dur));
        p.position.lerpVectors(A.p0, A.p1, e); p.quaternion.slerpQuaternions(A.q0, A.q1, e); p.scale.setScalar(A.s0 + (A.s1 - A.s0) * e);
        if (A.t >= A.dur) { u.anim = null; if (A.back) { this.restore(p); continue; } }
      }
      const near = this.isHeld(p) && this.nearHome(p);
      const k = u.pid === selPid ? 0.18 + 0.12 * Math.sin(t * 4) : 0;
      for (const m of p.children) m.material.emissive.setRGB(near ? 0.1 : k, near ? 0.45 : k * 0.8, near ? 0.25 : k * 0.4);
    }
  }
}

// ------------------------------------------------------------ cut
export class Cutter {
  constructor(app) {
    this.app = app;
    this.on = false; this.frozen = false; this.depth = 0; this.axis = 0; // screen: 0 facing you, 1 from the side, 2 from the top
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6);
    this.planes = [this.plane];
    // the blade (VR): a see-through sheet with a bright edge
    const w = 0.42, h = 0.3;
    this.blade = new THREE.Group();
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), new THREE.LineBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.9 }));
    this.blade.add(sheet, edge); this.blade.visible = false; this.blade.renderOrder = 30;
    this.hand = null;
  }
  materials() {
    const out = [];
    for (const m of Object.values(this.app.body.parts)) if (m.material) out.push(m.material);
    return out;
  }
  set(on, hand = null) {
    this.on = on; this.frozen = false; this.hand = hand; this.depth = 0;
    for (const mat of this.materials()) {
      mat.clippingPlanes = on ? this.planes : null;
      if (!mat.isShaderMaterial) { if (on) { mat.userData.side0 ??= mat.side; mat.side = THREE.DoubleSide; } else if (mat.userData.side0 != null) mat.side = mat.userData.side0; }
      mat.needsUpdate = true;
    }
    this.app.flows.points.visible = !on;
    if (this.blade.parent) this.blade.parent.remove(this.blade);
    this.blade.visible = false;
    if (on && hand) { hand.add(this.blade); this.blade.position.set(0, 0, -0.22); this.blade.rotation.set(0, 0, 0); this.blade.visible = true; }
    if (!on) this.plane.constant = 1e6;
  }
  // VR: leave the blade where it is (trigger) or pick it up again
  freeze() {
    if (!this.hand) return;
    this.frozen = !this.frozen;
    const w = this.app.world;
    if (this.frozen) { this.blade.updateWorldMatrix(true, false); w.attach(this.blade); }
    else { this.hand.attach(this.blade); this.blade.position.set(0, 0, -0.22); this.blade.rotation.set(0, 0, 0); }
  }
  // screen: the slice faces the viewer (or the side / the top) and moves deeper with the buttons
  update() {
    if (!this.on) return;
    const app = this.app;
    if (this.hand) {
      // the blade's face: keep what lies beyond it, cut away what is between the hand and the blade
      this.blade.updateWorldMatrix(true, false);
      const n = new THREE.Vector3(0, 0, -1).transformDirection(this.blade.matrixWorld);
      const p = new THREE.Vector3().setFromMatrixPosition(this.blade.matrixWorld);
      this.plane.setFromNormalAndCoplanarPoint(n, p);
      return;
    }
    const centre = app.bodyRoot.localToWorld(app.stepView ? app.stepView.at.clone() : new THREE.Vector3(0, 0.95, 0));
    let n;
    if (this.axis === 0) { n = new THREE.Vector3(); app.camera.getWorldDirection(n); }
    else if (this.axis === 1) n = new THREE.Vector3(-Math.sign(app.camera.position.x - centre.x) || -1, 0, 0);
    else n = new THREE.Vector3(0, -1, 0);
    const half = this.axis === 2 ? 0.95 : this.axis === 1 ? 0.3 : 0.18;
    const p = centre.clone().addScaledVector(n, -half + this.depth);
    this.plane.setFromNormalAndCoplanarPoint(n, p);
  }
  deeper(d) { this.depth = THREE.MathUtils.clamp(this.depth + d, 0, this.axis === 2 ? 1.9 : this.axis === 1 ? 0.6 : 0.4); }
  nextAxis() { this.axis = (this.axis + 1) % 3; this.depth = this.axis === 2 ? 0.3 : 0.06; }
}
