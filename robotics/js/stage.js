// DUET Robotics Lab 360: the 3D stage. Renderer, camera, orbit controls, the workshop's light (a real 360° HDR photo,
// Poly Haven, CC0) with soft shadows, and a bloom pass for glowing LEDs. It draws only when something changed (phones keep
// cool). Units are mm: the bench is in a group that becomes metres in a headset.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// what each view looks at (centre, radius in mm) and from which direction; the distance is worked out so it fits the
// part of the screen the panels leave free
export const VIEWS = {
  home: { tgt: [-16, 0, 4], hw: 128, hd: 44, dir: [0, 0.72, 0.7] },
  wide: { tgt: [-8, 0, 54], hw: 148, hd: 88, dir: [0, 0.82, 0.57] },
  top: { tgt: [-16, 0, 40], hw: 150, hd: 112, dir: [0, 1, 0.06] },
  bb: { tgt: [40, 2, 2], hw: 86, hd: 30, dir: [0, 0.74, 0.67] },
  board: { tgt: [-92, 6, -2], hw: 44, hd: 34, dir: [0.1, 0.74, 0.66] },
};

export class Stage {
  constructor(el, { lite, headset } = {}) {
    this.lite = !!lite; this.el = el;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: !this.lite || !!headset, powerPreference: 'high-performance', preserveDrawingBuffer: /[?&](test|shot)\b/.test(location.search) });
    if (window.DuetPerf) DuetPerf.watch(r, this.lite ? 1.5 : 2); else r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(el.clientWidth || innerWidth, el.clientHeight || innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = this.lite ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor');
    el.appendChild(r.domElement);
    const sc = this.scene = new THREE.Scene(); sc.background = new THREE.Color(0x2a2620);
    this.camera = new THREE.PerspectiveCamera(36, 1, 3, 30000);
    this.root = new THREE.Group(); this.root.name = 'root'; sc.add(this.root); // everything on the bench, in mm
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.09, minDistance: 40, maxDistance: 2200, maxPolarAngle: Math.PI * 0.47, rotateSpeed: 0.65, zoomSpeed: 0.9, panSpeed: 0.8, screenSpacePanning: true });
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener('change', () => this.kick());
    // light: the workshop photo lights the bench; a window light casts the shadows
    const key = this.key = new THREE.DirectionalLight(0xfff1e0, 2.1);
    key.position.set(-240, 560, 260); key.target.position.set(-10, 0, 10); key.castShadow = true;
    const S = key.shadow; S.mapSize.set(this.lite ? 1024 : 2048, this.lite ? 1024 : 2048); S.bias = -0.0004; S.normalBias = 0.35; S.radius = 4; S.blurSamples = 12;
    Object.assign(S.camera, { left: -260, right: 260, top: 200, bottom: -200, near: 200, far: 1300 }); S.camera.updateProjectionMatrix();
    sc.add(key, key.target);
    this.hemi = new THREE.HemisphereLight(0xfff6ea, 0x3a3226, 0.15); sc.add(this.hemi);
    this.envI = 1.0; this.light = 1;
    this.camera.aspect = (el.clientWidth || innerWidth) / (el.clientHeight || innerHeight); this.setView('home', true);
    if (!this.lite) {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
      const C = this.composer = new EffectComposer(r, rt);
      C.addPass(new RenderPass(sc, this.camera));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.42, 1.45); C.addPass(this.bloom); // only what is brighter than any lit surface glows: the LEDs
      C.addPass(new OutputPass());
    }
    this.resize(); addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(el);
    this.dirty = 2; this.anim = 0; this.onFrame = null;
    r.setAnimationLoop((t, frame) => this.frame(t, frame));
  }
  async loadEnv(url) {
    const tex = await new RGBELoader().loadAsync(url);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(this.renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose();
    this.scene.environment = env; this.scene.environmentIntensity = this.envI;
    this.scene.background = tex; this.scene.backgroundBlurriness = 0.32; this.scene.backgroundIntensity = 0.62;
    this.scene.environmentRotation = new THREE.Euler(0, 1.9, 0); this.scene.backgroundRotation = new THREE.Euler(0, 1.9, 0);
    this.kick();
  }
  // the room light (0..1): darker room for the night lamp lesson
  setLight(v) {
    this.light = v; const k = 0.12 + 0.88 * v;
    this.scene.environmentIntensity = this.envI * k; this.scene.backgroundIntensity = 0.62 * k; this.key.intensity = 2.1 * k * k; this.hemi.intensity = 0.15 * k;
    this.kick();
  }
  setView(name, now) {
    const v = VIEWS[name] || VIEWS.home; this.viewName = name;
    const c = this.camera, f = this.free || { fw: 1, fh: 1 };
    const half = Math.tan(c.fov * Math.PI / 360);
    const dir = new THREE.Vector3(...v.dir).normalize();
    // a flat bench: its width must fit across, its depth (seen at this angle) up and down
    const dh = v.hw / (half * c.aspect * f.fw), dv = (v.hd * dir.y + 14 * Math.sqrt(1 - dir.y * dir.y)) / (half * f.fh);
    const d = Math.max(dh, dv) * 1.06 + 20;
    this.goal = { pos: new THREE.Vector3(...v.tgt).addScaledVector(dir, d), tgt: new THREE.Vector3(...v.tgt), t: 0 };
    if (now) { this.camera.position.copy(this.goal.pos); this.controls.target.copy(this.goal.tgt); this.goal = null; this.controls.update(); }
    this.kick();
  }
  flyTo(pos, tgt) { this.goal = { pos: new THREE.Vector3(...pos), tgt: new THREE.Vector3(...tgt), t: 0 }; this.kick(); }
  resize() {
    const w = this.el.clientWidth || innerWidth, h = this.el.clientHeight || innerHeight;
    if (this.renderer.xr.isPresenting) return;
    this.renderer.setSize(w, h); this.camera.aspect = w / h;
    // a narrow screen sees the bench from a little further back, so the board and breadboard both fit
    this.camera.fov = w / h < 1.2 ? 52 : w / h < 1.6 ? 42 : 36;
    this.camera.updateProjectionMatrix();
    if (this.composer) { const pr = this.renderer.getPixelRatio(); this.composer.setPixelRatio(pr); this.composer.setSize(w, h); this.bloom.resolution.set(w * pr / 2, h * pr / 2); }
    this.kick();
  }
  kick(n = 2) { this.dirty = Math.max(this.dirty, n); }
  frame(t, xrFrame) {
    const dt = Math.min(0.1, (t - (this.lastT || t)) / 1000); this.lastT = t;
    if (this.goal) {
      const g = this.goal; g.t = Math.min(1, g.t + dt * 2.2); const k = 1 - Math.pow(1 - g.t, 3);
      this.camera.position.lerp(g.pos, k * 0.35 + 0.05); this.controls.target.lerp(g.tgt, k * 0.35 + 0.05);
      if (g.t >= 1) { this.camera.position.copy(g.pos); this.controls.target.copy(g.tgt); this.goal = null; } this.dirty = 2;
    }
    const moved = this.controls.update();
    if (this.onFrame) this.onFrame(dt, t);
    if (moved) this.dirty = 2;
    const xr = this.renderer.xr.isPresenting;
    // the canvas was resized (DuetPerf changes the pixel ratio with the frame rate): its picture is gone, draw again
    const cv = this.renderer.domElement;
    if (cv.width !== this._cw || cv.height !== this._ch) {
      this._cw = cv.width; this._ch = cv.height; this.dirty = Math.max(this.dirty, 2);
      if (this.composer) { const pr = this.renderer.getPixelRatio(), w = this.el.clientWidth || innerWidth, h = this.el.clientHeight || innerHeight; this.composer.setPixelRatio(pr); this.composer.setSize(w, h); this.bloom.resolution.set(w * pr / 2, h * pr / 2); }
    }
    if (!xr && this.dirty <= 0 && !this.anim) return;
    this.dirty = Math.max(0, this.dirty - 1);
    if (xr || !this.composer || this.noBloom) this.renderer.render(this.scene, this.camera);
    else this.composer.render();
    this.frames = (this.frames || 0) + 1;
  }
  // screen position (px) of a bench point (mm)
  toScreen(p) {
    const v = new THREE.Vector3(...p).applyMatrix4(this.root.matrixWorld).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, z: v.z };
  }
}
