// DUET STEM · Human Body 360 — app shell: body, journeys, parts, Organ Lab, take-apart and put-back game, VR.
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
import { ZoomStand } from './zoom.js';
import { Lab, LABS, LAB_IDS } from './lab.js';
import { Dismantle } from './dismantle.js';
import { JOURNEYS, SYSTEMS, T } from './data.js';
import { LANGS, C, tx, partInfo, hasAudio, loadContent } from './content.js';

const Q = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);
const clock = new THREE.Clock();
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

if (!LAYERS.digestive.includes('rectum')) LAYERS.digestive.push('rectum');
const FINE = ['arteries_minor', 'veins_minor', 'nerves_minor'];
const SYS_ORDER = ['skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous', 'senses', 'endocrine', 'lymphatic', 'skin'];
const BODY_Z = -1.35; // VR: body stands this far in front of the user
const SV = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const VOICE_ON = SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
const VOICE_OFF = SV('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>');
export const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

// which Organ Lab explains a body part
const LAB_GROUPS = {
  heart: ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary', 'valve_aortic', 'papillary', 'cardiac_veins', 'pulm_arteries', 'pulm_veins'],
  eye: ['eyes'], ear: ['ear'], brain: ['cerebrum', 'cerebellum', 'brainstem', 'brain_deep', 'pituitary'], lungs: ['lung_r', 'lung_l', 'bronchi', 'trachea'],
  kidney: ['kidney_l', 'kidney_r', 'renal_pelvis', 'ureters'], tooth: ['teeth'], skin: ['skin'],
};
const LAB_PARTS = { heart: ['coronary_arteries', 'aorta_arch', 'heart', 'venae_cavae'], eye: ['optic_nerve', 'eye'], ear: ['hearing_nerve', 'outer_ear'], brain: ['brain'], lungs: ['right_lung', 'left_lung'], kidney: ['kidneys', 'renal_arteries', 'renal_veins'], skin: ['skin'] };

class App {
  constructor() {
    this.lang = store.get('hb_lang') || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en');
    if (Q.get('lang')) this.lang = Q.get('lang');
    if (!LANGS.includes(this.lang)) this.lang = 'en';
    this.mode = 'explore'; this.journey = null; this.stepIdx = 0; this.playing = false; this.fine = false;
    this.sel = null; this.isolated = null; this.labId = null; this.labSel = null; this.selPiece = null;
    this.audio = new Audio();
    this.audio.voice = store.get('hb_voice') !== '0';
    this.audio.sfx = store.get('hb_sfx') !== '0';
    this.speed = +(store.get('hb_speed') || 1); if (![1, 2, 3, 5, 10].includes(this.speed)) this.speed = 1; this.audio.rate = Math.min(this.speed, 2);
    this.vrBody = { yaw: 0, scale: 1, pos: new THREE.Vector3(0, 0, BODY_Z), off: new THREE.Vector3() };
    this.vrLabScale = 1; this.eye = 1.55; this.museum = false;
    this.offline = { have: 0, total: 0, busy: false };
    this.feedback = '';
  }

  async init() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: Q.has('shot') });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(innerWidth, innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.localClippingEnabled = true;
    r.xr.enabled = true; r.xr.setReferenceSpaceType('local-floor'); r.xr.setFoveation(0.1); r.xr.setFramebufferScaleFactor(1.35);
    $('#stage').appendChild(r.domElement);

    const scene = this.scene = new THREE.Scene();
    this.bg = new THREE.Color('#0a0d13'); scene.background = this.bg;
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight('#e4ecff', '#2a1d16', 0.55));
    const key = new THREE.DirectionalLight('#ffffff', 1.35); key.position.set(1.2, 2.4, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#9fc4ff', 0.55); rim.position.set(-2, 1.5, -2.5); scene.add(rim);

    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.01, 60);
    this.camera.position.set(0, 1.0, 3.2);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.target.set(0, 0.9, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.08; this.controls.maxDistance = 6;
    this.controls.addEventListener('start', () => { this.camTween = null; });

    // world = the room. In VR it is placed where the user stood when VR started, and it never moves on a click.
    this.world = new THREE.Group(); scene.add(this.world);
    this.buildRoom();
    this.bodyRoot = new THREE.Group(); this.world.add(this.bodyRoot);
    this.body = new Body(); this.bodyRoot.add(this.body.root);
    this.flows = new FlowSystem(12000); this.bodyRoot.add(this.flows.points);
    this.tracer = new Tracer(); this.bodyRoot.add(this.tracer.group);
    this.mag = new Magnifier(); this.bodyRoot.add(this.mag.group);
    this.labelGroup = new THREE.Group(); this.bodyRoot.add(this.labelGroup);
    this.world.add(this.bodyFloor);
    this.zoom = new ZoomStand(this); this.world.add(this.zoom.group);
    this.lab = new Lab(this); this.world.add(this.lab.group); this.lab.group.position.set(0, 1.12, 0);
    this.dis = new Dismantle(this); this.bodyRoot.add(this.dis.group);

    this.setLoading(0.02);
    const [, paths, meta3, objects] = await Promise.all([
      this.body.load(asset('./models/body.glb'), (f) => this.setLoading(0.05 + 0.8 * f)),
      fetch('./models/paths.json').then((x) => x.json()),
      fetch('./models/meta3.json').then((x) => x.json()),
      fetch('./models/objects.json').then((x) => x.json()),
      loadContent('./models/content.json'),
    ]);
    this.body.setObjects(objects);
    this.meta = meta3.groups; this.partMeta = meta3.parts;
    this.setupPaths(paths);
    this.addRectum();
    this.buildPartLists();
    this.anim = new OrganAnimator(this.body, this.audio);
    this.body.layerOn.muscles = false;
    this.applyLayers();
    this.vrui = new VRUI(this); this.world.add(this.vrui.group);
    this.setupXR();
    this.buildHTML();
    this.bindInput();
    addEventListener('resize', () => this.onResize());
    this.onResize();
    this.setLoading(1);
    $('#loader').classList.add('done');
    r.setAnimationLoop(() => this.frame());
    this.setupOffline();
    const j = Q.get('j');
    if (j) this.startJourney(j, +(Q.get('s') || 0), false);
    else if (Q.get('lab')) this.openLab(Q.get('lab'), +(Q.get('s') || 0), false);
    else if (Q.get('part')) this.selectPart(Q.get('part'), { from: 'list' });
    else if (Q.get('dis')) this.startDismantle(Q.get('dis'));
    else if (Q.get('game')) this.startGame(Q.get('game'));
    else this.explore();
    this.appMode = Q.get('app');
    if (this.appMode === 'vr' || this.appMode === 'ar') this.autoXR();
    if (Q.has('iwer')) import('./test-iwer.js').then((m) => m.default(this)).catch((e) => console.warn(e));
    this.body.loadMuscles(asset('./models/muscles.glb')).then(() => { this.musclesReady = true; this.applyLayers(); this.applyStepLook(); });
  }
  setLoading(f) { const b = $('#loadbar'); if (b) b.style.transform = `scaleX(${f})`; }

  buildRoom() {
    const room = this.room = new THREE.Group();
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, 'rgba(120,150,190,0.35)'); g.addColorStop(0.6, 'rgba(70,90,120,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(180,205,240,0.18)'; x.lineWidth = 2;
    for (let rr = 40; rr < 256; rr += 40) { x.beginPath(); x.arc(256, 256, rr, 0, 7); x.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.001; floor.renderOrder = -1;
    room.add(floor);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 a = vec3(0.035,0.045,0.07); vec3 b = vec3(0.09,0.11,0.16); vec3 c = mix(b, a, smoothstep(-0.1, 0.6, h)); c = mix(vec3(0.05,0.045,0.05), c, smoothstep(-0.35, 0.0, h)); gl_FragColor = vec4(c,1.); }',
    }));
    sky.renderOrder = -2; room.add(sky);
    this.sky = sky; this.floor = floor;
    const logo = new THREE.TextureLoader().load('./brand/duet-stem-logo-light.png'); logo.colorSpace = THREE.SRGBColorSpace; logo.anisotropy = 8;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9 * 165 / 1024), new THREE.MeshBasicMaterial({ map: logo, transparent: true, opacity: 0.85, depthWrite: false }));
    plaque.rotation.x = -Math.PI / 2; plaque.position.set(0, 0.003, 0.62);
    this.bodyFloor = new THREE.Group(); this.bodyFloor.add(plaque);
    // museum mode: a platform under the exhibit and a walking circle around it
    const mu = this.museumSet = new THREE.Group(); mu.visible = false;
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.04, 64), new THREE.MeshStandardMaterial({ color: '#1b2433', roughness: 0.4, metalness: 0.3 }));
    plat.position.y = 0.02;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.006, 8, 96), new THREE.MeshBasicMaterial({ color: '#7fd1ff' })); edge.rotation.x = Math.PI / 2; edge.position.y = 0.041;
    const path = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.06, 96), new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide })); path.rotation.x = -Math.PI / 2; path.position.y = 0.004;
    mu.add(plat, edge, path);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2; const tri = new THREE.Mesh(new THREE.CircleGeometry(0.05, 3), new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
      tri.rotation.set(-Math.PI / 2, 0, -a); tri.position.set(Math.sin(a) * 1.03, 0.006, Math.cos(a) * 1.03); mu.add(tri);
    }
    this.world.add(room, this.museumSet);
  }

  // ------------------------------------------------------------ paths & flows (body)
  setupPaths(paths) {
    const R = this.routes = {};
    const RAD = { air_in: 0.006, food_mouth: 0.006, esophagus: 0.007, stomach: 0.02, duodenum: 0.009, small_intestine: 0.006, colon: 0.014, rectum: 0.011, ileocecal: 0.008, bile: 0.0025, pancreatic: 0.002, portal: 0.004, spinal_cord: 0.004, urethra: 0.0015 };
    for (const [k, v] of Object.entries(paths.routes)) R[k] = new PathCurve(v, RAD[k] ?? (k.startsWith('heart') ? 0.007 : k.startsWith('ureter') ? 0.0018 : 0.004));
    this.anchors = {};
    for (const [k, v] of Object.entries(paths.anchors)) this.anchors[k] = V3(v);
    for (const [k, m] of Object.entries(this.meta)) if (!this.anchors[k]) this.anchors[k] = V3(m.center);
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
    // oxygen carried to every part of the body, carbon dioxide carried back
    def('o2_body', () => ({ curves: grp('arteries', false), color: '#aef6ff', size: 0.0042, speed: 0.12, density: 28, max: 2600, drive: 'beat', spread: 0.45 }));
    def('co2_body', () => ({ curves: grp('veins', false), color: '#c9ced8', size: 0.0038, speed: 0.06, density: 24, max: 2000, spread: 0.45 }));
    def('blood_pulm', () => [{ curves: grp('pulm_arteries', false), color: PURP, size: 0.0034, speed: 0.06, density: 130, drive: 'beat' }, { curves: grp('pulm_veins', false), color: RED, size: 0.0034, speed: 0.05, density: 130 }]);
    def('heart_right', () => [{ curves: [R.heart_right, R.heart_right_ivc], color: BLUE, size: 0.0032, speed: 0.06, density: 500, spread: 0.8, drive: 'beat' }]);
    def('heart_left', () => [{ curves: [R.heart_left], color: RED, size: 0.0032, speed: 0.06, density: 500, spread: 0.8, drive: 'beat' }]);
    def('heart_flow', () => [{ curves: [R.heart_right, R.heart_right_ivc], color: BLUE, size: 0.0028, speed: 0.06, density: 350, spread: 0.8, drive: 'beat' }, { curves: [R.heart_left], color: RED, size: 0.0028, speed: 0.06, density: 350, spread: 0.8, drive: 'beat' }]);
    def('coronary_flow', () => [{ curves: grp('coronary', false), color: RED, size: 0.003, speed: 0.04, density: 420 }, { curves: grp('cardiac_veins', false), color: BLUE, size: 0.003, speed: 0.03, density: 380 }]);
    def('saliva', () => {
      const m = this.anchors.mouth;
      const glands = [[0.045, 1.55, 0.02], [-0.045, 1.55, 0.02], [0.03, 1.5, 0.05], [-0.03, 1.5, 0.05]].map(V3);
      return { curves: [...grp('salivary', false), ...glands.map((g) => cr([g, g.clone().lerp(m, 0.5).add(new THREE.Vector3(0, 0.006, 0.01)), m], 0.002))], color: '#fff1b0', size: 0.0035, speed: 0.03, density: 500 };
    });
    def('chyme', () => [{ curves: [R.stomach, R.stomach.reversed()], color: FOOD, size: 0.0048, speed: 0.025, count: 200, spread: 0.95 }, { curves: [R.stomach.reversed()], color: '#c9f06a', size: 0.0035, speed: 0.04, count: 70, spread: 0.95 }]);
    def('chyme_duo', () => ({ curves: [R.duodenum], color: FOOD, size: 0.0045, speed: 0.03, density: 380, spread: 0.7 }));
    def('chyme_si', () => ({ curves: [R.small_intestine], color: FOOD, size: 0.004, speed: 0.07, density: 110, spread: 0.6 }));
    def('bile', () => ({ curves: [R.bile], color: '#7ad957', size: 0.0036, speed: 0.03, density: 300 }));
    def('pancreatic', () => ({ curves: [R.pancreatic], color: YEL, size: 0.0034, speed: 0.03, density: 280 }));
    def('nutrients', () => {
      const si = R.small_intestine, po = R.portal; const a = new THREE.Vector3(), b = new THREE.Vector3(); const cs = [];
      for (let i = 0; i < 26; i++) { si.at(Math.random() * si.length, a); po.at(Math.random() * po.length * 0.3, b); cs.push(cr([a.clone(), a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.01, 0.01)), b.clone()], 0.002)); }
      return [{ curves: cs, color: YEL, size: 0.004, speed: 0.04, density: 70 }, { curves: [po], color: YEL, size: 0.004, speed: 0.06, density: 260 }];
    });
    def('portal', () => ({ curves: [R.portal], color: '#a8406e', size: 0.0038, speed: 0.05, density: 260 }));
    def('glucose_body', () => ({ curves: [R.aorta_leg_l, R.aorta_head, R.aorta_arm_r, R.aorta_kidney_l, ...grp('arteries', false).filter((_, i) => i % 3 === 0)].filter(Boolean), color: YEL, size: 0.0042, speed: 0.12, density: 40, max: 1800 }));
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
    const c = this.routes.rectum; if (!c || this.body.parts.rectum) return;
    const pts = []; const v = new THREE.Vector3();
    for (let i = 0; i <= 30; i++) { c.at(c.length * i / 30, v); pts.push(v.clone()); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 14, false)); m.name = 'rectum';
    this.body.addPart('rectum', m);
    m.material.color.set('#c38a74'); m.material.userData.baseColor = m.material.color.clone();
    this.body.root.add(m);
    this.anchors.rectum = new THREE.Vector3(c.p[c.p.length - 3], c.p[c.p.length - 2] + 0.03, c.p[c.p.length - 1]);
  }

  buildPartLists() {
    this.partsBySys = {};
    for (const [pid, p] of Object.entries(C.parts)) {
      if (!p.sys || !this.body.partObjs[pid]) continue;
      (this.partsBySys[p.sys] ||= []).push(pid);
    }
    for (const l of Object.values(this.partsBySys)) l.sort((a, b) => tx(C.parts[a].name, 'en').localeCompare(tx(C.parts[b].name, 'en')));
  }
  partInfo(pid) { return partInfo(pid, this.lang); }

  // ------------------------------------------------------------ modes
  leave() {
    this.audio.stopSpeech();
    this.playing = false; this.journey = null; this.step = null;
    this.flows.set([]); this.tracer.stop(); this.mag.show(null); this.zoom.hide();
    this.clearSel(); this.showAll(true); this.clearLabels();
    if (this.mode === 'lab') { this.lab.close(); this.labId = null; this.labSel = null; }
    if (this.mode === 'dismantle' || this.mode === 'game') { this.dis.clear(); this.selPiece = null; this.restoreGroups(); }
    this.bodyRoot.visible = true;
    this.layerOverride = null; this.musclesStep = false; this.fineStep = false;
    this.feedback = '';
    if (this.vrui && this.vrui.page === 'labparts') this.vrui.page = 'home';
  }

  explore() {
    this.leave(); this.mode = 'explore';
    this.anim.reset(); this.anim.set(['heartbeat', 'breathe']);
    this.stepView = { at: new THREE.Vector3(0, 0.9, 0), z: 0.9, side: 0 };
    this.applyLayers(); this.body.focus([]); this.setSkin(1);
    this.clearLabels();
    this.goView(true);
    this.refreshUI();
  }

  // ---- journeys
  startJourney(id, idx = 0, play = true) {
    const j = JOURNEYS.find((x) => x.id === id); if (!j) return;
    this.leave(); this.mode = 'journey';
    this.journey = j; this.playing = play;
    this.showStep(idx);
  }
  showStep(i) {
    const j = this.journey; if (!j) return;
    this.stepIdx = THREE.MathUtils.clamp(i, 0, j.steps.length - 1);
    const s = this.step = j.steps[this.stepIdx];
    this.stepT = 0; this.clearSel();
    this.layerOverride = s.only ? new Set(s.only) : null;
    const flows = [...(s.flows || [])];
    // oxygen to every cell: whole-body oxygen and carbon dioxide streams
    if ((j.id === 'breathing' || j.id === 'circulation') && flows.includes('blood_arteries')) flows.push('o2_body');
    if ((j.id === 'breathing' || j.id === 'circulation') && flows.includes('blood_veins')) flows.push('co2_body');
    if (j.id === 'digestion' && flows.includes('glucose_body')) flows.push('o2_body');
    this.fineStep = (s.show || []).includes('fine') || flows.includes('o2_body');
    this.musclesStep = (s.show || []).includes('muscles') || (s.only || []).includes('muscles');
    this.applyLayers(); this.applyStepLook();
    this.anim.reset(); this.anim.set(s.anim || []);
    this.flows.set(flows);
    this.mag.show(s.micro || null, this.lang);
    if (s.tracer) {
      const curves = s.tracer.seq.map((k) => this.routeSlice(k)).filter(Boolean);
      const curve = curves.length > 1 ? PathCurve.smoothJoin(curves) : curves[0];
      let oxyAtD = null;
      if (s.tracer.oxyAt) { let d = 0; s.tracer.seq.forEach((k, ii) => { if (oxyAtD != null) return; if (k === s.tracer.oxyAt) oxyAtD = d + curves[ii].length * 0.5; else d += curves[ii].length; }); }
      this.tracer.start(curve, { ...s.tracer, from: 0, until: 1, oxyAtD });
    } else this.tracer.stop();
    const v = s.view;
    const at = typeof v.at === 'string' ? (this.anchors[v.at] || new THREE.Vector3(0, 1, 0)).clone() : V3(v.at);
    this.stepView = { at, z: v.z, side: v.side || 0 };
    this.goView(Q.has('shot'));
    this.buildStepLabels(s.labels || []);
    this.audio.chime();
    this.narrate(s.id, tx(s.title, this.lang) + '. ' + tx(s.text, this.lang));
    this.refreshUI();
  }
  routeSlice(k) {
    if (typeof k === 'string') return this.routes[k];
    const c = this.routes[k.r]; if (!c) return null;
    let a = k.a ?? 0; const b = k.b ?? 1;
    if (k.fromAnchor && this.anchors[k.fromAnchor]) {
      const t = this.anchors[k.fromAnchor]; let bi = 0, bd = 1e9;
      for (let i = 0; i < c.n; i++) { const d = Math.hypot(c.p[i * 3] - t.x, c.p[i * 3 + 1] - t.y, c.p[i * 3 + 2] - t.z); if (d < bd) { bd = d; bi = i; } }
      a = c.s[bi] / c.length;
    }
    return a > 0 || b < 1 ? c.slice(a, b) : c;
  }
  next() {
    if (this.mode === 'lab') return this.labStep(this.lab.step + 1);
    if (!this.journey) return;
    if (this.stepIdx < this.journey.steps.length - 1) this.showStep(this.stepIdx + 1); else { this.playing = false; this.refreshUI(); }
  }
  prev() { if (this.mode === 'lab') return this.labStep(this.lab.step - 1); if (this.journey) this.showStep(this.stepIdx - 1); }
  togglePlay() { if (this.mode !== 'journey' && this.mode !== 'lab') return; this.playing = !this.playing; this.stepT = 0; if (this.playing && this.spoken) this.spokenAt = 0; this.refreshUI(); }

  // narration: the recorded teacher voice for this id in the current language, else the device voice
  narrate(id, text) {
    const l = this.lang;
    const url = hasAudio(id, l) ? `./audio/${l}/${id}.mp3` : null;
    const token = (this.speakToken = (this.speakToken || 0) + 1);
    this.spoken = false; this.spokenAt = null; this.spokeOK = false;
    this.audio.narrate(url, text, l).then((ok) => { if (token === this.speakToken) { this.spoken = true; this.spokeOK = ok; } });
  }
  speakPart(pid) { const p = partInfo(pid, this.lang); if (p) this.narrate('part-' + p.id, `${p.name}. ${tx(T.fnLabel, this.lang)}: ${p.job} ${tx(T.howLabel, this.lang)}: ${p.process}`); }
  infoText(p) { return `${p.alt && p.alt !== p.name ? p.alt + '\n' : ''}${tx(T.fnLabel, this.lang)}: ${p.job}\n${tx(T.howLabel, this.lang)}: ${p.hasProcess ? p.process : p.detail}`; }
  replay() {
    if (this.mode === 'journey' && this.step) this.narrate(this.step.id, tx(this.step.title, this.lang) + '. ' + tx(this.step.text, this.lang));
    else if (this.mode === 'lab') { if (this.labSel) this.speakPart(this.labSel); else this.speakLabStep(); }
    else if (this.sel) this.speakPart(this.sel.pid);
    else if (this.selPiece) this.speakPart(this.selPiece.userData.cid);
  }

  // ---- body parts
  clearSel() {
    this.body.state.clearBit(8); this.body.state.clearBit(4); this.removePickLabel();
    if (this.sel && this.mode !== 'journey') { this.body.focus([]); this.setSkin(1); }
    this.sel = null;
  }
  selectPart(pid, opts = {}) {
    const oids = this.body.partObjs[pid];
    if (!oids || !partInfo(pid, this.lang)) return;
    if (this.mode !== 'explore' && this.mode !== 'part' && (this.mode !== 'journey' || opts.from === 'list')) this.explore();
    if (this.mode === 'explore') this.mode = 'part';
    this.body.state.clearBit(8); this.body.state.clearBit(4);
    const tint = new THREE.Color('#ffc65c');
    for (const o of oids) this.body.state.set(o, this.body.state.flags(o) | 12, tint);
    const pm = this.partMeta[pid];
    const group = this.body.objects[oids[0]].group;
    this.ensureVisible(group);
    if (this.isolated && this.isolated !== pid) this.isolate(pid);
    const center = pm ? V3(pm.center) : this.anchorFor(group);
    const size = pm ? Math.max(pm.max[0] - pm.min[0], pm.max[1] - pm.min[1], pm.max[2] - pm.min[2]) : 0.2;
    this.sel = { pid, group, center, size, point: opts.point ? opts.point.clone() : this.anchorOnPart(pid, center) };
    this.makePickLabel();
    if (opts.from === 'list' && this.mode !== 'journey') { this.body.focus([group], 0.1); this.setSkin(0.4); }
    if (opts.from === 'list' || opts.zoom) this.focusSel();
    if (this.mode !== 'journey') this.speakPart(pid);
    this.refreshUI();
  }
  // a point on the part's surface to hang the label on
  anchorOnPart(pid, center) {
    const oids = this.body.partObjs[pid] || []; if (!oids.length) return center.clone();
    const g = this.body.objects[oids[0]].group; const mesh = this.body.parts[g];
    const tri = this.body.triIndex(g); if (!tri) return center.clone();
    const idx = mesh.geometry.index.array, P = mesh.geometry.attributes.position.array;
    let best = null, bd = 1e9; const v = new THREE.Vector3();
    for (const o of oids) { const l = tri.get(o); if (!l) continue; const step = Math.max(3, ((l.length / 60) | 0) * 3); for (let k = 0; k < l.length; k += step) { const i = idx[l[k]] * 3; v.set(P[i], P[i + 1], P[i + 2]); const d = Math.hypot(v.x - center.x, v.y - center.y) * 2 - v.z; if (d < bd) { bd = d; best = v.clone(); } } }
    return best || center.clone();
  }
  ensureVisible(group) {
    const mesh = this.body.parts[group]; if (!mesh || mesh.visible) return;
    const layer = Object.entries(LAYERS).find(([, l]) => l.includes(group));
    if (layer) { if (layer[0] === 'muscles') this.body.layerOn.muscles = true; else this.body.layerOn[layer[0]] = true; }
    if (FINE.includes(group)) this.fine = true;
    this.applyLayers();
  }
  focusSel() {
    const s = this.sel; if (!s) return;
    if (this.inXR()) { this.zoom.show([s.group], s.center, THREE.MathUtils.clamp(s.size * 0.75, 0.04, 0.45)); this.zoom.setLabels([s.pid], this.lang, partInfo, () => s.point); }
    else { this.stepView = { at: s.center.clone(), z: THREE.MathUtils.clamp(0.75 / Math.max(s.size, 0.05), 1, 9), side: s.center.x > 0.05 ? 0.5 : s.center.x < -0.05 ? -0.5 : 0 }; this.goView(false); }
  }
  // show only this part (everything else hidden, faint skin outline stays)
  isolate(pid) {
    const keep = new Set(this.body.partObjs[pid] || []);
    const st = this.body.state;
    this.body.objects.forEach((o, i) => st.bit(i, 1, !keep.has(i) && o.group !== 'skin'));
    this.isolated = pid;
    this.flows.set([]); this.tracer.stop();
  }
  showAll(quiet) { if (!this.isolated && quiet) return; this.body.state.clearBit(1); this.isolated = null; if (!quiet) this.refreshUI(); }
  labFor(pid) {
    const g = this.body.partObjs[pid] ? this.body.objects[this.body.partObjs[pid][0]].group : null;
    for (const [lab, gs] of Object.entries(LAB_GROUPS)) if ((g && gs.includes(g)) || (LAB_PARTS[lab] || []).includes(pid)) return lab;
    return null;
  }

  // ---- Organ Lab
  async openLab(id, step = 0, play = true) {
    if (!LABS[id]) return;
    this.leave(); this.mode = 'lab'; this.labId = id; this.labSel = null;
    this.bodyRoot.visible = false;
    this.refreshUI();
    const ok = await this.lab.open(id);
    if (!ok || this.mode !== 'lab' || this.labId !== id) return;
    this.placeLab();
    this.playing = play;
    this.labStep(step);
    if (this.vrui) { this.vrui.page = 'labparts'; this.vrui.pp = 0; }
  }
  placeLab() {
    if (this.inXR() && this.museum) { const p = this.exhibitPos(); this.lab.group.position.set(p.x, 1.15, p.z); this.lab.group.rotation.set(0, 0, 0); this.lab.group.scale.setScalar(this.vrLabScale * 2); }
    else if (this.inXR()) { this.lab.group.position.set(0, Math.max(0.95, this.eye - 0.2), -0.8); this.lab.group.rotation.set(0, 0, 0); this.lab.group.scale.setScalar(this.vrLabScale); }
    else { this.lab.group.position.set(0, 1.12, 0); this.lab.group.scale.setScalar(1); this.stepView = { at: new THREE.Vector3(0, 1.14, 0), z: 1.55, side: 0, lab: true }; this.goView(false); }
    this.lab.labelMul = this.inXR() ? (this.museum ? 0.9 : 1.15) : 2.1; this.lab.buildLabels(); this.placeFloor();
  }
  labStep(i) {
    if (this.mode !== 'lab' || !this.lab.L) return;
    const n = this.lab.def.n; if (i >= n) { this.playing = false; this.refreshUI(); return; }
    this.lab.showStep(i); this.labSel = null; this.lab.pickLabel(null);
    this.stepT = 0;
    this.audio.chime();
    this.speakLabStep();
    this.refreshUI();
  }
  labStepText() { const s = C.steps[this.lab.stepId()]; return s ? { title: tx(s.title, this.lang), text: tx(s.text, this.lang) } : { title: tx(this.lab.def.title, this.lang), text: '' }; }
  speakLabStep() { const s = this.labStepText(); this.narrate(this.lab.stepId(), s.title + '. ' + s.text); }
  selectLabPart(pid, point) {
    if (!partInfo(pid, this.lang)) return;
    this.labSel = pid; this.lab.select(pid); this.lab.pickLabel(pid, point || this.lab.anchor(pid));
    this.playing = false; this.speakPart(pid); this.refreshUI();
  }

  // ---- take apart / put back
  startDismantle(set, apart = true) {
    this.leave(); this.mode = 'dismantle';
    this.dis.explode(set, apart);
    this.hideGroups(this.dis.groupsOf(set));
    this.anim.reset(); this.anim.set([]);
    this.setSkin(set === 'bones' ? 0.25 : 0.18);
    if (set === 'organs') { this.layerOverride = new Set(['skeleton', 'skin']); } else this.layerOverride = new Set(['skin']);
    this.applyLayers(); this.hideGroups(this.dis.groupsOf(set));
    this.ghostSkeleton(set === 'organs');
    this.stepView = apart ? { at: new THREE.Vector3(0, set === 'bones' ? 0.92 : 1.2, 0.15), z: set === 'bones' ? 0.82 : 1.08, side: 0 } : { at: new THREE.Vector3(0, set === 'bones' ? 0.95 : 1.2, 0.05), z: set === 'bones' ? 0.95 : 1.45, side: 0 };
    this.goView(false);
    this.audio.chime();
    if (apart) this.narrate('ui-dismantle', tx(T.dismantleHint, this.lang)); else this.narrate('ui-together', tx(T.togetherHint, this.lang));
    this.refreshUI();
  }
  startGame(set) {
    this.leave(); this.mode = 'game';
    const n = this.dis.build(set).length;
    const tray = (i, total) => {
      const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), cols = set === 'bones' ? 3 : 2;
      const col = k % cols, row = Math.floor(k / cols), rows = Math.ceil(Math.ceil(total / 2) / cols);
      const top = set === 'bones' ? 1.62 : 1.55, step = Math.min(0.26, (top - 0.45) / Math.max(1, rows - 1));
      return new THREE.Vector3(side * (0.42 + col * 0.25), top - row * step, 0.22 + col * 0.05);
    };
    this.dis.game(set, tray);
    this.anim.reset(); this.anim.set([]);
    this.layerOverride = new Set(set === 'organs' ? ['skin', 'skeleton'] : ['skin']);
    this.applyLayers(); this.hideGroups(this.dis.groupsOf(set));
    this.ghostSkeleton(set === 'organs');
    this.setSkin(0.35);
    this.stepView = { at: new THREE.Vector3(0, 1.02, 0.2), z: 0.72, side: 0 };
    this.goView(false);
    this.feedback = tx(this.inXR() ? T.assembleVR : T.assembleDesk, this.lang);
    this.audio.chime();
    this.narrate('ui-assemble', tx(T.assembleHint, this.lang));
    this.refreshUI();
    return n;
  }
  hideGroups(gs) { this.hiddenGroups = gs; for (const g of gs) if (this.body.parts[g]) this.body.parts[g].visible = false; }
  restoreGroups() { this.hiddenGroups = null; this.ghostSkeleton(false); this.applyLayers(); }
  ghostSkeleton(on) {
    for (const g of LAYERS.skeleton) {
      const m = this.body.parts[g]; if (!m) continue; const mat = m.material;
      if (on) { mat.transparent = true; mat.opacity = 0.16; mat.depthWrite = false; m.renderOrder = 4; }
      else { mat.opacity = mat.userData.baseOpacity ?? 1; mat.transparent = mat.opacity < 1; mat.depthWrite = !mat.transparent; m.renderOrder = 0; }
      mat.needsUpdate = true;
    }
  }
  selectPiece(p) {
    this.selPiece = p; if (!p) { this.refreshUI(); return; }
    this.speakPart(p.userData.cid); this.refreshUI();
  }
  holding(p) { const info = partInfo(p.userData.cid, this.lang); if (info) { this.feedback = `✋ ${info.name} — ${info.job}`; this.refreshUI(); } }
  onDrop(res) {
    if (res === 'placed') {
      const p = this.lastHeld; const info = p && partInfo(p.userData.cid, this.lang);
      this.audio.chime();
      if (this.dis.done()) { this.feedback = tx(T.wellDone, this.lang); this.narrate('ui-welldone', this.feedback); this.confetti(); }
      else if (info) { this.feedback = `✓ ${info.name} — ${info.job}`; this.narrate('part-' + info.id, info.name + '. ' + info.job); }
    } else if (res === 'miss') { this.feedback = tx(T.tryAgain, this.lang); }
    this.refreshUI();
  }
  confetti() {
    const n = 300, g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const cs = ['#ffd84d', '#ff6f91', '#7fd1ff', '#9fd17a', '#f0a65a'].map((c) => new THREE.Color(c));
    this.conf = [];
    for (let i = 0; i < n; i++) { const c = cs[i % cs.length]; col.set([c.r, c.g, c.b], i * 3); this.conf.push({ p: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.9, (Math.random() - 0.5) * 0.4), v: new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 1.5, (Math.random() - 0.5) * 1.6) }); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (this.confPts) this.bodyRoot.remove(this.confPts);
    this.confPts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.025, vertexColors: true, transparent: true })); this.confT = 0;
    this.bodyRoot.add(this.confPts);
  }

  // ------------------------------------------------------------ looks
  applyStepLook() {
    if (this.mode !== 'journey') return;
    const s = this.step;
    const focus = s ? s.focus || [] : [];
    this.body.focus(focus, 0.07);
    const ghost = new Set(s ? s.ghost || [] : []);
    const fl = s ? s.flows || [] : [];
    if (fl.some((f) => f.startsWith('blood') || f === 'renal_blood' || f === 'glucose_body')) ['arteries', 'veins', 'pulm_arteries', 'pulm_veins', 'arteries_minor', 'veins_minor'].forEach((g) => ghost.add(g));
    if (fl.includes('coronary_flow')) ['coronary', 'cardiac_veins'].forEach((g) => ghost.add(g));
    if (fl.some((f) => f.startsWith('air'))) ['trachea', 'bronchi', 'nasal_cavity', 'pharynx', 'larynx'].forEach((g) => ghost.add(g));
    if (fl.some((f) => f.startsWith('chyme') || f === 'urine' || f === 'urine_out' || f === 'bile' || f === 'pancreatic')) ['duodenum', 'small_intestine', 'stomach', 'ureters', 'urethra', 'bile_ducts', 'bladder', 'gallbladder'].forEach((g) => ghost.add(g));
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
    const b = this.body, ov = this.layerOverride;
    for (const [name, mesh] of Object.entries(b.parts)) {
      let vis = false;
      for (const [k, list] of Object.entries(LAYERS)) {
        if (!list.includes(name)) continue;
        let on = b.layerOn[k];
        if (ov) on = ov.has(k);
        if (k === 'muscles') on = (b.layerOn.muscles && !ov) || !!this.musclesStep || (ov && ov.has('muscles'));
        if (on) vis = true;
      }
      if (FINE.includes(name)) vis = vis && (this.fine || !!this.fineStep);
      if (this.hiddenGroups && this.hiddenGroups.includes(name)) vis = false;
      mesh.visible = vis;
    }
  }
  toggleLayer(k) { this.body.layerOn[k] = !this.body.layerOn[k]; this.applyLayers(); this.refreshUI(); }
  toggleFine() { this.fine = !this.fine; this.applyLayers(); this.refreshUI(); }

  // ------------------------------------------------------------ views
  goView(instant) {
    const v = this.stepView; if (!v) return;
    if (this.inXR()) { this.vrStepView(); return; }
    const showMag = this.magOn();
    const aspect = innerWidth / innerHeight;
    let dist = 3.0 / v.z * (aspect < 1 ? 1.25 / Math.max(aspect, 0.5) : 1);
    const cardH = (document.getElementById('story')?.getBoundingClientRect().height || 0) + 90;
    const free = THREE.MathUtils.clamp((innerHeight - cardH) / innerHeight, 0.4, 1);
    dist *= Math.max(1, 0.86 / free);
    if (showMag && !v.lab) dist *= aspect < 1 ? 1.45 : 1.35;
    const dir = new THREE.Vector3(Math.sin(v.side), 0.1, Math.cos(v.side)).normalize();
    const target = v.at.clone();
    const right = new THREE.Vector3(Math.cos(v.side), 0, -Math.sin(v.side));
    const magR = (aspect < 1 ? 0.085 : 0.115) * dist, magOff = (aspect < 1 ? 0.15 : 0.3) * dist;
    if (showMag && !v.lab) {
      const mp = aspect < 1 ? v.at.clone().add(new THREE.Vector3(0, magOff, 0)) : v.at.clone().addScaledVector(right, magOff).add(new THREE.Vector3(0, -0.3 * magR, 0));
      this.placeMag(mp, magR, v.at);
      target.lerp(mp, 0.48);
    }
    const pos = target.clone().addScaledVector(dir, dist);
    this.labelK = dist * (innerWidth < 900 ? 1.25 : 0.95);
    this.relabel();
    if (instant) { this.camera.position.copy(pos); this.controls.target.copy(target); this.camTween = null; }
    else this.camTween = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: pos, t1: target, t: 0 };
  }
  magOn() { return !!(this.mode === 'journey' && this.step && this.step.micro); }
  placeMag(p, radius, organ) { this.mag.group.position.copy(p); this.mag.group.scale.setScalar(radius / 1.28); this.mag.connectorFrom = organ; }
  labelScale() { return this.inXR() ? 1.5 / this.vrBody.scale : (this.labelK || 1); }

  // VR: the body stays where it is; close views open in the close-up stand instead
  vrStepView() {
    const v = this.stepView;
    this.labelK = 1.5 / this.vrBody.scale; this.relabel();
    if (this.mode === 'journey' && v && v.z > 1.3) {
      const r = THREE.MathUtils.clamp(0.95 / v.z, 0.06, 0.5);
      const s = this.step; let groups = [...new Set([...(s.focus || []), ...(s.ghost || [])])];
      if (!groups.length) groups = this.groupsNear(v.at, r);
      groups = groups.filter((g) => this.body.parts[g] && this.body.parts[g].visible);
      this.zoom.show(groups, v.at, r);
      this.zoom.setLabels(s.labels || [], this.lang, partInfo, (p) => this.anchorFor(p));
    } else if (this.mode === 'journey') this.zoom.hide();
    // micro scene: fixed spot left of the body
    if (this.magOn()) { this.mag.group.position.set(-0.4, Math.max(0.9, this.eye - 0.05), -0.95); this.mag.group.scale.setScalar(0.15 / 1.28); }
  }
  groupsNear(c, r) {
    const out = [];
    for (const [g, m] of Object.entries(this.meta)) {
      const dx = Math.max(m.min[0] - c.x, 0, c.x - m.max[0]), dy = Math.max(m.min[1] - c.y, 0, c.y - m.max[1]), dz = Math.max(m.min[2] - c.z, 0, c.z - m.max[2]);
      if (Math.hypot(dx, dy, dz) < r && g !== 'skin' && g !== 'muscles') out.push(g);
    }
    return out;
  }
  captureStage() {
    const head = this.headPose();
    this.world.position.set(head.pos.x, 0, head.pos.z);
    this.world.rotation.set(0, Math.atan2(-head.dir.x, -head.dir.z), 0);
    this.eye = THREE.MathUtils.clamp(head.pos.y, 1.0, 1.9);
    this.vrui.layout(this.eye);
    this.zoom.group.position.set(0.3, this.eye + 0.1, -1.05);
    this.zoom.group.rotation.set(-0.08, Math.atan2(-0.3, 1.05), 0, 'YXZ');
    this.applyVRBody();
    if (this.mode === 'lab') this.placeLab();
  }
  // zoom in / out: VR scales the model about what is being looked at; desktop moves the camera
  zoomBy(f) {
    if (!this.inXR()) {
      const c = this.controls, off = this.camera.position.clone().sub(c.target);
      const d = THREE.MathUtils.clamp(off.length() / f, c.minDistance, c.maxDistance);
      this.camTween = null; this.camera.position.copy(c.target).add(off.setLength(d)); return;
    }
    if (this.mode === 'lab') { this.vrLabScale = THREE.MathUtils.clamp(this.vrLabScale * f, 0.4, 4); this.placeLab(); return; }
    this.scaleBody(this.vrBody.scale * f);
  }
  scaleBody(s) {
    const b = this.vrBody; s = THREE.MathUtils.clamp(s, 0.4, 5);
    b.off.addScaledVector(this.zoomPivot(), b.scale - s); b.scale = s;
    if (Math.abs(s - 1) < 0.02) { b.scale = 1; b.off.set(0, 0, 0); }
    this.applyVRBody();
  }
  zoomPivot() { return this.sel ? this.sel.center.clone() : this.stepView && this.mode === 'journey' ? this.stepView.at.clone() : new THREE.Vector3(0, 1.15, 0); }
  exhibitPos() { return this.inXR() && this.museum ? new THREE.Vector3(0, 0, -1.8) : this.inXR() ? new THREE.Vector3(0, 0, BODY_Z) : new THREE.Vector3(); }
  applyVRBody() {
    const b = this.vrBody;
    // b.off keeps the zoomed point in place (it only changes when zooming, never on a click)
    const piv = b.off.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), b.yaw);
    this.bodyRoot.position.copy(this.museum ? this.exhibitPos() : b.pos).add(piv); this.bodyRoot.rotation.set(0, b.yaw, 0); this.bodyRoot.scale.setScalar(b.scale);
    this.labelK = 1.5 / b.scale; this.relabel();
    this.placeFloor();
  }
  // DUET STEM floor logo and museum platform stay fixed in the room
  placeFloor() {
    const p = this.exhibitPos();
    this.bodyFloor.position.set(p.x, 0, p.z);
    this.museumSet.position.set(p.x, 0, p.z); this.museumSet.visible = this.inXR() && this.museum;
    this.bodyFloor.visible = !(this.mode === 'lab' && !this.inXR());
  }
  toggleMuseum() {
    this.museum = !this.museum; this.uiFollow = null;
    if (!this.museum) { this.vrui.group.position.set(0, 0, 0); this.vrui.group.rotation.set(0, 0, 0); }
    if (this.inXR()) { this.applyVRBody(); if (this.mode === 'lab') this.placeLab(); }
    if (this.museum) this.narrate('ui-museum', tx(T.museumHint, this.lang));
    this.refreshUI();
  }
  // museum: step around the exhibit (for users who cannot walk)
  orbit(dir) {
    const P = this.world.localToWorld(this.exhibitPos().setY(0));
    const d = dir * Math.PI / 6;
    this.world.position.sub(P).applyAxisAngle(new THREE.Vector3(0, 1, 0), d).add(P);
    this.world.rotation.y += d;
  }
  // museum: the menu panels follow the user as they walk around
  followUI(dt) {
    const hp = this.headPose(); const lp = this.world.worldToLocal(hp.pos.clone()); lp.y = 0;
    const yaw = Math.atan2(-hp.dir.x, -hp.dir.z) - this.world.rotation.y;
    const g = this.vrui.group;
    if (!this.uiFollow) { this.uiFollow = { pos: lp.clone(), yaw }; g.position.copy(lp); g.rotation.set(0, yaw, 0); return; }
    const f = this.uiFollow; let dy = Math.atan2(Math.sin(yaw - f.yaw), Math.cos(yaw - f.yaw));
    if (lp.distanceTo(f.pos) > 0.45 || Math.abs(dy) > 0.75) { f.pos.copy(lp); f.yaw = yaw; }
    const k = Math.min(1, dt * 2.2);
    g.position.lerp(f.pos, k);
    dy = Math.atan2(Math.sin(f.yaw - g.rotation.y), Math.cos(f.yaw - g.rotation.y)); g.rotation.y += dy * k;
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
  viewCamera() { return this.inXR() ? this.renderer.xr.getCamera() : this.camera; }

  // ------------------------------------------------------------ labels
  clearLabels() { this.labelGroup.clear(); this.stepLabels = []; }
  buildStepLabels(parts) {
    this.clearLabels();
    const L = this.lang;
    parts.forEach((p, i) => {
      const info = partInfo(p, L); if (!info) return;
      const a = this.anchorFor(p);
      const side = a.x >= 0.004 ? 1 : a.x <= -0.004 ? -1 : (i % 2 ? 1 : -1);
      const off = new THREE.Vector3(side * 0.05, 0.035 + (i % 2) * 0.015, 0.02);
      const lb = new Label([info.name, info.alt], { height: 0.03, offset: off, cx: side > 0 ? 0 : 1, cy: 0.5, small: 22 });
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
    if (this.partMeta[p] && !this.meta[p]) return this.anchorOnPart(p, V3(this.partMeta[p].center));
    const m = this.meta[p], mesh = this.body.parts[p];
    if (m && mesh) {
      const c = V3(m.center);
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
    for (const side of [1, -1]) {
      const g = labs.filter((l) => Math.sign(l.offset.x) === side).sort((a, b) => b.position.y - a.position.y);
      let lastY = Infinity;
      for (const l of g) {
        const h = l.height * k * 1.25;
        let y = l.position.y + l.baseOffY * k;
        if (y > lastY - h) y = lastY - h;
        l.offset.y = (y - l.position.y) / k; lastY = y;
      }
    }
    for (const l of labs) l.setScale(k);
    if (this.pickLabel) this.pickLabel.setScale(k);
  }
  makePickLabel() {
    this.removePickLabel();
    const s = this.sel; const info = s && partInfo(s.pid, this.lang); if (!info) return;
    const lb = new Label([info.name, info.alt], { height: 0.034, offset: new THREE.Vector3(0.04, 0.05, 0.02), cx: 0, cy: 0.5, small: 22, border: 'rgba(255,214,140,0.8)' });
    lb.position.copy(s.point); lb.setScale(this.labelScale());
    this.bodyRoot.add(lb); this.pickLabel = lb;
  }
  removePickLabel() { if (this.pickLabel) { this.bodyRoot.remove(this.pickLabel); this.pickLabel.dispose(); this.pickLabel = null; } }

  // ------------------------------------------------------------ picking
  pickBody(rc) {
    const meshes = Object.values(this.body.parts).filter((m) => m.visible && (m.material.isShaderMaterial ? m.material.uniforms.uOpacity.value > 0.3 : m.material.opacity > 0.15));
    const hits = rc.intersectObjects(meshes, false);
    let skin = null;
    for (const h of hits) {
      const g = h.object.userData.part;
      const oid = this.body.oidAtHit(h);
      if (oid >= 0 && (this.body.state.flags(oid) & 3)) continue;
      if (g === 'skin') { skin ||= { h, oid }; continue; }
      const pid = oid >= 0 ? this.body.objects[oid].part : g;
      return { hit: h, pid, point: this.bodyRoot.worldToLocal(h.point.clone()) };
    }
    if (skin && skin.oid >= 0 && this.body.layerOn.skin) return { hit: skin.h, pid: this.body.objects[skin.oid].part, point: this.bodyRoot.worldToLocal(skin.h.point.clone()) };
    return null;
  }
  // one click / trigger press, in any mode
  pointAt(rc) {
    if (this.mode === 'lab') { const h = this.lab.pick(rc); if (h) this.selectLabPart(h.pid, h.point); return; }
    if (this.mode === 'dismantle') { const h = this.dis.pick(rc); this.selectPiece(h ? h.piece : null); return; }
    if (this.mode === 'game') return;
    const h = this.pickBody(rc);
    if (h) this.selectPart(h.pid, { point: h.point });
  }
  setHover(pid) {
    if (pid === this.hoverPid) return;
    this.body.state.clearBit(16);
    this.hoverPid = pid;
    if (pid) for (const o of this.body.partObjs[pid] || []) this.body.state.bit(o, 16, true);
  }

  // ------------------------------------------------------------ XR
  setupXR() {
    const r = this.renderer;
    this.controllers = [];
    const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    for (let i = 0; i < 2; i++) {
      const c = r.xr.getController(i);
      const line = new THREE.Line(rayGeo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55 }));
      line.scale.z = 2.5; line.name = 'ray';
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); tip.name = 'tip';
      c.add(line, tip);
      c.addEventListener('connected', (e) => { c.userData.src = e.data; line.visible = e.data.targetRayMode !== 'gaze'; });
      c.addEventListener('disconnected', () => { c.userData.src = null; });
      c.addEventListener('selectstart', () => this.onSelect(c));
      c.addEventListener('selectend', () => this.onSelectEnd(c));
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
    const ok = await this.enterXR(this.appMode === 'ar' ? 'immersive-ar' : 'immersive-vr', true);
    if (!ok) document.body.classList.add('app-xr-wait');
  }
  async enterXR(mode, quiet) {
    this.audio.unlock();
    document.body.classList.remove('app-xr-wait');
    if (!navigator.xr) { if (!quiet) this.toast(tx(T.noXR, this.lang)); return false; }
    const ok = await navigator.xr.isSessionSupported(mode).catch(() => false);
    if (!ok) { if (!quiet) this.toast(tx(T.noXR, this.lang)); return false; }
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
    this.vrui.group.add(this.mag.group, this.zoom.group);
    this.vrBody = { yaw: 0, scale: 1, pos: new THREE.Vector3(0, 0, BODY_Z), off: new THREE.Vector3() }; this.uiFollow = null;
    setTimeout(() => {
      this.captureStage();
      this.vrui.group.visible = true; this.vrui.dirty = true;
      if (this.mode === 'game') this.feedback = tx(T.assembleVR, this.lang);
      this.goView(true);
      if (this.sel) this.makePickLabel();
    }, 300);
  }
  onXREnd() {
    if (this.appMode === 'vr' || this.appMode === 'ar') document.body.classList.add('app-xr-wait');
    this.scene.background = this.bg; this.sky.visible = true; this.floor.visible = true;
    this.vrui.group.visible = false; this.zoom.hide();
    this.world.position.set(0, 0, 0); this.world.rotation.set(0, 0, 0);
    this.bodyRoot.position.set(0, 0, 0); this.bodyRoot.rotation.set(0, 0, 0); this.bodyRoot.scale.setScalar(1);
    this.bodyRoot.add(this.mag.group); this.world.add(this.zoom.group);
    this.vrui.group.position.set(0, 0, 0); this.vrui.group.rotation.set(0, 0, 0); this.placeFloor();
    document.body.classList.remove('in-xr');
    if (this.mode === 'lab') this.placeLab(); else this.goView(true);
    if (this.sel) this.makePickLabel();
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
    if (ph) { const id = ph.object.userData.panel.hitUV(ph.uv); if (id) this.action(id); return; }
    if (this.mode === 'game') {
      const h = this.dis.pick(rc);
      if (h) { this.dis.grab(h.piece, h.point); this.lastHeld = h.piece; c.userData.drag = { dist: h.distance }; this.selPiece = h.piece; this.holding(h.piece); }
      return;
    }
    this.pointAt(rc);
  }
  onSelectEnd(c) {
    if (c.userData.drag) { c.userData.drag = null; this.onDrop(this.dis.release()); this.selPiece = null; }
  }
  grabStart(c) {
    if (this.mode === 'game') { this.onSelect(c); return; }
    c.userData.grab = { cpos: new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), pos: this.vrBody.pos.clone(), yaw: this.vrBody.yaw, cyaw: this.ctrlYaw(c), labYaw: this.lab.userYaw };
  }
  grabEnd(c) { if (c.userData.drag) this.onSelectEnd(c); c.userData.grab = null; }
  ctrlYaw(c) { const d = new THREE.Vector3(0, 0, -1).applyQuaternion(c.getWorldQuaternion(new THREE.Quaternion())); return Math.atan2(d.x, d.z); }
  xrInput(dt) {
    for (const c of this.controllers) {
      if (!c.userData.src) continue;
      const rc = this.rayFrom(c);
      const ph = rc.intersectObjects(this.vrui.panels(), false)[0];
      const ray = c.getObjectByName('ray'), tip = c.getObjectByName('tip');
      for (const P of this.vrui.allPanels()) {
        if (ph && ph.object.userData.panel === P) this.vrui.setHover(P, P.hitUV(ph.uv)); else if (!this.controllers.some((o) => o !== c && o.userData.hoverPanel === P)) this.vrui.setHover(P, null);
      }
      c.userData.hoverPanel = ph ? ph.object.userData.panel : null;
      if (ray) ray.scale.z = ph ? ph.distance : 2.5;
      if (tip) { tip.position.set(0, 0, -(ph ? ph.distance : 2.5)); tip.visible = !!ph; }
      // carrying a piece in the game
      if (c.userData.drag) { const p = rc.ray.origin.clone().addScaledVector(rc.ray.direction, c.userData.drag.dist); this.dis.moveTo(p); }
      // grip: move / turn the body or the lab model (the user's own action)
      const g = c.userData.grab;
      if (g) {
        const dy = this.ctrlYaw(c) - g.cyaw;
        if (this.mode === 'lab') this.lab.userYaw = g.labYaw - dy * 2;
        else {
          const d = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld).sub(g.cpos);
          const inv = new THREE.Quaternion().copy(this.world.quaternion).invert(); d.applyQuaternion(inv);
          this.vrBody.pos.copy(g.pos).add(d); this.vrBody.yaw = g.yaw + dy * 1.5; this.applyVRBody();
        }
      }
      const gp = c.userData.src && c.userData.src.gamepad;
      if (gp && gp.axes) {
        const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0], ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1];
        if (c.userData.drag) { if (Math.abs(ay) > 0.35) c.userData.drag.dist = THREE.MathUtils.clamp(c.userData.drag.dist - ay * dt * 0.8, 0.2, 3); }
        else if (this.museum) {
          if (Math.abs(ax) > 0.6 && Math.abs(ax) > Math.abs(ay) && !c.userData.snap) { this.orbit(ax > 0 ? -1 : 1); c.userData.snap = true; }
          if (Math.abs(ax) < 0.3) c.userData.snap = false;
        } else if (Math.abs(ay) > 0.7 && Math.abs(ax) < 0.3) {
          // clearly up = zoom in, clearly down = zoom out
          const f = Math.exp(-ay * dt * 0.8);
          if (this.mode === 'lab') { this.vrLabScale = THREE.MathUtils.clamp(this.vrLabScale * f, 0.4, 4); this.placeLab(); }
          else this.scaleBody(this.vrBody.scale * f);
        } else if (Math.abs(ax) > 0.3 && Math.abs(ax) > Math.abs(ay) * 1.5) {
          // left/right turns the model; up/down does nothing (size changes only with the Size buttons)
          if (this.mode === 'lab') this.lab.userYaw += ax * dt * 1.6;
          else { this.vrBody.yaw += ax * dt * 1.6; this.applyVRBody(); }
        }
        const bA = gp.buttons[4] && gp.buttons[4].pressed, bB = gp.buttons[5] && gp.buttons[5].pressed;
        if (bA && !c.userData.bA) this.next();
        if (bB && !c.userData.bB) this.prev();
        c.userData.bA = bA; c.userData.bB = bB;
      }
    }
    if (this.vrui.dirty) this.vrui.draw();
  }

  // ------------------------------------------------------------ actions (HTML and VR)
  action(id) {
    const V = this.vrui;
    if (id === 'explore') this.explore();
    else if (id.startsWith('j_')) this.startJourney(id.slice(2), 0, true);
    else if (id.startsWith('lab_')) this.openLab(id.slice(4), 0, true);
    else if (id.startsWith('lp_')) this.selectLabPart(id.slice(3));
    else if (id.startsWith('p_')) this.selectPart(id.slice(2), { from: 'list' });
    else if (id.startsWith('sys_')) { V.sys = id.slice(4); V.pp = 0; }
    else if (id === 'pp_next') V.pp++;
    else if (id === 'pp_prev') V.pp = Math.max(0, V.pp - 1);
    else if (id.startsWith('page_')) { V.page = id.slice(5); V.pp = 0; }
    else if (id === 'dis_organs' || id === 'dis_bones') this.startDismantle(id.slice(4));
    else if (id === 'all_organs') this.startDismantle('organs', false);
    else if (id === 'dis_toggle') { this.dis.setApart(!this.dis.apart); this.selPiece = null; }
    else if (id === 'apart_lab') { this.lab.setExploded(!this.lab.exploded); this.labSel = null; this.lab.pickLabel(null); this.playing = false; }
    else if (id === 'museum') this.toggleMuseum();
    else if (id === 'speed') { const S = [1, 2, 3, 5, 10]; this.speed = S[(S.indexOf(this.speed) + 1) % S.length]; this.audio.rate = Math.min(this.speed, 2); store.set('hb_speed', String(this.speed)); try { this.audio.na.playbackRate = this.audio.rate; } catch (e) {} }
    else if (id === 'zoom_in') this.zoomBy(1.25);
    else if (id === 'zoom_out') this.zoomBy(0.8);
    else if (id === 'spin') { this.controls.autoRotate = !this.controls.autoRotate; this.controls.autoRotateSpeed = 1.6; }
    else if (id === 'game_organs' || id === 'game_bones') this.startGame(id.slice(5));
    else if (id === 'restart') this.startGame(this.dis.set || 'organs');
    else if (id === 'hint') { const p = this.dis.hint(); if (p) { const info = partInfo(p.userData.cid, this.lang); this.feedback = `${tx(T.hint, this.lang)}: ${info ? info.name : ''}`; } }
    else if (id === 'recenter') { this.captureStage(); }
    else if (id === 'sfx') { this.audio.sfx = !this.audio.sfx; store.set('hb_sfx', this.audio.sfx ? '1' : '0'); }
    else if (id === 'replay') this.replay();
    else if (id === 'isolate') { if (this.sel) this.isolate(this.sel.pid); }
    else if (id === 'showall') this.showAll();
    else if (id === 'zoom') this.focusSel();
    else if (id === 'openlab') { const l = this.sel && this.labFor(this.sel.pid); if (l) this.openLab(l, 0, true); }
    else if (id === 'tour') { this.labSel = null; this.lab.select(null); this.lab.pickLabel(null); this.speakLabStep(); }
    else if (id === 'deselect') { this.clearSel(); if (this.mode === 'part') this.mode = 'explore'; this.zoom.hide(); this.audio.stopSpeech(); }
    else if (id.startsWith('l_')) { const k = id.slice(2); if (k === 'fine') this.toggleFine(); else this.toggleLayer(k); }
    else if (id.startsWith('lang_')) this.setLang(id.slice(5));
    else if (id === 'next') this.next();
    else if (id === 'prev') this.prev();
    else if (id === 'play') this.togglePlay();
    else if (id === 'voice') { this.audio.voice = !this.audio.voice; store.set('hb_voice', this.audio.voice ? '1' : '0'); if (!this.audio.voice) this.audio.stopSpeech(); else this.replay(); }
    else if (id === 'size_up') this.zoomBy(1.25);
    else if (id === 'size_dn') this.zoomBy(0.8);
    else if (id === 'save_all') this.saveAll();
    else if (id === 'exit') { const s = this.renderer.xr.getSession(); s && s.end(); }
    this.refreshUI();
  }
  setLang(l) {
    this.lang = l; store.set('hb_lang', l);
    document.documentElement.lang = l;
    this.mag.setLang(l); this.lab.setLang(l);
    if (this.mode === 'journey' && this.step) this.showStep(this.stepIdx);
    else if (this.mode === 'lab' && this.lab.L) { if (this.labSel) this.selectLabPart(this.labSel); else this.speakLabStep(); }
    else if (this.sel) { this.makePickLabel(); this.speakPart(this.sel.pid); if (this.zoom.active) this.focusSel(); }
    else if (this.mode === 'dismantle') { this.dis.makeLabels(); if (this.selPiece) this.speakPart(this.selPiece.userData.cid); }
    else if (this.mode === 'game') this.feedback = tx(this.inXR() ? T.assembleVR : T.assembleDesk, l);
    setTimeout(() => this.prefetchAudio([l]), 2000);
    this.buildHTML(); this.refreshUI();
  }

  // shared description of the story card (HTML and VR)
  storyModel() {
    const L = this.lang, t = (k) => tx(T[k], L) || k;
    const nav = [{ id: 'prev', label: '‹ ' + t('back') }, { id: 'play', label: this.playing ? '❚❚ ' + t('pause') : '▶ ' + t('play'), primary: true, active: this.playing }, { id: 'next', label: t('next') + ' ›' }, { id: 'speed', label: `${t('speed')} ${this.speed}×` }];
    if (this.mode === 'journey' && this.step) {
      const j = this.journey, s = this.step;
      return { kicker: `${tx(j.title, L)} · ${t('step')} ${this.stepIdx + 1} ${t('of')} ${j.steps.length}`, color: SYSTEMS[j.sys].color, title: tx(s.title, L), text: tx(s.text, L),
        dots: { n: j.steps.length, i: this.stepIdx }, progress: this.playing ? this.autoFrac || 0 : null, buttons: nav, buttons2: [{ id: 'replay', label: t('listen') }, { id: 'explore', label: t('explore') }] };
    }
    if (this.mode === 'lab') {
      const d = LABS[this.labId]; const head = `${t('labs')} · ${tx(d.title, L)}`;
      if (!this.lab.L) return { kicker: head, color: d.color, title: tx(d.title, L), text: '…' };
      const apart = { id: 'apart_lab', label: this.lab.exploded ? t('together') : t('dismantle'), active: this.lab.exploded };
      if (this.labSel) { const p = partInfo(this.labSel, L); return { kicker: head, color: d.color, title: p.name, text: this.infoText(p), dots: { n: d.n, i: this.lab.step }, buttons: nav, buttons2: [{ id: 'replay', label: t('listen') }, apart, { id: 'tour', label: t('tour') }, { id: 'explore', label: t('home') }] }; }
      if (this.lab.exploded) return { kicker: `${head} · ${t('dismantle')}`, color: d.color, title: tx(d.title, L), text: t('labApartHint'), buttons: nav, buttons2: [apart, { id: 'explore', label: t('home') }] };
      const s = this.labStepText();
      return { kicker: `${head} · ${t('step')} ${this.lab.step + 1} ${t('of')} ${d.n}`, color: d.color, title: s.title, text: s.text, dots: { n: d.n, i: this.lab.step }, progress: this.playing ? this.autoFrac || 0 : null, buttons: nav, buttons2: [{ id: 'replay', label: t('listen') }, apart, { id: 'explore', label: t('home') }] };
    }
    if (this.mode === 'dismantle') {
      const p = this.selPiece && partInfo(this.selPiece.userData.cid, L);
      return { kicker: `${t(this.dis.apart ? 'dismantle' : 'allOrgans')} · ${t(this.dis.set === 'bones' ? 'bonesSet' : 'organsSet')}`, color: '#f0a65a', title: p ? p.name : t(this.dis.apart ? 'dismantle' : 'allOrgans'), text: p ? this.infoText(p) : t(this.dis.apart ? 'dismantleHint' : 'togetherHint'),
        buttons: [{ id: 'dis_toggle', label: this.dis.apart ? t('together') : t('dismantle'), primary: true }, { id: 'game_' + this.dis.set, label: t('assemble') }, { id: 'explore', label: t('home') }], buttons2: p ? [{ id: 'replay', label: t('listen') }] : [] };
    }
    if (this.mode === 'game') {
      return { kicker: `${t('assemble')} · ${t(this.dis.set === 'bones' ? 'bonesSet' : 'organsSet')}`, color: '#9fd17a', title: `${this.dis.placed} / ${this.dis.total()} ${t('placed')}`, text: this.feedback || t('assembleHint'),
        buttons: [{ id: 'hint', label: t('hint'), primary: true }, { id: 'restart', label: t('restart') }, { id: 'explore', label: t('home') }] };
    }
    if (this.sel) {
      const p = partInfo(this.sel.pid, L); const sys = C.parts[p.id] && C.parts[p.id].sys; const lab = this.labFor(this.sel.pid);
      const b = [{ id: 'replay', label: t('listen') }, this.isolated ? { id: 'showall', label: t('showAll') } : { id: 'isolate', label: t('isolate') }, { id: 'zoom', label: t('zoomIn') }];
      const b2 = []; if (lab) b2.push({ id: 'openlab', label: t('openLab'), primary: true }); b2.push({ id: 'deselect', label: '✕' });
      return { kicker: `${t('organs')}${sys && SYSTEMS[sys] ? ' · ' + tx(SYSTEMS[sys], L) : ''}`, color: sys && SYSTEMS[sys] ? SYSTEMS[sys].color : '#d9d2c3', title: p.name, text: this.infoText(p), buttons: b, buttons2: b2 };
    }
    return { kicker: t('explore'), color: '#d9d2c3', title: t('title'), text: t('exploreHint') + ' ' + t('pickOrgan'), buttons: [] };
  }

  // ------------------------------------------------------------ HTML UI
  buildHTML() {
    const L = this.lang;
    document.documentElement.lang = L;
    $('#title').textContent = tx(T.title, L);
    for (const l of LANGS) $('#lang-' + l).classList.toggle('on', L === l);
    const narrow = innerWidth < 520; $('#btn-vr').textContent = narrow ? 'VR' : tx(T.enterVR, L); $('#btn-ar').textContent = narrow ? 'AR' : tx(T.enterAR, L);
    $('#jlabel').textContent = tx(T.journeys, L); $('#llabel').textContent = tx(T.layers, L);
    $('#lablabel').textContent = tx(T.labs, L); $('#dislabel').textContent = tx(T.dismantle, L); $('#gamelabel').textContent = tx(T.assemble, L);
    const jl = $('#journeys'); jl.innerHTML = '';
    const mk = (parent, cls, id, title, color, on) => {
      const b = document.createElement('button'); b.className = cls; b.dataset.id = id; b.style.setProperty('--c', color);
      b.innerHTML = `<span class="ji"></span><span>${title}</span>`;
      b.onclick = () => { this.audio.unlock(); this.action(id); if (innerWidth < 900) document.body.classList.remove('panels-open'); };
      parent.appendChild(b); return b;
    };
    mk(jl, 'jbtn', 'explore', tx(T.explore, L), '#d9d2c3');
    for (const j of JOURNEYS) mk(jl, 'jbtn', 'j_' + j.id, tx(j.title, L), SYSTEMS[j.sys].color);
    const lg = $('#labs'); lg.innerHTML = '';
    for (const id of LAB_IDS) mk(lg, 'tbtn', 'lab_' + id, tx(LABS[id].title, L), LABS[id].color);
    const dg = $('#dis'); dg.innerHTML = '';
    mk(dg, 'tbtn', 'dis_organs', tx(T.organsSet, L), '#f0a65a'); mk(dg, 'tbtn', 'dis_bones', tx(T.bonesSet, L), '#e9dfc9');
    const ao = mk(dg, 'tbtn', 'all_organs', tx(T.allOrgans, L), '#7fd1c7'); ao.style.gridColumn = '1 / span 2';
    const gg = $('#game'); gg.innerHTML = '';
    mk(gg, 'tbtn', 'game_organs', tx(T.organsSet, L), '#9fd17a'); mk(gg, 'tbtn', 'game_bones', tx(T.bonesSet, L), '#e9dfc9');
    const ll = $('#layers'); ll.innerHTML = '';
    for (const k of ['skin', 'skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous', 'senses', 'endocrine', 'lymphatic', 'fine']) {
      const b = document.createElement('button'); b.className = 'lbtn'; b.dataset.id = k;
      b.style.setProperty('--c', k === 'fine' ? '#e0414b' : SYSTEMS[k].color);
      b.innerHTML = `<i></i><span>${k === 'fine' ? tx(T.fine, L) : tx(SYSTEMS[k], L)}</span>`;
      b.onclick = () => this.action('l_' + k);
      ll.appendChild(b);
    }
    $('#olabel').textContent = tx(T.organs, L); $('#btn-organs').textContent = tx(T.organs, L);
    $('#psearch').placeholder = L === 'en' ? 'Search…' : L === 'hi' ? 'खोजें…' : 'Search karo…';
    $('#btn-save').textContent = tx(T.saveAll, L);
    this.buildPartList();
  }
  buildPartList() {
    const L = this.lang, q = ($('#psearch').value || '').trim().toLowerCase();
    const ol = $('#organs'); ol.innerHTML = '';
    for (const sys of SYS_ORDER) {
      const list = (this.partsBySys[sys] || []).filter((pid) => { if (!q) return true; const p = C.parts[pid]; return ['en', 'hi', 'hg'].some((l) => (tx(p.name, l) || '').toLowerCase().includes(q)); });
      if (!list.length) continue;
      const h = document.createElement('h4'); h.textContent = tx(SYSTEMS[sys], L); h.style.setProperty('--c', SYSTEMS[sys].color); ol.appendChild(h);
      for (const pid of list) {
        const b = document.createElement('button'); b.className = 'obtn'; b.dataset.id = pid; b.style.setProperty('--c', SYSTEMS[sys].color);
        b.textContent = tx(C.parts[pid].name, L);
        b.onclick = () => { this.audio.unlock(); document.body.classList.remove('organs-open'); this.selectPart(pid, { from: 'list' }); };
        ol.appendChild(b);
      }
    }
  }
  refreshUI() {
    const L = this.lang;
    const active = this.mode === 'journey' ? 'j_' + this.journey.id : this.mode === 'lab' ? 'lab_' + this.labId : this.mode === 'dismantle' ? (this.dis.apart ? 'dis_' + this.dis.set : 'all_organs') : this.mode === 'game' ? 'game_' + this.dis.set : this.mode === 'explore' ? 'explore' : '';
    document.querySelectorAll('.jbtn,.tbtn').forEach((b) => b.classList.toggle('on', b.dataset.id === active));
    document.querySelectorAll('.lbtn').forEach((b) => { const k = b.dataset.id; b.classList.toggle('on', k === 'fine' ? this.fine : !!this.body.layerOn[k]); });
    $('#btn-voice').innerHTML = this.audio.voice ? VOICE_ON : VOICE_OFF; $('#btn-voice').classList.toggle('off', !this.audio.voice);
    $('#btn-voice').title = tx(T.voice, L) + ': ' + tx(this.audio.voice ? T.on : T.off, L);
    $('#btn-sfx').classList.toggle('off', !this.audio.sfx); $('#btn-sfx').title = tx(T.sfx, L) + ': ' + tx(this.audio.sfx ? T.on : T.off, L);
    document.querySelectorAll('.obtn').forEach((b) => b.classList.toggle('on', !!this.sel && b.dataset.id === this.sel.pid));
    const m = this.storyModel();
    const card = $('#story');
    card.style.setProperty('--c', m.color || '#d9d2c3');
    card.classList.toggle('explore', !m.dots);
    $('#s-kicker').textContent = m.kicker || '';
    $('#s-title').textContent = m.title || '';
    { const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])), heads = [tx(T.fnLabel, L) + ':', tx(T.howLabel, L) + ':'];
      $('#s-text').innerHTML = String(m.text || '').split('\n').map((l) => { const h = heads.find((x) => l.startsWith(x)); return `<p>${h ? `<b>${esc(h)}</b>${esc(l.slice(h.length))}` : esc(l)}</p>`; }).join(''); }
    $('#s-dots').innerHTML = m.dots ? Array.from({ length: m.dots.n }, (_, i) => `<i class="${i <= m.dots.i ? 'on' : ''}" data-i="${i}"></i>`).join('') : '';
    $('#s-dots').querySelectorAll('i').forEach((d) => (d.onclick = () => { this.audio.unlock(); if (this.mode === 'lab') this.labStep(+d.dataset.i); else this.showStep(+d.dataset.i); }));
    const bs = $('#s-buttons'); bs.innerHTML = '';
    for (const b of [...(m.buttons || []), ...(m.buttons2 || [])]) {
      const e = document.createElement('button'); e.className = 'cbtn' + (b.primary ? ' primary' : ''); e.textContent = b.label;
      e.onclick = () => { this.audio.unlock(); this.action(b.id); }; bs.appendChild(e);
    }
    $('#offline').textContent = this.offlineText();
    if (this.vrui) this.vrui.dirty = true;
    if (!this.inXR()) requestAnimationFrame(() => { const d = Math.round((card.getBoundingClientRect().height + 24) * 0.5); if (d !== this._vo) { this._vo = d; this.camera.setViewOffset(innerWidth, innerHeight, 0, d, innerWidth, innerHeight); this.camera.updateProjectionMatrix(); } });
  }
  toast(msg, ms = 4200) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), ms); }

  bindInput() {
    const el = this.renderer.domElement;
    let down = null;
    const ray = (e) => { const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), this.camera); return rc; };
    el.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() }; this.audio.unlock();
      if (this.mode === 'game') {
        const h = this.dis.pick(ray(e));
        if (h) {
          this.controls.enabled = false; this.dis.grab(h.piece, h.point); this.lastHeld = h.piece; this.selPiece = h.piece; this.holding(h.piece);
          const n = new THREE.Vector3(); this.camera.getWorldDirection(n);
          this.dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(n.negate(), h.point);
          el.setPointerCapture(e.pointerId);
        }
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (this.dragPlane) { const p = new THREE.Vector3(); if (ray(e).ray.intersectPlane(this.dragPlane, p)) this.dis.moveTo(p); return; }
      if (e.pointerType !== 'mouse' || down) return;
      const now = performance.now(); if (now - (this._hov || 0) < 140) return; this._hov = now;
      if (this.mode === 'explore' || this.mode === 'part' || this.mode === 'journey') { const h = this.pickBody(ray(e)); this.setHover(h ? h.pid : null); el.style.cursor = h ? 'pointer' : ''; }
      else if (this.mode === 'lab') { const h = this.lab.pick(ray(e)); this.lab.setHover(h ? h.pid : null); el.style.cursor = h ? 'pointer' : ''; }
    });
    el.addEventListener('pointerup', (e) => {
      if (this.dragPlane) { this.dragPlane = null; this.controls.enabled = true; this.onDrop(this.dis.release()); this.selPiece = null; down = null; return; }
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < 6 && performance.now() - down.t < 500) this.pointAt(ray(e));
      down = null;
    });
    el.addEventListener('pointerleave', () => this.setHover(null));
    for (const l of LANGS) $('#lang-' + l).onclick = () => { this.audio.unlock(); this.setLang(l); };
    $('#btn-sfx').onclick = () => { this.audio.unlock(); this.action('sfx'); };
    $('#btn-organs').onclick = () => document.body.classList.toggle('organs-open');
    $('#psearch').oninput = () => this.buildPartList();
    $('#btn-vr').onclick = () => this.enterXR('immersive-vr');
    $('#xr-go').onclick = () => this.enterXR(this.appMode === 'ar' ? 'immersive-ar' : 'immersive-vr');
    $('#btn-ar').onclick = () => this.enterXR('immersive-ar');
    $('#btn-voice').onclick = () => { this.audio.unlock(); this.action('voice'); };
    $('#btn-reset').onclick = () => { this.controls.autoRotate = false; $('#btn-spin').classList.remove('on'); this.goView(false); };
    $('#btn-zin').onclick = () => this.zoomBy(1.25); $('#btn-zout').onclick = () => this.zoomBy(0.8);
    $('#btn-spin').onclick = () => { this.action('spin'); $('#btn-spin').classList.toggle('on', this.controls.autoRotate); };
    $('#btn-panels').onclick = () => document.body.classList.toggle('panels-open');
    $('#btn-save').onclick = () => this.saveAll();
    addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === ' ') { e.preventDefault(); this.togglePlay(); }
      if (e.key === 'Escape') this.action('deselect');
    });
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((ok) => $('#btn-vr').classList.toggle('dim', !ok)).catch(() => {});
      navigator.xr.isSessionSupported('immersive-ar').then((ok) => $('#btn-ar').classList.toggle('dim', !ok)).catch(() => {});
    } else { $('#btn-vr').classList.add('dim'); $('#btn-ar').classList.add('dim'); }
  }
  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    const card = document.getElementById('story');
    const d = card ? Math.round((card.getBoundingClientRect().height + 24) * 0.5) : 0;
    if (d > 0) this.camera.setViewOffset(innerWidth, innerHeight, 0, d, innerWidth, innerHeight); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    if (!this.inXR() && this.stepView) this.goView(true);
  }

  // ------------------------------------------------------------ offline
  setupOffline() {
    if (!('serviceWorker' in navigator) || Q.has('shot')) return;
    navigator.serviceWorker.addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type === 'progress') { this.offline = { have: d.have, total: d.total, busy: d.have < d.total }; this.showOffline(); }
    });
    navigator.serviceWorker.ready.then(() => setTimeout(() => this.prefetchAudio([this.lang]), 6000)).catch(() => {});
  }
  audioUrls(langs) { return Object.entries(C.audio).flatMap(([id, ls]) => ls.filter((l) => langs.includes(l)).map((l) => `./audio/${l}/${id}.mp3`)); }
  prefetchAudio(langs) {
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller; if (!sw) return;
    const labs = LAB_IDS.filter((id) => id !== 'tooth' && id !== 'skin').flatMap((id) => [`./models/labs/${id}.glb`, `./models/labs/${id}.json`]);
    sw.postMessage({ type: 'prefetch', urls: [...labs, './models/muscles.glb', ...this.audioUrls(langs)] });
  }
  saveAll() { this.prefetchAudio(LANGS); this.toast(tx(T.saving, this.lang) + '…'); }
  offlineText() {
    const o = this.offline, L = this.lang;
    if (!o.total) return '';
    const pct = Math.floor(100 * o.have / o.total);
    return pct >= 100 ? '✓ ' + tx(T.offline, L) : `${tx(T.saving, L)} ${pct}%`;
  }
  showOffline() { const e = $('#offline'); if (e) e.textContent = this.offlineText(); if (this.vrui && this.vrui.page === 'settings') this.vrui.dirty = true; }

  // ------------------------------------------------------------ frame
  frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const xr = this.inXR();
    const dtA = (this.mode === 'journey' || this.mode === 'lab') ? dt * Math.min(this.speed, 3) : dt;
    this.anim.update(dtA);
    const D = this.flows.drivers;
    D.beat = 0.35 + 1.6 * this.anim.beat;
    const breathing = this.anim.on.has('breathe') || this.anim.on.has('breathe_deep');
    D.in = breathing ? (this.anim.inhaling ? 1.7 : 0.08) : 1;
    D.out = breathing ? (this.anim.inhaling ? 0.08 : 1.6) : 1;
    this.flows.beat = this.anim.beat;
    this.flows.update(dtA);
    this.tracer.update(dtA, t, 0.4 + 1.5 * this.anim.beat);
    this.body.state.u.uPTime.value = t; this.body.state.commit();
    let scale;
    if (xr) {
      const cam = this.renderer.xr.getCamera(); const sub = cam.cameras && cam.cameras[0];
      const h = sub && sub.viewport ? sub.viewport.w : 1800;
      scale = h * 0.5 * (sub ? sub.projectionMatrix.elements[5] : 1.2);
    } else scale = this.renderer.domElement.height * 0.5 * this.camera.projectionMatrix.elements[5];
    const ms = this.bodyRoot.scale.x;
    let boost;
    if (xr) { const hp = this.headPose().pos; const f = this.stepView ? this.bodyRoot.localToWorld(this.stepView.at.clone()) : hp; boost = THREE.MathUtils.clamp(hp.distanceTo(f) / 0.8, 1, 2.2); }
    else boost = THREE.MathUtils.clamp(this.camera.position.distanceTo(this.controls.target) / 0.9, 1, 3.2);
    this.flows.mat.uniforms.uScale.value = scale; this.flows.mat.uniforms.uModel.value = ms * boost;
    this.tracer.trail.mat.uniforms.uScale.value = scale; this.tracer.trail.mat.uniforms.uModel.value = ms * boost;
    this.tracer.setBoost(boost);
    const cam = this.viewCamera();
    this.mag.update(dt, t, cam);
    this.zoom.update(cam, scale);
    this.lab.update(dtA, t, scale, 1);
    this.dis.update(dt, t);
    if (this.confPts) {
      this.confT += dt; const a = this.confPts.geometry.attributes.position;
      this.conf.forEach((c, i) => { c.v.y -= 2.2 * dt; c.p.addScaledVector(c.v, dt); a.setXYZ(i, c.p.x, c.p.y, c.p.z); }); a.needsUpdate = true;
      this.confPts.material.opacity = Math.max(0, 1 - this.confT / 4); if (this.confT > 4) { this.bodyRoot.remove(this.confPts); this.confPts = null; }
    }
    if (xr) { if (this.museum) this.followUI(dt); this.xrInput(dt); }
    else if (this.camTween) {
      const tw = this.camTween; tw.t = Math.min(1, tw.t + dt / 1.4);
      const e = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - Math.pow(-2 * tw.t + 2, 3) / 2;
      this.camera.position.lerpVectors(tw.p0, tw.p1, e); this.controls.target.lerpVectors(tw.t0, tw.t1, e);
      if (tw.t >= 1) this.camTween = null;
    }
    if (!xr) this.controls.update();
    // autoplay: move on after the teacher finishes (or after reading time) plus a moment to watch
    if ((this.mode === 'journey' || (this.mode === 'lab' && this.lab.L && !this.labSel)) && this.playing) {
      this.stepT += dt;
      const text = this.mode === 'journey' ? tx(this.step.text, this.lang) : this.labStepText().text;
      if (this.spoken && this.spokenAt == null) this.spokenAt = this.stepT;
      const readT = Math.max(10, text.split(' ').length * 0.4 + 3), sp = this.speed;
      // 1x-2x: wait for the voice to finish; faster: move on after the reading time divided by the speed
      const due = sp > 2 ? Math.max(2.5, readT / sp)
        : this.spokeOK && this.spokenAt != null ? Math.max(6 / sp, this.spokenAt + 2.5 / sp) : (this.spoken || !this.audio.voice ? readT / sp : Math.max(readT / sp, this.stepT + 1));
      this.autoFrac = Math.min(1, this.stepT / due);
      if (this.stepT > due) this.next();
    } else this.autoFrac = 0;
    if ((this._pf = (this._pf || 0) + dt) > 0.25) { this._pf = 0; const e = document.getElementById('s-prog'); if (e) e.style.transform = `scaleX(${this.autoFrac || 0})`; if (xr && this.playing) this.vrui.dirty = true; }
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
