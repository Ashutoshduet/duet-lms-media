// DUET Robotics Lab 360, batch 23 (robotics/js/lessons23.js): the Class 11 robot-arm sessions, without a browser.
// The bench is built as a student builds it; the arm is robots.js ArmSim (level 4: the block at A, the mark B), fed the
// servos' angles each frame as worlds.js does (and the claw's grip limit back). The student's hands are the knobs (a pot's
// pos) and the buttons:
//   armcopy    knob 2 up lowers the arm (the master's shoulder knob is fitted the other way round); after the edit the
//              knobs carry the block from A to B
//   armrecord  seven poses: "Memory full!" after three; MAXP = 10; seven saved; back to A, knobs anywhere, PLAY: placed
// Mistakes: knob 2's wiper on A2 and knob 3's on A1 (the check names the order); the RECORD button on pin 7.
//   node devtools/test/robocore23.mjs      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { ArmSim } from '../../robotics/js/robots.js';

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L23 = LESSONS.filter((l) => l.batch === 23);
ok(L23.length === 2 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L23.length} lessons in batch 23, ids unique`);

function build(l, extra) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const sim = new ArmSim(l.world.level); const tags = ['svB', 'svS', 'svE', 'svG'];
  app.world = { flag: (n) => sim.flags.has(n), val: (n) => sim[n], onRun: () => sim.reset() };
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const w = extra ? extra(s) : s.wire; const g = rt.ghostWire(w); if (!g) { ok(false, `${l.id}: a ghost wire for ${w}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(w[0], w[1])) ok(false, `${l.id}: wire ${w} joins`); }
  }
  const B = { lab, app, rt, sim, l, ser: '', buf: '', t: 0 };
  B.arm = (dt) => { const a = {}; ['b', 's', 'e', 'g'].forEach((k, i) => { const p = lab.byTag(tags[i]); a[k] = p ? p.state.angle : 90; }); sim.update(dt, a); const g = lab.byTag('svG'); if (g) g.state.limit = sim.limit; };
  return B;
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); B.arm(dt); rt.update(dt); B.t += dt;
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.ser += s; B.buf += s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err).slice(0, 300));
    if (until && until(B)) return true;
  }
  return false;
}
// the student's hands: a knob to an angle (as the sketch maps it), a button pressed or let go
const knob = (B, t, v) => { const p = B.lab.byTag(t); if (p && p.state.pos !== v) { p.state.pos = v; B.lab.stateV++; B.lab.instKey = null; } };
const btn = (B, t, on) => { const p = B.lab.byTag(t); if (p && !!p.state.pressed !== on) { p.state.pressed = on; B.lab.rebuild(); } };
const pose = (b, s, e, g) => (B) => { knob(B, 'pk1', b / 180); knob(B, 'pk2', s / 180); knob(B, 'pk3', e / 180); knob(B, 'pk4', (g - 30) / 65); };
// the pick-and-place, as seven poses (base, shoulder, elbow, claw)
const JOB = [[140, 80, 90, 30], [140, 45, 66, 30], [140, 45, 66, 92], [140, 80, 90, 92], [40, 80, 90, 92], [40, 45, 66, 92], [40, 45, 66, 30]];
// a timed list of things to do: [at s, f(B)]
const script = (list) => { const done = new Set(); return (t, B) => list.forEach(([at, f], i) => { if (t >= at && !done.has(i)) { done.add(i); f(B); } }); };
// the job by hand (knobs only), a pose every 1.5 s; or with RECORD pressed at each pose
const byHand = (t0 = 0.5) => JOB.map((p, i) => [t0 + i * 1.5, pose(...p)]);
const teach = (n, t0 = 0.5) => JOB.slice(0, n).flatMap((p, i) => [[t0 + i * 2, pose(...p)], [t0 + i * 2 + 1.2, (B) => btn(B, 'b1', true)], [t0 + i * 2 + 1.5, (B) => btn(B, 'b1', false)]]);
function play(l, acts, secs = 40) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') { start(B, src); frames(B, 0.5); }
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); frames(B, 0.5); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.t; const done = frames(B, secs, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  flags ${[...B.sim.flags].join(',')} cube ${B.sim.cube.p.map(Math.round)} serial ${JSON.stringify(B.rt.serLines.slice(-4))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what/.test(x)) };
}
const ix = (l, re) => l.steps.findIndex((s) => (s.k === 'act' || s.k === 'watch') && re.test(s.do.en));
const say = (c) => (c ? c[0].en.replace(/\{(\w+)\}/g, (m, k) => { const a = (c[1] || {})[k]; return a && typeof a === 'object' ? a.en : String(a); }) : '');

{ // master and slave
  const l = L23.find((x) => x.id === 'armcopy');
  const acts = { [ix(l, /Lift the arm/)]: script([[0.3, (B) => knob(B, 'pk2', 0.75)]]), [ix(l, /move the block from A to B/)]: script(byHand()) };
  const r = play(l, acts); ok(r.done, `armcopy: plays end to end — ${r.log.join(' | ')}`);
  ok(r.B.sim.flags.has('grabbed') && r.B.sim.flags.has('placed'), `armcopy: the knobs grabbed the block at A and placed it at B (${r.B.sim.cube.p.map(Math.round)})`);
  const M = build(l, (s) => (s.wire[0] === 'pk2.W' ? ['pk2.W', 'A2'] : s.wire[0] === 'pk3.W' ? ['pk3.W', 'A1'] : s.wire)); const c = M.rt.runCheck();
  ok(!!c && /in order/.test(say(c)), `armcopy: knobs 2 and 3 crossed -> the check says ${JSON.stringify(say(c)).slice(0, 90)}`);
}
{ // teach and play back
  const l = L23.find((x) => x.id === 'armrecord');
  const acts = { [ix(l, /Teach the pick-and-place/)]: script(teach(4)), [ix(l, /Teach the seven poses again/)]: script(teach(7)),
    [ix(l, /Block back to A/)]: script([[0.1, (B) => btn(B, 'b1', false)], [0.3, (B) => B.sim.reset()], [0.6, pose(90, 120, 150, 60)], [1.2, (B) => btn(B, 'b2', true)], [1.5, (B) => btn(B, 'b2', false)]]) };
  const r = play(l, acts, 45); frames(r.B, 2); ok(r.done, `armrecord: plays end to end — ${r.log.join(' | ')}`);
  ok(r.B.rt.serLines.includes('Done') && r.B.sim.flags.has('placed'), `armrecord: PLAY did the whole job from memory (${r.B.sim.cube.p.map(Math.round)})`);
  ok(/Memory full!/.test(r.B.ser), 'armrecord: the first program said "Memory full!" after three poses');
  const M = build(l, (s) => (s.wire[0] === 'b1.L1' ? ['b1.L1', 'D7'] : s.wire)); const c = M.rt.runCheck();
  ok(!!c && /pin 2/.test(say(c)), `armrecord: RECORD on pin 7 -> the check says ${JSON.stringify(say(c)).slice(0, 90)}`);
}
console.log(fails ? `${fails} FAILED` : 'all ok'); process.exit(fails ? 1 : 0);
