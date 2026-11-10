// Physics experiments, batch 9 (Class 7, Curiosity): electricity (inside a torch, a torch lamp and an LED, making a lamp glow,
// an LED lets current pass one way, a home-made switch, conductors and insulators) and heat (conduction along a metal strip,
// hot air rises, convection in water, soil and water in the Sun, seepage through clay, sand and gravel).
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const C3 = N('Ch 3 · Electricity: Circuits and their Components', 'अध्याय 3 · विद्युत: परिपथ और उनके घटक', 'Ch 3 · Electricity: Circuits aur unke Components');
const C7 = N('Ch 7 · Heat Transfer in Nature', 'अध्याय 7 · प्रकृति में ऊष्मा का स्थानांतरण', 'Ch 7 · Nature mein Heat Transfer');
const until = async (K, f, max = 90) => { let t = 0; while (!f() && t < max) { await K.sleep(0.05); t += 0.05; } };
const tag = (K, it, txt, sec = 2.4, up = 0.1, dx = 0.06) => K.showTag(txt, it.g.position.clone().add(V(K, 0, up, 0)), V(K, dx, 0.05, 0), sec);
const Q0 = (K) => new K.THREE.Quaternion();
const red = 0xc62828, blk = 0x222222;
const _S = [X('Filament'), X('Terminals'), X('Longer leg: +'), X('Shorter leg: −'), X('+ terminal (metal cap)'), X('− terminal (flat metal disc)'), X('conductor'), X('insulator'), X('Soil'), X('Water'), X('Clay'), X('Sand'), X('Gravel'), X('In the Sun, 30 min'), X('In the shade, 15 min')];
void _S;
// a loose clip lying on the bench: a wire end moved here is disconnected
function freeEnd(K, x, z) { const it = new K.A.Item('clipend', {}); it.noGrab = true; it.height = 0.001; it.radius = 0.001; K.add(it, x, z); it.terms = { h: { item: it, local: V(K, 0, 0.003, 0), dir: V(K, 0, 1, 0) } }; return it; }
// the tester of Class 7: a cell, a torch lamp and two free wire ends
function tester(K) { const A4 = K.A4; const cells = K.add(A4.cellPack(2), -0.4, -0.78); const lamp = K.add(A4.bulb(), -0.2, -0.8); const pA = K.lay(A4.probe(red), -0.12, -0.48, 0.2), pB = K.lay(A4.probe(blk), -0.04, -0.48, -0.2);
  const ckt = K.circuit({ source: cells, lamp, ends: [{ item: pA, tips: pA.tips }, { item: pB, tips: pB.tips }] }, [[[cells, '+'], [lamp, 'a'], red], [[lamp, 'b'], [pA, 'w'], red], [[cells, '-'], [pB, 'w'], blk]]); return { cells, lamp, pA, pB, ckt }; }

export const EXPERIMENTS_P9 = [
  {
    id: 'p7_torch', subj: 'physics', cls: 7, ch: C3, title: X('Inside a torch: cells in the right order'),
    aim: X('To see what is inside a torch and find the correct way of putting the cells in it.'),
    kind: X('Electric cell and battery'),
    setup(K) { const t = K.add(K.M5.torchKit(), 0, -0.6); const c1 = K.add(K.M5.cell(), -0.06, -0.46), c2 = K.add(K.M5.cell(), 0.06, -0.46); return { t, c1, c2 }; },
    steps: [
      { do: X('Look inside the opened torch: find the switch, the lamp behind the glass, and the space for the cells.'), target: 't', act: (K, o) => tag(K, o.t, '🔦', 1.6, 0.06), ev: { type: 'look' }, see: X('The torch has a slide switch, a small lamp at the front and room for two cells.') },
      { do: X('Look at a cell. Find its two terminals.'), target: 'c1', act: async (K, o) => { await tag(K, o.c1, tl(K, X('+ terminal (metal cap)')), 1.8, 0.03, 0.05); await tag(K, o.c1, tl(K, X('− terminal (flat metal disc)')), 1.8, 0.03, -0.05); }, ev: { type: 'look' },
        see: X('A cell has a positive terminal (+, the small metal cap) and a negative terminal (−, the flat metal disc).') },
      { do: X('Put the two cells in with their negative ends touching, and switch the torch on.'), target: 'c2', act: async (K, o) => { await place(K, o, o.c1, 0, true); await place(K, o, o.c2, 1, false); o.t.cells = [o.c1, o.c2]; o.t.setOn(true); await K.sleep(1.8); o.t.setOn(false); K.lab.emit('switch', { obj: o.t.id }); }, ev: { type: 'switch' },
        see: X('The torch does not light.') },
      { do: X('Turn the second cell round so that the + of one cell touches the − of the next. Switch on.'), target: 'c2', act: async (K, o) => { await place(K, o, o.c2, 1, true); o.t.setOn(true); await K.sleep(2); K.lab.emit('switch', { obj: o.t.id }); }, ev: { type: 'switch' },
        see: X('The torch lights up.'), why: X('Two or more cells joined with the + terminal of one to the − terminal of the next make a battery. Placed the wrong way, they do not push current round the circuit.') },
    ],
    eq: { word: 'A battery', sym: 'cells joined + to − · 2 × 1.5 V = 3 V' },
    result: { obs: X('With the cells in the wrong order the torch did not light; with + of one cell touching − of the next it lit.'),
      concl: X('In a torch the cells must be joined positive to negative to make a battery; then current flows and the lamp glows.'),
      safety: X('Never open or cut a cell, and never connect its two terminals directly with a wire.'),
      viva: [{ q: X('What are the two terminals of a cell?'), a: X('Positive (+) and negative (−).') }, { q: X('What is a battery?'), a: X('Two or more cells joined together, + of one to − of the next.') }, { q: X('What is the voltage of two 1.5 V cells in series?'), a: X('3 V.') }] },
  },
  {
    id: 'p7_lamp_led', subj: 'physics', cls: 7, ch: C3, title: X('Looking at a torch lamp and an LED'),
    aim: X('To find the filament and terminals of a torch lamp, and the positive and negative legs of an LED.'),
    kind: X('Lamp and LED'),
    setup(K) { const lp = K.add(K.M5.lampHolder(), -0.06, -0.6); const ld = K.add(K.M3.ledDiode(), 0.08, -0.6); lp.camView = { p: V(K, 0.07, 0.1, 0.18), t: V(K, 0.07, 0.025, 0) }; return { lp, ld }; },
    steps: [
      { do: X('Look closely at the torch lamp.'), target: 'lp', act: async (K, o) => { await tag(K, o.lp, tl(K, X('Filament')), 2, 0.04, -0.04); await tag(K, o.lp, tl(K, X('Terminals')), 2, 0.012, 0.04); }, ev: { type: 'look' },
        see: X('Inside the glass is a very thin coiled wire, the filament, held by two thicker wires. These lead to its two terminals.'), why: X('When current flows through the filament it becomes so hot that it glows.') },
      { do: X('Now look at the LED.'), target: 'ld', act: async (K, o) => { await tag(K, o.ld, tl(K, X('Longer leg: +')), 2, 0.02, -0.04); await tag(K, o.ld, tl(K, X('Shorter leg: −')), 2, 0.02, 0.04); o.lp.camView = null; }, ev: { type: 'look' },
        see: X('An LED has two legs: the longer leg is its positive terminal and the shorter leg its negative terminal.') },
    ],
    eq: { word: 'Lamp and LED', sym: 'lamp: filament + 2 terminals · LED: long leg +, short leg −' },
    result: { obs: X('The torch lamp has a thin coiled filament connected to two terminals; the LED has a longer (+) and a shorter (−) leg.'),
      concl: X('A lamp glows when current passes through its filament; an LED must be connected the right way round.'),
      safety: X('Handle lamps gently; the glass can break.'),
      viva: [{ q: X('What is the filament?'), a: X('The thin coiled wire inside a lamp that glows.') }, { q: X('Which leg of an LED is positive?'), a: X('The longer leg.') }, { q: X('Why are LEDs used more and more?'), a: X('They use much less electricity and last longer.') }] },
  },
  {
    id: 'p7_lamp_glow', subj: 'physics', cls: 7, ch: C3, title: X('Making a lamp glow: a closed circuit'),
    aim: X('To make a torch lamp glow using a cell, wires and holders, and to see why the circuit must be closed.'),
    kind: X('Open and closed circuits'),
    setup(K) { const ce = K.add(K.M5.cellHolder(), -0.12, -0.62); const lp = K.add(K.M5.lampHolder(), 0.12, -0.6); const f1 = freeEnd(K, 0.0, -0.46), f2 = freeEnd(K, 0.04, -0.72); const [w1, w2] = K.wires([[[ce, '+'], [f1, 'h'], red], [[ce, '-'], [f2, 'h'], blk]]); return { ce, lp, f1, f2, w1, w2 }; },
    steps: [
      { do: X('Join one wire from the + terminal of the cell to one terminal of the lamp holder.'), target: 'lp', act: (K, o) => K.moveLead(o.w1, 'b', o.lp.terms.a), ev: { type: 'lead' }, see: X('The lamp does not glow yet.') },
      { do: X('Join the second wire from the other terminal of the lamp holder to the − terminal of the cell.'), target: 'lp', act: async (K, o) => { await K.moveLead(o.w2, 'b', o.lp.terms.b); await K.sleep(1.4); }, ev: { type: 'lead' },
        see: X('The lamp glows.'), why: X('Now there is a complete path from the + terminal through the lamp back to the − terminal: a closed circuit.') },
      { do: X('Take one wire off the lamp holder.'), target: 'lp', act: async (K, o) => { await K.moveLead(o.w2, 'b', o.f2.terms.h); await K.sleep(1.2); }, ev: { type: 'lead' },
        see: X('The lamp goes off.'), why: X('With a gap anywhere, the circuit is open and no current flows.') },
    ],
    eq: { word: 'Electric circuit', sym: 'cell (+) → lamp → cell (−): closed circuit → current flows' },
    result: { obs: X('The lamp glowed only when both wires connected it to the two terminals of the cell; removing one wire made it go off.'),
      concl: X('Current flows only in a closed circuit — a complete path from one terminal of the cell, through the lamp, to the other terminal.'),
      safety: X('Do not connect the two terminals of the cell directly with a wire.'),
      viva: [{ q: X('What is an open circuit?'), a: X('A circuit with a gap, in which no current flows.') }, { q: X('Why does a fused lamp not glow?'), a: X('Its filament is broken, so the circuit is open.') }, { q: X('What does a switch do?'), a: X('It opens or closes the circuit.') }] },
  },
  {
    id: 'p7_led_way', subj: 'physics', cls: 7, ch: C3, title: X('An LED lets current pass only one way'),
    aim: X('To show that an LED glows only when it is connected the right way round.'),
    kind: X('LED in a circuit'),
    setup(K) { const b = K.add(K.A4.cellPack(2), -0.14, -0.62); const ld = K.add(K.M3.ledDiode(), 0.12, -0.58); const ky = K.add(K.A4.plugKey(), -0.0, -0.46); K.wires([[[b, '+'], [ky, 'a'], red], [[ky, 'b'], [ld, 'a'], red], [[ld, 'b'], [b, '-'], blk]]); return { b, ld, ky }; },
    steps: [
      { do: X('The longer leg of the LED is joined towards the + terminal of the battery. Close the switch.'), target: 'ky', act: async (K, o) => { await K.keyOn(o.ky, true); await K.sleep(1.6); await K.keyOn(o.ky, false); }, ev: { type: 'key' }, see: X('The LED glows brightly.') },
      { do: X('Turn the LED round (swap its legs) and close the switch again.'), target: 'ld', act: async (K, o) => { await K.swapEnds(o.ld, 'a', 'b'); await K.keyOn(o.ky, true); await K.sleep(1.6); await K.keyOn(o.ky, false); }, ev: { type: 'key' },
        see: X('The LED does not glow.'), why: X('An LED lets current pass in one direction only — from its longer (+) leg to its shorter (−) leg.') },
    ],
    eq: { word: 'LED', sym: 'current only from + (long leg) to − (short leg)' },
    result: { obs: X('The LED glowed when its longer leg was towards the + terminal, and not when it was turned round.'),
      concl: X('An LED conducts current in one direction only.'),
      safety: X('Do not connect an LED directly to many cells; it can burn out.'),
      viva: [{ q: X('Does a torch lamp work both ways round?'), a: X('Yes, a filament lamp glows either way.') }, { q: X('What does LED stand for?'), a: X('Light Emitting Diode.') }, { q: X('How do you find the + leg of an LED?'), a: X('It is the longer leg.') }] },
  },
  {
    id: 'p7_switch', subj: 'physics', cls: 7, ch: C3, title: X('A home-made switch'),
    aim: X('To make a simple switch with drawing pins and a safety pin, and use it to turn a lamp on and off.'),
    kind: X('Switch'),
    setup(K) { const ce = K.add(K.M5.cellHolder(), -0.16, -0.62); const lp = K.add(K.M5.lampHolder(), 0.16, -0.62); const sw = K.add(K.M5.pinSwitch(), 0.0, -0.48); K.wires([[[ce, '+'], [sw, 'a'], red], [[sw, 'b'], [lp, 'a'], red], [[lp, 'b'], [ce, '-'], blk]]); return { ce, lp, sw }; },
    steps: [
      { do: X('The switch is two drawing pins on a piece of cardboard, with a safety pin hooked on one of them. It is joined in the circuit with a cell and a lamp.'), target: 'sw', act: (K) => K.sleep(1.4), see: X('The safety pin does not touch the second drawing pin: the lamp is off.') },
      { do: X('Turn the safety pin so that it touches the other drawing pin.'), target: 'sw', act: async (K, o) => { await K.keyOn(o.sw, true); await K.sleep(1.6); }, ev: { type: 'key' }, see: X('The lamp glows.'), why: X('The metal safety pin closes the gap: the circuit is complete.') },
      { do: X('Turn the safety pin away again.'), target: 'sw', act: async (K, o) => { await K.keyOn(o.sw, false); await K.sleep(1.2); }, ev: { type: 'key' }, see: X('The lamp goes off.'), why: X('A switch opens or closes the circuit.') },
    ],
    eq: { word: 'Switch', sym: 'ON = closed circuit · OFF = open circuit' },
    result: { obs: X('The lamp glowed when the safety pin touched both drawing pins and went off when it was moved away.'),
      concl: X('A switch makes a gap in the circuit or closes it, turning the current off or on.'),
      safety: X('Use only a cell (not mains electricity) for such experiments.'),
      viva: [{ q: X('Why is the safety pin made of metal?'), a: X('Metal conducts electricity.') }, { q: X('Would a plastic clip work instead?'), a: X('No, plastic is an insulator.') }, { q: X('Where is the switch of a torch in its circuit?'), a: X('In the path between the cells and the lamp.') }] },
  },
  {
    id: 'p7_conductors', subj: 'physics', cls: 7, ch: C3, title: X('Conductors and insulators'),
    aim: X('To sort everyday objects into conductors and insulators of electricity with a tester.'),
    kind: X('Electrical conductors and insulators'),
    setup(K) { const o = tester(K); const ks = ['clip', 'key', 'coin', 'foil', 'lead', 'eraser', 'scale', 'wood', 'glass']; ks.forEach((k, i) => { o[k] = K.add(K.M5.thing(k), -0.02 + (i % 5) * 0.1, -0.6 - Math.floor(i / 5) * 0.12); }); o.ks = ks; return o; },
    steps: [
      { do: X('Touch the two free ends of the tester together.'), target: 'pA', act: (K, o) => K.touchEnds(o.ckt), ev: { type: 'tested' }, see: X('The lamp glows: the tester works.') },
      { do: X('Touch the free ends to each object in turn: a paper clip, a key, a coin, aluminium foil, pencil lead, an eraser, a plastic scale, a wooden stick and a glass slide.'), target: 'clip', act: async (K, o) => { const out = []; for (const k of o.ks) { await K.touchSample(o.ckt, o[k], { sec: 1.4 }); const g = o.ckt.bright > 0.06; out.push(g); await tag(K, o[k], `${tl(K, o[k].name)}: ${tl(K, X(g ? 'conductor' : 'insulator'))}`, 1.2, 0.03); } o.res = out; }, ev: { type: 'tested' },
        see: X('The lamp glows with the paper clip, key, coin, aluminium foil and pencil lead (dimly), but not with the eraser, plastic scale, wood or glass.'), why: X('Materials that let current pass are conductors (metals, graphite); those that do not are insulators (rubber, plastic, wood, glass).') },
    ],
    eq: { word: 'Conductors and insulators', sym: 'conductors: metals, graphite · insulators: plastic, rubber, wood, glass' },
    result: { obs: X('Metal objects and pencil lead made the lamp glow; the eraser, plastic scale, wooden stick and glass slide did not.'),
      concl: X('Metals and graphite are conductors of electricity; plastic, rubber, wood and glass are insulators.'),
      safety: X('Never test anything with the mains supply; use only cells.'),
      viva: [{ q: X('Why are electric wires covered with plastic?'), a: X('Plastic is an insulator, which protects us from shocks.') }, { q: X('Why do electricians use tools with rubber handles?'), a: X('Rubber is an insulator.') }, { q: X('Is our body a conductor?'), a: X('Yes, which is why mains electricity is dangerous.') }] },
  },
  {
    id: 'p7_conduction', subj: 'physics', cls: 7, ch: C7, title: X('Heat travels along a metal strip'),
    aim: X('To show that heat travels along a metal strip by conduction, using pins stuck on with wax.'),
    kind: X('Conduction'),
    setup(K) { const ws = K.add(K.M5.waxStrip(), -0.05, -0.62); const he = ws.hotEnd(); const lm = K.lamp(he.x, he.z + 0.12); return { ws, lm }; },
    steps: [
      { do: X('Pins are stuck under a metal strip with drops of wax, at equal distances. Put the spirit lamp under the free end of the strip and light it.'), target: 'lm', act: async (K, o) => { const he = o.ws.hotEnd(); await K.moveTo(o.lm, V(K, he.x, BENCH_Y + 0.0008, he.z), null, 0.9); o.lm.home = { p: o.lm.g.position.clone(), q: o.lm.g.quaternion.clone() }; await K.light(o.lm); o.ws.heatEnd = 1; }, ev: { type: 'lit' },
        see: X('The flame heats the end of the strip.') },
      { do: X('Watch the pins (time-lapse).'), target: 'ws', act: async (K, o) => { const l0 = K.app.chem.lapse; K.app.chem.lapse = 8; K.app.lapseShown = 8; let n = 0; await until(K, () => { const d = o.ws.dropped(); if (d > n) { n = d; K.app.audio && K.app.audio.clink && K.app.audio.clink(); } return d >= o.ws.pins.length; }, 60); K.app.chem.lapse = l0; K.app.lapseShown = 0; await tag(K, o.ws, `${o.ws.dropped()} / ${o.ws.pins.length}`, 2, 0.15); }, ev: { type: 'look' },
        see: X('The pins fall one after another, first the one nearest the flame, then the next, and so on.'), why: X('Heat is passed from particle to particle along the strip, from the hot end to the colder end. This is conduction.') },
    ],
    eq: { word: 'Conduction', sym: 'heat flows from the hotter part to the colder part of a solid' },
    result: { obs: X('The wax melted and the pins dropped one by one, starting with the pin nearest the flame.'),
      concl: X('In a solid, heat travels from the hotter end to the colder end by conduction.'),
      safety: X('Do not touch the hot strip. Keep the spirit lamp away from paper and hair.'),
      viva: [{ q: X('Why are cooking pans made of metal?'), a: X('Metals are good conductors of heat.') }, { q: X('Why do pans have plastic or wooden handles?'), a: X('Plastic and wood are poor conductors (insulators) of heat.') }, { q: X('Which pin fell first?'), a: X('The one nearest the flame.') }] },
  },
  {
    id: 'p7_hot_air', subj: 'physics', cls: 7, ch: C7, title: X('Hot air rises'),
    aim: X('To show that air expands and rises when it is heated, using two paper cups balanced on a stick.'),
    kind: X('Convection in air'),
    setup(K) { const cb = K.add(K.M5.cupBalance(), 0, -0.64); const cd = K.add(K.A3.candle({ h: 0.06 }), 0.28, -0.46); return { cb, cd }; },
    steps: [
      { do: X('Two paper cups hang upside down from the ends of a stick, balanced on a stand.'), target: 'cb', act: (K) => K.sleep(1.2), see: X('The stick is level.') },
      { do: X('Light a candle and put it below one of the cups (not too close).'), target: 'cd', act: async (K, o) => { const w = o.cb.cupWorld(1); await K.moveTo(o.cd, V(K, w.x, BENCH_Y + 0.0008, w.z), null, 1); o.cd.home = { p: o.cd.g.position.clone(), q: o.cd.g.quaternion.clone() }; o.cd.setLit(true); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); await K.sleep(1); o.cb.lift = 1; await K.sleep(3); K.lab.emit('lit', { obj: o.cd.id }); }, ev: { type: 'lit' },
        see: X('The cup above the candle slowly moves up.'), why: X('The air above the flame is heated. Warm air expands, becomes lighter and rises, pushing the cup up. This is how convection currents start in air.') },
    ],
    eq: { word: 'Convection in air', sym: 'warm air: expands → less dense → rises' },
    result: { obs: X('The cup above the candle rose and the stick tilted.'),
      concl: X('Air expands and rises when heated. Heat is carried upwards by the moving air (convection).'),
      safety: X('Keep the flame well below the paper cup so that it does not catch fire.'),
      viva: [{ q: X('Why is a room heater placed near the floor?'), a: X('The warm air rises and spreads through the room.') }, { q: X('Why are ventilators placed near the ceiling?'), a: X('Warm, used air rises and goes out through them.') }, { q: X('What causes sea breeze?'), a: X('Warm air over land rises and cooler air from the sea moves in.') }] },
  },
  {
    id: 'p7_convection_water', subj: 'physics', cls: 7, ch: C7, title: X('Convection currents in water'),
    aim: X('To see convection currents in water using a crystal of potassium permanganate.'),
    kind: X('Convection in water'),
    setup(K) { const bk = K.beaker(0, -0.62, 'water', 220, 250); const tp = K.tripod(0.25, -0.62); const bn = K.lamp(0.25, -0.42); const cv = new K.M5.Convection(bk, K.app.scene); K.solver((dt) => { cv.heat = Math.max(0, Math.min(1, (bk.mix.temp - 29) / 18)); cv.update(dt); }); return { bk, tp, bn, cv }; },
    steps: [
      { do: X('Put the beaker of water on the tripod and drop a crystal of potassium permanganate gently near one side of the bottom.'), target: 'bk', act: async (K, o) => { await K.onTripod(o.bk, o.tp, o.bn); o.cv.on = true; await K.sleep(1.6); }, ev: { type: 'place' },
        see: X('The crystal starts to dissolve and a little purple colour stays near the bottom.') },
      { do: X('Heat the water gently just below the crystal (time-lapse).'), target: 'bn', act: async (K, o) => { await K.light(o.bn); await K.wait(8, 6); }, ev: { type: 'lit' },
        see: X('Purple streams rise above the flame, spread across the top and come down on the other side.'), why: X('Water above the flame gets warm, expands and rises; cooler water from the sides sinks to take its place. Heat is carried by the moving water — convection.') },
    ],
    eq: { word: 'Convection in a liquid', sym: 'warm water rises · cool water sinks · a current goes round' },
    result: { obs: X('The purple colour rose in a stream above the flame, spread at the top and sank on the far side.'),
      concl: X('Liquids are heated mainly by convection: the warm liquid rises and the cooler liquid sinks, setting up convection currents.'),
      safety: X('Heat gently and do not touch the hot beaker or tripod.'),
      viva: [{ q: X('Why is the crystal used?'), a: X('Its colour shows how the water moves.') }, { q: X('Why is the heating element of an electric kettle at the bottom?'), a: X('Hot water rises from the bottom and the whole water is heated by convection.') }, { q: X('Can convection happen in solids?'), a: X('No, the particles of a solid cannot move from place to place.') }] },
  },
  {
    id: 'p7_soil_water', subj: 'physics', cls: 7, ch: C7, title: X('Soil and water in the Sun'),
    aim: X('To compare how quickly soil and water warm up in sunlight and cool down in the shade.'),
    kind: X('Heating of land and water'),
    setup(K) { const s = K.add(K.M5.sunBox('soil'), -0.08, -0.62), w = K.add(K.M5.sunBox('water'), 0.08, -0.62); const T = K.THREE; const sun = new T.Mesh(new T.CircleGeometry(0.2, 32), new T.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending })); sun.rotation.x = -Math.PI / 2; sun.position.set(0, BENCH_Y + 0.002, -0.62); K.app.scene.add(sun); K.extras.push(sun); return { s, w, sun }; },
    steps: [
      { do: X('Two similar containers hold dry soil and water, each with a thermometer. Note the temperatures.'), target: 's', act: async (K, o) => { await tag(K, o.s, `${tl(K, X('Soil'))}: ${o.s.read()} °C`, 1.8, 0.2, -0.06); await tag(K, o.w, `${tl(K, X('Water'))}: ${o.w.read()} °C`, 1.8, 0.2); }, ev: { type: 'look' }, see: X('Both are at 30 °C.') },
      { do: X('Keep both in bright sunlight for 30 minutes (time-lapse) and read the thermometers.'), target: 'sun', act: async (K, o) => { o.sun.material.opacity = 0.35; o.s.sun = o.w.sun = true; await K.wait(15, 120); await tag(K, o.s, `${tl(K, X('In the Sun, 30 min'))}: ${o.s.read()} °C`, 2, 0.2, -0.06); await tag(K, o.w, `${o.w.read()} °C`, 2, 0.2); }, ev: { type: 'look' },
        see: X('The soil warms up a lot (to about 52 °C) but the water only to about 39 °C.') },
      { do: X('Now move both into the shade for 15 minutes (time-lapse).'), target: 's', act: async (K, o) => { o.sun.material.opacity = 0; o.s.sun = o.w.sun = false; await K.wait(7.5, 120); await tag(K, o.s, `${tl(K, X('In the shade, 15 min'))}: ${o.s.read()} °C`, 2, 0.2, -0.06); await tag(K, o.w, `${o.w.read()} °C`, 2, 0.2); }, ev: { type: 'look' },
        see: X('The soil cools quickly, back to about 30 °C, while the water is still warmer (about 33 °C).'), why: X('Land heats up and cools down faster than water. This difference causes the sea breeze by day and the land breeze at night.') },
    ],
    eq: { word: 'Land and water', sym: 'soil: heats fast, cools fast · water: heats slowly, cools slowly' },
    result: { obs: X('In the Sun the soil reached about 52 °C and the water about 39 °C; in the shade the soil cooled to about 30 °C while the water stayed at about 33 °C.'),
      concl: X('Soil (land) heats up and cools down faster than water. This is the basis of sea and land breezes.'),
      safety: X('Do not look at the Sun. Read the thermometers carefully without taking them out.'),
      viva: [{ q: X('Which blows during the day at the seaside: sea breeze or land breeze?'), a: X('Sea breeze (from the sea to the land).') }, { q: X('Why does the land breeze blow at night?'), a: X('The land cools faster, so the air over the sea is warmer and rises.') }, { q: X('Which warms up faster in the Sun?'), a: X('Soil (land).') }] },
  },
  {
    id: 'p7_seepage', subj: 'physics', cls: 7, ch: C7, title: X('Water seeping through clay, sand and gravel'),
    aim: X('To compare how quickly water seeps through clay, sand and gravel.'),
    kind: X('Seepage (infiltration) of water'),
    setup(K) { const ks = ['clay', 'sand', 'gravel']; const o = {}; ks.forEach((k, i) => { const x = -0.18 + i * 0.18; o[k] = K.add(K.M5.seepFunnel(k), x, -0.66); o['c' + k] = K.add(K.MC.cylinder100(), x, -0.66); o[k].to = o['c' + k]; }); o.bk = K.beaker(0.36, -0.46, 'water', 450, 500); o.ks = ks; return o; },
    steps: [
      { do: X('Three funnels are packed with clay, sand and gravel, each over a measuring cylinder. Pour 100 mL of water into each funnel.'), target: 'bk', act: async (K, o) => { for (const k of o.ks) { const f = o[k]; const p = f.g.localToWorld(V(K, 0, 0.36, 0)); const q = new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 0, 1), 1.2);
          o.bk.pourLimit = 0; await K.moveTo(o.bk, V(K, p.x + 0.13, p.y, p.z), q, 0.9); // tilt into place without spilling, then bring the lip right over the funnel
          const lip = o.bk.lipLow(V(K, 0, 0, 0)), m = f.mouthWorld(V(K, 0, 0, 0)); await K.moveTo(o.bk, o.bk.g.position.clone().add(V(K, m.x - lip.x, 0, m.z - lip.z)), q, 0.3);
          K.app.audio && K.app.audio.pour && K.app.audio.pour(); o.bk.pourLimit = 100; for (let i = 0; i < 160 && o.bk.pourLimit > 0.05; i++) await K.sleep(0.05); o.bk.pourLimit = 0; } await K.home(o.bk, 0.9); o.bk.pourLimit = null; K.lab.emit('pour', { obj: o.bk.id }); }, ev: { type: 'pour' },
        see: X('Water stands on top of each material and starts to seep through.') },
      { do: X('Wait for one minute (time-lapse) and read the water collected in each cylinder.'), target: 'cgravel', act: async (K, o) => { await K.wait(6, 10); for (const k of o.ks) await tag(K, o['c' + k], `${tl(K, X(k[0].toUpperCase() + k.slice(1)))}: ${Math.round(o['c' + k].ml)} mL`, 1.6, 0.24); }, ev: { type: 'look' },
        see: X('Through gravel nearly all 100 mL has passed, through sand most of it, but through clay only a little (about 10 mL).'), why: X('Gravel has large spaces between its particles, sand smaller ones, and clay very tiny ones, so water seeps fastest through gravel and slowest through clay.') },
    ],
    eq: { word: 'Seepage', sym: 'rate of seepage: gravel > sand > clay' },
    result: { obs: X('After one minute about 100 mL had passed through gravel, about 90 mL through sand and only about 10 mL through clay.'),
      concl: X('Water seeps through gravel fastest and through clay slowest, because of the size of the spaces between the particles. This is why clayey soil gets waterlogged and sandy soil dries fast.'),
      safety: X('Pour slowly so that the material does not overflow.'),
      viva: [{ q: X('Which soil holds water best?'), a: X('Clay.') }, { q: X('How does seepage help groundwater?'), a: X('Rainwater seeps down through soil and fills the spaces in rocks below (aquifers).') }, { q: X('Why do roads with gravel drain quickly?'), a: X('Water seeps quickly through gravel.') }] },
  },
];
// put a cell into the torch (slot 0 or 1), the right way round (+ towards the lamp) or not
async function place(K, o, c, i, right) { const w = o.t.g.localToWorld(o.t.slot(i)); const q = new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), right ? 0 : Math.PI); await K.moveTo(c, V(K, w.x, w.y - 0.0072, w.z), q, 0.9); c.home = { p: c.g.position.clone(), q: c.g.quaternion.clone() }; c.inTorch = true; c.dirOK = right; }
