// DUET Robotics Lab 360: what the lab looks like. Keeps a 3D object for the board, the breadboard, every part and every
// wire in step with the lab (sim.js), and shows what the circuit does: LEDs glow with their current (and light the
// breadboard around them), burn with a puff of smoke, the servo horn turns, the fan spins, the board's own LEDs blink.
// Also: the hover ring on a hole with its joined strip lit, ghost parts and ghost wires for the lesson's next step.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BB, holeAt, stripOf } from './boards.js';
import { PARTS, pinsOf, LED_COLORS, RGB_CH, rotXZ } from './parts.js';
import * as MD from './models.js';
import { radialTexture } from './tex.js';
import { nextFrame } from './stage.js';
import { buildBoard4 } from './models4.js'; // batch 4: Nano, Mega, ESP32

const UP = new THREE.Vector3(0, 1, 0);
const rotDir = (rot) => { const v = [[0, 1], [-1, 0], [0, -1], [1, 0]][((rot % 4) + 4) % 4]; return new THREE.Vector3(v[0], 0, v[1]); };

export class View {
  constructor(stage, lab) {
    this.stage = stage; this.lab = lab; this.root = stage.root;
    this.loader = new THREE.TextureLoader();
    this.bench = MD.buildBench(this.loader); this.root.add(this.bench);
    this.board = MD.buildUno(); this.board.position.set(lab.board.x, 0, lab.board.z); this.root.add(this.board);
    this.bb = MD.buildBreadboard(); this.bb.position.set(lab.bb.x, 0, lab.bb.z); this.root.add(this.bb);
    this.parts = new Map(); this.wires = new Map(); this.fx = [];
    this.halo = radialTexture(); this.smokeTex = radialTexture('rgba(255,255,255,0.9)');
    // hover ring and the lit strip
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.75, 24), new THREE.MeshBasicMaterial({ color: 0x40e8ff, transparent: true, opacity: 0.95, depthTest: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.renderOrder = 10; this.ring.visible = false; this.root.add(this.ring);
    this.strip = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ color: 0x46e07a, transparent: true, opacity: 0.55, depthTest: false }), 64);
    this.strip.renderOrder = 9; this.strip.count = 0; this.strip.frustumCulled = false; this.root.add(this.strip);
    this.probeMarks = [0xff3b30, 0x1e1e1e].map((c) => { const m = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })); m.rotation.x = Math.PI; m.visible = false; this.root.add(m); return m; });
    this.sel = null; this.ghostObj = null; this.ghostWire = null; this.lessonGhosts = [];
    lab.on((type) => { if (type === 'parts' || type === 'wires' || type === 'burn') this.syncSoon(); if (type === 'burn') this.kick(); });
    lab.on((type) => { if (type === 'board') this.setBoard(); }); // batch 4
    this.pickExtra = []; // batch 4: more things a tap or a ray can hit (the phone, the board box): their meshes have userData.region
    this.sync();
  }
  kick() { this.stage.kick(); }
  // batch 4: another board on the bench (lab.setBoard): its model takes the old one's place (each is built once, then kept)
  setBoard() {
    const id = this.lab.def.id; this.boards = this.boards || { uno: this.board };
    if (this.board) this.root.remove(this.board);
    this.board = this.boards[id] || (this.boards[id] = buildBoard4(this.lab.def));
    this.board.position.set(this.lab.board.x, 0, this.lab.board.z); this.root.add(this.board); this.kick();
  }
  // many changes at once (a lesson opening adds every part and wire): one sync after them
  syncSoon() { if (this._sq) return; this._sq = true; queueMicrotask(() => { this._sq = false; this.sync(); }); }
  // ------------------------------------------------------------ keep the 3D in step with the lab
  sync() {
    const lab = this.lab; let partsChanged = !this.partBatch; const t0 = performance.now(); let built = 0, later = false;
    const seen = new Set();
    for (const p of lab.parts) {
      seen.add(p.uid);
      let e = this.parts.get(p.uid);
      const sig = JSON.stringify([p.type, p.props, p.state.burnt]);
      if (e && e.sig !== sig) { this.root.remove(e.obj); MD.dispose(e.obj); this.disposeFx(e); e = null; }
      if (!e && built && performance.now() - t0 > 14) { later = true; continue; } // many new parts (a lesson opening): a few per frame, so no long freeze
      if (!e) { e = this.makePart(p); e.sig = sig; this.parts.set(p.uid, e); partsChanged = true; built++; }
      this.placePart(p, e.obj); e.obj.updateMatrixWorld(true);
      const pk = JSON.stringify([p.at, p.rot]); if (pk !== e.pk) { e.pk = pk; partsChanged = true; }
    }
    for (const [uid, e] of this.parts) if (!seen.has(uid)) { this.root.remove(e.obj); MD.dispose(e.obj); this.disposeFx(e); this.parts.delete(uid); partsChanged = true; }
    // wires: rebuilt when they or the parts they end on move
    const wseen = new Set();
    for (const w of lab.wires) {
      wseen.add(w.uid);
      const a = lab.epPos(w.a), b = lab.epPos(w.b); const sig = JSON.stringify([a, b, w.color]);
      let o = this.wires.get(w.uid);
      if (o && o.userData.sig !== sig) { this.root.remove(o); MD.dispose(o); o = null; }
      if (!o) { o = MD.buildWire(a, this.epDir(w.a), b, this.epDir(w.b), w.color, hash(w.uid)); o.userData.sig = sig; o.userData.wire = w; o.traverse((m) => { m.userData.wireUid = w.uid; }); this.root.add(o); this.wires.set(w.uid, o); }
    }
    for (const [uid, o] of this.wires) if (!wseen.has(uid)) { this.root.remove(o); MD.dispose(o); this.wires.delete(uid); }
    if (later) { nextFrame().then(() => this.sync()); this.batchWires(); this.kick(); return; } // (stage.js: also in a headset)
    this.batchWires(); if (partsChanged) this.batchParts();
    if (this.stage.renderer.shadowMap.enabled) this.stage.renderer.shadowMap.needsUpdate = true; // (the headset keeps its shadows until the bench changes)
    this.kick();
  }
  // the still pieces of every part, drawn as one mesh per material across all parts (a part keeps its own meshes,
  // hidden, for picking; the moving pieces, LEDs and labels stay its own). A part being dragged is left out.
  batchParts() {
    const old = this.partBatch; if (old) { this.root.remove(old); old.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); this.partBatch = null; }
    const piles = new Map(); const mtx = new THREE.Matrix4(); this.root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    for (const e of this.parts.values()) {
      const kids = e.statics || (e.statics = e.obj.children.filter((m) => m.isMesh && !m.isSprite && !m.userData.keep && !Array.isArray(m.material) && m.geometry.attributes.uv && !m.geometry.index));
      for (const m of kids) {
        m.visible = !!e.hidden; if (e.hidden) continue; // (a hidden part: its own meshes are off too, see setHidden)
        mtx.multiplyMatrices(inv, m.matrixWorld); const g = m.geometry.clone().applyMatrix4(mtx); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        if (!piles.has(m.material)) piles.set(m.material, { geos: [], cast: false }); const p = piles.get(m.material); p.geos.push(g); p.cast = p.cast || m.castShadow;
      }
    }
    if (!piles.size) return;
    const g = new THREE.Group(); g.name = 'partBatch';
    for (const [mat, p] of piles) { const geo = mergeGeometries(p.geos, false); for (const x of p.geos) x.dispose(); if (!geo) continue; const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = p.cast; mesh.receiveShadow = true; mesh.raycast = () => {}; g.add(mesh); }
    this.root.add(g); this.partBatch = g;
  }
  setHidden(uid, h) { const e = this.parts.get(uid); if (!e || !!e.hidden === h) return; e.hidden = h; e.obj.visible = !h; for (const m of e.statics || []) m.visible = h; this.batchParts(); if (!h) for (const m of e.statics || []) m.visible = false; this.kick(); }
  // all wires are drawn as one mesh per material (a few draw calls instead of three per wire); each wire keeps its own
  // invisible mesh, so a tap still finds it (the raycaster does not skip hidden meshes)
  batchWires() {
    const old = this.wireBatch; if (old) { this.root.remove(old); old.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); this.wireBatch = null; }
    const piles = new Map();
    for (const o of this.wires.values()) for (const m of o.children) { if (!m.isMesh) continue; m.visible = false; if (!piles.has(m.material)) piles.set(m.material, []); piles.get(m.material).push(m.geometry); }
    if (!piles.size) return;
    const g = new THREE.Group(); g.name = 'wires';
    for (const [mat, geos] of piles) { const geo = mergeGeometries(geos, false); if (!geo) continue; const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.raycast = () => {}; g.add(mesh); }
    this.root.add(g); this.wireBatch = g;
  }
  epDir(ep) {
    if (ep.startsWith('T:')) {
      const [, uid, pid] = ep.split(':'); const p = this.lab.parts.find((x) => x.uid === uid); if (!p) return UP.clone();
      const d = PARTS[p.type].pins.find((q) => q.id === pid); if (d && d.up) return UP.clone(); // a header pin: the jumper goes on from above
      if (d && d.dir) { const [x, z] = rotXZ(d.dir[0], d.dir[1], p.rot || 0); return new THREE.Vector3(x, 0, z); } // a screw terminal: the wire goes in from its side
      return rotDir(p.rot || 0);
    }
    return UP.clone();
  }
  makePart(p) {
    const obj = MD.buildPart(p); obj.userData.partUid = p.uid; obj.traverse((m) => { m.userData.partUid = p.uid; });
    this.root.add(obj);
    const e = { obj, part: p };
    if (obj.userData.led) { // glow: a halo over the LED and a pool of light on the breadboard
      const L = obj.userData.led;
      e.haloM = new THREE.SpriteMaterial({ map: this.halo, color: L.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      e.halo = new THREE.Sprite(e.haloM); e.halo.position.set(L.cx, L.top - 3.4, 0); e.halo.scale.set(16, 16, 1); obj.add(e.halo);
      e.poolM = new THREE.MeshBasicMaterial({ map: this.halo, color: L.glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      e.pool = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), e.poolM); e.pool.rotation.x = -Math.PI / 2; e.pool.position.set(L.cx, 0.12, 0); obj.add(e.pool);
      if (p.state.burnt) { L.domeM.color.set(0x2b1f17); L.domeM.opacity = 0.97; L.domeM.roughness = 0.85; L.domeM.emissiveIntensity = 0; }
    }
    if ((p.type === 'hcsr04' || p.type === 'ir') && !(p.props && p.props.mount)) { e.block = MD.buildObstacle(); this.root.add(e.block); } // (a sensor mounted on a machine in the scene sees the machine, not a block)
    return e;
  }
  disposeFx(e) { if (e.block) { this.root.remove(e.block); MD.dispose(e.block); } }
  placePart(p, obj) {
    const [x, y, z] = this.lab.partPos(p);
    obj.position.set(x, y, z); obj.rotation.set(0, -(p.rot || 0) * Math.PI / 2, 0);
    const e = this.parts.get(p.uid);
    if (e && e.block) this.placeBlock(p, e);
  }
  placeBlock(p, e) {
    const face = p.type === 'ir' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
    face.applyAxisAngle(UP, -(p.rot || 0) * Math.PI / 2);
    const [x, y, z] = this.lab.partPos(p);
    const base = p.type === 'ir' ? 46 : 12; const d = Math.min(330, base + p.state.dist * 10);
    const c = new THREE.Vector3(x, 0, z); if (p.type === 'hcsr04') c.x += pinsOf(p)[3].x / 2;
    c.addScaledVector(face, d);
    e.block.position.set(c.x, 0, c.z); e.block.rotation.y = Math.atan2(face.x, face.z);
    e.block.visible = d < 330 && !p.state.ext; // a sensor on a robot reads the robot's world, not the block
  }
  // ------------------------------------------------------------ every frame: what the circuit does
  update(dt) {
    const lab = this.lab; let anim = false;
    const L = this.board.userData.leds;
    const set = (m, v) => { if (Math.abs(m.emissiveIntensity - v) > 0.01) { m.emissiveIntensity = v; anim = true; } };
    set(L.ON, lab.powered ? 3.4 : 0); set(L.L, (lab.ledL || 0) * 4.2);
    const ser = lab.mcu.ser; const tx = lab.powered && lab.mcu.t - ser.lastTx < 60000 && ser.bytesSent > 0; set(L.TX, tx ? 2.2 : 0); set(L.RX, this.rxBlink > 0 ? 2.2 : 0); if (this.rxBlink > 0) this.rxBlink -= dt;
    for (const [, e] of this.parts) {
      const p = e.part, o = e.obj, s = p.state;
      if (o.userData.led && !s.burnt) {
        const Ld = o.userData.led; let b = s.b || 0;
        if (p.type === 'rgb') {
          const ch = s.ch || {}; const col = new THREE.Color(0, 0, 0);
          for (const k of ['R', 'G', 'B']) { const v = Math.min(1.3, Math.pow((ch[k] || 0) / 0.015, 0.55)); col.r += k === 'R' ? v : 0; col.g += k === 'G' ? v : 0; col.b += k === 'B' ? v : 0; }
          const mx = Math.max(col.r, col.g, col.b, 0.0001); b = Math.min(1.5, mx); const hue = col.clone().multiplyScalar(1 / mx);
          Ld.domeM.emissive.copy(hue).lerp(new THREE.Color(1, 1, 1), 0.12); e.haloM.color.copy(hue); e.poolM.color.copy(hue);
        }
        const ei = b * 4.6, prev = Ld.domeM.emissiveIntensity;
        if (Math.abs(prev - ei) > 0.005) {
          Ld.domeM.emissiveIntensity = ei; Ld.dieM.opacity = Math.min(1, b * 1.2);
          e.haloM.opacity = Math.min(0.9, b * 0.65); e.halo.scale.setScalar(9 + 14 * Math.min(1.3, b));
          e.poolM.opacity = Math.min(0.55, b * 0.38) * (0.6 + 0.4 * (1 - this.stage.light * 0.5)); anim = true;
        }
      }
      if ((p.type === 'servo' || p.type === 'mg996r') && o.userData.horn) { const a = (s.angle - 90) * Math.PI / 180; if (Math.abs(o.userData.horn.rotation.y - a) > 0.001) { o.userData.horn.rotation.y = a; anim = true; } }
      if (p.type === 'motor' && o.userData.fan) {
        const w = s.w || 0; if (Math.abs(w) > 0.5) anim = true;
        const vis = Math.abs(w) < 45 ? w : Math.sign(w) * (8 + Math.abs(w) * 0.012);
        o.userData.fan.rotation.z -= vis * dt; o.userData.blur.material.opacity = Math.max(0, Math.min(o.userData.blurMax || 0.5, (Math.abs(w) - 45) / 500)); // (batch 12: Newton's disc blurs to grey-white)
      }
      if (p.type === 'button' && o.userData.cap) { const y = s.pressed ? 4.38 : 4.75; if (o.userData.cap.position.y !== y) { o.userData.cap.position.y = y; anim = true; } }
      if (p.type === 'pot' && o.userData.knob) { const a = -(s.pos - 0.5) * 300 * Math.PI / 180; if (o.userData.knob.rotation.y !== a) { o.userData.knob.rotation.y = a; anim = true; } }
      if (p.type === 'ir' && o.userData.leds) { const pw = !!s.powered, nr = !!s.near; o.userData.leds.pwr.emissiveIntensity = pw ? 2.2 : 0; o.userData.leds.det.emissiveIntensity = nr ? 2.6 : 0; }
      if (p.type === 'bomotor' && o.userData.wheel) { const w = s.w || 0; if (Math.abs(w) > 1) { o.userData.wheel.rotation.x = s.a; anim = true; } }
      if (p.type === 'joystick' && o.userData.stick) { const ax = (s.y - 0.5) * 0.5, az = -(s.x - 0.5) * 0.5; if (o.userData.stick.rotation.x !== ax || o.userData.stick.rotation.z !== az) { o.userData.stick.rotation.set(ax, 0, az); anim = true; } }
      if (p.type === 'l298n' && o.userData.leds) { const on = (s.vs || 0) > 6.8 ? 2.4 : 0; if (o.userData.leds.pwr.emissiveIntensity !== on) { o.userData.leds.pwr.emissiveIntensity = on; anim = true; } }
      if (p.type === 'hc05' && o.userData.leds) { const t = performance.now() / 1000; const on = !s.powered ? 0 : s.paired ? (t % 2 < 0.2 || (t % 2 > 0.4 && t % 2 < 0.6) ? 2.4 : 0) : (t * 5 % 1 < 0.5 ? 2.4 : 0); o.userData.leds.st.emissiveIntensity = on; if (s.powered) anim = true; }
      if (e.block) this.placeBlock(p, e);
      if (o.userData.update && o.userData.update(p, dt)) anim = true; // batch 4: a part that animates itself (bar graph, touch plate, magnet)
    }
    // smoke and sparks
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t += dt; anim = true;
      for (const s of f.sprites) { s.position.y += dt * (14 + s.userData.v * 10); s.position.x += dt * s.userData.dx; const k = f.t / 2.6; s.material.opacity = Math.max(0, 0.55 * (1 - k)) * Math.min(1, f.t * 6); s.scale.setScalar(4 + f.t * 9 * s.userData.v); }
      if (f.t > 2.6) { for (const s of f.sprites) { this.root.remove(s); s.material.dispose(); } this.fx.splice(i, 1); }
    }
    this.stage.anim = anim || this.fx.length ? 1 : 0;
    if (anim) this.kick();
  }
  smoke(p) {
    const e = this.parts.get(p.uid); if (!e) return; const pos = new THREE.Vector3(); e.obj.getWorldPosition(pos);
    const L = e.obj.userData.led; const top = L ? L.top : 8;
    const sprites = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.SpriteMaterial({ map: this.smokeTex, color: 0x9a948c, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(m); s.position.set(pos.x + (L ? L.cx : 0) + (Math.random() - 0.5) * 3, pos.y + top - 2 + Math.random() * 3, pos.z + (Math.random() - 0.5) * 3);
      s.userData.v = 0.6 + Math.random() * 0.8; s.userData.dx = (Math.random() - 0.5) * 6; this.root.add(s); sprites.push(s);
    }
    // a bright flash first
    const fm = new THREE.SpriteMaterial({ map: this.halo, color: 0xffe0a0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const fl = new THREE.Sprite(fm); fl.position.set(pos.x + (L ? L.cx : 0), pos.y + top - 3, pos.z); fl.scale.setScalar(26); fl.userData.v = 0.1; fl.userData.dx = 0; this.root.add(fl); sprites.push(fl);
    setTimeout(() => { fm.opacity = 0; }, 120);
    this.fx.push({ t: 0, sprites });
  }
  // ------------------------------------------------------------ picking
  // the nearest wire end point (hole, board pin, part terminal) to a screen point, within tol px
  nearestEndpoint(x, y, tol = 14, filter) {
    const lab = this.lab, st = this.stage; let best = null, bd = tol * tol;
    const r = st.renderer.domElement.getBoundingClientRect(); const M = new THREE.Matrix4().multiplyMatrices(st.camera.projectionMatrix, st.camera.matrixWorldInverse).multiply(this.root.matrixWorld);
    const v = new THREE.Vector3();
    const tryEp = (ep, pos) => { v.set(pos[0], pos[1], pos[2]).applyMatrix4(M); if (v.z > 1) return; const sx = r.left + (v.x + 1) / 2 * r.width, sy = r.top + (1 - v.y) / 2 * r.height; const d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd && (!filter || filter(ep))) { bd = d; best = ep; } };
    for (const h of BB.holes.values()) tryEp('H:' + h.id, [lab.bb.x + h.x, BB.top, lab.bb.z + h.z]);
    for (const p of lab.def.pins) if (p.net !== 'NC') tryEp('B:' + p.id, lab.epPos('B:' + p.id));
    for (const p of lab.parts) if (PARTS[p.type].mount === 'free') for (const pin of PARTS[p.type].pins) tryEp('T:' + p.uid + ':' + pin.id, lab.termPos(p, pin.id));
    return best;
  }
  pickObject(ndc) { const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.stage.camera); return this.pickRay(rc); }
  pickRay(rc) { // what a ray hits first (a mouse ray, or a controller's in the headset)
    const wp = this.worldPick ? this.worldPick() : [];
    const objs = [...[...this.parts.values()].map((e) => e.obj), ...this.wires.values(), this.board.getObjectByName('pick'), ...wp, ...this.pickExtra];
    const hits = rc.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object; const ud = o.userData;
      if (ud.region) return { kind: 'region', id: typeof ud.region === 'function' ? ud.region(h) : ud.region, point: h.point, distance: h.distance }; // (batch 4: a function gives the place hit, e.g. on the phone's screen)
      if (ud.role && !ud.partUid && wp.length) return { kind: 'world', role: ud.role, point: h.point, distance: h.distance }; // a handle on the robot (the syringe's plunger)
      if (ud.wireUid) { const hd = this.handleBehind(hits, h); if (hd) return hd; return { kind: 'wire', uid: ud.wireUid, point: h.point, distance: h.distance }; }
      if (ud.partUid) { let role = null; for (let q = o; q; q = q.parent) { if (q.userData.role) { role = q.userData.role; break; } if (q.userData.partUid && q.parent === this.root) break; } return { kind: 'part', uid: ud.partUid, role, point: h.point, distance: h.distance }; }
    }
    return null;
  }
  // a jumper that runs just in front of a knob, a joystick, a button or a keypad's key: that is what the student aims at (a wire is
  // thin and can be taken anywhere along it), so a handle up to 40 mm behind the wire wins
  handleBehind(hits, h) {
    const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert(); const a = h.point.clone().applyMatrix4(inv);
    for (const q of hits) {
      if (q === h || !q.object.userData.partUid) continue; let role = null;
      for (let o = q.object; o; o = o.parent) { if (o.userData.role) { role = o.userData.role; break; } if (o.userData.partUid && o.parent === this.root) break; }
      if (!role || !(['knob', 'stick', 'cap'].includes(role) || role.startsWith('key3:'))) continue; // (key3: a key of the 4×4 keypad)
      if (q.point.clone().applyMatrix4(inv).distanceTo(a) > 40) break;
      return { kind: 'part', uid: q.object.userData.partUid, role, point: q.point, distance: q.distance };
    }
    return null;
  }
  // a point on a horizontal plane (bench mm) under a screen point
  planePoint(ndc, y) {
    const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.stage.camera);
    const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert(); const r = rc.ray.clone().applyMatrix4(inv);
    const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y); const p = new THREE.Vector3();
    return r.intersectPlane(pl, p) ? p : null;
  }
  // ------------------------------------------------------------ hover ring + strip
  showHover(ep, color) {
    if (!ep) { if (this.ring.visible || this.strip.count) { this.ring.visible = false; this.strip.count = 0; this.kick(); } return; }
    const pos = this.lab.epPos(ep); this.ring.position.set(pos[0], pos[1] + 0.15, pos[2]); this.ring.visible = true; this.ring.material.color.set(color || 0x40e8ff);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    let n = 0;
    if (ep.startsWith('H:')) for (const id of stripOf(ep.slice(2))) { if (n >= 64) break; const h = holeAt(id); m.compose(new THREE.Vector3(this.lab.bb.x + h.x, BB.top + 0.08, this.lab.bb.z + h.z), q, new THREE.Vector3(1, 1, 1)); this.strip.setMatrixAt(n++, m); }
    this.strip.count = n; this.strip.instanceMatrix.needsUpdate = true; this.kick();
  }
  showProbe(i, ep) { const m = this.probeMarks[i]; if (!ep) { m.visible = false; this.kick(); return; } const p = this.lab.epPos(ep); m.position.set(p[0], p[1] + 5, p[2]); m.visible = true; this.kick(); }
  // ------------------------------------------------------------ ghosts
  ghostPart(type, props, rot, at, ok, lesson) {
    const key = JSON.stringify([type, props, rot, ok, lesson]);
    if (!this.ghostObj || this.ghostObj.userData.key !== key) {
      if (this.ghostObj) { this.root.remove(this.ghostObj); MD.dispose(this.ghostObj); }
      const fake = { type, props: Object.assign({}, PARTS[type].props, props), rot, state: Object.assign({}, PARTS[type].state0 || {}) };
      const g = MD.buildPart(fake); MD.ghostify(g, lesson ? lessonGhostMat() : MD.ghostMaterial(ok)); g.userData.key = key; g.traverse((o) => { o.raycast = () => {}; });
      this.ghostObj = g; this.root.add(g);
    }
    const g = this.ghostObj;
    if (at.hole) { const h = holeAt(at.hole); g.position.set(this.lab.bb.x + h.x, BB.top, this.lab.bb.z + h.z); } else g.position.set(at.x, at.y || 0, at.z);
    g.rotation.set(0, -rot * Math.PI / 2, 0); g.visible = true; this.kick();
  }
  hideGhost() { if (this.ghostObj) { this.root.remove(this.ghostObj); MD.dispose(this.ghostObj); this.ghostObj = null; this.kick(); } }
  // the lesson's next part or wire, shown where it should go (pulsing)
  setLessonGhosts(list) {
    for (const o of this.lessonGhosts) { this.root.remove(o); MD.dispose(o); } this.lessonGhosts = [];
    for (const it of list || []) {
      let o;
      if (it.wire) o = MD.buildWire(this.lab.epPos(it.wire[0]), this.epDir(it.wire[0]), this.lab.epPos(it.wire[1]), this.epDir(it.wire[1]), 'white', 0, lessonGhostMat());
      else { const fake = { type: it.type, props: Object.assign({}, PARTS[it.type].props, it.props || {}), rot: it.rot || 0, state: Object.assign({}, PARTS[it.type].state0 || {}) }; o = MD.buildPart(fake); MD.ghostify(o, lessonGhostMat()); const pos = it.at.hole ? (() => { const h = holeAt(it.at.hole); return [this.lab.bb.x + h.x, BB.top, this.lab.bb.z + h.z]; })() : [it.at.x, 0, it.at.z]; o.position.set(...pos); o.rotation.y = -(it.rot || 0) * Math.PI / 2; }
      o.traverse((m) => { m.raycast = () => {}; }); this.root.add(o); this.lessonGhosts.push(o);
    }
    this.kick();
  }
  pulse(t) { if (this.lessonGhosts.length) { LG.opacity = 0.28 + 0.22 * Math.sin(t / 260); this.stage.anim = 1; this.kick(); } }
  // which things to point the camera at: screen box of a set of bench points
  partWorld(p) { const e = this.parts.get(p.uid); if (!e) return null; const v = new THREE.Vector3(); e.obj.getWorldPosition(v); return v; }
}
let LG = null;
function lessonGhostMat() { if (!LG) LG = new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.45, depthWrite: false }); return LG; }
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
