// In-headset panels drawn on canvas, clicked with controller rays or hand pinch.
import * as THREE from 'three';
import { FONT } from './labels.js';
import { JOURNEYS, SYSTEMS, T } from './data.js';
import { LANGS, LANG_LABEL, ORGANS, tx, partInfo } from './content.js';

const LOGO = new Image();
LOGO.src = './brand/duet-stem-logo-light.png';

function wrap(x, text, maxW) {
  const words = String(text || '').split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

class Panel {
  constructor(wPx, hPx, wM) {
    this.c = document.createElement('canvas'); this.c.width = wPx; this.c.height = hPx;
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const hM = wM * hPx / wPx;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false }));
    this.mesh.renderOrder = 40;
    this.mesh.userData.panel = this;
    this.buttons = [];
    this.hover = null;
  }
  btn(id, x, y, w, h, label, o = {}) {
    const X = this.x; const hov = this.hover === id;
    X.fillStyle = o.active ? (o.color ?? '#f0a65a') : hov ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)';
    X.beginPath(); X.roundRect(x, y, w, h, o.r ?? 18); X.fill();
    if (hov) { X.strokeStyle = 'rgba(255,255,255,0.75)'; X.lineWidth = 3; X.stroke(); }
    X.font = `${o.weight ?? 600} ${o.size ?? 30}px ${FONT}`;
    X.textBaseline = 'middle';
    let tx0 = x + 22;
    if (o.swatch) { X.fillStyle = o.swatch; X.beginPath(); X.arc(x + 28, y + h / 2, 10, 0, 7); X.fill(); tx0 = x + 52; }
    X.fillStyle = o.active ? '#14100a' : '#f3eee6';
    let t = label;
    const maxW = w - (tx0 - x) - 14;
    while (X.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -2);
    if (t !== label) t = t.trimEnd() + '…';
    if (o.align === 'center') { X.textAlign = 'center'; X.fillText(t, x + w / 2, y + h / 2 + 2); X.textAlign = 'left'; }
    else X.fillText(t, tx0, y + h / 2 + 2);
    this.buttons.push({ id, x, y, w, h });
  }
  bg() {
    const X = this.x; X.clearRect(0, 0, this.c.width, this.c.height);
    X.fillStyle = 'rgba(12,15,22,0.92)'; X.beginPath(); X.roundRect(4, 4, this.c.width - 8, this.c.height - 8, 34); X.fill();
    X.strokeStyle = 'rgba(255,255,255,0.14)'; X.lineWidth = 3; X.stroke();
    this.buttons = [];
  }
  logo(x, y, h) {
    if (LOGO.complete && LOGO.naturalWidth) this.x.drawImage(LOGO, x, y, h * LOGO.naturalWidth / LOGO.naturalHeight, h);
    else { this.x.fillStyle = '#e9e1cf'; this.x.font = `700 ${h * 0.8}px ${FONT}`; this.x.textBaseline = 'top'; this.x.fillText('DUET STEM', x, y); }
  }
  hitUV(uv) {
    const px = uv.x * this.c.width, py = (1 - uv.y) * this.c.height;
    return this.buttons.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)?.id ?? null;
  }
}

export class VRUI {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.menu = new Panel(1000, 1500, 0.5);
    this.story = new Panel(1100, 1000, 0.62);
    this.group.add(this.menu.mesh, this.story.mesh);
    this.page = 'menu';
    this.organSys = 'circulatory';
    this.layout(1.25);
    this.dirty = true;
    LOGO.onload = () => { this.dirty = true; };
  }
  layout(y) {
    // two panels either side of the stage, turned to face the user and tilted back slightly
    for (const [m, x] of [[this.menu.mesh, -0.62], [this.story.mesh, 0.64]]) {
      const z = -0.7;
      m.position.set(x, y, z);
      m.rotation.set(-0.12, Math.atan2(-x, -z), 0, 'YXZ');
    }
  }
  place(head) {
    const yaw = Math.atan2(-head.dir.x, -head.dir.z);
    this.group.position.set(head.pos.x, 0, head.pos.z);
    this.group.rotation.set(0, yaw, 0);
    this.layout(Math.max(0.95, head.pos.y - 0.3));
  }
  L() { return this.app.lang; }
  t(k) { return tx(T[k], this.L()); }
  draw() {
    if (this.page === 'organs') this.drawOrgans(); else this.drawMenu();
    this.drawStory();
    this.dirty = false;
  }
  header(P) {
    const X = P.x;
    P.logo(40, 34, 46);
    X.fillStyle = '#f5f1ea'; X.font = `700 40px ${FONT}`; X.textBaseline = 'top'; X.fillText(this.t('title'), 40, 96);
    LANGS.forEach((l, i) => P.btn('lang_' + l, 520 + i * 156, 92, 146, 56, LANG_LABEL[l], { active: this.L() === l, align: 'center', size: 24 }));
  }
  drawMenu() {
    const P = this.menu, X = P.x, app = this.app, L = this.L();
    P.bg(); this.header(P);
    let y = 172;
    X.fillStyle = '#a9a294'; X.font = `600 24px ${FONT}`; X.fillText(this.t('journeys').toUpperCase(), 42, y); y += 38;
    P.btn('j_explore', 36, y, 450, 64, this.t('explore'), { active: !app.journey && !app.organ, color: '#d9d2c3', swatch: '#d9d2c3' });
    P.btn('page_organs', 500, y, 464, 64, this.t('organs') + '  ›', { active: !!app.organ, color: '#d9d2c3', swatch: '#f0a65a' }); y += 74;
    for (const j of JOURNEYS) {
      P.btn('j_' + j.id, 36, y, 928, 64, tx(j.title, L), { active: app.journey && app.journey.id === j.id, color: SYSTEMS[j.sys].color, swatch: SYSTEMS[j.sys].color }); y += 72;
    }
    y += 14;
    X.fillStyle = '#a9a294'; X.font = `600 24px ${FONT}`; X.fillText(this.t('layers').toUpperCase(), 42, y); y += 38;
    const keys = ['skin', 'skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous'];
    keys.forEach((k, i) => {
      const col = i % 2, row = (i / 2) | 0;
      P.btn('l_' + k, 36 + col * 468, y + row * 68, 456, 58, tx(SYSTEMS[k], L), { active: app.body.layerOn[k], color: SYSTEMS[k].color, swatch: app.body.layerOn[k] ? null : SYSTEMS[k].color, size: 26 });
    });
    y += 4 * 68 + 8;
    const on = (b) => tx(b ? T.on : T.off, L);
    P.btn('voice', 36, y, 300, 60, `${this.t('voice')}: ${on(app.audio.voice)}`, { size: 25, active: app.audio.voice, color: '#d9d2c3' });
    P.btn('sfx', 350, y, 300, 60, `${this.t('sfx')}: ${on(app.audio.sfx)}`, { size: 25, active: app.audio.sfx, color: '#d9d2c3' });
    P.btn('l_fine', 664, y, 300, 60, this.t('fine'), { active: app.fine, size: 21 }); y += 72;
    P.btn('size_dn', 36, y, 100, 60, '−', { align: 'center', size: 40 });
    X.fillStyle = '#f3eee6'; X.font = `600 26px ${FONT}`; X.textBaseline = 'middle'; X.textAlign = 'center';
    X.fillText(`${this.t('size')} ${app.vrScale.toFixed(1)}×`, 36 + 100 + 95, y + 31); X.textAlign = 'left';
    P.btn('size_up', 326, y, 100, 60, '+', { align: 'center', size: 40 });
    P.btn('recenter', 440, y, 250, 60, this.t('recenter'), { size: 24, align: 'center' });
    P.btn('exit', 704, y, 260, 60, L === 'en' ? 'Exit VR' : L === 'hi' ? 'VR से बाहर' : 'VR se bahar', { size: 24, align: 'center' });
    P.tex.needsUpdate = true;
  }
  drawOrgans() {
    const P = this.menu, X = P.x, app = this.app, L = this.L();
    P.bg(); this.header(P);
    let y = 172;
    P.btn('page_menu', 36, y, 260, 58, '‹  ' + this.t('menuBack'), { size: 26 });
    X.fillStyle = '#f5f1ea'; X.font = `700 34px ${FONT}`; X.textBaseline = 'middle'; X.fillText(this.t('organs'), 320, y + 30);
    y += 76;
    const systems = Object.keys(ORGANS);
    systems.forEach((sys, i) => {
      const col = i % 2, row = (i / 2) | 0;
      P.btn('os_' + sys, 36 + col * 468, y + row * 62, 456, 54, tx(SYSTEMS[sys], L), { active: this.organSys === sys, color: SYSTEMS[sys].color, swatch: this.organSys === sys ? null : SYSTEMS[sys].color, size: 24 });
    });
    y += Math.ceil(systems.length / 2) * 62 + 18;
    const list = ORGANS[this.organSys] || [];
    const color = SYSTEMS[this.organSys].color;
    list.forEach((id, i) => {
      const info = partInfo(id, L); if (!info) return;
      const col = i % 2, row = (i / 2) | 0;
      P.btn('o_' + id, 36 + col * 468, y + row * 66, 456, 58, info.name, { active: app.organ === id, color, size: 24 });
    });
    P.tex.needsUpdate = true;
  }
  drawStory() {
    const P = this.story, X = P.x, app = this.app, L = this.L();
    P.bg();
    const W = P.c.width, H = P.c.height;
    const by = H - 118;
    const lh = L === 'en' ? 46 : 50;
    const body = (text, top) => {
      X.fillStyle = '#ece6da'; X.font = `500 ${L === 'en' ? 31 : 32}px ${FONT}`; X.textBaseline = 'top';
      const lines = wrap(X, text, W - 96); const max = Math.floor((by - 24 - top) / lh);
      lines.slice(0, max).forEach((ln, i) => X.fillText(ln, 46, top + i * lh));
    };
    if (app.journey) {
      const j = app.journey, s = app.step;
      const col = SYSTEMS[j.sys].color;
      X.fillStyle = col; X.font = `700 25px ${FONT}`; X.textBaseline = 'top';
      X.fillText(`${tx(j.title, L)}  ·  ${this.t('step')} ${app.stepIdx + 1} ${this.t('of')} ${j.steps.length}`, 44, 38);
      const pw = (W - 88) / j.steps.length;
      j.steps.forEach((_, i) => { X.fillStyle = i <= app.stepIdx ? col : 'rgba(255,255,255,0.15)'; X.fillRect(44 + i * pw + 2, 80, pw - 4, 7); });
      X.fillStyle = '#ffffff'; X.font = `700 44px ${FONT}`;
      X.fillText(tx(s.title, L), 44, 104);
      body(tx(s.text, L), 172);
      P.btn('prev', 44, by, 230, 80, '‹  ' + this.t('back'), { size: 30, align: 'center' });
      P.btn('replay', 288, by, 150, 80, '↻', { size: 36, align: 'center' });
      P.btn('play', W / 2 - 100 + 60, by, 240, 80, app.playing ? this.t('pause') : this.t('play'), { size: 30, align: 'center', active: app.playing, color: col });
      P.btn('next', W - 274, by, 230, 80, this.t('next') + '  ›', { size: 30, align: 'center' });
    } else {
      const info = app.picked;
      X.fillStyle = '#d9d2c3'; X.font = `700 25px ${FONT}`; X.textBaseline = 'top';
      X.fillText(app.organ ? `${this.t('organs')} · ${tx(SYSTEMS[app.body.layerOf(app.organ)] || {}, L)}` : this.t('explore'), 44, 38);
      if (info) {
        X.fillStyle = '#ffffff'; X.font = `700 46px ${FONT}`; X.fillText(info.name, 44, 84);
        X.fillStyle = '#b9b2a6'; X.font = `500 28px ${FONT}`; X.fillText(info.alt, 46, 146);
        body(info.detail, 200);
        P.btn('replay', 44, by, 200, 80, '↻', { size: 36, align: 'center' });
        P.btn('page_organs', 258, by, 300, 80, this.t('organs'), { size: 28, align: 'center' });
        P.btn('j_explore', 572, by, 300, 80, this.t('explore'), { size: 28, align: 'center' });
      } else {
        X.fillStyle = '#e9e3d8'; X.font = `500 34px ${FONT}`;
        wrap(X, tx(T.exploreHint, L), W - 96).forEach((ln, i) => X.fillText(ln, 46, 96 + i * 52));
        X.fillStyle = '#a9a294'; X.font = `500 27px ${FONT}`;
        const tips = L === 'en'
          ? ['Trigger: pick an organ or a button', 'Right thumbstick: turn / resize the body', 'Hold grip: grab and move the body', 'Recenter: bring the body in front of you']
          : L === 'hi'
            ? ['ट्रिगर: कोई अंग या बटन चुनें', 'दायाँ थंबस्टिक: शरीर घुमाएँ / बड़ा-छोटा करें', 'ग्रिप दबाकर रखें: शरीर को पकड़कर हिलाएँ', 'सामने लाएँ: शरीर को अपने सामने लाएँ']
            : ['Trigger: koi organ ya button choose karo', 'Right thumbstick: body ghumao / bada-chhota karo', 'Grip dabaake rakho: body ko pakad ke hilao', 'Saamne laao: body ko apne saamne lao'];
        tips.forEach((tp, i) => X.fillText('·  ' + tp, 46, 330 + i * 48));
        JOURNEYS.slice(0, 2).forEach((j, i) => P.btn('j_' + j.id, 44 + i * 512, by, 496, 80, tx(j.title, L), { size: 25, swatch: SYSTEMS[j.sys].color }));
      }
    }
    // footer branding
    X.globalAlpha = 0.55; P.logo(W - 250, 34, 30); X.globalAlpha = 1;
    P.tex.needsUpdate = true;
  }
  panels() { return [this.menu.mesh, this.story.mesh]; }
  allPanels() { return [this.menu, this.story]; }
  setHover(panel, id) {
    if (panel.hover !== id) { panel.hover = id; this.dirty = true; }
  }
}
