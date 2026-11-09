// Screen UI (experiment list, step card, lab notebook) and the matching headset panels.
import * as THREE from 'three';
import { T, tx, LANGS, LANG_LABEL, FONT } from './strings.js';
import { Panel, wrap } from './vrpanels.js';
import { EXPERIMENTS, classGroups, classOrder as order0, hasSubject, subjOf } from './experiments.js';
import { PHOTOS } from './photos.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const classOrder = (c, sub) => order0(c, sub);
const SUBJECTS = ['chemistry', 'physics', 'maths', 'biology', 'astronomy', 'robotics', 'nature'];
const store = { get(k) { try { return localStorage.getItem('sl360.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('sl360.' + k, v); } catch (e) {} } };
const CLASSES = [6, 7, 8, 9, 10];
void EXPERIMENTS;

export class UI {
  constructor(app) {
    this.app = app; this.subj = store.get('subj') || 'chemistry'; if (!hasSubject(this.subj)) this.subj = 'chemistry'; this.cls = +(store.get('cls') || 0) || 0; this.nbOpen = false; this.done = new Set((store.get('done') || '').split(',').filter(Boolean));
    this.buildDOM();
    // headset panels
    this.menu = new Panel(1000, 1400, 0.46); this.story = new Panel(1100, 1150, 0.52);
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
    $('#classes').onclick = (e) => { const b = e.target.closest('button'); if (b) this.setClass(+b.dataset.c); };
    $('#cp-btns').onclick = (e) => { const b = e.target.closest('button'); if (b) this.setClass(+b.dataset.c); }; $('#cp-all').onclick = () => this.setClass(0);
    $('#prog').onclick = (e) => { if (e.target.closest('button')) this.showPicker(true); };
    $('#story').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.dataset.act === 'start') this.startClass(); else if (b.dataset.act === 'nextexp') this.nextExp(); });
    $('#explist').onclick = (e) => { const b = e.target.closest('button'); if (b) a.openExp(b.dataset.id); };
    $('#b-do').onclick = () => a.primary(); $('#b-next').onclick = () => (a.runner.state === 'finished' ? this.nextExp() : a.runner.next()); $('#b-back').onclick = () => a.runner.prev();
    $('#b-auto').onclick = () => (a.runner.auto ? a.runner.pause() : a.runner.play()); $('#b-reset').onclick = () => a.runner.reset();
    $('#b-speed').onclick = () => a.cycleSpeed(); $('#b-nb').onclick = () => { this.nbOpen = !this.nbOpen; document.body.classList.toggle('nb-open', this.nbOpen); this.renderNotebook(); };
    $('#b-voice').onclick = () => a.toggleVoice(); $('#b-menu').onclick = () => document.body.classList.toggle('list-open');
    $('#notebook').onclick = (e) => { const b = e.target.closest('.ans'); if (b) b.classList.add('show'); };
    this.renderAll();
  }
  renderSubjects() { $('#subjects').innerHTML = SUBJECTS.map((s) => { const ok = hasSubject(s); return `<button data-sub="${s}" class="${s === this.subj ? 'on' : ok ? '' : 'off'}" ${ok ? '' : 'aria-disabled="true"'}>${esc(this.t(s))}</button>`; }).join(''); }
  // the subject (chemistry, physics …) whose experiments are listed
  setSubject(s) { if (!hasSubject(s)) return; this.subj = s; store.set('subj', s); this.page = 0; this.renderSubjects(); this.renderPicker(); this.renderList(); this.renderStory(); this.dirty = true; const e = this.app.runner.exp; if (e && subjOf(e) !== s) { const f = this.classLeft(this.cls)[0] || classOrder(this.cls, s)[0]; if (f) this.app.openExp(f.id); } }
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2600); }
  renderAll() { this.renderTop(); this.renderPicker(); this.renderList(); this.renderStory(); this.renderNotebook(); this.dirty = true; }
  // ------------------------------------------------------------ class-wise flow: pick your class, do its experiments in book order
  showPicker(on) { document.body.classList.toggle('pick', on); if (on) this.renderPicker(); }
  setClass(c) { this.cls = c; store.set('cls', String(c)); this.page = 0; this.showPicker(false); this.renderList(); this.renderStory(); this.dirty = true; }
  markDone(id) { if (this.done.has(id)) return; this.done.add(id); store.set('done', [...this.done].join(',')); this.renderList(); }
  classLeft(c) { return classOrder(c, this.subj).filter((e) => !this.done.has(e.id)); }
  startClass() { const o = classOrder(this.cls, this.subj); const e = this.classLeft(this.cls)[0] || o[0]; if (e) this.app.openExp(e.id); }
  nextExp() {
    const a = this.app, cur = a.runner.exp; const c = this.cls || (cur && cur.cls) || 0; const o = classOrder(c, this.subj); const i = cur ? o.indexOf(cur) : -1;
    const nx = o.slice(i + 1).find((e) => !this.done.has(e.id)) || o.find((e) => !this.done.has(e.id) && e !== cur) || o[i + 1];
    if (nx) a.openExp(nx.id); else this.toast(this.fill('classDone', c));
  }
  fill(k, c, n) { return this.t(k).replace('{c}', c).replace('{n}', n ?? '').replace('{s}', this.t(this.subj)); }
  renderPicker() {
    $('#cp-h').textContent = this.t('pickClass'); $('#cp-sub').textContent = this.t('pickClassSub'); $('#cp-all').textContent = this.t('allClasses');
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
    const cs = [0, ...CLASSES]; const c = this.cls;
    $('#classes').innerHTML = cs.map((k) => `<button data-c="${k}" class="${k === c ? 'on' : ''}">${k ? k : this.t('all')}</button>`).join('');
    $('#list-h').textContent = c ? `${this.t('cls')} ${c} · ${this.t(this.subj)}` : this.t('experiments');
    const cur = this.app.runner.exp?.id; const order = classOrder(c, this.subj); const d = order.filter((e) => this.done.has(e.id)).length;
    $('#prog').innerHTML = `<span>${d}/${order.length} ${esc(this.t('doneW'))}</span><span class="bar"><i style="width:${order.length ? Math.round((100 * d) / order.length) : 0}%"></i></span><button>${esc(this.t('changeClass'))}</button>`;
    const btn = (e) => `<button data-id="${e.id}" class="ebtn ${e.id === cur ? 'on' : ''}"><span class="cl ${this.done.has(e.id) ? 'ok' : ''}">${this.done.has(e.id) ? '✓' : e.cls}</span><span>${esc(this.app.expText(e, 'title'))}<small>${esc(this.app.expText(e, 'kind'))}</small></span></button>`;
    $('#explist').innerHTML = (c ? classGroups(c, this.subj).map((g) => `<h5 class="chh">${esc(g.key ? this.app.expText(g.items[0], 'ch') : this.t('otherClasses'))}</h5>${g.items.map(btn).join('')}`).join('') : order.map(btn).join(''))
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
      h = `<p class="fin">✓ ${esc(this.t('finished'))}</p>${this.app.hasParticles(e.id) ? `<p class="hint">🔬 ${esc(this.t('insideHint'))}</p>` : ''}<p><b>${esc(this.t('obs'))}:</b> ${esc(r.text('result.obs', L))}</p><p><b>${esc(this.t('concl'))}:</b> ${esc(r.text('result.concl', L))}</p><p class="eq">${esc(e.eq.sym)}</p>`;
      const c = this.cls || e.cls; if (!this.classLeft(c).length) h += `<p class="fin">🎉 ${esc(this.fill('classDone', c))}</p>`;
    } else if (s) {
      h = `<p class="stepn">${esc(this.t('step'))} ${r.i + 1} ${esc(this.t('of'))} ${n}</p><p><b>${esc(this.t('doLabel'))}:</b> ${esc(r.text(`steps.${r.i}.do`, L))}</p>`;
      if (r.state === 'done' || r.state === 'finished') {
        if (s.see) h += `<p class="see"><b>${esc(this.t('seeLabel'))}:</b> ${esc(r.text(`steps.${r.i}.see`, L))}</p>`;
        if (s.why) h += `<p class="why"><b>${esc(this.t('whyLabel'))}:</b> ${esc(r.text(`steps.${r.i}.why`, L))}</p>`;
      } else if (r.state === 'todo') h += `<p class="hint">${esc(this.t('tapHint'))}</p>`;
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
      <h4>${esc(this.t('eq'))}</h4><p>${esc(r.text('eq.word', L) || e.eq.word)}</p><p class="eq">${esc(e.eq.sym)}</p>
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
  drawVR() {
    const a = this.app, r = a.runner, L = this.L();
    // menu
    const P = this.menu; P.bg('#f0a65a'); P.logo(40, 34, 40); P.text(this.t('appTitle') + ' · ' + this.t(this.subj) + (this.cls ? ` · ${this.t('cls')} ${this.cls}` : ''), 40, 92, 40, '#f3eee6', 700);
    SUBJECTS.filter((x) => hasSubject(x)).forEach((x, i, arr) => P.btn('sub_' + x, 960 - (arr.length - i) * 214, 18, 200, 58, this.t(x), { size: 26, align: 'center', active: this.subj === x })); // subject tabs, top right
    const cs = [0, 6, 7, 8, 9, 10]; cs.forEach((c, i) => P.btn('cls_' + c, 40 + i * 152, 160, 140, 70, c ? `${c}` : this.t('all'), { size: 30, align: 'center', active: this.cls === c }));
    const list = classOrder(this.cls, this.subj); const per = 8; const dn = list.filter((e) => this.done.has(e.id)).length; P.text(`${dn}/${list.length} ${this.t('doneW')}`, 760, 92, 30, '#9fd17a', 700); const pages = Math.max(1, Math.ceil(list.length / per)); this.page = Math.min(this.page, pages - 1);
    list.slice(this.page * per, this.page * per + per).forEach((e, i) => P.btn('exp_' + e.id, 40, 256 + i * 112, 920, 100, `${this.done.has(e.id) ? '✓' : e.cls} · ${a.expText(e, 'title')}`, { size: 30, active: r.exp?.id === e.id }));
    if (pages > 1) { P.btn('pg_prev', 40, 1160, 300, 80, '‹', { size: 40, align: 'center' }); P.text(`${this.page + 1} / ${pages}`, 440, 1178, 34, '#a49d90', 600); P.btn('pg_next', 660, 1160, 300, 80, '›', { size: 40, align: 'center' }); }
    LANGS.forEach((l, i) => P.btn('lang_' + l, 40 + i * 236, 1270, 222, 84, LANG_LABEL[l], { size: 30, align: 'center', active: L === l, color: '#f3eee6' }));
    P.btn('voice', 748, 1270, 212, 84, (a.audio.voice ? '🔊 ' : '🔇 ') + this.t('voice'), { size: 26, align: 'center' });
    P.commit();
    // story
    const S = this.story; S.bg('#7fd1ff'); S.logo(40, 34, 40);
    const e = r.exp; const X = S.x;
    if (!e) { S.text(this.t('pickExp'), 40, 110, 46, '#f3eee6', 700); X.font = `500 32px ${FONT}`; const wl = wrap(X, this.cls ? this.fill('classWelcome', this.cls, classOrder(this.cls, this.subj).length) : this.t('welcome'), 1000); wl.forEach((l, i) => S.text(l, 40, 190 + i * 46, 32, '#e2dccf', 500)); if (this.cls) S.btn('start', 40, 220 + wl.length * 46, 400, 90, '▶ ' + this.t('startW'), { size: 34, align: 'center', primary: true }); S.commit(); return; }
    S.text(`${this.t('cls')} ${e.cls} · ${a.expText(e, 'kind')}`, 40, 96, 28, '#7fd1ff', 700);
    X.font = `700 44px ${FONT}`; const tl = wrap(X, a.expText(e, 'title'), 1020).slice(0, 2); tl.forEach((l, i) => S.text(l, 40, 140 + i * 54, 44, '#f3eee6', 700));
    let y = 150 + tl.length * 54 + 10; const s = r.step();
    const para = (label, txt, col) => { if (!txt) return; X.font = `500 32px ${FONT}`; const lines = wrap(X, `${label}: ${txt}`, 1010); lines.slice(0, 6).forEach((l, i) => { S.text(l, 40, y + i * 44, 32, i === 0 && col ? col : '#e2dccf', 500); }); y += Math.min(6, lines.length) * 44 + 14; };
    if (r.state === 'finished') { S.text('✓ ' + this.t('finished'), 40, y, 34, '#9fd17a', 700); y += 60; para(this.t('concl'), r.text('result.concl', L)); S.text(e.eq.sym, 40, y, 30, '#f0a65a', 700); y += 50; }
    else if (s) {
      S.text(`${this.t('step')} ${r.i + 1} ${this.t('of')} ${e.steps.length}`, 40, y, 28, '#a49d90', 600); y += 46;
      para(this.t('doLabel'), r.text(`steps.${r.i}.do`, L), '#f3eee6');
      if (r.state === 'done') { para(this.t('seeLabel'), r.text(`steps.${r.i}.see`, L), '#9fd17a'); para(this.t('whyLabel'), r.text(`steps.${r.i}.why`, L), '#7fd1ff'); }
      else if (r.state === 'todo') para('➜', this.t('vrHint'));
    }
    if (a.lapseShown) S.text(`⏩ ${this.t('timelapse')} ×${a.lapseShown}`, 40, 860, 30, '#f0a65a', 700);
    const by = 920, n = e.steps.length; for (let i = 0; i < n; i++) { X.fillStyle = i < r.i || r.done.has(i) ? '#7fd1ff' : 'rgba(255,255,255,0.15)'; X.fillRect(40 + i * (1020 / n), 900, 1020 / n - 8, 8); }
    S.btn('back', 40, by, 250, 90, '‹ ' + this.t('back'), { size: 30, align: 'center' });
    const inside = r.state === 'finished' && a.hasParticles(e.id); const pv = a.particles && a.particles.g.visible;
    S.btn('do', 305, by, 490, 90, inside ? (pv ? '✕ ' + this.t('closeView') : '🔬 ' + this.t('inside')) : r.state === 'done' ? this.t('next') + ' ›' : r.state === 'doing' ? this.t('doing') : '▶ ' + this.t('doIt'), { size: 34, align: 'center', primary: true });
    S.btn('next', 810, by, 250, 90, (r.state === 'finished' ? this.t('nextExp') : this.t('next')) + ' ›', { size: r.state === 'finished' ? 24 : 30, align: 'center', primary: r.state === 'finished' && !inside });
    S.btn('auto', 40, by + 110, 330, 80, r.auto ? '❚❚ ' + this.t('pause') : '▶▶ ' + this.t('autoplay'), { size: 28, align: 'center', active: r.auto });
    S.btn('speed', 385, by + 110, 280, 80, `${this.t('speed')} ${a.speed}×`, { size: 28, align: 'center' });
    S.btn('reset', 680, by + 110, 380, 80, '↺ ' + this.t('reset'), { size: 28, align: 'center' });
    S.commit();
  }
  vrClick(id) {
    const a = this.app, r = a.runner;
    if (id.startsWith('sub_')) { this.setSubject(id.slice(4)); }
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
