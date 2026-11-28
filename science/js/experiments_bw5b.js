// DUET Science Lab 360, batch BW5, part 2: heredity and evolution. Mendel's pea crosses, beetles and crows (natural
// selection), and the variation in a class. Scenes in lifeworld2.js; Hindi and Hinglish in exp_i18n_bw5.js.
import { DICT } from './exp_i18n.js';
import { DICT_BW5 } from './exp_i18n_bw5.js';
import * as MW from './mathworld.js';
import * as O1 from './oceanworld1.js';
import * as L1 from './lifeworld1.js';
import * as L2 from './lifeworld2.js';
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
const C10H = N('Ch 8 · Heredity (older NCERT: Heredity and Evolution)', 'अध्याय 8 · आनुवंशिकता (पुरानी NCERT: आनुवंशिकता एवं जैव विकास)', 'Ch 8 · Heredity (purani NCERT: Heredity aur Evolution)');
const ratio = (a, b) => (b ? (a / b).toFixed(1) : '—');

export const EXPERIMENTS_BW5B = [
  // ============================================================ Class 10 · Mendel's pea plants
  {
    id: 'bw10_mendel', subj: 'biology', cls: 10, ch: C10H, world: true, place: 'khet', table: true, topic: 'heredity',
    title: X('Mendel\'s peas: cross them by hand and count the next generations'),
    aim: X('To cross a tall pea plant with round seeds and a dwarf one with wrinkled seeds with your own hands, as Mendel did, grow the first and second generations, count the seeds and plants, and build a Punnett square from your own results.'),
    kind: X('Inheritance of traits: dominant and recessive; the 3 : 1 ratio'),
    setup(K) {
      const W = Wd(K); const mf = K.add(L2.mendelField({ W }), 0, 0, { y: 0 }); mf.W = W;
      const forceps = K.add(O1.thing(N('Forceps', 'चिमटी (फ़ोरसेप्स)', 'Forceps (chimti)'), L2.forceps(), { hitR: 0.06, hitY: 0.01 }), -0.95, -0.45, BY);
      const brushT = L2.fineBrush(); const brush = K.add(O1.thing(N('Fine brush', 'बारीक ब्रश', 'Bareek brush'), brushT, { hitR: 0.06, hitY: 0.01 }), -0.75, -0.42, BY); brush.tipM = brushT.userData.tipM;
      const fs = mf.fS.userData.p; const pod = K.add(L2.podThing(N('Ripe pod of the cross', 'संकरण की पकी फली', 'Cross ki paki phali')), fs.x + 0.02, fs.z, { y: fs.y - 0.04 }); pod.g.visible = false;
      const seedsF1 = K.add(O1.thing(N('F1 seeds', 'F1 बीज', 'F1 beej'), L2.seedPacket(['F1', W('seeds')]), { hitR: 0.06, hitY: 0.01 }), -0.1, -0.42, BY); seedsF1.g.visible = false;
      const seedsF2 = K.add(O1.thing(N('F2 seeds', 'F2 बीज', 'F2 beej'), L2.seedPacket(['F2', W('seeds')]), { hitR: 0.06, hitY: 0.01 }), 0.05, -0.42, BY); seedsF2.g.visible = false;
      const shellBtn = K.add(MW.pullTab(), -0.32, -0.45, { y: 0.92 }); const knob = K.add(MW.pullTab(), 0.35, -0.45, { y: 0.92 });
      const cards = ['T', 't', 'T', 't'].map((a, i) => K.add(O1.thing(N(`Gamete ${a}`, `युग्मक ${a}`, `Gamete ${a}`), L1.labelCard([a], { w: 0.06, d: 0.06, sz: 90, fg: '#1d4f9a' }), { hitR: 0.05, hitY: 0.01, kind: 'gam' + a }), 0.65 + i * 0.09, -0.42, BY)); cards.forEach((c, i) => { c.gam = ['T', 't', 'T', 't'][i]; });
      const s = { emasc: 1, pollinate: 2, w4: 3, open: 4, sow1: 5, grow1: 6, shell: 7, sow2: 8, grow2: 9, punnett: 10 };
      L2.bindMendel(mf, { forceps, brush, pod, seedsF1, seedsF2, shellBtn, knob, cards }, K.app, s, { emasc: (w) => { if (w === 'dwarf') K.lab.emit('emasc', { obj: mf.id }); },
        brush: () => { if (mf.pollen || (mf.brush && !mf.emasc)) K.lab.emit('pollinated', { obj: mf.id }); }, day: emit(K, mf, 'day'), opened: emit(K, mf, 'opened'), sown: emit(K, mf, 'sown'), shelled: emit(K, mf, 'shelled'), punnett: emit(K, mf, 'punnett') });
      // things appear when they exist: the ripe pod after 4 weeks, the seed packets after the pods are opened
      const u0 = mf.update; mf.update = (dt, t) => { u0(dt, t); pod.g.visible = mf.phase === 'cross' && mf.t >= 3.9 && !mf.f1Seeds.length && pod.g.visible !== 'x'; seedsF1.g.visible = mf.f1Seeds.length > 0 && !mf.sownF1; seedsF2.g.visible = mf.f2Seeds.length > 0 && mf.phase !== 'f2'; };
      camBy(mf, K.app, [mf.views.all, mf.views.flowers, mf.views.flowers, mf.views.flowers, mf.views.table, mf.views.table, mf.views.table, mf.views.table, mf.views.bed, mf.views.bed, mf.views.board]);
      return { mf, forceps, brush, pod, seedsF1, seedsF2, shellBtn, knob, card: cards[0], cards };
    },
    steps: [
      { do: X('Kyun? Why do children look like their parents, but never exactly like either of them? Gregor Mendel found the answer in pea plants. Look at the two plants.'), target: 'mf',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mf.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A tall pea plant, as high as you, whose seeds are round, and a dwarf plant, knee-high, whose seeds are wrinkled. Each has always given plants like itself for years: they are pure-breeding.'),
        why: X('A pea flower pollinates itself before it even opens. That is why pea plants breed true, and why Mendel had to do the cross by hand.') },
      { do: X('With the forceps, pull out the anthers of the dwarf plant\'s flower bud before it opens.'), target: 'forceps',
        act: async (K, o) => { await run((r) => o.mf.emasculate('dwarf', r)); K.lab.emit('emasc', { obj: o.mf.id }); }, ev: { type: 'emasc' },
        check: (K, o) => (o.mf.tallEmasc && !o.mf.emasc ? { ok: false, see: X('You removed the anthers of the tall plant\'s flower.'), why: X('In this cross the dwarf plant is the mother: its flower must lose its anthers so it cannot pollinate itself. Take the forceps to the dwarf plant\'s flower.') } : null),
        see: X('Ten tiny yellow anthers come out. The flower now has only its female part, the pistil, with the sticky stigma on top.'),
        why: X('This is called emasculation. Now the flower cannot pollinate itself: only pollen that you bring can reach it.') },
      { do: X('With the brush, take pollen from the tall plant\'s flower and dust it on the dwarf flower\'s stigma.'), target: 'brush',
        act: async (K, o) => { if (o.mf.brush !== 'tall') await run((r) => o.mf.brushTo('tall', r)); await run((r) => o.mf.brushTo('dwarf', r)); K.lab.emit('pollinated', { obj: o.mf.id }); }, ev: { type: 'pollinated' },
        check: (K, o) => { if (!o.mf.emasc) return { ok: false, see: X('The dwarf flower still had its own anthers when you brushed it.'), why: X('A pea bud pollinates itself before it opens. Its own pollen got there first, so this is not a cross. Watch what its seeds turn out to be.') };
          if (o.mf.pollen !== 'tall') return { ok: false, see: X('No pollen from the tall plant reached the stigma.'), why: X('Touch the tall plant\'s flower first, so the brush picks up its pollen, then the dwarf flower\'s stigma.') }; return null; },
        see: X('The stigma turns yellow with the tall plant\'s pollen. A small paper bag goes over the flower so no insect brings other pollen.'),
        why: X('Pollen carries the male gametes. Each pollen grain will fertilise one ovule in the pistil; each fertilised ovule becomes a seed.') },
      { do: X('Slide the calendar on 4 weeks.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.mf.setT(4 * k)); o.mf.setT(4); K.lab.emit('day', { obj: o.mf.id }); }, ev: { type: 'day' },
        see: X('The petals fall and a green pod grows where the flower was. In 4 weeks it is fat and ripe.') },
      { do: X('Pick the pod and open it over the white tray.'), target: 'pod',
        act: async (K, o) => { o.pod.g.visible = false; await run((r) => o.mf.openPod(r)); K.lab.emit('opened', { obj: o.mf.id }); }, ev: { type: 'opened' },
        check: (K, o) => { const s = o.mf.f1Seeds; if (!s.length) return { ok: false, see: X('There is no pod: the flower was never pollinated.'), why: X('A flower without its anthers sets seed only if pollen is brought to it. Go back and dust the tall plant\'s pollen on its stigma.') };
          if (s[0].wr) return { ok: false, see: X('All six seeds are wrinkled, like the dwarf mother\'s own.'), why: X('The flower pollinated itself before you removed its anthers: these seeds come from the dwarf plant alone (tt rr). Mendel had to remove the anthers while the flower was still a closed bud.') }; return null; },
        see: X('Six seeds, and every one is round, though the mother plant\'s own seeds are wrinkled.'),
        why: X('These seeds are the first generation (F1). Each got a gene for "round" from the tall plant\'s pollen and one for "wrinkled" from the mother. Round is dominant: one copy is enough to show. Wrinkled is recessive: it is hidden.') },
      { do: X('Sow the F1 seeds: carry the packet to the four small pots.'), target: 'seedsF1',
        act: async (K, o) => { await run((r) => o.mf.sowF1(r)); K.lab.emit('sown', { obj: o.mf.id }); }, ev: { type: 'sown' },
        see: X('Four round seeds go into four pots.') },
      { do: X('Slide the calendar on 9 weeks: watch the F1 plants grow.'), target: 'knob',
        act: async (K, o) => { await K.tween(5, (k) => o.mf.setT(9 * k)); o.mf.setT(9); K.lab.emit('day', { obj: o.mf.id }); }, ev: { type: 'day' },
        check: (K, o) => (o.mf.f1Seeds[0] && !o.mf.f1Seeds[0].tall ? { ok: false, see: X('All four F1 plants are dwarf.'), why: X('These seeds came from the dwarf plant pollinating itself, so they carry only "dwarf" genes (tt).') } : null),
        see: X('All four F1 plants grow tall, as tall as the tall parent. Not one is dwarf, and not one is in between.'),
        why: X('Every F1 plant got one "tall" gene (T) and one "dwarf" gene (t). Tall is dominant over dwarf, so all of them are tall: Tt.') },
      { do: X('Let the F1 flowers pollinate themselves. When their pods are ripe, push the button to shell all the pods into the tray.'), target: 'shellBtn',
        act: async (K, o) => { await run((r) => o.mf.shell(r)); K.lab.emit('shelled', { obj: o.mf.id }); }, ev: { type: 'shelled' },
        check: (K, o) => { const c = o.mf.counts(); if (!c.wr || !c.round) return { ok: false, see: F3((L, w) => `${w('Round')}: ${c.round} · ${w('Wrinkled')}: ${c.wr}.`), why: X('Only one kind of seed came back: the F1 plants were not hybrids, so nothing hidden could come out again.') };
          const q = c.round / c.wr; if (q > 1.9 && q < 5) return null; return { ok: false, see: F3((L, w) => `${w('Round')}: ${c.round} · ${w('Wrinkled')}: ${c.wr} = ${ratio(c.round, c.wr)} : 1.`), why: X('The ratio comes out near 3 : 1 on average, but with only 40 seeds chance can push it further either way. Mendel counted more than 7,000 seeds and got 2.96 : 1.') }; },
        see: X('About three quarters of the F2 seeds are round and one quarter are wrinkled: the wrinkled kind, hidden in F1, is back.'),
        why: X('Each F1 plant (Rr) makes two kinds of gametes, R and r, in equal numbers. They meet at random: RR, Rr, rR, rr. Three of the four have at least one R and are round; only rr is wrinkled.') },
      { do: X('Sow all the F2 seeds in the bed: carry the packet there.'), target: 'seedsF2',
        act: async (K, o) => { await run((r) => o.mf.sowF2(r)); K.lab.emit('sown', { obj: o.mf.id }); }, ev: { type: 'sown' },
        see: X('Forty seeds go into the bed in rows, round and wrinkled alike.') },
      { do: X('Slide the calendar on 9 weeks: count the tall and dwarf F2 plants.'), target: 'knob',
        act: async (K, o) => { await K.tween(6, (k) => o.mf.setT(9 * k)); o.mf.setT(9); K.lab.emit('day', { obj: o.mf.id }); }, ev: { type: 'day' },
        check: (K, o) => { const c = o.mf.counts(); if (!c.short || !c.tall) return { ok: false, see: F3((L, w) => `${w('Tall')}: ${c.tall} · ${w('Dwarf')}: ${c.short}.`), why: X('All the plants are alike: the cross at the start did not make hybrids.') };
          const q = c.tall / c.short; if (q > 1.9 && q < 5) return null; return { ok: false, see: F3((L, w) => `${w('Tall')}: ${c.tall} · ${w('Dwarf')}: ${c.short} = ${ratio(c.tall, c.short)} : 1.`), why: X('Chance decides which gametes meet. With 40 plants the ratio can wander from 3 : 1; with thousands it comes very close.') }; },
        see: X('About three quarters of the F2 plants are tall and one quarter dwarf. And height and seed shape went separately: there are tall plants from wrinkled seeds and dwarf ones from round seeds.'),
        why: X('The dwarf trait came back in F2 because the "t" gene was carried, unseen, in every F1 plant. Height and seed shape are inherited independently of each other (about 9 : 3 : 3 : 1 for the four combinations).') },
      { do: X('Build the Punnett square: put the gamete cards T and t along the top and down the side of the board.'), target: 'card',
        act: async (K, o) => { const sl = [...o.mf.slots.top, ...o.mf.slots.side]; for (let i = 0; i < 4; i++) { const c = o.cards[i]; if (c.slotJ != null) continue; await new Promise((r) => { c.flying = true; O1.flyT(c, sl[[0, 1, 2, 3][i]].clone(), 0, 0.5, () => { c.flying = false; c.slotJ = i; r(); }); }); } o.mf.drawPunnett(); K.lab.emit('punnett', { obj: o.mf.id }); }, ev: { type: 'punnett' },
        check: (K, o) => { const top = o.cards.filter((c) => c.slotJ === 0 || c.slotJ === 1).map((c) => c.gam).sort().join(''), side = o.cards.filter((c) => c.slotJ === 2 || c.slotJ === 3).map((c) => c.gam).sort().join(''); if (top === 'Tt' && side === 'Tt') return null;
          return { ok: false, see: X('One row of gametes has two cards of the same kind.'), why: X('Each F1 parent (Tt) makes both kinds of gametes, T and t, in equal numbers: put one T and one t along the top, and one T and one t down the side.') }; },
        see: X('The square shows TT, Tt, Tt and tt: three of the four boxes have T (tall), one is tt (dwarf). Your own count is beside it.'),
        why: X('This is Mendel\'s law: each parent passes on one of its two copies of a gene, chosen at random, and a dominant trait hides a recessive one. The 3 : 1 ratio is the result.') },
    ],
    eq: { word: 'Monohybrid cross', sym: 'TT × tt → F1: Tt (all tall) → F2: TT, Tt, Tt, tt = 3 tall : 1 dwarf' },
    result: { obs: X('After the anthers were removed and the tall plant\'s pollen was brushed on, every F1 seed was round and every F1 plant was tall. In F2 the wrinkled seeds and the dwarf plants came back, in about one quarter of the seeds and plants, and the two traits went separately.'),
      concl: X('Traits are passed on by genes that come in pairs, one from each parent. A dominant gene (T, R) hides a recessive one (t, r) in F1; in F2 the recessive trait reappears in about a quarter of the offspring (3 : 1). Different traits are inherited independently.'),
      safety: X('Handle the flowers gently with clean forceps and brush; label every bag and pot so the generations are not mixed up.'),
      viva: [{ q: X('Why did Mendel remove the anthers?'), a: X('So the flower could not pollinate itself; only the pollen he chose could reach it.') }, { q: X('What is the ratio of tall to dwarf plants in F2?'), a: X('About 3 : 1.') },
        { q: X('Which trait is recessive: tall or dwarf?'), a: X('Dwarf.') }] },
  },
  // ============================================================ Class 10 · beetles and crows: natural selection
  {
    id: 'bw10_selection', subj: 'biology', cls: 10, ch: C10H, world: true, place: 'grass', table: false, topic: 'heredity',
    title: X('Green beetles, brown beetles and hungry crows'),
    aim: X('To let a mixed group of green and brown beetles loose on a green or a brown plot with your own hand, let crows hunt them season after season, and watch which colour survives and spreads, and why.'),
    kind: X('Variation and natural selection'),
    setup(K) {
      const W = Wd(K); const bp = K.add(L2.beetlePlots({ W }), 0, 0, { y: 0 }); bp.W = W;
      const box = K.add(L2.beetleBox(N('Box of 20 beetles', '20 भृंगों का डिब्बा', '20 beetles ka dibba')), -0.2, -0.45, { y: 0.0 });
      const button = K.add(MW.pullTab(), 0.25, -0.45, { y: 0.02 });
      L2.bindSelection(bp, { box, button }, K.app, { release: 1, g1: 2, g5: 3, g10: 4 }, { released: emit(K, bp, 'released'), gen: emit(K, bp, 'gen') });
      camBy(bp, K.app, [bp.views.all, bp.views.all, bp.views.all, bp.views.chart, bp.views.chart, bp.views.chart]);
      return { bp, box, button };
    },
    steps: [
      { do: X('Kyun? Grasshoppers in green grass are green, and the ones in a dry field are brown. Did they choose their colour? Look at the beetles in the box: one kind of beetle, two colours.'), target: 'bp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bp.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Ten green beetles and ten brown ones, all of the same kind. Two plots lie in front of you: fresh green grass and bare brown soil. Two crows sit on a post.'),
        why: X('Members of one species are never all exactly alike: this is variation. Some differences, like this colour, are passed on from parents to young.') },
      { do: X('Carry the box to the plot you choose, green or brown, and let the beetles go.'), target: 'box',
        act: async (K, o) => { o.box.g.visible = false; o.bp.release('green'); K.lab.emit('released', { obj: o.bp.id }); }, ev: { type: 'released' },
        see: X('The beetles spread out over the plot. On their own colour they almost vanish; the others stand out.') },
      { do: X('Push the button: one season passes. Watch the crows.'), target: 'button',
        act: async (K, o) => { await run((r) => o.bp.runSeasons(1, r)); K.lab.emit('gen', { obj: o.bp.id }); }, ev: { type: 'gen' },
        see: X('The crows fly down and pick off beetles, mostly the ones that do not match the ground. The survivors breed and the plot fills up again with their young.'),
        why: X('A beetle that matches the ground is hard to see, so it is more likely to live long enough to breed. Its young have its colour.') },
      { do: X('Push the button again: five more seasons. Watch the chart.'), target: 'button',
        act: async (K, o) => { await run((r) => o.bp.runSeasons(6 - o.bp.gen, r)); K.lab.emit('gen', { obj: o.bp.id }); }, ev: { type: 'gen' },
        check: (K, o) => { const c = o.bp.count(), match = o.bp.ground[o.bp.where] === 'green' ? c.g : c.b; if (match >= 14) return null;
          return { ok: false, see: F3((L, w) => `${w('After 6 generations')}: ${w('green')} ${c.g}, ${w('brown')} ${c.b}.`), why: X('Selection works on chances, not certainties. In a small group luck also plays a part; run on, and the matching colour almost always wins.') }; },
        see: X('Season by season the matching colour takes over. After six generations nearly all the beetles have the colour of the ground.'),
        why: X('No beetle changed its colour. The ones that matched simply had more young. This is natural selection: a variation that helps survival becomes common over generations.') },
      { do: X('Now the weather changes: the plot changes colour. Push the button for five more seasons.'), target: 'button',
        act: async (K, o) => { if (!o.bp.dry) { o.bp.dry = true; o.bp.drought(); } await run((r) => o.bp.runSeasons(11 - o.bp.gen, r)); K.lab.emit('gen', { obj: o.bp.id }); }, ev: { type: 'gen' },
        see: X('Now the other colour has the advantage. If a few beetles of that colour were still left, they spread back; if none were left, the beetles stay the wrong colour and are eaten.'),
        why: X('Natural selection can only choose among the variations that exist. Variation in a population is what lets a species survive when its surroundings change.') },
      { do: X('Look at the chart of all the generations.'), target: 'bp',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.bp.id }); await K.sleep(3); }, ev: { type: 'look2' },
        see: X('The share of each colour rose and fell with the colour of the ground.'),
        why: X('Over thousands of generations, selection like this changes a species bit by bit: the matching variations add up. This is how evolution works.') },
    ],
    eq: { word: 'Natural selection', sym: 'variation + inheritance + selection (crows) → the matching colour spreads' },
    result: { obs: X('On the plot the beetles were let go on, the crows ate mostly the beetles whose colour stood out. Over six generations the matching colour came to make up nearly the whole group. When the plot changed colour, the other colour spread back if any were left.'),
      concl: X('Individuals of a species vary. Variations that help them survive and reproduce in their surroundings are passed on more often, and become common over generations: natural selection. Variation is what lets a population adapt when its surroundings change.'),
      safety: X('Watch insects and birds in nature without disturbing them.'),
      viva: [{ q: X('Did any beetle change its colour?'), a: X('No: the matching ones survived and had more young.') }, { q: X('What is natural selection?'), a: X('Variations that help survival and reproduction are passed on more often and spread over generations.') },
        { q: X('Why is variation useful for a species?'), a: X('If the surroundings change, some individuals may still be suited to them and survive.') }] },
  },
  // ============================================================ Class 10 (9) · variation in a class
  {
    id: 'bw10_variation', subj: 'biology', cls: 10, also: [9], ch: C10H, world: true, place: 'room', table: true, topic: 'heredity',
    title: X('No two alike: measure the variation in your class'),
    aim: X('To read the heights of ten classmates from the pencil marks on the class height chart, sort eight classmates\' ear lobes into free and attached, and see the shape of the variation in the whole class.'),
    kind: X('Continuous and discontinuous variation'),
    setup(K) {
      const W = Wd(K); const vc = K.add(L2.classChart({ W }), 0, 0, { y: 0 }); vc.W = W;
      const square = K.add(O1.thing(N('Set square', 'सेट स्क्वायर', 'Set square'), L2.setSquare(), { hitR: 0.07, hitY: 0.01 }), -0.6, -0.5, BY);
      const ears = L2.EARS.map((f, i) => K.add(L2.earCard(f, N(`Ear of classmate ${i + 1}`, `सहपाठी ${i + 1} का कान`, `Classmate ${i + 1} ka kaan`)), -0.25 + (i % 4) * 0.11, -0.55 - Math.floor(i / 4) * 0.13, BY));
      const button = K.add(MW.pullTab(), 1.05, -0.45, { y: 0.92 });
      L2.bindVariation(vc, { square, ears, button }, K.app, { measure: 1, ears: 2, all: 3 }, { measured: emit(K, vc, 'measured'), sorted: emit(K, vc, 'sorted'), all: emit(K, vc, 'all') });
      camBy(vc, K.app, [vc.views.board, vc.views.wall, vc.views.table, vc.views.board]);
      return { vc, square, ear: ears[0], ears, button };
    },
    steps: [
      { do: X('Kyun? Thirty students sit in your class. Why is nobody exactly as tall as anybody else, while everybody\'s ear lobes are one of just two kinds? Look at the height chart on the wall.'), target: 'vc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.vc.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Pencil marks with names: last week the class stood against the chart one by one.') },
      { do: X('Hold the set square level on each of the ten marks and read the height.'), target: 'square',
        act: async (K, o) => { for (let i = 0; i < 10; i++) if (o.vc.read[i] == null) await run((r) => o.vc.measure(i, o.square, r)); K.lab.emit('measured', { obj: o.vc.id }); }, ev: { type: 'measured' },
        see: X('Every reading is different: from the 140s to the 170s. The bars on the board grow: most heights are near the middle, few at the ends.'),
        why: X('Height varies in tiny steps between people: this is continuous variation. Many genes and also food and health decide it.') },
      { do: X('Now look at each classmate\'s ear and put the card on "free" or "attached".'), target: 'ear',
        act: async (K, o) => { for (const e of o.ears) if (!e.on) await run((r) => o.vc.putEar(e, e.free ? 'free' : 'att', r)); K.lab.emit('sorted', { obj: o.vc.id }); }, ev: { type: 'sorted' },
        check: (K, o) => { const bad = o.ears.filter((e) => (e.on === 'free') !== e.free); if (!bad.length) return null; return { ok: false, see: F3((L, w) => `${w('Cards on the wrong mat')}: ${bad.length}.`), why: X('Look at the bottom of the ear: a free lobe hangs below where the ear joins the cheek; an attached lobe runs straight into the cheek.') }; },
        see: X('Each ear is clearly one kind or the other: there is no "half-attached" lobe.'),
        why: X('Ear lobes vary in two clear kinds only: this is discontinuous variation. It is decided by a single gene pair, inherited from the parents.') },
      { do: X('Push the button to add the rest of the class from the class register.'), target: 'button',
        act: async (K, o) => { o.vc.all = true; o.vc.board(); K.lab.emit('all', { obj: o.vc.id }); await K.sleep(1); }, ev: { type: 'all' },
        see: X('With all thirty, the height bars make a hill: many near the average, fewer and fewer towards the shortest and the tallest. The ear lobes split into two groups, about two free for every one attached.'),
        why: X('Variation is the raw material of evolution, and the reason no two of us are alike, except identical twins.') },
    ],
    eq: { word: 'Variation', sym: 'height: continuous (a hill-shaped spread) · ear lobe: discontinuous (two kinds)' },
    result: { obs: X('The ten heights were all different, spread from the 140s to the 170s cm, most near the middle. The ear lobes were either free or attached, nothing in between. For the whole class the heights made a hill-shaped bar chart, and the lobes were about two free to one attached.'),
      concl: X('Individuals of a species differ: this is variation. Some traits, like height, vary continuously; others, like the ear lobe, come in a few clear kinds. Much of this variation is inherited, and it is what natural selection acts on.'),
      safety: X('Respect your classmates: differences in height or looks are natural and nothing to tease anyone about.'),
      viva: [{ q: X('Is height an example of continuous or discontinuous variation?'), a: X('Continuous.') }, { q: X('Name a trait that shows discontinuous variation.'), a: X('Ear lobe: free or attached.') },
        { q: X('Why do we not all look alike?'), a: X('We get different combinations of genes from our parents, and our surroundings differ too.') }] },
  },
];
