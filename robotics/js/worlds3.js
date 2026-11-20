// DUET Robotics Lab 360, batch 3: the scene beside the bench for each project, in 3D (the logic is scenes3.js):
//   air      a window (sunny, rainy, a winter night) and a cup of hot chai that can be put next to the DHT11
//   garden   a tulsi plant in a terracotta pot, the soil probe in it, a water tank with the pump, its tube, the water
//   room     a model room: lamp and ceiling fan (230 V, through the relays), a sofa, a door; the remote on the desk;
//            for the burglar alarm a thief (and the cat) who walk past the PIR
//   door     a door in its frame, the latch bolt pulled by the servo; the white card and the blue tag on the desk
//   locker   a steel locker whose latch the servo pulls
//   kitchen  a counter with a two-burner stove, the red LPG cylinder, a window, the leaking gas as a haze
//   pantilt  the pan-tilt head with its laser on a stand, the target board with A and B, the laser's dot
//   turn     the turntable on the stepper's shaft, a degree ring on the mat to read its angle
//   gimbal   (batch 33) a hand holding a two-servo camera gimbal: the roll servo on the grip, a U bracket, the pitch servo,
//            an action camera on the platform with the GY-521 in front of it
//   beam     (batch 34) a 50 cm aluminium channel on a pivot post, the servo's horn and pushrod, the HC-SR04 at its left
//            end, a ping-pong ball rolling in it, a centimetre scale and the red mark at the middle
//   ration   (batch 35) a fair-price shop's open jute sack of rice with its steel scoop, and the shop's board
// Phones and the headset: the still pieces of a scene are merged by material, there are no real-time lights or shadows
// (the lamp's light is a soft pool on the floor), and a scene is built over a few frames.
import * as THREE from 'three';
import * as MD from './models.js';
import * as M2 from './models2.js';
import * as TX from './tex.js';
import { VIEWS, nextFrame } from './stage.js';
import { rotXZ } from './parts.js';
import { makeScene, PT_TARGETS, TANK, LIFT, CONV, SLIDE, PLOT, PICK, BEAM } from './scenes3.js';
import { CARDS } from './libs3.js';

// the camera that sees the bench and the scene beside it
Object.assign(VIEWS, { scene3bb: { tgt: [470, 120, 0], hw: 330, hd: 210, dir: [-0.12, 0.36, 0.92] } }); // (batch 34: the ball-on-beam stand beside the bench)
Object.assign(VIEWS, { scene3gb: { tgt: [290, 180, 40], hw: 290, hd: 270, dir: [-0.22, 0.32, 0.92] } }); // (batch 33: the gimbal in its hand, beside the bench)
Object.assign(VIEWS, { scene3: { tgt: [150, 40, 10], hw: 300, hd: 160, dir: [-0.14, 0.6, 0.79] }, scene3pt: { tgt: [190, 70, 10], hw: 340, hd: 190, dir: [-0.1, 0.55, 0.83] }, scene3cv: { tgt: [285, 30, 0], hw: 235, hd: 150, dir: [-0.2, 0.62, 0.76] } }); // (scene3pt: the joystick on the bench and the tall target board behind)
const KINDS = new Set(['air', 'garden', 'room', 'burglar', 'door', 'attend', 'bank', 'tank', 'greenhouse', 'locker', 'kitchen', 'pantilt', 'turn', 'atm', 'vend', 'tracker', 'lift', 'conveyor', 'slider', 'plot', 'pick', 'gimbal', 'beam', 'ration']);
export const isWorld3 = (cfg) => !!(cfg && KINDS.has(cfg.kind));
export function makeWorld3(app, cfg) { return isWorld3(cfg) ? new World3(app, cfg) : null; }

const D2R = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const frame = nextFrame; // (also in a headset: stage.js)
const LITE = () => !!(window.DuetPerf && window.DuetPerf.phone) || /OculusBrowser|Quest|Pico/i.test(navigator.userAgent) || /[?&]lite\b/.test(location.search);
const box = MD.box, cyl = MD.cyl;
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function ctex(C, rep) { const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
function grain(c, w, h, a, n = 1400) { for (let i = 0; i < n; i++) { c.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * a})`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }
const tube = (pts, r, mat, seg = 24, rs = 8) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false), mat);
function lathe(pts, mat, seg = 28) { return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat); }
function glowTex() { const C = canvas(64, 64); const c = C.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return ctex(C); }

class World3 {
  constructor(app, cfg) {
    this.app = app; this.lab = app.lab; this.stage = app.stage; this.cfg = cfg; this.kind = cfg.kind; this.sim = makeScene(cfg);
    this.root = new THREE.Group(); this.root.name = 'world3'; this.root.visible = false; this.ready = false; this.picks = []; this.lite = LITE();
    const S = (o) => (this.lite ? new THREE.MeshLambertMaterial(Object.fromEntries(Object.entries(o).filter(([k]) => !/roughness|metalness/.test(k)))) : new THREE.MeshStandardMaterial(o));
    this.mat = S; this.loader = new THREE.TextureLoader();
  }
  part(tag) { return this.lab.byTag(tag); }
  flag(n) { return this.sim.flag(n); }
  val(n) { return this.sim.val(n); }
  async build() {
    const t0 = performance.now(); this.stage.root.add(this.root);
    for (const f of this.steps()) { f(); if (this.dead) return; await frame(); }
    if (this.dead) return;
    try { this.compiling = this.stage.warm(this.root); await this.compiling; } catch (e) { /* compiled when drawn */ }
    this.compiling = null; if (this.dead) return;
    this.root.visible = true; this.ready = true; this.buildMs = Math.round(performance.now() - t0); this.draw(0); this.stage.kick();
  }
  dispose() { this.dead = true; this.stage.root.remove(this.root); const free = () => MD.dispose(this.root); if (this.compiling) this.compiling.then(free, free); else free(); }
  update(dt) { if (!this.ready) return false; const a = this.sim.update(dt, this.lab); const b = this.draw(dt); return !!(a || b); }
  onRun() { this.sim.onRun(this.lab); }
  control(id, v) { this.sim.control(id, v, this.lab); this.stage.kick(); }
  hud() { return this.sim.hud(this.lab); }
  pickables() { return this.picks; }
  // a tap on a scene object (a remote button, a card)
  tap(role) {
    if (!role) return false;
    if (role.startsWith('rc3:')) { this.sim.press && this.sim.press(this.lab, role.slice(4)); this.flashIR = 0.25; if (this.app.sound) this.app.sound.click(); return true; }
    if (role.startsWith('card3:')) { this.sim.control(role.slice(6), null, this.lab); return true; }
    return false;
  }
  // a static group: merged by material (a few draw calls), then added
  still(g) { MD.mergeStatic(g); g.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = !this.lite; } }); this.root.add(g); return g; }
  wood(rep = [1, 1], tint = 0xffffff) { const t = this.loader.load('tex/oak_diff.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return this.mat({ map: t, color: tint, roughness: 0.7 }); }
  blob(w, d, x, z, a = 0.35) { const b = M2.blobShadow(w, d, a); b.position.set(x, 0.3, z); this.root.add(b); return b; }
  // a part's point (its model's local x, z) on the bench
  partPoint(tag, local) { const p = this.part(tag); if (!p) return null; const [x, z] = rotXZ(local.x, local.z, p.rot || 0); return V3(p.at.x + x, local.y, p.at.z + z); }
  // cables from parts on the mat (their cableEnd) to points in the scene; rebuilt when a part moves
  cables(list) {
    const key = JSON.stringify(list.map(([tag]) => { const p = this.part(tag); return p ? [p.at.x, p.at.z, p.rot] : null; })); if (key === this.cableKey) return; this.cableKey = key;
    if (this.cableObj) { this.root.remove(this.cableObj); MD.dispose(this.cableObj); this.cableObj = null; }
    const g = new THREE.Group();
    for (const [tag, to, r = 1.6, col] of list) {
      const p = this.part(tag); if (!p) continue; const e = this.app.view.parts.get(p.uid); const ce = e && e.obj.userData.cableEnd; if (!ce) continue;
      const a = this.partPoint(tag, ce); const b = V3(...to); const m = col ? this.mat({ color: col, roughness: 0.5 }) : null;
      const pts = [a, V3(a.x + (b.x - a.x) * 0.25, 3, a.z + (b.z - a.z) * 0.15), V3((a.x + b.x) / 2, 3, (a.z + b.z) / 2 + 12), V3(b.x - (b.x - a.x) * 0.12, Math.max(4, b.y * 0.5), b.z), b];
      g.add(m ? tube(pts, r, m, 30, 6) : M2.cableBundle([pts], r));
    }
    this.cableObj = g; this.root.add(g);
  }
  steps() {
    switch (this.kind) {
      case 'air': return this.airSteps(); case 'garden': case 'greenhouse': return this.gardenSteps(); case 'room': case 'burglar': return this.roomSteps(); case 'door': case 'attend': return this.doorSteps();
      case 'locker': case 'bank': return this.lockerSteps(); case 'tank': return this.tankSteps(); case 'kitchen': return this.kitchenSteps(); case 'pantilt': return this.ptSteps(); case 'turn': return this.turnSteps(); case 'atm': return this.atmSteps(); case 'vend': return this.vendSteps(); case 'tracker': return this.trackerSteps(); case 'lift': return this.liftSteps(); case 'conveyor': return this.convSteps(); case 'slider': return this.slideSteps(); case 'plot': return this.plotSteps(); case 'pick': return this.pickSteps(); case 'gimbal': return this.gimbalSteps(); case 'beam': return this.beamSteps(); case 'ration': return this.rationSteps();
    }
    return [];
  }
  draw(dt) {
    switch (this.kind) {
      case 'air': return this.airDraw(dt); case 'garden': case 'greenhouse': return this.gardenDraw(dt); case 'room': case 'burglar': return this.roomDraw(dt); case 'door': case 'attend': return this.doorDraw(dt);
      case 'locker': case 'bank': return this.lockerDraw(dt); case 'tank': return this.tankDraw(dt); case 'kitchen': return this.kitchenDraw(dt); case 'pantilt': return this.ptDraw(dt); case 'turn': return this.turnDraw(dt); case 'atm': return this.atmDraw(dt); case 'vend': return this.vendDraw(dt); case 'tracker': return this.trackerDraw(dt); case 'lift': return this.liftDraw(dt); case 'conveyor': return this.convDraw(dt); case 'slider': return this.slideDraw(dt); case 'plot': return this.plotDraw(dt); case 'pick': return this.pickDraw(dt); case 'gimbal': return this.gimbalDraw(dt); case 'beam': return this.beamDraw(dt); case 'ration': return this.rationDraw(dt);
    }
    return false;
  }

  // ================================================================== air: the window and the chai
  airSteps() {
    const r = this.root, S = this.mat;
    return [
      () => { // the window on a stand, angled towards the bench
        const w = new THREE.Group(); w.position.set(345, 0, -95); w.rotation.y = -0.32; const fr = S({ color: 0xe9e2d2, roughness: 0.6 });
        w.add(box(236, 12, 26, this.wood([2, 0.3]), 0, 6, 0)); w.add(box(220, 10, 12, fr, 0, 17, 0)); w.add(box(220, 10, 12, fr, 0, 193, 0)); for (const x of [-105, 0, 105]) w.add(box(10, 186, 12, fr, x, 105, 0)); w.add(box(220, 6, 10, fr, 0, 105, 0));
        this.still(w);
        const C = canvas(256, 192); this.skyC = C; this.skyT = ctex(C); const gl = new THREE.Mesh(new THREE.PlaneGeometry(200, 170), new THREE.MeshBasicMaterial({ map: this.skyT, toneMapped: false }));
        gl.position.set(345 - Math.sin(-0.32) * -4, 105, -95 - 4 * Math.cos(0.32)); gl.rotation.y = -0.32; r.add(gl); this.glass = gl;
        const RC = canvas(64, 128); const rc = RC.getContext('2d'); for (let i = 0; i < 60; i++) { rc.strokeStyle = `rgba(210,225,255,${0.25 + Math.random() * 0.4})`; rc.lineWidth = 1; const x = Math.random() * 64, y = Math.random() * 128; rc.beginPath(); rc.moveTo(x, y); rc.lineTo(x - 3, y + 14); rc.stroke(); }
        this.rainT = ctex(RC, [4, 2]); const rain = new THREE.Mesh(new THREE.PlaneGeometry(200, 170), new THREE.MeshBasicMaterial({ map: this.rainT, transparent: true, depthWrite: false, toneMapped: false }));
        rain.position.copy(gl.position).add(V3(Math.sin(-0.32) * -0.6, 0, Math.cos(0.32) * 0.6)); rain.rotation.y = -0.32; r.add(rain); this.rain = rain; this.drawSky();
      },
      () => { // the cup of chai on its saucer
        const cup = new THREE.Group(); const cer = S({ color: 0xf4f1ea, roughness: 0.25 }); const chai = S({ color: 0x9a5a2a, roughness: 0.15 });
        cup.add(lathe([[0, 0], [24, 0], [25, 2], [24, 3.5], [0, 3.5]], cer)); cup.add(lathe([[0, 3.5], [13, 3.5], [16, 8], [19, 30], [20, 34], [18.6, 34], [17.5, 30], [14.5, 9], [0, 9]], cer));
        const surf = new THREE.Mesh(new THREE.CircleGeometry(17.6, 24), chai); surf.rotation.x = -Math.PI / 2; surf.position.y = 29; cup.add(surf);
        const h = new THREE.Mesh(new THREE.TorusGeometry(7, 2, 8, 16, Math.PI * 1.2), cer); h.position.set(20, 20, 0); h.rotation.z = -Math.PI * 0.6; cup.add(h);
        MD.mergeStatic(cup); r.add(cup); this.cup = cup;
        const gt = glowTex(); this.steam = [0, 1, 2].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); s.userData.ph = i / 3; r.add(s); return s; });
        this.cupBlob = this.blob(70, 70, 0, 0, 0.3);
      },
    ];
  }
  drawSky() {
    const c = this.skyC.getContext('2d'), W = 256, H = 192; const k = this.sim.sky || 'sunny';
    const g = c.createLinearGradient(0, 0, 0, H);
    if (k === 'sunny') { g.addColorStop(0, '#4a9be8'); g.addColorStop(1, '#bfe3ff'); } else if (k === 'rainy') { g.addColorStop(0, '#5c6672'); g.addColorStop(1, '#9aa6b0'); } else { g.addColorStop(0, '#060b1e'); g.addColorStop(1, '#1b2747'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (k === 'sunny') { const s = c.createRadialGradient(190, 46, 4, 190, 46, 40); s.addColorStop(0, '#fff8d0'); s.addColorStop(0.35, '#ffe27a'); s.addColorStop(1, 'rgba(255,226,122,0)'); c.fillStyle = s; c.fillRect(140, 0, 116, 100); }
    if (k === 'night') { c.fillStyle = '#f2f0e0'; c.beginPath(); c.arc(70, 50, 14, 0, 7); c.fill(); c.fillStyle = '#060b1e'; c.beginPath(); c.arc(76, 45, 13, 0, 7); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 53) % (H * 0.7), 1.4, 1.4); }
    if (k !== 'night') { c.fillStyle = k === 'rainy' ? 'rgba(80,88,98,0.9)' : 'rgba(255,255,255,0.9)'; for (const [x, y, s] of [[60, 70, 1], [120, 40, 0.8], [30, 120, 0.7]]) { for (const [dx, dy, r] of [[0, 0, 16], [16, -6, 14], [30, 2, 13], [12, 8, 13]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); } } }
    // the ground and a neem tree outside
    c.fillStyle = k === 'night' ? '#0d1a10' : '#4f7a3a'; c.fillRect(0, H - 26, W, 26); c.fillStyle = k === 'night' ? '#0a140c' : '#2f5a26'; c.beginPath(); c.arc(40, H - 52, 30, 0, 7); c.fill(); c.fillStyle = '#4a3220'; c.fillRect(36, H - 30, 8, 18);
    this.skyT.needsUpdate = true; this.skyK = k;
  }
  airDraw(dt) {
    let a = false; const S = this.sim;
    if (this.glass && (S.sky || 'sunny') !== this.skyK) { this.drawSky(); a = true; }
    if (this.rain) { const on = S.sky === 'rainy'; this.rain.visible = on; if (on) { this.rainT.offset.y += dt * 1.6; this.rainT.offset.x -= dt * 0.25; a = true; } }
    if (this.cup) {
      const k = S.chaiPos || 0; const p0 = V3(300, 0, 70), p1 = V3(66, 0, 50); const pos = p0.clone().lerp(p1, k); pos.y = Math.sin(k * Math.PI) * 18;
      this.cup.position.copy(pos); this.cupBlob.position.set(pos.x, 0.3, pos.z); this.cupBlob.material.opacity = 0.3 * (1 - pos.y / 30);
      const t = performance.now() / 1000; this.steam.forEach((s) => { const f = (t * 0.45 + s.userData.ph) % 1; s.position.set(pos.x + Math.sin(t + s.userData.ph * 6) * 4, pos.y + 34 + f * 46, pos.z); s.scale.setScalar(10 + f * 26); s.material.opacity = 0.32 * Math.sin(f * Math.PI); });
      a = true; // the steam rises all the time
    }
    return a;
  }

  // ================================================================== garden: tulsi in a pot, the tank, the pump, the tube
  gardenSteps() {
    const r = this.root, S = this.mat; const PX = 340, PZ = -30;
    return [
      () => { // the terracotta pot and its saucer
        const C = canvas(128, 128); const c = C.getContext('2d'); c.fillStyle = '#b8643a'; c.fillRect(0, 0, 128, 128); grain(c, 128, 128, 0.12, 900); const terra = S({ map: ctex(C), roughness: 0.85 });
        const g = new THREE.Group(); g.position.set(PX, 0, PZ);
        g.add(lathe([[0, 0], [66, 0], [68, 3], [66, 8], [0, 8]], terra, 32));
        g.add(lathe([[48, 8], [62, 98], [70, 100], [71, 112], [64, 113], [63, 104], [57, 104], [44, 14], [0, 14]], terra, 32));
        this.still(g); this.blob(170, 170, PX, PZ, 0.4);
        const sC = canvas(128, 128); this.soilC = sC; this.soilT = ctex(sC); const soil = new THREE.Mesh(new THREE.CircleGeometry(60, 32), S({ map: this.soilT, roughness: 0.9 })); soil.rotation.x = -Math.PI / 2; soil.position.set(PX, 101, PZ); r.add(soil); this.soilM = soil.material; this.drawSoil(0.3);
        this.saucerWater = new THREE.Mesh(new THREE.RingGeometry(46, 64, 32), new THREE.MeshBasicMaterial({ color: 0x6a8ab0, transparent: true, opacity: 0, depthWrite: false })); this.saucerWater.rotation.x = -Math.PI / 2; this.saucerWater.position.set(PX, 8.2, PZ); r.add(this.saucerWater);
      },
      () => { // the tulsi plant: a woody stem, branches, and leaves (one instanced mesh)
        const g = new THREE.Group(); g.position.set(PX, 101, PZ); const stem = S({ color: 0x6b5a3a, roughness: 0.8 });
        const br = []; g.add(tube([V3(0, 0, 0), V3(2, 40, 1), V3(-1, 90, 0), V3(1, 130, 2)], 3, stem, 12, 6));
        for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 30 + i * 13, L = 40 - i * 3; const end = V3(Math.cos(a) * L, y + 22, Math.sin(a) * L); br.push(end); g.add(tube([V3(0, y, 0), V3(Math.cos(a) * L * 0.5, y + 14, Math.sin(a) * L * 0.5), end], 1.4, stem, 8, 5)); }
        MD.mergeStatic(g); r.add(g);
        const lg = new THREE.SphereGeometry(1, 10, 6); lg.scale(7, 1.2, 4.2); lg.translate(6, 0, 0);
        const n = 7 * 9 + 10; const im = new THREE.InstancedMesh(lg, S({ color: 0x3f8f3a, roughness: 0.6 }), n); im.position.set(PX, 101, PZ); r.add(im); this.leaves = im; this.leafData = [];
        for (const e of [...br, V3(0, 132, 0)]) for (let k = 0; k < (e.y > 130 ? 10 : 9); k++) { const yaw = Math.random() * Math.PI * 2; this.leafData.push({ p: e.clone().add(V3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10)), yaw, s: 0.7 + Math.random() * 0.5 }); }
        im.count = this.leafData.length; this.leafHealth = -1;
        // the soil probe, stuck in at the side
        const pr = new THREE.Group(); pr.position.set(PX + 34, 101, PZ + 18); pr.rotation.y = -0.6; const pcb = S({ color: 0xb8201c, roughness: 0.5 }), gold = S({ color: 0xd8b25a, metalness: 1, roughness: 0.35 });
        pr.add(box(20, 14, 1.6, pcb, 0, 7, 0)); for (const x of [-6, 6]) pr.add(box(3.4, 40, 1.4, gold, x, -16, 0)); pr.add(box(6, 3, 5, S({ color: 0x1b1b1d }), 0, 15, 0)); MD.mergeStatic(pr); r.add(pr);
      },
      () => { // the water tank with the pump inside, and the tube up to the pot
        const TX0 = 262, TZ = 100; const glass = new THREE.MeshPhysicalMaterial({ color: 0xeef6ff, roughness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
        const t = new THREE.Group(); t.position.set(TX0, 0, TZ); t.add(box(110, 2, 84, glass, 0, 1, 0)); for (const [w, d, x, z] of [[110, 2, 0, -41], [110, 2, 0, 41], [2, 84, -54, 0], [2, 84, 54, 0]]) t.add(box(w, 96, d, glass, x, 48, z)); r.add(t);
        this.water = box(104, 1, 78, new THREE.MeshPhysicalMaterial({ color: 0x5aa0e8, roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }), TX0, 0, TZ); r.add(this.water);
        const pump = new THREE.Group(); pump.position.set(TX0 - 20, 0, TZ); pump.add(cyl(13, 30, S({ color: 0x1b1b1d, roughness: 0.4 }), 0, 15, 0, 20)); pump.add(cyl(4, 14, S({ color: 0xf2f2ee }), 0, 37, 0, 12)); MD.mergeStatic(pump); r.add(pump);
        const sil = new THREE.MeshPhysicalMaterial({ color: 0xeef4ff, roughness: 0.2, transparent: true, opacity: 0.55, depthWrite: false });
        const tp = [V3(TX0 - 20, 44, TZ), V3(TX0 - 20, 120, TZ - 10), V3(300, 150, 30), V3(PX + 8, 150, PZ + 40), V3(PX + 14, 128, PZ + 22)]; r.add(tube(tp, 3.4, sil, 40, 8));
        this.tubeEnd = tp[tp.length - 1];
        this.stream = cyl(2.2, 1, new THREE.MeshPhysicalMaterial({ color: 0x8ec0ff, roughness: 0.05, transparent: true, opacity: 0, depthWrite: false }), 0, 0, 0, 10); r.add(this.stream);
        this.blob(150, 110, TX0, TZ, 0.25);
      },
      () => this.cables([['soil', [374, 108, -12], 1.2, 0x2a2a2c], ['pump', [242, 30, 100], 1.4, 0x1b1b1d]]),
    ];
  }
  drawSoil(m) {
    const c = this.soilC.getContext('2d'); const dry = [154, 118, 80], wet = [62, 40, 26]; const k = Math.max(0, Math.min(1, (m - 0.15) / 0.7));
    const col = dry.map((d, i) => Math.round(d + (wet[i] - d) * k)); c.fillStyle = `rgb(${col})`; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) { const v = Math.random(); c.fillStyle = `rgba(${v > 0.5 ? '255,240,220' : '20,10,4'},${0.12 + Math.random() * 0.15})`; c.fillRect((i * 37) % 128, (i * 61) % 128, 2, 2); }
    if (k < 0.25) { c.strokeStyle = 'rgba(60,40,20,0.5)'; c.lineWidth = 1; for (let i = 0; i < 9; i++) { c.beginPath(); const x = (i * 29) % 128, y = (i * 47) % 128; c.moveTo(x, y); c.lineTo(x + 18, y + 6); c.lineTo(x + 26, y - 4); c.stroke(); } } // cracks in dry soil
    this.soilT.needsUpdate = true; this.soilM.roughness = 0.95 - k * 0.5; this.soilK = Math.round(m * 40);
  }
  gardenDraw() {
    const S = this.sim; let a = false;
    if (this.soilT && Math.round(S.m * 40) !== this.soilK) { this.drawSoil(S.m); a = true; }
    if (this.leaves && Math.abs(S.health - this.leafHealth) > 0.02) { // wilting: the leaves droop and turn yellow-green
      this.leafHealth = S.health; const droop = (1 - S.health) * 0.9; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      this.leafData.forEach((d, i) => { e.set(0, d.yaw, -0.25 - droop); q.setFromEuler(e); m4.compose(d.p, q, V3(d.s, d.s, d.s)); this.leaves.setMatrixAt(i, m4); });
      this.leaves.instanceMatrix.needsUpdate = true; this.leaves.material.color.setRGB(0.25 + droop * 0.35, 0.56 - droop * 0.1, 0.23); a = true;
    }
    if (this.water) { const h = Math.max(1, S.tank / 1500 * 80); this.water.scale.y = h; this.water.position.y = h / 2 + 2; }
    if (this.stream) { const pump = this.part('pump'); const f = pump && S.tank > 0 ? pump.state.flow : 0; const e = this.tubeEnd; const len = e.y - 101; this.stream.scale.set(0.6 + f / 40, len, 0.6 + f / 40); this.stream.position.set(e.x, 101 + len / 2, e.z); this.stream.material.opacity = Math.min(0.75, f / 25); if (f > 0.5) a = true; }
    if (this.saucerWater) this.saucerWater.material.opacity = Math.min(0.5, S.drip * 0.6);
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['soil', [374, 108, -12], 1.2, 0x2a2a2c], ['pump', [242, 30, 100], 1.4, 0x1b1b1d]]); }
    return a;
  }

  // ================================================================== room: lamp, fan, sofa, the remote; the thief and the cat
  roomSteps() {
    const r = this.root, S = this.mat; const RX = 400, RZ = -45; // the room's centre (floor 240 × 180)
    return [
      () => {
        const g = new THREE.Group(); g.position.set(RX, 0, RZ);
        g.add(box(240, 4, 180, this.wood([1.2, 1]), 0, 2, 0));
        const wall = S({ color: 0xf0e2c8, roughness: 0.9 }), skirt = S({ color: 0x8a6440, roughness: 0.7 });
        g.add(box(240, 160, 6, wall, 0, 82, -93)); g.add(box(6, 160, 180, wall, 123, 82, 0)); g.add(box(240, 8, 2, skirt, 0, 8, -89.5)); g.add(box(2, 8, 180, skirt, 119.5, 8, 0));
        // the door in the right wall (a dark opening with a frame)
        g.add(box(2, 112, 54, S({ color: 0x2a2018, roughness: 0.9 }), 119.8, 60, 40)); for (const z of [12, 68]) g.add(box(4, 116, 4, skirt, 119, 62, z)); g.add(box(4, 4, 60, skirt, 119, 120, 40));
        // a rug, a sofa, a low table with a plant
        const RC = canvas(128, 96); const rc = RC.getContext('2d'); rc.fillStyle = '#9a2a2a'; rc.fillRect(0, 0, 128, 96); rc.strokeStyle = '#e8c070'; rc.lineWidth = 4; rc.strokeRect(8, 8, 112, 80); rc.lineWidth = 2; rc.strokeRect(20, 20, 88, 56); rc.fillStyle = '#e8c070'; rc.beginPath(); rc.arc(64, 48, 12, 0, 7); rc.fill();
        const rug = new THREE.Mesh(new THREE.PlaneGeometry(120, 90), S({ map: ctex(RC), roughness: 0.95 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-10, 4.3, 10); g.add(rug);
        const sofa = S({ color: 0x2f5f8a, roughness: 0.85 }); g.add(box(110, 22, 40, sofa, -20, 15, -66)); g.add(box(110, 34, 10, sofa, -20, 30, -84)); for (const x of [-72, 32]) g.add(box(10, 30, 40, sofa, x, 19, -66));
        g.add(box(46, 4, 26, this.wood([0.3, 0.3]), -20, 22, 8)); for (const [x, z] of [[-40, -2], [0, -2], [-40, 18], [0, 18]]) g.add(box(3, 20, 3, skirt, x, 10, z));
        g.add(cyl(5, 10, S({ color: 0xb8643a }), -32, 29, 8, 12)); g.add(new THREE.Mesh(new THREE.SphereGeometry(8, 10, 8), S({ color: 0x3f8f3a })).translateX(-32).translateY(40).translateZ(8));
        // the beam across the top that holds the fan and the lamp
        g.add(box(10, 10, 186, this.wood([0.2, 1.5]), -10, 166, 0)); g.add(box(10, 10, 10, skirt, -10, 166, -93));
        this.still(g);
      },
      () => { // the ceiling fan and the lamp
        const fan = new THREE.Group(); fan.position.set(RX - 10, 161, RZ + 30); const st = S({ color: 0xe8e8e2, roughness: 0.4, metalness: 0.3 });
        fan.add(cyl(1.6, 22, st, 0, -11, 0, 8)); fan.add(cyl(9, 8, st, 0, -25, 0, 18)); MD.mergeStatic(fan); r.add(fan);
        const rot = new THREE.Group(); rot.position.set(RX - 10, 132, RZ + 30); for (let i = 0; i < 3; i++) { const b = box(60, 1.2, 11, S({ color: 0xc8a46a, roughness: 0.6 }), 36, 0, 0); b.rotation.x = 0.08; const p = new THREE.Group(); p.rotation.y = i * Math.PI * 2 / 3; p.add(b); rot.add(p); } MD.mergeStatic(rot); r.add(rot); this.fanRot = rot;
        const lamp = new THREE.Group(); lamp.position.set(RX - 10, 161, RZ - 40); lamp.add(cyl(0.8, 30, S({ color: 0x1b1b1d }), 0, -15, 0, 6)); lamp.add(cyl(5, 8, S({ color: 0xf2f2ee }), 0, -33, 0, 12)); MD.mergeStatic(lamp); r.add(lamp);
        this.bulbM = new THREE.MeshStandardMaterial({ color: 0xfffdf4, emissive: 0xfff2c8, emissiveIntensity: 0, roughness: 0.2 }); const bulb = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), this.bulbM); bulb.position.set(RX - 10, 120, RZ - 40); bulb.scale.y = 1.2; r.add(bulb);
        const gt = glowTex(); this.bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: 0xfff0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); this.bulbGlow.position.copy(bulb.position); this.bulbGlow.scale.setScalar(70); r.add(this.bulbGlow);
        this.pool = new THREE.Mesh(new THREE.PlaneGeometry(220, 170), new THREE.MeshBasicMaterial({ map: gt, color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); this.pool.rotation.x = -Math.PI / 2; this.pool.position.set(RX - 10, 4.6, RZ - 20); r.add(this.pool);
      },
      () => { // the remote on the desk: buttons to tap
        if (this.kind !== 'room') return;
        const g = new THREE.Group(); g.position.set(250, 0, 125); g.rotation.y = 0.35; this.remote = g;
        const C = canvas(160, 340); const c = C.getContext('2d'); c.fillStyle = '#1c1d21'; c.fillRect(0, 0, 160, 340); c.fillStyle = '#8a8e96'; c.font = `600 14px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('IR REMOTE', 80, 26);
        const keys = [['UP', 80, 62], ['LEFT', 34, 100], ['OK', 80, 100], ['RIGHT', 126, 100], ['DOWN', 80, 138], ['1', 34, 182], ['2', 80, 182], ['3', 126, 182], ['4', 34, 222], ['5', 80, 222], ['6', 126, 222], ['7', 34, 262], ['8', 80, 262], ['9', 126, 262], ['*', 34, 302], ['0', 80, 302], ['#', 126, 302]];
        const lab = { UP: '▲', DOWN: '▼', LEFT: '◀', RIGHT: '▶', OK: 'OK' };
        for (const [k, x, y] of keys) { c.fillStyle = k === 'OK' ? '#c8241c' : '#e8e8e2'; c.beginPath(); c.arc(x, y, 16, 0, 7); c.fill(); c.fillStyle = k === 'OK' ? '#fff' : '#1c1d21'; c.font = `700 ${lab[k] ? 13 : 17}px ${TX.FONT}`; c.textBaseline = 'middle'; c.fillText(lab[k] || k, x, y + 1); }
        const top = S({ map: ctex(C), roughness: 0.45 }); const body = S({ color: 0x1c1d21, roughness: 0.5 });
        g.add(box(40, 7, 85, [body, body, top, body, body, body], 0, 3.5, 0)); MD.mergeStatic(g); r.add(g);
        for (const [k, x, y] of keys) { const pk = MD.box(9, 4, 9, new THREE.MeshBasicMaterial({ visible: false }), (x - 80) / 4, 8, (y - 170) / 4); pk.userData.role = 'rc3:' + k; g.add(pk); this.picks.push(pk); }
        this.irLed = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff4040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); this.irLed.position.set(0, 6, -44); this.irLed.scale.setScalar(16); g.add(this.irLed);
      },
      () => { // the thief and the cat (burglar alarm)
        if (this.kind !== 'burglar') return;
        const fig = new THREE.Group(); const cloth = S({ color: 0x23262c, roughness: 0.8 }), skin = S({ color: 0xb07a52, roughness: 0.7 }), mask = S({ color: 0x0e0e10, roughness: 0.6 });
        const legs = [-1, 1].map((s) => { const l = new THREE.Group(); l.position.set(0, 52, s * 6); l.add(new THREE.Mesh(new THREE.CapsuleGeometry(4.5, 40, 4, 8), cloth).translateY(-24)); fig.add(l); return l; });
        fig.add(new THREE.Mesh(new THREE.CapsuleGeometry(10, 34, 4, 10), cloth).translateY(76)); fig.add(new THREE.Mesh(new THREE.SphereGeometry(9, 14, 10), skin).translateY(108)); fig.add(new THREE.Mesh(new THREE.SphereGeometry(9.4, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mask).translateY(109));
        const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(0, 92, s * 13); a.add(new THREE.Mesh(new THREE.CapsuleGeometry(3.6, 32, 4, 8), cloth).translateY(-18)); fig.add(a); return a; });
        fig.add(box(16, 20, 12, S({ color: 0x6a4a2a, roughness: 0.8 }), -10, 80, 0)); // a bag
        fig.visible = false; r.add(fig); this.thief = { g: fig, legs, arms };
        const cat = new THREE.Group(); const fur = S({ color: 0xd8862e, roughness: 0.9 });
        cat.add(new THREE.Mesh(new THREE.CapsuleGeometry(6, 22, 4, 8), fur).rotateZ(Math.PI / 2).translateX(14)); cat.add(new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), fur).translateY(19).translateX(16));
        for (const s of [-1, 1]) cat.add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 6), fur).translateX(17).translateY(25).translateZ(s * 3));
        cat.add(tube([V3(-14, 14, 0), V3(-24, 22, 0), V3(-28, 34, 2)], 1.6, fur, 8, 5)); for (const x of [-9, 9]) for (const z of [-3.5, 3.5]) cat.add(cyl(1.6, 10, fur, x, 5, z, 6));
        cat.visible = false; r.add(cat); this.cat = cat;
      },
      () => { if (this.kind === 'room') this.cables([['lamp', [RX - 118, 150, RZ - 60], 2.2, 0xeeeeea], ['fan', [RX - 118, 155, RZ - 50], 2.2, 0xeeeeea]]); },
    ];
  }
  roomDraw(dt) {
    let a = false; const lamp = this.part('lamp'), fan = this.part('fan');
    if (this.bulbM) { const b = lamp ? lamp.state.b || 0 : 0; if (Math.abs(this.bulbM.emissiveIntensity - b * 2.4) > 0.01) { this.bulbM.emissiveIntensity = b * 2.4; this.bulbGlow.material.opacity = b * 0.75; this.pool.material.opacity = b * 0.32; a = true; } }
    if (this.fanRot && fan) { const w = fan.state.w || 0; this.fanRot.rotation.y = -(fan.state.a || 0) * 4; if (w > 0.01) a = true; }
    if (this.irLed) { this.flashIR = Math.max(0, (this.flashIR || 0) - dt); const f = Math.max(this.flashIR, this.sim.flash || 0) > 0 ? 0.9 : 0; if (this.sim.flash) this.sim.flash = Math.max(0, this.sim.flash - dt); if (this.irLed.material.opacity !== f) { this.irLed.material.opacity = f; a = true; } }
    if (this.thief) { // walk in from the door, across the room, and out
      const W = this.sim.walk; const th = this.thief.g, cat = this.cat; th.visible = !!(W && W.who === 'walk'); cat.visible = !!(W && W.who === 'cat');
      if (W) {
        const k = W.t / W.len; const x = 505 - Math.sin(k * Math.PI) * 190, z = -10 + Math.sin(k * Math.PI * 2) * 25; const back = k > 0.5;
        const o = W.who === 'cat' ? cat : th; o.position.set(x, 4, z); o.rotation.y = back ? Math.PI : 0; const sw = Math.sin(W.t * 9) * 0.5;
        if (W.who === 'walk') { this.thief.legs[0].rotation.z = sw; this.thief.legs[1].rotation.z = -sw; this.thief.arms[0].rotation.z = -sw * 0.8; this.thief.arms[1].rotation.z = sw * 0.8; }
        a = true;
      }
    }
    if (this.kind === 'room' && this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['lamp', [282, 150, -105], 2.2, 0xeeeeea], ['fan', [282, 155, -95], 2.2, 0xeeeeea]]); }
    return a;
  }

  // ================================================================== door with the RFID lock
  doorSteps() {
    const r = this.root, S = this.mat; const DX = 345, DZ = -40;
    return [
      () => {
        const g = new THREE.Group(); g.position.set(DX, 0, DZ); const wall = S({ color: 0xe8dcc4, roughness: 0.9 }), frame = S({ color: 0x6a4428, roughness: 0.6 });
        g.add(box(300, 6, 70, S({ color: 0x8a8a86, roughness: 0.8 }), 0, 3, 0)); for (const x of [-110, 110]) g.add(box(80, 220, 18, wall, x, 116, 0)); g.add(box(300, 26, 18, wall, 0, 233, 0));
        for (const x of [-71, 71]) g.add(box(10, 224, 22, frame, x, 118, 0)); g.add(box(152, 10, 22, frame, 0, 227, 0));
        g.add(box(6, 18, 3, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 66, 120, 9)); // the strike plate
        this.still(g); this.blob(320, 110, DX, DZ, 0.3);
        const door = new THREE.Group(); door.position.set(DX - 66, 6, DZ); r.add(door); this.door = door;
        const leaf = new THREE.Group(); leaf.add(box(130, 216, 12, this.wood([0.6, 1.2], 0xd8b890), 65, 108, 0)); leaf.add(box(4, 30, 6, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 118, 110, 9)); leaf.add(cyl(4, 10, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 118, 100, 12, 12).rotateX(Math.PI / 2));
        for (const [y, h] of [[60, 70], [158, 70]]) leaf.add(box(100, h, 2, this.wood([0.4, 0.5], 0xc8a87c), 65, y, 7));
        if (this.kind === 'attend') { // a classroom door: the class's sign on the wall beside it, and no latch servo
          const C = canvas(256, 160); const c = C.getContext('2d'); c.fillStyle = '#1d4aa8'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#fff'; c.font = `800 44px ${TX.FONT}`; c.fillText('CLASS 8-A', 18, 62);
          c.font = `600 22px ${TX.FONT}`; c.fillText('Tap your ID card', 18, 104); c.fillText('कार्ड लगाइए', 18, 138); r.add(box(70, 44, 1.5, S({ map: ctex(C), roughness: 0.6 }), DX + 110, 168, DZ + 9.8)); MD.mergeStatic(leaf); door.add(leaf); return;
        }
        // the servo on the back of the door, near the latch, and the bolt it pulls
        const sv = M2.sg90Body(); sv.rotation.set(Math.PI / 2, 0, 0); sv.position.set(98, 118, -6); leaf.add(sv);
        MD.mergeStatic(leaf); door.add(leaf);
        this.bolt = MD.box(20, 6, 6, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 0, 0, 0); this.bolt.position.set(126, 120, -8); door.add(this.bolt);
      },
      this.cardsStep(),
      () => this.cables([['sv1', [DX + 20, 112, DZ - 14]]]),
    ];
  }
  cardsStep() {
    const r = this.root, S = this.mat;
    return () => { // the card and the tag on the desk (tap one to hold it on the reader)
        const cardM = (() => { const C = canvas(256, 160); const c = C.getContext('2d'); c.fillStyle = '#f6f6f2'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#1d4aa8'; c.fillRect(0, 0, 256, 34); c.fillStyle = '#fff'; c.font = `800 20px ${TX.FONT}`; c.fillText('DUET SCHOOL', 14, 24); c.fillStyle = '#333'; c.font = `600 15px ${TX.FONT}`; c.fillText('STUDENT ID · छात्र', 14, 70); c.fillText('UID ' + CARDS.card.uid.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '), 14, 140); c.fillStyle = '#c9a23a'; c.fillRect(186, 56, 44, 34); return S({ map: ctex(C), roughness: 0.4 }); })();
        const card = new THREE.Group(); card.add(box(85.6, 0.9, 54, [cardM, cardM, cardM, cardM, cardM, cardM], 0, 0.45, 0)); card.position.set(240, 0, 150); card.rotation.y = 0.15; r.add(card);
        const tag = new THREE.Group(); const tm = S({ color: 0x1f5fd8, roughness: 0.4 }); const sh = new THREE.Shape(); sh.absarc(0, 0, 15, Math.PI * 0.15, Math.PI * 1.85, false); sh.lineTo(26, 0); sh.closePath(); const hole = new THREE.Path(); hole.absarc(19, 0, 2.5, 0, Math.PI * 2, true); sh.holes.push(hole);
        const tg = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2 }), tm); tg.rotation.x = -Math.PI / 2; tag.add(tg); tag.position.set(300, 1, 156); r.add(tag);
        for (const [o, id] of [[card, 'card'], [tag, 'tag']]) { const pk = box(60, 10, 46, new THREE.MeshBasicMaterial({ visible: false }), 0, 4, 0); pk.userData.role = 'card3:' + id; o.add(pk); this.picks.push(pk); o.userData.home = o.position.clone(); o.userData.homeR = o.rotation.y; }
        this.cards = { card, tag };
      };
  }
  doorDraw(dt) {
    let a = false; const S = this.sim; const sv = this.part('sv1'); const ang = sv ? sv.state.angle : 0;
    if (this.door && this.bolt) { const ry = -S.door * 70 * D2R; if (Math.abs(this.door.rotation.y - ry) > 1e-4) { this.door.rotation.y = ry; a = true; } const bx = 126 - Math.min(1, ang / 90) * 14; if (Math.abs(this.bolt.position.x - bx) > 0.01) { this.bolt.position.x = bx; a = true; } }
    if (this.cards) a = this.flyCards(dt) || a;
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['sv1', [365, 112, -54]]]); }
    return a;
  }
  // the card being shown flies onto the RFID reader and back
  flyCards(dt) {
    const rf = this.part('rf'); const e = rf && this.app.view.parts.get(rf.uid); const rd = e && e.obj.userData.reader; let a = false;
    for (const id of ['card', 'tag']) {
      const o = this.cards[id]; const on = rf && rf.state.card && rf.state.card.id === id; const k0 = o.userData.k || 0; const k = Math.max(0, Math.min(1, k0 + (on ? dt * 4 : -dt * 3))); o.userData.k = k; if (k === k0) continue; a = true;
      const home = o.userData.home; const tgt = rd ? this.partPoint('rf', rd).add(V3(0, 6, 0)) : home;
      o.position.lerpVectors(home, tgt, k); o.position.y += Math.sin(k * Math.PI) * 40; o.rotation.y = o.userData.homeR * (1 - k);
    }
    return a;
  }

  // ================================================================== the water ATM (batch 24): an RO kiosk with its tap and a glass
  atmSteps() {
    const r = this.root, S = this.mat; const KX = 330, KZ = -30;
    const water = (o) => new THREE.MeshPhysicalMaterial({ color: 0x5aa8f0, roughness: 0.05, transparent: true, opacity: o, depthWrite: false });
    return [
      () => { // the kiosk: a blue steel cabinet, its sign, a steel tap over a drip tray, the RO tank seen through a window
        const g = new THREE.Group(); g.position.set(KX, 0, KZ); const blue = S({ color: 0x1d5fb4, roughness: 0.45, metalness: 0.2 }), steel = S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 });
        g.add(box(150, 230, 90, blue, 0, 115, 0)); g.add(box(156, 8, 96, S({ color: 0x0f3a72, roughness: 0.5 }), 0, 234, 0));
        const C = canvas(512, 200); const c = C.getContext('2d'); c.fillStyle = '#0f3a72'; c.fillRect(0, 0, 512, 200); c.fillStyle = '#fff'; c.font = `800 74px ${TX.FONT}`; c.fillText('WATER ATM', 40, 92);
        c.font = `600 34px ${TX.FONT}`; c.fillStyle = '#9fd2ff'; c.fillText('RO water · Rs 2 a glass', 40, 150); c.fillText('पानी एटीएम', 40, 190);
        g.add(box(130, 50, 1.5, S({ map: ctex(C), roughness: 0.6 }), 0, 200, 45.8));
        const win = canvas(128, 160); const w = win.getContext('2d'); w.fillStyle = '#cfe6f7'; w.fillRect(0, 0, 128, 160); w.fillStyle = '#5aa8f0'; w.fillRect(8, 50, 112, 104); w.fillStyle = 'rgba(255,255,255,0.5)'; w.fillRect(14, 56, 10, 92);
        g.add(box(46, 58, 1.2, S({ map: ctex(win), roughness: 0.2 }), -42, 140, 45.6)); // the clean-water tank inside, seen through a window
        g.add(box(70, 6, 30, steel, 0, 58, 55)); g.add(box(74, 2, 34, S({ color: 0x8c9096, metalness: 1, roughness: 0.4 }), 0, 61.5, 55)); // the drip tray
        g.add(cyl(3.5, 26, steel, 0, 112, 45 + 13, 14).rotateX(Math.PI / 2)); g.add(cyl(3, 14, steel, 0, 105, 70, 12)); // the tap: out of the cabinet, then down
        this.still(g); this.blob(180, 120, KX, KZ, 0.3);
        // the glass on the tray and the water in it (filled by atmDraw), the stream from the tap
        const glass = new THREE.MeshPhysicalMaterial({ color: 0xf2f8ff, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
        const G = new THREE.Group(); G.position.set(KX, 62.5, KZ + 70); r.add(G);
        G.add(new THREE.Mesh(new THREE.CylinderGeometry(9, 7.5, 24, 24, 1, true), glass).translateY(12)); G.add(new THREE.Mesh(new THREE.CircleGeometry(7.5, 24), glass).rotateX(-Math.PI / 2).translateZ(0.2));
        this.atmWater = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 7.6, 1, 24), water(0.75)); this.atmWater.visible = false; G.add(this.atmWater);
        this.atmStream = cyl(1.3, 1, water(0.6), 0, 0, 0, 8); this.atmStream.visible = false; r.add(this.atmStream); this.atmTap = V3(KX, 98, KZ + 70);
        this.atmSpill = new THREE.Mesh(new THREE.CircleGeometry(16, 24), water(0.45)); this.atmSpill.rotation.x = -Math.PI / 2; this.atmSpill.position.set(KX, 61.7, KZ + 70); this.atmSpill.visible = false; r.add(this.atmSpill);
        const pvc = S({ color: 0xf0f0ea, roughness: 0.5 }); r.add(tube([V3(195, 16, 140), V3(240, 40, 120), V3(KX - 60, 30, KZ + 50), V3(KX - 75, 40, KZ + 20)], 2.2, pvc, 30, 8)); // the pump's pipe into the kiosk
      },
      this.cardsStep(),
      () => this.cables([['pump', [200, 16, 140], 1.4, 0x1b1b1d]]),
    ];
  }
  atmDraw(dt) {
    const S = this.sim; const ml = Math.min(S.ml || 0, 300); let a = false; const f = this.part('pump') ? this.part('pump').state.flow || 0 : 0;
    if (this.atmWater) {
      const h = (ml / 300) * 23; const vis = h > 0.15; if (this.atmWater.visible !== vis) { this.atmWater.visible = vis; a = true; }
      if (vis && Math.abs(this.atmWater.scale.y - h) > 0.01) { this.atmWater.scale.y = h; this.atmWater.position.y = h / 2 + 0.3; a = true; }
      const on = f > 1; if (this.atmStream.visible !== on) { this.atmStream.visible = on; a = true; }
      if (on) { const top = this.atmTap.y, bot = 62.5 + h + 0.5; this.atmStream.scale.set(Math.min(1, f / 30), top - bot, Math.min(1, f / 30)); this.atmStream.position.set(this.atmTap.x, (top + bot) / 2, this.atmTap.z); a = true; }
      const sp = (S.ml || 0) > 300; if (this.atmSpill.visible !== sp) { this.atmSpill.visible = sp; a = true; }
    }
    if (this.cards) a = this.flyCards(dt) || a;
    return a;
  }

  // ================================================================== the rotary vending machine (batch 24): a tray of six compartments
  // on the stepper's shaft, under a smoked cover with one door at the front; compartment k comes to the door at (k − 1) × 60°
  vendSteps() {
    const r = this.root, S = this.mat; const R0 = 58;
    return [
      () => {
        const t = new THREE.Group(); r.add(t); this.vt = t; t.visible = false;
        t.add(cyl(32, 19, S({ color: 0x2a2b2e, roughness: 0.5 }), 0, 9.5, 8, 28)); // the motor's holder
        t.add(cyl(R0 + 10, 3, S({ color: 0x1d2a3a, roughness: 0.6 }), 0, 1.5, 0, 40)); // the base plate
        const tray = new THREE.Group(); tray.position.y = 31; t.add(tray); this.vtray = tray;
        const plastic = S({ color: 0xe9eef3, roughness: 0.5 }); tray.add(cyl(R0, 4, plastic, 0, 2, 0, 48));
        const C = canvas(512, 512); const c = C.getContext('2d'); c.translate(256, 256); c.fillStyle = '#dfe6ee'; c.beginPath(); c.arc(0, 0, 250, 0, 7); c.fill();
        c.font = `800 54px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1d4aa8';
        const ITEM = [[0xf2c230, 'box'], [0xc8281c, 'box'], [0xf08c1e, 'tall'], [0x5a3418, 'bar'], [0x3c8a3a, 'box'], [0x4aa3e8, 'bottle']];
        for (let k = 0; k < 6; k++) {
          const ang = (k * 60) * D2R; // compartment k + 1, its centre at this angle from the front (+z)
          const cx = Math.sin(ang), cz = Math.cos(ang);
          c.save(); c.rotate(-ang + Math.PI); c.fillText(String(k + 1), 0, -200); c.restore();
          const wall = box(R0, 22, 2, S({ color: 0xc9d3dd, roughness: 0.4 }), 0, 0, 0); const wa = ang + 30 * D2R; wall.position.set(Math.sin(wa) * R0 / 2, 15, Math.cos(wa) * R0 / 2); wall.rotation.y = wa + Math.PI / 2; tray.add(wall);
          const [col, kind] = ITEM[k]; const m = S({ color: col, roughness: 0.55 }); let it;
          if (kind === 'bottle') { it = new THREE.Group(); it.add(cyl(6, 22, S({ color: col, roughness: 0.15, transparent: true, opacity: 0.7 }), 0, 11, 0, 16)); it.add(cyl(2.4, 4, S({ color: 0xf4f4f4, roughness: 0.4 }), 0, 24, 0, 10)); }
          else if (kind === 'tall') it = box(12, 22, 8, m, 0, 11, 0); else if (kind === 'bar') it = box(16, 4, 9, m, 0, 2, 0); else it = box(16, 16, 6, m, 0, 8, 0);
          it.position.x += cx * R0 * 0.62; it.position.z += cz * R0 * 0.62; it.position.y += 4; it.rotation.y = ang; tray.add(it);
        }
        tray.add(new THREE.Mesh(new THREE.CircleGeometry(R0 - 0.5, 48), S({ map: ctex(C), roughness: 0.7 })).rotateX(-Math.PI / 2).translateZ(4.1));
        // the cover: smoked acrylic all round except the door (60° at the front), a lid, the sign
        const smoke = new THREE.MeshPhysicalMaterial({ color: 0x223040, roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
        const cov = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 4, R0 + 4, 30, 48, 1, true, 30 * D2R, 300 * D2R), smoke); cov.position.y = 31 + 4 + 15; t.add(cov);
        const lid = new THREE.Mesh(new THREE.CircleGeometry(R0 + 4, 48), new THREE.MeshPhysicalMaterial({ color: 0x223040, roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false })); lid.rotation.x = -Math.PI / 2; lid.position.y = 31 + 4 + 30; t.add(lid);
        const SC = canvas(256, 64); const sc = SC.getContext('2d'); sc.fillStyle = '#c8281c'; sc.fillRect(0, 0, 256, 64); sc.fillStyle = '#fff'; sc.font = `800 40px ${TX.FONT}`; sc.textAlign = 'center'; sc.fillText('SNACKS', 128, 46);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(50, 12.5), S({ map: ctex(SC), roughness: 0.6 })); sign.position.set(0, 31 + 4 + 38, R0 * 0.3); sign.rotation.x = -0.5; t.add(sign);
        for (const sx of [-1, 1]) { const post = box(3, 30, 3, S({ color: 0x8a96a3, metalness: 0.6, roughness: 0.4 }), Math.sin(sx * 30 * D2R) * (R0 + 4), 31 + 4 + 15, Math.cos(sx * 30 * D2R) * (R0 + 4)); t.add(post); } // the door's two edges
      },
    ];
  }
  vendDraw() {
    const st = this.part('st'); if (!this.vt) return false; this.vt.visible = !!st; if (!st) return false;
    const e = this.app.view.parts.get(st.uid); const sh = e && e.obj.userData.shaft; if (!sh) return false;
    const p = this.partPoint('st', sh); const a = this.sim.ang || 0; const k = [p.x, p.z, a].map((x) => Math.round(x * 100)).join(); if (k === this._vk) return false; this._vk = k;
    this.vt.position.set(p.x, 0, p.z); this.vtray.rotation.y = -a * D2R; return true; // (a point at angle ψ turned by θ about y ends at ψ + θ: compartment k reaches the door, 0°, at a = (k − 1) × 60°)
  }

  // ================================================================== the dual-axis solar tracker (batch 24): the pan-tilt head of the
  // laser lesson carries a solar panel with the 4-LDR sensor (its black cross) on its top edge; the sun crosses the sky
  trackerSteps() {
    const r = this.root, S = this.mat; const H = this.trHead = V3(300, 112, 40);
    return [
      () => { // the stand, a patch of roof, and the fixed panel beside it for comparison
        const blk = S({ color: 0x1b1b1d, roughness: 0.4 }); const g = new THREE.Group(); g.add(box(60, 6, 60, blk, H.x, 3, H.z)); g.add(cyl(5, 72, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), H.x, 42, H.z, 12)); g.add(box(30, 6, 30, blk, H.x, 80, H.z));
        const roof = S({ color: 0xb9b2a6, roughness: 0.95 }); g.add(box(260, 2, 160, roof, H.x + 20, 1, H.z - 30));
        this.still(g); this.blob(120, 120, H.x, H.z, 0.35);
        // the fixed panel (az 0, 30° up) for comparison
        const fx = new THREE.Group(); fx.position.set(H.x + 110, 0, H.z - 30); fx.add(box(4, 40, 4, blk, -30, 20, 10)); fx.add(box(4, 40, 4, blk, 30, 20, 10));
        const fp = this.panelMesh(S); fp.position.set(0, 46, 0); fp.rotation.set(30 * D2R, Math.PI, 0, 'YXZ'); fx.add(fp); r.add(fx);
        const C = canvas(256, 64); const c = C.getContext('2d'); c.fillStyle = '#333'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#fff'; c.font = `700 30px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('FIXED', 128, 44);
        const lb = new THREE.Mesh(new THREE.PlaneGeometry(30, 7.5), S({ map: ctex(C), roughness: 0.6 })); lb.position.set(H.x + 110, 8, H.z - 4); r.add(lb);
      },
      () => { // the pan-tilt head and its panel
        const pan = new THREE.Group(); pan.position.set(H.x, 83, H.z); r.add(pan); const b1 = M2.sg90Body(); b1.position.set(5.6, 0, 0); MD.mergeStatic(b1); pan.add(b1);
        const yaw = new THREE.Group(); yaw.position.set(0, 29, 0); pan.add(yaw); this.trYaw = yaw; const alu = S({ color: 0x1b1b1d, roughness: 0.5 });
        const br = new THREE.Group(); br.add(box(36, 3, 16, alu, 0, 0, 0)); for (const sgn of [-1, 1]) br.add(box(3, 30, 16, alu, sgn * 18, 15, 0)); const b2 = M2.sg90Body(); b2.rotation.z = Math.PI / 2; b2.position.set(-30, 20, 0); br.add(b2); MD.mergeStatic(br); yaw.add(br);
        const pitch = new THREE.Group(); pitch.position.set(0, 34, 0); yaw.add(pitch); this.trPitch = pitch;
        const pn = this.panelMesh(S); pn.position.set(0, 0, -6); pitch.add(pn);
        // the 4-LDR sensor on the panel's top edge: a small white board, four orange LDR faces, the black cross between them
        const sb = new THREE.Group(); sb.position.set(0, 36, -9); pitch.add(sb); sb.add(box(16, 16, 1.5, S({ color: 0xf2f2ee, roughness: 0.5 }), 0, 0, 0));
        for (const [x, y] of [[-4, 4], [4, 4], [-4, -4], [4, -4]]) sb.add(cyl(2.2, 1, S({ color: 0xd8a94a, roughness: 0.4 }), x, y, -1, 12).rotateX(Math.PI / 2));
        sb.add(box(16, 1.2, 8, alu, 0, 0, -4)); sb.add(box(1.2, 16, 8, alu, 0, 0, -4));
        this.trSun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffd060, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); this.trSun.scale.setScalar(50); r.add(this.trSun);
        this.trCore = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1b0, toneMapped: false })); r.add(this.trCore);
      },
      () => this.cables([['svP', [H.x + 8, 92, H.z]], ['svT', [H.x - 26, 120, H.z]], ['ldr4', [H.x, 132, H.z - 4]]]),
    ];
  }
  panelMesh(S) { // a small 6 V panel: dark blue cells in a silver frame, facing −z
    const C = canvas(256, 160); const c = C.getContext('2d'); c.fillStyle = '#c9ccd2'; c.fillRect(0, 0, 256, 160);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = 8 + i * 41, y = 8 + j * 37; c.fillStyle = '#16233f'; c.fillRect(x, y, 38, 34); c.strokeStyle = '#3c5486'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, 37, 33); }
    const face = S({ map: ctex(C), roughness: 0.25, metalness: 0.2 }); const fr = S({ color: 0xd9dce0, metalness: 0.1, roughness: 0.6 }), back = S({ color: 0xb8bcc2, roughness: 0.7 });
    return box(96, 60, 3, [fr, fr, fr, fr, back, face], 0, 0, 0);
  }
  trackerDraw() {
    if (!this.trYaw) return false; const S = this.sim; const sv = this.part('svP'), st = this.part('svT'); const p = sv ? sv.state.angle : 90, t = st ? st.state.angle : 120;
    const key = [p, t, S.az, S.el, S.cloud ? 1 : 0].map((x) => Math.round(x * 10)).join();
    if (this.lab.version !== this._v) { this._v = this.lab.version; const H = this.trHead; this.cables([['svP', [H.x + 8, 92, H.z]], ['svT', [H.x - 26, 120, H.z]], ['ldr4', [H.x, 132, H.z - 4]]]); }
    if (key === this._trk) return false; this._trk = key;
    // (the whole sky is turned half round about the stand, so the sun crosses in front and the panel's cells face the student)
    this.trYaw.rotation.y = (p - 90) * D2R + Math.PI; this.trPitch.rotation.x = (t - 90) * D2R;
    const a = S.az * D2R, e = S.el * D2R; const d = V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); const pos = this.trHead.clone().addScaledVector(d, 125);
    this.trSun.position.copy(pos); this.trCore.position.copy(pos); this.trSun.material.opacity = S.cloud ? 0.25 : 1; this.trCore.visible = !S.cloud;
    return true;
  }

  // ================================================================== the mini lift (batch 24): a three-floor shaft beside the bench, the
  // car on its cable from the pulley at the top, landing doors, the limit switch at the bottom (its red lever)
  liftSteps() {
    const r = this.root, S = this.mat; const X0 = 300, Z0 = -20, Y0 = 18, K = 1.15; this.liftAt = { X0, Z0, Y0, K }; // (1 mm of the model = K units on screen)
    const H = 3 * LIFT.floor * K + 40;
    return [
      () => { // the shaft: four posts, the floor slabs G, 1, 2 with their labels and doors, the pulley at the top
        const g = new THREE.Group(); g.position.set(X0, 0, Z0); const steel = S({ color: 0x9aa3ad, metalness: 0.6, roughness: 0.4 }), slab = S({ color: 0xd9d4c8, roughness: 0.85 });
        g.add(box(110, Y0, 90, S({ color: 0x6d6a64, roughness: 0.9 }), 0, Y0 / 2, 0)); // the base (the pit is inside it)
        for (const [x, z] of [[-32, -26], [32, -26], [-32, 26], [32, 26]]) g.add(box(4, H, 4, steel, x, Y0 + H / 2, z));
        g.add(box(72, 4, 60, steel, 0, Y0 + H, 0));
        for (let f = 0; f < 3; f++) {
          const y = Y0 + f * LIFT.floor * K; g.add(box(40, 3, 70, slab, 56, y - 1.5, 0)); // the landing beside the shaft
          const C = canvas(64, 64); const c = C.getContext('2d'); c.fillStyle = '#1d4aa8'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.font = `800 46px ${TX.FONT}`; c.textAlign = 'center'; c.fillText(f ? String(f) : 'G', 32, 50);
          g.add(box(14, 14, 1, S({ map: ctex(C), roughness: 0.6 }), 36, y + LIFT.floor * K - 22, 34)); // the floor's sign
          g.add(box(2, LIFT.floor * K - 18, 1, S({ color: 0x2b2d31, roughness: 0.5 }), 35, y + (LIFT.floor * K - 18) / 2, 30)); // the landing door's edge
        }
        g.add(cyl(12, 10, S({ color: 0x2a2b2e, roughness: 0.5 }), 0, Y0 + H + 10, -30, 24).rotateX(Math.PI / 2)); // the pulley at the top
        // the limit switch at the bottom of the shaft: a black body and its red lever
        g.add(box(10, 6, 8, S({ color: 0x1b1b1d, roughness: 0.5 }), 20, Y0 + 3, 20)); g.add(box(12, 1.5, 3, S({ color: 0xc8281c, roughness: 0.5 }), 14, Y0 + 7, 20));
        this.still(g); this.blob(130, 110, X0, Z0, 0.35);
        // the car (moves), its cable up to the pulley
        const car = new THREE.Group(); r.add(car); this.liftCar = car; const shell = S({ color: 0xf2b630, roughness: 0.5 });
        car.add(box(56, 3, 48, shell, 0, 1.5, 0)); car.add(box(56, 3, 48, shell, 0, 40.5, 0)); car.add(box(3, 40, 48, shell, -27, 21, 0)); car.add(box(56, 40, 3, shell, 0, 21, -23));
        car.add(box(3, 40, 48, new THREE.MeshPhysicalMaterial({ color: 0xcfe7ff, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }), 27, 21, 0));
        const fig = new THREE.Group(); fig.add(cyl(5, 18, S({ color: 0x2f6fd8, roughness: 0.6 }), 0, 10, 0, 10)); fig.add(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 10), S({ color: 0xc68a63, roughness: 0.7 })).translateY(23)); fig.position.set(-6, 3, 4); car.add(fig);
        this.liftCable = cyl(0.6, 1, S({ color: 0x222222, roughness: 0.5 }), 0, 0, 0, 6); r.add(this.liftCable);
      },
      () => this.cables([['st', [X0, Y0 + H + 10, Z0 - 40], 1.4, 0x1b1b1d]]),
    ];
  }
  liftDraw() {
    if (!this.liftCar) return false; const { X0, Z0, Y0, K } = this.liftAt; const h = this.sim.h ?? LIFT.h0; const k = Math.round(h * 20); if (k === this._lk) return false; this._lk = k;
    const y = Y0 + Math.max(-4, h) * K; this.liftCar.position.set(X0, y, Z0); const top = Y0 + 3 * LIFT.floor * K + 40 + 10, len = top - (y + 42);
    this.liftCable.scale.set(1, Math.max(1, len), 1); this.liftCable.position.set(X0, y + 42 + len / 2, Z0); return true;
  }

  // ================================================================== the conveyor belt (batch 24): a rubber belt on two rollers in an
  // aluminium frame, the 28BYJ-48 on the drive roller's end, the IR sensor on the near rail looking across the belt, the
  // stamp on its bridge (the SG90 pushes it down), cardboard boxes, the blue crate at the end
  convSteps(opt = {}) { // (opt.pick: the pick-and-place line: no stamp, the IR at the stop plate, no crate at the end)
    const r = this.root, S = this.mat; const X0 = 232, Z0 = -6, YB = 40, R = CONV.roller / 2, Wd = 50, L = CONV.len; const YA = YB - R;
    const zr = Z0 + Wd / 2 + 5; this.cvAt = { X0, Z0, YB, R, Wd, L, YA, zr };
    return [
      () => { // the frame: two side rails, legs, the crate at the end
        const g = new THREE.Group(); const alu = S({ color: 0xbfc6ce, metalness: 0.7, roughness: 0.35 }), dark = S({ color: 0x2a2b2e, roughness: 0.5 });
        for (const z of [Z0 - Wd / 2 - 5, zr]) { g.add(box(L + 2 * R + 14, 16, 5, alu, X0 + L / 2, YA, z)); g.add(box(L + 2 * R + 14, 2, 6, dark, X0 + L / 2, YA + 8.5, z)); } // the rails, their top edges
        for (const x of [X0 + 6, X0 + L - 6]) for (const z of [Z0 - Wd / 2 - 5, zr]) { g.add(box(6, YA - 8, 6, alu, x, (YA - 8) / 2, z)); g.add(box(14, 2, 14, dark, x, 1, z)); }
        g.add(box(6, 6, Wd + 16, alu, X0 + L / 2, 12, Z0)); // a cross-brace
        // the blue crate after the drive roller (the pick-and-place line: a crate beside the end, and a stop plate across the belt)
        const blue = S({ color: 0x2a6fd0, roughness: 0.55 }); const CW = 60, CD = 64, CH = 26; const cx = opt.pick ? X0 + PICK.stop - CONV.box / 2 - PICK.arm : X0 + L + 48, cy = 0, cz = opt.pick ? Z0 + PICK.arm : Z0; // (the arm swings from the belt, −z of its post, round to −x)
        const cd = opt.pick ? 50 : CD; g.add(box(CW, 2, cd, blue, cx, cy + 1, cz)); for (const sx of [-1, 1]) g.add(box(2.5, CH, cd, blue, cx + sx * CW / 2, cy + CH / 2, cz)); for (const sz of [-1, 1]) g.add(box(CW, CH, 2.5, blue, cx, cy + CH / 2, cz + sz * cd / 2));
        this.cvCrate = { x: cx, y: cy + 2, z: cz };
        if (opt.pick) g.add(box(4, 30, Wd + 14, S({ color: 0xd8a020, roughness: 0.5 }), X0 + PICK.stop + 2, YB + 15, Z0)); // the stop plate
        this.still(g); this.blob(L + 120, Wd + 70, X0 + L / 2 + 20, Z0, 0.3);
      },
      () => { // the belt (its texture runs), the rollers (they turn)
        const C = canvas(128, 64); const c = C.getContext('2d'); c.fillStyle = '#1d1e20'; c.fillRect(0, 0, 128, 64); grain(c, 128, 64, 0.08, 600);
        c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 6; for (let i = -1; i < 3; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 32, 32); c.lineTo(i * 64, 64); c.stroke(); } // chevrons
        const tex = ctex(C, [L / 40, 1]); this.cvBeltT = tex; const rub = S({ map: tex, roughness: 0.85 });
        const top = new THREE.Mesh(new THREE.PlaneGeometry(L, Wd), rub); top.rotation.x = -Math.PI / 2; top.position.set(X0 + L / 2, YB, Z0); r.add(top);
        const tex2 = tex.clone(); tex2.needsUpdate = true; this.cvBeltB = tex2; const bot = new THREE.Mesh(new THREE.PlaneGeometry(L, Wd), S({ map: tex2, roughness: 0.85 })); bot.rotation.x = Math.PI / 2; bot.position.set(X0 + L / 2, YA - R, Z0); r.add(bot);
        const plain = S({ color: 0x1d1e20, roughness: 0.85 });
        for (const [x, t0] of [[X0, Math.PI / 2], [X0 + L, -Math.PI / 2]]) { const sh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, Wd, 24, 1, true, t0, Math.PI), plain); sh.rotation.x = Math.PI / 2; sh.position.set(x, YA, Z0); r.add(sh); } // round each roller
        const RC = canvas(64, 64); const rc = RC.getContext('2d'); rc.fillStyle = '#9aa3ad'; rc.beginPath(); rc.arc(32, 32, 32, 0, 7); rc.fill(); rc.strokeStyle = '#5d646c'; rc.lineWidth = 5; for (let k = 0; k < 3; k++) { const a = k * 2.094; rc.beginPath(); rc.moveTo(32, 32); rc.lineTo(32 + 28 * Math.cos(a), 32 + 28 * Math.sin(a)); rc.stroke(); } rc.fillStyle = '#3a3f45'; rc.beginPath(); rc.arc(32, 32, 6, 0, 7); rc.fill();
        const endM = S({ map: ctex(RC), roughness: 0.4, metalness: 0.5 }), side = S({ color: 0x9aa3ad, metalness: 0.6, roughness: 0.35 });
        this.cvRollers = [X0, X0 + L].map((x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(R - 1, R - 1, Wd + 9, 20), [side, endM, endM]); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.position.set(x, YA, Z0); g.add(m); r.add(g); return g; });
      },
      () => { // the 28BYJ-48 on the drive roller's near end (its shaft along z), on a bracket
        const mo = new THREE.Group(); mo.position.set(X0 + L, YA, zr + 3); r.add(mo); this.cvMotor = mo; const can = S({ color: 0xc9ced4, metalness: 0.8, roughness: 0.3 }), cap = S({ color: 0x2a62c8, roughness: 0.5 });
        const body = new THREE.Group(); body.rotation.x = Math.PI / 2; body.position.z = 1; mo.add(body); // (its y is the motor's axis: along +z, away from the belt)
        body.add(cyl(14, 19, can, 0, 9.5 + 1, -8, 28)); body.add(box(7, 0.8, 49, can, 0, 1, -8)); for (const sg of [-1, 1]) body.add(cyl(3.5, 0.8, can, 0, 1, -8 + sg * 21, 16));
        body.add(cyl(14.2, 1.4, cap, 0, 20.3, -8, 28)); body.add(box(16, 6, 16, cap, 0, 13, 6.5));
        mo.add(box(44, 30, 2, S({ color: 0xbfc6ce, metalness: 0.7, roughness: 0.35 }), -4, 0, 0)); // the bracket on the rail
        this.cvWireAt = V3(X0 + L, YA - 8, zr + 30);
      },
      opt.pick ? () => {} : () => { // the stamp: a bridge over the belt, the SG90 on it, the stamp head on its rod (it moves)
        const xs = X0 + CONV.stamp, alu = S({ color: 0xbfc6ce, metalness: 0.7, roughness: 0.35 }); const g = new THREE.Group(); const HB = YB + 78;
        for (const z of [Z0 - Wd / 2 - 5, zr]) g.add(box(6, HB - YA, 6, alu, xs, (HB + YA) / 2, z)); g.add(box(14, 5, Wd + 16, alu, xs, HB, Z0));
        const sv = M2.sg90Body(); sv.rotation.y = Math.PI / 2; sv.position.set(xs, HB + 2.5, Z0 + 4); g.add(sv);
        g.add(box(3, 22, 3, S({ color: 0x8a96a3, metalness: 0.7, roughness: 0.35 }), xs - 8, HB - 12, Z0)); g.add(box(3, 22, 3, S({ color: 0x8a96a3, metalness: 0.7, roughness: 0.35 }), xs + 8, HB - 12, Z0)); // guide rods
        this.still(g);
        const head = new THREE.Group(); r.add(head); this.cvHead = head; const red = S({ color: 0xc8281c, roughness: 0.45 });
        head.add(box(16, 3, 22, S({ color: 0x1b1b1d, roughness: 0.8 }), 0, 1.5, 0)); head.add(box(18, 9, 24, S({ color: 0x8b5a2b, roughness: 0.6 }), 0, 7.5, 0)); head.add(cyl(3, 22, red, 0, 23, 0, 12)); head.add(new THREE.Mesh(new THREE.SphereGeometry(5.5, 14, 10), red).translateY(35));
        head.add(box(28, 2, 2, S({ color: 0x8a96a3, metalness: 0.7, roughness: 0.35 }), 0, 28, 0));
        this.cvHeadAt = { x: xs, z: Z0, HB };
      },
      () => { // the IR sensor on the near rail: its board out over the rail, the two LEDs looking across the belt
        const xi = X0 + (opt.pick ? PICK.ir : CONV.ir), yi = YB + 12, z0 = Z0 + Wd / 2 + 1; const g = new THREE.Group(); g.position.set(xi, yi, z0); r.add(g);
        const pcbC = canvas(64, 128); const pc = pcbC.getContext('2d'); pc.fillStyle = '#1b1d22'; pc.fillRect(0, 0, 64, 128); pc.fillStyle = '#ddd'; pc.font = `700 9px ${TX.FONT}`; pc.textAlign = 'center'; pc.fillText('IR', 32, 70); pc.fillText('VCC GND OUT', 32, 118);
        g.add(box(14, 1.6, 32, [MD.materials().fr4, MD.materials().fr4, S({ map: ctex(pcbC), roughness: 0.45 }), MD.materials().fr4, MD.materials().fr4, MD.materials().fr4], 0, 0, 18));
        g.add(box(6.5, 4.6, 6.8, S({ color: 0x2a62c8, roughness: 0.5 }), 0, 3, 24)); // the trimmer
        const clear = S({ color: 0xd8d8ff, roughness: 0.15, transparent: true, opacity: 0.6 }); const ledA = cyl(2.5, 5, clear, -3.2, 2, 0, 16); ledA.rotation.x = Math.PI / 2; g.add(ledA);
        const ledB = cyl(2.5, 5, S({ color: 0x111111, roughness: 0.2 }), 3.2, 2, 0, 16); ledB.rotation.x = Math.PI / 2; g.add(ledB);
        this.cvDet = new THREE.MeshStandardMaterial({ color: 0xf2efe0, emissive: 0x33ff55, emissiveIntensity: 0, roughness: 0.3 }); this.cvPwr = new THREE.MeshStandardMaterial({ color: 0xf2efe0, emissive: 0xff2a1a, emissiveIntensity: 0, roughness: 0.3 });
        g.add(box(1.6, 0.8, 0.9, this.cvDet, 3.5, 1.1, 12)); g.add(box(1.6, 0.8, 0.9, this.cvPwr, -3.5, 1.1, 12));
        g.add(box(10, 14, 3, S({ color: 0x2a2b2e, roughness: 0.5 }), 0, -8, 30)); // its bracket on the rail
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.2, Wd), new THREE.MeshBasicMaterial({ color: 0xff3a6a, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false })); beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0, -Wd / 2); g.add(beam); this.cvBeam = beam;
        this.cvIrAt = V3(xi, yi, z0 + 34);
      },
      () => { // the boxes (cardboard, a strip of tape; a sheet on top for the stamps), the marks on the belt
        const C = canvas(64, 64); const c = C.getContext('2d'); c.fillStyle = '#b98a55'; c.fillRect(0, 0, 64, 64); grain(c, 64, 64, 0.08, 300); c.strokeStyle = 'rgba(80,50,20,0.35)'; c.lineWidth = 2; c.strokeRect(1, 1, 62, 62);
        const side = S({ map: ctex(C), roughness: 0.85 });
        this.cvBoxes = Array.from({ length: CONV.n }, () => {
          const g = new THREE.Group(); g.visible = false; r.add(g); g.add(box(CONV.box, CONV.boxH, 26, side, 0, CONV.boxH / 2, 0));
          const TC = canvas(128, 112); const tex = ctex(TC); const top = new THREE.Mesh(new THREE.PlaneGeometry(CONV.box, 26), S({ map: tex, roughness: 0.8 })); top.rotation.x = -Math.PI / 2; top.position.y = CONV.boxH + 0.05; g.add(top);
          return { g, TC, tex, n: -1, vis: false, showT: 0 };
        });
        const MC = canvas(64, 48); const mc = MC.getContext('2d'); this.stampMark(mc, 32, 24, 0, 1); const mm = new THREE.MeshBasicMaterial({ map: ctex(MC), transparent: true, depthWrite: false });
        this.cvMarks = Array.from({ length: 16 }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 10.5), mm); m.rotation.x = -Math.PI / 2; m.visible = false; r.add(m); return m; });
      },
      () => this.cables(opt.pick ? this.pickCables() : [['st', [this.cvWireAt.x, this.cvWireAt.y, this.cvWireAt.z], 1.6, 0x2a62c8], ['sv', [X0 + CONV.stamp, YB + 82, Z0 + 18]], ['ir1', [this.cvIrAt.x, this.cvIrAt.y, this.cvIrAt.z]]]),
    ];
  }
  // ================================================================== the pick-and-place line (batch 24): the conveyor (convSteps with
  // opt.pick), a two-servo arm on a post beside the stop: the swing servo turns the arm over the belt or the crate, the
  // lift servo lowers the suction cup on its rod; the vacuum pump and its tube on the desk behind
  pickSteps() {
    const A = () => this.cvAt; const steps = this.convSteps({ pick: true });
    steps.splice(steps.length - 1, 0, () => {
      const S = this.mat, r = this.root, C = A(); const px = C.X0 + PICK.stop - CONV.box / 2, pz = C.Z0 + PICK.arm; this.pkAt = { px, pz, arm: PICK.arm }; // the post: PICK.arm from the belt's middle (its −z) and from the crate (its −x)
      const g = new THREE.Group(); const dark = S({ color: 0x2a2b2e, roughness: 0.5 }), alu = S({ color: 0xbfc6ce, metalness: 0.7, roughness: 0.35 });
      g.add(box(24, 4, 24, dark, px, 2, pz)); g.add(cyl(5, 98, alu, px, 51, pz, 14)); this.still(g);
      const sw = new THREE.Group(); sw.position.set(px, 100, pz); r.add(sw); this.pkSwing = sw; const b1 = M2.sg90Body(); b1.position.set(5.6, -26, 0); MD.mergeStatic(b1); sw.add(b1); // (its horn on top turns the arm)
      const arm = new THREE.Group(); sw.add(arm); arm.add(box(10, 6, PICK.arm + 8, S({ color: 0xe8e8e2, roughness: 0.5 }), 0, 6, -PICK.arm / 2)); // the arm, pointing at the belt (−z) when the swing is at 0°
      const b2 = M2.sg90Body(); b2.rotation.x = -Math.PI / 2; b2.scale.setScalar(0.8); b2.position.set(10, 8, -PICK.arm + 8); MD.mergeStatic(b2); arm.add(b2);
      const rod = new THREE.Group(); rod.position.set(0, 0, -PICK.arm); arm.add(rod); this.pkRod = rod; rod.add(cyl(2, 60, alu, 0, -20, 0, 10)); rod.add(cyl(6, 6, S({ color: 0x1b1b1d, roughness: 0.6 }), 0, -52, 0, 16)); // the rod and the black rubber cup
      // the vacuum pump and its tube on the desk behind the post
      const pump = new THREE.Group(); pump.position.set(px + 40, 0, pz + 24); pump.add(box(26, 18, 18, S({ color: 0x2b2c30, roughness: 0.5 }), 0, 9, 0)); pump.add(cyl(9, 22, S({ color: 0xc9ced4, metalness: 0.7, roughness: 0.3 }), -18, 9, 0, 16).rotateZ(Math.PI / 2)); r.add(pump);
      const tube = this.mat({ color: 0xd8e4ea, roughness: 0.3, transparent: true, opacity: 0.8 }); r.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(px + 28, 12, pz + 24), V3(px + 14, 40, pz + 14), V3(px, 108, pz)]), 20, 1.6, 8, false), tube));
      this.pkPumpAt = V3(px + 40, 10, pz + 34);
    });
    return steps;
  }
  pickCables() { const C = this.cvAt, P = this.pkAt || { px: C.X0 + PICK.stop - CONV.box / 2, pz: C.Z0 + PICK.arm }; return [['st', [this.cvWireAt.x, this.cvWireAt.y, this.cvWireAt.z], 1.6, 0x2a62c8], ['ir1', [this.cvIrAt.x, this.cvIrAt.y, this.cvIrAt.z]], ['svS', [P.px, 74, P.pz + 6]], ['svL', [P.px + 4, 80, P.pz + 8]]]; }
  pickDraw() {
    if (!this.cvBoxes || !this.pkSwing) return false; const S = this.sim, A = this.cvAt, P = this.pkAt; const s = S.s || 0; let ch = false;
    if (this.lab.version !== this._pkv) { this._pkv = this.lab.version; this.cables(this.pickCables()); ch = true; }
    if (s !== this._cvs) { this._cvs = s; this.cvBeltT.offset.x = -s / 40; this.cvBeltB.offset.x = s / 40; for (const g of this.cvRollers) g.rotation.z = -s / (A.R - 1); ch = true; }
    const sw = S.sw ?? 0, li = S.li ?? 90; const key = [sw, li].map((v) => Math.round(v * 10)).join();
    const h = S.cupH(li); // (mm above the belt)
    if (key !== this._pkk) { this._pkk = key; this.pkSwing.rotation.y = sw * D2R; this.pkRod.position.y = A.YB + h + 55 - 100; ch = true; } // (the swing turns the arm from −z round to −x; the cup's bottom, 55 mm below the arm, at the cup's height)
    const ir = this.part('ir1'); const pw = !!(ir && ir.state.powered), nr = !!(ir && ir.state.near); const k2 = (pw ? 1 : 0) + (nr ? 2 : 0);
    if (k2 !== this._cvk) { this._cvk = k2; this.cvPwr.emissiveIntensity = pw ? 2.2 : 0; this.cvDet.emissiveIntensity = nr ? 2.6 : 0; this.cvBeam.visible = pw; ch = true; }
    // the boxes: on the belt, on the cup, in the crate, on the floor
    let inCrate = 0, onFloor = 0; const a = sw * D2R; const cup = V3(P.px - Math.sin(a) * P.arm, A.YB + h, P.pz - Math.cos(a) * P.arm);
    S.boxes.forEach((b, i) => {
      const o = this.cvBoxes[i]; if (!o) return; let vis = true, x = 0, y = A.YB, z = A.Z0, ry = 0, rz = 0;
      if (b.st === 'belt') { const back = b.f - CONV.box; vis = back >= 2; x = A.X0 + b.f - CONV.box / 2; }
      else if (b.st === 'held') { x = cup.x; y = cup.y - CONV.boxH; z = cup.z; ry = a; }
      else if (b.st === 'crate') { const kk = inCrate++; x = this.cvCrate.x + (kk % 2 ? 15 : -15); y = this.cvCrate.y + Math.floor(kk / 2) * CONV.boxH; z = this.cvCrate.z; }
      else { const kk = onFloor++; x = P.px - 34 - kk * 9; y = 13; z = P.pz - 30 + kk * 4; ry = 0.4 + kk * 0.5; rz = Math.PI / 2; } // (it fell: on its side on the desk, between the belt, the post and the crate)
      if (vis !== o.vis) { o.vis = vis; o.g.visible = vis; ch = true; }
      if (vis && (o.g.position.x !== x || o.g.position.y !== y || o.g.position.z !== z || o.g.rotation.y !== ry)) { o.g.position.set(x, y, z); o.g.rotation.set(0, ry, rz); ch = true; }
      const key2 = (b.dent ? 'd' : '') + S.gen; if (key2 !== o.n) { o.n = key2; const c = o.TC.getContext('2d'); c.fillStyle = '#c69863'; c.fillRect(0, 0, 128, 112); c.fillStyle = 'rgba(230,205,150,0.75)'; c.fillRect(0, 44, 128, 24);
        if (b.dent) { const gr = c.createRadialGradient(64, 56, 2, 64, 56, 30); gr.addColorStop(0, 'rgba(60,35,10,0.75)'); gr.addColorStop(1, 'rgba(60,35,10,0)'); c.fillStyle = gr; c.beginPath(); c.arc(64, 56, 30, 0, 7); c.fill(); } // the dent where the cup pushed in
        o.tex.needsUpdate = true; ch = true; }
    });
    return ch;
  }

  // ================================================================== the self-stabilising gimbal (batch 33): a hand holds the grip; the
  // roll servo on top turns a U bracket about z (front-back), the pitch servo on the bracket turns the camera platform about x.
  // Positive roll tips the top to the right (as the student sees it), positive pitch tips it forward (away)
  gimbalSteps() {
    const r = this.root, S = this.mat; const P0 = this.gbAt = V3(300, 112, 40);
    return [
      () => { // the hand: grip, fist and forearm, rotated about the middle of the grip
        const hand = this.gbHand = new THREE.Group(); hand.position.copy(P0); r.add(hand);
        const rub = S({ color: 0x1d1f23, roughness: 0.85 }), skin = S({ color: 0xc58c64, roughness: 0.75 }), sleeve = S({ color: 0x2f5d8a, roughness: 0.9 });
        hand.add(cyl(14, 112, rub, 0, 0, 0, 20)); hand.add(cyl(16, 8, S({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 }), 0, 58, 0, 20));
        const fist = new THREE.Group(); fist.position.set(0, -12, 4); hand.add(fist); const palm = new THREE.Mesh(new THREE.CapsuleGeometry(17, 30, 6, 14), skin); palm.scale.set(1.15, 1, 0.9); palm.position.set(0, 0, 12); fist.add(palm); // (the back of the hand, towards the student)
        for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(7.5, 22, 4, 10), skin); f.rotation.z = Math.PI / 2; f.position.set(-2, 22 - i * 15, -16); fist.add(f); } // (fingers round the front of the grip)
        const th = new THREE.Mesh(new THREE.CapsuleGeometry(8, 26, 4, 10), skin); th.rotation.set(0.3, 0, 0.9); th.position.set(-18, 28, 4); fist.add(th);
        const arm = new THREE.Group(); arm.position.set(0, -40, 26); arm.rotation.x = 0.95; fist.add(arm); arm.add(cyl(21, 60, skin, 0, -30, 0, 18)); arm.add(cyl(27, 150, sleeve, 0, -130, 0, 18));
        const sv = M2.sg90Body(); sv.rotation.x = Math.PI / 2; sv.position.set(5.6, 72, -14); hand.add(sv); // (the roll servo: its shaft towards the student, along z)
      },
      () => { // the roll bracket (a U of black aluminium), the pitch servo on its right arm, the camera platform between the arms
        const blk = S({ color: 0x1b1b1d, roughness: 0.45 }); const roll = this.gbRoll = new THREE.Group(); roll.position.set(0, 72, 16); this.gbHand.add(roll);
        roll.add(cyl(9, 3, S({ color: 0xf2f2f2, roughness: 0.5 }), 0, 0, -1, 16).rotateX(Math.PI / 2)); roll.add(box(100, 4, 12, blk, 0, 6, 4)); for (const sg of [-1, 1]) roll.add(box(4, 84, 12, blk, sg * 48, 46, 4));
        const sv = M2.sg90Body(); sv.rotation.set(0, 0, -Math.PI / 2); sv.position.set(52, 78 + 5.6, 4); roll.add(sv); // (its shaft along −x, into the bracket)
        const pitch = this.gbPitch = new THREE.Group(); pitch.position.set(0, 78, 4); roll.add(pitch);
        pitch.add(box(84, 3, 44, blk, 0, -24, 0)); for (const sg of [-1, 1]) pitch.add(box(3, 30, 20, blk, sg * 42, -10, 0));
        const cam = new THREE.Group(); cam.position.set(0, 0, 0); pitch.add(cam); cam.add(box(62, 42, 30, S({ color: 0x2a2c31, roughness: 0.5 }), 0, -1, 0));
        const lens = cyl(11, 8, S({ color: 0x0c0d10, roughness: 0.15, metalness: 0.4 }), 14, -2, -18, 20); lens.rotation.x = Math.PI / 2; cam.add(lens);
        const C = canvas(160, 108); const c = C.getContext('2d'); this.gbScreen = { C, c, tex: ctex(C) }; const scr = new THREE.Mesh(new THREE.PlaneGeometry(48, 32), new THREE.MeshBasicMaterial({ map: this.gbScreen.tex, toneMapped: false })); scr.position.set(0, -1, 15.2); cam.add(scr);
        cam.add(box(8, 3, 6, S({ color: 0xc9312c, roughness: 0.4 }), -20, 21, -6));
        const mb = new THREE.Group(); mb.position.set(0, -21.5, 26); pitch.add(mb); mb.add(box(21, 1.6, 16, S({ color: 0x1f5fb0, roughness: 0.55 }), 0, 0, 0)); mb.add(box(4, 1, 4, S({ color: 0x111214, roughness: 0.4 }), 0, 1.3, 0)); // (the GY-521, flat on the platform in front of the camera)
      },
      () => this.cables([['svR', [this.gbAt.x - 8, 48, this.gbAt.z + 30]], ['svP', [this.gbAt.x + 8, 50, this.gbAt.z + 30]], ['mpu', [this.gbAt.x, 46, this.gbAt.z + 36]]]),
    ];
  }
  gimbalScreen(roll, pitch) { // the camera's own picture: the horizon, turned and moved as the camera tips; REC
    const { C, c, tex } = this.gbScreen; const w = C.width, h = C.height; c.save(); c.fillStyle = '#7fb6e8'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2 - pitch * 2.2); c.rotate(-roll * D2R); // (the camera tips right: its picture of the horizon turns the other way)
    c.fillStyle = '#5f8f4a'; c.fillRect(-w, 0, 2 * w, h * 2); c.fillStyle = '#e8e2d0'; c.fillRect(-w, -1, 2 * w, 2); c.restore();
    c.fillStyle = '#e03030'; c.beginPath(); c.arc(14, 14, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = `700 14px ${TX.FONT}`; c.fillText('REC', 24, 19); tex.needsUpdate = true;
  }
  gimbalDraw() {
    if (!this.gbPitch) return false; const S = this.sim; const R = this.part('svR'), P = this.part('svP'); const aR = R ? R.state.angle : 90, aP = P ? P.state.angle : 90;
    if (this.lab.version !== this._gbv) { this._gbv = this.lab.version; this.cables([['svR', [this.gbAt.x - 8, 48, this.gbAt.z + 30]], ['svP', [this.gbAt.x + 8, 50, this.gbAt.z + 30]], ['mpu', [this.gbAt.x, 46, this.gbAt.z + 36]]]); }
    const key = [S.hr, S.hp, aR, aP].map((v) => Math.round((v || 0) * 10)).join(); if (key === this._gbk) return false; this._gbk = key;
    this.gbHand.rotation.set(-(S.hp || 0) * D2R, 0, -(S.hr || 0) * D2R, 'ZXY'); this.gbRoll.rotation.z = -(aR - 90) * D2R; this.gbPitch.rotation.x = -(aP - 90) * D2R;
    this.gimbalScreen(S.pr || 0, S.pp || 0); return true;
  }

  // ================================================================== the ball-on-beam balancer (batch 34): the beam along x, the sensor's
  // end on the left (towards the bench). Positive beam angle (scene) = the sensor's end up = rotation.z negative
  beamSteps() {
    const r = this.root, S = this.mat; const PV = this.bbPivot = V3(510, 158, -20);
    return [
      () => { // the stand: a base, the post and its pivot block
        const g = new THREE.Group(); const blk = S({ color: 0x24262b, roughness: 0.5 }), wd = this.wood([1, 1], 0xd9c9a8);
        g.add(box(200, 8, 90, wd, PV.x - 40, 4, PV.z)); g.add(box(16, PV.y - 14, 16, blk, PV.x, (PV.y - 14) / 2 + 8, PV.z - 16)); g.add(box(22, 14, 10, blk, PV.x, PV.y - 7, PV.z - 16));
        g.add(box(10, 52, 26, blk, PV.x - 100, 34, PV.z - 22)); // (the servo's post)
        this.still(g); this.blob(240, 120, PV.x - 40, PV.z, 0.3);
        const sv = M2.sg90Body(); sv.rotation.set(Math.PI / 2, 0, 0); sv.position.set(PV.x - 100 + 5.6, 70, PV.z - 34); r.add(sv); this.bbShaft = V3(PV.x - 100, 70, PV.z - 6); // (its shaft towards the student)
        const horn = this.bbHorn = new THREE.Group(); horn.position.copy(this.bbShaft); r.add(horn); horn.add(box(25, 4, 3, S({ color: 0xf2f2f2, roughness: 0.5 }), 12.5, 0, 0));
        this.bbRod = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1, 8), S({ color: 0xbfc3c8, metalness: 0.8, roughness: 0.3 })); r.add(this.bbRod);
      },
      () => { // the beam: an aluminium U channel, rubber stops, the scale, the HC-SR04 at the left end, the ball
        const B = this.bbBeam = new THREE.Group(); B.position.copy(PV); r.add(B); const L = BEAM.L * 10, alu = S({ color: 0xc8ccd2, metalness: 0.75, roughness: 0.35 });
        B.add(box(L, 2, 24, alu, 0, 0, 0)); for (const z of [-12, 12]) B.add(box(L, 16, 1.6, alu, 0, 8, z));
        const rub = S({ color: 0x151517, roughness: 0.8 }); B.add(box(4, 16, 22, rub, -L / 2 + 2, 8, 0)); B.add(box(4, 16, 22, rub, L / 2 - 2, 8, 0));
        const ink = S({ color: 0x2b2b2b, roughness: 0.6 }); for (let i = 0; i <= BEAM.L; i += 5) B.add(box(0.8, i % 10 ? 4 : 7, 0.3, ink, -L / 2 + i * 10, 16 - (i % 10 ? 4 : 7) / 2, 12.9));
        B.add(box(2, 10, 0.4, S({ color: 0xd42a2a, roughness: 0.5 }), -L / 2 + BEAM.sp * 10, 11, 13.1)); // (the target: the middle)
        const us = new THREE.Group(); us.position.set(-L / 2 - 4, 14, 0); B.add(us); us.add(box(1.6, 20, 45, S({ color: 0x1f5fb0, roughness: 0.55 }), 0, 0, 0));
        for (const z of [-13, 13]) { const c = cyl(8, 12, S({ color: 0xc9ccd1, metalness: 0.7, roughness: 0.35 }), 6, 0, z, 18); c.rotation.z = Math.PI / 2; us.add(c); }
        const ball = this.bbBall = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 16), S({ color: 0xff8a1f, roughness: 0.35 })); B.add(ball); this.bbL = L;
      },
      () => this.cables([['sv', [PV.x - 100, 20, PV.z + 10]], ['us', [PV.x - BEAM.L * 5 - 6, 30, PV.z + 26]]]),
    ];
  }
  beamDraw() {
    if (!this.bbBall) return false; const S = this.sim; const sv = this.part('sv'); const a = sv ? sv.state.angle : 90;
    if (this.lab.version !== this._bbv) { this._bbv = this.lab.version; const PV = this.bbPivot; this.cables([['sv', [PV.x - 100, 20, PV.z + 10]], ['us', [PV.x - BEAM.L * 5 - 6, 30, PV.z + 26]]]); }
    const key = [S.x, S.th, a].map((v) => Math.round((v || 0) * 100)).join(); if (key === this._bbk) return false; this._bbk = key;
    this.bbBeam.rotation.z = -(S.th || 0); this.bbBall.position.set(-this.bbL / 2 + (S.x ?? 40) * 10, 21, 0); this.bbBall.rotation.z = -(S.x ?? 40) * 10 / 20;
    // the horn turns with the servo (pointing right at 90°); the rod goes from its tip to the beam 10 cm left of the pivot
    const ph = (90 - a) * D2R; this.bbHorn.rotation.z = -ph; const tip = this.bbShaft.clone().add(V3(25 * Math.cos(ph), -25 * Math.sin(ph), 4));
    const rz = this.bbBeam.rotation.z, PV = this.bbPivot; const top = V3(PV.x + (-100) * Math.cos(rz) - (-1) * Math.sin(rz), PV.y + (-100) * Math.sin(rz) + (-1) * Math.cos(rz), PV.z + 14); const mid = tip.clone().add(top).multiplyScalar(0.5), d = top.clone().sub(tip);
    this.bbRod.position.copy(mid); this.bbRod.scale.set(1, d.length(), 1); this.bbRod.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
    return true;
  }

  // ================================================================== the smart ration shop (batch 35): the sack of rice and the shop's
  // board beside the bench; the rice itself is weighed in the bowl on the bench's load cell (models30.js)
  rationSteps() {
    const r = this.root, S = this.mat;
    return [
      () => { const G = new THREE.Group(); G.position.set(360, 0, -150); G.scale.setScalar(0.72); r.add(G); // (the sack and the board, behind and to the right of the bench)
        const C = canvas(128, 128); const c = C.getContext('2d'); c.fillStyle = '#b48a52'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 128; i += 4) { c.fillStyle = 'rgba(80,50,20,0.25)'; c.fillRect(i, 0, 1.5, 128); c.fillRect(0, i, 128, 1.5); } grain(c, 128, 128, 0.12);
        const jute = S({ map: ctex(C, [3, 2]), roughness: 0.95 }); const sack = lathe([[0, 0], [70, 2], [84, 30], [88, 90], [84, 140], [80, 158], [88, 170], [92, 176]], jute, 32); sack.position.set(0, 0, 0); G.add(sack);
        const rice = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 6, 32), S({ color: 0xf3eedf, roughness: 0.95 })); rice.position.set(0, 160, 0); G.add(rice); this.rsRice = rice;
        const heap = new THREE.Mesh(new THREE.ConeGeometry(60, 26, 28), rice.material); heap.position.set(0, 175, 0); G.add(heap);
        const steel = S({ color: 0xd5d9de, metalness: 0.85, roughness: 0.25 }); const sc = new THREE.Group(); sc.position.set(-12, 178, 12); sc.rotation.set(0.5, 0.6, 0.2); G.add(sc);
        sc.add(new THREE.Mesh(new THREE.CylinderGeometry(22, 18, 30, 20, 1, true), steel)); sc.add(cyl(4, 70, steel, 0, 0, 50, 10).rotateX(Math.PI / 2));
        this.blob(150, 150, 360, -150, 0.4);
        const B = canvas(512, 160); const b = B.getContext('2d'); b.fillStyle = '#1d5e3a'; b.fillRect(0, 0, 512, 160); b.strokeStyle = '#f2d16b'; b.lineWidth = 8; b.strokeRect(8, 8, 496, 144);
        b.fillStyle = '#fff'; b.font = `700 46px ${TX.FONT}`; b.textAlign = 'center'; b.fillText('FAIR PRICE SHOP', 256, 70); b.font = `600 32px ${TX.FONT}`; b.fillStyle = '#f2d16b'; b.fillText('Rice · Wheat · Sugar', 256, 120);
        const brd = new THREE.Mesh(new THREE.PlaneGeometry(220, 69), S({ map: ctex(B), roughness: 0.6 })); brd.position.set(0, 330, -90); G.add(brd);
        const post = S({ color: 0x5b4632, roughness: 0.8 }); for (const x of [-100, 100]) G.add(box(6, 360, 6, post, x, 180, -92));
      },
    ];
  }
  rationDraw() { return false; }

  stampMark(c, x, y, rot, a) { // a red "QC OK" stamp, 14 × 10 mm (at 64 × 48 px)
    c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a; c.strokeStyle = '#c8141c'; c.lineWidth = 3; c.strokeRect(-28, -20, 56, 40); c.fillStyle = '#c8141c'; c.font = `800 17px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('QC OK', 0, 1); c.restore();
  }
  convDraw() {
    if (!this.cvBoxes) return false; const S = this.sim, A = this.cvAt; const s = S.s || 0; let ch = false;
    if (this.lab.version !== this._cvv) { this._cvv = this.lab.version; this.cables([['st', [this.cvWireAt.x, this.cvWireAt.y, this.cvWireAt.z], 1.6, 0x2a62c8], ['sv', [A.X0 + CONV.stamp, A.YB + 82, A.Z0 + 18]], ['ir1', [this.cvIrAt.x, this.cvIrAt.y, this.cvIrAt.z]]]); ch = true; }
    if (s !== this._cvs) { this._cvs = s; this.cvBeltT.offset.x = -s / 40; this.cvBeltB.offset.x = s / 40; for (const g of this.cvRollers) g.rotation.z = -s / (A.R - 1); ch = true; }
    const hum = !!S.hum; const j = hum ? (Math.random() - 0.5) * 0.8 : 0; if (hum || this._cvj) { this.cvMotor.position.y = A.YA + j; this._cvj = hum; ch = true; }
    // the stamp head: up at 0°, on the belt at 90°
    const a = S.ang || 0; if (a !== this._cva) { this._cva = a; const H = this.cvHeadAt; this.cvHead.position.set(H.x, A.YB + CONV.travel * (1 - Math.min(90, Math.max(0, a)) / 90), H.z); ch = true; }
    // the IR sensor's LEDs
    const ir = this.part('ir1'); const pw = !!(ir && ir.state.powered), nr = !!(ir && ir.state.near); const k = (pw ? 1 : 0) + (nr ? 2 : 0) + (ir ? 4 : 0);
    if (k !== this._cvk) { this._cvk = k; this.cvPwr.emissiveIntensity = pw ? 2.2 : 0; this.cvDet.emissiveIntensity = nr ? 2.6 : 0; this.cvBeam.visible = pw; ch = true; }
    // the boxes: on the belt, or in the crate
    let inCrate = 0; const now = this.sim.t;
    S.boxes.forEach((b, i) => {
      const o = this.cvBoxes[i]; if (!o) return; const f = b.x0 + s; const back = f - CONV.box;
      let vis = false, x = 0, y = A.YB, z = A.Z0;
      if (b.gone) { const kk = inCrate++; vis = kk < 6; x = this.cvCrate.x + (kk % 2 ? 12 : -12); y = this.cvCrate.y + Math.floor(kk / 2) * CONV.boxH * 0.9; z = this.cvCrate.z + (kk % 4 < 2 ? -13 : 13); }
      else if (back >= 2 && back <= CONV.len) { vis = true; x = A.X0 + f - CONV.box / 2; if (!o.vis) o.showT = now; const d = now - o.showT; if (d < 0.25) y += 14 * (1 - d / 0.25); }
      if (vis !== o.vis) { o.vis = vis; o.g.visible = vis; ch = true; }
      if (vis && (o.g.position.x !== x || o.g.position.y !== y || o.g.position.z !== z)) { o.g.position.set(x, y, z); ch = true; }
      const key = b.st.length + ':' + S.gen; if (key !== o.n) { o.n = key; const c = o.TC.getContext('2d'); c.fillStyle = '#c69863'; c.fillRect(0, 0, 128, 112); c.fillStyle = 'rgba(230,205,150,0.75)'; c.fillRect(0, 44, 128, 24); // the tape
        b.st.forEach((off, q) => this.stampMark(c, 64 + off * 128 / CONV.box, 56, ((q * 37) % 11 - 5) * 0.02, q ? 0.7 : 0.9)); o.tex.needsUpdate = true; ch = true; }
    });
    // the stamps on the bare belt (they ride on it)
    this.cvMarks.forEach((m, i) => { const u = S.marks[i] !== undefined ? S.marks[i] + s : -1; const v = u >= 0 && u <= CONV.len; if (v) m.position.set(A.X0 + u, A.YB + 0.1, A.Z0); if (v !== m.visible) { m.visible = v; ch = true; } });
    return ch;
  }

  // ================================================================== the camera slider (batch 24): a 2020 aluminium rail on two stands, the
  // 28BYJ-48 and its 20-tooth pulley at the left end, the GT2 belt, the carriage with a small camera looking at a model street
  // behind the rail; the camera rocks for a moment when it stops, and flashes its light at each photo
  slideSteps() {
    const r = this.root, S = this.mat; const XS = 250, Z0 = 6, YR = 58; const XA = XS - 22, XB = XS + SLIDE.len + 22; this.slAt = { XS, Z0, YR };
    return [
      () => { // the rail, its end plates and stands, the belt, the street behind
        const g = new THREE.Group(); const alu = S({ color: 0xc3c9d0, metalness: 0.7, roughness: 0.35 }), dark = S({ color: 0x232427, roughness: 0.5 }), black = S({ color: 0x141416, roughness: 0.8 });
        g.add(box(XB - XA, 20, 20, alu, (XA + XB) / 2, YR - 10, Z0)); for (const y of [YR - 10]) for (const z of [Z0 - 10.2, Z0 + 10.2]) g.add(box(XB - XA, 6, 0.6, dark, (XA + XB) / 2, y, z)); // the extrusion and its slots
        for (const x of [XA - 3, XB + 3]) { g.add(box(6, 34, 34, dark, x, YR - 14, Z0)); for (const sz of [-1, 1]) { const leg = box(5, YR - 20, 5, alu, x, (YR - 20) / 2, Z0 + sz * 14); g.add(leg); } g.add(box(14, 2, 40, dark, x, 1, Z0)); }
        // the GT2 belt along the rail's front: two runs between the pulley and the idler
        for (const y of [YR + 3, YR - 23]) g.add(box(XB - XA - 6, 1.4, 6, black, (XA + XB) / 2, y, Z0 + 15));
        g.add(cyl(13, 7, black, XB, YR - 10, Z0 + 15, 20).rotateX(Math.PI / 2)); // the idler's belt wrap
        // the street the camera films: a row of small houses behind the rail
        const H = [[0xe0b25a, 40, 46], [0xc8553d, 34, 60], [0x5a87b8, 44, 40], [0xe7e2d4, 36, 70], [0x6aa36a, 40, 52], [0xd88c4a, 38, 44]];
        let x = XS - 10; for (const [col, w, h] of H) { g.add(box(w, h, 30, S({ color: col, roughness: 0.8 }), x + w / 2, h / 2, Z0 - 120)); g.add(box(w + 4, 4, 34, S({ color: 0x5b3a2a, roughness: 0.8 }), x + w / 2, h + 2, Z0 - 120)); for (const wx of [-w / 4, w / 4]) g.add(box(7, 9, 0.6, S({ color: 0x2f4f6f, roughness: 0.2 }), x + w / 2 + wx, h * 0.6, Z0 - 104.6)); x += w + 6; }
        this.still(g); this.blob(XB - XA + 40, 80, (XA + XB) / 2, Z0, 0.3);
      },
      () => { // the motor on the left end plate (its shaft along z), the pulley on it
        const mo = new THREE.Group(); mo.position.set(XA - 3, YR - 10, Z0 + 4); r.add(mo); const can = S({ color: 0xc9ced4, metalness: 0.8, roughness: 0.3 }), cap = S({ color: 0x2a62c8, roughness: 0.5 });
        const body = new THREE.Group(); body.rotation.x = Math.PI / 2; body.position.z = -8; mo.add(body); body.add(cyl(14, 19, can, 0, -10, 0, 28)); body.add(cyl(14.2, 1.4, cap, 0, -20.5, 0, 28)); body.add(box(16, 6, 16, cap, 0, -14, 14));
        const pul = cyl(7, 7, S({ color: 0xb8bdc3, metalness: 0.8, roughness: 0.3 }), 0, 0, 0, 20); pul.rotation.x = Math.PI / 2; const pg = new THREE.Group(); pg.position.set(3, 0, 11); pg.add(pul); pg.add(box(2, 13, 7.2, S({ color: 0x141416, roughness: 0.8 }), 0, 0, 0)); mo.add(pg); this.slPulley = pg;
        this.slWireAt = V3(XA - 3, YR - 26, Z0 - 22);
      },
      () => { // the carriage and the camera (it moves)
        const car = new THREE.Group(); r.add(car); this.slCar = car; const plate = S({ color: 0x2b2c30, roughness: 0.45 }), wheel = S({ color: 0x111113, roughness: 0.6 });
        car.add(box(50, 5, 40, plate, 0, 2.5, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) car.add(cyl(5, 4, wheel, sx * 18, -4, sz * 13, 12).rotateX(Math.PI / 2));
        car.add(box(10, 8, 4, plate, 0, -6, 15)); // the belt clamp
        const head = new THREE.Group(); head.position.y = 5; car.add(head); this.slHead = head; head.add(cyl(4, 8, plate, 0, 4, 0, 12)); head.add(new THREE.Mesh(new THREE.SphereGeometry(6, 14, 10), S({ color: 0x3a3b40, metalness: 0.5, roughness: 0.4 })).translateY(10));
        const cam = new THREE.Group(); cam.position.y = 16; head.add(cam); const body = S({ color: 0x3a3c43, roughness: 0.5 }), silver = S({ color: 0xc4c8cd, metalness: 0.7, roughness: 0.3 });
        cam.add(box(40, 26, 20, body, 0, 13, 0)); cam.add(box(40, 3, 20, silver, 0, 27.5, 0)); cam.add(box(12, 6, 16, body, -10, 31, 0)); cam.add(box(10, 18, 22, S({ color: 0x22232a, roughness: 0.7 }), 14, 12, 0)); cam.add(box(3, 3, 21, S({ color: 0xc8281c, roughness: 0.5 }), 10, 22, 0)); // body, silver top, finder, grip, red stripe
        const lens = cyl(9, 18, S({ color: 0x232428, roughness: 0.4 }), 0, 0, 0, 20); lens.rotation.x = Math.PI / 2; lens.position.set(-2, 13, -19); cam.add(lens);
        const ring = cyl(9.6, 3, silver, 0, 0, 0, 20); ring.rotation.x = Math.PI / 2; ring.position.set(-2, 13, -26); cam.add(ring);
        const glass = new THREE.Mesh(new THREE.CircleGeometry(7, 20), S({ color: 0x1a2a4a, roughness: 0.05, metalness: 0.6 })); glass.rotation.y = Math.PI; glass.position.set(-2, 13, -28.2); cam.add(glass);
        this.slLed = new THREE.MeshStandardMaterial({ color: 0x401010, emissive: 0xff2a1a, emissiveIntensity: 0, roughness: 0.4 }); cam.add(box(3, 1.5, 3, this.slLed, 10, 26.8, -6));
        this.slFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); this.slFlash.scale.setScalar(46); this.slFlash.position.set(-2, 13, -32); cam.add(this.slFlash);
      },
      () => this.cables([['st', [this.slWireAt.x, this.slWireAt.y, this.slWireAt.z], 1.6, 0x2a62c8]]),
    ];
  }
  slideDraw() {
    if (!this.slCar) return false; const S = this.sim, A = this.slAt; const x = Math.max(-5, Math.min(SLIDE.len + 5, S.x || 0)); const w = S.w || 0; const f = S.flash || 0;
    const key = [x, w, f].map((v) => Math.round(v * 200)).join(); if (this.lab.version !== this._slv) { this._slv = this.lab.version; this.cables([['st', [this.slWireAt.x, this.slWireAt.y, this.slWireAt.z], 1.6, 0x2a62c8]]); } if (key === this._slk) return false; this._slk = key;
    this.slCar.position.set(A.XS + x, A.YR + 4, A.Z0); this.slHead.rotation.x = w / 20 * 3; // (the rocking, shown three times bigger)
    this.slPulley.rotation.z = -x / 6.37; // (the pulley turns once for 40 mm: 2π ÷ 40 = 1 ÷ 6.37 a mm)
    this.slFlash.material.opacity = f; this.slLed.emissiveIntensity = f > 0.5 ? 2.5 : 0; return true;
  }

  // ================================================================== the pen plotter (batch 24): a white base board with the paper (its
  // pencilled house), two steel rods along z for the Y gantry, the gantry with the X carriage and the pen on its servo;
  // the Y motor at the back-left corner, the X motor at the gantry's left end; the ink on a canvas over the paper
  plotSteps() {
    const r = this.root, S = this.mat; const X0 = 310, Z0 = -40, YP = 6.2, XL = X0 - 22, XR = X0 + PLOT.w + 22, ZB = Z0 - 30, ZF = Z0 + PLOT.d + 30, HG = 46; this.plAt = { X0, Z0, YP, XL, XR, HG };
    return [
      () => { // the base, the paper with its pencilled house, the rods and their blocks
        const g = new THREE.Group(); const alu = S({ color: 0xc3c9d0, metalness: 0.7, roughness: 0.35 }), steel = S({ color: 0xdfe3e8, metalness: 0.9, roughness: 0.2 }), dark = S({ color: 0x232427, roughness: 0.5 });
        g.add(box(XR - XL + 30, 6, ZF - ZB + 10, S({ color: 0xf1efe9, roughness: 0.8 }), (XL + XR) / 2, 3, (ZB + ZF) / 2));
        for (const x of [XL, XR]) { for (const z of [ZB, ZF]) g.add(box(14, HG - 4, 14, dark, x, (HG - 4) / 2 + 6, z)); g.add(cyl(4, ZF - ZB, steel, x, HG - 10, (ZB + ZF) / 2, 12).rotateX(Math.PI / 2)); }
        g.add(box(10, 1.2, ZF - ZB - 16, S({ color: 0x141416, roughness: 0.8 }), XL - 9, HG - 18, (ZB + ZF) / 2)); // the Y belt
        this.still(g); this.blob(XR - XL + 60, ZF - ZB + 40, (XL + XR) / 2, (ZB + ZF) / 2, 0.3);
        const K = 4; const C = canvas(PLOT.w * K, PLOT.d * K); const c = C.getContext('2d'); c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, C.width, C.height);
        c.strokeStyle = 'rgba(90,90,90,0.55)'; c.lineWidth = 2; c.setLineDash([8, 6]); for (const L of PLOT.house) { c.beginPath(); L.forEach(([x, y], i) => (i ? c.lineTo(x * K, y * K) : c.moveTo(x * K, y * K))); c.stroke(); }
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(PLOT.w, PLOT.d), S({ map: ctex(C), roughness: 0.9 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(X0 + PLOT.w / 2, YP, Z0 + PLOT.d / 2); r.add(sheet);
        const IK = 4; const IC = canvas(PLOT.w * IK, PLOT.d * IK); const it = ctex(IC);
        const ink = new THREE.Mesh(new THREE.PlaneGeometry(PLOT.w, PLOT.d), new THREE.MeshBasicMaterial({ map: it, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); ink.rotation.x = -Math.PI / 2; ink.position.set(X0 + PLOT.w / 2, YP + 0.15, Z0 + PLOT.d / 2); r.add(ink);
        this.plInk = { IC, it, IK, done: new Map(), strokes: null };
        // the Y motor at the back-left corner (its shaft along x)
        const ym = this.byj(S); ym.rotation.z = Math.PI / 2; ym.position.set(XL - 18, HG - 10, ZB - 6); r.add(ym);
      },
      () => { // the gantry (moves along z): its bar, the X motor at its left end, the carriage with the pen and its servo
        const gy = new THREE.Group(); r.add(gy); this.plGantry = gy; const alu = S({ color: 0xc3c9d0, metalness: 0.7, roughness: 0.35 }), dark = S({ color: 0x232427, roughness: 0.5 });
        gy.add(box(XR - XL + 20, 14, 14, alu, (XL + XR) / 2, HG, 0)); for (const x of [XL, XR]) gy.add(box(18, 18, 22, dark, x, HG - 6, 0));
        gy.add(box(XR - XL - 6, 1.2, 6, S({ color: 0x141416, roughness: 0.8 }), (XL + XR) / 2, HG + 8, 8)); // the X belt
        const xm = this.byj(S); xm.rotation.z = Math.PI / 2; xm.position.set(XL - 16, HG + 2, 14); gy.add(xm);
        const car = new THREE.Group(); gy.add(car); this.plCar = car; car.add(box(26, 22, 26, dark, 0, HG, 4));
        const sv = M2.sg90Body(); sv.scale.setScalar(0.8); sv.rotation.y = Math.PI / 2; sv.position.set(14, HG - 4, 14); car.add(sv);
        const pen = new THREE.Group(); car.add(pen); this.plPen = pen; const body = S({ color: 0xf2f2ee, roughness: 0.4 }), blue = S({ color: 0x1d3fa8, roughness: 0.45 });
        pen.add(cyl(4.4, 52, body, 0, 30, 18, 16)); pen.add(cyl(4.7, 12, blue, 0, 60, 18, 16)); const tip = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 12), blue); tip.rotation.x = Math.PI; tip.position.set(0, 2, 18); pen.add(tip);
        pen.add(box(10, 6, 6, dark, 0, HG - 12, 18)); // its clamp
      },
      () => this.cables([['stX', [XL - 4, HG - 20, ZB - 4], 1.6, 0x2a62c8], ['stY', [XL - 18, HG - 20, ZB - 6], 1.6, 0x2a62c8], ['svP', [XL + 2, HG - 20, ZB - 4]]]),
    ];
  }
  byj(S) { // a 28BYJ-48 (its shaft along +y here; the caller turns it), with its blue cap and wire box
    const g = new THREE.Group(); const can = S({ color: 0xc9ced4, metalness: 0.8, roughness: 0.3 }), cap = S({ color: 0x2a62c8, roughness: 0.5 });
    g.add(cyl(14, 19, can, 0, -9.5, 0, 28)); g.add(cyl(14.2, 1.4, cap, 0, -19.5, 0, 28)); g.add(box(16, 6, 16, cap, 0, -13, 14)); g.add(box(7, 0.8, 49, can, 0, 0, 0));
    g.add(cyl(7, 6, S({ color: 0xb8bdc3, metalness: 0.8, roughness: 0.3 }), 0, 4, 0, 16)); return g;
  }
  plotDraw() {
    if (!this.plGantry) return false; const S = this.sim, A = this.plAt; let ch = false;
    if (this.lab.version !== this._plv) { this._plv = this.lab.version; this.cables([['stX', [A.XL - 4, A.HG - 20, A.Z0 - 34], 1.6, 0x2a62c8], ['stY', [A.XL - 18, A.HG - 20, A.Z0 - 36], 1.6, 0x2a62c8], ['svP', [A.XL + 2, A.HG - 20, A.Z0 - 34]]]); ch = true; }
    const x = Math.max(-10, Math.min(PLOT.w + 10, S.x || 0)), y = Math.max(-10, Math.min(PLOT.d + 10, S.y || 0)); const a = S.penA ?? 90; const k = [x, y, a].map((v) => Math.round(v * 50)).join();
    if (k !== this._plk) { this._plk = k; this.plGantry.position.z = A.Z0 + y; this.plCar.position.x = A.X0 + x; this.plPen.position.y = Math.max(0, Math.min(1, (a - PLOT.down) / 50)) * 7 + 8.2; ch = true; } // (down at 30° or less: the tip, 2 mm below the pen group, on the paper; up 7 mm at 80°)
    // the ink
    const I = this.plInk; const c = I.IC.getContext('2d');
    if (I.strokes !== S.strokes) { I.strokes = S.strokes; I.done = new Map(); c.clearRect(0, 0, I.IC.width, I.IC.height); ch = true; }
    c.strokeStyle = 'rgba(29,63,168,0.92)'; c.lineWidth = 1.1 * I.IK; c.lineCap = 'round'; c.lineJoin = 'round'; let inked = false;
    for (const st of S.strokes) { const from = I.done.get(st) || 0; if (st.length <= from) continue; c.beginPath(); const p0 = st[Math.max(0, from - 1)]; c.moveTo(p0[0] * I.IK, p0[1] * I.IK); for (let i = Math.max(1, from); i < st.length; i++) c.lineTo(st[i][0] * I.IK, st[i][1] * I.IK); if (st.length === 1) c.lineTo(p0[0] * I.IK + 0.5, p0[1] * I.IK); c.stroke(); I.done.set(st, st.length); inked = true; }
    if (inked) { I.it.needsUpdate = true; ch = true; }
    return ch;
  }

  // ================================================================== the keypad locker
  lockerSteps() {
    const r = this.root, S = this.mat; const LX = 345, LZ = -40;
    return [
      () => {
        const g = new THREE.Group(); g.position.set(LX, 0, LZ); const steel = S({ color: 0x6f8a7a, metalness: 0.5, roughness: 0.45 }), inside = S({ color: 0x4a5a50, roughness: 0.7 });
        g.add(box(170, 4, 140, steel, 0, 2, 0)); g.add(box(170, 4, 140, steel, 0, 176, 0)); for (const x of [-83, 83]) g.add(box(4, 172, 140, steel, x, 90, 0)); g.add(box(170, 172, 4, steel, 0, 90, -68));
        g.add(box(160, 3, 130, inside, 0, 70, 0)); g.add(box(40, 26, 30, S({ color: 0xc9a23a, metalness: 0.8, roughness: 0.3 }), -30, 84.5, -20)); g.add(box(26, 18, 22, S({ color: 0x8a1c1c, roughness: 0.6 }), 30, 80.5, -10));
        g.add(box(10, 30, 8, steel, 78, 120, 64)); // the strike
        this.still(g); this.blob(220, 180, LX, LZ, 0.35);
        const door = new THREE.Group(); door.position.set(LX - 85, 2, LZ + 70); r.add(door); this.door = door;
        const leaf = new THREE.Group(); leaf.add(box(170, 174, 5, steel, 85, 88, 2.5)); leaf.add(box(8, 40, 10, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 150, 100, 8));
        const pl = (() => { const C = canvas(256, 96); const c = C.getContext('2d'); c.fillStyle = '#d8d4c4'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#2a2a2a'; c.font = `800 36px ${TX.FONT}`; c.textAlign = 'center'; c.fillText('LOCKER · 1', 128, 60); return S({ map: ctex(C), roughness: 0.5 }); })();
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(64, 24), pl); plate.position.set(85, 140, 5.2); leaf.add(plate);
        const sv = M2.sg90Body(); sv.rotation.set(Math.PI / 2, 0, 0); sv.position.set(135, 120, -8); leaf.add(sv);
        MD.mergeStatic(leaf); door.add(leaf);
        this.bolt = MD.box(18, 6, 6, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 158, 120, -10); door.add(this.bolt);
      },
      () => this.cables([['sv1', [LX + 50, 120, LZ + 60]]]),
    ];
  }
  lockerDraw() {
    let a = false; const S = this.sim; const sv = this.part('sv1'); const ang = sv ? sv.state.angle : 0;
    if (this.door) { const ry = -S.door * 80 * D2R; if (Math.abs(this.door.rotation.y - ry) > 1e-4) { this.door.rotation.y = ry; a = true; } const bx = 158 - Math.min(1, ang / 90) * 14; if (Math.abs(this.bolt.position.x - bx) > 0.01) { this.bolt.position.x = bx; a = true; } }
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['sv1', [395, 120, 20]]]); }
    return a;
  }

  // ================================================================== kitchen: stove, LPG cylinder, window, the gas
  // ================================================================== the rooftop water tank (batch 17): a clear model tank on its stand, the
  // sump below with the pump, the pipe up, a tap at the bottom; the water's height comes from the scene (TankScene.h, %)
  tankSteps() {
    const r = this.root, S = this.mat; const TX0 = 335, TZ = -10, BASE = 46, R0 = 50, H = 92; this.tankAt = { TX0, TZ, BASE, H };
    const water = (o) => new THREE.MeshPhysicalMaterial({ color: 0x4a90e2, roughness: 0.05, transparent: true, opacity: o, depthWrite: false });
    return [
      () => { // the brick stand (the "roof"), the clear tank with its black rim and lid, and a level scale on its side
        const g = new THREE.Group(); g.position.set(TX0, 0, TZ);
        const C = canvas(128, 64); const c = C.getContext('2d'); c.fillStyle = '#a8553a'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#d9cbb8'; for (let y = 0; y < 64; y += 16) { c.fillRect(0, y, 128, 2); for (let x = (y / 16) % 2 ? 0 : 16; x < 128; x += 32) c.fillRect(x, y, 2, 16); }
        const brick = S({ map: ctex(C, [2, 2]), roughness: 0.9 }); g.add(box(130, BASE, 130, brick, 0, BASE / 2, 0));
        const black = S({ color: 0x1d1f22, roughness: 0.5 }); g.add(lathe([[R0 + 2, BASE], [R0 + 3, BASE + 2], [R0 + 3, BASE + 6], [0, BASE + 6]], black, 40));
        g.add(lathe([[R0 + 3, BASE + H - 4], [R0 + 4, BASE + H], [R0 - 6, BASE + H + 6], [16, BASE + H + 9], [0, BASE + H + 9]], black, 40));
        const SC = canvas(32, 256); const sc = SC.getContext('2d'); sc.fillStyle = '#fff'; sc.fillRect(0, 0, 32, 256); sc.fillStyle = '#222'; sc.font = `700 14px ${TX.FONT}`;
        for (let k = 0; k <= 10; k++) { const y = 250 - k * 24.4; sc.fillRect(0, y, k % 5 ? 10 : 18, 2); if (k % 5 === 0) sc.fillText(String(k * 10), 12, y - 2 + (k === 10 ? 14 : 0)); }
        const sm = new THREE.Mesh(new THREE.PlaneGeometry(10, H - 8), S({ map: ctex(SC), roughness: 0.6 })); sm.position.set(-R0 - 3.2, BASE + 6 + (H - 8) / 2, 18); sm.rotation.y = -Math.PI / 2 + 0.35; g.add(sm);
        this.still(g); this.blob(160, 160, TX0, TZ, 0.3);
        const glass = new THREE.MeshPhysicalMaterial({ color: 0xf2f8ff, roughness: 0.08, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
        const wall = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 2, R0 + 2, H - 6, 40, 1, true), glass); wall.position.set(TX0, BASE + 3 + (H - 6) / 2, TZ); r.add(wall);
        this.water = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 1, 40), water(0.55)); this.water.position.set(TX0, BASE + 6, TZ); r.add(this.water);
      },
      () => { // the sump (an underground tank: a grey box with a dark opening and its water), the pump's pipe up to the tank's top, a tap
        const SX = 245, SZ = 110; const g = new THREE.Group(); g.position.set(SX, 0, SZ); const conc = S({ color: 0x9a9890, roughness: 0.95 });
        g.add(box(90, 26, 70, conc, 0, 13, 0)); g.add(box(70, 1, 50, S({ color: 0x2b2c2e, roughness: 0.9 }), 0, 26.2, 0)); this.still(g);
        this.sumpWater = box(66, 0.6, 46, water(0.7), SX, 26.6, SZ); r.add(this.sumpWater);
        const pvc = S({ color: 0xf0f0ea, roughness: 0.5 });
        r.add(tube([V3(SX + 10, 22, SZ), V3(SX + 10, 60, SZ - 10), V3(TX0 - 45, 110, TZ + 45), V3(TX0 - 20, BASE + H + 14, TZ + 10), V3(TX0 - 12, BASE + H + 4, TZ + 4)], 2.6, pvc, 40, 8));
        this.inflow = cyl(2, 1, water(0), 0, 0, 0, 10); r.add(this.inflow);
        const tp = new THREE.Group(); tp.position.set(TX0 + 20, BASE + 10, TZ + R0 - 2); tp.add(cyl(3, 18, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 0, 0, 9, 12).rotateX(Math.PI / 2)); tp.add(box(4, 8, 4, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), 0, -4, 18)); MD.mergeStatic(tp); r.add(tp);
        this.tapStream = cyl(1.4, 1, water(0), 0, 0, 0, 8); r.add(this.tapStream); this.tapAt = V3(TX0 + 20, BASE + 2, TZ + R0 + 16);
        this.spillMesh = new THREE.Mesh(new THREE.CylinderGeometry(R0 + 5, R0 + 9, 60, 40, 1, true), water(0)); this.spillMesh.position.set(TX0, BASE + H - 30, TZ); r.add(this.spillMesh);
      },
      () => this.cables([['pump', [255, 22, 110], 1.4, 0x1b1b1d]]),
    ];
  }
  tankDraw(dt) {
    const S = this.sim; const T = this.tankAt; let a = false; if (!T || !this.water) return false;
    const hh = Math.max(0.5, (S.h / TANK.depth) * (T.H - 8)); if (Math.abs(this.water.scale.y - hh) > 0.05) { this.water.scale.y = hh; this.water.position.y = T.BASE + 6 + hh / 2; a = true; }
    const pump = this.part('pump'); const on = pump && pump.state.flow > 5; const flowing = on && S.sump;
    const so = S.sump ? 0.7 : 0; if (this.sumpWater.material.opacity !== so) { this.sumpWater.material.opacity = so; a = true; }
    const top = T.BASE + T.H + 4, bot = T.BASE + 6 + hh; const L = Math.max(1, top - bot); const io = flowing ? 0.65 : 0;
    if (this.inflow.material.opacity !== io || Math.abs(this.inflow.scale.y - L) > 0.1) { this.inflow.material.opacity = io; this.inflow.scale.y = L; this.inflow.position.set(T.TX0 - 12, bot + L / 2, T.TZ + 4); a = true; }
    const to = S.tap && S.h > 1 ? 0.7 : 0; if (this.tapStream.material.opacity !== to) { this.tapStream.material.opacity = to; this.tapStream.scale.y = T.BASE + 2; this.tapStream.position.set(this.tapAt.x, (T.BASE + 2) / 2, this.tapAt.z); a = true; }
    const sp = S.spill * 0.45; if (Math.abs(this.spillMesh.material.opacity - sp) > 0.01) { this.spillMesh.material.opacity = sp; a = true; }
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['pump', [255, 22, 110], 1.4, 0x1b1b1d]]); }
    return a || flowing || S.tap;
  }
  kitchenSteps() {
    const r = this.root, S = this.mat; const KX = 360, KZ = -60;
    return [
      () => {
        const g = new THREE.Group(); g.position.set(KX, 0, KZ);
        const GC = canvas(128, 64); const gc = GC.getContext('2d'); gc.fillStyle = '#2a2a2c'; gc.fillRect(0, 0, 128, 64); grain(gc, 128, 64, 0.35, 1600);
        const granite = S({ map: ctex(GC), roughness: 0.25 }), cab = S({ color: 0xe9e2d2, roughness: 0.7 }), tile = S({ color: 0xdfe6e8, roughness: 0.5 });
        g.add(box(240, 74, 80, cab, 0, 37, 0)); g.add(box(246, 6, 86, granite, 0, 77, 0)); g.add(box(260, 150, 6, tile, 0, 155, -46));
        for (const x of [-60, 60]) g.add(box(100, 60, 2, S({ color: 0xc8bea8, roughness: 0.6 }), x, 38, 41));
        // the stove: steel body, two black burners and grates, two knobs
        const steel = S({ color: 0xc9ccd1, metalness: 0.9, roughness: 0.3 }), blk = S({ color: 0x141416, roughness: 0.6 });
        g.add(box(130, 12, 56, steel, -10, 86, 0)); for (const x of [-42, 22]) { g.add(cyl(13, 3, blk, x, 93, -4, 20)); g.add(cyl(7, 4, S({ color: 0x5a5a5e, metalness: 0.6, roughness: 0.4 }), x, 95, -4, 16)); for (let i = 0; i < 4; i++) { const b = box(34, 2, 2, blk, x, 98, -4); b.rotation.y = i * Math.PI / 4; g.add(b); } }
        this.still(g); this.blob(280, 120, KX, KZ, 0.35);
        this.knob = new THREE.Group(); this.knob.position.set(KX - 52, 86, KZ + 29); this.knob.add(cyl(5, 6, blk, 0, 0, 3, 16).rotateX(Math.PI / 2)); this.knob.add(box(1.6, 8, 2, S({ color: 0xf2f2ee }), 0, 2.5, 6.4)); r.add(this.knob);
        const k2 = this.knob.clone(); k2.position.x += 64; r.add(k2);
      },
      () => { // the red LPG cylinder with its regulator and pipe
        const red = S({ color: 0xc81e1a, metalness: 0.3, roughness: 0.35 }); const c = new THREE.Group(); c.position.set(KX + 160, 0, KZ + 10);
        c.add(lathe([[0, 0], [44, 0], [46, 6], [46, 140], [40, 160], [24, 170], [12, 172], [0, 172]], red, 28)); c.add(cyl(46.5, 8, S({ color: 0x8a1410, roughness: 0.5 }), 0, 4, 0, 28));
        c.add(cyl(26, 22, red, 0, 182, 0, 20).rotateX(0)); c.add(cyl(28, 4, red, 0, 194, 0, 20));
        const L = (() => { const C = canvas(256, 128); const x = C.getContext('2d'); x.fillStyle = '#c81e1a'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#fff'; x.font = `800 30px ${TX.FONT}`; x.textAlign = 'center'; x.fillText('LPG · 14.2 kg', 128, 56); x.font = `600 20px ${TX.FONT}`; x.fillText('एल.पी.जी.', 128, 92); return S({ map: ctex(C), roughness: 0.4 }); })();
        const lab = new THREE.Mesh(new THREE.CylinderGeometry(46.3, 46.3, 50, 28, 1, true, -0.7, 1.4), L); lab.position.y = 80; c.add(lab);
        c.add(cyl(14, 12, S({ color: 0xe88a1a, roughness: 0.45 }), 0, 180, 18, 16).rotateX(Math.PI / 2)); MD.mergeStatic(c); r.add(c);
        r.add(tube([V3(KX + 160, 180, KZ + 30), V3(KX + 130, 160, KZ + 40), V3(KX + 90, 100, KZ + 30), V3(KX + 50, 86, KZ + 10)], 3, S({ color: 0xc8401c, roughness: 0.6 }), 24, 8));
      },
      () => { // the window with two shutters that open
        const w = new THREE.Group(); w.position.set(KX - 40, 120, KZ - 44); const fr = S({ color: 0xf2f0e8, roughness: 0.6 });
        w.add(box(110, 8, 8, fr, 0, 0, 0)); w.add(box(110, 8, 8, fr, 0, 80, 0)); for (const x of [-55, 55]) w.add(box(8, 88, 8, fr, x, 40, 0));
        const sky = new THREE.Mesh(new THREE.PlaneGeometry(102, 74), new THREE.MeshBasicMaterial({ color: 0x9fd0ff })); sky.position.set(0, 40, -3); w.add(sky); MD.mergeStatic(w); r.add(w);
        this.shutters = [-1, 1].map((s) => { const h = new THREE.Group(); h.position.set(KX - 40 + s * 51, 120, KZ - 40); const m = new THREE.MeshPhysicalMaterial({ color: 0xdfeeff, roughness: 0.1, transparent: true, opacity: 0.45, depthWrite: false }); const p = box(50, 74, 2, m, -s * 25, 40, 0); h.add(p); h.add(box(50, 4, 3, fr, -s * 25, 3, 0)); h.add(box(50, 4, 3, fr, -s * 25, 77, 0)); r.add(h); return { h, s }; });
      },
      () => { // the gas: a few soft clouds that grow with the ppm
        const gt = glowTex(); this.haze = [0, 1, 2, 3, 4].map((i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: 0xd8e8a8, transparent: true, opacity: 0, depthWrite: false })); s.position.set(KX - 40 + i * 26 - (i > 2 ? 160 : 0), 60 + (i % 3) * 22, KZ + 50 + (i % 2) * 30); s.userData.ph = i; r.add(s); return s; });
      },
    ];
  }
  kitchenDraw(dt) {
    const S = this.sim; let a = false;
    if (this.knob) { const rz = -(S.leak / 100) * 1.6; if (this.knob.rotation.z !== rz) { this.knob.rotation.z = rz; a = true; } }
    if (this.shutters) for (const { h, s } of this.shutters) { const t = (S.win ? 1 : 0) * 1.4 * s; h.rotation.y += (t - h.rotation.y) * Math.min(1, dt * 4); if (Math.abs(h.rotation.y - t) > 0.002) a = true; }
    if (this.haze) { const k = Math.min(1, S.ppm / 1400); const t = performance.now() / 1000; this.haze.forEach((s) => { s.material.opacity = 0.42 * k; s.scale.setScalar(60 + 90 * k + Math.sin(t + s.userData.ph) * 8); }); if (k > 0.01) a = true; }
    return a;
  }

  // ================================================================== pan-tilt laser and its target board
  ptSteps() {
    const r = this.root, S = this.mat; const H = this.ptHead = V3(300, 112, 40); const BZ = -120;
    return [
      () => { // the stand, and the target board
        const blk = S({ color: 0x1b1b1d, roughness: 0.4 }); const g = new THREE.Group(); g.add(box(60, 6, 60, blk, H.x, 3, H.z)); g.add(cyl(5, 72, S({ color: 0xc9ccd1, metalness: 1, roughness: 0.3 }), H.x, 42, H.z, 12)); g.add(box(30, 6, 30, blk, H.x, 80, H.z));
        const bd = new THREE.Group(); const C = canvas(384, 256); const c = C.getContext('2d'); c.fillStyle = '#f6f6f2'; c.fillRect(0, 0, 384, 256); c.strokeStyle = '#d8d8d2'; c.lineWidth = 1; for (let x = 0; x < 384; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); } for (let y = 0; y < 256; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(384, y); c.stroke(); }
        this.boardTex = ctex(C); this.boardC = C; const face = S({ map: this.boardTex, roughness: 0.8 });
        bd.add(box(300, 200, 6, [blk, blk, blk, blk, face, blk], H.x, 110, BZ)); for (const x of [-140, 140]) bd.add(box(8, 10, 40, blk, H.x + x, 5, BZ)); g.add(bd);
        this.still(g); this.blob(80, 80, H.x, H.z, 0.4);
        // where A and B are on the board, drawn on its face
        for (const [k, [p, t]] of Object.entries(PT_TARGETS)) { const d = this.ptDot(p, t); const u = (d.x - (H.x - 150)) / 300 * 384, v = (1 - (d.y - 10) / 200) * 256; for (const [rr, col] of [[30, '#c8241c'], [21, '#fff'], [12, '#c8241c']]) { c.fillStyle = col; c.beginPath(); c.arc(u, v, rr, 0, 7); c.fill(); } c.fillStyle = '#141414'; c.font = `800 26px ${TX.FONT}`; c.textAlign = 'center'; c.fillText(k, u, v - 40); }
        this.boardTex.needsUpdate = true;
      },
      () => { // the pan-tilt head: pan servo, bracket, tilt servo, the laser module
        const pan = new THREE.Group(); pan.position.set(H.x, 83, H.z); r.add(pan); this.pan = pan; const b1 = M2.sg90Body(); b1.position.set(5.6, 0, 0); MD.mergeStatic(b1); pan.add(b1);
        const yaw = new THREE.Group(); yaw.position.set(0, 29, 0); pan.add(yaw); this.yaw = yaw; const alu = S({ color: 0x1b1b1d, roughness: 0.5 });
        const br = new THREE.Group(); br.add(box(36, 3, 16, alu, 0, 0, 0)); for (const s of [-1, 1]) br.add(box(3, 30, 16, alu, s * 18, 15, 0)); const b2 = M2.sg90Body(); b2.rotation.z = Math.PI / 2; b2.position.set(-30, 20, 0); br.add(b2); MD.mergeStatic(br); yaw.add(br);
        const pitch = new THREE.Group(); pitch.position.set(0, H.y - 83 - 29, 0); yaw.add(pitch); this.pitch = pitch;
        const lz = new THREE.Group(); lz.add(box(32, 3, 18, alu, 0, -4, 0)); lz.add(box(15, 1.6, 18.5, S({ color: 0xb8201c, roughness: 0.5 }), 0, -1.5, -2)); lz.add(cyl(3, 20, S({ color: 0xd8b25a, metalness: 1, roughness: 0.3 }), 0, 2, -12, 12).rotateX(Math.PI / 2)); MD.mergeStatic(lz); pitch.add(lz);
        // the beam and its dot
        this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); r.add(this.beam);
        this.dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xff2a20, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); this.dot.scale.setScalar(16); r.add(this.dot);
      },
      () => this.cables([['svP', [H.x + 8, 92, H.z]], ['svT', [H.x - 26, 120, H.z]]]),
    ];
  }
  ptDot(p, t) { // where the laser hits the board for pan p, tilt t (degrees)
    const H = this.ptHead, BZ = -120 + 3; const ph = (p - 90) * D2R, el = (t - 90) * D2R; const d = V3(-Math.sin(ph) * Math.cos(el), Math.sin(el), -Math.cos(ph) * Math.cos(el)); const k = (BZ - H.z) / d.z; return H.clone().addScaledVector(d, k);
  }
  ptDraw() {
    if (!this.pan) return false; const S = this.sim; const p = S.pan, t = S.tilt; const k = [Math.round(p * 10), Math.round(t * 10)].join(); if (k === this._pk) { if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables([['svP', [308, 92, 40]], ['svT', [274, 120, 40]]]); } return false; } this._pk = k;
    this.yaw.rotation.y = (p - 90) * D2R; this.pitch.rotation.x = (t - 90) * D2R;
    const d = this.ptDot(p, t); const H = this.ptHead; const on = d.x > H.x - 150 && d.x < H.x + 150 && d.y > 10 && d.y < 210; this.dot.visible = on; this.dot.position.copy(d);
    const mid = H.clone().add(d).multiplyScalar(0.5); const len = H.distanceTo(d); this.beam.position.copy(mid); this.beam.scale.set(1, len, 1); this.beam.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().sub(H).normalize()); this.beam.visible = on;
    return true;
  }

  // ================================================================== the turntable on the stepper's shaft
  turnSteps() {
    const r = this.root, S = this.mat;
    return [
      () => {
        const t = new THREE.Group(); r.add(t); this.tt = t; t.visible = false;
        const ring = (() => { const C = canvas(512, 512); const c = C.getContext('2d'); c.translate(256, 256); c.fillStyle = '#f4efe2'; c.beginPath(); c.arc(0, 0, 250, 0, 7); c.fill(); c.fillStyle = '#16171a';
          for (let a = 0; a < 360; a += 5) { c.save(); c.rotate(a * D2R); c.fillRect(-1.2, -250, 2.4, a % 30 === 0 ? 30 : a % 10 === 0 ? 18 : 9); c.restore(); }
          c.font = `800 26px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (const a of [0, 90, 180, 270]) { c.fillText(a + '°', Math.sin(a * D2R) * 202, -Math.cos(a * D2R) * 202); }
          c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, 186, 0, 7); c.fill(); return S({ map: ctex(C), roughness: 0.85, transparent: true }); })();
        const rm = new THREE.Mesh(new THREE.PlaneGeometry(166, 166), ring); rm.rotation.x = -Math.PI / 2; rm.position.y = 0.4; t.add(rm);
        t.add(cyl(32, 19, S({ color: 0x2a2b2e, roughness: 0.5 }), 0, 9.5, 8, 28)); // the motor's holder
        const disc = new THREE.Group(); disc.position.y = 31; t.add(disc); this.disc = disc;
        const wood = this.wood([0.3, 0.3], 0xe8cfa8); disc.add(cyl(62, 6, wood, 0, 3, 0, 40));
        const ar = (() => { const C = canvas(128, 128); const c = C.getContext('2d'); c.fillStyle = '#c8241c'; c.beginPath(); c.moveTo(64, 2); c.lineTo(84, 40); c.lineTo(70, 40); c.lineTo(70, 126); c.lineTo(58, 126); c.lineTo(58, 40); c.lineTo(44, 40); c.closePath(); c.fill(); return new THREE.MeshBasicMaterial({ map: ctex(C), transparent: true, depthWrite: false }); })();
        const arrow = new THREE.Mesh(new THREE.PlaneGeometry(30, 60), ar); arrow.rotation.x = -Math.PI / 2; arrow.position.set(0, 6.2, -30); disc.add(arrow);
        const terra = S({ color: 0xb8643a, roughness: 0.85 }); const pot = lathe([[0, 0], [14, 0], [24, 14], [27, 26], [22, 40], [12, 46], [13, 52], [0, 52]], terra, 24); pot.position.set(18, 6, 10); disc.add(pot);
        const dia = lathe([[0, 0], [10, 0], [16, 6], [17, 9], [0, 7]], terra, 16); dia.position.set(-24, 6, 16); disc.add(dia);
        const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb040, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); flame.scale.set(8, 14, 1); flame.position.set(-24, 22, 16); disc.add(flame);
      },
    ];
  }
  turnDraw() {
    const st = this.part('st'); if (!this.tt) return false; this.tt.visible = !!st; if (!st) return false;
    const e = this.app.view.parts.get(st.uid); const sh = e && e.obj.userData.shaft; if (!sh) return false;
    const p = this.partPoint('st', sh); const k = [p.x, p.z, st.state.angle].map((x) => Math.round(x * 100)).join(); if (k === this._tk) return false; this._tk = k;
    this.tt.position.set(p.x, 0, p.z); this.tt.rotation.y = -(st.rot || 0) * Math.PI / 2; this.disc.rotation.y = -(st.state.angle || 0) * D2R; return true;
  }
}
