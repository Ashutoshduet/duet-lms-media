// Screen UI (experiment list, step card, lab notebook) and the matching headset panels.
import * as THREE from 'three';
import { T, tx, LANGS, LANG_LABEL, FONT } from './strings.js';
import { Panel, wrap } from './vrpanels.js';
import { EXPERIMENTS, classGroups, classOrder as order0, hasSubject, subjOf } from './experiments.js';
import { PHOTOS } from './photos.js';
import { topicGroups } from './topics.js';
import { licenceInfo, licText } from './licence.js';
import { SOLIDS, SUBS } from './chem.js';
import { expectFor } from './chemcheck.js';
import { DICT } from './exp_i18n.js';
const symText = (e, L) => (DICT[e.eq.sym] && DICT[e.eq.sym][L]) || e.eq.sym; // equation lines with words are translated

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const classOrder = (c, sub) => order0(c, sub);
const SUBJECTS = ['chemistry', 'physics', 'maths', 'biology', 'astronomy', 'robotics', 'nature'];
const store = { get(k) { try { return localStorage.getItem('sl360.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('sl360.' + k, v); } catch (e) {} } };
const CLASSES = [6, 7, 8, 9, 10];
const YOURS = { en: 'Your result was different from the book', hi: 'आपका नतीजा किताब से अलग आया', hg: 'Aapka result kitaab se alag aaya' };
const HOWMUCH = { en: 'How much', hi: 'कितना डालना है', hg: 'Kitna daalna hai' };
const INBOOK = { en: 'In the book', hi: 'किताब में', hg: 'Kitaab mein' };
void EXPERIMENTS;

export class UI {
  constructor(app) {
    this.app = app; this.subj = store.get('subj') || 'chemistry'; if (!hasSubject(this.subj)) this.subj = hasSubject('chemistry') ? 'chemistry' : 'maths'; this.cls = +(store.get('cls') || 0) || 0; this.view = store.get('view') === 'topic' ? 'topic' : 'class'; this.topic = null; this.nbOpen = false; this.done = new Set((store.get('done') || '').split(',').filter(Boolean));
    this.buildDOM();
    // headset panels
    this.menu = new Panel(1000, 1490, 0.51); this.story = new Panel(1100, 1150, 0.58); // a little bigger than before: easier to read in the headset
    this.vr = new THREE.Group(); this.vr.add(this.menu.mesh, this.story.mesh); this.vr.visible = false; app.scene.add(this.vr);
    this.page = 0; this.dirty = true;
  }
  L() { return this.app.lang; } t(k) { return tx(T[k], this.L()); }
  // ------------------------------------------------------------ DOM
  buildDOM() {
    const a = this.app;
    this.renderSubjects();
    $('#subjects').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (hasSubject(b.dataset.sub)) this.setSubject(b.dataset.sub); else this.toast(`${this.t(b.dataset.sub)} — ${this.t('soon')}`); };
    $('#langs').innerHTML = LANGS.map((l) => `<button data-l="${l}"><span class="lf">${LANG_LABEL[l]}</span><span class="ls">${{ en: 'EN', hi: 'हि', hg: 'HG' }[l]}</span></button>`).join('');
    $('#langs').onclick = (e) => { const b = e.target.closest('button'); if (b) a.setLang(b.dataset.l); };
    $('#classes').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.c === 't') this.setView('topic'); else this.setClass(+b.dataset.c); };
    $('#cp-btns').onclick = (e) => { const b = e.target.closest('button'); if (b) this.setClass(+b.dataset.c); }; $('#cp-all').onclick = () => this.setClass(0); $('#cp-top').onclick = () => { this.showPicker(false); this.setView('topic'); };
    $('#prog').onclick = (e) => { if (e.target.closest('button')) this.showPicker(true); };
    $('#story').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'start') this.startClass(); else if (b.dataset.act === 'nextexp') this.nextExp(); });
    $('#explist').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.code) a.askCode(null); else a.openExp(b.dataset.id); };
    $('#b-do').onclick = () => a.primary(); $('#b-next').onclick = () => (a.runner.state === 'finished' ? this.nextExp() : a.runner.next()); $('#b-back').onclick = () => a.runner.prev();
    $('#b-auto').onclick = () => (a.runner.auto ? a.runner.pause() : a.runner.play()); $('#b-reset').onclick = () => a.runner.reset();
    $('#b-speed').onclick = () => a.cycleSpeed(); $('#b-nb').onclick = () => { this.nbOpen = !this.nbOpen; document.body.classList.toggle('nb-open', this.nbOpen); this.renderNotebook(); };
    $('#b-voice').onclick = () => a.toggleVoice(); $('#b-menu').onclick = () => document.body.classList.toggle('list-open');
    $('#notebook').onclick = (e) => { const b = e.target.closest('.ans'); if (b) b.classList.add('show'); };
    this.renderAll();
  }
  renderSubjects() { $('#subjects').innerHTML = SUBJECTS.map((s) => { const ok = hasSubject(s); return `<button data-sub="${s}" class="${s === this.subj ? 'on' : ok ? '' : 'off'}" ${ok ? '' : 'aria-disabled="true"'}>${esc(this.t(s))}</button>`; }).join(''); }
  // the subject (chemistry, physics …) whose experiments are listed
  setSubject(s) { if (!hasSubject(s)) return; this.subj = s; store.set('subj', s); this.page = 0; this.topic = null; this.renderSubjects(); this.renderPicker(); this.renderList(); this.renderStory(); this.dirty = true; const e = this.app.runner.exp; if (e && subjOf(e) !== s) { const f = this.classLeft(this.cls)[0] || classOrder(this.cls, s)[0]; if (f) this.app.openExp(f.id); } }
  toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => { t.classList.remove('show'); this.dirty = true; }, ms);
    this._toast = { msg, until: performance.now() + ms }; this.dirty = true; } // also shown on the panel in VR
  renderAll() { this.renderTop(); this.renderPicker(); this.renderList(); this.renderStory(); this.renderNotebook(); this.dirty = true; }
  // ------------------------------------------------------------ class-wise flow: pick your class, do its experiments in book order
  showPicker(on) { document.body.classList.toggle('pick', on); if (on) this.renderPicker(); }
  // two ways to look at the list: class-wise (your class, in book order) or topic-wise (all classes, grouped by what they are about)
  setView(v) { this.view = v; store.set('view', v); this.topic = null; this.page = 0; this.renderList(); this.dirty = true; }
  setTopic(k) { this.topic = k; this.page = 0; this.dirty = true; }
  badge(e) { return this.app.isLocked && this.app.isLocked(e.id) ? '🔒' : this.done.has(e.id) ? '✓' : e.id.startsWith('open_') ? '★' : e.cls; }
  setClass(c) { this.view = 'class'; store.set('view', 'class'); this.topic = null; this.cls = c; store.set('cls', String(c)); this.page = 0; this.showPicker(false); this.renderList(); this.renderStory(); this.dirty = true; }
  markDone(id) { if (this.done.has(id)) return; this.done.add(id); store.set('done', [...this.done].join(',')); this.renderList(); }
  classLeft(c) { return classOrder(c, this.subj).filter((e) => !this.done.has(e.id)); }
  startClass() { const o = classOrder(this.cls, this.subj); const e = this.classLeft(this.cls)[0] || o[0]; if (e) this.app.openExp(e.id); }
  nextExp() {
    const a = this.app, cur = a.runner.exp; const c = this.cls || (cur && cur.cls) || 0; let o = classOrder(c, this.subj);
    if (this.view === 'topic') { const gs = topicGroups(this.subj); const g = gs.find((x) => x.k === this.topic) || gs.find((x) => cur && x.items.includes(cur)); o = g ? [...g.items, ...gs.flatMap((x) => x.items).filter((e) => !g.items.includes(e))] : gs.flatMap((x) => x.items); } // topic-wise: the rest of this topic first
    const i = cur ? o.indexOf(cur) : -1;
    const nx = o.slice(i + 1).find((e) => !this.done.has(e.id)) || o.find((e) => !this.done.has(e.id) && e !== cur) || o[i + 1];
    if (nx) a.openExp(nx.id); else this.toast(this.fill('classDone', c));
  }
  fill(k, c, n) { return this.t(k).replace('{c}', c).replace('{n}', n ?? '').replace('{s}', this.t(this.subj)); }
  renderPicker() {
    $('#cp-h').textContent = this.t('pickClass'); $('#cp-sub').textContent = this.t('pickClassSub'); $('#cp-all').textContent = this.t('allClasses'); $('#cp-top').textContent = this.t('byTopic');
    const li = licenceInfo('science'); const L = this.L(); $('#cp-lic').textContent = li ? `${{ en: 'DUET STEM subscription', hi: 'DUET STEM सब्सक्रिप्शन', hg: 'DUET STEM subscription' }[L]}${li.name ? ' · ' + li.name : ''} · ${((d) => ({ en: `valid until ${d}`, hi: `${d} तक मान्य`, hg: `${d} tak valid` }[L]))(new Date(li.until).toLocaleDateString(L === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}` : '';
    $('#cp-btns').innerHTML = CLASSES.map((c) => { const n = classOrder(c, this.subj).length, d = n - this.classLeft(c).length; return `<button data-c="${c}">${c}<small>${esc(this.t('cls'))} ${c} · ${d ? `${d}/${n} ✓` : `${n}`}</small></button>`; }).join('');
  }
  renderTop() {
    const L = this.L(); document.documentElement.lang = L === 'hi' ? 'hi' : 'en';
    $('#title').textContent = this.t('appTitle');
    document.querySelectorAll('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.l === L));
    this.renderSubjects();
    $('#b-voice').classList.toggle('off', !this.app.audio.voice); $('#b-voice').title = this.t('voice');
    $('#xr-btn').textContent = this.t('enterVR');
  }
  renderList() {
    const cs = [0, ...CLASSES]; const c = this.cls; const tv = this.view === 'topic';
    $('#classes').innerHTML = `<button data-c="t" class="tp ${tv ? 'on' : ''}">${esc(this.t('topics'))}</button>` + cs.map((k) => `<button data-c="${k}" class="${!tv && k === c ? 'on' : ''}">${k ? k : this.t('all')}</button>`).join('');
    $('#list-h').textContent = tv ? `${this.t('topics')} · ${this.t(this.subj)}` : c ? `${this.t('cls')} ${c} · ${this.t(this.subj)}` : this.t('experiments');
    const cur = this.app.runner.exp?.id; const order = tv ? classOrder(0, this.subj) : classOrder(c, this.subj); const d = order.filter((e) => this.done.has(e.id)).length;
    $('#prog').innerHTML = `<span>${d}/${order.length} ${esc(this.t('doneW'))}</span><span class="bar"><i style="width:${order.length ? Math.round((100 * d) / order.length) : 0}%"></i></span><button>${esc(this.t('changeClass'))}</button>`;
    const btn = (e) => `<button data-id="${e.id}" class="ebtn ${e.id === cur ? 'on' : ''}"><span class="cl ${this.done.has(e.id) ? 'ok' : ''}">${this.badge(e)}</span><span>${esc(this.app.expText(e, 'title'))}<small>${esc(this.app.expText(e, 'kind'))}</small></span></button>`;
    const codeBtn = this.app.demo ? `<button class="ebtn codebtn" data-code="1"><span class="cl">🔑</span><span>${esc({ en: 'Free demo · Enter your DUET STEM code', hi: 'मुफ़्त डेमो · अपना DUET STEM कोड डालिए', hg: 'Free demo · Apna DUET STEM code daaliye' }[this.L()])}<small>${esc({ en: 'Unlocks every experiment', hi: 'सारे प्रयोग खुल जाते हैं', hg: 'Saare experiments khul jaate hain' }[this.L()])}</small></span></button>` : '';
    $('#explist').innerHTML = codeBtn + (tv ? topicGroups(this.subj).map((g) => `<h5 class="chh">${esc(tx(g.n, this.L()))} · ${g.items.length}</h5>${g.items.map(btn).join('')}`).join('') : c ? classGroups(c, this.subj).map((g) => `<h5 class="chh">${esc(g.key ? this.app.expText(g.items[0], 'ch') : this.t('otherClasses'))}</h5>${g.items.map(btn).join('')}`).join('') : order.map(btn).join(''))
      || `<p class="empty">${esc(this.t('soon'))}</p>`;
    this.dirty = true;
  }
  renderStory() {
    const r = this.app.runner, L = this.L(), e = r.exp;
    const card = $('#story');
    if (!e) { card.classList.add('intro'); $('#s-kicker').textContent = 'DUET STEM'; $('#s-title').textContent = this.t('appTitle') + ' · ' + this.t(this.subj) + (this.cls ? ` · ${this.t('cls')} ${this.cls}` : ''); $('#s-text').innerHTML = this.cls ? `<p>${esc(this.fill('classWelcome', this.cls, classOrder(this.cls, this.subj).length))}</p><button class="cbtn primary" data-act="start">▶ ${esc(this.t('startW'))}</button>` : `<p>${esc(this.t('welcome'))}</p>`; $('#s-buttons').style.display = 'none'; $('#s-dots').innerHTML = ''; return; }
    card.classList.remove('intro'); $('#s-buttons').style.display = '';
    const s = r.step(); const n = e.steps.length;
    $('#s-kicker').textContent = `${this.t('cls')} ${e.cls} · ${this.app.expText(e, 'ch')}`;
    $('#s-title').textContent = this.app.expText(e, 'title');
    let h = '';
    if (r.state === 'finished') {
      const okF = r.incomplete().ok; h = (okF ? `<p class="fin">✓ ${esc(this.t('finished'))}</p>` : `<p class="see"><b>⚠ ${esc(this.incompleteText())}</b></p>`) + `${this.app.hasParticles(e.id) ? `<p class="hint">🔬 ${esc(this.t('insideHint'))}</p>` : ''}${this.diffs().length ? `<p class="see"><b>⚠ ${esc(tx(YOURS, L))}:</b></p>${this.diffs().map(([k, t]) => `<p class="see">${esc(this.t('step'))} ${k + 1}: ${esc(t)}</p>`).join('')}<p><b>${esc(tx(INBOOK, L))}:</b> ${esc(r.baseText('result.obs', L))} ${esc(r.baseText('result.concl', L))}</p>` : `<p><b>${esc(this.t('obs'))}:</b> ${esc(r.text('result.obs', L))}</p><p><b>${esc(this.t('concl'))}:</b> ${esc(r.text('result.concl', L))}</p>`}<p class="eq">${esc(symText(e, L))}</p>`;
      const c = this.cls || e.cls; if (okF && !this.classLeft(c).length) h += `<p class="fin">🎉 ${esc(this.fill('classDone', c))}</p>`;
    } else if (s) {
      h = `<p class="stepn">${esc(this.t('step'))} ${r.i + 1} ${esc(this.t('of'))} ${n}</p><p><b>${esc(this.t('doLabel'))}:</b> ${esc(r.text(`steps.${r.i}.do`, L))}</p>`;
      if (r.state === 'done' || r.state === 'finished') {
        if (s.see) h += `<p class="see"><b>${esc(this.t('seeLabel'))}:</b> ${esc(r.text(`steps.${r.i}.see`, L))}</p>`;
        if (s.why) h += `<p class="why"><b>${esc(this.t('whyLabel'))}:</b> ${esc(r.text(`steps.${r.i}.why`, L))}</p>`;
      } else if (r.state === 'todo' && r.res && r.res[r.i]) h += `<p class="see"><b>⚠ ${esc(this.t('stepOpen'))}</b></p><p class="see"><b>${esc(this.t('seeLabel'))}:</b> ${esc(r.text(`steps.${r.i}.see`, L))}</p><p class="why"><b>${esc(this.t('whyLabel'))}:</b> ${esc(r.text(`steps.${r.i}.why`, L))}</p>`;
      else if (r.state === 'todo') h += `<p class="hint">${esc(this.t('tapHint'))}</p>`;
      if (r.state === 'todo' || r.state === 'doing') { const am = this.amounts(); if (am.length) h += `<p class="amt"><b>${esc(tx(HOWMUCH, L))}:</b> ${am.map(esc).join('<br>')}</p>`; const lp = this.lightHint(); if (lp) h += `<p class="hint">🔥 ${esc(lp)}</p>`; }
      else if (r.state === 'doing') h += `<p class="hint">${esc(this.t('doing'))}</p>`;
    }
    if (this.app.lapseShown) h += `<p class="lapse">⏩ ${esc(this.t('timelapse'))} ×${this.app.lapseShown}</p>`;
    $('#s-text').innerHTML = h;
    const inside = r.state === 'finished' && this.app.hasParticles(e.id); const pv = this.app.particles && this.app.particles.g.visible;
    $('#b-do').textContent = inside ? (pv ? '✕ ' + this.t('closeView') : '🔬 ' + this.t('inside')) : r.state === 'done' ? this.t('next') + ' ›' : '▶ ' + this.t('doIt');
    $('#b-do').disabled = r.state === 'doing' || (r.state === 'finished' && !inside);
    $('#b-next').textContent = (r.state === 'finished' ? this.t('nextExp') : this.t('next')) + ' ›'; $('#b-next').classList.toggle('primary', r.state === 'finished' && !inside); $('#b-back').textContent = '‹ ' + this.t('back');
    $('#b-auto').textContent = r.auto ? '❚❚ ' + this.t('pause') : '▶▶ ' + this.t('autoplay'); $('#b-auto').classList.toggle('on', r.auto);
    $('#b-reset').textContent = '↺'; $('#b-reset').title = this.t('reset'); $('#b-speed').textContent = `${this.app.speed}×`; $('#b-speed').title = this.t('speed'); $('#b-nb').textContent = '📒 ' + this.t('notebook');
    $('#s-dots').innerHTML = e.steps.map((_, i) => `<i class="${i < r.i || r.done.has(i) ? 'on' : ''} ${i === r.i ? 'cur' : ''}"></i>`).join('');
    this.dirty = true;
  }
  renderNotebook() {
    const r = this.app.runner, e = r.exp, L = this.L(); const nb = $('#notebook');
    if (!e) { nb.innerHTML = ''; return; }
    const items = r.app.lab.items.filter((i) => i.name && i.kind !== 'rack').map((i) => tx(i.name, L));
    const uniq = [...new Set(items)];
    const rows = e.steps.map((s, i) => (r.done.has(i) && s.see ? `<tr><td>${i + 1}</td><td>${esc(r.text(`steps.${i}.do`, L))}</td><td>${esc(r.text(`steps.${i}.see`, L))}</td></tr>` : '')).join('');
    nb.innerHTML = `<h3>${esc(this.t('notebook'))}</h3>
      <h4>${esc(this.t('aim'))}</h4><p>${esc(r.text('aim', L))}</p>
      <h4>${esc(this.t('needs'))}</h4><p>${esc(uniq.join(' · '))}</p>
      ${(PHOTOS[e.id] || []).length ? `<h4>${esc(this.t('realPhoto'))}</h4><div class="prods">${PHOTOS[e.id].map((p) => `<figure class="ph"><img src="${p.f}" alt="" loading="lazy"><figcaption>${esc(p.cap[L] || p.cap.en)}</figcaption></figure>`).join('')}</div>` : ''}
      <h4>${esc(this.t('obs'))}</h4><table><tbody>${rows || `<tr><td colspan="3" class="mute">—</td></tr>`}</tbody></table>
      <h4>${esc(this.t('eq'))}</h4><p>${esc(r.text('eq.word', L) || e.eq.word)}</p><p class="eq">${esc(symText(e, L))}</p>
      ${r.state === 'finished' ? `<h4>${esc(this.t('concl'))}</h4><p>${esc(r.text('result.concl', L))}</p>` : ''}
      <h4>${esc(this.t('safety'))}</h4><p>${esc(r.text('result.safety', L))}</p>
      <h4>${esc(this.t('viva'))}</h4>${e.result.viva.map((v, i) => `<div class="q"><p>${i + 1}. ${esc(r.text(`result.viva.${i}.q`, L))}</p><button class="ans">${esc(this.t('showAns'))}<span>${esc(r.text(`result.viva.${i}.a`, L))}</span></button></div>`).join('')}`;
  }
  // ------------------------------------------------------------ headset panels
  layoutVR() { // left menu and right step card, angled towards the student, beside the bench
    const y = 1.36; // beside the bench, a little above it, turned towards the student
    this.menu.mesh.position.set(-0.8, y, -0.6); this.menu.mesh.rotation.set(-0.1, 0.62, 0, 'YXZ');
    this.story.mesh.position.set(0.8, y, -0.6); this.story.mesh.rotation.set(-0.1, -0.62, 0, 'YXZ');
  }
  // the two headset panels are redrawn one per call (one canvas upload per frame); returns true when both are done
  drawVR(part) {
    const a = this.app, r = a.runner, L = this.L();
    if (part !== 'story' && this._next !== 'story') {
    // menu
    const P = this.menu; P.bg('#f0a65a'); P.logo(40, 34, 40); const tv = this.view === 'topic';
    const head = `${this.t(this.subj)} · ${tv ? this.t('topics') : this.cls ? `${this.t('cls')} ${this.cls}` : this.t('all')}`; P.x.font = `700 40px ${FONT}`; const hs = Math.max(26, Math.min(40, (40 * 640) / Math.max(1, P.x.measureText(head).width))); P.text(head, 40, 92 + (40 - hs) / 2, hs, '#f3eee6', 700);
    SUBJECTS.filter((x) => hasSubject(x)).forEach((x, i, arr) => P.btn('sub_' + x, 960 - (arr.length - i) * 214, 18, 200, 58, this.t(x), { size: 26, align: 'center', active: this.subj === x })); // subject tabs, top right
    // class-wise (Topics | All | 6 … 10) or topic-wise: pick a topic, then its experiments from every class
    P.btn('view_topic', 40, 160, 160, 70, this.t('topics'), { size: 26, align: 'center', active: tv });
    [0, 6, 7, 8, 9, 10].forEach((c, i) => P.btn('cls_' + c, 212 + i * 125, 160, 113, 70, c ? `${c}` : this.t('all'), { size: 28, align: 'center', active: !tv && this.cls === c }));
    const gs = tv ? topicGroups(this.subj) : null; const g = gs ? gs.find((x) => x.k === this.topic) || null : null;
    const pool = tv ? (g ? g.items : gs.flatMap((x) => x.items)) : classOrder(this.cls, this.subj);
    const dn = pool.filter((e) => this.done.has(e.id)).length; const dl = `${dn}/${pool.length} ${this.t('doneW')}`; P.x.font = `700 30px ${FONT}`; P.text(dl, 960 - P.x.measureText(dl).width, 98, 30, '#9fd17a', 700);
    let rows, per = 10, y0 = 256;
    if (tv && !g) rows = gs.map((x) => ({ id: 'top_' + x.k, label: `${tx(x.n, L)}  ·  ${x.items.filter((e) => this.done.has(e.id)).length}/${x.items.length}` }));
    else { if (g) { P.btn('top_back', 40, 256, 920, 72, `‹ ${this.t('topics')} · ${tx(g.n, L)}`, { size: 28, primary: true }); y0 = 340; per = 9; }
      rows = pool.map((e) => ({ id: 'exp_' + e.id, label: `${this.badge(e)} · ${a.expText(e, 'title')}`, on: r.exp?.id === e.id })); }
    const pages = Math.max(1, Math.ceil(rows.length / per)); this.page = Math.min(this.page, pages - 1);
    rows.slice(this.page * per, this.page * per + per).forEach((x, k) => P.btn(x.id, 40, y0 + k * 90, 920, 82, x.label, { size: 28, active: x.on }));
    if (pages > 1) { P.btn('pg_prev', 40, 1160, 300, 80, '‹', { size: 40, align: 'center' }); P.text(`${this.page + 1} / ${pages}`, 440, 1178, 34, '#a49d90', 600); P.btn('pg_next', 660, 1160, 300, 80, '›', { size: 40, align: 'center' }); }
    LANGS.forEach((l, i) => P.btn('lang_' + l, 40 + i * 236, 1270, 222, 84, LANG_LABEL[l], { size: 30, align: 'center', active: L === l, color: '#f3eee6' }));
    P.btn('voice', 748, 1270, 212, 84, (a.audio.voice ? '🔊 ' : '🔇 ') + this.t('voice'), { size: 26, align: 'center' });
    // eye height in the headset: lower / raise the view, or let it set itself
    const eh = a.renderer.xr.isPresenting ? a.eyeY() : 0; const HL = { en: 'Eye height', hi: 'आँखों की ऊँचाई', hg: 'Aankhon ki height' };
    const AR = !!a.canAR; // a headset that can show the real room: one more button, to switch between VR and AR (passthrough)
    P.btn('hgt_dn', 40, 1376, AR ? 110 : 150, 84, '▼', { size: 34, align: 'center' });
    P.x.font = `600 ${AR ? 22 : 26}px ${FONT}`; const hl = `${HL[L] || HL.en} ${eh ? eh.toFixed(2) + (L === 'hi' ? ' मी' : ' m') : ''}`; P.text(hl, (AR ? 285 : 350) - P.x.measureText(hl).width / 2, AR ? 1406 : 1404, AR ? 22 : 26, '#e2dccf', 600);
    P.btn('hgt_up', AR ? 420 : 510, 1376, AR ? 110 : 150, 84, '▲', { size: 34, align: 'center' });
    P.btn('hgt_auto', AR ? 546 : 676, 1376, AR ? 214 : 284, 84, { en: 'Auto height', hi: 'ऊँचाई अपने-आप', hg: 'Auto height' }[L] || 'Auto height', { size: AR ? 22 : 26, align: 'center', active: a._hgtAuto });
    if (AR) P.btn('xr_switch', 776, 1376, 184, 84, a.ar ? 'VR' : 'AR', { size: 30, align: 'center', primary: true });
    P.commit(); this._next = 'story'; return false;
    }
    this._next = 'menu';
    if (a.codeVR) { this.drawCodeVR(); return true; }
    // story
    const S = this.story; S.bg('#7fd1ff'); S.logo(40, 34, 40);
    const e = r.exp; const X = S.x;
    if (!e) { S.text(this.t('pickExp'), 40, 110, 46, '#f3eee6', 700); X.font = `500 32px ${FONT}`; const wl = wrap(X, this.cls ? this.fill('classWelcome', this.cls, classOrder(this.cls, this.subj).length) : this.t('welcome'), 1000); wl.forEach((l, i) => S.text(l, 40, 190 + i * 46, 32, '#e2dccf', 500)); if (this.cls) S.btn('start', 40, 220 + wl.length * 46, 400, 90, '▶ ' + this.t('startW'), { size: 34, align: 'center', primary: true }); if (a.demo) S.btn('code', 40, 960, 1020, 110, '🔑 ' + licText('enter', L), { size: 32, align: 'center', primary: true }); S.commit(); return; }
    S.text(`${this.t('cls')} ${e.cls} · ${a.expText(e, 'kind')}`, 40, 96, 28, '#7fd1ff', 700);
    X.font = `700 44px ${FONT}`; const tl = wrap(X, a.expText(e, 'title'), 1020).slice(0, 2); tl.forEach((l, i) => S.text(l, 40, 140 + i * 54, 44, '#f3eee6', 700));
    let y = 150 + tl.length * 54 + 10; const s = r.step();
    const para = (label, txt, col) => { if (!txt) return; X.font = `500 32px ${FONT}`; const lines = wrap(X, `${label}: ${txt}`, 1010); lines.slice(0, 6).forEach((l, i) => { S.text(l, 40, y + i * 44, 32, i === 0 && col ? col : '#e2dccf', 500); }); y += Math.min(6, lines.length) * 44 + 14; };
    if (r.state === 'finished') { if (r.incomplete().ok) { S.text('✓ ' + this.t('finished'), 40, y, 34, '#9fd17a', 700); y += 60; } else para('⚠', this.incompleteText(), '#f0a65a');
      const dif = this.diffs(); // what the student actually got, when it was not the book's result
      if (dif.length) { S.text('⚠ ' + tx(YOURS, L), 40, y, 30, '#f0a65a', 700); y += 44; dif.slice(0, 2).forEach(([k, t]) => para(`${this.t('step')} ${k + 1}`, t, '#f6c08a')); para(tx(INBOOK, L), r.baseText('result.concl', L)); }
      else para(this.t('concl'), r.text('result.concl', L));
      S.text(symText(e, L), 40, y, 30, '#f0a65a', 700); y += 50; }
    else if (s) {
      S.text(`${this.t('step')} ${r.i + 1} ${this.t('of')} ${e.steps.length}`, 40, y, 28, '#a49d90', 600); y += 46;
      para(this.t('doLabel'), r.text(`steps.${r.i}.do`, L), '#f3eee6');
      if (r.state === 'done') { para(this.t('seeLabel'), r.text(`steps.${r.i}.see`, L), '#9fd17a'); para(this.t('whyLabel'), r.text(`steps.${r.i}.why`, L), '#7fd1ff'); }
      else if (r.state === 'todo' && r.res && r.res[r.i]) { para('⚠', this.t('stepOpen'), '#f0a65a'); para(this.t('seeLabel'), r.text(`steps.${r.i}.see`, L), '#f6c08a'); para(this.t('whyLabel'), r.text(`steps.${r.i}.why`, L), '#7fd1ff'); }
      const lp = this.lightHint(true); const am = this.amounts();
      if (r.state === 'todo' && !lp && !am.length) para('➜', this.t('vrHint'));
      if (am.length) { S.text(tx(HOWMUCH, L), 40, y, 26, '#f0a65a', 700); y += 36; X.font = `600 29px ${FONT}`; for (const l of am) for (const w of wrap(X, '• ' + l, 1010).slice(0, 2)) { S.text(w, 40, y, 29, '#f6e3c8', 600); y += 40; } y += 8; }
      if (lp) para('🔥', lp, '#f6e3c8');
    }
    const st = this.solStatus(); if (st.length) { // is it dissolving? said plainly for every vessel with a solid in it
      const y0 = Math.max(y + 4, 880 - st.length * 38 - 34); S.text({ en: 'In the vessels', hi: 'बर्तनों में', hg: 'Bartanon mein' }[L] || 'In the vessels', 40, y0, 24, '#a49d90', 700);
      st.forEach((l, i) => { X.font = `600 25px ${FONT}`; let t = l.t; while (X.measureText(t).width > 1015 && t.length > 8) t = t.slice(0, -2); S.text(t === l.t ? t : t + '…', 40, y0 + 32 + i * 38, 25, l.c, 600); });
    }
    if (a.lapseShown) S.text(`⏩ ${this.t('timelapse')} ×${a.lapseShown}`, 40, 860, 30, '#f0a65a', 700);
    if (this._toast && performance.now() < this._toast.until) { // a message (an accident explained, a different result) inside the headset too
      X.font = `600 28px ${FONT}`; const tl = wrap(X, this._toast.msg, 960).slice(0, 4); const h = 30 + tl.length * 38, y0 = 885 - h;
      X.fillStyle = 'rgba(24,18,10,0.94)'; X.fillRect(30, y0, 1040, h); X.strokeStyle = '#f0a65a'; X.lineWidth = 4; X.strokeRect(30, y0, 1040, h);
      tl.forEach((l, i) => S.text(l, 56, y0 + 14 + i * 38, 28, '#f6e3c8', 600));
    }
    const by = 920, n = e.steps.length; for (let i = 0; i < n; i++) { X.fillStyle = i < r.i || r.done.has(i) ? '#7fd1ff' : 'rgba(255,255,255,0.15)'; X.fillRect(40 + i * (1020 / n), 900, 1020 / n - 8, 8); }
    S.btn('back', 40, by, 250, 90, '‹ ' + this.t('back'), { size: 30, align: 'center' });
    const inside = r.state === 'finished' && a.hasParticles(e.id); const pv = a.particles && a.particles.g.visible;
    S.btn('do', 305, by, 490, 90, inside ? (pv ? '✕ ' + this.t('closeView') : '🔬 ' + this.t('inside')) : r.state === 'done' ? this.t('next') + ' ›' : r.state === 'doing' ? this.t('doing') : '▶ ' + this.t('doIt'), { size: 34, align: 'center', primary: true });
    S.btn('next', 810, by, 250, 90, (r.state === 'finished' ? this.t('nextExp') : this.t('next')) + ' ›', { size: r.state === 'finished' ? 24 : 30, align: 'center', primary: r.state === 'finished' && !inside });
    S.btn('auto', 40, by + 110, 330, 80, r.auto ? '❚❚ ' + this.t('pause') : '▶▶ ' + this.t('autoplay'), { size: 28, align: 'center', active: r.auto });
    S.btn('speed', 385, by + 110, 280, 80, `${this.t('speed')} ${a.speed}×`, { size: 28, align: 'center' });
    S.btn('reset', 680, by + 110, 380, 80, '↺ ' + this.t('reset'), { size: 28, align: 'center' });
    S.commit(); return true;
  }
  amounts() { // how much goes in at this step, worked out from the method itself (chem_expect.json): mL, drops or a spoonful, and the level now
    const r = this.app.runner, e = r.exp, L = this.L(); if (!e || !r.o || (r.state !== 'todo' && r.state !== 'doing')) return [];
    const E = expectFor(e.id); const cur = E && E.s && E.s[r.i]; if (!cur) return []; const prev = r.i === 0 ? E.b : E.s[r.i - 1]; const out = [];
    const nm = (o) => (o && (o[L] || o.en)) || ''; const fmt = (x) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
    const POW = ['sugar', 'salt', 'chalk', 'sand', 'na2co3', 'nahco3', 'nh4cl', 'soil', 'alum', 'cuso4x', 'feso4x', 'cuso4d', 'cuso4i', 'pbno3s', 'kis', 'bacl2s', 'spow', 'cupow', 'cuo', 'filings', 'femix'];
    for (const k in cur) {
      const a = (prev && prev[k]) || { i: {}, s: [] }, b = cur[k], v = r.o[k]; if (!v || !v.mix) continue; const parts = [];
      for (const sub in b.i) { const d = b.i[sub] - ((a.i && a.i[sub]) || 0); if (d <= 0.04 || !SUBS[sub]) continue; const sn = nm(SUBS[sub].n);
        if (d < 0.9) { const n = Math.max(1, Math.round(d / 0.05)); parts.push({ en: `${n} drop${n > 1 ? 's' : ''} of ${sn}`, hi: `${sn} की ${n} बूँद${n > 1 ? 'ें' : ''}`, hg: `${sn} ki ${n} boond${n > 1 ? 'ein' : ''}` }[L]); }
        else parts.push({ en: `${fmt(d)} mL of ${sn}`, hi: `${sn} ${fmt(d)} mL`, hg: `${sn} ${fmt(d)} mL` }[L]); }
      for (const c of (b.s || []).filter((x) => !(a.s || []).includes(x))) { const sn = nm(SOLIDS[c] && SOLIDS[c].n); parts.push(POW.includes(c) ? { en: `1 spoonful of ${sn}`, hi: `1 चम्मच ${sn}`, hg: `1 chammach ${sn}` }[L] : sn); }
      if (!parts.length) continue;
      const vn = `${nm(v.name).replace(/\s*[(（].*?[)）]/g, '')}${v.tag ? ' ' + v.tag : ''}`; const now = fmt(v.ml), goal = fmt(b.ml);
      const lvl = b.ml > 0.3 && Math.abs(b.ml - (a.ml || 0)) > 0.04 ? `  (${{ en: 'now', hi: 'अभी', hg: 'abhi' }[L]} ${now} mL → ${{ en: 'about', hi: 'लगभग', hg: 'lagbhag' }[L]} ${goal} mL)` : '';
      out.push(`${vn}: ${parts.join(' + ')}${lvl}`);
    }
    return out.slice(0, 3);
  }
  lightHint(short) { // the step lights a lamp or burner: how to do it in the headset (one trigger, or with a match yourself)
    const r = this.app.runner; const t = r.state === 'todo' && r.target && r.target(); if (!t || !t.setLit || t.lit) return '';
    if (short) return { en: 'To light it: point at the burner and pull the trigger (a match lights it). Or strike a match yourself: trigger on the matchbox, trigger again at the box, hold the flame at the top.', hi: 'जलाने के लिए: बर्नर पर पॉइंट करके ट्रिगर दबाइए (माचिस की तीली उसे जला देगी)। या ख़ुद तीली जलाइए: माचिस पर ट्रिगर, फिर डिब्बी के पास ट्रिगर, और लौ को ऊपर रखिए।', hg: 'Jalane ke liye: burner par point karke trigger dabaiye (maachis ki teeli use jala degi). Ya khud teeli jalaiye: maachis par trigger, phir dibbi ke paas trigger, aur flame ko upar rakhiye.' }[this.L()] || '';
    return { en: 'To light it: point at the burner or lamp and pull the trigger: a match from the box lights it. To do it all yourself: point at the matchbox and pull the trigger to take a match, pull the trigger again with the match at the box to strike it (or rub it fast along the brown side), then hold the flame at the wick / top of the burner.',
      hi: 'जलाने के लिए: बर्नर या लैंप पर पॉइंट करके ट्रिगर दबाइए — डिब्बी की एक तीली उसे जला देगी। सब कुछ ख़ुद करना हो तो: माचिस की डिब्बी पर पॉइंट करके ट्रिगर दबाइए — एक तीली हाथ में आ जाएगी; तीली को डिब्बी के पास लाकर फिर ट्रिगर दबाइए (या भूरी पट्टी पर तेज़ी से रगड़िए) — तीली जल उठेगी; अब लौ को बत्ती / बर्नर के मुँह पर रखिए।',
      hg: 'Jalane ke liye: burner ya lamp par point karke trigger dabaiye — dibbi ki ek teeli use jala degi. Sab kuch khud karna ho to: maachis ki dibbi par point karke trigger dabaiye — ek teeli haath mein aa jaayegi; teeli ko dibbi ke paas laakar phir trigger dabaiye (ya brown patti par tezi se ragadiye) — teeli jal uthegi; ab flame ko batti / burner ke munh par rakhiye.' }[this.L()] || '';
  }
  incompleteText() { // which steps were skipped or came out differently
    const L = this.L(); const inc = this.app.runner.incomplete(); const n = (a) => a.map((i) => i + 1).join(', ');
    const parts = [];
    if (inc.skipped.length) parts.push({ en: `step ${n(inc.skipped)} not done`, hi: `स्टेप ${n(inc.skipped)} नहीं किया गया`, hg: `step ${n(inc.skipped)} nahi kiya gaya` }[L]);
    if (inc.differ.length) parts.push({ en: `step ${n(inc.differ)} not done as in the method`, hi: `स्टेप ${n(inc.differ)} विधि के हिसाब से नहीं हुआ`, hg: `step ${n(inc.differ)} method ke hisaab se nahi hua` }[L]);
    const go = { en: 'Press ‹ Back to do them.', hi: 'उन्हें करने के लिए ‹ पीछे दबाइए।', hg: 'Unhe karne ke liye ‹ Back dabaiye.' }[L];
    return `${this.t('notComplete')}: ${parts.join('; ')}. ${go}`;
  }
  diffs() { // [[step index, what the student saw]] for every step whose result differed from the method
    const r = this.app.runner, L = this.L(); const out = [];
    for (const k in r.res || {}) { const x = r.res[k]; if (x && x.ok === false && x.see) out.push([+k, typeof x.see === 'string' ? x.see : x.see[L] || x.see.en]); }
    return out.sort((a, b) => a[0] - b[0]);
  }
  solStatus() { // [{ t, c }]: per vessel and solid — dissolving (how much is left), dissolved, saturated, or not dissolving
    const L = this.L(); const out = []; const W = {
      ing: { en: 'dissolving — {p}% left', hi: 'घुल रहा है — {p}% बचा है', hg: 'ghul raha hai — {p}% bacha hai' },
      done: { en: 'dissolved completely — the solution is clear', hi: 'पूरा घुल गया — घोल साफ़ है', hg: 'poora ghul gaya — solution saaf hai' },
      sat: { en: 'no more dissolves — the solution is saturated', hi: 'अब और नहीं घुलता — घोल सैचुरेटेड (संतृप्त) है', hg: 'ab aur nahi ghulta — solution saturated hai' },
      milky: { en: 'does not dissolve — the water has turned milky', hi: 'नहीं घुलता — पानी दूधिया हो गया', hg: 'nahi ghulta — paani doodhiya ho gaya' },
      settle: { en: 'does not dissolve — it settles at the bottom', hi: 'नहीं घुलता — नीचे तली में बैठ जाता है', hg: 'nahi ghulta — neeche tali mein baith jaata hai' },
    };
    for (const v of this.app.lab.vessels) {
      if (!v.solLog) continue; const vn = `${((v.name && (v.name[L] || v.name.en)) || '').replace(/\s*[(（].*?[)）]/g, '')}${v.tag ? ' ' + v.tag : ''}`;
      for (const ch in v.solLog) {
        const e = v.solLog[ch]; const sn = (SOLIDS[ch] && SOLIDS[ch].n && (SOLIDS[ch].n[L] || SOLIDS[ch].n.en)) || ch; let k, c;
        if (e.dis) { if (e.sat) { k = 'sat'; c = '#f0a65a'; } else if (e.left > 0.02) { k = 'ing'; c = '#7fd1ff'; } else { k = 'done'; c = '#9fd17a'; } }
        else { k = (v.mix && v.mix.cloud > 0.12) ? 'milky' : 'settle'; c = '#f6c08a'; }
        out.push({ t: `${vn} · ${sn}: ${(W[k][L] || W[k].en).replace('{p}', Math.max(1, Math.round((e.left || 0) * 100)))}`, c });
      }
    }
    return out.slice(0, 4);
  }
  drawCodeVR() { // the subscription code typed in the headset: a keypad of the code's letters (no I, L, O, U)
    const a = this.app, c = a.codeVR, L = this.L(); const S = this.story, X = S.x; S.bg('#f0a65a'); S.logo(40, 34, 40);
    X.font = `700 40px ${FONT}`; const tl = wrap(X, licText('title', L), 1020).slice(0, 2); tl.forEach((l, i) => S.text(l, 40, 100 + i * 50, 40, '#f3eee6', 700));
    let y = 108 + tl.length * 50; X.font = `500 27px ${FONT}`;
    wrap(X, licText(c.locked ? 'locked' : 'sub', L), 1020).slice(0, 3).forEach((l) => { S.text(l, 40, y, 27, '#c9d0db', 500); y += 36; });
    const box = Math.max(y + 12, 290); X.fillStyle = '#0b0f17'; X.beginPath(); X.roundRect(40, box, 1020, 96, 18); X.fill(); X.strokeStyle = c.cls === 'e' ? '#ff9b8a' : c.cls === 'k' ? '#9fd17a' : '#f0a65a'; X.lineWidth = 4; X.stroke();
    const g = (c.code + '\u2007'.repeat(12)).slice(0, 12); const shown = 'DUET-' + [0, 4, 8].map((i) => [...g.slice(i, i + 4)].map((ch) => (ch === '\u2007' ? '·' : ch)).join('')).join('-');
    X.font = `700 50px ${FONT}`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillStyle = c.code ? '#ffffff' : 'rgba(255,255,255,0.45)'; X.fillText(shown, 550, box + 50); X.textAlign = 'left';
    const msg = c.msg || (c.exp && !c.code ? licText('exp', L, { d: c.exp }) : licText('key', L)); X.font = `600 27px ${FONT}`;
    S.text(wrap(X, msg, 1020)[0], 40, box + 108, 27, c.cls === 'e' || (c.exp && !c.code && !c.msg) ? '#ff9b8a' : c.cls === 'k' ? '#9fd17a' : '#a9b3c2', 600);
    const K = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; const k0 = box + 152, kw = 117, kh = 88, gap = 12;
    [...K].forEach((ch, i) => S.btn('ck_' + ch, 40 + (i % 8) * (kw + gap - 1.7), k0 + Math.floor(i / 8) * (kh + 10), kw, kh, ch, { size: 40, weight: 700, align: 'center' }));
    const r2 = k0 + 4 * (kh + 10) + 6;
    S.btn('ck_del', 40, r2, 250, 92, '⌫', { size: 40, align: 'center' });
    S.btn('ck_go', 305, r2, 755, 92, c.busy ? licText('wait', L) : licText('btn', L), { size: 36, weight: 800, align: 'center', active: c.code.length >= 8 && !c.busy });
    S.btn('ck_demo', 40, r2 + 104, 1020, Math.min(92, 1140 - (r2 + 104)), c.locked ? '‹ ' + licText('back', L) : licText('demo', L), { size: 30, align: 'center', primary: !c.locked });
    S.commit();
  }
  vrClick(id) {
    const a = this.app, r = a.runner;
    if (id.startsWith('ck_')) { a.codeKey(id.slice(3)); this.dirty = true; return; }
    if (id === 'code') { a.askCode(null); this.dirty = true; return; }
    if (id === 'hgt_dn' || id === 'hgt_up') { a.setHeight((a.hgt || 0) + (id === 'hgt_up' ? 0.05 : -0.05)); setTimeout(() => { this.dirty = true; }, 150); return; }
    if (id === 'xr_switch') { a.switchXR(); return; }
    if (id === 'hgt_auto') { try { localStorage.removeItem('sl360.hgt'); } catch (e) {} a._hgtAuto = true; a.autoHeight(); setTimeout(() => { this.dirty = true; }, 150); return; }
    if (id.startsWith('sub_')) { this.setSubject(id.slice(4)); }
    else if (id === 'view_topic') this.setView('topic'); else if (id === 'top_back') { this.topic = null; this.page = 0; } else if (id.startsWith('top_')) this.setTopic(id.slice(4));
    else if (id.startsWith('cls_')) { this.setClass(+id.slice(4)); }
    else if (id === 'start') this.startClass();
    else if (id.startsWith('exp_')) a.openExp(id.slice(4));
    else if (id === 'pg_prev') this.page = Math.max(0, this.page - 1); else if (id === 'pg_next') this.page++;
    else if (id.startsWith('lang_')) a.setLang(id.slice(5)); else if (id === 'voice') a.toggleVoice();
    else if (id === 'do') a.primary(); else if (id === 'next') (r.state === 'finished' ? this.nextExp() : r.next()); else if (id === 'back') r.prev();
    else if (id === 'auto') (r.auto ? r.pause() : r.play()); else if (id === 'speed') a.cycleSpeed(); else if (id === 'reset') r.reset();
    this.dirty = true;
  }
}
