// DUET Science Lab 360, biology in real places, batch BW3: nature and ecosystems. Adaptations at a pond, in a desert and in
// a snowy forest; the water cycle; how plants and animals keep the air in balance; microbes in curd and in yeast; seeds
// carried by wind, water and animals; bees and flowers; and soil washed off a slope when its plants are gone. In every
// activity the student does each step with their own hand, and what happens follows what they did.
import { DICT } from './exp_i18n.js';
import { DICT_BW3 } from './exp_i18n_bw3.js';
import * as MW from './mathworld.js';
import * as BW from './bioworld1.js';
import * as B4 from './bioworld4.js';
Object.assign(DICT, DICT_BW3);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const OK = '#8be07a', WARN = '#ffb46b';
const BY = { y: 0.9 }; // things put on the table
// run a scene action that calls back when it is over (or at once if it cannot start now)
const run = (f) => new Promise((r) => { if (f(r) === false) r(); });
// the point of view follows the step (views: step index → view)
const camBy = (it, app, views) => { const u0 = it.update; let last = -1; it.update = (dt, t) => { const i = app.runner.i; if (i !== last) { last = i; const v = views[i]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; }; // (an action may still change the view within its step)
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
const C6d = N('Ch 2 · Diversity in the Living World', 'अध्याय 2 · सजीव जगत में विविधता', 'Ch 2 · Living world mein diversity');
const C6w = N('Ch 8 · A Journey through States of Water', 'अध्याय 8 · जल की अवस्थाओं की एक यात्रा', 'Ch 8 · Paani ki States ka Safar');
const C7p = N('Ch 10 · Life Processes in Plants', 'अध्याय 10 · पौधों में जैविक प्रक्रम', 'Ch 10 · Paudhon mein life processes');
const C8m = N('Ch 2 · The Invisible Living World: Beyond Our Naked Eye', 'अध्याय 2 · अदृश्य सजीव जगत: आँखों से परे', 'Ch 2 · Invisible living world: aankhon se pare');
const C8h = N('Ch 12 · How Nature Works in Harmony', 'अध्याय 12 · प्रकृति मिल-जुलकर कैसे काम करती है', 'Ch 12 · Nature mil-julkar kaise kaam karti hai');

export const EXPERIMENTS_BW3 = [
  // ============================================================ Class 6 · adaptations: the pond
  {
    id: 'bw6_pond_adapt', subj: 'biology', cls: 6, ch: C6d, world: true, place: 'pond', table: true, topic: 'living',
    title: X('Living in water: test a lotus leaf and stalk by hand'),
    aim: X('To pour water on a lotus leaf and a peepal leaf, cut a lotus stalk and push it under water with your own hand, and find out how pond plants and animals are suited to living in water.'),
    kind: X('Adaptations of aquatic plants and animals'),
    setup(K) {
      const W = Wd(K);
      const pond = K.add(BW.pondScene({ W }), 0, 0, { y: 0 });
      const pa = K.add(B4.pondAdapt({ W }), 0, 0, { y: 0 });
      const lota = K.add(BW.organism(null, N('Lota of water', 'पानी का लोटा', 'Paani ka lota'), { group: B4.lota(), hitR: 0.08, hitY: 0.07 }), -0.85, -0.55, BY);
      const knife = K.add(BW.organism(null, N('Knife', 'चाकू', 'Chaaku'), { group: B4.knife(), hitR: 0.07, hitY: 0.012 }), 0.32, -0.46, BY);
      const stalk = K.add(BW.organism(null, N('Lotus stalk', 'कमल की डंडी', 'Kamal ki dandi'), { group: B4.lotusStalk(), hitR: 0.07, hitY: 0.012 }), 0.2, -0.62, BY);
      const fin = { pour1: emit(K, pa, 'pour1'), pour2: emit(K, pa, 'pour2'), cut: emit(K, pa, 'cut'), float: emit(K, pa, 'float') };
      B4.bindPondAdapt(pa, { lota, knife, stalk }, K.app, { pour1: 1, pour2: 2, cut: 3, float: 4 }, {
        pour1: () => { pa.say([Wd(K)('Lotus leaf: water rolls off in beads')], OK); fin.pour1(); }, pour2: () => { pa.say([Wd(K)('Peepal leaf: water spreads and wets it')], WARN); fin.pour2(); },
        cut: () => { pa.say([Wd(K)('Cut stalk: full of air channels')], OK); fin.cut(); }, float: () => { pa.say([Wd(K)('The stalk floats')], OK); fin.float(); } });
      camBy(pa, K.app, [pa.views.pond, pa.views.lotus, pa.views.peepal, pa.views.stalk, pa.views.bowl, pa.views.bowl]);
      return { pond, pa, lota, knife, stalk, fin };
    },
    steps: [
      { do: X('A village pond. Look at what lives in and around it: lotus leaves held up over the water, lilies floating on it, fish, a frog, snails and a water strider.'), target: 'pa',
        act: async (K, o) => { K.lab.emit('look', { obj: o.pa.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Plants and animals that live in water have special features that suit them to life there. These are called adaptations.') },
      { do: X('Pick up the lota and pour a little water on the lotus leaf.'), target: 'lota',
        act: async (K, o) => { await run((r) => o.pa.pour(o.lota, 'lotus', r)); o.pa.say([Wd(K)('Lotus leaf: water rolls off in beads')], OK); o.fin.pour1(); }, ev: { type: 'pour1' },
        see: X('The water does not wet the leaf at all. It gathers into shiny round beads that roll about and slide off. The leaf stays dry.'),
        why: X('The upper side of a lotus leaf has a waxy coating. Water cannot stick to it, so the leaf does not rot and its pores, which are on the upper side, stay open to the air.') },
      { do: X('Now pour a little water on the peepal leaf, a leaf of a land plant.'), target: 'lota',
        act: async (K, o) => { await run((r) => o.pa.pour(o.lota, 'peepal', r)); o.pa.say([Wd(K)('Peepal leaf: water spreads and wets it')], WARN); o.fin.pour2(); }, ev: { type: 'pour2' },
        see: X('Here the water spreads out in a thin film and wets the leaf.'), why: X('A land plant does not need a coat that keeps water off, because its leaves are not lying on water all the time.') },
      { do: X('Take the knife and cut across the lotus stalk. Look at the cut end.'), target: 'knife',
        act: async (K, o) => { await run((r) => o.pa.cut(o.knife, o.stalk, r)); o.pa.say([Wd(K)('Cut stalk: full of air channels')], OK); o.fin.cut(); }, ev: { type: 'cut' },
        see: X('The cut end is full of holes: air channels that run all along the stalk.'), why: X('The roots of a lotus are buried in mud under water, where there is little air. These channels carry air down to them.') },
      { do: X('Pick up the piece of stalk, push it under the water in the bowl and let it go.'), target: 'stalk',
        act: async (K, o) => { await run((r) => o.pa.sink(o.stalk, r)); o.pa.say([Wd(K)('The stalk floats')], OK); o.fin.float(); }, ev: { type: 'float' },
        see: X('It bobs back up and floats at the top.'), why: X('The air in its channels makes the stalk light. That is how lotus stalks hold their leaves and flowers up to the light, above the water.') },
      { do: X('Look closely at the small fish swimming in the bowl.'), target: 'pa',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.pa.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('Its body is smooth, slippery and pointed at both ends. It steers with its fins and tail, and its gills open and close as it breathes.'),
        why: X('A streamlined body slips through water easily. Gills take in the oxygen dissolved in water, so a fish can breathe under water all the time.') },
    ],
    eq: { word: 'Pond plants and animals', sym: 'waxy leaves · air-filled stalks · streamlined body · gills' },
    result: { obs: X('Water rolled off the lotus leaf in beads but wetted the peepal leaf. The lotus stalk was full of air channels and floated. The fish had a streamlined body, fins and gills.'),
      concl: X('Plants and animals of a pond are adapted to living in water: waxy floating leaves, stalks full of air, streamlined bodies with fins, and gills for breathing the oxygen in water.'),
      safety: X('Do not lean over a pond or go into it alone. Wash your hands after touching pond water.'),
      viva: [{ q: X('Why does water not wet a lotus leaf?'), a: X('Its upper side has a waxy coating.') }, { q: X('Why are lotus stalks full of holes?'), a: X('The air channels carry air to the roots and keep the plant light so it floats.') },
        { q: X('How does a fish breathe under water?'), a: X('With its gills, which take in oxygen dissolved in the water.') }] },
  },
  // ============================================================ Class 6 · adaptations: the desert
  {
    id: 'bw6_desert', subj: 'biology', cls: 6, ch: C6d, world: true, place: 'desert', table: true, topic: 'living',
    title: X('Life in the desert: a camel and a cactus'),
    aim: X('To measure the heat of the desert sand and the air higher up, cut a cactus stem and cover a cactus and a leafy plant with bags in the sun, all with your own hand, and find out how a camel and a cactus survive in the desert.'),
    kind: X('Adaptations of desert plants and animals'),
    setup(K) {
      const W = Wd(K);
      const ds = K.add(B4.desertScene({ W }), 0, 0, { y: 0 });
      const thermo = K.add(BW.organism(null, N('Thermometer', 'थर्मामीटर', 'Thermometer'), { group: B4.thermometer(), hitR: 0.07, hitY: 0.01 }), 0.75, -0.52, BY);
      const knife = K.add(BW.organism(null, N('Knife', 'चाकू', 'Chaaku'), { group: B4.knife(), hitR: 0.07, hitY: 0.012 }), 0.95, -0.72, BY);
      const piece = K.add(BW.organism(null, N('Piece of cactus stem', 'कैक्टस के तने का टुकड़ा', 'Cactus ke tane ka tukda'), { group: B4.cactusPiece(), hitR: 0.07, hitY: 0.02 }), 0.62, -0.78, BY);
      const bags = [-0.95, -0.78].map((x, i) => K.add(BW.organism(null, N('Polythene bag', 'पॉलीथीन की थैली', 'Polythene ki thaili'), { group: B4.foldedBag(), hitR: 0.08, hitY: 0.01 }), x, i ? -0.5 : -0.62, BY));
      const knob = K.add(MW.pullTab(), 0, -0.45);
      const e = (t) => emit(K, ds, t);
      B4.bindDesert(ds, { thermo, knife, piece, bags }, K.app, { sand: 1, hook: 2, cut: 3, bag: 4 }, { sand: e('sand'), hook: e('hook'), cut: e('cut'), bag: e('bag') });
      B4.bindTimeHands(ds, knob, K.app, { sun: 5 }, { end: e('h4') });
      camBy(ds, K.app, [ds.views.all, ds.views.sand, ds.views.hook, ds.views.piece, ds.views.table, ds.views.table]);
      return { ds, thermo, knife, piece, bags, knob, bag1: bags[0], bag2: bags[1] };
    },
    steps: [
      { do: X('Noon in the desert. Look around: hot sand and rocks, a few dry bushes, tall cacti and a camel.'), target: 'ds',
        act: async (K, o) => { o.ds.camView = o.ds.views.camel; K.lab.emit('look', { obj: o.ds.id }); await K.sleep(4); }, ev: { type: 'look' },
        see: X('Very little rain falls here. Days are very hot, nights are cold, and there is hardly any water.') },
      { do: X('Pick up the thermometer and lay it on the open sand beside the table.'), target: 'thermo',
        act: async (K, o) => { await run((r) => o.ds.putThermo(o.thermo, 'sand', r)); K.lab.emit('sand', { obj: o.ds.id }); }, ev: { type: 'sand' },
        see: X('The red line climbs to about 62 °C. The sand is hot enough to burn bare feet.') },
      { do: X('Now hang it on the hook of the pole, as high as a camel’s body.'), target: 'thermo',
        act: async (K, o) => { await run((r) => o.ds.putThermo(o.thermo, 'hook', r)); K.lab.emit('hook', { obj: o.ds.id }); }, ev: { type: 'hook' },
        see: X('Up here it reads about 41 °C: hot, but some 20 degrees cooler than the sand.'), why: X('A camel’s long legs keep its body high above the burning sand. Its broad, padded feet do not sink into the soft sand.') },
      { do: X('Cut the piece of cactus stem across with the knife.'), target: 'knife',
        act: async (K, o) => { await run((r) => o.ds.cut(o.knife, o.piece, r)); K.lab.emit('cut', { obj: o.ds.id }); }, ev: { type: 'cut' },
        see: X('Inside it is pale green, soft and wet. Drops of sticky water ooze out of the cut.'), why: X('The thick, fleshy stem of a cactus stores water. A thick waxy skin keeps the water in.') },
      { do: X('Pull a polythene bag over the leafy plant, and another over the cactus.'), target: 'bag1',
        act: async (K, o) => { for (let i = 0; i < 2; i++) if (!o.ds.bagged[i]) await new Promise((r) => o.ds.bag(o.bags[i], i, r)); K.lab.emit('bag', { obj: o.ds.id }); }, ev: { type: 'bag' },
        see: X('Both plants now stand in the sun inside clear bags.') },
      { do: X('Slide the clock on four hours, from 11 in the morning to 3 in the afternoon.'), target: 'knob',
        act: async (K, o) => { await K.tween(3, (k) => o.ds.setT(4 * k)); o.ds.setT(4); K.lab.emit('h4', { obj: o.ds.id }); }, ev: { type: 'h4' },
        see: X('The bag on the leafy plant is misted all over and drops of water run down inside it. The bag on the cactus is almost dry.'),
        why: X('Leaves give out water vapour through tiny pores. A cactus has spines instead of leaves and a waxy stem, so it loses very little water.') },
    ],
    eq: { word: 'Desert adaptations', sym: 'camel: long legs, padded feet · cactus: fleshy stem, spines, waxy skin' },
    result: { obs: X('The sand was about 62 °C but the air at a camel’s body height about 41 °C. The cactus stem was full of stored water. In four hours the leafy plant’s bag filled with water drops; the cactus bag stayed almost dry.'),
      concl: X('A camel’s long legs and padded feet and a cactus’s fleshy stem, spines and waxy skin are adaptations: they help them survive the heat and the lack of water in the desert.'),
      safety: X('Never touch a cactus with bare hands: its spines are sharp. Handle a knife with care.'),
      viva: [{ q: X('Why does a cactus have spines instead of leaves?'), a: X('Spines lose very little water, and they protect the plant from animals.') }, { q: X('How do a camel’s long legs help it?'), a: X('They keep its body away from the hot sand.') },
        { q: X('Where does a cactus store water?'), a: X('In its thick, fleshy stem.') }] },
  },
  // ============================================================ Class 6 · adaptations: the mountains
  {
    id: 'bw6_snow_trees', subj: 'biology', cls: 6, ch: C6d, world: true, place: 'snow', table: false, topic: 'living',
    title: X('Trees in the snow: why fir branches slope down'),
    aim: X('To hold a fir branch level and then sloping down with your own hand, let snow fall on it, and find out why the trees of snowy mountains are cone-shaped with sloping branches.'),
    kind: X('Adaptations of mountain plants'),
    setup(K) {
      const W = Wd(K);
      const sn = K.add(B4.snowTrees({ W }), 0, 0, { y: 0 });
      const tip = K.add(MW.pullTab(), 0, -0.5), knob = K.add(MW.pullTab(), 0.25, -0.62);
      const fin = { set: emit(K, sn, 'set'), snowed: emit(K, sn, 'snowed') };
      sn.onAng = (a) => sn.say([`${Wd(K)('Branch')}: ${Math.round(a)}° ${Wd(K)(a < 20 ? 'level' : a < 35 ? 'a little sloping' : 'sloping down')}`], '#ffffff');
      B4.bindSnow(sn, tip, knob, K.app, { flat: 1, snow1: 2, slope: 3, snow2: 4 }, { set: fin.set, snowed: (st) => { sn.say([st > 0.6 ? Wd(K)('Snow piled up: the branch bent and cracked') : st > 0.05 ? Wd(K)('Some snow stayed on the branch') : Wd(K)('The snow slid off')], st > 0.6 ? WARN : OK); fin.snowed(); } });
      sn.setAng(25); // the branch starts half-way: the student sets it level, and later sloping, by hand
      camBy(sn, K.app, [sn.views.all, sn.views.branch, sn.views.branch, sn.views.branch, sn.views.branch, sn.views.needles]);
      return { sn, tip, knob, fin };
    },
    steps: [
      { do: X('Winter in the hills. Look at the firs and spruces around you, and the young fir in front: a cone shape, with branches sloping down.'), target: 'sn',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sn.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Many other trees here have dropped their leaves for the winter. The firs and spruces stay green, with snow on them.') },
      { do: X('Hold the fir branch out level: drag the yellow handle up until the branch is flat.'), target: 'tip',
        act: async (K, o) => { const a0 = o.sn.ang; await K.tween(1.2, (k) => o.sn.setAng(a0 * (1 - k))); o.sn.setAng(0); K.lab.emit('set', { obj: o.sn.id }); }, ev: { type: 'set' },
        see: X('The branch sticks out level, like the branch of a broad-leaved tree.') },
      { do: X('Push the button: let snow fall all night.'), target: 'knob',
        act: async (K, o) => { await run((r) => o.sn.letSnow(r)); K.lab.emit('snowed', { obj: o.sn.id }); }, ev: { type: 'snowed' },
        check: (K, o) => { const t = o.sn.trials[o.sn.trials.length - 1]; return t && t.stays < 0.6 ? { ok: false, see: X('Only a little snow stayed: your branch was not level when the snow fell.'), why: X('Set the branch flat (less than 15°) before letting it snow, to see what snow does to a level branch.') } : null; },
        see: X('Snow piles up thick on the level branch. Its weight bends the branch down until it cracks at the base.'), why: X('A level branch catches the snow and holds it. Heavy snow can break such branches.') },
      { do: X('Now slope the branch down steeply, like the branches of the fir: drag the handle down.'), target: 'tip',
        act: async (K, o) => { await K.tween(1.2, (k) => o.sn.setAng(50 * k)); o.sn.setAng(50); K.lab.emit('set', { obj: o.sn.id }); }, ev: { type: 'set' },
        see: X('The branch slopes down at about 50°.') },
      { do: X('Push the button again: another night of snow.'), target: 'knob',
        act: async (K, o) => { await run((r) => o.sn.letSnow(r)); K.lab.emit('snowed', { obj: o.sn.id }); }, ev: { type: 'snowed' },
        check: (K, o) => { const t = o.sn.trials[o.sn.trials.length - 1]; return t && t.stays > 0.05 ? { ok: false, see: X('Some snow still stayed on your branch: it did not slope down enough.'), why: X('Snow slides off only a steep slope. Slope the branch down to 40° or more and try again.') } : null; },
        see: X('The snow slides down the sloping branch and drops to the ground. The branch is not harmed.'), why: X('The cone shape and the sloping branches of mountain trees let snow slide off, so their branches do not break.') },
      { do: X('Look closely at the leaves of the fir.'), target: 'sn',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.sn.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('They are thin and needle-shaped, with a waxy coat.'), why: X('Snow does not collect on needles, and they lose very little water in winter, when the water in the soil is frozen.') },
    ],
    eq: { word: 'Mountain trees', sym: 'cone shape · sloping branches · needle-like leaves' },
    result: { obs: X('On the level branch the snow piled up until the branch bent and cracked. On the steeply sloping branch it slid off. Fir leaves are thin needles.'),
      concl: X('Trees in snowy mountains, like fir, pine and deodar, are cone-shaped with sloping branches and needle-like leaves. These adaptations let snow slide off and save water in the cold.'),
      safety: X('Snow and ice are slippery. Wear warm clothes and good shoes in the hills.'),
      viva: [{ q: X('Why are the branches of a fir sloping?'), a: X('So that snow slides off and the branches do not break.') }, { q: X('What shape are the leaves of mountain trees?'), a: X('Needle-like.') },
        { q: X('Name two mountain animals with thick fur.'), a: X('The yak and the snow leopard.') }] },
  },
  // ============================================================ Class 6 · the water cycle
  {
    id: 'bw6_water_cycle', subj: 'biology', cls: 6, ch: C6w, world: true, place: 'pond', table: true, topic: 'eco',
    title: X('The water cycle by the pond: sun, a sheet and a cold glass'),
    aim: X('To cover a basin of muddy pond water with a clear sheet, bag a plant’s leaves and put ice in a glass with your own hand, and see water evaporate in the sun and condense again, as it does in the water cycle.'),
    kind: X('Evaporation, condensation and the water cycle'),
    setup(K) {
      const W = Wd(K);
      const pond = K.add(BW.pondScene({ W }), 0, 0, { y: 0 });
      const wc = K.add(B4.waterCycle({ W }), 0, 0, { y: 0 });
      const sheet = K.add(BW.organism(null, N('Clear plastic sheet', 'पारदर्शी प्लास्टिक शीट', 'Transparent plastic sheet'), { group: B4.foldedBag(), hitR: 0.09, hitY: 0.01 }), -0.95, -0.52, BY);
      const stone = K.add(BW.organism(null, N('Small stone', 'छोटा पत्थर', 'Chhota patthar'), { group: B4.stoneThing(), hitR: 0.06, hitY: 0.015 }), -0.62, -0.5, BY);
      const bag = K.add(BW.organism(null, N('Polythene bag', 'पॉलीथीन की थैली', 'Polythene ki thaili'), { group: B4.foldedBag(), hitR: 0.08, hitY: 0.01 }), 0.0, -0.5, BY);
      const ice = K.add(BW.organism(null, N('Bowl of ice', 'बर्फ़ की कटोरी', 'Barf ki katori'), { group: B4.iceBowl(), hitR: 0.07, hitY: 0.025 }), 0.55, -0.55, BY);
      const knob = K.add(MW.pullTab(), 0, -0.42);
      const e = (t) => emit(K, wc, t);
      B4.bindWaterCycle(wc, { sheet, stone, bag, ice }, K.app, { sheet: 1, stone: 2, bag: 3, clock: 4, ice: 6 }, { sheet: e('sheet'), stone: e('stone'), bag: e('bag'), ice: e('ice') });
      B4.bindTimeHands(wc, knob, K.app, { sun: 4 }, { end: e('h5') }); wc.canTime = () => wc.covered;
      camBy(wc, K.app, [wc.views.pond, wc.views.basin, wc.views.basin, wc.views.table, wc.views.table, wc.views.cup, wc.views.glass]);
      return { pond, wc, sheet, stone, bag, ice, knob };
    },
    steps: [
      { do: X('A sunny morning by the pond. On the table: a basin of muddy pond water with an empty katori standing in the middle, and a potted plant.'), target: 'wc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.wc.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('The sun shines on the pond, the basin and the plant.') },
      { do: X('Spread the clear plastic sheet over the basin.'), target: 'sheet',
        act: async (K, o) => { await new Promise((r) => o.wc.cover(o.sheet, r)); K.lab.emit('sheet', { obj: o.wc.id }); }, ev: { type: 'sheet' }, see: X('The basin is covered; the sheet lies flat over it.') },
      { do: X('Put the small stone on the middle of the sheet, right above the katori.'), target: 'stone',
        act: async (K, o) => { await new Promise((r) => o.wc.putStone(o.stone, r)); K.lab.emit('stone', { obj: o.wc.id }); }, ev: { type: 'stone' }, see: X('The sheet now dips down in the middle, over the katori.') },
      { do: X('Slip the polythene bag over the leaves of the potted plant.'), target: 'bag',
        act: async (K, o) => { await new Promise((r) => o.wc.bagIt(o.bag, r)); K.lab.emit('bag', { obj: o.wc.id }); }, ev: { type: 'bag' }, see: X('The leaves are inside a clear bag.') },
      { do: X('Slide the clock from 10 in the morning to 3 in the afternoon.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.wc.setT(5 * k)); o.wc.setT(5); K.lab.emit('h5', { obj: o.wc.id }); }, ev: { type: 'h5' },
        check: (K, o) => (!o.wc.stoned ? { ok: false, see: X('The sheet is misted, but the drops run to its edge and fall back into the basin: the katori stays empty.'), why: X('Without the stone the sheet does not dip over the katori. Put the stone in the middle so the drops run there and drip in.') } : null),
        see: X('The underside of the sheet mists over with tiny drops. They run down to the lowest point and drip into the katori. The plant’s bag mists up too.'),
        why: X('The sun’s heat turns water into vapour (evaporation), from the basin and from the leaves. The vapour touches the cooler sheet and turns back into drops of water (condensation).') },
      { do: X('Look into the katori.'), target: 'wc',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.wc.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('It holds about a centimetre of clear water, though the basin water is muddy.'), why: X('Only water evaporates; the mud is left behind. In the same way the sun lifts clean water from ponds, rivers, seas and leaves into the air.') },
      { do: X('Put the ice into the steel glass of water and watch the outside of the glass.'), target: 'ice',
        act: async (K, o) => { await new Promise((r) => o.wc.ice(o.ice, r)); K.lab.emit('ice', { obj: o.wc.id }); }, ev: { type: 'ice' },
        see: X('In a minute the outside of the glass is covered with tiny drops of water.'), why: X('Water vapour in the air condenses on the cold glass. High up in the sky the air is cold too: vapour condenses into tiny drops that make clouds, and the drops fall back as rain.') },
    ],
    eq: { word: 'The water cycle', sym: 'water → (sun’s heat) vapour → (cooling) clouds → rain → water' },
    result: { obs: X('In the sun, drops formed under the sheet and dripped clear water into the katori; the plant’s bag misted up; drops formed on the outside of the cold glass.'),
      concl: X('Heat from the sun evaporates water from water bodies and plants; the vapour cools, condenses into clouds and falls back as rain. This going round of water is the water cycle.'),
      safety: X('Do not drink pond water, even if it looks clear: it may still have germs.'),
      viva: [{ q: X('What is evaporation?'), a: X('Water changing into water vapour.') }, { q: X('Why do drops form on the outside of a glass of ice water?'), a: X('Water vapour in the air condenses on the cold glass.') },
        { q: X('How do plants add water vapour to the air?'), a: X('Through tiny pores in their leaves (transpiration).') }] },
  },
  // ============================================================ Class 7 · plants, animals and the air in balance
  {
    id: 'bw7_gas_balance', subj: 'biology', cls: 7, ch: C7p, world: true, place: 'pond', table: true, topic: 'eco',
    title: X('Snails and water plants: who keeps the air in balance?'),
    aim: X('To put pond snails and Hydrilla into tubes of carbon dioxide indicator with your own hand, keep them in the sun and in the dark, and find out how animals and plants balance carbon dioxide and oxygen.'),
    kind: X('Photosynthesis and respiration in balance'),
    setup(K) {
      const W = Wd(K);
      const pond = K.add(BW.pondScene({ W }), 0, 0, { y: 0 });
      const gt = K.add(B4.gasTubes({ W }), 0, 0, { y: 0 });
      // tube D is filled by a friend, just as tube C will be: a snail and a sprig
      const pre = [['snail', 3], ['plant', 3]];
      const snails = [-0.62, -0.52, -0.42].map((x, i) => { const s = K.add(BW.organism('snail', N('Pond snail', 'तालाब का घोंघा', 'Talaab ka ghongha'), { len: 0.012, face: [1, 0.3], hitR: 0.035, hitY: 0.008 }), x, -0.62 + (i % 2) * 0.05, BY); s.kind2 = 'snail'; return s; });
      const sprigs = [0.4, 0.5, 0.6].map((x, i) => { const s = K.add(BW.organism(null, N('Hydrilla sprig', 'हाइड्रिला की टहनी', 'Hydrilla ki tehni'), { group: B4.sprigThing(), hitR: 0.05, hitY: 0.01 }), x, -0.6 + (i % 2) * 0.05, BY); s.kind2 = 'plant'; return s; });
      const sleeve = K.add(BW.organism(null, N('Black paper cover', 'काले काग़ज़ का खोल', 'Kaale kaagaz ka khol'), { group: B4.blackSleeve(), hitR: 0.05, hitY: 0.02 }), 0.9, -0.55, BY);
      const knob = K.add(MW.pullTab(), 0, -0.45);
      for (const [k, i] of pre) gt.preFill(i, k);
      const want = [[0, 'snail'], [1, 'plant'], [2, 'snail'], [2, 'plant']];
      B4.bindGas(gt, [...snails, ...sprigs], sleeve, K.app, { first: 1, last: 4, sleeve: 5, uncover: 7 }, {
        put: (kind, i) => { const s = K.app.runner.i; const w = want[s - 1]; if (w && w[0] === i && w[1] === kind) K.lab.emit('put', { obj: gt.id }); else gt.say([`${Wd(K)('Tube')} ${'ABCD'[i]}: ${Wd(K)(kind === 'snail' ? 'a snail went in' : 'a sprig went in')}`, Wd(K)('Not the one asked for: it stays there')], WARN); },
        sleeve: emit(K, gt, 'sleeve'), uncover: emit(K, gt, 'uncover') });
      B4.bindTimeHands(gt, knob, K.app, { sun: 6 }, { end: emit(K, gt, 'h6') });
      camBy(gt, K.app, [gt.views.pond, gt.views.table, gt.views.table, gt.views.table, gt.views.table, gt.views.rack, gt.views.rack, gt.views.rack]);
      return { pond, gt, knob, sleeve, snail: snails[0], sprig: sprigs[0], snails, sprigs };
    },
    steps: [
      { do: X('Four tubes of carbon dioxide indicator stand in the rack. It is red now; it turns yellow when carbon dioxide increases and purple when carbon dioxide decreases.'), target: 'gt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.gt.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('Tube D already has a pond snail and a sprig of Hydrilla, a water plant.') },
      { do: X('Put a pond snail into tube A.'), target: 'snail',
        act: async (K, o) => { const s = o.snails.find((x) => !x.used); await new Promise((r) => o.gt.put(s, 0, r)); K.lab.emit('put', { obj: o.gt.id }); }, ev: { type: 'put' }, see: X('Tube A: a snail, no plant.') },
      { do: X('Put a sprig of Hydrilla into tube B.'), target: 'sprig',
        act: async (K, o) => { const s = o.sprigs.find((x) => !x.used); await new Promise((r) => o.gt.put(s, 1, r)); K.lab.emit('put', { obj: o.gt.id }); }, ev: { type: 'put' }, see: X('Tube B: a plant, no snail.') },
      { do: X('Put a snail into tube C.'), target: 'snail',
        act: async (K, o) => { const s = o.snails.find((x) => !x.used); await new Promise((r) => o.gt.put(s, 2, r)); K.lab.emit('put', { obj: o.gt.id }); }, ev: { type: 'put' }, see: X('Tube C has a snail…') },
      { do: X('…and a sprig of Hydrilla into tube C as well.'), target: 'sprig',
        act: async (K, o) => { const s = o.sprigs.find((x) => !x.used); await new Promise((r) => o.gt.put(s, 2, r)); K.lab.emit('put', { obj: o.gt.id }); }, ev: { type: 'put' }, see: X('Tube C: a snail and a plant together, like tube D.') },
      { do: X('Slip the black paper cover over tube D, so no light reaches it.'), target: 'sleeve',
        act: async (K, o) => { await new Promise((r) => o.gt.cover(o.sleeve, r)); K.lab.emit('sleeve', { obj: o.gt.id }); }, ev: { type: 'sleeve' }, see: X('Tube D is in the dark; A, B and C are in the sunlight.') },
      { do: X('Cork the tubes and slide the clock on six hours in the sun.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.gt.setT(6 * k)); o.gt.setT(6); K.lab.emit('h6', { obj: o.gt.id }); }, ev: { type: 'h6' },
        check: (K, o) => { const r = o.gt.result(); const exp = ['yellow', 'purple', 'red']; const bad = [0, 1, 2].filter((i) => r[i] !== exp[i]); return bad.length ? { ok: false, see: { en: `Your tubes: A ${r[0]}, B ${r[1]}, C ${r[2]}. They are not what the book shows, because of what went into them.`, hi: `आपकी नलियाँ: A ${tl({ app: { lang: 'hi' } }, X(r[0]))}, B ${tl({ app: { lang: 'hi' } }, X(r[1]))}, C ${tl({ app: { lang: 'hi' } }, X(r[2]))}। ये किताब जैसी नहीं हैं, क्योंकि इनमें कुछ और डाला गया।`, hg: `Aapki tubes: A ${r[0]}, B ${r[1]}, C ${r[2]}. Ye kitaab jaisi nahi hain, kyunki inmein kuch aur daala gaya.` }, why: X('Each snail adds carbon dioxide; each plant in the light takes it up. Check what is in each tube.') } : null; },
        see: X('Tiny bubbles rise from the Hydrilla in B and C. Tube A has turned yellow, tube B purple, and tube C is still red.'),
        why: X('The snail breathes out carbon dioxide (A). In light the plant uses carbon dioxide to make food and gives out oxygen, the bubbles (B). In C the plant uses up what the snail gives out: the two balance.') },
      { do: X('Now take the black cover off tube D.'), target: 'sleeve',
        act: async (K, o) => { await run((r) => o.gt.uncover(r, o.sleeve)); K.lab.emit('uncover', { obj: o.gt.id }); }, ev: { type: 'uncover' },
        see: X('Tube D has turned yellow.'), why: X('In the dark a plant cannot make food, so it does not use carbon dioxide; it only breathes, like the snail. Carbon dioxide builds up.') },
    ],
    eq: { word: 'Balance in light', sym: 'animals: O₂ in, CO₂ out · plants in light: CO₂ in, O₂ out' },
    result: { obs: X('Snail alone: yellow (more carbon dioxide). Plant alone in light: purple (less). Snail and plant in light: stayed red. Snail and plant in the dark: yellow.'),
      concl: X('Animals and plants breathe out carbon dioxide all the time. In light, green plants take in carbon dioxide and give out oxygen while making food. So plants and animals together keep oxygen and carbon dioxide in balance, but only in the light.'),
      safety: X('Handle the snails gently and put them back in the pond after the activity.'),
      viva: [{ q: X('What gas do the bubbles from Hydrilla contain?'), a: X('Oxygen.') }, { q: X('Why did tube D turn yellow?'), a: X('In the dark the plant does not make food, so carbon dioxide from breathing builds up.') },
        { q: X('Do plants respire?'), a: X('Yes, day and night, like animals.') }] },
  },
  // ============================================================ Class 8 · microbes: curd
  {
    id: 'bw8_curd', subj: 'biology', cls: 8, ch: C8m, world: true, place: 'kitchen', table: true, topic: 'micro',
    title: X('Setting curd: what do the bacteria need?'),
    aim: X('To add a spoonful of curd to bowls of warm milk with your own hand, keep one bowl cold and one without curd, and find out what Lactobacillus bacteria need to turn milk into curd.'),
    kind: X('Useful microorganisms: Lactobacillus'),
    setup(K) {
      const W = Wd(K);
      const ck = K.add(B4.curdKit({ W }), 0, 0, { y: 0 });
      const bowls = ['A', 'B', 'C'].map((l, i) => { const b = K.add(BW.organism(null, N(`Bowl ${l} of milk`, `दूध की कटोरी ${l}`, `Doodh ki katori ${l}`), { group: B4.milkBowl(l), hitR: 0.07, hitY: 0.03 }), -0.4 + i * 0.36, -0.82, BY); b.letter = l; return b; });
      const sp = K.add(BW.organism(null, N('Spoon', 'चम्मच', 'Chammach'), { group: B4.spoon(), hitR: 0.06, hitY: 0.01 }), 0.62, -0.58, BY);
      const knob = K.add(MW.pullTab(), 0, -0.42);
      const W2 = Wd(K), say = (l, c) => ck.say(l, c);
      B4.bindCurd(ck, sp, bowls, K.app, { add1: 1, add2: 2, chill: 3, test: 5 }, {
        added: (b) => { const i = K.app.runner.i; say([`${W2('Curd added to bowl')} ${b.letter}`], OK); if ((i === 1 && b.letter === 'A') || (i === 2 && b.letter === 'B')) K.lab.emit('added', { obj: ck.id }); },
        chilled: (b) => { say([`${W2('Bowl')} ${b.letter} ${W2('is in the ice box')}`], '#bfe3ff'); if (b.letter === 'B') K.lab.emit('chilled', { obj: ck.id }); },
        tested: (b, set) => { say([`${W2('Bowl')} ${b.letter}: ${W2(set ? 'set curd: it holds its shape' : 'still milk: it drips off the spoon')}`], set ? OK : WARN); if (bowls.every((x) => x.st.tested)) K.lab.emit('tested', { obj: ck.id }); } });
      B4.bindTimeHands(ck, knob, K.app, { night: 4 }, { end: emit(K, ck, 'h8') });
      camBy(ck, K.app, [ck.views.table, ck.views.bowls, ck.views.bowls, ck.views.ice, ck.views.table, ck.views.test]);
      return { ck, sp, bowls, knob, bowlB: bowls[1] };
    },
    steps: [
      { do: X('In the kitchen: three bowls of lukewarm milk, A, B and C, a bowl of curd set yesterday with a spoon, and a box of ice.'), target: 'ck',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ck.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('A spoonful of curd has millions of Lactobacillus bacteria in it, too small to see.') },
      { do: X('Add a spoonful of curd to bowl A and stir.'), target: 'sp',
        act: async (K, o) => { await run((r) => o.ck.addStarter(o.sp, o.bowls[0], r)); K.lab.emit('added', { obj: o.ck.id }); }, ev: { type: 'added' }, see: X('Bowl A: warm milk with curd in it.') },
      { do: X('Add a spoonful of curd to bowl B too.'), target: 'sp',
        act: async (K, o) => { await run((r) => o.ck.addStarter(o.sp, o.bowls[1], r)); K.lab.emit('added', { obj: o.ck.id }); }, ev: { type: 'added' }, see: X('Bowl B: warm milk with curd in it. Bowl C gets no curd at all.') },
      { do: X('Put bowl B in the ice box.'), target: 'bowlB',
        act: async (K, o) => { await new Promise((r) => o.ck.chill(o.bowls[1], r)); K.lab.emit('chilled', { obj: o.ck.id }); }, ev: { type: 'chilled' }, see: X('Bowl B is now kept cold; A and C stay in the warm kitchen.') },
      { do: X('Slide the clock through the night: eight hours.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.ck.setT(8 * k)); o.ck.setT(8); K.lab.emit('h8', { obj: o.ck.id }); }, ev: { type: 'h8' },
        check: (K, o) => { const b = o.bowls; const ok = b[0].st.set > 0.8 && b[1].st.set < 0.3 && b[2].st.set < 0.3; return ok ? null : { ok: false, see: { en: `Your bowls: ${b.map((x) => `${x.letter} ${x.st.set > 0.8 ? 'curd' : 'milk'}`).join(', ')}. Not what the book shows, because of what you did with them.`, hi: `आपकी कटोरियाँ: ${b.map((x) => `${x.letter} ${x.st.set > 0.8 ? 'दही' : 'दूध'}`).join(', ')}। किताब जैसी नहीं, क्योंकि आपने इनके साथ कुछ और किया।`, hg: `Aapki katoriyan: ${b.map((x) => `${x.letter} ${x.st.set > 0.8 ? 'dahi' : 'doodh'}`).join(', ')}. Kitaab jaisi nahi, kyunki aapne inke saath kuch aur kiya.` }, why: X('Curd sets only in warm milk that has curd (and so the bacteria) added to it.') }; },
        see: X('By morning bowl A has set into thick curd. Bowl B, in the cold, and bowl C, with no curd added, are still milk.'),
        why: X('Lactobacillus bacteria grow fast in warm milk. They turn its sugar into an acid, which makes the milk thick and sour: curd. In the cold they hardly grow; without them nothing happens.') },
      { do: X('Test each bowl with the spoon.'), target: 'sp',
        act: async (K, o) => { for (const b of o.bowls) if (!b.st.tested) await run((r) => o.ck.test(o.sp, b, r)); K.lab.emit('tested', { obj: o.ck.id }); }, ev: { type: 'tested' },
        see: X('The curd in bowl A comes up in a firm lump. The milk in B and C just drips off the spoon.') },
    ],
    eq: { word: 'Milk + Lactobacillus (warm, a few hours)', sym: '→ curd' },
    result: { obs: X('Only the warm milk with curd added set into curd. Milk with curd kept in the ice box, and warm milk without curd, stayed liquid.'),
      concl: X('Curd is made by Lactobacillus bacteria. They need warmth (about 30–40 °C) and milk to feed on. Cold slows them down. Microorganisms like these are useful to us in making curd, cheese and idli.'),
      safety: X('Use clean bowls and spoons so that harmful microbes do not get into the milk.'),
      viva: [{ q: X('Which bacterium turns milk into curd?'), a: X('Lactobacillus.') }, { q: X('Why does curd not set in the fridge?'), a: X('The bacteria grow very slowly in the cold.') }, { q: X('Why do we add a little old curd to the milk?'), a: X('It puts the bacteria into the milk.') }] },
  },
  // ============================================================ Class 8 · microbes: yeast
  {
    id: 'bw8_yeast', subj: 'biology', cls: 8, ch: C8m, world: true, place: 'kitchen', table: true, topic: 'micro',
    title: X('Yeast at work: a balloon blows itself up'),
    aim: X('To add yeast to sugar water and fit balloons with your own hand, and find out what gas yeast gives out and why dough rises.'),
    kind: X('Useful microorganisms: yeast (fermentation)'),
    setup(K) {
      const W = Wd(K);
      const yk = K.add(B4.yeastKit({ W }), 0, 0, { y: 0 });
      const sp = K.add(BW.organism(null, N('Spoon', 'चम्मच', 'Chammach'), { group: B4.spoon(), hitR: 0.06, hitY: 0.01 }), 0.42, -0.58, BY);
      const balloons = [[0xd62a2a, -0.8, -0.6], [0x2a62d6, -0.67, -0.53]].map(([c, x, z]) => K.add(BW.organism(null, N('Balloon', 'गुब्बारा', 'Gubbara'), { group: B4.balloon(c), hitR: 0.06, hitY: 0.02 }), x, z, BY));
      const knob = K.add(MW.pullTab(), 0, -0.42);
      const W2 = Wd(K), say = (l, c) => yk.say(l, c);
      B4.bindYeast(yk, sp, balloons, K.app, { yeast: 1, fit: 2, lime: 4 }, {
        yeast: (i) => { say([`${W2('Yeast added to bottle')} ${'AB'[i]}`], OK); if (i === 0) K.lab.emit('yeast', { obj: yk.id }); },
        fit: () => { say([W2('Balloon fitted')], OK); if (yk.bottles.every((b) => b.balloon)) K.lab.emit('fitted', { obj: yk.id }); },
        lime: (milky) => { say([W2(milky ? 'The lime water turns milky' : 'Nothing came out: the balloon was empty')], milky ? OK : WARN); if (milky) K.lab.emit('lime', { obj: yk.id }); } });
      B4.bindTimeHands(yk, knob, K.app, { warm: 3 }, { end: emit(K, yk, 'h2') });
      camBy(yk, K.app, [yk.views.table, yk.views.table, yk.views.bottles, yk.views.warm, yk.views.lime, yk.views.dough]);
      return { yk, sp, balloons, knob, balloon: balloons[0] };
    },
    steps: [
      { do: X('Two bottles of lukewarm water with two spoons of sugar in each, A and B. Beside them: dried yeast, two balloons, a tube of lime water, and two balls of dough Maa made two hours ago.'), target: 'yk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.yk.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('Yeast is a fungus: each grain of dried yeast is made of thousands of tiny living cells, resting.') },
      { do: X('Add a spoonful of yeast to bottle A only.'), target: 'sp',
        act: async (K, o) => { await run((r) => o.yk.addYeast(o.sp, 0, r)); K.lab.emit('yeast', { obj: o.yk.id }); }, ev: { type: 'yeast' }, see: X('Bottle A turns a little cloudy. Bottle B has no yeast.') },
      { do: X('Stretch a balloon over the mouth of each bottle.'), target: 'balloon',
        act: async (K, o) => { for (let i = 0; i < 2; i++) if (!o.yk.bottles[i].balloon) { const b = o.balloons.find((x) => x.on == null); await new Promise((r) => o.yk.fit(b, i, r)); } K.lab.emit('fitted', { obj: o.yk.id }); }, ev: { type: 'fitted' }, see: X('Both balloons hang empty.') },
      { do: X('Leave them in the warm kitchen: slide the clock on two hours.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.yk.setT(2 * k)); o.yk.setT(2); K.lab.emit('h2', { obj: o.yk.id }); }, ev: { type: 'h2' },
        check: (K, o) => (o.yk.bottles[1].yeast || !o.yk.bottles[0].yeast ? { ok: false, see: X('Your balloons: the one on the bottle with yeast blew up, the other did not, whichever bottle that was.'), why: X('Only a bottle with yeast in it makes gas.') } : null),
        see: X('Bottle A froths and bubbles; its balloon has blown up. Bottle B and its balloon have not changed. The dough made with yeast has puffed up to about twice its size.'),
        why: X('Yeast feeds on the sugar and gives out carbon dioxide gas (and a little alcohol): this is fermentation. The gas fills the balloon, and makes the dough rise.') },
      { do: X('Take balloon A off carefully and squeeze its gas through the lime water.'), target: 'balloon',
        act: async (K, o) => { const b = o.balloons.find((x) => x.on === 0 && !x.used) || o.balloons[0]; await run((r) => o.yk.toLime(b, r)); K.lab.emit('lime', { obj: o.yk.id }); }, ev: { type: 'lime' },
        see: X('The lime water turns milky.'), why: X('Carbon dioxide turns lime water milky. So the gas made by the yeast is carbon dioxide.') },
      { do: X('Look at the two balls of dough.'), target: 'yk',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.yk.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('The dough with yeast is big, soft and spongy; the other is small and hard.'), why: X('Bubbles of carbon dioxide from the yeast are trapped in the dough. That is why bread, bhature and idli are soft and spongy.') },
    ],
    eq: { word: 'Sugar (yeast, warm)', sym: '→ carbon dioxide + alcohol' },
    result: { obs: X('The bottle with yeast frothed and blew up its balloon; the gas turned lime water milky. The bottle without yeast did not change. Dough with yeast doubled in size.'),
      concl: X('Yeast is a living fungus. It feeds on sugar and gives out carbon dioxide (fermentation). The gas makes bread and other dough rise, and makes them soft.'),
      safety: X('Remove a blown-up balloon slowly, holding its neck closed.'),
      viva: [{ q: X('Which gas does yeast give out?'), a: X('Carbon dioxide.') }, { q: X('How can you test for carbon dioxide?'), a: X('It turns lime water milky.') }, { q: X('What is the process called?'), a: X('Fermentation.') }] },
  },
  // ============================================================ Class 8 · seed dispersal
  {
    id: 'bw8_seeds', subj: 'biology', cls: 8, ch: C8h, world: true, place: 'grass', table: false, topic: 'eco',
    title: X('How seeds travel: wind, water and animals'),
    aim: X('To let different seeds go in the wind, put a coconut in water and send a hare through a bush of burrs with your own hand, and find out how plants spread their seeds far from the parent plant.'),
    kind: X('Seed dispersal'),
    setup(K) {
      const W = Wd(K);
      const sf = K.add(B4.seedField({ W }), 0, 0, { y: 0 });
      const P = sf.at.post();
      const aak = K.add(BW.organism(null, N('Aak seed with silky hairs', 'रेशमी बालों वाला आक का बीज', 'Resham jaise baalon wala aak ka beej'), { group: B4.aakSeed(), hitR: 0.04, hitY: 0.015 }), P.x - 0.09, P.z + 0.02, { y: P.y });
      const wing = K.add(BW.organism(null, N('Drumstick seed with wings', 'पंखों वाला सहजन का बीज', 'Pankhon wala sahjan ka beej'), { group: B4.wingSeed(), hitR: 0.04, hitY: 0.01 }), P.x, P.z + 0.03, { y: P.y });
      const stone = K.add(BW.organism(null, N('Mango stone', 'आम की गुठली', 'Aam ki guthli'), { group: B4.mangoStone(), hitR: 0.05, hitY: 0.02 }), P.x + 0.1, P.z + 0.02, { y: P.y });
      const coconut = K.add(BW.organism('coconut', N('Coconut', 'नारियल', 'Nariyal'), { len: 0.16, face: [1, 0.3], hitR: 0.1, hitY: 0.07 }), -0.82, -0.42, { y: 0 });
      const hare = K.add(BW.organism('hare', N('Hare', 'ख़रगोश', 'Khargosh'), { h: 0.36, face: [1, 0.2], hitR: 0.15, hitY: 0.15 }), 1.25, -1.35, { y: 0 });
      const W2 = Wd(K), names = { aak: 'Aak seed', wing: 'Drumstick seed', stone: 'Mango stone' };
      B4.bindSeeds(sf, { aak, wing, stone, coconut, hare }, K.app, { aak: 1, wing: 2, stone: 3, coconut: 4, hare: 5 }, {
        blown: (k, d) => { sf.say([`${W2(names[k])}: ${d.toFixed(1)} m`, k === 'aak' ? W2('floated away on the wind') : k === 'wing' ? W2('spun down a little way off') : W2('dropped almost straight down')], ['#ffd23f', '#ffffff']); K.lab.emit('blown', { obj: sf.id }); },
        float: () => { sf.say([W2('The coconut floats')], OK); K.lab.emit('float', { obj: sf.id }); },
        burr: (d) => { sf.say([`${W2('Burrs dropped')} ${d.toFixed(1)} m ${W2('from the bush')}`], OK); K.lab.emit('burr', { obj: sf.id }); } });
      camBy(sf, K.app, [sf.views.all, sf.views.post, sf.views.post, sf.views.post, sf.views.tub, sf.views.bush]);
      return { sf, aak, wing, stone, coconut, hare };
    },
    steps: [
      { do: X('A grassland with a steady breeze blowing from the left (see the windsock). On the post: three seeds. Pegs mark every metre downwind. A tub of water, a coconut, a gokhru bush and a hare.'), target: 'sf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sf.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('If every seed fell under its parent plant, the young plants would crowd it and each other.') },
      { do: X('Pick up the aak seed with its silky hairs, hold it up in the wind and let it go.'), target: 'aak',
        act: async (K, o) => { o.aak.g.position.y += 0.15; await new Promise((r) => o.sf.fly(o.aak, 'aak', r)); K.lab.emit('blown', { obj: o.sf.id }); }, ev: { type: 'blown' },
        see: X('It floats away slowly on the breeze and lands several metres off.'), why: X('The silky hairs act like a parachute: the light seed falls very slowly, so the wind carries it far.') },
      { do: X('Now let the drumstick seed with its papery wings go in the wind.'), target: 'wing',
        act: async (K, o) => { o.wing.g.position.y += 0.15; await new Promise((r) => o.sf.fly(o.wing, 'wing', r)); K.lab.emit('blown', { obj: o.sf.id }); }, ev: { type: 'blown' },
        see: X('It spins as it falls and lands a metre or two away.'), why: X('Its wings slow its fall, so the wind can push it some distance.') },
      { do: X('Now let the heavy mango stone go from the same height.'), target: 'stone',
        act: async (K, o) => { o.stone.g.position.y += 0.15; await new Promise((r) => o.sf.fly(o.stone, 'stone', r)); K.lab.emit('blown', { obj: o.sf.id }); }, ev: { type: 'blown' },
        see: X('It drops almost straight down.'), why: X('Heavy seeds are not carried by wind. Animals eat mangoes and drop the stones elsewhere.') },
      { do: X('Put the coconut into the tub of water.'), target: 'coconut',
        act: async (K, o) => { await new Promise((r) => o.sf.float(o.coconut, r)); K.lab.emit('float', { obj: o.sf.id }); }, ev: { type: 'float' },
        see: X('The coconut floats and drifts on the water.'), why: X('Its thick husk is full of air-filled fibres. Coconuts float along rivers and across the sea, and grow where they wash up.') },
      { do: X('Carry the hare through the gokhru bush and let it go.'), target: 'hare',
        act: async (K, o) => { await new Promise((r) => o.sf.brush(o.hare, r)); K.lab.emit('burr', { obj: o.sf.id }); }, ev: { type: 'burr' },
        see: X('Burrs hook into the hare’s fur. It hops away, and the burrs drop off far from the bush.'), why: X('Hooks and spines catch on the fur of animals (and our clothes), which carry the seeds to new places.') },
    ],
    eq: { word: 'Seed dispersal', sym: 'wind: hairs, wings · water: floating fruits · animals: hooks, eaten fruits · bursting pods' },
    result: { obs: X('The aak seed flew farthest, the drumstick seed a short way, and the mango stone dropped straight down. The coconut floated. The burrs rode on the hare and fell off far away.'),
      concl: X('Plants spread their seeds by wind, water and animals (and some pods burst and fling them out). Dispersal carries seeds away from the parent plant, so young plants do not crowd each other and plants reach new places.'),
      safety: X('Gokhru burrs are prickly: do not rub them on your skin.'),
      viva: [{ q: X('Name a seed carried by wind.'), a: X('Aak (madar), drumstick, cotton, dandelion.') }, { q: X('How does a coconut get carried far?'), a: X('It floats on water.') }, { q: X('Why do plants need to disperse their seeds?'), a: X('So that young plants do not crowd the parent plant and can grow in new places.') }] },
  },
  // ============================================================ Class 8 · pollination
  {
    id: 'bw8_pollination', subj: 'biology', cls: 8, ch: C8h, also: [10], world: true, place: 'khet', table: false, topic: 'repro',
    title: X('A bumblebee and sunflowers: pollination by hand'),
    aim: X('To carry a bumblebee from sunflower to sunflower with your own hand, keep one flower in a net bag, and find out how insects pollinate flowers and why that gives seeds.'),
    kind: X('Pollination by insects'),
    setup(K) {
      const W = Wd(K);
      const sp = K.add(B4.sunflowerPatch({ W }), 0, 0, { y: 0 });
      const bee = B4.beeThing(K.add(BW.organism('bumblebee', N('Bumblebee', 'भौंरा', 'Bhaunra (bumblebee)'), { len: 0.022, face: [-0.3, 1], hitR: 0.05, hitY: 0.01 }), -0.75, -0.95, { y: 1.3 }));
      const knob = K.add(MW.pullTab(), 0, -0.55);
      const W2 = Wd(K);
      B4.bindBees(sp, bee, K.app, { v1: 1, v2: 2, net: 3, v3: 4 }, { visit: (i, res) => { const s = K.app.runner.i;
        sp.say([`${W2('Flower')} ${i + 1}: ${W2(res === 'net' ? 'the net keeps the bee out' : res === 'pollinate' ? 'pollen from another flower left on it' : res === 'same' ? 'its own pollen only' : 'nectar and pollen picked up')}`], res === 'pollinate' ? OK : res === 'net' ? WARN : '#ffffff');
        if (s === 1 && res !== 'net') K.lab.emit('visit', { obj: sp.id }); if ((s === 2 || s === 4) && res === 'pollinate') K.lab.emit('pollinate', { obj: sp.id }); if (s === 3 && res === 'net') K.lab.emit('net', { obj: sp.id }); } });
      B4.bindTimeHands(sp, knob, K.app, { weeks: 5 }, { end: emit(K, sp, 'w3') });
      camBy(sp, K.app, [sp.views.all, sp.views.heads, sp.views.heads, sp.views.heads, sp.views.heads, sp.views.all, sp.views.heads]);
      return { sp, bee, knob };
    },
    steps: [
      { do: X('A field of sunflowers in bloom. Flower 3 is tied in a fine net bag. A bumblebee hovers nearby.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('Each sunflower head is made of hundreds of tiny flowers. Each must get pollen from another sunflower plant to make a seed.') },
      { do: X('Carry the bee to flower 1 and let it feed.'), target: 'bee',
        act: async (K, o) => { await run((r) => o.sp.visit(o.bee, 0, r)); K.lab.emit('visit', { obj: o.sp.id }); }, ev: { type: 'visit' },
        see: X('The bee walks over the flower, sipping nectar. Yellow pollen dusts its furry body.') },
      { do: X('Now carry it to another sunflower, flower 2.'), target: 'bee',
        act: async (K, o) => { await run((r) => o.sp.visit(o.bee, 1, r)); K.lab.emit('pollinate', { obj: o.sp.id }); }, ev: { type: 'pollinate' },
        see: X('Some of the pollen from flower 1 rubs off onto flower 2, and the bee picks up fresh pollen.'), why: X('Moving pollen from the anther of one flower to the stigma of another is called pollination. Insects do it while they feed on nectar.') },
      { do: X('Try to take the bee to flower 3, in the net bag.'), target: 'bee',
        act: async (K, o) => { await run((r) => o.sp.visit(o.bee, 2, r)); K.lab.emit('net', { obj: o.sp.id }); }, ev: { type: 'net' }, see: X('The bee cannot get through the net.') },
      { do: X('Carry the bee to flower 4, then flower 5, and back to flower 1.'), target: 'bee',
        act: async (K, o) => { for (const i of [3, 4, 0]) await run((r) => o.sp.visit(o.bee, i, r)); K.lab.emit('pollinate', { obj: o.sp.id }); }, ev: { type: 'pollinate' }, until: (K, o) => [0, 1, 3, 4].every((i) => o.sp.plants[i].f > 0.3),
        see: X('Each flower it visits gets pollen from the flower before. Flower 1, the first one, gets pollen only now, from flower 5.') },
      { do: X('Slide the calendar on three weeks.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.sp.setT(3 * k)); o.sp.setT(3); K.lab.emit('w3', { obj: o.sp.id }); }, ev: { type: 'w3' },
        see: X('The petals dry and the heads bow down. The flowers the bee pollinated are full of dark, plump seeds. The flower in the net bag has only pale, empty seeds.'),
        why: X('A flower makes seeds only after it is pollinated and fertilised. No pollen reached the bagged flower.') },
      { do: X('Look closely at the flower heads and compare them.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look2' },
        check: (K, o) => { const pl = o.sp.plants; const odd = pl.filter((p, i) => i !== 2 && p.f < 0.3).map((p) => o.sp.plants.indexOf(p) + 1); return odd.length ? { ok: false, see: { en: `Flower ${odd.join(', ')} got no pollen from another flower, so it has few seeds.`, hi: `फूल ${odd.join(', ')} को किसी दूसरे फूल का पराग नहीं मिला, इसलिए उसमें बहुत कम बीज बने।`, hg: `Phool ${odd.join(', ')} ko kisi doosre phool ka paraag nahi mila, isliye usmein bahut kam beej bane.` }, why: X('Only the flowers the bee reached after visiting another flower were pollinated.') } : null; },
        see: X('Count the full seeds: the visited flowers have plenty; the bagged one almost none.') },
    ],
    eq: { word: 'Pollination', sym: 'pollen (anther) → stigma of another flower → fertilisation → seeds' },
    result: { obs: X('The bee carried pollen from flower to flower. Three weeks later the pollinated sunflowers were full of seeds; the one in the net bag had empty seeds.'),
      concl: X('Insects such as bees and butterflies pollinate flowers while feeding on nectar. Without pollination there are no seeds or fruits, so pollinators are very important for our crops.'),
      safety: X('Do not catch bees: they can sting. Watch them from a little distance.'),
      viva: [{ q: X('What is pollination?'), a: X('The transfer of pollen from the anther to the stigma of a flower.') }, { q: X('Why did the bagged flower have no seeds?'), a: X('No pollen could reach it.') }, { q: X('Name two pollinators.'), a: X('Bees and butterflies.') }] },
  },
  // ============================================================ Class 8 · soil erosion when plants are removed
  {
    id: 'bw8_erosion', subj: 'biology', cls: 8, ch: C8h, world: true, place: 'forest', table: false, topic: 'eco',
    title: X('Cut the plants, lose the soil: rain on two slopes'),
    aim: X('To pull every plant out of one plot on a forest slope with your own hand, let heavy rain fall on both plots, and compare how much water and soil runs off each.'),
    kind: X('Deforestation and soil erosion'),
    setup(K) {
      const W = Wd(K);
      const sp = K.add(B4.slopePlots({ W }), 0, 0, { y: 0 });
      const S = B4.SLOPE, rr = [[0.3, -1.12], [0.68, -1.25], [0.45, -1.42], [0.25, -1.7], [0.72, -1.78], [0.5, -2.0], [0.32, -2.28], [0.66, -2.3]];
      const plants = rr.map(([x, z], i) => { const nm = i % 3 === 1 ? 'fern_02' : 'grass_medium_02'; return K.add(BW.organism(nm, N(i % 3 === 1 ? 'Fern' : 'Grass', i % 3 === 1 ? 'फ़र्न' : 'घास', i % 3 === 1 ? 'Fern' : 'Ghaas'), { k: nm === 'fern_02' ? 0.45 : 0.9, hitR: 0.1, hitY: 0.08 }), x, z, { y: sp.yAt(z) - 0.01 }); });
      const knob = K.add(MW.pullTab(), 0, -0.4);
      const W2 = Wd(K);
      B4.bindSlope(sp, plants, K.app, { clear: 1 }, { pulled: (n, of) => { sp.say([`${W2('Plants pulled out')}: ${n} / ${of}`], n === of ? OK : '#ffffff'); if (n === of) K.lab.emit('cleared', { obj: sp.id }); } });
      B4.bindTimeHands(sp, knob, K.app, { rain: 2 }, { end: emit(K, sp, 'rain') });
      camBy(sp, K.app, [sp.views.all, sp.views.right, sp.views.all, sp.views.buckets, sp.views.right]);
      void S; return { sp, knob, plant: plants[0], plants };
    },
    steps: [
      { do: X('Two plots of soil on a forest slope, side by side. Both are covered with grass and ferns; on the right one, the trees were cut down long ago.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look' }, see: X('A bucket stands at the foot of each plot to catch what runs off it.') },
      { do: X('Pull every plant out of the right plot and throw it aside, as when a forest is cleared.'), target: 'plant',
        act: async (K, o) => { const pile = V3(K, 1.25, 0, -1.15); for (const p of o.plants) if (!p.used) { p.used = true; p.placed = true; await new Promise((r) => BW.flyTo(p, pile.clone().add(V3(K, (o.sp.cleared % 3) * 0.12 - 0.12, 0.02, 0)), 1, 0.35, r)); o.sp.cleared++; } K.lab.emit('cleared', { obj: o.sp.id }); }, ev: { type: 'cleared' },
        see: X('The right plot is now bare soil.') },
      { do: X('Slide the clock: one hour of heavy rain falls on both plots.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.sp.setT(k)); o.sp.setT(1); K.lab.emit('rain', { obj: o.sp.id }); }, ev: { type: 'rain' },
        check: (K, o) => (o.sp.cleared < o.sp.nPlants ? { ok: false, see: X('Some plants are still on the right plot, so less soil washed off it.'), why: X('Each plant left holds some soil. Clear them all to see what happens to bare land.') } : null),
        see: X('On the bare plot muddy water rushes down and cuts little channels in the soil. On the plot with plants the rain soaks in; only a little clear water trickles off.') },
      { do: X('Look into the two buckets.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('The bucket below the bare plot is much fuller, of brown muddy water, with a thick layer of soil settled at the bottom. The other has a little clearer water.'),
        why: X('Roots bind the soil and plants break the force of the rain, so the water soaks in. On bare land rain washes the fertile topsoil away. This is soil erosion.') },
      { do: X('Look at the slope of the bare plot.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look3', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look3' },
        see: X('Deep channels (gullies) are cut into it. The topsoil is gone.'), why: X('When forests are cut, the soil is washed away, the land becomes barren, and the rain runs off fast and can cause floods downstream.') },
    ],
    eq: { word: 'Plants removed', sym: '→ more runoff, soil washed away (erosion), less water soaks in' },
    result: { obs: X('Rain on the bare plot ran off fast, muddy, and carried a lot of soil into its bucket. Rain on the plot with plants soaked in; little clear water ran off.'),
      concl: X('Plants and their roots hold the soil and help rainwater soak into the ground. Cutting down forests (deforestation) leads to soil erosion, floods and loss of fertile land, so forests must be conserved and trees planted.'),
      safety: X('Keep away from steep, muddy slopes in heavy rain: they can slide.'),
      viva: [{ q: X('What is soil erosion?'), a: X('The washing or blowing away of the top layer of soil.') }, { q: X('How do plants prevent it?'), a: X('Their roots bind the soil and they slow down the rainwater.') }, { q: X('Give one way to conserve soil.'), a: X('Plant trees and grass on bare land (afforestation).') }] },
  },
];
