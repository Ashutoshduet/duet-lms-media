// Organ motion: heartbeat, breathing, chewing, churning, peristalsis, bladder.
import * as THREE from 'three';

const smooth = (x) => x * x * (3 - 2 * x);
const pulse = (ph, a, b) => (ph < a || ph > b ? 0 : Math.sin(((ph - a) / (b - a)) * Math.PI));

function centerOf(mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
}

// scale a mesh (whose vertices are in body space) about a pivot point
function scaleAbout(mesh, pivot, sx, sy = sx, sz = sx) {
  mesh.scale.set(sx, sy, sz);
  mesh.position.set(pivot.x * (1 - sx), pivot.y * (1 - sy), pivot.z * (1 - sz));
}

// add a travelling-wave vertex displacement to a standard material
function addWave(mat, opts) {
  const u = { uTime: { value: 0 }, uAmp: { value: 0 }, uK: { value: opts.k }, uW: { value: opts.w }, uDir: { value: opts.dir || new THREE.Vector3(0.3, 1, 0.5).normalize() } };
  const prev = mat.onBeforeCompile; const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (sh, r) => {
    prev && prev(sh, r);
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uAmp; uniform float uK; uniform float uW; uniform vec3 uDir;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = dot(position, uDir) * uK - uTime * uW;
        float wv = sin(ph) * 0.5 + 0.5;
        transformed += normal * uAmp * (wv * wv * wv - 0.35);`);
  };
  mat.customProgramCacheKey = () => prevKey + 'wave' + opts.k + '_' + opts.w;
  mat.needsUpdate = true;
  return u;
}

export class OrganAnimator {
  constructor(body, audio) {
    this.body = body; this.audio = audio;
    this.on = new Set();
    this.t = 0;
    this.heartPhase = 0; this.breathPhase = 0;
    this.heartRate = 72; this.breathPeriod = 4.2;
    this.beat = 0;
    const P = body.parts;
    this.piv = {};
    for (const k of ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'lung_r', 'lung_l', 'diaphragm', 'bladder', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary', 'valve_aortic', 'papillary']) if (P[k]) this.piv[k] = centerOf(P[k]);
    // lungs expand mostly outward/downward from the hilum (medial, upper)
    for (const k of ['lung_r', 'lung_l']) if (P[k]) { const c = this.piv[k]; this.piv[k] = new THREE.Vector3(c.x * 0.45, c.y + 0.05, c.z); }
    if (P.diaphragm) { const bb = P.diaphragm.geometry.boundingBox; this.piv.diaphragm = new THREE.Vector3(0, bb.min.y, 0); }
    if (P.bladder) { const bb = P.bladder.geometry.boundingBox; this.piv.bladder = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2); }
    // jaw hinge: back-top of the mandible
    if (P.mandible) { P.mandible.geometry.computeBoundingBox(); const bb = P.mandible.geometry.boundingBox; this.jaw = new THREE.Vector3(0, bb.max.y - 0.008, bb.min.z + 0.012); }
    // rib cage hinge at the spine
    this.ribPivot = new THREE.Vector3(0, 1.36, -0.045);
    // travelling waves
    this.waves = {};
    const W = (k, o) => { if (P[k]) this.waves[k] = addWave(P[k].material, o); };
    W('stomach', { k: 160, w: 3.2, dir: new THREE.Vector3(-0.7, -0.5, 0.2).normalize() });
    W('esophagus', { k: 140, w: 6.0, dir: new THREE.Vector3(0, -1, 0) });
    W('small_intestine', { k: 120, w: 4.0 });
    W('large_intestine', { k: 90, w: 2.0 });
    W('duodenum', { k: 150, w: 4.0 });
    W('ureters', { k: 220, w: 5.0, dir: new THREE.Vector3(0, -1, 0) });
    this.bladderFill = 0;
  }

  set(list) { this.on = new Set(list || []); }

  reset() {
    const P = this.body.parts;
    for (const k of Object.keys(this.piv)) if (P[k]) { P[k].scale.set(1, 1, 1); P[k].position.set(0, 0, 0); }
    for (const k of ['ribs', 'sternum', 'mandible', 'teeth_lower']) if (P[k]) { P[k].rotation.set(0, 0, 0); P[k].position.set(0, 0, 0); }
    for (const w of Object.values(this.waves)) w.uAmp.value = 0;
  }

  update(dt) {
    this.t += dt;
    const P = this.body.parts, on = this.on;
    // ---- heart
    const hb = on.has('heartbeat') || on.has('valves');
    this.heartPhase = (this.heartPhase + dt * this.heartRate / 60) % 1;
    const ph = this.heartPhase;
    const atr = hb ? pulse(ph, 0.0, 0.16) : 0;
    const ven = hb ? pulse(ph, 0.16, 0.5) : 0;
    this.beat = ven;
    if (hb && this._lastPh !== undefined) {
      if (this._lastPh < 0.17 && ph >= 0.17) this.audio && this.audio.lub();
      if (this._lastPh < 0.5 && ph >= 0.5) this.audio && this.audio.dub();
    }
    this._lastPh = ph;
    for (const k of ['heart_ra', 'heart_la']) if (P[k]) scaleAbout(P[k], this.piv[k], 1 - 0.07 * atr);
    for (const k of ['heart_rv', 'heart_lv', 'papillary']) if (P[k]) scaleAbout(P[k], this.piv[k], 1 - 0.065 * ven, 1 - 0.09 * ven, 1 - 0.065 * ven);
    // valves: AV valves shut during ventricular squeeze, outflow valves shut after it
    if (on.has('valves')) {
      const avShut = ven > 0.05 ? 1 : 0;
      const semiShut = ph > 0.5 || ph < 0.16 ? 1 : 0;
      for (const [k, shut] of [['valve_tricuspid', avShut], ['valve_mitral', avShut], ['valve_pulmonary', semiShut], ['valve_aortic', semiShut]]) {
        if (!P[k]) continue;
        scaleAbout(P[k], this.piv[k], shut ? 1.0 : 0.82);
        const m = P[k].material; if (m.emissive) m.emissive.setRGB(shut ? 0.35 : 0.02, shut ? 0.3 : 0.02, shut ? 0.15 : 0.02);
      }
    } else {
      for (const k of ['valve_tricuspid', 'valve_mitral', 'valve_pulmonary', 'valve_aortic']) if (P[k] && hb) scaleAbout(P[k], this.piv[k], 1 - 0.05 * ven);
    }
    // ---- breathing
    const br = on.has('breathe') || on.has('breathe_deep');
    const amp = on.has('breathe_deep') ? 1.5 : 1;
    this.breathPhase = (this.breathPhase + dt / this.breathPeriod) % 1;
    const bp = this.breathPhase;
    // inhale 0..0.42, hold, exhale 0.5..1
    let b = bp < 0.42 ? smooth(bp / 0.42) : bp < 0.5 ? 1 : 1 - smooth((bp - 0.5) / 0.5);
    if (!br) b = 0;
    this.breath = b; this.inhaling = br && bp < 0.45;
    if (br && this._lastBp !== undefined) {
      if (this._lastBp > 0.9 && bp < 0.1) this.audio && this.audio.breathIn(this.breathPeriod * 0.42);
      if (this._lastBp < 0.5 && bp >= 0.5) this.audio && this.audio.breathOut(this.breathPeriod * 0.5);
    }
    this._lastBp = bp;
    for (const k of ['lung_r', 'lung_l']) if (P[k]) scaleAbout(P[k], this.piv[k], 1 + 0.035 * b * amp, 1 + 0.06 * b * amp, 1 + 0.045 * b * amp);
    if (P.diaphragm) { scaleAbout(P.diaphragm, this.piv.diaphragm, 1 + 0.01 * b, 1 - 0.14 * b * amp, 1 + 0.01 * b); }
    for (const k of ['ribs', 'sternum']) if (P[k]) {
      const a = -0.035 * b * amp;
      P[k].rotation.x = a;
      const p = this.ribPivot; // rotate about pivot: pos = p - R*p
      const c = Math.cos(a), s = Math.sin(a);
      P[k].position.set(0, p.y - (c * p.y - s * p.z), p.z - (s * p.y + c * p.z));
    }
    // ---- chewing
    if (P.mandible) {
      const a = on.has('chew') ? 0.09 * Math.max(0, Math.sin(this.t * 8.5)) : 0;
      for (const k of ['mandible', 'teeth_lower']) if (P[k]) {
        P[k].rotation.x = a;
        const p = this.jaw, c = Math.cos(a), s = Math.sin(a);
        P[k].position.set(0, p.y - (c * p.y - s * p.z), p.z - (s * p.y + c * p.z));
      }
    }
    // ---- waves
    const setWave = (k, amp) => { const w = this.waves[k]; if (!w) return; w.uTime.value = this.t; w.uAmp.value += (amp - w.uAmp.value) * Math.min(1, dt * 3); };
    setWave('stomach', on.has('churn') ? 0.0035 : 0);
    const per = on.has('peristalsis');
    setWave('esophagus', per ? 0.0022 : 0);
    setWave('small_intestine', per || on.has('churn') ? 0.0012 : 0);
    setWave('duodenum', per ? 0.0014 : 0);
    setWave('large_intestine', per ? 0.0016 : 0);
    setWave('ureters', per || on.has('bladder') ? 0.0009 : 0);
    // ---- bladder
    if (P.bladder) {
      if (on.has('bladder')) this.bladderFill = Math.min(1, this.bladderFill + dt / 9);
      else if (on.has('bladder_empty')) { this.bladderFill -= dt / 3; if (this.bladderFill < 0) this.bladderFill = 1; }
      else this.bladderFill += (0 - this.bladderFill) * Math.min(1, dt);
      const f = this.bladderFill;
      scaleAbout(P.bladder, this.piv.bladder, 1 + 0.35 * f, 1 + 0.45 * f, 1 + 0.35 * f);
    }
    // ---- muscle glow
    if (P.muscles && P.muscles.material.emissive) {
      const g = on.has('muscle_pulse') ? 0.12 * (0.5 + 0.5 * Math.sin(this.t * 2.2)) : 0;
      P.muscles.material.emissive.setRGB(g, g * 0.25, g * 0.2);
    }
  }
}
