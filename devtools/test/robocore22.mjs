// DUET Robotics Lab 360, batch 22 (robotics/js/parts22.js, lessons22.js): the small digital sensor modules, without a browser.
//   1. each module on the Uno bench: powered, OUT HIGH at rest, LOW while it senses (a held one) or for a moment (a clap,
//      a knock), and its OUT reads 0 on an Uno pin; without power it reads nothing;
//   2. drowsy: the bench built as a student builds it, the sketch runs, two blinks both sound the alarm (sleepy = 0); the
//      edit (sleepy = 2000) keeps blinks quiet; eyes closed for 3 s sound it, and opening them stops it;
//   3. mistakes: OUT on pin 6 (the check names it, and closed eyes never sound the alarm); VCC left off (the check says so);
//   4. smartfarm: the phone opens the page; a dry field is watered and the pump stops by itself; in the rain the first
//      program pumps anyway; with && !raining() it waits for the rain; the phone takes over (Pump on) and hands back (Auto);
//      mistakes: the rain sensor on VIN (5 V) and the soil's AO on GPIO 35 (the check names each);
//   5. the anemometer: 2.4 km/h a turn a second, counted by edges on a pin with INPUT_PULLUP, from 5 to 50 km/h;
//      kisanws: the first program counts the level (a "cyclone" from a breeze); with the edge it reads 10 and 25 km/h;
//      the phone says "Do not spray" in a gust and in the rain, "Good weather to spray" after; lead A on GPIO 26 is named.
//   node devtools/test/robocore22.mjs      (exit 1 on a failure)
import { compile } from '../../robotics/js/cpp.js';
import { Lab } from '../../robotics/js/sim.js';
import { LESSONS } from '../../robotics/js/lessons.js';
import { LessonRT } from '../../robotics/js/lessonrt.js';
import { TYPES22, KINDS22, sense22, blink22, wind22 } from '../../robotics/js/parts22.js';
import { netOf } from '../../robotics/js/esp32.js';

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const L22 = LESSONS.filter((l) => l.batch === 22);
ok(L22.length === 3 && new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, `${L22.length} lessons in batch 22, ids unique`);

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
function phone(B) { // the phone's browser: open a page, follow a 303 back to "/" as a real browser does
  const N = netOf(B.lab); const P = { open(path) { const ip = N.staIP(); if (!ip) return; N.request(ip + path, (r) => { const loc = r && r.headers && r.headers.Location; if (r && r.code === 303 && loc) N.request(ip + loc, () => {}); }); } };
  return P;
}
function play(l, acts = {}, secs = 30) {
  const B = build(l); let src = l.code; const log = []; B.phone = phone(B);
  for (const [i, s] of l.steps.entries()) {
    for (const k of ['do', 'see']) if (s[k]) for (const lg of ['en', 'hi', 'hg']) if (typeof s[k][lg] !== 'string') ok(false, `${l.id}: step ${i} has ${k}.${lg}`);
    if (s.k === 'check') { const r = B.rt.runCheck(); if (r) { log.push(`step ${i}: check says ${JSON.stringify(r[0].en)}`); break; } }
    if (s.k === 'run') { start(B, src); frames(B, 0.5); }
    if (s.k === 'edit') { const e = s.set.reduce((x, [re, v]) => x.replace(re, v), src); if (!(s.test(e) && !s.test(src))) { log.push(`step ${i}: the edit is not what it asks`); break; } src = e; start(B, src); frames(B, 0.5); }
    if (s.k === 'watch' || s.k === 'act') {
      const t0 = B.t; const done = frames(B, secs, () => { try { return !!s.until(B.rt); } catch (e) { return false; } }, acts[i]);
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
{
  const l = L22.find((x) => x.id === 'smartfarm');
  const soil = (v) => (B) => { const p = B.lab.byTag('soil'); p.state.moist = v; B.lab.stateV++; B.lab.instKey = null; };
  const rain = (on) => (B) => sense22(B.lab, B.lab.byTag('rn1'), on);
  const every = (dt, f) => { let next = 0; return (t, B) => { if (t >= next) { next = t + dt; f(B); } }; }; // the page refreshes itself every 2 s
  const acts = { [ix(l, /open the Browser/)]: script([[0.5, (B) => B.phone.open('/')]]), [ix(l, /dry season/)]: script([[0.3, soil(0.15)]]),
    [ix(l, /monsoon/)]: script([[0.3, rain(true)], [0.6, soil(0.15)]]), [ix(l, /still raining/)]: script([[0.5, soil(0.15)]]),
    [ix(l, /cattle trough/)]: script([[0.2, rain(false)], [0.5, (B) => B.phone.open('/on')], [2.6, (B) => B.phone.open('/')]]),
    [ix(l, /tap "Auto"/)]: (t, B) => { if (t < 0.05) B.phone.open('/auto'); every(2, (b) => b.phone.open('/'))(t, B); } };
  const r = play(l, acts, 60); frames(r.B, 0.5); ok(r.done, `smartfarm: plays end to end — ${r.log.join(' | ')}`);
  const N = netOf(r.B.lab); const b = (N.seen.last || {}).body || '';
  ok(/Soil: <b>\d+<\/b>/.test(b) && /Rain: <b>no rain/.test(b) && /Pump: <b>OFF<\/b> \(auto\)/.test(b), 'smartfarm: the page shows the soil, no rain, the pump OFF in auto: ' + b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120));
  ok(/Pump ON/.test(r.B.ser) && /Pump OFF/.test(r.B.ser) && /raining/.test(r.B.ser), 'smartfarm: the Serial Monitor logs the pump and the rain');
  const last = l.steps[l.steps.length - 1].see.en; ok(/Your results: back in auto, the soil reads \d+/.test(last), 'smartfarm: the last step reads the results: ' + last.slice(0, 70));
  // mistakes: the rain sensor's VCC on VIN (5 V); the soil's AO on GPIO 35
  const V = build(l, (s) => (s.wire[0] === 'rn1.VCC' ? ['rn1.VCC', 'rail:tp'] : s.wire)); const v = V.rt.runCheck();
  ok(!!v && /VIN \(5 V\)/.test(say(v)), `smartfarm: the rain sensor on 5 V -> the check says ${JSON.stringify(say(v)).slice(0, 90)}`);
  const A = build(l, (s) => (s.wire[0] === 'soil.AO' ? ['soil.AO', 'D35'] : s.wire)); const a = A.rt.runCheck();
  ok(!!a && /AO/.test(say(a)) && /GPIO 34/.test(say(a)), `smartfarm: the soil's AO on GPIO 35 -> the check says ${JSON.stringify(say(a)).slice(0, 90)}`);
}
{ // the anemometer alone: a sketch counts the falling edges for 3 s
  const lab = new Lab(); const p = lab.addPart('anemo', {}, { x: 110, z: 85 }, 2, 'an'); lab.addWire('T:' + p.uid + ':A', 'B:D2'); lab.addWire('T:' + p.uid + ':B', 'B:GND3');
  const SK = `int n = 0; int last = HIGH; unsigned long t0 = 0;\nvoid setup(){ pinMode(2, INPUT_PULLUP); Serial.begin(9600); t0 = millis(); }\nvoid loop(){ int v = digitalRead(2); if (v == LOW && last == HIGH) n++; last = v; if (millis() - t0 >= 3000) { Serial.println(n); n = 0; t0 = millis(); } }`;
  const c = compile(SK, lab.def); lab.run(c); const got = [];
  for (const k of [5, 10, 25, 50]) { wind22(lab, p, k); let out = ''; for (let f = 0; f < 6.2 * 60; f++) { lab.step(1000 / 60); for (const o of lab.mcu.ser.take()) out += String.fromCharCode(...o.bytes); } const n = +out.trim().split(/\r?\n/).pop(); got.push([k, (n / 3 * 2.4).toFixed(1)]); }
  ok(got.every(([k, v]) => Math.abs(v - k) <= Math.max(1.6, k * 0.06)), `anemo: counted by edges, the wind reads ${got.map(([k, v]) => k + '→' + v).join(', ')} km/h`);
}
{
  const l = L22.find((x) => x.id === 'kisanws');
  const wind = (k) => (B) => wind22(B.lab, B.lab.byTag('an1'), k);
  const rain = (on) => (B) => sense22(B.lab, B.lab.byTag('rn1'), on);
  const every = (dt, f) => { let next = 0; return (t, B) => { if (t >= next) { next = t + dt; f(B); } }; };
  const pg = () => every(1.5, (B) => B.phone.open('/'));
  const both = (a, b) => (t, B) => { a(t, B); b(t, B); };
  const acts = { [ix(l, /open the Browser/)]: script([[0.5, (B) => B.phone.open('/')]]), [ix(l, /light breeze/)]: script([[0.3, wind(10)]]),
    [ix(l, /two readings/)]: script([[0.2, wind(10)]]), [ix(l, /gusty/)]: both(script([[0.3, wind(25)]]), pg()),
    [ix(l, /starts to rain/)]: both(script([[0.3, wind(5)], [0.5, rain(true)]]), pg()), [ix(l, /sky clears/)]: both(script([[0.3, rain(false)]]), pg()) };
  const r = play(l, acts, 40); ok(r.done, `kisanws: plays end to end — ${r.log.join(' | ')}`);
  ok(r.B.rt.mem.cyclone, 'kisanws: the first program made a cyclone of a breeze');
  const N = netOf(r.B.lab); const b = (N.seen.last || {}).body || '';
  ok(/Temperature: <b>\d+\.\d C/.test(b) && /Humidity: <b>\d+ %/.test(b) && /Rain: <b>dry/.test(b) && /Wind: <b>[3-7]\.\d km\/h/.test(b) && /Good weather to spray/.test(b), 'kisanws: the page: ' + b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 140));
  const last = l.steps[l.steps.length - 1].see.en; ok(/Your results: wind \d/.test(last), 'kisanws: the last step reads the results: ' + last.slice(0, 60));
  const M = build(l, (s) => (s.wire[0] === 'an1.A' ? ['an1.A', 'D26'] : s.wire[0] === 'rn1.OUT' ? ['rn1.OUT', 'D25'] : s.wire)); const c = M.rt.runCheck();
  ok(!!c && /pin 26|pin 25/.test(say(c)), `kisanws: the rain and wind leads swapped -> the check says ${JSON.stringify(say(c))}`);
}
console.log(fails ? `${fails} FAILED` : 'all ok'); process.exit(fails ? 1 : 0);
