// Maths lab, batch 6: a paper circle folded in half again and again into a paper protractor (Class 6, Lines and
// Angles), and a cloth bag of 3 red and 5 black balls with a tally board (Class 10, Probability).
// Flat pieces are drawn in (u, v) on the table: u to the right, v away from the student (world x = u, z = -v).
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { paper, ink, flat, outline, ease, lerp, clamp01, rect, board, topLabel } from './mathlab2.js';

// a label on a dark rounded tag, readable on white paper and on the green mat (w × d metres)
function pill(text, w, d, y = 0.0004) {
  const t = canvasTex(256, Math.round((256 * d) / w), (x, W, H) => { x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(30,42,56,0.88)'; const r = H * 0.45;
    x.beginPath(); x.moveTo(r, 2); x.lineTo(W - r, 2); x.arc(W - r, H / 2, H / 2 - 2, -Math.PI / 2, Math.PI / 2); x.lineTo(r, H - 2); x.arc(r, H / 2, H / 2 - 2, Math.PI / 2, -Math.PI / 2); x.fill();
    x.fillStyle = '#ffe9a8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${Math.round(H * 0.62)}px sans-serif`; x.fillText(text, W / 2, H / 2 + 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 2; return m;
}
const at3 = (it, Y) => (u, v, up = 0.02) => it.g.localToWorld(new THREE.Vector3(u, Y + up, -v));
const D2R = Math.PI / 180;
const sector = (r, a0, a1, n = 12) => { const p = [[0, 0]]; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([r * Math.cos(a), r * Math.sin(a)]); } return p; };
// a thin strip from p to q (a drawn line that is easy to see), w wide
const strip = (p, q, w, color, y) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2;
  return flat([[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]], new THREE.MeshBasicMaterial({ color }), y); };

// ------------------------------------------------------------------ a paper circle folded into a protractor
export function paperProtractor(o = {}) {
  const it = new Item('mprotractor', { ...o, name: o.name || { en: 'A paper circle folded into a protractor', hi: 'काग़ज़ का गोला, मोड़कर बना चाँदा', hg: 'Kaagaz ka circle, mod kar bana protractor' } });
  const Y = 0.003, R = 0.075, n = 16, da = (2 * Math.PI) / n, C0 = [-0.1, -0.043], B = [0.085, -0.075];
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  it.g.add(flat(rect(-0.198, -0.113, 0.198, 0.113), paper(0x2f5d50), Y - 0.0004)); // a green mat
  // the angle ABC drawn on a white card: B is the vertex, BC goes to the right, BA at 135°
  const A = [B[0] + 0.118 * Math.cos(135 * D2R), B[1] + 0.118 * Math.sin(135 * D2R)], Cc = [B[0] + 0.105, B[1]];
  it.g.add(flat(rect(B[0] - 0.105, B[1] - 0.03, B[0] + 0.12, B[1] + 0.1), paper(0xfbf9f3), Y));
  it.g.add(strip(B, A, 0.0022, 0x1e3a5f, Y + 0.0003)); it.g.add(strip(B, Cc, 0.0022, 0x1e3a5f, Y + 0.0003));
  const lab = (t, p, c = '#1e3a5f') => { const l = topLabel(t, 0.03, 0.03, c, Y + 0.0005); l.position.set(p[0], Y + 0.0005, -p[1]); it.g.add(l); };
  lab('A', [A[0] - 0.006, A[1] + 0.012]); lab('B', [B[0], B[1] - 0.014]); lab('C', [Cc[0] + 0.01, Cc[1] - 0.008]);
  // the protractor: 16 equal wedges of a circle, each turning about the centre
  const pro = new THREE.Group(); pro.position.set(C0[0], Y + 0.0004, -C0[1]); it.g.add(pro); it.pro = pro;
  const cream = new THREE.Color(0xf6e7b8), hot = new THREE.Color(0xf0a030), line = ink(0xb0402a);
  const wedges = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), a0 = i * da, a1 = a0 + da, mat = paper(cream.getHex());
    g.add(flat(sector(R, a0, a1), mat, 0));
    const arc = []; for (let j = 0; j <= 8; j++) { const a = lerp(a0, a1, j / 8); arc.push([R * Math.cos(a), R * Math.sin(a)]); }
    for (const y of [0.0003, -0.0003]) g.add(outline(arc, ink(0x8a7f68), y, false));
    const cr = new THREE.Group(); // the crease lines along both straight edges, seen from either side
    for (const a of [a0, a1]) for (const y of [0.00035, -0.00035]) cr.add(outline([[0, 0], [R * Math.cos(a), R * Math.sin(a)]], line, y, false));
    cr.visible = false; g.add(cr);
    pro.add(g); wedges.push({ g, mat, cr });
  }
  // which wedges move in each fold: fold j turns the part between the crease c and 2c over onto the other side
  const CR = [180, 90, 45, 22.5], e = [0, 0, 0, 0];
  wedges.forEach((w, i) => { let m = (i + 0.5) * 22.5; w.moves = CR.map((c) => { const mv = m > c && m < 2 * c; if (mv) m = 2 * c - m; return mv; }); w.after1 = w.moves[0] ? 360 - (i + 0.5) * 22.5 : (i + 0.5) * 22.5; });
  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), ax = new THREE.Vector3();
  const draw = () => wedges.forEach((w) => { q.identity(); let layer = 0, lift = 0;
    CR.forEach((c, j) => { if (!w.moves[j] || e[j] <= 0) return; ax.set(Math.cos(c * D2R), 0, -Math.sin(c * D2R));
      qa.setFromAxisAngle(ax, Math.PI * e[j]); q.premultiply(qa); layer = lerp(layer, 2 ** (j + 1) - 1 - layer, e[j]); lift += Math.sin(Math.PI * e[j]) * 0.002; });
    w.g.quaternion.copy(q); w.g.position.y = layer * 0.0005 + lift; });
  // fold j (0 → 3) is made (k: 0 → 1) or opened again (k: 1 → 0)
  it.fold = (j, k) => { e[j] = ease(clamp01(k)); draw(); };
  it.creases = (on) => wedges.forEach((w) => { w.cr.visible = on; });
  // the degree marks round the half circle, written by the student once it is opened out
  const marks = new THREE.Group(); [0, 45, 90, 135, 180].forEach((d) => { const l = pill(d + '°', 0.03, 0.014, 0.0075);
    l.position.set((R + 0.019) * Math.cos(d * D2R), 0.0075, -(R + 0.011) * Math.sin(d * D2R)); marks.add(l); }); marks.visible = false; pro.add(marks); it.marks = marks;
  // the wedges between BC and BA light up, one after another (k: 0 → 1 lights `upto` of them)
  it.count = (upto, k) => { const lit = Math.round(upto * clamp01(k)); wedges.forEach((w) => { const p = Math.floor(w.after1 / 22.5); w.mat.color.copy(p < lit ? hot : cream); }); };
  // the protractor slides to the angle: its centre on B, its straight edge along BC (k: 0 → 1)
  it.move = (k) => { const s = ease(clamp01(k)); pro.position.set(lerp(C0[0], B[0], s), Y + 0.0004 + Math.sin(Math.PI * s) * 0.03, -lerp(C0[1], B[1], s)); };
  draw();
  const W = at3(it, Y);
  const AT = { centre: C0, top: [C0[0] - 0.01, C0[1] + 0.03], right: [C0[0] + R + 0.02, C0[1] + 0.02], below: [C0[0], C0[1] - 0.07],
    B, A, C: Cc, card: [B[0] + 0.015, B[1] - 0.035], arm: [B[0] - 0.075, B[1] + 0.03] };
  it.at = (k) => W(AT[k][0], AT[k][1], 0.02);
  it.noGrab = true; it.height = 0.01; it.radius = 0.2; it.grabY = 0.005; return it;
}

// ------------------------------------------------------------------ a bag of 3 red and 5 black balls, and a tally board
export function ballBag(o = {}) {
  const it = new Item('mballbag', { ...o, name: o.name || { en: 'A cloth bag with 3 red and 5 black balls', hi: 'कपड़े का थैला, 3 लाल और 5 काली गेंदें', hg: 'Kapde ka thaila, 3 laal aur 5 kaali balls' } });
  const Y = 0.003, r = 0.0105, BAG = [-0.14, 0.0], H = 0.066, ROW = -0.07, U0 = -0.06, S = 0.03;
  it.g.add(board(-0.21, -0.125, 0.21, 0.125, '#b98a5a'));
  it.g.add(flat(rect(-0.198, -0.113, 0.198, 0.113), paper(0x2f5d50), Y - 0.0004)); // a green cloth
  // the bag: a cloth pouch, open at the top
  const prof = [[0.001, 0], [0.03, 0.002], [0.041, 0.012], [0.043, 0.03], [0.036, 0.048], [0.024, 0.056], [0.029, 0.061], [0.036, H]].map(([x, y]) => new THREE.Vector2(x, y));
  const bag = new THREE.Group(); bag.position.set(BAG[0], Y, -BAG[1]); it.g.add(bag);
  bag.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshStandardMaterial({ color: 0x3d5f94, roughness: 1, side: THREE.DoubleSide })));
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.0018, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.8 })); cord.rotation.x = Math.PI / 2; cord.position.y = 0.0565; bag.add(cord); // the drawstring
  // the balls: 3 red, then 5 black, waiting in a row at the front
  const geo = new THREE.SphereGeometry(r, 20, 14), RED = 0xd63a2f, BLK = 0x1f2329;
  const balls = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: i < 3 ? RED : BLK, roughness: 0.3, metalness: 0.05 })); it.g.add(m); return m; });
  const rowP = (i) => [U0 + i * S, ROW];
  const put = (m, u, v, y) => m.position.set(u, y, -v);
  balls.forEach((m, i) => put(m, ...rowP(i), Y + r));
  // ball i goes from the row into the bag (k: 0 → 1), or back out to the row (k: 1 → 0)
  const inside = (i) => [BAG[0] + 0.012 * Math.cos(i * 2.4), BAG[1] + 0.012 * Math.sin(i * 2.4)];
  it.toBag = (i, k) => { const m = balls[i], e = ease(clamp01(k)), [u0, v0] = rowP(i), [u1, v1] = inside(i);
    const yTop = Y + H + 0.03, yIn = Y + r + 0.004 + (i % 3) * 0.008;
    // rise above the bag mouth first, then drop in
    const t = Math.min(1, e / 0.75), u = lerp(u0, u1, t), v = lerp(v0, v1, t), yArc = lerp(Y + r, yTop, Math.sin((Math.PI / 2) * t));
    put(m, u, v, e <= 0.75 ? yArc : lerp(yTop, yIn, (e - 0.75) / 0.25)); };
  // the bag is shaken (k: 0 → 1)
  it.shake = (k) => { bag.rotation.z = Math.sin(k * Math.PI * 8) * 0.12 * (1 - k); bag.rotation.x = Math.sin(k * Math.PI * 6) * 0.08 * (1 - k); };
  // a group of balls is lifted a little to show which outcomes are counted (k: 0 → 1 up, 1 → 0 down)
  const ringG = new THREE.RingGeometry(r + 0.002, r + 0.0045, 32);
  const rings = balls.map((m, i) => { const g = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffe08a, side: THREE.DoubleSide })); g.rotation.x = -Math.PI / 2; const [u, v] = rowP(i); g.position.set(u, Y + 0.0006, -v); g.visible = false; it.g.add(g); return g; });
  it.pick = (which, k) => { const e = ease(clamp01(k)); balls.forEach((m, i) => { const on = which === 'red' ? i < 3 : which === 'black' ? i >= 3 : false; const [u, v] = rowP(i); rings[i].visible = on && k > 0; put(m, u, v, Y + r + (on ? e * 0.015 : 0)); }); };
  // one ball is drawn without looking, shown, and put back (k: 0 → 1); its colour is red or black
  const shown = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: RED, roughness: 0.3 })); shown.visible = false; it.g.add(shown);
  it.drawOne = (red, k) => { shown.material.color.setHex(red ? RED : BLK); shown.visible = k > 0 && k < 1; const h = Math.sin(Math.PI * clamp01(k));
    put(shown, BAG[0], BAG[1], Y + H * 0.5 + h * 0.075); };
  // the tally board: two bars that grow with the number of red and black draws
  const TB = [0.13, 0.03];
  it.g.add(flat(rect(TB[0] - 0.07, TB[1] - 0.035, TB[0] + 0.07, TB[1] + 0.04), paper(0xfbf9f3), Y));
  const bar = (u, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.018), new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })); m.position.set(u, Y, -TB[1]); m.scale.y = 0.0001; it.g.add(m); return m; };
  const bR = bar(TB[0] - 0.03, RED), bB = bar(TB[0] + 0.03, BLK), PER = 0.0011; // metres of bar for each draw
  const num = [0, 0], numL = [null, null];
  const setNum = (j, val) => { if (num[j] === val && numL[j]) return; num[j] = val; if (numL[j]) { it.g.remove(numL[j]); numL[j].material.map.dispose(); }
    const l = topLabel(String(val), 0.03, 0.02, '#1e3a5f', Y + 0.0006); l.position.set(TB[0] + (j ? 0.03 : -0.03), Y + 0.0006, -(TB[1] - 0.025)); it.g.add(l); numL[j] = l; };
  it.tally = (red, black) => { bR.scale.y = Math.max(0.0001, red * PER); bR.position.y = Y + (red * PER) / 2; bB.scale.y = Math.max(0.0001, black * PER); bB.position.y = Y + (black * PER) / 2; setNum(0, red); setNum(1, black); };
  it.tally(0, 0);
  const W = at3(it, Y);
  const AT = { bag: [BAG[0], BAG[1] + 0.02], bagTop: [BAG[0] + 0.07, BAG[1] - 0.005], row: [U0 + 3.5 * S, ROW + 0.035], below: [U0 + 3.5 * S, ROW - 0.05],
    red: [U0 + S, ROW + 0.03], black: [U0 + 5 * S, ROW + 0.03], tally: [TB[0] - 0.115, TB[1] + 0.01], tallyR: [TB[0] - 0.03, TB[1] + 0.035], tallyB: [TB[0] + 0.03, TB[1] + 0.05] };
  it.at = (k) => W(AT[k][0], AT[k][1], AT[k][2] ?? 0.02);
  it.noGrab = true; it.height = 0.08; it.radius = 0.2; it.grabY = 0.005; return it;
}
