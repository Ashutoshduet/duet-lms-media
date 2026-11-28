// DUET Science Lab 360, batch SX-CGM: chemistry you do with your own hands (a village biogas plant, crystals and unit
// cells, fibre to fabric, the density of liquids, a molecule kit), plus the earth-and-weather (experiments_sx2.js) and
// maths (experiments_sx3.js) activities of the batch. Scenes in sxchem1.js … sxchem3.js; Hindi and Hinglish in exp_i18n_sx.js.
import { DICT } from './exp_i18n.js';
import { DICT_SX } from './exp_i18n_sx.js';
import * as THREE from 'three';
import * as C2 from './sxchem2.js';
import * as C3 from './sxchem3.js';
import { pullTab } from './mathworld.js';
import { camBy, thing, liveSign, V, BENCH_Y, std, mat, noShelf } from './sxkit.js';
import { EXPERIMENTS_SXC } from './experiments_sx1b.js';
import { EXPERIMENTS_SX2 } from './experiments_sx2.js';
import { EXPERIMENTS_SX3 } from './experiments_sx3.js';
Object.assign(DICT, DICT_SX);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => t3(K.app.lang, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const emit = (K, it, type) => () => K.lab.emit(type, { obj: it.id });
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const Y = BENCH_Y;
const C9a = N('Ch 9 · Atomic Foundations of Matter', 'अध्याय 9 · पदार्थ की परमाणु नींव', 'Ch 9 · Matter ki Atomic Foundations');
const C8s = N('Ch 9 · The Amazing World of Solutes, Solvents, and Solutions', 'अध्याय 9 · विलेय, विलायक और विलयन की अद्भुत दुनिया', 'Ch 9 · Solutes, Solvents aur Solutions ki Amazing Duniya');
const ELN = { H: N('hydrogen', 'हाइड्रोजन', 'hydrogen'), C: N('carbon', 'कार्बन', 'carbon'), N: N('nitrogen', 'नाइट्रोजन', 'nitrogen'), O: N('oxygen', 'ऑक्सीजन', 'oxygen'), Na: N('sodium', 'सोडियम', 'sodium'), Cl: N('chlorine', 'क्लोरीन', 'chlorine') };
const MOLN = { water: N('Water', 'पानी', 'Paani'), co2: N('Carbon dioxide', 'कार्बन डाइऑक्साइड', 'Carbon dioxide'), methane: N('Methane', 'मीथेन', 'Methane'), ammonia: N('Ammonia', 'अमोनिया', 'Ammonia'), ethanol: N('Ethanol', 'एथेनॉल', 'Ethanol'), glucose: N('Glucose', 'ग्लूकोज़', 'Glucose') };

export const EXPERIMENTS_SX = [
  // ============================================================ Class 9 (10) · crystals: unit cells and a grown crystal
  {
    id: 'cgm9_crystals', subj: 'chemistry', cls: 9, also: [10], ch: C9a, topic: 'matter',
    title: X('Crystals: unit cells and a crystal you grow'),
    aim: X('To build the simple, body-centred and face-centred cubic unit cells from balls with your own hands, count how many atoms really belong to each cell, stack cells into a salt crystal, and grow a big alum crystal on a thread from a hot saturated solution.'),
    kind: X('Arrangement of particles in solids; crystallisation'),
    setup(K) {
      const W = Wd(K); noShelf(K); const ck = K.add(C2.crystalKit({ W }), 0, -0.62); ck.W = W;
      const knobSalt = K.add(pullTab(), 0.1, -0.5);
      C2.bindCrystals(ck, K, { scc: 1, bcc: 2, fcc: 3, salt: 4, knobSalt }, { scc: emit(K, ck, 'cell'), bcc: emit(K, ck, 'cell'), fcc: emit(K, ck, 'cell'), salt: emit(K, ck, 'salt') });
      // the alum bench, on the right: tripod and spirit lamp, a beaker of 100 mL water, the alum jar, a spoon, the pencil
      const tp = K.tripod(0.5, -0.66); const lamp = K.lamp(0.68, -0.52); const bk = K.beaker(0.36, -0.5, 'water', 100, 250); bk.name = N('Beaker with 100 mL of water', '100 mL पानी वाला बीकर', '100 mL paani wala beaker');
      const jar = K.add(C2.alumSetup({ W }), 0.7, -0.78);
      const spG = new THREE.Group(); { const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xd6dadf, 0.25, 0.85)); bowl.scale.set(1, 0.45, 1.3); bowl.position.y = 0.006; spG.add(bowl);
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.002, 0.09), std(0xd6dadf, 0.25, 0.85)); h.position.set(0, 0.006, 0.055); spG.add(h); const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.006, 0), std(0xf0f0ea, 0.35)); lump.position.y = 0.008; spG.add(lump); }
      const spoon = K.add(thing(N('A spoonful of alum (5 g)', 'फ़िटकरी का एक चम्मच (5 g)', 'Fitkari ka ek chammach (5 g)'), spG, { hitR: 0.03, hitY: 0.01 }), 0.6, -0.72, { y: Y });
      const seed = K.add(C2.seedThread(), 0.28, -0.78);
      const knobDays = K.add(pullTab(), 0.12, -0.4);
      const sign = liveSign(0.055, 7); sign.position.set(0.5, Y + 0.36, -0.86); K.app.scene.add(sign); K.extras.push(sign);
      const al = { bk, tp, lamp, jar, spoon, seed, knob: knobDays, W, sign };
      C3.bindAlum(al, K, { heat: 5, dissolve: 6, hang: 7, days: 8 }, { heat: emit(K, bk, 'heated'), dissolve: emit(K, bk, 'saturated'), hang: emit(K, bk, 'hung'), days: emit(K, bk, 'days') });
      camBy(ck, K.app, [ck.views.all, ck.views.frame, ck.views.frame, ck.views.frame, ck.views.salt, ck.views.alum, ck.views.alum, ck.views.alum, ck.views.alum]);
      return { ck, knobSalt, tp, lamp, bk, jar, spoon, seed, knobDays, al };
    },
    steps: [
      { do: X('Kyun? Grains of salt are tiny cubes and alum makes eight-sided crystals. Why do crystals have flat faces and sharp corners? Look at the model kit: a wire cube and a tray of balls.'), target: 'ck',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ck.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A cube of steel wire stands on a wooden base. Each ball stands for one atom. On the right are a tripod, a spirit lamp, a beaker of water and a jar of alum (fitkari).') },
      { do: X('Simple cubic: put a blue ball on each of the eight corners of the cube.'), target: 'ck',
        act: async (K, o) => { await o.ck.fill('c'); }, ev: { type: 'cell' },
        see: X('Eight atoms sit on the corners. The cut view beside it shows only the part of each atom that is inside this cube: one eighth. 8 × ⅛ = 1 atom belongs to the cell.'),
        why: X('In a crystal, cubes are packed on every side. Each corner atom is shared by eight cubes, so only one eighth of it belongs to this one.') },
      { do: X('Body-centred cubic: put a red ball in the very centre of the cube.'), target: 'ck',
        act: async (K, o) => { await o.ck.fill('b'); }, ev: { type: 'cell' },
        see: X('The centre atom is inside the cube completely. 8 × ⅛ + 1 = 2 atoms belong to this cell.'), why: X('Iron at room temperature is arranged like this.') },
      { do: X('Face-centred cubic: take the centre ball out, and put a green ball in the middle of each of the six faces.'), target: 'ck',
        act: async (K, o) => { await o.ck.fill('f'); }, ev: { type: 'cell' },
        check: (K, o) => (o.ck.on.b.size ? { ok: false, see: X('The red ball is still in the centre.'), why: X('A face-centred cube has no atom in its centre: carry the red ball out first.') } : null),
        see: X('Each face atom is half inside the cube. 8 × ⅛ + 6 × ½ = 1 + 3 = 4 atoms belong to this cell.'), why: X('Copper, silver, gold and aluminium are arranged like this. Atoms pack most closely this way.') },
      { do: X('Stack cells into a crystal: slide the knob to build a salt crystal 4 cells along each edge.'), target: 'knobSalt',
        act: async (K, o) => { for (let n = 1; n <= 4; n++) { o.ck.setSalt(n); await K.sleep(0.8); } K.lab.emit('salt', { obj: o.ck.id }); }, ev: { type: 'salt' },
        see: X('Sodium ions (purple) and chloride ions (green) take turns in all three directions. As more cells stack up, the outside stays a cube. That is why a grain of salt is a tiny cube.'),
        why: X('A crystal is the same small unit repeated again and again. Its outside shape copies the shape of the unit.') },
      { do: X('Now grow a real crystal. Put the beaker of water on the tripod and light the spirit lamp: heat the water to about 60 °C.'), target: 'bk',
        act: async (K, o) => { await o.al.doHeat(); }, ev: { type: 'heated' },
        see: X('The water warms up. Hot water can dissolve far more alum: about 25 g in 100 mL at 60 °C, against about 7 g at room temperature.') },
      { do: X('Add alum one spoonful (5 g) at a time, until no more dissolves and some stays at the bottom.'), target: 'spoon',
        act: async (K, o) => { await o.al.doDissolve(); }, ev: { type: 'saturated' },
        check: (K, o) => { const st = o.al.st; if (o.bk.mix.temp >= 50) return null; return { ok: false, see: F3((L, w) => `${w('Your solution is saturated at only')} ${o.bk.mix.temp.toFixed(0)} °C: ${st.dissolved().toFixed(1)} g.`), why: X('Cold water holds little alum, so little can come out again as it cools. The crystal will be small.') }; },
        see: X('Five spoonfuls (25 g) dissolve; with the sixth, some alum stays at the bottom. The hot solution is saturated.'), why: X('A saturated solution holds as much as it can at that temperature.') },
      { do: X('Put out the lamp. Lay the pencil across the beaker so the small seed crystal hangs in the middle of the solution.'), target: 'seed',
        act: async (K, o) => { await o.al.doHang(); }, ev: { type: 'hung' },
        see: X('The seed crystal hangs on its thread in the clear, hot solution.') },
      { do: X('Slide the calendar 2 days. Do not shake the beaker: let it cool slowly.'), target: 'knobDays',
        act: async (K, o) => { await K.tween(6, (k) => o.al.st.setH(48 * k)); o.al.st.setH(48); K.lab.emit('days', { obj: o.bk.id }); }, ev: { type: 'days' },
        check: (K, o) => { const st = o.al.st; const m = st.grown; if (m > 3) return null;
          return m > 0.05 ? { ok: false, see: F3((L, w) => `${w('Your crystal is small')}: ${m.toFixed(1)} g.`), why: X('Your solution held little alum when it was hung, so little came out on cooling. Heat it more and add alum until some stays at the bottom.') }
            : { ok: false, see: X('The seed crystal has dissolved away.'), why: X('Your solution was not saturated even when cold, so it dissolved the seed instead of growing it. Add alum until some stays at the bottom.') }; },
        see: X('As the solution cools, alum comes out of it. Clear crystals grow on the bottom, and the seed grows into a big eight-sided crystal, about 2 cm across.'),
        why: X('Cold water holds less alum than hot water. The extra alum crystallises, and slowly, on the seed, its particles join in the same regular order as in the seed. So the big crystal has the same shape.') },
    ],
    eq: { word: 'Atoms that belong to one cubic cell', sym: 'simple 8 × ⅛ = 1 · body-centred 1 + 1 = 2 · face-centred 1 + 6 × ½ = 4' },
    result: { obs: X('The simple cubic cell owned 1 atom, the body-centred 2 and the face-centred 4. Stacked cells kept a cubic outside, like a grain of salt. A hot saturated alum solution cooled for two days grew a big eight-sided crystal on the seed.'),
      concl: X('In a crystal, particles are arranged in a regular, repeating order; the shape of the crystal follows that order. A hot saturated solution gives crystals as it cools, because a solid dissolves less in cold water.'),
      safety: X('Handle the hot beaker with a cloth or tongs. Do not taste alum. Keep the spirit lamp away from your sleeves and hair.'),
      viva: [{ q: X('How many atoms belong to a face-centred cubic cell?'), a: X('Four: 8 × ⅛ + 6 × ½.') }, { q: X('Why is a corner atom counted as one eighth?'), a: X('It is shared by eight cubes that meet at that corner.') },
        { q: X('Why does the alum crystal grow only from a saturated solution?'), a: X('Only a saturated solution has extra alum to give up as it cools; an unsaturated one dissolves the seed.') }] },
  },
  // ============================================================ Class 8 (9) · the density of liquids
  {
    id: 'cgm8_density', subj: 'chemistry', cls: 8, also: [9], ch: C8s, topic: 'matter',
    title: X('Density of liquids: weigh, float and sink'),
    aim: X('To measure the mass and volume of water, mustard oil, milk and salt water on a balance with your own hands and work out their densities, then check them with a hydrometer and an egg.'),
    kind: X('Density = mass ÷ volume'),
    setup(K) {
      const W = Wd(K); noShelf(K); const bal = K.add(K.A5.balance(), 0, -0.6); bal.name = N('Digital balance', 'डिजिटल तराज़ू', 'Digital balance');
      const KEYS = ['water', 'moil', 'milkfull', 'nacl']; const NAMES = [N('Jar of water', 'पानी का जार', 'Paani ka jar'), N('Jar of mustard oil', 'सरसों के तेल का जार', 'Sarson ke tel ka jar'), N('Jar of milk', 'दूध का जार', 'Doodh ka jar'), N('Jar of strong salt water', 'गाढ़े नमक के पानी का जार', 'Gaadhe namak ke paani ka jar')];
      const jars = KEYS.map((k, i) => { const j = K.add(new K.A.Vessel('jar', [[0, 0], [0.032, 0], [0.032, 0.2], [0.034, 0.205]], { name: NAMES[i], cap: 600, wall: 0.0018 }), -0.62 + i * 0.13, -0.85); K.lab.fill(j, k, 520); j.tag = 'ABCD'[i]; return j; });
      const cyls = KEYS.map((k, i) => { const c = K.cylinder(-0.6 + i * 0.1, -0.52, 100); c.name = N(`Measuring cylinder ${'ABCD'[i]} (100 mL)`, `मेज़रिंग सिलिंडर ${'ABCD'[i]} (100 mL)`, `Measuring cylinder ${'ABCD'[i]} (100 mL)`); c.tag = 'ABCD'[i]; return c; });
      const hyd = K.add(C2.hydrometer(), 0.3, -0.5); hyd.g.rotation.set(Math.PI / 2, 0, 0.3); hyd.g.position.y = Y + 0.012; hyd.home = { p: hyd.g.position.clone(), q: hyd.g.quaternion.clone() };
      const egg = K.add(thing(N('A raw egg', 'एक कच्चा अंडा', 'Ek kachcha anda'), C2.egg(), { hitR: 0.03, hitY: 0.02 }), 0.42, -0.6, { y: Y });
      const tare = K.add(pullTab(), 0.05, -0.5);
      const sign = liveSign(0.05, 8); sign.position.set(0, Y + 0.38, -0.95); K.app.scene.add(sign); K.extras.push(sign);
      const d = { bal, jars, cyls, hyd, egg, tare, sign, W };
      C3.bindDensity(d, K, { l0: 1, l1: 2, l2: 3, l3: 4, hyd: 5, egg: 6 }, { l0: emit(K, bal, 'measured'), l1: emit(K, bal, 'measured'), l2: emit(K, bal, 'measured'), l3: emit(K, bal, 'measured'), hyd: emit(K, hyd, 'floated'), egg: emit(K, egg, 'egged') });
      bal.camView = { p: V(-0.08, 0.5, 0.62), t: V(-0.1, 0.12, -0.12) };
      camBy(bal, K.app, [{ p: V(-0.08, 0.52, 0.66), t: V(-0.12, 0.12, -0.14) }, { p: V(-0.1, 0.4, 0.46), t: V(-0.15, 0.08, -0.06) }, null, null, null, { p: V(-0.2, 0.42, 0.42), t: V(-0.32, 0.16, -0.24) }, { p: V(-0.2, 0.42, 0.42), t: V(-0.32, 0.16, -0.24) }].map((v, i, a) => v || a[1]));
      return { bal, jar0: jars[0], jar1: jars[1], jar2: jars[2], jar3: jars[3], cylA: cyls[0], cylB: cyls[1], cylC: cyls[2], cylD: cyls[3], hyd, egg, tare, d };
    },
    steps: [
      { do: X('Kyun? A litre of mustard oil and a litre of water: which is heavier? Look at the four jars, the four measuring cylinders and the digital balance.'), target: 'bal',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bal.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Four jars hold water, mustard oil, milk and strong salt water. Each has its own empty 100 mL measuring cylinder, A to D.') },
      ...[0, 1, 2, 3].map((li) => ({
        do: [X('Water: put cylinder A on the balance and press TARE, so it reads 0. Then pour water into it, about 50 mL, and read the mass.'), X('Mustard oil: put cylinder B on the balance, press TARE, pour in about 50 mL of oil and read the mass.'),
          X('Milk: cylinder C, TARE, about 50 mL of milk.'), X('Strong salt water: cylinder D, TARE, about 50 mL.')][li], target: ['cylA', 'cylB', 'cylC', 'cylD'][li],
        act: async (K, o) => { await o.d.doMeasure(li); }, ev: { type: 'measured' },
        check: (K, o) => { const r = o.d.rec[li]; if (!r) return null; const rho = C2.RHO[['water', 'moil', 'milkfull', 'nacl'][li]];
          if (!r.tared) return { ok: false, see: F3((L, w) => `${w('Your reading')}: ${r.m.toFixed(1)} g ${w('for')} ${r.v} mL → ${(r.m / r.v).toFixed(2)} g/mL.`), why: X('You did not press TARE with this cylinder on the balance, so the mass includes the glass of the cylinder. Take it off, press TARE with the empty cylinder, and measure again.') };
          if (Math.abs(r.v - 50) > 3) return { ok: false, see: F3((L, w) => `${r.v} mL ${w('weigh')} ${r.m.toFixed(1)} g: ${(r.m / r.v).toFixed(2)} g/mL.`), why: F3((L, w) => `${w('Not 50 mL, but the density is the same')}: ${rho.toFixed(2)} g/mL. ${w('Density does not depend on how much you take.')}`) }; return null; },
        see: [X('50 mL of water weighs 50.0 g: 50 ÷ 50 = 1.00 g/mL.'), X('50 mL of mustard oil weighs only 46.0 g: 0.92 g/mL. Oil is lighter than water, volume for volume.'),
          X('50 mL of milk weighs 51.5 g: 1.03 g/mL.'), X('50 mL of strong salt water weighs 56.0 g: 1.12 g/mL.')][li],
        why: [X('Density is the mass of each millilitre: density = mass ÷ volume. Water\'s is 1 g/mL.'), X('That is why oil floats on water: a less dense liquid floats on a denser one.'),
          X('Milk is mostly water, with fat, protein and sugar in it. A milkman\'s lactometer checks milk this way: water added to milk lowers its density.'), X('The dissolved salt adds mass but hardly any volume, so the solution is denser than water.')][li] })),
      { do: X('Lower the hydrometer gently into each jar in turn, and read its scale at the surface.'), target: 'hyd',
        act: async (K, o) => { await o.d.doHyd(); }, ev: { type: 'floated' },
        see: X('It sinks deepest in the oil (0.92), less in water (1.00) and milk (1.03), and least in salt water (1.12). Its readings match your own numbers.'),
        why: X('A floating body sinks until it pushes aside its own weight of liquid. In a denser liquid less needs to be pushed aside, so it floats higher.') },
      { do: X('Now put the egg into the water, then into the salt water.'), target: 'egg',
        act: async (K, o) => { await o.d.doEgg(); }, ev: { type: 'egged' },
        see: X('The egg sinks to the bottom of the water but floats in the salt water.'), why: X('A fresh egg is about 1.08 g/mL: denser than water (1.00) but less dense than the salt water (1.12).') },
    ],
    eq: { word: 'Density', sym: 'density = mass ÷ volume · water 1.00 · oil 0.92 · milk 1.03 · salt water 1.12 g/mL' },
    result: { obs: X('50 mL of water weighed 50.0 g, oil 46.0 g, milk 51.5 g and salt water 56.0 g. The hydrometer read 1.00, 0.92, 1.03 and 1.12. The egg sank in water and floated in salt water.'),
      concl: X('Different liquids have different densities: mass ÷ volume. A less dense liquid or object floats on a denser liquid; a denser one sinks.'),
      safety: X('Wipe up spilt oil at once: it makes the floor slippery. Wash your hands after touching the raw egg.'),
      viva: [{ q: X('Which is heavier: a litre of oil or a litre of water?'), a: X('A litre of water (1000 g against about 920 g).') }, { q: X('Why do we press TARE with the empty cylinder on the balance?'), a: X('So the balance shows only the mass of the liquid, not of the glass.') },
        { q: X('How can you make an egg float?'), a: X('Dissolve enough salt in the water to make it denser than the egg.') }] },
  },
  // ============================================================ Class 9 (10) · building molecules
  {
    id: 'cgm9_molecules', subj: 'chemistry', cls: 9, also: [10], ch: C9a, topic: 'matter',
    title: X('Molecule kit: build molecules atom by atom'),
    aim: X('To build water, carbon dioxide, methane, ammonia, ethanol and glucose from atoms with your own hands, where each atom makes as many bonds as its valency, see sodium and chlorine become ions, and compare ball-and-stick and space-filling models.'),
    kind: X('Atoms, molecules and valency'),
    setup(K) {
      const W = Wd(K); noShelf(K); const mk = K.add(C2.moleculeKit({ W }), 0, -0.62); mk.W = W;
      const knobSpace = K.add(pullTab(), 0.3, -0.85);
      const o = { mk, knobSpace, W, trayAt: (n, cnt) => mk.g.localToWorld(V(-0.15 + (n - (cnt - 1) / 2) * 0.05 + 0.15, 0.002, 0.14)).setY(Y),
        why: (res, el, M) => { const L = K.app.lang; const e = t3(L, ELN[el === 'OH' ? 'O' : el] || N(el)), m = M ? M.f : '';
          if (res.why === 'absent') return fill(t3(L, X('There is no {el} in {mol}.')), { el: e, mol: m });
          if (res.why === 'full') return fill(t3(L, X('Every {el} place in {mol} is filled: no atom has a free hole for it.')), { el: e, mol: m });
          if (res.why === 'nopartner') return fill(t3(L, X('{el} has no free hole to join yet: it bonds to {need}. Put that in first.')), { el: e, need: res.need.map((x) => t3(L, ELN[x])).join(', ') });
          if (res.why === 'notyet') return t3(L, X('No bond needs a second stick yet: put the atoms in first.'));
          if (res.why === 'nodouble') return fill(t3(L, X('{mol} has only single bonds: the spring is not needed.')), { mol: m });
          if (res.why === 'ion') return t3(L, X('Only the sodium atom goes to the chlorine here.'));
          return ''; },
        saltLine: () => t3(K.app.lang, X('Bring the sodium atom to the chlorine atom.')) };
      C3.bindMolecules(o, K, { water: 1, co2: 2, methane: 3, ammonia: 4, ethanol: 5, glucose: 6, salt: 7, space: 8 }, Object.fromEntries(['water', 'co2', 'methane', 'ammonia', 'ethanol', 'glucose', 'salt', 'space'].map((k) => [k, emit(K, mk, 'built')])));
      camBy(mk, K.app, [mk.views.shelf, mk.views.build, mk.views.build, mk.views.build, mk.views.build, mk.views.build, mk.views.build, mk.views.build, mk.views.shelf]);
      return { mk, knobSpace, o };
    },
    steps: [
      { do: X('Kyun? Water is H₂O: two hydrogens and one oxygen. Why not HO or H₃O? Look at the kit: each ball has holes for its bonds.'), target: 'mk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mk.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Black carbon has 4 holes, blue nitrogen 3, red oxygen 2 and white hydrogen 1: as many as the valency of each atom. The grey sticks are bonds.') },
      { do: X('Build water: put the oxygen on the board, then the hydrogen atoms where the yellow pegs show free holes. Try the spare atoms too.'), target: 'mk', act: async (K, o) => { await o.o.build('water'); }, ev: { type: 'built' },
        see: X('H₂O: oxygen has made its 2 bonds, each hydrogen its 1. A third hydrogen finds no free hole. The molecule is bent.'), why: X('Valency is the number of bonds an atom makes. Oxygen\'s is 2, hydrogen\'s is 1, so one oxygen holds exactly two hydrogens.') },
      { do: X('Build carbon dioxide: a carbon and two oxygens. Carbon still has free holes: use the springs to make double bonds.'), target: 'mk', act: async (K, o) => { await o.o.build('co2'); }, ev: { type: 'built' },
        see: X('O=C=O: carbon makes 4 bonds, two to each oxygen. The molecule is straight.'), why: X('With only two atoms to bond to, carbon fills its valency of 4 with two double bonds.') },
      { do: X('Build methane: one carbon and four hydrogens.'), target: 'mk', act: async (K, o) => { await o.o.build('methane'); }, ev: { type: 'built' },
        see: X('CH₄: the four hydrogens point to the corners of a pyramid with a triangular base (a tetrahedron), as far apart as they can be.'), why: X('Methane is the main gas in biogas and in the natural gas used for cooking.') },
      { do: X('Build ammonia: one nitrogen and three hydrogens.'), target: 'mk', act: async (K, o) => { await o.o.build('ammonia'); }, ev: { type: 'built' },
        see: X('NH₃: nitrogen makes 3 bonds; the molecule is a low pyramid with the nitrogen on top.'), why: X('Nitrogen\'s valency is 3. Ammonia is made in factories to make fertilisers.') },
      { do: X('Build ethanol, C₂H₅OH: two carbons, one oxygen and six hydrogens.'), target: 'mk', act: async (K, o) => { await o.o.build('ethanol'); }, ev: { type: 'built' },
        see: X('Each carbon makes 4 bonds, the oxygen 2 and every hydrogen 1. One hydrogen sits on the oxygen: the –OH group.'), why: X('The –OH group makes ethanol an alcohol. It mixes with water because of it.') },
      { do: X('Glucose, C₆H₁₂O₆: the ring and its hydrogens are already built. Add the five –OH groups where carbon still has a free hole.'), target: 'mk', act: async (K, o) => { await o.o.build('glucose'); }, ev: { type: 'built' },
        see: X('A ring of five carbons and one oxygen, with five –OH groups: 6 carbons, 12 hydrogens and 6 oxygens, 24 atoms in all.'), why: X('Plants make glucose in photosynthesis; our cells break it down for energy.') },
      { do: X('Salt is different. Bring the sodium atom to the chlorine atom and watch.'), target: 'mk', act: async (K, o) => { await o.o.build('salt'); const t0 = performance.now(); while (!o.mk.saltNa && performance.now() - t0 < 8000) await K.sleep(0.2); }, ev: { type: 'built' },
        see: X('One electron jumps from sodium to chlorine. Sodium becomes a smaller Na⁺ ion and chlorine a bigger Cl⁻ ion. They hold each other by their opposite charges, with no shared bond.'),
        why: X('Sodium chloride is ionic. In a grain of salt, millions of Na⁺ and Cl⁻ ions take turns in a cube lattice; there is no separate NaCl molecule.') },
      { do: X('Press the button to see all your models as space-filling models.'), target: 'knobSpace', act: async (K, o) => { o.o.doSpace(); await K.sleep(2); }, ev: { type: 'built' },
        see: X('The balls swell to the real sizes of the atoms and overlap: the sticks are gone. This is closer to how a molecule really fills space.'), why: X('A ball-and-stick model shows the bonds and angles clearly; a space-filling model shows the shape and size.') },
    ],
    eq: { word: 'Valency', sym: 'H 1 · O 2 · N 3 · C 4 → H₂O, CO₂, CH₄, NH₃, C₂H₅OH, C₆H₁₂O₆' },
    result: { obs: X('Each molecule could be built only one way: hydrogen made 1 bond, oxygen 2, nitrogen 3 and carbon 4. Extra atoms found no free hole. Sodium gave an electron to chlorine and they became ions.'),
      concl: X('The formula of a molecule follows from the valencies of its atoms; each atom makes as many bonds as its valency. Covalent molecules share electrons in bonds; salt is made of ions.'),
      safety: X('Keep the small balls of the kit away from very young children.'),
      viva: [{ q: X('What is the valency of carbon?'), a: X('4.') }, { q: X('How many bonds join carbon and oxygen in CO₂?'), a: X('Two double bonds: O=C=O.') }, { q: X('Is there a molecule of NaCl?'), a: X('No; salt is a lattice of Na⁺ and Cl⁻ ions.') }] },
  },
  ...EXPERIMENTS_SXC,
  ...EXPERIMENTS_SX2,
  ...EXPERIMENTS_SX3,
];
