// DUET Robotics Lab 360, batch 2 (robots): every new lesson, end to end, without a browser. The lesson's bench is built
// as a student would (setup, then each place / wire step at its ghost), its sketch is compiled and run on the virtual
// Uno, and the robot (robots.js) is driven by the bench's real servos and motors; its sensors feed the bench back.
// Checks that each sketch does what the lesson says (and that the "tuning" edits change the behaviour as promised).
//   node devtools/test/robocore2.mjs [lesson,...]      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, BY_ID } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { ArmSim, CarSim, BinSim, HydSim } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const NEW = LESSONS.filter((l) => l.world && ['arm', 'car', 'bin', 'hyd'].includes(l.world.kind)); // (batch 2's lessons: the others have their own tests)
ok(NEW.length >= 10, `${NEW.length} new lessons (n ${NEW[0].n}–${NEW[NEW.length - 1].n}), ids unique: ${new Set(LESSONS.map((l) => l.id)).size === LESSONS.length}`);
for (const l of NEW) {
  const c = compile(l.code); ok(c.ok, `${l.id}: sketch compiles` + (c.ok ? (c.warnings.length ? ' (warnings: ' + c.warnings.map((w) => w.code).join(',') + ')' : '') : ' ' + JSON.stringify(c.errors)));
  for (const s of l.steps) for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${s.k} has ${k}.${lg}`);
  for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
}

// a light copy of worlds.js without the 3D: the robot reads the bench and writes the bench's sensors
function robotFor(lab, cfg) {
  if (!cfg) return null;
  if (cfg.kind === 'arm') {
    const sim = new ArmSim(cfg.level); const tags = ['svB', 'svS', 'svE', 'svG'];
    return { sim, step(dt) { const a = {}; ['b', 's', 'e', 'g'].forEach((k, i) => { const p = lab.byTag(tags[i]); a[k] = p ? p.state.angle : 90; }); sim.update(dt, a); const g = lab.byTag('svG'); if (g) g.state.limit = sim.limit; } };
  }
  if (cfg.kind === 'car') {
    const sim = new CarSim(cfg.car);
    return { sim, step(dt) {
      const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; }; sim.update(dt, w('mL'), w('mR'));
      if (cfg.car === 'line') { const s = sim.sensors(); for (const [t, b] of [['irL', s.L], ['irR', s.R]]) { const p = lab.byTag(t); if (p) { const d = b ? 40 : 1; if (p.state.dist !== d) { p.state.dist = d; lab.stateV++; lab.instKey = null; } } } }
      if (cfg.car === 'avoid') { const sv = lab.byTag('sv1'), us = lab.byTag('us1'); if (us) us.state.dist = sim.usCm(sv ? sv.state.angle : 90); }
    } };
  }
  if (cfg.kind === 'bin') { const sim = new BinSim(); const sv0 = lab.byTag('sv'); if (sv0) sv0.state.angle = 0; return { sim, step(dt) { const sv = lab.byTag('sv'), us = lab.byTag('us'); const d = Math.round(sim.update(dt, sv ? sv.state.angle : 0)); if (us) us.state.dist = d; } }; }
  if (cfg.kind === 'hyd') { const sim = new HydSim(); return { sim, step() { sim.update(); } }; }
  return null;
}
// build the lesson's bench as a student would, and keep a pretend app for LessonRT
function build(l) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  const robot = robotFor(lab, l.world); app.world = robot && { flag: (n) => robot.sim.flags.has(n), val: (n) => robot.sim[n], onRun: () => robot.sim.reset && robot.sim.reset() };
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt, robot };
}
function run(B, src, secs, each) {
  const { lab, app, rt, robot } = B; app.src = src; const c = compile(src); if (!c.ok) throw new Error(JSON.stringify(c.errors));
  lab.run(c); rt.onRun(src); const dt = 1 / 60; let ser = '';
  for (let f = 0; f < secs * 60; f++) { if (each) each(f * dt); lab.step(1000 * dt); if (robot) robot.step(dt); rt.update(dt); for (const o of lab.mcu.ser.take()) ser += String.fromCharCode(...o.bytes); if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err)); }
  return ser;
}
const edit = (src, set) => set.reduce((s, [re, v]) => s.replace(re, v), src);
const editOf = (l, i) => l.steps.filter((s) => s.k === 'edit')[i];

const T = {
  arm1(l, B) {
    ok(!B.rt.runCheck(), 'arm1: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    run(B, l.code, 4); ok(B.rt.servoMin('svB') < 35 && !B.robot.sim.flags.has('aimed'), `arm1: base goes to 30° (${Math.round(B.lab.byTag('svB').state.angle)}°)`);
    ok(B.lab.powered && B.lab.i5 < 0.3, `arm1: the servo runs on the adapter, the USB carries ${Math.round(B.lab.i5 * 1000)} mA`);
    run(B, edit(l.code, editOf(l, 0).set), 4); ok(B.robot.sim.flags.has('aimed'), 'arm1: base.write(120) points at the flag');
  },
  arm2(l, B) { run(B, l.code, 3); ok(!B.robot.sim.flags.has('touched'), `arm2: 60° misses the ball (${B.robot.sim.ballD} mm)`); run(B, edit(l.code, editOf(l, 0).set), 3); ok(B.robot.sim.flags.has('touched'), `arm2: 100° touches it (${B.robot.sim.ballD} mm)`); },
  arm3(l, B) { run(B, l.code, 3.5); ok(!B.robot.sim.flags.has('touched'), `arm3: elbow 90° misses (${B.robot.sim.ballD} mm)`); run(B, edit(l.code, editOf(l, 0).set), 3.5); ok(B.robot.sim.flags.has('touched'), `arm3: elbow 120° touches (${B.robot.sim.ballD} mm)`); },
  arm4(l, B) {
    run(B, l.code, 12); const S = B.robot.sim; ok(S.flags.has('grabbed') && S.flags.has('released') && !S.flags.has('placed'), `arm4: grabs at A, lets go in front, not at B (block at ${S.cube.p.map(Math.round)})`);
    const g = B.lab.byTag('svG'); void g;
    run(B, edit(l.code, editOf(l, 0).set), 12); ok(S.flags.has('placed'), `arm4: with base 40 the block lands at B (${S.cube.p.map(Math.round)}, B ${S.B.map(Math.round)})`);
  },
  arm5(l, B) {
    const js = B.lab.byTag('js'); ok(!!js, 'arm5: joystick placed');
    run(B, l.code, 4.5, (t) => { js.state.x = t > 0.5 && t < 2.3 ? 1 : 0.5; js.state.y = t > 2.5 && t < 4 ? 1 : 0.5; B.lab.stateV++; B.lab.instKey = null; });
    ok(B.rt.servoRange('svB') > 80, `arm5: holding the stick right turns the base ${Math.round(B.rt.servoRange('svB'))}°`);
    ok(B.rt.servoRange('svS') > 50, `arm5: holding it up lifts the shoulder ${Math.round(B.rt.servoRange('svS'))}°`);
  },
  linecar(l, B) {
    ok(!B.rt.runCheck(), 'linecar: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const S = B.robot.sim; run(B, l.code, 40); ok(S.flags.has('lap') && !S.flags.has('lost'), `linecar: speed 110 follows the line: ${S.lap.n} laps, best ${S.lap.best && S.lap.best.toFixed(1)} s, lost ${S.flags.has('lost')}`);
    const fast = edit(l.code, editOf(l, 0).set); run(B, fast, 25); ok(S.flags.has('lost'), `linecar: speed 220 with turn 0 loses the line (laps ${S.lap.n})`);
    run(B, edit(fast, editOf(l, 1).set), 40); ok(S.flags.has('lap') && !S.flags.has('lost'), `linecar: 220 with turn = -speed / 2 keeps it: ${S.lap.n} laps, best ${S.lap.best && S.lap.best.toFixed(1)} s`);
    // no common ground: the car does not move
    const B2 = build(l); const dg = 'T:' + B2.lab.byTag('drv').uid + ':GND'; const w = B2.lab.wires.find((x) => (x.a === dg && x.b.startsWith('B:')) || (x.b === dg && x.a.startsWith('B:'))); B2.lab.removeWire(w);
    run(B2, l.code, 3); ok(B2.robot.sim.odo < 5, `linecar: without the common ground the car stays put (${Math.round(B2.robot.sim.odo)} mm)`);
  },
  avoidcar(l, B) {
    const S = B.robot.sim; let out = run(B, l.code, 60); ok(S.flags.has('explored') && S.exploredBumps === 0, `avoidcar: safe 30 explores with no bump: ${(S.odo / 1000).toFixed(1)} m, ${S.turns} turns, ${S.bumps} bumps`);
    ok(/\d+\r\n/.test(out), 'avoidcar: prints the distance on the Serial Monitor');
    const close = edit(l.code, editOf(l, 0).set); run(B, close, 30); ok(S.flags.has('bump'), `avoidcar: safe 3 bumps (${S.bumps})`);
    run(B, edit(close, editOf(l, 1).set), 60); ok(S.flags.has('explored') && S.exploredBumps === 0, `avoidcar: safe 25 explores with no bump: ${(S.odo / 1000).toFixed(1)} m, ${S.turns} turns, ${S.bumps} bumps`);
  },
  smartbin(l, B) {
    ok(!B.rt.runCheck(), 'smartbin: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const S = B.robot.sim; ok(B.lab.byTag('sv').state.angle === 0, 'smartbin: the lid starts shut');
    let out = run(B, l.code, 2); ok(/1[78]\d\r\n/.test(out), 'smartbin: the sensor hears the far wall (about 180 cm): ' + JSON.stringify(out.slice(-12)));
    S.wave(); run(B, l.code, 7, (t) => { if (t < 1 / 30) S.wave(); }); ok(S.flags.has('missed') && !S.flags.has('binned'), `smartbin: openCm 5 misses the hand at 10 cm (lid ${Math.round(S.lid)}°)`);
    run(B, edit(l.code, editOf(l, 0).set), 9, (t) => { if (t < 1 / 30) S.wave(); }); ok(S.flags.has('binned'), 'smartbin: openCm 20 opens in time: the paper drops in');
    ok(S.flags.has('closed'), `smartbin: the lid shuts by itself when the hand has gone (lid ${Math.round(S.lid)}°)`);
    ok(B.rt.lesson.done(B.rt), 'smartbin: lesson done');
  },
  btcar(l, B) {
    ok(!B.rt.runCheck(), 'btcar: the circuit check passes: ' + JSON.stringify(B.rt.runCheck() || ''));
    const S = B.robot.sim, bt = B.lab.byTag('bt'); const send = (k) => B.lab.btSend(k);
    run(B, l.code, 0.5); ok(bt.state.powered, 'btcar: the HC-05 has power'); ok(send('F') === 'unpaired', 'btcar: letters need pairing first');
    bt.state.paired = true; B.lab.stateV++;
    const drive = (src, plan) => { // plan: [letter, until(S)] in turn; each letter is sent once, then S
      let i = 0, sent = false; run(B, src, 40, (t) => { if (i >= plan.length || t < 0.3) return; const [k, until] = plan[i]; if (!sent) { const r = send(k); if (r !== 'ok') throw new Error('send ' + k + ': ' + r); sent = true; } if (until(S)) { send('S'); i++; sent = false; } });
      return i; };
    const PI = Math.PI;
    let n = drive(edit(l.code, editOf(l, 0).set), [['F', (s) => s.x > 372], ['L', (s) => s.h > PI - 0.1], ['F', (s) => s.z < 50], ['S', (s) => s.t > 0 && Math.abs(s.vl) + Math.abs(s.vr) < 2]]);
    ok(S.flags.has('fwd') && (S.flags.has('left') || S.flags.has('right')), `btcar: F and L drive and spin it (${n} moves)`);
    ok(S.flags.has('parked'), `btcar: speed 120 parks in P (car at ${Math.round(S.x)}, ${Math.round(S.z)}, ${Math.round(S.h * 180 / PI)}°)`);
    ok(B.rt.lesson.done(B.rt), 'btcar: lesson done');
    // TXD on pin 1: the letters do not arrive
    const B2 = build(l); const w = B2.lab.wires.find((x) => x.a === 'B:D0' || x.b === 'B:D0'); const other = w.a === 'B:D0' ? w.b : w.a; B2.lab.removeWire(w); B2.lab.addWire(other, 'B:D1');
    ok(JSON.stringify(B2.rt.runCheck() || '').includes('pin 1'), 'btcar: TXD on TX is caught by the check'); run(B2, l.code, 0.3); B2.lab.byTag('bt').state.paired = true; ok(B2.lab.btSend('F') === 'crossed', 'btcar: and the letter does not reach the sketch');
  },
  hydarm(l, B) {
    const S = B.robot.sim; const push = (m, sl, fl) => { S.master = m; S.slave = sl; S.fluid = fl || 'water'; for (let p = 0; p <= 1.001; p += 0.05) { S.push = p; S.update(); } return S; };
    push(10, 10); ok(S.flags.has('lifted') && Math.abs(S.F1 - S.F2) < 0.3, `hydarm: 10 → 10 mL lifts, F1 ${S.F1.toFixed(1)} N ≈ F2 ${S.F2.toFixed(1)} N, arm ${Math.round(S.phi)}°`);
    push(5, 20); const r1 = S.F2 / S.F1; ok(S.flags.has('smallPush') && S.F1 < S.F2 / 2 && S.d2 < S.d1 / 2, `hydarm: 5 → 20 mL: F1 ${S.F1.toFixed(1)} N lifts F2 ${S.F2.toFixed(1)} N (×${r1.toFixed(1)}), d1 ${Math.round(S.d1)} → d2 ${Math.round(S.d2)} mm`);
    push(20, 5); ok(S.flags.has('bigPush') && S.F1 > S.F2, `hydarm: 20 → 5 mL: F1 ${S.F1.toFixed(1)} N > F2 ${S.F2.toFixed(1)} N, arm ${Math.round(S.phi)}°`);
    const phiW = (push(10, 10), S.phi); push(10, 10, 'air'); ok(S.flags.has('airTried') && S.phi < phiW - 8, `hydarm: air squeezes: arm ${Math.round(S.phi)}° against ${Math.round(phiW)}° with water`);
    let out = run(B, l.code, 1); const f2 = +((out.match(/F2 = ([\d.]+)/) || [])[1]); ok(Math.abs(f2 - 25.3) < 0.2, `hydarm: the sketch prints F2 = ${f2} N for 5 → 20 mL`);
    out = run(B, edit(l.code, editOf(l, 0).set), 1); const f2b = +((out.match(/F2 = ([\d.]+)/) || [])[1]); ok(Math.abs(f2b - 3.95) < 0.1, `hydarm: swapped, F2 = ${f2b} N`);
    ok(B.rt.lesson.done(B.rt), 'hydarm: lesson done');
  },
};
for (const l of NEW) {
  if (only && !only.includes(l.id)) continue;
  if (!T[l.id]) { console.log('--   ' + l.id + ': no headless test (yet)'); continue; }
  const t0 = Date.now();
  try { const B = build(l); T[l.id](l, B); } catch (e) { ok(false, `${l.id}: ${e.message}`); console.log(e.stack.split('\n').slice(0, 4).join('\n')); }
  console.log(`     ${l.id} ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
void BY_ID;
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
