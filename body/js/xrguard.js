// DUET STEM · Human Body 360 — keeps a Meta Quest headset at its display rate (Meta VRC.Quest.Performance.1).
//
// While a VR session runs, it watches the time between frames. When frames are being missed (more than 1 in 10 over
// 2 seconds, outside the black loading fade) it removes the costliest extras one step at a time; when the picture has
// been steady for 20 seconds it brings the last step back, but never a step that already had to be removed twice.
// The steps, in order (the first is skipped where there is no reflection map to begin with):
//   env:  no reflection map: the organs and the room get the plain, brighter light the phones use
//   skin: the see-through skin is drawn on its front side only
//   room: no room around you: a calm plain background instead
// Measured on a Quest 3S (live GPU time with VrApi logs): the reflection map is about a third of the body's cost and
// the room about a quarter of the frame. A Quest 2 has about half the graphics power, so it starts at step 1.
// ?xrguard=0 switches it off for a test; DuetXRGuard.info() in the console shows the steps taken.
import * as THREE from 'three';

const WINDOW = 2000, CALM = 10;

export class XRGuard {
  constructor(app, opts = {}) {
    this.app = app; this.env = app.scene.environment; this.level = 0; this.base = opts.base || 0;
    this.steps = (this.env ? ['env'] : []).concat(['skin', 'room']);
    this.fails = new Array(this.steps.length + 1).fill(0); this.log = []; this.off = /[?&]xrguard=0/.test(location.search);
    this.reset();
    window.DuetXRGuard = this;
    if (this.base) this.set(this.base, 'start');
  }
  reset() { this.t0 = 0; this.n = 0; this.slow = 0; this.last = 0; this.calm = 0; this.quiet = performance.now() + 4000; }
  get limit() { const s = this.app.renderer.xr.getSession && this.app.renderer.xr.getSession(); const hz = (s && s.frameRate) || 72; return 1.5 * 1000 / hz; }

  // once per frame while presenting, before the scene is drawn
  tick(now) {
    if (this.off) return;
    const f = this.app.questFade && this.app.questFade.state && this.app.questFade.state();
    if ((f && (f.on || f.a > 0)) || document.hidden || now < this.quiet) { this.last = 0; this.t0 = 0; this.n = this.slow = 0; return; }
    if (this.last) { this.n++; if (now - this.last > this.limit) this.slow++; }
    this.last = now;
    if (!this.t0) { this.t0 = now; return; }
    if (now - this.t0 < WINDOW) return;
    const share = this.slow / Math.max(1, this.n); this.t0 = now; this.n = this.slow = 0;
    if (share > 0.1) { this.calm = 0; if (this.level < this.steps.length) { this.fails[this.level]++; this.set(this.level + 1, 'slow ' + Math.round(share * 100) + '%'); } }
    else if (share < 0.02) {
      if (++this.calm >= CALM && this.level > this.base && this.fails[this.level - 1] < 2) { this.calm = 0; this.set(this.level - 1, 'steady'); }
    } else this.calm = 0;
  }

  set(level, why) {
    const a = this.app, prev = this.level; this.level = level;
    const on = new Set(this.steps.slice(0, level));
    // env: reflection map off, plain light on (the phones' look: hemisphere 2.4, ambient 1.6)
    if (this.env) {
      const noEnv = on.has('env'), want = noEnv ? null : this.env;
      if (a.scene.environment !== want) {
        a.scene.environment = want;
        a.scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach((m) => { if (m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) m.needsUpdate = true; }); });
      }
      if (a.hemi) a.hemi.intensity = noEnv ? 2.4 : 0.85;
      if (a.amb) a.amb.intensity = noEnv ? 1.6 : 0;
      if (a.roomMats) a.roomMats.forEach((m) => { m.emissiveIntensity = noEnv ? 0 : a.roomGlow; });
    }
    // skin: front faces only
    const skin = a.body && a.body.parts && a.body.parts.skin;
    if (skin && skin.material) { const side = on.has('skin') ? THREE.FrontSide : THREE.DoubleSide; if (skin.material.side !== side) { skin.material.side = side; skin.material.needsUpdate = true; } }
    // room: hidden (it is hidden in AR anyway)
    if (a.anat) a.anat.visible = !on.has('room') && a.xrMode !== 'immersive-ar';
    this.quiet = performance.now() + 3000; this.last = 0; this.t0 = 0; this.n = this.slow = 0;
    this.log.push(Math.round(performance.now() / 1000) + 's ' + prev + '>' + level + (why ? ' (' + why + ')' : ''));
    if (this.log.length > 30) this.log.shift();
    try { console.info('[XRGuard] step ' + prev + ' -> ' + level + (why ? ' (' + why + ')' : '')); } catch (e) { /* no console */ }
  }

  info() { return { level: this.level, steps: this.steps.slice(0, this.level), base: this.base, fails: this.fails.slice(), log: this.log.join(' | ') }; }
}
