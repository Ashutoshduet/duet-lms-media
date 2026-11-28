// DUET Maths Lab 360, Class 4 (Maths Mela), batch J4: weighing rice, egg trays, rounding the tiger count, a mirror
// butterfly, a station clock in 24-hour time, ticket bundles at the transport museum, and a bar graph on the floor.
import { DICT } from './exp_i18n.js';
import { DICT_J4 } from './exp_i18n_j4.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j4.js';
Object.assign(DICT, DICT_J4);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const C4h = N('Ch 8 · Weigh it, Pour it', 'अध्याय 8 · तौलो, डालो', 'Ch 8 · Taulo, daalo');
const C4i = N('Ch 9 · Equal Groups', 'अध्याय 9 · बराबर समूह', 'Ch 9 · Barabar groups');
const C4j = N('Ch 10 · Elephants, Tigers, and Leopards', 'अध्याय 10 · हाथी, बाघ और तेंदुए', 'Ch 10 · Haathi, baagh aur tendue');
const C4k = N('Ch 11 · Fun with Symmetry', 'अध्याय 11 · सममिति के साथ मज़ा', 'Ch 11 · Symmetry ke saath maza');
const C4l = N('Ch 12 · Ticking Clocks and Turning Calendar', 'अध्याय 12 · टिक-टिक घड़ी और पलटता कैलेंडर', 'Ch 12 · Tik-tik ghadi aur palat-ta calendar');
const C4m = N('Ch 13 · The Transport Museum', 'अध्याय 13 · परिवहन संग्रहालय', 'Ch 13 · Transport museum');
const C4n = N('Ch 14 · Data Handling', 'अध्याय 14 · आँकड़ों का प्रबंधन', 'Ch 14 · Data handling');

export const EXPERIMENTS_J4 = [
  {
    id: 'w4_rice_weights', subj: 'maths', cls: 4, ch: C4h, topic: 'measure', world: true, place: 'kitchen', table: true,
    title: X('Weighing a bag of rice with weights'),
    aim: X('To put standard weights on a balance with your own hand until it is level, and so find the weight of a bag of rice.'),
    kind: X('Weight in grams and kilograms'),
    setup(K) {
      const rb = K.add(MWJ.riceBalance(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      rb.camView = { p: V3(K, 0.0, 0.42, 0.5), t: V3(K, 0.0, 0.14, -0.08) };
      MWJ.bindRiceHands(rb, lever, K.app, { add: 1 }, { all: () => K.lab.emit('level', { obj: rb.id }) });
      return { rb, lever };
    },
    steps: [
      { do: X('A bag of rice is on the left pan. How heavy is it? The weights are 500 g, 200 g and 50 g.'), target: 'rb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The rice side is down: it is heavier than the empty pan.') },
      { do: X('Push the lever to put the weights on the right pan, biggest first.'), target: 'rb',
        act: async (K, o) => { while (o.rb.on < 3) { if (!o.rb.busy) o.rb.addW(); await K.sleep(0.3); } await waitIdle(K, o.rb); K.lab.emit('level', { obj: o.rb.id }); },
        ev: { type: 'level' }, see: X('500 g: the rice is still heavier. 500 + 200 = 700 g: still heavier. 750 g: the balance is level.') },
      { do: X('So how heavy is the rice?'), target: 'rb',
        act: async (K, o) => { o.rb.say(['750 g = ¾ kg'], OK); K.lab.emit('answer', { obj: o.rb.id }); await K.sleep(2); },
        ev: { type: 'answer' }, see: X('The rice weighs 750 grams, three-quarters of a kilogram.') },
      { do: X('How much more rice makes 1 kg?'), target: 'rb',
        act: async (K, o) => { o.rb.say(['1000 g − 750 g = 250 g'], '#ffd23f'); K.lab.emit('more', { obj: o.rb.id }); await K.sleep(2); },
        ev: { type: 'more' }, see: X('250 grams more make 1 kilogram.') },
    ],
    eq: { word: 'Weighing', sym: '500 g + 200 g + 50 g = 750 g' },
    result: { obs: X('The balance became level with 500 g, 200 g and 50 g on the other pan: the rice weighed 750 g.'),
      concl: X('A balance is level when both sides weigh the same; adding the standard weights gives the weight. 1 kg = 1000 g.'),
      safety: X('Put weights down gently; do not drop them on your feet.'),
      viva: [{ q: X('Which weights make 650 g?'), a: X('500 g + 100 g + 50 g.') }, { q: X('How many grams are in 2 kg?'), a: X('2000.') }, { q: X('Which is heavier, 800 g or 1 kg?'), a: X('1 kg.') }] },
  },
  {
    id: 'w4_egg_trays', subj: 'maths', cls: 4, ch: C4i, topic: 'numbers', world: true, place: 'kitchen', table: true,
    title: X('Egg trays: equal groups of six'),
    aim: X('To put out trays of 6 eggs with your own hand, count in sixes, and see multiplication and division together.'),
    kind: X('Multiplication and division'),
    setup(K) {
      const et = K.add(MWJ.eggTrays({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      et.camView = { p: V3(K, 0.0, 0.48, 0.5), t: V3(K, 0.0, 0.03, -0.06) };
      MWJ.bindEggHands(et, lever, K.app, { add: 1 }, { all: () => K.lab.emit('trays', { obj: et.id }) });
      return { et, lever };
    },
    steps: [
      { do: X('Each tray holds 6 eggs: 2 rows of 3.'), target: 'et', act: async (K, o) => { K.lab.emit('look', { obj: o.et.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('6 eggs in every tray: equal groups.') },
      { do: X('Push the lever to put out 7 trays.'), target: 'et',
        act: async (K, o) => { while (o.et.n < 7) { if (!o.et.busy) o.et.add1(); await K.sleep(0.2); } await waitIdle(K, o.et); K.lab.emit('trays', { obj: o.et.id }); },
        ev: { type: 'trays' }, see: X('6, 12, 18, 24, 30, 36, 42: seven sixes are 42. 7 × 6 = 42.') },
      { do: X('42 eggs are packed 6 to a tray. How many trays?'), target: 'et',
        act: async (K, o) => { o.et.say(['42 ÷ 6 = 7'], OK); K.lab.emit('divide', { obj: o.et.id }); await K.sleep(2); }, ev: { type: 'divide' }, see: X('42 ÷ 6 = 7: division undoes multiplication.') },
      { do: X('Count by rows instead: each tray has 2 rows of 3.'), target: 'et',
        act: async (K, o) => { o.et.say(['7 × 2 = 14 rows', '14 × 3 = 42'], ['#ffd23f', OK]); K.lab.emit('rows', { obj: o.et.id }); await K.sleep(2); }, ev: { type: 'rows' }, see: X('14 rows of 3 is also 42: the same eggs counted another way.') },
    ],
    eq: { word: 'Equal groups', sym: '7 × 6 = 42 · 42 ÷ 6 = 7' },
    result: { obs: X('Seven trays of 6 eggs made 42. Packing 42 eggs in sixes needed 7 trays; counted in rows of 3 there were 14 rows.'),
      concl: X('Multiplication counts equal groups and division finds how many groups or how many in each. They undo each other.'),
      safety: X('Carry egg trays flat with both hands.'),
      viva: [{ q: X('What is 8 × 6?'), a: X('48.') }, { q: X('How many trays of 6 hold 30 eggs?'), a: X('5.') }, { q: X('What is 9 × 7?'), a: X('63.') }] },
  },
  {
    id: 'w4_tiger_round', subj: 'maths', cls: 4, ch: C4j, topic: 'numbers', world: true, place: 'field', table: false,
    title: X('Rounding the tiger count on hills'),
    aim: X('To let a ball roll down a wavy track with your own hand and so round 3,682 to the nearest hundred and the nearest ten.'),
    kind: X('Estimating: rounding off'),
    setup(K) {
      const rh = K.add(MWJ.roundingHills({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      rh.camView = { p: V3(K, 0.0, 1.6, 1.2), t: V3(K, 0.0, 0.6, -2.4) };
      const fin = { roll: once(() => K.lab.emit('roll', { obj: rh.id })) };
      MWJ.bindRoundHands(rh, lever, K.app, { roll: 1 }, { roll: () => fin.roll() });
      return { rh, lever, fin };
    },
    steps: [
      { do: X('India counted 3,682 tigers. On this track the hundreds 3,600 and 3,700 are in the valleys, and 3,650 is on the hilltop.'), target: 'rh',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rh.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The ball sits on 3,682, past the hilltop.') },
      { do: X('Push the lever to let the ball go.'), target: 'rh',
        act: async (K, o) => { o.rh.roll(); await waitIdle(K, o.rh); o.fin.roll(); },
        ev: { type: 'roll' }, see: X('It rolls down to 3,700: 3,682 is nearer to 3,700 than to 3,600. About 3,700 tigers.') },
      { do: X('Now the valleys are at every ten.'), target: 'rh',
        act: async (K, o) => { o.rh.tens(); await K.sleep(1.5); o.rh.roll(); await waitIdle(K, o.rh); K.lab.emit('tens', { obj: o.rh.id }); },
        ev: { type: 'tens' }, see: X('Between 3,680 and 3,690 the ball rolls to 3,680: to the nearest ten, 3,682 is about 3,680.') },
      { do: X('Why round at all?'), target: 'rh',
        act: async (K, o) => { o.rh.say(['≈ 3,700'], OK); K.lab.emit('why', { obj: o.rh.id }); await K.sleep(2); },
        ev: { type: 'why' }, see: X('A rounded number is easy to remember and compare, like “about 3,700 tigers”.') },
    ],
    eq: { word: 'Rounding', sym: '3,682 ≈ 3,700 (hundreds) ≈ 3,680 (tens)' },
    result: { obs: X('From 3,682 the ball rolled to 3,700 on the hundreds track and to 3,680 on the tens track.'),
      concl: X('To round, find the nearer of the two hundreds (or tens): half way and beyond goes up, below half way goes down.'),
      safety: X('Wild animals are counted from a distance by trained people with camera traps; never go near them.'),
      viva: [{ q: X('Round 4,350 to the nearest hundred.'), a: X('4,400.') }, { q: X('Round 2,718 to the nearest ten.'), a: X('2,720.') }, { q: X('Round 1,249 to the nearest hundred.'), a: X('1,200.') }] },
  },
  {
    id: 'w4_mirror_butterfly', subj: 'maths', cls: 4, ch: C4k, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('A mirror completes the butterfly'),
    aim: X('To stand a mirror on the edge of half a butterfly with your own hand and see the whole butterfly, then find its line of symmetry.'),
    kind: X('Mirror images and symmetry'),
    setup(K) {
      const mb = K.add(MWJ.mirrorButterfly({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      mb.camView = { p: V3(K, 0.0, 0.5, 0.42), t: V3(K, 0.0, 0.02, -0.06) };
      const fin = { placed: once(() => K.lab.emit('mirror', { obj: mb.id })) };
      MWJ.bindMirrorHands(mb, lever, K.app, { place: 1 }, { placed: () => fin.placed() });
      return { mb, lever, fin };
    },
    steps: [
      { do: X('Only half of a butterfly is drawn on the grid paper.'), target: 'mb', act: async (K, o) => { K.lab.emit('look', { obj: o.mb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The other half is missing.') },
      { do: X('Push the lever to stand the mirror on the edge of the drawing.'), target: 'mb',
        act: async (K, o) => { o.mb.place(); await waitIdle(K, o.mb); o.fin.placed(); },
        ev: { type: 'mirror' }, see: X('The mirror shows the missing half: a whole butterfly.') },
      { do: X('Lift the mirror and draw the other half to match.'), target: 'mb',
        act: async (K, o) => { await o.mb.lift((d, f) => K.tween(d, f)); K.lab.emit('draw', { obj: o.mb.id }); await K.sleep(1); },
        ev: { type: 'draw' }, see: X('Each point on the left is as far from the middle line as its partner on the right.') },
      { do: X('Where is the line of symmetry?'), target: 'mb',
        act: async (K, o) => { o.mb.say([tl(K, X('line of symmetry')) + ' = ' + tl(K, X('the body'))], OK); K.lab.emit('line', { obj: o.mb.id }); await K.sleep(2); },
        ev: { type: 'line' }, see: X('Down the middle of the body, where the mirror stood.') },
    ],
    eq: { word: 'Line of symmetry', sym: 'left half = mirror image of right half' },
    result: { obs: X('With the mirror on the edge, half a butterfly looked whole. The drawn half matched it square by square.'),
      concl: X('A shape is symmetrical when one half is the mirror image of the other; the mirror line is the line of symmetry.'),
      safety: X('Mirrors are glass: hold them by the frame.'),
      viva: [{ q: X('How many lines of symmetry does the letter A have?'), a: X('1.') }, { q: X('Does the letter F have a line of symmetry?'), a: X('No.') }, { q: X('How many lines of symmetry does a square have?'), a: X('4.') }] },
  },
  {
    id: 'w4_station_clock', subj: 'maths', cls: 4, ch: C4l, topic: 'measure', world: true, place: 'rail', table: false,
    title: X('A night train and the 24-hour clock'),
    aim: X('To move the station clock forward through a night journey with your own hand and read the times in a.m./p.m. and 24-hour form.'),
    kind: X('Time: a.m., p.m. and 24-hour clock'),
    setup(K) {
      const sc = K.add(MWJ.stationClock({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      sc.camView = { p: V3(K, 0.0, 1.7, 0.8), t: V3(K, 0.0, 1.9, -3.2) };
      const fin = { arrive: once(() => K.lab.emit('arrive', { obj: sc.id })) };
      MWJ.bindStationHands(sc, knob, K.app, { go: 1 }, { arrive: () => fin.arrive() });
      return { sc, knob, fin };
    },
    steps: [
      { do: X('The night train leaves at 21:30, which is 9:30 p.m. The journey takes 2 hours 45 minutes.'), target: 'sc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sc.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('In 24-hour time, hours after noon are 13 to 23.') },
      { do: X('Slide the handle to move the clock through the journey.'), target: 'sc',
        act: async (K, o) => { await K.tween(3, (k) => o.sc.setMin(o.sc.start + Math.round(165 * k))); o.fin.arrive(); },
        ev: { type: 'arrive' }, see: X('22:30, 23:30, then midnight: a new day starts at 00:00. The train arrives at 00:15, which is 12:15 a.m.') },
      { do: X('Add it up: 2 hours from 21:30, then 45 minutes more.'), target: 'sc',
        act: async (K, o) => { o.sc.say(['21:30 + 2 h = 23:30', '23:30 + 45 min = 00:15'], ['#ffd23f', OK]); K.lab.emit('add', { obj: o.sc.id }); await K.sleep(2); },
        ev: { type: 'add' }, see: X('Past midnight the date changes: the train arrives the next day.') },
      { do: X('How many hours are in a whole day?'), target: 'sc',
        act: async (K, o) => { o.sc.say(['1 day = 24 h'], OK); K.lab.emit('day', { obj: o.sc.id }); await K.sleep(2); }, ev: { type: 'day' }, see: X('24 hours: the clock face goes round twice, a.m. and then p.m.') },
    ],
    eq: { word: '24-hour time', sym: '9:30 p.m. = 21:30 · 12:15 a.m. = 00:15' },
    result: { obs: X('Leaving at 21:30 (9:30 p.m.) and travelling 2 h 45 min, the train arrived at 00:15 (12:15 a.m.) the next day.'),
      concl: X('a.m. is from midnight to noon and p.m. from noon to midnight. In 24-hour time, add 12 to p.m. hours; a day has 24 hours.'),
      safety: X('Stand behind the yellow line on a railway platform.'),
      viva: [{ q: X('Write 4:00 p.m. in 24-hour time.'), a: X('16:00.') }, { q: X('What is 07:45 in a.m./p.m.?'), a: X('7:45 a.m.') }, { q: X('How many minutes are in 2 hours 45 minutes?'), a: X('165.') }] },
  },
  {
    id: 'w4_museum_tickets', subj: 'maths', cls: 4, ch: C4m, topic: 'numbers', world: true, place: 'room', table: true,
    title: X('Ticket bundles at the transport museum'),
    aim: X('To put out bundles of ten ₹10 tickets with your own hand and see what happens when you multiply by 10 and by 100.'),
    kind: X('Multiplying by 10 and 100'),
    setup(K) {
      const tb = K.add(MWJ.ticketBundles({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      tb.camView = { p: V3(K, 0.0, 0.45, 0.48), t: V3(K, 0.0, 0.03, -0.08) };
      MWJ.bindTicketHands(tb, lever, K.app, { add: 1 }, { all: () => K.lab.emit('bundles', { obj: tb.id }) });
      return { tb, lever };
    },
    steps: [
      { do: X('Museum tickets cost ₹10 each and come in bundles of 10.'), target: 'tb', act: async (K, o) => { K.lab.emit('look', { obj: o.tb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('One bundle: 10 tickets, ₹100.') },
      { do: X('Push the lever to put out 10 bundles, for a school trip.'), target: 'tb',
        act: async (K, o) => { while (o.tb.n < 10) { if (!o.tb.busy) o.tb.add1(); await K.sleep(0.15); } await waitIdle(K, o.tb); K.lab.emit('bundles', { obj: o.tb.id }); },
        ev: { type: 'bundles' }, see: X('10 bundles × 10 = 100 tickets, and 100 tickets × ₹10 = ₹1,000.') },
      { do: X('Look at the zeros.'), target: 'tb',
        act: async (K, o) => { o.tb.say(['23 × 10 = 230', '23 × 100 = 2,300'], ['#ffd23f', OK]); K.lab.emit('zeros', { obj: o.tb.id }); await K.sleep(2); },
        ev: { type: 'zeros' }, see: X('Multiplying by 10 puts one zero at the end; multiplying by 100 puts two zeros.') },
      { do: X('And with 1 and 0?'), target: 'tb',
        act: async (K, o) => { o.tb.say(['45 × 1 = 45', '45 × 0 = 0'], ['#ffd23f', '#ff8a5a']); K.lab.emit('onezero', { obj: o.tb.id }); await K.sleep(2); },
        ev: { type: 'onezero' }, see: X('Anything × 1 stays the same; anything × 0 is 0.') },
    ],
    eq: { word: 'Times 10 and 100', sym: '23 × 10 = 230 · 23 × 100 = 2,300' },
    result: { obs: X('Ten bundles of ten tickets were 100 tickets, worth ₹1,000. 23 × 10 = 230 and 23 × 100 = 2,300.'),
      concl: X('Multiplying a whole number by 10, 100 or 1,000 adds one, two or three zeros at the end. × 1 keeps a number; × 0 gives 0.'),
      safety: X('Keep museum tickets until you leave; you may be asked to show them.'),
      viva: [{ q: X('What is 56 × 10?'), a: X('560.') }, { q: X('What is 7 × 1,000?'), a: X('7,000.') }, { q: X('What is 300 ÷ 10?'), a: X('30.') }] },
  },
  {
    id: 'w4_school_bars', subj: 'maths', cls: 4, ch: C4n, topic: 'data', world: true, place: 'room', table: false,
    title: X('A bar graph of how we come to school'),
    aim: X('To stack blocks on a floor graph with your own hand as each row of children votes, and read the bar graph.'),
    kind: X('Collecting data and bar graphs'),
    setup(K) {
      const sb = K.add(MWJ.schoolBars({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      sb.camView = { p: V3(K, 0.0, 2.0, 0.2), t: V3(K, 0.05, 0.0, -2.1) };
      MWJ.bindBarHands(sb, lever, K.app, { vote: 1 }, { all: () => K.lab.emit('vote', { obj: sb.id }) });
      return { sb, lever };
    },
    steps: [
      { do: X('Each child puts one block on the way they come to school: walk, cycle, bus or auto.'), target: 'sb', act: async (K, o) => { K.lab.emit('look', { obj: o.sb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('One block stands for one child.') },
      { do: X('Push the lever to add the votes of each row of children.'), target: 'sb',
        act: async (K, o) => { while (o.sb.row < 4) { if (!o.sb.busy) o.sb.addRow(); await K.sleep(0.2); } await waitIdle(K, o.sb); K.lab.emit('vote', { obj: o.sb.id }); },
        ev: { type: 'vote' }, see: X('Walk 7, cycle 5, bus 9, auto 3: 24 children in all.') },
      { do: X('Which is the most common way, and which the least?'), target: 'sb',
        act: async (K, o) => { o.sb.say([tl(K, X('bus')) + ' 9 > … > ' + tl(K, X('auto')) + ' 3'], OK); K.lab.emit('read', { obj: o.sb.id }); await K.sleep(2); }, ev: { type: 'read' }, see: X('Most come by bus (the tallest bar); fewest by auto (the shortest bar).') },
      { do: X('How many more walk than cycle?'), target: 'sb',
        act: async (K, o) => { o.sb.say(['7 − 5 = 2'], '#ffd23f'); K.lab.emit('compare', { obj: o.sb.id }); await K.sleep(2); }, ev: { type: 'compare' }, see: X('2 more children walk than cycle.') },
    ],
    eq: { word: 'Bar graph', sym: 'one block = one child' },
    result: { obs: X('The bars showed walk 7, cycle 5, bus 9 and auto 3, for 24 children. Bus was the tallest bar and auto the shortest.'),
      concl: X('A bar graph shows data as bars whose heights we can compare at a glance; reading the scale gives the numbers.'),
      safety: X('Do not stand on the floor graph.'),
      viva: [{ q: X('How many children were asked?'), a: X('24.') }, { q: X('How many come by bus or auto?'), a: X('12.') }, { q: X('Which bar is the shortest?'), a: X('Auto.') }] },
  },
];
