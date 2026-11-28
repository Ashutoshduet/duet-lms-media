// Classroom on the student's side, for Science Lab 360, Maths Lab 360 and Human Body 360 (master copy here; body/js has
// a copy kept in step by the pre-commit hook): joining a class, the raised hand, the teacher's "eyes on me", messages,
// quizzes (on the screen and on the headset's panel) and the student's own results.
import * as THREE from 'three';
import { ClassLink, QuizRun, snapView, cstore } from './classroom.js';
import { TutorIndex, pick } from './tutor.js';

const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const W = {
  cls: { en: 'Class', hi: 'क्लास', hg: 'Class' },
  join: { en: 'Join your class', hi: 'अपनी क्लास से जुड़िए', hg: 'Apni class se judiye' },
  joinSub: { en: 'Your teacher opens the class page and tells you the class code.', hi: 'आपके टीचर क्लास पेज खोलकर आपको क्लास कोड बताएँगे।', hg: 'Aapke teacher class page kholkar aapko class code batayenge.' },
  code: { en: 'Class code', hi: 'क्लास कोड', hg: 'Class code' },
  roll: { en: 'Roll number', hi: 'रोल नंबर', hg: 'Roll number' },
  name: { en: 'Your name (optional)', hi: 'आपका नाम (चाहें तो)', hg: 'Aapka naam (optional)' },
  joinBtn: { en: 'Join', hi: 'जुड़िए', hg: 'Join karo' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', hg: 'Cancel' },
  close: { en: 'Close', hi: 'बंद करें', hg: 'Band karo' },
  back: { en: 'Back', hi: 'पीछे', hg: 'Back' },
  del: { en: 'Delete', hi: 'मिटाएँ', hg: 'Delete' },
  next: { en: 'Next', hi: 'आगे', hg: 'Aage' },
  privacy: { en: 'The app talks to your teacher’s screen over the school Wi-Fi. Your results are also kept on this device.', hi: 'ऐप स्कूल के Wi-Fi से आपके टीचर की स्क्रीन से बात करता है। आपके नतीजे इस डिवाइस पर भी रखे जाते हैं।', hg: 'App school ke Wi-Fi se aapke teacher ki screen se baat karta hai. Aapke results is device par bhi rakhe jaate hain.' },
  on: { en: 'Connected to your teacher', hi: 'टीचर से जुड़े हैं', hg: 'Teacher se connected' },
  connecting: { en: 'Connecting…', hi: 'जुड़ रहे हैं…', hg: 'Connect ho raha hai…' },
  lost: { en: 'Not connected. Trying again…', hi: 'जुड़े नहीं हैं। फिर कोशिश कर रहे हैं…', hg: 'Connected nahi. Phir try kar rahe hain…' },
  nocode: { en: 'No class is open with this code. Check the code, or ask your teacher to open the class page.', hi: 'इस कोड की कोई क्लास खुली नहीं है। कोड जाँचिए, या टीचर से क्लास पेज खोलने को कहिए।', hg: 'Is code ki koi class khuli nahi hai. Code check kariye, ya teacher se class page kholne ko kahiye.' },
  offline: { en: 'Cannot reach the internet. Trying again…', hi: 'इंटरनेट नहीं मिल रहा। फिर कोशिश कर रहे हैं…', hg: 'Internet nahi mil raha. Phir try kar rahe hain…' },
  slow: { en: 'Your teacher’s screen is not answering. Trying again…', hi: 'टीचर की स्क्रीन जवाब नहीं दे रही। फिर कोशिश कर रहे हैं…', hg: 'Teacher ki screen jawab nahi de rahi. Phir try kar rahe hain…' },
  hand: { en: 'Raise hand', hi: 'हाथ उठाइए', hg: 'Haath uthao' },
  handDown: { en: 'Lower hand', hi: 'हाथ नीचे', hg: 'Haath neeche' },
  handUp: { en: 'Your hand is up. Your teacher can see it.', hi: 'आपका हाथ उठा है। टीचर इसे देख सकते हैं।', hg: 'Aapka haath utha hai. Teacher ise dekh sakte hain.' },
  quiz: { en: 'Quiz', hi: 'क्विज़', hg: 'Quiz' },
  quizThis: { en: 'Quiz on this activity', hi: 'इस गतिविधि का क्विज़', hg: 'Is activity ka quiz' },
  noQuiz: { en: 'Open an activity first: its quiz is made from it.', hi: 'पहले कोई गतिविधि खोलिए: क्विज़ उसी से बनता है।', hg: 'Pehle koi activity kholiye: quiz usi se banta hai.' },
  results: { en: 'My results', hi: 'मेरे नतीजे', hg: 'Mere results' },
  noResults: { en: 'No results yet. Finish an activity or a quiz.', hi: 'अभी कोई नतीजा नहीं। कोई गतिविधि या क्विज़ पूरा कीजिए।', hg: 'Abhi koi result nahi. Koi activity ya quiz poora kijiye.' },
  leave: { en: 'Leave class', hi: 'क्लास छोड़िए', hg: 'Class chhodiye' },
  qOf: { en: 'Question {i} of {n}', hi: 'प्रश्न {i} / {n}', hg: 'Question {i} / {n}' },
  right: { en: 'Right!', hi: 'सही!', hg: 'Sahi!' },
  wrong: { en: 'Not quite. The right answer is marked green.', hi: 'सही नहीं। सही उत्तर हरे रंग में है।', hg: 'Sahi nahi. Sahi answer green mein hai.' },
  score: { en: 'Your score', hi: 'आपका स्कोर', hg: 'Aapka score' },
  great: { en: 'Excellent! You know this well.', hi: 'शानदार! आपको यह अच्छी तरह आता है।', hg: 'Shaandaar! Aapko ye achhi tarah aata hai.' },
  good: { en: 'Good. Look again at the ones you missed.', hi: 'अच्छा। जो छूट गए उन्हें फिर से देखिए।', hg: 'Achha. Jo chhoot gaye unhe phir se dekhiye.' },
  more: { en: 'Do the activity again, then try the quiz once more.', hi: 'गतिविधि फिर से कीजिए, फिर क्विज़ दोबारा दीजिए।', hg: 'Activity phir se kijiye, phir quiz dobara dijiye.' },
  missed: { en: 'The ones you missed', hi: 'जो छूट गए', hg: 'Jo chhoot gaye' },
  again: { en: 'New quiz', hi: 'नया क्विज़', hg: 'Naya quiz' },
  done: { en: 'Done', hi: 'हो गया', hg: 'Ho gaya' },
  sentT: { en: 'sent to your teacher', hi: 'टीचर को भेजा गया', hg: 'teacher ko bheja gaya' },
  keptT: { en: 'kept on this device', hi: 'इस डिवाइस पर रखा है', hg: 'is device par rakha hai' },
  eyes: { en: 'Eyes on your teacher', hi: 'टीचर की ओर देखिए', hg: 'Teacher ki taraf dekhiye' },
  eyesSub: { en: 'Your teacher has paused the class. Take off the headset or look up and listen.', hi: 'टीचर ने क्लास रोकी है। हेडसेट उतारिए या ऊपर देखकर सुनिए।', hg: 'Teacher ne class roki hai. Headset utaariye ya upar dekhkar suniye.' },
  fromT: { en: 'Message from your teacher', hi: 'टीचर का संदेश', hg: 'Teacher ka message' },
  ended: { en: 'Your teacher has ended the class.', hi: 'टीचर ने क्लास ख़त्म कर दी है।', hg: 'Teacher ne class khatam kar di hai.' },
  qStart: { en: 'Quiz from your teacher: on the panel on your right', hi: 'टीचर का क्विज़: दाईं ओर के पैनल पर', hg: 'Teacher ka quiz: right side wale panel par' },
  qNoAct: { en: 'Your teacher started a quiz, but it could not be made here.', hi: 'टीचर ने क्विज़ शुरू किया, पर यहाँ नहीं बन सका।', hg: 'Teacher ne quiz shuru kiya, par yahan nahi ban saka.' },
  actDone: { en: 'activity', hi: 'गतिविधि', hg: 'activity' },
  ask: { en: 'Ask', hi: 'पूछिए', hg: 'Poochho' },
  askT: { en: 'Ask the DUET tutor', hi: 'DUET ट्यूटर से पूछिए', hg: 'DUET tutor se poochho' },
  askSub: { en: 'Ask about what you are doing, or tap a question.', hi: 'जो कर रहे हैं उसके बारे में पूछिए, या किसी प्रश्न पर टैप कीजिए।', hg: 'Jo kar rahe ho uske baare mein poochho, ya kisi question par tap karo.' },
  askP: { en: 'Type your question…', hi: 'अपना प्रश्न लिखिए…', hg: 'Apna question likhiye…' },
  send: { en: 'Ask', hi: 'पूछें', hg: 'Poochho' },
  listen: { en: 'Speak', hi: 'बोलिए', hg: 'Boliye' },
  hearing: { en: 'Listening…', hi: 'सुन रहे हैं…', hg: 'Sun rahe hain…' },
  readAloud: { en: 'Read aloud', hi: 'पढ़कर सुनाएँ', hg: 'Padhkar sunao' },
  notFound: { en: 'I could not find this in this app yet. Try one of the questions below, or ask your teacher.', hi: 'यह अभी इस ऐप में नहीं मिला। नीचे का कोई प्रश्न आज़माइए, या अपने टीचर से पूछिए।', hg: 'Ye abhi is app mein nahi mila. Neeche ka koi question try kariye, ya apne teacher se poochhiye.' },
  fromAct: { en: 'From', hi: 'स्रोत', hg: 'Source' },
  openIt: { en: 'Open it', hi: 'खोलिए', hg: 'Kholiye' },
  tryQ: { en: 'Questions to ask', hi: 'पूछने लायक प्रश्न', hg: 'Poochhne layak questions' },
  online: { en: 'online tutor', hi: 'ऑनलाइन ट्यूटर', hg: 'online tutor' },
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tx = (o, L) => (o && (o[L] || o.en)) || '';

const CSS = `
.dc-chip{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#f3eee6;font:600 14px/1 ${FONT};cursor:pointer;white-space:nowrap}
.dc-chip:hover{background:rgba(255,255,255,.16)}.dc-chip i{width:9px;height:9px;border-radius:50%;background:#7a8290;display:inline-block}
.dc-chip.on i{background:#6fd16f}.dc-chip.connecting i,.dc-chip.lost i{background:#f0a65a}.dc-chip.hand{background:#f0a65a;color:#14100a}
.dc-modal{position:fixed;inset:0;z-index:9000;background:rgba(5,8,12,.62);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.dc-card{background:#141922;color:#f3eee6;border:1px solid rgba(255,255,255,.14);border-radius:18px;max-width:660px;width:100%;max-height:calc(100vh - 32px);overflow:auto;padding:22px 22px 18px;box-shadow:0 24px 70px rgba(0,0,0,.55);font:16px/1.5 ${FONT};box-sizing:border-box}
.dc-card h2{margin:0 0 4px;font-size:22px}.dc-card p{margin:6px 0}.dc-card .sub{color:#b9c0cc}
.dc-card label{display:block;margin:12px 0 0;font-weight:600;font-size:14px;color:#c9d0db}
.dc-card input{display:block;width:100%;box-sizing:border-box;margin-top:5px;height:46px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:#0b0f17;color:#fff;font:600 20px ${FONT};padding:0 12px}
.dc-card input.code{letter-spacing:.3em;font-size:26px;text-align:center}
.dc-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.dc-row button,.dc-btn{flex:1 1 auto;min-height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#f3eee6;font:600 16px ${FONT};padding:8px 14px;cursor:pointer}
.dc-row button.pri,.dc-btn.pri{background:#7fd1ff;color:#0b1520;border-color:#7fd1ff}.dc-row button:disabled{opacity:.45;cursor:default}
.dc-row button.warn{background:#f0a65a;color:#14100a;border-color:#f0a65a}
.dc-err{color:#ff9b8a;min-height:1.4em;margin-top:8px;font-weight:600}.dc-small{font-size:13px;color:#8f97a5}
.dc-st{display:flex;align-items:center;gap:8px;font-weight:600}.dc-st i{width:11px;height:11px;border-radius:50%;background:#7a8290}.dc-st.on i{background:#6fd16f}.dc-st.connecting i,.dc-st.lost i{background:#f0a65a}
.dc-q{font-size:19px;font-weight:600;white-space:pre-line;margin:10px 0 14px}.dc-prog{color:#7fd1ff;font-weight:700;font-size:14px}
.dc-opts{display:grid;gap:10px}.dc-opt{display:flex;gap:12px;align-items:flex-start;text-align:left;min-height:52px;border-radius:12px;border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#f3eee6;font:500 16px/1.4 ${FONT};padding:10px 14px;cursor:pointer}
.dc-opt b{flex:0 0 26px;height:26px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:14px}
.dc-opt:hover:not(:disabled){border-color:#7fd1ff}.dc-opt:disabled{cursor:default}.dc-opt.ok{border-color:#6fd16f;background:rgba(111,209,111,.16)}.dc-opt.no{border-color:#ff7a6a;background:rgba(255,122,106,.14)}
.dc-fb{min-height:1.5em;margin-top:10px;font-weight:700}.dc-fb.ok{color:#8fe08f}.dc-fb.no{color:#ffb0a5}
.dc-big{font-size:44px;font-weight:800;color:#7fd1ff;margin:6px 0}
.dc-list{list-style:none;padding:0;margin:8px 0}.dc-list li{padding:9px 0;border-top:1px solid rgba(255,255,255,.1)}.dc-list small{color:#8f97a5}
.dc-freeze{position:fixed;inset:0;z-index:9500;background:rgba(6,9,14,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f3eee6;text-align:center;font:600 18px/1.5 ${FONT};padding:24px}
.dc-freeze h1{font-size:40px;margin:10px 0}.dc-freeze .e{font-size:64px}
.dc-msg{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:9400;max-width:min(560px,calc(100vw - 32px));background:#1d2633;border:2px solid #7fd1ff;color:#f3eee6;border-radius:14px;padding:12px 16px;font:600 16px/1.45 ${FONT};box-shadow:0 12px 40px rgba(0,0,0,.45)}
.dc-msg small{display:block;color:#7fd1ff;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.dc-chat{display:flex;flex-direction:column;gap:10px;margin:12px 0;max-height:46vh;overflow:auto}
.dc-chat .me{align-self:flex-end;background:#2b3a4d;border-radius:14px 14px 4px 14px;padding:8px 12px;max-width:85%}
.dc-chat .tu{align-self:flex-start;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px 14px 14px 4px;padding:10px 12px;max-width:92%;white-space:pre-line}
.dc-chat .tu small{display:block;color:#8f97a5;margin-top:6px;white-space:normal}.dc-chat .tu button{margin-top:6px;border:0;background:none;color:#7fd1ff;font-weight:700;cursor:pointer;padding:0}
.dc-sg{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.dc-sg button{border:1px solid rgba(127,209,255,.4);background:rgba(127,209,255,.08);color:#d9f1ff;border-radius:999px;padding:5px 11px;font:500 14px ${FONT};cursor:pointer;text-align:left}
.dc-askrow{display:flex;gap:8px}.dc-askrow input{flex:1;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:#0b0f17;color:#fff;font:500 16px ${FONT};padding:0 12px;min-width:0}
.dc-askrow button{min-width:48px;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#f3eee6;font:600 16px ${FONT};cursor:pointer}.dc-askrow button.pri{background:#7fd1ff;color:#0b1520;border-color:#7fd1ff;padding:0 14px}
.dc-askrow button.on{background:#ff7a6a;border-color:#ff7a6a;color:#14100a}
.dc-modal.side{background:transparent;backdrop-filter:none;justify-content:flex-end;align-items:flex-start;pointer-events:none;padding:76px 14px 14px}
.dc-modal.side .dc-card{pointer-events:auto;max-width:430px;max-height:calc(100vh - 92px)}
@media (max-width:720px){.dc-modal.side{align-items:flex-end;padding:8px}.dc-modal.side .dc-card{max-width:none;max-height:52vh}}
@media (max-width:520px){.dc-card{padding:16px}.dc-q{font-size:17px}}
`;

export class ClassUI {
  // ad: { app, lang(), setLang(l), renderer, scene, camera, status(), open(id), quiz(id|null), current(), dirty(), mount, freeze(on), onQuizShow(q), onQuizEnd(), toast(msg), rightPanel }
  constructor(ad) {
    this.ad = ad; this.page = null; this.vrPage = null; this.quiz = null; this.keypad = null; this.chat = []; this.say1 = cstore.get('say', false);
    this.link = new ClassLink({ app: ad.app, status: () => this.status(), command: (m) => this.onCommand(m),
      snap: (w, h) => (ad.renderer ? snapView(ad.renderer, ad.scene, ad.camera, w, h) : null), changed: () => this.refresh() });
    if (typeof document !== 'undefined') {
      const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      this.chip = document.createElement('button'); this.chip.className = 'dc-chip'; this.chip.type = 'button'; this.chip.onclick = () => this.openPage(this.link.inClass ? 'class' : 'join');
      if (ad.mount) ad.mount.insertBefore(this.chip, ad.mount.firstChild);
      if (ad.docs) { this.askChip = document.createElement('button'); this.askChip.className = 'dc-chip'; this.askChip.type = 'button'; this.askChip.onclick = () => this.openAsk(); if (ad.mount) ad.mount.insertBefore(this.askChip, this.chip.nextSibling); }
      this.renderChip();
      // the online tutor, when DUET STEM has switched it on (tutor.json at the site root; see devtools/tutor/worker.js)
      fetch(new URL('../../tutor.json', import.meta.url)).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && /^https:\/\//.test(j.url || '')) this.tutorUrl = j.url; }).catch(() => {});
    }
  }
  L() { return this.ad.lang(); } t(k) { return tx(W[k], this.L()); }
  get xr() { return !!(this.ad.renderer && this.ad.renderer.xr.isPresenting); }
  status() {
    const s = (this.ad.status && this.ad.status()) || {}; s.vr = this.xr; s.lang = this.L();
    if (this.quiz) s.quiz = { i: this.quiz.i + (this.quiz.state === 'done' ? 1 : 0), n: this.quiz.qs.length, score: this.quiz.score, title: tx(this.quiz.meta.title, 'en'), done: this.quiz.state === 'done' };
    return s;
  }
  refresh() { this.renderChip(); if (this.page === 'class' || this.page === 'join') this.renderPage(); this.ad.dirty && this.ad.dirty(); this.renderFreeze(); }
  renderChip() {
    if (!this.chip) return; const k = this.link; this.chip.className = `dc-chip ${k.state}${k.help ? ' hand' : ''}`;
    this.chip.innerHTML = k.inClass ? `<i></i>${k.help ? '✋ ' : ''}${esc(this.t('cls'))} ${esc(k.code)}` : `👥 ${esc(this.t('cls'))}`;
    this.chip.title = k.inClass ? this.statusText() : this.t('join');
    if (this.askChip) { this.askChip.textContent = '🤖 ' + this.t('ask'); this.askChip.title = this.t('askT'); }
  }
  statusText() { const k = this.link; if (k.state === 'on') return this.t('on') + (k.className ? ` · ${k.className}` : ''); if (k.state === 'connecting') return this.t('connecting'); return k.err && W[k.err] ? this.t(k.err) : this.t('lost'); }
  // ------------------------------------------------------------ teacher's commands
  onCommand(m) {
    const L = this.L();
    if (m.do === 'freeze') { this.ad.freeze && this.ad.freeze(true); }
    else if (m.do === 'unfreeze') { this.ad.freeze && this.ad.freeze(false); }
    else if (m.do === 'open' && m.id) { this.closeQuiz(); this.ad.open && this.ad.open(m.id); }
    else if (m.do === 'quiz') { const ok = this.startQuiz(m.id || null, 'teacher'); this.say(ok ? (this.xr ? this.t('qStart') : this.t('qStart').split(':')[0]) : this.t('qNoAct'), ok ? '📝' : '⚠'); }
    else if (m.do === 'lang' && m.l) this.ad.setLang && this.ad.setLang(m.l);
    else if (m.do === 'msg') this.say(this.link.msg ? this.link.msg.text : '', '💬', true);
    else if (m.do === 'ended') { this.say(this.t('ended'), '👋'); this.ad.freeze && this.ad.freeze(false); if (this.page === 'class') this.closePage(); }
    void L; this.refresh();
  }
  // a message: a banner on the screen; in the headset, a card in front of the eyes for a few seconds
  say(text, icon = '💬', fromTeacher = false) {
    if (!text) return; this.note = { text, icon, from: fromTeacher, until: performance.now() + (fromTeacher ? 12000 : 6000) }; this.noteDirty = true;
    if (typeof document === 'undefined') return;
    let el = document.querySelector('.dc-msg'); if (!el) { el = document.createElement('div'); el.className = 'dc-msg'; document.body.appendChild(el); }
    el.innerHTML = `${fromTeacher ? `<small>${esc(this.t('fromT'))}</small>` : ''}${esc(icon)} ${esc(text)}`; el.style.display = '';
    clearTimeout(this._mt); this._mt = setTimeout(() => { el.style.display = 'none'; }, fromTeacher ? 12000 : 6000);
  }
  renderFreeze() {
    if (typeof document === 'undefined') return; const f = this.link.frozen; let el = document.querySelector('.dc-freeze');
    if (!f) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'dc-freeze'; document.body.appendChild(el); }
    el.innerHTML = `<div class="e">👀</div><h1>${esc(this.t('eyes'))}</h1>${f.msg ? `<p style="font-size:22px">${esc(f.msg)}</p>` : ''}<p style="color:#b9c0cc">${esc(this.t('eyesSub'))}</p>`;
  }
  // ------------------------------------------------------------ results
  activityDone(r) { // { id, title, steps, done, ok, secs }
    const last = this._lastAct; if (last && last.id === r.id && Date.now() - last.at < 4000) return; this._lastAct = { id: r.id, at: Date.now() };
    this.link.report({ kind: 'activity', ...r });
  }
  // ------------------------------------------------------------ quiz
  startQuiz(id, from = 'self') {
    const z = this.ad.quiz && this.ad.quiz(id || (this.ad.current && this.ad.current()));
    if (!z || !z.qs || !z.qs.length) { if (from === 'self') this.say(this.t('noQuiz'), 'ℹ'); return false; }
    this.quiz = new QuizRun(z.meta, z.qs); this.quiz.from = from; this.qPage = 'q';
    if (this.xr) { this.vrPage = 'quiz'; this.closePage(); } else this.openPage('quiz');
    this.ad.onQuizShow && this.ad.onQuizShow(this.quiz.cur); this.link.tick(true); this.ad.dirty && this.ad.dirty(); return true;
  }
  pick(k) {
    const z = this.quiz; if (!z || z.state !== 'ask' || k < 0 || k >= z.cur.opts.length) return;
    z.pick(k); this.ad.answer && this.ad.answer(k === z.cur.right); this.link.tick(true); this.renderPage(); this.ad.dirty && this.ad.dirty();
  }
  qNext() {
    const z = this.quiz; if (!z) return; z.next();
    if (z.state === 'done') { this.lastRes = this.link.report(z.result(this.L())); this.ad.onQuizEnd && this.ad.onQuizEnd(); }
    else this.ad.onQuizShow && this.ad.onQuizShow(z.cur);
    this.link.tick(true); this.renderPage(); this.ad.dirty && this.ad.dirty();
  }
  closeQuiz() { if (!this.quiz) return; this.quiz = null; this.ad.onQuizEnd && this.ad.onQuizEnd(); if (this.page === 'quiz') this.closePage(); if (this.vrPage === 'quiz') this.vrPage = null; this.link.tick(true); this.ad.dirty && this.ad.dirty(); }
  // ------------------------------------------------------------ screen pages
  openPage(p) {
    if (this.xr) { this.vrPage = p === 'join' ? 'join' : p; if (p === 'join') this.keypad = { f: 'code', code: this.link.code || '', roll: this.link.roll || '' }; this.ad.dirty && this.ad.dirty(); return; }
    this.page = p; this.renderPage();
  }
  closePage() { this.page = null; const m = document.querySelector('.dc-modal'); if (m) m.remove(); }
  renderPage() {
    if (!this.page || typeof document === 'undefined') return;
    let m = document.querySelector('.dc-modal'); if (!m) { m = document.createElement('div'); document.body.appendChild(m);
      m.addEventListener('click', (e) => { if (e.target === m && this.page !== 'quiz') this.closePage(); const b = e.target.closest('[data-a]'); if (b && !b.disabled) this.act(b.dataset.a, b); }); }
    m.className = 'dc-modal' + ((this.ad.side && this.page === 'quiz') || this.page === 'ask' ? ' side' : ''); // Human Body: the quiz sits at the side, so the glowing part stays in view
    const k = this.link, L = this.L(); let h = '';
    if (this.page === 'join') {
      h = `<h2>👥 ${esc(this.t('join'))}</h2><p class="sub">${esc(this.t('joinSub'))}</p>
        <label>${esc(this.t('code'))}<input class="code" id="dc-code" inputmode="numeric" autocomplete="off" maxlength="6" value="${esc(k.code)}"></label>
        <label>${esc(this.t('roll'))}<input id="dc-roll" autocomplete="off" maxlength="12" value="${esc(k.roll)}"></label>
        <label>${esc(this.t('name'))}<input id="dc-name" autocomplete="off" maxlength="40" value="${esc(k.name)}"></label>
        <div class="dc-err">${k.inClass && k.state !== 'on' && k.err ? esc(this.statusText()) : ''}</div>
        <div class="dc-row"><button class="pri" data-a="join">${esc(this.t('joinBtn'))}</button><button data-a="close">${esc(this.t('cancel'))}</button></div>
        <p class="dc-small">${esc(this.t('privacy'))}</p>`;
    } else if (this.page === 'class') {
      h = `<h2>👥 ${esc(this.t('cls'))} ${esc(k.code)}${k.className ? ` · ${esc(k.className)}` : ''}</h2>
        <p class="dc-st ${k.state}"><i></i>${esc(this.statusText())}</p><p class="sub">${esc(this.t('roll'))}: ${esc(k.roll)}${k.name ? ` · ${esc(k.name)}` : ''}</p>
        ${k.help ? `<p style="color:#f0a65a;font-weight:700">✋ ${esc(this.t('handUp'))}</p>` : ''}
        <div class="dc-row"><button class="${k.help ? 'warn' : 'pri'}" data-a="hand">✋ ${esc(k.help ? this.t('handDown') : this.t('hand'))}</button><button data-a="quiz">📝 ${esc(this.t('quizThis'))}</button></div>
        <div class="dc-row"><button data-a="results">📊 ${esc(this.t('results'))}</button><button data-a="leave">${esc(this.t('leave'))}</button><button data-a="close">${esc(this.t('close'))}</button></div>`;
    } else if (this.page === 'results') {
      const rs = k.results.slice(-30).reverse();
      h = `<h2>📊 ${esc(this.t('results'))}</h2>${rs.length ? `<ul class="dc-list">${rs.map((r) => `<li><b>${r.kind === 'quiz' ? '📝' : '🧪'} ${esc(r.title || r.id)}</b> — ${r.kind === 'quiz' ? `${r.score}/${r.total}` : r.ok ? '✓' : `${r.done || 0}/${r.steps || 0}`}<br><small>${new Date(r.at).toLocaleString()} · ${esc(r.sent ? this.t('sentT') : this.t('keptT'))}</small></li>`).join('')}</ul>` : `<p class="sub">${esc(this.t('noResults'))}</p>`}
        <div class="dc-row"><button data-a="${k.inClass ? 'toclass' : 'close'}">‹ ${esc(this.t('back'))}</button></div>`;
    } else if (this.page === 'quiz') h = this.quizHTML(L);
    else if (this.page === 'ask') h = this.askHTML(L);
    m.innerHTML = `<div class="dc-card" role="dialog" aria-modal="true">${h}</div>`;
    if (this.page === 'ask') { const i = m.querySelector('#dc-q'); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.act('askgo'); }); if (!this._noFocus && !matchMedia('(pointer:coarse)').matches) i.focus(); const c = m.querySelector('.dc-chat'); if (c) c.scrollTop = c.scrollHeight; }
    if (this.page === 'join') { const c = m.querySelector('#dc-code'); if (!k.code) c.focus(); m.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.act('join'); })); }
  }
  quizHTML(L) {
    const z = this.quiz; if (!z) return '';
    if (z.state === 'done') {
      const s = z.score, n = z.qs.length, f = s / n; const miss = z.qs.map((q, i) => [q, z.picks[i]]).filter(([q, p]) => p !== q.right);
      return `<p class="dc-prog">📝 ${esc(this.t('quiz'))} · ${esc(tx(z.meta.title, L))}</p><p>${esc(this.t('score'))}</p><div class="dc-big">${s} / ${n}</div>
        <p style="font-weight:700">${esc(f >= 0.8 ? this.t('great') : f >= 0.5 ? this.t('good') : this.t('more'))}</p>
        ${miss.length ? `<h3 style="margin:14px 0 4px;font-size:16px">${esc(this.t('missed'))}</h3><ul class="dc-list">${miss.map(([q]) => `<li>${esc(tx(q.q, L))}<br><b style="color:#8fe08f">✓ ${esc(tx(q.opts[q.right], L))}</b></li>`).join('')}</ul>` : ''}
        <p class="dc-small">${esc(this.lastRes && this.lastRes.code ? (this.lastRes.sent ? this.t('sentT') : this.t('sentT') + ' …') : this.t('keptT'))}</p>
        <div class="dc-row"><button class="pri" data-a="qclose">${esc(this.t('done'))}</button><button data-a="qagain">↻ ${esc(this.t('again'))}</button></div>`;
    }
    const q = z.cur, sh = z.state === 'shown', p = z.picks[z.i];
    return `<p class="dc-prog">📝 ${esc(tx(z.meta.title, L))} · ${esc(this.t('qOf').replace('{i}', z.i + 1).replace('{n}', z.qs.length))}</p>
      <div class="dc-q">${esc(tx(q.q, L))}</div>
      <div class="dc-opts">${q.opts.map((o, i) => `<button class="dc-opt ${sh && i === q.right ? 'ok' : sh && i === p ? 'no' : ''}" data-a="pick" data-i="${i}" ${sh ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(tx(o, L))}</span></button>`).join('')}</div>
      <div class="dc-fb ${sh ? (p === q.right ? 'ok' : 'no') : ''}">${sh ? esc(p === q.right ? '✓ ' + this.t('right') : '✗ ' + this.t('wrong')) : ''}</div>
      <div class="dc-row"><button class="pri" data-a="qnext" ${sh ? '' : 'disabled'}>${esc(this.t('next'))} ›</button><button data-a="qclose">${esc(this.t('close'))}</button></div>`;
  }
  act(a, b) {
    const k = this.link;
    if (a === 'close') this.closePage();
    else if (a === 'join') { const c = document.querySelector('#dc-code').value.replace(/\D/g, ''), r = document.querySelector('#dc-roll').value.trim(), n = document.querySelector('#dc-name').value.trim();
      const er = document.querySelector('.dc-err'); if (c.length < 4) { er.textContent = this.t('code') + ' ?'; return; } if (!r) { er.textContent = this.t('roll') + ' ?'; return; }
      k.join(c, r, n); this.page = 'class'; this.renderPage(); }
    else if (a === 'hand') k.raiseHand();
    else if (a === 'quiz') { this.closePage(); this.startQuiz(null, 'self'); }
    else if (a === 'results') { this.page = 'results'; this.renderPage(); }
    else if (a === 'toclass') { this.page = 'class'; this.renderPage(); }
    else if (a === 'leave') { k.leave(); this.closePage(); }
    else if (a === 'pick') this.pick(+b.dataset.i);
    else if (a === 'qnext') this.qNext();
    else if (a === 'qclose') this.closeQuiz();
    else if (a === 'qagain') { const id = this.quiz && this.quiz.meta.id; this.closeQuiz(); this.startQuiz(id, 'self'); }
    else if (a === 'askgo') { const i = document.querySelector('#dc-q'); const q = i ? i.value.trim() : ''; if (q) this.ask(q); }
    else if (a === 'sg') { const sg = this._sg && this._sg[+b.dataset.i]; if (sg) this.ask(pick(sg.q, this.L()), sg.doc); }
    else if (a === 'goto') { this.closePage(); this.ad.open && this.ad.open(b.dataset.ref); }
    else if (a === 'mic') this.listen();
    else if (a === 'sayon') { this.say1 = !this.say1; cstore.set('say', this.say1); if (!this.say1 && window.speechSynthesis) speechSynthesis.cancel(); this.renderPage(); }
    this.renderChip();
  }
  // ------------------------------------------------------------ the tutor
  openAsk() { if (this.xr) { this.vrPage = 'ask'; this.ad.dirty && this.ad.dirty(); } else { this.page = 'ask'; this.renderPage(); } }
  suggestions() { const s = (this.ad.suggest && this.ad.suggest()) || []; this._sg = s; return s; }
  index() { if (!this.tIdx && this.ad.docs) this.tIdx = new TutorIndex(this.ad.docs()); return this.tIdx; }
  docById(id) { const I = this.index(); return I && I.docs.find((d) => d.id === id); }
  // the answer to a question: from the online tutor when the school has set one up, else from the app's own content
  async ask(q, docId) {
    const L = this.L(); this.chat.push({ me: true, text: q }); const here = (this.ad.here && this.ad.here()) || [];
    let doc = docId ? this.docById(docId) : null, hits = [], AL = L; // AL: the language of the answer (that of the question)
    if (!doc) { hits = this.index().search(q, L, { here, n: 5 }); const top = hits[0]; if (top && top.score > 1.2 && top.cover >= 0.4) { doc = top.doc; AL = top.lang || L; } }
    let ans = null;
    const url = cstore.get('tutorUrl', '') || this.tutorUrl || '';
    if (url && navigator.onLine !== false) {
      this.chat.push({ wait: true }); this.renderPage(); this.ad.dirty && this.ad.dirty();
      try { const ctx = (doc ? [doc] : []).concat(hits.map((h) => h.doc)).filter((d, i, a) => a.indexOf(d) === i).slice(0, 4).map((d) => `${pick(d.title, 'en')}: ${pick(d.ans, 'en')}`);
        const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q, lang: L, app: this.ad.app, here: (this.ad.status && this.ad.status().title) || '', ctx, history: this.chat.filter((c) => !c.wait).slice(-6, -1).map((c) => ({ me: !!c.me, text: c.text })) }), signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined });
        const j = r.ok ? await r.json() : null; if (j && j.answer) ans = { text: String(j.answer).slice(0, 2000), src: this.t('online') };
      } catch (e) {}
      this.chat = this.chat.filter((c) => !c.wait);
    }
    if (!ans) ans = doc ? { text: pick(doc.ans, AL), src: pick(doc.title, AL), ref: doc.ref && !here.includes(doc.ref) ? doc.ref : null } : { text: this.t('notFound'), none: true };
    this.chat.push(ans); if (this.chat.length > 24) this.chat = this.chat.slice(-24);
    if (this.link.inClass) this.link.send({ t: 'ask', q: String(q).slice(0, 300), found: !ans.none });
    this.speak(ans.text); this.renderPage(); this.ad.dirty && this.ad.dirty();
  }
  speak(text) {
    if (!this.say1 || !window.speechSynthesis || !text) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = this.L() === 'hi' ? 'hi-IN' : 'en-IN'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) {}
  }
  listen() { // the question spoken, where the browser can listen
    const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return;
    if (this.rec) { try { this.rec.stop(); } catch (e) {} this.rec = null; this.renderPage(); return; }
    const r = this.rec = new R(); r.lang = this.L() === 'en' ? 'en-IN' : 'hi-IN'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const q = e.results[0] && e.results[0][0] && e.results[0][0].transcript; this.rec = null; if (q) this.ask(q); else this.renderPage(); };
    r.onerror = r.onend = () => { if (this.rec === r) { this.rec = null; this.renderPage(); } };
    try { r.start(); } catch (e) { this.rec = null; } this.renderPage();
  }
  askHTML(L) {
    const sg = this.suggestions(); const canMic = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const msgs = this.chat.map((c) => c.me ? `<div class="me">${esc(c.text)}</div>` : c.wait ? `<div class="tu">…</div>` : `<div class="tu">${esc(c.text)}${c.src ? `<small>${esc(this.t('fromAct'))}: ${esc(c.src)}</small>` : ''}${c.ref ? `<button data-a="goto" data-ref="${esc(c.ref)}">${esc(this.t('openIt'))} ›</button>` : ''}</div>`).join('');
    return `<h2>🤖 ${esc(this.t('askT'))}</h2>${this.chat.length ? '' : `<p class="sub">${esc(this.t('askSub'))}</p>`}
      <div class="dc-chat">${msgs}</div>
      ${sg.length ? `<div class="dc-small" style="font-weight:700">${esc(this.t('tryQ'))}</div><div class="dc-sg">${sg.map((x, i) => `<button data-a="sg" data-i="${i}">${esc(pick(x.q, L))}</button>`).join('')}</div>` : ''}
      <div class="dc-askrow"><input id="dc-q" autocomplete="off" maxlength="300" placeholder="${esc(this.t('askP'))}">${canMic ? `<button data-a="mic" class="${this.rec ? 'on' : ''}" title="${esc(this.t('listen'))}">🎤</button>` : ''}<button class="pri" data-a="askgo">${esc(this.t('send'))}</button></div>
      <div class="dc-row">${window.speechSynthesis ? `<button data-a="sayon">${this.say1 ? '🔊' : '🔇'} ${esc(this.t('readAloud'))}</button>` : ''}<button data-a="close">${esc(this.t('close'))}</button></div>`;
  }
  // ------------------------------------------------------------ headset: pages drawn on the app's right-hand panel
  // the small class button, drawn by the app on its panel
  vrAsk(P, x, y, w, h) { if (this.ad.docs) P.btn('cl_ask', x, y, w, h, '🤖 ' + this.t('ask'), { size: 24, align: 'center' }); }
  vrChip(P, x, y, w, h) { const k = this.link; P.btn('cl_open', x, y, w, h, k.inClass ? `${k.help ? '✋ ' : k.state === 'on' ? '● ' : '○ '}${this.t('cls')} ${k.code}` : `👥 ${this.t('cls')}`, { size: 24, align: 'center', active: k.help, color: '#f0a65a' }); }
  // draws a class page on the panel P when one is open; returns false when the app should draw its own page
  drawVR(P, wrap) {
    const pg = this.vrPage || (this.quiz ? 'quiz' : null); if (!pg || (pg === 'quiz' && !this.quiz)) return false;
    const L = this.L(), X = P.x, k = this.link; const Wd = P.w, H = P.h;
    P.bg(pg === 'quiz' ? '#9fd17a' : '#f0a65a'); P.logo(40, 34, 40);
    const para = (txt, x, y, size, col, weight, maxW, maxL) => { X.font = `${weight} ${size}px ${FONT}`; const ls = wrap(X, txt, maxW).slice(0, maxL); ls.forEach((l, i) => P.text(l, x, y + i * size * 1.3, size, col, weight)); return y + ls.length * size * 1.3; };
    if (pg === 'join') {
      const kp = this.keypad || (this.keypad = { f: 'code', code: k.code || '', roll: k.roll || '' });
      P.text(this.t('join'), 40, 96, 40, '#f3eee6', 700); let y = para(this.t('joinSub'), 40, 150, 26, '#c9d0db', 500, Wd - 80, 2) + 14;
      for (const f of ['code', 'roll']) { const on = kp.f === f; X.fillStyle = '#0b0f17'; X.beginPath(); X.roundRect(40, y, Wd - 80, 92, 16); X.fill(); X.strokeStyle = on ? '#7fd1ff' : 'rgba(255,255,255,.2)'; X.lineWidth = on ? 4 : 2; X.stroke();
        P.text(this.t(f), 64, y + 12, 22, on ? '#7fd1ff' : '#a9b3c2', 700); P.text(kp[f] || (on ? '_' : ''), 64, y + 40, 40, '#ffffff', 700); P.buttons.push({ id: 'cl_f_' + f, x: 40, y, w: Wd - 80, h: 92 }); y += 104; }
      if (k.inClass && k.state !== 'on' && k.err) { y = para(this.statusText(), 40, y, 24, '#ff9b8a', 600, Wd - 80, 2) + 6; }
      const kw = (Wd - 80 - 4 * 14) / 5; '1234567890'.split('').forEach((d, i) => P.btn('cl_k_' + d, 40 + (i % 5) * (kw + 14), y + Math.floor(i / 5) * 104, kw, 92, d, { size: 44, weight: 700, align: 'center' })); y += 212;
      P.btn('cl_k_del', 40, y, 300, 92, '⌫', { size: 40, align: 'center' });
      P.btn('cl_k_go', 356, y, Wd - 396, 92, kp.f === 'code' ? this.t('next') + ' ›' : this.t('joinBtn'), { size: 34, weight: 800, align: 'center', active: kp.f === 'code' ? kp.code.length >= 4 : !!kp.roll });
      P.btn('cl_close', 40, H - 120, Wd - 80, 84, '‹ ' + this.t('cancel'), { size: 30, align: 'center' });
      return true;
    }
    if (pg === 'class') {
      P.text(`${this.t('cls')} ${k.code}${k.className ? ' · ' + k.className : ''}`, 40, 96, 40, '#f3eee6', 700);
      X.fillStyle = k.state === 'on' ? '#6fd16f' : '#f0a65a'; X.beginPath(); X.arc(54, 172, 11, 0, 7); X.fill();
      let y = para(this.statusText(), 76, 158, 28, '#e2dccf', 600, Wd - 120, 2) + 6; P.text(`${this.t('roll')}: ${k.roll}`, 40, y, 28, '#a9b3c2', 600); y += 56;
      if (k.help) { y = para('✋ ' + this.t('handUp'), 40, y, 28, '#f0a65a', 700, Wd - 80, 2) + 10; }
      P.btn('cl_hand', 40, y, Wd - 80, 100, '✋ ' + (k.help ? this.t('handDown') : this.t('hand')), { size: 36, weight: 700, align: 'center', active: k.help, primary: !k.help }); y += 116;
      P.btn('cl_quiz', 40, y, Wd - 80, 96, '📝 ' + this.t('quizThis'), { size: 32, align: 'center' }); y += 112;
      P.btn('cl_results', 40, y, Wd - 80, 96, '📊 ' + this.t('results'), { size: 32, align: 'center' }); y += 112;
      P.btn('cl_leave', 40, y, (Wd - 96) / 2, 90, this.t('leave'), { size: 28, align: 'center' });
      P.btn('cl_close', 56 + (Wd - 96) / 2, y, (Wd - 96) / 2, 90, '‹ ' + this.t('back'), { size: 28, align: 'center' });
      return true;
    }
    if (pg === 'results') {
      P.text('📊 ' + this.t('results'), 40, 96, 40, '#f3eee6', 700); let y = 170; const rs = k.results.slice(-9).reverse();
      if (!rs.length) para(this.t('noResults'), 40, y, 28, '#c9d0db', 500, Wd - 80, 3);
      for (const r of rs) { const sc = r.kind === 'quiz' ? `${r.score}/${r.total}` : r.ok ? '✓' : `${r.done || 0}/${r.steps || 0}`;
        X.font = `600 28px ${FONT}`; let t = `${r.kind === 'quiz' ? '📝' : '🧪'} ${r.title || r.id}`; while (X.measureText(t).width > Wd - 260 && t.length > 6) t = t.slice(0, -2);
        P.text(t, 40, y, 28, '#f3eee6', 600); P.text(sc, Wd - 190, y, 30, '#7fd1ff', 800); P.text(`${new Date(r.at).toLocaleString()} · ${r.sent ? this.t('sentT') : this.t('keptT')}`, 40, y + 38, 20, '#8f97a5', 500); y += 84; }
      P.btn(k.inClass ? 'cl_toclass' : 'cl_close', 40, H - 120, Wd - 80, 84, '‹ ' + this.t('back'), { size: 30, align: 'center' });
      return true;
    }
    if (pg === 'quiz') { this.drawQuizVR(P, wrap, para); return true; }
    if (pg === 'ask') {
      P.text('🤖 ' + this.t('askT'), 40, 96, 38, '#f3eee6', 700); let y = 158;
      const last = [...this.chat].reverse(); const a = last.find((c) => !c.me && !c.wait), q = last.find((c) => c.me);
      if (q) y = para('“' + q.text + '”', 40, y, 28, '#7fd1ff', 700, Wd - 80, 2) + 8;
      if (last[0] && last[0].wait) y = para('…', 40, y, 34, '#f3eee6', 600, Wd - 80, 1) + 8;
      else if (a) { y = para(a.text, 40, y, 27, '#f3eee6', 500, Wd - 80, 9) + 4; if (a.src) y = para(`${this.t('fromAct')}: ${a.src}`, 40, y, 22, '#8f97a5', 500, Wd - 80, 1) + 6;
        if (a.ref) { P.btn('cl_goto', 40, y, 360, 70, this.t('openIt') + ' ›', { size: 26, align: 'center', primary: true }); this._vrRef = a.ref; y += 84; } }
      else y = para(this.t('askSub'), 40, y, 28, '#c9d0db', 500, Wd - 80, 2) + 10;
      const sg = this.suggestions(); P.text(this.t('tryQ'), 40, Math.max(y + 6, 600), 24, '#a49d90', 700); let yy = Math.max(y + 44, 640);
      sg.slice(0, 5).forEach((x, i) => { if (yy + 70 > H - 120) return; P.btn('cl_sg_' + i, 40, yy, Wd - 80, 66, pick(x.q, L), { size: 25, primary: false }); yy += 76; });
      P.btn('cl_close', 40, H - 104, Wd - 80, 80, '‹ ' + this.t('back'), { size: 28, align: 'center' });
      return true;
    }
    return false;
  }
  drawQuizVR(P, wrap, para) {
    const z = this.quiz, L = this.L(), X = P.x, Wd = P.w, H = P.h;
    X.font = `700 26px ${FONT}`; let tt = `📝 ${tx(z.meta.title, L)}`; while (X.measureText(tt).width > Wd - 80 && tt.length > 6) tt = tt.slice(0, -2);
    P.text(tt, 40, 92, 26, '#9fd17a', 700); const Y = 40; // everything below sits 40 px lower than the panel's own header
    if (z.state === 'done') {
      const s = z.score, n = z.qs.length, f = s / n; P.text(this.t('score'), 40, 110 + Y, 32, '#c9d0db', 600); P.text(`${s} / ${n}`, 40, 150 + Y, 96, '#7fd1ff', 800);
      let y = para(f >= 0.8 ? this.t('great') : f >= 0.5 ? this.t('good') : this.t('more'), 40, 270 + Y, 32, '#f3eee6', 700, Wd - 80, 2) + 16;
      const miss = z.qs.map((q, i) => [q, z.picks[i]]).filter(([q, p]) => p !== q.right);
      if (miss.length) { P.text(this.t('missed'), 40, y, 26, '#a49d90', 700); y += 40;
        for (const [q] of miss) { if (y > H - 300) break; y = para(tx(q.q, L).replace(/\n/g, ' '), 40, y, 24, '#e2dccf', 500, Wd - 80, 2); y = para('✓ ' + tx(q.opts[q.right], L), 40, y + 2, 24, '#8fe08f', 700, Wd - 80, 2) + 14; } }
      P.btn('cl_qclose', 40, H - 130, (Wd - 96) / 2, 94, this.t('done'), { size: 34, weight: 700, align: 'center', primary: true });
      P.btn('cl_qagain', 56 + (Wd - 96) / 2, H - 130, (Wd - 96) / 2, 94, '↻ ' + this.t('again'), { size: 30, align: 'center' });
      return;
    }
    const q = z.cur, sh = z.state === 'shown', p = z.picks[z.i];
    P.text(this.t('qOf').replace('{i}', z.i + 1).replace('{n}', z.qs.length), 40, 96 + Y, 26, '#7fd1ff', 700);
    for (let i = 0; i < z.qs.length; i++) { X.fillStyle = i < z.i ? '#7fd1ff' : i === z.i ? '#f3eee6' : 'rgba(255,255,255,.18)'; X.fillRect(Wd - 40 - (z.qs.length - i) * 34, 104 + Y, 26, 10); }
    // the question, then the choices (each choice wraps to as many lines as it needs; the size shrinks to fit)
    const bottom = H - 140; let fs = 30, qs = 33, lay;
    for (let tries = 0; tries < 6; tries++) {
      X.font = `700 ${qs}px ${FONT}`; const ql = wrap(X, tx(q.q, L), Wd - 80).slice(0, 7); X.font = `500 ${fs}px ${FONT}`;
      const ol = q.opts.map((o) => wrap(X, tx(o, L), Wd - 80 - 90).slice(0, 5)); const qh = ql.length * qs * 1.28;
      const oh = ol.map((ls) => Math.max(84, ls.length * fs * 1.28 + 28)); const tot = 150 + Y + qh + 20 + oh.reduce((a, b) => a + b + 14, 0);
      lay = { ql, ol, qh, oh }; if (tot <= bottom - 10) break; fs -= 2; qs -= 2;
    }
    lay.ql.forEach((l, i) => P.text(l, 40, 146 + Y + i * qs * 1.28, qs, '#f3eee6', 700));
    let y = 146 + Y + lay.qh + 20;
    q.opts.forEach((o, i) => { const h = lay.oh[i]; const ok = sh && i === q.right, no = sh && i === p && p !== q.right;
      X.fillStyle = ok ? 'rgba(111,209,111,0.28)' : no ? 'rgba(255,122,106,0.24)' : 'rgba(255,255,255,0.075)'; X.beginPath(); X.roundRect(40, y, Wd - 80, h, 18); X.fill();
      if (ok || no) { X.strokeStyle = ok ? '#6fd16f' : '#ff7a6a'; X.lineWidth = 4; X.stroke(); }
      X.fillStyle = 'rgba(255,255,255,0.14)'; X.beginPath(); X.arc(80, y + h / 2, 24, 0, 7); X.fill(); X.font = `800 26px ${FONT}`; X.fillStyle = '#f3eee6'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText('ABCD'[i], 80, y + h / 2 + 1); X.textAlign = 'left';
      const ls = lay.ol[i]; const ty = y + h / 2 - (ls.length * fs * 1.28) / 2 + 2; ls.forEach((l, j) => P.text(l, 124, ty + j * fs * 1.28, fs, '#f3eee6', 500));
      if (!sh) P.buttons.push({ id: 'cl_pick_' + i, x: 40, y, w: Wd - 80, h }); y += h + 14; });
    if (sh) P.text(p === q.right ? '✓ ' + this.t('right') : '✗ ' + this.t('wrong'), 40, bottom - 4, 26, p === q.right ? '#8fe08f' : '#ffb0a5', 700);
    P.btn('cl_qclose', 40, H - 104, 300, 80, '✕ ' + this.t('close'), { size: 28, align: 'center' });
    P.btn('cl_qnext', 356, H - 104, Wd - 396, 80, this.t('next') + ' ›', { size: 32, weight: 800, align: 'center', primary: sh, active: false });
  }
  vrClick(id) {
    if (!id.startsWith('cl_')) return false; const k = this.link; const a = id.slice(3);
    if (a === 'open') { this.vrPage = k.inClass ? 'class' : 'join'; if (!k.inClass) this.keypad = { f: 'code', code: k.code || '', roll: k.roll || '' }; }
    else if (a === 'close') this.vrPage = null;
    else if (a.startsWith('f_')) this.keypad.f = a.slice(2);
    else if (a.startsWith('k_')) { const kp = this.keypad, d = a.slice(2); if (!kp) return true;
      if (d === 'del') kp[kp.f] = kp[kp.f].slice(0, -1);
      else if (d === 'go') { if (kp.f === 'code') { if (kp.code.length >= 4) kp.f = 'roll'; } else if (kp.roll && kp.code.length >= 4) { k.join(kp.code, kp.roll, k.name); this.vrPage = 'class'; } }
      else if (kp[kp.f].length < (kp.f === 'code' ? 6 : 8)) kp[kp.f] += d; }
    else if (a === 'hand') k.raiseHand();
    else if (a === 'quiz') { this.vrPage = null; this.startQuiz(null, 'self'); }
    else if (a === 'results') this.vrPage = 'results';
    else if (a === 'toclass') this.vrPage = 'class';
    else if (a === 'leave') { k.leave(); this.vrPage = null; }
    else if (a.startsWith('pick_')) this.pick(+a.slice(5));
    else if (a === 'qnext') this.qNext();
    else if (a === 'qclose') this.closeQuiz();
    else if (a === 'qagain') { const qid = this.quiz && this.quiz.meta.id; this.closeQuiz(); this.startQuiz(qid, 'self'); }
    else if (a === 'ask') this.vrPage = 'ask';
    else if (a.startsWith('sg_')) { const sg = this._sg && this._sg[+a.slice(3)]; if (sg) this.ask(pick(sg.q, this.L()), sg.doc); }
    else if (a === 'goto') { const r = this._vrRef; this.vrPage = null; if (r) this.ad.open && this.ad.open(r); }
    this.renderChip(); this.ad.dirty && this.ad.dirty(); return true;
  }
  // ------------------------------------------------------------ every frame: the link, and in the headset the "eyes on me" screen and messages
  frame(dt) {
    this.link.frame();
    if (!this.ad.renderer || !this.ad.scene) return;
    const xr = this.xr, f = !!this.link.frozen, nt = this.note && performance.now() < this.note.until ? this.note : null;
    if (!xr || (!f && !nt)) { if (this.hud) this.hud.g.visible = false; return; }
    const H = this.hud || this.makeHud();
    const key = f ? 'f|' + this.link.frozen.msg + '|' + this.L() : 'n|' + nt.text;
    if (H.key !== key) { H.key = key; this.drawHud(f, nt); }
    H.g.visible = true; H.dark.visible = f;
    const cam = this.ad.renderer.xr.getCamera(); const p = new THREE.Vector3(), q = new THREE.Quaternion(); cam.matrixWorld.decompose(p, q, new THREE.Vector3());
    const fw = new THREE.Vector3(0, 0, -1).applyQuaternion(q); fw.y = 0; if (fw.lengthSq() < 1e-4) fw.set(0, 0, -1); fw.normalize();
    const goal = p.clone().addScaledVector(fw, f ? 1.15 : 1.0); goal.y = p.y - (f ? 0.02 : 0.18);
    if (!H.placed || H.card.position.distanceTo(goal) > 0.5) { H.card.position.copy(goal); H.placed = true; } else H.card.position.lerp(goal, Math.min(1, dt * 3));
    H.card.lookAt(p.x, H.card.position.y, p.z); H.dark.position.copy(p);
  }
  makeHud() {
    const g = new THREE.Group(); g.name = 'class-hud';
    const dark = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0x05080c, transparent: true, opacity: 0.93, side: THREE.BackSide, depthTest: false, depthWrite: false }));
    dark.renderOrder = 990; dark.frustumCulled = false;
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    card.renderOrder = 995; card.frustumCulled = false; dark.userData.noHit = card.userData.noHit = true;
    g.add(dark, card); this.ad.scene.add(g); this.hud = { g, dark, card, c, tex, key: '' }; return this.hud;
  }
  drawHud(f, nt) {
    const H = this.hud, X = H.c.getContext('2d'), L = this.L(); X.clearRect(0, 0, 1024, 512);
    X.fillStyle = f ? 'rgba(20,26,36,0.97)' : 'rgba(20,26,36,0.95)'; X.beginPath(); X.roundRect(8, 8, 1008, 496, 36); X.fill(); X.strokeStyle = f ? '#f0a65a' : '#7fd1ff'; X.lineWidth = 8; X.stroke();
    const lines = (t, y, size, col, w = 700, max = 3) => { X.font = `${w} ${size}px ${FONT}`; X.fillStyle = col; X.textAlign = 'center'; X.textBaseline = 'top'; const ws = String(t).split(' '); const out = []; let cur = '';
      for (const wd of ws) { const tt = cur ? cur + ' ' + wd : wd; if (X.measureText(tt).width > 920 && cur) { out.push(cur); cur = wd; } else cur = tt; } out.push(cur);
      out.slice(0, max).forEach((l, i) => X.fillText(l, 512, y + i * size * 1.25)); return y + Math.min(max, out.length) * size * 1.25; };
    if (f) { let y = lines('👀', 40, 90, '#fff'); y = lines(tx(W.eyes, L), y + 4, 58, '#f3eee6'); if (this.link.frozen.msg) y = lines(this.link.frozen.msg, y + 10, 38, '#f0a65a', 700, 2); lines(tx(W.eyesSub, L), y + 14, 28, '#b9c0cc', 500, 2); }
    else { let y = 50; if (nt.from) y = lines(tx(W.fromT, L).toUpperCase(), y, 26, '#7fd1ff', 800); lines(`${nt.icon} ${nt.text}`, y + 18, 40, '#f3eee6', 700, 6); }
    H.tex.needsUpdate = true;
  }
}
export { cstore };
