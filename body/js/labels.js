// Text tags drawn on canvas (English + Hindi), used in the body view, micro scenes and VR.
import * as THREE from 'three';

export const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';

export function drawLabel(lines, opts = {}) {
  const scale = 3;
  const pad = 14 * scale, gap = 4 * scale;
  const sizes = lines.map((l, i) => (i === 0 ? (opts.big ?? 30) : (opts.small ?? 24)) * scale);
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  let w = 0;
  lines.forEach((l, i) => { x.font = `${i === 0 ? 600 : 500} ${sizes[i]}px ${FONT}`; w = Math.max(w, x.measureText(l).width); });
  const h = sizes.reduce((a, s) => a + s * 1.3, 0) + gap * (lines.length - 1) + pad * 1.4;
  c.width = Math.ceil(w + pad * 2 + (opts.swatch ? 22 * scale : 0)); c.height = Math.ceil(h);
  const r = 16 * scale;
  x.fillStyle = opts.bg ?? 'rgba(14,18,26,0.86)';
  x.beginPath(); x.roundRect(1, 1, c.width - 2, c.height - 2, r); x.fill();
  x.strokeStyle = opts.border ?? 'rgba(255,255,255,0.18)'; x.lineWidth = 2 * scale; x.stroke();
  let ox = pad;
  if (opts.swatch) { x.fillStyle = opts.swatch; x.beginPath(); x.arc(pad + 7 * scale, c.height / 2, 7 * scale, 0, 7); x.fill(); ox += 22 * scale; }
  let y = pad * 0.7;
  lines.forEach((l, i) => {
    x.font = `${i === 0 ? 600 : 500} ${sizes[i]}px ${FONT}`;
    x.fillStyle = i === 0 ? (opts.color ?? '#f5f1ea') : (opts.color2 ?? '#c9c3b8');
    x.textBaseline = 'top';
    x.fillText(l, ox, y + sizes[i] * 0.12);
    y += sizes[i] * 1.3 + gap;
  });
  return c;
}

export class Label extends THREE.Group {
  // anchor in parent space; height = world height of the tag in metres
  constructor(lines, opts = {}) {
    super();
    this.opts = opts;
    const tex = new THREE.CanvasTexture(drawLabel(lines, opts));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, transparent: true });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 30;
    this.aspect = tex.image.width / tex.image.height;
    this.height = opts.height ?? 0.032;
    this.sprite.center.set(opts.cx ?? 0.5, opts.cy ?? 0);
    this.add(this.sprite);
    if (opts.leader !== false) {
      const dotMat = new THREE.SpriteMaterial({ color: opts.dot ?? '#ffffff', depthTest: false, transparent: true });
      this.dot = new THREE.Sprite(dotMat); this.dot.renderOrder = 31;
      this.add(this.dot);
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      this.line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, depthTest: false }));
      this.line.renderOrder = 29;
      this.add(this.line);
    }
    this.offset = opts.offset ? opts.offset.clone() : new THREE.Vector3(0, 0.05, 0);
    this.k = 1;
    this.layout();
  }
  setScale(k) { this.k = k; this.layout(); }
  layout() {
    const h = this.height * this.k;
    this.sprite.scale.set(h * this.aspect, h, 1);
    const o = this.offset.clone().multiplyScalar(this.k);
    this.sprite.position.copy(o);
    if (this.dot) {
      this.dot.scale.setScalar(0.006 * this.k);
      const a = this.line.geometry.attributes.position;
      a.setXYZ(1, o.x, o.y, o.z); a.needsUpdate = true;
    }
  }
  dispose() { this.mat.map.dispose(); this.mat.dispose(); }
}
