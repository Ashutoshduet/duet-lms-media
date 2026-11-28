// DUET Little Learners: the 3D stage shared by every section.
// - one renderer, scene and camera; bright, warm light without shadows (cheap on a phone)
// - input: touch and mouse (tap to pick, drag to turn, pinch to zoom), keyboard, a Bluetooth remote or game pad,
//   a phone in a VR box (split screen, look around with the gyro, look at a thing and wait, or press, to pick it),
//   and Meta Quest (WebXR: point and pull the trigger, or pinch; thumbsticks walk and turn)
// - every button of a section is also drawn in the scene (a panel in front of you) when the screen's buttons cannot be seen
// - shaders and textures are prepared one by one, between frames, before a scene is shown (no long freeze on a phone)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PHONE = !!window.DuetNative || /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
export const QUEST = /OculusBrowser|Quest/i.test(navigator.userAgent);
const v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), q0 = new THREE.Quaternion(), e0 = new THREE.Euler();
const DWELL = 1.4;

export class Engine {
  constructor(host, app) {
    this.app = app; this.host = host;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
    r.localClippingEnabled = true; r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor');
    if (window.DuetPerf) DuetPerf.watch(r, PHONE ? 1.6 : 2); else r.setPixelRatio(Math.min(devicePixelRatio, PHONE ? 1.5 : 2));
    r.setSize(innerWidth, innerHeight); host.appendChild(r.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xf3e9da);
    this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.03, 300);
    this.rig = new THREE.Group(); this.rig.name = 'rig'; this.rig.add(this.camera); this.scene.add(this.rig);
    const pm = new THREE.PMREMGenerator(r); this.envRoom = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    this.scene.environment = this.envRoom; this.scene.environmentIntensity = 0.75;
    this.hemi = new THREE.HemisphereLight(0xfff6e8, 0x8a7560, 1.25); this.sun = new THREE.DirectionalLight(0xfff1dc, 1.7); this.sun.position.set(2.5, 5, 3.5);
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.pickables = []; this.section = null; this.clock = new THREE.Clock(); this.t = 0; this.mixers = new Set(); this.tweens = [];
    this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2();
    this.look = { yaw: 0, pitch: 0 }; this.move = new THREE.Vector2(); this.keys = new Set();
    this.mode = 'screen'; // screen | box | xr
    this.panel = new Panel3D(this); this.rig.add(this.panel.mesh);
    this.gaze = new Gaze(this); this.box = new VRBox(this); this.xr = new XRInput(this);
    this.pointer(); this.keyboard();
    addEventListener('resize', () => this.resize());
    r.setAnimationLoop((t, f) => this.frame(t, f));
    this.stats = { calls: 0, tris: 0, longest: 0 };
  }
  resize() { if (this.mode === 'xr') return; const r = this.renderer; r.setSize(innerWidth, innerHeight); this.camera.aspect = this.mode === 'box' ? innerWidth / 2 / innerHeight : innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.section && this.section.resize && this.section.resize(); }
  // ------------------------------------------------------------ the scene of a section
  clearScene() {
    const keep = new Set([this.rig, this.hemi, this.sun, this.sun.target]);
    for (const o of [...this.scene.children]) if (!keep.has(o)) { this.scene.remove(o); dispose(o); }
    this.pickables = []; this.mixers.clear(); this.tweens = []; this.scene.fog = null; this.scene.background = new THREE.Color(0xf3e9da);
    this.scene.environment = this.envRoom; this.scene.environmentIntensity = 0.75; this.hemi.intensity = 1.25; this.sun.intensity = 1.7;
    this.hemi.color.set(0xfff6e8); this.hemi.groundColor.set(0x8a7560); this.sun.color.set(0xfff1dc); this.sun.position.set(2.5, 5, 3.5);
    this.rig.position.set(0, 0, 0); this.rig.rotation.set(0, 0, 0); this.camera.position.set(0, 1.2, 0); this.camera.rotation.set(0, 0, 0);
    this.look = { yaw: 0, pitch: 0 }; this.walk = null; this.panel.hide();
  }
  pickable(o, fn, key) { o.userData.onTap = fn; o.userData.key = key || o.uuid; if (!this.pickables.includes(o)) this.pickables.push(o); return o; }
  unpick(o) { const i = this.pickables.indexOf(o); if (i >= 0) this.pickables.splice(i, 1); }
  // where the camera stands and looks, outside a headset (a walk keeps yaw/pitch; a table view is fixed)
  view(pos, target) {
    this.camera.position.copy(pos); this.camera.lookAt(target); e0.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.look.yaw = e0.y; this.look.pitch = e0.x; this.camera.rotation.set(0, 0, 0); this.applyLook();
  }
  applyLook() { this.camera.quaternion.setFromEuler(e0.set(this.look.pitch, this.look.yaw, 0, 'YXZ')); }
  // ------------------------------------------------------------ tweens and animation
  tween(dur, fn, done, ease = easeInOut) { const tw = { t: 0, dur, fn, done, ease }; this.tweens.push(tw); fn(0); return tw; }
  frame(time, xrFrame) {
    const dt = Math.min(0.05, this.clock.getDelta()); this.t += dt; const t0 = performance.now();
    for (const m of this.mixers) m.update(dt);
    for (const tw of [...this.tweens]) { tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(tw.ease(k)); if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done && tw.done(); } }
    this.walkTick(dt);
    this.section && this.section.update && this.section.update(dt, this.t);
    if (this.mode === 'xr') this.xr.tick(dt);
    if (this.mode === 'box') { this.box.render(dt); } else { this.gaze.tick(dt); this.renderer.render(this.scene, this.camera); }
    const info = this.renderer.info.render; this.stats.calls = info.calls; this.stats.tris = info.triangles; this.stats.frameMs = performance.now() - t0;
  }
  // ------------------------------------------------------------ pick with a ray (finger, mouse, gaze, controller)
  hitFrom(origin, dir) {
    this.ray.set(origin, dir); this.ray.far = 60;
    const list = this.pickables.filter((o) => o.visible !== false && visibleUp(o)); if (this.panel.mesh.visible) list.push(this.panel.mesh);
    const hits = this.ray.intersectObjects(list, true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.onTap && o !== this.panel.mesh) o = o.parent; if (o) return { obj: o, point: h.point, uv: h.uv, hit: h }; }
    return null;
  }
  hitScreen(x, y) { this.ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); this.ray.setFromCamera(this.ndc, this.camera); return this.hitFrom(this.ray.ray.origin.clone(), this.ray.ray.direction.clone()); }
  activate(h, how) {
    if (!h) { this.section && this.section.onMiss && this.section.onMiss(how); return false; }
    if (h.obj === this.panel.mesh) return this.panel.press(h.uv);
    h.obj.userData.onTap(h, how); return true;
  }
  pointer() {
    const el = this.renderer.domElement; const pts = new Map(); let downAt = null, moved = 0, pinch0 = 0;
    el.addEventListener('pointerdown', (e) => { if (this.mode !== 'screen') return; el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = 0; this.app.audio.unlock(); } else if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); moved = 99; } });
    el.addEventListener('pointermove', (e) => { if (!pts.has(e.pointerId)) { this.hover(e.clientX, e.clientY); return; } const p = pts.get(e.pointerId); const dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) this.zoom(pinch0 / d); pinch0 = d; return; }
      moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) this.drag(dx, dy); });
    const up = (e) => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (pts.size === 0 && downAt && moved <= 6 && performance.now() - downAt.t < 700) this.activate(this.hitScreen(e.clientX, e.clientY), 'tap'); if (pts.size === 0) { downAt = null; this.section && this.section.dragEnd && this.section.dragEnd(); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); downAt = null; });
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY > 0 ? 1.08 : 0.93); }, { passive: false });
  }
  hover(x, y) { if (PHONE) return; const h = this.hitScreen(x, y); this.renderer.domElement.style.cursor = h ? 'pointer' : (this.walk ? 'grab' : 'default'); }
  drag(dx, dy) {
    const s = this.section; if (s && s.drag && s.drag(dx, dy) !== false) return;
    if (this.walk) { this.look.yaw += dx * 0.0042; this.look.pitch = clamp(this.look.pitch + dy * 0.0042, -1.1, 1.0); this.applyLook(); }
  }
  zoom(k) { const s = this.section; if (s && s.zoom) s.zoom(k); else if (this.walk) { this.camera.fov = clamp(this.camera.fov * k, 30, 70); this.camera.updateProjectionMatrix(); } }
  keyboard() {
    addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      this.keys.add(e.code);
      // a VR box remote or a TV remote: OK / Enter / Space / media keys press what you look at (in the box) or the focused button
      const ok = e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter' || e.key === 'MediaPlayPause' || e.key === 'AudioVolumeUp' || e.key === 'AudioVolumeDown';
      if (this.mode === 'box' && ok) { e.preventDefault(); this.gaze.press(); return; }
      if (this.mode === 'box' && (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack')) { e.preventDefault(); this.box.stop(); return; }
      if (this.mode !== 'box' && document.activeElement === document.body && !this.walk) { if (e.code === 'ArrowRight' || e.code === 'PageDown') { this.section && this.section.step && this.section.step(1); } if (e.code === 'ArrowLeft' || e.code === 'PageUp') { this.section && this.section.step && this.section.step(-1); } }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
  // ------------------------------------------------------------ walking (Harappa lane, museum)
  // walk: { bounds: (x,z)=>[x,z] clamp, speed, eye }  move comes from keys, the on-screen joystick, a game pad or the Quest stick
  walkTick(dt) {
    const w = this.walk; if (!w || this.mode === 'xr') return;
    let f = 0, s = 0; const K = this.keys;
    if (K.has('KeyW') || K.has('ArrowUp')) f += 1; if (K.has('KeyS') || K.has('ArrowDown')) f -= 1;
    if (K.has('KeyA')) s -= 1; if (K.has('KeyD')) s += 1;
    if (K.has('ArrowLeft')) { this.look.yaw += 1.6 * dt; this.applyLook(); } if (K.has('ArrowRight')) { this.look.yaw -= 1.6 * dt; this.applyLook(); }
    f += -this.move.y; s += this.move.x; const pad = this.box.pad; if (this.mode === 'box') { f += -pad.y; this.box.yawOff -= pad.x * 1.5 * dt; } else { f += -pad.y; this.look.yaw -= pad.x * 1.6 * dt; if (pad.x) this.applyLook(); }
    if (!f && !s) return; this.app.onWalk && this.app.onWalk();
    const yaw = this.mode === 'box' ? this.box.headingYaw() : this.look.yaw; const sp = (w.speed || 1.6) * dt;
    const c = this.mode === 'box' ? this.rig.position : this.camera.position;
    let x = c.x + (-Math.sin(yaw) * f + Math.cos(yaw) * s) * sp, z = c.z + (-Math.cos(yaw) * f - Math.sin(yaw) * s) * sp;
    [x, z] = w.bounds ? w.bounds(x, z, c.x, c.z) : [x, z]; c.x = x; c.z = z;
  }
  // glide the viewer to a place (a stop of the tour, or where you tapped the ground)
  glide(at, look, dur = 1.6, done) {
    if (this.mode === 'xr' || this.mode === 'box') { // in a headset: move the feet there, keep the head's own turn
      const from = this.rig.position.clone(), to = new THREE.Vector3(at[0], 0, at[2]); const yaw0 = this.rig.rotation.y; const yaw1 = look ? Math.atan2(-(look[0] - at[0]), -(look[2] - at[2])) : yaw0;
      if (this.mode === 'xr') { this.rig.position.copy(to); this.rig.rotation.y = yaw1 - this.xr.headYaw(); done && done(); return; } // no gliding in a headset (it makes people sick)
      return this.tween(dur, (k) => { this.rig.position.lerpVectors(from, to, k); }, () => { this.box.yawOff += 0; done && done(); });
    }
    const p0 = this.camera.position.clone(), p1 = new THREE.Vector3(...at); const y0 = this.look.yaw, x0 = this.look.pitch;
    let y1 = y0, x1 = x0; if (look) { const d = new THREE.Vector3(...look).sub(p1); y1 = Math.atan2(-d.x, -d.z); x1 = Math.atan2(d.y, Math.hypot(d.x, d.z)); }
    while (y1 - y0 > Math.PI) y1 -= Math.PI * 2; while (y1 - y0 < -Math.PI) y1 += Math.PI * 2;
    return this.tween(dur, (k) => { this.camera.position.lerpVectors(p0, p1, k); this.look.yaw = y0 + (y1 - y0) * k; this.look.pitch = x0 + (x1 - x0) * k; this.applyLook(); }, done);
  }
  // ------------------------------------------------------------ get a scene ready without a long freeze
  async prepare(onProgress) {
    const r = this.renderer, t0 = performance.now(); const texs = new Set(), mats = new Map();
    this.scene.updateMatrixWorld(true);
    this.scene.traverse((o) => { if (!o.isMesh && !o.isPoints && !o.isLine && !o.isSprite) return; for (const m of [].concat(o.material)) { if (!m) continue; const key = m.uuid + (o.isSkinnedMesh ? 's' : '') + (o.isInstancedMesh ? 'i' : ''); if (!mats.has(key)) mats.set(key, o);
      for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.isRenderTargetTexture) texs.add(v); } } });
    let n = 0; const total = texs.size + mats.size;
    for (const tx of texs) { r.initTexture(tx); n++; if (performance.now() - this._slice > 30) { onProgress && onProgress(n / total); await nextFrame(); } }
    for (const o of mats.values()) { const was = o.visible, frus = o.frustumCulled; o.visible = true; try { r.compile(o, this.camera, this.scene); } catch (e) { /* drawn later */ } o.visible = was; n++; onProgress && onProgress(n / total); await nextFrame(); }
    r.render(this.scene, this.camera); await nextFrame();
    this.stats.prepareMs = performance.now() - t0; this.stats.materials = mats.size; this.stats.textures = texs.size;
  }
  get _slice() { return this.__s || (this.__s = performance.now()); }
  set _slice(v) { this.__s = v; }
}

// ------------------------------------------------------------ the buttons in the scene (VR box, headset)
class Panel3D {
  constructor(eng) {
    this.eng = eng; this.W = 1024; this.H = 300; const c = this.canvas = document.createElement('canvas'); c.width = this.W; c.height = this.H;
    this.ctx = c.getContext('2d'); this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72 * this.H / this.W), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, toneMapped: false }));
    this.mesh.renderOrder = 50; this.mesh.visible = false; this.mesh.name = 'panel'; this.items = []; this.hl = null; this.caption = '';
  }
  hide() { this.mesh.visible = false; }
  show(buttons, caption) { this.items = buttons || []; this.caption = caption || ''; this.mesh.visible = this.items.length > 0 || !!this.caption; this.draw(); }
  place() { // in front of the viewer, low, tilted up: look down to use it
    const m = this.mesh; if (this.eng.mode === 'xr') { m.position.set(0, 0.85, -0.55); m.rotation.set(-0.6, 0, 0); this.follow = true; }
    else { m.position.set(0, -0.42, -0.75); m.rotation.set(-0.55, 0, 0); this.follow = false; }
  }
  layout() { const n = Math.max(1, this.items.length); const top = this.caption ? 92 : 20; const w = Math.min(230, (this.W - 20) / n - 10); const x0 = (this.W - (n * (w + 10) - 10)) / 2;
    return this.items.map((b, i) => ({ b, x: x0 + i * (w + 10), y: top, w, h: this.H - top - 18 })); }
  draw() {
    const g = this.ctx, L = this.eng.app.lang; g.clearRect(0, 0, this.W, this.H);
    roundRect(g, 4, 4, this.W - 8, this.H - 8, 34); g.fillStyle = 'rgba(28,22,16,0.82)'; g.fill();
    if (this.caption) { g.fillStyle = '#fff6e8'; g.font = '700 46px "Noto Sans Devanagari", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fit(g, this.caption, this.W - 60), this.W / 2, 52); }
    for (const it of this.layout()) { const on = this.hl === it.b.id; roundRect(g, it.x, it.y, it.w, it.h, 26); g.fillStyle = on ? '#ffb347' : (it.b.primary ? '#f0874a' : 'rgba(255,255,255,0.14)'); g.fill();
      g.fillStyle = on ? '#2a1a08' : '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 70px "Noto Sans Devanagari", system-ui, sans-serif'; g.fillText(it.b.glyph || '•', it.x + it.w / 2, it.y + it.h * 0.38);
      g.font = '600 34px "Noto Sans Devanagari", system-ui, sans-serif'; g.fillText(fit(g, it.b.label ? it.b.label[L] || it.b.label.en : '', it.w - 16), it.x + it.w / 2, it.y + it.h * 0.8); }
    this.tex.needsUpdate = true;
  }
  idAt(uv) { if (!uv) return null; const x = uv.x * this.W, y = (1 - uv.y) * this.H; for (const it of this.layout()) if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return it.b; return null; }
  setHL(b) { const id = b ? b.id : null; if (id !== this.hl) { this.hl = id; this.draw(); } }
  press(uv) { const b = this.idAt(uv); if (b) { this.eng.app.audio.click(); b.on(); return true; } return false; }
}

// ------------------------------------------------------------ look at something and wait to press it (VR box), with a ring that fills
class Gaze {
  constructor(eng) {
    this.eng = eng; this.on = false; this.t = 0; this.key = null;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.011, 0.016, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false, toneMapped: false }));
    const fill = new THREE.Mesh(new THREE.CircleGeometry(0.0095, 40), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.95, depthTest: false, toneMapped: false }));
    for (const m of [ring, fill]) { m.renderOrder = 99; m.position.z = -0.7; m.visible = false; eng.camera.add(m); }
    this.ring = ring; this.fill = fill;
  }
  show(v) { this.on = v; this.ring.visible = v; this.fill.visible = false; }
  current() { const c = this.eng.camera; c.getWorldPosition(v3); c.getWorldDirection(v3b); return this.eng.hitFrom(v3.clone(), v3b.clone()); }
  tick(dt) {
    if (!this.on) return; const h = this.current(); const P = this.eng.panel; let key = null;
    if (h && h.obj === P.mesh) { const b = P.idAt(h.uv); P.setHL(b); key = b ? 'p:' + b.id : null; } else { P.setHL(null); key = h ? 'o:' + (h.obj.userData.key || h.obj.uuid) : null; }
    if (h && h.obj !== P.mesh && h.obj.userData.noDwell) key = null;
    if (key && key === this.key) { this.t += dt; if (this.t >= DWELL) { this.t = -1.2; this.eng.activate(h, 'gaze'); } } else { this.key = key; this.t = 0; }
    const k = key ? clamp(this.t / DWELL, 0, 1) : 0; this.fill.visible = k > 0.03; this.fill.scale.setScalar(Math.max(0.05, k)); this.ring.material.color.setHex(key ? 0xffa040 : 0xffffff);
  }
  press() { const h = this.current(); this.t = -1.2; this.eng.activate(h, 'remote'); }
}

// ------------------------------------------------------------ a phone in a VR box (no WebXR needed)
class VRBox {
  constructor(eng) {
    this.eng = eng; this.stereo = new THREE.StereoCamera(); this.stereo.eyeSep = 0.064; this.ori = null; this.yaw0 = 0; this.yawOff = 0; this.need0 = true; this.pad = new THREE.Vector2(); this.pads = {};
    this.onOri = (e) => { if (e.alpha == null && e.beta == null) return; this.ori = e; };
    this.onPop = () => { if (this.eng.mode === 'box') this.stop(true); };
  }
  async start() {
    const e = this.eng; if (e.mode === 'box') return; e.app.audio.unlock();
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission(); } catch (err) { /* desktop */ }
    addEventListener('deviceorientation', this.onOri, true); this.ori = null; this.need0 = true; this.yawOff = 0;
    try { if (window.DuetNative && DuetNative.vrMode) DuetNative.vrMode(true); } catch (err) { /* web */ }
    this.saved = { pos: e.camera.position.clone(), q: e.camera.quaternion.clone(), fov: e.camera.fov, rig: e.rig.position.clone(), ry: e.rig.rotation.y };
    // the head stands where the camera was; the camera moves inside the rig
    e.rig.position.set(this.saved.pos.x, 0, this.saved.pos.z); e.camera.position.set(0, this.saved.pos.y, 0);
    e.rig.rotation.y = 0; this.yawOff = e.look.yaw; this.pitch0 = e.look.pitch;
    e.mode = 'box'; document.body.classList.add('box-on'); e.gaze.show(true); e.panel.place(); e.app.syncPanel();
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (err) { /* not allowed */ }
    try { await screen.orientation.lock('landscape'); } catch (err) { /* not allowed */ }
    history.pushState({ box: 1 }, ''); addEventListener('popstate', this.onPop);
    e.resize(); e.camera.fov = 88; e.camera.updateProjectionMatrix();
  }
  stop(fromBack) {
    const e = this.eng; if (e.mode !== 'box') return; e.mode = 'screen';
    removeEventListener('deviceorientation', this.onOri, true); removeEventListener('popstate', this.onPop);
    try { if (window.DuetNative && DuetNative.vrMode) DuetNative.vrMode(false); } catch (err) { /* web */ }
    document.body.classList.remove('box-on'); e.gaze.show(false); e.panel.hide();
    const S = this.saved; e.rig.position.copy(S.rig); e.rig.rotation.y = S.ry; e.camera.position.set(S.pos.x + 0 * S.rig.x, S.pos.y, S.pos.z); e.camera.quaternion.copy(S.q); e.camera.fov = S.fov;
    if (e.walk) { e.camera.position.set(this.eng.rig.position.x + (S.pos.x - S.rig.x), S.pos.y, this.eng.rig.position.z + (S.pos.z - S.rig.z)); }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (err) { /* none */ }
    try { screen.orientation.unlock(); } catch (err) { /* none */ }
    if (!fromBack && history.state && history.state.box) history.back();
    e.renderer.setScissorTest(false); e.resize(); e.app.syncPanel();
  }
  headingYaw() { e0.setFromQuaternion(this.eng.camera.getWorldQuaternion(q0), 'YXZ'); return e0.y; }
  pose(dt) {
    const e = this.eng, c = e.camera, o = this.ori;
    this.padTick(dt);
    if (o) {
      const a = THREE.MathUtils.degToRad(o.alpha || 0), b = THREE.MathUtils.degToRad(o.beta || 0), g = THREE.MathUtils.degToRad(o.gamma || 0);
      const so = THREE.MathUtils.degToRad((screen.orientation && screen.orientation.angle) || window.orientation || 0);
      e0.set(b, a, -g, 'YXZ'); q0.setFromEuler(e0); q0.multiply(Q1); q0.multiply(new THREE.Quaternion().setFromAxisAngle(ZA, -so));
      if (this.need0) { v3.set(0, 0, -1).applyQuaternion(q0); this.yaw0 = Math.atan2(-v3.x, -v3.z); this.need0 = false; }
      c.quaternion.setFromAxisAngle(YA, -this.yaw0 + this.yawOff).multiply(q0);
    } else { c.quaternion.setFromEuler(e0.set(this.pitch0 || 0, this.yawOff, 0, 'YXZ')); } // no gyro (a computer): the remote's arrows turn
  }
  padTick(dt) { // a Bluetooth game pad or VR remote: A/X/triggers press, B goes back, the stick and D-pad move and turn
    this.pad.set(0, 0); const gs = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gs || []) { if (!g || g.mapping === 'xr-standard') continue; const was = this.pads[g.index] || []; const now = g.buttons.map((b) => !!(b && (b.pressed || b.value > 0.6))); const edge = (i) => now[i] && !was[i];
      if ([0, 2, 5, 7].some(edge)) this.eng.gaze.press(); if (edge(1)) this.eng.app.back(); if (edge(3) || edge(9)) this.need0 = true;
      const ax = (i) => { const v = g.axes[i] || 0; return Math.abs(v) > 0.2 ? v : 0; };
      this.pad.x += ax(0) + ax(2) + (now[15] ? 1 : 0) - (now[14] ? 1 : 0); this.pad.y += ax(1) + ax(3) + (now[13] ? 1 : 0) - (now[12] ? 1 : 0); this.pads[g.index] = now; }
    const K = this.eng.keys; if (!this.eng.walk) { if (K.has('ArrowLeft')) this.yawOff += 1.4 * dt; if (K.has('ArrowRight')) this.yawOff -= 1.4 * dt; }
    if (!this.eng.walk && this.pad.x) this.yawOff -= this.pad.x * 1.4 * dt;
  }
  render(dt) {
    const e = this.eng, r = e.renderer; this.pose(dt); e.gaze.tick(dt); e.camera.updateMatrixWorld(true);
    const w = r.domElement.clientWidth || innerWidth, h = r.domElement.clientHeight || innerHeight;
    this.stereo.aspect = 1; this.stereo.update(e.camera); r.setScissorTest(true);
    r.setScissor(0, 0, w / 2, h); r.setViewport(0, 0, w / 2, h); r.render(e.scene, this.stereo.cameraL);
    r.setScissor(w / 2, 0, w / 2, h); r.setViewport(w / 2, 0, w / 2, h); r.render(e.scene, this.stereo.cameraR);
    r.setScissorTest(false); r.setViewport(0, 0, w, h);
  }
}
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), ZA = new THREE.Vector3(0, 0, 1), YA = new THREE.Vector3(0, 1, 0);

// ------------------------------------------------------------ Meta Quest (WebXR)
class XRInput {
  constructor(eng) {
    this.eng = eng; this.hands = [];
    const r = eng.renderer;
    for (let i = 0; i < 2; i++) {
      const c = r.xr.getController(i); const g = r.xr.getControllerGrip(i);
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 6).translate(0, 0.5, 0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.65, toneMapped: false }));
      line.scale.z = 3; c.add(line);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false })); dot.visible = false; eng.scene.add(dot);
      const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.07, 4, 10).rotateX(Math.PI / 2.4), new THREE.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.45, metalness: 0.2 })); g.add(grip);
      const h = { c, g, line, dot, src: null, was: {} };
      c.addEventListener('connected', (ev) => { h.src = ev.data; line.visible = ev.data.targetRayMode === 'tracked-pointer'; grip.visible = !ev.data.hand; });
      c.addEventListener('disconnected', () => { h.src = null; });
      c.addEventListener('selectstart', () => this.select(h));
      eng.rig.add(c, g); this.hands.push(h);
    }
    r.xr.addEventListener('sessionstart', () => this.started());
    r.xr.addEventListener('sessionend', () => this.ended());
  }
  async supported() { try { return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-vr')); } catch (e) { return false; } }
  async enter() {
    const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    await this.eng.renderer.xr.setSession(s);
  }
  started() {
    const e = this.eng; this.saved = { pos: e.camera.position.clone(), q: e.camera.quaternion.clone(), rig: e.rig.position.clone() };
    e.mode = 'xr'; e.rig.position.set(this.saved.pos.x, 0, this.saved.pos.z); e.rig.rotation.y = e.look.yaw;
    if (e.section && e.section.xrStart) e.section.xrStart(); e.panel.place(); e.app.syncPanel(); e.app.audio.unlock();
  }
  ended() {
    const e = this.eng; e.mode = 'screen'; e.rig.position.set(0, 0, 0); e.rig.rotation.set(0, 0, 0);
    e.camera.position.copy(this.saved.pos); e.camera.quaternion.copy(this.saved.q); e.panel.hide(); e.resize(); e.app.syncPanel();
  }
  headYaw() { const xc = this.eng.renderer.xr.getCamera(); e0.setFromQuaternion(xc.quaternion, 'YXZ'); return e0.y - this.eng.rig.rotation.y; }
  cast(h) { h.c.getWorldPosition(v3); v3b.set(0, 0, -1).applyQuaternion(h.c.getWorldQuaternion(q0)); return this.eng.hitFrom(v3.clone(), v3b.clone()); }
  select(h) { const hit = this.cast(h); if (!this.eng.activate(hit, 'xr') && this.eng.walk && this.floor) { /* teleport to where the ray meets the floor */
    h.c.getWorldPosition(v3); v3b.set(0, 0, -1).applyQuaternion(h.c.getWorldQuaternion(q0)); if (v3b.y < -0.05) { const t = -v3.y / v3b.y; const x = v3.x + v3b.x * t, z = v3.z + v3b.z * t; const [cx, cz] = this.eng.walk.bounds ? this.eng.walk.bounds(x, z, this.eng.rig.position.x, this.eng.rig.position.z) : [x, z]; this.eng.rig.position.x = cx; this.eng.rig.position.z = cz; } } }
  tick(dt) {
    const e = this.eng; this.floor = !!e.walk; const P = e.panel;
    // the panel follows the head's turn, slowly
    if (P.mesh.visible) { const yaw = this.headYaw(); const cur = P.yaw || 0; let d = yaw - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) > 0.6) P.yaw = cur + d * Math.min(1, dt * 2.5); P.mesh.position.set(-Math.sin(P.yaw || 0) * 0.55, 0.85, -Math.cos(P.yaw || 0) * 0.55); P.mesh.rotation.set(-0.6, P.yaw || 0, 0, 'YXZ'); }
    let hl = null;
    for (const h of this.hands) { if (!h.src) { h.dot.visible = false; continue; } const hit = this.cast(h); h.dot.visible = !!hit; if (hit) { h.dot.position.copy(hit.point); h.line.scale.z = Math.max(0.05, hit.hit.distance); if (hit.obj === P.mesh) hl = P.idAt(hit.uv); } else h.line.scale.z = 3;
      const gp = h.src.gamepad; if (!gp) continue; const ax = gp.axes || []; const x = Math.abs(ax[2] || 0) > 0.25 ? ax[2] : 0, y = Math.abs(ax[3] || 0) > 0.25 ? ax[3] : 0;
      if (e.walk && h.src.handedness === 'left' && (x || y)) { // walk where you look
        const xc = e.renderer.xr.getCamera(); e0.setFromQuaternion(xc.getWorldQuaternion(q0), 'YXZ'); const yaw = e0.y; const sp = 1.4 * dt;
        let nx = e.rig.position.x + (-Math.sin(yaw) * -y + Math.cos(yaw) * x) * sp, nz = e.rig.position.z + (-Math.cos(yaw) * -y - Math.sin(yaw) * x) * sp;
        if (e.walk.bounds) [nx, nz] = e.walk.bounds(nx, nz, e.rig.position.x, e.rig.position.z); e.rig.position.x = nx; e.rig.position.z = nz; }
      if (h.src.handedness === 'right' && x && !h.turned) { e.rig.rotation.y -= Math.sign(x) * Math.PI / 6; h.turned = true; } if (!x) h.turned = false;
      const b = gp.buttons || []; const B = !!(b[5] && b[5].pressed); if (B && !h.was.B) e.app.back(); h.was.B = B; }
    P.setHL(hl);
  }
}

// ------------------------------------------------------------ text in the scene (labels, words, answers)
export function textPlane(text, o = {}) {
  const fs = o.size || 120, pad = o.pad ?? 28, font = `${o.weight || 700} ${fs}px "Noto Sans Devanagari", system-ui, sans-serif`;
  const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = font; const lines = String(text).split('\n');
  const w = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2), lh = fs * 1.32, h = Math.ceil(lh * lines.length + pad * 1.2);
  c.width = Math.min(2048, w); c.height = Math.min(1024, h); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.bg) { roundRect(g, 2, 2, c.width - 4, c.height - 4, Math.min(48, c.height / 2.4)); g.fillStyle = o.bg; g.fill(); }
  if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = fs * 0.12; g.shadowOffsetY = fs * 0.04; }
  g.fillStyle = o.color || '#2b2118'; lines.forEach((l, i) => g.fillText(l, c.width / 2, pad * 0.6 + lh * (i + 0.5)));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const H = o.height || 0.1; const m = new THREE.Mesh(new THREE.PlaneGeometry(H * c.width / c.height, H), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false }));
  m.renderOrder = o.order || 5; m.userData.text = text; return m;
}

// ------------------------------------------------------------ the on-screen joystick (walk sections)
export class Joystick {
  constructor(el, eng) {
    this.el = el; this.eng = eng; const knob = el.querySelector('i'); let id = null, c = null;
    const set = (x, y) => { const R = el.clientWidth / 2; let dx = x - c[0], dy = y - c[1]; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; eng.move.set(dx / R, dy / R); };
    el.addEventListener('pointerdown', (e) => { id = e.pointerId; el.setPointerCapture(id); const b = el.getBoundingClientRect(); c = [b.left + b.width / 2, b.top + b.height / 2]; set(e.clientX, e.clientY); eng.app.audio.unlock(); e.stopPropagation(); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e.clientX, e.clientY); });
    const up = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; eng.move.set(0, 0); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
}

// ------------------------------------------------------------ helpers
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeInOut = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeBack = (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
function visibleUp(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
export function dispose(o) { o.traverse && o.traverse((c) => { if (c.userData && c.userData.shared) return; if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose(); for (const m of [].concat(c.material || [])) { if (m.userData && m.userData.shared) continue; for (const k in m) { const v = m[k]; if (v && v.isTexture && !v.userData.shared) v.dispose(); } m.dispose(); } }); }
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fit(g, s, w) { if (g.measureText(s).width <= w) return s; while (s.length > 1 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
