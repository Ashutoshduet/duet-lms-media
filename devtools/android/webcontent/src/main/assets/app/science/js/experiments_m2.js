// Maths, batch 2: Class 6 symmetry (fold a rectangle, turn a pinwheel); Class 8 (a + b)² with algebra tiles;
// Class 9 a² − b² by cutting and rearranging a square; Class 10 the volume of a sphere (two hemisphere bowls of water
// into a cylinder) and the height of a flagpole with a clinometer.
import { DICT } from './exp_i18n.js';
import { DICT_M2 } from './exp_i18n_m2.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 9 · Symmetry', 'अध्याय 9 · सममिति', 'Ch 9 · Symmetry (sammiti)');
const C8 = N('Ch 6 · We Distribute, Yet Things Multiply', 'अध्याय 6 · हम बाँटते हैं, फिर भी चीज़ें गुणा होती हैं', 'Ch 6 · We Distribute, Yet Things Multiply');
const C9 = N('Ch 4 · Exploring Algebraic Identities', 'अध्याय 4 · बीजीय सर्वसमिकाओं की खोज', 'Ch 4 · Algebraic identities ki khoj');
const C10a = N('Ch 12 · Surface Areas and Volumes', 'अध्याय 12 · पृष्ठीय क्षेत्रफल और आयतन', 'Ch 12 · Surface area aur volume');
const C10b = N('Ch 9 · Some Applications of Trigonometry', 'अध्याय 9 · त्रिकोणमिति के कुछ अनुप्रयोग', 'Ch 9 · Trigonometry ke kuch upyog');
// words shown in the 3D labels
const W = {
  match: X('The halves match exactly'), nomatch: X('The halves do not match'),
  same: X('Looks the same'), full: X('Full turn: 4 times'), cutOut: X('Cut out: b²'), left: X('Left: a² − b²'),
  bowl1: X('1 bowl: ⅓ of the cylinder'), bowl2: X('2 bowls = 1 sphere: ⅔ of the cylinder'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

export const EXPERIMENTS_M2 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_symmetry', subj: 'maths', cls: 6, ch: C6, title: X('Lines of symmetry and turn symmetry'),
    aim: X('To fold paper shapes to find their lines of symmetry, and to turn a card to find how many times it looks the same in one full turn.'),
    kind: X('Symmetry'),
    setup(K) { const cards = K.add(K.MT2.symmetryCards(), 0, -0.56); view(K, cards, 0.3, 0.38, 0.0); return { cards }; },
    steps: [
      { do: X('Fold the first rectangle along the dotted line down its middle, so the orange half turns over onto the white half.'), target: 'cards',
        act: async (K, o) => { await K.tween(2.2, (k) => o.cards.foldA(k)); K.lab.emit('fold', { obj: o.cards.id }); await tagAt(K, o.cards.at('A'), tl(K, W.match), 3, 0, 0.05); }, ev: { type: 'fold' },
        see: X('The orange half covers the white half exactly: no white shows and nothing sticks out.'),
        why: X('A line that folds a shape into two halves that match exactly is a line of symmetry. The two halves are mirror images of each other.') },
      { do: X('Now fold the second rectangle along its diagonal.'), target: 'cards',
        act: async (K, o) => { await K.tween(2.4, (k) => o.cards.foldB(k)); K.lab.emit('fold', { obj: o.cards.id }); await tagAt(K, o.cards.at('Bover'), tl(K, W.nomatch), 3.2, -0.02, 0.06); }, ev: { type: 'fold' },
        see: X('The corners do not meet: part of the orange triangle sticks out, and part of the white one is left uncovered.'),
        why: X('The diagonal of a rectangle is not a line of symmetry (it is only for a square). A rectangle has just two lines of symmetry: the two lines through its middle.') },
      { do: X('Turn the pinwheel card about its pin, a quarter turn (90°) at a time. Watch the black dot to count the turns.'), target: 'cards',
        act: async (K, o) => { for (let q = 1; q <= 4; q++) { await K.tween(1.2, (k) => o.cards.turn(90 * (q - 1 + k))); tagAt(K, o.cards.at('C'), q < 4 ? `${90 * q}°: ${tl(K, W.same)}` : '360°', 1.6, 0.04, 0.05); await K.sleep(0.9); } K.lab.emit('turn', { obj: o.cards.id }); await tagAt(K, o.cards.at('C'), tl(K, W.full), 3, 0.04, 0.06); }, ev: { type: 'turn' },
        see: X('After every quarter turn the card fits its outline and looks exactly the same: 4 times in one full turn.'),
        why: X('A shape that looks the same after a turn of less than a full turn has rotational symmetry. This pinwheel looks the same 4 times in a full turn, so its order of rotational symmetry is 4. It has no line of symmetry at all.') },
    ],
    eq: { word: 'Symmetry', sym: 'Rectangle: 2 lines of symmetry  ·  Pinwheel: rotational symmetry of order 4' },
    result: { obs: X('The middle fold matched exactly, the diagonal fold did not, and the pinwheel looked the same after each quarter turn.'),
      concl: X('A line of symmetry folds a shape into matching halves. A shape has rotational symmetry if it looks the same after part of a full turn; the number of times it looks the same in one full turn is its order of rotational symmetry.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('How many lines of symmetry does a square have?'), a: X('Four: two through the middles of opposite sides and two along the diagonals.') },
        { q: X('Which capital letters of the English alphabet have a vertical line of symmetry? Name three.'), a: X('A, H, M (also O, T, U, V, W, X, Y).') },
        { q: X('What is the order of rotational symmetry of an equilateral triangle?'), a: X('3: it looks the same after turns of 120°, 240° and 360°.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 8
  {
    id: 'm8_square_identity', subj: 'maths', cls: 8, ch: C8, title: X('(a + b)² with algebra tiles'),
    aim: X('To fill a square of side a + b with algebra tiles and see why (a + b)² = a² + 2ab + b².'),
    kind: X('Algebraic identity'),
    setup(K) { const tiles = K.add(K.MT2.squareTiles(), 0, -0.56); view(K, tiles, 0.3, 0.38, -0.005); return { tiles }; },
    steps: [
      { do: X('Draw a square whose side is a + b. Its area is (a + b) × (a + b), that is (a + b)².'), target: 'tiles',
        act: async (K, o) => { o.tiles.frame.visible = true; tagAt(K, o.tiles.at('sideA'), 'a', 3, 0, 0.03); tagAt(K, o.tiles.at('sideB'), 'b', 3, 0, 0.03); tagAt(K, o.tiles.at('leftA'), 'a', 3, -0.03, 0.02); await tagAt(K, o.tiles.at('leftB'), 'b', 3, -0.03, 0.02); K.lab.emit('draw', { obj: o.tiles.id }); }, ev: { type: 'draw' },
        see: X('A square with sides of length a + b, each side marked into a part a and a part b.') },
      { do: X('Place the big blue tile (a × a) in one corner and the small yellow tile (b × b) in the opposite corner.'), target: 'tiles',
        act: async (K, o) => { await K.tween(1.4, (k) => o.tiles.place(0, k)); tagAt(K, o.tiles.at('a2'), 'a²', 2.6, 0, 0.03); await K.tween(1.2, (k) => o.tiles.place(3, k)); K.lab.emit('place', { obj: o.tiles.id }); await tagAt(K, o.tiles.at('b2'), 'b²', 2.6, 0.03, 0.03); }, ev: { type: 'place' },
        see: X('The blue square takes the corner a × a and the yellow square the corner b × b. Two gaps are left.') },
      { do: X('Fill the two gaps with the green tiles (a × b). Turn one of them to fit.'), target: 'tiles',
        act: async (K, o) => { await K.tween(1.4, (k) => o.tiles.place(1, k)); await K.tween(1.6, (k) => o.tiles.place(2, k)); K.lab.emit('place', { obj: o.tiles.id }); tagAt(K, o.tiles.at('ab1'), 'ab', 2.8, 0, 0.03); await tagAt(K, o.tiles.at('ab2'), 'ab', 2.8, 0.03, 0.03); }, ev: { type: 'place' },
        see: X('The two green rectangles fill the gaps exactly. The square is now covered with no gap and no overlap.'),
        why: X('The area of the whole square equals the areas of its four pieces: (a + b)² = a² + ab + ab + b² = a² + 2ab + b².') },
      { do: X('Check with numbers: take a = 5 and b = 3.'), target: 'tiles',
        act: async (K, o) => { tagAt(K, o.tiles.at('frame'), '(5 + 3)² = 8² = 64', 4.4, 0.08, 0.06); await K.sleep(1.2); await tagAt(K, o.tiles.at('ab2'), '25 + 2 × 15 + 9 = 64', 3.6, 0.08, 0.04); K.lab.emit('calc', { obj: o.tiles.id }); }, ev: { type: 'calc' },
        see: X('Both ways give 64: (5 + 3)² = 64 and 5² + 2 × 5 × 3 + 3² = 25 + 30 + 9 = 64.'),
        why: X('(a + b)² is not a² + b²: the two rectangles 2ab are easy to forget. This identity also makes mental sums quick, for example 102² = (100 + 2)² = 10000 + 400 + 4 = 10404.') },
    ],
    eq: { word: 'Square of a sum', sym: '(a + b)² = a² + 2ab + b²' },
    result: { obs: X('The tiles a², ab, ab and b² exactly filled the square of side a + b.'),
      concl: X('(a + b)² = a² + 2ab + b².'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Expand (x + 4)².'), a: X('x² + 8x + 16.') },
        { q: X('Find 51² using the identity.'), a: X('(50 + 1)² = 2500 + 100 + 1 = 2601.') },
        { q: X('Is (a + b)² the same as a² + b²?'), a: X('No. It is bigger by 2ab, the two rectangles.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 9
  {
    id: 'm9_difference_squares', subj: 'maths', cls: 9, ch: C9, title: X('a² − b² by cutting a square'),
    aim: X('To cut a small square from the corner of a bigger square and rearrange what is left into a rectangle, to show that a² − b² = (a + b)(a − b).'),
    kind: X('Algebraic identity'),
    setup(K) { const sq = K.add(K.MT2.diffSquares(), 0, -0.56); view(K, sq, 0.3, 0.38, 0.0); return { sq }; },
    steps: [
      { do: X('Take a square of paper with side a. Its area is a².'), target: 'sq',
        act: async (K, o) => { tagAt(K, o.sq.at('sideA'), 'a', 3, 0, 0.03); tagAt(K, o.sq.at('left'), 'a', 3, -0.03, 0.02); await tagAt(K, o.sq.at('square'), 'a²', 3, 0, 0.05); K.lab.emit('look', { obj: o.sq.id }); }, ev: { type: 'look' },
        see: X('A square of side a. A small square of side b is marked in one corner.') },
      { do: X('Cut out the small square of side b from the corner.'), target: 'sq',
        act: async (K, o) => { await K.tween(1.6, (k) => o.sq.cutCorner(k)); K.lab.emit('cut', { obj: o.sq.id }); tagAt(K, o.sq.at('aside'), tl(K, W.cutOut), 3, 0.04, 0.04); await tagAt(K, o.sq.at('square'), tl(K, W.left), 3, 0, 0.06); }, ev: { type: 'cut' },
        see: X('What is left is an L-shape. Its area is a² − b².') },
      { do: X('Cut the L-shape along the red dotted line into two rectangles.'), target: 'sq',
        act: async (K, o) => { o.sq.cut.visible = true; await K.sleep(1); K.lab.emit('cut', { obj: o.sq.id }); }, ev: { type: 'cut' },
        see: X('An orange strip a long and a − b wide, and a blue piece a − b long and b wide.') },
      { do: X('Turn the blue piece and place it at the end of the orange strip.'), target: 'sq',
        act: async (K, o) => { await K.tween(2.4, (k) => o.sq.move(k)); K.lab.emit('arrange', { obj: o.sq.id }); tagAt(K, o.sq.at('long'), 'a + b', 3.4, 0, 0.03); await tagAt(K, o.sq.at('short'), 'a − b', 3.4, 0.03, 0.02); }, ev: { type: 'arrange' },
        see: X('The two pieces make one long rectangle: its length is a + b and its width is a − b.'),
        why: X('Only the pieces were moved, so the area is still a² − b². The rectangle\'s area is length × width = (a + b)(a − b). So a² − b² = (a + b)(a − b).') },
      { do: X('Check with numbers: a = 7 and b = 3.'), target: 'sq',
        act: async (K, o) => { await tagAt(K, o.sq.at('rect'), '7² − 3² = 49 − 9 = 40 = 10 × 4', 4, 0.04, 0.07); K.lab.emit('calc', { obj: o.sq.id }); }, ev: { type: 'calc' },
        see: X('49 − 9 = 40, and (7 + 3)(7 − 3) = 10 × 4 = 40.') },
    ],
    eq: { word: 'Difference of two squares', sym: 'a² − b² = (a + b)(a − b)' },
    result: { obs: X('After the corner square was cut out, the rest made a rectangle of length a + b and width a − b.'),
      concl: X('a² − b² = (a + b)(a − b).'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Find 53² − 47² quickly.'), a: X('(53 + 47)(53 − 47) = 100 × 6 = 600.') },
        { q: X('Factorise x² − 25.'), a: X('(x + 5)(x − 5).') },
        { q: X('Find 99 × 101 using the identity.'), a: X('(100 − 1)(100 + 1) = 100² − 1² = 9999.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 10
  {
    id: 'm10_sphere_volume', subj: 'maths', cls: 10, ch: C10a, title: X('Volume of a sphere'),
    aim: X('To find, by pouring water, what part of a cylinder a sphere fills when the cylinder fits just around it.'),
    kind: X('Volume of a sphere'),
    setup(K) {
      const bowl = K.add(K.MT2.hemisphere(), -0.02, -0.56); K.add(K.MT.coneStand(bowl), -0.02, -0.56);
      const cyl = K.add(K.MT.cylinder({ ml: 3 * bowl.maxMl, name: { en: 'Cylinder (radius 3 cm, height 6 cm)', hi: 'बेलन — त्रिज्या 3 cm, ऊँचाई 6 cm', hg: 'Cylinder — radius 3 cm, height 6 cm' } }), 0.12, -0.56);
      const jug = K.beaker(-0.17, -0.55, 'water', 246, 250); K.lab.fill(jug, 'ink', 3); // a little ink, so the water shows
      return { bowl, cyl, jug };
    },
    steps: [
      { do: X('Two hemisphere bowls make one sphere of radius 3 cm. The cylinder has the same radius, and its height is the sphere\'s diameter, 6 cm, so the sphere would fit just inside it. Fill the bowl with water.'), target: 'jug',
        act: async (K, o) => { await K.pour(o.jug, o.bowl, o.bowl.maxMl * 0.985); }, ev: { type: 'pour', from: 'jug', to: 'bowl' },
        see: X('The hemisphere bowl is full of water.') },
      { do: X('Pour the bowl into the cylinder.'), target: 'bowl',
        act: async (K, o) => { await K.pour(o.bowl, o.cyl, o.bowl.ml + 1); await tagAt(K, o.cyl.g.position.clone().add(V(K, 0, o.cyl.heightFor(o.cyl.ml), 0)), tl(K, W.bowl1), 3, 0.07, 0.03); }, ev: { type: 'pour', from: 'bowl', to: 'cyl' },
        see: X('The water reaches the first line: one hemisphere fills one third of the cylinder.') },
      { do: X('Fill the bowl again and pour it in: two hemispheres make the whole sphere.'), target: 'bowl',
        act: async (K, o) => { await K.pour(o.jug, o.bowl, o.bowl.maxMl * 0.985); await K.pour(o.bowl, o.cyl, o.bowl.ml + 1); K.lab.emit('fill', { obj: o.cyl.id }); await tagAt(K, o.cyl.g.position.clone().add(V(K, 0, o.cyl.heightFor(o.cyl.ml), 0)), tl(K, W.bowl2), 3.4, 0.08, 0.03); }, ev: { type: 'fill' },
        see: X('The water stands at the second line: the sphere fills two thirds of the cylinder around it.'),
        why: X('Archimedes found this more than 2,000 years ago. The cylinder holds πr² × 2r = 2πr³, so the sphere holds ⅔ × 2πr³ = 4/3 πr³.') },
      { do: X('Work out the volumes for r = 3 cm.'), target: 'cyl',
        act: async (K, o) => { tagAt(K, o.cyl.mouthWorld(), 'π × 3² × 6 ≈ 170 cm³', 4, 0.08, 0.05); await K.sleep(1); await tagAt(K, o.bowl.mouthWorld(), '4/3 × π × 3³ ≈ 113 cm³', 3.6, -0.07, 0.06); K.lab.emit('calc', { obj: o.cyl.id }); }, ev: { type: 'calc' },
        see: X('Cylinder: about 170 cm³. Sphere: 4/3 × π × 27 ≈ 113 cm³, two thirds of 170. One hemisphere: about 57 cm³.') },
    ],
    eq: { word: 'Volume of a sphere', sym: 'V = 4/3 πr³  ·  hemisphere: ⅔ πr³' },
    result: { obs: X('Two hemisphere bowls of water filled two thirds of the cylinder that fits around the sphere.'),
      concl: X('The volume of a sphere is two thirds of the cylinder around it: V = 4/3 πr³. A hemisphere holds ⅔ πr³.'),
      safety: X('Wipe up any spilt water so that the table does not get slippery.'),
      viva: [{ q: X('Find the volume of a sphere of radius 3 cm (π = 3.14).'), a: X('4/3 × 3.14 × 27 = 113.04 cm³.') },
        { q: X('How many times bigger is the volume when the radius is doubled?'), a: X('8 times, because the volume depends on r³.') },
        { q: X('A hemisphere bowl has radius 7 cm. How much water can it hold (π = 22/7)?'), a: X('⅔ × 22/7 × 343 ≈ 718.7 cm³, about 719 mL.') }] },
  },
  {
    id: 'm10_flagpole_height', subj: 'maths', cls: 10, ch: C10b, title: X('Height of a flagpole with a clinometer'),
    aim: X('To find the height of a flagpole without climbing it, from the distance to its foot and the angle of elevation of its top.'),
    kind: X('Heights and distances'),
    setup(K) { const pole = K.add(K.MT2.poleAndClinometer(), 0, -0.6); pole.camView = { p: V(K, -0.01, 0.28, 0.52), t: V(K, 0.0, 0.155, -0.02) }; return { pole }; },
    steps: [
      { do: X('Stand the clinometer 25 cm from the foot of the model flagpole. Measure the distance with the tape.'), target: 'pole',
        act: async (K, o) => { o.pole.tapeOn(true); K.lab.emit('measure', { obj: o.pole.id }); await tagAt(K, o.pole.at('tape'), 'd = 25 cm', 3, 0, 0.03); }, ev: { type: 'measure' },
        see: X('The distance from the clinometer to the foot of the pole is 25 cm. The straw is 3 cm above the table, like the height of your eye.') },
      { do: X('Look at the top of the pole through the straw. The thread with the weight hangs straight down and shows the angle on the protractor.'), target: 'pole',
        act: async (K, o) => { await K.tween(2, (k) => o.pole.aim(45, k)); await K.tween(1.2, (k) => o.pole.sightOn(k)); K.lab.emit('sight', { obj: o.pole.id }); await tagAt(K, o.pole.at('clin'), 'θ = 45°', 3, -0.02, 0.04); }, ev: { type: 'sight' },
        see: X('The angle of elevation of the top of the pole is 45°.') },
      { do: X('Work out the height: the height above the eye is d × tan θ. Then add the height of the eye.'), target: 'pole',
        act: async (K, o) => { await tagAt(K, o.pole.at('mid'), 'h = 25 × tan 45° + 3 = 25 × 1 + 3 = 28 cm', 4.6, 0.02, 0.06); K.lab.emit('calc', { obj: o.pole.id }); }, ev: { type: 'calc' },
        see: X('25 × tan 45° = 25 × 1 = 25 cm above the eye, so the pole is 25 + 3 = 28 cm tall.'),
        why: X('The line of sight, the level line from the eye and the pole make a right triangle. tan θ = opposite side ÷ adjacent side = (height above the eye) ÷ d, so height above the eye = d × tan θ.') },
      { do: X('Check from closer: move the clinometer to 14.4 cm from the pole and look at the top again.'), target: 'pole',
        act: async (K, o) => { o.pole.sightOn(0); await K.tween(1.6, (k) => { o.pole.setDist(0.25 - (0.25 - 0.144) * k); o.pole.aim(45, 1 - k); }); await K.tween(2, (k) => o.pole.aim(60, k)); await K.tween(1.2, (k) => o.pole.sightOn(k)); K.lab.emit('sight', { obj: o.pole.id });
          tagAt(K, o.pole.at('clin'), 'θ = 60°', 3.4, -0.02, 0.04); await K.sleep(1); await tagAt(K, o.pole.at('mid'), '14.4 × tan 60° + 3 ≈ 14.4 × 1.73 + 3 ≈ 28 cm', 4.6, 0.02, 0.06); }, ev: { type: 'sight' },
        see: X('Closer to the pole the angle is bigger, 60°, but the height comes out the same: about 28 cm.'),
        why: X('This is how surveyors find the heights of towers, trees and mountains, and how the height of Mount Everest was first measured.') },
    ],
    eq: { word: 'Height from the angle of elevation', sym: 'h = d × tan θ + eye height' },
    result: { obs: X('From 25 cm the angle of elevation was 45°, and from 14.4 cm it was 60°. Both gave a height of about 28 cm.'),
      concl: X('The height of an object can be found from the distance to its foot and the angle of elevation of its top: h = d × tan θ (plus the height of the eye).'),
      safety: X('Never look at the Sun through the straw or any other sighting tube.'),
      viva: [{ q: X('From 30 m away the angle of elevation of the top of a tower is 45°. How tall is the tower (ignore eye height)?'), a: X('30 × tan 45° = 30 × 1 = 30 m.') },
        { q: X('As you walk towards a tower, what happens to the angle of elevation of its top?'), a: X('It increases.') },
        { q: X('From 10 m away the angle of elevation is 60°. How tall is the pole?'), a: X('10 × tan 60° = 10 × √3 ≈ 17.3 m.') }] },
  },
];
