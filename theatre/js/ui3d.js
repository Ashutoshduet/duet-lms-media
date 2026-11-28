// Flat panels drawn on a canvas and shown in 3D (VR box and headset): captions, countdown, pause, the end card.
import * as THREE from 'three';

export class Panel {
  constructor(w, h, pw, ph) {
    this.w = pw; this.h = ph; this.c = document.createElement('canvas'); this.c.width = pw; this.c.height = ph; this.g = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.renderOrder = 50; this.mesh.frustumCulled = false;
  }
  draw(fn) { const g = this.g; g.clearRect(0, 0, this.w, this.h); fn(g, this.w, this.h); this.tex.needsUpdate = true; }
}
