// Maths, batch 10: Class 8 sharbat mixed in three glasses with one small cup: the same ratio of syrup to water gives
// the same colour and taste, but adding one more cup of each does not; Class 10 a straight wire turned about a point P
// of a circular wire, from a secant to the one tangent at P, which is perpendicular to the radius OP.
import { DICT } from './exp_i18n.js';
import { DICT_M10 } from './exp_i18n_m10.js';
import './actions_phys.js';
Object.assign(DICT, DICT_M10);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const tagAt = (K, p, txt, sec = 2.4, dx = 0.05, dy = 0.05) => K.showTag(txt, p, V(K, dx, dy, 0), sec);
const C8 = N('Ch 7 · Proportional Reasoning-1', 'अध्याय 7 · अनुपातिक तर्क-1', 'Ch 7 · Proportional reasoning-1');
const C10 = N('Ch 10 · Circles', 'अध्याय 10 · वृत्त', 'Ch 10 · Circles');
const DEG = Math.PI / 180;
// words shown in the 3D labels
const W = {
  syrup: X('Syrup'), water: X('Water'), same: X('Same colour'), darker: X('Darker: sweeter'),
  secant: X('Secant'), tangent: X('Tangent'), again: X('Cuts the circle again'),
};
const cm = (K, o) => `PR = ${(o.c.chord() * 100).toFixed(1)} cm`;

export const EXPERIMENTS_M10 = [
  // ------------------------------------------------------------------------------------------------ Class 8
  {
    id: 'm8_sharbat_ratio', subj: 'maths', cls: 8, ch: C8, title: X('Same taste: mixing sharbat in a ratio'),
    aim: X('To mix sharbat in three glasses with one small cup, and to find out which glasses taste the same by comparing the ratio of syrup to water.'),
    kind: X('Ratio and proportion'),
    setup(K) { const sb = K.add(K.MT10.sharbatGlasses(), 0, -0.56); sb.camView = { p: V(K, -0.01, 0.27, 0.45), t: V(K, -0.01, 0.055, 0.04) }; return { sb }; },
    steps: [
      { do: X('Look at the bottle of syrup, the jug of water, the small cup and the three empty glasses A, B and C.'), target: 'sb',
        act: async (K, o) => { o.sb.reset(); tagAt(K, o.sb.at('bottle'), tl(K, W.syrup), 3, 0, 0.0); await tagAt(K, o.sb.at('jug'), tl(K, W.water), 3, 0, 0.0); K.lab.emit('look', { obj: o.sb.id }); }, ev: { type: 'look' },
        see: X('We will fill every glass using the same small cup, so each cup holds the same amount.') },
      { do: X('Fill glass A with 1 cup of syrup and 3 cups of water.'), target: 'sb',
        act: async (K, o) => { await K.tween(4.4, (k) => o.sb.pour('A', ['s', 'w', 'w', 'w'], k)); K.lab.emit('pour', { obj: o.sb.id }); await tagAt(K, o.sb.at('A'), '1 : 3', 3, 0, 0.0); }, ev: { type: 'pour' },
        see: X('Glass A has syrup and water in the ratio 1 : 3. The sharbat is light pink.') },
      { do: X('Make a bigger glass B for two friends: 2 cups of syrup and 6 cups of water.'), target: 'sb',
        act: async (K, o) => { await K.tween(7, (k) => o.sb.pour('B', ['s', 's', 'w', 'w', 'w', 'w', 'w', 'w'], k)); K.lab.emit('pour', { obj: o.sb.id }); await tagAt(K, o.sb.at('B'), '2 : 6', 3, 0, 0.0); }, ev: { type: 'pour' },
        see: X('Glass B has twice as much syrup and twice as much water. It has the same colour as glass A, so it tastes the same.'),
        why: X('Both parts were multiplied by 2. The ratio 2 : 6 is the same as 1 : 3, so the two glasses are in proportion.') },
      { do: X('For glass C, someone adds 1 more cup of syrup and 1 more cup of water to the recipe of glass A: 2 cups of syrup and 4 cups of water.'), target: 'sb',
        act: async (K, o) => { await K.tween(5.6, (k) => o.sb.pour('C', ['s', 's', 'w', 'w', 'w', 'w'], k)); K.lab.emit('pour', { obj: o.sb.id }); await tagAt(K, o.sb.at('C'), '2 : 4', 3, 0, 0.0); }, ev: { type: 'pour' },
        see: X('Glass C is darker than glass A. It is sweeter, even though 1 cup was added to both syrup and water.'),
        why: X('Adding the same amount to both parts changes the ratio. 2 : 4 is the same as 1 : 2, and that is more syrup for each cup of water than 1 : 3.') },
      { do: X('Compare the three glasses and write each ratio in its simplest form.'), target: 'sb',
        act: async (K, o) => { tagAt(K, o.sb.at('Afoot'), '1 : 3', 4, 0, 0.0); tagAt(K, o.sb.at('Bfoot'), '2 : 6 = 1 : 3', 4, 0, 0.0); await tagAt(K, o.sb.at('Cfoot'), '2 : 4 = 1 : 2', 4, 0, 0.0); K.lab.emit('compare', { obj: o.sb.id }); }, ev: { type: 'compare' },
        see: X('A and B have the same ratio, 1 : 3, and the same colour. C has the ratio 1 : 2, and a different colour.') },
      { do: X('Write the rule for making more sharbat that tastes the same.'), target: 'sb',
        act: async (K, o) => { tagAt(K, o.sb.at('B'), tl(K, W.same), 4, -0.05, 0.0); tagAt(K, o.sb.at('C'), tl(K, W.darker), 4, 0.02, 0.0); await tagAt(K, o.sb.at('front'), '1 : 3 :: 2 : 6', 4, 0, 0.0); K.lab.emit('write', { obj: o.sb.id }); }, ev: { type: 'write' },
        see: X('To make more sharbat with the same taste, multiply the syrup and the water by the same number. We write 1 : 3 :: 2 : 6, and say the ratios are in proportion.') },
    ],
    eq: { word: 'Ratios in proportion', sym: '1 : 3 = 2 : 6 = 3 : 9' },
    result: { obs: X('Glasses A (1 : 3) and B (2 : 6) had the same colour. Glass C (2 : 4) was darker.'),
      concl: X('Two mixtures taste the same when their ratios are equal. Multiplying both parts of a ratio by the same number keeps it the same; adding the same number to both parts changes it.'),
      safety: X('Use clean glasses and clean water if you want to drink the sharbat, and wipe up any spills.'),
      viva: [{ q: X('How much water goes with 3 cups of syrup, for the taste of glass A?'), a: X('9 cups, because 1 : 3 is the same as 3 : 9.') },
        { q: X('Is 2 : 5 the same ratio as 1 : 3?'), a: X('No. 1 : 3 is the same as 2 : 6, not 2 : 5.') },
        { q: X('Why did glass C become sweeter?'), a: X('Because adding 1 cup to both parts made the ratio 1 : 2, so there was more syrup for each cup of water.') }] },
  },
  // ------------------------------------------------------------------------------------------------ Class 10
  {
    id: 'm10_tangent_wire', subj: 'maths', cls: 10, ch: C10, title: X('From a secant to a tangent: turning a wire about a point'),
    aim: X('To turn a straight wire about a point P of a circular wire, to see a secant become a tangent, and to check that the tangent at P is perpendicular to the radius OP.'),
    kind: X('Tangent to a circle'),
    setup(K) { const c = K.add(K.MT10.tangentWire(), 0, -0.56); c.camView = { p: V(K, 0.0, 0.42, 0.3), t: V(K, 0.0, 0, 0.06) }; return { c }; },
    steps: [
      { do: X('Look at the circular wire with centre O. A straight wire is pinned at the point P on it and can turn about P.'), target: 'c',
        act: async (K, o) => { o.c.reset(); tagAt(K, o.c.at('R'), 'R', 3, 0, 0.0); await tagAt(K, o.c.at('top'), tl(K, W.secant), 3, 0, 0.0); K.lab.emit('look', { obj: o.c.id }); }, ev: { type: 'look' },
        see: X('The straight wire cuts the circle at two points, P and R. A line that cuts a circle at two points is a secant.') },
      { do: X('Turn the straight wire slowly about P.'), target: 'c',
        act: async (K, o) => { await K.tween(3, (k) => o.c.turn(150 * DEG, 115 * DEG, k)); K.lab.emit('turn', { obj: o.c.id }); await tagAt(K, o.c.at('mid'), cm(K, o), 3, 0, 0.0); }, ev: { type: 'turn' },
        see: X('The point R moves along the circle towards P, and the chord PR gets shorter.') },
      { do: X('Keep turning until R comes and sits on P.'), target: 'c',
        act: async (K, o) => { await K.tween(3, (k) => o.c.turn(115 * DEG, 90 * DEG, k)); K.lab.emit('touch', { obj: o.c.id }); await tagAt(K, o.c.at('top'), tl(K, W.tangent), 3.4, 0, 0.0); }, ev: { type: 'touch' },
        see: X('Now the wire touches the circle at only one point, P. This line is the tangent to the circle at P.'),
        why: X('The two common points of the secant came together into one point. A tangent is the special case of a secant when its two points meet.') },
      { do: X('Turn the wire a little more, and then back again.'), target: 'c',
        act: async (K, o) => { await K.tween(2.4, (k) => o.c.turn(90 * DEG, 65 * DEG, k)); await tagAt(K, o.c.at('R'), tl(K, W.again), 2.4, 0, 0.0); await K.tween(2.4, (k) => o.c.turn(65 * DEG, 90 * DEG, k)); K.lab.emit('turn', { obj: o.c.id }); }, ev: { type: 'turn' },
        see: X('If we turn it further, the wire cuts the circle again, on the other side. Only one position of the wire touches the circle at P.'),
        why: X('There is one and only one tangent at a point of a circle.') },
      { do: X('Draw the radius OP and measure the angle between OP and the wire.'), target: 'c',
        act: async (K, o) => { await K.tween(1.6, (k) => o.c.showRadius(k)); K.lab.emit('measure', { obj: o.c.id }); await tagAt(K, o.c.at('P'), '90°', 3.4, 0.03, 0.0); }, ev: { type: 'measure' },
        see: X('The angle between the radius OP and the tangent is 90°. The tangent is perpendicular to the radius at the point of contact.') },
      { do: X('Write down what you found.'), target: 'c',
        act: async (K, o) => { tagAt(K, o.c.at('top'), 'OP ⊥ PT', 4, 0, 0.0); await tagAt(K, o.c.at('below'), '∠OPT = 90°', 4, 0, 0.0); K.lab.emit('write', { obj: o.c.id }); }, ev: { type: 'write' },
        see: X('At any point of a circle there is exactly one tangent, and it is perpendicular to the radius through that point.') },
    ],
    eq: { word: 'The tangent is perpendicular to the radius', sym: 'OP ⊥ PT' },
    result: { obs: X('As the wire turned, R moved towards P and the chord PR became shorter, until the wire touched the circle only at P. The angle between OP and this wire was 90°.'),
      concl: X('A tangent is a line that meets a circle at exactly one point. There is only one tangent at a point of a circle, and it is perpendicular to the radius through the point of contact.'),
      safety: X('Hold the ends of the wire carefully, as they can be sharp.'),
      viva: [{ q: X('How many tangents can a circle have at one point?'), a: X('Only one.') },
        { q: X('What is the angle between a tangent and the radius at the point of contact?'), a: X('90°.') },
        { q: X('How is a tangent different from a secant?'), a: X('A secant cuts the circle at two points; a tangent touches it at only one point.') }] },
  },
];
