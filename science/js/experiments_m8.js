// Maths, batch 8: Class 7 multiplying two fractions by folding a paper rectangle into 3 columns and 4 rows and shading
// (2/3 of the paper, then 3/4 of that part); Class 8 the area of a trapezium, by cutting off a triangle at the middle
// of each slanting side and turning it half round, so that the trapezium becomes a rectangle.
import { DICT } from './exp_i18n.js';
import { DICT_M8 } from './exp_i18n_m8.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M8);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C7 = N('Ch 8 · Working with Fractions', 'अध्याय 8 · भिन्नों के साथ काम', 'Ch 8 · Fractions ke saath kaam');
const C8 = N('Part 2 · Ch 7 · Area', 'भाग 2 · अध्याय 7 · क्षेत्रफल', 'Part 2 · Ch 7 · Area (kshetrafal)');
// words shown in the 3D labels
const W = {
  whole: X('The whole paper = 1'), parts12: X('12 equal parts'), rect: X('A rectangle'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

export const EXPERIMENTS_M8 = [
  // ------------------------------------------------------------------------------------------------ Class 7
  {
    id: 'm7_fraction_fold', subj: 'maths', cls: 7, ch: C7, title: X('Multiplying fractions by folding paper'),
    aim: X('To find 3 quarters of 2 thirds of a paper rectangle by folding and shading, and to see why we multiply the numerators and the denominators.'),
    kind: X('Multiplication of fractions: the area model'),
    setup(K) { const ff = K.add(K.MT8.fractionFold(), 0, -0.56); view(K, ff, 0.3, 0.4); return { ff }; },
    steps: [
      { do: X('Take a rectangle of paper. The whole paper is 1.'), target: 'ff',
        act: async (K, o) => { o.ff.reset(); await tagAt(K, o.ff.at('mid'), tl(K, W.whole), 3, 0, 0.02); K.lab.emit('look', { obj: o.ff.id }); }, ev: { type: 'look' },
        see: X('We want to find 3 quarters of 2 thirds of this paper.') },
      { do: X('Fold the paper into 3 equal parts, like a letter, and open it.'), target: 'ff',
        act: async (K, o) => { await K.tween(3.2, (k) => o.ff.foldThirds(k)); K.lab.emit('fold', { obj: o.ff.id }); tagAt(K, o.ff.at('c0'), '1/3', 3, 0, 0.02); tagAt(K, o.ff.at('c2'), '1/3', 3, 0, 0.02); await tagAt(K, o.ff.at('c1'), '1/3', 3, 0, 0.02); }, ev: { type: 'fold' },
        see: X('Two creases split the paper into 3 equal columns. Each column is one third of the paper.') },
      { do: X('Shade 2 of the 3 columns blue.'), target: 'ff',
        act: async (K, o) => { await K.tween(1.2, (k) => o.ff.shadeBlue(k)); K.lab.emit('shade', { obj: o.ff.id }); await tagAt(K, o.ff.at('blue'), '2/3', 3, 0, 0.02); }, ev: { type: 'shade' },
        see: X('The blue part is 2 thirds of the paper.') },
      { do: X('Now fold the paper the other way into 4 equal parts: in half, and in half again. Open it.'), target: 'ff',
        act: async (K, o) => { await K.tween(3.6, (k) => o.ff.foldQuarters(k)); K.lab.emit('fold', { obj: o.ff.id }); await tagAt(K, o.ff.at('mid'), tl(K, W.parts12), 3, 0, 0.02); }, ev: { type: 'fold' },
        see: X('The creases make 3 columns and 4 rows: 3 × 4 = 12 equal small parts.') },
      { do: X('Shade 3 of the 4 rows of the blue part green.'), target: 'ff',
        act: async (K, o) => { await K.tween(1.4, (k) => o.ff.shadeGreen(k)); K.lab.emit('shade', { obj: o.ff.id }); await tagAt(K, o.ff.at('green'), '3/4 × 2/3', 3.2, 0, 0.02); }, ev: { type: 'shade' },
        see: X('The green part is 3 quarters of the blue part, that is, 3 quarters of 2 thirds of the paper.') },
      { do: X('Count the green small parts.'), target: 'ff',
        act: async (K, o) => { await K.tween(2.4, (k) => o.ff.count(k)); K.lab.emit('count', { obj: o.ff.id }); tagAt(K, o.ff.at('right'), '(3 × 2)/(4 × 3) = 6/12', 4.2, 0, 0.03); await tagAt(K, o.ff.at('below'), '3/4 × 2/3 = 1/2', 4.2, 0, 0.0); }, ev: { type: 'count' },
        see: X('6 of the 12 small parts are green. So 3 quarters of 2 thirds is 6 twelfths, which is one half of the paper.'),
        why: X('The green parts make 3 rows of 2, so their number is 3 × 2, the product of the numerators. The whole paper has 4 rows of 3, so 4 × 3 parts, the product of the denominators.') },
    ],
    eq: { word: 'Multiplying two fractions', sym: '¾ × ⅔ = (3 × 2)/(4 × 3) = 6/12 = ½' },
    result: { obs: X('The folds made 12 equal parts. 8 parts were blue, and 6 of them were also green.'),
      concl: X('3 quarters of 2 thirds is 6 twelfths, which is one half. To multiply two fractions, multiply the numerators and multiply the denominators.'),
      safety: X('Use a sheet of scrap paper and crayons or sketch pens. Press the folds with your fingernail, not with a sharp tool.'),
      viva: [{ q: X('Find 1 half of 3 fifths by folding.'), a: X('Fold into 5 columns and shade 3. Fold in half the other way and shade 1 of the 2 rows of the shaded part. 3 of the 10 parts are shaded twice, so the answer is 3 tenths.') },
        { q: X('Is 3 quarters of 2 thirds more than 2 thirds or less?'), a: X('Less. We are taking only a part of the 2 thirds, so the product is less than 2 thirds.') },
        { q: X('Is 2 thirds of 3 quarters the same as 3 quarters of 2 thirds?'), a: X('Yes. Both are 6 twelfths, that is one half. The order of multiplying does not change the product.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 8
  {
    id: 'm8_trapezium_area', subj: 'maths', cls: 8, ch: C8, title: X('Area of a trapezium by cutting and turning'),
    aim: X('To cut a paper trapezium at the middle of its slanting sides and turn the pieces to make a rectangle, and so find the formula for the area of a trapezium.'),
    kind: X('Area by cutting and rearranging'),
    setup(K) { const tz = K.add(K.MT8.trapeziumCut(), 0, -0.56); view(K, tz, 0.28, 0.36); return { tz }; },
    steps: [
      { do: X('Take a paper trapezium ABCD. Its parallel sides AB and DC are 14 cm and 8 cm long. The red dotted line is its height, 6 cm.'), target: 'tz',
        act: async (K, o) => { o.tz.reset(); tagAt(K, o.tz.at('a'), 'AB = a = 14 cm', 3.4, 0, -0.02); tagAt(K, o.tz.at('b'), 'DC = b = 8 cm', 3.4, 0, 0.0); await tagAt(K, o.tz.at('h'), 'h = 6 cm', 3.4, -0.07, 0.0); K.lab.emit('look', { obj: o.tz.id }); }, ev: { type: 'look' },
        see: X('The height is the straight distance between the two parallel sides.') },
      { do: X('Fold each slanting side end to end to find its middle point. Mark I on AD and J on BC, and draw a line through each, at a right angle to AB.'), target: 'tz',
        act: async (K, o) => { await K.tween(1.6, (k) => o.tz.mark(k)); K.lab.emit('mark', { obj: o.tz.id }); tagAt(K, o.tz.at('I'), 'AI = ID', 3, -0.04, 0.02); await tagAt(K, o.tz.at('J'), 'BJ = JC', 3, 0.04, 0.02); }, ev: { type: 'mark' },
        see: X('Each red line cuts a small triangle off a bottom corner of the trapezium.') },
      { do: X('Cut off the triangle at A and turn it half round about I.'), target: 'tz',
        act: async (K, o) => { await K.tween(2.4, (k) => o.tz.turnLeft(k)); K.lab.emit('turn', { obj: o.tz.id }); }, ev: { type: 'turn' },
        see: X('Corner A goes to D, and the triangle fills the gap at the top left exactly.'),
        why: X('IA = ID, so the turned triangle fits the gap. It is the same triangle, so the area does not change.') },
      { do: X('Do the same at B: cut off the triangle and turn it half round about J.'), target: 'tz',
        act: async (K, o) => { await K.tween(2.4, (k) => o.tz.turnRight(k)); K.lab.emit('turn', { obj: o.tz.id }); await tagAt(K, o.tz.at('top'), tl(K, W.rect), 3, 0, 0.0); }, ev: { type: 'turn' },
        see: X('Now the pieces make a rectangle. Its width is the height of the trapezium, 6 cm.') },
      { do: X('Find the length of the rectangle and its area.'), target: 'tz',
        act: async (K, o) => { tagAt(K, o.tz.at('mid'), 'IJ = 22 ÷ 2 = 11 cm', 4.4, 0, 0.02); await tagAt(K, o.tz.at('below'), '11 × 6 = 66 cm²', 4.4, 0, 0.0); K.lab.emit('calc', { obj: o.tz.id }); }, ev: { type: 'calc' },
        see: X('The length of the rectangle is IJ, which is half of 14 + 8, that is 11 cm. Its area is 11 × 6 = 66 square centimetres.'),
        why: X('The bottom side lost a little at each end, and the top side gained the same, so IJ is halfway between 14 cm and 8 cm.') },
      { do: X('Write the formula for the area of a trapezium.'), target: 'tz',
        act: async (K, o) => { tagAt(K, o.tz.at('mid'), 'A = ½ × (a + b) × h', 4.4, 0, 0.02); await tagAt(K, o.tz.at('below'), '½ × 22 × 6 = 66 cm²', 4.4, 0, 0.0); K.lab.emit('formula', { obj: o.tz.id }); }, ev: { type: 'formula' },
        see: X('Area of a trapezium = half of the sum of the parallel sides × the height.') },
    ],
    eq: { word: 'Area of a trapezium', sym: 'A = ½ × (a + b) × h' },
    result: { obs: X('The two corner triangles, turned half round about the middle points I and J, filled the gaps at the top. The trapezium became a rectangle 11 cm long and 6 cm wide.'),
      concl: X('The area of a trapezium is half of the sum of its parallel sides, times the height. Here it is ½ × (14 + 8) × 6 = 66 square centimetres.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('Find the area of a trapezium with parallel sides 10 cm and 6 cm, and height 4 cm.'), a: X('½ × (10 + 6) × 4 = 32 square centimetres.') },
        { q: X('Why do we turn the triangles about the middle points of the slanting sides?'), a: X('Because the middle point cuts the slanting side into two equal parts, so the turned triangle fits the gap exactly.') },
        { q: X('If both parallel sides are equal, what shape is it, and does the formula still work?'), a: X('It is a parallelogram. ½ × (b + b) × h = b × h, the area of a parallelogram, so the formula still works.') }] },
  },
];
