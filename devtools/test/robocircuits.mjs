// DUET Robotics Lab 360, battery circuits for Classes 1-3 (robotics/js/circuits.js): every lesson end to end, no browser.
// The bench is built as a student builds it (each place / wire step at its ghost), the check passes, and each watch /
// act step comes true with what a student does (press, let go, take a part out, turn the knob, replace burnt parts).
// Mistakes: an LED with no resistor burns; a reversed LED is named by the check.     node devtools/test/robocircuits.mjs
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, BY_ID, LESSON_WORDS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { batchC } from '../../robotics/js/circuits.js';

let fails = 0, passes = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else { passes++; console.log('ok   ' + m); } };
let CL = LESSONS.filter((l) => l.batch === 'C');
if (!CL.length) { CL = batchC({ W: LESSON_WORDS }, LESSONS.length); for (const l of CL) { LESSONS.push(l); BY_ID[l.id] = l; } }
ok(CL.length >= 22, `${CL.length} battery-circuit lessons`);
// one step as a student does it: a part at its ghost, a wire at its ghost (in the lesson's order)
function doStep(B, s) {
  const { lab, rt, l } = B;
  if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); ok(!!p, `${l.id}: ${q.tag} fits at its ghost`); } }
  if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); return; } lab.addWire(g[0], g[1]); B.W.set(s, lab.wires[lab.wires.length - 1]); ok(rt.conn(s.wire[0], s.wire[1]), `${l.id}: wire ${s.wire.join('–')} joins`); }
}
function build(l, all) {
  const lab = new Lab(); const app = { lab, code: () => l.code, world: null, onStepDone() {}, onLessonComplete() {} };
  const rt = new LessonRT(app); rt.open(l.id); const B = { lab, rt, l, W: new Map() };
  if (all) for (const s of l.steps) doStep(B, s);
  return B;
}
const step = (B, dt) => { B.lab.step(1000 * dt); B.rt.update(dt); };
const hold = (on) => (t, B) => { const p = B.lab.byTag('b1'); if (p && !!p.state.pressed !== on) { p.state.pressed = on; B.lab.rebuild(); } };
const del = (tag) => (t, B) => { const p = B.lab.byTag(tag); if (p && t > 0.3) B.lab.removePart(p); };
const press = (tag, on) => (B) => { const p = B.lab.byTag(tag); if (p && !!p.state.pressed !== on) { p.state.pressed = on; B.lab.rebuild(); } };
// press `tag` during each [from, to) window (seconds into the step)
const pattern = (wins) => (t, B) => { for (const [tag, a, b] of wins) if (t >= a && t < b) return press(tag, true)(B); for (const tag of ['b1', 'b2', 'b3']) press(tag, false)(B); };
const unwire = (...pairs) => (t, B) => { if (t < 0.2) return; for (const [x, y] of pairs) { const st = B.l.steps.find((q) => q.k === 'wire' && q.wire[0] === x && q.wire[1] === y); const wv = st && B.W.get(st); if (wv && B.lab.wires.includes(wv)) B.lab.removeWire(wv); } };
const SOS = (() => { const w = []; let t = 0.3; for (const d of [0.2, 0.2, 0.2, 0.7, 0.7, 0.7, 0.2, 0.2, 0.2]) { w.push(['b1', t, t + d]); t += d + 0.3; } return w; })();
const ACTS = {
  c_polarity: [null, del('led1'), null],
  c_car: [hold(true), hold(false)],
  c_bothways: [null, unwire(['m1.P', 'rail:tp'], ['m1.N', 'rail:tn']), null],
  c_burglar: [null, null, unwire(['ab1.P', 'rail:tn'])],
  c_quiz: [pattern([['b2', 0.2, 1.5]]), pattern([['b1', 0.2, 1.5]])],
  c_rgbmix: [null, null, null, unwire(['rail:tp', 'r1.1'])],
  c_lighthouse: [pattern([['b1', 0.2, 0.5], ['b1', 0.8, 1.1], ['b1', 1.4, 1.7]])],
  c_traffic: [pattern([['b1', 0.2, 0.6], ['b3', 0.8, 1.2], ['b2', 1.4, 1.8]])],
  c_morse: [pattern(SOS)],
  c_battlevel: [null, unwire(['rail:tp', 'led1.A']), null],
  c_short: [null, null, unwire(['rail:tp', 'rail:tn'])],
  c_light: [null], c_torch: [hold(true), hold(false)], c_doorbell: [hold(true), hold(false)], c_fan: [hold(true), hold(false)],
  c_series: [null, del('led2')], c_parallel: [null, del('led2')],
  c_dimmer: [(t, B) => { const p = B.lab.byTag('pot1'); const v = t < 1 ? 0 : t < 2 ? 1 : 0.5; if (p && p.state.pos !== v) { p.state.pos = v; B.lab.stateV++; B.lab.instKey = null; } }],
  // the burn, then: the direct wire out, the resistor is already in (built up front), new LED
  // batch 12: swap the thing between the clips; hold the button (spin up), let go (it coasts), wait; rush the ring through a bend, back to the start, then a slow ride to the end
  c_conductor: [null, ...['ruler', 'coin', 'eraser', 'pencil', 'stick'].map((m) => (t, B) => { const p = B.lab.byTag('s1'); if (p && t > 0.1 && p.props.mat !== m) B.lab.setProps(p, { mat: m }); })],
  c_top: [hold(true), hold(false), null],
  c_steady: [(t, B) => { const p = B.lab.byTag('bw'); if (p) p.state.pos = Math.min(0.35, t * 1.2); }, (t, B) => { const p = B.lab.byTag('bw'); if (p) p.state.pos = 0; }, (t, B) => { const p = B.lab.byTag('bw'); if (p) p.state.pos = Math.min(1, t * 0.08); }],
  c_resistor: [null, (t, B) => { const s = B.l.steps.find((x) => x.k === 'wire' && x.wire[0] === 'led1.K'); const w = B.W.get(s); if (w && B.lab.wires.includes(w)) B.lab.removeWire(w); }, (t, B) => { if (t > 0.2 && t < 0.25) B.lab.repair(); }],
};
for (const l of CL) {
  const B = build(l, false); const A = ACTS[l.id] || []; let ai = 0;
  for (const s of l.steps) {
    doStep(B, s);
    if (s.k === 'check') { const r = B.rt.runCheck(); ok(!r, `${l.id}: the circuit check passes` + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'act' || s.k === 'watch') {
      const a = A[ai++]; let t = -1; const dt = 1 / 60;
      for (let f = 0; f < 60 * 20; f++) { if (a) a(f * dt, B); step(B, dt); let d = false; try { d = !!s.until(B.rt); } catch (e) { d = false; } if (d) { t = f * dt; break; } }
      ok(t >= 0, `${l.id}: ${s.k} "${s.do.en.slice(0, 50)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ' — timed out'));
      if (t < 0) break;
      for (let f = 0; f < 10; f++) { if (a) a(1, B); step(B, dt); }
    }
  }
  let d = false; try { d = !!l.done(B.rt); } catch (e) { d = false; } ok(d, `${l.id}: the lesson counts as complete`);
}
// mistakes: an LED with no resistor burns; a reversed LED is named
{ const lab = new Lab(); lab.addPart('aa4', {}, { x: -40, z: 150 }, 0, 'bat'); const led = lab.addPart('led', { color: 'red' }, { hole: 'e22' }, 0, 'led1');
  const b = lab.byTag('bat'); lab.addWire('T:' + b.uid + ':P', 'H:tp45'); lab.addWire('T:' + b.uid + ':N', 'H:tn45'); lab.addWire('H:tp30', 'H:a23'); lab.addWire('H:a22', 'H:tn20');
  for (let f = 0; f < 60; f++) lab.step(1000 / 60); ok(!!led.state.burnt, 'an LED straight across 6 V burns out'); }
{ const l = BY_ID.c_light; const B = build(l, true); const led = B.lab.byTag('led1'); B.lab.removePart(led); B.lab.addPart('led', { color: 'red' }, { hole: 'e22' }, 2, 'led1');
  for (let f = 0; f < 30; f++) step(B, 1 / 60); const r = B.rt.runCheck(); ok(!B.rt.ledLit('led1'), 'a reversed LED stays dark'); ok(!!r, 'and the check complains' + (r ? `: "${r[0].en.slice(0, 60)}"` : '')); }
// batch 12 mistakes: clip 2 on the wrong leg is named; a fast pass through a bend buzzes, a slow one does not; the disc coasts longer than the fan
{ const B = build(BY_ID.c_conductor, true); const s = B.l.steps.find((x) => x.k === 'wire' && x.wire[0] === 's1.2'); B.lab.removeWire(B.W.get(s));
  const r = B.rt.runCheck(); ok(!!r && /Clip 2/.test(JSON.stringify(r[1] || {})), 'the tester: clip 2 left off is named' + (r ? `: "${r[0].en.slice(0, 50)}"` : '')); }
{ const B = build(BY_ID.c_steady, true); const p = B.lab.byTag('bw'); let hitsSlow = 0;
  for (let f = 0; f < 60 * 14; f++) { p.state.pos = Math.min(1, f / 60 * 0.075); step(B, 1 / 60); } hitsSlow = p.state.hits || 0;
  ok(hitsSlow === 0 && p.state.end, 'buzz wire: a slow, steady ride never touches');
  for (let f = 0; f < 60 * 2; f++) { p.state.pos = Math.max(0, 1 - f / 60 * 0.9); step(B, 1 / 60); }
  ok((p.state.hits || 0) >= 2, `buzz wire: rushing back through the bends touches (${p.state.hits} touches)`);
  const ab = B.lab.byTag('ab1'); ok((ab.state.beeps || 0) >= 2, 'and the buzzer beeped each time'); }
{ const coast = (disc) => { const B = build(BY_ID.c_top, true); const m = B.lab.byTag('m1'); if (!disc) B.lab.setProps(m, { disc: false });
    const mm = B.lab.byTag('m1'); press('b1', true)(B); for (let f = 0; f < 60 * 3; f++) step(B, 1 / 60); press('b1', false)(B);
    let t = 0; while (Math.abs(mm.state.w || 0) > 3 && t < 30) { step(B, 1 / 60); t += 1 / 60; } return t; };
  const td = coast(true), tf = coast(false); ok(td > tf * 2, `the heavy disc coasts longer than the fan (${td.toFixed(1)} s vs ${tf.toFixed(1)} s)`); }
console.log(`circuits: ${passes} ok, ${fails} failed`);
process.exit(fails ? 1 : 0);
