// DUET STEM Class — the teacher's page. One class at a time: a 4-digit code that students type in Science Lab 360,
// Maths Lab 360 or Human Body 360. Students' apps connect straight to this page (WebRTC through PeerJS; the free public
// PeerJS server only introduces them). Everything the page learns is kept in this browser (localStorage): the class
// list, names for roll numbers, attendance and every result, so a report can be printed or exported any time later.
const PREFIX = 'duetstem-class-v1-';
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }] };
const KEY = 'duet.teacher.v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const W = {
  classes: { en: 'Classes', hi: 'क्लासें' },
  start: { en: 'Start a class', hi: 'क्लास शुरू करें' },
  startSub: { en: 'Students join from Science Lab 360, Maths Lab 360 or Human Body 360 with the class code and their roll number. You see each headset live, pause the class, send everyone to an activity, run quizzes and keep the results.', hi: 'विद्यार्थी Science Lab 360, Maths Lab 360 या Human Body 360 से क्लास कोड और अपने रोल नंबर से जुड़ते हैं। आप हर हेडसेट को लाइव देखते हैं, क्लास रोकते हैं, सबको किसी गतिविधि पर भेजते हैं, क्विज़ कराते हैं और नतीजे रखते हैं।' },
  cname: { en: 'Class name', hi: 'क्लास का नाम' },
  cnameP: { en: 'e.g. 8 B · Science', hi: 'जैसे 8 B · विज्ञान' },
  go: { en: 'Start', hi: 'शुरू करें' },
  older: { en: 'Your earlier classes', hi: 'आपकी पिछली क्लासें' },
  codeL: { en: 'Class code', hi: 'क्लास कोड' },
  how: { en: 'Students: open <em>Science Lab 360</em>, <em>Maths Lab 360</em> or <em>Human Body 360</em> → <em>👥 Class</em> → type <em>{c}</em> and their roll number.', hi: 'विद्यार्थी: <em>Science Lab 360</em>, <em>Maths Lab 360</em> या <em>Human Body 360</em> खोलें → <em>👥 Class</em> → <em>{c}</em> और अपना रोल नंबर डालें।' },
  ready: { en: 'Ready', hi: 'तैयार' }, connecting: { en: 'Connecting…', hi: 'जुड़ रहा है…' }, offline: { en: 'No internet — trying again', hi: 'इंटरनेट नहीं — फिर कोशिश' },
  inUse: { en: 'This class is open in another tab or computer', hi: 'यह क्लास किसी और टैब या कंप्यूटर में खुली है' },
  joined: { en: '{n} joined', hi: '{n} जुड़े' },
  eyes: { en: 'Eyes on me', hi: 'मेरी ओर देखो' }, resume: { en: 'Resume', hi: 'फिर शुरू' },
  send: { en: 'Send to activity', hi: 'गतिविधि पर भेजें' }, quiz: { en: 'Start quiz', hi: 'क्विज़ शुरू करें' },
  msg: { en: 'Message', hi: 'संदेश' }, lang: { en: 'Language', hi: 'भाषा' },
  screens: { en: 'Live screens', hi: 'लाइव स्क्रीन' }, lock: { en: 'Lock joining', hi: 'जुड़ना बंद' }, end: { en: 'End class', hi: 'क्लास ख़त्म' },
  live: { en: 'Live', hi: 'लाइव' }, results: { en: 'Results', hi: 'नतीजे' }, att: { en: 'Attendance', hi: 'हाज़िरी' },
  none: { en: 'No students yet. Tell them the class code.', hi: 'अभी कोई विद्यार्थी नहीं। उन्हें क्लास कोड बताइए।' },
  roll: { en: 'Roll', hi: 'रोल' }, name: { en: 'Name', hi: 'नाम' },
  step: { en: 'Step {i} of {n}', hi: 'स्टेप {i} / {n}' }, finished: { en: 'finished', hi: 'पूरा' },
  quizP: { en: 'Quiz {i}/{n} · {s} right', hi: 'क्विज़ {i}/{n} · {s} सही' }, quizD: { en: 'Quiz done: {s}/{n}', hi: 'क्विज़ पूरा: {s}/{n}' },
  menu: { en: 'Menu', hi: 'मेन्यू' }, idle: { en: 'Choosing an activity', hi: 'गतिविधि चुन रहे हैं' },
  lower: { en: 'Lower hand', hi: 'हाथ नीचे' }, watch: { en: 'Watch', hi: 'देखें' }, remove: { en: 'Remove', hi: 'हटाएँ' },
  vr: { en: 'VR', hi: 'VR' }, screen: { en: 'Screen', hi: 'स्क्रीन' }, left: { en: 'left', hi: 'गए' },
  everyone: { en: 'Everyone', hi: 'सबको' }, to: { en: 'To', hi: 'किसे' },
  search: { en: 'Search activities…', hi: 'गतिविधि खोजें…' }, all: { en: 'All', hi: 'सभी' }, cls: { en: 'Class', hi: 'कक्षा' },
  open: { en: 'Open', hi: 'खोलें' }, chQuiz: { en: 'Chapter quiz', hi: 'अध्याय क्विज़' },
  quizCur: { en: 'Quiz on what each student is doing now', hi: 'हर विद्यार्थी जो कर रहा है, उसी पर क्विज़' },
  quizOr: { en: 'or choose an activity or chapter below', hi: 'या नीचे से कोई गतिविधि या अध्याय चुनें' },
  sendB: { en: 'Send', hi: 'भेजें' }, msgP: { en: 'Type a message for the students…', hi: 'विद्यार्थियों के लिए संदेश लिखिए…' },
  presets: { en: ['Well done, everyone!', 'Take off your headset now.', '5 minutes left.', 'Look at the board.', 'Raise your hand if you need help.'], hi: ['शाबाश, सबने अच्छा किया!', 'अब हेडसेट उतार दीजिए।', '5 मिनट बचे हैं।', 'बोर्ड की ओर देखिए।', 'मदद चाहिए तो हाथ उठाइए।'] },
  eyesMsg: { en: 'Message on the "eyes on me" screen (optional)', hi: '"मेरी ओर देखो" स्क्रीन पर संदेश (चाहें तो)' },
  endQ: { en: 'End the class for everyone? Results are kept on this page.', hi: 'सबके लिए क्लास ख़त्म करें? नतीजे इस पेज पर रहेंगे।' },
  today: { en: 'Today', hi: 'आज' }, allTime: { en: 'All', hi: 'सब' },
  csv: { en: 'Export CSV', hi: 'CSV निकालें' }, print: { en: 'Print report', hi: 'रिपोर्ट प्रिंट करें' },
  avg: { en: 'Class average', hi: 'क्लास औसत' }, noRes: { en: 'No results yet. Quizzes and finished activities appear here.', hi: 'अभी कोई नतीजा नहीं। क्विज़ और पूरी हुई गतिविधियाँ यहाँ दिखेंगी।' },
  missed: { en: 'Questions most often missed', hi: 'सबसे ज़्यादा ग़लत हुए प्रश्न' }, wrongOf: { en: '{w} of {n} wrong', hi: '{n} में से {w} ग़लत' },
  first: { en: 'First joined', hi: 'पहली बार' }, lastSeen: { en: 'Last seen', hi: 'आख़िरी बार' }, mins: { en: 'Minutes', hi: 'मिनट' }, app: { en: 'App', hi: 'ऐप' }, dev: { en: 'Device', hi: 'डिवाइस' },
  answers: { en: 'Answers', hi: 'उत्तर' }, picked: { en: 'picked', hi: 'चुना' }, rightA: { en: 'right answer', hi: 'सही उत्तर' },
  newClass: { en: 'New class', hi: 'नई क्लास' }, sentTo: { en: 'Sent to {n}', hi: '{n} को भेजा' }, nobody: { en: 'No student is connected', hi: 'कोई विद्यार्थी जुड़ा नहीं है' },
  report: { en: 'Class report', hi: 'क्लास रिपोर्ट' }, act: { en: 'activity', hi: 'गतिविधि' }, total: { en: 'Average', hi: 'औसत' },
  wantsHelp: { en: 'needs help', hi: 'को मदद चाहिए' },
  asked: { en: 'Questions students asked the tutor', hi: 'विद्यार्थियों ने ट्यूटर से जो पूछा' }, notAns: { en: 'not found in the app: answer it in class', hi: 'ऐप में नहीं मिला: क्लास में बताइए' }, noApp: { en: 'Students in other apps do not get this.', hi: 'दूसरे ऐप वाले विद्यार्थियों को यह नहीं जाएगा।' },
  appsN: { science: { en: 'Science Lab', hi: 'साइंस लैब' }, maths: { en: 'Maths Lab', hi: 'मैथ्स लैब' }, body: { en: 'Human Body', hi: 'ह्यूमन बॉडी' } },
};
const SUBJ = { chemistry: { en: 'Chemistry', hi: 'रसायन' }, physics: { en: 'Physics', hi: 'भौतिकी' }, biology: { en: 'Biology', hi: 'जीव विज्ञान' }, maths: { en: 'Maths', hi: 'गणित' } };
const KIND = { journey: { en: 'Guided journeys', hi: 'गाइडेड यात्राएँ' }, lab: { en: 'Organ lab', hi: 'अंग प्रयोगशाला' }, sys: { en: 'Body systems: name the parts', hi: 'शरीर तंत्र: अंगों के नाम' }, split: { en: 'Split an organ into its parts', hi: 'अंग को हिस्सों में खोलें' } };
const ICON = { science: '🧪', maths: '📐', body: '🫀' };

// ------------------------------------------------------------ saved state
const D = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
D.classes = D.classes || {}; D.lang = D.lang || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en');
let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('Storage full: export the results'); } }, 300); };
const t = (k, v = {}) => { let s = W[k] ? (W[k][D.lang] || W[k].en) : k; for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const L2 = (o) => (o ? o[D.lang] || o.en || '' : '');

let CAT = null; const catLoad = fetch('catalog.json').then((r) => r.json()).then((c) => { CAT = c; CAT.by = {}; for (const a of ['science', 'maths', 'body']) for (const it of c[a]) CAT.by[it.id] = it; render(); }).catch(() => {});
const titleOf = (id, fallback) => { if (!id) return fallback || ''; const ch = String(id).startsWith('ch:'); const it = CAT && CAT.by[ch ? id.slice(3) : id]; return it ? (ch ? L2(it.ch) || L2(it.t) : L2(it.t)) : fallback || id; };

// ------------------------------------------------------------ live state
const S = { peer: null, net: 'off', students: new Map(), tab: 'live', live: D.live !== false, frozen: null, locked: false, watching: null, resRange: 'today', inUseTries: 0 };
const cls = () => (D.cur && D.classes[D.cur]) || null;

function newCode() { let c; do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (D.classes[c] && Date.now() - D.classes[c].last < 30 * 86400e3); return c; }
function startClass(name) {
  const code = newCode(); D.classes[code] = { name: name || '', created: Date.now(), last: Date.now(), roster: {}, results: [], att: {} }; D.cur = code; save(); S.students.clear(); host(); render();
}
function openClass(code) { if (!D.classes[code]) return; if (S.peer) { try { S.peer.destroy(); } catch (e) {} } D.cur = code; D.classes[code].last = Date.now(); save(); S.students.clear(); S.frozen = null; host(); render(); }

// ------------------------------------------------------------ the class's own peer: students connect to it
function loadPeer() { return window.peerjs ? Promise.resolve(window.peerjs) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = '../science/lib/peerjs.min.js'; s.onload = () => ok(window.peerjs); s.onerror = no; document.head.appendChild(s); }); }
function host() {
  const code = D.cur; if (!code) return; S.net = 'connecting'; renderNet();
  loadPeer().then((P) => {
    if (D.cur !== code) return;
    const peer = S.peer = new P.Peer(PREFIX + code, { config: ICE, debug: 0 });
    peer.on('open', () => { if (S.peer !== peer) return; S.net = 'ok'; S.inUseTries = 0; renderNet(); });
    peer.on('connection', (c) => { if (S.peer === peer) accept(c); });
    peer.on('disconnected', () => { if (S.peer !== peer) return; S.net = 'connecting'; renderNet(); setTimeout(() => { try { if (S.peer === peer && !peer.destroyed) peer.reconnect(); } catch (e) {} }, 2000); });
    peer.on('error', (e) => { if (S.peer !== peer) return;
      if (e.type === 'unavailable-id') { // the code is still held (this page was just reloaded) or open somewhere else
        try { peer.destroy(); } catch (x) {} S.peer = null;
        if (++S.inUseTries <= 4) { S.net = 'connecting'; renderNet(); setTimeout(() => D.cur === code && host(), 2500 * S.inUseTries); } else { S.net = 'inuse'; renderNet(); }
        return; }
      if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) { S.net = 'offline'; renderNet(); setTimeout(() => { if (S.peer === peer) { try { peer.destroy(); } catch (x) {} S.peer = null; host(); } }, 5000); } });
  }).catch(() => { S.net = 'offline'; renderNet(); setTimeout(host, 5000); });
}
function accept(c) {
  const meta = c.metadata || {}; const roll = String(meta.roll || '').trim().slice(0, 12);
  if (!roll || (S.locked && !S.students.has(roll))) { c.on('open', () => { try { c.send({ t: 'cmd', do: 'end' }); } catch (e) {} setTimeout(() => c.close(), 500); }); return; }
  c.on('open', () => {
    let s = S.students.get(roll); const old = s && s.conn; if (old && old !== c) { try { old.close(); } catch (e) {} }
    if (!s) { s = { roll, st: {}, img: null }; S.students.set(roll, s); }
    Object.assign(s, { conn: c, app: meta.app || s.app || '', online: true, seen: Date.now(), since: Date.now() });
    if (meta.name) { s.name = meta.name; const C = cls(); if (C && !C.roster[roll]) { C.roster[roll] = meta.name; save(); } }
    const C = cls(); if (C) { const a = C.att[roll] || (C.att[roll] = { first: Date.now(), last: Date.now(), ms: 0 }); a.last = Date.now(); a.app = s.app; save(); }
    send(s, { t: 'welcome', name: (C && C.name) || '', watch: S.watching === roll ? 1500 : S.live ? 5000 : 0, big: S.watching === roll, frozen: S.frozen });
    refreshStudents();
  });
  c.on('data', (m) => onData(roll, c, m));
  c.on('close', () => { const s = S.students.get(roll); if (s && s.conn === c) { s.online = false; s.conn = null; tickAtt(s); refreshStudents(); } });
  c.on('error', () => {});
}
// a student came or went: only the student cards and the count change (the buttons above them stay, so a click on them is never lost)
function refreshStudents() { renderCount(); if (S.tab === 'live') { const g = $('#grid'); const n = S.students.size; if (g && g.children.length === n) for (const s of S.students.values()) renderCard(s); else renderTab(); } else if (S.tab === 'att') renderTab(); }
function send(s, m) { if (!s || !s.conn || !s.conn.open) return false; try { s.conn.send(m); return true; } catch (e) { return false; } }
function onData(roll, c, m) {
  const s = S.students.get(roll); if (!s || s.conn !== c || !m || typeof m !== 'object') return; s.seen = Date.now(); const C = cls();
  if (m.t === 'hello') { s.app = m.app || s.app; s.ua = m.ua; if (m.name) s.name = m.name; renderCard(s); }
  else if (m.t === 'st') { const was = s.st && s.st.help; s.st = m.s || {}; if (s.st.help && !was) { beep(); toast(`✋ ${t('roll')} ${roll}${nameOf(roll) ? ' · ' + nameOf(roll) : ''} ${t('wantsHelp')}`); } renderCard(s); renderCount(); }
  else if (m.t === 'snap') { if (typeof m.img === 'string' && m.img.startsWith('data:image/')) { s.img = m.img; s.imgAt = Date.now(); renderThumb(s); if (S.watching === roll) { const b = $('#bigimg'); if (b) b.src = m.img; } } }
  else if (m.t === 'res' && m.r && C) { const r = m.r; if (!C.results.some((x) => x.rid === r.rid)) { C.results.push(sanitize(r, roll)); save(); if (S.tab === 'results') renderTab(); } send(s, { t: 'ack', rid: r.rid }); s.lastRes = r; renderCard(s); }
  else if (m.t === 'ask' && C && typeof m.q === 'string') { (C.asks || (C.asks = [])).push({ roll, q: m.q.slice(0, 300), found: !!m.found, at: Date.now() }); if (C.asks.length > 500) C.asks = C.asks.slice(-500); save(); if (S.tab === 'results') renderTab(); }
  else if (m.t === 'bye') { s.online = false; tickAtt(s); refreshStudents(); }
}
function sanitize(r, roll) {
  const n = (x) => (Number.isFinite(+x) ? +x : 0); const str = (x, k = 400) => String(x ?? '').slice(0, k);
  return { rid: str(r.rid, 40), at: n(r.at) || Date.now(), roll, kind: r.kind === 'quiz' ? 'quiz' : 'activity', id: str(r.id, 80), title: str(r.title, 200), app: str(r.app, 12), score: n(r.score), total: n(r.total), steps: n(r.steps), done: n(r.done), ok: !!r.ok, secs: n(r.secs), lang: str(r.lang, 4),
    items: Array.isArray(r.items) ? r.items.slice(0, 40).map((i) => ({ q: str(i.q), pick: str(i.pick), right: str(i.right), ok: !!i.ok, lq: i.lq ? str(i.lq) : undefined, lpick: i.lpick ? str(i.lpick) : undefined, lright: i.lright ? str(i.lright) : undefined })) : [] };
}
function tickAtt(s) { const C = cls(); if (!C || !s.since) return; const a = C.att[s.roll] || (C.att[s.roll] = { first: s.since, last: Date.now(), ms: 0 }); a.ms += Date.now() - s.since; a.last = Date.now(); s.since = 0; save(); }
setInterval(() => { const C = cls(); if (!C) return; const now = Date.now(); for (const s of S.students.values()) if (s.online && s.since) { const a = C.att[s.roll]; if (a) { a.ms += now - s.since; a.last = now; } s.since = now; if (now - s.seen > 90000 && s.conn) { try { s.conn.close(); } catch (e) {} } /* silent for 1.5 minutes: the link is dead even if it looks open */ } save(); renderCount(); if (S.tab === 'live') for (const s of S.students.values()) renderCard(s); if (S.tab === 'att') renderTab(); }, 10000);
const online = () => [...S.students.values()].filter((s) => s.online && s.conn && s.conn.open);
const nameOf = (roll) => { const C = cls(); return (C && C.roster[roll]) || (S.students.get(roll) || {}).name || ''; };
function broadcast(m, filter = () => true) { let n = 0; for (const s of online()) if (filter(s) && send(s, m)) n++; return n; }
function setLive(on) { S.live = on; D.live = on; save(); broadcast({ t: 'watch', every: on ? 5000 : 0 }, (s) => s.roll !== S.watching); render(); }

// ------------------------------------------------------------ page
let tt = 0; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 3200); }
function beep() { try { const a = new AudioContext(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = 0.06; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.18); setTimeout(() => a.close(), 400); } catch (e) {} }
function render() {
  document.documentElement.lang = D.lang; document.querySelectorAll('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.l === D.lang));
  $('#b-classes').textContent = '☰ ' + t('classes'); const C = cls(); $('#cname').textContent = C ? (C.name || '') : '';
  const app = $('#app');
  if (!C) { app.innerHTML = setupHTML(); $('#c-name') && $('#c-name').focus(); return; }
  app.innerHTML = `<section class="codebar"><div class="code"><small>${esc(t('codeL'))}</small><b id="code">${esc(D.cur)}</b></div><p class="how">${t('how', { c: esc(D.cur) })}</p><div><div class="net" id="net"></div><div class="count" id="count"></div></div></section>
    <div class="controls">
      <button class="btn ${S.frozen ? 'on' : ''}" data-a="eyes">${S.frozen ? '▶ ' + esc(t('resume')) : '👀 ' + esc(t('eyes'))}</button>
      <button class="btn" data-a="send">📤 ${esc(t('send'))}</button>
      <button class="btn" data-a="quiz">📝 ${esc(t('quiz'))}</button>
      <button class="btn" data-a="msg">💬 ${esc(t('msg'))}</button>
      <button class="btn" data-a="lang">🌐 ${esc(t('lang'))}</button>
      <button class="btn ${S.live ? 'on' : ''}" data-a="screens">🖼 ${esc(t('screens'))}</button>
      <button class="btn ${S.locked ? 'on' : ''}" data-a="lock">🔒 ${esc(t('lock'))}</button>
      <button class="btn bad" data-a="end">⏹ ${esc(t('end'))}</button>
    </div>
    <nav class="tabs"><button data-tab="live" class="${S.tab === 'live' ? 'on' : ''}">${esc(t('live'))}</button><button data-tab="results" class="${S.tab === 'results' ? 'on' : ''}">${esc(t('results'))}</button><button data-tab="att" class="${S.tab === 'att' ? 'on' : ''}">${esc(t('att'))}</button></nav>
    <div id="tab"></div>`;
  renderNet(); renderCount(); renderTab();
}
function setupHTML() {
  const old = Object.entries(D.classes).sort((a, b) => b[1].last - a[1].last).slice(0, 12);
  return `<section class="setup"><h1>👥 ${esc(t('start'))}</h1><p style="color:var(--mute)">${esc(t('startSub'))}</p>
    <label for="c-name">${esc(t('cname'))}</label><input id="c-name" maxlength="60" placeholder="${esc(t('cnameP'))}">
    <div style="margin-top:16px"><button class="btn pri" data-a="create">${esc(t('go'))} ›</button></div>
    ${old.length ? `<div class="old"><b>${esc(t('older'))}</b>${old.map(([c, x]) => `<button class="btn" data-a="reopen" data-c="${esc(c)}">${esc(x.name || t('cls'))} · ${esc(c)} <span style="color:var(--mute);font-weight:500">· ${new Date(x.last).toLocaleDateString()} · ${x.results.length} ${esc(t('results'))}</span></button>`).join('')}</div>` : ''}</section>`;
}
function renderNet() { const el = $('#net'); if (!el) return; const k = S.net; el.className = 'net ' + (k === 'ok' ? 'ok' : k === 'offline' || k === 'inuse' ? 'bad' : ''); el.innerHTML = `<i></i>${esc(k === 'ok' ? t('ready') : k === 'inuse' ? t('inUse') : k === 'offline' ? t('offline') : t('connecting'))}`; }
function renderCount() { const el = $('#count'); if (el) el.textContent = t('joined', { n: online().length }); }
function renderTab() { const el = $('#tab'); if (!el) return; if (S.tab === 'live') el.innerHTML = liveHTML(); else if (S.tab === 'results') el.innerHTML = resultsHTML(); else el.innerHTML = attHTML(); }
const sorted = () => [...S.students.values()].sort((a, b) => (+a.roll || 0) - (+b.roll || 0) || String(a.roll).localeCompare(String(b.roll)));
function liveHTML() { const ss = sorted(); return ss.length ? `<div class="grid" id="grid">${ss.map(cardHTML).join('')}</div>` : `<div class="empty">${esc(t('none'))}</div>`; }
function stLine(s) {
  const st = s.st || {}; if (!s.online) return t('left') + ' · ' + ago(s.seen);
  if (st.act) { if (st.state === 'finished') return '✓ ' + t('finished'); if (st.of) return t('step', { i: (st.step || 0) + 1, n: st.of }) + (st.mode ? ' · ' + st.mode : ''); return st.mode || ''; }
  return st.mode ? st.mode : t('idle');
}
const ago = (ts) => { const s = Math.round((Date.now() - (ts || 0)) / 1000); return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)} min` : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
function cardHTML(s) {
  const st = s.st || {}; const qz = st.quiz; const nm = nameOf(s.roll); const lr = s.lastRes;
  return `<article class="card ${st.help ? 'help' : ''} ${s.online ? '' : 'off'}" data-roll="${esc(s.roll)}">
    <div class="thumb">${s.img ? `<img src="${s.img}" alt="">` : `<span>${ICON[s.app] || '👤'}</span>`}<span class="b">${ICON[s.app] || ''} ${st.vr ? 'VR' : esc(t('screen'))}</span>${st.batt ? `<span class="b bt">${st.batt.c ? '⚡' : '🔋'} ${st.batt.l}%</span>` : ''}${st.help ? '<span class="hand">✋</span>' : ''}${st.frozen ? '<span class="frz">👀</span>' : ''}</div>
    <div class="ci"><div class="who"><i></i>${esc(t('roll'))} ${esc(s.roll)}<span class="nm">${esc(nm)}</span></div>
      <div class="act">${esc(st.act ? titleOf(st.act, st.title) : st.title || '')}</div><div class="st">${esc(stLine(s))}</div>
      ${qz ? `<div class="qz">📝 ${esc(qz.done ? t('quizD', { s: qz.score, n: qz.n }) : t('quizP', { i: Math.min(qz.i + 1, qz.n), n: qz.n, s: qz.score }))}</div>` : lr && lr.kind === 'quiz' ? `<div class="qz" style="color:var(--mute)">📝 ${esc(titleOf(lr.id, lr.title))}: ${lr.score}/${lr.total}</div>` : ''}</div>
    <div class="ca">${st.help ? `<button class="btn sm warn" data-a="lower">✋ ${esc(t('lower'))}</button>` : ''}<button class="btn sm" data-a="watch" ${s.online ? '' : 'disabled'}>👁 ${esc(t('watch'))}</button><button class="btn sm" data-a="msg1" ${s.online ? '' : 'disabled'}>💬</button><button class="btn sm" data-a="send1" ${s.online ? '' : 'disabled'}>📤</button><button class="btn sm" data-a="quiz1" ${s.online ? '' : 'disabled'}>📝</button>${s.online ? '' : `<button class="btn sm bad" data-a="forget">✕</button>`}</div></article>`;
}
// a card is patched part by part, and only where its text changed: a button being pressed is never replaced under the pointer
function renderCard(s) {
  if (S.tab !== 'live') return; const g = $('#grid'); if (!g) { renderTab(); return; } const el = g.querySelector(`[data-roll="${CSS.escape(s.roll)}"]`); if (!el) { renderTab(); return; }
  const tmp = document.createElement('div'); tmp.innerHTML = cardHTML(s); const nw = tmp.firstElementChild; if (el.className !== nw.className) el.className = nw.className;
  for (const sel of ['.ci', '.ca']) { const a = el.querySelector(sel), b = nw.querySelector(sel); if (a && b && a.innerHTML !== b.innerHTML) a.replaceWith(b); }
  const ta = el.querySelector('.thumb'), tb = nw.querySelector('.thumb'); // the picture stays; only the badges around it change
  if (ta && tb) { const keep = ta.querySelector('img'), img = tb.querySelector('img'); if (keep && img) { img.replaceWith(keep); } const sa = [...ta.children].filter((x) => x.tagName !== 'IMG').map((x) => x.outerHTML).join(''), sb = [...tb.children].filter((x) => x.tagName !== 'IMG').map((x) => x.outerHTML).join(''); if (sa !== sb || !!keep !== !!img) ta.replaceWith(tb); }
}
function renderThumb(s) { if (S.tab !== 'live') return; const el = document.querySelector(`[data-roll="${CSS.escape(s.roll)}"] .thumb`); if (!el) return; const im = el.querySelector('img'); if (im) im.src = s.img; else renderCard(s); }

// ------------------------------------------------------------ results and reports
function resList() { const C = cls(); if (!C) return []; const d0 = new Date(); d0.setHours(0, 0, 0, 0); return C.results.filter((r) => S.resRange === 'all' || r.at >= d0.getTime()); }
const pct = (r) => (r.kind === 'quiz' ? (r.total ? r.score / r.total : 0) : r.ok ? 1 : r.steps ? r.done / r.steps : 0);
const scTxt = (r) => (r.kind === 'quiz' ? `${r.score}/${r.total}` : r.ok ? '✓' : `${r.done}/${r.steps}`);
const scCls = (p) => (p >= 0.8 ? 'g' : p >= 0.5 ? 'm' : 'b');
function matrix() {
  const rs = resList(); const cols = []; const ci = new Map(); const rows = new Map();
  for (const r of rs) { const k = r.kind + '|' + r.id; if (!ci.has(k)) { ci.set(k, cols.length); cols.push({ k, kind: r.kind, id: r.id, title: titleOf(r.id, r.title) }); } if (!rows.has(r.roll)) rows.set(r.roll, new Map()); rows.get(r.roll).set(k, r); } // the latest result of each student per column
  const C = cls(); for (const roll of Object.keys((C && C.att) || {})) if (!rows.has(roll)) rows.set(roll, new Map());
  const order = [...rows.keys()].sort((a, b) => (+a || 0) - (+b || 0) || a.localeCompare(b));
  return { cols, rows, order };
}
function resultsHTML() {
  const { cols, rows, order } = matrix();
  const head = `<div class="row noprint"><div class="seg" id="range"><button data-r="today" class="${S.resRange === 'today' ? 'on' : ''}">${esc(t('today'))}</button><button data-r="all" class="${S.resRange === 'all' ? 'on' : ''}">${esc(t('allTime'))}</button></div><button class="btn sm" data-a="csv">⬇ ${esc(t('csv'))}</button><button class="btn sm" data-a="print">🖨 ${esc(t('print'))}</button></div>
    <div class="print-only"><h1 style="margin:0">${esc(t('report'))}: ${esc((cls() || {}).name || '')} · ${esc(D.cur)}</h1><p>${new Date().toLocaleString()}</p></div>`;
  if (!cols.length && !((cls() || {}).asks || []).length) return head + `<div class="empty">${esc(t('noRes'))}</div>`;
  const avg = (k) => { const v = order.map((r) => rows.get(r).get(k)).filter(Boolean); return v.length ? v.reduce((a, r) => a + pct(r), 0) / v.length : null; };
  const stAvg = (roll) => { const v = [...rows.get(roll).values()]; return v.length ? v.reduce((a, r) => a + pct(r), 0) / v.length : null; };
  const tbl = !cols.length ? '' : `<div class="mx"><table><thead><tr><th>${esc(t('roll'))}</th><th>${esc(t('name'))}</th>${cols.map((c) => `<th class="c">${c.kind === 'quiz' ? '📝' : '🧪'} ${esc(c.title)}</th>`).join('')}<th>${esc(t('total'))}</th></tr></thead><tbody>
    ${order.map((roll) => { const m = rows.get(roll), a = stAvg(roll); return `<tr><td><b>${esc(roll)}</b></td><td>${esc(nameOf(roll))}</td>${cols.map((c) => { const r = m.get(c.k); return `<td>${r ? `<button class="sc ${scCls(pct(r))}" data-a="detail" data-rid="${esc(r.rid)}">${esc(scTxt(r))}</button>` : ''}</td>`; }).join('')}<td>${a == null ? '' : `<b>${Math.round(a * 100)}%</b>`}</td></tr>`; }).join('')}
    <tr><td colspan="2"><b>${esc(t('avg'))}</b></td>${cols.map((c) => { const a = avg(c.k); return `<td>${a == null ? '' : `<b>${Math.round(a * 100)}%</b>`}</td>`; }).join('')}<td></td></tr></tbody></table></div>`;
  // the questions most students got wrong: what to teach again
  const qs = new Map(); for (const r of resList()) if (r.kind === 'quiz') for (const it of r.items || []) { const k = it.q; const x = qs.get(k) || { q: it.q, right: it.right, n: 0, w: 0, quiz: titleOf(r.id, r.title) }; x.n++; if (!it.ok) x.w++; qs.set(k, x); }
  const miss = [...qs.values()].filter((x) => x.w > 0).sort((a, b) => b.w / b.n - a.w / a.n || b.w - a.w).slice(0, 12);
  const d0 = new Date(); d0.setHours(0, 0, 0, 0); const asks = ((cls() || {}).asks || []).filter((a) => S.resRange === 'all' || a.at >= d0.getTime()).slice(-40).reverse();
  const askH = asks.length ? `<h2>${esc(t('asked'))}</h2><ul class="ql">${asks.map((a) => `<li>${a.found ? '' : '❓ '}<b>${esc(a.q)}</b> <small style="color:var(--mute)">· ${esc(t('roll'))} ${esc(a.roll)}${nameOf(a.roll) ? ' ' + esc(nameOf(a.roll)) : ''} · ${new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${a.found ? '' : ' · ' + esc(t('notAns'))}</small></li>`).join('')}</ul>` : '';
  return head + tbl + askH + (miss.length ? `<h2>${esc(t('missed'))}</h2><ol class="miss">${miss.map((x) => `<li><b>${esc(x.q)}</b><br>✓ ${esc(x.right)}<br><small>${esc(x.quiz)} · ${esc(t('wrongOf', { w: x.w, n: x.n }))}</small></li>`).join('')}</ol>` : '');
}
function attHTML() {
  const C = cls(); const rolls = new Set([...Object.keys(C.att), ...S.students.keys()]); const rs = [...rolls].sort((a, b) => (+a || 0) - (+b || 0) || a.localeCompare(b));
  if (!rs.length) return `<div class="empty">${esc(t('none'))}</div>`;
  return `<div class="mx"><table><thead><tr><th>${esc(t('roll'))}</th><th>${esc(t('name'))}</th><th>${esc(t('first'))}</th><th>${esc(t('lastSeen'))}</th><th>${esc(t('mins'))}</th><th>${esc(t('app'))}</th><th>${esc(t('dev'))}</th></tr></thead><tbody>
    ${rs.map((roll) => { const a = C.att[roll] || {}; const s = S.students.get(roll); const ms = (a.ms || 0) + (s && s.online && s.since ? Date.now() - s.since : 0);
      return `<tr><td><b>${esc(roll)}</b></td><td><input data-roster="${esc(roll)}" value="${esc(nameOf(roll))}" style="border:1px solid var(--line);border-radius:7px;padding:4px 7px;background:var(--bg);width:100%;min-width:120px"></td><td>${a.first ? new Date(a.first).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td><td>${s && s.online ? '● ' + esc(t('live')) : a.last ? new Date(a.last).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td><td>${Math.round(ms / 60000)}</td><td>${esc(L2(W.appsN[(s && s.app) || a.app]) || '')}</td><td>${s && s.st ? (s.st.vr ? 'VR' : esc(t('screen'))) : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function csv() {
  const rows = [['date', 'time', 'class', 'code', 'roll', 'name', 'app', 'kind', 'id', 'title', 'score', 'total', 'percent', 'seconds', 'language']];
  const C = cls(); for (const r of resList()) { const d = new Date(r.at); rows.push([d.toLocaleDateString(), d.toLocaleTimeString(), C.name || '', D.cur, r.roll, nameOf(r.roll), r.app, r.kind, r.id, titleOf(r.id, r.title), r.kind === 'quiz' ? r.score : r.done, r.kind === 'quiz' ? r.total : r.steps, Math.round(pct(r) * 100), r.secs, r.lang]); }
  const txt = '﻿' + rows.map((r) => r.map((x) => { const s = String(x ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' })); a.download = `duet-class-${D.cur}-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

// ------------------------------------------------------------ dialogs
const dlg = $('#dlg');
function openDlg(h, body, onClick) { $('#dlg-h').textContent = h; $('#dlg-b').innerHTML = body; dlg._click = onClick; if (!dlg.open) dlg.showModal(); }
function closeDlg() { if (dlg.open) dlg.close(); }
dlg.addEventListener('close', () => { if (S.watching) { const s = S.students.get(S.watching); send(s, { t: 'watch', every: S.live ? 5000 : 0 }); S.watching = null; } dlg._click = null; });
$('#dlg-x').onclick = closeDlg;
$('#dlg-b').addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (b && dlg._click) dlg._click(b.dataset.x, b, e); });
$('#dlg-b').addEventListener('input', (e) => { if (e.target.id === 'q' && dlg._input) dlg._input(e.target.value); });
const targets = (roll) => (roll ? [S.students.get(roll)].filter(Boolean) : online());
const appsOf = (list) => [...new Set(list.map((s) => s.app).filter(Boolean))];

// pick an activity (to open it or to quiz on it): the activities of the apps the students are in
function picker(mode, roll) {
  const list = targets(roll); const apps = appsOf(list); let app = apps[0] || 'science'; let q = '', sub = 'all', cl = 0;
  const draw = (listOnly) => {
    if (!CAT) { $('#dlg-b').innerHTML = '…'; return; }
    const items = CAT[app] || []; const subs = [...new Set(items.map((i) => i.s || i.k))]; const clss = [...new Set(items.map((i) => i.c).filter(Boolean))].sort((a, b) => a - b);
    const ql = q.toLowerCase(); const shown = items.filter((i) => (sub === 'all' || (i.s || i.k) === sub) && (!cl || i.c === cl) && (!ql || (L2(i.t) + ' ' + (i.t.en || '') + ' ' + L2(i.ch)).toLowerCase().includes(ql)) && (mode !== 'quiz' || app === 'body' ? (mode !== 'quiz' || i.k === 'sys' || i.k === 'lab' || i.k === 'split') : i.v > 0));
    const groups = new Map(); for (const i of shown.slice(0, 400)) { const g = i.ch ? `${t('cls')} ${i.c} · ${L2(i.ch)}` : L2(KIND[i.k]) || ''; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(i); }
    const list = [...groups.entries()].map(([g, is]) => `<div class="chh">${esc(g)}${mode === 'quiz' && is[0].ch ? ` <button class="btn sm" data-x="chq" data-id="${esc(is[0].id)}">📝 ${esc(t('chQuiz'))}</button>` : ''}</div>${is.map((i) => `<div class="it"><div class="t">${esc(L2(i.t))}${i.s ? `<small>${esc(L2(SUBJ[i.s]))}</small>` : ''}</div><button class="btn sm ${mode === 'quiz' ? '' : 'pri'}" data-x="${mode === 'quiz' ? 'q1' : 'o1'}" data-id="${esc(i.id)}">${mode === 'quiz' ? '📝 ' + esc(t('quiz')) : esc(t('open')) + ' ›'}</button></div>`).join('')}`).join('');
    if (listOnly && $('#items')) { $('#items').innerHTML = list; return; }
    $('#dlg-b').innerHTML = `${mode === 'quiz' ? `<button class="btn pri" data-x="cur" style="width:100%;justify-content:center;margin-bottom:6px">📝 ${esc(t('quizCur'))}</button><p style="color:var(--mute);margin:4px 0 10px;text-align:center">${esc(t('quizOr'))}</p>` : ''}
      ${apps.length > 1 || !apps.length ? `<div class="chips">${['science', 'maths', 'body'].map((a) => `<button data-x="app" data-v="${a}" class="${a === app ? 'on' : ''}">${ICON[a]} ${esc(L2(W.appsN[a]))}</button>`).join('')}</div>` : ''}
      <input type="search" id="q" placeholder="${esc(t('search'))}" value="${esc(q)}">
      ${subs.length > 1 ? `<div class="chips"><button data-x="sub" data-v="all" class="${sub === 'all' ? 'on' : ''}">${esc(t('all'))}</button>${subs.map((s) => `<button data-x="sub" data-v="${esc(s)}" class="${sub === s ? 'on' : ''}">${esc(L2(SUBJ[s] || KIND[s]) || s)}</button>`).join('')}</div>` : ''}
      ${clss.length > 1 ? `<div class="chips"><button data-x="cls" data-v="0" class="${!cl ? 'on' : ''}">${esc(t('cls'))}: ${esc(t('all'))}</button>${clss.map((c) => `<button data-x="cls" data-v="${c}" class="${cl === c ? 'on' : ''}">${c}</button>`).join('')}</div>` : ''}
      ${apps.length && !apps.includes(app) ? `<p style="color:var(--warn)">${esc(t('noApp'))}</p>` : ''}
      <div id="items">${list}</div>`;
    const qi = $('#q'); if (qi && document.activeElement !== qi) setTimeout(() => { if (qi.isConnected) { qi.focus(); const n = qi.value.length; qi.setSelectionRange(n, n); } }, 30);
  };
  dlg._input = (v) => { q = v; draw(true); }; // typing redraws only the list, never the box being typed in
  const who = roll ? `${t('roll')} ${roll}` : t('everyone');
  openDlg(`${mode === 'quiz' ? '📝 ' + t('quiz') : '📤 ' + t('send')} · ${who}`, '', (x, b) => {
    if (x === 'app') { app = b.dataset.v; sub = 'all'; cl = 0; draw(); }
    else if (x === 'sub') { sub = b.dataset.v; draw(); } else if (x === 'cls') { cl = +b.dataset.v; draw(); }
    else if (x === 'o1') { const n = sendTo(roll, { t: 'cmd', do: 'open', id: b.dataset.id, app }); toast(t('sentTo', { n })); closeDlg(); }
    else if (x === 'q1' || x === 'chq') { const id = (x === 'chq' ? 'ch:' : '') + b.dataset.id; const n = sendTo(roll, { t: 'cmd', do: 'quiz', id, app }); toast(t('sentTo', { n })); closeDlg(); }
    else if (x === 'cur') { const n = sendTo(roll, { t: 'cmd', do: 'quiz' }); toast(t('sentTo', { n })); closeDlg(); }
  });
  draw();
}
// which students can open an activity: Maths Lab 360 has the Maths Lab activities and the science ones (chemistry,
// physics, biology); Science Lab 360 has its own; Human Body 360 its own
function canOpen(s, id) {
  if (!id || !CAT) return true; const base = String(id).replace(/^ch:/, ''); const inC = (a) => CAT[a].some((i) => i.id === base);
  if (s.app === 'body') return inC('body'); if (s.app === 'science') return inC('science');
  if (s.app === 'maths') return inC('maths') || CAT.science.some((i) => i.id === base && i.s !== 'maths'); return true;
}
function sendTo(roll, m) { const list = targets(roll).filter((s) => canOpen(s, m.id)); let n = 0; for (const s of list) if (send(s, m)) n++; if (!n) toast(t('nobody')); return n; }
function msgDlg(roll) {
  const who = roll ? `${t('roll')} ${roll}` : t('everyone');
  openDlg(`💬 ${t('msg')} · ${who}`, `<textarea id="mtxt" placeholder="${esc(t('msgP'))}" maxlength="300"></textarea><div class="chips">${(W.presets[D.lang] || W.presets.en).map((p) => `<button data-x="pre">${esc(p)}</button>`).join('')}</div><button class="btn pri" data-x="go">${esc(t('sendB'))} ›</button>`,
    (x, b) => { if (x === 'pre') { $('#mtxt').value = b.textContent; return; } if (x === 'go') { const v = $('#mtxt').value.trim(); if (!v) return; const n = sendTo(roll, { t: 'cmd', do: 'msg', text: v }); toast(t('sentTo', { n })); closeDlg(); } });
  setTimeout(() => { const m = $('#mtxt'); if (m) m.focus(); }, 30);
}
function langDlg() { openDlg('🌐 ' + t('lang'), `<div class="chips">${[['en', 'English'], ['hi', 'हिंदी'], ['hg', 'Hinglish']].map(([l, n]) => `<button data-x="l" data-v="${l}">${n}</button>`).join('')}</div>`, (x, b) => { if (x === 'l') { const n = broadcast({ t: 'cmd', do: 'lang', l: b.dataset.v }); toast(t('sentTo', { n })); closeDlg(); } }); }
function eyesDlg() {
  openDlg('👀 ' + t('eyes'), `<label style="font-weight:600">${esc(t('eyesMsg'))}</label><textarea id="etxt" maxlength="120" style="min-height:60px"></textarea><div style="margin-top:10px"><button class="btn warn" data-x="go">👀 ${esc(t('eyes'))}</button></div>`,
    (x) => { if (x === 'go') { S.frozen = { msg: $('#etxt').value.trim() }; broadcast({ t: 'cmd', do: 'freeze', msg: S.frozen.msg }); closeDlg(); render(); } });
}
function watchDlg(roll) {
  const s = S.students.get(roll); if (!s) return; if (S.watching && S.watching !== roll) send(S.students.get(S.watching), { t: 'watch', every: S.live ? 5000 : 0 });
  S.watching = roll; send(s, { t: 'watch', every: 1500, big: true });
  openDlg(`👁 ${t('roll')} ${roll}${nameOf(roll) ? ' · ' + nameOf(roll) : ''}`, `<div class="big">${s.img ? `<img id="bigimg" src="${s.img}">` : `<img id="bigimg" alt="">`}</div><p id="bigst" style="margin:10px 0 0;font-weight:600">${esc(titleOf((s.st || {}).act, (s.st || {}).title))} · ${esc(stLine(s))}</p>
    <div class="row" style="margin-top:10px"><button class="btn" data-x="msg">💬 ${esc(t('msg'))}</button><button class="btn" data-x="send">📤 ${esc(t('send'))}</button><button class="btn" data-x="quiz">📝 ${esc(t('quiz'))}</button></div>`,
    (x) => { if (x === 'msg') msgDlg(roll); else if (x === 'send') picker('open', roll); else if (x === 'quiz') picker('quiz', roll); });
}
function detailDlg(rid) {
  const r = (cls() || { results: [] }).results.find((x) => x.rid === rid); if (!r) return;
  const loc = D.lang !== 'en' && r.lang === D.lang;
  openDlg(`${r.kind === 'quiz' ? '📝' : '🧪'} ${titleOf(r.id, r.title)} · ${t('roll')} ${r.roll}`, `<p><b style="font-size:22px">${esc(scTxt(r))}</b> · ${new Date(r.at).toLocaleString()} · ${Math.round(r.secs / 60)} min</p>
    ${r.items && r.items.length ? `<ul class="ql">${r.items.map((i, k) => `<li><b>${k + 1}. ${esc(loc && i.lq ? i.lq : i.q)}</b><br><span class="${i.ok ? 'ok' : 'no'}">${i.ok ? '✓' : '✗'} ${esc(t('picked'))}: ${esc(loc && i.lpick ? i.lpick : i.pick || '—')}</span>${i.ok ? '' : `<br><span class="ok">✓ ${esc(t('rightA'))}: ${esc(loc && i.lright ? i.lright : i.right)}</span>`}</li>`).join('')}</ul>` : ''}`, null);
}
function classesDlg() {
  const all = Object.entries(D.classes).sort((a, b) => b[1].last - a[1].last);
  openDlg('☰ ' + t('classes'), `<button class="btn pri" data-x="new">＋ ${esc(t('newClass'))}</button>${all.map(([c, x]) => `<div class="it"><div class="t"><b>${esc(x.name || t('cls'))} · ${esc(c)}</b><small>${new Date(x.last).toLocaleString()} · ${x.results.length} ${esc(t('results'))}</small></div><button class="btn sm" data-x="open" data-c="${esc(c)}">${esc(t('open'))} ›</button></div>`).join('')}`,
    (x, b) => { if (x === 'new') { closeDlg(); if (S.peer) { try { S.peer.destroy(); } catch (e) {} S.peer = null; } D.cur = null; save(); S.students.clear(); render(); } else if (x === 'open') { closeDlg(); openClass(b.dataset.c); } });
}

// ------------------------------------------------------------ clicks
document.addEventListener('click', (e) => {
  const lb = e.target.closest('#langs button'); if (lb) { D.lang = lb.dataset.l; save(); render(); return; }
  if (e.target.closest('#b-classes')) { classesDlg(); return; }
  const tb = e.target.closest('.tabs button'); if (tb) { S.tab = tb.dataset.tab; render(); return; }
  const rb = e.target.closest('#range button'); if (rb) { S.resRange = rb.dataset.r; renderTab(); return; }
  const b = e.target.closest('[data-a]'); if (!b || b.disabled || e.target.closest('dialog')) return; const a = b.dataset.a; const card = b.closest('.card'); const roll = card && card.dataset.roll;
  if (a === 'create') startClass(($('#c-name') || {}).value || '');
  else if (a === 'reopen') openClass(b.dataset.c);
  else if (a === 'eyes') { if (S.frozen) { S.frozen = null; broadcast({ t: 'cmd', do: 'unfreeze' }); render(); } else eyesDlg(); }
  else if (a === 'send') picker('open'); else if (a === 'quiz') picker('quiz'); else if (a === 'msg') msgDlg(); else if (a === 'lang') langDlg();
  else if (a === 'screens') setLive(!S.live);
  else if (a === 'lock') { S.locked = !S.locked; render(); }
  else if (a === 'end') { if (confirm(t('endQ'))) { broadcast({ t: 'cmd', do: 'end' }); for (const s of S.students.values()) tickAtt(s); S.frozen = null; setTimeout(() => { if (S.peer) { try { S.peer.destroy(); } catch (x) {} S.peer = null; } D.cur = null; save(); S.students.clear(); render(); }, 800); } }
  else if (a === 'lower') { const s = S.students.get(roll); send(s, { t: 'cmd', do: 'help_off' }); if (s) { s.st.help = false; renderCard(s); } }
  else if (a === 'watch') watchDlg(roll); else if (a === 'msg1') msgDlg(roll); else if (a === 'send1') picker('open', roll); else if (a === 'quiz1') picker('quiz', roll);
  else if (a === 'forget') { S.students.delete(roll); renderTab(); }
  else if (a === 'detail') detailDlg(b.dataset.rid);
  else if (a === 'csv') csv(); else if (a === 'print') window.print();
});
document.addEventListener('change', (e) => { const r = e.target.dataset && e.target.dataset.roster; if (r == null) return; const C = cls(); if (!C) return; C.roster[r] = e.target.value.trim().slice(0, 40); save(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'c-name') startClass(e.target.value); });
window.addEventListener('beforeunload', () => { for (const s of S.students.values()) tickAtt(s); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} });

render(); if (D.cur && D.classes[D.cur]) host();
window.DUETCLASS = { S, D, broadcast, cls, catLoad }; // for tests
