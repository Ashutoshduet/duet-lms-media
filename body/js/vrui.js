// In-headset panels drawn on canvas, clicked with controller rays or hand pinch.
// They are fixed in the room (left: menu, right: story card) and never move when clicked.
import * as THREE from 'three';
import { FONT } from './labels.js';
import { JOURNEYS, SYSTEMS, T } from './data.js';
import { LANGS, LANG_LABEL, tx } from './content.js';
import { LABS, LAB_IDS } from './lab.js';

const LOGO = new Image();
LOGO.src = './brand/duet-stem-logo-light.png';

function wrap(x, text, maxW) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    const words = para.split(' '); let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (x.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t;
    }
    out.push(cur);
  }
  return out;
}

class Panel {
  constructor(wPx, hPx, wM) {
    this.c = document.createElement('canvas'); this.c.width = wPx; this.c.height = hPx;
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, wM * hPx / wPx), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false }));
    this.mesh.renderOrder = 40; this.mesh.userData.panel = this;
    this.buttons = []; this.hover = null;
  }
  btn(id, x, y, w, h, label, o = {}) {
    const X = this.x; const hov = this.hover === id;
    X.fillStyle = o.active ? (o.color ?? '#f0a65a') : o.primary ? 'rgba(127,209,255,0.28)' : hov ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.075)';
    X.beginPath(); X.roundRect(x, y, w, h, o.r ?? 18); X.fill();
    if (hov) { X.strokeStyle = 'rgba(255,255,255,0.8)'; X.lineWidth = 3; X.stroke(); }
    X.font = `${o.weight ?? 600} ${o.size ?? 30}px ${FONT}`; X.textBaseline = 'middle';
    let tx0 = x + 22;
    if (o.swatch) { X.fillStyle = o.swatch; X.beginPath(); X.arc(x + 28, y + h / 2, 10, 0, 7); X.fill(); tx0 = x + 52; }
    X.fillStyle = o.active ? '#14100a' : '#f3eee6';
    let t = label; const maxW = w - (tx0 - x) - 14;
    while (X.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -2);
    if (t !== label) t = t.trimEnd() + '…';
    if (o.align === 'center') { X.textAlign = 'center'; X.fillText(t, x + w / 2, y + h / 2 + 2); X.textAlign = 'left'; } else X.fillText(t, tx0, y + h / 2 + 2);
    this.buttons.push({ id, x, y, w, h });
  }
  bg(accent) {
    const X = this.x; X.clearRect(0, 0, this.c.width, this.c.height);
    X.fillStyle = 'rgba(12,15,22,0.93)'; X.beginPath(); X.roundRect(4, 4, this.c.width - 8, this.c.height - 8, 34); X.fill();
    X.strokeStyle = 'rgba(255,255,255,0.14)'; X.lineWidth = 3; X.stroke();
    if (accent) { X.fillStyle = accent; X.beginPath(); X.roundRect(4, 4, this.c.width - 8, 10, [34, 34, 0, 0]); X.fill(); }
    this.buttons = [];
  }
  text(s, x, y, size, color = '#f3eee6', weight = 600) { const X = this.x; X.font = `${weight} ${size}px ${FONT}`; X.fillStyle = color; X.textBaseline = 'top'; X.fillText(s, x, y); }
  logo(x, y, h) {
    if (LOGO.complete && LOGO.naturalWidth) this.x.drawImage(LOGO, x, y, h * LOGO.naturalWidth / LOGO.naturalHeight, h);
    else this.text('DUET STEM', x, y, h * 0.8, '#e9e1cf', 700);
  }
  hitUV(uv) {
    const px = uv.x * this.c.width, py = (1 - uv.y) * this.c.height;
    return this.buttons.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)?.id ?? null;
  }
  commit() { this.tex.needsUpdate = true; }
}

const SYS_ORDER = ['skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous', 'senses', 'endocrine', 'lymphatic', 'skin'];

export class VRUI {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group(); this.group.visible = false;
    this.menu = new Panel(1000, 1500, 0.52);
    this.story = new Panel(1100, 1150, 0.64);
    this.group.add(this.menu.mesh, this.story.mesh);
    this.page = 'home'; this.sys = 'circulatory'; this.pp = 0;
    this.layout(1.25);
    this.dirty = true;
    LOGO.onload = () => { this.dirty = true; };
  }
  // panels sit either side of the body, turned to face the user (stage space: user at origin looking down -z)
  layout(eye) {
    const y = Math.max(0.95, eye - 0.32);
    for (const [m, x, z] of [[this.menu.mesh, -0.78, -0.72], [this.story.mesh, 0.8, -0.74]]) {
      m.position.set(x, y, z);
      m.rotation.set(-0.14, Math.atan2(-x, -z), 0, 'YXZ');
    }
  }
  L() { return this.app.lang; }
  t(k) { return tx(T[k], this.L()) || k; }
  panels() { return [this.menu.mesh, this.story.mesh]; }
  allPanels() { return [this.menu, this.story]; }
  setHover(P, id) { if (P.hover !== id) { P.hover = id; this.dirty = true; } }
  draw() {
    const pg = this.page;
    if (pg === 'journeys') this.drawJourneys(); else if (pg === 'labs') this.drawLabs(); else if (pg === 'parts') this.drawParts(); else if (pg === 'settings') this.drawSettings(); else if (pg === 'labparts') this.drawLabParts(); else this.drawHome();
    this.drawStory();
    this.menu.commit(); this.story.commit();
    this.dirty = false;
  }
  header(P, title) {
    P.logo(40, 34, 40);
    P.text(title, 40, 92, 44, '#f3eee6', 700);
  }
  back(P) { P.btn('page_home', 760, 34, 200, 64, '‹ ' + this.t('menuBack'), { size: 28, align: 'center' }); }

  drawHome() {
    const P = this.menu, a = this.app, L = this.L(); P.bg('#7fd1ff');
    this.header(P, this.t('title'));
    let y = 170;
    const big = (id, label, sub, col, active) => { P.btn(id, 40, y, 920, 104, label, { size: 36, swatch: col, active }); if (sub) { P.x.font = `500 22px ${FONT}`; } y += 118; };
    big('explore', this.t('explore'), '', '#d9d2c3', a.mode === 'explore');
    big('page_journeys', this.t('journeys') + '  ›', '', '#f0a65a', a.mode === 'journey');
    big('page_labs', this.t('labs') + '  ›', '', '#e0414b', a.mode === 'lab');
    big('page_parts', this.t('organs') + '  ›', '', '#7fd1c7', a.mode === 'part');
    P.text(this.t('dismantle'), 44, y + 6, 26, '#a49d90', 600); y += 44;
    P.btn('dis_organs', 40, y, 450, 90, this.t('organsSet'), { size: 32, active: a.mode === 'dismantle' && a.dis.set === 'organs' });
    P.btn('dis_bones', 510, y, 450, 90, this.t('bonesSet'), { size: 32, active: a.mode === 'dismantle' && a.dis.set === 'bones' }); y += 112;
    P.text(this.t('assemble'), 44, y + 6, 26, '#a49d90', 600); y += 44;
    P.btn('game_organs', 40, y, 450, 90, this.t('organsSet'), { size: 32, active: a.mode === 'game' && a.dis.set === 'organs' });
    P.btn('game_bones', 510, y, 450, 90, this.t('bonesSet'), { size: 32, active: a.mode === 'game' && a.dis.set === 'bones' }); y += 116;
    // language + settings row
    LANGS.forEach((l, i) => P.btn('lang_' + l, 40 + i * 236, y, 222, 84, LANG_LABEL[l], { size: 30, align: 'center', active: L === l, color: '#f3eee6' }));
    P.btn('page_settings', 748, y, 212, 84, '⚙ ' + this.t('settings'), { size: 26, align: 'center' });
  }
  drawJourneys() {
    const P = this.menu, a = this.app, L = this.L(); P.bg('#f0a65a');
    this.header(P, this.t('journeys')); this.back(P);
    let y = 170;
    for (const j of JOURNEYS) { P.btn('j_' + j.id, 40, y, 920, 112, tx(j.title, L), { size: 32, swatch: SYSTEMS[j.sys].color, active: a.journey && a.journey.id === j.id }); y += 126; }
  }
  drawLabs() {
    const P = this.menu, a = this.app, L = this.L(); P.bg('#e0414b');
    this.header(P, this.t('labs')); this.back(P);
    let y = 170;
    LAB_IDS.forEach((id, i) => {
      const x = 40 + (i % 2) * 470, yy = y + Math.floor(i / 2) * 150;
      P.btn('lab_' + id, x, yy, 450, 132, tx(LABS[id].title, L), { size: 36, swatch: LABS[id].color, active: a.mode === 'lab' && a.labId === id });
    });
    P.x.font = `500 26px ${FONT}`; P.x.fillStyle = '#a49d90';
    wrap(P.x, this.t('labHint'), 900).forEach((l, i) => P.text(l, 44, y + 4 * 150 + 10 + i * 38, 26, '#a49d90', 500));
  }
  drawParts() {
    const P = this.menu, a = this.app, L = this.L(); P.bg('#7fd1c7');
    this.header(P, this.t('organs')); this.back(P);
    // system tabs (2 rows)
    let y = 160;
    SYS_ORDER.forEach((s, i) => {
      const x = 40 + (i % 4) * 232, yy = y + Math.floor(i / 4) * 72;
      P.btn('sys_' + s, x, yy, 220, 62, tx(SYSTEMS[s], L), { size: 22, swatch: SYSTEMS[s].color, active: this.sys === s, color: SYSTEMS[s].color });
    });
    y += 3 * 72 + 14;
    const list = a.partsBySys[this.sys] || [];
    const per = 14, pages = Math.max(1, Math.ceil(list.length / per)); this.pp = Math.min(this.pp, pages - 1);
    list.slice(this.pp * per, this.pp * per + per).forEach((pid, i) => {
      const info = a.partInfo(pid); if (!info) return;
      const x = 40 + (i % 2) * 470, yy = y + Math.floor(i / 2) * 84;
      P.btn('p_' + pid, x, yy, 450, 72, info.name, { size: 26, active: a.sel && a.sel.pid === pid, color: '#7fd1c7' });
    });
    const by = 1500 - 112;
    if (pages > 1) {
      P.btn('pp_prev', 40, by, 200, 76, '‹', { size: 40, align: 'center' });
      P.text(`${this.pp + 1} / ${pages}`, 440, by + 20, 32, '#a49d90', 600);
      P.btn('pp_next', 760, by, 200, 76, '›', { size: 40, align: 'center' });
    }
  }
  drawLabParts() {
    const P = this.menu, a = this.app; P.bg('#e0414b');
    this.header(P, tx(LABS[a.labId]?.title, this.L()) || ''); P.btn('page_labs', 760, 34, 200, 64, '‹ ' + this.t('menuBack'), { size: 28, align: 'center' });
    const list = a.lab.partList().filter((pid) => a.partInfo(pid));
    const per = 18, pages = Math.max(1, Math.ceil(list.length / per)); this.pp = Math.min(this.pp, pages - 1);
    list.slice(this.pp * per, this.pp * per + per).forEach((pid, i) => {
      const x = 40 + (i % 2) * 470, yy = 170 + Math.floor(i / 2) * 84;
      P.btn('lp_' + pid, x, yy, 450, 72, a.partInfo(pid).name, { size: 26, active: a.lab.selected === pid, color: '#ffd27a' });
    });
    if (pages > 1) { P.btn('pp_prev', 40, 1388, 200, 76, '‹', { size: 40, align: 'center' }); P.text(`${this.pp + 1} / ${pages}`, 440, 1408, 32, '#a49d90'); P.btn('pp_next', 760, 1388, 200, 76, '›', { size: 40, align: 'center' }); }
  }
  drawSettings() {
    const P = this.menu, a = this.app, L = this.L(); P.bg('#a49d90');
    this.header(P, this.t('settings')); this.back(P);
    let y = 180;
    const row = (id, label, on) => { P.btn(id, 40, y, 920, 100, `${label}: ${this.t(on ? 'on' : 'off')}`, { size: 34, active: on, color: '#7fd1ff' }); y += 116; };
    row('voice', this.t('voice'), a.audio.voice);
    row('sfx', this.t('sfx'), a.audio.sfx);
    LANGS.forEach((l, i) => P.btn('lang_' + l, 40 + i * 310, y, 290, 92, LANG_LABEL[l], { size: 32, align: 'center', active: L === l, color: '#f3eee6' })); y += 116;
    P.btn('recenter', 40, y, 920, 100, '⟳ ' + this.t('recenter'), { size: 34 }); y += 116;
    P.btn('size_dn', 40, y, 450, 100, '－ ' + (L === 'en' ? 'Smaller' : L === 'hi' ? 'छोटा' : 'Chhota'), { size: 34, align: 'center' });
    P.btn('size_up', 510, y, 450, 100, '＋ ' + (L === 'en' ? 'Bigger' : L === 'hi' ? 'बड़ा' : 'Bada'), { size: 34, align: 'center' }); y += 116;
    P.btn('save_all', 40, y, 920, 100, '⬇ ' + this.t('saveAll'), { size: 32 }); y += 110;
    P.text(a.offlineText(), 44, y + 6, 26, '#9fd17a', 600); y += 60;
    P.btn('exit', 40, 1500 - 130, 920, 96, '✕ ' + (L === 'en' ? 'Exit VR' : L === 'hi' ? 'VR से बाहर' : 'VR se bahar'), { size: 32, align: 'center' });
  }

  drawStory() {
    const P = this.story, m = this.app.storyModel(), L = this.L();
    P.bg(m.color);
    const X = P.x;
    // voice + language quick row
    P.logo(40, 34, 34);
    P.btn('voice', 1100 - 40 - 100, 26, 100, 64, '', { size: 34, align: 'center' });
    { const X = P.x, cx = 1100 - 90, cy = 58; X.strokeStyle = X.fillStyle = '#f3eee6'; X.lineWidth = 4; X.lineCap = 'round';
      X.beginPath(); X.moveTo(cx - 24, cy - 9); X.lineTo(cx - 14, cy - 9); X.lineTo(cx - 2, cy - 20); X.lineTo(cx - 2, cy + 20); X.lineTo(cx - 14, cy + 9); X.lineTo(cx - 24, cy + 9); X.closePath(); X.fill();
      X.beginPath(); if (this.app.audio.voice) { X.arc(cx + 2, cy, 12, -0.9, 0.9); X.moveTo(cx + 10, cy - 18); X.arc(cx + 2, cy, 22, -0.9, 0.9); } else { X.moveTo(cx + 8, cy - 10); X.lineTo(cx + 26, cy + 10); X.moveTo(cx + 26, cy - 10); X.lineTo(cx + 8, cy + 10); } X.stroke(); }
    LANGS.forEach((l, i) => P.btn('lang_' + l, 1100 - 160 - (3 - i) * 152, 26, 142, 64, LANG_LABEL[l], { size: 24, align: 'center', active: L === l, color: '#f3eee6' }));
    X.font = `700 28px ${FONT}`; X.fillStyle = m.color || '#d9d2c3'; X.textBaseline = 'top';
    X.fillText(m.kicker || '', 40, 112);
    X.font = `700 48px ${FONT}`; X.fillStyle = '#f3eee6';
    const tl = wrap(X, m.title || '', 1020); tl.slice(0, 2).forEach((l, i) => X.fillText(l, 40, 158 + i * 58));
    let y = 158 + Math.min(2, tl.length) * 58 + 16;
    X.font = `500 ${L === 'en' ? 32 : 33}px ${FONT}`; X.fillStyle = '#e2dccf';
    const lines = wrap(X, m.text || '', 1020);
    const lh = L === 'en' ? 46 : 52; const maxL = Math.floor((1150 - 260 - y) / lh);
    lines.slice(0, maxL).forEach((l, i) => X.fillText(l, 40, y + i * lh));
    if (lines.length > maxL) { X.fillText('…', 40, y + maxL * lh - 10); }
    // dots
    if (m.dots) {
      const n = m.dots.n, w = Math.min(60, (1020 - (n - 1) * 8) / n);
      for (let i = 0; i < n; i++) { X.fillStyle = i <= m.dots.i ? (m.color || '#f0a65a') : 'rgba(255,255,255,0.16)'; X.beginPath(); X.roundRect(40 + i * (w + 8), 1150 - 236, w, 10, 5); X.fill(); }
    }
    // buttons
    const bs = m.buttons || [];
    const bw = Math.min(330, (1020 - (bs.length - 1) * 14) / Math.max(1, bs.length));
    bs.forEach((b, i) => P.btn(b.id, 40 + i * (bw + 14), 1150 - 196, bw, 92, b.label, { size: 30, align: 'center', primary: b.primary, active: b.active, color: m.color }));
    const sub = m.buttons2 || [];
    const bw2 = Math.min(330, (1020 - (sub.length - 1) * 14) / Math.max(1, sub.length));
    sub.forEach((b, i) => P.btn(b.id, 40 + i * (bw2 + 14), 1150 - 92, bw2, 72, b.label, { size: 26, align: 'center', active: b.active, color: m.color }));
  }
}
