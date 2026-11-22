// DUET Robotics Lab 360: the school layer in the lab (school.js keeps the data, schoolkit.js draws the sheets).
//   👤 in the top bar     who is learning: one or many students on this device (a lab computer, a panel), their progress,
//                         skills (NEP 2020), classes and assignments, certificates, the portfolio link for parents
//   every lesson          is timed (active time only) and scored: mistakes (a failed check, a burnt part, the fuse, a
//                         run-time error, compile errors) and hints; at the end its stars, and the strip shows them
//   🏁 Challenge          the same lesson again without the ghosts and the helper, against the clock (best time kept)
//   classes               join with the teacher's 6-letter code (live, school Wi-Fi) or the teacher's QR code (no internet);
//                         live classes get each finished lesson at once (kept and sent later when offline); without the
//                         internet a student shows a hand-in QR code to the teacher's dashboard
//   ⬇ Install             the browser's own install (an app window and an icon; works without the internet)
import * as SC from './school.js';
import { sheet, closeSheet, sheetOpen, scanSheet, qrSvg, esc, t3, copyText, shareText, drawCert, saveCanvas, printCanvas, kitStyle } from './schoolkit.js';
import { tx, L } from './i18n.js';
import { LESSONS, BY_ID } from './lessons.js';
import { CURRICULUM } from './curriculum.js';

// In a headset (Meta Quest and others, where students aged 10 and over may use the Store app) a student's name stays on
// the device: no live class by code and no portfolio link, so nothing that names a student is sent anywhere.
const HEADSET = /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
const S = {
  me: t3('Me', 'मैं', 'Main'), guest: t3('Your name', 'अपना नाम', 'Apna naam'),
  who: t3('Who is learning?', 'कौन सीख रहा है?', 'Kaun seekh raha hai?'),
  whyName: t3('Your name goes on your stars, your certificates and your teacher\'s list. Everything stays on this device unless you join a class.', 'आपका नाम आपके सितारों, प्रमाण-पत्रों और शिक्षक की सूची पर आता है। जब तक आप कक्षा से नहीं जुड़ते, सब कुछ इसी डिवाइस पर रहता है।', 'Aapka naam aapke stars, certificates aur teacher ki list par aata hai. Jab tak aap class join nahi karte, sab isi device par rehta hai.'),
  name: t3('Name', 'नाम', 'Naam'), roll: t3('Roll no.', 'रोल नं.', 'Roll no.'), cls: t3('Class', 'कक्षा', 'Class'), sec: t3('Section', 'सेक्शन', 'Section'),
  start: t3('Start learning', 'सीखना शुरू कीजिए', 'Seekhna shuru kijiye'), save: t3('Save', 'सहेजिए', 'Save kijiye'), add: t3('+ Another student', '+ दूसरा विद्यार्थी', '+ Doosra student'),
  switchTo: t3('Switch', 'बदलिए', 'Badaliye'), edit: t3('Edit', 'बदलिए', 'Edit'),
  done: t3('Lessons done', 'पूरे पाठ', 'Poore lessons'), stars: t3('Stars', 'सितारे', 'Stars'), three: t3('3-star lessons', '3-सितारा पाठ', '3-star lessons'), time: t3('Time learning', 'सीखने का समय', 'Seekhne ka samay'),
  skills: t3('Skills (NEP 2020)', 'कौशल (NEP 2020)', 'Skills (NEP 2020)'), classes: t3('My classes', 'मेरी कक्षाएँ', 'Meri classes'),
  join: t3('Join a class', 'कक्षा से जुड़िए', 'Class join kijiye'), joinCode: t3('Class code (6 letters)', 'कक्षा कोड (6 अक्षर)', 'Class code (6 akshar)'),
  scan: t3('📷 Scan the QR', '📷 QR स्कैन', '📷 QR scan'), joinBtn: t3('Join', 'जुड़िए', 'Join kijiye'),
  joined: t3('Joined {c} ✓', '{c} से जुड़ गए ✓', '{c} join ho gaya ✓'), noClass: t3('No class has this code. Check it with your teacher.', 'इस कोड की कोई कक्षा नहीं। शिक्षक से जाँच लीजिए।', 'Is code ki koi class nahi. Teacher se check kijiye.'),
  noNet: t3('No internet now. Ask your teacher for the class QR code (it works without internet).', 'अभी इंटरनेट नहीं है। शिक्षक से कक्षा का QR कोड माँगिए (वह बिना इंटरनेट के चलता है)।', 'Abhi internet nahi hai. Teacher se class ka QR code maangiye (wo bina internet ke chalta hai).'),
  due: t3('due {d}', 'अंतिम तिथि {d}', 'due {d}'), openNext: t3('Open next ›', 'अगला खोलिए ›', 'Agla kholiye ›'), allDone: t3('All done ✓', 'सब पूरा ✓', 'Sab poora ✓'),
  handIn: t3('Hand in (no internet)', 'जमा कीजिए (बिना इंटरनेट)', 'Jama kijiye (bina internet)'),
  handHow: t3('Show this QR code to your teacher\'s dashboard, or send the code below. Your stars, times and mistakes are in it.', 'यह QR कोड शिक्षक के डैशबोर्ड को दिखाइए, या नीचे का कोड भेजिए। इसमें आपके सितारे, समय और ग़लतियाँ हैं।', 'Ye QR code teacher ke dashboard ko dikhaiye, ya neeche ka code bhejiye. Isme aapke stars, time aur galtiyan hain.'),
  copy: t3('Copy', 'कॉपी', 'Copy'), share: t3('Share', 'भेजिए', 'Share'), copied: t3('Copied ✓', 'कॉपी हो गया ✓', 'Copy ho gaya ✓'),
  live: t3('Live: your teacher sees each lesson as you finish it.', 'लाइव: हर पाठ पूरा होते ही शिक्षक को दिखता है।', 'Live: har lesson poora hote hi teacher ko dikhta hai.'),
  waiting: t3('{n} results wait for the internet', '{n} नतीजे इंटरनेट की प्रतीक्षा में', '{n} results internet ka wait kar rahe hain'),
  certs: t3('Certificates', 'प्रमाण-पत्र', 'Certificates'), noCerts: t3('Finish 10 lessons for your first certificate.', 'पहले प्रमाण-पत्र के लिए 10 पाठ पूरे कीजिए।', 'Pehle certificate ke liye 10 lessons poore kijiye.'),
  view: t3('View', 'देखिए', 'Dekhiye'), savePic: t3('Save picture', 'तस्वीर सहेजिए', 'Picture save kijiye'), print: t3('Print', 'प्रिंट', 'Print'),
  folio: t3('Portfolio for parents', 'अभिभावकों के लिए पोर्टफ़ोलियो', 'Parents ke liye portfolio'),
  folioHow: t3('A link to your work (stars, skills, certificates) that your parents can open on their phone.', 'आपके काम (सितारे, कौशल, प्रमाण-पत्र) का लिंक, जो अभिभावक फ़ोन पर खोल सकते हैं।', 'Aapke kaam (stars, skills, certificates) ka link, jo parents phone par khol sakte hain.'),
  recent: t3('Recent lessons', 'हाल के पाठ', 'Haal ke lessons'), teacher: t3('Teacher? Open the dashboard →', 'शिक्षक हैं? डैशबोर्ड खोलिए →', 'Teacher hain? Dashboard kholiye →'),
  blox: t3('Scratch-style games, music and AI: DUETBlox (13 guided lessons) →', 'Scratch जैसे गेम, संगीत और AI: DUETBlox (13 पाठ) →', 'Scratch jaise games, music aur AI: DUETBlox (13 lessons) →'),
  askWho: t3('Ask "who is learning?" when the lab opens (a shared computer)', 'लैब खुलते ही पूछिए "कौन सीख रहा है?" (साझा कंप्यूटर)', 'Lab khulte hi poochiye "kaun seekh raha hai?" (shared computer)'),
  result: t3('{st}  ·  score {sc}  ·  {t}  ·  {m} mistakes  ·  {h} hints', '{st}  ·  अंक {sc}  ·  {t}  ·  {m} ग़लतियाँ  ·  {h} संकेत', '{st}  ·  score {sc}  ·  {t}  ·  {m} galtiyan  ·  {h} hints'),
  again: t3('Try for ★★★', '★★★ के लिए फिर', '★★★ ke liye phir'), challenge: t3('🏁 Challenge', '🏁 चुनौती', '🏁 Challenge'),
  chOn: t3('🏁 Challenge: no ghosts, no helper, the clock runs. Go!', '🏁 चुनौती: न परछाईं, न मदद, घड़ी चल रही है। शुरू!', '🏁 Challenge: na ghost, na help, ghadi chal rahi hai. Shuru!'),
  chDone: t3('🏁 Challenge done in {t} (best {b})', '🏁 चुनौती {t} में पूरी (सबसे तेज़ {b})', '🏁 Challenge {t} mein poora (best {b})'),
  install: t3('⬇ Install', '⬇ इंस्टॉल', '⬇ Install'), installHow: t3('Install this lab as an app on this computer: its own window and icon, and it works without the internet.', 'इस लैब को इस कंप्यूटर पर ऐप की तरह इंस्टॉल कीजिए: अपनी खिड़की और आइकन, और बिना इंटरनेट के भी चलेगा।', 'Is lab ko is computer par app ki tarah install kijiye: apni window aur icon, aur bina internet ke bhi chalega.'),
  installSafari: t3('On iPhone/iPad: Share ⬆ → Add to Home Screen. On a Mac (Safari): File → Add to Dock.', 'iPhone/iPad पर: शेयर ⬆ → होम स्क्रीन पर जोड़ें। Mac (Safari) पर: File → Add to Dock।', 'iPhone/iPad par: Share ⬆ → Add to Home Screen. Mac (Safari) par: File → Add to Dock.'),
  cert10: t3('Robotics Lab 360: first 10 projects', 'रोबोटिक्स लैब 360: पहले 10 प्रोजेक्ट', 'Robotics Lab 360: pehle 10 projects'),
  certN: t3('Robotics Lab 360: {n} projects', 'रोबोटिक्स लैब 360: {n} प्रोजेक्ट', 'Robotics Lab 360: {n} projects'),
  certCls: t3('Robotics & AI course, Class {c}', 'रोबोटिक्स और AI पाठ्यक्रम, कक्षा {c}', 'Robotics & AI course, Class {c}'),
  certAsg: t3('{a} ({c})', '{a} ({c})', '{a} ({c})'),
  statsLine: t3('{n} projects · {s} ★ · {k}', '{n} प्रोजेक्ट · {s} ★ · {k}', '{n} projects · {s} ★ · {k}'),
};
const fmtDay = (d) => (d && d.length === 8 ? `${d.slice(6, 8)}-${d.slice(4, 6)}-${d.slice(0, 4)}` : '');
const MILESTONES = [10, 25, 50, 100, 250, 500];

export function installSchool(app) {
  kitStyle();
  let st = SC.load(); const save = () => SC.save(st);
  let byHash = null; const hashes = () => byHash || (byHash = Object.fromEntries(LESSONS.map((l) => [SC.lhash(l.id), l.id])));
  const me = () => (st.me && st.profiles[st.me]) || null;
  const guestId = () => { if (!st.profiles.guest) { st.profiles.guest = { id: 'guest', name: '', roll: '', cls: '', sec: '', joined: [], made: SC.today() }; st.res.guest = st.res.guest || {}; } return 'guest'; };
  const pid = () => (me() ? st.me : guestId());
  const res = () => st.res[pid()] || {};
  // ------------------------------------------------------------ the attempt at the lesson that is open
  let att = null, chNext = null, lastInput = Date.now();
  for (const k of ['pointerdown', 'keydown', 'wheel']) addEventListener(k, () => { lastInput = Date.now(); }, { capture: true, passive: true });
  const expectsDamage = (l) => /burnt|BAT_SHORT|fuse|short/i.test([l.done, ...(l.steps || []).map((s) => s.until)].map((f) => String(f || '')).join(' ')) || l.group === 'circuits';
  setInterval(() => {
    if (!att || att.done || document.visibilityState !== 'visible') return;
    const running = app.lab && app.lab.mcu && app.lab.mcu.state === 'running';
    if (Date.now() - lastInput < 90000 || running) att.t++;
    if (att.ch) { const k = document.querySelector('#c-k'); if (k && !k.querySelector('.ch-t')) app.renderCard(); const e = document.querySelector('#c-k .ch-t'); if (e) e.textContent = '⏱ ' + SC.fmtT(att.t); }
  }, 1000);
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('openLesson', (o, id, quiet) => {
    const before = app.lessonId; o(id, quiet); if (app.lessonId !== id || app.mode !== 'lesson') return;
    const L0 = BY_ID[id]; att = { id, t: 0, m: 0, h: 0, ce: 0, ch: chNext === id, done: false, dmg: L0 ? expectsDamage(L0) : false }; chNext = null;
    if (att.ch) { app.toast(tx(S.chOn), null, 4000); app.updateGhosts(); }
    void before;
  });
  W('check', (o) => { o(); if (att && !att.done && app.checkMsg && !app.checkMsg.ok) att.m++; });
  W('run', (o) => { const r = o(); if (r === false && att && !att.done) { att.ce++; if (att.ce <= 3) att.m++; } return r; });
  app.lab.on((type) => { if (!att || att.done) return; if ((type === 'burn' || type === 'fuse') && !att.dmg) att.m++; if (type === 'error') att.m++; });
  W('updateGhosts', (o) => { if (att && att.ch && app.mode === 'lesson') { app.view.setLessonGhosts([]); return; } o(); });
  W('onLessonComplete', (o, lesson) => {
    o(lesson);
    if (!att || att.id !== lesson.id || att.done) return; att.done = true;
    const p = pid(); const before = (st.res[p] || {})[lesson.id];
    const rec = SC.record(st, p, lesson.id, { t: att.t, m: att.m, h: att.h, ch: att.ch, d: SC.today() });
    att.rec = rec; att.sc = SC.scoreOf(att.m, att.h); att.st = SC.starsOf(att.sc);
    SC.queue(st, p, lesson.id, rec); save(); flushSoon();
    if (att.ch) app.toast(tx(S.chDone, { t: SC.fmtT(att.t), b: SC.fmtT(rec.ch || att.t) }), null, 6000);
    void before; app.renderStrip(); app.renderCard(); renderTop();
  });
  W('renderStrip', (o) => {
    o(); const R = res();
    for (const b of document.querySelectorAll('#strip .chip[data-lesson]')) { const r = R[b.dataset.lesson]; if (!r || !r.s) continue; b.classList.add('ok'); const i = b.querySelector('i'); if (i) { i.textContent = r.s + '★'; i.className = 'st' + r.s; } }
  });
  W('renderCard', (o) => {
    o(); if (app.mode !== 'lesson' || !app.rt.lesson) return;
    const k = document.querySelector('#c-k'); if (att && att.ch && k && !att.done) k.insertAdjacentHTML('beforeend', ` <b class="ch-t">⏱ ${SC.fmtT(att.t)}</b>`);
    const r = app.rt, Ls = r.lesson; if (!(r.complete && r.i === Ls.steps.length - 1)) return;
    const x = document.querySelector('#c-x'); if (!x || !att || att.id !== Ls.id || !att.done) return;
    const line = tx(S.result, { st: SC.starTxt(att.st), sc: att.sc, t: SC.fmtT(att.t), m: att.m, h: att.h });
    x.insertAdjacentHTML('beforeend', `<div class="sk-res"><span class="stars">${esc(line)}</span><span class="sp"></span>${att.st < 3 ? `<button class="btn" data-sk="again">${esc(tx(S.again))}</button>` : ''}<button class="btn" data-sk="ch">${esc(tx(S.challenge))}</button></div>`);
    for (const b of x.querySelectorAll('[data-sk]')) b.onclick = () => { if (b.dataset.sk === 'ch') chNext = Ls.id; app.openLesson(Ls.id); };
  });
  const css = document.createElement('style'); css.textContent = `
#b-me{width:auto;padding:0 10px;gap:6px;font-size:13px;font-weight:700;display:flex;align-items:center;max-width:170px}#b-me span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#b-inst{width:auto;padding:0 10px;font-size:12.5px;font-weight:700;color:var(--acc)}
.chip i.st3{background:rgba(255,215,106,.22);color:#ffd76a}.chip i.st2,.chip i.st1{background:rgba(120,200,120,.2);color:var(--green)}.chip i.st1,.chip i.st2,.chip i.st3{font-size:10.5px;width:auto;min-width:24px;padding:0 3px}
#c-k .ch-t{margin-left:8px;color:#ffd76a;font-family:var(--mono)}
.sk-res{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(255,215,106,.08);border:1px solid rgba(255,215,106,.25)}.sk-res .stars{color:#ffd76a;font-weight:700;font-size:14px}.sk-res .sp{flex:1}
@media (max-height:520px){#b-me span{display:none}#b-inst{display:none}}`;
  document.head.appendChild(css);

  // ------------------------------------------------------------ the top bar: 👤 and ⬇ Install
  const tools = document.querySelector('#tools'); const mb = document.createElement('button'); mb.id = 'b-me'; mb.className = 'ib'; mb.onclick = () => openMe();
  tools.insertBefore(mb, tools.firstChild);
  let deferred = null; const ib = document.createElement('button'); ib.id = 'b-inst'; ib.className = 'ib'; ib.hidden = true; ib.onclick = () => install(); tools.insertBefore(ib, mb.nextSibling);
  const standalone = () => (matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone || /^127\.0\.0\.1$/.test(location.hostname) || window.DUET_NATIVE || window.DuetNative;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; if (!standalone()) { ib.hidden = false; renderTop(); } });
  addEventListener('appinstalled', () => { ib.hidden = true; deferred = null; });
  async function install() { if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (e) { /* */ } deferred = null; ib.hidden = true; return; } sheet(`<h2>${esc(tx(S.install))}</h2><p>${esc(tx(S.installHow))}</p><p class="mute">${esc(tx(S.installSafari))}</p>`); }
  function renderTop() { const p = me(); mb.innerHTML = `👤 <span>${esc(p ? p.name : tx(S.guest))}</span>`; mb.title = tx(S.me); ib.textContent = tx(S.install); }
  W('renderTop', (o) => { o(); renderTop(); });
  renderTop();

  // ------------------------------------------------------------ the 👤 sheet
  function profileForm(p, onDone) {
    const v = p || { name: '', roll: '', cls: (app.clsF || ''), sec: '' };
    return `<div class="grid"><label class="f">${esc(tx(S.name))}<input id="sk-n" maxlength="40" value="${esc(v.name)}" autocomplete="off"></label><label class="f">${esc(tx(S.roll))}<input id="sk-r" maxlength="12" value="${esc(v.roll)}" inputmode="numeric"></label>
      <label class="f">${esc(tx(S.cls))}<select id="sk-c">${['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => `<option${c === String(v.cls) ? ' selected' : ''}>${c}</option>`).join('')}</select></label><label class="f">${esc(tx(S.sec))}<input id="sk-s" maxlength="4" value="${esc(v.sec)}"></label></div>
      <div class="row"><button class="btn pri" id="sk-go">${esc(tx(p ? S.save : S.start))}</button></div>`;
  }
  function bindForm(box, p, then) {
    const go = box.querySelector('#sk-go'); const n = box.querySelector('#sk-n'); if (n && !p) setTimeout(() => n.focus(), 50);
    go.onclick = () => {
      const v = { name: box.querySelector('#sk-n').value.trim(), roll: box.querySelector('#sk-r').value.trim(), cls: box.querySelector('#sk-c').value, sec: box.querySelector('#sk-s').value.trim() };
      if (!v.name) { box.querySelector('#sk-n').focus(); return; }
      if (p) Object.assign(p, v); else {
        const g = st.res.guest && Object.keys(st.res.guest).length ? st.res.guest : null; const np = SC.addProfile(st, v);
        if (g) { st.res[np.id] = g; st.res.guest = {}; } // what was done before the name was written is the student's own
      }
      save(); renderTop(); app.renderStrip(); if (then) then(); else openMe();
    };
  }
  function openMe() {
    const p = me(); const others = Object.values(st.profiles).filter((x) => x.id !== 'guest' && x.id !== st.me);
    if (!p) { const box = sheet(`<h2>👤 ${esc(tx(S.who))}</h2><p class="mute">${esc(tx(S.whyName))}</p>${others.length ? `<div class="row">${others.map((o) => `<button class="btn" data-pick="${o.id}">${esc(o.name)}</button>`).join('')}</div><h3>${esc(tx(S.add))}</h3>` : ''}${profileForm(null)}`); bindPick(box); bindForm(box, null); return; }
    SC.ids(p); const R = st.res[p.id] || {}; const T = SC.totals(R); const sk = SC.skillReport(R, BY_ID);
    const skills = Object.entries(SC.SKILLS).map(([k, d]) => { const s = sk[k]; const pct = s.next ? Math.min(100, Math.round(s.pts / s.next * 100)) : 100; return `<div class="sk-skill"><span>${esc(tx(d))}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="lv">${esc(tx(SC.LEVELS[s.lv]))}</span></div>`; }).join('');
    const recent = Object.entries(R).filter(([, r]) => r.s).sort((a, b) => (b[1].d || '').localeCompare(a[1].d || '')).slice(0, 8).map(([id, r]) => BY_ID[id] ? `<tr><td>${esc(tx(BY_ID[id].title))}</td><td class="stars">${SC.starTxt(r.s)}</td><td>${SC.fmtT(r.t)}</td><td><button class="btn sm" data-open="${id}">›</button></td></tr>` : '').join('');
    const out = (st.out || []).filter((o) => o.pid === p.id).length;
    const box = sheet(`<h2>👤 ${esc(p.name)}${p.cls ? ` · ${esc(tx(S.cls))} ${esc(p.cls)}${esc(p.sec ? '-' + p.sec : '')}` : ''}${p.roll ? ` · ${esc(tx(S.roll))} ${esc(p.roll)}` : ''}</h2>
      <div class="row"><button class="btn sm" id="sk-edit">✎ ${esc(tx(S.edit))}</button>${others.map((o) => `<button class="btn sm" data-pick="${o.id}">${esc(tx(S.switchTo))}: ${esc(o.name)}</button>`).join('')}<button class="btn sm" id="sk-add">${esc(tx(S.add))}</button></div>
      <div class="grid" style="margin-top:10px"><div class="tile"><b>${T.done}</b><span>${esc(tx(S.done))}</span></div><div class="tile"><b class="stars">${T.stars} ★</b><span>${esc(tx(S.stars))}</span></div><div class="tile"><b>${T.three}</b><span>${esc(tx(S.three))}</span></div><div class="tile"><b>${SC.fmtT(T.t)}</b><span>${esc(tx(S.time))}</span></div></div>
      ${HEADSET ? '' : `<h3>${esc(tx(S.classes))}</h3><div id="sk-cls">${classCards(p)}</div>
      <div class="row"><input id="sk-jc" maxlength="2000" placeholder="${esc(tx(S.joinCode))}" style="width:240px"><button class="btn pri" id="sk-j">${esc(tx(S.joinBtn))}</button><button class="btn" id="sk-scan">${esc(tx(S.scan))}</button></div>
      ${out ? `<p class="mute">⏳ ${esc(tx(S.waiting, { n: out }))}</p>` : ''}`}
      <h3>${esc(tx(S.skills))}</h3>${skills}
      <h3>${esc(tx(S.certs))}</h3><div id="sk-certs">${certList(p, R)}</div>
      ${HEADSET ? '' : `<h3>${esc(tx(S.folio))}</h3><p class="mute">${esc(tx(S.folioHow))}</p><div class="row"><button class="btn" id="sk-fc">🔗 ${esc(tx(S.copy))}</button><button class="btn" id="sk-fs">${esc(tx(S.share))}</button></div>`}
      ${recent ? `<h3>${esc(tx(S.recent))}</h3><table>${recent}</table>` : ''}
      <h3> </h3><label class="row mute" style="font-size:13px"><input type="checkbox" id="sk-ask"${st.opts.askWho ? ' checked' : ''}> ${esc(tx(S.askWho))}</label>
      <p><a href="teacher.html" style="color:#7fd1ff">${esc(tx(S.teacher))}</a></p>
      ${HEADSET ? '' : `<p><a href="https://duetpower.in/duetblox/" target="_blank" rel="noopener" style="color:#9fd17a">🧩 ${esc(tx(S.blox))}</a></p>`}`, { wide: true });
    bindPick(box);
    box.querySelector('#sk-edit').onclick = () => { const b2 = sheet(`<h2>✎ ${esc(p.name)}</h2>${profileForm(p)}`); bindForm(b2, p); };
    box.querySelector('#sk-add').onclick = () => { const b2 = sheet(`<h2>${esc(tx(S.add))}</h2>${profileForm(null)}`); bindForm(b2, null); };
    box.querySelector('#sk-ask').onchange = (e) => { st.opts.askWho = e.target.checked; save(); };
    if (!HEADSET) {
      box.querySelector('#sk-j').onclick = () => joinByText(box.querySelector('#sk-jc').value);
      box.querySelector('#sk-jc').onkeydown = (e) => { if (e.key === 'Enter') joinByText(e.target.value); };
      box.querySelector('#sk-scan').onclick = () => scanSheet(null, (t) => { joinByText(t); return true; });
      const link = folioLink(p); box.querySelector('#sk-fc').onclick = async () => { await copyText(link); app.toast(tx(S.copied)); }; box.querySelector('#sk-fs').onclick = () => shareText(link, p.name);
    }
    for (const b of box.querySelectorAll('[data-open]')) b.onclick = () => { closeSheet(); app.openLesson(b.dataset.open); };
    for (const b of box.querySelectorAll('[data-next]')) b.onclick = () => { closeSheet(); app.openLesson(b.dataset.next); };
    for (const b of box.querySelectorAll('[data-hand]')) b.onclick = () => handIn(p, b.dataset.hand);
    for (const b of box.querySelectorAll('[data-cert]')) b.onclick = () => showCert(p, certsOf(p, R)[+b.dataset.cert]);
    flushSoon();
  }
  function bindPick(box) { for (const b of box.querySelectorAll('[data-pick]')) b.onclick = () => { st.me = b.dataset.pick; save(); renderTop(); app.renderStrip(); openMe(); }; }
  const folioLink = (p) => new URL('portfolio.html?p=' + SC.ids(p).pk, location.href).href;
  function classCards(p) {
    const R = st.res[p.id] || {};
    return (p.joined || []).map((code) => {
      const c = st.classes[code]; if (!c) return '';
      const asg = (c.asg || []).map((a) => {
        const ls = (a.ls || []).filter((id) => BY_ID[id]); const dn = ls.filter((id) => R[id] && R[id].s).length; const nx = ls.find((id) => !(R[id] && R[id].s));
        const stars = ls.reduce((s, id) => s + ((R[id] && R[id].s) || 0), 0);
        return `<div class="row" style="justify-content:space-between"><span><b>${esc(a.title)}</b> <span class="mute">${a.due ? esc(tx(S.due, { d: fmtDay(a.due) })) : ''}</span></span><span class="stars">${dn}/${ls.length} · ${stars}★</span>${nx ? `<button class="btn sm pri" data-next="${nx}">${esc(tx(S.openNext))}</button>` : `<span class="ok">${esc(tx(S.allDone))}</span>`}</div><div class="bar"><i style="width:${ls.length ? Math.round(dn / ls.length * 100) : 0}%"></i></div>`;
      }).join('');
      return `<div class="card"><div class="row" style="justify-content:space-between"><b>${esc(c.name)}</b><span class="mute">${esc(c.teacher || '')}${c.school ? ' · ' + esc(c.school) : ''}</span></div>${c.offline ? `<div class="row"><button class="btn sm" data-hand="${code}">${esc(tx(S.handIn))}</button></div>` : `<p class="mute">🟢 ${esc(tx(S.live))}</p>`}${asg}</div>`;
    }).join('');
  }
  // ------------------------------------------------------------ joining a class
  async function joinByText(text) {
    let p = me(); const s = String(text || '').trim();
    const full = SC.parseClass(s, hashes());
    if (full) return joined(Object.assign(full, { offline: true }));
    const code = (/[?&]join=([0-9A-Za-z]{6})\b/.exec(s) || [])[1] || (/^[0-9A-Za-z]{6}$/.test(s) ? s : ''); if (!code) { app.toast(tx(S.noClass), 'bad'); return; }
    const r = await SC.api('join', { code: code.toUpperCase() });
    if (r && r.ok) return joined(Object.assign(r.cls, { ls: undefined }));
    app.toast(tx(r && r.err === 'none' ? S.noClass : S.noNet), 'bad', 7000); void p;
  }
  function joined(c) {
    const go = () => { const p = me(); SC.joinClass(st, p.id, c); // the lessons already done count for the class too
      const R = st.res[p.id] || {}; if (!c.offline) for (const [id, r] of Object.entries(R)) if (r.s) SC.queue(st, p.id, id, r) ;
      save(); flushSoon(); app.toast(tx(S.joined, { c: c.name }), null, 5000); openMe(); };
    if (!me()) { const box = sheet(`<h2>👤 ${esc(tx(S.who))}</h2><p><b>${esc(c.name)}</b> · ${esc(c.teacher || '')}</p>${profileForm({ name: '', roll: '', cls: c.cls || '', sec: c.sec || '' })}`); bindForm(box, null, go); return; }
    go();
  }
  // ------------------------------------------------------------ hand in (no internet)
  function handIn(p, code) {
    const c = st.classes[code]; const only = c && c.asg ? [...new Set(c.asg.flatMap((a) => a.ls || []))] : null;
    let text = SC.handIn(st, p.id, code, only); const all = SC.handIn(st, p.id, code);
    if (all.length < 900) text = all; // everything when it still fits a QR code that a phone reads easily
    const box = sheet(`<h2>${esc(tx(S.handIn))}</h2><p class="mute">${esc(tx(S.handHow))}</p><div class="qr">${qrSvg(text)}</div><div class="code">${esc(text)}</div><div class="row"><button class="btn" id="sk-cp">${esc(tx(S.copy))}</button><button class="btn" id="sk-sh">${esc(tx(S.share))}</button></div>`);
    box.querySelector('#sk-cp').onclick = async () => { await copyText(text); app.toast(tx(S.copied)); }; box.querySelector('#sk-sh').onclick = () => shareText(text, p.name);
  }
  // ------------------------------------------------------------ certificates
  function certsOf(p, R) {
    const T = SC.totals(R); const out = [];
    for (const n of MILESTONES) if (T.done >= n) out.push({ what: tx(n === 10 ? S.cert10 : S.certN, { n }), key: 'm' + n });
    for (const [k, list] of Object.entries(CURRICULUM)) { if (!list.length) continue; const dn = list.filter((x) => R[x.id] && R[x.id].s).length; if (dn >= Math.ceil(list.length * 0.75)) out.push({ what: tx(S.certCls, { c: k }), key: 'c' + k }); }
    for (const code of p.joined || []) { const c = st.classes[code]; for (const a of (c && c.asg) || []) { const ls = (a.ls || []).filter((id) => BY_ID[id]); if (ls.length && ls.every((id) => R[id] && R[id].s)) out.push({ what: tx(S.certAsg, { a: a.title, c: c.name }), key: 'a' + code + a.id }); } }
    return out;
  }
  function certList(p, R) { const cs = certsOf(p, R); return cs.length ? cs.map((c, i) => `<div class="row" style="justify-content:space-between"><span>🏅 ${esc(c.what)}</span><button class="btn sm" data-cert="${i}">${esc(tx(S.view))}</button></div>`).join('') : `<p class="mute">${esc(tx(S.noCerts))}</p>`; }
  async function showCert(p, c) {
    if (!c) return; const R = st.res[p.id] || {}; const T = SC.totals(R); const sk = SC.skillReport(R, BY_ID);
    const best = Object.entries(sk).filter(([, s]) => s.lv >= 1).sort((a, b) => b[1].pts - a[1].pts).slice(0, 2).map(([k, s]) => `${tx(SC.LEVELS[s.lv])}: ${tx(SC.SKILLS[k])}`).join(', ');
    const school = (window.DuetGate && DuetGate.school) || (JSON.parse(localStorage.getItem('duet.lic.v1') || 'null') || {}).n || '';
    const day = SC.today(); const cls = [p.cls, p.sec].filter(Boolean).join('-');
    const cv = document.createElement('canvas'); cv.className = 'cert';
    const box = sheet(`<h2>🏅 ${esc(c.what)}</h2><div id="sk-cv"></div><div class="row"><button class="btn pri" id="sk-sv">${esc(tx(S.savePic))}</button><button class="btn" id="sk-pr">${esc(tx(S.print))}</button></div>`, { wide: true });
    box.querySelector('#sk-cv').appendChild(cv);
    await drawCert(cv, { lang: L.lang, name: p.name, cls, school, what: c.what, stats: tx(S.statsLine, { n: T.done, s: T.stars, k: best || '' }).replace(/ · $/, ''), day, code: SC.certCode(p.name, c.key, day), stars: Math.round(T.stars / Math.max(1, T.done)) });
    box.querySelector('#sk-sv').onclick = () => saveCanvas(cv, `DUET-certificate-${p.name.replace(/\s+/g, '-')}.png`); box.querySelector('#sk-pr').onclick = () => printCanvas(cv, c.what);
  }
  // ------------------------------------------------------------ sending results (live classes)
  let flushT = 0; function flushSoon() { if (HEADSET) return; clearTimeout(flushT); flushT = setTimeout(() => SC.flush(st, save, location.href), 400); }
  addEventListener('online', flushSoon); setInterval(flushSoon, 120000);
  // ------------------------------------------------------------ ?join=CODE (a teacher's link or QR), and the start
  const Q = new URLSearchParams(location.search); const jq = Q.get('join');
  if (jq && !HEADSET) { history.replaceState(null, '', location.pathname + location.search.replace(/[?&]join=[^&]*/, '').replace(/^&/, '?') + location.hash); setTimeout(() => joinByText(jq.length === 6 ? jq : location.href), 900); }
  else if (st.opts.askWho && Object.keys(st.profiles).filter((k) => k !== 'guest').length && !Q.has('test')) setTimeout(() => { st.me = null; renderTop(); openMe(); }, 1200);
  app.school = { get state() { return st; }, get attempt() { return att; }, hint() { if (att && !att.done) att.h++; }, quiz(id, right, n) { const R = st.res[pid()] || (st.res[pid()] = {}); const r = R[id] || (R[id] = { s: 0, sc: 0, t: 0, m: 0, h: 0, d: SC.today(), n: 0 }); r.q = Math.max(r.q || 0, right); r.qn = n; save(); }, challenge() { return !!(att && att.ch && !att.done); }, open: openMe, sheetOpen, reload() { st = SC.load(); renderTop(); } };
}
