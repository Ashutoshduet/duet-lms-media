// DUET Maths Lab 360, real places 7 (Class 9): a tank filling steadily (linear polynomials), √2 and the square-root spiral
// on the ground (the world of numbers), angles in a big circle (circles), and a bamboo and a pond weed growing week by week
// (sequences and progressions).
import { DICT } from './exp_i18n.js';
import { DICT_W7 } from './exp_i18n_w7.js';
import * as MW from './mathworld.js';
import * as MW7 from './mathworld7.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W7);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C9p = N('Ch 2 · Introduction to Linear Polynomials', 'अध्याय 2 · रैखिक बहुपदों का परिचय', 'Ch 2 · Linear polynomials ka parichay');
const C9n = N('Ch 3 · The World of Numbers', 'अध्याय 3 · संख्याओं की दुनिया', 'Ch 3 · Numbers ki duniya');
const C9c = N("Ch 5 · I'm Up and Down, and Round and Round", 'अध्याय 5 · मैं ऊपर-नीचे, और गोल-गोल', 'Ch 5 · Main upar-neeche, aur gol-gol');
const C9s = N('Ch 8 · Predicting What Comes Next: Exploring Sequences and Progressions', 'अध्याय 8 · आगे क्या आएगा: अनुक्रम और श्रेढ़ियाँ', 'Ch 8 · Aage kya aayega: sequences aur progressions');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';

export const EXPERIMENTS_W7 = [
  // ---------------------------------------------------------------- Ch 2: a tank filling steadily
  {
    id: 'w9_linear_tank', subj: 'maths', cls: 9, ch: C9p, world: true, place: 'farm', table: false,
    title: X('A tank filling steadily: a linear polynomial'),
    aim: X('To open a tap with your own hand, plot the water level of a tank minute by minute, and see that it follows the straight line of a linear polynomial.'),
    kind: X('Linear polynomials and their graphs'),
    setup(K) {
      const tg = K.add(MW7.tankGraph(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      tg.camView = { p: V3(K, 0.2, 2.0, 2.4), t: V3(K, 0.2, 1.0, -2.2) };
      tg.onFull = once(() => { tg.showLine('a'); label(K, 'h = 10t + 20', tg.at('slope'), 0.16, 0, { color: '#ffd23f', edge: '#ffd23f', step: true }); K.lab.emit('fill', { obj: tg.id }); });
      MW7.bindTankHands(tg, lever, K.app, { fill: 1 });
      return { tg, lever };
    },
    steps: [
      { do: X('This tank already has 20 cm of water in it. When the tap is open, the water rises 10 cm every minute.'), target: 'tg',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tg.id }); label(K, '20 cm', o.tg.at('tank'), 0.16, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The graph board beside it will show the height h of the water after t minutes.') },
      { do: X('Push the tap handle to open the tap, and watch the graph.'), target: 'tg',
        act: async (K, o) => { fresh(K); o.tg.open(); while (o.tg.filling) await K.sleep(0.1); o.tg.onFull(); await K.sleep(1); },
        ev: { type: 'fill' }, see: X('The points (0, 20), (1, 30), (2, 40) … all lie on one straight line: h = 10t + 20.') },
      { do: X('What do the numbers 10 and 20 mean?'), target: 'tg',
        act: async (K, o) => { K.lab.emit('parts', { obj: o.tg.id }); label(K, tl(K, X('20: where it starts')), o.tg.at('icpt'), 0.13, 0, { color: '#ffffff', step: true }); await K.sleep(0.8);
          label(K, tl(K, X('10: cm per minute')), o.tg.at('rate'), 0.13, 0, { color: '#ffffff', step: true }); await K.sleep(1.4); },
        ev: { type: 'parts' }, see: X('In the linear polynomial 10t + 20, the coefficient 10 is how fast the water rises, and the constant 20 is where it started. 10 sets how steep the line is; 20 is where it meets the h-axis.') },
      { do: X('What if a bigger tap adds 20 cm a minute?'), target: 'tg',
        act: async (K, o) => { o.tg.showLine('b'); K.lab.emit('faster', { obj: o.tg.id }); label(K, 'h = 20t + 20', o.tg.at('fast'), 0.15, 0, { color: '#ff9a7a', edge: '#ff9a7a', step: true }); await K.sleep(2); },
        ev: { type: 'faster' }, see: X('20t + 20 gives a steeper line from the same starting point: the bigger the coefficient of t, the steeper the line.') },
      { do: X('The tank is full at 150 cm. With the first tap, when will it be full?'), target: 'tg',
        act: async (K, o) => { o.tg.showLine('full'); K.lab.emit('predict', { obj: o.tg.id }); label(K, '10t + 20 = 150  →  t = 13', o.tg.at('full'), 0.13, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'predict' }, see: X('10t + 20 = 150 gives 10t = 130, so t = 13 minutes. The straight line lets us predict it without waiting.') },
    ],
    eq: { word: 'Linear polynomial', sym: 'h = 10t + 20' },
    result: {
      obs: X('The water level went 20, 30, 40 … 120 cm, and the points made a straight line. A faster tap gave a steeper line, and the tank would be full after 13 minutes.'),
      concl: X('A linear polynomial ax + b has a straight-line graph: a tells how steep it is (how fast the quantity changes) and b is its value when x = 0.'),
      safety: X('Turn off a real tap before the tank overflows: water on the floor is slippery.'),
      viva: [{ q: X('In 3x + 5, what is the value when x = 0?'), a: X('5.') },
        { q: X('Which line is steeper, y = 2x + 1 or y = 5x + 1?'), a: X('y = 5x + 1, because 5 is bigger than 2.') },
        { q: X('A candle 20 cm long burns 2 cm an hour. Write its length after t hours.'), a: X('20 − 2t.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 3: √2 and the square-root spiral
  {
    id: 'w9_root_spiral', subj: 'maths', cls: 9, ch: C9n, world: true, place: 'quad', table: false,
    title: X('√2 on the number line, and the square-root spiral'),
    aim: X('To swing the diagonal of a square down onto a number line on the ground with your own hand, find where √2 is, and see rational and irrational numbers in a square-root spiral.'),
    kind: X('Rational and irrational numbers'),
    setup(K) {
      const rs = K.add(MW7.rootSpiral(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.45);
      rs.camView = { p: V3(K, 1.1, 3.4, 1.4), t: V3(K, 1.1, 0, -2.4) };
      const fin = { swing: once(() => { label(K, '√2 = 1.4142…', rs.at('root2'), 0.16, 0, { color: OK, edge: OK, step: true }); K.lab.emit('swing', { obj: rs.id }); }) };
      MW7.bindRootHands(rs, knob, K.app, { swing: 2 }, { swing: () => fin.swing() });
      return { rs, knob, fin };
    },
    steps: [
      { do: X('This number line on the ground has 1 m between whole numbers. On the part from 0 to 1 stands a square with sides of 1 m.'), target: 'rs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The yellow line is the diagonal of the square, starting at 0.') },
      { do: X('How long is the diagonal?'), target: 'rs',
        act: async (K, o) => { K.lab.emit('diag', { obj: o.rs.id }); label(K, '√(1² + 1²) = √2', o.rs.at('diag'), 0.15, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'diag' }, see: X('By Pythagoras, the diagonal is √(1² + 1²) = √2 metres.') },
      { do: X('Swing the diagonal down onto the number line, like a compass, with the handle.'), target: 'rs',
        act: async (K, o) => { const a0 = o.rs.a; await K.tween(2.5, (k) => o.rs.swing(a0 * (1 - ease(k)))); o.rs.swing(0); o.fin.swing(); await K.sleep(1); },
        ev: { type: 'swing' }, see: X('It lands between 1.4 and 1.5, at √2 = 1.4142… Its decimals never end and never repeat: √2 is an irrational number, but it has an exact place on the number line.') },
      { do: X('Now build the square-root spiral: each new triangle has a side of 1 at right angles to the last long side.'), target: 'rs',
        act: async (K, o) => { K.lab.emit('spiral', { obj: o.rs.id }); for (let n = 1; n <= 8; n++) { o.rs.spiralUpTo(n); await K.sleep(0.5); } await K.sleep(1); },
        ev: { type: 'spiral' }, see: X('The long sides are √2, √3, √4 = 2, √5 … √9 = 3. Only the square roots of perfect squares, shown in green, are whole numbers.') },
      { do: X('Which numbers are rational and which are irrational?'), target: 'rs',
        act: async (K, o) => { K.lab.emit('kinds', { obj: o.rs.id }); label(K, tl(K, X('rational')) + ': 2, 1/2, 0.75, 0.333…', o.rs.at('kinds'), 0.2, 0, { color: OK, step: true }); await K.sleep(0.8); label(K, tl(K, X('irrational')) + ': √2, √3, √5, π', o.rs.at('kinds').add(V3(K, 0, -0.32, 0)), 0.2, 0, { color: '#ffd23f', step: true }); await K.sleep(1.4); },
        ev: { type: 'kinds' }, see: X('A rational number can be written as p/q, and its decimals end or repeat. An irrational number cannot; its decimals go on for ever without repeating.') },
    ],
    eq: { word: 'Irrational number', sym: '√2 = 1.41421356…' },
    result: {
      obs: X('The diagonal of a 1 m square, √2 m, landed at 1.4142… on the number line. In the spiral, √4 = 2 and √9 = 3 were whole numbers; the other roots were irrational.'),
      concl: X('Real numbers are rational (p/q, with decimals that end or repeat) or irrational (decimals that never end or repeat). Every real number, like √2, has its own point on the number line.'),
      safety: X('Walk carefully around the ropes and pegs on the ground.'),
      viva: [{ q: X('Is √16 rational or irrational?'), a: X('Rational: √16 = 4.') },
        { q: X('Between which two whole numbers does √5 lie?'), a: X('Between 2 and 3.') },
        { q: X('Is 0.121212… rational?'), a: X('Yes: its decimals repeat, and it equals 12/99 = 4/33.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 5: angles in a big circle
  {
    id: 'w9_circle_angles', subj: 'maths', cls: 9, ch: C9c, world: true, place: 'field', table: false,
    title: X('Angles in a big circle on the ground'),
    aim: X('To move a pole around a big circle with your own hand, measure the angles made by a chord, and find the rules for angles in a circle.'),
    kind: X('Circles: chords and angles'),
    setup(K) {
      const ca = K.add(MW7.circleAngles(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.4);
      ca.camView = { p: V3(K, 0.3, 6.5, 3.0), t: V3(K, 0.3, 0, -2.8) };
      const fin = { move: once(() => { label(K, '90°', ca.at('p'), 0.24, 0, { color: OK, edge: OK, step: true }); K.lab.emit('move', { obj: ca.id }); }) };
      MW7.bindCircleHands(ca, knob, K.app, { move: 1 }, { move: () => fin.move() });
      return { ca, knob, fin };
    },
    steps: [
      { do: X('A big circle is drawn on the ground with centre O. AB is a diameter. The pole P stands on the circle, with ropes to A and B.'), target: 'ca',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ca.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The board shows the angle APB between the two ropes.') },
      { do: X('Move P around the circle with the handle, and watch the angle APB.'), target: 'ca',
        act: async (K, o) => { const t0 = o.ca.thP; await K.tween(3, (k) => o.ca.setP(t0 + (40 - t0) * ease(k))); o.fin.move(); await K.sleep(1); },
        ev: { type: 'move' }, see: X('Wherever P is, the angle APB stays 90°: the angle in a semicircle is a right angle.') },
      { do: X('Now B moves along the circle, so AB is no longer a diameter. Watch the angle at P, and the angle at the centre O.'), target: 'ca',
        act: async (K, o) => { fresh(K); o.ca.showO = true; await K.tween(2.5, (k) => { o.ca.thB = 360 - 80 * ease(k); o.ca.draw(); }); o.ca.thB = 280; o.ca.draw(); K.lab.emit('chord', { obj: o.ca.id });
          await K.tween(2.5, (k) => o.ca.setP(40 + 100 * ease(k))); label(K, '100° = 2 × 50°', o.ca.at('o'), 0.24, 0, { color: OK, edge: OK, step: true }); await K.sleep(1.4); },
        ev: { type: 'chord' }, see: X('As P moves, angle APB stays 50°, and the angle AOB at the centre is 100°. The angle at the centre is twice the angle at the circle.') },
      { do: X('Put a fourth pole Q on the other side of the chord AB.'), target: 'ca',
        act: async (K, o) => { fresh(K); o.ca.thQ = 230; o.ca.draw(); K.lab.emit('cyclic', { obj: o.ca.id }); label(K, '50° + 130° = 180°', o.ca.at('sum'), 0.26, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'cyclic' }, see: X('Angle AQB is 130°. P, A, Q and B lie on one circle, and the opposite angles P and Q add up to 180°.'),
        why: X('Equal arcs make equal angles on the circle, and the angle at the centre is always twice them. In a quadrilateral whose corners lie on a circle, opposite angles add up to 180°.') },
    ],
    eq: { word: 'Angles in a circle', sym: '∠AOB = 2∠APB' },
    result: {
      obs: X('With AB a diameter, the angle at P was always 90°. With a shorter chord, the angle at P stayed 50° while the angle at the centre was 100°, and the angle on the other side was 130°.'),
      concl: X('The angle in a semicircle is a right angle. The angle a chord makes at the centre is twice the angle it makes at any point on the remaining part of the circle. Opposite angles of a cyclic quadrilateral add up to 180°.'),
      safety: X('Look where you walk when you move around the circle.'),
      viva: [{ q: X('What is the angle in a semicircle?'), a: X('90°.') },
        { q: X('A chord makes an angle of 70° at the centre. What angle does it make on the larger part of the circle?'), a: X('35°.') },
        { q: X('One angle of a cyclic quadrilateral is 110°. What is the opposite angle?'), a: X('70°.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 8: a bamboo and a pond weed
  {
    id: 'w9_grow_patterns', subj: 'maths', cls: 9, ch: C9s, world: true, place: 'khet', table: false,
    title: X('A bamboo and a pond weed: predicting what comes next'),
    aim: X('To move on week by week with your own hand, see one plant grow by adding and another by doubling, and predict later terms of both sequences.'),
    kind: X('Arithmetic and geometric progressions'),
    setup(K) {
      const gp = K.add(MW7.growPatterns(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      gp.camView = { p: V3(K, 0.55, 1.5, 2.6), t: V3(K, 0.55, 1.0, -2.4) };
      gp.word = () => tl(K, X('week')); gp.relabel();
      const em = (t) => K.lab.emit(t, { obj: gp.id });
      MW7.bindGrowHands(gp, lever, K.app, { 1: 4, 3: 7 }, { week: (w) => { if (w === 4) em('week4'); if (w === 7) em('week7'); } });
      return { gp, lever };
    },
    steps: [
      { do: X('Week 1: the bamboo is 50 cm tall, and one square of the pond is covered with a water weed.'), target: 'gp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.gp.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Every week the bamboo grows 30 cm, and the weed covers twice as many squares as the week before.') },
      { do: X('Pull the lever towards you to move on, week by week, up to week 4.'), target: 'gp',
        act: async (K, o) => { while (o.gp.week < 4) { o.gp.next(); await K.sleep(0.9); } K.lab.emit('week4', { obj: o.gp.id }); },
        ev: { type: 'week4' }, see: X('The bamboo adds 30 cm each week: 50, 80, 110, 140. That is an arithmetic progression. The weed doubles: 1, 2, 4, 8 squares. That is a geometric progression.') },
      { do: X('Predict week 7 before you see it.'), target: 'gp',
        act: async (K, o) => { K.lab.emit('predict', { obj: o.gp.id }); label(K, '50 + 6 × 30 = 230 cm', o.gp.at('ap'), 0.2, 0, { color: '#ffd23f', step: true }); await K.sleep(0.8); label(K, '1 × 2⁶ = 64', o.gp.at('gp'), 0.2, 0, { color: '#8be07a', step: true }); await K.sleep(1.4); },
        ev: { type: 'predict' }, see: X('The nth term of an AP is a + (n − 1)d, and the nth term of a GP is a × rⁿ⁻¹. So in week 7: 50 + 6 × 30 = 230 cm, and 1 × 2⁶ = 64 squares.') },
      { do: X('Pull the lever three more times to check.'), target: 'gp',
        act: async (K, o) => { while (o.gp.week < 7) { o.gp.next(); await K.sleep(0.9); } K.lab.emit('week7', { obj: o.gp.id }); },
        ev: { type: 'week7' }, see: X('Both predictions were right: the bamboo is 230 cm and the weed covers all 64 squares. In week 6 the pond was only half covered!') },
      { do: X('Which way of growing is faster?'), target: 'gp',
        act: async (K, o) => { K.lab.emit('compare', { obj: o.gp.id }); await K.sleep(2); },
        ev: { type: 'compare' }, see: X('Adding the same amount every time grows steadily. Multiplying by the same number starts slowly, but soon races far ahead.') },
    ],
    eq: { word: 'nth terms', sym: 'a + (n − 1)d,  a × rⁿ⁻¹' },
    result: {
      obs: X('The bamboo grew 50, 80, 110 … 230 cm, and the weed covered 1, 2, 4 … 64 squares. The predictions for week 7 were right.'),
      concl: X('In an arithmetic progression a fixed number is added each time: aₙ = a + (n − 1)d. In a geometric progression each term is multiplied by a fixed number: aₙ = a × rⁿ⁻¹.'),
      safety: X('Never lean over the edge of a pond.'),
      viva: [{ q: X('What is the 10th term of 3, 7, 11, 15 …?'), a: X('3 + 9 × 4 = 39.') },
        { q: X('What is the 6th term of 2, 6, 18, 54 …?'), a: X('2 × 3⁵ = 486.') },
        { q: X('Is 5, 10, 20, 40 an AP or a GP?'), a: X('A GP: each term is twice the one before.') }],
    },
  },
];
