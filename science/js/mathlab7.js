// Maths lab, batch 7: positive and negative tokens that cancel in zero pairs (Class 6, The Other Side of Zero), and a
// Tower of Hanoi with three pegs and four discs (Class 9, Predicting What Comes Next).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';
import { paper, flat, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

// a label on a dark rounded tag, readable on wood, white card and the cream mat (w × d metres)
function pill(text, w, d, y = 0.0004, fg = '#ffe9a8') {
  const t = canvasTex(256, Math.round((256 * d) / w), (x, W, H) => { x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(30,42,56,0.9)'; const r = H * 0.45;
    x.beginPath(); x.moveTo(r, 2); x.lineTo(W - r, 2); x.arc(W - r, H / 2, H / 2 - 2, -Math.PI / 2, Math.PI / 2); x.lineTo(r, H - 2); x.arc(r, H / 2, H / 2 - 2, Math.PI / 2, -Math.PI / 2); x.fill();
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${Math.round(H * 0.62)}px sans-serif`; x.fillText(text, W / 2, H / 2 + 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 2; return m;
}
const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
// a round face with a sign on it (the top of a token)
const faceTex = (sign, bg) => canvasTex(128, 128, (x, W, H) => { x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 7; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 12, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#ffffff'; const t = 13, L = 38; x.fillRect(W / 2 - L, H / 2 - t / 2, 2 * L, t); if (sign > 0) x.fillRect(W / 2 - t / 2, H / 2 - L, t, 2 * L); });

// ------------------------------------------------------------------ positive and negative tokens on a tray
export function integerTokens(o = {}) {
  const it = new Item('mtokens', { ...o, name: o.name || { en: 'Positive and negative tokens', hi: 'धनात्मक और ऋणात्मक टोकन', hg: 'Positive aur negative tokens' } });
  const Y = 0.003, R = 0.012, H = 0.0045, S = 0.03, U0 = -0.15, VP = 0.035, VN = -0.012, BIN = [0.125, 0.088];
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  it.g.add(flat(rect(-0.198, -0.113, 0.198, 0.113), paper(0xf3ecd8), Y - 0.0004)); // a cream mat
  // the "zero" dish at the right, where zero pairs and taken-away tokens go
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.006, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a96a3, roughness: 0.5, side: THREE.DoubleSide }));
  dish.position.set(BIN[0], Y + 0.003, -BIN[1]); it.g.add(dish);
  const dl = topLabel('0', 0.04, 0.04, '#5b6773', Y + 0.0003); dl.position.set(BIN[0], Y + 0.0003, -BIN[1]); it.g.add(dl);
  const geo = new THREE.CylinderGeometry(R, R, H, 32), side = { p: new THREE.MeshStandardMaterial({ color: 0x1f5fb8, roughness: 0.45 }), n: new THREE.MeshStandardMaterial({ color: 0xc8322a, roughness: 0.45 }) };
  const top = { p: new THREE.MeshStandardMaterial({ map: faceTex(1, '#2a72d4'), roughness: 0.5 }), n: new THREE.MeshStandardMaterial({ map: faceTex(-1, '#d63a2f'), roughness: 0.5 }) };
  // 10 positive and 6 negative tokens; each has a place (u, v) and is shown (s = 1) or hidden (s = 0)
  const mk = (kind) => { const m = new THREE.Mesh(geo, [side[kind], top[kind], side[kind]]); m.visible = false; it.g.add(m); return { m, kind, u: 0, v: 0, s: 0, a: null, b: null }; };
  const P = Array.from({ length: 10 }, () => mk('p')), Nn = Array.from({ length: 6 }, () => mk('n'));
  const draw = (t, u, v, s, lift = 0) => { t.m.visible = s > 0.02; t.m.scale.setScalar(Math.max(0.02, s)); t.m.position.set(u, Y + H / 2 + lift, -v); };
  const set = (t, u, v, s) => { Object.assign(t, { u, v, s }); draw(t, u, v, s); };
  it.spot = (i, row) => [U0 + i * S, row === 'n' ? VN : VP];
  // places every token at once (no motion): np positive tokens and nn negative tokens in their rows
  it.reset = (np, nn) => { P.forEach((t, i) => set(t, ...it.spot(i, 'p'), i < np ? 1 : 0)); Nn.forEach((t, i) => set(t, ...it.spot(i, 'n'), i < nn ? 1 : 0)); };
  // a plan of moves: [{ t: 'p' | 'n', i, to: [u, v] | 'bin', s }] made over k: 0 → 1 (tokens hop in an arc)
  let plan = [];
  it.plan = (list) => { plan = list.map((p) => { const t = (p.t === 'n' ? Nn : P)[p.i]; const to = p.to === 'bin' ? [BIN[0] + (Math.random() - 0.5) * 0.02, BIN[1] + (Math.random() - 0.5) * 0.02] : p.to || [t.u, t.v];
    return { t, a: [t.u, t.v, t.s], b: [to[0], to[1], p.s ?? (p.to === 'bin' ? 0 : 1)] }; }); };
  it.go = (k) => { const e = ease(clamp01(k)); for (const { t, a, b } of plan) { const u = lerp(a[0], b[0], e), v = lerp(a[1], b[1], e), s = lerp(a[2], b[2], e);
    const hop = Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.001 ? Math.sin(Math.PI * e) * 0.025 : 0; draw(t, u, v, s, hop); if (k >= 1) Object.assign(t, { u: b[0], v: b[1], s: b[2] }); } };
  it.reset(0, 0);
  const W = at3(it, Y);
  const AT = { pos: [U0 + 2 * S, VP + 0.03], neg: [U0 + 2 * S, VN - 0.036], below: [-0.02, -0.08], bin: [BIN[0] - 0.1, BIN[1] - 0.01], pairs: [U0 + 7 * S, VN - 0.042], row: [U0 + 4.5 * S, VN - 0.02] };
  it.at = (k) => W(AT[k][0], AT[k][1], 0.02);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ the Tower of Hanoi: three pegs and four discs
export function towerOfHanoi(o = {}) {
  const it = new Item('mhanoi', { ...o, name: o.name || { en: 'Tower of Hanoi: three pegs and four discs', hi: 'हनोई की मीनार: तीन खूँटियाँ और चार चकतियाँ', hg: 'Tower of Hanoi: teen pegs aur chaar discs' } });
  const Y = 0.003, PU = [-0.12, 0, 0.12], PV = 0.07, PH = 0.085, DH = 0.0115, TOPY = Y + 0.012 + PH + 0.02;
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  // the wooden base and the three pegs, with A, B and C written in front of them
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.12), new THREE.MeshStandardMaterial({ map: woodTex('#9c6b3e'), roughness: 0.7 }));
  base.position.set(0, Y + 0.006, -(PV - 0.01)); it.g.add(base);
  const pegM = new THREE.MeshStandardMaterial({ color: 0xd9b27c, roughness: 0.55 });
  PU.forEach((u, j) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, PH, 16), pegM); p.position.set(u, Y + 0.012 + PH / 2, -PV); it.g.add(p);
    const l = pill('ABC'[j], 0.03, 0.018, Y + 0.0125); l.position.set(u, Y + 0.0125, -(PV - 0.058)); it.g.add(l); });
  // the discs: an annulus with a hole for the peg, the biggest at the bottom
  const COL = [0xe8b130, 0x3aa266, 0x2e78c8, 0xc8452f], RAD = [0.021, 0.029, 0.037, 0.045];
  const discs = RAD.map((r, i) => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, 0.0055, 0, Math.PI * 2, true); s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth: DH - 0.002, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 2, curveSegments: 40 }); g.rotateX(-Math.PI / 2); g.translate(0, 0.001, 0);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: COL[i], roughness: 0.4 })); m.visible = false; it.g.add(m); return m; });
  let pegs = [[], [], []], n = 0;
  const yOn = (h) => Y + 0.012 + h * DH;
  const place = () => pegs.forEach((st, j) => st.forEach((d, h) => { discs[d].position.set(PU[j], yOn(h), -PV); }));
  // n discs on peg A, the others put away
  it.setN = (m) => { n = m; pegs = [[], [], []]; for (let d = m - 1; d >= 0; d--) pegs[0].push(d); discs.forEach((d, i) => { d.visible = i < m; }); place(); it.moves = 0; };
  // the least moves that carry n discs from peg a to peg c, using peg b
  it.solve = (m = n, a = 0, c = 2, b = 1, out = []) => { if (m === 0) return out; it.solve(m - 1, a, b, c, out); out.push([a, c]); it.solve(m - 1, b, c, a, out); return out; };
  // the top disc of peg a goes up, across and down onto peg c (k: 0 → 1)
  let cur = null;
  it.move = (a, c, k) => { if (!cur) { const d = pegs[a].pop(); cur = { d, y0: yOn(pegs[a].length), y1: yOn(pegs[c].length) }; }
    const m = discs[cur.d], e = clamp01(k);
    if (e < 0.35) { const s = ease(e / 0.35); m.position.set(PU[a], lerp(cur.y0, TOPY, s), -PV); }
    else if (e < 0.65) { const s = ease((e - 0.35) / 0.3); m.position.set(lerp(PU[a], PU[c], s), TOPY + Math.sin(Math.PI * s) * 0.012, -PV); }
    else { const s = ease((e - 0.65) / 0.35); m.position.set(PU[c], lerp(TOPY, cur.y1, s), -PV); }
    if (k >= 1) { pegs[c].push(cur.d); cur = null; it.moves++; it.count(it.moves); } };
  // the move counter on the base, and the table of results on a card in front
  let cntL = null;
  it.count = (v) => { if (cntL) { it.g.remove(cntL); cntL.material.map.dispose(); } cntL = pill(String(v), 0.034, 0.018, Y + 0.0126, '#ffffff'); cntL.position.set(0.172, Y + 0.0126, -(PV - 0.058)); it.g.add(cntL); };
  const CV = -0.038, RW = [CV + 0.021, CV, CV - 0.021];
  it.g.add(flat(rect(-0.17, CV - 0.032, 0.17, CV + 0.03), paper(0xfbf9f3), Y));
  const cell = (t, u, v, c = '#1e3a5f', w = 0.05) => { const l = topLabel(t, w, 0.018, c, Y + 0.0005); l.position.set(u, Y + 0.0005, -v); it.g.add(l); return l; };
  const COLU = [-0.06, 0, 0.06, 0.12];
  cell('n', -0.13, RW[0], '#5b6773', 0.03); cell('Tₙ', -0.13, RW[1], '#5b6773', 0.04); cell('Tₙ + 1', -0.125, RW[2], '#2e7d4f', 0.06);
  COLU.forEach((u, i) => cell(String(i + 1), u, RW[0], '#5b6773', 0.03));
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.0012), new THREE.MeshBasicMaterial({ color: 0x9aa5b1 })); line.rotation.x = -Math.PI / 2; line.position.set(0, Y + 0.0004, -(CV + 0.0105)); it.g.add(line);
  const res = [null, null, null, null];
  it.result = (m, v) => { if (res[m - 1]) it.g.remove(res[m - 1]); res[m - 1] = cell(String(v), COLU[m - 1], RW[1], '#b0402a', 0.04); };
  // the third row: each result plus 1, that is 2, 4, 8, 16
  it.plusOne = () => COLU.forEach((u, i) => cell(String(2 ** (i + 1)), u, RW[2], '#2e7d4f', 0.04));
  it.setN(1); it.count(0);
  const W = at3(it, Y);
  const AT = { mid: [-0.06, PV, 0.05], mid2: [0.06, PV, 0.05], card: [0.03, CV, 0.02], counter: [0.172, PV - 0.058, 0.02] };
  it.at = (k) => W(AT[k][0], AT[k][1], AT[k][2]);
  it.noGrab = true; it.height = 0.1; it.radius = 0.2; it.grabY = 0.005; return it;
}
