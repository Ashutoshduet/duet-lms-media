// DUET Maths Lab 360, real places 9 (Class 8, Part 2): workers harvesting a field (inverse proportion), a Sierpinski
// triangle on the ground (fractals), stacks of bricks levelled to their mean (mean and median), and a "think of a
// number" trick with a bag of marbles (algebra play).
import { DICT } from './exp_i18n.js';
import { DICT_W9 } from './exp_i18n_w9.js';
import * as MW from './mathworld.js';
import * as MW9 from './mathworld9.js';
Object.assign(DICT, DICT_W9);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C8r = N('Part 2 · Ch 3 · Proportional Reasoning-2', 'भाग 2 · अध्याय 3 · अनुपातिक तर्क-2', 'Part 2 · Ch 3 · Proportional reasoning-2');
const C8g = N('Part 2 · Ch 4 · Exploring Some Geometric Themes', 'भाग 2 · अध्याय 4 · कुछ ज्यामितीय विषयों की खोज', 'Part 2 · Ch 4 · Kuch geometric themes ki khoj');
const C8d = N('Part 2 · Ch 5 · Tales by Dots and Lines', 'भाग 2 · अध्याय 5 · बिंदुओं और रेखाओं की कहानियाँ', 'Part 2 · Ch 5 · Dots aur lines ki kahaniyan');
const C8x = N('Part 2 · Ch 6 · Algebra Play', 'भाग 2 · अध्याय 6 · बीजगणित का खेल', 'Part 2 · Ch 6 · Algebra play');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const OK = '#8be07a';
const waitFor = async (K, f, max = 60) => { for (let i = 0; i < max * 10 && !f(); i++) await K.sleep(0.1); };

export const EXPERIMENTS_W9 = [
  // ---------------------------------------------------------------- Part 2 Ch 3: harvesting a field
  {
    id: 'w8_harvest_workers', subj: 'maths', cls: 8, ch: C8r, world: true, place: 'khet', table: false,
    title: X('More workers, fewer days: inverse proportion'),
    aim: X('To call more workers into a wheat field with your own hand, see how the number of days changes, and share the harvest in a given ratio.'),
    kind: X('Inverse proportion and ratios'),
    setup(K) {
      const hf = K.add(MW9.harvestField(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      hf.camView = { p: V3(K, 0.6, 3.6, 2.4), t: V3(K, 0.5, 0.3, -3.0) };
      hf.words = () => [tl(K, X('workers')), tl(K, X('days'))]; hf.relabel();
      hf.onDone = (w) => { if (w >= 4) K.lab.emit('more', { obj: hf.id }); };
      MW9.bindHarvestHands(hf, lever, K.app, { more: 1 }, 4);
      return { hf, lever };
    },
    steps: [
      { do: X('This field has 12 rows of wheat. One worker cuts one row in a day, so alone it takes 12 days.'), target: 'hf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.hf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The board shows workers × days.') },
      { do: X('Push the lever to call one more worker each time, until 4 workers are cutting. Watch the days.'), target: 'hf',
        act: async (K, o) => { while (o.hf.w < 4) { o.hf.more(); await waitFor(K, () => !o.hf.working); await K.sleep(0.3); } },
        ev: { type: 'more' }, see: X('2 workers take 6 days, 3 take 4 days, 4 take 3 days. More workers, fewer days.') },
      { do: X('What stays the same?'), target: 'hf',
        act: async (K, o) => { K.lab.emit('same', { obj: o.hf.id }); label(K, '1 × 12 = 2 × 6 = 3 × 4\n= 4 × 3 = 6 × 2 = 12', o.hf.at('table'), 0.17, 0, { color: '#ffd23f', edge: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'same' }, see: X('Workers × days is always 12. When one is doubled, the other is halved: they are in inverse proportion.') },
      { do: X('Two families share the harvest in the ratio 2 : 1.'), target: 'hf',
        act: async (K, o) => { fresh(K); o.hf.setShare(8); K.lab.emit('share', { obj: o.hf.id }); label(K, '8', o.hf.at('a'), 0.3, 0, { color: '#ffd23f', step: true }); label(K, '4', o.hf.at('b'), 0.3, 0, { color: '#7ad0ff', step: true }); await K.sleep(2); },
        ev: { type: 'share' }, see: X('2 + 1 = 3 parts, so each part is 12 ÷ 3 = 4 rows. The first family gets 2 × 4 = 8 rows and the second 4 rows.') },
    ],
    eq: { word: 'Inverse proportion', sym: 'workers × days = constant' },
    result: {
      obs: X('1, 2, 3 and 4 workers took 12, 6, 4 and 3 days; the product was always 12. Sharing in the ratio 2 : 1 gave 8 rows and 4 rows.'),
      concl: X('Two quantities are in inverse proportion when their product stays the same. To divide a whole in a ratio, add the parts, find one part, then multiply.'),
      safety: X('Harvesting tools are sharp: never run in a field where people are cutting.'),
      viva: [{ q: X('6 workers build a wall in 4 days. How long would 8 workers take?'), a: X('3 days: 6 × 4 = 24 = 8 × 3.') },
        { q: X('Divide 30 sweets in the ratio 3 : 2.'), a: X('18 and 12.') },
        { q: X('A car takes 2 hours at 60 km/h. How long at 40 km/h?'), a: X('3 hours.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 4: a Sierpinski triangle on the ground
  {
    id: 'w8_sierpinski', subj: 'maths', cls: 8, ch: C8g, topic: 'geometry', world: true, place: 'quad', table: false,
    title: X('A triangle full of holes: the Sierpinski fractal'),
    aim: X('To apply the same rule again and again with your own hand to a big triangle on the ground, count the triangles, and see a pattern that repeats inside itself.'),
    kind: X('Fractals'),
    setup(K) {
      const sp = K.add(MW9.sierpinski(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      sp.camView = { p: V3(K, 0.7, 4.6, 1.6), t: V3(K, 0.7, 0, -2.6) };
      sp.words = () => [tl(K, X('triangles')), tl(K, X('yellow area'))]; sp.relabel();
      MW9.bindSierHands(sp, lever, K.app, { grow: 1 }, 3, { grow: () => K.lab.emit('grow', { obj: sp.id }) });
      return { sp, lever };
    },
    steps: [
      { do: X('A big yellow triangle lies on the ground. The rule: join the midpoints of its sides, and take out the middle triangle.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sp.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each yellow triangle will become three smaller ones.') },
      { do: X('Push the lever to apply the rule to every yellow triangle. Do it three times.'), target: 'sp',
        act: async (K, o) => { while (o.sp.stage < 3) { o.sp.setStage(o.sp.stage + 1); await K.sleep(0.9); } K.lab.emit('grow', { obj: o.sp.id }); },
        ev: { type: 'grow' }, see: X('1, 3, 9, 27 triangles: each time three times as many, each half as wide.') },
      { do: X('Apply it once more, and look at the yellow area.'), target: 'sp',
        act: async (K, o) => { o.sp.setStage(4); K.lab.emit('area', { obj: o.sp.id }); await K.sleep(2); },
        ev: { type: 'area' }, see: X('81 triangles, but each time only 3/4 of the yellow is kept: 1, 3/4, 9/16, 27/64, 81/256. The area keeps shrinking.') },
      { do: X('Look closely at one corner.'), target: 'sp',
        act: async (K, o) => { o.sp.showCorner(); K.lab.emit('corner', { obj: o.sp.id }); await K.sleep(2); },
        ev: { type: 'corner' }, see: X('The corner triangle, half the size, looks exactly like the whole pattern. A shape that repeats inside itself like this is called a fractal.') },
    ],
    eq: { word: 'Sierpinski triangle', sym: '3ⁿ triangles,  (3/4)ⁿ of the area' },
    result: {
      obs: X('The number of yellow triangles went 1, 3, 9, 27, 81, while the yellow area went 1, 3/4, 9/16, 27/64, 81/256. Each corner was a small copy of the whole.'),
      concl: X('Repeating one simple rule makes a fractal: a pattern made of smaller copies of itself. The count grows by ×3 each time while the area shrinks by ×3/4.'),
      safety: X('Stay on the path while you walk round the pattern.'),
      viva: [{ q: X('How many yellow triangles are there after 5 steps?'), a: X('3⁵ = 243.') },
        { q: X('What fraction of the area is taken out in the first step?'), a: X('1/4.') },
        { q: X('Name a fractal you can see in nature.'), a: X('A fern leaf, a cauliflower, a tree, a coastline or lightning.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 5: levelling stacks of bricks
  {
    id: 'w8_level_stacks', subj: 'maths', cls: 8, ch: C8d, topic: 'data', world: true, place: 'quad', table: false,
    title: X('Levelling stacks of bricks: the mean and the median'),
    aim: X('To move bricks from tall stacks to short ones with your own hand until all are level, and find the mean and the median of the stacks.'),
    kind: X('Mean and median'),
    setup(K) {
      const bs = K.add(MW9.brickStacks(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      bs.camView = { p: V3(K, 0.1, 2.1, 3.4), t: V3(K, 0.1, 1.35, -2.1) };
      bs.say([tl(K, X('2, 8, 4, 7, 4 bricks')), tl(K, X('total 25'))], ['#ffffff', '#ffd23f']);
      MW9.bindBrickHands(bs, lever, K.app, { level: 1 }, { level: () => K.lab.emit('level', { obj: bs.id }) });
      return { bs, lever };
    },
    steps: [
      { do: X('Five stacks of bricks: 2, 8, 4, 7 and 4. Make them all the same height without adding or taking away any brick.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('There are 25 bricks in all.') },
      { do: X('Push the lever to move one brick from the tallest stack to the shortest. Keep going until they are level.'), target: 'bs',
        act: async (K, o) => { while (!o.bs.level()) { o.bs.move1(); await waitFor(K, () => !o.bs.moving); await K.sleep(0.2); } K.lab.emit('level', { obj: o.bs.id }); },
        ev: { type: 'level' }, see: X('After 5 moves, every stack has 5 bricks.') },
      { do: X('That level height is the mean.'), target: 'bs',
        act: async (K, o) => { o.bs.showMean(5); o.bs.say([`${tl(K, X('mean'))} = 25 ÷ 5 = 5`], OK); K.lab.emit('mean', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'mean' }, see: X('Mean = total ÷ number of stacks = 25 ÷ 5 = 5. Levelling shares the total out equally.') },
      { do: X('Now put the stacks back as they were, but in order from shortest to tallest.'), target: 'bs',
        act: async (K, o) => { o.bs.setH([2, 4, 4, 7, 8]); o.bs.say([`${tl(K, X('median'))} = 4`], '#7ad0ff'); K.lab.emit('median', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'median' }, see: X('2, 4, 4, 7, 8: the middle stack has 4 bricks. That is the median.') },
      { do: X('A sixth stack of 15 bricks is added.'), target: 'bs',
        act: async (K, o) => { o.bs.setH([2, 4, 4, 7, 8, 15]); o.bs.say([`${tl(K, X('mean'))} = 40 ÷ 6 ≈ 6.7`, `${tl(K, X('median'))} = (4 + 7) ÷ 2 = 5.5`], ['#8be07a', '#7ad0ff']); K.lab.emit('outlier', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'outlier' }, see: X('The mean jumps from 5 to about 6.7, but the median only moves from 4 to 5.5. One very tall stack pulls the mean much more than the median.') },
    ],
    eq: { word: 'Mean', sym: 'mean = total ÷ number of values' },
    result: {
      obs: X('Levelling 2, 8, 4, 7 and 4 bricks gave 5 in every stack. In order, the middle stack was 4. Adding a stack of 15 moved the mean to about 6.7 but the median only to 5.5.'),
      concl: X('The mean is the level all values would have if the total were shared equally. The median is the middle value in order. A very large or small value changes the mean much more than the median.'),
      safety: X('Lift bricks with both hands and keep your feet clear.'),
      viva: [{ q: X('Find the mean of 3, 5, 7 and 9.'), a: X('24 ÷ 4 = 6.') },
        { q: X('Find the median of 9, 2, 6, 4 and 7.'), a: X('In order 2, 4, 6, 7, 9: the median is 6.') },
        { q: X('The mean of 4 numbers is 10. What is their total?'), a: X('40.') }],
    },
  },
  // ---------------------------------------------------------------- Part 2 Ch 6: think of a number
  {
    id: 'w8_think_number', subj: 'maths', cls: 8, ch: C8x, topic: 'algebra', world: true, place: 'room', table: true,
    title: X('Think of a number: the algebra behind the trick'),
    aim: X('To play a "think of a number" trick with a bag of marbles in your own hand, and see with algebra why the answer is always the same.'),
    kind: X('Algebra in number tricks'),
    setup(K) {
      const mt = K.add(MW9.marbleTrick(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      mt.camView = { p: V3(K, 0.02, 0.6, 0.76), t: V3(K, 0.0, 0.07, -0.04) };
      MW9.bindTrickHands(mt, lever, K.app, { play: 1 }, { end: () => K.lab.emit('play', { obj: mt.id }) });
      return { mt, lever };
    },
    steps: [
      { do: X('The bag holds a secret number of marbles. Call it x. Now follow the trick.'), target: 'mt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mt.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The board shows what is on the table, in algebra.') },
      { do: X('Push the lever for each instruction: add 5, double it, take away 4, halve it, take away the number you thought of.'), target: 'mt',
        act: async (K, o) => { while (o.mt.k < 5) { o.mt.next(); await K.sleep(1.0); } K.lab.emit('play', { obj: o.mt.id }); },
        ev: { type: 'play' }, see: X('x + 5, then 2x + 10, then 2x + 6, then x + 3, and at the end only 3 marbles are left.') },
      { do: X('Open the bag. What number was in it?'), target: 'mt',
        act: async (K, o) => { o.mt.open(); K.lab.emit('open', { obj: o.mt.id }); label(K, 'x = 7', o.mt.at('bag'), 0.03, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'open' }, see: X('It had 7, but that never mattered: whatever x is, the answer is 3.'),
        why: X('(2(x + 5) − 4) ÷ 2 − x = (2x + 6) ÷ 2 − x = x + 3 − x = 3. The x cancels out.') },
    ],
    eq: { word: 'The trick in algebra', sym: '(2(x + 5) − 4) ÷ 2 − x = 3' },
    result: {
      obs: X('After add 5, double, take away 4, halve and take away the bag, 3 marbles were left. The bag had 7 marbles, but any number gives 3.'),
      concl: X('Writing the trick with a letter for the secret number shows why it always works: the letter cancels out.'),
      safety: X('Keep marbles off the floor, where someone could slip on them.'),
      viva: [{ q: X('Simplify 3(x + 2) − 3x.'), a: X('6.') },
        { q: X('Think of a number, add 3, double it, take away 6. What do you get?'), a: X('2x: double the number.') },
        { q: X('Why did the trick not need to know x?'), a: X('Because x was taken away at the end, so it cancelled.') }],
    },
  },
];
