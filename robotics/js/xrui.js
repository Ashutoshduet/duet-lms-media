// DUET Robotics Lab 360: working at the bench in a headset (Meta Quest), with controllers or bare hands.
// A ray from each controller (or from each hand: pinch = trigger) points at the bench and at a panel beside it:
//   bench   pull the trigger on a free hole, pin or terminal and pull to another to lay a wire (or click one, then the
//           other); on a part to move it; on a button to press it (hold); on a knob, a joystick or a syringe to turn it;
//           on the board's parts to learn them (lesson 1)
//   panel   Step (the lesson card: Back, Check, Next, the selected part's controls), Parts (take one: it follows the
//           ray, pull to put it down), Code (the sketch, the running line; point at a number and change it with − +, or
//           apply the step's change), Robot (the robot's live panel and its controls: the phone pad, the hand, …),
//           and Run, Stop, Reset, the tools, the view (bench or robot) and the lessons.
// The panel is a canvas drawn only when what it shows has changed. Everything acts through the same App and Lab calls
// as the mouse and the finger do in the page.
import * as THREE from 'three';
import { PARTS, LED_COLORS, RES_VALUES, fmtOhm } from './parts.js';
import { BB, holeAt } from './boards.js';
import { t, tx, L, LANGS } from './i18n.js';
import { LESSONS } from './lessons.js';
import * as TX from './tex.js';
import * as MD from './models.js';
import { REGIONS } from './i18n.js';
import { DRAWER } from './parts.js';

const W = 1024, H = 1152, PW = 0.5; // canvas px, panel width in metres
const C = { bg: '#0e131b', panel: '#161d28', line: '#2a3342', ink: '#f2ede4', mute: '#a39c90', acc: '#f0a65a', blue: '#7fd1ff', green: '#9fd17a', red: '#ff8a7a', btn: '#232c3a', on: '#f2ede4' };
const V = new THREE.Vector3(), V2 = new THREE.Vector3();
const t3 = (en, hi, hg) => ({ en, hi, hg });
const XW = {
  step: t3('Step', 'क़दम', 'Step'), parts: t3('Parts', 'पुर्ज़े', 'Parts'), code: t3('Code', 'कोड', 'Code'), robot: t3('Robot', 'रोबोट', 'Robot'),
  bench: t3('Bench', 'बेंच', 'Bench'), take: t3('Pull the trigger on the bench to put it down · B / Y to drop it', 'बेंच पर ट्रिगर दबाकर रखिए · B / Y से छोड़िए', 'Bench par trigger daba kar rakhiye · B / Y se chhodiye'),
  apply: t3('Make the step\'s change', 'क़दम का बदलाव कीजिए', 'Step ka badlaav kijiye'), pickNum: t3('Point at a number in the code, then − / +', 'कोड में किसी संख्या पर पॉइंट कीजिए, फिर − / +', 'Code mein kisi number par point kijiye, phir − / +'),
  sel: t3('Selected', 'चुना गया', 'Selected'), none: t3('Point at a part and click it to see it here.', 'किसी पुर्ज़े पर पॉइंट करके क्लिक कीजिए, वह यहाँ दिखेगा।', 'Kisi part par point karke click kijiye, woh yahan dikhega.'),
  prev: t3('‹ Lesson', '‹ पाठ', '‹ Lesson'), next: t3('Lesson ›', 'पाठ ›', 'Lesson ›'), lessons: t3('Lessons', 'पाठ', 'Lessons'), allLessons: t3('All lessons', 'सारे पाठ', 'Saare lessons'), exit: t3('Exit', 'बाहर', 'Exit'), hint: t3('Trigger or pinch: click / drag · Thumbstick: turn, size · Grip: turn the bench', 'ट्रिगर या चुटकी: क्लिक / खींचना · थंबस्टिक: घुमाना, आकार · ग्रिप: बेंच घुमाना', 'Trigger ya pinch: click / drag · Thumbstick: ghumana, size · Grip: bench ghumana'),
};

export class XRUI {
  constructor(xr, app) {
    this.xr = xr; this.app = app; this.stage = app.stage; this.tab = 'step'; this.items = []; this.hover = [null, null]; this.drag = [null, null];
    this.codeTop = 0; this.num = null; this.inHand = null; this.sig = ''; this.drawT = 0; this.toastText = ''; this.toastT = 0;
    // the panel
    const cv = this.cv = document.createElement('canvas'); cv.width = W; cv.height = H; this.cx = cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW * H / W), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, toneMapped: false }));
    this.panel.name = 'xrpanel'; this.panel.visible = false; this.panel.renderOrder = 20; this.stage.scene.add(this.panel);
    // cursors (a small ring where each ray lands)
    this.cursors = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.004, 0.0065, 20), new THREE.MeshBasicMaterial({ color: 0x7fd1ff, transparent: true, depthTest: false, toneMapped: false })); m.renderOrder = 30; m.visible = false; this.stage.scene.add(m); return m; });
    this.ray = new THREE.Raycaster();
  }
  // ------------------------------------------------------------ session
  show(on) { this.panel.visible = on; for (const c of this.cursors) c.visible = false; if (on) { this.sig = ''; this.place(); } }
  place() { // the panel stands to the left of the bench, turned towards you
    const xr = this.xr; const yaw = xr.yaw || 0; const base = new THREE.Vector3(-0.52, 1.2, -0.22);
    this.panel.position.copy(base.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw * 0.25)); this.panel.rotation.set(-0.18, 0.62, 0.11);
  }
  toast(m) { this.toastText = m; this.toastT = 4; }
  // ------------------------------------------------------------ every frame
  update(dt) {
    if (!this.panel.visible) return;
    if (this.toastT > 0) this.toastT -= dt;
    for (let i = 0; i < 2; i++) this.point(i);
    this.drawT -= dt; if (this.drawT <= 0) { this.drawT = 0.12; this.draw(); }
  }
  rayOf(i) { // the world-space ray of controller (or hand) i, or null
    const c = this.xr.ctrls[i]; if (!c || !c.visible) return null;
    c.updateMatrixWorld(true); const o = new THREE.Vector3().setFromMatrixPosition(c.matrixWorld); const d = new THREE.Vector3(0, 0, -1).transformDirection(c.matrixWorld);
    return { o, d };
  }
  // what ray i points at now: the panel (an item), an end point on the bench, a part, a wire, a board region, the robot
  aim(i) {
    const r = this.rayOf(i); if (!r) return null; this.ray.set(r.o, r.d); this.ray.far = 20; this.ray.camera = this.stage.renderer.xr.isPresenting ? this.stage.renderer.xr.getCamera() : this.stage.camera; // (sprites need a camera)
    const hp = this.ray.intersectObject(this.panel, false)[0];
    const app = this.app, view = app.view, root = this.stage.root;
    root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const lo = r.o.clone().applyMatrix4(inv), ld = r.d.clone().transformDirection(inv); // the ray in bench mm
    const hit = view.pickRay ? view.pickRay(this.ray) : null;
    const hitT = hit ? hit.point.clone().applyMatrix4(inv).sub(lo).dot(ld) : Infinity;
    if (hp && (!hit || hp.distance < hit.distance)) { const u = hp.uv; return { kind: 'panel', x: u.x * W, y: (1 - u.y) * H, point: hp.point, lo, ld }; }
    // the holes beside a part that stands in the breadboard (under an HC-SR04's eyes, say) can still be reached past it
    const hp2 = hit && hit.kind === 'part' ? app.lab.parts.find((p) => p.uid === hit.uid) : null;
    let under = hp2 && PARTS[hp2.type].mount === 'bb' ? new Set(Object.values(hp2.holes).map((h) => BB.holes.get(h) && BB.holes.get(h).strip)) : null;
    if (!under && hit && hit.kind === 'region' && app.lab.bbMap) { const m = app.lab.bbMap(); if (m) { if (this.bbOf !== m) { this.bbOf = m; this.bbUnder = new Set([...m.at.keys()].map((h) => BB.holes.get(h) && BB.holes.get(h).strip)); } under = this.bbUnder; } } // (and past a Nano or an ESP32 in the breadboard: the free holes beside its pins)
    const own = hp2 && PARTS[hp2.type].mount === 'free' && app.tool === 'wire' ? hp2.uid : null; // (wire tool: a module's own pins are reached through it: the LCD's I2C pins are behind it from where the student stands)
    const ep = this.nearestEp(lo, ld, hit && hit.kind === 'wire' && app.tool === 'wire' ? hitT + 40 : hitT, null, under, own); const res = { lo, ld, hit, ep }; // (wire tool: a jumper arching over a free hole does not hide it)
    res.point = ep ? new THREE.Vector3(...app.lab.epPos(ep)).applyMatrix4(root.matrixWorld) : hit ? hit.point : null;
    return res;
  }
  // the end point (hole, board pin, part terminal) nearest the ray, within a small angle, and not far behind what it hits
  nearestEp(lo, ld, hitT, filter, under, own) {
    const lab = this.app.lab; let best = null, bd = Infinity; const p = new THREE.Vector3();
    const tryEp = (ep, pos, extra = 0) => { p.set(pos[0], pos[1], pos[2]).sub(lo); const tt = p.dot(ld); if (tt <= 0 || tt > hitT + 9 + extra) return; const d = Math.sqrt(Math.max(0, p.lengthSq() - tt * tt)); const tol = Math.max(1.25, tt * 0.0062); if (d < tol && d / tol < bd && (!filter || filter(ep))) { bd = d / tol; best = ep; } };
    for (const h of BB.holes.values()) tryEp('H:' + h.id, [lab.bb.x + h.x, BB.top, lab.bb.z + h.z], under && under.has(h.strip) ? 45 : 0);
    for (const q of lab.def.pins) if (q.net !== 'NC') tryEp('B:' + q.id, lab.epPos('B:' + q.id));
    for (const q of lab.parts) if (PARTS[q.type].mount === 'free') for (const pin of PARTS[q.type].pins) tryEp('T:' + q.uid + ':' + pin.id, lab.termPos(q, pin.id), q.uid === own ? 60 : 0);
    return best;
  }
  rayPlane(i, y) { const a = this.aimCache[i]; if (!a || !a.ld || Math.abs(a.ld.y) < 1e-4) return null; const tt = (y - a.lo.y) / a.ld.y; if (tt < 0) return null; return a.lo.clone().addScaledVector(a.ld, tt); }
  point(i) {
    this.aimCache = this.aimCache || [null, null];
    const a = this.aimCache[i] = this.aim(i); const cur = this.cursors[i]; const app = this.app;
    if (!a) { cur.visible = false; return; }
    if (a.point) { cur.visible = true; cur.position.copy(a.point); cur.lookAt(this.stage.camera.getWorldPosition(V)); cur.material.color.set(a.kind === 'panel' ? 0xf0a65a : a.ep ? 0x46e07a : 0x7fd1ff); } else cur.visible = false;
    const c = this.xr.ctrls[i]; if (c.userData.rayLine) c.userData.rayLine.scale.z = a.point ? Math.max(0.05, a.point.distanceTo(this.rayOf(i).o)) : 0.6;
    if (a.kind === 'panel') { this.hover[i] = this.itemAt(a.x, a.y); if (i === this.lastHand) app.view.showHover(null); }
    else { this.hover[i] = null; }
    // what is being dragged follows the ray
    const d = this.drag[i];
    if (!d) { if (i === this.lastHand && a.kind !== 'panel') app.view.showHover(a.ep || null); if (this.inHand && i === this.lastHand) this.carry(i); return; }
    if (d.kind === 'maybe') { this.moveCheck(i); return; }
    if (d.kind === 'wire') {
      const to = this.nearestEp(a.lo, a.ld, Infinity, (ep) => ep !== d.from && app.lab.endpointFree(ep)); d.to = to;
      if (a.lo.distanceTo(d.lo0) > 4 || (to && to !== d.from)) d.moved = true;
      app.view.showHover(to || d.from, to ? 0x46e07a : 0x40e8ff);
      const end = to ? null : this.rayPlane(i, BB.top + 10); if (d.moved) this.preview(d.from, to, end);
    } else if (d.kind === 'move' || d.kind === 'new') { app.drag = d.ad; app.dragPartWith((y) => this.rayPlane(i, y), 0); }
    else if (d.kind === 'turn') { const p = this.rayPlane(i, d.y); if (!p) return; const dx = p.x - d.p0.x, dz = p.z - d.p0.z; this.turn(d, dx, dz); }
  }
  carry(i) { const app = this.app; app.drag = this.inHand.ad; app.dragPartWith((y) => this.rayPlane(i, y), 0); }
  preview(a, b, end) {
    const app = this.app; app.clearPreview();
    const pb = b ? app.lab.epPos(b) : end ? [end.x, end.y, end.z] : null; if (!pb) return;
    app.previewObj = MD.buildWire(app.lab.epPos(a), app.view.epDir(a), pb, b ? app.view.epDir(b) : new THREE.Vector3(0, 1, 0), app.lab.wireColor(a, b || a), 3, null);
    app.previewObj.traverse((o) => { o.raycast = () => {}; }); this.stage.root.add(app.previewObj); this.stage.kick();
  }
  // ------------------------------------------------------------ trigger / pinch
  down(i) {
    this.lastHand = i; const a = this.aim(i); this.aimCache = this.aimCache || [null, null]; this.aimCache[i] = a; const app = this.app; app.sound.unlock(); // (where it points now)
    if (!a) return;
    if (a.kind === 'panel') { const it = this.itemAt(a.x, a.y); if (it) { this.pressed = { i, it }; if (it.down) it.down(); else if (it.act) it.act(); this.sig = ''; } return; }
    if (window.DuetGate && DuetGate.active) return;
    if (this.inHand) { this.place1(); return; }
    const hit = a.hit; const lab = app.lab;
    const part = hit && hit.kind === 'part' ? lab.parts.find((p) => p.uid === hit.uid) : null;
    const wireHere = app.tool === 'wire' && a.ep && lab.endpointFree(a.ep); // (as with the mouse: the Wire tool on a free end point makes a wire, even past a knob or a button)
    if (part && hit.role === 'cap' && !wireHere) { part.state.pressed = true; lab.rebuild(); app.sound.click(); this.drag[i] = { kind: 'press', part }; return; }
    { const rel = app.press3 && app.press3(hit); if (rel) { this.drag[i] = { kind: 'press3', release: rel }; return; } } // (batch 3: a keypad key, a remote's button, the RFID card)
    if (part && (hit.role === 'knob' || hit.role === 'stick') && !wireHere) { app.select({ part }); this.drag[i] = { kind: 'turn', part, role: hit.role, y: hit.point.clone().applyMatrix4(new THREE.Matrix4().copy(this.stage.root.matrixWorld).invert()).y, p0: null, pos0: part.state.pos }; const d = this.drag[i]; d.p0 = this.rayPlane(i, d.y); return; }
    if (hit && hit.kind === 'world' && app.world && app.world.drag) { const y = hit.point.clone().applyMatrix4(new THREE.Matrix4().copy(this.stage.root.matrixWorld).invert()).y; this.drag[i] = { kind: 'turn', role: 'world', y, p0: this.rayPlane(i, y) }; return; }
    const occ = a.ep ? lab.occupant(a.ep) : null; const partOnTop = part && !(occ && occ.part && occ.part.uid === part.uid && app.tool === 'wire');
    if (a.ep && (app.tool === 'wire' || !partOnTop) && lab.endpointFree(a.ep)) {
      if (this.pending && this.pending !== a.ep && app.tool === 'wire' && this.pendingIn === app.lessonId + '|' + app.mode) { app.makeWire(this.pending, a.ep); this.pending = null; app.view.showHover(null); return; }
      this.drag[i] = { kind: 'wire', from: a.ep, lo0: a.lo.clone(), moved: false, region: hit && hit.kind === 'region' ? hit.id : null }; return;
    }
    if (a.ep && occ && occ.wire && !partOnTop) { app.select({ wire: occ.wire }); this.tab = 'step'; return; }
    if (part) { this.drag[i] = { kind: 'maybe', part, lo0: a.lo.clone() }; return; }
    if (hit && hit.kind === 'wire') { app.select({ wire: lab.wires.find((q) => q.uid === hit.uid) }); this.tab = 'step'; return; }
    if (hit && hit.kind === 'region') { app.tapRegion(hit.id); return; }
    this.pending = null; app.view.showHover(null);
  }
  up(i) {
    const app = this.app; const p = this.pressed; if (p && p.i === i) { if (p.it.up) p.it.up(); this.pressed = null; this.sig = ''; }
    const d = this.drag[i]; this.drag[i] = null; if (!d) return;
    if (d.kind === 'press') { d.part.state.pressed = false; app.lab.rebuild(); return; }
    if (d.kind === 'press3') { d.release(); return; }
    if (d.kind === 'turn') { if (d.role === 'stick') app.stickTo(d.part, 0, 0); if (d.part) app.renderCallout(); return; }
    if (d.kind === 'wire') { // where the ray is now (not where it was a frame ago)
      app.clearPreview(); const a = this.aim(i); const now = a && a.lo ? this.nearestEp(a.lo, a.ld, Infinity, (ep) => ep !== d.from && app.lab.endpointFree(ep)) : null; const to = now || d.to; if (now && now !== d.from) d.moved = true;
      if (d.moved && to) { app.makeWire(d.from, to); app.view.showHover(null); return; }
      if (!d.moved) { // a click, as with the mouse. Select tool: what it is (a header pin also counts as a tap on that part of the
        // board). Wire tool: the first end of a wire (the next click on an end point finishes it)
        if (app.tool !== 'wire') { if (d.region) app.tapRegion(d.region); this.pending = null; app.view.showHover(d.from); return; }
        if (d.region) { app.rt.taps.add(d.region); app.renderCard(); }
        this.pending = d.from; this.pendingIn = app.lessonId + '|' + app.mode; app.view.showHover(d.from, 0xffc040); return;
      }
      app.view.showHover(null); return;
    }
    if (d.kind === 'maybe') { app.select({ part: d.part }); this.tab = 'step'; this.sig = ''; return; }
    if (d.kind === 'move') this.finishMove(d);
  }
  // a part being dragged on the bench: a "maybe" turns into a move once the ray has travelled a little
  turn(d, dx, dz) {
    const app = this.app; if (d.role === 'world') { app.world.drag(-(dx) / 70); return; }
    if (d.role === 'knob') { d.part.state.pos = Math.max(0, Math.min(1, d.pos0 + (dx - dz) / 45)); app.lab.stateV++; app.lab.instKey = null; this.stage.kick(); return; }
    if (d.role === 'stick') app.stickTo(d.part, dx / 22, -dz / 22);
  }
  // ------------------------------------------------------------ parts: take one from the panel, carry it, put it down
  take(type) {
    const app = this.app; const props = Object.assign({}, PARTS[type].props, (app.mode === 'lesson' && app.rt.propsFor(type)) || {}, type === 'led' && !(app.mode === 'lesson' && app.rt.propsFor('led')) ? { color: app.ledColor || 'red' } : {});
    const step = app.mode === 'lesson' ? app.rt.step : null; const rot = step && step.k === 'place' && step.place.type === type ? step.place.rot : (PARTS[type].axial ? 3 : 0);
    this.inHand = { ad: { kind: 'new', type, props, rot } }; this.toast(tx(XW.take));
  }
  place1() {
    const app = this.app, d = this.inHand.ad, tg = d.target; app.view.hideGhost();
    if (tg && tg.ok) { const p = app.lab.addPart(d.type, d.props, tg.at, d.rot); if (p) { p.tag = app.mode === 'lesson' ? app.rt.tagFor(p) : null; app.lab.emit('parts', p); app.sound.click(); app.select({ part: p }); this.inHand = null; app.drag = null; app.updateGhosts(); } }
    else this.toast(t('noFit'));
  }
  drop() { if (this.inHand) { this.inHand = null; this.app.drag = null; this.app.view.hideGhost(); } this.pending = null; this.app.view.showHover(null); }
  rotate() { if (this.inHand) { this.inHand.ad.rot = ((this.inHand.ad.rot || 0) + 1) % 4; } else this.app.rotateDragOrSel(); }
  finishMove(d) {
    const app = this.app; app.view.hideGhost(); app.view.setHidden(d.part.uid, false); const tg = d.ad.target; app.drag = null;
    if (tg && tg.ok) { if (!app.lab.movePart(d.part, tg.at, d.ad.rot)) this.toast(t('noFit')); else app.sound.click(); } else app.view.sync();
    app.updateGhosts();
  }
  moveCheck(i) { // called each frame for a "maybe": start moving when the ray has moved 6 mm on the bench
    const d = this.drag[i]; if (!d || d.kind !== 'maybe') return; const a = this.aimCache[i]; if (!a) return;
    if (a.lo.distanceTo(d.lo0) > 6 || (a.hit && a.hit.uid !== d.part.uid)) { d.kind = 'move'; d.ad = { kind: 'move', part: d.part, rot: d.part.rot }; this.app.view.setHidden(d.part.uid, true); this.app.closeCallout(); }
  }
  // ------------------------------------------------------------ the panel: items (rects that act), drawn on a canvas
  itemAt(x, y) { for (let k = this.items.length - 1; k >= 0; k--) { const it = this.items[k]; if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return it; } return null; }
  signature() {
    const app = this.app, r = app.rt, s = r.step, w = app.world, m = app.lab.mcu;
    const hv = this.hover.map((h) => (h ? h.id : '')).join();
    const sel = app.sel ? (app.sel.part ? app.sel.part.uid + JSON.stringify(app.sel.part.props) : app.sel.wire ? app.sel.wire.uid : app.sel.region) : '';
    return [this.tab, this.lgrp, this.lpage, app.licensed, !!(w && w.ready), L.lang, app.lessonId, app.mode, r.i, r.doneSteps.size, r.complete, s && r.stepDone(s), app.checkMsg && app.checkMsg.text, hv, sel, m.state, this.codeTop, this.num && this.num.i, app.code().length, app.code().slice(0, 200), app.tool, this.inHand && this.inHand.ad.type, this.toastT > 0 ? this.toastText : '', this.pressed ? this.pressed.it.id : '', app.stage.viewName, app.ranSrc === app.code()].join('|');
  }
  // what only changes because something runs (a part's live value, the robot's numbers, the running line): drawn again at
  // most twice a second, so a running sketch does not send the 1024 × 1152 panel to the GPU eight times a second (Quest)
  liveSig() {
    const app = this.app, w = app.world;
    return [app.sel && app.sel.part ? app.partLive(app.sel.part) : '', w && w.ready && this.tab === 'robot' ? JSON.stringify(w.hud().rows) : '', this.tab === 'code' ? app.lab.mcu.L + ':' + app.serText.length : ''].join('|');
  }
  draw() {
    const sig = this.signature(), live = this.liveSig(), now = performance.now();
    if (sig === this.sig && (live === this.lsig || now - (this.liveAt || 0) < 450)) return;
    this.sig = sig; this.lsig = live; this.liveAt = now;
    const c = this.cx, app = this.app; this.items = [];
    c.fillStyle = C.bg; this.round(0, 0, W, H, 28); c.fill();
    c.textBaseline = 'middle';
    // tabs
    const tabs = [['step', XW.step], ['parts', XW.parts], ['code', XW.code]]; if (app.world) tabs.push(['robot', XW.robot]);
    let x = 18; for (const [id, lab] of tabs) { const w = 150; this.button(x, 16, w, 62, tx(lab), () => { this.tab = id; }, this.tab === id, 'tab:' + id); x += w + 10; }
    LANGS.forEach((lg, k) => this.button(W - 18 - (3 - k) * 92, 16, 86, 62, { en: 'EN', hi: 'हिं', hg: 'Hg' }[lg], () => app.setLang(lg), L.lang === lg, 'lang:' + lg));
    c.fillStyle = C.line; c.fillRect(18, 92, W - 36, 2);
    if (this.tab === 'lessons') this.drawLessons(); else if (this.tab === 'step') this.drawStep(); else if (this.tab === 'parts') this.drawParts(); else if (this.tab === 'code') this.drawCode(); else this.drawRobot();
    // the bottom bar: run, tools, view, lessons
    const y = H - 150; c.fillStyle = C.line; c.fillRect(18, y - 14, W - 36, 2);
    const m = app.lab.mcu; const run = m.state === 'running' && app.lab.powered;
    this.button(18, y, 170, 66, '▶ ' + t('run'), () => app.run(), false, 'run', '#3fae5a', '#06140a');
    this.button(198, y, 140, 66, '■ ' + t('stop'), () => app.stop(), false, 'stop');
    this.button(348, y, 150, 66, '⟲ ' + t('reset'), () => app.resetBoard(), false, 'reset');
    c.fillStyle = run ? C.green : C.mute; c.font = `600 24px ${TX.FONT}`; c.textAlign = 'left'; c.fillText('● ' + (run ? t('running') : t('stopped')), 516, y + 33);
    this.button(W - 18 - 120 - 8 - 176, y, 176, 66, '☰ ' + tx(XW.lessons), () => { this.tab = 'lessons'; this.lgrp = null; }, this.tab === 'lessons', 'lessons');
    this.button(W - 18 - 120, y, 120, 66, '⏻ ' + tx(XW.exit), () => this.xr.leave(), false, 'exit');
    this.button(18, y + 76, 150, 58, '✋ ' + t('tSelect'), () => app.setTool('move'), app.tool === 'move', 'tool:move');
    this.button(178, y + 76, 150, 58, '〰 ' + t('tWire'), () => app.setTool('wire'), app.tool === 'wire', 'tool:wire');
    this.button(338, y + 76, 120, 58, '⟳', () => this.rotate(), false, 'rotate');
    const Ls = app.rt.lesson; const robotView = Ls && (Ls.rview || (Ls.world ? Ls.view : null));
    this.button(468, y + 76, 170, 58, robotView && this.xr.focus === 'robot' ? '⌂ ' + tx(XW.bench) : '🏁 ' + tx(XW.robot), () => this.xr.setFocus(this.xr.focus === 'robot' ? 'bench' : 'robot'), false, 'focus', null, null, !robotView);
    this.button(W - 18 - 2 * 176 - 8, y + 76, 176, 58, tx(XW.prev), () => this.lesson(-1), false, 'lprev');
    this.button(W - 18 - 176, y + 76, 176, 58, tx(XW.next), () => this.lesson(1), false, 'lnext');
    if (this.toastT > 0) { c.fillStyle = 'rgba(240,166,90,0.95)'; this.round(18, y - 82, W - 36, 56, 14); c.fill(); c.fillStyle = '#14100a'; let px = 26, str = this.toastText; c.font = `700 ${px}px ${TX.FONT}`; while (px > 17 && c.measureText(str).width > W - 70) { px -= 1; c.font = `700 ${px}px ${TX.FONT}`; } while (str.length > 2 && c.measureText(str + '…').width > W - 70) str = str.slice(0, -1); if (str !== this.toastText) str += '…'; c.textAlign = 'center'; c.fillText(str, W / 2, y - 54); }
    this.tex.needsUpdate = true;
  }
  drawLessons() { // every lesson by section, and Free build: open one in the headset
    const app = this.app; const G = ['basics', 'robots', 'boards', 'modules', 'microbit', 'pi', 'projects']; // (batch 6: Raspberry Pi; four sections a row; batch 7: Arduino projects)
    if (!this.lgrp) { const cur = LESSONS.find((l) => l.id === app.lessonId); this.lgrp = (app.mode === 'lesson' && cur && cur.group) || 'basics'; const k = LESSONS.filter((l) => l.group === this.lgrp).findIndex((l) => l.id === app.lessonId); this.lpage = Math.max(0, Math.floor(k / 10)); }
    const open = (fn) => { fn(); this.xr.setFocus('bench'); this.tab = 'step'; };
    let y = 110; const bw = (W - 60 - 30) / 4;
    [...G, 'free'].forEach((g, k) => { const x = 30 + (k % 4) * (bw + 10), yy = y + Math.floor(k / 4) * 66;
      if (g === 'free') this.button(x, yy, bw, 56, '🛠 ' + t('free'), () => open(() => app.openFree()), app.mode === 'free', 'lfree');
      else this.button(x, yy, bw, 56, t('grp_' + g), () => { this.lgrp = g; this.lpage = 0; }, this.lgrp === g, 'lgrp:' + g); });
    y += 2 * 66 + 12; this.cx.fillStyle = C.line; this.cx.fillRect(30, y - 6, W - 60, 2);
    const list = LESSONS.filter((l) => l.group === this.lgrp), per = 10, pages = Math.max(1, Math.ceil(list.length / per)); this.lpage = Math.max(0, Math.min(this.lpage || 0, pages - 1));
    for (const l of list.slice(this.lpage * per, this.lpage * per + per)) {
      const lock = !l.free && !app.licensed; const cur = app.mode === 'lesson' && l.id === app.lessonId;
      this.button(30, y + 4, W - 60, 56, `${app.progress[l.id] ? '✓ ' : ''}${l.n}. ${tx(l.title)}${lock ? '  🔒' : ''}`, () => open(() => app.openLesson(l.id)), cur, 'lesson:' + l.id); y += 62;
    }
    if (pages > 1) { const py = H - 150 - 14 - 72; this.button(30, py, 150, 58, '◀', () => { this.lpage--; }, false, 'lpg-', null, null, this.lpage <= 0); this.text(`${this.lpage + 1} / ${pages}`, W / 2, py + 30, 26, C.mute, 600, false, 'center'); this.button(W - 30 - 150, py, 150, 58, '▶', () => { this.lpage++; }, false, 'lpg+', null, null, this.lpage >= pages - 1); }
  }
  lesson(dk) { const app = this.app; const k = LESSONS.findIndex((l) => l.id === app.lessonId); const n = LESSONS[Math.max(0, Math.min(LESSONS.length - 1, (k < 0 ? 0 : k) + dk))]; if (n) { app.openLesson(n.id); this.xr.setFocus('bench'); } }
  drawStep() {
    const c = this.cx, app = this.app, r = app.rt, Ls = r.lesson, s = r.step; let y = 116;
    if (app.mode !== 'lesson' || !Ls) { this.text(t('freeTitle'), 30, y, 36, C.ink, 700); return; }
    this.text(`${t('lessonN', { n: Ls.n })} · ${t('stepOf', { i: r.i + 1, n: Ls.steps.length })}`, 30, y + 10, 24, C.blue, 600);
    y = this.wrap(tx(Ls.title), 30, y + 50, W - 60, 36, C.ink, 700, 2);
    if (r.i === 0) y = this.wrap(tx(Ls.goal), 30, y + 6, W - 60, 25, C.mute, 400, 4);
    y = this.wrap(t('doL') + ': ' + tx(s.do), 30, y + 10, W - 60, 28, C.ink, 500, 6);
    const done = r.doneSteps.has(r.i) || r.stepDone(s); const see = tx(s.see);
    if (see) y = this.wrap((done ? t('stepDone') : t('seeL')) + ': ' + see, 30, y + 8, W - 60, 25, done ? C.green : C.mute, 400, 5);
    if (s.k === 'place') y = this.wrap('→ ' + tx(XW.parts), 30, y + 4, W - 60, 24, C.acc, 600, 1);
    if (s.k === 'act' && app.world && app.world.ready && (app.world.hud().controls || []).length) { this.button(30, y + 8, 300, 58, '→ ' + tx(XW.robot), () => { this.tab = 'robot'; }, false, 'go:robot'); y += 70; } // its buttons are on that tab
    if (app.checkMsg) y = this.wrap(app.checkMsg.text, 30, y + 8, W - 60, 25, app.checkMsg.ok ? C.green : C.red, 600, 3);
    if (r.complete && r.i === Ls.steps.length - 1) y = this.wrap('🎉 ' + t('lessonDone'), 30, y + 8, W - 60, 26, C.green, 700, 2);
    if (r.complete && r.i === Ls.steps.length - 1) { this.button(30, y + 10, 360, 60, '☰ ' + tx(XW.allLessons), () => { this.tab = 'lessons'; this.lgrp = null; }, false, 'alllessons'); y += 72; }
    const by = Math.max(y + 18, 560); const last = r.i === Ls.steps.length - 1;
    this.button(30, by, 200, 70, t('back'), () => app.back(), false, 'back', null, null, r.i === 0);
    if (Ls.check) this.button(240, by, 330, 70, t('check'), () => app.check(), false, 'check');
    const canNext = last ? r.complete && !!LESSONS[LESSONS.indexOf(Ls) + 1] : done;
    this.button(W - 30 - 260, by, 260, 70, last && r.complete ? t('nextLesson') : t('next'), () => app.next(), false, 'next', C.acc, '#14100a', !canNext);
    this.drawSelected(by + 92);
  }
  drawSelected(y) { // the part (or wire) clicked last, with its controls
    const c = this.cx, app = this.app, s = app.sel; c.fillStyle = C.line; c.fillRect(30, y, W - 60, 2); y += 14;
    if (!s) { this.wrap(tx(XW.none), 30, y + 16, W - 60, 24, C.mute, 400, 2); return; }
    if (s.wire) { this.text(tx(XW.sel) + ': ' + t('wireMade', { a: app.epName(s.wire.a), b: app.epName(s.wire.b) }), 30, y + 20, 25, C.ink, 600); this.button(30, y + 50, 220, 62, '🗑 ' + t('del'), () => app.removeSel(), false, 'del'); return; }
    if (s.region) { this.wrap(tx(REGIONS[s.region].n) + ' — ' + tx(REGIONS[s.region].d), 30, y + 16, W - 60, 24, C.ink, 400, 4); return; }
    const p = s.part; if (!app.lab.parts.includes(p)) return; const def = PARTS[p.type];
    this.text(tx(def.name), 30, y + 18, 27, C.ink, 700); this.text(app.partLive(p), 30, y + 54, 24, '#9ff0b0', 500, true);
    let x = 30; const row = y + 82; const B = (label, fn, id, down, up) => { this.button(x, row, 118, 62, label, fn, false, id, null, null, false, down, up); x += 128; };
    B('⟳', () => app.rotateDragOrSel(), 'prot'); B('🗑', () => app.removeSel(), 'pdel');
    const bump = () => { app.lab.stateV++; app.lab.instKey = null; app.stage.kick(); };
    if (p.type === 'resistor') { const k = RES_VALUES.indexOf(p.props.ohms); B('Ω −', () => app.lab.setProps(p, { ohms: RES_VALUES[Math.max(0, k - 1)] }), 'r-'); B('Ω +', () => app.lab.setProps(p, { ohms: RES_VALUES[Math.min(RES_VALUES.length - 1, k + 1)] }), 'r+'); this.text(fmtOhm(p.props.ohms), x + 10, row + 31, 26, C.ink, 700); }
    if (p.type === 'led') { const ks = Object.keys(LED_COLORS); B('●', () => app.lab.setProps(p, { color: ks[(ks.indexOf(p.props.color) + 1) % ks.length] }), 'lc'); }
    if (p.type === 'pot') { B('−', () => { p.state.pos = Math.max(0, p.state.pos - 0.1); bump(); }, 'k-'); B('+', () => { p.state.pos = Math.min(1, p.state.pos + 0.1); bump(); }, 'k+'); }
    if (p.type === 'button' || p.type === 'joystick') B('● ' + t('press'), null, 'press', () => { p.state.pressed = true; app.lab.rebuild(); app.sound.click(); }, () => { p.state.pressed = false; app.lab.rebuild(); });
    if (p.type === 'ldr') { B('☀ −', () => app.setLight(Math.max(0, app.lab.env.light - 0.15)), 'l-'); B('☀ +', () => app.setLight(Math.min(1, app.lab.env.light + 0.15)), 'l+'); }
    if (p.type === 'pir') B('✋', () => { if (app.wave6) app.wave6(p); else { p.state.motion = true; bump(); setTimeout(() => { p.state.motion = false; bump(); }, 1500); } }, 'wave6'); // batch 6: wave at the PIR
    if (p.type === 'lm35' || p.type === 'dht11') { B('°C −', () => { app.lab.env.temp = Math.max(0, app.lab.env.temp - 2); bump(); }, 't-'); B('°C +', () => { app.lab.env.temp = Math.min(100, app.lab.env.temp + 2); bump(); }, 't+'); }
    if ((p.type === 'hcsr04' || p.type === 'hcsr04f' || p.type === 'ir') && !p.state.ext) { B('cm −', () => { p.state.dist = Math.max(1, p.state.dist - (p.type === 'ir' ? 2 : 5)); bump(); }, 'd-'); B('cm +', () => { p.state.dist = Math.min(p.type === 'ir' ? 40 : 300, p.state.dist + (p.type === 'ir' ? 2 : 5)); bump(); }, 'd+'); }
  }
  drawParts() {
    const app = this.app; const Ls = app.mode === 'lesson' ? app.rt.lesson : null; const list = Ls ? Ls.drawer : DRAWER;
    const need = Ls && app.rt.step && app.rt.step.k === 'place' ? app.rt.step.place.type : null;
    if (!list.length) { this.wrap(t('noParts'), 30, 140, W - 60, 26, C.mute, 400, 3); return; }
    // Free build has more parts than fit (5 rows of 3): pages of 12, with ◀ ▶ under them
    const per = list.length > 15 ? 12 : 15, pages = Math.ceil(list.length / per); this.ppage = Math.max(0, Math.min(this.ppage || 0, pages - 1));
    if (pages > 1) { const y = 112 + 4 * 160 + 4; this.button(30, y, 220, 62, '◀', () => { this.ppage = (this.ppage + pages - 1) % pages; this.sig = ''; }, false, 'ppage-'); this.text(`${this.ppage + 1} / ${pages}`, W / 2, y + 31, 26, C.ink, 700, false, 'center'); this.button(W - 250, y, 220, 62, '▶', () => { this.ppage = (this.ppage + 1) % pages; this.sig = ''; }, false, 'ppage+'); }
    const cw = 312, ch = 150; list.slice(this.ppage * per, this.ppage * per + per).forEach((type, k) => {
      const x = 30 + (k % 3) * (cw + 10), y = 112 + Math.floor(k / 3) * (ch + 10); if (y + ch > H - 180) return;
      const it = this.button(x, y, cw, ch, '', () => this.take(type), this.inHand && this.inHand.ad.type === type, 'take:' + type, need === type ? '#2c3f2a' : null);
      const img = app.thumbImg && app.thumbImg(type); if (img && img.complete) this.cx.drawImage(img, x + (cw - 136) / 2, y + 6, 136, 104);
      this.text(tx(PARTS[type].name).replace(/ \(.*\)$/, '').slice(0, 26), x + cw / 2, y + ch - 22, 22, C.ink, 600, false, 'center'); void it;
    });
    if (this.inHand) this.wrap(tx(XW.take), 30, H - 230, W - 60, 22, C.acc, 600, 2);
  }
  drawCode() {
    const c = this.cx, app = this.app; const src = app.code(); const lines = src.split('\n'); const ser = app.serText ? app.serText.split('\n').filter((q) => q.trim()).slice(-5) : null; const lh = 30, top = 108, n = ser ? 15 : 20; // (room for the Serial Monitor when the sketch prints)
    const runL = app.lab.mcu.state === 'running' ? app.lab.mcu.L : 0; this.codeTop = Math.max(0, Math.min(this.codeTop, Math.max(0, lines.length - n)));
    c.font = `500 21px "Plex Mono", ui-monospace, monospace`; c.textAlign = 'left';
    const nums = []; // the numbers in view, clickable
    for (let k = 0; k < n && this.codeTop + k < lines.length; k++) {
      const li = this.codeTop + k, y = top + k * lh; const ln = lines[li];
      if (li + 1 === runL) { c.fillStyle = 'rgba(240,200,60,0.18)'; c.fillRect(18, y, W - 36, lh); }
      c.fillStyle = C.mute; c.fillText(String(li + 1).padStart(3), 22, y + lh / 2);
      let x0 = 80; const cw = c.measureText('M').width; const shown = ln.slice(0, 66);
      c.fillStyle = /^\s*\/\//.test(ln) || (app.lab.def.py && /^\s*#/.test(ln)) ? '#7f8a99' : C.ink; // (batch 6: a Python comment) c.fillText(shown, x0, y + lh / 2);
      for (const m of shown.matchAll(/(?<![\w.])-?\d+(?:\.\d+)?/g)) { const nx = x0 + m.index * cw, nw = m[0].length * cw; const sel = this.num && this.num.line === li && this.num.at === m.index; nums.push({ x: nx - 3, y, w: nw + 6, h: lh, id: `num:${li}:${m.index}`, act: () => { this.num = { line: li, at: m.index, len: m[0].length, i: li * 1000 + m.index }; } }); if (sel) { c.strokeStyle = C.acc; c.lineWidth = 3; c.strokeRect(nx - 3, y + 2, nw + 6, lh - 4); } }
    }
    this.items.push(...nums);
    const y = top + n * lh + 14;
    this.button(30, y, 90, 60, '▲', () => { this.codeTop = Math.max(0, this.codeTop - 8); }, false, 'cup'); this.button(130, y, 90, 60, '▼', () => { this.codeTop += 8; }, false, 'cdown');
    const ed = (dv) => () => this.nudge(dv);
    let x = 250; for (const dv of [-10, -1, 1, 10]) { this.button(x, y, 110, 60, (dv > 0 ? '+' : '−') + Math.abs(dv), ed(dv), false, 'n' + dv, null, null, !this.num); x += 118; }
    const s = this.app.rt.step; const canApply = this.app.mode === 'lesson' && s && s.k === 'edit' && s.set && !s.test(src);
    this.button(30, y + 72, 470, 60, tx(XW.apply), () => { let v = this.app.code(); for (const [re, nv] of s.set) v = v.replace(re, nv); this.app.editor.value = v; this.app.onEdit(v); }, false, 'apply', null, null, !canApply);
    this.wrap(tx(XW.pickNum), 520, y + 102, W - 550, 20, C.mute, 400, 2);
    if (ser) { // the Serial Monitor's last lines (on the page it is a panel of its own)
      const sy = y + 154; c.fillStyle = C.line; c.fillRect(18, sy, W - 36, 2); this.text(t('serial'), 30, sy + 26, 22, C.blue, 600);
      c.font = `500 20px "Plex Mono", ui-monospace, monospace`; c.fillStyle = '#cfe9d3'; c.textAlign = 'left'; ser.forEach((q, k) => c.fillText(q.slice(0, 82), 30, sy + 58 + k * 27));
    }
  }
  nudge(dv) { // change the chosen number in the sketch
    const nm = this.num; if (!nm) return; const app = this.app; const lines = app.code().split('\n'); const ln = lines[nm.line]; if (!ln) return;
    const m = /^-?\d+(?:\.\d+)?/.exec(ln.slice(nm.at)); if (!m) return; const v = parseFloat(m[0]) + dv; const txt = m[0].includes('.') ? v.toFixed(m[0].split('.')[1].length) : String(Math.round(v));
    lines[nm.line] = ln.slice(0, nm.at) + txt + ln.slice(nm.at + m[0].length); nm.len = txt.length; const src = lines.join('\n'); app.editor.value = src; app.onEdit(src);
  }
  drawRobot() {
    const app = this.app, w = app.world; if (!w || !w.ready) return; const h = w.hud(); let y = 116;
    this.text(tx(h.title), 30, y + 10, 32, C.ink, 700);
    { const r = app.rt, s = r.step; if (app.mode === 'lesson' && s && r.i < r.lesson.steps.length - 1 && (r.doneSteps.has(r.i) || r.stepDone(s))) this.button(W - 30 - 220, y - 20, 220, 60, t('next'), () => app.next(), false, 'next', C.acc, '#14100a'); } // the step done with these controls: on without going back to the Step tab
    y += 46;
    for (const [k, v] of h.rows) { this.text(k, 30, y + 16, 24, C.mute, 500); this.text(v, W - 30, y + 16, 24, '#9ff0b0', 500, true, 'right'); y += 34; }
    y += 10;
    for (const ctl of h.controls || []) {
      const lab = tx(ctl.label);
      if (ctl.kind === 'button') { this.button(30, y, W - 60, 64, lab, () => w.control(ctl.id), false, 'w:' + ctl.id); y += 76; }
      if (ctl.kind === 'range') { const st = Math.max(1, Math.round((ctl.max - ctl.min) / 20)); this.text(lab, 30, y + 30, 24, C.mute, 500); this.button(W - 30 - 330, y, 100, 60, '−', () => w.control(ctl.id, Math.max(ctl.min, ctl.value - st)), false, 'w:' + ctl.id + '-'); this.text(ctl.value + (ctl.unit ? ' ' + ctl.unit : ''), W - 30 - 165, y + 30, 26, C.ink, 700, true, 'center'); this.button(W - 30 - 100, y, 100, 60, '+', () => w.control(ctl.id, Math.min(ctl.max, ctl.value + st)), false, 'w:' + ctl.id + '+'); y += 72; }
      if (ctl.kind === 'seg') { this.text(lab, 30, y + 18, 23, C.mute, 500); y += 38; let x = 30; const bw = (W - 60 - (ctl.options.length - 1) * 10) / ctl.options.length; for (const [v, l] of ctl.options) { this.button(x, y, bw, 58, tx(l), () => w.control(ctl.id, v), ctl.value === v, 'w:' + ctl.id + ':' + v); x += bw + 10; } y += 70; }
      if (ctl.kind === 'pad') {
        this.text(lab + (ctl.status ? ' · ' + ctl.status : ''), 30, y + 18, 24, ctl.paired ? C.green : C.mute, 600); y += 40;
        this.button(30, y, 300, 62, ctl.paired ? '✓' : tx({ en: 'Connect HC-05', hi: 'HC-05 से जोड़िए', hg: 'HC-05 se jodiye' }), () => w.control('pair'), false, 'w:pair', null, null, !ctl.canPair || ctl.paired);
        const px = 560, s = 112; for (const [k, g, cx, cy] of [['F', '▲', 1, 0], ['L', '◀', 0, 1], ['S', '■', 1, 1], ['R', '▶', 2, 1], ['B', '▼', 1, 2]]) this.button(px + cx * (s + 8), y + cy * (s - 30), s, s - 38, g, null, this.pressed && this.pressed.it.id === 'key:' + k, 'key:' + k, null, null, !ctl.paired, () => w.control('key', k), () => { if (k !== 'S') w.control('key', 'S'); });
        y += 3 * (s - 30) + 20;
      }
    }
  }
  // ------------------------------------------------------------ canvas helpers
  round(x, y, w, h, r) { const c = this.cx; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  button(x, y, w, h, label, act, on, id, bg, fg, disabled, down, up) {
    const c = this.cx; const hov = this.hover.some((it) => it && it.id === id);
    c.fillStyle = disabled ? '#1a2029' : on ? C.on : bg || (hov ? '#33405a' : C.btn); this.round(x, y, w, h, 14); c.fill();
    if (hov && !disabled) { c.strokeStyle = C.blue; c.lineWidth = 3; this.round(x + 1.5, y + 1.5, w - 3, h - 3, 13); c.stroke(); }
    if (label) { // (a long label gets smaller, then shortened, so it stays inside its button)
      c.fillStyle = disabled ? '#59606b' : on ? '#12100c' : fg || C.ink; let px = Math.min(30, h * 0.42), str = String(label); c.font = `700 ${px}px ${TX.FONT}`;
      while (px > 17 && c.measureText(str).width > w - 20) { px -= 2; c.font = `700 ${px}px ${TX.FONT}`; }
      if (c.measureText(str).width > w - 20) { while (str.length > 2 && c.measureText(str + '…').width > w - 20) str = str.slice(0, -1); str += '…'; }
      c.textAlign = 'center'; c.fillText(str, x + w / 2, y + h / 2 + 1);
    }
    const it = { x, y, w, h, id, act: disabled ? null : act, down: disabled ? null : down, up: disabled ? null : up }; if (!disabled) this.items.push(it); return it;
  }
  text(s, x, y, px, col, wt = 400, mono = false, align = 'left') { const c = this.cx; c.fillStyle = col; c.font = `${wt} ${px}px ${mono ? '"Plex Mono", ui-monospace, monospace' : TX.FONT}`; c.textAlign = align; c.fillText(String(s), x, y); }
  wrap(s, x, y, w, px, col, wt = 400, max = 9) {
    const c = this.cx; c.font = `${wt} ${px}px ${TX.FONT}`; c.fillStyle = col; c.textAlign = 'left'; const words = String(s).split(/\s+/); let line = '', n = 0; const lh = px * 1.32;
    for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (c.measureText(tst).width > w && line) { if (n < max) c.fillText(n === max - 1 ? line + ' …' : line, x, y + lh / 2 + n * lh); n++; line = wd; } else line = tst; }
    if (line && n < max) { c.fillText(line, x, y + lh / 2 + n * lh); n++; }
    return y + Math.min(n, max) * lh;
  }
}
