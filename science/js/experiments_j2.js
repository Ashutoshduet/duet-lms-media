// DUET Maths Lab 360, Class 3 (Maths Mela), batch J2: halves and quarters of a chikki, adding with bricks, sharing
// biscuits, a litre and a kilo, jumps on a chalk number line, a big clock, and buying a pot at the fair.
import { DICT } from './exp_i18n.js';
import { DICT_J2 } from './exp_i18n_j2.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j2.js';
Object.assign(DICT, DICT_J2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const C3h = N('Ch 8 · Fair Share', 'अध्याय 8 · बराबर हिस्सा', 'Ch 8 · Barabar hissa');
const C3i = N('Ch 9 · House of Hundreds – II', 'अध्याय 9 · सैकड़ों का घर – II', 'Ch 9 · Saikdon ka ghar – II');
const C3j = N('Ch 10 · Fun at Class Party!', 'अध्याय 10 · कक्षा की पार्टी में मज़ा!', 'Ch 10 · Class party mein maza!');
const C3k = N('Ch 11 · Filling and Lifting', 'अध्याय 11 · भरना और उठाना', 'Ch 11 · Bharna aur uthaana');
const C3l = N('Ch 12 · Give and Take', 'अध्याय 12 · लेन-देन', 'Ch 12 · Len-den');
const C3m = N('Ch 13 · Time Goes On', 'अध्याय 13 · समय चलता रहता है', 'Ch 13 · Samay chalta rehta hai');
const C3n = N('Ch 14 · The Surajkund Fair', 'अध्याय 14 · सूरजकुंड मेला', 'Ch 14 · Surajkund mela');
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };

export const EXPERIMENTS_J2 = [
  // ---------------------------------------------------------------- Class 3 Ch 8: halves and quarters
  {
    id: 'w3_fair_share', subj: 'maths', cls: 3, ch: C3h, topic: 'numbers', world: true, place: 'kitchen', table: true,
    title: X('A fair share: halves and quarters of a chikki'),
    aim: X('To cut a chikki into equal parts with your own hand and share it fairly between two and then four children.'),
    kind: X('Halves and quarters'),
    setup(K) {
      const ck = K.add(MWJ.chikkiShare({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      ck.camView = { p: V3(K, 0.0, 0.5, 0.55), t: V3(K, 0.0, 0.03, -0.02) };
      const fin = { cut: once(() => K.lab.emit('half', { obj: ck.id })) };
      MWJ.bindChikkiHands(ck, lever, K.app, { cut: 1 }, { cut: () => fin.cut() });
      return { ck, lever, fin };
    },
    steps: [
      { do: X('One peanut chikki must be shared fairly between two friends.'), target: 'ck',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ck.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Fair means both get exactly the same amount.') },
      { do: X('Push the lever to cut the chikki into two equal parts.'), target: 'ck',
        act: async (K, o) => { if (o.ck.stage < 1) { o.ck.cut(); await waitIdle(K, o.ck); } o.fin.cut(); },
        ev: { type: 'half' }, see: X('Two equal parts: each is one half, ½.') },
      { do: X('Two more friends come. Cut each half into two equal parts.'), target: 'ck',
        act: async (K, o) => { o.ck.cut(); await waitIdle(K, o.ck); K.lab.emit('quarter', { obj: o.ck.id }); await K.sleep(1); },
        ev: { type: 'quarter' }, see: X('Four equal parts: each is one quarter, ¼. Two quarters make one half.') },
      { do: X('Pinky cut her roti like this. Did she make two halves?'), target: 'ck',
        act: async (K, o) => { o.ck.badRoti(); K.lab.emit('unfair', { obj: o.ck.id }); await K.sleep(2.5); },
        ev: { type: 'unfair' }, see: X('No: the two parts are not equal, so they are not halves.') },
    ],
    eq: { word: 'Equal parts', sym: '1 = ½ + ½ = ¼ + ¼ + ¼ + ¼' },
    result: {
      obs: X('The chikki was cut into two equal halves, and then into four equal quarters. Pinky’s two unequal parts were not halves.'),
      concl: X('A half is one of two equal parts and a quarter is one of four equal parts. If the parts are not equal, they are not halves or quarters.'),
      safety: X('Let an adult use the knife.'),
      viva: [{ q: X('How many halves make one whole?'), a: X('2.') },
        { q: X('How many quarters make one half?'), a: X('2.') },
        { q: X('Which is bigger, ½ or ¼ of the same chikki?'), a: X('½.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 9: adding with bricks
  {
    id: 'w3_brick_add', subj: 'maths', cls: 3, ch: C3i, topic: 'numbers', world: true, place: 'quad', table: false,
    title: X('Adding big numbers with bricks'),
    aim: X('To put two heaps of bricks together, turn ten loose bricks into a row of ten with your own hand, and so add 236 and 148.'),
    kind: X('Adding 3-digit numbers'),
    setup(K) {
      const bs = K.add(MWJ.brickStacks({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      bs.camView = { p: V3(K, 0.0, 2.1, 0.9), t: V3(K, 0.0, 0.4, -2.4) };
      const fin = { pack: once(() => K.lab.emit('pack', { obj: bs.id })) };
      MWJ.bindBrickHands(bs, lever, K.app, { pack: 2 }, { pack: () => fin.pack() });
      return { bs, lever, fin };
    },
    steps: [
      { do: X('Two heaps of bricks: 236 on the left and 148 on the right. A tall stack is 100 bricks, a row on the ground is 10, and loose bricks are ones.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2.5); },
        ev: { type: 'look' }, see: X('236 = 2 hundreds, 3 tens and 6 ones. 148 = 1 hundred, 4 tens and 8 ones.') },
      { do: X('Put the two heaps together.'), target: 'bs',
        act: async (K, o) => { await K.tween(2.5, (k) => o.bs.setMerge(k)); o.bs.combine(); K.lab.emit('merge', { obj: o.bs.id }); await K.sleep(1); },
        ev: { type: 'merge' }, see: X('3 hundreds, 7 tens and 14 ones. But 14 loose bricks are too many for one place.') },
      { do: X('Push the lever to lay ten loose bricks into a new row.'), target: 'bs',
        act: async (K, o) => { if (o.bs.piles[0].o >= 10) { o.bs.pack(); await waitIdle(K, o.bs); } o.fin.pack(); },
        ev: { type: 'pack' }, see: X('Now 3 hundreds, 8 tens and 4 ones: 236 + 148 = 384.') },
      { do: X('Check: count the hundreds, then the tens, then the ones.'), target: 'bs',
        act: async (K, o) => { o.bs.say(['300 + 80 + 4 = 384'], OK); K.lab.emit('check', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'check' }, see: X('300 and 80 and 4 make 384.') },
    ],
    eq: { word: 'Adding with carrying', sym: '236 + 148 = 384' },
    result: {
      obs: X('Putting 236 and 148 together gave 3 hundreds, 7 tens and 14 ones. Ten loose bricks made a new row: 3 hundreds, 8 tens and 4 ones, 384.'),
      concl: X('When adding, ones are added to ones, tens to tens and hundreds to hundreds. Ten ones make one more ten.'),
      safety: X('Bricks are heavy: lift one at a time, and never throw them.'),
      viva: [{ q: X('What is 125 + 238?'), a: X('363.') },
        { q: X('How many tens are in 3 hundreds?'), a: X('30.') },
        { q: X('What is 199 + 1?'), a: X('200.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 10: sharing biscuits
  {
    id: 'w3_party_share', subj: 'maths', cls: 3, ch: C3j, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Sharing biscuits at the class party'),
    aim: X('To deal 24 biscuits onto 4 plates with your own hand, one round at a time, and then pack them in threes.'),
    kind: X('Division: sharing and grouping'),
    setup(K) {
      const bs = K.add(MWJ.biscuitShare(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      bs.camView = { p: V3(K, 0.0, 0.5, 0.55), t: V3(K, 0.0, 0.03, -0.02) };
      MWJ.bindBiscuitHands(bs, lever, K.app, { deal: 1 }, { all: () => K.lab.emit('deal', { obj: bs.id }) });
      return { bs, lever };
    },
    steps: [
      { do: X('There are 24 biscuits and 4 friends at the party.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Everyone must get the same number.') },
      { do: X('Push the lever to give one biscuit to every plate. Keep going until the tray is empty.'), target: 'bs',
        act: async (K, o) => { while (o.bs.round < 6) { if (!o.bs.busy) o.bs.deal(); await K.sleep(0.2); } await waitIdle(K, o.bs); K.lab.emit('deal', { obj: o.bs.id }); },
        ev: { type: 'deal' }, see: X('After 6 rounds the tray is empty and each plate has 6 biscuits: 24 ÷ 4 = 6.') },
      { do: X('Now pack the 24 biscuits in small packets of 3.'), target: 'bs',
        act: async (K, o) => { await o.bs.packs((d, f) => K.tween(d, f)); o.bs.say(['24 ÷ 3 = 8'], OK); K.lab.emit('packs', { obj: o.bs.id }); await K.sleep(1.5); },
        ev: { type: 'packs' }, see: X('8 packets of 3: 24 ÷ 3 = 8.') },
      { do: X('Check with multiplication.'), target: 'bs',
        act: async (K, o) => { o.bs.say(['4 × 6 = 24', '8 × 3 = 24'], ['#ffd23f', OK]); K.lab.emit('check', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'check' }, see: X('4 plates of 6 and 8 packets of 3 both make 24.') },
    ],
    eq: { word: 'Division', sym: '24 ÷ 4 = 6 · 24 ÷ 3 = 8' },
    result: {
      obs: X('Dealing one round at a time gave each of 4 plates 6 biscuits. Packing in threes made 8 packets.'),
      concl: X('Division shares things equally (how many each?) or makes equal groups (how many groups?). Multiplication checks it.'),
      safety: X('Wash your hands before eating, and do not waste food.'),
      viva: [{ q: X('What is 20 ÷ 4?'), a: X('5.') },
        { q: X('How many packets of 2 can 12 biscuits make?'), a: X('6.') },
        { q: X('If 15 biscuits are shared by 3 friends, how many does each get?'), a: X('5.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 11: a litre and a kilo
  {
    id: 'w3_litre_kilo', subj: 'maths', cls: 3, ch: C3k, topic: 'measure', world: true, place: 'kitchen', table: true,
    title: X('Filling a litre and lifting a kilo'),
    aim: X('To pour glasses of water into a litre bottle with your own hand, and weigh potatoes against a kilogram.'),
    kind: X('Capacity and weight'),
    setup(K) {
      const lk = K.add(MWJ.litreKilo(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      lk.camView = { p: V3(K, 0.0, 0.45, 0.55), t: V3(K, 0.0, 0.1, -0.05) };
      MWJ.bindLitreHands(lk, lever, K.app, { pour: 1 }, { all: () => K.lab.emit('litre', { obj: lk.id }) });
      return { lk, lever };
    },
    steps: [
      { do: X('A glass holds 250 millilitres of water. How many glasses fill the 1-litre bottle?'), target: 'lk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lk.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Let us pour and see.') },
      { do: X('Push the lever to pour one glass at a time into the bottle.'), target: 'lk',
        act: async (K, o) => { while (o.lk.glasses < 4) { if (!o.lk.busy) o.lk.pour(); await K.sleep(0.3); } await waitIdle(K, o.lk); K.lab.emit('litre', { obj: o.lk.id }); },
        ev: { type: 'litre' }, see: X('4 glasses of 250 mL fill the bottle: 1 litre = 1000 millilitres.') },
      { do: X('Put potatoes on the balance, against the 1 kg weight.'), target: 'lk',
        act: async (K, o) => { for (let n = 1; n <= 4; n++) { o.lk.setPots(n); o.lk.say([`${n} × 250 g = ${n * 250} g`], n === 4 ? OK : '#ffd23f'); await K.sleep(1.0); } K.lab.emit('kilo', { obj: o.lk.id }); },
        ev: { type: 'kilo' }, see: X('With 4 potatoes of 250 grams the balance is level: 1 kilogram = 1000 grams.') },
      { do: X('What if there were only 2 potatoes?'), target: 'lk',
        act: async (K, o) => { o.lk.setPots(2); o.lk.say(['500 g < 1 kg'], '#ff8a5a'); K.lab.emit('half', { obj: o.lk.id }); await K.sleep(2); },
        ev: { type: 'half' }, see: X('The weight side goes down: 500 grams is half a kilogram, lighter than 1 kg.') },
    ],
    eq: { word: 'Litre and kilogram', sym: '1 L = 1000 mL · 1 kg = 1000 g' },
    result: {
      obs: X('Four 250 mL glasses filled the 1 L bottle. Four 250 g potatoes balanced the 1 kg weight; two did not.'),
      concl: X('We measure how much a container holds in litres and millilitres, and how heavy something is in kilograms and grams.'),
      safety: X('Wipe up spilt water at once so nobody slips.'),
      viva: [{ q: X('How many millilitres are in half a litre?'), a: X('500.') },
        { q: X('How many 500 g packets make 1 kg?'), a: X('2.') },
        { q: X('Which is heavier, 1 kg of cotton or 1 kg of iron?'), a: X('Neither: both weigh 1 kg.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 12: jumps on a number line
  {
    id: 'w3_number_jumps', subj: 'maths', cls: 3, ch: C3l, topic: 'numbers', world: true, place: 'quad', table: false,
    title: X('Jumping along a chalk number line'),
    aim: X('To make a pebble jump along a number line in the courtyard with your own hand, to add 25 to 38 and take away 27.'),
    kind: X('Adding and taking away on a number line'),
    setup(K) {
      const cl = K.add(MWJ.chalkLine(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      cl.camView = { p: V3(K, -0.2, 2.2, 0.6), t: V3(K, -0.2, 0.0, -2.0) };
      MWJ.bindJumpHands(cl, lever, K.app, { jump: 1 }, { all: () => K.lab.emit('add', { obj: cl.id }) });
      return { cl, lever };
    },
    steps: [
      { do: X('A number line from 0 to 100 is drawn in chalk. The pebble sits on 38.'), target: 'cl',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cl.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('To add 25, jump 10, then 10, then 5.') },
      { do: X('Push the lever to make each jump.'), target: 'cl',
        act: async (K, o) => { while (o.cl.k < o.cl.plan.length) { if (!o.cl.busy) o.cl.jump(); await K.sleep(0.2); } await waitIdle(K, o.cl); K.lab.emit('add', { obj: o.cl.id }); },
        ev: { type: 'add' }, see: X('38 → 48 → 58 → 63. So 38 + 25 = 63.') },
      { do: X('Now take away 27: jump back 10, 10 and 7.'), target: 'cl',
        act: async (K, o) => { o.cl.clearArcs(); o.cl.setPlan(63, [-10, -10, -7]); while (o.cl.k < 3) { if (!o.cl.busy) o.cl.jump(); await K.sleep(0.2); } await waitIdle(K, o.cl); K.lab.emit('take', { obj: o.cl.id }); },
        ev: { type: 'take' }, see: X('63 → 53 → 43 → 36. So 63 − 27 = 36.') },
      { do: X('Adding moves to the right; taking away moves to the left.'), target: 'cl',
        act: async (K, o) => { o.cl.say(['+ →', '− ←'], [OK, '#ff8a5a']); K.lab.emit('dir', { obj: o.cl.id }); await K.sleep(2); },
        ev: { type: 'dir' }, see: X('Big jumps of ten make adding and taking away quick.') },
    ],
    eq: { word: 'Number line', sym: '38 + 25 = 63 · 63 − 27 = 36' },
    result: {
      obs: X('From 38, jumps of 10, 10 and 5 reached 63. From 63, jumps back of 10, 10 and 7 reached 36.'),
      concl: X('On a number line, adding is jumping forward and taking away is jumping back. Jumping in tens first is quick.'),
      safety: X('Draw chalk lines only where you are allowed, and wash your hands after.'),
      viva: [{ q: X('What is 45 + 30?'), a: X('75.') },
        { q: X('What is 80 − 25?'), a: X('55.') },
        { q: X('Which way do you jump to take away?'), a: X('Back, to the left.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 13: a big clock
  {
    id: 'w3_big_clock', subj: 'maths', cls: 3, ch: C3m, topic: 'measure', world: true, place: 'room', table: true,
    title: X('Turning the hands of a big clock'),
    aim: X('To turn the long hand of a big clock once round with your own hand, see one hour pass, and read half past and quarter past.'),
    kind: X('Time: hours and minutes'),
    setup(K) {
      const ck = K.add(MWJ.bigClock(), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      ck.camView = { p: V3(K, 0.0, 0.32, 0.5), t: V3(K, 0.0, 0.18, -0.1) };
      const fin = { hour: once(() => K.lab.emit('hour', { obj: ck.id })) };
      MWJ.bindClockHands(ck, knob, K.app, { turn: 1 }, { hour: () => fin.hour() });
      return { ck, knob, fin };
    },
    steps: [
      { do: X('The clock shows 7 o’clock: the long hand points to 12 and the short hand to 7.'), target: 'ck',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ck.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('The long hand shows minutes; the short hand shows hours.') },
      { do: X('Slide the handle to turn the long hand once all the way round.'), target: 'ck',
        act: async (K, o) => { await K.tween(3, (k) => o.ck.setMin(420 + Math.round(60 * k))); o.ck.setMin(480); o.fin.hour(); },
        ev: { type: 'hour' }, see: X('The long hand went round once: 60 minutes, one hour. The short hand moved from 7 to 8.') },
      { do: X('Now set the clock to half past 8.'), target: 'ck',
        act: async (K, o) => { await K.tween(1.5, (k) => o.ck.setMin(480 + Math.round(30 * k))); K.lab.emit('half', { obj: o.ck.id }); await K.sleep(1); },
        ev: { type: 'half' }, see: X('Half past 8 is 8:30: the long hand points to 6, half way round.') },
      { do: X('And quarter past 9.'), target: 'ck',
        act: async (K, o) => { await K.tween(2, (k) => o.ck.setMin(510 + Math.round(45 * k))); K.lab.emit('quarter', { obj: o.ck.id }); await K.sleep(1); },
        ev: { type: 'quarter' }, see: X('Quarter past 9 is 9:15: the long hand points to 3, a quarter of the way round.') },
    ],
    eq: { word: 'Hours and minutes', sym: '1 hour = 60 minutes' },
    result: {
      obs: X('One full turn of the long hand moved the short hand from 7 to 8. Half past 8 showed 8:30, and quarter past 9 showed 9:15.'),
      concl: X('The long hand goes round once every hour, 60 minutes. Each number on the clock stands for 5 minutes on the long hand.'),
      safety: X('Turn real clock hands gently, only forwards.'),
      viva: [{ q: X('How many minutes are in one hour?'), a: X('60.') },
        { q: X('Where does the long hand point at half past?'), a: X('At 6.') },
        { q: X('How many minutes does each number stand for on the long hand?'), a: X('5.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 14: buying a pot at the fair
  {
    id: 'w3_fair_pot', subj: 'maths', cls: 3, ch: C3n, topic: 'measure', world: true, place: 'quad', table: true,
    title: X('Buying a pot at the Surajkund fair'),
    aim: X('To pay for a ₹45 pot with ₹10 coins with your own hand, find the change, and spot the patterns on the pots.'),
    kind: X('Money and patterns'),
    setup(K) {
      const ps = K.add(MWJ.potStall(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      ps.camView = { p: V3(K, 0.0, 0.5, 0.55), t: V3(K, 0.0, 0.08, -0.05) };
      MWJ.bindPotHands(ps, lever, K.app, { pay: 1 }, { all: () => K.lab.emit('pay', { obj: ps.id }) });
      return { ps, lever };
    },
    steps: [
      { do: X('At the potter’s stall the big pot costs ₹45. You have ₹10 coins.'), target: 'ps',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ps.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('How many ₹10 coins are needed?') },
      { do: X('Push the lever to put ₹10 coins on the counter, one at a time, until there is enough.'), target: 'ps',
        act: async (K, o) => { while (o.ps.paid < 5) { if (!o.ps.busy) o.ps.pay(); await K.sleep(0.2); } await waitIdle(K, o.ps); K.lab.emit('pay', { obj: o.ps.id }); },
        ev: { type: 'pay' }, see: X('₹10, 20, 30, 40 is not enough; ₹50 is more than ₹45.') },
      { do: X('The potter gives back the change.'), target: 'ps',
        act: async (K, o) => { await o.ps.giveChange((d, f) => K.tween(d, f)); o.ps.say(['₹50 − ₹45 = ₹5'], OK); K.lab.emit('change', { obj: o.ps.id }); await K.sleep(1.5); },
        ev: { type: 'change' }, see: X('₹50 − ₹45 = ₹5: a ₹5 coin comes back.') },
      { do: X('Look at the patterns painted on the pots.'), target: 'ps',
        act: async (K, o) => { o.ps.say(['▲△▲△ · ●●●● · ▮▯▮▯'], '#ffd23f'); K.lab.emit('pattern', { obj: o.ps.id }); await K.sleep(2); },
        ev: { type: 'pattern' }, see: X('Each pot has a pattern that repeats all the way round: triangles, dots, and stripes.') },
    ],
    eq: { word: 'Money', sym: '₹50 − ₹45 = ₹5' },
    result: {
      obs: X('Four ₹10 coins were not enough for the ₹45 pot; five were. The potter gave back ₹5. The pots had repeating patterns.'),
      concl: X('To pay, give enough money; the change is what you gave minus the price. A pattern repeats the same thing again and again.'),
      safety: X('Keep your money safe in a crowded fair, and stay with your family.'),
      viva: [{ q: X('A toy costs ₹35. You give ₹50. What is the change?'), a: X('₹15.') },
        { q: X('How many ₹5 coins make ₹20?'), a: X('4.') },
        { q: X('What comes next: red, yellow, red, yellow, …?'), a: X('Red.') }],
    },
  },
];
