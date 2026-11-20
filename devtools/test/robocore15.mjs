// DUET Robotics Lab 360, batch 15 (robotics/js/lessons15.js): the Class 10 Raspberry Pi 4 projects end to end, without a
// browser: the bench built at its ghosts, "Check my circuit", the Python run on the Pi (pi6.js) on the real circuit, and
// every step's own condition coming true as a student plays it (pressing buttons, moving the block, typing in the
// terminal), the edit as the hint does it, and the lesson complete. Mistakes: the HC-SR04's Echo wired straight to the
// Pi (the check says so), team 3's button not wired (the check names it).     node devtools/test/robocore15.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, BY_ID, LESSON_WORDS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { batch15 } from '../../robotics/js/lessons15.js';
const t3 = (en, hi, hg) => ({ en, hi, hg });
const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
let L15 = LESSONS.filter((l) => l.batch === 15);
if (!L15.length) { L15 = batch15({ t3, P: (tag, type, props, hole, rot) => ({ tag, type, props: props || {}, at: { hole }, rot: rot || 0 }), F: (tag, type, props, x, z, rot) => ({ tag, type, props: props || {}, at: { x, z }, rot: rot || 0 }), W: LESSON_WORDS }, LESSONS.length); for (const l of L15) { LESSONS.push(l); BY_ID[l.id] = l; } }
ok(L15.length === 5 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L15.length} Pi 4 lessons in batch 15, ids unique`);

function build(l, skip) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id); if (lab.def.id !== 'pi4') lab.setBoard('pi4');
  for (const p of l.setup.parts) lab.addPart(p.type, p.props, p.at, p.rot, p.tag); for (const [a, b] of l.setup.wires) lab.addWire(a, b);
  for (const s of l.steps) {
    if (skip && skip(s)) continue;
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt, l, buf: '' };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); B.buf = ''; }
function frames(B, secs, until, each) {
  const dt = 1 / 60;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); B.lab.step(1000 * dt); B.rt.update(dt);
    for (const o of B.lab.mcu.ser.take()) { B.buf += String.fromCharCode(...o.bytes).replace(/\r/g, ''); let k; while ((k = B.buf.indexOf('\n')) >= 0) { B.rt.onSerialLine(B.buf.slice(0, k)); B.buf = B.buf.slice(k + 1); } }
    if (B.lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(B.lab.mcu.err).slice(0, 300));
    if (until && until(B)) return true;
  }
  return false;
}
const press = (tag, on) => (B) => { const b = B.lab.byTag(tag); if (b && !!b.state.pressed !== on) { b.state.pressed = on; B.lab.stateV++; B.lab.instKey = null; } };
const dist = (d) => (B) => { const u = B.lab.byTag('us1'); if (u && u.state.dist !== d) { u.state.dist = d; B.lab.stateV++; B.lab.instKey = null; } };
const pressWhenLit = (t, B) => { const lit = B.rt.ledLit('led1'); if (lit) { B.litT = B.litT ?? t; } else B.litT = undefined; press('b1', lit && t - B.litT > 0.15 && t - B.litT < 0.4)(B); };
const ACTS = {
  pi_reaction: [pressWhenLit, pressWhenLit],
  pi_distance: [(t, B) => dist(t < 2 ? 10 : 80)(B), (t, B) => dist(12)(B)],
  pi_quiz: [(t, B) => press('b3', t > 0.5 && t < 0.8)(B), (t, B) => press('b2', t > 0.5 && t < 0.8)(B)],
  pi_morse: [(t, B) => { if (!B.sent && t > 0.3) { B.lab.mcu.ser.send('SOS\n'); B.sent = 1; } }, (t, B) => { if (B.sent !== 2 && t > 0.3) { B.lab.mcu.ser.send('HI\n'); B.sent = 2; } }],
};
function play(l) {
  const B = build(l); let src = l.code; const log = []; const acts = (ACTS[l.id] || []).slice();
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); }
    if (s.k === 'watch' || s.k === 'act') {
      const f = s.k === 'act' ? acts.shift() : null; const t0 = B.rt.t; let done; for (const t of ['b1', 'b2', 'b3']) press(t, false)(B); // (a finger lifts between steps)
      try { done = frames(B, 60, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, f); } catch (e) { log.push(`step ${i}: ${e.message}`); break; }
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.rt.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  serial ${JSON.stringify(B.rt.serLines.slice(-4))} memRun ${JSON.stringify(B.rt.memRun)}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) };
}
for (const l of L15) {
  if (only && !only.includes(l.id)) continue;
  const c = compile(l.code, Object.assign({}, new Lab().def, { id: 'pi4' })); void c;
  for (const k of ['title', 'goal']) for (const lg of ['en', 'hi', 'hg']) if (!l[k][lg]) ok(false, `${l.id}: ${k}.${lg}`);
  try { const r = play(l); ok(r.done, `${l.id}: plays end to end — ${r.log.join(' | ')}`); } catch (e) { ok(false, `${l.id}: threw ${e.message}`); }
}
if (!only || only.includes('pi_distance')) { const l = BY_ID.pi_distance; const B = build(l, (s) => s.k === 'place' || (s.k === 'wire' && s.wire[1] === 'GPIO24')); B.lab.addWire('B:GPIO24', 'H:i47'); const r = B.rt.runCheck(); ok(r && /straight to GPIO 24/.test(r[0].en), `pi_distance: Echo straight to the Pi -> ${r && r[0].en.slice(0, 70)}`); }
if (!only || only.includes('pi_quiz')) { const l = BY_ID.pi_quiz; const B = build(l, (s) => s.k === 'wire'); const r = B.rt.runCheck(); ok(r && /team 3/.test(JSON.stringify(r[1] || {})), `pi_quiz: team 3's button not wired -> the check names it`); }
console.log(fails ? `batch 15: ${fails} failed` : 'batch 15: all passed');
process.exit(fails ? 1 : 0);
