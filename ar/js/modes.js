// DUET AR viewing modes: one model, seven ways to see it. The viewer page (ar/index.html) and later the DUET STEM 360
// hub use the same code:
//
//   import { startMode, MODES, MODE_INFO } from '../ar/js/modes.js';
//   const ctl = await startMode('pad', { canvas, renderer, scene, camera, root });
//   renderer.setAnimationLoop((t) => { ctl.update(dt); ctl.render(); });
//   ctl.action('turn', 0.2); ctl.action('zoom', 1.2); ctl.recenter();      (BtPad's actions plug straight in)
//   ctl.stop();                                                              (puts root, scene and camera back)
//
// Modes: 'scan' (AR on the DUET AR Cards: each card brings its own model; ctx.onCard(id) asks for it, then setModel()),
// 'screen' (touch to turn and zoom), 'pad' (AR on the printed DUET Pad; a card laid on it brings its model), 'cube' (AR on the paper DUET Cube),
// 'anaglyph' (red-cyan glasses), 'anaglyph-pad' (glasses + pad), 'gyro360' (move the phone to look around a 360°
// scene), 'vrbox' (side by side for a phone VR box; lens distortion off unless ctx.distortion).
// ctx: canvas, renderer (alpha: true), scene, camera (PerspectiveCamera), root (any Object3D: a loaded GLB scene; the
// mode measures it and sizes it to the mode), and optionally:
//   overlay: element the camera <video> goes into (default: the canvas's parent); item: {scale, float, yaw} from
//   catalog.json; pano: URL of an equirectangular 360° picture for gyro360/vrbox; hfov, procWidth: tracker settings;
//   distortion: true for VR-box lens correction; onState(state): tracking news ('searching' | 'tracking' | 'holding' |
//   'fading' | 'lost'); test: video width of a test video (reads its frame numbers).
// Errors: startMode throws an Error with .code 'camera' when the camera cannot be opened (no permission, no camera).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Tracker, openCamera, closeCamera } from './tracker.js';
import { Anaglyph } from './anaglyph.js';
import { GyroLook, needsPermission } from './gyro.js';

export const MODES = ['scan', 'screen', 'pad', 'cube', 'anaglyph', 'anaglyph-pad', 'gyro360', 'vrbox'];

/** badge, one-line hint and what each mode needs; strings in English (en), Hindi (hi) and Hinglish (hg) */
export const MODE_INFO = {
  scan: { icon: 'card', camera: true, board: 'cards', boards: ['cards', 'pad'], badge: { en: 'AR · Cards', hi: 'AR · कार्ड', hg: 'AR · Cards' },
    hint: { en: 'Point the camera at a DUET AR card.', hi: 'कैमरे को DUET AR कार्ड की ओर करें।', hg: 'Camera ko DUET AR card ki taraf karo.' },
    searching: { en: 'Looking for a DUET AR card…', hi: 'DUET AR कार्ड ढूँढ रहे हैं…', hg: 'DUET AR card dhoondh rahe hain…' } },
  screen: { icon: 'screen', camera: false, badge: { en: 'Screen 3D', hi: 'स्क्रीन 3D', hg: 'Screen 3D' },
    hint: { en: 'Drag to turn the model, pinch to zoom.', hi: 'मॉडल घुमाने के लिए खींचें, ज़ूम के लिए दो उँगलियाँ फैलाएँ।', hg: 'Model ghumane ke liye kheencho, zoom ke liye do ungliyan failao.' } },
  pad: { icon: 'pad', camera: true, board: 'pad', boards: ['pad', 'cards'], badge: { en: 'AR · DUET Pad', hi: 'AR · DUET पैड', hg: 'AR · DUET Pad' },
    hint: { en: 'Hold the pad in front of the camera.', hi: 'पैड को कैमरे के सामने रखें।', hg: 'Pad ko camera ke saamne rakho.' },
    searching: { en: 'Looking for the DUET Pad…', hi: 'DUET पैड ढूँढ रहे हैं…', hg: 'DUET Pad dhoondh rahe hain…' } },
  cube: { icon: 'cube', camera: true, board: 'cube', boards: ['cube'], badge: { en: 'AR · DUET Cube', hi: 'AR · DUET घन', hg: 'AR · DUET Cube' },
    hint: { en: 'Hold the cube in front of the camera and turn it.', hi: 'घन को कैमरे के सामने पकड़ें और घुमाएँ।', hg: 'Cube ko camera ke saamne pakdo aur ghumao.' },
    searching: { en: 'Looking for the DUET Cube…', hi: 'DUET घन ढूँढ रहे हैं…', hg: 'DUET Cube dhoondh rahe hain…' } },
  anaglyph: { icon: 'glasses', camera: false, badge: { en: '3D glasses', hi: '3D चश्मा', hg: '3D chashma' },
    hint: { en: 'Put on red-cyan glasses: red on the left eye.', hi: 'लाल-नीला चश्मा पहनें: लाल बाईं आँख पर।', hg: 'Laal-neela chashma pehno: laal left aankh par.' } },
  'anaglyph-pad': { icon: 'glasses', camera: true, board: 'pad', boards: ['pad', 'cards'], badge: { en: '3D glasses · Pad', hi: '3D चश्मा · पैड', hg: '3D chashma · Pad' },
    hint: { en: 'Glasses on, then point the phone at the pad.', hi: 'चश्मा पहनें, फिर फ़ोन को पैड की ओर करें।', hg: 'Chashma pehno, phir phone pad ki taraf karo.' },
    searching: { en: 'Looking for the DUET Pad…', hi: 'DUET पैड ढूँढ रहे हैं…', hg: 'DUET Pad dhoondh rahe hain…' } },
  gyro360: { icon: 'gyro', camera: false, badge: { en: 'Gyro 360°', hi: 'जायरो 360°', hg: 'Gyro 360°' },
    hint: { en: 'Move the phone to look all around.', hi: 'चारों ओर देखने के लिए फ़ोन घुमाएँ।', hg: 'Chaaron taraf dekhne ke liye phone ghumao.' },
    noSensor: { en: 'No motion sensor here: drag to look around.', hi: 'यहाँ मोशन सेंसर नहीं है: देखने के लिए खींचें।', hg: 'Yahan motion sensor nahi hai: dekhne ke liye kheencho.' } },
  vrbox: { icon: 'vrbox', camera: false, badge: { en: 'VR box', hi: 'VR बॉक्स', hg: 'VR box' },
    hint: { en: 'Put the phone in the VR box; the remote turns and zooms.', hi: 'फ़ोन को VR बॉक्स में रखें; रिमोट से घुमाएँ और ज़ूम करें।', hg: 'Phone ko VR box mein rakho; remote se ghumao aur zoom karo.' } },
};
export const modeText = (mode, key, lang = 'en') => { const t = MODE_INFO[mode] && MODE_INFO[mode][key]; return t ? (t[lang] || t.en) : ''; };

/** starts a mode; see the top of this file */
export async function startMode(mode, ctx) {
  if (!MODES.includes(mode)) throw new Error('unknown mode: ' + mode);
  const c = new ModeController(mode, ctx);
  try { await c.start(); } catch (e) { c.stop(); throw e; }
  return c;
}

// ---------------------------------------------------------------------------------------------------- helpers
const box = new THREE.Box3();
function measure(root) {
  // the model's box in its own axes: lift it out of its parent and undo its own transform for a moment
  const parent = root.parent, p = root.position.clone(), q = root.quaternion.clone(), s = root.scale.clone();
  if (parent) parent.remove(root);
  root.position.set(0, 0, 0); root.quaternion.identity(); root.scale.set(1, 1, 1); root.updateMatrixWorld(true);
  box.setFromObject(root, true);
  root.position.copy(p); root.quaternion.copy(q); root.scale.copy(s);
  if (parent) parent.add(root);
  if (box.isEmpty()) box.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
  return { size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()), min: box.min.clone() };
}

let blobTex = null;
function shadowBlob() {
  if (!blobTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.32)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); blobTex = new THREE.CanvasTexture(cv);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = -1; m.name = 'duet-shadow'; return m;
}

let studioTex = null;
/** our own backdrop for 3D glasses and 360° without a panorama: a soft studio dome with a ring-marked floor */
export function studioBackdrop() {
  if (studioTex) return studioTex;
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), sky = g.createLinearGradient(0, 0, 0, H / 2);
  sky.addColorStop(0, '#0b1018'); sky.addColorStop(0.7, '#1c2533'); sky.addColorStop(1, '#2f3a4a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H / 2);
  const fl = g.createLinearGradient(0, H / 2, 0, H); fl.addColorStop(0, '#2a323e'); fl.addColorStop(1, '#141a22');
  g.fillStyle = fl; g.fillRect(0, H / 2, W, H / 2);
  g.strokeStyle = 'rgba(160,175,195,0.16)'; g.lineWidth = 2;
  for (let k = 1; k <= 9; k++) { const y = H / 2 + (H / 2) * Math.pow(k / 10, 0.65); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }   // rings on the floor
  for (let k = 0; k < 36; k++) { const x = (k / 36) * W; g.beginPath(); g.moveTo(x, H / 2 + 8); g.lineTo(x, H); g.stroke(); }                // spokes
  g.fillStyle = 'rgba(242,107,29,0.55)'; g.fillRect(0, H / 2 - 1, W, 2);   // the DUET-orange horizon line
  studioTex = new THREE.CanvasTexture(cv); studioTex.mapping = THREE.EquirectangularReflectionMapping; studioTex.colorSpace = THREE.SRGBColorSpace;
  return studioTex;
}

/** fades every material of an object (keeps the originals to put back) */
function setOpacity(obj, a) {
  obj.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      if (!m.userData.duetOp) m.userData.duetOp = { o: m.opacity, t: m.transparent, d: m.depthWrite };
      const k = m.userData.duetOp, want = a < 0.999 || k.t;
      if (m.transparent !== want) { m.transparent = want; m.needsUpdate = true; }
      m.opacity = k.o * a;
    }
  });
}

// ---------------------------------------------------------------------------------------------------- controller
const _v = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const CARD_FIT = { foot: 0.095, height: 0.12 };   // metres: a model on a card fills about the card's width
const PAD_FIT = { foot: 0.125, height: 0.15 };

class ModeController {
  constructor(mode, ctx) {
    this.mode = mode; this.ctx = ctx; this.info = MODE_INFO[mode];
    this.anchor = new THREE.Group(); this.anchor.name = 'duet-anchor';
    this.rig = new THREE.Group(); this.fit = new THREE.Group(); this.anchor.add(this.rig); this.rig.add(this.fit);
    this.zoom = 1; this.spin = false; this.alpha = 1; this.trackState = 'searching'; this.cleanups = [];
    this.item = ctx.item || {}; this.cardId = null; this.exploded = 0; this.explodeTo = 0;
  }
  get stereo() { return this.mode === 'vrbox'; }
  get onCards() { return this.mode === 'scan'; }
  async start() {
    const { scene, camera, renderer } = this.ctx;
    // remember everything we change, to put it back in stop()
    this.saved = { bg: scene.background, fov: camera.fov, near: camera.near, far: camera.far, cpos: camera.position.clone(), cquat: camera.quaternion.clone(), focus: camera.focus, clearAlpha: renderer.getClearAlpha() };
    scene.add(this.anchor);
    this.setModel(this.ctx.root || new THREE.Group(), this.item);
    const m = this.mode;
    if (m === 'screen' || m === 'anaglyph') this.setupScreen();
    if (this.info.camera) await this.setupCamera();
    if (m === 'anaglyph' || m === 'anaglyph-pad') this.setupAnaglyph();
    if (m === 'gyro360' || m === 'vrbox') await this.setupGyro();
    this.setupGestures();
    this.resize();
  }
  /** puts a (new) model in: measures it and sizes it for this mode. The old one is handed back where it came from. */
  setModel(root, item = {}) {
    this.releaseModel();
    this.item = item; this.ctx.root = root;
    this.savedRoot = { parent: root.parent, pos: root.position.clone(), quat: root.quaternion.clone(), scl: root.scale.clone() };
    this.dim = measure(root);
    this.fit.add(root); root.position.set(0, 0, 0); root.quaternion.identity(); root.scale.set(1, 1, 1);
    const m = this.mode, it = item, d = this.dim.size, maxDim = Math.max(d.x, d.y, d.z) || 1, foot = Math.hypot(d.x, d.z) || 1;
    // the size of the model in each mode (metres in AR and 360; screen units otherwise)
    let s;
    if (m === 'scan') s = Math.min(CARD_FIT.foot / foot, CARD_FIT.height / (d.y || 1));
    else if (m === 'pad' || m === 'anaglyph-pad') s = Math.min(PAD_FIT.foot / foot, PAD_FIT.height / (d.y || 1));
    else if (m === 'cube') s = 0.056 * 1.35 / maxDim;
    else if (m === 'gyro360' || m === 'vrbox') s = 0.85 / maxDim;
    else s = 1.1 / maxDim;
    s *= it.scale || 1; this.size = s;
    const cn = this.dim.center;
    this.fit.scale.setScalar(s); this.fit.position.set(-cn.x * s, -cn.y * s, -cn.z * s);
    const H = d.y * s, lift = (it.float || 0) * H;
    const grounded = m === 'pad' || m === 'anaglyph-pad' || m === 'screen' || m === 'anaglyph' || m === 'scan';
    this.pivotY = grounded ? H / 2 + lift : 0;
    this.rig.position.y = this.pivotY; this.rig.rotation.set(0, it.yaw ? THREE.MathUtils.degToRad(it.yaw) : 0, 0); this.baseYaw = this.rig.rotation.y; this.zoom = 1;
    if (this.shadow) { this.anchor.remove(this.shadow); this.shadow.geometry.dispose(); this.shadow.material.dispose(); this.shadow = null; }
    if (grounded && root.children.length) {
      this.shadow = shadowBlob(); this.shadowBase = Math.max(d.x, d.z) * s * 1.25;
      this.shadow.scale.set(this.shadowBase, this.shadowBase, 1); this.shadow.position.y = (m === 'screen' || m === 'anaglyph') ? 0.001 : 0.0006;
      this.shadow.material.opacity = lift ? 0.55 : 0.9; this.shadowOp = this.shadow.material.opacity; this.anchor.add(this.shadow);
    }
    this.prepareExplode(root);
    if (this.alpha < 1) setOpacity(this.rig, this.alpha);
    if (this.controls) this.setupScreenTarget();
  }
  releaseModel() {
    const root = this.ctx.root, sv = this.savedRoot; if (!root || !sv) return;
    this.setExplode(0, true); setOpacity(root, 1);
    this.fit.remove(root);
    if (sv.parent) sv.parent.add(root);
    root.position.copy(sv.pos); root.quaternion.copy(sv.quat); root.scale.copy(sv.scl);
    this.savedRoot = null;
  }

  // ------------------------------------------------------------------ screen and anaglyph: orbit the model
  setupScreen() {
    const { camera, canvas, scene, renderer } = this.ctx;
    camera.near = 0.02; camera.far = 100; camera.fov = 40;
    const oc = this.controls = new OrbitControls(camera, canvas);
    oc.enableDamping = true; oc.dampingFactor = 0.08; oc.minDistance = 0.6; oc.maxDistance = 6; oc.enablePan = false;
    oc.maxPolarAngle = Math.PI * 0.62;
    this.setupScreenTarget();
    if (this.mode === 'anaglyph') scene.background = studioBackdrop();
    else { scene.background = null; renderer.setClearAlpha(0); }
    this.cleanups.push(() => oc.dispose());
  }
  setupScreenTarget() {
    const { camera } = this.ctx, oc = this.controls;
    const H = this.dim.size.y * this.size, tgt = new THREE.Vector3(0, H / 2 + (this.item.float || 0) * H, 0);
    this.home = { pos: new THREE.Vector3(0, H * 0.5 + 0.55, 2.35), tgt };
    camera.position.copy(this.home.pos); camera.lookAt(tgt); oc.target.copy(tgt); oc.update();
  }

  // ------------------------------------------------------------------ pad / cube / cards: the camera picture and the tracker
  async setupCamera() {
    const { camera, renderer, scene, canvas } = this.ctx;
    const host = this.ctx.overlay || canvas.parentElement || document.body;
    const v = this.video = document.createElement('video');
    v.className = 'duet-ar-video';
    Object.assign(v.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', zIndex: '0', background: '#000' });
    host.insertBefore(v, host.firstChild);
    this.cleanups.push(() => { v.srcObject = null; v.remove(); });
    try { this.stream = await openCamera(v); }
    catch (e) { const err = new Error(e.name === 'NotAllowedError' ? 'camera permission denied' : 'camera not available: ' + (e.message || e.name)); err.code = 'camera'; err.cause = e; throw err; }
    this.cleanups.push(() => closeCamera(this.stream));
    this.tracker = new Tracker({ video: v, boards: this.info.boards, procWidth: this.ctx.procWidth, hfov: this.ctx.hfov, test: this.ctx.test, onResult: this.ctx.onResult, roi: this.ctx.roi });
    this.tracker.start();
    this.cleanups.push(() => this.tracker.stop());
    camera.position.set(0, 0, 0); camera.quaternion.identity(); camera.near = 0.01; camera.far = 20;
    this.anchor.matrixAutoUpdate = false; this.anchor.visible = false;
    if (this.mode === 'anaglyph-pad') {
      const tex = this.videoTex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex; this.cleanups.push(() => tex.dispose());
    } else { scene.background = null; renderer.setClearAlpha(0); }
  }

  setupAnaglyph() {
    this.ana = new Anaglyph(this.ctx.renderer);
    this.cleanups.push(() => this.ana.dispose());
  }

  // ------------------------------------------------------------------ gyro 360 and VR box
  async setupGyro() {
    const { camera, canvas, scene } = this.ctx;
    camera.position.set(0, 0, 0); camera.quaternion.identity(); camera.near = 0.05; camera.far = 200; camera.fov = this.stereo ? 80 : 70;
    this.anchor.position.set(0, -0.12, -1.45);
    scene.background = studioBackdrop();
    if (this.ctx.pano) {
      new THREE.TextureLoader().load(this.ctx.pano, (t) => {
        if (this.stopped) { t.dispose(); return; }
        t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; scene.background = t; this.panoTex = t;
      });
      this.cleanups.push(() => { if (this.panoTex) this.panoTex.dispose(); });
    }
    this.look = new GyroLook(camera, canvas, { allowDrag: () => !this.pinching });
    this.needsTap = needsPermission();
    if (!this.needsTap) await this.look.permit();
    this.look.start(); this.cleanups.push(() => this.look.stop());
    if (this.stereo) {
      this.stereoCam = new THREE.StereoCamera(); this.stereoCam.eyeSep = 0.064;
      // a small ring in the middle of each eye's view: shows where "straight ahead" is
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.008, 0.011, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthTest: false }));
      ring.position.z = -0.8; ring.renderOrder = 99; camera.add(ring); if (!camera.parent) scene.add(camera);
      this.reticle = ring; this.cleanups.push(() => { camera.remove(ring); ring.geometry.dispose(); ring.material.dispose(); });
      if (this.ctx.distortion) this.setupDistortion();
    }
  }
  /** iPhone/iPad: call from a tap to switch on the motion sensor (no-op elsewhere) */
  async permitMotion() { if (this.look) { const ok = await this.look.permit(); this.needsTap = false; return ok; } return true; }

  setupDistortion() {
    // optional barrel distortion for VR boxes whose lenses bend the picture (k1, k2 like Cardboard viewers)
    const opt = { type: THREE.UnsignedByteType, colorSpace: THREE.SRGBColorSpace };
    this.rtEye = new THREE.WebGLRenderTarget(2, 2, opt);
    this.distMat = new THREE.ShaderMaterial({
      uniforms: { map: { value: this.rtEye.texture }, k: { value: new THREE.Vector2(0.22, 0.24) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform vec2 k; varying vec2 vUv;
        void main(){ vec2 p = vUv * 2.0 - 1.0; float r2 = dot(p, p); vec2 q = p * (1.0 + k.x * r2 + k.y * r2 * r2) / (1.0 + k.x + k.y);
          q = q * 0.5 + 0.5; if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
          gl_FragColor = texture2D(map, q); }`,
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    this.distQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.distMat); this.distQuad.frustumCulled = false;
    this.distScene = new THREE.Scene(); this.distScene.add(this.distQuad); this.distCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.cleanups.push(() => { this.rtEye.dispose(); this.distMat.dispose(); this.distQuad.geometry.dispose(); });
  }

  // ------------------------------------------------------------------ touch: drag turns, pinch zooms, two fingers twist, a tap picks
  setupGestures() {
    const cv = this.ctx.canvas, pts = new Map(); let last = null, dist0 = 0, zoom0 = 1, ang0 = 0, down0 = null, moved = 0;
    const two = () => { const [a, b] = [...pts.values()]; return { d: Math.hypot(a[0] - b[0], a[1] - b[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]) }; };
    const down = (e) => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) { down0 = [e.clientX, e.clientY, performance.now()]; moved = 0; }
      if (pts.size === 2) { const t = two(); dist0 = t.d; ang0 = t.a; zoom0 = this.zoom; this.pinching = true; down0 = null; }
      last = [e.clientX, e.clientY];
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (down0) moved = Math.max(moved, Math.hypot(e.clientX - down0[0], e.clientY - down0[1]));
      if (pts.size >= 2) {
        const t = two(); if (dist0 > 10) this.setZoom(zoom0 * t.d / dist0);
        let da = t.a - ang0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
        if (!this.controls && Math.abs(da) > 0.002) { this.action('turn', -da); ang0 = t.a; }
        return;
      }
      if (this.controls) return;                    // screen modes: OrbitControls turns the view
      if (this.look && !this.look.sensor) return;   // 360 without a sensor: one finger looks around
      if (last && moved > 6) { this.action('turn', (e.clientX - last[0]) * 0.012); if (this.mode === 'cube' || this.look) this.action('tilt', (e.clientY - last[1]) * 0.008); }
      last = [e.clientX, e.clientY];
    };
    const up = (e) => {
      if (pts.has(e.pointerId) && pts.size === 1 && down0 && moved < 8 && performance.now() - down0[2] < 450 && this.ctx.onTap) this.ctx.onTap(e.clientX, e.clientY, this);
      pts.delete(e.pointerId); if (pts.size < 2) this.pinching = false; last = null; if (!pts.size) down0 = null;
    };
    cv.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    cv.style.touchAction = 'none';
    this.cleanups.push(() => { cv.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); });
  }
  /** the model's mesh under a screen point (CSS px), or null: {mesh, point (world)} */
  pick(x, y) {
    if (!this.ctx.root || (this.tracker && !this.anchor.visible)) return null;
    const r = this.ctx.canvas.getBoundingClientRect(), cam = this.ctx.camera;
    let nx = ((x - r.left) / r.width) * 2 - 1, ny = -((y - r.top) / r.height) * 2 + 1, c = cam;
    if (this.stereo) { this.stereoCam.update(cam); const left = nx < 0; c = left ? this.stereoCam.cameraL : this.stereoCam.cameraR; nx = left ? nx * 2 + 1 : nx * 2 - 1; }
    const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(nx, ny), c);
    this.ctx.scene.updateMatrixWorld();
    const hits = rc.intersectObject(this.ctx.root, true).filter((h) => h.object.visible && !(h.object.material && h.object.material.opacity < 0.15));
    return hits.length ? { mesh: hits[0].object, point: hits[0].point } : null;
  }

  // ------------------------------------------------------------------ take apart: every part moves out from the middle
  prepareExplode(root) {
    this.parts = [];
    if (!root.userData.explode && !(root.children[0] && root.children[0].userData.explode)) return;
    root.updateMatrixWorld(true); this.fit.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.fit.matrixWorld).invert(), mid = this.dim.center, size = this.dim.size.length() || 1;
    const list = []; root.traverse((o) => { if (o.isMesh && !(o.material && o.material.opacity < 0.15)) list.push(o); });
    if (list.length < 3) return;
    for (const o of list) {
      const b = new THREE.Box3().setFromObject(o, true); if (b.isEmpty()) continue;
      const c = b.getCenter(new THREE.Vector3()).applyMatrix4(inv), dir = c.clone().sub(mid);
      const far = dir.length() / size; if (dir.lengthSq() < 1e-12) dir.set(0, 1, 0); dir.normalize();
      // the direction in the part's parent's own axes
      const pm = new THREE.Matrix4().multiplyMatrices(inv, o.parent.matrixWorld), lin = new THREE.Matrix3().setFromMatrix4(pm).invert();
      const d = dir.clone().applyMatrix3(lin), k = (0.18 + 0.55 * far) * size / new THREE.Vector3().setFromMatrixScale(pm).x;
      this.parts.push({ o, base: o.position.clone(), d: d.normalize().multiplyScalar(k) });
    }
  }
  get canExplode() { return this.parts && this.parts.length >= 3; }
  setExplode(v, now) { this.explodeTo = v ? 1 : 0; if (now) { this.exploded = this.explodeTo; this.applyExplode(); } }
  applyExplode() {
    if (!this.parts) return;
    const e = this.exploded * this.exploded * (3 - 2 * this.exploded);
    for (const p of this.parts) p.o.position.copy(p.base).addScaledVector(p.d, e);
  }

  // ------------------------------------------------------------------ actions (touch, Bluetooth remote, hub buttons)
  setZoom(z) { this.zoom = THREE.MathUtils.clamp(z, 0.3, 4); }
  action(name, value) {
    if (name === 'turn') this.rig.rotation.y += value;
    else if (name === 'tilt') this.rig.rotation.x = THREE.MathUtils.clamp(this.rig.rotation.x + value, -1.3, 1.3);
    else if (name === 'zoom') this.setZoom(this.zoom * value);
    else if (name === 'recenter') this.recenter();
    else if (name === 'spin') this.spin = value == null ? !this.spin : !!value;
    else if (name === 'explode') this.setExplode(value == null ? !this.explodeTo : value);
    else return false;
    return true;
  }
  recenter() {
    this.rig.rotation.set(0, this.baseYaw, 0); this.zoom = 1;
    if (this.controls) { this.ctx.camera.position.copy(this.home.pos); this.controls.target.copy(this.home.tgt); this.controls.update(); }
    if (this.look) this.look.recenter();
    if (this.tracker) this.tracker.reset();
  }

  // ------------------------------------------------------------------ every frame
  resize(w, h) {
    const { canvas, camera } = this.ctx;
    w = w || canvas.clientWidth || innerWidth; h = h || canvas.clientHeight || innerHeight; this.w = w; this.h = h;
    if (this.tracker) Object.assign(camera, this.tracker.projection(w, h));
    else camera.aspect = this.stereo ? (w / 2) / h : w / h;
    camera.updateProjectionMatrix();
    if (this.ana) this.ana.setSize(w, h);
    if (this.rtEye) { const pr = this.ctx.renderer.getPixelRatio(); this.rtEye.setSize(Math.round(w / 2 * pr), Math.round(h * pr)); }
    if (this.videoTex && this.video.videoWidth) {
      const t = this.videoTex, av = this.video.videoWidth / this.video.videoHeight, ac = w / h;
      if (av > ac) { t.repeat.set(ac / av, 1); t.offset.set((1 - ac / av) / 2, 0); } else { t.repeat.set(1, av / ac); t.offset.set(0, (1 - av / ac) / 2); }
    }
  }
  /** which tracked thing the model stands on now: {pose, card} (pose: tracker pose with matrix and alpha) */
  target() {
    const tr = this.tracker;
    if (this.mode === 'cube') return { pose: tr.pose('cube') };
    const cards = tr.cards();
    // the card in charge: keep the current one while it is seen (or held a moment); else the newest, biggest one
    let cur = this.cardId != null && cards.find((c) => c.id === this.cardId);
    if (!cur || cur.pose.state === 'fading') { const fresh = cards.find((c) => c.pose.state === 'tracking'); if (fresh) cur = fresh; }
    if (cur && cur.id !== this.cardId) { this.cardId = cur.id; if (this.ctx.onCard) this.ctx.onCard(cur.id, this); }
    const pad = this.info.boards.includes('pad') ? tr.pose('pad') : null;
    if (this.mode !== 'scan') return { pose: pad, card: cur };   // the pad modes: the model stays on the pad's stage
    const padSeen = pad && pad.matrix && (pad.state === 'tracking' || pad.state === 'holding');
    // the card lay on the pad and a hand now covers it: the model stays on the pad where the card was
    if (this._onPad && padSeen && (!cur || cur.pose.state === 'fading' || cur.pose.state === 'lost')) {
      const o = this._onPad, off = new THREE.Matrix4().makeRotationY(o.yaw).setPosition(o.x, 0, o.z);
      return { pose: { ...pad, matrix: _m.fromArray(pad.matrix).clone().multiply(off).toArray() }, card: cur, onPad: true };
    }
    if (!cur) return { pose: { alpha: 0, state: 'lost', matrix: null } };
    // a card lying on the pad: stand on the pad (six big markers: much steadier), where the card is
    if (padSeen && (cur.pose.state === 'tracking' || cur.pose.state === 'holding') && cur.pose.matrix) {
      const P = _m.fromArray(pad.matrix), C = new THREE.Matrix4().fromArray(cur.pose.matrix), rel = P.clone().invert().multiply(C);
      rel.decompose(_v, _q, _s);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(_q);
      if (Math.abs(_v.y) < 0.02 && up.y > 0.94 && Math.abs(_v.x) < 0.16 && Math.abs(_v.z) < 0.12) {
        const zc = new THREE.Vector3(0, 0, 1).applyQuaternion(_q), yaw = Math.atan2(zc.x, zc.z);   // the card's turn on the pad
        const k = this._onPad ? 0.15 : 1; this._onPad = this._onPad || { x: _v.x, z: _v.z, yaw };
        const o = this._onPad; let dy = yaw - o.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); o.x += (_v.x - o.x) * k; o.z += (_v.z - o.z) * k; o.yaw += dy * k;
        const off = new THREE.Matrix4().makeRotationY(o.yaw).setPosition(o.x, 0, o.z);
        return { pose: { ...pad, matrix: P.clone().multiply(off).toArray(), alpha: Math.min(pad.alpha, cur.pose.alpha) }, card: cur, onPad: true };
      }
    }
    this._onPad = null;
    return { pose: cur.pose, card: cur };
  }
  update(dt = 1 / 60) {
    const { camera } = this.ctx;
    if (this.spin) this.rig.rotation.y += dt * 0.6;
    // zoom about the base on a table (the model stays standing on the pad), about the middle elsewhere
    this.rig.scale.setScalar(this.zoom);
    if (this.pivotY) this.rig.position.y = this.pivotY * this.zoom;
    if (this.shadow) this.shadow.scale.set(this.shadowBase * this.zoom, this.shadowBase * this.zoom, 1);
    if (this.exploded !== this.explodeTo) { this.exploded = THREE.MathUtils.clamp(this.exploded + Math.sign(this.explodeTo - this.exploded) * dt * 1.8, 0, 1); this.applyExplode(); }
    if (this.controls) { this.controls.update(); camera.focus = camera.position.distanceTo(this.controls.target); }
    if (this.tracker) {
      if (this.video.videoWidth && this._vw !== this.video.videoWidth) { this._vw = this.video.videoWidth; this.resize(); }
      const tg = this.target(), p = tg.pose || { alpha: 0, state: 'lost' };
      this.onPad = !!tg.onPad;
      const hasModel = this.ctx.root && this.ctx.root.children.length > 0;
      if (p.matrix) { this.anchor.matrix.fromArray(p.matrix); this.anchor.matrixWorldNeedsUpdate = true; if (p.t) camera.focus = Math.hypot(p.t[0], p.t[1], p.t[2]); }
      this.anchor.visible = p.alpha > 0.01 && hasModel;
      if (Math.abs(p.alpha - this.alpha) > 0.01 || (p.alpha === 1 && this.alpha !== 1)) { setOpacity(this.rig, p.alpha); if (this.shadow) this.shadow.material.opacity = this.shadowOp * p.alpha; this.alpha = p.alpha; }
      const st = this.tracker.stats.results ? (p.state === 'lost' && this.mode === 'scan' && this.cardId == null ? 'searching' : p.state) : 'searching';
      if (st !== this.trackState) { this.trackState = st; if (this.ctx.onState) this.ctx.onState(st, this); }
    }
    if (this.look) this.look.update();
  }
  render() {
    const { renderer, scene, camera } = this.ctx;
    if (this.ana) { this.ana.render(scene, camera); return; }
    if (!this.stereo) { renderer.render(scene, camera); return; }
    // VR box: left eye on the left half, right eye on the right half
    scene.updateMatrixWorld(); if (!camera.parent) camera.updateMatrixWorld();
    this.stereoCam.update(camera);
    const w = this.w, h = this.h, eyes = [[this.stereoCam.cameraL, 0], [this.stereoCam.cameraR, w / 2]];
    renderer.setScissorTest(true);
    for (const [cam, x] of eyes) {
      if (this.rtEye) {
        renderer.setRenderTarget(this.rtEye); renderer.setScissorTest(false); renderer.clear(); renderer.render(scene, cam);
        renderer.setRenderTarget(null); renderer.setScissorTest(true); renderer.setViewport(x, 0, w / 2, h); renderer.setScissor(x, 0, w / 2, h); renderer.render(this.distScene, this.distCam);
      } else { renderer.setViewport(x, 0, w / 2, h); renderer.setScissor(x, 0, w / 2, h); renderer.render(scene, cam); }
    }
    renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h);
  }
  /** tracking state and speed for the UI and the tests */
  state() {
    const s = { mode: this.mode, zoom: this.zoom, yaw: this.rig.rotation.y, tilt: this.rig.rotation.x, spin: this.spin, alpha: this.alpha, card: this.cardId, onPad: this.onPad, explode: this.explodeTo, canExplode: this.canExplode };
    if (this.tracker) Object.assign(s, { track: this.trackState, fps: this.tracker.stats.fps, ms: this.tracker.stats.detectMs, frames: this.tracker.stats.frames, found: this.tracker.stats.found, worker: this.tracker.stats.worker, roi: this.tracker.stats.roi, px: this.tracker.stats.px });
    if (this.look) Object.assign(s, { sensor: this.look.sensor, needsTap: this.needsTap });
    return s;
  }
  stop() {
    if (this.stopped) return; this.stopped = true;
    const { scene, camera, renderer } = this.ctx, sv = this.saved;
    for (const f of this.cleanups.reverse()) { try { f(); } catch (e) { console.warn(e); } }
    this.releaseModel();
    if (this.shadow) { this.shadow.geometry.dispose(); this.shadow.material.dispose(); }
    if (sv) {
      scene.background = sv.bg; camera.fov = sv.fov; camera.near = sv.near; camera.far = sv.far; camera.position.copy(sv.cpos); camera.quaternion.copy(sv.cquat);
      if (sv.focus != null) camera.focus = sv.focus; camera.updateProjectionMatrix(); renderer.setClearAlpha(sv.clearAlpha);
    }
    scene.remove(this.anchor); renderer.setScissorTest(false);
  }
}
