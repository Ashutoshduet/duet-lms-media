// DUET Maths Lab 360, Class 5 (Maths Mela), batch J5: the odometer reaching one lakh, juice glasses for equal
// fractions, quarter turns on a compass card, a sleeper train (14 × 72), a trundle wheel, milk cans at a dairy, floor
// tiles that leave no gaps, and mugs of water into a bucket on a scale.
import { DICT } from './exp_i18n.js';
import { DICT_J5 } from './exp_i18n_j5.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j5.js';
Object.assign(DICT, DICT_J5);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const C5a = N('Ch 1 · We the Travellers — I', 'अध्याय 1 · हम यात्री — I', 'Ch 1 · Hum yatri — I');
const C5b = N('Ch 2 · Fractions', 'अध्याय 2 · भिन्न', 'Ch 2 · Bhinn');
const C5c = N('Ch 3 · Angles as Turns', 'अध्याय 3 · घुमाव के रूप में कोण', 'Ch 3 · Ghumaav ke roop mein kon');
const C5d = N('Ch 4 · We the Travellers — II', 'अध्याय 4 · हम यात्री — II', 'Ch 4 · Hum yatri — II');
const C5e = N('Ch 5 · Far and Near', 'अध्याय 5 · दूर और पास', 'Ch 5 · Door aur paas');
const C5f = N('Ch 6 · The Dairy Farm', 'अध्याय 6 · डेयरी फ़ार्म', 'Ch 6 · Dairy farm');
const C5g = N('Ch 7 · Shapes and Patterns', 'अध्याय 7 · आकार और पैटर्न', 'Ch 7 · Aakaar aur pattern');
const C5h = N('Ch 8 · Weight and Capacity', 'अध्याय 8 · भार और धारिता', 'Ch 8 · Bhaar aur dhaarita');

export const EXPERIMENTS_J5 = [
  {
    id: 'w5_odometer_lakh', subj: 'maths', cls: 5, ch: C5a, topic: 'numbers', world: true, place: 'farm', table: true,
    title: X('The bus odometer reaches one lakh'),
    aim: X('To drive a bus the last few kilometres with your own hand and watch its odometer roll over from 99,999 to 1,00,000.'),
    kind: X('Large numbers: lakh'),
    setup(K) {
      const od = K.add(MWJ.busOdometer({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      od.camView = { p: V3(K, 0.0, 0.42, 0.42), t: V3(K, 0.0, 0.12, -0.12) };
      const fin = { lakh: once(() => K.lab.emit('lakh', { obj: od.id })) };
      MWJ.bindOdoHands(od, knob, K.app, { drive: 1 }, { lakh: () => fin.lakh() });
      return { od, knob, fin };
    },
    steps: [
      { do: X('Our school bus has travelled 99,985 km. Read the odometer: it counts every kilometre.'), target: 'od',
        act: async (K, o) => { K.lab.emit('look', { obj: o.od.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Six number wheels: 0 9 9 9 8 5.') },
      { do: X('Slide the handle to drive 15 km more.'), target: 'od',
        act: async (K, o) => { await K.tween(3, (k) => o.od.setV(99985 + 15 * k)); o.fin.lakh(); },
        ev: { type: 'lakh' }, see: X('99,998, 99,999 … then every wheel turns at once: 1,00,000. That is one lakh kilometres.') },
      { do: X('How many thousands make one lakh?'), target: 'od',
        act: async (K, o) => { o.od.say(['1,00,000 = 100 × 1,000', '= 10 × 10,000'], [OK, '#ffd23f']); K.lab.emit('thousands', { obj: o.od.id }); await K.sleep(2.5); },
        ev: { type: 'thousands' }, see: X('100 thousands make one lakh; so do 10 ten-thousands.') },
      { do: X('Read a big number the Indian way: 3,45,672.'), target: 'od',
        act: async (K, o) => { const w = Wd(K); o.od.say(['3,45,672', `3 ${w('lakh')} 45 ${w('thousand')} 672`], ['#ffd23f', OK]); K.lab.emit('read', { obj: o.od.id }); await K.sleep(2.5); },
        ev: { type: 'read' }, see: X('Three lakh forty-five thousand six hundred seventy-two. The commas split lakhs, thousands and the last three digits.') },
    ],
    eq: { word: 'One lakh', sym: '99,999 + 1 = 1,00,000 = 100 × 1,000' },
    result: { obs: X('The odometer rolled from 99,985 to 99,999 and then all its wheels turned to show 1,00,000.'),
      concl: X('One more than the biggest 5-digit number, 99,999, is 1,00,000, one lakh: the smallest 6-digit number. 1 lakh = 100 thousands.'),
      safety: X('Never touch the dashboard of a moving vehicle; let the driver drive.'),
      viva: [{ q: X('Write two lakh fifty thousand in numbers.'), a: X('2,50,000.') }, { q: X('What is one less than 1,00,000?'), a: X('99,999.') }, { q: X('How many hundreds make one lakh?'), a: X('1,000.') }] },
  },
  {
    id: 'w5_juice_fractions', subj: 'maths', cls: 5, ch: C5b, topic: 'numbers', world: true, place: 'kitchen', table: true,
    title: X('Half a glass in halves, quarters and eighths'),
    aim: X('To pour juice with your own hand into glasses marked in halves, quarters and eighths, and see which fractions are equal.'),
    kind: X('Equivalent fractions'),
    setup(K) {
      const fg = K.add(MWJ.fractionGlasses({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      fg.camView = { p: V3(K, 0.0, 0.3, 0.42), t: V3(K, 0.0, 0.09, -0.06) };
      MWJ.bindGlassHands(fg, lever, K.app, { pour: 1 }, { all: () => K.lab.emit('pour', { obj: fg.id }) });
      return { fg, lever };
    },
    steps: [
      { do: X('Three same glasses: the first is marked in 2 equal parts, the second in 4, the third in 8.'), target: 'fg',
        act: async (K, o) => { K.lab.emit('look', { obj: o.fg.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Halves, quarters and eighths of the same glass.') },
      { do: X('Push the lever to fill each glass up to its half-way mark.'), target: 'fg',
        act: async (K, o) => { while (o.fg.n < 3) { if (!o.fg.busy) o.fg.fillHalf(); await K.sleep(0.2); } await waitIdle(K, o.fg); K.lab.emit('pour', { obj: o.fg.id }); },
        ev: { type: 'pour' }, see: X('The juice is at the same height in all three: 1/2 = 2/4 = 4/8.') },
      { do: X('Now pour 3/4 in the second glass and 5/8 in the third. Which has more?'), target: 'fg',
        act: async (K, o) => { await new Promise((r) => o.fg.pour(1, 0.75, r)); await new Promise((r) => o.fg.pour(2, 0.625, r)); o.fg.say(['3/4 = 6/8 > 5/8'], OK); K.lab.emit('compare', { obj: o.fg.id }); await K.sleep(1.5); },
        ev: { type: 'compare' }, see: X('3/4 is higher: 3/4 is the same as 6/8, and 6/8 is more than 5/8.') },
      { do: X('How many quarter glasses make one full glass?'), target: 'fg',
        act: async (K, o) => { o.fg.say(['1/4 + 1/4 + 1/4 + 1/4 = 4/4 = 1'], OK); K.lab.emit('whole', { obj: o.fg.id }); await K.sleep(2.5); },
        ev: { type: 'whole' }, see: X('Four quarters make a whole: 4/4 = 1.') },
    ],
    eq: { word: 'Equal fractions', sym: '1/2 = 2/4 = 4/8 · 3/4 = 6/8' },
    result: { obs: X('Half of each glass came to the same height, whether it was 1 of 2 parts, 2 of 4 parts or 4 of 8 parts. 3/4 stood higher than 5/8.'),
      concl: X('Fractions that name the same amount are equivalent: multiply the top and bottom by the same number (1/2 = 2/4 = 4/8). To compare, make the bottoms the same.'),
      safety: X('Wipe up spilt juice at once so nobody slips.'),
      viva: [{ q: X('Which is more, 1/2 or 3/8?'), a: X('1/2 (it is 4/8).') }, { q: X('Write 2/4 with eighths.'), a: X('4/8.') }, { q: X('How many eighths make a whole?'), a: X('8.') }] },
  },
  {
    id: 'w5_compass_turns', subj: 'maths', cls: 5, ch: C5c, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('Quarter turns on a compass card'),
    aim: X('To turn an arrow round a compass card with your own hand and learn quarter, half and full turns, right angles and directions.'),
    kind: X('Turns, right angles and directions'),
    setup(K) {
      const ca = K.add(MWJ.compassArrow({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      ca.camView = { p: V3(K, 0.0, 0.5, 0.32), t: V3(K, 0.0, 0.0, -0.08) };
      const em = (t) => K.lab.emit(t, { obj: ca.id });
      const fin = { 90: once(() => em('quarter')), 360: once(() => em('full')) };
      MWJ.bindTurnHands(ca, knob, K.app, { 1: 90, 2: 360 }, { reach: (G) => fin[G] && fin[G]() });
      return { ca, knob, fin };
    },
    steps: [
      { do: X('The arrow points North, towards the blackboard. Turning it round is a turn.'), target: 'ca',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ca.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('North, East, South and West are a quarter turn apart.') },
      { do: X('Carry the arrow’s tip clockwise, a quarter turn, from North to East.'), target: 'ca',
        act: async (K, o) => { await K.tween(2, (k) => o.ca.set(90 * k)); o.fin[90](); },
        ev: { type: 'quarter' }, see: X('A quarter turn: the folded-paper corner fits exactly. It is a right angle, 90°.') },
      { do: X('Keep turning clockwise: to South, to West, and back to North.'), target: 'ca',
        act: async (K, o) => { await K.tween(3, (k) => o.ca.set(90 + 270 * k)); o.fin[360](); },
        ev: { type: 'full' }, see: X('Half a turn is 2 right angles (180°); a full turn is 4 right angles (360°).') },
      { do: X('Facing North again, turn a quarter turn anticlockwise. Where do you face?'), target: 'ca',
        act: async (K, o) => { o.ca.set(0); await new Promise((r) => o.ca.turnTo(-90, r)); K.lab.emit('anti', { obj: o.ca.id }); await K.sleep(1.5); },
        ev: { type: 'anti' }, see: X('West. Clockwise turns go N → E → S → W; anticlockwise turns go the other way.') },
    ],
    eq: { word: 'Turns', sym: '¼ turn = 90° · ½ turn = 180° · 1 turn = 360°' },
    result: { obs: X('A quarter turn from North reached East and made a right angle; two quarter turns reached South, and four came back to North.'),
      concl: X('A right angle is a quarter turn (90°). Two right angles make a half turn (180°) and four make a full turn (360°).'),
      safety: X('When you turn round on the spot in class, keep your arms close so you do not hit anyone.'),
      viva: [{ q: X('Facing East, you turn a half turn. Where do you face?'), a: X('West.') }, { q: X('How many right angles make a full turn?'), a: X('4.') }, { q: X('Is the corner of a book a right angle?'), a: X('Yes.') }] },
  },
  {
    id: 'w5_sleeper_train', subj: 'maths', cls: 5, ch: C5d, topic: 'numbers', world: true, place: 'rail', table: false,
    title: X('Berths on a sleeper train: 14 × 72'),
    aim: X('To count the berths of one sleeper coach, join 14 coaches to the engine with your own hand, and multiply 72 × 14.'),
    kind: X('Multiplying bigger numbers'),
    setup(K) {
      const st = K.add(MWJ.sleeperTrain({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      st.camView = { p: V3(K, 0.0, 1.75, 0.6), t: V3(K, 0.0, 0.3, -1.7) };
      MWJ.bindTrainHands(st, knob, K.app, { couple: 1 }, { all: () => K.lab.emit('couple', { obj: st.id }) });
      return { st, knob };
    },
    steps: [
      { do: X('This sleeper coach is opened up. Count: it has 9 bays, and each bay has 8 berths.'), target: 'st',
        act: async (K, o) => { K.lab.emit('look', { obj: o.st.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('6 berths across and 2 along the side in every bay: 9 × 8 = 72 berths in one coach.') },
      { do: X('Slide the handle to join 14 coaches to the engine.'), target: 'st',
        act: async (K, o) => { await K.tween(3, (k) => o.st.setK(k)); K.lab.emit('couple', { obj: o.st.id }); },
        ev: { type: 'couple' }, see: X('14 coaches of 72 berths each: 14 × 72.') },
      { do: X('Break 14 into 10 and 4 to multiply.'), target: 'st',
        act: async (K, o) => { o.st.say(['72 × 14 = 72 × 10 + 72 × 4', '= 720 + 288 = 1,008'], ['#ffd23f', OK]); K.lab.emit('split', { obj: o.st.id }); await K.sleep(2.5); },
        ev: { type: 'split' }, see: X('720 + 288 = 1,008 berths on the whole train.') },
      { do: X('1,008 passengers get berths, 72 to a coach. How many coaches are full?'), target: 'st',
        act: async (K, o) => { o.st.say(['1,008 ÷ 72 = 14'], OK); K.lab.emit('divide', { obj: o.st.id }); await K.sleep(2); },
        ev: { type: 'divide' }, see: X('14 coaches: division undoes the multiplication.') },
    ],
    eq: { word: 'Multiplication', sym: '72 × 14 = 720 + 288 = 1,008' },
    result: { obs: X('One coach had 9 bays of 8 berths, 72 in all. Fourteen coaches had 72 × 14 = 1,008 berths.'),
      concl: X('To multiply by a 2-digit number, split it into tens and ones, multiply each part and add: 72 × 14 = 72 × 10 + 72 × 4.'),
      safety: X('Never cross railway tracks; use the foot overbridge.'),
      viva: [{ q: X('What is 72 × 10?'), a: X('720.') }, { q: X('A coach has 64 seats. How many in 10 coaches?'), a: X('640.') }, { q: X('What is 25 × 12?'), a: X('300.') }] },
  },
  {
    id: 'w5_trundle_wheel', subj: 'maths', cls: 5, ch: C5e, topic: 'measure', world: true, place: 'field', table: false,
    title: X('A trundle wheel measures the playground'),
    aim: X('To push a trundle wheel along a chalk line with your own hand, count its clicks in metres, and change kilometres to metres.'),
    kind: X('Metres and kilometres'),
    setup(K) {
      const tw = K.add(MWJ.trundleWheel({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      tw.camView = { p: V3(K, 0.0, 2.7, 3.4), t: V3(K, 0.0, 0.2, -3.0) };
      const fin = { ten: once(() => K.lab.emit('ten', { obj: tw.id })) };
      MWJ.bindTrundleHands(tw, knob, K.app, { push: 1 }, { ten: () => fin.ten() });
      return { tw, knob, fin };
    },
    steps: [
      { do: X('The rim of this trundle wheel is exactly 1 metre round. It clicks once every full turn.'), target: 'tw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tw.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('One turn, one click: 1 metre.') },
      { do: X('Slide the handle to push the wheel along the chalk line.'), target: 'tw',
        act: async (K, o) => { await K.tween(4, (k) => o.tw.setD(10 * k)); o.fin.ten(); },
        ev: { type: 'ten' }, see: X('10 turns, 10 clicks: the line is 10 metres long.') },
      { do: X('How many such 10-metre lines make one kilometre?'), target: 'tw',
        act: async (K, o) => { o.tw.say(['1 km = 1,000 m', '= 100 × 10 m'], [OK, '#ffd23f']); K.lab.emit('km', { obj: o.tw.id }); await K.sleep(2.5); },
        ev: { type: 'km' }, see: X('100 of them: 1 kilometre = 1,000 metres.') },
      { do: X('A milestone says the village is 2 km 350 m away. How many metres is that?'), target: 'tw',
        act: async (K, o) => { o.tw.milestone(); o.tw.say(['2 km 350 m = 2,000 m + 350 m', '= 2,350 m'], ['#ffd23f', OK]); K.lab.emit('stone', { obj: o.tw.id }); await K.sleep(2.5); },
        ev: { type: 'stone' }, see: X('2,350 metres.') },
    ],
    eq: { word: 'Length', sym: '1 km = 1,000 m · 2 km 350 m = 2,350 m' },
    result: { obs: X('The wheel turned 10 times along the chalk line: 10 clicks, 10 m. A kilometre would take 1,000 clicks.'),
      concl: X('Long distances are measured in kilometres: 1 km = 1,000 m. To change km to m, multiply by 1,000 and add the metres.'),
      safety: X('Measure on the playground only when no game is going on.'),
      viva: [{ q: X('How many metres are 3 km?'), a: X('3,000.') }, { q: X('Write 4,500 m in km and m.'), a: X('4 km 500 m.') }, { q: X('Which is longer, 1 km or 900 m?'), a: X('1 km.') }] },
  },
  {
    id: 'w5_dairy_cans', subj: 'maths', cls: 5, ch: C5f, topic: 'numbers', world: true, place: 'farm', table: false,
    title: X('Filling milk cans at the dairy'),
    aim: X('To fill 40-litre cans from the day’s milk with your own hand and see division with a remainder.'),
    kind: X('Division with remainder'),
    setup(K) {
      const dc = K.add(MWJ.dairyCans({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      dc.camView = { p: V3(K, 0.0, 1.85, 1.2), t: V3(K, -0.1, 0.5, -1.4) };
      MWJ.bindDairyHands(dc, lever, K.app, { fill: 1 }, { all: () => K.lab.emit('cans', { obj: dc.id }) });
      return { dc, lever };
    },
    steps: [
      { do: X('15 cows gave 12 litres of milk each today. All the milk is in the steel tank.'), target: 'dc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.dc.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('15 × 12 = 180 litres in the tank.') },
      { do: X('Push the lever to fill the 40-litre cans from the tank, one by one.'), target: 'dc',
        act: async (K, o) => { while (o.dc.left > 0) { if (!o.dc.busy) o.dc.fill1(); await K.sleep(0.2); } await waitIdle(K, o.dc); K.lab.emit('cans', { obj: o.dc.id }); },
        ev: { type: 'cans' }, see: X('4 cans are full (160 L) and the fifth gets only 20 L.') },
      { do: X('Write it as a division.'), target: 'dc',
        act: async (K, o) => { o.dc.say(['180 ÷ 40 = 4', `${tl(K, X('remainder'))} 20`], ['#ffd23f', OK]); K.lab.emit('divide', { obj: o.dc.id }); await K.sleep(2.5); },
        ev: { type: 'divide' }, see: X('180 ÷ 40 is 4, with 20 litres left over: the remainder.') },
      { do: X('Check the answer.'), target: 'dc',
        act: async (K, o) => { o.dc.say(['4 × 40 + 20 = 180'], OK); K.lab.emit('check', { obj: o.dc.id }); await K.sleep(2); },
        ev: { type: 'check' }, see: X('Cans × 40 + remainder gives back all the milk.') },
    ],
    eq: { word: 'Division', sym: '180 ÷ 40 = 4 R 20 · 4 × 40 + 20 = 180' },
    result: { obs: X('From 180 litres, four 40-litre cans were filled and 20 litres went into the fifth can.'),
      concl: X('When a quantity does not share out exactly, the part left over is the remainder. Quotient × divisor + remainder = the whole.'),
      safety: X('Keep milk cans covered and in the shade so the milk stays fresh.'),
      viva: [{ q: X('How many 40 L cans for 200 L?'), a: X('5.') }, { q: X('What is 100 ÷ 40?'), a: X('2, remainder 20.') }, { q: X('A cow gives 12 L a day. How much in a week?'), a: X('84 L.') }] },
  },
  {
    id: 'w5_floor_tiles', subj: 'maths', cls: 5, ch: C5g, topic: 'geometry', world: true, place: 'quad', table: false,
    title: X('Which tiles cover a floor without gaps?'),
    aim: X('To lay square, hexagonal and round tiles with your own hand and find which shapes fit together with no gaps.'),
    kind: X('Tiling patterns'),
    setup(K) {
      const ft = K.add(MWJ.floorTiles({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      ft.camView = { p: V3(K, 0.0, 2.0, 0.6), t: V3(K, 0.0, 0.0, -1.75) };
      MWJ.bindTileHands(ft, lever, K.app, { lay: 1 }, { all: () => K.lab.emit('tiles', { obj: ft.id }) });
      return { ft, lever };
    },
    steps: [
      { do: X('Three frames on the courtyard floor, and three kinds of tiles: squares, hexagons and circles.'), target: 'ft',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ft.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Which will cover a frame with no gaps?') },
      { do: X('Push the lever to lay each kind of tile.'), target: 'ft',
        act: async (K, o) => { while (o.ft.n < 3) { if (!o.ft.busy) o.ft.lay(); await K.sleep(0.2); } await waitIdle(K, o.ft); K.lab.emit('tiles', { obj: o.ft.id }); },
        ev: { type: 'tiles' }, see: X('Squares and hexagons cover the floor fully; circles leave gaps between them.') },
      { do: X('Look at a corner where tiles meet.'), target: 'ft',
        act: async (K, o) => { o.ft.corners(); o.ft.say(['4 × 90° = 360°', '3 × 120° = 360°'], [OK, OK]); K.lab.emit('corner', { obj: o.ft.id }); await K.sleep(2.5); },
        ev: { type: 'corner' }, see: X('Four square corners or three hexagon corners make a full turn, 360°, so no gap is left.') },
      { do: X('Which shapes can tile a floor?'), target: 'ft',
        act: async (K, o) => { const w = Wd(K); o.ft.say([`${w('triangles')}, ${w('squares')}, ${w('hexagons')}`, `${w('circles')}: ${w('gaps!')}`], [OK, '#ff8a5a']); K.lab.emit('which', { obj: o.ft.id }); await K.sleep(2.5); },
        ev: { type: 'which' }, see: X('Triangles, squares and hexagons tile; circles cannot.') },
    ],
    eq: { word: 'Tiling', sym: '4 × 90° = 360° · 3 × 120° = 360°' },
    result: { obs: X('The squares and the hexagons covered their frames with no gaps. The circles touched each other but left gaps.'),
      concl: X('A shape tiles a floor when its corners that meet at a point add up to 360°: squares (4 × 90°), hexagons (3 × 120°) and triangles (6 × 60°) do.'),
      safety: X('Tiles are heavy and their edges are sharp: carry them with both hands.'),
      viva: [{ q: X('How many squares meet at a corner of a tiled floor?'), a: X('4.') }, { q: X('Do circles tile a floor?'), a: X('No.') }, { q: X('How many hexagons meet at a corner?'), a: X('3.') }] },
  },
  {
    id: 'w5_bucket_mugs', subj: 'maths', cls: 5, ch: C5h, topic: 'measure', world: true, place: 'quad', table: false,
    title: X('Mugs of water into a bucket on a scale'),
    aim: X('To fill a 10-litre bucket mug by mug with your own hand, change millilitres to litres, and weigh the water.'),
    kind: X('Capacity and weight'),
    setup(K) {
      const bs = K.add(MWJ.bucketScale({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      bs.camView = { p: V3(K, 0.15, 1.7, 0.95), t: V3(K, -0.1, 0.35, -1.0) };
      const fin = { full: once(() => K.lab.emit('full', { obj: bs.id })) };
      MWJ.bindBucketHands(bs, knob, K.app, { fill: 1 }, { full: () => fin.full() });
      return { bs, knob, fin };
    },
    steps: [
      { do: X('The bucket is marked at 10 litres. The steel mug holds 500 millilitres.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The scale under the empty bucket is set to 0 kg.') },
      { do: X('Slide the handle to fill the bucket mug by mug, up to the 10-litre mark.'), target: 'bs',
        act: async (K, o) => { await K.tween(5, (k) => o.bs.setK(k)); o.fin.full(); },
        ev: { type: 'full' }, see: X('20 mugs × 500 mL = 10,000 mL = 10 litres.') },
      { do: X('What does the scale show now?'), target: 'bs',
        act: async (K, o) => { o.bs.say(['10 L ≈ 10 kg'], OK); K.lab.emit('weigh', { obj: o.bs.id }); await K.sleep(2.5); },
        ev: { type: 'weigh' }, see: X('About 10 kg: 1 litre of water weighs about 1 kilogram.') },
      { do: X('How many mugs make 1 litre?'), target: 'bs',
        act: async (K, o) => { o.bs.say(['2 × 500 mL = 1,000 mL = 1 L'], OK); K.lab.emit('litre', { obj: o.bs.id }); await K.sleep(2.5); },
        ev: { type: 'litre' }, see: X('2 mugs: 1 litre = 1,000 millilitres.') },
    ],
    eq: { word: 'Capacity', sym: '20 × 500 mL = 10,000 mL = 10 L ≈ 10 kg' },
    result: { obs: X('Twenty 500 mL mugs filled the bucket to 10 L, and the scale showed about 10 kg of water.'),
      concl: X('1 litre = 1,000 millilitres, and 1 litre of water weighs about 1 kilogram, so litres of water and kilograms go together.'),
      safety: X('Do not waste water: pour the bucket on the plants afterwards.'),
      viva: [{ q: X('How many mL are in 3 L?'), a: X('3,000.') }, { q: X('How many 250 mL glasses fill 1 L?'), a: X('4.') }, { q: X('About how heavy is 5 L of water?'), a: X('5 kg.') }] },
  },
];
