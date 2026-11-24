// Maths, batch 9: Class 7 congruent triangles found by placing one paper triangle on another (lifting, turning and
// flipping it over), and a bigger triangle with the same angles that is not a twin; Class 10 the sum of the first n
// terms of an AP, from two equal staircases of unit cubes that fit together into a rectangle.
import { DICT } from './exp_i18n.js';
import { DICT_M9 } from './exp_i18n_m9.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M9);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C7 = N('Part 2 · Ch 1 · Geometric Twins', 'भाग 2 · अध्याय 1 · ज्यामितीय जुड़वाँ', 'Part 2 · Ch 1 · Geometric Twins (jyamitiya judwaan)');
const C10 = N('Ch 5 · Arithmetic Progressions', 'अध्याय 5 · समांतर श्रेढ़ियाँ', 'Ch 5 · Arithmetic Progressions (samantar shredhiyan)');
// words shown in the 3D labels
const W = {
  twin: X('A twin of ABC?'), nofit: X('Does not fit!'), fits: X('Fits exactly'), bigger: X('Bigger: not a twin'),
  cols: X('5 columns'), each: X('Each column: 8 cubes'), rect: X('A rectangle'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

export const EXPERIMENTS_M9 = [
  // ------------------------------------------------------------------------------------------------ Class 7
  {
    id: 'm7_triangle_twins', subj: 'maths', cls: 7, ch: C7, title: X('Twin triangles: placing one triangle on another'),
    aim: X('To find out which paper triangles are exact copies (congruent) of triangle ABC by placing one on the other, and to see that equal sides make twin triangles.'),
    kind: X('Congruence by superposition'),
    setup(K) { const tw = K.add(K.MT9.triangleTwins(), 0, -0.56); view(K, tw, 0.26, 0.36); return { tw }; },
    steps: [
      { do: X('Look at the three paper triangles ABC, PQR and XYZ.'), target: 'tw',
        act: async (K, o) => { o.tw.reset(); tagAt(K, o.tw.at('pqr'), tl(K, W.twin), 3, 0, 0.02); await tagAt(K, o.tw.at('xyz'), tl(K, W.twin), 3, 0, 0.02); K.lab.emit('look', { obj: o.tw.id }); }, ev: { type: 'look' },
        see: X('PQR is turned a different way, and XYZ looks bigger. Which of them is an exact copy of ABC?') },
      { do: X('Measure the three sides of each triangle with a ruler.'), target: 'tw',
        act: async (K, o) => { await K.tween(2.4, (k) => o.tw.measure(k)); K.lab.emit('measure', { obj: o.tw.id }); await K.sleep(1.2); }, ev: { type: 'measure' },
        see: X('ABC and PQR both have sides of 6 cm, 5 cm and 4 cm. The sides of XYZ are longer: 9 cm, 7.5 cm and 6 cm.') },
      { do: X('Lift triangle PQR, turn it and lay it on triangle ABC.'), target: 'tw',
        act: async (K, o) => { await K.tween(2.6, (k) => o.tw.tryPlace(k)); K.lab.emit('place', { obj: o.tw.id }); await tagAt(K, o.tw.at('below'), tl(K, W.nofit), 3, 0, 0.0); }, ev: { type: 'place' },
        see: X('However we turn it, PQR does not cover ABC. Its corners stick out on the wrong sides.'),
        why: X('PQR is lying the other side up. It is a mirror image of ABC on the table.') },
      { do: X('Now flip PQR over, and lay it on ABC again.'), target: 'tw',
        act: async (K, o) => { await K.tween(2.8, (k) => o.tw.flipPlace(k)); K.lab.emit('flip', { obj: o.tw.id }); tagAt(K, o.tw.at('A'), 'A ↔ P', 3.4, 0, 0.0); tagAt(K, o.tw.at('B'), 'B ↔ Q', 3.4, 0, 0.0); tagAt(K, o.tw.at('C'), 'C ↔ R', 3.4, 0, 0.02); await tagAt(K, o.tw.at('below'), tl(K, W.fits), 3.4, 0, 0.0); }, ev: { type: 'flip' },
        see: X('Now PQR covers ABC exactly. P lies on A, Q on B and R on C. The two triangles are twins: they are congruent.'),
        why: X('Turning or flipping a shape does not change its sides or its angles, so it is still the same shape.') },
      { do: X('Put PQR back. Lay ABC on XYZ, with corner A on corner X.'), target: 'tw',
        act: async (K, o) => { await K.tween(3, (k) => o.tw.onBig(k)); K.lab.emit('place', { obj: o.tw.id }); await tagAt(K, o.tw.at('big'), tl(K, W.bigger), 3.4, 0, 0.0); }, ev: { type: 'place' },
        see: X('The corners of ABC fit the corners of XYZ, so the angles are the same. But XYZ sticks out all round: it is bigger, so it is not a twin.') },
      { do: X('Write down the twins with their matching corners.'), target: 'tw',
        act: async (K, o) => { await K.tween(1.6, (k) => o.tw.backHome(k)); tagAt(K, o.tw.at('front'), 'ΔABC ≅ ΔPQR', 4.2, 0, 0.03); await tagAt(K, o.tw.at('below'), 'AB = PQ, BC = QR, CA = RP', 4.2, 0, -0.02); K.lab.emit('write', { obj: o.tw.id }); }, ev: { type: 'write' },
        see: X('Triangle ABC is congruent to triangle PQR. We write the matching corners in the same order.'),
        why: X('If the three sides of one triangle are equal to the three sides of another, the two triangles are congruent. This is the SSS condition.') },
    ],
    eq: { word: 'Congruent triangles', sym: 'ΔABC ≅ ΔPQR' },
    result: { obs: X('PQR covered ABC exactly only after it was flipped over. XYZ had the same angles as ABC but was bigger.'),
      concl: X('Two figures are congruent when one can be placed exactly on the other, even if we have to turn or flip it. Triangles with three equal sides are congruent, but triangles with only equal angles need not be.'),
      safety: X('Use scissors carefully, with the points away from you.'),
      viva: [{ q: X('What does congruent mean?'), a: X('Exactly the same shape and size, so that one figure can be placed on the other and cover it exactly.') },
        { q: X('Are two triangles with the same three angles always congruent?'), a: X('No. One can be a bigger copy of the other, like XYZ and ABC.') },
        { q: X('If ΔABC ≅ ΔPQR, which side is equal to BC?'), a: X('QR, because B matches Q and C matches R.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 10
  {
    id: 'm10_ap_sum', subj: 'maths', cls: 10, ch: C10, title: X('Sum of an AP with two staircases of cubes'),
    aim: X('To find the sum of the first n terms of an AP by fitting two equal staircases of unit cubes into a rectangle.'),
    kind: X('Sum of the first n terms of an AP'),
    setup(K) { const ap = K.add(K.MT9.apStairs(), 0, -0.56); view(K, ap, 0.28, 0.4, -0.02); return { ap }; },
    steps: [
      { do: X('Make columns of 2, 3, 4, 5 and 6 unit cubes, side by side. Each column has 1 cube more than the one before.'), target: 'ap',
        act: async (K, o) => { o.ap.reset(); await K.tween(3.2, (k) => o.ap.buildA(k)); K.lab.emit('build', { obj: o.ap.id }); await tagAt(K, o.ap.at('left'), 'a = 2, d = 1, n = 5', 3.4, -0.04, 0.02); }, ev: { type: 'build' },
        see: X('The columns make a staircase. The numbers of cubes, 2, 3, 4, 5, 6, are the first 5 terms of an AP with first term 2 and common difference 1.') },
      { do: X('We want the total number of cubes. Make a second staircase, just the same, with blue cubes.'), target: 'ap',
        act: async (K, o) => { await K.tween(3.2, (k) => o.ap.buildB(k)); K.lab.emit('build', { obj: o.ap.id }); await tagAt(K, o.ap.at('right'), 'S₅ = 2 + 3 + 4 + 5 + 6', 3.4, 0, 0.04); }, ev: { type: 'build' },
        see: X('Both staircases have the same number of cubes: the sum of the first 5 terms.') },
      { do: X('Turn the blue staircase half round, and fit it on the first one.'), target: 'ap',
        act: async (K, o) => { await K.tween(3.4, (k) => o.ap.fit(k)); K.lab.emit('fit', { obj: o.ap.id }); await tagAt(K, o.ap.at('side'), tl(K, W.rect), 3, 0, 0.02); }, ev: { type: 'fit' },
        see: X('The two staircases fit together exactly and make a rectangle.'),
        why: X('Where one staircase is short, the turned one is tall, so every column is filled to the same height.') },
      { do: X('Count the cubes in each column of the rectangle.'), target: 'ap',
        act: async (K, o) => { await K.tween(1.8, (k) => o.ap.totals(k)); K.lab.emit('count', { obj: o.ap.id }); tagAt(K, o.ap.at('side'), tl(K, W.each), 3.6, 0, 0.02); await tagAt(K, o.ap.at('foot'), '2 + 6 = 3 + 5 = … = 8', 3.6, 0, -0.01); }, ev: { type: 'count' },
        see: X('Every column has 8 cubes: the first term 2 plus the last term 6. The rectangle has 5 columns, so 5 × 8 = 40 cubes.') },
      { do: X('Take half of the rectangle to find the sum.'), target: 'ap',
        act: async (K, o) => { tagAt(K, o.ap.at('side'), '2 × S₅ = 5 × 8 = 40', 4, 0, 0.02); await tagAt(K, o.ap.at('foot'), 'S₅ = 40 ÷ 2 = 20', 4, 0, -0.01); K.lab.emit('calc', { obj: o.ap.id }); }, ev: { type: 'calc' },
        see: X('One staircase is half of the rectangle, so 2 + 3 + 4 + 5 + 6 = 20.') },
      { do: X('Write the formula for the sum of the first n terms.'), target: 'ap',
        act: async (K, o) => { tagAt(K, o.ap.at('side'), 'Sₙ = n/2 × [2a + (n − 1)d]', 4.4, 0, 0.02); await tagAt(K, o.ap.at('foot'), '5/2 × [4 + 4] = 20', 4.4, 0, -0.01); K.lab.emit('formula', { obj: o.ap.id }); }, ev: { type: 'formula' },
        see: X('For n terms, the rectangle has n columns, each of height first term plus last term, that is 2a + (n − 1)d. The sum is half of it.') },
    ],
    eq: { word: 'Sum of the first n terms of an AP', sym: 'Sₙ = n/2 × [2a + (n − 1)d]' },
    result: { obs: X('The two staircases made a rectangle of 5 columns with 8 cubes in each, 40 cubes in all.'),
      concl: X('The sum of the first n terms of an AP is half of n × (2a + (n − 1)d), that is, half of n × (the first term + the last term). Here 2 + 3 + 4 + 5 + 6 = 20.'),
      safety: X('Keep the cubes on the tray so that they do not fall and get lost.'),
      viva: [{ q: X('Find the sum 1 + 2 + 3 + … + 10 with the same idea.'), a: X('Two staircases make 10 columns of 11 cubes, 110 cubes. Half of it is 55.') },
        { q: X('Why does every column of the rectangle have the same height?'), a: X('Because one staircase goes up by d in each column and the turned one goes down by d, so their total stays the same.') },
        { q: X('Write the sum using the first term a and the last term l.'), a: X('Sₙ = n/2 × (a + l).') }] },
  },
];
