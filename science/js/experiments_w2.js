// DUET Maths Lab 360, real places 2: hands-on in 3D. The student builds (a + b)² and grows it into (a + b)³ and then stands
// inside it; cuts a triangle on the ground and turns it into a rectangle while standing inside it; pours water from the
// squares on two sides of a right triangle into the third; and times poles from inside a moving train.
import { DICT } from './exp_i18n.js';
import { DICT_W2 } from './exp_i18n_w2.js';
import * as MW from './mathworld.js';
import * as MW2 from './mathworld2.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C6a = N('Ch 6 · Perimeter and Area', 'अध्याय 6 · परिमाप और क्षेत्रफल', 'Ch 6 · Perimeter aur area');
const C8p = N('Part 2 · Ch 2 · The Baudhayana-Pythagoras Theorem', 'भाग 2 · अध्याय 2 · बौधायन-पाइथागोरस प्रमेय', 'Part 2 · Ch 2 · Baudhayana-Pythagoras theorem');
const C8s = N('Ch 7 · Proportional Reasoning-1', 'अध्याय 7 · अनुपातिक तर्क-1', 'Ch 7 · Proportional reasoning-1');
const C9i = N('Ch 4 · Exploring Algebraic Identities', 'अध्याय 4 · बीजीय सर्वसमिकाओं की खोज', 'Ch 4 · Algebraic identities ki khoj');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return () => { if (!d) { d = true; f(); } }; };
const W = { pieces: X('3 pieces'), rect: X('A rectangle!') };

export const EXPERIMENTS_W2 = [
  {
    id: 'w9_identity_cube', subj: 'maths', cls: 9, ch: C9i, world: true, place: 'room', table: true,
    title: X('(a + b)² and (a + b)³ with your own hands'),
    aim: X('To build (a + b)² from four tiles, raise it into the cube (a + b)³ with your own hands, and then stand inside it to see all eight blocks.'),
    kind: X('Algebraic identity'),
    setup(K) {
      const cube = K.add(MW2.identityCube(), 0, -0.74);
      const knobs = { a2: K.add(MW.pullTab(), 0, -0.7), b2: K.add(MW.pullTab(), 0, -0.7), abx: K.add(MW.pullTab(), 0, -0.7), abz: K.add(MW.pullTab(), 0, -0.7), lift: K.add(MW.pullTab(), 0, -0.6) };
      cube.camView = { p: V3(K, 0.1, 0.78, 0.9), t: V3(K, 0.15, 0.05, 0.02) };
      const em = (t) => K.lab.emit(t, { obj: cube.id });
      const fin = {
        s1: once(() => { label(K, 'a²', cube.pieceTop('a2').home.clone().setY(cube.g.position.y + 0.05), 0.03, 0, { color: '#ffffff', edge: '#3d7be0', step: true }); label(K, 'b²', cube.pieceTop('b2').home.clone().setY(cube.g.position.y + 0.05), 0.03, 0, { color: '#ffffff', edge: '#f2c230', step: true }); em('place1'); }),
        s2: once(() => { for (const k of ['abx', 'abz']) label(K, 'ab', cube.pieceTop(k).home.clone().setY(cube.g.position.y + 0.05), 0.03, 0, { color: '#ffffff', edge: '#2ea36b', step: true });
          label(K, '(a + b)² = a² + 2ab + b²', cube.at('above'), 0.034, 0, { color: '#8be07a', edge: '#8be07a', step: true }); label(K, '9 = 4 + 2 + 2 + 1', cube.at('top'), 0.03, 0, { color: '#ffffff', step: true }); em('place2'); }),
        l1: once(() => em('lift1')), l2: once(() => em('lift2')),
      };
      MW2.bindCubeHands(cube, knobs, K.app, undefined, {
        tile: () => { if (cube.placed('a2') && cube.placed('b2')) fin.s1(); if (cube.placed('abx') && cube.placed('abz')) fin.s2(); },
        lift: (h) => (h >= 2.98 ? fin.l2() : fin.l1()) });
      label(K, 'a = 2', cube.at('a'), 0.026, 0, { color: '#5ec8ff', step: true }); label(K, 'b = 1', cube.at('b'), 0.026, 0, { color: '#ffd23f', step: true });
      return { cube, knobs, fin };
    },
    steps: [
      { do: X('Here are four tiles: a big blue square a², a small yellow square b², and two green rectangles a × b. Here a = 2 and b = 1. Slide the blue tile into the corner of the white frame, and the yellow tile into the opposite corner.'), target: 'cube',
        act: async (K, o) => { await K.tween(1.8, (k) => o.cube.place('a2', ease(k))); await K.tween(1.4, (k) => o.cube.place('b2', ease(k))); o.fin.s1(); await K.sleep(0.6); },
        ev: { type: 'place1' }, see: X('The blue square fills one corner and the yellow square the other. Two gaps are left.') },
      { do: X('Fill the two gaps with the green tiles.'), target: 'cube',
        act: async (K, o) => { await K.tween(1.4, (k) => o.cube.place('abx', ease(k))); await K.tween(1.4, (k) => o.cube.place('abz', ease(k))); o.fin.s2(); await K.sleep(1.2); },
        ev: { type: 'place2' }, see: X('The four tiles make one big square of side a + b. Its area is (a + b)² = a² + ab + ab + b² = a² + 2ab + b². With a = 2 and b = 1: 9 = 4 + 2 + 2 + 1.'),
        why: X('(a + b)² is not a² + b². The two green rectangles, 2ab, are the part that people forget.') },
      { do: X('Now go into 3D. Slide the glowing handle along the front edge to raise the square up by a.'), target: 'cube',
        act: async (K, o) => { fresh(K); await K.tween(3, (k) => o.cube.lift(0.08 + 1.92 * ease(k))); o.fin.l1(); await K.sleep(0.8); },
        ev: { type: 'lift1' }, see: X('The blue square has become a cube, a³. The green tiles have become blocks a²b, and the yellow tile a tall block ab².') },
      { do: X('Slide the handle again, to raise it by b more, up to a + b.'), target: 'cube',
        act: async (K, o) => { await K.tween(2.2, (k) => o.cube.lift(2 + ease(k))); o.fin.l2(); await K.sleep(0.8); },
        ev: { type: 'lift2' }, see: X('Now it is a cube of side a + b: (a + b)³. On top are one more green block a²b, two red blocks ab² and a small yellow cube b³.') },
      { do: X('Count all the blocks. Then step inside the cube.'), target: 'cube',
        act: async (K, o) => {
          for (const k in o.knobs) o.knobs[k].g.visible = false;
          if (K.app.places) K.app.places.table.visible = false;
          const cg = o.cube.cube, p0 = cg.position.clone(), to = o.cube.g.worldToLocal(V3(K, 0, 0, 0.1));
          await K.tween(3.2, (k) => { const e = ease(k); cg.scale.setScalar(1 + 9 * e); cg.position.lerpVectors(p0, to, e); o.cube.see(1 - 0.55 * e); });
          o.cube.camView = { p: V3(K, 2.2, 1.6, 3.6), t: V3(K, -0.15, 0.45, 0.75) }; if (!K.app.userCam) K.app.focusBench();
          for (const b of o.cube.blocks()) { label(K, b.name, b.at, b.n > 2 ? 0.34 : 0.26, 0, { color: '#ffffff', edge: b.name === 'a³' ? '#3d7be0' : b.name === 'a²b' ? '#2ea36b' : b.name === 'ab²' ? '#d9493a' : '#f2c230', step: true }); await K.sleep(0.25); }
          K.lab.emit('inside', { obj: o.cube.id }); label(K, '(a + b)³ = a³ + 3a²b + 3ab² + b³', V3(K, 0, 3.55, -0.6), 0.26, 0, { color: '#8be07a', edge: '#8be07a', step: true });
          label(K, '27 = 8 + 12 + 6 + 1', V3(K, 0, 3.22, -0.6), 0.22, 0, { color: '#ffffff', step: true }); await K.sleep(2); },
        ev: { type: 'inside' }, see: X('1 blue cube a³, 3 green blocks a²b, 3 red blocks ab² and 1 yellow cube b³: (a + b)³ = a³ + 3a²b + 3ab² + b³. With a = 2 and b = 1: 27 = 8 + 12 + 6 + 1.'),
        why: X('Every block has one length across, one length deep and one length up. That is why every term has three letters.') },
    ],
    eq: { word: 'Cube of a sum', sym: '(a + b)³ = a³ + 3a²b + 3ab² + b³' },
    result: {
      obs: X('Four tiles made (a + b)² = a² + 2ab + b², 9 = 4 + 2 + 2 + 1. Raised into 3D, eight blocks made (a + b)³: 27 = 8 + 12 + 6 + 1.'),
      concl: X('(a + b)² = a² + 2ab + b² and (a + b)³ = a³ + 3a²b + 3ab² + b³. A square has two dimensions and a cube has three.'),
      safety: X('Keep the blocks on the table, and do not throw them.'),
      viva: [{ q: X('Expand (x + 1)³.'), a: X('x³ + 3x² + 3x + 1.') },
        { q: X('Use the identity to find 11³.'), a: X('(10 + 1)³ = 1000 + 300 + 30 + 1 = 1331.') },
        { q: X('How many unit cubes make a cube of side 4?'), a: X('4 × 4 × 4 = 64.') }],
    },
  },
  {
    id: 'w6_triangle_inside', subj: 'maths', cls: 6, ch: C6a, world: true, place: 'quad', table: false, shadowBox: 4,
    title: X('Area of a triangle: stand inside it, cut it, make a rectangle'),
    aim: X('To stand inside a big triangle, cut it and turn its pieces into a rectangle with your own hands, and see why the area of a triangle is ½ × base × height.'),
    kind: X('Area of a triangle'),
    setup(K) {
      const tri = K.add(MW2.triangleCut(), 0, 0, { y: 0 });
      const knobs = { c0: K.add(MW.pullTab(), 0, 0, { y: 0 }), c1: K.add(MW.pullTab(), 0, 0, { y: 0 }), s0: K.add(MW.pullTab(), 0, 0, { y: 0 }), s1: K.add(MW.pullTab(), 0, 0, { y: 0 }) };
      tri.camView = { p: V3(K, 0.4, 3.4, 3.4), t: V3(K, 0, 0, -0.55) };
      const em = (t) => K.lab.emit(t, { obj: tri.id });
      const fin = {
        cut: once(() => { label(K, tl(K, W.pieces), tri.at('top'), 0.22, 0, { color: '#ffffff', step: true }); em('cut'); }),
        s0: once(() => em('swing')), s1: once(() => { label(K, tl(K, W.rect), tri.at('top'), 0.24, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('swing2'); }),
      };
      MW2.bindTriangleHands(tri, knobs, K.app, undefined, { cut: () => { if (tri.cutK[0] > 0.96 && tri.cutK[1] > 0.96) fin.cut(); }, swing: (n) => (n === 0 ? fin.s0() : fin.s1()) });
      return { tri, knobs, fin };
    },
    steps: [
      { do: X('You are standing inside a big triangle on the ground. Look at its base, 3 m, and its height, 2 m: the straight distance from the base up to the top corner.'), target: 'tri',
        act: async (K, o) => { o.tri.measures(true); K.lab.emit('look', { obj: o.tri.id }); label(K, 'b = 3 m', o.tri.at('base'), 0.24, 0, { color: '#ffd23f', step: true }); await K.sleep(0.6); label(K, 'h = 2 m', o.tri.at('ht'), 0.24, 0, { color: '#5ec8ff', step: true }); await K.sleep(1.4); },
        ev: { type: 'look' }, see: X('The height goes straight from the base up to the top corner, at a right angle to the base.') },
      { do: X('Cut the triangle along the dotted line halfway up. Then cut the top part from its tip straight down to the first cut.'), target: 'tri',
        act: async (K, o) => { fresh(K); o.tri.measures(false); await K.tween(2.2, (k) => o.tri.cut(0, k)); await K.tween(1.6, (k) => o.tri.cut(1, k)); o.fin.cut(); await K.sleep(1); },
        ev: { type: 'cut' }, see: X('Now there are three pieces: a big piece at the bottom and two small pieces at the top.') },
      { do: X('Hold the tip of the left piece and swing it down into the left corner.'), target: 'tri',
        act: async (K, o) => { fresh(K); await K.tween(2.8, (k) => o.tri.swing(0, ease(k))); o.fin.s0(); await K.sleep(0.6); },
        ev: { type: 'swing' }, see: X('The left piece turns over in the air and fits exactly into the left corner.') },
      { do: X('Now swing the right piece down into the right corner.'), target: 'tri',
        act: async (K, o) => { await K.tween(2.8, (k) => o.tri.swing(1, ease(k))); o.fin.s1(); await K.sleep(1); },
        ev: { type: 'swing2' }, see: X('It fits too. The triangle has become a rectangle!'),
        why: X('Each small piece turns about the middle of a side, so its tip lands exactly on a corner of the base.') },
      { do: X('Measure the rectangle and find its area.'), target: 'tri',
        act: async (K, o) => { fresh(K); o.tri.grid(true); K.lab.emit('calc', { obj: o.tri.id }); label(K, '3 m', o.tri.at('w'), 0.24, 0, { color: '#ffd23f', step: true }); label(K, '1 m = h ÷ 2', o.tri.at('h'), 0.22, 0, { color: '#5ec8ff', step: true }); await K.sleep(0.8);
          label(K, '3 × 1 = 3 m²', o.tri.at('rect'), 0.28, 0, { color: '#ffffff', edge: '#8be07a', step: true }); await K.sleep(0.6); label(K, 'A = ½ × b × h = ½ × 3 × 2 = 3 m²', o.tri.at('rect2'), 0.24, 0, { color: '#8be07a', step: true }); await K.sleep(1.6); },
        ev: { type: 'calc' }, see: X('The rectangle is as long as the base, 3 m, and half as high as the triangle, 1 m. Its area is 3 × 1 = 3 square metres. So the triangle\'s area is ½ × base × height = ½ × 3 × 2 = 3 square metres.'),
        why: X('Nothing was added or taken away: the pieces were only moved. That is why every triangle has an area of ½ × base × height.') },
    ],
    eq: { word: 'Area of a triangle', sym: 'A = ½ × b × h' },
    result: {
      obs: X('The triangle with base 3 m and height 2 m was cut into three pieces, and they made a rectangle 3 m long and 1 m high.'),
      concl: X('The area of a triangle is ½ × base × height: the same as a rectangle on the same base, half as high.'),
      safety: X('Mark the triangle with chalk or rope, and walk carefully over the lines.'),
      viva: [{ q: X('A triangle has a base of 8 cm and a height of 5 cm. Find its area.'), a: X('½ × 8 × 5 = 20 square centimetres.') },
        { q: X('Two triangles have the same base and the same height. What can you say about their areas?'), a: X('They are equal, even if their shapes are different.') },
        { q: X('What happens to the area of a triangle if its height is doubled?'), a: X('It doubles too.') }],
    },
  },
  {
    id: 'w8_pythagoras_water', subj: 'maths', cls: 8, ch: C8p, world: true, place: 'kitchen', table: true,
    title: X('a² + b² = c² with water'),
    aim: X('To turn a wheel with squares on the three sides of a right triangle, and see the water from the two small squares exactly fill the square on the hypotenuse.'),
    kind: X('Baudhayana–Pythagoras theorem'),
    setup(K) {
      const w = K.add(MW2.pythagorasWheel(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.6);
      w.camView = { p: V3(K, -0.05, 0.6, 0.95), t: V3(K, -0.08, 0.3, 0) };
      // the tank labels go away as soon as the wheel starts to turn (the tanks move), and the full big tank gets its own
      const clear = once(() => fresh(K)), t0 = w.turn; w.turn = (k) => { if (k > 0.02) clear(); t0(k); };
      const fin = { turn: once(() => { clear(); label(K, 'c² = 25', w.tankAt(2), 0.034, 0, { color: '#ffffff', edge: '#5ec8ff', step: true }); K.lab.emit('turn', { obj: w.id }); }) };
      MW2.bindWheelHands(w, lever, K.app, 1, { turn: () => fin.turn() });
      return { w, lever, fin };
    },
    steps: [
      { do: X('This wheel has a right triangle in the middle, with sides 3, 4 and 5. On each side stands a square box, and all the boxes are equally deep. The two small boxes are full of water: a² = 9 and b² = 16.'), target: 'w',
        act: async (K, o) => { K.lab.emit('look', { obj: o.w.id }); for (const [i, t, c] of [[0, 'a² = 9', '#5ec8ff'], [1, 'b² = 16', '#5ec8ff'], [2, 'c² = 25', '#ffd23f']]) { label(K, t, o.w.tankAt(i), 0.032, 0, { color: c, step: true }); await K.sleep(0.6); } await K.sleep(1); },
        ev: { type: 'look' }, see: X('The big box on the longest side, the hypotenuse, is empty. Its area is c² = 25.') },
      { do: X('Slide the lever to turn the wheel half a turn, and watch the water.'), target: 'w',
        act: async (K, o) => { fresh(K); await K.tween(5, (k) => o.w.turn(k)); o.w.turn(1); o.fin.turn(); await K.sleep(1); },
        ev: { type: 'turn' }, see: X('The water from the two small boxes runs through the middle into the big box and fills it exactly. Not a drop is left over, and no space is left empty.') },
      { do: X('Compare the three squares.'), target: 'w',
        act: async (K, o) => { K.lab.emit('calc', { obj: o.w.id }); label(K, 'a² + b² = c²', o.w.at('top'), 0.045, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(0.8); label(K, '9 + 16 = 25', o.w.at('sum'), 0.038, 0, { color: '#ffffff', step: true }); await K.sleep(1.6); },
        ev: { type: 'calc' }, see: X('a² + b² = c²: 9 + 16 = 25. The square on the hypotenuse holds exactly as much as the other two squares together.'),
        why: X('All the boxes are equally deep, so the water measures their areas. This is the Baudhayana–Pythagoras theorem, and it is true for every right triangle.') },
    ],
    eq: { word: 'Baudhayana–Pythagoras theorem', sym: 'a² + b² = c²' },
    result: {
      obs: X('The water from the squares on the two shorter sides, 9 + 16, exactly filled the square on the hypotenuse, 25.'),
      concl: X('In a right triangle, the square on the hypotenuse equals the sum of the squares on the other two sides: a² + b² = c².'),
      safety: X('Wipe up any spilt water so that the table does not get slippery.'),
      viva: [{ q: X('The two shorter sides of a right triangle are 6 cm and 8 cm. How long is the hypotenuse?'), a: X('6² + 8² = 36 + 64 = 100, so the hypotenuse is 10 cm.') },
        { q: X('Is a triangle with sides 5, 12 and 13 a right triangle?'), a: X('Yes, because 5² + 12² = 25 + 144 = 169 = 13².') },
        { q: X('Which side of a right triangle is the hypotenuse?'), a: X('The longest side, opposite the right angle.') }],
    },
  },
  {
    id: 'w8_train_speed', subj: 'maths', cls: 8, ch: C8s, world: true, place: 'khet', table: false, shadowBox: 0,
    title: X('Speed, sitting inside a moving train'),
    aim: X('To find the speed of a train from inside it, with a stopwatch and the masts beside the track, and to see how speeds add up when things move inside the train or towards it.'),
    kind: X('Speed, distance and time'),
    setup(K) {
      const tr = K.add(MW2.trainRide(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, 0, { y: 0 });
      tr.camView = { p: V3(K, 0.55, 1.62, 1.95), t: V3(K, 0, 1.42, -2.4) };
      const A = tr.arrows, y0 = 1.98;
      const show = (ball) => { A.train.set(0.45, -0.8, y0); if (ball) { A.ball.set(-0.35, ball * 0.25, y0 - 0.1); A.total.set(0.45, -0.8 + ball * 0.25, y0 - 0.2); } };
      const fin = { push: (d) => { tr.ballV = d * 1; show(d); K.lab.emit(d < 0 ? 'push' : 'push2', { obj: tr.id });
        label(K, d < 0 ? '20 + 1 = 21 m/s' : '20 − 1 = 19 m/s', tr.at('calc'), 0.09, 0, { color: '#8be07a', edge: '#8be07a', step: true }); } };
      MW2.bindTrainHands(tr, knob, K.app, undefined, { push: (d) => fin.push(d) });
      return { tr, knob, fin };
    },
    steps: [
      { do: X('You are sitting in a moving train. The masts beside the track are 50 m apart. Press the stopwatch when a mast passes your window, and press it again when the next mast passes.'), target: 'tr',
        act: async (K, o) => { const tr = o.tr; await K.sleep(Math.max(0.1, tr.nextMast())); tr.watch.t = 0; tr.watch.run = true; await K.sleep(50 / tr.speed); tr.watch.run = false; tr.watch.t = 2.5;
          K.lab.emit('time', { obj: tr.id }); label(K, '50 m → 2.5 s', tr.at('watch'), 0.05, 0, { color: '#ffffff', edge: '#e0a020', step: true }); await K.sleep(1); },
        ev: { type: 'time' }, see: X('From one mast to the next, 50 m, the stopwatch shows 2.5 seconds.') },
      { do: X('Work out the speed of the train.'), target: 'tr',
        act: async (K, o) => { K.lab.emit('calc', { obj: o.tr.id }); label(K, 'speed = distance ÷ time', o.tr.at('calc'), 0.08, 0, { color: '#ffffff', step: true }); await K.sleep(0.8);
          label(K, '50 ÷ 2.5 = 20 m/s = 72 km/h', o.tr.at('calc2'), 0.09, 0, { color: '#ffd23f', edge: '#ffd23f', step: true }); o.tr.arrows.train.set(0.45, -0.8, 1.98); await K.sleep(1.6); },
        ev: { type: 'calc' }, see: X('Speed = distance ÷ time = 50 ÷ 2.5 = 20 metres every second. In one hour that is 20 × 3600 = 72,000 m, so the train goes at 72 km/h.'),
        why: X('To change metres per second into kilometres per hour, multiply by 3.6, because an hour has 3600 seconds and a kilometre has 1000 metres.') },
      { do: X('Push the ball along the shelf towards the engine. Inside the train it rolls at 1 m/s.'), target: 'tr',
        act: async (K, o) => { fresh(K); if (!o.tr.pushed[2]) { o.tr.pushed[2] = true; o.fin.push(-1); } await K.sleep(2.6); },
        ev: { type: 'push' }, see: X('For you, inside the train, the ball moves at just 1 m/s. For someone standing beside the track it moves at 20 + 1 = 21 m/s.') },
      { do: X('Now push the ball towards the back of the train.'), target: 'tr',
        act: async (K, o) => { fresh(K); if (!o.tr.pushed[3]) { o.tr.pushed[3] = true; o.fin.push(1); } await K.sleep(2.6); },
        ev: { type: 'push2' }, see: X('For someone outside, the ball still goes forward, but slower: 20 − 1 = 19 m/s.'),
        why: X('Speeds in the same direction add up; in opposite directions, one is taken from the other. A speed always depends on who is watching.') },
      { do: X('Another train is coming towards you on the next track at 15 m/s. Press the stopwatch when its engine reaches your window, and again when its last coach has passed.'), target: 'tr',
        act: async (K, o) => { fresh(K); for (const k in o.tr.arrows) o.tr.arrows[k].visible = false; const tr = o.tr; tr.sendTrain(); await K.sleep(3); tr.watch.t = 0; tr.watch.run = true; await K.sleep(175 / 35); tr.watch.run = false; tr.watch.t = 5;
          K.lab.emit('pass', { obj: tr.id }); label(K, '20 + 15 = 35 m/s', tr.at('calc'), 0.09, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(0.6); label(K, '175 m ÷ 35 m/s = 5 s', tr.at('calc2'), 0.09, 0, { color: '#ffffff', step: true }); await K.sleep(1.4); },
        ev: { type: 'pass' }, see: X('The two trains move towards each other, so their speeds add up: 20 + 15 = 35 m/s. The 175 m long train passes your window in just 175 ÷ 35 = 5 seconds!') },
    ],
    eq: { word: 'Speed', sym: 'speed = distance ÷ time  ·  1 m/s = 3.6 km/h' },
    result: {
      obs: X('A 50 m gap between masts took 2.5 s: the train went at 20 m/s, or 72 km/h. The ball rolled at 21 m/s or 19 m/s for someone outside. The other train passed in 5 s at 35 m/s.'),
      concl: X('Speed = distance ÷ time. When two things move in the same direction their speeds add up for someone outside; when they move towards each other, they close in at the sum of their speeds.'),
      safety: X('In a real train, never lean out of the window or stand at an open door.'),
      viva: [{ q: X('A car goes 90 km in 1.5 hours. What is its speed?'), a: X('90 ÷ 1.5 = 60 km/h.') },
        { q: X('Change 15 m/s into km/h.'), a: X('15 × 3.6 = 54 km/h.') },
        { q: X('Two trains, at 40 km/h and 60 km/h, come towards each other. How fast do they close in?'), a: X('40 + 60 = 100 km/h.') }],
    },
  },
];
void W; void tl;