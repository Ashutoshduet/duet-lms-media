// Physics experiments, batch 8 (Class 8, Curiosity): light (images in a spoon, laws of reflection on a ray-optics disc, parallel
// beams on plane / concave / convex mirrors and through a glass block and lenses, burning paper with a lens in sunlight, a water-drop
// lens) and the sky (the phases of the Moon with a lamp and a ball, the shadow of a stick through the day).
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C10 = N('Ch 10 · Light: Mirrors and Lenses', 'अध्याय 10 · प्रकाश: दर्पण और लेंस', 'Ch 10 · Light: Mirrors aur Lenses');
const C11 = N('Ch 11 · Keeping Time with the Skies', 'अध्याय 11 · आकाश के साथ समय का हिसाब', 'Ch 11 · Keeping Time with the Skies');
const D = Math.PI / 180;
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const yawQ = (K, a) => new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), a);
const _S = [X('Inner side: the image is upside down'), X('Outer side: the image is upright and smaller'), X('New moon'), X('Crescent'), X('First quarter'), X('Gibbous'), X('Full moon'), X('Last quarter'), X('Shortest shadow'), X('local noon')];
void _S;
// put a ray box on the board at paper point (u, v), pointing in the direction of angle a (radians, on the paper)
async function boxTo(K, o, u, v, a, dur = 1) { const w = o.bd.g.localToWorld(o.bd.toLocal(u, v)); await K.moveTo(o.rb, V(K, w.x, w.y, w.z), yawQ(K, a), dur); o.rb.home = { p: o.rb.g.position.clone(), q: o.rb.g.quaternion.clone() }; }
async function optOn(K, o, it, u, v, a = 0) { const w = o.bd.g.localToWorld(o.bd.toLocal(u, v)); await K.moveTo(it, w, yawQ(K, a), 1); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; K.lab.emit('place', { obj: it.id }); await K.sleep(1.2); }
async function optOff(K, it, x, z) { await K.moveTo(it, V(K, x, BENCH_Y + 0.0008, z), null, 0.9); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; }
function tracer(K, bd, items, boxes) { const t = new K.L2.BeamTracer(K.app.scene, bd); t.items = items; t.boxes = boxes; K.solver(() => t.update()); K.extras.push({ get parent() { t.dispose(); return null; } }); return t; }
// dim the lab lights (as when the curtains are drawn) and bring them back
function dim(K, on, keep = []) { const sc = K.app.scene; if (on) { sc.userData.env0 = sc.userData.env0 ?? sc.environmentIntensity; sc.environmentIntensity = 0.04; sc.traverse((l) => { if (l.isLight && !keep.includes(l)) { if (l.userData.i0 == null) l.userData.i0 = l.intensity; l.intensity = l.userData.i0 * 0.07; } }); } else { if (sc.userData.env0 != null) sc.environmentIntensity = sc.userData.env0; sc.traverse((l) => { if (l.isLight && l.userData.i0 != null) { l.intensity = l.userData.i0; l.userData.i0 = null; } }); } }

export const EXPERIMENTS_P8 = [
  {
    id: 'p8_spoon', subj: 'physics', cls: 8, ch: C10, title: X('Images in a shiny spoon'),
    aim: X('To observe the images formed by the inner (concave) and outer (convex) surfaces of a shiny steel spoon.'),
    kind: X('Curved mirrors: concave and convex'),
    setup(K) { const sp = K.add(K.L2.spoon(), -0.02, -0.7, { y: BENCH_Y + 0.13 }); const toy = K.add(K.L2.toyDoll(), 0.09, -0.42); sp.camView = { p: V(K, 0.0, 0.03, 0.3), t: V(K, 0, 0, 0) }; return { sp, toy }; },
    steps: [
      { do: X('Hold the spoon upright with its inner (curved-in) side facing you, at arm’s length, and look at the image of the toy and the room in it.'), target: 'sp', act: async (K, o) => { o.sp.capture(K.app.renderer, K.app.scene); await K.sleep(2.2); await tag(K, o.sp, tl(K, X('Inner side: the image is upside down')), 2.6, 0.06); }, ev: { type: 'look' },
        see: X('In the inner side the image of the toy and the room is upside down.'), why: X('The inner surface of the spoon is a concave mirror. For things far from it, a concave mirror forms an inverted image.') },
      { do: X('Turn the spoon round and look into its outer (bulging) side.'), target: 'sp', act: async (K, o) => { const q0 = o.sp.g.quaternion.clone(); const q1 = yawQ(K, Math.PI); await K.tween(1.2, (k) => o.sp.g.quaternion.slerpQuaternions(q0, q1, k)); o.sp.capture(K.app.renderer, K.app.scene); await K.sleep(2); await tag(K, o.sp, tl(K, X('Outer side: the image is upright and smaller')), 2.6, 0.06); K.lab.emit('turn', { obj: o.sp.id }); }, ev: { type: 'turn' },
        see: X('In the outer side the image is upright and smaller, and you see more of the room.'), why: X('The outer surface is a convex mirror. It always forms an upright, diminished image and shows a wider view.') },
    ],
    eq: { word: 'Spherical mirrors', sym: 'concave (curved in) · convex (bulging out)' },
    result: { obs: X('The inner side of the spoon showed an upside-down image of the toy; the outer side showed an upright, smaller image with a wider view.'),
      concl: X('A spoon’s inner surface acts as a concave mirror and its outer surface as a convex mirror; they form different kinds of images.'),
      safety: X('Use a clean, shiny spoon; do not use a spoon with sharp edges.'),
      viva: [{ q: X('Which side of the spoon is a convex mirror?'), a: X('The outer (bulging) side.') }, { q: X('Where are convex mirrors used?'), a: X('As rear-view mirrors in vehicles and at sharp road bends.') }, { q: X('Where are concave mirrors used?'), a: X('In torches and headlights, and as shaving or dentists’ mirrors.') }] },
  },
  {
    id: 'p8_reflection_beam', subj: 'physics', cls: 8, ch: C10, title: X('Laws of reflection with a ray of light'),
    aim: X('To verify that the angle of incidence is equal to the angle of reflection, using a narrow beam of light and a plane mirror.'),
    kind: X('Angle of incidence = angle of reflection'),
    setup(K) { const bd = K.add(K.L2.opticsDisc({ cy: 0 }), 0, -0.64); const pm = K.add(K.L2.mirrorStrip('plane', { len: 0.1 }), 0.32, -0.46); const rb = K.add(K.L2.rayBox2(), 0.32, -0.8); const tr = tracer(K, bd, [pm], [rb]); return { bd, pm, rb, tr }; },
    steps: [
      { do: X('Stand the plane mirror strip on the straight line through the centre of the angle disc, its shiny side towards you.'), target: 'pm', act: (K, o) => optOn(K, o, o.pm, 0, 0, 0), ev: { type: 'place' }, see: X('The mirror stands on the 90° line; the dashed line N is the normal at its middle.') },
      ...[30, 45, 60].map((i, k) => ({ do: X(['Switch on the ray box and aim its beam at the centre of the mirror at 30° to the normal. Read the angle of the reflected beam on the disc.', 'Move the ray box so that the beam falls at 45°.', 'Now at 60°.'][k]), target: 'rb',
        act: async (K, o) => { const a = i * D; await boxTo(K, o, -Math.sin(a) * 0.19, -Math.cos(a) * 0.19, Math.atan2(Math.cos(a), Math.sin(a))); o.rb.setOn(true); K.lab.emit('switch', { obj: o.rb.id }); await K.sleep(1.4); const sg = o.tr.segs[1]; let r = i; if (sg) { const d = K.RF.norm(K.RF.sub(sg[1], sg[0])); r = Math.round(Math.acos(Math.abs(d[1])) / D); } await K.showTag(`∠i = ${i}°   ∠r = ${r}°`, o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 2.6); }, ev: { type: 'switch' },
        see: X(['The reflected beam leaves at 30° on the other side of the normal.', 'The reflected beam is at 45°.', 'The reflected beam is at 60°.'][k]), ...(k === 2 ? { why: X('The angle of reflection is always equal to the angle of incidence, and the incident beam, the normal and the reflected beam lie on the same flat surface.') } : {}) })),
    ],
    eq: { word: 'Law of reflection', sym: '∠i = ∠r' },
    result: { obs: X('For angles of incidence of 30°, 45° and 60°, the reflected beam made 30°, 45° and 60° with the normal.'),
      concl: X('The angle of reflection is equal to the angle of incidence.'),
      safety: X('Do not look straight into the ray box; the lamp gets hot.'),
      viva: [{ q: X('What is the normal?'), a: X('A line at right angles to the mirror at the point where the ray strikes it.') }, { q: X('What happens if a ray falls along the normal?'), a: X('It goes straight back along the same path.') }, { q: X('Why is a dark room or black board used?'), a: X('So that the path of the beam can be seen clearly.') }] },
  },
  {
    id: 'p8_beams_mirrors', subj: 'physics', cls: 8, ch: C10, title: X('Parallel beams and curved mirrors'),
    aim: X('To see what plane, concave and convex mirrors do to parallel beams of light.'),
    kind: X('Converging and diverging mirrors'),
    setup(K) { const bd = K.add(K.L2.opticsDisc({ disc: false }), 0, -0.64); const ms = ['plane', 'concave', 'convex'].map((k, i) => K.add(K.L2.mirrorStrip(k, { len: 0.09, R: 0.16 }), 0.3 + i * 0.0, -0.42 - i * 0.07)); const rb = K.add(K.L2.rayBox2({ slits: 3 }), -0.3, -0.84); const tr = tracer(K, bd, ms, [rb]); return { bd, m0: ms[0], m1: ms[1], m2: ms[2], ms, rb, tr }; },
    steps: [
      { do: X('Switch on the ray box with three slits: three parallel beams cross the board.'), target: 'rb', act: async (K, o) => { await boxTo(K, o, 0.0, -0.15, Math.PI / 2); o.rb.setOn(true); K.lab.emit('switch', { obj: o.rb.id }); await K.sleep(1.2); }, ev: { type: 'switch' }, see: X('Three thin parallel beams of light.') },
      ...[0, 1, 2].map((i) => ({ do: X(['Stand the plane mirror strip across the beams.', 'Replace it with the concave mirror strip.', 'Replace it with the convex mirror strip.'][i]), target: ['m0', 'm1', 'm2'][i],
        act: async (K, o) => { if (i) await optOff(K, o.ms[i - 1], 0.3, -0.42 - (i - 1) * 0.07); await optOn(K, o, o.ms[i], 0, 0.05, 0); await K.sleep(1); }, ev: { type: 'place' },
        see: X(['The reflected beams stay parallel.', 'The reflected beams come together (converge) at a point in front of the mirror.', 'The reflected beams spread out (diverge), as if they came from a point behind the mirror.'][i]),
        ...(i === 2 ? { why: X('A concave mirror converges parallel light to its focus; a convex mirror diverges it. A plane mirror keeps the beams parallel.') } : {}) })),
    ],
    eq: { word: 'Mirrors and parallel light', sym: 'plane: parallel · concave: converge (focus) · convex: diverge' },
    result: { obs: X('After reflection the beams stayed parallel for the plane mirror, met at a point for the concave mirror and spread out for the convex mirror.'),
      concl: X('A concave mirror is a converging mirror and a convex mirror is a diverging mirror.'),
      safety: X('Handle the mirror strips by their edges.'),
      viva: [{ q: X('What is the point where the beams meet called?'), a: X('The principal focus of the concave mirror.') }, { q: X('Why does a torch use a concave mirror?'), a: X('With the bulb at its focus, it sends out a parallel, strong beam.') }, { q: X('Which mirror gives a wider view?'), a: X('A convex mirror.') }] },
  },
  {
    id: 'p8_beams_lenses', subj: 'physics', cls: 8, ch: C10, title: X('Parallel beams through lenses'),
    aim: X('To see what a glass block, a convex lens and a concave lens do to parallel beams of light.'),
    kind: X('Converging and diverging lenses'),
    setup(K) { const bd = K.add(K.L2.opticsDisc({ disc: false }), 0, -0.64); const ls = ['slab', 'convex', 'concave'].map((k, i) => K.add(K.L2.cylLens(k), 0.3, -0.42 - i * 0.07)); const rb = K.add(K.L2.rayBox2({ slits: 3 }), -0.3, -0.84); const tr = tracer(K, bd, ls, [rb]); return { bd, l0: ls[0], l1: ls[1], l2: ls[2], ls, rb, tr }; },
    steps: [
      { do: X('Switch on the ray box with three slits.'), target: 'rb', act: async (K, o) => { await boxTo(K, o, -0.18, 0, 0); o.rb.setOn(true); K.lab.emit('switch', { obj: o.rb.id }); await K.sleep(1.2); }, ev: { type: 'switch' }, see: X('Three parallel beams run across the board.') },
      ...[0, 1, 2].map((i) => ({ do: X(['Put the glass block in the path of the beams.', 'Replace it with the convex lens.', 'Replace it with the concave lens.'][i]), target: ['l0', 'l1', 'l2'][i],
        act: async (K, o) => { if (i) await optOff(K, o.ls[i - 1], 0.3, -0.42 - (i - 1) * 0.07); await optOn(K, o, o.ls[i], 0, 0, 0); await K.sleep(1); }, ev: { type: 'place' },
        see: X(['The beams come out still parallel.', 'The beams bend towards each other and meet at a point beyond the lens (its focus), then spread out.', 'The beams spread out after passing through the lens.'][i]),
        ...(i === 2 ? { why: X('A convex lens (thicker in the middle) converges light; a concave lens (thinner in the middle) diverges it.') } : {}) })),
    ],
    eq: { word: 'Lenses and parallel light', sym: 'convex lens: converges to the focus · concave lens: diverges' },
    result: { obs: X('The beams stayed parallel through the glass block, met at a point after the convex lens and spread out after the concave lens.'),
      concl: X('A convex lens is a converging lens and a concave lens is a diverging lens.'),
      safety: X('Handle the glass block and lenses carefully; do not drop them.'),
      viva: [{ q: X('Which lens is thicker in the middle?'), a: X('The convex lens.') }, { q: X('What is the focal length of a lens?'), a: X('The distance from the lens to its principal focus.') }, { q: X('Which lens is used in a magnifying glass?'), a: X('A convex lens.') }] },
  },
  {
    id: 'p8_burn_paper', subj: 'physics', cls: 8, ch: C10, title: X('Focusing sunlight with a convex lens'),
    aim: X('To focus sunlight with a convex lens onto a piece of paper and see that it can burn the paper.'),
    kind: X('A convex lens concentrates light'),
    setup(K) { const pp = K.add(K.L2.burnPaper(), 0.0, -0.6); const ln = K.add(K.L2.handLens(), 0.24, -0.5, { y: BENCH_Y + 0.004 }); K.solver(() => { const p = ln.g.position, q = pp.g.position; if (Math.hypot(p.x - q.x, p.z - q.z) > 0.03) { pp.spot(0, 0); return; } const d = p.y - q.y; const r = (ln.R * Math.abs(d - ln.f)) / ln.f + 0.0014; pp.spot(r, Math.min(1, (ln.R / r) ** 2 / 400)); if (pp.burnt > 0.15 && Math.random() < 0.4) K.fx.puff(q.clone().add(V(K, 0, 0.002, 0)), 0xd8d8d8, { size: 0.008, grow: 0.04, alpha: 0.4, life: 2 }); }); return { pp, ln }; },
    steps: [
      { do: X('In bright sunlight, hold the lens about 5 cm above the paper.'), target: 'ln', act: async (K, o) => { const q = o.pp.g.position; await K.moveTo(o.ln, V(K, q.x, q.y + 0.05, q.z), null, 1.2); await K.sleep(1.4); }, ev: { type: 'look' },
        see: X('A large, round patch of light falls on the paper.') },
      { do: X('Slowly raise the lens until the patch becomes a tiny, very bright spot.'), target: 'ln', act: async (K, o) => { const y0 = o.ln.g.position.y, y1 = o.pp.g.position.y + o.ln.f; await K.tween(3, (k) => { o.ln.g.position.y = y0 + (y1 - y0) * k; }); o.ln.home = { p: o.ln.g.position.clone(), q: o.ln.g.quaternion.clone() }; await tag(K, o.ln, `≈ ${Math.round(o.ln.f * 100)} cm`, 2, 0.04); K.lab.emit('focus', { obj: o.ln.id }); }, ev: { type: 'focus' },
        see: X('At about 15 cm the spot is smallest and brightest: this is the focus of the lens.'), why: X('A convex lens brings the parallel rays of the Sun together at its focus.') },
      { do: X('Hold the lens steady and wait (time-lapse).'), target: 'pp', act: async (K, o) => { await K.wait(5, 6); K.lab.emit('burn', { obj: o.pp.id }); }, ev: { type: 'burn' },
        see: X('The paper under the spot turns brown, starts to smoke and then a hole is burnt in it.'), why: X('All the sunlight falling on the lens is concentrated on a tiny spot, so the paper there becomes hot enough to burn.') },
    ],
    eq: { word: 'Focus of a convex lens', sym: 'parallel rays of the Sun → meet at the focus (f ≈ 15 cm)' },
    result: { obs: X('The patch of light became smallest and brightest about 15 cm below the lens; there the paper browned, smoked and burnt.'),
      concl: X('A convex lens converges sunlight to a point (its focus). The concentrated light can heat and burn paper.'),
      safety: X('Never look at the Sun through a lens. Do this only under a teacher’s supervision, on a non-flammable surface, away from anything that can catch fire.'),
      viva: [{ q: X('What is the focal length of this lens?'), a: X('About 15 cm.') }, { q: X('Can a concave lens burn paper like this?'), a: X('No, it spreads light out.') }, { q: X('Why should we never look at the Sun through a lens?'), a: X('The concentrated light can permanently damage the eye.') }] },
  },
  {
    id: 'p8_water_drop', subj: 'physics', cls: 8, ch: C10, title: X('A drop of water as a lens'),
    aim: X('To see that a drop of water can act as a magnifying lens.'),
    kind: X('A simple lens'),
    setup(K) { const ps = K.add(K.L2.printSheet(), 0, -0.6); const db = K.bottle('water', 0.22, -0.5, { dropper: true }); ps.camView = { p: V(K, 0, 0.16, 0.12), t: V(K, 0, 0, 0) }; return { ps, db }; },
    steps: [
      { do: X('Look at the small print through the clear plastic sheet.'), target: 'ps', act: (K) => K.sleep(2), ev: { type: 'look' }, see: X('The letters look the same as without the sheet.') },
      { do: X('Put a drop of water on the plastic sheet over the print.'), target: 'db', act: async (K, o) => { const q = o.ps.g.position; const p0 = o.db.g.position.clone(); await K.moveTo(o.db, V(K, q.x + 0.01, q.y + 0.09, q.z), null, 1); await K.sleep(0.4); K.app.audio && K.app.audio.tone && K.app.audio.tone(700, 0.08, 0.06, 'sine', 500); o.ps.drop(true); await K.sleep(0.5); await K.moveTo(o.db, p0, null, 0.9); await K.sleep(1.4); K.lab.emit('drop', { obj: o.ps.id }); }, ev: { type: 'drop' },
        see: X('The letters under the drop look bigger.'), why: X('The drop is curved like a convex lens: thicker in the middle. It bends the light and magnifies the print.') },
    ],
    eq: { word: 'A water lens', sym: 'curved drop = convex lens → magnified image' },
    result: { obs: X('The print seen through a drop of water on the sheet looked larger than the print around it.'),
      concl: X('A drop of water with a curved surface acts like a convex lens and magnifies.'),
      safety: X('Keep the sheet flat so that the drop does not run off.'),
      viva: [{ q: X('Which kind of lens does the drop act as?'), a: X('A convex (converging) lens.') }, { q: X('Why does a bigger, flatter drop magnify less?'), a: X('It is less curved, so it bends light less.') }, { q: X('Name an instrument that uses a convex lens to magnify.'), a: X('A magnifying glass, a microscope.') }] },
  },
  {
    id: 'p8_moon_phases', subj: 'physics', cls: 8, ch: C11, title: X('Phases of the Moon: a model'),
    aim: X('To understand the phases of the Moon with a model: a lamp as the Sun, your head as the Earth and a white ball as the Moon.'),
    kind: X('Model of the phases of the Moon'),
    setup(K) { const mm = K.add(K.L2.moonModel(), 0, -0.4); mm.lamp.intensity = 0; K.extras.push({ get parent() { dim(K, false); return null; } }); return { mm }; },
    steps: [
      { do: X('Darken the room and switch on the lamp (the Sun). Hold the ball (the Moon) at arm’s length, between you and the lamp.'), target: 'mm', act: async (K, o) => { dim(K, true, [o.mm.lamp]); o.mm.lamp.intensity = 3.2; o.mm.setAng(0.12); view(K, o); await K.sleep(2.2); await tag(K, o.mm, tl(K, X('New moon')), 2, 0.5); }, ev: { type: 'look' },
        see: X('The side of the ball facing you is dark: new moon.') },
      { do: X('Turn slowly to your left, keeping the ball in front of you, and watch its lit part.'), target: 'mm', act: async (K, o) => { for (const [a, nm] of [[Math.PI / 4, 'Crescent'], [Math.PI / 2, 'First quarter'], [(3 * Math.PI) / 4, 'Gibbous'], [Math.PI * 0.94, 'Full moon']]) { await turn(K, o, a); await tag(K, o.mm, tl(K, X(nm)), 1.8, 0.5); } K.lab.emit('turn', { obj: o.mm.id }); }, ev: { type: 'turn' },
        see: X('The lit part grows: a thin crescent, then half (first quarter), then more than half (gibbous), then the whole face (full moon) when the lamp is behind you.'), why: X('Half of the ball is always lit by the lamp. As it moves round you, you see different amounts of its lit half.') },
      { do: X('Keep turning until you face the lamp again.'), target: 'mm', act: async (K, o) => { for (const [a, nm] of [[(5 * Math.PI) / 4, 'Gibbous'], [(3 * Math.PI) / 2, 'Last quarter'], [(7 * Math.PI) / 4, 'Crescent'], [Math.PI * 2 - 0.12, 'New moon']]) { await turn(K, o, a); await tag(K, o.mm, tl(K, X(nm)), 1.8, 0.5); } o.mm.lamp.intensity = 0; dim(K, false); o.mm.camView = null; K.lab.emit('turn', { obj: o.mm.id }); }, ev: { type: 'turn' },
        see: X('The lit part shrinks again through gibbous, last quarter and crescent back to new moon.'), why: X('The Moon takes about 29½ days to go through all its phases, which is about a month.') },
    ],
    eq: { word: 'Phases of the Moon', sym: 'new → crescent → first quarter → gibbous → full → gibbous → last quarter → crescent → new (≈ 29.5 days)' },
    result: { obs: X('As the ball went round the head, its lit part seen from the head changed from none (new moon) to a crescent, half, gibbous, full and back.'),
      concl: X('The Moon has no light of its own; we see the part of its sunlit half that faces the Earth. As it goes round the Earth, this part changes and we see the phases.'),
      safety: X('Do not look straight at a bright lamp for long. Move carefully in the dark room.'),
      viva: [{ q: X('Why do we see phases of the Moon?'), a: X('We see different amounts of its sunlit half as it goes round the Earth.') }, { q: X('How long is one cycle of phases?'), a: X('About 29.5 days.') }, { q: X('At which phase is the Moon on the side of the Earth opposite the Sun?'), a: X('Full moon.') }] },
  },
  {
    id: 'p8_shadow_stick', subj: 'physics', cls: 8, ch: C11, title: X('The shadow of a stick through the day'),
    aim: X('To find local noon (the time of the shortest shadow) with a stick in the sunlight, and so understand the solar day.'),
    kind: X('Shadow stick (gnomon) and the solar day'),
    setup(K) { const sb = K.add(K.L2.shadowBoard(), 0, -0.64); sb.setTime(7); return { sb }; },
    steps: [
      { do: X('Early in the morning (7 am) mark the tip of the stick’s shadow.'), target: 'sb', act: async (K, o) => { o.sb.setTime(7); await K.sleep(0.6); o.sb.mark('7'); await tag(K, o.sb, `7:00 · ${Math.round(o.sb.len * 100 / 0.08 * 8) / 10} cm`, 2, 0.2); }, ev: { type: 'mark' },
        see: X('The shadow is long and points towards the west.') },
      { do: X('Mark the tip of the shadow every hour until 5 pm (time-lapse).'), target: 'sb', act: async (K, o) => { K.app.lapseShown = 3600; for (let h = 8; h <= 17; h++) { const h0 = o.sb.hr; await K.tween(0.6, (k) => o.sb.setTime(h0 + (h - h0) * k)); o.sb.mark(String(h)); await K.sleep(0.2); } K.app.lapseShown = 0; K.lab.emit('mark', { obj: o.sb.id }); }, ev: { type: 'mark' },
        see: X('The shadow gets shorter until about midday, turns from west through north towards east, and then grows longer again.') },
      { do: X('Find when the shadow was shortest.'), target: 'sb', act: async (K, o) => { let best = 12, bl = 9; for (let t = 11; t <= 13.5; t += 0.05) { const l = o.sb.setTime(t); if (l < bl) { bl = l; best = t; } } o.sb.setTime(best); o.sb.mark(''); const hh = Math.floor(best), mm = Math.round((best - hh) * 60); await tag(K, o.sb, `${tl(K, X('Shortest shadow'))}: ${hh}:${String(mm).padStart(2, '0')} (${tl(K, X('local noon'))})`, 3, 0.2); }, ev: { type: 'look' },
        see: X('The shadow is shortest at about 12:15, pointing due north: this is local noon.'), why: X('At local noon the Sun is highest in the sky. The time from one local noon to the next is a solar day: 24 hours.') },
    ],
    eq: { word: 'Solar day', sym: 'time between two successive local noons = 24 h' },
    result: { obs: X('The shadow was long in the morning, shortest at about 12:15 (pointing north) and long again in the evening, pointing east.'),
      concl: X('The shadow of a stick is shortest at local noon, when the Sun is highest. The time from one local noon to the next is one solar day.'),
      safety: X('Never look directly at the Sun.'),
      viva: [{ q: X('Why is the shadow shortest at noon?'), a: X('The Sun is highest in the sky at noon.') }, { q: X('In which direction does the noon shadow point in India?'), a: X('Towards the north.') }, { q: X('Why may local noon not be exactly 12:00 by the clock?'), a: X('Clocks follow a standard time for the whole country, not the local position of the Sun.') }] },
  },
];
// the observer turns: the ball (Moon) moves round the head and the view follows it
function view(K, o) { const m = o.mm; m.camView = { p: m.head.clone().add(V(K, 0, 0.02, 0)), t: m.ball.position.clone() }; }
async function turn(K, o, a) { const a0 = o.mm.ang; await K.tween(1.4, (k) => { o.mm.setAng(a0 + (a - a0) * k); view(K, o); }); await K.sleep(0.6); }
