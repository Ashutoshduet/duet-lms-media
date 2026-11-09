// Physics experiments, batch 10 (Class 7, Curiosity): time (a water clock, a simple pendulum), light (straight-line travel
// through holes and pipes, transparent / translucent / opaque, shadows, images in a plane mirror, a pinhole camera, beams from
// a comb reflected by a mirror) and the Earth (day and night on a globe).
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C8 = N('Ch 8 · Measurement of Time and Motion', 'अध्याय 8 · समय और गति का मापन', 'Ch 8 · Time aur Motion ka Measurement');
const C11 = N('Ch 11 · Light: Shadows and Reflections', 'अध्याय 11 · प्रकाश: छाया और परावर्तन', 'Ch 11 · Light: Shadows aur Reflections');
const C12 = N('Ch 12 · Earth, Moon, and the Sun', 'अध्याय 12 · पृथ्वी, चंद्रमा और सूर्य', 'Ch 12 · Earth, Moon aur Sun');
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const Q0 = (K) => new K.THREE.Quaternion();
const yawQ = (K, a) => new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), a);
const _S = [X('min'), X('Transparent'), X('Translucent'), X('Opaque'), X('Day'), X('Night'), X('Image'), X('India')];
void _S;
function dim(K, on, keep = []) { const sc = K.app.scene; if (on) { sc.userData.env0 = sc.userData.env0 ?? sc.environmentIntensity; sc.environmentIntensity = 0.05; sc.traverse((l) => { if (l.isLight && !keep.includes(l)) { if (l.userData.i0 == null) l.userData.i0 = l.intensity; l.intensity = l.userData.i0 * 0.1; } }); } else { if (sc.userData.env0 != null) sc.environmentIntensity = sc.userData.env0; sc.traverse((l) => { if (l.isLight && l.userData.i0 != null) { l.intensity = l.userData.i0; l.userData.i0 = null; } }); } }
const undim = (K) => K.extras.push({ get parent() { dim(K, false); return null; } });
async function swing(K, p, deg) { p.free = false; const a0 = p.th, a1 = (-deg * Math.PI) / 180; await K.tween(0.9, (k) => { p.th = a0 + (a1 - a0) * k; }); p.om = 0; await K.sleep(0.3); p.free = true; }
async function timeN(K, o, n) { const p = o.p, sw = o.sw; sw.reset(); const c0 = p.osc; await until(K, () => p.osc > c0, 10); sw.start(); const s0 = p.osc; const l0 = K.app.chem.lapse; K.app.chem.lapse = 6; K.app.lapseShown = 6; await until(K, () => p.osc >= s0 + n, 60); sw.stop(); K.app.chem.lapse = l0; K.app.lapseShown = 0; sw.t += (Math.random() - 0.5) * 0.1; return sw.read(); }
async function stopBob(K, p) { p.free = false; const a0 = p.th; await K.tween(0.8, (k) => { p.th = a0 * (1 - k); }); p.om = 0; }

export const EXPERIMENTS_P10 = [
  {
    id: 'p7_water_clock', subj: 'physics', cls: 7, ch: C8, title: X('Making a water clock'),
    aim: X('To make a simple water clock and mark it in minutes.'),
    kind: X('Measuring time with dripping water'),
    setup(K) { const wc = K.add(K.M6.waterClock(), -0.06, -0.62); const sw = K.add(K.MC.stopwatch(), 0.16, -0.5); return { wc, sw }; },
    steps: [
      { do: X('Water drips through a tiny hole in the cap of the upside-down bottle into the jar. Start the dripping and the stopwatch together.'), target: 'wc', act: async (K, o) => { o.wc.running = true; o.sw.reset(); o.sw.start(); await K.sleep(1.4); }, ev: { type: 'look' }, see: X('Drops fall steadily into the jar.') },
      { do: X('Mark the water level on the paper strip every minute for 5 minutes (time-lapse).'), target: 'wc', act: async (K, o) => { const l0 = K.app.chem.lapse; K.app.chem.lapse = 20; K.app.lapseShown = 20; for (let m = 1; m <= 5; m++) { await until(K, () => o.sw.t >= m * 60, 30); o.wc.mark(`${m}`); K.app.audio && K.app.audio.tone && K.app.audio.tone(1500, 0.05, 0.05, 'square'); } K.app.chem.lapse = l0; K.app.lapseShown = 0; o.sw.stop(); o.wc.running = false; K.lab.emit('mark', { obj: o.wc.id }); }, ev: { type: 'mark' },
        see: X('The marks are not equally spaced: they come closer together as time goes on.'), why: X('With less water left in the bottle, it pushes less hard and drips more slowly. A water clock has to be marked against a clock first.') },
      { do: X('Empty the jar and use the marks to time something, such as how long a friend takes to read a page.'), target: 'wc', act: (K, o) => tag(K, o.wc, `1 … 5 ${tl(K, X('min'))}`, 2.4, 0.3), ev: { type: 'look' },
        see: X('The water level reaching a mark tells you how many minutes have passed.') },
    ],
    eq: { word: 'Water clock', sym: 'equal amounts of time ↔ marks made against a clock (the flow slows down as the bottle empties)' },
    result: { obs: X('The water level in the jar rose minute by minute; the marks got closer together as the bottle emptied.'),
      concl: X('A steady process such as dripping water can be used to measure time once it is marked against a clock.'),
      safety: X('Use a stable stand so that the bottle does not fall; wipe up spilled water.'),
      viva: [{ q: X('Why do the marks get closer together?'), a: X('The water flows more slowly as the level in the bottle falls.') }, { q: X('Name another old way of measuring time.'), a: X('A sundial, a sand clock (hourglass) or a candle clock.') }, { q: X('What is the SI unit of time?'), a: X('The second (s).') }] },
  },
  {
    id: 'p7_pendulum', subj: 'physics', cls: 7, ch: C8, title: X('The time period of a pendulum'),
    aim: X('To measure the time period of a simple pendulum and see how it depends on the length of the thread.'),
    kind: X('Simple pendulum'),
    setup(K) { const p = K.add(K.MC.pendulum({ L: 1 }), -0.05, -0.45); p.camView = { p: V(K, 0.32, -0.12, 1.85), t: V(K, 0, -0.3, 0.12) }; const sw = K.add(K.MC.stopwatch(), 0.22, -0.5); return { p, sw }; },
    steps: [
      { do: X('The pendulum is 100 cm long. Pull the bob a little to one side, let it go and time 10 oscillations.'), target: 'p', act: async (K, o) => { await swing(K, o.p, 6); const t = await timeN(K, o, 10); o.T1 = t / 10; await tag(K, o.sw, `10 × : ${t.toFixed(1)} s → T ≈ ${o.T1.toFixed(1)} s`, 2.6, 0.04); K.lab.emit('swing', { obj: o.p.id }); }, ev: { type: 'swing' },
        see: X('10 oscillations take about 20 s, so one oscillation takes about 2 s.') },
      { do: X('Shorten the thread to 50 cm and time 10 oscillations again.'), target: 'p', act: async (K, o) => { await stopBob(K, o.p); const L0 = o.p.L; await K.tween(1.2, (k) => o.p.setL(L0 + (0.5 - L0) * k)); await swing(K, o.p, 6); const t = await timeN(K, o, 10); await tag(K, o.sw, `10 × : ${t.toFixed(1)} s → T ≈ ${(t / 10).toFixed(1)} s`, 2.6, 0.04); K.lab.emit('swing', { obj: o.p.id }); }, ev: { type: 'swing' },
        see: X('Now 10 oscillations take only about 14 s: the shorter pendulum swings faster.') },
      { do: X('Use a heavier bob, keeping the length 50 cm, and time it again.'), target: 'p', act: async (K, o) => { await stopBob(K, o.p); o.p.setBob(0.016, 0.2, 0x9aa0a6); await swing(K, o.p, 6); const t = await timeN(K, o, 10); await tag(K, o.sw, `10 × : ${t.toFixed(1)} s → T ≈ ${(t / 10).toFixed(1)} s`, 2.6, 0.04); await stopBob(K, o.p); K.lab.emit('swing', { obj: o.p.id }); }, ev: { type: 'swing' },
        see: X('The time is the same: about 1.4 s for each oscillation.'), why: X('The time period of a pendulum depends on its length, not on the mass of the bob. This is why pendulums were used in clocks.') },
    ],
    eq: { word: 'Time period', sym: 'T = time for 10 oscillations ÷ 10 · L = 100 cm: T ≈ 2 s · L = 50 cm: T ≈ 1.4 s' },
    result: { obs: X('With a 100 cm thread T ≈ 2 s; with 50 cm T ≈ 1.4 s; a heavier bob did not change T.'),
      concl: X('The time period of a simple pendulum depends on its length (longer → slower) but not on the mass of the bob.'),
      safety: X('Keep the swing small and clear of other people.'),
      viva: [{ q: X('What is one oscillation?'), a: X('One complete to-and-fro swing.') }, { q: X('Why time 10 oscillations and not one?'), a: X('It reduces the error of starting and stopping the watch.') }, { q: X('How can a pendulum clock be made to go slower?'), a: X('Make its pendulum longer.') }] },
  },
  {
    id: 'p7_matchboxes', subj: 'physics', cls: 7, ch: C11, title: X('Light travels in a straight line'),
    aim: X('To show that light travels in a straight line, using three matchboxes with holes.'),
    kind: X('Rectilinear propagation of light'),
    setup(K) { const b = [0, 1, 2].map((i) => K.add(K.M6.holeBox(), 0, -0.42 - i * 0.14)); const cd = K.add(K.A3.candle({ h: 0.032 }), 0, -0.86); b[0].camView = { p: V(K, 0, 0.05, 0.06), t: V(K, 0, 0.05, -0.5) }; return { b0: b[0], b1: b[1], b2: b[2], cd }; },
    steps: [
      { do: X('Light the candle. Arrange the three matchboxes so that their holes are in a straight line, and look through the first hole.'), target: 'cd', act: async (K, o) => { o.cd.setLit(true); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); await K.sleep(2.6); }, ev: { type: 'look' }, see: X('You can see the candle flame through the three holes.') },
      { do: X('Move the middle matchbox a little to one side and look again.'), target: 'b1', act: async (K, o) => { const p = o.b1.g.position; await K.moveTo(o.b1, V(K, p.x + 0.02, p.y, p.z), null, 0.8); await K.sleep(2.4); }, ev: { type: 'look' },
        see: X('Now the flame cannot be seen.'), why: X('Light travels in straight lines. When the holes are not in one straight line, the middle box blocks the light.') },
      { do: X('Put the middle box back in line.'), target: 'b1', act: async (K, o) => { await K.home(o.b1, 0.8); await K.sleep(2); o.b0.camView = null; }, ev: { type: 'look' }, see: X('The flame can be seen again.') },
    ],
    eq: { word: 'Light travels in straight lines', sym: 'holes in a straight line → light passes · out of line → blocked' },
    result: { obs: X('The flame was visible only when the three holes were in a straight line.'),
      concl: X('Light travels in a straight line.'),
      safety: X('Keep the boxes and your hair away from the flame.'),
      viva: [{ q: X('Name one everyday observation that shows light travels in straight lines.'), a: X('The straight beams of sunlight through gaps in a roof, or the beam of a torch.') }, { q: X('What happens if one box is out of line?'), a: X('The flame cannot be seen.') }, { q: X('Can we see round corners?'), a: X('No, because light travels in straight lines.') }] },
  },
  {
    id: 'p7_pipe_view', subj: 'physics', cls: 7, ch: C11, title: X('Looking through a straight and a bent pipe'),
    aim: X('To see that light from a candle reaches the eye through a straight pipe but not through a bent one.'),
    kind: X('Light travels in a straight line'),
    setup(K) { const sp = K.add(K.M6.lookPipe(false), 0, -0.86); const bp = K.add(K.M6.lookPipe(true), 0.3, -0.5); const cd = K.add(K.A3.candle({ h: 0.03 }), 0, -0.9); sp.camView = { p: V(K, 0, 0.05, 0.38), t: V(K, 0, 0.05, -0.1) }; return { sp, bp, cd }; },
    steps: [
      { do: X('Light the candle and look at it through the straight pipe.'), target: 'sp', act: async (K, o) => { o.cd.setLit(true); await K.sleep(2.6); }, ev: { type: 'look' }, see: X('You can see the flame at the end of the pipe.') },
      { do: X('Now replace it with the bent pipe and look again.'), target: 'bp', act: async (K, o) => { o.sp.camView = null; await K.moveTo(o.sp, V(K, -0.3, BENCH_Y + 0.0008, -0.5), null, 0.9); await K.moveTo(o.bp, V(K, 0, BENCH_Y + 0.0008, -0.86), yawQ(K, -Math.PI / 2), 1); o.bp.camView = { p: V(K, -0.25, 0.05, 0.186), t: V(K, 0.1, 0.05, 0.186) }; await K.sleep(2.6); o.bp.camView = null; }, ev: { type: 'look' },
        see: X('You cannot see the flame through the bent pipe.'), why: X('Light travels in straight lines, so it cannot follow the bend of the pipe.') },
    ],
    eq: { word: 'Straight-line travel of light', sym: 'straight pipe: flame seen · bent pipe: not seen' },
    result: { obs: X('The flame was seen through the straight pipe but not through the bent pipe.'),
      concl: X('Light travels in straight lines; it does not bend round corners by itself.'),
      safety: X('Keep the pipe away from the flame.'),
      viva: [{ q: X('Why could you not see the flame through the bent pipe?'), a: X('Light travels in straight lines and cannot follow the bend.') }, { q: X('How can light be made to go round a bend?'), a: X('With mirrors (or optical fibres, which reflect it many times).') }, { q: X('What would you see through a straight pipe pointed away from the candle?'), a: X('Not the flame.') }] },
  },
  {
    id: 'p7_transparency', subj: 'physics', cls: 7, ch: C11, title: X('Transparent, translucent and opaque'),
    aim: X('To find out how much light passes through different materials.'),
    kind: X('Transparent, translucent and opaque materials'),
    setup(K) { const br = K.add(K.M6.beamRig(), 0, -0.4); const g = K.add(K.M6.sheetOnFoot('glass'), 0.24, -0.5), b = K.add(K.M6.sheetOnFoot('butter'), 0.24, -0.64), c = K.add(K.M6.sheetOnFoot('card'), 0.24, -0.78); br.camView = { p: V(K, 0.35, 0.2, -0.05), t: V(K, 0, 0.06, -0.4) }; return { br, g, b, c }; },
    steps: [
      { do: X('Switch on the torch and shine it on the white screen.'), target: 'br', act: async (K, o) => { o.br.on = true; o.br.pass = 1; o.br.diffuse = 0; await K.sleep(1.6); }, ev: { type: 'look' }, see: X('A bright round patch of light falls on the screen.') },
      ...[['g', 'Transparent'], ['b', 'Translucent'], ['c', 'Opaque']].map(([k, nm], i) => ({ do: X(['Hold the glass sheet in the path of the light.', 'Now hold the butter paper in the path.', 'Now hold the piece of cardboard in the path.'][i]), target: k,
        act: async (K, o) => { const prev = ['g', 'b', 'c'][i - 1]; if (prev) await K.home(o[prev], 0.7); const m = o.br.mid(); await K.moveTo(o[k], V(K, m.x, BENCH_Y + 0.0008, m.z), Q0(K), 1); o.br.pass = o[k].pass; o.br.diffuse = o[k].diffuse; await K.sleep(1.6); await tag(K, o[k], tl(K, X(nm)), 2, 0.14); if (i === 2) { await K.home(o[k], 0.7); o.br.pass = 1; o.br.diffuse = 0; } }, ev: { type: 'look' },
        see: X(['The patch on the screen is just as bright: almost all the light passes through glass.', 'The patch is dimmer and blurred: only some light passes through.', 'There is no patch at all, only a shadow: no light passes through.'][i]), ...(i === 2 ? { why: X('Materials that let almost all light through are transparent, those that let some light through are translucent, and those that let no light through are opaque.') } : {}) })),
    ],
    eq: { word: 'Materials and light', sym: 'transparent (glass) · translucent (butter paper) · opaque (cardboard)' },
    result: { obs: X('The patch of light stayed bright with glass, became dim and blurred with butter paper, and disappeared with cardboard.'),
      concl: X('Glass is transparent, butter paper is translucent and cardboard is opaque.'),
      safety: X('Do not shine the torch into anyone’s eyes.'),
      viva: [{ q: X('Is frosted glass transparent or translucent?'), a: X('Translucent.') }, { q: X('Which kind of material forms a shadow?'), a: X('An opaque material.') }, { q: X('Give an example of a translucent material.'), a: X('Butter paper, frosted glass, oiled paper, thin cloth.') }] },
  },
  {
    id: 'p7_shadows', subj: 'physics', cls: 7, ch: C11, title: X('How shadows change'),
    aim: X('To see how the size of a shadow changes with the positions of the light, the object and the screen.'),
    kind: X('Shadows'),
    setup(K) { const lp = K.add(K.M6.shadowLamp(), 0, -0.36); const bs = K.add(K.M6.ballOnStand(), 0, -0.56); const sc = K.add(K.M6.bigScreen(), 0, -0.86); undim(K); lp.camView = { p: V(K, 0.4, 0.25, -0.05), t: V(K, 0, 0.1, -0.5) }; return { lp, bs, sc }; },
    steps: [
      { do: X('Darken the room and switch on the small lamp. A ball on a stand is between the lamp and the screen.'), target: 'lp', act: async (K, o) => { dim(K, true, [o.lp.light]); o.lp.setOn(true); await K.sleep(2.2); }, ev: { type: 'look' }, see: X('A dark round shadow of the ball forms on the screen.'), why: X('The opaque ball blocks the light travelling in straight lines, leaving a dark region behind it.') },
      { do: X('Move the ball closer to the lamp.'), target: 'bs', act: async (K, o) => { const p = o.bs.g.position; await K.moveTo(o.bs, V(K, p.x, p.y, -0.44), null, 1.2); await K.sleep(1.6); }, ev: { type: 'look' }, see: X('The shadow becomes much bigger (and less sharp).') },
      { do: X('Now move the ball close to the screen.'), target: 'bs', act: async (K, o) => { const p = o.bs.g.position; await K.moveTo(o.bs, V(K, p.x, p.y, -0.8), null, 1.4); await K.sleep(1.8); o.lp.setOn(false); dim(K, false); o.lp.camView = null; }, ev: { type: 'look' },
        see: X('The shadow becomes smaller, nearly the size of the ball, and sharper.'), why: X('Rays from the lamp spread out from it in straight lines; the nearer the object is to the light, the more of them it blocks and the bigger its shadow.') },
    ],
    eq: { word: 'A shadow needs', sym: 'a source of light + an opaque object + a screen' },
    result: { obs: X('The shadow of the ball grew larger as the ball moved towards the lamp and became smaller and sharper as it moved towards the screen.'),
      concl: X('A shadow forms when an opaque object blocks light. Its size depends on the distances between the light, the object and the screen.'),
      safety: X('Do not touch the hot lamp.'),
      viva: [{ q: X('What three things are needed to see a shadow?'), a: X('A source of light, an opaque object and a screen.') }, { q: X('Does a shadow show the colour of the object?'), a: X('No, shadows are always dark.') }, { q: X('When is your shadow shortest on a sunny day?'), a: X('At noon, when the Sun is highest.') }] },
  },
  {
    id: 'p7_plane_mirror', subj: 'physics', cls: 7, ch: C11, title: X('Images in a plane mirror'),
    aim: X('To study the image formed by a plane mirror: its size, whether it is upright, its distance and lateral inversion.'),
    kind: X('Plane mirror image'),
    setup(K) { const pm = K.add(K.O2.planeMirror(), 0, -0.72); pm.g.scale.set(2.5, 4, 1); const cd = K.add(K.A3.candle({ h: 0.06 }), 0, -0.62); const sc = K.add(K.MC.scale30(), 0.06, -0.567); sc.update = () => {}; sc.pivot.position.y = 0.0016; sc.pivot.rotation.z = 0; sc.g.rotation.y = -Math.PI / 2; sc.home = { p: sc.g.position.clone(), q: sc.g.quaternion.clone() }; const lc = K.add(K.M6.letterCard('R'), 0.24, -0.48); pm.camView = { p: V(K, 0.16, 0.16, 0.36), t: V(K, 0, 0.05, 0) }; return { pm, cd, sc, lc }; },
    steps: [
      { do: X('Stand the plane mirror upright and light a candle 10 cm in front of it. Look at the image.'), target: 'cd', act: async (K, o) => { o.cd.setLit(true); await K.sleep(2.4); await tag(K, o.pm, `${tl(K, X('Image'))}: ↑`, 1.8, 0.12); }, ev: { type: 'look' }, see: X('The image of the candle is upright and the same size as the candle.') },
      { do: X('Look at the scale lying in front of the mirror and its image.'), target: 'sc', act: (K, o) => tag(K, o.sc, '10 cm ↔ 10 cm', 2.6, 0.06), ev: { type: 'look' },
        see: X('The image appears as far behind the mirror as the candle is in front of it (10 cm).') },
      { do: X('Hold the card with the letter R in front of the mirror.'), target: 'lc', act: async (K, o) => { o.cd.setLit(false); await K.moveTo(o.cd, V(K, -0.22, BENCH_Y + 0.0008, -0.5), null, 0.8); await K.moveTo(o.lc, V(K, 0.0, BENCH_Y + 0.0008, -0.62), Q0(K), 1); await K.sleep(2.6); o.pm.camView = null; }, ev: { type: 'look' },
        see: X('In the mirror the letter appears reversed left to right.'), why: X('In a plane mirror the left side of the object appears on the right side of the image: this is lateral inversion.') },
    ],
    eq: { word: 'Image in a plane mirror', sym: 'upright · same size · as far behind as the object is in front · laterally inverted · virtual' },
    result: { obs: X('The image of the candle was upright, of the same size and as far behind the mirror as the candle was in front; the letter R looked reversed.'),
      concl: X('A plane mirror forms an upright, virtual image of the same size, as far behind the mirror as the object is in front of it, and laterally inverted.'),
      safety: X('Handle the mirror carefully; keep the flame away from the card.'),
      viva: [{ q: X('Why is AMBULANCE written in reverse on ambulances?'), a: X('So that drivers ahead read it correctly in their rear-view mirrors.') }, { q: X('Can the image in a plane mirror be caught on a screen?'), a: X('No, it is a virtual image.') }, { q: X('If you move 1 m towards a mirror, how much closer does your image come to you?'), a: X('2 m.') }] },
  },
  {
    id: 'p7_pinhole', subj: 'physics', cls: 7, ch: C11, title: X('Image through a pinhole'),
    aim: X('To form the image of a candle flame through a pinhole on a screen.'),
    kind: X('Pinhole camera'),
    setup(K) { const b = K.bench(0, -0.64); const ph = K.onBench(K.OP.pinholeOnStand(), b, 50); const cd = K.onBench(K.A3.candle({ h: 0.135 }), b, 35); cd.lightSource = true; cd.objH = 0.03; cd.objY = 0.139 - K.OP.AXIS_Y; const sc = K.onBench(K.OP.screenOnStand(), b, 65); sc.g.rotation.y = 0.6; sc.home = { p: sc.g.position.clone(), q: sc.g.quaternion.clone() }; sc.camView = { p: V(K, -0.2, 0.2, 0.15), t: V(K, -0.04, 0.155, 0) }; undim(K); return { b, ph, cd, sc }; },
    steps: [
      { do: X('Light the candle 15 cm in front of the card with a pinhole. Darken the room and look at the screen 15 cm behind the pinhole.'), target: 'sc', act: async (K, o) => { o.cd.setLit(true); dim(K, true); await K.sleep(2.4); }, ev: { type: 'look' },
        see: X('A small upside-down image of the flame appears on the screen.'), why: X('Light from the top of the flame goes in a straight line through the pinhole to the bottom of the screen, and light from the bottom goes to the top. So the image is inverted.') },
      { do: X('Move the screen farther from the pinhole.'), target: 'sc', act: async (K, o) => { await K.slide(o.sc, 85, 1.6); await K.sleep(2.2); dim(K, false); o.sc.camView = null; }, ev: { type: 'slide' },
        see: X('The image becomes bigger and dimmer, but stays sharp and upside down.'), why: X('This is how a pinhole camera works; the eye and the camera work on a similar idea, with a lens instead of a pinhole.') },
    ],
    eq: { word: 'Pinhole image', sym: 'inverted · size ∝ distance of the screen from the pinhole' },
    result: { obs: X('An inverted image of the candle flame formed on the screen; it became larger and dimmer as the screen was moved away.'),
      concl: X('Because light travels in straight lines, a pinhole forms an inverted image of a bright object on a screen.'),
      safety: X('Keep the candle flame away from the card and paper.'),
      viva: [{ q: X('Why is the image inverted?'), a: X('Rays from the top and bottom of the object cross at the pinhole.') }, { q: X('What happens if the hole is made bigger?'), a: X('The image becomes brighter but blurred.') }, { q: X('Where do we see pinhole images in nature?'), a: X('Round spots of sunlight under a tree are pinhole images of the Sun.') }] },
  },
  {
    id: 'p7_comb_beams', subj: 'physics', cls: 7, ch: C11, title: X('Beams of light reflected by a mirror'),
    aim: X('To observe narrow beams of light being reflected by a plane mirror.'),
    kind: X('Reflection of light'),
    setup(K) { const bd = K.add(K.L2.opticsDisc({ disc: false }), 0, -0.64); const pm = K.add(K.L2.mirrorStrip('plane', { len: 0.12 }), 0.32, -0.46); const rb = K.add(K.L2.rayBox2({ slits: 3 }), 0.32, -0.8); const tr = new K.L2.BeamTracer(K.app.scene, bd); tr.items = [pm]; tr.boxes = [rb]; K.solver(() => tr.update()); K.extras.push({ get parent() { tr.dispose(); return null; } }); return { bd, pm, rb }; },
    steps: [
      { do: X('Switch on the ray box: light comes out through its narrow slits (like a torch shining through a comb) and runs across the black sheet as thin beams.'), target: 'rb', act: async (K, o) => { const w = o.bd.g.localToWorld(o.bd.toLocal(-0.17, -0.06)); await K.moveTo(o.rb, w, yawQ(K, 0.3), 1); o.rb.setOn(true); await K.sleep(1.4); }, ev: { type: 'look' }, see: X('Thin parallel beams of light cross the sheet.') },
      { do: X('Stand the mirror in the path of the beams, at a slant.'), target: 'pm', act: async (K, o) => { const w = o.bd.g.localToWorld(o.bd.toLocal(0.07, 0.01)); await K.moveTo(o.pm, w, yawQ(K, Math.PI / 2 - 0.5), 1); await K.sleep(1.8); }, ev: { type: 'look' },
        see: X('The beams bounce off the mirror and go off in another direction, still parallel.'), why: X('A smooth shiny surface reflects light. Reflection changes the direction of the light.') },
    ],
    eq: { word: 'Reflection', sym: 'a mirror changes the direction of light' },
    result: { obs: X('The thin beams from the slits were reflected by the mirror into a new direction.'),
      concl: X('A plane mirror reflects light, changing its direction.'),
      safety: X('Do not look straight into the light of the ray box.'),
      viva: [{ q: X('What is reflection of light?'), a: X('The bouncing back of light from a surface.') }, { q: X('Which surfaces reflect light best?'), a: X('Smooth, shiny surfaces such as mirrors.') }, { q: X('How does a periscope use reflection?'), a: X('Two mirrors reflect light so that you can see over obstacles.') }] },
  },
  {
    id: 'p7_globe', subj: 'physics', cls: 7, ch: C12, title: X('Day and night on a globe'),
    aim: X('To model day and night with a globe and a torch.'),
    kind: X('Rotation of the Earth'),
    setup(K) { const gl = K.add(K.M6.globe(), 0, -0.62); const lp = K.add(K.M6.shadowLamp({ size: 0.01, name: X('Torch (the Sun)') }), -0.45, -0.62); lp.g.rotation.y = -Math.PI / 2; lp.home = { p: lp.g.position.clone(), q: lp.g.quaternion.clone() }; lp.light.angle = 0.5; undim(K); gl.camView = { p: V(K, 0.0, 0.25, 0.45), t: V(K, 0, 0.16, 0) }; gl.setRot(-1.2); return { gl, lp }; },
    steps: [
      { do: X('Darken the room and shine the torch (the Sun) on the globe.'), target: 'lp', act: async (K, o) => { dim(K, true, [o.lp.light]); o.lp.setOn(true); await K.sleep(2); await tag(K, o.gl, `${tl(K, X('India'))}: ${tl(K, X(dayAt(K, o) ? 'Day' : 'Night'))}`, 2, 0.3); }, ev: { type: 'look' },
        see: X('Only the half of the globe facing the torch is lit; the other half is dark.') },
      { do: X('Turn the globe slowly from west to east and watch India.'), target: 'gl', act: async (K, o) => { let last = null; const a0 = o.gl.rot; await K.tween(9, (k) => { o.gl.setRot(a0 + k * Math.PI * 2); const d = dayAt(K, o); if (d !== last) { last = d; K.showTag(`${tl(K, X('India'))}: ${tl(K, X(d ? 'Day' : 'Night'))}`, o.gl.indiaWorld(), V(K, 0.06, 0.06, 0), 1.6); } }); o.lp.setOn(false); dim(K, false); o.gl.camView = null; K.lab.emit('turn', { obj: o.gl.id }); }, ev: { type: 'turn' },
        see: X('India moves from the lit half into the dark half and back again: day, evening, night and morning.'), why: X('The Earth spins on its axis from west to east once in about 24 hours. The half facing the Sun has day; the other half has night. That is why the Sun appears to rise in the east.') },
    ],
    eq: { word: 'Day and night', sym: 'Earth rotates west → east once in ≈ 24 h · half facing the Sun: day' },
    result: { obs: X('Half the globe was lit by the torch; as the globe turned, India passed from day into night and back.'),
      concl: X('Day and night are caused by the rotation of the Earth on its axis.'),
      safety: X('Turn the globe gently by its stand.'),
      viva: [{ q: X('In which direction does the Earth rotate?'), a: X('From west to east.') }, { q: X('How long does one rotation take?'), a: X('About 24 hours.') }, { q: X('Why does the Sun seem to rise in the east?'), a: X('Because the Earth turns from west to east.') }] },
  },
];
// is the marked place on the globe facing the torch?
function dayAt(K, o) { const p = o.gl.indiaWorld(); const c = o.gl.spin.getWorldPosition(V(K, 0, 0, 0)); const n = p.clone().sub(c).normalize(); const l = o.lp.g.position.clone().sub(c).setY(0).normalize(); return n.dot(l) > 0; }
void Q0;
