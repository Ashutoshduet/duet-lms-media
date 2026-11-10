// Headset input: a ray from each controller (or pinch with hands) to press panel buttons and use the glowing item,
// and the grip button to pick things up and do the experiment yourself — tilt to pour, hold over the flame to heat,
// dip paper, light a splint in the flame, drop solids into a vessel, put tubes back in the rack.
import * as THREE from 'three';
import { BENCH_Y, BENCH } from './room.js';
import { matchstick } from './apparatus.js';

const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tq = new THREE.Quaternion();
const FLAT = ['splint', 'strip', 'thermo', 'tongs', 'rod', 'spatula'];
const SOLID = ['granules', 'crystals', 'nail', 'ribbon', 'heap'];

function controllerModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.07, 6, 14), new THREE.MeshStandardMaterial({ color: 0x23262d, roughness: 0.5, metalness: 0.2 }));
  body.rotation.x = Math.PI / 2 - 0.5; body.position.set(0, -0.012, 0.035); g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf0a65a, roughness: 0.4, emissive: 0x3a2008 }));
  ring.position.set(0, 0.01, -0.005); ring.rotation.x = 0.4; g.add(ring);
  return g;
}

export class XRInput {
  constructor(app) {
    this.app = app; const r = app.renderer;
    this.ray = new THREE.Raycaster(); this.ray.far = 3;
    this.hands = [0, 1].map((i) => {
      const c = r.xr.getController(i); const grip = r.xr.getControllerGrip(i); const hand = r.xr.getHand(i);
      const lineG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
      const line = new THREE.Line(lineG, new THREE.LineBasicMaterial({ color: 0xf3eee6, transparent: true, opacity: 0.55, depthWrite: false })); line.renderOrder = 50; c.add(line);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({ color: 0xf0a65a, depthTest: false })); dot.renderOrder = 51; dot.visible = false; app.scene.add(dot);
      const model = controllerModel(); grip.add(model);
      const tips = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.6 })); m.visible = false; app.scene.add(m); return m; });
      const h = { i, c, grip, hand, line, dot, model, tips, held: null, src: null, hover: null, hoverPanel: null };
      c.addEventListener('connected', (e) => { h.src = e.data; const isHand = !!e.data.hand; model.visible = !isHand; line.visible = true; });
      c.addEventListener('disconnected', () => { this.release(h); h.src = null; line.visible = false; dot.visible = false; });
      c.addEventListener('selectstart', () => this.select(h));
      c.addEventListener('selectend', () => { if (h.src && h.src.hand && h.held) this.release(h); });
      c.addEventListener('squeezestart', () => this.grab(h));
      c.addEventListener('squeezeend', () => this.release(h));
      app.scene.add(c, grip, hand);
      return h;
    });
  }
  // ------------------------------------------------------------ what the ray points at
  cast(h) {
    h.c.updateMatrixWorld(); this.ray.ray.origin.setFromMatrixPosition(h.c.matrixWorld);
    this.ray.ray.direction.set(0, 0, -1).applyQuaternion(h.c.getWorldQuaternion(tq));
    const ui = this.app.ui; const panels = ui.vr.visible ? [ui.menu.mesh, ui.story.mesh] : [];
    const ph = this.ray.intersectObjects(panels, false)[0];
    const items = this.app.lab.items.filter((it) => it !== h.held && !(this.hands.some((o) => o.held === it)));
    let best = null; for (const it of items) { const hit = this.ray.intersectObjects(it.hitMeshes(), false)[0]; if (hit && (!best || hit.distance < best.d)) best = { it: this.owner(hit.object) || it, d: hit.distance, p: hit.point }; }
    if (ph && (!best || ph.distance < best.d)) return { panel: ph.object.userData.panel, uv: ph.uv, p: ph.point, d: ph.distance };
    return best ? { item: best.it, p: best.p, d: best.d } : null;
  }
  owner(o) { while (o) { if (o.userData.item) return o.userData.item; o = o.parent; } return null; }
  // ------------------------------------------------------------ trigger / pinch
  select(h) {
    this.app.audio.unlock();
    if (h.held && h.held.kind === 'match') { this.strike(h, true); return; } // trigger with a match in hand: strike it on the box
    const hit = this.cast(h);
    if (hit && hit.panel) { const id = hit.panel.hitUV(hit.uv); if (id) { this.pulse(h, 0.4, 30); this.app.audio.tone(900, 0.05, 0.05); this.app.ui.vrClick(id); } return; }
    // with hand tracking, a pinch close to an object picks it up
    if (h.src && h.src.hand) { const near = this.nearest(h, 0.06); if (near && near.kind === 'matchbox') { this.takeMatch(h, near); return; } if (near) { this.take(h, near, true); return; } }
    // the ray points at a terminal: wire it (tap one terminal, then another)
    if (hit && hit.p) { let best = null, bd = 0.025; const v = new THREE.Vector3(); for (const it2 of this.app.lab.items) { if (!it2.terms || !it2.g.visible || it2.kind === 'lead') continue; for (const k in it2.terms) { const t = it2.terms[k]; v.copy(t.local); it2.g.localToWorld(v); const d = v.distanceTo(hit.p); if (d < bd) { bd = d; best = t; } } } if (best) { this.pulse(h, 0.4, 30); this.app.wireTap(best); return; } }
    if (!hit || !hit.item) return;
    const r = this.app.runner; const it = hit.item;
    if (it.kind === 'matchbox' && !h.held) { this.takeMatch(h, it); return; } // a match out of the box, into the hand
    if (r.state === 'todo' && r.target() === it) { this.pulse(h, 0.5, 40); r.doStep(); return; }
    if (it.kind === 'key' && it.setOn) { it.setOn(!it.on); this.app.lab.emit('key', { v: it.id, on: it.on }); this.app.audio.tone(it.on ? 1500 : 900, 0.04, 0.06, 'square'); this.pulse(h, 0.4, 30); return; } // a switch: press it
    if (it.setLit) { // put out a lamp yourself; lighting it needs a match (when there is a matchbox on the bench)
      if (!it.lit && this.app.lab.items.some((x) => x.kind === 'matchbox')) { this.app.ui.toast(this.app.ui.lightHint(true) || '', 6000); this.pulse(h, 0.2, 20); return; }
      it.setLit(!it.lit); this.app.lab.emit(it.lit ? 'lit' : 'unlit', { obj: it.id }); if (it.lit) this.app.audio.whoosh(); this.pulse(h, 0.4, 40);
    }
  }
  // ------------------------------------------------------------ matches
  takeMatch(h, box) {
    const m = matchstick(); this.app.lab.add(m, box.g.position.x, box.g.position.z); m.g.position.y = box.g.position.y + 0.02;
    this.take(h, m, false); this.app.audio.tone(1700, 0.03, 0.04, 'triangle');
  }
  boxNear(p, d) { let best = null, bd = d; for (const b of this.app.lab.items) { if (b.kind !== 'matchbox') continue; const c = b.g.localToWorld(tmp2.set(0, b.strikeY ?? 0.008, 0)); const x = c.distanceTo(p); if (x < bd) { bd = x; best = b; } } return best; }
  strike(h, byTrigger) {
    const m = h.held; if (!m || m.burning) return; const L = this.app.lang;
    if (m.spent) { if (byTrigger) this.app.ui.toast({ en: 'This match has burnt out. Take a new one from the box.', hi: 'यह तीली जल चुकी है। डिब्बी से नई तीली लीजिए।', hg: 'Ye teeli jal chuki hai. Dibbi se nayi teeli lijiye.' }[L] || '', 4000); return; }
    const tip = m.g.localToWorld(tmp.copy(m.tipLocal));
    if (!this.boxNear(tip, byTrigger ? 0.08 : 0.035)) { if (byTrigger) this.app.ui.toast({ en: 'Bring the head of the match to the brown side of the matchbox, then pull the trigger to strike it.', hi: 'तीली का मसाला माचिस की भूरी पट्टी के पास लाइए, फिर ट्रिगर दबाकर रगड़िए।', hg: 'Teeli ka masala maachis ki brown patti ke paas laiye, phir trigger dabakar ragadiye.' }[L] || '', 4500); return; }
    m.setFlame(true); this.app.audio.burst(0.18, 3200, 0.18, 'highpass'); setTimeout(() => this.app.audio.whoosh(), 120); this.pulse(h, 0.7, 60); this.app.lab.emit('match_lit', { obj: m.id });
  }
  // ------------------------------------------------------------ grip: pick up and put down
  handPos(h, out) { (h.src && h.src.hand ? h.c : h.grip).getWorldPosition(out); return out; }
  nearest(h, maxD) {
    const p = this.handPos(h, tmp); let best = null, bd = maxD;
    for (const it of this.app.lab.items) {
      if (it.kind === 'rack' || it.kind === 'tripod' || it.kind === 'circuit' || it.noGrab || it.broken || !it.g.visible || this.hands.some((o) => o.held === it)) continue;
      const g = it.g.localToWorld(tmp2.set(0, it.grabY ?? 0.04, 0)); const d = g.distanceTo(p);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }
  grab(h) {
    this.app.audio.unlock(); if (h.held) return;
    let it = this.nearest(h, 0.09); let far = false;
    if (!it) { const hit = this.cast(h); if (hit && hit.item && hit.d < 2.2 && !['rack', 'tripod'].includes(hit.item.kind)) { it = hit.item; far = true; } }
    if (it) this.take(h, it, !far);
  }
  take(h, it, near) {
    if (it.inVessel) { const v = it.inVessel; v.solids.splice(v.solids.indexOf(it), 1); it.inVessel = null; }
    if (it.follow) it.follow = null;
    const holder = h.src && h.src.hand ? h.c : h.grip;
    this.app.scene.attach(it.g); holder.attach(it.g);
    if (!near) { // pull it into the hand, upright
      const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone(); const p1 = new THREE.Vector3(0, -(it.grabY ?? 0.04), -0.03); const q1 = new THREE.Quaternion();
      if (FLAT.includes(it.kind)) q1.setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.3, 0, 0)), p1.set(0, 0, -0.02);
      this.app.runner.K.tween(0.35, (k) => { if (it.g.parent !== holder) return; it.g.position.lerpVectors(p0, p1, k); it.g.quaternion.slerpQuaternions(q0, q1, k); });
    }
    h.held = it; it.held = h; if (it.stopper) it.stopper.visible = false;
    this.pulse(h, 0.6, 50); this.app.audio.clink(); this.app.lab.emit('grab', { obj: it.id });
  }
  // a solid (granules, ribbon, nail, crystals) let go above the mouth of an open vessel falls into it (desktop and VR)
  dropSolid(it) {
    const lab = this.app.lab, K = this.app.runner.K; if (!(it.chem && SOLID.includes(it.kind)) || it.inVessel) return false;
    for (const v of lab.vessels) {
      if (v === it || v.closed || v.broken) continue; const m = v.mouthWorld(tmp);
      if (Math.hypot(m.x - it.g.position.x, m.z - it.g.position.z) < Math.max(0.025, v.rimR * 1.4) && it.g.position.y > m.y - 0.02 && it.g.position.y < m.y + 0.25) {
        this.app.scene.attach(it.g); const from = it.g.position.clone(); const bottom = v.g.localToWorld(new THREE.Vector3(0, v.inner[0].y + 0.004, 0));
        K.tween(0.4, (k) => { it.g.position.lerpVectors(from, bottom, k * k); }).then(() => lab.putSolid(it, v));
        return true;
      }
    }
    return false;
  }
  release(h) {
    const it = h.held; if (!it) return; h.held = null; it.held = null;
    this.app.scene.attach(it.g); const lab = this.app.lab, K = this.app.runner.K;
    if (this.dropSolid(it)) return; // a solid let go over an open vessel falls in
    if (it.stopper) it.stopper.visible = true;
    // paper, splints, tongs and thermometers go back to their place
    if (FLAT.includes(it.kind) || it.kind === 'ribbon') { if (it.kind === 'splint') it.setFlame && it.setFlame(false); this.settle(it, it.home.p.clone(), it.home.q.clone()); return; }
    // a tube near the rack goes into the nearest free slot
    if (it.kind === 'testtube') {
      for (const rk of lab.items.filter((x) => x.kind === 'rack')) {
        for (const s of rk.slots) {
          const sp = rk.g.localToWorld(new THREE.Vector3(s.x, s.y, s.z ?? 0));
          if (Math.hypot(sp.x - it.g.position.x, sp.z - it.g.position.z) < 0.035 && !lab.vessels.some((o) => o !== it && Math.hypot(o.g.position.x - sp.x, o.g.position.z - sp.z) < 0.01)) {
            this.settle(it, new THREE.Vector3(sp.x, BENCH_Y + s.y - it.base, sp.z), new THREE.Quaternion()); return;
          }
        }
      }
    }
    // otherwise it is a real object: it falls, tips over, rolls or flies (and glass may break)
    if (this.app.phys && this.app.phys.drop(it, h.vel, h.angVel)) return;
    // (no physics engine) stand it upright on the bench (or the shelf) right below
    const p = it.g.position.clone();
    const shelfY = this.app.roomInfo.shelfY; let y = BENCH_Y;
    if (p.z < BENCH.z0 + 0.1 && p.y > shelfY[0] + 0.02) y = p.y > shelfY[1] + 0.02 ? shelfY[1] : shelfY[0];
    p.x = Math.max(BENCH.x0 + 0.05, Math.min(BENCH.x1 - 0.05, p.x)); p.z = Math.max(BENCH.z0 + 0.04, Math.min(BENCH.z1 - 0.04, p.z));
    const yaw = new THREE.Euler().setFromQuaternion(it.g.quaternion, 'YXZ').y;
    this.settle(it, new THREE.Vector3(p.x, y - it.base, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)));
  }
  settle(it, p, q) {
    const p0 = it.g.position.clone(), q0 = it.g.quaternion.clone();
    this.app.runner.K.tween(0.3, (k) => { if (it.held) return; it.g.position.lerpVectors(p0, p, k); it.g.quaternion.slerpQuaternions(q0, q, k); })
      .then(() => { if (!it.held && it.kind !== 'splint' && it.kind !== 'strip') it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; this.app.audio.clink(); });
  }
  walk(dt) {
    const r = this.app.renderer; const base = this.baseRef || (this.baseRef = r.xr.getReferenceSpace()); if (!base || typeof XRRigidTransform === 'undefined') return;
    const L = this.loco || (this.loco = { x: 0, z: 0, yaw: 0, turned: false }); let mx = 0, mz = 0, turn = 0;
    for (const h of this.hands) { const gp = h.src && h.src.gamepad; if (!gp || !gp.axes || gp.axes.length < 4) continue; const ax = gp.axes[2], ay = gp.axes[3];
      if (h.src.handedness === 'left') { mx += Math.abs(ax) > 0.15 ? ax : 0; mz += Math.abs(ay) > 0.15 ? ay : 0; } else { if (Math.abs(ax) > 0.7) turn = Math.sign(ax); } }
    const cam = r.xr.getCamera(); const head = cam.getWorldPosition(tmp); let changed = false;
    if (mx || mz) { const f = cam.getWorldDirection(tmp2).setY(0); if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize(); const rt = new THREE.Vector3(-f.z, 0, f.x); const sp = 1.3 * dt; const dx = (rt.x * mx - f.x * mz) * sp, dz = (rt.z * mx - f.z * mz) * sp;
      const nx = Math.max(-3.5, Math.min(3.5, head.x + dx)), nz = Math.max(-3.3, Math.min(3.4, head.z + dz)); L.x += nx - head.x; L.z += nz - head.z; changed = true; }
    if (turn && !L.turned) { const d = -turn * Math.PI / 6; const c = Math.cos(d), s = Math.sin(d); const ox = head.x - L.x, oz = head.z - L.z; L.x = head.x - (ox * c + oz * s); L.z = head.z - (-ox * s + oz * c); L.yaw += d; changed = true; L.turned = true; }
    if (!turn) L.turned = false;
    if (changed) { const c = Math.cos(-L.yaw), s = Math.sin(-L.yaw); const px = -(L.x * c + L.z * s), pz = -(-L.x * s + L.z * c); const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -L.yaw);
      r.xr.setReferenceSpace(base.getOffsetReferenceSpace(new XRRigidTransform({ x: px, y: 0, z: pz, w: 1 }, { x: q.x, y: q.y, z: q.z, w: q.w }))); }
  }
  pulse(h, v, ms) { try { const a = h.src && h.src.gamepad && h.src.gamepad.hapticActuators && h.src.gamepad.hapticActuators[0]; a && a.pulse(v, ms); } catch (e) {} }
  // ------------------------------------------------------------ every frame in the headset
  update(dt = 1 / 72) {
    if (!this.app.renderer.xr.isPresenting) return;
    const lab = this.app.lab; const ui = this.app.ui;
    this.walk(dt);
    for (const h of this.hands) {
      if (!h.src) continue;
      // hand speed and spin (for throwing what it lets go of)
      const hpos = this.handPos(h, tmp), hq = (h.src && h.src.hand ? h.c : h.grip).getWorldQuaternion(tq);
      if (!h.vel) { h.vel = new THREE.Vector3(); h.angVel = new THREE.Vector3(); h.lp = hpos.clone(); h.lq = hq.clone(); }
      const k = Math.min(1, dt * 18); h.vel.lerp(tmp2.copy(hpos).sub(h.lp).divideScalar(Math.max(dt, 1e-3)), k);
      const dq = h.lq.clone().invert().premultiply(hq); const ang = 2 * Math.acos(Math.min(1, Math.abs(dq.w))); const ax = new THREE.Vector3(dq.x, dq.y, dq.z); if (ax.lengthSq() > 1e-10) ax.normalize().multiplyScalar((dq.w < 0 ? -1 : 1) * ang / Math.max(dt, 1e-3)); else ax.set(0, 0, 0);
      h.angVel.lerp(ax, k); h.lp.copy(hpos); h.lq.copy(hq);
      // hand tracking: show finger tips
      if (h.src.hand) { const tipJ = ['index-finger-tip', 'thumb-tip']; tipJ.forEach((n, k) => { const j = h.hand.joints && h.hand.joints[n]; if (j && j.visible !== false) { h.tips[k].visible = true; j.getWorldPosition(h.tips[k].position); } }); }
      const hit = h.held ? null : this.cast(h);
      const len = hit ? hit.d : 1.2; h.line.scale.z = len; h.dot.visible = !!hit; if (hit) h.dot.position.copy(hit.p);
      const hp = hit && hit.panel ? hit.panel : null; const id = hp ? hp.hitUV(hit.uv) : null;
      if (h.hoverPanel && (h.hoverPanel !== hp || h.hoverPanel.hover !== id)) { h.hoverPanel.hover = null; ui.dirty = true; }
      if (hp && hp.hover !== id) { hp.hover = id; ui.dirty = true; if (id) this.pulse(h, 0.15, 10); }
      h.hoverPanel = hp;
      // a match rubbed quickly along the side of the box strikes; a burning match or splint held at a wick lights the lamp
      const it = h.held;
      if (it && it.kind === 'match' && !it.burning && !it.spent && h.vel && h.vel.length() > 0.45) this.strike(h, false);
      if (it && (it.kind === 'match' || it.kind === 'splint') && it.burning) {
        const tip = it.g.localToWorld(tmp.copy(it.tipLocal));
        for (const f of lab.items) if (f.setLit && !f.lit && f.heatPoint && f.g.localToWorld(tmp2.copy(f.heatPoint)).distanceTo(tip) < 0.045) { f.setLit(true); lab.emit('lit', { obj: f.id, by: it.id }); this.app.audio.whoosh(); this.pulse(h, 0.6, 50); }
      }
      // held splint catches fire in a flame
      if (it && it.kind === 'splint' && !it.burning) {
        const tip = it.g.localToWorld(tmp.copy(it.tipLocal));
        for (const f of lab.items) if (f.lit && f.heatPoint && f.g.localToWorld(tmp2.copy(f.heatPoint)).distanceTo(tip) < 0.04) { it.setFlame(true); it.popped = false; this.app.audio.whoosh(); lab.emit('splint_lit', { obj: it.id }); }
      }
    }
  }
}
