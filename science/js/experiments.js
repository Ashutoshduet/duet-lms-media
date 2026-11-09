// Chemistry experiments (NCERT Class 6–10). Each one builds its bench, then runs as steps:
// what to do → what you see → why it happens. "ev" lets a student do the step by hand in VR.
// Text is English here; Hindi and Hinglish come from exp_i18n.js.

import { EXPERIMENTS2 } from './experiments2.js';
import { EXPERIMENTS3 } from './experiments3.js';
import { EXPERIMENTS4 } from './experiments4.js';
import { EXPERIMENTS5 } from './experiments5.js';
import { EXPERIMENTS6 } from './experiments6.js';
import { EXPERIMENTS_P1 } from './experiments_p1.js';
import { EXPERIMENTS_P2 } from './experiments_p2.js';
import { EXPERIMENTS_P3 } from './experiments_p3.js';
import { EXPERIMENTS_P4 } from './experiments_p4.js';
import { EXPERIMENTS_P5 } from './experiments_p5.js';
import { EXPERIMENTS_P6 } from './experiments_p6.js';
import { EXPERIMENTS_P7 } from './experiments_p7.js';
import { EXPERIMENTS_P8 } from './experiments_p8.js';
import { EXPERIMENTS_P9 } from './experiments_p9.js';
import { EXPERIMENTS_P10 } from './experiments_p10.js';
import { EXPERIMENTS_P11 } from './experiments_p11.js';
import { EXPERIMENTS_FREE } from './experiments_free.js';
import { DICT } from './exp_i18n.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });

export const EXPERIMENTS = [
  // ===================================================== Class 10 · Chemical reactions and equations
  {
    id: 'mg_burn', cls: 10, also: [7], ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Burning magnesium ribbon'),
    aim: X('To observe what happens when magnesium burns in air, and test the ash it leaves.'),
    kind: X('Combination reaction'),
    setup(K) {
      const lamp = K.lamp(0.22, -0.6); const tg = K.tongs(-0.05, -0.47);
      const rb = K.solid('mg', -0.18, -0.6);
      const wg = K.add(K.A.watchGlass(), 0.05, -0.62); wg.name = X('Watch glass');
      const tt = K.add(K.A.testTube(), -0.38, -0.6);
      K.lab.fill(tt, 'water', 4);
      const red = K.strip('red', -0.4, -0.46);
      return { lamp, tg, rb, wg, tt, red };
    },
    steps: [
      { do: X('Clean the magnesium ribbon with sandpaper to remove the dull layer on it. A clean ribbon looks shiny silver.'), target: 'rb', act: async (K, o) => { await K.up(o.rb, 0.05, 0.4); await K.home(o.rb, 0.4); o.rb.mat.color.setHex(0xe2e5e8); },
        see: X('The ribbon is now bright and shiny.'), why: X('Magnesium slowly forms a thin layer of magnesium oxide in air. Removing it lets fresh metal touch the oxygen.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' }, see: X('A steady flame burns at the wick.') },
      { do: X('Hold the ribbon with tongs and put its tip in the flame. Do not look straight at it for long.'), target: 'tg', act: (K, o) => K.burnRibbon(o.rb, o.tg, o.lamp), ev: { type: 'mg_burnt' },
        see: X('The ribbon catches fire and burns with a dazzling white flame. A white powder is left behind.'),
        why: X('Magnesium combines with oxygen from the air to make magnesium oxide. A lot of energy comes out as heat and bright light.') },
      { do: X('Collect the white powder (magnesium oxide) and dissolve it in a little water.'), target: 'tt',
        act: async (K, o) => { K.lab.fill(o.tt, 'limewater', 0.4); o.tt.mix.liq.limewater = 0; o.tt.mix.add('milkmag', 1); await K.shake(o.tt, 1); },
        see: X('The powder mixes with the water to give a slightly milky solution.'), why: X('Magnesium oxide reacts with water to form magnesium hydroxide.') },
      { do: X('Dip a red litmus paper in this solution.'), target: 'red', act: (K, o) => K.dip(o.red, o.tt), ev: { type: 'dip' },
        see: X('The red litmus paper turns blue.'), why: X('Magnesium hydroxide is a base. Oxides of metals are basic in nature.') },
    ],
    eq: { word: 'Magnesium + Oxygen → Magnesium oxide', sym: '2Mg(s) + O₂(g) → 2MgO(s)' },
    result: { obs: X('Dazzling white flame; white powder (MgO) formed; its solution turns red litmus blue.'), concl: X('Magnesium combines with oxygen to form magnesium oxide. This is a combination reaction, and metal oxides are basic.'),
      safety: X('Do not look directly at burning magnesium for long. Hold it with tongs, away from your face.'),
      viva: [{ q: X('Why is magnesium ribbon cleaned before burning?'), a: X('To remove the layer of magnesium oxide so that fresh metal reacts with oxygen.') },
        { q: X('What type of reaction is this?'), a: X('A combination reaction (also an oxidation, and it releases heat and light).') },
        { q: X('What is the nature of magnesium oxide?'), a: X('It is basic; its solution turns red litmus blue.') }] },
  },
  {
    id: 'pb_ki', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Lead nitrate and potassium iodide'),
    aim: X('To observe a double displacement reaction that forms a coloured precipitate.'),
    kind: X('Double displacement (precipitation) reaction'),
    setup(K) {
      const rk = K.rack(-0.08, -0.6); const t1 = K.tube(rk, 2); const t2 = K.tube(rk, 3);
      const b1 = K.bottle('pbno3', -0.5, -0.8); const b2 = K.bottle('ki', -0.36, -0.8);
      return { rk, t1, t2, b1, b2 };
    },
    steps: [
      { do: X('Pour about 3 mL of lead nitrate solution into a test tube.'), target: 'b1', act: (K, o) => K.pour(o.b1, o.t1, 3), ev: { type: 'pouring', to: 't1', ml: 2 },
        see: X('Lead nitrate solution is clear and colourless.') },
      { do: X('Pour about 3 mL of potassium iodide solution into another test tube.'), target: 'b2', act: (K, o) => K.pour(o.b2, o.t2, 3), ev: { type: 'pouring', to: 't2', ml: 2 },
        see: X('Potassium iodide solution is also clear and colourless.') },
      { do: X('Now pour the potassium iodide solution into the lead nitrate solution.'), target: 't2', act: (K, o) => K.pour(o.t2, o.t1, 3), ev: { type: 'pouring', from: 't2', to: 't1', ml: 1.5 },
        see: X('A bright yellow solid forms at once and makes the liquid cloudy.'),
        why: X('Lead and potassium exchange partners. Lead iodide does not dissolve in water, so it comes out as a yellow solid called a precipitate.') },
      { do: X('Leave the test tube still for a while and watch.'), target: 't1', act: (K) => K.wait(6, 4), see: X('The yellow precipitate slowly settles at the bottom; the liquid above becomes clearer.'),
        why: X('The precipitate is heavier than water, so it sinks. The colourless potassium nitrate stays dissolved.') },
    ],
    eq: { word: 'Lead nitrate + Potassium iodide → Lead iodide + Potassium nitrate', sym: 'Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s)↓ + 2KNO₃(aq)' },
    result: { obs: X('Two colourless solutions give a bright yellow precipitate of lead iodide.'), concl: X('This is a double displacement reaction. A reaction that forms an insoluble solid is also called a precipitation reaction.'),
      safety: X('Lead compounds are poisonous. Do not touch them; wash your hands after the experiment.'),
      viva: [{ q: X('What is the colour of the precipitate?'), a: X('Yellow (lead iodide, PbI₂).') }, { q: X('Name the type of reaction.'), a: X('Double displacement, and precipitation.') }, { q: X('Which product stays dissolved?'), a: X('Potassium nitrate (KNO₃).') }] },
  },
  {
    id: 'zn_acid', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Zinc and dilute sulphuric acid'),
    aim: X('To see that a metal and an acid give hydrogen gas, and to test the gas.'),
    kind: X('Displacement reaction (metal + acid)'),
    setup(K) {
      const rk = K.rack(-0.08, -0.62); const t = K.tube(rk, 2, null, 0, { boiling: true });
      const b = K.bottle('h2so4', -0.5, -0.8); const zn = K.solid('zn', -0.32, -0.55);
      const lamp = K.lamp(0.3, -0.62); const sp = K.splint(0.15, -0.46);
      return { rk, t, b, zn, lamp, sp };
    },
    steps: [
      { do: X('Put a few zinc granules in a boiling tube.'), target: 'zn', act: (K, o) => K.addSolid(o.zn, o.t), ev: { type: 'add', to: 't' }, see: X('Grey zinc granules lie at the bottom of the tube.') },
      { do: X('Add about 10 mL of dilute sulphuric acid.'), target: 'b', act: (K, o) => K.pour(o.b, o.t, 10), ev: { type: 'pouring', to: 't', ml: 5 },
        see: X('Gas bubbles form on the zinc and rise through the acid. The tube becomes slightly warm.'),
        why: X('Zinc is more reactive than hydrogen, so it pushes hydrogen out of the acid. Zinc sulphate forms and hydrogen gas is released.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' }, see: X('The lamp is burning.') },
      { do: X('Light a splint and bring the burning splint near the mouth of the tube.'), target: 'sp', act: (K, o) => K.splintTest(o.sp, o.t, o.lamp), ev: { type: 'pop' },
        see: X('The gas burns with a "pop" sound.'), why: X('Only hydrogen burns with a pop sound. This test proves the gas is hydrogen.') },
    ],
    eq: { word: 'Zinc + Sulphuric acid → Zinc sulphate + Hydrogen', sym: 'Zn(s) + H₂SO₄(aq) → ZnSO₄(aq) + H₂(g)↑' },
    result: { obs: X('Bubbles of a colourless gas; the gas burns with a pop sound.'), concl: X('Metals react with dilute acids to give a salt and hydrogen gas.'),
      safety: X('Handle the acid with care. Keep the burning splint at the mouth only, never inside the tube.'),
      viva: [{ q: X('Which gas is formed?'), a: X('Hydrogen.') }, { q: X('How do you test hydrogen?'), a: X('It burns with a pop sound when a burning splint is brought near.') }, { q: X('Why does the tube get warm?'), a: X('The reaction gives out heat (it is exothermic).') }] },
  },
  {
    id: 'cao_water', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Quick lime and water'),
    aim: X('To observe the reaction of calcium oxide with water and the heat it gives out.'),
    kind: X('Combination reaction (exothermic)'),
    setup(K) {
      const bk = K.beaker(0.05, -0.6, null, 0, 100); const cao = K.solid('cao', -0.18, -0.58, { amount: 0.6 });
      const wb = K.beaker(-0.42, -0.7, 'water', 60, 250); wb.name = X('Beaker of water');
      const th = K.thermo(0.25, -0.5);
      return { bk, cao, wb, th };
    },
    steps: [
      { do: X('Put a small amount of quick lime (calcium oxide) in a beaker.'), target: 'cao', act: (K, o) => K.addSolid(o.cao, o.bk), ev: { type: 'add', to: 'bk' }, see: X('White lumps of quick lime are in the beaker.') },
      { do: X('Place a thermometer in the beaker. Note the temperature.'), target: 'th', act: async (K, o) => { const m = o.bk.mouthWorld(new K.THREE.Vector3()); await K.moveTo(o.th, m.clone().add(new K.THREE.Vector3(0.012, -0.065, 0)), new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(0, 0, -0.18)), 1); o.th.follow = o.bk; },
        see: X('The thermometer shows room temperature, about 27 °C.') },
      { do: X('Slowly add water to the quick lime.'), target: 'wb', act: (K, o) => K.pour(o.wb, o.bk, 30), ev: { type: 'pouring', to: 'bk', ml: 15 },
        see: X('The lumps hiss and crumble. The mixture becomes milky and hot — the thermometer rises quickly.'),
        why: X('Calcium oxide combines with water to form calcium hydroxide (slaked lime) and gives out a lot of heat. Reactions that release heat are exothermic.') },
      { do: X('Wait and read the thermometer again.'), target: 'th', act: (K) => K.wait(5), see: X('The temperature has gone up by tens of degrees.') },
    ],
    eq: { word: 'Calcium oxide + Water → Calcium hydroxide + Heat', sym: 'CaO(s) + H₂O(l) → Ca(OH)₂(aq) + Heat' },
    result: { obs: X('Hissing sound, a lot of heat, and a milky suspension of slaked lime.'), concl: X('Calcium oxide combines with water to form calcium hydroxide. It is an exothermic combination reaction.'),
      safety: X('The beaker becomes very hot. Do not touch it; add water slowly.'),
      viva: [{ q: X('What is quick lime?'), a: X('Calcium oxide, CaO.') }, { q: X('What is the product used for?'), a: X('Calcium hydroxide (slaked lime) is used to whitewash walls.') }, { q: X('Is the reaction exothermic or endothermic?'), a: X('Exothermic — it releases heat.') }] },
  },
  {
    id: 'feso4_heat', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Heating ferrous sulphate crystals'),
    aim: X('To observe a decomposition reaction caused by heating.'),
    kind: X('Thermal decomposition reaction'),
    setup(K) {
      const rk = K.rack(-0.3, -0.62); const t = K.tube(rk, 3, null, 0, { boiling: true });
      const cr = K.solid('feso4x', 0.0, -0.56); const lamp = K.lamp(0.28, -0.6); K.holder(0.1, -0.45);
      return { rk, t, cr, lamp };
    },
    steps: [
      { do: X('Put about 2 g of ferrous sulphate crystals in a dry boiling tube.'), target: 'cr', act: (K, o) => K.addSolid(o.cr, o.t), ev: { type: 'add', to: 't' }, see: X('The crystals are pale green.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' } },
      { do: X('Hold the tube with a holder and heat it over the flame, moving it gently.'), target: 't', act: (K, o) => K.heat(o.t, o.lamp, 16, { tilt: 0.55 }), ev: { type: 'heating', v: 't', sec: 10 },
        see: X('First water drops appear near the mouth and the crystals turn white. On more heating the solid turns reddish-brown and white fumes come out with a smell of burning sulphur.'),
        why: X('Heat first removes the water of crystallisation. Then ferrous sulphate breaks down into ferric oxide (reddish-brown), sulphur dioxide and sulphur trioxide.') },
    ],
    eq: { word: 'Ferrous sulphate → Ferric oxide + Sulphur dioxide + Sulphur trioxide', sym: '2FeSO₄(s) → Fe₂O₃(s) + SO₂(g) + SO₃(g)' },
    result: { obs: X('Green crystals → white → reddish-brown solid; gases with the smell of burning sulphur.'), concl: X('Ferrous sulphate decomposes on heating. A single substance breaking into simpler ones is a decomposition reaction.'),
      safety: X('Point the tube away from everyone. Do not smell the gases directly.'),
      viva: [{ q: X('What is the colour of ferrous sulphate crystals?'), a: X('Pale green.') }, { q: X('Name the brown solid formed.'), a: X('Ferric oxide, Fe₂O₃.') }, { q: X('What type of reaction is this?'), a: X('Thermal decomposition.') }] },
  },
  {
    id: 'pbno3_heat', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Heating lead nitrate'),
    aim: X('To observe the brown gas given off when lead nitrate is heated.'),
    kind: X('Thermal decomposition reaction'),
    setup(K) {
      const rk = K.rack(-0.3, -0.62); const t = K.tube(rk, 3, null, 0, { boiling: true });
      const pw = K.solid('pbno3s', 0.0, -0.56); const lamp = K.lamp(0.28, -0.6); K.holder(0.1, -0.45);
      return { rk, t, pw, lamp };
    },
    steps: [
      { do: X('Take about 2 g of lead nitrate powder in a boiling tube.'), target: 'pw', act: (K, o) => K.addSolid(o.pw, o.t), ev: { type: 'add', to: 't' }, see: X('Lead nitrate is a white powder.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' } },
      { do: X('Hold the tube with a holder and heat it over the flame.'), target: 't', act: (K, o) => K.heat(o.t, o.lamp, 16, { tilt: 0.55 }), ev: { type: 'heating', v: 't', sec: 10 },
        see: X('The powder crackles, and brown fumes rise out of the tube. A yellowish solid is left.'),
        why: X('Lead nitrate decomposes into lead oxide (yellowish), nitrogen dioxide (the brown gas) and oxygen.') },
    ],
    eq: { word: 'Lead nitrate → Lead oxide + Nitrogen dioxide + Oxygen', sym: '2Pb(NO₃)₂(s) → 2PbO(s) + 4NO₂(g) + O₂(g)' },
    result: { obs: X('Crackling sound, brown fumes of NO₂, yellow residue of PbO.'), concl: X('Lead nitrate undergoes thermal decomposition.'),
      safety: X('Nitrogen dioxide is poisonous — heat in a fume hood or open area and do not inhale.'),
      viva: [{ q: X('Name the brown gas.'), a: X('Nitrogen dioxide, NO₂.') }, { q: X('What is left in the tube?'), a: X('Lead oxide (PbO), a yellowish solid.') }, { q: X('Why does the powder crackle?'), a: X('Trapped moisture and gas burst the crystals — this is called decrepitation.') }] },
  },
  {
    id: 'fe_cuso4', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Iron nail in copper sulphate solution'),
    aim: X('To show that a more reactive metal displaces a less reactive metal from its salt solution.'),
    kind: X('Displacement reaction'),
    setup(K) {
      const rk = K.rack(-0.08, -0.62); const t = K.tube(rk, 2); const t2 = K.tube(rk, 4);
      const b = K.bottle('cuso4', -0.5, -0.8); const n = K.solid('fe', -0.3, -0.55);
      return { rk, t, t2, b, n };
    },
    steps: [
      { do: X('Pour about 10 mL of copper sulphate solution into each of two test tubes.'), target: 'b', act: async (K, o) => { await K.pour(o.b, o.t, 10); await K.pour(o.b, o.t2, 10); }, ev: { type: 'pouring', to: 't', ml: 5 },
        see: X('Copper sulphate solution is clear and blue.') },
      { do: X('Tie the clean iron nail with a thread and dip it in the first tube. Keep the second tube for comparison.'), target: 'n', act: (K, o) => K.addSolid(o.n, o.t), ev: { type: 'add', to: 't' },
        see: X('The grey iron nail is now in the blue solution.') },
      { do: X('Leave it for about 20 minutes (watch in time-lapse).'), target: 't', act: (K) => K.wait(10, 120),
        see: X('The nail gets a reddish-brown coating, and the blue colour of the solution fades to pale green. The second tube stays blue.'),
        why: X('Iron is more reactive than copper. It pushes copper out of copper sulphate: the copper sticks to the nail and green iron sulphate stays in the solution.') },
    ],
    eq: { word: 'Iron + Copper sulphate → Iron sulphate + Copper', sym: 'Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)' },
    result: { obs: X('Brown copper coats the nail; blue solution turns pale green.'), concl: X('Iron displaces copper from copper sulphate solution because iron is more reactive than copper.'),
      safety: X('Clean the nail with sandpaper before use; do not touch the copper sulphate solution.'),
      viva: [{ q: X('Why does the blue colour fade?'), a: X('Copper sulphate (blue) is used up and iron sulphate (pale green) forms.') }, { q: X('What is the brown coating?'), a: X('Copper metal.') }, { q: X('Why keep a second tube?'), a: X('To compare the colour and see the change clearly.') }] },
  },
  {
    id: 'ba_so4', cls: 10, ch: X('Ch 1 · Chemical Reactions and Equations'), title: X('Sodium sulphate and barium chloride'),
    aim: X('To observe a double displacement reaction that forms a white precipitate.'),
    kind: X('Double displacement (precipitation) reaction'),
    setup(K) {
      const rk = K.rack(-0.08, -0.6); const t1 = K.tube(rk, 2); const t2 = K.tube(rk, 3);
      const b1 = K.bottle('na2so4', -0.5, -0.8); const b2 = K.bottle('bacl2', -0.36, -0.8);
      return { rk, t1, t2, b1, b2 };
    },
    steps: [
      { do: X('Pour about 3 mL of sodium sulphate solution into a test tube.'), target: 'b1', act: (K, o) => K.pour(o.b1, o.t1, 3), ev: { type: 'pouring', to: 't1', ml: 2 }, see: X('A clear, colourless solution.') },
      { do: X('Pour about 3 mL of barium chloride solution into another test tube.'), target: 'b2', act: (K, o) => K.pour(o.b2, o.t2, 3), ev: { type: 'pouring', to: 't2', ml: 2 }, see: X('Also clear and colourless.') },
      { do: X('Mix the two solutions.'), target: 't2', act: (K, o) => K.pour(o.t2, o.t1, 3), ev: { type: 'pouring', from: 't2', to: 't1', ml: 1.5 },
        see: X('A thick white precipitate forms immediately.'), why: X('Barium sulphate does not dissolve in water, so it separates out as a white solid. Sodium chloride stays dissolved.') },
      { do: X('Let it stand and watch.'), target: 't1', act: (K) => K.wait(6, 4), see: X('The white precipitate settles at the bottom.') },
    ],
    eq: { word: 'Sodium sulphate + Barium chloride → Barium sulphate + Sodium chloride', sym: 'Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s)↓ + 2NaCl(aq)' },
    result: { obs: X('A white precipitate of barium sulphate forms.'), concl: X('Ions are exchanged between the two compounds — a double displacement reaction.'),
      safety: X('Barium compounds are poisonous; do not touch or taste them.'),
      viva: [{ q: X('Colour of the precipitate?'), a: X('White.') }, { q: X('Name the precipitate.'), a: X('Barium sulphate, BaSO₄.') }, { q: X('What stays in solution?'), a: X('Sodium chloride.') }] },
  },
  // ===================================================== Class 10 · Acids, bases and salts
  {
    id: 'litmus', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('Testing acids and bases with litmus'),
    aim: X('To find out which solutions are acidic and which are basic using litmus paper.'),
    kind: X('Indicator test'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const a = K.tube(rk, 1, 'hcl', 5), b = K.tube(rk, 2, 'naoh', 5), c = K.tube(rk, 3, 'lemon', 5), d = K.tube(rk, 4, 'soap', 5);
      const s = []; for (let i = 0; i < 4; i++) { s.push(K.strip('blue', -0.18 + i * 0.04, -0.47)); s.push(K.strip('red', -0.18 + i * 0.04, -0.42)); }
      return { rk, a, b, c, d, s0: s[0], s1: s[1], s2: s[2], s3: s[3], s4: s[4], s5: s[5], s6: s[6], s7: s[7] };
    },
    steps: [
      { do: X('Dip a blue and a red litmus paper in dilute hydrochloric acid.'), target: 'a', act: async (K, o) => { await K.dip(o.s0, o.a); await K.dip(o.s1, o.a); }, ev: { type: 'dip', in: 'a' },
        see: X('Blue litmus turns red. Red litmus stays red.'), why: X('Acids turn blue litmus red.') },
      { do: X('Dip a blue and a red litmus paper in sodium hydroxide solution.'), target: 'b', act: async (K, o) => { await K.dip(o.s2, o.b); await K.dip(o.s3, o.b); }, ev: { type: 'dip', in: 'b' },
        see: X('Red litmus turns blue. Blue litmus stays blue.'), why: X('Bases turn red litmus blue.') },
      { do: X('Test lemon juice the same way.'), target: 'c', act: async (K, o) => { await K.dip(o.s4, o.c); await K.dip(o.s5, o.c); }, ev: { type: 'dip', in: 'c' },
        see: X('Blue litmus turns red, so lemon juice is acidic.'), why: X('Lemon juice contains citric acid.') },
      { do: X('Test soap solution the same way.'), target: 'd', act: async (K, o) => { await K.dip(o.s6, o.d); await K.dip(o.s7, o.d); }, ev: { type: 'dip', in: 'd' },
        see: X('Red litmus turns blue, so soap solution is basic.'), why: X('Soap is made with an alkali and its solution is basic.') },
    ],
    eq: { word: 'Acid: blue litmus → red · Base: red litmus → blue', sym: 'HCl, lemon juice: acidic · NaOH, soap: basic' },
    result: { obs: X('HCl and lemon juice turn blue litmus red; NaOH and soap solution turn red litmus blue.'), concl: X('Litmus is an indicator: acids turn blue litmus red, and bases turn red litmus blue.'),
      safety: X('Never taste a solution to find out if it is acidic.'),
      viva: [{ q: X('What is litmus obtained from?'), a: X('From lichens.') }, { q: X('What does an acid do to blue litmus?'), a: X('Turns it red.') }, { q: X('Is soap solution acidic or basic?'), a: X('Basic.') }] },
  },
  {
    id: 'ph_paper', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('pH of common solutions'),
    aim: X('To find the pH of some common solutions with pH paper.'),
    kind: X('pH scale'),
    setup(K) {
      const rk = K.rack(-0.05, -0.64);
      const t = ['hcl', 'lemon', 'water', 'bakingsoda', 'milkmag', 'naoh'].map((s, i) => K.tube(rk, i, s, 5));
      const p = t.map((_, i) => K.strip('ph', -0.2 + i * 0.045, -0.45));
      const o = { rk }; t.forEach((x, i) => { o['t' + i] = x; o['p' + i] = p[i]; }); return o;
    },
    steps: [
      { do: X('Dip pH paper in dilute hydrochloric acid and compare its colour with the pH chart.'), target: 't0', act: (K, o) => K.dip(o.p0, o.t0), ev: { type: 'dip', in: 't0' }, see: X('Red — pH about 1. Strongly acidic.') },
      { do: X('Test lemon juice.'), target: 't1', act: (K, o) => K.dip(o.p1, o.t1), ev: { type: 'dip', in: 't1' }, see: X('Orange-red — pH about 2 to 3. Acidic.') },
      { do: X('Test distilled water.'), target: 't2', act: (K, o) => K.dip(o.p2, o.t2), ev: { type: 'dip', in: 't2' }, see: X('Green — pH 7. Neutral.') },
      { do: X('Test baking soda solution.'), target: 't3', act: (K, o) => K.dip(o.p3, o.t3), ev: { type: 'dip', in: 't3' }, see: X('Blue-green — pH about 8. Weakly basic.') },
      { do: X('Test milk of magnesia.'), target: 't4', act: (K, o) => K.dip(o.p4, o.t4), ev: { type: 'dip', in: 't4' }, see: X('Blue — pH about 10. Basic.') },
      { do: X('Test sodium hydroxide solution.'), target: 't5', act: (K, o) => K.dip(o.p5, o.t5), ev: { type: 'dip', in: 't5' }, see: X('Dark violet — pH about 13 to 14. Strongly basic.'),
        why: X('pH runs from 0 to 14. Below 7 is acidic, 7 is neutral, above 7 is basic. The further from 7, the stronger the acid or base.') },
    ],
    eq: { word: 'pH < 7 acidic · pH = 7 neutral · pH > 7 basic', sym: 'HCl ≈ 1 · Lemon ≈ 2.5 · Water = 7 · NaHCO₃ ≈ 8 · Mg(OH)₂ ≈ 10 · NaOH ≈ 14' },
    result: { obs: X('Each solution gives a different colour on pH paper.'), concl: X('Universal indicator shows how strong an acid or base is on the pH scale.'),
      safety: X('Use a fresh strip for each solution.'),
      viva: [{ q: X('pH of pure water?'), a: X('7.') }, { q: X('Which is more acidic: pH 2 or pH 5?'), a: X('pH 2.') }, { q: X('Name an antacid that is basic.'), a: X('Milk of magnesia.') }] },
  },
  {
    id: 'neutral', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('Neutralisation with phenolphthalein'),
    aim: X('To observe that an acid and a base cancel each other out.'),
    kind: X('Neutralisation reaction'),
    setup(K) {
      const rk = K.rack(-0.05, -0.62); const t = K.tube(rk, 2, 'naoh', 2);
      const ph = K.bottle('phenol', -0.45, -0.78, { dropper: true }); const acid = K.bottle('hcl', -0.3, -0.8, { dropper: true, ml: 25 });
      return { rk, t, ph, acid };
    },
    steps: [
      { do: X('Take 2 mL of dilute sodium hydroxide in a test tube and add two drops of phenolphthalein.'), target: 'ph', act: (K, o) => K.drops(o.ph, o.t, 2), ev: { type: 'drop', to: 't' },
        see: X('The solution turns pink.'), why: X('Phenolphthalein is colourless in acids and pink in bases.') },
      { do: X('Add dilute hydrochloric acid drop by drop and shake after each drop.'), target: 'acid', act: async (K, o) => { for (let i = 0; i < 4 && o.t.mix.pH() > 8.2; i++) { await K.drops(o.acid, o.t, 10); } }, ev: { type: 'drop', to: 't' },
        see: X('After enough acid is added the pink colour disappears.'), why: X('The acid neutralises the base. When no base is left, phenolphthalein becomes colourless again.') },
      { do: X('Now add a few drops of sodium hydroxide again (watch the colour).'), target: 't', act: async (K, o) => { o.t.mix.add('naoh', 0.6); }, see: X('The pink colour comes back.'), why: X('The solution is basic again.') },
    ],
    eq: { word: 'Sodium hydroxide + Hydrochloric acid → Sodium chloride + Water', sym: 'NaOH(aq) + HCl(aq) → NaCl(aq) + H₂O(l)' },
    result: { obs: X('Pink colour disappears when acid is added and comes back when base is added.'), concl: X('An acid and a base neutralise each other to form a salt and water.'),
      safety: X('Add the acid drop by drop.'),
      viva: [{ q: X('Colour of phenolphthalein in a base?'), a: X('Pink.') }, { q: X('What is neutralisation?'), a: X('The reaction of an acid with a base to give a salt and water.') }, { q: X('Name the salt formed here.'), a: X('Sodium chloride.') }] },
  },
  {
    id: 'carb_lime', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('Acid and sodium carbonate: testing CO₂'),
    aim: X('To show that acids react with carbonates to give carbon dioxide, which turns lime water milky.'),
    kind: X('Acid + metal carbonate'),
    setup(K) {
      const rk = K.rack(-0.32, -0.62); const t = K.tube(rk, 3, null, 0, { boiling: true });
      const lw = K.add(K.A.testTube(), 0.06, -0.62); K.lab.fill(lw, 'limewater', 8); lw.name = X('Lime water'); lw.tag = 'Ca(OH)₂';
      const nc = K.solid('na2co3', -0.1, -0.5, { amount: 0.8 }); const acid = K.bottle('hcl', -0.62, -0.8);
      return { rk, t, lw, nc, acid };
    },
    steps: [
      { do: X('Put about 0.5 g of sodium carbonate in a boiling tube.'), target: 'nc', act: (K, o) => K.addSolid(o.nc, o.t), ev: { type: 'add', to: 't' }, see: X('A white powder is in the tube.') },
      { do: X('Fit a cork with a delivery tube, and dip the other end in lime water.'), target: 'lw', act: async (K, o) => { K.pipe(o.t, o.lw); await K.sleep(0.4); }, see: X('The delivery tube now leads into clear lime water.') },
      { do: X('Add about 2 mL of dilute hydrochloric acid to the sodium carbonate.'), target: 'acid', act: async (K, o) => { o.t.closed = false; await K.pour(o.acid, o.t, 2); o.t.closed = true; }, ev: { type: 'pouring', to: 't', ml: 1 },
        see: X('Brisk fizzing (effervescence) as a gas is given off.'), why: X('The acid reacts with the carbonate and carbon dioxide gas is released.') },
      { do: X('Watch the lime water.'), target: 'lw', act: (K) => K.wait(6), see: X('Bubbles pass through the lime water and it turns milky.'),
        why: X('Carbon dioxide reacts with lime water (calcium hydroxide) to form white, insoluble calcium carbonate.') },
    ],
    eq: { word: 'Sodium carbonate + Hydrochloric acid → Sodium chloride + Water + Carbon dioxide', sym: 'Na₂CO₃(s) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)↑  ·  Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O' },
    result: { obs: X('Brisk effervescence; lime water turns milky.'), concl: X('Acids react with metal carbonates to give a salt, water and carbon dioxide.'),
      safety: X('Make sure the cork fits well and add only a little acid.'),
      viva: [{ q: X('Which gas turns lime water milky?'), a: X('Carbon dioxide.') }, { q: X('What makes the milkiness?'), a: X('Calcium carbonate, which does not dissolve.') }, { q: X('What happens if excess CO₂ is passed?'), a: X('The milkiness disappears as soluble calcium hydrogencarbonate forms.') }] },
  },
  {
    id: 'cuso4_heat', cls: 10, ch: X('Ch 2 · Acids, Bases and Salts'), title: X('Water of crystallisation in copper sulphate'),
    aim: X('To show that blue copper sulphate crystals contain water, and get their colour back with water.'),
    kind: X('Water of crystallisation'),
    setup(K) {
      const rk = K.rack(-0.3, -0.62); const t = K.tube(rk, 3, null, 0, { boiling: true });
      const cr = K.solid('cuso4x', 0.0, -0.56); const lamp = K.lamp(0.28, -0.6); K.holder(0.1, -0.45);
      const w = K.bottle('water', -0.55, -0.8, { dropper: true }); w.name = X('Water (dropper)');
      return { rk, t, cr, lamp, w };
    },
    steps: [
      { do: X('Put a few blue copper sulphate crystals in a dry boiling tube.'), target: 'cr', act: (K, o) => K.addSolid(o.cr, o.t), ev: { type: 'add', to: 't' }, see: X('The crystals are bright blue.') },
      { do: X('Light the spirit lamp.'), target: 'lamp', act: (K, o) => K.light(o.lamp), ev: { type: 'lit' } },
      { do: X('Heat the tube gently.'), target: 't', act: (K, o) => K.heat(o.t, o.lamp, 18, { tilt: 0.5 }), ev: { type: 'heating', v: 't', sec: 10 },
        see: X('Water droplets collect on the cooler part of the tube and the crystals turn white.'),
        why: X('Each unit of copper sulphate holds five water molecules (CuSO₄·5H₂O). Heating drives this water out; without it, copper sulphate is white.') },
      { do: X('Put out the flame, let the tube cool, and add 2–3 drops of water to the white powder.'), target: 'w', act: async (K, o) => { K.extinguish(o.lamp); await K.drops(o.w, o.t, 3); }, ev: { type: 'drop', to: 't' },
        see: X('The white powder turns blue again and the tube becomes warm.'), why: X('Copper sulphate takes back its water of crystallisation, so the blue colour returns.') },
    ],
    eq: { word: 'Blue copper sulphate ⇌ White copper sulphate + Water', sym: 'CuSO₄·5H₂O (blue) ⇌ CuSO₄ (white) + 5H₂O' },
    result: { obs: X('Blue crystals turn white on heating with water drops on the tube; adding water makes them blue again.'), concl: X('Copper sulphate crystals contain water of crystallisation, which gives them their blue colour.'),
      safety: X('Heat gently and keep the mouth of the tube pointing away.'),
      viva: [{ q: X('Formula of blue copper sulphate?'), a: X('CuSO₄·5H₂O.') }, { q: X('Why does it turn white?'), a: X('It loses its water of crystallisation.') }, { q: X('Is the change reversible?'), a: X('Yes — adding water turns it blue again.') }] },
  },
];

EXPERIMENTS.push(...EXPERIMENTS2, ...EXPERIMENTS3, ...EXPERIMENTS4, ...EXPERIMENTS5, ...EXPERIMENTS6, ...EXPERIMENTS_P1, ...EXPERIMENTS_P2, ...EXPERIMENTS_P3, ...EXPERIMENTS_P4, ...EXPERIMENTS_P5, ...EXPERIMENTS_P6, ...EXPERIMENTS_P7, ...EXPERIMENTS_P8, ...EXPERIMENTS_P9, ...EXPERIMENTS_P10, ...EXPERIMENTS_P11, ...EXPERIMENTS_FREE);
EXPERIMENTS.sort((a, b) => a.cls - b.cls); // stable: keeps the book order inside each class
export const BY_ID = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));
// a class's experiments in book order: chapter by chapter (older-NCERT chapters after the current book), then any from other classes
// the order of experiments inside a chapter, as in the book (others keep the order they were added in)
const ORD = { p10_reflection: 1, p10_mirror_f: 2, p10_mirror_images: 3, p10_convex_mirror: 4, p10_coin_bowl: 5, p10_slab: 6, p10_lens_f: 7, p10_lens_images: 8, p10_concave_lens: 9, p10_prism: 1, p10_dispersion: 2, p10_ohm: 1, p10_components: 2, p10_resistance: 3, p10_series_iv: 4, p10_series: 5, p10_parallel: 6 };
const chNum = (e) => { if (e.id.startsWith('open_')) return -1; const m = /^Ch (\d+)/.exec(e.ch.en); return m ? +m[1] : 100; }; // the open lab comes first
export const subjOf = (e) => e.subj || 'chemistry'; // every experiment belongs to one subject (chemistry when not set)
export const hasSubject = (sub) => EXPERIMENTS.some((e) => subjOf(e) === sub);
export function classGroups(cls, sub = 'chemistry') {
  const own = EXPERIMENTS.filter((e) => (e.cls === cls || (cls && e.id.startsWith('open_'))) && subjOf(e) === sub).map((e, i) => ({ e, i, n: chNum(e), c: e.ch.en }));
  own.sort((a, b) => a.n - b.n || (a.c < b.c ? -1 : a.c > b.c ? 1 : 0) || (ORD[a.e.id] ?? 50) - (ORD[b.e.id] ?? 50) || a.i - b.i);
  const groups = []; for (const o of own) { const g = groups[groups.length - 1]; if (g && g.key === o.c) g.items.push(o.e); else groups.push({ key: o.c, items: [o.e] }); }
  const also = EXPERIMENTS.filter((e) => e.cls !== cls && !e.id.startsWith('open_') && subjOf(e) === sub && e.also && e.also.includes(cls)); if (also.length) groups.push({ key: null, items: also });
  return groups;
}
export const classOrder = (cls, sub = 'chemistry') => (cls ? classGroups(cls, sub).flatMap((g) => g.items) : EXPERIMENTS.filter((e) => subjOf(e) === sub));
