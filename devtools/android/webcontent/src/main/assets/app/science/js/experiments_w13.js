// DUET Maths Lab 360, real places 13 (Class 6): Kaprekar's game with digit blocks (number play), a fruit survey in 3D
// bars (data handling), chairs in equal rows (prime time), and a rope compass on the field (constructions).
import { DICT } from './exp_i18n.js';
import { DICT_W13 } from './exp_i18n_w13.js';
import * as MW from './mathworld.js';
import * as MW13 from './mathworld13.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W13);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C6n = N('Ch 3 · Number Play', 'अध्याय 3 · संख्याओं का खेल', 'Ch 3 · Number play');
const C6d = N('Ch 4 · Data Handling and Presentation', 'अध्याय 4 · आँकड़ों का प्रबंधन और प्रस्तुतीकरण', 'Ch 4 · Data handling aur presentation');
const C6p = N('Ch 5 · Prime Time', 'अध्याय 5 · अभाज्य संख्याओं का समय', 'Ch 5 · Prime time');
const C6c = N('Ch 8 · Playing with Constructions', 'अध्याय 8 · रचनाओं के साथ खेल', 'Ch 8 · Constructions ke saath khel');
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

export const EXPERIMENTS_W13 = [
  // ---------------------------------------------------------------- Ch 3: Kaprekar's game
  {
    id: 'w6_kaprekar', subj: 'maths', cls: 6, ch: C6n, world: true, place: 'quad', table: false,
    title: X('Kaprekar’s magic number 6174'),
    aim: X('To play Kaprekar’s game with big digit blocks in your own hand, and discover the number that every round leads to.'),
    kind: X('Playing with digits'),
    setup(K) {
      const kp = K.add(MW13.kaprekar(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      kp.camView = { p: V3(K, 0.0, 1.9, 1.4), t: V3(K, 0.0, 0.6, -2.3) };
      const fin = { reach: once(() => K.lab.emit('reach', { obj: kp.id })) };
      MW13.bindKapHands(kp, lever, K.app, { play: 1 }, { reach: () => fin.reach() });
      return { kp, lever, fin };
    },
    steps: [
      { do: X('The blocks show 3524. One round of the game: arrange the digits from largest to smallest, and from smallest to largest, and subtract.'), target: 'kp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.kp.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The answer becomes the number for the next round.') },
      { do: X('Push the lever to play a round. Keep playing until something surprising happens.'), target: 'kp',
        act: async (K, o) => { while (o.kp.n !== 6174) { o.kp.round(); await waitFor(K, () => !o.kp.busy); await K.sleep(0.3); } o.fin.reach(); },
        ev: { type: 'reach' }, see: X('5432 − 2345 = 3087, 8730 − 0378 = 8352, 8532 − 2358 = 6174.') },
      { do: X('Play one more round with 6174.'), target: 'kp',
        act: async (K, o) => { o.kp.round(); await waitFor(K, () => !o.kp.busy); K.lab.emit('stay', { obj: o.kp.id }); await K.sleep(1); },
        ev: { type: 'stay' }, see: X('7641 − 1467 = 6174 again! The game is stuck at 6174.') },
      { do: X('Start again from 2026, a very different number.'), target: 'kp',
        act: async (K, o) => { o.kp.reset(2026); await K.sleep(0.6); let n = 0; while (o.kp.n !== 6174 && n++ < 8) { o.kp.round(); await waitFor(K, () => !o.kp.busy); } K.lab.emit('again', { obj: o.kp.id }); await K.sleep(1); },
        ev: { type: 'again' }, see: X('After 6 rounds it reaches 6174 too. Any 4-digit number whose digits are not all the same reaches 6174 in at most 7 rounds. D. R. Kaprekar, a school teacher from Maharashtra, found this.') },
    ],
    eq: { word: 'Kaprekar’s constant', sym: '7641 − 1467 = 6174' },
    result: {
      obs: X('Starting from 3524, the game reached 6174 in 3 rounds and then stayed there. Starting from 2026, it reached 6174 in 6 rounds.'),
      concl: X('Kaprekar’s routine sends every 4-digit number (with at least two different digits) to 6174, which then repeats for ever.'),
      safety: X('Lift big blocks with bent knees, or ask a friend to help.'),
      viva: [{ q: X('What is one round for 4321?'), a: X('4321 − 1234 = 3087.') },
        { q: X('Why must the digits not all be the same?'), a: X('Then the two numbers are equal and the answer is 0.') },
        { q: X('What is 7641 − 1467?'), a: X('6174.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 4: fruit crates
  {
    id: 'w6_fruit_bars', subj: 'maths', cls: 6, ch: C6d, topic: 'data', world: true, place: 'quad', table: false,
    title: X('A fruit survey in 3D bars'),
    aim: X('To turn a class survey from tally marks into bars of crates with your own hand, read the bar graph, and see what changes when one crate stands for 2 votes.'),
    kind: X('Tally marks, pictographs and bar graphs'),
    setup(K) {
      const fb = K.add(MW13.fruitBars(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      fb.camView = { p: V3(K, 0.0, 1.95, 2.3), t: V3(K, 0.0, 1.15, -2.2) };
      fb.words = () => [tl(K, X('mango')), tl(K, X('banana')), tl(K, X('apple')), tl(K, X('guava'))]; fb.relabel();
      MW13.bindFruitHands(fb, lever, K.app, { stack: 1 }, { all: () => K.lab.emit('stack', { obj: fb.id }) });
      return { fb, lever };
    },
    steps: [
      { do: X('A class voted for its favourite fruit. The board shows the votes as tally marks: each bundle of 5 has a line across.'), target: 'fb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.fb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Mango 8, banana 5, apple 3 and guava 6 votes.') },
      { do: X('Push the lever to stack one crate for each vote, one fruit at a time.'), target: 'fb',
        act: async (K, o) => { while (o.fb.shown < 4) { o.fb.next(); await waitFor(K, () => !o.fb.busy); await K.sleep(0.2); } K.lab.emit('stack', { obj: o.fb.id }); },
        ev: { type: 'stack' }, see: X('The stacks make a bar graph: the taller the bar, the more votes.') },
      { do: X('Read the bar graph.'), target: 'fb',
        act: async (K, o) => { K.lab.emit('read', { obj: o.fb.id }); label(K, '8 − 3 = 5', o.fb.at('side'), 0.22, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'read' }, see: X('Mango is the favourite and apple the least liked. 5 more children chose mango than apple. In all, 8 + 5 + 3 + 6 = 22 children voted.') },
      { do: X('Now let one crate stand for 2 votes.'), target: 'fb',
        act: async (K, o) => { fresh(K); await K.tween(1.5, (k) => o.fb.setPer(1 + ease(k))); o.fb.setPer(2); K.lab.emit('scale', { obj: o.fb.id }); label(K, tl(K, X('1 crate = 2 votes')), o.fb.at('key'), 0.16, 0, { color: OK, step: true }); await K.sleep(1.5); },
        ev: { type: 'scale' }, see: X('Every bar is half as tall, and 5 votes need two and a half crates. The bars still compare the same way. With a scale, big numbers fit in a small graph.') },
    ],
    eq: { word: 'Bar graph', sym: 'height of bar ∝ number of votes' },
    result: {
      obs: X('Tally marks 8, 5, 3 and 6 became bars of crates. Mango had the tallest bar and apple the shortest. With 1 crate for 2 votes, every bar halved.'),
      concl: X('Data can be shown as tally marks, a pictograph or a bar graph. A scale lets one picture or unit stand for several items; bars with equal widths and gaps are easy to compare.'),
      safety: X('Do not climb on stacked crates; they can topple.'),
      viva: [{ q: X('How is 7 shown in tally marks?'), a: X('One bundle of 5 (four lines with one across) and 2 more lines.') },
        { q: X('If 1 picture = 4 votes, how many pictures show 12 votes?'), a: X('3.') },
        { q: X('How many more votes did guava get than banana?'), a: X('1.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 5: chairs in equal rows
  {
    id: 'w6_prime_chairs', subj: 'maths', cls: 6, ch: C6p, topic: 'numbers', world: true, place: 'quad', table: false,
    title: X('Chairs in equal rows: prime numbers'),
    aim: X('To arrange chairs in equal rows with your own hand, find all the ways for 12 chairs, and see why 7 chairs can only stand in one row.'),
    kind: X('Factors and prime numbers'),
    setup(K) {
      const cr = K.add(MW13.chairRows(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      cr.camView = { p: V3(K, 0.3, 3.0, 2.3), t: V3(K, 0.3, 0.3, -2.4) };
      cr.words = () => ['', '', tl(K, X('left over'))];
      const fin = { found: once(() => K.lab.emit('rows', { obj: cr.id })) };
      MW13.bindChairHands(cr, knob, K.app, { rows: 1 }, { found: () => fin.found() });
      return { cr, knob, fin };
    },
    steps: [
      { do: X('There are 12 chairs for a class, now in a single row. Can they stand in equal rows with none left over?'), target: 'cr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cr.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Chairs left over are shown in red.') },
      { do: X('Slide the handle to try 2, 3, 4, 5 … rows.'), target: 'cr',
        act: async (K, o) => { for (const r of [2, 3, 4, 5]) { o.cr.set(12, r); await K.sleep(0.9); } o.fin.found(); },
        ev: { type: 'rows' }, see: X('2 rows of 6, 3 rows of 4 and 4 rows of 3 work; 5 rows leave 2 chairs over.') },
      { do: X('List every way for 12.'), target: 'cr',
        act: async (K, o) => { o.cr.set(12, 3); K.lab.emit('factors', { obj: o.cr.id }); label(K, '1, 2, 3, 4, 6, 12', o.cr.at('list'), 0.2, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'factors' }, see: X('12 = 1 × 12 = 2 × 6 = 3 × 4. Its factors are 1, 2, 3, 4, 6 and 12. A number with more than two factors is composite.') },
      { do: X('Now try 7 chairs.'), target: 'cr',
        act: async (K, o) => { fresh(K); for (const r of [2, 3, 4]) { o.cr.set(7, r); await K.sleep(0.9); } o.cr.set(7, 1); K.lab.emit('seven', { obj: o.cr.id }); await K.sleep(1.2); },
        ev: { type: 'seven' }, see: X('Only 1 row of 7 (or 7 rows of 1) works. 7 has just two factors, 1 and itself: it is a prime number.') },
      { do: X('Which numbers up to 20 are prime?'), target: 'cr',
        act: async (K, o) => { K.lab.emit('primes', { obj: o.cr.id }); label(K, '2, 3, 5, 7, 11, 13, 17, 19', o.cr.at('list'), 0.17, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'primes' }, see: X('2, 3, 5, 7, 11, 13, 17 and 19. 2 is the only even prime, and 1 is neither prime nor composite.') },
    ],
    eq: { word: 'Prime number', sym: 'exactly two factors: 1 and itself' },
    result: {
      obs: X('12 chairs fitted 1, 2, 3, 4, 6 or 12 equal rows. 7 chairs fitted only 1 row or 7 rows.'),
      concl: X('A prime number has exactly two factors, 1 and itself; a composite number has more. Arranging objects in equal rows shows a number’s factors.'),
      safety: X('Carry one chair at a time, holding it with both hands.'),
      viva: [{ q: X('Is 15 prime or composite?'), a: X('Composite: 15 = 3 × 5.') },
        { q: X('How many ways can 13 chairs stand in equal rows?'), a: X('Two: 1 row of 13 or 13 rows of 1; 13 is prime.') },
        { q: X('Write the factors of 18.'), a: X('1, 2, 3, 6, 9 and 18.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 8: a rope compass
  {
    id: 'w6_rope_compass', subj: 'maths', cls: 6, ch: C6c, topic: 'geometry', world: true, place: 'field', table: false,
    title: X('A giant compass: circle and hexagon'),
    aim: X('To draw a big circle on the field with a peg and rope in your own hand, step the same rope round it, and build a regular hexagon.'),
    kind: X('Constructions with a compass'),
    setup(K) {
      const rc = K.add(MW13.ropeCompass(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      rc.camView = { p: V3(K, 0.4, 4.6, 1.0), t: V3(K, 0.4, 0, -1.9) };
      const fin = { circle: once(() => K.lab.emit('circle', { obj: rc.id })) };
      MW13.bindRopeHands(rc, knob, K.app, { draw: 1 }, { circle: () => fin.circle() });
      return { rc, knob, fin };
    },
    steps: [
      { do: X('A peg is pushed into the ground, with a 1.5 m rope tied to it. A piece of chalk is tied to the other end.'), target: 'rc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rc.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('This is a compass, as big as the field.') },
      { do: X('Slide the handle to walk the chalk end all the way round, keeping the rope tight.'), target: 'rc',
        act: async (K, o) => { const d0 = o.rc.deg; await K.tween(3, (k) => o.rc.setDeg(d0 + (360 - d0) * ease(k))); o.rc.setDeg(360); o.fin.circle(); await K.sleep(0.6); },
        ev: { type: 'circle' }, see: X('A circle: every point on it is 1.5 m from the peg, its centre. The rope is the radius.') },
      { do: X('Without changing the rope, step its length round the circle from one mark to the next.'), target: 'rc',
        act: async (K, o) => { for (let k = 0; k <= 6; k++) { o.rc.step(k); await K.sleep(0.6); } K.lab.emit('step', { obj: o.rc.id }); },
        ev: { type: 'step' }, see: X('The radius fits round the circle exactly 6 times and comes back to the start.') },
      { do: X('Join the 6 marks.'), target: 'rc',
        act: async (K, o) => { o.rc.showHex(); o.rc.say(['6 × 1.5 m = 9 m'], OK); K.lab.emit('hex', { obj: o.rc.id }); await K.sleep(2); },
        ev: { type: 'hex' }, see: X('A regular hexagon: 6 equal sides, each as long as the radius, 1.5 m, so its perimeter is 9 m.') },
    ],
    eq: { word: 'Hexagon in a circle', sym: 'side = radius' },
    result: {
      obs: X('The rope traced a circle of radius 1.5 m. The same length stepped round the circle exactly 6 times, and the marks made a regular hexagon with 1.5 m sides.'),
      concl: X('A compass keeps one length fixed, so it draws circles and copies lengths. Stepping the radius round a circle gives 6 points that make a regular hexagon.'),
      safety: X('Keep the rope low and watch that nobody trips over it.'),
      viva: [{ q: X('What do we call the rope’s length in the circle?'), a: X('The radius.') },
        { q: X('How long is the diameter of this circle?'), a: X('3 m.') },
        { q: X('How many times does the radius fit round its circle as a chord?'), a: X('6 times.') }],
    },
  },
];
