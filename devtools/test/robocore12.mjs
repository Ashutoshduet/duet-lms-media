// DUET Robotics Lab 360, batch 12 (Class 6 on the Uno: binary, diode, transistor, servo dance, colour code): every lesson end to end.
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
const B7 = LESSONS.filter((l) => l.batch === 12);
const unwireAny = (B, a) => { for (const w of [...B.lab.wires]) if (w.a === a || w.b === a) B.lab.removeWire(w); };
ok(B7.length >= 5 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${B7.length} batch-12 lessons (n ${B7[0].n}–${B7[B7.length - 1].n}), ids unique across all ${LESSONS.length}`);

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
    if (s.k === 'place') { const q = s.place; if (!B.lab.byTag(q.tag)) ok(!!B.lab.addPart(q.type, q.props, q.at, q.rot, q.tag), `${l.id}: ${q.tag} goes back in at its ghost`); }
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


// ------------------------------------------------------------------ what a student does
const after = (t0, f) => (t, B) => { if (t >= t0) f(t, B); };
const delPart = (tag) => after(0.2, (t, B) => { const p = B.lab.byTag(tag); if (p) B.lab.removePart(p); });
const ohms = (tag, v) => after(0.1, (t, B) => { const p = B.lab.byTag(tag); if (p && p.props.ohms !== v) B.lab.setProps(p, { ohms: v }); });
const ACTS = {
  u_binary: [null, null], u_npn: [null, null], u_servodance: [null, null],
  u_diode: [null, delPart('d1'), null],
  u_colourcode: [null, ohms('rx', 220), ohms('rx', 100000)],
};
for (const l of B7) { if (only && !only.includes(l.id)) continue; const B = build(l); try { play(B, ACTS[l.id] || []); } catch (e) { ok(false, `${l.id}: ${e.message}`); } }

// ------------------------------------------------------------------ a realistic mistake per lesson
const BY = Object.fromEntries(B7.map((l) => [l.id, l]));
const msg = (r) => (r ? r[0].en : '');
const runFor = (B, secs) => { start(B, B.l.code); frames(B, secs); };
if (!only || only.includes('u_binary')) { // the blue LED turned round: named, and the 8s never light
  const B = build(BY.u_binary); const p = B.lab.byTag('led4'); B.lab.removePart(p); B.lab.addPart('led', { color: 'blue' }, { hole: 'e31' }, 2, 'led4');
  const r = B.rt.runCheck(); ok(/wrong way round/.test(msg(r)), 'binary: a reversed LED is named: ' + msg(r).slice(0, 50)); runFor(B, 10); ok(!B.rt.ledLit('led4') && B.lab.byTag('led4') && !B.lab.byTag('led4').state.burnt, 'and it stays dark'); }
if (!only || only.includes('u_diode')) { // the diode in backwards from the start: named, and the LED never lights
  const B = build(BY.u_diode); B.lab.removePart(B.lab.byTag('d1')); B.lab.addPart('diode', {}, { hole: 'c44' }, 2, 'd1');
  const r = B.rt.runCheck(); ok(/grey band/.test(msg(r)), 'diode: turned round is named: ' + msg(r).slice(0, 50)); let seen = false; start(B, B.l.code); frames(B, 3, () => { if (B.rt.ledLit('led1')) seen = true; }); ok(!seen, 'and the LED never lights'); }
if (!only || only.includes('u_npn')) { // pin 9 straight to the base (no resistor): named; the pin is overloaded
  const B = build(BY.u_npn); B.lab.removePart(B.lab.byTag('rb')); unwireAny(B, 'B:D9'); B.lab.addWire('B:D9', 'H:a41');
  const r = B.rt.runCheck(); ok(/no resistor/.test(msg(r)), 'transistor: no base resistor is named: ' + msg(r).slice(0, 50));
  let warned = false; B.lab.on((type) => { if (type === 'pinOver') warned = true; }); runFor(B, 1.5); ok(warned, 'and the simulator warns that pin 9 gives too much current'); }
if (!only || only.includes('u_npn')) { // the transistor turned round: named, and the lamp stays dark
  const B = build(BY.u_npn); B.lab.removePart(B.lab.byTag('q1')); B.lab.addPart('npn', {}, { hole: 'e42' }, 2, 'q1');
  const r = B.rt.runCheck(); ok(!!r, 'transistor turned round: the check complains: ' + msg(r).slice(0, 60)); }
if (!only || only.includes('u_servodance')) { // the servo's red wire on 3.3 V: named, and the arm does not dance
  const B = build(BY.u_servodance); const sv = B.lab.byTag('sv1'); unwireAny(B, 'T:' + sv.uid + ':VP'); B.lab.addWire('T:' + sv.uid + ':VP', 'B:3V3');
  const r = B.rt.runCheck(); ok(/3\.3 V/.test(msg(r)), 'servo dance: 3.3 V is named: ' + msg(r).slice(0, 50)); runFor(B, 3); ok(B.rt.servoMax('sv1') < 100 && B.rt.servoMin('sv1') > 80, 'and the arm stays still'); }
if (!only || only.includes('u_colourcode')) { // no unknown resistor: named, and the sketch says so
  const B = build(BY.u_colourcode); B.lab.removePart(B.lab.byTag('rx'));
  const r = B.rt.runCheck(); ok(/not on the bench/.test(msg(r)), 'colour code: the missing resistor is named: ' + msg(r).slice(0, 50)); runFor(B, 2); ok(/No resistor/.test(B.ser || ''), 'and the reader prints "No resistor"'); }
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
