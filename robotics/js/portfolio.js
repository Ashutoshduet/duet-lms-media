// DUET Robotics Lab 360: a student's portfolio (portfolio.html?p=<portfolio key>), for parents and anyone the student
// shares the link with: the projects finished, the stars, the skills (NEP 2020) and a certificate. Read only. From the
// class register when online, else from this device (the student's own computer).
import * as SC from './school.js';
import { esc, t3, kitStyle, drawCert, saveCanvas } from './schoolkit.js';
import { tx, L, LANGS } from './i18n.js';
import { BY_ID } from './lessons.js';

const S = {
  title: t3('Robotics portfolio', 'रोबोटिक्स पोर्टफ़ोलियो', 'Robotics portfolio'), none: t3('This portfolio link is not known. Ask the student to share it again.', 'यह पोर्टफ़ोलियो लिंक नहीं मिला। विद्यार्थी से फिर भेजने को कहिए।', 'Ye portfolio link nahi mila. Student se phir bhejne ko kahiye.'),
  done: t3('Projects done', 'पूरे प्रोजेक्ट', 'Poore projects'), stars: t3('Stars', 'सितारे', 'Stars'), time: t3('Time learning', 'सीखने का समय', 'Seekhne ka samay'),
  skills: t3('Skills (NEP 2020)', 'कौशल (NEP 2020)', 'Skills (NEP 2020)'), projects: t3('Projects', 'प्रोजेक्ट', 'Projects'), cert: t3('Certificate', 'प्रमाण-पत्र', 'Certificate'),
  what: t3('What these mean', 'इनका अर्थ', 'Inka matlab'), whatTxt: t3('Each project is a real circuit and program the student built in DUET STEM\'s 3D Robotics Lab and saw working. ★★★ = done with no mistakes or hints; ★★ = a few; ★ = finished with help.', 'हर प्रोजेक्ट एक असली सर्किट और प्रोग्राम है जो विद्यार्थी ने DUET STEM की 3D रोबोटिक्स लैब में बनाया और चलते देखा। ★★★ = बिना ग़लती या संकेत; ★★ = कुछ; ★ = मदद से पूरा।', 'Har project ek asli circuit aur program hai jo student ne DUET STEM ki 3D Robotics Lab me banaya aur chalte dekha. ★★★ = bina galti ya hint; ★★ = kuch; ★ = madad se poora.'),
  open: t3('Try the lab →', 'लैब आज़माइए →', 'Lab try kijiye →'), loading: t3('Loading…', 'खुल रहा है…', 'Khul raha hai…'),
};
const $ = (s) => document.querySelector(s);
L.lang = localStorage.getItem('rl360.lang') || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en'); if (!LANGS.includes(L.lang)) L.lang = 'en'; document.documentElement.lang = L.lang;
const pk = new URLSearchParams(location.search).get('p') || '';
let data = null;
async function load() {
  // this device first (offline), then the register (newer results from other devices)
  const st = SC.load(); const p = Object.values(st.profiles).find((x) => x.pk === pk);
  if (p) data = { name: p.name, roll: p.roll, cls: [p.cls, p.sec].filter(Boolean).join('-'), res: Object.assign({}, st.res[p.id] || {}), classes: (p.joined || []).map((c) => st.classes[c]).filter(Boolean).map((c) => c.name) };
  render();
  const r = /^[0-9A-Za-z]{10,40}$/.test(pk) ? await SC.api('student', { pk }, location.href) : null;
  if (r && r.ok) {
    data = data || { name: r.name, roll: r.roll, cls: '', res: {}, classes: [] }; data.name = data.name || r.name;
    for (const c of r.classes) { if (!data.classes.includes(c.cls.name)) data.classes.push(c.cls.name); if (!data.cls && c.cls.cls) data.cls = [c.cls.cls, c.cls.sec].filter(Boolean).join('-'); data.school = data.school || c.cls.school;
      for (const [, l, s, sc, t, m, h, ch, d] of c.res) { const o = data.res[l]; if (!o || sc > o.sc) data.res[l] = { s, sc, t, m, h, ch, d }; } }
  }
  render();
}
function render() {
  document.title = (data ? data.name + ' · ' : '') + tx(S.title);
  for (const b of document.querySelectorAll('#langs button')) b.classList.toggle('on', b.dataset.l === L.lang);
  const m = $('#main');
  if (!data) { m.innerHTML = `<p class="mute">${esc(tx(pk ? S.loading : S.none))}</p>`; return; }
  const T = SC.totals(data.res); const sk = SC.skillReport(data.res, BY_ID);
  const rows = Object.entries(data.res).filter(([id, r]) => r.s && BY_ID[id]).sort((a, b) => (b[1].d || '').localeCompare(a[1].d || ''));
  m.innerHTML = `<h2>${esc(data.name)}</h2><p class="mute">${esc([data.cls && 'Class ' + data.cls, data.school, ...data.classes].filter(Boolean).join(' · '))}</p>
    <div class="kpi"><div class="tile"><b>${T.done}</b><span>${esc(tx(S.done))}</span></div><div class="tile"><b class="stars">${T.stars} ★</b><span>${esc(tx(S.stars))}</span></div><div class="tile"><b>${SC.fmtT(T.t)}</b><span>${esc(tx(S.time))}</span></div></div>
    <h3>${esc(tx(S.skills))}</h3>${Object.entries(SC.SKILLS).map(([k, d]) => { const s = sk[k]; const pct = s.next ? Math.min(100, Math.round(s.pts / s.next * 100)) : 100; return `<div class="sk-skill"><span>${esc(tx(d))}</span><div class="bar"><i style="width:${pct}%"></i></div><span class="lv">${esc(tx(SC.LEVELS[s.lv]))}</span></div>`; }).join('')}
    ${T.done ? `<div class="row"><button class="btn pri" id="pf-c">🏅 ${esc(tx(S.cert))}</button></div><div id="pf-cv"></div>` : ''}
    <h3>${esc(tx(S.projects))} (${rows.length})</h3><div class="list">${rows.map(([id, r]) => `<div class="it"><span>${esc(tx(BY_ID[id].title))}</span><span class="stars">${SC.starTxt(r.s)}</span></div>`).join('')}</div>
    <h3>${esc(tx(S.what))}</h3><p class="mute">${esc(tx(S.whatTxt))}</p><p><a href="index.html">${esc(tx(S.open))}</a></p>`;
  const b = $('#pf-c'); if (b) b.onclick = async () => { const cv = document.createElement('canvas'); cv.className = 'cert'; const w = $('#pf-cv'); w.innerHTML = ''; w.appendChild(cv); const day = SC.today();
    await drawCert(cv, { lang: L.lang, name: data.name, cls: data.cls, school: data.school || '', what: L.lang === 'hi' ? `रोबोटिक्स लैब 360: ${T.done} प्रोजेक्ट` : `Robotics Lab 360: ${T.done} projects`, stats: `${T.done} · ${T.stars} ★`, day, code: SC.certCode(data.name, 'folio' + T.done, day), stars: Math.round(T.stars / Math.max(1, T.done)) });
    const s = document.createElement('button'); s.className = 'btn'; s.textContent = '⬇ PNG'; s.onclick = () => saveCanvas(cv, `certificate-${data.name.replace(/\s+/g, '-')}.png`); w.appendChild(s); };
}
kitStyle();
for (const b of document.querySelectorAll('#langs button')) b.onclick = () => { L.lang = b.dataset.l; localStorage.setItem('rl360.lang', L.lang); document.documentElement.lang = L.lang; render(); };
load();
