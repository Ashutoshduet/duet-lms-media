// Physics: current electricity. Real meters (an ammeter and a voltmeter with a moving needle on a printed scale), a resistance
// wire on a board, a rheostat with a sliding contact, and a circuit solver: every frame the wires are turned into nodes and
// Kirchhoff's laws give the voltage at each node, so meters read what the real circuit would show (cells have internal resistance).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const metal = (c = 0xc4c8cc, r = 0.3) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: r });
const brass = () => new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.35 });
const term = (it, key, local, dir = V3(0, 1, 0)) => { it.terms = it.terms || {}; it.terms[key] = { item: it, local, dir }; };
const screwPost = (it, x, z, col = 0xc9a24a) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0032, 0.006, 14), col === 0xc9a24a ? brass() : new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 })); m.position.set(x, 0.003, z); return m; };

// ------------------------------------------------------------------ an analogue meter: printed dial, needle, two terminals (+ red, − black)
export function meter(kind = 'A', max = 1.5, o = {}) {
  const amm = kind === 'A'; const unit = amm ? 'A' : 'V'; const lc = o.lc ?? (max <= 1.5 ? 0.05 : max <= 3 ? 0.1 : 0.5);
  const it = new Item(amm ? 'ammeter' : 'voltmeter', { ...o, name: o.name || (amm ? { en: `Ammeter (0–${max} A)`, hi: `ऐमीटर (0–${max} A)`, hg: `Ammeter (0–${max} A)` } : { en: `Voltmeter (0–${max} V)`, hi: `वोल्टमीटर (0–${max} V)`, hg: `Voltmeter (0–${max} V)` }) });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.03, 0.06), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.55 })); body.position.y = 0.015; it.g.add(body);
  const A0 = -0.85, A1 = 0.85; const ang = (val) => A0 + (A1 - A0) * Math.max(-0.03, Math.min(1.04, val / max));
  const face = canvasTex(256, 200, (x, w, h) => {
    x.fillStyle = '#f6f2e6'; x.fillRect(0, 0, w, h); const cx = w / 2, cy = h * 0.92, R = h * 0.75; x.strokeStyle = '#1b1b1b'; x.fillStyle = '#1b1b1b'; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2 + A0, -Math.PI / 2 + A1); x.stroke(); const n = Math.round(max / lc);
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + A0 + (A1 - A0) * (i / n); const major = Math.abs((i * lc) / (max / 6 > 0.25 ? 0.5 : 0.1) - Math.round((i * lc) / (max / 6 > 0.25 ? 0.5 : 0.1))) < 1e-6; const L = major ? 14 : 7; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R - L), cy + Math.sin(a) * (R - L)); x.stroke();
      if (major) { x.font = '600 15px sans-serif'; x.textAlign = 'center'; x.fillText(String(+(i * lc).toFixed(2)), cx + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26) + 5); } }
    x.font = '700 30px serif'; x.textAlign = 'center'; x.fillText(unit, cx, cy - R * 0.35); x.font = '500 11px sans-serif'; x.fillText(`DUET STEM · 0–${max} ${unit}`, cx, h - 4);
  });
  const glassF = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.05), new THREE.MeshStandardMaterial({ map: face, roughness: 0.4 })); glassF.rotation.x = -Math.PI / 2 + 0.35; glassF.position.set(0, 0.0305, -0.002); it.g.add(glassF);
  const piv = new THREE.Group(); piv.position.set(0, 0.0315 - 0.0185 * Math.sin(0.35) * 0 , 0.016); glassF.add(piv); piv.position.set(0, -0.05 * 0.42, 0.0006);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.0007, 0.038, 0.0004), new THREE.MeshBasicMaterial({ color: 0x111111 })); needle.position.y = 0.019; piv.add(needle);
  const red = screwPost(it, 0.024, 0.022, 0xc62828), blk = screwPost(it, -0.024, 0.022, 0x1a1a1a); red.position.y = 0.033; blk.position.y = 0.033; it.g.add(red, blk);
  term(it, '+', V3(0.024, 0.036, 0.022), V3(0.3, 1, 0.3)); term(it, '-', V3(-0.024, 0.036, 0.022), V3(-0.3, 1, 0.3));
  it.meterKind = kind; it.max = max; it.lc = lc; it.Rin = amm ? 0.05 : 5000; it.reading = 0; it.shown = 0; it.vel = 0;
  it.dc = () => [{ a: '+', b: '-', R: it.Rin, meter: true }];
  it.update = (dt) => { const tgt = it.reading; const acc = (tgt - it.shown) * 160 - it.vel * 18; it.vel += acc * dt; it.shown += it.vel * dt; piv.rotation.z = -ang(it.shown); }; // a damped needle
  it.read = () => Math.round(it.reading / it.lc) * it.lc; // the reading a student writes down (nearest division)
  it.height = 0.035; it.radius = 0.04; it.grabY = 0.015; return it;
}
// ------------------------------------------------------------------ a length of resistance wire (nichrome) wound on a board, two terminals
export function resistorBoard(R = 4, o = {}) {
  const it = new Item('resistor', { ...o, name: o.name || { en: `Resistance wire (nichrome), R = ${R} Ω`, hi: `प्रतिरोध तार (नाइक्रोम), R = ${R} Ω`, hg: `Resistance wire (nichrome), R = ${R} Ω` } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.035), new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3c'), roughness: 0.7 })); base.position.y = 0.005; it.g.add(base);
  const pts = []; for (let i = 0; i <= 200; i++) { const t = i / 200; const a = t * Math.PI * 2 * 16; pts.push(V3(-0.035 + t * 0.07, 0.016 + Math.sin(a) * 0.004, Math.cos(a) * 0.004)); }
  const coilM = new THREE.MeshStandardMaterial({ color: 0x8d8f91, metalness: 0.85, roughness: 0.35, emissive: 0xff4010, emissiveIntensity: 0 });
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.0004, 5), coilM); it.g.add(coil);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.072, 12), new THREE.MeshStandardMaterial({ color: 0xe8e1cf, roughness: 0.8 })); core.rotation.z = Math.PI / 2; core.position.y = 0.016; it.g.add(core);
  it.g.add(screwPost(it, -0.044, 0.008), screwPost(it, 0.044, 0.008)); it.g.children.slice(-2).forEach((m) => { m.position.y = 0.013; });
  term(it, 'a', V3(-0.044, 0.016, 0.008), V3(-0.4, 1, 0.3)); term(it, 'b', V3(0.044, 0.016, 0.008), V3(0.4, 1, 0.3));
  it.R = R; it.heat = 0; it.dc = () => [{ a: 'a', b: 'b', R: it.R }];
  it.update = (dt) => { const P = (it.I || 0) ** 2 * it.R; it.heat += (Math.min(1, P / 40) - it.heat) * Math.min(1, dt * 0.4); coilM.emissiveIntensity = Math.max(0, it.heat - 0.3) * 2.5; };
  it.height = 0.022; it.radius = 0.05; it.grabY = 0.008; return it;
}
// ------------------------------------------------------------------ a rheostat: a coil on a tube with a sliding contact; used as a variable resistance (end a to slider c)
export function rheostat(Rmax = 20, o = {}) {
  const it = new Item('rheostat', { ...o, name: o.name || { en: `Rheostat (0–${Rmax} Ω)`, hi: `धारा नियंत्रक (रिओस्टेट, 0–${Rmax} Ω)`, hg: `Rheostat (0–${Rmax} Ω)` } });
  const L = 0.16; const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, L, 32), new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#c9c2b0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7b7a76'; x.lineWidth = 1.4; for (let i = 0; i < w; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 2, h); x.stroke(); } }), metalness: 0.4, roughness: 0.5 }));
  tube.rotation.z = Math.PI / 2; tube.position.y = 0.03; it.g.add(tube);
  for (const s of [-1, 1]) { const end = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.5 })); end.position.set(s * (L / 2 + 0.003), 0.025, 0); it.g.add(end); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(L, 0.004, 0.004), metal(0x9aa0a6, 0.3)); bar.position.y = 0.05; it.g.add(bar);
  const sl = new THREE.Group(); it.g.add(sl); const sb = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5 })); sb.position.y = 0.05; sl.add(sb);
  const sp = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.008, 0.002), brass()); sp.position.y = 0.0435; sl.add(sp);
  it.g.add(screwPost(it, -L / 2 - 0.003, 0.012), screwPost(it, L / 2 + 0.003, 0.012), screwPost(it, L / 2 + 0.003, -0.012)); const ps = it.g.children.slice(-3); ps[0].position.y = 0.051; ps[1].position.y = 0.051; ps[2].position.y = 0.054;
  term(it, 'a', V3(-L / 2 - 0.003, 0.055, 0.012), V3(-0.3, 1, 0.3)); term(it, 'b', V3(L / 2 + 0.003, 0.055, 0.012), V3(0.3, 1, 0.3)); term(it, 'c', V3(L / 2 + 0.003, 0.058, -0.012), V3(0.3, 1, -0.3));
  it.k = 1; it.Rmax = Rmax; it.kShown = 1; // k: fraction of the coil between end a and the slider
  it.setK = (k) => { it.k = Math.max(0.02, Math.min(1, k)); };
  it.dc = () => [{ a: 'a', b: 'c', R: Math.max(0.05, it.Rmax * it.k) }, { a: 'c', b: 'b', R: Math.max(0.05, it.Rmax * (1 - it.k)) + 1e6 * 0 }];
  it.update = (dt) => { it.kShown += (it.k - it.kShown) * Math.min(1, dt * 6); sl.position.x = -L / 2 + 0.01 + (L - 0.02) * it.kShown; };
  it.height = 0.06; it.radius = 0.09; it.grabY = 0.03; return it;
}
// ------------------------------------------------------------------ a 12 V, 10 W bulb in a bigger holder (kind 'bulb': the solver lights it by the power it takes)
export function lampBulb(o = {}) {
  const it = new Item('bulb', { ...o, name: o.name || { en: 'Bulb (12 V, 10 W) in a holder', hi: 'होल्डर में बल्ब (12 V, 10 W)', hg: 'Holder mein bulb (12 V, 10 W)' } });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.045), new THREE.MeshStandardMaterial({ map: woodTex('#8a5a33'), roughness: 0.7 })); base.position.y = 0.006; it.g.add(base);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.018, 24), new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.5 })); sock.position.y = 0.021; it.g.add(sock);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.01, 24), metal(0xb8bcc0, 0.35)); cap.position.y = 0.034; it.g.add(cap);
  const gM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.35, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.LatheGeometry([[0.0085, 0.039], [0.014, 0.046], [0.0195, 0.055], [0.019, 0.064], [0.012, 0.074], [0.0001, 0.077]].map(([r, y]) => new THREE.Vector2(r, y)), 32), gM); glass.renderOrder = 7; it.g.add(glass);
  const fM = new THREE.MeshStandardMaterial({ color: 0x3a2a20, emissive: 0xff7a20, emissiveIntensity: 0, roughness: 0.5 });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => V3(-0.005 + (i / 39) * 0.01, 0.06 + Math.sin(i * 1.6) * 0.0007, Math.cos(i * 1.6) * 0.0007))), 80, 0.00025, 4), fM); it.g.add(fil);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.02, 4), metal(0x888888)); post.position.set(s * 0.005, 0.05, 0); it.g.add(post); }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.018, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe2a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = 0.06; glow.renderOrder = 8; glow.userData.noHit = true; it.g.add(glow);
  const L = new THREE.PointLight(0xffd18a, 0, 1.2, 2); L.position.y = 0.06; it.g.add(L);
  it.g.add(screwPost(it, -0.022, 0.012), screwPost(it, 0.022, 0.012)); it.g.children.slice(-2).forEach((m) => { m.position.y = 0.015; });
  term(it, 'a', V3(-0.022, 0.018, 0.012), V3(-0.4, 1, 0.3)); term(it, 'b', V3(0.022, 0.018, 0.012), V3(0.4, 1, 0.3));
  it.Rb = o.R ?? 11; it.Prated = o.P ?? 10; it.glowK = 0;
  it.setGlow = (b) => { it.glowK = b; fM.emissiveIntensity = b * 5; fM.emissive.setHex(0xff6a10).lerp(new THREE.Color(0xfff2d0), Math.min(1, b * 1.2)); glow.material.opacity = Math.min(0.8, b * 0.95); L.intensity = b * 0.25; };
  it.height = 0.077; it.radius = 0.03; it.grabY = 0.02; return it;
}
// ------------------------------------------------------------------ a straight test wire stretched between two terminals on a wooden strip; R = ρ l / A
export const RHO = { nichrome: 1.1e-6, copper: 1.72e-8 };
export function wireSample(o = {}) {
  const len = o.len ?? 0.15, dmm = o.d ?? 0.274, mat = o.mat ?? 'nichrome'; const A = Math.PI * (dmm / 2000) ** 2; const R = (RHO[mat] * len) / A;
  const it = new Item('resistor', { ...o, name: o.name || { en: `${mat === 'copper' ? 'Copper' : 'Nichrome'} wire, ${Math.round(len * 100)} cm`, hi: `${mat === 'copper' ? 'ताँबे' : 'नाइक्रोम'} का तार, ${Math.round(len * 100)} सेमी`, hg: `${mat === 'copper' ? 'Copper' : 'Nichrome'} wire, ${Math.round(len * 100)} cm` } });
  const L = len + 0.03; const board = new THREE.Mesh(new THREE.BoxGeometry(L, 0.008, 0.026), new THREE.MeshStandardMaterial({ map: woodTex('#a77445'), roughness: 0.7 })); board.position.y = 0.004; it.g.add(board);
  if (o.label) { const t = canvasTex(512, 64, (x, w, h) => { x.fillStyle = '#f4efe2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d1d1d'; x.font = '700 40px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.label, w / 2, h / 2 + 2); }); const tg = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.008), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); tg.rotation.x = -Math.PI / 2; tg.position.set(0, 0.0082, 0.0075); it.g.add(tg); }
  const wr = Math.max(0.00035, (dmm / 2000) * 1.5); const wM = new THREE.MeshStandardMaterial({ color: mat === 'copper' ? 0xc8743a : 0x8d8f91, metalness: 0.9, roughness: 0.3, emissive: 0xff4010, emissiveIntensity: 0 });
  const w = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, len, 8), wM); w.rotation.z = Math.PI / 2; w.position.set(0, 0.0125, -0.004); it.g.add(w);
  it.g.add(screwPost(it, -len / 2, -0.004), screwPost(it, len / 2, -0.004)); it.g.children.slice(-2).forEach((m) => { m.position.y = 0.011; });
  term(it, 'a', V3(-len / 2, 0.015, -0.004), V3(-0.4, 1, 0.3)); term(it, 'b', V3(len / 2, 0.015, -0.004), V3(0.4, 1, 0.3));
  it.R = R; it.len = len; it.dmm = dmm; it.mat = mat; it.heat = 0; it.dc = () => [{ a: 'a', b: 'b', R: it.R }];
  it.update = (dt) => { const P = (it.I || 0) ** 2 * it.R; it.heat += (Math.min(1, P / (len * 60)) - it.heat) * Math.min(1, dt * 0.4); wM.emissiveIntensity = Math.max(0, it.heat - 0.4) * 2; };
  it.height = 0.016; it.radius = L / 2; it.grabY = 0.006; return it;
}
// ------------------------------------------------------------------ the solver: nodes from wires, conductances from parts, Gaussian elimination
// parts: items with dc() → [{ a, b, R }] (resistance between terminals a and b), or [{ a: '+', b: '-', E, r }] (a source), or { open: true } (a key that is off)
export class DC {
  constructor(lab) { this.lab = lab; this.links = []; }
  link(ta, tb) { this.links.push([ta, tb]); }
  update() {
    if (!this.links.length) return;
    const id = (t) => `${t.item.id}:${Object.keys(t.item.terms).find((k) => t.item.terms[k] === t)}`;
    const par = {}; const find = (k) => { while (par[k] !== undefined && par[k] !== k) k = par[k] = par[par[k]] ?? par[k]; return k; }; const uni = (a, b) => { par[a] = par[a] ?? a; par[b] = par[b] ?? b; const ra = find(a), rb = find(b); if (ra !== rb) par[ra] = rb; };
    for (const [a, b] of this.links) uni(id(a), id(b));
    const parts = this.lab.items.filter((i) => i.terms && (i.dc || i.volts != null || i.kind === 'key' || i.kind === 'bulb'));
    const elems = [];
    for (const p of parts) {
      const T = (k) => { const n = `${p.id}:${k}`; par[n] = par[n] ?? n; return n; };
      if (p.dc) for (const e of p.dc()) elems.push({ ...e, na: T(e.a), nb: T(e.b), item: p, src: e.E != null }); // an element with E (and r) is a source: a cell, or a diode that is conducting
      else if (p.volts != null) elems.push({ E: p.volts, r: p.rInt ?? 0.15 * (p.volts / 1.5), na: T('+'), nb: T('-'), item: p, src: true });
      else if (p.kind === 'key') { if (p.on) elems.push({ R: 0.002, na: T('a'), nb: T('b'), item: p }); }
      else if (p.kind === 'bulb') elems.push({ R: p.Rb ?? 6, na: T('a'), nb: T('b'), item: p });
    }
    const roots = [...new Set(Object.keys(par).map(find))]; const idx = new Map(roots.map((r, i) => [r, i])); const n = roots.length; if (!n) return;
    const G = Array.from({ length: n }, () => new Float64Array(n + 1)); const st = (i, j, g) => { G[i][i] += g; G[j][j] += g; G[i][j] -= g; G[j][i] -= g; };
    for (let i = 0; i < n; i++) G[i][i] += 1e-9; // every node is weakly tied to ground, so a broken circuit still solves
    for (const e of elems) { const i = idx.get(find(e.na)), j = idx.get(find(e.nb)); if (i === j) continue; if (e.src) { const g = 1 / e.r; st(i, j, g); G[i][n] += e.E * g; G[j][n] -= e.E * g; } else st(i, j, 1 / e.R); }
    const gnd = elems.find((e) => e.src); if (gnd) { const k = idx.get(find(gnd.nb)); G[k].fill(0); G[k][k] = 1; G[k][n] = 0; }
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(G[r][c]) > Math.abs(G[p][c])) p = r; [G[c], G[p]] = [G[p], G[c]]; const d = G[c][c]; if (Math.abs(d) < 1e-15) continue; for (let r = 0; r < n; r++) { if (r === c) continue; const f = G[r][c] / d; if (f) for (let k = c; k <= n; k++) G[r][k] -= f * G[c][k]; } }
    const Vn = roots.map((_, i) => (Math.abs(G[i][i]) > 1e-15 ? G[i][n] / G[i][i] : 0)); const Vof = (nm) => Vn[idx.get(find(nm))];
    for (const e of elems) {
      const dv = Vof(e.na) - Vof(e.nb); const I = e.src ? (e.E - dv) / e.r : dv / e.R; e.item.I = Math.abs(I); e.item.Is = I; e.item.V = Math.abs(dv); e.item.dv = dv; // Is: signed current, from terminal a to terminal b
      if (e.meter) e.item.reading = e.item.meterKind === 'A' ? Math.max(0, I) : Math.max(0, dv);
      if (e.item.kind === 'bulb' && e.item.setGlow) e.item.setGlow(Math.min(1.2, (I * I * e.R) / (e.item.Prated ?? 1.2))); // brightness: the power it takes compared with its rating
      // too much current burns things out, as in a real circuit: a lamp's filament melts, an LED dies (and neither works again)
      if (e.item.kind === 'bulb' && !e.item.fused && I * I * e.R > 3.5 * (e.item.Prated ?? 1.2)) this.burn(e.item, { P: I * I * e.R, Pr: e.item.Prated ?? 1.2 });
      if (e.item.kind === 'diode' && !e.item.burnt && Math.abs(I) > 0.045) this.burn(e.item, { I: Math.abs(I) });
    }
  }
  burn(it, info = {}) {
    const lab = this.lab; it.fused = it.burnt = true;
    if (it.kind === 'bulb') { it.Rb = 1e9; const sg = it.setGlow; if (sg && !it._sgW) { it._sgW = true; it.setGlow = (b) => sg(it.fused ? 0 : b); } it.setGlow && it.setGlow(0); }
    else { it.Vf = 1e6; it.fwd = false; it.dc = () => [{ a: 'a', b: 'b', R: 1e9 }]; }
    const p = it.g.localToWorld(new THREE.Vector3(0, (it.height ?? 0.03) * 0.8, 0)); lab.fx && lab.fx.flashAt && lab.fx.flashAt(p, 3, 0.18, 0xfff0c8, 0.05); lab.audio && lab.audio.pop && lab.audio.pop();
    lab.emit('burnt', { obj: it.id, kind: it.kind, ...info });
  }
}
// ------------------------------------------------------------------ graph paper on a clipboard: points plotted one by one, then the best straight line through the origin
export function graphPaper(o = {}) {
  const it = new Item('graph', { ...o, name: o.name || { en: 'Graph paper', hi: 'ग्राफ़ पेपर', hg: 'Graph paper' } });
  const c = document.createElement('canvas'); c.width = 768; c.height = 768; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const x = c.getContext('2d');
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.006, 0.2), new THREE.MeshStandardMaterial({ map: woodTex('#7a5230'), roughness: 0.7 })); board.position.y = 0.003; it.g.add(board);
  const pap = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); pap.rotation.x = -Math.PI / 2; pap.position.y = 0.0062; it.g.add(pap);
  const xm = o.xmax ?? 1, ym = o.ymax ?? 5, X0 = 90, Y0 = 690, S = 620; const px = (v) => X0 + (v / xm) * S, py = (v) => Y0 - (v / ym) * S; const pts = [];
  const grid = () => { x.fillStyle = '#fcfcf6'; x.fillRect(0, 0, 768, 768); for (let i = 0; i <= 50; i++) { x.strokeStyle = i % 10 ? 'rgba(220,120,90,0.25)' : 'rgba(200,90,60,0.6)'; x.lineWidth = i % 10 ? 1 : 1.6; const g = X0 + (i / 50) * S; x.beginPath(); x.moveTo(g, Y0); x.lineTo(g, Y0 - S); x.stroke(); const h = Y0 - (i / 50) * S; x.beginPath(); x.moveTo(X0, h); x.lineTo(X0 + S, h); x.stroke(); }
    x.strokeStyle = '#111'; x.lineWidth = 3; x.beginPath(); x.moveTo(X0, Y0 - S - 10); x.lineTo(X0, Y0); x.lineTo(X0 + S + 10, Y0); x.stroke(); x.fillStyle = '#111'; x.font = '600 24px sans-serif'; x.textAlign = 'center';
    for (let i = 0; i <= 5; i++) { x.fillText(String(+((i / 5) * xm).toFixed(2)), px((i / 5) * xm), Y0 + 30); x.fillText(String(+((i / 5) * ym).toFixed(1)), X0 - 36, py((i / 5) * ym) + 8); }
    x.font = '700 28px sans-serif'; x.fillText(o.xl ?? 'I (A)', X0 + S / 2, Y0 + 66); x.save(); x.translate(30, Y0 - S / 2); x.rotate(-Math.PI / 2); x.fillText(o.yl ?? 'V (V)', 0, 0); x.restore(); tex.needsUpdate = true; };
  grid();
  it.plot = (a, b) => { pts.push([a, b]); x.fillStyle = '#1d4f9a'; x.beginPath(); x.arc(px(a), py(b), 7, 0, 6.29); x.fill(); tex.needsUpdate = true; };
  it.fit = () => { let sxy = 0, sxx = 0; for (const [a, b] of pts) { sxy += a * b; sxx += a * a; } const k = sxx ? sxy / sxx : 0; x.strokeStyle = '#c0392b'; x.lineWidth = 3; x.beginPath(); x.moveTo(px(0), py(0)); const a1 = Math.min(xm, ym / Math.max(1e-6, k)); x.lineTo(px(a1), py(k * a1)); x.stroke(); tex.needsUpdate = true; return k; };
  it.curve = () => { const q = [...pts].sort((a, b) => a[0] - b[0]); if (q.length < 2) return; x.strokeStyle = '#c0392b'; x.lineWidth = 3; x.beginPath(); x.moveTo(px(q[0][0]), py(q[0][1])); for (let i = 1; i < q.length - 1; i++) { const mx = (px(q[i][0]) + px(q[i + 1][0])) / 2, my = (py(q[i][1]) + py(q[i + 1][1])) / 2; x.quadraticCurveTo(px(q[i][0]), py(q[i][1]), mx, my); } const l = q[q.length - 1]; x.lineTo(px(l[0]), py(l[1])); x.stroke(); tex.needsUpdate = true; }; // a smooth curve through the points (e.g. a cooling curve)
  it.clear = () => { pts.length = 0; grid(); }; it.height = 0.007; it.radius = 0.1; it.grabY = 0.003; return it;
}
