// DUET Maths Lab 360, real places 1: maths at real size where it happens. Class 10: the height of the school flagpole,
// found with a clinometer from 15 m away (the courtyard). Each activity names its place (places.js) and the
// table-top activity it stands in for in the Maths Lab app (replaces).
import { DICT } from './exp_i18n.js';
import { DICT_W1 } from './exp_i18n_w1.js';
import * as MW from './mathworld.js';
Object.assign(DICT, DICT_W1);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const C7p = N('Ch 5 · Parallel and Intersecting Lines', 'अध्याय 5 · समांतर और प्रतिच्छेदी रेखाएँ', 'Ch 5 · Parallel aur intersecting lines');
const C10c = N('Ch 11 · Areas Related to Circles', 'अध्याय 11 · वृत्तों से संबंधित क्षेत्रफल', 'Ch 11 · Circles se jude area');
const C9c = N('Ch 1 · Orienting Yourself: The Use of Coordinates', 'अध्याय 1 · अपनी स्थिति जानना: निर्देशांकों का उपयोग', 'Ch 1 · Orienting Yourself: coordinates ka upyog');
const C6p = N('Ch 6 · Perimeter and Area', 'अध्याय 6 · परिमाप और क्षेत्रफल', 'Ch 6 · Perimeter aur area');
const C10v = N('Ch 12 · Surface Areas and Volumes', 'अध्याय 12 · पृष्ठीय क्षेत्रफल और आयतन', 'Ch 12 · Surface area aur volume');
const C10t = N('Ch 9 · Some Applications of Trigonometry', 'अध्याय 9 · त्रिकोणमिति के कुछ अनुप्रयोग', 'Ch 9 · Trigonometry ke kuch applications');
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
// a label that stays for a while (sec), or until the activity is reset (sec = 0)
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s); // gone when the next step starts (fresh)
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
// words drawn on the board and in labels
const W = {
  board: X('Height of the flagpole'), d: X('d = 15 m (to the foot of the pole)'), eye: X('eye height = 1.5 m'), angle: X('angle of elevation θ = 30°'),
  land: X('The square holds the most land'),
  h: X('h = height above your eye'), total: X('Height = h + eye height'), check: X('Check from 5 m: θ = 60°'),
};

export const EXPERIMENTS_W1 = [
  {
    id: 'w10_flagpole', subj: 'maths', cls: 10, ch: C10t, world: true, place: 'quad', table: false, shadowBox: 13, replaces: 'm10_flagpole_height',
    title: X('Height of the school flagpole'),
    aim: X('To find the height of the school flagpole without climbing it, from the distance to its foot and the angle of elevation of its top.'),
    kind: X('Heights and distances'),
    setup(K) {
      const pole = K.add(MW.flagpoleScene(), 0, 0, { y: 0 });
      pole.camView = { p: new K.THREE.Vector3(15.5, 4.2, -4.2), t: new K.THREE.Vector3(0.3, 4.6, -8.6) }; // from the side: the whole triangle in view
      const board = K.add(MW.chalkboard({ w: 2.6, h: 1.6, y: 0.85 }), -3.3, -5.4, { y: 0 }); board.g.rotation.y = 0.55; board.write([], tl(K, W.board));
      return { pole, board };
    },
    steps: [
      { do: X('Stand on the mark, 15 m from the foot of the flagpole. A friend runs the measuring tape from under your eye to the foot of the pole.'), target: 'pole',
        act: async (K, o) => { await K.tween(3.2, (k) => o.pole.measure(k)); K.lab.emit('measure', { obj: o.pole.id }); label(K, 'd = 15 m', o.pole.at('tape'), 0.5); o.board.add(tl(K, W.d)); await K.sleep(1.2); },
        ev: { type: 'measure' }, see: X('The foot of the flagpole is 15 m from you.') },
      { do: X('Hold the clinometer at your eye and look at the top of the flagpole through the straw. The thread with the weight hangs straight down and shows the angle.'), target: 'pole',
        act: async (K, o) => { await K.tween(2.2, (k) => o.pole.aim(k)); await K.tween(1.6, (k) => o.pole.look(k)); K.lab.emit('sight', { obj: o.pole.id }); label(K, 'θ = 30°', o.pole.at('eye'), 0.42, 0, { color: '#ffffff', edge: '#ffffff' }); o.board.add(tl(K, W.angle)); await K.sleep(1.2); },
        ev: { type: 'sight' }, see: X('The angle of elevation of the top of the flagpole is 30°.') },
      { do: X('See the right triangle: the level line from your eye to the pole, the part of the pole above your eye, and your line of sight.'), target: 'pole',
        act: async (K, o) => { o.pole.triangle(true); K.lab.emit('triangle', { obj: o.pole.id }); label(K, '15 m', o.pole.at('base'), 0.45, 0, { color: '#ffd23f' }); o.hq = label(K, 'h = ?', o.pole.at('up'), 0.55, 0, { color: '#5ec8ff' }); o.board.add({ t: 'tan θ = h ÷ d', c: '#ffd678' }); await K.sleep(1.5); },
        ev: { type: 'triangle' }, see: X('Your line of sight, the level line from your eye and the pole make a right triangle, with the right angle at the pole.'),
        why: X('In a right triangle, the tan of an angle is the side opposite it divided by the side next to it. Here that is h divided by 15.') },
      { do: X('Work out h, the height of the pole above your eye. Then add the height of your eye, 1.5 m.'), target: 'pole',
        act: async (K, o) => { o.board.add('h = 15 × tan 30°'); await K.sleep(0.9); o.board.add('h = 15 × 0.577 ≈ 8.66 m'); if (o.hq) { K.app.scene.remove(o.hq); } o.hq = label(K, 'h ≈ 8.66 m', o.pole.at('up'), 0.55, 0, { color: '#5ec8ff' }); await K.sleep(0.9); o.pole.eyeLine(true); label(K, '1.5 m', o.pole.at('eyeH'), 0.4, 0, { color: '#8be07a' });
          o.board.add({ t: '8.66 + 1.5 ≈ 10.16 m', big: true, c: '#8be07a' }); K.lab.emit('calc', { obj: o.pole.id }); label(K, '≈ 10.16 m', o.pole.at('top'), 0.6, 0, { color: '#8be07a', edge: '#8be07a' }); await K.sleep(1.5); },
        ev: { type: 'calc' }, see: X('h = 15 × tan 30° = 15 × 0.577, about 8.66 m above your eye. So the flagpole is about 8.66 + 1.5 = 10.16 m tall.'),
        why: X('tan 30° is about 0.577. You can read it from the table of trigonometric ratios.') },
      { do: X('Check from closer: walk to 5 m from the pole and look at the top again.'), target: 'pole',
        act: async (K, o) => { await K.tween(3, (k) => o.pole.closer(k)); K.lab.emit('closer', { obj: o.pole.id }); label(K, '60°', o.pole.at('e2'), 0.42, 0, { color: '#c58bff' }); o.board.add({ t: tl(K, W.check), c: '#c58bff' }); await K.sleep(0.8); o.board.add({ t: '5 × tan 60° = 5 × 1.732 ≈ 8.66 m ✓', c: '#c58bff' }); await K.sleep(1.5); },
        ev: { type: 'closer' }, see: X('From 5 m the angle is bigger, 60°, but the height comes out the same: 5 × tan 60° is about 8.66 m above the eye, about 10.16 m in all.'),
        why: X('This is how surveyors find the heights of towers, trees and mountains, and how the height of Mount Everest was first measured.') },
    ],
    eq: { word: 'Height from the angle of elevation', sym: 'h = d × tan θ (+ eye height)' },
    result: {
      obs: X('From 15 m the angle of elevation of the top was 30°, and from 5 m it was 60°. Both gave a height of about 10.16 m.'),
      concl: X('The height of a tall object can be found from the ground: measure the distance to its foot and the angle of elevation of its top. The height is the distance × tan of the angle, plus the height of the eye.'),
      safety: X('Never look at the Sun through the straw or any other sighting tube.'),
      viva: [{ q: X('From 20 m away the angle of elevation of the top of a tower is 45°. How tall is the tower (ignore eye height)?'), a: X('20 × tan 45° = 20 × 1 = 20 m.') },
        { q: X('As you walk towards a tower, what happens to the angle of elevation of its top?'), a: X('It increases.') },
        { q: X('Why do we add the height of the eye?'), a: X('The angle is measured from the level of the eye, so d × tan θ is only the height above the eye.') }],
    },
  },

  {
    id: 'w7_rail_lines', subj: 'maths', cls: 7, ch: C7p, world: true, place: 'rail', table: false, shadowBox: 0, replaces: 'm7_parallel_lines',
    title: X('Parallel lines on a railway track'),
    aim: X('To see that the rails of a railway line are parallel, and that a straight line crossing them makes equal corresponding angles and equal alternate angles.'),
    kind: X('Parallel lines and a transversal'),
    setup(K) {
      const rail = K.add(MW.railScene(), 0, 0, { y: 0 });
      rail.camView = { p: V3(K, 1.6, 2.6, 1.2), t: V3(K, 0.05, 0, -5.2) };
      return { rail };
    },
    steps: [
      { do: X('Look along the railway line. Measure the gap between the two rails here, a little further on, and far away.'), target: 'rail',
        act: async (K, o) => { o.rail.glowRails(true); await K.tween(2.4, (k) => o.rail.gaps(k)); K.lab.emit('measure', { obj: o.rail.id }); label(K, '1.07 m', o.rail.at('gap'), 0.2, 0, { color: '#8be07a' }); label(K, 'l', o.rail.at('l'), 0.3, 0, { color: '#ffd23f' }); label(K, 'm', o.rail.at('m'), 0.3, 0, { color: '#ffd23f' }); await K.sleep(1.2); },
        ev: { type: 'measure' }, see: X('The gap is the same everywhere, 1.07 m. The rails never meet: they are parallel lines, l and m.'),
        why: X('Far away the rails seem to come together, but that is only how our eyes see distance. If the gap changed, a train would fall off.') },
      { do: X('A straight cable is laid across both rails. A line that crosses two lines is called a transversal. Mark the eight angles it makes.'), target: 'rail',
        act: async (K, o) => { await K.tween(2.2, (k) => o.rail.cable(k)); label(K, 't', o.rail.at('t'), 0.3, 0, { color: '#5ec8ff' }); await K.sleep(0.4); for (let i = 1; i <= 8; i++) { o.rail.angles(true, [i]); await K.sleep(0.25); } K.lab.emit('mark', { obj: o.rail.id }); await K.sleep(1); },
        ev: { type: 'mark' }, see: X('The transversal makes four angles where it crosses rail l (1, 2, 3, 4) and four where it crosses rail m (5, 6, 7, 8).') },
      { do: X('Corresponding angles: slide a copy of angle 1 along the transversal to the other rail.'), target: 'rail',
        act: async (K, o) => { await K.tween(2.6, (k) => o.rail.slide(1, k)); K.lab.emit('slide', { obj: o.rail.id }); label(K, '∠1 = ∠5 = 55°', o.rail.at('Q'), 0.24, 0, { color: '#ffffff', edge: '#ff8a3d', step: true }); await K.sleep(1.4); },
        ev: { type: 'slide' }, see: X('The copy of angle 1 fits exactly on angle 5. Corresponding angles are equal: both are 55°.'),
        why: X('The two rails point the same way, so the transversal crosses each of them in the same way.') },
      { do: X('Alternate angles: compare angle 2 with angle 8, on opposite sides of the transversal, between the rails.'), target: 'rail',
        act: async (K, o) => { fresh(K); o.rail.clearGhost(); o.rail.angles(false); o.rail.angles(true, [2, 8]); K.lab.emit('compare', { obj: o.rail.id }); label(K, '∠2 = ∠8 = 125°', o.rail.at('mid'), 0.24, 0, { color: '#ffffff', edge: '#3dd6ff', step: true }); await K.sleep(1.6); },
        ev: { type: 'compare' }, see: X('Angle 2 and angle 8 are both 125°. Alternate interior angles are equal.') },
      { do: X('Now add angle 1 and angle 8: they are between the rails, on the same side of the transversal.'), target: 'rail',
        act: async (K, o) => { fresh(K); o.rail.angles(false); o.rail.angles(true, [1, 8]); K.lab.emit('add', { obj: o.rail.id }); label(K, '55° + 125° = 180°', o.rail.at('mid'), 0.24, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.6); },
        ev: { type: 'add' }, see: X('55° + 125° = 180°. Interior angles on the same side of the transversal add up to 180°.'),
        why: X('This is how we can check that two lines are parallel: if the corresponding angles are equal, the lines are parallel.') },
    ],
    eq: { word: 'Parallel lines cut by a transversal', sym: '∠1 = ∠5 · ∠2 = ∠8 · ∠1 + ∠8 = 180°' },
    result: {
      obs: X('The rails stayed 1.07 m apart. The cable made angles of 55° and 125° at both rails: angle 1 = angle 5, angle 2 = angle 8, and angle 1 + angle 8 = 180°.'),
      concl: X('When a transversal crosses two parallel lines, corresponding angles are equal, alternate interior angles are equal, and interior angles on the same side add up to 180°.'),
      safety: X('Never walk or play on a railway line. Look at rails only from a safe place, such as a platform.'),
      viva: [{ q: X('Name two other places where you see parallel lines.'), a: X('The edges of a ruler, the lines of a notebook, the opposite edges of a door.') },
        { q: X('If one corresponding angle is 70°, what is the other one?'), a: X('70°, because corresponding angles are equal.') },
        { q: X('Two interior angles on the same side are 100° and 80°. Are the lines parallel?'), a: X('Yes, because they add up to 180°.') }],
    },
  },

  {
    id: 'w10_roti_area', subj: 'maths', cls: 10, ch: C10c, world: true, place: 'kitchen', table: true, replaces: 'm10_circle_area',
    title: X('Area of a circle with a roti'),
    aim: X('To cut a roti into equal pieces, lay them out as a near-rectangle, and find the area of a circle.'),
    kind: X('Area of a circle'),
    setup(K) {
      const roti = K.add(MW.rotiSectors(), 0, -0.62);
      roti.camView = { p: V3(K, 0.1, 0.5, 0.52), t: V3(K, 0.08, -0.04, -0.02) };
      return { roti };
    },
    steps: [
      { do: X('Here is a round roti of radius 10 cm. Cut it through the middle into 16 equal pieces.'), target: 'roti',
        act: async (K, o) => { await K.tween(2.6, (k) => o.roti.cut(k)); K.lab.emit('cut', { obj: o.roti.id }); label(K, 'r = 10 cm', o.roti.at('roti'), 0.035, 3); await K.sleep(1); },
        ev: { type: 'cut' }, see: X('16 equal pieces, each a thin slice with a curved edge, like slices of a pizza.') },
      { do: X('Lay the pieces on the board in a row, fitted into each other: one pointing down, the next pointing up.'), target: 'roti',
        act: async (K, o) => { await K.tween(5.5, (k) => o.roti.arrange(k)); K.lab.emit('arrange', { obj: o.roti.id }); },
        ev: { type: 'arrange' }, see: X('The pieces make a shape very close to a rectangle, with slightly wavy long edges.') },
      { do: X('Find the length and the height of this shape.'), target: 'roti',
        act: async (K, o) => { o.roti.measures(true); label(K, 'πr', o.roti.at('len'), 0.04, 0, { color: '#ffd23f' }); label(K, 'r', o.roti.at('ht'), 0.04, 0, { color: '#5ec8ff' }); K.lab.emit('measure', { obj: o.roti.id }); await K.sleep(2); },
        ev: { type: 'measure' }, see: X('Its length is half the edge of the roti, half the circumference: πr. Its height is the radius, r.'),
        why: X('Half of the curved edges lie along the bottom and half along the top, so the bottom is half the circumference, 2πr ÷ 2 = πr.') },
      { do: X('The roti is only cut and moved, so its area has not changed. Work out the area.'), target: 'roti',
        act: async (K, o) => { label(K, 'A = πr × r = πr²', o.roti.at('area'), 0.045, 0, { color: '#8be07a', edge: '#8be07a' }); await K.sleep(1.2); label(K, '3.14 × 10 × 10 = 314 cm²', o.roti.at('area').clone().add(V3(K, 0, -0.055, 0)), 0.04, 0, { color: '#ffffff' }); K.lab.emit('calc', { obj: o.roti.id }); await K.sleep(2); },
        ev: { type: 'calc' }, see: X('Area = length × height = πr × r = πr². For this roti: 3.14 × 10 × 10 = 314 cm².'),
        why: X('With more and thinner pieces the wavy edges become straight and the shape becomes a true rectangle.') },
    ],
    eq: { word: 'Area of a circle', sym: 'A = πr × r = πr²' },
    result: {
      obs: X('The 16 pieces of the roti made a near-rectangle πr long and r high.'),
      concl: X('The area of a circle of radius r is πr². A roti of radius 10 cm has an area of about 314 cm².'),
      safety: X('Cut with a table knife on a board, with the blade away from your fingers.'),
      viva: [{ q: X('Find the area of a circle of radius 7 cm (π = 22/7).'), a: X('22/7 × 7 × 7 = 154 cm².') },
        { q: X('If the radius is doubled, how many times bigger is the area?'), a: X('Four times, because the area depends on r².') },
        { q: X('Why does the shape look more like a rectangle when there are more pieces?'), a: X('Thinner pieces have flatter arcs, so the wavy edges become almost straight.') }],
    },
  },
  {
    id: 'w9_field_coords', subj: 'maths', cls: 9, ch: C9c, world: true, place: 'field', table: false, shadowBox: 7, replaces: 'm9_coordinates',
    title: X('Coordinates on the playground'),
    aim: X('To mark a coordinate plane on the playground and find the places of a football and three cones with coordinates (x, y): first along the x-axis, then along the y-axis.'),
    kind: X('Coordinates'),
    setup(K) {
      const cg = K.add(MW.coordField(), 0, 0, { y: 0 });
      cg.camView = { p: V3(K, 0.4, 3.9, 4.4), t: V3(K, 0, 0.4, -5.6) };
      return { cg };
    },
    steps: [
      { do: X('The playground is marked like a graph. The x-axis runs across, the y-axis runs straight ahead along the white line, and they cross at the origin O, 5 m in front of you. Each mark is 1 m.'), target: 'cg',
        act: async (K, o) => { await K.tween(3.2, (k) => o.cg.axes(k)); K.lab.emit('look', { obj: o.cg.id }); label(K, 'O (0, 0)', o.cg.at('O'), 0.4, 0, { color: '#ffd23f' }); await K.sleep(1.2); },
        ev: { type: 'look' }, see: X('To the right of O and ahead of O the numbers are positive. To the left of O, and behind it towards you, they are negative.') },
      { do: X('Plot A (4, 3), where the football goes. From O, go 4 m to the right along the x-axis, then 3 m straight ahead.'), target: 'cg',
        act: async (K, o) => { await K.tween(4, (k) => o.cg.place(0, k)); K.lab.emit('plot', { obj: o.cg.id }); label(K, 'A (4, 3)', o.cg.at('A'), 0.46, 0, { color: '#ffffff', edge: '#ffd23f' }); await K.sleep(1.2); },
        ev: { type: 'plot' }, see: X('The first number tells how far across, the second how far ahead. The football is at A (4, 3).'),
        why: X('The order matters: (4, 3) and (3, 4) are different points. The first coordinate is x, the second is y.') },
      { do: X('Put a cone at B (−3, 4) and another at C (−4, −2).'), target: 'cg',
        act: async (K, o) => { await K.tween(3.4, (k) => o.cg.place(1, k)); label(K, 'B (−3, 4)', o.cg.at('B'), 0.46, 0, { color: '#ffffff', edge: '#5ec8ff' }); await K.sleep(0.4); await K.tween(3.4, (k) => o.cg.place(2, k)); K.lab.emit('plot', { obj: o.cg.id }); label(K, 'C (−4, −2)', o.cg.at('C'), 0.46, 0, { color: '#ffffff', edge: '#ff8a3d' }); await K.sleep(1.2); },
        ev: { type: 'plot' }, see: X('A negative x means the point is to the left of the y-axis. A negative y means it is behind the x-axis, on your side.') },
      { do: X('Put the last cone at D (3, −3). Then look at the four parts of the playground, the quadrants.'), target: 'cg',
        act: async (K, o) => { await K.tween(3.4, (k) => o.cg.place(3, k)); label(K, 'D (3, −3)', o.cg.at('D'), 0.46, 0, { color: '#ffffff', edge: '#c58bff' }); await K.sleep(0.6); o.cg.quads(true); K.lab.emit('look', { obj: o.cg.id });
          for (const [q, t, c] of [['q1', 'I (+, +)', '#8be07a'], ['q2', 'II (−, +)', '#5ec8ff'], ['q3', 'III (−, −)', '#ff8a3d'], ['q4', 'IV (+, −)', '#c58bff']]) { label(K, t, o.cg.at(q), 0.42, 0, { color: c, step: true }); await K.sleep(0.5); } await K.sleep(1); },
        ev: { type: 'look' }, see: X('In quadrant I, x and y are both positive; in II, x is negative; in III, both are negative; in IV, y is negative. A, B, C and D are one in each quadrant.') },
      { do: X('Kick the ball straight from O to A. How far does it go?'), target: 'cg',
        act: async (K, o) => { fresh(K); o.cg.quads(false); label(K, '4 + 3 = 7 m', o.cg.at('top'), 0.42, 0, { color: '#ffd23f', step: true }); await K.tween(2.4, (k) => o.cg.straight(k)); K.lab.emit('measure', { obj: o.cg.id }); label(K, '√(4² + 3²) = √25 = 5 m', o.cg.at('OA'), 0.46, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.6); },
        ev: { type: 'measure' }, see: X('Along the axes the path was 4 + 3 = 7 m, but the straight line from O to A is only 5 m: √(4² + 3²) = √25 = 5.'),
        why: X('The 4 m, the 3 m and the straight line make a right triangle, so the Baudhayana-Pythagoras theorem gives the distance from the origin.') },
    ],
    eq: { word: 'A point on the plane', sym: 'P (x, y)  ·  I (+, +)  II (−, +)  III (−, −)  IV (+, −)' },
    result: {
      obs: X('The football was at A (4, 3) and the cones at B (−3, 4), C (−4, −2) and D (3, −3), one in each quadrant. In a straight line the ball was 5 m from O.'),
      concl: X('Every point on a plane has a pair of coordinates (x, y), counted from the origin along the x-axis and then the y-axis. The signs of x and y tell which quadrant the point is in.'),
      safety: X('Mark the playground with chalk powder or rope, and keep the cones out of the way of runners.'),
      viva: [{ q: X('In which quadrant is the point (−5, 2)?'), a: X('The second quadrant: x is negative and y is positive.') },
        { q: X('Where is every point whose y-coordinate is 0?'), a: X('On the x-axis.') },
        { q: X('How far from O is the point (6, 8)?'), a: X('√(6² + 8²) = √100 = 10 units.') }],
    },
  },

  {
    id: 'w6_fence_rope', subj: 'maths', cls: 6, ch: C6p, world: true, place: 'khet', table: false, shadowBox: 8, replaces: 'm6_same_perimeter',
    title: X('Fencing a field with 24 m of rope'),
    aim: X('To fence plots of different shapes with the same 24 m of rope, and to see that the same perimeter can enclose different areas.'),
    kind: X('Perimeter and area'),
    setup(K) {
      const plot = K.add(MW.fencePlot(), 0, 0, { y: 0 });
      plot.camView = { p: V3(K, 0.5, 3.9, 3.0), t: V3(K, 0, 0.4, -6.6) };
      return { plot };
    },
    steps: [
      { do: X('A farmer has 24 m of rope and four posts. Fence a long, thin plot 10 m long and 2 m wide.'), target: 'plot',
        act: async (K, o) => { await K.tween(5, (k) => o.plot.fence(k)); o.plot.sides(true); K.lab.emit('fence', { obj: o.plot.id }); label(K, '10 + 2 + 10 + 2 = 24 m', o.plot.at('note'), 0.45, 0, { color: '#ffffff', edge: '#d6c08a', step: true }); await K.sleep(1.4); },
        ev: { type: 'fence' }, see: X('The rope goes all the way round: 10 + 2 + 10 + 2 = 24 m. The length all the way round is the perimeter.') },
      { do: X('How much land is inside? Count the squares of 1 m by 1 m.'), target: 'plot',
        act: async (K, o) => { await K.tween(3, (k) => o.plot.tiles(k)); K.lab.emit('count', { obj: o.plot.id }); label(K, '10 × 2 = 20 m²', o.plot.at('area'), 0.5, 0, { color: '#b6f27a', edge: '#b6f27a', step: true }); await K.sleep(1.4); },
        ev: { type: 'count' }, see: X('20 squares fit inside, so the area is 20 square metres.'),
        why: X('Area is counted in squares. A plot 10 m long and 2 m wide has 2 rows of 10 squares: 10 × 2 = 20.') },
      { do: X('Move the posts. With the same rope, make the plot 8 m long and 4 m wide.'), target: 'plot',
        act: async (K, o) => { fresh(K); o.plot.sides(false); await K.tween(2.6, (k) => o.plot.morph(10, 8, k)); o.plot.sides(true); label(K, '8 + 4 + 8 + 4 = 24 m', o.plot.at('note'), 0.45, 0, { color: '#ffffff', edge: '#d6c08a', step: true });
          await K.tween(2.6, (k) => o.plot.tiles(k)); K.lab.emit('stretch', { obj: o.plot.id }); label(K, '8 × 4 = 32 m²', o.plot.at('area'), 0.5, 0, { color: '#b6f27a', edge: '#b6f27a', step: true }); await K.sleep(1.4); },
        ev: { type: 'stretch' }, see: X('The rope is still 24 m, so the perimeter has not changed. But now 32 squares fit inside.') },
      { do: X('Now make it a square, 6 m by 6 m.'), target: 'plot',
        act: async (K, o) => { fresh(K); o.plot.sides(false); await K.tween(2.4, (k) => o.plot.morph(8, 6, k)); o.plot.sides(true); await K.tween(2.6, (k) => o.plot.tiles(k)); K.lab.emit('stretch', { obj: o.plot.id });
          label(K, '6 × 6 = 36 m²', o.plot.at('area'), 0.5, 0, { color: '#b6f27a', edge: '#b6f27a', step: true }); await K.sleep(0.8); label(K, tl(K, W.land), o.plot.at('note'), 0.42, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.6); },
        ev: { type: 'stretch' }, see: X('Same 24 m of rope, but the areas were 20, 32 and now 36 square metres. The square encloses the most land.'),
        why: X('Perimeter is the length of the boundary; area is the land inside it. Of all rectangles with the same perimeter, the square has the largest area.') },
    ],
    eq: { word: 'Perimeter and area of a rectangle', sym: 'P = 2 × (l + b)  ·  A = l × b' },
    result: {
      obs: X('With the same 24 m of rope, the plots 10 m × 2 m, 8 m × 4 m and 6 m × 6 m had areas of 20, 32 and 36 square metres.'),
      concl: X('Shapes with the same perimeter can have different areas. With a fixed length of fencing, a square plot encloses the most land.'),
      safety: X('Wear gloves when you handle rough rope, and mind the pointed tops of the posts.'),
      viva: [{ q: X('A rectangle is 7 cm long and 5 cm wide. Find its perimeter and area.'), a: X('Perimeter = 2 × (7 + 5) = 24 cm; area = 7 × 5 = 35 square centimetres.') },
        { q: X('Can two shapes with the same area have different perimeters?'), a: X('Yes. 12 squares make a 3 × 4 rectangle (perimeter 14 cm) or a 2 × 6 rectangle (perimeter 16 cm).') },
        { q: X('A farmer has 40 m of fencing. Which rectangle gives the most land?'), a: X('A square of side 10 m, with an area of 100 square metres.') }],
    },
  },

  {
    id: 'w10_grain_cone', subj: 'maths', cls: 10, ch: C10v, world: true, place: 'farm', table: false, shadowBox: 4, replaces: 'm10_cone_volume',
    title: X('A cone of wheat and a drum'),
    aim: X('To find, by pouring wheat, how many cones fill a cylinder with the same radius and height, and to use the rule to find the wheat in a heap.'),
    kind: X('Volume of a cone'),
    setup(K) {
      const gr = K.add(MW.grainScene(), 0, 0, { y: 0 });
      gr.camView = { p: V3(K, 0.15, 1.55, 0.25), t: V3(K, 0, 0.62, -2.1) };
      return { gr };
    },
    steps: [
      { do: X('Here are a cone-shaped measure and a steel drum. Both have a radius of 30 cm and a height of 70 cm.'), target: 'gr',
        act: async (K, o) => { o.gr.dims(true); K.lab.emit('measure', { obj: o.gr.id }); for (const [k, t, c] of [['coneR', 'r = 30 cm', '#ffd23f'], ['coneH', 'h = 70 cm', '#5ec8ff'], ['drumR', 'r = 30 cm', '#ffd23f'], ['drumH', 'h = 70 cm', '#5ec8ff']]) { label(K, t, o.gr.at(k), 0.075, 0, { color: c, step: true }); await K.sleep(0.4); } await K.sleep(1.2); },
        ev: { type: 'measure' }, see: X('The cone and the drum, a cylinder, have the same round top and the same height.') },
      { do: X('Fill the cone to the brim with wheat from the bucket.'), target: 'gr',
        act: async (K, o) => { fresh(K); o.gr.dims(false); await K.tween(5, (k) => o.gr.fillCone(k)); K.lab.emit('fill', { obj: o.gr.id }); await K.sleep(0.6); },
        ev: { type: 'fill' }, see: X('The cone is full of wheat, level with its brim.') },
      { do: X('Pour the cone of wheat into the drum.'), target: 'gr',
        act: async (K, o) => { await K.tween(5.5, (k) => o.gr.pour(1, k)); o.gr.mark(1, true); K.lab.emit('pour', { obj: o.gr.id }); label(K, '1 cone → ⅓', o.gr.at('m1'), 0.08, 0, { color: '#8be07a' }); await K.sleep(1.2); },
        ev: { type: 'pour' }, see: X('One cone of wheat fills the drum only one third of the way up.') },
      { do: X('Fill the cone and pour it into the drum twice more.'), target: 'gr',
        act: async (K, o) => { await K.tween(3.2, (k) => o.gr.fillCone(k)); await K.tween(4, (k) => o.gr.pour(2, k)); o.gr.mark(2, true); label(K, '2 cones → ⅔', o.gr.at('m2'), 0.08, 0, { color: '#8be07a' });
          await K.tween(3.2, (k) => o.gr.fillCone(k)); await K.tween(4, (k) => o.gr.pour(3, k)); K.lab.emit('pour', { obj: o.gr.id }); label(K, '3 cones = 1 drum', o.gr.at('full'), 0.1, 0, { color: '#ffffff', edge: '#8be07a' }); await K.sleep(0.8); label(K, 'V = ⅓ πr²h', o.gr.at('drum'), 0.1, 0, { color: '#8be07a', edge: '#8be07a' }); await K.sleep(1.4); },
        ev: { type: 'pour' }, see: X('After the third cone the drum is exactly full. Three cones of wheat fill one drum.'),
        why: X('The volume of the drum, a cylinder, is πr²h. So the volume of a cone with the same radius and height is one third of it: ⅓ πr²h.') },
      { do: X('Now use the rule on the heap of wheat on the farm. Its radius is 1.5 m and its height is 1 m.'), target: 'gr',
        act: async (K, o) => { o.gr.camView = { p: V3(K, 0.7, 2.0, 1.0), t: V3(K, -1.2, 0.7, -3.6) }; if (!K.app.userCam) K.app.focusBench(); o.gr.heapMeasure(true); label(K, 'r = 1.5 m', o.gr.at('heapR'), 0.16, 0, { color: '#ffd23f' }); label(K, 'h = 1 m', o.gr.at('heapH'), 0.16, 0, { color: '#5ec8ff' }); await K.sleep(1);
          K.lab.emit('calc', { obj: o.gr.id }); label(K, 'V = ⅓ × 3.14 × 1.5 × 1.5 × 1 ≈ 2.36 m³', o.gr.at('heap'), 0.16, 0, { color: '#ffffff', edge: '#8be07a' }); await K.sleep(2); },
        ev: { type: 'calc' }, see: X('The heap is a cone. Its volume is ⅓ × 3.14 × 1.5 × 1.5 × 1, about 2.36 cubic metres of wheat.'),
        why: X('Farmers and grain traders estimate a heap of grain this way, from its radius and height, without weighing it.') },
    ],
    eq: { word: 'Volume of a cone', sym: 'V = ⅓ πr²h' },
    result: {
      obs: X('Three cones of wheat exactly filled the drum with the same radius and height. The heap, 1.5 m in radius and 1 m high, held about 2.36 cubic metres.'),
      concl: X('The volume of a cone is one third of the volume of a cylinder with the same base and height: V = ⅓ πr²h.'),
      safety: X('Lift full buckets with both hands and bent knees: grain is heavy.'),
      viva: [{ q: X('A cone has a radius of 7 cm and a height of 12 cm. Find its volume (π = 22/7).'), a: X('⅓ × 22/7 × 7 × 7 × 12 = 616 cubic centimetres.') },
        { q: X('How many cones fill a cylinder with the same radius and height?'), a: X('Three.') },
        { q: X('The height of a heap doubles but its radius stays the same. What happens to its volume?'), a: X('It doubles, because the volume is proportional to the height.') }],
    },
  },
];
