// Maths, batch 1: NCERT activities done with your hands in the 3D lab (VR on Quest, touch on phones).
// Class 6: equivalent fractions with fraction strips. Class 7: angle sum of a triangle (tear the corners). Class 8: cube numbers with unit cubes; squares on the sides of a
// right triangle (Baudhayana–Pythagoras). Class 9: tossing a coin (experimental probability). Class 10: a cone of water
// into a cylinder (volume of a cone); a circle cut into sectors (area of a circle).
import { DICT } from './exp_i18n.js';
import { DICT_M } from './exp_i18n_m.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 7 · Fractions', 'अध्याय 7 · भिन्न', 'Ch 7 · Fractions (bhinn)');
const C7 = N('Ch 7 · A Tale of Three Intersecting Lines', 'अध्याय 7 · तीन प्रतिच्छेदी रेखाओं की कहानी', 'Ch 7 · Teen intersecting lines ki kahani');
const C8a = N('Ch 1 · A Square and A Cube', 'अध्याय 1 · एक वर्ग और एक घन', 'Ch 1 · Ek square aur ek cube');
const C8b = N('Part 2 · Ch 2 · The Baudhayana-Pythagoras Theorem', 'भाग 2 · अध्याय 2 · बौधायन-पाइथागोरस प्रमेय', 'Part 2 · Ch 2 · Baudhayana-Pythagoras theorem');
const C9 = N('Ch 7 · The Mathematics of Maybe: Introduction to Probability', 'अध्याय 7 · ‘शायद’ का गणित: प्रायिकता का परिचय', 'Ch 7 · ‘Shayad’ ka ganit: Probability ka parichay');
const C10a = N('Ch 11 · Areas Related to Circles', 'अध्याय 11 · वृत्तों से संबंधित क्षेत्रफल', 'Ch 11 · Circles se jude area');
const C10b = N('Ch 12 · Surface Areas and Volumes', 'अध्याय 12 · पृष्ठीय क्षेत्रफल और आयतन', 'Ch 12 · Surface area aur volume');
// words shown in the 3D labels
const W = {
  straight: X('A straight line: 180°'), cone1: X('1 cone'), cone3: X('3 cones: full'), sectors: X('16 equal sectors'),
  len: X('Length ≈ half the circumference = πr'), ht: X('Height ≈ r'), next: X('Next: 4³ = 64, 5³ = 125'),
};
// a flat board seen from above and in front, so the paper pieces on it are easy to read
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; }; // aimed a little in front, so the board sits above the step card

export const EXPERIMENTS_M1 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_fraction_wall', subj: 'maths', cls: 6, ch: C6, title: X('Equivalent fractions with fraction strips'),
    aim: X('To lay strips cut into equal parts one below another and find fractions that are equal, such as ½ = 2/4 = 4/8.'),
    kind: X('Equivalent fractions'),
    setup(K) { const wall = K.add(K.MT.fractionWall(), 0, -0.56); view(K, wall, 0.28, 0.36); return { wall }; },
    steps: [
      { do: X('This strip is one whole. Below it, lay a strip of the same length cut into 2 equal parts, and one cut into 3 equal parts.'), target: 'wall',
        act: async (K, o) => { await K.tween(1.4, (k) => o.wall.drop(2, k)); await K.tween(1.6, (k) => o.wall.drop(3, k)); K.lab.emit('lay', { obj: o.wall.id }); }, ev: { type: 'lay' },
        see: X('Each of the 2 parts is one half (½) of the whole; each of the 3 parts is one third (⅓).') },
      { do: X('Now lay strips cut into 4, 6 and 8 equal parts.'), target: 'wall',
        act: async (K, o) => { for (const n of [4, 6, 8]) await K.tween(1.5, (k) => o.wall.drop(n, k)); K.lab.emit('lay', { obj: o.wall.id }); }, ev: { type: 'lay' },
        see: X('The more parts a strip is cut into, the smaller each part is: ⅛ is smaller than ¼, and ¼ is smaller than ½.') },
      { do: X('Find the pieces that together are exactly as long as one half.'), target: 'wall',
        act: async (K, o) => { const sel = { 2: 1 }; o.wall.focus(sel); for (const [n, m] of [[4, 2], [6, 3], [8, 4]]) { await K.sleep(0.7); sel[n] = m; o.wall.focus(sel); } K.lab.emit('compare', { obj: o.wall.id }); await tagAt(K, o.wall.rowEnd(8, 4), '½ = 2/4 = 3/6 = 4/8', 3.6, 0.07, 0.06); }, ev: { type: 'compare' },
        see: X('One half is as long as 2 quarters, 3 sixths and 4 eighths.'),
        why: X('Fractions that name the same part of a whole are called equivalent fractions: ½ = 2/4 = 3/6 = 4/8.') },
      { do: X('Do the same for one third.'), target: 'wall',
        act: async (K, o) => { o.wall.focus({ 3: 1 }); await K.sleep(0.7); o.wall.focus({ 3: 1, 6: 2 }); K.lab.emit('compare', { obj: o.wall.id }); await tagAt(K, o.wall.rowEnd(6, 2), '⅓ = 2/6', 3.4, 0.06, 0.06); }, ev: { type: 'compare' },
        see: X('One third is as long as 2 sixths: ⅓ = 2/6.'),
        why: X('Multiplying the top and the bottom of a fraction by the same number gives an equivalent fraction: 1/3 = (1 × 2)/(3 × 2) = 2/6.') },
    ],
    eq: { word: 'Equivalent fractions', sym: '½ = 2/4 = 3/6 = 4/8  ·  ⅓ = 2/6' },
    result: { obs: X('One half matched 2 quarters, 3 sixths and 4 eighths; one third matched 2 sixths.'),
      concl: X('Different fractions can stand for the same amount. Such fractions are equivalent: ½ = 2/4 = 3/6 = 4/8.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Which is bigger, ⅓ or ¼?'), a: X('⅓, because the whole is cut into fewer parts, so each part is bigger.') },
        { q: X('Write two fractions equivalent to ¾.'), a: X('6/8 and 9/12 (multiply the top and the bottom by 2, or by 3).') },
        { q: X('How many eighths make one whole?'), a: X('8 eighths: 8/8 = 1.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 7
  {
    id: 'm7_angle_sum', subj: 'maths', cls: 7, ch: C7, title: X('Angle sum of a triangle'),
    aim: X('To show, by tearing off the corners of a paper triangle, that the three angles of a triangle add up to 180°.'),
    kind: X('Angle sum property'),
    setup(K) { const tri = K.add(K.MT.triangleTear(), 0, -0.56); view(K, tri); return { tri }; },
    steps: [
      { do: X('Here is a triangle ABC cut out of paper. Its three angles, ∠A, ∠B and ∠C, are marked with coloured arcs.'), target: 'tri',
        act: async (K, o) => { tagAt(K, o.tri.markAt(0, false), '∠A', 2.6, -0.05); tagAt(K, o.tri.markAt(1, false), '∠B', 2.6, 0.04); await tagAt(K, o.tri.markAt(2, false), '∠C', 2.6, 0.04); K.lab.emit('look', { obj: o.tri.id }); }, ev: { type: 'look' },
        see: X('Each corner of the triangle has its angle marked with an arc of a different colour.') },
      { do: X('Tear off the three corners of the triangle, each with its arc.'), target: 'tri',
        act: async (K, o) => { await K.tween(1.4, (k) => o.tri.tear(k)); K.lab.emit('tear', { obj: o.tri.id }); }, ev: { type: 'tear' },
        see: X('Three small pieces of paper, each holding one angle of the triangle.') },
      { do: X('Draw a straight line. Place the three corners on it so that their tips meet at one point and their edges touch, with no gap and no overlap.'), target: 'tri',
        act: async (K, o) => { await K.tween(3.2, (k) => o.tri.lay(k)); K.lab.emit('arrange', { obj: o.tri.id }); await tagAt(K, o.tri.tipWorld(), tl(K, W.straight), 3, 0.06, 0.06); }, ev: { type: 'arrange' },
        see: X('The three angles fit together exactly, and their outer edges lie along the straight line.'),
        why: X('Angles that together make a straight line add up to 180°. So ∠A + ∠B + ∠C = 180°.') },
      { do: X('Check with a protractor: measure the three angles and add them.'), target: 'tri',
        act: async (K, o) => { tagAt(K, o.tri.markAt(0, true, 0.055), '∠A = 50°', 4, 0.06, 0.03); tagAt(K, o.tri.markAt(1, true, 0.055), '∠B = 60°', 4, 0, 0.06); tagAt(K, o.tri.markAt(2, true, 0.055), '∠C = 70°', 4, -0.06, 0.03); await K.sleep(1.2);
          await tagAt(K, o.tri.tipWorld(), '50° + 60° + 70° = 180°', 3.4, 0, 0.1); K.lab.emit('measure', { obj: o.tri.id }); }, ev: { type: 'measure' },
        see: X('∠A = 50°, ∠B = 60° and ∠C = 70°. Together: 50° + 60° + 70° = 180°.'),
        why: X('This works for every triangle, whatever its shape: the three angles of a triangle always add up to 180°.') },
    ],
    eq: { word: 'Angle sum property of a triangle', sym: '∠A + ∠B + ∠C = 180°' },
    result: { obs: X('The three torn corners together made a straight angle, and the measured angles added up to 180°.'),
      concl: X('The sum of the three angles of any triangle is 180°.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Two angles of a triangle are 40° and 75°. What is the third angle?'), a: X('180° − 40° − 75° = 65°.') },
        { q: X('Can a triangle have two right angles?'), a: X('No. Two right angles already make 180°, leaving nothing for the third angle.') },
        { q: X('All three angles of an equilateral triangle are equal. How big is each?'), a: X('180° ÷ 3 = 60°.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 8
  {
    id: 'm8_cube_numbers', subj: 'maths', cls: 8, ch: C8a, title: X('Cube numbers with unit cubes'),
    aim: X('To build cubes out of unit cubes and find the pattern of cube numbers: 1, 8, 27, …'),
    kind: X('Cube numbers'),
    setup(K) { const cubes = K.add(K.MT.unitCubes(), 0.03, -0.56); view(K, cubes, 0.34, 0.3, -0.03); return { cubes }; },
    steps: [
      { do: X('Take one unit cube. Each of its edges is 1 unit long.'), target: 'cubes',
        act: async (K, o) => { await K.tween(1, (k) => o.cubes.build(0, k)); K.lab.emit('build', { obj: o.cubes.id }); await tagAt(K, o.cubes.spotWorld(0), '1 × 1 × 1 = 1', 2.6, -0.04, 0.05); }, ev: { type: 'build' },
        see: X('One unit cube: its volume is 1 cubic unit.') },
      { do: X('Build a bigger cube with 2 unit cubes along each edge.'), target: 'cubes',
        act: async (K, o) => { await K.tween(2.6, (k) => o.cubes.build(1, k)); K.lab.emit('build', { obj: o.cubes.id }); await tagAt(K, o.cubes.spotWorld(1), '2 × 2 × 2 = 8', 2.8, 0, 0.05); }, ev: { type: 'build' },
        see: X('It takes 2 layers of 2 × 2 = 4 cubes: 8 unit cubes in all.') },
      { do: X('Now build a cube with 3 unit cubes along each edge.'), target: 'cubes',
        act: async (K, o) => { await K.tween(4.8, (k) => o.cubes.build(2, k)); K.lab.emit('build', { obj: o.cubes.id }); await tagAt(K, o.cubes.spotWorld(2), '3 × 3 × 3 = 27', 2.8, 0.04, 0.05); }, ev: { type: 'build' },
        see: X('3 layers of 3 × 3 = 9 cubes: 27 unit cubes in all.') },
      { do: X('Write the three numbers in a row and look for the pattern.'), target: 'cubes',
        act: async (K, o) => { tagAt(K, o.cubes.spotWorld(0), '1³ = 1', 4.4, -0.04, 0.05); tagAt(K, o.cubes.spotWorld(1), '2³ = 8', 4.4, 0, 0.05); tagAt(K, o.cubes.spotWorld(2), '3³ = 27', 4.4, 0.04, 0.05); await K.sleep(1.4);
          await tagAt(K, o.cubes.spotWorld(2, 0.09), tl(K, W.next), 3, 0.02, 0.06); K.lab.emit('look', { obj: o.cubes.id }); }, ev: { type: 'look' },
        see: X('1, 8, 27 … The next cubes would need 64 and 125 unit cubes.'),
        why: X('A number multiplied by itself three times (n × n × n = n³) is a cube number. It is the number of unit cubes in a cube with n cubes along each edge.') },
    ],
    eq: { word: 'Cube numbers', sym: 'n³ = n × n × n  ·  1, 8, 27, 64, 125 …' },
    result: { obs: X('Cubes with edges of 1, 2 and 3 units needed 1, 8 and 27 unit cubes.'),
      concl: X('A cube with n unit cubes along each edge is made of n³ unit cubes. Numbers like 1, 8, 27, 64 and 125 are cube numbers.'),
      safety: X('Keep the small cubes on the tray so they do not roll off the table.'),
      viva: [{ q: X('How many unit cubes make a cube with an edge of 4 units?'), a: X('4 × 4 × 4 = 64.') },
        { q: X('Is 100 a cube number?'), a: X('No. 4³ = 64 and 5³ = 125, so 100 lies between two cube numbers.') },
        { q: X('What is the cube of 10?'), a: X('10 × 10 × 10 = 1000.') }] },
  },
  {
    id: 'm8_pythagoras', subj: 'maths', cls: 8, ch: C8b, title: X('Squares on the sides of a right triangle'),
    aim: X('To show with square tiles that, in a right triangle, the square on the longest side equals the other two squares put together.'),
    kind: X('Baudhayana–Pythagoras theorem'),
    setup(K) { const board = K.add(K.MT.pythagorasBoard(), 0, -0.56); view(K, board, 0.32, 0.42, 0.01); return { board }; },
    steps: [
      { do: X('Look at the right triangle. Its two shorter sides are 3 units and 4 units long. The longest side, opposite the right angle, is 5 units: it is called the hypotenuse.'), target: 'board',
        act: async (K, o) => { tagAt(K, o.board.side('a'), '3', 3, 0, 0.05); tagAt(K, o.board.side('b'), '4', 3, -0.05, 0.04); await tagAt(K, o.board.side('c'), '5', 3, 0.04, 0.05); K.lab.emit('look', { obj: o.board.id }); }, ev: { type: 'look' },
        see: X('A right triangle with sides of 3, 4 and 5 units.') },
      { do: X('A square is built on each side. The square on the side of 3 has 9 red tiles; the square on the side of 4 has 16 blue tiles. The square on the hypotenuse is empty: 5 × 5 = 25 cells.'), target: 'board',
        act: async (K, o) => { tagAt(K, o.board.at('a'), '3 × 3 = 9', 3.6, 0.05, 0.04); tagAt(K, o.board.at('b'), '4 × 4 = 16', 3.6, -0.05, 0.05); await tagAt(K, o.board.at('c'), '5 × 5 = 25', 3.6, 0.05, 0.05); K.lab.emit('count', { obj: o.board.id }); }, ev: { type: 'count' },
        see: X('9 red tiles, 16 blue tiles, and 25 empty cells in the big square.') },
      { do: X('Move all the red and blue tiles into the square on the hypotenuse.'), target: 'board',
        act: async (K, o) => { await K.tween(5, (k) => o.board.move(k)); K.lab.emit('move', { obj: o.board.id }); await tagAt(K, o.board.at('c'), '9 + 16 = 25', 3.4, 0.05, 0.05); }, ev: { type: 'move' },
        see: X('The 9 red and 16 blue tiles fill the big square exactly: no tile is left over and no cell is empty.'),
        why: X('The area of the square on the hypotenuse equals the sum of the areas of the squares on the other two sides: 3² + 4² = 5². Baudhayana wrote this in the Shulba Sutras, long before Pythagoras.') },
    ],
    eq: { word: 'Baudhayana–Pythagoras theorem', sym: 'a² + b² = c²  ·  3² + 4² = 5²' },
    result: { obs: X('The 9 + 16 = 25 tiles from the two smaller squares exactly filled the square on the hypotenuse.'),
      concl: X('In a right triangle, the square on the hypotenuse equals the sum of the squares on the other two sides: a² + b² = c².'),
      safety: X('Place the tiles gently and keep the board flat on the table.'),
      viva: [{ q: X('The two shorter sides of a right triangle are 6 cm and 8 cm. How long is the hypotenuse?'), a: X('6² + 8² = 36 + 64 = 100, so the hypotenuse is 10 cm.') },
        { q: X('Which side of a right triangle is the hypotenuse?'), a: X('The longest side, opposite the right angle.') },
        { q: X('Is a triangle with sides 5, 12 and 13 a right triangle?'), a: X('Yes, because 5² + 12² = 25 + 144 = 169 = 13².') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 9
  {
    id: 'm9_coin_probability', subj: 'maths', cls: 9, ch: C9, title: X('Tossing a coin: experimental probability'),
    aim: X('To toss a coin many times and see what happens to the fraction of heads as the number of tosses grows.'),
    kind: X('Experimental probability'),
    setup(K) { const coin = K.add(K.MT.coinTally(), 0, -0.58); coin.camView = { p: V(K, 0.0, 0.22, 0.4), t: V(K, 0.02, 0.07, -0.04) }; return { coin }; },
    steps: [
      { do: X('Toss the coin 10 times. The board counts the tosses and the heads.'), target: 'coin',
        act: async (K, o) => { for (let i = 0; i < 10; i++) { const h = o.coin.next(); await K.tween(0.8, (k) => o.coin.fly(k, h)); o.coin.draw(); } K.lab.emit('toss', { obj: o.coin.id }); }, ev: { type: 'toss' },
        see: X('7 heads in 10 tosses: heads ÷ tosses = 0.70, far from one half.') },
      { do: X('Toss it 40 more times, to make 50 tosses.'), target: 'coin',
        act: async (K, o) => { for (let i = 0; i < 40; i++) { const h = o.coin.next(); await K.tween(0.3, (k) => o.coin.fly(k, h)); o.coin.draw(); } K.lab.emit('toss', { obj: o.coin.id }); }, ev: { type: 'toss' },
        see: X('29 heads in 50 tosses: 0.58. Closer to one half.') },
      { do: X('Now the whole class tosses coins: 450 more tosses, to make 500.'), target: 'coin',
        act: async (K, o) => { for (let i = 0; i < 45; i++) { let h = false; for (let j = 0; j < 10; j++) h = o.coin.next(); await K.tween(0.16, (k) => o.coin.fly(k, h)); o.coin.draw(); } K.lab.emit('toss', { obj: o.coin.id }); }, ev: { type: 'toss' },
        see: X('250 heads in 500 tosses: 0.50. The line on the graph has settled near ½.'),
        why: X('Experimental probability of heads = number of heads ÷ number of tosses. With few tosses it jumps around; with many tosses it comes close to ½, because heads and tails are equally likely.') },
    ],
    eq: { word: 'Experimental probability', sym: 'P(H) = heads ÷ tosses → ½' },
    result: { obs: X('Heads ÷ tosses was 0.70 after 10 tosses, 0.58 after 50 and 0.50 after 500.'),
      concl: X('As the number of tosses grows, the experimental probability of heads comes closer to ½.'),
      safety: X('Toss the coin gently over the table so that it does not roll away.'),
      viva: [{ q: X('A coin is tossed 20 times and shows 12 heads. What is the experimental probability of heads?'), a: X('12 ÷ 20 = 0.6.') },
        { q: X('Does getting 7 heads in 10 tosses mean the coin is unfair?'), a: X('Not necessarily. With only 10 tosses, results far from one half are common; toss many more times before judging.') },
        { q: X('What is the probability of getting tails with a fair coin?'), a: X('½, because there are two equally likely outcomes and one of them is tails.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 10
  {
    id: 'm10_circle_area', subj: 'maths', cls: 10, ch: C10a, title: X('Area of a circle from sectors'),
    aim: X('To cut a circle into sectors, rearrange them into a near-rectangle, and find the area of the circle.'),
    kind: X('Area of a circle'),
    setup(K) { const circ = K.add(K.MT.circleSectors(), 0, -0.56); view(K, circ, 0.3, 0.36, 0.01); return { circ }; },
    steps: [
      { do: X('A paper circle of radius r is cut into 16 equal sectors. Half of them are coloured orange and half blue.'), target: 'circ',
        act: async (K, o) => { await tagAt(K, o.circ.at('circle'), tl(K, W.sectors), 2.8, -0.04, 0.06); K.lab.emit('look', { obj: o.circ.id }); }, ev: { type: 'look' },
        see: X('16 equal slices, like the slices of a round cake.') },
      { do: X('Arrange the sectors in a row, fitting into each other: the orange ones with their curved edge at the bottom, the blue ones with their curved edge at the top.'), target: 'circ',
        act: async (K, o) => { await K.tween(5, (k) => o.circ.arrange(k)); K.lab.emit('arrange', { obj: o.circ.id }); }, ev: { type: 'arrange' },
        see: X('The sectors form a shape very close to a parallelogram, almost a rectangle.') },
      { do: X('Find the length and the height of the new shape.'), target: 'circ',
        act: async (K, o) => { tagAt(K, o.circ.at('len'), tl(K, W.len), 4.2, 0, 0.07); await tagAt(K, o.circ.at('ht'), tl(K, W.ht), 4.2, 0.05, 0.04); K.lab.emit('measure', { obj: o.circ.id }); }, ev: { type: 'measure' },
        see: X('Its length is half the circumference of the circle, πr. Its height is the radius, r.'),
        why: X('The pieces are only rearranged, so the area does not change. Area = length × height = πr × r = πr². With more and thinner sectors the shape becomes a true rectangle.') },
    ],
    eq: { word: 'Area of a circle', sym: 'A = πr × r = πr²' },
    result: { obs: X('The 16 sectors made a near-rectangle of length πr and height r.'),
      concl: X('The area of a circle of radius r is πr².'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Find the area of a circle of radius 7 cm (π = 22/7).'), a: X('22/7 × 7 × 7 = 154 cm².') },
        { q: X('Why does the shape look more like a rectangle when there are more sectors?'), a: X('Thinner sectors have flatter arcs, so the wavy top and bottom edges become almost straight.') },
        { q: X('If the radius is doubled, how many times bigger is the area?'), a: X('Four times, because the area depends on r².') }] },
  },
  {
    id: 'm10_cone_volume', subj: 'maths', cls: 10, ch: C10b, title: X('Volume of a cone'),
    aim: X('To find, by pouring water, how many cones of water fill a cylinder with the same base and height.'),
    kind: X('Volume of a cone'),
    setup(K) {
      const cone = K.add(K.MT.cone(), -0.02, -0.56); K.add(K.MT.coneStand(cone), -0.02, -0.56);
      const cyl = K.add(K.MT.cylinder({ ml: 3 * cone.maxMl }), 0.12, -0.56);
      const jug = K.beaker(-0.17, -0.55, 'water', 246, 250); K.lab.fill(jug, 'ink', 3); // a little ink, so the water shows
      return { cone, cyl, jug };
    },
    steps: [
      { do: X('The cone and the cylinder have the same radius (3 cm) and the same height (8 cm). Fill the cone to the brim with water from the beaker.'), target: 'jug',
        act: async (K, o) => { await K.pour(o.jug, o.cone, o.cone.maxMl * 0.985); }, ev: { type: 'pour', from: 'jug', to: 'cone' },
        see: X('The cone is full of water.') },
      { do: X('Pour the water from the cone into the cylinder.'), target: 'cone',
        act: async (K, o) => { await K.pour(o.cone, o.cyl, o.cone.ml + 1); await tagAt(K, o.cyl.g.position.clone().add(V(K, 0, o.cyl.heightFor(o.cyl.ml), 0)), tl(K, W.cone1), 2.6, 0.06, 0.03); }, ev: { type: 'pour', from: 'cone', to: 'cyl' },
        see: X('The water fills only the bottom third of the cylinder, up to the first line.') },
      { do: X('Fill the cone again and empty it into the cylinder. Do this twice.'), target: 'cone',
        act: async (K, o) => { for (let i = 0; i < 2; i++) { await K.pour(o.jug, o.cone, o.cone.maxMl * 0.985); await K.pour(o.cone, o.cyl, o.cone.ml + 1); } K.lab.emit('fill', { obj: o.cyl.id }); await tagAt(K, o.cyl.mouthWorld(), tl(K, W.cone3), 3, 0.06, 0.03); }, ev: { type: 'fill' },
        see: X('After the third cone the cylinder is full to the brim.'),
        why: X('Three cones of water fill the cylinder, so the volume of a cone is one third of the volume of a cylinder with the same base and height: V = ⅓ πr²h.') },
      { do: X('Work out both volumes for r = 3 cm and h = 8 cm.'), target: 'cyl',
        act: async (K, o) => { tagAt(K, o.cyl.mouthWorld(), 'π × 3² × 8 ≈ 226 cm³', 4, 0.07, 0.05); await K.sleep(1); await tagAt(K, o.cone.mouthWorld(), '⅓ × 226 ≈ 75 cm³', 3.4, -0.07, 0.06); K.lab.emit('calc', { obj: o.cyl.id }); }, ev: { type: 'calc' },
        see: X('Cylinder: π × 3 × 3 × 8 ≈ 226 cm³. Cone: one third of that, about 75 cm³. Since 1 cm³ = 1 mL, that is just what the water showed.') },
    ],
    eq: { word: 'Volume of a cone', sym: 'V = ⅓ πr²h' },
    result: { obs: X('Three cones full of water exactly filled the cylinder with the same radius and height.'),
      concl: X('The volume of a cone is one third of the volume of a cylinder with the same base and height: V = ⅓ πr²h.'),
      safety: X('Wipe up any spilt water so that the table does not get slippery.'),
      viva: [{ q: X('A cylinder holds 300 mL. How much does a cone with the same base and height hold?'), a: X('One third of it: 100 mL.') },
        { q: X('Find the volume of a cone with r = 7 cm and h = 3 cm (π = 22/7).'), a: X('⅓ × 22/7 × 7 × 7 × 3 = 154 cm³.') },
        { q: X('If the height of a cone is doubled, what happens to its volume?'), a: X('It doubles, because the volume is proportional to the height.') }] },
  },
];
