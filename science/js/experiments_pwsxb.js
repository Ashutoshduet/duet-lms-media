// DUET Science Lab 360, physics batch PW-SX (second part): light and motion. Total internal reflection and a light pipe, why
// the sky is blue and the setting Sun red (in the lab, then under the real sky at noon and at sunset), Newton's colour disc,
// regular and diffuse reflection, the defects of the eye and their spectacles, inertia at the bench and in a bus.
// Apparatus: pwsx3.js, pwsx4.js; Hindi and Hinglish: exp_i18n_pwsx.js (merged into DICT by experiments_pwsx.js).
import { DICT } from './exp_i18n.js';
import { DICT_PWSX } from './exp_i18n_pwsx.js';
import * as P1 from './pwsx1.js';
import * as P3 from './pwsx3.js';
import * as P4 from './pwsx4.js';
Object.assign(DICT, DICT_PWSX);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const t3 = (L, x) => (x && (x[L] || x.en)) || '';
const Wd = (K) => (k) => tl(K, X(k));
const F3 = (f) => ({ en: f('en', (k) => t3('en', X(k))), hi: f('hi', (k) => t3('hi', X(k))), hg: f('hg', (k) => t3('hg', X(k))) });
const emit = (K, it, type) => { let last = -1; return () => { const i = K.app.runner.i; if (i === last && K.app.runner.state !== 'todo') return; last = i; K.lab.emit(type, { obj: it.id }); }; };
const until = async (K, f, max = 40) => { let t = 0; while (!f() && t < max) { await K.sleep(0.2); t += 0.2; } };
const P9 = N('Ch 9 · Light – Reflection and Refraction', 'अध्याय 9 · प्रकाश – परावर्तन तथा अपवर्तन', 'Ch 9 · Light – Reflection aur Refraction');
const P10 = N('Ch 10 · The Human Eye and the Colourful World', 'अध्याय 10 · मानव नेत्र तथा रंगबिरंगा संसार', 'Ch 10 · Human Eye aur Colourful World');
const C7k = N('Ch 11 · Light: Shadows and Reflections', 'अध्याय 11 · प्रकाश: छाया और परावर्तन', 'Ch 11 · Light: Shadows aur Reflections');
const C8j = N('Ch 10 · Light: Mirrors and Lenses', 'अध्याय 10 · प्रकाश: दर्पण और लेंस', 'Ch 10 · Light: Mirrors aur Lenses');
const P9f = N('Ch 6 · How Forces Affect Motion', 'अध्याय 6 · बल गति को कैसे प्रभावित करते हैं', 'Ch 6 · Forces motion ko kaise affect karte hain');

export const EXPERIMENTS_PWSXB = [
  // ============================================================ Class 10 · total internal reflection and a light pipe
  {
    id: 'sx10_tir', subj: 'physics', cls: 10, ch: P9,
    title: X('Total internal reflection: a laser in a glass block and a light pipe'),
    aim: X('To turn a laser beam inside a semicircular glass block until no light comes out, measure the critical angle, and see how a bent light pipe (a thick optical fibre) carries light round a corner, and when it leaks.'),
    kind: X('Refraction, the critical angle and total internal reflection'),
    setup(K) {
      const W = Wd(K); const tb = K.add(P3.tirBench({ W, app: K.app }), 0, 0, { y: 0 });
      const angK = K.add(P1.pullTab(), -0.12, -0.52), bendK = K.add(P1.pullTab(), 0.2, -0.5), swK = K.add(P1.pullTab(), -0.3, -0.6);
      P3.bindTir(tb, angK, bendK, swK, K.app, { switch: 1, angle: [1, 2, 3], crit: 2, tir: 3, pipe: 4, bend: 5, bubble: 2 },
        { on: emit(K, tb, 'laseron'), crit: emit(K, tb, 'critical'), tir: emit(K, tb, 'tir'), pipe: emit(K, tb, 'pipe'), bend: emit(K, tb, 'bent') });
      P1.camBy(tb, K.app, [tb.views.all, tb.views.block, tb.views.block, tb.views.block, tb.views.pipe, tb.views.pipe]);
      return { tb, angK, bendK, swK };
    },
    steps: [
      { do: X('Kyun? Internet signals travel thousands of kilometres as light inside thin glass fibres that bend round corners. Why does the light not leak out? Look at the glass block and the laser.'), target: 'tb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.tb.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A half-round glass block lies on an angle disc. The laser points at the middle of its flat face, through the curved side, so it does not bend going in.') },
      { do: X('Switch the laser on. The angle of incidence at the flat face is about 20°.'), target: 'swK',
        act: async (K, o) => { o.tb.setOn(true); await K.sleep(1.5); K.lab.emit('laseron', { obj: o.tb.id }); }, ev: { type: 'laseron' },
        see: X('Most of the light comes out into the air, bent away from the normal (about 31°); a faint beam is reflected back into the glass.'), why: X('Going from glass into air, light speeds up and bends away from the normal; a little is always reflected at the surface.') },
      { do: X('Slowly turn the laser to a larger angle until the light coming out just skims along the flat face.'), target: 'angK',
        act: async (K, o) => { const k = (P3.CRIT - 5) / 75; await K.tween(3, (q) => o.tb.setI(o.tb.ki + (k - o.tb.ki) * q)); await K.sleep(1.2); K.lab.emit('critical', { obj: o.tb.id }); }, ev: { type: 'critical' },
        see: X('At about 42° the outgoing beam lies along the surface (90°), and it has become very faint; the reflected beam is much brighter.'), why: X('This angle of incidence is the critical angle of glass: sin c = 1/n = 1/1.5, c = 41.8°.') },
      { do: X('Turn it further, to about 60°.'), target: 'angK',
        act: async (K, o) => { await K.tween(2, (q) => o.tb.setI(o.tb.ki + ((60 - 5) / 75 - o.tb.ki) * q)); await K.sleep(0.8); K.lab.emit('tir', { obj: o.tb.id }); }, ev: { type: 'tir' },
        see: X('No light comes out at all: all of it is reflected back into the glass, as bright as the beam going in.'), why: X('Beyond the critical angle there is no refracted ray: total internal reflection. It happens only going from a denser to a rarer medium.') },
      { do: X('Now aim the laser into the end of the light pipe, a clear acrylic rod bent round a curve.'), target: 'swK',
        act: async (K, o) => { o.tb.toPipe(); await K.sleep(1.5); K.lab.emit('pipe', { obj: o.tb.id }); }, ev: { type: 'pipe' },
        see: X('The rod glows and the light comes out at its far end, round the bend, onto the card.'), why: X('Inside the rod the light hits the wall at more than the critical angle each time, so it is totally reflected again and again and follows the rod.') },
      { do: X('Bend the light pipe tighter and tighter.'), target: 'bendK',
        act: async (K, o) => { await K.tween(3, (q) => o.tb.setBend(o.tb.kb + (1 - o.tb.kb) * q)); await K.sleep(1); K.lab.emit('bent', { obj: o.tb.id }); }, ev: { type: 'bent' },
        see: X('Below a bend of about 2 cm, red light starts escaping at the outside of the bend, and the spot at the end gets dimmer.'), why: X('In a tight bend some rays meet the outer wall at less than the critical angle and escape. Optical fibres must not be bent too sharply.') },
    ],
    eq: { word: 'Critical angle', sym: 'sin c = 1 / n · glass (n = 1.5): c = 41.8°' },
    result: { obs: X('At 20° most light came out, bent away from the normal; at about 42° it skimmed the surface; beyond that, none came out. The light pipe carried light round a bend, and leaked when bent tighter than about 2 cm.'),
      concl: X('When light goes from glass into air at more than the critical angle (about 42°), it is totally reflected. Optical fibres carry light by total internal reflection, as long as they are not bent too sharply.'),
      safety: X('Never look into a laser or point it at anyone\'s eyes.'),
      viva: [{ q: X('Give the two conditions for total internal reflection.'), a: X('Light must go from a denser to a rarer medium, at an angle of incidence greater than the critical angle.') }, { q: X('What is the critical angle of glass?'), a: X('About 42° (sin c = 1/1.5).') }, { q: X('Name two uses of total internal reflection.'), a: X('Optical fibres (internet, endoscopes) and the sparkle of diamonds; also prisms in binoculars.') }] },
  },
  // ============================================================ Class 10 · why the sky is blue and the Sun red at sunset
  {
    id: 'sx10_sky_blue', subj: 'physics', cls: 10, ch: P10,
    title: X('Why is the sky blue and the setting Sun red?'),
    aim: X('To shine a torch through water, add milk a little at a time, and see the beam turn bluish from the side and the light coming through turn orange-red; then look at the real sky at noon and at sunset and see why.'),
    kind: X('Scattering of light'), alsoPlaces: ['grass', 'sunset'],
    setup(K) {
      const W = Wd(K); const sk = K.add(P3.skyTank({ W, app: K.app }), 0, 0, { y: 0 });
      const swK = K.add(P1.pullTab(), -0.32, -0.66), milkK = K.add(P1.pullTab(), 0.06, -0.62), hourK = K.add(P1.pullTab(), 0, -0.42);
      P3.bindSky(sk, swK, milkK, hourK, K.app, { switch: 1, milk: [2, 3], blue: 2, red: 3, hour: 5 }, { on: emit(K, sk, 'torchon'), blue: emit(K, sk, 'bluish'), red: emit(K, sk, 'reddish'), sunset: emit(K, sk, 'sunset') });
      P1.camBy(sk, K.app, [sk.views.all, sk.views.all, sk.views.side, sk.views.card, () => sk.views.noon, () => sk.views.sunset]);
      return { sk, swK, milkK, hourK };
    },
    steps: [
      { do: X('Kyun? Sunlight is white, and the air is clear. So why is the sky blue, and why are the Sun and the clouds red at sunset? Look at the tank first.'), target: 'sk',
        act: async (K, o) => { K.lab.emit('look', { obj: o.sk.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A glass tank of clear water, a torch at one end, a white card at the other, a black cloth behind, and a beaker of milk with a dropper.') },
      { do: X('Switch the torch on and look at the tank from the side.'), target: 'swK',
        act: async (K, o) => { o.sk.setOn(true); await K.sleep(1.5); K.lab.emit('torchon', { obj: o.sk.id }); }, ev: { type: 'torchon' },
        see: X('The beam is almost invisible in clear water; the spot on the card is white.'), why: X('Clean water has almost nothing in it to send light sideways, so no light comes towards your eye from the beam.') },
      { do: X('Add milk, 1 mL at a time, and look at the beam from the side.'), target: 'milkK',
        act: async (K, o) => { while (o.sk.ml < 3) { await new Promise((r) => o.sk.addMilk(r)); await K.sleep(0.3); } await K.sleep(1); K.lab.emit('bluish', { obj: o.sk.id }); }, ev: { type: 'bluish' },
        see: X('The beam shows up from the side with a bluish glow.'), why: X('Tiny particles of milk scatter the light sideways, and they scatter blue light much more than red: four times more, since scattering goes as 1/λ⁴.') },
      { do: X('Keep adding milk and look at the spot on the white card.'), target: 'milkK',
        act: async (K, o) => { while (o.sk.T[2] / o.sk.T[0] >= 0.12 && o.sk.ml < 20) { await new Promise((r) => o.sk.addMilk(r)); await K.sleep(0.25); } await K.sleep(1); K.lab.emit('reddish', { obj: o.sk.id }); }, ev: { type: 'reddish' },
        check: (K, o) => (o.sk.ml > 14 ? { ok: false, see: X('The spot is dim and dark red: very little light gets through.'), why: X('With so much milk, even red light is scattered away. With less milk the effect shows best.') } : null),
        see: X('The spot turns yellow, then orange-red, while the beam near the torch still looks bluish.'), why: X('The blue has been scattered out of the beam on the way; what gets through the long path is mostly red and orange.') },
      { do: X('Now go outside at noon and look up at the sky.'), target: 'sk',
        act: async (K, o) => { await o.sk.goOut('grass'); await K.sleep(2.5); K.lab.emit('noon', { obj: o.sk.id }); }, ev: { type: 'noon' },
        see: X('The sky overhead is deep blue and the Sun is white. The chart shows that about 80 % of the blue light of the Sun gets through the air at noon.'), why: X('The molecules of the air scatter sunlight just like the milk, blue most of all: the blue light scattered all over the sky reaches your eyes from every direction.') },
      { do: X('Slide the clock from noon to sunset and look at the Sun.'), target: 'hourK',
        act: async (K, o) => { await K.tween(5, (k) => { o.sk.setHour(k); if (o.sk.elev < 10 && o.sk.where !== 'sunset' && !o.sk.going) { o.sk.going = true; o.sk.goOut('sunset').then(() => { o.sk.going = false; }); } }); await until(K, () => o.sk.where === 'sunset', 20); await K.sleep(1); K.lab.emit('sunset', { obj: o.sk.id }); }, ev: { type: 'sunset' },
        see: X('Near the horizon the Sun is orange-red. The chart: of its blue light almost nothing gets through, of its red light much more.'), why: X('At sunset the light crosses about 40 times as much air as at noon, like the long tank full of milk: the blue is scattered out on the way, and the light that reaches you is red and orange.') },
    ],
    eq: { word: 'Scattering by small particles', sym: 'scattering ∝ 1/λ⁴ · blue (450 nm) about 4 times red (650 nm)' },
    result: { obs: X('With milk the beam looked bluish from the side and the light coming through turned orange-red. Outside, the noon sky was blue and the Sun white; at sunset the Sun was orange-red.'),
      concl: X('Tiny particles and air molecules scatter blue light much more than red. Scattered blue light fills the sky; at sunrise and sunset, sunlight crosses so much air that the blue is lost and the Sun looks red.'),
      safety: X('Never look straight at the Sun, even at sunset, for more than a moment.'),
      viva: [{ q: X('Why is the sky blue?'), a: X('Air molecules scatter blue light much more than red, and this scattered blue light reaches us from all over the sky.') }, { q: X('Why does the sky look dark to astronauts in space?'), a: X('There is no air there to scatter sunlight.') }, { q: X('Why are danger signals red?'), a: X('Red is scattered least, so it can be seen from far away, even in fog.') }] },
  },
  // ============================================================ Class 7 (6, 8) · Newton's colour disc
  {
    id: 'sx7_colour_disc', subj: 'physics', cls: 7, also: [6, 8], ch: C7k,
    title: X('Newton\'s colour disc: seven colours make white'),
    aim: X('To spin a disc painted with the seven colours of the rainbow, slowly and then fast, and find out why it looks white when it spins fast.'),
    kind: X('White light is a mixture of colours; persistence of vision'),
    setup(K) {
      const W = Wd(K); const cd = K.add(P3.colourDisc({ W, app: K.app }), 0, 0, { y: 0 }); const card = K.add(cd.card, 0.25, -0.55); const speedK = K.add(P1.pullTab(), -0.05, -0.55);
      P3.bindDisc(cd, speedK, K.app, { speed: [1, 2], slow: 1, fast: 2, card: 3 }, { slow: emit(K, cd, 'slow'), fast: emit(K, cd, 'fast'), card: emit(K, cd, 'card') });
      P1.camBy(cd, K.app, [cd.views.all]);
      return { cd, card, speedK };
    },
    steps: [
      { do: X('Kyun? A rainbow shows that white sunlight has seven colours in it. Can we mix the seven colours back into white? Look at the disc.'), target: 'cd',
        act: async (K, o) => { K.lab.emit('look', { obj: o.cd.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A disc painted with seven sectors: violet, indigo, blue, green, yellow, orange and red, on a small electric spinner.') },
      { do: X('Slide the speed dial a little, so that the disc turns slowly (2 to 4 turns a second).'), target: 'speedK',
        act: async (K, o) => { await K.tween(1, (k) => o.cd.setF(k * 0.1)); await K.sleep(2); K.lab.emit('slow', { obj: o.cd.id }); }, ev: { type: 'slow' },
        see: X('You can still see the colours going round, smeared into one another.'), why: X('Each picture stays in your eye for about 1/16 of a second. In that time a slow disc turns only part of a turn, so the colours only partly mix.') },
      { do: X('Now turn the dial up until the disc spins fast (more than 16 turns a second).'), target: 'speedK',
        act: async (K, o) => { await K.tween(1.5, (k) => o.cd.setF(0.1 + 0.6 * k)); await K.sleep(2); K.lab.emit('fast', { obj: o.cd.id }); }, ev: { type: 'fast' },
        see: X('The colours disappear: the disc looks whitish grey.'), why: X('Now each point of your eye sees all seven colours within 1/16 of a second, and the eye adds them together. The seven colours together make white.') },
      { do: X('Hold the white card beside the spinning disc and compare.'), target: 'card',
        act: async (K, o) => { await new Promise((r) => o.cd.putCard(r)); await K.sleep(1.5); K.lab.emit('card', { obj: o.cd.id }); }, ev: { type: 'card' },
        check: (K, o) => (o.cd.f * P3.PERSIST < 1 ? { ok: false, see: X('The disc is turning too slowly: you still see colours.'), why: X('Spin it faster than 16 turns a second to see them mix.') } : null),
        see: X('The disc is not as white as the card: it looks light grey.'), why: X('Paints are not pure colours: each sector reflects only part of the light. The mixture is a dull white (grey). With pure coloured light, as from a prism, the mixture is truly white.') },
    ],
    eq: { word: 'Persistence of vision', sym: 'an image stays about 1/16 s · fast disc: all 7 colours mix → white' },
    result: { obs: X('Turning slowly, the colours could be seen going round; spinning fast (over 16 turns a second), the disc looked whitish grey, a little darker than the white card.'),
      concl: X('White light is a mixture of seven colours. When they reach the eye together, faster than it can tell them apart, they are seen as white.'),
      safety: X('Keep fingers and hair away from the spinning disc.'),
      viva: [{ q: X('Why does the disc look white when it spins fast?'), a: X('The eye keeps each image for about 1/16 s, so it sees all the colours at once and they mix to white.') }, { q: X('Who first showed that white light is made of colours?'), a: X('Isaac Newton, with a prism (and this disc is named after him).') }, { q: X('Why does the disc look greyish, not pure white?'), a: X('The paints are not pure colours and each reflects only part of the light.') }] },
  },
  // ============================================================ Class 8 (7) · regular and diffuse reflection
  {
    id: 'sx8_reflection_kinds', subj: 'physics', cls: 8, also: [7], ch: C8j,
    title: X('Regular and diffuse reflection: a mirror, paper, foil and cloth'),
    aim: X('To shine five parallel laser beams on a mirror, white paper, crumpled foil and cloth, and find out why a mirror shows your face but paper, which also reflects light, does not.'),
    kind: X('Regular and diffuse (irregular) reflection'),
    setup(K) {
      const W = Wd(K); const rb = K.add(P3.reflectBench({ W, app: K.app }), 0, 0, { y: 0 });
      const xs = [-0.3, -0.18, 0.18, 0.3]; const sm = rb.samples.map((t, i) => K.add(t, xs[i], -0.5)); const swK = K.add(P1.pullTab(), -0.3, -0.62);
      P3.bindRefl(rb, swK, K.app, { switch: 1, surf: { 1: 'mirror', 2: 'paper', 3: 'foil', 4: 'cloth' } }, { surf: emit(K, rb, 'surface') });
      P1.camBy(rb, K.app, [rb.views.all]);
      return { rb, mirror: sm[0], paper: sm[1], foil: sm[2], cloth: sm[3], swK };
    },
    steps: [
      { do: X('Kyun? A sheet of white paper reflects a lot of light; that is why it looks bright. So why can you see your face in a mirror but not in the paper? Look at the laser comb and the four surfaces.'), target: 'rb',
        act: async (K, o) => { K.lab.emit('look', { obj: o.rb.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A laser comb sends five parallel beams at 40° towards a holder in the middle of the board. A mirror strip, white paper, crumpled aluminium foil and a cotton cloth lie in front.') },
      { do: X('Put the mirror strip in the holder and switch the laser comb on.'), target: 'mirror',
        act: async (K, o) => { await new Promise((r) => o.rb.place(o.mirror, r)); o.rb.setOn(true); await K.sleep(1.5); K.lab.emit('surface', { obj: o.rb.id }); }, ev: { type: 'surface' },
        see: X('The five reflected beams leave at 40° on the other side of the normal, still parallel to each other.'), why: X('A mirror is smooth: at every point the normal points the same way, so every beam reflects at the same angle. This is regular reflection, and it forms an image.') },
      { do: X('Take the mirror out and put the white paper in its place.'), target: 'paper',
        act: async (K, o) => { await new Promise((r) => o.rb.place(o.paper, r)); await K.sleep(1.5); K.lab.emit('surface', { obj: o.rb.id }); }, ev: { type: 'surface' },
        see: X('The beams go off in different directions, and the paper glows where they hit it, sending faint light every way.'), why: X('Under a magnifier paper is a tangle of fibres: each beam meets a surface tilted a different way. Each one still obeys i = r, but the normals point everywhere. This is diffuse reflection: no image forms.') },
      { do: X('Now try the crumpled aluminium foil.'), target: 'foil',
        act: async (K, o) => { await new Promise((r) => o.rb.place(o.foil, r)); await K.sleep(1.5); K.lab.emit('surface', { obj: o.rb.id }); }, ev: { type: 'surface' },
        see: X('The beams are bright, but they fly off in different directions.'), why: X('Foil is shiny like a mirror, but crumpled: each little flat piece is a tiny mirror tilted its own way.') },
      { do: X('Last, the cotton cloth.'), target: 'cloth',
        act: async (K, o) => { await new Promise((r) => o.rb.place(o.cloth, r)); await K.sleep(1.5); K.lab.emit('surface', { obj: o.rb.id }); }, ev: { type: 'surface' },
        see: X('Very little light comes back, and it is spread out every way.'), why: X('The rough, dark cloth absorbs most of the light and scatters the rest in all directions.') },
    ],
    eq: { word: 'Law of reflection (at every point)', sym: 'angle of incidence = angle of reflection, measured from the normal at that point' },
    result: { obs: X('From the mirror the five beams came back parallel; from paper and cloth they scattered every way (cloth sent back little light); from crumpled foil they came back bright but in different directions.'),
      concl: X('A smooth surface gives regular reflection and an image; a rough surface gives diffuse reflection and no image, though every ray still obeys the law of reflection. We see most things by diffuse reflection.'),
      safety: X('Never look into a laser or point it at anyone\'s eyes.'),
      viva: [{ q: X('Does the law of reflection hold in diffuse reflection?'), a: X('Yes; it holds at every point, but the normals point in different directions.') }, { q: X('Why can we read a book from any angle?'), a: X('Paper reflects diffusely, sending light in all directions.') }, { q: X('Name a surface that gives regular reflection.'), a: X('A plane mirror, still water, polished steel.') }] },
  },
  // ============================================================ Class 10 · defects of the eye and their correction
  {
    id: 'sx10_eye_defects', subj: 'physics', cls: 10, ch: P10,
    title: X('Defects of the eye: why some children need glasses'),
    aim: X('To look at a far chart and a near reading card through a model eye, make the eyeball longer (myopia) and shorter (hypermetropia), and find the spectacle lens that gives a sharp image again.'),
    kind: X('Myopia, hypermetropia and their correction'),
    setup(K) {
      const W = Wd(K); const ey = K.add(P4.modelEye({ W, app: K.app }), 0, 0, { y: 0 }); const card = K.add(ey.card, 0.05, -0.48);
      const ls = ey.lenses.map((t, i) => K.add(t, -0.07 + i * 0.08, -0.55)); const lenK = K.add(P1.pullTab(), 0.42, -0.54);
      P4.bindEye(ey, lenK, K.app, { length: [3, 5], far: 1, near: 2, myopic: 3, concave: 4, hyper: 5, convex: 6 },
        { far: emit(K, ey, 'far'), near: emit(K, ey, 'near'), myopic: emit(K, ey, 'myopic'), concave: emit(K, ey, 'concave'), hyper: emit(K, ey, 'hyper'), convex: emit(K, ey, 'convex') });
      P1.camBy(ey, K.app, [ey.views.all, ey.views.eye]);
      return { ey, card, m2: ls[0], m1: ls[1], p1: ls[2], p2: ls[3], lenK };
    },
    steps: [
      { do: X('Kyun? Some children cannot read the blackboard from the back of the class; others find the letters of a book blurred. Why, and how do glasses help? Look at the model eye.'), target: 'ey',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ey.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A large model eye cut open: the cornea, the iris and pupil, the lens held by the ciliary muscles, and the retina at the back. An eye chart stands at the far end of the bench.') },
      { do: X('This is a normal eye. Look at the far chart: what forms on the retina?'), target: 'ey',
        act: async (K, o) => { if (o.ey.obj !== 'far') await new Promise((r) => o.ey.takeCard(r)); await K.sleep(2); K.lab.emit('far', { obj: o.ey.id }); }, ev: { type: 'far' },
        see: X('A sharp, small, upside-down image of the chart forms on the retina; the brain sees it upright.'), why: X('The relaxed eye lens focuses distant things exactly on the retina, 23 mm behind it.') },
      { do: X('Put the reading card in the holder, 25 cm in front of the eye.'), target: 'card',
        act: async (K, o) => { await new Promise((r) => o.ey.putCard(r)); await K.sleep(2); K.lab.emit('near', { obj: o.ey.id }); }, ev: { type: 'near' },
        see: X('The card is sharp too. Look at the lens: it has become rounder.'), why: X('The ciliary muscles squeeze the lens, making it thicker and stronger (4 dioptres more), so near things also focus on the retina. This is accommodation; 25 cm is the least distance of distinct vision.') },
      { do: X('Take the card away and make the eyeball 1 mm longer: slide the retina back to 24.0 mm. Look at the far chart.'), target: 'lenK',
        act: async (K, o) => { if (o.ey.obj !== 'far') await new Promise((r) => o.ey.takeCard(r)); const k = (0.024 - 0.0215) / 0.003; await K.tween(1.5, (q) => o.ey.setL(o.ey.kL + (k - o.ey.kL) * q)); o.ey.setL(k); await K.sleep(1.5); K.lab.emit('myopic', { obj: o.ey.id }); }, ev: { type: 'myopic' },
        see: X('The far chart is blurred, even with the lens fully relaxed: the rays meet in front of the retina.'), why: X('This is myopia (short-sightedness): the eyeball is too long (or the lens too strong). Near things are still seen clearly.') },
      { do: X('Find the spectacle lens that makes the chart sharp: put a trial lens in the frame in front of the eye.'), target: 'm2',
        act: async (K, o) => { await new Promise((r) => o.ey.putLens(o.m2, r)); await K.sleep(2); K.lab.emit('concave', { obj: o.ey.id }); }, ev: { type: 'concave' },
        check: (K, o) => (o.ey.res && o.ey.res.sharp < 0.8 ? { ok: false, see: X('The chart is still blurred.'), why: X('A convex lens makes it worse; a weak concave lens is not enough. Try the −2 D concave lens.') } : null),
        see: X('With the −2 D concave lens the chart is sharp again.'), why: X('A concave lens spreads the rays a little before they enter the eye, so they meet further back, on the retina.') },
      { do: X('Take the lens out, make the eyeball 1 mm shorter than normal (22.0 mm), and put the reading card back.'), target: 'lenK',
        act: async (K, o) => { o.ey.dropLens(o.ey.spec); const k = (0.022 - 0.0215) / 0.003; await K.tween(1.5, (q) => o.ey.setL(o.ey.kL + (k - o.ey.kL) * q)); o.ey.setL(k); await new Promise((r) => o.ey.putCard(r)); await K.sleep(1.5); K.lab.emit('hyper', { obj: o.ey.id }); }, ev: { type: 'hyper' },
        see: X('The card is blurred even with the lens squeezed as much as it can: the rays would meet behind the retina. The far chart would still be sharp.'), why: X('This is hypermetropia (long-sightedness): the eyeball is too short (or the lens too weak). Its near point has moved out to about 50 cm.') },
      { do: X('Find the lens that lets this eye read the card.'), target: 'p2',
        act: async (K, o) => { await new Promise((r) => o.ey.putLens(o.p2, r)); await K.sleep(2); K.lab.emit('convex', { obj: o.ey.id }); }, ev: { type: 'convex' },
        check: (K, o) => (o.ey.res && o.ey.res.sharp < 0.8 ? { ok: false, see: X('The card is still blurred.'), why: X('A concave lens makes it worse. Try the +2 D convex lens.') } : null),
        see: X('With the +2 D convex lens the card is sharp.'), why: X('A convex lens starts bending the rays together before they enter the eye, so they meet on the retina.') },
    ],
    eq: { word: 'Power of a lens', sym: 'P = 1/f (in metres), dioptre D · myopia: concave (−) · hypermetropia: convex (+)' },
    result: { obs: X('The normal eye saw far and near clearly. A 1 mm longer eye saw the far chart blurred; a −2 D lens corrected it. A 1 mm shorter eye could not read the card at 25 cm; a +2 D lens corrected it.'),
      concl: X('In myopia the image of a far object forms in front of the retina; a concave lens corrects it. In hypermetropia the image of a near object forms behind the retina; a convex lens corrects it.'),
      safety: X('Get your eyes tested by an eye doctor; never wear someone else\'s glasses.'),
      viva: [{ q: X('Which lens corrects myopia?'), a: X('A concave (diverging) lens of suitable power.') }, { q: X('What is accommodation?'), a: X('The eye lens changing its power (through the ciliary muscles) to focus near and far objects.') }, { q: X('What is the near point of a normal eye?'), a: X('About 25 cm.') }] },
  },
  // ============================================================ Class 9 · inertia at the bench
  {
    id: 'sx9_inertia', subj: 'physics', cls: 9, also: [8], ch: P9f,
    title: X('Inertia: the coin that drops into the glass, the carrom stack'),
    aim: X('To pull a card from under a coin slowly and with a sharp flick, and to strike the bottom coin of a carrom stack hard and gently, and find out why a body at rest tends to stay at rest.'),
    kind: X('Newton\'s first law: inertia of rest'),
    setup(K) {
      const W = Wd(K); const ib = K.add(P4.inertiaBench({ W, app: K.app }), 0, 0, { y: 0 });
      const coinK = K.add(P1.pullTab(), -0.22, -0.5), flickK = K.add(P1.pullTab(), -0.38, -0.66), carK = K.add(P1.pullTab(), 0.2, -0.5), strikeK = K.add(P1.pullTab(), 0.05, -0.64);
      P4.bindInertia(ib, coinK, flickK, carK, strikeK, K.app, { coin: [1, 2], slow: 1, flickIn: 2, carrom: [3, 4], clean: 3, soft: 4 }, { slow: emit(K, ib, 'slowpull'), flickIn: emit(K, ib, 'coinin'), clean: emit(K, ib, 'clean'), soft: emit(K, ib, 'topple') });
      P1.camBy(ib, K.app, [ib.views.all, ib.views.coin, ib.views.coin, ib.views.carrom, ib.views.carrom]);
      return { ib, coinK, flickK, carK, strikeK };
    },
    steps: [
      { do: X('Kyun? Flick a card from under a coin and the coin drops straight into the glass instead of flying away with the card. Why? Look at the glass and the carrom board.'), target: 'ib',
        act: async (K, o) => { K.lab.emit('look', { obj: o.ib.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('A ₹5 coin on a postcard on a glass tumbler; on a corner of a carrom board, a stack of six coins and a striker.') },
      { do: X('Set the dial to "slow pull" and push the button: your finger pulls the card away slowly.'), target: 'coinK',
        act: async (K, o) => { o.ib.setKc(0); await new Promise((r) => o.ib.flick(r)); await K.sleep(0.5); K.lab.emit('slowpull', { obj: o.ib.id }); }, ev: { type: 'slowpull' },
        see: X('The coin goes along with the card and falls off with it, outside the glass.'), why: X('Pulled slowly, the card speeds up gently; friction can give the coin the same push, so the coin moves with the card.') },
      { do: X('Now set the dial to a sharp flick and push the button again.'), target: 'flickK',
        act: async (K, o) => { o.ib.setKc(1); await new Promise((r) => o.ib.flick(r)); await K.sleep(0.5); K.lab.emit('coinin', { obj: o.ib.id }); }, ev: { type: 'coinin' },
        check: (K, o) => { const r = o.ib.coinRes; if (!r || r.res === 'in') return null; return { ok: false, see: X('The coin did not drop into the glass.'), why: X('The flick was not sharp enough: friction had time to drag the coin along. Flick harder.') }; },
        see: X('The card shoots away; the coin stays where it was and drops straight into the glass. Clink!'), why: X('The card is gone in a few hundredths of a second. Friction can only speed the coin up gently, so in that time it hardly moves: its inertia keeps it at rest, and gravity pulls it down into the glass.') },
      { do: X('On the carrom board, set the striker hard and strike the bottom coin of the stack.'), target: 'carK',
        act: async (K, o) => { o.ib.setKs(1); await new Promise((r) => o.ib.strike(r)); await K.sleep(0.5); K.lab.emit('clean', { obj: o.ib.id }); }, ev: { type: 'clean' },
        check: (K, o) => { const r = o.ib.stackRes; if (!r || r.res === 'clean') return null; return { ok: false, see: X('The stack did not drop down neatly.'), why: X('Strike harder, so the bottom coin is out before friction can drag the others.') }; },
        see: X('Only the bottom coin flies out; the rest of the stack drops straight down and stays standing.'), why: X('The coins above were at rest, and the hit was too quick for friction to move them: inertia of rest.') },
      { do: X('Now push the striker gently against the bottom coin.'), target: 'carK',
        act: async (K, o) => { o.ib.setKs(0); await new Promise((r) => o.ib.strike(r)); await K.sleep(0.5); K.lab.emit('topple', { obj: o.ib.id }); }, ev: { type: 'topple' },
        see: X('The bottom coin drags the coins above along with it, and the stack topples.'), why: X('A slow push gives friction time to act on the coins above, so they move too, but not all together.') },
    ],
    eq: { word: 'Newton\'s first law', sym: 'a body stays at rest, or moves on in a straight line at steady speed, unless a net force acts on it' },
    result: { obs: X('Pulled slowly, the coin went with the card; flicked sharply, it dropped into the glass. Struck hard, only the bottom carrom coin flew out and the stack dropped; pushed gently, the stack toppled.'),
      concl: X('A body at rest tends to stay at rest: this property is inertia. A quick, short force on one part leaves the parts at rest where they are.'),
      safety: X('Flick the card sideways, not towards anyone; keep the glass away from the edge of the table.'),
      viva: [{ q: X('What is inertia?'), a: X('The tendency of a body to stay in its state of rest or of uniform motion.') }, { q: X('Why does dust fly off a carpet when it is beaten?'), a: X('The carpet moves suddenly; the dust, by its inertia, stays at rest and separates.') }, { q: X('Which has more inertia, a cricket ball or a tennis ball?'), a: X('The cricket ball: it has more mass.') }] },
  },
  // ============================================================ Class 9 · inertia in a bus
  {
    id: 'sx9_inertia_bus', subj: 'physics', cls: 9, also: [8], ch: P9f, world: true, place: 'farm', table: false,
    title: X('Inertia in a bus: why we lurch when it brakes'),
    aim: X('To ride a bus on a village road, brake hard and gently and start suddenly, and see what the straps, a water bottle and a school bag do, and why.'),
    kind: X('Newton\'s first law: inertia of motion'),
    setup(K) {
      const W = Wd(K); const bu = K.add(P4.busRide({ W, app: K.app }), 0, 0, { y: 0 });
      const accK = K.add(P1.pullTab(), 0, -0.42, { y: 1.0 }), goK = K.add(P1.pullTab(), 0.38, -0.3, { y: 1.0 });
      P4.bindBus(bu, accK, goK, K.app, { acc: [2, 3, 4], go: [1, 2, 3, 4], start: 1, hard: 2, gentle: 3, jolt: 4 }, { start: emit(K, bu, 'cruise'), hard: emit(K, bu, 'hardbrake'), gentle: emit(K, bu, 'gentlebrake'), jolt: emit(K, bu, 'jolt') });
      P1.camBy(bu, K.app, [bu.views.all]);
      return { bu, accK, goK };
    },
    steps: [
      { do: X('Kyun? When a bus brakes suddenly, the standing passengers fall forward; when it starts with a jerk, they fall backward. Who pushed them? You are standing in the aisle of a bus.'), target: 'bu',
        act: async (K, o) => { K.lab.emit('look', { obj: o.bu.id }); await K.sleep(3); }, ev: { type: 'look' },
        see: X('Straps hang from the rails, a water bottle stands on the floor, a school bag sits on a seat.') },
      { do: X('Push the button to set off gently and reach 30 km/h.'), target: 'goK',
        act: async (K, o) => { o.bu.go(true); await until(K, () => o.bu.mode === 'cruise', 20); K.lab.emit('cruise', { obj: o.bu.id }); }, ev: { type: 'cruise' },
        see: X('The bus speeds up smoothly; the straps lean back a little and settle, the bottle stays standing.') },
      { do: X('Set the brakes to hard (about 6 m/s²) and push the button to brake.'), target: 'accK',
        act: async (K, o) => { o.bu.setKa(0.8); o.bu.brake(); await until(K, () => o.bu.mode === 'still', 15); await K.sleep(1); K.lab.emit('hardbrake', { obj: o.bu.id }); }, ev: { type: 'hardbrake' },
        see: X('The straps swing forward, the bottle falls over towards the front, the bag slides forward off the seat.'), why: X('The brakes stop the bus, but nothing pulls the things inside: by their inertia they go on moving forward at 30 km/h. Your feet stop with the bus, your body goes on, so you lurch forward.') },
      { do: X('Set off again, then brake gently (about 1.5 m/s²).'), target: 'accK',
        act: async (K, o) => { o.bu.go(true); await until(K, () => o.bu.mode === 'cruise', 20); o.bu.setKa(0.08); o.bu.brake(); await until(K, () => o.bu.mode === 'still', 15); await K.sleep(1); K.lab.emit('gentlebrake', { obj: o.bu.id }); }, ev: { type: 'gentlebrake' },
        check: (K, o) => (o.bu.bottleDown ? { ok: false, see: X('The bottle still fell over.'), why: X('You braked too hard. A bottle of this shape stands up to about 2.9 m/s²; brake more gently.') } : null),
        see: X('The straps lean forward only a little and the bottle stays standing.'), why: X('Slowing down gently, the friction of the floor can slow the bottle down with the bus. Good drivers brake gently.') },
      { do: X('Now set the dial high and start with a jerk.'), target: 'goK',
        act: async (K, o) => { o.bu.setKa(0.8); o.bu.go(false); await until(K, () => o.bu.mode === 'cruise', 15); await K.sleep(1); K.lab.emit('jolt', { obj: o.bu.id }); }, ev: { type: 'jolt' },
        see: X('This time the straps swing backward and the bottle falls towards the back.'), why: X('The bus moves off, but the things inside tend to stay at rest: inertia of rest. So passengers fall backward when a bus starts suddenly.') },
    ],
    eq: { word: 'Strap angle', sym: 'tan θ = a / g · bottle topples when a > g × (half its base ÷ height of its centre)' },
    result: { obs: X('Braking hard, the straps swung forward and the bottle and bag went forward; braking gently, the bottle stayed standing; starting with a jerk, everything went backward.'),
      concl: X('Things keep moving when the bus stops, and stay at rest when it starts: inertia of motion and of rest. That is why we lurch, and why seat belts and holding the strap keep us safe.'),
      safety: X('In a moving bus, hold a rail or strap; wear a seat belt in a car.'),
      viva: [{ q: X('Why do passengers fall forward when a bus brakes suddenly?'), a: X('Their bodies keep moving forward by inertia while their feet stop with the bus.') }, { q: X('Why are seat belts used?'), a: X('To stop the body from continuing forward when the vehicle stops suddenly.') }, { q: X('Which way does a hanging strap swing when a bus starts suddenly?'), a: X('Backward.') }] },
  },
];
