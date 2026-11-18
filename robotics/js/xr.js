// DUET Robotics Lab 360: the headset view (WebXR: Meta Quest and others). The bench stands on a table in front of you,
// twice its real size so the holes are easy to see. Thumbstick left/right turns the bench, up/down makes it bigger or
// smaller; squeeze the grip and move your hand to turn it. Everything else is done with the ray of a controller or of
// a hand (pinch = trigger): wiring, parts, the code, Run, the robot (xrui.js). A/X turns the part you hold, B/Y lets it go.
// Batch 2: the view can move to the robot beside the bench (the arm, the bin) or to the robot floor (the cars), smaller.
// In the headset nothing casts a shadow every frame: the bench's shadow map is drawn again only when the bench changes.
import * as THREE from 'three';
import { XRUI } from './xrui.js';
import { ARM_POS, ARENA_POS, BIN_POS, HYD_POS } from './robots.js';

const JOINTS = ['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip', 'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip',
  'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip', 'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip',
  'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'];

const TM = new THREE.Matrix4(), TP = new THREE.Vector3(), TS = new THREE.Vector3(), TQ = new THREE.Quaternion();

export class XR {
  constructor(stage, app) {
    this.stage = stage; this.app = app; this.session = null; this.scale = 2; this.yaw = 0; this.grab = null; this.focus = 'bench';
    const r = stage.renderer;
    this.ctrls = [0, 1].map((i) => { const c = r.xr.getController(i); c.userData.i = i; stage.scene.add(c);
      const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.8 }));
      ray.scale.z = 0.6; c.add(ray); c.userData.rayLine = ray; c.visible = false;
      c.addEventListener('squeezestart', () => { this.grab = { c, x: c.position.x, yaw: this.yaw }; });
      c.addEventListener('squeezeend', () => { this.grab = null; });
      c.addEventListener('selectstart', () => { if (this.ui) this.ui.down(i); });
      c.addEventListener('selectend', () => { if (this.ui) this.ui.up(i); });
      c.addEventListener('connected', (e) => { c.userData.src = e.data; c.visible = true; });
      c.addEventListener('disconnected', () => { c.visible = false; c.userData.src = null; if (this.ui) this.ui.up(i); });
      return c; });
    // a simple model in each hand: the controller's grip (a short handle), or the hand's joints (one draw call per hand)
    this.grips = [0, 1].map((i) => { const g = r.xr.getControllerGrip(i); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.5 })); m.rotation.x = Math.PI / 2 - 0.5; m.position.z = 0.02; g.add(m); stage.scene.add(g); return g; });
    this.hands = [0, 1].map((i) => { const h = r.xr.getHand(i); stage.scene.add(h);
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8b49a, roughness: 0.7 }), JOINTS.length); im.frustumCulled = false; im.count = 0; stage.scene.add(im); h.userData.im = im; return h; });
    this.ui = new XRUI(this, app);
    this.prevBtn = [[], []];
  }
  async supported() { try { return !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { return false; } }
  async enter(quiet) {
    if (!navigator.xr || this.session) return !!this.session;
    let s; try { s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }); } catch (e) { this.lastErr = `${e.name}: ${e.message}`; if (!quiet) this.app.toast(String(e.message || e)); return false; }
    // 72 Hz, the rate this app holds on every Quest (a Quest 3 may otherwise start at 90 Hz)
    try { const fr = s.supportedFrameRates && [...s.supportedFrameRates].filter((x) => x >= 72).sort((a, b) => a - b)[0]; if (fr && s.updateTargetFrameRate) s.updateTargetFrameRate(fr).catch(() => {}); } catch (e) { /* older browsers */ }
    const st = this.stage; this.session = s; this.saved = { pos: st.root.position.clone(), scale: st.root.scale.clone(), rot: st.root.rotation.clone(), bloom: st.noBloom, blur: st.scene.backgroundBlurriness };
    st.noBloom = true; st.scene.backgroundBlurriness = 0; // in a headset the workshop around you is sharp
    this.saved.near = st.camera.near; this.saved.far = st.camera.far; st.camera.near = 0.02; st.camera.far = 200; st.camera.updateProjectionMatrix(); // metres in the headset, not mm
    const sm = st.renderer.shadowMap; sm.autoUpdate = false; sm.needsUpdate = true; // shadows only when the bench changes
    await st.renderer.xr.setSession(s);
    document.body.classList.add('in-vr'); this.place(); this.ui.show(true);
    s.addEventListener('end', () => this.exit());
    return true;
  }
  // where the view is centred: the bench, or the robot (smaller, so a whole floor fits on the table)
  setFocus(f) { this.focus = f; this.place(); this.ui.sig = ''; }
  centre() {
    const Ls = this.app.mode === 'lesson' && this.app.rt.lesson; const w = Ls && Ls.world;
    if (w && w.centre) return w.centre(this.focus); // batch 5: a world on its own desk (the micro:bit)
    if (this.focus !== 'robot' || !w) return { c: [0, 0, 0], k: 1 };
    if (w.kind === 'car') return { c: [ARENA_POS[0], 0, ARENA_POS[2] + 60], k: 0.24 };
    const p = w.kind === 'arm' ? ARM_POS : w.kind === 'bin' ? BIN_POS : HYD_POS; return { c: [p[0] - 60, 0, p[2] + 40], k: 1 };
  }
  place() {
    const r = this.stage.root; const { c, k } = this.centre(); const s = 0.001 * this.scale * k;
    r.scale.setScalar(s); r.rotation.set(0, this.yaw, 0);
    const off = new THREE.Vector3(c[0] * s, c[1] * s, c[2] * s).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    r.position.set(-off.x, 0.86 - off.y, -0.42 - off.z); this.stage.kick();
  }
  exit() {
    const st = this.stage; if (this.saved) { st.root.position.copy(this.saved.pos); st.root.scale.copy(this.saved.scale); st.root.rotation.copy(this.saved.rot); st.noBloom = this.saved.bloom; st.scene.backgroundBlurriness = this.saved.blur; st.camera.near = this.saved.near; st.camera.far = this.saved.far; st.camera.updateProjectionMatrix(); }
    st.renderer.shadowMap.autoUpdate = true; this.ui.show(false); this.ui.drop(); this.focus = 'bench';
    this.session = null; document.body.classList.remove('in-vr'); st.resize(); st.kick();
    if (this.app.onVREnd) this.app.onVREnd();
  }
  // the panel's Exit button: out of the headset view; the installed app also closes (its window has no close button)
  leave() {
    const s = this.session; if (s) s.end().catch(() => {});
    if (!document.body.classList.contains('app-vr')) return;
    setTimeout(() => { try { window.close(); } catch (e) { /* not ours to close */ } setTimeout(() => { if (document.visibilityState === 'visible') location.href = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.HOME;end'; }, 500); }, 300);
  }
  update(dt) {
    if (!this.session) return;
    this.ctrls.forEach((c, i) => {
      const src = c.userData.src; const gp = src && src.gamepad; if (!gp || !gp.axes || (src && src.hand)) return;
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0], ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
      if (Math.abs(ax) > 0.2) this.yaw -= ax * dt * 1.4;
      if (Math.abs(ay) > 0.2) this.scale = Math.max(0.5, Math.min(5, this.scale * (1 - ay * dt * 1.2)));
      // A / X turns the part in the ray; B / Y lets go of it (the "xr-standard" buttons 4 and 5)
      const b = gp.buttons || []; const was = this.prevBtn[i];
      if (b[4] && b[4].pressed && !was[4]) this.ui.rotate(); if (b[5] && b[5].pressed && !was[5]) this.ui.drop();
      this.prevBtn[i] = b.map((x) => x && x.pressed);
    });
    if (this.grab) this.yaw = this.grab.yaw + (this.grab.c.position.x - this.grab.x) * 6;
    this.place(); this.ui.place();
    // the hands: a sphere on every joint
    for (const h of this.hands) {
      const im = h.userData.im; let n = 0; const m = TM, p = TP, sc = TS; // (no new objects each frame: no garbage-collector pauses in the headset)
      // (a hand put down, the controllers picked up: three.js hides the hand, not its joints)
      if (h.joints && h.visible) for (const name of JOINTS) { const j = h.joints[name]; if (!j || !j.visible) continue; const rr = (j.jointRadius || 0.008) * 0.9; m.compose(j.getWorldPosition(p), TQ, sc.set(rr, rr, rr)); im.setMatrixAt(n++, m); }
      im.count = n; im.instanceMatrix.needsUpdate = true;
    }
    this.ui.update(dt);
  }
}
