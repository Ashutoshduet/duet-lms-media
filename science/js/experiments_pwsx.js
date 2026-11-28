// DUET Science Lab 360, physics batch PW-SX: the physics topics a student meets in the SenseXR catalogue that were not yet in
// the lab, made hands-on. This file: devices of the magnetic effect of a current and of static charges (an electric bell, a
// DC motor, a Van de Graaff generator, a gold-leaf electroscope, lightning and the lightning conductor in a village). The
// other activities of the batch are in experiments_pwsxb.js. Every activity opens with one everyday question ("Kyun?");
// the student does each step with their own hand (mouse, touch, a VR-box controller or a Quest hand), and what happens
// follows what they did. Apparatus: pwsx1.js … pwsx4.js; Hindi and Hinglish: exp_i18n_pwsx.js.
import { DICT } from './exp_i18n.js';
import { DICT_PWSX } from './exp_i18n_pwsx.js';
import * as P1 from './pwsx1.js';
import * as P2 from './pwsx2.js';
import { EXPERIMENTS_PWSXB } from './experiments_pwsxb.js';
Object.assign(DICT, DICT_PWSX);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => tl(K, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
// a step's "done" event, sent once per step (the rig may see the condition on many frames)
const emit = (K, it, type) => { let last = -1; return () => { const i = K.app.runner.i; if (i === last && K.app.runner.state !== 'todo') return; last = i; K.lab.emit(type, { obj: it.id }); }; };
const until = async (K, f, max = 40) => { let t = 0; while (!f() && t < max) { await K.sleep(0.2); t += 0.2; } };
const C8d = N('Ch 4 · Electricity: Magnetic and Heating Effects', 'अध्याय 4 · विद्युत: चुंबकीय और ऊष्मीय प्रभाव', 'Ch 4 · Electricity: Magnetic aur Heating Effects');
const P12 = N('Ch 12 · Magnetic Effects of Electric Current', 'अध्याय 12 · विद्युत धारा के चुंबकीय प्रभाव', 'Ch 12 · Electric Current ke Magnetic Effects');
const C8e = N('Ch 5 · Exploring Forces', 'अध्याय 5 · बलों की खोज', 'Ch 5 · Exploring Forces');
const C8f = N('Ch 6 · Pressure, Winds, Storms, and Cyclones', 'अध्याय 6 · दाब, पवन, तूफ़ान और चक्रवात', 'Ch 6 · Pressure, Winds, Storms aur Cyclones');

export const EXPERIMENTS_PWSX = [
  // ============================================================ Class 8 (7) · an electric bell
  {
    id: 'sx8_electric_bell', subj: 'physics', cls: 8, also: [7], ch: C8d,
    title: X('An electric bell: wire it, ring it, watch it in slow motion'),
    aim: X('To connect an electric bell to two cells and a bell push with your own hands, and find out, in slow motion, why it keeps ringing for as long as you press the switch.'),
    kind: X('Magnetic effect of current: the electric bell'),
    setup(K) {
      const W = Wd(K); const bl = K.add(P1.electricBell({ W, app: K.app }), 0, 0, { y: 0 });
      const leadA = K.add(bl.leads[0], 0.12, -0.55), leadB = K.add(bl.leads[1], -0.12, -0.54);
      const knob = K.add(P1.pullTab(), 0, -0.46), screw = K.add(P1.pullTab(), 0, -0.42), push = K.add(P1.pullTab(), 0.2, -0.6);
      P1.bindBell(bl, knob, screw, push, K.app, { wire: 1, press: [2, 3, 4, 5, 6], ring: [2, 5], slow: 3, watch: 3, screw: [4, 5], silent: 4, rev: 6 },
        { wire: emit(K, bl, 'wired'), ring: emit(K, bl, 'rang'), watch: emit(K, bl, 'watched'), silent: emit(K, bl, 'silent'), rev: emit(K, bl, 'rev') });
      P1.camBy(bl, K.app, [bl.views.all, bl.views.all, bl.views.board, bl.views.contact, bl.views.contact, bl.views.board, bl.views.all]);
      return { bl, leadA, leadB, knob, screw, push };
    },
    steps: [
      { do: X('Kyun? The school bell rings on and on for as long as the peon presses the switch, though a cell only gives a steady current. How? Look at the bell on the board first.'), target: 'bl',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bl.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Two coils of copper wire wound on soft iron (an electromagnet), a soft-iron strip on a spring with a hammer on top, a brass gong, and a screw just touching the spring. Two cells and a bell push lie in front.') },
      { do: X('Clip the red lead and the black lead to the two terminals at the foot of the bell.'), target: 'leadA',
        act: async (K, o) => { await new Promise((r) => { o.bl.unclip(o.leadA); o.bl.clipOn(o.leadA, 0); setTimeout(r, 600); }); await K.sleep(0.4); o.bl.unclip(o.leadB); o.bl.clipOn(o.leadB, 1); await K.sleep(0.8); K.lab.emit('wired', { obj: o.bl.id }); }, ev: { type: 'wired' },
        see: X('Now cells, bell push and bell make one loop. It is still broken at the bell push.') },
      { do: X('Press the bell push and keep it pressed.'), target: 'push',
        act: async (K, o) => { o.bl.press(3); await until(K, () => o.bl.rang >= 6); K.lab.emit('rang', { obj: o.bl.id }); }, ev: { type: 'rang' },
        check: (K, o) => (o.bl.stuck ? { ok: false, see: X('The hammer was pulled once and stays pressed on the gong: only a dull thud.'), why: X('The contact screw presses so hard that the contact never opens. Turn the screw back a little.') } : null),
        see: X('Trrrrr! The hammer strikes the gong again and again, about 30 times a second, for as long as you press.'), why: X('The current makes the coils a magnet. It pulls the soft-iron strip, and the hammer hits the gong.') },
      { do: X('Slide the dial to slow motion (1/40) and press again. Watch the screw in the round bubble.'), target: 'knob',
        act: async (K, o) => { await K.tween(1, (k) => o.bl.setSlow(0.8 * k)); o.bl.press(3); await until(K, () => o.bl.strikesSlow >= 3, 60); K.lab.emit('watched', { obj: o.bl.id }); }, ev: { type: 'watched' },
        see: X('Each time the strip is pulled towards the magnet it leaves the screw: the contact opens with a tiny spark, the current stops, the magnet lets go, the spring pulls the strip back, the contact closes, and it all happens again.'),
        why: X('The bell switches itself off and on. An electromagnet is a magnet only while the current flows; soft iron loses its magnetism at once when the current stops.') },
      { do: X('Turn the contact screw back (slide it) until it no longer touches the spring, and press the switch.'), target: 'screw',
        act: async (K, o) => { const k = (-0.0006 - P1.BELL.cMin) / (P1.BELL.cMax - P1.BELL.cMin); await K.tween(1, (q) => o.bl.setC(o.bl.kc + (k - o.bl.kc) * q)); o.bl.press(2.5); await K.sleep(2.2); K.lab.emit('silent', { obj: o.bl.id }); }, ev: { type: 'silent' },
        see: X('Nothing happens: no sound, no movement, no current.'), why: X('With a gap at the screw, the circuit is open. Current flows only round a closed loop.') },
      { do: X('Now turn the screw in until it just touches the spring, and press again.'), target: 'screw',
        act: async (K, o) => { const k = (0.0008 - P1.BELL.cMin) / (P1.BELL.cMax - P1.BELL.cMin); await K.tween(1, (q) => o.bl.setC(o.bl.kc + (k - o.bl.kc) * q)); o.bl.press(3); await until(K, () => o.bl.rang >= 6); K.lab.emit('rang', { obj: o.bl.id }); }, ev: { type: 'rang' },
        check: (K, o) => (o.bl.stuck ? { ok: false, see: X('The hammer was pulled once and stays pressed on the gong: only a dull thud.'), why: X('The contact screw presses so hard that the contact never opens. Turn the screw back a little.') } : null),
        see: X('It rings again. If you screw it in too far, the hammer is pulled once and stays stuck on the gong.'), why: X('The screw must touch the spring at rest, but let go of it as the strip moves; that is what makes the current go on and off.') },
      { do: X('Swap the two leads at the bell\'s terminals (the current now goes the other way round) and press again.'), target: 'leadB',
        act: async (K, o) => { o.bl.unclip(o.leadA); o.bl.unclip(o.leadB); o.bl.clipOn(o.leadB, 0); await K.sleep(0.7); o.bl.clipOn(o.leadA, 1); await K.sleep(0.8); o.bl.press(3); await until(K, () => o.bl.rang >= 6); K.lab.emit('rev', { obj: o.bl.id }); }, ev: { type: 'rev' },
        see: X('It rings just the same.'), why: X('Reversing the current swaps the north and south poles of the electromagnet, but either pole attracts soft iron, so the bell works either way.') },
    ],
    eq: { word: 'Electric bell', sym: 'current → electromagnet pulls the armature → hammer hits the gong → contact opens → magnet off → spring pulls back → contact closes → …' },
    result: { obs: X('The bell rang about 30 strikes a second while the switch was pressed; in slow motion the contact opened at each pull; with the screw backed off nothing happened; with the leads swapped it still rang.'),
      concl: X('An electric bell uses an electromagnet that makes and breaks its own circuit: the pull of the magnet opens the contact, the spring closes it again, so the hammer strikes the gong again and again.'),
      safety: X('Use only cells. Never connect a bell or its wires to the mains socket.'),
      viva: [{ q: X('Why is the armature made of soft iron and not steel?'), a: X('Soft iron loses its magnetism as soon as the current stops; steel would stay a magnet and the strip would not spring back.') },
        { q: X('What happens if the contact screw does not touch the spring?'), a: X('The circuit stays open: no current, no magnet, no ringing.') }, { q: X('Does a bell ring if the cells are reversed?'), a: X('Yes. The poles of the electromagnet reverse, but both poles attract soft iron.') }] },
  },
  // ============================================================ Class 10 · a DC motor
  {
    id: 'sx10_dc_motor', subj: 'physics', cls: 10, ch: P12,
    title: X('A DC motor: what makes the coil turn, and faster'),
    aim: X('To run a DC motor with your own hands, find the force on its coil with Fleming\'s left-hand rule, and measure how its speed changes with the current and the number of turns, and why it needs a split ring.'),
    kind: X('Force on a current in a magnetic field: the electric motor'),
    setup(K) {
      const W = Wd(K); const mo = K.add(P1.dcMotor({ W, app: K.app }), 0, 0, { y: 0 });
      const sw = K.add(P1.pullTab(), -0.13, -0.52), cellK = K.add(P1.pullTab(), -0.2, -0.6), turnK = K.add(P1.pullTab(), 0.05, -0.5);
      const hm = P1.flemingHand(P1.V(1, 0, 0), P1.V(0, 0, -1), P1.V(0, -1, 0)); hm.scale.setScalar(0.62);
      const hand = K.add(P1.thing(N('Your left hand (Fleming\'s rule)', 'आपका बायाँ हाथ (फ्लेमिंग का नियम)', 'Aapka left hand (Fleming ka rule)'), hm, { hitR: 0.05, hitY: 0.03 }), 0.26, -0.55);
      P1.bindMotor(mo, sw, cellK, turnK, hand, K.app, { switch: 1, hand: 2, rev: 3, cells: 4, turns: 5, slip: 6 },
        { spin: emit(K, mo, 'spin'), hand: emit(K, mo, 'hand'), rev: emit(K, mo, 'rev'), cells: emit(K, mo, 'cells'), turns: emit(K, mo, 'turns'), slip: emit(K, mo, 'slip') });
      const u0 = mo.update; mo.update = (dt, t) => { u0(dt, t); if (K.app.runner.i > 2 && mo.held) { mo.showHand(false); } };
      P1.camBy(mo, K.app, [mo.views.all, mo.views.all, mo.views.coil, mo.views.front, mo.views.all, mo.views.all, mo.views.front]);
      return { mo, sw, cellK, turnK, hand };
    },
    steps: [
      { do: X('Kyun? A ceiling fan, a mixer and a toy car all start turning the moment current flows. What turns them? Look at this motor: two magnets, a coil on an axle, a split copper ring and two carbon brushes.'), target: 'mo',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mo.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('The coil ABCD sits between the north pole (red) and the south pole (blue). Its two ends go to the two halves of the split ring; the brushes press on them.') },
      { do: X('Switch the current on with the switch.'), target: 'sw',
        act: async (K, o) => { o.mo.setOn(true); await until(K, () => Math.abs(o.mo.revS()) > 1); await K.sleep(1.2); K.lab.emit('spin', { obj: o.mo.id }); }, ev: { type: 'spin' },
        check: (K, o) => (Math.abs(o.mo.revS()) < 0.5 ? { ok: false, see: X('The coil does not turn.'), why: X('It stopped with its plane upright, where the brushes sit on the gaps of the split ring and no current flows. Give it a small turn and it starts.') } : null),
        see: X('The coil starts to turn and keeps turning, clockwise as you see it.'), why: X('The current in the coil feels a force in the magnet\'s field: up on one side, down on the other. The two forces turn it.') },
      { do: X('Hold the coil level and put your left hand on side AB, first finger along the field (N to S), second finger along the current.'), target: 'hand',
        act: async (K, o) => { await new Promise((r) => P1.flyT(o.hand, o.mo.handAt().add(P1.V(0.02, 0.0, 0.03)), 0, 0.8, r)); o.hand.g.visible = false; o.mo.showHand(true); await K.sleep(3); K.lab.emit('hand', { obj: o.mo.id }); }, ev: { type: 'hand' },
        see: X('Your thumb points down: the force on side AB is downward, and on side CD, where the current flows the other way, it is upward.'), why: X('Fleming\'s left-hand rule: first finger = field, second finger = current, thumb = force (motion). Opposite forces on the two sides make a couple that turns the coil.') },
      { do: X('Now reverse the current with the reversing switch.'), target: 'sw',
        act: async (K, o) => { o.mo.reverse(); await until(K, () => o.mo.revS() < -1); await K.sleep(1); K.lab.emit('rev', { obj: o.mo.id }); }, ev: { type: 'rev' },
        see: X('The coil slows down, stops for a moment and turns the other way, anticlockwise.'), why: X('Reversing the current reverses the force on each side, so the coil turns the opposite way.') },
      { do: X('Slide the tap on the cell holder to use 1 cell, then 2, then 3 cells. Wait each time for the speed to settle.'), target: 'cellK',
        act: async (K, o) => { for (const k of [0, 0.5, 1]) { o.mo.setCells(k); await K.sleep(0.5); await until(K, () => o.mo.steady != null && o.mo.cellsLog[o.mo.cells], 20); } K.lab.emit('cells', { obj: o.mo.id }); }, ev: { type: 'cells' },
        check: (K, o) => { const a = o.mo.cellsLog[1], b = o.mo.cellsLog[3]; if (!(a && b)) return null; return { ok: true }; },
        see: X('The more cells, the faster it turns: about 2 turns a second with 1 cell, 3.5 with 2 and 4.5 with 3.'), why: X('More cells drive a larger current, and the force on each side is N × B × I × L: a larger current, a larger force.') },
      { do: X('With 3 cells, move the coil tap from 20 turns to 10 and then to 50 turns.'), target: 'turnK',
        act: async (K, o) => { for (const k of [0, 1]) { o.mo.setTurns(k); await K.sleep(0.5); await until(K, () => o.mo.steady != null && o.mo.turnsLog[o.mo.N], 20); } K.lab.emit('turns', { obj: o.mo.id }); }, ev: { type: 'turns' },
        check: (K, o) => (o.mo.cells !== 3 ? { ok: false, see: X('You compared the coils with fewer than 3 cells.'), why: X('Change one thing at a time: keep 3 cells and change only the number of turns.') } : null),
        see: X('With more turns it turns faster: about 2.8 turns a second with 10 turns, 4.6 with 20 and 5.7 with 50.'), why: X('Each turn of wire carries the current through the field and feels the force, so more turns give a larger total force (the extra wire adds a little resistance, so it is not 5 times faster).') },
      { do: X('Last: change the split ring for two whole slip rings with the switch, and watch.'), target: 'sw',
        act: async (K, o) => { o.mo.setSlip(true); await until(K, () => o.mo.stopT > 1.5, 30); K.lab.emit('slip', { obj: o.mo.id }); }, ev: { type: 'slip' },
        see: X('The coil swings past the upright position, is pulled back, rocks to and fro and stops with its plane upright.'), why: X('Without the split ring the current in each side never reverses: after half a turn the force turns the coil back. The split ring reverses the current every half turn, so the coil keeps turning one way.') },
    ],
    eq: { word: 'Force on a current in a field', sym: 'F = B I L (on each side) · N turns: torque ∝ N B I L w' },
    result: { obs: X('The coil turned clockwise and, with the current reversed, anticlockwise. It turned faster with more cells (about 2, 3.5, 4.5 turns a second) and with more turns. With slip rings it rocked and stopped upright.'),
      concl: X('In a motor the force on a current in a magnetic field turns the coil; Fleming\'s left-hand rule gives its direction. A larger current or more turns give a larger force. The split ring reverses the current every half turn so the coil keeps turning.'),
      safety: X('Keep fingers away from a turning coil. Do not leave the motor stalled with the current on: the coil gets hot.'),
      viva: [{ q: X('What does the split ring do?'), a: X('It reverses the current in the coil every half turn, so the coil keeps turning the same way.') },
        { q: X('Give two ways to make a motor turn faster.'), a: X('A larger current (more cells) or more turns on the coil (also a stronger magnet).') }, { q: X('Which rule gives the direction of the force on the coil?'), a: X('Fleming\'s left-hand rule.') }] },
  },
  // ============================================================ Class 8 · a Van de Graaff generator
  {
    id: 'sx8_van_de_graaff', subj: 'physics', cls: 8, also: [9], ch: C8e, topic: 'charge',
    title: X('A Van de Graaff generator: charge a dome, make sparks'),
    aim: X('To charge the dome of a Van de Graaff generator by running its belt, and find out how far a spark can jump, why paper strips stand up and why foil cups fly off.'),
    kind: X('Static charges: charging by friction, like charges repel, electric discharge'),
    setup(K) {
      const W = Wd(K); const vg = K.add(P2.vanDeGraaff({ W, app: K.app }), 0, 0, { y: 0 });
      const cups = K.add(vg.cupStack, 0.3, -0.56); const speedK = K.add(P1.pullTab(), -0.1, -0.6), gapK = K.add(P1.pullTab(), 0.1, -0.6);
      P2.bindVdg(vg, speedK, gapK, K.app, { speed: [1, 4], charge: 1, gap: [2, 4], spark: 2, cups: 3, earth: 4 },
        { charged: emit(K, vg, 'charged'), spark: emit(K, vg, 'sparked'), cups: emit(K, vg, 'cupsgone'), earth: emit(K, vg, 'earthed') });
      P1.camBy(vg, K.app, [vg.views.all, vg.views.all, vg.views.dome, vg.views.all, vg.views.all]);
      return { vg, cups, speedK, gapK };
    },
    steps: [
      { do: X('Kyun? You walk across a carpet, touch a steel door handle, and tik! a small shock. Where did that charge come from, and where did it go? This machine makes a lot of it.'), target: 'vg',
        act: async (K, o) => { K.lab.emit('look', { obj: o.vg.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A rubber belt runs inside a plastic column, up to a smooth aluminium dome. Paper strips are taped on top. A second, smaller sphere on a stand is joined to the earth by a green wire.') },
      { do: X('Slide the speed dial to run the belt fast, and watch the paper strips.'), target: 'speedK',
        act: async (K, o) => { await K.tween(1, (k) => o.vg.setSpeed(k)); await until(K, () => o.vg.V() > 150e3, 30); K.lab.emit('charged', { obj: o.vg.id }); }, ev: { type: 'charged' },
        see: X('The strips lift off the dome and stand out in all directions, like hair standing on end. The dome reaches about 200 kV.'),
        why: X('Rubbing at the bottom roller gives the belt a charge; the belt carries it up and the dome collects it. All the strips get the same charge, and like charges push each other apart.') },
      { do: X('Slowly slide the earthed sphere closer to the dome until a spark jumps.'), target: 'gapK',
        act: async (K, o) => { const n = o.vg.sparks; let k = o.vg.kg; while (o.vg.sparks - n < 3 && k < 1) { k = Math.min(1, k + 0.02); o.vg.setGap(k); await K.sleep(0.15); } await until(K, () => o.vg.sparks - n >= 3, 20); K.lab.emit('sparked', { obj: o.vg.id }); }, ev: { type: 'sparked' },
        check: (K, o) => (o.vg.speed === 0 ? { ok: false, see: X('No spark: the belt is not running, so the dome has no charge.'), why: X('Run the belt first; a spark needs a large charge on the dome.') } : null),
        see: X('Crack! A violet-white spark jumps the gap, the strips fall for a moment, then rise again. The closer the sphere, the more often it sparks.'),
        why: X('Air does not let charge through, until the push on it is huge: about 30,000 volts for each centimetre of gap. Then the air breaks down and the charge rushes to earth as a spark: a small lightning.') },
      { do: X('Put the stack of foil cups on top of the dome.'), target: 'cups',
        act: async (K, o) => { await new Promise((r) => P1.flyT(o.cups, o.vg.dome.clone().add(P1.V(0, 0.12, 0)), 0, 0.8, r)); o.vg.putCups(); if (o.vg.speed < 0.6) o.vg.setSpeed(1); o.vg.setGap(0); await until(K, () => o.vg.cupsGone >= 5, 30); K.lab.emit('cupsgone', { obj: o.vg.id }); }, ev: { type: 'cupsgone' },
        check: (K, o) => (o.vg.speed === 0 ? { ok: false, see: X('The cups stay where they are.'), why: X('With the belt off the dome has no charge to give them. Run the belt.') } : null),
        see: X('The cups fly off one by one, from the top of the stack.'), why: X('Each cup takes charge of the same sign as the dome. Like charges repel, so the top cup is pushed off, then the next.') },
      { do: X('Switch the belt off and touch the dome with the earthed sphere.'), target: 'gapK',
        act: async (K, o) => { await K.tween(0.8, (k) => o.vg.setSpeed(o.vg.ks * (1 - k))); o.vg.setSpeed(0); await K.tween(0.8, (k) => o.vg.setGap(o.vg.kg + (1 - o.vg.kg) * k)); o.vg.setGap(1); await until(K, () => o.vg.V() < 3e3, 10); K.lab.emit('earthed', { obj: o.vg.id }); }, ev: { type: 'earthed' },
        see: X('A last small crack, and the strips fall flat on the dome.'), why: X('The earth takes the charge away. This is earthing: buildings and machines are earthed so that charge does not build up.') },
    ],
    eq: { word: 'Breakdown of air', sym: 'spark when V > 30 kV × gap (cm) · V = Q / C, C = 4πε₀R ≈ 12 pF' },
    result: { obs: X('With the belt running the dome charged to about 200 kV and the strips stood up; sparks jumped gaps of a few centimetres; the foil cups flew off one by one; touched by the earthed sphere it lost its charge.'),
      concl: X('Charge can be built up by rubbing and stored on a conductor. Like charges repel. When the charge is large enough it jumps through the air as a spark to the earth, which is how lightning happens.'),
      safety: X('A Van de Graaff gives a sharp shock. Do not touch it while it runs if you have a heart condition or any electronic device on you. Discharge it with the earthed sphere.'),
      viva: [{ q: X('Why do the paper strips stand up?'), a: X('They all get charge of the same sign and like charges repel.') }, { q: X('What does the earthed sphere do?'), a: X('It gives the charge a path to the earth, as a spark or by touching.') }, { q: X('About how much voltage does a 1 cm spark need in air?'), a: X('About 30,000 volts (30 kV).') }] },
  },
  // ============================================================ Class 8 · a gold-leaf electroscope
  {
    id: 'sx8_electroscope', subj: 'physics', cls: 8, ch: C8e, topic: 'charge',
    title: X('A gold-leaf electroscope: charge it by touching and by induction'),
    aim: X('To charge a gold-leaf electroscope by touching it with a rubbed rod and by induction, earth it with your finger, and use it to find whether a rod is charged and with which charge.'),
    kind: X('Static charges: the electroscope, conduction and induction'),
    setup(K) {
      const W = Wd(K); const es = K.add(P2.electroscope({ W, app: K.app }), 0, 0, { y: 0 }); P2.scopeActions(es);
      const eb = K.add(es.rods[0], -0.22, -0.52), gl = K.add(es.rods[1], -0.22, -0.46), hand = K.add(es.hand, 0.3, -0.5);
      P2.bindScope(es, K.app, { rub: 1, near: 2, touch: 3, earth: 4, induce: 5, test: 6 },
        { rub: emit(K, es, 'rubbed'), near: emit(K, es, 'nearaway'), touch: emit(K, es, 'touched'), earth: emit(K, es, 'earthed'), induce: emit(K, es, 'induced'), test: emit(K, es, 'tested') });
      P1.camBy(es, K.app, [es.views.all, es.views.all, es.views.near, es.views.near, es.views.near, es.views.near, es.views.near]);
      return { es, eb, gl, hand };
    },
    steps: [
      { do: X('Kyun? A comb rubbed in dry hair picks up bits of paper, so it has a charge. But which charge, positive or negative? This instrument can tell. Look at it first.'), target: 'es',
        act: async (K, o) => { K.lab.emit('look', { obj: o.es.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A brass rod goes through an ebonite stopper into a glass jar. Outside it ends in a brass disc; inside, two thin gold leaves hang side by side.') },
      { do: X('Rub the ebonite rod on the woollen cloth.'), target: 'eb',
        act: async (K, o) => { await new Promise((r) => o.es.rubAnim(o.eb, 'wool', r)); K.lab.emit('rubbed', { obj: o.es.id }); }, ev: { type: 'rubbed' },
        see: X('The rod is now charged (it can pick up paper bits).'), why: X('Rubbing moves electrons from the wool to the ebonite: the rod gets a negative charge, the wool a positive one.') },
      { do: X('Hold the rod near the disc (in the clamp), without touching it. Then take it away.'), target: 'eb',
        act: async (K, o) => { await new Promise((r) => o.es.hold(o.eb, 'near', r)); await K.sleep(1.5); await new Promise((r) => o.es.away(o.eb, r)); await K.sleep(1); K.lab.emit('nearaway', { obj: o.es.id }); }, ev: { type: 'nearaway' },
        see: X('Near the disc the leaves spread apart; when the rod goes away they fall together again.'), why: X('The rod\'s negative charge pushes electrons down to the leaves. Both leaves get the same charge and repel. Nothing has left the electroscope, so they close when the rod goes.') },
      { do: X('Now touch the disc with the rod, then take the rod away.'), target: 'eb',
        act: async (K, o) => { await new Promise((r) => o.es.hold(o.eb, 'touch', r)); await K.sleep(1.2); await new Promise((r) => o.es.away(o.eb, r)); await K.sleep(1); K.lab.emit('touched', { obj: o.es.id }); }, ev: { type: 'touched' },
        check: (K, o) => (Math.abs(o.es.Q) < 0.1 ? { ok: false, see: X('The leaves fell together: the electroscope did not keep a charge.'), why: X('The rod had lost its charge. Rub it again on the wool and touch the disc with it.') } : null),
        see: X('The leaves stay apart, even with the rod gone.'), why: X('By touching, some of the rod\'s charge went into the electroscope: it is now charged by conduction, negative like the rod.') },
      { do: X('Touch the disc with your finger, then take your finger away.'), target: 'hand',
        act: async (K, o) => { await new Promise((r) => o.es.finger(true, r)); await K.sleep(1.2); await new Promise((r) => o.es.finger(false, r)); await K.sleep(0.8); K.lab.emit('earthed', { obj: o.es.id }); }, ev: { type: 'earthed' },
        see: X('The leaves collapse at once.'), why: X('Your body is a conductor joined to the earth. The charge flows through you to the earth: this is earthing.') },
      { do: X('Charge it by induction: rod near the disc, touch the disc with your finger, take your finger away, then take the rod away.'), target: 'eb',
        act: async (K, o) => { if (o.eb.q > -0.3) await new Promise((r) => o.es.rubAnim(o.eb, 'wool', r)); await new Promise((r) => o.es.hold(o.eb, 'near', r)); await K.sleep(0.8); await new Promise((r) => o.es.finger(true, r)); await K.sleep(1); await new Promise((r) => o.es.finger(false, r)); await K.sleep(0.6); await new Promise((r) => o.es.away(o.eb, r)); await K.sleep(1); K.lab.emit('induced', { obj: o.es.id }); }, ev: { type: 'induced' },
        check: (K, o) => (o.es.Q <= 0.1 ? { ok: false, see: X('The leaves did not stay apart.'), why: X('The order matters: take your finger away while the rod is still near, and only then remove the rod.') } : null),
        see: X('The leaves stand apart again, though the rod never touched the disc.'), why: X('With the rod near, your finger let electrons escape to the earth. Lifting the finger first trapped the shortage: the electroscope is now positive, the opposite of the rod.') },
      { do: X('Rub the glass rod with silk and hold it near the disc.'), target: 'gl',
        act: async (K, o) => { await new Promise((r) => o.es.rubAnim(o.gl, 'silk', r)); await new Promise((r) => o.es.hold(o.gl, 'near', r)); await K.sleep(1.5); K.lab.emit('tested', { obj: o.es.id }); }, ev: { type: 'tested' },
        check: (K, o) => (o.es.Q <= 0.05 ? { ok: false, see: X('The electroscope was not positively charged, so this test does not tell much.'), why: X('Charge it by induction first (the step before).') } : null),
        see: X('The leaves open wider: the glass rod has the same charge as the electroscope, positive.'), why: X('Glass rubbed with silk becomes positive. A like charge brought near pushes more charge onto the leaves; an unlike one would make them close. That is how an electroscope tells the sign of a charge.') },
    ],
    eq: { word: 'Electroscope', sym: 'like charges repel: leaves apart · earthing: leaves together · induction gives the opposite charge' },
    result: { obs: X('The leaves opened when a charged rod came near and closed when it left; they stayed open after touching; a finger made them collapse; by induction they stayed open with no touch; the glass rod made them open wider.'),
      concl: X('An electroscope shows whether a body is charged, and with a known charge, which sign. It can be charged by conduction (same sign as the rod) or by induction (opposite sign), and earthing removes its charge.'),
      safety: X('Do this on a dry day: in humid air charges leak away and the leaves fall slowly.'),
      viva: [{ q: X('Why do the leaves diverge?'), a: X('They get the same kind of charge and like charges repel.') }, { q: X('What charge does a glass rod rubbed with silk get?'), a: X('Positive.') }, { q: X('In charging by induction, what charge does the electroscope get?'), a: X('The opposite of the charge on the rod.') }] },
  },
  // ============================================================ Class 8 · lightning and the lightning conductor
  {
    id: 'sx8_lightning', subj: 'physics', cls: 8, ch: C8f, world: true, place: 'storm', table: false, topic: 'charge',
    title: X('Lightning over a village, and a lightning conductor'),
    aim: X('To watch a thundercloud charge up over a village, find how far away the lightning is from its thunder, and see why lightning strikes the highest point and how a lightning conductor keeps a building safe.'),
    kind: X('Lightning: electric discharge between clouds and the earth'),
    setup(K) {
      const W = Wd(K); const sv = K.add(P2.lightningVillage({ W, app: K.app }), 0, 0, { y: 0 });
      const clockK = K.add(P1.pullTab(), 0, -0.42, { y: 1.0 }), fitK = K.add(P1.pullTab(), -0.45, -0.3, { y: 1.0 }), markK = K.add(P1.pullTab(), 0.45, -0.36, { y: 1.0 });
      P2.bindStorm(sv, clockK, fitK, markK, K.app, { clock: [1, 3, 5], charge: 1, mark: 2, strike: [3, 5], strikeN: { 3: 1, 5: 2 }, fit: 4, bubble: 1 },
        { charged: emit(K, sv, 'charged'), mark: emit(K, sv, 'marked'), struck: emit(K, sv, 'struck'), fitted: emit(K, sv, 'fitted') });
      P1.camBy(sv, K.app, [sv.views.all, sv.views.cloud, sv.views.far, sv.views.school, sv.views.school, sv.views.school]);
      return { sv, clockK, fitK, markK };
    },
    steps: [
      { do: X('Kyun? Why does lightning so often strike a tall tree or the tallest building, and how can a metal rod on the roof keep a building safe? Look around: a storm is coming over the village.'), target: 'sv',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sv.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Dark clouds, rain, a dirt road, three houses and the village school with a water tank on its roof.') },
      { do: X('Slide the clock on and watch the cloud. The bubble shows what happens inside it.'), target: 'clockK',
        act: async (K, o) => { await K.tween(4, (k) => o.sv.setT(k)); await until(K, () => o.sv.q >= 0.99, 10); K.lab.emit('charged', { obj: o.sv.id }); }, ev: { type: 'charged' },
        see: X('Positive charges gather at the top of the cloud and negative ones at its base. Positive charges gather on the ground below. The field at the ground climbs to 10 kV/m.'),
        why: X('Strong winds carry light ice crystals up and heavy hail down. As they rub past each other, the crystals take a positive charge and the hail a negative one. The negative base pulls positive charge up into the ground beneath it.') },
      { do: X('A flash far away! Press the button the moment you hear its thunder.'), target: 'markK',
        act: async (K, o) => { await until(K, () => o.sv.heardAt, 15); o.sv.mark(); K.lab.emit('marked', { obj: o.sv.id }); }, ev: { type: 'marked' },
        check: (K, o) => { const t = o.sv.marked; if (t == null) return null; const real = 1700 / 340; if (Math.abs(t - real) < 0.8) return null; return { ok: false, see: F3((L, w) => `${w('You pressed after')} ${t.toFixed(1)} s: ${Math.round(t * 340)} m. ${w('The thunder took')} ${real.toFixed(1)} s.`), why: X('Light arrives almost at once, sound at 340 metres a second: every 3 seconds between flash and thunder is about 1 kilometre.') }; },
        see: X('The thunder came about 5 seconds after the flash: the lightning was about 1.7 km away.'), why: X('Light reaches you almost at once; sound travels about 340 metres a second. Distance = 340 m/s × time.') },
      { do: X('The cloud is coming over the school. Slide the clock on again until the cloud is charged.'), target: 'clockK',
        act: async (K, o) => { await K.tween(4, (k) => o.sv.setT(k)); await until(K, () => o.sv.strikes.length >= 2, 15); K.lab.emit('struck', { obj: o.sv.id }); }, ev: { type: 'struck' },
        see: X('A crooked spark creeps down from the cloud and the stroke hits the water tank on the school roof: bricks are blown off and the wall is scorched.'),
        why: X('The charge takes the shortest path through the air to the earth, so it reaches for the highest point near it: the tank on the school roof. Its huge current heats whatever it passes through, and water in the bricks turns to steam and bursts them.') },
      { do: X('Fit a lightning conductor: slide it up the school wall until its copper rod stands above the roof.'), target: 'fitK',
        act: async (K, o) => { await K.tween(2.5, (k) => o.sv.setFit(k)); o.sv.setFit(1); K.lab.emit('fitted', { obj: o.sv.id }); }, ev: { type: 'fitted' },
        see: X('A pointed copper rod stands above the highest point of the roof; a thick copper strip runs from it down the wall into a plate buried in moist earth.') },
      { do: X('Slide the clock on again and watch.'), target: 'clockK',
        act: async (K, o) => { await K.tween(4, (k) => o.sv.setT(k)); await until(K, () => o.sv.strikes.length >= 3, 15); K.lab.emit('struck', { obj: o.sv.id }); }, ev: { type: 'struck' },
        check: (K, o) => (o.sv.strikes[o.sv.strikes.length - 1] !== 'rod' ? { ok: false, see: X('The lightning hit the water tank again.'), why: X('The conductor was not fitted all the way: its rod must stand above the highest point of the building.') } : null),
        see: X('This time the stroke hits the copper rod. The current runs down the strip into the earth, and the school is not harmed.'), why: X('The rod is the highest point and copper conducts easily, so the charge goes to the earth through it and not through the building.') },
    ],
    eq: { word: 'Distance of lightning', sym: 'distance = 340 m/s × time between flash and thunder' },
    result: { obs: X('The cloud\'s base charged negative and its top positive; the thunder of a far flash came about 5 s late (1.7 km); the school without a conductor was hit at the water tank; with a conductor the stroke went down the copper strip into the earth.'),
      concl: X('Lightning is a huge spark between a charged cloud and the earth. It strikes the highest point within reach. A lightning conductor gives it a safe path to the earth.'),
      safety: X('In a thunderstorm, go indoors or into a car or bus. Never shelter under a tall tree or stand in an open field; stay away from water, poles and metal fences; do not use a corded phone or bathe.'),
      viva: [{ q: X('Why do we see lightning before we hear thunder?'), a: X('Light travels much faster than sound (3 × 10⁸ m/s against 340 m/s).') }, { q: X('Why is it unsafe to stand under a tree in a storm?'), a: X('The tree is the highest point, so lightning may strike it and jump to you.') }, { q: X('What is a lightning conductor made of?'), a: X('A pointed metal rod (copper) above the building, a thick strip down the wall and a metal plate buried in moist earth.') }] },
  },
];
EXPERIMENTS_PWSX.push(...EXPERIMENTS_PWSXB);
