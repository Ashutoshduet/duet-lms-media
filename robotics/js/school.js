// DUET Robotics Lab 360: the school layer's data (no page, no DOM: the lab and teacher.html both use it, and the tests).
// Everything stays on the device (localStorage 'rl360.school') and moves between devices as short codes and QR codes, so a
// school with no internet works the same as one with it:
//   a teacher's CLASS CODE (RLJ1|…)   the class, its teacher and its assignments: a student scans it once and joins
//   a student's HAND-IN CODE (RLH1|…) the student's results for that class; the teacher scans or pastes it into the dashboard
// A lesson is named in a code by a 6-letter hash of its id (lhash): 30 bits, Crockford base 32.
// A result: stars (1-3), score (30-100), active time (s), mistakes, hints used, the day, and the best challenge time.
//   score = 100 - 7 a mistake - 10 a hint (never below 30) · ★★★ 85 or more · ★★ 60 or more · ★ finished
//   mistakes: a failed "Check my circuit", a burnt part, the board's fuse, a run-time error, compile errors (the first 3)
export const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const b32 = (n, len) => { let s = ''; n = Math.max(0, Math.floor(n)); for (let i = 0; i < len; i++) { s = B32[n & 31] + s; n = Math.floor(n / 32); } return s; };
export const unb32 = (s) => { let n = 0; for (const c of String(s)) { const k = B32.indexOf(c); if (k < 0) return NaN; n = n * 32 + k; } return n; };
export function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
export const lhash = (id) => b32(fnv('rl|' + id) & 0x3fffffff, 6);
export const sig = (s) => b32(fnv('rl-sig|' + s) & 0x3fffffff, 6);
const ESC = /[!'()*~.|]/g;
export const enc = (s) => encodeURIComponent(String(s == null ? '' : s)).replace(ESC, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
export const dec = (s) => { try { return decodeURIComponent(s || ''); } catch (e) { return String(s || ''); } };
export const today = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
export const newCode = (n = 6) => { const a = new Uint32Array(n); (globalThis.crypto || { getRandomValues: (x) => x.map(() => Math.random() * 2 ** 32) }).getRandomValues(a); return [...a].map((x) => B32[x % 32]).join(''); };

// ------------------------------------------------------------ scoring
export const W_MIS = 7, W_HINT = 10, FLOOR = 30;
export function scoreOf(mis, hints) { return Math.max(FLOOR, 100 - W_MIS * (mis || 0) - W_HINT * (hints || 0)); }
export function starsOf(score) { return score >= 85 ? 3 : score >= 60 ? 2 : 1; }
export const starTxt = (n) => '★'.repeat(n || 0) + '☆'.repeat(3 - (n || 0));
export const fmtT = (s) => { s = Math.round(s || 0); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; };
// a finished attempt into the record of the lesson: the best score stays, the tries count, the best challenge time stays
export function merge(old, a) {
  const r = old ? Object.assign({}, old) : { s: 0, sc: 0, t: 0, m: 0, h: 0, d: '', n: 0 };
  const sc = scoreOf(a.m, a.h);
  if (!old || sc > r.sc || (sc === r.sc && a.t < r.t)) Object.assign(r, { sc, s: starsOf(sc), t: Math.round(a.t), m: a.m || 0, h: a.h || 0 });
  r.n = (r.n || 0) + 1; r.d = a.d || today();
  if (a.ch) r.ch = r.ch ? Math.min(r.ch, Math.round(a.t)) : Math.round(a.t);
  return r;
}

// ------------------------------------------------------------ the store (one device: many students, a teacher's classes)
const KEY = 'rl360.school';
export function blank() { return { v: 1, me: null, profiles: {}, res: {}, classes: {}, tclasses: {}, roster: {}, opts: {} }; }
export function load(storage) {
  const S = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  try { const o = JSON.parse((S && S.getItem(KEY)) || 'null'); if (o && o.v === 1) return Object.assign(blank(), o); } catch (e) { /* bad data */ }
  return blank();
}
export function save(st, storage) { const S = storage || (typeof localStorage !== 'undefined' ? localStorage : null); try { if (S) S.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }
export function addProfile(st, { name, roll, cls, sec }) {
  const id = 'p' + newCode(5); st.profiles[id] = { id, name: String(name || '').trim().slice(0, 40), roll: String(roll || '').trim().slice(0, 12), cls: String(cls || '').trim().slice(0, 4), sec: String(sec || '').trim().slice(0, 4), joined: [], made: today(), sid: newCode(10), pk: newCode(14) };
  st.res[id] = {}; st.me = id; return st.profiles[id];
}
// (profiles made before the live classes: their online ids)
export function ids(p) { if (p && !p.sid) p.sid = newCode(10); if (p && !p.pk) p.pk = newCode(14); return p; }
export function record(st, pid, lessonId, attempt) {
  if (!pid || !st.profiles[pid]) return null; const R = st.res[pid] || (st.res[pid] = {});
  R[lessonId] = merge(R[lessonId], attempt); return R[lessonId];
}

// a code in any text: as it is, or inside a link (?join=…, its | sent as %7C): the link is decoded once
function find(text, tag) {
  let s = String(text || ''); const re = new RegExp(tag + '\\|[^\\s"\'<>&#]*');
  let m = re.exec(s); if (m) return m;
  for (let k = 0; k < 2 && !m; k++) { try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return null; } m = re.exec(s); }
  return m;
}

// ------------------------------------------------------------ the teacher's class code (join + assignments)
// RLJ1|CODE|name|class|section|teacher|school|asg!asg…   asg = id~due~title~h1.h2.h3 (due: YYYYMMDD or empty)
export function classCode(c) {
  const asg = (c.asg || []).map((a) => [a.id, a.due || '', enc(a.title), (a.ls || []).map(lhash).join('.')].join('~')).join('!');
  return ['RLJ1', c.code, enc(c.name), enc(c.cls), enc(c.sec), enc(c.teacher), enc(c.school), asg].join('|');
}
export function parseClass(text, byHash) { // -> the class, its assignments' lessons named by id (when known on this device)
  const m = find(text, 'RLJ1'); if (!m) return null;
  const f = m[0].split('|'); if (f.length < 7 || !/^[0-9A-Z]{6}$/.test(f[1])) return null;
  const asg = (f[7] || '').split('!').filter(Boolean).map((s) => { const [id, due, title, hs] = s.split('~'); const hh = (hs || '').split('.').filter(Boolean); return { id, due: due || '', title: dec(title), ls: hh.map((h) => (byHash && byHash[h]) || null).filter(Boolean), miss: hh.filter((h) => !(byHash && byHash[h])).length }; });
  return { code: f[1], name: dec(f[2]), cls: dec(f[3]), sec: dec(f[4]), teacher: dec(f[5]), school: dec(f[6]), asg };
}
export function joinClass(st, pid, c) {
  st.classes[c.code] = Object.assign(st.classes[c.code] || {}, c, { got: today() });
  const p = st.profiles[pid]; if (p) { if (!p.joined.includes(c.code)) p.joined.push(c.code); if (!p.cls && c.cls) p.cls = c.cls; if (!p.sec && c.sec) p.sec = c.sec; }
  return st.classes[c.code];
}

// ------------------------------------------------------------ the student's hand-in code
// RLH1|CODE|roll|name|day|entries|sig   an entry: hash(6) stars(1) score(2) time/15s(2) mistakes(1) hints(1) challenge/15s(2)
export function handIn(st, pid, code, only) {
  const p = st.profiles[pid]; if (!p) return null; const R = st.res[pid] || {};
  const ids = Object.keys(R).filter((id) => R[id].s > 0 && (!only || only.includes(id)));
  const ent = ids.map((id) => { const r = R[id]; return lhash(id) + b32(r.s, 1) + b32(Math.min(1023, r.sc), 2) + b32(Math.min(1023, Math.round(r.t / 15)), 2) + b32(Math.min(31, r.m), 1) + b32(Math.min(31, r.h), 1) + b32(r.ch ? Math.min(1023, Math.max(1, Math.round(r.ch / 15))) : 0, 2); }).join('');
  const body = ['RLH1', code || '------', enc(p.roll), enc(p.name), today(), ent].join('|');
  return body + '|' + sig(body);
}
export function parseHandIn(text, byHash) { // -> { code, roll, name, day, res: { id: result }, unknown, ok (the tamper check) }
  const m = find(text, 'RLH1'); if (!m) return null;
  const f = m[0].split('|'); if (f.length < 7) return null;
  const body = f.slice(0, 6).join('|'); const ok = sig(body) === f[6];
  const res = {}; let unknown = 0; const e = f[5] || '';
  for (let i = 0; i + 15 <= e.length; i += 15) {
    const h = e.slice(i, i + 6), id = byHash ? byHash[h] : h; if (!id) { unknown++; continue; }
    const s = unb32(e[i + 6]), sc = unb32(e.slice(i + 7, i + 9)), t = unb32(e.slice(i + 9, i + 11)) * 15, mm = unb32(e[i + 11]), hh = unb32(e[i + 12]), ch = unb32(e.slice(i + 13, i + 15)) * 15;
    if ([s, sc, t, mm, hh, ch].some(Number.isNaN)) continue;
    res[id] = { s, sc, t, m: mm, h: hh, d: f[4] }; if (ch) res[id].ch = ch;
  }
  return { code: f[1], roll: dec(f[2]), name: dec(f[3]), day: f[4], res, unknown, ok };
}
// the teacher's side: a hand-in into the roster of its class (a student is roll + name; the better result of each lesson stays)
export function addHandIn(st, h) {
  if (!h || !h.code) return null; const R = st.roster[h.code] || (st.roster[h.code] = {});
  const key = (h.roll || '').trim() ? 'r:' + h.roll.trim().toLowerCase() : 'n:' + h.name.trim().toLowerCase();
  const s = R[key] || (R[key] = { name: h.name, roll: h.roll, res: {}, last: '' });
  s.name = h.name || s.name; s.roll = h.roll || s.roll; s.last = h.day > (s.last || '') ? h.day : s.last; s.warn = s.warn || !h.ok;
  for (const [id, r] of Object.entries(h.res)) { const o = s.res[id]; if (!o || r.sc > o.sc || (r.sc === o.sc && r.t < o.t)) s.res[id] = Object.assign({}, r, o && o.ch && (!r.ch || o.ch < r.ch) ? { ch: o.ch } : {}); else if (r.ch && (!o.ch || r.ch < o.ch)) o.ch = r.ch; }
  return s;
}

// ------------------------------------------------------------ skills (NEP 2020 / NCF-SE 2023: the competencies a lesson builds)
export const SKILLS = {
  code: { en: 'Coding', hi: 'कोडिंग', hg: 'Coding', nep: { en: 'Computational thinking', hi: 'कम्प्यूटेशनल चिंतन', hg: 'Computational thinking' } },
  elec: { en: 'Electronics and circuits', hi: 'इलेक्ट्रॉनिक्स और सर्किट', hg: 'Electronics aur circuit', nep: { en: 'Scientific temper', hi: 'वैज्ञानिक दृष्टिकोण', hg: 'Scientific temper' } },
  sens: { en: 'Sensors and data', hi: 'सेंसर और डेटा', hg: 'Sensor aur data', nep: { en: 'Data and measurement', hi: 'डेटा और मापन', hg: 'Data aur measurement' } },
  robo: { en: 'Robotics and mechanisms', hi: 'रोबोटिक्स और यंत्र', hg: 'Robotics aur mechanism', nep: { en: 'Engineering and design', hi: 'इंजीनियरिंग और डिज़ाइन', hg: 'Engineering aur design' } },
  ai: { en: 'AI and machine learning', hi: 'AI और मशीन लर्निंग', hg: 'AI aur machine learning', nep: { en: 'Emerging technologies (AI)', hi: 'नई तकनीकें (AI)', hg: 'Nayi technology (AI)' } },
  iot: { en: 'IoT and communication', hi: 'IoT और संचार', hg: 'IoT aur communication', nep: { en: 'Digital literacy', hi: 'डिजिटल साक्षरता', hg: 'Digital literacy' } },
  real: { en: 'Solving real problems', hi: 'असली समस्याओं का हल', hg: 'Asli problems ka hal', nep: { en: 'Problem solving and design thinking', hi: 'समस्या-समाधान और डिज़ाइन सोच', hg: 'Problem solving aur design thinking' } },
  debug: { en: 'Debugging and persistence', hi: 'ग़लती ढूँढना और लगन', hg: 'Galti dhoondhna aur lagan', nep: { en: 'Critical thinking', hi: 'आलोचनात्मक सोच', hg: 'Critical thinking' } },
};
const SENSORS = /button|pot|ldr|lm35|ultra|hcsr04|pir|ir|soil|mq|dht|rain|flame|sound|reed|hall|tilt|vib|ds18|loadcell|vl53|mpu|keypad|rfid|joy|flex|touch|temp|gps|pulse|acs/i;
const MOVERS = /servo|motor|stepper|l298|car|arm|relay|pump/i;
const AIRX = /\b(ai|ml|machine learning|camera|gesture|yolo|face|classif|detect|neural|learn)\b/i;
const IOTRX = /wifi|bluetooth|\bbt\b|radio|web|iot|mqtt|gsm|sms|esp-now|http|dashboard|phone|flask|server/i;
export function skillsOf(l) { // -> { skill: weight }
  if (!l) return {}; const w = {}; const add = (k, v) => { w[k] = (w[k] || 0) + v; };
  const title = (l.title && (l.title.en || '')) + ' ' + (l.goal && l.goal.en || ''); const parts = (l.drawer || []).join(' ') + ' ' + ((l.setup && l.setup.parts) || []).map((p) => p.type).join(' ');
  const steps = l.steps || [];
  if (l.group !== 'circuits') add('code', steps.some((s) => s.k === 'edit') ? 2 : 1);
  if (steps.some((s) => s.k === 'place' || s.k === 'wire') || l.group === 'circuits') add('elec', 1 + Math.min(2, steps.filter((s) => s.k === 'wire').length / 3));
  if (SENSORS.test(parts) || l.serial) add('sens', 1);
  if (MOVERS.test(parts) || l.group === 'robots' || l.world) add('robo', l.group === 'robots' || l.world ? 2 : 1);
  if (AIRX.test(title) || l.scene) add('ai', AIRX.test(title) ? 2 : 0);
  if (IOTRX.test(title) || (l.factory && l.factory.out === 'bt') || l.phone && /bt|wifi/.test(String(l.phone))) add('iot', 1);
  if (l.factory || l.group === 'projects' || l.group === 'bank') add('real', 1);
  for (const k of Object.keys(w)) if (!w[k]) delete w[k];
  return w;
}
// a student's skill points (weight × stars of each finished lesson) and a level for each skill
export const LEVELS = [{ at: 0, en: 'Beginning', hi: 'शुरुआत', hg: 'Shuruaat' }, { at: 12, en: 'Developing', hi: 'विकसित हो रहा', hg: 'Developing' }, { at: 40, en: 'Proficient', hi: 'दक्ष', hg: 'Proficient' }, { at: 100, en: 'Advanced', hi: 'उन्नत', hg: 'Advanced' }];
export function skillReport(res, byId) {
  const pts = Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0]));
  for (const [id, r] of Object.entries(res || {})) {
    const l = byId[id]; if (!l || !r.s) continue; const w = skillsOf(l);
    for (const [k, v] of Object.entries(w)) pts[k] += v * r.s;
    if (r.m > 0) pts.debug += Math.min(3, r.m) * (r.s >= 2 ? 1 : 0.5); // fixed one's own mistakes and finished
    pts.debug += r.h === 0 ? 0.5 : 0; // worked it out without a hint
  }
  const out = {}; for (const [k, v] of Object.entries(pts)) { let lv = 0; for (let i = 0; i < LEVELS.length; i++) if (v >= LEVELS[i].at) lv = i; out[k] = { pts: Math.round(v * 10) / 10, lv, next: LEVELS[lv + 1] ? LEVELS[lv + 1].at : null }; }
  return out;
}
export function totals(res) { let done = 0, stars = 0, t = 0, three = 0; for (const r of Object.values(res || {})) if (r.s) { done++; stars += r.s; t += r.t || 0; if (r.s === 3) three++; } return { done, stars, t, three }; }
// a certificate's check code: anyone can recompute it from what the certificate says
export const certCode = (name, what, day) => sig(['cert', String(name).trim().toLowerCase(), what, day].join('|')).slice(0, 6) + '-' + day.slice(2);

// ------------------------------------------------------------ live classes (devtools/school-server: an Apps Script web app)
// Its address is "sync" in licences.json (one folder above the app), so it can change without a new version of the app.
// Without the internet nothing is lost: finished lessons wait in st.out and go when the device is online again.
let SYNC_P = null;
export function syncUrl(base) {
  if (!SYNC_P) SYNC_P = (async () => { try { const r = await fetch(new URL('../licences.json', base || location.href).href + '?s=' + Math.floor(Date.now() / 6e5), { cache: 'no-cache' }); const j = await r.json(); return j.sync || ''; } catch (e) { return ''; } })();
  return SYNC_P;
}
export async function api(a, body, base) {
  const u = await syncUrl(base); if (!u) return { ok: false, err: 'nosync' };
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const to = setTimeout(() => ac && ac.abort(), 20000);
  try {
    const big = a === 'post' || a === 'mkclass' || a === 'setclass' || a === 'school'; // (the school's code goes in a body, never in a link)
    const r = big ? await fetch(u, { method: 'POST', body: JSON.stringify(Object.assign({ a }, body)), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ac && ac.signal })
      : await fetch(u + '?' + new URLSearchParams(Object.assign({ a }, body)).toString(), { cache: 'no-store', signal: ac && ac.signal });
    return await r.json();
  } catch (e) { return { ok: false, err: 'net' }; } finally { clearTimeout(to); }
}
// a finished lesson for every class the student joined (online classes only: a class known by its code alone)
export function queue(st, pid, lessonId, rec) {
  const p = st.profiles[pid]; if (!p || !p.joined || !p.joined.length) return; ids(p); st.out = st.out || [];
  for (const code of p.joined) { const c = st.classes[code]; if (!c || c.offline) continue; st.out.push({ code, pid, l: lessonId, s: rec.s, sc: rec.sc, t: rec.t, m: rec.m, h: rec.h, ch: rec.ch || 0, d: rec.d }); }
  if (st.out.length > 2000) st.out = st.out.slice(-2000);
}
let flushing = false;
export async function flush(st, saveFn, base) {
  if (flushing || !st.out || !st.out.length) return 0; flushing = true; let sent = 0;
  try {
    const groups = {}; for (const o of st.out) { const k = o.code + '|' + o.pid; (groups[k] = groups[k] || []).push(o); }
    for (const [k, list] of Object.entries(groups)) {
      const [code, pid] = k.split('|'); const p = ids(st.profiles[pid]); if (!p) { st.out = st.out.filter((o) => !list.includes(o)); continue; }
      const r = await api('post', { code, sid: p.sid, pk: p.pk, name: p.name, roll: p.roll, res: list.map((o) => ({ l: o.l, s: o.s, sc: o.sc, t: o.t, m: o.m, h: o.h, ch: o.ch, d: o.d })) }, base);
      if (r && r.ok) { st.out = st.out.filter((o) => !list.includes(o)); sent += list.length; if (saveFn) saveFn(); }
      else if (r && r.err === 'none') { st.out = st.out.filter((o) => !list.includes(o)); if (saveFn) saveFn(); } // the class was removed
      else break; // offline: later
    }
  } finally { flushing = false; }
  return sent;
}
// the school's DUET STEM code on this device (duetgate.js keeps its hash): ties a teacher's classes to the principal's view
export function schoolHash() { try { const v = JSON.parse(localStorage.getItem('duet.lic.v1') || 'null'); return v && /^[0-9a-f]{64}$/.test(v.h || '') ? v.h : ''; } catch (e) { return ''; } }
