// In-headset panels drawn on canvas, clicked with controller rays or hand pinch.
import * as THREE from 'three';
import { FONT } from './labels.js';
import { JOURNEYS, SYSTEMS, T } from './data.js';

function wrap(x, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
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
    if (hov) { X.strokeStyle = 'rgba(255,255,255,0.7)'; X.lineWidth = 3; X.stroke(); }
    X.fillStyle = o.active ? '#14100a' : '#f3eee6';
    X.font = `${o.weight ?? 600} ${o.size ?? 30}px ${FONT}`;
    X.textBaseline = 'middle';
    if (o.swatch) { X.fillStyle = o.swatch; X.beginPath(); X.arc(x + 28, y + h / 2, 10, 0, 7); X.fill(); X.fillStyle = o.active ? '#14100a' : '#f3eee6'; }
    X.textAlign = o.align ?? 'left';
    const tx = o.align === 'center' ? x + w / 2 : x + (o.swatch ? 52 : 22);
    X.fillText(label, tx, y + h / 2 + 2);
    X.textAlign = 'left';
    this.buttons.push({ id, x, y, w, h });
  }
  bg() {
    const X = this.x; X.clearRect(0, 0, this.c.width, this.c.height);
    X.fillStyle = 'rgba(12,15,22,0.9)'; X.beginPath(); X.roundRect(4, 4, this.c.width - 8, this.c.height - 8, 34); X.fill();
    X.strokeStyle = 'rgba(255,255,255,0.14)'; X.lineWidth = 3; X.stroke();
    this.buttons = [];
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
    this.menu = new Panel(1000, 1400, 0.5);
    this.story = new Panel(1100, 900, 0.62);
    this.group.add(this.menu.mesh, this.story.mesh);
    this.layout(1.25);
    this.dirty = true;
  }
  layout(y) {
    // two panels either side of the body, turned to face the user and tilted back slightly
    for (const [m, x] of [[this.menu.mesh, -0.6], [this.story.mesh, 0.62]]) {
      const z = -0.72;
      m.position.set(x, y, z);
      m.rotation.set(-0.16, Math.atan2(-x, -z), 0, 'YXZ');
    }
  }
  place(head) {
    // put the panels around the user's current position
    const yaw = Math.atan2(-head.dir.x, -head.dir.z);
    this.group.position.set(head.pos.x, 0, head.pos.z);
    this.group.rotation.set(0, yaw, 0);
    this.layout(Math.max(0.9, head.pos.y - 0.34));
  }
  t(k) { return T[k][this.app.lang]; }
  draw() {
    this.drawMenu(); this.drawStory(); this.dirty = false;
  }
  drawMenu() {
    const P = this.menu, X = P.x, app = this.app, L = app.lang;
    P.bg();
    X.fillStyle = '#f5f1ea'; X.font = `700 46px ${FONT}`; X.textBaseline = 'top'; X.fillText(T.title[L], 40, 38);
    X.fillStyle = '#a9a294'; X.font = `500 24px ${FONT}`; X.fillText('DUET STEM', 42, 96);
    P.btn('lang_en', 640, 36, 150, 64, 'English', { active: L === 'en', align: 'center', size: 26 });
    P.btn('lang_hi', 800, 36, 150, 64, 'हिंदी', { active: L === 'hi', align: 'center', size: 28 });
    let y = 150;
    X.fillStyle = '#a9a294'; X.font = `600 24px ${FONT}`; X.fillText(this.t('journeys').toUpperCase(), 42, y); y += 40;
    P.btn('j_explore', 36, y, 928, 66, this.t('explore'), { active: !app.journey, color: '#d9d2c3', swatch: '#d9d2c3' }); y += 76;
    for (const j of JOURNEYS) {
      P.btn('j_' + j.id, 36, y, 928, 66, j.title[L], { active: app.journey && app.journey.id === j.id, color: SYSTEMS[j.sys].color, swatch: SYSTEMS[j.sys].color }); y += 76;
    }
    y += 18;
    X.fillStyle = '#a9a294'; X.font = `600 24px ${FONT}`; X.fillText(this.t('layers').toUpperCase(), 42, y); y += 40;
    const keys = ['skin', 'skeleton', 'muscles', 'circulatory', 'respiratory', 'digestive', 'urinary', 'nervous'];
    keys.forEach((k, i) => {
      const col = i % 2, row = (i / 2) | 0;
      P.btn('l_' + k, 36 + col * 468, y + row * 72, 456, 62, SYSTEMS[k][L], { active: app.body.layerOn[k], color: SYSTEMS[k].color, swatch: app.body.layerOn[k] ? null : SYSTEMS[k].color, size: 27 });
    });
    y += 4 * 72 + 6;
    P.btn('l_fine', 36, y, 456, 62, T.fine[L], { active: app.fine, size: 24 });
    P.btn('voice', 504, y, 220, 62, T.voice[L] + ': ' + (app.audio.voice ? (L === 'hi' ? 'चालू' : 'on') : (L === 'hi' ? 'बंद' : 'off')), { size: 26, active: app.audio.voice, color: '#d9d2c3' });
    P.btn('reset', 736, y, 228, 62, T.reset[L], { size: 24, align: 'center' }); y += 76;
    P.btn('size_dn', 36, y, 140, 62, '−', { align: 'center', size: 40 });
    X.fillStyle = '#f3eee6'; X.font = `600 28px ${FONT}`; X.textBaseline = 'middle'; X.textAlign = 'center';
    X.fillText(`${T.size[L]} ${app.vrScale.toFixed(1)}×`, 36 + 140 + 165, y + 33); X.textAlign = 'left';
    P.btn('size_up', 36 + 140 + 330, y, 140, 62, '+', { align: 'center', size: 40 });
    P.btn('exit', 680, y, 284, 62, L === 'hi' ? 'VR से बाहर' : 'Exit VR', { size: 26, align: 'center' });
    P.tex.needsUpdate = true;
  }
  drawStory() {
    const P = this.story, X = P.x, app = this.app, L = app.lang;
    P.bg();
    const W = P.c.width;
    if (app.journey) {
      const j = app.journey, s = j.steps[app.stepIdx];
      const col = SYSTEMS[j.sys].color;
      X.fillStyle = col; X.font = `700 26px ${FONT}`; X.textBaseline = 'top';
      X.fillText(`${j.title[L]}   ·   ${T.step[L]} ${app.stepIdx + 1} ${T.of[L]} ${j.steps.length}`, 44, 40);
      // progress
      const pw = (W - 88) / j.steps.length;
      j.steps.forEach((_, i) => { X.fillStyle = i <= app.stepIdx ? col : 'rgba(255,255,255,0.15)'; X.fillRect(44 + i * pw + 3, 84, pw - 6, 7); });
      X.fillStyle = '#ffffff'; X.font = `700 48px ${FONT}`;
      X.fillText(s.title[L], 44, 112);
      X.fillStyle = '#e9e3d8'; X.font = `500 ${L === 'hi' ? 34 : 33}px ${FONT}`;
      const lines = wrap(X, s.text[L], W - 96);
      lines.slice(0, 9).forEach((ln, i) => X.fillText(ln, 46, 190 + i * (L === 'hi' ? 54 : 50)));
      const by = P.c.height - 120;
      P.btn('prev', 44, by, 250, 84, '‹  ' + T.back[L], { size: 32, align: 'center' });
      P.btn('play', W / 2 - 130, by, 260, 84, app.playing ? T.pause[L] : T.play[L], { size: 32, align: 'center', active: app.playing, color: col });
      P.btn('next', W - 294, by, 250, 84, T.next[L] + '  ›', { size: 32, align: 'center' });
    } else {
      X.fillStyle = '#d9d2c3'; X.font = `700 26px ${FONT}`; X.textBaseline = 'top'; X.fillText(T.explore[L], 44, 40);
      const info = app.picked;
      if (info) {
        X.fillStyle = '#ffffff'; X.font = `700 50px ${FONT}`; X.fillText(L === 'hi' ? info[1] : info[0], 44, 100);
        X.fillStyle = '#b9b2a6'; X.font = `500 32px ${FONT}`; X.fillText(L === 'hi' ? info[0] : info[1], 46, 168);
        X.fillStyle = '#e9e3d8'; X.font = `500 34px ${FONT}`;
        wrap(X, L === 'hi' ? info[3] : info[2], W - 96).slice(0, 8).forEach((ln, i) => X.fillText(ln, 46, 240 + i * 52));
      } else {
        X.fillStyle = '#e9e3d8'; X.font = `500 36px ${FONT}`;
        wrap(X, T.exploreHint[L], W - 96).forEach((ln, i) => X.fillText(ln, 46, 110 + i * 54));
        X.fillStyle = '#a9a294'; X.font = `500 28px ${FONT}`;
        const tips = L === 'hi'
          ? ['ट्रिगर: किसी अंग या बटन को चुनें', 'दायाँ थंबस्टिक: शरीर घुमाएँ / बड़ा-छोटा करें', 'ग्रिप दबाकर रखें: शरीर को पकड़कर हिलाएँ', 'चलकर शरीर के चारों ओर घूमें']
          : ['Trigger: pick an organ or a button', 'Right thumbstick: turn / resize the body', 'Hold grip: grab and move the body', 'Walk around the body to see every side'];
        tips.forEach((tp, i) => X.fillText('·  ' + tp, 46, 360 + i * 50));
      }
      const by = P.c.height - 120;
      JOURNEYS.slice(0, 3).forEach((j, i) => P.btn('j_' + j.id, 44 + i * 344, by, 330, 84, j.title[L], { size: 24, swatch: SYSTEMS[j.sys].color }));
    }
    P.tex.needsUpdate = true;
  }
  panels() { return [this.menu.mesh, this.story.mesh]; }
  setHover(panel, id) {
    if (panel.hover !== id) { panel.hover = id; this.dirty = true; }
  }
}
