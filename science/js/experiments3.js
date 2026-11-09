// Chemistry experiments, batch 3: the remaining Class 6–8 book activities (NCERT Curiosity books and the older
// Class 7/8 books that schools still use). Same shape as experiments.js: setup → steps (do → see → why) → equation → result.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const C6W = 'Ch 8 · A Journey through States of Water', C6S = 'Ch 9 · Methods of Separation in Everyday Life';
const C7A = 'Ch 2 · Exploring Substances: Acidic, Basic, and Neutral', C7M = 'Ch 4 · The World of Metals and Non-metals', C7C = 'Ch 5 · Changes Around Us: Physical and Chemical';
const until = async (K, test, max = 30) => { let t = 0; while (!test() && t < max) { await K.sleep(0.25); t += 0.25; } }; // max is in lab seconds

export const EXPERIMENTS3 = [
  // ===================================================== Class 6
  {
    id: 'evaporation', cls: 6, also: [9], ch: X(C6W), title: X('What makes water evaporate faster?'),
    aim: X('To show that water evaporates, and that it evaporates faster from a bigger surface, in sunlight, and that spirit evaporates faster than water.'),
    kind: X('Evaporation'),
    setup(K) {
      const A3 = K.A3;
      const plate = K.place(A3.steelPlate(), -0.38, -0.62); K.lab.fill(plate, 'water', 5);
      const c1 = K.place(A3.bottleCap({ name: { en: 'Bottle cap 1', hi: 'बोतल का ढक्कन 1', hg: 'Bottle cap 1' } }), -0.2, -0.62); K.lab.fill(c1, 'water', 5);
      const c2 = K.place(A3.bottleCap({ name: { en: 'Bottle cap 2 (shade)', hi: 'बोतल का ढक्कन 2 (छाया)', hg: 'Bottle cap 2 (chhaya)' } }), 0.04, -0.62); K.lab.fill(c2, 'water', 5);
      const lamp = K.lamp3(0.16, -0.66); const c3 = K.place(A3.bottleCap({ color: 0xc9442f, name: { en: 'Bottle cap 3 (in the light)', hi: 'बोतल का ढक्कन 3 (रोशनी में)', hg: 'Bottle cap 3 (roshni mein)' } }), 0.28, -0.66); K.lab.fill(c3, 'water', 5);
      const wg = K.add(K.A.watchGlass(), 0.0, -0.46); K.lab.fill(wg, 'spirit', 2); wg.name = X('Watch glass with spirit');
      for (const v of [plate, c1, c2, c3, wg]) v.evapOpen = true; c3.sunBy = lamp;
      return { plate, c1, c2, c3, lamp, wg };
    },
    steps: [
      { do: X('5 mL of water has been put in a steel plate and 5 mL in a bottle cap. Leave them side by side and watch (time-lapse).'), target: 'plate', act: (K) => K.wait(11, 60),
        see: X('The water in the plate disappears first. The bottle cap still has most of its water.'), why: X('Water evaporates only from its surface. The plate spreads the water over a much bigger surface, so it evaporates faster.') },
      { do: X('Switch on the lamp over bottle cap 3. Bottle cap 2 stays in the shade.'), target: 'lamp', act: (K, o) => K.lampOn(o.lamp, true), ev: { type: 'lamp_on' },
        see: X('The lamp shines warm light on cap 3, like sunlight.') },
      { do: X('Watch the two caps (time-lapse).'), target: 'c3', act: (K) => K.wait(10, 420),
        see: X('The cap in the light dries up much sooner; the cap in the shade still has water.'), why: X('Heat makes the water particles move faster, so more of them escape into the air. Clothes dry faster in the sun for the same reason.') },
      { do: X('Look at the spirit on the watch glass.'), target: 'wg', act: (K) => K.wait(10, 30),
        see: X('The spirit disappears within minutes, much faster than water, and leaves nothing behind.'), why: X('Spirit evaporates much more easily than water. When it evaporates from your skin, it takes heat away, so it feels cold.') },
    ],
    eq: { word: 'Liquid water → water vapour (evaporation): faster with a bigger surface, heat and wind', sym: 'H₂O(l) → H₂O(g)' },
    result: { obs: X('The plate dried before the cap; the cap in the light dried before the one in the shade; spirit evaporated fastest.'),
      concl: X('Evaporation happens from the surface of a liquid at all temperatures. It is faster with a bigger surface, more heat, and for liquids like spirit.'),
      safety: X('Keep spirit away from flames. Do not touch the hot lamp.'),
      viva: [{ q: X('Why do wet clothes dry faster when spread out?'), a: X('A bigger surface lets more water evaporate at the same time.') }, { q: X('Why does water in the sun evaporate faster?'), a: X('The heat makes water particles move faster, so more of them escape.') }, { q: X('Why does spirit feel cold on the skin?'), a: X('It evaporates quickly and takes heat from the skin.') }] },
  },
  {
    id: 'condensation', cls: 6, ch: X(C6W), title: X('Water drops on a cold glass'),
    aim: X('To show that air contains water vapour, which condenses into drops on a cold surface.'),
    kind: X('Condensation'),
    setup(K) {
      const A3 = K.A3;
      const t = K.place(A3.tumbler({ name: { en: 'Glass tumbler (cold water)', hi: 'काँच का गिलास (ठंडा पानी)', hg: 'Glass tumbler (thanda paani)' } }), -0.16, -0.62);
      const t2 = K.place(A3.tumbler({ name: { en: 'Glass tumbler (tap water)', hi: 'काँच का गिलास (नल का पानी)', hg: 'Glass tumbler (nal ka paani)' } }), 0.16, -0.62); K.lab.fill(t2, 'water', 150);
      const jug = K.beaker(-0.42, -0.7, 'water', 200, 250); jug.name = X('Cold water'); jug.mix.temp = 8;
      return { t, t2, jug };
    },
    steps: [
      { do: X('Wipe the outside of the empty tumbler completely dry.'), target: 't', act: async (K, o) => { await K.up(o.t, 0.05, 0.4); await K.sleep(0.6); await K.home(o.t, 0.5); },
        see: X('The tumbler is dry and clear outside.') },
      { do: X('Pour cold water into the tumbler until it is about three-quarters full.'), target: 'jug', act: (K, o) => K.pour(o.jug, o.t, 150), ev: { type: 'pour', from: 'jug', to: 't', ml: 120 },
        see: X('The tumbler now holds cold water.') },
      { do: X('Add a few ice cubes.'), target: 't', act: async (K, o) => { K.ice(o.t, 4); K.app.audio && K.app.audio.clink && K.app.audio.clink(); await K.sleep(0.8); },
        see: X('The ice cubes float and the water becomes colder still.') },
      { do: X('Leave it for five minutes and look at the outside of both tumblers (time-lapse).'), target: 't', act: (K) => K.wait(11, 30),
        see: X('First the outside of the cold tumbler becomes misty, then tiny drops of water cover it and trickle down. The tumbler of tap water stays dry. The water inside does not go down.'),
        why: X('The drops did not come from inside. Air contains water vapour; when it touches the cold glass it cools and condenses into liquid water.') },
    ],
    eq: { word: 'Water vapour in the air → liquid water drops (condensation on a cold surface)', sym: 'H₂O(g) → H₂O(l)' },
    result: { obs: X('Water drops formed on the outside of the cold tumbler but not on the tumbler of tap water.'), concl: X('Air contains water vapour, which condenses into liquid water on a cold surface.'),
      safety: X('Handle glass carefully; a wet glass is slippery.'),
      viva: [{ q: X('Where did the drops on the cold glass come from?'), a: X('From water vapour in the air around it.') }, { q: X('What is this change called?'), a: X('Condensation: water vapour turning into liquid water.') }, { q: X('Name one place where you see condensation at home.'), a: X('On a cold water bottle taken out of the fridge, or on a bathroom mirror.') }] },
  },
  {
    id: 'sedimentation', cls: 6, ch: X(C6S), title: X('Sedimentation and decantation of muddy water'),
    aim: X('To separate mud from water by letting it settle (sedimentation) and pouring off the water (decantation), and to see how alum helps.'),
    kind: X('Separation by sedimentation and decantation'),
    setup(K) {
      const a = K.beaker(-0.3, -0.64, 'water', 150, 250); a.name = X('Beaker A');
      const b = K.beaker(-0.02, -0.64, null, 0, 250); b.name = X('Beaker B');
      const d = K.beaker(0.3, -0.66, null, 0, 250); d.name = X('Beaker C (empty)');
      const soil = K.solid('soil', -0.44, -0.48); const alum = K.solid('alum', 0.14, -0.48); const rod = K.rod(-0.16, -0.44);
      return { a, b, d, soil, alum, rod };
    },
    steps: [
      { do: X('Add a spatula of soil to the water in beaker A and stir.'), target: 'soil', act: async (K, o) => { await K.addSolid(o.soil, o.a); await K.stir(o.rod, o.a, 4); }, ev: { type: 'stir', v: 'a' },
        see: X('The water turns muddy brown.') },
      { do: X('Pour half of the muddy water into beaker B.'), target: 'a', act: (K, o) => K.pour(o.a, o.b, 75), ev: { type: 'pour', from: 'a', to: 'b', ml: 60 },
        see: X('Both beakers now hold muddy water.') },
      { do: X('Add a pinch of powdered alum (fitkari) to beaker B and stir gently.'), target: 'alum', act: async (K, o) => { await K.addSolid(o.alum, o.b); await K.stir(o.rod, o.b, 2); }, ev: { type: 'stir', v: 'b' },
        see: X('Small brown flakes begin to form in beaker B.') },
      { do: X('Leave both beakers still and watch (time-lapse).'), target: 'a', act: (K) => K.wait(12, 60),
        see: X('In both beakers the sand and heavy mud settle at the bottom within a minute. Beaker A stays cloudy for a long time; beaker B becomes clear much faster.'),
        why: X('Heavy particles sink to the bottom: this is sedimentation. Alum makes the tiny clay particles stick together into bigger flakes, which settle quickly.') },
      { do: X('Tilt beaker B gently and pour the clear water into beaker C without disturbing the mud.'), target: 'b', act: (K, o) => K.pourSlow(o.b, o.d, 50, 0.3), ev: { type: 'pour', from: 'b', to: 'd', ml: 30 },
        see: X('Clear water goes into beaker C; the mud stays at the bottom of beaker B.'), why: X('Pouring off the liquid and leaving the settled solid behind is called decantation.') },
    ],
    eq: { word: 'Muddy water → clear water (poured off) + mud (sediment)', sym: 'Heavy particles settle (sedimentation) · clear liquid poured off (decantation) · alum speeds it up' },
    result: { obs: X('The mud settled at the bottom and the clear water could be poured off. With alum the water cleared much faster.'),
      concl: X('Insoluble heavy particles can be separated from a liquid by sedimentation and decantation; alum helps the fine particles settle.'),
      safety: X('Do not drink the decanted water; it is not yet safe to drink.'),
      viva: [{ q: X('What is sedimentation?'), a: X('The settling of heavier insoluble particles at the bottom of a liquid.') }, { q: X('What is decantation?'), a: X('Gently pouring off the liquid without disturbing the settled solid.') }, { q: X('Why is alum added to muddy water?'), a: X('It makes fine particles clump together so that they settle faster.') }] },
  },
  {
    id: 'filtration', cls: 6, ch: X(C6S), title: X('Filtering muddy water'),
    aim: X('To separate insoluble solid particles from a liquid by filtration.'),
    kind: X('Separation by filtration'),
    setup(K) {
      const mud = K.beaker(-0.3, -0.64, 'water', 100, 250); mud.mix.ppt.mud = 0.7; mud.mix.ppt.clay = 0.5; mud.mix.cloud = 0.9; mud.stirT = 1e6; mud.name = X('Muddy water'); // kept stirred so it stays muddy until it is poured
      const w = K.beaker(-0.46, -0.48, 'water', 30, 50); w.name = X('Clean water');
      const fl = K.flask(0.08, -0.62); fl.name = X('Conical flask');
      const f = K.filterOver(fl); f.paper.visible = false;
      return { mud, w, fl, f };
    },
    steps: [
      { do: X('Fold a filter paper in half and then in half again, open it into a cone and fit it into the funnel.'), target: 'f', act: async (K, o) => { o.f.paper.visible = true; o.f.paper.scale.set(0.2, 0.2, 0.2); await K.tween(0.8, (k) => o.f.paper.scale.setScalar(0.2 + 0.8 * k)); },
        see: X('The paper cone sits neatly inside the funnel.') },
      { do: X('Wet the paper with a little clean water so that it sticks to the glass.'), target: 'w', act: (K, o) => K.pour(o.w, o.f, 4), ev: { type: 'pour', from: 'w', to: 'f', ml: 2 },
        see: X('The wet paper sticks to the funnel; a few clear drops fall into the flask.') },
      { do: X('Pour the muddy water slowly into the cone, keeping the level below the edge of the paper.'), target: 'mud', act: (K, o) => K.pourSlow(o.mud, o.f, 40), ev: { type: 'pour', from: 'mud', to: 'f', ml: 25 },
        see: X('The cone fills with muddy water.') },
      { do: X('Wait and watch the liquid that drips into the flask (time-lapse).'), target: 'fl', act: async (K, o) => { const l0 = K.app.chem.lapse; K.app.chem.lapse = 10; K.app.lapseShown = 10; await until(K, () => o.f.ml < 0.1, 40); K.app.chem.lapse = l0; K.app.lapseShown = 0; await K.sleep(0.5); },
        see: X('Clear water drips from the funnel into the flask. This clear liquid is called the filtrate.'), why: X('Water passes through the tiny holes in the filter paper, but the mud particles are too big to get through.') },
      { do: X('Look at the filter paper.'), target: 'f', act: (K) => K.sleep(1.2),
        see: X('A wet layer of brown mud is left on the paper. This is called the residue.'), why: X('Filtration separates an insoluble solid (residue) from a liquid (filtrate).') },
    ],
    eq: { word: 'Muddy water → clear filtrate (passes through) + mud residue (stays on the paper)', sym: 'Particles bigger than the pores of the paper are held back' },
    result: { obs: X('Clear filtrate collected in the flask; brown mud remained on the filter paper.'), concl: X('Filtration separates insoluble solids from liquids.'),
      safety: X('Never let the liquid rise above the edge of the filter paper.'),
      viva: [{ q: X('What is the filtrate?'), a: X('The clear liquid that passes through the filter paper.') }, { q: X('What is the residue?'), a: X('The solid left on the filter paper.') }, { q: X('Can filtration remove salt from salt water?'), a: X('No. Dissolved salt passes through the paper; we need evaporation for that.') }] },
  },
  {
    id: 'magnet_sep', cls: 6, ch: X(C6S), title: X('Separating iron filings with a magnet'),
    aim: X('To separate iron filings from sand using a magnet.'),
    kind: X('Separation by a magnet'),
    setup(K) {
      const A3 = K.A3;
      const mix = K.place(A3.filingsMix(), -0.12, -0.6);
      const mg = K.place(A3.magnet(), 0.14, -0.46);
      const sh = K.place(A3.paperSheet({ name: { en: 'Clean sheet of paper', hi: 'साफ़ कागज़ की शीट', hg: 'Saaf kaagaz ki sheet' } }), 0.24, -0.66);
      return { mix, mg, sh };
    },
    steps: [
      { do: X('Look at the mixture of iron filings and sand. Try to imagine picking out every bit of iron by hand.'), target: 'mix', act: (K) => K.sleep(1.2),
        see: X('The dark grey iron filings are mixed all through the sand. Picking them out by hand is almost impossible.') },
      { do: X('Wrap the magnet in thin plastic and move it slowly just above the mixture.'), target: 'mg', act: (K, o) => K.sweepMagnet(o.mg, o.mix, 3), ev: { type: 'magnet' },
        see: X('The iron filings jump up and cling to the ends of the magnet in bristly bunches. The sand stays behind.'), why: X('Iron is attracted by a magnet; sand is not.') },
      { do: X('Hold the magnet over the clean paper and pull off the plastic.'), target: 'sh', act: (K, o) => K.releaseFilings(o.mg, o.mix, o.sh), ev: { type: 'release' },
        see: X('The filings drop off and make a small grey heap on the clean paper.') },
      { do: X('Repeat until the magnet picks up no more filings.'), target: 'mix', act: async (K, o) => { await K.sweepMagnet(o.mg, o.mix, 3); await K.releaseFilings(o.mg, o.mix, o.sh); },
        see: X('Now there are two heaps: grey iron filings and yellow sand.'), why: X('No new substance is formed: the iron and the sand are just separated.') },
    ],
    eq: { word: 'Iron filings + sand → iron filings (on the magnet) + sand (left behind)', sym: 'Fe (magnetic)  ·  SiO₂ (non-magnetic)' },
    result: { obs: X('The magnet picked up all the iron filings; the sand was left behind.'), concl: X('A magnet separates a magnetic substance like iron from a non-magnetic one.'),
      safety: X('Keep magnets away from phones, cards and computers.'),
      viva: [{ q: X('Why is the magnet wrapped in plastic?'), a: X('So that the filings can be removed easily by pulling off the plastic.') }, { q: X('Can a magnet separate salt from sand?'), a: X('No, neither salt nor sand is attracted by a magnet.') }, { q: X('Where is magnetic separation used?'), a: X('In scrap yards and factories to separate iron from other waste.') }] },
  },
  // ===================================================== Class 7
  {
    id: 'litmus_home', cls: 7, ch: X(C7A), title: X('Testing household substances with litmus'),
    aim: X('To find out which household substances are acidic, basic or neutral using red and blue litmus paper.'),
    kind: X('Acids, bases and neutral substances'),
    setup(K) {
      const subs = ['lemon', 'vinegar', 'soap', 'bakingsoda', 'limewater', 'sugar'];
      const tile = K.place(K.A3.litmusTile(subs.length), 0.0, -0.5);
      const o = { tile }; subs.forEach((s, i) => { o['b' + i] = K.bottle(s, -0.4 + i * 0.16, -0.76, { dropper: true }); }); return o;
    },
    steps: [
      ['b0', 0, 'Put a drop of lemon juice on a blue and on a red litmus piece.', 'Blue litmus turns red; red litmus stays red.', 'Lemon juice is acidic. Acids turn blue litmus red.'],
      ['b1', 1, 'Now vinegar: one drop on each colour.', 'Blue litmus turns red again; red litmus does not change.', 'Vinegar is acidic.'],
      ['b2', 2, 'Next, soap solution.', 'Red litmus turns blue; blue litmus stays blue.', 'Soap solution is basic. Bases turn red litmus blue.'],
      ['b3', 3, 'Next, baking soda solution.', 'Red litmus turns blue (a little slowly); blue stays blue.', 'Baking soda solution is basic, but weak.'],
      ['b4', 4, 'Next, lime water.', 'Red litmus turns blue.', 'Lime water is basic.'],
      ['b5', 5, 'Last, sugar solution.', 'Neither piece changes colour.', 'Sugar solution is neutral: neither acidic nor basic.'],
    ].map(([b, c, d, see, why]) => ({ do: X(d), target: b, act: async (K, o) => { await K.dropOn(o[b], o.tile, c, 'blue'); await K.dropOn(o[b], o.tile, c, 'red'); }, ev: { type: 'spot' }, see: X(see), why: X(why) })),
    eq: { word: 'Acidic: blue → red · Basic: red → blue · Neutral: no change', sym: 'Lemon juice, vinegar: acidic  ·  soap, baking soda, lime water: basic  ·  sugar solution: neutral' },
    result: { obs: X('Lemon juice and vinegar turned blue litmus red; soap, baking soda and lime water turned red litmus blue; sugar solution changed neither.'),
      concl: X('Litmus shows whether a substance is acidic, basic or neutral.'), safety: X('Use a separate dropper for each sample and never taste them.'),
      viva: [{ q: X('What does an acid do to blue litmus?'), a: X('It turns it red.') }, { q: X('What does a base do to red litmus?'), a: X('It turns it blue.') }, { q: X('Where does litmus come from?'), a: X('From lichens, a kind of plant.') }] },
  },
  {
    id: 'rose', cls: 7, ch: X(C7A), title: X('Red rose indicator'),
    aim: X('To make an indicator from red rose petals and use it to find acids and bases.'),
    kind: X('Natural indicator'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = ['lemon', 'soap', 'vinegar', 'bakingsoda'].map((s, i) => { const v = K.tube(rk, i + 1, s, 5); v.tag = 'ABCD'[i]; return v; });
      const ex = K.beaker(-0.42, -0.62, 'rose', 50, 100); ex.name = X('Rose petals soaked in hot water');
      const petals = []; for (let i = 0; i < 7; i++) { const m = new K.THREE.Mesh(new K.THREE.SphereGeometry(0.009, 10, 6, 0, 3.1, 0, 1.2), new K.THREE.MeshStandardMaterial({ color: 0xb0203a, roughness: 0.6, side: 2 })); m.scale.set(1, 0.25, 0.8); const a = i * 0.9; m.position.set(Math.cos(a) * 0.012, ex.heightFor(50) - 0.002, Math.sin(a) * 0.012); m.rotation.set(Math.random(), a, 0); m.userData.noHit = true; ex.g.add(m); petals.push(m); }
      const rb = K.bottle('rose', -0.3, -0.8, { dropper: true });
      const o = { rk, ex, rb }; t.forEach((x, i) => { o['t' + i] = x; }); return o;
    },
    steps: [
      { do: X('Look at the indicator: red rose petals were crushed, soaked in hot water for ten minutes and filtered.'), target: 'ex', act: (K) => K.sleep(1.2),
        see: X('The filtered extract is a pinkish-red liquid.') },
      { do: X('Add rose extract to test tube A (lemon juice).'), target: 't0', act: (K, o) => K.drops(o.rb, o.t0, 5), ev: { type: 'drops', to: 't0' }, see: X('It turns bright red-pink.'), why: X('Rose extract turns red in acids.') },
      { do: X('Add rose extract to test tube B (soap solution).'), target: 't1', act: (K, o) => K.drops(o.rb, o.t1, 5), ev: { type: 'drops', to: 't1' }, see: X('It turns green.'), why: X('Rose extract turns green in bases.') },
      { do: X('Add it to test tube C (vinegar).'), target: 't2', act: (K, o) => K.drops(o.rb, o.t2, 5), ev: { type: 'drops', to: 't2' }, see: X('Red-pink.'), why: X('Vinegar is acidic.') },
      { do: X('Add it to test tube D (baking soda solution).'), target: 't3', act: (K, o) => K.drops(o.rb, o.t3, 5), ev: { type: 'drops', to: 't3' }, see: X('Green.'), why: X('Baking soda solution is basic.') },
    ],
    eq: { word: 'Red rose extract: red-pink in acids · green in bases', sym: 'Lemon juice, vinegar: red-pink  ·  soap, baking soda: green' },
    result: { obs: X('Acids turned the rose extract red-pink; bases turned it green.'), concl: X('Red rose petals give a natural indicator for acids and bases.'),
      safety: X('Use fallen petals; ask an adult to help with the hot water.'),
      viva: [{ q: X('Colour of rose extract in an acid?'), a: X('Red-pink.') }, { q: X('Colour in a base?'), a: X('Green.') }, { q: X('Name two other natural indicators.'), a: X('Turmeric and china rose (gudhal).') }] },
  },
  {
    id: 'lemon_lime', cls: 7, ch: X(C7A), title: X('Neutralising lemon juice with lime water'),
    aim: X('To show that an acid (lemon juice) is neutralised by a base (lime water), using litmus solution.'),
    kind: X('Neutralisation'),
    setup(K) {
      const rk = K.rack(0.02, -0.64); const t = K.tube(rk, 3, 'water', 1); t.name = X('Test tube with 20 drops of water');
      const lem = K.bottle('lemon', -0.42, -0.74, { dropper: true }); const lit = K.bottle('bluelitmus', -0.26, -0.78, { dropper: true }); const lw = K.bottle('limewater', 0.34, -0.76, { dropper: true });
      return { rk, t, lem, lit, lw };
    },
    steps: [
      { do: X('Add one drop of lemon juice to the test tube of water.'), target: 'lem', act: (K, o) => K.drops(o.lem, o.t, 1), ev: { type: 'drops', to: 't' }, see: X('The solution looks almost colourless.') },
      { do: X('Add one drop of blue litmus solution.'), target: 'lit', act: (K, o) => K.drops(o.lit, o.t, 1), ev: { type: 'drops', to: 't' }, see: X('It turns red.'), why: X('The lemon juice is acidic, so the litmus turns red.') },
      { do: X('Add lime water drop by drop, swirling after each drop, until the colour changes.'), target: 'lw', act: (K, o) => K.dropsUntil(o.lw, o.t, (v) => v.mix.pH() > 7.6, 45), ev: { type: 'drop', from: 'lw', to: 't' }, until: (K, o) => o.t.mix.pH() > 7.6, // by hand: done when the colour has changed
        see: X('The solution stays red for many drops, then turns purple and suddenly blue.'), why: X('Each drop of lime water (a base) uses up some of the acid. When all the acid is used up, the solution becomes neutral and then slightly basic.') },
      { do: X('Now add one more drop of lemon juice.'), target: 'lem', act: (K, o) => K.drops(o.lem, o.t, 1), ev: { type: 'drops', to: 't' }, see: X('The colour turns back towards red.'), why: X('The new acid is no longer neutralised.') },
    ],
    eq: { word: 'Acid + base → salt + water (+ heat)', sym: 'Citric acid (lemon) + Ca(OH)₂ (lime water) → calcium citrate + H₂O' },
    result: { obs: X('Litmus turned red with lemon juice, then blue after enough lime water was added, and red again with one more drop of lemon juice.'),
      concl: X('A base neutralises an acid; the indicator shows when this happens.'), safety: X('Do not taste anything. Add the lime water one drop at a time.'),
      viva: [{ q: X('What is neutralisation?'), a: X('The reaction of an acid with a base to give a salt and water.') }, { q: X('Why is a drop of base added at a time?'), a: X('To see exactly when the colour changes.') }, { q: X('Why do we take an antacid for acidity?'), a: X('It is a mild base that neutralises extra acid in the stomach.') }] },
  },
  {
    id: 'sulphur_burn', cls: 7, also: [10], ch: X(C7M), title: X('Burning sulphur (teacher demonstration)'),
    aim: X('To burn sulphur in air and test the nature of its oxide.'),
    kind: X('Non-metal + oxygen → acidic oxide'),
    setup(K) {
      const A3 = K.A3;
      const bn = K.burner(0.3, -0.62); const jar = K.place(A3.gasJar(), -0.16, -0.66);
      const sp = K.place(A3.deflagratingSpoon(), 0.04, -0.47); sp.g.rotation.set(0, 0, Math.PI / 2); sp.g.position.y = BENCH_Y + 0.004; sp.home = { p: sp.g.position.clone(), q: sp.g.quaternion.clone() };
      const w = K.beaker(-0.42, -0.74, 'water', 40, 100); w.name = X('Water');
      const bl = K.strip('blue', -0.42, -0.46), rd = K.strip('red', -0.36, -0.46);
      return { bn, jar, sp, w, bl, rd };
    },
    steps: [
      { do: X('Light the burner.'), target: 'bn', act: (K, o) => K.light(o.bn), ev: { type: 'lit' }, see: X('A blue flame burns.') },
      { do: X('Hold the deflagrating spoon with a little powdered sulphur in the flame.'), target: 'sp', act: (K, o) => K.holdIn(o.sp, o.bn, null, 4, { q: new K.THREE.Quaternion(), stay: true }), ev: { type: 's_burn' },
        see: X('The yellow sulphur melts into an orange-brown liquid and then catches fire with a small, pale blue flame.') },
      { do: X('As soon as it burns, lower the spoon into the gas jar.'), target: 'jar', act: async (K, o) => { await K.intoJar(o.sp, o.jar); await K.sleep(6); }, ev: { type: 'into_jar' },
        see: X('The blue flame keeps burning inside the jar, which fills with a colourless gas with a sharp, choking smell.'), why: X('Sulphur combines with oxygen to form sulphur dioxide gas.') },
      { do: X('After some time, take out the spoon and cover the jar with its lid.'), target: 'sp', act: (K, o) => K.outOfJar(o.sp, o.jar), see: X('The gas stays trapped in the jar.') },
      { do: X('Lift the lid, pour in a little water, cover again and shake well.'), target: 'w', act: async (K, o) => { await K.lid(o.jar, false); await K.pour(o.w, o.jar, 15); await K.lid(o.jar, true); await K.shake(o.jar, 1.6); },
        see: X('The gas dissolves in the water.'), why: X('Sulphur dioxide dissolves in water to form sulphurous acid.') },
      { do: X('Dip blue litmus paper into the solution.'), target: 'bl', act: async (K, o) => { await K.lid(o.jar, false); await K.dip(o.bl, o.jar); }, ev: { type: 'dip', in: 'jar' }, see: X('It turns red.'), why: X('The solution is acidic.') },
      { do: X('Dip red litmus paper into it.'), target: 'rd', act: (K, o) => K.dip(o.rd, o.jar), ev: { type: 'dip', in: 'jar' }, see: X('No change; it stays red.') },
    ],
    eq: { word: 'Sulphur + oxygen → sulphur dioxide · sulphur dioxide + water → sulphurous acid', sym: 'S(s) + O₂(g) → SO₂(g)  ·  SO₂(g) + H₂O(l) → H₂SO₃(aq)' },
    result: { obs: X('Sulphur burnt with a pale blue flame; the gas dissolved in water and turned blue litmus red.'), concl: X('Non-metals like sulphur form acidic oxides.'),
      safety: X('Teacher demonstration only, in a fume cupboard: sulphur dioxide is poisonous. Do not breathe it.'),
      viva: [{ q: X('What is formed when sulphur burns?'), a: X('Sulphur dioxide gas.') }, { q: X('Is the solution acidic or basic?'), a: X('Acidic: it turns blue litmus red.') }, { q: X('Metal oxides are usually basic. What about non-metal oxides?'), a: X('They are usually acidic.') }] },
  },
  {
    id: 'candle_o2', cls: 7, ch: X(C7C), title: X('A candle needs air to burn'),
    aim: X('To show that air (oxygen) is needed for burning, and that a burning candle gives carbon dioxide and water.'),
    kind: X('Combustion needs oxygen'),
    setup(K) {
      const A3 = K.A3;
      const ca = K.place(A3.candle({ name: { en: 'Candle A', hi: 'मोमबत्ती A', hg: 'Candle A' } }), -0.14, -0.62); const cb = K.place(A3.candle({ name: { en: 'Candle B', hi: 'मोमबत्ती B', hg: 'Candle B' } }), 0.14, -0.62);
      const tum = K.place(A3.tumbler(), -0.38, -0.52); const lw = K.bottle('limewater', 0.38, -0.74);
      return { ca, cb, tum, lw };
    },
    steps: [
      { do: X('Light both candles.'), target: 'ca', act: async (K, o) => { await K.light(o.ca); await K.light(o.cb); }, ev: { type: 'lit' }, see: X('Both candles burn with a steady flame.') },
      { do: X('Cover candle A with an upside-down glass tumbler.'), target: 'tum', act: (K, o) => K.cover(o.tum, o.ca), ev: { type: 'cover' }, see: X('Candle A is now inside the tumbler with only the air in it.') },
      { do: X('Watch both flames.'), target: 'ca', act: (K, o) => until(K, () => o.ca.out, 30).then(() => K.sleep(1)),
        see: X('The covered flame grows smaller, flickers and goes out within a few seconds; mist forms inside the tumbler. Candle B keeps burning.'),
        why: X('Burning uses up the oxygen in the air. When the oxygen inside the tumbler is used up, the flame goes out.') },
      { do: X('Lift the tumbler, quickly turn it upright, pour in a little lime water and swirl it.'), target: 'lw', act: async (K, o) => { await K.uncover(o.tum, o.ca, -0.38, -0.52); await K.pour(o.lw, o.tum, 12); await K.swirl(o.tum, 2); },
        see: X('The lime water turns milky.'), why: X('The candle made carbon dioxide gas, which turns lime water milky. The mist was water: wax burns to carbon dioxide and water.') },
    ],
    eq: { word: 'Wax + oxygen → carbon dioxide + water (+ heat and light)', sym: 'C₂₅H₅₂ + 38O₂ → 25CO₂ + 26H₂O' },
    result: { obs: X('The covered candle went out; the other kept burning. Lime water in the tumbler turned milky.'), concl: X('Burning needs oxygen; a candle burns to give carbon dioxide and water.'),
      safety: X('Keep hair, paper and sleeves away from the flames.'),
      viva: [{ q: X('Why did the covered candle go out?'), a: X('The oxygen inside the tumbler was used up.') }, { q: X('Which gas turned the lime water milky?'), a: X('Carbon dioxide.') }, { q: X('Why do we cover a small fire with a blanket?'), a: X('To cut off its supply of air (oxygen).') }] },
  },
  {
    id: 'ignition', cls: 7, ch: X(C7C), title: X('Paper cup with water does not burn'),
    aim: X('To show that a substance burns only when it reaches its ignition temperature.'),
    kind: X('Ignition temperature'),
    setup(K) {
      const A3 = K.A3; const cd = K.place(A3.candle(), 0.16, -0.62);
      const e = K.place(A3.paperCup({ name: { en: 'Empty paper cup', hi: 'खाली कागज़ का कप', hg: 'Khaali paper cup' } }), -0.28, -0.6);
      const w = K.place(A3.paperCup({ name: { en: 'Paper cup with water', hi: 'पानी वाला कागज़ का कप', hg: 'Paani wala paper cup' } }), -0.06, -0.6); K.lab.fill(w, 'water', 40);
      return { cd, e, w };
    },
    steps: [
      { do: X('Light the candle.'), target: 'cd', act: (K, o) => K.light(o.cd), ev: { type: 'lit' }, see: X('The candle burns steadily.') },
      { do: X('Hold the empty paper cup over the flame.'), target: 'e', act: async (K, o) => { await K.holdOver(o.e, o.cd, 5); if (o.e.burnt) { await K.moveTo(o.e, new K.THREE.Vector3(-0.28, BENCH_Y + 0.0008, -0.6), new K.THREE.Quaternion(), 0.8); } },
        see: X('The bottom turns brown, then black, and the cup catches fire.'), why: X('Paper heats up quickly and soon reaches its ignition temperature.') },
      { do: X('Now hold the paper cup with water over the flame (time-lapse).'), target: 'w', act: (K, o) => K.holdOver(o.w, o.cd, 9, { lapse: 6 }),
        see: X('The cup does not burn. The water gets hot and even starts to boil.'), why: X('The water takes the heat away from the paper, so the paper never reaches its ignition temperature.') },
    ],
    eq: { word: 'Paper + oxygen → carbon dioxide + water (only above the ignition temperature)', sym: '(C₆H₁₀O₅)ₙ + 6nO₂ → 6nCO₂ + 5nH₂O' },
    result: { obs: X('The empty cup caught fire; the cup with water did not burn, though the water became hot.'), concl: X('A substance catches fire only when it is heated to its ignition temperature.'),
      safety: X('Hold the cup with tongs and keep a tray of sand nearby.'),
      viva: [{ q: X('What is ignition temperature?'), a: X('The lowest temperature at which a substance catches fire.') }, { q: X('Why did the cup with water not burn?'), a: X('The water absorbed the heat and kept the paper below its ignition temperature.') }, { q: X('Why is water used to put out fires?'), a: X('It cools the burning material below its ignition temperature.') }] },
  },
  {
    id: 'phys_change', cls: 7, ch: X('Physical and Chemical Changes (older NCERT, Class 7)'), title: X('Physical changes: ice and a hot blade'),
    aim: X('To observe physical changes, in which no new substance is formed and the change can usually be reversed.'),
    kind: X('Physical change'),
    setup(K) {
      const A3 = K.A3; const rk = K.rack(-0.3, -0.64); const t = K.tube(rk, 3, 'water', 8); t.name = X('Test tube of ice'); t.mix.temp = -6; t.frozenK = 1; t.bath = { mix: { temp: 27 } };
      const b = K.beaker(0.02, -0.66, 'water', 60, 250); b.name = X('Freezing mixture (ice and salt)'); K.lab.fill(b, 'nacl', 20); K.ice(b, 6); b.saltIce = true; b.mix.temp = -9;
      const bn = K.burner(0.32, -0.6); const bl = K.place(A3.glowStrip('blade'), 0.12, -0.46); bl.g.rotation.set(0, 0, Math.PI / 2); bl.g.position.y = BENCH_Y + 0.004; bl.home = { p: bl.g.position.clone(), q: bl.g.quaternion.clone() };
      return { rk, t, b, bn, bl };
    },
    steps: [
      { do: X('Leave the test tube of ice on the bench and watch (time-lapse).'), target: 't', act: (K) => K.wait(10, 60), see: X('The ice melts into water.'), why: X('Heat from the room melts the ice. It is still the same substance: water.') },
      { do: X('Now stand the tube in the freezing mixture of ice and salt and watch (time-lapse).'), target: 'b', act: async (K, o) => { await K.intoBath(o.t, o.b); await K.wait(12, 60); }, ev: { type: 'bath' },
        see: X('The water in the tube freezes into ice again.'), why: X('Ice with salt is far colder than ice alone. Melting and freezing are physical changes that can be reversed.') },
      { do: X('Light the burner.'), target: 'bn', act: (K, o) => K.light(o.bn), ev: { type: 'lit' }, see: X('A blue flame burns.') },
      { do: X('Hold the tip of the hacksaw blade in the flame with tongs.'), target: 'bl', act: (K, o) => K.holdIn(o.bl, o.bn, null, 5, { tilt: 1.5 }), ev: { type: 'glow_hot' },
        see: X('The tip of the blade glows red, then orange.') },
      { do: X('Take it out and let it cool.'), target: 'bl', act: (K) => K.wait(9, 1), see: X('The glow fades and the blade becomes grey again, just as before.'), why: X('Only its temperature changed; no new substance was formed. This is a physical change.') },
    ],
    eq: { word: 'Ice ⇌ water (melting and freezing) · cold blade ⇌ hot glowing blade: no new substance', sym: 'H₂O(s) ⇌ H₂O(l)' },
    result: { obs: X('Ice melted and froze again; the blade glowed in the flame and became grey again on cooling.'), concl: X('In a physical change no new substance is formed; such changes can often be reversed.'),
      safety: X('Hold the blade with tongs; it stays hot long after the glow has gone.'),
      viva: [{ q: X('Is melting of ice a physical or a chemical change?'), a: X('A physical change.') }, { q: X('Why is salt added to the ice?'), a: X('Ice with salt becomes much colder than 0 °C, so it can freeze water.') }, { q: X('Did the blade change into a new substance?'), a: X('No, it became the same grey blade after cooling.') }] },
  },
  {
    id: 'metal_nonmetal', cls: 7, also: [10], ch: X(C7M), title: X('Metals and non-metals: shine, hammer, sound, heat'),
    aim: X('To compare metals and non-metals for lustre, malleability, sonority and conduction of heat.'),
    kind: X('Physical properties of metals and non-metals'),
    setup(K) {
      const A3 = K.A3;
      const o = {}; [['cu', -0.42], ['al', -0.32], ['fe', -0.22], ['coal', -0.12], ['s', -0.02]].forEach(([k, x]) => { o[k] = K.place(A3.sample(k), x, -0.48); });
      o.fe.g.rotation.set(-Math.PI / 2, 0, 0.3); o.fe.g.position.y = BENCH_Y + 0.003; o.fe.home = { p: o.fe.g.position.clone(), q: o.fe.g.quaternion.clone() };
      o.sp = K.place(A3.sandpaper(), -0.27, -0.36);
      o.blk = K.place(A3.ironBlock(), 0.16, -0.62); o.hm = K.place(A3.hammer(), 0.36, -0.52); o.hm.g.rotation.set(0, 0.3, Math.PI / 2); o.hm.g.position.y = BENCH_Y + 0.011; o.hm.home = { p: o.hm.g.position.clone(), q: o.hm.g.quaternion.clone() };
      o.hot = K.beaker(-0.2, -0.72, 'water', 150, 250); o.hot.mix.temp = 82; o.hot.name = X('Hot water');
      o.ss = K.place(A3.waxSpoon(true), 0.04, -0.75); o.ws = K.place(A3.waxSpoon(false), 0.1, -0.75);
      for (const s of [o.ss, o.ws]) { s.g.rotation.set(Math.PI / 2, 0, 0); s.g.position.y = BENCH_Y + 0.006; s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; }
      return o;
    },
    steps: [
      { do: X('Rub copper, aluminium and coal with sandpaper and look at their surfaces.'), target: 'sp', act: async (K, o) => { for (const k of ['cu', 'al', 'coal']) await K.rub(o[k], o.sp); }, ev: { type: 'rub' },
        see: X('Copper shines reddish-brown and aluminium shines silvery; coal stays dull black.'), why: X('Metals have lustre: a fresh metal surface shines.') },
      { do: X('Beat the aluminium foil on the iron block with a hammer.'), target: 'al', act: (K, o) => K.hammerHit(o.hm, o.al, o.blk), ev: { type: 'hammer' },
        see: X('It spreads into a thinner, flatter sheet; it does not break.'), why: X('Metals are malleable: they can be beaten into thin sheets.') },
      { do: X('Now beat the piece of coal with the hammer.'), target: 'coal', act: (K, o) => K.hammerHit(o.hm, o.coal, o.blk), ev: { type: 'hammer' },
        see: X('The coal breaks into small pieces and powder.'), why: X('Non-metals like coal and sulphur are brittle.') },
      { do: X('Drop the iron nail and then the sulphur lump on the bench and listen.'), target: 'fe', act: async (K, o) => { await K.dropSound(o.fe); await K.sleep(0.8); await K.dropSound(o.s); }, ev: { type: 'drop_sound' },
        see: X('The iron nail makes a ringing sound; sulphur makes only a dull thud.'), why: X('Metals are sonorous: they ring when struck.') },
      { do: X('Stand the steel spoon and the wooden spoon in hot water. Each has a small bead of wax on its handle. Wait a few minutes (time-lapse).'), target: 'hot', act: async (K, o) => { await K.spoonsInto([o.ss, o.ws], o.hot); await K.wait(10, 30); },
        see: X('The wax on the steel spoon melts and slides down; the wax on the wooden spoon stays solid.'), why: X('Metals are good conductors of heat; wood is a poor conductor.') },
    ],
    eq: { word: 'Metals: shiny, malleable, sonorous, good conductors · non-metals: dull, brittle, not sonorous, poor conductors', sym: 'Cu, Al, Fe: metals  ·  C (coal), S: non-metals' },
    result: { obs: X('Copper and aluminium shone, aluminium flattened, coal broke, the nail rang, and wax melted on the steel spoon only.'),
      concl: X('Metals are lustrous, malleable, sonorous and good conductors of heat; non-metals are not.'), safety: X('Use the hammer carefully and keep your fingers away. Do not touch the hot water.'),
      viva: [{ q: X('What is malleability?'), a: X('The property of being beaten into thin sheets.') }, { q: X('Why are cooking pans made of metal?'), a: X('Metals conduct heat well.') }, { q: X('Name a non-metal that conducts electricity.'), a: X('Graphite (a form of carbon).') }] },
  },
  // ===================================================== Class 8
  {
    id: 'saturated', cls: 8, also: [9], ch: X('Ch 9 · The Amazing World of Solutes, Solvents, and Solutions'), title: X('Saturated solutions and temperature'),
    aim: X('To make a saturated solution and show that more solid dissolves in hot water.'),
    kind: X('Saturated solution and solubility'),
    setup(K) {
      const a = K.beaker(-0.26, -0.64, 'water', 50, 100); a.name = X('Beaker A (salt)');
      const b = K.beaker(0.06, -0.64, 'water', 50, 100); b.name = X('Beaker B (baking soda)');
      const salt = K.solid('salt', -0.44, -0.48); salt.amount = 1; const bs = K.solid('nahco3', -0.08, -0.46);
      const rod = K.rod(-0.26, -0.42); const tp = K.tripod(0.3, -0.64); const bn = K.burner(0.45, -0.56);
      const th = K.add(K.A.thermometer(), 0.07, -0.64); th.g.position.set(0.075, BENCH_Y + 0.006, -0.64); th.g.rotation.set(0, 0, -0.14); th.update = () => { th.setTemp(b.mix.temp); th.g.position.set(b.g.position.x + 0.013, b.g.position.y + 0.005, b.g.position.z); };
      return { a, b, salt, bs, rod, tp, bn, th };
    },
    steps: [
      { do: X('Add one spoonful of salt to the water in beaker A and stir until it dissolves.'), target: 'salt', act: async (K, o) => { await K.spoonful(o.salt, o.a); await K.stir(o.rod, o.a, 4); }, ev: { type: 'stir', v: 'a' },
        see: X('The salt dissolves completely.') },
      { do: X('Keep adding salt one spoonful at a time, stirring each time, until some stays at the bottom.'), target: 'salt', act: async (K, o) => { for (let i = 0; i < 6 && !o.a.saturated; i++) { await K.spoonful(o.salt, o.a); await K.stir(o.rod, o.a, 4); } },
        see: X('Three spoonfuls dissolve; from the fourth some salt stays at the bottom however much you stir.'), why: X('The solution is now saturated: at this temperature the water cannot dissolve any more salt.') },
      { do: X('In beaker B add baking soda a little at a time, stirring, until some stays undissolved.'), target: 'bs', act: async (K, o) => { for (let i = 0; i < 6 && !o.b.saturated; i++) { await K.spoonful(o.bs, o.b); await K.stir(o.rod, o.b, 4); } },
        see: X('After about three small spoonfuls some baking soda stays at the bottom.'), why: X('Baking soda is much less soluble than salt.') },
      { do: X('Put beaker B on the tripod, light the burner and warm it to about 50 °C while stirring.'), target: 'b', act: async (K, o) => { await K.onTripod(o.b, o.tp, o.bn); await K.light(o.bn); const l0 = K.app.chem.lapse; K.app.chem.lapse = 4; K.app.lapseShown = 4; await until(K, () => o.b.mix.temp >= 50, 60); K.app.chem.lapse = l0; K.app.lapseShown = 0; await K.stir(o.rod, o.b, 4); },
        see: X('The undissolved baking soda dissolves.'), why: X('Hot water can dissolve more solid than cold water.') },
      { do: X('Add more baking soda until again some stays undissolved.'), target: 'bs', act: async (K, o) => { for (let i = 0; i < 4 && !o.b.saturated; i++) { await K.spoonful(o.bs, o.b); await K.stir(o.rod, o.b, 4); } await K.extinguish(o.bn); },
        see: X('More baking soda dissolves before the solution is saturated again.'), why: X('Solubility of most solids increases with temperature.') },
    ],
    eq: { word: 'A saturated solution holds the most solute it can at that temperature; hot water dissolves more', sym: 'NaCl ≈ 36 g per 100 g water (25 °C)  ·  NaHCO₃ ≈ 10 g (20 °C) → 14.5 g (50 °C)' },
    result: { obs: X('About three and a half spoonfuls of salt saturated 50 mL of water; warming made more baking soda dissolve.'), concl: X('A solution can hold only a limited amount of solute; the limit (solubility) usually rises with temperature.'),
      safety: X('Do not heat baking soda strongly; stir gently and keep the burner low.'),
      viva: [{ q: X('What is a saturated solution?'), a: X('A solution in which no more solute can dissolve at that temperature.') }, { q: X('How can a saturated solution dissolve more solute?'), a: X('By heating it.') }, { q: X('What happens when a hot saturated solution cools?'), a: X('Some of the solid comes out as crystals.') }] },
  },
  {
    id: 'candle_zones', cls: 8, ch: X('Combustion and Flame (older NCERT, Class 8)'), title: X('Zones of a candle flame'),
    aim: X('To study the different zones of a candle flame.'),
    kind: X('Structure of a flame'),
    setup(K) {
      const A3 = K.A3; const cd = K.place(A3.candle(), 0.0, -0.62);
      const sl = K.place(A3.glassSlide(), -0.26, -0.48); const tb = K.place(A3.thinTube(), -0.14, -0.46); const cw = K.place(A3.glowStrip('cuwire'), 0.2, -0.46);
      cw.g.rotation.set(0, 0, Math.PI / 2); cw.g.position.y = BENCH_Y + 0.002; cw.home = { p: cw.g.position.clone(), q: cw.g.quaternion.clone() };
      return { cd, sl, tb, cw };
    },
    steps: [
      { do: X('Light the candle and let the flame become steady.'), target: 'cd', act: (K, o) => K.light(o.cd), ev: { type: 'lit' }, see: X('A steady flame burns.') },
      { do: X('Look closely at the flame and its zones.'), target: 'cd', act: async (K, o) => { const T = K.THREE; const L = (z) => o.cd.g.localToWorld(o.cd.zoneLocal(z)); const tl = (en) => { const x = X(en); return x[K.app.lang] || x.en; };
          K.tag3D(tl('Outer zone: blue, hottest'), L('outer').add(new T.Vector3(0.006, 0, 0)), new T.Vector3(0.085, 0.02, 0)); K.tag3D(tl('Middle zone: yellow, bright'), L('lum').add(new T.Vector3(0.005, 0, 0)), new T.Vector3(0.09, -0.008, 0)); K.tag3D(tl('Inner zone: dark, unburnt wax vapour'), L('dark').add(new T.Vector3(-0.002, 0, 0)), new T.Vector3(-0.095, 0.004, 0)); await K.sleep(1.5); },
        see: X('Round the wick is a dark zone; around it a bright yellow zone; outside a faint blue zone, and a blue cup at the bottom.'), why: X('The dark zone has unburnt wax vapour; the yellow zone burns only partly; the outer zone burns completely and is the hottest.') },
      { do: X('Hold a glass slide in the yellow zone for about ten seconds.'), target: 'sl', act: (K, o) => K.holdIn(o.sl, o.cd, o.cd.zoneLocal('lum'), 7, { tilt: 0, q: new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(0, Math.PI / 2, 0)) }), ev: { type: 'soot' },
        see: X('A black ring of soot collects on the slide.'), why: X('The yellow zone has unburnt carbon particles: they glow and give light, and stick to the cold glass as soot.') },
      { do: X('Hold one end of a thin glass tube in the dark zone and bring a lighted match to the other end.'), target: 'tb', act: async (K, o) => { await K.holdIn(o.tb, o.cd, o.cd.zoneLocal('dark'), 1.5, { q: new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(0, 0, 0.35)), stay: true }); o.tb.endFlame.visible = true; K.lab.emit('vapour_burn', { obj: o.tb.id }); await K.sleep(2.5); o.tb.endFlame.visible = false; await K.home(o.tb, 0.8); }, ev: { type: 'vapour_burn' },
        see: X('A small flame appears at the other end of the tube.'), why: X('Unburnt wax vapour from the dark zone travels through the tube and burns at its end.') },
      { do: X('Hold a thin copper wire across the outer zone for a few seconds.'), target: 'cw', act: (K, o) => K.holdIn(o.cw, o.cd, o.cd.zoneLocal('outer'), 4, { tilt: Math.PI / 2 }), ev: { type: 'glow_hot' },
        see: X('The wire glows red hot where it crosses the outer zone.'), why: X('The outer, non-luminous zone is the hottest part of the flame.') },
    ],
    eq: { word: 'Outer zone: complete burning (hottest) · yellow zone: partial burning, unburnt carbon (soot) · dark zone: wax vapour', sym: 'C₂₅H₅₂ + 38O₂ → 25CO₂ + 26H₂O' },
    result: { obs: X('Soot collected in the yellow zone, wax vapour from the dark zone burnt at the end of the tube, and the copper wire glowed in the outer zone.'),
      concl: X('A candle flame has three zones: dark (unburnt vapour), luminous (partial burning) and non-luminous (complete burning, hottest).'),
      safety: X('Use tongs; the slide, tube and wire get very hot.'),
      viva: [{ q: X('Which zone of the flame is the hottest?'), a: X('The outer, non-luminous (blue) zone.') }, { q: X('Why does the yellow zone give light?'), a: X('Unburnt carbon particles in it glow.') }, { q: X('Why do goldsmiths blow on the outer zone of a flame?'), a: X('It is the hottest zone, good for melting gold.') }] },
  },
  {
    id: 'limewater_air', cls: 8, ch: X('Ch 8 · Nature of Matter: Elements, Compounds, and Mixtures'), title: X('Making lime water from quick lime'),
    aim: X('To prepare lime water from quick lime and show that air contains carbon dioxide.'),
    kind: X('Compound formation and a test for carbon dioxide'),
    setup(K) {
      const a = K.beaker(-0.3, -0.64, 'water', 100, 250); a.name = X('Tumbler of water');
      const cao = K.solid('cao', -0.46, -0.48, { amount: 0.6 }); const rod = K.rod(-0.18, -0.44);
      const fl = K.flask(0.04, -0.62); const f = K.filterOver(fl); const pd = K.place(K.A3.petriDish(), 0.32, -0.62);
      return { a, cao, rod, fl, f, pd };
    },
    steps: [
      { do: X('Add a little quick lime to the water, slowly.'), target: 'cao', act: (K, o) => K.addSolid(o.cao, o.a), ev: { type: 'add' },
        see: X('It hisses and the lumps begin to break up.') },
      { do: X('Stir it and feel the outside of the tumbler.'), target: 'a', act: (K, o) => K.stir(o.rod, o.a, 4), ev: { type: 'stir', v: 'a' },
        see: X('The tumbler becomes hot and a milky white suspension forms.'), why: X('Quick lime reacts with water to form slaked lime (calcium hydroxide), giving out heat.') },
      { do: X('Filter the mixture into the flask.'), target: 'f', act: async (K, o) => { await K.pourSlow(o.a, o.f, 50); const l0 = K.app.chem.lapse; K.app.chem.lapse = 10; K.app.lapseShown = 10; await until(K, () => o.f.ml < 0.1, 40); K.app.chem.lapse = l0; K.app.lapseShown = 0; }, ev: { type: 'pour', from: 'a', to: 'f', ml: 25 },
        see: X('A clear, colourless liquid collects in the flask. This is lime water.'), why: X('Undissolved slaked lime stays on the paper; the dissolved part passes through.') },
      { do: X('Pour the lime water into an open petri dish and leave it in the air (time-lapse: a few hours).'), target: 'pd', act: async (K, o) => { await K.pour(o.fl, o.pd, 20); o.pd.airOpen = true; await K.wait(10, 100); },
        see: X('A thin white skin forms on the surface and the lime water turns milky.'), why: X('Carbon dioxide from the air reacts with lime water to form insoluble calcium carbonate.') },
    ],
    eq: { word: 'Quick lime + water → slaked lime (+ heat) · slaked lime + carbon dioxide → calcium carbonate + water', sym: 'CaO + H₂O → Ca(OH)₂  ·  Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O' },
    result: { obs: X('Quick lime hissed and became hot in water; the filtrate was clear lime water, which turned milky in open air.'), concl: X('Quick lime forms a new compound with water; air contains carbon dioxide, which turns lime water milky.'),
      safety: X('Quick lime burns skin and eyes. Add it in small amounts and do not touch it.'),
      viva: [{ q: X('What is lime water?'), a: X('A clear solution of calcium hydroxide in water.') }, { q: X('Why did the lime water turn milky in air?'), a: X('Carbon dioxide in the air formed white calcium carbonate.') }, { q: X('Is the reaction of quick lime with water exothermic?'), a: X('Yes, it gives out a lot of heat.') }] },
  },
];
