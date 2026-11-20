// DUET Robotics Lab 360, batch 19 (robotics/js/lessons19.js): the Class 10 robots on the Raspberry Pi 4, end to end,
// without a browser. The bench is built as a student builds it; the Python runs on the virtual Pi (pi6.js); the car
// (robots.js: CarSim) is driven by the bench's motors and its sensors feed the bench back, as worlds.js does:
//   pi_linecar   a lap at sleep(0.01); sleep(0.3) loses the tape; sleep(0.02) laps clean
//   pi_avoidcar  explores the room with no bump; safe = 30 (cm, not m) only backs and turns; 0.30 explores again
//   pi_wallcar   the right wall at kp 0.03 to FINISH; kp 0.3 swings into a wall; kp 0.04 to FINISH with no bump
// Mistakes: the IR eyes swapped (the check says so, and the car runs off), Echo straight into GPIO 24 (the check stops it).
//                                                   node devtools/test/robocore19.mjs [id,...] [-v]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { CarSim, carFeed } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';

const args = process.argv.slice(2).filter((a) => a !== '-v'); const only = args[0] ? args[0].split(',') : null; const verbose = process.argv.includes('-v');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L19 = LESSONS.filter((l) => l.batch === 19);
ok(L19.length === 3 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L19.length} lessons in batch 19, ids unique`);

// the car as worlds.js feeds it: line cars' IR eyes, the avoid car's sonar (no servo: straight ahead), the maze's sensors
function feed(sim, lab) {
  const k = sim.kind; const bump = () => { lab.stateV++; lab.instKey = null; };
  if (k === 'line') { const s = sim.sensors(); for (const [tag, b] of [['irL', s.L], ['irR', s.R]]) { const p = lab.byTag(tag); if (p) { p.state.ext = true; const d = b ? 40 : 1; if (p.state.dist !== d) { p.state.dist = d; bump(); } } } }
  else if (k === 'avoid') { const us = lab.byTag('us1'); if (us) { us.state.ext = true; us.state.dist = sim.usCm(90); } }
  else carFeed(sim, lab);
}
function build(l, skip) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = new CarSim(l.world.car);
  const robot = { sim, step(dt) { const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; }; sim.update(dt, w('mL'), w('mR')); feed(sim, lab); } };
  app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => { sim.reset(); feed(sim, lab); } };
  for (const s of l.steps) {
    if (skip && skip(s)) continue;
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  feed(sim, lab);
  return { lab, app, rt, robot, sim, l };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); B.buf = ''; }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt, robot } = B; let lastK = null;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); robot.step(dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
    if (verbose && B.sim.cellK !== undefined && B.sim.cellK !== lastK) { lastK = B.sim.cellK; console.log(`   t ${B.sim.t.toFixed(1)} cell ${lastK} bumps ${B.sim.bumps}`); }
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
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.sim.t - t0).toFixed(1)} s (bumps ${B.sim.bumps})`);
      if (!done) { log.push(`  flags ${[...B.sim.flags].join(',')} path ${(B.sim.path || []).join(' ')} serial ${JSON.stringify(B.rt.serLines.slice(-3))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what it asks/.test(x)) };
}
const T = {
  pi_linecar(l) {
    const r = play(l); ok(r.done, `pi_linecar: plays end to end — ${r.log.join(' | ')}`);
    const S = build(l, (s) => s.k === 'wire' && /^ir[LR]\.OUT$/.test(s.wire[0]));
    for (const [a, b] of [['irL.OUT', 'GPIO27'], ['irR.OUT', 'GPIO17']]) { const g = S.rt.ghostWire([a, b]); if (g) S.lab.addWire(g[0], g[1]); }
    const c = S.rt.runCheck(); start(S, l.code); frames(S, 20, (b) => b.sim.flags.has('lost'));
    ok(c && /swapped/.test(c[0].en) && S.sim.flags.has('lost'), `pi_linecar: eyes swapped -> the check says so, and the car runs off the tape`);
  },
  pi_avoidcar(l) {
    const r = play(l); ok(r.done, `pi_avoidcar: plays end to end — ${r.log.join(' | ')}`);
    const S = build(l, (s) => s.k === 'wire' && s.wire[1] === 'GPIO24'); const g = S.rt.ghostWire(['us1.ECHO', 'GPIO24']); if (g) S.lab.addWire(g[0], g[1]);
    const c = S.rt.runCheck(); ok(c && /straight to GPIO/.test(c[0].en), `pi_avoidcar: Echo straight into GPIO 24 -> ${JSON.stringify(c && c[0].en).slice(0, 70)}…`);
  },
  pi_wallcar(l) {
    const r = play(l); ok(r.done, `pi_wallcar: plays end to end — ${r.log.join(' | ')}`);
    const B = build(l); start(B, l.code); frames(B, 120, (b) => b.sim.flags.has('solved'));
    ok(B.sim.flags.has('solved') && B.sim.bumps === 0 && !B.sim.flags.has('deadend'), `pi_wallcar: kp 0.03 reaches FINISH in ${B.sim.solvedT && B.sim.solvedT.toFixed(1)} s with ${B.sim.bumps} bumps, by ${B.sim.path.join(' ')}`);
  },
};
for (const l of L19) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 19: ${fails} failed` : 'batch 19: all passed');
process.exit(fails ? 1 : 0);
