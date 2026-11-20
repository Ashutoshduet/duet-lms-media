// DUET Robotics Lab 360, batch 2: the robot next to the bench, and its live panel. A lesson with `world` gets one:
//   arm   the 4-joint arm on the desk, its servos' plugs on the mat; live angles, reach and height
//   bin   the smart dustbin on the desk, the sensor's and the servo's plugs on the mat; a hand that brings rubbish
//   hyd   the hydraulic arm on the desk (no electronics): push the syringe, read the forces
//   car   the 2WD car on the robot floor (bt: Bluetooth pad, line: the black tape, avoid: a room with boxes). The bench is
//         the car's test stand: the same driver, motors and sensors, wired there; the car on the floor runs on them.
// The physics is in robots.js; this file draws it, reads the bench parts' servos and motors and writes their sensors.
// The panel (hud) is plain data: main.js draws it in the page, xr.js on a panel in the headset.
import * as THREE from 'three';
import * as M2 from './models2.js';
import * as MD from './models.js';
import { ArmSim, CarSim, BinSim, HydSim, ARM_POS, ARENA_POS, BIN_POS, HYD_POS, armFK, gapOf, linePoints, CAR_CFG, CARG, ARMG, SYR, HYDG, slaveLen, carFeed, DRAW } from './robots.js';
import { BO } from './parts2.js';
import { tx } from './i18n.js';
import * as TX from './tex.js';
import { nextFrame } from './stage.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const D2R = Math.PI / 180;
const frame = nextFrame; // (also in a headset: stage.js)
const W = {
  base: t3('Base', 'बेस', 'Base'), shoulder: t3('Shoulder', 'कंधा', 'Shoulder'), elbow: t3('Elbow', 'कोहनी', 'Elbow'), claw: t3('Claw', 'पंजा', 'Claw'),
  reach: t3('Reach', 'पहुँच', 'Reach'), height: t3('Height', 'ऊँचाई', 'Height'), goal: t3('Goal', 'लक्ष्य', 'Goal'), noSig: t3('off', 'बंद', 'off'),
  backA: t3('Block back to A', 'ब्लॉक वापस A पर', 'Block wapas A par'), bout: t3('Bout', 'मुकाबला', 'Muqaabla'), matta: t3('Matta! It moved before 5 s', 'मत्ता! 5 s से पहले चल पड़ी', 'Matta! 5 s se pehle chal padi'), youOut: t3('your robot is out: lost', 'आपका रोबोट बाहर: हार', 'aapka robot bahar: haar'), youWin: t3('opponent out, you stayed in: won!', 'विरोधी बाहर, आप अंदर: जीत!', 'virodhi bahar, aap andar: jeet!'), foeOut: t3('opponent out…', 'विरोधी बाहर…', 'virodhi bahar…'), waitS: t3('waiting', 'रुकी है', 'ruki hai'), fight: t3('fighting', 'लड़ रही है', 'lad rahi hai'), irs5: t3('Sensors S1–S5', 'सेंसर S1–S5', 'Sensor S1–S5'), avgOff: t3('Last lap: off the line', 'पिछला चक्कर: लाइन से दूरी', 'Pichhla chakkar: line se doori'), fromLine: t3('From the line', 'लाइन से दूरी', 'Line se doori'), swingsS: t3('swings a second', 'झूले प्रति सेकंड', 'jhoole per second'), lostLine: t3('it lost the line!', 'लाइन छूट गई!', 'line chhoot gayi!'), pen: t3('Pen', 'पेन', 'Pen'), penOn: t3('on the paper', 'काग़ज़ पर', 'kaagaz par'), penUp: t3('above', 'ऊपर', 'upar'), ink: t3('Ink drawn', 'स्याही की लाइन', 'Syaahi ki line'), offLine: t3('Worst distance from the square', 'वर्ग से सबसे ज़्यादा दूरी', 'Square se sabse zyada doori'), covered: t3('Square covered', 'वर्ग पर स्याही', 'Square par syaahi'), sheet: t3('A fresh sheet', 'नया काग़ज़', 'Naya kaagaz'), hand: t3('Hand', 'हाथ', 'Haath'), sensor: t3('Sensor reads', 'सेंसर पढ़ता है', 'Sensor padhta hai'), lid: t3('Lid', 'ढक्कन', 'Dhakkan'),
  wave: t3('Bring rubbish', 'कचरा लाइए', 'Kachra laiye'), push: t3('Push', 'धकेलिए', 'Dhakeliye'), master: t3('You push (syringe)', 'आप धकेलते हैं (सिरिंज)', 'Aap dhakelte hain (syringe)'),
  slave: t3('Lifts the arm (syringe)', 'बाँह उठाती है (सिरिंज)', 'Baanh uthati hai (syringe)'), fluid: t3('Inside the tube', 'नली के अंदर', 'Nali ke andar'), water: t3('Water', 'पानी', 'Paani'), air: t3('Air', 'हवा', 'Hawa'),
  armAngle: t3('Arm', 'बाँह', 'Baanh'), start: t3('Back to the start', 'शुरुआत पर वापस', 'Start par wapas'), speed: t3('Speed', 'रफ़्तार', 'Speed'), motors: t3('Motors L / R', 'मोटर बाएँ / दाएँ', 'Motor left / right'),
  stations: t3('Stations (■ stopped, → passed)', 'स्टेशन (■ रुका, → आगे निकला)', 'Station (■ ruka, → aage nikla)'), // batch 23
  irs: t3('IR left / right', 'IR बाएँ / दाएँ', 'IR left / right'), black: t3('black', 'काला', 'kaala'), white: t3('white', 'सफ़ेद', 'safed'), laps: t3('Laps', 'चक्कर', 'Chakkar'), lapT: t3('Lap time', 'एक चक्कर का समय', 'Lap time'),
  aheadLeft: t3('Ahead / left', 'सामने / बाएँ', 'Saamne / left'), aheadRight: t3('Ahead / right', 'सामने / दाएँ', 'Saamne / right'), rooms: t3('Rooms gone through', 'कितने कमरों से गुज़रा', 'Kitne kamron se guzra'), maze: t3('Maze', 'भूलभुलैया', 'Bhool-bhulaiya'),
  mazeA: t3('A: walls joined', 'A: दीवारें जुड़ी', 'A: deewarein judi'), mazeB: t3('B: FINISH in the middle', 'B: FINISH बीच में', 'B: FINISH beech mein'), outOf: t3('Out of the maze!', 'भूलभुलैया से बाहर!', 'Bhool-bhulaiya se bahar!'),
  roundAgain: t3('Back at START: round again', 'वापस START पर: फिर एक चक्कर', 'Wapas START par: phir ek chakkar'), deadEnd: t3('Dead end visited', 'बंद गली देखी', 'Band gali dekhi'),
  lost: t3('Line lost!', 'लाइन छूट गई!', 'Line chhoot gayi!'), ahead: t3('Ahead', 'सामने', 'Saamne'), bumps: t3('Bumps', 'टक्कर', 'Takkar'), dist: t3('Driven', 'चली', 'Chali'),
  pair: t3('Connect HC-05', 'HC-05 से जोड़िए', 'HC-05 se jodiye'), paired: t3('Connected · HC-05', 'जुड़ा · HC-05', 'Juda · HC-05'), btOff: t3('HC-05 has no power', 'HC-05 को बिजली नहीं', 'HC-05 ko power nahi'),
  sent: t3('Sent', 'भेजा', 'Bheja'), app: t3('DUET BT Car', 'DUET BT कार', 'DUET BT Car'), parked: t3('Parked in P ✓', 'P में खड़ी ✓', 'P mein khadi ✓'), scan: t3('Scan', 'स्कैन', 'Scan'),
  ok: t3('done ✓', 'हो गया ✓', 'ho gaya ✓'), notYet: t3('not yet', 'अभी नहीं', 'abhi nahi'), fwd: t3('forward', 'आगे', 'aage'), rev: t3('back', 'पीछे', 'peeche'), stop: t3('stop', 'रुकी', 'ruki'),
  // batch 14: the table robot, the light-seeker, the dancer, the lap counter
  desk: t3('desk', 'मेज़', 'table'), edgeW: t3('EDGE', 'किनारा', 'KINAARA'), escaped: t3('Edges escaped', 'बचे हुए किनारे', 'Bache hue kinaare'), fellOff: t3('It fell off the desk! Press Start.', 'यह मेज़ से गिर गया! Start दबाइए।', 'Yeh table se gir gaya! Start dabaiye.'),
  eyes: t3('Light left / right', 'रोशनी बाएँ / दाएँ', 'Roshni left / right'), torchD: t3('To the torch', 'टॉर्च तक', 'Torch tak'), torch: t3('Torch', 'टॉर्च', 'Torch'), atTorch: t3('At the torch', 'टॉर्च पर पहुँचा', 'Torch par pahuncha'),
  lastSpin: t3('Last spin', 'आख़िरी चक्कर', 'Aakhri chakkar'), fromSpot: t3('From the spot', 'निशान से दूरी', 'Nishaan se doori'), marker: t3('Lap marker', 'लैप निशान', 'Lap nishaan'), passes: t3('passes', 'बार', 'baar'),
};
export { W as WORLD_WORDS };
const yes = (b) => tx(b ? W.ok : W.notYet);

// ------------------------------------------------------------------ the base: build, sync, panel, clean up
class World {
  constructor(app, cfg) { this.app = app; this.lab = app.lab; this.stage = app.stage; this.cfg = cfg; this.kind = cfg.kind; this.root = new THREE.Group(); this.root.name = 'world'; this.root.visible = false; this.ready = false; }
  part(tag) { return this.lab.byTag(tag); }
  flag(n) { return !!(this.sim && this.sim.flags.has(n)); }
  val(n) { return this.sim ? this.sim[n] : undefined; }
  // built over a few frames, compiled (in parallel where the GPU can), then shown: no long freeze when a lesson opens
  async build() {
    const t0 = performance.now(); this.stage.root.add(this.root);
    for (const f of this.steps()) { f(); if (this.dead) return; await frame(); }
    if (this.dead) return;
    try { this.compiling = this.stage.warm(this.root); await this.compiling; } catch (e) { /* compile when drawn */ }
    this.compiling = null;
    if (this.dead) return;
    this.root.visible = true; this.ready = true; this.buildMs = Math.round(performance.now() - t0); this.stage.kick();
  }
  steps() { return []; }
  update() { return false; }
  onRun() {}
  control() {}
  pickables() { return []; }
  dispose() { // (not while its shaders are being compiled: their materials must still be there)
    this.dead = true; this.stage.root.remove(this.root);
    const free = () => MD.dispose(this.root); if (this.compiling) this.compiling.then(free, free); else free();
  }
  // a sign on the desk or floor (a canvas plane)
  sign(text, w, col = '#e8a020', sz = 64) {
    const C = document.createElement('canvas'); C.width = 128; C.height = 128; const c = C.getContext('2d');
    c.strokeStyle = col; c.lineWidth = 8; c.beginPath(); c.arc(64, 64, 56, 0, 7); c.stroke(); c.fillStyle = col; c.font = `800 ${sz}px ${TX.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 64, 68);
    const tex = new THREE.CanvasTexture(C); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m;
  }
  // cables from the plugs on the mat to the robot (one draw call); rebuilt when a plug moves
  cables(tags, to) {
    const sig = tags.map((tg) => { const p = this.part(tg); return p ? [p.at.x, p.at.z, p.rot] : null; }); const key = JSON.stringify(sig);
    if (key === this.cableKey) return; this.cableKey = key;
    if (this.cableObj) { this.root.remove(this.cableObj); MD.dispose(this.cableObj); }
    const paths = []; tags.forEach((tg, i) => {
      const p = this.part(tg); if (!p) return; const e = this.app.view.parts.get(p.uid); if (!e || !e.obj.userData.cableEnd) return;
      const a = e.obj.userData.cableEnd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -(p.rot || 0) * Math.PI / 2).add(new THREE.Vector3(p.at.x, 0, p.at.z));
      const b = new THREE.Vector3(...to(i));
      paths.push([a, new THREE.Vector3(a.x + 30, 4, a.z + (b.z - a.z) * 0.15), new THREE.Vector3((a.x + b.x) / 2, 3, (a.z + b.z) / 2 + 20), new THREE.Vector3(b.x - 20, b.y * 0.5, b.z), b]);
    });
    this.cableObj = M2.cableBundle(paths, 1.6); this.root.add(this.cableObj);
  }
}

// ------------------------------------------------------------------ the arm
class ArmWorld extends World {
  constructor(app, cfg) { super(app, cfg); this.sim = new ArmSim(cfg.level); this.tags = ['svB', 'svS', 'svE', 'svG']; }
  steps() {
    const [ax, ay, az] = ARM_POS; const r = this.root; const S = this.sim;
    return [
      () => { this.arm = M2.buildArm(); this.arm.position.set(ax, ay, az); r.add(this.arm); const b = M2.blobShadow(190, 190, 0.4); b.position.set(ax, ay + 0.3, az); r.add(b); },
      () => { // the block, the A and B marks, the goals of the level, the reach the claw has on the desk
        const wood = new THREE.MeshStandardMaterial({ color: 0xc89660, roughness: 0.75 }); this.cube = MD.box(ARMG.cube, ARMG.cube, ARMG.cube, wood); r.add(this.cube); this.cube.visible = this.cfg.level === 4 || this.cfg.level === 5;
        if (this.cfg.level === 6) this.paper();
        if (this.cfg.level === 4 || this.cfg.level === 5) for (const [k, p] of [['A', S.A], ['B', S.B]]) { const s = this.sign(k, 60, k === 'A' ? '#3aa0ff' : '#e8a020'); s.position.set(ax + p[0], ay + 0.4, az + p[2]); r.add(s); }
        if (this.cfg.level === 1) { const f = new THREE.Group(); const a = this.sim.flagAngle * D2R; f.position.set(ax + Math.cos(a) * 200, ay, az + Math.sin(a) * 200); f.add(MD.cyl(1.5, 120, new THREE.MeshStandardMaterial({ color: 0xdddddd }), 0, 60, 0, 8)); const fl = MD.box(46, 28, 1, new THREE.MeshStandardMaterial({ color: 0xd8341c, roughness: 0.6 }), 23, 104, 0); f.add(fl); f.add(MD.cyl(14, 4, new THREE.MeshStandardMaterial({ color: 0x333333 }), 0, 2, 0, 16)); r.add(f); }
        if (this.cfg.level === 2 || this.cfg.level === 3) { const b = S.ball; const g = new THREE.Group(); g.position.set(ax + b[0], ay, az + b[2]); g.add(MD.cyl(1.4, b[1] - 10, new THREE.MeshStandardMaterial({ color: 0xbfc2c6, metalness: 1, roughness: 0.3 }), 0, (b[1] - 10) / 2, 0, 8)); g.add(MD.cyl(16, 4, new THREE.MeshStandardMaterial({ color: 0x333333 }), 0, 2, 0, 16)); this.ballM = new THREE.MeshStandardMaterial({ color: 0xe0342a, roughness: 0.4, emissive: 0x22ff44, emissiveIntensity: 0 }); const ball = new THREE.Mesh(new THREE.SphereGeometry(10, 20, 14), this.ballM); ball.position.y = b[1]; g.add(ball); r.add(g); }
        // the reach on the desk: from the closest to the farthest the claw can touch the desk (a half ring in front)
        let rmin = 1e9, rmax = 0; for (let s = 0; s <= 180; s += 3) for (let e = 30; e <= 180; e += 3) { const f = armFK(90, s, e); if (Math.abs(f.grip[1] - 12) < 6) { rmin = Math.min(rmin, f.reach); rmax = Math.max(rmax, f.reach); } }
        this.reachMinMax = [rmin, rmax];
        const ring = new THREE.Mesh(new THREE.RingGeometry(rmin, rmax, 48, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }));
        ring.rotation.x = Math.PI / 2; ring.position.set(ax, ay + 0.3, az); r.add(ring);
      },
      () => this.cables(this.tags, (i) => [ARM_POS[0] - 30, 40 - i * 6, ARM_POS[2] + 10 - i * 5]),
    ];
  }
  // (batch 24, level 6) the sheet of paper with the square pencilled on it, the ink (a canvas over the desk in front of the
  // arm, so ink off the paper shows too), the felt pen in the claw along the forearm
  paper() {
    const [ax, ay, az] = ARM_POS; const r = this.root; const pp = DRAW.paper; const K = 4; // (canvas px a mm)
    const C = document.createElement('canvas'); C.width = pp.w * K; C.height = pp.d * K; const c = C.getContext('2d');
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, C.width, C.height);
    c.strokeStyle = 'rgba(90,90,90,0.6)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); DRAW.sq.forEach(([x, z], i) => { const u = (x - pp.cx + pp.w / 2) * K, v = (z - pp.cz + pp.d / 2) * K; if (i) c.lineTo(u, v); else c.moveTo(u, v); }); c.closePath(); c.stroke(); // the pencilled square
    const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(pp.w, pp.d), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(ax + pp.cx, ay + 0.15, az + pp.cz); r.add(sheet);
    const b = M2.blobShadow(pp.w + 10, pp.d + 10, 0.18); b.position.set(ax + pp.cx, ay + 0.1, az + pp.cz); r.add(b);
    // the ink: a transparent canvas over 440 × 320 mm of desk in front of the arm
    const IW = 440, ID = 320, IX = -220, IZ = -60, IK = 3; const IC = document.createElement('canvas'); IC.width = IW * IK; IC.height = ID * IK;
    const it = new THREE.CanvasTexture(IC); it.colorSpace = THREE.SRGBColorSpace; it.anisotropy = 4;
    const ink = new THREE.Mesh(new THREE.PlaneGeometry(IW, ID), new THREE.MeshBasicMaterial({ map: it, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); ink.rotation.x = -Math.PI / 2; ink.position.set(ax + IX + IW / 2, ay + 0.3, az + IZ + ID / 2); r.add(ink);
    this.inkAt = { IC, it, IX, IZ, IK, done: new Map(), strokes: null };
    // the felt pen, through the claw along the forearm (the elbow link's +z), its tip ARMG.pen past the wrist
    const J = this.arm.userData.j; const pen = new THREE.Group(); const L = ARMG.L2;
    const body = MD.cyl(4.6, 64, new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.4 }), 0, 0, 0, 16); body.rotation.x = Math.PI / 2; body.position.z = L + 4; pen.add(body);
    const cap = MD.cyl(4.9, 16, new THREE.MeshStandardMaterial({ color: 0x1d3fa8, roughness: 0.45 }), 0, 0, 0, 16); cap.rotation.x = Math.PI / 2; cap.position.z = L - 34; pen.add(cap);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 12, 14), new THREE.MeshStandardMaterial({ color: 0x1d3fa8, roughness: 0.5 })); cone.rotation.x = Math.PI / 2; cone.position.z = L + ARMG.pen - 6; pen.add(cone);
    J.el.add(pen); this.pen = pen;
  }
  inkDraw() {
    const A = this.inkAt; if (!A) return false; const S = this.sim; const c = A.IC.getContext('2d'); let ch = false;
    if (A.strokes !== S.strokes) { A.strokes = S.strokes; A.done = new Map(); c.clearRect(0, 0, A.IC.width, A.IC.height); ch = true; } // a fresh sheet (Run again)
    c.strokeStyle = 'rgba(29,63,168,0.92)'; c.lineWidth = 1.4 * A.IK; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const st of S.strokes) {
      const from = A.done.get(st) || 0; if (st.length <= from) continue;
      c.beginPath(); const p0 = st[Math.max(0, from - 1)]; c.moveTo((p0[0] - A.IX) * A.IK, (p0[1] - A.IZ) * A.IK);
      for (let i = Math.max(1, from); i < st.length; i++) c.lineTo((st[i][0] - A.IX) * A.IK, (st[i][1] - A.IZ) * A.IK);
      if (st.length === 1) c.lineTo((p0[0] - A.IX) * A.IK + 0.5, (p0[1] - A.IZ) * A.IK);
      c.stroke(); A.done.set(st, st.length); ch = true;
    }
    if (ch) A.it.needsUpdate = true; return ch;
  }
  angles() {
    const a = {}; const st = { b: 90, s: 90, e: 90, g: 90 }; this.sig = {};
    ['b', 's', 'e', 'g'].forEach((k, i) => { const p = this.part(this.tags[i]); a[k] = p ? p.state.angle : st[k]; this.sig[k] = !!(p && p.state.target !== null && p.state.target !== undefined); });
    return a;
  }
  update(dt) {
    if (!this.ready) return false; const ang = this.angles(); const S = this.sim; S.update(dt, ang);
    const g = this.part('svG'); if (g) g.state.limit = S.limit;
    const J = this.arm.userData.j; J.yaw.rotation.y = (90 - ang.b) * D2R; J.sh.rotation.x = -ang.s * D2R; J.el.rotation.x = (180 - ang.e) * D2R;
    const gap = gapOf(ang.g); J.fingers.forEach((f, i) => { f.position.x = (i ? 1 : -1) * (gap / 2 + 1); });
    if (this.cube) { const [ax, ay, az] = ARM_POS; this.cube.position.set(ax + S.cube.p[0], ay + S.cube.p[1], az + S.cube.p[2]); if (S.cube.held) { const fk = S.fk; this.cube.rotation.y = -(ang.b - 90) * D2R; } }
    if (this.ballM) this.ballM.emissiveIntensity = S.ballD < 16 ? 0.9 : 0;
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables(this.tags, (i) => [ARM_POS[0] - 30, 40 - i * 6, ARM_POS[2] + 10 - i * 5]); }
    const inked = this.cfg.level === 6 && this.inkDraw();
    const k = [ang.b, ang.s, ang.e, ang.g, S.cube.p[1]].map((x) => Math.round(x * 10)).join(); const moved = k !== this._k; this._k = k; return moved || inked;
  }
  onRun() { this.sim.reset(); }
  control(id) { if (id === 'backA' || id === 'sheet') { this.sim.reset(); } }
  hud() {
    const S = this.sim, a = S.ang || { b: 90, s: 90, e: 90, g: 90 }, fk = S.fk || armFK(90, 90, 90); const sg = this.sig || {};
    const deg = (k) => Math.round(a[k]) + '°' + (sg[k] ? '' : ' (' + tx(W.noSig) + ')');
    const rows = [[tx(W.base), deg('b')], [tx(W.shoulder), deg('s')], [tx(W.elbow), deg('e')], [tx(W.claw), deg('g') + ` ${Math.round(S.gap ?? 0)} mm`],
      [tx(W.reach), `${fk.reach} / ${this.reachMinMax ? this.reachMinMax[1] : '…'} mm`], [tx(W.height), `${fk.height} mm`]];
    const L = this.cfg.level;
    if (L === 1) rows.push([tx(W.goal), `🚩 ${S.flagAngle}° · ${yes(S.flags.has('aimed'))}`]);
    if (L === 2 || L === 3) rows.push([tx(W.goal), `🔴 ${S.ballD ?? '…'} mm · ${yes(S.flags.has('touched'))}`]);
    if (L === 4 || L === 5) rows.push([tx(W.goal), `A → B · ${yes(S.flags.has('placed'))}`]);
    if (L === 6) { const R = S.res || {}; rows.splice(3, 3, [tx(W.pen), S.penDown ? tx(W.penOn) : `${Math.max(0, Math.round(S.penH ?? 0))} mm ${tx(W.penUp)}`], [tx(W.ink), `${Math.round(S.ink || 0)} mm`],
      [tx(W.offLine), R.dev !== undefined ? `${R.dev} mm` : '—'], [tx(W.covered), R.cover !== undefined ? `${R.cover} %` : '—']); }
    const ctl = L === 4 || L === 5 ? [{ id: 'backA', kind: 'button', label: W.backA }] : L === 6 ? [{ id: 'sheet', kind: 'button', label: W.sheet }] : [];
    return { title: t3('Robot arm', 'रोबोट की बाँह', 'Robot arm'), rows, controls: ctl, labels: this.jointLabels(a, sg) };
  }
  jointLabels(a) { // where to show each joint's angle (bench mm)
    if (!this.arm) return []; const [ax, ay, az] = ARM_POS; const fk = this.sim.fk || armFK(a.b, a.s, a.e);
    return [[`${Math.round(a.b)}°`, [ax, ay + 30, az + 70]], [`${Math.round(a.s)}°`, [ax, ay + ARMG.h0 + 18, az]], [`${Math.round(a.e)}°`, [ax + fk.elbow[0], ay + fk.elbow[1] + 18, az + fk.elbow[2]]], [`${Math.round(this.sim.gap ?? 0)} mm`, [ax + fk.tip[0], ay + fk.tip[1] + 12, az + fk.tip[2]]]];
  }
}

// ------------------------------------------------------------------ the smart dustbin
let HAND = null; // the hand model (CC-BY, see credits): loaded once
async function loadHand() {
  if (HAND) return HAND;
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/libs/meshopt_decoder.module.js')]);
  const g = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('models/hand.glb');
  HAND = g.scene; return HAND;
}
class BinWorld extends World {
  constructor(app, cfg) { super(app, cfg); this.sim = new BinSim(); }
  steps() {
    const [bx, by, bz] = BIN_POS; const r = this.root;
    return [
      () => { this.bin = M2.buildBin(); this.bin.position.set(bx, by, bz); r.add(this.bin); const b = M2.blobShadow(330, 330, 0.45); b.position.set(bx, by + 0.3, bz); r.add(b); const sv = this.part('sv'); if (sv) sv.state.angle = 0; }, // (the lid starts shut)
      () => { this.paper = M2.buildPaperBall(); r.add(this.paper); this.paper.visible = false;
        this.handG = new THREE.Group(); r.add(this.handG);
        loadHand().then((h) => { if (this.dead) return; const m = h.clone(); m.scale.setScalar(10); m.rotation.set(0, Math.PI, -0.25); const box = new THREE.Box3().setFromObject(m); const c = box.getCenter(new THREE.Vector3()); m.position.sub(c); this.handG.add(m); this.stage.kick(); }).catch((e) => console.warn('hand', e)); },
      () => this.cables(['us', 'sv'], (i) => [bx - 40, 30 + i * 20, bz + 60 - i * 120]),
    ];
  }
  update(dt) {
    if (!this.ready) return false; const sv = this.part('sv'); const us = this.part('us'); const S = this.sim;
    const ang = sv && sv.state.target !== null && sv.state.target !== undefined ? sv.state.angle : (sv ? sv.state.angle : 0);
    const d = Math.round(S.update(dt, sv ? ang : 0)); if (us) { us.state.ext = true; if (us.state.dist !== d) { us.state.dist = d; this.lab.stateV++; } }
    const [bx, by, bz] = BIN_POS; const B = M2.BING;
    this.bin.userData.lid.rotation.x = -S.lid * D2R; this.bin.userData.horn.rotation.z = -(sv ? sv.state.angle : 0) * D2R * 0.9;
    // the hand: in front of the sensor, at its distance; the paper in it, or falling
    const hy = by + B.h - 34, hz = bz + B.r1 + 10 + S.hand * 10; this.handG.position.set(bx + 10, hy + 30, hz);
    const p = this.paper; p.visible = S.mode === 'wave' || (S.paper.s === 'bounce' && S.paper.t < 3);
    if (S.paper.s === 'hand') p.position.set(bx + 10, hy + 6, hz - 40);
    else if (S.paper.s === 'in') { const t = Math.min(1, S.paper.t / 0.7); p.position.set(bx + 10 * (1 - t), by + B.h + 60 - 300 * t * t, bz + (B.r1 + 70) * (1 - t)); p.visible = S.paper.t < 0.8; }
    else if (S.paper.s === 'bounce') { const t = S.paper.t; p.position.set(bx + 10 + t * 60, Math.max(by + 17, by + B.h + 40 - 500 * t * t + 120 * t), bz + B.r1 + 60 + t * 120); }
    if (this.lab.version !== this._v) { this._v = this.lab.version; this.cables(['us', 'sv'], (i) => [bx - 40, 30 + i * 20, bz + 60 - i * 120]); }
    const k = [Math.round(S.lid), Math.round(S.hand), S.mode, S.paper.s].join(); const moved = k !== this._k || S.mode === 'wave'; this._k = k; return moved;
  }
  onRun() { const f = this.sim.flags; for (const k of ['opened', 'binned', 'closed', 'missed']) f.delete(k); this.sim.openAt = null; }
  control(id, v) { if (id === 'hand') { this.sim.mode = 'idle'; this.sim.hand = +v; } if (id === 'wave') this.sim.wave(); }
  hud() {
    const S = this.sim; const us = this.part('us');
    return { title: t3('Smart dustbin', 'स्मार्ट कूड़ेदान', 'Smart dustbin'), rows: [[tx(W.hand), `${Math.round(S.hand)} cm`], [tx(W.sensor), us && us.state.powered ? `${us.state.dist} cm` : '—'], [tx(W.lid), `${Math.round(S.lid)}°`]],
      controls: [{ id: 'hand', kind: 'range', label: W.hand, min: 5, max: 70, value: Math.round(S.hand), unit: 'cm' }, { id: 'wave', kind: 'button', label: W.wave }] };
  }
}

// ------------------------------------------------------------------ the hydraulic arm
class HydWorld extends World {
  constructor(app, cfg) { super(app, cfg); this.sim = new HydSim(); }
  steps() { return [() => this.buildRig()]; }
  buildRig() {
    if (this.rig) { this.root.remove(this.rig); MD.dispose(this.rig); }
    const [hx, hy, hz] = HYD_POS; const rig = M2.buildHydraulic(); rig.position.set(hx, hy, hz); this.root.add(rig); this.rig = rig;
    const ud = rig.userData; const S = this.sim;
    this.ms = M2.buildSyringe(S.master, ud.waterM); this.ms.position.set(70, 14, 60); rig.add(this.ms); // you push this one (lying on the board)
    this.ss = M2.buildSyringe(S.slave, ud.waterM); rig.add(this.ss); // this one lifts the arm
    // the tube of water from nozzle to nozzle
    this.tubeM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false });
    if (!this.blob) { this.blob = M2.blobShadow(380, 260, 0.35); this.root.add(this.blob); } this.blob.position.set(hx + 40, hy + 0.3, hz);
    this.rigKey = S.master + '/' + S.slave; this.tubeKey = null;
  }
  update() {
    if (!this.ready) return false; const S = this.sim; S.update();
    if (S.master + '/' + S.slave !== this.rigKey) this.buildRig();
    const H = HYDG; const ud = this.rig.userData;
    ud.arm.rotation.z = S.phi * D2R;
    // the lift syringe: its nozzle at the mount on the board, pointing at the arm
    const p = S.phi * D2R; const Q = new THREE.Vector2(H.lever * Math.cos(p), H.pivot[1] + H.lever * Math.sin(p)); const B = new THREE.Vector2(...H.mount);
    const dir = Q.clone().sub(B); const L = dir.length(); const ang = Math.atan2(dir.y, dir.x);
    const ss = this.ss; ss.position.set(B.x, B.y, 0); ss.rotation.set(0, 0, ang);
    const sMm = (L - S.L0 + 4); ss.userData.pl.position.x = Math.max(0, sMm); this.waterIn(ss, Math.max(1, sMm));
    // the syringe you push: the plunger goes in by d1
    const m = this.ms; const strokeM = SYR[S.master].L; m.userData.pl.position.x = strokeM + 4 - S.d1; this.waterIn(m, Math.max(1, strokeM + 4 - S.d1));
    // the tube (rebuilt when the lift syringe has moved)
    const tk = Math.round(S.phi * 2); if (tk !== this.tubeKey) { this.tubeKey = tk; this.tubeIt(B); }
    const k = Math.round(S.phi * 10) + '/' + Math.round(S.d1); const moved = k !== this._k; this._k = k; return moved;
  }
  waterIn(syr, len) { const w = syr.userData.water; w.scale.y = len; w.position.x = 6 + len / 2; w.material.opacity = this.sim.fluid === 'air' ? 0.08 : 0.75; }
  tubeIt(B) {
    if (this.tube) { this.rig.remove(this.tube); this.tube.geometry.dispose(); }
    const a = new THREE.Vector3(70, 14, 60), b = new THREE.Vector3(B.x, B.y, 0); const ang = this.ss.rotation.z;
    const pts = [a, a.clone().add(new THREE.Vector3(-30, 0, 0)), new THREE.Vector3(-20, 8, 50), new THREE.Vector3(B.x - 40, 8, 20), b.clone().add(new THREE.Vector3(-Math.cos(ang) * 30, -Math.sin(ang) * 30 + 2, 0)), b];
    this.tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 2.4, 8, false), this.sim.fluid === 'air' ? this.tubeM : this.rig.userData.waterM); this.rig.add(this.tube);
  }
  pickables() { return this.ms ? [this.ms.userData.pl] : []; }
  drag(dx) { this.sim.push = Math.max(0, Math.min(1, this.sim.push + dx)); this.stage.kick(); }
  control(id, v) { const S = this.sim; if (id === 'push') S.push = v / 100; if (id === 'master') { S.master = +v; S.push = 0; } if (id === 'slave') { S.slave = +v; S.push = 0; } if (id === 'fluid') { S.fluid = v; S.push = 0; this.tubeKey = null; } }
  hud() {
    const S = this.sim; const f = (x, d = 1) => x.toFixed(d);
    return { title: t3('Hydraulic arm', 'हाइड्रॉलिक बाँह', 'Hydraulic arm'),
      rows: [['F₁ = P × A₁', `${f(S.F1)} N (≈ ${Math.round(S.F1 / 9.81 * 1000)} g)`], ['A₁', `${f(S.Am, 2)} cm²`], ['P', `${f(S.P / 1000)} kPa`], ['A₂', `${f(S.As, 2)} cm²`], ['F₂ = P × A₂', `${f(S.F2)} N`],
        ['d₁ → d₂', `${Math.round(S.d1)} mm → ${Math.round(S.d2)} mm`], [tx(W.armAngle), `${Math.round(S.phi)}°`]],
      controls: [{ id: 'push', kind: 'range', label: W.push, min: 0, max: 100, value: Math.round(S.push * 100), unit: '%' },
        { id: 'master', kind: 'seg', label: W.master, options: [['5', '5 mL'], ['10', '10 mL'], ['20', '20 mL']], value: String(S.master) },
        { id: 'slave', kind: 'seg', label: W.slave, options: [['5', '5 mL'], ['10', '10 mL'], ['20', '20 mL']], value: String(S.slave) },
        { id: 'fluid', kind: 'seg', label: W.fluid, options: [['water', W.water], ['air', W.air]], value: S.fluid }] };
  }
}

// ------------------------------------------------------------------ the car
class CarWorld extends World {
  constructor(app, cfg) { super(app, cfg); this.sim = new CarSim(cfg.car); this.wa = [0, 0]; }
  steps() {
    const r = this.root; const cfg = CAR_CFG[this.cfg.car];
    return [
      () => { this.buildArenaNow(this.sim.cfg);
        if (cfg.lamps) { this.torch = M2.buildTorch(); this.arena.add(this.torch); this.placeTorch(); } // (batch 14)
        if (cfg.foe) { this.foe = M2.buildSumoFoe(); this.arena.add(this.foe); this.placeFoe(); } }, // (batch 24: the sumo dummy)
      () => { this.car = M2.buildCar(this.cfg.car, null, this.cfg); this.car.rotation.order = 'YXZ'; this.arena.add(this.car); this.place(); },
    ];
  }
  buildArenaNow(cfg) { // (batch 18: the maze robot's panel can swap maze A for maze B: the arena is built again)
    if (this.arena) { if (this.car) this.arena.remove(this.car); this.root.remove(this.arena); MD.dispose(this.arena); }
    this.arena = M2.buildArena({ track: cfg.line ? linePoints() : null, start: cfg.line || cfg.park ? cfg.start : null, park: cfg.park, boxes: cfg.boxes, plain: !cfg.line && !cfg.park && !cfg.dance && !cfg.maze, room: cfg.room, table: cfg.table, dance: cfg.dance, marker: cfg.marker, maze: cfg.maze, finish: cfg.finish, ring: cfg.ring, stations: cfg.stations });
    this.arena.position.set(...ARENA_POS); this.root.add(this.arena); if (this.car) this.arena.add(this.car);
  }
  place() { // (batch 14: a car that fell off the desk drops to the floor, nose or side first)
    const S = this.sim; let y = 0, rx = 0, rz = 0;
    if (S.fell) { const t = S.fallT; y = -Math.min(M2.DESK_H - 22, 0.5 * 9810 * t * t); const a = Math.min(1.25, t * 4.2); if (S.fell.k === 'F') rx = a; else rz = S.fell.k === 'L' ? -a : a; }
    this.car.position.set(S.x, y, S.z); this.car.rotation.set(rx, S.h, rz, 'YXZ');
  }
  placeFoe() { const F = this.sim.foe; if (!F || !this.foe) return; const R = this.sim.cfg.ring.r; const out = Math.hypot(F.x, F.z) > R + 40; this.foe.position.set(F.x, out ? -6 : 0, F.z); this.foe.rotation.set(out ? 0.12 : 0, Math.PI, 0); } // (off the ring: down on the floor, tipped)
  placeTorch() { const L = this.sim.lampAt(); if (!L || !this.torch) return; this.torch.position.set(L[0], 0, L[1]); this.torch.rotation.y = Math.atan2(-L[0], -L[1]); }
  wheel(tag) { const p = this.part(tag); return p ? p.state.w / BO.gear * BO.rw : 0; } // mm/s along the floor
  update(dt) {
    if (!this.ready) return false; const S = this.sim, live = this.car.userData.live;
    const vl = this.wheel('mL'), vr = this.wheel('mR'); S.update(dt, vl, vr); this.place();
    live.motors[1].rotation.x += vl / BO.rw * dt; live.motors[0].rotation.x += vr / BO.rw * dt; // (motors[1] is the left wheel: +x)
    // the sensors on the bench read what the car's sensors see
    if (this.cfg.car === 'line') { const s = S.sensors(); this.sens = s; for (const [tag, b] of [['irL', s.L], ['irR', s.R]]) { const p = this.part(tag); if (p) { p.state.ext = true; const d = b ? 40 : 1; if (p.state.dist !== d) { p.state.dist = d; this.lab.stateV++; this.lab.instKey = null; } if (live.leds['ir' + tag.slice(2)]) live.leds['ir' + tag.slice(2)].emissiveIntensity = p.state.near ? 2.6 : 0; } } }
    if (this.cfg.car === 'avoid') { const sv = this.part('sv1'); const sa = sv ? sv.state.angle : 90; if (live.scan) live.scan.rotation.y = (sa - 90) * D2R; const us = this.part('us1'); if (us) { us.state.ext = true; const d = S.usCm(sa); this.ahead = d; if (us.state.dist !== d) { us.state.dist = d; } } }
    if (this.cfg.car === 'pid') { carFeed(S, this.lab); const p = this.part('ir5'); for (let i = 0; i < 5; i++) { const m = live.leds['s' + (i + 1)]; if (m) m.emissiveIntensity = p && p.state.powered && !(p.state.black || [])[i] ? 2.4 : 0; } } // (batch 24: the five-sensor bar)
    if (this.foe) this.placeFoe();
    if (['edge', 'light', 'lap', 'maze', 'mazeR', 'deliv', 'sumo'].includes(this.cfg.car)) { carFeed(S, this.lab); for (const t of ['irL', 'irR', 'irM']) { const p = this.part(t); if (p && live.leds[t]) live.leds[t].emissiveIntensity = p.state.powered !== false && p.state.near ? 2.6 : 0; } } // (batch 14)
    const drv = this.part('drv'); if (drv && live.leds.pwr) live.leds.pwr.emissiveIntensity = (drv.state.vs || 0) > 6.8 ? 2.4 : 0;
    const bt = this.part('bt'); if (bt && live.leds.bt) live.leds.bt.emissiveIntensity = !bt.state.powered ? 0 : bt.state.paired ? ((performance.now() / 1000) % 2 < 0.25 ? 2.4 : 0) : ((performance.now() / 100) % 2 < 1 ? 2.4 : 0);
    return Math.abs(vl) + Math.abs(vr) > 1 || !!bt || (S.fell && S.fallT < 1);
  }
  onRun() { this.sim.reset(); for (const t of ['mL', 'mR']) { const p = this.part(t); if (p) p.state.w = 0; } this.place(); this.placeTorch(); this.placeFoe(); if (this.sim.cfg.maze || this.sim.cfg.stations || this.sim.cfg.ring) carFeed(this.sim, this.lab); } // (the car is put back on its start, its wheels still; the sensors read the start before the sketch's first loop)
  control(id, v) {
    if (id === 'start') { this.sim.reset(); this.place(); this.placeTorch(); this.placeFoe(); }
    if (id === 'maze' && this.sim.cfg.maze && v !== this.sim.cfg.maze) { this.sim.setMaze(v); this.buildArenaNow(this.sim.cfg); this.place(); carFeed(this.sim, this.lab); this.stage.kick(); } // (batch 18)
    if (id === 'lamp') { this.sim.lamp = v; this.sim.foundT = 0; this.placeTorch(); this.stage.kick(); } // (batch 14: move the torch)
    if (id === 'pair') { const bt = this.part('bt'); if (bt && bt.state.powered) { bt.state.paired = true; this.lab.stateV++; } }
    if (id === 'key') { const r = this.lab.btSend(v); this.lastSend = { k: v, r }; this.app.onBT && this.app.onBT(r); }
  }
  hud() {
    const S = this.sim, k = this.cfg.car; const drv = this.part('drv'); const ds = drv ? drv.state : {};
    const pct = (x) => (x ? (x > 0 ? '▲ ' : '▼ ') + Math.round(Math.abs(x) * 100) + '%' : '■ 0%');
    const rows = [[tx(W.motors), `${pct(ds.a)} / ${pct(ds.b)}`], [tx(W.speed), `${Math.round(Math.abs((S.vl + S.vr) / 2))} mm/s`], [tx(W.dist), `${(S.odo / 1000).toFixed(1)} m`]];
    if (k === 'line') { const s = this.sens || { L: false, R: false }; rows.unshift([tx(W.irs), `${tx(s.L ? W.black : W.white)} / ${tx(s.R ? W.black : W.white)}`]); rows.push([tx(W.laps), `${S.lap.n}${S.lap.best ? ' · ' + tx(W.lapT) + ' ' + S.lap.best.toFixed(1) + ' s' : ''}`]); if (S.flags.has('lost') && S.offT > 0.5) rows.push(['⚠', tx(W.lost)]); }
    if (k === 'avoid') { rows.unshift([tx(W.ahead), `${this.ahead ?? '…'} cm`]); rows.push([tx(W.bumps), String(S.bumps)]); }
    const controls = [{ id: 'start', kind: 'button', label: W.start }];
    if (k === 'bt') { const bt = this.part('bt'); controls.unshift({ id: 'pad', kind: 'pad', label: W.app, status: !bt || !bt.state.powered ? tx(W.btOff) : bt.state.paired ? tx(W.paired) : '', paired: !!(bt && bt.state.paired), canPair: !!(bt && bt.state.powered) }); if (S.flags.has('parked')) rows.push(['P', tx(W.parked)]); }
    if (k === 'pi' && S.flags.has('parked')) rows.push(['P', tx(W.parked)]); // batch 6: the Raspberry Pi car
    if (k === 'edge') { const s = S.fell ? { L: false, R: false } : S.edgeSens(); rows.unshift([tx(W.irs), `${tx(s.L ? W.edgeW : W.desk)} / ${tx(s.R ? W.edgeW : W.desk)}`]); rows.push([tx(W.escaped), String(S.saves)]); if (S.fell) rows.push(['⚠', tx(W.fellOff)]); }
    if (k === 'light') { const l = this.part('ldrL'), r = this.part('ldrR'); rows.unshift([tx(W.eyes), `${l ? Math.round(l.state.lux || 0) : '—'} / ${r ? Math.round(r.state.lux || 0) : '—'} lux`]); rows.push([tx(W.torchD), `${Math.round(S.lampDist() / 10)} cm`]); if (S.found.has(S.lamp)) rows.push(['★', tx(W.atTorch)]);
      controls.unshift({ id: 'lamp', kind: 'seg', label: W.torch, options: [['A', 'A'], ['B', 'B'], ['C', 'C']], value: S.lamp }); }
    if (k === 'dance') { rows.push([tx(W.lastSpin), S.lastSpin === null ? '—' : `${Math.abs(S.lastSpin)}° ${S.lastSpin > 0 ? '↺' : '↻'}`]); rows.push([tx(W.fromSpot), `${Math.round((S.fromSpot || 0) / 10)} cm`]); }
    if (k === 'sumo') { const e = S.ringOut ? { L: false, R: false } : S.ringEdge(); rows.unshift([tx(W.irs), `${tx(e.L ? W.white : W.black)} / ${tx(e.R ? W.white : W.black)}`]); const us = this.part('us1'); rows.unshift([tx(W.ahead), `${us && us.state.powered ? us.state.dist : '—'} cm`]);
      rows.push([tx(W.bout), S.flags.has('early') ? tx(W.matta) : S.ringOut ? tx(W.youOut) : S.flags.has('win') ? tx(W.youWin) : S.foe && S.foe.out ? tx(W.foeOut) : S.t < 5 ? `${tx(W.waitS)} ${Math.max(0, 5 - S.t).toFixed(1)} s` : tx(W.fight)]); }
    if (k === 'pid') { const b = S.sensors5(); rows.unshift([tx(W.irs5), b.map((x) => (x ? '■' : '□')).join(' ')]); const L = S.lap; rows.push([tx(W.laps), `${L.n}${L.last ? ' · ' + tx(W.lapT) + ' ' + L.last.toFixed(1) + ' s' : ''}`]);
      if (L.off !== undefined) rows.push([tx(W.avgOff), `${L.off} mm · ${L.swings} ${tx(W.swingsS)}`]); else rows.push([tx(W.fromLine), `${S.off ?? 0} mm`]); if (S.flags.has('lost') && S.offT > 0.5) rows.push(['⚠', tx(W.lostLine)]); }
    if (k === 'lap') { const s = this.sens || S.sensors(); rows.unshift([tx(W.irs), `${tx(s.L ? W.black : W.white)} / ${tx(s.R ? W.black : W.white)}`]); rows.push([tx(W.marker), `${S.marks} ${tx(W.passes)}`]); }
    if (k === 'deliv') { const s = S.sensors(); rows.unshift([tx(W.irs), `${tx(s.L ? W.black : W.white)} / ${tx(s.R ? W.black : W.white)}`]); // (batch 23)
      rows.push([tx(W.stations), [1, 2, 3].map((i) => `${i} ${S.stopped.has(i) ? '■' : S.passed.has(i) ? '→' : '·'}`).join('  ')]); }
    if (k === 'maze' || k === 'mazeR') { // (batch 18; 19: the wall follower, its sensor on the right)
      const f = this.part('us1'), l = this.part('us2'); const cm = (p) => (p && p.state.powered ? `${p.state.dist}` : '—');
      rows.unshift([tx(k === 'mazeR' ? W.aheadRight : W.aheadLeft), `${cm(f)} / ${cm(l)} cm`]); rows.push([tx(W.rooms), String(S.path.length)]); rows.push([tx(W.bumps), String(S.bumps)]);
      if (S.flags.has('deadend') && S.cfg.maze === 'A') rows.push(['↩', tx(W.deadEnd)]); if (S.flags.has('solved')) rows.push(['★', `${tx(W.outOf)} ${S.solvedT.toFixed(1)} s`]); else if (S.loops) rows.push(['⚠', `${tx(W.roundAgain)} (${S.loops})`]);
      controls.unshift({ id: 'maze', kind: 'seg', label: W.maze, options: [['A', W.mazeA], ['B', W.mazeB]], value: S.cfg.maze });
      return { title: k === 'mazeR' ? t3('Wall-following robot', 'दीवार के साथ चलने वाला रोबोट', 'Deewar ke saath chalne wala robot') : t3('Maze-solving robot', 'भूलभुलैया सुलझाने वाला रोबोट', 'Maze solve karne wala robot'), rows, controls };
    }
    const T14 = { sumo: t3('Robot sumo', 'रोबोट सूमो', 'Robot sumo'), pid: t3('PID line follower', 'PID लाइन फ़ॉलोअर', 'PID line follower'), deliv: t3('Delivery robot', 'डिलीवरी रोबोट', 'Delivery robot'), edge: t3('Table robot', 'मेज़ वाला रोबोट', 'Table wala robot'), light: t3('Light-seeking robot', 'रोशनी ढूँढने वाला रोबोट', 'Roshni dhoondhne wala robot'), dance: t3('Dancing robot', 'नाचने वाला रोबोट', 'Naachne wala robot'), lap: t3('Lap counter', 'चक्कर गिनने वाली कार', 'Chakkar ginne wali car') };
    if (T14[k]) return { title: T14[k], rows, controls };
    return { title: k === 'bt' ? t3('Bluetooth car', 'ब्लूटूथ कार', 'Bluetooth car') : k === 'pi' ? t3('Raspberry Pi car', 'Raspberry Pi कार', 'Raspberry Pi car') : k === 'line' ? t3('Line follower', 'लाइन फ़ॉलोअर', 'Line follower') : t3('Obstacle-avoiding car', 'बाधा से बचने वाली कार', 'Obstacle se bachne wali car'), rows, controls };
  }
}

export function makeWorld(app, cfg) {
  switch (cfg.kind) { case 'arm': return new ArmWorld(app, cfg); case 'bin': return new BinWorld(app, cfg); case 'hyd': return new HydWorld(app, cfg); case 'car': return new CarWorld(app, cfg); }
  return null;
}
