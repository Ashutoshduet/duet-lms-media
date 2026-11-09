// Physics (Class 8): a coil on an iron nail (an electromagnet that picks up paper clips), a lemon battery with an LED (a real
// diode in the circuit solver), a nichrome wire on cardboard that heats up, two ring magnets on a stick, a plastic scale and
// balloons that carry electric charge (Coulomb forces, balloons hanging like pendulums), a soft spring with objects, and
// an empty bottle pushed under water.
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex, glassMat } from './mats.js';
import { fieldAt } from './magnet.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const steel = (c = 0x9aa0a6, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.85, roughness: r });
const term = (it, key, local, dir = V3(0, 1, 0)) => { it.terms = it.terms || {}; it.terms[key] = { item: it, local, dir }; };
export const G = 9.8;

// ------------------------------------------------------------------ an iron nail with insulated copper wire wound on it; with a current it is an electromagnet (the iron makes the field ~40× stronger)
export function nailCoil(o = {}) {
  const turns = o.turns ?? 30, L = 0.075; const it = new Item('nailcoil', { ...o, name: o.name || { en: `Iron nail with a coil of ${turns} turns`, hi: `${turns} फेरों की कुंडली वाली लोहे की कील`, hg: `${turns} turns ki coil wali iron nail` } });
  const nailM = steel(0x7d8288, 0.4); const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, L, 12), nailM); shaft.rotation.z = Math.PI / 2; shaft.position.set(0, 0.0045, 0); it.g.add(shaft);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.0015, 16), nailM); head.rotation.z = Math.PI / 2; head.position.set(-L / 2, 0.0045, 0); it.g.add(head);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0022, 0.008, 12), nailM); tip.rotation.z = -Math.PI / 2; tip.position.set(L / 2 + 0.004, 0.0045, 0); it.g.add(tip);
  const cl = L * 0.7, R = 0.0034; const pts = []; for (let i = 0; i <= turns * 24; i++) { const t = i / (turns * 24); const a = t * turns * Math.PI * 2; pts.push(V3(-cl / 2 + t * cl, 0.0045 + Math.sin(a) * R, Math.cos(a) * R)); }
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, 0.0009, 6), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.45 })); it.g.add(coil);
  for (const s of [-1, 1]) { const ld = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(s * cl / 2, 0.0045 + R, 0), V3(s * (cl / 2 + 0.008), 0.009, 0.01), V3(s * (cl / 2 + 0.012), 0.004, 0.02)]), 10, 0.0009, 6), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.45 })); it.g.add(ld); }
  term(it, 'a', V3(-cl / 2 - 0.012, 0.004, 0.02), V3(-0.3, 1, 0.3)); term(it, 'b', V3(cl / 2 + 0.012, 0.004, 0.02), V3(0.3, 1, 0.3));
  it.turns = turns; it.core = o.core ?? 40; it.I = 0; it.dc = () => [{ a: 'a', b: 'b', R: 0.35 + turns * 0.004 }];
  it.segs = () => { it.g.updateWorldMatrix(true, false); const out = []; const n = turns * 4; for (let i = 0; i < n; i++) { const p = (t) => it.g.localToWorld(V3(-cl / 2 + t * cl, 0.0045 + Math.sin(t * turns * Math.PI * 2) * R, Math.cos(t * turns * Math.PI * 2) * R)); out.push([p(i / n), p((i + 1) / n), it.core]); } return out; };
  it.strength = () => Math.abs(it.Is ?? it.I ?? 0) * turns; // ampere-turns
  it.tipWorld = (out = V3(0, 0, 0)) => it.g.localToWorld(out.set(L / 2 + 0.008, 0.0045, 0));
  it.height = 0.01; it.radius = L / 2 + 0.01; it.grabY = 0.0045; return it;
}
// ------------------------------------------------------------------ a little heap of steel paper clips; some cling to the tip of an electromagnet and fall when it is switched off
export function clipPile(n = 14, o = {}) {
  const it = new Item('clips', { ...o, name: o.name || { en: 'Paper clips (steel)', hi: 'पेपर क्लिप (स्टील)', hg: 'Paper clips (steel)' } });
  const shape = []; const w = 0.0035, l = 0.012; for (let i = 0; i <= 60; i++) { const t = i / 60; // a clip outline: a loop inside a loop
    const a = t * Math.PI * 2 * 1.75; const r = t < 0.57 ? w : w * 0.62; const y = Math.cos(a) > 0 ? l / 2 - r : -l / 2 + r; shape.push(V3(Math.sin(a) * r, y + Math.cos(a) * r * 0.9 * (Math.abs(Math.cos(a)) > 0.3 ? 1 : 0), 0)); }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shape), 80, 0.00045, 5); const mat = steel(0xc9cdd2, 0.25);
  it.clips = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); const a = Math.random() * Math.PI * 2, r = Math.random() * 0.02; m.position.set(Math.cos(a) * r, 0.0006 + (i % 3) * 0.0009, Math.sin(a) * r); m.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI); it.g.add(m); it.clips.push({ m, home: m.position.clone(), q: m.quaternion.clone(), on: false }); }
  it.follow = null; // () => world point of the magnet tip
  it.update = (dt) => { if (!it.follow) return; const tp = it.follow(); let k = 0; for (const c of it.clips) { if (!c.on) continue; const local = it.g.worldToLocal(tp.clone().add(V3(0.003 * Math.sin(k * 2.4), -0.006 - k * 0.0095, 0.003 * Math.cos(k * 2.4)))); c.m.position.lerp(local, Math.min(1, dt * 14)); c.m.rotation.set(0, k * 0.7, 0.2 * Math.sin(k)); k++; } };
  it.cling = (k) => { let c0 = it.clips.filter((c) => c.on).length; for (const c of it.clips) { if (c0 >= k) break; if (!c.on) { c.on = true; c0++; } } };
  it.drop = async (keep, K) => { const on = it.clips.filter((c) => c.on); const fall = on.slice(keep); for (const c of fall) c.on = false; if (K) { const st = fall.map((c) => c.m.position.clone()); await K.tween(0.45, (k) => fall.forEach((c, i) => { c.m.position.lerpVectors(st[i], c.home, k * k); c.m.quaternion.slerp(c.q, k); })); } };
  it.count = () => it.clips.filter((c) => c.on).length;
  it.height = 0.004; it.radius = 0.025; it.grabY = 0.002; return it;
}
// ------------------------------------------------------------------ a lemon with a copper strip (+) and an iron nail (−) pushed in: a simple cell, about 0.55 V, very weak (high internal resistance)
export function lemon(o = {}) {
  const it = new Item('lemon', { ...o, name: o.name || { en: 'Lemon with a copper strip and an iron nail', hi: 'ताँबे की पट्टी और लोहे की कील लगा नींबू', hg: 'Copper strip aur iron nail laga nimbu' } });
  const t = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#f2cf2c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${200 + Math.random() * 40},${160 + Math.random() * 40},20,0.35)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 0.8 + Math.random() * 1.4, 0, 6.29); x.fill(); } });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 })); body.scale.set(0.034, 0.026, 0.026); body.position.y = 0.025; it.g.add(body);
  for (const s of [-1, 1]) { const tipM = new THREE.Mesh(new THREE.SphereGeometry(0.004, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd9b52a, roughness: 0.6 })); tipM.position.set(s * 0.034, 0.025, 0); tipM.scale.set(1.4, 0.8, 0.8); it.g.add(tipM); }
  const cu = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.04, 0.0008), steel(0xc8743a, 0.3)); cu.position.set(-0.012, 0.045, 0); it.g.add(cu);
  const fe = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.04, 10), steel(0x7d8288, 0.45)); fe.position.set(0.012, 0.045, 0); it.g.add(fe); const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0012, 12), steel(0x7d8288, 0.45)); fh.position.set(0.012, 0.065, 0); it.g.add(fh);
  term(it, '+', V3(-0.012, 0.064, 0), V3(-0.3, 1, 0.3)); term(it, '-', V3(0.012, 0.066, 0), V3(0.3, 1, 0.3));
  it.volts = 0.55; it.rInt = 1500; it.height = 0.066; it.radius = 0.035; it.grabY = 0.025; return it;
}
// ------------------------------------------------------------------ a red LED on a little board: a diode (current only from a to b, about 1.7 V across it), glows with the current
export function ledDiode(o = {}) {
  const it = new Item('diode', { ...o, name: o.name || { en: 'LED (red)', hi: 'LED (लाल)', hg: 'LED (red)' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.024), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.004; it.g.add(base);
  const eM = new THREE.MeshPhysicalMaterial({ color: 0xd8262a, roughness: 0.15, transparent: true, opacity: 0.85, emissive: 0xff2020, emissiveIntensity: 0 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0028, 0.0045, 20), eM); body.position.y = 0.0225; it.g.add(body); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.0026, 20, 10, 0, 6.29, 0, Math.PI / 2), eM); dome.position.y = 0.02475; it.g.add(dome);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.012 + (s < 0 ? 0.002 : 0), 4), steel(0xb8bcc0)); leg.position.set(s * 0.0013, 0.014, 0); it.g.add(leg); }
  const hc = document.createElement('canvas'); hc.width = hc.height = 64; const hx = hc.getContext('2d'); const gr = hx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,80,60,1)'); gr.addColorStop(1, 'rgba(255,40,40,0)'); hx.fillStyle = gr; hx.fillRect(0, 0, 64, 64);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.y = 0.024; halo.scale.setScalar(0.03); it.g.add(halo);
  term(it, 'a', V3(-0.012, 0.01, 0.005), V3(-0.4, 1, 0.3)); term(it, 'b', V3(0.012, 0.01, 0.005), V3(0.4, 1, 0.3));
  it.Vf = 1.7; it.Ron = 150; it.fwd = false; it.dv = 0; it.glow = 0;
  it.dc = () => (it.fwd ? [{ a: 'a', b: 'b', E: it.Vf, r: it.Ron }] : [{ a: 'a', b: 'b', R: 1e8 }]);
  it.update = (dt) => { const Iled = it.fwd ? -(it.Is || 0) : 0; if (it.fwd && Iled < 0) it.fwd = false; else if (!it.fwd && it.dv > it.Vf + 0.02) it.fwd = true; it.Iled = Math.max(0, Iled);
    const g = Math.min(1, it.Iled / 0.0006); it.glow += (g - it.glow) * Math.min(1, dt * 8); eM.emissiveIntensity = it.glow * 3; halo.material.opacity = Math.min(0.95, it.glow * 1.2); halo.scale.setScalar(0.012 + 0.04 * it.glow); };
  it.height = 0.028; it.radius = 0.02; it.grabY = 0.012; return it;
}
// ------------------------------------------------------------------ a 10 cm nichrome wire tied between two nails on a cardboard; it heats up with the current (P = I²R)
export function hotWireCard(o = {}) {
  const it = new Item('hotwire', { ...o, name: o.name || { en: 'Nichrome wire between two nails on a cardboard', hi: 'गत्ते पर दो कीलों के बीच नाइक्रोम तार', hg: 'Gatte par do keelon ke beech nichrome wire' } });
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.004, 0.1), new THREE.MeshStandardMaterial({ color: 0xb79a6c, roughness: 0.95 })); card.position.y = 0.002; it.g.add(card);
  for (const s of [-1, 1]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 8), steel(0x8a8f96, 0.4)); n.position.set(s * 0.025, 0.017, 0); it.g.add(n); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.0012, 12), steel(0x8a8f96, 0.4)); h.position.set(s * 0.025, 0.032, 0); it.g.add(h); }
  const wM = new THREE.MeshStandardMaterial({ color: 0x8d8f91, metalness: 0.85, roughness: 0.3, emissive: 0xff3a10, emissiveIntensity: 0 });
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, 0.05, 6), wM); w.rotation.z = Math.PI / 2; w.position.y = 0.022; it.g.add(w);
  term(it, 'a', V3(-0.025, 0.033, 0), V3(-0.4, 1, 0.2)); term(it, 'b', V3(0.025, 0.033, 0), V3(0.4, 1, 0.2));
  it.R = 1.56; it.T = 30; it.dc = () => [{ a: 'a', b: 'b', R: it.R }];
  it.update = (dt) => { const l = (it.lab && it.lab.chem && it.lab.chem.lapse) || 1; const P = (it.I || 0) ** 2 * it.R; const Teq = 30 + P * 20; it.T += (Teq - it.T) * Math.min(1, (dt * l) / 4); wM.emissiveIntensity = Math.max(0, (it.T - 380) / 300); };
  it.height = 0.034; it.radius = 0.06; it.grabY = 0.01; return it;
}
// ------------------------------------------------------------------ two ring magnets on an upright stick; with like poles facing, the upper one floats
export function ringMagnets(o = {}) {
  const it = new Item('rings', { ...o, name: o.name || { en: 'Two ring magnets on a wooden stick', hi: 'लकड़ी की छड़ी पर दो वलय चुंबक', hg: 'Lakdi ki stick par do ring magnets' } });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.012, 32), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.006; it.g.add(base);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 12), new THREE.MeshStandardMaterial({ map: woodTex('#c49a63'), roughness: 0.7 })); stick.position.y = 0.092; it.g.add(stick);
  const ringG = (col) => { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.absarc(0, 0, 0.022, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, 0.0055, 0, Math.PI * 2, true); sh.holes.push(hole); const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelSize: 0.0006, bevelThickness: 0.0006, bevelSegments: 2, curveSegments: 32 }); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.6, metalness: 0.3 })); g.add(m); const dot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 12), new THREE.MeshBasicMaterial({ color: col })); dot.rotation.x = -Math.PI / 2; dot.position.set(0.015, 0.0088, 0); g.add(dot); g.dot = dot; return g; };
  const low = ringG(0xd32f2f); low.position.y = 0.012; it.g.add(low); const up = ringG(0xd32f2f); it.g.add(up); it.up = up;
  it.like = true; it.y = 0.06; it.v = 0; it.hold = null; // gap physics for the upper ring; hold: forced height (a hand pressing / holding it)
  it.update = (dt) => { if (it.hold != null) { it.y = it.hold; it.v = 0; } else { let rem = Math.min(dt, 0.05); while (rem > 1e-6) { const h = Math.min(rem, 0.002); const gap = Math.max(0.002, it.y - 0.0208); const F = it.like ? 1.2e-4 / (gap * gap) : -1.2e-4 / (gap * gap); const a = F / 0.03 - G - 1.6 * it.v; it.v += a * h; it.y += it.v * h; if (it.y < 0.0208) { it.y = 0.0208; it.v = Math.max(0, it.v) * (it.like ? 0.3 : 0); } rem -= h; } } up.position.y = it.y; };
  it.flip = () => { it.like = !it.like; up.rotation.x = it.like ? 0 : Math.PI; up.position.x = 0; }; // turned over: its lower face now has the opposite pole
  it.gap = () => Math.max(0, it.y - 0.0208); it.height = 0.17; it.radius = 0.045; it.grabY = 0.08; return it;
}
// ------------------------------------------------------------------ electric charge: a balloon hanging on a thread (a pendulum pushed by Coulomb forces), wool, a plastic scale and paper bits
export const KC = 9e9;
export function balloonPair(o = {}) {
  const it = new Item('balloons', { ...o, name: o.name || { en: 'Two balloons hanging on threads', hi: 'धागों से लटके दो गुब्बारे', hg: 'Dhaagon se latke do balloons' } });
  const H = 0.62, Lt = 0.3, R = 0.07, sep = o.sep ?? 0.165; const st = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.12), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 })); st.position.set(-0.24, 0.006, 0); it.g.add(st);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, H, 12), steel()); rod.position.set(-0.26, H / 2, 0); it.g.add(rod); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.36, 10), steel()); arm.rotation.z = Math.PI / 2; arm.position.set(-0.08, H - 0.01, 0); it.g.add(arm);
  const cols = [0x2f7fd6, 0xe0403a]; it.b = [-1, 1].map((s, i) => { const piv = new THREE.Group(); piv.position.set(s * sep / 2, H - 0.014, 0); it.g.add(piv);
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, Lt, 5), new THREE.MeshStandardMaterial({ color: 0xf2efe6 })); th.position.y = -Lt / 2; piv.add(th);
    const bm = new THREE.MeshPhysicalMaterial({ color: cols[i], roughness: 0.25, clearcoat: 0.7 }); const b = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 24), bm); b.scale.set(1, 1.18, 1); b.position.y = -Lt - R * 1.18; piv.add(b); const kn = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.01, 10), bm); kn.position.y = -Lt - 0.002; piv.add(kn);
    return { piv, b, th: 0, w: 0, q: 0, L: Lt + R * 1.18, m: 0.005 }; });
  it.sources = []; // other charged things near: () => [{ p: world point, q }]
  const P = V3(0, 0, 0), Q = V3(0, 0, 0);
  it.update = (dt) => {
    let rem = Math.min(dt, 0.05); while (rem > 1e-6) { const h = Math.min(rem, 0.004);
      for (const B of it.b) { B.b.getWorldPosition(P); let Fx = 0; for (const C of it.b) { if (C === B || !B.q || !C.q) continue; C.b.getWorldPosition(Q); const d = Math.max(0.1, P.distanceTo(Q)); Fx += (KC * B.q * C.q * (P.x - Q.x)) / (d * d * d); }
        for (const s of it.sources) for (const S of s()) { if (!B.q || !S.q) continue; const d = Math.max(0.08, P.distanceTo(S.p)); Fx += (KC * B.q * S.q * (P.x - S.p.x)) / (d * d * d); }
        if (it.pull) Fx += it.pull(it.b.indexOf(B)); // e.g. the low pressure of fast air blown between them
        const a = (Fx * Math.cos(B.th)) / (B.m * B.L) - (G / B.L) * Math.sin(B.th) - 2.2 * B.w; B.w += a * h; B.th += B.w * h; B.piv.rotation.z = B.th; }
      rem -= h; }
  };
  it.ballWorld = (i, out = V3(0, 0, 0)) => it.b[i].b.getWorldPosition(out);
  it.height = H; it.radius = 0.3; it.grabY = H / 2; it.noGrab = true; return it;
}
export function woolCloth(o = {}) {
  const it = new Item('wool', { ...o, name: o.name || { en: 'Woollen cloth', hi: 'ऊनी कपड़ा', hg: 'Woollen kapda' } });
  const t = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#7b2d3a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,220,220,0.18)'; x.lineWidth = 2; for (let y = 0; y < h; y += 6) for (let xx = 0; xx < w; xx += 8) { x.beginPath(); x.arc(xx, y, 3, 0, Math.PI); x.stroke(); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.07), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); m.position.y = 0.004; it.g.add(m);
  it.q = 0; it.height = 0.008; it.radius = 0.05; it.grabY = 0.004; return it;
}
export function polythene(o = {}) {
  const it = new Item('poly', { ...o, name: o.name || { en: 'Piece of polythene', hi: 'पॉलीथीन का टुकड़ा', hg: 'Polythene ka tukda' } });
  const g = new THREE.PlaneGeometry(0.09, 0.07, 10, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.random() - 0.5) * 0.008); g.computeVertexNormals(); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.3, side: THREE.DoubleSide, depthWrite: false })); m.position.y = 0.005; m.renderOrder = 6; it.g.add(m);
  it.height = 0.01; it.radius = 0.05; it.grabY = 0.005; return it;
}
export function plasticScale(o = {}) {
  const it = new Item('pscale', { ...o, name: o.name || { en: 'Plastic scale', hi: 'प्लास्टिक का स्केल', hg: 'Plastic scale' } });
  const tex = canvasTex(1024, 64, (x, w, h) => { x.fillStyle = 'rgba(80,170,230,0.55)'; x.fillRect(0, 0, w, h); x.fillStyle = '#0b2a40'; for (let mm = 0; mm <= 150; mm++) { const px = 16 + (mm / 150) * (w - 32); x.fillRect(px, 0, 1.5, mm % 10 === 0 ? 26 : mm % 5 === 0 ? 18 : 10); if (mm % 10 === 0) { x.font = '600 20px sans-serif'; x.fillText(String(mm / 10), px - 5, 50); } } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.002, 0.03), new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.85, roughness: 0.2 })); m.position.y = 0.001; it.g.add(m);
  it.q = 0; it.L = 0.16; it.tipLocal = V3(0.07, 0, 0); it.height = 0.002; it.radius = 0.08; it.grabY = 0.001; it.layH = 0.001; return it;
}
export function paperBits(n = 24, o = {}) {
  const it = new Item('bits', { ...o, name: o.name || { en: 'Small bits of paper', hi: 'कागज़ के छोटे टुकड़े', hg: 'Kaagaz ke chhote tukde' } });
  const geo = new THREE.PlaneGeometry(0.005, 0.004); geo.rotateX(-Math.PI / 2); const mat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.9, side: THREE.DoubleSide });
  it.bits = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.03; m.position.set(Math.cos(a) * r, 0.0004, Math.sin(a) * r); m.rotation.y = Math.random() * 3; it.g.add(m); it.bits.push({ m, stuck: null, v: 0 }); }
  it.near = null; // () => { p: world point under the charged scale, q }
  it.update = (dt) => {
    const s = it.near && it.near(); for (const b of it.bits) {
      if (b.stuck) { const w = b.stuck.obj.localToWorld(b.stuck.local.clone()); b.m.position.copy(it.g.worldToLocal(w)); continue; }
      if (s && s.q) { const w = b.m.getWorldPosition(V3(0, 0, 0)); const d = Math.hypot(w.x - s.p.x, w.z - s.p.z), hgt = s.p.y - w.y; if (d < 0.022 && hgt < 0.03 && hgt > 0) { b.v += dt * 2.8; b.m.position.y += b.v * dt; b.m.rotation.x += dt * 9; if (w.y + b.v * dt >= s.p.y - 0.0025) { b.stuck = { obj: s.obj, local: s.obj.worldToLocal(V3(w.x, s.p.y - 0.0022, w.z)) }; } } }
      else if (b.m.position.y > 0.0004) { b.v -= G * dt; b.m.position.y = Math.max(0.0004, b.m.position.y + b.v * dt); if (b.m.position.y === 0.0004) b.v = 0; }
    }
  };
  it.count = () => it.bits.filter((b) => b.stuck).length;
  it.height = 0.001; it.radius = 0.035; it.grabY = 0.001; return it;
}
// ------------------------------------------------------------------ a soft spring hanging from a stand, with a pointer and a scale to read the stretch; objects hang from its hook
export function hangSpring(o = {}) {
  const it = new Item('hspring', { ...o, name: o.name || { en: 'Soft spring on a stand', hi: 'स्टैंड पर लटकी नरम कमानी', hg: 'Stand par latki soft spring' } });
  const H = 0.45, L0 = 0.1, k = o.k ?? 50;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.14), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 })); base.position.y = 0.006; it.g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, H, 12), steel()); rod.position.set(-0.04, H / 2, -0.04); it.g.add(rod);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 10), steel()); arm.rotation.z = Math.PI / 2; arm.position.set(0, H - 0.01, -0.04); it.g.add(arm);
  const sc = canvasTex(64, 512, (x, w, h) => { x.fillStyle = '#f3efe2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1b1b1b'; for (let mm = 0; mm <= 200; mm++) { const y = (mm / 200) * h; x.fillRect(0, y, mm % 10 === 0 ? 30 : mm % 5 === 0 ? 20 : 12, 1.6); if (mm % 10 === 0 && mm) { x.font = '600 18px sans-serif'; x.fillText(String(mm / 10), 32, y + 6); } } });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.2), new THREE.MeshStandardMaterial({ map: sc, roughness: 0.6 })); scale.position.set(0.026, H - 0.01 - L0 - 0.1 + 0.0, -0.039); it.g.add(scale);
  const pts = []; const turns = 22; for (let i = 0; i <= turns * 20; i++) { const t = i / (turns * 20); const a = t * turns * Math.PI * 2; pts.push(V3(Math.cos(a) * 0.009, -t, Math.sin(a) * 0.009)); }
  const spr = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 20, 0.0008, 5), steel(0xc8ccd2, 0.25)); spr.position.set(0, H - 0.014, -0.04); it.g.add(spr);
  const hookG = new THREE.Group(); it.g.add(hookG); const ptr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.0015, 0.002), new THREE.MeshStandardMaterial({ color: 0xc62828 })); ptr.position.set(0.012, 0, 0); hookG.add(ptr);
  const hk = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.001, 6, 12, Math.PI * 1.5), steel()); hk.position.y = -0.005; hk.rotation.z = Math.PI * 0.75; hookG.add(hk);
  it.k = k; it.x = 0; it.v = 0; it.mass = 0; it.hookG = hookG; it.top = H - 0.014; it.L0 = L0;
  it.update = (dt) => { let rem = Math.min(dt, 0.05); while (rem > 1e-6) { const h = Math.min(rem, 0.003); const m = Math.max(0.01, it.mass + 0.01); const a = (it.mass * G - it.k * it.x) / m - 3 * it.v; it.v += a * h; it.x += it.v * h; rem -= h; } const len = L0 + it.x; spr.scale.y = len; hookG.position.set(0, it.top - len, -0.04); };
  it.stretchCm = () => Math.round(it.x * 1000) / 10; it.height = H; it.radius = 0.07; it.grabY = H * 0.5; it.noGrab = true; return it;
}
// a small object with a loop on top (stone, pencil box, tiffin box) that can hang from a hook
export function hangObj(kind = 'stone', o = {}) {
  const S = { stone: { g: 100, en: 'Small stone (100 g)', hi: 'छोटा पत्थर (100 ग्राम)', hg: 'Chhota patthar (100 g)' }, box: { g: 200, en: 'Pencil box (200 g)', hi: 'पेंसिल बॉक्स (200 ग्राम)', hg: 'Pencil box (200 g)' }, tiffin: { g: 400, en: 'Tiffin box (400 g)', hi: 'टिफ़िन बॉक्स (400 ग्राम)', hg: 'Tiffin box (400 g)' } }[kind];
  const it = new Item('hobj', { ...o, name: o.name || { en: S.en, hi: S.hi, hg: S.hg } }); let h;
  if (kind === 'stone') { const g = new THREE.IcosahedronGeometry(0.02, 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * 1.2, p.getY(i) * 0.8, p.getZ(i)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8b8680, roughness: 0.95, flatShading: true })); m.position.y = 0.016; it.g.add(m); h = 0.032; }
  else if (kind === 'box') { const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.05), new THREE.MeshStandardMaterial({ color: 0x2e6da4, roughness: 0.45, metalness: 0.3 })); m.position.y = 0.0125; it.g.add(m); h = 0.025; }
  else { for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 32), steel(0xd2d6da, 0.22)); m.position.y = 0.02 + i * 0.041; it.g.add(m); } const hd = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0025, 8, 24, Math.PI), steel(0xd2d6da, 0.22)); hd.position.y = 0.082; it.g.add(hd); h = 0.1; }
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.004, 0.0009, 6, 12), new THREE.MeshStandardMaterial({ color: 0xf2efe6 })); loop.position.y = h + 0.012; it.g.add(loop); const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0005, 0.0005, 0.012, 5), new THREE.MeshStandardMaterial({ color: 0xf2efe6 })); th.position.y = h + 0.006; it.g.add(th);
  it.mass = S.g / 1000; it.topY = h + 0.016; it.height = h + 0.016; it.radius = 0.05; it.grabY = h * 0.5; return it;
}
// ------------------------------------------------------------------ a bucket of water and an empty closed plastic bottle
export function bucket(o = {}) {
  const prof = [[0, 0], [0.1, 0], [0.105, 0.004], [0.13, 0.24], [0.133, 0.245]];
  const v = new Vessel('bucket', prof, { ...o, wall: 0.003, noRim: true, name: o.name || { en: 'Bucket of water', hi: 'पानी से भरी बाल्टी', hg: 'Paani se bhari baalti' }, glassMat: new THREE.MeshStandardMaterial({ color: 0x2f7fd6, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }) });
  v.glass.renderOrder = 5; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.133, 0.004, 8, 48), new THREE.MeshStandardMaterial({ color: 0x2f7fd6, roughness: 0.5 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.245; v.g.add(rim);
  v.grabY = 0.12; return v;
}
export function emptyBottle(o = {}) {
  const it = new Item('pbottle', { ...o, name: o.name || { en: 'Empty plastic bottle with its lid closed', hi: 'ढक्कन बंद खाली प्लास्टिक की बोतल', hg: 'Dhakkan band khaali plastic bottle' } });
  const prof = [[0.0001, 0], [0.03, 0], [0.034, 0.008], [0.034, 0.16], [0.03, 0.19], [0.014, 0.215], [0.013, 0.228]].map(([r, y]) => new THREE.Vector2(r, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), glassMat({ opacity: 0.22, edge: 0.7, color: 0xdff2ff })); m.renderOrder = 6; it.g.add(m);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.014, 20), new THREE.MeshStandardMaterial({ color: 0x2f6fc9, roughness: 0.5 })); cap.position.y = 0.235; it.g.add(cap);
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.05, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x3aa76d, roughness: 0.6, side: THREE.DoubleSide })); lab.position.y = 0.09; it.g.add(lab);
  it.vol = 650; it.mass = 0.025; it.hBot = 0; it.hTop = 0.2; it.height = 0.242; it.radius = 0.035; it.grabY = 0.12; return it;
}
void fieldAt;
