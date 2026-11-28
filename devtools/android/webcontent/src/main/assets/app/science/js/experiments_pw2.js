// DUET Science Lab 360, physics in real places, batch PW2 (Classes 8, 9 and 10): friction when pulling a handcart,
// pressure of a brick on sand, work done lifting a bucket to a roof with a pulley, an echo from a wall, and a coin that
// seems to rise in a bucket of water.
import { DICT } from './exp_i18n.js';
import { DICT_PW2 } from './exp_i18n_pw2.js';
import * as MW from './mathworld.js';
import * as PW from './physworld2.js';
Object.assign(DICT, DICT_PW2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const waitIdle = async (K, it) => { while (it.busy) await K.sleep(0.1); };
const P8e = N('Ch 5 · Exploring Forces', 'अध्याय 5 · बलों की खोज', 'Ch 5 · Exploring Forces');
const P8f = N('Ch 6 · Pressure, Winds, Storms, and Cyclones', 'अध्याय 6 · दाब, पवन, तूफ़ान और चक्रवात', 'Ch 6 · Pressure, Winds, Storms aur Cyclones');
const P9g = N('Ch 7 · Work, Energy and Simple Machines', 'अध्याय 7 · कार्य, ऊर्जा और सरल मशीनें', 'Ch 7 · Work, Energy aur Simple Machines');
const P9j = N('Ch 10 · Sound Waves: Characteristics and Applications', 'अध्याय 10 · ध्वनि तरंगें: विशेषताएँ और अनुप्रयोग', 'Ch 10 · Sound Waves: Characteristics aur Applications');
const P10i = N('Ch 9 · Light – Reflection and Refraction', 'अध्याय 9 · प्रकाश – परावर्तन तथा अपवर्तन', 'Ch 9 · Light – Reflection aur Refraction');

export const EXPERIMENTS_PW2 = [
  {
    id: 'pw8_handcart', subj: 'physics', cls: 8, ch: P8e, world: true, place: 'quad', table: false,
    title: X('Pulling a handcart: how strong is friction?'),
    aim: X('To pull a handcart through a spring balance with your own hand, find the force needed to start it moving, and see how the load changes friction.'),
    kind: X('Friction and the spring balance'),
    setup(K) {
      const hc = K.add(PW.handcart({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      hc.camView = { p: V3(K, 0.9, 1.7, 0.5), t: V3(K, 0.0, 0.7, -2.0) };
      const fin = { moved: once(() => K.lab.emit('moved', { obj: hc.id })) };
      PW.bindCartHands(hc, knob, K.app, { pull: 1 }, { moved: () => fin.moved() });
      return { hc, knob, fin };
    },
    steps: [
      { do: X('A vegetable seller’s handcart. A rope from its handle runs to a spring balance that shows how hard you pull.'), target: 'hc',
        act: async (K, o) => { K.lab.emit('look', { obj: o.hc.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The spring balance reads in newtons (N).') },
      { do: X('Slide the handle slowly to pull harder and harder.'), target: 'hc',
        act: async (K, o) => { await new Promise((r) => o.hc.pullTo(25, r)); o.fin.moved(); },
        ev: { type: 'moved' }, see: X('Up to 24 N nothing happens: friction holds the cart back. At 25 N the empty cart starts to move.') },
      { do: X('Now four sacks of onions are loaded. Pull again.'), target: 'hc',
        act: async (K, o) => { await new Promise((r) => o.hc.load(r)); await new Promise((r) => o.hc.pullTo(70, r)); K.lab.emit('loaded', { obj: o.hc.id }); },
        ev: { type: 'loaded' }, see: X('The loaded cart needs 70 N before it moves: the heavier it presses on the ground, the larger the friction.') },
      { do: X('Once it is moving, is it easier to keep it going?'), target: 'hc',
        act: async (K, o) => { o.hc.say([Wd(K)('moving: about 0.8 × the starting pull')], OK); K.lab.emit('kinetic', { obj: o.hc.id }); await K.sleep(2.5); },
        ev: { type: 'kinetic' }, see: X('Yes: the spring balance falls a little once the cart rolls. Friction is largest just before something starts to move.') },
    ],
    eq: { word: 'Friction', sym: 'empty cart 25 N · loaded cart 70 N' },
    result: { obs: X('The empty cart started moving at 25 N and the loaded cart at 70 N. While moving, the pull needed was a little less.'),
      concl: X('Friction opposes motion between surfaces in contact. It grows when the surfaces are pressed together harder, and it is a little smaller once things are moving.'),
      safety: X('Never pull a loaded cart on a slope or into the road.'),
      viva: [{ q: X('What instrument measures force?'), a: X('A spring balance.') }, { q: X('Why do wheels make a cart easier to move?'), a: X('Rolling friction is much smaller than sliding friction.') }, { q: X('What is the unit of force?'), a: X('The newton (N).') }] },
  },
  {
    id: 'pw8_brick_sand', subj: 'physics', cls: 8, ch: P8f, world: true, place: 'field', table: false,
    title: X('A brick on sand: same force, different pressure'),
    aim: X('To press the same brick into sand on its three faces with your own hand, compare the dents, and work out the pressure in each case.'),
    kind: X('Pressure = force ÷ area'),
    setup(K) {
      const bs = K.add(PW.brickSand({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      bs.camView = { p: V3(K, 0.0, 1.45, 0.25), t: V3(K, 0.0, 0.15, -1.25) };
      PW.bindBrickHands(bs, lever, K.app, { press: 1 }, { all: () => K.lab.emit('press', { obj: bs.id }) });
      return { bs, lever };
    },
    steps: [
      { do: X('A clay brick, 23 cm × 11 cm × 7.5 cm, weighs about 30 N. Below it is a sand pit.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The brick has three different faces it can stand on.') },
      { do: X('Push the lever three times to press the brick into the sand on each face.'), target: 'bs',
        act: async (K, o) => { while (o.bs.n < 3) { if (!o.bs.busy) o.bs.press(); await K.sleep(0.2); } await waitIdle(K, o.bs); K.lab.emit('press', { obj: o.bs.id }); },
        ev: { type: 'press' }, see: X('Lying flat it makes a shallow dent; standing on its end it sinks deepest.') },
      { do: X('Work out the pressure on each face.'), target: 'bs',
        act: async (K, o) => { o.bs.say(['30 N ÷ 0.0253 m² ≈ 1,190 Pa', '30 N ÷ 0.00825 m² ≈ 3,640 Pa'], ['#ffd23f', OK]); K.lab.emit('pressure', { obj: o.bs.id }); await K.sleep(3); },
        ev: { type: 'pressure' }, see: X('The same force on a smaller area gives a larger pressure: about 3 times larger on the smallest face.') },
      { do: X('Why does a school bag have broad straps, and a nail a sharp point?'), target: 'bs',
        act: async (K, o) => { o.bs.say([Wd(K)('pressure = force ÷ area')], OK); K.lab.emit('why', { obj: o.bs.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Broad straps spread the weight over a large area (less pressure on the shoulders); a sharp point puts the force on a tiny area (huge pressure).') },
    ],
    eq: { word: 'Pressure', sym: 'pressure = force ÷ area (N/m² = pascal, Pa)' },
    result: { obs: X('With the same weight of 30 N, the brick made the shallowest dent lying flat and the deepest standing on its smallest face.'),
      concl: X('Pressure is the force acting on a unit area: pressure = force ÷ area. The same force gives more pressure on a smaller area.'),
      safety: X('Bricks are heavy: lift them with both hands and keep your feet clear.'),
      viva: [{ q: X('What is the unit of pressure?'), a: X('The pascal (Pa), 1 N/m².') }, { q: X('Why do camels have broad feet?'), a: X('To spread their weight and not sink into sand.') }, { q: X('Why is a knife sharpened?'), a: X('A thin edge gives a large pressure.') }] },
  },
  {
    id: 'pw9_pulley_roof', subj: 'physics', cls: 9, ch: P9g, world: true, place: 'quad', table: false,
    title: X('Lifting a bucket to the roof with a pulley'),
    aim: X('To pull a rope over a pulley with your own hand and lift a 10 kg bucket of sand 5 m to a roof, and work out the work done.'),
    kind: X('Work and potential energy'),
    setup(K) {
      const wp = K.add(PW.roofPulley({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      wp.camView = { p: V3(K, 2.6, 2.2, 3.6), t: V3(K, 0.0, 3.2, -2.0) };
      const fin = { up: once(() => K.lab.emit('up', { obj: wp.id })) };
      PW.bindPulleyHands(wp, knob, K.app, { pull: 1 }, { up: () => fin.up() });
      return { wp, knob, fin };
    },
    steps: [
      { do: X('At a house being built, a pulley hangs from a beam above the roof, 5 m up. A bucket of sand, 10 kg, stands below it.'), target: 'wp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.wp.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Its weight is 10 kg × 9.8 m/s² = 98 N.') },
      { do: X('Slide the handle to pull the rope and lift the bucket to the roof.'), target: 'wp',
        act: async (K, o) => { await K.tween(4, (k) => o.wp.setK(k)); o.fin.up(); },
        ev: { type: 'up' }, see: X('You pull 5 m of rope with a force of 98 N, and the bucket rises 5 m.') },
      { do: X('How much work did you do?'), target: 'wp',
        act: async (K, o) => { o.wp.say(['W = F × s = 98 N × 5 m = 490 J'], OK); K.lab.emit('work', { obj: o.wp.id }); await K.sleep(2.5); },
        ev: { type: 'work' }, see: X('490 joules of work, now stored in the bucket as potential energy (m g h = 10 × 9.8 × 5 = 490 J).') },
      { do: X('A single fixed pulley does not make the force smaller. Why use it?'), target: 'wp',
        act: async (K, o) => { o.wp.say([Wd(K)('it changes the direction of the force')], OK); K.lab.emit('why', { obj: o.wp.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('It changes the direction: you pull down from the ground, using your weight, instead of lifting up from the roof.') },
    ],
    eq: { word: 'Work', sym: 'W = F × s = 98 N × 5 m = 490 J = m g h' },
    result: { obs: X('A pull of 98 N over 5 m of rope lifted the 10 kg bucket 5 m: 490 J of work.'),
      concl: X('Work is done when a force moves something in its direction: W = F × s. Lifting a mass m through a height h gives it potential energy m g h.'),
      safety: X('Never stand under a load being lifted.'),
      viva: [{ q: X('What is the unit of work?'), a: X('The joule (J).') }, { q: X('Work done to lift 20 kg by 2 m?'), a: X('392 J (20 × 9.8 × 2).') }, { q: X('Does a fixed pulley reduce the effort?'), a: X('No, it changes its direction.') }] },
  },
  {
    id: 'pw9_echo_wall', subj: 'physics', cls: 9, ch: P9j, world: true, place: 'field', table: false,
    title: X('An echo from a wall: the speed of sound'),
    aim: X('To clap in front of a wall 34 m away with your own hand, time the echo, and work out the speed of sound.'),
    kind: X('Echo and speed of sound'),
    setup(K) {
      const ew = K.add(PW.echoWall({ W: Wd(K) }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), 0, -0.3);
      ew.camView = { p: V3(K, 3.0, 4.0, 4.0), t: V3(K, 0.0, 1.5, -18) };
      PW.bindEchoHands(ew, lever, K.app, { clap: 1 }, { echo: () => K.lab.emit('echo', { obj: ew.id }) });
      return { ew, lever };
    },
    steps: [
      { do: X('A tall brick wall stands across the playground, 34 m from you.'), target: 'ew',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ew.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Sound reflects from large hard surfaces like this wall.') },
      { do: X('Push the lever to clap once. Watch the sound go and come back (shown 25 times slower).'), target: 'ew',
        act: async (K, o) => { await new Promise((r) => o.ew.clap(r)); K.lab.emit('echo', { obj: o.ew.id }); },
        ev: { type: 'echo' }, see: X('The sound travels to the wall and back, 68 m in all. The echo is heard 0.20 s after the clap.') },
      { do: X('Work out the speed of sound.'), target: 'ew',
        act: async (K, o) => { o.ew.say(['v = 2 × 34 m ÷ 0.20 s = 340 m/s'], OK); K.lab.emit('speed', { obj: o.ew.id }); await K.sleep(2.5); },
        ev: { type: 'speed' }, see: X('About 340 m/s in air.') },
      { do: X('How far must a wall be for a separate echo?'), target: 'ew',
        act: async (K, o) => { o.ew.say(['0.1 s × 340 m/s ÷ 2 = 17 m'], '#ffd23f'); K.lab.emit('min', { obj: o.ew.id }); await K.sleep(2.5); },
        ev: { type: 'min' }, see: X('Our ear keeps a sound for about 0.1 s, so the wall must be at least about 17 m away.') },
    ],
    eq: { word: 'Speed of sound', sym: 'v = 2d ÷ t = 2 × 34 m ÷ 0.20 s = 340 m/s' },
    result: { obs: X('The echo from the wall 34 m away came back 0.20 s after the clap.'),
      concl: X('An echo is sound reflected from a large surface. Timing it gives the speed of sound: v = 2d ÷ t, about 340 m/s in air. A separate echo needs the surface at least about 17 m away.'),
      safety: X('Do not shout or make loud sounds close to someone’s ears.'),
      viva: [{ q: X('An echo comes back after 1 s. How far is the cliff?'), a: X('About 170 m.') }, { q: X('Name a use of echoes.'), a: X('SONAR, or bats finding their way.') }, { q: X('Does sound travel in empty space?'), a: X('No, it needs a medium.') }] },
  },
  {
    id: 'pw10_coin_bucket', subj: 'physics', cls: 10, ch: P10i, world: true, place: 'kitchen', table: true,
    title: X('A coin in a bucket seems to rise'),
    aim: X('To pour water into a bucket with a coin at the bottom with your own hand, and see the coin seem to rise because light bends as it leaves the water.'),
    kind: X('Refraction: real and apparent depth'),
    setup(K) {
      const cb = K.add(PW.coinBucket({ W: Wd(K) }), 0, -0.72), knob = K.add(MW.pullTab(), 0, -0.4);
      cb.camView = { p: V3(K, 0.35, 0.62, 0.45), t: V3(K, 0.0, 0.1, -0.1) };
      const fin = { full: once(() => K.lab.emit('full', { obj: cb.id })) };
      PW.bindCoinHands(cb, knob, K.app, { pour: 1 }, { full: () => fin.full() });
      return { cb, knob, fin };
    },
    steps: [
      { do: X('A ₹5 coin lies at the bottom of an empty steel bucket.'), target: 'cb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cb.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Look at it from above, a little to one side.') },
      { do: X('Slide the handle to pour water into the bucket, 30 cm deep.'), target: 'cb',
        act: async (K, o) => { await K.tween(3, (k) => o.cb.setK(k)); o.fin.full(); },
        ev: { type: 'full' }, see: X('As the water rises, the coin seems to rise with it: it looks nearer than it really is.') },
      { do: X('How deep does the coin look?'), target: 'cb',
        act: async (K, o) => { o.cb.say(['30 cm ÷ 1.33 ≈ 22.6 cm'], OK); K.lab.emit('depth', { obj: o.cb.id }); await K.sleep(2.5); },
        ev: { type: 'depth' }, see: X('Seen from above it looks about 22.6 cm deep: real depth ÷ refractive index of water (1.33).') },
      { do: X('Why does it look raised?'), target: 'cb',
        act: async (K, o) => { o.cb.say([Wd(K)('light bends away from the normal as it leaves water')], OK); K.lab.emit('why', { obj: o.cb.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Light from the coin bends away from the normal as it passes from water into air. Your eye follows the bent ray back to a point higher up.') },
    ],
    eq: { word: 'Apparent depth', sym: 'apparent depth = real depth ÷ n = 30 cm ÷ 1.33 ≈ 22.6 cm' },
    result: { obs: X('With 30 cm of water, the coin seemed to be only about 22.6 cm below the surface.'),
      concl: X('Light bends (refracts) when it passes from one medium into another. Coming out of water into air it bends away from the normal, so things under water look raised.'),
      safety: X('Ponds look shallower than they are: never jump into water you cannot see the bottom of.'),
      viva: [{ q: X('What is the refractive index of water?'), a: X('About 1.33.') }, { q: X('Why does a pond look shallower than it is?'), a: X('Refraction makes the bottom look raised.') }, { q: X('Into which medium does light bend towards the normal?'), a: X('The optically denser one (e.g. from air into water).') }] },
  },
];
