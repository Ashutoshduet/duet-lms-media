// DUET Robotics Lab 360, batch 14: the project bank on the micro:bit (robotics/js/factorymb.js), every lesson end to end,
// without a browser, on a real MBCore with the real lesson runtime (LessonRT, its tick() and memory):
//   1. the crocodile clips go on as the steps say; "Check my circuit" passes; the program compiles and runs; the sensor
//      does its job (on), then rests (off); the edit is the one the step asks for; the last act proves it (a reading
//      between the old and the new limit, or a 3 s hold); the lesson counts as complete; the program goes to blocks
//      and back unchanged in meaning (it compiles again);
//   2. a mistake: the first clip left off -> "Check my circuit" names it (lessons with clips).
//   node devtools/test/robofactorymb.mjs [id,...]     (exit 1 on a failure)
import { Lab } from '../../robotics/js/sim.js';
import { MBCore } from '../../robotics/js/microbit.js';
import { LESSONS, BY_ID } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { batchFM, FACTORY_MB } from '../../robotics/js/factorymb.js';
import { fromPython, toPython } from '../../robotics/js/blocks5.js';
import { msg } from '../../robotics/js/i18n.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0, passes = 0; const quiet = !only;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else { passes++; if (!quiet) console.log('ok   ' + m); } };
let FL = LESSONS.filter((l) => l.batch === 'FM');
if (!FL.length) { FL = batchFM({}, LESSONS.length); for (const l of FL) BY_ID[l.id] = l; }
const ids = new Set([...LESSONS.map((l) => l.id), ...FL.map((l) => l.id)]);
ok(FL.length >= 50 && ids.size === LESSONS.filter((l) => l.batch !== 'FM').length + FL.length, `${FL.length} micro:bit bank lessons, ids unique`);

const DT = 1 / 60; let blkChanged = 0;
function desk(l) {
  const lab = new Lab(); const app = { lab, tapRegion: () => {}, setLight: (v) => { lab.env.light = v; }, code: () => app.src, onStepDone() {}, onLessonComplete() {} };
  const rt = new LessonRT(app); rt.open(l.id); const core = new MBCore(app, l.world); app.world = core; app.src = l.code;
  return { lab, app, rt, core, B: core.boards[0], t: 0, buf: '' };
}
function frame(D) {
  D.t += DT; D.lab.step(1000 * DT); D.core.update(DT); D.rt.update(DT);
  for (const o of D.lab.mcu.ser.take()) { D.buf += String.fromCharCode(...o.bytes).replace(/\r/g, ''); const ls = D.buf.split('\n'); D.buf = ls.pop(); for (const x of ls) D.rt.onSerialLine(x); }
}
function start(D, src) { const r = D.core.compile(src); if (!r.ok) throw new Error('compile: ' + msg(r.errors[0]) + ' @' + r.errors[0].line); D.app.src = src; D.lab.run(r); D.rt.onRun(src); }
const doIt = (l, what) => { // what the student does in the panel for 'on' | 'off' | 'edge' | 'again'
  const inp = FACTORY_MB.MIN[l.factory.inp];
  if (inp.digital) return (t, D) => { if (what === 'on') D.B.press('a', true); if (what === 'off') D.B.press('a', false); if (what === 'again') D.B.press('a', t > 0.3 && t < 0.5); };
  return (t, D) => { if (t < 0.05) D.core.control(inp.ctl, inp.set[what]); };
};
for (const l of FL) {
  if (only && !only.includes(l.id)) continue;
  const D = desk(l); let src = l.code; const log = []; let okAll = true; let phase = 0;
  const phases = ['on', 'off', FACTORY_MB.MIN[l.factory.inp].digital ? 'again' : 'edge'];
  try {
    for (const [i, s] of l.steps.entries()) {
      for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string' || (k === 'do' && !s[k][lg])) ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
      if (s.k === 'run') start(D, src);
      if (s.k === 'check') { const r = D.rt.runCheck(); if (r) { okAll = false; log.push(`step ${i}: the check says ${JSON.stringify(r[0].en)}`); break; } }
      if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { okAll = false; log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(D, src); }
      if (s.k === 'act') {
        let f = null; if (s.clip) D.core.addClip(s.clip[0], s.clip[1]); else f = doIt(l, phases[phase++]);
        const T0 = D.t; let done = false;
        for (let n = 0; n < 30 * 60; n++) { if (f) f(D.t - T0, D); frame(D); let d = false; try { d = !!s.until(D.rt); } catch (e) { d = false; } if (d) { done = true; break; } if (D.lab.mcu.state === 'error') break; }
        if (!done) { okAll = false; log.push(`step ${i} (${s.do.en.slice(0, 50)}) not done · img ${D.core.val('shownImg')} nums ${D.rt.nums.slice(-3)} memRun ${JSON.stringify(D.rt.memRun)} mcu ${D.lab.mcu.state} ${D.lab.mcu.err ? JSON.stringify(D.lab.mcu.err).slice(0, 200) : ''}`); break; }
      }
    }
  } catch (e) { okAll = false; log.push('threw ' + e.message); }
  ok(okAll && l.done(D.rt), `${l.id}: plays end to end${log.length ? ' — ' + log.join(' | ') : ''}`);
  // blocks and back
  try { const b = fromPython(l.code); const back = b ? toPython(b) : null; const r = back ? new MBCore({ lab: new Lab() }, l.world).compile(back) : null; ok(!!(r && r.ok), `${l.id}: opens as blocks and back${back && back.trim() !== l.code.trim() ? ' (changed)' : ''}`); if (back && back.trim() !== l.code.trim()) blkChanged++; } catch (e) { ok(false, `${l.id}: blocks threw ${e.message}`); }
  // a mistake: the first clip left off
  const c0 = l.steps.find((s) => s.clip);
  if (c0) { const M = desk(l); for (const s of l.steps) if (s.clip && s !== c0) M.core.addClip(s.clip[0], s.clip[1]); const r = M.rt.runCheck(); ok(!!r, `${l.id}: a missing clip is caught`); }
}
console.log(`micro:bit bank: ${passes} ok, ${fails} failed (${blkChanged} change a little in blocks: comments)`);
process.exit(fails ? 1 : 0);
