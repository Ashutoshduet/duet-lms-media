// DUET Maths Lab 360, real places 11 (Class 7, Part 2): twin triangular plots (congruence), a frog on an integer line
// (multiplying integers), two frogs and two ribbons (LCM and HCF), and a square metre in tenths (multiplying decimals).
import { DICT } from './exp_i18n.js';
import { DICT_W11 } from './exp_i18n_w11.js';
import * as MW from './mathworld.js';
import * as MW11 from './mathworld11.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W11);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C7t = N('Part 2 · Ch 1 · Geometric Twins', 'भाग 2 · अध्याय 1 · ज्यामितीय जुड़वाँ', 'Part 2 · Ch 1 · Geometric twins');
const C7i = N('Part 2 · Ch 2 · Operations with Integers', 'भाग 2 · अध्याय 2 · पूर्णांकों पर संक्रियाएँ', 'Part 2 · Ch 2 · Integers par operations');
const C7c = N('Part 2 · Ch 3 · Finding Common Ground', 'भाग 2 · अध्याय 3 · साझा आधार की खोज', 'Part 2 · Ch 3 · Common ground ki khoj');
const C7d = N('Part 2 · Ch 4 · Another Peek Beyond the Point', 'भाग 2 · अध्याय 4 · दशमलव के आगे एक और झलक', 'Part 2 · Ch 4 · Decimal ke aage ek aur jhalak');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitFor = async (K, f, max = 60) => { for (let i = 0; i < max * 10 && !f(); i++) await K.sleep(0.1); };

export const EXPERIMENTS_W11 = [
  // ---------------------------------------------------------------- Part 2 Ch 1: twin triangular plots
  {
    id: 'w7_twin_triangles', subj: 'maths', cls: 7, ch: C7t, topic: 'geometry', world: true, place: 'field', table: false,
    title: X('Twin triangles: lift, turn and flip'),
    aim: X('To pick up a triangular plot with your own hand, turn it and flip it onto another, and find what is enough to know that two triangles are twins (congruent).'),
    kind: X('Congruent triangles'),
    setup(K) {
      const tw = K.add(MW11.twinTriangles(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      tw.camView = { p: V3(K, 0.1, 5.0, 1.8), t: V3(K, 0.1, 0, -2.7) };
      const fin = { move: once(() => K.lab.emit('move', { obj: tw.id })) };
      MW11.bindTwinHands(tw, knob, K.app, { move: 1 }, { move: () => fin.move() });
      return { tw, knob, fin };
    },
    steps: [
      { do: X('Two triangular plots: ABC (blue) and PQR (yellow), turned round and flipped over. Are they twins?'), target: 'tw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tw.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Twins in geometry, called congruent shapes, fit exactly on each other.') },
      { do: X('Slide the handle to lift PQR, turn it, flip it over and lay it on ABC.'), target: 'tw',
        act: async (K, o) => { const k0 = o.tw.k; await K.tween(3, (k) => o.tw.setK(k0 + (1 - k0) * ease(k))); o.tw.setK(1); o.fin.move(); await K.sleep(0.8); },
        ev: { type: 'move' }, see: X('PQR covers ABC exactly, with P on A, Q on B and R on C. The two triangles are congruent.') },
      { do: X('Measure the matching sides.'), target: 'tw',
        act: async (K, o) => { o.tw.showSides(); K.lab.emit('sides', { obj: o.tw.id }); await K.sleep(2); },
        ev: { type: 'sides' }, see: X('AB = PQ = 2 m, BC = QR = 1.5 m and CA = RP = 2.5 m. Matching angles are equal too.') },
      { do: X('Do we need all six measurements to know they are twins?'), target: 'tw',
        act: async (K, o) => { K.lab.emit('rules', { obj: o.tw.id }); label(K, 'SSS · SAS · ASA', o.tw.at('rules'), 0.3, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'rules' }, see: X('No. Three sides (SSS), two sides and the angle between them (SAS), or two angles and the side between them (ASA) are enough to fix a triangle.') },
    ],
    eq: { word: 'Congruence', sym: '△ABC ≅ △PQR' },
    result: {
      obs: X('After turning and flipping, PQR fitted exactly on ABC. Their matching sides were 2 m, 1.5 m and 2.5 m.'),
      concl: X('Congruent figures have the same shape and size; one can be moved, turned or flipped onto the other. For triangles, SSS, SAS or ASA is enough to show congruence.'),
      safety: X('Watch your feet near the pegs and ropes.'),
      viva: [{ q: X('Does flipping a triangle over change its size?'), a: X('No; it only gives its mirror image.') },
        { q: X('Two triangles have all three angles equal. Must they be congruent?'), a: X('No; one can be a bigger copy of the other.') },
        { q: X('What does SAS stand for?'), a: X('Two sides and the angle between them.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 2: a frog on an integer line
  {
    id: 'w7_integer_frog', subj: 'maths', cls: 7, ch: C7i, world: true, place: 'quad', table: false,
    title: X('A frog multiplies integers'),
    aim: X('To make a frog jump along a number line with your own hand, and see why a negative times a negative is positive.'),
    kind: X('Multiplication of integers'),
    setup(K) {
      const fr = K.add(MW11.integerFrog(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      fr.camView = { p: V3(K, 0.0, 2.6, 1.7), t: V3(K, 0.0, 0.3, -2.0) };
      MW11.bindIntFrogHands(fr, lever, K.app, { jump: 1 }, 3, -2, { all: () => K.lab.emit('jump', { obj: fr.id }) });
      return { fr, lever };
    },
    steps: [
      { do: X('A frog sits at 0. 3 × 2 means 3 jumps of +2: it lands on 6. What is 3 × (−2)?'), target: 'fr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.fr.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('A jump of −2 goes 2 to the left.') },
      { do: X('Push the lever to make 3 jumps of −2.'), target: 'fr',
        act: async (K, o) => { while (o.fr.jumps < 3) { o.fr.jump(-2); await waitFor(K, () => !o.fr.busy); } K.lab.emit('jump', { obj: o.fr.id }); },
        ev: { type: 'jump' }, see: X('The frog lands on −6. So 3 × (−2) = −6.') },
      { do: X('(−3) × 2 is the opposite of 3 × 2.'), target: 'fr',
        act: async (K, o) => { o.fr.reset(); o.fr.ghostAt(6); await K.sleep(0.6); o.fr.jump(-6); await waitFor(K, () => !o.fr.busy); o.fr.say(['(−3) × 2 = −(3 × 2) = −6'], '#ff9a7a'); K.lab.emit('flip1', { obj: o.fr.id }); await K.sleep(1.2); },
        ev: { type: 'flip1' }, see: X('3 × 2 would land on 6 (the pale frog). The opposite of that is −6. So (−3) × 2 = −6.') },
      { do: X('(−3) × (−2) is the opposite of 3 × (−2).'), target: 'fr',
        act: async (K, o) => { o.fr.reset(); o.fr.ghostAt(-6); await K.sleep(0.6); o.fr.jump(6); await waitFor(K, () => !o.fr.busy); o.fr.say(['(−3) × (−2) = −(−6) = 6'], OK); K.lab.emit('flip2', { obj: o.fr.id }); await K.sleep(1.2); },
        ev: { type: 'flip2' }, see: X('3 × (−2) lands on −6, and its opposite is +6. So (−3) × (−2) = 6: a negative times a negative is positive.') },
      { do: X('Put the four rules together.'), target: 'fr',
        act: async (K, o) => { o.fr.say(['(+) × (+) = +     (+) × (−) = −', '(−) × (+) = −     (−) × (−) = +'], ['#ffffff', '#ffd23f']); K.lab.emit('rules', { obj: o.fr.id }); await K.sleep(2); },
        ev: { type: 'rules' }, see: X('Same signs give a positive product, different signs a negative one. Brahmagupta wrote these rules about 1,400 years ago.') },
    ],
    eq: { word: 'Signs of a product', sym: '(−a) × (−b) = a × b' },
    result: {
      obs: X('3 jumps of −2 ended at −6. (−3) × 2 turned the walk round to −6, and (−3) × (−2) turned −6 round to +6.'),
      concl: X('Multiplying by a negative number turns the result to the opposite side of 0. So like signs give a positive product and unlike signs a negative product. Division follows the same sign rules.'),
      safety: X('Keep the play area clear when you jump along a line.'),
      viva: [{ q: X('Find (−4) × 5.'), a: X('−20.') },
        { q: X('Find (−7) × (−3).'), a: X('21.') },
        { q: X('Find (−12) ÷ (−4).'), a: X('3.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 3: frogs and ribbons
  {
    id: 'w7_frog_lcm', subj: 'maths', cls: 7, ch: C7c, topic: 'numbers', world: true, place: 'quad', table: false,
    title: X('Where do two frogs meet? LCM and HCF'),
    aim: X('To make two frogs with different jumps leap along stones with your own hand, find where they both land (common multiples), and cut two ribbons into the longest equal pieces (common factors).'),
    kind: X('HCF and LCM'),
    setup(K) {
      const lf = K.add(MW11.lcmFrogs(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      lf.camView = { p: V3(K, 0.0, 2.7, 1.3), t: V3(K, 0.0, 0.2, -2.4) };
      lf.say(['4 · 6'], '#ffffff');
      const fin = { meet: once(() => { label(K, '12', lf.at('v12'), 0.24, 0, { color: '#ffd23f', edge: '#ffd23f', step: true }); K.lab.emit('meet', { obj: lf.id }); }) };
      MW11.bindLcmHands(lf, lever, K.app, { jump: 1 }, { meet: () => fin.meet() });
      return { lf, lever, fin };
    },
    steps: [
      { do: X('Two frogs sit on stone 0. The red frog jumps 4 stones at a time, the blue frog 6.'), target: 'lf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The stones each frog lands on are coloured: red, blue, or gold when both have landed there.') },
      { do: X('Push the lever to make both frogs jump, until there is a stone both have landed on.'), target: 'lf',
        act: async (K, o) => { while (!o.lf.both(12)) { o.lf.jump(); await waitFor(K, () => !o.lf.busy); } o.fin.meet(); await K.sleep(0.6); },
        ev: { type: 'meet' }, see: X('Red lands on 4, 8, 12 and blue on 6, 12, 18. Stone 12 turns gold: both have landed there.') },
      { do: X('Keep them jumping to the end of the line.'), target: 'lf',
        act: async (K, o) => { while (o.lf.fpos.r < 24 || o.lf.fpos.b < 24) { if (!o.lf.jump()) break; await waitFor(K, () => !o.lf.busy); }
          o.lf.say(['4: 4, 8, 12, 16, 20, 24', '6: 6, 12, 18, 24', 'LCM = 12'], ['#ff8a7a', '#7ad0ff', '#ffd23f']); K.lab.emit('lcm', { obj: o.lf.id }); await K.sleep(1.5); },
        ev: { type: 'lcm' }, see: X('The gold stones, 12 and 24, are common multiples of 4 and 6. The smallest, 12, is their lowest common multiple (LCM).') },
      { do: X('Now two ribbons lie along the line, 12 and 18 long. Cut both into equal pieces, as long as possible.'), target: 'lf',
        act: async (K, o) => { fresh(K); o.lf.showRibbons(false); await K.sleep(0.8); o.lf.showRibbons(true); o.lf.say(['12 = 6 + 6', '18 = 6 + 6 + 6', 'HCF = 6'], ['#c58bff', '#5ee0d0', OK]); K.lab.emit('hcf', { obj: o.lf.id }); await K.sleep(1.5); },
        ev: { type: 'hcf' }, see: X('Pieces of 6 fit both ribbons exactly, and no longer piece does. 6 is the highest common factor (HCF) of 12 and 18.') },
    ],
    eq: { word: 'LCM and HCF', sym: 'LCM(4, 6) = 12,  HCF(12, 18) = 6' },
    result: {
      obs: X('The frogs both landed on 12 and 24, so the LCM of 4 and 6 is 12. Pieces of 6 fitted ribbons of 12 and 18, so their HCF is 6.'),
      concl: X('Common multiples are where both counts meet; the smallest is the LCM. Common factors divide both numbers; the largest is the HCF. Prime factorisation helps find both.'),
      safety: X('Do not jump on wet stones; they can be slippery.'),
      viva: [{ q: X('Find the LCM of 6 and 8.'), a: X('24.') },
        { q: X('Find the HCF of 24 and 36.'), a: X('12.') },
        { q: X('Two bells ring every 4 and 10 minutes. They ring together now. When will they next ring together?'), a: X('After 20 minutes.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 4: 0.3 × 0.4 on a square metre
  {
    id: 'w7_decimal_area', subj: 'maths', cls: 7, ch: C7d, world: true, place: 'room', table: false,
    title: X('Multiplying decimals on a square metre'),
    aim: X('To mark strips of 0.3 m and 0.4 m on a square metre with your own hand, and see why 0.3 × 0.4 = 0.12.'),
    kind: X('Multiplying decimals'),
    setup(K) {
      const ds = K.add(MW11.decimalSquare(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      ds.camView = { p: V3(K, 0.4, 2.0, -0.1), t: V3(K, 0.4, 0, -1.95) };
      MW11.bindDecHands(ds, lever, K.app, { mark: 1 }, { all: () => K.lab.emit('mark', { obj: ds.id }) });
      return { ds, lever };
    },
    steps: [
      { do: X('This square is 1 m by 1 m. It is divided into 100 small squares, each 0.1 m by 0.1 m.'), target: 'ds',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ds.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each small square is 1/100 of a square metre: 0.01 m².') },
      { do: X('Push the lever to mark a strip 0.3 m wide (yellow), and again to mark a strip 0.4 m deep (blue).'), target: 'ds',
        act: async (K, o) => { while (o.ds.marks < 2) { o.ds.setMarks(o.ds.marks + 1); await K.sleep(0.9); } K.lab.emit('mark', { obj: o.ds.id }); },
        ev: { type: 'mark' }, see: X('Where the two strips cross, a green rectangle 0.3 m wide and 0.4 m deep appears.') },
      { do: X('Count the small squares in the green rectangle.'), target: 'ds',
        act: async (K, o) => { o.ds.say(['3 × 4 = 12', '12 × 0.01 = 0.12 m²'], ['#ffffff', OK]); K.lab.emit('count', { obj: o.ds.id }); await K.sleep(2); },
        ev: { type: 'count' }, see: X('12 small squares of 0.01 m² each: 0.12 m². So 0.3 × 0.4 = 0.12.') },
      { do: X('Find a quick rule.'), target: 'ds',
        act: async (K, o) => { o.ds.say(['0.3 × 0.4 = 0.12'], OK); K.lab.emit('rule', { obj: o.ds.id }); label(K, '3 × 4 = 12  →  1 + 1 = 2', o.ds.at('side'), 0.1, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'rule' }, see: X('Multiply as whole numbers, 3 × 4 = 12, then count the decimal places: one in 0.3 and one in 0.4 make two, so 0.12. Tenths × tenths = hundredths.') },
    ],
    eq: { word: 'Decimal product', sym: '0.3 × 0.4 = 0.12' },
    result: {
      obs: X('The 0.3 m by 0.4 m rectangle covered 12 of the 100 small squares, which is 0.12 m².'),
      concl: X('To multiply decimals, multiply the numbers without the points and then put in as many decimal places as the two numbers have together. The product of two numbers less than 1 is smaller than each of them.'),
      safety: X('Do not stand on the marked floor while it is being painted.'),
      viva: [{ q: X('Find 0.2 × 0.6.'), a: X('0.12.') },
        { q: X('Find 1.5 × 0.3.'), a: X('0.45.') },
        { q: X('Find 0.12 ÷ 0.4.'), a: X('0.3.') }],
    },
  },
];
