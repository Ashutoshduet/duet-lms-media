// Maths, batch 5: Class 7 fitting regular tiles round one point (triangles, squares and hexagons tile a floor,
// pentagons leave a gap); Class 8 tearing off the four corners of a paper quadrilateral (its angles add up to 360°).
import { DICT } from './exp_i18n.js';
import { DICT_M5 } from './exp_i18n_m5.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M5);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C7 = N('Part 2 · Ch 6 · Constructions and Tilings', 'भाग 2 · अध्याय 6 · रचनाएँ और टाइलिंग', 'Part 2 · Ch 6 · Constructions aur tilings');
const C8 = N('Ch 4 · Quadrilaterals', 'अध्याय 4 · चतुर्भुज', 'Ch 4 · Quadrilaterals (chaturbhuj)');
// words shown in the 3D labels
const W = {
  fit: X('No gap, no overlap'), gap: X('A gap of 36°'), over: X('Overlap'), full: X('A full turn'),
  two: X('Two triangles'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };

// tiles of one kind go round P one after another, then the total is shown
async function ring(K, o, n, count, sum, ok = true) {
  o.pt.pile(n, true); await K.sleep(0.4);
  for (let i = 0; i < count; i++) await K.tween(0.8, (k) => o.pt.place(n, i, k));
  o.pt.ring.visible = ok; K.lab.emit('arrange', { obj: o.pt.id });
  tagAt(K, o.pt.at('below'), sum, 3.6, 0, 0.01);
  if (ok) await tagAt(K, o.pt.at('right'), tl(K, W.fit), 3.6, 0.03, 0.02);
}

export const EXPERIMENTS_M5 = [
  // ------------------------------------------------------------------------------------------------ Class 7
  {
    id: 'm7_regular_tilings', subj: 'maths', cls: 7, ch: C7, title: X('Which regular polygons tile a floor?'),
    aim: X('To fit regular tiles round one point, and to find out which regular polygons can cover a floor with no gaps and no overlaps.'),
    kind: X('Tiling with regular polygons'),
    setup(K) { const pt = K.add(K.MT5.polygonTiles(), 0, -0.56); view(K, pt, 0.27, 0.33, 0); return { pt }; },
    steps: [
      { do: X('Take equal equilateral triangles. Fit them round a point P, corner to corner, until the space round P is filled.'), target: 'pt',
        act: async (K, o) => { await ring(K, o, 3, 6, '6 × 60° = 360°'); }, ev: { type: 'arrange' },
        see: X('Exactly 6 triangles fit round P, with no gap and no overlap.'),
        why: X('Each corner of an equilateral triangle is 60°, and 6 × 60° = 360°, a full turn round the point.') },
      { do: X('Take the triangles away. Now fit equal squares round P.'), target: 'pt',
        act: async (K, o) => { o.pt.ring.visible = false; await K.tween(1.2, (k) => o.pt.clear(3, k)); await ring(K, o, 4, 4, '4 × 90° = 360°'); }, ev: { type: 'arrange' },
        see: X('4 squares fit exactly round P, like the tiles of a floor.'),
        why: X('Each corner of a square is 90°, and 4 × 90° = 360°.') },
      { do: X('Take the squares away. Now fit regular hexagons round P.'), target: 'pt',
        act: async (K, o) => { o.pt.ring.visible = false; await K.tween(1.2, (k) => o.pt.clear(4, k)); await ring(K, o, 6, 3, '3 × 120° = 360°'); }, ev: { type: 'arrange' },
        see: X('3 hexagons fit exactly round P. This is the pattern of a honeycomb.'),
        why: X('Each corner of a regular hexagon is 120°, and 3 × 120° = 360°.') },
      { do: X('Take the hexagons away. Now try regular pentagons round P.'), target: 'pt',
        act: async (K, o) => { o.pt.ring.visible = false; await K.tween(1.2, (k) => o.pt.clear(6, k)); await ring(K, o, 5, 3, '3 × 108° = 324°', false);
          o.pt.gap.visible = true; await tagAt(K, o.pt.at('gap'), tl(K, W.gap), 3.6, 0.08, 0.0); }, ev: { type: 'arrange' },
        see: X('After 3 pentagons, a gap of 36° is left at P. The gap is too small for another pentagon.'),
        why: X('Each corner of a regular pentagon is 108°. 3 × 108° = 324° is less than 360°, and 4 × 108° = 432° is more than 360°.') },
      { do: X('Push a fourth pentagon into the gap.'), target: 'pt',
        act: async (K, o) => { o.pt.gap.visible = false; await K.tween(1.2, (k) => o.pt.place(5, 3, k)); K.lab.emit('fit', { obj: o.pt.id });
          tagAt(K, o.pt.at('below'), '4 × 108° = 432°', 3.6, 0, 0.01); await tagAt(K, o.pt.at('over'), tl(K, W.over), 3.6, 0.04, 0.02); }, ev: { type: 'fit' },
        see: X('The fourth pentagon lies over the first one. Regular pentagons cannot cover a floor without gaps or overlaps.'),
        why: X('A regular polygon can tile a floor only if its corner angle divides 360° exactly. Among regular polygons, only the triangle, the square and the hexagon do this.') },
    ],
    eq: { word: 'Regular polygons that tile a floor', sym: '6 × 60° = 4 × 90° = 3 × 120° = 360°' },
    result: { obs: X('6 equilateral triangles, 4 squares and 3 regular hexagons each filled the space round a point exactly. 3 regular pentagons left a gap of 36°, and a fourth one overlapped.'),
      concl: X('Copies of a regular polygon tile a floor only when its corner angle divides 360° exactly. So only equilateral triangles, squares and regular hexagons can tile a floor by themselves.'),
      safety: X('If you cut the tiles from card, use scissors with rounded tips and cut away from your hand.'),
      viva: [{ q: X('Why can regular octagons not tile a floor by themselves?'), a: X('Each corner of a regular octagon is 135°. 2 × 135° = 270° is less than 360° and 3 × 135° = 405° is more, so they leave gaps or overlap.') },
        { q: X('Why do bees build hexagonal cells?'), a: X('Hexagons fit together with no gaps, and they hold the most honey for the wax used to make the walls.') },
        { q: X('Where do you see square and hexagonal tilings around you?'), a: X('In floor tiles, paving blocks, a chessboard and a honeycomb.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 8
  {
    id: 'm8_quad_angle_sum', subj: 'maths', cls: 8, ch: C8, title: X('Angle sum of a quadrilateral by tearing its corners'),
    aim: X('To tear off the four corners of a paper quadrilateral and put them together round one point, and to see that the angles of a quadrilateral add up to 360°.'),
    kind: X('Angles of a quadrilateral'),
    setup(K) { const qc = K.add(K.MT5.quadCorners(), 0, -0.56); view(K, qc, 0.27, 0.33, 0); return { qc }; },
    steps: [
      { do: X('Draw a quadrilateral ABCD on a sheet of paper, cut it out, and colour its four corners in four colours.'), target: 'qc',
        act: async (K, o) => { await K.tween(1.6, (k) => o.qc.colour(k)); K.lab.emit('draw', { obj: o.qc.id }); await tagAt(K, o.qc.at('quad'), 'ABCD', 3, 0, 0.03); }, ev: { type: 'draw' },
        see: X('The quadrilateral has four corners, A, B, C and D, each in a different colour.') },
      { do: X('Measure each angle with a protractor and add the four angles.'), target: 'qc',
        act: async (K, o) => { const a = o.qc.angles;
          for (const [i, k] of ['A', 'B', 'C', 'D'].entries()) await tagAt(K, o.qc.at(k), `∠${k} = ${a[i]}°`, 1.4, 0, 0.03);
          K.lab.emit('measure', { obj: o.qc.id }); await tagAt(K, o.qc.at('below'), `${a[0]}° + ${a[1]}° + ${a[2]}° + ${a[3]}° = 360°`, 3.6, 0, -0.02); }, ev: { type: 'measure' },
        see: X('The angles are 70°, 105°, 95° and 90°. Together they make 360°.') },
      { do: X('Tear off the four coloured corners.'), target: 'qc',
        act: async (K, o) => { await K.tween(1.6, (k) => o.qc.tear(k)); K.lab.emit('cut', { obj: o.qc.id }); }, ev: { type: 'cut' },
        see: X('Four coloured corner pieces come off, and each one keeps its angle.') },
      { do: X('Place the four corners at a point P, one beside the other, so that their tips meet at P and their edges touch.'), target: 'qc',
        act: async (K, o) => { for (let i = 0; i < 4; i++) await K.tween(1, (k) => o.qc.move(i, k)); o.qc.ring.visible = true; K.lab.emit('arrange', { obj: o.qc.id });
          tagAt(K, o.qc.at('Pdown'), '∠A + ∠B + ∠C + ∠D = 360°', 3.8, 0, -0.03); await tagAt(K, o.qc.at('Pup'), tl(K, W.full), 3.8, 0, 0.02); }, ev: { type: 'arrange' },
        see: X('The four corners fill the whole space round P with no gap and no overlap: a full turn of 360°.'),
        why: X('The angles round a point add up to 360°. Since the four corners fill a full turn exactly, the angles of the quadrilateral add up to 360°.') },
      { do: X('Draw the diagonal AC on what is left of the quadrilateral.'), target: 'qc',
        act: async (K, o) => { o.qc.diag.visible = true; K.lab.emit('draw', { obj: o.qc.id }); tagAt(K, o.qc.at('below'), '180° + 180° = 360°', 3.8, 0, -0.02); await tagAt(K, o.qc.at('mid'), tl(K, W.two), 3.8, 0.03, -0.02); }, ev: { type: 'draw' },
        see: X('The diagonal AC splits the quadrilateral into two triangles, ABC and ACD.'),
        why: X('The angles of each triangle add up to 180°, and together the angles of the two triangles make up the four angles of the quadrilateral: 180° + 180° = 360°.') },
    ],
    eq: { word: 'Angle sum of a quadrilateral', sym: '∠A + ∠B + ∠C + ∠D = 360°' },
    result: { obs: X('The angles of ABCD were 70°, 105°, 95° and 90°. The four torn corners, placed round P, filled a full turn with no gap and no overlap.'),
      concl: X('The four angles of any quadrilateral add up to 360°, because a diagonal splits it into two triangles, each with an angle sum of 180°.'),
      safety: X('Use scissors with rounded tips and keep your fingers away from the blades.'),
      viva: [{ q: X('Three angles of a quadrilateral are 80°, 100° and 120°. Find the fourth angle.'), a: X('360° − 80° − 100° − 120° = 60°.') },
        { q: X('Can a quadrilateral have all four angles of 100°?'), a: X('No, because 4 × 100° = 400°, which is more than 360°.') },
        { q: X('What is the angle sum of a pentagon?'), a: X('Diagonals from one corner split a pentagon into 3 triangles, so its angles add up to 3 × 180° = 540°.') }] },
  },
];
