// DUET Science Lab 360, biology in real places, batch BW2: a grassland food web. A patch of grassland at real size with
// real scanned animals: grasshoppers in the grass, frogs that eat them, rat snakes that eat the frogs and a hawk watching
// from an old post. A calendar moves it through the months; the student takes the frogs away and sees the web answer:
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
  const g = it.g, w_ = o.W || ((k) => k), r = rnd(71), Z = -1.4, HW = 0.8, HD = 0.42;
  const spot = () => V((r() * 2 - 1) * HW, 0, Z + (r() * 2 - 1) * HD);
  // grass: real scanned clumps; they shrink as the grasshoppers eat them
  const grass = []; for (let i = 0; i < 22; i++) { const p = spot(); const m = ecoModel(i % 3 ? 'grass_medium_02' : 'grass_dry_01', { k: 0.7 + r() * 0.45, face: [r() - 0.5, 1] }); m.position.copy(p); g.add(m); grass.push(m); }
  // grasshoppers: a pool, as many shown as live in the patch that month. They sit still, then now and then hop a hand's
  // width to a new spot, the way grasshoppers do
  const hop = []; for (let i = 0; i < WEB.G6; i++) { const p = spot(), a = r() * TAU; const m = ecoModel('locust', { face: [1, 0], len: 0.11 + r() * 0.03 }); m.position.set(p.x, 0, p.z); m.rotation.y = a; m.userData.wait = 1 + r() * 6; m.userData.hop = null; m.visible = i < WEB.G0; g.add(m); hop.push(m); }
  // frogs on the ground, rat snakes coiled in the grass
  const frogs = []; for (let i = 0; i < WEB.F0; i++) { const p = spot(); const m = ecoModel('frog', { face: [r() - 0.5, 1], len: 0.12 + r() * 0.03 }); m.position.set(p.x, 0, p.z); g.add(m); frogs.push(m); }
  const snakes = [[-0.55, 0.12, [1, 0.3]], [0.5, -0.22, [-1, 0.4]]].map(([x, z, f]) => { const m = ecoModel('ratsnake', { face: f, len: 0.42 }); m.position.set(x, 0, Z + z); g.add(m); return m; });
  // the hawk on a short old post at the side, where it can watch the patch
  const hawk = ecoModel('hawk_low', { face: [-0.8, 1], h: 0.46 }); hawk.position.set(0.55, 0, Z + 0.3); g.add(hawk);
  // the board: how many of each live in the patch now
  const sign = liveSign(0.13, 5.6); sign.position.set(-0.22, 0.24, Z - 0.5); g.add(sign);
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
      const f = frogs[i++]; const to = V(-HW - 0.6, 0, Z + 0.6 + i * 0.05); const holder = { g: f }; flyTo(holder, to, 0, 0.45, () => { f.visible = false; next(); }); };
    next();
  };
  // a hop: up and over in a third of a second to a spot a few centimetres away, still inside the patch
  const startHop = (m, far) => { const p = m.position, a = r() * TAU, d = far * (0.5 + r() * 0.5);
    const to = V(Math.max(-HW, Math.min(HW, p.x + Math.cos(a) * d)), 0, Math.max(Z - HD, Math.min(Z + HD, p.z + Math.sin(a) * d)));
    m.userData.hop = { from: p.clone(), to, k: 0, dur: 0.25 + d, h: 0.04 + d * 0.5 }; m.rotation.y = Math.atan2(-(to.z - p.z), to.x - p.x); };
  it.update = (dt) => { const d = Math.min(0.05, dt || 0.016);
    for (const m of hop) { if (!m.visible) continue; const u = m.userData;
      if (u.hop) { const h = u.hop; h.k = Math.min(1, h.k + d / h.dur); m.position.lerpVectors(h.from, h.to, h.k); m.position.y = Math.sin(h.k * Math.PI) * h.h; if (h.k >= 1) { u.hop = null; u.wait = 2 + r() * 7; } }
      else if ((u.wait -= d) <= 0) startHop(m, 0.08 + r() * 0.1); }
    grass.concat(hop, frogs, snakes, [hawk]).forEach((m) => m.tick && m.tick(dt)); };
  it.knobPath = () => [V(-0.4, 0.74, -0.52), V(0.4, 0.74, -0.52)];
  it.at = { frogs: () => g.localToWorld(frogs[0].position.clone()) };
  // points of view: the whole patch, and down among the grass beside a frog (or, later, the eaten grass)
  it.views = { over: { p: V(0, 0.86, -0.04), t: V(0, 0.05, Z + 0.04) },
    frog: () => { const f = frogs[2].position; return { p: V(f.x + 0.12, 0.3, f.z + 0.52), t: V(f.x, 0.03, f.z - 0.05) }; },
    grass: { p: V(0.1, 0.42, Z + 0.62), t: V(0, 0.02, Z - 0.05) } };
  it.camView = it.views.over;
  show(); noHit(g);
  it.noGrab = true; it.noPhys = true; it.base = 0; it.height = 0.5; it.radius = 1.2;
  return it;
}
// the calendar knob: slid by hand in the two "months" steps (three months with the frogs, six months without)
export function bindWebHands(gw, knob, app, s = { m3: 1, m6: 3 }, done = {}) {
  const lim = () => (app.runner.i === s.m3 ? 3 : 6);
  const sync = slideKnob(knob, { path: () => gw.knobPath(), active: () => stepNow(app, s.m3) || stepNow(app, s.m6), keepVisible: () => app.runner.i === s.m3 || app.runner.i === s.m6, k: () => gw.month / 6,
    set: (k) => { gw.setMonth(Math.min(lim(), Math.round(k * 60) / 10)); if (gw.month >= 3 && app.runner.i === s.m3 && done.m3) done.m3(); if (gw.month >= 6 && app.runner.i === s.m6 && done.m6) done.m6(); } });
  const s0 = gw.setMonth; gw.setMonth = (m) => { s0(m); sync(); };
}
