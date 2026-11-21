// DUET Robotics Lab 360: the teacher's and the principal's dashboard (teacher.html). Works online (live classes through
// the DUET STEM class register, devtools/school-server) and offline (students' hand-in QR codes, and the students who
// use this same computer). The teacher's classes and keys stay on this device (localStorage 'rl360.school', tclasses).
import * as SC from './school.js';
import { sheet, closeSheet, scanSheet, qrSvg, esc, t3, copyText, shareText, saveBlob, drawCert, saveCanvas, printCanvas, kitStyle } from './schoolkit.js';
import { tx, L, LANGS } from './i18n.js';
import { LESSONS, BY_ID } from './lessons.js';
import { CURRICULUM } from './curriculum.js';

const S = {
  title: t3('Teacher dashboard', 'शिक्षक डैशबोर्ड', 'Teacher dashboard'), lab: t3('Open the lab →', 'लैब खोलिए →', 'Lab kholiye →'),
  classes: t3('My classes', 'मेरी कक्षाएँ', 'Meri classes'), principal: t3('Principal', 'प्रधानाचार्य', 'Principal'),
  newClass: t3('+ New class', '+ नई कक्षा', '+ Nayi class'), none: t3('Make your first class: the students join it with its 6-letter code.', 'पहली कक्षा बनाइए: विद्यार्थी उसके 6 अक्षर के कोड से जुड़ते हैं।', 'Pehli class banaiye: students uske 6 akshar ke code se judte hain.'),
  cname: t3('Class name (e.g. Robotics 8-B)', 'कक्षा का नाम (जैसे रोबोटिक्स 8-B)', 'Class ka naam (jaise Robotics 8-B)'), cls: t3('Class', 'कक्षा', 'Class'), sec: t3('Section', 'सेक्शन', 'Section'),
  teacher: t3('Teacher', 'शिक्षक', 'Teacher'), school: t3('School', 'विद्यालय', 'School'), make: t3('Make the class', 'कक्षा बनाइए', 'Class banaiye'),
  live: t3('🟢 Live (school Wi-Fi)', '🟢 लाइव (स्कूल वाई-फ़ाई)', '🟢 Live (school Wi-Fi)'), offline: t3('📴 No internet: QR hand-ins only', '📴 बिना इंटरनेट: केवल QR से जमा', '📴 Bina internet: sirf QR se jama'),
  code: t3('Class code', 'कक्षा कोड', 'Class code'), joinQR: t3('Join QR', 'जुड़ने का QR', 'Join QR'), offQR: t3('QR without internet', 'बिना इंटरनेट का QR', 'Bina internet ka QR'),
  joinHow: t3('Students: open the lab → 👤 → type the code or scan this QR.', 'विद्यार्थी: लैब खोलें → 👤 → कोड लिखें या यह QR स्कैन करें।', 'Students: lab kholo → 👤 → code likho ya ye QR scan karo.'),
  offHow: t3('This QR carries the class and its assignments, so it works without the internet. Students then hand in with their own QR.', 'इस QR में कक्षा और उसके असाइनमेंट हैं, इसलिए यह बिना इंटरनेट के चलता है। विद्यार्थी फिर अपने QR से जमा करते हैं।', 'Is QR me class aur assignments hain, isliye ye bina internet ke chalta hai. Students phir apne QR se jama karte hain.'),
  copyLink: t3('Copy link', 'लिंक कॉपी', 'Link copy'), otherDev: t3('Use on another device', 'दूसरे डिवाइस पर खोलिए', 'Doosre device par kholiye'),
  otherHow: t3('This private link opens the class with your teacher key on another phone or computer. Do not share it with students.', 'यह निजी लिंक आपकी शिक्षक कुंजी के साथ कक्षा को दूसरे फ़ोन या कंप्यूटर पर खोलता है। इसे विद्यार्थियों को न दें।', 'Ye private link aapki teacher key ke saath class ko doosre phone ya computer par kholta hai. Ise students ko mat dijiye.'),
  asg: t3('Assignments', 'असाइनमेंट', 'Assignments'), addAsg: t3('+ Assignment', '+ असाइनमेंट', '+ Assignment'), atitle: t3('Title (e.g. Week 1: LEDs)', 'शीर्षक (जैसे सप्ताह 1: LED)', 'Title (jaise Week 1: LEDs)'),
  due: t3('Due date', 'अंतिम तिथि', 'Due date'), pick: t3('Pick the lessons', 'पाठ चुनिए', 'Lessons chuniye'), fromCls: t3('Lessons of Class', 'इस कक्षा के पाठ', 'Is class ke lessons'), search: t3('Search any lesson', 'कोई भी पाठ खोजिए', 'Koi bhi lesson khojiye'),
  saveAsg: t3('Save assignment', 'असाइनमेंट सहेजिए', 'Assignment save kijiye'), del: t3('Delete', 'हटाइए', 'Hataiye'), chosen: t3('{n} lessons chosen', '{n} पाठ चुने', '{n} lessons chune'),
  students: t3('Students', 'विद्यार्थी', 'Students'), refresh: t3('↻ Refresh', '↻ ताज़ा', '↻ Refresh'), csv: t3('⬇ Excel (CSV)', '⬇ एक्सेल (CSV)', '⬇ Excel (CSV)'),
  collect: t3('📷 Collect hand-ins', '📷 जमा किए QR लीजिए', '📷 Hand-in QR lijiye'), device: t3('Students on this computer', 'इस कंप्यूटर के विद्यार्थी', 'Is computer ke students'),
  noStudents: t3('No student yet. Share the class code; their results appear here as they finish lessons.', 'अभी कोई विद्यार्थी नहीं। कक्षा कोड दीजिए; पाठ पूरे होते ही नतीजे यहाँ दिखेंगे।', 'Abhi koi student nahi. Class code dijiye; lesson poore hote hi results yahan dikhenge.'),
  hName: t3('Name', 'नाम', 'Naam'), hRoll: t3('Roll', 'रोल', 'Roll'), hDone: t3('Lessons', 'पाठ', 'Lessons'), hStars: t3('Stars', 'सितारे', 'Stars'), hScore: t3('Avg score', 'औसत अंक', 'Avg score'),
  hTime: t3('Time', 'समय', 'Time'), hMis: t3('Mistakes', 'ग़लतियाँ', 'Galtiyan'), hHint: t3('Hints', 'संकेत', 'Hints'), hLast: t3('Last seen', 'आख़िरी बार', 'Last seen'),
  board: t3('🏆 Leaderboard', '🏆 लीडरबोर्ड', '🏆 Leaderboard'), fastest: t3('🏁 Fastest challenge times', '🏁 सबसे तेज़ चुनौतियाँ', '🏁 Sabse tez challenges'),
  report: t3('Report card', 'रिपोर्ट कार्ड', 'Report card'), cert: t3('Certificate', 'प्रमाण-पत्र', 'Certificate'), skills: t3('Skills (NEP 2020)', 'कौशल (NEP 2020)', 'Skills (NEP 2020)'),
  got: t3('{n} hand-ins added ✓', '{n} जमा जोड़े गए ✓', '{n} hand-ins jud gaye ✓'), notOurs: t3('That code is for another class ({c}).', 'यह कोड दूसरी कक्षा ({c}) का है।', 'Ye code doosri class ({c}) ka hai.'), bad: t3('Not a hand-in code.', 'यह जमा कोड नहीं है।', 'Ye hand-in code nahi hai.'),
  tamper: t3('⚠ changed by hand', '⚠ हाथ से बदला गया', '⚠ haath se badla gaya'), netErr: t3('No internet: showing what this device has.', 'इंटरनेट नहीं: इस डिवाइस का डेटा दिख रहा है।', 'Internet nahi: is device ka data dikh raha hai.'),
  pTitle: t3('Principal: the whole school', 'प्रधानाचार्य: पूरा विद्यालय', 'Principal: poora school'), pCode: t3('School\'s DUET STEM code', 'विद्यालय का DUET STEM कोड', 'School ka DUET STEM code'),
  pHow: t3('The code your school activated the DUET STEM apps with. It shows every class made on the school\'s devices (read only). It is not stored.', 'वह कोड जिससे विद्यालय ने DUET STEM ऐप चालू किए। यह विद्यालय के डिवाइसों पर बनी हर कक्षा दिखाता है (केवल देखने के लिए)। इसे सहेजा नहीं जाता।', 'Wo code jisse school ne DUET STEM apps activate kiye. Ye school ke devices par bani har class dikhata hai (sirf dekhne ke liye). Ise save nahi kiya jata.'),
  show: t3('Show', 'दिखाइए', 'Dikhaiye'), kClasses: t3('Classes', 'कक्षाएँ', 'Classes'), kStudents: t3('Students', 'विद्यार्थी', 'Students'), kActive: t3('Active this week', 'इस सप्ताह सक्रिय', 'Is hafte active'),
  kLessons: t3('Lessons done', 'पूरे पाठ', 'Poore lessons'), kStars: t3('Avg stars', 'औसत सितारे', 'Avg stars'), kTime: t3('Hours learning', 'सीखने के घंटे', 'Seekhne ke ghante'),
  top: t3('Top students', 'सबसे आगे विद्यार्थी', 'Sabse aage students'), badCode: t3('That code is not a valid DUET STEM school code.', 'यह मान्य DUET STEM विद्यालय कोड नहीं है।', 'Ye valid DUET STEM school code nahi hai.'),
  noSync: t3('Live classes are not switched on yet; offline QR hand-ins work.', 'लाइव कक्षाएँ अभी चालू नहीं हैं; बिना इंटरनेट QR से जमा चलता है।', 'Live classes abhi chalu nahi hain; offline QR hand-in chalta hai.'),
  folio: t3('Portfolio link (for parents)', 'पोर्टफ़ोलियो लिंक (अभिभावकों के लिए)', 'Portfolio link (parents ke liye)'),
};
const $ = (s, r = document) => r.querySelector(s);
const fmtDay = (d) => { if (!d) return ''; if (typeof d === 'number') { const x = new Date(d); return `${String(x.getDate()).padStart(2, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}-${x.getFullYear()}`; } return d.length === 8 ? `${d.slice(6, 8)}-${d.slice(4, 6)}-${d.slice(0, 4)}` : d; };
const title = (id) => (BY_ID[id] ? tx(BY_ID[id].title) : id);
const LAB = new URL('index.html', location.href).href;

let st = SC.load(); const save = () => SC.save(st);
st.tclasses = st.tclasses || {}; st.roster = st.roster || {};
let byHash = null; const hashes = () => byHash || (byHash = Object.fromEntries(LESSONS.map((l) => [SC.lhash(l.id), l.id])));
let tab = 'classes', curCode = null, live = {}; // live[code] = { at, students: {key: {...}}, err }
L.lang = localStorage.getItem('rl360.lang') || 'en'; if (!LANGS.includes(L.lang)) L.lang = 'en'; document.documentElement.lang = L.lang;

// ------------------------------------------------------------ students of a class: live + QR hand-ins + this computer
function rosterOf(code) {
  const out = {}; const keyOf = (roll, name) => (String(roll || '').trim() ? 'r:' + String(roll).trim().toLowerCase() : 'n:' + String(name || '').trim().toLowerCase());
  const add = (k, s, src) => {
    const o = out[k] || (out[k] = { name: s.name, roll: s.roll, res: {}, last: 0, src: new Set(), warn: false, pk: s.pk || '' });
    o.name = o.name || s.name; o.roll = o.roll || s.roll; o.src.add(src); o.warn = o.warn || !!s.warn; if (s.pk) o.pk = s.pk;
    const last = typeof s.last === 'number' ? s.last : (s.last ? Date.parse(`${s.last.slice(0, 4)}-${s.last.slice(4, 6)}-${s.last.slice(6, 8)}`) : 0); o.last = Math.max(o.last, last || 0);
    for (const [id, r] of Object.entries(s.res || {})) { const x = o.res[id]; if (!x || r.sc > x.sc || (r.sc === x.sc && r.t < x.t)) o.res[id] = Object.assign({}, r, x && x.ch && (!r.ch || x.ch < r.ch) ? { ch: x.ch } : {}); else if (r.ch && (!x.ch || r.ch < x.ch)) x.ch = r.ch; }
  };
  const L0 = live[code]; if (L0 && L0.students) for (const s of Object.values(L0.students)) add(keyOf(s.roll, s.name), s, 'live');
  for (const s of Object.values(st.roster[code] || {})) add(keyOf(s.roll, s.name), s, 'qr');
  for (const p of Object.values(st.profiles)) if (p.id !== 'guest' && (p.joined || []).includes(code)) add(keyOf(p.roll, p.name), { name: p.name, roll: p.roll, res: st.res[p.id] || {}, last: Date.now(), pk: p.pk }, 'device');
  return out;
}
async function pull(code) {
  const c = st.tclasses[code]; if (!c || c.offline) return;
  const r = await SC.api('class', { code, tk: c.tk }, location.href);
  if (!r || !r.ok) { live[code] = Object.assign(live[code] || {}, { err: r ? r.err : 'net' }); render(); return; }
  const students = {}; for (const s of r.students) students[s.id] = { name: s.name, roll: s.roll, last: s.last, res: {} };
  for (const [sid, l, s, sc, t, m, h, ch, d] of r.res) { const x = students[sid]; if (!x) continue; x.res[l] = { s, sc, t, m, h, d }; if (ch) x.res[l].ch = ch; }
  live[code] = { at: Date.now(), students };
  if (r.cls && r.cls.asg) { c.asg = r.cls.asg; save(); }
  render();
}

// ------------------------------------------------------------ the page
function render() {
  document.title = tx(S.title) + ' · Robotics Lab 360';
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = tx(S[el.dataset.t]);
  for (const b of document.querySelectorAll('#langs button')) b.classList.toggle('on', b.dataset.l === L.lang);
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('on', b.dataset.tab === tab);
  const main = $('#main');
  if (tab === 'principal') { main.innerHTML = principalHtml(); bindPrincipal(); return; }
  const codes = Object.keys(st.tclasses); if (!curCode || !st.tclasses[curCode]) curCode = codes[0] || null;
  const list = codes.map((k) => `<button class="cl${k === curCode ? ' on' : ''}" data-cl="${k}"><b>${esc(st.tclasses[k].name)}</b><span>${esc(k)}</span></button>`).join('');
  main.innerHTML = `<aside id="cls">${list}<button class="btn pri" id="t-new">${esc(tx(S.newClass))}</button></aside><section id="pane">${curCode ? classHtml(curCode) : `<div class="empty"><p>${esc(tx(S.none))}</p></div>`}</section>`;
  for (const b of main.querySelectorAll('[data-cl]')) b.onclick = () => { curCode = b.dataset.cl; render(); pull(curCode); };
  $('#t-new').onclick = newClass; if (curCode) bindClass(curCode);
}
function classHtml(code) {
  const c = st.tclasses[code]; const R = rosterOf(code); const rows = Object.entries(R).sort((a, b) => (a[1].roll || '').localeCompare(b[1].roll || '', undefined, { numeric: true }) || a[1].name.localeCompare(b[1].name));
  const asg = c.asg || []; const L0 = live[code];
  const status = c.offline ? tx(S.offline) : L0 && L0.err === 'nosync' ? tx(S.noSync) : L0 && L0.err ? tx(S.netErr) : tx(S.live);
  const head = `<tr><th>${esc(tx(S.hRoll))}</th><th>${esc(tx(S.hName))}</th>${asg.map((a) => `<th title="${esc(a.title)}">${esc(a.title.slice(0, 18))}</th>`).join('')}<th>${esc(tx(S.hDone))}</th><th>${esc(tx(S.hStars))}</th><th>${esc(tx(S.hScore))}</th><th>${esc(tx(S.hTime))}</th><th>${esc(tx(S.hMis))}</th><th>${esc(tx(S.hHint))}</th><th>${esc(tx(S.hLast))}</th></tr>`;
  const body = rows.map(([k, s]) => {
    const res = Object.values(s.res).filter((r) => r.s); const T = SC.totals(s.res); const avg = res.length ? Math.round(res.reduce((a, r) => a + r.sc, 0) / res.length) : 0;
    const per = asg.map((a) => { const ls = a.ls || []; const dn = ls.filter((id) => s.res[id] && s.res[id].s).length; const sts = ls.reduce((x, id) => x + ((s.res[id] && s.res[id].s) || 0), 0); return `<td class="${dn === ls.length && ls.length ? 'ok' : ''}">${dn}/${ls.length} <span class="stars">${sts ? sts + '★' : ''}</span></td>`; }).join('');
    return `<tr data-st="${esc(k)}" class="click"><td>${esc(s.roll)}</td><td><b>${esc(s.name)}</b>${s.warn ? ` <span class="bad" title="${esc(tx(S.tamper))}">⚠</span>` : ''}</td>${per}<td>${T.done}</td><td class="stars">${T.stars}</td><td>${avg || ''}</td><td>${SC.fmtT(T.t)}</td><td>${res.reduce((a, r) => a + (r.m || 0), 0)}</td><td>${res.reduce((a, r) => a + (r.h || 0), 0)}</td><td class="mute">${fmtDay(s.last)}</td></tr>`;
  }).join('');
  const board = rows.map(([, s]) => [s.name, SC.totals(s.res).stars]).sort((a, b) => b[1] - a[1]).slice(0, 10).filter((x) => x[1] > 0);
  const fast = {}; for (const [, s] of rows) for (const [id, r] of Object.entries(s.res)) if (r.ch && (!fast[id] || r.ch < fast[id][1])) fast[id] = [s.name, r.ch];
  return `<div class="ch"><div><h2>${esc(c.name)}</h2><p class="mute">${esc([c.cls && tx(S.cls) + ' ' + c.cls + (c.sec ? '-' + c.sec : ''), c.teacher, c.school].filter(Boolean).join(' · '))} · ${esc(status)}</p></div>
      <div class="code-big" title="${esc(tx(S.code))}">${esc(code)}</div></div>
    <div class="row"><button class="btn pri" id="t-jq">${esc(tx(S.joinQR))}</button><button class="btn" id="t-oq">${esc(tx(S.offQR))}</button><button class="btn" id="t-cl">${esc(tx(S.copyLink))}</button><button class="btn" id="t-od">${esc(tx(S.otherDev))}</button></div>
    <h3>${esc(tx(S.asg))}</h3><div class="asgs">${asg.map((a, i) => `<div class="card"><b>${esc(a.title)}</b> <span class="mute">${a.due ? fmtDay(a.due) : ''} · ${esc(tx(S.chosen, { n: (a.ls || []).length }))}</span> <button class="btn sm" data-ea="${i}">✎</button></div>`).join('')}<button class="btn" id="t-asg">${esc(tx(S.addAsg))}</button></div>
    <h3>${esc(tx(S.students))} (${rows.length})</h3>
    <div class="row"><button class="btn" id="t-rf">${esc(tx(S.refresh))}</button><button class="btn" id="t-qr">${esc(tx(S.collect))}</button><button class="btn" id="t-csv">${esc(tx(S.csv))}</button></div>
    ${rows.length ? `<div class="tw"><table class="grid">${head}${body}</table></div>` : `<p class="mute">${esc(tx(S.noStudents))}</p>`}
    ${board.length ? `<div class="two"><div><h3>${esc(tx(S.board))}</h3><ol>${board.map(([n, s]) => `<li><b>${esc(n)}</b> <span class="stars">${s} ★</span></li>`).join('')}</ol></div>
    <div><h3>${esc(tx(S.fastest))}</h3><ol>${Object.entries(fast).slice(0, 10).map(([id, [n, t]]) => `<li>${esc(title(id))}: <b>${esc(n)}</b> ${SC.fmtT(t)}</li>`).join('') || '<li class="mute">—</li>'}</ol></div></div>` : ''}`;
}
function bindClass(code) {
  const c = st.tclasses[code]; const link = LAB + '?join=' + code;
  $('#t-jq').onclick = () => { const box = sheet(`<h2>${esc(c.name)} · <span style="font-family:var(--mono)">${esc(code)}</span></h2><p>${esc(tx(S.joinHow))}</p><div class="qr">${qrSvg(link)}</div><div class="code">${esc(link)}</div>`); void box; };
  $('#t-oq').onclick = () => { const txt = SC.classCode(Object.assign({ code }, c)); sheet(`<h2>${esc(tx(S.offQR))}</h2><p>${esc(tx(S.offHow))}</p><div class="qr">${qrSvg(LAB + '?join=' + encodeURIComponent(txt))}</div>`); };
  $('#t-cl').onclick = async () => { await copyText(link); toast('✓'); };
  $('#t-od').onclick = () => { const l = new URL('teacher.html#t=' + code + '.' + c.tk, location.href).href; const box = sheet(`<h2>${esc(tx(S.otherDev))}</h2><p>${esc(tx(S.otherHow))}</p><div class="qr">${qrSvg(l)}</div><div class="row"><button class="btn" id="t-c2">${esc(tx(S.copyLink))}</button></div>`); box.querySelector('#t-c2').onclick = () => copyText(l); };
  $('#t-asg').onclick = () => editAsg(code, -1);
  for (const b of document.querySelectorAll('[data-ea]')) b.onclick = () => editAsg(code, +b.dataset.ea);
  $('#t-rf').onclick = () => pull(code);
  $('#t-qr').onclick = () => scanSheet(S.collect, (text) => { addHandIns(code, text); return false; }, '');
  $('#t-csv').onclick = () => csv(code);
  for (const tr of document.querySelectorAll('[data-st]')) tr.onclick = () => student(code, tr.dataset.st);
}
function addHandIns(code, text) {
  const parts = String(text).split(/\s+/).filter((x) => /RLH1/.test(x)); let n = 0;
  for (const p of parts.length ? parts : [text]) { const h = SC.parseHandIn(p, hashes()); if (!h) { toast(tx(S.bad)); continue; } if (h.code !== code) { toast(tx(S.notOurs, { c: h.code })); continue; } SC.addHandIn(st, h); n++; }
  if (n) { save(); toast(tx(S.got, { n })); render(); }
}
function csv(code) {
  const c = st.tclasses[code]; const R = rosterOf(code); const ids = [...new Set(Object.values(R).flatMap((s) => Object.keys(s.res)))];
  const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [['Roll', 'Name', 'Lessons', 'Stars', 'Time (min)', ...ids.map((id) => title(id) + ' (stars)')].map(q).join(',')];
  for (const s of Object.values(R)) { const T = SC.totals(s.res); lines.push([s.roll, s.name, T.done, T.stars, Math.round(T.t / 60), ...ids.map((id) => (s.res[id] ? s.res[id].s : ''))].map(q).join(',')); }
  saveBlob(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }), `${c.name.replace(/[^\w-]+/g, '_')}-${SC.today()}.csv`);
}
function skillsHtml(res) {
  const sk = SC.skillReport(res, BY_ID);
  return Object.entries(SC.SKILLS).map(([k, d]) => { const s = sk[k]; const pct = s.next ? Math.min(100, Math.round(s.pts / s.next * 100)) : 100; return `<div class="sk-skill"><span>${esc(tx(d))} <span class="mute">(${esc(tx(d.nep))})</span></span><div class="bar"><i style="width:${pct}%"></i></div><span class="lv">${esc(tx(SC.LEVELS[s.lv]))}</span></div>`; }).join('');
}
function student(code, key) {
  const c = st.tclasses[code]; const s = rosterOf(code)[key]; if (!s) return; const T = SC.totals(s.res);
  const rows = Object.entries(s.res).filter(([, r]) => r.s).sort((a, b) => (b[1].d || '').localeCompare(a[1].d || '')).map(([id, r]) => `<tr><td>${esc(title(id))}</td><td class="stars">${SC.starTxt(r.s)}</td><td>${r.sc}</td><td>${SC.fmtT(r.t)}</td><td>${r.m}</td><td>${r.h}</td><td>${r.ch ? SC.fmtT(r.ch) : ''}</td><td class="mute">${fmtDay(r.d)}</td></tr>`).join('');
  const box = sheet(`<h2>${esc(s.name)}${s.roll ? ' · ' + esc(tx(S.hRoll)) + ' ' + esc(s.roll) : ''}</h2><p class="mute">${esc(c.name)}</p>
    <div class="grid"><div class="tile"><b>${T.done}</b><span>${esc(tx(S.hDone))}</span></div><div class="tile"><b class="stars">${T.stars} ★</b><span>${esc(tx(S.hStars))}</span></div><div class="tile"><b>${SC.fmtT(T.t)}</b><span>${esc(tx(S.hTime))}</span></div></div>
    <h3>${esc(tx(S.skills))}</h3>${skillsHtml(s.res)}
    <div class="row" style="margin-top:12px"><button class="btn pri" id="t-rc">${esc(tx(S.report))}</button><button class="btn" id="t-ce">${esc(tx(S.cert))}</button>${s.pk ? `<button class="btn" id="t-pf">${esc(tx(S.folio))}</button>` : ''}</div>
    <h3>${esc(tx(S.hDone))}</h3><div class="tw"><table><tr><th></th><th>★</th><th>%</th><th>${esc(tx(S.hTime))}</th><th>${esc(tx(S.hMis))}</th><th>${esc(tx(S.hHint))}</th><th>🏁</th><th></th></tr>${rows}</table></div>`, { wide: true });
  box.querySelector('#t-rc').onclick = () => reportCard(c, s);
  box.querySelector('#t-ce').onclick = () => certificate(c, s);
  const pf = box.querySelector('#t-pf'); if (pf) pf.onclick = () => copyText(new URL('portfolio.html?p=' + s.pk, location.href).href).then(() => toast('✓'));
}
async function certificate(c, s) {
  const T = SC.totals(s.res); const sk = SC.skillReport(s.res, BY_ID); const best = Object.entries(sk).filter(([, x]) => x.lv >= 1).sort((a, b) => b[1].pts - a[1].pts).slice(0, 2).map(([k, x]) => `${tx(SC.LEVELS[x.lv])}: ${tx(SC.SKILLS[k])}`).join(', ');
  const day = SC.today(); const what = `${c.name}: ${T.done} ${L.lang === 'hi' ? 'प्रोजेक्ट' : 'projects'}`;
  const cv = document.createElement('canvas'); cv.className = 'cert';
  const box = sheet(`<h2>🏅 ${esc(s.name)}</h2><div id="cvw"></div><div class="row"><button class="btn pri" id="t-sv">⬇ PNG</button><button class="btn" id="t-pr">🖨</button></div>`, { wide: true }); box.querySelector('#cvw').appendChild(cv);
  await drawCert(cv, { lang: L.lang, name: s.name, cls: [c.cls, c.sec].filter(Boolean).join('-'), school: c.school, what, stats: `${T.done} · ${T.stars} ★${best ? ' · ' + best : ''}`, day, code: SC.certCode(s.name, 'class' + c.code + T.done, day), stars: Math.round(T.stars / Math.max(1, T.done)) });
  box.querySelector('#t-sv').onclick = () => saveCanvas(cv, `certificate-${s.name.replace(/\s+/g, '-')}.png`); box.querySelector('#t-pr').onclick = () => printCanvas(cv, s.name);
}
function reportCard(c, s) { // an A4 page in a new window (print or save as PDF)
  const T = SC.totals(s.res); const sk = SC.skillReport(s.res, BY_ID); const res = Object.entries(s.res).filter(([, r]) => r.s);
  const rows = res.map(([id, r]) => `<tr><td>${esc(title(id))}</td><td>${'★'.repeat(r.s)}</td><td>${r.sc}</td><td>${SC.fmtT(r.t)}</td><td>${r.m}</td><td>${r.h}</td></tr>`).join('');
  const sks = Object.entries(SC.SKILLS).map(([k, d]) => `<tr><td>${esc(tx(d))}</td><td>${esc(tx(d.nep))}</td><td><b>${esc(tx(SC.LEVELS[sk[k].lv]))}</b></td><td>${sk[k].pts}</td></tr>`).join('');
  const day = SC.today(); const chk = SC.certCode(s.name, 'report' + c.code + T.done + T.stars, day);
  const html = `<!doctype html><html lang="${L.lang}"><meta charset="utf-8"><title>${esc(s.name)} · ${esc(tx(S.report))}</title><style>@page{size:A4;margin:14mm}body{font:12.5px/1.45 "Noto Sans Devanagari",system-ui,sans-serif;color:#1b2433}h1{font-size:20px;margin:0}h2{font-size:14px;margin:16px 0 6px;color:#b8632a}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d9d2c3;padding:4px 6px;text-align:left}th{background:#f6efe2}.hd{display:flex;justify-content:space-between;align-items:center;background:#121a26;color:#f2ede4;padding:10px 14px;border-radius:8px}.hd img{height:20px}.k{display:flex;gap:10px;margin-top:10px}.k div{flex:1;border:1px solid #d9d2c3;border-radius:8px;padding:8px;text-align:center}.k b{display:block;font-size:18px}.ft{margin-top:24px;display:flex;justify-content:space-between;color:#6b7282}</style>
    <div class="hd"><img src="${new URL('brand/duet-stem-logo-light.png', location.href).href}"><b>ROBOTICS LAB 360 · ${esc(tx(S.report).toUpperCase())}</b></div>
    <h1 style="margin-top:12px">${esc(s.name)}</h1><div>${esc([s.roll && 'Roll ' + s.roll, c.name, c.cls && 'Class ' + c.cls + (c.sec ? '-' + c.sec : ''), c.school].filter(Boolean).join(' · '))}</div>
    <div class="k"><div><b>${T.done}</b>${esc(tx(S.hDone))}</div><div><b>${T.stars} ★</b>${esc(tx(S.hStars))}</div><div><b>${T.three}</b>★★★</div><div><b>${SC.fmtT(T.t)}</b>${esc(tx(S.hTime))}</div></div>
    <h2>${esc(tx(S.skills))} · NCF-SE 2023</h2><table><tr><th></th><th>NEP</th><th></th><th>pts</th></tr>${sks}</table>
    <h2>${esc(tx(S.hDone))}</h2><table><tr><th></th><th>★</th><th>%</th><th>⏱</th><th>${esc(tx(S.hMis))}</th><th>${esc(tx(S.hHint))}</th></tr>${rows}</table>
    <div class="ft"><span>${esc(tx(S.teacher))}: ____________________</span><span>${fmtDay(day)} · check ${chk}</span></div><script>onload=function(){setTimeout(function(){print()},400)}<\/script>`;
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } else saveBlob(new Blob([html], { type: 'text/html' }), `report-${s.name.replace(/\s+/g, '-')}.html`);
}
// ------------------------------------------------------------ a new class, an assignment
function newClass() {
  const lic = (() => { try { return JSON.parse(localStorage.getItem('duet.lic.v1') || 'null') || {}; } catch (e) { return {}; } })();
  const box = sheet(`<h2>${esc(tx(S.newClass))}</h2><div class="grid"><label class="f">${esc(tx(S.cname))}<input id="n-n" maxlength="60"></label><label class="f">${esc(tx(S.cls))}<select id="n-c">${['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((x) => `<option>${x}</option>`).join('')}</select></label><label class="f">${esc(tx(S.sec))}<input id="n-s" maxlength="4"></label></div>
    <div class="grid"><label class="f">${esc(tx(S.teacher))}<input id="n-t" maxlength="60" value="${esc(st.opts.teacher || '')}"></label><label class="f">${esc(tx(S.school))}<input id="n-sc" maxlength="100" value="${esc(st.opts.school || lic.n || '')}"></label></div>
    <div class="row"><button class="btn pri" id="n-go">${esc(tx(S.make))}</button></div><p class="mute" id="n-m"></p>`);
  box.querySelector('#n-go').onclick = async () => {
    const v = { name: box.querySelector('#n-n').value.trim(), cls: box.querySelector('#n-c').value, sec: box.querySelector('#n-s').value.trim(), teacher: box.querySelector('#n-t').value.trim(), school: box.querySelector('#n-sc').value.trim() };
    if (!v.name) { box.querySelector('#n-n').focus(); return; }
    st.opts.teacher = v.teacher; st.opts.school = v.school;
    const code = SC.newCode(6), tk = SC.newCode(20); const c = Object.assign({ tk, asg: [], made: SC.today() }, v);
    box.querySelector('#n-go').disabled = true;
    const r = await SC.api('mkclass', Object.assign({ code, tk, sh: SC.schoolHash(), asg: [] }, v), location.href);
    if (!(r && r.ok)) c.offline = true; // no internet (or live classes not switched on): it works with QR hand-ins
    st.tclasses[code] = c; curCode = code; save(); closeSheet(); render();
  };
}
function editAsg(code, i) {
  const c = st.tclasses[code]; const a = i >= 0 ? c.asg[i] : { id: 'a' + SC.newCode(3), title: '', due: '', ls: [] }; const chosen = new Set(a.ls || []);
  const clsOpts = Object.keys(CURRICULUM).filter((k) => CURRICULUM[k].length);
  const box = sheet(`<h2>${esc(i >= 0 ? a.title : tx(S.addAsg))}</h2><div class="grid"><label class="f">${esc(tx(S.atitle))}<input id="a-t" maxlength="80" value="${esc(a.title)}"></label><label class="f">${esc(tx(S.due))}<input id="a-d" type="date" value="${a.due ? `${a.due.slice(0, 4)}-${a.due.slice(4, 6)}-${a.due.slice(6, 8)}` : ''}"></label></div>
    <h3>${esc(tx(S.pick))} · <span id="a-n"></span></h3><div class="row"><label class="f">${esc(tx(S.fromCls))}<select id="a-c">${clsOpts.map((k) => `<option${k === String(c.cls) ? ' selected' : ''}>${k}</option>`).join('')}</select></label><label class="f" style="flex:1">${esc(tx(S.search))}<input id="a-q" type="search"></label></div>
    <div id="a-l" class="picks"></div><div class="row"><button class="btn pri" id="a-go">${esc(tx(S.saveAsg))}</button>${i >= 0 ? `<button class="btn" id="a-x">${esc(tx(S.del))}</button>` : ''}</div>`, { wide: true });
  const list = () => {
    const q = box.querySelector('#a-q').value.trim().toLowerCase(); const k = box.querySelector('#a-c').value;
    const items = q ? LESSONS.filter((l) => ['en', 'hi', 'hg'].some((x) => String(l.title[x] || '').toLowerCase().includes(q))).slice(0, 80).map((l) => ({ id: l.id, n: '' })) : (CURRICULUM[k] || []);
    box.querySelector('#a-l').innerHTML = items.filter((x) => BY_ID[x.id]).map((x) => `<label class="pk"><input type="checkbox" data-id="${x.id}"${chosen.has(x.id) ? ' checked' : ''}> ${x.n ? `<span class="mute">${x.n}.</span> ` : ''}${esc(title(x.id))}</label>`).join('');
    for (const cb of box.querySelectorAll('[data-id]')) cb.onchange = () => { if (cb.checked) chosen.add(cb.dataset.id); else chosen.delete(cb.dataset.id); box.querySelector('#a-n').textContent = tx(S.chosen, { n: chosen.size }); };
    box.querySelector('#a-n').textContent = tx(S.chosen, { n: chosen.size });
  };
  box.querySelector('#a-c').onchange = list; box.querySelector('#a-q').oninput = list; list();
  const commit = async () => { save(); if (!c.offline) { const r = await SC.api('setclass', { code, tk: c.tk, asg: c.asg }, location.href); if (!(r && r.ok)) toast(tx(S.netErr)); } closeSheet(); render(); };
  box.querySelector('#a-go').onclick = () => { a.title = box.querySelector('#a-t').value.trim() || 'Assignment'; const d = box.querySelector('#a-d').value; a.due = d ? d.replace(/-/g, '') : ''; a.ls = [...chosen]; if (i < 0) c.asg.push(a); commit(); };
  const x = box.querySelector('#a-x'); if (x) x.onclick = () => { c.asg.splice(i, 1); commit(); };
}
// ------------------------------------------------------------ principal
let school = null;
function principalHtml() {
  let h = `<section id="pane" class="full"><h2>${esc(tx(S.pTitle))}</h2><p class="mute">${esc(tx(S.pHow))}</p><div class="row"><input id="p-k" placeholder="DUET-XXXX-XXXX-XXXX" style="width:260px;font-family:var(--mono)" autocomplete="off"><button class="btn pri" id="p-go">${esc(tx(S.show))}</button></div>`;
  if (school) {
    const all = []; let lessons = 0, stars = 0, t = 0, active = 0; const week = Date.now() - 7 * 864e5;
    for (const k of school) { const studs = {}; for (const s of k.students) studs[s.id] = { name: s.name, roll: s.roll, last: s.last, res: {} }; for (const [sid, l, s, sc, tt, m, hh, ch, d] of k.res) if (studs[sid]) studs[sid].res[l] = { s, sc, t: tt, m, h: hh, ch, d }; k.studs = studs;
      for (const s of Object.values(studs)) { const T = SC.totals(s.res); lessons += T.done; stars += T.stars; t += T.t; if (s.last > week) active++; all.push([s.name, k.cls.name, T.stars, T.done]); } }
    const nS = all.length;
    h += `<div class="grid kpi"><div class="tile"><b>${school.length}</b><span>${esc(tx(S.kClasses))}</span></div><div class="tile"><b>${nS}</b><span>${esc(tx(S.kStudents))}</span></div><div class="tile"><b>${active}</b><span>${esc(tx(S.kActive))}</span></div><div class="tile"><b>${lessons}</b><span>${esc(tx(S.kLessons))}</span></div><div class="tile"><b>${lessons ? (stars / lessons).toFixed(1) : '–'}</b><span>${esc(tx(S.kStars))}</span></div><div class="tile"><b>${(t / 3600).toFixed(1)}</b><span>${esc(tx(S.kTime))}</span></div></div>
      <div class="tw"><table class="grid"><tr><th>${esc(tx(S.kClasses))}</th><th>${esc(tx(S.teacher))}</th><th>${esc(tx(S.kStudents))}</th><th>${esc(tx(S.kLessons))}</th><th>${esc(tx(S.kStars))}</th><th>${esc(tx(S.kTime))}</th></tr>${school.map((k) => { const ss = Object.values(k.studs); const T = ss.reduce((a, s) => { const x = SC.totals(s.res); a.d += x.done; a.s += x.stars; a.t += x.t; return a; }, { d: 0, s: 0, t: 0 }); return `<tr><td><b>${esc(k.cls.name)}</b> <span class="mute">${esc(k.cls.code)}</span></td><td>${esc(k.cls.teacher)}</td><td>${ss.length}</td><td>${T.d}</td><td>${T.d ? (T.s / T.d).toFixed(1) : '–'}</td><td>${(T.t / 3600).toFixed(1)}</td></tr>`; }).join('')}</table></div>
      <h3>${esc(tx(S.top))}</h3><ol>${all.sort((a, b) => b[2] - a[2]).slice(0, 15).map(([n, c, s, d]) => `<li><b>${esc(n)}</b> <span class="mute">${esc(c)}</span> <span class="stars">${s} ★</span> · ${d}</li>`).join('')}</ol><div class="row"><button class="btn" id="p-csv">${esc(tx(S.csv))}</button></div>`;
  }
  return h + '</section>';
}
function bindPrincipal() {
  const go = async () => { const k = $('#p-k').value.trim(); if (!k) return; $('#p-go').disabled = true; const r = await SC.api('school', { k }, location.href); $('#p-go').disabled = false; if (!r || !r.ok) { toast(tx(r && r.err === 'code' ? S.badCode : r && r.err === 'nosync' ? S.noSync : S.netErr)); return; } school = r.classes; render(); };
  $('#p-go').onclick = go; $('#p-k').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  const c = $('#p-csv'); if (c) c.onclick = () => { const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`; const lines = [['Class', 'Code', 'Teacher', 'Roll', 'Name', 'Lessons', 'Stars', 'Minutes'].map(q).join(',')]; for (const k of school) for (const s of Object.values(k.studs)) { const T = SC.totals(s.res); lines.push([k.cls.name, k.cls.code, k.cls.teacher, s.roll, s.name, T.done, T.stars, Math.round(T.t / 60)].map(q).join(',')); } saveBlob(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }), `school-${SC.today()}.csv`); };
}
// ------------------------------------------------------------ start
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3500); }
kitStyle();
for (const b of document.querySelectorAll('#langs button')) b.onclick = () => { L.lang = b.dataset.l; localStorage.setItem('rl360.lang', L.lang); document.documentElement.lang = L.lang; render(); };
for (const b of document.querySelectorAll('#tabs button')) b.onclick = () => { tab = b.dataset.tab; render(); };
const hm = /#t=([0-9A-Z]{6})\.([0-9A-Za-z]{10,40})/.exec(location.hash); // a teacher's own link from another device
if (hm) { history.replaceState(null, '', location.pathname + location.search); (async () => { const r = await SC.api('class', { code: hm[1], tk: hm[2] }, location.href); if (r && r.ok) { st.tclasses[hm[1]] = Object.assign({ tk: hm[2] }, r.cls); delete st.tclasses[hm[1]].code; curCode = hm[1]; save(); render(); pull(hm[1]); } })(); }
render(); if (curCode) pull(curCode);
setInterval(() => { if (tab === 'classes' && curCode && document.visibilityState === 'visible' && !document.querySelector('.sk-back')) pull(curCode); }, 60000);
window.teacher = { get state() { return st; }, render, pull, addHandIns };
