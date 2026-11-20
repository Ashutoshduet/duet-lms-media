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
// Phones and the headset: the still pieces of a scene are merged by material, there are no real-time lights or shadows
// (the lamp's light is a soft pool on the floor), and a scene is built over a few frames.
import * as THREE from 'three';
import * as MD from './models.js';
import * as M2 from './models2.js';
import * as TX from './tex.js';
import { VIEWS, nextFrame } from './stage.js';
import { rotXZ } from './parts.js';
import { makeScene, PT_TARGETS, TANK } from './scenes3.js';
import { CARDS } from './libs3.js';

// the camera that sees the bench and the scene beside it
Object.assign(VIEWS, { scene3: { tgt: [150, 40, 10], hw: 300, hd: 160, dir: [-0.14, 0.6, 0.79] }, scene3pt: { tgt: [190, 70, 10], hw: 340, hd: 190, dir: [-0.1, 0.55, 0.83] } }); // (scene3pt: the joystick on the bench and the tall target board behind)
const KINDS = new Set(['air', 'garden', 'room', 'burglar', 'door', 'attend', 'bank', 'tank', 'locker', 'kitchen', 'pantilt', 'turn']);
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
      case 'air': return this.airSteps(); case 'garden': return this.gardenSteps(); case 'room': case 'burglar': return this.roomSteps(); case 'door': case 'attend': return this.doorSteps();
      case 'locker': case 'bank': return this.lockerSteps(); case 'tank': return this.tankSteps(); case 'kitchen': return this.kitchenSteps(); case 'pantilt': return this.ptSteps(); case 'turn': return this.turnSteps();
    }
    return [];
  }
  draw(dt) {
    switch (this.kind) {
      case 'air': return this.airDraw(dt); case 'garden': return this.gardenDraw(dt); case 'room': case 'burglar': return this.roomDraw(dt); case 'door': case 'attend': return this.doorDraw(dt);
      case 'locker': case 'bank': return this.lockerDraw(dt); case 'tank': return this.tankDraw(dt); case 'kitchen': return this.kitchenDraw(dt); case 'pantilt': return this.ptDraw(dt); case 'turn': return this.turnDraw(dt);
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
      () => { // the card and the tag on the desk (tap one to hold it on the reader)
        const cardM = (() => { const C = canvas(256, 160); const c = C.getContext('2d'); c.fillStyle = '#f6f6f2'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#1d4aa8'; c.fillRect(0, 0, 256, 34); c.fillStyle = '#fff'; c.font = `800 20px ${TX.FONT}`; c.fillText('DUET SCHOOL', 14, 24); c.fillStyle = '#333'; c.font = `600 15px ${TX.FONT}`; c.fillText('STUDENT ID · छात्र', 14, 70); c.fillText('UID ' + CARDS.card.uid.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '), 14, 140); c.fillStyle = '#c9a23a'; c.fillRect(186, 56, 44, 34); return S({ map: ctex(C), roughness: 0.4 }); })();
        const card = new THREE.Group(); card.add(box(85.6, 0.9, 54, [cardM, cardM, cardM, cardM, cardM, cardM], 0, 0.45, 0)); card.position.set(240, 0, 150); card.rotation.y = 0.15; r.add(card);
        const tag = new THREE.Group(); const tm = S({ color: 0x1f5fd8, roughness: 0.4 }); const sh = new THREE.Shape(); sh.absarc(0, 0, 15, Math.PI * 0.15, Math.PI * 1.85, false); sh.lineTo(26, 0); sh.closePath(); const hole = new THREE.Path(); hole.absarc(19, 0, 2.5, 0, Math.PI * 2, true); sh.holes.push(hole);
        const tg = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2 }), tm); tg.rotation.x = -Math.PI / 2; tag.add(tg); tag.position.set(300, 1, 156); r.add(tag);
        for (const [o, id] of [[card, 'card'], [tag, 'tag']]) { const pk = box(60, 10, 46, new THREE.MeshBasicMaterial({ visible: false }), 0, 4, 0); pk.userData.role = 'card3:' + id; o.add(pk); this.picks.push(pk); o.userData.home = o.position.clone(); o.userData.homeR = o.rotation.y; }
        this.cards = { card, tag };
      },
      () => this.cables([['sv1', [DX + 20, 112, DZ - 14]]]),
    ];
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
