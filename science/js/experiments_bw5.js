// DUET Science Lab 360, biology in real places, batch BW5: life cycles, heredity and evolution, health, plants, the
// cell, fossils and birds. A swallowtail's life on a lemon tree, a hen's eggs from egg to hen, Mendel's pea crosses,
// beetles and crows (natural selection), the variation in a class, how diseases spread, where a root grows, the parts
// of a plant, a walk inside a cell, a fossil dig, and a bird count at a wetland. Every activity opens with one everyday
// question ("Kyun?"); the student does each step with their own hand, and what happens follows what they did.
// Scenes are in lifeworld1.js … lifeworld4.js; Hindi and Hinglish in exp_i18n_bw5.js.
import { DICT } from './exp_i18n.js';
import { DICT_BW5 } from './exp_i18n_bw5.js';
import * as MW from './mathworld.js';
import { lens } from './biobench2.js';
import * as O1 from './oceanworld1.js';
import * as L1 from './lifeworld1.js';
import { EXPERIMENTS_BW5B } from './experiments_bw5b.js';
import { EXPERIMENTS_BW5C } from './experiments_bw5c.js';
Object.assign(DICT, DICT_BW5);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => tl(K, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const run = (f) => new Promise((r) => { if (f(r) === false) r(); });
const camBy = (it, app, views) => { const u0 = it.update; let last = -1; it.update = (dt, t) => { const i = app.runner.i; if (i !== last) { last = i; const v = views[i]; if (v) it.camView = typeof v === 'function' ? v() : v; } if (u0) u0.call(it, dt, t); }; it.camView = views[0] || it.camView; };
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
const BY = { y: 0.9 };
const C6L = N('Ch 10 · Living Creatures: Exploring their Characteristics', 'अध्याय 10 · सजीव प्राणी: उनकी विशेषताओं की खोज', 'Ch 10 · Living creatures: unki khoobiyon ki khoj');
const C8R = N('Ch 6 · Reproduction in Animals (older NCERT, Class 8)', 'अध्याय 6 · जंतुओं में जनन (पुरानी NCERT, कक्षा 8)', 'Ch 6 · Animals mein reproduction (purani NCERT, Class 8)');

export const EXPERIMENTS_BW5 = [
  // ============================================================ Class 6 (7, 8) · a swallowtail's life on a lemon tree
  {
    id: 'bw6_butterfly', subj: 'biology', cls: 6, also: [7, 8], ch: C6L, world: true, place: 'farm', table: false, topic: 'repro',
    title: X('From egg to butterfly on a lemon tree'),
    aim: X('To find a swallowtail\'s eggs, its caterpillar and its pupa on a real lemon tree with a hand lens, measure the caterpillar as it grows, and watch a butterfly come out, all in the four weeks of its life cycle.'),
    kind: X('Life cycle of a butterfly: complete metamorphosis'),
    setup(K) {
      const W = Wd(K); const bt = K.add(L1.butterflyTree({ W }), 0, 0, { y: 0 }); bt.W = W;
      const lensIt = K.add(lens(), -0.65, -0.5, { y: 0.94 }); const ruler = K.add(O1.thing(N('Steel scale', 'स्टील का स्केल', 'Steel scale'), L1.steelRule(), { hitR: 0.07, hitY: 0.01 }), -0.6, -0.42, { y: 0.94 });
      const knob = K.add(MW.pullTab(), 0.45, -0.55, { y: 0.95 });
      L1.bindButterfly(bt, { lens: lensIt, ruler, knob }, K.app, { find: 1, d4: 2, m1: 3, d18: 4, m2: 5, d20: 6, pupa: 7, d28: 8 }, { eggs: emit(K, bt, 'eggs'), measured: emit(K, bt, 'measured'), day: emit(K, bt, 'day'), pupa: emit(K, bt, 'pupa') });
      setTimeout(() => { if (!bt.laid && !bt.layBusy) bt.lay(); }, 2500);
      camBy(bt, K.app, [bt.views.tree, bt.views.eggs, bt.views.eggs, bt.views.eggs, bt.views.eggs, bt.views.eggs, bt.views.low, bt.views.low, bt.views.low]);
      return { bt, lens: lensIt, ruler, knob };
    },
    steps: [
      { do: X('Kyun? A caterpillar crawls and eats leaves; a butterfly flies and drinks nectar. Can one turn into the other? Watch the swallowtail at the young lemon tree.'), target: 'bt',
        act: async (K, o) => { if (!o.bt.laid) { if (!o.bt.layBusy) o.bt.lay(); const t0 = performance.now(); while (!o.bt.laid && performance.now() - t0 < 30000) await K.sleep(0.2); } K.lab.emit('look', { obj: o.bt.id }); }, ev: { type: 'look' },
        see: X('The butterfly flutters to the soft new leaves at the tips of the shoots, curls its body under, and touches each leaf for a moment before flying off.'),
        why: X('A butterfly lays her eggs only on the plant her caterpillars can eat. The lime swallowtail chooses citrus: lemon, orange and curry-leaf plants.') },
      { do: X('Take the hand lens to the young leaves at the shoot tips, one by one. Find all three eggs.'), target: 'lens',
        act: async (K, o) => { for (const i of [0, 2, 4]) if (!o.bt.lensSeen.has(i)) await run((r) => o.bt.lookSpot(i, r)); K.lab.emit('eggs', { obj: o.bt.id }); }, ev: { type: 'eggs' },
        see: X('One tiny round egg, pale yellow and about 1 mm across, sits alone on each of three young leaves. The other leaves have none.'),
        why: X('She spreads her eggs out, one per leaf, so that each caterpillar will have enough to eat.') },
      { do: X('Slide the calendar on to day 4 and watch the eggs.'), target: 'knob',
        act: async (K, o) => { await K.tween(5, (k) => o.bt.setT(4 * k)); o.bt.setT(4); K.lab.emit('day', { obj: o.bt.id }); }, ev: { type: 'day' },
        see: X('On day 4 each egg hatches. A tiny caterpillar crawls out, eats its own eggshell, then starts on the leaf.'),
        why: X('The egg is the first stage of the life cycle. The caterpillar (the larva) is the second.') },
      { do: X('Lay the steel scale beside the caterpillar to measure it.'), target: 'ruler',
        act: async (K, o) => { await run((r) => o.bt.measure(o.ruler, r)); K.lab.emit('measured', { obj: o.bt.id }); }, ev: { type: 'measured' },
        see: X('It is only 3 mm long, brown with a white patch: it looks just like a bird dropping on the leaf.'),
        why: X('Looking like a bird dropping keeps it safe: birds do not eat their own droppings.') },
      { do: X('Slide the calendar on to day 18. Watch the leaves and the caterpillar.'), target: 'knob',
        act: async (K, o) => { await K.tween(8, (k) => o.bt.setT(4 + 13.5 * k)); o.bt.setT(17.5); K.lab.emit('day', { obj: o.bt.id }); }, ev: { type: 'day' },
        see: X('It eats and eats: nine leaves are gone. It grows too big for its skin four times and sheds it (moults). After the fourth moult it is green with false eye spots.'),
        why: X('The caterpillar\'s only job is to eat and grow. Its skin cannot stretch, so it moults each time it outgrows it.') },
      { do: X('Measure the caterpillar again with the steel scale.'), target: 'ruler',
        act: async (K, o) => { await run((r) => o.bt.measure(o.ruler, r)); K.lab.emit('measured', { obj: o.bt.id }); }, ev: { type: 'measured' },
        check: (K, o) => { const m = o.bt.measures; if (m.length < 2) return null; const k = m[m.length - 1].mm / Math.max(1, m[0].mm); if (k > 10) return null;
          return { ok: false, see: F3((L, w) => `${w('Your two readings')}: ${m[0].mm.toFixed(0)} mm ${w('and')} ${m[m.length - 1].mm.toFixed(0)} mm.`), why: X('Measure the young caterpillar on day 4 and the full-grown one on day 18 to see how much it grows.') }; },
        see: X('Now it is about 45 mm long: fifteen times longer than when it hatched, in only two weeks.'),
        why: X('Fifteen times longer means it is thousands of times heavier. All that food is stored for the next stage, when it will not eat at all.') },
      { do: X('Slide the calendar on to day 21.'), target: 'knob',
        act: async (K, o) => { await K.tween(5, (k) => o.bt.setT(17.5 + 3.5 * k)); o.bt.setT(21); K.lab.emit('day', { obj: o.bt.id }); }, ev: { type: 'day' },
        see: X('The caterpillar stops eating and leaves the leaves. It is nowhere to be seen on them now.'),
        why: X('Before the next stage it looks for a safe place on a stem, away from the leaves where birds search for caterpillars.') },
      { do: X('Find it: take the hand lens along the stems.'), target: 'lens',
        act: async (K, o) => { await run((r) => o.bt.lookSpot(6, r)); K.lab.emit('pupa', { obj: o.bt.id }); }, ev: { type: 'pupa' },
        see: X('On a stem hangs a green pupa (chrysalis), head up, tied by a silk girdle. It is as green as the stem, and hard to spot.'),
        why: X('The pupa is the third stage. It does not eat or move; inside it, the caterpillar\'s body is broken down and rebuilt into a butterfly.') },
      { do: X('Slide the calendar on to day 30 and watch the pupa.'), target: 'knob',
        act: async (K, o) => { await K.tween(8, (k) => o.bt.setT(21 + 9 * k)); o.bt.setT(30); await K.sleep(1); K.lab.emit('day', { obj: o.bt.id }); }, ev: { type: 'day' },
        see: X('On day 26 the pupa turns dark and the wing pattern shows through. On day 28 it splits, and a butterfly crawls out with small, crumpled wings. It pumps them out, lets them dry, and flies.'),
        why: X('This is the adult, the fourth stage. Egg, larva, pupa, adult: a complete change of body form, called complete metamorphosis. The new butterfly will lay eggs too, and the cycle goes on.') },
    ],
    eq: { word: 'Life cycle of a butterfly', sym: 'egg (4 days) → caterpillar (14 days) → pupa (9 days) → butterfly' },
    result: { obs: X('Three eggs were laid singly on young lemon leaves. They hatched on day 4 into 3 mm caterpillars that looked like bird droppings. The caterpillar ate nine leaves, moulted four times and grew to about 45 mm by day 18. It became a green pupa on a stem on day 19, and a butterfly came out on day 28.'),
      concl: X('A butterfly goes through four stages: egg, larva (caterpillar), pupa and adult. The body changes completely between them; this is complete metamorphosis. The caterpillar eats and grows, the pupa changes, and the adult reproduces.'),
      safety: X('Watch caterpillars without squeezing them, and do not spray pesticides on a plant where butterflies breed.'),
      viva: [{ q: X('Name the four stages in the life cycle of a butterfly.'), a: X('Egg, larva (caterpillar), pupa and adult.') }, { q: X('Why does a caterpillar moult?'), a: X('Its skin cannot stretch, so it sheds it as it grows.') },
        { q: X('Does the pupa eat?'), a: X('No. It does not eat or move; inside it the body changes into a butterfly.') }] },
  },
  // ============================================================ Class 8 · a hen's eggs: from egg to hen
  {
    id: 'bw8_chicken', subj: 'biology', cls: 8, also: [10], ch: C8R, world: true, place: 'farm', table: true, topic: 'repro',
    title: X('From egg to hen: candling eggs in an incubator'),
    aim: X('To put a hen\'s eggs and shop eggs in an incubator, set its temperature yourself, look inside each egg against a bright light (candling) as the days pass, and watch a chick hatch and grow into a hen.'),
    kind: X('Internal fertilisation; oviparous animals; development of a chick'),
    setup(K) {
      const W = Wd(K); const ht = K.add(L1.henTable({ W }), 0, 0, { y: 0 }); ht.W = W;
      const names = [N('Brown egg from the hen\'s nest (A)', 'मुर्गी के घोंसले का भूरा अंडा (A)', 'Murgi ke ghonsle ka bhoora anda (A)'), N('Brown egg from the hen\'s nest (B)', 'मुर्गी के घोंसले का भूरा अंडा (B)', 'Murgi ke ghonsle ka bhoora anda (B)'),
        N('White egg from a shop (C)', 'दुकान का सफ़ेद अंडा (C)', 'Dukaan ka safed anda (C)'), N('White egg from a shop (D)', 'दुकान का सफ़ेद अंडा (D)', 'Dukaan ka safed anda (D)')];
      const eggs = L1.EGGS.map((d, i) => K.add(L1.eggThing(d, names[i]), -0.95 + i * 0.08, -0.5, BY));
      const dial = K.add(MW.pullTab(), 0.23, -0.42, { y: 0.92 }), knob = K.add(MW.pullTab(), 0.5, -0.5, { y: 0.92 });
      const s = { put: 1, temp: 2, d4: 3, cA: 4, d18: 5, cB: 6, hatch: 7, grow: 8 };
      L1.bindHen(ht, eggs, { dial, knob }, K.app, s, { put: () => { if (ht.inCup.every(Boolean)) K.lab.emit('put', { obj: ht.id }); }, temp: emit(K, ht, 'temp'), day: emit(K, ht, 'day'),
        candled: () => { const i = K.app.runner.i; if (i === s.cA && eggs.every((e) => e.candled[s.cA])) K.lab.emit('candled', { obj: ht.id }); if (i === s.cB) K.lab.emit('candled', { obj: ht.id }); } });
      camBy(ht, K.app, [ht.views.all, ht.views.table, ht.views.table, ht.views.table, ht.views.table, ht.views.table, ht.views.table, ht.views.incub, ht.views.chicks]);
      return { ht, eggA: eggs[0], eggs, dial, knob };
    },
    steps: [
      { do: X('Kyun? We eat eggs every day, yet none of them would ever have hatched. So which eggs can become chicks? Look at the hen on her nest, and the eggs on the table.'), target: 'ht',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ht.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Two brown eggs from this hen\'s nest (she lives with a cock), two white eggs from a shop (laid by hens kept without a cock), an incubator and a candler: a bright lamp in a dark tube.'),
        why: X('A hen lays eggs whether or not she has mated. Only an egg fertilised inside her body, by a cock\'s sperm, has an embryo that can grow into a chick.') },
      { do: X('Put all four eggs in the cups of the incubator tray.'), target: 'eggA',
        act: async (K, o) => { for (let i = 0; i < 4; i++) if (!o.ht.inCup.includes(o.eggs[i])) await run((r) => o.ht.put(o.eggs[i], o.ht.inCup.indexOf(null), r)); K.lab.emit('put', { obj: o.ht.id }); }, ev: { type: 'put' },
        see: X('The four eggs sit in the tray, the broad end up. The incubator\'s tray tilts them a little every hour, as a hen turns her eggs with her beak.') },
      { do: X('Set the incubator\'s thermostat: slide the knob to the temperature you think a sitting hen gives her eggs.'), target: 'dial',
        act: async (K, o) => { await K.tween(2, (k) => o.ht.setDial(25 + 12.5 * k)); o.ht.setDial(37.5); K.lab.emit('temp', { obj: o.ht.id }); }, ev: { type: 'temp' },
        check: (K, o) => { const T = o.ht.dial; if (T >= 37 && T <= 38.5) return null;
          return { ok: false, see: F3((L, w) => `${w('You set')} ${T.toFixed(1)} °C.`), why: T < 37 ? X('That is cooler than a sitting hen (about 37.5 °C). Below about 32 °C an embryo does not grow at all; a little cooler, it grows slowly and weakly. Watch what happens to the eggs.') : X('That is hotter than a sitting hen (about 37.5 °C). An embryo cannot survive long above about 39 °C. Watch what happens to the eggs.') }; },
        see: X('The bulb glows and the thermometer settles at 37.5 °C: the warmth of a hen\'s body under her feathers.'),
        why: X('A hen sits on her eggs for 21 days, getting off them only to eat and drink. The incubator does her job.') },
      { do: X('Slide the calendar on to day 4.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.ht.setT(4 * k)); o.ht.setT(4); K.lab.emit('day', { obj: o.ht.id }); }, ev: { type: 'day' },
        see: X('From the outside, nothing has changed. All four eggs look the same.') },
      { do: X('Hold each of the four eggs, one at a time, over the candler.'), target: 'eggA',
        act: async (K, o) => { for (const e of o.eggs) if (!e.candled[4]) { e.g.position.copy(e.home.p); await run((r) => o.ht.candle(e, r)); } K.lab.emit('candled', { obj: o.ht.id }); }, ev: { type: 'candled' },
        check: (K, o) => { const live = o.eggs.filter((e) => e.candled[4] === 'veins').length; if (live === 2) return null;
          return { ok: false, see: F3((L, w) => `${w('Eggs with blood vessels')}: ${live}. ${live === 0 ? w('Not one embryo is growing.') : ''}`), why: X('Only the fertilised brown eggs can grow, and only at the right temperature. A shop egg is never fertilised, and an embryo kept too cold does not start, or too hot, dies.') }; },
        see: X('The two brown eggs glow orange with a web of red blood vessels round a dark spot: an embryo, with its tiny heart beating. The two white shop eggs show only the shadow of the yolk.'),
        why: X('The shop eggs were never fertilised. Fertilisation happened inside the hen\'s body (internal fertilisation) before the egg got its shell; without a cock, there is no sperm and no embryo.') },
      { do: X('Slide the calendar on to day 18.'), target: 'knob',
        act: async (K, o) => { await K.tween(6, (k) => o.ht.setT(4 + 14 * k)); o.ht.setT(18); K.lab.emit('day', { obj: o.ht.id }); }, ev: { type: 'day' } , see: X('Two weeks more under the warm bulb.') },
      { do: X('Candle one of the brown eggs again.'), target: 'eggA',
        act: async (K, o) => { const e = o.eggs[0]; e.g.position.copy(e.home.p); await run((r) => o.ht.candle(e, r)); K.lab.emit('candled', { obj: o.ht.id }); }, ev: { type: 'candled' },
        check: (K, o) => { const r = o.eggs.find((e) => e.candled[6])?.candled[6]; if (!r || r === 'full') return null; return { ok: false, see: X('This egg shows no chick.'), why: X('Pick a brown egg from the nest: only those were fertilised. If even they show nothing, the temperature was wrong.') }; },
        see: X('The egg is dark almost all over: the chick fills it. Only the air space at the broad end is bright, and it is much bigger now.'),
        why: X('The chick has used up most of the yolk and the white as food. Water has slowly left the egg through the shell, so the air space has grown.') },
      { do: X('Slide the calendar on to day 21 and watch the eggs.'), target: 'knob',
        act: async (K, o) => { await K.tween(6, (k) => o.ht.setT(18 + 3.6 * k)); o.ht.setT(21.6); K.lab.emit('day', { obj: o.ht.id }); }, ev: { type: 'day' },
        check: (K, o) => (o.ht.hatched === 2 ? null : { ok: false, see: F3((L, w) => `${w('Chicks hatched')}: ${o.ht.hatched}.`), why: o.ht.hatched ? X('Some embryos did not make it.') : X('No chick hatched: the eggs had no living embryo. Either they were not fertilised, or the incubator was not at the temperature of a sitting hen.') }),
        see: X('On day 21 a brown egg rocks and cracks: the chick pecks a small hole with a tiny tooth on its beak, then breaks the shell all the way round and pushes out. It is wet and tired, then dries into a fluffy chick. The white eggs never change.'),
        why: X('A hen\'s egg takes 21 days to hatch at about 37.5 °C. The chick is fully formed and can walk and peck within hours: birds lay eggs and the young grow outside the mother\'s body. Animals that lay eggs are called oviparous.') },
      { do: X('Slide the calendar on 20 weeks and watch the chicks grow.'), target: 'knob',
        act: async (K, o) => { await K.tween(7, (k) => o.ht.setT(21.6 + 140 * k)); o.ht.setT(161.6); K.lab.emit('day', { obj: o.ht.id }); }, ev: { type: 'day' },
        check: (K, o) => (o.ht.hatched ? null : { ok: false, see: X('There are no chicks to grow.'), why: X('Go back, put the brown eggs in the incubator at 37.5 °C, and try again.') }),
        see: X('The chicks grow fast: feathers replace the down in a few weeks. At about 20 weeks one has become a hen, and soon she lays her first egg.'),
        why: X('Egg, chick, young bird, adult hen: and her eggs start the cycle again. A chick is a small copy of its parents; it does not change its body form completely the way a caterpillar does.') },
    ],
    eq: { word: 'Life cycle of a hen', sym: 'fertilised egg (21 days at 37.5 °C) → chick → young hen (about 20 weeks) → eggs' },
    result: { obs: X('Only the brown eggs from the nest, which were fertilised inside the hen, developed: on day 4 they showed blood vessels and an embryo; on day 18 the chick filled the egg; on day 21 they hatched. The shop eggs stayed clear. The chicks grew into a hen in about 20 weeks.'),
      concl: X('In hens, fertilisation is internal: it happens inside the hen\'s body before the shell forms. Hens are oviparous: they lay eggs, and the embryo develops outside the mother\'s body, in the egg, if it is kept warm. A chick hatches after 21 days.'),
      safety: X('Wash your hands after handling eggs, chicks and hens. Handle eggs gently: a crack lets germs in.'),
      viva: [{ q: X('Why can an egg from a shop not hatch?'), a: X('It was never fertilised: the hens are kept without a cock.') }, { q: X('What is candling?'), a: X('Holding an egg against a bright light to see what is inside.') },
        { q: X('What does oviparous mean?'), a: X('Laying eggs: the young develop outside the mother\'s body.') }] },
  },
  ...EXPERIMENTS_BW5B,
  ...EXPERIMENTS_BW5C,
];
