// DUET Science Lab 360, biology in real places, batch BW1: ecosystems. A food chain built by hand at a village pond,
// pesticide building up along it, the 10 per cent law on an energy pyramid in a grassland, decomposers at work on a
// forest floor over eight weeks, and sorting living and non-living things in the forest.
import { DICT } from './exp_i18n.js';
import { DICT_BW1 } from './exp_i18n_bw1.js';
import * as MW from './mathworld.js';
import * as BW from './bioworld1.js';
import * as BW2 from './bioworld2.js';
Object.assign(DICT, DICT_BW1);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const OK = '#8be07a', WARN = '#ffb46b';
const B10 = N('Ch 13 · Our Environment', 'अध्याय 13 · हमारा पर्यावरण', 'Ch 13 · Our Environment');
const B6 = N('Ch 10 · Living Creatures: Exploring their Characteristics', 'अध्याय 10 · सजीव: उनकी विशेषताओं की खोज', 'Ch 10 · Living Creatures: unki khoobiyon ki khoj');
const nm = (K, it) => tl(K, it.name);
const BY = { y: 0.9 }; // things put on the table

export const EXPERIMENTS_BW1 = [
  {
    id: 'bw10_pond_chain', subj: 'biology', cls: 10, ch: B10, world: true, place: 'pond', table: true, topic: 'eco',
    title: X('A food chain at the village pond, by hand'),
    aim: X('To pick living things out of a real pond with your own hand, put them in the order of who eats whom, and see how much energy reaches each step.'),
    kind: X('Food chains and trophic levels'),
    setup(K) {
      const W = Wd(K), P = BW.POND;
      const pond = K.add(BW.pondScene({ W }), 0, 0, { y: 0 });
      const board = K.add(BW.chainBoard({ W, n: 4, width: 1.6, bowls: [2], first: 'Who makes the food in the pond?' }), 0, -0.68);
      const algae = K.add(BW.algaeClump(N('Green algae (Spirogyra)', 'हरे शैवाल (स्पाइरोगाइरा)', 'Green algae (Spirogyra)')), -0.85, -1.62, { y: P.wy + 0.002 });
      const snail = K.add(BW.organism('snail', N('Pond snail', 'तालाब का घोंघा', 'Pond snail'), { face: [1, 0.3], hitR: 0.06, k: 1.5 }), 0.32, P.c.z + P.R * 0.78, { y: P.wy + 0.006 });
      const fish = K.add(BW.organism('bluegill', N('Small fish', 'छोटी मछली', 'Chhoti machhli'), { hitR: 0.1, hitY: 0.04, swim: { x: 0.1, z: -1.86, rx: 0.6, rz: 0.17, y: -0.17, w: 0.45 } }), 0.7, -1.86, { y: -0.17 });
      const king = K.add(BW.organism('kingfisher', N('Kingfisher', 'किंगफ़िशर (राम चिरैया)', 'Kingfisher'), { h: 0.24, face: [-0.7, 1], hitR: 0.1, hitY: 0.12 }), 1.55, -1.55, { y: 0.95 });
      algae.seat = 0.0; snail.seat = 0.0; fish.seat = 0.07; king.seat = 0.0; fish.seatYaw = 0;
      algae.at = 0; snail.at = 1; fish.at = 2; king.at = 3;
      pond.camView = { p: V3(K, 0, 2.05, 1.35), t: V3(K, 0, 0.35, -2.0) };
      const SG = [[W('Algae: producer'), '10,000 kJ'], [W('Snail: herbivore'), '1,000 kJ'], [W('Small fish: carnivore'), '100 kJ'], [W('Kingfisher: top carnivore'), '10 kJ']];
      const fin = { link: (i) => { board.show(i, SG[i], ['#ffffff', '#ffd23f']); board.say([i < 3 ? W(['Who eats algae?', 'Who eats snails?', 'Who catches small fish?'][i]) : W('The chain is complete')], i < 3 ? '#ffffff' : OK); K.lab.emit('link', { obj: board.id }); } };
      const ch = BW.bindChain(board, [algae, snail, fish, king], K.app, [1, 2, 3, 4], { W, link: fin.link,
        wrong: (org, want) => board.say([`${nm(K, org)}: ${W('not this one yet')}`, want ? `${W('Look for')}: ${nm(K, want)}` : ''], WARN) });
      return { pond, board, algae, snail, fish, king, fin, ch };
    },
    steps: [
      { do: X('This is a village pond. Look around: green algae on the water, snails on the lily pads, fish, a toad, a dragonfly, a turtle on a log and a kingfisher on its perch.'), target: 'pond',
        act: async (K, o) => { K.lab.emit('look', { obj: o.pond.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('All of them live together in the pond with the water, soil, air and sunlight: this is an ecosystem.') },
      { do: X('Algae make their own food from sunlight. Pick up the green algae and put them on the first mat.'), target: 'algae',
        act: async (K, o) => { await new Promise((r) => o.ch.placeOn(o.algae, 0, r)); o.fin.link(0); }, ev: { type: 'link' }, see: X('Algae are producers. Of the sunlight falling on them they store only about 1%: here, 10,000 kJ.') },
      { do: X('Who eats algae? Pick up the snail from its lily pad and put it on the next mat.'), target: 'snail',
        act: async (K, o) => { await new Promise((r) => o.ch.placeOn(o.snail, 1, r)); o.fin.link(1); }, ev: { type: 'link' }, see: X('The snail is a herbivore (primary consumer). Only about 10% of the energy, 1,000 kJ, reaches it.') },
      { do: X('Who eats snails? Catch the small fish and put it in the bowl.'), target: 'fish',
        act: async (K, o) => { await new Promise((r) => o.ch.placeOn(o.fish, 2, r)); o.fin.link(2); }, ev: { type: 'link' }, see: X('The small fish is a carnivore (secondary consumer). It gets about 100 kJ.') },
      { do: X('Who catches small fish? Take the kingfisher from its perch and put it on the last mat.'), target: 'king',
        act: async (K, o) => { await new Promise((r) => o.ch.placeOn(o.king, 3, r)); o.fin.link(3); }, ev: { type: 'link' }, see: X('The kingfisher is the top carnivore. Only about 10 kJ reaches it.') },
      { do: X('Watch the energy flow along the chain.'), target: 'board',
        act: async (K, o) => { for (let i = 0; i < 3; i++) await new Promise((r) => o.board.flow(i, i + 1, r)); o.board.say([K.app.lang === 'en' ? '10,000 → 1,000 → 100 → 10 kJ' : '10,000 → 1,000 → 100 → 10 kJ', Wd(K)('about 90% is lost at every step')], ['#ffd23f', WARN]); K.lab.emit('flow', { obj: o.board.id }); await K.sleep(1.5); },
        ev: { type: 'flow' }, see: X('At each step about 90% of the energy is used up in living and lost as heat. That is why food chains have only 3 or 4 steps.') },
    ],
    eq: { word: 'Algae → Snail → Small fish → Kingfisher', sym: '10,000 → 1,000 → 100 → 10 kJ (10% law)' },
    result: { obs: X('Algae, snail, small fish and kingfisher made a food chain of four steps. The energy reaching each step was about one tenth of the step before.'),
      concl: X('A food chain shows who eats whom. Producers make food from sunlight; consumers get it by eating. Only about 10% of the energy passes to the next level, so food chains are short.'),
      safety: X('Never go into a pond alone. Wash your hands after touching pond water.'),
      viva: [{ q: X('What are the organisms that make their own food called?'), a: X('Producers.') }, { q: X('What is a trophic level?'), a: X('Each step of a food chain.') }, { q: X('Why are food chains short?'), a: X('Only about 10% of the energy passes to the next level.') }] },
  },
  {
    id: 'bw10_pesticide', subj: 'biology', cls: 10, ch: B10, world: true, place: 'pond', table: true, topic: 'eco',
    title: X('Pesticide in the pond: biological magnification'),
    aim: X('To let pesticide from the fields run into the pond, test the water and each living thing with a tester, and see the pesticide build up along the food chain.'),
    kind: X('Biological magnification'),
    setup(K) {
      const W = Wd(K), P = BW.POND;
      const pond = K.add(BW.pondScene({ W }), 0, 0, { y: 0 });
      const algae = K.add(BW.algaeClump(N('Green algae', 'हरे शैवाल', 'Green algae')), -0.6, -1.65, { y: P.wy + 0.002 });
      const fish = K.add(BW.organism('bluegill', N('Small fish', 'छोटी मछली', 'Chhoti machhli'), { swim: { x: 0.1, z: -2.0, rx: 0.55, rz: 0.2, y: -0.16, w: 0.4 } }), 0.6, -2.0, { y: -0.16 });
      const bass = K.add(BW.organism('bass', N('Big fish', 'बड़ी मछली', 'Badi machhli'), { swim: { x: -0.1, z: -2.6, rx: 0.8, rz: 0.35, y: -0.3, w: -0.32 } }), 0.7, -2.6, { y: -0.3 });
      const king = K.add(BW.organism('kingfisher', N('Kingfisher', 'किंगफ़िशर (राम चिरैया)', 'Kingfisher'), { h: 0.24, face: [-0.7, 1] }), 1.55, -1.55, { y: 0.95 });
      [algae, fish, bass, king].forEach((x) => { x.noGrab = true; });
      const wp = () => V3(K, 1.1, P.wy, -2.0);
      const kit = K.add(BW.pesticideKit({ W, chartX: -0.55, targets: [wp, () => algae.g.position.clone(), () => fish.g.position.clone().setY(P.wy), () => bass.g.position.clone().setY(P.wy), () => king.g.position.clone().add(V3(K, 0, 0.12, 0))] }), 0, 0, { y: 0 });
      const slide = K.add(MW.pullTab(), 0.35, -0.45), push = K.add(MW.pullTab(), 0.85, -0.45);
      kit.knobPath = () => [V3(K, 0.2, 0.92, -0.45), V3(K, 0.55, 0.92, -0.45)]; kit.pushPath = () => [V3(K, 0.85, 0.92, -0.62), V3(K, 0.85, 0.92, -0.42)];
      pond.camView = { p: V3(K, 0.2, 2.0, 1.3), t: V3(K, 0.2, 0.4, -1.9) };
      const SAY = ['Water', 'Algae', 'Small fish', 'Big fish', 'Kingfisher'];
      const fin = { poured: () => { if (kit.tested) return; kit.test(0, () => { kit.say([`${W('Water')}: 0.000003 ppm`], '#ffffff'); K.lab.emit('poured', { obj: kit.id }); }); },
        tested: (i) => { kit.say([`${W(SAY[i])}: ${BW.ppm([0.000003, 0.04, 0.5, 2, 25][i])} ppm`], i === 4 ? '#ff7a6a' : '#ffffff'); K.lab.emit('tested', { obj: kit.id }); } };
      BW.bindPesticideHands(kit, slide, push, K.app, { pour: 1, t1: 2 }, fin);
      return { pond, kit, slide, push, algae, fish, bass, king, fin };
    },
    steps: [
      { do: X('A drain from the fields runs into the pond. After the rain it brings pesticide (DDT) that was sprayed on the crops.'), target: 'kit',
        act: async (K, o) => { K.lab.emit('look', { obj: o.kit.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The tester measures pesticide in parts per million (ppm).') },
      { do: X('Slide the handle to let the drain water run into the pond. Then the water is tested.'), target: 'slide',
        act: async (K, o) => { await K.tween(2, (k) => o.kit.setPour(k)); o.kit.setPour(1); await new Promise((r) => { const w = () => (o.kit.tested ? r() : setTimeout(w, 100)); o.fin.poured(); w(); }); },
        ev: { type: 'poured' }, see: X('The water has only 0.000003 ppm: far too little to harm anything.') },
      { do: X('Push the button: test the algae.'), target: 'push',
        act: async (K, o) => { await new Promise((r) => o.kit.test(1, r)); o.fin.tested(1); }, ev: { type: 'tested' }, see: X('Algae: 0.04 ppm, more than 10,000 times the water. They take it in and do not get rid of it.') },
      { do: X('Push again: test the small fish.'), target: 'push',
        act: async (K, o) => { await new Promise((r) => o.kit.test(2, r)); o.fin.tested(2); }, ev: { type: 'tested' }, see: X('Small fish: 0.5 ppm. Each fish eats a great deal of algae, and keeps the pesticide in its fat.') },
      { do: X('Push again: test the big fish.'), target: 'push',
        act: async (K, o) => { await new Promise((r) => o.kit.test(3, r)); o.fin.tested(3); }, ev: { type: 'tested' }, see: X('Big fish: 2 ppm.') },
      { do: X('Push again: test the kingfisher.'), target: 'push',
        act: async (K, o) => { await new Promise((r) => o.kit.test(4, r)); o.fin.tested(4); }, ev: { type: 'tested' }, see: X('Kingfisher: 25 ppm, about 8 million times the water. Enough to make its eggshells thin and break.') },
    ],
    eq: { word: 'Water → Algae → Small fish → Big fish → Kingfisher', sym: '0.000003 → 0.04 → 0.5 → 2 → 25 ppm' },
    result: { obs: X('The pesticide in the water was tiny, but it went up at every step of the food chain: the kingfisher had the most.'),
      concl: X('Pesticides that are not broken down build up in living things and increase at each level of a food chain. This is biological magnification; the top carnivores (and people) are harmed most.'),
      safety: X('Never touch pesticides. Wash fruit and vegetables well before eating.'),
      viva: [{ q: X('What is biological magnification?'), a: X('The build-up of a harmful chemical at each higher level of a food chain.') }, { q: X('Which level has the most pesticide?'), a: X('The top level.') }, { q: X('Why does it build up?'), a: X('It is not broken down or passed out, and each eater eats many of the level below.') }] },
  },
  {
    id: 'bw10_energy_pyramid', subj: 'biology', cls: 10, ch: B10, world: true, place: 'grass', table: false, topic: 'eco',
    title: X('Energy in a grassland: the 10 per cent law'),
    aim: X('To pass the energy of sunlight up a grassland food chain step by step with your own hand, and see how little reaches the top.'),
    kind: X('Flow of energy in an ecosystem'),
    setup(K) {
      const py = K.add(BW2.energyPyramid({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      py.camView = { p: V3(K, 0.3, 1.75, 1.6), t: V3(K, 0, 0.75, -2.1) };
      BW2.bindPyramidHands(py, lever, K.app, { first: 1 }, { passed: () => K.lab.emit('passed', { obj: py.id }) });
      return { py, lever };
    },
    steps: [
      { do: X('A grassland at noon. On the stand: grass, a grasshopper, a frog, a snake and a hawk, one on each step.'), target: 'py',
        act: async (K, o) => { K.lab.emit('look', { obj: o.py.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Grass is eaten by grasshoppers, grasshoppers by frogs, frogs by snakes, snakes by hawks.') },
      { do: X('Push the lever: sunlight falls on the grass.'), target: 'lever',
        act: async (K, o) => { await new Promise((r) => o.py.pass(0, r)); K.lab.emit('passed', { obj: o.py.id }); }, ev: { type: 'passed' }, see: X('The grass stores about 1% of the sunlight as food: 10,000 kJ.') },
      { do: X('Push again: the grasshopper eats the grass.'), target: 'lever',
        act: async (K, o) => { await new Promise((r) => o.py.pass(1, r)); K.lab.emit('passed', { obj: o.py.id }); }, ev: { type: 'passed' }, see: X('Only 1,000 kJ reaches the grasshopper. The other 9,000 kJ was used by the grass to live, or not eaten, and ends as heat.') },
      { do: X('Push again: the frog eats grasshoppers.'), target: 'lever',
        act: async (K, o) => { await new Promise((r) => o.py.pass(2, r)); K.lab.emit('passed', { obj: o.py.id }); }, ev: { type: 'passed' }, see: X('100 kJ reaches the frog.') },
      { do: X('Push again: the snake eats the frog.'), target: 'lever',
        act: async (K, o) => { await new Promise((r) => o.py.pass(3, r)); K.lab.emit('passed', { obj: o.py.id }); }, ev: { type: 'passed' }, see: X('10 kJ reaches the snake.') },
      { do: X('Push again: the hawk catches the snake.'), target: 'lever',
        act: async (K, o) => { await new Promise((r) => o.py.pass(4, r)); K.lab.emit('passed', { obj: o.py.id }); }, ev: { type: 'passed' }, see: X('Only 1 kJ reaches the hawk: one ten-thousandth of what the grass stored.') },
    ],
    eq: { word: '10% law', sym: '10,000 → 1,000 → 100 → 10 → 1 kJ' },
    result: { obs: X('At each step up the chain only about a tenth of the energy reached the next level; the rest was lost as heat.'),
      concl: X('Energy flows one way, from the sun to producers to consumers, and about 10% passes from one trophic level to the next. So there are many plants, fewer herbivores and very few top carnivores.'),
      safety: X('Watch out for snakes in tall grass; walk on paths.'),
      viva: [{ q: X('What is the 10 per cent law?'), a: X('Only about 10% of the energy at one trophic level passes to the next.') }, { q: X('Where does the rest of the energy go?'), a: X('It is used in life processes and lost as heat.') }, { q: X('Can energy flow back from the hawk to the grass?'), a: X('No, energy flows in one direction only.') }] },
  },
  {
    id: 'bw10_decomposers', subj: 'biology', cls: 10, ch: B10, world: true, place: 'forest', table: false, topic: 'eco',
    title: X('Who cleans up the forest floor? Decomposers at work'),
    aim: X('To move a forest floor through eight weeks with your own hand, watch fungi, bacteria and earthworms break dead things down, and see what is never broken down.'),
    kind: X('Decomposers; biodegradable and non-biodegradable'),
    setup(K) {
      const W = Wd(K);
      const ff = K.add(BW2.forestFloor({ W }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      ff.camView = { p: V3(K, 0, 1.15, 0.05), t: V3(K, 0, 0.12, -1.45) };
      ff.onWeek = (w) => ff.say([`${W('Week')} ${Math.round(w)}`, w < 2 ? W('fresh dead leaves') : w < 5 ? W('fungi and bacteria at work') : w < 7.5 ? W('leaves turning into humus') : W('rich dark soil (humus)')], ['#ffffff', '#ffd23f']);
      BW2.bindFloorHands(ff, knob, K.app, { w4: 1, w8: 2 }, { w4: () => K.lab.emit('w4', { obj: ff.id }), w8: () => K.lab.emit('w8', { obj: ff.id }) });
      return { ff, knob };
    },
    steps: [
      { do: X('A patch of forest floor: fallen leaves, a fallen log, a dead beetle, a plastic bottle and a polythene bag.'), target: 'ff',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ff.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Nobody sweeps the forest. What happens to all this?') },
      { do: X('Slide the calendar to week 4.'), target: 'knob',
        act: async (K, o) => { await K.tween(3, (k) => o.ff.setWeek(4 * k)); o.ff.setWeek(4); K.lab.emit('w4', { obj: o.ff.id }); }, ev: { type: 'w4' }, see: X('Mushrooms have come up, a bracket fungus grows on the log and earthworms pull leaves down. Fungi and bacteria are eating the dead leaves and the beetle.') },
      { do: X('Slide on to week 8.'), target: 'knob',
        act: async (K, o) => { await K.tween(3, (k) => o.ff.setWeek(4 + 4 * k)); o.ff.setWeek(8); K.lab.emit('w8', { obj: o.ff.id }); }, ev: { type: 'w8' }, see: X('The leaves and the beetle are gone: they have become dark humus. Their nutrients are back in the soil for the plants.') },
      { do: X('Look at the bottle and the bag.'), target: 'ff',
        act: async (K, o) => { o.ff.say([Wd(K)('Bottle and bag: unchanged after 8 weeks')], WARN); K.lab.emit('plastic', { obj: o.ff.id }); await K.sleep(2); }, ev: { type: 'plastic' }, see: X('The plastic is exactly as it was. No decomposer can break it down: it can stay for hundreds of years.') },
    ],
    eq: { word: 'Dead leaves + decomposers', sym: '→ humus + nutrients back to the soil' },
    result: { obs: X('In eight weeks the leaves and the dead beetle were broken down into humus by fungi, bacteria and earthworms. The plastic bottle and bag did not change.'),
      concl: X('Decomposers break down dead plants and animals and return nutrients to the soil. Things that decomposers can break down are biodegradable; plastic is non-biodegradable and stays in the environment.'),
      safety: X('Do not touch wild mushrooms: some are poisonous.'),
      viva: [{ q: X('Name two decomposers.'), a: X('Bacteria and fungi.') }, { q: X('What would happen without decomposers?'), a: X('Dead things would pile up and nutrients would not return to the soil.') }, { q: X('Is a polythene bag biodegradable?'), a: X('No, it is non-biodegradable.') }] },
  },
  {
    id: 'bw6_living_sort', subj: 'biology', cls: 6, ch: B6, world: true, place: 'forest', table: true, topic: 'living',
    title: X('Living or non-living? Sorting things in the forest'),
    aim: X('To pick up things found in a forest with your own hand and put each in the basket where it belongs, living or non-living, and say why.'),
    kind: X('Characteristics of living things'),
    setup(K) {
      const W = Wd(K);
      const bk = K.add(BW2.sortBaskets({ W }), 0, -0.72);
      const snail = K.add(BW.organism('snail', N('Snail', 'घोंघा', 'Ghongha'), { face: [1, 0.4], hitR: 0.06, k: 1.4 }), -1.08, -0.6, BY);
      const stone = K.add(BW.organism(null, N('Stone', 'पत्थर', 'Patthar'), { group: BW2.stoneGroup(), hitR: 0.08 }), -0.85, -0.85, BY);
      const shroom = K.add(BW.organism('parasol', N('Mushroom', 'मशरूम (कुकुरमुत्ता)', 'Mushroom'), { h: 0.13, hitR: 0.08, hitY: 0.07 }), -0.12, -0.55, BY);
      const bark = K.add(BW.organism('bark_debris_01', N('Dead bark', 'पेड़ की सूखी छाल', 'Sookhi chhaal'), { k: 0.22, hitR: 0.09 }), 0.13, -0.95, BY);
      const fern = K.add(BW.organism(null, N('Fern in a pot', 'गमले में फ़र्न', 'Gamle mein fern'), { group: BW2.potFern(), hitR: 0.09, hitY: 0.08 }), 0.85, -0.85, BY);
      const bottle = K.add(BW.organism(null, N('Plastic bottle', 'प्लास्टिक की बोतल', 'Plastic ki botal'), { group: BW2.bottleGroup(), hitR: 0.07, hitY: 0.1 }), 1.08, -0.6, BY);
      const things = [snail, stone, shroom, bark, fern, bottle]; [true, false, true, false, true, false].forEach((l, i) => { things[i].living = l; });
      bk.camView = { p: V3(K, 0, 0.85, 1.5), t: V3(K, 0, -0.05, -0.1) }; // (relative to the baskets on the table)
      const WHY = ['It moves, eats, breathes, grows and lays eggs.', 'It does not eat, breathe, grow or have young.', 'It does not move, but it grows, breathes, feeds on dead things and spreads spores.', 'It was part of a living tree, but now it is dead: it does not grow or breathe.', 'It makes its own food, breathes and grows.', 'It was never alive: it is made by people.'];
      const sorted = (t) => { const i = things.indexOf(t); bk.say([`${nm(K, t)}: ${W(t.living ? 'Living' : 'Non-living')}`, W(WHY[i])], [t.living ? OK : '#9ec9ff', '#ffffff']); K.lab.emit('sorted', { obj: bk.id }); };
      const S = BW2.bindSortHands(bk, things, K.app, [1, 2, 3, 4, 5, 6], { sorted, wrong: (t, liv) => bk.say([`${nm(K, t)}: ${W(liv ? 'not living. Think again' : 'it is living. Think again')}`], WARN) });
      return { bk, snail, stone, shroom, bark, fern, bottle, S, sorted };
    },
    steps: [
      { do: X('Look at the things on the table, found in the forest: a snail, a stone, a mushroom, dead bark, a fern and a plastic bottle.'), target: 'bk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bk.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Living things move, need food, breathe, grow, respond and have young.') },
      { do: X('Pick up the snail and put it in the right basket.'), target: 'snail', act: async (K, o) => { await new Promise((r) => o.S.put(o.snail, r)); o.sorted(o.snail); }, ev: { type: 'sorted' }, see: X('The snail is living.') },
      { do: X('Now the stone.'), target: 'stone', act: async (K, o) => { await new Promise((r) => o.S.put(o.stone, r)); o.sorted(o.stone); }, ev: { type: 'sorted' }, see: X('The stone is non-living.') },
      { do: X('Now the mushroom. It cannot move: is it living?'), target: 'shroom', act: async (K, o) => { await new Promise((r) => o.S.put(o.shroom, r)); o.sorted(o.shroom); }, ev: { type: 'sorted' }, see: X('The mushroom is living: a fungus. It grows, breathes and reproduces with spores.') },
      { do: X('Now the dead bark.'), target: 'bark', act: async (K, o) => { await new Promise((r) => o.S.put(o.bark, r)); o.sorted(o.bark); }, ev: { type: 'sorted' }, see: X('Dead bark is non-living now, although it was once part of a living tree.') },
      { do: X('Now the fern.'), target: 'fern', act: async (K, o) => { await new Promise((r) => o.S.put(o.fern, r)); o.sorted(o.fern); }, ev: { type: 'sorted' }, see: X('The fern is a living plant. Plants do not walk about, but they grow, breathe and make food.') },
      { do: X('Last, the plastic bottle.'), target: 'bottle', act: async (K, o) => { await new Promise((r) => o.S.put(o.bottle, r)); o.sorted(o.bottle); }, ev: { type: 'sorted' }, see: X('The bottle is non-living: it was never alive.') },
    ],
    eq: { word: 'Living things', sym: 'move · need food · breathe · grow · respond · reproduce · die' },
    result: { obs: X('The snail, the mushroom and the fern went in the living basket; the stone, the dead bark and the bottle in the non-living basket.'),
      concl: X('Living things show all the signs of life: they need food, breathe, grow, respond to their surroundings, reproduce and die. Some living things, like plants and fungi, do not move from place to place.'),
      safety: X('Do not pick wild mushrooms or touch animals in the wild.'),
      viva: [{ q: X('Name two signs of life in a plant.'), a: X('It grows and it makes its own food.') }, { q: X('Is a seed living?'), a: X('Yes: it is alive but resting, and grows when it gets water.') }, { q: X('Is a fallen dry leaf living?'), a: X('No, it is dead.') }] },
  },
];
