// DUET Maths Lab 360, real places 14: hands-on versions of the chapters that only had table-top models — sharing rotis
// (fractions), a rangoli (symmetry), three sticks (triangles), a stack of boxes (squares and cubes), garden beds
// (distributing), a leaning field (perimeter and area), and a big spinner (probability).
import { DICT } from './exp_i18n.js';
import { DICT_W14 } from './exp_i18n_w14.js';
import * as MW from './mathworld.js';
import * as MW14 from './mathworld14.js';
import { ease } from './mathlab2.js';
Object.assign(DICT, DICT_W14);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const C6f = N('Ch 7 · Fractions', 'अध्याय 7 · भिन्न', 'Ch 7 · Fractions (bhinn)');
const C6s = N('Ch 9 · Symmetry', 'अध्याय 9 · सममिति', 'Ch 9 · Symmetry (sammiti)');
const C7l = N('Ch 7 · A Tale of Three Intersecting Lines', 'अध्याय 7 · तीन प्रतिच्छेदी रेखाओं की कहानी', 'Ch 7 · Teen intersecting lines ki kahani');
const C8c = N('Ch 1 · A Square and A Cube', 'अध्याय 1 · एक वर्ग और एक घन', 'Ch 1 · Ek square aur ek cube');
const C8d = N('Ch 6 · We Distribute, Yet Things Multiply', 'अध्याय 6 · हम बाँटते हैं, फिर भी चीज़ें गुणा होती हैं', 'Ch 6 · We Distribute, Yet Things Multiply');
const C9m = N('Ch 6 · Measuring Space: Perimeter and Area', 'अध्याय 6 · स्थान का मापन: परिमाप और क्षेत्रफल', 'Ch 6 · Measuring Space: perimeter aur area');
const C9p = N('Ch 7 · The Mathematics of Maybe: Introduction to Probability', 'अध्याय 7 · ‘शायद’ का गणित: प्रायिकता का परिचय', 'Ch 7 · ‘Shayad’ ka ganit: Probability ka parichay');
function label(K, text, at, h = 0.42, sec = 0, o = {}) {
  const s = MW.sign(text, h, o); s.position.copy(at); K.app.scene.add(s); K.extras.push(s);
  if (sec) K.sleep(sec).then(() => { K.app.scene.remove(s); });
  if (o.step) (K._stepLabels ||= []).push(s);
  return s;
}
const fresh = (K) => { for (const s of K._stepLabels || []) K.app.scene.remove(s); K._stepLabels = []; };
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitFor = async (K, f, max = 60) => { for (let i = 0; i < max * 10 && !f(); i++) await K.sleep(0.1); };

export const EXPERIMENTS_W14 = [
  // ---------------------------------------------------------------- Class 6 Ch 7: 3 rotis for 4 children
  {
    id: 'w6_roti_share', subj: 'maths', cls: 6, ch: C6f, world: true, place: 'kitchen', table: true,
    title: X('Sharing 3 rotis among 4 children'),
    aim: X('To cut rotis with your own hand and share them equally among four children, and see that each child gets 3/4 of a roti.'),
    kind: X('Fractions as equal shares'),
    setup(K) {
      const rs = K.add(MW14.rotiShare(), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      rs.camView = { p: V3(K, 0.0, 0.55, 0.62), t: V3(K, 0.0, 0.05, -0.05) };
      const fin = { cut: once(() => K.lab.emit('cut', { obj: rs.id })) };
      MW14.bindRotiHands(rs, lever, K.app, { cut: 1 }, { cut: () => fin.cut() });
      return { rs, lever, fin };
    },
    steps: [
      { do: X('There are 3 rotis and 4 children. Each child must get the same amount.'), target: 'rs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('There are not enough rotis to give each child a whole one.') },
      { do: X('Push the lever to cut every roti into 4 equal pieces.'), target: 'rs',
        act: async (K, o) => { o.rs.doCut(); await waitFor(K, () => !o.rs.busy); o.fin.cut(); await K.sleep(0.5); },
        ev: { type: 'cut' }, see: X('Each piece is one quarter of a roti: 1/4. There are 3 × 4 = 12 quarters in all.') },
      { do: X('Give each child one piece from every roti.'), target: 'rs',
        act: async (K, o) => { await K.tween(2.2, (k) => o.rs.setDeal(k)); o.rs.setDeal(1); o.rs.say(['3 ÷ 4 = 3/4'], OK); K.lab.emit('deal', { obj: o.rs.id }); await K.sleep(1.2); },
        ev: { type: 'deal' }, see: X('Every plate has 3 quarters, which together make three-quarters of a roti. So 3 ÷ 4 = 3/4.') },
      { do: X('Now cut every quarter in half.'), target: 'rs',
        act: async (K, o) => { o.rs.setEighths(true); o.rs.say(['3/4 = 6/8'], '#ffd23f'); K.lab.emit('eighths', { obj: o.rs.id }); label(K, '3/4 = 6/8', o.rs.at('plate'), 0.03, 0, { color: '#ffd23f', step: true }); await K.sleep(2); },
        ev: { type: 'eighths' }, see: X('Each child now has 6 pieces of 1/8, the same amount as before: 3/4 = 6/8. These are equivalent fractions.') },
    ],
    eq: { word: 'Equal shares', sym: '3 ÷ 4 = 3/4 = 6/8' },
    result: {
      obs: X('Cutting each of the 3 rotis into quarters made 12 pieces, and each of the 4 children got 3 of them: 3/4 of a roti, which is the same as 6/8.'),
      concl: X('A fraction can mean an equal share: sharing 3 things among 4 people gives each 3/4. Cutting every piece into equal smaller pieces gives an equivalent fraction.'),
      safety: X('Wash your hands before handling food.'),
      viva: [{ q: X('How much does each child get if 2 rotis are shared among 3 children?'), a: X('2/3 of a roti.') },
        { q: X('Write two fractions equal to 1/2.'), a: X('2/4 and 4/8 (or 3/6).') },
        { q: X('Which is more, 3/4 or 2/3?'), a: X('3/4 (9/12 is more than 8/12).') }],
    },
  },
  // ---------------------------------------------------------------- Class 6 Ch 9: a rangoli folded and turned
  {
    id: 'w6_rangoli_symmetry', subj: 'maths', cls: 6, ch: C6s, world: true, place: 'quad', table: false,
    title: X('A rangoli that folds and turns'),
    aim: X('To unfold half a rangoli across its middle line with your own hand, find all its lines of symmetry, and turn it to see how often it looks the same.'),
    kind: X('Line and rotational symmetry'),
    setup(K) {
      const rf = K.add(MW14.rangoliFold(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3), knob = K.add(MW.pullTab(), 0, -0.42);
      rf.camView = { p: V3(K, 0.4, 3.6, 0.6), t: V3(K, 0.4, 0, -2.3) };
      rf.words = () => [tl(K, X('turned')), tl(K, X('same again'))];
      const fin = { unfold: once(() => K.lab.emit('unfold', { obj: rf.id })), turn: once(() => K.lab.emit('turn', { obj: rf.id })) };
      MW14.bindRangoliHands(rf, lever, knob, K.app, { unfold: 1, turn: 3 }, { unfold: () => fin.unfold(), turn: () => fin.turn() });
      return { rf, lever, knob, fin };
    },
    steps: [
      { do: X('Only half of this rangoli is drawn. The other half is folded under, along the blue line.'), target: 'rf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('If the blue line is a line of symmetry, unfolding should give a perfect copy.') },
      { do: X('Push the lever to unfold the other half like a sheet of paper.'), target: 'rf',
        act: async (K, o) => { await K.tween(1.6, (k) => o.rf.setFold(1 - k)); o.rf.setFold(0); o.fin.unfold(); await K.sleep(0.5); },
        ev: { type: 'unfold' }, see: X('The right half is the mirror image of the left half: the blue line is a line of symmetry.') },
      { do: X('Are there more lines that fold it onto itself?'), target: 'rf',
        act: async (K, o) => { o.rf.showLines(); K.lab.emit('lines', { obj: o.rf.id }); o.rf.say(['4'], OK); await K.sleep(2); },
        ev: { type: 'lines' }, see: X('Yes: the two diagonals and the line across the middle as well. This rangoli has 4 lines of symmetry.') },
      { do: X('Slide the handle to turn the rangoli all the way round. Watch the white arrow.'), target: 'rf',
        act: async (K, o) => { o.rf.hideAll(); for (const a of [45, 90, 180, 270, 360]) { await K.tween(0.8, (k) => o.rf.setAng(o.rf.ang + (a - o.rf.ang) * ease(k))); o.rf.setAng(a); await K.sleep(0.3); } o.fin.turn(); },
        ev: { type: 'turn' }, see: X('At 90°, 180°, 270° and 360° the rangoli looks exactly as it began, but at 45° it does not.') },
      { do: X('How many times does it look the same in one full turn?'), target: 'rf',
        act: async (K, o) => { o.rf.say(['360° ÷ 90° = 4'], OK); K.lab.emit('order', { obj: o.rf.id }); await K.sleep(2); },
        ev: { type: 'order' }, see: X('4 times, so it has rotational symmetry of order 4. The smallest turn that matches is 90°.') },
    ],
    eq: { word: 'Rotational symmetry', sym: 'order = 360° ÷ smallest matching turn' },
    result: {
      obs: X('Unfolding along the middle line gave a perfect mirror copy. The rangoli had 4 lines of symmetry and matched itself 4 times in a full turn.'),
      concl: X('A line of symmetry folds a figure exactly onto itself. A figure has rotational symmetry if it looks the same after a turn of less than 360°; the number of matches in a full turn is its order.'),
      safety: X('Do not walk on a freshly made rangoli.'),
      viva: [{ q: X('How many lines of symmetry does a square have?'), a: X('4.') },
        { q: X('What is the order of rotational symmetry of an equilateral triangle?'), a: X('3.') },
        { q: X('Does the letter H have line symmetry?'), a: X('Yes, two lines: one across and one down.') }],
    },
  },
  // ---------------------------------------------------------------- Class 7 Ch 7: three sticks
  {
    id: 'w7_three_sticks', subj: 'maths', cls: 7, ch: C7l, world: true, place: 'field', table: false,
    title: X('Three sticks: when do they make a triangle?'),
    aim: X('To change the length of one stick with your own hand and find out when three sticks can meet to make a triangle, and what its angles add up to.'),
    kind: X('Triangle inequality and angle sum'),
    setup(K) {
      const ts = K.add(MW14.threeSticks(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      ts.camView = { p: V3(K, 0.5, 3.4, 0.8), t: V3(K, 0.5, 0, -2.4) };
      ts.words = () => [tl(K, X('makes a triangle')), tl(K, X('ends do not meet')), tl(K, X('lies flat'))]; ts.relabel(); ts.seen = { ok: false, bad: false };
      const fin = { both: once(() => K.lab.emit('slide', { obj: ts.id })) };
      MW14.bindStickHands(ts, knob, K.app, { slide: 1 }, { both: () => fin.both() });
      return { ts, knob, fin };
    },
    steps: [
      { do: X('Three sticks lie on the ground: AB is 1.5 m and the stick from A is 1 m. The stick from B can be any length.'), target: 'ts',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ts.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('With the third stick 1.3 m long, the free ends meet at C: a triangle.') },
      { do: X('Slide the handle to make the third stick longer and shorter.'), target: 'ts',
        act: async (K, o) => { for (const c of [2.0, 2.8, 1.3, 0.3, 1.3]) { const c0 = o.ts.c; await K.tween(0.9, (k) => o.ts.setC(c0 + (c - c0) * ease(k))); o.ts.setC(c); await K.sleep(0.4); } o.fin.both(); },
        ev: { type: 'slide' }, see: X('Longer than 2.5 m or shorter than 0.5 m, the ends cannot meet (red gap). In between, they always make a triangle.') },
      { do: X('What happens at exactly 2.5 m?'), target: 'ts',
        act: async (K, o) => { o.ts.setC(2.5); K.lab.emit('flat', { obj: o.ts.id }); await K.sleep(2); },
        ev: { type: 'flat' }, see: X('The sticks only just reach, lying flat in one straight line: no space inside, so no real triangle.') },
      { do: X('Write the rule.'), target: 'ts',
        act: async (K, o) => { o.ts.setC(1.3); K.lab.emit('rule', { obj: o.ts.id }); o.ts.say(['1.5 − 1 < c < 1.5 + 1', '0.5 m < c < 2.5 m'], ['#ffffff', '#ffd23f']); await K.sleep(2); },
        ev: { type: 'rule' }, see: X('Any two sides of a triangle together must be longer than the third side. So the third side is more than the difference and less than the sum of the other two.') },
      { do: X('Measure the three angles of this triangle.'), target: 'ts',
        act: async (K, o) => { fresh(K); const [x, y, z] = o.ts.angles; o.ts.say([`${x}° + ${y}° + ${z}° = 180°`], OK); K.lab.emit('angles', { obj: o.ts.id }); await K.sleep(2); },
        ev: { type: 'angles' }, see: X('Whatever the shape, the three angles of a triangle add up to 180°.') },
    ],
    eq: { word: 'Triangle inequality', sym: '|a − b| < c < a + b' },
    result: {
      obs: X('With sticks of 1.5 m and 1 m, the third stick made a triangle only when it was between 0.5 m and 2.5 m. The angles of the triangle added up to 180°.'),
      concl: X('Three lengths make a triangle only if each is less than the sum of the other two. The angles of every triangle add up to 180°.'),
      safety: X('Carry long sticks pointing down, away from other people.'),
      viva: [{ q: X('Can 3 cm, 4 cm and 8 cm make a triangle?'), a: X('No: 3 + 4 = 7 is less than 8.') },
        { q: X('Two sides are 5 cm and 9 cm. Between what lengths is the third side?'), a: X('Between 4 cm and 14 cm.') },
        { q: X('Two angles of a triangle are 50° and 60°. Find the third.'), a: X('70°.') }],
    },
  },
  // ---------------------------------------------------------------- Class 8 Ch 1: a stack of boxes
  {
    id: 'w8_cube_stack', subj: 'maths', cls: 8, ch: C8c, world: true, place: 'quad', table: false,
    title: X('Building cubes from boxes'),
    aim: X('To stack boxes into bigger and bigger cubes with your own hand, count them, and see a number that is both a square and a cube.'),
    kind: X('Squares, cubes and their roots'),
    setup(K) {
      const cs = K.add(MW14.cubeStack(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      cs.camView = { p: V3(K, 0.45, 1.9, 1.2), t: V3(K, 0.45, 0.45, -2.0) };
      MW14.bindCubeHands(cs, lever, K.app, { grow: 1 }, { grow: () => K.lab.emit('grow', { obj: cs.id }) });
      return { cs, lever };
    },
    steps: [
      { do: X('One box stands on the ground: a 1 × 1 × 1 cube.'), target: 'cs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each push of the lever adds a new layer of boxes on three sides to make the next cube.') },
      { do: X('Push the lever three times to build cubes of side 2, 3 and 4.'), target: 'cs',
        act: async (K, o) => { while (o.cs.n < 4) { o.cs.setN(o.cs.n + 1); await K.sleep(1.0); } K.lab.emit('grow', { obj: o.cs.id }); },
        ev: { type: 'grow' }, see: X('1, 8, 27, 64 boxes: these are cube numbers, 1³, 2³, 3³ and 4³.') },
      { do: X('How many boxes did each new layer need?'), target: 'cs',
        act: async (K, o) => { o.cs.say(['8 − 1 = 7', '27 − 8 = 19', '64 − 27 = 37'], ['#ff8a5a', '#7ad0ff', '#8be07a']); K.lab.emit('layers', { obj: o.cs.id }); await K.sleep(2); },
        ev: { type: 'layers' }, see: X('7, 19 and 37 boxes. Cubes grow much faster than squares.') },
      { do: X('Now lay all 64 boxes flat on the ground.'), target: 'cs',
        act: async (K, o) => { await K.tween(2.5, (k) => o.cs.setFlat(k)); o.cs.setFlat(1); o.cs.say(['64 = 8 × 8 = 8²', '64 = 4 × 4 × 4 = 4³'], ['#ffd23f', OK]); K.lab.emit('flat', { obj: o.cs.id }); await K.sleep(1.5); },
        ev: { type: 'flat' }, see: X('They make an 8 × 8 square. So 64 is a square (8²) and a cube (4³): √64 = 8 and ∛64 = 4.') },
    ],
    eq: { word: 'Square and cube', sym: '64 = 8² = 4³' },
    result: {
      obs: X('Cubes of side 1, 2, 3 and 4 needed 1, 8, 27 and 64 boxes. The 64 boxes also made an 8 × 8 square.'),
      concl: X('A cube number n³ counts the boxes in an n × n × n cube, and a square number n² counts the tiles in an n × n square. Some numbers, like 64 and 729, are both.'),
      safety: X('Do not stack boxes higher than your chest.'),
      viva: [{ q: X('What is 5³?'), a: X('125.') },
        { q: X('What is the cube root of 1000?'), a: X('10.') },
        { q: X('Name the smallest number, other than 1, that is both a square and a cube.'), a: X('64.') }],
    },
  },
  // ---------------------------------------------------------------- Class 8 Ch 6: garden beds
  {
    id: 'w8_garden_beds', subj: 'maths', cls: 8, ch: C8d, topic: 'algebra', world: true, place: 'farm', table: false,
    title: X('Garden beds: multiplying by breaking up'),
    aim: X('To lay paths across a garden with your own hand, cut it into four beds, and see why 23 × 14 = (20 + 3)(10 + 4).'),
    kind: X('Distributive property and identities'),
    setup(K) {
      const gb = K.add(MW14.gardenBeds(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      gb.camView = { p: V3(K, 0.5, 4.2, 1.0), t: V3(K, 0.5, 0, -2.6) };
      MW14.bindGardenHands(gb, lever, K.app, { cut: 1 }, { cut: () => K.lab.emit('cut', { obj: gb.id }) });
      return { gb, lever };
    },
    steps: [
      { do: X('This garden is 23 m long and 14 m wide. Each small square is 1 m × 1 m. What is its area?'), target: 'gb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.gb.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Counting 322 squares one by one would take a long time.') },
      { do: X('Push the lever to lay a path after 20 m, and again to lay a path after 10 m.'), target: 'gb',
        act: async (K, o) => { while (o.gb.cuts < 2) { o.gb.cut1(); await K.sleep(0.9); } K.lab.emit('cut', { obj: o.gb.id }); },
        ev: { type: 'cut' }, see: X('The garden is now four beds: 20 × 10, 3 × 10, 20 × 4 and 3 × 4.') },
      { do: X('Find the area of each bed and add them.'), target: 'gb',
        act: async (K, o) => { o.gb.areas(); o.gb.say(['200 + 30 + 80 + 12 = 322', '(20 + 3)(10 + 4) = 322'], [OK, '#ffd23f']); K.lab.emit('add', { obj: o.gb.id }); await K.sleep(2); },
        ev: { type: 'add' }, see: X('Each part of one side multiplies each part of the other side: (a + b)(c + d) = ac + bc + ad + bd.') },
      { do: X('Now a square garden, 13 m by 13 m, cut after 10 m both ways.'), target: 'gb',
        act: async (K, o) => { o.gb.build(13, 13, 10, 10, 2); o.gb.areas(); o.gb.say(['13² = 100 + 30 + 30 + 9 = 169', '(a + b)² = a² + 2ab + b²'], [OK, '#ffd23f']); K.lab.emit('square', { obj: o.gb.id }); await K.sleep(2); },
        ev: { type: 'square' }, see: X('A big square 10 × 10, a small square 3 × 3, and two equal strips 10 × 3. So (a + b)² = a² + 2ab + b².') },
    ],
    eq: { word: 'Distributive property', sym: '(a + b)(c + d) = ac + bc + ad + bd' },
    result: {
      obs: X('Cutting the 23 m × 14 m garden into four beds gave 200 + 30 + 80 + 12 = 322 m². The 13 m square gave 100 + 30 + 30 + 9 = 169 m².'),
      concl: X('Multiplication distributes over addition: breaking numbers into parts and multiplying every part by every part gives the same product. This gives identities like (a + b)² = a² + 2ab + b².'),
      safety: X('Walk only on the paths between the beds.'),
      viva: [{ q: X('Find 31 × 12 by breaking it up.'), a: X('(30 + 1)(10 + 2) = 300 + 60 + 10 + 2 = 372.') },
        { q: X('Expand (x + 5)².'), a: X('x² + 10x + 25.') },
        { q: X('Find 102² quickly.'), a: X('10000 + 400 + 4 = 10404.') }],
    },
  },
  // ---------------------------------------------------------------- Class 9 Ch 6: a field that leans
  {
    id: 'w9_lean_field', subj: 'maths', cls: 9, ch: C9m, world: true, place: 'khet', table: false,
    title: X('A field that leans: same area, different perimeter'),
    aim: X('To slide one side of a parallelogram field with your own hand, see that its area stays the same while its perimeter changes, and find the area of a triangle with Heron’s formula.'),
    kind: X('Areas of parallelograms and triangles'),
    setup(K) {
      const lf = K.add(MW14.leanField(), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      lf.camView = { p: V3(K, 0.9, 4.6, 1.4), t: V3(K, 0.9, 0, -2.5) };
      lf.words = () => [tl(K, X('area')), tl(K, X('perimeter'))]; lf.relabel(); lf.maxS = 0;
      const fin = { lean: once(() => K.lab.emit('lean', { obj: lf.id })) };
      MW14.bindLeanHands(lf, knob, K.app, { lean: 1 }, { lean: () => fin.lean() });
      return { lf, knob, fin };
    },
    steps: [
      { do: X('This field is a rectangle, 4 m by 2 m, drawn on 1 m squares.'), target: 'lf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.lf.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Its area is 4 × 2 = 8 m² and its perimeter is 12 m.') },
      { do: X('Slide the handle to push the far side sideways, keeping it 2 m away.'), target: 'lf',
        act: async (K, o) => { const s0 = o.lf.s; await K.tween(2.5, (k) => o.lf.setS(s0 + (2.5 - s0) * ease(k))); o.lf.setS(2.5); o.fin.lean(); await K.sleep(0.5); },
        ev: { type: 'lean' }, see: X('It becomes a parallelogram. The perimeter grows, but the area stays 8 m²: same base, same height.') },
      { do: X('Why does the area not change? Cut off the triangle at the left end.'), target: 'lf',
        act: async (K, o) => { await K.tween(2, (k) => o.lf.setMove(k)); o.lf.setMove(1); K.lab.emit('move', { obj: o.lf.id }); await K.sleep(1); },
        ev: { type: 'move' }, see: X('Moved to the right end, it fits exactly and makes the rectangle again: area = base × height.') },
      { do: X('Draw a diagonal of the parallelogram.'), target: 'lf',
        act: async (K, o) => { o.lf.showHalf(); o.lf.say(['½ × 4 × 2 = 4 m²'], '#ff9a7a'); K.lab.emit('half', { obj: o.lf.id }); await K.sleep(2); },
        ev: { type: 'half' }, see: X('The diagonal cuts it into two equal triangles, each ½ × base × height = 4 m².') },
      { do: X('A triangular plot has sides 13 m, 14 m and 15 m, but no height is given.'), target: 'lf',
        act: async (K, o) => { o.lf.showHeron(); o.lf.say(['s = (13 + 14 + 15) ÷ 2 = 21', '√(21 × 8 × 7 × 6) = 84 m²'], ['#ffffff', OK]); K.lab.emit('heron', { obj: o.lf.id }); await K.sleep(2); },
        ev: { type: 'heron' }, see: X('Heron’s formula uses only the sides: area = √(s(s − a)(s − b)(s − c)), where s is half the perimeter. Here it is 84 m².') },
    ],
    eq: { word: 'Heron’s formula', sym: 'A = √(s(s − a)(s − b)(s − c))' },
    result: {
      obs: X('Leaning the field kept its area at 8 m² while its perimeter grew. A cut-off triangle turned it back into the rectangle, a diagonal made two 4 m² triangles, and the 13–14–15 plot had an area of 84 m².'),
      concl: X('Parallelograms with the same base and height have the same area, base × height, though their perimeters differ. A triangle is half of such a parallelogram, and Heron’s formula finds its area from its three sides.'),
      safety: X('Keep to the field’s edges when measuring.'),
      viva: [{ q: X('Find the area of a parallelogram with base 6 m and height 3 m.'), a: X('18 m².') },
        { q: X('Find the area of a triangle with sides 3 m, 4 m and 5 m by Heron’s formula.'), a: X('s = 6, √(6 × 3 × 2 × 1) = 6 m².') },
        { q: X('Do two shapes with the same area always have the same perimeter?'), a: X('No.') }],
    },
  },
  // ---------------------------------------------------------------- Class 9 Ch 7: a big spinner
  {
    id: 'w9_spinner', subj: 'maths', cls: 9, ch: C9p, world: true, place: 'quad', table: false,
    title: X('A big spinner: what chance of red?'),
    aim: X('To spin a big spinner many times with your own hand, keep count of red, and see the experimental probability come close to the theoretical one.'),
    kind: X('Experimental and theoretical probability'),
    setup(K) {
      const bs = K.add(MW14.bigSpinner(), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      bs.camView = { p: V3(K, 0.6, 3.0, 0.8), t: V3(K, 0.6, 0.2, -2.3) };
      bs.words = () => [tl(K, X('spins')), tl(K, X('red'))]; bs.relabel();
      MW14.bindSpinHands(bs, lever, K.app, { spin: 1 }, { all: () => K.lab.emit('spin', { obj: bs.id }) });
      return { bs, lever };
    },
    steps: [
      { do: X('The spinner has four equal parts, and one of them is red.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'look' }, see: X('Each push of the lever spins it many times and counts how often it stops on red.') },
      { do: X('Push the lever three times: 10 spins, then up to 50, then up to 200.'), target: 'bs',
        act: async (K, o) => { while (o.bs.n < 200) { o.bs.next(); await waitFor(K, () => !o.bs.busy); await K.sleep(0.3); } K.lab.emit('spin', { obj: o.bs.id }); },
        ev: { type: 'spin' }, see: X('Red came 3 times in 10 (0.30), 11 in 50 (0.22) and 49 in 200 (0.245).') },
      { do: X('What does the shape of the spinner say?'), target: 'bs',
        act: async (K, o) => { o.bs.say(['P(red) = 1/4 = 0.25'], OK); K.lab.emit('theory', { obj: o.bs.id }); await K.sleep(2); },
        ev: { type: 'theory' }, see: X('Red is 1 of 4 equally likely parts, so P(red) = 1/4 = 0.25. The more spins, the closer the count comes to it (green line).') },
      { do: X('Now make red half of the spinner and spin it 200 times.'), target: 'bs',
        act: async (K, o) => { o.bs.reset(0.5, 20); while (o.bs.n < 200) { o.bs.next(); await waitFor(K, () => !o.bs.busy); } K.lab.emit('half', { obj: o.bs.id }); await K.sleep(1); },
        ev: { type: 'half' }, see: X('Red came about 100 times in 200: close to 1/2. A bigger red part makes red more likely.') },
    ],
    eq: { word: 'Probability', sym: 'P(E) = favourable outcomes ÷ all outcomes' },
    result: {
      obs: X('With one red quarter, the share of red went 0.30, 0.22, 0.245 as spins went up to 200, close to 0.25. With red as half, it came near 0.5.'),
      concl: X('Experimental probability is the share of trials in which an event happens; with many trials it comes close to the theoretical probability, which for equally likely outcomes is favourable outcomes ÷ all outcomes.'),
      safety: X('Stand clear of the arrow while it spins.'),
      viva: [{ q: X('What is the probability of getting a 6 on a fair die?'), a: X('1/6.') },
        { q: X('A coin is tossed 100 times and shows heads 47 times. What is the experimental probability of heads?'), a: X('0.47.') },
        { q: X('Can a probability be more than 1?'), a: X('No; it is always between 0 and 1.') }],
    },
  },
];
