// Maths lab (NCERT activities done with your hands): a paper triangle whose torn corners meet on a straight line,
// unit cubes that build cube numbers, square tiles on the sides of a right triangle (Baudhayana–Pythagoras),
// a coin and a tally board for experimental probability, a cone and a cylinder of the same base and height filled
// with water, and a paper circle cut into sectors that rearrange into a parallelogram.
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item, Vessel } from './apparatus.js';
import { canvasTex, woodTex } from './mats.js';

const paper = (c = 0xf4f0e4) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, side: THREE.DoubleSide });
const ink = (c = 0x26303a) => new THREE.LineBasicMaterial({ color: c });
// a flat shape from (u, v) points, lying on the table
function flat(points, mat, y = 0) {
  const s = new THREE.Shape(points.map(([u, v]) => new THREE.Vector2(u, v)));
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  return new THREE.Mesh(g, mat);
}
function outline(points, mat, y = 0.0004, closed = true) {
  const p = points.map(([u, v]) => new THREE.Vector3(u, y, -v)); if (closed) p.push(p[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), mat);
}
// a little seeded random, so a tear looks the same every time
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
const lerp = (a, b, k) => a + (b - a) * k;
const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

// ------------------------------------------------------------------ a paper triangle (angles 50°, 60°, 70°): tear its corners and lay them on a line
export function triangleTear(o = {}) {
  const it = new Item('mtri', { ...o, name: o.name || { en: 'Paper triangle', hi: 'काग़ज़ का त्रिभुज', hg: 'Kaagaz ka triangle' } });
  const A = [-0.165, -0.045], B = [-0.005, -0.045]; const dAC = 0.16 * Math.sin((60 * Math.PI) / 180) / Math.sin((70 * Math.PI) / 180);
  const C = [A[0] + dAC * Math.cos((50 * Math.PI) / 180), A[1] + dAC * Math.sin((50 * Math.PI) / 180)];
  const V = [A, B, C]; const deg = [50, 60, 70]; const cols = [0xf2b8b0, 0xb3cdf2, 0xbfe3b4], arcs = [0xc0392b, 0x2e6cc0, 0x2f8f3a];
  const R = rng(7); const cut = 0.034; const sub = (p, q) => [q[0] - p[0], q[1] - p[1]]; const len = (d) => Math.hypot(d[0], d[1]);
  const along = (p, q, d) => { const v = sub(p, q); const L = len(v); return [p[0] + (v[0] * d) / L, p[1] + (v[1] * d) / L]; };
  // the torn edge of each corner: from its cut on the next edge round to its cut on the previous edge, slightly ragged
  const tears = V.map((P, i) => {
    const Q = V[(i + 1) % 3], Pr = V[(i + 2) % 3]; const a0 = Math.atan2(Q[1] - P[1], Q[0] - P[0]); let a1 = Math.atan2(Pr[1] - P[1], Pr[0] - P[0]); while (a1 < a0) a1 += 2 * Math.PI;
    const pts = []; const n = 9; for (let k = 0; k <= n; k++) { const a = lerp(a0, a1, k / n); const r = cut * (k === 0 || k === n ? 1 : 0.92 + R() * 0.16); pts.push([P[0] + r * Math.cos(a), P[1] + r * Math.sin(a)]); }
    return { P, a0, a1, pts };
  });
  // the middle of the paper (what is left after tearing)
  const body = []; for (let i = 0; i < 3; i++) { const t = tears[i], tn = tears[(i + 1) % 3]; body.push(t.pts[0]); body.push(...tn.pts.slice().reverse()); }
  const bodyM = flat(body, paper(0xf3dc8f), 0.0006); it.g.add(bodyM);
  for (let i = 0; i < 3; i++) { const Q = V[(i + 1) % 3]; it.g.add(outline([along(V[i], Q, cut), along(Q, V[i], cut)], ink(), 0.0009, false)); }
  // the three corners, each built around its own tip so it can turn about it
  it.corners = tears.map((t, i) => {
    const g = new THREE.Group(); const local = [[0, 0], ...t.pts.map(([u, v]) => [u - t.P[0], v - t.P[1]])];
    g.add(flat(local, paper(cols[i]), 0.0006));
    const arc = []; for (let k = 0; k <= 16; k++) { const a = lerp(t.a0, t.a1, k / 16); arc.push([0.016 * Math.cos(a), 0.016 * Math.sin(a)]); }
    g.add(outline(arc, ink(arcs[i]), 0.0011, false)); g.add(outline([[0, 0], local[1]], ink(), 0.0011, false)); g.add(outline([[0, 0], local[local.length - 1]], ink(), 0.0011, false));
    const lab = canvasTex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#' + arcs[i].toString(16).padStart(6, '0'); x.font = '700 46px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ABC'[i], w / 2, h / 2); });
    const mid = (t.a0 + t.a1) / 2; const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.014), new THREE.MeshBasicMaterial({ map: lab, transparent: true, depthWrite: false }));
    lm.rotation.x = -Math.PI / 2; lm.position.set(0.026 * Math.cos(mid), 0.0013, -0.026 * Math.sin(mid)); g.add(lm); lm.userData.spin = true;
    g.position.set(t.P[0], 0, -t.P[1]); g.userData.home = { u: t.P[0], v: t.P[1], rot: 0 }; g.userData.a0 = t.a0; g.userData.deg = deg[i];
    it.g.add(g); return g;
  });
  // the straight line drawn on the table in front, where the corners meet
  const Lp = [0.115, -0.03]; const line = flat([[0.03, Lp[1] - 0.0007], [0.2, Lp[1] - 0.0007], [0.2, Lp[1] + 0.0007], [0.03, Lp[1] + 0.0007]], new THREE.MeshBasicMaterial({ color: 0x1d2730 }), 0.0005);
  it.g.add(line); line.visible = false; it.line = line;
  const sheet = flat([[-0.2, -0.1], [0.22, -0.1], [0.22, 0.1], [-0.2, 0.1]], paper(0xf7f7f3), 0.0002); it.g.add(sheet);
  // tear: the corners come away from the triangle; lay: they turn about their tips and meet at one point on the line
  it.tear = (k) => { const e = ease(k); it.corners.forEach((g) => { const h = g.userData.home; const b = g.userData.a0 + ((g.userData.deg * Math.PI) / 180) / 2; g.position.set(h.u - Math.cos(b) * 0.018 * e, 0.003 * Math.sin(Math.PI * k), -(h.v - Math.sin(b) * 0.018 * e)); }); };
  it.lay = (k) => {
    it.line.visible = true; let acc = 0;
    it.corners.forEach((g, i) => {
      const h = g.userData.home; const b = g.userData.a0 + ((g.userData.deg * Math.PI) / 180) / 2; const su = h.u - Math.cos(b) * 0.018, sv = h.v - Math.sin(b) * 0.018;
      const target = acc - g.userData.a0; acc += (g.userData.deg * Math.PI) / 180; const e = ease(Math.min(1, Math.max(0, k * 1.6 - i * 0.3)));
      g.position.set(lerp(su, Lp[0], e), 0.004 * Math.sin(Math.PI * e), -lerp(sv, Lp[1], e)); g.rotation.y = angLerp(0, target, e);
      g.children.forEach((c) => { if (c.userData.spin) c.rotation.z = -g.rotation.y; });
    });
  };
  it.tipWorld = () => it.g.localToWorld(new THREE.Vector3(Lp[0], 0.01, -Lp[1]));
  // a point just outside corner i (on the triangle, or after the corners are laid on the line)
  it.markAt = (i, laid, r = 0.05) => {
    const g = it.corners[i]; const a = (g.userData.deg * Math.PI) / 180; let mid, tip;
    if (laid) { let acc = 0; for (let j = 0; j < i; j++) acc += (it.corners[j].userData.deg * Math.PI) / 180; mid = acc + a / 2; tip = Lp; } else { mid = g.userData.a0 + a / 2 + Math.PI; tip = [g.userData.home.u, g.userData.home.v]; r *= 0.5; }
    return it.g.localToWorld(new THREE.Vector3(tip[0] + r * Math.cos(mid), 0.012, -(tip[1] + r * Math.sin(mid))));
  };
  it.noGrab = true; it.height = 0.01; it.radius = 0.15; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ unit cubes (2 cm each) on a tray: build 1, 2 × 2 × 2 and 3 × 3 × 3
export function unitCubes(o = {}) {
  const it = new Item('mcubes', { ...o, name: o.name || { en: 'Unit cubes', hi: 'इकाई घन (छोटे क्यूब)', hg: 'Unit cubes' } });
  const s = 0.02, gap = 0.0008; const tray = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.008, 0.15), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.7 }));
  tray.position.set(-0.17, 0.004, 0.02); it.g.add(tray);
  const cols = [0xe0573e, 0xf0a33a, 0x3f8fd8, 0x55b36a]; const geo = new THREE.BoxGeometry(s - gap, s - gap, s - gap); const edges = new THREE.EdgesGeometry(geo);
  it.cubes = [];
  for (let n = 0; n < 36; n++) {
    const grp = n === 0 ? 0 : n <= 8 ? 1 : 2; const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[grp === 0 ? 0 : grp === 1 ? 1 : 2 + (n % 2)], roughness: 0.55 }));
    m.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.35 })));
    const r = Math.floor(n / 6), c = n % 6; m.userData.from = new THREE.Vector3(-0.17 - 0.05 + c * (s + 0.002), 0.008 + s / 2, 0.02 - 0.05 + r * (s + 0.002)); m.position.copy(m.userData.from);
    m.userData.grp = grp; it.g.add(m); it.cubes.push(m);
  }
  // where each group is built: one cube, a 2-cube and a 3-cube side by side
  const spots = [new THREE.Vector3(-0.02, 0, 0.03), new THREE.Vector3(0.04, 0, 0.02), new THREE.Vector3(0.13, 0, 0.0)];
  const idx = [0, 0, 0]; it.cubes.forEach((m) => { const g = m.userData.grp, n = g + 1, k = idx[g]++; const i = k % n, j = Math.floor(k / n) % n, l = Math.floor(k / (n * n)); m.userData.to = spots[g].clone().add(new THREE.Vector3((i - (n - 1) / 2) * s, s / 2 + l * s, (j - (n - 1) / 2) * s)); m.userData.k = k; if (g) m.material.color.setHex([[0xf0a33a, 0xe07b2a], [0x3f8fd8, 0x55b36a]][g - 1][(i + j + l) % 2]); });
  it.spotWorld = (g, up = 0.04) => it.g.localToWorld(spots[g].clone().add(new THREE.Vector3(0, (g + 1) * s + up, 0)));
  it.build = (grp, k) => { const list = it.cubes.filter((m) => m.userData.grp === grp); const n = list.length; list.forEach((m) => { const st = n > 1 ? (m.userData.k / n) * 0.7 : 0; const e = ease(Math.min(1, Math.max(0, (k - st) / 0.3))); m.position.lerpVectors(m.userData.from, m.userData.to, e); m.position.y += Math.sin(Math.PI * e) * 0.05; }); };
  it.noGrab = true; it.height = 0.07; it.radius = 0.24; it.grabY = 0.01; return it;
}

// ------------------------------------------------------------------ a right triangle with sides 3, 4, 5 (units of 2.2 cm) and square tiles on its sides
export function pythagorasBoard(o = {}) {
  const it = new Item('mpyth', { ...o, name: o.name || { en: 'Right triangle with squares on its sides', hi: 'भुजाओं पर वर्ग बने समकोण त्रिभुज', hg: 'Bhujaon par square bane right triangle' } });
  const u = 0.022, Y = 0.006; const O = [-0.03, -0.03]; const P = [O[0] + 3 * u, O[1]], Q = [O[0], O[1] + 4 * u];
  const board = flat([[-0.17, -0.13], [0.2, -0.13], [0.2, 0.17], [-0.17, 0.17]], new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.75 }), 0.004);
  it.g.add(board);
  it.g.add(flat([O, P, Q], paper(0xf6e7b0), Y - 0.001)); it.g.add(outline([O, P, Q], ink(), Y));
  it.g.add(outline([[O[0] + 0.008, O[1]], [O[0] + 0.008, O[1] + 0.008], [O[0], O[1] + 0.008]], ink(), Y, false));
  const e1 = [-0.6, 0.8], e2 = [0.8, 0.6]; const H = (i, j) => [P[0] + (e1[0] * i + e2[0] * j) * u, P[1] + (e1[1] * i + e2[1] * j) * u];
  // the empty 5 × 5 square on the longest side, ruled into cells
  for (let i = 0; i <= 5; i++) { it.g.add(outline([H(i, 0), H(i, 5)], ink(0x6b7480), Y, false)); it.g.add(outline([H(0, i), H(5, i)], ink(0x6b7480), Y, false)); }
  it.g.add(outline([H(0, 0), H(5, 0), H(5, 5), H(0, 5)], ink(), Y + 0.0002));
  const tile = new THREE.BoxGeometry(u * 0.92, 0.003, u * 0.92); const ang = Math.atan2(e1[1], e1[0]);
  const mk = (c) => { const m = new THREE.Mesh(tile, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(tile), new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.3 }))); return m; };
  it.tiles = []; const target = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) target.push([i, j]);
  // red: the 3 × 3 square on the side of 3 (below it); blue: the 4 × 4 square on the side of 4 (left of it)
  let t = 0; const place = (list, c) => list.forEach(([cu, cv]) => { const m = mk(c); m.position.set(cu, Y + 0.0015, -cv); m.userData.from = m.position.clone(); m.userData.fromRot = 0; const [ti, tj] = target[t++]; const hc = H(ti + 0.5, tj + 0.5); m.userData.to = new THREE.Vector3(hc[0], Y + 0.0015, -hc[1]); m.userData.toRot = ang; m.userData.n = t; it.g.add(m); it.tiles.push(m); });
  const red = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) red.push([O[0] + (i + 0.5) * u, O[1] - (j + 0.5) * u]);
  const blue = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) blue.push([O[0] - (i + 0.5) * u, O[1] + (j + 0.5) * u]);
  // fill the big square row by row: the 9 red tiles first, then the 16 blue
  place(red, 0xe0573e); place(blue, 0x3f8fd8);
  it.move = (k) => it.tiles.forEach((m, n) => { const st = (n / it.tiles.length) * 0.65; const e = ease(Math.min(1, Math.max(0, (k - st) / 0.35))); m.position.lerpVectors(m.userData.from, m.userData.to, e); m.position.y += Math.sin(Math.PI * e) * 0.04; m.rotation.y = lerp(m.userData.fromRot, m.userData.toRot, e); });
  const W = (pt, up = 0.03) => it.g.localToWorld(new THREE.Vector3(pt[0], Y + up, -pt[1]));
  // where to put labels (asked for after the board is on the table): the middle of each square, and of each side
  const SQ = { a: [O[0] + 1.5 * u, O[1] - 1.5 * u], b: [O[0] - 2 * u, O[1] + 2 * u], c: H(2.5, 2.5) };
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; const SD = { a: mid(O, P), b: mid(O, Q), c: mid(P, Q) };
  it.at = (k) => W(SQ[k]); it.side = (k) => W(SD[k], 0.008);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a coin and a tally board: experimental probability of heads
export function coinTally(o = {}) {
  const it = new Item('mcoin', { ...o, name: o.name || { en: 'Coin and tally board', hi: 'सिक्का और गिनती का बोर्ड', hg: 'Coin aur tally board' } });
  const face = (txt, bg) => canvasTex(128, 128, (x, w, h) => { x.fillStyle = bg; x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, 7); x.fill(); x.strokeStyle = 'rgba(90,60,10,.6)'; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 8, 0, 7); x.stroke(); x.fillStyle = '#6b4a10'; x.font = '700 60px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 3); });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b24a, metalness: 0.8, roughness: 0.35 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.0022, 40), [gold, new THREE.MeshStandardMaterial({ map: face('H', '#e3c25d'), metalness: 0.5, roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: face('T', '#e3c25d'), metalness: 0.5, roughness: 0.4 })]);
  const holder = new THREE.Group(); holder.add(coin); holder.position.set(-0.08, 0.0011, 0.02); it.g.add(holder); it.coin = holder;
  it.n = 0; it.h = 0; it.hist = []; const rand = rng(709); // 7 heads in the first 10, 29 in 50, 250 in 500
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = 512; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const draw = () => {
    const x = cv.getContext('2d'); x.fillStyle = '#1f3d2c'; x.fillRect(0, 0, 768, 512); x.strokeStyle = '#8a6a3a'; x.lineWidth = 18; x.strokeRect(9, 9, 750, 494);
    x.fillStyle = '#f2f2ea'; x.font = '600 44px sans-serif'; x.textAlign = 'left';
    x.fillText(`Tosses: ${it.n}`, 40, 80); x.fillText(`Heads: ${it.h}`, 40, 140); x.fillText(`Tails: ${it.n - it.h}`, 330, 140);
    x.fillStyle = '#ffd36b'; x.font = '700 50px sans-serif'; x.fillText(`Heads ÷ Tosses = ${it.n ? (it.h / it.n).toFixed(2) : '–'}`, 40, 215);
    // the fraction after every toss, with the line at 0.5
    const gx = 40, gy = 250, gw = 690, gh = 220; x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 2; x.strokeRect(gx, gy, gw, gh);
    x.setLineDash([10, 8]); x.beginPath(); x.moveTo(gx, gy + gh / 2); x.lineTo(gx + gw, gy + gh / 2); x.stroke(); x.setLineDash([]);
    x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '500 26px sans-serif'; x.fillText('1', gx - 26, gy + 12); x.fillText('½', gx - 28, gy + gh / 2 + 9); x.fillText('0', gx - 26, gy + gh);
    if (it.hist.length > 1) { const N = Math.max(50, it.hist.length); x.strokeStyle = '#7fd1ff'; x.lineWidth = 4; x.beginPath(); it.hist.forEach((f, i) => { const px = gx + (i / (N - 1)) * gw, py = gy + gh * (1 - f); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); }
    tex.needsUpdate = true;
  };
  draw();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.16), new THREE.MeshBasicMaterial({ map: tex })); board.position.set(0.08, 0.1, -0.04); board.rotation.x = -0.18; it.g.add(board);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.03), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.7 })); legs.position.set(0.08, 0.01, -0.03); it.g.add(legs);
  // one toss: the coin flies up, spins and lands; returns true for heads
  it.next = () => { const heads = rand() < 0.5; it.n++; if (heads) it.h++; it.hist.push(it.h / it.n); return heads; };
  it.show = (heads) => { coin.rotation.x = heads ? 0 : Math.PI; };
  it.fly = (k, heads) => { const e = Math.sin(Math.PI * k); holder.position.y = 0.0011 + 0.16 * e; coin.rotation.x = (heads ? 0 : Math.PI) + (1 - k) * Math.PI * 8; if (k >= 1) it.show(heads); };
  it.draw = draw; it.boardWorld = () => it.g.localToWorld(new THREE.Vector3(0.08, 0.2, -0.04));
  it.noGrab = true; it.height = 0.18; it.radius = 0.16; it.grabY = 0.01; return it;
}

// ------------------------------------------------------------------ a cone (tip down, in a stand) and a cylinder with the same radius and height
export function cone(o = {}) {
  const wall = 0.0012, R = (o.r ?? 0.03) + wall, H = (o.h ?? 0.08) + wall, y0 = 0.035; // inside: radius 3 cm, height 8 cm
  const v = new Vessel('mcone', [[0.0008, y0], [R, y0 + H]], { ...o, wall, name: o.name || { en: 'Cone (radius 3 cm, height 8 cm)', hi: 'शंकु (कोन) — त्रिज्या 3 cm, ऊँचाई 8 cm', hg: 'Cone — radius 3 cm, height 8 cm' } });
  v.grabY = y0 + H * 0.8; v.standY = y0 + H * 0.55; v.standR = R * 0.55 + 0.002; return v;
}
// a small wire stand that holds the cone tip-down (a separate piece, so it stays put while the cone is poured)
export function coneStand(c) {
  const it = new Item('mconestand', { name: { en: 'Cone stand', hi: 'शंकु का स्टैंड', hg: 'Cone stand' } });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.35 });
  const ringY = c.standY, ringR = c.standR; const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.0016, 8, 40), steel); ring.rotation.x = Math.PI / 2; ring.position.y = ringY; it.g.add(ring);
  for (let i = 0; i < 3; i++) { const a = (i * 2 * Math.PI) / 3 + 0.5; const top = new THREE.Vector3(Math.cos(a) * ringR, ringY, Math.sin(a) * ringR), bot = new THREE.Vector3(Math.cos(a) * (ringR + 0.014), 0, Math.sin(a) * (ringR + 0.014)); const L = top.distanceTo(bot); const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, L, 8), steel); leg.position.copy(top).add(bot).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize()); it.g.add(leg); }
  it.noGrab = true; it.height = ringY; it.radius = ringR + 0.015; it.grabY = ringY; return it;
}
export function cylinder(o = {}) {
  // as tall as the cone and as wide, made to hold exactly three cones of water (o.ml)
  const wall = 0.0012, rin = o.r ?? 0.03, R = rin + wall; const H = o.ml ? wall + (o.ml / 1e6) / (Math.PI * rin * rin) : o.h ?? 0.08;
  const v = new Vessel('mcyl', [[0, 0], [R, 0], [R, H]], { ...o, wall, name: o.name || { en: 'Cylinder (radius 3 cm, height 8 cm)', hi: 'बेलन (सिलिंडर) — त्रिज्या 3 cm, ऊँचाई 8 cm', hg: 'Cylinder — radius 3 cm, height 8 cm' } });
  for (const f of [1 / 3, 2 / 3]) { const m = new THREE.Mesh(new THREE.TorusGeometry(R + 0.0004, 0.0005, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); m.rotation.x = Math.PI / 2; m.position.y = wall + (H - wall) * f; v.g.add(m); }
  v.grabY = H * 0.6; return v;
}

// ------------------------------------------------------------------ a paper circle (radius 6 cm) cut into 16 sectors, one half coloured
export function circleSectors(o = {}) {
  const it = new Item('mcircle', { ...o, name: o.name || { en: 'Paper circle cut into 16 sectors', hi: '16 बराबर टुकड़ों में कटा काग़ज़ का वृत्त', hg: '16 barabar tukdon mein kata kaagaz ka circle' } });
  const r = 0.06, n = 16, d = (2 * Math.PI) / n; const C = [-0.1, 0.02];
  const shape = []; shape.push([0, 0]); for (let k = 0; k <= 8; k++) { const a = Math.PI / 2 - d / 2 + (d * k) / 8; shape.push([r * Math.cos(a), r * Math.sin(a)]); }
  it.sectors = [];
  for (let j = 0; j < n; j++) {
    const top = j < n / 2; const g = new THREE.Group(); g.add(flat(shape, paper(top ? 0xf0a33a : 0x5aa0e0), 0.0006)); g.add(outline(shape, ink(0x3a3a3a), 0.0009));
    const rot = -Math.PI / 2 + d / 2 + j * d; // the 8 coloured sectors make the top half
    g.position.set(C[0], 0, -C[1]); g.rotation.y = rot; g.userData.c = { u: C[0], v: C[1], rot }; it.g.add(g); it.sectors.push(g);
  }
  // laid out: top-half sectors point down (arc on the base line), bottom-half sectors point up, side by side
  const s = 2 * r * Math.sin(d / 2), base = [-0.02, -0.035];
  it.sectors.forEach((g, j) => { const i = j % (n / 2); const top = j < n / 2; g.userData.t = top ? { u: base[0] + (i + 0.5) * s, v: base[1] + r * Math.cos(d / 2), rot: Math.PI } : { u: base[0] + (i + 1) * s, v: base[1], rot: 0 }; });
  it.arrange = (k) => it.sectors.forEach((g, j) => { const e = ease(Math.min(1, Math.max(0, (k - (j / n) * 0.6) / 0.4))); const a = g.userData.c, b = g.userData.t; g.position.set(lerp(a.u, b.u, e), 0.006 * Math.sin(Math.PI * e), -lerp(a.v, b.v, e)); g.rotation.y = angLerp(a.rot, b.rot, e); });
  const sheet = flat([[-0.18, -0.08], [0.21, -0.08], [0.21, 0.1], [-0.18, 0.1]], paper(0xfbf9f3), 0.0002); it.g.add(sheet);
  const W = (u, v, up = 0.03) => it.g.localToWorld(new THREE.Vector3(u, up, -v));
  const AT = { circle: [C[0], C[1]], len: [base[0] + 4.25 * s, base[1] - 0.012], ht: [base[0] + 8.9 * s, base[1] + r / 2] }; it.at = (k) => W(AT[k][0], AT[k][1]);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a fraction wall: one whole strip, and strips cut into 2, 3, 4, 6 and 8 equal parts
export function fractionWall(o = {}) {
  const it = new Item('mfrac', { ...o, name: o.name || { en: 'Fraction strips', hi: 'भिन्न की पट्टियाँ', hg: 'Fraction strips' } });
  const L = 0.24, h = 0.024, t = 0.006, gap = 0.0012; const rows = [1, 2, 3, 4, 6, 8];
  const cols = { 1: 0xc9504a, 2: 0xf0a33a, 3: 0x9b6bd1, 4: 0x3f8fd8, 6: 0xd96aa7, 8: 0x55b36a };
  const board = flat([[-0.16, -0.12], [0.16, -0.12], [0.16, 0.12], [-0.16, 0.12]], new THREE.MeshStandardMaterial({ map: woodTex('#b98a5a'), roughness: 0.8 }), 0.002); it.g.add(board);
  const tex = {}; const label = (n) => tex[n] || (tex[n] = canvasTex(128, 128, (x, w, hh) => { x.clearRect(0, 0, w, hh); x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (n === 1) { x.font = '700 70px sans-serif'; x.fillText('1', w / 2, hh / 2 + 4); return; }
    x.font = '700 50px sans-serif'; x.fillText('1', w / 2, hh / 2 - 26); x.fillRect(w / 2 - 22, hh / 2 - 3, 44, 6); x.fillText(String(n), w / 2, hh / 2 + 30); }));
  it.rows = {}; it.pieces = [];
  rows.forEach((n, k) => {
    const v = 0.09 - k * (h + 0.008); const w = L / n; const list = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(); const mat = new THREE.MeshStandardMaterial({ color: cols[n], roughness: 0.6, emissive: 0x000000 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(w - gap, t, h), mat); box.position.y = t / 2; g.add(box);
      box.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.35 })));
      const s = Math.min(h * 0.92, w * 0.8); const lab = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: label(n), transparent: true, depthWrite: false }));
      lab.rotation.x = -Math.PI / 2; lab.position.y = t + 0.0004; g.add(lab);
      g.position.set(-L / 2 + w * (i + 0.5), 0.002, -v); g.userData.y0 = 0.002; g.userData.mat = mat; g.visible = n === 1; it.g.add(g); list.push(g); it.pieces.push(g);
    }
    it.rows[n] = list;
  });
  // a row of pieces drops into place, one piece after another
  it.drop = (n, k) => it.rows[n].forEach((g, i, a) => { const st = (i / a.length) * 0.6; const e = ease(Math.min(1, Math.max(0, (k - st) / 0.4))); g.visible = k > st; g.position.y = g.userData.y0 + 0.07 * (1 - e); });
  // light up the first m pieces of row n (they lift a little and glow)
  // light up pieces ({row: how many from the left}): they lift a little and glow, and every other piece dims
  it.focus = (sel) => rows.forEach((n) => it.rows[n].forEach((g, i) => { const lit = sel && sel[n] > i; const m = g.userData.mat; if (!g.userData.c0) g.userData.c0 = m.color.clone();
    g.position.y = g.userData.y0 + (lit ? 0.006 : 0); m.emissive.setHex(lit ? 0x2a2a12 : 0x000000); m.color.copy(g.userData.c0).multiplyScalar(sel && !lit ? 0.45 : 1); }));
  it.rowEnd = (n, m = it.rows[n].length) => { const g = it.rows[n][m - 1]; return it.g.localToWorld(g.position.clone().add(new THREE.Vector3(L / n / 2 + 0.005, 0.01, 0))); };
  it.noGrab = true; it.height = 0.01; it.radius = 0.17; it.grabY = 0.005; return it;
}
