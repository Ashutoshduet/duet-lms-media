// DUET Maths Lab 360, hands-on in 3D, batch 12 (Class 7, Part 2): a week of rain gauges and a line graph (connecting the
// dots: data), tiles meeting round one point (constructions and tilings), and a balance with bags of unknown weight
// (finding the unknown).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { ease } from './mathlab2.js';
import { glow, rod } from './mathworld.js';
import { pushKnob } from './mathworld3.js';
import { liveSign } from './mathworld4.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const FONT = '"Noto Sans Devanagari", "Noto Sans", system-ui, sans-serif';
const DEG = Math.PI / 180;
const stepNow = (app, i) => { const r = app.runner; return !!(r.exp && r.i === i && r.state === 'todo'); };
const M = (c, r = 0.6, m = 0, e = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: c, emissiveIntensity: e });
const noHit = (o) => { o.traverse((m) => { m.userData.noHit = true; }); return o; };
function tag(text, col = '#ffffff', h = 0.2, bg = 'rgba(12,16,24,0.85)') {
  const n = String(text).length, w = n <= 2 ? 2 : n <= 4 ? 3 : n <= 7 ? 4 : 6, W = 128 * w;
  const paint = (x, txt, c) => { x.clearRect(0, 0, W, 128); x.fillStyle = bg; x.beginPath(); x.roundRect(4, 4, W - 8, 120, 40); x.fill(); x.fillStyle = c; x.font = `800 72px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), W / 2, 68); };
  const t = canvasTex(W, 128, (x) => paint(x, text, col));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })); s.scale.set(h * w, h, 1); s.renderOrder = 40; s.userData.noHit = true;
  s.setText = (txt, c = col) => { paint(t.image.getContext('2d'), txt, c); t.needsUpdate = true; };
  return s;
}

// ------------------------------------------------------------------ P2 Ch 5 Connecting the Dots: a week of rain
// Seven rain gauges stand on a bench, one for each day. Each push of the lever lets one day's rain fall (4, 0, 18, 6, 2,
// 3, 9 mm). A board behind joins the dots into a line graph, then marks the mean and the median, and finally shows how a
// cut axis tells a "tall tale".
export function rainWeek(o = {}) {
  const it = new Item('wrain', { ...o, name: { en: 'Rain gauges', hi: 'वर्षामापी', hg: 'Rain gauges' } });
  const g = it.g, MM = [4, 0, 18, 6, 2, 3, 9], Z = -1.7, BY = 0.6, DX = 0.36, X0 = -3 * DX;
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.06, 0.4), M(0x8a6a44, 0.85)); bench.position.set(0, BY - 0.03, Z); g.add(bench);
  for (const x of [-1.2, 1.2]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, BY - 0.06, 0.34), M(0x8a6a44, 0.85)); l.position.set(x, (BY - 0.06) / 2, Z); g.add(l); }
  const JH = 0.42, JR = 0.075, mmToM = JH / 20;
  const waters = MM.map((v, i) => { const x = X0 + i * DX; const glass = new THREE.Mesh(new THREE.CylinderGeometry(JR, JR, JH, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false, roughness: 0.05 })); glass.position.set(x, BY + JH / 2, Z); g.add(glass);
    const sc = canvasTex(32, 256, (c) => { c.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k <= 20; k += 2) { const y = 256 - (k / 20) * 256; c.fillRect(0, y - 1, k % 10 === 0 ? 32 : 16, 2); } }); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.02, JH), new THREE.MeshBasicMaterial({ map: sc, transparent: true, toneMapped: false })); s.position.set(x, BY + JH / 2, Z + JR + 0.002); g.add(s);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(JR - 0.004, JR - 0.004, 1, 24), new THREE.MeshStandardMaterial({ color: 0x3d8fd0, transparent: true, opacity: 0.8 })); w.geometry.translate(0, 0.5, 0); w.position.set(x, BY + 0.003, Z); w.scale.y = 0.0001; g.add(w);
    return w; });
  const dayT = ['1', '2', '3', '4', '5', '6', '7'].map((d, i) => { const t = tag(d, '#ffd23f', 0.1); t.position.set(X0 + i * DX, BY - 0.12, Z + 0.25); g.add(t); return t; });
  const valT = MM.map((v, i) => { const t = tag(`${v}`, '#7ad0ff', 0.1); t.position.set(X0 + i * DX, BY + JH + 0.1, Z); t.visible = false; g.add(t); return t; });
  // the board
  const BW = 1024, BH = 560; const cv = document.createElement('canvas'); cv.width = BW; cv.height = BH; const btex = new THREE.CanvasTexture(cv); btex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6 * BH / BW), new THREE.MeshBasicMaterial({ map: btex, toneMapped: false })); board.position.set(0, 1.98, Z - 0.9); g.add(board);
  it.days = 0; it.opt = { line: false, mean: false, median: false, cut: false };
  it.words = () => ['day', 'mm', 'mean', 'median'];
  it.drawBoard = () => { const c = cv.getContext('2d'), o2 = it.opt, [dw, mw, mnw, mdw] = it.words(); c.fillStyle = '#16202b'; c.fillRect(0, 0, BW, BH);
    const L = 110, R = 60, T = 40, B = 90, W = BW - L - R, H = BH - T - B, lo = o2.cut ? 2 : 0, hi = 20; const X = (i) => L + (i + 0.5) * W / 7, Y = (v) => T + H - ((v - lo) / (hi - lo)) * H;
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; for (let v = lo; v <= hi; v += 2) { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + W, Y(v)); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(L, T); c.lineTo(L, T + H); c.lineTo(L + W, T + H); c.stroke();
    c.fillStyle = '#fff'; c.font = `700 30px ${FONT}`; c.textAlign = 'right'; c.textBaseline = 'middle'; for (let v = lo; v <= hi; v += 4) c.fillText(String(v), L - 12, Y(v));
    c.textAlign = 'center'; c.textBaseline = 'top'; for (let i = 0; i < 7; i++) c.fillText(String(i + 1), X(i), T + H + 10); c.font = `800 32px ${FONT}`; c.fillText(dw, L + W / 2, T + H + 46);
    c.save(); c.translate(30, T + H / 2); c.rotate(-Math.PI / 2); c.fillText(mw, 0, -16); c.restore();
    if (o2.cut) { c.strokeStyle = '#ff7a5a'; c.lineWidth = 6; c.beginPath(); c.moveTo(L - 18, T + H - 30); c.lineTo(L + 18, T + H - 42); c.moveTo(L - 18, T + H - 16); c.lineTo(L + 18, T + H - 28); c.stroke(); }
    const n = it.days; if (o2.line && n > 1) { c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.beginPath(); for (let i = 0; i < n; i++) { const p = [X(i), Y(Math.max(lo, MM[i]))]; if (i) c.lineTo(...p); else c.moveTo(...p); } c.stroke(); }
    for (let i = 0; i < n; i++) { c.fillStyle = '#7ad0ff'; c.beginPath(); c.arc(X(i), Y(Math.max(lo, MM[i])), 12, 0, Math.PI * 2); c.fill(); }
    const hl = (v, col, txt) => { c.strokeStyle = col; c.lineWidth = 5; c.setLineDash([18, 12]); c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(L + W, Y(v)); c.stroke(); c.setLineDash([]); c.fillStyle = col; c.font = `800 32px ${FONT}`; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(txt, L + W - 6, Y(v) - 6); };
    if (o2.mean) hl(6, '#8be07a', `${mnw} = 6`); if (o2.median) hl(4, '#ff9ad0', `${mdw} = 4`);
    btex.needsUpdate = true; };
  it.setDays = (n) => { it.days = n; waters.forEach((w, i) => { w.scale.y = i < n ? Math.max(0.0001, MM[i] * mmToM) : 0.0001; valT[i].visible = i < n; }); it.drawBoard(); };
  let fill = null;
  it.rain = () => { if (fill || it.days >= 7) return false; fill = { i: it.days, t: 0 }; return true; };
  it.busy = () => !!fill;
  it.update = (dt) => { if (!fill) return; fill.t = Math.min(1, fill.t + Math.min(dt || 0.016, 0.05) * 1.8); waters[fill.i].scale.y = Math.max(0.0001, MM[fill.i] * mmToM * ease(fill.t)); if (fill.t >= 1) { const i = fill.i; fill = null; it.setDays(i + 1); if (it.onDay) it.onDay(it.days); } };
  it.set = (k, v) => { it.opt[k] = v; it.drawBoard(); };
  it.setDays(0);
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ board: V(0, 2.55, Z - 0.9), side: V(1.75, 0.95, Z) }[k] || V(0, 1.5, Z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 1; it.radius = 1.5; it.base = 0; return it;
}
export function bindRainHands(rw, lever, app, s = { rain: 1 }, done = {}) {
  rw.onDay = (n) => { if (n >= 7) done.all && done.all(); };
  pushKnob(lever, { path: () => rw.leverPath(), active: () => stepNow(app, s.rain) && !rw.busy() && rw.days < 7, keepVisible: () => app.runner.i === s.rain, press: () => rw.rain() });
}

// ------------------------------------------------------------------ P2 Ch 6 Constructions and Tilings: tiles round a point
// Regular tiles (side 0.5 m) are laid on the floor so that they meet at one point in front of the student. Squares (4),
// triangles (6) and hexagons (3) close up exactly; regular pentagons leave a gap. Then a honeycomb covers the floor.
export function tileRound(o = {}) {
  const it = new Item('wtile', { ...o, name: { en: 'Tiles round a point', hi: 'एक बिंदु के चारों ओर टाइलें', hg: 'Ek point ke chaaron or tiles' } });
  const g = it.g, S = 0.5, P0 = V(0, 0.012, -2.0);
  const COLS = [0xd9482e, 0xe0a800, 0x2f8fd0, 0x4fa83a, 0x8a5ad0, 0xe07a1a];
  const grp = new THREE.Group(); g.add(grp);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), glow(0xffffff)); dot.position.copy(P0).setY(0.05); g.add(dot);
  const rd = liveSign(0.36, 3.0); rd.position.set(1.35, 0.4, P0.z - 0.3); g.add(rd);
  const polyPts = (n, theta) => { const a = (n - 2) * 180 / n, eps = 360 / n; const pts = [V(0, 0, 0)]; let p = V(0, 0, 0); for (let k = 0; k < n - 1; k++) { const d = (theta + k * eps) * DEG; p = p.clone().add(V(S * Math.cos(d), 0, -S * Math.sin(d))); pts.push(p); } void a; return pts; };
  const mkPoly = (pts, col, op = 0.9) => { const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z))); const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: op < 1, opacity: op, side: THREE.DoubleSide }));
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map((p) => p.clone().setY(0.004))), new THREE.LineBasicMaterial({ color: 0x1a1f26 })); m.add(edge); return m; };
  const clear = () => { while (grp.children.length) { const c = grp.children.pop(); c.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); } };
  it.kind = 0; // 0 none, 4 squares, 3 triangles, 6 hexagons, 5 pentagons, 'hex' honeycomb
  it.showRound = (n, count) => { clear(); const a = (n - 2) * 180 / n; for (let i = 0; i < count; i++) { const m = mkPoly(polyPts(n, i * a), COLS[i % COLS.length]); m.position.copy(P0).setY(0.012 + i * 0.001); grp.add(m); }
    if (n === 5) { const gap = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24, count * a * DEG, (360 - count * a) * DEG), new THREE.MeshBasicMaterial({ color: 0xff3b30, side: THREE.DoubleSide, toneMapped: false })); gap.rotation.x = -Math.PI / 2; gap.position.copy(P0).setY(0.02); grp.add(gap); }
    it.kind = n; };
  it.honeycomb = () => { clear(); const r = S, w = Math.sqrt(3) * r; let k = 0; for (let q = -4; q <= 4; q++) for (let s = -4; s <= 4; s++) { if (Math.abs(q + s) > 4) continue; const cx = w * (q + s / 2), cz = -1.5 * r * s; const pts = []; for (let j = 0; j < 6; j++) { const d = (60 * j + 30) * DEG; pts.push(V(r * Math.cos(d), 0, -r * Math.sin(d))); }
    const m = mkPoly(pts, [0xe0a800, 0xd08a10, 0xf0c030][(q - s + 30) % 3]); m.position.set(P0.x + cx, 0.012, P0.z + cz); grp.add(m); k++; } it.kind = 'hex'; };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.order = [4, 3, 6]; it.tries = 0;
  it.next = () => { if (it.tries >= 3) return false; const n = it.order[it.tries]; const cnt = { 4: 4, 3: 6, 6: 3 }[n], a = (n - 2) * 180 / n; it.showRound(n, cnt); it.say([`${cnt} × ${a}° = 360°`], '#8be07a'); it.tries++; if (it.onTry) it.onTry(it.tries); return true; };
  it.say(['360°'], '#ffffff');
  it.leverPath = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
  it.at = (k) => ({ gap: P0.clone().add(V(0.5, 0.6, 0.2)) }[k] || V(0, 1.2, P0.z));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.02; it.radius = 3; it.base = 0; return it;
}
export function bindTileHands(tr, lever, app, s = { tryit: 1 }, done = {}) {
  tr.onTry = (n) => { if (n >= 3) done.all && done.all(); };
  pushKnob(lever, { path: () => tr.leverPath(), active: () => stepNow(app, s.tryit) && tr.tries < 3, keepVisible: () => app.runner.i === s.tryit, press: () => tr.next() });
}

// ------------------------------------------------------------------ P2 Ch 7 Finding the Unknown: a balance
// A balance on the table: two bags of unknown weight x and three 1 kg weights on the left, eleven 1 kg weights on the
// right. Each push of the lever takes 1 kg off both pans; then each side is halved: x = 4.
export function balanceScale(o = {}) {
  const it = new Item('wbal', { ...o, name: { en: 'Balance', hi: 'तराज़ू', hg: 'Taraazu' } });
  const g = it.g, PX = 0.26, BYv = 0.34;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, BYv, 12), M(0xb08a40, 0.3, 0.8)); post.position.y = BYv / 2; g.add(post);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.02, 24), M(0xb08a40, 0.3, 0.8)); foot.position.y = 0.01; g.add(foot);
  const beam = new THREE.Group(); beam.position.y = BYv; g.add(beam);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2 * PX + 0.04, 0.012, 0.016), M(0xb08a40, 0.3, 0.8)); beam.add(bar);
  const pans = [-1, 1].map((sgn) => { const p = new THREE.Group(); const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.012, 28), M(0xb8b8b0, 0.3, 0.8)); p.add(plate);
    for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3; p.add(rod(V(0.1 * Math.cos(a), 0.006, 0.1 * Math.sin(a)), V(0, 0.2, 0), 0.0015, M(0x999999, 0.4, 0.6))); }
    g.add(p); p.sgn = sgn; return p; });
  const bagG = new THREE.SphereGeometry(0.035, 16, 12); bagG.scale(1, 1.25, 1); bagG.translate(0, 0.045, 0);
  const mkBag = () => { const b = new THREE.Group(); b.add(new THREE.Mesh(bagG, M(0x8a5a2e, 0.9))); const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.015, 0.022, 10), M(0x6a4422, 0.9)); tie.position.y = 0.095; b.add(tie); const x = tag('x', '#ffd23f', 0.03); x.position.set(0, 0.14, 0); b.add(x); return b; };
  const wG = new THREE.CylinderGeometry(0.018, 0.018, 0.026, 18);
  const mkW = () => { const w = new THREE.Mesh(wG, M(0x5a6068, 0.35, 0.8)); w.geometry; return w; };
  const left = { bags: [mkBag(), mkBag()], w: [] }, right = { w: [] };
  left.bags.forEach((b) => pans[0].add(b));
  for (let i = 0; i < 3; i++) { const w = mkW(); pans[0].add(w); left.w.push(w); }
  for (let i = 0; i < 11; i++) { const w = mkW(); pans[1].add(w); right.w.push(w); }
  const rd = liveSign(0.09, 3.4); rd.position.set(0, 0.6, -0.12); g.add(rd);
  it.st = { bags: 2, lw: 3, rw: 11 }; it.tilt = 0; let wob = 0;
  const layout = () => { left.bags.forEach((b, i) => { b.visible = i < it.st.bags; b.position.set(it.st.bags === 1 ? -0.02 : -0.045 + i * 0.07, 0.006, 0); });
    left.w.forEach((w, i) => { w.visible = i < it.st.lw; w.position.set(0.06, 0.019 + i * 0.027, -0.04 + (i % 2) * 0.0); });
    right.w.forEach((w, i) => { w.visible = i < it.st.rw; const col = i % 4, lay = Math.floor(i / 4); w.position.set(-0.045 + (col % 2) * 0.045, 0.019 + lay * 0.027, -0.025 + Math.floor(col / 2) * 0.05); }); };
  const place = () => { beam.rotation.z = it.tilt; pans.forEach((p) => { const x = p.sgn * PX * Math.cos(it.tilt), y = BYv + p.sgn * PX * Math.sin(it.tilt) - 0.22; p.position.set(x, y, 0); }); };
  const eq = () => { const s = it.st; const L = (s.bags === 2 ? '2x' : s.bags === 1 ? 'x' : '') + (s.lw ? ` + ${s.lw}` : ''); return `${L} = ${s.rw}`; };
  it.say = (lines, cols) => rd.set(lines, cols);
  it.setState = (st) => { it.st = { ...st }; layout(); it.say([eq()], '#ffd23f'); };
  it.update = (dt) => { if (wob > 0) { wob = Math.max(0, wob - Math.min(dt || 0.016, 0.05)); it.tilt = Math.sin(wob * 18) * 0.06 * wob; place(); } };
  it.take1 = () => { if (it.st.lw <= 0) return false; it.st.lw--; it.st.rw--; layout(); wob = 0.8; it.say([eq()], '#ffd23f'); if (it.onTake) it.onTake(it.st.lw); return true; };
  it.halve = () => { it.st.bags = 1; it.st.rw = it.st.rw / 2; layout(); wob = 0.8; it.say(['x = 4'], '#8be07a'); };
  it.setState(it.st); place();
  const W = (x, y, z) => g.localToWorld(V(x, y, z));
  it.leverPath = () => [W(-0.3, 0.1, 0.24), W(-0.3, 0.1, 0.32)];
  it.at = (k) => ({ top: W(0, 0.7, -0.12), left: W(-PX, 0.3, 0.1), right: W(PX, 0.3, 0.1) }[k] || W(0, 0.5, 0));
  noHit(g); it.noGrab = true; it.noPhys = true; it.height = 0.4; it.radius = 0.4; it.base = 0; return it;
}
export function bindBalanceHands(bs, lever, app, s = { take: 1 }, done = {}) {
  bs.onTake = (lw) => { if (lw <= 0) done.all && done.all(); };
  pushKnob(lever, { path: () => bs.leverPath(), active: () => stepNow(app, s.take) && bs.st.lw > 0, keepVisible: () => app.runner.i === s.take, press: () => bs.take1() });
}
