// DUET Maths Lab 360, Class 4 (Maths Mela), batch J3: a cube frame of sticks, a toy house from three sides, marbles
// in pairs, blocks up to a thousand, a metre of ribbon in quarters, a tape across the classroom, buying dustbins.
import { DICT } from './exp_i18n.js';
import { DICT_J3 } from './exp_i18n_j3.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j3.js';
Object.assign(DICT, DICT_J3);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const C4a = N('Ch 1 · Shapes Around Us', 'अध्याय 1 · हमारे आस-पास की आकृतियाँ', 'Ch 1 · Hamaare aas-paas ki shapes');
const C4b = N('Ch 2 · Hide and Seek', 'अध्याय 2 · लुका-छिपी', 'Ch 2 · Luka-chhipi');
const C4c = N('Ch 3 · Pattern Around Us', 'अध्याय 3 · हमारे आस-पास के पैटर्न', 'Ch 3 · Hamaare aas-paas ke pattern');
const C4d = N('Ch 4 · Thousands Around Us', 'अध्याय 4 · हमारे आस-पास हज़ारों', 'Ch 4 · Hamaare aas-paas hazaaron');
const C4e = N('Ch 5 · Sharing and Measuring', 'अध्याय 5 · बाँटना और मापना', 'Ch 5 · Baantna aur maapna');
const C4f = N('Ch 6 · Measuring Length', 'अध्याय 6 · लंबाई मापना', 'Ch 6 · Lambai maapna');
const C4g = N('Ch 7 · The Cleanest Village', 'अध्याय 7 · सबसे साफ़ गाँव', 'Ch 7 · Sabse saaf gaon');

export const EXPERIMENTS_J3 = [
  {
    id: 'w4_cube_frame', subj: 'maths', cls: 4, ch: C4a, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('A cube frame from sticks and clay'),
    aim: X('To build a cube frame from sticks and clay balls with your own hand, and count its edges, corners and faces.'),
    kind: X('Edges, corners and faces of solids'),
    setup(K) {
      const cf = K.add(MWJ.cubeFrame({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      cf.camView = { p: V3(K, 0.05, 0.42, 0.45), t: V3(K, 0.0, 0.08, -0.06) };
      const fin = { built: once(() => K.lab.emit('built', { obj: cf.id })) };
      MWJ.bindFrameHands(cf, knob, K.app, { build: 1 }, { built: () => fin.built() });
      return { cf, knob, fin };
    },
    steps: [
      { do: X('A box is a cube. Its frame can be made from sticks for the edges and clay balls for the corners.'), target: 'cf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cf.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Let us build it and count.') },
      { do: X('Slide the handle to add the sticks one by one.'), target: 'cf',
        act: async (K, o) => { for (let n = 1; n <= 12; n++) { o.cf.setN(n); await K.sleep(0.25); } o.fin.built(); },
        ev: { type: 'built' }, see: X('A cube frame has 12 edges and 8 corners.') },
      { do: X('Count its faces: the flat squares between the sticks.'), target: 'cf',
        act: async (K, o) => { o.cf.faces(tl(K, X('6 square faces'))); K.lab.emit('faces', { obj: o.cf.id }); await K.sleep(2); },
        ev: { type: 'faces' }, see: X('6 faces, 12 edges, 8 corners.') },
      { do: X('Make the box longer, and then make a pyramid.'), target: 'cf',
        act: async (K, o) => { o.cf.setShape('cube', 1.7); await K.sleep(2); o.cf.setShape('pyr'); K.lab.emit('pyr', { obj: o.cf.id }); await K.sleep(2); },
        ev: { type: 'pyr' }, see: X('A longer box (cuboid) still has 12 edges and 8 corners. A pyramid on a square has 8 edges and 5 corners.') },
    ],
    eq: { word: 'Cube', sym: '6 faces · 12 edges · 8 corners' },
    result: { obs: X('The cube frame took 12 sticks and 8 clay balls, and had 6 faces. The cuboid had the same counts; the pyramid had 8 edges and 5 corners.'),
      concl: X('Solid shapes have faces, edges and corners. A cube and a cuboid each have 6 faces, 12 edges and 8 corners.'),
      safety: X('Sticks have sharp ends: point them away from faces.'),
      viva: [{ q: X('How many edges does a cube have?'), a: X('12.') }, { q: X('How many corners does a cuboid have?'), a: X('8.') }, { q: X('How many corners does a square pyramid have?'), a: X('5.') }] },
  },
  {
    id: 'w4_house_views', subj: 'maths', cls: 4, ch: C4b, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('A toy house from the front, the side and the top'),
    aim: X('To turn a toy house with your own hand and match what you see from the front, the side and the top with drawings.'),
    kind: X('Top, front and side views'),
    setup(K) {
      const th = K.add(MWJ.toyHouse({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      th.camView = { p: V3(K, 0.0, 0.3, 0.45), t: V3(K, 0.0, 0.08, -0.05) };
      const fin = { side: once(() => K.lab.emit('side', { obj: th.id })) };
      MWJ.bindHouseHands(th, knob, K.app, { turn: 1 }, { side: () => fin.side() });
      return { th, knob, fin };
    },
    steps: [
      { do: X('From the front you see a square wall with a door and a triangle roof. It matches the front card.'), target: 'th',
        act: async (K, o) => { K.lab.emit('look', { obj: o.th.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The view depends on where you look from.') },
      { do: X('Slide the handle to turn the house a quarter turn.'), target: 'th',
        act: async (K, o) => { await K.tween(2, (k) => o.th.setTurn(k)); o.th.setTurn(1); o.th.pick(1); o.th.say([tl(K, X('side'))], '#ffd23f'); o.fin.side(); },
        ev: { type: 'side' }, see: X('From the side the roof is a slanting rectangle: it matches the side card.') },
      { do: X('Now look down from the top.'), target: 'th',
        act: async (K, o) => { await K.tween(1.5, (k) => o.th.setTilt(k)); o.th.pick(2); o.th.say([tl(K, X('top'))], '#ffd23f'); K.lab.emit('top', { obj: o.th.id }); await K.sleep(1.5); },
        ev: { type: 'top' }, see: X('From the top you see the roof as a rectangle with a line along the middle, and the square chimney.') },
      { do: X('Which card shows the shape seen from above?'), target: 'th',
        act: async (K, o) => { o.th.say([tl(K, X('top')) + ' ✓'], OK); K.lab.emit('match', { obj: o.th.id }); await K.sleep(1.5); },
        ev: { type: 'match' }, see: X('The top card. The same house looks different from the front, the side and the top.') },
    ],
    eq: { word: 'Views', sym: 'front · side · top' },
    result: { obs: X('The house matched the front card, then the side card after a quarter turn, then the top card from above.'),
      concl: X('One object looks different from different sides. Drawings of the front, side and top views together describe its shape.'),
      safety: X('Look at models from all sides by walking round them, not by leaning over the table.'),
      viva: [{ q: X('What does a ball look like from the top?'), a: X('A circle.') }, { q: X('What does a cone look like from the top?'), a: X('A circle with a dot in the middle.') }, { q: X('What does a cone look like from the side?'), a: X('A triangle.') }] },
  },
  {
    id: 'w4_odd_even', subj: 'maths', cls: 4, ch: C4c, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Marbles in pairs: odd and even'),
    aim: X('To add marbles one at a time with your own hand and see which numbers make pairs with none left over.'),
    kind: X('Odd and even numbers'),
    setup(K) {
      const mp = K.add(MWJ.marblePairs({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      mp.camView = { p: V3(K, 0.0, 0.42, 0.45), t: V3(K, 0.0, 0.02, -0.04) };
      MWJ.bindMarbleHands(mp, lever, K.app, { add: 1 }, { all: () => K.lab.emit('pairs', { obj: mp.id }) });
      return { mp, lever };
    },
    steps: [
      { do: X('Marbles go into the tray in pairs: one in front, one behind.'), target: 'mp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mp.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('A number is even when its marbles all have partners.') },
      { do: X('Push the lever to add one marble at a time, up to 8.'), target: 'mp',
        act: async (K, o) => { while (o.mp.n < 8) { if (!o.mp.busy) o.mp.add1(); await K.sleep(0.2); } await waitIdle(K, o.mp); K.lab.emit('pairs', { obj: o.mp.id }); },
        ev: { type: 'pairs' }, see: X('1, 3, 5, 7 leave one marble alone: odd. 2, 4, 6, 8 make full pairs: even. They take turns.') },
      { do: X('Put 3 marbles and 5 marbles together.'), target: 'mp',
        act: async (K, o) => { o.mp.setN(8); o.mp.say(['3 + 5 = 8'], OK); K.lab.emit('oddodd', { obj: o.mp.id }); await K.sleep(2); },
        ev: { type: 'oddodd' }, see: X('Odd + odd = even: the two lonely marbles become a pair.') },
      { do: X('Is 15 odd or even?'), target: 'mp',
        act: async (K, o) => { o.mp.setN(15); K.lab.emit('fifteen', { obj: o.mp.id }); await K.sleep(2); },
        ev: { type: 'fifteen' }, see: X('15 leaves one marble alone: odd. Numbers ending in 1, 3, 5, 7 or 9 are odd.') },
    ],
    eq: { word: 'Odd and even', sym: 'even: 2, 4, 6, 8 … · odd: 1, 3, 5, 7 …' },
    result: { obs: X('Even numbers of marbles made full pairs; odd numbers left one alone. Odd and even took turns. 3 + 5 made 8, an even number.'),
      concl: X('Even numbers can be split into pairs; odd numbers leave one over. Odd + odd is even, and even + even is even.'),
      safety: X('Keep marbles away from small children: they can choke on them.'),
      viva: [{ q: X('Is 24 odd or even?'), a: X('Even.') }, { q: X('What is odd + even?'), a: X('Odd.') }, { q: X('What is the biggest odd number below 50?'), a: X('49.') }] },
  },
  {
    id: 'w4_thousand_blocks', subj: 'maths', cls: 4, ch: C4d, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Wooden blocks up to a thousand'),
    aim: X('To stack hundred-flats into a thousand-cube with your own hand, and show a four-digit number with blocks.'),
    kind: X('Numbers up to 10,000'),
    setup(K) {
      const tb = K.add(MWJ.thousandBlocks({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      tb.camView = { p: V3(K, 0.0, 0.42, 0.45), t: V3(K, 0.0, 0.04, -0.07) };
      MWJ.bindBlockHands(tb, lever, K.app, { stack: 1 }, { all: () => K.lab.emit('thousand', { obj: tb.id }) });
      return { tb, lever };
    },
    steps: [
      { do: X('A small cube is 1, a rod is 10, a flat is 100. Six flats are stacked: 600.'), target: 'tb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Each flat is ten rods, or a hundred small cubes.') },
      { do: X('Push the lever to stack more flats.'), target: 'tb',
        act: async (K, o) => { while (o.tb.flats < 10) { if (!o.tb.busy) o.tb.addFlat(); await K.sleep(0.2); } await waitIdle(K, o.tb); K.lab.emit('thousand', { obj: o.tb.id }); },
        ev: { type: 'thousand' }, see: X('Ten flats make one big cube: 10 hundreds = 1000.') },
      { do: X('Show 3,425 with blocks.'), target: 'tb',
        act: async (K, o) => { o.tb.showNumber(3, 4, 2, 5); K.lab.emit('show', { obj: o.tb.id }); await K.sleep(2); },
        ev: { type: 'show' }, see: X('3 thousands, 4 hundreds, 2 tens and 5 ones make 3,425.') },
      { do: X('Which is bigger, 3,425 or 3,452?'), target: 'tb',
        act: async (K, o) => { o.tb.say(['3,452 > 3,425'], OK); K.lab.emit('compare', { obj: o.tb.id }); await K.sleep(2); },
        ev: { type: 'compare' }, see: X('Thousands and hundreds are the same, but 5 tens is more than 2 tens: 3,452 is bigger.') },
    ],
    eq: { word: 'Thousands', sym: '10 hundreds = 1 thousand' },
    result: { obs: X('Ten hundred-flats made one thousand-cube. 3,425 was shown as 3 big cubes, 4 flats, 2 rods and 5 small cubes.'),
      concl: X('Ten of each block make one of the next bigger block. To compare numbers, look at the biggest place first.'),
      safety: X('Do not throw the wooden blocks.'),
      viva: [{ q: X('How many hundreds make 5,000?'), a: X('50.') }, { q: X('What is 1,000 + 1,000 + 500?'), a: X('2,500.') }, { q: X('Which is smaller, 4,099 or 4,100?'), a: X('4,099.') }] },
  },
  {
    id: 'w4_ribbon_quarters', subj: 'maths', cls: 4, ch: C4e, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('A metre of ribbon in quarters'),
    aim: X('To cut a metre of ribbon into halves and quarters with your own hand, and find three-quarters of a metre in centimetres.'),
    kind: X('Halves, quarters and three-quarters'),
    setup(K) {
      const rb = K.add(MWJ.ribbonMetre(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      rb.camView = { p: V3(K, 0.0, 0.5, 0.45), t: V3(K, 0.0, 0.0, -0.02) };
      MWJ.bindRibbonHands(rb, lever, K.app, { cut: 1 }, { all: () => K.lab.emit('cut', { obj: rb.id }) });
      return { rb, lever };
    },
    steps: [
      { do: X('This ribbon is 1 metre long: 100 centimetres on the scale.'), target: 'rb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Let us cut it into equal parts.') },
      { do: X('Push the lever to cut the ribbon in half, and again to cut each half in half.'), target: 'rb',
        act: async (K, o) => { while (o.rb.cuts < 2) { if (!o.rb.busy) o.rb.cut(); await K.sleep(0.2); } await waitIdle(K, o.rb); K.lab.emit('cut', { obj: o.rb.id }); },
        ev: { type: 'cut' }, see: X('Half a metre is 50 cm; a quarter of a metre is 25 cm.') },
      { do: X('Take three of the four quarters.'), target: 'rb',
        act: async (K, o) => { o.rb.threeQ(); K.lab.emit('three', { obj: o.rb.id }); await K.sleep(2); },
        ev: { type: 'three' }, see: X('Three-quarters of a metre is 25 + 25 + 25 = 75 cm.') },
      { do: X('How many quarters make a whole metre?'), target: 'rb',
        act: async (K, o) => { o.rb.say(['¼ + ¼ + ¼ + ¼ = 1 m'], OK); K.lab.emit('whole', { obj: o.rb.id }); await K.sleep(2); },
        ev: { type: 'whole' }, see: X('Four quarters make one whole: 4 × 25 cm = 100 cm.') },
    ],
    eq: { word: 'Parts of a metre', sym: '½ m = 50 cm · ¼ m = 25 cm · ¾ m = 75 cm' },
    result: { obs: X('Cutting the metre in half gave two 50 cm pieces; cutting again gave four 25 cm pieces. Three of them made 75 cm.'),
      concl: X('Halves, quarters and three-quarters are equal parts of a whole; of a metre they are 50 cm, 25 cm and 75 cm.'),
      safety: X('Use scissors carefully and hand them over handle first.'),
      viva: [{ q: X('How many centimetres are in half a metre?'), a: X('50.') }, { q: X('What is a quarter of 100 rupees?'), a: X('₹25.') }, { q: X('What is three-quarters of 1 hour, in minutes?'), a: X('45 minutes.') }] },
  },
  {
    id: 'w4_room_tape', subj: 'maths', cls: 4, ch: C4f, topic: 'measure', world: true, place: 'room', table: false,
    title: X('Measuring the classroom with a tape'),
    aim: X('To pull a measuring tape across the classroom with your own hand and write its width in metres and centimetres.'),
    kind: X('Metres and centimetres'),
    setup(K) {
      const ct = K.add(MWJ.classTape(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      ct.camView = { p: V3(K, 0.0, 1.5, 0.7), t: V3(K, 0.0, 0.9, -1.2) };
      const fin = { wall: once(() => K.lab.emit('wall', { obj: ct.id })) };
      MWJ.bindTapeHands(ct, knob, K.app, { pull: 1 }, { wall: () => fin.wall() });
      return { ct, knob, fin };
    },
    steps: [
      { do: X('A measuring tape is hooked on the left wall of the classroom.'), target: 'ct',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ct.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('How wide is the room?') },
      { do: X('Slide the handle to pull the tape out to the right wall.'), target: 'ct',
        act: async (K, o) => { await K.tween(3, (k) => o.ct.setLen(Math.max(0.02, k))); o.ct.setLen(1); o.fin.wall(); },
        ev: { type: 'wall' }, see: X('The tape reaches the right wall at 8 m 40 cm.') },
      { do: X('Change it all into centimetres.'), target: 'ct',
        act: async (K, o) => { o.ct.say(['8 m 40 cm = 800 cm + 40 cm = 840 cm'], OK); K.lab.emit('cm', { obj: o.ct.id }); await K.sleep(2); },
        ev: { type: 'cm' }, see: X('1 metre is 100 cm, so 8 m 40 cm is 840 cm.') },
      { do: X('How many 30 cm rulers would fit across?'), target: 'ct',
        act: async (K, o) => { o.ct.say(['840 ÷ 30 = 28'], '#ffd23f'); K.lab.emit('rulers', { obj: o.ct.id }); await K.sleep(2); },
        ev: { type: 'rulers' }, see: X('28 rulers: a tape is much quicker for long lengths.') },
    ],
    eq: { word: 'Metres and centimetres', sym: '1 m = 100 cm · 8 m 40 cm = 840 cm' },
    result: { obs: X('The tape stretched across the classroom from wall to wall: 8 m 40 cm, which is 840 cm, or 28 rulers of 30 cm.'),
      concl: X('Long lengths are measured in metres with a tape; 1 m = 100 cm, so metres and centimetres can be changed into centimetres.'),
      safety: X('Let the tape roll back slowly: its edge can cut.'),
      viva: [{ q: X('How many centimetres are in 3 m 5 cm?'), a: X('305.') }, { q: X('Which is longer, 2 m or 150 cm?'), a: X('2 m.') }, { q: X('What would you use to measure a pencil: a ruler or a tape?'), a: X('A ruler.') }] },
  },
  {
    id: 'w4_village_bins', subj: 'maths', cls: 4, ch: C4g, topic: 'numbers', world: true, place: 'quad', table: true,
    title: X('Buying dustbins for the cleanest village'),
    aim: X('To find the cost of three dustbins, pay for them with ₹100 notes with your own hand, and work out the change.'),
    kind: X('Money up to ₹1,000'),
    setup(K) {
      const ds = K.add(MWJ.dustbinShop({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      ds.camView = { p: V3(K, 0.0, 0.5, 0.5), t: V3(K, 0.0, 0.06, -0.04) };
      MWJ.bindBinHands(ds, lever, K.app, { pay: 2 }, { all: () => K.lab.emit('pay', { obj: ds.id }) });
      return { ds, lever };
    },
    steps: [
      { do: X('The village wants 3 dustbins for wet and dry waste. Each costs ₹245.'), target: 'ds',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ds.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Wet waste and dry waste go in separate bins.') },
      { do: X('Find the total cost.'), target: 'ds',
        act: async (K, o) => { o.ds.say(['₹245 + ₹245 + ₹245 = ₹735'], '#ffd23f'); K.lab.emit('total', { obj: o.ds.id }); await K.sleep(2); },
        ev: { type: 'total' }, see: X('3 × ₹245 = ₹735.') },
      { do: X('Push the lever to put ₹100 notes on the counter until there is enough.'), target: 'ds',
        act: async (K, o) => { while (o.ds.paid < 8) { if (!o.ds.busy) o.ds.pay(); await K.sleep(0.2); } await waitIdle(K, o.ds); K.lab.emit('pay', { obj: o.ds.id }); },
        ev: { type: 'pay' }, see: X('₹700 is not enough; ₹800 is enough.') },
      { do: X('The shopkeeper gives back the change.'), target: 'ds',
        act: async (K, o) => { await o.ds.change((d, f) => K.tween(d, f)); o.ds.say(['₹800 − ₹735 = ₹65 = ₹50 + ₹10 + ₹5'], OK); K.lab.emit('change', { obj: o.ds.id }); await K.sleep(2); },
        ev: { type: 'change' }, see: X('₹800 − ₹735 = ₹65: a ₹50 note, a ₹10 coin and a ₹5 coin.') },
    ],
    eq: { word: 'Money', sym: '3 × ₹245 = ₹735 · ₹800 − ₹735 = ₹65' },
    result: { obs: X('Three ₹245 dustbins cost ₹735. Eight ₹100 notes were paid and ₹65 came back.'),
      concl: X('Add or multiply to find a total cost; subtract it from what you pay to find the change.'),
      safety: X('Wash your hands after handling waste, and always use the right bin.'),
      viva: [{ q: X('What do 4 pens at ₹15 each cost?'), a: X('₹60.') }, { q: X('You pay ₹500 for a ₹365 bag. What is the change?'), a: X('₹135.') }, { q: X('How many ₹100 notes make ₹1,000?'), a: X('10.') }] },
  },
];
