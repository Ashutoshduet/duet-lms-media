// Maths, batch 3: Class 6 same perimeter, different areas (a loop of string on a pegboard); Class 7 parallel lines
// and a transversal (tracing an angle), and when three sticks make a triangle; Class 9 the area of a parallelogram
// and a triangle by cutting and rearranging, and plotting points on a coordinate grid.
import { DICT } from './exp_i18n.js';
import { DICT_M3 } from './exp_i18n_m3.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M3);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 6 · Perimeter and Area', 'अध्याय 6 · परिमाप और क्षेत्रफल', 'Ch 6 · Perimeter aur area');
const C7a = N('Ch 5 · Parallel and Intersecting Lines', 'अध्याय 5 · समांतर और प्रतिच्छेदी रेखाएँ', 'Ch 5 · Parallel aur intersecting lines');
const C7b = N('Ch 7 · A Tale of Three Intersecting Lines', 'अध्याय 7 · तीन प्रतिच्छेदी रेखाओं की कहानी', 'Ch 7 · Teen intersecting lines ki kahani');
const C9a = N('Ch 6 · Measuring Space: Perimeter and Area', 'अध्याय 6 · स्थान का मापन: परिमाप और क्षेत्रफल', 'Ch 6 · Measuring Space: perimeter aur area');
const C9b = N('Ch 1 · Orienting Yourself: The Use of Coordinates', 'अध्याय 1 · अपनी स्थिति जानना: निर्देशांकों का उपयोग', 'Ch 1 · Orienting Yourself: coordinates ka upyog');
// words shown in the 3D labels
const W = {
  same: X('Same perimeter: 24 cm'), biggest: X('The square holds the most'),
  corr: X('a = b (corresponding angles)'), alt: X('b = c (alternate angles)'), nofit: X('Not parallel: it does not fit'),
  tri: X('They meet: a triangle'), gap: X('They cannot meet'), flat: X('They meet only lying flat'),
  rule: X('Any two sides together are longer than the third'),
  rect: X('Rectangle: 10 cm × 6 cm'), twin: X('The two triangles match exactly'),
  quads: X('Four quadrants'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

export const EXPERIMENTS_M3 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_same_perimeter', subj: 'maths', cls: 6, ch: C6, title: X('Same perimeter, different areas'),
    aim: X('To make rectangles with one loop of string 24 cm long, and to see that the same perimeter can enclose different areas.'),
    kind: X('Perimeter and area'),
    setup(K) { const loop = K.add(K.MT3.perimeterLoop(), 0, -0.56); view(K, loop, 0.25, 0.32, -0.01); return { loop }; },
    steps: [
      { do: X('Put the loop of string round the pegs as a long, thin rectangle 11 cm long and 1 cm wide.'), target: 'loop',
        act: async (K, o) => { o.loop.shape(11, 1); o.loop.string(true); K.lab.emit('place', { obj: o.loop.id }); await tagAt(K, o.loop.at('top'), '11 + 1 + 11 + 1 = 24 cm', 3.2, 0, 0.04); }, ev: { type: 'place' },
        see: X('The perimeter, the length all the way round, is 11 + 1 + 11 + 1 = 24 cm: the whole loop.') },
      { do: X('Count the squares of 1 cm inside the loop.'), target: 'loop',
        act: async (K, o) => { o.loop.squares(true); K.lab.emit('count', { obj: o.loop.id }); await tagAt(K, o.loop.at('top'), '11 × 1 = 11 cm²', 3, 0, 0.04); }, ev: { type: 'count' },
        see: X('There are 11 squares inside, so the area is 11 square centimetres.') },
      { do: X('Stretch the same loop into a rectangle 9 cm long and 3 cm wide.'), target: 'loop',
        act: async (K, o) => { await K.tween(2.2, (k) => o.loop.morph(1, 3, k)); K.lab.emit('stretch', { obj: o.loop.id }); tagAt(K, o.loop.at('right'), tl(K, W.same), 3, 0.05, 0.02); await tagAt(K, o.loop.at('top'), '9 × 3 = 27 cm²', 3, 0, 0.04); }, ev: { type: 'stretch' },
        see: X('The string has not changed, so the perimeter is still 24 cm. But now 27 squares fit inside: the area has grown.') },
      { do: X('Make it 8 cm by 4 cm, and then a square of 6 cm by 6 cm.'), target: 'loop',
        act: async (K, o) => { await K.tween(1.6, (k) => o.loop.morph(3, 4, k)); await tagAt(K, o.loop.at('top'), '8 × 4 = 32 cm²', 2.4, 0, 0.04); await K.tween(1.8, (k) => o.loop.morph(4, 6, k)); K.lab.emit('stretch', { obj: o.loop.id });
          tagAt(K, o.loop.at('top'), '6 × 6 = 36 cm²', 3.4, 0, 0.04); await tagAt(K, o.loop.at('right'), tl(K, W.biggest), 3.4, 0.06, 0.02); }, ev: { type: 'stretch' },
        see: X('Same 24 cm of string, but the areas are 11, 27, 32 and then 36 square centimetres. The square holds the most.'),
        why: X('Perimeter is the length of the boundary; area is the space inside it. The same boundary can be bent into shapes with different areas. Of all rectangles with the same perimeter, the square has the largest area.') },
    ],
    eq: { word: 'Perimeter and area of a rectangle', sym: 'P = 2 × (l + b)  ·  A = l × b' },
    result: { obs: X('With the same 24 cm loop the rectangles 11 × 1, 9 × 3, 8 × 4 and 6 × 6 had areas 11, 27, 32 and 36 square centimetres.'),
      concl: X('Shapes with the same perimeter can have different areas. Among rectangles with a fixed perimeter, the square has the greatest area.'),
      safety: X('Keep the pegs and pins in their box when you finish.'),
      viva: [{ q: X('A rectangle is 7 cm long and 5 cm wide. Find its perimeter and area.'), a: X('Perimeter = 2 × (7 + 5) = 24 cm; area = 7 × 5 = 35 square centimetres.') },
        { q: X('Can two shapes with the same area have different perimeters?'), a: X('Yes. 12 squares make a 3 × 4 rectangle (perimeter 14 cm) or a 2 × 6 rectangle (perimeter 16 cm).') },
        { q: X('A farmer has 40 m of fencing. Which rectangle gives the most land?'), a: X('A square of side 10 m, with an area of 100 square metres.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 7
  {
    id: 'm7_parallel_lines', subj: 'maths', cls: 7, ch: C7a, title: X('Parallel lines and a transversal'),
    aim: X('To copy an angle on tracing paper and slide and turn it, to see which angles are equal when a transversal cuts two parallel lines.'),
    kind: X('Parallel lines'),
    setup(K) { const pl = K.add(K.MT3.parallelLines(), 0, -0.56); view(K, pl, 0.3, 0.38, -0.01); return { pl }; },
    steps: [
      { do: X('Lines l and m are parallel: they never meet. Line t, the transversal, cuts both. Look at angle a at the top crossing and angle b in the same corner at the bottom crossing.'), target: 'pl',
        act: async (K, o) => { tagAt(K, o.pl.at('l'), 'l', 3, 0, 0.03); tagAt(K, o.pl.at('m'), 'm', 3, 0, 0.03); tagAt(K, o.pl.at('t'), 't', 3, 0.02, 0.03); tagAt(K, o.pl.at('a'), 'a', 3, 0.01, 0.02); await tagAt(K, o.pl.at('b'), 'b', 3, 0.01, 0.02); K.lab.emit('look', { obj: o.pl.id }); }, ev: { type: 'look' },
        see: X('Angle a (orange) and angle b (blue) are in matching positions: both are above their line, to the right of the transversal.') },
      { do: X('Trace angle a on tracing paper. Slide the tracing down along the transversal to the bottom crossing.'), target: 'pl',
        act: async (K, o) => { await K.tween(0.8, (k) => o.pl.trace(k)); await K.tween(2.4, (k) => o.pl.slide(k)); K.lab.emit('slide', { obj: o.pl.id }); await tagAt(K, o.pl.at('b'), tl(K, W.corr), 3.4, 0.05, 0.03); }, ev: { type: 'slide' },
        see: X('The traced angle fits angle b exactly.'),
        why: X('Angles in matching positions at the two crossings are called corresponding angles. When the lines are parallel, corresponding angles are equal.') },
      { do: X('Now turn the tracing half a turn about the middle point of the transversal between the two lines.'), target: 'pl',
        act: async (K, o) => { await K.tween(2.6, (k) => o.pl.turn(k)); o.pl.showC(true); K.lab.emit('turn', { obj: o.pl.id }); tagAt(K, o.pl.at('c'), 'c', 3.4, -0.02, 0.02); await tagAt(K, o.pl.at('mid'), tl(K, W.alt), 3.4, 0.05, 0.03); }, ev: { type: 'turn' },
        see: X('The tracing lands on angle c at the top crossing, between the two lines on the other side of the transversal, and fits it exactly.'),
        why: X('Angles b and c are between the parallel lines, on opposite sides of the transversal: they are alternate angles. When the lines are parallel, alternate angles are equal.') },
      { do: X('Turn line m a little, so that l and m are no longer parallel. Turn the tracing back to the bottom crossing.'), target: 'pl',
        act: async (K, o) => { await K.tween(1.6, (k) => o.pl.tilt(15, k)); await K.tween(2.4, (k) => o.pl.turn(1 - k)); o.pl.showC(false); K.lab.emit('turn', { obj: o.pl.id }); tagAt(K, o.pl.at('b'), '45°', 3.4, 0.01, 0.02); await tagAt(K, o.pl.at('mid'), tl(K, W.nofit), 3.4, 0.05, 0.03); }, ev: { type: 'turn' },
        see: X('Now angle b is only 45° but the tracing still shows 60°: it no longer fits.'),
        why: X('Corresponding and alternate angles are equal only when the lines are parallel. This is also how we test whether two lines are parallel.') },
    ],
    eq: { word: 'A transversal across parallel lines', sym: 'l ∥ m  ⇒  a = b,  b = c' },
    result: { obs: X('The tracing of angle a fitted the corresponding angle b and the alternate angle c, but not once line m was turned.'),
      concl: X('When a transversal cuts two parallel lines, corresponding angles are equal and alternate angles are equal. If they are not equal, the lines are not parallel.'),
      safety: X('Keep the sharp point of the compass and the pencil away from your eyes.'),
      viva: [{ q: X('One angle at a crossing of a transversal and a parallel line is 70°. What is the corresponding angle at the other line?'), a: X('70°, because corresponding angles are equal.') },
        { q: X('Angle b is 60°. What is the angle next to it on the same straight line?'), a: X('180° − 60° = 120°, because angles on a straight line add up to 180°.') },
        { q: X('Name two places where you see parallel lines and a transversal.'), a: X('A railway track with its sleepers, a ladder, the lines of a notebook with a margin.') }] },
  },
  {
    id: 'm7_triangle_inequality', subj: 'maths', cls: 7, ch: C7b, title: X('Which three sticks make a triangle?'),
    aim: X('To try to make triangles from three sticks and find the rule for the lengths of the sides of a triangle.'),
    kind: X('Triangle inequality'),
    setup(K) { const st = K.add(K.MT3.triangleSticks(), 0, -0.56); view(K, st, 0.25, 0.33, 0); return { st }; },
    steps: [
      { do: X('Lay the 7 cm stick as the base. Stand the 4 cm and 5 cm sticks at its two ends and turn them towards each other.'), target: 'st',
        act: async (K, o) => { await K.tween(2.6, (k) => o.st.close(k)); K.lab.emit('join', { obj: o.st.id }); tagAt(K, o.st.at('apex'), tl(K, W.tri), 3.2, 0, 0.04); await tagAt(K, o.st.at('base'), '4 + 5 = 9 > 7', 3.2, 0, -0.02); }, ev: { type: 'join' },
        see: X('The two sticks meet above the base and make a triangle.') },
      { do: X('Now try sticks of 3 cm and 4 cm on a base of 8 cm.'), target: 'st',
        act: async (K, o) => { await K.tween(1.2, (k) => o.st.open(k)); o.st.setLens([3, 4, 8]); await K.sleep(0.4); await K.tween(2.6, (k) => o.st.close(k)); K.lab.emit('join', { obj: o.st.id });
          tagAt(K, o.st.at('gap'), tl(K, W.gap), 3.4, 0, 0.04); await tagAt(K, o.st.at('base'), '3 + 4 = 7 < 8', 3.4, 0, -0.02); }, ev: { type: 'join' },
        see: X('Even lying flat on the base, the two sticks are too short: a gap of 1 cm is left. No triangle.') },
      { do: X('Try 3 cm and 5 cm sticks on the 8 cm base.'), target: 'st',
        act: async (K, o) => { await K.tween(1.2, (k) => o.st.open(k)); o.st.setLens([3, 5, 8]); await K.sleep(0.4); await K.tween(2.6, (k) => o.st.close(k)); K.lab.emit('join', { obj: o.st.id });
          tagAt(K, o.st.at('gap'), tl(K, W.flat), 3.4, 0, 0.04); await tagAt(K, o.st.at('base'), '3 + 5 = 8', 3.4, 0, -0.02); }, ev: { type: 'join' },
        see: X('The ends touch only when both sticks lie flat on the base: a flat line, not a triangle.'),
        why: X('For the two shorter sides to rise and meet, together they must be longer than the third side. This is called the triangle inequality.') },
      { do: X('Check the first set again: 4, 5 and 7.'), target: 'st',
        act: async (K, o) => { await K.tween(1.2, (k) => o.st.open(k)); o.st.setLens([4, 5, 7]); await K.sleep(0.3); await K.tween(2.2, (k) => o.st.close(k)); K.lab.emit('check', { obj: o.st.id });
          await tagAt(K, o.st.at('apex'), tl(K, W.rule), 4.2, 0, 0.05); }, ev: { type: 'check' },
        see: X('4 + 5 is more than 7, 4 + 7 is more than 5, and 5 + 7 is more than 4: every pair is longer than the third side, so the triangle is possible.') },
    ],
    eq: { word: 'Triangle inequality', sym: 'a + b > c,  b + c > a,  c + a > b' },
    result: { obs: X('Sticks of 4, 5 and 7 cm made a triangle. Sticks of 3, 4 and 8 cm could not meet, and 3, 5 and 8 cm met only lying flat.'),
      concl: X('Three lengths can make a triangle only if the sum of any two of them is greater than the third.'),
      safety: X('Handle the sticks gently; do not poke anyone with them.'),
      viva: [{ q: X('Can 2 cm, 3 cm and 6 cm be the sides of a triangle?'), a: X('No, because 2 + 3 = 5, which is less than 6.') },
        { q: X('Two sides of a triangle are 5 cm and 8 cm. Between which lengths must the third side be?'), a: X('More than 3 cm and less than 13 cm.') },
        { q: X('Why is walking straight across a field shorter than walking along two of its sides?'), a: X('The straight path is one side of a triangle, and it is shorter than the other two sides put together.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 9
  {
    id: 'm9_parallelogram_area', subj: 'maths', cls: 9, ch: C9a, title: X('Area of a parallelogram and a triangle'),
    aim: X('To cut and rearrange a paper parallelogram into a rectangle, and to cut another along its diagonal, to find the areas of a parallelogram and a triangle.'),
    kind: X('Area by cutting and rearranging'),
    setup(K) { const pg = K.add(K.MT3.parallelogramCut(), 0, -0.56); view(K, pg, 0.3, 0.38, 0); return { pg }; },
    steps: [
      { do: X('Take a parallelogram with base 10 cm. The red dotted line is its height: the straight distance from the base to the top side, 6 cm.'), target: 'pg',
        act: async (K, o) => { tagAt(K, o.pg.at('base1'), 'b = 10 cm', 3.2, 0, -0.02); await tagAt(K, o.pg.at('h1'), 'h = 6 cm', 3.2, -0.04, 0.02); K.lab.emit('look', { obj: o.pg.id }); }, ev: { type: 'look' },
        see: X('The height meets the base at a right angle, inside the parallelogram.') },
      { do: X('Cut along the height, so a right triangle comes off the left end.'), target: 'pg',
        act: async (K, o) => { await K.tween(1.4, (k) => o.pg.cut(k)); K.lab.emit('cut', { obj: o.pg.id }); }, ev: { type: 'cut' },
        see: X('Two pieces: a right triangle and the rest of the parallelogram.') },
      { do: X('Slide the triangle to the other end and fit it against the slanting side.'), target: 'pg',
        act: async (K, o) => { await K.tween(2.6, (k) => o.pg.slide(k)); K.lab.emit('arrange', { obj: o.pg.id }); await tagAt(K, o.pg.at('top'), tl(K, W.rect), 3.4, 0, 0.03); }, ev: { type: 'arrange' },
        see: X('The pieces make a rectangle 10 cm long and 6 cm wide.'),
        why: X('No paper was added or lost, so the parallelogram has the same area as the rectangle: base × height = 10 × 6 = 60 square centimetres.') },
      { do: X('Cut the second parallelogram along its diagonal, and turn the blue triangle half round onto the green one.'), target: 'pg',
        act: async (K, o) => { o.pg.diag.visible = true; await K.sleep(0.8); await K.tween(2.8, (k) => o.pg.turn(k)); K.lab.emit('turn', { obj: o.pg.id }); await tagAt(K, o.pg.at('tri'), tl(K, W.twin), 3.4, 0, 0.05); }, ev: { type: 'turn' },
        see: X('The blue triangle covers the green one exactly: the diagonal cuts the parallelogram into two equal triangles.') },
      { do: X('Work out the area of one triangle.'), target: 'pg',
        act: async (K, o) => { await tagAt(K, o.pg.at('tri'), '½ × 10 × 6 = 30 cm²', 4, 0, 0.06); K.lab.emit('calc', { obj: o.pg.id }); }, ev: { type: 'calc' },
        see: X('Each triangle is half of the parallelogram: half of 10 × 6, that is 30 square centimetres.'),
        why: X('A triangle with base b and height h is half of a parallelogram with the same base and height, so its area is ½ × b × h.') },
    ],
    eq: { word: 'Area of a parallelogram and a triangle', sym: 'A = b × h  ·  A△ = ½ × b × h' },
    result: { obs: X('The parallelogram rearranged into a 10 cm × 6 cm rectangle, and its diagonal cut it into two triangles that matched exactly.'),
      concl: X('The area of a parallelogram is base × height. The area of a triangle is half of base × height.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Find the area of a parallelogram with base 12 cm and height 5 cm.'), a: X('12 × 5 = 60 square centimetres.') },
        { q: X('A triangle has base 8 cm and height 7 cm. Find its area.'), a: X('½ × 8 × 7 = 28 square centimetres.') },
        { q: X('Why do we use the height and not the slanting side?'), a: X('The slanting side is longer than the height; after cutting and sliding, the width of the rectangle is the height, not the slanting side.') }] },
  },
  {
    id: 'm9_coordinates', subj: 'maths', cls: 9, ch: C9b, title: X('Plotting points on a coordinate grid'),
    aim: X('To plot points on a coordinate grid by moving along the x-axis and then the y-axis, and to see the signs of the coordinates in the four quadrants.'),
    kind: X('Coordinates'),
    setup(K) { const cg = K.add(K.MT3.coordGrid(), 0, -0.56); view(K, cg, 0.3, 0.44, 0); return { cg }; },
    steps: [
      { do: X('Look at the grid. The x-axis goes across and the y-axis goes up. They cross at the origin O, the point (0, 0).'), target: 'cg',
        act: async (K, o) => { await tagAt(K, o.cg.at('O'), 'O (0, 0)', 3, -0.03, 0.03); K.lab.emit('look', { obj: o.cg.id }); }, ev: { type: 'look' },
        see: X('Numbers to the right of O and above O are positive; to the left and below they are negative.') },
      { do: X('Plot A (3, 2): from O move 3 to the right along the x-axis, then 2 up.'), target: 'cg',
        act: async (K, o) => { await K.tween(2.4, (k) => o.cg.place(0, k)); K.lab.emit('plot', { obj: o.cg.id }); await tagAt(K, o.cg.at('A'), 'A (3, 2)', 3, 0.03, 0.03); }, ev: { type: 'plot' },
        see: X('The first number tells how far across, the second how far up. A is at (3, 2).'),
        why: X('The order matters: (3, 2) and (2, 3) are different points. The first coordinate is the x-coordinate, the second is the y-coordinate.') },
      { do: X('Plot B (−2, 4): move 2 to the left, then 4 up.'), target: 'cg',
        act: async (K, o) => { await K.tween(2.4, (k) => o.cg.place(1, k)); K.lab.emit('plot', { obj: o.cg.id }); await tagAt(K, o.cg.at('B'), 'B (−2, 4)', 3, 0.03, 0.03); }, ev: { type: 'plot' },
        see: X('A negative x-coordinate means the point is to the left of the y-axis.') },
      { do: X('Plot C (−4, −3) and D (2, −3).'), target: 'cg',
        act: async (K, o) => { await K.tween(2.2, (k) => o.cg.place(2, k)); tagAt(K, o.cg.at('C'), 'C (−4, −3)', 3, 0.03, 0.03); await K.tween(2.2, (k) => o.cg.place(3, k)); K.lab.emit('plot', { obj: o.cg.id }); await tagAt(K, o.cg.at('D'), 'D (2, −3)', 3, 0.03, 0.03); }, ev: { type: 'plot' },
        see: X('A negative y-coordinate means the point is below the x-axis. C and D are on the same horizontal line, because both have y = −3.') },
      { do: X('Look at the four parts of the grid, the quadrants, and the signs of the points in each.'), target: 'cg',
        act: async (K, o) => { o.cg.showQuads(true); K.lab.emit('look', { obj: o.cg.id }); await tagAt(K, o.cg.at('O'), tl(K, W.quads), 3.6, 0.04, 0.06); }, ev: { type: 'look' },
        see: X('In the first quadrant x and y are both positive; in the second x is negative and y positive; in the third both are negative; in the fourth x is positive and y negative. A, B, C and D are one in each quadrant.') },
    ],
    eq: { word: 'A point on the grid', sym: 'P (x, y)  ·  I (+, +)  II (−, +)  III (−, −)  IV (+, −)' },
    result: { obs: X('A (3, 2), B (−2, 4), C (−4, −3) and D (2, −3) were plotted by moving across first and then up or down.'),
      concl: X('Every point on a plane has a pair of coordinates (x, y). The signs of x and y tell which quadrant the point is in.'),
      safety: X('Keep the counters in their box so they do not get lost or swallowed by small children.'),
      viva: [{ q: X('In which quadrant is the point (−5, 2)?'), a: X('The second quadrant: x is negative and y is positive.') },
        { q: X('Where is every point whose y-coordinate is 0?'), a: X('On the x-axis.') },
        { q: X('How far is the point (0, 4) from the origin?'), a: X('4 units, straight up the y-axis.') }] },
  },
];
