// DUET Robotics Lab 360, batch 21 (robotics/js/lessons21.js): the Pi 4 on the network and with RFID, without a browser.
//   pi_flask      the phone (esp32.js netOf: requests to the Pi's address) gets the page from Flask, turns the lamp on;
//                 app.run(port=5000) listens only on 127.0.0.1 and the phone is refused; host="0.0.0.0" again: off
//   pi_rfidsheet  Asha's card is marked, Ravi's tag is unknown until its number is in the dictionary, a second tap is
//                 "already marked"; attendance.csv has their rows. Mistake: SDA on the wrong pin -> read() waits and
//                 the terminal hint names the SPI0 pins.          node devtools/test/robocore21.mjs [id,...]
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { netOf } from '../../robotics/js/esp32.js';
import { rfidShow } from '../../robotics/js/parts3.js';

const only = process.argv[2] ? process.argv[2].split(',') : null;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L21 = LESSONS.filter((l) => l.batch === 21);
ok(L21.length === 3 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L21.length} lessons in batch 21, ids unique`);

function build(l, skip) {
  const lab = new Lab(); const app = { lab, code: () => app.src, world: null, onStepDone() {}, onLessonComplete() {} }; app.src = l.code;
  const rt = new LessonRT(app); rt.open(l.id);
  for (const s of l.steps) { if (skip && skip(s)) continue; if (s.k === 'place') { const q = s.place; if (!lab.byTag(q.tag)) lab.addPart(q.type, q.props, q.at, q.rot, q.tag); } if (s.k === 'wire') { const g = rt.ghostWire(s.wire); if (g) lab.addWire(g[0], g[1]); else ok(false, `${l.id}: a ghost wire for ${s.wire}`); } }
  return { lab, app, rt, l, t: 0 };
}
function start(B, src) { const c = compile(src, B.lab.def); if (!c.ok) throw new Error('compile ' + JSON.stringify(c.errors).slice(0, 300)); B.app.src = src; B.lab.run(c); B.rt.onRun(src); B.buf = ''; B.t = 0; }
function frames(B, secs, until, each) {
  const dt = 1 / 60; const { lab, rt } = B;
  for (let f = 0; f < secs * 60; f++) {
    if (each) each(B.t, B); B.t += dt; lab.step(1000 * dt); rt.update(dt);
    for (const o of lab.mcu.ser.take()) { const s = String.fromCharCode(...o.bytes); B.buf = (B.buf || '') + s.replace(/\r/g, ''); const ls = B.buf.split('\n'); B.buf = ls.pop(); for (const x of ls) rt.onSerialLine(x); }
    if (lab.mcu.state === 'error') throw new Error('runtime ' + JSON.stringify(lab.mcu.err) + ' ' + JSON.stringify(rt.serLines.slice(-3)));
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
      const done = frames(B, 60, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
      log.push(`step ${i} ${done ? 'done' : 'NOT DONE'} at ${B.t.toFixed(1)} s`);
      if (!done) { log.push(`  serial ${JSON.stringify(B.rt.serLines.slice(-4))}`); break; }
    }
  }
  return { B, log, done: !!l.done(B.rt) && !log.some((x) => /NOT DONE|check says|not what it asks/.test(x)) };
}
const at = (secs, f) => { let done = false; return (t, B) => { if (!done && t >= secs) { done = true; f(B); } }; };
const seq = (...fs) => (t, B) => fs.forEach((f) => f(t, B));
const get = (path) => (B) => { const N = netOf(B.lab); N.request(N.piIP() + ':5000' + path, () => {}); };
const T = {
  pi_flask(l) {
    const acts = {}; const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en));
    acts[ix(/type that address/)] = at(0.3, get('/'));
    acts[ix(/Turn ON/)] = at(0.3, get('/on'));
    acts[ix(/again \(tap the address/)] = at(0.5, get('/'));
    acts[ix(/Turn OFF/)] = seq(at(0.5, get('/on')), at(1.5, get('/off')));
    const r = play(l, acts); const N = netOf(r.B.lab); frames(r.B, 1);
    ok(r.done, `pi_flask: plays end to end — ${r.log.join(' | ')} · log ${JSON.stringify(r.B.lab.mcu.flask6 && r.B.lab.mcu.flask6.log)} · last error ${JSON.stringify(N.seen.lastErr && N.seen.lastErr.error)}`);
    ok(r.B.rt.serLines.some((x) => /"GET \/off HTTP\/1\.1" 200 -/.test(x)) && /The lamp is <b>OFF/.test((N.seen.last || {}).body || ''), 'pi_flask: Flask logs each visit, and the page says OFF');
  },
  pi_rfidsheet(l) {
    const acts = {}; const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en));
    acts[ix(/white card/)] = at(0.5, (B) => rfidShow(B.lab, 'card'));
    acts[ix(/blue key tag/)] = at(0.5, (B) => rfidShow(B.lab, 'tag'));
    acts[ix(/then the card again/)] = seq(at(0.5, (B) => rfidShow(B.lab, 'tag')), at(3, (B) => rfidShow(B.lab, 'card')), at(6, (B) => rfidShow(B.lab, 'card')));
    const r = play(l, acts); const csv = (r.B.lab.fs6.get('attendance.csv') || '').trim().split('\r\n');
    ok(r.done && csv.length === 3 && /,Ravi$/.test(csv[1]) && /^\d\d-\d\d-2026,\d\d:\d\d,Asha$/.test(csv[2]), `pi_rfidsheet: plays end to end — ${r.log.join(' | ')} · attendance.csv ${JSON.stringify(csv)}`);
    const M = build(l, (s) => s.k === 'wire' && s.wire[0] === 'rf.SDA'); const g = M.rt.ghostWire(['rf.SDA', 'GPIO7']); if (g) M.lab.addWire(g[0], g[1]);
    const c = M.rt.runCheck(); const notes = []; const off = M.lab.on((t, d) => { if (t === 'note') notes.push(d.code); });
    start(M, l.code); frames(M, 6, null, at(1, (B) => rfidShow(B.lab, 'card'))); off();
    ok(c && /GPIO 8/.test(JSON.stringify(c[1])) && !M.rt.serLines.some((x) => /marked/.test(x)) && notes.includes('N21_RFID_NONE'), `pi_rfidsheet: SDA on GPIO 7 -> the check names GPIO 8, read() waits, the hint names the SPI0 pins (${notes.join(',')})`);
  },
  pi_tripwire(l) {
    const acts = {}; const ix = (re) => l.steps.findIndex((s) => s.k === 'act' && re.test(s.do.en)); const light = (v) => (B) => { B.lab.env.light = v; B.lab.stateV++; };
    acts[ix(/slide the room light down to 10/)] = at(0.5, light(0.1));
    acts[ix(/slide the room light up again/)] = at(0.3, light(0.75));
    acts[ix(/^Break the beam again/)] = at(0.5, light(0.1));
    acts[ix(/twice/)] = seq(at(0.3, light(0.75)), at(1, light(0.1)), at(2.5, light(0.75)), at(3.5, light(0.1)));
    const B0 = build(l); const notes = []; const r = play(l, acts);
    ok(r.done, `pi_tripwire: plays end to end — ${r.log.join(' | ')} · ${JSON.stringify(r.B.rt.serLines.filter((x) => /INTRUDER|Beam|Guarding/.test(x)).slice(-4))}`); void B0; void notes;
  },
};
for (const l of L21) { if (only && !only.includes(l.id)) continue; try { T[l.id](l); } catch (e) { ok(false, `${l.id}: threw ${e.stack.split('\n').slice(0, 3).join(' ')}`); } }
console.log(fails ? `batch 21: ${fails} failed` : 'batch 21: all passed');
process.exit(fails ? 1 : 0);
