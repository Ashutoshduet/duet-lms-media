// Maths, batch 7: Class 6 adding and subtracting integers with positive and negative tokens (zero pairs); Class 9 the
// Tower of Hanoi, where the least numbers of moves 1, 3, 7, 15 make a sequence with the rule 2ⁿ − 1.
import { DICT } from './exp_i18n.js';
import { DICT_M7 } from './exp_i18n_m7.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M7);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 10 · The Other Side of Zero', 'अध्याय 10 · शून्य के उस पार', 'Ch 10 · Shunya ke us paar');
const C9 = N('Ch 8 · Predicting What Comes Next: Exploring Sequences and Progressions', 'अध्याय 8 · आगे क्या आएगा: अनुक्रम और श्रेढ़ियाँ', 'Ch 8 · Aage kya aayega: sequences aur progressions');
// words shown in the 3D labels
const W = {
  pairs3: X('3 zero pairs'), pairs6: X('6 zero pairs'), zeroPair: X('A zero pair'), none: X('No negative tokens'), left: X('Left on the tray'),
  move1: X('1 move'), moves3: X('3 moves'), moves7: X('7 moves'), moves15: X('15 moves'),
};
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
// carries the discs of the Tower of Hanoi from peg A to peg C in the least moves, `sec` seconds a move
async function solve(K, th, n, sec) { th.setN(n); th.count(0); await K.sleep(0.4); for (const [a, c] of th.solve(n)) await K.tween(sec, (k) => th.move(a, c, k)); }

export const EXPERIMENTS_M7 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_zero_pairs', subj: 'maths', cls: 6, ch: C6, title: X('Adding and subtracting integers with tokens'),
    aim: X('To add and subtract integers with positive and negative tokens, where a positive and a negative token together make a zero pair.'),
    kind: X('Integers with a token model'),
    setup(K) { const tk = K.add(K.MT7.integerTokens(), 0, -0.56); tk.camView = { p: V(K, 0, 0.27, 0.2), t: V(K, 0, 0, -0.02) }; return { tk }; },
    steps: [
      { do: X('Find (+5) + (−3). Put 5 positive tokens in a row, and 3 negative tokens below them.'), target: 'tk',
        act: async (K, o) => { o.tk.reset(0, 0); o.tk.plan(range(0, 5).map((i) => ({ t: 'p', i, to: o.tk.spot(i, 'p') }))); await K.tween(1.2, (k) => o.tk.go(k));
          o.tk.plan(range(0, 3).map((i) => ({ t: 'n', i, to: o.tk.spot(i, 'n') }))); await K.tween(1, (k) => o.tk.go(k)); K.lab.emit('place', { obj: o.tk.id });
          await tagAt(K, o.tk.at('below'), '(+5) + (−3)', 3.2, 0, 0.0); }, ev: { type: 'place' },
        see: X('There are 5 blue positive tokens, each worth +1, and 3 red negative tokens, each worth −1.') },
      { do: X('Put each negative token next to a positive token.'), target: 'tk',
        act: async (K, o) => { o.tk.plan(range(0, 3).map((i) => ({ t: 'n', i, to: [o.tk.spot(i, 'p')[0], o.tk.spot(i, 'p')[1] - 0.024] }))); await K.tween(1.4, (k) => o.tk.go(k));
          K.lab.emit('pair', { obj: o.tk.id }); tagAt(K, o.tk.at('neg'), tl(K, W.zeroPair), 3.4, 0, 0.0); await tagAt(K, o.tk.at('below'), '(+1) + (−1) = 0', 3.4, 0, 0.0); }, ev: { type: 'pair' },
        see: X('Each negative token now sits with a positive token. A positive and a negative token together make a zero pair: their value is 0.') },
      { do: X('Take the zero pairs off the tray.'), target: 'tk',
        act: async (K, o) => { o.tk.plan([...range(0, 3).map((i) => ({ t: 'p', i, to: 'bin' })), ...range(0, 3).map((i) => ({ t: 'n', i, to: 'bin' }))]); await K.tween(1.6, (k) => o.tk.go(k));
          K.lab.emit('remove', { obj: o.tk.id }); tagAt(K, o.tk.at('bin'), tl(K, W.pairs3), 3.6, 0, 0.0); await tagAt(K, o.tk.at('below'), '(+5) + (−3) = +2', 3.6, 0, 0.0); }, ev: { type: 'remove' },
        see: X('2 positive tokens are left on the tray. So (+5) + (−3) = +2.'),
        why: X('Taking away zero pairs takes away 0, so the value of the tokens on the tray does not change.') },
      { do: X('Now find (+4) − (−6). Put 4 positive tokens on the tray.'), target: 'tk',
        act: async (K, o) => { o.tk.plan([...range(0, 4).map((i) => ({ t: 'p', i, to: o.tk.spot(i, 'p') })), { t: 'p', i: 4, s: 0 }]); await K.tween(1.4, (k) => o.tk.go(k));
          K.lab.emit('place', { obj: o.tk.id }); tagAt(K, o.tk.at('neg'), tl(K, W.none), 3.4, 0.03, 0.0); await tagAt(K, o.tk.at('below'), '(+4) − (−6) = ?', 3.4, 0, 0.0); }, ev: { type: 'place' },
        see: X('There are 4 positive tokens and no negative tokens. So we cannot take away 6 negative tokens yet.') },
      { do: X('Put 6 zero pairs on the tray.'), target: 'tk',
        act: async (K, o) => { o.tk.plan([...range(4, 10).map((i) => ({ t: 'p', i, to: o.tk.spot(i, 'p') })), ...range(0, 6).map((i) => ({ t: 'n', i, to: o.tk.spot(i + 4, 'n') }))]); await K.tween(1.8, (k) => o.tk.go(k));
          K.lab.emit('add', { obj: o.tk.id }); tagAt(K, o.tk.at('pairs'), tl(K, W.pairs6), 3.6, 0, 0.0); await tagAt(K, o.tk.at('below'), '(+4) + 0 = +4', 3.6, 0, 0.0); }, ev: { type: 'add' },
        see: X('Now there are 10 positive tokens and 6 negative tokens. Their value is still +4, because we only added zero.') },
      { do: X('Now take away the 6 negative tokens.'), target: 'tk',
        act: async (K, o) => { o.tk.plan(range(0, 6).map((i) => ({ t: 'n', i, to: 'bin' }))); await K.tween(1.6, (k) => o.tk.go(k));
          K.lab.emit('remove', { obj: o.tk.id }); tagAt(K, o.tk.at('row'), tl(K, W.left), 4, 0, 0.0); await tagAt(K, o.tk.at('below'), '(+4) − (−6) = +10', 4, 0, 0.0); }, ev: { type: 'remove' },
        see: X('10 positive tokens are left. So (+4) − (−6) = +10, the same answer as (+4) + (+6).'),
        why: X('Taking away 6 negative tokens leaves the 6 positive tokens of the zero pairs behind. So subtracting −6 is the same as adding +6.') },
    ],
    eq: { word: 'Subtracting a negative number with tokens', sym: '(+4) − (−6) = (+4) + (+6) = +10' },
    result: { obs: X('3 zero pairs came off in (+5) + (−3), leaving 2 positive tokens. For (+4) − (−6), we added 6 zero pairs and took away the 6 negative tokens, leaving 10 positive tokens.'),
      concl: X('A positive and a negative token cancel each other as a zero pair. (+5) + (−3) = +2, and (+4) − (−6) = +10: subtracting a negative number is the same as adding the positive number.'),
      safety: X('Small tokens can be bottle caps or paper circles marked + and −. Keep them away from your mouth and count them back into the box.'),
      viva: [{ q: X('What is the value of one positive token and one negative token together?'), a: X('0. They make a zero pair.') },
        { q: X('Find (−3) − (+5) with tokens.'), a: X('Put 3 negative tokens. Add 5 zero pairs, then take away the 5 positive tokens. 8 negative tokens are left, so the answer is −8.') },
        { q: X('Which is bigger, (+5) + (−3) or (+4) − (−6)?'), a: X('(+4) − (−6) = +10 is bigger than (+5) + (−3) = +2.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 9
  {
    id: 'm9_tower_of_hanoi', subj: 'maths', cls: 9, ch: C9, title: X('Tower of Hanoi: predicting the number of moves'),
    aim: X('To find the least number of moves that carry 1, 2, 3 and 4 discs from one peg to another in the Tower of Hanoi, and to find the rule of this sequence.'),
    kind: X('Sequences: recursive and explicit rules'),
    setup(K) { const th = K.add(K.MT7.towerOfHanoi(), 0, -0.56); th.camView = { p: V(K, 0, 0.33, 0.32), t: V(K, 0, 0.03, 0.02) }; return { th }; },
    steps: [
      { do: X('Put 1 disc on peg A and move it to peg C.'), target: 'th',
        act: async (K, o) => { await solve(K, o.th, 1, 1.2); o.th.result(1, 1); K.lab.emit('move', { obj: o.th.id });
          tagAt(K, o.th.at('counter'), tl(K, W.move1), 3, 0, 0.025); await tagAt(K, o.th.at('mid'), 'T₁ = 1', 3, 0, 0.0); }, ev: { type: 'move' },
        see: X('With 1 disc, 1 move is enough.') },
      { do: X('Now put 2 discs on peg A and carry them to peg C. Move one disc at a time, and never put a bigger disc on a smaller one.'), target: 'th',
        act: async (K, o) => { await solve(K, o.th, 2, 1.1); o.th.result(2, 3); K.lab.emit('move', { obj: o.th.id });
          tagAt(K, o.th.at('counter'), tl(K, W.moves3), 3.4, 0, 0.025); await tagAt(K, o.th.at('mid'), 'T₂ = 3', 3.4, 0, 0.0); }, ev: { type: 'move' },
        see: X('The small disc goes to peg B, the big disc to peg C, and then the small disc onto it. That is 3 moves.') },
      { do: X('Do the same with 3 discs.'), target: 'th',
        act: async (K, o) => { await solve(K, o.th, 3, 0.8); o.th.result(3, 7); K.lab.emit('move', { obj: o.th.id });
          tagAt(K, o.th.at('counter'), tl(K, W.moves7), 3.8, 0, 0.025); await tagAt(K, o.th.at('mid'), 'T₃ = 3 + 1 + 3 = 7', 3.8, 0, 0.0); }, ev: { type: 'move' },
        see: X('It takes 7 moves. The top 2 discs go to peg B in 3 moves, the biggest disc goes to peg C in 1 move, and the 2 discs go onto it in 3 more moves.'),
        why: X('So the moves for 3 discs are 2 × 3 + 1. Each new disc needs twice the moves for the smaller tower, plus 1. This is a recursive rule.') },
      { do: X('Now try 4 discs.'), target: 'th',
        act: async (K, o) => { await solve(K, o.th, 4, 0.5); o.th.result(4, 15); K.lab.emit('move', { obj: o.th.id });
          tagAt(K, o.th.at('counter'), tl(K, W.moves15), 4, 0, 0.025); await tagAt(K, o.th.at('mid'), 'T₄ = 2 × 7 + 1 = 15', 4, 0, 0.0); }, ev: { type: 'move' },
        see: X('It takes 15 moves: 7 to carry the top 3 discs to peg B, 1 for the biggest disc, and 7 more to put the 3 discs back on top of it.') },
      { do: X('Write the numbers of moves as a sequence: 1, 3, 7, 15. Add 1 to each term.'), target: 'th',
        act: async (K, o) => { o.th.plusOne(); K.lab.emit('pattern', { obj: o.th.id });
          tagAt(K, o.th.at('mid2'), 'Tₙ + 1 = 2ⁿ', 4.2, 0, 0.0); await tagAt(K, o.th.at('mid'), 'Tₙ = 2ⁿ − 1', 4.2, 0, 0.0); }, ev: { type: 'pattern' },
        see: X('Adding 1 gives 2, 4, 8 and 16, the powers of 2. So n discs need 2 to the power n, minus 1 moves.'),
        why: X('Now we can predict what comes next without moving a disc: 5 discs need 2 to the power 5, minus 1, that is 31 moves, and 10 discs need 1023 moves.') },
    ],
    eq: { word: 'Least number of moves for n discs', sym: 'Tₙ₊₁ = 2Tₙ + 1,  Tₙ = 2ⁿ − 1' },
    result: { obs: X('The least numbers of moves for 1, 2, 3 and 4 discs were 1, 3, 7 and 15.'),
      concl: X('Each term of the sequence 1, 3, 7, 15 is 2 times the term before it, plus 1: this is a recursive rule. The explicit rule is 2 to the power n, minus 1, so we can predict any term: 5 discs need 31 moves.'),
      safety: X('Cardboard discs of four sizes and three pencils standing in clay make a good Tower of Hanoi. Handle the pencils gently so that they do not tip over.'),
      viva: [{ q: X('How many moves are needed for 6 discs?'), a: X('2 to the power 6, minus 1, that is 63 moves.') },
        { q: X('Is 1, 3, 7, 15 an arithmetic progression?'), a: X('No. The differences 2, 4 and 8 are not equal: they double each time.') },
        { q: X('Write the recursive rule for the number of moves.'), a: X('The first term is 1, and each next term is 2 times the term before it, plus 1.') }] },
  },
];
