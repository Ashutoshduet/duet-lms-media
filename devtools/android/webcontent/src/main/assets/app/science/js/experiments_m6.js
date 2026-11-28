// Maths, batch 6: Class 6 folding a paper circle in half again and again to make a paper protractor, and measuring
// an angle with it; Class 10 drawing a ball from a bag of 3 red and 5 black balls (the probability of an event and of
// its complement add up to 1).
import { DICT } from './exp_i18n.js';
import { DICT_M6 } from './exp_i18n_m6.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M6);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C6 = N('Ch 2 · Lines and Angles', 'अध्याय 2 · रेखाएँ और कोण', 'Ch 2 · Lines aur angles');
const C10 = N('Ch 14 · Probability', 'अध्याय 14 · प्रायिकता', 'Ch 14 · Probability');
// words shown in the 3D labels
const W = {
  straight: X('A straight angle'), right: X('A right angle'),
  parts: X('8 equal parts'), six: X('6 parts'), outcomes: X('8 equally likely outcomes'),
  red: X('Red'), black: X('Black'), draws: X('40 draws'),
};
const view = (K, it, z = 0.3, y = 0.36, dx = 0) => { it.camView = { p: V(K, dx, y, z + 0.06), t: V(K, dx, 0, 0.06) }; };
// the order of the first few draws, shown one by one (true = red)
const FIRST = [true, false, false, true, false];

export const EXPERIMENTS_M6 = [
  // ------------------------------------------------------------------------------------------------ Class 6
  {
    id: 'm6_paper_protractor', subj: 'maths', cls: 6, ch: C6, title: X('Make a paper protractor by folding a circle'),
    aim: X('To fold a paper circle in half again and again to make a protractor with equal parts, and to measure an angle with it.'),
    kind: X('Measuring angles'),
    setup(K) { const pp = K.add(K.MT6.paperProtractor(), 0, -0.56); view(K, pp, 0.27, 0.33, 0); return { pp }; },
    steps: [
      { do: X('Cut a circle out of paper. Fold it in half along a line through its centre.'), target: 'pp',
        act: async (K, o) => { await K.tween(1.8, (k) => o.pp.fold(0, k)); K.lab.emit('fold', { obj: o.pp.id });
          tagAt(K, o.pp.at('below'), '360° ÷ 2 = 180°', 3.4, 0, 0.0); await tagAt(K, o.pp.at('top'), tl(K, W.straight), 3.4, 0, 0.02); }, ev: { type: 'fold' },
        see: X('The circle becomes a half circle. Its folded edge is a straight line, so the angle at the centre is a straight angle of 180°.'),
        why: X('A full turn round the centre is 360°. Half of it is 180°.') },
      { do: X('Fold the half circle in half again.'), target: 'pp',
        act: async (K, o) => { await K.tween(1.6, (k) => o.pp.fold(1, k)); K.lab.emit('fold', { obj: o.pp.id });
          tagAt(K, o.pp.at('below'), '180° ÷ 2 = 90°', 3.4, 0, 0.0); await tagAt(K, o.pp.at('top'), tl(K, W.right), 3.4, 0.03, 0.02); }, ev: { type: 'fold' },
        see: X('Now it is a quarter of the circle. Its corner at the centre is a right angle, 90°.') },
      { do: X('Fold it in half once more, and then once again.'), target: 'pp',
        act: async (K, o) => { await K.tween(1.4, (k) => o.pp.fold(2, k)); tagAt(K, o.pp.at('right'), '90° ÷ 2 = 45°', 2.4, 0, 0.02); await K.sleep(1.2);
          await K.tween(1.4, (k) => o.pp.fold(3, k)); K.lab.emit('fold', { obj: o.pp.id }); await tagAt(K, o.pp.at('below'), '45° ÷ 2 = 22.5°', 3.4, 0, 0.0); }, ev: { type: 'fold' },
        see: X('The corner at the centre becomes 45°, and then 22.5°. The paper is now a thin wedge, 16 layers thick.'),
        why: X('Each fold cuts the angle at the centre into two equal halves.') },
      { do: X('Open the last three folds, but keep the first fold, so that you have a half circle again. Mark 0°, 45°, 90°, 135° and 180° along its edge.'), target: 'pp',
        act: async (K, o) => { o.pp.creases(true); for (const j of [3, 2, 1]) await K.tween(1.1, (k) => o.pp.fold(j, 1 - k));
          o.pp.marks.visible = true; K.lab.emit('unfold', { obj: o.pp.id });
          tagAt(K, o.pp.at('below'), '180° ÷ 8 = 22.5°', 3.6, 0, 0.0); await tagAt(K, o.pp.at('top'), tl(K, W.parts), 3.6, 0, 0.03); }, ev: { type: 'unfold' },
        see: X('The creases split the half circle into 8 equal angles of 22.5° each. This is your paper protractor.'),
        why: X('180° shared into 8 equal parts gives 22.5° for each part. Every second crease marks 45°.') },
      { do: X('Place the protractor on angle ABC, with its centre on B and its straight edge along BC. Count the parts from BC up to BA.'), target: 'pp',
        act: async (K, o) => { await K.tween(1.8, (k) => o.pp.move(k)); await K.tween(2.4, (k) => o.pp.count(6, k)); K.lab.emit('measure', { obj: o.pp.id });
          tagAt(K, o.pp.at('card'), '∠ABC = 6 × 22.5° = 135°', 4, 0, 0.02); await tagAt(K, o.pp.at('arm'), tl(K, W.six), 4, -0.02, 0.02); }, ev: { type: 'measure' },
        see: X('The arm BA lies along the 6th crease. So angle ABC is 6 × 22.5° = 135°, the mark between 90° and 180°.'),
        why: X('An angle is measured by how many equal unit angles fit into it. A real protractor does the same with 180 parts of 1° each.') },
    ],
    eq: { word: 'Angle measured with the paper protractor', sym: '∠ABC = 6 × 22.5° = 135°' },
    result: { obs: X('Folding the circle in half four times gave creases at every 22.5°. Angle ABC covered 6 of these parts.'),
      concl: X('Folding a circle in half again and again splits the angle round its centre into equal parts. Counting these equal parts measures an angle: angle ABC is 135°, an obtuse angle.'),
      safety: X('Use scissors with rounded tips to cut the circle, and cut away from your hand.'),
      viva: [{ q: X('How many degrees is a full turn? A straight angle? A right angle?'), a: X('A full turn is 360°, a straight angle is 180° and a right angle is 90°.') },
        { q: X('If you fold the circle in half one more time, how big is each part?'), a: X('22.5° ÷ 2 = 11.25°.') },
        { q: X('Is an angle of 135° acute, right or obtuse?'), a: X('It is obtuse, because it is more than 90° and less than 180°.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 10
  {
    id: 'm10_ball_bag', subj: 'maths', cls: 10, ch: C10, title: X('Drawing a ball from a bag: red or not red?'),
    aim: X('To find the probability of drawing a red ball, and a ball that is not red, from a bag of 3 red and 5 black balls, and to see that the two probabilities add up to 1.'),
    kind: X('Probability of an event'),
    setup(K) { const bb = K.add(K.MT6.ballBag(), 0, -0.56); bb.camView = { p: V(K, 0, 0.44, 0.35), t: V(K, 0, 0, 0.025) }; return { bb }; },
    steps: [
      { do: X('Put 3 red balls and 5 black balls of the same size into a bag, and shake it well.'), target: 'bb',
        act: async (K, o) => { for (let i = 0; i < 8; i++) await K.tween(0.7, (k) => o.bb.toBag(i, k)); await K.tween(1.4, (k) => o.bb.shake(k));
          K.lab.emit('fill', { obj: o.bb.id }); await tagAt(K, o.bb.at('bagTop'), '3 + 5 = 8', 3, 0.02, 0.02); }, ev: { type: 'fill' },
        see: X('The bag has 8 balls. They feel the same, so when you put your hand in without looking, you cannot tell red from black.') },
      { do: X('List all the possible outcomes: take the balls out and line them up.'), target: 'bb',
        act: async (K, o) => { for (let i = 7; i >= 0; i--) await K.tween(0.5, (k) => o.bb.toBag(i, 1 - k)); K.lab.emit('arrange', { obj: o.bb.id });
          await tagAt(K, o.bb.at('below'), tl(K, W.outcomes), 3.6, 0, 0.0); }, ev: { type: 'arrange' },
        see: X('Any one of the 8 balls can be drawn. So there are 8 outcomes, and each is equally likely.'),
        why: X('The balls are of the same size and are well mixed, so no ball has a better chance than another.') },
      { do: X('Pick out the outcomes favourable to the event E, the ball drawn is red.'), target: 'bb',
        act: async (K, o) => { await K.tween(1, (k) => o.bb.pick('red', k)); K.lab.emit('count', { obj: o.bb.id });
          tagAt(K, o.bb.at('red'), tl(K, W.red), 3.4, 0, 0.03); await tagAt(K, o.bb.at('below'), 'P(E) = 3/8', 3.6, 0, 0.0); }, ev: { type: 'count' },
        see: X('3 of the 8 outcomes are red. So the probability of drawing a red ball is 3/8.'),
        why: X('Probability of an event = number of outcomes favourable to it ÷ number of all possible outcomes.') },
      { do: X('Now pick out the outcomes for the event not E, the ball drawn is not red.'), target: 'bb',
        act: async (K, o) => { await K.tween(0.6, (k) => o.bb.pick('red', 1 - k)); await K.tween(1, (k) => o.bb.pick('black', k)); K.lab.emit('count', { obj: o.bb.id });
          tagAt(K, o.bb.at('black'), tl(K, W.black), 3.6, 0, 0.03); await tagAt(K, o.bb.at('below'), 'P(Ē) = 5/8,  3/8 + 5/8 = 1', 3.8, 0, 0.0); }, ev: { type: 'count' },
        see: X('5 of the 8 outcomes are not red. So P(not E) = 5/8, and 3/8 + 5/8 = 1.'),
        why: X('Every ball is either red or not red, never both. So P(E) + P(not E) = 1. These two events are called complementary events.') },
      { do: X('Put the balls back. Draw one ball without looking, note its colour and put it back. Do this 40 times.'), target: 'bb',
        act: async (K, o) => { await K.tween(0.5, (k) => o.bb.pick('black', 1 - k)); for (let i = 0; i < 8; i++) await K.tween(0.35, (k) => o.bb.toBag(i, k));
          let r = 0, b = 0; for (const red of FIRST) { await K.tween(0.9, (k) => o.bb.drawOne(red, k)); if (red) r++; else b++; o.bb.tally(r, b); }
          await K.tween(2.2, (k) => o.bb.tally(Math.round(r + (14 - r) * k), Math.round(b + (26 - b) * k))); K.lab.emit('draw', { obj: o.bb.id });
          tagAt(K, o.bb.at('tally'), tl(K, W.draws), 4, 0, 0.03); await tagAt(K, o.bb.at('below'), '14/40 = 0.35,  3/8 = 0.375', 4, 0, 0.0); }, ev: { type: 'draw' },
        see: X('Red came 14 times and black 26 times. 14/40 = 0.35 is close to 3/8 = 0.375.'),
        why: X('3/8 tells us what to expect, not what will happen each time. The more times you draw, the closer the fraction of red balls usually gets to 3/8.') },
    ],
    eq: { word: 'Probability of an event and of its complement', sym: 'P(E) + P(Ē) = 1' },
    result: { obs: X('The bag had 8 equally likely outcomes: 3 red and 5 black. In 40 draws with the ball put back each time, red came 14 times and black 26 times.'),
      concl: X('The probability of drawing a red ball is 3/8 and of drawing a ball that is not red is 5/8. The probabilities of an event and of its complement add up to 1.'),
      safety: X('Draw without looking and put the ball back each time, or the outcomes will not stay equally likely.'),
      viva: [{ q: X('What is the probability of drawing a green ball from this bag?'), a: X('0, because there is no green ball in the bag. It is an impossible event.') },
        { q: X('What is the probability of drawing a ball that is red or black?'), a: X('8/8 = 1, because every ball is red or black. It is a sure event.') },
        { q: X('If 2 more red balls are added, what is the probability of drawing a red ball?'), a: X('There are now 5 red balls out of 10, so the probability is 5/10 = 1/2.') }] },
  },
];
