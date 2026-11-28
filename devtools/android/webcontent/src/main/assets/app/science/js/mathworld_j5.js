// DUET Maths Lab 360, hands-on for Class 5 (Maths Mela), batch J5: a bus odometer rolling over to one lakh, glasses
// of juice in halves, quarters and eighths, a compass arrow turned by quarter turns, a sleeper train of 14 coaches,
// a trundle wheel on the playground, milk cans at a dairy, tiles on a courtyard floor, and mugs into a bucket on a scale.
// Everything is real size (the train is a 1:46 model) and drawn here: no outside images.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { canvasTex } from './mats.js';
import { clamp01, ease } from './mathlab2.js';
import { pushKnob } from './mathworld3.js';
import { liveSign, turnKnob } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { tag, animator, woodTex, steelMat, M, rnd, tex, noHit, stepNow, V, FONT } from './mathworld_j1.js';

const DEG = Math.PI / 180;
const TW = (g) => (x, y, z) => g.localToWorld(V(x, y, z));
const tableLever = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(-0.3, 0.1, 0.32)];
const tableSlide = (g) => [TW(g)(-0.3, 0.1, 0.24), TW(g)(0.3, 0.1, 0.24)];
const floorLever = () => [V(-0.45, 1.0, -0.3), V(-0.45, 1.0, -0.05)];
const floorKnob = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
const done1 = (it, o) => { noHit(it.g); it.noGrab = true; it.noPhys = true; it.base = 0; Object.assign(it, o); return it; };
const IN = (n) => Math.round(n).toLocaleString('en-IN');
const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ------------------------------------------------------------------ Class 5 Ch 1 We the Travellers — I: the odometer reaches one lakh
// A bus dashboard stands on the table: a speedometer and an odometer with six rolling number wheels. The bus has done
// 99,985 km; the slider drives it 15 km more and every wheel rolls over to 1,00,000.
export function busOdometer(o = {}) {
  const it = new Item('jodo5', { ...o, name: { en: 'Bus dashboard', hi: 'बस का डैशबोर्ड', hg: 'Bus ka dashboard' } });
  const g = it.g, w_ = o.W || ((k) => k), START = 99985, KM = 15;
  const dash = new THREE.Group(); dash.position.set(0, 0, -0.1); dash.rotation.x = -0.32; g.add(dash);
  const plast = M(0x22262c, 0.75), plast2 = M(0x15181c, 0.55);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.25, 0.07), plast); panel.position.set(0, 0.125, -0.035); panel.castShadow = true; dash.add(panel);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.56, 24, 1, true, 0, Math.PI), M(0x1b1e23, 0.8)); hood.material.side = THREE.DoubleSide; hood.rotation.z = Math.PI / 2; hood.position.set(0, 0.25, -0.01); dash.add(hood);
  // speedometer
  const spT = tex(512, 512, (x) => { x.fillStyle = '#0d0f12'; x.beginPath(); x.arc(256, 256, 252, 0, 7); x.fill(); x.strokeStyle = '#e8e8e8'; x.fillStyle = '#e8e8e8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 40px ${FONT}`;
    for (let v = 0; v <= 120; v += 5) { const a = (-120 + v * 2) * DEG, big = v % 20 === 0; x.lineWidth = big ? 7 : 3; const r1 = big ? 200 : 218; x.beginPath(); x.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1); x.lineTo(256 + Math.sin(a) * 240, 256 - Math.cos(a) * 240); x.stroke(); if (big) x.fillText(String(v), 256 + Math.sin(a) * 160, 258 - Math.cos(a) * 160); }
    x.font = `700 30px ${FONT}`; x.fillStyle = '#9aa3ad'; x.fillText('km/h', 256, 350); });
  const sp = new THREE.Mesh(new THREE.CircleGeometry(0.085, 48), new THREE.MeshBasicMaterial({ map: spT, toneMapped: false })); sp.position.set(-0.14, 0.125, 0.001); dash.add(sp);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.087, 0.005, 10, 48), M(0xb8bec6, 0.25, 0.9)); ring.position.copy(sp.position); dash.add(ring);
  const needle = new THREE.Group(); needle.position.set(-0.14, 0.125, 0.004); dash.add(needle);
  const nm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.07, 0.002), new THREE.MeshBasicMaterial({ color: 0xff3b2f, toneMapped: false })); nm.position.y = 0.03; needle.add(nm);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16), plast2); cap.rotation.x = Math.PI / 2; cap.position.set(-0.14, 0.125, 0.006); dash.add(cap);
  // odometer: six number wheels seen through a window
  const stripT = canvasTex(64, 704, (x) => { x.fillStyle = '#121418'; x.fillRect(0, 0, 64, 704); x.fillStyle = '#f4f4f0'; x.font = `800 50px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let k = 0; k <= 10; k++) { x.fillText(String(k % 10), 32, k * 64 + 34); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(0, k * 64, 64, 2); x.fillStyle = '#f4f4f0'; } });
  stripT.colorSpace = THREE.SRGBColorSpace;
  const shadeT = canvasTex(8, 64, (x) => { const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)'); x.fillStyle = gr; x.fillRect(0, 0, 8, 64); });
  const ox = 0.1, DW = 0.032, DH = 0.05, wheels = [];
  const bez = new THREE.Mesh(new THREE.BoxGeometry(6 * DW + 0.02, DH + 0.02, 0.006), M(0xb8bec6, 0.3, 0.85)); bez.position.set(ox, 0.125, -0.001); dash.add(bez);
  for (let i = 0; i < 6; i++) { const t = stripT.clone(); t.needsUpdate = true; t.repeat.set(1, 1 / 11); const m = new THREE.Mesh(new THREE.PlaneGeometry(DW * 0.92, DH), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    m.position.set(ox + (2.5 - i) * DW, 0.125, 0.003); dash.add(m); const sh = new THREE.Mesh(new THREE.PlaneGeometry(DW * 0.92, DH), new THREE.MeshBasicMaterial({ map: shadeT, transparent: true, depthWrite: false })); sh.position.copy(m.position).z += 0.0008; dash.add(sh); wheels.push(t); }
  const kmT = tag('km', '#e8e8e8', 0.022, 'rgba(0,0,0,0)'); kmT.position.set(ox + 3.6 * DW, 0.125, 0.006); dash.add(kmT);
  const odoT = tag('ODO', '#9aa3ad', 0.018, 'rgba(0,0,0,0)'); odoT.position.set(ox, 0.168, 0.006); dash.add(odoT);
  // warning lights and a small fuel gauge
  [0x2ecc71, 0xf1c40f, 0xe74c3c, 0x3498db].forEach((c, i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.007, 16), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.55 })); l.position.set(0.04 + i * 0.03, 0.06, 0.001); dash.add(l); });
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.42, -0.3); g.add(rd);
  it.v = START; let spd = 0, moving = 0;
  it.setV = (v) => { const dv = v - it.v; if (Math.abs(dv) > 1e-6) moving = 0.35; it.v = v;
    for (let i = 0; i < 6; i++) { const p = 10 ** i; let pos; if (i === 0) pos = v % 10; else { const d = Math.floor(v / p) % 10, rem = v % p; pos = d + clamp01(rem - (p - 1)); } wheels[i].offset.y = (10 - pos) / 11; }
    const done = v >= 100000 - 1e-6; rd.set(done ? [`${IN(100000)} km`, w_('one lakh kilometres')] : [`${IN(Math.floor(v + 1e-6))} km`], done ? ['#8be07a', '#8be07a'] : '#ffd23f'); if (it.onV) it.onV(v); };
  it.update = (dt) => { moving = Math.max(0, moving - (dt || 0.016)); const target = moving > 0 ? 62 : 0; spd += (target - spd) * Math.min(1, (dt || 0.016) * 4); needle.rotation.z = -(-120 + spd * 2) * DEG; };
  it.say = (l, c) => rd.set(l, c);
  it.setV(START); it.update(1);
  it.k = () => (it.v - START) / KM;
  it.knobPath = () => tableSlide(g);
  return done1(it, { height: 0.3, radius: 0.35 });
}
export function bindOdoHands(od, knob, app, s = { drive: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => od.knobPath(), active: () => stepNow(app, s.drive), keepVisible: () => app.runner.i === s.drive, k: () => od.k(),
    set: (k) => { const kk = clamp01(k > 0.985 ? 1 : k); const v = 99985 + kk * 15; if (v > od.v) od.setV(v); if (od.v >= 100000 - 1e-6 && done.lakh) done.lakh(); } });
  const s0 = od.setV; od.setV = (v) => { s0(v); sync(); };
}

// ------------------------------------------------------------------ Class 5 Ch 2 Fractions: juice in glasses marked in halves, quarters, eighths
// Three same glasses: the first is marked in 2 equal parts, the second in 4, the third in 8. A steel jug pours mango
// juice up to half of each: the levels match, so 1/2 = 2/4 = 4/8.
export function fractionGlasses(o = {}) {
  const it = new Item('jglass5', { ...o, name: { en: 'Glasses and a jug of juice', hi: 'गिलास और जूस का जग', hg: 'Glass aur juice ka jug' } });
  const g = it.g, w_ = o.W || ((k) => k), PARTS = [2, 4, 8], NAME = ['halves', 'quarters', 'eighths'], XS = [-0.17, 0, 0.17], R = 0.036, H = 0.15, B = 0.008, LH = 0.125, Z = -0.06;
  const juiceM = new THREE.MeshStandardMaterial({ color: 0xf6a019, roughness: 0.2, transparent: true, opacity: 0.93, emissive: 0x3a1c00 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0xeaf4ff, roughness: 0.04, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const glasses = PARTS.map((n, i) => { const gg = new THREE.Group(); gg.position.set(XS[i], 0, Z); g.add(gg);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.86, H, 40, 1, true), glassM); body.position.y = H / 2; body.renderOrder = 3; gg.add(body);
    const bot = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, B, 40), new THREE.MeshStandardMaterial({ color: 0xdfeefa, roughness: 0.05, transparent: true, opacity: 0.45 })); bot.position.y = B / 2; gg.add(bot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0016, 8, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.5 })); rim.rotation.x = Math.PI / 2; rim.position.y = H; gg.add(rim);
    const mk = canvasTex(512, 256, (x) => { x.clearRect(0, 0, 512, 256); x.textBaseline = 'middle'; for (let j = 1; j < n; j++) { const y = 256 * (1 - (B + (j / n) * LH) / H); const big = (j * 2) % n === 0 && n > 2;
        x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 7; x.beginPath(); x.moveTo(big ? 200 : 214, y); x.lineTo(256, y); x.stroke(); x.strokeStyle = '#123a7a'; x.lineWidth = 3; x.beginPath(); x.moveTo(big ? 200 : 214, y); x.lineTo(256, y); x.stroke();
        x.font = `800 ${n > 4 ? 15 : 19}px ${FONT}`; x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.strokeText(`${j}/${n}`, 262, y); x.fillStyle = '#123a7a'; x.fillText(`${j}/${n}`, 262, y); } });
    const marks = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.004, R * 0.864, H, 40, 1, true, Math.PI), new THREE.MeshBasicMaterial({ map: mk, transparent: true, depthWrite: false, toneMapped: false })); marks.position.y = H / 2; marks.renderOrder = 4; gg.add(marks);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.84, 1, 40), juiceM); liq.visible = false; liq.renderOrder = 2; gg.add(liq);
    const t = tag(w_(NAME[i]), '#ffffff', 0.024); t.position.set(0, H + 0.03, 0); gg.add(t);
    return { gg, liq, lv: 0 }; });
  const setLv = (i, f) => { const G = glasses[i]; G.lv = f; const h = Math.max(0.0005, f * LH); G.liq.visible = f > 0.001; G.liq.scale.set(1, h, 1); G.liq.position.y = B + h / 2; };
  // the steel jug: spout on the left, handle on the right
  const jug = new THREE.Group(); g.add(jug);
  const jb = new THREE.Mesh(lathe([[0, 0], [0.045, 0], [0.05, 0.012], [0.054, 0.07], [0.05, 0.12], [0.044, 0.15], [0.047, 0.165], [0.045, 0.166], [0.042, 0.152], [0.047, 0.12], [0.05, 0.07], [0.046, 0.012], [0, 0.01]], 40), steelMat()); jb.material = steelMat(); jb.castShadow = true; jug.add(jb);
  const jh = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 8, 24, Math.PI * 1.1), steelMat()); jh.rotation.z = -Math.PI * 0.55; jh.position.set(0.05, 0.09, 0); jug.add(jh);
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 12, 1, true), steelMat()); spout.material.side = THREE.DoubleSide; spout.rotation.z = Math.PI / 2 + 0.5; spout.position.set(-0.05, 0.158, 0); jug.add(spout);
  const SP = V(-0.064, 0.166, 0), HOME = V(0.33, 0, 0.05);
  jug.position.copy(HOME);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0045, 1, 10), juiceM); stream.visible = false; g.add(stream);
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.32, -0.3); g.add(rd);
  animator(it); it.n = 0;
  const jugAt = (spoutTo, tilt) => { jug.rotation.z = tilt; const off = SP.clone().applyEuler(jug.rotation); return spoutTo.clone().sub(off); };
  it.pour = (i, f, cb) => { if (it.busy) return false; const G = glasses[i], f0 = G.lv, top = V(XS[i], H + 0.05, Z), TILT = 1.25;
    it.play(Math.max(1.2, Math.abs(f - f0) * 3.5), (k) => {
      if (k < 0.25) { const e = ease(k / 0.25); jug.rotation.z = TILT * e; jug.position.lerpVectors(HOME, jugAt(top, TILT * e), e); jug.rotation.z = TILT * e; stream.visible = false; }
      else if (k < 0.82) { const e = (k - 0.25) / 0.57; jug.position.copy(jugAt(top, TILT)); setLv(i, f0 + (f - f0) * e); const s = jug.localToWorld(SP.clone()); g.worldToLocal(s);
        const yTop = B + G.lv * LH, len = Math.max(0.01, s.y - yTop); stream.visible = true; stream.scale.set(1, len, 1); stream.position.set(XS[i], yTop + len / 2, Z); }
      else { const e = ease((k - 0.82) / 0.18); stream.visible = false; const p = jugAt(top, TILT * (1 - e)); jug.position.lerpVectors(p, HOME, e); jug.rotation.z = TILT * (1 - e); } },
    () => { setLv(i, f); stream.visible = false; jug.position.copy(HOME); jug.rotation.z = 0; if (cb) cb(); }); return true; };
  it.fillHalf = (cb) => { if (it.busy || it.n >= 3) return false; const i = it.n; return it.pour(i, 0.5, () => { it.n++; const L = ['1/2', '2/4', '4/8'].slice(0, it.n).join(' = ');
    rd.set([L], it.n >= 3 ? '#8be07a' : '#ffd23f'); if (cb) cb(); }); };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Fill each glass to half')], '#ffffff');
  it.leverPath = () => tableLever(g);
  return done1(it, { height: 0.2, radius: 0.4 });
}
export function bindGlassHands(fg, lever, app, s = { pour: 1 }, done = {}) {
  pushKnob(lever, { path: () => fg.leverPath(), active: () => stepNow(app, s.pour) && !fg.busy && fg.n < 3, keepVisible: () => app.runner.i === s.pour, press: () => fg.fillHalf(() => { if (fg.n >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 3 Angles as Turns: an arrow on a compass card
// A compass card on a wooden base lies on the table, North towards the blackboard. The child carries the arrow's tip
// round: a quarter turn clockwise brings it to East (a right angle, checked with a folded-paper corner), then on round.
export function compassArrow(o = {}) {
  const it = new Item('jturn5', { ...o, name: { en: 'Compass card and arrow', hi: 'दिशा-पत्र और तीर', hg: 'Disha-patra aur teer' } });
  const g = it.g, w_ = o.W || ((k) => k), R = 0.2, C = V(0, 0.016, -0.06);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.025, R + 0.03, 0.014, 64), new THREE.MeshStandardMaterial({ map: woodTex('#7a4a22', 52), roughness: 0.5 })); base.position.set(C.x, 0.007, C.z); base.castShadow = true; g.add(base);
  const cardT = tex(1024, 1024, (x) => { x.fillStyle = '#f6efdc'; x.beginPath(); x.arc(512, 512, 510, 0, 7); x.fill(); x.strokeStyle = '#6b4a2a'; x.lineWidth = 6; x.beginPath(); x.arc(512, 512, 490, 0, 7); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(512, 512, 400, 0, 7); x.stroke();
    for (let d = 0; d < 360; d += 5) { const a = d * DEG, L = d % 90 === 0 ? 70 : d % 30 === 0 ? 45 : d % 10 === 0 ? 28 : 16; x.lineWidth = d % 90 === 0 ? 6 : 2; x.beginPath(); x.moveTo(512 + Math.sin(a) * 490, 512 - Math.cos(a) * 490); x.lineTo(512 + Math.sin(a) * (490 - L), 512 - Math.cos(a) * (490 - L)); x.stroke(); }
    const star = (r1, r2, rot, c1, c2) => { for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2; [[c1, -1], [c2, 1]].forEach(([c, s]) => { x.fillStyle = c; x.beginPath(); x.moveTo(512, 512); x.lineTo(512 + Math.sin(a) * r1, 512 - Math.cos(a) * r1); x.lineTo(512 + Math.sin(a + s * Math.PI / 4) * r2, 512 - Math.cos(a + s * Math.PI / 4) * r2); x.closePath(); x.fill(); }); } };
    star(300, 70, Math.PI / 4, '#c9b48a', '#a8916a'); star(380, 90, 0, '#2d3e50', '#55708a');
    x.fillStyle = '#b3261e'; x.font = `800 84px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; const L = [w_('N'), w_('E'), w_('S'), w_('W')]; L.forEach((t, k) => { const a = k * Math.PI / 2; x.fillStyle = k === 0 ? '#b3261e' : '#2d3e50'; x.fillText(t, 512 + Math.sin(a) * 445, 516 - Math.cos(a) * 445); }); });
  const card = new THREE.Mesh(new THREE.CircleGeometry(R, 72), new THREE.MeshStandardMaterial({ map: cardT, roughness: 0.8 })); card.rotation.x = -Math.PI / 2; card.position.set(C.x, 0.0145, C.z); g.add(card);
  const glass = new THREE.Mesh(new THREE.TorusGeometry(R + 0.012, 0.007, 10, 72), M(0xc9a24a, 0.3, 0.9)); glass.rotation.x = Math.PI / 2; glass.position.set(C.x, 0.016, C.z); g.add(glass);
  const secM = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const sec = new THREE.Mesh(new THREE.CircleGeometry(R * 0.78, 4, 0, 0.001), secM); sec.rotation.x = -Math.PI / 2; sec.position.set(C.x, 0.017, C.z); g.add(sec);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, R * 0.8), M(0x8a8f96, 0.6)); ghost.position.set(C.x, 0.0165, C.z - R * 0.4); g.add(ghost);
  // the arrow: red head, white tail feathers, pivoting on a brass cap
  const sh = new THREE.Shape(); sh.moveTo(-0.006, -0.06); sh.lineTo(0.006, -0.06); sh.lineTo(0.006, 0.13); sh.lineTo(0.02, 0.13); sh.lineTo(0, 0.175); sh.lineTo(-0.02, 0.13); sh.lineTo(-0.006, 0.13); sh.closePath();
  const ag = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: true, bevelSize: 0.0012, bevelThickness: 0.001, bevelSegments: 1 }); ag.rotateX(-Math.PI / 2);
  const arrow = new THREE.Group(); arrow.position.set(C.x, 0.022, C.z); g.add(arrow);
  const am = new THREE.Mesh(ag, M(0xc0392b, 0.4, 0.1)); am.castShadow = true; arrow.add(am);
  const feather = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.035), M(0xf2f2f2, 0.6)); feather.position.set(0, 0.003, 0.045); arrow.add(feather);
  const capm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.012, 20), M(0xc9a24a, 0.3, 0.9)); capm.position.set(C.x, 0.028, C.z); g.add(capm);
  // a corner of folded paper: a right-angle tester
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshStandardMaterial({ color: 0xfff6a8, roughness: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); paper.rotation.x = -Math.PI / 2; paper.position.set(C.x + 0.035, 0.019, C.z - 0.035); paper.visible = false; g.add(paper);
  const rd = liveSign(0.07, 3.6); rd.position.set(0, 0.32, -0.3); g.add(rd);
  animator(it); it.A = 0;
  const dirW = ['facing North', 'facing East', 'facing South', 'facing West'], frac = { 90: '¼', 180: '½', 270: '¾', 360: '1' };
  it.set = (a) => { it.A = a; arrow.rotation.y = -a * DEG; const L = Math.abs(a);
    sec.geometry.dispose(); sec.geometry = new THREE.CircleGeometry(R * 0.78, Math.max(2, Math.ceil(L / 4)), a >= 0 ? (90 - a) * DEG : 90 * DEG, Math.max(0.001, L * DEG));
    paper.visible = Math.abs(a - 90) < 0.5;
    const r = Math.round(a), q = ((Math.round(r / 90) % 4) + 4) % 4, onQ = Math.abs(r - Math.round(r / 90) * 90) < 1;
    if (onQ && r !== 0) rd.set([`${frac[Math.abs(r)] || ''} ${w_('turn')} = ${Math.abs(r)}°`, w_(dirW[q])], ['#8be07a', '#ffffff']); else rd.set([`${Math.abs(r)}°`], '#ffd23f');
    if (it.onSet) it.onSet(a); };
  it.turnTo = (a, cb) => { if (it.busy) return false; const a0 = it.A; it.play(Math.max(0.8, Math.abs(a - a0) / 120), (k) => it.set(a0 + (a - a0) * ease(k)), () => { it.set(a); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.set(0); it.say([w_('facing North')], '#ffffff');
  it.centreW = () => g.localToWorld(C.clone());
  it.knobAt = () => g.localToWorld(V(C.x + Math.sin(it.A * DEG) * 0.15, 0.04, C.z - Math.cos(it.A * DEG) * 0.15));
  return done1(it, { height: 0.05, radius: 0.3 });
}
export function bindTurnHands(ca, knob, app, steps = { 1: 90, 2: 360 }, done = {}) {
  const goal = () => { for (const i in steps) if (stepNow(app, +i)) return steps[i]; return null; };
  const centre = { get x() { return ca.centreW().x; }, get z() { return ca.centreW().z; } };
  turnKnob(knob, { centre, active: () => goal() != null && ca.A < goal() - 0.01 && !ca.busy, keepVisible: () => goal() != null,
    move: (da) => { const G = goal(); if (G == null) return; let a = Math.min(G, Math.max(0, ca.A + da)); if (G - a < 5) a = G; ca.set(a); if (a >= G) done.reach && done.reach(G); },
    at: () => ca.knobAt() });
  const s0 = ca.set; ca.set = (a) => { s0(a); if (!knob.held) knob.g.position.copy(ca.knobAt()); };
}

// ------------------------------------------------------------------ Class 5 Ch 4 We the Travellers — II: a sleeper train, 14 × 72
// On a display stand beside the line: one sleeper coach opened up (1:20) to show its 9 bays of 8 berths, and behind it a
// 1:46 model train on a track. The slider couples 14 coaches to the engine.
export function sleeperTrain(o = {}) {
  const it = new Item('jtrain5', { ...o, name: { en: 'Sleeper coach and model train', hi: 'स्लीपर डिब्बा और मॉडल ट्रेन', hg: 'Sleeper dibba aur model train' } });
  const g = it.g, w_ = o.W || ((k) => k), N = 14, ZT = -2.1, X0 = -3.6, CL = 0.5, SH = 0.45;
  // the opened coach on a stand
  const stand = new THREE.Group(); stand.position.set(0, 0, -1.05); g.add(stand);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.04, 0.34), new THREE.MeshStandardMaterial({ map: woodTex('#6b3f1d', 61), roughness: 0.55 })); top.position.y = SH; top.castShadow = true; stand.add(top);
  [[-0.6, -0.13], [0.6, -0.13], [-0.6, 0.13], [0.6, 0.13]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, SH - 0.02, 0.04), M(0x3b2a1a, 0.6)); l.position.set(x, (SH - 0.02) / 2, z); stand.add(l); });
  const cg = new THREE.Group(); cg.position.set(0, SH + 0.02, 0); stand.add(cg);
  const L = 1.15, Wd = 0.16, Hc = 0.2, blue = 0x1f4f8f;
  const shellM = M(blue, 0.5, 0.2), inM = M(0xdfe3e6, 0.7), berthM = M(0x2d5fa8, 0.45), steelM = M(0xb9bfc5, 0.3, 0.8);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 0.008, Wd), M(0x5b6168, 0.8)); floor.position.y = 0.004; cg.add(floor);
  const winT = tex(512, 64, (x) => { x.fillStyle = '#1f4f8f'; x.fillRect(0, 0, 512, 64); x.fillStyle = '#f2c94c'; x.fillRect(0, 44, 512, 4); for (let i = 0; i < 18; i++) { const xx = 6 + i * 28.2; x.fillStyle = '#10161d'; x.fillRect(xx, 12, 22, 26); x.strokeStyle = '#9aa3ad'; x.lineWidth = 1.5; for (let b = 1; b < 4; b++) { x.beginPath(); x.moveTo(xx, 12 + b * 6.5); x.lineTo(xx + 22, 12 + b * 6.5); x.stroke(); } } });
  const far = new THREE.Mesh(new THREE.BoxGeometry(L, Hc, 0.006), [shellM, shellM, shellM, shellM, inM, new THREE.MeshStandardMaterial({ map: winT, roughness: 0.5 })]); far.position.set(0, Hc / 2, -Wd / 2); cg.add(far);
  const near = new THREE.Mesh(new THREE.BoxGeometry(L, 0.05, 0.006), shellM); near.position.set(0, 0.025, Wd / 2); cg.add(near);
  [-L / 2, L / 2].forEach((x) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.006, Hc, Wd), shellM); e.position.set(x, Hc / 2, 0); cg.add(e); });
  const bay = L / 9, aisle = 0.03, sideW = 0.032, crossW = Wd - aisle - sideW; // bays: 6 berths across (3 tiers × 2 sides), 2 side berths along the window
  for (let b = 0; b < 9; b++) { const x0 = -L / 2 + b * bay, zc = -Wd / 2 + crossW / 2;
    const part = new THREE.Mesh(new THREE.BoxGeometry(0.004, Hc * 0.92, crossW), inM); part.position.set(x0 + 0.002, Hc * 0.46, zc); cg.add(part);
    [0.03, 0.085, 0.14].forEach((y) => [x0 + 0.022, x0 + bay - 0.022].forEach((x) => { const bt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, crossW * 0.96), berthM); bt.position.set(x, y, zc); bt.castShadow = true; cg.add(bt); }));
    [0.03, 0.12].forEach((y) => { const sb = new THREE.Mesh(new THREE.BoxGeometry(bay * 0.9, 0.008, sideW * 0.9), berthM); sb.position.set(x0 + bay / 2, y, Wd / 2 - sideW / 2 - 0.003); cg.add(sb); });
    const lad = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.12, 0.003), steelM); lad.position.set(x0 + bay / 2, 0.07, zc + crossW / 2 - 0.004); cg.add(lad);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(bay * 0.8, 0.004, 0.02), steelM); rack.position.set(x0 + bay / 2, Hc * 0.9, -Wd / 2 + 0.012); cg.add(rack); }
  const bays = tag(`9 × 8 = 72`, '#ffd23f', 0.07); bays.position.set(0, Hc + 0.12, 0); cg.add(bays);
  // track and model train
  const ballT = tex(256, 64, (x) => { const r = rnd(4); x.fillStyle = '#7d7a74'; x.fillRect(0, 0, 256, 64); for (let i = 0; i < 1400; i++) { const c = 90 + r() * 90; x.fillStyle = `rgb(${c},${c - 4},${c - 10})`; x.fillRect(r() * 256, r() * 64, 2 + r() * 2, 2 + r() * 2); } }, [12, 1]);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.05, 0.22), new THREE.MeshStandardMaterial({ map: ballT, roughness: 0.95 })); bed.position.set(0.3, 0.025, ZT); bed.receiveShadow = true; g.add(bed);
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.012, 0.16), M(0x6e5a44, 0.85), 140); const mm = new THREE.Matrix4(); for (let i = 0; i < 140; i++) { mm.makeTranslation(-4.0 + i * 0.062, 0.056, ZT); sl.setMatrixAt(i, mm); } g.add(sl);
  [-0.04, 0.04].forEach((dz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.012, 0.008), M(0xa7adb3, 0.3, 0.85)); r.position.set(0.3, 0.068, ZT + dz); g.add(r); });
  const loco = new THREE.Group(); g.add(loco); loco.position.set(X0 - 0.2, 0.074, ZT);
  const locoT = tex(256, 64, (x) => { x.fillStyle = '#c7362b'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#f4f1e8'; x.fillRect(0, 34, 256, 8); x.fillStyle = '#10161d'; x.fillRect(8, 8, 34, 20); x.fillRect(214, 8, 34, 20); x.fillStyle = '#f2c94c'; x.font = `800 16px ${FONT}`; x.fillText('WAP-7', 100, 26); });
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.085, 0.07), new THREE.MeshStandardMaterial({ map: locoT, roughness: 0.45 })); lb.position.y = 0.06; loco.add(lb);
  const panto = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.004), M(0x333333, 0.5)); panto.position.set(0.05, 0.115, 0); loco.add(panto);
  const coachT = (n) => tex(256, 48, (x) => { x.fillStyle = '#1f4f8f'; x.fillRect(0, 0, 256, 48); x.fillStyle = '#f2c94c'; x.fillRect(0, 34, 256, 3); for (let i = 0; i < 10; i++) { x.fillStyle = '#10161d'; x.fillRect(26 + i * 20, 10, 14, 16); } x.fillStyle = '#2a3440'; x.fillRect(4, 6, 14, 30); x.fillRect(238, 6, 14, 30); x.fillStyle = '#ffffff'; x.font = `800 13px ${FONT}`; x.textAlign = 'center'; x.fillText('S' + n, 128, 45); });
  const roofG = new THREE.CylinderGeometry(0.036, 0.036, CL - 0.03, 12, 1, false, 0, Math.PI); roofG.rotateZ(Math.PI / 2);
  const coaches = []; for (let i = 0; i < N; i++) { const c = new THREE.Group(); const sideM = new THREE.MeshStandardMaterial({ map: coachT(i + 1), roughness: 0.5 }), plainM = M(blue, 0.5);
    const b = new THREE.Mesh(new THREE.BoxGeometry(CL - 0.03, 0.07, 0.07), [plainM, plainM, plainM, plainM, sideM, sideM]); b.position.y = 0.055; b.castShadow = true; c.add(b);
    const rf = new THREE.Mesh(roofG, M(0x8f979e, 0.6, 0.3)); rf.position.y = 0.09; c.add(rf);
    [-0.15, 0.15].forEach((x) => { const bg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.06), M(0x1b1e22, 0.7)); bg.position.set(x, 0.012, 0); c.add(bg); });
    c.visible = false; g.add(c); coaches.push(c); }
  const rd = liveSign(0.2, 3.6); rd.position.set(0, 1.55, -2.0); g.add(rd);
  it.k = 0; it.n = 0;
  it.setK = (k) => { it.k = k; const f = k * N; it.n = Math.floor(f + 1e-6);
    coaches.forEach((c, i) => { const home = X0 + 0.25 + i * CL; if (i < it.n) { c.visible = true; c.position.set(home, 0.074, ZT); } else if (i === it.n && f - i > 0.001) { c.visible = true; c.position.set(home + (1 - (f - i)) * 1.0, 0.074, ZT); } else c.visible = false; });
    rd.set(it.n ? [`${it.n} × 72 = ${IN(it.n * 72)}`] : [w_('1 coach = 72 berths')], it.n >= N ? '#8be07a' : '#ffd23f'); if (it.onK) it.onK(k); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([w_('1 coach = 72 berths')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 1.0, radius: 2 });
}
export function bindTrainHands(st, knob, app, s = { couple: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => st.knobPath(), active: () => stepNow(app, s.couple), keepVisible: () => app.runner.i === s.couple, k: () => st.k,
    set: (k) => { const kk = clamp01(k > 0.975 ? 1 : k); if (kk > st.k) st.setK(kk); if (st.n >= 14 && done.all) done.all(); } });
  const s0 = st.setK; st.setK = (k) => { s0(k); sync(); };
}

// ------------------------------------------------------------------ Class 5 Ch 5 Far and Near: a trundle wheel measures 10 m
// A chalk line with a peg at every metre runs across the playground. One full turn of the yellow trundle wheel is exactly
// 1 m (its rim is 1 m round) and its counter clicks once per turn. The slider pushes the wheel along.
export function trundleWheel(o = {}) {
  const it = new Item('jtrundle5', { ...o, name: { en: 'Trundle wheel', hi: 'मापने का पहिया', hg: 'Maapne ka pahiya' } });
  const g = it.g, w_ = o.W || ((k) => k), R = 1 / (2 * Math.PI), Z = -3.0, XA = -5;
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 0.03), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 1, transparent: true, opacity: 0.85 })); chalk.rotation.x = -Math.PI / 2; chalk.position.set(0, 0.004, Z + 0.1); g.add(chalk);
  for (let m = 0; m <= 10; m++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), M(m % 5 ? 0xe9e9e9 : 0xe74c3c, 0.5)); p.position.set(XA + m, 0.09, Z + 0.2); g.add(p); const t = tag(`${m} m`, '#ffffff', 0.09); t.position.set(XA + m, 0.3, Z + 0.2); g.add(t); }
  const wheel = new THREE.Group(); g.add(wheel); const spin = new THREE.Group(); spin.position.y = R; wheel.add(spin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.008, 0.012, 12, 64), M(0xf2c12e, 0.45)); spin.add(rim);
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(R, 0.006, 8, 64), M(0x1b1b1b, 0.8)); spin.add(tyre);
  for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.012, R * 2 - 0.03, 0.008), M(0xf2c12e, 0.45)); s.rotation.z = k * Math.PI / 4; spin.add(s); }
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.03), M(0xd93a2b, 0.4)); mark.position.y = -R + 0.012; spin.add(mark);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 16), M(0x2b2b2b, 0.5)); hub.rotation.x = Math.PI / 2; hub.position.y = R; wheel.add(hub);
  const fork = new THREE.Group(); fork.position.y = R; fork.rotation.z = 0.5; wheel.add(fork);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.95, 10), M(0x2b2f35, 0.4, 0.6)); pole.position.y = 0.475; fork.add(pole);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12), M(0x111111, 0.8)); grip.rotation.x = Math.PI / 2; grip.position.y = 0.95; fork.add(grip);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), M(0xf2c12e, 0.45)); box.position.y = 0.12; fork.add(box);
  const cnt = tag('0', '#ffd23f', 0.16); cnt.position.set(0, 1.2, 0.05); wheel.add(cnt);
  // a milestone, shown later
  const msT = tex(256, 384, (x) => { x.fillStyle = '#f7f7f2'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#f2c12e'; x.beginPath(); x.arc(128, 128, 128, Math.PI, 0); x.fill(); x.fillRect(0, 128, 256, 6); x.fillStyle = '#111'; x.textAlign = 'center'; x.font = `800 40px ${FONT}`; x.fillText(w_('Village'), 128, 98);
    x.font = `800 46px ${FONT}`; x.fillText('2 km', 128, 210); x.fillText('350 m', 128, 270); });
  const ms = new THREE.Group(); ms.position.set(2.0, 0, -3.4); ms.visible = false; g.add(ms);
  const msb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.16), [M(0xf7f7f2, 0.8), M(0xf7f7f2, 0.8), M(0xf2c12e, 0.6), M(0xf7f7f2), new THREE.MeshStandardMaterial({ map: msT, roughness: 0.8 }), M(0xf7f7f2)]); msb.position.y = 0.25; ms.add(msb);
  const mst = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.16, 24, 1, false, -Math.PI / 2, Math.PI), M(0xf2c12e, 0.6)); mst.rotation.x = -Math.PI / 2; mst.position.y = 0.5; ms.add(mst); ms.rotation.y = -0.4;
  const rd = liveSign(0.24, 3.6); rd.position.set(0, 1.7, -3.4); g.add(rd);
  it.d = 0;
  it.setD = (d) => { it.d = d; wheel.position.set(XA + d, 0, Z); spin.rotation.z = -d / R; const n = Math.floor(d + 1e-6); cnt.setText(String(n)); rd.set([`${n} ${w_('clicks')} = ${n} m`], n >= 10 ? '#8be07a' : '#ffd23f'); if (it.onD) it.onD(d); };
  it.milestone = () => { ms.visible = true; };
  it.say = (l, c) => rd.set(l, c);
  it.setD(0); it.say([w_('1 turn = 1 m')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 1.0, radius: 3 });
}
export function bindTrundleHands(tw, knob, app, s = { push: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => tw.knobPath(), active: () => stepNow(app, s.push), keepVisible: () => app.runner.i === s.push, k: () => tw.d / 10,
    set: (k) => { const d = clamp01(k > 0.98 ? 1 : k) * 10; if (d > tw.d) tw.setD(d); if (tw.d >= 10 && done.ten) done.ten(); } });
  const s0 = tw.setD; tw.setD = (d) => { s0(d); sync(); };
}

// ------------------------------------------------------------------ Class 5 Ch 6 The Dairy Farm: 180 litres into 40-litre cans
// A steel milk tank (with a glass gauge) holds the day's 180 L. Each push of the lever fills the next aluminium can
// through the hose: four cans take 40 L each and the fifth gets what is left, 20 L.
export function dairyCans(o = {}) {
  const it = new Item('jdairy5', { ...o, name: { en: 'Milk tank and cans', hi: 'दूध की टंकी और कैन', hg: 'Doodh ki tanki aur can' } });
  const g = it.g, w_ = o.W || ((k) => k), TOTAL = 180, CAP = 40, ZC = -1.15;
  const tank = new THREE.Group(); tank.position.set(-1.25, 0, -1.55); g.add(tank);
  const ss = M(0xd7dbe0, 0.22, 0.85);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 40), ss); body.rotation.z = Math.PI / 2; body.position.y = 0.72; body.castShadow = true; tank.add(body);
  [-0.45, 0.45].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), ss); e.scale.set(0.25, 1, 1); e.position.set(x, 0.72, 0); tank.add(e); });
  [[-0.32, -0.2], [0.32, -0.2], [-0.32, 0.2], [0.32, 0.2]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 10), ss); l.position.set(x, 0.225, z); tank.add(l); });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 24), ss); lid.position.set(0, 1.05, 0); tank.add(lid);
  const gaugeBack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.01), M(0xf4f4f0, 0.6)); gaugeBack.position.set(0.55, 0.72, 0.1); tank.add(gaugeBack);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false })); tube.position.set(0.55, 0.72, 0.12); tank.add(tube);
  const milkM = new THREE.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 0.35 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 12), milkM); col.position.set(0.55, 0.47, 0.12); tank.add(col);
  const gl = tag('180 L', '#ffffff', 0.07); gl.position.set(0.55, 1.06, 0.12); tank.add(gl);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12), ss); tap.rotation.x = Math.PI / 2; tap.position.set(0.25, 0.42, 0.3); tank.add(tap);
  // the hose: a tube from the tap to a nozzle that moves over each can
  const nozzle = new THREE.Group(); g.add(nozzle); const nz = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.08, 12), M(0x2b2f35, 0.4, 0.6)); nozzle.add(nz);
  const hoseM = M(0x2a6fd1, 0.55); let hose = null; const TAP = V(-1.25 + 0.25, 0.42, -1.55 + 0.36);
  const drawHose = () => { if (hose) { g.remove(hose); hose.geometry.dispose(); } const p = nozzle.position.clone().add(V(0, 0.04, 0)); const mid = TAP.clone().lerp(p, 0.5); mid.y = Math.min(TAP.y, p.y) - 0.15;
    hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(TAP, mid, p), 24, 0.012, 8), hoseM); g.add(hose); };
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 1, 10), milkM); stream.visible = false; g.add(stream);
  // aluminium cans
  const alu = M(0xc7ccd2, 0.32, 0.8);
  const canG = lathe([[0, 0], [0.15, 0], [0.165, 0.012], [0.165, 0.36], [0.155, 0.38], [0.11, 0.46], [0.075, 0.5], [0.07, 0.55], [0.085, 0.56], [0.085, 0.575], [0.07, 0.575], [0.064, 0.5], [0, 0.49]], 40);
  const cans = []; for (let i = 0; i < 5; i++) { const c = new THREE.Group(); c.position.set(-0.45 + i * 0.4, 0, ZC); g.add(c);
    const b = new THREE.Mesh(canG, alu); b.castShadow = true; c.add(b); [0.12, 0.3].forEach((y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.166, 0.006, 8, 40), alu); r.rotation.x = Math.PI / 2; r.position.y = y; c.add(r); });
    [-1, 1].forEach((s) => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 16, Math.PI), alu); h.position.set(s * 0.12, 0.44, 0); h.rotation.y = Math.PI / 2; h.rotation.z = s * 0.6; c.add(h); });
    const cl = new THREE.Group(); cl.position.y = 0.575; c.add(cl); const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.035, 32), alu); cm.position.y = 0.017; cl.add(cm); const kn = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 8, 16), alu); kn.position.y = 0.045; cl.add(kn);
    const surf = new THREE.Mesh(new THREE.CircleGeometry(0.066, 32), milkM); surf.rotation.x = -Math.PI / 2; surf.position.y = 0.5; surf.visible = false; c.add(surf);
    const t = tag('40 L', '#ffffff', 0.08); t.position.set(0, 0.78, 0); t.visible = false; c.add(t);
    cans.push({ c, cl, surf, t }); }
  const sign = tag('15 × 12 L = 180 L', '#ffd23f', 0.1); sign.position.set(-1.25, 1.35, -1.55); g.add(sign);
  const rd = liveSign(0.2, 3.6); rd.position.set(0.3, 1.45, -2.0); g.add(rd);
  animator(it); it.n = 0; it.left = TOTAL;
  const setGauge = () => { const h = Math.max(0.002, 0.5 * it.left / TOTAL); col.scale.y = h; col.position.y = 0.47 + h / 2; gl.setText(`${it.left} L`); };
  const NZH = V(-0.75, 0.9, -1.25); nozzle.position.copy(NZH); drawHose(); setGauge();
  it.fill1 = (cb) => { if (it.busy || it.n >= 5 || it.left <= 0) return false; const i = it.n, C = cans[i], amt = Math.min(CAP, it.left), l0 = it.left, from = nozzle.position.clone(), to = C.c.position.clone().add(V(0, 0.82, 0));
    it.play(1.6, (k) => {
      if (k < 0.2) { const e = ease(k / 0.2); C.cl.position.set(0, 0.575 - e * 0.575 + Math.sin(e * Math.PI) * 0.15, 0.3 * e); nozzle.position.lerpVectors(from, to, e); drawHose(); }
      else if (k < 0.85) { const e = (k - 0.2) / 0.65; it.left = Math.round(l0 - amt * e); setGauge(); C.surf.visible = amt >= CAP && e > 0.7; stream.visible = true; stream.scale.y = 0.3; stream.position.copy(to).add(V(0, -0.19, 0)); }
      else { stream.visible = false; } },
    () => { stream.visible = false; it.left = l0 - amt; setGauge(); it.n++; C.t.setText(`${amt} L`); C.t.visible = true; C.surf.visible = amt >= CAP;
      if (amt >= CAP) C.cl.position.set(0, 0.575, 0);
      const full = cans.slice(0, it.n).filter((_, j) => j < 4).length; rd.set(it.left > 0 ? [`${full} × 40 L = ${full * 40} L`, `${w_('left in tank')}: ${it.left} L`] : [`4 × 40 L + 20 L = 180 L`], it.left > 0 ? ['#ffd23f', '#ffffff'] : '#8be07a'); if (cb) cb(); }); return true; };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Each can holds 40 L')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 1.2, radius: 2 });
}
export function bindDairyHands(dc, lever, app, s = { fill: 1 }, done = {}) {
  pushKnob(lever, { path: () => dc.leverPath(), active: () => stepNow(app, s.fill) && !dc.busy && dc.left > 0, keepVisible: () => app.runner.i === s.fill, press: () => dc.fill1(() => { if (dc.left <= 0 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 7 Shapes and Patterns: which tiles cover a floor?
// Three frames on the courtyard floor. Each push of the lever lays one kind of tile: squares, hexagons, then circles.
// Squares and hexagons meet with no gaps (4 × 90° and 3 × 120° make 360°); circles always leave gaps.
export function floorTiles(o = {}) {
  const it = new Item('jtiles5', { ...o, name: { en: 'Floor tiles', hi: 'फ़र्श की टाइलें', hg: 'Farsh ki tiles' } });
  const g = it.g, w_ = o.W || ((k) => k), S = 0.9, Z = -1.75, XS = [-1.05, 0, 1.05], TH = 0.014;
  const frameM = new THREE.MeshStandardMaterial({ map: woodTex('#5a3518', 71), roughness: 0.6 });
  XS.forEach((x) => { [[0, -S / 2 - 0.02, S + 0.08, 0.04], [0, S / 2 + 0.02, S + 0.08, 0.04]].forEach(([dx, dz, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), frameM); b.position.set(x + dx, 0.015, Z + dz); g.add(b); });
    [-1, 1].forEach((s) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, S), frameM); b.position.set(x + s * (S / 2 + 0.02), 0.015, Z); g.add(b); });
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(S, S), M(0x6f6a62, 0.95)); bed.rotation.x = -Math.PI / 2; bed.position.set(x, 0.003, Z); g.add(bed); });
  const glaze = (c, c2, seed) => tex(128, 128, (x) => { const r = rnd(seed); x.fillStyle = c; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${r() * 0.12})`; x.fillRect(r() * 128, r() * 128, 6, 2); } x.strokeStyle = c2; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 34, 0, 7); x.stroke(); x.fillStyle = c2; x.beginPath(); x.arc(64, 64, 10, 0, 7); x.fill(); });
  const sets = [[], [], []], M3 = [];
  // squares 15 cm: a checkerboard of terracotta and cream
  const sqA = new THREE.MeshStandardMaterial({ map: glaze('#b5532f', '#8e3b1f', 3), roughness: 0.55 }), sqB = new THREE.MeshStandardMaterial({ map: glaze('#efe3c8', '#c9a66b', 5), roughness: 0.5 });
  const sq = 0.15, sqG = new THREE.BoxGeometry(sq * 0.97, TH, sq * 0.97);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const m = new THREE.Mesh(sqG, (i + j) % 2 ? sqA : sqB); m.userData.to = V(XS[0] - S / 2 + sq * (i + 0.5), TH / 2 + 0.004, Z - S / 2 + sq * (j + 0.5)); sets[0].push(m); }
  // hexagons, side 9 cm, pointy towards the blackboard
  const hs = 0.09, hexG = new THREE.CylinderGeometry(hs * 0.97, hs * 0.97, TH, 6); const hexM = [new THREE.MeshStandardMaterial({ map: glaze('#2e6fb5', '#f2f2f2', 7), roughness: 0.35 }), new THREE.MeshStandardMaterial({ map: glaze('#f2f2f2', '#2e6fb5', 9), roughness: 0.35 }), new THREE.MeshStandardMaterial({ map: glaze('#f2c12e', '#2e6fb5', 11), roughness: 0.35 })];
  const hw = Math.sqrt(3) * hs; let hexMid = null;
  for (let r = -4; r <= 4; r++) for (let c = -4; c <= 4; c++) { const x = c * hw + (r & 1 ? hw / 2 : 0), z = r * 1.5 * hs; if (Math.abs(x) > S / 2 - hw * 0.3 || Math.abs(z) > S / 2 - hs * 0.4) continue;
    const m = new THREE.Mesh(hexG, hexM[((r % 3) + 3 + c * 2) % 3]); m.userData.to = V(XS[1] + x, TH / 2 + 0.004, Z + z); sets[1].push(m); if (r === 0 && c === 0) hexMid = V(XS[1], 0, Z + hs); }
  // circles 15 cm across in rows: gaps between them
  const cG = new THREE.CylinderGeometry(0.073, 0.073, TH, 32), cM = new THREE.MeshStandardMaterial({ map: glaze('#3f9a5a', '#e8f2e0', 13), roughness: 0.4 });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const m = new THREE.Mesh(cG, cM); m.userData.to = V(XS[2] - S / 2 + 0.15 * (i + 0.5), TH / 2 + 0.004, Z - S / 2 + 0.15 * (j + 0.5)); sets[2].push(m); }
  sets.forEach((s) => s.forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.visible = false; g.add(m); }));
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false });
  const marks = [V(XS[0], 0, Z), hexMid, V(XS[2] + 0.075 * 0, 0, Z)].map((p, i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 24), ringM); r.rotation.x = Math.PI / 2; r.position.copy(p).setY(0.03); r.visible = false; g.add(r); M3.push(r); return r; }); void marks;
  const tagsC = [tag('4 × 90° = 360°', '#8be07a', 0.09), tag('3 × 120° = 360°', '#8be07a', 0.09), tag(w_('gaps!'), '#ff8a5a', 0.09)]; tagsC.forEach((t, i) => { t.position.set(XS[i], 0.45, Z + 0.2); t.visible = false; g.add(t); });
  const names = [w_('squares'), w_('hexagons'), w_('circles')].map((s, i) => { const t = tag(s, '#ffffff', 0.08); t.position.set(XS[i], 0.16, Z + S / 2 + 0.14); g.add(t); return t; }); void names;
  const rd = liveSign(0.2, 3.6); rd.position.set(0, 1.35, -2.4); g.add(rd);
  animator(it); it.n = 0;
  it.lay = (cb) => { if (it.busy || it.n >= 3) return false; const set = sets[it.n], i0 = it.n, cen = V(XS[i0], 0, Z); const order = set.slice().sort((a, b) => a.userData.to.distanceTo(cen) - b.userData.to.distanceTo(cen));
    order.forEach((m, j) => { m.userData.d = j / order.length; m.visible = true; m.position.copy(m.userData.to).setY(0.5); });
    it.play(1.4, (k) => { order.forEach((m) => { const e = ease(clamp01((k - m.userData.d * 0.6) / 0.4)); m.position.y = m.userData.to.y + (1 - e) * 0.5; m.visible = e > 0; }); },
      () => { it.n++; rd.set([[`${w_('squares')}: ${w_('no gaps')}`], [`${w_('hexagons')}: ${w_('no gaps')}`], [`${w_('circles')}: ${w_('gaps!')}`]][i0], i0 < 2 ? '#8be07a' : '#ff8a5a'); if (cb) cb(); }); return true; };
  it.corners = () => { M3.forEach((r, i) => { r.visible = i < 2; }); tagsC.forEach((t) => { t.visible = true; }); };
  it.say = (l, c) => rd.set(l, c);
  it.say([w_('Which tiles leave no gaps?')], '#ffffff');
  it.leverPath = floorLever;
  return done1(it, { height: 0.1, radius: 1.6 });
}
export function bindTileHands(ft, lever, app, s = { lay: 1 }, done = {}) {
  pushKnob(lever, { path: () => ft.leverPath(), active: () => stepNow(app, s.lay) && !ft.busy && ft.n < 3, keepVisible: () => app.runner.i === s.lay, press: () => ft.lay(() => { if (ft.n >= 3 && done.all) done.all(); }) });
}

// ------------------------------------------------------------------ Class 5 Ch 8 Weight and Capacity: mugs into a bucket on a scale
// A blue water drum, a 500 mL steel mug and a bucket marked at 10 L standing on a platform scale (set to zero with the
// empty bucket). Sliding the handle carries mug after mug from the drum to the bucket; the scale follows the water.
export function bucketScale(o = {}) {
  const it = new Item('jbucket5', { ...o, name: { en: 'Bucket, mug and scale', hi: 'बाल्टी, मग और तराज़ू', hg: 'Baalti, mug aur taraazu' } });
  const g = it.g, w_ = o.W || ((k) => k), Z = -0.95, DX = -0.6, BX = 0.35, SY = 0.07, BH = 0.3, R0 = 0.11, R1 = 0.155;
  // drum
  const drumM = M(0x1f5fbf, 0.45);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.86, 40, 1, true), drumM); drum.material.side = THREE.DoubleSide; drum.position.set(DX, 0.43, Z - 0.1); drum.castShadow = true; g.add(drum);
  [0.25, 0.6].forEach((y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.292, 0.012, 8, 40), drumM); r.rotation.x = Math.PI / 2; r.position.set(DX, y, Z - 0.1); g.add(r); });
  const dw = new THREE.Mesh(new THREE.CircleGeometry(0.285, 40), new THREE.MeshStandardMaterial({ color: 0x2e7fa8, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85 })); dw.rotation.x = -Math.PI / 2; dw.position.set(DX, 0.78, Z - 0.1); g.add(dw);
  // platform scale with a dial on top
  const sc = new THREE.Mesh(new THREE.BoxGeometry(0.36, SY, 0.36), M(0x3a4048, 0.5, 0.3)); sc.position.set(BX, SY / 2, Z); sc.castShadow = true; g.add(sc);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.006, 0.33), M(0xb8bec6, 0.35, 0.8)); plate.position.set(BX, SY + 0.003, Z); g.add(plate);
  const dialT = tex(256, 256, (x) => { x.fillStyle = '#fbfaf6'; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.strokeStyle = '#111'; x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 22px ${FONT}`;
    for (let v = 0; v <= 20; v++) { const a = (-135 + v * 13.5) * DEG; x.lineWidth = v % 5 ? 2 : 4; const r1 = v % 5 ? 104 : 94; x.beginPath(); x.moveTo(128 + Math.sin(a) * r1, 128 - Math.cos(a) * r1); x.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118); x.stroke(); if (v % 5 === 0) x.fillText(String(v), 128 + Math.sin(a) * 76, 130 - Math.cos(a) * 76); } x.font = `700 20px ${FONT}`; x.fillText('kg', 128, 190); });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.06, 40), new THREE.MeshBasicMaterial({ map: dialT, toneMapped: false })); dial.rotation.x = -Math.PI / 2 + 0.5; dial.position.set(BX, 0.108, Z + 0.215); g.add(dial);
  const dialBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.08), M(0x3a4048, 0.5, 0.3)); dialBox.position.set(BX, 0.04, Z + 0.21); g.add(dialBox);
  const ndl = new THREE.Group(); ndl.position.copy(dial.position).add(V(0, 0.0018, 0.001)); ndl.rotation.x = -Math.PI / 2 + 0.5; g.add(ndl); const nm = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.05, 0.001), new THREE.MeshBasicMaterial({ color: 0xd93a2b, toneMapped: false })); nm.position.y = 0.02; ndl.add(nm);
  // bucket
  const bk = new THREE.Group(); bk.position.set(BX, SY + 0.006, Z); g.add(bk);
  const bkM = new THREE.MeshStandardMaterial({ color: 0xd9472b, roughness: 0.4, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R1, R0, BH, 40, 1, true), bkM); shell.position.y = BH / 2; shell.castShadow = true; bk.add(shell);
  const bb = new THREE.Mesh(new THREE.CircleGeometry(R0, 40), bkM); bb.rotation.x = -Math.PI / 2; bb.position.y = 0.003; bk.add(bb);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(R1, 0.008, 8, 40), bkM); lip.rotation.x = Math.PI / 2; lip.position.y = BH; bk.add(lip);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(R1 * 0.98, 0.004, 6, 32, Math.PI), M(0x9aa3ad, 0.3, 0.8)); handle.position.y = BH; handle.rotation.y = 0.0; handle.rotation.x = -0.25; bk.add(handle);
  const rAt = (y) => R0 + (R1 - R0) * y / BH;
  const vol = (y) => { let v = 0; const n = 40; for (let i = 0; i < n; i++) { const r = rAt((i + 0.5) * y / n); v += Math.PI * r * r * y / n; } return v * 1000; }; // litres
  const tbl = []; for (let i = 0; i <= 200; i++) { const y = BH * i / 200; tbl.push([y, vol(y)]); } const yFor = (L) => { for (let i = 1; i < tbl.length; i++) if (tbl[i][1] >= L) { const [y0, v0] = tbl[i - 1], [y1, v1] = tbl[i]; return y0 + (y1 - y0) * (L - v0) / (v1 - v0); } return BH; };
  const y10 = yFor(10);
  const mark10 = new THREE.Mesh(new THREE.TorusGeometry(rAt(y10) - 0.002, 0.002, 6, 40), M(0xffffff, 0.4)); mark10.rotation.x = Math.PI / 2; mark10.position.y = y10; bk.add(mark10);
  const t10 = tag('10 L', '#ffffff', 0.05); t10.position.set(0, BH + 0.06, R1); bk.add(t10);
  const waterM = new THREE.MeshStandardMaterial({ color: 0x3a8fc0, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, 0.001, 40), waterM); water.visible = false; bk.add(water);
  // mug
  const mug = new THREE.Group(); g.add(mug); const mugM = steelMat();
  const mb = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.044, 0.095, 32, 1, true), mugM); mb.material.side = THREE.DoubleSide; mb.position.y = 0.0475; mug.add(mb);
  const mbb = new THREE.Mesh(new THREE.CircleGeometry(0.044, 32), mugM); mbb.rotation.x = -Math.PI / 2; mug.add(mbb);
  const mh = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 16, Math.PI), mugM); mh.position.set(0.05, 0.05, 0); mh.rotation.z = -Math.PI / 2; mug.add(mh);
  const mw = new THREE.Mesh(new THREE.CircleGeometry(0.043, 24), waterM); mw.rotation.x = -Math.PI / 2; mw.position.y = 0.085; mug.add(mw);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 10), waterM); stream.visible = false; g.add(stream);
  const DRUM = V(DX, 0.74, Z - 0.1), OVER = V(BX + 0.03, SY + BH + 0.14, Z), MHOME = V(DX + 0.42, 0, Z + 0.25);
  mug.position.copy(MHOME);
  const rd = liveSign(0.14, 3.6); rd.position.set(0, 1.05, -1.5); g.add(rd);
  it.m = 0; it.k = 0;
  it.setK = (k) => { it.k = k; const f = k * 20, m = Math.floor(f + 1e-6), ph = f - m; it.m = m;
    const L = Math.min(10, (m + (ph > 0.6 ? (ph - 0.6) / 0.4 : 0)) * 0.5); if (L > 0.001) { const y = yFor(L); water.visible = true; water.geometry.dispose(); water.geometry = new THREE.CylinderGeometry(rAt(y) - 0.003, R0 - 0.003, y, 40); water.position.y = y / 2; } else water.visible = false;
    ndl.rotation.z = -(-135 + L * 13.5) * DEG;
    if (k >= 1 - 1e-6) { mug.position.copy(MHOME); mug.rotation.z = 0; stream.visible = false; mw.visible = true; }
    else if (k > 0) { // dip (0 … 0.3), carry (0.3 … 0.6), pour (0.6 … 1)
      if (ph < 0.3) { const e = ph / 0.3; mug.position.lerpVectors(m === 0 ? MHOME : OVER, DRUM, e < 0.5 ? e * 2 : 1); mug.rotation.z = 0; mw.visible = e > 0.5; stream.visible = false; }
      else if (ph < 0.6) { const e = (ph - 0.3) / 0.3; mug.position.lerpVectors(DRUM, OVER, e); mug.position.y += Math.sin(e * Math.PI) * 0.1; mug.rotation.z = 0; mw.visible = true; stream.visible = false; }
      else { const e = (ph - 0.6) / 0.4; mug.position.copy(OVER); mug.rotation.z = Math.min(1.6, e * 3); mw.visible = e < 0.4; const lip2 = mug.localToWorld(V(-0.046, 0.095, 0)); g.worldToLocal(lip2); const yT = SY + 0.006 + yFor(Math.max(0.01, L)); const len = Math.max(0.01, lip2.y - yT);
        stream.visible = e > 0.15 && e < 0.95; stream.scale.y = len; stream.position.set(lip2.x, yT + len / 2, Z); } }
    const mm = m >= 20 ? 20 : m; rd.set([`${mm} × 500 mL = ${IN(mm * 500)} mL`, `= ${mm / 2} L   ·   ${w_('scale')}: ${(Math.round(L * 10) / 10)} kg`], mm >= 20 ? ['#8be07a', '#8be07a'] : ['#ffd23f', '#ffffff']); if (it.onK) it.onK(k); };
  it.say = (l, c) => rd.set(l, c);
  it.setK(0); it.say([w_('Mug = 500 mL, bucket mark = 10 L')], '#ffffff');
  it.knobPath = floorKnob;
  return done1(it, { height: 0.9, radius: 1.2 });
}
export function bindBucketHands(bs, knob, app, s = { fill: 1 }, done = {}) {
  const sync = slideKnob(knob, { path: () => bs.knobPath(), active: () => stepNow(app, s.fill), keepVisible: () => app.runner.i === s.fill, k: () => bs.k,
    set: (k) => { const kk = clamp01(k > 0.985 ? 1 : k); if (kk > bs.k) bs.setK(kk); if (bs.k >= 1 - 1e-6 && done.full) done.full(); } });
  const s0 = bs.setK; bs.setK = (k) => { s0(k); sync(); };
}
