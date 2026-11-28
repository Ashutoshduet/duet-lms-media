// DUET Robotics Lab 360, batch 7 (thirty Arduino projects): every new lesson end to end without a browser.
//   1. the lesson's bench is built as a student builds it (its setup, then each place / wire step at its ghost), the
//      circuit check passes, the sketch compiles (for its board) and runs, every act / watch step comes true with what a
//      student does (press, slide, wave, type on the keypad, the remote …), the edits change the behaviour as the step
//      says, and the lesson counts as complete;
//   2. a realistic mistake per lesson (a reversed part, a missing resistor, a wire on the wrong pin, 3.3 V for a 5 V
//      module, …) is caught by "Check my circuit" with the right message, and the bench then misbehaves as a real one would.
//   node devtools/test/robocore7.mjs [lesson,...]      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { lcdText, oledLit } from '../../robotics/js/libs3.js';
import { irSend, keyPress, KEYMAP } from '../../robotics/js/parts3.js';
import { segDigit, rail as rail7 } from '../../robotics/js/lessons7.js';
// the box around the OLED's lit dots
const litBox = (p) => { const s = p && p.state; if (!s || !s.fb) return null; let x0 = 999, x1 = -1, y0 = 999, y1 = -1; for (let i = 0; i < s.fb.length; i++) if (s.fb[i]) { const x = i % 128, y = Math.floor(i / 128); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return x1 < 0 ? null : { w: x1 - x0, h: y1 - y0 }; };

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const B7 = LESSONS.filter((l) => l.batch === 7);
const unwireAny = (B, a) => { for (const w of [...B.lab.wires]) if (w.a === a || w.b === a) B.lab.removeWire(w); };
ok(B7.length >= 10 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${B7.length} batch-7 lessons (n ${B7[0].n}–${B7[B7.length - 1].n}), ids unique across all ${LESSONS.length}`);

// ------------------------------------------------------------------ the bench, as a student builds it
function build(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} (${q.type}) fits at its ghost`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt, l };
}
const frames = (B, secs, each) => { const dt = 1 / 60; for (let f = 0; f < secs * 60; f++) { if (each) each(f * dt, B); step(B, dt); } };
function step(B, dt) {
  const { lab, rt } = B; lab.step(1000 * dt); rt.update(dt);
  for (const o of lab.mcu.ser.take()) { if (o.baud !== (B.l.baud || 9600)) continue; const s = String.fromCharCode(...o.bytes); B.ser = (B.ser || '') + s; B.part = (B.part || '') + s.replace(/\r/g, ''); const ls = B.part.split('\n'); B.part = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
  if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
}
function start(B, src) { const { lab, app, rt } = B; const c = compile(src, lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors)); app.src = src; lab.run(c); rt.onRun(src); B.ser = ''; B.part = ''; }
// the lesson's steps after the wiring: Check, Run, the edits, each act / watch step until it comes true
function play(B, acts) {
  const { l, rt } = B; let src = l.code; let ai = 0;
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, `${l.id}: the circuit check passes` + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), `${l.id}: the edit "${s.do.en.slice(0, 50)}…" is what the step asks`); src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const act = acts[ai++]; let t = -1; const dt = 1 / 60;
      for (let f = 0; f < 60 * 60; f++) { if (act) act(f * dt, B); step(B, dt); let d = false; try { d = !!s.until(rt); } catch (e) { d = false; } if (d) { t = f * dt; break; } }
      ok(t >= 0, `${l.id}: ${s.k} "${s.do.en.slice(0, 60)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ' — timed out'));
      if (t < 0) { console.log('     serial: ' + JSON.stringify((B.ser || '').slice(-160))); return; }
      frames(B, 0.2, act); // (the student looks a moment longer)
    }
  }
  let d = false; try { d = !!l.done(rt); } catch (e) { d = false; } ok(d, `${l.id}: the lesson counts as complete`);
}

// ------------------------------------------------------------------ what a student does (called every frame of a step: t = s since it began)
const bump = (lab) => { lab.stateV++; lab.instKey = null; };
const hold = (tag, t0, dur) => (t, B) => { const p = B.lab.byTag(tag); const on = t >= t0 && t < t0 + dur; if (p && !!p.state.pressed !== on) { p.state.pressed = on; B.lab.rebuild(); } };
const presses = (tag, every, dur = 0.25, from = 0.3) => (t, B) => { const k = (t - from) % every; hold(tag, 0, 1)((k >= 0 && k < dur && t >= from) ? 0.5 : 9, B); };
const light = (v) => (t, B) => { if (B.lab.env.light !== v) { B.lab.env.light = v; bump(B.lab); } };
const temp = (v) => (t, B) => { if (B.lab.env.temp !== v) { B.lab.env.temp = v; bump(B.lab); } };
const dist = (tag, d, t0 = 0) => (t, B) => { const p = B.lab.byTag(tag); if (p && t >= t0 && p.state.dist !== d) { p.state.dist = d; bump(B.lab); } };
const all = (...fs) => (t, B) => { for (const f of fs) if (f) f(t, B); };
const when = (cond, f) => (t, B) => { if (cond(B, t)) f(t, B); };
const pressWhen = (tag, cond) => { let at = null; return (t, B) => { if (at === null && cond(B, t)) at = t + 0.05; hold(tag, at === null ? 99 : at, 0.25)(t, B); if (at !== null && t > at + 0.6) at = null; }; };
const lit = (tag) => (B) => B.rt.ledLit(tag);
// an IR sensor's block brought close (under its 12 cm) and taken away again: [t0, t1) close
const near = (tag, spans) => (t, B) => { const p = B.lab.byTag(tag); const d = spans.some(([a, b]) => t >= a && t < b) ? 4 : 30; if (p && p.state.dist !== d) { p.state.dist = d; bump(B.lab); } };
const pulses = (tag, n, from = 0.3, on = 0.3, off = 0.5) => near(tag, [...Array(n)].map((_, i) => [from + i * (on + off), from + i * (on + off) + on]));
// keys of the 4×4 keypad, one every gap s
const keyIdx = (k) => { const r = KEYMAP.findIndex((row) => row.includes(k)); return r * 4 + KEYMAP[r].indexOf(k); };
const typeKeys = (list, from = 0.3, gap = 0.35) => (t, B) => { const k = Math.round((t - from) / gap); if (k >= 0 && k < list.length && Math.abs(t - from - k * gap) < 0.009) keyPress(B.lab, B.lab.byTag('kp'), keyIdx(list[k]), 0.15); };
// the times-table quiz: read the question on the LCD, then type the answer (right or wrong) and #
const answer = (right) => { let seq = null; let t0 = 0; return (t, B) => { if (!seq && t > 0.6) { const m = /^(\d+) x (\d+) = \?/.exec(lcdText(B.lab.byTag('lcd'))[0]); if (m) { seq = [...String(right ? m[1] * m[2] : m[1] * m[2] + 1), '#']; t0 = t + 0.1; } } if (seq) typeKeys(seq, t0)(t, B); }; };
const stickTo = (x, y, pressed) => (t, B) => { const js = B.lab.byTag('js'); if (js && (js.state.x !== x || js.state.y !== y || !!js.state.pressed !== !!pressed)) { js.state.x = x; js.state.y = y; js.state.pressed = !!pressed; B.lab.rebuild(); } };
const wave = (from, to) => (t, B) => { const p = B.lab.byTag('pir'); if (p) p.state.motion = t >= from && t < to; };
const knob = (tag, v) => (t, B) => { const p = B.lab.byTag(tag); if (p && p.state.pos !== v) { p.state.pos = v; bump(B.lab); } };
const irAt = (key, at = 0.5) => { let done = false; return (t, B) => { if (!done && t >= at) { done = true; irSend(B.lab, key); } }; };
const seq = (...parts) => (t, B) => { let t0 = 0; for (const [d, f] of parts) { if (t < t0 + d) { f(t - t0, B); return; } t0 += d; } parts[parts.length - 1][1](t - t0, B); };
const lcdNow = (B, re) => { const p = B.lab.byTag('lcd'); const r = p ? lcdText(p) : ['', '']; return re.test(r[0]) || re.test(r[1]); };
const ACTS = () => ({
  sos: [null, null],
  melody: [hold('b1', 0.3, 0.3), hold('b1', 0.3, 0.3)],
  theremin: [light(0.15), light(0.85), light(0.15)],
  rgbtemp: [(t, B) => { if (t > 1) temp(15)(t, B); }, temp(38)],
  crossing: [hold('b1', 0.5, 0.4), hold('b1', 0.5, 0.4)],
  quizbuzz: [hold('b1', 0.5, 0.3), hold('b2', 0.2, 0.4), pressWhen('b2', (B) => /Ready!\s*$/.test(B.ser || ''))],
  reaction: [pressWhen('b1', lit('led1')), pressWhen('b1', (B) => lcdNow(B, /Get ready/))],
  segcount: [null, null],
  dice: [presses('b1', 1.5), presses('b1', 1.5)],
  countdown: [null, null],
  lcdnotice: [null, null],
  lcddist: [dist('us1', 30), dist('us1', 6), dist('us1', 15)],
  speedgun: [(t, B) => { near('g1', [[0.3, 1.4]])(t, B); near('g2', [[0.8, 1.4]])(t, B); }, (t, B) => { near('g1', [[2.0, 2.6]])(t, B); near('g2', [[2.15, 2.6]])(t, B); }],
  visitors: [pulses('din', 3), pulses('dout', 1), pulses('din', 3)],
  radar: [null, dist('us1', 20), dist('us1', 80)],
  sketch: [seq([1.2, stickTo(0.95, 0.5)], [1.2, stickTo(0.5, 0.95)], [1, stickTo(0.5, 0.5)]), stickTo(0.5, 0.5, true), seq([0.3, stickTo(0.5, 0.5)], [1.5, stickTo(0.05, 0.5)], [1, stickTo(0.5, 0.05)], [1, stickTo(0.5, 0.5)])],
  calc: [typeKeys(['1', '2', 'A', '3', '0', '#']), typeKeys(['7', 'D', '2', '#']), typeKeys(['5', 'D', '0', '#'])],
  mathquiz: [answer(true), answer(false), answer(true)],
  schoolbell: [null, null],
  lightmeter: [light(0.2), light(0.85), light(0.55)],
  corridor: [wave(3.5, 5), all(light(0.15), wave(4, 5.5)), null],
  autofan: [temp(34), temp(29), temp(25)],
  stairtimer: [hold('b1', 0.3, 0.3), null, hold('b1', 0.3, 0.3)],
  sanitizer: [near('ir1', [[0.3, 3]]), near('ir1', [[0.8, 2]]), near('ir1', [[0.5, 2.5]])],
  remotefan: [irAt('3'), irAt('1'), irAt('0')],
  railgate: [near('ir1', [[0.3, 8]]), near('ir1', [])],
  blinds: [(t, B) => { if (t > 4) light(0.1)(t, B); }, light(0.85)],
  jsdrive: [stickTo(0.5, 0.97), stickTo(0.97, 0.5)],
  mega_chaser: [knob('pot1', 0), knob('pot1', 1)],
  esp_alarm: [wave(3.5, 5), wave(4, 5.5)],
});

// ------------------------------------------------------------------ a realistic mistake per lesson: what the check says, what the bench does
// the wire a student would pull out to part a from b: one that ends at a (its terminal, its pin, or its breadboard strip)
import { holeAt } from '../../robotics/js/boards.js';
function wireBetween(lab, rt, a, b) {
  const k = lab.key(rt.k(a)); const strip = k && k.startsWith('H:') ? holeAt(k.slice(2)).strip : null;
  const atA = (e) => e === k || (strip && e.startsWith('H:') && holeAt(e.slice(2)).strip === strip);
  for (const w of [...lab.wires].filter((x) => atA(x.a) || atA(x.b))) { lab.removeWire(w); const c = rt.conn(a, b); lab.wires.push(w); lab.rebuild(); if (!c) return w; }
  return null;
}
const unwire = (B, a, b) => { const w = wireBetween(B.lab, B.rt, a, b); if (!w) throw new Error(`no wire joins ${a} and ${b}`); B.lab.removeWire(w); };
const addw = (B, a, b) => { const g = B.rt.ghostWire([a, b]); if (!g) throw new Error(`no free holes for ${a} → ${b}`); B.lab.addWire(g[0], g[1]); };
const movep = (B, tag, at, rot) => { const p = B.lab.byTag(tag); if (!B.lab.movePart(p, at, rot)) throw new Error(`${tag} does not fit at ${JSON.stringify(at)}`); };
const MISTAKES = {
  sos: { make: (B) => movep(B, 'led1', { hole: 'e23' }, 2), msg: /LED is the wrong way round/, then: (B) => { start(B, B.l.code); frames(B, 3); return B.rt.toggles('led1') === 0 && B.lab.byTag('led1').state.i < 1e-4; }, what: 'the reversed LED never lights' },
  melody: { make: (B) => { unwire(B, 'D8', 'bz1.P'); addw(B, 'D7', 'bz1.P'); }, msg: /joined to pin 8/, then: (B) => { start(B, B.l.code); frames(B, 3, hold('b1', 0.3, 0.3)); return B.lab.obs.tones.size === 0; }, what: 'the buzzer on pin 7 stays silent' },
  theremin: { make: (B) => { unwire(B, 'ldr1.1', '5V'); B.lab.removePart(B.lab.byTag('r10')); if (!B.lab.addPart('resistor', { ohms: 10000, span: 5 }, { hole: 'b42' }, 3, 'r10')) throw new Error('r10 to the + rail'); addw(B, 'ldr1.1', 'rail:tn'); }, msg: /swapped/,
    then: (B) => { start(B, B.l.code); frames(B, 1, light(0.9)); const f = B.lab.sounds.find((s) => s.kind === 'tone'); return f && f.f < 500; }, what: 'swapped, bright light plays a low note' },
  rgbtemp: { make: (B) => movep(B, 't1', { hole: 'e47' }, 2), msg: /LM35 is the wrong way round/, then: (B) => { start(B, B.l.code); frames(B, 3); const v = B.rt.nums; return v.length > 5 && Math.max(...v) - Math.min(...v) > 20; }, what: 'reversed, its output floats: the readings jump about (nonsense)' },
  crossing: { make: (B) => { unwire(B, 'b1.L3', 'GND'); B.lab.addWire('H:j40', 'B:GND1'); }, msg: /always joined/, then: (B) => { start(B, B.l.code); frames(B, 5); return !!B.rt.memRun.walk; }, what: 'the WALK sequence starts with nobody pressing' },
  quizbuzz: { make: (B) => { unwire(B, 'D3', 'b2.L1'); addw(B, 'D4', 'b2.L1'); }, msg: /team B's button must be joined to pin 3/, then: (B) => { start(B, B.l.code); frames(B, 2, hold('b2', 0.3, 0.5)); return !B.rt.ledLit('led2') && !B.rt.memRun.bWon; }, what: 'team B presses and nothing lights' },
  reaction: { make: (B) => { unwire(B, 'lcd.VCC', '5V'); B.lab.addWire(B.rt.ep('T:lcd:VCC'), 'B:3V3'); }, msg: /VCC is on 3\.3 V/, then: (B) => { start(B, B.l.code); frames(B, 1.5); return !lcdNow(B, /\S/); }, what: 'on 3.3 V the LCD stays blank' },
  segcount: { make: (B) => { unwire(B, 'sg.COM1', 'GND'); addw(B, 'sg.COM1', 'rail:bp'); }, msg: /COM is on 5V/, then: (B) => { start(B, B.l.code); frames(B, 3); return !(B.rt.memRun.digits || []).length; }, what: 'COM on 5 V: no segment can light' },
  dice: { make: (B) => { unwire(B, 'D2', 'rA.2'); addw(B, 'D2', 'sg.A'); }, msg: /no resistor/, then: (B) => { start(B, B.l.code); frames(B, 1); return B.lab.byTag('sg').state.burnt; }, what: 'segment a with no resistor burns the display' },
  countdown: { make: (B) => { unwire(B, 'sv1.VP', '5V'); B.lab.addWire(B.rt.ep('T:sv1:VP'), 'B:3V3'); }, msg: /servo's red wire is on 3\.3 V/, then: (B) => { start(B, B.l.code); frames(B, 12); return B.rt.servoMax('sv1') < 5 && /Lift off!/.test(B.ser); }, what: 'on 3.3 V the launch arm never moves' },
  lcdnotice: { make: (B) => { unwire(B, 'lcd.SDA', 'A4'); unwire(B, 'lcd.SCL', 'A5'); B.lab.addWire(B.rt.ep('T:lcd:SDA'), 'B:A5'); B.lab.addWire(B.rt.ep('T:lcd:SCL'), 'B:A4'); }, msg: /SDA and SCL are swapped/, then: (B) => { start(B, B.l.code); frames(B, 2); return !lcdNow(B, /\S/); }, what: 'swapped, the LCD stays blank' },
  lcddist: { make: (B) => { unwire(B, 'us1.TRIG', 'D9'); unwire(B, 'us1.ECHO', 'D10'); addw(B, 'us1.TRIG', 'D10'); addw(B, 'us1.ECHO', 'D9'); }, msg: /Trig and Echo are swapped/, then: (B) => { start(B, B.l.code); frames(B, 1.5); return lcdNow(B, /Distance: 0 cm/); }, what: 'swapped, it reads 0 cm' },
  speedgun: { make: (B) => unwire(B, 'g2.OUT', 'D3'), msg: /sensor's OUT must be joined to pin 3/, then: (B) => { start(B, B.l.code); frames(B, 2, near('g1', [[0.3, 0.8]])); return /cm\/s/.test(B.ser); }, what: 'with gate 2\'s pin floating, a made-up speed appears though the car never reached gate 2' },
  visitors: { make: (B) => { B.lab.removePart(B.lab.byTag('r1')); B.lab.addWire('H:a22', rail7('tn', 22)); }, msg: /No resistor/, then: (B) => { start(B, B.l.code); frames(B, 6, pulses('din', 5)); return B.lab.byTag('led1').state.burnt; }, what: 'when the room is full the lamp burns out' },
  radar: { make: (B) => { unwire(B, 'oled.SDA', 'A4'); unwire(B, 'oled.SCL', 'A5'); addw(B, 'oled.SDA', 'A5'); addw(B, 'oled.SCL', 'A4'); }, msg: /SDA and SCL are swapped/, then: (B) => { start(B, B.l.code); frames(B, 2); return oledLit(B.lab.byTag('oled')) === 0 && B.rt.servoRange('sv1') > 50; }, what: 'swapped, the servo sweeps but the screen stays dark' },
  sketch: { make: (B) => { unwire(B, 'js.VRX', 'A0'); unwire(B, 'js.VRY', 'A1'); addw(B, 'js.VRX', 'A1'); addw(B, 'js.VRY', 'A0'); }, msg: /VRx and VRy are swapped/, then: (B) => { start(B, B.l.code); frames(B, 1.5, stickTo(0.95, 0.5)); const bb = litBox(B.lab.byTag('oled')); return bb && bb.w <= 2 && bb.h >= 20; }, what: 'swapped, pushing right draws a line going up or down' },
  calc: { make: (B) => { for (const [k, p] of [['R1', 9], ['R2', 8], ['R3', 7], ['R4', 6], ['C1', 5], ['C2', 4], ['C3', 3], ['C4', 2]]) unwire(B, 'kp.' + k, 'D' + p); for (const [k, p] of [['C1', 9], ['C2', 8], ['C3', 7], ['C4', 6], ['R1', 5], ['R2', 4], ['R3', 3], ['R4', 2]]) B.lab.addWire(B.rt.ep('T:kp:' + k), 'B:D' + p); }, msg: /keys come out wrong/,
    then: (B) => { start(B, B.l.code); frames(B, 3, typeKeys(['1', '2', 'A', '3'])); return !lcdNow(B, /^12\+3/); }, what: 'rows and columns swapped: other keys come out' },
  mathquiz: { make: (B) => { unwire(B, 'D10', 'bz1.P'); addw(B, 'D11', 'bz1.P'); }, msg: /joined to pin 10/, then: (B) => { start(B, B.l.code); frames(B, 4, answer(true)); return lcdNow(B, /Correct!|Score: 1/) && B.lab.obs.tones.size === 0; }, what: 'a right answer, but no beep: the buzzer is on pin 11' },
  schoolbell: { make: (B) => movep(B, 'bell', { hole: 'e55' }, 2), msg: /active buzzer is the wrong way round/, then: (B) => { start(B, B.l.code); frames(B, 3); return /Bell at 800/.test(B.ser) && B.lab.obs.tones.size === 0; }, what: 'reversed, the bell time comes but it stays silent' },
  lightmeter: { make: (B) => { unwire(B, 'ldr1.1', '5V'); B.lab.removePart(B.lab.byTag('r10')); if (!B.lab.addPart('resistor', { ohms: 10000, span: 5 }, { hole: 'b42' }, 3, 'r10')) throw new Error('r10'); addw(B, 'ldr1.1', 'rail:tn'); }, msg: /swapped/, then: (B) => { start(B, B.l.code); frames(B, 1.5, light(0.9)); return /Too dark/.test(B.lab.byTag('oled').state.text || ''); }, what: 'swapped, bright light reads "Too dark"' },
  corridor: { make: (B) => { unwire(B, 'pir.VCC', '5V'); B.lab.addWire(B.rt.ep('T:pir:VCC'), 'B:3V3'); }, msg: /PIR's VCC is on 3\.3 V/, then: (B) => { start(B, B.l.code); frames(B, 8, all(light(0.15), wave(3.5, 5))); const p = B.lab.byTag('pir'); return !p.state.powered && !p.state.seen; }, what: 'on 3.3 V the PIR never wakes: it does not see the person walking by' },
  autofan: { make: (B) => { unwire(B, 'rl.S', 'D8'); B.lab.addWire(B.rt.ep('T:rl:S'), 'B:D7'); }, msg: /relay's S must be joined to pin 8/, then: (B) => { start(B, B.l.code); frames(B, 4, temp(34)); return !B.lab.byTag('fan').state.on && /fan ON/.test(B.ser); }, what: 'the sketch says "fan ON" but the relay on pin 7 never switches' },
  stairtimer: { make: (B) => { unwire(B, 'rl.VCC', '5V'); B.lab.addWire(B.rt.ep('T:rl:VCC'), 'B:3V3'); }, msg: /relay's \+ is on 3\.3 V/, then: (B) => { start(B, B.l.code); frames(B, 2, hold('b1', 0.3, 0.3)); return lcdNow(B, /Light ON/) && !B.lab.byTag('rl').state.on && !B.lab.byTag('lamp').state.on; }, what: 'the LCD says "Light ON" but the relay never clicks on 3.3 V' },
  sanitizer: { make: (B) => { unwire(B, 'rl.NO', 'pump.P'); B.lab.addWire(B.rt.ep('T:rl:NC'), B.rt.ep('T:pump:P')); }, msg: /NC \(normally closed\)/, then: (B) => { start(B, B.l.code); frames(B, 1.5); return B.lab.byTag('pump').state.flow > 20; }, what: 'on NC the pump runs with no hand there' },
  remotefan: { make: (B) => movep(B, 'ir', { hole: 'j50' }, 2), msg: /IR receiver is wired the wrong way/, then: (B) => { start(B, B.l.code); frames(B, 2, irAt('3')); return !/Speed/.test(B.ser) && B.rt.motorMax('m1') < 50; }, what: 'turned round, the receiver has no power: the remote does nothing' },
  railgate: { make: (B) => { unwire(B, 'sv1.SIG', 'D10'); addw(B, 'sv1.SIG', 'D9'); }, msg: /joined to pin 10/, then: (B) => { start(B, B.l.code); frames(B, 3, near('ir1', [[0.3, 3]])); return /Train!/.test(B.ser) && B.rt.servoMin('sv1') > 80; }, what: 'the lamps flash for the train but the boom stays up' },
  blinds: { make: (B) => { unwire(B, 'st.IN2', 'D9'); unwire(B, 'st.IN3', 'D10'); B.lab.addWire(B.rt.ep('T:st:IN2'), 'B:D10'); B.lab.addWire(B.rt.ep('T:st:IN3'), 'B:D9'); }, msg: /only shakes/, then: (B) => { start(B, B.l.code); frames(B, 4); return /opening/.test(B.ser) && Math.abs(B.lab.byTag('st').state.angle) < 20; }, what: 'out of order, "opening" but the shaft only shakes' },
  jsdrive: { make: (B) => unwire(B, 'drv.GND', 'GND'), msg: /Common ground/, then: (B) => { start(B, B.l.code); frames(B, 2, stickTo(0.5, 0.97)); return Math.abs(B.lab.byTag('mL').state.w) < 20 && Math.abs(B.lab.byTag('mR').state.w) < 20; }, what: 'without the common ground the wheels stay still' },
  mega_chaser: { make: (B) => { unwire(B, 'A0', 'pot1.W'); addw(B, 'A1', 'pot1.W'); }, msg: /middle leg must be joined to A0/, then: (B) => { start(B, B.l.code); frames(B, 3, knob('pot1', 0)); const v = B.rt.nums.slice(1); return v.length >= 1 && v.some((x) => x > 40); }, what: 'the knob is on A1: A0 floats and the speed jumps about' },
  esp_alarm: { make: (B) => { unwire(B, 'pir.VCC', '5V'); B.lab.addWire(B.rt.ep('T:pir:VCC'), 'H:j4'); }, msg: /5 V for modules is VIN/, then: (B) => { start(B, B.l.code); frames(B, 7, wave(3.5, 5)); const p = B.lab.byTag('pir'); return !p.state.powered && !p.state.seen; }, what: 'on 3.3 V the PIR stays dead (and its OUT floats: GPIO 27 reads noise, false alarms)' },
};

for (const l of B7) {
  if (only && !only.includes(l.id)) continue;
  const t0 = Date.now();
  try {
    for (const s of l.steps) for (const k of ['do', 'see']) for (const lg of ['en', 'hi', 'hg']) if (!s[k] || typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
    for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
    const c = compile(l.code, new Lab(l.board || 'uno').def); ok(c.ok && !c.warnings.length, `${l.id}: the sketch compiles for its board` + (c.ok ? (c.warnings.length ? ' (warnings ' + c.warnings.map((w) => w.code) + ')' : '') : ' ' + JSON.stringify(c.errors)));
    const B = build(l); play(B, ACTS()[l.id] || []);
    const m = MISTAKES[l.id];
    if (!m) ok(false, `${l.id}: a realistic mistake is tested`);
    else {
      const B2 = build(l); m.make(B2); const r = B2.rt.runCheck();
      ok(r && m.msg.test(r[0].en.replace(/\{(\w+)\}/g, (_, k) => { const v = (r[1] || {})[k]; return v && v.en ? v.en : v; })) && r[0].hi && r[0].hg, `${l.id}: mistake caught: "${r ? r[0].en.replace(/\{(\w+)\}/g, (_, k) => { const v = (r[1] || {})[k]; return v && v.en ? v.en : v; }).slice(0, 110) : 'no message'}"`);
      let real = false; try { real = m.then(B2); } catch (e) { real = 'error ' + e.message; } ok(real === true, `${l.id}: and the bench shows it: ${m.what}` + (real === true ? '' : ` (${real})`));
    }
  } catch (e) { ok(false, `${l.id}: ${e.message}`); console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  console.log(`     ${l.id} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
void oledLit; void irSend; void keyPress; void KEYMAP; void segDigit; void all; void when; void dist;
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
