// Batch 3 apparatus (Class 6–8 book experiments): filter funnel on a stand, glass tumbler (mist forms outside when cold),
// candle with the real flame zones, gas jar with lid, deflagrating spoon, bar magnet with iron filings, paper cup that chars,
// hacksaw blade / copper wire that glow, glass slide that gets soot, metal and wooden spoons with a wax bead,
// hammer, iron block and samples, a desk lamp used as "sunlight", steel plate and bottle cap, petri dish, ice cubes.
import * as THREE from 'three';
import { Item, Vessel, flame, realTex, heap, nail } from './apparatus.js';
import { glassMat, canvasTex, woodTex } from './mats.js';

const V2 = (r, y) => new THREE.Vector2(r, y);
const SEG = 40;
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
const paperMat = (c = 0xf6f3ea) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, side: THREE.DoubleSide });
const steel = () => new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 0.9, roughness: 0.3 });

// ------------------------------------------------------------------ filtration
// glass funnel with a folded filter-paper cone; it drains into the vessel below and keeps the insoluble part (residue)
export function filterFunnel(o = {}) {
  const prof = [[0.0034, 0], [0.0034, 0.044], [0.0048, 0.05], [0.037, 0.092], [0.0385, 0.094]];
  const v = new Vessel('funnel_f', prof, { ...o, wall: 0.0011, name: o.name || { en: 'Funnel with filter paper', hi: 'फ़िल्टर पेपर लगी कीप', hg: 'Filter paper wali keep' } });
  const pp = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pp.push(V2(0.0042 + t * 0.0305, 0.052 + t * 0.043)); }
  const paper = new THREE.Mesh(new THREE.LatheGeometry(pp, SEG), new THREE.MeshStandardMaterial({ color: 0xf7f6f0, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
  paper.renderOrder = 5; paper.userData.noHit = true; v.g.add(paper); v.paper = paper;
  const rp = []; for (let i = 0; i <= 6; i++) { const t = i / 6; rp.push(V2(0.0046 + t * 0.012, 0.0535 + t * 0.017)); }
  const res = new THREE.Mesh(new THREE.LatheGeometry(rp, SEG), new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false }));
  res.renderOrder = 6; res.userData.noHit = true; v.g.add(res);
  v.filter = true; v.residue = 0; v.setResidue = (k, col) => { res.material.opacity = Math.min(0.95, k * 0.9); if (col) res.material.color.set(col); res.scale.setScalar(0.8 + Math.min(1, k) * 0.35); };
  v.grabY = 0.08; return v;
}
// funnel stand (rod + ring) that holds a funnel over a flask/beaker
export function funnelStand(ringY, o = {}) {
  const it = new Item('fstand', { ...o, name: { en: 'Funnel stand', hi: 'कीप स्टैंड', hg: 'Funnel stand' } });
  const m = steel(); const base = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.07), new THREE.MeshStandardMaterial({ map: woodTex('#6d4a2b'), roughness: 0.6 })); base.position.y = 0.004; it.g.add(base);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, ringY + 0.04, 12), m); rod.position.set(-0.045, (ringY + 0.04) / 2, 0); it.g.add(rod);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.004, 0.004), m); arm.position.set(-0.0225, ringY, 0); it.g.add(arm);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0022, 8, 32), m); ring.rotation.x = Math.PI / 2; ring.position.set(0.0, ringY, 0); it.g.add(ring);
  it.height = ringY; it.radius = 0.05; it.grabY = ringY * 0.5; return it;
}

// ------------------------------------------------------------------ glass tumbler (mist forms on the outside when it is cold)
function dropletTex() {
  return canvasTex(512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const r = 1 + Math.pow(Math.random(), 3) * 7, px = Math.random() * w, py = Math.random() * h;
      const g = x.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(225,235,245,0.55)'); g.addColorStop(1, 'rgba(200,215,230,0.25)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    for (let i = 0; i < 9000; i++) { x.fillStyle = 'rgba(240,245,250,0.35)'; x.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4); } // fine fog
  });
}
let DTEX = null;
export function tumbler(o = {}) {
  const prof = [[0, 0], [0.0255, 0], [0.027, 0.004], [0.0315, 0.1], [0.0328, 0.101]];
  const v = new Vessel('tumbler', prof, { ...o, wall: 0.0018, name: o.name || { en: 'Glass tumbler', hi: 'काँच का गिलास', hg: 'Glass tumbler' }, cap: 250 });
  DTEX = DTEX || dropletTex(); const t = DTEX.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.needsUpdate = true;
  const mist = new THREE.Mesh(new THREE.LatheGeometry(prof.slice(1, 4).map(([r, y]) => V2(r + 0.0007, y)), SEG), new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0, roughness: 0.2, depthWrite: false }));
  mist.renderOrder = 8; mist.userData.noHit = true; v.g.add(mist);
  // mist inside (when a candle burns under the upside-down tumbler)
  const mistIn = new THREE.Mesh(new THREE.LatheGeometry(prof.slice(1, 4).map(([r, y]) => V2(r - 0.0022, y)), SEG), new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0, roughness: 0.2, depthWrite: false, side: THREE.BackSide }));
  mistIn.renderOrder = 8; mistIn.userData.noHit = true; v.g.add(mistIn);
  v.mist = 0; v.mistIn = 0; v.setMist = (k) => { v.mist = k; mist.material.opacity = Math.min(0.9, k); }; v.setMistIn = (k) => { v.mistIn = k; mistIn.material.opacity = Math.min(0.8, k); };
  v.grabY = 0.06; return v;
}
// ice cubes float in a vessel and shrink as they melt
export function iceCubes(v, n = 4) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.12, transparent: true, opacity: 0.62, clearcoat: 1, ior: 1.31 });
  const r = v.rInner(v.heightFor(v.ml)) * 0.55; const cubes = [];
  for (let i = 0; i < n; i++) {
    const s = 0.012 + Math.random() * 0.004; const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.9, s, 2, 2, 2), mat);
    const p = m.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); const f = 1 - 0.12 * (Math.abs(x) + Math.abs(y) + Math.abs(z)) / s; p.setXYZ(k, x * f, y * f, z * f); } m.geometry.computeVertexNormals(); // rounded corners
    const a = (i / n) * 6.28 + Math.random(); m.userData.off = new THREE.Vector2(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); m.rotation.set(Math.random() * 0.4, Math.random() * 3, Math.random() * 0.4);
    m.renderOrder = 5; m.userData.noHit = true; v.g.add(m); cubes.push(m);
  }
  v.iceMeshes = cubes; v.ice = (v.ice || 0) + n * 12; v.ice0 = v.ice; // grams of ice
  v.placeIce = () => { const h = v.heightFor(v.ml); const k = Math.cbrt(Math.max(0, v.ice) / Math.max(1, v.ice0)); cubes.forEach((m) => { m.visible = k > 0.05; m.scale.setScalar(Math.max(0.05, k)); m.position.set(m.userData.off.x, Math.max(v.inner[0].y + 0.006 * k, h - 0.003 * k), m.userData.off.y); }); };
  v.placeIce(); return cubes;
}

// ------------------------------------------------------------------ candle with the real flame zones
export function candleFlame() {
  const g = new THREE.Group();
  const mk = (h, r, c1, c2, op, blend = THREE.AdditiveBlending, fall = [0.65, 1.0], prof) => {
    const pts = prof || [V2(0.0001, 0), V2(r * 0.85, h * 0.12), V2(r, h * 0.35), V2(r * 0.78, h * 0.62), V2(r * 0.35, h * 0.86), V2(0.0001, h)];
    const geo = new THREE.LatheGeometry(pts, 28);
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: blend, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) }, op: { value: op }, h: { value: h }, fl: { value: 1 } },
      vertexShader: `uniform float t; uniform float h; uniform float fl; varying float vy; varying vec3 vn; varying vec3 vv;
        void main(){ vec3 p = position; vy = p.y / h; float s = (sin(t*11.0 + p.y*120.0)*0.0006 + sin(t*5.3)*0.0004) * fl; p.x += s*vy*vy*4.0; p.z += cos(t*9.0+p.y*90.0)*0.0005*vy*vy*4.0*fl;
        vec4 mv = modelViewMatrix*vec4(p,1.0); vn = normalize(normalMatrix*normal); vv = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 c1; uniform vec3 c2; uniform float op; varying float vy; varying vec3 vn; varying vec3 vv;
        void main(){ float rim = abs(dot(vn, vv)); float a = op * smoothstep(0.0,0.08,vy) * (1.0 - smoothstep(${fall[0].toFixed(2)},${fall[1].toFixed(2)},vy)) * (0.25 + 0.75*rim);
        gl_FragColor = vec4(mix(c1, c2, smoothstep(0.1,0.8,vy)), a); }` });
    const mesh = new THREE.Mesh(geo, m); mesh.userData.noHit = true; mesh.renderOrder = 9; g.add(mesh); return { m, mesh };
  };
  const outer = mk(0.046, 0.0085, 0x3d5cff, 0x6a5aff, 0.22, THREE.AdditiveBlending, [0.55, 1.0]); // faint blue, hottest (non-luminous)
  const lum = mk(0.04, 0.0068, 0xff9a2a, 0xfff2b0, 0.95, THREE.AdditiveBlending, [0.62, 1.0]); // yellow luminous zone
  const dark = mk(0.014, 0.0032, 0x2a1a0e, 0x4a2e18, 0.55, THREE.NormalBlending, [0.6, 1.0]); // dark zone of unburnt wax vapour around the wick
  const base = mk(0.008, 0.0062, 0x2648ff, 0x4f7aff, 0.75, THREE.AdditiveBlending, [0.3, 1.0], [V2(0.0045, 0), V2(0.0062, 0.003), V2(0.0055, 0.006), V2(0.003, 0.008)]); // blue cup at the bottom
  dark.mesh.position.y = 0.002; lum.mesh.position.y = 0.0015; base.mesh.position.y = -0.0005; outer.mesh.position.y = -0.001;
  const light = new THREE.PointLight(0xffb45a, 0.012, 0.55, 2); light.position.y = 0.03; g.add(light);
  const all = [outer, lum, dark, base];
  g.userData.tick = (t, size = 1, flick = 1) => { all.forEach((p) => { p.m.uniforms.t.value = t; p.m.uniforms.fl.value = flick; }); g.scale.set(size, size * (0.92 + Math.sin(t * 17) * 0.02 * flick), size); light.intensity = (0.011 + Math.sin(t * 21) * 0.0015 * flick) * size; };
  g.userData.zones = { dark: 0.006, lum: 0.026, outer: 0.044 }; // local heights (above the wick tip) of each zone's middle
  return g;
}
export function candle(o = {}) {
  const it = new Item('candle', { ...o, name: o.name || { en: 'Candle', hi: 'मोमबत्ती', hg: 'Candle (mombatti)' } });
  const H = o.h ?? 0.07, R = 0.0095;
  const dish = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.042, 0), V2(0.044, 0.002), V2(0.045, 0.011), V2(0.046, 0.012)], 32), glassMat({ opacity: 0.2 })); dish.renderOrder = 6; it.g.add(dish);
  const waxM = new THREE.MeshPhysicalMaterial({ color: 0xf8f3e6, roughness: 0.55, transmission: 0, sheen: 0.4, emissive: 0xffb060, emissiveIntensity: 0 });
  const wax = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0.002), V2(R, 0.002), V2(R, H - 0.004), V2(R * 0.92, H - 0.001), V2(R * 0.55, H - 0.0022), V2(0, H - 0.0026)], 32), waxM); it.g.add(wax);
  const drip = new THREE.Mesh(new THREE.TorusGeometry(R * 0.98, 0.0012, 6, 24), waxM); drip.rotation.x = Math.PI / 2; drip.position.y = H - 0.003; it.g.add(drip);
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0007, 0.008, 6), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 })); wick.position.y = H + 0.001; wick.rotation.z = 0.12; it.g.add(wick);
  const f = candleFlame(); f.position.y = H + 0.002; f.visible = false; it.g.add(f); it.flame = f; it.waxM = waxM;
  it.wickTop = H + 0.004; it.heatPoint = new THREE.Vector3(0, H + 0.03, 0); it.flameTop = H + 0.046;
  it.zoneLocal = (z) => new THREE.Vector3(0, H + 0.002 + f.userData.zones[z] * f.scale.y, 0);
  it.height = H; it.radius = 0.045; it.grabY = H * 0.5;
  it.lit = false; it.o2 = 1; it.size = 1;
  it.setLit = (on) => { it.lit = on; f.visible = on; waxM.emissiveIntensity = on ? 0.05 : 0; if (on) { it.o2 = 1; it.size = 1; } };
  it.update = (dt, t) => {
    if (!it.lit) return;
    const lab = it.lab; const jar = it.coveredBy;
    if (jar) { const vol = Math.max(100, jar.maxMl || 250); it.o2 = Math.max(0, it.o2 - dt * (lab?.chem?.lapse ?? 1) * 12 / vol); jar.gas.CO2 = (jar.gas.CO2 || 0) + dt * 0.05; jar.setMistIn && jar.setMistIn(Math.min(0.6, (jar.mistIn || 0) + dt * 0.04)); }
    const k = it.o2 > 0.7 ? 1 : Math.max(0, (it.o2 - 0.45) / 0.25);
    if (it.boost > 0) it.boost -= dt; if (it.flick > 0) it.flick -= dt; // oxygen makes it flare up; a pop makes it flutter
    it.size += ((0.25 + 0.75 * k) * (it.boost > 0 ? 1.7 : 1) - it.size) * Math.min(1, dt * 3);
    f.userData.tick(t, it.size, jar ? 1 + (1 - k) * 4 : it.flick > 0 ? 6 : 1);
    if (it.o2 < 0.46) { it.setLit(false); it.out = true; if (lab) { const p = it.g.localToWorld(tmp.set(0, it.wickTop, 0)); for (let i = 0; i < 4; i++) lab.fx.puff(p, '#d8d4cc', { alpha: 0.35, size: 0.003, grow: 0.02, life: 2.5, up: 0.03 }); lab.emit('candle_out', { obj: it.id }); } }
  };
  return it;
}

// ------------------------------------------------------------------ gas jar with a glass lid (cover plate)
export function gasJar(o = {}) {
  const prof = [[0, 0], [0.026, 0], [0.028, 0.004], [0.028, 0.15], [0.031, 0.152]];
  const v = new Vessel('gasjar', prof, { ...o, wall: 0.0018, name: o.name || { en: 'Gas jar', hi: 'गैस जार', hg: 'Gas jar' }, cap: 300 });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.003, 32), glassMat({ opacity: 0.3 })); lid.position.y = 0.1545; lid.renderOrder = 7; lid.visible = false; v.g.add(lid); v.lid = lid;
  const fume = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.145, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8e6dc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  fume.position.y = 0.078; fume.renderOrder = 7; fume.userData.noHit = true; v.g.add(fume); v.fumeMesh = fume;
  v.setLid = (on) => { lid.visible = on; v.closed = on; v.holdGas = on; };
  v.setFume = (k) => { fume.material.opacity = Math.min(0.35, k); };
  v.grabY = 0.09; return v;
}

// ------------------------------------------------------------------ deflagrating spoon with sulphur
export function deflagratingSpoon(o = {}) {
  const it = new Item('defspoon', { ...o, name: { en: 'Deflagrating spoon', hi: 'दहन चम्मच', hg: 'Deflagrating spoon' } });
  const m = steel(); m.color.setHex(0x9a9ea2);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.24, 10), m); rod.position.y = 0.12 + 0.006; it.g.add(rod);
  const cup = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.007, 0.0005), V2(0.0085, 0.004), V2(0.009, 0.0065)], 20), m); it.g.add(cup);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.002, 28), m); disc.position.y = 0.16; it.g.add(disc); // sits on the jar mouth like a lid
  const sMat = new THREE.MeshStandardMaterial({ color: 0xf2d41c, roughness: 0.9, map: realTex('sulphur'), bumpMap: realTex('sulphur'), bumpScale: 0.6 });
  const s = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 8, 0, 6.29, 0, 1.4), sMat); s.scale.set(1, 0.6, 1); s.position.y = 0.002; it.g.add(s);
  const bf = flame('spirit'); bf.scale.set(0.28, 0.3, 0.28); bf.position.y = 0.004; bf.visible = false; it.g.add(bf);
  bf.traverse((q) => { if (q.material?.uniforms) { q.material.uniforms.c1.value.setHex(0x3a6cff); q.material.uniforms.c2.value.setHex(0x6aa8ff); } });
  it.sulphur = 1; it.melt = 0; it.burning = false; it.sMat = sMat; it.sMesh = s; it.blueFlame = bf;
  it.cupLocal = new THREE.Vector3(0, 0.003, 0); it.discY = 0.16;
  it.height = 0.012; it.radius = 0.035; it.grabY = 0.2; it.base = 0;
  it.flameTest = (dt, f, hp) => { // the cup is in a flame
    if (it.sulphur <= 0) return; const c = it.g.localToWorld(tmp.copy(it.cupLocal)); if (c.distanceTo(hp) > 0.03) return;
    it.melt = Math.min(1, it.melt + dt * 0.35); if (it.melt > 0.7 && !it.burning) { it.burning = true; it.lab && it.lab.emit('s_burn', { obj: it.id }); }
  };
  it.update = (dt, t) => {
    sMat.color.setHex(0xf2d41c).lerp(new THREE.Color(0x9a4a12), Math.min(1, it.melt * 1.2)); s.scale.set(1 - it.melt * 0.15, 0.6 - it.melt * 0.3, 1 - it.melt * 0.15);
    if (!it.burning) { bf.visible = false; return; }
    const jar = it.inJar; const o2ok = !jar || !jar.closed || (jar.o2 ?? 1) > 0.4;
    if (!o2ok || it.sulphur <= 0) { it.burning = false; bf.visible = false; it.lab && it.lab.emit('s_out', { obj: it.id }); return; }
    bf.visible = true; bf.userData.tick(t); it.sulphur = Math.max(0, it.sulphur - dt * 0.02); s.scale.multiplyScalar(0.6 + 0.4 * it.sulphur);
    if (jar) { jar.gas.SO2 = (jar.gas.SO2 || 0) + dt * 0.03; jar.o2 = (jar.o2 ?? 1) - (jar.closed ? dt * 0.015 : 0); jar.setFume && jar.setFume(Math.min(0.3, (jar.gas.SO2 || 0) * 0.6)); }
    else if (it.lab && Math.random() < dt * 4) it.lab.fx.puff(it.g.localToWorld(tmp.set(0, 0.012, 0)), '#e8e6de', { alpha: 0.18, size: 0.006, grow: 0.04, life: 2 });
  };
  return it;
}

// ------------------------------------------------------------------ bar magnet and a sheet with iron filings mixed in sand
export function magnet(o = {}) {
  const it = new Item('magnet', { ...o, name: { en: 'Bar magnet', hi: 'छड़ चुंबक', hg: 'Bar magnet' } });
  const L = 0.075; const mk = (col, letter, x) => {
    const t = canvasTex(128, 64, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(letter, w / 2, h / 2 + 2); });
    const mm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.2 }); const b = new THREE.Mesh(new THREE.BoxGeometry(L / 2, 0.012, 0.016), mm); b.position.x = x; it.g.add(b);
  };
  mk('#c62f2f', 'N', -L / 4); mk('#2f4fb0', 'S', L / 4);
  it.poleLocal = [new THREE.Vector3(-L / 2, 0, 0), new THREE.Vector3(L / 2, 0, 0)];
  it.height = 0.012; it.radius = 0.04; it.grabY = 0.006; it.base = -0.006; it.stuck = 0; return it;
}
export function paperSheet(o = {}) {
  const it = new Item('sheet', { ...o, name: o.name || { en: 'Sheet of paper', hi: 'कागज़ की शीट', hg: 'Kaagaz ki sheet' } });
  const p = new THREE.Mesh(new THREE.BoxGeometry(o.w ?? 0.13, 0.0006, o.d ?? 0.1), paperMat(0xfbfaf6)); p.position.y = 0.0003; p.receiveShadow = true; it.g.add(p);
  it.height = 0.001; it.radius = 0.06; it.grabY = 0; return it;
}
export function filingsMix(o = {}) {
  const it = paperSheet({ name: { en: 'Iron filings mixed with sand', hi: 'रेत में मिला लोहे का बुरादा', hg: 'Ret mein mila iron ka buraada' } });
  it.kind = 'filings';
  const sand = heap(0xd2b080, { tex: 'sand', r: 0.028, h: 0.008, loose: 30 }); it.g.add(sand.g); it.sand = sand;
  const N = o.n ?? 320; const geo = new THREE.BoxGeometry(0.0011, 0.0004, 0.0004);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.7, roughness: 0.5 });
  const im = new THREE.InstancedMesh(geo, mat, N); im.userData.noHit = true; it.g.add(im); it.im = im;
  it.f = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * 6.283, r = 0.03 * Math.sqrt(Math.random()); const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = 0.0012 + 0.008 * Math.max(0, 1 - (r / 0.028) ** 2) ** 0.75 * (0.55 + Math.random() * 0.45);
    it.f.push({ s: 'free', p: new THREE.Vector3(x, y, z), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3)), off: null, t: 0 });
  }
  const M = new THREE.Matrix4(), S1 = new THREE.Vector3(1, 1, 1);
  it.layout = () => { it.f.forEach((f, i) => { M.compose(f.p, f.q, S1); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; };
  it.layout();
  it.update = (dt) => { // filings near a pole fly to it and cling in bristly tufts that point along the field
    const mg = it.magnet; let moved = false;
    for (const f of it.f) {
      if (f.s === 'free' && mg) {
        let best = null, bd = 0.032;
        for (let k = 0; k < 2; k++) { const pw = mg.g.localToWorld(tmp.copy(mg.poleLocal[k])); const pl = it.g.worldToLocal(tmp2.copy(pw)); const d = pl.distanceTo(f.p); if (d < bd) { bd = d; best = k; } }
        if (best != null && Math.random() < dt * 30) { f.s = 'fly'; f.k = best; f.t = 0; f.from = f.p.clone(); const dir = new THREE.Vector3(best ? 1 : -1, -0.6 + Math.random() * 0.4, (Math.random() - 0.5) * 1.6).normalize(); f.off = mg.poleLocal[best].clone().add(dir.multiplyScalar(0.001 + Math.random() * 0.007)); f.dir = dir; mg.stuck++; }
      }
      if (f.s === 'fly' || f.s === 'stuck') {
        const target = it.g.worldToLocal(mg.g.localToWorld(tmp.copy(f.off)));
        if (f.s === 'fly') { f.t += dt * 6; const k = Math.min(1, f.t); f.p.lerpVectors(f.from, target, k * k); f.p.y += Math.sin(Math.PI * k) * 0.004; if (k >= 1) f.s = 'stuck'; }
        else f.p.copy(target);
        f.q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), it.g.worldToLocal(mg.g.localToWorld(tmp2.copy(f.off).add(f.dir))).sub(target).normalize());
        moved = true;
      }
      if (f.s === 'fall') { f.t += dt * 2.5; const k = Math.min(1, f.t); f.p.lerpVectors(f.from, f.to, k * k); if (k >= 1) f.s = 'heap'; moved = true; }
    }
    if (moved) it.layout();
  };
  // drop every filing stuck to the magnet onto another sheet (as a small grey heap)
  it.release = (sheet) => {
    const c = it.g.worldToLocal(sheet.g.getWorldPosition(new THREE.Vector3()));
    for (const f of it.f) if (f.s === 'stuck' || f.s === 'fly') { const a = Math.random() * 6.283, r = 0.012 * Math.sqrt(Math.random()); f.s = 'fall'; f.t = 0; f.from = f.p.clone(); f.to = c.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.0012 + 0.004 * (1 - r / 0.012), Math.sin(a) * r)); }
    it.magnet && (it.magnet.stuck = 0);
  };
  it.left = () => it.f.filter((f) => f.s === 'free').length;
  it.height = 0.01; it.radius = 0.06; return it;
}

// ------------------------------------------------------------------ paper cup (chars and catches fire when empty)
export function paperCup(o = {}) {
  const prof = [[0, 0], [0.019, 0], [0.0195, 0.002], [0.027, 0.058], [0.0285, 0.06]];
  const pm = paperMat(o.color ?? 0xf3efe4);
  const v = new Vessel('papercup', prof, { ...o, wall: 0.0006, noRim: true, glassMat: pm, name: o.name || { en: 'Paper cup', hi: 'कागज़ का कप', hg: 'Paper cup' }, cap: 50 });
  v.glass.renderOrder = 0; v.char = 0; v.pm = pm;
  const fire = flame('spirit'); fire.scale.set(2.2, 1.6, 2.2); fire.position.y = 0.004; fire.visible = false; v.g.add(fire); v.fire = fire;
  v.onHeat = (dt, E) => {
    if (v.burnt) return;
    if (v.ml > 0.5) { v.char = Math.min(0.08, v.char + dt * 0.002); } // the water takes the heat away: the paper stays below its ignition temperature
    else { v.char += dt * (v.burning ? 0.25 : 0.3); if (v.char > 0.35 && !v.burning) { v.burning = true; E.note(v, 'cup_fire', {}); v.lab && v.lab.emit('cup_fire', { v: v.id }); } }
    pm.color.setHex(0xf3efe4).lerp(new THREE.Color(0x24170e), Math.min(1, v.char));
  };
  v.update0 = v.update.bind(v);
  v.update = (dt) => {
    v.update0(dt);
    if (v.burning && !v.burnt) { fire.visible = true; fire.userData.tick(performance.now() / 1000); v.char += dt * 0.12; pm.color.setHex(0xf3efe4).lerp(new THREE.Color(0x24170e), Math.min(1, v.char));
      if (v.lab && Math.random() < dt * 8) v.lab.fx.puff(v.g.localToWorld(tmp.set(0, 0.05, 0)), '#55504a', { alpha: 0.3, size: 0.008, grow: 0.05, life: 2.5 });
      if (v.char > 1.3) { v.burnt = true; fire.visible = false; v.glass.scale.set(0.9, 0.45, 0.9); } }
  };
  v.grabY = 0.03; return v;
}

// ------------------------------------------------------------------ things that glow in a flame (hacksaw blade, copper wire)
export function glowStrip(kind, o = {}) {
  const isWire = kind === 'cuwire';
  const it = new Item(kind, { ...o, name: o.name || (isWire ? { en: 'Copper wire', hi: 'ताँबे का तार', hg: 'Copper wire' } : { en: 'Hacksaw blade', hi: 'हैक्सॉ ब्लेड', hg: 'Hacksaw blade' }) });
  const mat = new THREE.MeshStandardMaterial({ color: isWire ? 0xc07040 : 0x8f959b, metalness: 0.85, roughness: 0.35, emissive: 0xff3a08, emissiveIntensity: 0 });
  const geo = isWire ? new THREE.CylinderGeometry(0.0007, 0.0007, 0.12, 8) : new THREE.BoxGeometry(0.012, 0.15, 0.0007);
  const m = new THREE.Mesh(geo, mat); m.position.y = isWire ? 0.06 : 0.075; it.g.add(m);
  if (!isWire) { const holes = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.001, 10), new THREE.MeshStandardMaterial({ color: 0x222222 })); holes.rotation.x = Math.PI / 2; holes.position.y = 0.145; it.g.add(holes); }
  it.mat = mat; it.hot = 0; it.wasHot = false; it.tipLocal = new THREE.Vector3(0, 0.004, 0);
  it.height = isWire ? 0.12 : 0.15; it.radius = 0.006; it.grabY = 0.12; it.base = 0;
  it.flameTest = (dt, f, hp) => { const tip = it.g.localToWorld(tmp.copy(it.tipLocal)); if (tip.distanceTo(f.g.localToWorld(tmp2.copy(f.heatPoint))) < 0.02) it.heating = 0.15; };
  it.update = (dt) => {
    if (it.heating > 0) { it.heating -= dt; it.hot = Math.min(1, it.hot + dt * (isWire ? 0.6 : 0.3)); } else it.hot = Math.max(0, it.hot - dt * 0.12);
    mat.emissiveIntensity = Math.pow(it.hot, 1.6) * 2.2; mat.emissive.setHex(it.hot > 0.85 ? 0xff6a18 : 0xff2a05);
    if (it.hot > 0.8 && !it.wasHot) { it.wasHot = true; it.lab && it.lab.emit('glow_hot', { obj: it.id }); }
    if (it.wasHot && it.hot < 0.05 && !it.cooled) { it.cooled = true; it.lab && it.lab.emit('glow_cool', { obj: it.id }); }
  };
  return it;
}
// glass slide: soot (unburnt carbon) collects where it is held in the yellow zone
export function glassSlide(o = {}) {
  const it = new Item('slide', { ...o, name: { en: 'Glass slide', hi: 'काँच की स्लाइड', hg: 'Glass slide' } });
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.025, 0.0012), [glassMat({ opacity: 0.25 }), glassMat({ opacity: 0.25 }), glassMat({ opacity: 0.25 }), glassMat({ opacity: 0.25 }), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.1 }), glassMat({ opacity: 0.25 })]);
  m.position.y = 0.0125; m.renderOrder = 7; it.g.add(m); it.soot = 0;
  it.draw = () => { x.clearRect(0, 0, 256, 96); x.fillStyle = 'rgba(210,225,235,0.18)'; x.fillRect(0, 0, 256, 96); if (it.soot > 0) { const g = x.createRadialGradient(128, 48, 4, 128, 48, 40); g.addColorStop(0, `rgba(10,8,6,${0.35 * it.soot})`); g.addColorStop(0.55, `rgba(5,4,3,${0.95 * it.soot})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(128, 48, 42, 0, 7); x.fill(); } tex.needsUpdate = true; };
  it.draw(); it.centerLocal = new THREE.Vector3(0, 0.0125, 0);
  it.flameTest = (dt, f) => { if (f.kind !== 'candle' || !f.lit) return; const c0 = it.g.localToWorld(tmp.copy(it.centerLocal)); const lz = f.g.localToWorld(f.zoneLocal('lum')); if (c0.distanceTo(lz) < 0.012) { it.soot = Math.min(1, it.soot + dt * 0.12); it.draw(); if (it.soot > 0.6 && !it.sootEv) { it.sootEv = true; it.lab && it.lab.emit('soot', { obj: it.id }); } } };
  it.height = 0.025; it.radius = 0.04; it.grabY = 0.02; return it;
}
// thin glass tube: held in the dark zone, unburnt wax vapour comes out of the other end and can be lit
export function thinTube(o = {}) {
  const it = new Item('thintube', { ...o, name: { en: 'Thin glass tube', hi: 'पतली काँच की नली', hg: 'Patli glass tube' } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.05, 12, 1, true), glassMat({ opacity: 0.3 })); m.rotation.z = Math.PI / 2; m.position.x = 0.025; m.renderOrder = 7; it.g.add(m);
  const fl = flame('spirit'); fl.scale.setScalar(0.22); fl.position.set(0.051, 0.0, 0); fl.visible = false; it.g.add(fl); it.endFlame = fl;
  it.inDark = 0; it.height = 0.005; it.radius = 0.03; it.grabY = 0;
  it.flameTest = (dt, f) => { if (f.kind !== 'candle' || !f.lit) return; const a = it.g.localToWorld(tmp.set(0, 0, 0)); if (a.distanceTo(f.g.localToWorld(f.zoneLocal('dark'))) < 0.008) it.inDark = 0.2; };
  it.update = (dt, t) => { if (it.inDark > 0) { it.inDark -= dt; if (it.vapour !== false && Math.random() < dt * 6 && it.lab) it.lab.fx.puff(it.g.localToWorld(tmp.set(0.051, 0, 0)), '#cfc8b8', { alpha: 0.2, size: 0.003, grow: 0.012, life: 1.2, up: 0.02 }); } else if (fl.visible) fl.visible = false; if (fl.visible) fl.userData.tick(t); };
  return it;
}

// ------------------------------------------------------------------ spoons with a wax bead on the handle (heat conduction)
export function waxSpoon(metal, o = {}) {
  const it = new Item('spoon', { ...o, name: metal ? { en: 'Steel spoon', hi: 'स्टील का चम्मच', hg: 'Steel ka chammach' } : { en: 'Wooden spoon', hi: 'लकड़ी का चम्मच', hg: 'Lakdi ka chammach' } });
  const mat = metal ? steel() : new THREE.MeshStandardMaterial({ map: woodTex('#b8874f'), roughness: 0.7 });
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.15, 0.003), mat); h.position.y = 0.095; it.g.add(h);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 18, 10, 0, 6.29, 0, 1.6), mat); b.scale.set(1, 0.35, 1.4); b.rotation.x = Math.PI / 2; b.position.y = 0.012; it.g.add(b);
  const wax = new THREE.Mesh(new THREE.SphereGeometry(0.0038, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf3e9cf, roughness: 0.55 })); wax.scale.set(1, 0.7, 1); wax.position.set(0, 0.165, 0.0025); it.g.add(wax);
  it.metal = !!metal; it.topT = 27; it.wax = 1; it.waxMesh = wax;
  it.update = (dt) => {
    const v = it.inV; const water = v ? v.mix.temp : 27; const lapse = it.lab?.chem?.lapse ?? 1;
    const k = it.metal ? 0.012 : 0.0004; it.topT += (water * (it.metal ? 0.82 : 0.1) + 27 * (it.metal ? 0.18 : 0.9) - it.topT) * Math.min(1, dt * k * lapse);
    if (it.topT > 46 && it.wax > 0) { it.wax = Math.max(0, it.wax - dt * 0.02 * lapse); wax.scale.set(1 + (1 - it.wax) * 0.5, 0.7 * it.wax + 0.05, 1 + (1 - it.wax) * 0.5); wax.position.y = 0.165 - (1 - it.wax) * 0.004; if (it.wax < 0.4 && !it.meltEv) { it.meltEv = true; it.lab && it.lab.emit('wax_melt', { obj: it.id }); } }
  };
  it.height = 0.17; it.radius = 0.012; it.grabY = 0.15; return it;
}

// ------------------------------------------------------------------ hammer, iron block and samples for metals / non-metals
export function hammer(o = {}) {
  const it = new Item('hammer', { ...o, name: { en: 'Hammer', hi: 'हथौड़ा', hg: 'Hathauda' } });
  const hd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.022), new THREE.MeshStandardMaterial({ color: 0x5a5f66, metalness: 0.85, roughness: 0.4 })); hd.position.y = 0.2; it.g.add(hd);
  const hn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.2, 12), new THREE.MeshStandardMaterial({ map: woodTex('#9a6a3a'), roughness: 0.6 })); hn.position.y = 0.1; it.g.add(hn);
  it.faceLocal = new THREE.Vector3(-0.03, 0.2, 0); it.height = 0.012; it.radius = 0.1; it.grabY = 0.05; return it;
}
export function ironBlock(o = {}) {
  const it = new Item('block', { ...o, name: { en: 'Iron block', hi: 'लोहे का ब्लॉक', hg: 'Iron block' } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.07), new THREE.MeshStandardMaterial({ color: 0x4a4e54, metalness: 0.8, roughness: 0.55 })); m.position.y = 0.015; it.g.add(m);
  it.top = 0.03; it.height = 0.03; it.radius = 0.06; return it;
}
const SAMPLE = {
  cu: { n: { en: 'Copper wire', hi: 'ताँबे का तार', hg: 'Copper wire' }, c: 0x9a5a36, shine: 0xd98a5a, metal: true },
  al: { n: { en: 'Aluminium foil', hi: 'एल्युमिनियम पन्नी', hg: 'Aluminium foil' }, c: 0xa8acb0, shine: 0xe4e8ec, metal: true },
  fe: { n: { en: 'Iron nail', hi: 'लोहे की कील', hg: 'Iron ki keel' }, c: 0x6e7176, shine: 0xb4b8bd, metal: true },
  coal: { n: { en: 'Coal', hi: 'कोयला', hg: 'Koyla' }, c: 0x1e1e20, metal: false, tex: 'coal' },
  s: { n: { en: 'Sulphur lump', hi: 'सल्फर का टुकड़ा', hg: 'Sulphur ka tukda' }, c: 0xe9cc2a, metal: false, tex: 'sulphur' },
};
export function sample(kind, o = {}) {
  const S = SAMPLE[kind];
  if (kind === 'fe') { const it = nail(o); it.sample = kind; it.metal = true; it.S = S; it.name = S.n; it.mat.color.setHex(S.c); it.mat.roughness = 0.7; return it; }
  const it = new Item('sample', { ...o, name: S.n }); it.sample = kind; it.metal = S.metal; it.S = S;
  const map = realTex(S.tex);
  const mat = new THREE.MeshStandardMaterial({ color: S.c, metalness: S.metal ? 0.55 : 0, roughness: S.metal ? 0.6 : 0.95, map, bumpMap: map, bumpScale: map ? 0.8 : 0, side: THREE.DoubleSide });
  let g;
  if (kind === 'cu') g = new THREE.TorusGeometry(0.008, 0.0009, 8, 48, Math.PI * 5.5);
  else if (kind === 'al') { g = new THREE.PlaneGeometry(0.03, 0.022, 10, 8); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.sin(p.getX(i) * 400) * Math.cos(p.getY(i) * 330)) * 0.0012); g.computeVertexNormals(); }
  else { g = new THREE.IcosahedronGeometry(0.008, 2); const p = g.attributes.position; const v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.multiplyScalar(1 + 0.22 * Math.sin(v.x * 700 + v.y * 300) * Math.cos(v.z * 600)); p.setXYZ(i, v.x, v.y * 0.75, v.z); } g.computeVertexNormals(); }
  const m = new THREE.Mesh(g, mat); m.position.y = kind === 'al' ? 0.0015 : 0.006; if (kind !== 'coal' && kind !== 's') m.rotation.x = -Math.PI / 2; it.g.add(m); it.mesh = m; it.mat = mat;
  it.height = 0.012; it.radius = 0.014; it.grabY = 0.005; return it;
}
export function sandpaper(o = {}) {
  const it = new Item('sandpaper', { ...o, name: { en: 'Sandpaper', hi: 'रेगमाल', hg: 'Sandpaper (regmaal)' } });
  const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#b07a46'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const g = 90 + Math.random() * 90; x.fillStyle = `rgb(${g + 40},${g},${g - 30})`; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.001, 0.045), new THREE.MeshStandardMaterial({ map: t, roughness: 1 })); m.position.y = 0.0005; it.g.add(m);
  it.height = 0.001; it.radius = 0.035; it.grabY = 0; return it;
}

// ------------------------------------------------------------------ desk lamp (stands in for sunlight), steel plate, bottle cap, petri dish
export function sunLamp(o = {}) {
  const it = new Item('sunlamp', { ...o, name: { en: 'Lamp (gives heat like sunlight)', hi: 'लैंप (धूप जैसी गर्मी देता है)', hg: 'Lamp (dhoop jaisi garmi)' } });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.5, roughness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 24), dark); base.position.y = 0.006; it.g.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 10), dark); arm.position.set(0.02, 0.115, 0); arm.rotation.z = -0.25; it.g.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.05, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xe0a33a, metalness: 0.3, roughness: 0.45, side: THREE.DoubleSide })); shade.position.set(0.075, 0.215, 0); shade.rotation.z = 0.5; it.g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffd88a, emissiveIntensity: 0 })); bulb.position.set(0.082, 0.2, 0); it.g.add(bulb);
  const L = new THREE.SpotLight(0xffd9a0, 0, 0.6, 0.7, 0.5, 2); L.position.set(0.082, 0.2, 0); L.target.position.set(0.12, 0, 0); it.g.add(L); it.g.add(L.target);
  it.on = false; it.setOn = (on) => { it.on = on; bulb.material.emissiveIntensity = on ? 2.2 : 0; L.intensity = on ? 0.9 : 0; };
  it.spotLocal = new THREE.Vector3(0.12, 0, 0); it.height = 0.24; it.radius = 0.05; it.grabY = 0.1; return it;
}
export function steelPlate(o = {}) {
  const prof = [[0, 0], [0.055, 0], [0.066, 0.008], [0.07, 0.011], [0.071, 0.012]];
  const v = new Vessel('plate', prof, { ...o, wall: 0.0008, noRim: true, glassMat: new THREE.MeshStandardMaterial({ color: 0xd4d8dc, metalness: 0.85, roughness: 0.22, side: THREE.DoubleSide }), name: o.name || { en: 'Steel plate', hi: 'स्टील की प्लेट', hg: 'Steel plate' } });
  v.glass.renderOrder = 0; v.grabY = 0.006; return v;
}
export function bottleCap(o = {}) {
  const prof = [[0, 0], [0.0145, 0], [0.0145, 0.013], [0.0152, 0.0135]];
  const v = new Vessel('cap', prof, { ...o, wall: 0.0009, noRim: true, glassMat: new THREE.MeshStandardMaterial({ color: o.color ?? 0x2f6fc9, roughness: 0.5, side: THREE.DoubleSide }), name: o.name || { en: 'Bottle cap', hi: 'बोतल का ढक्कन', hg: 'Bottle cap' } });
  v.glass.renderOrder = 0; v.grabY = 0.007; return v;
}
export function petriDish(o = {}) {
  const prof = [[0, 0], [0.043, 0], [0.045, 0.002], [0.045, 0.012], [0.046, 0.013]];
  const v = new Vessel('petri', prof, { ...o, wall: 0.001, name: o.name || { en: 'Petri dish', hi: 'पेट्री डिश', hg: 'Petri dish' } });
  v.grabY = 0.006; return v;
}
// a tile with small pieces of blue and red litmus paper, a drop can be put on each piece
export function litmusTile(cols, o = {}) {
  const it = new Item('ltile', { ...o, name: { en: 'White tile with litmus paper pieces', hi: 'लिटमस पत्र के टुकड़ों वाली सफ़ेद टाइल', hg: 'Litmus paper ke tukdon wali white tile' } });
  const W = 0.032 * cols + 0.02; const t = new THREE.Mesh(new THREE.BoxGeometry(W, 0.006, 0.085), new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.25 })); t.position.y = 0.003; it.g.add(t);
  it.pieces = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < 2; r++) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const x = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const base = r === 0 ? '#4e6fbf' : '#d0424a';
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0005, 0.022), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); m.position.set(-W / 2 + 0.02 + c * 0.032, 0.0063, r === 0 ? -0.018 : 0.018); it.g.add(m);
    const pc = { col: c, kind: r === 0 ? 'blue' : 'red', base, spot: null, x, tex, mesh: m };
    pc.draw = () => { x.fillStyle = base; x.fillRect(0, 0, 64, 64); for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); } if (pc.spot) { x.fillStyle = pc.spot; x.beginPath(); x.ellipse(32, 32, 20, 18, 0.3, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(26, 26, 7, 0, 7); x.fill(); } tex.needsUpdate = true; };
    pc.draw(); it.pieces.push(pc);
  }
  it.pieceWorld = (c, kind) => { const p = it.pieces.find((q) => q.col === c && q.kind === kind); return p.mesh.getWorldPosition(new THREE.Vector3()); };
  it.height = 0.007; it.radius = W / 2; it.grabY = 0.003; return it;
}
