// AR and VR on an ordinary phone, without WebXR (the Android app's web view has none, and many phones have no ARCore):
// - "VR box": the screen split in two (one picture per eye) for a phone slid into a VR box / Cardboard viewer; turn
//   your head to look around (the phone's gyro), look at a button or a glowing item and hold your gaze on it (or tap
//   the screen, or press the box's remote button) to press it. The headset panels (menu and step card) stand beside
//   the bench as in a Quest.
// - "Camera AR": the phone camera's picture behind the bench and the experiment, which stay in front of you as you
//   turn the phone; the page's own buttons stay on the screen, and tapping things works as usual.
// Exit: the ✕ button, or the phone's back button. (Shared: Science/Maths Lab and Human Body; the pre-commit hook copies it.)
import * as THREE from 'three';

const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // the camera looks out of the back of the phone
const eul = new THREE.Euler(), q0 = new THREE.Quaternion(), qs = new THREE.Quaternion(), tmp = new THREE.Vector3();
const DWELL = 1.3; // seconds of looking at a button or a glowing item to press it

export const phoneXRWanted = () => !!window.DuetNative || (matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window);

export class PhoneXR {
  constructor(app, o = {}) {
    this.app = app; this.o = o; this.on = false; this.mode = null; this.box = false;
    this.cam = o.camera || app.camera;
    this.stereo = new THREE.StereoCamera(); this.stereo.eyeSep = 0.064;
    this.ori = null; this.yaw0 = 0; this.drag = { yaw: 0, pitch: -0.25 };
    // the gaze "controller": a ray straight out of the middle of your view, with a ring that fills while you look at something
    this.gaze = new THREE.Object3D(); this.rig = new THREE.Group(); this.rig.add(this.gaze);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.014, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthTest: false }));
    const fill = new THREE.Mesh(new THREE.RingGeometry(0.0, 0.0085, 40, 1, 0, Math.PI * 2), new THREE.MeshBasicMaterial({ color: 0xf0a65a, transparent: true, opacity: 0.95, depthTest: false }));
    for (const m of [ring, fill]) { m.renderOrder = 99; m.userData.noHit = true; m.position.z = -0.6; this.rig.add(m); }
    this.ring = ring; this.fill = fill; ring.visible = fill.visible = false;
    // what XRInput needs of a hand to cast its ray and press with it
    const line = new THREE.Object3D(); const dot = new THREE.Object3D();
    this.hand = { i: 9, c: this.gaze, grip: this.gaze, hand: new THREE.Group(), line, dot, model: new THREE.Group(), tips: [], held: null, src: { handedness: 'none', gamepad: null }, hover: null, hoverPanel: null };
    this.onOri = (e) => { if (e.alpha == null && e.beta == null) return; this.ori = e; };
    this.onKey = (e) => { if (!this.on) return; if (e.code === 'Enter' || e.code === 'Space' || e.key === 'MediaPlayPause' || e.key === 'AudioVolumeUp' || e.key === 'AudioVolumeDown') { e.preventDefault(); e.stopPropagation(); if (this.box) this.press(); } if (e.key === 'Escape') this.stop(); };
    this.onPop = () => { if (this.on) this.stop(true); };
    this.onResize = () => { if (this.on) this.size(); };
    this.ui();
  }
  ui() {
    const b = document.createElement('div'); b.id = 'pxr'; b.innerHTML = `<button id="pxr-exit" aria-label="Exit">✕</button><button id="pxr-centre" aria-label="Recentre">⟳</button>`;
    document.body.appendChild(b);
    const st = document.createElement('style'); st.textContent = `#pxr{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:60;display:none;gap:10px}
      body.pxr-on #pxr{display:flex}#pxr button{width:44px;height:44px;border-radius:50%;border:0;background:rgba(12,15,22,.72);color:#fff;font:600 20px system-ui;box-shadow:0 2px 10px rgba(0,0,0,.35)}
      body.pxr-box #pxr{top:auto;bottom:6px}body.pxr-box #pxr button{width:36px;height:36px;font-size:16px;opacity:.6}
      body.pxr-box #top,body.pxr-box #list,body.pxr-box #story,body.pxr-box #notebook,body.pxr-box #tip,body.pxr-on #joy,body.pxr-on #list,body.pxr-on #notebook{display:none!important}
      body.pxr-on:not(.pxr-box) #pxr{top:auto;bottom:10px;left:12px;transform:none;flex-direction:column}
      .pxr-chip{font:600 13px system-ui}`;
    document.head.appendChild(st);
    b.querySelector('#pxr-exit').onclick = () => this.stop();
    b.querySelector('#pxr-centre').onclick = () => this.recentre();
  }
  // ------------------------------------------------------------ in and out
  async start(mode) {
    if (this.on) this.stop();
    const app = this.app; app.audio && app.audio.unlock && app.audio.unlock();
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) {}
    addEventListener('deviceorientation', this.onOri, true); addEventListener('keydown', this.onKey, true); addEventListener('resize', this.onResize);
    if (mode === 'cam') {
      try { await this.camera(); } catch (e) { this.cleanup(); app.ui.toast({ en: 'The camera could not be opened: ' + e.message, hi: 'कैमरा नहीं खुल सका: ' + e.message, hg: 'Camera nahi khul saka: ' + e.message }); return false; }
    }
    this.on = true; this.mode = mode; this.box = mode === 'box'; this.ori = null; this.need0 = true;
    // in the Android app the phone's volume buttons (and Bluetooth VR remotes, which send them) press too, while in the box
    try { if (window.DuetNative && DuetNative.vrMode) DuetNative.vrMode(this.box); } catch (e) {}
    this.pads = {};
    const c = this.cam; this.saved = { p: c.position.clone(), q: c.quaternion.clone(), fov: c.fov, aspect: c.aspect, view: c.view ? { ...c.view } : null };
    c.clearViewOffset(); app.scene.add(this.rig);
    document.body.classList.add('pxr-on'); document.body.classList.toggle('pxr-box', this.box);
    try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); } catch (e) {}
    try { await screen.orientation?.lock?.('landscape'); } catch (e) {}
    history.pushState({ pxr: 1 }, ''); addEventListener('popstate', this.onPop);
    const el = app.renderer.domElement; let last = null, moved = 0;
    el.addEventListener('pointerdown', this.onTap = (e) => { last = [e.clientX, e.clientY]; moved = 0; if (this.box || this.o.sceneUI) e.stopPropagation(); if (this.box && this.ori) this.press(); }, true);
    el.addEventListener('pointermove', this.onMove = (e) => { if (!last || this.ori) return; const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY]; moved += Math.abs(dx) + Math.abs(dy); this.dragBy(dx, dy); if (moved > 6) e.stopPropagation(); }, true);
    el.addEventListener('pointerup', this.onUp = (e) => { if (moved < 6) { if (this.box && !this.ori) this.press(); else if (!this.box && this.o.sceneUI) { e.stopPropagation(); this.tapAt(e.clientX, e.clientY); } } last = null; }, true);
    if (this.o.sceneUI) el.addEventListener('click', this.onClick = (e) => e.stopPropagation(), true);
    if (this.box && app.ui && app.ui.vr) { app.ui.vr.visible = true; app.ui.layoutVR(); app.ui.dirty = true; }
    this.ring.visible = this.box || !!this.o.gazeInCam;
    this.hand.src = { handedness: 'none', gamepad: null };
    this.size(); this.pose(); this.o.onStart && this.o.onStart(mode);
    return true;
  }
  stop(fromBack) {
    if (!this.on) return; const app = this.app; this.on = false;
    try { if (window.DuetNative && DuetNative.vrMode) DuetNative.vrMode(false); } catch (e) {}
    this.cleanup();
    if (this.box && app.ui && app.ui.vr) { app.ui.vr.visible = false; if (this.hand.hoverPanel) { this.hand.hoverPanel.hover = null; this.hand.hoverPanel.setHL(null); this.hand.hoverPanel = null; } }
    this.ring.visible = this.fill.visible = false; this.box = false; this.mode = null;
    app.scene.remove(this.rig); const c = this.cam, S = this.saved;
    if (S) { c.position.copy(S.p); c.quaternion.copy(S.q); c.fov = S.fov; c.aspect = innerWidth / innerHeight; if (S.view) c.setViewOffset(S.view.fullWidth, S.view.fullHeight, S.view.offsetX, S.view.offsetY, S.view.width, S.view.height); c.updateProjectionMatrix(); }
    document.body.classList.remove('pxr-on', 'pxr-box');
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { screen.orientation?.unlock?.(); } catch (e) {}
    if (!fromBack && history.state && history.state.pxr) history.back();
    app.renderer.setViewport(0, 0, innerWidth, innerHeight);
    this.o.onStop && this.o.onStop();
  }
  cleanup() {
    removeEventListener('deviceorientation', this.onOri, true); removeEventListener('keydown', this.onKey, true); removeEventListener('resize', this.onResize); removeEventListener('popstate', this.onPop);
    const el = this.app.renderer.domElement; if (this.onTap) { el.removeEventListener('pointerdown', this.onTap, true); el.removeEventListener('pointermove', this.onMove, true); el.removeEventListener('pointerup', this.onUp, true); if (this.onClick) el.removeEventListener('click', this.onClick, true); this.onTap = this.onClick = null; }
    if (this.stream) { for (const t of this.stream.getTracks()) t.stop(); this.stream = null; }
    if (this.video) { this.video.srcObject = null; }
    if (this.vtex) { this.vtex.dispose(); this.vtex = null; }
    if (this.camOn) { this.camOn = false; this.o.onCamera && this.o.onCamera(null); }
  }
  // the phone's back camera, as a picture behind the scene (no see-through canvas needed)
  async camera() {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    this.stream = s; const v = this.video || (this.video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, autoplay: true }));
    v.setAttribute('playsinline', ''); v.srcObject = s; await v.play().catch(() => {});
    this.vtex = new THREE.VideoTexture(v); this.vtex.colorSpace = THREE.SRGBColorSpace; this.camOn = true;
    this.o.onCamera && this.o.onCamera(this.vtex);
  }
  size() {
    const r = this.app.renderer; const w = innerWidth, h = innerHeight;
    this.cam.aspect = this.box ? (w / 2) / h : w / h; this.cam.fov = this.box ? 86 : (w > h ? 52 : 68); this.cam.updateProjectionMatrix();
  }
  // ------------------------------------------------------------ where you look
  recentre() { this.need0 = true; this.drag.yaw = 0; }
  deviceQ(out) {
    const e = this.ori; if (!e) return null;
    const a = THREE.MathUtils.degToRad(e.alpha || 0), b = THREE.MathUtils.degToRad(e.beta || 0), g = THREE.MathUtils.degToRad(e.gamma || 0);
    const o = THREE.MathUtils.degToRad((screen.orientation && screen.orientation.angle) || window.orientation || 0);
    eul.set(b, a, -g, 'YXZ'); out.setFromEuler(eul); out.multiply(Q1); out.multiply(q0.setFromAxisAngle(Z, -o)); return out;
  }
  pose() {
    const o = this.o, app = this.app; const eye = this.box ? (o.eyeBox ? o.eyeBox() : new THREE.Vector3(0, 1.5 + (app.hgt || 0), 0.05)) : (o.eyeCam ? o.eyeCam() : new THREE.Vector3(0, 1.3, 0.12));
    this.cam.position.copy(eye);
    const dq = this.deviceQ(qs);
    if (dq) {
      if (this.need0) { tmp.set(0, 0, -1).applyQuaternion(dq); this.yaw0 = Math.atan2(-tmp.x, -tmp.z); this.need0 = false; } // the way the phone points now becomes "towards the bench"
      this.cam.quaternion.setFromAxisAngle(Y, -this.yaw0).multiply(dq);
    } else { this.cam.quaternion.setFromEuler(eul.set(this.drag.pitch, this.drag.yaw, 0, 'YXZ')); }
    this.cam.updateMatrixWorld(true); this.rig.position.copy(this.cam.position); this.rig.quaternion.copy(this.cam.quaternion); this.rig.updateMatrixWorld(true);
  }
  // look at something and keep looking (or tap) to press it
  press() { this.dwell = 0; this.dwellOn = null; if (this.o.select) { this.o.select(this.gaze, this.hand); return; } const xr = this.app.xr; if (xr) xr.select(this.hand); }
  // a tap with the finger (apps whose buttons are all in the scene): press what is under the finger
  tapAt(x, y) {
    const v = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(this.cam).sub(this.cam.position).normalize();
    const local = v.applyQuaternion(this.rig.quaternion.clone().invert()); this.gaze.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), local); this.gaze.updateMatrixWorld(true);
    this.press(); this.gaze.quaternion.identity(); this.gaze.updateMatrixWorld(true);
  }
  // a Bluetooth game controller or VR-box remote: any face button or trigger presses, Start (or the stick pressed) re-centres
  padTick() {
    const gs = navigator.getGamepads ? navigator.getGamepads() : []; if (!gs) return;
    for (const g of gs) { if (!g) continue; const was = this.pads[g.index] || [];
      const now = g.buttons.map((b) => !!(b && (b.pressed || b.value > 0.6)));
      const edge = (i) => now[i] && !was[i];
      if (this.box && [0, 1, 2, 3, 5, 7].some(edge)) this.press();
      if (edge(9) || edge(10) || edge(11)) this.recentre && this.recentre();
      this.pads[g.index] = now; }
  }
  gazeTick(dt) {
    this.padTick();
    if (this.o.dwellKey) { // the app says what the gaze is on (a button, or nothing to press by looking)
      if (!this.box && !this.o.gazeInCam) { this.fill.visible = false; return; }
      const key = this.o.dwellKey(this.gaze);
      if (key && key === this.dwellOn) { this.dwell += dt; if (this.dwell >= DWELL) this.press(); } else { this.dwellOn = key; this.dwell = 0; }
      const k = key ? Math.min(1, this.dwell / DWELL) : 0; this.fill.visible = k > 0.02; this.fill.scale.setScalar(Math.max(0.05, k)); this.ring.material.color.setHex(key ? 0xf0a65a : 0xffffff); return;
    }
    const xr = this.app.xr; if (!xr || !this.box) return;
    const hit = xr.cast(this.hand); const hp = hit && hit.panel ? hit.panel : null; const id = hp ? hp.hitUV(hit.uv) : null;
    const h = this.hand; if (h.hoverPanel && (h.hoverPanel !== hp || h.hoverPanel.hover !== id)) { h.hoverPanel.hover = null; h.hoverPanel.setHL(null); }
    if (hp && hp.hover !== id) { hp.hover = id; hp.setHL(id); } h.hoverPanel = hp;
    const r = this.app.runner; const target = hit && hit.item && r && r.state === 'todo' && r.target && r.target() === hit.item ? hit.item : null;
    const key = id ? 'p:' + id : target ? 'i:' + target.id : null;
    if (key && key === this.dwellOn) { this.dwell += dt; if (this.dwell >= DWELL) this.press(); } else { this.dwellOn = key; this.dwell = 0; }
    const k = key ? Math.min(1, this.dwell / DWELL) : 0; this.fill.visible = k > 0.02; this.fill.scale.setScalar(Math.max(0.05, k));
    this.ring.material.color.setHex(key ? 0xf0a65a : 0xffffff);
  }
  // ------------------------------------------------------------ every frame (instead of the normal render)
  render(dt) {
    const app = this.app, r = app.renderer, scene = app.scene;
    this.pose(); this.gazeTick(dt || 1 / 60);
    if (this.vtex && this.video && this.video.videoWidth) { const va = this.video.videoWidth / this.video.videoHeight, sa = (r.domElement.clientWidth || innerWidth) / (r.domElement.clientHeight || innerHeight); const T = this.vtex;
      if (va > sa) { T.repeat.set(sa / va, 1); T.offset.set((1 - sa / va) / 2, 0); } else { T.repeat.set(1, va / sa); T.offset.set(0, (1 - va / sa) / 2); } }
    if (!this.box) { r.render(scene, this.cam); return; }
    const w = r.domElement.clientWidth || innerWidth, h = r.domElement.clientHeight || innerHeight;
    this.stereo.aspect = 1; this.stereo.update(this.cam);
    r.setScissorTest(true);
    r.setScissor(0, 0, w / 2, h); r.setViewport(0, 0, w / 2, h); r.render(scene, this.stereo.cameraL);
    r.setScissor(w / 2, 0, w / 2, h); r.setViewport(w / 2, 0, w / 2, h); r.render(scene, this.stereo.cameraR);
    r.setScissorTest(false); r.setViewport(0, 0, w, h);
  }
  // no gyro (a computer, or a phone that hides it): drag to look around
  dragBy(dx, dy) { this.drag.yaw -= dx * 0.005; this.drag.pitch = Math.max(-1.4, Math.min(1.4, this.drag.pitch - dy * 0.005)); }
}
