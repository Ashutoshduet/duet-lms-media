// Physics experiments, batch 4 (Class 9): the simple pendulum (amplitude, length, mass of the bob), Archimedes' principle with
// an overflow can, the density of a solid, a tuning fork in water, a bell in a bell jar being emptied of air, and a lever.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const f2 = (n) => n.toFixed(2);
const LM3 = N('Lab Manual · Moving Things, People and Ideas', 'प्रयोगशाला पुस्तिका · गतिमान वस्तुएँ, लोग और विचार', 'Lab Manual · Moving Things, People aur Ideas');
const LM1 = N('Lab Manual · Materials', 'प्रयोगशाला पुस्तिका · पदार्थ', 'Lab Manual · Materials');
const C7 = N('Ch 7 · Work, Energy and Simple Machines', 'अध्याय 7 · कार्य, ऊर्जा और सरल मशीनें', 'Ch 7 · Work, Energy aur Simple Machines');
const C10 = N('Ch 10 · Sound Waves: Characteristics and Applications', 'अध्याय 10 · ध्वनि तरंगें: विशेषताएँ और अनुप्रयोग', 'Ch 10 · Sound Waves: Characteristics aur Applications');
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, 0.06, 0.05, 0), sec);
const _S = [X('Time for 20 oscillations'), X('Time period'), X('Weight in air'), X('Weight in water'), X('Water collected'), X('Loss in weight'), X('Weight of water displaced'), X('Mass'), X('Density'), X('Pressure in the jar'), X('1 eraser: the stapler stays down'), X('2 erasers: the stapler is lifted!'), X('Load'), X('Effort'), X('Length'), X('Amplitude'), X('Bob')];
void _S;

// ---------------------------------------------------------------- the pendulum: pull aside, let go, and time 20 oscillations with the stopwatch (time-lapse)
async function swing(K, p, deg) { p.free = false; const a0 = p.th, a1 = (-deg * Math.PI) / 180; await K.tween(0.9, (k) => { p.th = a0 + (a1 - a0) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); }); p.om = 0; await K.sleep(0.3); p.free = true; K.lab.emit('swing', { obj: p.id }); }
async function stopBob(K, p) { p.free = false; const a0 = p.th; await K.tween(0.8, (k) => { p.th = a0 * (1 - k); }); p.om = 0; }
async function time20(K, o, n = 20) {
  const p = o.p, sw = o.sw; sw.reset(); await K.sleep(0.4); const c0 = p.osc; await until(K, () => p.osc > c0, 10);
  sw.start(); K.lab.emit('timer', { obj: sw.id }); const s0 = p.osc; const l0 = K.app.chem.lapse; K.app.chem.lapse = 8; K.app.lapseShown = 8;
  await until(K, () => p.osc >= s0 + n, 60); sw.stop(); K.app.chem.lapse = l0; K.app.lapseShown = 0;
  sw.t = Math.max(0, sw.t + (Math.random() - 0.5) * 0.08); return sw.read(); // the student's thumb is not perfectly quick
}
async function setLength(K, p, L) { await stopBob(K, p); const L0 = p.L; await K.tween(1.2, (k) => p.setL(L0 + (L - L0) * k)); }
const pend = (mode) => ({
  id: { amp: 'p9_pendulum_amp', len: 'p9_pendulum_len', mass: 'p9_pendulum_mass' }[mode], subj: 'physics', cls: 9, ch: LM3,
  title: X({ amp: 'Simple pendulum: does the amplitude change the time period?', len: 'Simple pendulum: time period and length', mass: 'Simple pendulum: does the mass of the bob matter?' }[mode]),
  aim: X({ amp: 'To study the effect of amplitude on the time period of a simple pendulum.', len: 'To study how the time period of a simple pendulum changes with its length.', mass: 'To study the effect of the mass of the bob on the time period of a simple pendulum.' }[mode]),
  kind: X({ amp: 'Simple pendulum (Lab Manual)', len: 'Simple pendulum: T² ∝ L (Lab Manual)', mass: 'Simple pendulum: mass of the bob (Lab Manual)' }[mode]),
  setup(K) {
    const p = K.add(K.MC.pendulum({ L: mode === 'len' ? 0.4 : 1 }), -0.05, -0.45); p.camView = { p: V(K, 0.32, -0.12, 1.85), t: V(K, 0, -0.3, 0.12) }; const sw = K.add(K.MC.stopwatch(), 0.22, -0.5); // camera stands back: the bob hangs below the bench edge
    if (mode === 'mass') p.setBob(0.0112, 0.05, 0xc9a24a);
    const gp = mode === 'len' ? K.add(K.EL.graphPaper({ xmax: 1.2, ymax: 5, xl: 'L (m)', yl: 'T² (s²)' }), 0.38, -0.72) : null;
    return { p, sw, gp };
  },
  steps: mode === 'amp' ? [
    { do: X('The bob hangs from a thread held in a split cork. The effective length, from the point of suspension to the centre of the bob, is 100 cm.'), target: 'p', act: (K, o) => tag(K, o.p, `L = ${Math.round(o.p.L * 100)} cm`, 2.4, 0.5), see: X('The pendulum hangs freely beyond the edge of the table.') },
    { do: X('Pull the bob aside to an amplitude of 5° and let it go. Start the stopwatch as the bob passes the mean position, and stop it after 20 oscillations.'), target: 'p', act: async (K, o) => { await swing(K, o.p, 5); const t = await time20(K, o); o.T = [[5, t / 20]]; await tag(K, o.sw, `20 × : t = ${f2(t)} s · T = ${(t / 20).toFixed(3)} s`, 3, 0.04); }, ev: { type: 'swing' },
      see: X('20 oscillations take about 40.1 s, so the time period T is about 2.01 s.'), why: X('Timing many oscillations and dividing makes the small error of starting and stopping the watch much less important.') },
    { do: X('Repeat with amplitudes of 10°, 15° and 20°.'), target: 'p', act: async (K, o) => { o.T = o.T || []; for (const a of [10, 15, 20]) { await stopBob(K, o.p); await swing(K, o.p, a); const t = await time20(K, o); o.T.push([a, t / 20]); await tag(K, o.sw, `${a}°: T = ${(t / 20).toFixed(3)} s`, 2, 0.04); } }, ev: { type: 'swing' },
      see: X('T ≈ 2.01 s, 2.01 s and 2.02 s: almost the same for every amplitude.') },
    { do: X('Compare the time periods for the different amplitudes.'), target: 'sw', act: async (K, o) => { await stopBob(K, o.p); await tag(K, o.sw, (o.T || []).map(([a, T]) => `${a}°: ${T.toFixed(2)} s`).join(' · '), 3.5, 0.04); }, ev: { type: 'look' },
      see: X('The time period stays the same within the accuracy of the stopwatch.'), why: X('For small amplitudes the time period of a pendulum does not depend on how far it swings. This is why pendulums are used to keep time.') },
  ] : mode === 'len' ? [
    { do: X('Set the effective length to 40 cm. Displace the bob by about 5°, let it go and time 20 oscillations.'), target: 'p', act: async (K, o) => { await swing(K, o.p, 5); const t = await time20(K, o); const T = t / 20; o.rows = [[0.4, T]]; o.gp.plot(0.4, T * T); await tag(K, o.sw, `L = 40 cm: T = ${T.toFixed(2)} s, T² = ${f2(T * T)} s²`, 2.6, 0.04); }, ev: { type: 'swing' },
      see: X('For L = 40 cm, T ≈ 1.27 s.') },
    { do: X('Repeat for lengths of 60 cm, 80 cm, 100 cm and 120 cm, and plot T² against L.'), target: 'p', act: async (K, o) => { o.rows = o.rows || []; for (const L of [0.6, 0.8, 1.0, 1.2]) { await setLength(K, o.p, L); await swing(K, o.p, 5); const t = await time20(K, o); const T = t / 20; o.rows.push([L, T]); o.gp.plot(L, T * T); await tag(K, o.sw, `L = ${Math.round(L * 100)} cm: T = ${T.toFixed(2)} s, T² = ${f2(T * T)} s²`, 2, 0.04); } await stopBob(K, o.p); }, ev: { type: 'swing' },
      see: X('T ≈ 1.55 s, 1.80 s, 2.01 s and 2.20 s: a longer pendulum swings more slowly.') },
    { do: X('Draw the best straight line through the points of the T²–L graph.'), target: 'gp', act: async (K, o) => { const k = o.gp.fit(); await K.showTag(`T²/L ≈ ${f2(k)} s²/m`, o.gp.g.position.clone(), V(K, 0, 0.1, 0), 3); }, ev: { type: 'plot' },
      see: X('The T² – L graph is a straight line through the origin, with T²/L ≈ 4 s² per metre.'), why: X('T² is proportional to L: the time period is proportional to the square root of the length (T = 2π√(L/g)).') },
  ] : [
    { do: X('A 50 g brass bob hangs at an effective length of 100 cm. Displace it by about 5°, let it go and time 20 oscillations.'), target: 'p', act: async (K, o) => { await swing(K, o.p, 5); const t = await time20(K, o); o.T = [[50, t / 20]]; await tag(K, o.sw, `50 g: T = ${(t / 20).toFixed(3)} s`, 2.4, 0.04); }, ev: { type: 'swing' },
      see: X('T ≈ 2.01 s.') },
    { do: X('Replace the bob with a 100 g bob and then a 200 g bob, keeping the effective length 100 cm. Time 20 oscillations each time.'), target: 'p', act: async (K, o) => { o.T = o.T || []; for (const [m, r, c] of [[100, 0.0141, 0x9aa0a6], [200, 0.0178, 0xd8dde2]]) { await stopBob(K, o.p); o.p.setBob(r, m / 1000, c); await tag(K, o.p, `${m} g`, 1.2, 0.5); await swing(K, o.p, 5); const t = await time20(K, o); o.T.push([m, t / 20]); await tag(K, o.sw, `${m} g: T = ${(t / 20).toFixed(3)} s`, 2, 0.04); } await stopBob(K, o.p); }, ev: { type: 'swing' },
      see: X('T ≈ 2.01 s for the 100 g bob and for the 200 g bob as well.'), why: X('The time period of a simple pendulum does not depend on the mass of the bob, only on its length (and on g).') },
  ],
  eq: { word: 'Time period of a simple pendulum', sym: { amp: 'T = t/20 · T = 2π√(L/g) ≈ 2.01 s for L = 1 m (for small amplitudes)', len: 'T = 2π√(L/g) → T² = (4π²/g) L ≈ 4.03 L', mass: 'T = 2π√(L/g) — no mass in the formula' }[mode] },
  result: { obs: X({ amp: 'For L = 100 cm, T ≈ 2.01 s for amplitudes of 5°, 10°, 15° and 20°.', len: 'L = 40, 60, 80, 100, 120 cm gave T ≈ 1.27, 1.55, 1.80, 2.01, 2.20 s. The T²–L graph is a straight line through the origin.', mass: 'Bobs of 50 g, 100 g and 200 g at L = 100 cm all gave T ≈ 2.01 s.' }[mode]),
    concl: X({ amp: 'For small amplitudes the time period of a simple pendulum is independent of the amplitude.', len: 'The time period of a simple pendulum increases with its length: T² is directly proportional to L.', mass: 'The time period of a simple pendulum does not depend on the mass of the bob.' }[mode]),
    safety: X('Keep the amplitude small (below about 15°). Make sure the bob does not spin or move in an ellipse; start timing only after a few swings.'),
    viva: [{ q: X('What is one oscillation?'), a: X('One complete to-and-fro motion: from one extreme to the other and back again.') }, { q: X('Why do we time 20 oscillations instead of one?'), a: X('The error in starting and stopping the watch is shared over 20 oscillations, so T is more accurate.') }, { q: X({ amp: 'Why should the amplitude be small?', len: 'What length gives a time period of 2 s (a seconds pendulum)?', mass: 'Will the pendulum swing faster on the Moon?' }[mode]), a: X({ amp: 'The time period stays constant only for small swings.', len: 'About 99.3 cm, i.e. about 1 m.', mass: 'No, slower: g on the Moon is about one sixth, so T is about 2.4 times longer.' }[mode]) }] },
});

export const EXPERIMENTS_P4 = [
  pend('amp'), pend('len'), pend('mass'),
  {
    id: 'p9_archimedes', subj: 'physics', cls: 9, ch: LM3, title: X("Archimedes' principle"),
    aim: X("To verify Archimedes' principle: the loss in weight of a solid immersed in water equals the weight of the water it displaces."),
    kind: X('Overflow can and spring balance (Lab Manual)'),
    setup(K) {
      const blk = K.add(K.MC.woodBlock(0.1, 0.14, 0.1), 0, -0.62); const can = K.add(K.MC.overflowCan(), 0, -0.62, { y: BENCH_Y + 0.14 });
      const tip = can.g.localToWorld(can.tip.clone()); const waste = K.add(K.A.beaker(100), tip.x + 0.004, tip.z); can.spoutTo = waste;
      const cyl = K.add(K.MC.cylinder100(), 0.24, -0.52); const bk = K.beaker(-0.24, -0.5, 'water', 320, 500);
      const st = K.add(K.A5.labStand(0.62), -0.26, -0.78); st.clamp(0.6, 0.11);
      const bal = K.add(K.MC.springBalance({ unit: 'N', max: 5 }), -0.29, -0.72, { y: BENCH_Y + 0.6 }); const s = K.add(K.MC.sinker({ kind: 'stone', mass: 153, vol: 51 }), 0, -2); bal.hookG.add(s.g); s.g.position.set(0, 0, 0);
      K.solver((dt) => { K.MC.immerse(s, [can, cyl, waste]); bal.load = ((s.mass - s.Vsub) * K.MC.G) / 1000; K.MC.overflowTick(can, dt); });
      return { blk, can, waste, cyl, bk, st, bal, s };
    },
    steps: [
      { do: X('Stand the overflow can on the wooden block and pour water into it until water starts to flow out of the spout into the beaker. Wait until it stops dripping.'), target: 'bk', act: async (K, o) => { await K.pour(o.bk, o.can, 300); await until(K, () => o.can.flowT <= 0, 20); await K.sleep(0.6); }, ev: { type: 'pour' },
        see: X('The water level stands exactly at the spout; the extra water has run into the beaker.') },
      { do: X('Take the beaker away and put the clean, dry measuring cylinder under the spout.'), target: 'cyl', act: async (K, o) => { await K.lift(o.waste, 0.36, -0.68); const tip = o.can.g.localToWorld(o.can.tip.clone()); await K.moveTo(o.cyl, V(K, tip.x + 0.003, BENCH_Y + 0.0008, tip.z), new K.THREE.Quaternion(), 1.1); o.cyl.home = { p: o.cyl.g.position.clone(), q: o.cyl.g.quaternion.clone() }; o.can.spoutTo = o.cyl; K.lab.emit('place', { obj: o.cyl.id }); }, ev: { type: 'place' },
        see: X('The empty measuring cylinder stands under the spout.') },
      { do: X('Hold the spring balance with the stone hanging from it above the can. Note the weight of the stone in air (W₁).'), target: 'bal', act: async (K, o) => { const c = o.can.g.position; await K.moveTo(o.bal, V(K, c.x, BENCH_Y + 0.6, c.z), new K.THREE.Quaternion(), 1.2); o.bal.home = { p: o.bal.g.position.clone(), q: o.bal.g.quaternion.clone() }; await K.sleep(1); o.W1 = o.bal.read(); await tag(K, o.bal, `W₁ = ${f2(o.W1)} N`, 2.4, -0.05); }, ev: { type: 'look' },
        see: X('The spring balance reads W₁ = 1.50 N.') },
      { do: X('Lower the stone slowly into the water until it is completely under water, without touching the sides or the bottom. Note the reading W₂.'), target: 'bal', act: async (K, o) => { const p0 = o.bal.g.position.clone(); await K.tween(3.4, (k) => { o.bal.g.position.y = p0.y - 0.165 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); }); await until(K, () => o.can.flowT <= 0, 25); await K.sleep(0.8); o.W2 = o.bal.read(); await tag(K, o.bal, `W₂ = ${f2(o.W2)} N`, 2.4, -0.05); K.lab.emit('dip', { obj: o.s.id }); }, ev: { type: 'dip' },
        see: X('As the stone goes in, water flows out of the spout into the cylinder. The balance now reads W₂ = 1.00 N: the stone seems lighter.'), why: X('The water pushes up on the stone (the buoyant force, or upthrust), so the spring is stretched less.') },
      { do: X('Read the volume of water collected in the measuring cylinder.'), target: 'cyl', act: async (K, o) => { o.V = Math.round(o.cyl.ml); await tag(K, o.cyl, `V = ${o.V} mL → ${o.V} g → ${f2((o.V * 9.8) / 1000)} N`, 3, 0.18); }, ev: { type: 'look' },
        see: X('About 51 mL of water has been collected. Its mass is 51 g, so its weight is 0.051 kg × 9.8 m/s² ≈ 0.50 N.') },
      { do: X('Compare the loss in weight of the stone with the weight of the water it displaced.'), target: 'bal', act: async (K, o) => { const W1 = o.W1 ?? 1.5, W2 = o.W2 ?? 1.0, Vv = o.V ?? 51; await K.showTag(`W₁ − W₂ = ${f2(W1 - W2)} N   ·   ${f2((Vv * 9.8) / 1000)} N`, o.can.g.position.clone().add(V(K, 0, 0.3, 0)), V(K, 0.1, 0.05, 0), 3.5); }, ev: { type: 'look' },
        see: X('Loss in weight = 1.50 N − 1.00 N = 0.50 N = weight of the water displaced.'), why: X('This is Archimedes’ principle: a body wholly or partly immersed in a fluid experiences an upward force equal to the weight of the fluid it displaces.') },
    ],
    eq: { word: "Archimedes' principle", sym: 'W₁ − W₂ = V ρ(water) g = 0.051 kg × 9.8 m/s² ≈ 0.50 N' },
    result: { obs: X('Weight in air W₁ = 1.50 N; weight in water W₂ = 1.00 N; water displaced V = 51 mL, weighing about 0.50 N.'),
      concl: X('The loss in weight of the stone (0.50 N) is equal to the weight of the water it displaced. Archimedes’ principle is verified.'),
      safety: X('Fill the can only until water just stops dripping before you start. The stone must not touch the can. Read the cylinder at the bottom of the meniscus.'),
      viva: [{ q: X('What is buoyant force?'), a: X('The upward force exerted by a fluid on a body immersed in it.') }, { q: X('Why does a stone feel lighter in water?'), a: X('The upthrust of the water acts upwards on it, opposite to its weight.') }, { q: X('Name one use of Archimedes’ principle.'), a: X('Designing ships and submarines, or hydrometers and lactometers.') }] },
  },
  {
    id: 'p9_density_solid', subj: 'physics', cls: 9, ch: LM1, title: X('Density of a solid'),
    aim: X('To find the density of a solid (denser than water) using a spring balance and a measuring cylinder.'),
    kind: X('Mass ÷ volume (Lab Manual)'),
    setup(K) {
      const cyl = K.MC.withDisp(K.add(K.MC.cylinder100(), 0.05, -0.6)); const bk = K.beaker(-0.2, -0.52, 'water', 200, 250);
      const st = K.add(K.A5.labStand(0.6), -0.36, -0.78); st.clamp(0.58, 0.11);
      const bal = K.add(K.MC.springBalance({ unit: 'g', max: 500 }), -0.39, -0.72, { y: BENCH_Y + 0.58 }); const s = K.add(K.MC.sinker({ kind: 'brass', mass: 170, vol: 20, thread: 0.15 }), 0, -2); bal.hookG.add(s.g); s.g.position.set(0, 0, 0);
      K.solver(() => { K.MC.immerse(s, [cyl]); bal.load = s.g.parent === bal.hookG ? s.mass - s.Vsub : 0; });
      return { cyl, bk, st, bal, s };
    },
    steps: [
      { do: X('Note the least counts: the spring balance reads in steps of 5 g and the measuring cylinder in steps of 1 mL.'), target: 'bal', act: async (K, o) => { await tag(K, o.bal, `${tl(K, X('Spring balance'))}: 5 g`, 2, -0.05); await tag(K, o.cyl, `${tl(K, X('Measuring cylinder'))}: 1 mL`, 2, 0.2); }, ev: { type: 'look' }, see: X('Least count of the spring balance = 5 g; of the measuring cylinder = 1 mL.') },
      { do: X('Take the spring balance with the brass piece hanging from it and read the mass m.'), target: 'bal', act: async (K, o) => { await K.moveTo(o.bal, V(K, -0.2, BENCH_Y + 0.5, -0.66), new K.THREE.Quaternion(), 1.2); o.bal.home = { p: o.bal.g.position.clone(), q: o.bal.g.quaternion.clone() }; await K.sleep(1); o.m = o.bal.read(); await tag(K, o.bal, `m = ${o.m} g`, 2.4, -0.05); }, ev: { type: 'look' },
        see: X('The spring balance reads m = 170 g.') },
      { do: X('Pour water into the measuring cylinder up to the 50 mL mark. Read the bottom of the meniscus: this is V₁.'), target: 'bk', act: async (K, o) => { await K.pour(o.bk, o.cyl, 50); await K.sleep(0.6); await tag(K, o.cyl, `V₁ = ${Math.round(o.cyl.ml)} mL`, 2.4, 0.22); }, ev: { type: 'pour' },
        see: X('V₁ = 50 mL.') },
      { do: X('Unhook the brass piece and lower it gently by its thread into the cylinder until it is completely under water. Read the new level V₂.'), target: 's', act: async (K, o) => { const c = o.cyl.g.position; K.detach(o.s); await K.moveTo(o.s, V(K, c.x, BENCH_Y + 0.33, c.z), new K.THREE.Quaternion(), 1.2); const y0 = o.s.g.position.y; await K.tween(2.6, (k) => { o.s.g.position.y = y0 - (y0 - (BENCH_Y + 0.229)) * k; }); await K.sleep(1); o.V2 = Math.round(o.cyl.heightFor ? o.cyl.ml + o.cyl.disp : o.cyl.ml); await tag(K, o.cyl, `V₂ = ${o.V2} mL`, 2.4, 0.22); K.lab.emit('dip', { obj: o.s.id }); }, ev: { type: 'dip' },
        see: X('The water level rises to V₂ = 70 mL.'), why: X('The brass piece pushes aside (displaces) its own volume of water.') },
      { do: X('Find the volume of the brass piece and its density.'), target: 'cyl', act: async (K, o) => { const m = o.m ?? 170, Vv = (o.V2 ?? 70) - 50; await K.showTag(`V = V₂ − V₁ = ${Vv} cm³ · ρ = m/V = ${(m / Vv).toFixed(1)} g/cm³`, o.cyl.g.position.clone().add(V(K, 0, 0.25, 0)), V(K, 0.1, 0.05, 0), 3.5); }, ev: { type: 'look' },
        see: X('V = 70 − 50 = 20 cm³, so the density ρ = 170 g ÷ 20 cm³ = 8.5 g/cm³ (8500 kg/m³).'), why: X('Density is mass per unit volume. Brass is about 8.5 times as dense as water.') },
    ],
    eq: { word: 'Density', sym: 'ρ = m / V = 170 g / (70 − 50) cm³ = 8.5 g/cm³ = 8500 kg/m³' },
    result: { obs: X('Mass of the brass piece m = 170 g; V₁ = 50 mL; V₂ = 70 mL; volume V = 20 cm³.'),
      concl: X('The density of the brass piece is about 8.5 g/cm³ (8500 kg/m³).'),
      safety: X('Lower the solid gently so that water does not splash out and the cylinder does not crack. Keep your eye level with the meniscus.'),
      viva: [{ q: X('What is the SI unit of density?'), a: X('kg/m³ (1 g/cm³ = 1000 kg/m³).') }, { q: X('Why must the solid be completely under water?'), a: X('Only then does it displace a volume of water equal to its own volume.') }, { q: X('Will this solid float or sink in water?'), a: X('It sinks, because its density is more than that of water (1 g/cm³).') }] },
  },
  {
    id: 'p9_tuning_fork', subj: 'physics', cls: 9, ch: C10, title: X('A vibrating tuning fork'),
    aim: X('To show that sound is produced by vibrating objects, using a tuning fork and water.'),
    kind: X('Sound is produced by vibration'),
    setup(K) { const f = K.lay(K.MC.tuningFork(), 0.05, -0.5, 0.3); const pad = K.add(K.MC.rubberPad(), -0.18, -0.56); const bk = K.beaker(0.2, -0.62, 'water', 200, 250); const sp = new K.MC.Splash(K.app.scene); K.solver((dt) => sp.update(dt)); K.extras.push({ get parent() { sp.clear(); return null; } }); return { f, pad, bk, sp }; },
    steps: [
      { do: X('Strike one prong of the tuning fork on the rubber pad and bring the fork close to your ear.'), target: 'f', act: async (K, o) => { await strike(K, o); await K.moveTo(o.f, V(K, 0.0, BENCH_Y + 0.3, -0.42), null, 1); await tag(K, o.f, '512 Hz', 2.4, 0.18); }, ev: { type: 'strike' },
        see: X('You hear a steady, pure humming sound. The prongs look slightly blurred.') },
      { do: X('Strike it again and gently touch the tip of one prong to the surface of the water.'), target: 'bk', act: async (K, o) => { await strike(K, o); const q = new K.THREE.Quaternion().setFromAxisAngle(V(K, 1, 0, 0), Math.PI); const lv = o.bk.levelWorld(); const c = o.bk.g.position; const tipOff = 0.1425; await K.moveTo(o.f, V(K, c.x - 0.0085, lv + tipOff + 0.02, c.z), q, 1); await K.tween(0.4, (k) => { o.f.g.position.y = lv + tipOff + 0.02 - 0.0215 * k; });
          for (let i = 0; i < 26 && o.f.vib > 0.12; i++) { const tp = o.f.tipWorld(1); tp.y = lv + 0.001; o.sp.burst(tp, 3, 0.28 * o.f.vib); if (i % 3 === 0) o.sp.ripple(tp, 0.03); await K.sleep(0.09); } await K.up(o.f, 0.08, 0.5); K.lab.emit('touch', { obj: o.f.id }); }, ev: { type: 'touch' },
        see: X('The water splashes and ripples spread out from the prong.'), why: X('The prongs vibrate to and fro very fast (512 times a second for this fork). The vibrating prong pushes the water — and the air around it. Sound is produced by vibrating objects.') },
      { do: X('Strike the fork again, then hold the prongs between your fingers.'), target: 'f', act: async (K, o) => { await strike(K, o); await K.sleep(1.2); o.f.vib = 0; o.snd && o.snd.stop(); K.lab.emit('damp', { obj: o.f.id }); await K.sleep(1); await K.home(o.f, 0.9); }, ev: { type: 'damp' },
        see: X('The sound stops at once.'), why: X('When the prongs stop vibrating, no more sound is produced.') },
    ],
    eq: { word: 'Sound is produced by vibrating objects', sym: 'frequency of the fork = 512 Hz (vibrations per second)' },
    result: { obs: X('The struck tuning fork gave a steady hum; its prong made the water splash and ripple; when the prongs were held, the sound stopped.'),
      concl: X('Sound is produced by vibrating objects. The tuning fork vibrates 512 times a second.'),
      safety: X('Strike the fork only on a rubber pad, never on a hard surface. Do not put the vibrating fork into your ear.'),
      viva: [{ q: X('What is the frequency of a tuning fork?'), a: X('The number of vibrations its prongs make in one second; it is marked on the fork.') }, { q: X('Why is the fork struck on a rubber pad?'), a: X('A hard surface can damage the fork and change its frequency; rubber also gives a pure tone.') }, { q: X('What vibrates in our throat when we speak?'), a: X('The vocal cords.') }] },
  },
  {
    id: 'p9_bell_jar', subj: 'physics', cls: 9, ch: C10, title: X('Sound needs a medium: bell in a bell jar'),
    aim: X('To show that sound needs a material medium to travel and cannot travel through a vacuum.'),
    kind: X('Electric bell in a vacuum'),
    setup(K) {
      const jar = K.add(K.MC.bellJar(), 0, -0.64); const pump = K.add(K.MC.vacuumPump(), 0.28, -0.62); pump.jar = jar; jar.audio = K.app.audio; pump.audio = K.app.audio;
      const a = jar.g.localToWorld(jar.outlet.clone()), b = pump.g.localToWorld(pump.port.clone()); const T = K.THREE; const hose = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a, a.clone().add(V(K, 0.04, 0, 0.02)), b.clone().add(V(K, -0.04, 0, 0.03)), b]), 24, 0.004, 8), new T.MeshStandardMaterial({ color: 0x8a1d1d, roughness: 0.6 })); K.app.scene.add(hose); K.extras.push(hose);
      const bat = K.add(K.A4.cellPack(2), -0.3, -0.58); const key = K.add(K.A4.plugKey(), -0.2, -0.5); K.wires([[[bat, '+'], [key, 'a'], 0xc62828], [[key, 'b'], [jar, 'a'], 0xc62828], [[jar, 'b'], [bat, '-'], 0x222222]]);
      return { jar, pump, key, bat };
    },
    steps: [
      { do: X('Switch on the electric bell inside the bell jar.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); o.jar.on = true; await K.sleep(2.4); }, ev: { type: 'key' },
        see: X('The hammer strikes the gong again and again, and you hear the bell ringing loudly.') },
      { do: X('Start the vacuum pump to pump the air out of the jar slowly. Keep listening.'), target: 'pump', act: async (K, o) => { o.pump.on = true; K.lab.emit('pump', { obj: o.pump.id }); await K.sleep(4); await tag(K, o.pump, `${tl(K, X('Pressure in the jar'))}: ${Math.round(o.jar.p * 100)} kPa`, 2, 0.16); await K.sleep(5); await tag(K, o.pump, `${tl(K, X('Pressure in the jar'))}: ${Math.round(o.jar.p * 100)} kPa`, 2, 0.16); }, ev: { type: 'pump' },
        see: X('The sound becomes fainter and fainter, though you can still see the hammer striking the gong.'), why: X('Sound travels as vibrations of a medium. As the air is pumped out, less and less air is left to carry the vibrations from the bell to the glass and out to your ear.') },
      { do: X('Switch off the pump and open the valve to let the air back into the jar.'), target: 'pump', act: async (K, o) => { o.pump.on = false; o.pump.venting = true; K.app.audio && K.app.audio.hiss && K.app.audio.hiss(); await K.sleep(3.4); o.pump.venting = false; await tag(K, o.pump, `${tl(K, X('Pressure in the jar'))}: ${Math.round(o.jar.p * 100)} kPa`, 2, 0.16); K.lab.emit('vent', { obj: o.pump.id }); }, ev: { type: 'vent' },
        see: X('As the air rushes back in, the sound of the bell becomes loud again.') },
      { do: X('Switch off the bell.'), target: 'key', act: async (K, o) => { o.jar.on = false; await K.keyOn(o.key, false); }, ev: { type: 'key' }, see: X('The ringing stops.') },
    ],
    eq: { word: 'Sound needs a medium', sym: 'air (or any solid, liquid or gas) → sound travels · vacuum → no sound' },
    result: { obs: X('The bell rang loudly at first. As the air was pumped out the sound became very faint, even though the hammer kept striking. When air was let in again the sound became loud.'),
      concl: X('Sound needs a material medium such as air to travel. It cannot travel through a vacuum.'),
      safety: X('Handle the glass bell jar carefully. Let air into the jar slowly before lifting it.'),
      viva: [{ q: X('Why can a faint sound still be heard when most of the air is pumped out?'), a: X('Some air is left, and the sound also travels through the base plate and the bell’s supports.') }, { q: X('Can astronauts on the Moon talk to each other directly?'), a: X('No: there is no air on the Moon. They use radio, which does not need a medium.') }, { q: X('Does sound travel through solids and liquids too?'), a: X('Yes, in fact faster than through air.') }] },
  },
  {
    id: 'p9_lever', subj: 'physics', cls: 9, ch: C7, title: X('A lever: lifting a stapler with erasers'),
    aim: X('To show how a lever lets a small effort lift a large load.'),
    kind: X('Simple machine: the lever'),
    setup(K) {
      const sc = K.add(K.MC.scale30(), 0, -0.6); const fx = sc.g.position.x + sc.xAt(7); const pen = K.add(K.MC.roundPencil(), fx, -0.6);
      const sp = K.add(K.MC.stapler(), -0.22, -0.48); const er = [0, 1, 2].map((i) => K.add(K.MC.eraser(), 0.2 + i * 0.04, -0.48));
      return { sc, pen, sp, e1: er[0], e2: er[1], e3: er[2] };
    },
    steps: [
      { do: X('Place the 30 cm scale on the round pencil so that the pencil is under the 7 cm mark (the fulcrum).'), target: 'sc', act: (K, o) => tag(K, o.sc, `${tl(K, X('Fulcrum'))}: 7 cm`, 2.2, 0.05), ev: { type: 'look' },
        see: X('The longer side of the scale tips down and rests on the table.') },
      { do: X('Put the stapler (150 g) across the short end of the scale, at the 2.5 cm mark.'), target: 'sp', act: (K, o) => onScale(K, o.sc, o.sp, 2.5), ev: { type: 'place' },
        see: X('The stapler end goes down and the long end of the scale rises.') },
      { do: X('Put erasers (20 g each) one by one on the far end, at the 28 cm mark, until the stapler is lifted.'), target: 'e1', act: async (K, o) => { await onScale(K, o.sc, o.e1, 28); await K.sleep(1); await tag(K, o.sc, tl(K, X('1 eraser: the stapler stays down')), 2.2, 0.06); await onScale(K, o.sc, o.e2, 28, 0.011); await K.sleep(1.2); await tag(K, o.sc, tl(K, X('2 erasers: the stapler is lifted!')), 2.4, 0.06); }, ev: { type: 'place' },
        see: X('One eraser is not enough, but with the second eraser the scale tips over and the heavy stapler is lifted.') },
      { do: X('Compare the turning effects of the load and the effort about the fulcrum.'), target: 'sc', act: (K, o) => K.showTag(`${tl(K, X('Load'))}: 150 g × 4.5 cm = 675 · ${tl(K, X('Effort'))}: 40 g × 21 cm = 840 (+ scale 120)`, o.sc.g.position.clone().add(V(K, 0, 0.06, 0)), V(K, 0.04, 0.08, 0), 4), ev: { type: 'look' },
        see: X('The load is heavy but close to the fulcrum; the effort is light but far from it. The effort side turns the scale more.'), why: X('A lever turns about its fulcrum. Load × load arm = effort × effort arm at balance, so a long effort arm lets a small effort move a large load.') },
    ],
    eq: { word: 'Principle of the lever', sym: 'load × load arm = effort × effort arm (at balance) · 150 g × 4.5 cm ≈ 40 g × 21 cm' },
    result: { obs: X('Two erasers (40 g) at 21 cm from the fulcrum lifted the stapler (150 g) placed 4.5 cm from it; one eraser could not.'),
      concl: X('A lever can lift a heavy load with a small effort when the effort arm is much longer than the load arm.'),
      safety: X('Place things gently on the scale so that they do not slide off.'),
      viva: [{ q: X('Name the three parts of a lever.'), a: X('The fulcrum, the load and the effort.') }, { q: X('Give two examples of levers used at home.'), a: X('A see-saw, scissors, a bottle opener, a nutcracker.') }, { q: X('How can you lift the stapler with only one eraser?'), a: X('Move the pencil (fulcrum) closer to the stapler, so the load arm is shorter and the effort arm longer.') }] },
  },
];

// strike the tuning fork on the rubber pad: it starts to vibrate and hum
async function strike(K, o) {
  const p = o.pad.g.position; const q = new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), -Math.PI / 2); // held sideways so that a prong hits the pad
  await K.moveTo(o.f, V(K, p.x - 0.1, BENCH_Y + 0.05, p.z), q, 0.8); const y0 = o.f.g.position.y; await K.tween(0.12, (k) => { o.f.g.position.y = y0 - 0.024 * Math.sin(Math.PI * k); });
  o.snd && o.snd.stop(); o.f.vib = 1; o.snd = K.MC.forkSound(K.app.audio); K.lab.emit('strike', { obj: o.f.id }); await K.sleep(0.3);
}
// put something on the lever at a scale mark; it then turns with the scale
async function onScale(K, sc, it, cm, lift = 0) {
  const lp = V(K, sc.xAt(cm) - sc.pivot.position.x, 0.0015 + lift, 0); const w = sc.pivot.localToWorld(lp.clone()); const q = sc.pivot.getWorldQuaternion(new K.THREE.Quaternion());
  await K.moveTo(it, w, q, 1); sc.pivot.attach(it.g); it.g.position.copy(lp); it.g.quaternion.identity(); sc.loads.push({ grams: it.grams, cm }); K.lab.emit('place', { obj: it.id }); await K.sleep(0.4);
}
