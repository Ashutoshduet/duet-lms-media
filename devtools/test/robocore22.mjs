// DUET Robotics Lab 360, batch 22 (robotics/js/parts22.js, lessons22.js): the small digital sensor modules, without a browser.
//   1. each module on the Uno bench: powered, OUT HIGH at rest, LOW while it senses (a held one) or for a moment (a clap,
//      a knock), and its OUT reads 0 on an Uno pin; without power it reads nothing;
//   2. drowsy: the bench built as a student builds it, the sketch runs, two blinks both sound the alarm (sleepy = 0); the
//      edit (sleepy = 2000) keeps blinks quiet; eyes closed for 3 s sound it, and opening them stops it;
//   3. mistakes: OUT on pin 6 (the check names it, and closed eyes never sound the alarm); VCC left off (the check says so).
//   node devtools/test/robocore22.mjs      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { TYPES22, KINDS22, sense22, blink22 } from '../../robotics/js/parts22.js';

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L22 = LESSONS.filter((l) => l.batch === 22);
ok(L22.length === 1 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L22.length} lesson in batch 22, ids unique`);

// 1 ------------------------------------------------------------------ the modules
for (const type of TYPES22) {
  const lab = new Lab(); const p = lab.addPart(type, {}, { x: 110, z: 85 }, 2, 'm1');
  if (!p) { ok(false, `${type}: fits on the mat`); continue; }
  const read = (src) => src;
  const T = (pin) => 'T:' + p.uid + ':' + pin;
  lab.addWire('B:5V', 'H:tp30'); lab.addWire('B:GND3', 'H:tn18');
  const SK = `void setup(){ pinMode(7, INPUT); Serial.begin(9600); }\nvoid loop(){ Serial.println(digitalRead(7)); delay(20); }`;
  // unpowered first: OUT wired, VCC/GND not
  lab.addWire(T('OUT'), 'B:D7');
  const c = compile(read(SK), lab.def); if (!c.ok) { ok(false, `${type}: compiles`); continue; }
  lab.run(c); let out = ''; const run = (s) => { for (let f = 0; f < s * 60; f++) { lab.step(1000 / 60); for (const o of lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); } const ls = out.trim().split(/\r?\n/); return ls[ls.length - 1]; };
  run(0.3); const unpowered = !p.state.powered;
  lab.addWire(T('VCC'), 'H:tp40'); lab.addWire(T('GND'), 'H:tn40');
  const rest = run(0.3); const powered = !!p.state.powered;
  sense22(lab, p, true); const on = run(0.1); let afterLines = out.trim().split(/\r?\n/);
  const K = KINDS22[type]; let ok2;
  if (K.hold) { const held = run(1.0); sense22(lab, p, false); const back = run(0.2); ok2 = on === '0' && held === '0' && back === '1'; }
  else { const later = run(0.8); ok2 = on === '0' && later === '1'; }
  ok(unpowered && powered && rest === '1' && ok2 && p.state.count >= 1, `${type}: no power -> off; powered -> OUT HIGH at rest, LOW while ${K.act.en}${K.hold ? '' : ' (for a moment)'}; counted ${p.state.count}`);
}
{ // a blink is a short pulse on the eye sensor
  const lab = new Lab(); const p = lab.addPart('blink', {}, { x: 110, z: 85 }, 2, 'e'); lab.addWire('B:5V', 'H:tp30'); lab.addWire('B:GND3', 'H:tn18'); lab.addWire('T:' + p.uid + ':VCC', 'H:tp40'); lab.addWire('T:' + p.uid + ':GND', 'H:tn40');
  for (let f = 0; f < 10; f++) lab.step(1000 / 60); blink22(lab, p); let on = 0; for (let f = 0; f < 60; f++) { lab.step(1000 / 60); if (p.state.pulse > 0) on++; }
  ok(on >= 7 && on <= 10 && !p.state.trig, `blink: a blink keeps the eye shut for ${(on / 60).toFixed(2)} s`);
}

// 2 ------------------------------------------------------------------ drowsy
function build(l, extra) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} fits`); } }
    if (s.k === 'wire') { const w = extra ? extra(s) : s.wire; if (!w) continue; const g = rt.ghostWire(w); if (!g) { ok(false, `${l.id}: a ghost wire for ${w}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(w[0], w[1])) ok(false, `${l.id}: wire ${w} joins`); }
  }
  return { lab, app, rt, l, ser: '', buf: '', t: 0 };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(f * dt, B); lab.step(1000 * dt); rt.update(dt); B.t += dt;
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.ser += s; B.buf += s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err).slice(0, 300));
    if (until && until(B)) return true;
  }
  return false;
}
const script = (list) => { const done = new Set(); return (t, B) => list.forEach(([at, f], i) => { if (t >= at && !done.has(i)) { done.add(i); f(B); } }); };
const eye = (B) => B.lab.byTag('eb1');
const blinks = (k, at = 0.5, gap = 1.2) => Array.from({ length: k }, (_, i) => [at + i * gap, (B) => blink22(B.lab, eye(B))]);
function play(l, acts = {}) {
  const B = build(l); let src = l.code; const log = [];
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') { start(B, src); frames(B, 0.5); }
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); frames(B, 0.5); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.t; const done = frames(B, 30, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} in ${(B.t - t0).toFixed(1)} s`);
      if (!done) { log.push(`  mem ${JSON.stringify(B.rt.memRun)} serial ${JSON.stringify(B.rt.serLines.slice(-4))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what/.test(x)) };
}
const say = (c) => (c ? c[0].en.replace(/\{(\w+)\}/g, (m, k) => { const a = (c[1] || {})[k]; return a && typeof a === 'object' ? a.en : String(a); }) : '');
const ix = (l, re) => l.steps.findIndex((s) => (s.k === 'act' || s.k === 'watch') && re.test(s.do.en));
{
  const l = L22.find((x) => x.id === 'drowsy');
  const acts = { [ix(l, /press 😉 Blink/)]: script(blinks(3)), [ix(l, /Blink two or three times again/)]: script(blinks(3)),
    [ix(l, /nodding off/)]: script([[0.5, (B) => sense22(B.lab, eye(B), true)], [3.6, (B) => sense22(B.lab, eye(B), false)]]) };
  const r = play(l, acts); ok(r.done, `drowsy: plays end to end — ${r.log.join(' | ')}`); frames(r.B, 0.5);
  const ms = r.B.rt.serLines.map((x) => /^Blink \d+: eyes closed (\d+) ms$/.exec(x)).filter(Boolean).map((m) => +m[1]);
  ok(ms.length >= 3 && ms.slice(0, -1).every((v) => v >= 100 && v <= 250) && ms[ms.length - 1] >= 2900, `drowsy: the Serial Monitor times each closure (${ms.join(', ')} ms)`);
  ok(r.B.rt.serLines.filter((x) => x === 'WAKE UP!').length === 1, 'drowsy: after the edit, one WAKE UP! (the long closure), none for the blinks');
  const last = l.steps[l.steps.length - 1].see.en; ok(/Your results: quiet blinks/.test(last), 'drowsy: the last step reads the results: ' + last.slice(0, 60));
  ok(r.B.rt.mem.falseSeen, 'drowsy: the first run showed the false alarm at every blink');
  // the mistakes: OUT on pin 6 -> the check names it, and closed eyes never sound the alarm; VCC not wired -> the check says so
  const M = build(l, (s) => (s.wire[0] === 'eb1.OUT' ? ['eb1.OUT', 'D6'] : s.wire)); const c = M.rt.runCheck();
  start(M, l.code.replace('sleepy = 0;', 'sleepy = 2000;')); frames(M, 0.5); sense22(M.lab, M.lab.byTag('eb1'), true); frames(M, 3);
  ok(!!c && /OUT pin must be joined to pin 7/.test(say(c)) && !M.lab.byTag('bz1').state.on && !/WAKE UP/.test(M.ser), `drowsy: OUT on pin 6 -> the check says ${JSON.stringify(say(c))}, and no alarm`);
  const V = build(l, (s) => (s.wire[0] === 'eb1.VCC' ? null : s.wire)); const v = V.rt.runCheck();
  start(V, l.code.replace('sleepy = 0;', 'sleepy = 2000;')); frames(V, 0.5); sense22(V.lab, V.lab.byTag('eb1'), true); frames(V, 3);
  ok(!!v && /VCC pin must be joined to 5V/.test(say(v)) && !V.lab.byTag('eb1').state.powered && !/WAKE UP/.test(V.ser), `drowsy: VCC not wired -> the check says ${JSON.stringify(say(v))}, and the sensor is dead`);
}
console.log(fails ? `${fails} FAILED` : 'all ok'); process.exit(fails ? 1 : 0);
