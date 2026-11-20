// DUET Robotics Lab 360, batch 18 (robotics/js/lessons18.js): the Class 9 maze robot end to end, without a browser.
// The bench is built as a student builds it; the sketch runs on the virtual Uno; the car (robots.js: CarSim, the maze) is
// driven by the bench's real motors, and its two HC-SR04 and the IR under its nose feed the bench back (robots.js: carFeed):
//   mazecar   at speed 130 it follows the left wall, goes into the dead end, turns round and stops on FINISH with no bump;
//             at 255 its timed turn overshoots and it bumps; at 150 it comes out clean again; in maze B (FINISH inside an
//             island of walls) it goes round and back to START
// Mistakes: the left sensor's Trig and Echo swapped (the check says so, and the robot never sees the left wall), the left
// sensor not wired at all (it never comes out).       node devtools/test/robocore18.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { CarSim, carFeed } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
const verbose = process.argv.includes('-v');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L18 = LESSONS.filter((l) => l.batch === 18);
ok(L18.length === 1 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L18.length} lesson in batch 18, ids unique`);

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
  const dt = 1 / 60; const { lab, rt, robot } = B; let lastK = null;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); robot.step(dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
    if (verbose && B.sim.cellK !== lastK) { lastK = B.sim.cellK; console.log(`   t ${B.sim.t.toFixed(1)} cell ${lastK} bumps ${B.sim.bumps}`); }
    if (until && until(B)) return true;
  }
  return false;
}
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.sim.t; const done = frames(B, 150, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.sim.t - t0).toFixed(1)} s (bumps ${B.sim.bumps}, rooms ${B.sim.path.length})`);
      if (!done) { log.push(`  flags ${[...B.sim.flags].join(',')} path ${B.sim.path.join(' ')} serial ${JSON.stringify(B.rt.serLines.slice(-3))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what it asks/.test(x)) };
}
const T = {
  mazecar(l) {
    const ai = l.steps.findIndex((s) => s.k === 'act'); const r = play(l, { [ai]: (t, B) => { if (t < 0.01) { B.sim.setMaze('B'); start(B, B.app.src); } } }); ok(r.done, `mazecar: plays end to end — ${r.log.join(' | ')}`);
    const B = build(l); start(B, l.code); frames(B, 120, (b) => b.sim.flags.has('solved'));
    ok(B.sim.flags.has('solved') && B.sim.bumps === 0 && B.sim.flags.has('deadend'), `mazecar: speed 130 comes out in ${B.sim.solvedT && B.sim.solvedT.toFixed(1)} s with ${B.sim.bumps} bumps, by ${B.sim.path.join(' ')}`);
    ok(B.rt.serLines.some((x) => /FINISH/.test(x)) && B.rt.serLines.some((x) => /turn right/.test(x)) && B.rt.serLines.some((x) => /turn left/.test(x)), `mazecar: it says what it does (${B.rt.serLines.length} lines)`);
    const S = build(l, (s) => s.k === 'wire' && /^us2\.(TRIG|ECHO)$/.test(s.wire[0]));
    for (const [a, b] of [['us2.TRIG', 'D12'], ['us2.ECHO', 'D11']]) { const g = S.rt.ghostWire([a, b]); if (g) S.lab.addWire(g[0], g[1]); }
    const c = S.rt.runCheck(); start(S, l.code); frames(S, 60, (b) => b.sim.flags.has('solved'));
    ok(c && /swapped/.test(c[0].en) && !S.sim.flags.has('solved'), `mazecar: left sensor's Trig and Echo swapped -> the check says so, and it does not come out (path ${S.sim.path.join(' ')}, bumps ${S.sim.bumps})`);
  },
};
for (const l of L18) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 18: ${fails} failed` : 'batch 18: all passed');
process.exit(fails ? 1 : 0);
