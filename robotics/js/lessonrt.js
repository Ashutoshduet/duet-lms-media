// DUET Robotics Lab 360: runs a lesson. Sets up its bench, follows the steps (a step is done only when the student has
// really done it on the bench or in the code), gives the circuit checks, and decides when the lesson is complete.
// S (this object) is what the lessons ask: conn(a, b), has(tag), toggles('led1'), servoRange('sv1'), …
import { PARTS, pinsOf } from './parts.js';
import { holeAt, BB, stripOf } from './boards.js';
import { LESSONS, BY_ID, LESSON_WORDS as W } from './lessons.js';

export class LessonRT {
  constructor(app) { this.app = app; this.lab = app.lab; this.lesson = null; this.i = 0; this.reset(); }
  reset() {
    this.flags = new Set(); this.taps = new Set(); this.servoAll = {}; this.nums = []; this.lines = 0; this.piano = new Set(); this.rgb = {}; this.recent = {};
    this.checkOk = false; this.runSrc = null; this.doneSteps = new Set(); this.complete = false; this.t = 0;
    this.mem = {}; this.memRun = {}; this.serLines = []; // batch 7: what a lesson's tick() saw (all runs / this run), the Serial Monitor's last lines
  }
  get step() { return this.lesson ? this.lesson.steps[this.i] : null; }
  // ------------------------------------------------------------ open a lesson: its parts and wires go on the bench
  open(id) {
    const L = BY_ID[id]; if (!L) return;
    this.lesson = L; this.i = 0; this.reset();
    const lab = this.lab; lab.stop(); lab.clear(); lab.env.light = 0.75; lab.env.temp = 26;
    lab.setBoard(L.board || 'uno'); // batch 4: the lesson's board (Nano, Mega, ESP32; the old lessons: the Uno)
    for (const p of L.setup.parts || []) lab.addPart(p.type, p.props, p.at, p.rot, p.tag);
    for (const [a, b] of L.setup.wires || []) lab.addWire(this.ep(a), this.ep(b));
    this.lab.repair();
  }
  // a name in a lesson -> a lab endpoint ('D13' -> 'B:D13', 'T:sv1:GND' -> 'T:p12:GND', 'H:a22' stays)
  ep(x) {
    if (x.startsWith('T:')) { const [, tag, pin] = x.split(':'); const p = this.lab.byTag(tag); return p ? 'T:' + p.uid + ':' + pin : x; }
    if (/^[BH]:/.test(x)) return x;
    if (this.lab.def.pins.some((p) => p.id === x)) return 'B:' + x;
    return x;
  }
  // a new part from the drawer takes the tag of the lesson step that asks for it (the current one first)
  tagFor(part) {
    if (!this.lesson) return null;
    const order = [...this.lesson.steps.slice(this.i), ...this.lesson.steps.slice(0, this.i)];
    for (const s of order) {
      if (s.k !== 'place') continue; const q = s.place;
      if (q.type !== part.type || this.lab.byTag(q.tag)) continue;
      if (q.type === 'led' && q.props.color && q.props.color !== part.props.color) continue;
      return q.tag;
    }
    return null;
  }
  // the props a new part gets in this lesson (the resistor value or LED colour the step asks for)
  propsFor(type) {
    if (!this.lesson) return null;
    for (const s of [this.step, ...this.lesson.steps]) if (s && s.k === 'place' && s.place.type === type && !this.lab.byTag(s.place.tag)) return Object.assign({}, s.place.props);
    return null;
  }
  // ------------------------------------------------------------ steps
  stepDone(s) {
    if (!s) return false;
    switch (s.k) {
      case 'info': return true;
      case 'tap': return this.taps.has(s.region);
      case 'place': { const p = this.lab.byTag(s.place.tag); if (!p) return false; if ((p.type === 'led' || p.type === 'rgb') && this.sameStrip(s.place.tag + '.A', s.place.tag + '.K')) return false; return true; }
      case 'wire': return this.conn(s.wire[0], s.wire[1]);
      case 'check': return this.checkOk && !this.runCheck();
      case 'run': return this.running() && this.runSrc !== null;
      case 'edit': return s.test(this.app.code()) && this.runSrc === this.app.code() && this.running();
      case 'act': case 'watch': try { return !!s.until(this); } catch (e) { return false; }
    }
    return false;
  }
  // called every frame: what has happened on the bench, and whether the step (and the lesson) is done now
  update(dt) {
    if (!this.lesson) return;
    this.t += dt; const lab = this.lab;
    // observations the lessons ask about
    const pressed = lab.parts.some((p) => p.type === 'button' && p.state.pressed);
    const led1 = lab.byTag('led1'); const lit = led1 && (led1.state.b || 0) > 0.18, dark = led1 && (led1.state.b || 0) < 0.08;
    if (pressed && lit) this.flags.add('pressLit');
    if (this.flags.has('pressLit') && !pressed && dark) this.flags.add('releaseDark');
    if (lab.env.light < 0.35 && lit) this.flags.add('darkLit');
    if (this.flags.has('darkLit') && lab.env.light > 0.6 && dark && this.since('dark', dark) > 0.4) this.flags.add('brightDark');
    const ir = lab.parts.find((p) => p.type === 'ir');
    if (ir && ir.state.near && lit && lab.sounds.some((s) => s.kind === 'tone')) this.flags.add('irAlarm');
    if (ir && this.flags.has('irAlarm') && !ir.state.near && dark && this.since('irq', !ir.state.near && dark) > 1.0) this.flags.add('irQuiet');
    if (pressed) for (const s of lab.sounds) if (s.kind === 'tone') this.piano.add(Math.round(s.f));
    for (const p of lab.parts) if (p.type === 'rgb' && p.state.ch) {
      const r = this.rgb[p.uid] || (this.rgb[p.uid] = { R: 0, G: 0, B: 0, mix: false }); const ch = p.state.ch;
      let on = 0; for (const k of ['R', 'G', 'B']) { r[k] = Math.max(r[k], ch[k] || 0); if ((ch[k] || 0) > 0.002) on++; } if (on >= 2) r.mix = true;
    }
    for (const p of lab.parts) if (PARTS[p.type].servo) { const o = lab.obs.servo[p.uid]; if (o && o.n) { const a = this.servoAll[p.uid] || (this.servoAll[p.uid] = { min: 999, max: -999 }); a.min = Math.min(a.min, o.min); a.max = Math.max(a.max, o.max); } }
    for (const p of lab.parts) if (p.type === 'led') { const R = this.recent[p.uid] || (this.recent[p.uid] = []); R.push([this.t, p.state.i || 0]); while (R.length && R[0][0] < this.t - 2.5) R.shift(); }
    if (this.lesson.tick) { try { this.lesson.tick(this, dt); } catch (e) { /* (batch 7) a lesson's watcher never stops the app */ } }
    // step and lesson
    const s = this.step;
    const was = this.doneSteps.has(this.i);
    if (s && this.stepDone(s)) { if (!was) { this.doneSteps.add(this.i); this.app.onStepDone(this.i, s); } }
    if (!this.complete && this.lesson.done && this.i === this.lesson.steps.length - 1 && this.doneSteps.has(this.i)) {
      let ok = false; try { ok = !!this.lesson.done(this); } catch (e) { ok = false; }
      if (ok) { this.complete = true; this.app.onLessonComplete(this.lesson); }
    }
  }
  since(k, cond) { const key = '_s' + k; if (!cond) { this[key] = null; return 0; } if (this[key] == null) this[key] = this.t; return this.t - this[key]; }
  go(i) { if (!this.lesson) return; this.i = Math.max(0, Math.min(this.lesson.steps.length - 1, i)); }
  // ------------------------------------------------------------ "Check my circuit"
  runCheck() { // -> null when right, else [message, args]
    const L = this.lesson; if (!L || !L.check) return null;
    for (const c of L.check) { const r = c(this); if (r) return r; }
    return null;
  }
  onSerialLine(line) {
    this.lines++; this.serLines.push(String(line)); if (this.serLines.length > 80) this.serLines.shift(); // (batch 7)
    const m = String(line).match(/-?\d+(?:\.\d+)?/g); if (m) { this.nums.push(+m[m.length - 1]); if (this.nums.length > 400) this.nums.shift(); }
  }
  onRun(src) { if (this.app.world) this.app.world.onRun(); this.runSrc = src; this.lines = 0; this.nums = []; this.piano = new Set(); for (const k of ['pressLit', 'releaseDark', 'darkLit', 'brightDark', 'irAlarm', 'irQuiet']) this.flags.delete(k); this.rgb = {}; this.freshAt = this.t; this.memRun = {}; this.serLines = []; }

  // ------------------------------------------------------------ S: what the lessons ask
  conn(a, b) { return this.lab.conn(this.k(a), this.k(b)); }
  k(x) { if (x === 'GND') return 'GND'; if (x === '5V') return 'B:5V'; return x; }
  has(tag) { return !!this.lab.byTag(tag); }
  part(tag) { return this.lab.byTag(tag); }
  connAny(tag, x) { const p = this.part(tag); if (!p) return false; return PARTS[p.type].pins.some((q) => this.conn(tag + '.' + q.id, x)); }
  sameStrip(a, b) {
    const ka = this.lab.key(a), kb = this.lab.key(b); if (!ka || !kb || !ka.startsWith('H:') || !kb.startsWith('H:')) return false;
    return holeAt(ka.slice(2)).strip === holeAt(kb.slice(2)).strip;
  }
  // from -> part -> part -> to, in series, in any order (a part given as [tag] may go either way round)
  chain(from, items, to) {
    const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
    for (const order of perms(items)) {
      const opts = order.map((it) => { const p = this.part(it[0]); if (!p) return null; if (it.length === 3) return [[it[1], it[2]]]; const ids = PARTS[p.type].pins.map((q) => q.id); return [[ids[0], ids[1]], [ids[1], ids[0]]]; });
      if (opts.includes(null)) return false;
      const tryAt = (k, prev) => {
        if (k === order.length) return this.conn(prev, to);
        for (const [i, o] of opts[k]) { const tag = order[k][0]; if (this.conn(prev, tag + '.' + i) && tryAt(k + 1, tag + '.' + o)) return true; }
        return false;
      };
      if (tryAt(0, from)) return true;
    }
    return false;
  }
  running() { return this.lab.mcu.state === 'running' && this.lab.powered; }
  board() { return this.lab.def.id; } // batch 4: which board is on the bench
  fresh() { return this.runSrc !== null; }
  id(tag) { if (tag === 'L') return 'L'; const p = this.part(tag); return p ? p.uid : null; }
  ob(tag) { const id = this.id(tag); return id ? this.lab.obs.leds[id] : null; }
  toggles(tag) { const o = this.ob(tag); return o ? o.toggles : 0; }
  period(tag) { const o = this.ob(tag); if (!o || o.periods.length < 3) return 9; const p = o.periods.slice(1); return p.reduce((a, b) => a + b, 0) / p.length; }
  levels(tag) { const o = this.ob(tag); return o ? [...o.levels].filter((x) => x >= 1 && x <= 5).length : 0; }
  ledLit(tag) { const p = this.part(tag); return !!p && (p.state.b || 0) > 0.18; }
  ledMax(tag, recent) { const p = this.part(tag); if (!p) return 0; if (recent) { const R = this.recent[p.uid] || []; return R.reduce((m, x) => Math.max(m, x[1]), 0); } const o = this.ob(tag); return o ? o.maxI : 0; }
  adcMin(ch) { return this.lab.mcu.adcMin[ch]; }
  adcMax(ch) { return this.lab.mcu.adcMax[ch]; }
  lineCount() { return this.lines; }
  flag(n) { return this.flags.has(n); }
  tapped(r) { return this.taps.has(r); }
  pianoNotes() { return this.piano.size; }
  rgbSeen(tag, ch) { const p = this.part(tag); const r = p && this.rgb[p.uid]; return !!r && r[ch] > 0.003; }
  rgbMix(tag) { const p = this.part(tag); const r = p && this.rgb[p.uid]; return !!r && r.mix; }
  servo(tag) { const p = this.part(tag); return p ? this.servoAll[p.uid] : null; } // over the whole lesson (every run)
  servoRange(tag) { const o = this.servo(tag); return o ? o.max - o.min : 0; }
  servoMin(tag) { const o = this.servo(tag); return o ? o.min : 999; }
  servoMax(tag) { const o = this.servo(tag); return o ? o.max : -999; }
  motorLevels(tag) { const p = this.part(tag); const o = p && this.lab.obs.motor[p.uid]; return o ? o.levels.size : 0; }
  motorMax(tag) { const p = this.part(tag); const o = p && this.lab.obs.motor[p.uid]; return o ? o.max : 0; }
  distSeen(tag, lo, hi) { return this.nums.some((v) => v >= lo && v <= hi); }
  tempSeen(lo, hi = 999) { return this.nums.some((v) => v >= lo && v <= hi); }
  tonesHeard() { return this.lab.obs.tones.size; }
  // the robot next to the bench (worlds.js): its flags ('touched', 'lap', 'bump', …) and values
  w(flag) { const W = this.app.world; return !!(W && W.flag(flag)); }
  wv(name) { const W = this.app.world; return W ? W.val(name) : undefined; }

  // ------------------------------------------------------------ the ghost for the current step
  ghosts() {
    const s = this.step; if (!s) return [];
    if (s.k === 'place' && !this.stepDone(s)) return [{ type: s.place.type, props: s.place.props, rot: s.place.rot, at: s.place.at }];
    if (s.k === 'wire' && !this.stepDone(s)) { const w = this.ghostWire(s.wire); return w ? [{ wire: w }] : []; }
    return [];
  }
  // two free endpoints that would make this connection (the student may use any other hole of the same strip)
  ghostWire([a, b]) {
    const A = this.pick(a, null), B = this.pick(b, A); const A2 = this.pick(a, B);
    return A2 && B ? [A2, B] : null;
  }
  pick(x, near) {
    const lab = this.lab;
    const nearPos = near ? lab.epPos(near) : null;
    const best = (cands) => {
      let out = null, bd = Infinity;
      for (const ep of cands) { if (!lab.endpointFree(ep)) continue; const p = lab.epPos(ep); const d = nearPos ? (p[0] - nearPos[0]) ** 2 + (p[2] - nearPos[2]) ** 2 : 0; if (d < bd) { bd = d; out = ep; } }
      return out;
    };
    if (x.startsWith('rail:')) { const r = x.slice(5); return best([...BB.holes.values()].filter((h) => h.rail === r).map((h) => 'H:' + h.id)); }
    if (lab.def.bb && (x === 'GND' || lab.def.pins.some((p) => p.id === x))) { const ids = x === 'GND' ? lab.def.pins.filter((p) => p.net === 'GND').map((p) => p.id) : [x]; return best(ids.flatMap((id) => stripOf(lab.bbMap().pin.get(id))).map((h) => 'H:' + h)); } // batch 4: a Nano / ESP32 pin: a free hole of its strip
    if (x === 'GND' || x === 'GND3' || x === 'GND1' || x === 'GND2') return best([x === 'GND' ? 'B:GND3' : 'B:' + x, 'B:GND3', 'B:GND1', 'B:GND2']);
    if (lab.def.pins.some((p) => p.id === x)) return 'B:' + x;
    if (x.includes('.')) {
      const [tag, pin] = x.split('.'); const p = lab.byTag(tag); if (!p) return null;
      if (PARTS[p.type].mount === 'free') return 'T:' + p.uid + ':' + pin;
      const h = holeAt(p.holes[pin]); if (!h) return null;
      // a free hole of the same strip, the one furthest from the part's own leg
      const strip = [...BB.holes.values()].filter((q) => q.strip === h.strip && q.id !== h.id).map((q) => 'H:' + q.id);
      const free = strip.filter((ep) => lab.endpointFree(ep));
      if (!free.length) return null;
      free.sort((e1, e2) => Math.abs(holeAt(e2.slice(2)).z - h.z) - Math.abs(holeAt(e1.slice(2)).z - h.z));
      return free[0];
    }
    if (x.startsWith('H:')) return x;
    return null;
  }
}
export { LESSONS, BY_ID, W };
