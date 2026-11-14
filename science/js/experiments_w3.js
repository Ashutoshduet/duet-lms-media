// DUET Maths Lab 360, real places 3: hands-on in 3D. The student rides a glass lift to floors above and below the ground
// (integers, Class 6), zooms into a ruler until they stand on its hundredths (decimals, Class 7), folds paper until it would
// pass the Moon (powers, Class 8), and opens a cylinder into its net, fills it and stands inside it (Class 10).
import { DICT } from './exp_i18n.js';
import { DICT_W3 } from './exp_i18n_w3.js';
import * as MW from './mathworld.js';
import * as MW3 from './mathworld3.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W3);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C6z = N('Ch 10 · The Other Side of Zero', 'अध्याय 10 · शून्य के उस पार', 'Ch 10 · Shunya ke us paar');
const C7d = N('Ch 3 · A Peek Beyond the Point', 'अध्याय 3 · दशमलव के आगे एक झलक', 'Ch 3 · Decimal ke aage ek jhalak');
const C8w = N('Ch 2 · Power Play', 'अध्याय 2 · घातों का खेल', 'Ch 2 · Power play');
const C10v = N('Ch 12 · Surface Areas and Volumes', 'अध्याय 12 · पृष्ठीय क्षेत्रफल और आयतन', 'Ch 12 · Surface area aur volume');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
// run fn when the student leaves this activity (the kit removes its extras then)
const onLeave = (K, fn) => K.extras.push({ parent: { remove: fn } });
// point the desktop camera (world positions)
const aim = (K, it, p, t) => { it.camView = { p: p.clone().sub(it.g.position), t: t.clone().sub(it.g.position) }; if (!K.app.userCam) K.app.focusBench(); };
const until = async (K, ok, max = 30) => { for (let i = 0; i < max * 10 && !ok(); i++) await K.sleep(0.1); };
const FLOORS = [[5, X('Roof garden')], [4, X('Library')], [3, X('Computer lab')], [2, X('Science lab')], [1, X('Classrooms')], [0, X('Ground floor')], [-1, X('Parking')], [-2, X('Store room')], [-3, X('Water tank')]];
const W = { up: X('+ up one floor'), down: X('− down one floor') };

export const EXPERIMENTS_W3 = [
  // ---------------------------------------------------------------- Class 6: integers in a glass lift
  {
    id: 'w6_lift_integers', subj: 'maths', cls: 6, ch: C6z, world: true, place: 'quad', table: false,
    title: X('Integers in a glass lift: above and below the ground'),
    aim: X('To ride a lift to floors above and below the ground by pressing + and − yourself, and see positive and negative numbers on a number line that stands up.'),
    kind: X('Integers'),
    setup(K) {
      const names = {}; for (const [n, t] of FLOORS) names[n] = tl(K, t);
      const lift = K.add(MW3.liftRide({ names }), 0, 0, { y: 0 });
      const up = K.add(MW3.liftButton(1), 0, 0, { y: 0 }), down = K.add(MW3.liftButton(-1), 0, 0, { y: 0 });
      lift.camView = { p: V3(K, -0.15, 1.5, 0.8), t: V3(K, 0.1, 1.08, -1.6) };
      const P = K.app.places; lift.onShift = (y) => { if (P) P.root.position.y = y; };
      onLeave(K, () => { if (P) P.root.position.y = 0; });
      lift.set(0);
      MW3.bindLiftHands(lift, up, down, K.app, [1, 2, 3]);
      const em = (t) => K.lab.emit(t, { obj: lift.id });
      const eq = (a, b) => { label(K, a, lift.at('eq'), 0.075, 0, { color: '#8be07a', edge: '#8be07a', step: true }); if (b) label(K, b, lift.at('eq2'), 0.06, 0, { color: '#ffffff', step: true }); };
      const fin = {
        up3: once(() => { eq('0 + (+3) = +3', tl(K, X('Computer lab'))); em('up3'); }),
        down5: once(() => { eq('(+3) + (−5) = −2', tl(K, X('Store room'))); em('down5'); }),
        back1: once(() => { eq('(−2) + (+3) = +1', '+1 − (−2) = 3'); em('back1'); }),
      };
      lift.onArrive = (n) => { const i = K.app.runner.i; if (i === 1 && n === 3) fin.up3(); if (i === 2 && n === -2) fin.down5(); if (i === 3 && n === 1) fin.back1(); };
      return { lift, up, down, fin };
    },
    steps: [
      { do: X('You are standing in a glass lift on the side of the school building. The ground floor is 0. The floors above the ground are +1, +2, +3 and so on, and the floors below the ground are −1, −2 and −3. Look at the number line beside the door.'), target: 'lift',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lift.id }); label(K, tl(K, W.up), o.lift.at('disp').clone().add(V3(K, 0, 0.14, 0)), 0.045, 0, { color: '#8be07a', step: true }); label(K, tl(K, W.down), o.lift.at('disp').clone().add(V3(K, 0, 0.08, 0)), 0.045, 0, { color: '#ff9a4a', step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The floors make a number line standing up: the positive numbers are above 0 and the negative numbers below it.') },
      { do: X('Press the + button three times.'), target: 'lift',
        act: async (K, o) => { fresh(K); for (let i = 0; i < 3; i++) { o.lift.press(1); await K.sleep(0.4); } await until(K, () => !o.lift.moving && o.lift.f === 3); o.fin.up3(); await K.sleep(1); },
        ev: { type: 'up3' }, see: X('The lift went up three floors: 0 + (+3) = +3. You are at the Computer lab.') },
      { do: X('Now press the − button five times.'), target: 'lift',
        act: async (K, o) => { fresh(K); for (let i = 0; i < 5; i++) { o.lift.press(-1); await K.sleep(0.4); } await until(K, () => !o.lift.moving && o.lift.f === -2); o.fin.down5(); await K.sleep(1); },
        ev: { type: 'down5' }, see: X('You went down five floors and passed the ground floor: (+3) + (−5) = −2. You are two floors below the ground, in the Store room.'),
        why: X('Below 0 we need negative numbers: −2 means two floors below the ground.') },
      { do: X('Go up to the Classrooms on floor +1. Which button, and how many times?'), target: 'lift',
        act: async (K, o) => { fresh(K); for (let i = 0; i < 3; i++) { o.lift.press(1); await K.sleep(0.4); } await until(K, () => !o.lift.moving && o.lift.f === 1); o.fin.back1(); await K.sleep(1); },
        ev: { type: 'back1' }, see: X('Press + three times: (−2) + (+3) = +1. From −2 to +1 is three floors up.'),
        why: X('To find how far apart two floors are, count the floors between them on the number line: +1 − (−2) = 3.') },
      { do: X('Press + twice and then − twice. Where do you end up?'), target: 'lift',
        act: async (K, o) => { fresh(K); const f0 = o.lift.target; o.lift.press(1); await K.sleep(0.4); o.lift.press(1); await until(K, () => !o.lift.moving && o.lift.f === f0 + 2); await K.sleep(0.6);
          o.lift.press(-1); await K.sleep(0.4); o.lift.press(-1); await until(K, () => !o.lift.moving && o.lift.f === f0);
          K.lab.emit('zero', { obj: o.lift.id }); label(K, '(+2) + (−2) = 0', o.lift.at('eq'), 0.075, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.2); },
        ev: { type: 'zero' }, see: X('Back on the same floor: two floors up and two floors down cancel each other. (+2) + (−2) = 0.') },
    ],
    eq: { word: 'Integers', sym: '(+3) + (−5) = −2' },
    result: {
      obs: X('From 0, three presses of + took the lift to +3; five presses of − took it to −2, below the ground; three presses of + took it to +1.'),
      concl: X('Integers are the positive numbers, zero and the negative numbers. Negative numbers lie on the other side of zero on the number line. Adding a negative number takes you down the number line.'),
      safety: X('In a real lift, do not jump, and keep away from the doors while they close.'),
      viva: [{ q: X('The lift is at −1 and goes up 4 floors. Where does it stop?'), a: X('(−1) + (+4) = +3.') },
        { q: X('Which is lower, −3 or −1?'), a: X('−3, because it is further below zero.') },
        { q: X('What is (+5) + (−5)?'), a: X('0.') }],
    },
  },
  // ---------------------------------------------------------------- Class 7: decimals, standing on a ruler
  {
    id: 'w7_decimal_zoom', subj: 'maths', cls: 7, ch: C7d, world: true, place: 'quad', table: true,
    title: X('Zoom into a ruler: tenths and hundredths'),
    aim: X('To make a ruler 10 and then 100 times bigger with your own hand, until you stand on it, and read a length to hundredths of a centimetre.'),
    kind: X('Decimals'),
    setup(K) {
      const rz = K.add(MW3.rulerZoom(), -0.15, -0.5);
      const knob = K.add(MW.pullTab(), 0, -0.4);
      aim(K, rz, V3(K, 0, 1.22, -0.1), V3(K, -0.03, 0.9, -0.52));
      const P = K.app.places; rz.onZoom = (Z) => { if (P) P.table.visible = Z < 2.2; };
      const em = (t) => K.lab.emit(t, { obj: rz.id });
      const tag = (txt, cm, up, h, col = '#ffffff', edge) => label(K, txt, rz.markAt(cm, up), h, 0, { color: col, edge, step: true });
      const fin = {
        z1: once(() => { fresh(K); aim(K, rz, V3(K, 0.05, 1.2, 0.05), V3(K, -0.02, 0.6, -0.5)); tag('7 cm', 7, 0.05, 0.03); tag('8 cm', 8, 0.05, 0.03); tag('7.4', 7.4, 0.022, 0.026, '#ffd23f'); em('zoom1'); }),
        z2: once(() => { fresh(K); aim(K, rz, V3(K, 0.25, 1.05, 0.15), V3(K, -0.02, 0.3, -0.55)); tag('7.4', 7.4, 0.1, 0.035, '#ffd23f'); tag('7.5', 7.5, 0.1, 0.035, '#ffd23f'); tag('7.46 cm', 7.46, 0.36, 0.06, '#8be07a', '#8be07a'); em('zoom2'); }),
      };
      MW3.bindZoomHands(rz, knob, K.app, { s1: 1, s2: 2 }, { zoom: (b) => (b === 1 ? fin.z1() : fin.z2()) });
      return { rz, knob, fin };
    },
    steps: [
      { do: X('A piece of chalk lies on a ruler, with one end at 0. Its other end is a little past 7 cm. How long is it exactly?'), target: 'rz',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rz.id }); label(K, '7 cm + ?', o.rz.markAt(7.46, 0.035), 0.022, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Between 7 cm and 8 cm, our eyes alone cannot read it exactly.') },
      { do: X('Slide the glowing handle to make everything 10 times bigger.'), target: 'rz',
        act: async (K, o) => { await K.tween(3, (k) => o.rz.zoom(Math.pow(10, ease(k)))); o.rz.zoom(10); o.fin.z1(); await K.sleep(1); },
        ev: { type: 'zoom1' }, see: X('Between 7 and 8 cm there are 10 equal small parts, the millimetres. Each is one tenth of a centimetre, 0.1 cm. The chalk ends after 4 of them, so it is more than 7.4 cm.') },
      { do: X('Slide the handle again, to make it 10 times bigger still.'), target: 'rz',
        act: async (K, o) => { await K.tween(3.5, (k) => o.rz.zoom(Math.pow(10, 1 + ease(k)))); o.rz.zoom(100); o.fin.z2(); await K.sleep(1); },
        ev: { type: 'zoom2' }, see: X('You are standing on the ruler! Between 7.4 and 7.5 cm there are 10 tiny parts, each one hundredth of a centimetre, 0.01 cm. The chalk ends at the 6th: 7.46 cm.'),
        why: X('Each zoom showed 10 equal parts inside one part. So each place after the point is worth one tenth of the place before it.') },
      { do: X('Write the length using the places after the point.'), target: 'rz',
        act: async (K, o) => { K.lab.emit('calc', { obj: o.rz.id }); label(K, '7.46 = 7 + 0.4 + 0.06', V3(K, -0.28, 0.52, -0.5), 0.045, 0, { color: '#ffffff', step: true }); await K.sleep(0.8); label(K, '7 + 4/10 + 6/100', V3(K, -0.28, 0.45, -0.5), 0.04, 0, { color: '#ffd23f', step: true }); await K.sleep(1.6); },
        ev: { type: 'calc' }, see: X('7.46 cm = 7 cm + 4 tenths + 6 hundredths. The 4 is in the tenths place and the 6 in the hundredths place.') },
      { do: X('Shrink everything back to its real size.'), target: 'rz',
        act: async (K, o) => { fresh(K); await K.tween(3, (k) => o.rz.zoom(Math.pow(10, 2 * (1 - ease(k))))); o.rz.zoom(1); aim(K, o.rz, V3(K, 0, 1.22, -0.1), V3(K, -0.03, 0.9, -0.52)); K.lab.emit('back', { obj: o.rz.id }); label(K, '7.46 cm = 74.6 mm', o.rz.markAt(7.46, 0.05), 0.026, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.5); },
        ev: { type: 'back' }, see: X('On the table again, the chalk is 7.46 cm long, which is 74.6 mm.') },
    ],
    eq: { word: 'Decimal place value', sym: '7.46 = 7 + 4/10 + 6/100' },
    result: {
      obs: X('Between 7 and 8 cm there were 10 tenths, and between 7.4 and 7.5 cm there were 10 hundredths. The chalk is 7.46 cm long.'),
      concl: X('Each place after the decimal point is one tenth of the place before it: first tenths, then hundredths. 7.46 = 7 + 4/10 + 6/100.'),
      safety: X('Chalk dust can make you cough: do not blow it around.'),
      viva: [{ q: X('How many hundredths make one tenth?'), a: X('10.') },
        { q: X('Which is longer, 7.46 cm or 7.5 cm?'), a: X('7.5 cm, because it has 5 tenths and 7.46 has only 4.') },
        { q: X('Write 3 cm 7 mm in centimetres.'), a: X('3.7 cm.') }],
    },
  },
  // ---------------------------------------------------------------- Class 8: powers, folding paper to the Moon
  {
    id: 'w8_fold_moon', subj: 'maths', cls: 8, ch: C8w, world: true, place: 'khet', table: true,
    title: X('Fold a paper to the Moon: powers of 2'),
    aim: X('To fold a sheet of paper in half again and again with your own hands, see the layers double each time, and find how many folds would reach beyond the Moon.'),
    kind: X('Powers and exponents'),
    setup(K) {
      const sheet = K.add(MW3.paperFold(), 0, -0.72), beyond = K.add(MW3.foldBeyond(), -1.2, -2.6, { y: 0 });
      const foldKnob = K.add(MW.pullTab(), 0, -0.6), lever = K.add(MW.pullTab(), 0, -0.4);
      aim(K, sheet, V3(K, 0.05, 1.22, -0.3), V3(K, 0, 0.9, -0.72));
      const P = K.app.places, sc = K.app.scene, bg0 = sc.background;
      beyond.onSpace = (on) => { if (P) { P.root.visible = !on; P.table.visible = !on; } sheet.g.visible = !on; sc.background = on ? new K.THREE.Color(0x000004) : bg0; };
      onLeave(K, () => { if (P) P.root.visible = true; sc.background = bg0; });
      const em = (t) => K.lab.emit(t, { obj: sheet.id });
      const lay = (n) => label(K, n === 1 ? tl(K, X('2 layers')) : `${2 ** n} ${tl(K, X('layers'))}`, sheet.at('side'), 0.03, 0, { color: '#ffffff', step: true });
      const fin = {
        f1: once(() => { lay(1); em('fold1'); }),
        f4: once(() => { label(K, '2 × 2 × 2 × 2 = 2⁴ = 16', sheet.at('eq'), 0.035, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('fold4'); }),
        n10: once(() => label(K, '2¹⁰ × 0.001 cm ≈ 1 cm', beyond.towerTop(), 0.16, 0, { color: '#ffffff', step: true })),
        n20: once(() => { aim(K, sheet, V3(K, 0.6, 1.6, 2.2), V3(K, -0.3, 5.0, -3.6)); label(K, `2²⁰ × 0.001 cm ≈ 10 m · ${tl(K, X('3 floors'))}`, beyond.towerTop(), 0.5, 0, { color: '#ffd23f', step: true }); }),
        n30: once(() => { label(K, `2³⁰ × 0.001 cm ≈ 10.7 km · ${tl(K, X('higher than Mount Everest'))}`, beyond.g.localToWorld(V3(K, 0, 9, 0.6)), 0.6, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('tower'); }),
        space: once(() => { fresh(K); aim(K, sheet, V3(K, -1.5, 1.5, 2.5), V3(K, 3.8, 2.3, -9.6)); label(K, tl(K, X('Earth')), beyond.earthAt(), 0.12, 0, { color: '#5ec8ff', step: true }); label(K, `${tl(K, X('Moon'))} · 3,84,400 km`, beyond.moonAt(), 1.0, 0, { color: '#ffffff', step: true }); }),
        n46: once(() => { label(K, `2⁴⁶ × 0.001 cm ≈ 7,03,687 km`, beyond.between(9, 2.2), 0.7, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('moon'); }),
      };
      const leverPath = () => [V3(K, -0.3, 0.935, -0.42), V3(K, 0.3, 0.935, -0.42)];
      MW3.bindFoldHands(sheet, beyond, foldKnob, lever, K.app, { f1: 1, f2: 2, t1: 3, t2: 4 }, {
        fold: (f) => { if (f === 1) fin.f1(); else if (f < 4) lay(f); else if (f === 4) { lay(4); fin.f4(); } },
        n: (n) => { if (n >= 10) fin.n10(); if (n >= 20) fin.n20(); if (n >= 30) fin.n30(); if (n >= 32) fin.space(); if (n >= 46) fin.n46(); } }, leverPath);
      return { sheet, beyond, foldKnob, lever, fin };
    },
    steps: [
      { do: X('Here is a sheet of paper. It is about 0.001 cm thick. What happens to its thickness each time you fold it in half?'), target: 'sheet',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sheet.id }); label(K, `1 ${tl(K, X('layer'))} · 0.001 cm`, o.sheet.at('side'), 0.03, 0, { step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('One sheet is one layer.') },
      { do: X('Fold it in half: pull the glowing edge over to the other side.'), target: 'sheet',
        act: async (K, o) => { fresh(K); await K.tween(1.6, (k) => o.sheet.fold(ease(k) * 0.999)); o.sheet.fold(1); o.fin.f1(); await K.sleep(1); },
        ev: { type: 'fold1' }, see: X('Now there are 2 layers: the paper is twice as thick.') },
      { do: X('Fold it in half three more times, and count the layers each time.'), target: 'sheet',
        act: async (K, o) => { for (let i = 0; i < 3; i++) { await K.tween(1.4, (k) => o.sheet.fold(ease(k) * 0.999)); o.sheet.fold(1); await K.sleep(0.8); } o.fin.f4(); await K.sleep(1); },
        ev: { type: 'fold4' }, see: X('2, 4, 8 and then 16 layers. Each fold doubles the layers: after 4 folds there are 2 × 2 × 2 × 2 = 2⁴ = 16 layers.'),
        why: X('Doubling again and again is multiplying by 2 again and again. We write it as a power: 2⁴ means 2 multiplied by itself 4 times.') },
      { do: X('Real paper cannot be folded many more times, but imagine you could. Slide the lever to keep folding, up to 30 folds, and look up.'), target: 'sheet',
        act: async (K, o) => { fresh(K); for (let n = 5; n <= 30; n++) { o.beyond.setFolds(n); if (n >= 10) o.fin.n10(); if (n >= 20) o.fin.n20(); await K.sleep(n < 20 ? 0.25 : 0.4); } o.fin.n30(); await K.sleep(1.5); },
        ev: { type: 'tower' }, see: X('After 10 folds the stack is about 1 cm thick, after 20 folds about 10 m, as tall as a 3-storey building, and after 30 folds about 10 km, higher than Mount Everest!'),
        why: X('2¹⁰ = 1024, which is about a thousand. So every 10 more folds make the stack about a thousand times thicker.') },
      { do: X('Keep folding, up to 46 folds.'), target: 'sheet',
        act: async (K, o) => { for (let n = 31; n <= 46; n++) { o.beyond.setFolds(n); if (n >= 32) o.fin.space(); await K.sleep(n < 40 ? 0.3 : 0.7); } o.fin.n46(); await K.sleep(1.5); },
        ev: { type: 'moon' }, see: X('After 46 folds the stack would be about 7 lakh km thick. It would go past the Moon, which is about 3.84 lakh km from the Earth!') },
    ],
    eq: { word: 'Powers of 2', sym: '2⁴⁶ × 0.001 cm ≈ 7,03,687 km' },
    result: {
      obs: X('Each fold doubled the layers: 2, 4, 8, 16. Folding on in our imagination, 20 folds made about 10 m, 30 folds about 10 km, and 46 folds about 7 lakh km, beyond the Moon.'),
      concl: X('Doubling again and again gives powers of 2, and powers grow very fast. 2¹⁰ is about a thousand, so 2⁴⁶ times a thin 0.001 cm sheet is more than the distance to the Moon.'),
      safety: X('Fold paper on a table, and keep its sharp edges away from your eyes.'),
      viva: [{ q: X('How many layers are there after 6 folds?'), a: X('2⁶ = 64.') },
        { q: X('Which is bigger, 2¹⁰ or 10³?'), a: X('2¹⁰ = 1024 is a little bigger than 10³ = 1000.') },
        { q: X('Three folds make the paper how many times as thick?'), a: X('2³ = 8 times.') }],
    },
  },
  // ---------------------------------------------------------------- Class 10: a cylinder opened, filled and entered
  {
    id: 'w10_cylinder_net', subj: 'maths', cls: 10, ch: C10v, world: true, place: 'kitchen', table: true,
    title: X('Open a cylinder: its net, its area and its volume'),
    aim: X('To tear a card cylinder open and unroll it into its net with your own hands, find its surface area, fill a cylinder with discs to find its volume, and then stand inside a big one.'),
    kind: X('Surface area and volume of a cylinder'),
    setup(K) {
      const cy = K.add(MW3.cylinderNet(), -0.08, -0.7);
      const tear = K.add(MW.pullTab(), 0, -0.6), edge = K.add(MW.pullTab(), 0, -0.6), filler = K.add(MW.pullTab(), 0, -0.5);
      aim(K, cy, V3(K, 0.08, 1.33, -0.04), V3(K, 0.0, 1.0, -0.72));
      const em = (t) => K.lab.emit(t, { obj: cy.id });
      const fin = {
        cut: once(() => em('cut')),
        unroll: once(() => { label(K, '2πr = 2 × 22/7 × 3.5 = 22 cm', cy.at('len'), 0.022, 0, { color: '#ffd23f', step: true }); label(K, 'h = 10 cm', cy.at('ht'), 0.02, 0, { color: '#5ec8ff', step: true }); em('unroll'); }),
        fill: once(() => { label(K, 'πr² × 1 = 38.5 cm³', cy.at('vol2'), 0.02, 0, { color: '#ffffff', step: true }); label(K, 'V = πr²h = 38.5 × 10 = 385 cm³', cy.at('vol'), 0.022, 0, { color: '#8be07a', edge: '#8be07a', step: true }); em('fill'); }),
      };
      MW3.bindCylinderHands(cy, tear, edge, filler, K.app, { cut: 1, unroll: 2, fill: 4 }, { cut: () => fin.cut(), unroll: () => fin.unroll(), fill: () => fin.fill() });
      return { cy, tear, edge, filler, fin };
    },
    steps: [
      { do: X('This card cylinder has a radius of 3.5 cm and a height of 10 cm. Take π = 22/7.'), target: 'cy',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cy.id }); label(K, 'r = 3.5 cm', o.cy.at('r'), 0.02, 0, { color: '#ffd23f', step: true }); label(K, 'h = 10 cm', o.cy.at('h'), 0.02, 0, { color: '#5ec8ff', step: true }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Its outside is a curved surface and two circles, the top and the bottom.') },
      { do: X('Pull the red tear strip towards you to open the curved surface down its side.'), target: 'cy',
        act: async (K, o) => { fresh(K); await K.tween(1.8, (k) => o.cy.cut(ease(k))); o.cy.cut(1); o.fin.cut(); await K.sleep(0.6); },
        ev: { type: 'cut' }, see: X('The curved surface is now cut from the top to the bottom.') },
      { do: X('Pull the cut edge to the right to open it out flat.'), target: 'cy',
        act: async (K, o) => { await K.tween(3, (k) => o.cy.unroll(ease(k))); o.cy.unroll(1); o.fin.unroll(); await K.sleep(1); },
        ev: { type: 'unroll' }, see: X('The curved surface opens into a rectangle, and the two circles come to its top and bottom: this is the net of the cylinder. The rectangle is as long as the edge of the circle, 2πr = 22 cm, and as high as the cylinder, 10 cm.') },
      { do: X('Find the areas.'), target: 'cy',
        act: async (K, o) => { K.lab.emit('area', { obj: o.cy.id }); label(K, '2πrh = 22 × 10 = 220 cm²', o.cy.at('csa'), 0.02, 0, { color: '#ffffff', step: true }); await K.sleep(0.8);
          label(K, '2 × πr² = 2 × 38.5 = 77 cm²', o.cy.at('lid'), 0.018, 0, { color: '#ffffff', step: true }); await K.sleep(0.8); label(K, '220 + 77 = 297 cm²', o.cy.at('above'), 0.024, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(1.4); },
        ev: { type: 'area' }, see: X('Curved surface area = 2πrh = 220 cm². The two circles add 2 × πr² = 77 cm². Total surface area = 297 cm².'),
        why: X('The grid inside the card has 22 × 10 = 220 squares of 1 cm²: count them and you get the same answer.') },
      { do: X('Now fill a glass cylinder of the same size: slide the handle to put in discs 1 cm thick.'), target: 'cy',
        act: async (K, o) => { fresh(K); o.cy.showVol(true); for (let n = 1; n <= 10; n++) { o.cy.fill(n); await K.sleep(0.3); } o.fin.fill(); await K.sleep(1); },
        ev: { type: 'fill' }, see: X('Each disc holds πr² × 1 = 38.5 cm³. Ten discs fill the cylinder: its volume is πr²h = 38.5 × 10 = 385 cm³.') },
      { do: X('Now step inside a cylinder 20 times bigger: a water tank.'), target: 'cy',
        act: async (K, o) => { fresh(K); const cy = o.cy, p0 = cy.vol.position.clone(), to = cy.g.worldToLocal(V3(K, 0, 0, 0.05)); cy.discsSee(false); cy.tankMode(true); if (K.app.places) K.app.places.table.visible = false;
          for (const h of [o.tear, o.edge, o.filler]) h.g.visible = false;
          aim(K, cy, V3(K, 0.3, 1.45, 0.45), V3(K, -0.1, 1.15, -0.7));
          await K.tween(3.2, (k) => cy.grow(1 + 19 * ease(k), p0.clone().lerp(to, ease(k)))); K.lab.emit('inside', { obj: cy.id });
          label(K, 'r = 0.7 m · h = 2 m', V3(K, 0, 1.44, -0.5), 0.05, 0, { color: '#ffd23f', step: true }); await K.sleep(0.6);
          label(K, 'V = 22/7 × 0.7 × 0.7 × 2 = 3.08 m³', V3(K, 0, 1.34, -0.5), 0.046, 0, { color: '#8be07a', edge: '#8be07a', step: true }); await K.sleep(0.6);
          label(K, '3.08 m³ = 3080 L', V3(K, 0, 1.25, -0.5), 0.042, 0, { color: '#ffffff', step: true }); await K.sleep(1.4); },
        ev: { type: 'inside' }, see: X('Its radius is 0.7 m and its height 2 m. Volume = πr²h = 22/7 × 0.7 × 0.7 × 2 = 3.08 m³, which is 3080 litres of water.'),
        why: X('Every length is 20 times bigger, so the volume is 20 × 20 × 20 = 8000 times bigger: 385 cm³ × 8000 = 3,080,000 cm³ = 3.08 m³.') },
    ],
    eq: { word: 'Volume of a cylinder', sym: 'V = πr²h' },
    result: {
      obs: X('The curved surface opened into a rectangle 22 cm by 10 cm, 220 cm². The two circles were 77 cm², 297 cm² in all. Ten discs of 38.5 cm³ filled 385 cm³.'),
      concl: X('For a cylinder of radius r and height h: curved surface area = 2πrh, total surface area = 2πr(r + h), and volume = πr²h.'),
      safety: X('Use scissors or a cutter carefully when you open a card cylinder.'),
      viva: [{ q: X('Find the curved surface area of a cylinder with r = 7 cm and h = 10 cm.'), a: X('2 × 22/7 × 7 × 10 = 440 cm².') },
        { q: X('What shape does the curved surface of a cylinder open into?'), a: X('A rectangle, 2πr long and h high.') },
        { q: X('If the height of a cylinder is doubled, what happens to its volume?'), a: X('It doubles too.') }],
    },
  },
];
void W;
