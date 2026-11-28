// DUET Maths Lab 360, Class 5 (Maths Mela), batch J6: coconut saplings in rows, a fold-and-cut paper design, Nani's
// quilt (area and border), a 50 m race with a stopwatch, a frog and a rabbit on a number track, a bus on a village map,
// and a pictograph of mangoes sold.
import { DICT } from './exp_i18n.js';
import { DICT_J6 } from './exp_i18n_j6.js';
import * as MW from './mathworld.js';
import * as MWJ from './mathworld_j6.js';
Object.assign(DICT, DICT_J6);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const C5i = N('Ch 9 · Coconut Farm', 'अध्याय 9 · नारियल का बागान', 'Ch 9 · Nariyal ka baagaan');
const C5j = N('Ch 10 · Symmetrical Designs', 'अध्याय 10 · सममित डिज़ाइन', 'Ch 10 · Symmetrical designs');
const C5k = N('Ch 11 · Grandmother’s Quilt', 'अध्याय 11 · दादी की रज़ाई', 'Ch 11 · Daadi ki razaai');
const C5l = N('Ch 12 · Racing Seconds', 'अध्याय 12 · सेकंडों की दौड़', 'Ch 12 · Secondon ki daud');
const C5m = N('Ch 13 · Animal Jumps', 'अध्याय 13 · जानवरों की छलाँगें', 'Ch 13 · Jaanwaron ki chhalaangein');
const C5n = N('Ch 14 · Maps and Locations', 'अध्याय 14 · नक्शे और स्थान', 'Ch 14 · Nakshe aur sthaan');
const C5o = N('Ch 15 · Data Through Pictures', 'अध्याय 15 · चित्रों से आँकड़े', 'Ch 15 · Chitron se aankde');

export const EXPERIMENTS_J6 = [
  {
    id: 'w5_coconut_rows', subj: 'maths', cls: 5, ch: C5i, topic: 'numbers', world: true, place: 'farm', table: false,
    title: X('Coconut saplings in rows: 12 × 15'),
    aim: X('To plant coconut saplings in rows of 15 with your own hand, multiply 12 × 15 by breaking it up, and regroup them in rows of 20.'),
    kind: X('Multiplication and division'),
    setup(K) {
      const cn = K.add(MWJ.coconutNursery({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      cn.camView = { p: V3(K, 0.0, 2.1, 1.3), t: V3(K, 0.0, 0.45, -3.2) };
      MWJ.bindCoconutHands(cn, knob, K.app, { plant: 1 }, { all: () => K.lab.emit('plant', { obj: cn.id }) });
      return { cn, knob };
    },
    steps: [
      { do: X('At the coconut farm, saplings are planted in the nursery bed, 15 in each row.'), target: 'cn',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cn.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The grown coconut trees behind once started as saplings like these.') },
      { do: X('Slide the handle to plant 12 rows.'), target: 'cn',
        act: async (K, o) => { await K.tween(4, (k) => o.cn.setK(k)); K.lab.emit('plant', { obj: o.cn.id }); },
        ev: { type: 'plant' }, see: X('12 rows of 15 saplings: 12 × 15 = 180.') },
      { do: X('Break 15 into 10 and 5 to multiply.'), target: 'cn',
        act: async (K, o) => { o.cn.say(['12 × 15 = 12 × 10 + 12 × 5', '= 120 + 60 = 180'], ['#ffd23f', OK]); K.lab.emit('split', { obj: o.cn.id }); await K.sleep(2.5); },
        ev: { type: 'split' }, see: X('120 + 60 = 180 saplings.') },
      { do: X('The farmer wants rows of 20 instead. How many rows will there be?'), target: 'cn',
        act: async (K, o) => { await new Promise((r) => o.cn.regroup(r)); K.lab.emit('regroup', { obj: o.cn.id }); await K.sleep(1); },
        ev: { type: 'regroup' }, see: X('180 ÷ 20 = 9 rows of 20: the same saplings, grouped another way.') },
    ],
    eq: { word: 'Multiplication', sym: '12 × 15 = 180 · 180 ÷ 20 = 9' },
    result: { obs: X('Twelve rows of 15 saplings made 180. Moved into rows of 20, they made 9 rows.'),
      concl: X('Multiplying by a 2-digit number is easier when it is broken into tens and ones. Division tells how many rows of a given size.'),
      safety: X('Coconuts can fall from tall trees: do not stand right under them.'),
      viva: [{ q: X('What is 12 × 15?'), a: X('180.') }, { q: X('180 saplings in rows of 18: how many rows?'), a: X('10.') }, { q: X('What is 14 × 15?'), a: X('210.') }] },
  },
  {
    id: 'w5_fold_cut', subj: 'maths', cls: 5, ch: C5j, topic: 'geometry', world: true, place: 'room', table: true,
    title: X('Fold twice, cut once: a symmetrical design'),
    aim: X('To fold a square of paper twice and cut it with your own hand, then open it and find its lines of symmetry and its turn symmetry.'),
    kind: X('Symmetry: lines and turns'),
    setup(K) {
      const fc = K.add(MWJ.foldCutPaper({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      fc.camView = { p: V3(K, 0.0, 0.42, 0.26), t: V3(K, 0.0, 0.0, -0.06) };
      MWJ.bindCutHands(fc, lever, K.app, { cut: 1 }, { all: () => K.lab.emit('cut', { obj: fc.id }) });
      return { fc, lever };
    },
    steps: [
      { do: X('A square of kite paper. We will fold it in half twice and cut the folded corner once.'), target: 'fc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.fc.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('One square, no holes yet.') },
      { do: X('Push the lever three times: fold, fold again, and cut.'), target: 'fc',
        act: async (K, o) => { while (o.fc.n < 3) { if (!o.fc.busy) o.fc.step(); await K.sleep(0.2); } await waitIdle(K, o.fc); K.lab.emit('cut', { obj: o.fc.id }); },
        ev: { type: 'cut' }, see: X('Two folds make 4 layers; one cut goes through all 4 at once.') },
      { do: X('Open the paper. Where are its lines of symmetry?'), target: 'fc',
        act: async (K, o) => { await new Promise((r) => o.fc.unfold(r)); o.fc.showLines(); K.lab.emit('lines', { obj: o.fc.id }); await K.sleep(2); },
        ev: { type: 'lines' }, see: X('The cut is repeated 4 times. Both fold lines are lines of symmetry, and so are the two diagonals here: 4 lines.') },
      { do: X('Turn the design a quarter turn.'), target: 'fc',
        act: async (K, o) => { await new Promise((r) => o.fc.quarter(r)); K.lab.emit('turn', { obj: o.fc.id }); await K.sleep(1); },
        ev: { type: 'turn' }, see: X('It looks exactly the same: the design has turn symmetry too.') },
    ],
    eq: { word: 'Symmetry', sym: '2 folds → 4 layers → 1 cut repeated 4 times' },
    result: { obs: X('After two folds and one cut, the opened paper showed the same cut in all four quarters, and it looked the same after a quarter turn.'),
      concl: X('A fold line becomes a line of symmetry: one half is the mirror image of the other. A design that looks the same after part of a turn has turn symmetry.'),
      safety: X('Use round-tipped scissors and cut away from your fingers.'),
      viva: [{ q: X('How many layers after folding a paper in half twice?'), a: X('4.') }, { q: X('How many lines of symmetry does a square have?'), a: X('4.') }, { q: X('Does the letter S have a line of symmetry?'), a: X('No, but it has half-turn symmetry.') }] },
  },
  {
    id: 'w5_quilt_area', subj: 'maths', cls: 5, ch: C5k, topic: 'measure', world: true, place: 'room', table: true,
    title: X('Nani’s quilt: area and border'),
    aim: X('To stitch square patches into a quilt with your own hand, count its area in squares, measure its lace border, and see that the same area can need a different border.'),
    kind: X('Area and perimeter'),
    setup(K) {
      const nq = K.add(MWJ.nanisQuilt({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      nq.camView = { p: V3(K, 0.0, 0.62, 0.42), t: V3(K, 0.0, 0.0, -0.08) };
      MWJ.bindQuiltHands(nq, knob, K.app, { stitch: 1 }, { all: () => K.lab.emit('stitch', { obj: nq.id }) });
      return { nq, knob };
    },
    steps: [
      { do: X('Nani is making a quilt from square patches. Each patch is 10 cm on every side.'), target: 'nq',
        act: async (K, o) => { K.lab.emit('look', { obj: o.nq.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Block-printed patches wait in the basket.') },
      { do: X('Slide the handle to stitch 4 rows of 6 patches.'), target: 'nq',
        act: async (K, o) => { await K.tween(4, (k) => o.nq.setK(k)); K.lab.emit('stitch', { obj: o.nq.id }); },
        ev: { type: 'stitch' }, see: X('The area of the quilt is 4 × 6 = 24 squares.') },
      { do: X('Sew lace all round the edge, one piece for each side of a patch.'), target: 'nq',
        act: async (K, o) => { await new Promise((r) => o.nq.lace(r)); K.lab.emit('lace', { obj: o.nq.id }); await K.sleep(1); },
        ev: { type: 'lace' }, see: X('6 + 4 + 6 + 4 = 20 pieces of 10 cm: the border (perimeter) is 200 cm, 2 m.') },
      { do: X('Make the same 24 patches into 3 rows of 8. Is the border the same?'), target: 'nq',
        act: async (K, o) => { await new Promise((r) => o.nq.rearrange(r)); await new Promise((r) => o.nq.lace(r)); K.lab.emit('long', { obj: o.nq.id }); await K.sleep(1); },
        ev: { type: 'long' }, see: X('Same area, 24 squares, but the border is 8 + 3 + 8 + 3 = 22 pieces: 2 m 20 cm.') },
    ],
    eq: { word: 'Area and perimeter', sym: '6 × 4 = 24 squares · 6 + 4 + 6 + 4 = 20 sides' },
    result: { obs: X('A 6 by 4 quilt covered 24 squares and needed 20 pieces of lace. An 8 by 3 quilt also covered 24 squares but needed 22 pieces.'),
      concl: X('Area is the space covered (counted in squares); perimeter is the length round the edge. Shapes with the same area can have different perimeters.'),
      safety: X('Keep needles in a pincushion, never in your mouth.'),
      viva: [{ q: X('What is the area of a quilt of 5 rows of 5 patches?'), a: X('25 squares.') }, { q: X('What is its border, in patch sides?'), a: X('20.') }, { q: X('Which has a longer border, 12 × 2 or 6 × 4?'), a: X('12 × 2 (28 sides).') }] },
  },
  {
    id: 'w5_race_seconds', subj: 'maths', cls: 5, ch: C5l, topic: 'measure', world: true, place: 'field', table: false,
    title: X('A 50 m race and a stopwatch'),
    aim: X('To start a race and a stopwatch together with your own hand, read each runner’s time in seconds, and find who is fastest.'),
    kind: X('Time in seconds'),
    setup(K) {
      const rt = K.add(MWJ.raceTrack({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      rt.camView = { p: V3(K, 0.0, 1.7, 1.0), t: V3(K, 0.0, 1.0, -20) };
      MWJ.bindRaceHands(rt, lever, K.app, { go: 1 }, { all: () => K.lab.emit('race', { obj: rt.id }) });
      return { rt, lever };
    },
    steps: [
      { do: X('Asha, Ravi and Meena will run 50 m towards you. Your stopwatch counts seconds.'), target: 'rt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rt.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The finish line is just in front of you.') },
      { do: X('Push the lever to start the race and the stopwatch together.'), target: 'rt',
        act: async (K, o) => { o.rt.race(); await waitIdle(K, o.rt); K.lab.emit('race', { obj: o.rt.id }); },
        ev: { type: 'race' }, see: X('Asha crosses the line at 8 s, Ravi at 9 s and Meena at 11 s.') },
      { do: X('Who won the race?'), target: 'rt',
        act: async (K, o) => { const w = Wd(K); o.rt.say([`${w('Asha')} 8 s < ${w('Ravi')} 9 s < ${w('Meena')} 11 s`], OK); K.lab.emit('win', { obj: o.rt.id }); await K.sleep(2.5); },
        ev: { type: 'win' }, see: X('Asha: in a race, the least time wins.') },
      { do: X('How much longer did Meena take than Asha?'), target: 'rt',
        act: async (K, o) => { o.rt.say(['11 s − 8 s = 3 s'], '#ffd23f'); K.lab.emit('diff', { obj: o.rt.id }); await K.sleep(2); },
        ev: { type: 'diff' }, see: X('3 seconds longer.') },
    ],
    eq: { word: 'Seconds', sym: '60 seconds = 1 minute · fastest = least time' },
    result: { obs: X('The stopwatch read 8 s for Asha, 9 s for Ravi and 11 s for Meena over 50 m.'),
      concl: X('Short times are measured in seconds; 60 seconds make a minute. In a race the runner with the least time is the fastest.'),
      safety: X('Warm up before running, and run only in your own lane.'),
      viva: [{ q: X('How many seconds are in 1 minute?'), a: X('60.') }, { q: X('Write 75 seconds in minutes and seconds.'), a: X('1 minute 15 seconds.') }, { q: X('Who is faster, a runner taking 12 s or one taking 10 s?'), a: X('The one taking 10 s.') }] },
  },
  {
    id: 'w5_animal_jumps', subj: 'maths', cls: 5, ch: C5m, topic: 'numbers', world: true, place: 'field', table: false,
    title: X('Frog and rabbit jumps: common multiples'),
    aim: X('To make a frog jump by 3s and a rabbit by 4s on a number track with your own hand, and find where both land.'),
    kind: X('Multiples and common multiples'),
    setup(K) {
      const nt = K.add(MWJ.numberTrackJumps({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      nt.camView = { p: V3(K, 0.0, 3.3, 2.9), t: V3(K, 0.0, 0.0, -1.6) };
      MWJ.bindJumpHands5(nt, lever, K.app, { frog: 1, rabbit: 2 }, { frog: () => K.lab.emit('frog', { obj: nt.id }), rabbit: () => K.lab.emit('rabbit', { obj: nt.id }) });
      return { nt, lever };
    },
    steps: [
      { do: X('The frog jumps 3 numbers at a time; the rabbit jumps 4. Both start at 0.'), target: 'nt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.nt.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Where will each of them land?') },
      { do: X('Push the lever to make the frog jump.'), target: 'nt',
        act: async (K, o) => { while (o.nt.stage < 1) { if (!o.nt.busy && o.nt.stage === 0) o.nt.jump(); await K.sleep(0.2); } K.lab.emit('frog', { obj: o.nt.id }); },
        ev: { type: 'frog' }, see: X('3, 6, 9, 12 … 30: the frog lands on the multiples of 3.') },
      { do: X('Push the lever again for the rabbit.'), target: 'nt',
        act: async (K, o) => { while (o.nt.stage < 2) { if (!o.nt.busy && o.nt.stage === 1) o.nt.jump(); await K.sleep(0.2); } K.lab.emit('rabbit', { obj: o.nt.id }); },
        ev: { type: 'rabbit' }, see: X('4, 8, 12 … 28: the multiples of 4. Both have landed on 12 and 24.') },
      { do: X('Where do they first land on the same number?'), target: 'nt',
        act: async (K, o) => { o.nt.say(['12 = 3 × 4', '12, 24, 36 …'], [OK, '#ffd23f']); K.lab.emit('common', { obj: o.nt.id }); await K.sleep(2.5); },
        ev: { type: 'common' }, see: X('On 12: the smallest common multiple of 3 and 4. The next ones are 24, 36 …') },
    ],
    eq: { word: 'Common multiples', sym: '3: 3, 6, 9, 12 … · 4: 4, 8, 12 … · both: 12, 24' },
    result: { obs: X('The frog landed on 3, 6, 9 … 30 and the rabbit on 4, 8, 12 … 28. Both landed on 12 and 24.'),
      concl: X('Numbers we land on jumping by 3 are multiples of 3. Numbers in both lists are common multiples; the smallest of 3 and 4 is 12.'),
      safety: X('Look where you jump when you play hopping games.'),
      viva: [{ q: X('Name a common multiple of 2 and 5.'), a: X('10 (or 20, 30 …).') }, { q: X('Is 18 a multiple of 4?'), a: X('No.') }, { q: X('Smallest common multiple of 4 and 6?'), a: X('12.') }] },
  },
  {
    id: 'w5_village_map', subj: 'maths', cls: 5, ch: C5n, topic: 'geometry', world: true, place: 'quad', table: true,
    title: X('Driving a bus on a village map'),
    aim: X('To move a toy bus along the roads of a map with your own hand, following directions, and use the map’s scale to find real distances.'),
    kind: X('Maps, directions and scale'),
    setup(K) {
      const vm = K.add(MWJ.villageMap({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      vm.camView = { p: V3(K, 0.0, 0.62, 0.38), t: V3(K, 0.0, 0.0, -0.1) };
      MWJ.bindMapHands(vm, lever, K.app, { drive: 1 }, { all: () => K.lab.emit('drive', { obj: vm.id }) });
      return { vm, lever };
    },
    steps: [
      { do: X('This is a map of a village. North is towards the top. One block on the map is 100 m on the ground.'), target: 'vm',
        act: async (K, o) => { K.lab.emit('look', { obj: o.vm.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The bus waits at the corner of the school.') },
      { do: X('Push the lever to drive the bus: 2 blocks North, then 3 blocks East.'), target: 'vm',
        act: async (K, o) => { while (o.vm.n < 5) { if (!o.vm.busy) o.vm.move1(); await K.sleep(0.2); } await waitIdle(K, o.vm); K.lab.emit('drive', { obj: o.vm.id }); },
        ev: { type: 'drive' }, see: X('The bus reaches the post office.') },
      { do: X('How far did the bus really go?'), target: 'vm',
        act: async (K, o) => { o.vm.say(['2 + 3 = 5 × 100 m = 500 m'], OK); K.lab.emit('far', { obj: o.vm.id }); await K.sleep(2.5); },
        ev: { type: 'far' }, see: X('5 blocks of 100 m: 500 metres.') },
      { do: X('In which direction is the temple from the school?'), target: 'vm',
        act: async (K, o) => { o.vm.showTemple(); o.vm.say([Wd(K)('West') + ' · 200 m'], OK); K.lab.emit('temple', { obj: o.vm.id }); await K.sleep(2.5); },
        ev: { type: 'temple' }, see: X('West: the temple is 2 blocks, 200 m, to the west of the school.') },
    ],
    eq: { word: 'Map scale', sym: '1 block = 100 m · 5 blocks = 500 m' },
    result: { obs: X('Going 2 blocks North and 3 blocks East took the bus from the school to the post office: 5 blocks, 500 m.'),
      concl: X('A map shows places from above, with North marked. Its scale changes map distances into real ones: here 1 block stands for 100 m.'),
      safety: X('Cross roads only at a zebra crossing, looking both ways.'),
      viva: [{ q: X('If you face North, which way is East?'), a: X('To your right.') }, { q: X('How far are 7 blocks?'), a: X('700 m.') }, { q: X('Which direction is opposite to North?'), a: X('South.') }] },
  },
  {
    id: 'w5_mango_pictograph', subj: 'maths', cls: 5, ch: C5o, topic: 'data', world: true, place: 'room', table: true,
    title: X('A pictograph of mangoes sold'),
    aim: X('To put up a fruit seller’s pictograph with your own hand, read it using its key, and find totals and the biggest day.'),
    kind: X('Pictographs'),
    setup(K) {
      const mp = K.add(MWJ.mangoPictograph({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      mp.camView = { p: V3(K, 0.0, 0.62, 0.4), t: V3(K, 0.0, 0.0, -0.08) };
      MWJ.bindPictoHands(mp, lever, K.app, { add: 1 }, { all: () => K.lab.emit('rows', { obj: mp.id }) });
      return { mp, lever };
    },
    steps: [
      { do: X('A fruit seller shows the mangoes she sold on a board. Key: one mango picture stands for 10 mangoes.'), target: 'mp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mp.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Pictures save drawing every single mango.') },
      { do: X('Push the lever to put up each day’s row.'), target: 'mp',
        act: async (K, o) => { while (o.mp.n < 4) { if (!o.mp.busy) o.mp.addRow(); await K.sleep(0.2); } await waitIdle(K, o.mp); K.lab.emit('rows', { obj: o.mp.id }); },
        ev: { type: 'rows' }, see: X('Monday 4, Tuesday 2½, Wednesday 6 and Thursday 3 pictures.') },
      { do: X('Tuesday has two and a half pictures. How many mangoes is that?'), target: 'mp',
        act: async (K, o) => { o.mp.say(['2 × 10 + 5 = 25'], OK); K.lab.emit('half', { obj: o.mp.id }); await K.sleep(2.5); },
        ev: { type: 'half' }, see: X('A half picture is half of 10, that is 5: 25 mangoes.') },
      { do: X('Which day sold the most, and how many were sold in all?'), target: 'mp',
        act: async (K, o) => { o.mp.say(['40 + 25 + 60 + 30 = 155'], OK); K.lab.emit('total', { obj: o.mp.id }); await K.sleep(2.5); },
        ev: { type: 'total' }, see: X('Wednesday sold the most, 60. In all 155 mangoes were sold.') },
    ],
    eq: { word: 'Pictograph', sym: '1 picture = 10 · ½ picture = 5' },
    result: { obs: X('The rows showed 4, 2½, 6 and 3 pictures: 40, 25, 60 and 30 mangoes, 155 in all.'),
      concl: X('A pictograph uses one picture for a fixed number of things (the key). Multiply the pictures by the key; a part of a picture is that part of the key.'),
      safety: X('Wash fruit before you eat it.'),
      viva: [{ q: X('With the same key, how many mangoes do 5 pictures show?'), a: X('50.') }, { q: X('How would you show 35 mangoes?'), a: X('3½ pictures.') }, { q: X('Which day sold the fewest?'), a: X('Tuesday (25).') }] },
  },
];
