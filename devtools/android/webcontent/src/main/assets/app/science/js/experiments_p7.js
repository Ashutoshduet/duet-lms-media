// Physics experiments, batch 7 (Class 8, Curiosity): pressure (water columns on balloons, jets from a bottle, a rubber sucker,
// air flowing between balloons, blowing between hanging balloons) and measurement (a digital balance with tare, reading a measuring
// cylinder, the volume of a notebook, the density of a stone, and an egg that floats in salt water).
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C6 = N('Ch 6 · Pressure, Winds, Storms, and Cyclones', 'अध्याय 6 · दाब, पवन, तूफ़ान और चक्रवात', 'Ch 6 · Pressure, Winds, Storms aur Cyclones');
const C9 = N('Ch 9 · The Amazing World of Solutes, Solvents, and Solutions', 'अध्याय 9 · विलेय, विलायक और विलयन की अद्भुत दुनिया', 'Ch 9 · Solutes, Solvents aur Solutions ki amazing duniya');
const G = 9.8;
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const Q0 = (K) => new K.THREE.Quaternion();
const _S = [X('Height of water'), X('Bulge'), X('Same height, same bulge'), X('Pull'), X('Length'), X('Width'), X('Height'), X('Volume'), X('Mass'), X('Density'), X('spoons of salt'), X('The egg sinks'), X('The egg floats'), X('Capacity'), X('Least count')];
void _S;

export const EXPERIMENTS_P7 = [
  {
    id: 'p8_water_column', subj: 'physics', cls: 8, ch: C6, title: X('Pressure of a water column'),
    aim: X('To show that the pressure of water at the bottom of a column depends on its height, not on how much water there is.'),
    kind: X('Liquid pressure and height'),
    setup(K) { const st = K.add(K.M4.pipeStand(), 0, -0.72); const nw = K.add(K.M4.balloonPipe({ r: 0.008 }), -0.07, -0.69); const wd = K.add(K.M4.balloonPipe({ r: 0.016 }), 0.07, -0.69); const bk = K.beaker(0.3, -0.5, 'water', 200, 250); return { st, nw, wd, bk }; },
    steps: [
      { do: X('Balloons are tied over the lower ends of a narrow and a wide pipe, clamped upright. Pour water into both up to the 12 cm mark.'), target: 'bk', act: async (K, o) => { await K.pour(o.bk, o.nw, 17.4); await K.pour(o.bk, o.wd, 82.6); await K.sleep(1.2); await tag(K, o.wd, tl(K, X('Same height, same bulge')), 2.4, 0.36, -0.06); }, ev: { type: 'pour' },
        see: X('Both balloons bulge by the same amount, although the wide pipe holds about five times as much water.'), why: X('The pressure at the bottom depends only on the height of the water column above it (p = h ρ g), not on the width of the pipe.') },
      { do: X('Now pour more water into the narrow pipe, up to the 24 cm mark.'), target: 'nw', act: async (K, o) => { await K.pour(o.bk, o.nw, 17.4); await K.sleep(1.4); await tag(K, o.nw, `${tl(K, X('Height of water'))}: 24 cm`, 2.4, 0.36, -0.06); }, ev: { type: 'pour' },
        see: X('The balloon under the narrow pipe now bulges much more.'), why: X('A taller column of water presses harder on the bottom: liquid pressure increases with depth.') },
    ],
    eq: { word: 'Pressure of a liquid column', sym: 'p = h ρ g · 12 cm of water → about 1.2 kPa; 24 cm → about 2.4 kPa' },
    result: { obs: X('With 12 cm of water in each pipe both balloons bulged equally; with 24 cm in the narrow pipe its balloon bulged much more.'),
      concl: X('The pressure of a liquid at the bottom of a column depends on the height of the column, not on the amount of liquid.'),
      safety: X('Tie the balloons tightly so that water does not leak; wipe up any spills.'),
      viva: [{ q: X('Why is a dam made wider at the bottom?'), a: X('Water pressure is greatest at the bottom, where the water is deepest.') }, { q: X('Why do divers feel pressure on their ears deep in water?'), a: X('Pressure increases with depth.') }, { q: X('Does the pressure depend on the width of the pipe?'), a: X('No, only on the height (depth) of the liquid.') }] },
  },
  {
    id: 'p8_water_jets', subj: 'physics', cls: 8, ch: C6, title: X('Water presses on the walls of its container'),
    aim: X('To show that a liquid exerts pressure on the walls of its container.'),
    kind: X('Liquid pressure on the sides'),
    setup(K) { const tr = K.add(K.M4.tray(), 0, -0.64); const bl = K.add(K.MC.woodBlock(0.1, 0.05, 0.1), 0, -0.64, { y: BENCH_Y + 0.004 }); const bt = K.add(K.M4.holeBottle(), 0, -0.64, { y: BENCH_Y + 0.055 }); const bk = K.beaker(0.32, -0.46, 'water', 470, 500);
      K.solver((dt) => { bt.jets(dt, -0.05); if (bt.open && bt.reach > 0) { tr.wet.material.opacity = 0.5; const r = Math.max(tr.wet.scale.x, bt.reach + 0.04); tr.wet.scale.setScalar(Math.min(0.22, r)); } }); return { tr, bl, bt, bk }; },
    steps: [
      { do: X('Four holes have been made all round the bottle at the same height and sealed with tape. Fill the bottle with water.'), target: 'bk', act: (K, o) => K.pour(o.bk, o.bt, 450), ev: { type: 'pour' },
        see: X('No water comes out while the holes are taped.') },
      { do: X('Pull off all four pieces of tape together.'), target: 'bt', act: async (K, o) => { o.bt.peel(); K.app.audio && K.app.audio.pour && K.app.audio.pour(); await K.sleep(1.6); o.r0 = o.bt.reach; await tag(K, o.bt, `≈ ${Math.round(o.r0 * 100)} cm`, 2.2, 0.28); K.lab.emit('peel', { obj: o.bt.id }); }, ev: { type: 'peel' },
        see: X('Water spurts out of all four holes, and all the jets land equally far from the bottle.'), why: X('Water presses outwards on the walls of the bottle. At the same depth the pressure is the same in all directions, so the jets are equal.') },
      { do: X('Keep watching as the water level falls (time-lapse).'), target: 'bt', act: async (K, o) => { const l0 = K.app.chem.lapse; K.app.lapseShown = 6; await K.tween(6, (k, d) => { for (let i = 0; i < 5; i++) o.bt.jets(d, -0.05); }); K.app.lapseShown = 0; K.app.chem.lapse = l0; await tag(K, o.bt, `≈ ${Math.round(o.bt.reach * 100)} cm`, 2.2, 0.28); }, ev: { type: 'look' },
        see: X('As the water level falls, the jets become weaker and land closer to the bottle.'), why: X('With less water above the holes the pressure there is less.') },
    ],
    eq: { word: 'Liquid pressure', sym: 'pressure at a depth h: p = h ρ g · speed of the jet v = √(2 g h)' },
    result: { obs: X('Water spurted equally far out of four holes at the same height; the jets got shorter as the water level fell.'),
      concl: X('A liquid exerts pressure on the walls of its container. At a given depth the pressure is the same in all directions, and it is less where the liquid is shallower.'),
      safety: X('Do this over a tray; wipe up all the water afterwards.'),
      viva: [{ q: X('Why are the jets equal?'), a: X('The holes are at the same depth, where the pressure is the same.') }, { q: X('What happens to the jets as the bottle empties?'), a: X('They become weaker because the pressure decreases.') }, { q: X('Why are water tanks placed high on buildings?'), a: X('The height of the water gives it pressure to flow through the taps.') }] },
  },
  {
    id: 'p8_sucker', subj: 'physics', cls: 8, ch: C6, title: X('A rubber sucker and air pressure'),
    aim: X('To show the pressure of the atmosphere using a rubber sucker on a smooth surface.'),
    kind: X('Atmospheric pressure'),
    setup(K) { const tl0 = K.add(K.M4.tile(), 0, -0.62); const sk = K.add(K.M4.sucker(), 0.2, -0.5); const bal = K.add(K.MC.springBalance({ unit: 'N', max: 10, lc: 0.2 }), 0.32, -0.6, { y: BENCH_Y + 0.4 }); return { tl0, sk, bal }; },
    steps: [
      { do: X('Press the rubber sucker firmly on the smooth tile.'), target: 'sk', act: async (K, o) => { const p = o.tl0.g.position; await K.moveTo(o.sk, V(K, p.x, BENCH_Y + 0.009 + 0.012, p.z), Q0(K), 1); await K.tween(0.8, (k) => { o.sk.flat(k); o.sk.g.position.y = BENCH_Y + 0.021 - 0.009 * k; }); o.sk.home = { p: o.sk.g.position.clone(), q: o.sk.g.quaternion.clone() }; K.lab.emit('press', { obj: o.sk.id }); }, ev: { type: 'press' },
        see: X('The sucker flattens and most of the air under it is pushed out.') },
      { do: X('Hook the spring balance to the sucker and try to pull it straight up.'), target: 'bal', act: async (K, o) => { const p = o.sk.g.position; await K.moveTo(o.bal, V(K, p.x, p.y + 0.205, p.z), Q0(K), 1); await K.tween(2.2, (k) => { o.bal.load = 10.4 * k; o.bal.g.position.y = p.y + 0.205 + 0.1 * Math.min(1, o.bal.shown / 10); }); await K.sleep(0.6); await tag(K, o.bal, `${tl(K, X('Pull'))}: > 10 N`, 2.4, -0.05); }, ev: { type: 'pull' },
        see: X('Even a pull of more than 10 N does not take the sucker off the tile.'), why: X('There is almost no air under the sucker, so the air outside presses it hard against the tile. This push of the air is atmospheric pressure.') },
      { do: X('Lift the edge of the sucker a little with a fingernail.'), target: 'sk', act: async (K, o) => { K.app.audio && K.app.audio.hiss && K.app.audio.hiss(); await K.tween(0.4, (k) => o.sk.flat(1 - k)); o.bal.load = 0.1; const y0 = o.sk.g.position.y; const b0 = o.bal.g.position.y; await K.tween(0.8, (k) => { o.sk.g.position.y = y0 + 0.05 * k; o.bal.g.position.y = b0 + 0.05 * k - 0.1 * (1 - Math.min(1, o.bal.shown / 10)); }); await K.sleep(0.6); }, ev: { type: 'lift' },
        see: X('Air rushes in with a hiss and the sucker comes off easily.'), why: X('Once air gets under the sucker, the air presses equally on both sides.') },
    ],
    eq: { word: 'Atmospheric pressure', sym: 'about 100 kPa: the air presses about 10 N on every square centimetre' },
    result: { obs: X('The pressed sucker could not be pulled off with more than 10 N, but it came off easily once air was let in under its edge.'),
      concl: X('The air around us exerts pressure (atmospheric pressure). It holds the sucker against the tile when there is no air under it.'),
      safety: X('Do not pull the spring balance beyond its range.'),
      viva: [{ q: X('Why does a sucker not stick to a rough wall?'), a: X('Air leaks in under it through the gaps.') }, { q: X('Name two things that work because of air pressure.'), a: X('A drinking straw, a syringe, a dropper, a sucker hook.') }, { q: X('Why don’t we feel the air pressing on us?'), a: X('The pressure inside our body balances it.') }] },
  },
  {
    id: 'p8_straw_balloons', subj: 'physics', cls: 8, ch: C6, title: X('Air moves from high to low pressure'),
    aim: X('To show that air flows from a region of higher pressure to one of lower pressure.'),
    kind: X('Air pressure and wind'),
    setup(K) { const sb = K.add(K.M4.strawBalloons(), 0, -0.6); return { sb }; },
    steps: [
      { do: X('One balloon is blown up; the other is almost empty. They are joined by a straw that is pinched shut with a clip.'), target: 'sb', act: (K) => K.sleep(1.4), see: X('The full balloon stays full while the straw is closed.') },
      { do: X('Remove the clip.'), target: 'sb', act: async (K, o) => { o.sb.open = true; K.app.audio && K.app.audio.burst && K.app.audio.burst(1.6, 700, 0.15, 'bandpass'); await K.sleep(3.2); K.lab.emit('open', { obj: o.sb.id }); }, ev: { type: 'open' },
        see: X('Air rushes from the full balloon into the empty one until they are about the same size.'), why: X('The air in the stretched balloon is at a higher pressure. Air always moves from higher pressure to lower pressure — this is how winds blow.') },
    ],
    eq: { word: 'Wind', sym: 'air moves from high pressure → low pressure' },
    result: { obs: X('When the clip was removed, air flowed from the inflated balloon into the uninflated one until both were about equal.'),
      concl: X('Air moves from a region of high pressure to a region of low pressure. Winds blow the same way, from high-pressure to low-pressure areas.'),
      safety: X('Do not over-inflate the balloon.'),
      viva: [{ q: X('What causes wind?'), a: X('Differences in air pressure, often caused by uneven heating of the Earth.') }, { q: X('Why does the flow stop?'), a: X('The pressures in the two balloons become equal.') }, { q: X('Where does air move from on a hot day near the sea?'), a: X('From the sea (cooler, higher pressure) towards the land (warmer, lower pressure).') }] },
  },
  {
    id: 'p8_blow_balloons', subj: 'physics', cls: 8, ch: C6, title: X('Blowing between two balloons'),
    aim: X('To show that fast-moving air has lower pressure.'),
    kind: X('Moving air and pressure'),
    setup(K) { const bp = K.add(K.M3.balloonPair({ sep: 0.22 }), 0.1, -0.66); bp.blow = 0; bp.pull = (i) => (i ? -1 : 1) * bp.blow * 0.012; return { bp }; },
    steps: [
      { do: X('Two balloons hang on strings from a stick, about 8 cm apart.'), target: 'bp', act: (K) => K.sleep(1.2), see: X('They hang straight down.') },
      { do: X('Blow air through a straw into the gap between the balloons.'), target: 'bp', act: async (K, o) => { o.bp.blow = 1; K.app.audio && K.app.audio.burst && K.app.audio.burst(2.2, 1200, 0.12, 'bandpass'); await K.sleep(2.4); o.bp.blow = 0; await K.sleep(1.6); K.lab.emit('blow', { obj: o.bp.id }); }, ev: { type: 'blow' },
        see: X('The balloons move towards each other instead of being blown apart!') },
      { do: X('Blow harder.'), target: 'bp', act: async (K, o) => { o.bp.blow = 2.2; K.app.audio && K.app.audio.burst && K.app.audio.burst(2.2, 1400, 0.2, 'bandpass'); await K.sleep(2.4); o.bp.blow = 0; await K.sleep(1.6); K.lab.emit('blow', { obj: o.bp.id }); }, ev: { type: 'blow' },
        see: X('They come together faster and closer.'), why: X('Fast-moving air between the balloons has lower pressure. The still air on the outside, at higher pressure, pushes them together.') },
    ],
    eq: { word: 'Moving air', sym: 'faster air → lower pressure' },
    result: { obs: X('When air was blown between the hanging balloons they moved towards each other, and faster when blown harder.'),
      concl: X('Fast-moving air has lower pressure than still air. This helps explain why roofs are lifted off in storms.'),
      safety: X('Use a clean straw of your own.'),
      viva: [{ q: X('Why can a strong wind lift a roof?'), a: X('Fast wind over the roof lowers the pressure above it; the higher pressure inside pushes it up.') }, { q: X('Did the balloons move apart or together?'), a: X('Together.') }, { q: X('What pushes them together?'), a: X('The higher pressure of the still air outside.') }] },
  },
  {
    id: 'p8_digital_balance', subj: 'physics', cls: 8, ch: C9, title: X('Measuring mass with a digital balance'),
    aim: X('To measure the mass of a solid with a digital balance, using the tare button.'),
    kind: X('Digital balance and tare'),
    setup(K) { const bal = K.add(K.A5.balance(), 0, -0.6); const wg = K.add(K.A.watchGlass(), 0.2, -0.48); wg.glassG = 12.35; const st = K.add(K.M4.smallStone({ thread: 0.0001 }), 0.3, -0.56); return { bal, wg, st }; },
    steps: [
      { do: X('Switch on the balance and check that it reads zero.'), target: 'bal', act: (K) => K.sleep(1.2), see: X('The display shows 0.00 g.') },
      { do: X('Put the clean, dry watch glass on the pan.'), target: 'wg', act: async (K, o) => { await K.onBalance(o.wg, o.bal); await K.sleep(1.2); await tag(K, o.bal, `${o.bal.reading().toFixed(2)} g`, 2, 0.08); }, ev: { type: 'weigh' },
        see: X('The display shows the mass of the watch glass, 12.35 g.') },
      { do: X('Press TARE.'), target: 'bal', act: (K, o) => K.tareBal(o.bal), ev: { type: 'tare' }, see: X('The display goes back to 0.00 g, with the watch glass still on the pan.'), why: X('Tare subtracts the mass of the container, so the next reading is only the mass of what you put in it.') },
      { do: X('Put the stone on the watch glass and read its mass.'), target: 'st', act: async (K, o) => { const top = o.wg.g.position; await K.moveTo(o.st, V(K, top.x, top.y + 0.004, top.z), Q0(K), 1); o.bal.on.push(o.st); o.bal.settle = 0.8; await K.sleep(1.4); await tag(K, o.bal, `${o.bal.reading().toFixed(2)} g`, 2.4, 0.08); K.lab.emit('weigh', { v: o.st.id }); }, ev: { type: 'weigh' },
        see: X('The balance shows 16.40 g: the mass of the stone alone.') },
    ],
    eq: { word: 'Mass with tare', sym: 'reading = (watch glass + stone) − watch glass = 16.40 g' },
    result: { obs: X('Watch glass: 12.35 g. After tare: 0.00 g. With the stone: 16.40 g.'),
      concl: X('A digital balance measures mass. The tare button lets us find the mass of a substance without the container.'),
      safety: X('Do not put hot, wet or very heavy things directly on the pan. Keep the balance level and away from draughts.'),
      viva: [{ q: X('What does the tare button do?'), a: X('It sets the reading to zero with the container on the pan.') }, { q: X('What is the SI unit of mass?'), a: X('The kilogram (kg).') }, { q: X('Is mass the same as weight?'), a: X('No: mass is the amount of matter (kg); weight is the force of gravity on it (N).') }] },
  },
  {
    id: 'p8_cylinder_read', subj: 'physics', cls: 8, ch: C9, title: X('Reading a measuring cylinder'),
    aim: X('To find the capacity and least count of a measuring cylinder and to measure 50 mL of water correctly.'),
    kind: X('Volume of a liquid'),
    setup(K) { const cy = K.add(K.MC.cylinder100(), 0, -0.62); const bk = K.beaker(-0.22, -0.52, 'water', 120, 250); return { cy, bk }; },
    steps: [
      { do: X('Look at the cylinder: find its largest mark (capacity) and count the small divisions between 10 mL and 20 mL.'), target: 'cy', act: async (K, o) => { await tag(K, o.cy, `${tl(K, X('Capacity'))}: 100 mL`, 2, 0.24); await tag(K, o.cy, `${tl(K, X('Least count'))}: 10 mL ÷ 10 = 1 mL`, 2.4, 0.24); }, ev: { type: 'look' },
        see: X('Capacity 100 mL; there are 10 divisions between 10 and 20 mL, so the least count is 1 mL.') },
      { do: X('Pour water into the cylinder up to about the 50 mL mark.'), target: 'bk', act: (K, o) => K.pour(o.bk, o.cy, 50), ev: { type: 'pour' }, see: X('The water surface is slightly curved (the meniscus).') },
      { do: X('Bring your eye level with the water surface and read the bottom of the curved surface.'), target: 'cy', act: async (K, o) => { const y = o.cy.levelWorld() - o.cy.g.position.y; o.cy.camView = { p: V(K, 0, y, 0.32), t: V(K, 0, y, 0) }; await K.sleep(2.4); await tag(K, o.cy, `${Math.round(o.cy.ml)} mL`, 2.4, y + 0.02); o.cy.camView = null; }, ev: { type: 'look' },
        see: X('Read at eye level, the bottom of the meniscus is exactly on the 50 mL mark.'), why: X('Looking from above or below makes the reading too high or too low (parallax error).') },
    ],
    eq: { word: 'Least count', sym: 'value of one small division = 10 mL ÷ 10 = 1 mL' },
    result: { obs: X('Capacity 100 mL, least count 1 mL. Read at eye level, the bottom of the meniscus stood at 50 mL.'),
      concl: X('To measure the volume of a liquid, keep the cylinder on a level surface and read the bottom of the meniscus with your eye at the same level.'),
      safety: X('Keep the cylinder on a flat table; do not hold it up in the air while reading.'),
      viva: [{ q: X('What is a meniscus?'), a: X('The curved surface of a liquid in a narrow tube.') }, { q: X('Where should your eye be when reading?'), a: X('Level with the bottom of the meniscus.') }, { q: X('What is 1 mL in cm³?'), a: X('1 mL = 1 cm³.') }] },
  },
  {
    id: 'p8_cuboid_volume', subj: 'physics', cls: 8, ch: C9, title: X('Volume of a notebook'),
    aim: X('To find the volume of a regular solid (a notebook) by measuring its length, width and height.'),
    kind: X('Volume = length × width × height'),
    setup(K) { const nb = K.add(K.M4.notebook(), -0.02, -0.62); const sc = K.add(K.MC.scale30(), 0.1, -0.44); sc.place(0); sc.loads = []; sc.selfG = 0; sc.update = () => {}; return { nb, sc }; },
    steps: [0, 1, 2].map((i) => ({
      do: X(['Measure the length of the notebook with the scale.', 'Measure its width.', 'Measure its height (thickness).'][i]), target: i ? 'nb' : 'sc',
      act: async (K, o) => { const p = o.nb.g.position; const [L, W, H] = o.nb.dims; const q = [Q0(K), new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), Math.PI / 2), new K.THREE.Quaternion().setFromAxisAngle(V(K, 1, 0, 0), Math.PI / 2)][i];
        const at = [V(K, p.x + 0.155 - L / 2 - 0.005, p.y + H + 0.0005, p.z + W / 2 - 0.012), V(K, p.x + L / 2 - 0.02, p.y + H + 0.0005, p.z - W / 2 + 0.155 - 0.005), V(K, p.x - L / 2 - 0.004, p.y + 0.155 - 0.005, p.z + W / 2 - 0.04)][i]; await K.moveTo(o.sc, at, q, 1.1);
        await tag(K, o.nb, `${tl(K, X(['Length', 'Width', 'Height'][i]))} = ${[25, 18, 2][i]} cm`, 2.2, 0.08); (o.m = o.m || [])[i] = [25, 18, 2][i]; await K.home(o.sc, 0.8); K.lab.emit('measure', { obj: o.nb.id }); }, ev: { type: 'measure' },
      see: X(['Length = 25 cm.', 'Width = 18 cm.', 'Height = 2 cm.'][i]), ...(i === 2 ? { why: X('Volume of a cuboid = length × width × height = 25 cm × 18 cm × 2 cm = 900 cm³.') } : {}),
    })),
    eq: { word: 'Volume of a cuboid', sym: 'V = l × w × h = 25 cm × 18 cm × 2 cm = 900 cm³' },
    result: { obs: X('Length 25 cm, width 18 cm, height 2 cm.'),
      concl: X('The volume of the notebook is 25 × 18 × 2 = 900 cm³.'),
      safety: X('Place the zero mark of the scale exactly at one edge and read the other edge straight from above.'),
      viva: [{ q: X('What is the SI unit of volume?'), a: X('The cubic metre (m³); cm³ is also used.') }, { q: X('How would you find the volume of a stone?'), a: X('By the rise in the water level when it is lowered into a measuring cylinder.') }, { q: X('What is the volume of a cube of side 2 cm?'), a: X('2 × 2 × 2 = 8 cm³.') }] },
  },
  {
    id: 'p8_density_stone', subj: 'physics', cls: 8, ch: C9, title: X('Volume and density of a stone'),
    aim: X('To find the volume of an irregular solid by displacement of water, and its density.'),
    kind: X('Displacement and density'),
    setup(K) { const cy = K.MC.withDisp(K.add(K.MC.cylinder100(), 0.05, -0.62)); const bk = K.beaker(-0.2, -0.52, 'water', 120, 250); const st = K.add(K.M4.smallStone(), 0.26, -0.5); K.solver(() => K.MC.immerse(st, [cy])); return { cy, bk, st }; },
    steps: [
      { do: X('The mass of the stone, found with the digital balance, is 16.4 g. Pour water into the cylinder up to 50 mL.'), target: 'bk', act: async (K, o) => { await K.pour(o.bk, o.cy, 50); await tag(K, o.cy, `${Math.round(o.cy.ml)} mL`, 2, 0.24); }, ev: { type: 'pour' }, see: X('Initial volume = 50 mL.') },
      { do: X('Lower the stone slowly by its thread until it is completely under water. Read the new level.'), target: 'st', act: async (K, o) => { const c = o.cy.g.position; await K.moveTo(o.st, V(K, c.x, BENCH_Y + 0.26, c.z), Q0(K), 1.1); const y0 = o.st.g.position.y; const y1 = BENCH_Y + 0.0076; await K.tween(2.4, (k) => { o.st.g.position.y = y0 + (y1 - y0) * k; }); await K.sleep(1); o.V2 = Math.round(o.cy.ml + o.cy.disp); await tag(K, o.cy, `${o.V2} mL`, 2.4, 0.24); K.lab.emit('dip', { obj: o.st.id }); }, ev: { type: 'dip' },
        see: X('The water rises to 55 mL.') },
      { do: X('Find the volume and the density of the stone.'), target: 'cy', act: (K, o) => K.showTag(`V = ${(o.V2 ?? 55) - 50} cm³ · ρ = 16.4 g ÷ ${(o.V2 ?? 55) - 50} cm³ = ${(16.4 / ((o.V2 ?? 55) - 50)).toFixed(2)} g/cm³`, o.cy.g.position.clone().add(V(K, 0, 0.26, 0)), V(K, 0.1, 0.05, 0), 3.5), ev: { type: 'look' },
        see: X('Volume = 55 − 50 = 5 cm³; density = 16.4 g ÷ 5 cm³ ≈ 3.3 g/cm³.'), why: X('The stone pushes aside water equal to its own volume. Density = mass ÷ volume.') },
    ],
    eq: { word: 'Density', sym: 'ρ = m / V = 16.4 g / 5 cm³ ≈ 3.3 g/cm³' },
    result: { obs: X('Mass 16.4 g; water level 50 mL → 55 mL; volume of the stone 5 cm³.'),
      concl: X('The volume of an irregular solid can be found by displacement of water. The density of this stone is about 3.3 g/cm³, so it sinks in water.'),
      safety: X('Lower the stone gently so that the cylinder does not crack and no water splashes out.'),
      viva: [{ q: X('Why must the stone be fully under water?'), a: X('Only then is the water displaced equal to the whole volume of the stone.') }, { q: X('Will a solid of density 0.8 g/cm³ float or sink in water?'), a: X('It will float (it is less dense than water).') }, { q: X('Why do we lower the stone with a thread?'), a: X('So that it does not hit the bottom and so that no water splashes out.') }] },
  },
  {
    id: 'p8_egg_float', subj: 'physics', cls: 8, ch: C9, title: X('Making an egg float'),
    aim: X('To make a sinking egg float by making the water denser with salt.'),
    kind: X('Density and floating'),
    setup(K) { const bk = K.beaker(0, -0.62, 'water', 200, 250); const eg = K.add(K.M4.egg(), 0.2, -0.5); const rod = K.rod(0.2, -0.7); const salt = K.add(K.A.powderHeap(0xf4f4f0), -0.22, -0.52); bk.saltG = 0; return { bk, eg, rod, salt }; },
    steps: [
      { do: X('Put the raw egg gently into the glass of tap water.'), target: 'eg', act: async (K, o) => { const c = o.bk.g.position; await K.moveTo(o.eg, V(K, c.x, o.bk.levelWorld() + 0.01, c.z), Q0(K), 1); await place(K, o, 1.6); }, ev: { type: 'look' },
        see: X('The egg sinks to the bottom.'), why: X('The egg (about 1.08 g/cm³) is denser than water (1.00 g/cm³).') },
      { do: X('Add salt one spoonful at a time and stir gently. Watch the egg after each spoonful.'), target: 'salt', act: async (K, o) => { for (let n = 1; n <= 5; n++) { const p = o.salt.g.position; void p; o.bk.saltG = n * 5; await K.stir(o.rod, o.bk, 1.2); await place(K, o, 1); await tag(K, o.bk, `${n} ${tl(K, X('spoons of salt'))}: ρ ≈ ${rhoOf(o.bk).toFixed(2)} g/cm³ · ${tl(K, X(rhoOf(o.bk) >= o.eg.rho ? 'The egg floats' : 'The egg sinks'))}`, 1.6, 0.14); } K.lab.emit('salt', { obj: o.bk.id }); }, ev: { type: 'salt' },
        see: X('With 4 spoonfuls the egg still sinks; after the 5th spoonful it rises and floats.'), why: X('Dissolving salt makes the water denser. When the salt water becomes denser than the egg, the egg floats.') },
    ],
    eq: { word: 'Floating and sinking', sym: 'egg floats when ρ(liquid) > ρ(egg) ≈ 1.08 g/cm³' },
    result: { obs: X('The egg sank in tap water; as salt was dissolved it stayed down for 4 spoonfuls and floated after the 5th.'),
      concl: X('An object floats in a liquid that is denser than it and sinks in one that is less dense. Salt water is denser than fresh water.'),
      safety: X('Handle the egg gently; wash your hands after touching a raw egg.'),
      viva: [{ q: X('Why is it easier to float in the sea than in a river?'), a: X('Sea water is salty and denser.') }, { q: X('What would happen if you added fresh water now?'), a: X('The water would become less dense and the egg would sink again.') }, { q: X('Is an egg denser than tap water?'), a: X('Yes, slightly (about 1.08 g/cm³).') }] },
  },
];

// salt water: about 0.0071 g/cm³ denser for every gram of salt in 100 mL
function rhoOf(bk) { return 1 + 0.0071 * ((bk.saltG || 0) / Math.max(1, bk.ml)) * 100; }
// the egg settles: on the bottom if it is denser than the water, else floating with a little of it above the surface
async function place(K, o, sec) { const e = o.eg, bk = o.bk; const bot = bk.g.localToWorld(V(K, 0, bk.inner[0].y + 0.0005, 0)).y; const lv = bk.levelWorld(); const r = rhoOf(bk); const y1 = r >= e.rho ? lv - 0.056 * Math.min(0.97, e.rho / r) : bot; const y0 = e.g.position.y; await K.tween(sec, (k) => { e.g.position.y = y0 + (y1 - y0) * (1 - Math.pow(1 - k, 2)); }); e.home = { p: e.g.position.clone(), q: e.g.quaternion.clone() }; }
