// DUET Robotics Lab 360, the project factory (robotics/js/factory.js): every factory lesson end to end, without a browser.
//   1. the bench is built as a student builds it (setup, then each place / wire step at its ghost); "Check my circuit"
//      passes; the sketch compiles and runs; the sensor is made to do its job (on), then rests (off); the edit is the one
//      the step asks for; the last act proves the edit (a reading between the old and new limit, or a 3 s hold);
//      the lesson counts as complete;
//   2. a mistake: the sensor's signal wire left out -> "Check my circuit" names it, and the output never answers.
//   node devtools/test/robofactory.mjs [id,...]     (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS, BY_ID, LESSON_WORDS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { batchF, FACTORY } from '../../robotics/js/factory.js';
import { netOf } from '../../robotics/js/esp32.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0, passes = 0; const quiet = !only;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else { passes++; if (!quiet) console.log('ok   ' + m); } };
let FL = LESSONS.filter((l) => l.batch === 'F');
if (!FL.length) { FL = batchF({ W: LESSON_WORDS }, LESSONS.length); for (const l of FL) { LESSONS.push(l); BY_ID[l.id] = l; } }
ok(FL.length >= 50 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${FL.length} factory lessons, ids unique across all ${LESSONS.length}`);

function build(l, skipWire) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) {
    if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) { const p = lab.addPart(q.type, q.props, q.at, q.rot, q.tag); if (!p) ok(false, `${l.id}: place ${q.tag} (${q.type}) fits at its ghost`); } }
    if (s.k === 'wire') { if (skipWire && skipWire(s)) continue; const g = rt.ghostWire(s.wire); if (!g) { ok(false, `${l.id}: a ghost wire for ${s.wire}`); continue; } lab.addWire(g[0], g[1]); if (!rt.conn(s.wire[0], s.wire[1])) ok(false, `${l.id}: wire ${s.wire} joins`); }
  }
  return { lab, app, rt, l };
}
function step(B, dt) {
  const { lab, rt } = B; lab.step(1000 * dt); rt.update(dt);
  if (B.webOpen) { B.webT = (B.webT ?? 9) + dt; const N = netOf(lab); if (B.webT >= 2 && N.staIP()) { B.webT = 0; N.request(N.staIP() + (B.l && B.l.board === 'pi4' ? ':5000' : '') + '/', () => {}); } } // (batch 23: the Pi's Flask page is on port 5000)
  for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.ser = (B.ser || '') + s; B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
  if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err));
}
function start(B, src) { const { lab, app, rt } = B; const c = compile(src, lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); app.src = src; lab.run(c); rt.onRun(src); B.ser = ''; B.buf = ''; }
const acts = (l) => {
  const inp = (l.board === 'esp32' ? FACTORY.EIN : l.board === 'pico' ? FACTORY.PIN : l.board === 'pi4' ? FACTORY.QIN : FACTORY.IN)[l.factory.inp]; const set = (k) => (t, B) => { if (!inp.settle || t > inp.settle) inp.set(B, k); }; // (batch 26: a student waits while a sensor calibrates)
  const A = inp.analog ? [set('on'), set('off'), set('edge')] : [set('on'), set('off'), (t, B) => inp.set(B, t > 3 && t < 3.6 ? 'on' : 'off')]; // (a PIR ignores movement for a few seconds after its OUT falls);
  if (l.factory.out === 'bt') { const conn = (t, B) => { const N = netOf(B.lab); if (!N.bt.conn && N.btDevices().length) N.btConnect(N.btDevices()[0]); }; return l.board === 'esp32' ? [conn, A[0], A[1], conn, A[2]] : [conn, A[0], A[1], A[2]]; } // (batch 24: the phone connects in BT Terminal, and again after the edit's Run)
  return l.factory.out === 'web' ? [(t, B) => { B.webOpen = true; }, ...A] : A; // (batch 14: the web page: the phone opens it first, then refreshes it every 2 s)
};
function play(B) {
  const { l, rt } = B; let src = l.code; const A = acts(l); let ai = 0;
  for (const s of l.steps) {
    if (s.k === 'check') { const r = rt.runCheck(); ok(!r, `${l.id}: the circuit check passes` + (r ? ': ' + JSON.stringify(r[0].en) : '')); }
    if (s.k === 'run') start(B, src);
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); ok(s.test(e) && !s.test(src), `${l.id}: the edit is what the step asks`); src = e; start(B, src); }
    if (s.k === 'act' || s.k === 'watch') {
      const act = A[ai++]; let t = -1; const dt = 1 / 60;
      for (let f = 0; f < 60 * 45; f++) { if (act) act(f * dt, B); step(B, dt); let d = false; try { d = !!s.until(rt); } catch (e) { d = false; } if (d) { t = f * dt; break; } }
      ok(t >= 0, `${l.id}: act "${s.do.en.slice(0, 50)}" comes true` + (t >= 0 ? ` (${t.toFixed(1)} s)` : ' — timed out'));
      if (t < 0) { console.log('     serial: ' + JSON.stringify((B.ser || '').slice(-120)) + ' nums ' + rt.nums.slice(-3) + ' mem ' + JSON.stringify(rt.memRun) + ' fresh ' + rt.runSrc?.length + ' t ' + rt.t.toFixed(1) + ' freshAt ' + rt.freshAt + ' pir ' + JSON.stringify(B.lab.byTag('pir') && B.lab.byTag('pir').state) + ' led ' + rt.ledLit('led1')); return; }
      for (let f = 0; f < 12; f++) { if (act) act(1, B); step(B, dt); }
    }
  }
  let d = false; try { d = !!l.done(rt); } catch (e) { d = false; } ok(d, `${l.id}: the lesson counts as complete`);
}
// the mistake: the sensor's signal wire (to a board pin) is left out
function mistake(l) {
  const sig = l.steps.find((s) => s.k === 'wire' && s.wire.some((x) => /^(D\d+|A\d|GP\d+|GPIO\d+|adc\.CH\d|rg1\.1)$/.test(x))); // (batch 24: or the MCP3008's CH0, or the gas divider's top)
  const B = build(l, (s) => s === sig); const r = B.rt.runCheck();
  ok(!!r, `${l.id}: without ${sig.wire.join('–')} the check complains` + (r ? `: "${r[0].en.slice(0, 50)}…"` : ''));
}
const t0 = Date.now();
for (const l of FL) {
  if (only && !only.includes(l.id)) continue;
  try { play(build(l)); mistake(l); } catch (e) { ok(false, `${l.id}: ${String(e.message || e).slice(0, 200)}`); }
}
console.log(`factory: ${passes} ok, ${fails} failed, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(fails ? 1 : 0);
