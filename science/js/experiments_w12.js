// DUET Maths Lab 360, real places 12 (Class 7, Part 2): a week of rain (data: line graph, mean, median, a tall tale),
// tiles meeting round a point (tilings), and a balance with bags of unknown weight (equations).
import { DICT } from './exp_i18n.js';
import { DICT_W12 } from './exp_i18n_w12.js';
import * as MW from './mathworld.js';
import * as MW12 from './mathworld12.js';
Object.assign(DICT, DICT_W12);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C7g = N('Part 2 · Ch 5 · Connecting the Dots', 'भाग 2 · अध्याय 5 · बिंदुओं को जोड़ना', 'Part 2 · Ch 5 · Dots ko jodna');
const C7t = N('Part 2 · Ch 6 · Constructions and Tilings', 'भाग 2 · अध्याय 6 · रचनाएँ और टाइलें', 'Part 2 · Ch 6 · Constructions aur tilings');
const C7u = N('Part 2 · Ch 7 · Finding the Unknown', 'भाग 2 · अध्याय 7 · अज्ञात को खोजना', 'Part 2 · Ch 7 · Unknown ko khojna');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const OK = '#8be07a';
const waitFor = async (K, f, max = 60) => { for (let i = 0; i < max * 10 && !f(); i++) await K.sleep(0.1); };

export const EXPERIMENTS_W12 = [
  // ---------------------------------------------------------------- Part 2 Ch 5: a week of rain
  {
    id: 'w7_rain_week', subj: 'maths', cls: 7, ch: C7g, topic: 'data', world: true, place: 'quad', table: false,
    title: X('A week of rain: dots, lines and averages'),
    aim: X('To collect a week of rainfall in gauges with your own hand, join the readings into a line graph, find the mean and the median, and spot a graph that tells a tall tale.'),
    kind: X('Line graphs, mean and median'),
    setup(K) {
      const rw = K.add(MW12.rainWeek(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      rw.camView = { p: V3(K, 0.0, 1.75, 1.9), t: V3(K, 0.0, 1.25, -2.2) };
      rw.words = () => [tl(K, X('day')), tl(K, X('rain (mm)')), tl(K, X('mean')), tl(K, X('median'))]; rw.drawBoard();
      MW12.bindRainHands(rw, lever, K.app, { rain: 1 }, { all: () => K.lab.emit('rain', { obj: rw.id }) });
      return { rw, lever };
    },
    steps: [
      { do: X('Seven rain gauges stand on the bench, one for each day of a week.'), target: 'rw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rw.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each gauge shows the rain of its day in millimetres.') },
      { do: X('Push the lever to let each day’s rain fall, one day at a time, for all 7 days.'), target: 'rw',
        act: async (K, o) => { while (o.rw.days < 7) { o.rw.rain(); await waitFor(K, () => !o.rw.busy()); await K.sleep(0.2); } K.lab.emit('rain', { obj: o.rw.id }); },
        ev: { type: 'rain' }, see: X('4, 0, 18, 6, 2, 3 and 9 mm. Each reading is a dot on the board.') },
      { do: X('Join the dots.'), target: 'rw',
        act: async (K, o) => { o.rw.set('line', true); K.lab.emit('line', { obj: o.rw.id }); await K.sleep(2); },
        ev: { type: 'line' }, see: X('The line graph shows how the rain went up and down through the week: a big storm on day 3.') },
      { do: X('Find one number that represents the week.'), target: 'rw',
        act: async (K, o) => { o.rw.set('mean', true); await K.sleep(0.8); o.rw.set('median', true); K.lab.emit('avg', { obj: o.rw.id }); await K.sleep(1.5); },
        ev: { type: 'avg' }, see: X('Mean = 42 ÷ 7 = 6 mm. In order, 0, 2, 3, 4, 6, 9, 18, the median is 4 mm. The one stormy day pulls the mean above most days.') },
      { do: X('Now the same graph with its axis starting at 2 instead of 0.'), target: 'rw',
        act: async (K, o) => { o.rw.set('mean', false); o.rw.set('median', false); o.rw.set('cut', true); K.lab.emit('tall', { obj: o.rw.id }); await K.sleep(2); },
        ev: { type: 'tall' }, see: X('Small days now look tiny and big days look huge. Always check where an axis starts before believing what a graph seems to say.') },
    ],
    eq: { word: 'Mean', sym: 'mean = sum ÷ number of values' },
    result: {
      obs: X('The week’s rain was 4, 0, 18, 6, 2, 3 and 9 mm. The line graph peaked on day 3. The mean was 6 mm and the median 4 mm.'),
      concl: X('A line graph joins readings in order to show change. The mean and the median are representative values; one extreme value moves the mean more than the median. A cut axis can make a graph mislead.'),
      safety: X('Stay indoors during a thunderstorm; read the gauges when the rain stops.'),
      viva: [{ q: X('Find the mean of 2, 4, 6 and 8.'), a: X('5.') },
        { q: X('Find the median of 7, 1, 5, 3 and 9.'), a: X('5.') },
        { q: X('Why can a graph whose axis does not start at 0 be misleading?'), a: X('It stretches small differences so they look large.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 6: tiles round a point
  {
    id: 'w7_tiling', subj: 'maths', cls: 7, ch: C7t, topic: 'geometry', world: true, place: 'quad', table: false,
    title: X('Which tiles cover a floor? Angles round a point'),
    aim: X('To lay regular tiles round one point with your own hand, see which shapes close up exactly, and cover a floor with a honeycomb.'),
    kind: X('Tilings and angles at a point'),
    setup(K) {
      const tr = K.add(MW12.tileRound(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      tr.camView = { p: V3(K, 0.0, 3.2, 0.6), t: V3(K, 0.0, 0, -2.1) };
      MW12.bindTileHands(tr, lever, K.app, { tryit: 1 }, { all: () => K.lab.emit('try', { obj: tr.id }) });
      return { tr, lever };
    },
    steps: [
      { do: X('Tiles that cover a floor must meet at each corner point with no gap and no overlap.'), target: 'tr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('So the angles meeting at a point must add up to exactly 360°.') },
      { do: X('Push the lever to try squares, then equilateral triangles, then regular hexagons round the white point.'), target: 'tr',
        act: async (K, o) => { while (o.tr.tries < 3) { o.tr.next(); await K.sleep(1.4); } K.lab.emit('try', { obj: o.tr.id }); },
        ev: { type: 'try' }, see: X('4 squares (4 × 90°), 6 triangles (6 × 60°) and 3 hexagons (3 × 120°) each close up exactly: 360°.') },
      { do: X('Now try regular pentagons.'), target: 'tr',
        act: async (K, o) => { o.tr.showRound(5, 3); o.tr.say(['3 × 108° = 324°', '360° − 324° = 36°'], ['#ffffff', '#ff7a6f']); K.lab.emit('penta', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'penta' }, see: X('Three pentagons leave a 36° gap (red), and a fourth would overlap. Regular pentagons cannot tile a floor.') },
      { do: X('Cover the whole floor with hexagons.'), target: 'tr',
        act: async (K, o) => { o.tr.honeycomb(); o.tr.say(['3 × 120° = 360°'], OK); K.lab.emit('honey', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'honey' }, see: X('A honeycomb: bees use hexagons because they fit with no gaps and use little wax for the space they hold.') },
    ],
    eq: { word: 'Angles round a point', sym: 'sum of angles = 360°' },
    result: {
      obs: X('Squares, equilateral triangles and regular hexagons closed up round a point; regular pentagons left a 36° gap.'),
      concl: X('A regular polygon can tile a floor on its own only if its angle divides 360° exactly: this works for triangles (60°), squares (90°) and hexagons (120°).'),
      safety: X('Tiles have sharp edges; carry them with care.'),
      viva: [{ q: X('What is each angle of a regular hexagon?'), a: X('120°.') },
        { q: X('How many equilateral triangles meet at a point in a tiling?'), a: X('6.') },
        { q: X('Can regular octagons (135°) tile a floor on their own?'), a: X('No: 2 × 135° = 270° and 3 × 135° = 405°.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 7: a balance with unknown bags
  {
    id: 'w7_balance_unknown', subj: 'maths', cls: 7, ch: C7u, topic: 'algebra', world: true, place: 'room', table: true,
    title: X('Finding the unknown on a balance'),
    aim: X('To keep a balance level while taking weights off both pans with your own hand, and so solve 2x + 3 = 11.'),
    kind: X('Solving simple equations'),
    setup(K) {
      const bs = K.add(MW12.balanceScale(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      bs.camView = { p: V3(K, 0.02, 0.78, 1.05), t: V3(K, 0.0, 0.3, -0.1) };
      MW12.bindBalanceHands(bs, lever, K.app, { take: 1 }, { all: () => K.lab.emit('take', { obj: bs.id }) });
      return { bs, lever };
    },
    steps: [
      { do: X('The balance is level. On the left are two bags, each of the same unknown weight x, and three 1 kg weights. On the right are eleven 1 kg weights.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Level means both sides weigh the same: 2x + 3 = 11.') },
      { do: X('Push the lever to take 1 kg off both pans together, until no loose weights are left on the left.'), target: 'bs',
        act: async (K, o) => { while (o.bs.st.lw > 0) { o.bs.take1(); await K.sleep(0.9); } K.lab.emit('take', { obj: o.bs.id }); },
        ev: { type: 'take' }, see: X('Taking the same weight from both sides keeps the balance level. Now 2x = 8.') },
      { do: X('Keep half of each side.'), target: 'bs',
        act: async (K, o) => { o.bs.halve(); K.lab.emit('half', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'half' }, see: X('One bag balances 4 kg: x = 4.') },
      { do: X('Check the answer in the first balance.'), target: 'bs',
        act: async (K, o) => { o.bs.say(['2 × 4 + 3 = 11  ✓'], OK); K.lab.emit('check', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'check' }, see: X('2 × 4 + 3 = 11: the left side really weighs 11 kg. Doing the same to both sides is how equations are solved.') },
    ],
    eq: { word: 'Equation', sym: '2x + 3 = 11  →  2x = 8  →  x = 4' },
    result: {
      obs: X('Taking 3 kg from both pans left 2x = 8; halving both sides left x = 4, and the balance stayed level throughout.'),
      concl: X('An equation is like a level balance. Adding, taking away, multiplying or dividing both sides by the same amount keeps it true, step by step, until the unknown is alone.'),
      safety: X('Put weights down gently; do not drop them on the pans.'),
      viva: [{ q: X('Solve x + 7 = 12.'), a: X('x = 5.') },
        { q: X('Solve 3x = 21.'), a: X('x = 7.') },
        { q: X('Solve 4x − 2 = 10.'), a: X('x = 3.') }],
    },
  },
];
