// DUET Science Lab 360, physics in real places, batch PW3 (Classes 6 to 10): hand spans, footsteps and a tape in the
// classroom; a magnet's poles found with a compass; a full-length mirror; sea and land breezes on a beach; a periscope over a
// wall; a charged balloon and a stream of water; catching a cricket ball; a see-saw; a rainbow in a sprinkler; a wiring
// board with bulbs in parallel; timing a ball dropped from a school building. What the student does decides what happens:
// a step is done only when it has really been done (see devtools/PHYSICS_WORLD.md).
import { DICT } from './exp_i18n.js';
import { DICT_PW3 } from './exp_i18n_pw3.js';
import * as MW from './mathworld.js';
import * as PW from './physworld3.js';
Object.assign(DICT, DICT_PW3);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const once = (f) => { let d = false; return (...a) => { if (!d) { d = true; f(...a); } }; };
const OK = '#8be07a';
const P6d = N('Ch 4 · Exploring Magnets', 'अध्याय 4 · चुंबकों की खोज', 'Ch 4 · Magnets ki khoj');
const P6e = N('Ch 5 · Measurement of Length and Motion', 'अध्याय 5 · लंबाई और गति का मापन', 'Ch 5 · Length aur Motion ka Measurement');
const P7k = N('Ch 11 · Light: Shadows and Reflections', 'अध्याय 11 · प्रकाश: छाया और परावर्तन', 'Ch 11 · Light: Shadows aur Reflections');
const P7g = N('Ch 7 · Heat Transfer in Nature', 'अध्याय 7 · प्रकृति में ऊष्मा का स्थानांतरण', 'Ch 7 · Nature mein Heat Transfer');
const P8e = N('Ch 5 · Exploring Forces', 'अध्याय 5 · बलों की खोज', 'Ch 5 · Exploring Forces');
const P8j = N('Ch 10 · Light: Mirrors and Lenses', 'अध्याय 10 · प्रकाश: दर्पण और लेंस', 'Ch 10 · Light: Mirrors aur Lenses');
const P9d = N('Ch 4 · Describing Motion Around Us', 'अध्याय 4 · हमारे आस-पास की गति का वर्णन', 'Ch 4 · Describing Motion Around Us');
const P9f = N('Ch 6 · How Forces Affect Motion', 'अध्याय 6 · बल गति को कैसे प्रभावित करते हैं', 'Ch 6 · Forces motion ko kaise affect karte hain');
const P9g = N('Ch 7 · Work, Energy and Simple Machines', 'अध्याय 7 · कार्य, ऊर्जा और सरल मशीनें', 'Ch 7 · Work, Energy aur Simple Machines');
const P10j = N('Ch 10 · The Human Eye and the Colourful World', 'अध्याय 10 · मानव नेत्र तथा रंगबिरंगा संसार', 'Ch 10 · Human Eye aur Colourful World');
const P10k = N('Ch 11 · Electricity', 'अध्याय 11 · विद्युत', 'Ch 11 · Electricity');

export const EXPERIMENTS_PW3 = [
  {
    id: 'pw6_measure_class', subj: 'physics', cls: 6, ch: P6e, world: true, place: 'room', table: true,
    title: X('Measuring the classroom: hand spans, footsteps and a tape'),
    aim: X('To measure the teacher’s table with your own hand spans and with a measuring tape, and the classroom with your footsteps, and see why everyone needs the same standard unit.'),
    kind: X('Standard units of length'),
    setup(K) {
      const ms = K.add(PW.measureClass({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.46), lever = K.add(MW.pullTab(), -0.42, -0.5);
      const fin = { span: once(() => K.lab.emit('span', { obj: ms.id })), tape: once(() => K.lab.emit('tape', { obj: ms.id })), feet: once(() => K.lab.emit('feet', { obj: ms.id })) };
      PW.bindMeasureHands(ms, knob, lever, K.app, { span: 1, teacher: 2, tape: 3, feet: 4 }, { span: () => fin.span(), teacher: () => K.lab.emit('teacher', { obj: ms.id }), tape: () => fin.tape(), feet: () => fin.feet() });
      return { ms, knob, lever, fin };
    },
    steps: [
      { do: X('The teacher’s table in your classroom. How long is it? First, measure it with your hand.'), target: 'ms',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ms.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Your hand span is the distance from the tip of your thumb to the tip of your little finger, spread out.') },
      { do: X('Slide the handle to put your hand down span after span, from the left end of the table to the right end.'), target: 'ms',
        act: async (K, o) => { await K.tween(4, (k) => o.ms.setSpan(k)); o.fin.span(); },
        ev: { type: 'span' }, see: X('The table is 15 of your hand spans and a little more, about 15½.'), why: X('Your hand span is about 16 cm. 15 spans make 2.40 m, and a little part of a span is left over.') },
      { do: X('Push the lever: your teacher measures the same table with her hand.'), target: 'ms',
        act: async (K, o) => { await new Promise((r) => o.ms.teacher(r)); K.lab.emit('teacher', { obj: o.ms.id }); },
        ev: { type: 'teacher' }, see: X('For her the same table is only about 12½ hand spans.'), why: X('Her hand span (20 cm) is bigger than yours, so fewer spans fit. A hand span is not the same for everyone, so it is not a good unit.') },
      { do: X('Now hook the measuring tape on the left end of the table and slide the handle to pull it past the right end.'), target: 'ms',
        act: async (K, o) => { o.ms.toTape(); await K.tween(3, (k) => o.ms.setTape(k)); o.fin.tape(); },
        ev: { type: 'tape' }, see: X('Where the tape passes the right end it reads 2.50 m, that is 250 cm.'), why: X('A tape is marked in standard units, metres and centimetres. Anyone who measures this table with a tape gets 2.50 m.') },
      { do: X('Walk heel to toe along the front wall of the classroom: slide the handle from the left wall to the right wall.'), target: 'ms',
        act: async (K, o) => { o.ms.toFeet(); await K.tween(5, (k) => o.ms.setFeet(k)); o.fin.feet(); },
        ev: { type: 'feet' }, see: X('The wall is 38 of your foot lengths and a little more; the teacher’s orange footprints count only 31.'), why: X('The wall is 8.40 m long. Your foot is 22 cm and the teacher’s is 27 cm, so the count depends on whose foot it is.') },
      { do: X('Why did people agree on the metre?'), target: 'ms',
        act: async (K, o) => { o.ms.say([Wd(K)('1 m = 100 cm · the same for everyone, everywhere')], OK); K.lab.emit('why', { obj: o.ms.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Hand spans and footsteps differ from person to person. A standard unit, the metre, is the same everywhere, so everyone gets the same answer.') },
    ],
    eq: { word: 'Length', sym: '1 m = 100 cm · 1 cm = 10 mm' },
    result: { obs: X('The table was about 15½ of my hand spans but about 12½ of my teacher’s. The tape read 2.50 m. The front wall was 38 of my foot lengths but 31 of my teacher’s.'),
      concl: X('Hand spans and footsteps are not the same for everyone, so they give different numbers for the same length. We use standard units: the SI unit of length is the metre (m); 1 m = 100 cm.'),
      safety: X('Hook the tape gently and let it roll back slowly: its metal edge can cut.'),
      viva: [{ q: X('What is the SI unit of length?'), a: X('The metre (m).') }, { q: X('Why is a hand span not a good unit?'), a: X('It is different for different people.') }, { q: X('How many centimetres make a metre?'), a: X('100 cm.') }] },
  },
  {
    id: 'pw6_compass_poles', subj: 'physics', cls: 6, ch: P6d, world: true, place: 'quad', table: true,
    title: X('Which end is north? A magnet’s poles with a compass'),
    aim: X('To slide a compass around an old bar magnet whose marks have worn off, with your own hand, and find out which end is its north pole.'),
    kind: X('Poles of a magnet and the compass'),
    setup(K) {
      const cp = K.add(PW.compassPoles({ W: Wd(K) }), 0, -0.72), cmp = K.add(PW.pocketCompass({ W: Wd(K) }), 0.32, -0.6), lever = K.add(MW.pullTab(), -0.42, -0.5);
      cp.camView = { p: V3(K, 0.14, 0.55, 0.55), t: V3(K, 0.06, 0.0, -0.1) };
      PW.bindCompassHands(cp, cmp, lever, K.app, { a: 1, b: 2, mark: 3, far: 4 }, { a: () => K.lab.emit('endA', { obj: cp.id }), b: () => K.lab.emit('endB', { obj: cp.id }), mark: () => K.lab.emit('mark', { obj: cp.id }), far: () => K.lab.emit('far', { obj: cp.id }) });
      return { cp, cmp, lever };
    },
    steps: [
      { do: X('An old bar magnet: its colours have worn off, so its ends are labelled only A and B. A pocket compass lies on the table.'), target: 'cmp',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cp.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('Far from the magnet, the red end of the compass needle points north, along the chalk arrow.') },
      { do: X('Slide the compass close to end A of the magnet and wait for the needle to settle.'), target: 'cmp',
        act: async (K, o) => { await o.cmp.slideTo(V3(K, -0.11, 0.0008, -0.1), 1.5, K); await K.sleep(2.2); K.lab.emit('endA', { obj: o.cp.id }); },
        ev: { type: 'endA' }, see: X('The needle swings round: one of its ends now points straight at end A.'), why: X('Near the magnet its pull is much stronger than the Earth’s, so the needle lines up with the magnet’s field.') },
      { do: X('Now slide the compass to end B.'), target: 'cmp',
        act: async (K, o) => { await o.cmp.slideTo(V3(K, 0.11, 0.0008, -0.1), 1.8, K); await K.sleep(2.2); K.lab.emit('endB', { obj: o.cp.id }); },
        ev: { type: 'endB' }, see: X('The needle turns the other way round: at end B its other end points to the magnet.'), why: X('The two ends of a magnet are different poles. Unlike poles attract, like poles repel.') },
      { do: X('The red end of the needle is its north pole. Push the lever to chalk N and S on the magnet’s ends.'), target: 'cp',
        act: async (K, o) => { o.cp.mark(); K.lab.emit('mark', { obj: o.cp.id }); await K.sleep(2); },
        ev: { type: 'mark' }, see: X('The end that pulled the red (N) end of the needle is the magnet’s south pole; the other end is its north pole.'), why: X('Unlike poles attract: a north pole pulls a south pole. So the end that attracts the needle’s north end must be a south pole.') },
      { do: X('Slide the compass far away from the magnet, more than 40 cm.'), target: 'cmp',
        act: async (K, o) => { await o.cmp.slideTo(V3(K, 0.55, 0.0008, 0.05), 1.8, K); await K.sleep(2.6); K.lab.emit('far', { obj: o.cp.id }); },
        ev: { type: 'far' }, see: X('Far away, the needle points north again.'), why: X('The Earth itself behaves like a huge magnet. Away from other magnets, a compass needle lines up with the Earth’s field, north–south.') },
    ],
    eq: { word: 'Magnetic poles', sym: 'N ↔ S attract · N ↔ N, S ↔ S repel' },
    result: { obs: X('Near one end the red (N) end of the needle was pulled towards the magnet; near the other end it was pushed away. Far away it pointed north.'),
      concl: X('A magnet has two poles, north and south. Unlike poles attract and like poles repel, so a compass can tell which pole is which. A compass needle is itself a small magnet.'),
      safety: X('Keep magnets away from the compass when you are not testing, or it may lose its magnetism or point wrongly.'),
      viva: [{ q: X('The N end of a compass needle is attracted to a magnet’s end. Which pole is that end?'), a: X('A south pole.') }, { q: X('Do like poles attract or repel?'), a: X('They repel.') }, { q: X('Why does a compass point north when no magnet is near?'), a: X('The Earth behaves like a huge magnet.') }] },
  },
  {
    id: 'pw7_mirror_room', subj: 'physics', cls: 7, ch: P7k, world: true, place: 'room', table: false,
    title: X('A full-length mirror: how far behind is the image?'),
    aim: X('To slide a slate nearer to and farther from a big plane mirror with your own hand, measure how far behind the mirror its image is, and read writing in the mirror.'),
    kind: X('Image in a plane mirror'),
    setup(K) {
      const cm = K.add(PW.classMirror({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      PW.bindMirrorHands(cm, knob, lever, K.app, { back: 1, near: 2, card: 3 }, { back: () => K.lab.emit('back', { obj: cm.id }), near: () => K.lab.emit('near', { obj: cm.id }), card: () => K.lab.emit('card', { obj: cm.id }) });
      return { cm, knob, lever };
    },
    steps: [
      { do: X('A full-length mirror stands in the classroom. A tape on the floor measures from the mirror. A slate with SCIENCE written on it faces the mirror, 1 m away.'), target: 'cm',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cm.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('In the mirror you see the slate, the room behind you and the tape going on behind the glass.') },
      { do: X('Slide the handle to move the slate back from the mirror, to 1.5 m or more.'), target: 'cm',
        act: async (K, o) => { await K.tween(2, (k) => o.cm.setD(1.0 + 0.6 * k)); K.lab.emit('back', { obj: o.cm.id }); },
        ev: { type: 'back' }, see: X('The image moves back too. The reflected tape shows it the same distance behind the mirror as the slate is in front.'), why: X('Light from each point of the slate bounces off the mirror. To your eye it seems to come from a point just as far behind the mirror.') },
      { do: X('Now slide the slate close to the mirror, 0.5 m or less.'), target: 'cm',
        act: async (K, o) => { await K.tween(2, (k) => o.cm.setD(1.6 - 1.15 * k)); K.lab.emit('near', { obj: o.cm.id }); },
        ev: { type: 'near' }, see: X('The image comes closer too: always as far behind the mirror as the slate is in front of it, and always the same size.') },
      { do: X('Read SCIENCE in the mirror. Then push the lever to hold up a card made for an ambulance.'), target: 'cm',
        act: async (K, o) => { await new Promise((r) => o.cm.swap(r)); K.lab.emit('card', { obj: o.cm.id }); },
        ev: { type: 'card' }, see: X('SCIENCE looks back to front in the mirror and the arrow points the other way. The ambulance card is written back to front, so in the mirror it reads AMBULANCE.'), why: X('A mirror swaps left and right (lateral inversion). Ambulances have the word written this way so drivers ahead read it correctly in their mirrors.') },
      { do: X('Can you catch this image on a screen?'), target: 'cm',
        act: async (K, o) => { o.cm.say([Wd(K)('virtual image: behind the mirror, where no light really goes')], OK); K.lab.emit('why', { obj: o.cm.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('No. No light really reaches the place behind the mirror; the image only seems to be there. Such an image is called virtual.') },
    ],
    eq: { word: 'Plane mirror', sym: 'image distance = object distance · same size · upright · left ↔ right' },
    result: { obs: X('Wherever the slate stood, its image appeared as far behind the mirror as the slate was in front. Writing appeared back to front.'),
      concl: X('A plane mirror forms an upright, virtual image of the same size as the object, as far behind the mirror as the object is in front of it, with left and right swapped (lateral inversion).'),
      safety: X('Glass mirrors break into sharp pieces: never lean on one or knock it over.'),
      viva: [{ q: X('You stand 2 m in front of a plane mirror. How far are you from your image?'), a: X('4 m.') }, { q: X('Why is AMBULANCE written back to front on ambulances?'), a: X('So drivers ahead read it correctly in their rear-view mirrors.') }, { q: X('Is the image in a plane mirror real or virtual?'), a: X('Virtual.') }] },
  },
  {
    id: 'pw7_sea_breeze', subj: 'physics', cls: 7, ch: P7g, world: true, place: 'beach', table: false,
    title: X('Sea breeze and land breeze on a beach'),
    aim: X('To move the clock through a day and a night on a real beach with your own hand, read thermometers in the sand and in the sea, and see which way the breeze blows.'),
    kind: X('Land and sea heat up differently'),
    setup(K) {
      const sb = K.add(PW.seaBreeze({ W: Wd(K), app: K.app }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      const fin = { day: once(() => K.lab.emit('day', { obj: sb.id })), night: once(() => K.lab.emit('night', { obj: sb.id })) };
      PW.bindBreezeHands(sb, knob, lever, K.app, { day: 1, loop: 2, night: 3 }, { day: () => fin.day(), loop: () => K.lab.emit('loop', { obj: sb.id }), night: () => fin.night() });
      return { sb, knob, lever, fin };
    },
    steps: [
      { do: X('6 a.m. on a beach. One thermometer is pushed into the dry sand, the other stands in the sea. An incense stick burns in the sand.'), target: 'sb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sb.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Early in the morning the sand is a little cooler than the sea, and the air is almost still.') },
      { do: X('Slide the handle to move the clock from 6 a.m. to 2 p.m. Watch the thermometers and the smoke.'), target: 'sb',
        act: async (K, o) => { await K.tween(5, (k) => o.sb.setK(k)); o.fin.day(); },
        ev: { type: 'day' }, see: X('By 2 p.m. the sand is at 37 °C but the sea only at 28 °C. The smoke and the flag lean towards the land: a breeze blows from the sea.'), why: X('Land heats up much faster than water in the same sunshine. The air over the hot land gets warm too.') },
      { do: X('Push the lever to see how the air moves.'), target: 'sb',
        act: async (K, o) => { o.sb.showLoop(true); o.sb.camView = o.sb.views.loop; K.lab.emit('loop', { obj: o.sb.id }); await K.sleep(4); },
        ev: { type: 'loop' }, see: X('Warm air over the land rises. Cooler air from over the sea flows in to take its place, near the ground: this is the sea breeze.'), why: X('Warm air is lighter and rises; this lowers the pressure there, and air moves in from where it is cooler.') },
      { do: X('Now slide the handle to move the clock from 6 p.m. through the night to 2 a.m.'), target: 'sb',
        act: async (K, o) => { o.sb.toNight(); o.sb.camView = o.sb.views.near; await K.tween(5, (k) => o.sb.setK(k)); o.fin.night(); },
        ev: { type: 'night' }, see: X('At night the sand cools to 20 °C while the sea stays near 27 °C. The smoke now drifts out to sea: a land breeze.'), why: X('Land also cools down faster than water. At night the air over the warmer sea rises, and air from the land flows out to take its place.') },
      { do: X('Why do coastal places have mild weather?'), target: 'sb',
        act: async (K, o) => { o.sb.showLoop(true); o.sb.say([Wd(K)('water heats up and cools down slowly')], OK); K.lab.emit('why', { obj: o.sb.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('The sea heats up and cools down slowly, so it keeps the air near the coast from getting very hot by day or very cold at night.') },
    ],
    eq: { word: 'Breezes', sym: 'day: sea → land (sea breeze) · night: land → sea (land breeze)' },
    result: { obs: X('By day the sand became much hotter than the sea and the breeze blew from the sea to the land. At night the sand became cooler than the sea and the breeze blew from the land to the sea.'),
      concl: X('Land heats up and cools down faster than water. Warm air rises and cooler air flows in to take its place: by day this is the sea breeze, at night the land breeze. Convection carries heat through the air.'),
      safety: X('Never go into the sea alone, and stay out of the water when the flags warn you.'),
      viva: [{ q: X('Which heats up faster in sunlight, sand or sea water?'), a: X('Sand (land).') }, { q: X('Which way does the breeze blow at night on a beach?'), a: X('From the land to the sea (land breeze).') }, { q: X('How is heat carried by moving air called?'), a: X('Convection.') }] },
  },
  {
    id: 'pw8_periscope', subj: 'physics', cls: 8, ch: P8j, world: true, place: 'quad', table: false,
    title: X('A periscope: seeing over the courtyard wall'),
    aim: X('To tilt the two mirrors of a periscope with your own hand until you can see over a wall that is taller than you.'),
    kind: X('Reflection by two plane mirrors'),
    setup(K) {
      const ps = K.add(PW.periscope({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 });
      const fin = { bottom: once(() => K.lab.emit('bottom', { obj: ps.id })), top: once(() => K.lab.emit('top', { obj: ps.id })) };
      PW.bindPeriscopeHands(ps, knob, K.app, { bottom: 1, top: 2 }, { bottom: () => fin.bottom(), top: () => fin.top() });
      return { ps, knob, fin };
    },
    steps: [
      { do: X('A brick wall 2.2 m high stands in front of you; your eyes are lower than its top. A cardboard periscope with a mirror at each end stands against it.'), target: 'ps',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ps.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Both mirrors are tilted at 30°. In the round view you see only the dark inside of the tube.') },
      { do: X('Slide the handle to tilt the bottom mirror until you look straight up the tube, then let go.'), target: 'ps',
        act: async (K, o) => { const a0 = o.ps.aB; await K.tween(2, (k) => o.ps.setAngle(a0 + (45 - a0) * k)); await K.sleep(0.8); o.fin.bottom(); },
        ev: { type: 'bottom' }, see: X('At 45° the bottom mirror sends your line of sight straight up to the top mirror. Now you see the ground beyond the wall, but tilted.'), why: X('A mirror at 45° turns a ray through 90°: the angle of reflection equals the angle of incidence.') },
      { do: X('Now slide the handle to tilt the top mirror until the view is level, then let go.'), target: 'ps',
        act: async (K, o) => { o.ps.toTop(); const a0 = o.ps.aT; await K.tween(2, (k) => o.ps.setAngle(a0 + (45 - a0) * k)); await K.sleep(0.8); o.fin.top(); },
        ev: { type: 'top' }, see: X('With both mirrors at 45° and parallel, you see straight ahead over the wall: the flag and the football on the other side.'), why: X('Light from the far side hits the top mirror, turns down the tube, hits the bottom mirror and turns again into your eye.') },
      { do: X('Where are periscopes used?'), target: 'ps',
        act: async (K, o) => { o.ps.say([Wd(K)('two mirrors at 45°, facing each other')], OK); K.lab.emit('why', { obj: o.ps.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('In submarines, tanks and bunkers, to see over obstacles without being seen.') },
    ],
    eq: { word: 'Periscope', sym: 'angle of incidence = angle of reflection · mirrors parallel at 45°' },
    result: { obs: X('With the mirrors at other angles I saw the inside of the tube, the sky or the ground. With both at 45° I saw straight ahead over the wall.'),
      concl: X('A periscope uses two plane mirrors, parallel to each other and at 45° to the tube. Each mirror turns the light through 90°, so light from above the wall reaches the eye below it.'),
      safety: X('Handle mirrors by their edges; broken mirror glass is sharp.'),
      viva: [{ q: X('At what angle are the mirrors fixed in a periscope?'), a: X('45° to the tube, parallel to each other.') }, { q: X('Which law of light does a periscope use?'), a: X('The law of reflection.') }, { q: X('Name a place where periscopes are used.'), a: X('Submarines.') }] },
  },
  {
    id: 'pw8_balloon_stream', subj: 'physics', cls: 8, ch: P8e, world: true, place: 'quad', table: false,
    title: X('A charged balloon bends a stream of water'),
    aim: X('To rub a balloon on a woollen shawl with your own hand, bring it close to a thin stream from a school tap, and see a force act without touching.'),
    kind: X('Electrostatic force'),
    setup(K) {
      const bs = K.add(PW.balloonStream({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      const fin = { rub: once(() => K.lab.emit('rub', { obj: bs.id })), near: once(() => K.lab.emit('bend', { obj: bs.id })) };
      PW.bindBalloonHands(bs, knob, lever, K.app, { rub: 1, near: 2 }, { rub: () => fin.rub(), near: () => fin.near() });
      return { bs, knob, lever, fin };
    },
    steps: [
      { do: X('At the school’s drinking-water taps, one tap is open a little: a thin stream falls into the trough. A balloon lies on a woollen shawl.'), target: 'bs',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bs.id }); await K.sleep(2); }, ev: { type: 'look' }, see: X('The stream falls straight down.') },
      { do: X('Slide the handle to and fro to rub the balloon hard on the woollen shawl, at least 6 times.'), target: 'bs',
        act: async (K, o) => { for (let i = 0; i < 7; i++) await K.tween(0.35, (k) => o.bs.rub(i % 2 ? 1 - k : k)); o.fin.rub(); },
        ev: { type: 'rub' }, see: X('The balloon is now charged. (Rubbing moves tiny charged particles from the wool to the balloon.)') },
      { do: X('Now slide the handle to bring the balloon slowly close to the stream, without touching the water.'), target: 'bs',
        act: async (K, o) => { o.bs.toNear(); await K.tween(3, (k) => o.bs.setK(k * 0.9)); await K.sleep(0.8); o.fin.near(); },
        ev: { type: 'bend' }, see: X('The stream bends towards the balloon, more and more as it comes closer, though the balloon never touches it.'), why: X('A charged object attracts the water. This electrostatic force acts from a distance: it is a non-contact force.') },
      { do: X('What happens if the balloon touches the water?'), target: 'bs',
        act: async (K, o) => { o.bs.say([Wd(K)('a wet balloon loses its charge')], OK); K.lab.emit('why', { obj: o.bs.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('It gets wet and its charge leaks away into the water, so it no longer pulls the stream. It must be dried and rubbed again.') },
    ],
    eq: { word: 'Electrostatic force', sym: 'a charged body attracts water without touching it (non-contact force)' },
    result: { obs: X('After rubbing on wool, the balloon pulled the stream of water towards itself without touching it. The closer it came, the more the stream bent.'),
      concl: X('Rubbing gives a balloon an electric charge. A charged body exerts an electrostatic force, which is a non-contact force: it acts even from a distance.'),
      safety: X('Keep electrical switches and sockets dry, and never touch them with wet hands.'),
      viva: [{ q: X('Is electrostatic force a contact or a non-contact force?'), a: X('A non-contact force.') }, { q: X('How did the balloon get charged?'), a: X('By rubbing it on wool.') }, { q: X('Name another non-contact force.'), a: X('Magnetic force (or gravitational force).') }] },
  },
  {
    id: 'pw9_catch_ball', subj: 'physics', cls: 9, ch: P9f, world: true, place: 'field', table: false,
    title: X('Catching a cricket ball: why pull your hands back?'),
    aim: X('To catch a fast cricket ball with your own hands, first held stiff and then pulled back, and compare the force on your hands.'),
    kind: X('Force and change of momentum'),
    setup(K) {
      const cb = K.add(PW.catchBall({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      const fin = { stiff: once(() => K.lab.emit('stiff', { obj: cb.id })), soft: once(() => K.lab.emit('soft', { obj: cb.id })) };
      PW.bindCatchHands(cb, knob, lever, K.app, { stiff: 1, soft: 2 }, { stiff: () => fin.stiff(), soft: () => fin.soft() });
      return { cb, knob, lever, fin };
    },
    steps: [
      { do: X('On the playground a friend will throw you a cricket ball (160 g) at about 14 m/s. The slider sets how far you pull your hands back while catching.'), target: 'cb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cb.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The ball’s momentum is m × v = 0.16 kg × 14 m/s = 2.24 kg m/s. Your hands must take all of it away.') },
      { do: X('Keep the slider at 0 cm (stiff hands) and push the lever to call for the ball.'), target: 'cb',
        act: async (K, o) => { o.cb.setK(0); await new Promise((r) => o.cb.throw(r)); o.fin.stiff(); },
        ev: { type: 'stiff' }, see: X('The ball stops in about 2 thousandths of a second. The force is over 1000 N: it stings, and the ball bounces out of your hands.'), why: X('The whole change of momentum happens in a very short time, so the force is very large: F = change of momentum ÷ time.') },
      { do: X('Now slide the handle to pull your hands back 40 cm, and push the lever again.'), target: 'cb',
        act: async (K, o) => { o.cb.setK(0.8); await K.sleep(0.4); await new Promise((r) => o.cb.throw(r)); o.fin.soft(); },
        ev: { type: 'soft' }, see: X('Now the ball takes about 60 thousandths of a second to stop, and the force is only about 40 N: a soft, safe catch.'), why: X('The change of momentum is the same, 2.24 kg m/s, but it is spread over a much longer time, so the force is much smaller.') },
      { do: X('Look at the graph. What is the same for both catches?'), target: 'cb',
        act: async (K, o) => { o.cb.say([Wd(K)('area under each curve = change of momentum = 2.24 kg m/s')], OK); K.lab.emit('why', { obj: o.cb.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('The area under each curve (force × time) is the same: the change of momentum. A tall, narrow spike for stiff hands; a low, wide curve when you pull back.') },
    ],
    eq: { word: 'Force and momentum', sym: 'F = (m v − m u) ÷ t' },
    result: { obs: X('With stiff hands the ball stopped in about 2 ms with a force of over 1000 N and bounced out. Pulling the hands back 40 cm made it stop in about 60 ms with a force of about 40 N.'),
      concl: X('Force equals the rate of change of momentum. For the same change of momentum, a longer stopping time means a smaller force. That is why fielders pull their hands back, and why high jumpers land on soft mats.'),
      safety: X('Never catch a hard cricket ball with stiff fingers pointing at it: it can break a finger.'),
      viva: [{ q: X('What is the momentum of a 0.16 kg ball moving at 14 m/s?'), a: X('2.24 kg m/s.') }, { q: X('Why does a fielder pull his hands back while catching?'), a: X('To increase the time of stopping the ball and so reduce the force.') }, { q: X('Why do high jumpers land on a foam bed?'), a: X('The bed increases the stopping time, so the force on the body is smaller.') }] },
  },
  {
    id: 'pw9_seesaw', subj: 'physics', cls: 9, ch: P9g, world: true, place: 'field', table: false,
    title: X('A see-saw is a lever: balancing two sacks'),
    aim: X('To slide a sack along a see-saw with your own hand until it balances a heavier sack, and find the rule a lever follows.'),
    kind: X('Moments and the lever'),
    setup(K) {
      const ss = K.add(PW.seesaw({ W: Wd(K) }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      const fin = { balance: once(() => K.lab.emit('balance', { obj: ss.id })), swap: once(() => K.lab.emit('swap', { obj: ss.id })) };
      PW.bindSeesawHands(ss, knob, lever, K.app, { balance: 1, swap: 3 }, { balance: () => fin.balance(), swap: () => fin.swap() });
      return { ss, knob, lever, fin };
    },
    steps: [
      { do: X('A see-saw on the playground. A 30 kg sack sits 1.0 m from the pivot on the left; a 20 kg sack sits on the right. A scale on the beam shows distances from the pivot.'), target: 'ss',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ss.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('The heavier side is down.') },
      { do: X('Slide the handle to move the 20 kg sack along the beam until the see-saw rests level.'), target: 'ss',
        act: async (K, o) => { const k0 = o.ss.k, k1 = (1.5 - 0.35) / (1.65 - 0.35); await K.tween(3, (k) => o.ss.setK(k0 + (k1 - k0) * k)); await K.sleep(2.2); o.fin.balance(); },
        ev: { type: 'balance' }, see: X('It balances when the 20 kg sack is 1.5 m from the pivot.'), why: X('Nearer the pivot, the lighter sack cannot lift the heavier one; farther out, it turns the see-saw the other way.') },
      { do: X('Multiply each mass by its distance from the pivot.'), target: 'ss',
        act: async (K, o) => { o.ss.say(['30 kg × 1.0 m = 30 kg m = 20 kg × 1.5 m'], OK); K.lab.emit('moments', { obj: o.ss.id }); await K.sleep(2.5); },
        ev: { type: 'moments' }, see: X('30 × 1.0 = 30 and 20 × 1.5 = 30: the two are equal when it balances.') },
      { do: X('Push the lever to swap in a 10 kg bag, then slide it all the way to the end of the beam.'), target: 'ss',
        act: async (K, o) => { o.ss.swap10(); await K.tween(2.5, (k) => o.ss.setK(k)); await K.sleep(1.5); o.fin.swap(); },
        ev: { type: 'swap' }, see: X('Even at the very end (1.65 m) it cannot lift the 30 kg sack: 10 × 1.65 = 16.5 is less than 30.'), why: X('To balance it, the 30 kg sack would have to move closer to the pivot, to 0.55 m.') },
      { do: X('What is the rule of the lever?'), target: 'ss',
        act: async (K, o) => { await K.tween(2, (k) => o.ss.moveLeft(1.0 - 0.45 * k)); await K.sleep(2.5); o.ss.say([Wd(K)('load × load arm = effort × effort arm')], OK); K.lab.emit('why', { obj: o.ss.id }); await K.sleep(2); },
        ev: { type: 'why' }, see: X('With the 30 kg sack moved in to 0.55 m it balances again. A lever balances when load × load arm = effort × effort arm. A small effort far from the pivot can lift a big load near it.') },
    ],
    eq: { word: 'Lever', sym: 'load × load arm = effort × effort arm · 30 × 1.0 = 20 × 1.5' },
    result: { obs: X('The see-saw balanced when 30 kg × 1.0 m equalled 20 kg × 1.5 m. A 10 kg bag could not balance the 30 kg sack anywhere on the other arm.'),
      concl: X('A see-saw is a lever with the pivot (fulcrum) between the effort and the load. It balances when load × load arm = effort × effort arm; a longer effort arm lets a smaller force lift a bigger load.'),
      safety: X('Sit, do not stand, on a see-saw, and never jump off while your partner is up in the air.'),
      viva: [{ q: X('A 40 kg child sits 1 m from the pivot. Where must a 20 kg child sit to balance?'), a: X('2 m from the pivot.') }, { q: X('What is the fixed point of a lever called?'), a: X('The fulcrum (pivot).') }, { q: X('Name another lever with the fulcrum in the middle.'), a: X('A pair of scissors, or a beam balance.') }] },
  },
  {
    id: 'pw10_sprinkler_rainbow', subj: 'physics', cls: 10, ch: P10j, world: true, place: 'field', table: false,
    title: X('A rainbow in a garden sprinkler'),
    aim: X('To open a sprinkler on the school playground with your own hand, find the rainbow in its spray, and see that it is always on the side away from the Sun.'),
    kind: X('Dispersion of light by water drops'),
    setup(K) {
      const sr = K.add(PW.sprinklerRainbow({ W: Wd(K), place: 'field' }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42, { y: 1 });
      const fin = { tap: once(() => K.lab.emit('tap', { obj: sr.id })), side: once(() => K.lab.emit('side', { obj: sr.id })), back: once(() => K.lab.emit('back', { obj: sr.id })) };
      PW.bindRainbowHands(sr, knob, K.app, { tap: 1, side: 2, back: 3 }, { tap: () => fin.tap(), side: () => fin.side(), back: () => fin.back() });
      return { sr, knob, fin };
    },
    steps: [
      { do: X('Midday on the playground: the Sun is high behind you, 50° up. A sprinkler on the grass is joined by a hose to a tap.'), target: 'sr',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sr.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('With the Sun so high, there can be no rainbow in the sky now.') },
      { do: X('Slide the handle to open the tap fully.'), target: 'sr',
        act: async (K, o) => { await K.tween(2.5, (k) => o.sr.setTap(k)); o.fin.tap(); },
        ev: { type: 'tap' }, see: X('The sprinkler turns and throws a spray of drops. In the spray, below your eyes, an arch of colours appears: red on the outside, violet on the inside.'), why: X('Sunlight enters each drop, bends (refraction), splits into colours (dispersion), reflects off the back of the drop and comes out. Red comes back to you at about 42°, violet at about 40°.') },
      { do: X('Slide the handle to pull the sprinkler round to your right side.'), target: 'sr',
        act: async (K, o) => { await K.tween(3, (k) => o.sr.setAz(k)); o.fin.side(); },
        ev: { type: 'side' }, see: X('The spray is as thick as before, but the rainbow has gone from it.'), why: X('Only drops at about 42° from the shadow of your head send colours to your eye. Off to the side, no drop is at that angle.') },
      { do: X('Slide it back in front of you, opposite the Sun.'), target: 'sr',
        act: async (K, o) => { await K.tween(3, (k) => o.sr.setAz(1 - k)); o.fin.back(); },
        ev: { type: 'back' }, see: X('The rainbow is back: it is always on the side opposite the Sun, around the shadow of your head.') },
      { do: X('Why is the rainbow a circle, and why only with the Sun behind you?'), target: 'sr',
        act: async (K, o) => { o.sr.say([Wd(K)('red 42° · violet 40° from the point opposite the Sun')], OK); K.lab.emit('why', { obj: o.sr.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('All the drops that make the same angle with the line from the Sun through your eye lie on a circle. A rainbow is part of that circle; here the ground hides the rest.') },
    ],
    eq: { word: 'Rainbow', sym: 'refraction + dispersion + internal reflection in drops · red ≈ 42°, violet ≈ 40°' },
    result: { obs: X('With the Sun behind me, the spray showed a coloured arch, red outside and violet inside. When the sprinkler was moved to my side, the rainbow disappeared from the spray.'),
      concl: X('A rainbow forms when sunlight is refracted, dispersed and internally reflected by water drops. It is seen only with the Sun behind you, as part of a circle about 42° (red) to 40° (violet) around the point opposite the Sun.'),
      safety: X('Never look straight at the Sun.'),
      viva: [{ q: X('Where must the Sun be for you to see a rainbow?'), a: X('Behind you.') }, { q: X('Which colour is on the outside of a rainbow?'), a: X('Red.') }, { q: X('Name the three things that happen to light inside a raindrop.'), a: X('Refraction (with dispersion), internal reflection, and refraction again as it leaves.') }] },
  },
  {
    id: 'pw10_room_wiring', subj: 'physics', cls: 10, ch: P10k, world: true, place: 'room', table: true,
    title: X('Wiring a room: bulbs in parallel, and an overload'),
    aim: X('To switch bulbs on and off on a house-wiring board with your own hand, read the total current, and see what an overload does.'),
    kind: X('Parallel circuits and domestic wiring'),
    setup(K) {
      const wb = K.add(PW.wiringBoard({ W: Wd(K) }), 0, 0, { y: 0 }), sw = [0, 1, 2].map(() => K.add(PW.wallSwitch(), 0, -0.9)), lever = K.add(MW.pullTab(), -0.42, -0.5);
      const fin = { on: once(() => K.lab.emit('allon', { obj: wb.id })), off: once(() => K.lab.emit('oneoff', { obj: wb.id })), heater: once(() => K.lab.emit('heater', { obj: wb.id })), iron: once(() => K.lab.emit('trip', { obj: wb.id })) };
      PW.bindWiringHands(wb, sw, lever, K.app, { on: 1, off: 2, heater: 3, iron: 4 }, { on: () => fin.on(), off: () => fin.off(), heater: () => fin.heater(), iron: () => fin.iron() });
      return { wb, sw0: sw[0], sw1: sw[1], sw2: sw[2], lever, fin };
    },
    steps: [
      { do: X('A house-wiring board on the classroom table, fed from the 230 V mains through a 10 A MCB and an ammeter. Three bulbs, 100 W, 60 W and 40 W, each have their own switch.'), target: 'wb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.wb.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('Each bulb is joined straight across the red live wire and the black neutral wire: the bulbs are in parallel.') },
      { do: X('Press the three switches to turn on all three bulbs, one by one.'), target: 'sw0',
        act: async (K, o) => { for (let i = 0; i < 3; i++) { o.wb.press(i); await K.sleep(1); } o.fin.on(); },
        ev: { type: 'allon' }, see: X('Each bulb lights at full brightness as soon as its own switch is on. The ammeter climbs: 0.43 A, then 0.70 A, then 0.87 A.'), why: X('Each bulb gets the full 230 V and draws its own current, I = P ÷ V. In parallel, the currents add up.') },
      { do: X('Now switch off any one bulb.'), target: 'sw1',
        act: async (K, o) => { o.wb.press(1); await K.sleep(1); o.fin.off(); },
        ev: { type: 'oneoff' }, see: X('Only that bulb goes out. The others stay just as bright, and the total current drops by that bulb’s share.'), why: X('In parallel each bulb has its own path to the supply, so switching one off does not break the others’ circuits. That is why houses are wired in parallel.') },
      { do: X('Push the lever to plug in a 2000 W room heater.'), target: 'wb',
        act: async (K, o) => { o.wb.plug('heater'); await K.sleep(1.5); o.fin.heater(); },
        ev: { type: 'heater' }, see: X('The heater glows and the current jumps by 8.7 A, to about 9.4 A: still just under the MCB’s 10 A.') },
      { do: X('Push the lever again to plug in a 1000 W iron as well.'), target: 'wb',
        act: async (K, o) => { o.wb.plug('iron'); await K.sleep(3.2); o.fin.iron(); },
        ev: { type: 'trip' }, see: X('The current goes above 13 A. After a moment the MCB trips with a click and everything goes off.'), why: X('Too much current overheats wires and can start a fire. The MCB (or a fuse) breaks the circuit when the current is more than it is rated for: this is an overload.') },
      { do: X('Why does the current add up in parallel?'), target: 'wb',
        act: async (K, o) => { o.wb.say([Wd(K)('I = I₁ + I₂ + I₃ · same V across each')], OK); K.lab.emit('why', { obj: o.wb.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Each appliance draws I = P ÷ V from the same 230 V; the main wire carries all of them together. Too many big appliances on one circuit is an overload.') },
    ],
    eq: { word: 'Parallel circuit', sym: 'I = P ÷ V · I(total) = I₁ + I₂ + I₃ · same V across each' },
    result: { obs: X('Each bulb worked on its own switch at full brightness. The total current was the sum of the bulbs’ currents. With the heater and the iron as well, it went over 10 A and the MCB tripped.'),
      concl: X('In domestic wiring, appliances are connected in parallel: each gets the full mains voltage and can be switched on its own, and the total current is the sum of their currents. A fuse or MCB protects the circuit from overloading.'),
      safety: X('Never touch mains wiring. Do not plug many high-power appliances into one socket.'),
      viva: [{ q: X('What current does a 100 W bulb draw from 230 V?'), a: X('About 0.43 A (I = P ÷ V).') }, { q: X('Why are houses wired in parallel?'), a: X('Each appliance gets the full voltage and can be switched on or off by itself.') }, { q: X('What does an MCB do?'), a: X('It switches off the circuit when the current is too large (overload or short circuit).') }] },
  },
  {
    id: 'pw9_free_fall', subj: 'physics', cls: 9, ch: P9d, world: true, place: 'quad', table: false,
    title: X('Timing a ball dropped from the school building'),
    aim: X('To time, with your own stopwatch, a ball dropped from the roof and from a first-floor window, work out g, and see how air slows a sheet of paper.'),
    kind: X('Free fall and uniform acceleration'),
    setup(K) {
      const ff = K.add(PW.freeFall({ W: Wd(K), app: K.app }), 0, 0, { y: 0 }), lever = K.add(MW.pullTab(), -0.45, -0.3, { y: 1 });
      const fin = { high: once(() => K.lab.emit('high', { obj: ff.id })), low: once(() => K.lab.emit('low', { obj: ff.id })), paper: once(() => K.lab.emit('paper', { obj: ff.id })) };
      PW.bindFallHands(ff, lever, K.app, { high: 1, low: 2, paper: 3 }, { high: () => fin.high(), low: () => fin.low(), paper: () => fin.paper() });
      return { ff, lever, fin };
    },
    steps: [
      { do: X('A friend on the roof holds a cricket ball over the parapet, 7.5 m above the courtyard. You hold a stopwatch.'), target: 'ff',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ff.id }); await K.sleep(2.5); }, ev: { type: 'look' }, see: X('A tape hanging down the wall shows the height.') },
      { do: X('Push the lever: the ball is let go and your watch starts. Push it again the moment the ball hits the ground.'), target: 'ff',
        act: async (K, o) => { o.ff.press(); await K.sleep(Math.sqrt(15 / 9.8) + 0.14); o.ff.press(); await K.sleep(1); o.fin.high(); },
        ev: { type: 'high' }, see: X('The ball takes about 1.24 s to fall 7.5 m. Your own time is a little longer, because it takes you a moment to react.'), why: X('From h = ½ g t², g = 2h ÷ t². With 1.24 s this gives about 9.8 m/s²; a late press gives a smaller value.') },
      { do: X('Your friend comes down to the first-floor window, 3.75 m up: half the height. Time the fall again.'), target: 'ff',
        act: async (K, o) => { o.ff.setH(3.75); await K.sleep(0.6); o.ff.press(); await K.sleep(Math.sqrt(7.5 / 9.8) + 0.14); o.ff.press(); await K.sleep(1); o.fin.low(); },
        ev: { type: 'low' }, see: X('From half the height the fall takes about 0.87 s, not half the time.'), why: X('The ball keeps speeding up as it falls (uniform acceleration), so the distance grows as t²: half the height takes 1/√2, about 0.71, of the time.') },
      { do: X('Push the lever: a flat sheet of paper and a crumpled one are let go together from the window.'), target: 'ff',
        act: async (K, o) => { o.ff.dropPaper(); while (o.ff.paper !== 'down') await K.sleep(0.2); o.fin.paper(); },
        ev: { type: 'paper' }, see: X('The crumpled paper drops like the ball, in under a second. The flat sheet sways and drifts down slowly, taking several seconds.'), why: X('Air pushes back on a falling body. On the wide flat sheet this air resistance is large; on the small crumpled ball it is tiny.') },
      { do: X('Would a heavy and a light ball, dropped together, land together?'), target: 'ff',
        act: async (K, o) => { o.ff.say([Wd(K)('without air: all bodies fall with the same g = 9.8 m/s²')], OK); K.lab.emit('why', { obj: o.ff.id }); await K.sleep(2.5); },
        ev: { type: 'why' }, see: X('Yes, nearly: all bodies fall with the same acceleration g when air resistance is small. Only shape and air make a difference, as with the paper.') },
    ],
    eq: { word: 'Free fall', sym: 'h = ½ g t² · g = 2h ÷ t² ≈ 9.8 m/s²' },
    result: { obs: X('The ball fell 7.5 m in about 1.24 s and 3.75 m in about 0.87 s. My times were a little longer because of my reaction time. A flat sheet of paper fell much more slowly than a crumpled one.'),
      concl: X('A freely falling body speeds up uniformly with acceleration g ≈ 9.8 m/s², so h = ½ g t². Doubling the height does not double the time. Air resistance slows light, wide objects.'),
      safety: X('Never drop anything from a height where people are walking below; keep the landing area clear.'),
      viva: [{ q: X('A stone takes 2 s to fall. How far did it fall?'), a: X('About 19.6 m (½ × 9.8 × 2²).') }, { q: X('Why did your own time come out a little longer?'), a: X('Because of your reaction time in pressing the stopwatch.') }, { q: X('Why does a sheet of paper fall slowly?'), a: X('Air resistance on its large flat surface.') }] },
  },
];
