// DUET Maths Lab 360, real places 8 (Class 8): a shepherd counting sheep with pebbles, bags and sacks (a story of
// numbers), the corners of a four-sided field (quadrilaterals), base-10 blocks and the test for 9 (number play), a floor of
// 100 tiles (percentages), and a trapezium field doubled into a rectangle (area).
import { DICT } from './exp_i18n.js';
import { DICT_W8 } from './exp_i18n_w8.js';
import * as MW from './mathworld.js';
import * as MW8 from './mathworld8.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W8);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C8n = N('Ch 3 · A Story of Numbers', 'अध्याय 3 · संख्याओं की कहानी', 'Ch 3 · Numbers ki kahani');
const C8q = N('Ch 4 · Quadrilaterals', 'अध्याय 4 · चतुर्भुज', 'Ch 4 · Quadrilaterals');
const C8p = N('Ch 5 · Number Play', 'अध्याय 5 · संख्याओं का खेल', 'Ch 5 · Number play');
const C8f = N('Part 2 · Ch 1 · Fractions in Disguise', 'भाग 2 · अध्याय 1 · भेस बदले भिन्न', 'Part 2 · Ch 1 · Fractions in disguise');
const C8a = N('Part 2 · Ch 7 · Area', 'भाग 2 · अध्याय 7 · क्षेत्रफल', 'Part 2 · Ch 7 · Area');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';

export const EXPERIMENTS_W8 = [
  // ---------------------------------------------------------------- Ch 3: sheep, pebbles, bags and sacks
  {
    id: 'w8_count_sheep', subj: 'maths', cls: 8, ch: C8n, world: true, place: 'farm', table: false,
    title: X('Counting sheep with pebbles: the story of place value'),
    aim: X('To let a flock out through a gate with your own hand, count it the way a shepherd might have, with pebbles, bags and sacks, and see how this grew into place value and zero.'),
    kind: X('Number systems and place value'),
    setup(K) {
      const sc = K.add(MW8.sheepCount(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      sc.camView = { p: V3(K, 0.4, 2.9, 2.6), t: V3(K, 0.2, 0.3, -2.7) };
      sc.onFlow = (n) => { if (n === 23) K.lab.emit('flow', { obj: sc.id }); };
      MW8.bindSheepHands(sc, lever, K.app, { flow: 1 }, 23);
      return { sc, lever };
    },
    steps: [
      { do: X('Long ago, a shepherd had no written numbers. For every sheep that went out, he dropped one pebble in a tray.'), target: 'sc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sc.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Ten pebbles are too many to look after, so ten pebbles are swapped for one bag, and ten bags for one sack.') },
      { do: X('Push the lever to open the gate, and watch the trays as the sheep go out.'), target: 'sc',
        act: async (K, o) => { o.sc.flow(23 - o.sc.count, 3); while (o.sc.flowing) await K.sleep(0.1); await K.sleep(0.6); },
        ev: { type: 'flow' }, see: X('23 sheep went out: 2 bags and 3 pebbles. The tray tells how many tens and how many ones.') },
      { do: X('A bigger flock comes back in the evening. Count it the same way.'), target: 'sc',
        act: async (K, o) => { o.sc.flow(132 - o.sc.count, 12); while (o.sc.flowing) await K.sleep(0.1); K.lab.emit('big', { obj: o.sc.id }); label(K, '132 = 1 × 100 + 3 × 10 + 2', o.sc.at('mid'), 0.18, 0, { color: '#ffd23f', step: true }); await K.sleep(1.5); },
        ev: { type: 'big' }, see: X('132 sheep: 1 sack, 3 bags and 2 pebbles. The same digit means a different amount in a different place: that is place value.') },
      { do: X('Another day, 105 sheep go out. What goes in the tens tray?'), target: 'sc',
        act: async (K, o) => { fresh(K); o.sc.setCount(105, true); K.lab.emit('zero', { obj: o.sc.id }); await K.sleep(2); },
        ev: { type: 'zero' }, see: X('Nothing: the tray is empty. A mark is still needed there, or 105 would look like 15. That mark is zero, and the Indian place-value system with zero is the one the whole world uses now.') },
    ],
    eq: { word: 'Place value', sym: '132 = 1 × 100 + 3 × 10 + 2' },
    result: {
      obs: X('23 sheep were counted as 2 bags and 3 pebbles, 132 sheep as 1 sack, 3 bags and 2 pebbles, and 105 sheep needed an empty tens tray.'),
      concl: X('In our number system, each place is worth ten times the place to its right (base 10). The value of a digit depends on its place, and zero holds a place that is empty.'),
      safety: X('Keep out of the way of animals moving through a gate.'),
      viva: [{ q: X('What is the value of 7 in 4,732?'), a: X('700.') },
        { q: X('Why do we need zero in 105?'), a: X('To show there are no tens; without it, 105 would look like 15.') },
        { q: X('If bags held 5 pebbles instead of 10, how would 13 sheep be shown?'), a: X('2 bags and 3 pebbles: 23 in base 5.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 4: the corners of a four-sided field
  {
    id: 'w8_field_corners', subj: 'maths', cls: 8, ch: C8q, world: true, place: 'field', table: false,
    title: X('The four corners of a field make a full turn'),
    aim: X('To change the shape of a four-sided field with your own hand, watch the sum of its angles, and join its four corners into one full turn.'),
    kind: X('Angles of a quadrilateral'),
    setup(K) {
      const qc = K.add(MW8.quadCorners(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      qc.camView = { p: V3(K, 0.2, 5.0, 2.2), t: V3(K, 0.2, 0, -3.0) };
      const fin = { move: once(() => K.lab.emit('move', { obj: qc.id })) };
      MW8.bindQuadHands(qc, knob, K.app, { move: 1 }, { move: () => fin.move() });
      return { qc, knob, fin };
    },
    steps: [
      { do: X('A four-sided field ABCD is roped out on the ground. Each corner has a coloured wedge for its angle.'), target: 'qc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.qc.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The board adds up the four angles.') },
      { do: X('Move the corner D with the handle, and watch the four angles.'), target: 'qc',
        act: async (K, o) => { const k0 = o.qc.kD; await K.tween(2.5, (k) => o.qc.setD(k0 + (0.05 - k0) * ease(k))); await K.tween(2.5, (k) => o.qc.setD(0.05 + 0.9 * ease(k))); o.fin.move(); await K.sleep(0.6); },
        ev: { type: 'move' }, see: X('Each angle changes, but the four always add up to 360°.') },
      { do: X('Cut off the four corners and bring them together at one point.'), target: 'qc',
        act: async (K, o) => { await K.tween(3, (k) => o.qc.join(k)); o.qc.join(1); K.lab.emit('join', { obj: o.qc.id }); label(K, '360°', o.qc.at('j'), 0.3, 0, { color: OK, edge: OK, step: true }); await K.sleep(1.5); },
        ev: { type: 'join' }, see: X('The four corners fit together exactly into a full turn, with no gap and no overlap: 360°.') },
      { do: X('Why is it always 360°? Rope a diagonal from A to C.'), target: 'qc',
        act: async (K, o) => { fresh(K); await K.tween(2, (k) => o.qc.join(1 - k)); o.qc.join(0); o.qc.showDiag(); K.lab.emit('diag', { obj: o.qc.id });
          label(K, '180°', o.qc.at('t1'), 0.24, 0, { color: '#ffd23f', step: true }); label(K, '180°', o.qc.at('t2'), 0.24, 0, { color: '#7ad0ff', step: true }); await K.sleep(1.6); },
        ev: { type: 'diag' }, see: X('The diagonal cuts the field into two triangles. The angles of each triangle add up to 180°, so the field’s angles add up to 180° + 180° = 360°.') },
    ],
    eq: { word: 'Angle sum of a quadrilateral', sym: '∠A + ∠B + ∠C + ∠D = 360°' },
    result: {
      obs: X('However corner D was moved, the four angles added up to 360°. The four corners together made a full turn, and a diagonal split the field into two triangles.'),
      concl: X('The angles of any quadrilateral add up to 360°, because a diagonal divides it into two triangles of 180° each.'),
      safety: X('Look out for the pegs and ropes on the ground.'),
      viva: [{ q: X('Three angles of a quadrilateral are 80°, 100° and 90°. Find the fourth.'), a: X('90°.') },
        { q: X('What is each angle of a rectangle, and what do they add up to?'), a: X('90°; 4 × 90° = 360°.') },
        { q: X('How many triangles does one diagonal make in a quadrilateral?'), a: X('Two.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 5: the test for 9 with base-10 blocks
  {
    id: 'w8_nine_trick', subj: 'maths', cls: 8, ch: C8p, world: true, place: 'room', table: true,
    title: X('Why the digit sum tells if a number is a multiple of 9'),
    aim: X('To take one cube off every hundred and every ten of a block number with your own hand, and see why the sum of the digits decides whether it is a multiple of 9.'),
    kind: X('Divisibility by 9'),
    setup(K) {
      const nb = K.add(MW8.nineBlocks(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      nb.camView = { p: V3(K, 0.0, 0.8, 0.82), t: V3(K, 0.0, 0.0, 0.04) };
      const fin = { split: once(() => K.lab.emit('split', { obj: nb.id })) };
      MW8.bindNineHands(nb, lever, K.app, { split: 1 }, { split: () => fin.split() });
      return { nb, lever, fin };
    },
    steps: [
      { do: X('The number 342 is built with blocks: 3 hundreds, 4 tens and 2 ones. Is it a multiple of 9?'), target: 'nb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.nb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('A hundred is 99 + 1, and 99 = 11 × 9. A ten is 9 + 1.') },
      { do: X('Push the lever to take one cube off every hundred and every ten, and to move the ones to the plate.'), target: 'nb',
        act: async (K, o) => { await K.tween(2, (k) => o.nb.setSplit(k)); o.nb.setSplit(1); o.fin.split(); await K.sleep(0.6); },
        ev: { type: 'split' }, see: X('Everything still on the mat is green: 99s and 9s, all multiples of 9. On the plate are 3 + 4 + 2 = 9 cubes: the sum of the digits.') },
      { do: X('Is the plate a multiple of 9 too?'), target: 'nb',
        act: async (K, o) => { K.lab.emit('plate', { obj: o.nb.id }); label(K, '3 + 4 + 2 = 9  →  342 = 9 × 38', o.nb.at('top'), 0.04, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'plate' }, see: X('Yes: 9 cubes make one more nine. So all of 342 splits into nines: 342 = 9 × 38.') },
      { do: X('Now try 345.'), target: 'nb',
        act: async (K, o) => { fresh(K); o.nb.build(345); await K.sleep(0.6); await K.tween(2, (k) => o.nb.setSplit(k)); o.nb.setSplit(1); K.lab.emit('try', { obj: o.nb.id });
          label(K, '3 + 4 + 5 = 12 = 9 + 3', o.nb.at('top'), 0.04, 0, { color: '#ff8aa8', step: true }); await K.sleep(1.6); },
        ev: { type: 'try' }, see: X('The plate has 12 cubes: one nine and 3 left over. So 345 is not a multiple of 9; it leaves a remainder of 3.'),
        why: X('Every 10, 100, 1000 … is one more than a multiple of 9. So a number and the sum of its digits leave the same remainder when divided by 9. The same works for 3.') },
    ],
    eq: { word: 'Test for 9', sym: '9 | n  ⇔  9 | (sum of digits)' },
    result: {
      obs: X('For 342, the cubes taken off were 3 + 4 + 2 = 9, so 342 is a multiple of 9. For 345, they were 12, which leaves 3, so 345 is not.'),
      concl: X('A number is a multiple of 9 exactly when the sum of its digits is a multiple of 9, and the remainders are the same. The same test works for 3.'),
      safety: X('Keep small blocks away from little children.'),
      viva: [{ q: X('Is 7,326 a multiple of 9?'), a: X('Yes: 7 + 3 + 2 + 6 = 18, a multiple of 9.') },
        { q: X('What remainder does 1,000 leave when divided by 9?'), a: X('1.') },
        { q: X('Is 123 a multiple of 3?'), a: X('Yes: 1 + 2 + 3 = 6.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 1: a floor of 100 tiles
  {
    id: 'w8_percent_floor', subj: 'maths', cls: 8, ch: C8f, world: true, place: 'room', table: false,
    title: X('Per cent on a floor of 100 tiles'),
    aim: X('To paint the tiles of a 100-tile floor with a roller in your own hand, and see fractions, decimals and percentages as the same part of the floor.'),
    kind: X('Percentages'),
    setup(K) {
      K.app.places && K.app.places.table && (K.app.places.table.visible = false);
      const pf = K.add(MW8.percentFloor(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      pf.camView = { p: V3(K, 0.6, 3.0, 1.2), t: V3(K, 0.6, 0, -2.0) };
      const fin = { goal: once(() => { label(K, '25% = 25/100 = 1/4 = 0.25', pf.at('side'), 0.17, 0, { color: OK, edge: OK, step: true }); K.lab.emit('paint', { obj: pf.id }); }) };
      MW8.bindPctHands(pf, knob, K.app, { paint: 1 }, 25, { goal: () => fin.goal() });
      return { pf, knob, fin };
    },
    steps: [
      { do: X('This floor has 10 rows of 10 tiles: 100 tiles. Per cent means “out of a hundred”.'), target: 'pf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.pf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('So one tile is 1% of the floor.') },
      { do: X('Slide the handle to paint 25 tiles with the roller.'), target: 'pf',
        act: async (K, o) => { const n0 = o.pf.n; await K.tween(2.5, (k) => o.pf.setN(n0 + (25 - n0) * ease(k))); o.pf.setN(25); o.fin.goal(); await K.sleep(1); },
        ev: { type: 'paint' }, see: X('25 tiles out of 100 is 25%. It is also a quarter of the floor: 25/100 = 1/4 = 0.25.') },
      { do: X('Now paint three-fifths of the floor.'), target: 'pf',
        act: async (K, o) => { fresh(K); await K.tween(2.5, (k) => o.pf.setN(25 + 35 * ease(k))); o.pf.setN(60); K.lab.emit('fifths', { obj: o.pf.id }); label(K, '3/5 = 60/100 = 60%', o.pf.at('side'), 0.17, 0, { color: '#7ad0ff', step: true }); await K.sleep(1.5); },
        ev: { type: 'fifths' }, see: X('3/5 = 60/100, so three-fifths of the floor is 60 tiles, or 60%.') },
      { do: X('A team won 18 of its 25 matches. Group the tiles in squares of 4 to make 25 big tiles, and paint 18 of them.'), target: 'pf',
        act: async (K, o) => { fresh(K); o.pf.col2 = true; o.pf.showBig(); o.pf.setBig(0); await K.sleep(0.5); await K.tween(2.5, (k) => o.pf.setBig(18 * ease(k))); o.pf.setBig(18); K.lab.emit('compare', { obj: o.pf.id });
          label(K, '18/25 = 72/100 = 72%', o.pf.at('side'), 0.17, 0, { color: '#ff9a4a', step: true }); await K.sleep(1.5); },
        ev: { type: 'compare' }, see: X('18 big tiles cover 72 small tiles: 18/25 = 72%. A team that won 70 of 100 matches did a little less well. Percentages make different totals easy to compare.') },
    ],
    eq: { word: 'Percentage', sym: 'x% = x/100' },
    result: {
      obs: X('25 tiles of 100 were 25% (a quarter), three-fifths of the floor was 60 tiles, and 18 out of 25 came to 72 tiles.'),
      concl: X('A percentage is a fraction with 100 below it. Turning fractions into “out of 100” lets us compare parts of different wholes.'),
      safety: X('Wet paint is slippery: do not walk on a freshly painted floor.'),
      viva: [{ q: X('Write 3/4 as a percentage.'), a: X('75%.') },
        { q: X('What is 20% of 50?'), a: X('10.') },
        { q: X('Which is more, 7 out of 10 or 13 out of 20?'), a: X('7 out of 10: 70% against 65%.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 7: a trapezium field doubled
  {
    id: 'w8_trapezium_field', subj: 'maths', cls: 8, ch: C8a, world: true, place: 'khet', table: false,
    title: X('The area of a trapezium field'),
    aim: X('To swing a copy of a trapezium-shaped field around with your own hand, make a rectangle from the two, and find the area of the trapezium.'),
    kind: X('Area of a trapezium'),
    setup(K) {
      const tf = K.add(MW8.trapField(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      tf.camView = { p: V3(K, 1.4, 5.0, 2.2), t: V3(K, 1.4, 0, -2.4) };
      const fin = { turn: once(() => { label(K, '6 m × 2 m = 12 m²', tf.at('rect'), 0.24, 0, { color: '#ffd23f', edge: '#ffd23f', step: true }); K.lab.emit('turn', { obj: tf.id }); }) };
      MW8.bindTrapHands(tf, knob, K.app, { turn: 1 }, { turn: () => fin.turn() });
      return { tf, knob, fin };
    },
    steps: [
      { do: X('This field is a trapezium. Its parallel sides are 4 m and 2 m long, and they are 2 m apart.'), target: 'tf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('It is drawn on a grid of 1 m squares.') },
      { do: X('Swing a copy of the field half a turn around the middle of its slanted side, with the handle.'), target: 'tf',
        act: async (K, o) => { const k0 = o.tf.k; await K.tween(3, (k) => o.tf.setK(k0 + (1 - k0) * ease(k))); o.tf.setK(1); o.fin.turn(); await K.sleep(1); },
        ev: { type: 'turn' }, see: X('The field and its copy fit together into a rectangle 4 + 2 = 6 m long and 2 m wide: 12 m².') },
      { do: X('So what is the area of one field?'), target: 'tf',
        act: async (K, o) => { K.lab.emit('half', { obj: o.tf.id }); label(K, '½ × (4 + 2) × 2 = 6 m²', o.tf.at('half'), 0.24, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'half' }, see: X('Half the rectangle: ½ × (4 + 2) × 2 = 6 m². Half the sum of the parallel sides, times the distance between them.') },
      { do: X('Check by counting the 1 m squares in the green field.'), target: 'tf',
        act: async (K, o) => { K.lab.emit('count', { obj: o.tf.id }); await K.sleep(2); },
        ev: { type: 'count' }, see: X('5 whole squares and 2 half squares: 5 + 1 = 6 m². It matches.') },
    ],
    eq: { word: 'Area of a trapezium', sym: 'A = ½ × (a + b) × h' },
    result: {
      obs: X('Two copies of the trapezium made a 6 m × 2 m rectangle of 12 m², so one field is 6 m². Counting squares gave 6 m² too.'),
      concl: X('The area of a trapezium is half the sum of its parallel sides multiplied by the distance between them: A = ½ (a + b) h.'),
      safety: X('Walk along the edges of a field, not through the crop.'),
      viva: [{ q: X('Find the area of a trapezium with parallel sides 6 m and 4 m, and height 3 m.'), a: X('½ × 10 × 3 = 15 m².') },
        { q: X('Why do two copies of a trapezium make a parallelogram?'), a: X('Turning one copy half a turn puts its longer side next to the shorter side, so both long sides become a + b.') },
        { q: X('A trapezium has area 20 m² and parallel sides 3 m and 7 m. What is its height?'), a: X('4 m.') }],
    },
  },
];
