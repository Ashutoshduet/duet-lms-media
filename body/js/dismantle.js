// Take the body apart (exploded view) and the "put it back" game.
// Pieces are copies cut out of the body model per object, so the real body never moves.
import * as THREE from 'three';
import { lookFor } from './body.js';
import { Label } from './labels.js';
import { partInfo } from './content.js';

// piece: [content id, groups, side ('l'|'r'|null)]
export const SETS = {
  organs: [
    ['brain', ['cerebrum', 'cerebellum', 'brainstem', 'brain_deep'], null], ['eye', ['eyes'], 'r'], ['eye', ['eyes'], 'l'],
    ['thyroid_gland', ['thyroid'], null], ['trachea', ['trachea', 'bronchi', 'larynx'], null], ['right_lung', ['lung_r'], null], ['left_lung', ['lung_l'], null],
    ['heart', ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv', 'valve_tricuspid', 'valve_mitral', 'valve_pulmonary', 'valve_aortic', 'papillary', 'cardiac_veins'], null],
    ['esophagus', ['esophagus'], null], ['diaphragm', ['diaphragm'], null], ['liver', ['liver'], null], ['gallbladder', ['gallbladder'], null],
    ['stomach', ['stomach'], null], ['spleen', ['spleen'], null], ['pancreas', ['pancreas'], null], ['kidneys', ['kidney_r', 'adrenal'], 'r'], ['kidneys', ['kidney_l', 'adrenal'], 'l'],
    ['small_intestine', ['small_intestine', 'duodenum'], null], ['large_intestine', ['large_intestine', 'rectum'], null], ['bladder', ['bladder'], null],
  ],
  bones: [
    ['skull', ['skull', 'teeth'], null], ['mandible', ['mandible', 'teeth_lower'], null], ['spine', ['vertebrae', 'sacrum'], null], ['rib_cage', ['ribs', 'sternum'], null],
    ...['r', 'l'].flatMap((s) => [['clavicle', ['clavicle'], s], ['scapula', ['scapula'], s], ['humerus', ['humerus'], s], ['radius', ['radius'], s], ['ulna', ['ulna'], s], ['hand_bones', ['hand'], s],
      ['hip_bone', ['hip'], s], ['femur', ['femur'], s], ['patella', ['patella'], s], ['tibia', ['tibia'], s], ['fibula', ['fibula'], s], ['foot_bones', ['foot'], s]]),
  ],
};
// where each organ floats in the take-apart view (body space x, y), laid out like a textbook chart
const ORGAN_SPOT = {
  brain: [0, 1.86], eye_r: [-0.17, 1.66], eye_l: [0.17, 1.66], thyroid_gland: [0.2, 1.5], trachea: [-0.04, 1.47],
  right_lung: [-0.36, 1.34], left_lung: [0.36, 1.34], heart: [0.13, 1.27], esophagus: [-0.17, 1.3], diaphragm: [0, 1.12],
  liver: [-0.3, 1.0], gallbladder: [-0.46, 0.9], stomach: [0.27, 1.0], spleen: [0.46, 1.06], pancreas: [0.07, 0.95],
  kidneys_r: [-0.38, 0.8], kidneys_l: [0.38, 0.8], small_intestine: [-0.14, 0.75], large_intestine: [0.18, 0.72], bladder: [0, 0.56],
};

export class Dismantle {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group(); this.group.name = 'dismantle'; // lives inside bodyRoot (body space)
    this.labels = new THREE.Group(); this.group.add(this.labels);
    this.pieces = {}; this.set = null; this.mode = null; // 'explode' | 'game'
    this.held = null; this.placed = 0;
  }

  build(set) {
    if (this.pieces[set]) return this.pieces[set];
    const body = this.app.body, list = [];
    const tmp = new THREE.Vector3();
    for (const [cid, groups, side] of SETS[set]) {
      const piece = new THREE.Group(); const box = new THREE.Box3();
      for (const g of groups) {
        const mesh = body.parts[g]; if (!mesh) continue;
        let geo;
        if (mesh.geometry.attributes.partId) {
          const oids = []; body.objects.forEach((o, i) => { if (o.group === g) oids.push(i); });
          // keep the objects on the wanted side (by their centre)
          const keep = side ? oids.filter((i) => { const c = this.objCenter(g, i); return c && (side === 'l' ? c.x > 0 : c.x < 0); }) : oids;
          if (!keep.length) continue;
          geo = body.extract(keep);
        } else {
          geo = mesh.geometry.clone();
          if (side) { const p = geo.attributes.position; let sx = 0; for (let i = 0; i < p.count; i++) sx += p.getX(i); if ((sx > 0) !== (side === 'l')) continue; }
        }
        const [c, r] = lookFor(g);
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, transparent: true, opacity: 1 }));
        m.userData.base = new THREE.Color(c);
        piece.add(m); geo.computeBoundingBox(); box.union(geo.boundingBox);
      }
      if (!piece.children.length) continue;
      const home = box.getCenter(new THREE.Vector3());
      // children are re-centred so the piece rotates/moves about its own middle
      for (const m of piece.children) m.position.sub(home);
      piece.position.copy(home);
      piece.userData = { cid, home, size: box.getSize(tmp).length(), box: box.getSize(tmp).y, side, placed: false, groups };
      list.push(piece);
    }
    this.pieces[set] = list;
    return list;
  }
  objCenter(g, oid) {
    const tri = this.app.body.triIndex(g); const l = tri && tri.get(oid); if (!l) return null;
    const mesh = this.app.body.parts[g]; const idx = mesh.geometry.index.array, P = mesh.geometry.attributes.position.array;
    let x = 0, n = 0; for (let k = 0; k < l.length; k += 3) { const v = idx[l[k]] * 3; x += P[v]; n++; }
    return { x: x / Math.max(1, n) };
  }

  // groups that the copies replace while this set is out
  groupsOf(set) { return [...new Set(SETS[set].flatMap((p) => p[1]))]; }

  // ------------------------------------------------------------ exploded view
  explode(set) {
    this.clear();
    this.set = set; this.mode = 'explode';
    const list = this.build(set);
    const c = new THREE.Vector3(0, set === 'bones' ? 0.9 : 1.2, 0);
    for (const p of list) {
      this.group.add(p);
      const h = p.userData.home; const d = h.clone().sub(c); d.z = 0;
      const key = p.userData.cid + (p.userData.side ? '_' + p.userData.side : '');
      let to;
      if (set === 'organs' && ORGAN_SPOT[key]) { const [x, y] = ORGAN_SPOT[key]; to = new THREE.Vector3(x, y, h.z + 0.3); }
      else {
        const extra = { ulna: 0.07, patella: 0.09, fibula: 0.06, scapula: 0.05 }[p.userData.cid] || 0;
        to = h.clone().add(new THREE.Vector3(d.x * 1.6 + Math.sign(d.x || 1) * extra, d.y * 0.35, 0.18 + Math.abs(d.x) * 0.2 + (p.userData.cid === 'patella' ? 0.12 : 0)));
      }
      p.userData.from = h.clone(); p.userData.to = to;
      p.position.copy(h); p.rotation.set(0, 0, 0); p.userData.placed = true;
    }
    this.t = 0; this.dur = 1.8; this.settled = false;
    this.makeLabels();
  }

  // ------------------------------------------------------------ assembly game
  game(set, trayFn) {
    this.clear();
    this.set = set; this.mode = 'game'; this.placed = 0;
    const list = this.build(set);
    const order = list.slice().sort(() => Math.random() - 0.5);
    order.forEach((p, i) => {
      this.group.add(p);
      const at = trayFn(i, order.length, p);
      p.userData.from = p.userData.home.clone(); p.userData.to = at; p.userData.placed = false;
      p.position.copy(p.userData.home); p.rotation.set(0, 0, 0);
      for (const m of p.children) m.material.color.copy(m.userData.base);
    });
    this.t = 0; this.dur = 1.6; this.settled = false;
    this.labels.clear();
    this.ghosts(true);
  }
  // faint outline of where pieces belong
  ghosts(on) {
    if (this.ghost) { this.group.remove(this.ghost); this.ghost = null; }
    if (!on) return;
    this.ghost = new THREE.Group();
    for (const p of this.pieces[this.set]) {
      const g = new THREE.Group(); g.position.copy(p.userData.home);
      for (const m of p.children) { const gm = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.07, depthWrite: false })); gm.position.copy(m.position); g.add(gm); }
      g.userData.piece = p; p.userData.ghost = g; this.ghost.add(g);
    }
    this.group.add(this.ghost);
  }
  hint() {
    const left = this.pieces[this.set].filter((p) => !p.userData.placed);
    if (!left.length) return null;
    const p = left[(Math.random() * left.length) | 0];
    this.hintPiece = p; this.hintT = 0;
    return p;
  }

  clear() {
    this.group.clear(); this.labels.clear(); this.group.add(this.labels);
    this.set = null; this.mode = null; this.held = null; this.ghost = null; this.hintPiece = null;
  }

  makeLabels() {
    this.labels.clear();
    const L = this.app.lang;
    for (const p of this.pieces[this.set] || []) {
      const info = partInfo(p.userData.cid, L); if (!info) continue;
      const lb = new Label([info.name], { height: 0.015, offset: new THREE.Vector3(0, -0.01, 0.03), cx: 0.5, cy: 1, big: 26, leader: false });
      lb.userData.piece = p; this.labels.add(lb);
    }
    this.relabel();
  }
  relabel(k = this.app.labelScale()) {
    for (const lb of this.labels.children) { const p = lb.userData.piece; lb.position.copy(p.position); lb.position.y -= p.userData.box * 0.5; lb.setScale(k); }
  }

  // ------------------------------------------------------------ picking and moving
  pick(raycaster) {
    const ms = []; for (const p of this.pieces[this.set] || []) if (!(this.mode === 'game' && p.userData.placed)) for (const m of p.children) { m.userData.piece = p; ms.push(m); }
    const h = raycaster.intersectObjects(ms, false)[0];
    return h ? { piece: h.object.userData.piece, point: h.point, distance: h.distance } : null;
  }
  // world point -> body space
  toBody(v) { return this.group.worldToLocal(v.clone()); }
  grab(piece, worldPoint) {
    this.held = { piece, off: piece.position.clone().sub(this.toBody(worldPoint)) };
    piece.userData.anim = null;
  }
  moveTo(worldPoint) {
    if (!this.held) return;
    this.held.piece.position.copy(this.toBody(worldPoint)).add(this.held.off);
  }
  // returns 'placed' | 'miss' | null
  release() {
    if (!this.held) return null;
    const p = this.held.piece; this.held = null;
    const d = p.position.distanceTo(p.userData.home);
    if (d < Math.max(0.07, p.userData.size * 0.35)) {
      p.userData.placed = true; this.placed++;
      p.userData.anim = { from: p.position.clone(), to: p.userData.home.clone(), t: 0, dur: 0.35 };
      if (p.userData.ghost) p.userData.ghost.visible = false;
      return 'placed';
    }
    return 'miss';
  }
  total() { return (this.pieces[this.set] || []).length; }
  done() { return this.mode === 'game' && this.placed >= this.total(); }

  update(dt, t) {
    if (!this.set) return;
    this.t += dt;
    const e = Math.min(1, this.t / this.dur), s = e < 0.5 ? 4 * e ** 3 : 1 - Math.pow(-2 * e + 2, 3) / 2;
    for (const p of this.pieces[this.set]) {
      const u = p.userData;
      if (u.anim) { u.anim.t += dt; const f = Math.min(1, u.anim.t / u.anim.dur); p.position.lerpVectors(u.anim.from, u.anim.to, f * (2 - f)); if (f >= 1) u.anim = null; }
      else if (!this.settled && this.held?.piece !== p && !(this.mode === 'game' && u.placed)) p.position.lerpVectors(u.from, u.to, s);
      const sel = this.app.selPiece === p, hint = this.hintPiece === p;
      for (const m of p.children) {
        const k = sel ? 0.3 + 0.2 * Math.sin(t * 4) : hint ? 0.25 + 0.25 * Math.sin(t * 6) : 0;
        m.material.emissive.setRGB(k, k * 0.8, k * 0.4);
      }
      if (hint && u.ghost) for (const gm of u.ghost.children) gm.material.opacity = 0.15 + 0.15 * Math.sin(t * 6);
    }
    if (e >= 1) this.settled = true;
    if (this.mode === 'explode') this.relabel();
  }
}
