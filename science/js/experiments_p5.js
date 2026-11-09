// Physics experiments, batch 5 (Class 9): friction on different surfaces, two spring balances (action and reaction), a balloon
// rocket, a ball dropped into sand from different heights, a cart pulled up an inclined plane, the cooling curve of hot water,
// waves on a slinky, grains jumping on a drum skin, and the reflection of sound.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const f2 = (n) => n.toFixed(2);
const C6 = N('Ch 6 · How Forces Affect Motion', 'अध्याय 6 · बल गति को कैसे प्रभावित करते हैं', 'Ch 6 · Forces motion ko kaise affect karte hain');
const C7 = N('Ch 7 · Work, Energy and Simple Machines', 'अध्याय 7 · कार्य, ऊर्जा और सरल मशीनें', 'Ch 7 · Work, Energy aur Simple Machines');
const C10 = N('Ch 10 · Sound Waves: Characteristics and Applications', 'अध्याय 10 · ध्वनि तरंगें: विशेषताएँ और अनुप्रयोग', 'Ch 10 · Sound Waves: Characteristics aur Applications');
const LM3 = N('Lab Manual · Moving Things, People and Ideas', 'प्रयोगशाला पुस्तिका · गतिमान वस्तुएँ, लोग और विचार', 'Lab Manual · Moving Things, People aur Ideas');
const G = 9.8;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const rq = (K, a) => new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), a);
const _S = [X('Limiting friction'), X('While sliding'), X('Wood'), X('Glass'), X('Sandpaper'), X('Room temperature'), X('Depth of the dent'), X('Lifting straight up'), X('Pulling along the plank'), X('Work'), X('faint'), X('loudest'), X('louder')];
void _S;

// ---------------------------------------------------------------- friction: the hand pulls the ring of a horizontal spring balance hooked to the block
async function pull(K, o, extra = 0) {
  const b = o.blk, bal = o.bal; const W = (0.4 + extra) * G, Fs = o.surf.ms * W, Fk = o.surf.mk * W; const hk = () => b.g.localToWorld(b.hookLocal.clone());
  const place = (F) => { const h = hk(); bal.g.position.set(h.x + 0.176 + (0.1 * F) / 5, h.y, h.z); };
  await K.tween(1.8, (k) => { const F = Fs * k; bal.load = F; place(F); }); // the balance stretches, the block does not move yet
  o.Fs = Math.round(Fs / 0.05) * 0.05; await K.sleep(0.2);
  const x0 = b.g.position.x; await K.tween(2.4, (k) => { const F = Fk + Math.sin(k * 40) * 0.03; bal.load = F; b.g.position.x = x0 + 0.13 * k; place(F); }); o.Fk = Math.round(Fk / 0.05) * 0.05;
  bal.load = 0; await K.sleep(0.6); place(0); b.home = { p: b.g.position.clone(), q: b.g.quaternion.clone() }; K.lab.emit('pull', { obj: b.id });
}
async function moveBlockTo(K, o, board) { const t = board.g.position; await K.moveTo(o.blk, V(K, t.x - 0.17, t.y + board.top, t.z), new K.THREE.Quaternion(), 1); o.blk.home = { p: o.blk.g.position.clone(), q: o.blk.g.quaternion.clone() }; const h = o.blk.g.localToWorld(o.blk.hookLocal.clone()); await K.moveTo(o.bal, V(K, h.x + 0.176, h.y, h.z), rq(K, -Math.PI / 2), 0.8); o.surf = board; }

export const EXPERIMENTS_P5 = [
  {
    id: 'p9_friction', subj: 'physics', cls: 9, ch: C6, title: X('Friction on different surfaces'),
    aim: X('To study how the force of friction depends on the nature of the surfaces and on how hard they are pressed together.'),
    kind: X('Limiting friction with a spring balance'),
    setup(K) {
      const wood = K.add(K.M2.surfaceBoard('wood'), 0, -0.5), glass = K.add(K.M2.surfaceBoard('glass'), 0, -0.64), sand = K.add(K.M2.surfaceBoard('sand'), 0, -0.78);
      const blk = K.add(K.M2.hookBlock(), -0.17, -0.5, { y: BENCH_Y + wood.top }); const h = blk.g.localToWorld(blk.hookLocal.clone());
      const bal = K.add(K.MC.springBalance({ unit: 'N', max: 5 }), h.x + 0.176, -0.5, { y: h.y }); bal.g.quaternion.copy(rq(K, -Math.PI / 2)); bal.g.position.set(h.x + 0.176, h.y, h.z); bal.home = { p: bal.g.position.clone(), q: bal.g.quaternion.clone() };
      const m200 = K.add(K.M2.slottedMass(200), 0.34, -0.42);
      return { wood, glass, sand, blk, bal, m200, surf: wood };
    },
    steps: [
      { do: X('The wooden block (400 g) lies on the wooden board, hooked to a spring balance held flat along the board.'), target: 'blk', act: (K) => K.sleep(1.2), see: X('The spring balance reads zero: nothing pulls the block yet.') },
      { do: X('Pull the ring of the spring balance slowly. Note the reading just when the block starts to move, and the reading while it slides steadily.'), target: 'bal', act: async (K, o) => { await pull(K, o); o.R = { wood: [o.Fs, o.Fk] }; await tag(K, o.bal, `${tl(K, X('Limiting friction'))}: ${f2(o.Fs)} N · ${tl(K, X('While sliding'))}: ${f2(o.Fk)} N`, 3, 0.05); }, ev: { type: 'pull' },
        see: X('The reading rises to about 1.65 N before the block moves; while it slides the reading is a little less, about 1.35 N.'), why: X('Friction opposes the pull. It grows with the pull until a limit (limiting friction); once sliding, friction is a little smaller.') },
      { do: X('Put the 200 g mass on the block and pull again.'), target: 'm200', act: async (K, o) => { await moveBlockTo(K, o, o.wood); const p = o.blk.g.position; await K.moveTo(o.m200, V(K, p.x, p.y + 0.045, p.z), null, 1); o.blk.g.attach(o.m200.g); await pull(K, o, 0.2); await tag(K, o.bal, `${tl(K, X('Limiting friction'))}: ${f2(o.Fs)} N`, 2.6, 0.05); K.detach(o.m200); await K.moveTo(o.m200, V(K, 0.34, BENCH_Y + 0.0008, -0.42), null, 0.8); o.m200.home = { p: o.m200.g.position.clone(), q: o.m200.g.quaternion.clone() }; }, ev: { type: 'pull' },
        see: X('Now the block starts to move only at about 2.45 N: the heavier block, pressed harder on the board, has more friction.') },
      { do: X('Move the block to the glass sheet and then to the sandpaper, and pull it each time.'), target: 'glass', act: async (K, o) => { const out = []; for (const [b, nm] of [[o.glass, X('Glass')], [o.sand, X('Sandpaper')]]) { await moveBlockTo(K, o, b); await pull(K, o); out.push(`${tl(K, nm)}: ${f2(o.Fs)} N`); await tag(K, o.bal, `${tl(K, nm)}: ${f2(o.Fs)} N`, 2, 0.05); } o.cmp = out; }, ev: { type: 'pull' },
        see: X('On smooth glass the block moves at only about 0.95 N; on rough sandpaper it needs about 2.8 N.') },
      { do: X('Compare all the readings.'), target: 'bal', act: (K, o) => K.showTag(`${tl(K, X('Wood'))}: 1.65 N · +200 g: 2.45 N · ${(o.cmp || []).join(' · ')}`, o.glass.g.position.clone().add(V(K, 0, 0.12, 0)), V(K, 0.05, 0.06, 0), 4), ev: { type: 'look' },
        see: X('Friction is least on the smooth glass and most on the rough sandpaper, and it increases when the block is pressed harder against the surface.'), why: X('Friction comes from the tiny bumps of the two surfaces locking into each other. Rougher surfaces and a larger force pressing them together give more friction.') },
    ],
    eq: { word: 'Limiting friction', sym: 'F = μ R · R = m g · wood: F ≈ 0.42 × 3.92 N ≈ 1.65 N' },
    result: { obs: X('Block on wood: 1.65 N (sliding 1.35 N); with 200 g more: 2.45 N; on glass: 0.95 N; on sandpaper: 2.8 N.'),
      concl: X('The force of friction depends on the nature of the surfaces in contact and increases with the force pressing them together. Static (limiting) friction is a little more than sliding friction.'),
      safety: X('Pull the spring balance slowly and keep it parallel to the board.'),
      viva: [{ q: X('Why is it harder to start pushing a heavy box than to keep it moving?'), a: X('Static friction is greater than sliding friction.') }, { q: X('Name two ways of reducing friction.'), a: X('Using lubricants (oil, grease) and using wheels or ball bearings; polishing the surfaces.') }, { q: X('Why do shoes have grooved soles?'), a: X('To increase friction so that we do not slip.') }] },
  },
  {
    id: 'p9_third_law', subj: 'physics', cls: 9, ch: C6, title: X('Action and reaction with two spring balances'),
    aim: X('To show that when two bodies pull on each other, the forces are equal and opposite.'),
    kind: X("Newton's third law"),
    setup(K) {
      const st = K.add(K.A5.labStand(0.12), -0.36, -0.58); const y = BENCH_Y + 0.05;
      const A = K.add(K.MC.springBalance({ unit: 'N', max: 5, name: X('Spring balance A (fixed)') }), -0.3, -0.6, { y }); A.g.quaternion.copy(rq(K, Math.PI / 2)); A.g.position.set(-0.3, y, -0.6);
      const B = K.add(K.MC.springBalance({ unit: 'N', max: 5, name: X('Spring balance B (pulled)') }), 0.06, -0.6, { y }); B.g.quaternion.copy(rq(K, -Math.PI / 2)); B.g.position.set(-0.3 + 0.35, y, -0.6);
      for (const s of [A, B]) s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() };
      return { st, A, B };
    },
    steps: [
      { do: X('Hook two identical spring balances to each other. The ring of A is held by a fixed hook; you hold the ring of B.'), target: 'B', act: (K) => K.sleep(1.2), see: X('Both balances read zero.') },
      { do: X('Pull B gently and note the readings of both balances.'), target: 'B', act: async (K, o) => { await pullPair(K, o, 2); await tag(K, o.A, `A: ${f2(o.A.read())} N`, 2, 0.05, -0.06); await tag(K, o.B, `B: ${f2(o.B.read())} N`, 2, 0.05); }, ev: { type: 'pull' },
        see: X('Both balances read 2.0 N.') },
      { do: X('Pull B harder and read both balances again.'), target: 'B', act: async (K, o) => { await pullPair(K, o, 3.5); await tag(K, o.A, `A: ${f2(o.A.read())} N`, 2, 0.05, -0.06); await tag(K, o.B, `B: ${f2(o.B.read())} N`, 2, 0.05); await pullPair(K, o, 0); }, ev: { type: 'pull' },
        see: X('Both read 3.5 N. However hard you pull, the two readings are always equal.'), why: X('B pulls on A (action) and A pulls back on B (reaction). The two forces are always equal in size and opposite in direction, and they act on different bodies.') },
    ],
    eq: { word: "Newton's third law of motion", sym: 'F(A on B) = − F(B on A)' },
    result: { obs: X('The two spring balances always showed the same reading (2.0 N, then 3.5 N), though the forces act in opposite directions.'),
      concl: X('To every action there is an equal and opposite reaction. The two forces act on two different bodies.'),
      safety: X('Do not pull beyond the range of the spring balances (5 N).'),
      viva: [{ q: X('Do action and reaction cancel each other?'), a: X('No, they act on different bodies.') }, { q: X('Why does a gun recoil when fired?'), a: X('The gun pushes the bullet forward; the bullet pushes the gun back with an equal force.') }, { q: X('How does a swimmer move forward?'), a: X('The swimmer pushes the water backwards; the water pushes the swimmer forwards.') }] },
  },
  {
    id: 'p9_balloon_rocket', subj: 'physics', cls: 9, ch: C6, title: X('Balloon rocket'),
    aim: X('To show action and reaction with a balloon that moves along a thread.'),
    kind: X('Action and reaction: rocket propulsion'),
    setup(K) {
      const y = BENCH_Y + 0.32; const s1 = K.add(K.A5.labStand(0.34), -0.58, -0.6); s1.clamp(0.32, 0.06); const s2 = K.add(K.A5.labStand(0.34), 0.62, -0.6); s2.clamp(0.32, 0.06);
      const a = V(K, -0.61, y, -0.59), b = V(K, 0.59, y, -0.59); const T = K.THREE; const th = new T.Mesh(new T.CylinderGeometry(0.0005, 0.0005, a.distanceTo(b), 6), new T.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 })); th.position.copy(a).lerp(b, 0.5); th.rotation.z = Math.PI / 2; K.app.scene.add(th); K.extras.push(th);
      const r = K.add(K.M2.balloonRocket(), -0.45, -0.59, { y }); r.g.position.set(-0.45, y, -0.59); r.home = { p: r.g.position.clone(), q: r.g.quaternion.clone() };
      return { s1, s2, r, y };
    },
    steps: [
      { do: X('A drinking straw is threaded on a long thread stretched between two stands, and a balloon is taped below it. Blow up the balloon and hold its neck closed.'), target: 'r', act: async (K, o) => { await K.tween(2.4, (k) => o.r.setAir(k)); K.lab.emit('inflate', { obj: o.r.id }); }, ev: { type: 'inflate' },
        see: X('The balloon is full of air, its open neck pointing backwards.') },
      { do: X('Let go of the neck.'), target: 'r', act: async (K, o) => { let v = 0, x = o.r.g.position.x; const au = K.app.audio; au && au.burst && au.burst(1.2, 900, 0.25, 'bandpass');
          await new Promise((res) => { const w = { t: 0, dur: 1e9, fn: (k, d) => { const air = o.r.air; const F = air > 0.01 ? 0.9 * Math.sqrt(air) : 0; const m = 0.006 + 0.004 * air; v += (F / m - 3.5 * v - (v > 0 ? 1.2 : 0)) * d; v = Math.max(0, v); x += v * d; o.r.setAir(Math.max(0, air - d * 0.9)); if (x > 0.5) { x = 0.5; v = 0; } o.r.g.position.x = x; if ((air <= 0.01 && v < 0.01) || w.t > 8) { w.t = w.dur; } }, res }; K.tweens.push(w); });
          o.r.home = { p: o.r.g.position.clone(), q: o.r.g.quaternion.clone() }; K.lab.emit('release', { obj: o.r.id }); }, ev: { type: 'release' },
        see: X('Air rushes out backwards, and the balloon shoots forwards along the thread.'), why: X('The balloon pushes the air out backwards (action); the air pushes the balloon forwards (reaction). Rockets and jet engines work the same way.') },
    ],
    eq: { word: 'Action and reaction', sym: 'force on the air (backwards) = force on the balloon (forwards)' },
    result: { obs: X('When the neck was released, the air rushed out backwards and the balloon moved forwards along the thread until the air was used up.'),
      concl: X('The force that pushes the air out of the balloon is matched by an equal and opposite force on the balloon: action and reaction.'),
      safety: X('Do not overblow the balloon. Keep the path along the thread clear.'),
      viva: [{ q: X('Which way does the balloon move compared with the escaping air?'), a: X('In the opposite direction.') }, { q: X('Why does the balloon stop?'), a: X('The air runs out, and friction and air resistance slow it down.') }, { q: X('Can a rocket work in space where there is no air?'), a: X('Yes: it pushes its own exhaust gases out; it does not need air to push against.') }] },
  },
  {
    id: 'p9_ball_sand', subj: 'physics', cls: 9, ch: C7, title: X('Potential energy: a ball dropped into sand'),
    aim: X('To show that an object raised higher has more potential energy, by dropping a ball into sand from different heights.'),
    kind: X('Potential energy and height'),
    setup(K) { const t = K.add(K.M2.sandTray(), 0, -0.64); const b = K.add(K.M2.heavyBall(), 0.3, -0.48); const r = K.add(K.A6.ruler ? K.A6.ruler() : K.MC.scale30(), 0.32, -0.76); return { t, b, r }; },
    steps: [
      { do: X('Smooth the sand in the tray. Hold the heavy ball 25 cm above the sand and let it fall.'), target: 'b', act: (K, o) => drop(K, o, -0.1, 0.25), ev: { type: 'drop' }, see: X('The ball makes a small dent in the sand.') },
      { do: X('Drop it from 50 cm at another place.'), target: 'b', act: (K, o) => drop(K, o, 0.0, 0.5), ev: { type: 'drop' }, see: X('The dent is deeper.') },
      { do: X('Now drop it from 1 m at a third place.'), target: 'b', act: (K, o) => drop(K, o, 0.1, 1.0), ev: { type: 'drop' }, see: X('The dent is the deepest of the three.') },
      { do: X('Measure the depth of each dent with the scale.'), target: 't', act: async (K, o) => { for (const c of o.t.craters) { const w = o.t.g.localToWorld(V(K, c.x, o.t.surfY, c.z)); await K.showTag(`${tl(K, X('Depth of the dent'))}: ${(c.d * 100).toFixed(1)} cm`, w, V(K, 0, 0.07, 0), 1.6); } }, ev: { type: 'look' },
        see: X('Depths: about 0.8 cm (25 cm), 1.1 cm (50 cm) and 1.5 cm (1 m).'), why: X('Raised higher, the ball has more potential energy (mgh). As it falls this becomes kinetic energy, which does more work on the sand.') },
    ],
    eq: { word: 'Gravitational potential energy', sym: 'Ep = m g h · 0.5 kg × 9.8 m/s² × 1 m = 4.9 J' },
    result: { obs: X('The higher the ball was dropped from, the deeper the dent it made in the sand (0.8 cm, 1.1 cm, 1.5 cm for 25 cm, 50 cm, 1 m).'),
      concl: X('An object raised to a greater height has more potential energy, so it can do more work when it falls.'),
      safety: X('Keep your feet and hands away from where the ball falls.'),
      viva: [{ q: X('What is the potential energy of the 0.5 kg ball at 1 m?'), a: X('mgh = 0.5 × 9.8 × 1 = 4.9 J.') }, { q: X('What happens to the potential energy as the ball falls?'), a: X('It changes into kinetic energy.') }, { q: X('Where does the energy go when the ball stops in the sand?'), a: X('Into moving the sand (work) and into heat and sound.') }] },
  },
  {
    id: 'p9_incline', subj: 'physics', cls: 9, ch: C7, title: X('Inclined plane: less force, more distance'),
    aim: X('To compare the force and the work needed to raise a cart straight up and along an inclined plane.'),
    kind: X('Simple machine: the inclined plane'),
    setup(K) { const inc = K.add(K.M2.inclinePlank({ len: 0.8, h: 0.4 }), 0, -0.62); const c = K.add(K.M2.toyCart(), -0.42, -0.45); const bal = K.add(K.MC.springBalance({ unit: 'N', max: 10, lc: 0.1 }), -0.52, -0.45, { y: BENCH_Y + 0.4 }); return { inc, c, bal }; },
    steps: [
      { do: X('Hook the cart to the spring balance and lift it slowly straight up by 40 cm, the height of the top of the plank.'), target: 'bal', act: async (K, o) => { const p0 = V(K, -0.42, BENCH_Y + 0.0008, -0.45); await K.moveTo(o.bal, V(K, p0.x, p0.y + 0.26, p0.z), new K.THREE.Quaternion(), 0.8); o.bal.load = 0.5 * G; await K.sleep(0.6); const c0 = o.c.g.position.clone(); const b0 = o.bal.g.position.clone(); await K.tween(2.2, (k) => { o.c.g.position.y = c0.y + 0.4 * k; o.bal.g.position.y = b0.y + 0.4 * k; }); o.F1 = o.bal.read(); await tag(K, o.bal, `${tl(K, X('Lifting straight up'))}: F = ${o.F1.toFixed(1)} N`, 2.4, 0.04); await K.tween(1.6, (k) => { o.c.g.position.y = c0.y + 0.4 * (1 - k); o.bal.g.position.y = b0.y + 0.4 * (1 - k); }); o.bal.load = 0; K.lab.emit('lift', { obj: o.c.id }); }, ev: { type: 'lift' },
        see: X('Lifting the cart (500 g) straight up needs a force of about 4.9 N.') },
      { do: X('Now put the cart at the bottom of the plank and pull it slowly up along the plank with the spring balance held parallel to the plank.'), target: 'c', act: async (K, o) => { const inc = o.inc, a = inc.ang; const qc = rq(K, a), qb = rq(K, a - Math.PI / 2); await K.moveTo(o.c, inc.at(0.04), qc, 1); const atS = (s) => { o.c.g.position.copy(inc.at(s)); o.c.g.quaternion.copy(qc); const h = o.c.g.localToWorld(o.c.hookLocal.clone()); const d = V(K, Math.cos(a), Math.sin(a), 0); o.bal.g.position.copy(h).addScaledVector(d, 0.176 + (0.1 * o.bal.shown) / 10); o.bal.g.quaternion.copy(qb); };
          atS(0.04); o.bal.load = 0.5 * G * Math.sin(a) + 0.05; await K.sleep(0.8); await K.tween(3.4, (k) => atS(0.04 + 0.62 * k)); o.F2 = o.bal.read(); await tag(K, o.bal, `${tl(K, X('Pulling along the plank'))}: F = ${o.F2.toFixed(1)} N`, 2.6, 0.04); o.bal.load = 0; K.lab.emit('pull', { obj: o.c.id }); }, ev: { type: 'pull' },
        see: X('Along the plank the spring balance reads only about 2.5 N, but the cart has to be pulled through 80 cm instead of 40 cm.') },
      { do: X('Compare the work done in the two cases.'), target: 'inc', act: (K, o) => K.showTag(`${tl(K, X('Work'))}: 4.9 N × 0.4 m ≈ 2.0 J   ·   2.5 N × 0.8 m ≈ 2.0 J`, o.inc.g.position.clone().add(V(K, 0, 0.5, 0)), V(K, 0.05, 0.06, 0), 4), ev: { type: 'look' },
        see: X('The work done is about the same (about 2 J) both ways, but the force needed along the plank is only half.'), why: X('An inclined plane is a simple machine: it lets us use a smaller force over a longer distance. It does not reduce the work (it adds a little, to overcome friction).') },
    ],
    eq: { word: 'Work = force × distance', sym: '4.9 N × 0.4 m ≈ 2.5 N × 0.8 m ≈ 2 J · F(along plank) = mg sin θ = mg (h/L)' },
    result: { obs: X('Lifting straight up through 40 cm needed 4.9 N; pulling along the 80 cm plank needed about 2.5 N. The work done was about 2 J both ways.'),
      concl: X('An inclined plane reduces the force needed to raise a load, but the load has to be moved through a longer distance; the work done stays about the same.'),
      safety: X('Make sure the plank is firmly held on the books so that it does not slip.'),
      viva: [{ q: X('Give two examples of inclined planes.'), a: X('A ramp for loading trucks, a slope for wheelchairs, a mountain road, a staircase.') }, { q: X('How would the force change if the plank were longer, for the same height?'), a: X('The force would be smaller (the slope is gentler).') }, { q: X('What is the SI unit of work?'), a: X('The joule (1 J = 1 N × 1 m).') }] },
  },
  {
    id: 'p9_cooling', subj: 'physics', cls: 9, ch: LM3, title: X('Cooling curve of hot water'),
    aim: X('To plot a temperature–time graph for hot water as it cools.'),
    kind: X('Temperature–time graph (Lab Manual)'),
    setup(K) { const c = K.add(K.M2.calorimeter(), -0.12, -0.62); c.T = 70; const sw = K.add(K.MC.stopwatch(), 0.1, -0.5); const gp = K.add(K.EL.graphPaper({ xmax: 60, ymax: 80, xl: 't (min)', yl: 'T (°C)' }), 0.3, -0.72); return { c, sw, gp }; },
    steps: [
      { do: X('The room temperature is 30 °C. Water in the calorimeter has just been heated to about 70 °C.'), target: 'c', act: (K, o) => tag(K, o.c, `${tl(K, X('Room temperature'))}: 30 °C · T = ${o.c.read()} °C`, 2.6, 0.32), see: X('The thermometer in the calorimeter reads 70 °C.') },
      { do: X('Start the stopwatch. Stir gently and read the temperature every 2 minutes for 20 minutes (time-lapse).'), target: 'sw', act: async (K, o) => { o.sw.reset(); o.sw.start(); o.gp.plot(0, o.c.read()); const l0 = K.app.chem.lapse; K.app.chem.lapse = 60; K.app.lapseShown = 60; for (let m = 2; m <= 20; m += 2) { await until(K, () => o.sw.t >= m * 60, 30); o.c.stirT = 0.4; o.gp.plot(m, o.c.read()); } K.app.chem.lapse = l0; K.app.lapseShown = 0; await tag(K, o.c, `t = 20 min: T = ${o.c.read()} °C`, 2.4, 0.32); K.lab.emit('read', { obj: o.c.id }); }, ev: { type: 'read' },
        see: X('The temperature falls quickly at first: from 70 °C to about 61 °C in 10 minutes and about 54 °C in 20 minutes.') },
      { do: X('Go on reading it every 5 minutes up to 60 minutes.'), target: 'c', act: async (K, o) => { if (!o.sw.running) { o.sw.start(); } const l0 = K.app.chem.lapse; K.app.chem.lapse = 120; K.app.lapseShown = 120; for (let m = 25; m <= 60; m += 5) { await until(K, () => o.sw.t >= m * 60, 30); o.c.stirT = 0.4; o.gp.plot(m, o.c.read()); } o.sw.stop(); K.app.chem.lapse = l0; K.app.lapseShown = 0; await tag(K, o.c, `t = 60 min: T = ${o.c.read()} °C`, 2.4, 0.32); K.lab.emit('read', { obj: o.c.id }); }, ev: { type: 'read' },
        see: X('Later it falls more and more slowly: about 49 °C at 30 min, 41.5 °C at 50 min and 39 °C at 60 min.') },
      { do: X('Join the points with a smooth curve.'), target: 'gp', act: async (K, o) => { o.gp.curve(); K.lab.emit('plot', { obj: o.gp.id }); await K.sleep(1); }, ev: { type: 'plot' },
        see: X('The cooling curve falls steeply at first and then flattens out as the water approaches room temperature.'), why: X('Hot water loses heat faster when it is much hotter than its surroundings. As the difference in temperature becomes smaller, it cools more slowly.') },
    ],
    eq: { word: "Newton's law of cooling (rate of cooling)", sym: 'rate of fall of T ∝ (T − T room) · T = 30 + 40 e^(−0.025 t) °C, t in min' },
    result: { obs: X('T fell from 70 °C to about 61 °C in 10 min, 54 °C in 20 min, 49 °C in 30 min and 39 °C in 60 min.'),
      concl: X('The rate of cooling is fast at first and slows down as the temperature of the water comes closer to room temperature: the cooling curve is not a straight line.'),
      safety: X('Handle hot water carefully. Stir gently and read the thermometer with your eye level with the mercury.'),
      viva: [{ q: X('Why does the curve flatten out?'), a: X('The difference between the water and the room temperature becomes smaller, so heat is lost more slowly.') }, { q: X('Why is the calorimeter kept in an insulating jacket?'), a: X('To reduce heat loss by conduction and convection to the surroundings.') }, { q: X('Why should the water be stirred?'), a: X('So that the whole of the water is at the same temperature.') }] },
  },
  {
    id: 'p9_slinky', subj: 'physics', cls: 9, ch: C10, title: X('Waves on a slinky'),
    aim: X('To show longitudinal and transverse waves on a slinky and to see that the coils only move back and forth while the wave travels.'),
    kind: X('Longitudinal and transverse waves'),
    setup(K) { const s = K.add(K.M2.slinky({ len: 1.2 }), 0, -0.62); return { s }; },
    steps: [
      { do: X('Stretch the slinky along the table; a friend holds the far end fixed. One coil is marked with a red thread.'), target: 's', act: (K) => K.sleep(1.2), see: X('The coils are evenly spaced.') },
      { do: X('Give your end a sharp push forward and pull it back.'), target: 's', act: async (K, o) => { const t0 = o.s.t; o.s.drive = (t) => { const u = (t - t0 - 0.12) / 0.06; return [0.05 * Math.exp(-u * u), 0]; }; await K.sleep(2.6); o.s.drive = null; K.lab.emit('push', { obj: o.s.id }); }, ev: { type: 'push' },
        see: X('A region where the coils are crowded together (a compression) runs along the slinky to the far end and back.'), why: X('Each coil pushes the next one: the disturbance travels, but the coils themselves do not travel along.') },
      { do: X('Do it again and watch the marked coil as the pulse passes it.'), target: 's', act: async (K, o) => { const t0 = o.s.t; o.s.drive = (t) => { const u = (t - t0 - 0.12) / 0.06; return [0.05 * Math.exp(-u * u), 0]; }; await K.sleep(2.2); o.s.drive = null; K.lab.emit('push', { obj: o.s.id }); }, ev: { type: 'push' },
        see: X('The marked coil moves forward and back along the length of the slinky, and returns to its place.'), why: X('This is a longitudinal wave: the coils move back and forth in the same direction as the wave travels. Sound travels through air like this, as compressions and rarefactions.') },
      { do: X('Now move your end quickly to one side and back.'), target: 's', act: async (K, o) => { const t0 = o.s.t; o.s.drive = (t) => { const u = (t - t0 - 0.12) / 0.07; return [0, 0.06 * Math.exp(-u * u)]; }; await K.sleep(2.6); o.s.drive = null; K.lab.emit('shake', { obj: o.s.id }); }, ev: { type: 'shake' },
        see: X('A sideways hump runs along the slinky; it comes back on the other side after the fixed end.'), why: X('This is a transverse wave: the coils move at right angles to the direction in which the wave travels.') },
    ],
    eq: { word: 'Wave speed', sym: 'v = distance ÷ time · longitudinal: particles move along the wave; transverse: across it' },
    result: { obs: X('A push sent a compression along the slinky; a sideways jerk sent a hump. The marked coil only moved to and fro about its place.'),
      concl: X('A wave carries a disturbance (energy) from place to place without carrying the material along. In a longitudinal wave the particles move along the direction of the wave; in a transverse wave they move across it.'),
      safety: X('Do not overstretch the slinky or let it snap back.'),
      viva: [{ q: X('Is sound a longitudinal or a transverse wave in air?'), a: X('Longitudinal.') }, { q: X('What are compressions and rarefactions?'), a: X('Regions where the particles are crowded together, and where they are spread apart.') }, { q: X('Does the medium travel with the wave?'), a: X('No, only the disturbance (energy) travels.') }] },
  },
  {
    id: 'p9_drum', subj: 'physics', cls: 9, ch: C10, title: X('Sound makes a drum skin vibrate'),
    aim: X('To show that sound is carried by vibrations, using grains on a stretched rubber sheet.'),
    kind: X('Vibrations of a membrane'),
    setup(K) { const d = K.add(K.M2.drum(), -0.05, -0.62); const pl = K.add(K.A3.steelPlate(), 0.22, -0.6); const hm = K.add(K.A3.hammer(), 0.24, -0.46); return { d, pl, hm }; },
    steps: [
      { do: X('A rubber sheet is stretched tight over the mouth of a tin, and a few grains of semolina are sprinkled on it. Tap the sheet gently with a finger.'), target: 'd', act: async (K, o) => { for (let i = 0; i < 3; i++) { o.d.amp = 1; K.app.audio && K.app.audio.tone && K.app.audio.tone(140, 0.25, 0.25, 'sine'); await K.sleep(0.7); } K.lab.emit('tap', { obj: o.d.id }); }, ev: { type: 'tap' },
        see: X('The grains jump up and down each time the sheet is tapped.') },
      { do: X('Hold the steel plate close to the tin (without touching it) and strike it hard with the hammer.'), target: 'hm', act: async (K, o) => { const p = o.pl.g.position; await K.moveTo(o.pl, V(K, p.x - 0.08, BENCH_Y + 0.12, p.z), new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), Math.PI / 2), 0.9); await K.moveTo(o.hm, V(K, p.x - 0.0, BENCH_Y + 0.14, p.z + 0.02), null, 0.8);
          for (let i = 0; i < 3; i++) { const h0 = o.hm.g.position.clone(); await K.tween(0.1, (k) => { o.hm.g.position.x = h0.x - 0.05 * Math.sin(Math.PI * k); }); const au = K.app.audio; if (au && au.tone) { au.tone(1180, 1.2, 0.18, 'triangle'); au.tone(2650, 0.8, 0.08, 'sine'); } o.d.amp = 0.7; await K.sleep(0.9); } K.lab.emit('strike', { obj: o.pl.id }); }, ev: { type: 'strike' },
        see: X('With each loud clang the grains on the sheet jump, though nothing has touched the tin.'), why: X('The vibrating plate makes the air vibrate. These vibrations travel through the air (sound) and make the rubber sheet vibrate — just as sound makes our eardrum vibrate.') },
    ],
    eq: { word: 'Sound travels as vibrations', sym: 'vibrating plate → vibrating air → vibrating sheet (like the eardrum)' },
    result: { obs: X('The grains jumped when the sheet was tapped, and also when a steel plate was struck near it without touching it.'),
      concl: X('Sound is carried by vibrations of the air, which can make a stretched sheet — or our eardrum — vibrate.'),
      safety: X('Do not strike the plate near anyone’s ear.'),
      viva: [{ q: X('Which part of our ear works like the rubber sheet?'), a: X('The eardrum.') }, { q: X('What carried the vibrations from the plate to the sheet?'), a: X('The air.') }, { q: X('Why do the grains jump higher for a louder sound?'), a: X('A louder sound has a larger amplitude, so the sheet vibrates more.') }] },
  },
  {
    id: 'p9_sound_reflection', subj: 'physics', cls: 9, ch: LM3, title: X('Reflection of sound'),
    aim: X('To show that sound is reflected like light, with the angle of reflection equal to the angle of incidence.'),
    kind: X('Laws of reflection of sound (Lab Manual)'),
    setup(K) {
      const P = V(K, 0, BENCH_Y, -0.86); const bd = K.add(K.M2.hardBoard(), 0, -0.9); const scr = K.add(K.M2.hardBoard({ name: X('Cardboard screen') }), 0, -0.62); scr.g.rotation.y = Math.PI / 2; scr.g.scale.set(1.2, 0.8, 1); scr.home = { p: scr.g.position.clone(), q: scr.g.quaternion.clone() };
      const place = (it, side, deg) => { const a = (deg * Math.PI) / 180; const d = V(K, side * Math.sin(a), 0, Math.cos(a)); const o0 = P.clone().addScaledVector(d, 0.06); it.g.position.set(o0.x, BENCH_Y + 0.0008, o0.z); it.g.rotation.set(0, Math.atan2(-d.z, d.x), 0); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; it.deg = deg; };
      const p1 = K.add(K.M2.soundPipe({ len: 0.38 }), 0, -0.6), p2 = K.add(K.M2.soundPipe({ len: 0.38 }), 0, -0.6); place(p1, -1, 40); place(p2, 1, 20);
      const a1 = (40 * Math.PI) / 180; const ce = P.clone().addScaledVector(V(K, -Math.sin(a1), 0, Math.cos(a1)), 0.47); const ck = K.add(K.M2.tickClock(), ce.x, ce.z); ck.audio = K.app.audio;
      K.solver(() => { const r = p2.deg; ck.gain = 0.12 * Math.exp(-(((r - 40) / 7) ** 2)) + 0.006; });
      return { bd, scr, p1, p2, ck, P, place };
    },
    steps: [
      { do: X('Put the two pipes on the table pointing at the hard board, with a screen between them. Place the ticking clock at the end of the first pipe, at 40° to the normal.'), target: 'ck', act: async (K, o) => { o.ck.on = true; await K.sleep(1.4); }, ev: { type: 'look' },
        see: X('The clock ticks at the open end of the first pipe; the screen stops the sound from reaching the other pipe directly.') },
      { do: X('Put your ear at the end of the second pipe, at 20° to the normal, and listen.'), target: 'p2', act: async (K, o) => { await K.sleep(1.6); await tag(K, o.p2, `${o.p2.deg}°: ${tl(K, X('faint'))}`, 2, 0.08); }, ev: { type: 'look' },
        see: X('The ticking is very faint.') },
      { do: X('Turn the second pipe slowly until the ticking is loudest.'), target: 'p2', act: async (K, o) => { for (const d of [26, 32, 36, 40, 44, 48, 44, 40]) { const q0 = o.p2.g.quaternion.clone(); const p0 = o.p2.g.position.clone(); o.place(o.p2, 1, d); const q1 = o.p2.g.quaternion.clone(), p1 = o.p2.g.position.clone(); o.p2.g.quaternion.copy(q0); o.p2.g.position.copy(p0); await K.tween(0.5, (k) => { o.p2.g.quaternion.slerpQuaternions(q0, q1, ease(k)); o.p2.g.position.lerpVectors(p0, p1, ease(k)); }); await K.sleep(0.6); } await tag(K, o.p2, `40°: ${tl(K, X('loudest'))}`, 2, 0.08); K.lab.emit('turn', { obj: o.p2.id }); }, ev: { type: 'turn' },
        see: X('The ticking is loudest when the second pipe is at about 40° to the normal.') },
      { do: X('Measure the angle of each pipe from the normal to the board.'), target: 'bd', act: (K, o) => K.showTag('∠i = 40°   ∠r = 40°', o.bd.g.position.clone().add(V(K, 0, 0.22, 0)), V(K, 0, 0.05, 0), 3.5), ev: { type: 'look' },
        see: X('The angle of reflection (40°) equals the angle of incidence (40°).'), why: X('Sound is reflected from a hard surface following the same laws as light: ∠i = ∠r, and both rays and the normal lie in one plane.') },
    ],
    eq: { word: 'Laws of reflection of sound', sym: '∠i = ∠r · incident sound, normal and reflected sound in one plane' },
    result: { obs: X('With the clock pipe at 40° to the normal, the ticking was heard loudest through the second pipe when it was also at 40°.'),
      concl: X('Sound is reflected from a hard surface like light: the angle of reflection is equal to the angle of incidence.'),
      safety: X('Keep the clock’s ticking soft; never put anything loud close to your ear.'),
      viva: [{ q: X('What is an echo?'), a: X('A sound heard again after reflection from a distant surface.') }, { q: X('Why are the ceilings of concert halls curved?'), a: X('So that reflected sound spreads evenly to all parts of the hall.') }, { q: X('Which surfaces reflect sound well?'), a: X('Hard, smooth surfaces such as walls and boards.') }] },
  },
];

async function pullPair(K, o, F) { const A = o.A, B = o.B; const F0 = A.load; const pA = A.g.position.clone(); await K.tween(1.2, (k) => { const f = F0 + (F - F0) * k; A.load = f; B.load = f; const e = (0.1 * f) / 5; B.g.position.x = pA.x + 0.35 + 2 * e; }); await K.sleep(0.8); K.lab.emit('pull', { obj: B.id }); }
async function drop(K, o, x, h) {
  const t = o.t, b = o.b; const top = t.g.localToWorld(V(K, x, t.surfY, 0)); const d = 0.015 * Math.sqrt(h); const y0 = top.y + h;
  await K.moveTo(b, V(K, top.x, y0, top.z), new K.THREE.Quaternion(), 1); await K.sleep(0.5); const yEnd = top.y - d * 0.75; const T = Math.sqrt((2 * (y0 - yEnd)) / G);
  await K.tween(T, (k) => { const tt = k * T; b.g.position.y = y0 - 0.5 * G * tt * tt; }); t.crater(x, 0, d, b.r * 1.15); K.app.audio && K.app.audio.burst && K.app.audio.burst(0.2, 300, 0.6, 'lowpass');
  K.lab.emit('drop', { obj: b.id }); await K.sleep(0.8); await K.moveTo(b, V(K, 0.3, BENCH_Y + 0.0008, -0.48), new K.THREE.Quaternion(), 1); b.home = { p: b.g.position.clone(), q: b.g.quaternion.clone() };
}
