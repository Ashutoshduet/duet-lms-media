// DUET Robotics Lab 360: the bench as a circuit. Holds the board, the breadboard, the parts and the wires; works out which
// holes and pins are joined (the netlist: the breadboard's inside strips, both power rails, wires); builds the circuit
// elements; runs the microcontroller; and solves the circuit every frame, so LEDs glow, burn, motors turn and servos move
// as they would on a real bench. Positions are in mm on the bench (x right, z towards the student, y up from the mat).
import { BOARDS, BB, holeAt } from './boards.js';
import { PARTS, pinsOf, MOTOR, PITCH } from './parts.js';
import { BO } from './parts2.js';
import { solve, anchored } from './solver.js';
import { MCU } from './mcu.js';
import { boardPlace, LAB_HOOKS } from './boards4.js'; // batch 4 (more boards): LAB_HOOKS add circuit elements and per-frame work for a board (esp32.js)
import './esp32.js'; import './mcu4.js'; // batch 4: the ESP32's and the Mega's microcontrollers (they set BOARDS.esp32.mcuClass, …)
import './pi6.js'; // batch 6: the Raspberry Pi boards run Python (PyMCU, their pin hooks and hints)
export { LAB_HOOKS };

export const LAYOUT = { board: { x: -92, z: -2 }, bb: { x: 40, z: 0 } };
let UID = 0;

class UF {
  constructor() { this.p = new Map(); }
  find(a) { let p = this.p.get(a); if (p === undefined) { this.p.set(a, a); return a; } if (p === a) return a; p = this.find(p); this.p.set(a, p); return p; }
  union(a, b) { const x = this.find(a), y = this.find(b); if (x !== y) this.p.set(x, y); }
}

export class Lab {
  constructor(boardId = 'uno') {
    this.def = BOARDS[boardId];
    this.board = { x: LAYOUT.board.x, z: LAYOUT.board.z, usb: true, battery: false, fuse: 0, tripped: false };
    this.bb = { x: LAYOUT.bb.x, z: LAYOUT.bb.z };
    { const pl = boardPlace(this.def, BB, this.bb); this.board.x = pl.x; this.board.z = pl.z; } // batch 4: the Mega sits further left, a Nano or ESP32 in the breadboard
    this.parts = []; this.wires = [];
    this.env = { light: 0.75, temp: 26 };
    this.speed = 1; this.version = 0; this.stateV = 0;
    this.listeners = [];
    this.mcu = new (this.def.mcuClass || MCU)(this.def, this.mcuIO = { lab: this,
      read: (pin, t) => this.readPin(pin, t),
      onWrite: (pin, lv, t) => this.onWrite(pin, lv, t),
      onPin: (p) => { // the circuit is solved again only when a pin really changed: a sketch that writes the same value every loop
        // (a line follower's motors) would otherwise solve it again for every digitalRead (1 ms of JS per ms of sketch time)
        const m = this.mcu, P = m.pins && m.pins[p]; if (this.sigOf !== m.pins) { this.sigOf = m.pins; this.pinSig = []; this.instKey = null; } // (a new run: new pins)
        const s = P ? P.mode + (P.tone ? 4 : 0) + 8 * Math.round(P.level * 1e4) : NaN; if (!(this.pinSig[p] === s)) { this.pinSig[p] = s; this.instKey = null; }
      },
      pulse: (pin, lv, t, to) => this.pulse(pin, lv, t, to),
      onNote: (n) => this.emit('note', n),
      onError: (e) => this.emit('error', e),
      vref: () => 5,
    });
    this.mcu.lab = this; // batch 3: the module libraries find their modules on the bench (libs3.js)
    this.obs = this.freshObs(); this.V = null; this.els = []; this.sounds = [];
    this.rebuild();
  }
  on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter((f) => f !== fn); }; }
  emit(type, data) { for (const f of this.listeners) { try { f(type, data); } catch (e) { console.error(e); } } }
  get powered() { return (this.board.usb || this.board.battery) && !this.board.tripped; }
  // batch 4: put another board on the bench (boards4.js). The parts stay; wires to the old board's pins go, and so does
  // anything in the holes a breadboard board (Nano, ESP32) now covers.
  setBoard(id) {
    const def = BOARDS[id]; if (!def || def === this.def) return false;
    this.mcu.stop(); this.def = def; this.mcu = new (def.mcuClass || MCU)(def, this.mcuIO); this.mcu.lab = this;
    const pl = boardPlace(def, BB, this.bb); this.board.x = pl.x; this.board.z = pl.z; this.board.tripped = false; this.board.fuse = 0;
    this.wires = this.wires.filter((w) => !w.a.startsWith('B:') && !w.b.startsWith('B:'));
    if (def.bb) { const all = this.bbMap().all; this.wires = this.wires.filter((w) => ![w.a, w.b].some((e) => e.startsWith('H:') && all.has(e.slice(2)))); this.parts = this.parts.filter((p) => !Object.values(p.holes || {}).some((h) => all.has(h))); }
    this.rebuild(); this.emit('board', def); this.emit('parts', null); this.emit('wires', null); return true;
  }
  bbMap() { const d = this.def; return d.bb ? d.bbMap || (d.bbMap = d.bbMapOf(d, BB)) : null; } // a breadboard board: pin -> hole, covered holes

  // ------------------------------------------------------------ parts and wires
  addPart(type, props, at, rot, tag) {
    const def = PARTS[type];
    const p = { uid: 'p' + (++UID), type, props: Object.assign({}, def.props, props || {}), rot: rot || 0, at, tag: tag || null, state: Object.assign({}, def.state0 || {}), holes: {} };
    if (def.mount === 'bb') { const f = this.fit(p, at.hole); if (!f.ok) return null; p.holes = f.holes; }
    this.parts.push(p); this.rebuild(); this.emit('parts', p); return p;
  }
  movePart(p, at, rot) {
    const def = PARTS[p.type]; const oldAt = p.at, oldRot = p.rot;
    p.at = at; if (rot !== undefined) p.rot = rot;
    if (def.mount === 'bb') { const f = this.fit(p, at.hole, p); if (!f.ok) { p.at = oldAt; p.rot = oldRot; return false; } p.holes = f.holes; }
    this.rebuild(); this.emit('parts', p); return true;
  }
  removePart(p) {
    this.parts = this.parts.filter((x) => x !== p);
    if (PARTS[p.type].mount === 'free') this.wires = this.wires.filter((w) => !w.a.startsWith('T:' + p.uid + ':') && !w.b.startsWith('T:' + p.uid + ':'));
    this.rebuild(); this.emit('parts', null);
  }
  setProps(p, props) {
    const def = PARTS[p.type];
    const old = Object.assign({}, p.props); Object.assign(p.props, props);
    if (def.mount === 'bb' && props.span !== undefined) { const f = this.fit(p, p.at.hole, p); if (!f.ok) { p.props = old; return false; } p.holes = f.holes; }
    this.rebuild(); this.emit('parts', p); return true;
  }
  addWire(a, b, color) {
    if (a === b || !this.endpointFree(a) || !this.endpointFree(b)) return null;
    const w = { uid: 'w' + (++UID), a, b, color: color || this.wireColor(a, b) };
    this.wires.push(w); this.rebuild(); this.emit('wires', w); return w;
  }
  removeWire(w) { this.wires = this.wires.filter((x) => x !== w); this.rebuild(); this.emit('wires', null); }
  clear() { this.parts = []; this.wires = []; this.rebuild(); this.emit('parts', null); this.emit('wires', null); }
  wireColor(a, b) {
    const n = (e) => (e.startsWith('B:') ? this.def.pins.find((p) => p.id === e.slice(2)).net : '');
    const nets = [n(a), n(b)];
    if (nets.includes('GND')) return 'black';
    if (nets.includes('5V') || nets.includes('3V3') || nets.includes('VIN')) return 'red';
    const rail = (e) => (e.startsWith('H:') ? holeAt(e.slice(2)).rail : '');
    if (['tn', 'bn'].includes(rail(a)) || ['tn', 'bn'].includes(rail(b))) return 'black';
    if (['tp', 'bp'].includes(rail(a)) || ['tp', 'bp'].includes(rail(b))) return 'red';
    const cyc = ['yellow', 'green', 'blue', 'orange', 'white', 'purple']; return cyc[this.wires.length % cyc.length];
  }
  // what is in a hole / socket / terminal: a part's leg or a wire end
  occupant(ep) {
    for (const w of this.wires) if (w.a === ep || w.b === ep) return { wire: w };
    if (ep.startsWith('H:') && this.def.bb) { const m = this.bbMap(), h = ep.slice(2); if (m.at.has(h)) return { board: m.at.get(h) }; if (m.cover.has(h)) return { board: '' }; } // batch 4: under a Nano / ESP32
    if (ep.startsWith('H:')) { const h = ep.slice(2); for (const p of this.parts) for (const k in p.holes) if (p.holes[k] === h) return { part: p, pin: k }; }
    return null;
  }
  endpointFree(ep) {
    if (ep.startsWith('H:')) return !!holeAt(ep.slice(2)) && !this.occupant(ep);
    if (ep.startsWith('B:')) { const pin = this.def.pins.find((p) => p.id === ep.slice(2)); return !!pin && pin.net !== 'NC' && !this.def.bb && !this.occupant(ep); } // (batch 4: a Nano / ESP32 pin is in a hole: wire its strip)
    if (ep.startsWith('T:')) { const [, uid, pid] = ep.split(':'); const p = this.parts.find((x) => x.uid === uid); const pin = p && PARTS[p.type].pins.find((q) => q.id === pid); return !!pin && (pin.multi || !this.occupant(ep)); } // a screw terminal takes two wires
    return false;
  }
  // can a breadboard part sit with its first leg in this hole? -> { ok, holes: {pin: hole}, why }
  fit(p, holeId, self) {
    const h0 = holeAt(holeId); if (!h0) return { ok: false, why: 'off' };
    const holes = {}; const taken = new Set();
    for (const w of this.wires) { if (w.a.startsWith('H:')) taken.add(w.a.slice(2)); if (w.b.startsWith('H:')) taken.add(w.b.slice(2)); }
    for (const q of this.parts) if (q !== self && q !== p) for (const k in q.holes) taken.add(q.holes[k]);
    if (this.def.bb) for (const h of this.bbMap().all) taken.add(h); // batch 4: the holes a Nano / ESP32 sits in or covers
    const pins = pinsOf(p);
    for (const pin of pins) {
      const x = h0.x + pin.x, z = h0.z + pin.z;
      let found = null; for (const h of BB.holes.values()) if (Math.abs(h.x - x) < 0.3 && Math.abs(h.z - z) < 0.3) { found = h; break; }
      if (!found) return { ok: false, why: 'off' };
      if (taken.has(found.id)) return { ok: false, why: 'busy', hole: found.id };
      holes[pin.id] = found.id;
    }
    return { ok: true, holes };
  }
  // ------------------------------------------------------------ positions (mm on the bench)
  epPos(ep) {
    if (ep.startsWith('H:')) { const h = holeAt(ep.slice(2)); return [this.bb.x + h.x, BB.top, this.bb.z + h.z]; }
    if (ep.startsWith('B:') && this.def.bb) { const h = holeAt(this.bbMap().pin.get(ep.slice(2))); return h ? [this.bb.x + h.x, BB.top, this.bb.z + h.z] : [0, 0, 0]; } // batch 4: the pin is in a hole
    if (ep.startsWith('B:')) { const pin = this.def.pins.find((p) => p.id === ep.slice(2)); return [this.board.x + pin.at[0], this.def.pcbY + this.def.pcbT + this.def.hdrH, this.board.z + pin.at[1]]; }
    if (ep.startsWith('T:')) { const [, uid, pid] = ep.split(':'); const p = this.parts.find((x) => x.uid === uid); if (!p) return [0, 0, 0]; return this.termPos(p, pid); }
    return [0, 0, 0];
  }
  termPos(p, pid) {
    const pin = pinsOf(p).find((q) => q.id === pid); const T = PARTS[p.type].term || { y: 4 };
    return [p.at.x + pin.x, pin.def.y !== undefined ? pin.def.y : T.y, p.at.z + pin.z];
  }
  partPos(p) { // the part's origin on the bench
    if (PARTS[p.type].mount === 'free') return [p.at.x, 0, p.at.z];
    const h = holeAt(p.at.hole); return [this.bb.x + h.x, BB.top, this.bb.z + h.z];
  }
  // ------------------------------------------------------------ the netlist
  rebuild() {
    this.version++; this.instKey = null;
    const uf = new UF(); this.uf = uf;
    for (const p of this.def.pins) uf.union('B:' + p.id, 'N:' + p.net);
    if (this.def.bb) for (const [pid, h] of this.bbMap().pin) uf.union('B:' + pid, 'H:' + h); // batch 4: a Nano / ESP32 pin joins its breadboard strip
    for (const h of BB.holes.values()) uf.union('H:' + h.id, 'S:' + h.strip);
    for (const w of this.wires) uf.union(w.a, w.b);
    for (const p of this.parts) {
      p.ep = {};
      for (const pin of PARTS[p.type].pins) p.ep[pin.id] = PARTS[p.type].mount === 'bb' ? 'H:' + p.holes[pin.id] : 'T:' + p.uid + ':' + pin.id;
      for (const k in p.ep) uf.find(p.ep[k]);
    }
    // nodes: ground first
    const node = new Map(); node.set(uf.find('N:GND'), 0); let n = 1;
    const nodeOf = (key) => { const r = uf.find(key); let i = node.get(r); if (i === undefined) { i = n++; node.set(r, i); } return i; };
    this.nodeOf = nodeOf;
    // what is attached to each net (to skip board pins with nothing on them)
    const use = new Map(); const mark = (k) => { const r = uf.find(k); use.set(r, (use.get(r) || 0) + 1); };
    for (const w of this.wires) { mark(w.a); mark(w.b); }
    for (const p of this.parts) for (const k in p.ep) mark(p.ep[k]);
    this.used = (key) => (use.get(uf.find(key)) || 0) > 0;
    for (const p of this.parts) { p.N = {}; for (const k in p.ep) p.N[k] = nodeOf(p.ep[k]); }
    this.boardNode = (net) => nodeOf('N:' + net);
    for (const net of ['5V', '3V3', 'VIN', 'RESET', 'AREF']) this.boardNode(net);
    for (let i = 0; i < this.def.gpio; i++) if (this.def.gpio <= 22 || this.used('N:G' + i)) this.boardNode('G' + i); // (a Mega or ESP32: only the pins in use, so the solver stays small)
    this.nodeCount = n; this.prevStates = null;
    if (this.board.tripped) this.board.cool = 1.5; // the fuse cools down; then the power comes back
  }
  // same net? endpoints ('B:5V', 'H:a12', 'T:p3:SIG') or part pins ('tag.pin' / 'uid.pin') or board nets ('GND', 'D13', '5V')
  key(x) {
    if (/^[BHT]:/.test(x)) return x;
    if (x.startsWith('rail:')) return 'S:R' + x.slice(5);
    if (x.includes('.')) { const [t, pin] = x.split('.'); const p = this.byTag(t); return p && p.ep ? p.ep[pin] : null; }
    const pin = this.def.pins.find((p) => p.id === x); if (pin) return 'B:' + pin.id;
    if (x === 'GND' || x === '5V' || x === '3V3') return 'N:' + x;
    return null;
  }
  byTag(t) { return this.parts.find((p) => p.tag === t || p.uid === t); }
  conn(a, b) { const x = this.key(a), y = this.key(b); return !!(x && y) && this.uf.find(x) === this.uf.find(y); }
  netKey(a) { const x = this.key(a); return x ? this.uf.find(x) : null; }

  // ------------------------------------------------------------ elements
  pinStateFrame(i) { // during a frame: duty
    const m = this.mcu, P = m.pins[i];
    if (m.state !== 'running' && m.state !== 'done') return null;
    if (P.mode === 1) return { out: true, duty: P.tone ? (P.toneDuty !== undefined ? P.toneDuty : 0.5) : m.duty(i), tone: m.toneOf(i) }; // (batch 12: a Pico's PWM note keeps its duty)
    if (P.mode === 2 || P.level === 1) return { pull: true };
    return null;
  }
  pinStateNow(i) {
    const m = this.mcu, P = m.pins[i];
    if (m.state !== 'running' && m.state !== 'done') return null;
    if (P.mode === 1) return { out: true, duty: P.tone ? (P.toneDuty !== undefined ? P.toneDuty : 0.5) : P.level };
    if (P.mode === 2 || P.level === 1) return { pull: true };
    return null;
  }
  elements(pinState, levels, t, V) {
    const els = [], G = (net) => this.boardNode(net);
    if (this.powered) {
      els.push({ type: 'V', a: G('5V'), b: 0, v: this.board.battery && !this.board.usb ? 5.0 : this.def.v5 || 4.96, r: 0.1, role: '5v' });
      els.push({ type: 'V', a: G('3V3'), b: 0, v: 3.3, r: 0.8, role: '3v3' });
      if (this.board.battery) els.push({ type: 'V', a: G('VIN'), b: 0, v: 8.4, r: 2, role: 'vin' });
      if (this.used('N:RESET')) els.push({ type: 'R', a: G('RESET'), b: G('5V'), r: 10000 });
      for (let i = 0; i < this.def.gpio; i++) {
        if (!this.used('N:G' + i)) continue;
        const s = pinState(i); if (!s) continue;
        if (s.out) { const lv = levels && levels.has(i) ? levels.get(i) : s.duty; els.push({ type: 'V', a: G('G' + i), b: 0, v: (this.def.vcc || 5) * lv, r: 25, role: 'pin', pin: i }); }
        else if (s.pull) els.push({ type: 'R', a: G('G' + i), b: G(this.def.vcc === 3.3 ? '3V3' : '5V'), r: 35000, role: 'pull', pin: i });
      }
    }
    for (const h of LAB_HOOKS) if (h.elements) h.elements(this, els, G, pinState); // batch 4: a board's own parts (the ESP32's pin clamps)
    for (const p of this.parts) {
      const list = PARTS[p.type].elec(p, p.N, this.env, V || this.V, t);
      for (const e of list) { e.part = p; els.push(e); }
    }
    return els;
  }
  // the voltage on a pin, now (for digitalRead / analogRead); NaN when the pin is connected to nothing that sets it
  readPin(pin, t) {
    if (!this.used('N:G' + pin)) return NaN;
    // the last solution is kept until a pin, a part or the wiring changes (onPin clears instKey)
    let echoBits = 0;
    for (const p of this.parts) if (PARTS[p.type].us && p.state.echo) echoBits = echoBits * 2 + ((t >= p.state.echo.start && t < p.state.echo.end) ? 1 : 0) + 2;
    const key = this.version * 1e9 + this.stateV * 1e4 + echoBits;
    if (key !== this.instKey) {
      const els = this.elements((i) => this.pinStateNow(i), null, t, this.V);
      const V = solve(this.nodeCount, els, null);
      this.instV = V; this.instOk = anchored(this.nodeCount, els); this.instKey = key;
    }
    const nd = this.boardNode('G' + pin);
    return this.instOk[nd] ? this.instV[nd] : NaN;
  }
  onWrite(pin, lv, t) {
    for (const p of this.parts) if (PARTS[p.type].onWrite) PARTS[p.type].onWrite(p, pin, lv, t, this); // batch 3: the stepper's driver follows each write
    for (const p of this.parts) if (PARTS[p.type].us && p.N.TRIG === this.boardNode('G' + pin) && this.used('N:G' + pin)) {
      if (lv) p.state.trigAt = t;
      else if (p.state.trigAt !== undefined && t - p.state.trigAt >= 9 && p.state.powered) {
        const d = Math.max(2, p.state.dist); const us = d > 400 ? 38000 : d * 58.2 + (Math.random() - 0.5) * 12;
        p.state.echo = { start: t + 460, end: t + 460 + us }; p.state.pings = (p.state.pings || 0) + 1; p.state.trigAt = undefined;
      }
    }
  }
  pulse(pin, lv, t, timeout) {
    if (!lv) return null;
    const nd = this.boardNode('G' + pin);
    for (const p of this.parts) if (PARTS[p.type].us && p.N.ECHO === nd && p.state.echo) {
      const e = p.state.echo; if (e.end > t && e.start < t + timeout) return { start: Math.max(e.start, t), end: e.end };
    }
    return null;
  }

  // ------------------------------------------------------------ run
  run(code) { // code: a compiled sketch (cpp.js)
    this.mcu.load(code); this.board.tripped = false; this.board.fuse = 0;
    this.obs = this.freshObs();
    for (const p of this.parts) { if (PARTS[p.type].us) p.state.echo = null; }
    this.mcu.stop(); this.frameSolve(0); this.dynamics(0); // the modules know whether they have power before the sketch starts
    if (this.powered) this.mcu.start();
    this.emit('run', null);
  }
  stop() { this.mcu.stop(); this.emit('stop', null); }
  resetBoard() { // the RESET button: the sketch starts again from the top
    this.board.tripped = false; this.board.fuse = 0;
    if (this.mcu.prog) { this.obs = this.freshObs(); this.mcu.start(); }
    this.emit('reset', null);
  }
  freshObs() { return { t: 0, leds: {}, servo: {}, motor: {}, tones: new Set(), lines: 0, burnt: 0 }; }

  // one frame: the sketch runs, then the circuit is solved with the pins as they were on average
  step(ms) {
    const dt = Math.min(ms, 100) / 1000 * this.speed;
    if (this.board.tripped && this.board.cool !== undefined) { this.board.cool -= dt; if (this.board.cool <= 0) { delete this.board.cool; this.board.tripped = false; this.board.fuse = 0; if (this.mcu.prog) this.mcu.start(); this.emit('power', true); } }
    const wasPowered = this.powered;
    if (this.powered && this.mcu.state === 'running') this.mcu.speed = this.speed, this.mcu.run(ms);
    else if (!this.powered && this.mcu.state === 'running') this.mcu.stop();
    const t = this.mcu.t;
    this.frameSolve(t);
    this.dynamics(dt);
    this.obs.t += dt;
    if (wasPowered !== this.powered) this.emit('power', this.powered);
  }
  frameSolve(t) {
    // pins that switch during the frame (PWM, tone, fast blinking): solve with each of them HIGH and LOW and average
    const sw = [];
    const states = []; for (let i = 0; i < this.def.gpio; i++) { const s = this.powered && this.used('N:G' + i) ? this.pinStateFrame(i) : null; states.push(s); if (s && s.out && s.duty > 0.004 && s.duty < 0.996) sw.push(i); }
    const enumPins = sw.length <= 3 ? sw : [];
    const combos = 1 << enumPins.length;
    let Vavg = null, acc = null, els0 = null;
    const prev = this.prevStates;
    for (let c = 0; c < combos; c++) {
      let w = 1; const lv = new Map();
      enumPins.forEach((pin, k) => { const on = (c >> k) & 1; const d = states[pin].duty; w *= on ? d : 1 - d; lv.set(pin, on); });
      if (w < 1e-6) continue;
      const els = this.elements((i) => states[i], lv, t, this.V);
      const V = solve(this.nodeCount, els, null);
      if (!els0) { els0 = els; acc = els.map(() => ({ i: 0, peak: 0, vmin: Infinity, vmax: -Infinity, ib: 0 })); Vavg = new Float64Array(V.length); }
      for (let k = 0; k < V.length; k++) Vavg[k] += w * V[k];
      els.forEach((e, k) => {
        const a = acc[k]; a.i += w * (e.i || 0); a.ib += w * (e.ib || 0); if (Math.abs(e.i || 0) > Math.abs(a.peak)) a.peak = e.i || 0;
        if (e.role === 'buzz') { const d = V[e.a] - V[e.b]; a.vmin = Math.min(a.vmin, d); a.vmax = Math.max(a.vmax, d); }
      });
      // keep the switching parts' states for a quick start next time
      if (c === combos - 1 || !this.prevStates) { const m = new Map(); els.forEach((e) => { if (e.type === 'D' || e.type === 'Q') m.set(e, { on: e.on, st: e.st }); }); this.prevMap = m; }
    }
    if (!els0) { els0 = []; acc = []; Vavg = new Float64Array(this.nodeCount); }
    els0.forEach((e, k) => { e.iAvg = acc[k].i; e.ibAvg = acc[k].ib; e.iPeak = acc[k].peak; if (e.role === 'buzz') { e.swing = acc[k].vmax - acc[k].vmin; e.vAvg = (Vavg[e.a] || 0) - (Vavg[e.b] || 0); } });
    this.els = els0; this.V = Vavg; this.ok = anchored(this.nodeCount, els0);
    this.toneSw = sw.filter((i) => states[i].tone).map((i) => states[i].tone); this.toneSwPins = sw.filter((i) => states[i].tone).map((i) => [i, states[i].tone]);
    this.swPins = sw;
  }
  dynamics(dt) {
    const byPart = new Map(); for (const e of this.els) if (e.part) { if (!byPart.has(e.part)) byPart.set(e.part, []); byPart.get(e.part).push(e); }
    const V = this.V; const vAt = (n) => (V && n < V.length ? V[n] : 0);
    const obs = this.obs; this.sounds = [];
    // the board: USB fuse (500 mA), overloaded pins
    let i5 = 0, i33 = 0;
    for (const e of this.els) {
      if (e.role === '5v') i5 += e.iAvg; if (e.role === '3v3') i33 += e.iAvg;
      if (e.role === 'pin' && Math.abs(e.iAvg) > 0.041) { const k = 'over' + e.pin; if (!this.mcu.warned.has(k)) { this.mcu.warned.add(k); this.emit('pinOver', { pin: e.pin, mA: Math.round(Math.abs(e.iAvg) * 1000) }); } }
    }
    this.i5 = i5;
    if (this.powered && (i5 > 0.6 || i33 > 0.25)) {
      this.board.fuse += dt; if (this.board.fuse > 0.35) { this.board.tripped = true; this.board.cool = 1e9; this.mcu.stop(); this.emit('fuse', { mA: Math.round(Math.max(i5, i33) * 1000), pin: i33 > 0.25 ? '3V3' : '5V' }); }
    } else this.board.fuse = Math.max(0, this.board.fuse - dt);
    // the L LED on pin 13 (through the board's own buffer)
    const lp = this.def.led, vk = (this.def.vcc || 5) / 5; // (batch 4: the board's own LED pin, and its logic voltage)
    const v13 = this.powered && this.used('N:G' + lp) ? vAt(this.boardNode('G' + lp)) : this.powered ? 5 * vk * this.pinLevelFrame(lp) : 0;
    this.ledL = Math.max(0, Math.min(1, (v13 - 1.6 * vk) / (2.6 * vk)));
    this.trackLed('L', this.ledL, 0.004 * this.ledL);
    for (const p of this.parts) {
      const els = byPart.get(p) || [];
      if (PARTS[p.type].dyn) { PARTS[p.type].dyn(p, els, this, dt, vAt); continue; } // batch 3: the module does it itself (parts3.js)
      switch (p.type) {
        case 'aa4': case 'battery': case 'bat18650': { // a battery shorted out: amps, heat, a warning (circuits.js: the short-circuit lesson)
          const e = els.find((x) => x.role === 'battery'); const I = e ? Math.abs(e.iAvg || 0) : 0; p.state.amps = I;
          if (I > 2) { p.state.hotT = (p.state.hotT || 0) + dt; if (p.state.hotT > 0.3 && !p.state.hot) { p.state.hot = true; this.emit('note', { code: 'BAT_SHORT', args: { a: I.toFixed(0) } }); } }
          else { p.state.hotT = 0; p.state.hot = false; }
          break;
        }
        case 'led': case 'rgb': {
          if (p.state.burnt) { p.state.b = 0; break; }
          let maxI = 0; p.state.ch = {};
          for (const e of els) if (e.type === 'D') { const I = Math.max(0, e.iAvg); maxI = Math.max(maxI, I); p.state.ch[e.ch || 'X'] = I; }
          p.state.i = maxI; p.state.b = Math.min(1.5, Math.pow(maxI / 0.015, 0.55));
          if (maxI > 0.04) { p.state.hot = (p.state.hot || 0) + dt; if (p.state.hot > 0.15) { p.state.burnt = true; p.state.b = 0; obs.burnt++; this.rebuildSoon = true; this.emit('burn', { part: p, mA: Math.round(maxI * 1000) }); } }
          else p.state.hot = 0;
          this.trackLed(p.uid, p.state.b, maxI);
          break;
        }
        case 'motor': {
          const e = els[0]; const I = e ? e.iAvg : 0; const s = p.state;
          const tq = MOTOR.ke * I - MOTOR.b * s.w;
          if (Math.abs(s.w) < 2 && Math.abs(MOTOR.ke * I) < MOTOR.tf) s.w = 0;
          else { s.w += (tq - MOTOR.tf * Math.sign(s.w || I)) / (MOTOR.J * (p.props.disc ? 4 : 1)) * dt; // (batch 12: Newton's disc is heavier than the fan)
            if (Math.abs(s.w) < 1 && Math.abs(MOTOR.ke * I) < MOTOR.tf) s.w = 0; }
          s.w = Math.max(-1500, Math.min(1500, s.w)); s.i = I; s.a = (s.a + s.w * dt) % (Math.PI * 2);
          const o = obs.motor[p.uid] || (obs.motor[p.uid] = { max: 0, levels: new Set() });
          o.max = Math.max(o.max, Math.abs(s.w)); if (Math.abs(s.w) > 20) o.levels.add(Math.round(Math.abs(s.w) / 100));
          if (Math.abs(s.w) > 15) this.sounds.push({ id: p.uid, kind: 'motor', f: Math.abs(s.w) / (2 * Math.PI) * 2, amp: Math.min(1, Math.abs(s.w) / 700) });
          break;
        }
        case 'servo': case 'mg996r': {
          const s = p.state; const pow = vAt(p.N.VP) - vAt(p.N.GND); s.powered = pow > 4;
          let target = null;
          if (s.powered && this.mcu.state === 'running') for (const sv of this.mcu.servos) if (sv.pin >= 0 && this.boardNode('G' + sv.pin) === p.N.SIG && this.used('N:G' + sv.pin)) target = sv.angle();
          const blocked = target !== null && s.limit != null && target > s.limit; // something in the gripper: it stops there and pushes
          if (blocked) target = s.limit;
          if (blocked !== !!s.load) { s.load = blocked; this.stateV++; }
          s.target = target;
          if (target !== null) { const d = target - s.angle, step = (PARTS[p.type].rate || 520) * dt; if (Math.abs(d) <= step) { s.angle = target; } else s.angle += Math.sign(d) * step; }
          const mv = target !== null && Math.abs(target - s.angle) > 0.5; if (mv !== !!s.moving) { s.moving = mv; this.stateV++; }
          const o = obs.servo[p.uid] || (obs.servo[p.uid] = { min: 999, max: -999, n: 0 }); if (target !== null) { o.min = Math.min(o.min, s.angle); o.max = Math.max(o.max, s.angle); o.n++; }
          if (mv) this.sounds.push({ id: p.uid, kind: 'servo', f: 120, amp: 0.5 });
          break;
        }
        case 'buzzer': {
          const e = els[0]; const sw = e ? e.swing || 0 : 0;
          const own = e ? (this.toneSwPins || []).filter(([i]) => { const nd = this.boardNode('G' + i); return nd === e.a || nd === e.b; }) : []; // (batch 12: the note of the pin it is on, when another pin also plays PWM)
          const fT = own.length === 1 ? own[0][1] : this.toneSw.length === 1 ? this.toneSw[0] : 0;
          if (sw > 1.2 && fT) { const f = fT; this.sounds.push({ id: p.uid, kind: 'tone', f, amp: Math.min(1, sw / 5) }); obs.tones.add(Math.round(f)); p.state.on = true; }
          else p.state.on = false;
          break;
        }
        case 'bomotor': { // a gear motor: as the DC motor, with the BO's numbers (small steps: it answers in ~40 ms); the wheel turns 48 times slower
          const e = els[0]; const s = p.state; const vm = e ? vAt(e.a) - vAt(e.b) : 0; const open = !e || !this.ok || !this.ok[e.a] || !this.ok[e.b];
          const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n; let I = 0;
          for (let k = 0; k < n; k++) {
            I = open ? 0 : (vm - BO.ke * s.w) / BO.r; const tq = BO.ke * I - BO.b * s.w;
            if (Math.abs(s.w) < 3 && Math.abs(BO.ke * I) < BO.tf) { s.w = 0; continue; }
            const w0 = s.w; s.w += (tq - BO.tf * Math.sign(s.w || I)) / BO.J * h; if (w0 && Math.sign(s.w) !== Math.sign(w0) && Math.abs(BO.ke * I) < BO.tf) s.w = 0; // friction stops it, it does not turn it back
          }
          s.w = Math.max(-1600, Math.min(1600, s.w)); s.i = I; s.a = (s.a + s.w / BO.gear * dt) % (Math.PI * 2);
          const o = obs.motor[p.uid] || (obs.motor[p.uid] = { max: 0, levels: new Set(), fwd: 0, back: 0 });
          o.max = Math.max(o.max, Math.abs(s.w)); if (Math.abs(s.w) > 20) o.levels.add(Math.round(Math.abs(s.w) / 100)); if (s.w > 150) o.fwd += dt; if (s.w < -150) o.back += dt;
          if (Math.abs(s.w) > 25) this.sounds.push({ id: p.uid, kind: 'motor', f: 60 + Math.abs(s.w) * 0.35, amp: Math.min(0.8, Math.abs(s.w) / 900) });
          break;
        }
        case 'hc05': { const pow = vAt(p.N.VCC) - vAt(p.N.GND) > 3.5; if (pow !== !!p.state.powered) { p.state.powered = pow; if (!pow) p.state.paired = false; this.stateV++; this.instKey = null; } break; }
        case 'hcsr04': case 'hcsr04f': case 'ir': case 'lm35': {
          const pow = vAt(p.N.VCC !== undefined ? p.N.VCC : p.N.VS) - vAt(p.N.GND) > (p.type === 'ir' ? 3 : 4); if (pow !== !!p.state.powered) { p.state.powered = pow; this.stateV++; this.instKey = null; } // an IR module (FC-51 type) works from 3.3 V too
          if (p.type === 'ir') p.state.near = pow && p.state.dist <= p.state.thr;
          break;
        }
      }
    }
    for (const h of LAB_HOOKS) if (h.dynamics) h.dynamics(this, dt); // batch 4
    if (this.rebuildSoon) { this.rebuildSoon = false; this.instKey = null; this.stateV++; }
  }
  pinLevelFrame(i) { const s = this.pinStateFrame(i); return s && s.out ? s.duty : 0; }
  trackLed(id, b, I) {
    const o = this.obs.leds[id] || (this.obs.leds[id] = { on: false, toggles: 0, onT: 0, offT: 0, since: this.obs.t, periods: [], levels: new Set(), maxI: 0, minLit: 9 });
    const on = b > 0.18; o.maxI = Math.max(o.maxI, I);
    if (on) { o.onT += 1; o.levels.add(Math.min(9, Math.round(b * 6))); o.minLit = Math.min(o.minLit, b); } else o.offT += 1;
    if (on !== o.on) { o.toggles++; o.periods.push(this.obs.t - o.since); if (o.periods.length > 12) o.periods.shift(); o.since = this.obs.t; o.on = on; }
    o.b = b; o.I = I;
  }
  // what a probe or a hover shows: the voltage of a point (V, or null when it is floating)
  voltageAt(ep) {
    const k = this.key(ep); if (!k || !this.V) return null;
    const n = this.nodeOf(k); if (n >= this.V.length) return null;
    if (!this.ok || !this.ok[n]) return null;
    return this.V[n];
  }
  // the current through a part (A): its main element
  currentOf(p) {
    const els = this.els.filter((e) => e.part === p);
    if (!els.length) return 0;
    if (p.type === 'button') { const s = els.find((e) => e.type === 'SW'); return s ? Math.abs(s.iAvg) : 0; }
    if (p.type === 'pot') return Math.max(...els.map((e) => Math.abs(e.iAvg)));
    if (p.type === 'npn') return els[0].iAvg;
    if (p.type === 'rgb') return els.reduce((s, e) => s + Math.max(0, e.iAvg), 0);
    return Math.abs(els[0].iAvg || 0);
  }
  // a phone app sends letters through the HC-05: they reach the Arduino's RX (pin 0) only if its TXD is wired there
  btSend(text) {
    const bt = this.parts.find((p) => p.type === 'hc05'); if (!bt) return 'none';
    if (!bt.state.powered) return 'off'; if (!bt.state.paired) return 'unpaired';
    if (!this.conn(bt.ep.TXD, 'B:D0')) return this.conn(bt.ep.TXD, 'B:D1') ? 'crossed' : 'nowire';
    if (this.mcu.state !== 'running') return 'stopped';
    const ser = this.mcu.ser; if (!ser.on) return 'nobegin';
    if (ser.baud !== 9600) { for (const c of String(text)) ser.rx.push((c.charCodeAt(0) * 7 + ser.baud) & 255); return 'baud'; } // the wrong speed: garbage letters
    ser.send(text); return 'ok';
  }
  // reset what went wrong: burnt LEDs come back, the fuse cools
  repair() { for (const p of this.parts) if (p.state.burnt) { p.state.burnt = false; p.state.hot = 0; } this.board.tripped = false; this.board.fuse = 0; delete this.board.cool; this.rebuild(); this.emit('parts', null); }
}
export { PITCH };
