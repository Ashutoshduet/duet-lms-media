// DUET Science Lab 360, biology in real places, batch BW2: a grassland food web. A patch of grassland at real size with
// real scanned animals: grasshoppers in the grass, frogs that eat them, rat snakes that eat the frogs and a hawk watching
// from a stump. A calendar moves it through the months; the student takes the frogs away and sees the web answer:
// grasshoppers multiply and strip the grass, the snakes go hungry and leave.
import * as THREE from 'three';
import { Item } from './apparatus.js';
import { clamp01, ease } from './mathlab2.js';
import { liveSign } from './mathworld4.js';
import { slideKnob } from './mathworld5.js';
import { rnd, noHit, stepNow, V } from './mathworld_j1.js';
import { ecoModel, flyTo } from './bioworld1.js';

const TAU = Math.PI * 2;
// populations in the patch, month by month (0…6), with the frogs and after the frogs were taken away
export const WEB = { G0: 20, G6: 60, F0: 6, S0: 2, grassLeft: 0.35 };
export function webCounts(m, frogsGone) {
  if (!frogsGone) return { g: WEB.G0, f: WEB.F0, s: WEB.S0, grass: 1 };
  const k = ease(clamp01(m / 6));
  return { g: Math.round(WEB.G0 + (WEB.G6 - WEB.G0) * k), f: 0, s: m < 2 ? 2 : m < 4 ? 1 : 0, grass: 1 - (1 - WEB.grassLeft) * k };
}

export function grassWeb(o = {}) {
  const it = new Item('gweb', { ...o, name: { en: 'Grassland', hi: 'घास का मैदान', hg: 'Ghaas ka maidan' } });
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(71), Z = -1.55, HW = 1.25, HD = 0.8;
  const spot = () => V((r() * 2 - 1) * HW, 0, Z + (r() * 2 - 1) * HD);
  // grass: real scanned clumps; they shrink as the grasshoppers eat them
  const grass = []; for (let i = 0; i < 26; i++) { const p = spot(); const m = ecoModel(i % 3 ? 'grass_medium_02' : 'grass_dry_01', { k: 0.75 + r() * 0.5, face: [r() - 0.5, 1] }); m.position.copy(p); m.userData.k0 = 1; g.add(m); grass.push(m); }
  // grasshoppers: a pool, as many shown as live in the patch that month
  const hop = []; for (let i = 0; i < WEB.G6; i++) { const p = spot(); const m = ecoModel('locust', { face: [Math.cos(r() * TAU), Math.sin(r() * TAU)], len: 0.1 + r() * 0.03 }); m.position.set(p.x, 0.01 + r() * 0.08, p.z); m.userData.home = m.position.clone(); m.userData.ph = r() * 6; m.visible = i < WEB.G0; g.add(m); hop.push(m); }
  // frogs on the ground, rat snakes in the grass, a hawk on an old stump at the back
  const frogs = []; for (let i = 0; i < WEB.F0; i++) { const p = spot(); const m = ecoModel('frog', { face: [r() - 0.5, 1], len: 0.12 + r() * 0.03 }); m.position.set(p.x, 0, p.z); g.add(m); frogs.push(m); }
  const snakes = [[-0.95, -0.45, [1, 0.3]], [1.0, -0.55, [-1, 0.2]]].map(([x, z, f]) => { const m = ecoModel('ratsnake', { face: f, len: 0.6 }); m.position.set(x, -0.085, Z + z); m.userData.home = m.position.clone(); g.add(m); return m; }); // the scan's white rock base sinks into the ground
  const stump = ecoModel('tree_stump_01', { k: 0.6 }); stump.position.set(1.35, 0, Z - 1.05); g.add(stump);
  const hawk = ecoModel('hawk', { face: [-0.6, 1], h: 0.5 }); hawk.position.set(1.33, 0.34, Z - 1.03); g.add(hawk);
  // the board: how many of each live in the patch now
  const sign = liveSign(0.1, 6.4); sign.position.set(0, 0.6, Z - 0.85); g.add(sign);
  it.month = 0; it.frogsGone = false;
  const show = () => {
    const c = webCounts(it.month, it.frogsGone); it.counts = c;
    hop.forEach((m, i) => { m.visible = i < c.g; });
    grass.forEach((m, i) => { const k = Math.max(0.12, c.grass * (0.75 + 0.5 * ((i * 37) % 10) / 10)); m.scale.set(1, Math.min(1, k), 1); });
    snakes.forEach((m, i) => { m.visible = i < c.s; });
    const hungry = it.frogsGone && it.month >= 1 && c.s > 0;
    sign.set([`${w_('Month')} ${Math.round(it.month)} · ${w_('Grasshoppers')} ${c.g} · ${w_('Frogs')} ${c.f} · ${w_('Snakes')} ${c.s}${hungry ? ' (' + w_('hungry') + ')' : ''}`, `${w_('Grass left')} ${Math.round(c.grass * 100)}%`], ['#ffffff', c.grass < 0.7 ? '#ffb46b' : '#8be07a']);
  };
  it.setMonth = (m) => { it.month = Math.max(0, Math.min(6, m)); show(); if (it.onMonth) it.onMonth(it.month); };
  // the frogs are caught and carried out of the patch one by one
  it.removeFrogs = (cb) => {
    let i = 0; const next = () => { if (i >= frogs.length) { frogs.forEach((f) => { f.visible = false; }); it.frogsGone = true; it.month = 0; show(); if (cb) cb(); return; }
      const f = frogs[i++]; const to = V(-HW - 0.6, 0, Z + 0.9 + i * 0.05); const holder = { g: f }; flyTo(holder, to, 0, 0.45, () => { f.visible = false; next(); }); };
    next();
  };
  it.update = (dt, t) => { const tt = t ?? performance.now() / 1000;
    hop.forEach((m, i) => { if (!m.visible) return; const h = m.userData.home, ph = m.userData.ph; const jump = Math.max(0, Math.sin(tt * 1.7 + ph)); m.position.set(h.x + Math.sin(tt * 0.3 + ph) * 0.05, h.y + (jump > 0.97 ? (jump - 0.97) * 4 : 0), h.z + Math.cos(tt * 0.25 + ph) * 0.05); });
    snakes.forEach((m, i) => { if (!m.visible) return; const h = m.userData.home; m.position.x = h.x + Math.sin(tt * 0.2 + i * 2) * 0.12; m.position.z = h.z + Math.cos(tt * 0.17 + i) * 0.08; });
    grass.concat(hop, frogs, snakes, [hawk]).forEach((m) => m.tick && m.tick(dt)); };
  it.knobPath = () => [V(-0.45, 1.0, -0.42), V(0.45, 1.0, -0.42)];
  it.at = { frogs: () => g.localToWorld(frogs[0].position.clone()) };
  show(); noHit(g);
  it.noGrab = true; it.noPhys = true; it.base = 0; it.height = 0.5; it.radius = 1.4;
  return it;
}
// the calendar knob: slid by hand in the two "months" steps (three months with the frogs, six months without)
export function bindWebHands(gw, knob, app, s = { m3: 1, m6: 3 }, done = {}) {
  const lim = () => (app.runner.i === s.m3 ? 3 : 6);
  const sync = slideKnob(knob, { path: () => gw.knobPath(), active: () => stepNow(app, s.m3) || stepNow(app, s.m6), keepVisible: () => app.runner.i === s.m3 || app.runner.i === s.m6, k: () => gw.month / 6,
    set: (k) => { gw.setMonth(Math.min(lim(), Math.round(k * 60) / 10)); if (gw.month >= 3 && app.runner.i === s.m3 && done.m3) done.m3(); if (gw.month >= 6 && app.runner.i === s.m6 && done.m6) done.m6(); } });
  const s0 = gw.setMonth; gw.setMonth = (m) => { s0(m); sync(); };
}
