// DUET Robotics Lab 360, batch 14 (robotics/js/lessons14.js): the Class 7 robot cars end to end, without a browser.
// The bench is built as a student builds it (setup, then each place / wire step at its ghost); the sketch runs on the
// virtual Uno; the car (robots.js: CarSim) is driven by the bench's real motors, and its sensors feed the bench back
// (robots.js: carFeed, as worlds.js does in the page). Every step's own condition must come true, as in the app:
//   edgecar   at speed 120 it backs away from three edges; at 255 it falls off; reversing at once keeps it on the desk
//   lightcar  it reaches the torch at A, finds it again at B (spinning to look), and stops farther away with near 700
//   dancecar  600 ms spins turn about half way; spinTime 1140 turns 360 ± 20°
//   lapcar    two timed laps; race mode gives a faster lap
// Mistakes: the LDRs swapped (the check says so, and the robot turns away), the table robot's sensors unplugged (it
// drives straight off the desk).                     node devtools/test/robocore14.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, BY_ID } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { CarSim, carFeed } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L14 = LESSONS.filter((l) => l.batch === 14);
ok(L14.length === 4 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L14.length} lessons in batch 14, ids unique`);

function build(l, skip) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = new CarSim(l.world.car);
  const robot = { sim, step(dt) { const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; }; sim.update(dt, w('mL'), w('mR')); carFeed(sim, lab); } };
  app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => sim.reset() };
  for (const s of l.steps) {
    if (skip && skip(s)) continue;
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt, robot, sim, l };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); B.ser = ''; B.buf = ''; }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt, robot } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); robot.step(dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
    if (until && until(B)) return true;
  }
  return false;
}
// plays the lesson as the app does: each step's condition must come true; `acts` are what the student does in act steps
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.sim.t; const done = frames(B, 120, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.sim.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  flags ${[...B.sim.flags].join(',')} saves ${B.sim.saves} lastSpin ${B.sim.lastSpin} found ${[...(B.sim.found || [])]} serial ${JSON.stringify(B.rt.serLines.slice(-3))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) };
}
const T = {
  edgecar(l) {
    const r = play(l); ok(r.done, `edgecar: plays end to end — ${r.log.join(' | ')}`);
    const B = build(l, (s) => s.k === 'wire' && /^ir[LR]\.OUT$/.test(s.wire[0])); start(B, l.code); frames(B, 20, (b) => b.sim.fell);
    ok(B.sim.fell && B.rt.runCheck(), `edgecar: sensors not wired -> the check names it, and the robot drives off the desk (fell: ${B.sim.fell && B.sim.fell.k})`);
    const C = build(l); start(C, l.code); frames(C, 60); ok(!C.sim.fell && C.sim.saves >= 8, `edgecar: speed 120 stays on the desk for a minute (${C.sim.saves} edges escaped)`);
  },
  lightcar(l) {
    const step = l.steps.findIndex((s) => s.k === 'act'); const acts = { [step]: (t, B) => { if (t < 0.02) B.sim.lamp = 'B'; } };
    const r = play(l, acts); ok(r.done, `lightcar: plays end to end — ${r.log.join(' | ')} · stopped ${r.B.sim.foundD} mm from the torch`);
    const B = build(l); for (const [a, b] of [['ldrL.2', 'A0'], ['ldrR.2', 'A1']]) void a, b;
    // the LDRs swapped: rebuild with A0 and A1 crossed
    const S = build(l, (s) => s.k === 'wire' && (s.wire[0] === 'A0' || s.wire[0] === 'A1'));
    for (const [pin, tag] of [['A0', 'ldrR.2'], ['A1', 'ldrL.2']]) { const g = S.rt.ghostWire([pin, tag]); if (g) S.lab.addWire(g[0], g[1]); }
    const c = S.rt.runCheck(); start(S, l.code); frames(S, 30); ok(!!c && !S.sim.flags.has('found'), `lightcar: LDRs swapped -> the check says ${JSON.stringify(c && c[0].en).slice(0, 60)}…, and it never reaches the torch`);
    void B;
  },
  dancecar(l) {
    const r = play(l); ok(r.done, `dancecar: plays end to end — ${r.log.join(' | ')} · spins ${r.B.sim.spins.slice(-4).join(', ')}`);
    const B = build(l); start(B, l.code); frames(B, 12); ok(B.sim.spins.length >= 2 && Math.abs(Math.abs(B.sim.spins[0]) - 180) < 50, `dancecar: 600 ms is about half a turn (${B.sim.spins.slice(0, 2).join(', ')}°)`);
  },
  lapcar(l) { const r = play(l); ok(r.done, `lapcar: plays end to end — ${r.log.join(' | ')} · laps ${JSON.stringify(r.B.rt.serLines.filter((x) => /Lap/.test(x)).slice(-3))}`); },
};
for (const l of L14) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 14: ${fails} failed` : 'batch 14: all passed');
process.exit(fails ? 1 : 0);
