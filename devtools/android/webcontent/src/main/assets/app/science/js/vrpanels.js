// Canvas panels for the headset (menu on the left, step card on the right), clicked with a controller ray or a pinch.
import * as THREE from 'three';
import { FONT } from './strings.js';
import { crispText } from './mats.js';

const LOGO = new Image();
LOGO.src = './brand/duet-stem-logo-light.png';

export function wrap(x, text, maxW) {
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

export class Panel {
  constructor(wPx, hPx, wM) {
    this.w = wPx; this.h = hPx; this.S = 1.4; // drawn at 1.4x for sharp text in the headset
    this.wM = wM; this.hM = wM * hPx / wPx;
    this.c = document.createElement('canvas'); this.c.width = Math.round(wPx * this.S); this.c.height = Math.round(hPx * this.S);
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 16;
    this.tex.generateMipmaps = true; this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, wM * hPx / wPx), crispText(new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false }), -0.9));
    this.mesh.renderOrder = 40; this.mesh.userData.panel = this;
    this.buttons = []; this.hover = null;
    // the pointer highlight is a small mesh on top, so pointing at buttons never re-uploads the canvas (steady frame rate)
    this.hl = new THREE.Group(); this.hl.visible = false; this.mesh.add(this.hl);
    this.hlFill = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false });
    this.hlLine = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false });
  }
  mx(px) { return (px / this.w - 0.5) * this.wM; }
  my(py) { return (0.5 - py / this.h) * this.hM; }
  setHL(id) {
    const b = id ? this.buttons.find((x) => x.id === id) : null;
    for (const o of [...this.hl.children]) { o.geometry.dispose(); this.hl.remove(o); }
    if (!b) { this.hl.visible = false; return; }
    const x0 = this.mx(b.x), x1 = this.mx(b.x + b.w), y0 = this.my(b.y + b.h), y1 = this.my(b.y), r = Math.min(18 / this.w * this.wM, (y1 - y0) / 2);
    const sh = new THREE.Shape(); sh.moveTo(x0 + r, y0); sh.lineTo(x1 - r, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + r); sh.lineTo(x1, y1 - r); sh.quadraticCurveTo(x1, y1, x1 - r, y1);
    sh.lineTo(x0 + r, y1); sh.quadraticCurveTo(x0, y1, x0, y1 - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    const f = new THREE.Mesh(new THREE.ShapeGeometry(sh, 4), this.hlFill); f.position.z = 0.0006; f.renderOrder = 41;
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(sh.getPoints(4)), this.hlLine); l.position.z = 0.0008; l.renderOrder = 42;
    f.userData.noHit = l.userData.noHit = true; this.hl.add(f, l); this.hl.visible = true;
  }
  btn(id, x, y, w, h, label, o = {}) {
    const X = this.x; const hov = false; // see setHL
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
    const X = this.x; X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, this.c.width, this.c.height); X.setTransform(this.S, 0, 0, this.S, 0, 0);
    X.fillStyle = 'rgba(12,15,22,0.93)'; X.beginPath(); X.roundRect(4, 4, this.w - 8, this.h - 8, 34); X.fill();
    X.strokeStyle = 'rgba(255,255,255,0.14)'; X.lineWidth = 3; X.stroke();
    if (accent) { X.fillStyle = accent; X.beginPath(); X.roundRect(4, 4, this.w - 8, 10, [34, 34, 0, 0]); X.fill(); }
    this.buttons = [];
  }
  text(s, x, y, size, color = '#f3eee6', weight = 600) { const X = this.x; X.font = `${weight} ${size}px ${FONT}`; X.fillStyle = color; X.textBaseline = 'top'; X.fillText(s, x, y); }
  logo(x, y, h) {
    if (LOGO.complete && LOGO.naturalWidth) this.x.drawImage(LOGO, x, y, h * LOGO.naturalWidth / LOGO.naturalHeight, h);
    else this.text('DUET STEM', x, y, h * 0.8, '#e9e1cf', 700);
  }
  hitUV(uv) {
    const px = uv.x * this.w, py = (1 - uv.y) * this.h;
    return this.buttons.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)?.id ?? null;
  }
  commit() { this.tex.needsUpdate = true; this.setHL(this.hover); }
}

