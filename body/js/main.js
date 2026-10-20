import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Body, LAYERS, asset } from './body.js';
import { FlowSystem, PathCurve, Tracer } from './flows.js';
import { OrganAnimator } from './anim.js';
import { Magnifier } from './micro.js';
import { Label } from './labels.js';
import { Audio } from './audio.js';
import { VRUI } from './vrui.js';
import { JOURNEYS, PARTS, SYSTEMS, T } from './data.js';

const Q = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);
const clock = new THREE.Clock();

PARTS.rectum = ['Rectum & anus', 'मलाशय और गुदा', 'Stores solid waste until we go to the toilet, then it leaves through the anus.', 'शौच जाने तक ठोस अपशिष्ट को रोककर रखता है, फिर यह गुदा से बाहर निकलता है।'];
LAYERS.digestive.push('rectum');
LAYERS.circulatory.push('arteries_minor', 'veins_minor');
LAYERS.nervous.push('nerves_minor');
const FINE = ['arteries_minor', 'veins_minor', 'nerves_minor'];
const SV = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const VOICE_ON = SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
const VOICE_OFF = SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>');
export const store = { get(k) { try { return store.get(k); } catch (e) { return null; } }, set(k, v) { try { store.set(k, v); } catch (e) {} } };

class App {
  constructor() {
    this.lang = store.get('hb_lang') || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en');
    if (Q.get('lang')) this.lang = Q.get('lang');
    this.journey = null; this.stepIdx = 0; this.playing = false; this.fine = false;
    this.picked = null; this.vrScale = 1; this.mode = 'desktop';
    this.audio = new Audio();
    this.audio.voice = store.get('hb_voice') !== '0';
  }

  async init() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: Q.has('shot') });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.localClippingEnabled = true;
    r.xr.enabled = true;
    r.xr.setReferenceSpaceType('local-floor');
    r.xr.setFoveation(0.6);
    $('#stage').appendChild(r.domElement);

    const scene = this.scene = new THREE.Scene();
    this.bg = new THREE.Color('#0a0d13');
    scene.background = this.bg;
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight('#e4ecff', '#2a1d16', 0.55));
    const key = new THREE.DirectionalLight('#ffffff', 1.35); key.position.set(1.2, 2.4, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#9fc4ff', 0.55); rim.position.set(-2, 1.5, -2.5); scene.add(rim);
    this.buildRoom();

    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 60);
    this.camera.position.set(0, 1.0, 3.2);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.target.set(0, 0.9, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.08; this.controls.maxDistance = 6;
    this.controls.addEventListener('start', () => { this.camTween = null; });

    // world -> bodyRoot holds everything anatomical (so VR can move/scale it as one)
    this.world = new THREE.Group(); scene.add(this.world);
    this.bodyRoot = new THREE.Group(); this.world.add(this.bodyRoot);
    this.body = new Body();
    this.bodyRoot.add(this.body.root);
    this.flows = new FlowSystem(9000); this.bodyRoot.add(this.flows.points);
    this.tracer = new Tracer(); this.bodyRoot.add(this.tracer.group);
    this.mag = new Magnifier(); this.bodyRoot.add(this.mag.group);
    this.labelGroup = new THREE.Group(); this.bodyRoot.add(this.labelGroup);
    this.pickLabel = null;

    this.setLoading(0.02);
    const [_, paths, meta] = await Promise.all([
      this.body.load(asset('./models/body.glb'), (f) => this.setLoading(0.05 + 0.85 * f)),
      fetch('./models/paths.json').then((x) => x.json()),
      fetch('./models/meta.json').then((x) => x.json()),
    ]);
    this.meta = meta;
    this.setupPaths(paths);
    this.addRectum();
    this.anim = new OrganAnimator(this.body, this.audio);
    this.body.layerOn.muscles = false;
    this.applyLayers();
    this.vrui = new VRUI(this); scene.add(this.vrui.group);
    this.setupXR();
    this.buildHTML();
    this.bindInput();
    addEventListener('resize', () => this.onResize());
    this.onResize();
    this.setLoading(1);
    $('#loader').classList.add('done');
    r.setAnimationLoop(() => this.frame());
    const j = Q.get('j');
    if (j) this.startJourney(j, +(Q.get('s') || 0), false);
    else this.explore();
    // Quest app (immersive mode, start URL ?app=vr|ar): go straight into the headset view
    this.appMode = Q.get('app');
    if (this.appMode === 'vr' || this.appMode === 'ar') this.autoXR();
    // muscles load in the background
    this.body.loadMuscles(asset('./models/muscles.glb')).then(() => { this.musclesReady = true; this.applyLayers(); this.applyStepLook(); });
  }

  setLoading(f) { const b = $('#loadbar'); if (b) b.style.transform = `scaleX(${f})`; }

  buildRoom() {
    // soft floor disc + sky dome, hidden in AR
    const room = this.room = new THREE.Group();
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(120,150,190,0.35)'); g.addColorStop(0.6, 'rgba(70,90,120,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(180,205,240,0.18)'; x.lineWidth = 2;
    for (let r = 40; r < 256; r += 40) { x.beginPath(); x.arc(256, 256, r, 0, 7); x.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.001; floor.renderOrder = -1;
    room.add(floor);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 a = vec3(0.035,0.045,0.07); vec3 b = vec3(0.09,0.11,0.16); vec3 c = mix(b, a, smoothstep(-0.1, 0.6, h)); c = mix(vec3(0.05,0.045,0.05), c, smoothstep(-0.35, 0.0, h)); gl_FragColor = vec4(c,1.); }',
    }));
    sky.renderOrder = -2;
    room.add(sky);
    this.sky = sky; this.floor = floor;
    this.scene.add(room);
  }

  // ------------------------------------------------------------ paths & flows
  setupPaths(paths) {
    const R = this.routes = {};
    const RAD = { air_in: 0.006, food_mouth: 0.006, esophagus: 0.007, stomach: 0.02, duodenum: 0.009, small_intestine: 0.006, colon: 0.014, rectum: 0.011, ileocecal: 0.008, bile: 0.0025, pancreatic: 0.002, portal: 0.004, spinal_cord: 0.004, urethra: 0.0015 };
    for (const [k, v] of Object.entries(paths.routes)) R[k] = new PathCurve(v, RAD[k] ?? (k.startsWith('heart') ? 0.007 : k.startsWith('ureter') ? 0.0018 : 0.004));
    this.anchors = {};
    for (const [k, v] of Object.entries(paths.anchors)) this.anchors[k] = new THREE.Vector3(...v);
    for (const [k, m] of Object.entries(this.meta)) if (!this.anchors[k]) this.anchors[k] = new THREE.Vector3(...m.center);
    const V = this.vessels = {};
    for (const v of paths.vessels) (V[v.g] ||= []).push(Object.assign(new PathCurve(v.p, v.r), { major: !!v.m, name: v.n }));
    const F = this.flows; const app = this;
    const grp = (g, majorOnly = true) => (V[g] || []).filter((c) => !majorOnly || c.major || app.fine);
    const cr = (pts, r = 0.003) => PathCurve.smoothJoin([PathCurve.fromPoints(pts, r)], r);
    const join = (keys, r) => PathCurve.smoothJoin(keys.map((k) => (typeof k === 'string' ? R[k] : k)), r);
    const def = (id, fn) => F.define(id, fn);
    const AIR = '#bff4ff', CO2 = '#a9b0bd', RED = '#ff2b3b', BLUE = '#4d6dff', PURP = '#7f6cff', FOOD = '#e9c48c', YEL = '#ffd84d', SIG = '#fff3a0';
    def('air_in', () => ({ curves: [R.air_in], color: AIR, size: 0.0045, speed: 0.11, density: 260, spread: 0.7, drive: 'in' }));
    def('air_nose', () => ({ curves: [R.air_in.slice(0, 0.55)], color: AIR, size: 0.0045, speed: 0.07, density: 380, spread: 0.75, drive: 'in' }));
    def('air_bronchi', () => ({ curves: [R.bronchus_r, R.bronchus_l, R.bronchus_ru, R.bronchus_lu, ...grp('bronchi', false)], color: AIR, size: 0.004, speed: 0.06, density: 160, spread: 0.6, drive: 'in' }));
    def('air_out', () => [
      { curves: [...grp('bronchi', false).map((c) => c.reversed()), R.bronchus_r.reversed(), R.bronchus_l.reversed()], color: CO2, size: 0.004, speed: 0.06, density: 140, drive: 'out' },
      { curves: [R.air_in.reversed()], color: CO2, size: 0.0045, speed: 0.11, density: 240, spread: 0.7, drive: 'out' }]);
    def('blood_arteries', () => ({ curves: grp('arteries'), color: RED, size: 0.0034, speed: 0.10, density: 55, max: 2600, drive: 'beat', spread: 0.6 }));
    def('blood_veins', () => ({ curves: grp('veins'), color: BLUE, size: 0.0034, speed: 0.055, density: 50, max: 2000, spread: 0.6 }));
    def('blood_pulm', () => [{ curves: grp('pulm_arteries', false), color: PURP, size: 0.0034, speed: 0.06, density: 130, drive: 'beat' }, { curves: grp('pulm_veins', false), color: RED, size: 0.0034, speed: 0.05, density: 130 }]);
    def('heart_right', () => [{ curves: [R.heart_right, R.heart_right_ivc], color: BLUE, size: 0.0032, speed: 0.06, density: 500, spread: 0.8, drive: 'beat' }]);
    def('heart_left', () => [{ curves: [R.heart_left], color: RED, size: 0.0032, speed: 0.06, density: 500, spread: 0.8, drive: 'beat' }]);
    def('heart_flow', () => [{ curves: [R.heart_right, R.heart_right_ivc], color: BLUE, size: 0.0028, speed: 0.06, density: 350, spread: 0.8, drive: 'beat' }, { curves: [R.heart_left], color: RED, size: 0.0028, speed: 0.06, density: 350, spread: 0.8, drive: 'beat' }]);
    def('coronary_flow', () => [{ curves: grp('coronary', false), color: RED, size: 0.003, speed: 0.04, density: 420 }, { curves: grp('cardiac_veins', false), color: BLUE, size: 0.003, speed: 0.03, density: 380 }]);
    def('saliva', () => {
      const m = this.anchors.mouth;
      const glands = [[0.045, 1.55, 0.02], [-0.045, 1.55, 0.02], [0.03, 1.5, 0.05], [-0.03, 1.5, 0.05]].map((p) => new THREE.Vector3(...p));
      return { curves: [...grp('salivary', false), ...glands.map((g) => cr([g, g.clone().lerp(m, 0.5).add(new THREE.Vector3(0, 0.006, 0.01)), m], 0.002))], color: '#fff1b0', size: 0.0035, speed: 0.03, density: 500 };
    });
    def('chyme', () => [{ curves: [R.stomach, R.stomach.reversed()], color: FOOD, size: 0.0048, speed: 0.025, count: 200, spread: 0.95 }, { curves: [R.stomach.reversed()], color: '#c9f06a', size: 0.0035, speed: 0.04, count: 70, spread: 0.95 }]);
    def('chyme_duo', () => ({ curves: [R.duodenum], color: FOOD, size: 0.0045, speed: 0.03, density: 380, spread: 0.7 }));
    def('chyme_si', () => ({ curves: [R.small_intestine], color: FOOD, size: 0.004, speed: 0.07, density: 110, spread: 0.6 }));
    def('bile', () => ({ curves: [R.bile], color: '#7ad957', size: 0.0036, speed: 0.03, density: 300 }));
    def('pancreatic', () => ({ curves: [R.pancreatic], color: YEL, size: 0.0034, speed: 0.03, density: 280 }));
    def('nutrients', () => {
      const si = R.small_intestine, po = R.portal; const a = new THREE.Vector3(), b = new THREE.Vector3();
      const cs = [];
      for (let i = 0; i < 26; i++) { si.at(Math.random() * si.length, a); po.at(Math.random() * po.length * 0.3, b); cs.push(cr([a.clone(), a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.01, 0.01)), b.clone()], 0.002)); }
      return [{ curves: cs, color: YEL, size: 0.004, speed: 0.04, density: 70 }, { curves: [po], color: YEL, size: 0.004, speed: 0.06, density: 260 }];
    });
    def('portal', () => ({ curves: [R.portal], color: '#a8406e', size: 0.0038, speed: 0.05, density: 260 }));
    def('glucose_body', () => ({ curves: [R.aorta_leg_l, R.aorta_head, R.aorta_arm_r, R.aorta_kidney_l].filter(Boolean), color: YEL, size: 0.0042, speed: 0.12, density: 70 }));
    def('water_out', () => {
      const c = R.colon; const p = new THREE.Vector3(); const ctr = new THREE.Vector3(0, 0.98, 0.0); const cs = [];
      for (let i = 0; i < 40; i++) { c.at(Math.random() * c.length, p); const out = p.clone().sub(ctr).setY(0).normalize().multiplyScalar(0.03); cs.push(cr([p.clone(), p.clone().add(out).add(new THREE.Vector3(0, 0.01, 0))], 0.002)); }
      return { curves: cs, color: '#62b8ff', size: 0.0042, speed: 0.012, density: 200, fade: 0.3 };
    });
    def('urine', () => ({ curves: [R.ureter_l, R.ureter_r], color: YEL, size: 0.0034, speed: 0.03, density: 240, spread: 0.4 }));
    def('urine_out', () => ({ curves: [R.urethra], color: YEL, size: 0.0034, speed: 0.03, density: 600, spread: 0.5 }));
    def('renal_blood', () => [{ curves: [R.renal_artery_l, R.renal_artery_r], color: RED, size: 0.0034, speed: 0.03, density: 900, drive: 'beat' }, { curves: [R.renal_vein_l, R.renal_vein_r], color: BLUE, size: 0.0034, speed: 0.025, density: 700 }]);
    def('brain_spark', () => {
      const g = this.body.parts.cerebrum.geometry; const pa = g.attributes.position; const cs = [];
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(0, 1.64, -0.01);
      for (let i = 0; i < 70; i++) {
        a.fromBufferAttribute(pa, (Math.random() * pa.count) | 0);
        for (let k = 0; k < 20; k++) { b.fromBufferAttribute(pa, (Math.random() * pa.count) | 0); if (a.distanceTo(b) < 0.05 && a.distanceTo(b) > 0.015) break; }
        const mid = a.clone().lerp(b, 0.5); mid.add(mid.clone().sub(c).normalize().multiplyScalar(0.004));
        cs.push(cr([a.clone(), mid, b.clone()], 0.001));
      }
      return { curves: cs, color: '#e8dcff', size: 0.0042, speed: 0.08, density: 120, fade: 0.25 };
    });
    def('spinal_signals', () => ({ curves: [R.spinal_cord, R.spinal_cord.reversed()], color: '#e8dcff', size: 0.0042, speed: 0.3, density: 60 }));
    def('nerve_signals', () => ({ curves: grp('nerves', false), color: SIG, size: 0.0038, speed: 0.3, density: 22, max: 900 }));
    def('vision', () => {
      const bv = this.anchors.brain_vision; const cs = [];
      for (const s of ['optic_l', 'optic_r']) { const o = R[s]; const e = new THREE.Vector3(); o.at(o.length, e); cs.push(join([o, cr([e, e.clone().lerp(bv, 0.5).add(new THREE.Vector3(s === 'optic_l' ? 0.02 : -0.02, 0.005, 0)), bv], 0.002)], 0.002)); }
      return { curves: cs, color: SIG, size: 0.0045, speed: 0.09, density: 260 };
    });
    def('reflex', () => {
      const s = R.nerve_sensory_r, m = R.nerve_motor_r; const se = new THREE.Vector3(), ms = new THREE.Vector3();
      s.at(s.length, se); m.at(0, ms);
      const cord = new THREE.Vector3(0, se.y - 0.03, -0.028);
      return [
        { curves: [join([s, cr([se, se.clone().lerp(cord, 0.5).add(new THREE.Vector3(0, -0.01, 0)), cord], 0.002)], 0.0025)], color: '#7fe0ff', size: 0.005, speed: 0.35, density: 45 },
        { curves: [join([cr([cord, cord.clone().lerp(ms, 0.5), ms], 0.002), m], 0.0025)], color: '#ffb347', size: 0.005, speed: 0.35, density: 55 },
      ];
    });
    F.drivers = { beat: 1, in: 1, out: 1 };
  }

  addRectum() {
    const c = this.routes.rectum; const pts = []; const v = new THREE.Vector3();
    for (let i = 0; i <= 30; i++) { c.at(c.length * i / 30, v); pts.push(v.clone()); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 14, false);
    const m = new THREE.Mesh(g); m.name = 'rectum';
    this.body.addPart('rectum', m);
    m.material.color.set('#c38a74'); m.material.userData.baseColor = m.material.color.clone();
    this.body.root.add(m);
    this.anchors.rectum = c.p ? new THREE.Vector3(c.p[c.p.length - 3], c.p[c.p.length - 2] + 0.03, c.p[c.p.length - 1]) : this.anchors.anus;
  }

  // ------------------------------------------------------------ journeys
  explore() {
    this.journey = null; this.playing = false; this.audio.stopSpeech();
    this.flows.set([]); this.anim.set(['heartbeat', 'breathe']); this.tracer.stop(); this.mag.show(null);
    this.stepView = { at: new THREE.Vector3(0, 0.92, 0), z: 1, side: 0 };
    this.layerOverride = null; this.applyLayers();
    this.body.focus([]);
    this.setSkin(1);
    this.clearLabels();
    this.goView(true);
    this.refreshUI();
  }

  startJourney(id, idx = 0, play = true) {
    const j = JOURNEYS.find((x) => x.id === id); if (!j) return;
    this.journey = j; this.playing = play;
    this.showStep(idx);
  }

  showStep(i) {
    const j = this.journey; if (!j) return;
    this.stepIdx = THREE.MathUtils.clamp(i, 0, j.steps.length - 1);
    const s = this.step = j.steps[this.stepIdx];
    this.stepT = 0; this.picked = null; this.removePickLabel();
    this.layerOverride = s.only ? new Set(s.only) : null;
    this.fineStep = (s.show || []).includes('fine');
    this.musclesStep = (s.show || []).includes('muscles') || (s.only || []).includes('muscles');
    this.applyLayers();
    this.applyStepLook();
    this.anim.reset();
    this.anim.set(s.anim || []);
    this.flows.set(s.flows || []);
    this.mag.show(s.micro || null, this.lang);
    // hero tracer
    if (s.tracer) {
      const curves = s.tracer.seq.map((k) => this.routes[k]).filter(Boolean);
      const curve = curves.length > 1 ? PathCurve.smoothJoin(curves) : curves[0];
      let oxyAtD = null;
      if (s.tracer.oxyAt) { let d = 0; for (const k of s.tracer.seq) { if (k === s.tracer.oxyAt) { oxyAtD = d + this.routes[k].length * 0.5; break; } d += this.routes[k].length; } }
      this.tracer.start(curve, { ...s.tracer, oxyAtD });
    } else this.tracer.stop();
    const v = s.view;
    const at = typeof v.at === 'string' ? (this.anchors[v.at] || new THREE.Vector3(0, 1, 0)).clone() : new THREE.Vector3(...v.at);
    this.stepView = { at, z: v.z, side: v.side || 0 };
    this.goView(Q.has('shot'));
    this.buildStepLabels(s.labels || []);
    this.audio.chime();
    this.speakStep();
    this.refreshUI();
  }

  speakStep() {
    this.audio.stopSpeech();
    const s = this.step; if (!s) return;
    const token = (this.speakToken = (this.speakToken || 0) + 1);
    this.spoken = false; this.spokenAt = null; this.spokeOK = false;
    const text = s.title[this.lang] + '. ' + s.text[this.lang];
    this.audio.say(text, this.lang).then((ok) => { if (token === this.speakToken) { this.spoken = true; this.spokeOK = ok; } });
  }

  next() { if (!this.journey) return; if (this.stepIdx < this.journey.steps.length - 1) this.showStep(this.stepIdx + 1); else { this.playing = false; this.refreshUI(); } }
  prev() { if (this.journey) this.showStep(this.stepIdx - 1); }
  togglePlay() { if (!this.journey) return; this.playing = !this.playing; this.stepT = 0; this.refreshUI(); }

  applyStepLook() {
    const s = this.journey ? this.step : null;
    const focus = s ? s.focus || [] : [];
    this.body.focus(focus, 0.07);
    // ghosted parts: see-through so inner flow is visible
    const ghost = new Set(s ? s.ghost || [] : []);
    if (s && (s.flows || []).some((f) => f.startsWith('blood') || f === 'renal_blood')) ['arteries', 'veins', 'pulm_arteries', 'pulm_veins', 'arteries_minor', 'veins_minor'].forEach((g) => ghost.add(g));
    if (s && (s.flows || []).includes('coronary_flow')) ['coronary', 'cardiac_veins'].forEach((g) => ghost.add(g));
    if (s && (s.flows || []).some((f) => f.startsWith('air'))) ['trachea', 'bronchi', 'nasal_cavity', 'pharynx', 'larynx'].forEach((g) => ghost.add(g));
    if (s && (s.flows || []).some((f) => f.startsWith('chyme') || f === 'urine' || f === 'urine_out' || f === 'bile' || f === 'pancreatic')) ['duodenum', 'small_intestine', 'stomach', 'ureters', 'urethra', 'bile_ducts', 'bladder', 'gallbladder'].forEach((g) => ghost.add(g));
    if (s && s.tracer) ['esophagus', 'pharynx', 'stomach', 'large_intestine', 'rectum', 'duodenum', 'small_intestine', 'heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'pulm_arteries', 'pulm_veins', 'arteries', 'veins'].forEach((g) => ghost.add(g));
    if (s && s.ghostSkull) { ghost.add('skull'); ghost.add('vertebrae'); if (!(s.anim || []).includes('chew')) ghost.add('mandible'); }
    for (const g of ghost) {
      const mesh = this.body.parts[g]; if (!mesh) continue;
      const m = mesh.material; if (m.isShaderMaterial) continue;
      const inFocus = !focus.length || focus.includes(g);
      m.transparent = true; m.depthWrite = false;
      m.opacity = inFocus ? (g.startsWith('heart_') ? 0.38 : g.startsWith('lung') ? 0.22 : (s.view.z <= 1.3 ? 0.5 : 0.35)) : Math.min(m.opacity, 0.07);
      mesh.renderOrder = 6; m.needsUpdate = true;
    }
    this.setSkin(s ? (focus.length ? 0.45 : 0.8) : 1);
  }

  setSkin(o) { const m = this.body.parts.skin && this.body.parts.skin.material; if (m) m.uniforms.uOpacity.value = o; }

  applyLayers() {
    const b = this.body;
    const ov = this.layerOverride;
    for (const [name, mesh] of Object.entries(b.parts)) {
      let vis = false;
      for (const [k, list] of Object.entries(LAYERS)) {
        if (!list.includes(name)) continue;
        let on = b.layerOn[k];
        if (ov) on = ov.has(k);
        if (k === 'muscles') on = (b.layerOn.muscles && !ov) || !!this.musclesStep;
        if (on) vis = true;
      }
      if (FINE.includes(name)) vis = vis && (this.fine || !!this.fineStep);
      mesh.visible = vis;
    }
  }

  toggleLayer(k) { this.body.layerOn[k] = !this.body.layerOn[k]; this.applyLayers(); this.refreshUI(); }
  toggleFine() { this.fine = !this.fine; this.applyLayers(); this.refreshUI(); }

  // ------------------------------------------------------------ views
  goView(instant) {
    const v = this.stepView;
    if (this.inXR()) { this.vrFrame(v, instant); return; }
    const showMag = !!(this.step && this.step.micro && this.journey);
    const aspect = innerWidth / innerHeight;
    let dist = 3.0 / v.z * (aspect < 1 ? 1.25 / Math.max(aspect, 0.5) : 1);
    // leave room for the top bar and the story card
    const cardH = (document.getElementById('story')?.getBoundingClientRect().height || 0) + 90;
    const free = THREE.MathUtils.clamp((innerHeight - cardH) / innerHeight, 0.4, 1);
    dist *= Math.max(1, 0.86 / free);
    if (showMag) dist *= aspect < 1 ? 1.45 : 1.35;
    const dir = new THREE.Vector3(Math.sin(v.side), 0.1, Math.cos(v.side)).normalize();
    const target = v.at.clone();
    const right = new THREE.Vector3(Math.cos(v.side), 0, -Math.sin(v.side));
    const magR = (aspect < 1 ? 0.085 : 0.13) * dist, magOff = (aspect < 1 ? 0.15 : 0.3) * dist;
    if (showMag) {
      const up = aspect < 1;
      const mp = up ? v.at.clone().add(new THREE.Vector3(0, magOff, 0)) : v.at.clone().addScaledVector(right, magOff);
      this.placeMag(mp, magR, v.at);
      target.lerp(mp, 0.48);
    }
    const pos = target.clone().addScaledVector(dir, dist);
    this.labelK = dist * (innerWidth < 900 ? 1.25 : 0.95);
    this.relabel();
    if (instant) { this.camera.position.copy(pos); this.controls.target.copy(target); this.camTween = null; }
    else this.camTween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos, t1: target, t: 0 };
  }

  placeMag(p, radius, organ) {
    this.mag.group.position.copy(p);
    this.mag.group.scale.setScalar(radius / 1.28);
    this.mag.connectorFrom = organ;
  }

  // VR: move/scale the body so the focus sits comfortably in front of the user
  vrFrame(v, instant) {
    const head = this.headPose();
    const exploring = !this.journey;
    let M = exploring ? this.vrScale : THREE.MathUtils.clamp(v.z * 0.5, 1, 5) * this.vrScale;
    const standing = exploring || v.z <= 1.3;
    const yaw = Math.atan2(head.dir.x, head.dir.z) + Math.PI; // face the user
    const fwd = new THREE.Vector3(head.dir.x, 0, head.dir.z).normalize();
    let anchorBody, anchorWorld;
    if (standing) {
      anchorBody = new THREE.Vector3(v.at.x, 0, v.at.z);
      anchorWorld = head.pos.clone().setY(0).addScaledVector(fwd, 1.25 + 0.25 * M);
    } else {
      anchorBody = v.at.clone();
      anchorWorld = head.pos.clone().addScaledVector(fwd, 0.72); anchorWorld.y = Math.max(0.9, head.pos.y - 0.15);
    }
    const target = { anchorBody, anchorWorld, M, yaw: yaw + (v.side || 0) };
    if (instant || !this.vr) this.vr = { ...target, anchorBody: anchorBody.clone(), anchorWorld: anchorWorld.clone() };
    this.vrTarget = target;
    this.floor.visible = this.sky.visible && standing;
    // magnifier beside the focus, constant world size
    const showMag = !!(this.step && this.step.micro && this.journey);
    if (showMag) {
      const right = new THREE.Vector3(Math.cos(target.yaw - (v.side || 0)), 0, -Math.sin(target.yaw - (v.side || 0)));
      // right vector in body space (body yaw cancels)
      const rb = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), -(v.side || 0));
      const mp = v.at.clone().addScaledVector(rb, 0.3 / M).add(new THREE.Vector3(0, 0.2 / M, 0));
      this.placeMag(mp, 0.16 / M, v.at);
    }
    this.labelK = 1.35 / M;
    this.relabel();
  }

  applyVR(dt) {
    if (!this.vr || !this.vrTarget) return;
    const k = 1 - Math.exp(-dt * 2.2);
    const a = this.vr, b = this.vrTarget;
    a.anchorBody.lerp(b.anchorBody, k); a.anchorWorld.lerp(b.anchorWorld, k);
    a.M += (b.M - a.M) * k;
    let dy = b.yaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * k;
    const R = this.bodyRoot;
    R.scale.setScalar(a.M);
    R.rotation.set(0, a.yaw, 0);
    const off = a.anchorBody.clone().multiplyScalar(a.M).applyAxisAngle(new THREE.Vector3(0, 1, 0), a.yaw);
    R.position.copy(a.anchorWorld).sub(off);
  }

  headPose() {
    const cam = this.renderer.xr.getCamera();
    const pos = new THREE.Vector3(), q = new THREE.Quaternion();
    cam.getWorldPosition(pos); cam.getWorldQuaternion(q);
    if (pos.lengthSq() === 0) pos.set(0, 1.5, 0);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1); dir.normalize();
    return { pos, dir };
  }

  inXR() { return this.renderer.xr.isPresenting; }

  // ------------------------------------------------------------ labels
  clearLabels() { this.labelGroup.clear(); this.stepLabels = []; }
  buildStepLabels(parts) {
    this.clearLabels();
    const L = this.lang;
    parts.forEach((p, i) => {
      const info = PARTS[p]; if (!info) return;
      const a = this.anchorFor(p);
      const side = a.x >= 0.004 ? 1 : a.x <= -0.004 ? -1 : (i % 2 ? 1 : -1);
      const off = new THREE.Vector3(side * 0.05, 0.035 + (i % 2) * 0.015, 0.02);
      const lb = new Label(L === 'hi' ? [info[1], info[0]] : [info[0], info[1]], { height: 0.03, offset: off, cx: side > 0 ? 0 : 1, cy: 0.5, small: 22 });
      lb.position.copy(a); lb.userData.part = p; lb.baseOffY = off.y;
      this.labelGroup.add(lb); this.stepLabels.push(lb);
    });
    this.relabel();
  }
  anchorFor(p) {
    const onRoute = (k, f) => { const c = this.routes[k]; if (!c) return null; const v = new THREE.Vector3(); c.at(c.length * f, v); return v; };
    const fixed = { arteries: () => onRoute('aorta_leg_l', 0.2), veins: () => onRoute('vein_leg_l', 0.86), nerves: () => onRoute('nerve_sensory_r', 0.55),
      pulm_arteries: () => onRoute('pulm_art_r', 0.7), pulm_veins: () => onRoute('pulm_vein_l', 0.3), spinal_cord: () => onRoute('spinal_cord', 0.35),
      ureters: () => onRoute('ureter_l', 0.5), urethra: () => onRoute('urethra', 0.5), esophagus: () => onRoute('esophagus', 0.4), bronchi: () => onRoute('bronchus_l', 0.45),
      small_intestine: () => onRoute('small_intestine', 0.5), rectum: () => onRoute('rectum', 0.6) };
    if (fixed[p]) { const v = fixed[p](); if (v) return v; }
    const m = this.meta[p];
    const mesh = this.body.parts[p];
    if (m && mesh) {
      // a vertex near the bbox centre, pushed to the front surface, so the dot sits on the organ
      const c = new THREE.Vector3(...m.center);
      const pa = mesh.geometry.attributes.position; const v = new THREE.Vector3(); let best = null, bd = 1e9;
      const step = Math.max(1, (pa.count / 1500) | 0);
      for (let i = 0; i < pa.count; i += step) { v.fromBufferAttribute(pa, i); const d = Math.hypot(v.x - c.x, v.y - c.y) * 3 - v.z; if (d < bd) { bd = d; best = v.clone(); } }
      return best || c;
    }
    return (this.anchors[p] || new THREE.Vector3(0, 1, 0)).clone();
  }
  relabel() {
    const k = this.labelK || 1;
    const labs = this.labelGroup.children;
    // stack labels on each side so they never overlap: walk from top to bottom keeping a minimum gap
    for (const side of [1, -1]) {
      const g = labs.filter((l) => Math.sign(l.offset.x) === side).sort((a, b) => b.position.y - a.position.y);
      let lastY = Infinity;
      for (const l of g) {
        const h = l.height * k * 1.25;
        let y = l.position.y + l.baseOffY * k;
        if (y > lastY - h) y = lastY - h;
        l.offset.y = (y - l.position.y) / k;
        lastY = y;
      }
    }
    for (const l of labs) l.setScale(k);
  }

  // ------------------------------------------------------------ picking
  pickAt(raycaster) {
    const meshes = Object.values(this.body.parts).filter((m) => m.visible && (m.material.isShaderMaterial || m.material.opacity > 0.15));
    const hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    const nonSkin = hits.find((h) => h.object.userData.part !== 'skin');
    return nonSkin || hits[0];
  }
  showPick(hit) {
    this.removePickLabel();
    if (!hit) { this.picked = null; this.refreshUI(); return; }
    const p = hit.object.userData.part;
    const info = PARTS[p]; if (!info) return;
    this.picked = info; this.pickedId = p;
    const local = this.bodyRoot.worldToLocal(hit.point.clone());
    const L = this.lang;
    const lb = new Label(L === 'hi' ? [info[1], info[0]] : [info[0], info[1]], { height: 0.034, offset: new THREE.Vector3(0.04, 0.05, 0.02), cx: 0, cy: 0.5, small: 22, border: 'rgba(255,214,140,0.8)' });
    lb.position.copy(local); lb.setScale(this.labelK || 1);
    this.bodyRoot.add(lb); this.pickLabel = lb;
    this.flash = { mesh: hit.object, t: 0 };
    this.refreshUI();
  }
  removePickLabel() { if (this.pickLabel) { this.bodyRoot.remove(this.pickLabel); this.pickLabel.dispose(); this.pickLabel = null; } }

  // ------------------------------------------------------------ XR
  setupXR() {
    const r = this.renderer;
    this.controllers = [];
    const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    for (let i = 0; i < 2; i++) {
      const c = r.xr.getController(i);
      const line = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }));
      line.scale.z = 2.5; line.name = 'ray';
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      tip.name = 'tip';
      c.add(line, tip);
      c.addEventListener('connected', (e) => { c.userData.src = e.data; line.visible = e.data.targetRayMode !== 'gaze'; });
      c.addEventListener('disconnected', () => { c.userData.src = null; });
      c.addEventListener('selectstart', () => this.onSelect(c));
      c.addEventListener('squeezestart', () => this.grabStart(c));
      c.addEventListener('squeezeend', () => this.grabEnd(c));
      this.scene.add(c);
      const grip = r.xr.getControllerGrip(i);
      const pad = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.07, 6, 12), new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 0.5 }));
      pad.rotation.x = Math.PI / 2; grip.add(pad);
      this.scene.add(grip);
      this.controllers.push(c);
    }
    this.raycaster = new THREE.Raycaster();
    r.xr.addEventListener('sessionstart', () => this.onXRStart());
    r.xr.addEventListener('sessionend', () => this.onXREnd());
  }
  async autoXR() {
    document.body.classList.add('app-xr');
    const mode = this.appMode === 'ar' ? 'immersive-ar' : 'immersive-vr';
    const ok = await this.enterXR(mode, true);
    if (!ok) document.body.classList.add('app-xr-wait');
  }
  async enterXR(mode, quiet) {
    this.audio.unlock();
    document.body.classList.remove('app-xr-wait');
    if (!navigator.xr) { if (!quiet) this.toast(T.noXR[this.lang]); return false; }
    const ok = await navigator.xr.isSessionSupported(mode).catch(() => false);
    if (!ok) { if (!quiet) this.toast(T.noXR[this.lang]); return false; }
    const session = await navigator.xr.requestSession(mode, { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] }).catch((e) => { if (!quiet) this.toast(String(e.message || e)); return null; });
    if (!session) return false;
    this.xrMode = mode;
    await this.renderer.xr.setSession(session);
    return true;
  }
  onXRStart() {
    const ar = this.xrMode === 'immersive-ar';
    this.scene.background = ar ? null : this.bg;
    this.sky.visible = !ar; this.floor.visible = !ar;
    document.body.classList.add('in-xr');
    setTimeout(() => {
      this.vr = null;
      this.vrui.place(this.headPose());
      this.vrui.group.visible = true; this.vrui.dirty = true;
      this.goView(true);
    }, 300);
  }
  onXREnd() {
    if (this.appMode === 'vr' || this.appMode === 'ar') document.body.classList.add('app-xr-wait');
    this.scene.background = this.bg; this.sky.visible = true; this.floor.visible = true;
    this.vrui.group.visible = false;
    this.bodyRoot.position.set(0, 0, 0); this.bodyRoot.rotation.set(0, 0, 0); this.bodyRoot.scale.setScalar(1);
    this.vr = null;
    document.body.classList.remove('in-xr');
    this.goView(true);
  }
  rayFrom(c) {
    const m = new THREE.Matrix4().identity().extractRotation(c.matrixWorld);
    this.raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m);
    return this.raycaster;
  }
  onSelect(c) {
    this.audio.unlock();
    const rc = this.rayFrom(c);
    const ph = rc.intersectObjects(this.vrui.panels(), false)[0];
    if (ph) { const panel = ph.object.userData.panel; const id = panel.hitUV(ph.uv); if (id) this.action(id); return; }
    this.showPick(this.pickAt(rc));
  }
  grabStart(c) {
    if (!this.vr) return;
    c.userData.grab = { inv: new THREE.Matrix4().copy(c.matrixWorld).invert(), root: this.bodyRoot.matrixWorld.clone(), aw: this.vr.anchorWorld.clone(), yaw: this.vr.yaw, cpos: new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), cyaw: this.ctrlYaw(c) };
  }
  grabEnd(c) { c.userData.grab = null; }
  ctrlYaw(c) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(c.getWorldQuaternion(new THREE.Quaternion())); return Math.atan2(d.x, d.z); }
  xrInput(dt) {
    let hoverAny = false;
    for (const c of this.controllers) {
      if (!c.userData.src) continue;
      const rc = this.rayFrom(c);
      const ph = rc.intersectObjects(this.vrui.panels(), false)[0];
      const ray = c.getObjectByName('ray'), tip = c.getObjectByName('tip');
      for (const P of [this.vrui.menu, this.vrui.story]) {
        const id = ph && ph.object.userData.panel === P ? P.hitUV(ph.uv) : null;
        if (ph && ph.object.userData.panel === P) { this.vrui.setHover(P, id); hoverAny = true; } else this.vrui.setHover(P, null);
      }
      if (ray) ray.scale.z = ph ? ph.distance : 2.5;
      if (tip) { tip.position.set(0, 0, -(ph ? ph.distance : 2.5)); tip.visible = !!ph; }
      // grab: move body with the controller (position + yaw only)
      const g = c.userData.grab;
      if (g && this.vr && this.vrTarget) {
        const p = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld);
        const d = p.sub(g.cpos);
        this.vr.anchorWorld.copy(g.aw).add(d); this.vrTarget.anchorWorld.copy(this.vr.anchorWorld);
        let dy = this.ctrlYaw(c) - g.cyaw; this.vr.yaw = g.yaw + dy * 1.5; this.vrTarget.yaw = this.vr.yaw;
      }
      // thumbsticks: x = turn, y = size
      const gp = c.userData.src && c.userData.src.gamepad;
      if (gp && gp.axes && this.vrTarget) {
        const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0], ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
        if (Math.abs(ax) > 0.25) { this.vrTarget.yaw += ax * dt * 1.6; }
        if (Math.abs(ay) > 0.35) {
          const f = Math.exp(-ay * dt * 0.9);
          this.vrScale = THREE.MathUtils.clamp(this.vrScale * f, 0.4, 6);
          this.vrTarget.M = THREE.MathUtils.clamp(this.vrTarget.M * f, 0.3, 30);
          this.vrui.dirty = true;
          this.labelK = 1 / this.vrTarget.M; this.relabel();
        }
        // buttons A/X: next step, B/Y: previous
        const bA = gp.buttons[4] && gp.buttons[4].pressed, bB = gp.buttons[5] && gp.buttons[5].pressed;
        if (bA && !c.userData.bA) this.journey ? this.next() : null;
        if (bB && !c.userData.bB) this.journey ? this.prev() : null;
        c.userData.bA = bA; c.userData.bB = bB;
      }
    }
    if (this.vrui.dirty) this.vrui.draw();
  }

  // ------------------------------------------------------------ actions (shared by HTML and VR)
  action(id) {
    if (id.startsWith('j_')) { const j = id.slice(2); if (j === 'explore') this.explore(); else this.startJourney(j, 0, true); }
    else if (id.startsWith('l_')) { const k = id.slice(2); if (k === 'fine') this.toggleFine(); else this.toggleLayer(k); }
    else if (id === 'lang_en' || id === 'lang_hi') this.setLang(id.slice(5));
    else if (id === 'next') this.next();
    else if (id === 'prev') this.prev();
    else if (id === 'play') this.togglePlay();
    else if (id === 'voice') { this.audio.voice = !this.audio.voice; store.set('hb_voice', this.audio.voice ? '1' : '0'); if (!this.audio.voice) this.audio.stopSpeech(); else this.speakStep(); }
    else if (id === 'reset') { this.vrScale = 1; this.goView(true); }
    else if (id === 'size_up') { this.vrScale = Math.min(6, this.vrScale * 1.4); this.goView(false); }
    else if (id === 'size_dn') { this.vrScale = Math.max(0.4, this.vrScale / 1.4); this.goView(false); }
    else if (id === 'exit') { const s = this.renderer.xr.getSession(); s && s.end(); }
    this.refreshUI();
  }
  setLang(l) {
    this.lang = l; store.set('hb_lang', l);
    document.documentElement.lang = l;
    this.mag.setLang(l);
    if (this.journey) { this.buildStepLabels(this.step.labels || []); this.speakStep(); }
    if (this.pickLabel && this.pickedId) { const info = PARTS[this.pickedId]; const pos = this.pickLabel.position.clone(); this.removePickLabel(); const lb = new Label(l === 'hi' ? [info[1], info[0]] : [info[0], info[1]], { height: 0.034, offset: new THREE.Vector3(0.04, 0.05, 0.02), cx: 0, cy: 0.5, small: 22, border: 'rgba(255,214,140,0.8)' }); lb.position.copy(pos); lb.setScale(this.labelK || 1); this.bodyRoot.add(lb); this.pickLabel = lb; }
    this.buildHTML();
    this.refreshUI();
  }

  // ------------------------------------------------------------ HTML UI
  buildHTML() {
    const L = this.lang;
    document.documentElement.lang = L;
    $('#title').textContent = T.title[L];
    $('#lang-en').classList.toggle('on', L === 'en'); $('#lang-hi').classList.toggle('on', L === 'hi');
    const narrow = innerWidth < 520; $('#btn-vr').textContent = narrow ? 'VR' : T.enterVR[L]; $('#btn-ar').textContent = narrow ? 'AR' : T.enterAR[L];
    $('#jlabel').textContent = T.journeys[L]; $('#llabel').textContent = T.layers[L];
    const jl = $('#journeys'); jl.innerHTML = '';
    const mk = (id, icon, title, color) => {
      const b = document.createElement('button'); b.className = 'jbtn'; b.dataset.id = id; b.style.setProperty('--c', color);
      b.innerHTML = `<span class="ji"></span><span>${title}</span>`;
      b.onclick = () => { this.audio.unlock(); this.action('j_' + id); };
      jl.appendChild(b);
    };
    mk('explore', '', T.explore[L], '#d9d2c3');
    for (const j of JOURNEYS) mk(j.id, j.icon, j.title[L], SYSTEMS[j.sys].color);
    const ll = $('#layers'); ll.innerHTML = '';
    for (const k of ['skin', 'skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous', 'fine']) {
      const b = document.createElement('button'); b.className = 'lbtn'; b.dataset.id = k;
      const col = k === 'fine' ? '#e0414b' : SYSTEMS[k].color;
      b.style.setProperty('--c', col);
      b.innerHTML = `<i></i><span>${k === 'fine' ? T.fine[L] : SYSTEMS[k][L]}</span>`;
      b.onclick = () => this.action('l_' + k);
      ll.appendChild(b);
    }
    $('#btn-prev').textContent = '‹ ' + T.back[L]; $('#btn-next').textContent = T.next[L] + ' ›';
  }
  refreshUI() {
    const L = this.lang;
    document.querySelectorAll('.jbtn').forEach((b) => b.classList.toggle('on', (this.journey ? this.journey.id : 'explore') === b.dataset.id));
    document.querySelectorAll('.lbtn').forEach((b) => { const k = b.dataset.id; b.classList.toggle('on', k === 'fine' ? this.fine : !!this.body.layerOn[k]); });
    $('#btn-voice').classList.toggle('on', this.audio.voice);
    $('#btn-voice').innerHTML = this.audio.voice ? VOICE_ON : VOICE_OFF; $('#btn-voice').classList.toggle('off', !this.audio.voice);
    const card = $('#story');
    if (this.journey) {
      const j = this.journey, s = this.step;
      card.classList.remove('explore');
      card.style.setProperty('--c', SYSTEMS[j.sys].color);
      $('#s-kicker').textContent = `${j.title[L]} · ${T.step[L]} ${this.stepIdx + 1} ${T.of[L]} ${j.steps.length}`;
      $('#s-title').textContent = s.title[L];
      $('#s-text').textContent = s.text[L];
      $('#s-dots').innerHTML = j.steps.map((_, i) => `<i class="${i <= this.stepIdx ? 'on' : ''}" data-i="${i}"></i>`).join('');
      $('#s-dots').querySelectorAll('i').forEach((d) => (d.onclick = () => this.showStep(+d.dataset.i)));
      $('#btn-play').textContent = this.playing ? T.pause[L] : T.play[L];
      $('#s-controls').style.display = '';
    } else {
      card.classList.add('explore');
      card.style.setProperty('--c', '#d9d2c3');
      $('#s-kicker').textContent = T.explore[L];
      const p = this.picked;
      $('#s-title').textContent = p ? (L === 'hi' ? p[1] : p[0]) : T.title[L];
      $('#s-text').textContent = p ? `${L === 'hi' ? p[0] : p[1]} — ${L === 'hi' ? p[3] : p[2]}` : T.exploreHint[L];
      $('#s-dots').innerHTML = '';
      $('#s-controls').style.display = 'none';
    }
    if (this.vrui) this.vrui.dirty = true;
    if (!this.inXR()) requestAnimationFrame(() => { const card = document.getElementById('story'); const d = Math.round((card.getBoundingClientRect().height + 24) * 0.5); if (d !== this._vo) { this._vo = d; this.camera.setViewOffset(innerWidth, innerHeight, 0, d, innerWidth, innerHeight); this.camera.updateProjectionMatrix(); } });
  }
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 4200); }

  bindInput() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; this.audio.unlock(); });
    el.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 6 && performance.now() - down.t < 500) {
        const ndc = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.camera);
        this.showPick(this.pickAt(rc));
      }
      down = null;
    });
    $('#lang-en').onclick = () => this.setLang('en');
    $('#lang-hi').onclick = () => this.setLang('hi');
    $('#btn-vr').onclick = () => this.enterXR('immersive-vr');
    $('#xr-go').onclick = () => this.enterXR(this.appMode === 'ar' ? 'immersive-ar' : 'immersive-vr');
    $('#btn-ar').onclick = () => this.enterXR('immersive-ar');
    $('#btn-voice').onclick = () => { this.audio.unlock(); this.action('voice'); };
    $('#btn-next').onclick = () => { this.audio.unlock(); this.next(); };
    $('#btn-prev').onclick = () => { this.audio.unlock(); this.prev(); };
    $('#btn-play').onclick = () => { this.audio.unlock(); this.togglePlay(); };
    $('#btn-reset').onclick = () => this.goView(false);
    $('#btn-panels').onclick = () => document.body.classList.toggle('panels-open');
    addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === ' ') { e.preventDefault(); this.togglePlay(); }
    });
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((ok) => $('#btn-vr').classList.toggle('dim', !ok)).catch(() => {});
      navigator.xr.isSessionSupported('immersive-ar').then((ok) => $('#btn-ar').classList.toggle('dim', !ok)).catch(() => {});
    } else { $('#btn-vr').classList.add('dim'); $('#btn-ar').classList.add('dim'); }
  }
  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    // keep the body centred in the space above the story card
    const card = document.getElementById('story');
    const d = card ? Math.round((card.getBoundingClientRect().height + 24) * 0.5) : 0;
    if (d > 0) this.camera.setViewOffset(innerWidth, innerHeight, 0, d, innerWidth, innerHeight); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    if (!this.inXR() && this.stepView) this.goView(true);
  }

  // ------------------------------------------------------------ frame
  frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const xr = this.inXR();
    this.anim.update(dt);
    const D = this.flows.drivers;
    D.beat = 0.35 + 1.6 * this.anim.beat;
    const breathing = this.anim.on.has('breathe') || this.anim.on.has('breathe_deep');
    D.in = breathing ? (this.anim.inhaling ? 1.7 : 0.08) : 1;
    D.out = breathing ? (this.anim.inhaling ? 0.08 : 1.6) : 1;
    this.flows.beat = this.anim.beat;
    this.flows.update(dt);
    this.tracer.update(dt, t, 0.4 + 1.5 * this.anim.beat);
    // point size scale
    let scale;
    if (xr) {
      const cam = this.renderer.xr.getCamera();
      const sub = cam.cameras && cam.cameras[0];
      const h = sub && sub.viewport ? sub.viewport.w : 1800;
      scale = h * 0.5 * (sub ? sub.projectionMatrix.elements[5] : 1.2);
    } else scale = this.renderer.domElement.height * 0.5 * this.camera.projectionMatrix.elements[5];
    const ms = this.bodyRoot.scale.x;
    // particles and the hero cell grow when seen from far away so they stay visible
    let boost;
    if (xr) { const hp = this.headPose().pos; const f = this.stepView ? this.bodyRoot.localToWorld(this.stepView.at.clone()) : hp; boost = THREE.MathUtils.clamp(hp.distanceTo(f) / 0.8, 1, 2.2); }
    else boost = THREE.MathUtils.clamp(this.camera.position.distanceTo(this.controls.target) / 0.9, 1, 3.2);
    this.viewBoost = boost;
    this.flows.mat.uniforms.uScale.value = scale; this.flows.mat.uniforms.uModel.value = ms * boost;
    this.tracer.trail.mat.uniforms.uScale.value = scale; this.tracer.trail.mat.uniforms.uModel.value = ms * boost;
    this.tracer.setBoost(boost);
    const cam = xr ? this.renderer.xr.getCamera() : this.camera;
    this.mag.update(dt, t, cam);
    // pick flash
    if (this.flash) {
      this.flash.t += dt; const m = this.flash.mesh.material;
      if (m.emissive) { const a = Math.max(0, 1 - this.flash.t / 1.2) * 0.35; m.emissive.setRGB(a, a * 0.8, a * 0.4); }
      if (this.flash.t > 1.2) this.flash = null;
    }
    if (xr) { this.applyVR(dt); this.xrInput(dt); }
    else if (this.camTween) {
      const tw = this.camTween; tw.t = Math.min(1, tw.t + dt / 1.4);
      const e = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - Math.pow(-2 * tw.t + 2, 3) / 2;
      this.camera.position.lerpVectors(tw.p0, tw.p1, e); this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      if (tw.t >= 1) this.camTween = null;
    }
    if (!xr) this.controls.update();
    // autoplay: advance after narration (or reading time) plus a pause to watch
    if (this.journey && this.playing) {
      this.stepT += dt;
      const s = this.step; const words = s.text[this.lang].split(' ').length;
      if (this.spoken && this.spokenAt == null) this.spokenAt = this.stepT;
      const readT = Math.max(12, words * 0.42 + 5);
      const due = this.spokeOK && this.spokenAt != null ? Math.max(8, this.spokenAt + 4) : readT;
      if (this.stepT > due) { if (this.stepIdx < this.journey.steps.length - 1) this.showStep(this.stepIdx + 1); else { this.playing = false; this.refreshUI(); } }
    }
    this.renderer.render(this.scene, this.camera);
    if (Q.has('shot') && !this._shotDone) {
      this._frames = (this._frames || 0) + 1;
      if (this._frames > (+Q.get('shot') || 90)) { this._shotDone = true; document.title = 'READY'; }
    }
  }
}

if ('serviceWorker' in navigator && !Q.has('shot') && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(() => {});

const app = new App();
window.app = app;
app.init().catch((e) => { console.error(e); const el = $('#loader .msg'); if (el) el.textContent = 'Error: ' + e.message; });
