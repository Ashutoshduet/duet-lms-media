// DUET Maths Lab 360, real places 4: hands-on in 3D. The student changes the angle of a 5 m ladder against a wall and
// stands inside its triangle (trigonometry, Class 10), turns an arm around themselves to make right, straight and full
// angles (Class 6), and adds layers of tiles that show odd numbers adding up to squares (Class 6).
import { DICT } from './exp_i18n.js';
import { DICT_W4 } from './exp_i18n_w4.js';
import * as MW from './mathworld.js';
import * as MW4 from './mathworld4.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W4);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C10i = N('Ch 8 · Introduction to Trigonometry', 'अध्याय 8 · त्रिकोणमिति का परिचय', 'Ch 8 · Trigonometry ka parichay');
const C6l = N('Ch 2 · Lines and Angles', 'अध्याय 2 · रेखाएँ और कोण', 'Ch 2 · Lines aur angles');
const C6p = N('Ch 1 · Patterns in Mathematics', 'अध्याय 1 · गणित में पैटर्न', 'Ch 1 · Maths mein patterns');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const aim = (K, it, p, t) => { it.camView = { p: p.clone().sub(it.g.position), t: t.clone().sub(it.g.position) }; if (!K.app.userCam) K.app.focusBench(); };
const KINDS = { acute: X('acute angle'), right: X('right angle'), obtuse: X('obtuse angle'), straight: X('straight angle'), reflex: X('reflex angle'), full: X('full turn') };

export const EXPERIMENTS_W4 = [
  // ---------------------------------------------------------------- Class 10: trigonometry with a ladder
  {
    id: 'w10_ladder_trig', subj: 'maths', cls: 10, ch: C10i, world: true, place: 'quad', table: false, shadowBox: 5,
    title: X('Trigonometry with a ladder against a wall'),
    aim: X('To change the angle of a 5 m ladder against a wall with your own hand, see how its height and its distance from the wall change, find sin, cos and tan, and then stand inside the triangle.'),
    kind: X('Trigonometric ratios'),
    setup(K) {
      const lw = K.add(MW4.ladderWall(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.4);
      lw.camView = { p: V3(K, 0.9, 1.7, 2.6), t: V3(K, 0.7, 1.7, -3.2) };
      const em = (t) => K.lab.emit(t, { obj: lw.id });
      const R = (i) => V3(K, 2.85, 2.4 - i * 0.32, -2.8);
      const fin = {
        s30: once(() => { fresh(K); label(K, 'h = 2.5 m', lw.at('wall'), 0.2, 0, { color: '#5ec8ff', step: true }); label(K, 'sin 30° = 2.5/5 = 1/2', R(0), 0.22, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('set30'); }),
        s60: once(() => { fresh(K); label(K, 'b = 2.5 m', lw.at('ground'), 0.2, 0, { color: '#ffd23f', step: true }); label(K, 'cos 60° = 2.5/5 = 1/2', R(0), 0.22, 0, { color: '#8be07a', edge: '#8be07a', step: true }); label(K, 'sin 60° = 4.33/5 ≈ 0.87', R(1), 0.2, 0, { color: '#ffffff', step: true }); em('set60'); }),
      };
      MW4.bindLadderHands(lw, lever, K.app, { s30: 2, s60: 3 }, { set: (T) => (T === 30 ? fin.s30() : fin.s60()) });
      return { lw, lever, fin, R };
    },
    steps: [
      { do: X('A 5 m ladder leans against a wall. Its foot is 4 m from the wall and its top is 3 m up the wall. The angle between the ladder and the ground is θ.'), target: 'lw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lw.id }); for (const [t, k, c] of [['5 m', 'mid', '#ff9a7a'], ['3 m', 'wall', '#5ec8ff'], ['4 m', 'ground', '#ffd23f'], ['θ', 'foot', '#ff9a7a']]) { label(K, t, o.lw.at(k), 0.22, 0, { color: c, step: true }); await K.sleep(0.5); } await K.sleep(1); },
        ev: { type: 'look' }, see: X('The ladder, the wall and the ground make a right triangle. The ladder is its longest side, the hypotenuse.') },
      { do: X('Compare each side with the ladder.'), target: 'lw',
        act: async (K, o) => { K.lab.emit('ratios', { obj: o.lw.id }); for (const [i, t] of [[0, 'sin θ = 3/5 = 0.6'], [1, 'cos θ = 4/5 = 0.8'], [2, 'tan θ = 3/4 = 0.75']]) { label(K, t, o.R(i), 0.2, 0, { color: '#8be07a', step: true }); await K.sleep(0.8); } await K.sleep(1); },
        ev: { type: 'ratios' }, see: X('sin θ = opposite side ÷ hypotenuse = 3/5 = 0.6. cos θ = adjacent side ÷ hypotenuse = 4/5 = 0.8. tan θ = opposite side ÷ adjacent side = 3/4 = 0.75.'),
        why: X('For the same angle these ratios are always the same, however long the ladder is. That is why they belong to the angle.') },
      { do: X('Slide the lever to lower the ladder until θ = 30°.'), target: 'lw',
        act: async (K, o) => { fresh(K); const a = o.lw.theta; await K.tween(2.5, (k) => o.lw.set(a + (30 - a) * ease(k))); o.lw.set(30); o.fin.s30(); await K.sleep(1); },
        ev: { type: 'set30' }, see: X('At 30° the top is 2.5 m up the wall, exactly half the ladder: sin 30° = 2.5/5 = 1/2.') },
      { do: X('Now raise the ladder until θ = 60°.'), target: 'lw',
        act: async (K, o) => { const a = o.lw.theta; await K.tween(2.5, (k) => o.lw.set(a + (60 - a) * ease(k))); o.lw.set(60); o.fin.s60(); await K.sleep(1); },
        ev: { type: 'set60' }, see: X('At 60° the foot is 2.5 m from the wall: cos 60° = 2.5/5 = 1/2. The top is about 4.33 m up: sin 60° ≈ 0.87.'),
        why: X('As the ladder stands up, θ grows, sin θ grows and cos θ gets smaller.') },
      { do: X('Set the ladder at 45° and step inside the triangle.'), target: 'lw',
        act: async (K, o) => { fresh(K); const lw = o.lw, a = lw.theta, z0 = lw.Z; o.lever.g.visible = false;
          await K.tween(3.2, (k) => { const e = ease(k); lw.Z = z0 * (1 - e); lw.set(a + (45 - a) * e); }); lw.Z = 0; lw.set(45);
          aim(K, lw, V3(K, 1.2, 1.6, 4.2), V3(K, 0.4, 1.7, 0)); K.lab.emit('inside', { obj: lw.id });
          label(K, 'h = b ≈ 3.54 m', V3(K, 0.3, 2.9, -0.6), 0.16, 0, { color: '#ffffff', step: true }); await K.sleep(0.6);
          label(K, 'tan 45° = h/b = 1', V3(K, 0.3, 2.6, -0.6), 0.18, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.4); },
        ev: { type: 'inside' }, see: X('At 45° the height and the distance from the wall are equal, about 3.54 m each: tan 45° = 1. You are standing inside the right triangle, under the ladder.') },
    ],
    eq: { word: 'Trigonometric ratios', sym: 'sin θ = h/5, cos θ = b/5, tan θ = h/b' },
    result: {
      obs: X('At 36.9° the sides were 3 m and 4 m: sin θ = 0.6 and cos θ = 0.8. At 30° the top was 2.5 m up; at 60° the foot was 2.5 m away; at 45° the height and the distance were equal.'),
      concl: X('In a right triangle, sin θ = opposite side ÷ hypotenuse, cos θ = adjacent side ÷ hypotenuse and tan θ = opposite side ÷ adjacent side. sin 30° = cos 60° = 1/2 and tan 45° = 1.'),
      safety: X('A real ladder must stand firmly, and someone should hold it while you climb.'),
      viva: [{ q: X('A 10 m ladder makes 30° with the ground. How high up the wall does it reach?'), a: X('10 × sin 30° = 10 × 1/2 = 5 m.') },
        { q: X('What is tan 45°?'), a: X('1, because the height and the distance from the wall are equal.') },
        { q: X('As θ grows, what happens to cos θ?'), a: X('It gets smaller.') }],
    },
  },
  // ---------------------------------------------------------------- Class 6: angles you turn yourself
  {
    id: 'w6_angle_turn', subj: 'maths', cls: 6, ch: C6l, world: true, place: 'field', table: false,
    title: X('Make angles by turning around yourself'),
    aim: X('To stand at the corner of an angle on the playground, turn its arm with your own hand, and feel a right angle, a straight angle and a full turn.'),
    kind: X('Angles and turns'),
    setup(K) {
      const names = {}; for (const k in KINDS) names[k] = tl(K, KINDS[k]);
      const at = K.add(MW4.angleTurn({ names }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.5);
      at.camView = { p: V3(K, 2.4, 3.9, 3.4), t: V3(K, 0, 0, -0.5) };
      const em = (t) => K.lab.emit(t, { obj: at.id });
      const fin = { 90: once(() => em('right')), 180: once(() => em('straight')), 360: once(() => em('full')) };
      MW4.bindAngleHands(at, knob, K.app, { 1: 90, 2: 180, 3: 360 }, { reach: (G) => fin[G]() });
      return { at, knob, fin };
    },
    steps: [
      { do: X('You are standing at the corner of an angle. The yellow arm points straight ahead. The red arm turns with your hand.'), target: 'at',
        act: async (K, o) => { K.lab.emit('look', { obj: o.at.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The two arms start together: the angle between them is 0°.') },
      { do: X('Hold the glowing knob and turn the red arm a quarter turn to your right.'), target: 'at',
        act: async (K, o) => { await K.tween(2.5, (k) => o.at.set(90 * ease(k))); o.at.set(90); o.fin[90](); await K.sleep(1); },
        ev: { type: 'right' }, see: X('A quarter turn makes a right angle, 90°. The two arms are perpendicular.') },
      { do: X('Keep turning until the red arm points straight behind you.'), target: 'at',
        act: async (K, o) => { await K.tween(2.5, (k) => o.at.set(90 + 90 * ease(k))); o.at.set(180); o.fin[180](); await K.sleep(1); },
        ev: { type: 'straight' }, see: X('Half a turn makes a straight angle, 180°. The two arms make one straight line.') },
      { do: X('Keep turning, all the way round to the front again.'), target: 'at',
        act: async (K, o) => { await K.tween(4, (k) => o.at.set(180 + 180 * ease(k))); o.at.set(360); o.fin[360](); await K.sleep(1); },
        ev: { type: 'full' }, see: X('A full turn is 360°. The red arm is back on the yellow arm.'),
        why: X('One full turn is divided into 360 equal parts, called degrees.') },
      { do: X('Now look at some other turns.'), target: 'at',
        act: async (K, o) => { K.lab.emit('kinds', { obj: o.at.id }); let a0 = 0; for (const a of [45, 135, 270]) { const s = a0; await K.tween(2, (k) => o.at.set(s + (a - s) * ease(k))); a0 = a; await K.sleep(1.6); } },
        ev: { type: 'kinds' }, see: X('Less than 90° is an acute angle, between 90° and 180° an obtuse angle, and between 180° and 360° a reflex angle.') },
    ],
    eq: { word: 'Angles', sym: '90°, 180°, 360°' },
    result: {
      obs: X('A quarter turn made 90°, half a turn made 180° and a full turn made 360°.'),
      concl: X('An angle is the amount of turn between two arms that start from the same corner. A right angle is 90°, a straight angle is 180° and a full turn is 360°.'),
      safety: X('Turn slowly, and look around you before you swing your arm.'),
      viva: [{ q: X('How many right angles make a full turn?'), a: X('4.') },
        { q: X('Is 120° an acute angle or an obtuse angle?'), a: X('Obtuse, because it is between 90° and 180°.') },
        { q: X('What angle do the hands of a clock make at 3 o’clock?'), a: X('90°, a right angle.') }],
    },
  },
  // ---------------------------------------------------------------- Class 6: odd numbers make squares
  {
    id: 'w6_odd_squares', subj: 'maths', cls: 6, ch: C6p, world: true, place: 'quad', table: false,
    title: X('Odd numbers make squares'),
    aim: X('To add L-shaped layers of tiles around a square with your own hand, and see that adding odd numbers always makes a square number.'),
    kind: X('Number patterns'),
    setup(K) {
      const sq = K.add(MW4.oddSquares(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      sq.camView = { p: V3(K, -1.0, 2.7, 1.5), t: V3(K, 1.1, 0, -1.4) };
      const sum = MW4.liveSign(0.26, 4.6); sum.position.set(2.15, 1.0, -1.3); K.app.scene.add(sum); K.extras.push(sum); sum.set(['1 = 1 × 1'], '#ffffff');
      const em = (t) => K.lab.emit(t, { obj: sq.id });
      const showSum = (n) => { const odd = []; for (let i = 1; i <= n; i++) odd.push(2 * i - 1); sum.set([`${odd.join(' + ')} = ${n * n} = ${n} × ${n}`], n >= 4 ? '#8be07a' : '#ffffff'); };
      const onLayer = (n) => { showSum(n); label(K, String(2 * n - 1), sq.layerAt(n), 0.22, 0, { color: '#ffffff', step: true }); if (n === 2) em('add3'); if (n === 4) em('four'); if (n === 6) em('six'); };
      MW4.bindOddHands(sq, lever, K.app, { 1: 2, 2: 4, 3: 6 }, { layer: onLayer });
      return { sq, lever, sum, onLayer };
    },
    steps: [
      { do: X('One tile makes the smallest square, 1 by 1. You are standing at its corner.'), target: 'sq',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sq.id }); label(K, '1', o.sq.layerAt(1), 0.22, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('One tile: 1 = 1 × 1.') },
      { do: X('Pull the lever towards you to add the next L-shaped layer around the square. How many tiles does it need?'), target: 'sq',
        act: async (K, o) => { o.sq.add(); o.onLayer(2); await K.sleep(1.5); },
        ev: { type: 'add3' }, see: X('The new layer needs 3 tiles, and now the tiles make a 2 by 2 square: 1 + 3 = 4.') },
      { do: X('Pull the lever twice more, and count the tiles in each new layer.'), target: 'sq',
        act: async (K, o) => { for (const n of [3, 4]) { o.sq.add(); o.onLayer(n); await K.sleep(1.4); } },
        ev: { type: 'four' }, see: X('The layers need 5 and then 7 tiles: 1 + 3 + 5 + 7 = 16 = 4 × 4.'),
        why: X('To turn a square of side n into one of side n + 1, a layer covers one side, the other side and the corner: n + n + 1 tiles. That is always an odd number.') },
      { do: X('Keep going up to 6 layers. Then walk onto the square.'), target: 'sq',
        act: async (K, o) => { for (const n of [5, 6]) { o.sq.add(); o.onLayer(n); await K.sleep(1.4); } },
        ev: { type: 'six' }, see: X('1 + 3 + 5 + 7 + 9 + 11 = 36 = 6 × 6. The square now has 6 tiles on each side, about 2.5 m.') },
      { do: X('Without laying the tiles: what do the first 10 odd numbers add up to?'), target: 'sq',
        act: async (K, o) => { o.sq.showTen(true); K.lab.emit('ten', { obj: o.sq.id }); o.sum.set(['1 + 3 + 5 + … + 19 = 10 × 10 = 100'], '#8be07a'); await K.sleep(2); },
        ev: { type: 'ten' }, see: X('The first 10 odd numbers make a 10 by 10 square: they add up to 100.') },
    ],
    eq: { word: 'Sum of odd numbers', sym: '1 + 3 + 5 + … = n²' },
    result: {
      obs: X('Each layer needed the next odd number of tiles: 1, 3, 5, 7, 9, 11. Together they always made a square: 4, 9, 16, 25, 36.'),
      concl: X('The sum of the first n odd numbers is n × n, a square number.'),
      safety: X('Real floor tiles are heavy and their edges can be sharp: carry them with care.'),
      viva: [{ q: X('What is 1 + 3 + 5 + 7 + 9?'), a: X('25, because these are the first 5 odd numbers: 5 × 5.') },
        { q: X('How many tiles does the layer around a 7 by 7 square need?'), a: X('15, to make 8 × 8 = 64.') },
        { q: X('Is the sum of the first 20 odd numbers a square number?'), a: X('Yes: 20 × 20 = 400.') }],
    },
  },
];
