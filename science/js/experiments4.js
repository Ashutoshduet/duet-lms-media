// Chemistry experiments, batch 4: electricity in chemistry (NCERT Class 8–10). The student builds and uses real circuits:
// a tester with a bulb or an LED, iron nails in a beaker, carbon electrodes in a mug, copper plates — and sees what really happens.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const C8M = 'Materials: Metals and Non-metals (older NCERT, Class 8)', C8E = 'Chemical Effects of Electric Current (older NCERT, Class 8)';
const C8N = 'Ch 8 · Nature of Matter: Elements, Compounds, and Mixtures', C9A = 'Ch 9 · Atomic Foundations of Matter';
const C10R = 'Ch 1 · Chemical Reactions and Equations', C10A = 'Ch 2 · Acids, Bases and Salts', C10M = 'Ch 3 · Metals and Non-metals';
const RED = 0xc62828, BLACK = 0x222222;
// a tester: battery → lamp → free end A ... free end B → battery
function tester(K, o) {
  const A4 = K.A4; const cells = K.add(A4.cellPack(o.cells ?? 3), o.bx ?? -0.4, o.bz ?? -0.78); const lamp = K.add(o.led ? A4.led() : A4.bulb(), o.lx ?? -0.2, o.lz ?? -0.8);
  const pA = K.lay(A4.probe(RED), o.ax ?? -0.12, o.az ?? -0.48, 0.2), pB = K.lay(A4.probe(BLACK), o.ax2 ?? -0.04, o.az ?? -0.48, -0.2);
  const ckt = K.circuit({ source: cells, lamp, ends: [{ item: pA, tips: pA.tips }, { item: pB, tips: pB.tips }] }, [[[cells, '+'], [lamp, 'a'], RED], [[lamp, 'b'], [pA, 'w'], RED], [[cells, '-'], [pB, 'w'], BLACK]]);
  return { cells, lamp, pA, pB, ckt };
}
const touchable = (it, at, dx, h, r, cond) => { it.touchAt = at; it.touchDx = dx; it.height = h; it.touchR = r; it.cond = cond; return it; };
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });

export const EXPERIMENTS4 = [
  // ===================================================== Class 8: solids
  {
    id: 'tester_solids', cls: 8, ch: X(C8M), title: X('Which materials conduct electricity?'),
    aim: X('To test whether metals and non-metals let electricity pass through them, using a tester made of cells, a bulb and wires.'),
    kind: X('Electrical conductivity of metals and non-metals'),
    setup(K) {
      const A3 = K.A3, A4 = K.A4, V = (x, y, z) => new K.THREE.Vector3(x, y, z);
      const o = tester(K, {});
      o.tile = K.add(A4.whiteTile(0.44, 0.09), 0.2, -0.63); const y = BENCH_Y + 0.006;
      const fe = K.add(A3.sample('fe'), 0.055, -0.63, { y }); fe.g.rotation.set(0, 0, Math.PI / 2); fe.g.position.y = y + 0.0025; fe.home = { p: fe.g.position.clone(), q: fe.g.quaternion.clone() }; touchable(fe, V(0, 0.022, 0), 0.01, 0.0015, 0.03, 30);
      const cu = touchable(K.add(A3.sample('cu'), 0.1, -0.63, { y }), V(0, 0.006, 0), 0.005, 0.0009, 0.013, 50);
      const al = touchable(K.add(A3.sample('al'), 0.17, -0.63, { y }), V(0, 0.0015, 0), 0.008, 0.001, 0.017, 50);
      const s = touchable(K.add(A3.sample('s'), 0.24, -0.63, { y }), V(0, 0.006, 0), 0.004, 0.006, 0.012, 0);
      const coal = touchable(K.add(A3.sample('coal'), 0.31, -0.63, { y }), V(0, 0.006, 0), 0.004, 0.006, 0.012, 0);
      const gr = K.add(A4.graphite(), 0.38, -0.63, { y });
      return { ...o, fe, cu, al, s, coal, gr };
    },
    steps: [
      { do: X('First check the tester: touch its two free ends together.'), target: 'pA', act: (K, o) => K.touchEnds(o.ckt), ev: { type: 'tested', v: 'ckt' },
        see: X('The bulb lights up.'), why: X('Touching the ends closes the circuit, so current flows from the cells through the bulb and back. The tester works.') },
      { do: X('Touch both free ends to the iron nail, a little apart.'), target: 'fe', act: (K, o) => K.touchSample(o.ckt, o.fe), ev: { type: 'tested', v: 'fe' },
        see: X('The bulb glows.'), why: X('Iron lets the current pass through it: it is a good conductor of electricity.') },
      { do: X('Now touch the ends to the copper wire.'), target: 'cu', act: (K, o) => K.touchSample(o.ckt, o.cu), ev: { type: 'tested', v: 'cu' },
        see: X('The bulb glows brightly.'), why: X('Copper is one of the best conductors. That is why electric wires are made of copper.') },
      { do: X('Test the aluminium foil.'), target: 'al', act: (K, o) => K.touchSample(o.ckt, o.al), ev: { type: 'tested', v: 'al' },
        see: X('The bulb glows.'), why: X('Aluminium is a metal; it conducts electricity too.') },
      { do: X('Test the piece of sulphur.'), target: 's', act: (K, o) => K.touchSample(o.ckt, o.s), ev: { type: 'tested', v: 's' },
        see: X('The bulb does not glow at all.'), why: X('Sulphur is a non-metal. It does not let electricity pass: it is an insulator.') },
      { do: X('Test the piece of coal.'), target: 'coal', act: (K, o) => K.touchSample(o.ckt, o.coal), ev: { type: 'tested', v: 'coal' },
        see: X('The bulb does not glow.'), why: X('Coal is mostly carbon, a non-metal; this coal does not conduct.') },
      { do: X('Last, test the pencil lead (graphite).'), target: 'gr', act: (K, o) => K.touchSample(o.ckt, o.gr), ev: { type: 'tested', v: 'gr' },
        see: X('The bulb glows, a little less brightly than with the metals.'), why: X('Graphite is a form of carbon, a non-metal, but it is the exception: it conducts electricity. It is used for electrodes.') },
    ],
    eq: { word: 'Metals (iron, copper, aluminium) conduct electricity · non-metals (sulphur, coal) do not · graphite is the exception', sym: 'Fe, Cu, Al: bulb glows ✓ · S, coal: no glow ✗ · graphite (C): glows ✓' },
    result: { obs: X('The bulb glowed with iron, copper, aluminium and pencil lead; it did not glow with sulphur or coal.'),
      concl: X('Metals are good conductors of electricity; most non-metals are poor conductors (insulators). Graphite is a non-metal that conducts.'),
      safety: X('Use only dry cells. Never test anything with the electricity from a wall socket.'),
      viva: [{ q: X('Why are electric wires made of copper or aluminium?'), a: X('They are metals and conduct electricity very well.') }, { q: X('Name a non-metal that conducts electricity.'), a: X('Graphite (a form of carbon).') }, { q: X('Why are the handles of electricians\' tools covered with plastic or rubber?'), a: X('Plastic and rubber do not conduct electricity, so they protect the hand from a shock.') }] },
  },
  // ===================================================== Class 8: liquids (LED tester)
  {
    id: 'conduct_liquids', cls: 8, ch: X(C8E), title: X('Do liquids conduct electricity?'),
    aim: X('To find out which liquids conduct electricity, using a tester with an LED.'),
    kind: X('Conduction of electricity through liquids'),
    setup(K) {
      const A3 = K.A3; const o = tester(K, { led: true, cells: 3, ax: -0.13, ax2: -0.05 });
      const cap = (i, sub, en, hi, hg) => { const c = K.place(A3.bottleCap({ color: [0x2f6fc9, 0xc9442f, 0x2f9c5a, 0xd09a2a, 0x7a4fc9, 0x5a6a7a][i], name: N(en, hi, hg) }), -0.02 + i * 0.08, -0.62); K.lab.fill(c, sub, 6); c.tag = String(i + 1); return c; };
      o.c1 = cap(0, 'lemon', 'Cap 1: lemon juice', 'ढक्कन 1: नींबू का रस', 'Cap 1: nimbu ka ras'); o.c2 = cap(1, 'vinegar', 'Cap 2: vinegar', 'ढक्कन 2: सिरका', 'Cap 2: sirka');
      o.c3 = cap(2, 'water', 'Cap 3: distilled water', 'ढक्कन 3: आसुत जल', 'Cap 3: distilled water'); o.c4 = cap(3, 'water', 'Cap 4: distilled water', 'ढक्कन 4: आसुत जल', 'Cap 4: distilled water');
      o.c5 = cap(4, 'water', 'Cap 5: distilled water', 'ढक्कन 5: आसुत जल', 'Cap 5: distilled water'); o.c6 = cap(5, 'sugar', 'Cap 6: sugar solution', 'ढक्कन 6: चीनी का घोल', 'Cap 6: cheeni ka ghol');
      o.salt = K.solid('salt', 0.1, -0.46); o.rod = K.rod(0.2, -0.45);
      o.hcl = K.bottle('hcl', 0.3, -0.78, { dropper: true }); o.naoh = K.bottle('naoh', 0.4, -0.78, { dropper: true });
      return o;
    },
    steps: [
      { do: X('Check the tester: touch its two free ends together.'), target: 'pA', act: (K, o) => K.touchEnds(o.ckt), ev: { type: 'tested', v: 'ckt' },
        see: X('The LED glows.'), why: X('An LED glows even with a very small current, so it is better than a bulb for testing liquids.') },
      { do: X('Dip the two ends into the lemon juice (cap 1), about 1 cm apart. They must not touch each other.'), target: 'c1', act: (K, o) => K.dipEnds(o.ckt, o.c1), ev: { type: 'tested', v: 'c1' },
        see: X('The LED glows.'), why: X('Lemon juice conducts electricity. The current is weak, so a bulb might not glow, but the LED does.') },
      { do: X('Wipe the ends dry, then test the vinegar (cap 2).'), target: 'c2', act: (K, o) => K.dipEnds(o.ckt, o.c2), ev: { type: 'tested', v: 'c2' },
        see: X('The LED glows.'), why: X('Vinegar, an acid, conducts electricity too.') },
      { do: X('Test the distilled water (cap 3).'), target: 'c3', act: (K, o) => K.dipEnds(o.ckt, o.c3), ev: { type: 'tested', v: 'c3' },
        see: X('The LED does not glow.'), why: X('Pure (distilled) water is a very poor conductor: it has almost no ions.') },
      { do: X('Add a pinch of common salt to cap 3 and stir until it dissolves.'), target: 'salt', act: async (K, o) => { await K.spoonful(o.salt, o.c3); await K.stir(o.rod, o.c3, 2.5); }, ev: { type: 'spoon', v: 'c3' },
        see: X('The salt dissolves; the water looks the same.') },
      { do: X('Test the salt water (cap 3) again.'), target: 'c3', act: (K, o) => K.dipEnds(o.ckt, o.c3, { sec: 3.2 }), ev: { type: 'tested', v: 'c3' },
        see: X('Now the LED glows. Look closely: tiny gas bubbles form on the ends.'), why: X('Salt dissolves to give ions (Na⁺ and Cl⁻) that carry the current. Tap water has some salts in it, so it conducts a little.') },
      { do: X('Add a few drops of dilute hydrochloric acid to cap 4, then test it.'), target: 'c4', act: async (K, o) => { await K.drops(o.hcl, o.c4, 4); await K.dipEnds(o.ckt, o.c4); }, ev: { type: 'tested', v: 'c4' },
        see: X('The LED glows.'), why: X('Acid solutions conduct electricity.') },
      { do: X('Add a few drops of sodium hydroxide solution to cap 5, then test it.'), target: 'c5', act: async (K, o) => { await K.drops(o.naoh, o.c5, 4); await K.dipEnds(o.ckt, o.c5); }, ev: { type: 'tested', v: 'c5' },
        see: X('The LED glows.'), why: X('Solutions of bases conduct electricity too.') },
      { do: X('Finally test the sugar solution (cap 6).'), target: 'c6', act: (K, o) => K.dipEnds(o.ckt, o.c6), ev: { type: 'tested', v: 'c6' },
        see: X('The LED does not glow.'), why: X('Sugar dissolves as whole molecules, not ions, so its solution does not conduct.') },
    ],
    eq: { word: 'Solutions of acids, bases and salts conduct electricity · distilled water and sugar solution do not', sym: 'NaCl(aq) → Na⁺(aq) + Cl⁻(aq): ions carry the current' },
    result: { obs: X('The LED glowed for lemon juice, vinegar, salt water, the acid and the base. It did not glow for distilled water or sugar solution.'),
      concl: X('Liquids that contain ions (solutions of acids, bases and salts) conduct electricity; distilled water and sugar solution do not.'),
      safety: X('Use only cells, never the mains. Wipe the ends dry between tests. Handle the acid and the base carefully.'),
      viva: [{ q: X('Why is an LED used instead of a bulb to test liquids?'), a: X('The current through a liquid can be very weak; an LED glows even with a weak current.') }, { q: X('Does distilled water conduct electricity?'), a: X('Hardly at all: it has almost no ions.') }, { q: X('Why should we not touch electric switches with wet hands?'), a: X('Ordinary water has salts in it and conducts electricity, so we could get a shock.') }] },
  },
  {
    id: 'electroplating', cls: 8, ch: X(C8E), title: X('Coating copper with electricity'),
    aim: X('To pass a current through copper sulphate solution between two copper plates and see copper move from one plate to the other (electroplating).'),
    kind: X('Electroplating'),
    setup(K) {
      const A3 = K.A3, A4 = K.A4;
      const b = K.beaker(0.0, -0.62, 'water', 200, 250); b.name = X('Beaker with distilled water');
      const cs = K.solid('cuso4d', -0.22, -0.48); const rod = K.rod(-0.1, -0.44); const acid = K.bottle('h2so4', 0.22, -0.8, { dropper: true });
      const sp = K.place(A3.sandpaper(), 0.36, -0.5); const lid = K.add(A4.cardLid(), -0.32, -0.6);
      const pA = K.lay(A4.copperPlate({ name: N('Copper plate 1 (to +)', 'ताँबे की प्लेट 1 (+ से)', 'Copper plate 1 (+ se)') }), 0.17, -0.55), pB = K.lay(A4.copperPlate({ name: N('Copper plate 2 (to −)', 'ताँबे की प्लेट 2 (− से)', 'Copper plate 2 (− se)') }), 0.26, -0.55);
      const cells = K.add(A4.cellPack(2), -0.4, -0.8); const key = K.add(A4.plugKey(), -0.22, -0.8);
      const ckt = K.circuit({ source: cells, key, ends: [{ item: pA, tips: pA.tips }, { item: pB, tips: pB.tips }] }, [[[cells, '+'], [key, 'a'], RED], [[key, 'b'], [pA, 'w'], RED], [[cells, '-'], [pB, 'w'], BLACK]]);
      return { b, cs, rod, acid, sp, lid, pA, pB, cells, key, ckt };
    },
    steps: [
      { do: X('Dissolve two spoonfuls of copper sulphate crystals in the water and stir.'), target: 'cs', act: async (K, o) => { await K.spoonful(o.cs, o.b); await K.spoonful(o.cs, o.b); await K.stir(o.rod, o.b, 6); }, ev: { type: 'stir', v: 'b' },
        see: X('The crystals dissolve and the water turns clear blue.') },
      { do: X('Add a few drops of dilute sulphuric acid.'), target: 'acid', act: (K, o) => K.drops(o.acid, o.b, 5), ev: { type: 'drops', to: 'b' },
        see: X('The solution stays blue.'), why: X('The acid helps the solution conduct electricity better.') },
      { do: X('Rub both copper plates with sandpaper until they shine.'), target: 'pA', act: async (K, o) => { await K.rub(o.pA, o.sp); await K.rub(o.pB, o.sp); }, ev: { type: 'rub' },
        see: X('The dull plates become bright and shiny.'), why: X('Sandpaper removes the dull layer on the copper, so the metal is clean.') },
      { do: X('Put the cardboard lid on the beaker and hang the two plates in the solution through its slits. They must not touch each other.'), target: 'lid', act: async (K, o) => { await K.lidOn(o.lid, o.b); await K.hangPlate(o.pA, o.b, o.lid, -1); await K.hangPlate(o.pB, o.b, o.lid, 1); }, ev: { type: 'hang', v: 'b' },
        see: X('Plate 1 is joined to the + terminal and plate 2 to the − terminal of the battery, through the switch.') },
      { do: X('Switch on the current.'), target: 'key', act: (K, o) => K.keyOn(o.key, true), ev: { type: 'key', v: 'key' },
        see: X('Nothing seems to happen at first, but a current is flowing through the solution.') },
      { do: X('Let the current flow for about 15 minutes (time-lapse).'), target: 'b', act: (K) => K.wait(12, 75),
        see: X('Plate 2 (joined to −) gets a reddish-brown coating of fresh copper. Plate 1 (joined to +) looks rough and thinner. The solution stays blue.'),
        why: X('Copper ions (Cu²⁺) in the solution move to the − plate and become copper metal on it. At the + plate, copper metal goes into the solution as ions, so the colour does not fade.') },
      { do: X('Switch off and take both plates out. Compare them.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, false); await K.liftOut(o.pA, new K.THREE.Vector3(0.18, BENCH_Y + 0.0018, -0.5)); await K.liftOut(o.pB, new K.THREE.Vector3(0.26, BENCH_Y + 0.0018, -0.5)); },
        see: X('Plate 2 is coated with new copper; plate 1 has lost some copper.'), why: X('This is electroplating: a coat of one metal laid on another by electricity. It is used for chrome on taps and cycle parts, silver and gold on jewellery, and tin on iron cans.') },
    ],
    eq: { word: 'At the − plate: copper ions take electrons and become copper metal · At the + plate: copper metal gives electrons and goes into the solution', sym: 'Cathode (−): Cu²⁺ + 2e⁻ → Cu · Anode (+): Cu → Cu²⁺ + 2e⁻' },
    result: { obs: X('After 15 minutes a layer of copper had formed on the plate joined to the − terminal; the plate joined to + had become thinner. The solution stayed blue.'),
      concl: X('When electricity passes through copper sulphate solution, copper is taken from the + plate and laid on the − plate. Depositing a metal by electricity is called electroplating.'),
      safety: X('Copper sulphate is harmful if swallowed and irritates the eyes; wash your hands. Use only a low-voltage battery.'),
      viva: [{ q: X('On which plate does copper get deposited?'), a: X('On the plate joined to the negative (−) terminal.') }, { q: X('Why does the colour of the solution not fade?'), a: X('The + plate dissolves and puts back as much copper into the solution as is taken out.') }, { q: X('Why are iron cans for food coated with tin?'), a: X('Tin is less reactive than iron and keeps the food from touching the iron.') }] },
  },
  // ===================================================== Class 8: electrolysis with a 9 V battery
  {
    id: 'electrolysis9v', cls: 8, ch: X(C8N), title: X('Splitting water with a 9 V battery'),
    aim: X('To break water into two gases by passing electricity through it, and to test the gases.'),
    kind: X('Electrolysis of water (a compound breaks into its elements)'),
    setup(K) {
      const A3 = K.A3, A4 = K.A4;
      const b = K.beaker(0.0, -0.62, null, 0, 250); b.name = X('Beaker');
      const jug = K.beaker(-0.3, -0.68, 'water', 320, 500); jug.name = X('Water');
      const acid = K.bottle('h2so4', 0.24, -0.8, { dropper: true }); const bat = K.add(A4.battery9V(), 0.2, -0.5);
      const t1 = K.lay(A4.gasTube({ name: N('Test tube 1', 'परखनली 1', 'Test tube 1') }), 0.32, -0.6, 0.1), t2 = K.lay(A4.gasTube({ name: N('Test tube 2', 'परखनली 2', 'Test tube 2') }), 0.38, -0.6, 0.1);
      const cd = K.place(A3.candle(), -0.28, -0.46);
      const ckt = K.circuit({ source: bat, ends: [{ item: bat, tips: bat.tipsP }, { item: bat, tips: bat.tipsN }] });
      return { b, jug, acid, bat, t1, t2, cd, ckt };
    },
    steps: [
      { do: X('Fill the beaker about two-thirds with water.'), target: 'jug', act: (K, o) => K.pour(o.jug, o.b, 200), ev: { type: 'pour', to: 'b', ml: 150 },
        see: X('The beaker is two-thirds full of water.') },
      { do: X('Add a few drops of dilute sulphuric acid to the water.'), target: 'acid', act: (K, o) => K.drops(o.acid, o.b, 5), ev: { type: 'drops', to: 'b' },
        see: X('Nothing changes that you can see.'), why: X('Pure water hardly conducts electricity; a little acid gives ions so that the current can flow.') },
      { do: X('Stand the 9 V battery in the beaker with its terminals upward.'), target: 'bat', act: (K, o) => K.standIn(o.bat, o.b), ev: { type: 'stand_in', v: 'b' },
        see: X('Tiny bubbles start rising from both terminals.') },
      { do: X('Fill test tube 1 with this water, close it with your thumb, turn it upside down and stand it over the − terminal (the bigger, six-sided one).'), target: 't1',
        act: (K, o) => K.fillInvert(o.t1, o.b, () => o.bat.g.localToWorld(new K.THREE.Vector3(-0.0064, 0.0488, 0)), { dz: 0.019, depth: 0.024 }), ev: { type: 'tube_over', v: 't1' },
        see: X('The tube stays full of water; bubbles from the − terminal now go up inside it.') },
      { do: X('Do the same with test tube 2 over the + terminal.'), target: 't2',
        act: (K, o) => K.fillInvert(o.t2, o.b, () => o.bat.g.localToWorld(new K.THREE.Vector3(0.0064, 0.0488, 0)), { dz: 0.019, depth: 0.024 }), ev: { type: 'tube_over', v: 't2' },
        see: X('Both tubes stand full of water over the terminals.') },
      { do: X('Leave it for 10 to 15 minutes and compare the two tubes (time-lapse).'), target: 'b', act: (K) => K.wait(12, 75),
        see: X('Gas collects at the top of both tubes and pushes the water down. Tube 1 (over −) has about twice as much gas as tube 2 (over +). The + terminal slowly gets dull.'),
        why: X('Electricity breaks water into hydrogen and oxygen. Water has two hydrogen atoms for every oxygen atom, so twice as much hydrogen is made.') },
      { do: X('Light the candle.'), target: 'cd', act: (K, o) => K.light(o.cd), ev: { type: 'lit' }, see: X('The candle burns with a steady flame.') },
      { do: X('Lift tube 1 out, keeping its mouth down, and bring its mouth to the candle flame.'), target: 't1', act: (K, o) => K.gasTest(o.t1, o.cd, { rimY: o.b.mouthWorld().y, rest: new K.THREE.Vector3(-0.16, BENCH_Y + 0.08, -0.5) }), ev: { type: 'pop', v: 't1' },
        see: X('The gas burns with a "pop" sound.'), why: X('Only hydrogen burns with a pop. So the gas at the − terminal is hydrogen.') },
      { do: X('Now bring tube 2 to the flame in the same way.'), target: 't2', act: (K, o) => K.gasTest(o.t2, o.cd, { rimY: o.b.mouthWorld().y, rest: new K.THREE.Vector3(-0.1, BENCH_Y + 0.08, -0.5) }), ev: { type: 'brighter', v: 't2' },
        see: X('The candle flame flares up and burns more brightly.'), why: X('Oxygen helps burning. So the gas at the + terminal is oxygen.') },
    ],
    eq: { word: 'Water → hydrogen + oxygen (by electricity)', sym: '2H₂O(l) → 2H₂(g) + O₂(g)' },
    result: { obs: X('Bubbles formed at both terminals. The gas over the − terminal was about twice the gas over +. It burnt with a pop (hydrogen); the other gas made the flame brighter (oxygen).'),
      concl: X('Water is a compound of hydrogen and oxygen. Electricity breaks it into these two elements, with twice as much hydrogen as oxygen by volume.'),
      safety: X('This is a teacher demonstration. Use only an ordinary 9 V battery, never a lithium battery. Keep flames away from the hydrogen until you test it. Handle the acid carefully.'),
      viva: [{ q: X('Which gas collects at the negative terminal?'), a: X('Hydrogen; it burns with a pop.') }, { q: X('Why is the volume of hydrogen double that of oxygen?'), a: X('Each water molecule (H₂O) has two hydrogen atoms for one oxygen atom.') }, { q: X('Why are a few drops of acid added?'), a: X('Pure water hardly conducts; the acid gives ions so that the current can flow.') }] },
  },
  // ===================================================== Class 9: ionic and covalent compounds
  {
    id: 'ionic_covalent', cls: 9, ch: X(C9A), title: X('Ionic and covalent compounds: dissolving and conducting'),
    aim: X('To compare how salt and copper sulphate (ionic) and sugar, camphor and naphthalene (covalent) dissolve in water and kerosene, and whether they conduct electricity.'),
    kind: X('Properties of ionic and covalent compounds'),
    setup(K) {
      const A4 = K.A4; const chems = ['salt', 'cuso4d', 'sugar', 'camphor', 'naph']; const o = {};
      chems.forEach((c, i) => { o['s' + (i + 1)] = K.solid(c, -0.4 + i * 0.12, -0.47); });
      chems.forEach((c, i) => { const b = K.beaker(-0.4 + i * 0.12, -0.64, 'water', 30, 50); b.name = N(`Beaker ${i + 1} (water)`, `बीकर ${i + 1} (पानी)`, `Beaker ${i + 1} (paani)`); o['b' + (i + 1)] = b; });
      o.rk = K.rack(0.33, -0.76); chems.forEach((c, i) => { const t = K.tube(o.rk, i, 'kerosene', 8); t.name = N(`Tube ${i + 1} (kerosene)`, `नली ${i + 1} (केरोसिन)`, `Tube ${i + 1} (kerosene)`); o['k' + (i + 1)] = t; });
      o.pair = K.add(A4.electrodePair('carbon'), 0.27, -0.5); o.bat = K.add(A4.battery9V(), 0.42, -0.52); o.lamp = K.add(A4.bulb(), 0.42, -0.62);
      o.ckt = K.circuit({ source: o.bat, lamp: o.lamp, ends: [{ item: o.pair, tips: o.pair.tipsA }, { item: o.pair, tips: o.pair.tipsB }] }, [[[o.bat, '+'], [o.lamp, 'b'], RED], [[o.lamp, 'a'], [o.pair, 'a'], RED], [[o.bat, '-'], [o.pair, 'b'], BLACK]]);
      return o;
    },
    steps: [
      { do: X('Put a pinch of each solid into its beaker of water (salt in 1, copper sulphate in 2, sugar in 3, camphor in 4, naphthalene in 5) and stir.'), target: 's1',
        act: async (K, o) => { for (let i = 1; i <= 5; i++) await K.dissolveIn(o['s' + i], o['b' + i]); }, ev: { type: 'spoon', v: 'b5' },
        see: X('Salt and sugar disappear; copper sulphate dissolves to a blue solution. Camphor floats on the water and naphthalene stays as a solid: they do not dissolve.') },
      { do: X('Now put a pinch of each into its tube of kerosene and shake.'), target: 'k1',
        act: async (K, o) => { for (let i = 1; i <= 5; i++) { await K.spoonful(o['s' + i], o['k' + i]); await K.shake(o['k' + i], 0.9); } }, ev: { type: 'spoon', v: 'k5' },
        see: X('Salt, copper sulphate and sugar stay at the bottom, undissolved. Camphor and naphthalene dissolve in the kerosene.'), why: X('Ionic compounds dissolve in water but not in kerosene or petrol; many covalent compounds do the opposite.') },
      { do: X('Press the two electrodes on the solid salt, then on the solid sugar.'), target: 's1', act: async (K, o) => { await K.pairOn(o.pair, o.s1); await K.pairOn(o.pair, o.s3); }, ev: { type: 'tested', v: 's3' },
        see: X('The bulb does not glow for either solid.'), why: X('In a solid the ions of salt are locked in place, so they cannot carry the current.') },
      { do: X('Dip the electrodes into beaker 1 (salt solution).'), target: 'b1', act: (K, o) => K.pairInto(o.pair, o.b1), ev: { type: 'tested', v: 'b1' },
        see: X('The bulb glows.'), why: X('In water, salt breaks into free Na⁺ and Cl⁻ ions, which move and carry the current.') },
      { do: X('Rinse the electrodes and dip them into beaker 2 (copper sulphate solution).'), target: 'b2', act: (K, o) => K.pairInto(o.pair, o.b2), ev: { type: 'tested', v: 'b2' },
        see: X('The bulb glows.'), why: X('Copper sulphate is ionic too: Cu²⁺ and SO₄²⁻ ions carry the current.') },
      { do: X('Rinse and test beaker 3 (sugar solution).'), target: 'b3', act: (K, o) => K.pairInto(o.pair, o.b3), ev: { type: 'tested', v: 'b3' },
        see: X('The bulb does not glow.'), why: X('Sugar is covalent: it dissolves as whole molecules with no charge, so there is nothing to carry the current.') },
      { do: X('Test beakers 4 and 5 (camphor and naphthalene in water).'), target: 'b4', act: async (K, o) => { await K.pairInto(o.pair, o.b4); await K.pairInto(o.pair, o.b5); }, ev: { type: 'tested', v: 'b5' },
        see: X('The bulb does not glow in either.'), why: X('Camphor and naphthalene are covalent and did not even dissolve, so the water has no ions.') },
    ],
    eq: { word: 'Ionic compounds (salt, copper sulphate): dissolve in water; solutions conduct · covalent compounds (sugar, camphor, naphthalene): no ions, do not conduct', sym: 'NaCl → Na⁺ + Cl⁻ · CuSO₄ → Cu²⁺ + SO₄²⁻ · C₁₂H₂₂O₁₁(aq): molecules, no ions' },
    result: { obs: X('Salt and copper sulphate dissolved in water and their solutions lit the bulb; neither solid did. Sugar dissolved but did not conduct. Camphor and naphthalene did not dissolve in water but dissolved in kerosene, and did not conduct.'),
      concl: X('Ionic compounds dissolve in water (not in kerosene) and conduct electricity when dissolved, because their ions become free to move. Covalent compounds do not conduct electricity.'),
      safety: X('Kerosene and petrol catch fire easily: keep all flames away. Naphthalene and copper sulphate are harmful if swallowed; wash your hands.'),
      viva: [{ q: X('Why does solid salt not conduct, though its solution does?'), a: X('In the solid the ions are fixed; in water they are free to move.') }, { q: X('Does sugar solution conduct electricity?'), a: X('No. Sugar dissolves as molecules, not ions.') }, { q: X('In which solvent does camphor dissolve?'), a: X('In kerosene or petrol, not in water.') }] },
  },
  // ===================================================== Class 10
  {
    id: 'electrolysis10', cls: 10, ch: X(C10R), title: X('Electrolysis of water'),
    aim: X('To break water down by an electric current, collect the two gases and compare their volumes.'),
    kind: X('Decomposition reaction (by electricity)'),
    setup(K) {
      const A3 = K.A3, A4 = K.A4;
      const st = K.add(A4.stand(0.032), 0.0, -0.62); const mug = K.add(A4.mug(), 0.0, -0.62, { y: BENCH_Y + 0.032 });
      const jug = K.beaker(-0.3, -0.6, 'water', 450, 500); jug.name = X('Water');
      const acid = K.bottle('h2so4', 0.24, -0.8, { dropper: true });
      const t1 = K.lay(A4.gasTube({ r: 0.0075, h: 0.1, name: N('Test tube 1', 'परखनली 1', 'Test tube 1') }), 0.22, -0.5, 0.1), t2 = K.lay(A4.gasTube({ r: 0.0075, h: 0.1, name: N('Test tube 2', 'परखनली 2', 'Test tube 2') }), 0.3, -0.5, 0.1);
      const cd = K.place(A3.candle(), 0.36, -0.66);
      const cells = K.add(A4.cellPack(4), -0.4, -0.8); const key = K.add(A4.plugKey(), -0.2, -0.82);
      const ckt = K.circuit({ source: cells, key, ends: [{ item: mug, tips: mug.tipsA }, { item: mug, tips: mug.tipsB }] }, [[[cells, '+'], [key, 'a'], RED], [[key, 'b'], [mug, 'a'], RED], [[cells, '-'], [mug, 'b'], BLACK]]);
      return { st, mug, jug, acid, t1, t2, cd, cells, key, ckt };
    },
    steps: [
      { do: X('Pour water into the mug until the carbon electrodes are well covered.'), target: 'jug', act: (K, o) => K.pour(o.jug, o.mug, 350), ev: { type: 'pour', to: 'mug', ml: 250 },
        see: X('The two carbon rods stand under the water. The left one is joined to + and the right one to − through the switch.') },
      { do: X('Add a few drops of dilute sulphuric acid to the water.'), target: 'acid', act: (K, o) => K.drops(o.acid, o.mug, 10), ev: { type: 'drops', to: 'mug' },
        see: X('Nothing changes that you can see.'), why: X('The acid gives ions, so that the water can conduct electricity.') },
      { do: X('Fill test tube 1 with water and turn it upside down over the electrode joined to − (the cathode).'), target: 't1',
        act: (K, o) => K.fillInvert(o.t1, o.mug, () => o.mug.g.localToWorld(new K.THREE.Vector3(0.016, 0.007, 0)), { dz: 0.022, depth: 0.03, tilt: 0.95 }), ev: { type: 'tube_over', v: 't1' },
        see: X('The tube stands full of water over the right electrode.') },
      { do: X('Fill test tube 2 and turn it over the electrode joined to + (the anode).'), target: 't2',
        act: (K, o) => K.fillInvert(o.t2, o.mug, () => o.mug.g.localToWorld(new K.THREE.Vector3(-0.016, 0.007, 0)), { dz: 0.022, depth: 0.03, tilt: 0.95 }), ev: { type: 'tube_over', v: 't2' },
        see: X('Both tubes stand full of water over the electrodes.') },
      { do: X('Switch on the current.'), target: 'key', act: (K, o) => K.keyOn(o.key, true), ev: { type: 'key', v: 'key' },
        see: X('Gas bubbles form on both electrodes and rise into the test tubes.') },
      { do: X('Leave the apparatus undisturbed for some time (time-lapse).'), target: 'mug', act: (K) => K.wait(12, 150),
        see: X('The gases push the water down in both tubes. The gas over the cathode (−) is about double the gas over the anode (+).'),
        why: X('Water breaks into hydrogen (at the cathode) and oxygen (at the anode) in the ratio 2 : 1 by volume.') },
      { do: X('Switch off and light the candle.'), target: 'cd', act: async (K, o) => { await K.keyOn(o.key, false); await K.light(o.cd); }, ev: { type: 'lit' },
        see: X('The candle burns steadily.') },
      { do: X('Take test tube 1 out, mouth down, and bring a burning candle close to its mouth.'), target: 't1', act: (K, o) => K.gasTest(o.t1, o.cd, { rimY: o.mug.mouthWorld().y, rest: new K.THREE.Vector3(0.14, BENCH_Y + 0.11, -0.5) }), ev: { type: 'pop', v: 't1' },
        see: X('The gas burns with a pop sound.'), why: X('This is hydrogen.') },
      { do: X('Do the same with test tube 2.'), target: 't2', act: (K, o) => K.gasTest(o.t2, o.cd, { rimY: o.mug.mouthWorld().y, rest: new K.THREE.Vector3(0.2, BENCH_Y + 0.11, -0.5) }), ev: { type: 'brighter', v: 't2' },
        see: X('The candle burns more brightly.'), why: X('This is oxygen, which supports burning.') },
    ],
    eq: { word: 'Water → hydrogen + oxygen (electrolytic decomposition)', sym: '2H₂O(l) → 2H₂(g) + O₂(g)' },
    result: { obs: X('Bubbles formed on both electrodes. The volume of gas at the cathode was about twice that at the anode. The cathode gas burnt with a pop; the anode gas made the candle burn brighter.'),
      concl: X('Electricity decomposes water into hydrogen and oxygen in the ratio 2 : 1 by volume. This is a decomposition reaction caused by electricity (electrolysis).'),
      safety: X('Use only a low-voltage battery. The gas tests should be done by the teacher. Handle the acid carefully.'),
      viva: [{ q: X('Name the gas collected at the cathode.'), a: X('Hydrogen.') }, { q: X('Why is the gas at the cathode double that at the anode?'), a: X('Water has two hydrogen atoms for every oxygen atom, so twice the volume of hydrogen is formed.') }, { q: X('What type of reaction is this?'), a: X('A decomposition reaction (electrolytic decomposition).') }] },
  },
  {
    id: 'acid_conduct', cls: 10, ch: X(C10A), title: X('Do acid solutions conduct electricity?'),
    aim: X('To show that solutions of acids conduct electricity, while glucose and alcohol solutions do not.'),
    kind: X('Acids give ions in water'),
    setup(K) {
      const A4 = K.A4;
      const b = K.beaker(0.02, -0.6, null, 0, 100); b.name = X('Beaker with the nails');
      const ep = K.add(A4.electrodePair('nail'), 0.02, -0.6, { y: BENCH_Y + b.inner[0].y + 0.0002 }); b.g.attach(ep.g);
      const cells = K.add(A4.cellPack(4), -0.42, -0.8); const key = K.add(A4.plugKey(), -0.24, -0.66); const lamp = K.add(A4.bulb(), -0.22, -0.82);
      const hcl = K.bottle('hcl', 0.18, -0.8), h2so4 = K.bottle('h2so4', 0.27, -0.8), glu = K.bottle('glucose', 0.36, -0.8), alc = K.bottle('alcohol', 0.45, -0.8);
      const waste = K.beaker(0.3, -0.52, null, 0, 500); waste.name = X('Waste beaker');
      const ckt = K.circuit({ source: cells, lamp, key, ends: [{ item: ep, tips: ep.tipsA }, { item: ep, tips: ep.tipsB }] }, [[[cells, '+'], [key, 'a'], RED], [[key, 'b'], [lamp, 'a'], RED], [[lamp, 'b'], [ep, 'a'], RED], [[cells, '-'], [ep, 'b'], BLACK]]);
      return { b, ep, cells, key, lamp, hcl, h2so4, glu, alc, waste, ckt };
    },
    steps: [
      { do: X('Pour dilute hydrochloric acid into the beaker so that the nails are well covered.'), target: 'hcl', act: (K, o) => K.pour(o.hcl, o.b, 70), ev: { type: 'pour', to: 'b', ml: 40 },
        see: X('The two iron nails on the cork stand in the acid. They are joined to the battery through a bulb and a switch.') },
      { do: X('Switch on the current.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(2.5); }, ev: { type: 'tested', v: 'b' },
        see: X('The bulb glows. Gas bubbles form on the nails.'), why: X('HCl in water gives H⁺ and Cl⁻ ions. These moving ions carry the current.') },
      { do: X('Switch off, pour the acid into the waste beaker and rinse the beaker with water.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, false); await K.rinse(o.b, o.waste); }, ev: { type: 'pour', to: 'waste', ml: 60 },
        see: X('The bulb goes off; the beaker is empty and clean.') },
      { do: X('Pour in dilute sulphuric acid and switch on.'), target: 'h2so4', act: async (K, o) => { await K.pour(o.h2so4, o.b, 70); await K.keyOn(o.key, true); await K.sleep(2.5); }, ev: { type: 'tested', v: 'b' },
        see: X('The bulb glows again.'), why: X('Sulphuric acid also gives H⁺ ions (and SO₄²⁻ ions) in water.') },
      { do: X('Switch off, empty and rinse the beaker. Pour in glucose solution and switch on.'), target: 'glu', act: async (K, o) => { await K.keyOn(o.key, false); await K.rinse(o.b, o.waste); await K.pour(o.glu, o.b, 70); await K.keyOn(o.key, true); await K.sleep(2.5); }, ev: { type: 'tested', v: 'b' },
        see: X('The bulb does not glow.'), why: X('Glucose contains hydrogen but does not give H⁺ ions (or any ions) in water.') },
      { do: X('Switch off, empty and rinse the beaker. Pour in alcohol solution and switch on.'), target: 'alc', act: async (K, o) => { await K.keyOn(o.key, false); await K.rinse(o.b, o.waste); await K.pour(o.alc, o.b, 70); await K.keyOn(o.key, true); await K.sleep(2.5); }, ev: { type: 'tested', v: 'b' },
        see: X('The bulb does not glow.'), why: X('Alcohol also contains hydrogen, but it does not form ions in water. So not every compound with hydrogen is an acid.') },
    ],
    eq: { word: 'Acids give hydrogen ions in water; the ions carry the current', sym: 'HCl(aq) → H⁺(aq) + Cl⁻(aq) · H₂SO₄(aq) → 2H⁺(aq) + SO₄²⁻(aq)' },
    result: { obs: X('The bulb glowed with dilute hydrochloric acid and dilute sulphuric acid, but not with glucose or alcohol solution.'),
      concl: X('Acids produce H⁺ ions in water, and these ions conduct electricity. Glucose and alcohol contain hydrogen but are not acids, because they do not give H⁺ ions.'),
      safety: X('Use only a 6 V battery. Do not touch the nails while the switch is on. Handle the acids carefully.'),
      viva: [{ q: X('Why does dilute HCl conduct electricity?'), a: X('It gives H⁺ and Cl⁻ ions in water, which carry the current.') }, { q: X('Glucose has hydrogen. Why is it not an acid?'), a: X('It does not give H⁺ ions in water.') }, { q: X('Does distilled water conduct electricity?'), a: X('Hardly; it has almost no ions.') }] },
  },
  {
    id: 'flame_ionic', cls: 10, ch: X(C10M), title: X('Properties of ionic compounds: flame colour, solubility, conduction'),
    aim: X('To study the physical state, flame colour, solubility and electrical conduction of the ionic compounds sodium chloride, potassium iodide and barium chloride.'),
    kind: X('Properties of ionic compounds'),
    setup(K) {
      const A4 = K.A4; const o = tester(K, { cells: 3, ax: 0.16, ax2: 0.24, az: -0.46, bx: -0.42, lx: -0.24 });
      o.nacl = K.solid('salt', -0.32, -0.56); o.ki = K.solid('kis', -0.2, -0.56); o.ba = K.solid('bacl2s', -0.08, -0.56);
      o.bn = K.burner(0.06, -0.7); o.sp = K.lay(A4.flameSpatula(), -0.02, -0.45, -0.3);
      o.rk = K.rack(0.33, -0.72); o.tw = K.tube(o.rk, 0, 'water', 10); o.tw.name = N('Test tube 1: water', 'परखनली 1: पानी', 'Test tube 1: paani'); o.tk = K.tube(o.rk, 2, 'kerosene', 10); o.tk.name = N('Test tube 2: kerosene', 'परखनली 2: केरोसिन', 'Test tube 2: kerosene'); o.tk.tag = '2';
      return o;
    },
    steps: [
      { do: X('Look at the three salts: sodium chloride, potassium iodide and barium chloride.'), target: 'nacl', act: async (K, o) => { for (const s of [o.nacl, o.ki, o.ba]) { await K.up(s, 0.06, 0.5); await K.sleep(0.4); await K.home(s, 0.5); } },
        see: X('All three are hard, white, crystalline solids.'), why: X('Ionic compounds are solids: their ions are held together by strong forces.') },
      { do: X('Light the Bunsen burner.'), target: 'bn', act: (K, o) => K.light(o.bn), ev: { type: 'lit' }, see: X('A blue, almost invisible flame burns.') },
      { do: X('Take a little sodium chloride on the metal spatula and hold it in the hot flame.'), target: 'sp', act: (K, o) => K.flameTest(o.sp, o.bn, o.nacl, 5), ev: { type: 'flame_colour' },
        see: X('The crystals crackle and the flame turns a bright golden yellow.'), why: X('Every metal gives its own flame colour. Sodium gives golden yellow.') },
      { do: X('Clean the spatula, then repeat with potassium iodide.'), target: 'ki', act: async (K, o) => { await K.cleanSpat(o.sp); await K.flameTest(o.sp, o.bn, o.ki, 6); }, ev: { type: 'flame_colour' },
        see: X('The flame turns lilac (pale violet). The solid melts into a clear drop.'), why: X('Potassium gives a lilac flame. Potassium iodide melts at about 680 °C, which this flame can reach.') },
      { do: X('Clean the spatula and repeat with barium chloride.'), target: 'ba', act: async (K, o) => { await K.cleanSpat(o.sp); await K.flameTest(o.sp, o.bn, o.ba, 5); await K.cleanSpat(o.sp); }, ev: { type: 'flame_colour' },
        see: X('The flame turns apple-green.'), why: X('Barium gives an apple-green flame. Ionic compounds have high melting points: sodium chloride melts at 801 °C and barium chloride at 962 °C.') },
      { do: X('Put a little sodium chloride into the water and into the kerosene, and shake.'), target: 'tw', act: async (K, o) => { await K.dissolveIn(o.nacl, o.tw); await K.spoonful(o.nacl, o.tk); await K.shake(o.tk, 1); }, ev: { type: 'spoon', v: 'tk' },
        see: X('It dissolves in the water but stays as a solid at the bottom of the kerosene.'), why: X('Ionic compounds dissolve in water but not in kerosene or petrol.') },
      { do: X('Touch the two ends of the tester to the solid sodium chloride.'), target: 'nacl', act: (K, o) => K.touchSample(o.ckt, o.nacl), ev: { type: 'tested', v: 'nacl' },
        see: X('The bulb does not glow.'), why: X('In the solid crystal the ions are fixed in place and cannot move.') },
      { do: X('Now dip the two ends into the salt solution in test tube 1.'), target: 'tw', act: (K, o) => K.dipEnds(o.ckt, o.tw, { sec: 3 }), ev: { type: 'tested', v: 'tw' },
        see: X('The bulb glows.'), why: X('In water the ions are free to move and carry the current. Molten ionic compounds conduct for the same reason.') },
    ],
    eq: { word: 'Ionic solids: ions fixed in the crystal (no current) · in water: ions free to move (current flows)', sym: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq) · flame: Na golden yellow, K lilac, Ba apple-green' },
    result: { obs: X('The salts were hard crystalline solids. They gave golden-yellow (Na), lilac (K) and apple-green (Ba) flames. Sodium chloride dissolved in water but not in kerosene. The solid did not conduct; its solution did.'),
      concl: X('Ionic compounds are hard solids with high melting points. They dissolve in water but not in kerosene, and they conduct electricity in solution (or when molten), not as solids.'),
      safety: X('Barium chloride is poisonous: wash your hands after use. Keep kerosene far away from the burner. Hold the spatula by its handle.'),
      viva: [{ q: X('What colour does sodium give to a flame?'), a: X('Golden yellow.') }, { q: X('Why does solid sodium chloride not conduct electricity?'), a: X('Its ions are fixed in the crystal and cannot move.') }, { q: X('Why do ionic compounds have high melting points?'), a: X('A lot of energy is needed to break the strong forces between the ions.') }] },
  },
];
