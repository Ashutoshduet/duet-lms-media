// DUET Robotics Lab 360: the microcontroller (ATmega328P of the Uno / Nano) running a compiled sketch on a virtual clock.
// The sketch is a JavaScript generator (cpp.js). Each frame the lab calls run(ms): the sketch runs until the virtual clock
// has moved on by that much (x speed), so delay(1000) takes one real second and never freezes the page.
// Time in µs. Pins 0..13 digital, 14..19 = A0..A5 (Nano: 20, 21 = A6, A7, analog input only).
// The electrical side (what a pin reads, what a module sends back) comes from the circuit (sim.js) through `io`.

export class RtError extends Error { constructor(code, args, line) { super(code); this.code = code; this.args = args || {}; this.line = line; } }

// avr-libc random(): the same numbers as a real Arduino (seed 1 until randomSeed)
function avrRandom(ctx) {
  let x = ctx.s; if (x === 0) x = 123459876;
  const hi = Math.trunc(x / 127773), lo = x % 127773;
  x = 16807 * lo - 2836 * hi; if (x < 0) x += 0x7fffffff;
  ctx.s = x; return x % 0x80000000;
}
const fmtFloat = (v, d) => (Number.isNaN(v) ? 'nan' : !Number.isFinite(v) ? 'inf' : Math.abs(v) > 4294967040 ? 'ovf' : v.toFixed(Math.max(0, Math.min(10, d))));

export class MCU {
  constructor(board, io) {
    this.board = board; this.io = io || {};
    this.speed = 1; this.state = 'off'; // off | running | error | done
    this.budget = (typeof window !== 'undefined' && window.DuetPerf && window.DuetPerf.phone) ? 5 : 9; // ms of each frame the sketch may use
    this.prog = null; this.gen = null; this.err = null; this.warned = new Set();
    this.reset();
  }
  reset() {
    this.t = 0; this.until = 0; this.ops = 0; this.opMax = 400000; this.wallEnd = Infinity; this.wallOut = false; this.depth = 0; this.L = 0;
    this.pins = []; for (let i = 0; i < this.board.gpio; i++) this.pins.push({ mode: 0, level: 0, pwm: -1, tone: 0, toneEnd: 0, acc: 0, last: 0, writes: 0 });
    this.rnd = { s: 1 }; this.servos = []; this.adcMin = new Array(8).fill(1024); this.adcMax = new Array(8).fill(-1);
    this.ser = new SerialPort(this);
    this.frameT0 = 0; this.lineHits = new Map();
    this.gen = null; this.err = null;
    this.warned.clear(); this.notes = [];
  }
  load(compiled) { this.prog = compiled; }
  start() {
    this.reset();
    if (!this.prog) return;
    try { const p = this.prog.make(this); this.inst = p; this.gen = this.main(p); this.state = 'running'; }
    catch (e) { this.fail(e); }
  }
  stop() { this.gen = null; this.state = this.prog ? 'done' : 'off'; this.allLow(); }
  allLow() { for (const p of this.pins) { p.mode = 0; p.level = 0; p.pwm = -1; p.tone = 0; } this.servos = []; }
  *main(p) {
    yield* p.init();
    yield* p.setup();
    for (;;) { yield* p.loop(); if (this.k()) yield 0; }
  }
  fail(e) {
    this.state = 'error'; this.gen = null;
    if (e instanceof RtError) this.err = { code: e.code, args: e.args, line: e.line || this.L };
    else this.err = { code: 'R_INTERNAL', args: { msg: String((e && e.message) || e) }, line: this.L };
    if (this.io.onError) this.io.onError(this.err);
  }
  // run the sketch for `ms` of real time (x speed). Returns the virtual µs that passed.
  run(ms) {
    if (this.state !== 'running' || !this.gen) return 0;
    const t0 = this.t; this.frameT0 = t0;
    for (const p of this.pins) { p.acc = 0; p.last = t0; p.writes = 0; }
    this.until = this.t + Math.min(ms, 100) * 1000 * this.speed; this.ops = 0; this.wallOut = false;
    this.wallEnd = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + this.budget; // never more than a few ms of the frame
    try {
      while (true) {
        const r = this.gen.next();
        if (r.done) { this.state = 'done'; break; }
        if (this.t >= this.until || this.ops >= this.opMax || this.wallOut) break;
      }
    } catch (e) { this.fail(e); }
    this.slow = this.t < this.until && this.state === 'running' && (this.ops >= this.opMax || this.wallOut);
    if (this.t > this.until) this.until = this.t;
    this.ser.flushTo(this.t);
    for (const s of this.servos) s.tick(this.t);
    return this.t - t0;
  }
  // how long each pin was HIGH during the last run() (0..1), for LEDs that are switched faster than the eye can see
  duty(i) {
    const p = this.pins[i], span = this.t - this.frameT0;
    if (span <= 0) return p.level;
    return Math.max(0, Math.min(1, (p.acc + (this.t - p.last) * p.level) / span));
  }
  // ------------------------------------------------------------ used by the compiled sketch
  k() {
    this.t += 0.25;
    if ((++this.ops & 2047) === 0 && (typeof performance !== 'undefined' ? performance.now() : Date.now()) > this.wallEnd) this.wallOut = true;
    return this.t >= this.until || this.ops >= this.opMax || this.wallOut;
  }
  enter(line) { if (++this.depth > 60) throw new RtError('R_STACK', {}, line); return this.k(); }
  idiv(a, b) { if (b === 0) throw new RtError('R_DIV0', {}, this.L); return Math.trunc(a / b); }
  imod(a, b) { if (b === 0) throw new RtError('R_DIV0', {}, this.L); return a % b; }
  ix(arr, i, name) { if (!(i >= 0 && i < arr.length)) throw new RtError('R_INDEX', { name, i, n: arr.length }, this.L); return i; }
  pin(p, fn) {
    if (!(p >= 0 && p < this.board.gpio) || p !== Math.floor(p)) throw new RtError('R_PIN', { pin: p, fn, board: this.board.short }, this.L);
    if ((p === 0 || p === 1) && this.ser.on && !this.warned.has('serialpin')) { this.warned.add('serialpin'); this.note('N_SERIAL_PIN', { pin: p }); }
    return this.pins[p];
  }
  note(code, args) { this.notes.push({ code, args: args || {}, line: this.L }); if (this.io.onNote) this.io.onNote({ code, args: args || {}, line: this.L }); }
  setLevel(i, v) {
    const p = this.pins[i]; if (p.level === v) return;
    p.acc += (this.t - p.last) * p.level; p.last = this.t; p.level = v; p.writes++;
  }
  pinMode(p, m) {
    const P = this.pin(p, 'pinMode'); this.t += 2.5;
    if (this.board.analogOnly && this.board.analogOnly.includes(p)) throw new RtError('R_ANALOG_ONLY', { pin: p }, this.L);
    P.mode = m === 1 ? 1 : m === 2 ? 2 : 0;
    if (P.mode !== 1) { P.pwm = -1; this.setLevel(p, m === 2 ? 1 : 0); } // INPUT turns the pull-up off; INPUT_PULLUP on
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  dw(p, v) {
    const P = this.pin(p, 'digitalWrite'); this.t += 3.6;
    if (this.board.analogOnly && this.board.analogOnly.includes(p)) throw new RtError('R_ANALOG_ONLY', { pin: p }, this.L);
    P.pwm = -1; if (P.tone) P.tone = 0;
    const lv = v ? 1 : 0;
    if (P.mode !== 1 && !this.warned.has('nomode' + p)) { this.warned.add('nomode' + p); this.note('N_NO_PINMODE', { pin: p }); }
    this.setLevel(p, lv);
    if (this.io.onWrite) this.io.onWrite(p, lv, this.t);
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  dr(p) {
    const P = this.pin(p, 'digitalRead'); this.t += 3.8;
    if (P.mode === 1 && P.pwm < 0) return P.level;
    const v = this.io.read ? this.io.read(p, this.t) : NaN;
    if (Number.isNaN(v)) { if (!this.warned.has('float' + p)) { this.warned.add('float' + p); this.note('N_FLOATING', { pin: p }); } return this.hum(p) > 2.5 ? 1 : 0; }
    if (v >= 3.0) return 1; if (v <= 1.5) return 0;
    return this.hum(p) > v ? 0 : 1; // in between: it is not sure
  }
  // a pin that is connected to nothing picks up the 50 Hz hum of the room's wiring: it reads HIGH, LOW, HIGH… by itself
  hum(p) { const s = this.t / 1e6; return 2.5 + 2.3 * Math.sin(2 * Math.PI * 50 * s + p * 1.7) + 0.6 * Math.sin(s * 3.1 + p) + (Math.random() - 0.5) * 0.4; }
  ar(p) {
    let ch = p >= 14 ? p - 14 : p;
    if (!(ch >= 0 && ch < this.board.adc)) throw new RtError('R_ANALOG', { pin: p, board: this.board.short }, this.L);
    this.t += 112;
    const v = this.io.read ? this.io.read(14 + ch, this.t, true) : NaN;
    if (Number.isNaN(v)) return Math.max(0, Math.min(1023, Math.round(this.hum(14 + ch) / 5 * 1023 * 0.7 + 150)));
    const vr = this.io.vref ? this.io.vref() : 5;
    const n = Math.max(0, Math.min(1023, Math.round(v / vr * 1023 + (Math.random() - 0.5) * 1.6)));
    if (n < this.adcMin[ch]) this.adcMin[ch] = n; if (n > this.adcMax[ch]) this.adcMax[ch] = n;
    return n;
  }
  aw(p, v) {
    const P = this.pin(p, 'analogWrite'); this.t += 5;
    v = Math.max(0, Math.min(255, Math.round(v)));
    if (P.mode !== 1 && !this.warned.has('nomode' + p)) { this.warned.add('nomode' + p); this.note('N_NO_PINMODE', { pin: p }); }
    P.mode = 1; P.tone = 0;
    if (!this.board.pwm.includes(p)) { // no ~ on this pin: the Arduino only turns it fully on or off
      if (!this.warned.has('nopwm' + p)) { this.warned.add('nopwm' + p); this.note('N_NO_PWM', { pin: p, pwm: this.board.pwm.join(', ') }); }
      P.pwm = -1; this.setLevel(p, v < 128 ? 0 : 1);
    } else if (v === 0 || v === 255) { P.pwm = -1; this.setLevel(p, v ? 1 : 0); }
    else { P.pwm = v; this.setLevel(p, v / 255); }
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  tone(p, f, d) {
    const P = this.pin(p, 'tone'); this.t += 6;
    const busy = this.pins.findIndex((x, i) => i !== p && x.tone && (!x.toneEnd || x.toneEnd > this.t));
    if (busy >= 0) { if (!this.warned.has('tone2')) { this.warned.add('tone2'); this.note('N_TONE_BUSY', { pin: p, other: busy }); } return; }
    if (!(f >= 31)) { P.tone = 0; return; }
    P.mode = 1; P.pwm = -1; P.tone = Math.min(65535, f); P.toneEnd = d ? this.t + d * 1000 : 0; this.setLevel(p, 0.5);
    if (this.io.onPin) this.io.onPin(p, this.t);
  }
  noTone(p) { const P = this.pin(p, 'noTone'); P.tone = 0; this.setLevel(p, 0); this.t += 3; if (this.io.onPin) this.io.onPin(p, this.t); }
  toneOf(i) { const P = this.pins[i]; if (!P.tone) return 0; if (P.toneEnd && this.t >= P.toneEnd) { P.tone = 0; this.setLevel(i, 0); return 0; } return P.tone; }
  millis() { return Math.floor(this.t / 1000) >>> 0; }
  micros() { return (Math.floor(this.t / 4) * 4) >>> 0; }
  *delay(ms) {
    ms = Number(ms) >>> 0; // delay(-1) waits 49 days, as on a real Arduino
    const end = this.t + ms * 1000 + 1;
    if (this.io.onDelay) this.io.onDelay(this.L);
    while (this.t < end) {
      if (end <= this.until) { this.t = end; break; }
      this.t = this.until; yield 0;
    }
  }
  *delayUs(us) { us = Number(us) & 65535; const end = this.t + Math.max(0, us - 1) + 1; while (this.t < end) { if (end <= this.until) { this.t = end; break; } this.t = this.until; yield 0; } }
  // pulseIn(pin, HIGH): waits for the pin to go HIGH and measures how long it stays HIGH (µs); 0 when nothing comes in time
  *pulseIn(p, level, timeout) {
    this.pin(p, 'pulseIn'); timeout = timeout === undefined ? 1000000 : Number(timeout) >>> 0;
    const pulse = this.io.pulse ? this.io.pulse(p, level ? 1 : 0, this.t, timeout) : null;
    const end = pulse ? pulse.end : this.t + timeout;
    while (this.t < end) { if (end <= this.until) { this.t = end; break; } this.t = this.until; yield 0; }
    return pulse ? Math.max(0, Math.round(pulse.end - pulse.start)) >>> 0 : 0;
  }
  map(x, a, b, c, d) { if (b === a) throw new RtError('R_DIV0', {}, this.L); return Math.trunc((x - a) * (d - c) / (b - a)) + c | 0; }
  constrain(x, a, b) { return x < a ? a : x > b ? b : x; }
  random(a, b) {
    if (b === undefined) { if (!a) return 0; return avrRandom(this.rnd) % Math.trunc(a); }
    if (a >= b) return a; return (avrRandom(this.rnd) % Math.trunc(b - a)) + Math.trunc(a);
  }
  randomSeed(s) { if (s) this.rnd.s = s >>> 0; }
  shiftOut(dp, cp, order, val) { for (let i = 0; i < 8; i++) { const b = order ? (val >> (7 - i)) & 1 : (val >> i) & 1; this.dw(dp, b); this.dw(cp, 1); this.dw(cp, 0); } }
  servo() { const s = new ServoObj(this); this.servos.push(s); return s; }
  // Strings and printing, as the Arduino does it
  S(v, t, d) {
    if (t === 'str') return String(v);
    if (t === 'float') return fmtFloat(v, d === undefined ? 2 : d);
    if (t === 'char') return String.fromCharCode(v & 255);
    if (d !== undefined && d !== 10) return ((v >>> 0).toString(d)).toUpperCase();
    return String(v);
  }
  fmt(v, t, f) {
    if (t === 'str') return String(v);
    if (t === 'float') return fmtFloat(v, f === undefined ? 2 : f);
    if (t === 'char' && f === undefined) return String.fromCharCode(v & 255);
    if (t === 'arr') return '0x' + (0x100 + Math.floor(Math.random() * 0x700)).toString(16).toUpperCase(); // an address, as C prints a pointer
    if (f !== undefined && f !== 10) return ((t === 'int' || t === 'char') && v < 0 ? (v >>> 0) : v >>> 0).toString(f).toUpperCase();
    return String(v);
  }
  toInt(s) { const m = /^\s*[-+]?\d+/.exec(s); return m ? parseInt(m[0], 10) | 0 : 0; }
  toFloat(s) { const v = parseFloat(s); return Number.isFinite(v) ? v : 0; }
  charAt(s, i) { return i >= 0 && i < s.length ? s.charCodeAt(i) : 0; }
}

// Serial: 64-byte send buffer at the chosen baud rate, as on the Uno. A sketch that prints a lot waits for the buffer.
class SerialPort {
  constructor(m) { this.m = m; this.on = false; this.baud = 9600; this.busyUntil = 0; this.queue = []; this.outq = []; this.rx = []; this.timeout = 1000000; this.bytesSent = 0; this.lastTx = -1e9; }
  begin(b) { this.on = true; this.baud = Number(b) || 9600; this.m.t += 20; }
  end() { this.on = false; }
  byteUs() { return 10 / this.baud * 1e6; }
  *out(s) {
    const m = this.m; m.t += 1.5;
    if (!this.on) { if (!m.warned.has('nobegin')) { m.warned.add('nobegin'); m.note('N_NO_BEGIN', {}); } return; }
    const bt = this.byteUs();
    for (let i = 0; i < s.length; i++) {
      // the buffer holds 64 bytes; when it is full the sketch waits for one to go out
      while ((this.busyUntil - m.t) / bt >= 63) {
        const free = this.busyUntil - 62 * bt;
        if (free <= m.until) { m.t = free; break; }
        m.t = m.until; yield 0;
      }
      this.busyUntil = Math.max(this.busyUntil, m.t) + bt;
      this.queue.push([this.busyUntil, s.charCodeAt(i) & 255]); m.t += 0.6;
    }
  }
  *flush() { const m = this.m; while (m.t < this.busyUntil) { if (this.busyUntil <= m.until) { m.t = this.busyUntil; break; } m.t = m.until; yield 0; } }
  flushTo(t) { // bytes that have gone out by now reach the Serial Monitor
    let n = 0; while (n < this.queue.length && this.queue[n][0] <= t) n++;
    if (n) { const chunk = this.queue.splice(0, n); this.outq.push({ baud: this.baud, bytes: chunk.map((x) => x[1]) }); this.bytesSent += n; this.lastTx = t; }
  }
  take() { const o = this.outq; this.outq = []; return o; }
  // from the Serial Monitor
  send(text) { for (const c of String(text)) this.rx.push(c.charCodeAt(0) & 255); }
  available() { this.m.t += 1; return this.rx.length; }
  read() { this.m.t += 1; return this.rx.length ? this.rx.shift() : -1; }
  peek() { return this.rx.length ? this.rx[0] : -1; }
  setTimeout(ms) { this.timeout = (Number(ms) >>> 0) * 1000; }
  *waitByte() { const m = this.m, end = m.t + this.timeout; while (!this.rx.length && m.t < end) { if (end <= m.until) { m.t = end; break; } m.t = m.until; yield 0; } }
  *parseNum(float) {
    let s = '';
    for (;;) { // skip to the first digit or sign
      if (!this.rx.length) { yield* this.waitByte(); if (!this.rx.length) return 0; }
      const c = String.fromCharCode(this.rx[0]); if (/[-0-9.]/.test(c) && (float || c !== '.')) break; this.rx.shift();
    }
    for (;;) {
      if (!this.rx.length) { yield* this.waitByte(); if (!this.rx.length) break; }
      const c = String.fromCharCode(this.rx[0]); if (!(/[0-9]/.test(c) || (c === '-' && !s) || (float && c === '.' && !s.includes('.')))) break; s += c; this.rx.shift();
    }
    return float ? parseFloat(s) || 0 : parseInt(s, 10) | 0;
  }
  *parseInt() { return yield* this.parseNum(false); }
  *parseFloat() { return yield* this.parseNum(true); }
  *readString() { let s = ''; for (;;) { if (!this.rx.length) { yield* this.waitByte(); if (!this.rx.length) break; } s += String.fromCharCode(this.rx.shift()); } return s; }
  *readStringUntil(ch) { let s = ''; for (;;) { if (!this.rx.length) { yield* this.waitByte(); if (!this.rx.length) break; } const c = this.rx.shift(); if (c === (ch & 255)) break; s += String.fromCharCode(c); } return s; }
}

// The Servo library: pulses of 544–2400 µs every 20 ms on its pin
class ServoObj {
  constructor(m) { this.m = m; this.pin = -1; this.us = 1500; this.wrote = false; }
  attach(p, mn, mx) { this.m.pin(p, 'attach'); this.pin = p; this.min = mn || 544; this.max = mx || 2400; const P = this.m.pins[p]; P.mode = 1; P.pwm = -1; P.servo = this; this.m.t += 10; if (this.m.io.onPin) this.m.io.onPin(p, this.m.t); return 1; }
  detach() { if (this.pin >= 0) { const P = this.m.pins[this.pin]; if (P.servo === this) P.servo = null; } this.pin = -1; }
  write(a) {
    a = Number(a);
    if (a >= 544) { this.writeMicroseconds(a); return; }
    a = Math.max(0, Math.min(180, Math.round(a)));
    const mn = this.min || 544, mx = this.max || 2400;
    this.us = mn + (mx - mn) * a / 180; this.wrote = true; this.m.t += 4;
  }
  writeMicroseconds(us) { this.us = Math.max(this.min || 544, Math.min(this.max || 2400, Number(us) || 1500)); this.wrote = true; this.m.t += 4; }
  read() { const mn = this.min || 544, mx = this.max || 2400; return Math.round((this.us - mn) * 180 / (mx - mn)); }
  attached() { return this.pin >= 0 ? 1 : 0; }
  angle() { return (this.us - 544) * 180 / (2400 - 544); } // where a standard servo turns to for this pulse
  tick() { /* pulses are continuous; the servo part reads angle() */ }
}
