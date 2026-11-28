// DUET Maths Lab 360, real places 5 (Class 10): the biggest square tile for a floor (HCF), a stack of logs (sum of an AP),
// a rope parallel to one side of a triangle you stand in (basic proportionality theorem), tangents with a wheel and a well,
// and two dice rolled again and again (probability).
import { DICT } from './exp_i18n.js';
import { DICT_W5 } from './exp_i18n_w5.js';
import * as MW from './mathworld.js';
import * as MW5 from './mathworld5.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W5);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C10r = N('Ch 1 · Real Numbers', 'अध्याय 1 · वास्तविक संख्याएँ', 'Ch 1 · Real numbers');
const C10a = N('Ch 5 · Arithmetic Progressions', 'अध्याय 5 · समांतर श्रेढ़ियाँ', 'Ch 5 · Arithmetic progressions');
const C10t = N('Ch 6 · Triangles', 'अध्याय 6 · त्रिभुज', 'Ch 6 · Triangles');
const C10c = N('Ch 10 · Circles', 'अध्याय 10 · वृत्त', 'Ch 10 · Circles');
const C10p = N('Ch 14 · Probability', 'अध्याय 14 · प्रायिकता', 'Ch 14 · Probability');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const aim = (K, it, p, t) => { it.camView = { p: p.clone().sub(it.g.position), t: t.clone().sub(it.g.position) }; if (!K.app.userCam) K.app.focusBench(); };
const G = { ok: '#8be07a' };

export const EXPERIMENTS_W5 = [
  // ---------------------------------------------------------------- Ch 1: HCF with floor tiles
  {
    id: 'w10_hcf_tiles', subj: 'maths', cls: 10, ch: C10r, world: true, place: 'room', table: false,
    title: X('The biggest square tile for a floor: HCF'),
    aim: X('To try square tiles of different sizes on a floor 360 cm by 240 cm with your own hand, find the biggest one that fits without cutting, and see that it is the HCF of 360 and 240.'),
    kind: X('HCF and LCM by prime factorisation'),
    setup(K) {
      const txt = { fits: tl(K, X('fits exactly')), cut: tl(K, X('tiles must be cut')), tiles: tl(K, X('tiles')) };
      const tf = K.add(MW5.tileFloor({ txt }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.3);
      tf.camView = { p: V3(K, 0.3, 2.6, 1.6), t: V3(K, 0, 0.2, -1.8) };
      const fin = { tried: once(() => K.lab.emit('tried', { obj: tf.id })), best: once(() => { label(K, '120 cm', tf.at('top'), 0.2, 0, { color: G.ok, edge: G.ok, step: true }); K.lab.emit('best', { obj: tf.id }); }) };
      MW5.bindTileHands(tf, knob, K.app, { tryS: 1, best: 2 }, { tried: () => fin.tried(), best: () => fin.best() });
      return { tf, knob, fin };
    },
    steps: [
      { do: X('This floor is 360 cm long and 240 cm wide. We want square tiles, all the same size, that cover it without cutting any tile.'), target: 'tf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tf.id }); label(K, '360 cm', o.tf.at('w'), 0.16, 0, { color: '#ffd23f', step: true }); label(K, '240 cm', o.tf.at('d'), 0.16, 0, { color: '#5ec8ff', step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Right now 50 cm tiles are laid. The red tiles at the edges would have to be cut.') },
      { do: X('Slide the handle to try at least four different tile sizes. Which ones fit exactly?'), target: 'tf',
        act: async (K, o) => { for (const cm of [20, 40, 70, 90]) { o.tf.setSize(cm); await K.sleep(1); } o.fin.tried(); },
        ev: { type: 'tried' }, see: X('Tiles of 20, 30, 40, 60 and 120 cm fit exactly, because these numbers divide both 360 and 240. The other sizes leave red tiles that must be cut.') },
      { do: X('Now find the biggest tile that fits exactly, and let go of the handle there.'), target: 'tf',
        act: async (K, o) => { o.tf.setSize(120); await K.sleep(0.8); o.fin.best(); await K.sleep(1); },
        ev: { type: 'best' }, see: X('The biggest is 120 cm: 3 tiles along the length and 2 across, just 6 tiles!') },
      { do: X('Now find it with prime factors.'), target: 'tf',
        act: async (K, o) => { fresh(K); K.lab.emit('factor', { obj: o.tf.id }); const y = [2.35, 2.12, 1.89]; const T = ['360 = 2 × 2 × 2 × 3 × 3 × 5', '240 = 2 × 2 × 2 × 2 × 3 × 5', 'HCF = 2 × 2 × 2 × 3 × 5 = 120'];
          for (let i = 0; i < 3; i++) { label(K, T[i], V3(K, 0, y[i], -2.2), 0.16, 0, { color: i === 2 ? G.ok : '#ffffff', edge: i === 2 ? G.ok : undefined, step: true }); await K.sleep(0.8); } await K.sleep(1); },
        ev: { type: 'factor' }, see: X('Take each prime factor as many times as it is common to both numbers: 2 three times, 3 once and 5 once. HCF = 2³ × 3 × 5 = 120.') },
      { do: X('And what is their LCM?'), target: 'tf',
        act: async (K, o) => { K.lab.emit('lcm', { obj: o.tf.id }); label(K, 'LCM = 2⁴ × 3² × 5 = 720', V3(K, 0, 1.66, -2.2), 0.16, 0, { color: '#ffd23f', step: true }); await K.sleep(0.8); label(K, '120 × 720 = 360 × 240 = 86,400', V3(K, 0, 1.43, -2.2), 0.15, 0, { color: '#ffffff', step: true }); await K.sleep(1.4); },
        ev: { type: 'lcm' }, see: X('LCM = 2⁴ × 3² × 5 = 720, the smallest number that both 360 and 240 divide into. And HCF × LCM = 120 × 720 = 86,400 = 360 × 240.') },
    ],
    eq: { word: 'HCF and LCM', sym: 'HCF × LCM = a × b' },
    result: {
      obs: X('Only tiles of 20, 30, 40, 60 and 120 cm fitted exactly. The biggest, 120 cm, needed just 6 tiles.'),
      concl: X('The HCF of two numbers is the biggest number that divides both. With prime factors, it is the product of the common prime factors, each taken the smaller number of times: HCF(360, 240) = 120.'),
      safety: X('Wear gloves when you cut real tiles: their edges are sharp.'),
      viva: [{ q: X('Find the HCF of 12 and 18.'), a: X('6.') },
        { q: X('What is HCF × LCM for 6 and 20?'), a: X('6 × 20 = 120, because HCF × LCM is the product of the two numbers.') },
        { q: X('Would 80 cm tiles fit this floor?'), a: X('No: 80 divides 240 but not 360.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 5: a stack of logs
  {
    id: 'w10_ap_logs', subj: 'maths', cls: 10, ch: C10a, world: true, place: 'farm', table: false, shadowBox: 3,
    title: X('A stack of logs: the sum of an AP'),
    aim: X('To build a stack of logs row by row with your own hand, see that the rows make an arithmetic progression, and find the total number of logs with a clever trick.'),
    kind: X('Arithmetic progressions'),
    setup(K) {
      const ls = K.add(MW5.logStack(), 0, -2.3, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      ls.camView = { p: V3(K, 0.5, 1.45, 4.1), t: V3(K, -0.1, 0.9, 0) };
      const em = (t) => K.lab.emit(t, { obj: ls.id });
      ls.onRow = (n) => { label(K, String(11 - n), ls.rowAt(n - 1), 0.16, 0, { color: '#ffffff', step: true }); if (n === 3) em('rows3'); if (n === 10) em('rows10'); };
      MW3push(K, ls, lever);
      return { ls, lever };
    },
    steps: [
      { do: X('The bottom row of this stack has 10 logs. Each row above it will have one log fewer.'), target: 'ls',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ls.id }); label(K, '10', o.ls.rowAt(0), 0.16, 0, { color: '#ffffff', step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Row 1 has 10 logs.') },
      { do: X('Pull the lever towards you to add the next two rows. How many logs are in each?'), target: 'ls',
        act: async (K, o) => { for (let i = 0; i < 2; i++) { o.ls.add(); await K.sleep(1); } },
        ev: { type: 'rows3' }, see: X('10, 9, 8 … The rows make an arithmetic progression, with first term a = 10 and common difference d = −1.') },
      { do: X('Keep adding rows until the top row has just 1 log.'), target: 'ls',
        act: async (K, o) => { while (o.ls.rows < 10) { o.ls.add(); await K.sleep(0.6); } await K.sleep(0.6); },
        ev: { type: 'rows10' }, see: X('The stack has 10 rows. aₙ = a + (n − 1)d gives 1 = 10 + (n − 1) × (−1), so n = 10.') },
      { do: X('Now count all the logs the clever way: put the same stack upside down beside it.'), target: 'ls',
        act: async (K, o) => { fresh(K); K.lab.emit('copy', { obj: o.ls.id }); await K.tween(3, (k) => o.ls.setCopy(k)); o.ls.setCopy(1);
          label(K, '10 + 1 = 11', o.ls.rowAt(4), 0.16, 0, { color: '#ffd23f', step: true }); await K.sleep(0.6); label(K, '10 × 11 = 110 → 110 ÷ 2 = 55', o.ls.topAt(), 0.18, 0, { color: G.ok, edge: G.ok, step: true }); await K.sleep(1.4); },
        ev: { type: 'copy' }, see: X('Each row now has 10 + 1 = 11 logs, and there are 10 rows: 10 × 11 = 110 logs. That is two stacks, so one stack has 110 ÷ 2 = 55 logs.') },
      { do: X('Write it as a formula.'), target: 'ls',
        act: async (K, o) => { K.lab.emit('formula', { obj: o.ls.id }); label(K, 'Sₙ = n/2 (a + l) = 10/2 × (10 + 1) = 55', o.ls.topAt().add(V3(K, 0, 0.32, 0)), 0.18, 0, { color: '#ffffff', step: true }); await K.sleep(2); },
        ev: { type: 'formula' }, see: X('The sum of an AP is Sₙ = n/2 × (first term + last term) = 10/2 × (10 + 1) = 55.'),
        why: X('Pair the first row with the last, the second with the second-last, and so on: every pair has the same total, a + l.') },
    ],
    eq: { word: 'Sum of an AP', sym: 'Sₙ = n/2 (a + l)' },
    result: {
      obs: X('The rows had 10, 9, 8 … 1 logs. The stack and its upside-down copy made 10 rows of 11 logs, so the stack had 55 logs.'),
      concl: X('In an AP, the nth term is aₙ = a + (n − 1)d and the sum of n terms is Sₙ = n/2 (a + l) = n/2 [2a + (n − 1)d].'),
      safety: X('Never climb on a stack of logs: they can roll.'),
      viva: [{ q: X('Find 1 + 2 + 3 + … + 100.'), a: X('100/2 × (1 + 100) = 5050.') },
        { q: X('What is the common difference of 10, 9, 8, …?'), a: X('−1.') },
        { q: X('A stack has 20 logs in the bottom row and 5 in the top row, one fewer in each row. How many rows are there?'), a: X('20 − 5 + 1 = 16 rows.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 6: basic proportionality theorem
  {
    id: 'w10_bpt', subj: 'maths', cls: 10, ch: C10t, world: true, place: 'field', table: false,
    title: X('A rope parallel to one side of a triangle'),
    aim: X('To stand inside a big triangle, slide a rope parallel to one side with your own hand, and see that it always divides the other two sides in the same ratio.'),
    kind: X('Basic proportionality theorem'),
    setup(K) {
      const bt = K.add(MW5.bptTriangle(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.45);
      bt.camView = { p: V3(K, 0.2, 4.2, 3.6), t: V3(K, 0, 0, -2.4) };
      const fin = { 0.5: once(() => K.lab.emit('half', { obj: bt.id })), [2 / 3]: once(() => K.lab.emit('two', { obj: bt.id })) };
      MW5.bindBptHands(bt, knob, K.app, { half: 1, two: 2 }, { reach: (g) => fin[g]() });
      return { bt, knob, fin };
    },
    steps: [
      { do: X('You are standing inside a triangle of rope, ABC, with A far in front of you. The yellow rope DE is parallel to BC.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bt.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('D is on side AB and E is on side AC.') },
      { do: X('Slide the handle to move DE, keeping it parallel to BC, until D is exactly halfway between A and B.'), target: 'bt',
        act: async (K, o) => { const t0 = o.bt.t; await K.tween(2, (k) => o.bt.setT(t0 + (0.5 - t0) * ease(k))); o.bt.setT(0.5); o.fin[0.5](); await K.sleep(1); },
        ev: { type: 'half' }, see: X('AD/DB = 1, and AE/EC = 1 too: E is also halfway along AC.') },
      { do: X('Now move DE until AD is twice as long as DB.'), target: 'bt',
        act: async (K, o) => { const t0 = o.bt.t; await K.tween(2, (k) => o.bt.setT(t0 + (2 / 3 - t0) * ease(k))); o.bt.setT(2 / 3); o.fin[2 / 3](); await K.sleep(1); },
        ev: { type: 'two' }, see: X('AD/DB = 2, and AE/EC = 2 as well. Wherever the parallel rope is, the two ratios are equal.') },
      { do: X('Look at the small triangle ADE.'), target: 'bt',
        act: async (K, o) => { o.bt.showSmall(true); K.lab.emit('similar', { obj: o.bt.id }); label(K, 'AD/AB = AE/AC = DE/BC = 2/3', o.bt.at('small'), 0.24, 0, { color: G.ok, edge: G.ok, step: true }); await K.sleep(2); },
        ev: { type: 'similar' }, see: X('Triangle ADE has the same angles as triangle ABC, so the two triangles are similar: AD/AB = AE/AC = DE/BC = 2/3.'),
        why: X('A line drawn parallel to one side of a triangle divides the other two sides in the same ratio. This is the basic proportionality theorem, also called Thales’ theorem.') },
    ],
    eq: { word: 'Basic proportionality theorem', sym: 'AD/DB = AE/EC' },
    result: {
      obs: X('At the halfway point both ratios were 1; when AD was twice DB, both ratios were 2.'),
      concl: X('If a line is parallel to one side of a triangle, it divides the other two sides in the same ratio: AD/DB = AE/EC.'),
      safety: X('Watch your feet around ropes laid on the ground.'),
      viva: [{ q: X('In triangle ABC, DE is parallel to BC, AD = 2 cm, DB = 3 cm and AE = 4 cm. Find EC.'), a: X('2/3 = 4/EC, so EC = 6 cm.') },
        { q: X('If AD/DB = AE/EC, is DE parallel to BC?'), a: X('Yes: that is the converse of the theorem.') },
        { q: X('What can you say about triangles ADE and ABC?'), a: X('They are similar.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 10: tangents
  {
    id: 'w10_tangents', subj: 'maths', cls: 10, ch: C10c, world: true, place: 'quad', table: false,
    title: X('Tangents: a wheel on the road and ropes round a well'),
    aim: X('To push a wheel along a road with your own hand and see that the radius to the touching point is always at right angles to the road, and then find that the two tangents from a point to a circle are equal.'),
    kind: X('Tangents to a circle'),
    setup(K) {
      const ww = K.add(MW5.wheelAndWell(), 0, 0, { y: 0 }), stick = K.add(MW.pullTab(), 0, -0.6), pole = K.add(MW.pullTab(), 0, -0.5);
      ww.camView = { p: V3(K, 0.3, 1.5, 1.3), t: V3(K, -0.3, 0.4, -0.8) };
      const fin = { roll: once(() => { label(K, '90°', ww.at('touch'), 0.12, 0, { color: G.ok, edge: G.ok, step: true }); K.lab.emit('roll', { obj: ww.id }); }), pole: once(() => K.lab.emit('pole', { obj: ww.id })) };
      MW5.bindWheelHands2(ww, stick, pole, K.app, { roll: 1, pole: 3 }, { roll: () => fin.roll(), pole: () => fin.pole() });
      const pu = pole.update; pole.update = (dt, t) => { pu(dt, t); if (K.app.runner.i >= 3 && !ww.well.visible) { fresh(K); ww.part2(true); aim(K, ww, V3(K, -0.6, 2.4, 1.6), V3(K, 1.0, 0.2, -2.1)); } };
      return { ww, stick, pole, fin };
    },
    steps: [
      { do: X('A bicycle wheel stands on a straight road. The road touches the wheel at just one point, T: the road is a tangent to the circle of the wheel.'), target: 'ww',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ww.id }); label(K, 'OT', o.ww.at('wheel'), 0.1, 0, { color: '#5ec8ff', step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The blue line is the radius OT, from the centre O to the touching point T.') },
      { do: X('Push the wheel along the road with the stick, and watch the radius OT.'), target: 'ww',
        act: async (K, o) => { fresh(K); const x0 = o.ww.x; await K.tween(3, (k) => o.ww.roll(x0 + 1.5 * ease(k))); o.fin.roll(); await K.sleep(1); },
        ev: { type: 'roll' }, see: X('Wherever the wheel goes, the radius to the touching point stays at right angles to the road: 90°.') },
      { do: X('Could another line through T touch the wheel only at T?'), target: 'ww',
        act: async (K, o) => { K.lab.emit('tilt', { obj: o.ww.id }); for (const d of [30, 60, 120, 150]) { o.ww.tilt(d); await K.sleep(1); } o.ww.tilt(null); await K.sleep(0.5); },
        ev: { type: 'tilt' }, see: X('No. Any other line through T cuts the wheel at a second point. Only the line at 90° to the radius just touches it: the tangent is perpendicular to the radius at the point of contact.') },
      { do: X('Now hold the pole P near the round well and move it. Two ropes go from P and just touch the well, at A and at B.'), target: 'ww',
        act: async (K, o) => { fresh(K); o.ww.part2(true); const [A, B] = o.ww.polePath(); await K.tween(3, (k) => o.ww.setP(A.clone().lerp(B, ease(k)))); o.fin.pole(); await K.sleep(1); },
        ev: { type: 'pole' }, see: X('However you move P, the two ropes PA and PB stay equally long.') },
      { do: X('Work out how long the ropes are when P is 2 m from the centre of the well.'), target: 'ww',
        act: async (K, o) => { const O = o.ww.O, d = V3(K, -O.x, 0, -O.z).normalize(); o.ww.setP(O.clone().addScaledVector(d, 2)); K.lab.emit('calc', { obj: o.ww.id });
          label(K, 'PA = √(OP² − r²) = √(2² − 1.2²) = 1.6 m', o.ww.at('well'), 0.17, 0, { color: G.ok, edge: G.ok, step: true }); await K.sleep(2); },
        ev: { type: 'calc' }, see: X('OA is a radius and PA a tangent, so the angle at A is 90°. By Pythagoras, PA = √(OP² − r²) = √(4 − 1.44) = 1.6 m, and PB is the same.') },
    ],
    eq: { word: 'Tangents from a point', sym: 'PA = PB' },
    result: {
      obs: X('As the wheel rolled, the radius to the touching point stayed at 90° to the road. The two ropes from P to the well were always equal; with OP = 2 m they were 1.6 m each.'),
      concl: X('The tangent at any point of a circle is perpendicular to the radius through that point, and the two tangents drawn from an outside point to a circle are equal in length.'),
      safety: X('Keep away from the edge of a real well.'),
      viva: [{ q: X('How many tangents can be drawn to a circle from a point outside it?'), a: X('Two.') },
        { q: X('A point is 5 cm from the centre of a circle of radius 3 cm. How long is the tangent from it?'), a: X('√(25 − 9) = 4 cm.') },
        { q: X('How many tangents can be drawn from a point inside a circle?'), a: X('None.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 14: two dice
  {
    id: 'w10_dice', subj: 'maths', cls: 10, ch: C10p, world: true, place: 'room', table: true,
    title: X('Two dice: which total comes most often?'),
    aim: X('To roll two dice with your own hand, build a chart of their totals, and compare it with the probability of each total.'),
    kind: X('Probability'),
    setup(K) {
      const dt = K.add(MW5.diceTable(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      dt.camView = { p: V3(K, 0.02, 0.62, 0.78), t: V3(K, 0, 0.12, -0.04) };
      MW5.bindDiceHands(dt, lever, K.app, { roll: 1 }, { five: once(() => K.lab.emit('five', { obj: dt.id })) });
      return { dt, lever };
    },
    steps: [
      { do: X('Here are a red die and a blue die. Each shows a number from 1 to 6. Add the two numbers: which total do you think will come most often?'), target: 'dt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.dt.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The total can be anything from 2 to 12.') },
      { do: X('Pull the lever towards you to roll both dice, five times.'), target: 'dt',
        act: async (K, o) => { while (o.dt.total < 5) { o.dt.roll(); while (o.dt.rolling) await K.sleep(0.1); await K.sleep(0.3); } },
        ev: { type: 'five' }, see: X('Each roll adds one block to the bar of its total.') },
      { do: X('Now roll them 500 more times, very fast.'), target: 'dt',
        act: async (K, o) => { for (let i = 0; i < 10; i++) { o.dt.bulk(50); await K.sleep(0.25); } K.lab.emit('many', { obj: o.dt.id }); label(K, '7', o.dt.at('seven'), 0.05, 0, { color: '#f2c230', step: true }); await K.sleep(1.5); },
        ev: { type: 'many' }, see: X('A total of 7 comes most often, and totals of 2 and 12 come least often.') },
      { do: X('Find out why: list all the ways the two dice can fall.'), target: 'dt',
        act: async (K, o) => { o.dt.showGrid(true); K.lab.emit('grid', { obj: o.dt.id }); label(K, '6/36 = 1/6', o.dt.at('grid'), 0.04, 0, { color: G.ok, edge: G.ok, step: true }); await K.sleep(2); },
        ev: { type: 'grid' }, see: X('There are 6 × 6 = 36 equally likely outcomes. Six of them give 7, but only one gives 2 and only one gives 12. So P(7) = 6/36 = 1/6, and P(2) = P(12) = 1/36.') },
      { do: X('Compare your rolls with the probability.'), target: 'dt',
        act: async (K, o) => { const c = o.dt.counts[7], n = o.dt.total; K.lab.emit('compare', { obj: o.dt.id }); label(K, `7: ${c}/${n} ≈ ${(c / n).toFixed(2)}   ·   1/6 ≈ 0.17`, o.dt.at('chart'), 0.04, 0, { color: '#ffffff', step: true }); await K.sleep(2); },
        ev: { type: 'compare' }, see: X('In our rolls a total of 7 came about one time in six, close to 1/6. The more we roll, the closer the experiment comes to the probability.') },
    ],
    eq: { word: 'Probability', sym: 'P(7) = 6/36 = 1/6' },
    result: {
      obs: X('In more than 500 rolls, a total of 7 came most often, about one time in six, and 2 and 12 came least often.'),
      concl: X('Probability of an event = number of outcomes in its favour ÷ number of all equally likely outcomes. With two dice, P(7) = 6/36 = 1/6.'),
      safety: X('Keep small dice away from very young children, who could swallow them.'),
      viva: [{ q: X('What is the probability of a total of 2 with two dice?'), a: X('1/36.') },
        { q: X('What is the probability of a total of 13?'), a: X('0: it is impossible.') },
        { q: X('Which totals have a probability of 3/36?'), a: X('4 and 10.') }],
    },
  },
];
// the log stack's lever: each pull adds a row (rows 2–3 in step 1, up to 10 in step 2)
function MW3push(K, ls, lever) {
  const lim = () => (K.app.runner.i === 1 ? 3 : K.app.runner.i === 2 ? 10 : 0);
  MW5.pushLever(lever, { path: () => ls.leverPath(), active: () => { const r = K.app.runner; return r.state === 'todo' && ls.rows < lim(); }, keepVisible: () => lim() > 0, press: () => ls.add() });
}
