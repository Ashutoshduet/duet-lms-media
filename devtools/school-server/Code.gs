// DUET STEM classes: the live side of the school layer (robotics/js/school.js, teacher.html, portfolio.html).
// A Google Apps Script web app over a Google Sheet in DUET STEM's Google account (no server to run or pay for).
// Its URL is "sync" in licences.json, so it can change without a new app version; without it the apps work offline
// only (QR codes). Setup: README.md beside this file.
//
// Who can do what (no passwords: the codes are the keys)
//   a teacher    makes a class: its CLASS CODE (6 letters, for the students) and a TEACHER KEY (kept on the teacher's
//                device; only its hash is stored here). With the key: the class's assignments and every result.
//   a student    joins with the class code; the lab sends each finished lesson (stars, score, time, mistakes, hints).
//   a parent     the student's PORTFOLIO KEY (a link the student shares): that one student's work, read only.
//   a principal  the school's DUET STEM code (the one the school activated the apps with): every class made on the
//                school's devices, read only. The code itself is never stored, only checked against licences.json.
//
// Sheets (made on first use):
//   Classes  Code | Teacher key hash | Name | Class | Section | Teacher | School | School code hash | Assignments | Made | Updated
//   Students Class | Student | Name | Roll | Portfolio key | Joined | Last seen
//   Results  When | Class | Student | Lesson | Stars | Score | Seconds | Mistakes | Hints | Challenge s | Day
const LIST = 'https://ashutoshduet.github.io/duet-lms-media/licences.json';
const H = {
  Classes: ['Code', 'Teacher key hash', 'Name', 'Class', 'Section', 'Teacher', 'School', 'School code hash', 'Assignments', 'Made', 'Updated'],
  Students: ['Class', 'Student', 'Name', 'Roll', 'Portfolio key', 'Joined', 'Last seen'],
  Results: ['When', 'Class', 'Student', 'Lesson', 'Stars', 'Score', 'Seconds', 'Mistakes', 'Hints', 'Challenge s', 'Day'],
};

function doGet(e) { return out(handle((e && e.parameter) || {})); }
function doPost(e) { let p = {}; try { p = JSON.parse(e.postData.contents); } catch (err) { p = {}; } return out(handle(p)); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
let MEMO = {}; // each sheet is read once per request
function handle(p) {
  MEMO = {};
  try {
    switch (p.a) {
      case 'mkclass': return mkclass(p);
      case 'setclass': return setclass(p);
      case 'join': return join(p);
      case 'post': return post(p);
      case 'class': return readClass(p);
      case 'school': return readSchool(p);
      case 'student': return readStudent(p);
      case 'ping': return { ok: true, t: Date.now() };
    }
    return { ok: false, err: 'action' };
  } catch (err) { return { ok: false, err: 'server', msg: String(err).slice(0, 200) }; }
}

// ------------------------------------------------------------ helpers
const clip = (s, n) => String(s == null ? '' : s).replace(/[\r\n\t]/g, ' ').slice(0, n);
const CODE = /^[0-9A-Z]{6}$/, KEY = /^[0-9A-Za-z]{10,40}$/, LID = /^[0-9a-z_]{1,40}$/;
function hex(bytes) { return bytes.map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
function sha(s) { return hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function sheet(name) { // every cell is text (a class code like 12E345 must not become a number)
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, sh.getMaxRows(), H[name].length).setNumberFormat('@'); sh.appendRow(H[name]); sh.setFrozenRows(1); sh.getRange(1, 1, 1, H[name].length).setFontWeight('bold'); }
  return sh;
}
function values(name) { if (MEMO[name]) return MEMO[name]; const sh = sheet(name); const last = sh.getLastRow(); MEMO[name] = last < 2 ? [] : sh.getRange(2, 1, last - 1, H[name].length).getValues(); return MEMO[name]; }
function rowsWhere(name, col, value) { // [{i (sheet row), r (values)}] where column col (0-based) is value
  const v = values(name); const out = []; const want = String(value);
  for (let k = 0; k < v.length; k++) if (String(v[k][col]) === want) out.push({ i: k + 2, r: v[k] });
  return out;
}
function appendText(name, rows) { // rows of text, kept as text
  if (!rows.length) return; const sh = sheet(name); const r0 = sh.getLastRow() + 1;
  const rg = sh.getRange(r0, 1, rows.length, H[name].length); rg.setNumberFormat('@'); rg.setValues(rows.map((r) => r.map((x) => String(x == null ? '' : x)))); delete MEMO[name];
}
const now = () => new Date().toISOString();
function cls(code) { const r = rowsWhere('Classes', 0, code); return r.length ? r[0] : null; }
function pub(r) { let asg = []; try { asg = JSON.parse(r[8] || '[]'); } catch (e) { asg = []; } return { code: r[0], name: r[2], cls: r[3], sec: r[4], teacher: r[5], school: r[6], asg }; }
function asgOf(a) { // the assignments as the app sends them (ids of lessons): kept short and clean
  if (!Array.isArray(a)) return [];
  return a.slice(0, 60).map((x) => ({ id: clip(x.id, 12), title: clip(x.title, 80), due: clip(x.due, 8), ls: (Array.isArray(x.ls) ? x.ls : []).filter((l) => LID.test(l)).slice(0, 80) }));
}
function codeHash(code) { // as duetgate.js: Crockford base 32, DUET prefix dropped
  const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let t = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); if (t.indexOf('DUET') === 0) t = t.slice(4);
  t = t.split('').filter((c) => A.indexOf(c) >= 0).join(''); return sha('duet-lic|' + t);
}
function knownCode(h) {
  const c = CacheService.getScriptCache(); let j = c.get('codes');
  if (!j) { const txt = UrlFetchApp.fetch(LIST + '?t=' + Date.now(), { muteHttpExceptions: true }).getContentText(); const all = JSON.parse(txt).codes || {}; j = JSON.stringify(Object.keys(all).filter((k) => !all[k].r)); try { c.put('codes', j, 300); } catch (e) { /* big */ } }
  return JSON.parse(j).indexOf(h) >= 0;
}
function lock(f) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return f(); } finally { l.releaseLock(); } }

// ------------------------------------------------------------ teacher
function mkclass(p) {
  const code = clip(p.code, 6), tk = clip(p.tk, 40); if (!CODE.test(code) || !KEY.test(tk)) return { ok: false, err: 'bad' };
  const sh = clip(p.sh, 64).toLowerCase();
  return lock(() => {
    const have = cls(code);
    if (have) { if (have.r[1] !== sha('t|' + tk)) return { ok: false, err: 'taken' }; return setclass(p, have); }
    appendText('Classes', [[code, sha('t|' + tk), clip(p.name, 60), clip(p.cls, 4), clip(p.sec, 4), clip(p.teacher, 60), clip(p.school, 100), /^[0-9a-f]{64}$/.test(sh) ? sh : '', JSON.stringify(asgOf(p.asg)), now(), now()]]);
    return { ok: true, made: true };
  });
}
function setclass(p, have) {
  const code = clip(p.code, 6), tk = clip(p.tk, 40); const c = have || cls(code);
  if (!c) return { ok: false, err: 'none' }; if (c.r[1] !== sha('t|' + clip(tk, 40))) return { ok: false, err: 'key' };
  const sh = sheet('Classes'); const r = c.r.slice();
  if (p.name != null) r[2] = clip(p.name, 60); if (p.cls != null) r[3] = clip(p.cls, 4); if (p.sec != null) r[4] = clip(p.sec, 4);
  if (p.teacher != null) r[5] = clip(p.teacher, 60); if (p.school != null) r[6] = clip(p.school, 100);
  if (p.sh && /^[0-9a-f]{64}$/.test(String(p.sh))) r[7] = String(p.sh); if (p.asg) r[8] = JSON.stringify(asgOf(p.asg)); r[10] = now();
  const rg = sh.getRange(c.i, 1, 1, r.length); rg.setNumberFormat('@'); rg.setValues([r.map((x) => String(x == null ? '' : x))]); delete MEMO.Classes; return { ok: true };
}
// the best result of every student and lesson of a class (and when each student was last seen)
function results(code) {
  const st = rowsWhere('Students', 0, code).map((x) => ({ id: x.r[1], name: x.r[2], roll: String(x.r[3]), last: x.r[6] ? Date.parse(x.r[6]) || 0 : 0 }));
  const best = {};
  for (const x of rowsWhere('Results', 1, code)) {
    const r = x.r; const k = r[2] + '|' + r[3]; const sc = +r[5]; const o = best[k];
    const ch = +r[9] || 0;
    if (!o || sc > o[3] || (sc === o[3] && +r[6] < o[4])) best[k] = [r[2], r[3], +r[4], sc, +r[6], +r[7], +r[8], o && o[7] && (!ch || o[7] < ch) ? o[7] : ch, String(r[10])];
    else if (ch && (!o[7] || ch < o[7])) o[7] = ch;
  }
  return { students: st, res: Object.keys(best).map((k) => best[k]) }; // res: [student, lesson, stars, score, secs, mistakes, hints, challenge s, day]
}
function readClass(p) {
  const code = clip(p.code, 6); const c = cls(code); if (!c) return { ok: false, err: 'none' };
  if (c.r[1] !== sha('t|' + clip(p.tk, 40))) return { ok: false, err: 'key' };
  return Object.assign({ ok: true, cls: pub(c.r) }, results(code));
}
function readSchool(p) { // the principal: every class made on the school's devices
  const h = codeHash(p.k); if (!knownCode(h)) return { ok: false, err: 'code' };
  const out = []; for (const x of rowsWhere('Classes', 7, h)) out.push(Object.assign({ cls: pub(x.r) }, results(x.r[0])));
  return { ok: true, classes: out };
}

// ------------------------------------------------------------ student and parent
function join(p) { const c = cls(clip(p.code, 6)); return c ? { ok: true, cls: pub(c.r) } : { ok: false, err: 'none' }; }
function post(p) { // a student's finished lessons (several at once: the app keeps them while offline)
  const code = clip(p.code, 6), sid = clip(p.sid, 20), pk = clip(p.pk, 40);
  if (!CODE.test(code) || !/^[0-9A-Za-z]{4,20}$/.test(sid) || (pk && !KEY.test(pk))) return { ok: false, err: 'bad' };
  if (!cls(code)) return { ok: false, err: 'none' };
  const t = now(); const list = Array.isArray(p.res) ? p.res.slice(0, 300) : [];
  const rows = list.filter((r) => r && LID.test(r.l)).map((r) => [t, code, sid, r.l, Math.max(0, Math.min(3, +r.s || 0)), Math.max(0, Math.min(100, +r.sc || 0)), Math.max(0, Math.min(86400, +r.t || 0)), Math.max(0, Math.min(99, +r.m || 0)), Math.max(0, Math.min(99, +r.h || 0)), Math.max(0, Math.min(86400, +r.ch || 0)), clip(r.d, 8)]);
  return lock(() => {
    const ss = rowsWhere('Students', 1, sid).filter((x) => x.r[0] === code); const sh = sheet('Students');
    if (ss.length) { const r = ss[0].r.slice(); r[2] = clip(p.name, 40) || r[2]; r[3] = clip(p.roll, 12) || r[3]; if (pk) r[4] = pk; r[6] = t; const rg = sh.getRange(ss[0].i, 1, 1, r.length); rg.setNumberFormat('@'); rg.setValues([r.map((x) => String(x == null ? '' : x))]); }
    else appendText('Students', [[code, sid, clip(p.name, 40), clip(p.roll, 12), pk, t, t]]);
    appendText('Results', rows);
    return { ok: true, n: rows.length };
  });
}
function readStudent(p) { // a parent or anyone with the student's portfolio link
  const pk = clip(p.pk, 40); if (!KEY.test(pk)) return { ok: false, err: 'bad' };
  const me = rowsWhere('Students', 4, pk); if (!me.length) return { ok: false, err: 'none' };
  const sid = me[0].r[1]; const classes = []; let name = me[0].r[2], roll = me[0].r[3];
  for (const m of me) { const c = cls(m.r[0]); if (!c) continue; const all = results(m.r[0]); classes.push({ cls: pub(c.r), res: all.res.filter((x) => x[0] === m.r[1]) }); }
  return { ok: true, sid, name, roll, classes };
}
