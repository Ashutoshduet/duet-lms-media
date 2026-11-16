// DUET Robotics Lab 360: the headset view (WebXR). The bench stands on a table in front of you, twice its real size so
// the holes are easy to see. Thumbstick left/right turns the bench, up/down makes it bigger or smaller; squeeze the grip
// and move your hand to turn it. The circuit keeps running. (Picking up and wiring parts in VR comes in a later phase:
// the pointer rays already hit the bench.)
import * as THREE from 'three';

export class XR {
  constructor(stage, app) {
    this.stage = stage; this.app = app; this.session = null; this.scale = 2; this.yaw = 0; this.grab = null;
    const r = stage.renderer;
    this.ctrls = [0, 1].map((i) => { const c = r.xr.getController(i); c.userData.i = i; stage.scene.add(c);
      const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x7fd1ff, transparent: true, opacity: 0.7 }));
      ray.scale.z = 0.6; c.add(ray); c.visible = false;
      c.addEventListener('squeezestart', () => { this.grab = { c, x: c.position.x, yaw: this.yaw }; });
      c.addEventListener('squeezeend', () => { this.grab = null; });
      c.addEventListener('connected', (e) => { c.userData.src = e.data; c.visible = true; });
      c.addEventListener('disconnected', () => { c.visible = false; c.userData.src = null; });
      return c; });
  }
  async supported() { try { return !!navigator.xr && await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { return false; } }
  async enter() {
    if (!navigator.xr) return false;
    let s; try { s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }); } catch (e) { this.app.toast(String(e.message || e)); return false; }
    const st = this.stage; this.session = s; this.saved = { pos: st.root.position.clone(), scale: st.root.scale.clone(), rot: st.root.rotation.clone(), bloom: st.noBloom, blur: st.scene.backgroundBlurriness };
    st.noBloom = true; st.scene.backgroundBlurriness = 0; // in a headset the workshop around you is sharp
    this.saved.near = st.camera.near; this.saved.far = st.camera.far; st.camera.near = 0.02; st.camera.far = 200; st.camera.updateProjectionMatrix(); // metres in the headset, not mm
    await st.renderer.xr.setSession(s);
    document.body.classList.add('in-vr'); this.place();
    s.addEventListener('end', () => this.exit());
    return true;
  }
  place() { const r = this.stage.root; r.scale.setScalar(0.001 * this.scale); r.rotation.set(0, this.yaw, 0); r.position.set(0, 0.86, -0.42); this.stage.kick(); }
  exit() {
    const st = this.stage; if (this.saved) { st.root.position.copy(this.saved.pos); st.root.scale.copy(this.saved.scale); st.root.rotation.copy(this.saved.rot); st.noBloom = this.saved.bloom; st.scene.backgroundBlurriness = this.saved.blur; st.camera.near = this.saved.near; st.camera.far = this.saved.far; st.camera.updateProjectionMatrix(); }
    this.session = null; document.body.classList.remove('in-vr'); st.resize(); st.kick();
  }
  update(dt) {
    if (!this.session) return;
    for (const c of this.ctrls) {
      const gp = c.userData.src && c.userData.src.gamepad; if (!gp || !gp.axes) continue;
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0], ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
      if (Math.abs(ax) > 0.2) this.yaw -= ax * dt * 1.4;
      if (Math.abs(ay) > 0.2) this.scale = Math.max(1, Math.min(5, this.scale * (1 - ay * dt * 1.2)));
    }
    if (this.grab) this.yaw = this.grab.yaw + (this.grab.c.position.x - this.grab.x) * 6;
    this.place();
  }
}
