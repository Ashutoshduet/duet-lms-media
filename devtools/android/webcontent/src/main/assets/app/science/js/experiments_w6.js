// DUET Maths Lab 360, real places 6 (Class 10): zeros on a giant graph (polynomials), two ropes on a grid (pair of linear
// equations), a ball thrown up (quadratic equations), points on the playground (coordinate geometry), and a plank that
// balances at the mean (statistics).
import { DICT } from './exp_i18n.js';
import { DICT_W6 } from './exp_i18n_w6.js';
import * as MW from './mathworld.js';
import * as MW6 from './mathworld6.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W6);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C10y = N('Ch 2 · Polynomials', 'अध्याय 2 · बहुपद', 'Ch 2 · Polynomials');
const C10e = N('Ch 3 · Pair of Linear Equations in Two Variables', 'अध्याय 3 · दो चर वाले रैखिक समीकरणों का युग्म', 'Ch 3 · Do variable wale linear equations ka pair');
const C10q = N('Ch 4 · Quadratic Equations', 'अध्याय 4 · द्विघात समीकरण', 'Ch 4 · Quadratic equations');
const C10g = N('Ch 7 · Coordinate Geometry', 'अध्याय 7 · निर्देशांक ज्यामिति', 'Ch 7 · Coordinate geometry');
const C10s = N('Ch 13 · Statistics', 'अध्याय 13 · सांख्यिकी', 'Ch 13 · Statistics');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const lines = async (K, list, at, h, gap) => { for (let i = 0; i < list.length; i++) { const [t, c] = Array.isArray(list[i]) ? list[i] : [list[i], '#ffffff']; label(K, t, at.clone().add(V3(K, 0, -i * gap, 0)), h, 0, { color: c, edge: c === OK ? OK : undefined, step: true }); await K.sleep(0.8); } };

export const EXPERIMENTS_W6 = [
  // ---------------------------------------------------------------- Ch 2: zeros on a giant graph
  {
    id: 'w10_poly_graph', subj: 'maths', cls: 10, ch: C10y, world: true, place: 'field', table: false,
    title: X('Zeros of a polynomial on a giant graph'),
    aim: X('To slide a marker along the x-axis of a giant graph with your own hand, find where the polynomial is zero, and link the zeros to its coefficients.'),
    kind: X('Zeros of a polynomial'),
    setup(K) {
      const pg = K.add(MW6.polyGraph(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.45);
      pg.camView = { p: V3(K, 0.3, 1.8, 2.4), t: V3(K, 0.2, 1.75, -3) };
      const fin = { 1: once((x) => { label(K, `x = ${x}`, pg.zeroAt(x), 0.18, 0, { color: OK, edge: OK, step: true }); K.lab.emit('zero1', { obj: pg.id }); }), 2: once((x) => { label(K, `x = ${x}`, pg.zeroAt(x), 0.18, 0, { color: OK, edge: OK, step: true }); K.lab.emit('zero2', { obj: pg.id }); }) };
      MW6.bindPolyHands(pg, knob, K.app, { z1: 1, z2: 2 }, { zero: (n, x) => fin[n](x) });
      return { pg, knob, fin };
    },
    steps: [
      { do: X('This big board shows the graph of p(x) = x² − 2x − 3. A zero of p(x) is a value of x for which p(x) = 0: there the curve meets the x-axis.'), target: 'pg',
        act: async (K, o) => { K.lab.emit('look', { obj: o.pg.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The pole shows p(x): green above the x-axis and red below it.') },
      { do: X('Slide the marker along the x-axis to a point where p(x) = 0.'), target: 'pg',
        act: async (K, o) => { const x0 = o.pg.x; await K.tween(2, (k) => o.pg.setX(x0 + (3 - x0) * ease(k))); o.pg.setX(3); o.pg.found.add(3); o.fin[1](3); await K.sleep(1); },
        ev: { type: 'zero1' }, see: X('Here p(x) = 0: this value of x is a zero of p(x).') },
      { do: X('Now find the other zero.'), target: 'pg',
        act: async (K, o) => { const x0 = o.pg.x, z = o.pg.found.has(3) ? -1 : 3; await K.tween(2.5, (k) => o.pg.setX(x0 + (z - x0) * ease(k))); o.pg.setX(z); o.pg.found.add(z); o.fin[2](z); await K.sleep(1); },
        ev: { type: 'zero2' }, see: X('The zeros are −1 and 3: the graph crosses the x-axis at x = −1 and at x = 3.') },
      { do: X('Compare the zeros with the coefficients a = 1, b = −2 and c = −3.'), target: 'pg',
        act: async (K, o) => { K.lab.emit('coeff', { obj: o.pg.id }); await lines(K, ['α + β = −1 + 3 = 2 = −b/a', ['αβ = (−1) × 3 = −3 = c/a', OK]], o.pg.at('eq1'), 0.2, 0.32); await K.sleep(1); },
        ev: { type: 'coeff' }, see: X('The sum of the zeros is −b/a = 2, and their product is c/a = −3.') },
      { do: X('How many zeros can a quadratic polynomial have?'), target: 'pg',
        act: async (K, o) => { fresh(K); K.lab.emit('count', { obj: o.pg.id }); await K.tween(2, (k) => o.pg.setC(-3 + 4 * ease(k))); o.pg.setC(1); o.pg.setX(1); label(K, 'x² − 2x + 1: 1', o.pg.at('eq1'), 0.2, 0, { step: true }); await K.sleep(1.5);
          await K.tween(1.5, (k) => o.pg.setC(1 + ease(k))); o.pg.setC(2); label(K, 'x² − 2x + 2: 0', o.pg.at('eq2'), 0.2, 0, { step: true }); await K.sleep(1.5); },
        ev: { type: 'count' }, see: X('At most two. The curve can cut the x-axis twice, touch it once, or not meet it at all.') },
    ],
    eq: { word: 'Zeros and coefficients', sym: 'α + β = −b/a, αβ = c/a' },
    result: {
      obs: X('p(x) = x² − 2x − 3 was zero at x = −1 and x = 3, where the curve met the x-axis. Their sum was 2 and their product −3.'),
      concl: X('The zeros of p(x) are the x-coordinates of the points where its graph meets the x-axis. A quadratic polynomial has at most two zeros, with α + β = −b/a and αβ = c/a.'),
      safety: X('Do not climb on a graph board: it is held up by only two posts.'),
      viva: [{ q: X('Find the zeros of x² − 5x + 6.'), a: X('2 and 3.') },
        { q: X('How many zeros does a polynomial have if its graph does not meet the x-axis?'), a: X('None: it has no real zeros.') },
        { q: X('Find the sum and the product of the zeros of 2x² − 8x + 6.'), a: X('Sum = 8/2 = 4, product = 6/2 = 3.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 3: two ropes on the ground
  {
    id: 'w10_two_lines', subj: 'maths', cls: 10, ch: C10e, world: true, place: 'field', table: false,
    title: X('Two ropes on the ground: a pair of linear equations'),
    aim: X('To walk a pole along one line on the playground grid with your own hand, find where it meets a second line, and see when two lines have one, no or many common points.'),
    kind: X('Pair of linear equations'),
    setup(K) {
      const tl = K.add(MW6.twoLines(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.4);
      tl.camView = { p: V3(K, -0.4, 4.6, 2.8), t: V3(K, 0.6, 0, -1.4) };
      const fin = { meet: once(() => { label(K, '(3, 2)', tl.at('cross'), 0.2, 0, { color: OK, edge: OK, step: true }); K.lab.emit('meet', { obj: tl.id }); }) };
      MW6.bindLinesHands(tl, knob, K.app, { meet: 1 }, { meet: () => fin.meet() });
      return { tl, knob, fin };
    },
    steps: [
      { do: X('On the playground grid, the red rope is the line x + y = 5 and the blue rope is the line x − y = 1.'), target: 'tl',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tl.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Every point on the red rope has x + y = 5, and every point on the blue rope has x − y = 1.') },
      { do: X('Slide the pole along the red rope until it also stands on the blue rope.'), target: 'tl',
        act: async (K, o) => { const s0 = o.tl.s; await K.tween(2.5, (k) => o.tl.setS(s0 + (3 - s0) * ease(k))); o.tl.setS(3); o.fin.meet(); await K.sleep(1); },
        ev: { type: 'meet' }, see: X('At (3, 2), both x + y = 5 and x − y = 1 are true: x = 3, y = 2 is the solution of the pair.') },
      { do: X('Check it with algebra.'), target: 'tl',
        act: async (K, o) => { K.lab.emit('algebra', { obj: o.tl.id }); await lines(K, ['(x + y) + (x − y) = 5 + 1', '2x = 6, x = 3', ['y = 5 − 3 = 2', OK]], o.tl.at('top'), 0.2, 0.3); await K.sleep(1); },
        ev: { type: 'algebra' }, see: X('Adding the two equations gives 2x = 6, so x = 3 and y = 2: the same point where the ropes cross.') },
      { do: X('Now the blue rope becomes the line x + y = 2.'), target: 'tl',
        act: async (K, o) => { fresh(K); const [a0, b0] = [o.tl.ends.cross[0].clone(), o.tl.ends.cross[1].clone()], [a1, b1] = o.tl.ends.par; await K.tween(2.5, (k) => o.tl.blueTo(a0.clone().lerp(a1, ease(k)), b0.clone().lerp(b1, ease(k)))); o.tl.setBlueText('x + y = 2');
          K.lab.emit('parallel', { obj: o.tl.id }); label(K, X('No common point: no solution')[K.app.lang] || 'No common point: no solution', o.tl.at('par'), 0.18, 0, { color: '#ff8a7a', step: true }); await K.sleep(1.5); },
        ev: { type: 'parallel' }, see: X('The two ropes are parallel and never meet: x + y = 5 and x + y = 2 have no solution.') },
      { do: X('Now the blue rope becomes the line 2x + 2y = 10.'), target: 'tl',
        act: async (K, o) => { fresh(K); const [a0, b0] = o.tl.ends.par, [a1, b1] = o.tl.ends.same; await K.tween(2.5, (k) => o.tl.blueTo(a0.clone().lerp(a1, ease(k)).setY(0.045), b0.clone().lerp(b1, ease(k)).setY(0.045))); o.tl.setBlueText('2x + 2y = 10');
          K.lab.emit('same', { obj: o.tl.id }); label(K, X('The same line: infinitely many solutions')[K.app.lang] || 'The same line: infinitely many solutions', o.tl.at('cross'), 0.18, 0, { color: OK, step: true }); await K.sleep(1.5); },
        ev: { type: 'same' }, see: X('It lies right on the red rope: every point of one is on the other, so there are infinitely many solutions.') },
    ],
    eq: { word: 'Pair of linear equations', sym: 'x + y = 5, x − y = 1 → (3, 2)' },
    result: {
      obs: X('The ropes x + y = 5 and x − y = 1 met at (3, 2). Parallel ropes never met, and two ropes along the same line met everywhere.'),
      concl: X('A pair of linear equations has one solution when the lines cross, no solution when they are parallel, and infinitely many solutions when they are the same line.'),
      safety: X('Do not trip over ropes on the ground.'),
      viva: [{ q: X('Solve x + y = 7 and x − y = 3.'), a: X('x = 5, y = 2.') },
        { q: X('What do the lines look like when a pair of equations has no solution?'), a: X('They are parallel.') },
        { q: X('Do 2x + 4y = 8 and x + 2y = 4 have exactly one solution?'), a: X('No: they are the same line, so they have infinitely many solutions.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 4: a ball thrown up
  {
    id: 'w10_ball_throw', subj: 'maths', cls: 10, ch: C10q, world: true, place: 'field', table: false,
    title: X('A ball thrown up: quadratic equations'),
    aim: X('To throw a ball with your own hand, trace its path, and use quadratic equations to find when it lands, when it is 1.75 m high, and whether it ever reaches 2 m.'),
    kind: X('Quadratic equations'),
    setup(K) {
      const bt = K.add(MW6.ballThrow(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      bt.camView = { p: V3(K, 0.1, 1.5, 1.6), t: V3(K, 0.05, 1.2, -1.7) };
      bt.onLand = once(() => { label(K, 't = 1 s', bt.at('land'), 0.14, 0, { color: OK, edge: OK, step: true }); K.lab.emit('throw', { obj: bt.id }); });
      MW6.bindThrowHands(bt, lever, K.app, { th: 1 });
      return { bt, lever };
    },
    steps: [
      { do: X('This ball will leave your hand 1 m above the ground. After t seconds its height is h = 1 + 4t − 5t² metres.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bt.id }); label(K, 'h = 1 + 4t − 5t²', o.bt.at('start'), 0.14, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The height has a t² term, so questions about it lead to quadratic equations.') },
      { do: X('Pull the lever towards you to throw the ball, and watch where it lands.'), target: 'bt',
        act: async (K, o) => { fresh(K); o.bt.throw(); o.bt.thrown = true; while (o.bt.flying) await K.sleep(0.1); o.bt.onLand(); await K.sleep(1); },
        ev: { type: 'throw' }, see: X('It goes up, slows down, falls back and lands after exactly 1 second.') },
      { do: X('When does it land? Solve h = 0.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('land', { obj: o.bt.id }); o.bt.trace(); await lines(K, ['5t² − 4t − 1 = 0', 't = (4 ± √(16 + 20)) ÷ 10', ['t = 1 s  (t = −0.2 s ✗)', OK]], o.bt.at('eq1'), 0.15, 0.25); await K.sleep(1); },
        ev: { type: 'land' }, see: X('By the quadratic formula, t = (4 ± 6) ÷ 10, so t = 1 or t = −0.2. A time before the throw makes no sense here, so the ball lands after 1 second.') },
      { do: X('When is the ball 1.75 m high?'), target: 'bt',
        act: async (K, o) => { fresh(K); o.bt.showLine('a'); K.lab.emit('twice', { obj: o.bt.id }); await lines(K, ['5t² − 4t + 0.75 = 0', 'b² − 4ac = 16 − 15 = 1 > 0', ['t = 0.3 s, t = 0.5 s', OK]], o.bt.at('eq1'), 0.15, 0.25); await K.sleep(1); },
        ev: { type: 'twice' }, see: X('Twice: at 0.3 s going up and at 0.5 s coming down. The discriminant b² − 4ac is positive, so there are two real roots.') },
      { do: X('Does the ball ever reach 2 m?'), target: 'bt',
        act: async (K, o) => { fresh(K); o.bt.showLine('b'); K.lab.emit('never', { obj: o.bt.id }); await lines(K, ['5t² − 4t + 1 = 0', ['b² − 4ac = 16 − 20 = −4 < 0', '#ff8a7a'], 'h(0.4) = 1.8 m'], o.bt.at('eq1'), 0.15, 0.25); await K.sleep(1); },
        ev: { type: 'never' }, see: X('No. For h = 2 the discriminant is negative, so there is no real root. The highest the ball goes is 1.8 m, at 0.4 s.') },
    ],
    eq: { word: 'Quadratic formula', sym: 'x = (−b ± √(b² − 4ac)) / 2a' },
    result: {
      obs: X('The ball landed after 1 s. It was 1.75 m high twice, at 0.3 s and 0.5 s, and it never reached 2 m: its highest point was 1.8 m.'),
      concl: X('The roots of ax² + bx + c = 0 are x = (−b ± √(b² − 4ac)) / 2a. If b² − 4ac is positive there are two real roots, if it is 0 there are two equal roots, and if it is negative there are no real roots.'),
      safety: X('Throw a ball only where nobody is standing in front of you.'),
      viva: [{ q: X('Solve x² − 5x + 6 = 0.'), a: X('x = 2 or x = 3.') },
        { q: X('What is the discriminant of 2x² + 3x + 5, and what does it tell you?'), a: X('9 − 40 = −31: it is negative, so there are no real roots.') },
        { q: X('For which positive value of k does x² + kx + 9 = 0 have equal roots?'), a: X('k² − 36 = 0, so k = 6.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 7: distance and section formulas
  {
    id: 'w10_distance', subj: 'maths', cls: 10, ch: C10g, world: true, place: 'field', table: false,
    title: X('Distance and section formulas on the playground'),
    aim: X('To move points on a grid on the playground with your own hand, find the distance between them with the distance formula, and find the point that divides a line in a given ratio.'),
    kind: X('Coordinate geometry'),
    setup(K) {
      const gp = K.add(MW6.gridPoints(), 0, 0, { y: 0 }), kB = K.add(MW.pullTab(), 0, -0.3), kP = K.add(MW.pullTab(), 0, -0.45);
      gp.camView = { p: V3(K, -0.6, 5.2, 2.6), t: V3(K, 0.3, 0, -1.6) };
      const fin = { b: once(() => K.lab.emit('b', { obj: gp.id })), mid: once(() => { label(K, '(4, 6)', gp.at('mid'), 0.18, 0, { color: OK, edge: OK, step: true }); K.lab.emit('mid', { obj: gp.id }); }) };
      MW6.bindPointHands(gp, kB, kP, K.app, { b: 1, mid: 3 }, { b: () => fin.b(), mid: () => fin.mid() });
      return { gp, kB, kP, fin };
    },
    steps: [
      { do: X('On the playground grid, A is at (1, 2) and B is at (7, 2). They are 6 units apart along the x-axis.'), target: 'gp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.gp.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('When two points are on the same horizontal line, their distance is just the difference of their x-coordinates.') },
      { do: X('Slide B straight up the grid to (7, 10).'), target: 'gp',
        act: async (K, o) => { const y0 = o.gp.by; await K.tween(2.5, (k) => o.gp.setB(y0 + (10 - y0) * ease(k))); o.gp.setB(10); o.fin.b(); await K.sleep(1); },
        ev: { type: 'b' }, see: X('Now AB is slanted. It is the longest side of a right triangle whose other sides are 6 and 8 units.') },
      { do: X('Find AB with the distance formula.'), target: 'gp',
        act: async (K, o) => { o.gp.legs(true); K.lab.emit('formula', { obj: o.gp.id }); label(K, '6', o.gp.at('leg1'), 0.16, 0, { color: '#ffd23f', step: true }); label(K, '8', o.gp.at('leg2'), 0.16, 0, { color: '#5ec8ff', step: true }); await K.sleep(0.8);
          label(K, 'AB = √((7 − 1)² + (10 − 2)²) = √(36 + 64) = 10', o.gp.at('ab'), 0.17, 0, { color: OK, edge: OK, step: true }); await K.sleep(1.6); },
        ev: { type: 'formula' }, see: X('AB = √((x₂ − x₁)² + (y₂ − y₁)²) = √(36 + 64) = 10 units. The distance formula is Pythagoras on the grid.') },
      { do: X('Slide point P along AB until it is exactly in the middle.'), target: 'gp',
        act: async (K, o) => { fresh(K); o.gp.setP(0.1); await K.tween(2, (k) => o.gp.setP(0.1 + 0.4 * ease(k))); o.gp.setP(0.5); o.fin.mid(); await K.sleep(1); },
        ev: { type: 'mid' }, see: X('The mid-point is P(4, 6) = ((1 + 7)/2, (2 + 10)/2).') },
      { do: X('Where is the point that divides AB in the ratio 1 : 3?'), target: 'gp',
        act: async (K, o) => { fresh(K); await K.tween(1.5, (k) => o.gp.setP(0.5 - 0.25 * ease(k))); o.gp.setP(0.25); K.lab.emit('section', { obj: o.gp.id });
          label(K, 'P = ((1 × 7 + 3 × 1)/4, (1 × 10 + 3 × 2)/4) = (2.5, 4)', o.gp.at('q'), 0.16, 0, { color: OK, edge: OK, step: true }); await K.sleep(1.6); },
        ev: { type: 'section' }, see: X('By the section formula, the point dividing AB in the ratio 1 : 3 is ((1 × 7 + 3 × 1)/4, (1 × 10 + 3 × 2)/4) = (2.5, 4).') },
    ],
    eq: { word: 'Distance formula', sym: 'AB = √((x₂ − x₁)² + (y₂ − y₁)²)' },
    result: {
      obs: X('With A(1, 2) and B(7, 10), AB was 10 units, the mid-point was (4, 6), and the point dividing AB in the ratio 1 : 3 was (2.5, 4).'),
      concl: X('Distance formula: AB = √((x₂ − x₁)² + (y₂ − y₁)²). Section formula: the point dividing AB in the ratio m : n is ((mx₂ + nx₁)/(m + n), (my₂ + ny₁)/(m + n)).'),
      safety: X('Look where you walk on the playground.'),
      viva: [{ q: X('Find the distance between (0, 0) and (3, 4).'), a: X('5.') },
        { q: X('Find the mid-point of (2, 3) and (8, 7).'), a: X('(5, 5).') },
        { q: X('How far is the point (−6, 8) from the origin?'), a: X('10.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 13: the mean is a balance point
  {
    id: 'w10_mean_balance', subj: 'maths', cls: 10, ch: C10s, world: true, place: 'room', table: true,
    title: X('The mean is a balance point'),
    aim: X('To slide the support under a plank of marks with your own hand until it balances, and find the mean, the median and the mode of the marks.'),
    kind: X('Mean, median and mode'),
    setup(K) {
      const mp = K.add(MW6.meanPlank(), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.5);
      mp.camView = { p: V3(K, 0.02, 0.42, 0.62), t: V3(K, 0.02, 0.07, 0) };
      const fin = { bal: once(() => K.lab.emit('bal', { obj: mp.id })) };
      MW6.bindPlankHands(mp, knob, K.app, { bal: 1 }, { bal: () => fin.bal() });
      return { mp, knob, fin };
    },
    steps: [
      { do: X('Seven students scored 1, 3, 3, 5, 8, 9 and 13 marks in a quiz. Each red block stands at one student’s marks on the plank.'), target: 'mp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mp.id }); label(K, '1, 3, 3, 5, 8, 9, 13', o.mp.at('data'), 0.04, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('With the support where it is now, the plank tips over to one side.') },
      { do: X('Slide the support under the plank until the plank is level.'), target: 'mp',
        act: async (K, o) => { const f0 = o.mp.f; await K.tween(3, (k) => o.mp.setF(f0 + (6 - f0) * ease(k))); o.mp.setF(6); o.fin.bal(); await K.sleep(1.5); },
        ev: { type: 'bal' }, see: X('The plank balances when the support is at 6.') },
      { do: X('Work out the mean.'), target: 'mp',
        act: async (K, o) => { fresh(K); K.lab.emit('mean', { obj: o.mp.id }); label(K, '(1 + 3 + 3 + 5 + 8 + 9 + 13) ÷ 7 = 42 ÷ 7 = 6', o.mp.at('mean'), 0.04, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'mean' }, see: X('The mean is 42 ÷ 7 = 6: exactly where the plank balances. The mean is the balance point of the data.') },
      { do: X('Find the median.'), target: 'mp',
        act: async (K, o) => { fresh(K); o.mp.mark([3], 0xf2c230); K.lab.emit('median', { obj: o.mp.id }); label(K, X('median')[K.app.lang] + ' = 5', o.mp.blockAt(3), 0.035, 0, { color: '#f2c230', step: true }); await K.sleep(2); },
        ev: { type: 'median' }, see: X('With the marks in order, the middle one, the 4th of 7, is 5: that is the median.') },
      { do: X('Find the mode.'), target: 'mp',
        act: async (K, o) => { fresh(K); o.mp.mark([1, 2], 0x3d7be0); K.lab.emit('mode', { obj: o.mp.id }); label(K, X('mode')[K.app.lang] + ' = 3', o.mp.blockAt(2).add(V3(K, 0, 0.04, 0)), 0.035, 0, { color: '#7ad0ff', step: true }); await K.sleep(2); },
        ev: { type: 'mode' }, see: X('The mark that comes most often is 3: that is the mode.'),
        why: X('Mean, median and mode are three kinds of average. Here they are 6, 5 and 3: each tells us something different about the marks.') },
    ],
    eq: { word: 'Mean', sym: 'x̄ = Σx ÷ n' },
    result: {
      obs: X('The plank balanced at 6, the mean. The median was 5 and the mode was 3.'),
      concl: X('The mean is the sum of the values divided by how many there are, and it is their balance point. The median is the middle value when they are in order, and the mode is the value that comes most often.'),
      safety: X('Keep your fingers out from under a tipping plank.'),
      viva: [{ q: X('Find the mean of 2, 4, 6, 8 and 10.'), a: X('30 ÷ 5 = 6.') },
        { q: X('Find the median of 7, 1, 5, 3 and 9.'), a: X('In order they are 1, 3, 5, 7, 9, so the median is 5.') },
        { q: X('If the 13 marks became 20, which would change: the mean or the median?'), a: X('The mean, which becomes 7. The median stays 5.') }],
    },
  },
];
