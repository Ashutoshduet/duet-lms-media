// Screen UI (experiment list, step card, lab notebook) and the matching headset panels.
import * as THREE from 'three';
import { T, tx, LANGS, LANG_LABEL, FONT } from './strings.js';
import { Panel, wrap } from './vrpanels.js';
import { EXPERIMENTS } from './experiments.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const SUBJECTS = ['chemistry', 'physics', 'maths', 'biology', 'astronomy', 'robotics', 'nature'];

export class UI {
  constructor(app) {
    this.app = app; this.cls = 0; this.nbOpen = false;
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
    $('#subjects').innerHTML = SUBJECTS.map((s) => `<button data-sub="${s}" class="${s === 'chemistry' ? 'on' : 'off'}" ${s === 'chemistry' ? '' : 'aria-disabled="true"'}>${esc(this.t(s))}</button>`).join('');
    $('#subjects').onclick = (e) => { const b = e.target.closest('button'); if (b && b.dataset.sub !== 'chemistry') this.toast(`${this.t(b.dataset.sub)} — ${this.t('soon')}`); };
    $('#langs').innerHTML = LANGS.map((l) => `<button data-l="${l}"><span class="lf">${LANG_LABEL[l]}</span><span class="ls">${{ en: 'EN', hi: 'हि', hg: 'HG' }[l]}</span></button>`).join('');
    $('#langs').onclick = (e) => { const b = e.target.closest('button'); if (b) a.setLang(b.dataset.l); };
    $('#classes').onclick = (e) => { const b = e.target.closest('button'); if (b) { this.cls = +b.dataset.c; this.renderList(); } };
    $('#explist').onclick = (e) => { const b = e.target.closest('button'); if (b) a.openExp(b.dataset.id); };
    $('#b-do').onclick = () => a.primary(); $('#b-next').onclick = () => a.runner.next(); $('#b-back').onclick = () => a.runner.prev();
    $('#b-auto').onclick = () => (a.runner.auto ? a.runner.pause() : a.runner.play()); $('#b-reset').onclick = () => a.runner.reset();
    $('#b-speed').onclick = () => a.cycleSpeed(); $('#b-nb').onclick = () => { this.nbOpen = !this.nbOpen; document.body.classList.toggle('nb-open', this.nbOpen); this.renderNotebook(); };
    $('#b-voice').onclick = () => a.toggleVoice(); $('#b-menu').onclick = () => document.body.classList.toggle('list-open');
    $('#notebook').onclick = (e) => { const b = e.target.closest('.ans'); if (b) b.classList.add('show'); };
    this.renderAll();
  }
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2600); }
  renderAll() { this.renderTop(); this.renderList(); this.renderStory(); this.renderNotebook(); this.dirty = true; }
  renderTop() {
    const L = this.L(); document.documentElement.lang = L === 'hi' ? 'hi' : 'en';
    $('#title').textContent = this.t('appTitle');
    document.querySelectorAll('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.l === L));
    document.querySelectorAll('#subjects button').forEach((b) => { b.textContent = this.t(b.dataset.sub); });
    $('#b-voice').classList.toggle('off', !this.app.audio.voice); $('#b-voice').title = this.t('voice');
    $('#xr-btn').textContent = this.t('enterVR');
  }
  renderList() {
    const L = this.L(); const cs = [0, 6, 7, 8, 9, 10];
    $('#classes').innerHTML = cs.map((c) => `<button data-c="${c}" class="${c === this.cls ? 'on' : ''}">${c ? c : this.t('all')}</button>`).join('');
    $('#list-h').textContent = this.t('experiments');
    const cur = this.app.runner.exp?.id;
    const list = EXPERIMENTS.filter((e) => !this.cls || e.cls === this.cls || (e.also && e.also.includes(this.cls)));
    $('#explist').innerHTML = list.map((e) => `<button data-id="${e.id}" class="ebtn ${e.id === cur ? 'on' : ''}"><span class="cl">${e.cls}</span><span>${esc(this.app.expText(e, 'title'))}<small>${esc(this.app.expText(e, 'kind'))}</small></span></button>`).join('')
      || `<p class="empty">${esc(this.t('soon'))}</p>`;
  }
  renderStory() {
    const r = this.app.runner, L = this.L(), e = r.exp;
    const card = $('#story');
    if (!e) { card.classList.add('intro'); $('#s-kicker').textContent = 'DUET STEM'; $('#s-title').textContent = this.t('appTitle') + ' · ' + this.t('chemistry'); $('#s-text').innerHTML = `<p>${esc(this.t('welcome'))}</p>`; $('#s-buttons').style.display = 'none'; $('#s-dots').innerHTML = ''; return; }
    card.classList.remove('intro'); $('#s-buttons').style.display = '';
    const s = r.step(); const n = e.steps.length;
    $('#s-kicker').textContent = `${this.t('cls')} ${e.cls} · ${this.app.expText(e, 'ch')}`;
    $('#s-title').textContent = this.app.expText(e, 'title');
    let h = '';
    if (r.state === 'finished') {
      h = `<p class="fin">✓ ${esc(this.t('finished'))}</p>${this.app.hasParticles(e.id) ? `<p class="hint">🔬 ${esc(this.t('insideHint'))}</p>` : ''}<p><b>${esc(this.t('obs'))}:</b> ${esc(r.text('result.obs', L))}</p><p><b>${esc(this.t('concl'))}:</b> ${esc(r.text('result.concl', L))}</p><p class="eq">${esc(e.eq.sym)}</p>`;
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
    $('#b-next').textContent = this.t('next') + ' ›'; $('#b-back').textContent = '‹ ' + this.t('back');
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
    const P = this.menu; P.bg('#f0a65a'); P.logo(40, 34, 40); P.text(this.t('appTitle') + ' · ' + this.t('chemistry'), 40, 92, 40, '#f3eee6', 700);
    const cs = [0, 6, 7, 8, 9, 10]; cs.forEach((c, i) => P.btn('cls_' + c, 40 + i * 152, 160, 140, 70, c ? `${c}` : this.t('all'), { size: 30, align: 'center', active: this.cls === c }));
    const list = EXPERIMENTS.filter((e) => !this.cls || e.cls === this.cls || (e.also && e.also.includes(this.cls))); const per = 8; const pages = Math.max(1, Math.ceil(list.length / per)); this.page = Math.min(this.page, pages - 1);
    list.slice(this.page * per, this.page * per + per).forEach((e, i) => P.btn('exp_' + e.id, 40, 256 + i * 112, 920, 100, `${e.cls} · ${a.expText(e, 'title')}`, { size: 30, active: r.exp?.id === e.id }));
    if (pages > 1) { P.btn('pg_prev', 40, 1160, 300, 80, '‹', { size: 40, align: 'center' }); P.text(`${this.page + 1} / ${pages}`, 440, 1178, 34, '#a49d90', 600); P.btn('pg_next', 660, 1160, 300, 80, '›', { size: 40, align: 'center' }); }
    LANGS.forEach((l, i) => P.btn('lang_' + l, 40 + i * 236, 1270, 222, 84, LANG_LABEL[l], { size: 30, align: 'center', active: L === l, color: '#f3eee6' }));
    P.btn('voice', 748, 1270, 212, 84, (a.audio.voice ? '🔊 ' : '🔇 ') + this.t('voice'), { size: 26, align: 'center' });
    P.commit();
    // story
    const S = this.story; S.bg('#7fd1ff'); S.logo(40, 34, 40);
    const e = r.exp; const X = S.x;
    if (!e) { S.text(this.t('pickExp'), 40, 110, 46, '#f3eee6', 700); X.font = `500 32px ${FONT}`; wrap(X, this.t('welcome'), 1000).forEach((l, i) => S.text(l, 40, 190 + i * 46, 32, '#e2dccf', 500)); S.commit(); return; }
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
    S.btn('next', 810, by, 250, 90, this.t('next') + ' ›', { size: 30, align: 'center' });
    S.btn('auto', 40, by + 110, 330, 80, r.auto ? '❚❚ ' + this.t('pause') : '▶▶ ' + this.t('autoplay'), { size: 28, align: 'center', active: r.auto });
    S.btn('speed', 385, by + 110, 280, 80, `${this.t('speed')} ${a.speed}×`, { size: 28, align: 'center' });
    S.btn('reset', 680, by + 110, 380, 80, '↺ ' + this.t('reset'), { size: 28, align: 'center' });
    S.commit();
  }
  vrClick(id) {
    const a = this.app, r = a.runner;
    if (id.startsWith('cls_')) { this.cls = +id.slice(4); this.page = 0; }
    else if (id.startsWith('exp_')) a.openExp(id.slice(4));
    else if (id === 'pg_prev') this.page = Math.max(0, this.page - 1); else if (id === 'pg_next') this.page++;
    else if (id.startsWith('lang_')) a.setLang(id.slice(5)); else if (id === 'voice') a.toggleVoice();
    else if (id === 'do') a.primary(); else if (id === 'next') r.next(); else if (id === 'back') r.prev();
    else if (id === 'auto') (r.auto ? r.pause() : r.play()); else if (id === 'speed') a.cycleSpeed(); else if (id === 'reset') r.reset();
    this.dirty = true;
  }
}
