// Split an organ into its parts, and a part into its smaller parts — with your own hands.
// "Split into parts" takes every part of the organ out of the body (one side for paired organs: an eye, an ear, a hand,
// a kidney), enlarges small organs, and lays the parts out in front of you, spread apart in their real arrangement and
// each with its name. "Join together" closes them up into the whole organ again, still out of the body. Each part stays a
// piece of its own: grab it (grip or pinch), turn it, resize it with both hands, or put it back. "Its smaller parts"
// does the same for one part made of several pieces (lobules of the cerebellum, the bones of the wrist, the cartilages
// of the voice box…), named as in the anatomy model.
import * as THREE from 'three';
import { Label } from './labels.js';
import { partInfo } from './content.js';

// organs made of several parts: the groups (and single parts) of the body model that belong to each
export const UNITS = {
  heart: { groups: ['heart_ra', 'heart_la', 'heart_rv', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_aortic', 'valve_pulmonary', 'papillary'], parts: ['cardiac_veins', 'aorta_arch', 'pulmonary_trunk'], name: { en: 'The heart', hi: 'हृदय', hg: 'Heart' } },
  brain: { groups: ['cerebrum', 'cerebellum', 'brainstem', 'brain_deep'], name: { en: 'The brain', hi: 'मस्तिष्क', hg: 'Brain' } },
  skull: { groups: ['skull', 'mandible'], name: { en: 'The skull', hi: 'खोपड़ी', hg: 'Skull' } },
  eye: { groups: ['eyes'], sided: true, name: { en: 'The eye', hi: 'आँख', hg: 'Aankh' } },
  ear: { groups: ['ear'], sided: true, name: { en: 'The ear', hi: 'कान', hg: 'Kaan' } },
  lungs: { groups: ['lung_l', 'lung_r', 'bronchi', 'trachea'], name: { en: 'The lungs and airways', hi: 'फेफड़े और श्वास नलियाँ', hg: 'Lungs aur airways' } },
  kidney: { groups: ['kidney_l', 'kidney_r', 'renal_pelvis'], parts: ['renal_arteries'], sided: true, name: { en: 'The kidney', hi: 'गुर्दा', hg: 'Kidney' } },
  colon: { groups: ['large_intestine'], name: { en: 'The large intestine', hi: 'बड़ी आँत', hg: 'Large intestine' } },
  larynx: { groups: ['larynx'], name: { en: 'The voice box', hi: 'स्वरयंत्र', hg: 'Voice box' } },
  throat: { groups: ['pharynx'], name: { en: 'The throat', hi: 'ग्रसनी', hg: 'Throat' } },
  teeth: { groups: ['teeth'], name: { en: 'The teeth', hi: 'दाँत', hg: 'Daant' } },
  hand: { groups: ['hand'], sided: true, name: { en: 'The bones of the hand', hi: 'हाथ की हड्डियाँ', hg: 'Haath ki haddiyan' } },
  foot: { groups: ['foot'], sided: true, name: { en: 'The bones of the foot', hi: 'पैर की हड्डियाँ', hg: 'Pair ki haddiyan' } },
  chest: { groups: ['ribs', 'sternum'], name: { en: 'The rib cage', hi: 'पसली पिंजर', hg: 'Rib cage' } },
  spine: { groups: ['vertebrae', 'sacrum'], name: { en: 'The backbone', hi: 'रीढ़ की हड्डी', hg: 'Backbone' } },
};
export function unitOf(pid, partMeta) {
  const pm = partMeta[pid]; if (!pm) return null;
  for (const [k, u] of Object.entries(UNITS)) if (u.groups.includes(pm.group) || (u.parts || []).includes(pid)) return k;
  return null;
}
export const unitParts = (key, partMeta) => { const u = UNITS[key]; return Object.keys(partMeta).filter((pid) => u.groups.includes(partMeta[pid].group) || (u.parts || []).includes(pid)); };
// the named pieces of one part (as named in the anatomy model), on one side
export function subPieces(oids, objects) {
  const by = new Map();
  for (const o of oids) { const ob = objects[o]; if (!ob) continue; const nm = String(ob.name || '').replace(/[()]/g, '').trim(); if (!nm) continue; if (!by.has(nm)) by.set(nm, []); by.get(nm).push(o); }
  return [...by.entries()].map(([name, list]) => ({ name, oids: list }));
}

const ID = new THREE.Quaternion();
export class Splitter {
  constructor(app) { this.app = app; this.set = null; this.labels = new THREE.Group(); this.labels.name = 'split-labels'; }
  get active() { return !!(this.set && this.set.pieces.some((p) => this.app.hands.pieces.includes(p))); }
  has(p) { return !!(this.set && this.set.pieces.includes(p)); }
  // pieces: pieces already taken out; names: label lines for each piece (or null to use the part's own name)
  open(title, pieces, viewer, names = null) {
    this.close();
    if (!pieces.length) return;
    if (!this.labels.parent) this.app.hands.group.add(this.labels);
    const C = new THREE.Vector3(); for (const p of pieces) C.add(p.userData.home); C.multiplyScalar(1 / pieces.length);
    let S = 0; for (const p of pieces) S = Math.max(S, p.userData.home.distanceTo(C) + p.userData.size * 0.5);
    S = Math.max(S * 2, 0.02);
    const k = THREE.MathUtils.clamp(0.32 / S, 1, 5); // small organs are shown bigger
    const dir = viewer.clone().sub(C); dir.y = 0; if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1); dir.normalize();
    const D = C.clone().addScaledVector(dir, THREE.MathUtils.clamp(0.22 + S * k * 0.6, 0.3, 0.55)); D.y = THREE.MathUtils.clamp(C.y + 0.04, 0.9, 1.6);
    this.set = { title, pieces, names, C, D, k, apart: true, dir, R: 0.3, pos: null }; // R: how far the spread reaches (plan)
    pieces.forEach((p, i) => this.labels.add(this.makeLabel(p, names ? names[i] : this.nameOf(p))));
    this.layout(true);
  }
  nameOf(p) { const info = partInfo(p.userData.pid, this.app.lang), sub = p.userData.sub;
    if (sub) return info ? [sub, info.name] : [sub];
    return info ? [info.name, info.alt].filter(Boolean) : [p.userData.pid]; }
  makeLabel(p, lines) { const lb = new Label(lines, { height: 0.018, cx: 0.5, cy: 0, big: 26, small: 20 }); lb.userData = { piece: p, dir: new THREE.Vector3(0, 1, 0), len: -1 }; return lb; }
  relabel() {
    const S = this.set; if (!S) return;
    for (const lb of [...this.labels.children]) { this.labels.remove(lb); lb.dispose(); }
    S.pieces.forEach((p, i) => this.labels.add(this.makeLabel(p, S.names ? S.names[i] : this.nameOf(p))));
    this.layout(S.apart, true);
  }
  // where each part goes when spread apart: its real direction from the middle of the organ, in a layer facing you,
  // then pushed apart until no two parts (and their names) overlap
  plan() {
    const S = this.set, n = S.pieces.length;
    const right = new THREE.Vector3(0, 1, 0).cross(S.dir).normalize(), up = new THREE.Vector3(0, 1, 0);
    const U = [], Vv = [], Wd = [], R = [];
    S.pieces.forEach((p, i) => { const o = p.userData.home.clone().sub(S.C);
      U.push(o.dot(right) * S.k * 1.4); Vv.push(o.dot(up) * S.k * 1.4); Wd.push(o.dot(S.dir) * S.k * 0.45);
      R.push(Math.max(0.014, p.userData.size * S.k * 0.4) + 0.014); });
    for (let it = 0; it < 120; it++) {
      let moved = false;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let du = U[j] - U[i], dv = (Vv[j] - Vv[i]) * 1.25; let L = Math.hypot(du, dv); const need = R[i] + R[j];
        if (L >= need) continue;
        if (L < 1e-5) { const a = (i * 2.399 + j * 0.7); du = Math.cos(a); dv = Math.sin(a); L = 1; }
        const push = (need - L) * 0.5 / L; U[i] -= du * push; U[j] += du * push; Vv[i] -= dv * push / 1.25; Vv[j] += dv * push / 1.25; moved = true;
      }
      if (!moved) break;
    }
    // keep the spread centred on D, and above the floor
    const mu = U.reduce((a, b) => a + b, 0) / n, mv = Vv.reduce((a, b) => a + b, 0) / n;
    let ext = 0; S.pos = S.pieces.map((p, i) => { const u = U[i] - mu, v = Vv[i] - mv; ext = Math.max(ext, Math.hypot(u, v) + R[i]);
      const to = S.D.clone().addScaledVector(right, u).addScaledVector(up, v).addScaledVector(S.dir, Wd[i]); to.y = Math.max(to.y, 0.35);
      return { to, lab: new THREE.Vector3().addScaledVector(right, u).addScaledVector(up, v + 0.3 * Math.hypot(u, v) + 0.004) }; });
    S.R = ext + 0.04;
  }
  // apart: spread out; together: the whole organ, out of the body
  layout(apart, quick = false) {
    const S = this.set; if (!S) return; S.apart = apart; const H = this.app.hands;
    if (!S.pos) this.plan();
    S.pieces.forEach((p, i) => { if (!H.pieces.includes(p) || H.isHeld(p)) return;
      const to = apart ? S.pos[i].to.clone() : S.D.clone().add(p.userData.home.clone().sub(S.C).multiplyScalar(S.k));
      p.userData.anim = { p0: p.position.clone(), p1: to, q0: p.quaternion.clone(), q1: ID.clone(), s0: p.scale.x, s1: S.k, t: quick ? 1 : 0, dur: 0.9, back: false };
      const lb = this.labels.children[i]; if (lb) { lb.userData.dir.copy(S.pos[i].lab); if (lb.userData.dir.lengthSq() < 1e-8) lb.userData.dir.set(0, 1, 0); lb.userData.dir.normalize(); lb.userData.len = -1; } });
    this.labels.visible = apart;
  }
  toggle() { if (this.set) this.layout(!this.set.apart); }
  close() { for (const lb of [...this.labels.children]) { this.labels.remove(lb); lb.dispose(); } this.set = null; }
  update() {
    const S = this.set; if (!S) return;
    const H = this.app.hands; let alive = 0;
    const k = this.app.labelScale ? this.app.labelScale() : 1;
    this.labels.children.forEach((lb) => {
      const p = lb.userData.piece; const on = H.pieces.includes(p) && !(p.userData.anim && p.userData.anim.back);
      lb.visible = on && S.apart; if (!on) return; alive++;
      lb.position.copy(p.position);
      // the name sits just outside the part, away from the middle of the organ; it grows with the part and the view
      const len = 0.012 + p.userData.size * p.scale.x * 0.42;
      if (Math.abs(len - lb.userData.len) > 0.002 || k !== lb.k) { lb.userData.len = len; lb.offset.copy(lb.userData.dir).multiplyScalar(len / k); lb.setScale(k); }
    });
    if (!alive) this.close();
  }
}
