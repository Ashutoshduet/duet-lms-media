// DUET Robotics Lab 360, batch 6: the Raspberry Pi boards run the student's Python on the bench's real circuit.
//   Pico   MicroPython as on an RP2040: machine.Pin (IN / OUT, PULL_UP / PULL_DOWN, value, on/off/toggle, irq), PWM (freq,
//          duty_u16, duty_ns), ADC (GP26–28 as 0–65535, ADC(4) the chip's temperature sensor), time_pulse_us, Timer;
//          time / utime (sleep, sleep_ms, sleep_us, ticks_ms …). print() goes to the Shell (Thonny's lower window).
//   Pi 4   Python 3 with gpiozero (LED, PWMLED, Button, MotionSensor, Buzzer, DistanceSensor, Servo, AngularServo, Motor,
//          Robot, DigitalInput/OutputDevice, PWMOutputDevice), signal.pause, time, RPi.GPIO, adafruit_dht + board (and the
//          old Adafruit_DHT). print() and input() use the terminal.
// The language is py.js (batch 5): one Python task runs on the lab's virtual clock inside this board's MCU slot, so Run,
// Stop, Reset, the running line, the speed and the error box work as for the Uno. Every pin goes through the circuit
// (sim.js): 3.3 V outputs, pull-ups and pull-downs, clamp diodes (5 V on a pin is warned about), PWM, servo pulses, the
// HC-SR04's echo through a divider, the DHT11 on its data pin. Callbacks (button.when_pressed, Pin.irq, Timer) run between
// the main program's statements, as an interrupt would; gpiozero's blink() and pulse() run in the background.
// Kind hints in English, Hindi and Hinglish: a pin in the code that has no wire while another has one, physical pin
// numbers used as GPIO numbers, a gpiozero program that ends before its buttons can do anything, too much current, 5 V.
import { compile as pyCompile, Nat, Mod, Flt, tup, str, typeName, Tup, PyErr, PyFn } from './py.js';
import { MCU, RtError } from './mcu.js';
import { BOARDS6, PHYS_OF, J8 } from './boards6.js';
import { LAB_HOOKS } from './boards4.js';
import { CPP, L, msg } from './i18n.js';
import { suggest } from './cpp.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const absent = (v) => typeof v === 'symbol';
const isNone = (v) => v === null || v === undefined || absent(v);
const truthy = (v) => !(v === false || v === null || v === 0 || v === undefined || v === '' || absent(v) || (v instanceof Flt && v.v === 0));
const num = (R, v, fn) => { if (typeof v === 'number') return v; if (typeof v === 'boolean') return +v; if (v instanceof Flt) return v.v; throw R.err('TypeError', 'P_NEED_NUM', { fn: fn || '?', t: typeName(v) }); };
const int = (R, v, fn) => Math.trunc(num(R, v, fn));
const F = (v) => new Flt(v);
const START_EPOCH = 1795000000; // time.time() on the Pi starts here (a November 2026 morning), so runs are the same each time

// ------------------------------------------------------------------ the microcontroller slot: one Python task on the bench
export class PyMCU extends MCU {
  reset() {
    super.reset();
    const n = this.board.gpio;
    this.adcMin = new Array(n).fill(65536); this.adcMax = new Array(n).fill(-1);
    this.pwm = {}; this.bg = []; this.irqQ = []; this.irqGen = null; this.watch = []; this.devs = []; this.claimed = {};
    this.wrote = new Set(); this.readSet = new Set(); this.task = null; this.ended = false; this.cbSet = false;
    this.obs6 = { prints: 0, events: {}, duty: {}, dist: [], dht: [], pulses: 0, started: 0, ends: 0, inputs: 0, lines: [], angles: new Set(), flips: {} };
    this.ser.on = true; this.ser.baud = 115200; this.mode6 = null; this.gpioSetup = {}; this.wroteHigh = false;
  }
  get pi() { return this.board.id === 'pi4'; }
  start() {
    super.start();
    if (this.state !== 'running') return;
    this.obs6.started++;
    this.say(this.pi ? 'pi@raspberrypi:~ $ python3 main.py\n' : 'MPY: soft reboot\n');
    if (this.pi) { const m = this; m.pins[28].mode = 1; this.addBg({ at: this.t + 40000, gen: (function* () { for (let k = 0; k < 7; k++) { m.setLevel(28, k % 2 ? 0 : 1); yield 0.06; } m.setLevel(28, 0); })() }); } // the ACT LED flickers: python3 reads main.py
  }
  stop() {
    const was = this.state === 'running' && this.task && !this.task.done;
    super.stop();
    if (was) this.say(this.pi ? '^C\nKeyboardInterrupt\npi@raspberrypi:~ $ ' : '\nKeyboardInterrupt:\n>>> ');
  }
  say(s) { const b = []; for (const ch of String(s).replace(/\n/g, '\r\n')) b.push(ch.charCodeAt(0)); this.ser.outq.push({ baud: 115200, bytes: b }); } // straight to the monitor (start, stop)
  line6(s) { const L = this.obs6.lines; L.push(String(s).replace(/\n$/, '')); if (L.length > 80) L.shift(); } // the last printed lines (the lessons read them)
  serial(s, t) { const q = this.ser.queue; for (const ch of String(s).replace(/\n/g, '\r\n')) q.push([t, ch.charCodeAt(0)]); }
  // ---------------------------------------------------------------- compile -> program (cpp.js compile(src, board) asks the board)
  pyProgram(c) {
    const m = this; m.task = c.make(m.pi ? piHost(m) : picoHost(m)); m.task.R.t = m.t;
    return { *init() {}, *setup() { for (;;) { m.stepPy(); yield 0; } }, *loop() { yield 0; } };
  }
  // run the task (and its callbacks and background jobs, in time order) up to this frame's end
  stepPy() {
    const T = this.task, R = T.R, until = this.until, wall = this.wallEnd; let lag = false;
    this.poll();
    for (let guard = 0; guard < 2000; guard++) {
      const nb = this.bg.length ? this.bg[0].at : Infinity; const stop = Math.min(until, Math.max(R.t, nb));
      let r;
      if (this.irqGen || this.irqQ.length) r = this.runIrq(stop, wall);
      else if (!T.done) r = T.run(stop, wall);
      else { if (R.t < stop) R.t = stop; r = 'ok'; }
      if (r === 'error') this.failPy();
      if (r === 'wall') { lag = true; break; }
      if (r === 'done' && !this.ended) { this.onEnded(); if (this.state !== 'running') break; continue; }
      while (this.bg.length && this.bg[0].at <= R.t) { const j = this.bg.shift(); this.t = Math.max(this.t, R.t); this.runBg(j); }
      if (R.t >= until) break;
    }
    if (lag) { this.wallOut = true; this.t = Math.max(this.t, R.t); } else { this.t = until; if (R.t < until) R.t = until; }
    this.L = T.done ? 0 : T.line;
  }
  runIrq(stop, wall) {
    const T = this.task, R = T.R; R.until = stop; R.wallEnd = wall; R.wallOut = false;
    try {
      for (;;) {
        if (!this.irqGen) {
          const q = this.irqQ.shift(); if (!q) break; this.t = Math.max(this.t, R.t);
          const r0 = R.c(q[0], q[1], null); if (!(r0 instanceof R.P)) continue; this.irqGen = r0.g;
        }
        const r = this.irqGen.next(); if (r.done) { this.irqGen = null; continue; }
        if (R.t >= stop || R.wallOut) break;
      }
    } catch (e) {
      T.done = true; this.irqGen = null; this.irqQ = [];
      T.err = e instanceof PyErr ? { type: e.type, code: e.code, args: e.args, line: e.line || R.L } : e instanceof RangeError ? { type: 'RecursionError', code: 'P_RECURSION', args: {}, line: R.L } : { type: 'RuntimeError', code: 'P_INTERNAL', args: { msg: String((e && e.message) || e) }, line: R.L };
      return 'error';
    }
    return R.wallOut ? 'wall' : 'ok';
  }
  failPy() {
    const e = this.task.err;
    if (e.type === 'SystemExit') { this.task.err = null; this.onEnded(); return; }
    // the traceback, as the terminal or Thonny's Shell shows it (in English, as on a real board)
    const old = L.lang; L.lang = 'en'; let text = msg({ code: e.code, args: e.args || {} }); L.lang = old; if (!text.startsWith(e.type)) text = e.type + ': ' + text;
    this.serial(`Traceback (most recent call last):\n  File "${this.pi ? '/home/pi/main.py' : '<stdin>'}", line ${e.line}, in <module>\n${text}\n${this.pi ? 'pi@raspberrypi:~ $ ' : '>>> '}`, this.task.R.t);
    this.ser.flushTo(this.task.R.t + 1);
    if (this.pi) this.closeAll();
    throw new RtError(e.code, e.args, e.line);
  }
  onEnded() { // the program reached its end
    this.ended = true; this.obs6.ends++;
    if (!this.pi) { this.serial('>>> ', this.task.R.t); return; } // the Pico: its timers and irqs go on; the Shell waits
    const live = this.devs.some((d) => !d.closed && (Object.values(d.cb).some((f) => f) || d.job)) || this.bg.some((j) => j.dev);
    if (live) this.noteOnce('ended', 'N6_ENDED', {});
    this.closeAll(); this.serial('pi@raspberrypi:~ $ ', this.task.R.t); this.ser.flushTo(this.task.R.t + 1);
    this.state = 'done';
  }
  closeAll() { for (const d of this.devs) if (!d.closed) d.close(); this.bg = this.bg.filter((j) => !j.dev); this.watch = []; }
  noteOnce(key, code, args) { if (this.warned.has(key)) return; this.warned.add(key); if (this.task) this.L = this.task.line || this.L; this.note(code, args || {}); }
  // ---------------------------------------------------------------- background jobs (gpiozero blink / pulse, Timer, the ACT LED)
  addBg(j) { if (j.gen && j.at === undefined) j.at = this.t; let i = this.bg.length; while (i > 0 && this.bg[i - 1].at > j.at) i--; this.bg.splice(i, 0, j); return j; }
  dropBg(j) { const i = this.bg.indexOf(j); if (i >= 0) this.bg.splice(i, 1); }
  runBg(j) {
    if (j.each) j.each(this); const r = j.gen.next();
    if (r.done) { if (j.done) j.done(); return; }
    j.at = Math.max(j.at + Math.max(0.001, r.value) * 1e6, this.t + 1); this.addBg(j);
  }
  // ---------------------------------------------------------------- inputs: edges for callbacks
  poll() { for (const w of this.watch.slice()) { const v = w.read(); if (v === undefined || v === w.last) continue; const was = w.last; w.last = v; if (was !== undefined) w.on(v); } }
  fire(fn, dev) { if (isNone(fn)) return; const args = fn instanceof PyFn && fn.params.length >= 1 ? [dev] : []; this.irqQ.push([fn, args]); this.obs6.events.cb = (this.obs6.events.cb || 0) + 1; }
  ev(k) { this.obs6.events[k] = (this.obs6.events[k] || 0) + 1; }
  // ---------------------------------------------------------------- pins (the task's time first: the circuit sees each change when it happens)
  sync(R) { if (R && R.t > this.t) this.t = R.t; }
  back(R) { if (R && this.t > R.t) R.t = this.t; }
  setMode(p, mode, pull) {
    const P = this.pins[p]; this.t += 1;
    if (mode === 'out') { if (P.mode !== 1) { P.mode = 1; } }
    else { this.dropPwm(p); P.mode = pull === 'up' ? 2 : pull === 'down' ? 3 : 0; P.pwm = -1; P.tone = 0; this.setLevel(p, P.mode === 2 ? 1 : 0); this.readSet.add(p); }
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  out(p, v) {
    const P = this.pins[p]; this.dropPwm(p); P.mode = 1; P.pwm = -1; P.tone = 0; this.t += 0.6;
    const lv = v ? 1 : 0; const was = P.level; this.setLevel(p, lv); this.wrote.add(p); if (lv) this.wroteHigh = true;
    if (this.io.onWrite && was !== lv) this.io.onWrite(p, lv, this.t);
    if (was !== lv) { const f = this.obs6.flips[p] || (this.obs6.flips[p] = { n: 0, last: this.t, per: [] }); f.n++; f.per.push((this.t - f.last) / 1e6); f.last = this.t; if (f.per.length > 8) f.per.shift(); } // (the pin's own changes, by the board's clock: a fast blink on a slow screen)
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  pwmSet(p, f, d) {
    const P = this.pins[p]; P.mode = 1; P.tone = 0; d = clamp(d, 0, 1); this.t += 1;
    this.pwm[p] = { f, d }; if (d <= 0.0005 || d >= 0.9995) { P.pwm = -1; this.setLevel(p, d >= 0.9995 ? 1 : 0); } else { P.pwm = Math.max(1, Math.round(d * 255)); this.setLevel(p, d); }
    // (batch 12) at an audio frequency the pin is a note too: a buzzer on it sounds f (an LED on it still sees the duty)
    if (f >= 100 && f <= 20000 && d > 0.0005 && d < 0.9995) { P.tone = Math.round(f); P.toneDuty = d; P.toneEnd = 0; } else { P.tone = 0; P.toneDuty = undefined; }
    this.wrote.add(p); if (d > 0) this.wroteHigh = true;
    const L2 = this.obs6.duty[p] || (this.obs6.duty[p] = new Set()); L2.add(Math.round(d * 20));
    const ang = servoAngle(this.pwm[p]); if (ang != null) this.obs6.angles.add(Math.round(ang));
    if (!this.servos.some((s) => s.pin === p)) { const m = this; this.servos.push({ pin: p, angle() { return servoAngle(m.pwm[p]); }, tick() {} }); }
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  dropPwm(p) { if (this.pwm[p]) { delete this.pwm[p]; this.servos = this.servos.filter((s) => s.pin !== p); const P = this.pins[p]; if (P) { P.tone = 0; P.toneDuty = undefined; } } }
  vin(p) { const v = this.io.read ? this.io.read(p, this.t) : NaN; this.heavy(); return v; }
  dread(p) { // a digital input, with this board's thresholds (3.3 V logic)
    const P = this.pins[p]; this.readSet.add(p); this.obs6.inputs++;
    if (P.mode === 1 && P.pwm < 0) return P.level >= 0.5 ? 1 : 0;
    const v = this.vin(p);
    if (Number.isNaN(v)) { this.noteOnce('float' + p, 'N6_FLOAT', { pin: this.pinName(p) }); return this.hum(p) > 2.5 ? 1 : 0; }
    if (v >= this.board.vih) return 1; if (v <= this.board.vil) return 0;
    return this.hum(p) * 0.66 > v ? 0 : 1;
  }
  peek(p) { const P = this.pins[p]; if (P.mode === 1 && P.pwm < 0) return P.level >= 0.5 ? 1 : 0; const v = this.io.read ? this.io.read(p, this.t) : NaN; return Number.isNaN(v) ? undefined : v >= this.board.vih ? 1 : 0; } // (a callback's watcher: no notes)
  pinName(p) { return this.pi ? `GPIO ${p} (pin ${PHYS_OF[p] || '?'})` : 'GP' + p; }
  // the Pico's ADC: 12 bits, given as 0–65535 (read_u16); channel 4 is the chip's own temperature sensor
  adc(ch) {
    this.t += 2; let v; const g = 26 + ch;
    if (ch === 4) { const T = (this.lab ? this.lab.env.temp : 26) + 2.4; v = 0.706 - (T - 27) * 0.001721; }
    else if (ch === 3) v = (this.lab && this.lab.powered ? 4.7 : 0) / 3;
    else { v = this.vin(g); if (Number.isNaN(v)) { this.noteOnce('afloat' + g, 'N6_AFLOAT', { pin: 'GP' + g }); v = 1.3 + 0.8 * Math.sin(this.t / 2.1e5 + g) + (Math.random() - 0.5) * 0.4; } }
    let raw = Math.round(clamp(v, 0, 3.3) / 3.3 * 4095 + (Math.random() - 0.5) * 5); raw = clamp(raw, 0, 4095);
    const u = (raw << 4) | (raw >> 8); if (ch < 4) { if (u < this.adcMin[g]) this.adcMin[g] = u; if (u > this.adcMax[g]) this.adcMax[g] = u; }
    return u;
  }
  // the next pulse at `level` the pin really sees from now (an HC-SR04's echo, through a voltage divider as well)
  pulseAt(p, t, timeout) {
    const lab = this.lab; if (!lab || !lab.used('N:G' + p)) return null; const vih = this.board.vih;
    for (const q of lab.parts) {
      const e = q.state && q.state.echo; if (!e || e.end <= t || e.start > t + timeout) continue;
      const hi = lab.readPin(p, (Math.max(e.start, t) + e.end) / 2), lo = lab.readPin(p, e.end + 3); lab.instKey = null;
      if (hi >= vih && !(lo >= vih)) return { start: Math.max(e.start, t), end: e.end };
    }
    return null;
  }
  ping(trig, echo) { // a 10 µs pulse on trig, then the echo's length on echo (µs), or null
    this.out(trig, 0); this.t += 2; this.out(trig, 1); this.t += 10; this.out(trig, 0);
    const pl = this.pulseAt(echo, this.t, 38000); this.obs6.pulses++; return pl ? pl.end - pl.start : null;
  }
  dhtPart(p) { const lab = this.lab; if (!lab || !lab.used('N:G' + p)) return null; const nd = lab.boardNode('G' + p); return lab.parts.find((q) => q.type === 'dht11' && q.state.powered && q.N && q.N.DATA === nd) || null; }
  // gpiozero: one pin, one device
  claim(p, dev, R) { const o = this.claimed[p]; if (o && !o.closed && o !== dev) throw R.err('GPIOPinInUse', 'N6_IN_USE', { pin: p, dev: o.kind }); this.claimed[p] = dev; }
}
export function servoAngle(w) { // the angle an SG90 turns to for this PWM (null: not a servo signal)
  if (!w || !(w.f >= 40 && w.f <= 330)) return null; const us = w.d / w.f * 1e6; if (us < 400 || us > 2700) return null;
  return clamp((us - 500) / 2000 * 180, 0, 180);
}
for (const d of Object.values(BOARDS6)) { d.mcuClass = PyMCU; d.compile = (src) => compilePy(src, d); }

// ------------------------------------------------------------------ compile (cpp.js: a board that has its own language)
export function compilePy(src, def) {
  const c = pyCompile(src, { cost: def.id === 'pico' ? 12 : 2 });
  if (!c.ok) return { ok: false, errors: c.errors.map((e) => ({ code: e.code, line: e.line, args: e.args })), warnings: [], info: {} };
  return { ok: true, errors: [], warnings: c.warnings, info: { serial: true, py: true, imports: c.info.imports }, js: c.js, make: (mcu) => mcu.pyProgram(c) };
}

// ------------------------------------------------------------------ small helpers for objects with methods
const nat = (name, sig, fn, o) => new Nat(name, sig, fn, o);
const B = { blocking: true };
function* waitFor(R, cond, timeout) { // until cond() (checked once a slice: inputs change between frames), or the time is up
  const end = isNone(timeout) ? Infinity : R.t + num(R, timeout) * 1e6;
  for (;;) { if (cond()) return true; if (R.t >= end) return false; yield* R.sleep(Math.max(0.001, (Math.min(end, R.until) - R.t) / 1000)); }
}
const forever = function* (R) { for (;;) yield* R.sleep(1e6); };
class PyObj { // an object with attributes (getters), settable attributes and methods
  constructor(type, name) { this._type = type; this.pyName = name || type; this._m = null; }
  get pyType() { return this._type; }
  pyNames() { return [...Object.keys(this.methods()), ...Object.keys(this.props())]; }
  pyGet(n, R) { const pr = this.props(); if (n in pr) return pr[n](R); const ms = this._m || (this._m = this.methods()); return ms[n]; }
  pySet(n, v, R) { const s = this.setters(); if (!s[n]) return false; s[n](v, R); return true; }
  methods() { return {}; } props() { return {}; } setters() { return {}; }
  pyStr() { return `<${this._type} object>`; }
}
const klass = (name, make, consts, more) => { const o = { pyType: 'type', pyName: name, pyCall: (R, a, kw) => make(R, a, kw || {}), pyGet: (n) => (consts && n in consts ? consts[n] : undefined), pyNames: () => Object.keys(consts || {}), pyStr: () => `<class '${name}'>` }; return Object.assign(o, more || {}); };
const kwArg = (a, kw, i, name, def) => (name in kw ? kw[name] : a.length > i ? a[i] : def);

// ------------------------------------------------------------------ the Pico: machine, time / utime, rp2 (MicroPython)
const PICO_INSIDE = { 23: 'the power chip\'s mode', 24: 'VBUS sense', 29: 'VSYS ÷ 3' };
function picoPin(m, R, v) {
  if (v instanceof PinObj) return v.p;
  if (typeof v === 'string') { const s = v.toUpperCase(); if (s === 'LED') return 25; const mm = /^GP(\d+)$/.exec(s); if (mm) v = +mm[1]; else throw R.err('ValueError', 'N6_PIN_BAD', { pin: JSON.stringify(v) }); }
  const p = int(R, v, 'Pin');
  if (PICO_INSIDE[p]) throw R.err('ValueError', 'N6_PIN_INSIDE', { pin: p, what: PICO_INSIDE[p] });
  if (!(p >= 0 && p <= 28) || (p > 22 && p < 25)) throw R.err('ValueError', 'N6_PIN_BAD', { pin: p });
  return p;
}
class PinObj extends PyObj { // machine.Pin
  constructor(m, p) { super('Pin'); this.m = m; this.p = p; }
  pyStr() { const P = this.m.pins[this.p]; return `Pin(GPIO${this.p}, mode=${P.mode === 1 ? 'OUT' : 'IN'}${P.mode === 2 ? ', pull=PULL_UP' : P.mode === 3 ? ', pull=PULL_DOWN' : ''})`; }
  init(R, mode, pull, value) {
    const m = this.m; m.sync(R);
    if (!isNone(mode) && mode !== -1) { const md = int(R, mode); if (md === 1) { m.setMode(this.p, 'out'); if (!isNone(value)) m.out(this.p, truthy(value)); } else m.setMode(this.p, 'in', pull === 1 ? 'up' : pull === 2 ? 'down' : null); }
    else if (!isNone(pull) && pull !== -1) m.setMode(this.p, 'in', pull === 1 ? 'up' : pull === 2 ? 'down' : null);
    if (!isNone(value) && m.pins[this.p].mode === 1) m.out(this.p, truthy(value));
    m.back(R);
  }
  write(R, v) { const m = this.m; m.sync(R); if (m.pins[this.p].mode !== 1) { m.noteOnce('inw' + this.p, 'N6_IN_WRITE', { pin: 'GP' + this.p }); m.pins[this.p].latch = v ? 1 : 0; } else m.out(this.p, v); m.back(R); return null; }
  read(R) { const m = this.m; m.sync(R); const v = m.dread(this.p); m.back(R); return v; }
  pyCall(R, a) { return a.length ? this.write(R, truthy(a[0])) : this.read(R); }
  methods() {
    const me = this, m = this.m;
    return {
      init: nat('init', '*', (R, a, kw) => { me.init(R, kwArg(a, kw || {}, 0, 'mode', -1), kwArg(a, kw || {}, 1, 'pull', -1), kwArg(a, kw || {}, 2, 'value', null)); return null; }),
      value: nat('value', ['x='], (R, x) => (absent(x) ? me.read(R) : me.write(R, truthy(x)))),
      on: nat('on', [], (R) => me.write(R, 1)), off: nat('off', [], (R) => me.write(R, 0)), high: nat('high', [], (R) => me.write(R, 1)), low: nat('low', [], (R) => me.write(R, 0)),
      toggle: nat('toggle', [], (R) => me.write(R, m.pins[me.p].level >= 0.5 ? 0 : 1)),
      irq: nat('irq', '*', (R, a, kw) => {
        kw = kw || {}; const h = kwArg(a, kw, 0, 'handler', null), tr = int(R, kwArg(a, kw, 1, 'trigger', 12), 'irq');
        m.watch = m.watch.filter((w) => w.pin !== me.p);
        if (!isNone(h)) { m.cbSet = true; m.watch.push({ pin: me.p, last: undefined, read: () => m.peek(me.p), on: (v) => { if ((v && tr & 8) || (!v && tr & 4)) { m.ev('irq'); m.irqQ.push([h, [me]]); } } }); }
        return null;
      }),
      mode: nat('mode', ['x='], (R, x) => { if (absent(x)) return m.pins[me.p].mode === 1 ? 1 : 0; me.init(R, x, -1, null); return null; }),
      pull: nat('pull', ['x='], (R, x) => { if (absent(x)) { const md = m.pins[me.p].mode; return md === 2 ? 1 : md === 3 ? 2 : null; } me.init(R, -1, x, null); return null; }),
    };
  }
}
class PWMObj extends PyObj { // machine.PWM
  constructor(m, p) { super('PWM'); this.m = m; this.p = p; this.f = 1907; this.d = 0; this.on = false; }
  pyStr() { return `<PWM slice=${Math.floor(this.p / 2) % 8} channel=${this.p % 2} invert=0>`; }
  apply(R) { const m = this.m; m.sync(R); m.pwmSet(this.p, this.f, this.d); m.back(R); }
  setF(R, f) { f = num(R, f, 'freq'); if (f < 8) throw R.err('ValueError', 'N6_PWM_FREQ', { f: Math.round(f * 100) / 100 }); if (f > 62.5e6) throw R.err('ValueError', 'N6_PWM_FREQ', { f }); this.f = f; this.apply(R); }
  setD(R, d) { d = int(R, d, 'duty_u16'); if (d < 0 || d > 65535) throw R.err('ValueError', 'N6_DUTY', { v: d }); this.d = d / 65535; this.apply(R); }
  methods() {
    const me = this;
    return {
      freq: nat('freq', ['f='], (R, f) => { if (absent(f)) return Math.round(me.f); me.setF(R, f); return null; }),
      duty_u16: nat('duty_u16', ['d='], (R, d) => { if (absent(d)) return Math.round(me.d * 65535); me.setD(R, d); return null; }),
      duty_ns: nat('duty_ns', ['ns='], (R, ns) => { if (absent(ns)) return Math.round(me.d / me.f * 1e9); me.d = clamp(num(R, ns) * me.f / 1e9, 0, 1); me.apply(R); return null; }),
      init: nat('init', '*', (R, a, kw) => { kw = kw || {}; if ('freq' in kw) me.setF(R, kw.freq); if ('duty_u16' in kw) me.setD(R, kw.duty_u16); return null; }),
      deinit: nat('deinit', [], (R) => { const m = me.m; m.sync(R); m.dropPwm(me.p); m.out(me.p, 0); m.back(R); return null; }),
    };
  }
}
class ADCObj extends PyObj { // machine.ADC
  constructor(m, ch) { super('ADC'); this.m = m; this.ch = ch; }
  pyStr() { return `<ADC channel=${this.ch}>`; }
  methods() { const me = this; return { read_u16: nat('read_u16', [], (R) => { const m = me.m; m.sync(R); if (me.ch < 3) m.readSet.add(26 + me.ch); const v = m.adc(me.ch); m.back(R); return v; }) }; }
}
class TimerObj extends PyObj { // machine.Timer (a software timer: its callback runs between the program's statements)
  constructor(m) { super('Timer'); this.m = m; this.job = null; }
  init(R, kw) {
    const m = this.m; this.deinit(); const mode = 'mode' in kw ? int(R, kw.mode) : 1; let per = 'period' in kw ? num(R, kw.period) : 'freq' in kw ? 1000 / num(R, kw.freq) : -1; const cb = kw.callback;
    if (per <= 0 || isNone(cb)) return; const me = this; per = Math.max(1, per); m.cbSet = true;
    this.job = m.addBg({ at: m.t + per * 1000, gen: (function* () { for (;;) { m.ev('timer'); m.irqQ.push([cb, [me]]); if (mode === 0) return; yield per / 1000; } })(), dev: null });
  }
  deinit() { if (this.job) { this.m.dropBg(this.job); this.job = null; } }
  methods() { const me = this; return { init: nat('init', '*', (R, a, kw) => { me.init(R, kw || {}); return null; }), deinit: nat('deinit', [], () => { me.deinit(); return null; }) }; }
}
function picoHost(m) {
  const machine = (R) => {
    const Pin = klass('Pin', (R2, a, kw) => { const p = picoPin(m, R2, a[0]); const o = new PinObj(m, p); o.init(R2, kwArg(a, kw, 1, 'mode', -1), kwArg(a, kw, 2, 'pull', -1), kwArg(a, kw, 3, 'value', null)); return o; },
      { IN: 0, OUT: 1, OPEN_DRAIN: 2, ALT: 3, PULL_UP: 1, PULL_DOWN: 2, IRQ_FALLING: 4, IRQ_RISING: 8 });
    const PWM = klass('PWM', (R2, a, kw) => { const o = new PWMObj(m, picoPin(m, R2, a[0])); if ('freq' in kw) o.setF(R2, kw.freq); if ('duty_u16' in kw) o.setD(R2, kw.duty_u16); if (!('freq' in kw) && !('duty_u16' in kw)) o.apply(R2); return o; });
    const ADC = klass('ADC', (R2, a) => {
      let ch; const v = a[0];
      if (v instanceof PinObj || typeof v === 'string') { const p = picoPin(m, R2, v); if (p < 26) throw R2.err('ValueError', 'N6_ADC_PIN', { pin: p }); ch = p - 26; }
      else { const n = int(R2, v, 'ADC'); if (n >= 0 && n <= 4) ch = n; else if (n >= 26 && n <= 29) ch = n - 26; else throw R2.err('ValueError', 'N6_ADC_PIN', { pin: n }); }
      if (ch < 3) m.setMode(26 + ch, 'in', null); return new ADCObj(m, ch);
    }, { CORE_TEMP: 4 });
    const Timer = klass('Timer', (R2, a, kw) => { const o = new TimerObj(m); o.init(R2, kw); return o; }, { ONE_SHOT: 0, PERIODIC: 1 });
    const notSim = (what) => klass(what, (R2) => { throw R2.err('NotImplementedError', 'N6_NOT_SIM', { what }); });
    return new Mod('machine', {
      Pin, PWM, ADC, Timer, I2C: notSim('I2C'), SPI: notSim('SPI'), UART: notSim('UART'), SoftI2C: notSim('SoftI2C'),
      time_pulse_us: nat('time_pulse_us', ['pin', 'level', 'timeout_us=1000000'], function* (R2, pin, lv, to) {
        const p = picoPin(m, R2, pin); m.sync(R2); m.readSet.add(p); to = int(R2, to);
        const want = truthy(lv) ? 1 : 0; const pl = want ? m.pulseAt(p, m.t, to) : null;
        if (!pl) { yield* R2.sleep(to / 1000); return -1; }
        yield* R2.sleep(Math.max(0, pl.end - R2.t) / 1000); return Math.round(pl.end - pl.start);
      }, B),
      freq: nat('freq', ['hz='], (R2, hz) => (absent(hz) ? 125000000 : null)),
      reset: nat('reset', [], () => { setTimeout(() => m.lab && m.lab.resetBoard && m.lab.resetBoard(), 0); return null; }),
      soft_reset: nat('soft_reset', [], () => { setTimeout(() => m.lab && m.lab.resetBoard && m.lab.resetBoard(), 0); return null; }),
      unique_id: nat('unique_id', [], () => 'E6614103E7452D2F'), idle: nat('idle', [], function* (R2) { yield* R2.sleep(1); return null; }, B),
      lightsleep: nat('lightsleep', ['ms=0'], function* (R2, ms) { yield* R2.sleep(num(R2, ms)); return null; }, B),
      deepsleep: nat('deepsleep', ['ms=0'], function* (R2, ms) { yield* R2.sleep(num(R2, ms)); return null; }, B),
      disable_irq: nat('disable_irq', [], () => 0), enable_irq: nat('enable_irq', ['s=0'], () => null),
    });
  };
  const sys = () => new Mod('sys', { exit: nat('exit', ['code=0'], (R) => { throw R.err('SystemExit', 'P_RAISED', { type: 'SystemExit', msg: '' }); }), platform: 'rp2', implementation: { pyType: 'tuple', pyStr: () => "(name='micropython', version=(1, 24, 1))", pyGet: () => undefined } });
  const rp2 = () => new Mod('rp2', { bootsel_button: nat('bootsel_button', [], () => (m.bootsel ? 1 : 0)), PIO: klass('PIO', (R2) => { throw R2.err('NotImplementedError', 'N6_NOT_SIM', { what: 'PIO' }); }) });
  const gc = () => new Mod('gc', { collect: nat('collect', [], () => null), mem_free: nat('mem_free', [], () => 187264), mem_alloc: nat('mem_alloc', [], () => 4992), enable: nat('enable', [], () => null), disable: nat('disable', [], () => null) });
  const upy = () => new Mod('micropython', { const: nat('const', ['x'], (R, x) => x), mem_info: nat('mem_info', [], () => null) });
  const wrong = (mod) => (R) => { throw R.err('ImportError', 'N6_MOD_PICO', { mod }); };
  return {
    modules: { machine, sys, rp2, gc, micropython: upy, dht: () => mpDht(m), gpiozero: wrong('gpiozero'), 'RPi.GPIO': wrong('RPi.GPIO'), RPi: wrong('RPi'), adafruit_dht: wrong('adafruit_dht'), board: wrong('board'), signal: wrong('signal') },
    print: (s, R) => { m.serial(s, R.t); m.obs6.prints++; m.line6(s); },
    hint: (name, G) => hint6(name, G, false),
    names: () => ['Pin', 'PWM', 'ADC', 'Timer', 'time_pulse_us', 'sleep', 'sleep_ms', 'utime', 'time', 'machine'],
  };
}

// ------------------------------------------------------------------ the Pi 4: gpiozero, time, signal, RPi.GPIO, adafruit_dht
function piPin(m, R, v) { // a gpiozero pin: 17, "GPIO17", "BCM17", "BOARD11", "J8:11"
  let p;
  if (v && v.board6) return v.gpio;
  if (typeof v === 'string') {
    const s = v.toUpperCase().replace(/\s+/g, ''); let mm;
    if ((mm = /^(?:GPIO|BCM)(\d+)$/.exec(s))) p = +mm[1];
    else if ((mm = /^(?:BOARD|J8:)(\d+)$/.exec(s))) { const n = +mm[1]; const w = J8[n]; if (w === undefined) throw R.err('PinInvalidPin', 'N6_PI_PIN', { pin: s }); if (typeof w !== 'number') throw R.err('PinInvalidPin', 'N6_PI_POWER', { phys: n, what: w }); p = w; }
    else if (/^\d+$/.test(s)) p = +s;
    else throw R.err('PinInvalidPin', 'N6_PI_PIN', { pin: JSON.stringify(v) });
  } else p = int(R, v, 'pin');
  if (!(p >= 0 && p <= 27)) throw R.err('PinInvalidPin', 'N6_PI_PIN', { pin: p });
  if (p <= 1) m.noteOnce('idpin', 'N6_ID', {});
  return p;
}
const PIN_DESC = (p) => ({ pyType: 'pin', board6: true, gpio: p, pyStr: () => 'GPIO' + p, pyGet: (n) => (n === 'number' ? p : n === 'info' ? undefined : undefined), pyNames: () => ['number'] });
class GZ extends PyObj { // a gpiozero device
  constructor(m, R, kind, pins) { super(kind, kind); this.m = m; this.kind = kind; this.pins = pins; this.closed = false; this.cb = {}; this.job = null; for (const p of pins) m.claim(p, this, R); m.devs.push(this); }
  pyStr() { return this.closed ? `<gpiozero.${this.kind} object closed>` : `<gpiozero.${this.kind} object on pin GPIO${this.pins[0]}, ${this.desc ? this.desc() : ''}>`; }
  live(R) { if (this.closed) throw R.err('GPIODeviceClosed', 'N6_CLOSED', { dev: this.kind }); }
  stopJob() { if (this.job) { this.m.dropBg(this.job); this.job = null; } }
  close() { this.stopJob(); this.closed = true; for (const p of this.pins) { if (this.m.claimed[p] === this) delete this.m.claimed[p]; this.m.watch = this.m.watch.filter((w) => w.dev !== this); this.m.setMode(p, 'in', null); } }
  baseMethods() { const me = this; return { close: nat('close', [], () => { me.close(); return null; }) }; }
  baseProps() { const me = this; return { closed: () => me.closed, pin: () => PIN_DESC(me.pins[0]) }; }
  setCb(name, v) { this.cb[name] = isNone(v) ? null : v; if (!isNone(v)) this.m.cbSet = true; }
}
// an output: LED, Buzzer, DigitalOutputDevice; PWM ones: PWMLED, PWMOutputDevice (value 0–1)
class GZOut extends GZ {
  constructor(m, R, kind, pin, o) { super(m, R, kind, [pin]); this.hi = o.active_high !== false; this.pwmOn = !!o.pwm; this.freq = o.frequency || 100; this.v = 0; m.sync(R); m.setMode(pin, 'out'); this.set(R, o.initial || 0); }
  desc() { return `active_high=${this.hi ? 'True' : 'False'}, is_active=${this.v > 0 ? 'True' : 'False'}`; }
  set(R, v) { // the device's value (0 or 1; 0–1 for PWM), on the pin now
    const m = this.m; m.sync(R); this.v = v; const p = this.pins[0];
    if (this.pwmOn) { const d = this.hi ? v : 1 - v; if (d > 0 && d < 1) m.pwmSet(p, this.freq, d); else m.out(p, d >= 1); } else m.out(p, this.hi ? v > 0 : !(v > 0));
    if (this.kind === 'Buzzer' && v) m.ev('buzz'); m.back(R);
  }
  seq(R, steps, n, bg) { // a pattern in the background (blink, beep, pulse): steps = [[value, seconds], …]
    this.stopJob(); const me = this, m = this.m; let k = 0;
    const gen = (function* () { for (let i = 0; isNone(n) || i < n; i++) for (const [v, s] of steps) { k++; me.v = v; me.set(null, v); yield s; } me.set(null, 0); me.job = null; })();
    void k; m.sync(R); this.job = m.addBg({ at: m.t, gen, dev: this }); return this.job;
  }
  methods() {
    const me = this; const bg = (R, job, b) => (truthy(b) ? null : new R.P(waitFor(R, () => !me.job || me.job !== job || me.closed, null)));
    const ms = Object.assign(this.baseMethods(), {
      on: nat('on', [], (R) => { me.live(R); me.stopJob(); me.set(R, 1); return null; }), off: nat('off', [], (R) => { me.live(R); me.stopJob(); me.set(R, 0); return null; }),
      toggle: nat('toggle', [], (R) => { me.live(R); me.stopJob(); me.set(R, me.pwmOn ? 1 - me.v : me.v > 0 ? 0 : 1); return null; }),
      blink: nat('blink', '*', (R, a, kw) => { kw = kw || {}; me.live(R); const on = num(R, kwArg(a, kw, 0, 'on_time', 1)), off = num(R, kwArg(a, kw, 1, 'off_time', 1)); let i = 2; const fi = me.pwmOn ? num(R, kwArg(a, kw, i++, 'fade_in_time', 0)) : 0, fo = me.pwmOn ? num(R, kwArg(a, kw, i++, 'fade_out_time', 0)) : 0; const n = kwArg(a, kw, i, 'n', null), b = kwArg(a, kw, i + 1, 'background', true);
        const steps = [...ramp(0, 1, fi), [1, on], ...ramp(1, 0, fo), [0, off]]; return bg(R, me.seq(R, steps, isNone(n) ? null : int(R, n)), b); }),
    });
    if (this.kind === 'Buzzer') ms.beep = nat('beep', '*', (R, a, kw) => { kw = kw || {}; me.live(R); const on = num(R, kwArg(a, kw, 0, 'on_time', 1)), off = num(R, kwArg(a, kw, 1, 'off_time', 1)), n = kwArg(a, kw, 2, 'n', null), b = kwArg(a, kw, 3, 'background', true); return bg(R, me.seq(R, [[1, on], [0, off]], isNone(n) ? null : int(R, n)), b); });
    if (this.pwmOn) ms.pulse = nat('pulse', '*', (R, a, kw) => { kw = kw || {}; me.live(R); const fi = num(R, kwArg(a, kw, 0, 'fade_in_time', 1)), fo = num(R, kwArg(a, kw, 1, 'fade_out_time', 1)), n = kwArg(a, kw, 2, 'n', null), b = kwArg(a, kw, 3, 'background', true); return bg(R, me.seq(R, [...ramp(0, 1, fi), ...ramp(1, 0, fo)], isNone(n) ? null : int(R, n)), b); });
    return ms;
  }
  props() { const me = this; return Object.assign(this.baseProps(), { value: () => (me.pwmOn ? F(me.v) : me.v > 0 ? 1 : 0), is_lit: () => me.v > 0, is_active: () => me.v > 0, active_high: () => me.hi, frequency: () => me.freq }); }
  setters() { const me = this; return { value: (v, R) => { me.live(R); me.stopJob(); let x = num(R, v); if (me.pwmOn && (x < 0 || x > 1)) throw R.err('OutputDeviceBadValue', 'N6_PWM_VALUE', { v: x }); me.set(R, me.pwmOn ? x : x ? 1 : 0); }, frequency: (v, R) => { me.freq = num(R, v); me.set(R, me.v); } }; }
}
const ramp = (a, b, secs) => { if (!(secs > 0)) return []; const n = Math.max(1, Math.round(secs * 25)), out = []; for (let i = 1; i <= n; i++) out.push([a + (b - a) * i / n, 1 / 25]); return out; }; // gpiozero fades at 25 steps a second
// an input: Button, MotionSensor, DigitalInputDevice (events, waits)
class GZIn extends GZ {
  constructor(m, R, kind, pin, o) {
    super(m, R, kind, [pin]); this.pull = o.pull; this.active = o.active; this.holdT = o.hold_time || 1; this.names = o.names;
    m.sync(R); m.setMode(pin, 'in', this.pull === true ? 'up' : this.pull === false ? 'down' : null); m.back(R);
    const me = this; this.heldAt = null;
    m.watch.push({ pin, dev: this, last: undefined, read: () => (me.closed ? undefined : me.activeNow(true)), on: (v) => {
      m.ev(v ? me.names[0] : me.names[1]); me.cnt = (me.cnt || 0) + 1;
      m.fire(v ? me.cb.a : me.cb.d, me);
      if (v && me.cb.held) { me.heldJob = m.addBg({ at: m.t + me.holdT * 1e6, gen: (function* () { if (me.activeNow(true)) { m.ev('held'); m.fire(me.cb.held, me); } })(), dev: me }); }
    } });
  }
  activeNow(quiet) { const m = this.m, p = this.pins[0]; const raw = quiet ? m.peek(p) : m.dread(p); if (raw === undefined) return undefined; const hiActive = this.active !== undefined ? this.active : this.pull !== true; return hiActive ? raw === 1 : raw === 0; }
  isActive(R) { this.live(R); this.m.sync(R); const v = this.activeNow(false); this.m.back(R); return !!v; }
  methods() {
    const me = this; const [a, d] = this.waitNames;
    return Object.assign(this.baseMethods(), {
      [a]: nat(a, ['timeout=None'], (R, t) => new R.P(waitFor(R, () => me.isActive(R), t))),
      [d]: nat(d, ['timeout=None'], (R, t) => new R.P(waitFor(R, () => !me.isActive(R), t))),
    });
  }
  props() { const me = this; const o = Object.assign(this.baseProps(), { value: (R) => (me.isActive(R) ? 1 : 0), is_active: (R) => me.isActive(R), pull_up: () => me.pull === true, hold_time: () => F(me.holdT) }); for (const k of this.activeNames) o[k] = (R) => me.isActive(R); for (const [k, c] of Object.entries(this.cbNames)) o[k] = () => (me.cb[c] || null); return o; }
  setters() { const me = this; const s = { hold_time: (v, R) => { me.holdT = num(R, v); } }; for (const [k, c] of Object.entries(this.cbNames)) s[k] = (v) => me.setCb(c, v); return s; }
}
const IN_KINDS = {
  Button: { waits: ['wait_for_press', 'wait_for_release'], act: ['is_pressed', 'is_held'], cbs: { when_pressed: 'a', when_released: 'd', when_held: 'held' }, names: ['pressed', 'released'] },
  MotionSensor: { waits: ['wait_for_motion', 'wait_for_no_motion'], act: ['motion_detected'], cbs: { when_motion: 'a', when_no_motion: 'd' }, names: ['motion', 'nomotion'] },
  DigitalInputDevice: { waits: ['wait_for_active', 'wait_for_inactive'], act: [], cbs: { when_activated: 'a', when_deactivated: 'd' }, names: ['active', 'inactive'] },
  LineSensor: { waits: ['wait_for_line', 'wait_for_no_line'], act: ['line_detected'], cbs: { when_line: 'a', when_no_line: 'd' }, names: ['line', 'noline'] },
};
function makeIn(m, kind) {
  const K = IN_KINDS[kind];
  return klass(kind, (R, a, kw) => {
    const pin = piPin(m, R, kwArg(a, kw, 0, 'pin', null)); const pd = kind === 'Button'; const pos = kind === 'Button' || kind === 'DigitalInputDevice'; // (MotionSensor, LineSensor: pull_up only by name)
    const pu = pos ? kwArg(a, kw, 1, 'pull_up', pd) : 'pull_up' in kw ? kw.pull_up : pd; const st = pos ? kwArg(a, kw, 2, 'active_state', null) : 'active_state' in kw ? kw.active_state : null;
    const o = new GZIn(m, R, kind, pin, { pull: isNone(pu) ? null : truthy(pu), active: isNone(st) ? undefined : truthy(st), hold_time: 'hold_time' in kw ? num(R, kw.hold_time) : 1, names: K.names });
    o.waitNames = K.waits; o.activeNames = K.act; o.cbNames = K.cbs; o._m = null; return o;
  });
}
// DistanceSensor (HC-SR04): echo first, then trigger. distance in metres, up to max_distance (1 m)
class GZDist extends GZ {
  constructor(m, R, echo, trig, o) {
    super(m, R, 'DistanceSensor', [echo, trig]); this.echo = echo; this.trig = trig; this.max = o.max; this.thr = o.thr; this.last = null; this.lastAt = -1e12;
    m.sync(R); m.setMode(echo, 'in', null); m.setMode(trig, 'out'); m.out(trig, 0); m.back(R);
    const me = this;
    m.watch.push({ pin: echo, dev: this, last: undefined, read: () => (me.closed ? undefined : me.read(null) < me.thr), on: (v) => { m.ev(v ? 'inrange' : 'outrange'); m.fire(v ? me.cb.a : me.cb.d, me); } });
  }
  read(R) { // one ping at most every 60 ms (gpiozero pings all the time in the background), in metres
    const m = this.m; if (R) m.sync(R);
    if (m.t - this.lastAt > 60000 || this.last === null) {
      this.lastAt = m.t; const us = m.ping(this.trig, this.echo);
      if (us === null) { this.last = this.max; if (m.t > 300000) { const lab = m.lab; const sw = lab && lab.used('N:G' + this.echo) && lab.parts.some((q) => q.state && q.N && 'TRIG' in q.N && q.N.TRIG === lab.boardNode('G' + this.echo)); m.noteOnce(sw ? 'dswap' : 'decho', sw ? 'N6_SWAP' : 'N6_ECHO', { echo: m.pinName(this.echo), trig: m.pinName(this.trig) }); } }
      else this.last = Math.min(this.max, us / 1e6 * 343 / 2);
      if (R) m.obs6.dist.push(Math.round(this.last * 1000) / 10);
    }
    if (R) m.back(R); return this.last;
  }
  methods() { const me = this; return Object.assign(this.baseMethods(), { wait_for_in_range: nat('wait_for_in_range', ['timeout=None'], (R, t) => new R.P(waitFor(R, () => me.read(R) < me.thr, t))), wait_for_out_of_range: nat('wait_for_out_of_range', ['timeout=None'], (R, t) => new R.P(waitFor(R, () => me.read(R) >= me.thr, t))) }); }
  props() { const me = this; return Object.assign(this.baseProps(), { distance: (R) => { me.live(R); return F(me.read(R)); }, value: (R) => F(me.read(R) / me.max), max_distance: () => F(me.max), threshold_distance: () => F(me.thr), in_range: (R) => me.read(R) < me.thr, when_in_range: () => me.cb.a || null, when_out_of_range: () => me.cb.d || null, echo: () => PIN_DESC(me.echo), trigger: () => PIN_DESC(me.trig) }); }
  setters() { const me = this; return { max_distance: (v, R) => { me.max = num(R, v); }, threshold_distance: (v, R) => { me.thr = num(R, v); }, when_in_range: (v) => me.setCb('a', v), when_out_of_range: (v) => me.setCb('d', v) }; }
}
// Servo (value −1 … 1 over min / max pulse widths) and AngularServo (angle)
class GZServo extends GZ {
  constructor(m, R, kind, pin, o) { super(m, R, kind, [pin]); Object.assign(this, o); this.v = o.v0; m.sync(R); m.setMode(pin, 'out'); this.apply(R); }
  apply(R) { const m = this.m; m.sync(R); if (this.v === null) { m.dropPwm(this.pins[0]); m.out(this.pins[0], 0); } else { const w = this.minW + (this.v + 1) / 2 * (this.maxW - this.minW); m.pwmSet(this.pins[0], 1 / this.frame, w / this.frame); } m.back(R); }
  setV(R, v) { this.live(R); if (v !== null && (v < -1 || v > 1)) throw R.err('OutputDeviceBadValue', 'N6_SERVO_VAL', { v }); this.v = v; this.apply(R); }
  ang(v) { return this.minA + (v + 1) / 2 * (this.maxA - this.minA); }
  methods() { const me = this; return Object.assign(this.baseMethods(), { min: nat('min', [], (R) => { me.setV(R, -1); return null; }), mid: nat('mid', [], (R) => { me.setV(R, 0); return null; }), max: nat('max', [], (R) => { me.setV(R, 1); return null; }), detach: nat('detach', [], (R) => { me.setV(R, null); return null; }) }); }
  props() { const me = this; return Object.assign(this.baseProps(), { value: () => (me.v === null ? null : F(me.v)), angle: () => (me.v === null ? null : F(me.ang(me.v))), min_angle: () => F(me.minA), max_angle: () => F(me.maxA), is_active: () => me.v !== null }); }
  setters() { const me = this; return { value: (v, R) => me.setV(R, isNone(v) ? null : num(R, v)), angle: (v, R) => { if (isNone(v)) { me.setV(R, null); return; } const a = num(R, v); const lo = Math.min(me.minA, me.maxA), hi = Math.max(me.minA, me.maxA); if (a < lo || a > hi) throw R.err('ValueError', 'N6_ANGLE', { a, lo, hi }); me.setV(R, (a - me.minA) / (me.maxA - me.minA) * 2 - 1); } }; }
}
// Motor (forward / backward pins, an enable pin for an L298N's ENA) and Robot (two motors)
class GZMotor extends GZ {
  constructor(m, R, fwd, bwd, en, pwm) { super(m, R, 'Motor', en === null ? [fwd, bwd] : [fwd, bwd, en]); this.f = fwd; this.b = bwd; this.en = en; this.pwmOn = pwm; this.v = 0; m.sync(R); for (const p of this.pins) { m.setMode(p, 'out'); m.out(p, 0); } m.back(R); }
  set(R, v) {
    this.live(R); if (v < -1 || v > 1) throw R.err('OutputDeviceBadValue', 'N6_MOTOR_SPEED', { v }); const m = this.m; m.sync(R); this.v = v; const s = Math.abs(v);
    if (this.en !== null) { m.out(this.f, v > 0); m.out(this.b, v < 0); if (this.pwmOn && s > 0 && s < 1) m.pwmSet(this.en, 100, s); else m.out(this.en, s > 0); }
    else { const on = v > 0 ? this.f : this.b, other = v > 0 ? this.b : this.f; m.out(other, 0); if (s === 0) m.out(on, 0); else if (this.pwmOn && s < 1) m.pwmSet(on, 100, s); else m.out(on, 1); }
    if (v) m.ev('motor'); m.back(R);
  }
  methods() { const me = this; const sp = (R, x) => { const s = absent(x) ? 1 : num(R, x); if (s < 0 || s > 1) throw R.err('ValueError', 'N6_MOTOR_SPEED', { v: s }); return s; };
    return Object.assign(this.baseMethods(), { forward: nat('forward', ['speed='], (R, x) => { me.set(R, sp(R, x)); return null; }), backward: nat('backward', ['speed='], (R, x) => { me.set(R, -sp(R, x)); return null; }), stop: nat('stop', [], (R) => { me.set(R, 0); return null; }), reverse: nat('reverse', [], (R) => { me.set(R, -me.v); return null; }) }); }
  props() { const me = this; return Object.assign(this.baseProps(), { value: () => F(me.v), is_active: () => me.v !== 0 }); }
  setters() { const me = this; return { value: (v, R) => me.set(R, num(R, v)) }; }
}
class GZRobot extends PyObj {
  constructor(m, L, Rm) { super('Robot'); this.m = m; this.L = L; this.Rm = Rm; m.devs.push(this); this.cb = {}; this.closed = false; this.kind = 'Robot'; this.pins = []; }
  close() { this.closed = true; this.L.close(); this.Rm.close(); }
  drive(R, l, r) { this.L.set(R, l); this.Rm.set(R, r); this.m.ev('drive'); }
  methods() {
    const me = this; const sp = (R, x) => { const s = absent(x) ? 1 : num(R, x); if (s < 0 || s > 1) throw R.err('ValueError', 'N6_MOTOR_SPEED', { v: s }); return s; };
    const fw = (sign) => (R, a, kw) => { kw = kw || {}; const s = sp(R, kwArg(a, kw, 0, 'speed', Symbol('a'))); const cl = num(R, kw.curve_left || 0), cr = num(R, kw.curve_right || 0); me.drive(R, sign * s * (1 - cl), sign * s * (1 - cr)); return null; };
    return { forward: nat('forward', '*', fw(1)), backward: nat('backward', '*', fw(-1)), left: nat('left', ['speed='], (R, x) => { const s = sp(R, x); me.drive(R, -s, s); return null; }), right: nat('right', ['speed='], (R, x) => { const s = sp(R, x); me.drive(R, s, -s); return null; }),
      stop: nat('stop', [], (R) => { me.drive(R, 0, 0); return null; }), reverse: nat('reverse', [], (R) => { me.drive(R, -me.L.v, -me.Rm.v); return null; }), close: nat('close', [], () => { me.close(); return null; }) };
  }
  props() { const me = this; return { value: () => tup([F(me.L.v), F(me.Rm.v)]), left_motor: () => me.L, right_motor: () => me.Rm, is_active: () => me.L.v !== 0 || me.Rm.v !== 0 }; }
  setters() { const me = this; return { value: (v, R) => { const [l, r] = R.up(v, 2); me.drive(R, num(R, l), num(R, r)); } }; }
}
function gpiozero(m) {
  const out = (kind, pwm) => klass(kind, (R, a, kw) => {
    const pin = piPin(m, R, kwArg(a, kw, 0, 'pin', null)); const hi = kwArg(a, kw, 1, 'active_high', true), iv = kwArg(a, kw, 2, 'initial_value', pwm ? 0 : false);
    return new GZOut(m, R, kind, pin, { active_high: truthy(hi), initial: num(R, iv) || 0, pwm, frequency: 'frequency' in kw ? num(R, kw.frequency) : 100 });
  });
  const motor = (R, a, kw) => {
    const f = piPin(m, R, kwArg(a, kw, 0, 'forward', null)), b = piPin(m, R, kwArg(a, kw, 1, 'backward', null)); const e = kwArg(a, kw, 2, 'enable', null);
    return new GZMotor(m, R, f, b, isNone(e) ? null : piPin(m, R, e), truthy(kwArg(a, kw, 3, 'pwm', true)));
  };
  const asMotor = (R, v) => { if (v instanceof GZMotor) return v; const l = R.list(v); return motor(R, l, {}); };
  return new Mod('gpiozero', {
    LED: out('LED', false), PWMLED: out('PWMLED', true), Buzzer: out('Buzzer', false), DigitalOutputDevice: out('DigitalOutputDevice', false), OutputDevice: out('OutputDevice', false), PWMOutputDevice: out('PWMOutputDevice', true),
    Button: makeIn(m, 'Button'), MotionSensor: makeIn(m, 'MotionSensor'), DigitalInputDevice: makeIn(m, 'DigitalInputDevice'), LineSensor: makeIn(m, 'LineSensor'),
    DistanceSensor: klass('DistanceSensor', (R, a, kw) => { const e = kwArg(a, kw, 0, 'echo', null), t = kwArg(a, kw, 1, 'trigger', null); if (isNone(e) || isNone(t)) throw R.err('TypeError', 'N6_DIST_ARGS', {}); return new GZDist(m, R, piPin(m, R, e), piPin(m, R, t), { max: num(R, kw.max_distance || 1), thr: num(R, kw.threshold_distance || F(0.3)) }); }),
    Servo: klass('Servo', (R, a, kw) => new GZServo(m, R, 'Servo', piPin(m, R, kwArg(a, kw, 0, 'pin', null)), { v0: isNone(kwArg(a, kw, 1, 'initial_value', 0)) ? null : num(R, kwArg(a, kw, 1, 'initial_value', 0)), minW: num(R, kwArg(a, kw, 2, 'min_pulse_width', F(0.001))), maxW: num(R, kwArg(a, kw, 3, 'max_pulse_width', F(0.002))), frame: num(R, kwArg(a, kw, 4, 'frame_width', F(0.02))), minA: -1, maxA: 1 })),
    AngularServo: klass('AngularServo', (R, a, kw) => { const minA = num(R, kwArg(a, kw, 2, 'min_angle', -90)), maxA = num(R, kwArg(a, kw, 3, 'max_angle', 90)); const a0 = kwArg(a, kw, 1, 'initial_angle', 0); const o = new GZServo(m, R, 'AngularServo', piPin(m, R, kwArg(a, kw, 0, 'pin', null)), { v0: isNone(a0) ? null : (num(R, a0) - minA) / (maxA - minA) * 2 - 1, minW: num(R, kwArg(a, kw, 4, 'min_pulse_width', F(0.001))), maxW: num(R, kwArg(a, kw, 5, 'max_pulse_width', F(0.002))), frame: num(R, kwArg(a, kw, 6, 'frame_width', F(0.02))), minA, maxA }); return o; }),
    Motor: klass('Motor', motor),
    Robot: klass('Robot', (R, a, kw) => { const l = kwArg(a, kw, 0, 'left', null), r = kwArg(a, kw, 1, 'right', null); if (isNone(l) || isNone(r)) throw R.err('TypeError', 'N6_ROBOT_ARGS', {}); return new GZRobot(m, asMotor(R, l), asMotor(R, r)); }),
    Device: { pyType: 'type', pyName: 'Device', pyGet: () => undefined, pyStr: () => "<class 'gpiozero.Device'>" },
  });
}
function rpiGPIO(m) { // RPi.GPIO (the older library; it does not work on a Pi 5, gpiozero does)
  const G = { BCM: 11, BOARD: 10, OUT: 0, IN: 1, HIGH: 1, LOW: 0, PUD_UP: 22, PUD_DOWN: 21, PUD_OFF: 20, RISING: 31, FALLING: 32, BOTH: 33 };
  const ch = (R, c) => { if (!m.mode6) throw R.err('RuntimeError', 'N6_GPIO_MODE', {}); const n = int(R, c); if (m.mode6 === 'BOARD') { const w = J8[n]; if (typeof w !== 'number') throw R.err('ValueError', 'N6_GPIO_CH', { n, mode: 'BOARD' }); return w; } if (!(n >= 0 && n <= 27)) throw R.err('ValueError', 'N6_GPIO_CH', { n, mode: 'BCM' }); return n; };
  const each = (R, c, f) => { if (Array.isArray(c)) c.forEach((x) => f(ch(R, x))); else f(ch(R, c)); };
  class GPWM extends PyObj { constructor(p, f) { super('PWM'); this.p = p; this.f = f; this.dc = 0; this.on = false; } go(R) { m.sync(R); if (this.on) m.pwmSet(this.p, this.f, this.dc / 100); else m.out(this.p, 0); m.back(R); }
    methods() { const me = this; return { start: nat('start', ['dc'], (R, d) => { me.dc = clamp(num(R, d), 0, 100); me.on = true; me.go(R); return null; }), ChangeDutyCycle: nat('ChangeDutyCycle', ['dc'], (R, d) => { const v = num(R, d); if (v < 0 || v > 100) throw R.err('ValueError', 'N6_DC', { v }); me.dc = v; me.go(R); return null; }), ChangeFrequency: nat('ChangeFrequency', ['f'], (R, f) => { me.f = num(R, f); me.go(R); return null; }), stop: nat('stop', [], (R) => { me.on = false; me.go(R); return null; }) }; } }
  const mod = new Mod('RPi.GPIO', Object.assign({}, G, {
    setmode: nat('setmode', ['mode'], (R, md) => { m.mode6 = md === 11 ? 'BCM' : md === 10 ? 'BOARD' : null; return null; }), getmode: nat('getmode', [], () => (m.mode6 === 'BCM' ? 11 : m.mode6 === 'BOARD' ? 10 : null)),
    setwarnings: nat('setwarnings', ['flag'], () => null),
    setup: nat('setup', '*', (R, a, kw) => { kw = kw || {}; const dir = int(R, kwArg(a, kw, 1, 'direction', 1)), pud = int(R, kwArg(a, kw, 2, 'pull_up_down', 20)), ini = kwArg(a, kw, 3, 'initial', null); m.sync(R); each(R, a[0], (p) => { m.gpioSetup[p] = dir; if (dir === 0) { m.setMode(p, 'out'); if (!isNone(ini)) m.out(p, truthy(ini)); } else m.setMode(p, 'in', pud === 22 ? 'up' : pud === 21 ? 'down' : null); }); m.back(R); return null; }),
    output: nat('output', ['channel', 'value'], (R, c, v) => { m.sync(R); const vs = Array.isArray(v) ? v : null; let k = 0; each(R, c, (p) => { if (m.gpioSetup[p] !== 0) throw R.err('RuntimeError', 'N6_GPIO_OUT', {}); m.out(p, truthy(vs ? vs[k++] : v)); }); m.back(R); return null; }),
    input: nat('input', ['channel'], (R, c) => { const p = ch(R, c); if (m.gpioSetup[p] === undefined) throw R.err('RuntimeError', 'N6_GPIO_IN', {}); m.sync(R); const v = m.dread(p); m.back(R); return v; }),
    cleanup: nat('cleanup', ['channel='], (R) => { m.sync(R); for (const p of Object.keys(m.gpioSetup)) { m.setMode(+p, 'in', null); } m.gpioSetup = {}; m.back(R); return null; }),
    PWM: klass('PWM', (R, a) => { const p = ch(R, a[0]); if (m.gpioSetup[p] !== 0) throw R.err('RuntimeError', 'N6_GPIO_OUT', {}); return new GPWM(p, num(R, a[1])); }),
    wait_for_edge: nat('wait_for_edge', '*', (R, a, kw) => { const p = ch(R, a[0]), e = int(R, a[1]); const to = 'timeout' in (kw || {}) ? num(R, kw.timeout) / 1000 : null; let last = m.peek(p); return new R.P(waitFor(R, () => { const v = m.peek(p); const hit = v !== last && (e === 33 || (e === 31 && v) || (e === 32 && !v)); last = v; return hit; }, to)); }),
    add_event_detect: nat('add_event_detect', '*', (R, a, kw) => { const p = ch(R, a[0]), e = int(R, a[1]); const cb = (kw || {}).callback; m.watch.push({ pin: p, last: undefined, read: () => m.peek(p), on: (v) => { if (e === 33 || (e === 31 && v) || (e === 32 && !v)) { m.ev('edge'); if (!isNone(cb)) m.irqQ.push([cb, [p]]); } } }); if (!isNone(cb)) m.cbSet = true; return null; }),
    remove_event_detect: nat('remove_event_detect', ['channel'], (R, c) => { const p = ch(R, c); m.watch = m.watch.filter((w) => w.pin !== p); return null; }),
    RPI_INFO: null, VERSION: '0.7.1',
  }));
  return mod;
}
// batch 14: MicroPython's dht module (the Pico): sensor = dht.DHT11(Pin(15)); sensor.measure(); sensor.temperature()
function mpDht(m) {
  const D = dhtMods(m);
  class MPDHT extends D.DHT {
    props() { return {}; }
    methods() { const me = this; return {
      measure: nat('measure', [], (R) => { try { me.measure(R); } catch (e) { if (e.code === 'N6_DHT_CHECKSUM' || e.code === 'N6_DHT_NONE') throw R.err('OSError', e.code === 'N6_DHT_NONE' ? 'N6_MPDHT_NONE' : 'N6_MPDHT_TIMEOUT', { pin: me.p }); throw e; } return null; }),
      temperature: nat('temperature', [], () => (me.t === null ? null : F(me.t))), humidity: nat('humidity', [], () => me.h) }; }
  }
  const mk = (kind) => klass(kind, (R, a) => { const p = picoPin(m, R, a[0]); m.setMode(p, 'in', null); return new MPDHT(p, kind); });
  return new Mod('dht', { DHT11: mk('DHT11'), DHT22: mk('DHT22') });
}
function dhtMods(m) {
  const pinOf = (R, v) => (v && v.board6 ? v.gpio : piPin(m, R, v));
  class DHT extends PyObj {
    constructor(p, kind) { super(kind); this.p = p; this.kind = kind; this.last = -1e12; this.t = null; this.h = null; this.n = 0; }
    measure(R) {
      m.sync(R); if (m.t - this.last < 2e6 && this.t !== null) return; this.last = m.t; m.t += 5000; m.readSet.add(this.p);
      const q = m.dhtPart(this.p); this.n++;
      if (!q) { m.back(R); throw R.err('RuntimeError', 'N6_DHT_NONE', { pin: this.p }); }
      if (this.n % 6 === 3) { m.back(R); throw R.err('RuntimeError', 'N6_DHT_CHECKSUM', {}); } // now and then a reading fails, as on a real DHT11
      const T = Math.round(q.state.tS * 10) / 10, H = clamp(Math.round(q.state.hS), 5, 95); q.state.reads = (q.state.reads || 0) + 1;
      if (this.kind === 'DHT22') { this.t = Math.round(Math.floor(T) * 256 + Math.round((T % 1) * 10)) / 10; this.h = (H * 256) / 10; m.noteOnce('dht22', 'N6_DHT22', { t: this.t, pin: this.p }); }
      else { this.t = T; this.h = H; }
      m.obs6.dht.push([this.t, this.h]); m.back(R);
    }
    props() { const me = this; return { temperature: (R) => { me.measure(R); return F(me.t); }, humidity: (R) => { me.measure(R); return me.kind === 'DHT22' ? F(me.h) : me.h; } }; }
    methods() { return { exit: nat('exit', [], () => null) }; }
  }
  const board = () => { const o = {}; for (let i = 0; i <= 27; i++) o['D' + i] = { pyType: 'Pin', board6: true, gpio: i, pyStr: () => 'D' + i, pyGet: (n) => (n === 'id' ? i : undefined) }; o.SDA = o.D2; o.SCL = o.D3; o.SCK = o.D11; o.MOSI = o.D10; o.MISO = o.D9; o.TX = o.D14; o.RX = o.D15; return new Mod('board', o); };
  const ada = () => new Mod('adafruit_dht', { DHT11: klass('DHT11', (R, a) => new DHT(pinOf(R, a[0]), 'DHT11')), DHT22: klass('DHT22', (R, a) => new DHT(pinOf(R, a[0]), 'DHT22')), DHT21: klass('DHT21', (R, a) => new DHT(pinOf(R, a[0]), 'DHT22')) });
  const old = () => new Mod('Adafruit_DHT', { DHT11: 11, DHT22: 22, AM2302: 22,
    read_retry: nat('read_retry', ['sensor', 'pin', 'retries=15', 'delay_seconds=2'], function* (R, s, p) { const d = new DHT(int(R, p), s === 22 ? 'DHT22' : 'DHT11'); for (let k = 0; k < 15; k++) { try { d.measure(R); return tup([F(d.h), F(d.t)]); } catch (e) { if (e.code !== 'N6_DHT_CHECKSUM') return tup([null, null]); yield* R.sleep(2000); } } return tup([null, null]); }, B),
    read: nat('read', ['sensor', 'pin'], (R, s, p) => { const d = new DHT(int(R, p), s === 22 ? 'DHT22' : 'DHT11'); try { d.measure(R); return tup([F(d.h), F(d.t)]); } catch (e) { return tup([null, null]); } }) });
  return { board, adafruit_dht: ada, Adafruit_DHT: old, DHT };
}
function piTime(m) {
  const now = (R) => START_EPOCH + R.t / 1e6;
  const fmt = (R, f, t) => { const d = new Date((isNone(t) ? now(R) : num(R, t)) * 1000 + 5.5 * 3600e3); const p2 = (x) => String(x).padStart(2, '0'); const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], mon = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return String(f).replace(/%([HMSdmyYAaBbpIj%])/g, (s, k) => ({ H: p2(d.getUTCHours()), M: p2(d.getUTCMinutes()), S: p2(d.getUTCSeconds()), d: p2(d.getUTCDate()), m: p2(d.getUTCMonth() + 1), y: p2(d.getUTCFullYear() % 100), Y: d.getUTCFullYear(), A: days[d.getUTCDay()], a: days[d.getUTCDay()].slice(0, 3), B: mon[d.getUTCMonth()], b: mon[d.getUTCMonth()].slice(0, 3), p: d.getUTCHours() < 12 ? 'AM' : 'PM', I: p2((d.getUTCHours() + 11) % 12 + 1), j: '323', '%': '%' }[k])); };
  return new Mod('time', {
    sleep: nat('sleep', ['seconds'], function* (R, s) { const v = num(R, s, 'sleep'); if (v < 0) throw R.err('ValueError', 'N6_SLEEP_NEG', {}); yield* R.sleep(v * 1000); return null; }, B),
    time: nat('time', [], (R) => F(now(R))), monotonic: nat('monotonic', [], (R) => F(R.t / 1e6)), perf_counter: nat('perf_counter', [], (R) => F(R.t / 1e6)), time_ns: nat('time_ns', [], (R) => Math.round(now(R) * 1e9)),
    strftime: nat('strftime', ['format', 't=None'], (R, f, t) => fmt(R, f, t)), ctime: nat('ctime', ['t=None'], (R, t) => fmt(R, '%a %b %d %H:%M:%S %Y', t)),
  });
}
function piHost(m) {
  const gz = () => gpiozero(m); const D = dhtMods(m);
  const signal = () => new Mod('signal', { pause: nat('pause', [], forever, B), SIGINT: 2, SIGTERM: 15, signal: nat('signal', ['sig', 'handler'], () => null) });
  const sys = () => new Mod('sys', { exit: nat('exit', ['code=0'], (R) => { throw R.err('SystemExit', 'P_RAISED', { type: 'SystemExit', msg: '' }); }), platform: 'linux', version: '3.11.2 (main, Nov 30 2024) [GCC 12.2.0]' });
  const wrong = (mod) => (R) => { throw R.err('ImportError', 'N6_MOD_PI', { mod }); };
  return {
    modules: { gpiozero: gz, time: () => piTime(m), signal, sys, 'RPi.GPIO': () => rpiGPIO(m), RPi: (R) => new Mod('RPi', { GPIO: R.imp('RPi.GPIO') }), board: D.board, adafruit_dht: D.adafruit_dht, Adafruit_DHT: D.Adafruit_DHT, machine: wrong('machine'), utime: wrong('utime'), microbit: wrong('microbit') },
    print: (s, R) => { m.serial(s, R.t); m.obs6.prints++; m.line6(s); },
    input: (prompt, R) => new R.P((function* () { // the terminal: what the student types in the box under it (Enter sends)
      m.serial(str(isNone(prompt) ? '' : prompt), R.t); const ser = m.ser;
      for (;;) { const k = ser.rx.indexOf(10); if (k >= 0) { const s = String.fromCharCode(...ser.rx.splice(0, k + 1)).replace(/\r?\n$/, ''); m.serial(s + '\n', R.t); m.ev('input'); return s; } yield* R.sleep(Math.max(0.001, (R.until - R.t) / 1000)); }
    })()),
    hint: (name, G) => hint6(name, G, true),
    names: () => ['LED', 'Button', 'PWMLED', 'Buzzer', 'MotionSensor', 'DistanceSensor', 'Servo', 'Motor', 'Robot', 'pause', 'sleep', 'GPIO'],
  };
}
// a name that comes from a module the program did not import
const FROM6 = {
  pico: { Pin: 'machine', PWM: 'machine', ADC: 'machine', Timer: 'machine', time_pulse_us: 'machine', sleep: 'time', sleep_ms: 'time', sleep_us: 'time', ticks_ms: 'time', ticks_diff: 'time', utime: '', time: '', machine: '' },
  pi: { LED: 'gpiozero', PWMLED: 'gpiozero', Button: 'gpiozero', Buzzer: 'gpiozero', MotionSensor: 'gpiozero', DistanceSensor: 'gpiozero', Servo: 'gpiozero', AngularServo: 'gpiozero', Motor: 'gpiozero', Robot: 'gpiozero', pause: 'signal', sleep: 'time', GPIO: 'RPi.GPIO', time: '', adafruit_dht: '', board: '', gpiozero: '' },
};
function hint6(name, G, pi) {
  const mod = (pi ? FROM6.pi : FROM6.pico)[name]; if (mod === undefined) return null;
  if (mod === '') return { code: 'N6_NAME_MOD', args: { name, mod: name, fix: 'import ' + name } };
  if (name === 'GPIO') return { code: 'N6_NAME_MOD', args: { name, mod, fix: 'import RPi.GPIO as GPIO' } };
  return { code: 'N6_NAME_MOD', args: { name, mod, fix: `from ${mod} import ${name}` } };
}

// ------------------------------------------------------------------ the bench: pull-downs, VSYS, clamp diodes, warnings, kind hints
const MAXMA = { pico: 12, pi4: 16 };
LAB_HOOKS.push({
  elements(lab, els, G) {
    const m = lab.mcu; lab.env.vlogic = m instanceof PyMCU ? 2.9 : undefined; if (!(m instanceof PyMCU)) return; const d = lab.def; // (an L298N's ENA at 3.3 V: full speed)
    if (d.id === 'pico') { if (lab.powered) els.push({ type: 'V', a: G('VIN'), b: 0, v: 4.7, r: 0.6, role: 'vsys' }); els.push({ type: 'R', a: G('AREF'), b: G('3V3'), r: 200 }); }
    for (const pin of d.pins) {
      const g = pin.gpio; if (g === undefined || !lab.used('N:G' + g)) continue; const n = G('G' + g);
      els.push({ type: 'D', a: n, b: G('3V3'), vf: 0.6, rs: 30, role: 'clamp', pin: g }, { type: 'D', a: 0, b: n, vf: 0.6, rs: 30, role: 'clampg', pin: g });
      const P = m.pins[g]; if (P && P.mode === 3 && (m.state === 'running' || m.state === 'done')) els.push({ type: 'R', a: n, b: 0, r: 50000, role: 'pulldown', pin: g });
      if (d.id === 'pi4' && (g === 2 || g === 3)) els.push({ type: 'R', a: n, b: G('3V3'), r: 1800, role: 'i2cpu', pin: g });
    }
  },
  dynamics(lab) {
    const m = lab.mcu; if (!(m instanceof PyMCU) || !lab.powered) return; const d = lab.def;
    const once = (k, msg2, args) => { const w = lab.warned4 || (lab.warned4 = new Set()); if (w.has(k)) return; w.add(k); lab.emit('warn', { msg: msg2, args }); };
    const V = lab.V; const vAt = (n) => (V && n < V.length ? V[n] : 0);
    for (const e of lab.els) {
      if (e.role === 'clamp' && (e.iAvg || 0) > 0.0004) once('5v' + e.pin + ':' + lab.version, W6.pin5v, { pin: m.pinName(e.pin), v: vAt(e.a).toFixed(1), b: d.short });
      if (e.role === 'pin' && Math.abs(e.iAvg || 0) > MAXMA[d.id] / 1000) once('ma' + e.pin + ':' + lab.version, W6.pinMA, { pin: m.pinName(e.pin), mA: Math.round(Math.abs(e.iAvg) * 1000), max: MAXMA[d.id], b: d.short });
    }
    if (lab.conn('B:' + (d.id === 'pico' ? 'VBUS' : '5V'), 'B:3V3')) once('533:' + lab.version, W6.v533, { b: d.short });
    // a pin in the code with no wire, while another pin has one the code never uses (once a run, after a moment)
    if (m.state === 'running' && m.t > 1.2e6 && m.wroteHigh && !m.warned.has('pins')) {
      const outs = [...m.wrote].filter((p) => p < 28 && p !== 25 && !lab.used('N:G' + p));
      const wired = d.pins.filter((q) => q.gpio !== undefined && lab.used('N:G' + q.gpio) && !m.wrote.has(q.gpio) && !m.readSet.has(q.gpio) && lab.parts.some((pt) => pt.N && Object.values(pt.N).includes(lab.boardNode('G' + q.gpio)))).map((q) => q.gpio);
      if (outs.length && wired.length) {
        const a = outs[0], b = wired[0]; m.warned.add('pins');
        if (d.id === 'pi4' && PHYS_OF[b] === a) m.note('N6_PHYS', { a, b });
        else if (d.id === 'pico' && BOARDS6.pico.pins.find((q) => q.gpio === b).phys === a) m.note('N6_PICO_PHYS', { a, b });
        else m.note('N6_PINS', { a: m.pinName(a), b: m.pinName(b) });
      }
    }
  },
});

// ------------------------------------------------------------------ words (English, Hindi, Hinglish)
export const W6 = {
  pin5v: t3('{v} V is reaching {pin}! {b} pins take at most 3.3 V: current is flowing into the chip and can damage it. Use 3.3 V, or a divider (1 kΩ + 2.2 kΩ) on a 5 V signal.', '{pin} पर {v} V आ रहा है! {b} के पिन ज़्यादा से ज़्यादा 3.3 V सहते हैं: करंट चिप के अंदर जा रहा है और उसे ख़राब कर सकता है। 3.3 V लीजिए, या 5 V वाले सिग्नल पर डिवाइडर (1 kΩ + 2.2 kΩ) लगाइए।', '{pin} par {v} V aa raha hai! {b} ke pins zyada se zyada 3.3 V sehte hain: current chip ke andar ja raha hai aur use kharab kar sakta hai. 3.3 V lijiye, ya 5 V wale signal par divider (1 kΩ + 2.2 kΩ) lagaiye.'),
  pinMA: t3('{pin} is giving {mA} mA: too much for a {b} pin (keep it under {max} mA). Put a 220–330 Ω resistor in series with the LED.', '{pin} से {mA} mA करंट निकल रहा है: {b} के पिन के लिए बहुत ज़्यादा ({max} mA से कम रखिए)। एलईडी के साथ 220–330 Ω का रेज़िस्टर लगाइए।', '{pin} se {mA} mA current nikal raha hai: {b} ke pin ke liye bahut zyada ({max} mA se kam rakhiye). LED ke saath 220–330 Ω ka resistor lagaiye.'),
  v533: t3('5 V is joined to 3.3 V: that pushes 5 V into the {b} and can burn it. Remove that wire.', '5 V, 3.3 V से जुड़ गया है: इससे {b} में 5 V जाता है और वह जल सकता है। वह वायर हटाइए।', '5 V, 3.3 V se jud gaya hai: isse {b} mein 5 V jaata hai aur woh jal sakta hai. Woh wire hataiye.'),
};
export const MSG6 = {
  N6_NAME_MOD: t3('NameError: "{name}" comes from the {mod} module: add "{fix}" at the top of the program.', 'NameError: "{name}", {mod} मॉड्यूल से आता है: प्रोग्राम में सबसे ऊपर "{fix}" लिखिए।', 'NameError: "{name}", {mod} module se aata hai: program mein sabse upar "{fix}" likhiye.'),
  N6_PIN_BAD: t3('ValueError: there is no pin {pin} on the Pico. Use GP0–GP22 or GP26–GP28, or "LED" for the green LED on the board.', 'ValueError: Pico पर पिन {pin} नहीं है। GP0–GP22 या GP26–GP28 लीजिए, या बोर्ड की हरी एलईडी के लिए "LED"।', 'ValueError: Pico par pin {pin} nahi hai. GP0–GP22 ya GP26–GP28 lijiye, ya board ki green LED ke liye "LED".'),
  N6_PIN_INSIDE: t3('ValueError: GP{pin} is used inside the Pico ({what}). Pick GP0–GP22 or GP26–GP28.', 'ValueError: GP{pin}, Pico के अंदर काम आता है ({what})। GP0–GP22 या GP26–GP28 चुनिए।', 'ValueError: GP{pin}, Pico ke andar kaam aata hai ({what}). GP0–GP22 ya GP26–GP28 chuniye.'),
  N6_ADC_PIN: t3('ValueError: ADC works on GP26, GP27 and GP28 only (and ADC(4), the temperature sensor inside). GP{pin} cannot measure voltages.', 'ValueError: ADC सिर्फ़ GP26, GP27 और GP28 पर चलता है (और ADC(4), अंदर का तापमान सेंसर)। GP{pin} वोल्टेज नहीं नाप सकता।', 'ValueError: ADC sirf GP26, GP27 aur GP28 par chalta hai (aur ADC(4), andar ka temperature sensor). GP{pin} voltage nahi naap sakta.'),
  N6_PWM_FREQ: t3('ValueError: freq({f}): the Pico\'s PWM runs from 8 Hz to 62.5 MHz. LEDs like 1000; a servo needs 50.', 'ValueError: freq({f}): Pico का PWM 8 Hz से 62.5 MHz तक चलता है। एलईडी के लिए 1000 ठीक है; सर्वो को 50 चाहिए।', 'ValueError: freq({f}): Pico ka PWM 8 Hz se 62.5 MHz tak chalta hai. LED ke liye 1000 theek hai; servo ko 50 chahiye.'),
  N6_DUTY: t3('ValueError: duty_u16({v}): use 0 (off) to 65535 (fully on).', 'ValueError: duty_u16({v}): 0 (बंद) से 65535 (पूरा चालू) तक लिखिए।', 'ValueError: duty_u16({v}): 0 (band) se 65535 (poora on) tak likhiye.'),
  N6_NOT_SIM: t3('NotImplementedError: {what} is not in this simulator yet.', 'NotImplementedError: {what} अभी इस सिम्युलेटर में नहीं है।', 'NotImplementedError: {what} abhi is simulator mein nahi hai.'),
  N6_MOD_PICO: t3('ImportError: {mod} is for the Raspberry Pi computer (Linux and Python 3). On the Pico use "from machine import Pin" and "import time".', 'ImportError: {mod}, Raspberry Pi कंप्यूटर (Linux और Python 3) के लिए है। Pico पर "from machine import Pin" और "import time" लिखिए।', 'ImportError: {mod}, Raspberry Pi computer (Linux aur Python 3) ke liye hai. Pico par "from machine import Pin" aur "import time" likhiye.'),
  N6_MOD_PI: t3('ImportError: {mod} is MicroPython, for boards like the Pico. On the Raspberry Pi 4 use gpiozero, like "from gpiozero import LED".', 'ImportError: {mod}, MicroPython है, Pico जैसे बोर्ड के लिए। Raspberry Pi 4 पर gpiozero लीजिए, जैसे "from gpiozero import LED"।', 'ImportError: {mod}, MicroPython hai, Pico jaise boards ke liye. Raspberry Pi 4 par gpiozero lijiye, jaise "from gpiozero import LED".'),
  N6_PI_PIN: t3('PinInvalidPin: there is no GPIO {pin} on a Raspberry Pi: it has GPIO 0 to 27. If {pin} is a physical pin number, write "BOARD{pin}".', 'PinInvalidPin: Raspberry Pi पर GPIO {pin} नहीं है: इसमें GPIO 0 से 27 होते हैं। अगर {pin} फ़िज़िकल पिन नंबर है, तो "BOARD{pin}" लिखिए।', 'PinInvalidPin: Raspberry Pi par GPIO {pin} nahi hai: ismein GPIO 0 se 27 hote hain. Agar {pin} physical pin number hai, to "BOARD{pin}" likhiye.'),
  N6_PI_POWER: t3('PinInvalidPin: physical pin {phys} is {what}, not a GPIO. Use a pin marked GPIO on the header.', 'PinInvalidPin: फ़िज़िकल पिन {phys}, {what} है, GPIO नहीं। हेडर पर GPIO लिखा कोई पिन लीजिए।', 'PinInvalidPin: physical pin {phys}, {what} hai, GPIO nahi. Header par GPIO likha koi pin lijiye.'),
  N6_IN_USE: t3('GPIOPinInUse: GPIO {pin} is already used by a {dev} in your program. One pin, one device: pick another pin.', 'GPIOPinInUse: GPIO {pin} आपके प्रोग्राम में पहले से एक {dev} के काम आ रहा है। एक पिन, एक डिवाइस: दूसरा पिन चुनिए।', 'GPIOPinInUse: GPIO {pin} aapke program mein pehle se ek {dev} ke kaam aa raha hai. Ek pin, ek device: doosra pin chuniye.'),
  N6_CLOSED: t3('GPIODeviceClosed: this {dev} was closed: make it again.', 'GPIODeviceClosed: यह {dev} बंद हो चुका है: इसे फिर से बनाइए।', 'GPIODeviceClosed: yeh {dev} band ho chuka hai: ise phir se banaiye.'),
  N6_DIST_ARGS: t3('TypeError: DistanceSensor needs two pins: DistanceSensor(echo=24, trigger=23). Echo comes first!', 'TypeError: DistanceSensor को दो पिन चाहिए: DistanceSensor(echo=24, trigger=23)। Echo पहले आता है!', 'TypeError: DistanceSensor ko do pin chahiye: DistanceSensor(echo=24, trigger=23). Echo pehle aata hai!'),
  N6_ROBOT_ARGS: t3('TypeError: Robot needs two motors: Robot(left=Motor(5, 6), right=Motor(20, 21)).', 'TypeError: Robot को दो मोटर चाहिए: Robot(left=Motor(5, 6), right=Motor(20, 21))।', 'TypeError: Robot ko do motor chahiye: Robot(left=Motor(5, 6), right=Motor(20, 21)).'),
  N6_SERVO_VAL: t3('OutputDeviceBadValue: a Servo\'s value goes from -1 to 1 (or None), not {v}.', 'OutputDeviceBadValue: Servo की value -1 से 1 तक (या None) होती है, {v} नहीं।', 'OutputDeviceBadValue: Servo ki value -1 se 1 tak (ya None) hoti hai, {v} nahi.'),
  N6_ANGLE: t3('ValueError: the angle {a} is outside {lo} … {hi}.', 'ValueError: कोण {a}, {lo} … {hi} से बाहर है।', 'ValueError: angle {a}, {lo} … {hi} se bahar hai.'),
  N6_PWM_VALUE: t3('OutputDeviceBadValue: a PWMLED\'s value goes from 0 (off) to 1 (full), not {v}.', 'OutputDeviceBadValue: PWMLED की value 0 (बंद) से 1 (पूरी) तक होती है, {v} नहीं।', 'OutputDeviceBadValue: PWMLED ki value 0 (band) se 1 (poori) tak hoti hai, {v} nahi.'),
  N6_MOTOR_SPEED: t3('ValueError: a motor\'s speed goes from 0 to 1 (0.5 is half speed), not {v}.', 'ValueError: मोटर की speed 0 से 1 तक होती है (0.5 यानी आधी), {v} नहीं।', 'ValueError: motor ki speed 0 se 1 tak hoti hai (0.5 matlab aadhi), {v} nahi.'),
  N6_SLEEP_NEG: t3('ValueError: sleep length must be non-negative.', 'ValueError: sleep का समय ऋणात्मक नहीं हो सकता।', 'ValueError: sleep ka time negative nahi ho sakta.'),
  N6_GPIO_MODE: t3('RuntimeError: Please set pin numbering mode using GPIO.setmode(GPIO.BOARD) or GPIO.setmode(GPIO.BCM)', 'RuntimeError: पहले पिन गिनने का तरीक़ा बताइए: GPIO.setmode(GPIO.BCM) या GPIO.setmode(GPIO.BOARD)', 'RuntimeError: Pehle pin ginne ka tareeka bataiye: GPIO.setmode(GPIO.BCM) ya GPIO.setmode(GPIO.BOARD)'),
  N6_GPIO_CH: t3('ValueError: The channel sent is invalid on a Raspberry Pi ({n} in {mode} numbering).', 'ValueError: Raspberry Pi पर यह चैनल नहीं है ({mode} गिनती में {n})।', 'ValueError: Raspberry Pi par yeh channel nahi hai ({mode} ginti mein {n}).'),
  N6_GPIO_OUT: t3('RuntimeError: The GPIO channel has not been set up as an OUTPUT: GPIO.setup(pin, GPIO.OUT) first.', 'RuntimeError: GPIO चैनल को OUTPUT नहीं बनाया गया: पहले GPIO.setup(pin, GPIO.OUT) लिखिए।', 'RuntimeError: GPIO channel ko OUTPUT nahi banaya gaya: pehle GPIO.setup(pin, GPIO.OUT) likhiye.'),
  N6_GPIO_IN: t3('RuntimeError: You must setup() the GPIO channel first.', 'RuntimeError: पहले GPIO चैनल को setup() कीजिए।', 'RuntimeError: Pehle GPIO channel ko setup() kijiye.'),
  N6_DC: t3('ValueError: dutycycle must have a value from 0.0 to 100.0 (you gave {v}).', 'ValueError: dutycycle 0.0 से 100.0 तक होता है (आपने {v} दिया)।', 'ValueError: dutycycle 0.0 se 100.0 tak hota hai (aapne {v} diya).'),
  N6_DHT_NONE: t3('RuntimeError: DHT sensor not found, check wiring. Its DATA (S) goes to GPIO {pin}, VCC to 3.3 V or 5 V, GND to GND.', 'RuntimeError: DHT sensor not found, check wiring। इसका DATA (S) GPIO {pin} पर, VCC 3.3 V या 5 V पर, GND, GND पर जाना चाहिए।', 'RuntimeError: DHT sensor not found, check wiring. Iska DATA (S) GPIO {pin} par, VCC 3.3 V ya 5 V par, GND, GND par jaana chahiye.'),
  N6_MPDHT_TIMEOUT: t3('OSError: [Errno 110] ETIMEDOUT (the DHT11 missed a reading, as it does now and then: catch it with try / except OSError and measure again in 2 s.)', 'OSError: [Errno 110] ETIMEDOUT (DHT11 ने कभी-कभी की तरह एक रीडिंग छोड़ दी: इसे try / except OSError से पकड़िए और 2 s बाद फिर measure कीजिए।)', 'OSError: [Errno 110] ETIMEDOUT (DHT11 ne kabhi-kabhi ki tarah ek reading chhod di: ise try / except OSError se pakadiye aur 2 s baad phir measure kijiye.)'),
  N6_MPDHT_NONE: t3('OSError: [Errno 110] ETIMEDOUT: no DHT answers on GP{pin}. Its DATA goes to GP{pin}, + to 3V3, − to GND.', 'OSError: [Errno 110] ETIMEDOUT: GP{pin} पर कोई DHT जवाब नहीं देता। इसका DATA GP{pin} पर, + 3V3 पर, − GND पर।', 'OSError: [Errno 110] ETIMEDOUT: GP{pin} par koi DHT jawaab nahi deta. Iska DATA GP{pin} par, + 3V3 par, − GND par.'),
  N6_DHT_CHECKSUM: t3('RuntimeError: Checksum did not validate. Try again. (DHT sensors miss a reading now and then: catch it with try / except RuntimeError and read again.)', 'RuntimeError: Checksum did not validate. Try again. (DHT सेंसर कभी-कभी रीडिंग छोड़ देता है: try / except RuntimeError से पकड़िए और फिर पढ़िए।)', 'RuntimeError: Checksum did not validate. Try again. (DHT sensor kabhi-kabhi reading chhod deta hai: try / except RuntimeError se pakdiye aur phir padhiye.)'),
  // notes (the program goes on)
  N6_FLOAT: t3('{pin} is an input with nothing joined to it: it reads 0 and 1 at random. Check its wire, or give it a pull-up (Pin.PULL_UP).', '{pin} एक इनपुट है जिससे कुछ नहीं जुड़ा: यह अपने-आप 0 और 1 पढ़ता है। इसका वायर जाँचिए, या pull-up (Pin.PULL_UP) दीजिए।', '{pin} ek input hai jisse kuch nahi juda: yeh apne-aap 0 aur 1 padhta hai. Iska wire check kijiye, ya pull-up (Pin.PULL_UP) dijiye.'),
  N6_AFLOAT: t3('{pin} measures a voltage, but nothing is joined to it: the numbers wander. Wire the knob\'s middle leg to it.', '{pin} वोल्टेज नापता है, पर उससे कुछ नहीं जुड़ा: संख्याएँ भटकती हैं। नॉब का बीच वाला पैर उससे जोड़िए।', '{pin} voltage naapta hai, par usse kuch nahi juda: numbers bhatakte hain. Knob ka beech wala pair usse jodiye.'),
  N6_PINS: t3('Your code switches {a}, but nothing is wired to it, while {b} has a wire that your code never uses. Did you mean {b}?', 'आपका कोड {a} को चालू-बंद करता है, पर उससे कुछ नहीं जुड़ा; और {b} पर वायर है जिसे कोड कभी इस्तेमाल नहीं करता। क्या आपका मतलब {b} था?', 'Aapka code {a} ko on-off karta hai, par usse kuch nahi juda; aur {b} par wire hai jise code kabhi use nahi karta. Kya aapka matlab {b} tha?'),
  N6_PHYS: t3('LED({a}) means GPIO {a}. Your wire is on physical pin {a}, which is GPIO {b}. gpiozero counts GPIO (BCM) numbers: write {b} (or "BOARD{a}").', 'LED({a}) का मतलब GPIO {a} है। आपका वायर फ़िज़िकल पिन {a} पर है, जो GPIO {b} है। gpiozero GPIO (BCM) नंबर गिनता है: {b} लिखिए (या "BOARD{a}")।', 'LED({a}) ka matlab GPIO {a} hai. Aapka wire physical pin {a} par hai, jo GPIO {b} hai. gpiozero GPIO (BCM) number ginta hai: {b} likhiye (ya "BOARD{a}").'),
  N6_PICO_PHYS: t3('Pin({a}) means GP{a}, not the {a}th leg. Your wire is on leg {a}, which is GP{b}: write Pin({b}).', 'Pin({a}) का मतलब GP{a} है, {a}वाँ पैर नहीं। आपका वायर पैर {a} पर है, जो GP{b} है: Pin({b}) लिखिए।', 'Pin({a}) ka matlab GP{a} hai, {a}va pair nahi. Aapka wire pair {a} par hai, jo GP{b} hai: Pin({b}) likhiye.'),
  N6_ENDED: t3('Your program reached its end, so Python closed gpiozero and everything switched off. To keep the buttons and LEDs working, add "from signal import pause" at the top and "pause()" at the end.', 'आपका प्रोग्राम आख़िर तक पहुँच गया, इसलिए Python ने gpiozero बंद कर दिया और सब बुझ गया। बटन और एलईडी चलते रहें, इसके लिए ऊपर "from signal import pause" और आख़िर में "pause()" लिखिए।', 'Aapka program aakhir tak pahunch gaya, isliye Python ne gpiozero band kar diya aur sab bujh gaya. Button aur LED chalte rahein, iske liye upar "from signal import pause" aur aakhir mein "pause()" likhiye.'),
  N6_ID: t3('GPIO 0 and 1 (pins 27 and 28) are for the memory chip of HAT boards: keep them free and pick another GPIO.', 'GPIO 0 और 1 (पिन 27 और 28) HAT बोर्ड की मेमोरी चिप के लिए हैं: इन्हें ख़ाली रखिए और दूसरा GPIO चुनिए।', 'GPIO 0 aur 1 (pin 27 aur 28) HAT boards ki memory chip ke liye hain: inhe khaali rakhiye aur doosra GPIO chuniye.'),
  N6_IN_WRITE: t3('{pin} is an input, so switching it on does nothing. Make it an output: Pin(…, Pin.OUT).', '{pin} इनपुट है, इसलिए इसे चालू करने से कुछ नहीं होता। इसे आउटपुट बनाइए: Pin(…, Pin.OUT)।', '{pin} input hai, isliye ise on karne se kuch nahi hota. Ise output banaiye: Pin(…, Pin.OUT).'),
  N6_DHT22: t3('{t} °C? The sensor on the bench is a blue DHT11, but the code reads it as a DHT22 (the white one). Use adafruit_dht.DHT11(board.D{pin}).', '{t} °C? बेंच पर नीला DHT11 है, पर कोड उसे DHT22 (सफ़ेद वाला) मानकर पढ़ता है। adafruit_dht.DHT11(board.D{pin}) लिखिए।', '{t} °C? Bench par blue DHT11 hai, par code use DHT22 (white wala) maan kar padhta hai. adafruit_dht.DHT11(board.D{pin}) likhiye.'),
  N6_ECHO: t3('No echo came back on {echo}. Check: VCC to 5 V, GND, Trig on {trig}, and Echo through the 1 kΩ / 2.2 kΩ divider to {echo}.', '{echo} पर कोई इको नहीं लौटी। जाँचिए: VCC 5 V पर, GND, Trig {trig} पर, और Echo 1 kΩ / 2.2 kΩ डिवाइडर से होकर {echo} पर।', '{echo} par koi echo nahi lauti. Check kijiye: VCC 5 V par, GND, Trig {trig} par, aur Echo 1 kΩ / 2.2 kΩ divider se hokar {echo} par.'),
  N6_SWAP: t3('DistanceSensor(echo=…, trigger=…): the first pin is Echo. Your sensor\'s Trig is on {echo}: swap the two numbers.', 'DistanceSensor(echo=…, trigger=…): पहला पिन Echo है। आपके सेंसर का Trig {echo} पर है: दोनों नंबर अदल-बदल दीजिए।', 'DistanceSensor(echo=…, trigger=…): pehla pin Echo hai. Aapke sensor ka Trig {echo} par hai: dono number badal dijiye.'),
};
Object.assign(CPP, MSG6);
export { suggest, Tup };
