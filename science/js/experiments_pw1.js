// DUET Science Lab 360, physics in real places, batch PW1 (Classes 6 and 7, NCERT Curiosity): a bar magnet hanging
// free in the courtyard, three kinds of motion on the playground, thermometers in the sun and the shade, a swing as a
// pendulum, a stick's shadow through the day, and a torch through glass, butter paper and cardboard.
import { DICT } from './exp_i18n.js';
import { DICT_PW1 } from './exp_i18n_pw1.js';
import * as MW from './mathworld.js';
import * as PW from './physworld1.js';
Object.assign(DICT, DICT_PW1);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const P6d = N('Ch 4 · Exploring Magnets', 'अध्याय 4 · चुंबकों की खोज', 'Ch 4 · Magnets ki khoj');
const P6e = N('Ch 5 · Measurement of Length and Motion', 'अध्याय 5 · लंबाई और गति का मापन', 'Ch 5 · Length aur Motion ka Measurement');
const P6g = N('Ch 7 · Temperature and its Measurement', 'अध्याय 7 · ताप और उसका मापन', 'Ch 7 · Temperature aur uska Measurement');
const P7h = N('Ch 8 · Measurement of Time and Motion', 'अध्याय 8 · समय और गति का मापन', 'Ch 8 · Time aur Motion ka Measurement');
const P7k = N('Ch 11 · Light: Shadows and Reflections', 'अध्याय 11 · प्रकाश: छाया और परावर्तन', 'Ch 11 · Light: Shadows aur Reflections');
const P7l = N('Ch 12 · Earth, Moon, and the Sun', 'अध्याय 12 · पृथ्वी, चंद्रमा और सूर्य', 'Ch 12 · Earth, Moon aur Sun');

export const EXPERIMENTS_PW1 = [
  {
    id: 'pw6_magnet_north', subj: 'physics', cls: 6, ch: P6d, world: true, place: 'quad', table: true,
    title: X('A freely hanging magnet finds north'),
    aim: X('To let a bar magnet hanging from a thread turn freely with your own hand, and see that it always comes to rest along North–South.'),
    kind: X('Magnets and directions'),
    setup(K) {
      const hm = K.add(PW.hangingMagnet({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      hm.camView = { p: V3(K, 0.1, 0.42, 0.3), t: V3(K, -0.06, 0.08, -0.1) };
      PW.bindMagnetHands(hm, lever, K.app, { first: 1, again: 2 }, { first: () => K.lab.emit('rest', { obj: hm.id }), again: () => K.lab.emit('again', { obj: hm.id }) });
      return { hm, lever };
    },
    steps: [
      { do: X('A bar magnet hangs from a thread, free to turn. North of the courtyard is marked with a chalk arrow.'), target: 'hm',
        act: async (K, o) => { K.lab.emit('look', { obj: o.hm.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The magnet’s ends are marked N (red) and S (blue).') },
      { do: X('Push the lever to let the magnet turn freely.'), target: 'hm',
        act: async (K, o) => { await new Promise((r) => o.hm.release(110 * Math.PI / 180, r)); K.lab.emit('rest', { obj: o.hm.id }); },
        ev: { type: 'rest' }, see: X('It swings, slows down and comes to rest along North–South, with its N end pointing north.') },
      { do: X('Push the lever again: it is turned the other way and let go.'), target: 'hm',
        act: async (K, o) => { await new Promise((r) => o.hm.release(-140 * Math.PI / 180, r)); K.lab.emit('again', { obj: o.hm.id }); },
        ev: { type: 'again' }, see: X('It comes back to the same North–South line every time.') },
      { do: X('Now an iron bar of the same size hangs there instead.'), target: 'hm',
        act: async (K, o) => { o.hm.toIron(); await new Promise((r) => o.hm.release(70 * Math.PI / 180, r)); o.hm.say([Wd(K)('The iron bar stays where it is left')], '#ffd23f'); K.lab.emit('iron', { obj: o.hm.id }); await K.sleep(1.5); },
        ev: { type: 'iron' }, see: X('The iron bar stays in whatever direction it is left: only a magnet points north–south.') },
    ],
    eq: { word: 'A magnet hung freely', sym: 'N end → North · S end → South' },
    result: { obs: X('Each time it was let go, the magnet came to rest with its N end towards north. The iron bar stayed wherever it was left.'),
      concl: X('A freely suspended magnet always rests along the North–South direction. This is how a compass works, and how travellers found their way.'),
      safety: X('Keep magnets away from phones, cards and computers.'),
      viva: [{ q: X('Which end of a hanging magnet points north?'), a: X('Its north-seeking end, N.') }, { q: X('Does an iron bar point north when hung freely?'), a: X('No.') }, { q: X('Name an instrument that uses this property.'), a: X('A magnetic compass.') }] },
  },
  {
    id: 'pw6_motion_kinds', subj: 'physics', cls: 6, ch: P6e, world: true, place: 'field', table: false,
    title: X('Three kinds of motion on the playground'),
    aim: X('To set a swing, a merry-go-round and a football moving with your own hand, watch the paths they draw, and name each kind of motion.'),
    kind: X('Linear, circular and periodic motion'),
    setup(K) {
      const mk = K.add(PW.motionKinds({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      mk.camView = { p: V3(K, 0.0, 2.4, 2.4), t: V3(K, 0.0, 0.9, -3.6) };
      PW.bindMotionHands(mk, lever, K.app, { start: 1 }, { all: () => K.lab.emit('move', { obj: mk.id }) });
      return { mk, lever };
    },
    steps: [
      { do: X('On the playground: a swing, a merry-go-round and a football.'), target: 'mk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.mk.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Each will move in its own way.') },
      { do: X('Push the lever three times to set each one moving.'), target: 'mk',
        act: async (K, o) => { while (o.mk.n < 3) { if (!o.mk.busy) o.mk.start(); await K.sleep(0.3); } await waitIdle(K, o.mk); await K.sleep(2.5); K.lab.emit('move', { obj: o.mk.id }); },
        ev: { type: 'move' }, see: X('The swing goes to and fro, the merry-go-round goes round and round, and the ball rolls along a straight line.') },
      { do: X('Look at the coloured paths they draw.'), target: 'mk',
        act: async (K, o) => { const w = Wd(K); o.mk.say([`${w('swing')}: ${w('arc')} · ${w('merry-go-round')}: ${w('circle')} · ${w('ball')}: ${w('straight line')}`], OK); K.lab.emit('paths', { obj: o.mk.id }); await K.sleep(3); },
        ev: { type: 'paths' }, see: X('An arc, a circle and a straight line: linear motion is along a straight line; circular motion keeps the same distance from a centre.') },
      { do: X('Which motions repeat themselves after a fixed time?'), target: 'mk',
        act: async (K, o) => { o.mk.say([Wd(K)('swing and merry-go-round: periodic')], OK); K.lab.emit('periodic', { obj: o.mk.id }); await K.sleep(2.5); },
        ev: { type: 'periodic' }, see: X('The swing and the merry-go-round repeat after a fixed time: periodic motion. The merry-go-round’s is also circular.') },
    ],
    eq: { word: 'Kinds of motion', sym: 'straight line → linear · round a centre → circular · repeats → periodic' },
    result: { obs: X('The ball moved along a straight line, a point on the merry-go-round moved in a circle, and the swing moved to and fro again and again.'),
      concl: X('Motion along a straight line is linear; motion keeping the same distance round a fixed point is circular; motion that repeats after fixed intervals is periodic.'),
      safety: X('Never stand in front of or behind a moving swing.'),
      viva: [{ q: X('What kind of motion does a ceiling fan’s blade tip have?'), a: X('Circular (and periodic).') }, { q: X('A train on a straight track?'), a: X('Linear.') }, { q: X('A pendulum of a clock?'), a: X('Periodic.') }] },
  },
  {
    id: 'pw6_sun_shade', subj: 'physics', cls: 6, ch: P6g, world: true, place: 'quad', table: false,
    title: X('Thermometers in the sun and in the shade'),
    aim: X('To move the time of day forward with your own hand and read two thermometers, one in the sun and one in the shade.'),
    kind: X('Reading a thermometer'),
    setup(K) {
      const st = K.add(PW.sunShadeThermo({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      st.camView = { p: V3(K, 0.0, 1.65, 1.3), t: V3(K, 0.1, 1.1, -0.9) };
      const fin = { noon: once(() => K.lab.emit('noon', { obj: st.id })) };
      PW.bindThermoHands(st, knob, K.app, { time: 1 }, { noon: () => fin.noon() });
      return { st, knob, fin };
    },
    steps: [
      { do: X('Two same thermometers in the school courtyard at 8 a.m.: one in the sun, one under the umbrella’s shade.'), target: 'st',
        act: async (K, o) => { K.lab.emit('look', { obj: o.st.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Both read 25 °C. Each small mark is 1 °C.') },
      { do: X('Slide the handle to move the time on to 2 p.m.'), target: 'st',
        act: async (K, o) => { await K.tween(4, (k) => o.st.setK(k)); o.fin.noon(); },
        ev: { type: 'noon' }, see: X('In the sun the red liquid rises to 41 °C; in the shade only to 33 °C.') },
      { do: X('How much hotter is it in the sun?'), target: 'st',
        act: async (K, o) => { o.st.say(['41 °C − 33 °C = 8 °C'], OK); K.lab.emit('diff', { obj: o.st.id }); await K.sleep(2.5); },
        ev: { type: 'diff' }, see: X('8 °C hotter: sunlight heats things it falls on.') },
      { do: X('Our body is normally at about 37 °C. Which thermometer reads above that?'), target: 'st',
        act: async (K, o) => { o.st.say([`${Wd(K)('Sun')} 41 °C > 37 °C`], '#ff8a5a'); K.lab.emit('body', { obj: o.st.id }); await K.sleep(2.5); },
        ev: { type: 'body' }, see: X('The one in the sun: on such a day, stay in the shade and drink water.') },
    ],
    eq: { word: 'Temperature', sym: 'sun 41 °C − shade 33 °C = 8 °C' },
    result: { obs: X('At 8 a.m. both thermometers read 25 °C. By 2 p.m. the one in the sun read 41 °C and the one in the shade 33 °C.'),
      concl: X('A thermometer measures how hot something is, in degrees Celsius. Read it with your eye level with the top of the liquid. Places in the sun get hotter than places in the shade.'),
      safety: X('Do not stand in the hot midday sun for long; wear a cap and drink water.'),
      viva: [{ q: X('What is the unit of temperature we use?'), a: X('Degree Celsius (°C).') }, { q: X('Normal human body temperature?'), a: X('About 37 °C.') }, { q: X('Why is it cooler in the shade?'), a: X('Sunlight does not fall there directly.') }] },
  },
  {
    id: 'pw7_swing_pendulum', subj: 'physics', cls: 7, ch: P7h, world: true, place: 'field', table: false,
    title: X('A swing is a pendulum: timing its swings'),
    aim: X('To pull a swing aside and let it go with your own hand, time its oscillations with a stopwatch, and see how the length of its chains changes the time.'),
    kind: X('Time period of a pendulum'),
    setup(K) {
      const sp = K.add(PW.swingPendulum({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      sp.camView = { p: V3(K, 0.0, 1.5, 1.7), t: V3(K, 0.0, 0.95, -1.5) };
      const fin = { swung: once(() => K.lab.emit('swing', { obj: sp.id })) };
      PW.bindSwingHands(sp, knob, K.app, { pull: 1 }, { swung: () => fin.swung() });
      return { sp, knob, fin };
    },
    steps: [
      { do: X('This swing hangs from chains 2 m long. A swing is a big pendulum.'), target: 'sp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sp.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('One oscillation is one full to-and-fro swing, back to where it started.') },
      { do: X('Slide the handle to pull the seat aside, all the way, and let it go.'), target: 'sp',
        act: async (K, o) => { await K.tween(1.5, (k) => o.sp.setK(k)); await new Promise((r) => o.sp.swing(r)); o.fin.swung(); },
        ev: { type: 'swing' }, see: X('The stopwatch times 5 oscillations: 14.2 s. So one oscillation takes about 2.8 s.') },
      { do: X('Hook the chains shorter, 1.2 m, and let it swing again.'), target: 'sp',
        act: async (K, o) => { await new Promise((r) => o.sp.shorten(r)); await new Promise((r) => o.sp.swing(r)); K.lab.emit('short', { obj: o.sp.id }); },
        ev: { type: 'short' }, see: X('Now 5 oscillations take 11.0 s: one takes 2.2 s. The shorter swing goes to and fro faster.') },
      { do: X('Why can a pendulum keep time?'), target: 'sp',
        act: async (K, o) => { o.sp.say([Wd(K)('same length → same time for every oscillation')], OK); K.lab.emit('time', { obj: o.sp.id }); await K.sleep(2.5); },
        ev: { type: 'time' }, see: X('For a given length, every oscillation takes the same time, even as the swings get smaller.') },
    ],
    eq: { word: 'Time period', sym: 'time period = time for 5 oscillations ÷ 5' },
    result: { obs: X('With 2 m chains, 5 oscillations took 14.2 s (2.8 s each). With 1.2 m chains they took 11.0 s (2.2 s each).'),
      concl: X('The time taken for one oscillation is the time period. It stays the same for a given length, and a shorter pendulum has a shorter time period. Pendulum clocks use this.'),
      safety: X('Keep clear of the path of a moving swing.'),
      viva: [{ q: X('10 oscillations take 20 s. What is the time period?'), a: X('2 s.') }, { q: X('Which swings faster, a long or a short pendulum?'), a: X('A short one.') }, { q: X('What is the unit of time?'), a: X('The second (s).') }] },
  },
  {
    id: 'pw7_torch_sheets', subj: 'physics', cls: 7, ch: P7k, world: true, place: 'room', table: true,
    title: X('A torch through glass, butter paper and cardboard'),
    aim: X('To hold sheets of glass, butter paper and cardboard in a torch beam with your own hand, and sort them as transparent, translucent or opaque.'),
    kind: X('Transparent, translucent and opaque'),
    setup(K) {
      const ts = K.add(PW.torchSheets({ W: Wd(K) }), 0, -0.72), lever = K.add(MW.pullTab(), 0, -0.4);
      ts.camView = { p: V3(K, -0.05, 0.36, 0.42), t: V3(K, -0.02, 0.08, -0.1) };
      PW.bindTorchHands(ts, lever, K.app, { hold: 1 }, { all: () => K.lab.emit('sheets', { obj: ts.id }) });
      return { ts, lever };
    },
    steps: [
      { do: X('A torch shines a bright round patch on a white screen. Sheets of three materials will be held in its path.'), target: 'ts',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ts.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Light travels in straight lines from the torch to the screen.') },
      { do: X('Push the lever to hold each sheet in the beam, one by one.'), target: 'ts',
        act: async (K, o) => { while (o.ts.n < 3) { if (!o.ts.busy) o.ts.next(); await K.sleep(0.3); } await waitIdle(K, o.ts); K.lab.emit('sheets', { obj: o.ts.id }); },
        ev: { type: 'sheets' }, see: X('Through glass the patch stays bright; through butter paper it is dim and fuzzy; the cardboard star makes a sharp dark shadow.') },
      { do: X('Name each kind of material.'), target: 'ts',
        act: async (K, o) => { const w = Wd(K); o.ts.say([`${w('glass')}: ${w('transparent')} · ${w('butter paper')}: ${w('translucent')} · ${w('cardboard')}: ${w('opaque')}`], OK); K.lab.emit('name', { obj: o.ts.id }); await K.sleep(3); },
        ev: { type: 'name' }, see: X('Transparent lets almost all light through, translucent lets some through, opaque lets none through.') },
      { do: X('Why does the cardboard star make a star-shaped shadow?'), target: 'ts',
        act: async (K, o) => { o.ts.say([Wd(K)('light travels in straight lines')], OK); K.lab.emit('why', { obj: o.ts.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Light travels in straight lines and cannot pass through it, so the region behind it, of the same shape, gets no light.') },
    ],
    eq: { word: 'Materials and light', sym: 'transparent · translucent · opaque' },
    result: { obs: X('The bright patch stayed bright with glass, became dim with butter paper, and showed a dark star with the cardboard cut-out.'),
      concl: X('Materials are transparent, translucent or opaque depending on how much light passes through them. Opaque objects form shadows because light travels in straight lines.'),
      safety: X('Never shine a torch or look straight into a bright light, and never look at the Sun.'),
      viva: [{ q: X('Is a frosted glass window transparent or translucent?'), a: X('Translucent.') }, { q: X('Name an opaque object.'), a: X('A wooden door (or a book).') }, { q: X('What do we need to form a shadow?'), a: X('A source of light, an opaque object and a screen.') }] },
  },
  {
    id: 'pw7_stick_shadow', subj: 'physics', cls: 7, ch: P7l, world: true, place: 'khet', table: false,
    title: X('A stick’s shadow from morning to evening'),
    aim: X('To move the time of day with your own hand and watch the shadow of a stick change its length and direction as the Sun moves across the sky.'),
    kind: X('The Sun’s apparent motion and shadows'),
    setup(K) {
      const ss = K.add(PW.stickShadow({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      ss.camView = { p: V3(K, 0.0, 2.6, 0.6), t: V3(K, 0.0, 0.0, -2.6) };
      const fin = { evening: once(() => K.lab.emit('day', { obj: ss.id })) };
      PW.bindShadowHands(ss, knob, K.app, { day: 1 }, { evening: () => fin.evening() });
      return { ss, knob, fin };
    },
    steps: [
      { do: X('A 1 m stick stands in an open field in central India at 8 a.m. Its shadow is long and points west.'), target: 'ss',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ss.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The Sun is low in the east, so the shadow falls to the west.') },
      { do: X('Slide the handle to move the time through the day to 4 p.m. A red chalk mark is left at the shadow’s tip every hour.'), target: 'ss',
        act: async (K, o) => { await K.tween(5, (k) => o.ss.setK(k)); o.fin.evening(); },
        ev: { type: 'day' }, see: X('The shadow gets shorter until noon, then longer again, and turns from west through north to east.') },
      { do: X('When was the shadow shortest, and which way did it point?'), target: 'ss',
        act: async (K, o) => { o.ss.noon(); K.lab.emit('noon', { obj: o.ss.id }); await K.sleep(2.5); },
        ev: { type: 'noon' }, see: X('At 12 noon, about 0.42 m long, pointing north: the Sun was highest, in the south.') },
      { do: X('Why does the shadow move through the day?'), target: 'ss',
        act: async (K, o) => { o.ss.say([Wd(K)('the Earth spins from west to east')], OK); K.lab.emit('why', { obj: o.ss.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('The Earth spins from west to east, so the Sun seems to move across the sky from east to west, and the shadow moves the other way.') },
    ],
    eq: { word: 'Shadows and the Sun', sym: 'Sun low → long shadow · Sun high (noon) → shortest shadow' },
    result: { obs: X('The stick’s shadow was long towards the west in the morning, shortest (pointing north) at noon, and long towards the east in the evening.'),
      concl: X('Shadows fall opposite the Sun. Because the Earth rotates from west to east, the Sun appears to cross the sky from east to west; the noon shadow is the shortest and, in India, points north.'),
      safety: X('Never look straight at the Sun, even for a moment.'),
      viva: [{ q: X('In which direction does a shadow fall in the morning?'), a: X('Towards the west.') }, { q: X('When is a shadow the shortest?'), a: X('At noon.') }, { q: X('Which way does the Earth spin?'), a: X('From west to east.') }] },
  },
];
