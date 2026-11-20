// DUET Robotics Lab 360, batch 17 (robotics/js/lessons17.js): the Class 9 sessions end to end, without a browser.
// The bench is built as a student builds it (setup, then each place / wire step at its ghost); the program runs on the
// virtual board (MicroPython on the Pico, C++ on the Uno); the scene beside the bench (scenes3.js) reacts; every step's
// own condition must come true, as in the app:
//   pico_keylock   1234# opens the locker; three wrong passwords lock the keypad; the edit sets a new password, which opens
//   pico_gasalarm  the heater warms up; 30 % leak -> alarm; leak off + window open -> safe (and GP26 stays under 3.3 V)
//   banklocker     a PIN without the card -> "Card first!"; the blue tag -> "Unknown card"; card + PIN opens; new PIN
// Mistakes: the keypad's rows and columns crossed (keys come out wrong); the MQ-2's AO straight to GP26 (the check names
// it, and the pin sees more than 3.3 V); the bank keypad on pins 9–12 (the check names it).     node devtools/test/robocore17.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { makeScene } from '../../robotics/js/scenes3.js';
import { CarSim } from '../../robotics/js/robots.js';
import { BO } from '../../robotics/js/parts2.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L17 = LESSONS.filter((l) => l.batch === 17);
ok(L17.length === 6 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L17.length} lessons in batch 17, ids unique`);

function build(l, extra) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  let sim; if (l.scene) { sim = makeScene(l.scene); app.world = { flag: (n) => sim.flag(n), val: (n) => sim.val(n), onRun: () => sim.onRun(lab) }; }
  else { // a robot car (robots.js CarSim): driven by the bench's motors, its sensors fed back as worlds.js does
    const car = new CarSim(l.world.car); const w = (t) => { const p = lab.byTag(t); return p ? p.state.w / BO.gear * BO.rw : 0; };
    sim = { car, flags: car.flags, res: {}, flag: (n) => car.flags.has(n), update(dt) { car.update(dt, w('mL'), w('mR'));
      if (l.world.car === 'line') { const q = car.sensors(); for (const [t, bk] of [['irL', q.L], ['irR', q.R]]) { const p = lab.byTag(t); if (p) { p.state.ext = true; const d = bk ? 40 : 1; if (p.state.dist !== d) { p.state.dist = d; lab.stateV++; lab.instKey = null; } } } }
      if (l.world.car === 'avoid') { const sv = lab.byTag('sv1'), us = lab.byTag('us1'); if (us) { us.state.ext = true; us.state.dist = car.usCm(sv ? sv.state.angle : 90); } } } };
    app.world = { flag: (n) => car.flags.has(n), val: (n) => car[n], onRun: () => car.reset() };
  }
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const w = (extra && extra(s)) || s.wire; const g = rt.ghostWire(w); if (!g) { ok(false, `${l.id}: a ghost wire for ${w}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(w[0], w[1])) ok(false, `${l.id}: wire ${w} joins`); }
  }
  if (l.scene) for (let f = 0; f < 4 * 60; f++) { lab.step(1000 / 60); sim.update(1 / 60, lab); } // the time the student spends wiring
  return { lab, app, rt, sim, l, ser: '', buf: '', t: 0 };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt, sim } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); sim.update(dt, lab); rt.update(dt); B.t += dt;
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.ser += s; B.buf += s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err).slice(0, 300));
    if (until && until(B)) return true;
  }
  return false;
}
const script = (list) => { const done = new Set(); return (t, B) => list.forEach(([at, f], i) => { if (t >= at && !done.has(i)) { done.add(i); f(B); } }); };
const keys = (str, at = 0.4, gap = 0.6) => [...str].map((k, i) => [at + i * gap, (B) => B.sim.press(B.lab, k)]);
const ctl = (id) => (B) => B.sim.control(id, null, B.lab);
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.t; const done = frames(B, 150, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  flags ${[...B.sim.flags].join(',')} res ${JSON.stringify(B.sim.res)} odo ${B.sim.car ? Math.round(B.sim.car.odo) : ''} serial ${JSON.stringify(B.rt.serLines.slice(-4))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what/.test(x)) };
}
const ix = (l, re) => l.steps.findIndex((s) => (s.k === 'act' || s.k === 'watch') && re.test(s.do.en));
const T = {
  pico_keylock(l) {
    const acts = { [ix(l, /type 1 2 3 4/)]: script(keys('1234#')), [ix(l, /three wrong/)]: script(keys('1111#5555#9999#', 5, 0.5).map(([t, f], i) => [t + Math.floor(i / 5) * 1.2, f])) /* (after the 4 s the locker stays open) */, [ix(l, /new password/)]: script(keys('2580#')) };
    const r = play(l, acts); ok(r.done, `pico_keylock: plays end to end — ${r.log.join(' | ')}`);
    ok(/\*\*\*\*/.test(r.B.ser) && !/1234|2580/.test(r.B.ser.replace(/Wrong password \d/g, '')), 'pico_keylock: the Serial Monitor shows stars, never the password');
    // the mistake: rows and columns crossed (R1–R4 on GP10–GP13, C1–C4 on GP6–GP9) -> the check says so, and 1234# does not open
    const sw = { 'kp.R1': 'GP10', 'kp.R2': 'GP11', 'kp.R3': 'GP12', 'kp.R4': 'GP13', 'kp.C1': 'GP6', 'kp.C2': 'GP7', 'kp.C3': 'GP8', 'kp.C4': 'GP9' };
    const M = build(l, (s) => (sw[s.wire[0]] ? [s.wire[0], sw[s.wire[0]]] : null)); const c = M.rt.runCheck();
    start(M, l.code); frames(M, 2); frames(M, 8, null, script(keys('1234#')));
    ok(!!c && /GP6–GP9/.test(c[0].en) && !M.sim.flag('opened'), `pico_keylock: rows and columns crossed -> the check says so, and 1234# does not open (typed ${JSON.stringify(M.ser.split(/\r?\n/).filter(Boolean).slice(-3))})`);
  },
  pico_gasalarm(l) {
    const acts = { [ix(l, /open the gas leak/)]: script([[0.3, (B) => B.sim.control('leak', 30)]]), [ix(l, /Close the leak/)]: script([[0.3, (B) => { B.sim.control('leak', 0); B.sim.control('win', '1'); }]]) };
    const r = play(l, acts); ok(r.done, `pico_gasalarm: plays end to end — ${r.log.join(' | ')}`);
    const v = r.B.rt.serLines.map((x) => /^Gas (\d+)/.exec(x)).filter(Boolean).map((m) => +m[1]);
    ok(v.length && Math.max(...v) < 65535 && Math.max(...v) > 20000, `pico_gasalarm: readings from ${Math.min(...v)} to ${Math.max(...v)}, under the ADC's top`);
    const last = l.steps[l.steps.length - 1].see.en; ok(/The highest reading was \d+/.test(last), 'pico_gasalarm: the last step reads the results: ' + last.slice(0, 80));
    // the mistake: AO straight to GP26 (no divider)
    const M = build(l, (s) => (s.wire[0] === 'mq.AO' ? ['mq.AO', 'GP26'] : null)); const c = M.rt.runCheck();
    ok(!!c && /straight to GP26/.test(c[0].en), `pico_gasalarm: AO straight to GP26 -> the check says ${JSON.stringify(c && c[0].en).slice(0, 70)}`);
  },
  smarttank(l) {
    const set = (k, v) => (B) => B.sim.control(k, v);
    const acts = { [ix(l, /open the taps/)]: script([[0.3, set('tap', '1')]]), [ix(l, /sump to Empty/)]: script([[0.3, set('sump', '0')]]), [ix(l, /supply is back/)]: script([[0.3, set('sump', '1')]]) };
    const r = play(l, acts); ok(r.done, `smarttank: plays end to end — ${r.log.join(' | ')}`);
    ok(/Pump OFF: tank full/.test(r.B.ser) && /DRY RUN!/.test(r.B.ser) && !r.B.sim.flag('overflow'), `smarttank: full stop, a dry-run stop, and never an overflow (levels ${r.B.sim.res.min}–${r.B.sim.res.max} %)`);
    const last = l.steps[l.steps.length - 1].see.en; ok(/the pump now starts at \d+ %/.test(last), 'smarttank: the last step reads the results: ' + last.slice(0, 80));
    // a mistake in the program: high = 105 (the tank can never reach it) -> it overflows
    const O = build(l); O.sim.h = 20; start(O, l.code.replace('int high = 90;', 'int high = 105;')); frames(O, 40, (b) => b.sim.flag('overflow'));
    ok(O.sim.flag('overflow'), 'smarttank: with high = 105 the pump never stops, and the tank overflows');
    // the sensor not wired: it reads 0 cm, a "full" tank, so the pump never starts while the tank empties
    const N = build(l, (s) => (s.wire[0] === 'us1.ECHO' ? ['us1.ECHO', 'D11'] : null)); const c = N.rt.runCheck(); N.sim.control('tap', '1'); start(N, l.code); frames(N, 45);
    ok(!!c && !N.sim.flag('pumpOn') && N.sim.h < 5, `smarttank: Echo on the wrong pin -> the check says so, and the tank runs empty (${Math.round(N.sim.h)} %) with the pump off`);
  },
  pico_linecar(l) {
    const r = play(l); ok(r.done, `pico_linecar: plays end to end — ${r.log.join(' | ')}`);
    const c = r.B.sim.car; ok(c.lap.n >= 1 && c.lap.best > 0, `pico_linecar: ${c.lap.n} laps at 85 %, best ${c.lap.best && c.lap.best.toFixed(1)} s`);
    // the mistake: an IR sensor on VBUS (5 V)
    const M = build(l, (s) => (s.wire[0] === 'irL.VCC' ? ['irL.VCC', 'rail:tp'] : null)); const k = M.rt.runCheck();
    ok(!!k && /5 V/.test(k[0].en), `pico_linecar: a sensor on 5 V -> the check says ${JSON.stringify(k && k[0].en).slice(0, 70)}`);
  },
  pico_avoidcar(l) {
    const r = play(l); ok(r.done, `pico_avoidcar: plays end to end — ${r.log.join(' | ')}`);
    const d = r.B.rt.serLines.map(Number).filter((x) => x > 0); ok(d.length > 10 && Math.min(...d) < 30, `pico_avoidcar: the Pico read the distances through the divider (${Math.min(...d)}–${Math.max(...d)} cm)`);
    const M = build(l, (s) => (s.wire[0] === 'rd2.1' ? ['us1.ECHO', 'GP13'] : null)); const k = M.rt.runCheck();
    ok(!!k && /straight to GP13/.test(k[0].en), `pico_avoidcar: Echo straight to GP13 -> the check says ${JSON.stringify(k && k[0].en).slice(0, 70)}`);
  },
  banklocker(l) {
    const acts = { [ix(l, /without a card/)]: script(keys('4321#')), [ix(l, /blue tag/)]: script([[0.4, ctl('tag')]]), [ix(l, /Now the owner/)]: script([[0.4, ctl('card')], ...keys('4321#', 2.2)]), [ix(l, /new PIN/)]: script([[0.4, ctl('card')], ...keys('8642#', 2.2)]) };
    const r = play(l, acts); ok(r.done, `banklocker: plays end to end — ${r.log.join(' | ')}`);
    ok(/Card first!/.test(r.B.ser) && /Unknown card 5B 2E 91 C4/.test(r.B.ser) && /Card OK/.test(r.B.ser), 'banklocker: the Serial Monitor shows each case');
    // card + three wrong PINs -> the alarm
    const A = build(l); start(A, l.code); frames(A, 1); const sc = []; for (let k = 0; k < 3; k++) sc.push([0.4 + k * 5, ctl('card')], ...keys('1111#', 1.6 + k * 5, 0.45));
    frames(A, 25, (b) => /blocked/.test(b.ser), script(sc)); if (!/ALARM/.test(A.ser)) console.log('     ', JSON.stringify(A.ser.split(/\r?\n/).filter(Boolean))); ok(/Wrong PIN 3/.test(A.ser) && /ALARM! Locker blocked/.test(A.ser), 'banklocker: the card with three wrong PINs sounds the alarm');
    // the mistake: rows and columns swapped
    const sw = { 'kp.R1': 'D5', 'kp.R2': 'D4', 'kp.R3': 'D3', 'kp.R4': 'D2', 'kp.C1': 'A0', 'kp.C2': 'A1', 'kp.C3': 'A2', 'kp.C4': 'A3' };
    const M = build(l, (s) => (sw[s.wire[0]] ? [s.wire[0], sw[s.wire[0]]] : null)); const c = M.rt.runCheck();
    ok(!!c && /A0–A3/.test(c[0].en), `banklocker: rows and columns swapped -> the check says ${JSON.stringify(c && c[0].en).slice(0, 70)}`);
  },
};
for (const l of L17) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 17: ${fails} failed` : 'batch 17: all passed');
process.exit(fails ? 1 : 0);
