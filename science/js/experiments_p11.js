// Physics experiments, batch 11 (Class 6, Curiosity): magnets (which materials a magnet attracts, poles, a freely hanging
// magnet, like and unlike poles, making a magnet, a needle compass), measuring length (non-standard units, reading a scale,
// a curved line), temperature (a laboratory thermometer) and things that sink or float.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C4 = N('Ch 4 · Exploring Magnets', 'अध्याय 4 · चुंबकों की खोज', 'Ch 4 · Magnets ki khoj');
const C5 = N('Ch 5 · Measurement of Length and Motion', 'अध्याय 5 · लंबाई और गति का मापन', 'Ch 5 · Length aur Motion ka Measurement');
const C6 = N('Ch 6 · Materials Around Us', 'अध्याय 6 · हमारे आस-पास के पदार्थ', 'Ch 6 · Hamare aas-paas ke materials');
const C7 = N('Ch 7 · Temperature and its Measurement', 'अध्याय 7 · ताप और उसका मापन', 'Ch 7 · Temperature aur uska Measurement');
const yawQ = (K, a) => new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), a);
const tagAt = (K, p, txt, sec = 2.2, dx = 0.05) => K.showTag(txt, p, V(K, dx, 0.05, 0), sec);
const tag = (K, it, txt, sec = 2.2, up = 0.06) => tagAt(K, it.g.position.clone().add(V(K, 0, up, 0)), txt, sec);
const _S = [X('Attracted'), X('Not attracted'), X('Magnetic'), X('Non-magnetic'), X('Pole'), X('North'), X('South'), X('pencil lengths'), X('stick lengths'), X('Sinks'), X('Floats')];
void _S;
// keep a few things stuck to a magnet: each follows the magnet with its own offset (in the magnet's frame)
function sticker(K, mag) { const list = []; const tmp = V(K, 0, 0, 0); K.solver(() => { for (const s of list) { tmp.copy(s.off).applyQuaternion(mag.g.quaternion).add(mag.g.position); s.it.g.position.copy(tmp); } }); return { add: (it, off) => list.push({ it, off }), clear: () => { list.length = 0; } }; }
// stroke a nail or needle with a magnet: n strokes from one end to the other, always in the same direction (lifted on the way back)
async function strokes(K, mag, a, b, n, dur = 0.5) { for (let i = 0; i < n; i++) { await K.moveTo(mag, a, null, dur * 0.45); await K.moveTo(mag, b, null, dur * 0.45); await K.moveTo(mag, a.clone().add(V(K, 0, 0.03, 0)), null, dur * 0.3); } }

export const EXPERIMENTS_P11 = [
  {
    id: 'p6_magnetic_materials', subj: 'physics', cls: 6, ch: C4, title: X('Which materials does a magnet attract?'),
    aim: X('To test which everyday objects are attracted by a magnet.'),
    kind: X('Magnetic and non-magnetic materials'),
    setup(K) {
      const mag = K.add(K.MG.barMagnet(), -0.32, -0.46);
      const ks = [['nail', () => K.M7.ironNail()], ['clip', () => K.M5.thing('clip')], ['eraser', () => K.M5.thing('eraser')], ['scale', () => K.M5.thing('scale')], ['wood', () => K.M5.thing('wood')], ['foil', () => K.M5.thing('foil')], ['key', () => K.M5.thing('key')], ['glass', () => K.M5.thing('glass')]];
      const obj = ks.map(([k, f], i) => { const it = K.add(f(), -0.21 + i * 0.075, -0.64); it.magnetic = k === 'nail' || k === 'clip'; it.g.rotation.y = Math.PI / 2; it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; return it; });
      return { mag, obj, o0: obj[0], st: sticker(K, mag) };
    },
    steps: [
      { do: X('Eight objects lie in a row: an iron nail, a steel paper clip, an eraser, a plastic scale, a wooden stick, aluminium foil, a brass key and a glass slide. Bring the bar magnet close to each in turn.'), target: 'mag',
        act: async (K, o) => { let n = 0; for (const it of o.obj) { const p = it.g.position; await K.moveTo(o.mag, V(K, p.x, BENCH_Y + 0.025, p.z), null, 0.7); if (it.magnetic) { const off = V(K, 0.012 - n * 0.02, -0.012 - n * 0.002, 0.004); n++; const q = o.mag.g.quaternion; await K.moveTo(it, off.clone().applyQuaternion(q).add(o.mag.g.position), null, 0.18); o.st.add(it, off); K.app.audio && K.app.audio.tone && K.app.audio.tone(900, 0.04, 0.08, 'square'); await tag(K, it, `✓ ${tl(K, X('Attracted'))}`, 1.2, 0.05); } else { await K.sleep(0.5); await tag(K, it, `✗ ${tl(K, X('Not attracted'))}`, 1, 0.03); } }
          K.lab.emit('test', { obj: o.mag.id }); }, ev: { type: 'test' },
        see: X('The iron nail and the steel paper clip jump to the magnet and cling to it. The eraser, plastic scale, wooden stick, aluminium foil, brass key and glass slide do not move.') },
      { do: X('Pull the nail and the clip off the magnet and sort all the objects into two groups.'), target: 'o0',
        act: async (K, o) => { o.st.clear(); await K.home(o.mag, 0.8); let a = 0, b = 0; for (const it of o.obj) { const pos = it.magnetic ? V(K, -0.24 + (a++) * 0.075, BENCH_Y + 0.0008, -0.5) : V(K, 0.0 + (b++) * 0.06, BENCH_Y + 0.0008, -0.76); await K.moveTo(it, pos, yawQ(K, Math.PI / 2), 0.45); }
          tagAt(K, V(K, -0.2, BENCH_Y + 0.05, -0.5), tl(K, X('Magnetic')), 3); await tagAt(K, V(K, 0.15, BENCH_Y + 0.05, -0.76), tl(K, X('Non-magnetic')), 3); }, ev: { type: 'look' },
        see: X('Two groups: things made of iron or steel, and things made of other materials.'), why: X('A magnet attracts only some materials, such as iron, nickel, cobalt and steel. These are magnetic materials. Aluminium, brass, plastic, wood, rubber and glass are non-magnetic.') },
    ],
    eq: { word: 'Magnetic materials', sym: 'iron · steel · nickel · cobalt are attracted; plastic, wood, glass, rubber, aluminium, brass are not' },
    result: { obs: X('Only the iron nail and the steel paper clip were attracted by the magnet.'),
      concl: X('Materials that a magnet attracts are magnetic (iron, steel, nickel, cobalt); the rest are non-magnetic.'),
      safety: X('Do not drop or hammer a magnet; keep it away from phones and cards.'),
      viva: [{ q: X('Is a brass key attracted by a magnet?'), a: X('No, brass is non-magnetic.') }, { q: X('Name three magnetic materials.'), a: X('Iron, nickel and cobalt (and steel, which is mostly iron).') }, { q: X('How can a magnet help separate iron pins mixed with sand?'), a: X('Move the magnet over the mixture: the pins cling to it and the sand stays behind.') }] },
  },
  {
    id: 'p6_magnet_poles', subj: 'physics', cls: 6, ch: C4, title: X('Where is a magnet strongest?'),
    aim: X('To find the poles of a bar magnet using iron filings.'),
    kind: X('Poles of a magnet'),
    setup(K) { const mag = K.add(K.MG.barMagnet(), 0.22, -0.48); const dish = K.add(K.M7.filingsDish(), -0.02, -0.62); return { mag, dish, tf: K.M7.tufts(mag) }; },
    steps: [
      { do: X('Roll the bar magnet in the iron filings in the dish, then lift it out.'), target: 'mag',
        act: async (K, o) => { const p = o.dish.g.position; await K.moveTo(o.mag, V(K, p.x, BENCH_Y + 0.004, p.z), null, 1); await K.tween(0.8, (k) => { o.mag.g.rotation.x = Math.sin(k * Math.PI * 2) * 0.5; }); o.mag.g.rotation.x = 0; await K.tween(1, (k) => { o.tf.show(k); o.dish.take(k); }); await K.moveTo(o.mag, V(K, p.x, BENCH_Y + 0.07, p.z + 0.06), null, 1); K.lab.emit('dip', { obj: o.mag.id }); }, ev: { type: 'dip' },
        see: X('Thick tufts of filings cling to the two ends of the magnet; hardly any stick to the middle.') },
      { do: X('Look at the ends of the magnet.'), target: 'mag', act: async (K, o) => { const q = o.mag.g.quaternion, c = o.mag.g.position; const e = (s) => V(K, s * 0.034, 0.005, 0).applyQuaternion(q).add(c); tagAt(K, e(1), `N ${tl(K, X('Pole'))}`, 2.6, 0.03); await tagAt(K, e(-1), `S ${tl(K, X('Pole'))}`, 2.6, -0.06); }, ev: { type: 'look' },
        see: X('The attraction is strongest near the two ends.'), why: X('The ends of a magnet, where its attraction is strongest, are its poles: the north pole (N) and the south pole (S). Every magnet has two poles.') },
    ],
    eq: { word: 'Poles', sym: 'attraction strongest at the two ends: north pole (N) and south pole (S)' },
    result: { obs: X('Most of the iron filings stuck to the two ends of the magnet and very few to its middle.'),
      concl: X('A magnet attracts most strongly at its two ends, called its poles.'),
      safety: X('Do not rub your eyes after touching iron filings; wash your hands.'),
      viva: [{ q: X('How many poles does a bar magnet have?'), a: X('Two: a north pole and a south pole.') }, { q: X('If a magnet is broken into two pieces, how many poles does each piece have?'), a: X('Two: each piece is a complete magnet.') }, { q: X('Where are the poles of a ring magnet?'), a: X('On its two flat faces.') }] },
  },
  {
    id: 'p6_hanging_magnet', subj: 'physics', cls: 6, ch: C4, title: X('A freely hanging magnet'),
    aim: X('To find the direction in which a freely suspended bar magnet comes to rest.'),
    kind: X('Directive property of a magnet'),
    setup(K) { const hm = K.add(K.M7.hangMagnet({ ang: 1.6 + 1.2 }), -0.05, -0.56); const cp = K.add(K.MG.compass(), 0.36, -0.44); hm.camView = { p: V(K, 0.12, 0.3, 0.42), t: V(K, 0, 0.11, -0.02) }; return { hm, cp }; },
    steps: [
      { do: X('A bar magnet hangs from a thread in a paper stirrup, far from other magnets and iron. Let it swing freely until it stops.'), target: 'hm', act: async (K, o) => { await K.sleep(5); K.lab.emit('wait', { obj: o.hm.id }); }, ev: { type: 'look' },
        see: X('It turns, swings to and fro a few times and comes to rest along one particular direction.') },
      { do: X('Compare its direction with the compass.'), target: 'cp', act: async (K, o) => { tagAt(K, o.hm.nWorld(), `N → ${tl(K, X('North'))}`, 2.6, 0.03); await tagAt(K, o.hm.sWorld(), `S → ${tl(K, X('South'))}`, 2.6, 0.03); }, ev: { type: 'look' },
        see: X('Its N end points north and its S end points south, the same way as the compass needle.') },
      { do: X('Turn the magnet gently to another direction and let it go.'), target: 'hm', act: async (K, o) => { o.hm.w = 2.6; await K.sleep(6); o.hm.camView = null; }, ev: { type: 'look' },
        see: X('It swings back and again rests north–south.'), why: X('A freely suspended magnet always comes to rest in the north–south direction. A compass is a small magnet (its needle) that can turn freely.') },
    ],
    eq: { word: 'Freely suspended magnet', sym: 'rests along north (N end) – south (S end)' },
    result: { obs: X('The hanging magnet always came to rest with its N end pointing north and its S end pointing south.'),
      concl: X('A freely suspended bar magnet always comes to rest in the north–south direction.'),
      safety: X('Keep other magnets and iron objects away while the magnet settles.'),
      viva: [{ q: X('Why is the north-seeking end of a magnet called its north pole?'), a: X('Because it points towards the geographic north.') }, { q: X('How did travellers use magnets long ago?'), a: X('They used a freely turning magnet to find directions.') }, { q: X('What is the needle of a compass?'), a: X('A small magnet that can turn freely.') }] },
  },
  {
    id: 'p6_like_poles', subj: 'physics', cls: 6, ch: C4, title: X('Like poles and unlike poles'),
    aim: X('To see what happens when the poles of two magnets are brought near each other.'),
    kind: X('Attraction and repulsion between magnets'),
    setup(K) { const hm = K.add(K.M7.hangMagnet({ ang: Math.PI / 2 }), -0.05, -0.56); const m2 = K.add(K.MG.barMagnet(), 0.26, -0.42); hm.camView = { p: V(K, 0.05, 0.36, 0.36), t: V(K, 0, 0.11, -0.03) }; return { hm, m2 }; },
    steps: [
      { do: X('The hanging magnet rests north–south. Bring the N pole of a second magnet near its N pole.'), target: 'm2',
        act: async (K, o) => { const n = o.hm.nWorld(); await K.moveTo(o.m2, V(K, n.x + 0.06, n.y - 0.004, n.z), yawQ(K, Math.PI), 1.2); await K.sleep(2.5); K.lab.emit('near', { obj: o.m2.id }); }, ev: { type: 'near' },
        see: X('The N end of the hanging magnet swings away: the two N poles push each other away.') },
      { do: X('Turn the second magnet round and bring its S pole near the same end.'), target: 'm2',
        act: async (K, o) => { await K.home(o.m2, 0.8); await K.sleep(2.5); const n = o.hm.nWorld(); await K.moveTo(o.m2, V(K, n.x + 0.06, n.y - 0.004, n.z), yawQ(K, 0), 1.2); await K.sleep(2.5); await K.home(o.m2, 0.8); o.hm.camView = null; K.lab.emit('near', { obj: o.m2.id }); }, ev: { type: 'near' },
        see: X('Now the N end of the hanging magnet is pulled towards the S pole.'), why: X('Like poles (N–N or S–S) repel each other; unlike poles (N–S) attract each other.') },
    ],
    eq: { word: 'Poles', sym: 'like poles repel · unlike poles attract' },
    result: { obs: X('The N pole of the hanging magnet moved away from another N pole and towards an S pole.'),
      concl: X('Like poles of magnets repel each other and unlike poles attract each other.'),
      safety: X('Do not let strong magnets snap together on your fingers.'),
      viva: [{ q: X('Which is a sure test of a magnet: attraction or repulsion?'), a: X('Repulsion: only a magnet can repel another magnet; a piece of iron is attracted by both poles.') }, { q: X('What happens when the S poles of two magnets are brought together?'), a: X('They repel each other.') }, { q: X('Why do magnets on a fridge door stick to it?'), a: X('The door is made of steel, a magnetic material.') }] },
  },
  {
    id: 'p6_make_magnet', subj: 'physics', cls: 6, ch: C4, title: X('Making a magnet'),
    aim: X('To make a magnet from an iron nail by stroking it with a bar magnet.'),
    kind: X('Making a temporary magnet'),
    setup(K) { const nl = K.add(K.M7.ironNail(), -0.02, -0.56); const mag = K.add(K.MG.barMagnet(), 0.24, -0.46); const cl = K.add(K.M3.clipPile(14), -0.02, -0.7); return { nl, mag, cl }; },
    steps: [
      { do: X('Hold the iron nail over the paper clips.'), target: 'nl', act: async (K, o) => { const p = o.cl.g.position; await K.moveTo(o.nl, V(K, p.x - 0.04, BENCH_Y + 0.012, p.z), null, 1); await K.sleep(1.4); await K.home(o.nl, 0.8); }, ev: { type: 'look' }, see: X('No clip sticks to it: an ordinary nail is not a magnet.') },
      { do: X('Lay the nail on the table and stroke it with the N pole of the bar magnet from the head to the tip about 30 times, always in the same direction, lifting the magnet high on the way back.'), target: 'mag',
        act: async (K, o) => { const p = o.nl.g.position; o.mag.g.rotation.z = 0.6; const a = V(K, p.x - 0.04, BENCH_Y + 0.02, p.z), b = V(K, p.x + 0.045, BENCH_Y + 0.02, p.z); await strokes(K, o.mag, a, b, 30, 0.32); o.mag.g.rotation.z = 0; await K.home(o.mag, 0.8); o.nl.strength = 1; K.lab.emit('stroke', { obj: o.nl.id }); }, ev: { type: 'stroke' },
        see: X('Nothing seems to change in the nail.') },
      { do: X('Hold the nail over the paper clips again.'), target: 'nl',
        act: async (K, o) => { const p = o.cl.g.position; await K.moveTo(o.nl, V(K, p.x - 0.04, BENCH_Y + 0.012, p.z), null, 1); o.cl.follow = () => o.nl.tipWorld(); o.cl.cling(3); await K.sleep(0.6); await K.moveTo(o.nl, V(K, p.x - 0.04, BENCH_Y + 0.07, p.z), null, 1); await K.sleep(1.6); }, ev: { type: 'look' },
        see: X('A few clips cling to the tip of the nail: the nail has become a magnet.'), why: X('Stroking with a magnet in one direction turns an iron nail into a magnet. It is a weak, temporary magnet: it loses its magnetism after some time, or if it is dropped or heated.') },
    ],
    eq: { word: 'Making a magnet', sym: 'iron nail + about 30 strokes in one direction with one pole → a (temporary) magnet' },
    result: { obs: X('Before stroking, the nail did not pick up any clip; after stroking it picked up a few.'),
      concl: X('An iron nail can be made into a magnet by stroking it many times in one direction with one pole of a bar magnet.'),
      safety: X('The tip of the nail is sharp: hold it carefully.'),
      viva: [{ q: X('Why must every stroke be in the same direction?'), a: X('Strokes back and forth would undo the magnetism.') }, { q: X('Name two ways in which a magnet can lose its magnetism.'), a: X('Heating it, dropping it, or hammering it.') }, { q: X('How should bar magnets be stored?'), a: X('In pairs with unlike poles side by side, with a piece of wood between them and soft iron keepers across their ends.') }] },
  },
  {
    id: 'p6_needle_compass', subj: 'physics', cls: 6, ch: C4, title: X('A needle compass'),
    aim: X('To make a compass with a magnetised needle on a cork floating in water.'),
    kind: X('Making a compass'),
    setup(K) { const bw = K.add(K.M7.needleCork(), -0.02, -0.6); const mag = K.add(K.MG.barMagnet(), 0.26, -0.46); bw.camView = { p: V(K, 0.0, 0.3, 0.22), t: V(K, 0, 0.03, -0.02) }; return { bw, mag }; },
    steps: [
      { do: X('A sewing needle is pushed through a small cork floating in a bowl of water. Give the cork a gentle turn.'), target: 'bw', act: async (K, o) => { o.bw.spin(2.4); await K.sleep(4); }, ev: { type: 'look' },
        see: X('It slowly stops — in any direction.') },
      { do: X('Stroke the needle about 30 times with one pole of the magnet, always in the same direction.'), target: 'mag',
        act: async (K, o) => { const c = o.bw.g.position; o.mag.g.rotation.z = 0.6; o.bw.w = 0; const a0 = o.bw.ang; const dir = V(K, Math.cos(a0), 0, -Math.sin(a0)); const a = c.clone().add(dir.clone().multiplyScalar(-0.03)).setY(BENCH_Y + 0.062), b = c.clone().add(dir.clone().multiplyScalar(0.03)).setY(BENCH_Y + 0.062); await strokes(K, o.mag, a, b, 30, 0.3); o.mag.g.rotation.z = 0; await K.home(o.mag, 0.8); o.bw.magnetised = true; await K.sleep(6); K.lab.emit('stroke', { obj: o.bw.id }); }, ev: { type: 'stroke' },
        see: X('Now the cork turns by itself and the needle comes to rest pointing north–south.') },
      { do: X('Turn the cork gently once more.'), target: 'bw', act: async (K, o) => { o.bw.w += 2.4; await K.sleep(6); o.bw.camView = null; }, ev: { type: 'look' },
        see: X('It turns back and rests north–south again.'), why: X('The stroked needle has become a magnet. Floating on the cork, it can turn freely, so it settles north–south like a compass needle.') },
    ],
    eq: { word: 'A compass', sym: 'a small magnet that can turn freely → rests north–south' },
    result: { obs: X('The ordinary needle stopped in any direction; after stroking, the needle always came to rest north–south.'),
      concl: X('A magnetised needle that can turn freely works as a compass.'),
      safety: X('Handle the needle carefully; keep the magnet away from the bowl while the needle settles.'),
      viva: [{ q: X('Why does the cork need to float?'), a: X('So that the needle can turn freely.') }, { q: X('What would happen if a strong magnet were kept near the bowl?'), a: X('The needle would point towards the magnet instead of north.') }, { q: X('Which end of a compass needle is usually painted red?'), a: X('The north-pointing end.') }] },
  },
  {
    id: 'p6_stick_units', subj: 'physics', cls: 6, ch: C5, title: X('Measuring with a pencil and a stick'),
    aim: X('To measure the length of a plank with non-standard units and with a metre scale.'),
    kind: X('Need for a standard unit'),
    setup(K) { const pl = K.add(K.M7.plank({ len: 0.9 }), 0, -0.64); const pc = K.add(K.M7.measStick('pencil'), -0.3, -0.48); const st = K.add(K.M7.measStick('stick'), -0.08, -0.48); const mr = K.add(K.M7.metreRule(), 0.05, -0.38); return { pl, pc, st, mr }; },
    steps: [
      ...[['pc', 'pencil lengths', 'The plank is a little more than 5 pencil lengths long.'], ['st', 'stick lengths', 'The plank is nearly 8 stick lengths long.']].map(([k, unit, see], j) => ({
        do: X(j ? 'Now measure it with the ice-cream stick.' : 'Measure the length of the plank in pencil lengths: lay the pencil along it, mark where it ends, move it on and count.'), target: k,
        act: async (K, o) => { const it = o[k], L = it.len, P = o.pl.g.position; o.pl.clear(); let x = -0.45, n = 0; while (x + L <= 0.45 + 1e-6) { await K.moveTo(it, V(K, P.x + x + L / 2, BENCH_Y + 0.018, P.z + 0.02), yawQ(K, 0), 0.45); o.pl.mark(x + L); x += L; n++; } const left = (0.45 - x) / L; await K.moveTo(it, V(K, P.x + x + L / 2, BENCH_Y + 0.018, P.z + 0.02), yawQ(K, 0), 0.45); await tagAt(K, V(K, P.x, BENCH_Y + 0.05, P.z), `≈ ${(n + left).toFixed(1)} ${tl(K, X(unit))}`, 2.6); await K.home(it, 0.7); K.lab.emit('measure', { obj: it.id }); }, ev: { type: 'measure' },
        see: X(see) })),
      { do: X('Measure the plank with the metre scale.'), target: 'mr',
        act: async (K, o) => { const P = o.pl.g.position; await K.moveTo(o.mr, V(K, P.x + 0.45 - o.mr.xAt(0) - 0.9, BENCH_Y + 0.018, P.z - 0.035), yawQ(K, 0), 1); await tagAt(K, V(K, P.x + 0.45, BENCH_Y + 0.04, P.z - 0.035), '90.0 cm', 2.6); await K.home(o.mr, 0.8); K.lab.emit('measure', { obj: o.mr.id }); }, ev: { type: 'measure' },
        see: X('The plank is 90 cm long.'), why: X('Pencils, sticks and hand spans differ from person to person, so the numbers do not agree. A standard unit — the metre (m) and its parts, the centimetre (cm) and millimetre (mm) — gives everyone the same result.') },
    ],
    eq: { word: 'Standard unit of length', sym: 'SI unit: metre (m) · 1 m = 100 cm · 1 cm = 10 mm' },
    result: { obs: X('The plank was about 5.1 pencil lengths, about 7.8 stick lengths, and 90 cm on the metre scale.'),
      concl: X('Non-standard units give different numbers; a standard unit such as the metre is needed for a measurement that everyone agrees on.'),
      safety: X('Place the measuring stick carefully end to end without gaps or overlaps.'),
      viva: [{ q: X('What is the SI unit of length?'), a: X('The metre (m).') }, { q: X('How many millimetres are there in 1 cm?'), a: X('10 mm.') }, { q: X('Why is a hand span not a good unit?'), a: X('Different people have hand spans of different lengths.') }] },
  },
  {
    id: 'p6_scale_reading', subj: 'physics', cls: 6, ch: C5, title: X('Measuring with a scale correctly'),
    aim: X('To measure the length of a pencil correctly with a 30 cm scale.'),
    kind: X('Correct use of a scale'),
    setup(K) { const sc = K.add(K.MC.scale30(), 0.0, -0.6); sc.update = () => {}; sc.pivot.position.y = 0.0016; sc.pivot.rotation.z = 0; const pc = K.add(K.M7.measStick('pencil'), 0.0, -0.46); return { sc, pc }; },
    steps: [
      { do: X('The edge of the scale is worn, so do not start at its end. Place the pencil along the scale with its back end exactly at the 1 cm mark.'), target: 'pc',
        act: async (K, o) => { const w = o.sc.g.localToWorld(V(K, o.sc.xAt(1), 0.0032, -0.009)); await K.moveTo(o.pc, V(K, w.x + o.pc.len / 2, BENCH_Y + 0.0032, w.z), yawQ(K, 0), 1); o.pc.camView = { p: V(K, 0.0, 0.16, 0.12), t: V(K, 0.0, 0, -0.01) }; await K.sleep(1.6); K.lab.emit('place', { obj: o.pc.id }); }, ev: { type: 'place' },
        see: X('The back end of the pencil is at the 1.0 cm mark.') },
      { do: X('Look from directly above the tip of the pencil and read the mark there.'), target: 'pc',
        act: async (K, o) => { o.pc.camView = { p: V(K, o.pc.len / 2, 0.12, 0.0), t: V(K, o.pc.len / 2, 0, -0.008) }; await K.sleep(2.4); const w = o.sc.g.localToWorld(V(K, o.sc.xAt(18.5), 0.004, -0.01)); await tagAt(K, w, '18.5 cm', 2.4, 0.03); }, ev: { type: 'look' },
        see: X('The tip is at the 18.5 cm mark.'), why: X('If you look at the mark from one side, the tip seems to be at a different mark (an error called parallax). Always keep your eye directly above the point you read.') },
      { do: X('Work out the length of the pencil.'), target: 'pc', act: async (K, o) => { o.pc.camView = null; await tag(K, o.pc, '18.5 cm − 1.0 cm = 17.5 cm', 2.8, 0.04); }, ev: { type: 'look' },
        see: X('The pencil is 17.5 cm long.') },
    ],
    eq: { word: 'Length', sym: 'reading at the far end − reading at the starting end = 18.5 cm − 1.0 cm = 17.5 cm' },
    result: { obs: X('Starting at the 1.0 cm mark, the tip of the pencil was at 18.5 cm.'),
      concl: X('The length of the pencil is 17.5 cm. Place the object along the scale, start from a clear mark, and read with your eye directly above the mark.'),
      safety: X('Keep the scale in contact with the object and along its length.'),
      viva: [{ q: X('Why should you not start from a broken end of a scale?'), a: X('The zero mark may not be accurate; start from another full mark and subtract.') }, { q: X('Where should your eye be while reading?'), a: X('Directly above the mark being read.') }, { q: X('What is the smallest length a 30 cm school scale can measure?'), a: X('1 mm.') }] },
  },
  {
    id: 'p6_curved_line', subj: 'physics', cls: 6, ch: C5, title: X('Measuring a curved line'),
    aim: X('To measure the length of a curved line using a thread and a scale.'),
    kind: X('Measuring curved lengths'),
    setup(K) { const cc = K.add(K.M7.curveCard(), 0, -0.62); const sc = K.add(K.MC.scale30(), 0.065, -0.52); sc.update = () => {}; sc.pivot.position.y = 0.0016; sc.pivot.rotation.z = 0; cc.camView = { p: V(K, 0.0, 0.3, 0.26), t: V(K, 0, 0, 0.03) }; return { cc, sc }; },
    steps: [
      { do: X('Lay a thread carefully along the curved line from A to B, holding it down bit by bit.'), target: 'cc', act: async (K, o) => { o.cc.setThread(0); await K.sleep(2); K.lab.emit('lay', { obj: o.cc.id }); }, ev: { type: 'lay' },
        see: X('The thread follows every bend of the line.') },
      { do: X('Mark the thread at B, then pull it straight along the scale, starting at the 0 mark.'), target: 'cc', act: async (K, o) => { await K.tween(1.6, (k) => o.cc.setThread(k)); await K.sleep(1); }, ev: { type: 'look' },
        see: X('The straightened thread lies along the scale.') },
      { do: X('Read the scale at the mark on the thread.'), target: 'sc', act: async (K, o) => { const cm = o.cc.curveLen * 100; const w = o.sc.g.localToWorld(V(K, o.sc.xAt(cm), 0.004, -0.01)); await tagAt(K, w, `${cm.toFixed(1)} cm`, 2.6, 0.03); o.cc.camView = null; }, ev: { type: 'look' },
        see: X('The curved line is about 22 cm long — much longer than the straight distance from A to B.'), why: X('A thread can follow a curve and then be straightened, so its length can be read on a scale.') },
    ],
    eq: { word: 'Curved length', sym: 'thread along the curve → straightened along the scale → reading' },
    result: { obs: X('The thread laid along the curve and then straightened measured about 22 cm.'),
      concl: X('The length of a curved line can be measured with a thread and a scale.'),
      safety: X('Do not stretch the thread while measuring.'),
      viva: [{ q: X('Why should the thread not be stretched?'), a: X('A stretched thread would give a wrong (smaller) reading.') }, { q: X('How else could you measure a curved line?'), a: X('With a divider, or by rolling a wheel along it, or with a flexible measuring tape.') }, { q: X('What is used to measure the chest of a person?'), a: X('A measuring tape.') }] },
  },
  {
    id: 'p6_lab_thermometer', subj: 'physics', cls: 6, ch: C7, title: X('Using a laboratory thermometer'),
    aim: X('To measure the temperature of ice-cold water, tap water and warm water with a laboratory thermometer.'),
    kind: X('Laboratory thermometer'),
    setup(K) {
      const cold = K.beaker(-0.2, -0.62, 'water', 150, 250), tap = K.beaker(0, -0.62, 'water', 150, 250), warm = K.beaker(0.2, -0.62, 'water', 150, 250);
      cold.mix.temp = 4; tap.mix.temp = 27; warm.mix.temp = 52; for (const b of [cold, tap, warm]) b.bath = b; K.ice(cold, 4);
      const th = K.thermo(0.34, -0.46); th.update = (dt) => { const t = th.dip ? th.dip.mix.temp : 27; th.setTemp(th.temp + (t - th.temp) * Math.min(1, dt * 1.6)); };
      return { cold, tap, warm, th };
    },
    steps: [
      ...[['tap', 'Put the thermometer in the tap water. Keep its bulb under the water without touching the bottom or the side, wait until the level stops moving and read it with your eye level with the top of the liquid.', 'It reads about 27 °C.'],
        ['cold', 'Now measure the water with ice in it.', 'The level falls and stops at about 4 °C.'],
        ['warm', 'Now measure the warm water.', 'The level rises and stops at about 52 °C.']].map(([k, d, see], j) => ({ do: X(d), target: k,
        act: async (K, o) => { const b = o[k]; const m = b.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.th, m.clone().add(V(K, 0.012, -0.075, 0)), new K.THREE.Quaternion().setFromEuler(new K.THREE.Euler(0, 0, -0.15)), 1); o.th.dip = b; o.th.camView = { p: V(K, 0.12, 0.2, 0.2), t: V(K, 0, 0.13, 0) }; await K.sleep(3.2); await tag(K, o.th, `${Math.round(o.th.temp)} °C`, 2.2, 0.28); o.th.camView = null; if (j === 2) { o.th.dip = null; await K.home(o.th, 0.9); } K.lab.emit('read', { obj: o.th.id }); }, ev: { type: 'read' },
        see: X(see), ...(j === 2 ? { why: X('A laboratory thermometer reads from about −10 °C to 110 °C. Its reading changes only while the bulb is in the liquid, so it is read while it is still in the liquid. A clinical thermometer (35 °C to 42 °C) is for body temperature only.') } : {}) })),
    ],
    eq: { word: 'Temperature', sym: 'measured in degrees Celsius (°C) · water freezes at 0 °C and boils at 100 °C' },
    result: { obs: X('Tap water was about 27 °C, water with ice about 4 °C and warm water about 52 °C.'),
      concl: X('A laboratory thermometer measures how hot or cold a liquid is; it must be read while its bulb is in the liquid.'),
      safety: X('Hold the thermometer by its upper end, never by the bulb; handle it gently as it is made of glass.'),
      viva: [{ q: X('What is the range of a laboratory thermometer?'), a: X('About −10 °C to 110 °C.') }, { q: X('Why can a clinical thermometer not be used to measure the temperature of boiling water?'), a: X('Its range goes only up to 42 °C; it would break.') }, { q: X('What is the normal temperature of the human body?'), a: X('About 37 °C.') }] },
  },
  {
    id: 'p6_sink_float', subj: 'physics', cls: 6, ch: C6, title: X('Which things sink and which float?'),
    aim: X('To find out which objects sink in water and which float.'),
    kind: X('Sinking and floating'),
    setup(K) {
      const tb = K.add(K.M7.waterTub(), 0, -0.66);
      const ks = ['stone', 'wood', 'nail', 'cork', 'key', 'cap']; const obj = ks.map((k, i) => K.add(K.M7.floatThing(k), -0.25 + i * 0.1, -0.44));
      tb.camView = { p: V(K, 0.05, 0.22, 0.42), t: V(K, 0, 0.06, 0) }; return { tb, obj, o0: obj[0] };
    },
    steps: [
      { do: X('Drop the objects into the tub of water one by one: a stone, a wooden block, an iron nail, a cork, a brass key and a plastic bottle cap.'), target: 'o0',
        act: async (K, o) => { const P = o.tb.g.position; const xs = [-0.13, -0.075, -0.02, 0.035, 0.09, 0.14]; for (let i = 0; i < o.obj.length; i++) { const it = o.obj[i]; const x = P.x + xs[i], z = P.z + (i % 2 ? 0.045 : -0.035);
            await K.moveTo(it, V(K, x, BENCH_Y + o.tb.height + 0.04, z), null, 0.6); const y0 = BENCH_Y + o.tb.height + 0.04; const surf = BENCH_Y + o.tb.waterY; const end = it.floats ? surf - it.h * (it.rho / 1000) : BENCH_Y + o.tb.floorY;
            await K.tween(it.floats ? 0.5 : 0.35, (k) => { it.g.position.y = y0 + (surf - y0) * k * k; }); K.app.audio && K.app.audio.tone && K.app.audio.tone(320, 0.08, 0.06, 'sine');
            await K.tween(it.floats ? 0.8 : 1.4, (k) => { const e = 1 - (1 - k) * (1 - k); it.g.position.y = surf + (end - surf) * e + (it.floats ? Math.sin(k * 9) * (1 - k) * 0.004 : 0); }); it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; await tag(K, it, tl(K, X(it.floats ? 'Floats' : 'Sinks')), 0.9, 0.04); }
          K.lab.emit('drop', { obj: o.tb.id }); }, ev: { type: 'drop' },
        see: X('The stone, the iron nail and the brass key sink to the bottom. The wooden block, the cork and the plastic cap float, partly under water.'), why: X('Whether a thing sinks or floats depends on what it is made of: materials that are heavier than the same volume of water sink; lighter ones float.') },
    ],
    eq: { word: 'Sink or float', sym: 'sink: stone, iron, brass · float: wood, cork, plastic' },
    result: { obs: X('The stone, nail and key sank; the wooden block, cork and plastic cap floated.'),
      concl: X('Some materials sink in water and others float.'),
      safety: X('Wipe up spilled water so that nobody slips.'),
      viva: [{ q: X('Does an iron ship sink?'), a: X('No: its hollow shape holds a lot of air, so the ship as a whole is lighter than the water it pushes aside.') }, { q: X('Name two things that float on water.'), a: X('Wood and cork (also ice, plastic, oil).') }, { q: X('Does a big log of wood sink?'), a: X('No, wood floats whatever its size.') }] },
  },
];
