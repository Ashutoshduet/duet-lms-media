// Chemistry experiments, batch 5: the remaining Class 9 book and lab-manual experiments (and iron + sulphur from Class 8):
// mixtures and compounds, colloids, crystallisation, separating funnel, sublimation + filtration + evaporation, distillation,
// centrifuging milk, dye from ink, conservation of mass (twice), melting and boiling points, and the CBSE set of five changes.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const C8N = 'Ch 8 · Nature of Matter: Elements, Compounds, and Mixtures', C9S = 'Ch 5 · Exploring Mixtures and their Separation', C9A = 'Ch 9 · Atomic Foundations of Matter';
const C9O = 'Is Matter Around Us Pure? (older NCERT, Class 9)', C9L = 'NCERT Lab Manual, Class 9', C9P = 'CBSE practical, Class 9';
const until = async (K, test, max = 30) => { let t = 0; while (!test() && t < max) { await K.sleep(0.25); t += 0.25; } };
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
// stand a vessel inside a bath that may sit on a tripod; it then follows the bath's temperature
async function intoBathAt(K, v, bath) { const b = bath.g.localToWorld(V(K, 0, bath.inner[0].y + 0.002, 0)); await K.moveTo(v, b.clone().setY(b.y + 0.1), new K.THREE.Quaternion(), 0.8); await K.tween(0.6, (k) => { v.g.position.y = b.y + 0.1 * (1 - k); }); v.bath = bath; v.home = { p: v.g.position.clone(), q: v.g.quaternion.clone() }; K.lab.emit('bath', { v: v.id, in: bath.id }); }
// a thermometer that stays in a vessel and shows its temperature, with a read-out above it
function thermoIn(K, v, local, o = {}) {
  const th = K.add(K.A.thermometer(), 0, 0); th.noGrab = true; const pos = () => v.g.localToWorld(local.clone());
  th.update = () => { th.setTemp(v.mix.temp); th.g.position.copy(pos()); th.g.quaternion.identity(); if (o.tilt) th.g.rotation.z = o.tilt; };
  const ro = K.add(K.A5.readout(() => v.mix.temp, '°C', () => th.g.localToWorld(V(K, 0.03, 0.24, 0))), 0, 0); return { th, ro };
}

export const EXPERIMENTS5 = [
  // ===================================================== Class 8: mixture and compound
  {
    id: 'iron_sulphur', cls: 8, also: [9], ch: X(C8N), title: X('Iron and sulphur: a mixture and a compound'),
    aim: X('To make a mixture of iron filings and sulphur and a compound (iron sulphide) from them, and to tell them apart with a magnet and with dilute acid.'),
    kind: X('Mixture and compound'),
    setup(K) {
      const fe = K.solid('filings', -0.38, -0.5), s = K.solid('spow', -0.26, -0.5); const rod = K.rod(-0.14, -0.44);
      const dish = K.add(K.A.chinaDish(), -0.06, -0.68); const tp = K.tripod(0.14, -0.68); const bn = K.burner(0.36, -0.64);
      const mg = K.place(K.A3.magnet(), 0.22, -0.42); const rk = K.rack(-0.32, -0.76); const t1 = K.tube(rk, 1); const t2 = K.tube(rk, 4);
      t1.name = N('Test tube 1 (sample A)', 'परखनली 1 (नमूना A)', 'Test tube 1 (sample A)'); t2.name = N('Test tube 2 (sample B)', 'परखनली 2 (नमूना B)', 'Test tube 2 (sample B)');
      const hcl = K.bottle('hcl', -0.08, -0.82); const lamp = K.lamp(0.42, -0.8); const sp = K.splint(0.05, -0.44);
      const pb = K.add(K.A.strip(0xf3f2ea, { name: N('Lead acetate paper (moist)', 'लेड ऐसीटेट पत्र (गीला)', 'Lead acetate paper (geela)') }), 0.14, -0.44); pb.g.rotation.set(-Math.PI / 2, 0, 0.3); pb.g.position.y = BENCH_Y + 0.001; pb.home = { p: pb.g.position.clone(), q: pb.g.quaternion.clone() };
      return { fe, s, rod, dish, tp, bn, mg, rk, t1, t2, hcl, lamp, sp, pb };
    },
    steps: [
      { do: X('Mix the iron filings and the sulphur powder well on the watch glass with a glass rod. This is sample A.'), target: 'rod', act: async (K, o) => { o.A = await K.mixPowders(o.fe, o.s, o.rod, 'femix'); }, ev: { type: 'mixed' },
        see: X('You can still see grey bits of iron and yellow bits of sulphur side by side. The mixture is not the same everywhere.') },
      { do: X('Spread a little of sample A on a sheet of paper and move the magnet over it.'), target: 'mg', act: async (K, o) => { o.mixSheet = K.place(K.A3.filingsMix({ baseColor: 0xe8c838, baseTex: 'sulphur', n: 220, name: N('Sample A on paper', 'कागज़ पर नमूना A', 'Kaagaz par sample A') }), 0.3, -0.5); await K.sleep(0.4); await K.sweepMagnet(o.mg, o.mixSheet, 3); },
        see: X('The iron filings jump up and cling to the magnet. The yellow sulphur is left behind.'), why: X('In a mixture each part keeps its own properties: iron is still magnetic, sulphur is not.') },
      { do: X('Put half of sample A in the china dish, place it on the tripod and heat it strongly (time-lapse).'), target: 'dish',
        act: async (K, o) => { await K.spoonful(o.A, o.dish); await K.spoonful(o.A, o.dish); await K.onTripod(o.dish, o.tp, o.bn); await K.light(o.bn); await K.wait(12, 22); }, ev: { type: 'lit' },
        see: X('One spot starts to glow red. The glow spreads through the whole mass by itself, with a little blue flame and a choking smell. A black solid is left: sample B.'),
        why: X('Iron and sulphur react to form a new substance, iron sulphide (FeS). The reaction gives out so much heat that it keeps going by itself.') },
      { do: X('Turn off the burner, let the dish cool, and move the magnet over sample B.'), target: 'mg', act: async (K, o) => { await K.extinguish(o.bn); const c = o.dish.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.mg, c.clone().add(V(K, 0, 0.02, 0)), null, 1); await K.sleep(1.6); await K.home(o.mg, 0.8); },
        see: X('Nothing is pulled up. Sample B is not attracted by the magnet.'), why: X('Iron sulphide is a compound with its own new properties; it is not magnetic like iron.') },
      { do: X('Put a little of sample A in test tube 1 and add some dilute hydrochloric acid.'), target: 't1', act: async (K, o) => { await K.spoonful(o.A, o.t1); await K.pour(o.hcl, o.t1, 6); }, ev: { type: 'pouring', to: 't1', ml: 3 },
        see: X('It fizzes: a colourless gas with no smell. Yellow sulphur stays at the bottom.') },
      { do: X('Light the lamp, light a splint and bring it to the mouth of test tube 1.'), target: 'sp', act: async (K, o) => { await K.light(o.lamp); await K.splintTest(o.sp, o.t1, o.lamp); }, ev: { type: 'pop' },
        see: X('The gas burns with a pop: it is hydrogen.'), why: X('The iron in the mixture reacts with the acid and gives hydrogen; the sulphur does not react.') },
      { do: X('Put a little of sample B in test tube 2, add dilute hydrochloric acid and hold the moist lead acetate paper at its mouth.'), target: 't2',
        act: async (K, o) => { const B = o.dish.solids.find((s) => s.chem === 'fes') || o.dish.solids[0]; await K.spoonful(B, o.t2); await K.pour(o.hcl, o.t2, 6); await K.sleep(1); await K.paperAt(o.pb, o.t2, 2.5); }, ev: { type: 'paper', v: 't2' },
        see: X('It fizzes and gives a gas that smells of rotten eggs. The lead acetate paper turns black.'), why: X('Iron sulphide reacts with the acid to give hydrogen sulphide (H₂S), a different gas. A compound behaves differently from the mixture it was made from.') },
    ],
    eq: { word: 'Iron + sulphur —heat→ iron sulphide · iron + hydrochloric acid → iron chloride + hydrogen · iron sulphide + hydrochloric acid → iron chloride + hydrogen sulphide', sym: 'Fe + S → FeS · Fe + 2HCl → FeCl₂ + H₂ · FeS + 2HCl → FeCl₂ + H₂S' },
    result: { obs: X('Sample A (mixture) showed iron and sulphur separately; the magnet picked out the iron; with acid it gave hydrogen (pop). Sample B (compound) was a uniform black solid, not magnetic, and with acid gave hydrogen sulphide (rotten-egg smell, paper turned black).'),
      concl: X('In a mixture the parts keep their own properties and can be separated simply. In a compound the elements combine chemically into a new substance with new properties.'),
      safety: X('Heat in a well-ventilated room; the fumes are irritating. Hydrogen sulphide is poisonous: do not smell it directly. Handle the acid carefully.'),
      viva: [{ q: X('Which sample is attracted by a magnet?'), a: X('The mixture (A), because it still contains free iron.') }, { q: X('Which gas comes from the compound with dilute acid?'), a: X('Hydrogen sulphide, which smells of rotten eggs.') }, { q: X('Give two differences between a mixture and a compound.'), a: X('A mixture keeps the properties of its parts and can be separated physically; a compound has new properties and a fixed composition.') }] },
  },
  // ===================================================== Class 9: colloid
  {
    id: 'colloid_s', cls: 9, ch: X(C9S), title: X('Colloid, solution and suspension'),
    aim: X('To prepare a colloid of sulphur, a true solution of salt and a suspension of chalk, and to tell them apart by light, filtering and settling.'),
    kind: X('True solution, colloid and suspension'),
    setup(K) {
      const bA = K.beaker(-0.38, -0.64, 'thio', 40, 100); bA.name = N('Beaker A: sodium thiosulphate solution', 'बीकर A: सोडियम थायोसल्फ़ेट विलयन', 'Beaker A: sodium thiosulphate solution');
      const bB = K.beaker(-0.22, -0.64, 'water', 40, 100); bB.name = N('Beaker B: water', 'बीकर B: पानी', 'Beaker B: paani'); const bC = K.beaker(-0.06, -0.64, 'water', 40, 100); bC.name = N('Beaker C: water', 'बीकर C: पानी', 'Beaker C: paani');
      const hcl = K.bottle('hcl', -0.4, -0.82); const salt = K.solid('salt', -0.24, -0.47); const chalk = K.solid('chalk', -0.1, -0.47); const rod = K.rod(0.02, -0.44); const tc = K.place(K.A.torch(), 0.1, -0.5);
      const fA = K.beaker(0.2, -0.7, null, 0, 100); fA.name = N('Filtrate of A', 'A का निस्यंद', 'A ka filtrate'); const fC = K.beaker(0.38, -0.7, null, 0, 100); fC.name = N('Filtrate of C', 'C का निस्यंद', 'C ka filtrate');
      const fuA = K.filterOver(fA), fuC = K.filterOver(fC);
      return { bA, bB, bC, hcl, salt, chalk, rod, tc, fA, fC, fuA, fuC };
    },
    steps: [
      { do: X('Add some dilute hydrochloric acid to beaker A (sodium thiosulphate solution) and stir.'), target: 'hcl', act: async (K, o) => { await K.pour(o.hcl, o.bA, 6); await K.stir(o.rod, o.bA, 2); }, ev: { type: 'pour', to: 'bA' },
        see: X('At first nothing seems to happen.') },
      { do: X('Wait and watch beaker A (time-lapse).'), target: 'bA', act: (K) => K.wait(10, 70),
        see: X('The clear liquid slowly turns milky, pale yellow and translucent.'), why: X('The reaction makes sulphur as extremely tiny particles that stay spread through the water: a colloid.') },
      { do: X('Dissolve a spoonful of salt in beaker B.'), target: 'salt', act: (K, o) => K.dissolveIn(o.salt, o.bB), ev: { type: 'spoon', v: 'bB' }, see: X('The salt disappears; the liquid stays clear. This is a true solution.') },
      { do: X('Stir a spoonful of chalk powder into beaker C.'), target: 'chalk', act: async (K, o) => { await K.spoonful(o.chalk, o.bC); await K.stir(o.rod, o.bC, 3); }, ev: { type: 'stir', v: 'bC' }, see: X('The water turns cloudy white; you can see chalk particles. This is a suspension.') },
      { do: X('Shine the torch through each beaker from the side.'), target: 'tc', act: async (K, o) => { await K.shine(o.tc, o.bA, 2); await K.shine(o.tc, o.bB, 2); await K.shine(o.tc, o.bC, 2); await K.home(o.tc, 0.8); }, ev: { type: 'shine' },
        see: X('The path of the light can be seen in A (colloid) and C (suspension), but not in B (solution).'), why: X('Colloid and suspension particles are big enough to scatter light (the Tyndall effect); dissolved particles are too small.') },
      { do: X('Filter A and C.'), target: 'bA', act: async (K, o) => { await K.pourSlow(o.bA, o.fuA, 25); await K.pourSlow(o.bC, o.fuC, 25); await K.wait(8, 6); }, ev: { type: 'pour', to: 'fuA' },
        see: X('The colloid passes through the filter paper and the filtrate is still milky. The chalk stays on the paper as a white residue and its filtrate is clear.'), why: X('Colloid particles are smaller than the pores of the filter paper; suspension particles are bigger.') },
      { do: X('Leave the beakers undisturbed for a while (time-lapse).'), target: 'bC', act: (K) => K.wait(10, 300),
        see: X('The chalk in C settles at the bottom. The colloid in A does not settle; the salt solution stays clear.') },
    ],
    eq: { word: 'Sodium thiosulphate + hydrochloric acid → sodium chloride + sulphur (colloid) + sulphur dioxide + water', sym: 'Na₂S₂O₃ + 2HCl → 2NaCl + S↓ (colloid) + SO₂ + H₂O' },
    result: { obs: X('A (colloid): milky pale yellow, scattered light, passed through filter paper, did not settle. B (solution): clear, no scattering, nothing on the filter. C (suspension): cloudy, scattered light, left residue, settled.'),
      concl: X('A true solution is clear and its particles are too small to scatter light. A colloid scatters light but its particles do not settle and pass through filter paper. A suspension scatters light, is filtered out and settles.'),
      safety: X('Sulphur dioxide has a choking smell: do the reaction in a ventilated room. Handle the acid carefully.'),
      viva: [{ q: X('What is the Tyndall effect?'), a: X('Scattering of a beam of light by colloid (or suspension) particles, so the path of light becomes visible.') }, { q: X('Can a colloid be separated by filtration?'), a: X('No, its particles pass through filter paper.') }, { q: X('Give one example each of a colloid and a suspension.'), a: X('Milk is a colloid; muddy water (or chalk in water) is a suspension.') }] },
  },
  {
    id: 'crystallise', cls: 9, ch: X(C9S), title: X('Pure copper sulphate crystals by crystallisation'),
    aim: X('To obtain pure crystals of copper sulphate from an impure sample by crystallisation.'),
    kind: X('Separation by crystallisation'),
    setup(K) {
      const tp = K.tripod(0.06, -0.68); const bn = K.burner(0.32, -0.64); const bath = K.beaker(-0.2, -0.7, 'water', 220, 500); bath.name = N('Water bath', 'जल ऊष्मक', 'Water bath');
      const b = K.beaker(-0.38, -0.56, 'water', 25, 100); b.name = N('Beaker with 25 mL water', '25 mL पानी वाला बीकर', '25 mL paani wala beaker');
      const cs = K.solid('cuso4i', -0.24, -0.47); const rod = K.rod(-0.12, -0.44); const acid = K.bottle('h2so4', -0.44, -0.8, { dropper: true });
      const c = K.beaker(0.36, -0.5, null, 0, 100); c.name = N('Clean beaker', 'साफ़ बीकर', 'Saaf beaker'); c.coolLapse = true; const fu = K.filterOver(c); K.A5.crystalBed(c);
      const wg = K.add(K.A.watchGlass(), 0.42, -0.72); wg.name = N('Watch glass (cover)', 'वॉच ग्लास (ढक्कन)', 'Watch glass (dhakkan)'); const waste = K.beaker(0.22, -0.82, null, 0, 100); waste.name = N('Beaker for the liquid', 'द्रव के लिए बीकर', 'Liquid ke liye beaker');
      return { tp, bn, bath, b, cs, rod, acid, c, fu, wg, waste };
    },
    steps: [
      { do: X('Put the water bath on the tripod and stand the beaker of water in it. Add one drop of dilute sulphuric acid and light the burner.'), target: 'bath',
        act: async (K, o) => { await K.onTripod(o.bath, o.tp, o.bn); await intoBathAt(K, o.b, o.bath); await K.drops(o.acid, o.b, 1); await K.light(o.bn); await K.wait(8, 30); }, ev: { type: 'lit' },
        see: X('The water bath and the water in the beaker get hot.'), why: X('A drop of acid stops the copper sulphate from reacting with water (hydrolysis), so the crystals come out clear.') },
      { do: X('Add impure copper sulphate a spoonful at a time, stirring, until no more dissolves.'), target: 'cs',
        act: async (K, o) => { for (let i = 0; i < 9 && !o.b.saturated; i++) { await K.spoonful(o.cs, o.b); await K.stir(o.rod, o.b, 2.4); } await K.stir(o.rod, o.b, 2); }, ev: { type: 'spoon', v: 'b' },
        see: X('A deep blue solution forms. In the end some crystals stay undissolved and the liquid looks a little cloudy with specks of dirt: the hot solution is saturated.') },
      { do: X('Filter the hot solution into the clean beaker.'), target: 'b', act: async (K, o) => { o.b.bath = null; await K.pourSlow(o.b, o.fu, o.b.ml); await K.wait(8, 8); }, ev: { type: 'pour', to: 'fu' },
        see: X('A clear, deep blue filtrate collects in the beaker. The insoluble dirt stays on the filter paper.') },
      { do: X('Cover the beaker with the watch glass and leave it to cool slowly, undisturbed (overnight, time-lapse).'), target: 'wg',
        act: async (K, o) => { await K.extinguish(o.bn); const m = o.c.mouthWorld(V(K, 0, 0, 0)); o.fu.g.visible = false; o.fu.stand.g.visible = false; o.fu.drainTo = null; await K.moveTo(o.wg, m.clone().add(V(K, 0, 0.002, 0)), null, 0.9); await K.wait(12, 500); }, ev: { type: 'crystals' },
        see: X('As the solution cools, blue crystals appear and grow on the bottom of the beaker. The liquid above becomes a paler blue.'), why: X('Hot water can hold more copper sulphate than cold water. On cooling, the extra copper sulphate comes out as pure crystals; the impurities stay in the liquid.') },
      { do: X('Remove the watch glass, pour off the remaining liquid and look at the crystals.'), target: 'c', act: async (K, o) => { await K.home(o.wg, 0.8); await K.pour(o.c, o.waste, o.c.ml - 0.5); }, ev: { type: 'pour', from: 'c' },
        see: X('Bright blue, clear crystals with flat faces and sharp edges are left.') },
    ],
    eq: { word: 'Hot saturated copper sulphate solution —cool→ pure copper sulphate crystals (with water of crystallisation)', sym: 'Cu²⁺(aq) + SO₄²⁻(aq) + 5H₂O(l) → CuSO₄·5H₂O(s)' },
    result: { obs: X('A deep blue saturated solution formed on heating; impurities were left on the filter paper; on slow cooling, blue crystals with flat faces grew.'),
      concl: X('Crystallisation separates a pure solid from its solution: a hot saturated solution gives pure crystals on cooling, while the impurities remain behind.'),
      safety: X('Copper sulphate is harmful if swallowed. Handle the hot beaker with tongs or a cloth. Only the teacher should add the sulphuric acid.'),
      viva: [{ q: X('Why is crystallisation better than evaporating the solution to dryness?'), a: X('Impurities stay in the solution, and some solids decompose or char on strong heating.') }, { q: X('What is a saturated solution?'), a: X('One in which no more solute can dissolve at that temperature.') }, { q: X('Why should the solution cool slowly?'), a: X('Slow cooling gives bigger, purer crystals.') }] },
  },
  {
    id: 'sep_funnel', cls: 9, ch: X(C9S), title: X('Separating oil and water'),
    aim: X('To separate two liquids that do not mix (mustard oil and water) using a separating funnel.'),
    kind: X('Separation of immiscible liquids'),
    setup(K) {
      const st = K.add(K.A5.labStand(0.33), 0.0, -0.66); st.ring(0.2, 0.03, 0, 0.05); const sf = K.add(K.A5.sepFunnel(), 0.0, -0.61, { y: BENCH_Y + 0.098 });
      const b1 = K.beaker(0.0, -0.61, null, 0, 100); b1.name = N('Beaker 1 (for water)', 'बीकर 1 (पानी के लिए)', 'Beaker 1 (paani ke liye)'); sf.drainTo = b1;
      const b2 = K.beaker(0.22, -0.56, null, 0, 100); b2.name = N('Beaker 2 (for oil)', 'बीकर 2 (तेल के लिए)', 'Beaker 2 (tel ke liye)');
      const w = K.beaker(-0.3, -0.56, 'water', 30, 100); w.name = N('Water', 'पानी', 'Paani'); const oil = K.beaker(-0.16, -0.48, 'moil', 12, 50); oil.name = N('Mustard oil', 'सरसों का तेल', 'Sarson ka tel');
      return { st, sf, b1, b2, w, oil };
    },
    steps: [
      { do: X('Check that the stopcock is closed, then pour the water into the separating funnel.'), target: 'w', act: (K, o) => K.pour(o.w, o.sf, 20), ev: { type: 'pour', to: 'sf' }, see: X('The water fills the lower part of the funnel.') },
      { do: X('Now pour in the mustard oil.'), target: 'oil', act: async (K, o) => { await K.pour(o.oil, o.sf, 6); o.sf.sepK = 0; }, ev: { type: 'pour', from: 'oil' }, see: X('The oil breaks into drops and the liquid looks cloudy yellow.') },
      { do: X('Put the stopper on the funnel and let it stand undisturbed (time-lapse).'), target: 'sf', act: async (K, o) => { await K.stopper(o.sf, true); await K.wait(8, 10); },
        see: X('Two separate layers form: yellow mustard oil on top, clear water below, with a sharp boundary.'), why: X('Oil and water do not mix (they are immiscible). Oil is lighter (less dense) than water, so it floats on top.') },
      { do: X('Remove the stopper and open the stopcock slowly. Let the water run into beaker 1, and close the stopcock when the water has run out.'), target: 'sf',
        act: async (K, o) => { await K.stopper(o.sf, false); await K.cock(o.sf, true); const l0 = K.app.chem.lapse; K.app.chem.lapse = 4; await K.drainUntil(o.sf, () => o.sf.waterOut, 40); K.app.chem.lapse = l0; await K.cock(o.sf, false); }, ev: { type: 'cock_close', v: 'sf' },
        see: X('The water runs out first and the boundary moves down. Only the oil is left in the funnel.'), why: X('The stopper is removed so that air can get in and the liquid can flow out.') },
      { do: X('Put beaker 2 under the funnel and run out the oil.'), target: 'b2',
        act: async (K, o) => { await K.moveTo(o.b1, V(K, -0.18, BENCH_Y + 0.0008, -0.5), null, 0.8); o.b1.home = { p: o.b1.g.position.clone(), q: o.b1.g.quaternion.clone() }; const tip = o.sf.g.localToWorld(V(K, 0, 0, 0)); await K.moveTo(o.b2, V(K, tip.x, BENCH_Y + 0.0008, tip.z), null, 0.8); o.b2.home = { p: o.b2.g.position.clone(), q: o.b2.g.quaternion.clone() }; o.sf.drainTo = o.b2; await K.cock(o.sf, true); const l0 = K.app.chem.lapse; K.app.chem.lapse = 4; await K.drainUntil(o.sf, () => o.sf.ml < 0.05, 30); K.app.chem.lapse = l0; await K.cock(o.sf, false); },
        ev: { type: 'cock_close', v: 'sf' }, see: X('The oil is collected separately in beaker 2.') },
    ],
    eq: { word: 'Oil and water do not mix: the lighter liquid (oil) floats; the heavier (water) runs out first', sym: 'density: mustard oil ≈ 0.91 g/mL < water 1.00 g/mL' },
    result: { obs: X('Oil and water formed two layers, oil on top. The water ran out first through the stopcock, then the oil was collected separately.'),
      concl: X('Two immiscible liquids can be separated with a separating funnel, because they form layers according to their densities.'),
      safety: X('Open the stopcock slowly. Remove the stopper before draining.'),
      viva: [{ q: X('Why does oil float on water?'), a: X('It is less dense than water and does not mix with it.') }, { q: X('Why is the stopper removed before opening the stopcock?'), a: X('So that air can enter and the liquid can flow out freely.') }, { q: X('Give one use of this method.'), a: X('Separating oil from water, or iron from its ore slag in a blast furnace (lighter slag floats on molten iron).') }] },
  },
  {
    id: 'sand_salt_nh4cl', cls: 9, ch: X(C9L), title: X('Separating sand, salt and ammonium chloride'),
    aim: X('To separate a mixture of sand, common salt and ammonium chloride by sublimation, dissolving, filtration and evaporation.'),
    kind: X('Separation of a mixture of three solids'),
    setup(K) {
      const tp = K.tripod(0.08, -0.68); const bn = K.burner(0.32, -0.64);
      const dish = K.add(K.A.chinaDish(), -0.2, -0.64); dish.name = N('China dish with the mixture', 'मिश्रण वाली चीनी मिट्टी की प्याली', 'Mixture wali china dish');
      const sand = K.lab.add(K.A.granules(0xd2b080, { n: 14, metal: 0, rough: 1, tex: 'sand' }), 0, 0); sand.chem = 'sand'; sand.amount = 1; K.lab.putSolid(sand, dish); sand.g.scale.set(1.5, 0.6, 1.5);
      const salt = K.lab.add(K.A.heap(0xfafafa, { tex: 'salt', r: 0.008, h: 0.005 }), 0, 0); salt.chem = 'salt'; salt.amount = 1; K.lab.putSolid(salt, dish); salt.g.position.x += 0.008;
      const ac = K.lab.add(K.A.heap(0xf7f7f4, { tex: 'nh4cl', r: 0.008, h: 0.005 }), 0, 0); ac.chem = 'nh4cl'; ac.amount = 1; K.lab.putSolid(ac, dish); ac.g.position.x -= 0.008;
      const fn = K.add(K.A.funnel(), -0.42, -0.66); const w = K.beaker(-0.4, -0.48, 'water', 60, 100); w.name = N('Water', 'पानी', 'Paani'); const rod = K.rod(-0.26, -0.44);
      const fl = K.beaker(0.38, -0.52, null, 0, 100); fl.name = N('Beaker for the filtrate', 'निस्यंद के लिए बीकर', 'Filtrate ke liye beaker'); const fu = K.filterOver(fl);
      const dish2 = K.add(K.A.chinaDish(), 0.2, -0.46); dish2.name = N('Second china dish', 'दूसरी चीनी मिट्टी की प्याली', 'Doosri china dish');
      return { tp, bn, dish, sand, salt, ac, fn, w, rod, fl, fu, dish2 };
    },
    steps: [
      { do: X('Put the china dish with the mixture on the tripod. Cover it with an upside-down funnel and plug the funnel stem with cotton.'), target: 'fn',
        act: async (K, o) => { await K.onTripod(o.dish, o.tp, o.bn); const m = o.dish.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.fn, m.clone().add(V(K, 0, 0.097 - 0.006, 0)), new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(Math.PI, 0, 0)), 1); o.fn.cotton.visible = true; o.dish.funnel = o.fn; },
        see: X('The mixture is covered by the funnel.') },
      { do: X('Light the burner and heat gently (time-lapse).'), target: 'bn', act: async (K, o) => { await K.light(o.bn); await K.wait(12, 8); }, ev: { type: 'lit' },
        see: X('White fumes rise and a white solid collects on the cool inside of the funnel.'), why: X('Ammonium chloride sublimes: it turns straight into vapour and back into solid on the cool funnel. Sand and salt do not sublime.') },
      { do: X('Turn off the burner, let it cool and lift off the funnel. Keep the white solid: it is ammonium chloride.'), target: 'fn', act: async (K, o) => { await K.extinguish(o.bn); o.dish.funnel = null; await K.moveTo(o.fn, V(K, -0.42, BENCH_Y + 0.098, -0.7), null, 1); },
        see: X('The funnel is coated inside with white ammonium chloride. Sand and salt are left in the dish.') },
      { do: X('Add water to the dish and stir.'), target: 'w', act: async (K, o) => { await K.pour(o.w, o.dish, 40); await K.stir(o.rod, o.dish, 4); }, ev: { type: 'stir', v: 'dish' },
        see: X('The salt dissolves; the sand does not.') },
      { do: X('Filter the mixture.'), target: 'dish', act: async (K, o) => { await K.pourSlow(o.dish, o.fu, o.dish.ml); await K.wait(8, 8); }, ev: { type: 'pour', to: 'fu' },
        see: X('The sand stays on the filter paper. A clear salt solution (filtrate) collects in the beaker.') },
      { do: X('Pour the filtrate into the second china dish and heat it until the water evaporates (time-lapse).'), target: 'dish2',
        act: async (K, o) => { await K.moveTo(o.dish, V(K, -0.22, BENCH_Y + 0.0008, -0.5), null, 0.8); o.dish.onTripod = null; o.dish.home = { p: o.dish.g.position.clone(), q: o.dish.g.quaternion.clone() }; await K.pour(o.fl, o.dish2, o.fl.ml); await K.onTripod(o.dish2, o.tp, o.bn); o.dish2.onDry = () => { const c = K.add(K.A.crystals(0xffffff, { tex: 'salt', n: 36 }), 0, 0); K.lab.putSolid(c, o.dish2); c.g.scale.set(2, 0.35, 2); c.name = X('Salt crust'); }; await K.light(o.bn); await K.wait(14, 40); },
        see: X('The water boils away and white salt is left in the dish.') },
    ],
    eq: { word: 'Ammonium chloride: sublimation · salt: dissolves in water, recovered by evaporation · sand: insoluble, stays on the filter paper', sym: 'NH₄Cl(s) ⇌ NH₃(g) + HCl(g) · NaCl(aq) —Δ→ NaCl(s)' },
    result: { obs: X('Ammonium chloride collected on the funnel; sand stayed on the filter paper; salt was left in the dish after evaporation.'),
      concl: X('A mixture can be separated by using the different properties of its parts: sublimation, solubility in water, filtration and evaporation.'),
      safety: X('Heat gently and do not breathe the fumes. Do not touch the hot dish.'),
      viva: [{ q: X('Which part is removed first, and how?'), a: X('Ammonium chloride, by sublimation.') }, { q: X('How is sand separated from salt?'), a: X('Salt dissolves in water and sand does not, so sand is filtered out.') }, { q: X('How is salt recovered from the filtrate?'), a: X('By evaporating the water.') }] },
  },
  {
    id: 'distillation', cls: 9, ch: X(C9S), title: X('Separating acetone and water by distillation'),
    aim: X('To separate two liquids that mix (acetone and water) by simple distillation, using their different boiling points.'),
    kind: X('Separation by distillation'),
    setup(K) {
      const A5 = K.A5; const x = -0.12, z = -0.66; const tp = K.tripod(x, z); const bn = K.add(K.A.bunsen(), x, z);
      const top = tp.g.localToWorld(V(K, 0, tp.top + 0.001, 0)); const bath = K.add(K.A.beaker(500), x, z, { y: top.y }); K.lab.fill(bath, 'water', 250); bath.name = N('Water bath', 'जल ऊष्मक', 'Water bath'); bath.onTripod = { over: bn }; bath.evapK = 0.15;
      const fl = K.add(A5.rbFlask(), x, z, { y: bath.g.localToWorld(V(K, 0, bath.inner[0].y, 0)).y + 0.012 }); fl.bath = bath; fl.coolLapse = true;
      const st = K.add(A5.labStand(0.42), x, z - 0.1); st.clamp(fl.g.position.y - BENCH_Y + 0.1, 0.1);
      fl.g.updateMatrixWorld(true); const from = fl.g.localToWorld(fl.armEnd.clone()); const dir = V(K, 0.95, -0.31, 0).normalize(); const to = from.clone().addScaledVector(dir, 0.22);
      const cd = K.add(A5.condenser(from, to), 0, 0); cd.g.position.copy(cd.p0); cd.g.quaternion.copy(cd.q0);
      const bh = Math.max(0.02, to.y - BENCH_Y - 0.1 - 0.025); const blk = K.add(A5.block(0.08, bh, 0.08), to.x, z); const rc = K.add(K.A.conicalFlask(100), to.x, z, { y: BENCH_Y + bh }); rc.name = N('Receiver flask', 'ग्राही फ्लास्क', 'Receiver flask');
      fl.distTo = rc; fl.dripFrom = () => cd.endWorld.clone();
      const mix = K.beaker(-0.42, -0.5, 'water', 40, 100); K.lab.fill(mix, 'acetone', 40); mix.name = N('Acetone + water mixture', 'ऐसीटोन + पानी का मिश्रण', 'Acetone + paani ka mixture');
      return { tp, bn, bath, fl, st, cd, blk, rc, mix };
    },
    steps: [
      { do: X('Pour the mixture of acetone and water into the distillation flask.'), target: 'mix', act: (K, o) => K.pour(o.mix, o.fl, 80), ev: { type: 'pour', to: 'fl' },
        see: X('The flask is about half full of a clear liquid. Acetone and water are completely mixed, so we cannot separate them with a funnel.') },
      { do: X('Close the flask with the cork that holds the thermometer. The bulb of the thermometer should be just at the side arm.'), target: 'fl',
        act: async (K, o) => { o.fl.cork.visible = true; o.fl.closed = true; const t = thermoIn(K, o.fl, V(K, 0, 0.112, 0)); o.th = t.th; await K.sleep(1); }, see: X('The thermometer reads room temperature.'), why: X('The thermometer measures the temperature of the vapour that goes into the condenser.') },
      { do: X('Turn on the cold water through the condenser.'), target: 'cd', act: async (K, o) => { o.cd.g.children[2].material.opacity = 0.45; K.lab.emit('water_on', {}); await K.sleep(1); },
        see: X('Cold water flows into the jacket at the lower end and out at the upper end.'), why: X('The cold jacket cools the hot vapour so that it turns back into liquid.') },
      { do: X('Light the burner and heat the water bath slowly. Watch the thermometer (time-lapse).'), target: 'bn', act: async (K, o) => { await K.light(o.bn); await K.wait(12, 50); }, ev: { type: 'lit' },
        see: X('The temperature rises and then stays steady at about 56 °C. Drops of a colourless liquid fall from the condenser into the receiver.'), why: X('Acetone boils at 56 °C, much lower than water (100 °C). Its vapour reaches the condenser first and turns back into liquid.') },
      { do: X('Keep heating and keep watching the thermometer (time-lapse).'), target: 'fl', act: (K) => K.wait(12, 60),
        see: X('When almost all the acetone has distilled over, the drops stop and the temperature starts rising again.') },
      { do: X('Turn off the burner. Compare the liquid in the receiver with the liquid left in the flask.'), target: 'bn', act: (K, o) => K.extinguish(o.bn),
        see: X('The receiver has acetone (it smells of nail-polish remover). Water is left behind in the flask.') },
    ],
    eq: { word: 'Mixture of acetone (boils at 56 °C) and water (boils at 100 °C) —distillation→ acetone in the receiver, water in the flask', sym: 'acetone(l) —56 °C→ vapour —condenser→ acetone(l)' },
    result: { obs: X('The temperature stayed at about 56 °C while a colourless liquid (acetone) distilled into the receiver; then it rose again. Water was left in the flask.'),
      concl: X('Two miscible liquids whose boiling points are far apart can be separated by distillation.'),
      safety: X('Acetone catches fire easily: heat only with a water bath, never with a naked flame on the flask. Keep the room ventilated.'),
      viva: [{ q: X('Why does the temperature stay steady at 56 °C?'), a: X('The heat is used to boil the acetone; the temperature stays at its boiling point until it has distilled.') }, { q: X('Why is a water bath used?'), a: X('Acetone is flammable, and a water bath heats gently and evenly.') }, { q: X('Why does cold water enter the condenser at the lower end?'), a: X('So the jacket stays completely full of cold water.') }] },
  },
  {
    id: 'centrifuge_milk', cls: 9, ch: X(C9S), title: X('Separating cream from milk by centrifugation'),
    aim: X('To separate cream from full-cream milk by spinning it fast in a centrifuge.'),
    kind: X('Separation by centrifugation'),
    setup(K) {
      const cf = K.add(K.A5.centrifuge(), 0.08, -0.64); const rk = K.rack(-0.28, -0.68); const small = (i) => { const t = K.add(K.A.testTube({ r: 0.0075, h: 0.09 }), rk.g.position.x + rk.slots[i].x, rk.g.position.z + rk.slots[i].z, { y: BENCH_Y + rk.slots[i].y }); t.rack = rk; return t; }; const t1 = small(1); const t2 = small(3);
      t1.name = N('Tube 1', 'नली 1', 'Tube 1'); t2.name = N('Tube 2', 'नली 2', 'Tube 2'); K.A5.creamLayer(t1); K.A5.creamLayer(t2);
      const milk = K.beaker(-0.42, -0.5, 'milkfull', 60, 100); milk.name = N('Full-cream milk', 'फुल क्रीम दूध', 'Full-cream doodh');
      return { cf, rk, t1, t2, milk };
    },
    steps: [
      { do: X('Pour equal amounts of full-cream milk into the two tubes.'), target: 'milk', act: async (K, o) => { await K.pour(o.milk, o.t1, 7); await K.pour(o.milk, o.t2, 7); }, ev: { type: 'pour', to: 't2' },
        see: X('Both tubes hold the same amount of white milk.'), why: X('The tubes must weigh the same so that the machine stays balanced when it spins.') },
      { do: X('Put the two tubes in the centrifuge, opposite each other.'), target: 't1', act: async (K, o) => { await K.loadTube(o.t1, o.cf, 0); await K.loadTube(o.t2, o.cf, 2); }, ev: { type: 'tube_in', v: 't2' },
        see: X('The tubes sit in the rotor, facing each other.') },
      { do: X('Close the lid and switch on the centrifuge for a few minutes (time-lapse).'), target: 'cf', act: async (K, o) => { await K.spin(o.cf, 7, 30); for (const t of [o.t1, o.t2]) { const ml = t.mix.ml(); t.mix.liq = { skim: ml }; } }, ev: { type: 'spun' },
        see: X('The rotor spins very fast with a whirring sound, then slows down and stops by itself.') },
      { do: X('Take out the tubes and look at them.'), target: 't1', act: async (K, o) => { await K.unloadTube(o.t1, -0.12, -0.5); await K.unloadTube(o.t2, -0.04, -0.5); },
        see: X('A thick layer of cream has collected at the top of each tube. The milk below is thinner and slightly bluish: skimmed milk.'),
        why: X('Spinning pushes the heavier parts of the milk outward (to the bottom of the tube), and the lighter fat (cream) is left at the top.') },
    ],
    eq: { word: 'Full-cream milk —spin fast→ cream (lighter, on top) + skimmed milk (heavier, below)', sym: 'separation by density in a centrifuge' },
    result: { obs: X('After spinning, cream collected at the top of each tube and skimmed milk was left below.'),
      concl: X('Centrifugation separates particles of different densities by spinning them fast: the denser part moves to the bottom and the lighter part stays at the top.'),
      safety: X('Always balance the tubes. Never open the lid while the rotor is spinning.'),
      viva: [{ q: X('Why must the tubes be balanced?'), a: X('An unbalanced rotor shakes violently and can be damaged.') }, { q: X('Give two uses of centrifugation.'), a: X('Separating cream from milk in dairies, and separating blood cells from plasma in pathology labs; also in washing machines to squeeze water out of clothes.') }, { q: X('Which part of milk is lighter?'), a: X('The cream (fat).') }] },
  },
  {
    id: 'ink_dye', cls: 9, ch: X(C9O), title: X('Getting the dye out of ink by evaporation'),
    aim: X('To separate the coloured dye in ink from the liquid it is dissolved in, by evaporation.'),
    kind: X('Separation by evaporation'),
    setup(K) {
      const tp = K.tripod(0.06, -0.66); const bn = K.burner(0.32, -0.62); const b = K.beaker(-0.22, -0.64, 'water', 120, 250); b.name = N('Beaker half full of water', 'आधे पानी वाला बीकर', 'Aadhe paani wala beaker'); b.evapK = 0.1;
      const wg = K.add(K.A.watchGlass(), -0.38, -0.5); wg.name = N('Watch glass', 'वॉच ग्लास', 'Watch glass'); K.A5.residueSpot(wg, 0.018); wg.evapOpen = true;
      const ink = K.bottle('ink', -0.42, -0.8, { dropper: true });
      return { tp, bn, b, wg, ink };
    },
    steps: [
      { do: X('Put the beaker of water on the tripod and heat it.'), target: 'b', act: async (K, o) => { await K.onTripod(o.b, o.tp, o.bn); await K.light(o.bn); await K.wait(8, 30); }, ev: { type: 'lit' },
        see: X('The water gets hot and steam starts to rise.') },
      { do: X('Place the watch glass on the mouth of the beaker.'), target: 'wg', act: async (K, o) => { const m = o.b.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.wg, m.clone().add(V(K, 0, 0.001, 0)), null, 0.9); o.wg.bath = o.b; o.wg.home = { p: o.wg.g.position.clone(), q: o.wg.g.quaternion.clone() }; },
        see: X('The steam from the hot water heats the watch glass gently.') },
      { do: X('Put a few drops of ink on the watch glass.'), target: 'ink', act: async (K, o) => { await K.drops(o.ink, o.wg, 6); o.wg.ink0 = o.wg.mix.liq.ink || 0.3; }, ev: { type: 'drops', to: 'wg' },
        see: X('A small pool of blue ink sits on the watch glass.') },
      { do: X('Keep heating and watch the ink (time-lapse).'), target: 'wg', act: (K) => K.wait(12, 50),
        see: X('The liquid part of the ink evaporates and a dry blue solid is left on the watch glass.'), why: X('Ink is a mixture of a dye in water. Water evaporates; the dye does not, so it is left behind.') },
      { do: X('Turn off the burner.'), target: 'bn', act: (K, o) => K.extinguish(o.bn), see: X('The blue dye stays on the watch glass.') },
    ],
    eq: { word: 'Ink (dye + water) —gentle heat→ water vapour ↑ + dye (left behind)', sym: 'separation by evaporation' },
    result: { obs: X('The liquid in the ink evaporated and a blue solid residue (the dye) was left on the watch glass.'),
      concl: X('Ink is a mixture. Its dye can be separated from the liquid by evaporation, because the liquid is volatile and the dye is not.'),
      safety: X('Heat gently with the water bath; do not touch the hot watch glass.'),
      viva: [{ q: X('Why is the watch glass heated with steam and not directly?'), a: X('Gentle heating evaporates the water without burning the dye.') }, { q: X('Is ink a pure substance?'), a: X('No, it is a mixture of a dye and water (solvent).') }, { q: X('Which method can separate the different dyes in ink?'), a: X('Paper chromatography.') }] },
  },
  {
    id: 'mass_closed', cls: 9, ch: X(C9A), title: X('Is mass lost when something dissolves or reacts?'),
    aim: X('To check whether the total mass changes when salt dissolves in water (physical change) and when vinegar reacts with baking soda in a closed flask (chemical change).'),
    kind: X('Law of conservation of mass'),
    setup(K) {
      const bal = K.add(K.A5.balance(), 0.0, -0.62);
      const b = K.beaker(-0.3, -0.56, null, 0, 100); b.name = N('Dry beaker', 'सूखा बीकर', 'Sookha beaker'); b.glassG = 48.62;
      const jug = K.beaker(-0.44, -0.72, 'water', 70, 100); jug.name = N('Water', 'पानी', 'Paani'); const salt = K.solid('salt', -0.18, -0.46); const rod = K.rod(-0.08, -0.44);
      const fl = K.flask(0.24, -0.56); fl.name = N('Conical flask', 'शंक्वाकार फ्लास्क', 'Conical flask'); fl.glassG = 81.37; const vin = K.bottle('vinegar', 0.4, -0.78);
      const bl = K.place(K.A5.balloon(), 0.38, -0.5); bl.glassG = 2.15;
      const ob = K.beaker(0.26, -0.82, 'vinegar', 20, 100); ob.name = N('Open beaker with vinegar', 'सिरके वाला खुला बीकर', 'Sirke wala khula beaker'); ob.glassG = 50.08; const soda = K.solid('nahco3', 0.12, -0.46);
      return { bal, b, jug, salt, rod, fl, vin, bl, ob, soda };
    },
    steps: [
      { do: X('Put the dry beaker on the balance and press TARE to make the reading zero.'), target: 'b', act: async (K, o) => { await K.onBalance(o.b, o.bal); await K.tareBal(o.bal); }, ev: { type: 'tare' }, see: X('The balance reads 0.00 g.') },
      { do: X('Pour about 50 mL of water into the beaker and add a spoonful of salt. Note the mass.'), target: 'jug', act: async (K, o) => { await K.pour(o.jug, o.b, 50); await K.spoonful(o.salt, o.b); await K.sleep(1.2); o.m1 = o.bal.reading(); }, ev: { type: 'spoon', v: 'b' },
        see: X('The balance shows the mass of the water and the salt (about 55 g).') },
      { do: X('Stir until all the salt dissolves, then read the balance again.'), target: 'rod', act: async (K, o) => { await K.stir(o.rod, o.b, 5); await K.sleep(1.2); }, ev: { type: 'stir', v: 'b' },
        see: X('The salt disappears, but the reading does not change.'), why: X('Dissolving is a physical change: the salt is still there, spread through the water. No mass is lost.') },
      { do: X('Take the beaker off. Put the empty flask and the balloon with baking soda on the balance and press TARE. Then pour about 20 mL of vinegar into the flask and note the mass.'), target: 'fl',
        act: async (K, o) => { await K.offBalance(o.b, o.bal, -0.3, -0.5); await K.onBalance(o.fl, o.bal, -0.015); await K.onBalance(o.bl, o.bal, 0.04, 0.02); await K.tareBal(o.bal); await K.pour(o.vin, o.fl, 20); await K.sleep(1); }, ev: { type: 'pour', to: 'fl' },
        see: X('The balance shows the mass of the vinegar (about 20 g).') },
      { do: X('Stretch the balloon over the mouth of the flask without letting the powder fall in.'), target: 'bl', act: (K, o) => K.balloonOn(o.bl, o.fl), ev: { type: 'balloon' },
        see: X('The balloon hangs over the side, with the baking soda still inside it. The reading is the same.') },
      { do: X('Lift the balloon so that the baking soda falls into the vinegar (time-lapse).'), target: 'bl', act: async (K, o) => { await K.tipBalloon(o.bl, o.fl); await K.wait(8, 12); }, ev: { type: 'tip' },
        see: X('It fizzes strongly and the balloon fills up with gas. The reading on the balance stays the same.'), why: X('Carbon dioxide gas is made, but it is trapped in the balloon. Nothing has left the system, so the total mass does not change.') },
      { do: X('Now do the same in an open beaker: put the beaker of vinegar on the balance and add a spoonful of baking soda (time-lapse).'), target: 'ob',
        act: async (K, o) => { await K.offBalance(o.fl, o.bal, 0.22, -0.48); o.bal.on.splice(o.bal.on.indexOf(o.bl), 1); await K.onBalance(o.ob, o.bal); await K.tareBal(o.bal); await K.spoonful(o.soda, o.ob); await K.sleep(1); await K.wait(8, 12); }, ev: { type: 'spoon', v: 'ob' },
        see: X('It fizzes, and this time the reading slowly goes down below the mass you put in.'), why: X('In the open beaker the carbon dioxide escapes into the air, taking its mass with it. In a closed system mass is always conserved.') },
    ],
    eq: { word: 'Acetic acid + sodium hydrogencarbonate → sodium acetate + water + carbon dioxide · mass of reactants = mass of products', sym: 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂' },
    result: { obs: X('The mass did not change when salt dissolved, nor when vinegar reacted with baking soda in the closed flask. In the open beaker the mass went down because the gas escaped.'),
      concl: X('Mass is neither created nor destroyed in a physical or chemical change: this is the law of conservation of mass. A decrease is seen only when a gas escapes.'),
      safety: X('Do not overfill the balloon. Keep the balance dry.'),
      viva: [{ q: X('State the law of conservation of mass.'), a: X('In a chemical reaction mass is neither created nor destroyed; the total mass of the products equals that of the reactants.') }, { q: X('Why did the mass decrease in the open beaker?'), a: X('Carbon dioxide gas escaped into the air.') }, { q: X('Why is a balloon used?'), a: X('To trap the gas so that the system is closed.') }] },
  },
  {
    id: 'mass_baso4', cls: 9, ch: X(C9A), title: X('Mass before and after a precipitation reaction'),
    aim: X('To verify the law of conservation of mass using the reaction between sodium sulphate and barium chloride solutions.'),
    kind: X('Law of conservation of mass'),
    setup(K) {
      const bal = K.add(K.A5.balance(), 0.0, -0.62);
      const bA = K.beaker(-0.3, -0.56, null, 0, 50); bA.name = N('Beaker A', 'बीकर A', 'Beaker A'); bA.glassG = 31.24; const bB = K.beaker(-0.16, -0.56, null, 0, 50); bB.name = N('Beaker B', 'बीकर B', 'Beaker B'); bB.glassG = 30.87;
      const na = K.bottle('na2so4', 0.26, -0.78), ba = K.bottle('bacl2', 0.4, -0.78);
      return { bal, bA, bB, na, ba };
    },
    steps: [
      { do: X('Put the two clean, dry beakers on the balance and press TARE.'), target: 'bA', act: async (K, o) => { await K.onBalance(o.bA, o.bal, -0.026); await K.onBalance(o.bB, o.bal, 0.026); await K.tareBal(o.bal); }, ev: { type: 'tare' }, see: X('The balance reads 0.00 g.') },
      { do: X('Pour 10 mL of sodium sulphate solution into beaker A and 10 mL of barium chloride solution into beaker B. Note the total mass.'), target: 'na',
        act: async (K, o) => { await K.pour(o.na, o.bA, 10); await K.pour(o.ba, o.bB, 10); await K.sleep(1); }, ev: { type: 'pour', to: 'bB' }, see: X('Both solutions are clear and colourless. The balance shows their total mass (about 20 g).') },
      { do: X('Pour the solution from beaker B into beaker A and swirl gently.'), target: 'bB', act: async (K, o) => { await K.pour(o.bB, o.bA, 10); await K.swirl(o.bA, 1.2); }, ev: { type: 'pour', from: 'bB' },
        see: X('A thick white precipitate forms at once.'), why: X('Barium sulphate, which does not dissolve in water, is formed.') },
      { do: X('Put both beakers back on the balance and read the mass.'), target: 'bal', act: (K) => K.sleep(2),
        see: X('The reading is exactly the same as before mixing.'), why: X('The atoms only changed partners; none were created or destroyed, and nothing escaped.') },
    ],
    eq: { word: 'Sodium sulphate + barium chloride → barium sulphate (white precipitate) + sodium chloride', sym: 'Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s)↓ + 2NaCl(aq)' },
    result: { obs: X('A white precipitate formed, but the total mass was the same before and after the reaction.'),
      concl: X('The total mass of the reactants equals the total mass of the products: mass is conserved in a chemical reaction.'),
      safety: X('Barium chloride is poisonous: wash your hands after use.'),
      viva: [{ q: X('Name the white precipitate.'), a: X('Barium sulphate (BaSO₄).') }, { q: X('What type of reaction is this?'), a: X('A double displacement (precipitation) reaction.') }, { q: X('Why is the mass the same?'), a: X('No atoms are created or destroyed, and no gas escapes.') }] },
  },
  {
    id: 'mp_bp', cls: 9, ch: X(C9L), title: X('Melting point of ice and boiling point of water'),
    aim: X('To find the melting point of ice and the boiling point of water with a thermometer.'),
    kind: X('Melting point and boiling point'),
    setup(K) {
      const tp = K.tripod(0.06, -0.66); const bn = K.burner(0.32, -0.62);
      const b = K.beaker(-0.24, -0.62, 'water', 20, 250); b.name = N('Beaker with crushed ice', 'पिसी हुई बर्फ़ वाला बीकर', 'Crushed ice wala beaker'); K.A3.iceCubes(b, 12); b.ice = 80; b.ice0 = 80; b.mix.temp = 1; b.placeIce(); b.evapK = 0.15;
      const th = K.add(K.A.thermometer(), 0.0, -0.46); th.g.rotation.set(Math.PI / 2, 0, -0.4); th.g.position.y = BENCH_Y + 0.004; th.home = { p: th.g.position.clone(), q: th.g.quaternion.clone() };
      return { tp, bn, b, th };
    },
    steps: [
      { do: X('Put the thermometer into the crushed ice so that its bulb is covered by ice. Read it.'), target: 'th',
        act: async (K, o) => { const m = o.b.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.th, m.clone().add(V(K, 0.012, -0.085, 0)), new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(0, 0, -0.12)), 1); o.th.noGrab = true; o.th.update = () => { o.th.setTemp(o.b.mix.temp); const mm = o.b.mouthWorld(V(K, 0, 0, 0)); o.th.g.position.set(mm.x + 0.012, mm.y - 0.085, mm.z); }; o.ro = K.add(K.A5.readout(() => o.b.mix.temp, '°C', () => o.th.g.localToWorld(V(K, 0.03, 0.24, 0))), 0, 0); await K.sleep(1.5); },
        see: X('The reading falls to 0 °C.') },
      { do: X('Put the beaker on the tripod and heat it gently. Keep reading the thermometer while the ice melts (time-lapse).'), target: 'b',
        act: async (K, o) => { await K.onTripod(o.b, o.tp, o.bn); await K.light(o.bn); await K.wait(12, 50); }, ev: { type: 'lit' },
        see: X('The ice melts, but the thermometer stays at 0 °C as long as some ice is left — even though we keep heating.'), why: X('The heat is used to break the ice into water, not to raise the temperature. 0 °C is the melting point of ice.') },
      { do: X('Keep heating after all the ice has melted (time-lapse).'), target: 'b', act: (K) => K.wait(12, 45),
        see: X('Now the temperature rises steadily, until the water boils with big bubbles at 100 °C.') },
      { do: X('Let it boil for a few minutes and keep reading the thermometer (time-lapse).'), target: 'b', act: (K) => K.wait(10, 30),
        see: X('The water keeps boiling and the reading stays at 100 °C.'), why: X('While water boils, the heat turns water into steam; the temperature stays at the boiling point, 100 °C at sea level.') },
      { do: X('Turn off the burner.'), target: 'bn', act: (K, o) => K.extinguish(o.bn), see: X('The boiling stops.') },
    ],
    eq: { word: 'Ice ⇌ water at 0 °C (melting point) · water ⇌ steam at 100 °C (boiling point)', sym: 'H₂O(s) —0 °C→ H₂O(l) —100 °C→ H₂O(g)' },
    result: { obs: X('The temperature stayed at 0 °C while the ice melted, then rose and stayed at 100 °C while the water boiled.'),
      concl: X('The melting point of ice is 0 °C and the boiling point of water is 100 °C (at normal pressure). During a change of state the temperature stays constant.'),
      safety: X('Do not let the thermometer touch the bottom of the hot beaker. Keep away from the steam.'),
      viva: [{ q: X('Why does the temperature not rise while ice is melting?'), a: X('The heat supplied is used to change the state (latent heat), not to raise the temperature.') }, { q: X('What is the boiling point of water at sea level?'), a: X('100 °C.') }, { q: X('Why does water boil below 100 °C in the mountains?'), a: X('The air pressure is lower there.') }] },
  },
  {
    id: 'five_changes', cls: 9, ch: X(C9P), title: X('Five changes: physical or chemical?'),
    aim: X('To carry out five reactions and decide for each whether it is a physical or a chemical change.'),
    kind: X('Physical and chemical changes'),
    setup(K) {
      const rk = K.rack(-0.24, -0.76); const t1 = K.tube(rk, 0, 'cuso4', 10); t1.name = N('Test tube 1: copper sulphate solution', 'परखनली 1: कॉपर सल्फ़ेट विलयन', 'Test tube 1: copper sulphate solution');
      const t3 = K.tube(rk, 2, null, 0, { boiling: true }); t3.name = N('Boiling tube 3', 'क्वथन नली 3', 'Boiling tube 3'); const t4 = K.tube(rk, 3, null, 0, { boiling: true }); t4.name = N('Boiling tube 4 (dry)', 'क्वथन नली 4 (सूखी)', 'Boiling tube 4 (sookhi)');
      const t5 = K.tube(rk, 4, 'na2so4', 3); t5.name = N('Test tube 5: sodium sulphate', 'परखनली 5: सोडियम सल्फ़ेट', 'Test tube 5: sodium sulphate'); const t6 = K.tube(rk, 5, 'bacl2', 3); t6.name = N('Test tube 6: barium chloride', 'परखनली 6: बेरियम क्लोराइड', 'Test tube 6: barium chloride');
      const nail = K.solid('fe', -0.44, -0.56); const rb = K.solid('mg', -0.32, -0.5); const tg = K.tongs(-0.16, -0.46); const zn = K.solid('zn', -0.06, -0.5); const cr = K.solid('cuso4x', 0.06, -0.5);
      const acid = K.bottle('h2so4', 0.14, -0.8); const w = K.bottle('water', 0.26, -0.8, { dropper: true }); w.name = X('Water (dropper)'); const lamp = K.lamp(0.3, -0.6); const sp = K.splint(0.18, -0.44); K.holder(0.42, -0.5);
      return { rk, t1, t3, t4, t5, t6, nail, rb, tg, zn, cr, acid, w, lamp, sp };
    },
    steps: [
      { do: X('(a) Put a clean iron nail into the copper sulphate solution and leave it (time-lapse).'), target: 'nail', act: async (K, o) => { await K.addSolid(o.nail, o.t1); await K.wait(10, 120); }, ev: { type: 'add', to: 't1' },
        see: X('The nail gets a reddish-brown coat and the blue solution turns pale green.'), why: X('Iron displaces copper: new substances (iron sulphate and copper) form. A chemical change.') },
      { do: X('(b) Light the lamp and burn the magnesium ribbon, holding it with tongs.'), target: 'rb', act: async (K, o) => { await K.light(o.lamp); await K.burnRibbon(o.rb, o.tg, o.lamp); }, ev: { type: 'mg_burnt' },
        see: X('It burns with a dazzling white flame and leaves a white powder.'), why: X('Magnesium combines with oxygen to form magnesium oxide. A chemical change.') },
      { do: X('(c) Put zinc granules in boiling tube 3, add dilute sulphuric acid, and bring a burning splint to the mouth.'), target: 'zn', act: async (K, o) => { await K.addSolid(o.zn, o.t3); await K.pour(o.acid, o.t3, 8); await K.sleep(1.5); await K.splintTest(o.sp, o.t3, o.lamp); }, ev: { type: 'pop' },
        see: X('Bubbles form; the gas burns with a pop. The tube feels warm.'), why: X('Zinc reacts with the acid to give zinc sulphate and hydrogen. A chemical change.') },
      { do: X('(d) Heat copper sulphate crystals in dry boiling tube 4, then let it cool and add a few drops of water.'), target: 'cr', act: async (K, o) => { await K.addSolid(o.cr, o.t4); await K.heat(o.t4, o.lamp, 14, { tilt: 0.5 }); await K.drops(o.w, o.t4, 3); }, ev: { type: 'drops', to: 't4' },
        see: X('The blue crystals turn white and water drops appear in the tube. With water, the white powder turns blue again and becomes warm.'), why: X('Heat removes the water of crystallisation; adding water brings it back. Usually counted as a chemical change, though it can be reversed.') },
      { do: X('(e) Pour the barium chloride solution into the sodium sulphate solution.'), target: 't6', act: (K, o) => K.pour(o.t6, o.t5, 3), ev: { type: 'pour', from: 't6' },
        see: X('A white precipitate forms at once.'), why: X('Barium sulphate is formed: a new substance. A chemical change.') },
      { do: X('Decide which changes are physical and which are chemical.'), target: 'rk', act: (K) => K.sleep(1.5),
        see: X('(a), (b), (c) and (e) made new substances: chemical changes. (d) also breaks and remakes bonds with water, so it is treated as a chemical change, though it is reversible.') },
    ],
    eq: { word: '(a) iron + copper sulphate · (b) magnesium + oxygen · (c) zinc + sulphuric acid · (d) copper sulphate crystals —heat→ · (e) sodium sulphate + barium chloride', sym: 'Fe + CuSO₄ → FeSO₄ + Cu · 2Mg + O₂ → 2MgO · Zn + H₂SO₄ → ZnSO₄ + H₂ · CuSO₄·5H₂O → CuSO₄ + 5H₂O · Na₂SO₄ + BaCl₂ → BaSO₄ + 2NaCl' },
    result: { obs: X('A copper coat formed on the nail; magnesium burnt with a white flame; zinc gave hydrogen with acid; blue crystals turned white and back to blue with water; a white precipitate formed.'),
      concl: X('A chemical change makes new substances with new properties (colour change, gas, precipitate, heat or light). In a physical change no new substance is formed.'),
      safety: X('Do not look straight at burning magnesium. Hold hot tubes with a holder, pointing away from people. Barium chloride is poisonous.'),
      viva: [{ q: X('Give two signs of a chemical change.'), a: X('Change of colour, gas given off, precipitate formed, heat or light produced (any two).') }, { q: X('Is dissolving salt in water a physical or chemical change?'), a: X('Physical: no new substance forms, and the salt can be recovered by evaporation.') }, { q: X('Which gas burns with a pop?'), a: X('Hydrogen.') }] },
  },
];
void until;
