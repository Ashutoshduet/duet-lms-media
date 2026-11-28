// DUET Maths Lab 360, real places 10 (Class 7, Part 1): from one cube to a crore (large numbers), a shop bill
// (arithmetic expressions), matchstick squares (letter-numbers), a magic square on the ground (number play), and a tray
// of barfi (working with fractions).
import { DICT } from './exp_i18n.js';
import { DICT_W10 } from './exp_i18n_w10.js';
import * as MW from './mathworld.js';
import * as MW10 from './mathworld10.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W10);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C7l = N('Ch 1 · Large Numbers Around Us', 'अध्याय 1 · हमारे आसपास की बड़ी संख्याएँ', 'Ch 1 · Hamare aaspaas ke bade numbers');
const C7a = N('Ch 2 · Arithmetic Expressions', 'अध्याय 2 · अंकगणितीय व्यंजक', 'Ch 2 · Arithmetic expressions');
const C7e = N('Ch 4 · Expressions using Letter-Numbers', 'अध्याय 4 · अक्षर-संख्याओं वाले व्यंजक', 'Ch 4 · Letter-numbers wale expressions');
const C7n = N('Ch 6 · Number Play', 'अध्याय 6 · संख्याओं का खेल', 'Ch 6 · Number play');
const C7f = N('Ch 8 · Working with Fractions', 'अध्याय 8 · भिन्नों के साथ काम', 'Ch 8 · Fractions ke saath kaam');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const OK = '#8be07a';
const waitFor = async (K, f, max = 60) => { for (let i = 0; i < max * 10 && !f(); i++) await K.sleep(0.1); };

export const EXPERIMENTS_W10 = [
  // ---------------------------------------------------------------- Ch 1: from one cube to a crore
  {
    id: 'w7_crore_cube', subj: 'maths', cls: 7, ch: C7l, world: true, place: 'quad', table: false,
    title: X('How big is a crore? Stand inside one'),
    aim: X('To make ten times as many 1 cm cubes again and again with your own hand, up to 10 lakh, and then stand inside a cube of one crore of them.'),
    kind: X('Large numbers: lakh and crore'),
    setup(K) {
      const cp = K.add(MW10.crorePlay(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      cp.camView = { p: V3(K, 0.6, 1.7, 1.9), t: V3(K, 0.6, 0.7, -2.0) };
      cp.words = () => [tl(K, X('lakh')), tl(K, X('crore'))]; cp.relabel();
      MW10.bindCroreHands(cp, lever, K.app, { grow: 1 }, { grow: () => K.lab.emit('grow', { obj: cp.id }) });
      return { cp, lever };
    },
    steps: [
      { do: X('On the stand is one small red cube, 1 cm on each side. How much room would a crore of them take?'), target: 'cp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cp.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each push of the lever will make ten times as many cubes.') },
      { do: X('Push the lever again and again: 10, 100, 1,000 … up to 10 lakh cubes.'), target: 'cp',
        act: async (K, o) => { while (o.cp.stage < 6) { o.cp.next(); await K.sleep(0.8); } K.lab.emit('grow', { obj: o.cp.id }); },
        ev: { type: 'grow' }, see: X('10 make a rod, 100 a flat, 1,000 a 10 cm cube, 1 lakh a slab 1 m × 1 m, and 10 lakh a cube 1 m on each side.') },
      { do: X('One more ×10 makes a crore. Look all around you.'), target: 'cp',
        act: async (K, o) => { o.cp.setStage(7); K.lab.emit('crore', { obj: o.cp.id }); await K.sleep(2); },
        ev: { type: 'crore' }, see: X('A crore of 1 cm cubes makes a cube about 2.15 m on each side, and you are standing inside it! It is 10 of the 1 m cubes.') },
      { do: X('Read the numbers the Indian way.'), target: 'cp',
        act: async (K, o) => { K.lab.emit('read', { obj: o.cp.id }); label(K, '1,00,000 = 1 ' + tl(K, X('lakh')) + '    1,00,00,000 = 1 ' + tl(K, X('crore')), o.cp.at('crore'), 0.17, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'read' }, see: X('In the Indian system, commas come after the first 3 digits from the right, then after every 2: 1,00,000 is one lakh and 1,00,00,000 is one crore. Ten lakh make a crore.') },
    ],
    eq: { word: 'Place value', sym: '1 crore = 100 lakh = 1,00,00,000' },
    result: {
      obs: X('Each push made ten times as many cubes: 1, 10, 100 … 10 lakh made a 1 m cube, and a crore made a cube about 2.15 m wide, big enough to stand in.'),
      concl: X('Each place is ten times the one before. 1 lakh = 1,00,000 and 1 crore = 1,00,00,000 = 100 lakh. Large numbers grow very fast when we keep multiplying by 10.'),
      safety: X('Look where you step when you walk around the cubes.'),
      viva: [{ q: X('How many lakhs make one crore?'), a: X('100.') },
        { q: X('Write 25 lakh in figures.'), a: X('25,00,000.') },
        { q: X('How many 1 m cubes would 10 crore 1 cm cubes fill?'), a: X('100.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 2: a shop bill
  {
    id: 'w7_shop_bill', subj: 'maths', cls: 7, ch: C7a, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('A shop bill as an arithmetic expression'),
    aim: X('To put items on a shop counter with your own hand, write the bill as an expression, and see why the order of operations and brackets matter.'),
    kind: X('Terms, order of operations and brackets'),
    setup(K) {
      const sb = K.add(MW10.shopBill(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      sb.camView = { p: V3(K, 0.02, 0.66, 0.82), t: V3(K, 0.0, 0.14, -0.14) };
      MW10.bindShopHands(sb, lever, K.app, { add: 1 }, { all: () => K.lab.emit('add', { obj: sb.id }) });
      return { sb, lever };
    },
    steps: [
      { do: X('At the shop, biscuits cost ₹12 a packet and notebooks cost ₹25 each.'), target: 'sb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The board will show the bill.') },
      { do: X('Push the lever to put 3 packets of biscuits and 2 notebooks on the counter, one at a time.'), target: 'sb',
        act: async (K, o) => { while (o.sb.n < 5) { o.sb.add1(); await waitFor(K, () => !o.sb.busy); await K.sleep(0.2); } K.lab.emit('add', { obj: o.sb.id }); },
        ev: { type: 'add' }, see: X('12 + 12 + 12 + 25 + 25 can be written shorter as 3 × 12 + 2 × 25. It has two terms: 3 × 12 and 2 × 25.') },
      { do: X('Work out the bill.'), target: 'sb',
        act: async (K, o) => { o.sb.say(['3 × 12 + 2 × 25', '= 36 + 50 = ₹86'], ['#ffffff', OK]); K.lab.emit('total', { obj: o.sb.id }); label(K, '(3 × 12 + 2) × 25 = 950  ✗', o.sb.at('front'), 0.03, 0, { color: '#ff8a7a', step: true }); await K.sleep(2); },
        ev: { type: 'total' }, see: X('Work out each term first, then add: 36 + 50 = ₹86. Going left to right and adding 2 before multiplying by 25 would give 950, which is wrong.') },
      { do: X('You pay with a ₹100 note. How much change?'), target: 'sb',
        act: async (K, o) => { fresh(K); o.sb.say(['100 − (3 × 12 + 2 × 25)', '= 100 − 86 = ₹14'], ['#ffffff', OK]); K.lab.emit('change', { obj: o.sb.id }); await K.sleep(2); },
        ev: { type: 'change' }, see: X('The brackets keep the whole bill together: 100 − (36 + 50) = 14. Without them, 100 − 36 + 50 would give 114.') },
    ],
    eq: { word: 'The bill', sym: '3 × 12 + 2 × 25 = 86' },
    result: {
      obs: X('The bill was 3 × 12 + 2 × 25 = ₹86, and the change from ₹100 was 100 − (3 × 12 + 2 × 25) = ₹14.'),
      concl: X('In an expression, multiplications are done before additions and subtractions, term by term. Brackets are worked out first and keep a group together.'),
      safety: X('Count your change before you leave the counter.'),
      viva: [{ q: X('Find 5 + 4 × 3.'), a: X('17.') },
        { q: X('Find (5 + 4) × 3.'), a: X('27.') },
        { q: X('How many terms are in 6 × 2 + 10 − 3 × 4?'), a: X('Three: 6 × 2, 10 and 3 × 4.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 4: matchstick squares
  {
    id: 'w7_matchsticks', subj: 'maths', cls: 7, ch: C7e, topic: 'algebra', world: true, place: 'quad', table: false,
    title: X('Matchstick squares and the rule 3n + 1'),
    aim: X('To build a row of squares from big matchsticks with your own hand, count the sticks, and find a rule with a letter-number that works for any number of squares.'),
    kind: X('Expressions with letter-numbers'),
    setup(K) {
      const mr = K.add(MW10.matchRow(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      mr.camView = { p: V3(K, 0.0, 2.2, 0.8), t: V3(K, 0.0, 0.25, -2.2) };
      mr.words = () => [tl(K, X('squares')), tl(K, X('sticks'))]; mr.relabel();
      MW10.bindMatchHands(mr, lever, K.app, { add: 1 }, { all: () => K.lab.emit('add', { obj: mr.id }) });
      return { mr, lever };
    },
    steps: [
      { do: X('One square needs 4 matchsticks.'), target: 'mr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mr.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Squares will be added in a row, sharing a side.') },
      { do: X('Push the lever to add squares to the row, up to 5 squares. Count the sticks each time.'), target: 'mr',
        act: async (K, o) => { while (o.mr.n < 5) { o.mr.next(); await K.sleep(0.9); } K.lab.emit('add', { obj: o.mr.id }); },
        ev: { type: 'add' }, see: X('4, 7, 10, 13, 16 sticks. Each new square needs only 3 more sticks (shown in yellow), because it shares a side.') },
      { do: X('Write a rule for n squares.'), target: 'mr',
        act: async (K, o) => { K.lab.emit('rule', { obj: o.mr.id }); label(K, '3 × n + 1', o.mr.at('rule'), 0.3, 0, { color: OK, edge: OK, step: true }); await K.sleep(2); },
        ev: { type: 'rule' }, see: X('Start with 1 stick, then add 3 for each square: 3 × n + 1, written 3n + 1. The letter n can stand for any number of squares.') },
      { do: X('Use the rule for 10 squares, then check.'), target: 'mr',
        act: async (K, o) => { fresh(K); label(K, '3 × 10 + 1 = 31', o.mr.at('rule'), 0.3, 0, { color: '#ffd23f', step: true }); await K.sleep(1); o.mr.setN(10); K.lab.emit('ten', { obj: o.mr.id }); await K.sleep(1.5); },
        ev: { type: 'ten' }, see: X('3 × 10 + 1 = 31 sticks, and the row of 10 squares has exactly 31.') },
    ],
    eq: { word: 'Sticks for n squares', sym: '3n + 1' },
    result: {
      obs: X('1, 2, 3, 4 and 5 squares took 4, 7, 10, 13 and 16 sticks. The rule 3n + 1 said 31 sticks for 10 squares, and that was right.'),
      concl: X('A letter-number such as n lets us write one rule for every case. Here the number of sticks is 3n + 1.'),
      safety: X('Never strike real matchsticks; fire can spread quickly.'),
      viva: [{ q: X('How many sticks for 20 squares?'), a: X('3 × 20 + 1 = 61.') },
        { q: X('With 25 sticks, how many squares can you make in a row?'), a: X('8, because 3 × 8 + 1 = 25.') },
        { q: X('What is the value of 3n + 1 when n = 7?'), a: X('22.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 6: a magic square on the ground
  {
    id: 'w7_magic_square', subj: 'maths', cls: 7, ch: C7n, world: true, place: 'quad', table: false,
    title: X('A magic square on the ground'),
    aim: X('To place the numbers 1 to 9 on a big grid with your own hand, check that every row, column and diagonal adds up to the same number, and find out why it is 15.'),
    kind: X('Magic squares'),
    setup(K) {
      const ms = K.add(MW10.magicSquare(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      ms.camView = { p: V3(K, 0.3, 4.6, 1.5), t: V3(K, 0.3, 0, -2.85) };
      MW10.bindMagicHands(ms, lever, K.app, { place: 1 }, { all: () => K.lab.emit('place', { obj: ms.id }) });
      return { ms, lever };
    },
    steps: [
      { do: X('The numbers 1 to 9 go on a 3 × 3 grid, so that every row, column and diagonal has the same sum.'), target: 'ms',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ms.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Such a grid is called a magic square.') },
      { do: X('Push the lever to place the stones, one row at a time.'), target: 'ms',
        act: async (K, o) => { while (o.ms.rows < 3) { o.ms.next(); await waitFor(K, () => !o.ms.busy()); await K.sleep(0.3); } K.lab.emit('place', { obj: o.ms.id }); },
        ev: { type: 'place' }, see: X('8 + 1 + 6, 3 + 5 + 7 and 4 + 9 + 2 all make 15.') },
      { do: X('Now check the columns and the diagonals.'), target: 'ms',
        act: async (K, o) => { o.ms.showAll(); K.lab.emit('all', { obj: o.ms.id }); label(K, '1 + 2 + … + 9 = 45,  45 ÷ 3 = 15', o.ms.at('total'), 0.22, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'all' }, see: X('All 8 lines make 15. The numbers 1 to 9 add up to 45, shared equally by 3 rows, so each row must be 15.') },
      { do: X('Look at the middle stone.'), target: 'ms',
        act: async (K, o) => { o.ms.centre(); K.lab.emit('mid', { obj: o.ms.id }); await K.sleep(2); },
        ev: { type: 'mid' }, see: X('5 is in the middle row, the middle column and both diagonals. In a 3 × 3 magic square of 1 to 9, the middle number is always 5.') },
    ],
    eq: { word: 'Magic sum', sym: '(1 + 2 + … + 9) ÷ 3 = 15' },
    result: {
      obs: X('Every row, column and diagonal of the square added up to 15, and 5 was in the middle.'),
      concl: X('In a 3 × 3 magic square using 1 to 9, the magic sum is 45 ÷ 3 = 15, and the centre must be 5.'),
      safety: X('Do not throw the stones; place them gently.'),
      viva: [{ q: X('What is 1 + 2 + 3 + … + 9?'), a: X('45.') },
        { q: X('If every number in the square is doubled, what is the new magic sum?'), a: X('30.') },
        { q: X('How many lines must add to 15 in a 3 × 3 magic square?'), a: X('8: 3 rows, 3 columns and 2 diagonals.') }],
    },
  },
  // ---------------------------------------------------------------- Ch 8: a tray of barfi
  {
    id: 'w7_fraction_barfi', subj: 'maths', cls: 7, ch: C7f, world: true, place: 'kitchen', table: true,
    title: X('A fraction of a fraction: a tray of barfi'),
    aim: X('To cut a tray of barfi with your own hand, take 2/3 of the 3/4 that is left, and see why we multiply fractions top by top and bottom by bottom.'),
    kind: X('Multiplying fractions'),
    setup(K) {
      const bt = K.add(MW10.barfiTray(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      bt.camView = { p: V3(K, 0.0, 0.58, 0.62), t: V3(K, 0.0, 0.06, -0.1) };
      bt.say(['3/4'], '#ffd23f');
      MW10.bindBarfiHands(bt, lever, K.app, { cut: 1 }, { cut: () => K.lab.emit('cut', { obj: bt.id }) });
      return { bt, lever };
    },
    steps: [
      { do: X('A tray of barfi was cut into 4 strips, and one strip has been eaten. 3/4 of the tray is left.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bt.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('We want to give away 2/3 of what is left.') },
      { do: X('Push the lever to cut the tray across into 3 equal rows.'), target: 'bt',
        act: async (K, o) => { o.bt.cut(); await waitFor(K, () => !o.bt.cutting); await K.sleep(0.4); K.lab.emit('cut', { obj: o.bt.id }); },
        ev: { type: 'cut' }, see: X('Now the whole tray is 4 × 3 = 12 equal pieces, and 9 of them are left.') },
      { do: X('Give away 2 of the 3 rows of what is left: 2/3 of 3/4.'), target: 'bt',
        act: async (K, o) => { await K.tween(1.2, (k) => o.bt.setGive(ease(k))); o.bt.say(['2/3 × 3/4 = 6/12'], '#ff9a4a'); K.lab.emit('give', { obj: o.bt.id }); await K.sleep(1.5); },
        ev: { type: 'give' }, see: X('6 pieces are given away, out of 12 pieces in the whole tray: 6/12 of the tray.') },
      { do: X('Simplify, and find the rule.'), target: 'bt',
        act: async (K, o) => { o.bt.say(['2/3 × 3/4 = (2 × 3)/(3 × 4) = 6/12 = 1/2'], OK); K.lab.emit('rule', { obj: o.bt.id }); await K.sleep(2); },
        ev: { type: 'rule' }, see: X('6/12 = 1/2: half the tray was given away. The pieces given away are 2 × 3 (tops multiplied), out of 3 × 4 (bottoms multiplied).') },
    ],
    eq: { word: 'Fraction of a fraction', sym: 'a/b × c/d = (a × c)/(b × d)' },
    result: {
      obs: X('Cutting 4 strips into 3 rows made 12 pieces. 2/3 of the 3 strips left was 6 pieces, which is 6/12 = 1/2 of the tray.'),
      concl: X('To find a fraction of a fraction, multiply them: multiply the numerators and multiply the denominators. 2/3 of 3/4 = 6/12 = 1/2.'),
      safety: X('Let an adult handle sharp knives.'),
      viva: [{ q: X('What is 1/2 of 1/3?'), a: X('1/6.') },
        { q: X('Find 3/5 × 2/3.'), a: X('6/15 = 2/5.') },
        { q: X('Is 1/2 × 1/2 bigger or smaller than 1/2?'), a: X('Smaller: it is 1/4.') }],
    },
  },
];
