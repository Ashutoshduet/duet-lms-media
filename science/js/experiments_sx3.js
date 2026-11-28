// DUET Science Lab 360, batch SX-CGM, maths (table-top, so it shows in the Science Lab and in the Maths Lab):
// the sum of the first n squares with stacked wooden cubes and six pyramids in a box, and a³ − b³ with a sawn cube.
// Scenes in sxmaths.js; Hindi and Hinglish in exp_i18n_sx.js.
import { DICT } from './exp_i18n.js';
import { DICT_SX } from './exp_i18n_sx.js';
import * as SM from './sxmaths.js';
import { pullTab } from './mathworld.js';
import { camBy } from './sxkit.js';
Object.assign(DICT, DICT_SX);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => t3(K.app.lang, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
const C9s = N('Ch 8 · Predicting What Comes Next: Exploring Sequences and Progressions', 'अध्याय 8 · आगे क्या आएगा: अनुक्रम और प्रगति की खोज', 'Ch 8 · Aage kya aayega: sequences aur progressions ki khoj');
const C9i = N('Ch 4 · Exploring Algebraic Identities', 'अध्याय 4 · बीजीय सर्वसमिकाओं की खोज', 'Ch 4 · Algebraic identities ki khoj');
const sumSq = (n) => n * (n + 1) * (2 * n + 1) / 6;

export const EXPERIMENTS_SX3 = [
  // ============================================================ Class 9 (8) · 1² + 2² + … + n²
  {
    id: 'm9_sum_squares', subj: 'maths', cls: 9, also: [8], ch: C9s, topic: 'numbers',
    title: X('The sum of the first n squares, with cubes'),
    aim: X('To stack square layers of cubes into a pyramid with your own hands, fit six such pyramids into one box, and so find a formula for 1² + 2² + 3² + … + n².'),
    kind: X('Sum of squares'),
    setup(K) {
      const W = Wd(K); const sq = K.add(SM.squarePyramid({ W }), 0, -0.6); sq.W = W;
      const knobN = K.add(pullTab(), -0.3, -0.5);
      SM.bindPyramid(sq, K, { n: 1, stack: 2, box: 3, knobN }, { n: emit(K, sq, 'setn'), stack: emit(K, sq, 'stacked'), box: emit(K, sq, 'boxed'), count: emit(K, sq, 'counted') });
      camBy(sq, K.app, [sq.views.all, sq.views.n, sq.views.jig, sq.views.box, sq.views.box, sq.views.all]);
      return { sq, knobN };
    },
    steps: [
      { do: X('Kyun? 1 + 4 + 9 + 16 + 25 + … Adding square numbers one by one takes long. Is there a shortcut? Look at the square layers of wooden cubes on the bench.'), target: 'sq',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sq.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Square layers of 1 × 1, 2 × 2, 3 × 3 and 4 × 4 cubes lie in a row. Beside them stand a corner jig, five pyramids of cubes made by your friends, and an empty clear box.') },
      { do: X('Choose n, the number of layers: slide the yellow knob to 3, 4 or 5.'), target: 'knobN',
        act: async (K, o) => { o.sq.setN(4); K.lab.emit('setn', { obj: o.sq.id }); await K.sleep(1); }, ev: { type: 'setn' },
        check: (K, o) => (o.sq.n === 4 ? null : { ok: false, see: F3((L, w) => `n = ${o.sq.n}: ${w('the layers are now')} 1 × 1 … ${o.sq.n} × ${o.sq.n}.`), why: X('Everything that follows works the same way for your n; the numbers change with it.') }),
        see: X('n = 4: four layers, of 16, 9, 4 and 1 cubes.') },
      { do: X('Stack the layers in the corner jig: biggest at the bottom, each one pushed into the same corner.'), target: 'sq',
        act: async (K, o) => { await o.sq.doStack(); }, ev: { type: 'stacked' },
        check: (K, o) => (o.sq.n === 4 ? null : { ok: false, see: F3((L) => `${Array.from({ length: o.sq.n }, (_, i) => `${i + 1}²`).join(' + ')} = ${sumSq(o.sq.n)}.`), why: X('A bigger layer can never rest on a smaller one, so the pyramid goes up in steps.') }),
        see: X('A stepped pyramid: 16 + 9 + 4 + 1 = 30 cubes. That is 1² + 2² + 3² + 4².'), why: X('Each layer is a square number of cubes, so the whole pyramid holds the sum of the squares.') },
      { do: X('Now put your pyramid and the five others into the box, one by one. Watch how each one turns to fit.'), target: 'sq',
        act: async (K, o) => { await o.sq.doBox(); }, ev: { type: 'boxed' },
        see: X('The six pyramids fit together exactly: the box is full, with no gap and nothing sticking out.'), why: X('The steps of one pyramid fill the steps of the next. Six pyramids make one solid box.') },
      { do: X('Count the box: its length, its width and its height, in cubes.'), target: 'sq',
        act: async (K, o) => { o.sq.count(); await K.sleep(3); }, ev: { type: 'counted' },
        check: (K, o) => { const n = o.sq.n; if (n === 4) return null; const N0 = n * (n + 1) * (2 * n + 1); return { ok: false, see: F3((L, w) => `${w('The box is')} ${2 * n + 1} × ${n + 1} × ${n} = ${N0} ${w('cubes')}, ${w('so one pyramid has')} ${N0} ÷ 6 = ${N0 / 6}.`), why: X('Length 2n + 1, width n + 1, height n: the same rule as for n = 4.') }; },
        see: X('Length 9, width 5, height 4: 9 × 5 × 4 = 180 cubes. Six pyramids are 180 cubes, so one pyramid is 180 ÷ 6 = 30.'),
        why: X('For any n the box is n long one way, n + 1 the other and 2n + 1 the third. So 6 × (1² + 2² + … + n²) = n(n + 1)(2n + 1).') },
      { do: X('Use the formula: add up the squares from 1² to 10².'), target: 'sq',
        act: async (K, o) => { o.sq.say(['1² + 2² + … + 10² = 10 × 11 × 21 ÷ 6', '= 2310 ÷ 6 = 385'], ['#ffffff', '#8be07a']); K.lab.emit('use', { obj: o.sq.id }); await K.sleep(3); }, ev: { type: 'use' },
        see: X('10 × 11 × 21 ÷ 6 = 385, without adding a single square.') },
    ],
    eq: { word: 'Sum of the first n squares', sym: '1² + 2² + … + n² = n(n + 1)(2n + 1) ÷ 6' },
    result: { obs: X('Four square layers made a pyramid of 30 cubes. Six such pyramids filled a box 9 × 5 × 4 = 180 cubes exactly.'),
      concl: X('1² + 2² + 3² + … + n² = n(n + 1)(2n + 1) ÷ 6.'),
      safety: X('Wooden cubes are small: keep them away from very young children.'),
      viva: [{ q: X('Find 1² + 2² + … + 5².'), a: X('5 × 6 × 11 ÷ 6 = 55.') }, { q: X('How many cubes are in the box for n = 3?'), a: X('3 × 4 × 7 = 84, six pyramids of 14.') },
        { q: X('Why does the box hold exactly six pyramids?'), a: X('The steps of the pyramids fit into each other with no gaps, so six of them fill the box n × (n + 1) × (2n + 1).') }] },
  },
  // ============================================================ Class 9 · a³ − b³
  {
    id: 'm9_cube_difference', subj: 'maths', cls: 9, ch: C9i, topic: 'algebra',
    title: X('a³ − b³ with a sawn wooden cube'),
    aim: X('To lift a small cube out of the corner of a big wooden cube, saw what is left into three blocks and lay them side by side with your own hands, and so show that a³ − b³ = (a − b)(a² + ab + b²).'),
    kind: X('Algebraic identity'),
    setup(K) {
      const W = Wd(K); const cd = K.add(SM.cubeDiff({ W }), 0, -0.62); cd.W = W;
      const knobB = K.add(pullTab(), -0.2, -0.5), saw1 = K.add(pullTab(), -0.3, -0.5), saw2 = K.add(pullTab(), -0.3, -0.5);
      SM.bindCubeDiff(cd, K, { b: 1, lift: 2, cut1: 3, cut2: 4, lay: 5, knobB, saw1, saw2 }, { b: emit(K, cd, 'setb'), lift: emit(K, cd, 'lifted'), cut1: emit(K, cd, 'cut'), cut2: emit(K, cd, 'cut'), lay: emit(K, cd, 'laid') });
      camBy(cd, K.app, [cd.views.all, cd.views.cube, cd.views.cube, cd.views.cube, cd.views.cube, cd.views.lay, cd.views.lay]);
      const o = { cd, knobB, saw1, saw2 }; Object.defineProperty(o, 'S', { get: () => cd.things.S, enumerable: true }); return o; // the small cube is made again when b changes
    },
    steps: [
      { do: X('Kyun? A big cube with a small cube cut from its corner: what is its volume, and can the rest be made into a simple block? Look at the wooden cube: its side is a = 5 units.'), target: 'cd',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cd.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A wooden cube 5 units on each side, marked in unit squares: a³ = 125 unit cubes. A small cube is marked in its top front corner.') },
      { do: X('Choose the side b of the small cube: slide the knob to 1, 2 or 3.'), target: 'knobB',
        act: async (K, o) => { o.cd.setB(2); K.lab.emit('setb', { obj: o.cd.id }); await K.sleep(1); }, ev: { type: 'setb' },
        check: (K, o) => (o.cd.b === 2 ? null : { ok: false, see: F3((L, w) => `b = ${o.cd.b}: b³ = ${o.cd.b ** 3}.`), why: X('Everything that follows works the same way for your b; the numbers change with it.') }),
        see: X('b = 2: the small cube holds 2 × 2 × 2 = 8 unit cubes.') },
      { do: X('Lift the small cube out of the corner and put it aside.'), target: 'S',
        act: async (K, o) => { await o.cd.doLift(); }, ev: { type: 'lifted' },
        check: (K, o) => (o.cd.b === 2 ? null : { ok: false, see: F3((L, w) => `${w('What is left')}: ${125} − ${o.cd.b ** 3} = ${125 - o.cd.b ** 3}.`), why: X('Taking out the small cube takes b³ unit cubes away from a³.') }),
        see: X('What is left has a³ − b³ = 125 − 8 = 117 unit cubes.') },
      { do: X('Saw along the line round the cube: cut off the bottom slab, a − b units high.'), target: 'saw1',
        act: async (K, o) => { await K.tween(3, (k) => o.cd.setCut(1, k)); o.cd.setCut(1, 1); K.lab.emit('cut', { obj: o.cd.id }); }, ev: { type: 'cut' },
        see: X('The bottom slab is a × a wide and a − b = 3 high: 5 × 5 × 3 = 75 unit cubes.') },
      { do: X('Now saw down through the top part to split it into two blocks.'), target: 'saw2',
        act: async (K, o) => { await K.tween(3, (k) => o.cd.setCut(2, k)); o.cd.setCut(2, 1); K.lab.emit('cut', { obj: o.cd.id }); }, ev: { type: 'cut' },
        check: (K, o) => { const b = o.cd.b; if (b === 2) return null; const ab = 5 - b; return { ok: false, see: F3((L, w) => `${w('Three blocks')}: 5 × 5 × ${ab} = ${25 * ab}, ${ab} × ${b} × 5 = ${5 * b * ab}, ${b} × ${b} × ${ab} = ${b * b * ab}.`), why: X('Every block is a − b units thick in one direction.') }; },
        see: X('A long block (a − b) × b × a = 3 × 2 × 5 = 30 and a small block b × b × (a − b) = 2 × 2 × 3 = 12.'), why: X('All three blocks have one side a − b long: 75 + 30 + 12 = 117.') },
      { do: X('Lay the two blocks beside the bottom slab, each with its a − b side standing up.'), target: 'cd',
        act: async (K, o) => { await o.cd.doLay(); }, ev: { type: 'laid' },
        check: (K, o) => { const b = o.cd.b; if (b === 2) return null; const ab = 5 - b, top = 25 + 5 * b + b * b; return { ok: false, see: F3((L, w) => `${w('Top faces')}: 25 + ${5 * b} + ${b * b} = ${top} · ${w('height')} ${ab}: ${top} × ${ab} = ${top * ab} = 125 − ${b ** 3}.`), why: X('The same identity holds for every a and b.') }; },
        see: X('One flat block, a − b = 3 high. Its top is a² + ab + b² = 25 + 10 + 4 = 39 unit squares. 39 × 3 = 117.'),
        why: X('The volume did not change, so a³ − b³ = (a − b)(a² + ab + b²).') },
    ],
    eq: { word: 'Difference of two cubes', sym: 'a³ − b³ = (a − b)(a² + ab + b²)' },
    result: { obs: X('After the small cube (8) was taken out of the big cube (125), 117 unit cubes were left. Sawn into three blocks, each a − b = 3 thick, and laid side by side, they made one block with a top of 25 + 10 + 4 = 39 squares.'),
      concl: X('a³ − b³ = (a − b)(a² + ab + b²).'),
      safety: X('Saw away from your hand and hold the wood firmly in a clamp.'),
      viva: [{ q: X('Factorise x³ − 27.'), a: X('(x − 3)(x² + 3x + 9).') }, { q: X('Find 10³ − 9³ quickly.'), a: X('(10 − 9)(100 + 90 + 81) = 271.') },
        { q: X('What is a³ + b³?'), a: X('(a + b)(a² − ab + b²).') }] },
  },
];
