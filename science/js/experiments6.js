// Chemistry experiments, batch 6: the remaining Class 10 book activities, CBSE practicals and lab-manual experiments:
// silver chloride in sunlight, heat given out / taken in, copper oxidised and reduced, smell indicators, copper oxide + acid,
// dry and moist HCl gas, diluting an acid, HCl and NaOH compared, metals burning in air, metals and water, burning carbon
// compounds and the Bunsen flame, ethanol oxidised, sodium + ethanol, ethanoic acid, an ester, soap micelles, soap in hard
// water, carbon dioxide, making soap, and washing soda vs baking soda.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C1 = N('Ch 1 · Chemical Reactions and Equations', 'अध्याय 1 · रासायनिक अभिक्रियाएँ एवं समीकरण', 'Ch 1 · Chemical Reactions aur Equations');
const C2 = N('Ch 2 · Acids, Bases and Salts', 'अध्याय 2 · अम्ल, क्षारक एवं लवण', 'Ch 2 · Acids, Bases aur Salts');
const C3 = N('Ch 3 · Metals and Non-metals', 'अध्याय 3 · धातु एवं अधातु', 'Ch 3 · Metals aur Non-metals');
const C4 = N('Ch 4 · Carbon and its Compounds', 'अध्याय 4 · कार्बन एवं उसके यौगिक', 'Ch 4 · Carbon aur uske Compounds');
const CL = N('NCERT Lab Manual, Class 10', 'NCERT लैब मैनुअल, कक्षा 10', 'NCERT Lab Manual, Class 10');
const CP = N('CBSE practical, Class 10', 'CBSE प्रैक्टिकल, कक्षा 10', 'CBSE practical, Class 10');
// stand a vessel inside a bath (on a tripod); it then follows the bath's temperature
async function intoBathAt(K, v, bath) { const b = bath.g.localToWorld(V(K, 0, bath.inner[0].y + 0.002, 0)); await K.moveTo(v, b.clone().setY(b.y + 0.1), new K.THREE.Quaternion(), 0.8); await K.tween(0.6, (k) => { v.g.position.y = b.y + 0.1 * (1 - k); }); v.bath = bath; v.home = { p: v.g.position.clone(), q: v.g.quaternion.clone() }; K.lab.emit('bath', { v: v.id, in: bath.id }); }
// a thermometer that stays in a vessel and shows its temperature, with a read-out above it
function thermoIn(K, v, local) {
  const th = K.add(K.A.thermometer(), 0, 0); th.noGrab = true; const pos = () => v.g.localToWorld(local.clone());
  th.update = () => { th.setTemp(v.mix.temp); th.g.position.copy(pos()); th.g.quaternion.identity(); };
  const ro = K.add(K.A5.readout(() => v.mix.temp, '°C', () => th.g.localToWorld(V(K, 0.03, 0.24, 0))), 0, 0); return { th, ro };
}
// what a vessel or a cloth strip smells of
function smellOf(x) {
  if (x.onion != null) return x.got && x.got.naoh ? X('Almost no smell: the onion smell is gone') : X('Strong smell of onion');
  const m = x.mix; if (!m) return X('No smell'); const base = m.pH() > 9;
  if (x.gas && (x.gas.NH3 || 0) > 0.05) return X('Sharp, choking smell of ammonia');
  if (m.has('vanilla', 0.01)) return base ? X('Hardly any smell: the vanilla smell is gone') : X('Strong smell of vanilla');
  if (m.has('clove', 0.01)) return base ? X('Very weak smell of clove') : X('Strong smell of clove');
  if (m.has('ester', 0.1)) return X('Sweet, fruity smell (like nail-polish remover)');
  if (m.has('glacial', 0.05) || m.has('ethanoic', 0.05)) return X('Sharp, sour smell of vinegar');
  return X('No smell');
}
const sniff = (K, it) => K.sniff(it, tl(K, smellOf(it)));
const lay = (K, it, x, z, ry = 0) => K.lay(it, x, z, ry);
const RED = 0xd0424a, BLUE = 0x4e6fbf;

export const EXPERIMENTS6 = [
  // ===================================================== Ch 1
  {
    id: 'agcl_sun', cls: 10, ch: C1, title: X('Silver chloride in sunlight'),
    aim: X('To study the decomposition of silver chloride by light.'),
    kind: X('Decomposition by light'),
    setup(K) {
      const rk = K.rack(-0.36, -0.78); const t = K.tube(rk, 2, 'agno3', 5); t.name = X('Test tube with silver nitrate solution');
      const nacl = K.bottle('nacl', -0.46, -0.56); const ag = K.solid('agcl', -0.24, -0.48); ag.name = X('Silver chloride (dried, prepared earlier)');
      const lamp = K.lamp3(-0.08, -0.66); lamp.name = X('Bright lamp (in place of sunlight)');
      const dA = K.add(K.A.chinaDish(), 0.06, -0.6); dA.name = X('China dish A'); const dB = K.add(K.A.chinaDish(), 0.06, -0.73); dB.name = X('China dish B');
      dA.sunBy = lamp; dB.sunBy = lamp; const cv = K.add(K.A6.cover(), 0.3, -0.52);
      return { rk, t, nacl, ag, lamp, dA, dB, cv };
    },
    steps: [
      { do: X('Pour a little salt (sodium chloride) solution into the silver nitrate solution.'), target: 'nacl', act: (K, o) => K.pour(o.nacl, o.t, 3), ev: { type: 'pour', to: 't' },
        see: X('A white, curdy precipitate of silver chloride forms at once.'), why: X('Silver nitrate and sodium chloride exchange ions: insoluble silver chloride (AgCl) forms.') },
      { do: X('Put two spatulas of the dry silver chloride in each china dish.'), target: 'ag', act: async (K, o) => { await K.spoonful(o.ag, o.dA); await K.spoonful(o.ag, o.dA); await K.spoonful(o.ag, o.dB); await K.spoonful(o.ag, o.dB); for (const d of [o.dA, o.dB]) d.solids.forEach((q, i) => { q.g.scale.setScalar(2.3); q.g.position.x = (i ? 1 : -1) * 0.009; }); }, ev: { type: 'spoon', v: 'dB' }, // spread the powder in the dish
        see: X('Both dishes have white silver chloride powder.') },
      { do: X('Cover dish B with the black paper cover so that no light reaches it.'), target: 'cv', act: (K, o) => K.coverOn(o.cv, o.dB), ev: { type: 'cover' }, see: X('Dish B is now in the dark; dish A is open to the light.') },
      { do: X('Switch on the bright lamp (it stands in for sunlight) and leave the dishes in the light (time-lapse).'), target: 'dA', act: async (K, o) => { await K.lampOn(o.lamp, true); await K.wait(12, 80); }, ev: { type: 'lamp_on' },
        see: X('The silver chloride in dish A slowly turns grey (violet-grey) on its surface.'), why: X('Light breaks silver chloride down into grey silver metal and chlorine gas.') },
      { do: X('Switch off the lamp, take the cover off dish B and compare the two dishes.'), target: 'dB', act: async (K, o) => { await K.lampOn(o.lamp, false); await K.coverOff(o.cv, o.dB, 0.3, -0.52); }, ev: { type: 'uncover' },
        see: X('Dish B, kept in the dark, is still white. Only the silver chloride kept in light has turned grey.'), why: X('This is a decomposition reaction caused by light (photolytic decomposition). Black-and-white photography uses this change.') },
    ],
    eq: { word: 'Silver chloride —sunlight→ silver + chlorine', sym: '2AgCl(s) —sunlight→ 2Ag(s) + Cl₂(g)' },
    result: { obs: X('White silver chloride turned grey in light; the covered sample stayed white.'),
      concl: X('Silver chloride decomposes in sunlight into silver and chlorine. Light can supply the energy for a decomposition reaction.'),
      safety: X('Silver nitrate stains the skin and is corrosive: wear gloves. Silver salts are kept in dark bottles.'),
      viva: [{ q: X('Why is silver chloride kept in dark coloured bottles?'), a: X('Because light decomposes it into silver and chlorine.') }, { q: X('What type of reaction is this?'), a: X('A decomposition reaction caused by light (photolytic decomposition).') }, { q: X('Name another silver salt that behaves the same way.'), a: X('Silver bromide: 2AgBr → 2Ag + Br₂.') }] },
  },
  {
    id: 'exo_endo', cls: 10, ch: C1, title: X('Reactions that give out or take in heat'),
    aim: X('To observe the temperature change when sodium hydroxide neutralises hydrochloric acid, and when barium hydroxide reacts with ammonium chloride.'),
    kind: X('Exothermic and endothermic reactions'),
    setup(K) {
      const bA = K.beaker(-0.34, -0.62, 'hcl', 20, 100); bA.name = X('Beaker A: 20 mL dilute hydrochloric acid'); thermoIn(K, bA, V(K, 0.012, 0.004, 0.006));
      const nb = K.beaker(-0.46, -0.8, 'naoh', 20, 100); nb.name = X('20 mL dilute sodium hydroxide solution');
      const bB = K.beaker(0.1, -0.64, null, 0, 100); bB.name = X('Beaker B (dry)'); bB.noFreeze = true; K.A6.frost(bB); thermoIn(K, bB, V(K, 0.014, 0.004, 0.006));
      const ba = K.solid('baoh2', -0.08, -0.46); const nh = K.solid('nh4cl', 0.06, -0.44); const rod = K.rod(0.2, -0.44); const rl = K.strip('red', 0.32, -0.5); K.moisten(rl);
      return { bA, nb, bB, ba, nh, rod, rl };
    },
    steps: [
      { do: X('Read the thermometer in beaker A (dilute hydrochloric acid).'), target: 'bA', act: (K) => K.sleep(1.5), see: X('It shows room temperature, about 27 °C.') },
      { do: X('Pour the sodium hydroxide solution into beaker A and stir gently. Read the highest temperature.'), target: 'nb', act: async (K, o) => { await K.pour(o.nb, o.bA, 20); await K.stir(o.rod, o.bA, 3); }, ev: { type: 'pour', to: 'bA' },
        see: X('Nothing seems to happen, but the temperature rises by about 6–7 °C and the beaker feels warm.'), why: X('Neutralisation of an acid by a base gives out heat: it is an exothermic reaction.') },
      { do: X('Put two spatulas of barium hydroxide and one spatula of ammonium chloride in dry beaker B.'), target: 'ba', act: async (K, o) => { await K.spoonful(o.ba, o.bB); await K.spoonful(o.ba, o.bB); await K.spoonful(o.nh, o.bB); }, ev: { type: 'spoon', v: 'bB' },
        see: X('Two white solids lie in the beaker. The temperature has not changed yet.') },
      { do: X('Mix the two solids well with the glass rod (time-lapse).'), target: 'rod', act: async (K, o) => { await Promise.all([K.stir(o.rod, o.bB, 6), K.wait(6, 3)]); await K.wait(5, 4); }, ev: { type: 'stir', v: 'bB' },
        see: X('The solids turn wet and slushy, and the temperature falls far below 0 °C. Frost forms on the outside of the beaker.'), why: X('This reaction takes in heat from its surroundings: it is an endothermic reaction.') },
      { do: X('Waft the air above beaker B gently towards your nose.'), target: 'bB', act: (K, o) => sniff(K, o.bB), ev: { type: 'sniff', v: 'bB' }, see: X('A sharp, choking smell of ammonia.') },
      { do: X('Hold moist red litmus paper over beaker B.'), target: 'rl', act: (K, o) => K.holdPaper(o.rl, () => o.bB.mouthWorld(V(K, 0, 0, 0)).add(V(K, 0, 0.004, 0)), 2.6, () => ((o.bB.gas.NH3 || 0) > 0.03 ? new K.THREE.Color(BLUE) : null)), ev: { type: 'paper' },
        see: X('The red litmus paper turns blue.'), why: X('Ammonia gas is basic. It is one of the products of the reaction.') },
    ],
    eq: { word: 'Sodium hydroxide + hydrochloric acid → sodium chloride + water + heat · barium hydroxide + ammonium chloride + heat → barium chloride + ammonia + water', sym: 'NaOH + HCl → NaCl + H₂O (exothermic) · Ba(OH)₂·8H₂O + 2NH₄Cl → BaCl₂ + 2NH₃↑ + 10H₂O (endothermic)' },
    result: { obs: X('NaOH + HCl: no visible change, but the temperature rose by about 7 °C. Ba(OH)₂ + NH₄Cl: slushy mixture, smell of ammonia, red litmus turned blue, temperature fell below 0 °C with frost on the beaker.'),
      concl: X('Neutralisation is exothermic (gives out heat). The reaction of barium hydroxide with ammonium chloride is endothermic (takes in heat).'),
      safety: X('Barium hydroxide is poisonous and corrosive; ammonia is irritating. Do not smell directly; wear goggles and wash your hands.'),
      viva: [{ q: X('What is an exothermic reaction? Give an example.'), a: X('A reaction that gives out heat, e.g. neutralisation of NaOH by HCl, or burning of fuels.') }, { q: X('What is an endothermic reaction? Give an example.'), a: X('A reaction that takes in heat, e.g. barium hydroxide with ammonium chloride.') }, { q: X('Which gas turned the red litmus blue?'), a: X('Ammonia (NH₃), a basic gas.') }] },
  },
  {
    id: 'cu_oxid', cls: 10, ch: C1, title: X('Copper is oxidised in air and reduced by hydrogen'),
    aim: X('To show that copper is oxidised to black copper oxide on heating in air, and that hot copper oxide is reduced back to copper by hydrogen.'),
    kind: X('Oxidation and reduction'),
    setup(K) {
      const cu = K.solid('cupow', -0.44, -0.5); const rod = K.rod(-0.32, -0.44); const dish = K.add(K.A.chinaDish(), -0.3, -0.66); const tp = K.tripod(-0.12, -0.7); const bn = K.burner(-0.12, -0.48);
      const fl = K.add(K.A.conicalFlask(250), 0.36, -0.8); fl.name = X('Flask with zinc granules (makes hydrogen)'); const zn = K.solid('zn', 0.36, -0.6); K.lab.putSolid(zn, fl); zn.amount = 2; zn.onAmount();
      const th = K.add(K.A6.thistleFunnel(), 0.355, -0.8, { y: BENCH_Y + 0.004 }); th.drainTo = fl;
      const bn2 = K.burner(0.22, -0.5); const t = K.add(K.A.boilingTube(), 0.14, -0.8); t.name = X('Hard-glass tube'); K.clampTube(t, 0.14, -0.8, BENCH_Y + bn2.heatPoint.y + 0.012); K.A6.droplets(t, { lo: 0.45, hi: 0.85 });
      const hcl = K.bottle('hcl', 0.46, -0.52);
      return { cu, rod, dish, tp, bn, fl, zn, th, bn2, t, hcl };
    },
    steps: [
      { do: X('Put a spatula of copper powder in the china dish.'), target: 'cu', act: (K, o) => K.spoonful(o.cu, o.dish), ev: { type: 'spoon', v: 'dish' }, see: X('Reddish-brown (salmon pink) copper powder.') },
      { do: X('Place the dish on the tripod and heat it strongly, stirring now and then (time-lapse).'), target: 'dish',
        act: async (K, o) => { await K.onTripod(o.dish, o.tp, o.bn); await K.light(o.bn); await K.wait(5, 9); await K.stir(o.rod, o.dish, 2); await K.wait(5, 9); }, ev: { type: 'lit' },
        see: X('The surface of the copper powder becomes coated with a black substance.'), why: X('Copper combines with oxygen from the air to form black copper(II) oxide: copper is oxidised (it gains oxygen).') },
      { do: X('Turn off the burner. (Teacher) Put a little of the black powder in the hard-glass tube and connect the tube to the hydrogen flask.'), target: 't',
        act: async (K, o) => { await K.extinguish(o.bn); const s = o.dish.solids.find((q) => q.chem === 'cuo') || o.dish.solids[0]; await K.spoonful(s, o.t); o.P = K.pipe(o.fl, o.t); await K.sleep(0.6); }, ev: { type: 'pipe' },
        see: X('The black powder lies at the bottom of the tube; the delivery tube from the flask reaches down to it.') },
      { do: X('Pour dilute hydrochloric acid into the thistle funnel. Let the hydrogen push all the air out of the tube.'), target: 'th', act: async (K, o) => { await K.pour(o.hcl, o.th, 18); await K.wait(4); }, ev: { type: 'pour', to: 'th' },
        see: X('The zinc fizzes. Hydrogen gas flows through the delivery tube over the black powder.'), why: X('All the air must be pushed out first: a mixture of hydrogen and air can explode when heated.') },
      { do: X('Light the second burner and heat the black powder in the stream of hydrogen (time-lapse).'), target: 'bn2', act: async (K, o) => { await K.light(o.bn2); await K.under(o.bn2, o.t); await K.wait(10, 3); }, ev: { type: 'under' },
        see: X('The black powder slowly turns reddish-brown again, and drops of water appear on the cooler upper part of the tube.'), why: X('Hydrogen removes oxygen from copper oxide: copper oxide is reduced to copper, and hydrogen is oxidised to water. Oxidation and reduction happen together (a redox reaction).') },
    ],
    eq: { word: 'Copper + oxygen —heat→ copper(II) oxide · copper(II) oxide + hydrogen —heat→ copper + water', sym: '2Cu + O₂ → 2CuO · CuO + H₂ → Cu + H₂O' },
    result: { obs: X('Reddish-brown copper turned black on heating in air. The black powder turned reddish-brown again when heated in hydrogen, and water drops formed.'),
      concl: X('Copper is oxidised to copper(II) oxide by oxygen; copper(II) oxide is reduced to copper by hydrogen. A substance that gains oxygen is oxidised; one that loses oxygen is reduced.'),
      safety: X('Use tongs for the hot dish. The hydrogen part is done only by the teacher, after all the air has been pushed out; keep flames away from the flask.'),
      viva: [{ q: X('What is the black substance formed on heating copper?'), a: X('Copper(II) oxide, CuO.') }, { q: X('In CuO + H₂ → Cu + H₂O, which substance is oxidised and which is reduced?'), a: X('Hydrogen is oxidised (to water); copper oxide is reduced (to copper).') }, { q: X('What is a redox reaction?'), a: X('A reaction in which oxidation and reduction take place together.') }] },
  },
  // ===================================================== Ch 2
  {
    id: 'olfactory', cls: 10, also: [7], ch: C2, title: X('Smell indicators: onion, vanilla and clove'),
    aim: X('To test whether onion, vanilla essence and clove oil can tell an acid from a base by their smell.'),
    kind: X('Olfactory indicators'),
    setup(K) {
      const s1 = lay(K, K.A6.clothStrip(), -0.44, -0.5, 0.1); s1.name = X('Onion cloth strip 1'); const s2 = lay(K, K.A6.clothStrip(), -0.36, -0.5, -0.1); s2.name = X('Onion cloth strip 2');
      const hcl = K.bottle('hcl', -0.46, -0.82, { dropper: true }); const naoh = K.bottle('naoh', -0.36, -0.82, { dropper: true }); const w = K.beaker(-0.2, -0.7, 'water', 60, 100); w.name = X('Water for rinsing');
      const rk = K.rack(0.2, -0.78); const t1 = K.tube(rk, 1, 'hcl', 2); const t2 = K.tube(rk, 2, 'naoh', 2); const t3 = K.tube(rk, 3, 'hcl', 2); const t4 = K.tube(rk, 4, 'naoh', 2);
      t1.name = X('Test tube 1: dilute hydrochloric acid'); t2.name = X('Test tube 2: dilute sodium hydroxide'); t3.name = X('Test tube 3: dilute hydrochloric acid'); t4.name = X('Test tube 4: dilute sodium hydroxide');
      const van = K.bottle('vanilla', 0.04, -0.52, { dropper: true }); const clv = K.bottle('clove', 0.16, -0.5, { dropper: true });
      return { s1, s2, hcl, naoh, w, rk, t1, t2, t3, t4, van, clv };
    },
    steps: [
      { do: X('Smell the two cloth strips that were kept overnight with chopped onion.'), target: 's1', act: async (K, o) => { await sniff(K, o.s1); await sniff(K, o.s2); }, ev: { type: 'sniff' }, see: X('Both strips smell strongly of onion.') },
      { do: X('Put a few drops of dilute hydrochloric acid on strip 1 and a few drops of dilute sodium hydroxide on strip 2.'), target: 'hcl', act: async (K, o) => { await K.dropsOn(o.hcl, o.s1, 4); await K.dropsOn(o.naoh, o.s2, 4); }, ev: { type: 'drops_on' },
        see: X('Both strips become wet where the drops fall.') },
      { do: X('Rinse both strips in water and smell them again.'), target: 's2', act: async (K, o) => { await K.rinseIn(o.s1, o.w); await K.rinseIn(o.s2, o.w); await sniff(K, o.s1); await sniff(K, o.s2); }, ev: { type: 'sniff', v: 's2' },
        see: X('Strip 1 (acid) still smells of onion. Strip 2 (base) has lost its onion smell.'), why: X('The onion smell survives an acid but is destroyed by a base, so onion can show whether a solution is acidic or basic by smell.') },
      { do: X('Add three drops of vanilla essence to test tubes 1 (acid) and 2 (base), shake them and smell.'), target: 'van', act: async (K, o) => { await K.drops(o.van, o.t1, 3); await K.drops(o.van, o.t2, 3); await K.shakeThumb(o.t1, 1.2); await K.shakeThumb(o.t2, 1.2); await sniff(K, o.t1); await sniff(K, o.t2); }, ev: { type: 'sniff', v: 't2' },
        see: X('Tube 1 (acid) smells of vanilla. In tube 2 (base) the vanilla smell has gone.'), why: X('Vanillin reacts with sodium hydroxide to form a salt that has no smell.') },
      { do: X('Do the same with clove oil in test tubes 3 (acid) and 4 (base).'), target: 'clv', act: async (K, o) => { await K.drops(o.clv, o.t3, 3); await K.drops(o.clv, o.t4, 3); await K.shakeThumb(o.t3, 1.2); await K.shakeThumb(o.t4, 1.2); await sniff(K, o.t3); await sniff(K, o.t4); }, ev: { type: 'sniff', v: 't4' },
        see: X('The clove smell stays in the acid (tube 3) but becomes very weak in the base (tube 4).'), why: X('Onion, vanilla and clove oil are olfactory indicators: their smell changes in a basic medium but not in an acidic one.') },
    ],
    eq: { word: 'Vanillin + sodium hydroxide → sodium vanillate (no smell) + water', sym: 'C₈H₈O₃ + NaOH → C₈H₇O₃Na + H₂O' },
    result: { obs: X('Onion, vanilla and clove kept their smell with hydrochloric acid, but lost it (or nearly lost it) with sodium hydroxide.'),
      concl: X('Onion, vanilla essence and clove oil are olfactory indicators: they can tell a base from an acid by smell. They are useful for visually impaired students.'),
      safety: X('Waft the smell towards your nose with your hand; never sniff directly. Use only dilute acid and base.'),
      viva: [{ q: X('What is an olfactory indicator?'), a: X('A substance whose smell changes in an acidic or basic medium, e.g. onion, vanilla, clove oil.') }, { q: X('In which medium does the vanilla smell disappear?'), a: X('In a basic medium (sodium hydroxide).') }, { q: X('Who can use olfactory indicators especially?'), a: X('Visually impaired students, who cannot see colour changes.') }] },
  },
  {
    id: 'cuo_hcl', cls: 10, ch: C2, title: X('Copper oxide and hydrochloric acid'),
    aim: X('To show that a metal oxide reacts with an acid to form a salt and water.'),
    kind: X('Metal oxides are basic'),
    setup(K) {
      const cuo = K.solid('cuo', -0.4, -0.5); const b = K.beaker(-0.22, -0.64, null, 0, 100); b.name = X('Beaker'); b.maxT = 55; const hcl = K.bottle('hcl', -0.44, -0.8);
      const rod = K.rod(-0.08, -0.44); const tp = K.tripod(0.14, -0.68); const bn = K.burner(0.32, -0.6);
      return { cuo, b, hcl, rod, tp, bn };
    },
    steps: [
      { do: X('Put a spatula of black copper oxide in the beaker.'), target: 'cuo', act: (K, o) => K.spoonful(o.cuo, o.b), ev: { type: 'spoon', v: 'b' }, see: X('A black powder at the bottom of the beaker.') },
      { do: X('Add about 15 mL of dilute hydrochloric acid slowly while stirring.'), target: 'hcl', act: async (K, o) => { await K.pour(o.hcl, o.b, 15); await K.stir(o.rod, o.b, 3); }, ev: { type: 'pour', to: 'b' },
        see: X('Some of the black powder dissolves and the liquid turns a pale blue-green.') },
      { do: X('Warm the beaker gently on the tripod while stirring (time-lapse).'), target: 'b', act: async (K, o) => { await K.onTripod(o.b, o.tp, o.bn); await K.light(o.bn); await K.wait(3, 6); await Promise.all([K.stir(o.rod, o.b, 5), K.wait(5, 8)]); await K.wait(3, 8); await K.extinguish(o.bn); }, ev: { type: 'lit' },
        see: X('All the black powder dissolves. The solution becomes clear and blue-green.'), why: X('Copper oxide reacts with the acid to form copper(II) chloride, which colours the solution blue-green, and water.') },
    ],
    eq: { word: 'Copper(II) oxide + hydrochloric acid → copper(II) chloride + water', sym: 'CuO + 2HCl → CuCl₂ + H₂O' },
    result: { obs: X('The black copper oxide dissolved in dilute hydrochloric acid (faster on warming) and the solution turned blue-green.'),
      concl: X('A metal oxide reacts with an acid to give a salt and water, just like a base. Metal oxides are basic oxides.'),
      safety: X('Handle the acid with care and do not touch the hot beaker. Copper compounds are harmful if swallowed.'),
      viva: [{ q: X('Why does the solution turn blue-green?'), a: X('Because copper(II) chloride is formed.') }, { q: X('Are metal oxides acidic or basic?'), a: X('Basic: they react with acids to give salt and water.') }, { q: X('Write the general equation.'), a: X('Metal oxide + acid → salt + water.') }] },
  },
  {
    id: 'dry_hcl', cls: 10, ch: C2, title: X('Does dry HCl gas behave as an acid?'),
    aim: X('To show that hydrogen chloride gas shows acidic behaviour only in the presence of water.'),
    kind: X('Acids need water to form H⁺ ions'),
    setup(K) {
      const salt = K.solid('salt', -0.42, -0.5); const t = K.add(K.A.boilingTube(), -0.2, -0.7); t.name = X('Dry boiling tube'); K.clampTube(t, -0.2, -0.7, BENCH_Y + 0.05);
      const acid = K.bottle('h2so4c', -0.42, -0.8); const db = K.strip('blue', 0.18, -0.46); db.name = X('Dry blue litmus paper'); const mb = K.strip('blue', 0.28, -0.46); K.moisten(mb);
      const end = V(K, 0.12, BENCH_Y + 0.2, -0.62);
      // a guard tube packed with anhydrous calcium chloride on the delivery tube keeps the gas dry
      const T = K.THREE; const gt = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.07, 20, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false, side: T.DoubleSide }));
      const gc = new T.Mesh(new T.CylinderGeometry(0.0068, 0.0068, 0.05, 16), new T.MeshStandardMaterial({ map: K.A.realTex('cacl2'), color: 0xf6f5f0, roughness: 0.9 }));
      const g = new T.Group(); g.add(gt, gc); g.rotation.z = Math.PI / 2; g.position.set(-0.04, BENCH_Y + 0.258, -0.66); K.app.scene.add(g); K.extras.push(g);
      return { salt, t, acid, db, mb, end };
    },
    steps: [
      { do: X('Put a spatula of dry common salt in the dry boiling tube.'), target: 'salt', act: (K, o) => K.spoonful(o.salt, o.t), ev: { type: 'spoon', v: 't' }, see: X('White salt at the bottom of the tube.') },
      { do: X('(Teacher) Add a little concentrated sulphuric acid and fit the cork with the delivery tube (through the calcium chloride guard tube).'), target: 'acid',
        act: async (K, o) => { await K.pour(o.acid, o.t, 2); K.outlet(o.t, o.end); await K.wait(4); }, ev: { type: 'pipe' },
        see: X('The salt fizzes. A colourless gas with a sharp, choking smell comes out of the delivery tube and forms white misty fumes in the moist air.'), why: X('Sodium chloride and sulphuric acid give hydrogen chloride gas. The calcium chloride in the guard tube removes moisture, so the gas is dry.') },
      { do: X('Hold dry blue litmus paper at the end of the delivery tube.'), target: 'db', act: (K, o) => K.holdPaper(o.db, o.end, 2.6, () => null), ev: { type: 'paper' },
        see: X('No change: the dry blue litmus paper stays blue.') },
      { do: X('Now hold moist blue litmus paper at the end of the tube.'), target: 'mb', act: (K, o) => K.holdPaper(o.mb, o.end, 2.6, () => ((o.t.gas.HCl || 0) > 0.05 ? new K.THREE.Color(RED) : null)), ev: { type: 'paper' },
        see: X('The moist blue litmus paper turns red at once.'), why: X('Hydrogen chloride forms hydrogen ions (H⁺) only when it dissolves in water. Dry HCl gas gives no H⁺ ions, so it does not act as an acid.') },
    ],
    eq: { word: 'Sodium chloride + sulphuric acid → sodium hydrogensulphate + hydrogen chloride · in water: HCl → H⁺ + Cl⁻', sym: 'NaCl + H₂SO₄ → NaHSO₄ + HCl↑ · HCl + H₂O → H₃O⁺ + Cl⁻' },
    result: { obs: X('Dry HCl gas did not change dry blue litmus; it turned moist blue litmus red.'),
      concl: X('The acidic behaviour of acids appears only in water, where they produce hydrogen ions (H⁺ or H₃O⁺).'),
      safety: X('Only the teacher handles concentrated sulphuric acid. HCl gas is corrosive: do it in a fume cupboard or near an open window and do not inhale it.'),
      viva: [{ q: X('Why does dry HCl gas not change the colour of dry litmus?'), a: X('Without water it cannot form H⁺ ions.') }, { q: X('What is the purpose of the calcium chloride guard tube?'), a: X('It absorbs moisture and keeps the gas dry.') }, { q: X('Which ion is responsible for acidic properties?'), a: X('The hydrogen ion, H⁺ (as H₃O⁺ in water).') }] },
  },
  {
    id: 'acid_dilution', cls: 10, ch: C2, title: X('Mixing an acid or a base with water'),
    aim: X('To show that dissolving a concentrated acid or a base in water gives out heat.'),
    kind: X('Dilution is exothermic'),
    setup(K) {
      const bA = K.beaker(-0.3, -0.64, 'water', 10, 100); bA.name = X('Beaker A: 10 mL water'); thermoIn(K, bA, V(K, 0.012, 0.004, 0.006)); const acid = K.bottle('h2so4c', -0.46, -0.82, { dropper: true });
      const bB = K.beaker(0.1, -0.64, 'water', 10, 100); bB.name = X('Beaker B: 10 mL water'); thermoIn(K, bB, V(K, 0.012, 0.004, 0.006)); const pel = K.solid('naohs', -0.06, -0.46); const rod = K.rod(0.24, -0.44);
      return { bA, acid, bB, pel, rod };
    },
    steps: [
      { do: X('Read the temperature of the water in beaker A.'), target: 'bA', act: (K) => K.sleep(1.5), see: X('Room temperature, about 27 °C.') },
      { do: X('(Teacher) Add concentrated sulphuric acid to the water drop by drop, swirling gently: always acid to water, never water to acid.'), target: 'acid', act: async (K, o) => { await K.drops(o.acid, o.bA, 10); await K.swirl(o.bA, 1.4); }, ev: { type: 'drops', to: 'bA' },
        see: X('The heavy, oily drops sink and mix in swirls. The temperature rises quickly and the beaker becomes hot.'), why: X('Mixing a concentrated acid with water is highly exothermic. If water were added to the acid, the heat could boil the mixture and splash acid out.') },
      { do: X('Put a few sodium hydroxide pellets in beaker B and stir until they dissolve.'), target: 'pel', act: async (K, o) => { await K.addSolid(o.pel, o.bB); await K.stir(o.rod, o.bB, 6); }, ev: { type: 'stir', v: 'bB' },
        see: X('The pellets dissolve and the temperature of the water rises by several degrees.'), why: X('Dissolving a base such as sodium hydroxide in water also gives out heat.') },
    ],
    eq: { word: 'Sulphuric acid + water → hydrogen ions + hydrogensulphate ions + heat · sodium hydroxide → sodium ions + hydroxide ions + heat', sym: 'H₂SO₄ + H₂O → H₃O⁺ + HSO₄⁻ + heat · NaOH(s) → Na⁺(aq) + OH⁻(aq) + heat' },
    result: { obs: X('Beaker A became hot as concentrated sulphuric acid was added; beaker B became warm as sodium hydroxide dissolved.'),
      concl: X('Dissolving an acid or a base in water is an exothermic process. Concentrated acid must always be added slowly to water, with stirring.'),
      safety: X('Concentrated sulphuric acid causes severe burns: only the teacher handles it, with goggles and gloves. Never touch sodium hydroxide pellets with your fingers.'),
      viva: [{ q: X('Why should acid be added to water and not water to acid?'), a: X('Adding water to concentrated acid releases so much heat that the mixture can boil and splash out.') }, { q: X('What is dilution?'), a: X('Mixing an acid or base with water, which lowers the concentration of H⁺ or OH⁻ ions per unit volume.') }, { q: X('Is dissolving NaOH in water exothermic or endothermic?'), a: X('Exothermic.') }] },
  },
  {
    id: 'cbse_hcl_naoh', cls: 10, ch: CP, title: X('Properties of hydrochloric acid and sodium hydroxide'),
    aim: X('To study the properties of dilute HCl and dilute NaOH with litmus solution, zinc metal and solid sodium carbonate.'),
    kind: X('Properties of acids and bases'),
    setup(K) {
      const rk = K.rack(-0.24, -0.8); const subs = ['hcl', 'naoh', 'hcl', 'naoh', 'hcl', 'naoh']; const t = subs.map((s, i) => K.tube(rk, i, s, 3));
      const nm = ['Test tube 1: dilute HCl', 'Test tube 2: dilute NaOH', 'Test tube 3: dilute HCl', 'Test tube 4: dilute NaOH', 'Test tube 5: dilute HCl', 'Test tube 6: dilute NaOH']; t.forEach((q, i) => { q.name = X(nm[i]); });
      const rk2 = K.add(K.A.rack(2), 0.26, -0.82); const lw = K.tube(rk2, 1, 'limewater', 8); lw.name = X('Lime water');
      const bl = K.bottle('bluelitmus', -0.46, -0.56, { dropper: true }); const rl = K.bottle('redlitmus', -0.36, -0.5, { dropper: true });
      const z1 = K.solid('zn', -0.22, -0.48); const z2 = K.solid('zn', -0.12, -0.48); const nc = K.solid('na2co3', -0.02, -0.48); const lamp = K.lamp(0.24, -0.58); const sp = K.splint(0.08, -0.42); const sp2 = K.splint(0.14, -0.42);
      return { rk, t1: t[0], t2: t[1], t3: t[2], t4: t[3], t5: t[4], t6: t[5], rk2, lw, bl, rl, z1, z2, nc, lamp, sp, sp2 };
    },
    steps: [
      { do: X('Add two drops of blue litmus solution to tube 1 (HCl) and two drops of red litmus solution to tube 2 (NaOH).'), target: 'bl', act: async (K, o) => { await K.drops(o.bl, o.t1, 2); await K.drops(o.rl, o.t2, 2); }, ev: { type: 'drops', to: 't2' },
        see: X('Blue litmus turns red in the acid. Red litmus turns blue in the base.'), why: X('Acids turn blue litmus red; bases turn red litmus blue.') },
      { do: X('Drop a zinc granule into tube 3 (HCl) and another into tube 4 (NaOH).'), target: 'z1', act: async (K, o) => { await K.addSolid(o.z1, o.t3); await K.addSolid(o.z2, o.t4); await K.sleep(1.5); }, ev: { type: 'add' },
        see: X('Tube 3 fizzes at once. Tube 4 shows almost no change while cold.') },
      { do: X('Light the spirit lamp and bring a burning splint to the mouth of tube 3.'), target: 'sp', act: async (K, o) => { await K.light(o.lamp); await K.splintTest(o.sp, o.t3, o.lamp); }, ev: { type: 'pop' },
        see: X('The gas burns with a pop sound: it is hydrogen.') },
      { do: X('Warm tube 4 gently, then test its gas with a burning splint.'), target: 't4', act: async (K, o) => { await K.heat(o.t4, o.lamp, 6, { lapse: 2 }); await K.splintTest(o.sp2, o.t4, o.lamp); }, ev: { type: 'pop' },
        see: X('On warming, bubbles form slowly on the zinc; the gas also burns with a pop.'), why: X('Zinc reacts with hot sodium hydroxide solution to form sodium zincate and hydrogen.') },
      { do: X('Add a pinch of solid sodium carbonate to tube 5 (HCl), fit the delivery tube and pass the gas into lime water.'), target: 'nc', act: async (K, o) => { await K.spoonful(o.nc, o.t5); K.pipe(o.t5, o.lw); await K.wait(5); }, ev: { type: 'pipe' },
        see: X('Brisk effervescence; the lime water turns milky.'), why: X('Acids react with carbonates to give carbon dioxide, which turns lime water milky.') },
      { do: X('Add a pinch of sodium carbonate to tube 6 (NaOH) and swirl.'), target: 't6', act: async (K, o) => { await K.spoonful(o.nc, o.t6); await K.swirl(o.t6, 1.5); }, ev: { type: 'spoon', v: 't6' },
        see: X('No gas is given off.'), why: X('Sodium carbonate does not react with a base.') },
    ],
    eq: { word: 'Zinc + hydrochloric acid → zinc chloride + hydrogen · zinc + sodium hydroxide → sodium zincate + hydrogen · sodium carbonate + hydrochloric acid → sodium chloride + water + carbon dioxide', sym: 'Zn + 2HCl → ZnCl₂ + H₂ · Zn + 2NaOH → Na₂ZnO₂ + H₂ · Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂' },
    result: { obs: X('HCl turned blue litmus red, gave hydrogen with zinc in the cold and carbon dioxide with sodium carbonate. NaOH turned red litmus blue, gave hydrogen with zinc only on warming, and did not react with sodium carbonate.'),
      concl: X('Dilute HCl is acidic: it reacts with active metals and with carbonates. Dilute NaOH is basic: it reacts with zinc on warming but not with carbonates.'),
      safety: X('Acids and alkalis are corrosive: wear goggles. Point the mouth of a tube being warmed away from everyone.'),
      viva: [{ q: X('Which gas is given off when zinc reacts with HCl or NaOH?'), a: X('Hydrogen.') }, { q: X('How do you test for carbon dioxide?'), a: X('It turns lime water milky.') }, { q: X('What colour does blue litmus turn in HCl?'), a: X('Red.') }] },
  },
  // ===================================================== Ch 3
  {
    id: 'metals_air', cls: 10, ch: C3, title: X('Do metals burn in air?'),
    aim: X('To compare how magnesium, copper, aluminium, zinc and iron behave when heated in a flame.'),
    kind: X('Reaction of metals with oxygen'),
    setup(K) {
      const bn = K.burner(0.06, -0.7); const tg = K.tongs(-0.12, -0.44); const sp = K.place(K.A3.sandpaper(), -0.3, -0.42);
      const rb = K.solid('mg', -0.44, -0.6); const cu = lay(K, K.A6.metalPiece('cu'), -0.34, -0.62, 0.2); const al = lay(K, K.A6.metalPiece('al'), -0.24, -0.64, -0.1); const zn = lay(K, K.A6.metalPiece('zn'), -0.14, -0.64, 0.15);
      const fil = K.solid('filings', 0.26, -0.5); const fs = lay(K, K.A4.flameSpatula(), 0.36, -0.46, -0.3); const spk = K.add(K.A6.sparks(), 0, -0.6);
      return { bn, tg, sp, rb, cu, al, zn, fil, fs, spk };
    },
    steps: [
      { do: X('Light the burner. Rub the copper and zinc strips with sandpaper to clean them.'), target: 'sp', act: async (K, o) => { await K.light(o.bn); await K.rub(o.cu, o.sp); o.cu.rubbed = true; await K.rub(o.zn, o.sp); o.zn.rubbed = true; }, ev: { type: 'rub' },
        see: X('The cleaned metals look shiny.') },
      { do: X('Hold the magnesium ribbon in the flame with tongs.'), target: 'rb', act: (K, o) => K.burnRibbon(o.rb, o.tg, o.bn), ev: { type: 'mg_burnt' },
        see: X('It burns with a dazzling white light and leaves white ash (magnesium oxide).'), why: X('Magnesium is a very reactive metal; it burns in air to form magnesium oxide.') },
      { do: X('Hold the copper strip in the hottest part of the flame (time-lapse).'), target: 'cu', act: (K, o) => K.holdIn(o.cu, o.bn, null, 6, { tilt: 1.0, lapse: 3 }), ev: { type: 'metal_heated' },
        see: X('Copper does not burn. It glows red-hot, gives the flame a green tinge, and becomes coated with a black layer of copper(II) oxide.') },
      { do: X('Hold the aluminium foil in the flame.'), target: 'al', act: (K, o) => K.holdIn(o.al, o.bn, null, 5, { tilt: 1.0, lapse: 2 }),
        see: X('The foil does not catch fire. Its thin edge may soften and droop.'), why: X('A thin layer of aluminium oxide on the surface protects the metal from further reaction.') },
      { do: X('Heat the zinc strip strongly (time-lapse).'), target: 'zn', act: (K, o) => K.holdIn(o.zn, o.bn, null, 6, { tilt: 1.0, lapse: 3 }), ev: { type: 'metal_heated' },
        see: X('Zinc gets coated with zinc oxide, which is yellow while hot and white when cold.') },
      { do: X('Take a few iron filings on the spatula and sprinkle them into the flame.'), target: 'fil', act: (K, o) => K.sprinkle(o.fs, o.fil, o.bn, o.spk, 3), ev: { type: 'sparks' },
        see: X('The filings burn as bright golden sparks.'), why: X('Fine filings have a large surface, so they burn in the flame; a solid iron nail would only become red-hot.') },
    ],
    eq: { word: 'Metal + oxygen → metal oxide', sym: '2Mg + O₂ → 2MgO · 2Cu + O₂ → 2CuO · 4Al + 3O₂ → 2Al₂O₃ · 2Zn + O₂ → 2ZnO · 3Fe + 2O₂ → Fe₃O₄' },
    result: { obs: X('Magnesium burned with a dazzling white flame; iron filings burned as sparks; copper did not burn but turned black; aluminium did not burn; zinc became coated with an oxide that was yellow when hot and white when cold.'),
      concl: X('Metals combine with oxygen to form metal oxides, but they react with different vigour: magnesium is the most reactive of these and copper the least. (Sodium and potassium react so fast that they are kept under kerosene.)'),
      safety: X('Do not look straight at burning magnesium. Hold samples with tongs, keep your face away from the flame, and put hot pieces on a tile to cool.'),
      viva: [{ q: X('Which of these metals burned with a dazzling white light?'), a: X('Magnesium.') }, { q: X('Why does aluminium foil not burn easily?'), a: X('It is protected by a thin layer of aluminium oxide.') }, { q: X('Why are sodium and potassium stored under kerosene?'), a: X('They react so vigorously with oxygen and moisture in the air that they can catch fire.') }] },
  },
  {
    id: 'metals_water', cls: 10, ch: C3, title: X('How do metals react with water?'),
    aim: X('To compare the reactions of sodium, calcium, magnesium, aluminium, zinc and iron with cold and hot water.'),
    kind: X('Reactivity of metals with water'),
    setup(K) {
      const b1 = K.beaker(-0.38, -0.64, 'water', 120, 250); b1.name = X('Beaker 1: cold water (for sodium)'); const ker = K.bottle('kerosene', -0.48, -0.86); ker.name = X('Sodium kept under kerosene');
      const na = K.solid('na', -0.46, -0.46); na.name = X('Sodium (a small piece, blotted dry)');
      const ph = K.bottle('phenol', -0.24, -0.86, { dropper: true });
      const b2 = K.beaker(-0.16, -0.62, 'water', 120, 250); b2.name = X('Beaker 2: cold water (for calcium)'); const ca = K.solid('ca', -0.22, -0.46);
      const b3 = K.beaker(0.06, -0.62, 'water', 120, 250); b3.name = X('Beaker 3: cold water (for magnesium)'); const m1 = K.solid('mg', 0.0, -0.46); const m2 = K.solid('mg', 0.1, -0.46);
      const tp = K.tripod(0.3, -0.72); const lamp = K.lamp(0.3, -0.52); const b4 = K.beaker(0.3, -0.72, 'water', 120, 250); b4.name = X('Beaker 4: hot water'); b4.maxT = 85;
      const b5 = K.beaker(0.44, -0.56, 'water', 120, 250); b5.name = X('Beaker 5: hot water'); const al = K.solid('al', 0.2, -0.44); const zn = K.solid('zn', 0.3, -0.42); const fe = K.solid('fe', 0.4, -0.42);
      return { b1, ker, na, ph, b2, ca, b3, m1, m2, tp, lamp, b4, b5, al, zn, fe };
    },
    steps: [
      { do: X('(Teacher, from a safe distance) Drop the small piece of sodium into beaker 1 of cold water.'), target: 'na', act: async (K, o) => { await K.addSolid(o.na, o.b1); await K.wait(14); }, ev: { type: 'add' },
        see: X('Sodium floats, melts into a shiny silvery ball and darts about on the water with a hissing sound. It may catch fire with a yellow flame. Soon it is used up.'), why: X('Sodium reacts violently with cold water, giving sodium hydroxide and hydrogen; so much heat is produced that the hydrogen can catch fire.') },
      { do: X('Add two drops of phenolphthalein to beaker 1.'), target: 'ph', act: (K, o) => K.drops(o.ph, o.b1, 2), ev: { type: 'drops', to: 'b1' }, see: X('The water turns pink: a base (sodium hydroxide) has formed.') },
      { do: X('Drop calcium granules into beaker 2 of cold water (time-lapse).'), target: 'ca', act: async (K, o) => { await K.addSolid(o.ca, o.b2); await K.wait(10, 4); }, ev: { type: 'add' },
        see: X('Calcium sinks, then starts to float as bubbles of hydrogen stick to it. The water turns milky.'), why: X('Calcium reacts less violently: it forms calcium hydroxide (milky, slightly soluble) and hydrogen. The heat is not enough to set the hydrogen on fire.') },
      { do: X('Put a piece of magnesium ribbon into beaker 3 of cold water (time-lapse).'), target: 'm1', act: async (K, o) => { await K.addSolid(o.m1, o.b3); await K.wait(8, 30); }, ev: { type: 'add' },
        see: X('Almost nothing happens; only a few tiny bubbles stick to the ribbon after a long time.') },
      { do: X('Heat beaker 4 of water on the tripod. Put the other magnesium ribbon into the hot water and add a drop of phenolphthalein.'), target: 'b4',
        act: async (K, o) => { await K.onTripod(o.b4, o.tp, o.lamp); await K.light(o.lamp); await K.wait(5, 25); await K.addSolid(o.m2, o.b4); await K.drops(o.ph, o.b4, 2); await K.wait(8, 4); }, ev: { type: 'lit' },
        see: X('Bubbles of hydrogen form on the ribbon, it starts to float, and the water turns pink.'), why: X('Magnesium reacts with hot water to form magnesium hydroxide (a base) and hydrogen.') },
      { do: X('Put aluminium, zinc and iron pieces into beaker 5 of hot water.'), target: 'b5', act: async (K, o) => { o.b5.mix.temp = 80; await K.addSolid(o.al, o.b5); await K.addSolid(o.zn, o.b5); await K.addSolid(o.fe, o.b5); await K.wait(5, 4); }, ev: { type: 'add' },
        see: X('There is no reaction with hot water.'), why: X('Aluminium, iron and zinc react neither with cold nor with hot water; they react only with steam to form a metal oxide and hydrogen.') },
    ],
    eq: { word: 'Sodium + water → sodium hydroxide + hydrogen + heat · calcium + water → calcium hydroxide + hydrogen · magnesium + hot water → magnesium hydroxide + hydrogen', sym: '2Na + 2H₂O → 2NaOH + H₂ · Ca + 2H₂O → Ca(OH)₂ + H₂ · Mg + 2H₂O → Mg(OH)₂ + H₂ · 3Fe + 4H₂O(steam) → Fe₃O₄ + 4H₂' },
    result: { obs: X('Sodium reacted violently with cold water; calcium reacted steadily (milky water, it floated); magnesium hardly reacted with cold water but gave bubbles in hot water; aluminium, zinc and iron did not react with hot water.'),
      concl: X('Metals differ in reactivity with water: Na > Ca > Mg > Al, Zn, Fe. Metals that react with water form a metal hydroxide (a base) and hydrogen.'),
      safety: X('Sodium is handled only by the teacher, with tongs, behind a screen; it is stored under kerosene. Keep your face away from the beakers. Hot water and steam can scald.'),
      viva: [{ q: X('Why does sodium float and dart about on water?'), a: X('It is lighter than water, and the hydrogen produced beneath it pushes it around.') }, { q: X('Why does calcium start floating?'), a: X('Bubbles of hydrogen stick to its surface.') }, { q: X('Which metals react only with steam?'), a: X('Aluminium, iron and zinc.') }] },
  },
  // ===================================================== Ch 4
  {
    id: 'carbon_burn', cls: 10, ch: C4, title: X('Burning carbon compounds and the Bunsen flame'),
    aim: X('To compare the flames of naphthalene, camphor and alcohol, and to see how the Bunsen burner flame changes with its air hole.'),
    kind: X('Combustion: sooty and clean flames'),
    setup(K) {
      const tile = K.add(K.A4.whiteTile(0.36, 0.09), -0.22, -0.66); void tile;
      const d1 = K.add(K.A6.burnDish('naph'), -0.34, -0.66, { y: BENCH_Y + 0.006 }); d1.name = X('Dish 1: naphthalene'); const d2 = K.add(K.A6.burnDish('camphor'), -0.22, -0.66, { y: BENCH_Y + 0.006 }); d2.name = X('Dish 2: camphor');
      const d3 = K.add(K.A6.burnDish('ethanol'), -0.1, -0.66, { y: BENCH_Y + 0.006 }); d3.name = X('Dish 3: alcohol (ethanol)');
      const p1 = lay(K, K.A6.sootPlate(), -0.36, -0.46); const p2 = lay(K, K.A6.sootPlate(), -0.22, -0.46); const p3 = lay(K, K.A6.sootPlate(), -0.08, -0.46); const p4 = lay(K, K.A6.sootPlate(), 0.36, -0.46);
      [p1, p2, p3, p4].forEach((p, i) => { p.name = X(['Metal plate 1', 'Metal plate 2', 'Metal plate 3', 'Metal plate 4'][i]); p.g.rotation.set(0, 0.2, 0); p.home = { p: p.g.position.clone(), q: p.g.quaternion.clone() }; });
      const lamp = K.lamp(0.08, -0.8); const sp = K.splint(0.1, -0.46); const bn = K.burner(0.26, -0.7);
      return { d1, d2, d3, p1, p2, p3, p4, lamp, sp, bn };
    },
    steps: [
      { do: X('(Teacher) Light the naphthalene in dish 1 with a burning splint.'), target: 'd1', act: async (K, o) => { await K.light(o.lamp); await K.ignite(o.d1, o.sp, o.lamp); await K.sleep(1); }, ev: { type: 'lit' },
        see: X('It burns with a yellow, smoky flame and gives off thick black smoke.') },
      { do: X('Hold metal plate 1 over the flame for a while.'), target: 'p1', act: (K, o) => K.holdIn(o.p1, o.d1, V(K, 0, 0.07, 0), 4, { q: new K.THREE.Quaternion(), lapse: 2 }), ev: { type: 'soot' },
        see: X('Black soot collects on the plate.'), why: X('Naphthalene has a lot of carbon; it does not burn completely, and the unburnt carbon appears as soot.') },
      { do: X('Light the camphor in dish 2 and hold plate 2 over it.'), target: 'd2', act: async (K, o) => { await K.ignite(o.d2, o.sp, o.lamp); await K.holdIn(o.p2, o.d2, V(K, 0, 0.07, 0), 4, { q: new K.THREE.Quaternion(), lapse: 2 }); }, ev: { type: 'soot' },
        see: X('Camphor also burns with a smoky yellow flame and leaves soot on the plate.') },
      { do: X('Light the alcohol in dish 3 and hold plate 3 over it.'), target: 'd3', act: async (K, o) => { await K.ignite(o.d3, o.sp, o.lamp); await K.holdIn(o.p3, o.d3, V(K, 0, 0.06, 0), 4, { q: new K.THREE.Quaternion(), lapse: 2 }); }, ev: { type: 'lit' },
        see: X('Alcohol burns with a clean, pale blue flame. There is no smoke and no soot on the plate.'), why: X('Alcohol (a saturated compound) burns completely to carbon dioxide and water, giving a clean blue flame.') },
      { do: X('Close the air hole of the Bunsen burner, light it and hold plate 4 over the flame.'), target: 'bn', act: async (K, o) => { await K.airHole(o.bn, false); await K.light(o.bn); await K.holdIn(o.p4, o.bn, V(K, 0, o.bn.height + 0.11, 0), 4, { q: new K.THREE.Quaternion(), lapse: 2 }); }, ev: { type: 'soot' },
        see: X('The flame is tall, wavy and yellow (luminous), and it leaves soot on the plate.') },
      { do: X('Now slowly open the air hole.'), target: 'bn', act: async (K, o) => { await K.airHole(o.bn, true); await K.sleep(2); }, ev: { type: 'air' },
        see: X('The flame becomes short, steady and blue, and it makes no soot.'), why: X('With the air hole open, enough oxygen mixes with the gas for complete combustion. With too little oxygen, burning is incomplete and carbon particles glow yellow and form soot.') },
    ],
    eq: { word: 'Complete combustion: carbon compound + oxygen → carbon dioxide + water + heat and light', sym: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O · C₁₀H₈ + 12O₂ → 10CO₂ + 4H₂O (in limited air, soot C is left)' },
    result: { obs: X('Naphthalene and camphor burned with sooty yellow flames and blackened the plates; alcohol burned with a clean blue flame. The Bunsen flame was yellow and sooty with the air hole closed and blue and clean with it open.'),
      concl: X('Carbon compounds burn in oxygen to give carbon dioxide and water. With enough air, burning is complete and the flame is blue; with too little air, it is incomplete, yellow and sooty.'),
      safety: X('Burning naphthalene and camphor is done by the teacher in a ventilated place. Keep flammable bottles away from flames and hold the plates with tongs.'),
      viva: [{ q: X('Why does naphthalene burn with a sooty flame?'), a: X('It has a high proportion of carbon and burns incompletely, leaving unburnt carbon (soot).') }, { q: X('Why is the Bunsen flame blue when the air hole is open?'), a: X('Enough oxygen mixes with the gas, so combustion is complete.') }, { q: X('Why do cooking vessels get blackened on a gas stove?'), a: X('The air holes are blocked, so the fuel burns incompletely and leaves soot.') }] },
  },
  {
    id: 'ethanol_kmno4', cls: 10, ch: C4, title: X('Oxidation of ethanol by alkaline potassium permanganate'),
    aim: X('To study the oxidation of ethanol by warm alkaline potassium permanganate solution.'),
    kind: X('Oxidation of alcohols'),
    setup(K) {
      const tp = K.tripod(0.06, -0.7); const bn = K.burner(0.28, -0.6); const bath = K.beaker(-0.18, -0.7, 'water', 150, 250); bath.name = X('Water bath'); bath.maxT = 62; thermoIn(K, bath, V(K, 0.03, 0.004, 0.012));
      const rk = K.rack(-0.34, -0.5); const t = K.tube(rk, 3, 'ethanol', 3); t.name = X('Test tube with 3 mL ethanol'); const km = K.bottle('kmno4alk', -0.46, -0.82, { dropper: true });
      return { tp, bn, bath, rk, t, km };
    },
    steps: [
      { do: X('Put the water bath on the tripod and heat it to about 60 °C.'), target: 'bath', act: async (K, o) => { await K.onTripod(o.bath, o.tp, o.bn); await K.light(o.bn); await K.wait(8, 16); }, ev: { type: 'lit' }, see: X('The water bath warms up to about 60 °C.') },
      { do: X('Stand the test tube of ethanol in the warm water bath.'), target: 't', act: async (K, o) => { await intoBathAt(K, o.t, o.bath); await K.wait(4, 8); }, ev: { type: 'bath' }, see: X('The ethanol warms up.') },
      { do: X('Add alkaline potassium permanganate solution one drop at a time, shaking after each drop.'), target: 'km', act: async (K, o) => { await K.dropsUntil(o.km, o.t, () => false, 3, 1.6); }, ev: { type: 'drops', to: 't' },
        see: X('The purple colour of each drop disappears on shaking, and the liquid becomes slightly brownish.'), why: X('Potassium permanganate gives oxygen to ethanol and is itself used up, so its colour goes.') },
      { do: X('Keep adding drops until the purple colour no longer disappears.'), target: 't', act: async (K, o) => { o.n = await K.dropsUntil(o.km, o.t, (v) => (v.mix.liq.kmno4alk || 0) > 0.035, 24, 1.6); }, ev: { type: 'drops', to: 't' }, until: (K, o) => (o.t.mix.liq.kmno4alk || 0) > 0.035, // by hand: done when the purple stays
        see: X('After a number of drops the pink-purple colour stays: no more ethanol is left to be oxidised.'), why: X('Alkaline KMnO₄ is an oxidising agent. It oxidises ethanol to ethanoic acid; once the ethanol is used up, the excess permanganate stays purple.') },
    ],
    eq: { word: 'Ethanol —alkaline KMnO₄, heat→ ethanoic acid', sym: 'CH₃CH₂OH + 2[O] → CH₃COOH + H₂O' },
    result: { obs: X('The purple colour of the first drops of alkaline KMnO₄ disappeared in warm ethanol; after more drops the colour persisted.'),
      concl: X('Alkaline potassium permanganate oxidises ethanol to ethanoic acid. Substances that give oxygen to others are called oxidising agents.'),
      safety: X('Ethanol is flammable: warm it only in a water bath, never over a flame. Potassium permanganate stains skin and clothes.'),
      viva: [{ q: X('What is the role of alkaline KMnO₄ here?'), a: X('It is an oxidising agent.') }, { q: X('What is ethanol oxidised to?'), a: X('Ethanoic acid (acetic acid).') }, { q: X('Why does the purple colour finally persist?'), a: X('All the ethanol has been oxidised, so the extra permanganate is not used up.') }] },
  },
  {
    id: 'na_ethanol', cls: 10, ch: C4, title: X('Sodium and ethanol'),
    aim: X('To show that ethanol reacts with sodium to give hydrogen gas.'),
    kind: X('Reaction of alcohols with sodium'),
    setup(K) {
      const rk = K.rack(-0.3, -0.76); const t = K.tube(rk, 2, 'ethanol', 6, { boiling: true }); t.name = X('Dry boiling tube with ethanol'); const ker = K.bottle('kerosene', -0.46, -0.52); ker.name = X('Sodium kept under kerosene');
      const na = K.solid('na', -0.18, -0.5); na.name = X('Sodium (a small piece, blotted dry)');
      const lamp = K.lamp(0.14, -0.66); const sp = K.splint(0.02, -0.46);
      return { rk, t, ker, na, lamp, sp };
    },
    steps: [
      { do: X('(Teacher) Drop the small piece of sodium into the ethanol.'), target: 'na', act: async (K, o) => { await K.addSolid(o.na, o.t); await K.wait(6); }, ev: { type: 'add' },
        see: X('Sodium sinks and gives a steady stream of bubbles, much more gently than with water. There is no fire; the tube becomes warm.') },
      { do: X('Light the lamp and bring a burning splint to the mouth of the tube.'), target: 'sp', act: async (K, o) => { await K.light(o.lamp); await K.splintTest(o.sp, o.t, o.lamp); }, ev: { type: 'pop' },
        see: X('The gas burns with a pop: it is hydrogen.') },
      { do: X('Leave the tube until all the sodium has reacted (time-lapse).'), target: 't', act: (K) => K.wait(8, 25),
        see: X('The sodium slowly disappears. Sodium ethoxide stays dissolved; on evaporation it is left as a white solid.'), why: X('Sodium replaces the hydrogen of the –OH group of ethanol, forming sodium ethoxide and hydrogen gas.') },
    ],
    eq: { word: 'Sodium + ethanol → sodium ethoxide + hydrogen', sym: '2Na + 2CH₃CH₂OH → 2CH₃CH₂ONa + H₂' },
    result: { obs: X('Sodium reacted steadily with ethanol, giving bubbles of a gas that burned with a pop.'),
      concl: X('Ethanol reacts with sodium to give sodium ethoxide and hydrogen, but much less vigorously than water does.'),
      safety: X('This is only a teacher demonstration: sodium is very reactive. Keep water away and use only a small piece; ethanol is flammable.'),
      viva: [{ q: X('Which gas is evolved when sodium reacts with ethanol?'), a: X('Hydrogen.') }, { q: X('Name the other product.'), a: X('Sodium ethoxide, CH₃CH₂ONa.') }, { q: X('Is the reaction with ethanol more or less vigorous than with water?'), a: X('Less vigorous.') }] },
  },
  {
    id: 'ethanoic_props', cls: 10, ch: C4, title: X('Properties of ethanoic acid'),
    aim: X('To study the odour, solubility in water, effect on litmus and reaction with sodium hydrogencarbonate of ethanoic acid.'),
    kind: X('Properties of ethanoic acid'),
    setup(K) {
      const ea = K.bottle('ethanoic', -0.46, -0.82); const hcl = K.bottle('hcl', -0.34, -0.84); const rk = K.rack(-0.04, -0.78);
      const t1 = K.tube(rk, 0, 'water', 2); t1.name = X('Test tube 1: 2 mL water'); const t2 = K.tube(rk, 1, 'ethanoic', 3); t2.name = X('Test tube 2: ethanoic acid'); const t3 = K.tube(rk, 2, 'ethanoic', 3); t3.name = X('Test tube 3: ethanoic acid');
      const t5 = K.tube(rk, 4, 'hcl', 3); t5.name = X('Test tube 5: dilute HCl'); const rk2 = K.add(K.A.rack(2), 0.32, -0.8); const lw = K.tube(rk2, 1, 'limewater', 8); lw.name = X('Lime water');
      const bs = K.strip('blue', -0.3, -0.48); const rs = K.strip('red', -0.22, -0.48); const p1 = K.strip('ph', -0.14, -0.48); const p2 = K.strip('ph', -0.06, -0.48); const sb = K.solid('nahco3', 0.14, -0.5);
      return { ea, hcl, rk, t1, t2, t3, t5, rk2, lw, bs, rs, p1, p2, sb };
    },
    steps: [
      { do: X('Carefully waft the smell of ethanoic acid from the bottle towards your nose.'), target: 'ea', act: (K, o) => sniff(K, o.ea), ev: { type: 'sniff' }, see: X('A sharp, sour smell of vinegar.') },
      { do: X('Add 1 mL of ethanoic acid to 2 mL of water in test tube 1 and shake.'), target: 't1', act: async (K, o) => { await K.pour(o.ea, o.t1, 1); await K.shakeThumb(o.t1, 1.4); }, ev: { type: 'pour', to: 't1' },
        see: X('It mixes completely to give a clear solution with no layers: ethanoic acid dissolves in water.') },
      { do: X('Dip blue and red litmus paper in test tube 2 (ethanoic acid).'), target: 'bs', act: async (K, o) => { await K.dip(o.bs, o.t2); await K.dip(o.rs, o.t2); }, ev: { type: 'dip' },
        see: X('Blue litmus turns red; red litmus stays red. Ethanoic acid is an acid.') },
      { do: X('Dip pH paper in ethanoic acid (tube 2) and another in dilute hydrochloric acid (tube 5), and compare.'), target: 'p1', act: async (K, o) => { await K.dip(o.p1, o.t2); await K.dip(o.p2, o.t5); }, ev: { type: 'dip' },
        see: X('Ethanoic acid gives an orange colour (pH about 3); hydrochloric acid gives red (pH about 1 or less).'), why: X('Ethanoic acid ionises only partly in water, so it gives fewer H⁺ ions: it is a weak acid. HCl ionises completely: it is a strong acid.') },
      { do: X('Add a spatula of sodium hydrogencarbonate to test tube 3, fit the delivery tube and pass the gas into lime water.'), target: 'sb', act: async (K, o) => { await K.spoonful(o.sb, o.t3); K.pipe(o.t3, o.lw); await K.wait(5); }, ev: { type: 'pipe' },
        see: X('Brisk effervescence; the gas turns the lime water milky: carbon dioxide.') },
    ],
    eq: { word: 'Ethanoic acid + sodium hydrogencarbonate → sodium ethanoate + water + carbon dioxide', sym: 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂' },
    result: { obs: X('Ethanoic acid smelled of vinegar, mixed completely with water, turned blue litmus red, gave pH about 3 (HCl about 1), and gave carbon dioxide with sodium hydrogencarbonate.'),
      concl: X('Ethanoic acid is a weak acid that is soluble in water and reacts with carbonates and hydrogencarbonates to give carbon dioxide.'),
      safety: X('Do not smell the acid directly; waft it. Glacial ethanoic acid burns the skin; dilute acid is used here.'),
      viva: [{ q: X('Why is ethanoic acid called a weak acid?'), a: X('It ionises only partly in water, giving few H⁺ ions.') }, { q: X('What is vinegar?'), a: X('A 5–8% solution of ethanoic acid in water.') }, { q: X('Why is pure ethanoic acid called glacial acetic acid?'), a: X('It freezes into ice-like crystals in cold weather (melting point about 17 °C).') }] },
  },
  {
    id: 'esterification', cls: 10, ch: C4, title: X('Making an ester'),
    aim: X('To prepare an ester (ethyl ethanoate) from ethanol and ethanoic acid.'),
    kind: X('Esterification'),
    setup(K) {
      const rk = K.rack(-0.36, -0.52); const t = K.tube(rk, 3); t.name = X('Test tube'); const et = K.bottle('ethanol', -0.46, -0.84); const gl = K.bottle('glacial', -0.34, -0.86); const ac = K.bottle('h2so4c', -0.2, -0.88, { dropper: true });
      const tp = K.tripod(0.06, -0.7); const bn = K.burner(0.06, -0.48); const bath = K.beaker(-0.14, -0.7, 'water', 150, 250); bath.name = X('Water bath (about 60 °C)'); bath.mix.temp = 58; bath.maxT = 62; thermoIn(K, bath, V(K, 0.03, 0.004, 0.012));
      const wb = K.beaker(0.3, -0.62, 'water', 25, 100); wb.name = X('Beaker with water'); K.A6.floatLayer(wb, ['ester'], 0xf4f2e6);
      return { rk, t, et, gl, ac, tp, bn, bath, wb };
    },
    steps: [
      { do: X('Take 1 mL of ethanol in the test tube and add 1 mL of glacial ethanoic acid.'), target: 'et', act: async (K, o) => { await K.pour(o.et, o.t, 1); await K.pour(o.gl, o.t, 1); }, ev: { type: 'pour', to: 't' }, see: X('A clear, colourless mixture.') },
      { do: X('Smell the mixture carefully.'), target: 't', act: (K, o) => sniff(K, o.t), ev: { type: 'sniff' }, see: X('It smells sharply of vinegar.') },
      { do: X('(Teacher) Add a few drops of concentrated sulphuric acid.'), target: 'ac', act: (K, o) => K.drops(o.ac, o.t, 3), ev: { type: 'drops', to: 't' }, see: X('No visible change.'), why: X('Sulphuric acid is a catalyst: it speeds up the reaction.') },
      { do: X('Warm the tube in the water bath at about 60 °C for at least five minutes (time-lapse).'), target: 'bath', act: async (K, o) => { await K.onTripod(o.bath, o.tp, o.bn); await K.light(o.bn); await intoBathAt(K, o.t, o.bath); await K.wait(12, 40); await K.extinguish(o.bn); }, ev: { type: 'bath' },
        see: X('The mixture stays clear, but slowly a new substance forms.') },
      { do: X('Pour the warm mixture into the beaker of water and smell it.'), target: 'wb', act: async (K, o) => { o.t.bath = null; await K.pour(o.t, o.wb, o.t.ml); await K.sleep(1); await sniff(K, o.wb); }, ev: { type: 'sniff', v: 'wb' },
        see: X('A sweet, fruity smell, like nail-polish remover. A thin, oily, colourless layer floats on the water.'), why: X('Ethanol and ethanoic acid react, with sulphuric acid as a catalyst, to form the ester ethyl ethanoate. Esters have sweet smells and are used in perfumes and flavours.') },
    ],
    eq: { word: 'Ethanoic acid + ethanol —conc. H₂SO₄→ ethyl ethanoate (ester) + water', sym: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O' },
    result: { obs: X('The vinegar smell of the mixture changed to a sweet, fruity smell; an oily layer floated on water.'),
      concl: X('Carboxylic acids react with alcohols in the presence of an acid catalyst to form sweet-smelling esters (esterification).'),
      safety: X('Only the teacher adds concentrated sulphuric acid. Ethanol is flammable: warm only in a water bath. Waft smells; do not sniff directly.'),
      viva: [{ q: X('What is esterification?'), a: X('The reaction of a carboxylic acid with an alcohol to form an ester.') }, { q: X('What is the role of concentrated sulphuric acid?'), a: X('It is a catalyst (and removes water).') }, { q: X('Give one use of esters.'), a: X('In perfumes and as flavouring agents.') }] },
  },
  {
    id: 'soap_micelle', cls: 10, ch: C4, title: X('How soap cleans: oil, water and soap'),
    aim: X('To show how soap helps oil to mix with water.'),
    kind: X('Micelles and cleansing action of soap'),
    setup(K) {
      const rk = K.rack(-0.2, -0.76); const tA = K.tube(rk, 1, 'water', 10); const tB = K.tube(rk, 4, 'water', 10); K.lab.fill(tA, 'oil', 0.4); K.lab.fill(tB, 'oil', 0.4);
      tA.name = X('Test tube A: water and a drop of oil'); tB.name = X('Test tube B: water and a drop of oil'); K.A6.floatLayer(tA, ['oil']); K.A6.floatLayer(tB, ['oil']);
      const soap = K.bottle('soap', 0.22, -0.56, { dropper: true });
      return { rk, tA, tB, soap };
    },
    steps: [
      { do: X('Look at test tubes A and B: each has 10 mL of water and a drop of cooking oil.'), target: 'tA', act: (K) => K.sleep(1.5), see: X('The oil floats on the water as a separate layer: oil and water do not mix.') },
      { do: X('Add a few drops of soap solution to test tube B only.'), target: 'soap', act: (K, o) => K.drops(o.soap, o.tB, 4), ev: { type: 'drops', to: 'tB' }, see: X('The soap solution goes into tube B.') },
      { do: X('Shake both tubes vigorously for the same time.'), target: 'tB', act: async (K, o) => { await K.shakeThumb(o.tA, 2); await K.shakeThumb(o.tB, 2); }, ev: { type: 'shake' },
        see: X('Both tubes look milky just after shaking: the oil has broken into tiny drops.') },
      { do: X('Leave both tubes undisturbed and watch (time-lapse).'), target: 'tA', act: (K) => K.wait(10, 6),
        see: X('In tube A the oil drops quickly rise and join into a layer again. Tube B stays milky for a long time.'), why: X('Soap molecules have a long hydrocarbon tail that dissolves in oil and an ionic head that stays in water. They surround oil drops to form micelles, so the oil stays spread through the water (an emulsion). This is how soap washes oily dirt away.') },
    ],
    eq: { word: 'Soap (sodium stearate) in water → stearate ions (oil-loving tail, water-loving head) + sodium ions', sym: 'C₁₇H₃₅COONa → C₁₇H₃₅COO⁻ + Na⁺' },
    result: { obs: X('Without soap the oil separated within a minute; with soap the mixture stayed milky (an emulsion) for a long time.'),
      concl: X('Soap forms micelles that trap oil drops and keep them suspended in water; the oily dirt is then rinsed away.'),
      safety: X('Close the tube with your thumb (or a cork) while shaking, and wash your hands afterwards.'),
      viva: [{ q: X('What is a micelle?'), a: X('A cluster of soap molecules with their tails inside (holding oil) and their ionic heads facing the water.') }, { q: X('Which part of a soap molecule dissolves in oil?'), a: X('The long hydrocarbon tail (hydrophobic part).') }, { q: X('Why does oil not mix with water on its own?'), a: X('Oil is non-polar and water is polar, so they do not dissolve in each other.') }] },
  },
  {
    id: 'soap_hard', cls: 10, ch: C4, title: X('Soap in soft and hard water'),
    aim: X('To compare the foaming of soap in distilled water and in hard water, and of a detergent in hard water.'),
    kind: X('Hard water, soap and detergents'),
    setup(K) {
      const rk = K.rack(-0.2, -0.78); const t1 = K.tube(rk, 1, 'water', 10); const t2 = K.tube(rk, 3, 'hardwater', 10); const t3 = K.tube(rk, 5, 'hardwater', 10);
      t1.name = X('Test tube 1: distilled water'); t2.name = X('Test tube 2: hard water'); t3.name = X('Test tube 3: hard water'); for (const t of [t1, t2, t3]) K.A6.foam(t);
      const soap = K.bottle('soap', -0.44, -0.56, { dropper: true }); const det = K.bottle('detergent', -0.34, -0.5, { dropper: true }); const rl = lay(K, K.A6.ruler(), 0.24, -0.5, 0.3);
      return { rk, t1, t2, t3, soap, det, rl };
    },
    steps: [
      { do: X('Add five drops of soap solution to test tube 1 (distilled water) and test tube 2 (hard water).'), target: 'soap', act: async (K, o) => { await K.drops(o.soap, o.t1, 5); await K.drops(o.soap, o.t2, 5); await K.sleep(1); }, ev: { type: 'drops', to: 't2' },
        see: X('In tube 2 (hard water) a white, curdy scum appears.') },
      { do: X('Close each tube with your thumb and shake it ten times.'), target: 't1', act: async (K, o) => { await K.shakeThumb(o.t1, 2.2); await K.shakeThumb(o.t2, 2.2); }, ev: { type: 'shake' },
        see: X('Tube 1 fills with a tall lather. Tube 2 gives very little lather and looks cloudy.') },
      { do: X('Measure the height of the lather in tubes 1 and 2 with the scale.'), target: 'rl', act: async (K, o) => { const lab = (cm) => `${tl(K, X('Lather'))}: ${cm.toFixed(1)} cm`; o.h1 = await K.measureFoam(o.rl, o.t1, lab); o.h2 = await K.measureFoam(o.rl, o.t2, lab); }, ev: { type: 'measure' },
        see: X('Distilled water: about 3 cm of lather that lasts. Hard water: less than 1 cm, which soon collapses.'), why: X('Calcium and magnesium salts in hard water react with soap to form an insoluble scum, so much of the soap is wasted.') },
      { do: X('Add five drops of detergent solution to test tube 3 (hard water), shake it ten times and measure the lather.'), target: 'det', act: async (K, o) => { await K.drops(o.det, o.t3, 5); await K.shakeThumb(o.t3, 2.2); o.h3 = await K.measureFoam(o.rl, o.t3, (cm) => `${tl(K, X('Lather'))}: ${cm.toFixed(1)} cm`); }, ev: { type: 'measure' },
        see: X('A good lather forms and there is no scum.'), why: X('Detergents do not form insoluble compounds with calcium and magnesium ions, so they work well even in hard water.') },
    ],
    eq: { word: 'Soap + calcium ions (hard water) → calcium soap (scum) + sodium ions', sym: '2C₁₇H₃₅COONa + Ca²⁺ → (C₁₇H₃₅COO)₂Ca↓ + 2Na⁺' },
    result: { obs: X('Soap gave a tall, lasting lather in distilled water but little lather and a curdy scum in hard water. The detergent lathered well in hard water.'),
      concl: X('Hard water wastes soap by forming scum; detergents lather well in both soft and hard water.'),
      safety: X('Shake with the thumb firmly on the mouth of the tube; wash your hands afterwards.'),
      viva: [{ q: X('What makes water hard?'), a: X('Dissolved calcium and magnesium salts (hydrogencarbonates, chlorides and sulphates).') }, { q: X('What is scum?'), a: X('The insoluble calcium/magnesium salt of the fatty acid, formed when soap reacts with hard water.') }, { q: X('Why are detergents better in hard water?'), a: X('They do not form scum with calcium and magnesium ions.') }] },
  },
  // ===================================================== Lab manual
  {
    id: 'co2_prep', cls: 10, ch: CL, title: X('Preparing carbon dioxide and testing it'),
    aim: X('To prepare carbon dioxide from marble chips and dilute hydrochloric acid and to study its properties.'),
    kind: X('Preparation and properties of a gas'),
    setup(K) {
      const fl = K.add(K.A.conicalFlask(250), -0.2, -0.76); fl.name = X('Woulfe bottle (flask)'); const th = K.add(K.A6.thistleFunnel(), -0.205, -0.76, { y: BENCH_Y + 0.004 }); th.drainTo = fl;
      const ch = K.solid('caco3', -0.44, -0.5); ch.amount = 1.6; const hcl = K.bottle('hcl', -0.44, -0.82);
      const j1 = K.add(K.A3.gasJar(), 0.08, -0.74); j1.name = X('Gas jar 1'); const j2 = K.add(K.A3.gasJar(), 0.2, -0.78); j2.name = X('Gas jar 2'); for (const j of [j1, j2]) { j.collects = true; j.holdGas = true; }
      const mb = K.strip('blue', -0.28, -0.46); K.moisten(mb); const lamp = K.lamp(0.36, -0.56); const sp = K.splint(0.22, -0.44); const lw = K.bottle('limewater', 0.44, -0.82);
      const cd = K.add(K.A3.candle(), 0.06, -0.5); cd.setLit(true);
      return { fl, th, ch, hcl, j1, j2, mb, lamp, sp, lw, cd };
    },
    steps: [
      { do: X('Put the marble chips in the flask; the cork carries the thistle funnel and the delivery tube going to the bottom of gas jar 1.'), target: 'ch', act: async (K, o) => { await K.addSolid(o.ch, o.fl); o.P = K.pipe(o.fl, o.j1); await K.sleep(0.6); }, ev: { type: 'pipe' },
        see: X('The apparatus is ready. The gas jar stands upright.') },
      { do: X('Pour dilute hydrochloric acid through the thistle funnel until its lower end dips in the acid.'), target: 'th', act: async (K, o) => { await K.pour(o.hcl, o.th, 25); await K.wait(8, 2); }, ev: { type: 'pour', to: 'th' },
        see: X('The marble chips fizz briskly and the gas passes into the jar.'), why: X('Carbon dioxide is heavier than air, so it is collected by upward displacement of air in an upright jar.') },
      { do: X('When jar 1 is full, cover it with its lid and connect the delivery tube to jar 2.'), target: 'j1', act: async (K, o) => { o.j1.setLid(true); K.unpipe(o.fl, o.P); o.P = K.pipe(o.fl, o.j2); await K.sleep(0.8); }, ev: { type: 'pipe' },
        see: X('The gas is colourless; it has no smell.') },
      { do: X('Take the lid off jar 1 and hold moist blue litmus paper inside its mouth.'), target: 'mb', act: async (K, o) => { o.j1.setLid(false); o.j1.holdGas = true; await K.holdPaper(o.mb, () => o.j1.mouthWorld(V(K, 0, 0, 0)).add(V(K, 0, -0.03, 0)), 2.8, () => ((o.j1.gas.CO2 || 0) > 0.5 ? new K.THREE.Color(0xb65f7a) : null)); }, ev: { type: 'paper' },
        see: X('The moist blue litmus turns faintly red (purplish).'), why: X('Carbon dioxide dissolves in water to form carbonic acid, a weak acid.') },
      { do: X('Light a splint and lower it into jar 1.'), target: 'sp', act: async (K, o) => { await K.light(o.lamp); await K.splintTest(o.sp, o.j1, o.lamp); }, ev: { type: 'extinguish' },
        see: X('The burning splint goes out at once.'), why: X('Carbon dioxide does not burn and does not support burning.') },
      { do: X('Pour some lime water into jar 1, put the lid on and shake it.'), target: 'lw', act: async (K, o) => { await K.pour(o.lw, o.j1, 15); o.j1.setLid(true); await K.shake(o.j1, 1.6); }, ev: { type: 'pour', to: 'j1' },
        see: X('The lime water turns milky.'), why: X('Carbon dioxide reacts with lime water to form insoluble white calcium carbonate.') },
      { do: X('Take jar 2 and tilt it over the burning candle, as if pouring water.'), target: 'j2', act: async (K, o) => { K.unpipe(o.fl, o.P); await K.pourGas(o.j2, o.cd); await K.sleep(1.2); }, ev: { type: 'candle_out' },
        see: X('The candle goes out.'), why: X('Carbon dioxide is heavier than air: it flows down over the flame and cuts off its oxygen. That is why it is used in fire extinguishers.') },
    ],
    eq: { word: 'Calcium carbonate + hydrochloric acid → calcium chloride + water + carbon dioxide · carbon dioxide + lime water → calcium carbonate + water', sym: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂ · CO₂ + H₂O ⇌ H₂CO₃ · CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O' },
    result: { obs: X('Marble chips fizzed with dilute HCl. The gas was colourless and odourless, turned moist blue litmus faint red, put out a burning splint, turned lime water milky, and could be poured onto a candle to put it out.'),
      concl: X('Carbon dioxide is a colourless, odourless, slightly acidic gas, heavier than air, that does not support burning and turns lime water milky.'),
      safety: X('Make sure the thistle funnel dips into the acid, or the gas escapes through it. Handle acid and flames with care.'),
      viva: [{ q: X('Why is carbon dioxide collected by upward displacement of air?'), a: X('It is heavier than air.') }, { q: X('Why must the end of the thistle funnel dip into the acid?'), a: X('Otherwise the gas would escape through the funnel.') }, { q: X('Why is CO₂ used to put out fires?'), a: X('It is heavier than air and does not support burning, so it covers the fire and cuts off oxygen.') }] },
  },
  {
    id: 'saponification', cls: 10, ch: CL, title: X('Making soap from oil (saponification)'),
    aim: X('To prepare soap by the reaction of castor oil with sodium hydroxide.'),
    kind: X('Saponification'),
    setup(K) {
      const b = K.beaker(-0.22, -0.66, null, 0, 250); b.name = X('Beaker (250 mL)'); b.maxT = 55; K.A6.floatLayer(b, ['castor'], 0xe9d27a); K.A6.curdLayer(b);
      const co = K.bottle('castor', -0.46, -0.84); const na = K.bottle('naoh20', -0.34, -0.86); const rod = K.rod(-0.04, -0.44); const rl = K.strip('red', -0.36, -0.46); const salt = K.solid('salt', 0.06, -0.48);
      const tp = K.tripod(0.18, -0.72); const bn = K.burner(0.38, -0.62);
      return { b, co, na, rod, rl, salt, tp, bn };
    },
    steps: [
      { do: X('Pour about 20 mL of castor oil into the beaker.'), target: 'co', act: (K, o) => K.pour(o.co, o.b, 20), ev: { type: 'pour', to: 'b' }, see: X('Thick, pale yellow oil.') },
      { do: X('Add 30 mL of 20% sodium hydroxide solution and stir.'), target: 'na', act: async (K, o) => { await K.pour(o.na, o.b, 30); await K.stir(o.rod, o.b, 3); }, ev: { type: 'pour', to: 'b' },
        see: X('The oil floats at first; on stirring the mixture starts to turn cloudy, and the beaker feels slightly warm.') },
      { do: X('Dip a piece of red litmus paper in the mixture.'), target: 'rl', act: (K, o) => K.dip(o.rl, o.b), ev: { type: 'dip' }, see: X('It turns blue: the mixture is strongly basic (excess sodium hydroxide).') },
      { do: X('Warm the beaker gently on the tripod and keep stirring (time-lapse, about 15 minutes).'), target: 'b', act: async (K, o) => { await K.onTripod(o.b, o.tp, o.bn); await K.light(o.bn); await Promise.all([K.stir(o.rod, o.b, 8), K.wait(8, 120)]); await Promise.all([K.stir(o.rod, o.b, 8), K.wait(8, 120)]); }, ev: { type: 'lit' },
        see: X('The mixture becomes thick, smooth and creamy.'), why: X('The oil (a fat) reacts with the alkali: soap (the sodium salt of a fatty acid) and glycerol are formed. This is saponification.') },
      { do: X('Turn off the burner, add two spatulas of common salt and stir.'), target: 'salt', act: async (K, o) => { await K.extinguish(o.bn); await K.spoonful(o.salt, o.b); await K.spoonful(o.salt, o.b); await Promise.all([K.stir(o.rod, o.b, 6), K.wait(6, 120)]); await K.wait(4, 120); }, ev: { type: 'spoon', v: 'b' },
        see: X('The soap separates and floats on top as a solid layer (curd); the liquid below becomes clearer.'), why: X('Soap is less soluble in salt water, so it comes out of the solution. This is called salting out.') },
      { do: X('Leave it for a day to set (time-lapse), then lift out the soap.'), target: 'b', act: async (K, o) => { await K.wait(6, 600); K.takeSoap(o.b, 0.08, -0.5); await K.sleep(1); }, ev: { type: 'soap_cake' },
        see: X('A solid cake of soap. It lathers when rubbed with water.') },
    ],
    eq: { word: 'Oil (fat) + sodium hydroxide → soap + glycerol', sym: '(RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃' },
    result: { obs: X('The castor oil and sodium hydroxide mixture became thick and creamy on stirring and warming; red litmus turned blue; on adding salt, soap separated as a solid that set into a cake.'),
      concl: X('Oils and fats react with sodium hydroxide to form soap and glycerol (saponification). Common salt separates the soap from the mixture.'),
      safety: X('20% sodium hydroxide is very corrosive: wear goggles and gloves and do not touch the mixture. Freshly made soap still contains alkali: do not use it on your skin.'),
      viva: [{ q: X('What is saponification?'), a: X('The reaction of an oil or fat with an alkali to form soap and glycerol.') }, { q: X('Why is common salt added?'), a: X('To make the soap separate out (salting out).') }, { q: X('Which by-product is formed in this reaction?'), a: X('Glycerol.') }] },
  },
  {
    id: 'soda_id', cls: 10, ch: CL, title: X('Washing soda or baking soda?'),
    aim: X('To identify washing soda (sodium carbonate) and baking soda (sodium hydrogencarbonate) from two unlabelled samples.'),
    kind: X('Identifying salts by tests'),
    setup(K) {
      const sA = K.solid('na2co3', -0.44, -0.5); sA.name = X('Sample A'); const sB = K.solid('nahco3', -0.32, -0.5); sB.name = X('Sample B');
      const rk = K.rack(-0.36, -0.8); const t1 = K.tube(rk, 1, 'water', 5); const t2 = K.tube(rk, 3, 'water', 5); t1.name = X('Test tube 1 (sample A)'); t2.name = X('Test tube 2 (sample B)');
      const r1 = K.strip('red', -0.2, -0.46); const r2 = K.strip('red', -0.13, -0.46); const p1 = K.strip('ph', -0.06, -0.46); const p2 = K.strip('ph', 0.01, -0.46); const hcl = K.bottle('hcl', -0.5, -0.62);
      const lamp = K.lamp(0.1, -0.52); const D1 = K.add(K.A.testTube(), 0.14, -0.84); D1.name = X('Dry tube for sample A'); K.clampTube(D1, 0.14, -0.84, BENCH_Y + lamp.heatPoint.y + 0.01);
      const D2 = K.add(K.A.testTube(), 0.34, -0.84); D2.name = X('Dry tube for sample B'); K.clampTube(D2, 0.34, -0.84, BENCH_Y + lamp.heatPoint.y + 0.01); K.A6.droplets(D2, { lo: 0.5, hi: 0.9 });
      const rk2 = K.add(K.A.rack(3), 0.28, -0.56); const L1 = K.tube(rk2, 0, 'limewater', 8); const L2 = K.tube(rk2, 2, 'limewater', 8); L1.name = X('Lime water 1'); L2.name = X('Lime water 2');
      return { sA, sB, rk, t1, t2, r1, r2, p1, p2, hcl, lamp, D1, D2, rk2, L1, L2 };
    },
    steps: [
      { do: X('Dissolve a spatula of sample A in test tube 1 and of sample B in test tube 2 (5 mL of distilled water each).'), target: 'sA', act: async (K, o) => { await K.dissolveIn(o.sA, o.t1); await K.dissolveIn(o.sB, o.t2); }, ev: { type: 'spoon', v: 't2' },
        see: X('Both dissolve to give clear, colourless solutions.') },
      { do: X('Dip red litmus paper and pH paper in each solution.'), target: 'r1', act: async (K, o) => { await K.dip(o.r1, o.t1); await K.dip(o.r2, o.t2); await K.dip(o.p1, o.t1); await K.dip(o.p2, o.t2); }, ev: { type: 'dip' },
        see: X('Both turn red litmus blue: both are basic. On pH paper, A gives a blue colour (pH about 10) and B a green colour (pH about 8): A is more strongly basic.') },
      { do: X('Add a little dilute hydrochloric acid to each solution.'), target: 'hcl', act: async (K, o) => { await K.pour(o.hcl, o.t1, 2); await K.pour(o.hcl, o.t2, 2); }, ev: { type: 'pour', to: 't2' },
        see: X('Both fizz: both give carbon dioxide with an acid.') },
      { do: X('Put a little dry sample A in its dry tube, connect it to lime water 1 and heat it.'), target: 'D1', act: async (K, o) => { await K.spoonful(o.sA, o.D1); K.pipe(o.D1, o.L1); await K.light(o.lamp); await K.under(o.lamp, o.D1); await K.wait(5, 1.5); }, ev: { type: 'under' },
        see: X('No gas comes out; the lime water stays clear.') },
      { do: X('Do the same with dry sample B and lime water 2.'), target: 'D2', act: async (K, o) => { await K.spoonful(o.sB, o.D2); K.pipe(o.D2, o.L2); await K.under(o.lamp, o.D2); await K.wait(5, 1.5); await K.extinguish(o.lamp); }, ev: { type: 'under' },
        see: X('Bubbles pass into the lime water and it turns milky; drops of water appear in the upper part of the tube.'), why: X('Baking soda decomposes on heating to give carbon dioxide and water; washing soda does not. So sample A is washing soda and sample B is baking soda.') },
    ],
    eq: { word: 'Sodium hydrogencarbonate —heat→ sodium carbonate + water + carbon dioxide', sym: '2NaHCO₃ → Na₂CO₃ + H₂O + CO₂ · Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂' },
    result: { obs: X('Both samples dissolved, turned red litmus blue and fizzed with HCl. Sample A was more strongly basic and gave no gas on heating; sample B gave carbon dioxide and water on heating.'),
      concl: X('Sample A is washing soda (sodium carbonate); sample B is baking soda (sodium hydrogencarbonate).'),
      safety: X('Heat the dry tube gently with its mouth pointing away from people; remove the delivery tube from the lime water before the heating stops, so that lime water is not sucked back.'),
      viva: [{ q: X('What is the chemical name of baking soda?'), a: X('Sodium hydrogencarbonate, NaHCO₃.') }, { q: X('Which sample gives carbon dioxide on heating?'), a: X('Baking soda.') }, { q: X('What is the formula of washing soda?'), a: X('Na₂CO₃·10H₂O.') }] },
  },
];
void BENCH_Y;
