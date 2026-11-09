// Physics experiments, batch 6 (Class 8, Curiosity): magnetic and heating effects of current (compass under a wire, a coil on a
// nail picking up clips, an electromagnet's poles and strength, a hot nichrome wire, a lemon battery lighting an LED), and forces
// (friction on different surfaces, floating ring magnets, a charged scale and charged balloons, a spring, a spring balance, and the
// upthrust on a bottle pushed under water).
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const f2 = (n) => n.toFixed(2);
const C4 = N('Ch 4 · Electricity: Magnetic and Heating Effects', 'अध्याय 4 · विद्युत: चुंबकीय और ऊष्मीय प्रभाव', 'Ch 4 · Electricity: Magnetic aur Heating Effects');
const C5 = N('Ch 5 · Exploring Forces', 'अध्याय 5 · बलों की खोज', 'Ch 5 · Exploring Forces');
const G = 9.8;
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const red = 0xc62828, blk = 0x222222;
const _S = [X('A is a south pole'), X('A is a north pole'), X('cool'), X('warm'), X('hot — do not touch for long'), X('Distance moved'), X('Upward push of the water'), X('Glass'), X('Wood'), X('Towel'), X('Sand'), X('Stretch'), X('Range'), X('Least count'), X('Weight'), X('clips')];
void _S;
const holdQ = (K) => new K.THREE.Quaternion();
// which pole is end A of an electromagnet: the N end of the compass needle points to a south pole
function poleAtA(K, o) { const cp = o.cp, A = o.nc.g.localToWorld(V(K, -0.04, 0.0045, 0)); const c = cp.g.position; const ang = Math.atan2(-(A.z - c.z), A.x - c.x); let d = cp.pointing - ang; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < Math.PI / 2 ? 'S' : 'N'; }
async function pickClips(K, o) { const nc = o.nc, cl = o.cl; const p = cl.g.position; const tipOff = nc.tipWorld().sub(nc.g.position); await K.moveTo(nc, V(K, p.x - tipOff.x, BENCH_Y + 0.012, p.z - tipOff.z), null, 1); await K.sleep(0.3); const I = Math.abs(nc.Is || 0); const n = Math.min(cl.clips.length, Math.round(0.62 * I * I * (nc.turns / 50))); cl.follow = () => nc.tipWorld(); cl.cling(n); await K.sleep(0.6); await K.up(nc, 0.08, 0.8); o.n = cl.count(); return o.n; }

export const EXPERIMENTS_P6 = [
  {
    id: 'p8_compass_wire', subj: 'physics', cls: 8, ch: C4, title: X('A current-carrying wire and a compass'),
    aim: X('To show that a wire carrying an electric current deflects a magnetic compass needle placed near it.'),
    kind: X('Magnetic effect of current'),
    setup(K) { const wr = K.add(K.MG.wireXY({ len: 0.26, h: 0.03 }), 0.1, -0.64, { ry: Math.PI / 2 }); const cp = K.add(K.MG.compass(), 0.1, -0.64); cp.ang = Math.PI / 2; const bat = K.add(K.A4.cellPack(1), -0.3, -0.6); bat.rInt = 0.45; const key = K.add(K.A4.plugKey(), -0.16, -0.48);
      K.wires([[[bat, '+'], [key, 'a'], red], [[key, 'b'], [wr, 'a'], red], [[wr, 'b'], [bat, '-'], blk]]); return { wr, cp, bat, key }; },
    steps: [
      { do: X('The wire runs north–south just above a magnetic compass. Look at the needle.'), target: 'cp', act: (K) => K.sleep(1.4), see: X('The needle points north, along the wire.') },
      { do: X('Switch on the current for a few seconds and watch the needle. Then switch off.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(2.4); o.d1 = Math.round(((o.cp.pointing - Math.PI / 2) * 180) / Math.PI); await tag(K, o.cp, `${Math.abs(o.d1)}°`, 1.6, 0.05); await K.keyOn(o.key, false); await K.sleep(1.6); }, ev: { type: 'key' },
        see: X('The needle turns away from north while the current flows, and comes back when it is switched off.'), why: X('A wire carrying a current behaves like a magnet: it has a magnetic field around it.') },
      { do: X('Reverse the connections of the cell and switch on again.'), target: 'bat', act: async (K, o) => { await K.swapEnds(o.bat, '+', '-'); await K.keyOn(o.key, true); await K.sleep(2.4); await K.keyOn(o.key, false); await K.sleep(1); }, ev: { type: 'key' },
        see: X('The needle now turns the other way.'), why: X('Reversing the current reverses the direction of its magnetic field.') },
    ],
    eq: { word: 'Magnetic effect of electric current', sym: 'current in a wire → magnetic field around it' },
    result: { obs: X('The compass needle turned when the current was switched on, came back when it was switched off, and turned the other way when the current was reversed.'),
      concl: X('An electric current produces a magnetic field around the wire carrying it.'),
      safety: X('Switch the current on only for a few seconds; the wire and the cell get hot otherwise.'),
      viva: [{ q: X('Who first observed this effect?'), a: X('Hans Christian Oersted, in 1820.') }, { q: X('What happens if no current flows?'), a: X('The needle points north again, along the Earth’s field.') }, { q: X('How can the deflection be made larger?'), a: X('By passing a larger current, or bringing the wire closer to the compass.') }] },
  },
  {
    id: 'p8_nail_clips', subj: 'physics', cls: 8, ch: C4, title: X('A coil on an iron nail picks up paper clips'),
    aim: X('To show that a coil of wire wound on an iron nail attracts paper clips only while a current flows through it.'),
    kind: X('A simple electromagnet'),
    setup(K) { const nc = K.add(K.M3.nailCoil({ turns: 30 }), 0.0, -0.52); const cl = K.add(K.M3.clipPile(16), 0.2, -0.64); const bat = K.add(K.A4.cellPack(1), -0.3, -0.62); bat.rInt = 0.15; const key = K.add(K.A4.plugKey(), -0.16, -0.5);
      K.wires([[[bat, '+'], [key, 'a'], red], [[key, 'b'], [nc, 'a'], red], [[nc, 'b'], [bat, '-'], blk]]); return { nc, cl, bat, key }; },
    steps: [
      { do: X('Bring the tip of the nail close to the paper clips while no current flows, and lift it.'), target: 'nc', act: async (K, o) => { await pickClips(K, o); await K.sleep(0.6); await K.home(o.nc, 0.9); }, ev: { type: 'lift' },
        see: X('Nothing happens: the nail does not attract the clips.') },
      { do: X('Switch on the current, bring the nail to the clips again and lift it.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); const n = await pickClips(K, o); await tag(K, o.nc, `${n} ${tl(K, X('clips'))}`, 2, 0.08); K.lab.emit('lift', { obj: o.nc.id }); }, ev: { type: 'lift' },
        see: X('Several clips cling to the tip of the nail and hang from it.'), why: X('With a current in the coil, the iron nail becomes a magnet — an electromagnet.') },
      { do: X('Now switch off the current.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, false); await o.cl.drop(1, K); await K.sleep(0.8); }, ev: { type: 'key' },
        see: X('The clips drop off (one may stay for a moment).'), why: X('An electromagnet is a magnet only while the current flows. Soft iron keeps very little magnetism after that.') },
    ],
    eq: { word: 'Electromagnet', sym: 'current in a coil + iron core → strong magnet that can be switched on and off' },
    result: { obs: X('Without current the nail picked up no clips. With current it picked up several clips; when the current was switched off the clips fell.'),
      concl: X('A coil carrying a current, wound on an iron nail, becomes an electromagnet. It works only while the current flows.'),
      safety: X('Connect the cell only for a few seconds at a time; the coil and the cell heat up.'),
      viva: [{ q: X('Name two uses of electromagnets.'), a: X('Electric bells, cranes that lift scrap iron, loudspeakers, motors.') }, { q: X('Why is the nail made of iron?'), a: X('Iron becomes strongly magnetised inside the coil and loses its magnetism when the current stops.') }, { q: X('How can it be made to lift more clips?'), a: X('Use more turns of wire or more cells.') }] },
  },
  {
    id: 'p8_electromagnet', subj: 'physics', cls: 8, ch: C4, title: X('Poles and strength of an electromagnet'),
    aim: X('To find the poles of an electromagnet with a compass, and how its strength and poles depend on the current.'),
    kind: X('Electromagnet: poles and strength'),
    setup(K) { const nc = K.add(K.M3.nailCoil({ turns: 50 }), 0.0, -0.52); nc.name = X('Electromagnet: 50 turns on an iron nail (end A = nail head)'); const cp = K.add(K.MG.compass(), -0.09, -0.52); const cl = K.add(K.M3.clipPile(18), 0.22, -0.66);
      const b1 = K.add(K.A4.cellPack(1), -0.34, -0.64), b2 = K.add(K.A4.cellPack(2), -0.34, -0.74), b4 = K.add(K.A4.cellPack(4), -0.34, -0.84); const key = K.add(K.A4.plugKey(), -0.18, -0.46);
      const [, , wR] = K.wires([[[b1, '+'], [key, 'a'], red], [[key, 'b'], [nc, 'a'], red], [[nc, 'b'], [b1, '-'], blk]]); return { nc, cp, cl, b1, b2, b4, key, wR, cells: 1 }; },
    steps: [
      { do: X('Place the compass near end A (the head of the nail) and switch on the current. Which end of the needle is attracted?'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(2.4); o.pA = poleAtA(K, o); await tag(K, o.cp, tl(K, X(o.pA === 'S' ? 'A is a south pole' : 'A is a north pole')), 2.4, 0.05, -0.06); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The needle swings round so that one of its ends points at end A. The other end of the coil attracts the other end of the needle.'), why: X('A coil carrying a current has a north pole at one end and a south pole at the other, like a bar magnet. The north end of a compass needle points to a south pole.') },
      { do: X('Pick up clips with 1 cell, then with 2 cells and with 4 cells. Count the clips each time.'), target: 'cl', act: async (K, o) => { const res = []; for (const [b, n] of [[o.b1, 1], [o.b2, 2], [o.b4, 4]]) { if (b !== o.b1) { await K.keyOn(o.key, false); const ws = K.wireList; await K.moveLead(ws[0], 'a', b.terms['+']); await K.moveLead(ws[2], 'b', b.terms['-']); } await K.keyOn(o.key, true); const c = await pickClips(K, o); res.push(`${n}: ${c}`); await tag(K, o.nc, `${n} × 1.5 V → ${c} ${tl(K, X('clips'))}`, 1.8, 0.08); await K.keyOn(o.key, false); await o.cl.drop(0, K); await K.home(o.nc, 0.8); } o.res = res; }, ev: { type: 'lift' },
        see: X('With more cells (more current) the electromagnet lifts more clips.'), why: X('The strength of an electromagnet increases with the current and with the number of turns of the coil.') },
      { do: X('Reverse the connections of the battery and test end A with the compass again.'), target: 'b4', act: async (K, o) => { await K.swapEnds(o.b4, '+', '-'); await K.keyOn(o.key, true); await K.sleep(2.4); const p = poleAtA(K, o); await tag(K, o.cp, tl(K, X(p === 'S' ? 'A is a south pole' : 'A is a north pole')), 2.4, 0.05, -0.06); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('Now the other end of the needle points at A: the poles of the electromagnet have changed places.'), why: X('Reversing the direction of the current reverses the poles of an electromagnet.') },
    ],
    eq: { word: 'Strength of an electromagnet', sym: 'more current (more cells) or more turns → stronger electromagnet' },
    result: { obs: X('End A attracted one end of the compass needle; more cells made the coil lift more clips; reversing the current reversed the poles.'),
      concl: X('An electromagnet has two poles like a bar magnet. Its strength increases with the current, and its poles change when the current is reversed.'),
      safety: X('Do not keep the current on for long, especially with 4 cells.'),
      viva: [{ q: X('Give two ways of making an electromagnet stronger.'), a: X('Increase the current (more cells) or the number of turns.') }, { q: X('How can you find which end is the north pole?'), a: X('The south pole of a compass needle is attracted to it (the north end of the needle points away).') }, { q: X('Can a permanent magnet change its poles like this?'), a: X('No; only an electromagnet can have its poles reversed by reversing the current.') }] },
  },
  {
    id: 'p8_heating', subj: 'physics', cls: 8, ch: C4, title: X('Heating effect of current'),
    aim: X('To observe that a nichrome wire becomes hot when an electric current flows through it.'),
    kind: X('Heating effect of electric current'),
    setup(K) { const hw = K.add(K.M3.hotWireCard(), 0.08, -0.6); const b1 = K.add(K.A4.cellPack(1), -0.3, -0.62), b2 = K.add(K.A4.cellPack(2), -0.3, -0.76); const key = K.add(K.A4.plugKey(), -0.14, -0.48);
      K.wires([[[b1, '+'], [key, 'a'], red], [[key, 'b'], [hw, 'a'], red], [[hw, 'b'], [b1, '-'], blk]]); return { hw, b1, b2, key }; },
    steps: [
      { do: X('With the switch off, touch the nichrome wire for a moment.'), target: 'hw', act: (K, o) => tag(K, o.hw, `≈ ${Math.round(o.hw.T)} °C: ${tl(K, X('cool'))}`, 2, 0.05), ev: { type: 'look' }, see: X('The wire is at room temperature.') },
      { do: X('Switch on for about 30 seconds (time-lapse), switch off and touch the wire for a moment.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.wait(5, 6); await K.keyOn(o.key, false); await tag(K, o.hw, `≈ ${Math.round(o.hw.T)} °C: ${tl(K, X('warm'))}`, 2.4, 0.05); }, ev: { type: 'key' },
        see: X('The wire has become warm.'), why: X('The current makes the wire hot. This is the heating effect of electric current.') },
      { do: X('Repeat with a battery of 2 cells.'), target: 'b2', act: async (K, o) => { await K.sleep(1); const ws = K.wireList; await K.moveLead(ws[0], 'a', o.b2.terms['+']); await K.moveLead(ws[2], 'b', o.b2.terms['-']); await K.keyOn(o.key, true); await K.wait(5, 6); await K.keyOn(o.key, false); await tag(K, o.hw, `≈ ${Math.round(o.hw.T)} °C: ${tl(K, X('hot — do not touch for long'))}`, 2.6, 0.05); }, ev: { type: 'key' },
        see: X('The wire gets much hotter than with one cell.'), why: X('More cells drive a larger current, and the heat produced increases quickly with the current. Heaters, irons and toasters use this effect.') },
    ],
    eq: { word: 'Heating effect of current', sym: 'more current → more heat (heat ∝ I² R t)' },
    result: { obs: X('With one cell the wire became warm (about 55 °C); with two cells it became hot (above 100 °C).'),
      concl: X('An electric current heats the wire it flows through; a larger current produces more heat.'),
      safety: X('Touch the wire only for an instant and only after switching off. Do not leave the circuit on.'),
      viva: [{ q: X('Name two appliances that use the heating effect of current.'), a: X('Electric iron, heater, toaster, kettle, geyser.') }, { q: X('Why is nichrome used for heating elements?'), a: X('It has a high resistance and does not burn (oxidise) easily when hot.') }, { q: X('What is an electric fuse?'), a: X('A thin wire that melts and breaks the circuit when too much current flows.') }] },
  },
  {
    id: 'p8_lemon_cell', subj: 'physics', cls: 8, ch: C4, title: X('A lemon battery lights an LED'),
    aim: X('To make a battery from lemons with copper and iron electrodes, and to light an LED with it.'),
    kind: X('Voltaic cell from lemons'),
    setup(K) { const L = [0, 1, 2, 3, 4, 5].map((i) => K.add(K.M3.lemon(), -0.36 + i * 0.1, -0.62)); const vm = K.add(K.EL.meter('V', 5, { lc: 0.05 }), -0.2, -0.46); vm.Rin = 1e7; const led = K.add(K.M3.ledDiode(), 0.3, -0.46);
      const [v1, v2] = K.wires([[[vm, '+'], [L[0], '+'], 0xd4a017], [[vm, '-'], [L[0], '-'], 0x222222]]); return { L, vm, led, v1, v2, L0: L[0], L5: L[5] }; },
    steps: [
      { do: X('A copper strip and an iron nail are pushed into each lemon. Connect the voltmeter across one lemon.'), target: 'vm', act: async (K, o) => { await K.sleep(1.6); await tag(K, o.vm, `V = ${f2(o.vm.read())} V`, 2.2, 0.05); }, ev: { type: 'look' },
        see: X('One lemon gives only about 0.55 V.') },
      { do: X('Join the lemons in series: the iron nail of each lemon to the copper strip of the next. Measure across all six.'), target: 'L0', act: async (K, o) => { for (let i = 0; i < 5; i++) { K.wires([[[o.L[i], '-'], [o.L[i + 1], '+'], 0x2e7d4f]]); K.app.audio && K.app.audio.clink && K.app.audio.clink(); await K.sleep(0.35); } await K.moveLead(o.v2, 'b', o.L[5].terms['-']); await K.sleep(1.6); await tag(K, o.vm, `V = ${f2(o.vm.read())} V`, 2.4, 0.05); K.lab.emit('series', { obj: o.L0.id }); }, ev: { type: 'series' },
        see: X('Six lemons in series give about 3.3 V.'), why: X('In series the voltages of the cells add up: 6 × 0.55 V ≈ 3.3 V.') },
      { do: X('Connect the LED across the lemon battery: its longer leg to the copper end.'), target: 'led', act: async (K, o) => { K.wires([[[o.led, 'a'], [o.L[0], '+'], red], [[o.led, 'b'], [o.L[5], '-'], blk]]); await K.sleep(2.4); K.lab.emit('led', { obj: o.led.id }); }, ev: { type: 'led' },
        see: X('The LED glows dimly (it is easier to see in a darkened room).'), why: X('The chemical reactions at the copper and iron in the lemon juice push a small current round the circuit.') },
      { do: X('Turn the LED round (swap its legs).'), target: 'led', act: async (K, o) => { await K.swapEnds(o.led, 'a', 'b'); await K.sleep(2); }, ev: { type: 'reverse' },
        see: X('The LED does not glow.'), why: X('An LED lets current pass only one way: from its longer leg (+) to its shorter leg (−).') },
    ],
    eq: { word: 'Cells in series', sym: 'V(total) = V₁ + V₂ + … = 6 × 0.55 V ≈ 3.3 V' },
    result: { obs: X('One lemon gave about 0.55 V; six lemons in series gave about 3.3 V and made a red LED glow dimly. Reversed, the LED did not glow.'),
      concl: X('Two different metals in lemon juice make an electric cell. Cells joined in series give a larger voltage.'),
      safety: X('Do not eat the lemons used in the experiment. Wash your hands afterwards.'),
      viva: [{ q: X('What is the electrolyte in a lemon cell?'), a: X('Lemon juice (citric acid).') }, { q: X('Why did the LED glow only dimly?'), a: X('A lemon cell can give only a very small current.') }, { q: X('What would happen with zinc instead of iron?'), a: X('Each cell would give a higher voltage, about 0.9 V.') }] },
  },
  {
    id: 'p8_friction_stop', subj: 'physics', cls: 8, ch: C5, title: X('How far does it slide? Friction on different surfaces'),
    aim: X('To compare how far the same block slides on different surfaces when given the same push.'),
    kind: X('Friction opposes motion'),
    setup(K) { const S = [['glass', 0.19, X('Glass')], ['wood', 0.33, X('Wood')], ['cloth', 0.75, X('Towel')], ['sand', 2.3, X('Sand')]]; const bd = S.map(([k, mu, nm], i) => { const b = K.add(K.M2.surfaceBoard(k, { len: 0.75 }), 0.02, -0.44 - i * 0.13); b.muK = mu; b.nm = nm; return b; }); if (bd[3]) bd[3].name = X('Board covered with sand');
      const blk = K.add(K.M2.hookBlock({ name: X('Wooden block') }), -0.4, -0.3); return { bd, blk, g0: bd[0], g1: bd[1], g2: bd[2], g3: bd[3] }; },
    steps: [0, 1, 2, 3].map((i) => ({
      do: X(['Put the block at the start of the glass sheet and give it a push with the rubber-band launcher. Measure how far it slides.', 'Give it the same push on the wooden board.', 'Now on the towel.', 'And on the board covered with sand.'][i]), target: ['g0', 'g1', 'g2', 'g3'][i],
      act: async (K, o) => { const b = o.bd[i]; const p = b.g.position; const x0 = p.x - 0.32; await K.moveTo(o.blk, V(K, x0, p.y + b.top, p.z), holdQ(K), 1); const v0 = 1.5; const d = (v0 * v0) / (2 * b.muK * G); const T = v0 / (b.muK * G);
        K.app.audio && K.app.audio.tone && K.app.audio.tone(220, 0.08, 0.15, 'triangle'); await K.tween(Math.max(0.15, T), (k) => { const t = k * T; o.blk.g.position.x = x0 + v0 * t - 0.5 * b.muK * G * t * t; }); o.blk.home = { p: o.blk.g.position.clone(), q: o.blk.g.quaternion.clone() };
        await tag(K, o.blk, `${tl(K, b.nm)}: ${Math.round(d * 100)} cm`, 2, 0.06); (o.d = o.d || [])[i] = d; K.lab.emit('slide', { obj: o.blk.id }); }, ev: { type: 'slide' },
      see: X(['The block slides about 60 cm on the smooth glass before it stops.', 'On wood it stops after about 34 cm.', 'On the towel it stops after about 15 cm.', 'On sand it moves only about 5 cm.'][i]),
      ...(i === 3 ? { why: X('Friction acts against the motion and slows the block down. Rough surfaces give more friction, so the block stops sooner.') } : {}),
    })),
    eq: { word: 'Friction opposes motion', sym: 'smoother surface → less friction → longer distance' },
    result: { obs: X('With the same push the block slid about 60 cm on glass, 34 cm on wood, 15 cm on a towel and 5 cm on sand.'),
      concl: X('Friction depends on the surfaces in contact: it is least on smooth surfaces and most on rough ones. It always acts against the motion.'),
      safety: X('Keep your fingers away from the stretched rubber band.'),
      viva: [{ q: X('Why does a ball rolling on the ground finally stop?'), a: X('Friction between the ball and the ground slows it down.') }, { q: X('Why is it easy to slip on a wet marble floor?'), a: X('Water makes the floor smoother, so friction is less.') }, { q: X('Is friction always a nuisance?'), a: X('No: without friction we could not walk, write or hold things.') }] },
  },
  {
    id: 'p8_ring_magnets', subj: 'physics', cls: 8, ch: C5, title: X('Floating ring magnets'),
    aim: X('To show that magnets can push each other without touching (a non-contact force).'),
    kind: X('Magnetic force: a non-contact force'),
    setup(K) { const rm = K.add(K.M3.ringMagnets(), 0, -0.6); rm.hold = 0.14; return { rm }; },
    steps: [
      { do: X('Slide the second ring magnet down the stick so that like poles face each other, and let go.'), target: 'rm', act: async (K, o) => { const y0 = o.rm.hold; await K.tween(1, (k) => { o.rm.hold = y0 - (y0 - 0.075) * k; }); o.rm.hold = null; await K.sleep(2.4); await tag(K, o.rm, `${(o.rm.gap() * 100).toFixed(1)} cm`, 2, 0.12); }, ev: { type: 'look' },
        see: X('The upper magnet floats in the air above the lower one, with a gap of about 2 cm.'), why: X('Like poles repel. The magnetic push upwards balances the weight of the upper magnet.') },
      { do: X('Press the upper magnet down gently and let it go.'), target: 'rm', act: async (K, o) => { const y0 = o.rm.y; await K.tween(0.8, (k) => { o.rm.hold = y0 - (y0 - 0.026) * k; }); await K.sleep(0.4); o.rm.hold = null; await K.sleep(2.2); }, ev: { type: 'press' },
        see: X('You feel a springy push; the magnet jumps back up and bobs before settling.') },
      { do: X('Take out the upper magnet, turn it over and slide it down again.'), target: 'rm', act: async (K, o) => { await K.tween(0.8, (k) => { o.rm.hold = o.rm.y + (0.15 - o.rm.y) * k; }); o.rm.flip(); await K.sleep(0.4); await K.tween(0.8, (k) => { o.rm.hold = 0.15 - (0.15 - 0.07) * k; }); o.rm.hold = null; await K.sleep(1.5); }, ev: { type: 'flip' },
        see: X('Now it snaps down onto the lower magnet and sticks to it.'), why: X('Unlike poles attract. Magnetic forces act even without touching: they are non-contact forces.') },
    ],
    eq: { word: 'Magnetic force', sym: 'like poles repel · unlike poles attract' },
    result: { obs: X('With like poles facing, the upper ring magnet floated about 2 cm above the lower one and bounced back when pressed; turned over, it stuck to the lower magnet.'),
      concl: X('Magnets exert forces on each other without touching. Like poles repel and unlike poles attract.'),
      safety: X('Do not let the magnets snap together on your fingers; keep them away from phones and cards.'),
      viva: [{ q: X('Name two non-contact forces.'), a: X('Magnetic force, electrostatic force and gravitational force.') }, { q: X('Why does the upper magnet not fall?'), a: X('The repulsion between like poles balances its weight.') }, { q: X('Where is this idea used?'), a: X('In maglev trains, which float above the track.') }] },
  },
  {
    id: 'p8_charged_scale', subj: 'physics', cls: 8, ch: C5, title: X('A rubbed plastic scale picks up paper bits'),
    aim: X('To show the electrostatic force: a plastic scale rubbed with polythene attracts small bits of paper.'),
    kind: X('Electrostatic force'),
    setup(K) { const sc = K.lay(K.M3.plasticScale(), -0.12, -0.5, 0); sc.g.rotation.set(0, 0, 0); sc.g.position.y = BENCH_Y + 0.001; sc.home = { p: sc.g.position.clone(), q: sc.g.quaternion.clone() }; const po = K.add(K.M3.polythene(), -0.14, -0.66); const pb = K.add(K.M3.paperBits(26), 0.18, -0.62);
      pb.near = () => ({ p: sc.g.localToWorld(sc.tipLocal.clone()), q: sc.q, obj: sc.g }); return { sc, po, pb }; },
    steps: [
      { do: X('Hold the scale just above the paper bits without rubbing it.'), target: 'sc', act: async (K, o) => { const p = o.pb.g.position; await K.moveTo(o.sc, V(K, p.x - 0.07, BENCH_Y + 0.012, p.z), holdQ(K), 1); await K.sleep(1.4); await K.home(o.sc, 0.8); }, ev: { type: 'look' }, see: X('Nothing happens.') },
      { do: X('Rub the scale hard with the polythene a few times.'), target: 'po', act: async (K, o) => { const p = o.po.g.position; await K.moveTo(o.sc, V(K, p.x, p.y + 0.008, p.z), holdQ(K), 0.8); const x0 = o.sc.g.position.x; await K.tween(2, (k) => { o.sc.g.position.x = x0 + 0.04 * Math.sin(k * Math.PI * 10); }); o.sc.q = -3e-8; K.lab.emit('rub', { obj: o.sc.id }); }, ev: { type: 'rub' },
        see: X('Rubbing gives the scale an electric charge (you cannot see it yet).') },
      { do: X('Hold the rubbed end of the scale about 1 cm above the paper bits.'), target: 'pb', act: async (K, o) => { const p = o.pb.g.position; await K.moveTo(o.sc, V(K, p.x - 0.07, BENCH_Y + 0.013, p.z), holdQ(K), 1); await K.sleep(2.6); await K.up(o.sc, 0.05, 0.8); await tag(K, o.sc, `${o.pb.count()}`, 2, 0.04); }, ev: { type: 'look' },
        see: X('The paper bits jump up and stick to the scale.'), why: X('A charged object attracts small uncharged objects. This electrostatic force acts without touching.') },
    ],
    eq: { word: 'Electrostatic force', sym: 'rubbing → charge → attraction of light objects (non-contact force)' },
    result: { obs: X('The unrubbed scale did nothing; after rubbing with polythene it pulled small paper bits up from about 1 cm away.'),
      concl: X('Rubbing gives a plastic scale an electric charge, and a charged object attracts small bits of paper by electrostatic force, without touching them.'),
      safety: X('This works best in dry weather. Do not rub the scale on your skin for long.'),
      viva: [{ q: X('Why does the experiment work poorly on a humid day?'), a: X('Moist air lets the charge leak away.') }, { q: X('Name another example of electrostatic force.'), a: X('A comb run through dry hair attracts paper bits; clothes cling together after drying.') }, { q: X('Is the electrostatic force a contact force?'), a: X('No, it acts from a distance.') }] },
  },
  {
    id: 'p8_charged_balloons', subj: 'physics', cls: 8, ch: C5, title: X('Charged balloons push and pull'),
    aim: X('To show that like charges repel and unlike charges attract, using balloons rubbed with wool.'),
    kind: X('Like and unlike charges'),
    setup(K) { const bp = K.add(K.M3.balloonPair(), 0.1, -0.66); const w = K.add(K.M3.woolCloth(), 0.36, -0.46); bp.sources.push(() => [{ p: w.g.getWorldPosition(V(K, 0, 0, 0)), q: w.q }]); return { bp, w }; },
    steps: [
      { do: X('Two balloons hang side by side on threads, close but not touching.'), target: 'bp', act: (K) => K.sleep(1.2), see: X('The balloons hang straight down.') },
      { do: X('Rub each balloon with the woollen cloth, and let them hang again.'), target: 'w', act: async (K, o) => { for (const i of [0, 1]) { const p = o.bp.ballWorld(i); const s = i ? 1 : -1; await K.moveTo(o.w, V(K, p.x + s * 0.075, p.y - 0.01, p.z + 0.02), new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), s * Math.PI / 2), 0.9); const y0 = o.w.g.position.y; await K.tween(1.6, (k) => { o.w.g.position.y = y0 + 0.03 * Math.sin(k * Math.PI * 8); }); o.bp.b[i].q = -2.4e-7; } o.w.q = 4.8e-7; await K.moveTo(o.w, V(K, 0.5, BENCH_Y + 0.0008, -0.4), new K.THREE.Quaternion(), 1); o.w.home = { p: o.w.g.position.clone(), q: o.w.g.quaternion.clone() }; await K.sleep(2.4); K.lab.emit('rub', { obj: o.bp.id }); }, ev: { type: 'rub' },
        see: X('The two balloons move apart from each other.'), why: X('Both balloons got the same kind of charge from the wool. Like charges repel.') },
      { do: X('Bring the woollen cloth near one of the balloons (without touching).'), target: 'w', act: async (K, o) => { const p = o.bp.ballWorld(1); await K.moveTo(o.w, V(K, p.x + 0.2, p.y, p.z), new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), Math.PI / 2), 1); await K.sleep(2.6); await K.home(o.w, 0.9); }, ev: { type: 'look' },
        see: X('The balloon swings towards the cloth.'), why: X('The wool got the opposite charge to the balloons. Unlike charges attract.') },
    ],
    eq: { word: 'Electric charges', sym: 'like charges repel · unlike charges attract' },
    result: { obs: X('After rubbing with wool the two balloons pushed each other apart, but a balloon was pulled towards the woollen cloth.'),
      concl: X('Rubbing gives objects electric charges. Like charges repel each other and unlike charges attract.'),
      safety: X('Do not burst the balloons near anyone’s ears.'),
      viva: [{ q: X('What kind of charge do the two balloons have?'), a: X('The same kind (both got it the same way from the wool).') }, { q: X('Why does the balloon move towards the wool?'), a: X('The wool and the balloon have opposite charges, which attract.') }, { q: X('What happens to the charge after some time?'), a: X('It slowly leaks away into the air, and the balloons hang straight again.') }] },
  },
  {
    id: 'p8_spring', subj: 'physics', cls: 8, ch: C5, title: X('Stretching a spring'),
    aim: X('To see that a spring stretches more when a heavier object hangs from it.'),
    kind: X('Weight stretches a spring'),
    setup(K) { const sp = K.add(K.M3.hangSpring({ k: 50 }), -0.1, -0.66); const ob = ['stone', 'box', 'tiffin'].map((k, i) => K.add(K.M3.hangObj(k), 0.12 + i * 0.13, -0.5)); return { sp, s1: ob[0], s2: ob[1], s3: ob[2] }; },
    steps: ['s1', 's2', 's3'].map((k, i) => ({
      do: X(['Hang the small stone on the spring and read the stretch on the scale.', 'Replace it with the pencil box.', 'Now hang the tiffin box.'][i]), target: k,
      act: async (K, o) => { const ob = o[k]; const prev = o.hung; if (prev) { o.sp.mass = 0; o.hung = null; await K.home(prev, 0.8); await K.sleep(0.8); } const hk = o.sp.hookG.getWorldPosition(V(K, 0, 0, 0)); await K.moveTo(ob, V(K, hk.x, hk.y - 0.008 - ob.topY, hk.z), new K.THREE.Quaternion(), 1); o.hung = ob; o.sp.mass = ob.mass;
        if (!o._f) { o._f = true; K.solver(() => { const h = o.hung; if (!h) return; const w = o.sp.hookG.getWorldPosition(V(K, 0, 0, 0)); h.g.position.set(w.x, w.y - 0.008 - h.topY, w.z); }); } await K.sleep(2.2); await tag(K, o.sp, `${tl(K, X('Stretch'))}: ${o.sp.stretchCm().toFixed(1)} cm`, 2, 0.3); K.lab.emit('hang', { obj: ob.id }); }, ev: { type: 'hang' },
      see: X(['The spring stretches by about 2 cm.', 'It stretches by about 4 cm.', 'It stretches by about 8 cm.'][i]), ...(i === 2 ? { why: X('The heavier the object, the greater the force of gravity on it (its weight), and the more it stretches the spring. A spring balance works on this idea.') } : {}),
    })),
    eq: { word: 'Stretch of a spring', sym: 'stretch ∝ weight · 100 g → 2 cm, 200 g → 4 cm, 400 g → 8 cm' },
    result: { obs: X('The stone (100 g) stretched the spring about 2 cm, the pencil box (200 g) about 4 cm and the tiffin box (400 g) about 8 cm.'),
      concl: X('A spring stretches more for a heavier object: the stretch is proportional to the weight hanging from it.'),
      safety: X('Do not hang very heavy objects; the spring may be stretched permanently.'),
      viva: [{ q: X('What force stretches the spring?'), a: X('The weight of the object (the pull of gravity on it).') }, { q: X('Which instrument uses a spring to measure force?'), a: X('The spring balance.') }, { q: X('What happens if the spring is stretched too much?'), a: X('It does not return to its original length.') }] },
  },
  {
    id: 'p8_spring_balance', subj: 'physics', cls: 8, ch: C5, title: X('Using a spring balance'),
    aim: X('To find the range and the least count of a spring balance and to measure the weight of objects with it.'),
    kind: X('Spring balance: range, least count and weight'),
    setup(K) { const st = K.add(K.A5.labStand(0.5), -0.3, -0.76); st.clamp(0.48, 0.11); const bal = K.add(K.MC.springBalance({ unit: 'N', max: 10, lc: 0.2 }), -0.33, -0.7, { y: BENCH_Y + 0.48 }); const ob = ['stone', 'box', 'tiffin'].map((k, i) => K.add(K.M3.hangObj(k), 0.0 + i * 0.13, -0.5)); return { st, bal, s1: ob[0], s2: ob[1], s3: ob[2] }; },
    steps: [
      { do: X('Look at the scale of the spring balance. What is the largest weight it can measure?'), target: 'bal', act: (K, o) => tag(K, o.bal, `${tl(K, X('Range'))}: 0 – 10 N`, 2.4, -0.05), ev: { type: 'look' }, see: X('Its range is 0 to 10 N.') },
      { do: X('Count the small divisions between 0 and 1 N.'), target: 'bal', act: (K, o) => tag(K, o.bal, `1 N ÷ 5 = 0.2 N`, 2.4, -0.05), ev: { type: 'look' }, see: X('There are 5 divisions, so the least count is 1 N ÷ 5 = 0.2 N.') },
      { do: X('Hang the stone, the pencil box and the tiffin box from the hook one by one and read the weight.'), target: 's1', act: async (K, o) => { const out = []; for (const k of ['s1', 's2', 's3']) { const ob = o[k]; const hk = o.bal.hookG.getWorldPosition(V(K, 0, 0, 0)); await K.moveTo(ob, V(K, hk.x, hk.y - 0.008 - ob.topY, hk.z), new K.THREE.Quaternion(), 1); o.bal.hookG.attach(ob.g); o.bal.load = ob.mass * G; await K.sleep(1.8); const w = o.bal.read(); out.push(w.toFixed(1)); await tag(K, o.bal, `${tl(K, X('Weight'))}: ${w.toFixed(1)} N`, 1.8, -0.05); o.bal.load = 0; K.detach(ob); await K.home(ob, 0.8); } o.out = out; K.lab.emit('hang', { obj: o.bal.id }); }, ev: { type: 'hang' },
        see: X('The stone weighs about 1.0 N, the pencil box about 2.0 N and the tiffin box about 4.0 N.'), why: X('Weight is the force of gravity on an object, measured in newtons (N). An object of mass 100 g weighs about 1 N.') },
    ],
    eq: { word: 'Weight', sym: 'W = m g · 0.1 kg × 9.8 m/s² ≈ 1 N' },
    result: { obs: X('Range 0 – 10 N; least count 0.2 N. Weights: stone ≈ 1.0 N, pencil box ≈ 2.0 N, tiffin box ≈ 4.0 N.'),
      concl: X('A spring balance measures force (weight) in newtons. Its range is the largest force it can measure and its least count is the smallest.'),
      safety: X('Never hang anything heavier than the range of the balance. Check that the pointer is at zero before use.'),
      viva: [{ q: X('What is the SI unit of force?'), a: X('The newton (N).') }, { q: X('What is the least count of an instrument?'), a: X('The smallest value it can measure accurately.') }, { q: X('What would the stone weigh on the Moon?'), a: X('About one sixth: about 0.16 N.') }] },
  },
  {
    id: 'p8_bottle_upthrust', subj: 'physics', cls: 8, ch: C5, title: X('Upthrust on a bottle pushed into water'),
    aim: X('To feel the upward force (upthrust) of water on an empty closed bottle pushed into it.'),
    kind: X('Buoyant force'),
    setup(K) { const bk = K.MC.withDisp(K.add(K.M3.bucket(), 0, -0.66)); K.lab.fill(bk, 'water', 8000); const bt = K.add(K.M3.emptyBottle(), 0.28, -0.5); K.solver(() => { K.MC.immerse(bt, [bk]); }); return { bk, bt }; },
    steps: [
      { do: X('Put the closed empty bottle on the water in the bucket.'), target: 'bt', act: async (K, o) => { const c = o.bk.g.position; const lv = o.bk.levelWorld(); await K.moveTo(o.bt, V(K, c.x, lv - 0.006, c.z), new K.THREE.Quaternion(), 1.2); await bob(K, o, 2.4); }, ev: { type: 'look' },
        see: X('The bottle floats with only a small part of it under water.') },
      { do: X('Push the bottle down into the water slowly with your hand.'), target: 'bt', act: async (K, o) => { const y0 = o.bt.g.position.y; for (const f of [0.35, 0.7, 1.0]) { const lv = o.bk.levelWorld(); await K.tween(1.1, (k) => { o.bt.g.position.y = y0 - (y0 - (lv - 0.2 * f - 0.005)) * k; }); await K.sleep(0.4); await tag(K, o.bt, `${tl(K, X('Upward push of the water'))}: ${((o.bt.Vsub * G) / 1000).toFixed(1)} N`, 1.4, 0.3); } K.lab.emit('push', { obj: o.bt.id }); }, ev: { type: 'push' },
        see: X('The deeper the bottle goes, the harder the water pushes it up — with the bottle fully under water the push is about 6 N.'), why: X('Water pushes up on anything put into it. The more water the bottle pushes aside, the greater this upthrust (buoyant force).') },
      { do: X('Now let go of the bottle.'), target: 'bt', act: async (K, o) => { await bob(K, o, 3.2, true); K.lab.emit('release', { obj: o.bt.id }); }, ev: { type: 'release' },
        see: X('The bottle shoots up out of the water and then floats again.'), why: X('With nothing holding it down, the upthrust (much more than the bottle’s small weight) pushes it up until only a little of it stays under water.') },
    ],
    eq: { word: 'Upthrust (buoyant force)', sym: 'upthrust = weight of the water pushed aside · 650 mL → 0.65 kg × 9.8 ≈ 6.4 N' },
    result: { obs: X('The bottle floated; pushing it down needed more and more force (up to about 6 N when it was fully under); released, it jumped up and floated again.'),
      concl: X('Water exerts an upward force (upthrust) on objects in it. The more of the object is under water, the greater the upthrust.'),
      safety: X('Wipe up spilled water so that nobody slips.'),
      viva: [{ q: X('Why does a mug of water feel lighter under water than in air?'), a: X('The water pushes it up (upthrust).') }, { q: X('Why do ships float?'), a: X('They push aside a lot of water, so the upthrust balances their weight.') }, { q: X('Does a stone also feel upthrust in water?'), a: X('Yes, but its weight is more than the upthrust, so it sinks.') }] },
  },
];

// the bottle moves up and down under its weight and the upthrust until it floats (or after it is let go)
async function bob(K, o, sec, kick = false) {
  const bt = o.bt; let v = kick ? 0 : 0; const m = bt.mass + 0.3; // with some water dragged along
  await K.tween(sec, (k, d) => { const F = (bt.Vsub * G) / 1000 - bt.mass * G; v += (F / m - 4 * v) * d; v = Math.max(-1, Math.min(2.5, v)); bt.g.position.y += v * d; const lv = o.bk.levelWorld(); if (bt.g.position.y > lv + 0.05) { bt.g.position.y = lv + 0.05; v = Math.min(v, 0); } });
  bt.home = { p: bt.g.position.clone(), q: bt.g.quaternion.clone() };
}
