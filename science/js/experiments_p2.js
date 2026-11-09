// Physics experiments, batch 2 (Class 10, Ch 12 Magnetic Effects of Electric Current): a current deflects a compass,
// iron filings around a bar magnet, field lines drawn with a compass, the field of a straight wire, of a circular coil
// and of a solenoid, and the force on a current-carrying rod in a magnetic field.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const P12 = N('Ch 12 · Magnetic Effects of Electric Current', 'अध्याय 12 · विद्युत धारा के चुंबकीय प्रभाव', 'Ch 12 · Electric Current ke Magnetic Effects');
const deg = (r) => Math.round((r * 180) / Math.PI);
// the compass needle's turn away from north, in degrees (positive: towards the west)
const turn = (cp) => { const a = cp.pointing ?? 0; let d = a - Math.PI / 2; d = Math.atan2(Math.sin(d), Math.cos(d)); return d; };
// a basic circuit: cells, key, rheostat (and an ammeter) in series with a conductor between its terminals a and b
function circuit(K, cond, o = {}) {
  const bat = K.add(K.A4.cellPack(o.cells ?? 2), o.bx ?? -0.44, o.bz ?? -0.56); const key = K.add(K.A4.plugKey(), o.kx ?? -0.3, o.kz ?? -0.46); const rh = K.add(K.EL.rheostat(5), o.rx ?? -0.3, o.rz ?? -0.82); const am = K.add(K.EL.meter('A', 3), o.ax ?? -0.14, o.az ?? -0.46);
  K.wires([[[bat, '+'], [key, 'a'], 0xc62828], [[key, 'b'], [am, '+'], 0xc62828], [[am, '-'], [rh, 'a'], 0xc62828], [[rh, 'c'], [cond, 'a'], 0xc62828], [[cond, 'b'], [bat, '-'], 0x222222]]);
  rh.setK(o.k ?? 0.5); rh.kShown = rh.k; return { bat, key, rh, am };
}
const _S = [X('The rod is pushed towards you'), X('The rod is pushed away from you')]; void _S; // (labels picked at run time)
const tag = (K, it, txt, dy = 0.08) => K.showTag(txt, it.g.position.clone().add(V(K, 0, dy, 0)), V(K, 0, 0.04, 0), 2.4);

export const EXPERIMENTS_P2 = [
  {
    id: 'p10_oersted', subj: 'physics', cls: 10, ch: P12, title: X('A current in a wire deflects a compass needle'),
    aim: X('To show that a current-carrying wire produces a magnetic field that deflects a compass needle, and that reversing the current reverses the deflection.'),
    kind: X('Magnetic field of a current (Oersted)'),
    setup(K) {
      const wr = K.add(K.MG.wireXY({ len: 0.26, h: 0.03 }), 0.12, -0.66, { ry: Math.PI / 2 }); const cp = K.add(K.MG.compass(), 0.12, -0.66); cp.ang = Math.PI / 2; cp.name = X('Magnetic compass (under the wire)');
      const c = circuit(K, wr, { k: 0.5 }); return { wr, cp, ...c };
    },
    steps: [
      { do: X('The thick copper wire XY runs north–south, just above a magnetic compass. Look at the needle.'), target: 'cp', act: (K) => K.sleep(1.6), see: X('The needle points north, along the wire.') },
      { do: X('Insert the plug in the key to pass a current through the wire.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(2.5); o.d1 = turn(o.cp); await tag(K, o.cp, `${tl(K, X('Deflection'))}: ${Math.abs(deg(o.d1))}° ${o.d1 > 0 ? tl(K, X('towards west')) : tl(K, X('towards east'))}`); }, ev: { type: 'key' },
        see: X('The needle turns away from north (here towards the west).'), why: X('A current in a wire produces a magnetic field around it. Below a wire carrying current northwards, this field points west.') },
      { do: X('Increase the current with the rheostat and watch the needle.'), target: 'rh', act: async (K, o) => { await K.rheo(o.rh, 0.12, 1.2); await K.sleep(2); await tag(K, o.cp, `I = ${o.am.read().toFixed(1)} A · ${Math.abs(deg(turn(o.cp)))}°`); }, ev: { type: 'rheostat' },
        see: X('The deflection becomes larger.'), why: X('A larger current produces a stronger magnetic field.') },
      { do: X('Take out the plug, reverse the connections at the cells (so the current flows from Y to X) and close the key again.'), target: 'bat', act: async (K, o) => { await K.keyOn(o.key, false); await K.sleep(1.5); await K.swapEnds(o.bat, '+', '-'); await K.keyOn(o.key, true); await K.sleep(2.5); const d = turn(o.cp); await tag(K, o.cp, `${Math.abs(deg(d))}° ${d > 0 ? tl(K, X('towards west')) : tl(K, X('towards east'))}`); }, ev: { type: 'key' },
        see: X('The needle now turns the other way (towards the east).'), why: X('Reversing the current reverses the direction of the magnetic field.') },
      { do: X('Hold the compass just above the wire instead of below it.'), target: 'cp', act: async (K, o) => { await K.moveTo(o.cp, o.cp.g.position.clone().add(V(K, 0, 0.04, 0)), null, 1); await K.sleep(2.5); const d = turn(o.cp); await tag(K, o.cp, `${Math.abs(deg(d))}° ${d > 0 ? tl(K, X('towards west')) : tl(K, X('towards east'))}`); await K.home(o.cp, 0.8); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('Above the wire the needle turns in the opposite direction to below it.'), why: X('The field lines are circles around the wire: the field above the wire points opposite to the field below it (right-hand thumb rule).') },
    ],
    eq: { word: 'Right-hand thumb rule: thumb along the current, the curled fingers give the direction of the magnetic field', sym: 'B ∝ I / r' },
    result: { obs: X('With current the needle deflected; a larger current gave a larger deflection; reversing the current, or putting the compass above the wire, reversed the deflection.'),
      concl: X('An electric current produces a magnetic field around the wire. Its direction depends on the direction of the current and is given by the right-hand thumb rule.'),
      safety: X('Do not keep the key closed for long: a thick wire carrying a large current gets hot and the cells run down.'),
      viva: [{ q: X('Who first observed this effect?'), a: X('Hans Christian Oersted, in 1820.') }, { q: X('What happens to the deflection if the current is increased?'), a: X('It increases.') }, { q: X('State the right-hand thumb rule.'), a: X('Hold the wire in the right hand with the thumb along the current; the curled fingers show the direction of the field lines.') }] },
  },
  {
    id: 'p10_filings_magnet', subj: 'physics', cls: 10, ch: P12, title: X('Iron filings around a bar magnet'),
    aim: X('To see the pattern of the magnetic field around a bar magnet using iron filings.'),
    kind: X('Magnetic field pattern'),
    setup(K) { const mg = K.add(K.MG.barMagnet(), 0.4, -0.5); const sh = K.add(K.MG.filingsSheet({ lift: 0.014, hidden: true, n: 3000 }), 0, -0.66); sh.name = X('White card on supports'); const cp = K.add(K.MG.compass(), 0.3, -0.44); return { mg, sh, cp }; },
    steps: [
      { do: X('Place the bar magnet under the middle of the white card.'), target: 'mg', act: async (K, o) => { await K.moveTo(o.mg, V(K, 0, BENCH_Y + 0.001, -0.66), null, 1); o.mg.home = { p: o.mg.g.position.clone(), q: o.mg.g.quaternion.clone() }; }, ev: { type: 'none' }, see: X('The magnet lies under the card; you cannot see it through the card.') },
      { do: X('Sprinkle iron filings evenly over the card.'), target: 'sh', act: (K, o) => K.sprinkleOn(o.sh, 1.8), ev: { type: 'sprinkle' }, see: X('The filings lie scattered at random.') },
      { do: X('Tap the card gently a few times.'), target: 'sh', act: (K, o) => K.tapSheet(o.sh, 4), ev: { type: 'tap' },
        see: X('The filings arrange themselves in a pattern of curved lines from one end of the magnet to the other, crowded near the two ends.'), why: X('Each filing becomes a tiny magnet and lines up along the magnetic field. The lines show the field; where they are crowded the field is strongest (at the poles).') },
      { do: X('Bring the compass near one end of the card.'), target: 'cp', act: async (K, o) => { await K.moveTo(o.cp, V(K, 0.07, BENCH_Y + 0.02, -0.66), null, 1); await K.sleep(2); await K.home(o.cp, 0.8); }, ev: { type: 'none' },
        see: X('The north end of the needle points away from the N pole of the magnet: field lines come out of the N pole and go into the S pole.') },
    ],
    eq: { word: 'Magnetic field lines leave the north pole and enter the south pole; they never cross', sym: 'N → S (outside the magnet)' },
    result: { obs: X('The filings formed closed curved lines from one end to the other, crowded at the poles.'),
      concl: X('A magnet has a magnetic field around it. Field lines go from N to S outside the magnet, are closest where the field is strongest and never cross each other.'),
      safety: X('Do not let the filings touch the magnet directly: they are hard to remove. Keep magnets away from phones and watches.'),
      viva: [{ q: X('Why do two field lines never cross?'), a: X('At the crossing point the compass needle would have to point in two directions at once, which is impossible.') }, { q: X('Where is the field strongest?'), a: X('Near the poles, where the lines are crowded.') }, { q: X('What is the direction of field lines inside a magnet?'), a: X('From the S pole to the N pole.') }] },
  },
  {
    id: 'p10_compass_lines', subj: 'physics', cls: 10, ch: P12, title: X('Drawing field lines with a compass'),
    aim: X('To draw the magnetic field lines of a bar magnet using a small compass.'),
    kind: X('Plotting magnetic field lines'),
    setup(K) { const bd = K.add(K.RF.drawingBoard(), -0.05, -0.66); const mg = K.add(K.MG.barMagnet(), 0.3, -0.48); const cp = K.add(K.MG.compass({ r: 0.011 }), 0.32, -0.6); cp.name = X('Small magnetic compass'); const pc = K.lay(K.RF.pencil(), 0.22, -0.44, 0.4); return { bd, mg, cp, pc }; },
    steps: [
      { do: X('Fix the sheet on the board, place the bar magnet in the middle and draw its outline.'), target: 'mg', act: async (K, o) => { const w = o.bd.g.localToWorld(o.bd.toLocal(0, 0)); await K.moveTo(o.mg, w, null, 1); o.mg.home = { p: o.mg.g.position.clone(), q: o.mg.g.quaternion.clone() }; const L = 0.0375, h = 0.008; const c = [[-L, -h], [L, -h], [L, h], [-L, h]]; for (let i = 0; i < 4; i++) await K.pencil(o.pc, o.bd, c[i], c[(i + 1) % 4], { fast: true }); o.bd.text([L - 0.008, 0.012], 'N', { col: '#c62828' }); o.bd.text([-L, 0.012], 'S', { col: '#2d4f9a' }); }, ev: { type: 'draw' },
        see: X('The outline of the magnet with its N and S ends marked.') },
      { do: X('Place the compass near the N pole. Mark the positions of the two ends of its needle; move the compass so that its south end is at the last mark, and repeat until you reach the S pole. Join the marks.'), target: 'cp',
        act: (K, o) => K.fieldLines(o.bd, o.cp, [[0.04, 0.004]], { stop: (u, v) => Math.abs(v) < 0.012 && u < -0.03 && u > -0.045 }), ev: { type: 'lines' },
        see: X('A smooth curve from the N pole to the S pole: one magnetic field line.') },
      { do: X('Repeat from other starting points near the N pole to draw more field lines.'), target: 'bd',
        act: (K, o) => K.fieldLines(o.bd, null, [[0.04, -0.004], [0.04, 0.008], [0.04, -0.008], [0.043, 0.002], [0.043, -0.002], [0.042, 0.01], [0.042, -0.01]], { stop: (u, v) => Math.abs(v) < 0.012 && u < -0.03 && u > -0.045 }), ev: { type: 'lines' },
        see: X('A set of closed curved lines from N to S that never cross; they are crowded near the poles.'), why: X('A compass needle sets itself along the field, so the marks follow the direction of the field. The arrows point from N to S outside the magnet.') },
    ],
    eq: { word: 'The direction of a field line at any point is the direction in which the north pole of a compass points there', sym: 'N → S (outside), S → N (inside)' },
    result: { obs: X('Joining the needle marks gave curved lines from the N pole to the S pole; they did not cross and were closest near the poles.'),
      concl: X('Magnetic field lines can be traced with a compass. They are closed curves that run from N to S outside the magnet.'),
      safety: X('Keep other magnets and iron objects away from the board; they disturb the compass.'),
      viva: [{ q: X('What is a magnetic field line?'), a: X('The path along which a free north pole would tend to move.') }, { q: X('What does the closeness of field lines show?'), a: X('The strength of the field.') }, { q: X('Why is a small compass used?'), a: X('So that the needle follows the field at one small region at a time.') }] },
  },
  {
    id: 'p10_field_wire', subj: 'physics', cls: 10, ch: P12, title: X('Magnetic field of a straight current-carrying wire'),
    aim: X('To see the pattern of the magnetic field around a straight wire carrying a current.'),
    kind: X('Field of a straight conductor'),
    setup(K) { const wr = K.add(K.MG.straightWire({ h: 0.2 }), 0.08, -0.66); const sh = K.add(K.MG.filingsSheet({ lift: 0.06, hidden: true, w: 0.18, h: 0.16, n: 2600 }), 0.08, -0.66); sh.name = X('Cardboard (the wire passes through its centre)'); const cp = K.add(K.MG.compass({ r: 0.011 }), 0.3, -0.44); const c = circuit(K, wr, { cells: 4, k: 0.15 }); return { wr, sh, cp, ...c }; },
    steps: [
      { do: X('A thick copper wire passes vertically through the centre of the cardboard. Sprinkle iron filings on the cardboard.'), target: 'sh', act: (K, o) => K.sprinkleOn(o.sh, 1.6), ev: { type: 'sprinkle' }, see: X('The filings lie at random.') },
      { do: X('Close the key so that a current flows up the wire, and tap the cardboard gently.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(0.6); await K.tapSheet(o.sh, 4); }, ev: { type: 'tap' },
        see: X('The filings arrange themselves in concentric circles around the wire.'), why: X('The magnetic field lines around a straight wire are concentric circles centred on the wire.') },
      { do: X('Place the small compass on the cardboard near the wire and note where its N end points.'), target: 'cp', act: async (K, o) => { await K.moveTo(o.cp, V(K, 0.08, BENCH_Y + 0.062, -0.66 + 0.03), null, 1); await K.sleep(2.5); await tag(K, o.cp, tl(K, X('N end: anticlockwise round the wire (seen from above)')), 0.06); }, ev: { type: 'none' },
        see: X('The needle lies along a circle; seen from above, its N end points anticlockwise for a current flowing upwards.') },
      { do: X('Reverse the current and look at the compass again.'), target: 'bat', act: async (K, o) => { await K.swapEnds(o.bat, '+', '-'); await K.sleep(2.5); await tag(K, o.cp, tl(K, X('Now clockwise')), 0.06); await K.keyOn(o.key, false); await K.home(o.cp, 0.8); }, ev: { type: 'reverse' },
        see: X('The needle turns round: the field now goes clockwise.'), why: X('By the right-hand thumb rule the direction of the circles depends on the direction of the current.') },
    ],
    eq: { word: 'Field of a straight wire: concentric circles; stronger near the wire and for a larger current', sym: 'B ∝ I / r' },
    result: { obs: X('The filings formed concentric circles around the wire; the compass followed the circles and reversed when the current was reversed.'),
      concl: X('The magnetic field around a straight current-carrying wire consists of concentric circles; its direction is given by the right-hand thumb rule.'),
      safety: X('Pass the current only for a short time; use a rheostat to keep it safe.'),
      viva: [{ q: X('How does the field change as you move away from the wire?'), a: X('It becomes weaker (the circles are farther apart).') }, { q: X('What is the shape of the field lines?'), a: X('Concentric circles centred on the wire.') }, { q: X('What happens if the current is increased?'), a: X('The field becomes stronger.') }] },
  },
  {
    id: 'p10_field_coil', subj: 'physics', cls: 10, ch: P12, title: X('Magnetic field of a circular coil'),
    aim: X('To see the pattern of the magnetic field of a current-carrying circular coil.'),
    kind: X('Field of a circular coil'),
    setup(K) { const cl = K.add(K.MG.coilCard({ r: 0.035, turns: 10, cardY: 0.05 }), 0.08, -0.66); const sh = K.add(K.MG.filingsSheet({ lift: 0.05, hidden: true, w: 0.2, h: 0.16, n: 2800 }), 0.08, -0.66); sh.name = X('Cardboard (the coil passes through it)'); const c = circuit(K, cl, { cells: 4, k: 0.15 }); return { cl, sh, ...c }; },
    steps: [
      { do: X('A coil of many turns stands upright through the cardboard. Sprinkle iron filings on the cardboard.'), target: 'sh', act: (K, o) => K.sprinkleOn(o.sh, 1.6), ev: { type: 'sprinkle' }, see: X('The filings lie at random.') },
      { do: X('Close the key and tap the cardboard gently.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(0.6); await K.tapSheet(o.sh, 4); await K.keyOn(o.key, false); }, ev: { type: 'tap' },
        see: X('Near each side of the coil the filings form small circles around the wire; at the centre of the coil the lines are nearly straight and parallel.'), why: X('Each part of the coil makes circles of field around it. Inside the loop all these fields point the same way, so the field at the centre is strong and nearly uniform.') },
    ],
    eq: { word: 'Field at the centre of a coil: proportional to the current and the number of turns', sym: 'B ∝ n I / r' },
    result: { obs: X('Circles around each side of the coil, nearly straight parallel lines at its centre.'),
      concl: X('The field of a circular coil is strongest at its centre and increases with the number of turns and the current.'),
      safety: X('Pass the current only for a short time.'),
      viva: [{ q: X('How can the field at the centre be made stronger?'), a: X('Increase the current or the number of turns.') }, { q: X('What is the field like at the centre?'), a: X('Nearly straight and parallel lines (almost uniform).') }] },
  },
  {
    id: 'p10_solenoid', subj: 'physics', cls: 10, ch: P12, title: X('Magnetic field of a solenoid'),
    aim: X('To see the magnetic field of a current-carrying solenoid and compare it with that of a bar magnet.'),
    kind: X('Solenoid and electromagnet'),
    setup(K) { const so = K.add(K.MG.solenoid({ turns: 16, r: 0.016, len: 0.11 }), 0.08, -0.66); const sh = K.add(K.MG.filingsSheet({ lift: 0.019, hidden: true, w: 0.24, h: 0.16, n: 3000 }), 0.08, -0.66); sh.name = X('Card through the middle of the solenoid'); const cp = K.add(K.MG.compass({ r: 0.012 }), 0.32, -0.46); const c = circuit(K, so, { cells: 4, k: 0.3 }); return { so, sh, cp, ...c }; },
    steps: [
      { do: X('Sprinkle iron filings on the card that passes through the solenoid.'), target: 'sh', act: (K, o) => K.sprinkleOn(o.sh, 1.6), ev: { type: 'sprinkle' }, see: X('The filings lie at random.') },
      { do: X('Close the key and tap the card.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(0.6); await K.tapSheet(o.sh, 4); }, ev: { type: 'tap' },
        see: X('Inside the solenoid the filings lie in straight parallel lines; outside, the pattern is just like that of a bar magnet.'), why: X('The fields of all the turns add up: inside a long solenoid the field is strong and uniform; one end behaves as a north pole and the other as a south pole.') },
      { do: X('Bring the compass near one end of the solenoid.'), target: 'cp', act: async (K, o) => { await K.moveTo(o.cp, V(K, 0.08 + 0.085, BENCH_Y + 0.0008, -0.66), null, 1); await K.sleep(2.5); await K.home(o.cp, 0.8); await K.keyOn(o.key, false); }, ev: { type: 'none' },
        see: X('The compass needle swings round: that end of the solenoid behaves like a magnetic pole.'), why: X('A solenoid carrying a current is an electromagnet. With a soft iron core inside it becomes a strong electromagnet that works only while the current flows.') },
    ],
    eq: { word: 'Field inside a long solenoid: uniform, proportional to the current and to the number of turns per unit length', sym: 'B ∝ n I' },
    result: { obs: X('The filings formed straight parallel lines inside and a bar-magnet-like pattern outside; the ends attracted and repelled the compass needle like poles.'),
      concl: X('A current-carrying solenoid behaves like a bar magnet with a uniform field inside. It is the basis of the electromagnet.'),
      safety: X('Do not keep the current on for long; the coil gets hot.'),
      viva: [{ q: X('How is a solenoid different from a bar magnet?'), a: X('Its magnetism can be switched on and off and its strength changed with the current.') }, { q: X('What is placed inside a solenoid to make an electromagnet?'), a: X('A soft iron core.') }, { q: X('How can you find which end is N?'), a: X('With a compass, or by the clockwise/anticlockwise rule of the current seen from that end.') }] },
  },
  {
    id: 'p10_force_rod', subj: 'physics', cls: 10, ch: P12, title: X('Force on a current-carrying rod in a magnetic field'),
    aim: X('To show that a current-carrying conductor in a magnetic field experiences a force, and that its direction depends on the current and the field.'),
    kind: X("Force on a conductor (Fleming's left-hand rule)"),
    setup(K) { const hs = K.add(K.MG.horseshoe({ gap: 0.034 }), 0.17, -0.68, { ry: Math.PI / 2 }); const rd = K.add(K.MG.hangingRod({ len: 0.07, hang: 0.1, rodY: hs.gapY }), 0.17, -0.7); rd.name = X('Aluminium rod AB hung between the poles'); const c = circuit(K, rd, { cells: 4, k: 0.2 }); return { hs, rd, ...c }; },
    steps: [
      { do: X('The light aluminium rod AB hangs between the poles of the horseshoe magnet (N below, S above: the field points upwards).'), target: 'rd', act: (K) => K.sleep(1.6), see: X('The rod hangs straight down at rest.') },
      { do: X('Close the key so that a current flows from A to B.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(2.5); o.s1 = o.rd.swing; await tag(K, o.rd, tl(K, X(o.s1 > 0 ? 'The rod is pushed towards you' : 'The rod is pushed away from you')), 0.16); }, ev: { type: 'key' },
        see: X('The rod is pushed sideways out of the gap and stays displaced while the current flows.'), why: X('A current-carrying conductor in a magnetic field experiences a force. The force is perpendicular to both the current and the field.') },
      { do: X('Reverse the current (swap the connections at the cells).'), target: 'bat', act: async (K, o) => { await K.swapEnds(o.bat, '+', '-'); await K.sleep(2.5); await tag(K, o.rd, tl(K, X(o.rd.swing > 0 ? 'The rod is pushed towards you' : 'The rod is pushed away from you')), 0.16); }, ev: { type: 'reverse' },
        see: X('The rod is now pushed the opposite way.') },
      { do: X('Now turn the magnet over (S below, N above) and watch the rod.'), target: 'hs', act: async (K, o) => { await K.tween(1.2, (k, d) => { o.hs.g.rotateOnWorldAxis(new K.THREE.Vector3(0, 0, 1), Math.PI * d / 1.2); o.hs.g.position.y = BENCH_Y + 0.0008 + o.hs.height * Math.min(1, k * 1.2); }); await K.sleep(2.5); await tag(K, o.rd, tl(K, X(o.rd.swing > 0 ? 'The rod is pushed towards you' : 'The rod is pushed away from you')), 0.16); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The direction of the force reverses again.'), why: X("Fleming's left-hand rule: stretch the forefinger along the field, the middle finger along the current; the thumb gives the direction of the force (motion).") },
    ],
    eq: { word: "Force on a conductor: F = B I L (largest when the current is perpendicular to the field); direction by Fleming's left-hand rule", sym: 'F = I L × B' },
    result: { obs: X('The rod moved sideways when the current flowed; its direction reversed when either the current or the magnetic field was reversed.'),
      concl: X("A current-carrying conductor placed in a magnetic field experiences a force whose direction is given by Fleming's left-hand rule. This is the principle of the electric motor."),
      safety: X('Use a rheostat to limit the current and close the key only for a short time.'),
      viva: [{ q: X('State Fleming’s left-hand rule.'), a: X('Forefinger: field, middle finger: current, thumb: force (motion) — all mutually perpendicular.') }, { q: X('When is the force on the conductor largest?'), a: X('When the current is at right angles to the magnetic field.') }, { q: X('Name a device that uses this force.'), a: X('An electric motor (also loudspeakers).') }] },
  },
];
void BENCH_Y;
