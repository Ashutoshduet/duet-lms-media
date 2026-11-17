// DUET Science Lab 360, batch BW4 (the ocean and animals), part 2: the five classes of animals with a backbone, life
// cycles in still water, the beaks and feet of birds, animals hidden by their colours, salt from the sea, and a whale's
// blubber. Scenes in oceanworld2.js and oceanworld3.js; Hindi and Hinglish in exp_i18n_bw4.js.
import * as THREE from 'three';
import { DICT } from './exp_i18n.js';
import { DICT_BW4 } from './exp_i18n_bw4.js';
import * as MW from './mathworld.js';
import { pushKnob as BW_push } from './mathworld3.js';
import * as BW from './bioworld1.js';
import { lens } from './biobench2.js';
import * as O1 from './oceanworld1.js';
import * as O2 from './oceanworld2.js';
import * as O3 from './oceanworld3.js';
Object.assign(DICT, DICT_BW4);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => tl(K, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const BY = { y: 0.9 };
const run = (f) => new Promise((r) => { if (f(r) === false) r(); });
const camBy = (it, app, views) => { const u0 = it.update; let last = -1; it.update = (dt, t) => { const i = app.runner.i; if (i !== last) { last = i; const v = views[i]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; };
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
// a step finished by hand earlier is judged again when the student puts something right later
const rejudge = (K, i) => { const r = K.app.runner; if (r.done && r.done.has(i)) { r.judge(i); r.changed(); } };
const C9D = N('Ch 7 · Diversity in Living Organisms (older NCERT, Class 9)', 'अध्याय 7 · जीवों में विविधता (पुरानी NCERT, कक्षा 9)', 'Ch 7 · Jeevon mein vividhta (purani NCERT, Class 9)');
const C6d = N('Ch 2 · Diversity in the Living World', 'अध्याय 2 · सजीव जगत में विविधता', 'Ch 2 · Living world mein diversity');
const C6s = N('Ch 9 · Methods of Separation in Everyday Life', 'अध्याय 9 · दैनिक जीवन में पृथक्करण की विधियाँ', 'Ch 9 · Rozmarra ki zindagi mein alag karne ke tareeke');
const C8h = N('Ch 3 · Health: The Ultimate Treasure', 'अध्याय 3 · स्वास्थ्य: सबसे बड़ा ख़ज़ाना', 'Ch 3 · Health: sabse bada khazana');

// ------------------------------------------------------------------ names
const VN = { fish: N('Small fish in a basin', 'बेसिन में छोटी मछली', 'Basin mein chhoti machhli'), frog: N('Frog on a wet stone', 'गीले पत्थर पर मेंढक', 'Geele patthar par mendhak'), gecko: N('House gecko on bark', 'छाल पर छिपकली', 'Chhaal par chhipkali'),
  kingfisher: N('Kingfisher on a perch', 'डंडी पर किलकिला', 'Dandi par kilkila (kingfisher)'), hare: N('Hare', 'खरगोश', 'Khargosh') };
const CLN = { pisces: N('Pisces', 'मत्स्य (पिसीज़)', 'Pisces (machhliyan)'), amphibia: N('Amphibia', 'उभयचर (एम्फ़ीबिया)', 'Amphibia (ubhaychar)'), reptilia: N('Reptilia', 'सरीसृप (रेप्टीलिया)', 'Reptilia (sareesrip)'), aves: N('Aves', 'पक्षी (एवीज़)', 'Aves (pakshi)'), mammalia: N('Mammalia', 'स्तनधारी (मैमेलिया)', 'Mammalia (stanadhaari)') };
const VWHY = { fish: X('A fish has scales and fins, breathes with gills and is cold-blooded: Pisces.'), frog: X('A frog has moist skin without scales; it lays its eggs in water and its young (tadpoles) breathe with gills: Amphibia.'),
  gecko: X('A gecko has dry skin covered in scales, breathes with lungs, is cold-blooded and lays eggs with a shell on land: Reptilia.'), kingfisher: X('A kingfisher has feathers, a beak and wings, and is warm-blooded: Aves.'), hare: X('A hare has fur, is warm-blooded and feeds its young on milk: Mammalia.') };
const FOODN = { grain: N('Grain', 'अनाज के दाने', 'Anaaj ke daane'), fish: N('Small fish', 'छोटी मछली', 'Chhoti machhli'), grubs: N('Grubs in bark', 'छाल में कीड़े (लार्वा)', 'Chhaal mein keede (grubs)'), lizard: N('Lizard', 'छिपकली', 'Chhipkali'), snails: N('Snails and duckweed', 'घोंघे और जलीय घास', 'Ghonghe aur duckweed') };
const BIRDN = { sparrow: N('sparrow', 'गौरैया', 'gauraiya (sparrow)'), kingfisher: N('kingfisher', 'किलकिला', 'kilkila (kingfisher)'), duck: N('duck', 'बत्तख', 'battakh'), woodpecker: N('woodpecker', 'कठफोड़वा', 'kathphodwa (woodpecker)'), hawk: N('hawk', 'बाज़', 'baaz (hawk)') };
const FEETN = { perch: ['Perching', 'toes grip a twig'], swim: ['Swimming', 'webbed toes'], climb: ['Climbing', 'two toes front, two back'], grasp: ['Catching prey', 'sharp curved claws'] };
const HIDEN = { stickinsect: N('Stick insect', 'छड़ी कीट', 'Stick insect (chhadi keet)'), locust: N('Grasshopper', 'टिड्डा', 'Tidda (grasshopper)'), gecko: N('Gecko', 'छिपकली', 'Chhipkali (gecko)'), chameleon: N('Chameleon', 'गिरगिट', 'Girgit (chameleon)') };
const CANN = { bare: N('Bare can', 'खुला डिब्बा', 'Khula dibba'), fat: N('Can wrapped in fat', 'चर्बी में लिपटा डिब्बा', 'Charbi mein lipta dibba'), wool: N('Can in a woollen sock', 'ऊनी मोज़े में डिब्बा', 'Ooni moze mein dibba') };
const CANL = { bare: 'Bare', fat: 'Fat', wool: 'Wool' };

export const EXPERIMENTS_BW4B = [
  // ============================================================ Class 9 (6) · five animals with a backbone
  {
    id: 'bw9_vertebrates', subj: 'biology', cls: 9, also: [6], ch: C9D, world: true, place: 'pond', table: true, topic: 'ocean',
    title: X('Five animals with a backbone: test them and sort them into classes'),
    aim: X('To take the temperature of a fish, a frog, a gecko, a kingfisher and a hare on a cold morning, look at their skin through a hand lens, and sort them into the five classes of vertebrates, all with your own hand.'),
    kind: X('Vertebrates: Pisces, Amphibia, Reptilia, Aves, Mammalia'),
    setup(K) {
      const W = Wd(K); K.add(BW.pondScene({ W }), 0, 0, { y: 0 }); const vt = K.add(O2.vertTable({ W }), 0, 0, { y: 0 }); vt.W = W;
      const order = ['hare', 'fish', 'gecko', 'kingfisher', 'frog']; // not in the mats' order: the student has to think
      const an = order.map((k, i) => K.add(O2.vertAnimal(k, VN[k]), vt.XS[i], vt.ZB, BY)); const o = { vt };
      an.forEach((a) => { o[a.vkind] = a; });
      o.gun = K.add(O1.thing(N('Infrared thermometer', 'इन्फ़्रारेड थर्मामीटर', 'Infrared thermometer'), O2.irGun(), { hitR: 0.08, hitY: 0.05 }), -1.12, -0.48, BY);
      o.lens = K.add(lens(), 1.1, -0.48);
      O2.bindVert(vt, an, { gun: o.gun, lens: o.lens }, K.app, { temp: 1, lens: 2, sort: 3 }, {
        temp: () => { if (an.every((a) => a.measured)) K.lab.emit('temp', { obj: vt.id }); }, lens: () => { if (an.every((a) => a.looked)) K.lab.emit('lens', { obj: vt.id }); },
        put: () => { if (an.every((a) => a.on >= 0)) K.lab.emit('sorted', { obj: vt.id }); rejudge(K, 3); } });
      o.an = an; camBy(vt, K.app, [vt.views.pond, vt.views.table, vt.views.table, vt.views.all, vt.views.all]);
      return o;
    },
    steps: [
      { do: X('Kyun? On a cold morning a bird in your hand feels warm, but a frog feels cold. Why? Look at the five animals on the table: all of them have a backbone.'), target: 'vt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.vt.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A small fish in a basin of pond water, a frog on a wet stone, a house gecko on a piece of bark, a kingfisher on a perch and a hare. The morning is cold: 15 °C.') },
      { do: X('Take the infrared thermometer to each animal in turn and read its body temperature.'), target: 'gun',
        act: async (K, o) => { for (const a of o.an) if (!a.measured) await run((r) => o.vt.read(a, o.gun, r)); K.lab.emit('temp', { obj: o.vt.id }); }, ev: { type: 'temp' },
        see: X('Fish 15.3 °C, frog 15.8 °C, gecko 16.6 °C: as cold as the morning. Kingfisher 40.6 °C and hare 38.4 °C: warm.'),
        why: X('Birds and mammals are warm-blooded: their bodies make heat and stay warm whatever the weather. Fish, amphibians and reptiles are cold-blooded: their bodies take on the temperature around them.') },
      { do: X('Now look at the skin of each animal through the hand lens. The bubble shows it up close.'), target: 'lens',
        act: async (K, o) => { for (const a of o.an) if (!a.looked) await run((r) => o.vt.look(a, o.lens, r)); K.lab.emit('lens', { obj: o.vt.id }); }, ev: { type: 'lens' },
        see: X('Scales on the fish, and a gill cover behind its eye; smooth, moist skin on the frog; dry, scaly skin on the gecko; feathers on the kingfisher; fur on the hare.'),
        why: X('What covers the body is one of the easiest ways to tell the classes apart.') },
      { do: X('Put each animal on the mat of its class.'), target: 'fish',
        act: async (K, o) => { for (const a of o.an) { const want = O2.CLASSES.indexOf(O2.VERT[a.vkind].cls); if (a.on !== want) await run((r) => o.vt.put(a, want, r)); } K.lab.emit('sorted', { obj: o.vt.id }); }, ev: { type: 'sorted' },
        check: (K, o) => { const bad = o.an.filter((a) => a.on !== O2.CLASSES.indexOf(O2.VERT[a.vkind].cls)); if (!bad.length) return null;
          return { ok: false, see: F3((L, w) => `${w('On the wrong mat')}: ${bad.map((a) => `${t3(L, VN[a.vkind])} → ${t3(L, CLN[O2.CLASSES[a.on]])}`).join(', ')}.`), why: F3((L) => bad.map((a) => t3(L, VWHY[a.vkind])).join(' ') + ' ' + t3(L, X('Pick it up again and put it on the right mat.'))) }; },
        see: X('Fish on Pisces, frog on Amphibia, gecko on Reptilia, kingfisher on Aves, hare on Mammalia.'),
        why: X('Pisces: scales, fins, gills. Amphibia: moist skin; the young live in water, the adults also on land. Reptilia: dry scaly skin, eggs with a shell laid on land. Aves: feathers, a beak, eggs with a hard shell. Mammalia: hair, and they feed their young on milk.') },
    ],
    eq: { word: 'Vertebrates', sym: 'Pisces · Amphibia · Reptilia · Aves · Mammalia' },
    result: { obs: X('The fish, frog and gecko were as cold as the morning (15–17 °C); the kingfisher (40.6 °C) and the hare (38.4 °C) were warm. Their bodies were covered in scales, moist skin, dry scales, feathers and fur.'),
      concl: X('Animals with a backbone (vertebrates) are sorted into five classes by their body covering, how they breathe, whether they are warm- or cold-blooded, and how they have their young.'),
      safety: X('Handle animals gently and only for a short time, with wet hands for frogs and fish; then let them go where you found them. Wash your hands afterwards.'),
      viva: [{ q: X('Which two classes are warm-blooded?'), a: X('Birds (Aves) and mammals (Mammalia).') }, { q: X('Why is a frog an amphibian?'), a: X('Its young live in water and breathe with gills; the adult lives on land and in water.') },
        { q: X('What covers the body of a reptile?'), a: X('Dry skin with scales.') }] },
  },
  // ============================================================ Class 8 (10) · life cycles in still water
  {
    id: 'bw8_life_cycles', subj: 'biology', cls: 8, also: [10], ch: C8h, world: true, place: 'pond', table: true, topic: 'ocean',
    title: X('Life cycles in still water: a frog, and mosquitoes in an old tyre'),
    aim: X('To put frog spawn in a tank of pond water, tip out rain water from a tyre or a pot with your own hand, and run the calendar to watch a frog grow from egg to adult and mosquitoes breed in still water.'),
    kind: X('Metamorphosis; mosquitoes and disease'),
    setup(K) {
      const W = Wd(K); K.add(BW.pondScene({ W }), 0, 0, { y: 0 }); const sw = K.add(O2.stillWater({ W }), 0, 0, { y: 0 }); sw.W = W;
      const leaf = new THREE.Group(); const pad = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20).rotateX(-Math.PI / 2), O1.lm({ color: 0x4d7a32 })); pad.position.y = 0.002; leaf.add(pad, sw.spawnGroup); sw.spawnGroup.position.y = 0.008;
      const spawn = K.add(O1.thing(N('Frog spawn', 'मेंढक के अंडे', 'Frog spawn (mendhak ke ande)'), leaf, { hitR: 0.08, hitY: 0.02 }), -0.85, -0.62, BY);
      const names = [N('Old tyre with rain water', 'बारिश के पानी वाला पुराना टायर', 'Baarish ke paani wala purana tyre'), N('Clay pot with rain water', 'बारिश के पानी वाला मिट्टी का घड़ा', 'Baarish ke paani wala mitti ka ghada')];
      sw.cont.forEach((c, i) => { c.thing = K.add(O1.thing(names[i], c.grp, { hitR: i ? 0.17 : 0.3, hitY: i ? 0.18 : 0.12 }), c.at.x, c.at.z, { y: 0 }); });
      const knob = K.add(MW.pullTab(), 0, -0.42);
      O2.bindStill(sw, { spawn, knob }, K.app, { spawn: 1, empty1: 2, t1: 3, empty2: 4, t2: 5, t3: 6 }, { spawn: emit(K, sw, 'spawn'), empty: () => K.lab.emit('empty', { obj: sw.id }), end: () => K.lab.emit('day', { obj: sw.id }) });
      camBy(sw, K.app, [sw.views.all, sw.views.tank, sw.views.pots, sw.views.all, sw.views.pots, sw.views.tank, sw.views.tank]);
      return { sw, spawn, knob, tyre: sw.cont[0].thing, pot: sw.cont[1].thing };
    },
    steps: [
      { do: X('Kyun? Why do health workers ask us to empty coolers, old tyres and pots every week? Look at the pond, the tank of pond water on the table, and the two containers of rain water on the ground.'), target: 'sw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sw.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('The tank holds clear pond water with water plants. The old tyre and the clay pot have been full of rain water since last week.') },
      { do: X('Lift the clump of frog spawn and put it in the tank of pond water.'), target: 'spawn',
        act: async (K, o) => { await run((r) => o.sw.putSpawn(o.spawn, r)); K.lab.emit('spawn', { obj: o.sw.id }); }, ev: { type: 'spawn' },
        see: X('Hundreds of tiny black eggs, each in a ball of clear jelly, float near the surface.'), why: X('A frog lays its eggs in water. The jelly protects them and holds them together.') },
      { do: X('Tip out one of the two containers on the soil by the drain: the tyre or the pot.'), target: 'pot',
        act: async (K, o) => { await run((r) => o.sw.empty(o.sw.cont[1], r)); K.lab.emit('empty', { obj: o.sw.id }); }, ev: { type: 'empty' },
        see: X('The water soaks into the soil. That container is now empty and dry.') },
      { do: X('Slide the calendar on two weeks. The bubble shows the water of the full container up close.'), target: 'knob',
        act: async (K, o) => { await K.tween(6, (k) => o.sw.setT(14 * k)); o.sw.setT(14); K.lab.emit('day', { obj: o.sw.id }); }, ev: { type: 'day' },
        check: (K, o) => (o.sw.cont.every((c) => !c.full) ? { ok: false, see: X('No mosquitoes at all: you emptied both containers.'), why: X('That is exactly what stops them. A mosquito needs still water to lay its eggs in; without it, none can breed.') } : null),
        see: X('In the container you left full, tiny wrigglers appear on day 2, hanging head-down from the surface. On day 8 they turn into comma-shaped pupae, and from day 10 adult mosquitoes fly out. In the tank the eggs have hatched: tadpoles swim about.'),
        why: X('A mosquito lays its eggs on still water. Its larvae breathe air through a tube at the surface. From egg to adult takes only about ten days, so still water left for a week is enough.') },
      { do: X('Now tip out the other container too.'), target: 'tyre',
        act: async (K, o) => { const c = o.sw.cont.find((x) => x.full); if (c) await run((r) => o.sw.empty(c, r)); K.lab.emit('empty', { obj: o.sw.id }); }, ev: { type: 'empty' },
        see: X('The larvae and pupae left in it die on the dry soil. No more mosquitoes can come from it.'),
        why: X('Without still water mosquitoes cannot breed. Emptying, covering or filling containers every week stops dengue, malaria and chikungunya at the source.') },
      { do: X('Slide the calendar on to 8 weeks and watch the tadpoles.'), target: 'knob',
        act: async (K, o) => { await K.tween(5, (k) => o.sw.setT(14 + 42 * k)); o.sw.setT(56); K.lab.emit('day', { obj: o.sw.id }); }, ev: { type: 'day' },
        see: X('The tadpoles have grown bigger, and their back legs have appeared.'), why: X('This change of body shape as the young grow up is called metamorphosis.') },
      { do: X('Slide on to 16 weeks.'), target: 'knob',
        act: async (K, o) => { await K.tween(6, (k) => o.sw.setT(56 + 56 * k)); o.sw.setT(112); K.lab.emit('day', { obj: o.sw.id }); }, ev: { type: 'day' },
        see: X('Front legs appear, the tail shrinks away, and the froglets climb out onto the stone as young frogs.'),
        why: X('A tadpole breathes with gills and lives only in water. A frog breathes with lungs and through its skin, and lives on land and in water: it is an amphibian.') },
    ],
    eq: { word: 'Life cycles', sym: 'frog: egg → tadpole → froglet → frog · mosquito: egg → larva → pupa → adult (10 days)' },
    result: { obs: X('The frog spawn hatched into tadpoles in about a week; back legs came at about 6 weeks, front legs and a shrinking tail after that, and young frogs left the water at about 12–16 weeks. In the rain water left standing, mosquito larvae appeared in 2 days and adults flew out in 10.'),
      concl: X('Frogs and mosquitoes both change shape completely as they grow (metamorphosis), and both need water to breed. Mosquitoes can breed in any still water left for a week, so emptying it every week prevents mosquito-borne diseases.'),
      safety: X('Do not keep still water around the house. Use mosquito nets and repellents, and see a doctor if you have a fever after mosquito bites.'),
      viva: [{ q: X('How long does a mosquito take from egg to adult?'), a: X('About ten days.') }, { q: X('How does a tadpole breathe?'), a: X('With gills.') },
        { q: X('What is metamorphosis?'), a: X('A big change in body shape as a young animal grows into the adult.') }] },
  },
  // ============================================================ Class 6 · the beaks and feet of birds
  {
    id: 'bw6_beaks_feet', subj: 'biology', cls: 6, ch: C6d, world: true, place: 'pond', table: true, topic: 'ocean',
    title: X('Beaks and feet: feed the birds of the pond'),
    aim: X('To take five foods to the five birds round a pond, match each bird\'s feet to the job they do, and find out how beaks and feet suit the way each bird lives.'),
    kind: X('Adaptations of birds: beaks and feet'),
    setup(K) {
      const W = Wd(K); K.add(BW.pondScene({ W }), 0, 0, { y: 0 }); const bb = K.add(O2.birdBank({ W }), 0, 0, { y: 0 }); bb.W = W; const o = { bb };
      const fx = { snails: -0.85, grubs: -0.45, grain: -0.05, lizard: 0.32, fish: 0.66 };
      o.foods = Object.keys(fx).map((k) => { const f = K.add(O2.birdFood(k, FOODN[k]), fx[k], -0.66, BY); o[k] = f; return f; });
      o.cards = ['climb', 'perch', 'grasp', 'swim', 'perch'].map((j, i) => K.add(O2.feetCard(j, [W(FEETN[j][0]), W(FEETN[j][1])]), -0.84 + i * 0.36, -0.44, BY));
      o.card = o.cards[0];
      O2.bindBirds(bb, o.foods, o.cards, K.app, { food: 1, feet: 2 }, {
        food: () => { if (o.foods.every((f) => f.to)) K.lab.emit('fed', { obj: bb.id }); rejudge(K, 1); }, feet: () => { if (o.cards.every((c) => c.to)) K.lab.emit('feet', { obj: bb.id }); rejudge(K, 2); } });
      camBy(bb, K.app, [bb.views.all, bb.views.all, bb.views.all, bb.views.all]);
      return o;
    },
    steps: [
      { do: X('Kyun? Why does a sparrow have a short, thick beak, but a kingfisher a long, pointed one? Look at the five birds round the pond.'), target: 'bb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bb.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A sparrow on a twig, a kingfisher on its bamboo perch, a duck on the bank, a woodpecker on a dead stump and a hawk on a tree stump.') },
      { do: X('Feed the birds: take each food from the table to the bird whose beak can eat it.'), target: 'grain',
        act: async (K, o) => { for (const f of o.foods) { const key = Object.keys(O2.BIRDS).find((b) => O2.BIRDS[b].food === f.food); if (f.to !== key) await run((r) => o.bb.give(f, key, 'beak', r)); } K.lab.emit('fed', { obj: o.bb.id }); }, ev: { type: 'fed' },
        check: (K, o) => { const bad = o.foods.filter((f) => O2.BIRDS[f.to] && O2.BIRDS[f.to].food !== f.food); if (!bad.length) return null;
          return { ok: false, see: F3((L, w) => `${w('These cannot eat what you gave them')}: ${bad.map((f) => `${t3(L, FOODN[f.food])} → ${t3(L, BIRDN[f.to])}`).join(', ')}.`), why: X('Look at the shape of each beak: thick for cracking seeds, long and pointed for spearing fish, chisel-like for digging into wood, hooked for tearing flesh, broad and flat for straining water and mud.') }; },
        see: X('Grain to the sparrow, the small fish to the kingfisher, the grubs in the bark to the woodpecker, the lizard to the hawk, and the snails and duckweed to the duck.'),
        why: X('Each beak is a tool for one kind of food: thick for cracking seeds, long and pointed for spearing fish, chisel-like for digging into wood, hooked for tearing flesh, broad and flat for straining food from water and mud.') },
      { do: X('Now look at their feet. Put each card beside the feet it describes.'), target: 'card',
        act: async (K, o) => { const used = new Set(); for (const c of o.cards) { const key = Object.keys(O2.BIRDS).find((b) => O2.BIRDS[b].feet === c.job && !used.has(b)); used.add(key); if (c.to !== key) await run((r) => o.bb.give(c, key, 'feet', r)); } K.lab.emit('feet', { obj: o.bb.id }); }, ev: { type: 'feet' },
        check: (K, o) => { const bad = o.cards.filter((c) => O2.BIRDS[c.to] && O2.BIRDS[c.to].feet !== c.job); if (!bad.length) return null;
          return { ok: false, see: F3((L, w) => `${w('Cards on the wrong feet')}: ${bad.map((c) => `${w(FEETN[c.job][0])} → ${t3(L, BIRDN[c.to])}`).join(', ')}.`), why: X('Webbed toes paddle, two toes in front and two behind grip a tree trunk, curved talons hold prey, and toes that wrap round a twig grip a perch.') }; },
        see: X('Perching: the sparrow and the kingfisher. Swimming: the duck. Climbing: the woodpecker. Catching prey: the hawk.'),
        why: X('Feet, like beaks, suit the way a bird lives: webbed paddles for swimming, two toes in front and two behind for climbing tree trunks, curved talons for gripping prey, and toes that wrap round a twig for perching.') },
    ],
    eq: { word: 'Beaks and feet', sym: 'seed-cracker · fish-spear · chisel · hook · strainer' },
    result: { obs: X('Grain went to the sparrow, the fish to the kingfisher, the grubs to the woodpecker, the lizard to the hawk and the snails to the duck. Webbed feet paddle, climbing feet grip bark, talons grip prey, perching feet grip twigs.'),
      concl: X('The shape of a bird\'s beak suits the food it eats, and the shape of its feet suits where and how it lives. These are adaptations.'),
      safety: X('Watch birds quietly from a distance. Never disturb their nests.'),
      viva: [{ q: X('What kind of beak does a seed-eating bird have?'), a: X('Short, thick and strong, to crack seeds.') }, { q: X('Why does a duck have webbed feet?'), a: X('To paddle through water when it swims.') },
        { q: X('How are a woodpecker\'s toes arranged?'), a: X('Two in front and two behind, to grip a tree trunk.') }] },
  },
  // ============================================================ Class 6 · hidden by their colours
  {
    id: 'bw6_camouflage', subj: 'biology', cls: 6, ch: C6d, world: true, place: 'forest', table: false, topic: 'ocean',
    title: X('Hidden by their colours: find the animals, then let a crow hunt'),
    aim: X('To find four animals hiding on a forest path, move two of them to new backgrounds with your own hand, and let a crow hunt, to find out how camouflage protects animals.'),
    kind: X('Adaptations: camouflage'),
    setup(K) {
      const W = Wd(K); const hs = K.add(O2.hideSeek({ W }), 0, 0, { y: 0 }); hs.W = W; const o = { hs };
      const an = Object.keys(O2.HIDERS).map((n) => { const H = O2.HIDERS[n]; const a = K.add(O2.hider(n, HIDEN[n]), H.at[0], H.at[2], { y: H.at[1] }); o[n] = a; return a; });
      o.button = K.add(MW.pullTab(), 0.32, -0.38, { y: 0.95 });
      O2.bindHide(hs, an, K.app, { find: 1, move: 2, hunt: 3 }, { found: () => { if (an.every((a) => a.found)) K.lab.emit('found', { obj: hs.id }); }, moved: () => { if (o.stickinsect.moved && o.locust.moved) K.lab.emit('moved', { obj: hs.id }); } });
      const bp = o.button.g.position.clone(); BW_push(o.button, { path: () => [bp.clone(), bp.clone().add(new THREE.Vector3(0, 0, -0.06))], active: () => K.app.runner.i === 3 && K.app.runner.state === 'todo' && !hs.busy, keepVisible: () => K.app.runner.i === 3, press: () => hs.hunt(() => K.lab.emit('hunt', { obj: hs.id })) });
      o.an = an; camBy(hs, K.app, [hs.views.all, hs.views.all, hs.views.all, hs.views.crow]);
      return o;
    },
    steps: [
      { do: X('Kyun? How can a stick insect stay alive when birds are hunting all round it? Look at the forest path in front of you: four animals are hiding within two steps of you.'), target: 'hs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.hs.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Twigs, green grass, ferns, a fallen trunk and a patch of bare soil. A crow watches from a stump. At first you may see no animals at all.') },
      { do: X('Find each of the four animals and pick it up. When you let it go, it goes back to its hiding place.'), target: 'stickinsect',
        act: async (K, o) => { for (const a of o.an) { if (a.found) continue; a.held = 'pointer'; a.update(0.016, 0); a.held = null; await K.sleep(1.2); } K.lab.emit('found', { obj: o.hs.id }); }, ev: { type: 'found' },
        see: X('A stick insect lying along a twig, a grasshopper in the green grass, a gecko flat on the bark of the fallen trunk, and a chameleon on its branch among the ferns.'),
        why: X('Each has the colour, and often the shape, of the place where it lives. This is called camouflage.') },
      { do: X('Move the stick insect and the grasshopper: put each where you like, on the twigs, in the grass, on the ferns or on the bare soil.'), target: 'stickinsect',
        act: async (K, o) => { const mv = (a, k) => new Promise((r) => { a.flying = true; O1.flyT(a, o.hs.spots[k].clone(), 0, 0.7, () => { a.flying = false; a.spot = k; a.moved = true; a.home = { p: a.g.position.clone(), q: a.g.quaternion.clone() }; r(); }); }); if (!o.stickinsect.moved) await mv(o.stickinsect, 'fern'); if (!o.locust.moved) await mv(o.locust, 'grass'); K.lab.emit('moved', { obj: o.hs.id }); }, ev: { type: 'moved' },
        see: X('Each sits where you put it.') },
      { do: X('Push the yellow button: let the crow hunt.'), target: 'button',
        act: async (K, o) => { await run((r) => o.hs.hunt(r)); K.lab.emit('hunt', { obj: o.hs.id }); }, ev: { type: 'hunt' },
        check: (K, o) => (!o.hs.caught || !o.hs.caught.length ? { ok: false, see: X('The crow flew over both of your animals and caught nothing: each sat on its own colours.'), why: X('That is camouflage at work. Put one of them on a background of a different colour and let the crow hunt again (go back one step), and see what happens.') } : null),
        see: X('The crow flies straight to an animal that sits on a background of a different colour and catches it. An animal that matches its background, the crow flies over without seeing.'),
        why: X('Camouflage hides animals from their hunters. It also lets hunters, like the chameleon, creep up on their prey unseen.') },
    ],
    eq: { word: 'Camouflage', sym: 'colour and shape of the background → hidden from hunters' },
    result: { obs: X('All four animals were hard to find among things of their own colour and shape. The crow caught an animal moved onto a background of a different colour, and missed one on its own colours.'),
      concl: X('Camouflage, having the colour and shape of the surroundings, is an adaptation that hides animals from predators and helps predators hide from their prey.'),
      safety: X('Look at insects and lizards without hurting them; put them back where you found them.'),
      viva: [{ q: X('What is camouflage?'), a: X('Having the colour and shape of the surroundings, so as not to be seen.') }, { q: X('Name an animal that looks like a twig.'), a: X('The stick insect.') },
        { q: X('How does camouflage help a chameleon catch insects?'), a: X('The insects do not see it until it is close enough to catch them.') }] },
  },
  // ============================================================ Class 6 · salt from the sea
  {
    id: 'bw6_sea_salt', subj: 'biology', cls: 6, ch: C6s, world: true, place: 'beach', table: true, topic: 'ocean',
    title: X('Salt from the sea: a salt pan on the beach'),
    aim: X('To let sea water into a salt pan, shut it in, run the days of sun and wind, and rake up the salt, all with your own hand, and find out why the sea is salty and how salt is separated from it by evaporation.'),
    kind: X('Separation by evaporation'),
    setup(K) {
      const W = Wd(K); const sp = K.add(O3.saltPan({ W }), 0, 0, { y: 0 }); sp.W = W;
      const gate = K.add(MW.pullTab(), -2.3, -0.4, { y: 0.32 }), knob = K.add(MW.pullTab(), 0, -0.42), rake = K.add(MW.pullTab(), -1.2, 0.15, { y: 0.2 });
      O3.bindSalt(sp, { gate, knob, rake }, K.app, { open: 1, close: 2, days: 3, rake: 4 }, { open: emit(K, sp, 'gate'), close: emit(K, sp, 'gate'), days: emit(K, sp, 'days'), rake: emit(K, sp, 'raked') });
      camBy(sp, K.app, [sp.views.all, sp.views.gate, sp.views.pan, sp.views.all, sp.views.pan]);
      return { sp, gate, knob, rake };
    },
    steps: [
      { do: X('Kyun? Rivers pour fresh water into the sea all the time. So why is the sea salty, and how do we get salt from it? Look at the salt pan dug in the sand beside the sea.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sp.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A shallow bed with low mud walls, 1.6 m long and 1 m wide. A channel brings sea water to it through a wooden gate. On the table: a bowl of sea water and a bowl of tap water in the same sun.') },
      { do: X('Lift the wooden gate: let the sea flow into the salt pan.'), target: 'gate',
        act: async (K, o) => { await K.tween(1, (k) => o.sp.setGate(k)); K.lab.emit('gate', { obj: o.sp.id }); }, ev: { type: 'gate' },
        see: X('Sea water runs along the channel and spreads over the bed of the pan.') },
      { do: X('Watch the water rise. Shut the gate when it is 10 cm deep.'), target: 'gate',
        act: async (K, o) => { const t0 = performance.now(); while (o.sp.d0 < 0.1 && performance.now() - t0 < 20000) await K.sleep(0.1); await K.tween(0.5, (k) => o.sp.setGate(1 - k)); o.sp.setGate(0); K.lab.emit('gate', { obj: o.sp.id }); }, ev: { type: 'gate' },
        check: (K, o) => { const cm = o.sp.d0 * 100; if (Math.abs(cm - 10) < 1.5) return null; return { ok: false, see: F3((L, w) => `${w('Your pan holds')} ${cm.toFixed(1)} cm ${w('of sea water')}: ${Math.round(cm * 16)} ${w('litres')}.`), why: F3((L, w) => `${w('Each centimetre of water in this pan holds 0.56 kg of salt, so your pan will give about')} ${(cm * 0.56).toFixed(1)} kg. ${w('The rest of the activity works the same way.')}`) }; },
        see: X('The pan holds 10 cm of sea water: 160 litres.'), why: X('Every litre of sea water has about 35 g of salt dissolved in it, so 160 litres hold about 5.6 kg of salt.') },
      { do: X('Slide the calendar on 12 days of sun and sea wind.'), target: 'knob',
        act: async (K, o) => { await K.tween(8, (k) => o.sp.setT(12 * k)); o.sp.setT(12); K.lab.emit('days', { obj: o.sp.id }); }, ev: { type: 'days' },
        see: X('The water sinks about 1 cm a day. The salt in what is left gets stronger and the brine turns pinkish. At about 26 % no more salt can stay dissolved, and white crystals begin to grow. When the water is gone, the bed is white with salt. On the table, the sea-water bowl has dried to a white crust; the tap-water bowl has left only a faint ring.'),
        why: X('This is evaporation: the sun and the wind turn the water into vapour, and the salt, which cannot evaporate, is left behind. The sea is salty for the same reason. Rivers carry a little dissolved salt from the rocks into the sea; the sun takes the water back up but leaves the salt, so over millions of years it has built up.') },
      { do: X('Drag the rake across the pan: rake the salt into a heap.'), target: 'rake',
        act: async (K, o) => { await K.tween(2.5, (k) => o.sp.setRake(k)); o.sp.setRake(1); K.lab.emit('raked', { obj: o.sp.id }); }, ev: { type: 'raked' },
        check: (K, o) => { const kg = o.sp.saltKg(); if (Math.abs(kg - 5.6) < 0.8) return null; return { ok: false, see: F3((L, w) => `${w('Your heap')}: ${kg.toFixed(1)} kg ${w('of salt')}.`), why: X('The salt you get depends on how much sea water you let into the pan.') }; },
        see: X('A heap of white salt: about 5.6 kg from one pan of sea water.'), why: X('On the coasts of Gujarat and Tamil Nadu, salt is made this way in huge pans, in the dry months before the monsoon.') },
    ],
    eq: { word: 'Salt from sea water', sym: 'sea water (3.5 % salt) → evaporation → brine (26 %) → salt crystals' },
    result: { obs: X('The pan was filled with 10 cm of sea water. In about 10 days of sun and wind the water evaporated; the brine grew stronger and pinker, and salt crystallised once it held about 26 % salt. About 5.6 kg of salt was raked up. The sea-water bowl left a crust of salt; tap water left almost nothing.'),
      concl: X('Salt is separated from sea water by evaporation: the water goes into the air as vapour and the dissolved salt is left behind. The sea is salty because rivers keep bringing dissolved salts into it, and evaporation takes only the water away.'),
      safety: X('Never drink sea water: its salt makes the body lose water. Protect your eyes from the glare of salt pans in the sun.'),
      viva: [{ q: X('How much salt is there in sea water?'), a: X('About 35 g in every litre (3.5 %).') }, { q: X('Name the process by which salt is got from sea water.'), a: X('Evaporation.') },
        { q: X('Why is the sea salty?'), a: X('Rivers carry dissolved salts into it, and evaporation takes away only the water.') }] },
  },
  // ============================================================ Class 6 (7) · a whale's blubber
  {
    id: 'bw6_blubber', subj: 'biology', cls: 6, also: [7], ch: C6d, world: true, place: 'beach', table: true, topic: 'ocean',
    title: X('How a whale keeps warm: blubber in ice water'),
    aim: X('To put three cans of warm water, one bare, one wrapped in fat and one in a woollen sock, into ice water with your own hand, time how fast each cools, and find out how a whale\'s blubber keeps it warm.'),
    kind: X('Adaptations to cold water: insulation by blubber'),
    setup(K) {
      const W = Wd(K); const bt = K.add(O3.blubberTest({ W }), 0, 0, { y: 0 }); bt.W = W;
      const cans = ['bare', 'fat', 'wool'].map((w, i) => { const c = K.add(O1.thing(CANN[w], O3.warmCan(w), { hitR: 0.08, hitY: 0.08 }), -0.95 + i * 0.22, -0.55, BY); c.wrap = w; c.label = CANL[w]; return c; });
      const knob = K.add(MW.pullTab(), 0, -0.42);
      O3.bindBlubber(bt, cans, knob, K.app, { dip: 1, clock: 2, look: 3 }, { dip: emit(K, bt, 'dip'), clock: emit(K, bt, 'min10') });
      camBy(bt, K.app, [bt.views.sea, bt.views.table, bt.views.table, bt.views.all]);
      return { bt, bare: cans[0], fat: cans[1], wool: cans[2], cans, knob };
    },
    steps: [
      { do: X('Kyun? A whale swims all its life in water near 2 °C, and it has no fur. How does it stay warm? Watch the whale come up to breathe, far out at sea.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bt.id }); await K.sleep(5); }, ev: { type: 'look' },
        see: X('Its dark back rises out of the water and it breathes out a tall spout of spray, then dives again. On the table: a tub of ice water at 1 °C and three steel cans of warm water at 37 °C, as warm as a whale\'s body.') },
      { do: X('Put all three cans into the tub of ice water: the bare can, the can wrapped in fat, and the can in the woollen sock.'), target: 'bare',
        act: async (K, o) => { for (const c of o.cans) if (!c.inTub) await run((r) => o.bt.dip(c, r)); K.lab.emit('dip', { obj: o.bt.id }); }, ev: { type: 'dip' },
        see: X('All three still read 37 °C. The woollen sock soaks up the ice water.') },
      { do: X('Slide the clock on 10 minutes and watch the three thermometers.'), target: 'knob',
        act: async (K, o) => { await K.tween(7, (k) => o.bt.setT(10 * k)); o.bt.setT(10); K.lab.emit('min10', { obj: o.bt.id }); }, ev: { type: 'min10' },
        check: (K, o) => { const out = o.cans.filter((c) => !c.inTub); if (!out.length) return null; return { ok: false, see: F3((L, w) => `${w('Out of the ice water')}: ${out.map((c) => t3(L, CANN[c.wrap])).join(', ')}.`), why: X('A can taken out of the ice water cools only slowly, in the air. To compare the wrappings, all three must stay in the ice water for the whole time.') }; },
        see: X('The bare can drops to about 4 °C. The can in the wet woollen sock drops to about 17 °C. The can wrapped in fat is still about 32 °C.'),
        why: X('Fat lets heat through very slowly: it is a good insulator, in water too. Wool keeps us warm in air because of the air trapped in it; in water the air is pushed out, so it insulates much less.') },
      { do: X('Look at the whale up close in the bubble.'), target: 'bt',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.bt.id }); await K.sleep(4); }, ev: { type: 'look2' },
        see: X('Under a whale\'s dark skin is a layer of fat, blubber, up to 30 cm thick.'), why: X('Whales, seals and penguins have thick blubber; polar bears have both fat and thick fur. These are adaptations to living in cold water.') },
    ],
    eq: { word: 'Blubber', sym: 'bare can 37 → 4 °C · in wet wool 37 → 17 °C · in fat 37 → 32 °C (10 minutes in ice water)' },
    result: { obs: X('In 10 minutes in ice water the bare can cooled from 37 °C to about 4 °C, the can in the wet woollen sock to about 17 °C, and the can wrapped in fat only to about 32 °C.'),
      concl: X('A thick layer of fat (blubber) keeps heat in even in icy water. Whales, seals and penguins are adapted to cold seas by their blubber.'),
      safety: X('Do not keep your own hand in ice water for long: it hurts and can harm the skin.'),
      viva: [{ q: X('What is blubber?'), a: X('A thick layer of fat under the skin of whales, seals and penguins.') }, { q: X('Why did the can in the woollen sock cool faster than the one in fat?'), a: X('Wet wool loses its trapped air, so it insulates much less than fat does.') },
        { q: X('Name two animals with blubber.'), a: X('A whale and a seal (also a penguin).') }] },
  },
];
