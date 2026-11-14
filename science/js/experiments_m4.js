// Maths, batch 4: Class 6 triangular numbers with balls (two triangles make a rectangle, two neighbours make a square);
// Class 9 folding a paper circle so the ends of a chord meet (the perpendicular from the centre bisects the chord).
import { DICT } from './exp_i18n.js';
import { DICT_M4 } from './exp_i18n_m4.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M4);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 1 · Patterns in Mathematics', 'अध्याय 1 · गणित में पैटर्न', 'Ch 1 · Maths mein patterns');
const C9 = N("Ch 5 · I'm Up and Down, and Round and Round", 'अध्याय 5 · मैं ऊपर-नीचे, और गोल-गोल', 'Ch 5 · Main upar-neeche, aur gol-gol');
// words shown in the 3D labels
const W = {
  tri: X('Triangular numbers'), stair: X('A staircase of 10'), half: X('One triangle = half'), square: X('A square number'),
  onB: X('A falls on B'), crease: X('The crease passes through O'), cross: X('The creases cross at the centre O'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

export const EXPERIMENTS_M4 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_triangular_numbers', subj: 'maths', cls: 6, ch: C6, title: X('Triangular numbers with balls'),
    aim: X('To arrange balls in triangles, to find the triangular numbers 1, 3, 6, 10, and to see why two equal triangles make a rectangle and two triangles next to each other make a square.'),
    kind: X('Number patterns'),
    setup(K) { const tb = K.add(K.MT4.triangleBalls(), 0, -0.56); view(K, tb, 0.27, 0.34, 0); return { tb }; },
    steps: [
      { do: X('Put down 1 ball. Under it put a row of 2 balls, then a row of 3, then a row of 4, each row centred under the one above.'), target: 'tb',
        act: async (K, o) => { const sums = ['1', '1 + 2 = 3', '1 + 2 + 3 = 6', '1 + 2 + 3 + 4 = 10'];
          for (let n = 1; n <= 4; n++) { await K.tween(0.7, (k) => o.tb.showRows(n, k)); await tagAt(K, o.tb.at('tri'), sums[n - 1], 1.6, 0.04, 0.02); }
          K.lab.emit('arrange', { obj: o.tb.id }); await tagAt(K, o.tb.at('apex'), tl(K, W.tri) + ': 1, 3, 6, 10', 3, 0, 0.03); }, ev: { type: 'arrange' },
        see: X('Each time the balls make a triangle: of 1, 3, 6 and then 10 balls. These are the triangular numbers.'),
        why: X('A triangular number counts the balls that can be arranged in a triangle. A triangle with 4 rows has 1 + 2 + 3 + 4 = 10 balls.') },
      { do: X('Push every row to the left, so that all the rows start in one straight line.'), target: 'tb',
        act: async (K, o) => { await K.tween(2, (k) => o.tb.push(k)); o.tb.showRowLabels(true); K.lab.emit('push', { obj: o.tb.id }); await tagAt(K, o.tb.at('tri'), tl(K, W.stair), 3, 0.05, 0.02); }, ev: { type: 'push' },
        see: X('The same 10 balls now make a staircase, with rows of 1, 2, 3 and 4 balls.') },
      { do: X('Make a second triangle of 10 blue balls. Turn it upside down and fit it against the staircase.'), target: 'tb',
        act: async (K, o) => { await K.tween(2.6, (k) => o.tb.bringBlue(k)); o.tb.rectFrame.visible = true; K.lab.emit('fit', { obj: o.tb.id });
          tagAt(K, o.tb.at('rect'), '4 × 5 = 20', 3.4, 0.05, 0.02); await tagAt(K, o.tb.at('below'), tl(K, W.half) + ': 20 ÷ 2 = 10', 3.4, 0, -0.02); }, ev: { type: 'fit' },
        see: X('The two triangles fill a rectangle of 4 rows and 5 columns, that is 20 balls. So one triangle has half of 20, that is 10 balls.'),
        why: X('Two equal triangles always fill a rectangle that is one column wider than it is tall. So a triangle with n rows has n × (n + 1) ÷ 2 balls. For 10 rows that is 10 × 11 ÷ 2 = 55.') },
      { do: X('Take the blue balls away. Fit a triangle of 6 green balls into the gap next to the staircase.'), target: 'tb',
        act: async (K, o) => { o.tb.rectFrame.visible = false; await K.tween(1.2, (k) => o.tb.hideBlue(k)); await K.tween(2.4, (k) => o.tb.bringGreen(k)); o.tb.sqFrame.visible = true; K.lab.emit('fit', { obj: o.tb.id });
          tagAt(K, o.tb.at('sq'), '10 + 6 = 16 = 4 × 4', 3.6, 0.06, 0.02); await tagAt(K, o.tb.at('below'), tl(K, W.square), 3.6, 0, -0.02); }, ev: { type: 'fit' },
        see: X('The triangles of 10 and 6 together make a square of 4 rows of 4: 16 balls.'),
        why: X('Two triangular numbers next to each other always add up to a square number: 1 + 3 = 4, 3 + 6 = 9, 6 + 10 = 16.') },
    ],
    eq: { word: 'Triangular numbers', sym: '1 + 2 + 3 + … + n = n × (n + 1) ÷ 2' },
    result: { obs: X('Rows of 1, 2, 3 and 4 balls made triangles of 1, 3, 6 and 10 balls. Two triangles of 10 filled a 4 × 5 rectangle, and triangles of 10 and 6 filled a 4 × 4 square.'),
      concl: X('The triangular numbers are 1, 3, 6, 10, 15 and so on. A triangle with n rows has n × (n + 1) ÷ 2 balls, and two triangular numbers next to each other add up to a square number.'),
      safety: X('Keep the balls on a cloth or in a tray, so they do not roll off the table and make someone slip.'),
      viva: [{ q: X('What is the next triangular number after 10?'), a: X('15, because the next row has 5 balls: 10 + 5 = 15.') },
        { q: X('Find 1 + 2 + 3 + … + 20 without adding the numbers one by one.'), a: X('20 × 21 ÷ 2 = 210.') },
        { q: X('Which square number do the triangular numbers 15 and 21 make together?'), a: X('15 + 21 = 36, which is 6 × 6.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 9
  {
    id: 'm9_chord_bisector', subj: 'maths', cls: 9, ch: C9, title: X('Folding a circle: the perpendicular from the centre to a chord'),
    aim: X('To fold a paper circle so that the two ends of a chord meet, and to see that the crease passes through the centre and cuts the chord into two equal parts at a right angle.'),
    kind: X('Chords of a circle'),
    setup(K) { const cf = K.add(K.MT4.chordFold(), 0, -0.56); view(K, cf, 0.25, 0.33, 0); return { cf }; },
    steps: [
      { do: X('Take a paper circle with centre O and radius 5 cm. With a ruler, draw a chord AB 8 cm long.'), target: 'cf',
        act: async (K, o) => { await K.tween(2, (k) => o.cf.drawChord(k, 'AB')); K.lab.emit('draw', { obj: o.cf.id }); await tagAt(K, o.cf.at('AB'), 'AB = 8 cm', 3, 0, -0.03); }, ev: { type: 'draw' },
        see: X('A chord joins two points of the circle. AB does not pass through O, so it is not a diameter.') },
      { do: X('Fold the circle so that A falls exactly on B, and press the fold flat.'), target: 'cf',
        act: async (K, o) => { await K.tween(2.6, (k) => o.cf.foldAB(k)); K.lab.emit('fold', { obj: o.cf.id }); await tagAt(K, o.cf.at('B'), tl(K, W.onB), 3, 0.03, 0.03); }, ev: { type: 'fold' },
        see: X('The half of the chord on the left lies exactly on the half on the right.') },
      { do: X('Unfold the paper. Mark M where the crease cuts AB, and measure AM, MB and the angle at M.'), target: 'cf',
        act: async (K, o) => { await K.tween(2, (k) => o.cf.foldAB(1 - k)); o.cf.show('crease1', 'M'); o.cf.rightAngle(true); K.lab.emit('measure', { obj: o.cf.id });
          tagAt(K, o.cf.at('AB'), 'AM = MB = 4 cm', 3.6, 0, -0.03); tagAt(K, o.cf.at('M'), '∠OMB = 90°', 3.6, 0.06, 0.03); await tagAt(K, o.cf.at('top'), tl(K, W.crease), 3.6, 0, 0.02); }, ev: { type: 'measure' },
        see: X('The crease passes through the centre O. AM and MB are both 4 cm, and the crease meets AB at 90°.'),
        why: X('Folding puts A on B, so the crease is the perpendicular bisector of AB, and it passes through the centre. So the perpendicular from the centre to a chord bisects the chord.') },
      { do: X('Measure OM, the distance of the chord from the centre.'), target: 'cf',
        act: async (K, o) => { o.cf.show('OM'); K.lab.emit('measure', { obj: o.cf.id }); tagAt(K, o.cf.at('OM'), 'OM = 3 cm', 3.6, 0.04, 0.02); await tagAt(K, o.cf.at('right'), '5² = 4² + 3²', 3.6, 0.04, 0.02); }, ev: { type: 'measure' },
        see: X('OM is 3 cm. Triangle OMA has a right angle at M, and its sides fit Pythagoras: 5² = 4² + 3², that is 25 = 16 + 9.') },
      { do: X('Draw another chord CD 6 cm long, and fold the circle so that C falls on D. Then unfold it.'), target: 'cf',
        act: async (K, o) => { await K.tween(1.6, (k) => o.cf.drawChord(k, 'CD')); await K.tween(2.4, (k) => o.cf.foldCD(k)); await K.sleep(0.6); await K.tween(1.8, (k) => o.cf.foldCD(1 - k));
          o.cf.show('crease2', 'N'); K.lab.emit('fold', { obj: o.cf.id }); await tagAt(K, o.cf.at('O'), tl(K, W.cross), 3.8, -0.06, 0.04); }, ev: { type: 'fold' },
        see: X('This crease also passes through O. The two creases cross at the centre of the circle.'),
        why: X('The perpendicular bisector of every chord passes through the centre. So to find the centre of a round plate or lid, draw two chords and their perpendicular bisectors: they meet at the centre.') },
    ],
    eq: { word: 'The perpendicular from the centre to a chord', sym: 'OM ⊥ AB  ⇒  AM = MB  ·  OA² = OM² + AM²' },
    result: { obs: X('Folding A onto B made a crease through O that cut AB at M, with AM = MB = 4 cm and a right angle at M. OM was 3 cm. The crease for the chord CD also passed through O.'),
      concl: X('The perpendicular from the centre of a circle to a chord bisects the chord, and the perpendicular bisector of any chord passes through the centre.'),
      safety: X('Fold the paper on a flat table, and keep the pencil point away from your eyes.'),
      viva: [{ q: X('A chord of a circle of radius 13 cm is 24 cm long. How far is it from the centre?'), a: X('Half the chord is 12 cm, so the distance is √(13² − 12²) = √25 = 5 cm.') },
        { q: X('How can you find the centre of a round plate?'), a: X('Draw two chords and their perpendicular bisectors. They cross at the centre.') },
        { q: X('Which is the longest chord of a circle?'), a: X('The diameter, the chord that passes through the centre.') }] },
  },
];
