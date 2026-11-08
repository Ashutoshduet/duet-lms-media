// Chemistry experiments, batch 2: Classes 6–9 (new NCERT Curiosity / Exploration books) and more Class 10.
// Same shape as experiments.js: setup → steps (do → see → why) → equation → result and viva.
import { DICT } from './exp_i18n.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });

export const EXPERIMENTS2 = [
  // ===================================================== Class 6
  {
    id: 'solubility', cls: 6, ch: X('Ch 6 · Materials Around Us'), title: X('Which materials dissolve in water?'),
    aim: X('To find out which common materials dissolve in water and which do not.'),
    kind: X('Soluble and insoluble substances'),
    setup(K) {
      const b = [-0.42, -0.16, 0.1, 0.36].map((x, i) => { const v = K.beaker(x, -0.68, 'water', 70); v.tag = String(i + 1); return v; });
      const s = [['sugar', -0.42], ['salt', -0.16], ['chalk', 0.1], ['sand', 0.36]].map(([c, x]) => K.solid(c, x, -0.5));
      const rod = K.rod(0.0, -0.42);
      return { b1: b[0], b2: b[1], b3: b[2], b4: b[3], sugar: s[0], salt: s[1], chalk: s[2], sand: s[3], rod };
    },
    steps: [
      { do: X('Add a spoonful of sugar to the first beaker of water and stir well.'), target: 'sugar', act: async (K, o) => { await K.addSolid(o.sugar, o.b1); await K.stir(o.rod, o.b1, 4); }, ev: { type: 'stir', v: 'b1' },
        see: X('The sugar crystals become smaller and smaller and disappear. The water stays clear.'), why: X('Sugar is soluble in water. Its particles spread out between the water particles, so we cannot see them any more.') },
      { do: X('Add a spoonful of salt to the second beaker and stir.'), target: 'salt', act: async (K, o) => { await K.addSolid(o.salt, o.b2); await K.stir(o.rod, o.b2, 4); }, ev: { type: 'stir', v: 'b2' },
        see: X('The salt also disappears and the solution is clear.'), why: X('Salt is soluble in water too.') },
      { do: X('Add chalk powder to the third beaker and stir.'), target: 'chalk', act: async (K, o) => { await K.addSolid(o.chalk, o.b3); await K.stir(o.rod, o.b3, 3); }, ev: { type: 'stir', v: 'b3' },
        see: X('The water turns milky white, but the chalk does not disappear.'), why: X('Chalk is insoluble. Its tiny pieces only float around in the water for a while.') },
      { do: X('Add sand to the fourth beaker and stir.'), target: 'sand', act: async (K, o) => { await K.addSolid(o.sand, o.b4); await K.stir(o.rod, o.b4, 3); }, ev: { type: 'stir', v: 'b4' },
        see: X('The sand settles at the bottom within a few seconds. The water above stays almost clear.'), why: X('Sand is insoluble and heavy, so it sinks quickly.') },
      { do: X('Leave all four beakers still for some time and look again.'), target: 'b3', act: (K) => K.wait(8, 12),
        see: X('Sugar and salt solutions stay clear. The chalk slowly settles as a white layer at the bottom; the sand stays at the bottom.'),
        why: X('Soluble substances stay mixed in the water for ever; insoluble ones settle down. Dissolving is a physical change — we can get sugar or salt back by evaporating the water.') },
    ],
    eq: { word: 'Sugar and salt: soluble · Chalk and sand: insoluble', sym: 'C₁₂H₂₂O₁₁(s) → C₁₂H₂₂O₁₁(aq)   ·   NaCl(s) → NaCl(aq)' },
    result: { obs: X('Sugar and salt disappeared to give clear solutions. Chalk made the water milky and then settled. Sand sank at once.'),
      concl: X('Sugar and salt are soluble in water; chalk powder and sand are insoluble.'),
      safety: X('Never taste anything in a laboratory, even sugar or salt.'),
      viva: [{ q: X('Name two substances that dissolve in water.'), a: X('Sugar and common salt.') }, { q: X('Does sand dissolve in water?'), a: X('No, sand is insoluble; it settles at the bottom.') }, { q: X('Is dissolving sugar a physical or chemical change?'), a: X('A physical change — no new substance is formed.') }] },
  },
  {
    id: 'evaporate_salt', cls: 6, ch: X('Ch 9 · Methods of Separation in Everyday Life'), title: X('Getting salt back from salt water'),
    aim: X('To separate salt from salt water by evaporation.'),
    kind: X('Separation by evaporation'),
    setup(K) {
      const tp = K.tripod(0.12, -0.66); const bn = K.burner(0.34, -0.62);
      const dish = K.add(K.A.chinaDish(), -0.18, -0.62); K.lab.fill(dish, 'water', 22); K.lab.fill(dish, 'nacl', 4); dish.evapK = 0.6;
      return { tp, bn, dish };
    },
    steps: [
      { do: X('Pour some salt water into a china dish and place it on the wire gauze of the tripod stand.'), target: 'dish', act: (K, o) => K.onTripod(o.dish, o.tp, o.bn),
        see: X('The clear salt water sits in the dish over the burner.'), why: X('The salt is dissolved, so we cannot see it.') },
      { do: X('Light the burner and heat the dish.'), target: 'bn', act: (K, o) => K.light(o.bn), ev: { type: 'lit' }, see: X('A blue flame burns under the gauze.') },
      { do: X('Keep heating until the water boils away (watch in time-lapse).'), target: 'dish', act: (K, o) => { o.dish.onDry = () => { const c = K.add(K.A.crystals(0xffffff, { n: 40 }), 0, 0); K.lab.putSolid(c, o.dish); c.g.scale.set(2.2, 0.35, 2.2); c.name = X('Salt crust'); }; return K.wait(14, 30); },
        see: X('The water boils and steam rises; the liquid becomes less and less. Near the end the salt crackles, and a white crust is left in the dish.'),
        why: X('On heating, water turns into vapour and goes into the air, but salt does not evaporate — it stays behind.') },
      { do: X('Turn off the burner and look at the dish.'), target: 'bn', act: (K, o) => K.extinguish(o.bn),
        see: X('Dry white salt is left in the china dish.'), why: X('This is how salt is made from sea water in salt pans, using the heat of the Sun.') },
    ],
    eq: { word: 'Salt water —(heat)→ water vapour ↑ + salt (left behind)', sym: 'NaCl(aq) —Δ→ NaCl(s) + H₂O(g)↑' },
    result: { obs: X('Water evaporated and white salt was left in the dish.'), concl: X('A dissolved solid can be separated from its solution by evaporation.'),
      safety: X('Do not touch the hot dish; let it cool. Stand back when the last of the water spits.'),
      viva: [{ q: X('Which method separates salt from salt water?'), a: X('Evaporation.') }, { q: X('Where does the water go?'), a: X('It turns into water vapour and mixes with the air.') }, { q: X('How is salt obtained from sea water?'), a: X('Sea water is left in shallow pans; the Sun evaporates the water and salt is left.') }] },
  },
  // ===================================================== Class 7
  {
    id: 'turmeric', cls: 7, ch: X('Ch 2 · Exploring Substances: Acidic, Basic, and Neutral'), title: X('Turmeric paper as an indicator'),
    aim: X('To test some household substances with turmeric paper.'),
    kind: X('Natural indicator'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = ['lemon', 'soap', 'bakingsoda', 'sugar'].map((s, i) => K.tube(rk, i + 1, s, 5));
      const p = t.map((_, i) => K.strip('turmeric', -0.16 + i * 0.05, -0.45));
      const o = { rk }; t.forEach((x, i) => { o['t' + i] = x; o['p' + i] = p[i]; }); return o;
    },
    steps: [
      { do: X('Dip a turmeric paper strip in lemon juice.'), target: 't0', act: (K, o) => K.dip(o.p0, o.t0), ev: { type: 'dip', in: 't0' }, see: X('No change — the paper stays yellow.'), why: X('Lemon juice is acidic. Turmeric does not change colour in acids.') },
      { do: X('Dip another strip in soap solution.'), target: 't1', act: (K, o) => K.dip(o.p1, o.t1), ev: { type: 'dip', in: 't1' }, see: X('The yellow paper turns red.'), why: X('Soap solution is basic. Turmeric turns red in bases.') },
      { do: X('Dip a strip in baking soda solution.'), target: 't2', act: (K, o) => K.dip(o.p2, o.t2), ev: { type: 'dip', in: 't2' }, see: X('The paper turns red.'), why: X('Baking soda solution is basic.') },
      { do: X('Dip a strip in sugar solution.'), target: 't3', act: (K, o) => K.dip(o.p3, o.t3), ev: { type: 'dip', in: 't3' }, see: X('No change — it stays yellow.'), why: X('Sugar solution is neutral.') },
    ],
    eq: { word: 'Turmeric: yellow → red in bases · no change in acids and neutral substances', sym: 'Soap, baking soda: basic  ·  Lemon juice: acidic  ·  Sugar: neutral' },
    result: { obs: X('Soap and baking soda solutions turned turmeric paper red; lemon juice and sugar solution did not.'), concl: X('Turmeric is a natural indicator that turns red in basic solutions.'),
      safety: X('Do not taste the solutions. Wash your hands after using soap solution.'),
      viva: [{ q: X('What colour does turmeric turn in a base?'), a: X('Red.') }, { q: X('Can turmeric show that lemon juice is acidic?'), a: X('No — it does not change colour in acids.') }, { q: X('Why does a turmeric stain on clothes turn red when washed with soap?'), a: X('Soap is basic, and turmeric turns red in bases.') }] },
  },
  {
    id: 'chinarose', cls: 7, ch: X('Ch 2 · Exploring Substances: Acidic, Basic, and Neutral'), title: X('China rose (gudhal) indicator'),
    aim: X('To use an indicator made from china rose petals to find acids and bases.'),
    kind: X('Natural indicator'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = ['lemon', 'hcl', 'bakingsoda', 'naoh'].map((s, i) => K.tube(rk, i + 1, s, 4));
      const cr = K.bottle('chinarose', -0.42, -0.78, { dropper: true });
      const o = { rk, cr }; t.forEach((x, i) => { o['t' + i] = x; }); return o;
    },
    steps: [
      { do: X('Add a few drops of china rose indicator to lemon juice.'), target: 't0', act: (K, o) => K.drops(o.cr, o.t0, 4), ev: { type: 'drops', to: 't0' }, see: X('It turns dark pink (magenta).'), why: X('China rose indicator turns acidic solutions dark pink.') },
      { do: X('Add a few drops to dilute hydrochloric acid.'), target: 't1', act: (K, o) => K.drops(o.cr, o.t1, 4), ev: { type: 'drops', to: 't1' }, see: X('Dark pink again.'), why: X('Hydrochloric acid is an acid.') },
      { do: X('Add a few drops to baking soda solution.'), target: 't2', act: (K, o) => K.drops(o.cr, o.t2, 4), ev: { type: 'drops', to: 't2' }, see: X('It turns green.'), why: X('China rose indicator turns basic solutions green.') },
      { do: X('Add a few drops to sodium hydroxide solution.'), target: 't3', act: (K, o) => K.drops(o.cr, o.t3, 4), ev: { type: 'drops', to: 't3' }, see: X('Green.'), why: X('Sodium hydroxide is a base.') },
    ],
    eq: { word: 'China rose: acids → dark pink (magenta) · bases → green', sym: 'Lemon juice, HCl: dark pink  ·  Baking soda, NaOH: green' },
    result: { obs: X('Lemon juice and hydrochloric acid turned dark pink; baking soda and sodium hydroxide solutions turned green.'), concl: X('China rose indicator shows acids (dark pink) and bases (green).'),
      safety: X('Handle the acid and the sodium hydroxide carefully; they can hurt skin and eyes.'),
      viva: [{ q: X('How is china rose indicator made?'), a: X('By soaking china rose petals in warm water and filtering it.') }, { q: X('Colour in an acid?'), a: X('Dark pink (magenta).') }, { q: X('Colour in a base?'), a: X('Green.') }] },
  },
  {
    id: 'vinegar_soda', cls: 7, ch: X('Ch 5 · Changes Around Us: Physical and Chemical'), title: X('Vinegar and baking soda'),
    aim: X('To study the reaction of vinegar with baking soda and identify the gas formed.'),
    kind: X('Chemical change (gas formed)'),
    setup(K) {
      const rk = K.rack(-0.32, -0.62); const t = K.tube(rk, 3, 'vinegar', 5, { boiling: true });
      const lw = K.add(K.A.testTube(), 0.06, -0.62); K.lab.fill(lw, 'limewater', 8); lw.name = X('Lime water'); lw.tag = 'Ca(OH)₂';
      const bs = K.solid('nahco3', -0.1, -0.5, { amount: 0.8 });
      return { rk, t, lw, bs };
    },
    steps: [
      { do: X('Take a teaspoon of vinegar in a test tube. Add a pinch of baking soda.'), target: 'bs', act: (K, o) => K.addSolid(o.bs, o.t), ev: { type: 'add', to: 't' },
        see: X('Brisk fizzing with a hissing sound — lots of gas bubbles.'), why: X('Vinegar (an acid) reacts with baking soda; a gas, carbon dioxide, is formed.') },
      { do: X('Quickly fit a cork with a delivery tube and pass the gas through lime water.'), target: 'lw', act: async (K, o) => { K.pipe(o.t, o.lw); await K.wait(6); }, ev: { type: 'pipe' },
        see: X('Bubbles go through the lime water and it turns milky.'), why: X('Carbon dioxide turns lime water milky. This test tells us the gas is carbon dioxide.') },
    ],
    eq: { word: 'Vinegar + Baking soda → Carbon dioxide + other substances', sym: 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑' },
    result: { obs: X('Brisk effervescence; the gas turned lime water milky.'), concl: X('Vinegar and baking soda react to form a new substance, carbon dioxide gas. This is a chemical change.'),
      safety: X('Use only a pinch of baking soda so the froth does not overflow.'),
      viva: [{ q: X('Which gas is formed?'), a: X('Carbon dioxide.') }, { q: X('How do you test for it?'), a: X('It turns lime water milky.') }, { q: X('Is this a physical or a chemical change?'), a: X('Chemical — a new substance is formed.') }] },
  },
  {
    id: 'breath_lime', cls: 7, ch: X('Ch 5 · Changes Around Us: Physical and Chemical'), title: X('Is there carbon dioxide in the air we breathe out?'),
    aim: X('To show that the air we breathe out contains carbon dioxide.'),
    kind: X('Chemical change (test for CO₂)'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64); const a = K.tube(rk, 1, 'water', 9), b = K.tube(rk, 4, 'limewater', 9);
      a.name = X('Test tube A — water'); b.name = X('Test tube B — lime water');
      const s1 = K.add(K.A.straw(), -0.28, -0.48); s1.g.rotation.set(Math.PI / 2, 0, 0.4); s1.g.position.y += 0.003; s1.home = { p: s1.g.position.clone(), q: s1.g.quaternion.clone() };
      const s2 = K.add(K.A.straw(), 0.22, -0.48); s2.g.rotation.set(Math.PI / 2, 0, -0.4); s2.g.position.y += 0.003; s2.home = { p: s2.g.position.clone(), q: s2.g.quaternion.clone() };
      return { rk, a, b, s1, s2 };
    },
    steps: [
      { do: X('Blow gently through a straw into test tube A (plain water).'), target: 's1', act: (K, o) => K.blow(o.s1, o.a, 5), ev: { type: 'blow', v: 'a' },
        see: X('Only bubbles — the water stays clear.'), why: X('Water does not react with the gases in our breath in a way we can see.') },
      { do: X('Now blow gently through a fresh straw into test tube B (lime water).'), target: 's2', act: (K, o) => K.blow(o.s2, o.b, 6), ev: { type: 'blow', v: 'b' },
        see: X('The lime water turns milky.'), why: X('Breathed-out air has carbon dioxide. It reacts with lime water to form calcium carbonate, which does not dissolve and makes it milky.') },
      { do: X('Leave tube B to stand for a while.'), target: 'b', act: (K) => K.wait(6, 20), see: X('A white solid slowly settles at the bottom.'), why: X('The white solid is calcium carbonate — a new substance, so this is a chemical change.') },
    ],
    eq: { word: 'Carbon dioxide + Lime water → Calcium carbonate + Water', sym: 'CO₂(g) + Ca(OH)₂(aq) → CaCO₃(s) + H₂O(l)' },
    result: { obs: X('Water stayed clear; lime water turned milky and a white solid settled.'), concl: X('The air we breathe out contains carbon dioxide.'),
      safety: X('Only blow out through the straw — never suck the liquid up.'),
      viva: [{ q: X('Which gas in breath turns lime water milky?'), a: X('Carbon dioxide.') }, { q: X('What is the white solid?'), a: X('Calcium carbonate.') }, { q: X('Why use a separate tube of plain water?'), a: X('For comparison, to show the milkiness is due to lime water reacting.') }] },
  },
  // ===================================================== Class 8
  {
    id: 'kmno4_diffuse', cls: 8, ch: X('Ch 7 · Particulate Nature of Matter'), title: X('Diffusion of potassium permanganate'),
    aim: X('To see particles of a solid spread through water on their own, and how warmth changes the speed.'),
    kind: X('Diffusion'),
    setup(K) {
      const c = K.beaker(-0.2, -0.64, 'water', 160, 250); c.name = X('Beaker A — cold water');
      const h = K.beaker(0.16, -0.64, 'water', 160, 250); h.name = X('Beaker B — hot water'); h.mix.temp = 80;
      const k1 = K.solid('kmno4', -0.2, -0.47), k2 = K.solid('kmno4', 0.16, -0.47);
      return { c, h, k1, k2 };
    },
    steps: [
      { do: X('Gently drop a small crystal of potassium permanganate into the cold water. Do not stir.'), target: 'k1', act: (K, o) => K.addSolid(o.k1, o.c), ev: { type: 'add', to: 'c' },
        see: X('Purple streaks stream down from the crystal and start to spread.'), why: X('Particles leave the crystal and move in between the water particles.') },
      { do: X('Drop another crystal into the hot water.'), target: 'k2', act: async (K, o) => { await K.addSolid(o.k2, o.h); await K.wait(4, 30); }, ev: { type: 'add', to: 'h' },
        see: X('The colour spreads out much faster here.'), why: X('In hot water, particles move faster, so they mix faster.') },
      { do: X('Leave both beakers still and watch (time-lapse).'), target: 'c', act: (K) => K.wait(10, 160),
        see: X('The hot water becomes evenly purple first; after some hours the cold water is also evenly purple.'),
        why: X('This spreading of particles on their own is called diffusion. It happens because particles are always moving.') },
    ],
    eq: { word: 'Particles of KMnO₄ + water → spread evenly (diffusion)', sym: 'KMnO₄(s) → K⁺(aq) + MnO₄⁻(aq) (purple)' },
    result: { obs: X('Purple colour spread through the water without stirring, much faster in hot water.'), concl: X('Particles of matter move all the time and mix on their own (diffusion). Diffusion is faster at higher temperature.'),
      safety: X('Potassium permanganate stains skin and clothes — use tongs or a spatula.'),
      viva: [{ q: X('What is diffusion?'), a: X('The spreading of particles of one substance between the particles of another on their own.') }, { q: X('Why is diffusion faster in hot water?'), a: X('Particles move faster at higher temperature.') }, { q: X('Why did we not stir?'), a: X('Stirring would mix it by force; we wanted to see the particles move on their own.') }] },
  },
  {
    id: 'sugar_heat', cls: 8, ch: X('Ch 8 · Nature of Matter: Elements, Compounds, and Mixtures'), title: X('Heating sugar'),
    aim: X('To find out what sugar is made of by heating it strongly.'),
    kind: X('Decomposition of a compound'),
    setup(K) {
      const rk = K.rack(-0.3, -0.62); const t = K.tube(rk, 3, null, 0, { boiling: true });
      const sg = K.solid('sugar', 0.0, -0.56); const lamp = K.lamp(0.28, -0.6); K.holder(0.1, -0.45);
      return { rk, t, sg, lamp };
    },
    steps: [
      { do: X('Put a spoonful of sugar in a dry boiling tube.'), target: 'sg', act: (K, o) => K.addSolid(o.sg, o.t), ev: { type: 'add', to: 't' }, see: X('White sugar crystals at the bottom.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' } },
      { do: X('Heat the tube, gently at first and then strongly.'), target: 't', act: (K, o) => K.heat(o.t, o.lamp, 20, { tilt: 0.5, lapse: 3 }), ev: { type: 'heating', v: 't', sec: 10 },
        see: X('The sugar melts, turns yellow, then brown (caramel) with a burnt smell, and finally becomes a black solid. Water droplets collect near the mouth of the tube.'),
        why: X('Heat breaks sugar down into carbon (the black solid) and water. So sugar is a compound of carbon, hydrogen and oxygen.') },
    ],
    eq: { word: 'Sugar —(strong heat)→ Carbon + Water', sym: 'C₁₂H₂₂O₁₁(s) —Δ→ 12C(s) + 11H₂O(g)' },
    result: { obs: X('Sugar melted, turned brown and then black; water drops formed near the mouth.'), concl: X('Sugar is a compound made of carbon, hydrogen and oxygen; strong heating breaks it down.'),
      safety: X('Point the mouth of the tube away from everyone. Hot melted sugar sticks and burns badly.'),
      viva: [{ q: X('What is the black solid?'), a: X('Carbon (charcoal).') }, { q: X('Where do the water drops come from?'), a: X('From the hydrogen and oxygen in sugar.') }, { q: X('Is sugar an element or a compound?'), a: X('A compound.') }] },
  },
  // ===================================================== Class 9
  {
    id: 'tyndall', cls: 9, ch: X('Ch 5 · Exploring Mixtures and their Separation'), title: X('Solution, colloid and suspension (Tyndall effect)'),
    aim: X('To tell a true solution, a colloid and a suspension apart by shining a beam of light through them.'),
    kind: X('Types of mixtures'),
    setup(K) {
      const a = K.beaker(-0.3, -0.64, 'water', 75); K.lab.fill(a, 'nacl', 5); a.name = X('Beaker A — salt solution');
      const b = K.beaker(0.0, -0.64, 'water', 60); K.lab.fill(b, 'milk', 20); b.name = X('Beaker B — dilute milk');
      const c = K.beaker(0.3, -0.64, 'water', 80); c.mix.ppt.chalk = 1; c.mix.cloud = 0.8; c.name = X('Beaker C — chalk in water');
      const tc = K.add(K.A.torch(), -0.1, -0.45);
      return { a, b, c, tc };
    },
    steps: [
      { do: X('Look at the three mixtures. Then shine the torch through beaker A (salt solution) from the side.'), target: 'tc', act: (K, o) => K.shine(o.tc, o.a, 2.5), ev: { type: 'shine', v: 'a' },
        see: X('The beam cannot be seen inside the salt solution; it is clear.'), why: X('In a true solution the particles are far too small to scatter light.') },
      { do: X('Shine the torch through beaker B (dilute milk).'), target: 'b', act: (K, o) => K.shine(o.tc, o.b, 3), ev: { type: 'shine', v: 'b' },
        see: X('The path of the beam is clearly seen as a bright line.'), why: X('Milk is a colloid. Its particles are big enough to scatter light, making the path visible — the Tyndall effect.') },
      { do: X('Shine the torch through beaker C (chalk in water).'), target: 'c', act: (K, o) => K.shine(o.tc, o.c, 2.5), ev: { type: 'shine', v: 'c' },
        see: X('The beam is seen, but it gets weaker as it passes through; the mixture is not clear.'), why: X('Chalk in water is a suspension with large particles that block and scatter light.') },
      { do: X('Leave the beakers undisturbed for some time.'), target: 'c', act: (K) => K.wait(8, 16),
        see: X('Chalk settles at the bottom of C. Nothing settles in A or B.'), why: X('Particles of a suspension are big enough to settle; those of a solution and a colloid are not.') },
    ],
    eq: { word: 'Solution: no Tyndall effect, stable · Colloid: Tyndall effect, stable · Suspension: scatters, settles', sym: 'particle size: solution < 1 nm  ·  colloid 1–1000 nm  ·  suspension > 1000 nm' },
    result: { obs: X('Beam path invisible in salt solution, clearly visible in dilute milk, visible but blocked in chalk water; chalk settled.'), concl: X('A solution does not scatter light; a colloid shows the Tyndall effect and is stable; a suspension scatters light and settles.'),
      safety: X('Never shine a torch or laser into anyone\'s eyes.'),
      viva: [{ q: X('What is the Tyndall effect?'), a: X('Scattering of a beam of light by colloid particles, which makes its path visible.') }, { q: X('Is milk a solution or a colloid?'), a: X('A colloid.') }, { q: X('Which mixture settles on standing?'), a: X('The suspension (chalk in water).') }] },
  },
  {
    id: 'sublimation', cls: 9, ch: X('Ch 5 · Exploring Mixtures and their Separation'), title: X('Sublimation of ammonium chloride'),
    aim: X('To separate ammonium chloride from a mixture with sand by sublimation.'),
    kind: X('Separation by sublimation'),
    setup(K) {
      const tp = K.tripod(0.1, -0.66); const bn = K.burner(0.34, -0.62);
      const dish = K.add(K.A.chinaDish(), -0.18, -0.64); const fn = K.add(K.A.funnel(), -0.4, -0.66);
      const sand = K.lab.add(K.A.granules(0xc2a878, { n: 18, metal: 0, rough: 1 }), 0, 0); sand.chem = 'sand'; sand.amount = 1; K.lab.putSolid(sand, dish); sand.g.scale.set(1.6, 0.6, 1.6);
      const ac = K.solid('nh4cl', -0.18, -0.48);
      return { tp, bn, dish, fn, ac, sand };
    },
    steps: [
      { do: X('Add the ammonium chloride to the sand in the china dish (this is our mixture).'), target: 'ac', act: (K, o) => K.addSolid(o.ac, o.dish), ev: { type: 'add', to: 'dish' }, see: X('A white powder mixed with sand.') },
      { do: X('Put the dish on the tripod and cover it with an upside-down funnel. Plug the stem with cotton.'), target: 'fn',
        act: async (K, o) => { await K.onTripod(o.dish, o.tp, o.bn); const m = o.dish.mouthWorld(new K.THREE.Vector3()); await K.moveTo(o.fn, m.clone().add(new K.THREE.Vector3(0, 0.097 - 0.006, 0)), new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(Math.PI, 0, 0)), 1); o.fn.cotton.visible = true; o.dish.funnel = o.fn; },
        see: X('The funnel covers the dish; its stem points up with a cotton plug.') },
      { do: X('Light the burner and heat gently (time-lapse).'), target: 'bn', act: async (K, o) => { await K.light(o.bn); await K.wait(12, 8); }, ev: { type: 'lit' },
        see: X('White fumes rise from the mixture. A white solid forms on the cool inside walls of the funnel. Sand is left in the dish.'),
        why: X('Ammonium chloride changes directly from solid to vapour on heating (sublimation) and back to solid on the cool funnel. Sand does not sublime.') },
      { do: X('Turn off the burner.'), target: 'bn', act: (K, o) => K.extinguish(o.bn), see: X('Pure ammonium chloride is collected on the funnel, and sand stays in the dish.') },
    ],
    eq: { word: 'Ammonium chloride (solid) ⇌ ammonium chloride (vapour)', sym: 'NH₄Cl(s) —Δ→ NH₃(g) + HCl(g) —cool→ NH₄Cl(s)' },
    result: { obs: X('White fumes; white solid deposited on the funnel; sand remained in the dish.'), concl: X('Ammonium chloride sublimes, so it can be separated from sand by sublimation.'),
      safety: X('Heat gently in a well-ventilated room and do not breathe the fumes.'),
      viva: [{ q: X('What is sublimation?'), a: X('A change from solid directly to vapour without melting (and back to solid on cooling).') }, { q: X('Name two substances that sublime.'), a: X('Camphor, naphthalene, ammonium chloride, iodine (any two).') }, { q: X('Why is cotton put in the funnel stem?'), a: X('To stop the vapours from escaping.') }] },
  },
  {
    id: 'chromatography', cls: 9, ch: X('Ch 5 · Exploring Mixtures and their Separation'), title: X('Paper chromatography of black ink'),
    aim: X('To separate the coloured dyes in black ink by paper chromatography.'),
    kind: X('Separation by chromatography'),
    setup(K) {
      const b = K.beaker(0.0, -0.64, 'water', 12, 100); b.name = X('Beaker with a little water');
      const st = K.add(K.A.chromaStrip(), -0.25, -0.5); st.g.rotation.set(-Math.PI / 2, 0, 0.2); st.g.position.y += 0.002; st.home = { p: st.g.position.clone(), q: st.g.quaternion.clone() };
      return { b, st };
    },
    steps: [
      { do: X('Look at the strip: a black ink spot sits just above a pencil line near its bottom.'), target: 'st', act: (K, o) => K.up(o.st, 0.06, 0.5).then(() => K.home(o.st, 0.5)), see: X('A single black spot.') },
      { do: X('Hang the strip in the beaker so that only its bottom edge dips in the water (the spot must stay above the water).'), target: 'b', act: (K, o) => K.hang(o.st, o.b), ev: { type: 'hang' },
        see: X('The lower edge of the paper is wet.'), why: X('If the spot were under water, the ink would just wash away into it.') },
      { do: X('Watch as the water rises up the paper (time-lapse).'), target: 'st', act: (K, o) => K.develop(o.st, 12, 60),
        see: X('The water climbs the paper and carries the ink with it. The black spot splits into bands of blue, purple, pink and yellow.'),
        why: X('Black ink is a mixture of dyes. Each dye dissolves and sticks to paper differently, so they travel different distances.') },
    ],
    eq: { word: 'Black ink = mixture of dyes → separated as coloured bands', sym: 'faster-moving dye travels higher on the paper' },
    result: { obs: X('Water rose up the paper and the black ink separated into several coloured bands.'), concl: X('Black ink is a mixture of different dyes; paper chromatography separates them.'),
      safety: X('Keep the spot above the water level and use a pencil (not a pen) for the start line.'),
      viva: [{ q: X('Why is the start line drawn with a pencil?'), a: X('Pencil (graphite) does not dissolve or move with the water.') }, { q: X('Why do dyes travel different distances?'), a: X('They differ in how well they dissolve in water and how strongly they stick to paper.') }, { q: X('Give one use of chromatography.'), a: X('To find colours in a dye, or drugs in blood, or pigments in plants.') }] },
  },
  // ===================================================== Class 10 · Metals and non-metals
  {
    id: 'metals_hcl', cls: 10, ch: X('Ch 3 · Metals and Non-metals'), title: X('Metals with dilute hydrochloric acid'),
    aim: X('To compare how magnesium, aluminium, zinc, iron and copper react with dilute hydrochloric acid.'),
    kind: X('Reactivity of metals'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = [0, 1, 2, 3, 4].map((i) => { const x = K.tube(rk, i, 'hcl', 6); x.name = [X('Test tube A — dilute HCl'), X('Test tube B — dilute HCl'), X('Test tube C — dilute HCl'), X('Test tube D — dilute HCl'), X('Test tube E — dilute HCl')][i]; return x; });
      const mets = ['mg', 'al', 'zn', 'fe', 'cu'].map((c, i) => K.solid(c, -0.32 + i * 0.13, -0.46, { amount: c === 'mg' ? 0.5 : 1 }));
      const lamp = K.lamp(0.42, -0.62); const sp = K.splint(0.3, -0.44);
      const o = { rk, lamp, sp }; t.forEach((x, i) => { o['t' + i] = x; }); ['mg', 'al', 'zn', 'fe', 'cu'].forEach((c, i) => { o[c] = mets[i]; }); return o;
    },
    steps: [
      { do: X('Drop a cleaned piece of magnesium ribbon into test tube A.'), target: 'mg', act: (K, o) => K.addSolid(o.mg, o.t0), ev: { type: 'add', to: 't0' },
        see: X('Very fast fizzing at once; the ribbon gets smaller and the tube becomes warm.'), why: X('Magnesium is very reactive and quickly pushes hydrogen out of the acid.') },
      { do: X('Add aluminium to tube B.'), target: 'al', act: (K, o) => K.addSolid(o.al, o.t1), ev: { type: 'add', to: 't1' },
        see: X('Hardly any bubbles at first.'), why: X('Aluminium is covered with a thin, protective oxide layer that the acid must first remove.') },
      { do: X('Add zinc granules to tube C.'), target: 'zn', act: (K, o) => K.addSolid(o.zn, o.t2), ev: { type: 'add', to: 't2' }, see: X('Steady, moderate bubbling.') },
      { do: X('Add iron to tube D.'), target: 'fe', act: (K, o) => K.addSolid(o.fe, o.t3), ev: { type: 'add', to: 't3' }, see: X('Slow bubbling.') },
      { do: X('Add copper turnings to tube E.'), target: 'cu', act: (K, o) => K.addSolid(o.cu, o.t4), ev: { type: 'add', to: 't4' }, see: X('Nothing happens — no bubbles.'), why: X('Copper is less reactive than hydrogen, so it cannot push hydrogen out of the acid.') },
      { do: X('Compare the five tubes after a minute.'), target: 't1', act: (K) => K.wait(8, 4),
        see: X('Now aluminium fizzes strongly too. Fizzing: magnesium most, then aluminium, zinc, iron; copper none.'), why: X('This is the order of reactivity: Mg > Al > Zn > Fe > Cu.') },
      { do: X('Light the lamp and bring a burning splint to the mouth of tube C.'), target: 'sp', act: async (K, o) => { await K.light(o.lamp); await K.splintTest(o.sp, o.t2, o.lamp); }, ev: { type: 'pop' },
        see: X('The gas burns with a pop sound.'), why: X('The gas given off by metals with dilute acids is hydrogen.') },
    ],
    eq: { word: 'Metal + Dilute hydrochloric acid → Metal chloride + Hydrogen', sym: 'Mg + 2HCl → MgCl₂ + H₂↑ · 2Al + 6HCl → 2AlCl₃ + 3H₂↑ · Zn + 2HCl → ZnCl₂ + H₂↑ · Fe + 2HCl → FeCl₂ + H₂↑' },
    result: { obs: X('Magnesium reacted most vigorously, then aluminium (after a delay), zinc and iron; copper did not react. The gas burned with a pop.'),
      concl: X('Metals above hydrogen in the activity series give hydrogen with dilute acids. Order of reactivity: Mg > Al > Zn > Fe > Cu.'),
      safety: X('Handle the acid carefully and keep the burning splint at the mouth of the tube only.'),
      viva: [{ q: X('Which metal reacted fastest?'), a: X('Magnesium.') }, { q: X('Why does copper not react with dilute HCl?'), a: X('It is below hydrogen in the reactivity series.') }, { q: X('Why does aluminium start slowly?'), a: X('It has a protective layer of aluminium oxide.') }] },
  },

  {
    id: 'reactivity', cls: 10, ch: X('Ch 3 · Metals and Non-metals'), title: X('Which metal is more reactive? (displacement)'),
    aim: X('To find the order of reactivity of zinc, iron and copper by putting each metal in solutions of the others\' salts.'),
    kind: X('Displacement reactions'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const sol = ['cuso4', 'feso4', 'feso4', 'znso4', 'znso4'];
      const t = sol.map((s, i) => { const x = K.tube(rk, i, s, 6); return x; });
      t[0].name = X('Test tube A — copper sulphate'); t[1].name = X('Test tube B — ferrous sulphate'); t[2].name = X('Test tube C — ferrous sulphate'); t[3].name = X('Test tube D — zinc sulphate'); t[4].name = X('Test tube E — zinc sulphate');
      const m = [['zn', -0.36], ['cu', -0.2], ['zn', -0.04], ['fe', 0.12], ['cu', 0.28]].map(([c, x]) => K.solid(c, x, -0.46));
      const o = { rk }; t.forEach((x, i) => { o['t' + i] = x; o['m' + i] = m[i]; }); return o;
    },
    steps: [
      { do: X('Put a zinc granule in tube A (copper sulphate).'), target: 'm0', act: (K, o) => K.addSolid(o.m0, o.t0), ev: { type: 'add', to: 't0' }, see: X('Zinc is now in the blue solution.') },
      { do: X('Put copper turnings in tube B (ferrous sulphate).'), target: 'm1', act: (K, o) => K.addSolid(o.m1, o.t1), ev: { type: 'add', to: 't1' } },
      { do: X('Put a zinc granule in tube C (ferrous sulphate).'), target: 'm2', act: (K, o) => K.addSolid(o.m2, o.t2), ev: { type: 'add', to: 't2' } },
      { do: X('Put an iron nail in tube D (zinc sulphate).'), target: 'm3', act: (K, o) => K.addSolid(o.m3, o.t3), ev: { type: 'add', to: 't3' } },
      { do: X('Put copper turnings in tube E (zinc sulphate).'), target: 'm4', act: (K, o) => K.addSolid(o.m4, o.t4), ev: { type: 'add', to: 't4' } },
      { do: X('Leave the tubes for about 20 minutes and compare (time-lapse).'), target: 't0', act: (K) => K.wait(10, 120),
        see: X('A: the blue colour fades and a reddish-brown layer of copper covers the zinc. C: the pale green colour fades and the zinc gets a dark grey coat. B, D and E: no change.'),
        why: X('A more reactive metal pushes a less reactive metal out of its salt solution. Zinc displaces copper and iron; iron cannot displace zinc; copper cannot displace iron or zinc.') },
    ],
    eq: { word: 'Zinc + Copper sulphate → Zinc sulphate + Copper · Zinc + Ferrous sulphate → Zinc sulphate + Iron', sym: 'Zn + CuSO₄ → ZnSO₄ + Cu  ·  Zn + FeSO₄ → ZnSO₄ + Fe  ·  order: Zn > Fe > Cu' },
    result: { obs: X('Changes only in A (blue fades, copper deposit) and C (green fades, grey deposit); no change in B, D and E.'), concl: X('Order of reactivity: zinc > iron > copper. A more reactive metal displaces a less reactive one from its salt solution.'),
      safety: X('Clean the metals with sandpaper first so that the reaction can be seen clearly.'),
      viva: [{ q: X('Why does the blue colour fade in tube A?'), a: X('Copper sulphate is used up as zinc displaces copper; zinc sulphate is colourless.') }, { q: X('Why is there no change in tube D?'), a: X('Iron is less reactive than zinc, so it cannot displace zinc.') }, { q: X('Arrange Zn, Fe and Cu by reactivity.'), a: X('Zn > Fe > Cu.') }] },
  },
  {
    id: 'ph_salts', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('pH of salt solutions'),
    aim: X('To find out whether solutions of some salts are acidic, basic or neutral.'),
    kind: X('pH of salts'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = ['nacl', 'kno3', 'znso4', 'cuso4', 'washingsoda', 'bakingsoda'].map((s, i) => K.tube(rk, i, s, 5));
      const p = t.map((_, i) => K.strip('ph', -0.2 + i * 0.045, -0.45));
      const o = { rk }; t.forEach((x, i) => { o['t' + i] = x; o['p' + i] = p[i]; }); return o;
    },
    steps: [
      { do: X('Test sodium chloride solution with pH paper.'), target: 't0', act: (K, o) => K.dip(o.p0, o.t0), ev: { type: 'dip', in: 't0' }, see: X('Green — pH 7. Neutral.'), why: X('Salt of a strong acid (HCl) and a strong base (NaOH) is neutral.') },
      { do: X('Test potassium nitrate solution.'), target: 't1', act: (K, o) => K.dip(o.p1, o.t1), ev: { type: 'dip', in: 't1' }, see: X('Green — pH 7. Neutral.') },
      { do: X('Test zinc sulphate solution.'), target: 't2', act: (K, o) => K.dip(o.p2, o.t2), ev: { type: 'dip', in: 't2' }, see: X('Orange-yellow — pH about 5. Acidic.'), why: X('Salt of a strong acid (H₂SO₄) and a weak base gives an acidic solution.') },
      { do: X('Test copper sulphate solution.'), target: 't3', act: (K, o) => K.dip(o.p3, o.t3), ev: { type: 'dip', in: 't3' }, see: X('Orange — pH about 4. Acidic.') },
      { do: X('Test sodium carbonate solution.'), target: 't4', act: (K, o) => K.dip(o.p4, o.t4), ev: { type: 'dip', in: 't4' }, see: X('Blue to violet — pH about 11. Basic.'), why: X('Salt of a strong base (NaOH) and a weak acid (carbonic acid) gives a basic solution.') },
      { do: X('Test sodium hydrogencarbonate solution.'), target: 't5', act: (K, o) => K.dip(o.p5, o.t5), ev: { type: 'dip', in: 't5' }, see: X('Blue-green — pH about 8. Weakly basic.') },
    ],
    eq: { word: 'Strong acid + strong base → neutral salt · strong acid + weak base → acidic · weak acid + strong base → basic', sym: 'NaCl, KNO₃: pH 7 · ZnSO₄, CuSO₄: pH < 7 · Na₂CO₃, NaHCO₃: pH > 7' },
    result: { obs: X('NaCl and KNO₃ gave pH 7; ZnSO₄ and CuSO₄ gave pH below 7; Na₂CO₃ and NaHCO₃ gave pH above 7.'), concl: X('Salt solutions can be neutral, acidic or basic, depending on the strength of the acid and base they come from.'),
      safety: X('Use a fresh pH paper strip for each solution.'),
      viva: [{ q: X('Why is NaCl solution neutral?'), a: X('It comes from a strong acid and a strong base.') }, { q: X('Is sodium carbonate solution acidic or basic?'), a: X('Basic.') }, { q: X('Give a salt whose solution is acidic.'), a: X('Copper sulphate or zinc sulphate (or ammonium chloride).') }] },
  },
  {
    id: 'zn_naoh', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('Zinc with sodium hydroxide'),
    aim: X('To show that zinc reacts with sodium hydroxide solution on warming to give hydrogen gas.'),
    kind: X('Metal + base'),
    setup(K) {
      const rk = K.rack(-0.3, -0.62); const t = K.tube(rk, 3, 'naoh', 4, { boiling: true });
      const zn = K.solid('zn', -0.04, -0.48); const lamp = K.lamp(0.25, -0.6); const sp = K.splint(0.12, -0.44); K.holder(0.0, -0.4);
      return { rk, t, zn, lamp, sp };
    },
    steps: [
      { do: X('Put a few zinc granules in sodium hydroxide solution in a boiling tube.'), target: 'zn', act: (K, o) => K.addSolid(o.zn, o.t), ev: { type: 'add', to: 't' }, see: X('Only a few tiny bubbles — the reaction is very slow in the cold.') },
      { do: X('Light the lamp and warm the tube gently.'), target: 'lamp', act: async (K, o) => { await K.light(o.lamp); await K.heat(o.t, o.lamp, 8, { tilt: 0.45 }); }, ev: { type: 'heating', v: 't', sec: 5 },
        see: X('Bubbles of gas form steadily on the zinc.'), why: X('Warm sodium hydroxide reacts with zinc to form sodium zincate, and hydrogen gas is released.') },
      { do: X('Bring a burning splint near the mouth of the tube.'), target: 'sp', act: (K, o) => K.splintTest(o.sp, o.t, o.lamp), ev: { type: 'pop' },
        see: X('The gas burns with a pop sound.'), why: X('The gas is hydrogen.') },
    ],
    eq: { word: 'Zinc + Sodium hydroxide → Sodium zincate + Hydrogen', sym: '2NaOH(aq) + Zn(s) → Na₂ZnO₂(aq) + H₂(g)↑' },
    result: { obs: X('On warming, gas bubbles formed on zinc; the gas burned with a pop.'), concl: X('Some metals like zinc react with bases such as sodium hydroxide to give hydrogen gas.'),
      safety: X('Sodium hydroxide is caustic; warm gently and keep the tube pointed away from people.'),
      viva: [{ q: X('Name the salt formed.'), a: X('Sodium zincate (Na₂ZnO₂).') }, { q: X('Which gas is formed?'), a: X('Hydrogen.') }, { q: X('Do all metals react with NaOH?'), a: X('No — only a few, such as zinc and aluminium.') }] },
  },
  {
    id: 'rusting', cls: 7, also: [10], ch: X('Ch 5 · Changes Around Us: Physical and Chemical'), title: X('What makes iron rust?'),
    aim: X('To show that iron needs both air and water to rust.'),
    kind: X('Rusting (slow chemical change)'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const a = K.tube(rk, 1, 'water', 6), b = K.tube(rk, 3, 'water', 9), c = K.tube(rk, 5, null, 0);
      a.name = X('Test tube A — tap water'); b.name = X('Test tube B — boiled water and oil'); c.name = X('Test tube C — dry air');
      const n = [-0.3, -0.12, 0.06].map((x) => K.solid('fe', x, -0.46)); const cc = K.solid('cacl2', 0.24, -0.46);
      return { rk, a, b, c, n1: n[0], n2: n[1], n3: n[2], cc };
    },
    steps: [
      { do: X('Put a clean iron nail in tube A with some tap water, so that the nail is partly in water and partly in air.'), target: 'n1', act: (K, o) => K.addSolid(o.n1, o.a), ev: { type: 'add', to: 'a' }, see: X('The nail touches both water and air.') },
      { do: X('Put a nail in tube B filled with boiled water, and pour a little oil on top.'), target: 'n2', act: (K, o) => { o.b.noAir = true; return K.addSolid(o.n2, o.b).then(() => { K.oil(o.b); }); }, ev: { type: 'add', to: 'b' },
        see: X('The oil floats as a layer on the water.'), why: X('Boiling removes the dissolved air, and the oil stops air from dissolving again.') },
      { do: X('Put a nail in tube C with some anhydrous calcium chloride, and close it with a cork.'), target: 'n3', act: async (K, o) => { await K.addSolid(o.cc, o.c); await K.addSolid(o.n3, o.c); K.cork(o.c); }, ev: { type: 'add', to: 'c' },
        see: X('The nail is in dry air.'), why: X('Calcium chloride soaks up moisture, so the air in the tube is dry.') },
      { do: X('Leave the tubes for a few days (time-lapse).'), target: 'a', act: (K) => K.wait(12, 26000),
        see: X('Only the nail in tube A is covered with brown rust. The nails in B and C stay shiny.'),
        why: X('Rusting needs both air (oxygen) and water. Tube B has no air and tube C has no water.') },
    ],
    eq: { word: 'Iron + Oxygen + Water → Rust (hydrated iron oxide)', sym: '4Fe + 3O₂ + xH₂O → 2Fe₂O₃·xH₂O' },
    result: { obs: X('Rust formed only on the nail with both air and water (tube A).'), concl: X('Iron rusts only when both air (oxygen) and water are present. Rusting is a chemical change.'),
      safety: X('Clean the nails with sandpaper before starting.'),
      viva: [{ q: X('What two things are needed for rusting?'), a: X('Air (oxygen) and water (moisture).') }, { q: X('Why is boiled water used in tube B?'), a: X('Boiling removes dissolved air.') }, { q: X('How can rusting be prevented?'), a: X('By painting, oiling, greasing or galvanising (coating with zinc).') }] },
  },
];
