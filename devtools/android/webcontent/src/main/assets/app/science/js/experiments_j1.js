// DUET Maths Lab 360, Class 3 (Maths Mela), batch J1: hands-on, real-size activities for the youngest — counting
// mangoes with tally marks, toys that roll or slide, bundles of ten, Nani's laddoos, a giant tangram, a wooden
// abacus, and rakhis on cards.
import { DICT } from './exp_i18n.js';
import { DICT_J1 } from './exp_i18n_j1.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j1.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_J1);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const C3a = N('Ch 1 · What’s in a Name?', 'अध्याय 1 · नाम में क्या रखा है?', 'Ch 1 · Naam mein kya rakha hai?');
const C3b = N('Ch 2 · Toy Joy', 'अध्याय 2 · खिलौनों का मज़ा', 'Ch 2 · Khilaunon ka maza');
const C3c = N('Ch 3 · Double Century', 'अध्याय 3 · दोहरा शतक', 'Ch 3 · Double century');
const C3d = N('Ch 4 · Vacation with My Nani Maa', 'अध्याय 4 · नानी माँ के साथ छुट्टियाँ', 'Ch 4 · Nani Maa ke saath chhuttiyan');
const C3e = N('Ch 5 · Fun with Shapes', 'अध्याय 5 · आकृतियों के साथ मज़ा', 'Ch 5 · Shapes ke saath maza');
const C3f = N('Ch 6 · House of Hundreds – I', 'अध्याय 6 · सैकड़ों का घर – I', 'Ch 6 · Saikdon ka ghar – I');
const C3g = N('Ch 7 · Raksha Bandhan', 'अध्याय 7 · रक्षाबंधन', 'Ch 7 · Raksha Bandhan');

export const EXPERIMENTS_J1 = [
  // ---------------------------------------------------------------- Class 3 Ch 1: mangoes and tally marks
  {
    id: 'w3_mango_tally', subj: 'maths', cls: 3, ch: C3a, topic: 'numbers', world: true, place: 'farm', table: false,
    title: X('Counting mangoes with tally marks'),
    aim: X('To put mangoes in a basket one by one with your own hand, draw a tally mark for each, and count them in fives.'),
    kind: X('Counting and tally marks'),
    setup(K) {
      const mt = K.add(MWJ.mangoTally(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      mt.camView = { p: V3(K, 0.25, 1.55, 0.45), t: V3(K, 0.25, 0.35, -1.6) };
      MWJ.bindMangoHands(mt, lever, K.app, { add: 1 }, { all: () => K.lab.emit('tally', { obj: mt.id }) });
      return { mt, lever };
    },
    steps: [
      { do: X('Twelve mangoes lie on a cloth under the mango trees. Let us count them without losing count.'), target: 'mt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mt.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('When there are many things, it is easy to lose count. One line for each thing helps.') },
      { do: X('Push the lever to put the mangoes in the basket one by one. For each mango, one chalk line goes on the slate.'), target: 'mt',
        act: async (K, o) => { while (o.mt.n < 12) { if (!o.mt.busy) o.mt.add1(); await K.sleep(0.2); } await K.sleep(0.6); K.lab.emit('tally', { obj: o.mt.id }); },
        ev: { type: 'tally' }, see: X('Every fifth line crosses the four before it: a bundle of five. Two bundles and two more lines: 12 mangoes.') },
      { do: X('Count the lines in fives.'), target: 'mt',
        act: async (K, o) => { o.mt.say(['5, 10, 11, 12'], '#ffd23f'); K.lab.emit('fives', { obj: o.mt.id }); await K.sleep(2); },
        ev: { type: 'fives' }, see: X('5, 10, and then 11, 12. Counting in fives is quicker than counting one by one.') },
      { do: X('Now count the letters in two names the same way.'), target: 'mt',
        act: async (K, o) => { o.mt.showNames([['RAVI', 4], ['MEENAKSHI', 9]]); o.mt.say(['9 > 4'], OK); K.lab.emit('names', { obj: o.mt.id }); await K.sleep(2); },
        ev: { type: 'names' }, see: X('RAVI has 4 letters and MEENAKSHI has 9. The longer name has more tally marks.') },
    ],
    eq: { word: 'Tally marks', sym: '|||| + a line across = 5' },
    result: {
      obs: X('Twelve mangoes gave twelve tally lines: two bundles of five and two more. RAVI has 4 letters and MEENAKSHI has 9.'),
      concl: X('Tally marks keep count: one line for each thing, and every fifth line crosses the four before it, so the count is easy to read in fives.'),
      safety: X('Wash mangoes before you eat them.'),
      viva: [{ q: X('How do you show 7 with tally marks?'), a: X('One bundle of five and two more lines.') },
        { q: X('How many lines are in three full bundles?'), a: X('15.') },
        { q: X('Which name has more letters, ASHA or ANU?'), a: X('ASHA: it has 4 letters and ANU has 3.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 2: toys that roll or slide
  {
    id: 'w3_toy_roll', subj: 'maths', cls: 3, ch: C3b, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('Toys that roll and toys that slide'),
    aim: X('To send toys down a slope with your own hand and find out which roll, which slide, which can be stacked, and how many flat and curved faces they have.'),
    kind: X('Solid shapes around us'),
    setup(K) {
      const tr = K.add(MWJ.toyRamp({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      tr.camView = { p: V3(K, 0.05, 0.5, 0.6), t: V3(K, 0.05, 0.04, -0.05) };
      MWJ.bindToyHands(tr, lever, K.app, { send: 1 }, { all: () => K.lab.emit('roll', { obj: tr.id }) });
      return { tr, lever };
    },
    steps: [
      { do: X('On the table are a ball, a wooden block, a milk tin, a birthday cap and a matchbox. A plank leans on some books.'), target: 'tr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Some toys have curved surfaces and some have only flat faces.') },
      { do: X('Push the lever to send each toy down the slope.'), target: 'tr',
        act: async (K, o) => { while (o.tr.sent < 5) { if (!o.tr.busy) o.tr.send(); await K.sleep(0.3); } K.lab.emit('roll', { obj: o.tr.id }); },
        ev: { type: 'roll' }, see: X('The ball and the tin roll far. The block and the matchbox slide a little and stop. The cap rolls round in a circle.') },
      { do: X('Which toys can stand one on top of another?'), target: 'tr',
        act: async (K, o) => { o.tr.stack(); K.lab.emit('stack', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'stack' }, see: X('The block, the matchbox and the tin stand on their flat faces. Nothing stays on top of a ball.') },
      { do: X('Count the flat and curved faces of each toy.'), target: 'tr',
        act: async (K, o) => { o.tr.faces(); K.lab.emit('faces', { obj: o.tr.id }); await K.sleep(2); },
        ev: { type: 'faces' }, see: X('A block has 6 flat faces. A tin has 2 flat faces and 1 curved one. A ball has only a curved surface.') },
    ],
    eq: { word: 'Solid shapes', sym: 'curved → rolls · flat → slides' },
    result: {
      obs: X('The ball, the tin and the cap rolled; the block and the matchbox slid. The flat-faced toys could be stacked.'),
      concl: X('Shapes with a curved surface roll; shapes with only flat faces slide and can be stacked. A ball is a sphere, a tin is a cylinder, a cap is a cone and a block is a cube.'),
      safety: X('Do not leave toys on the floor where people walk.'),
      viva: [{ q: X('What shape is a ball?'), a: X('A sphere.') },
        { q: X('What shape is a tin?'), a: X('A cylinder.') },
        { q: X('Can a cube roll?'), a: X('No, it slides.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 3: bundles of ten
  {
    id: 'w3_stick_bundles', subj: 'maths', cls: 3, ch: C3c, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Bundles of ten sticks, up to 200'),
    aim: X('To tie loose sticks into bundles of ten with your own hand, and see how tens make hundreds and 200.'),
    kind: X('Numbers up to 200'),
    setup(K) {
      const sb = K.add(MWJ.stickBundles(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      sb.camView = { p: V3(K, 0.0, 0.52, 0.55), t: V3(K, 0.0, 0.03, -0.05) };
      MWJ.bindStickBundleHands(sb, lever, K.app, { tie: 1 }, { all: () => K.lab.emit('tie', { obj: sb.id }) });
      return { sb, lever };
    },
    steps: [
      { do: X('37 ice-cream sticks lie on the table. Counting them one by one is slow.'), target: 'sb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Let us tie them in tens.') },
      { do: X('Push the lever to tie ten loose sticks with a rubber band. Do it until fewer than ten are left.'), target: 'sb',
        act: async (K, o) => { while (o.sb.total - o.sb.tied * 10 >= 10) { if (!o.sb.busy) o.sb.tie(); await K.sleep(0.3); } await K.sleep(0.5); K.lab.emit('tie', { obj: o.sb.id }); },
        ev: { type: 'tie' }, see: X('3 bundles of ten and 7 loose sticks: 30 + 7 = 37.') },
      { do: X('Now there are 200 sticks. Tie them all into tens.'), target: 'sb',
        act: async (K, o) => { o.sb.setTotal(200); await K.sleep(1); o.sb.tieAll(); K.lab.emit('twenty', { obj: o.sb.id }); await K.sleep(1.5); },
        ev: { type: 'twenty' }, see: X('200 sticks make 20 bundles of ten.') },
      { do: X('Tie every ten bundles into one big bundle.'), target: 'sb',
        act: async (K, o) => { o.sb.makeHundreds(); o.sb.say(['10 × 10 = 100', '100 + 100 = 200'], ['#ffd23f', OK]); K.lab.emit('hundreds', { obj: o.sb.id }); await K.sleep(2); },
        ev: { type: 'hundreds' }, see: X('Ten tens make a hundred. 200 is 2 big bundles of a hundred: a double century!') },
    ],
    eq: { word: 'Tens and hundreds', sym: '10 tens = 100 · 200 = 2 hundreds' },
    result: {
      obs: X('37 sticks made 3 bundles of ten and 7 loose. 200 sticks made 20 bundles of ten, or 2 big bundles of a hundred.'),
      concl: X('Bundling in tens makes big numbers easy to count: ten ones make a ten, and ten tens make a hundred.'),
      safety: X('Do not put sticks in your mouth.'),
      viva: [{ q: X('How many tens are in 150?'), a: X('15.') },
        { q: X('How many sticks are in 4 bundles of ten and 6 loose sticks?'), a: X('46.') },
        { q: X('What is 100 + 100?'), a: X('200.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 4: Nani's laddoos
  {
    id: 'w3_nani_laddoos', subj: 'maths', cls: 3, ch: C3d, topic: 'numbers', world: true, place: 'kitchen', table: true,
    title: X('Nani’s laddoos: taking away and adding'),
    aim: X('To open a box of ten laddoos with your own hand when there are not enough loose ones, and so take away 17 from 52; then add 28.'),
    kind: X('Addition and subtraction'),
    setup(K) {
      const lb = K.add(MWJ.laddooBoxes({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      lb.camView = { p: V3(K, 0.0, 0.55, 0.55), t: V3(K, 0.0, 0.03, -0.03) };
      const fin = { open: once(() => K.lab.emit('open', { obj: lb.id })) };
      MWJ.bindLaddooHands(lb, lever, K.app, { open: 1 }, { open: () => fin.open() });
      return { lb, lever, fin };
    },
    steps: [
      { do: X('Nani made 52 laddoos: 5 boxes of ten and 2 loose.'), target: 'lb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('5 tens and 2 ones make 52.') },
      { do: X('The cousins want 17 laddoos, but only 2 are loose. Push the lever to open one box.'), target: 'lb',
        act: async (K, o) => { if (o.lb.ones < 10) { o.lb.openBox(); while (o.lb.busy) await K.sleep(0.1); } o.fin.open(); await K.sleep(0.5); },
        ev: { type: 'open' }, see: X('One ten becomes ten ones: now 4 boxes and 12 loose. Still 52.') },
      { do: X('Give the cousins 7 loose laddoos and 1 box.'), target: 'lb',
        act: async (K, o) => { o.lb.eat(7); await K.sleep(1); o.lb.eatBox(); o.lb.show(['52 − 17 = 35'], '#ffd23f'); K.lab.emit('take', { obj: o.lb.id }); await K.sleep(2); },
        ev: { type: 'take' }, see: X('4 − 1 = 3 boxes and 12 − 7 = 5 loose: 35 laddoos are left.') },
      { do: X('Mami brings 2 boxes and 8 loose laddoos. Put them all together.'), target: 'lb',
        act: async (K, o) => { o.lb.setAll(5, 13); await K.sleep(1.5); o.lb.pack(); o.lb.show(['35 + 28 = 63'], OK); K.lab.emit('add', { obj: o.lb.id }); await K.sleep(2); },
        ev: { type: 'add' }, see: X('13 loose laddoos make one more box with 3 over: 6 boxes and 3 loose, 63 laddoos.') },
    ],
    eq: { word: 'Taking away and adding', sym: '52 − 17 = 35 · 35 + 28 = 63' },
    result: {
      obs: X('To take away 17 from 52, one box was opened into ten loose laddoos; 35 were left. Adding 28 gave 13 loose, which made one more box: 63.'),
      concl: X('When there are not enough ones to take away, one ten is opened into ten ones. When ones add up to ten or more, ten of them make a new ten.'),
      safety: X('Wash your hands before you touch food.'),
      viva: [{ q: X('What is 45 − 18?'), a: X('27.') },
        { q: X('What is 36 + 25?'), a: X('61.') },
        { q: X('How many ones are there in one ten?'), a: X('10.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 5: a giant tangram
  {
    id: 'w3_tangram', subj: 'maths', cls: 3, ch: C3e, topic: 'geometry', world: true, place: 'room', table: false,
    title: X('A giant tangram on the floor'),
    aim: X('To slide seven big wooden pieces together with your own hand into one square, and count their corners.'),
    kind: X('Shapes, sides and corners'),
    setup(K) {
      const tg = K.add(MWJ.bigTangram({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      tg.camView = { p: V3(K, 0.0, 2.3, 0.1), t: V3(K, 0.0, 0.0, -1.9) };
      const fin = { sq: once(() => K.lab.emit('square', { obj: tg.id })) };
      MWJ.bindTangramHands(tg, knob, K.app, { slide: 1 }, { done: () => fin.sq() });
      return { tg, knob, fin };
    },
    steps: [
      { do: X('Seven wooden pieces lie on the floor: five triangles, a square and a slanted shape.'), target: 'tg',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tg.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('All their sides are straight lines.') },
      { do: X('Slide the handle to bring the pieces together.'), target: 'tg',
        act: async (K, o) => { await K.tween(2.5, (k) => o.tg.setK(k)); o.tg.setK(1); o.fin.sq(); },
        ev: { type: 'square' }, see: X('The seven pieces fit together into one big square, with no gaps.') },
      { do: X('Look at the two big triangles.'), target: 'tg',
        act: async (K, o) => { o.tg.glowPieces([0, 1]); o.tg.say(['2 ◺ = ½ ◻'], '#ffd23f'); K.lab.emit('half', { obj: o.tg.id }); await K.sleep(2.5); o.tg.glowPieces([], false); },
        ev: { type: 'half' }, see: X('Together the two big triangles cover half of the square.') },
      { do: X('Count the corners of each piece.'), target: 'tg',
        act: async (K, o) => { o.tg.corners(); o.tg.say(['5 × 3 + 2 × 4 = 23'], OK); K.lab.emit('corners', { obj: o.tg.id }); await K.sleep(2); },
        ev: { type: 'corners' }, see: X('Each triangle has 3 corners; the square and the slanted piece have 4. Altogether 23 corners.') },
    ],
    eq: { word: 'Tangram', sym: '7 pieces → 1 square' },
    result: {
      obs: X('The seven pieces made one square with no gaps. Two big triangles covered half of it. The pieces had 23 corners in all.'),
      concl: X('Shapes with straight sides can be fitted together to make new shapes. A triangle has 3 sides and 3 corners; a square has 4 of each.'),
      safety: X('Lift big pieces with two hands, and keep the floor clear.'),
      viva: [{ q: X('How many sides does a triangle have?'), a: X('3.') },
        { q: X('Does any tangram piece have a curved side?'), a: X('No, all sides are straight.') },
        { q: X('How many pieces are in a tangram?'), a: X('7.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 6: a wooden abacus
  {
    id: 'w3_abacus', subj: 'maths', cls: 3, ch: C3f, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('A wooden abacus: 97, 98, 99, 100'),
    aim: X('To add beads to an abacus one at a time with your own hand and see ten ones become a ten and ten tens become a hundred.'),
    kind: X('Place value: hundreds, tens and ones'),
    setup(K) {
      const ab = K.add(MWJ.spikeAbacus(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      ab.camView = { p: V3(K, 0.0, 0.42, 0.55), t: V3(K, 0.0, 0.18, -0.05) };
      MWJ.bindAbacusHands(ab, lever, K.app, { add: 1 }, { all: () => K.lab.emit('carry', { obj: ab.id }) });
      return { ab, lever };
    },
    steps: [
      { do: X('The abacus shows 97: 9 beads on the tens rod and 7 on the ones rod.'), target: 'ab',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ab.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('9 tens and 7 ones make 97.') },
      { do: X('Push the lever to add one bead at a time: 98, 99, 100.'), target: 'ab',
        act: async (K, o) => { while (o.ab.value() < 100 || o.ab.busy) { if (!o.ab.busy) o.ab.add1(); await K.sleep(0.4); } await K.sleep(0.5); K.lab.emit('carry', { obj: o.ab.id }); },
        ev: { type: 'carry' }, see: X('At ten ones, they come off and one bead goes on the tens rod. At ten tens, they come off and one bead goes on the hundreds rod: 100.') },
      { do: X('Show 345 on the abacus.'), target: 'ab',
        act: async (K, o) => { o.ab.set(3, 4, 5); K.lab.emit('show', { obj: o.ab.id }); await K.sleep(2); },
        ev: { type: 'show' }, see: X('3 hundreds, 4 tens and 5 ones make 345.') },
      { do: X('Show 503, and then 530.'), target: 'ab',
        act: async (K, o) => { o.ab.set(5, 0, 3); await K.sleep(2); o.ab.set(5, 3, 0); o.ab.say(['503 ≠ 530'], OK); K.lab.emit('zero', { obj: o.ab.id }); await K.sleep(2); },
        ev: { type: 'zero' }, see: X('The same digits in different places make different numbers. A zero keeps a place empty.') },
    ],
    eq: { word: 'Place value', sym: '345 = 3 hundreds + 4 tens + 5 ones' },
    result: {
      obs: X('Adding beads to 97 gave 98, 99 and then 100, when ten ones became a ten and ten tens became a hundred. 345, 503 and 530 were shown with beads.'),
      concl: X('Each place holds up to nine. Ten in one place make one in the next place on the left.'),
      safety: X('Keep the abacus flat on the table so the beads do not fall.'),
      viva: [{ q: X('How many tens are in 100?'), a: X('10.') },
        { q: X('Which is bigger, 412 or 421?'), a: X('421.') },
        { q: X('What does the 6 in 365 stand for?'), a: X('6 tens, or 60.') }],
    },
  },
  // ---------------------------------------------------------------- Class 3 Ch 7: rakhis on cards
  {
    id: 'w3_rakhi_groups', subj: 'maths', cls: 3, ch: C3g, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Rakhis in equal groups'),
    aim: X('To put out cards of 4 rakhis each with your own hand, count in fours, and see that 5 fours and 4 fives are both 20.'),
    kind: X('Multiplication as equal groups'),
    setup(K) {
      const rc = K.add(MWJ.rakhiCards({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      rc.camView = { p: V3(K, 0.0, 0.5, 0.5), t: V3(K, -0.03, 0.03, -0.05) };
      MWJ.bindRakhiHands(rc, lever, K.app, { add: 1 }, { all: () => K.lab.emit('cards', { obj: rc.id }) });
      return { rc, lever };
    },
    steps: [
      { do: X('At the rakhi stall, every card holds 4 rakhis.'), target: 'rc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rc.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Equal groups: 4 rakhis on each card.') },
      { do: X('Push the lever to put out 5 cards.'), target: 'rc',
        act: async (K, o) => { while (o.rc.n < 5) { if (!o.rc.busy) o.rc.add1(); await K.sleep(0.3); } await K.sleep(0.4); K.lab.emit('cards', { obj: o.rc.id }); },
        ev: { type: 'cards' }, see: X('4, 8, 12, 16, 20: five fours make 20. 5 × 4 = 20.') },
      { do: X('Turn the cards around.'), target: 'rc',
        act: async (K, o) => { await K.tween(1.5, (k) => o.rc.setTurn(ease(k))); o.rc.setTurn(1); o.rc.say(['4 × 5 = 20'], OK); K.lab.emit('turn', { obj: o.rc.id }); await K.sleep(1.5); },
        ev: { type: 'turn' }, see: X('Now there are 4 rows of 5. 4 × 5 is also 20.') },
      { do: X('How many rakhis are on 3 cards?'), target: 'rc',
        act: async (K, o) => { o.rc.say(['4 + 4 + 4 = 3 × 4 = 12'], '#ffd23f'); K.lab.emit('three', { obj: o.rc.id }); await K.sleep(2); },
        ev: { type: 'three' }, see: X('4 + 4 + 4 = 12, so 3 × 4 = 12.') },
    ],
    eq: { word: 'Equal groups', sym: '5 × 4 = 4 × 5 = 20' },
    result: {
      obs: X('Five cards of 4 rakhis made 20. Turned around, they were 4 rows of 5, still 20.'),
      concl: X('Multiplying counts equal groups quickly: 5 groups of 4 is 5 × 4. Turning the rows into columns shows that 5 × 4 = 4 × 5.'),
      safety: X('Keep scissors and threads away from small children.'),
      viva: [{ q: X('What is 6 × 4?'), a: X('24.') },
        { q: X('How many rakhis are on 10 cards?'), a: X('40.') },
        { q: X('2 × 5 is the same as 5 × what?'), a: X('2.') }],
    },
  },
];
