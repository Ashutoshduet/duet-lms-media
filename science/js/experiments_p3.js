// Physics experiments, batch 3 (Class 10): images by a concave mirror, a concave lens and a convex mirror, the laws of
// reflection with pins, dispersion of white light by a prism, the coin that reappears under water; current through
// different components, the factors on which resistance depends, and current and voltage in a series circuit.
import { DICT } from './exp_i18n.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const P9 = N('Ch 9 · Light – Reflection and Refraction', 'अध्याय 9 · प्रकाश – परावर्तन तथा अपवर्तन', 'Ch 9 · Light – Reflection aur Refraction');
const P10 = N('Ch 10 · The Human Eye and the Colourful World', 'अध्याय 10 · मानव नेत्र तथा रंगबिरंगा संसार', 'Ch 10 · Human Eye aur Colourful World');
const P11 = N('Ch 11 · Electricity', 'अध्याय 11 · विद्युत', 'Ch 11 · Electricity');
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const f2 = (n) => n.toFixed(2);
const benchCandle = (K, b, cm) => { const c = K.onBench(K.A3.candle({ h: 0.135 }), b, cm); c.lightSource = true; c.objH = 0.03; c.objY = 0.139 - K.OP.AXIS_Y; return c; };
const tagAt = (K, it, txt, sec = 2.2) => K.showTag(txt, it.g.position.clone().add(V(K, 0, 0.24, 0)), V(K, 0, 0.04, 0), sec);
const meterTag = (K, it, txt, sec = 2.2) => K.showTag(txt, it.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0.05, 0.05, 0), sec);
// a screen on a stand beside the bench (it does not block the light going to the mirror), turned a little towards the student
const sideScreen = (K, b, cm) => { const s = K.onBench(K.OP.screenOnStand({ lift: b.top }), b, cm, -0.075); s.g.rotation.y = -0.6; s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; return s; };
const red = 0xc62828, blk = 0x222222, yel = 0xd4a017;
// the rest of the strings used in tags
const _S = [X('Seen in the mirror: an enlarged, upright image'), X('Seen through the lens: upright, smaller'), X('Seen in the mirror: upright, smaller'), X('Nichrome wire'), X('Torch bulb'), X('10 W bulb'), X('Wire'), X('violet … red')];
void _S;

export const EXPERIMENTS_P3 = [
  {
    id: 'p10_mirror_images', subj: 'physics', cls: 10, ch: P9, title: X('Images formed by a concave mirror'),
    aim: X('To study the nature, position and size of the image formed by a concave mirror for different positions of the object.'),
    kind: X('Image formation by a concave mirror'),
    setup(K) { const b = K.bench(0, -0.6); const m = K.onBench(K.OP.mirrorOnStand(-0.15), b, 90); const c = benchCandle(K, b, 45); const s = sideScreen(K, b, 70); return { b, m, c, s }; },
    steps: [
      { do: X('Light the candle. The concave mirror (f = 15 cm) is at the 90 cm mark and the candle at the 45 cm mark, beyond C (u = 45 cm). The screen stands beside the bench so that it does not block the light.'), target: 'c', act: async (K, o) => { o.c.setLit(true); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); await K.sleep(1); }, see: X('The candle burns steadily, 45 cm in front of the mirror.') },
      { do: X('Move the screen until a sharp image of the flame forms on it.'), target: 's', act: async (K, o) => { const c = await K.focus(o.s, 58, 80, 1); await tagAt(K, o.s, `v = ${f1(90 - c)} cm`); }, ev: { type: 'focus' },
        see: X('A small, inverted, real image forms between F and C, about 22.5 cm from the mirror.') },
      { do: X('Move the candle to the 60 cm mark (at C, u = 30 cm) and find the sharp image again.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 60); const c = await K.focus(o.s, 50, 70, 1); await tagAt(K, o.s, `v = ${f1(90 - c)} cm`); }, ev: { type: 'focus' },
        see: X('The image is also at C, 30 cm from the mirror. It is inverted and the same size as the flame.') },
      { do: X('Move the candle to the 67.5 cm mark (between F and C, u = 22.5 cm) and find the image.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 67.5); const c = await K.focus(o.s, 35, 55, 1); await tagAt(K, o.s, `v = ${f1(90 - c)} cm`); }, ev: { type: 'focus' },
        see: X('The image forms beyond C, about 45 cm from the mirror. It is inverted and enlarged.') },
      { do: X('Move the candle to the 75 cm mark (at F) and look for an image with the screen.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 75); await K.slide(o.s, 85, 1); await K.slide(o.s, 10, 2.2); }, ev: { type: 'slide' },
        see: X('No sharp image forms anywhere on the screen.'), why: X('Rays from an object at the focus are reflected parallel to each other, so the image is at infinity.') },
      { do: X('Move the candle to the 80 cm mark (between P and F, u = 10 cm) and look into the mirror.'), target: 'm', act: async (K, o) => { await K.slide(o.c, 80); await tagAt(K, o.m, tl(K, X('Seen in the mirror: an enlarged, upright image')), 3); }, ev: { type: 'slide' },
        see: X('No image forms on the screen. In the mirror you see an enlarged, upright (virtual) image of the flame, behind the mirror.'), why: X('This is why a concave mirror is used as a shaving mirror or by dentists.') },
    ],
    eq: { word: 'Mirror formula and magnification', sym: '1/v + 1/u = 1/f · m = −v/u · e.g. u = −45 cm, f = −15 cm → v = −22.5 cm, m = −0.5' },
    result: { obs: X('u = 45 cm: v ≈ 22.5 cm, inverted, smaller. u = 30 cm (at C): v ≈ 30 cm, inverted, same size. u = 22.5 cm: v ≈ 45 cm, inverted, larger. At F: no image (at infinity). Between P and F: virtual, upright, enlarged image behind the mirror.'),
      concl: X('A concave mirror forms real, inverted images of objects beyond F; as the object comes closer to F the image moves farther away and grows larger. For an object between P and F the image is virtual, upright and magnified.'),
      safety: X('Keep the candle flame away from paper and hair; do not touch the hot wax. Handle the mirror by its edges.'),
      viva: [{ q: X('Where should the object be for a real image of the same size?'), a: X('At the centre of curvature C.') }, { q: X('Where is the image when the object is at the focus?'), a: X('At infinity: the reflected rays are parallel.') }, { q: X('Why is a concave mirror used in torches and headlights?'), a: X('With the bulb at its focus, it sends out a strong parallel beam of light.') }] },
  },
  ...['lens', 'mirror'].map((mode) => ({
    id: mode === 'lens' ? 'p10_concave_lens' : 'p10_convex_mirror', subj: 'physics', cls: 10, ch: P9,
    title: X(mode === 'lens' ? 'Images formed by a concave lens' : 'Images formed by a convex mirror'),
    aim: X(mode === 'lens' ? 'To observe the nature, position and size of the image formed by a concave lens.' : 'To observe the nature, position and size of the image formed by a convex mirror.'),
    kind: X(mode === 'lens' ? 'Concave lens: virtual image' : 'Convex mirror: virtual image'),
    setup(K) {
      const b = K.bench(0, -0.6);
      if (mode === 'lens') { const L = K.onBench(K.OP.lensOnStand(-0.15), b, 50); const c = benchCandle(K, b, 20); const s = K.onBench(K.OP.screenOnStand(), b, 70); return { b, L, c, s }; }
      const L = K.onBench(K.OP.mirrorOnStand(0.15), b, 90); const c = benchCandle(K, b, 60); const s = sideScreen(K, b, 40); return { b, L, c, s };
    },
    steps: mode === 'lens' ? [
      { do: X('Light the candle. The concave lens is at the 50 cm mark and the candle at the 20 cm mark (u = 30 cm).'), target: 'c', act: async (K, o) => { o.c.setLit(true); await K.sleep(1); }, see: X('The light from the candle passes through the lens.') },
      { do: X('Move the screen slowly on the other side of the lens and try to get an image on it.'), target: 's', act: async (K, o) => { await K.slide(o.s, 99, 1.4); await K.slide(o.s, 55, 2); }, ev: { type: 'slide' },
        see: X('No image forms on the screen at any position; the light only spreads out.'), why: X('A concave lens spreads out (diverges) the rays. They never meet, so no real image is formed.') },
      { do: X('Look through the lens from the other side.'), target: 'L', act: async (K, o) => { const { v, m } = K.OP.lensImage(-0.15, -0.3); await tagAt(K, o.L, `${tl(K, X('Seen through the lens: upright, smaller'))} · v = ${f1(v * 100)} cm, m = ${f2(m)}`, 3); }, ev: { type: 'look' },
        see: X('You see a small, upright (virtual) image of the flame on the same side as the candle, between the focus and the lens.') },
      { do: X('Move the candle farther, to the 5 cm mark (u = 45 cm), and look through the lens again.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 5, 1.4); const { v, m } = K.OP.lensImage(-0.15, -0.45); await tagAt(K, o.L, `v = ${f1(v * 100)} cm, m = ${f2(m)}`, 3); }, ev: { type: 'slide' },
        see: X('The image becomes still smaller and moves closer to the focus.'), why: X('Wherever the object is, a concave lens forms a virtual, upright, diminished image between its focus and the lens.') },
    ] : [
      { do: X('Light the candle. The convex mirror is at the 90 cm mark and the candle at the 60 cm mark (u = 30 cm).'), target: 'c', act: async (K, o) => { o.c.setLit(true); await K.sleep(1); }, see: X('The light from the candle falls on the mirror.') },
      { do: X('Move the screen in front of the mirror and try to get an image on it.'), target: 's', act: async (K, o) => { await K.slide(o.s, 85, 1.4); await K.slide(o.s, 15, 2.4); }, ev: { type: 'slide' },
        see: X('No image forms on the screen anywhere.'), why: X('A convex mirror reflects the rays so that they spread out. They never meet in front of the mirror.') },
      { do: X('Look into the mirror.'), target: 'L', act: async (K, o) => { const { v, m } = K.OP.mirrorImage(0.15, -0.3); await tagAt(K, o.L, `${tl(K, X('Seen in the mirror: upright, smaller'))} · v = +${f1(v * 100)} cm, m = ${f2(m)}`, 3); }, ev: { type: 'look' },
        see: X('You see a small, upright (virtual) image of the flame behind the mirror.') },
      { do: X('Move the candle to the 30 cm mark (u = 60 cm) and look into the mirror again.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 30, 1.4); const { v, m } = K.OP.mirrorImage(0.15, -0.6); await tagAt(K, o.L, `v = +${f1(v * 100)} cm, m = ${f2(m)}`, 3); }, ev: { type: 'slide' },
        see: X('The image is still upright and becomes even smaller. It stays behind the mirror, between P and F.'), why: X('A convex mirror always gives an upright, diminished image and shows a wide view. That is why it is used as a rear-view mirror in vehicles.') },
    ],
    eq: mode === 'lens' ? { word: 'Lens formula for a concave lens', sym: '1/v − 1/u = 1/f · f = −15 cm, u = −30 cm → v = −10 cm, m = v/u = +0.33' } : { word: 'Mirror formula for a convex mirror', sym: '1/v + 1/u = 1/f · f = +15 cm, u = −30 cm → v = +10 cm, m = −v/u = +0.33' },
    result: mode === 'lens' ? { obs: X('No image could be obtained on the screen. Through the lens a small upright image was seen: v ≈ −10 cm for u = −30 cm, and v ≈ −11 cm for u = −45 cm.'),
      concl: X('A concave lens always forms a virtual, upright and diminished image between its optical centre and focus, on the same side as the object.'),
      safety: X('Keep the candle flame away from paper and hair; hold the lens by its edge.'),
      viva: [{ q: X('Why can a concave lens not form an image on a screen?'), a: X('Its image is virtual: the refracted rays spread out and never meet.') }, { q: X('What is the power of this lens?'), a: X('P = 1/f = 1/(−0.15 m) ≈ −6.7 D.') }, { q: X('Which defect of vision is corrected with a concave lens?'), a: X('Myopia (short-sightedness).') }] }
      : { obs: X('No image could be obtained on the screen. In the mirror a small upright image was seen: v ≈ +10 cm for u = −30 cm, and v ≈ +12 cm for u = −60 cm.'),
        concl: X('A convex mirror always forms a virtual, upright and diminished image behind the mirror, between P and F.'),
        safety: X('Keep the candle flame away from paper and hair; handle the mirror by its edges.'),
        viva: [{ q: X('Why are convex mirrors used as rear-view mirrors?'), a: X('They always give an upright image and a much wider field of view.') }, { q: X('Can a convex mirror form a real image?'), a: X('No, its image is always virtual.') }, { q: X('Is the focal length of a convex mirror positive or negative?'), a: X('Positive: its focus is behind the mirror.') }] },
  })),
  {
    id: 'p10_reflection', subj: 'physics', cls: 10, ch: P9, title: X('Laws of reflection with a plane mirror'),
    aim: X('To verify the laws of reflection of light using a plane mirror and pins.'),
    kind: X('Laws of reflection (pin method)'),
    setup(K) {
      const bd = K.add(K.RF.drawingBoard(), -0.05, -0.66); const pm = K.add(K.O2.planeMirror(), 0.3, -0.48); const pc = K.lay(K.RF.pencil(), 0.22, -0.44, 0.4); const pr = K.add(K.RF.protractor(), 0.34, -0.74);
      const pins = [0xc0392b, 0xc0392b, 0x2d6fcf, 0x2d6fcf].map((c, i) => K.add(K.RF.pinItem(c), 0.24 + i * 0.03, -0.62)); pins.forEach((p, i) => { p.name = X(['Pin P', 'Pin Q', 'Pin R', 'Pin S'][i]); });
      return { bd, pm, pc, pr, P: pins[0], Q: pins[1], R: pins[2], S: pins[3] };
    },
    steps: [
      { do: X('Draw a straight line MM′ across the sheet and a normal ON at its middle point O.'), target: 'pc',
        act: async (K, o) => { o.O = [0, 0.06]; await K.pencil(o.pc, o.bd, [-0.11, 0.06], [0.11, 0.06]); o.bd.dot([-0.11, 0.06], 'M', { dy: -14 }); o.bd.dot([0.11, 0.06], 'M′', { dx: -40, dy: -14 }); await K.pencil(o.pc, o.bd, o.O, [0, -0.07], { dash: true, col: '#555' }); o.bd.dot(o.O, 'O', { dy: -14 }); o.bd.text([0.004, -0.068], 'N'); }, ev: { type: 'draw' },
        see: X('The line MM′ and the normal ON are drawn.') },
      { do: X('Draw a line PO at 30° to the normal (the incident ray). Stand the mirror strip on MM′ with its silvered face exactly on the line.'), target: 'pm',
        act: async (K, o) => { const D = K.RF.D; o.dir = [Math.sin(30 * D), Math.cos(30 * D)]; await K.pencil(o.pc, o.bd, [o.O[0] - o.dir[0] * 0.11, o.O[1] - o.dir[1] * 0.11], o.O); const w = o.bd.g.localToWorld(o.bd.toLocal(...o.O)); await K.moveTo(o.pm, w, new K.THREE.Quaternion(), 1); o.pm.home = { p: o.pm.g.position.clone(), q: o.pm.g.quaternion.clone() }; }, ev: { type: 'draw' },
        see: X('The mirror stands upright on MM′; the incident ray PO meets it at O.') },
      { do: X('Fix two pins P and Q upright on the line PO, well apart.'), target: 'P',
        act: async (K, o) => { const O = o.O, d = o.dir; await K.pinAt(o.P, o.bd, O[0] - d[0] * 0.09, O[1] - d[1] * 0.09); await K.pinAt(o.Q, o.bd, O[0] - d[0] * 0.045, O[1] - d[1] * 0.045); }, ev: { type: 'pin' },
        see: X('Pins P and Q stand on the incident ray. Their images can be seen in the mirror.') },
      { do: X('Looking into the mirror from the other side of the normal, fix pins R and S so that they and the images of P and Q all appear in one straight line.'), target: 'R',
        act: async (K, o) => { const O = o.O, e = [o.dir[0], -o.dir[1]]; await K.pinAt(o.R, o.bd, O[0] + e[0] * 0.045, O[1] + e[1] * 0.045); await K.pinAt(o.S, o.bd, O[0] + e[0] * 0.09, O[1] + e[1] * 0.09); }, ev: { type: 'pin' },
        see: X('R and S hide the images of Q and P exactly: all four appear in one line.') },
      { do: X('Remove the mirror and the pins. Mark the pin positions, join S and R up to O (the reflected ray) and measure the angles of incidence and reflection.'), target: 'pr',
        act: async (K, o) => { const D = K.RF.D, O = o.O; await K.lift(o.pm, 0.3, -0.48); for (const p of [o.P, o.Q, o.R, o.S]) { o.bd.dot(p.uv, p.name.en.slice(-1), { dx: 8 }); await K.lift(p, p.g.position.x, -0.46); }
          const e = [o.dir[0], -o.dir[1]]; await K.pencil(o.pc, o.bd, [O[0] + e[0] * 0.11, O[1] + e[1] * 0.11], O, { col: '#c0392b' });
          const w = o.bd.g.localToWorld(o.bd.toLocal(...O)); await K.moveTo(o.pr, w.clone().add(V(K, 0, 0.0005, 0)), null, 0.9);
          o.bd.arc(O, 0.036, -Math.PI / 2, -Math.PI / 2 - 30 * D, '∠i = 30°'); o.bd.arc(O, 0.03, -Math.PI / 2, -Math.PI / 2 + 30 * D, '∠r = 30°', { col: '#c0392b' });
          await K.sleep(1); await K.home(o.pr, 0.8); await K.showTag('∠i = 30°   ∠r = 30°', o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 3); }, ev: { type: 'draw' },
        see: X('∠i = 30° and ∠r = 30°: the angle of reflection is equal to the angle of incidence.'), why: X('This is the law of reflection. The incident ray, the normal and the reflected ray all lie in the plane of the sheet.') },
      { do: X('Repeat with angles of incidence of 45° and 60°.'), target: 'bd',
        act: async (K, o) => { const D = K.RF.D, O = o.O; for (const [deg, col] of [[45, '#2d6fcf'], [60, '#2e8b57']]) { const d = [Math.sin(deg * D), Math.cos(deg * D)]; await K.pencil(o.pc, o.bd, [O[0] - d[0] * 0.1, O[1] - d[1] * 0.1], O, { fast: true, col }); await K.pencil(o.pc, o.bd, O, [O[0] + d[0] * 0.1, O[1] - d[1] * 0.1], { fast: true, col }); }
          await K.showTag('i = 45°: r = 45°   ·   i = 60°: r = 60°', o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 3.5); }, ev: { type: 'draw' },
        see: X('Each time the angle of reflection equals the angle of incidence.') },
    ],
    eq: { word: 'Laws of reflection', sym: '∠i = ∠r · the incident ray, the normal and the reflected ray lie in one plane' },
    result: { obs: X('For i = 30°, 45° and 60° the angle of reflection r was 30°, 45° and 60°.'),
      concl: X('The angle of reflection is always equal to the angle of incidence, and the incident ray, the normal at the point of incidence and the reflected ray lie in the same plane.'),
      safety: X('Handle the mirror strip carefully; its edges can be sharp. Keep the pins upright and at least 5 cm apart, and line up the bottoms of the pin images.'),
      viva: [{ q: X('What is the angle of reflection when a ray falls along the normal?'), a: X('Zero: the ray goes back along the same path.') }, { q: X('Why should the pins be placed far apart?'), a: X('It reduces the error in drawing the direction of the ray.') }, { q: X('What kind of image does a plane mirror form?'), a: X('Virtual, upright, of the same size, and as far behind the mirror as the object is in front of it.') }] },
  },
  {
    id: 'p10_dispersion', subj: 'physics', cls: 10, ch: P10, title: X('Dispersion of white light by a glass prism'),
    aim: X('To observe the splitting of white light into its colours by a glass prism.'),
    kind: X('Dispersion of white light'),
    setup(K) {
      const sh = K.add(K.O2.blackSheet(), 0.02, -0.66); const top = sh.g.position.y + sh.surfY; const at = (u, v) => sh.g.localToWorld(sh.toLocal(u, v));
      const p0 = at(-0.3, -0.07); const rb = K.add(K.O2.rayBox(), p0.x, p0.z, { y: top });
      const pm = K.add(K.RF.glassPrism(), 0.4, -0.46);
      // where the light will leave the prism once it is turned to 22°: the card stands in the middle of the fan, 27 cm away
      const RF = K.RF; const a = Math.PI + 22 * RF.D; const c = [-0.05, -0.07]; const poly = pm.corners.map(([x, y]) => RF.add(c, [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])); const t = RF.traceThrough(poly, [-0.2625, -0.07], [1, 0], 1.627);
      const cc = RF.add(t.F, RF.mul(t.dout, 0.27)); const cw = at(...cc); const cd = K.add(K.O2.cardScreen(), cw.x, cw.z, { y: top, ry: Math.atan2(-t.dout[0], t.dout[1]) });
      const sp = new K.O2.Spectrum(K.app.scene, sh, rb, pm, cd); K.extras.push(...sp.meshes); K.solver(() => sp.update());
      return { sh, rb, pm, cd, sp, at };
    },
    steps: [
      { do: X('Switch on the ray box. A narrow beam of white light comes out of its slit and shows as a bright streak on the black paper.'), target: 'rb', act: async (K, o) => { o.rb.setOn(true); K.app.audio && K.app.audio.clink && K.app.audio.clink(); K.lab.emit('switch', { obj: o.rb.id }); await K.sleep(1.2); }, ev: { type: 'switch' },
        see: X('A thin, straight streak of white light runs across the paper.') },
      { do: X('Place the glass prism in the path of the beam, with one corner pointing towards you.'), target: 'pm', act: async (K, o) => { const w = o.at(-0.05, -0.07); await K.moveTo(o.pm, w, new K.THREE.Quaternion().setFromAxisAngle(V(K, 0, 1, 0), Math.PI + 12 * K.RF.D), 1.2); o.pm.home = { p: o.pm.g.position.clone(), q: o.pm.g.quaternion.clone() }; K.lab.emit('place', { obj: o.pm.id }); await K.sleep(0.8); }, ev: { type: 'place' },
        see: X('The beam bends as it passes through the prism, and the light coming out has coloured edges.') },
      { do: X('Turn the prism slowly about its upright edge until the light that comes out falls on the white screen.'), target: 'pm', act: async (K, o) => { const q0 = o.pm.g.quaternion.clone(); const ax = V(K, 0, 1, 0); await K.tween(3.2, (k) => { o.pm.g.quaternion.setFromAxisAngle(ax, Math.PI + (12 + 10 * k) * K.RF.D); }); void q0; o.pm.home = { p: o.pm.g.position.clone(), q: o.pm.g.quaternion.clone() }; K.lab.emit('turn', { obj: o.pm.id }); await K.sleep(0.8); }, ev: { type: 'turn' },
        see: X('The light leaving the prism spreads out like a fan, and a band of colours appears on the screen.') },
      { do: X('Look at the band of colours on the screen and note their order.'), target: 'cd', act: async (K, o) => { await K.showTag('V  I  B  G  Y  O  R', o.cd.g.position.clone().add(V(K, 0, 0.08, 0)), V(K, 0, 0.05, 0), 3); const d = o.sp.out ? o.sp.out.dev : null; if (d) await K.showTag(`D (${tl(K, X('violet … red'))}) = ${Math.round(d[d.length - 1])}° … ${Math.round(d[0])}°`, o.cd.g.position.clone().add(V(K, 0, 0.08, 0)), V(K, 0, 0.05, 0), 2.6); }, ev: { type: 'look' },
        see: X('Seven colours: violet, indigo, blue, green, yellow, orange and red. Red is bent the least and violet the most.'), why: X('Each colour travels at a different speed in glass, so the prism bends each colour through a different angle. This splitting of white light into its colours is called dispersion.') },
      { do: X('Switch off the ray box.'), target: 'rb', act: async (K, o) => { o.rb.setOn(false); K.lab.emit('switch', { obj: o.rb.id }); await K.sleep(0.8); }, ev: { type: 'switch' },
        see: X('The beam and the band of colours disappear.') },
    ],
    eq: { word: 'Dispersion of white light by a prism', sym: 'white light → V I B G Y O R · deviation: violet the most, red the least (n is largest for violet)' },
    result: { obs: X('A narrow beam of white light passing through the prism spread out into a band of seven colours on the screen; red was deviated the least and violet the most.'),
      concl: X('White light is made up of seven colours. A glass prism splits (disperses) it because the refractive index of glass is different for different colours.'),
      safety: X('Do not look straight into the ray box or at the Sun. The lamp gets hot: do not touch it while it is on.'),
      viva: [{ q: X('What is the band of colours called?'), a: X('The spectrum of white light.') }, { q: X('Which colour is bent the most by the prism?'), a: X('Violet.') }, { q: X('Which natural phenomenon is caused by dispersion?'), a: X('The rainbow: sunlight is dispersed by tiny raindrops.') }] },
  },
  {
    id: 'p10_coin_bowl', subj: 'physics', cls: 10, ch: P9, title: X('The coin that reappears: refraction at water'),
    aim: X('To observe that an object under water appears raised because of the refraction of light.'),
    kind: X('Apparent depth (Activity)'),
    setup(K) { const bw = K.add(K.O2.steelBowl(), 0, -0.6); const cn = K.add(K.O2.coin(), 0.15, -0.5); cn.cam = K.app.camera; cn.bowl = bw; const bk = K.beaker(-0.2, -0.54, 'water', 450, 500); return { bw, cn, bk }; },
    steps: [
      { do: X('Put the coin in the middle of the empty bowl.'), target: 'cn', act: async (K, o) => { const w = o.bw.g.localToWorld(V(K, 0, o.bw.inner[0].y + 0.0003, 0)); await K.moveTo(o.cn, w, new K.THREE.Quaternion(), 1); o.cn.home = { p: o.cn.g.position.clone(), q: o.cn.g.quaternion.clone() }; K.lab.emit('place', { obj: o.cn.id }); }, ev: { type: 'place' },
        see: X('The coin lies flat at the bottom of the bowl. From above you can see it clearly.') },
      { do: X('Move back and lower your eyes slowly until the coin just disappears behind the rim of the bowl. Keep your eyes there.'), target: 'bw', act: async (K, o) => { o.bw.camView = { p: V(K, 0, 0.19, 0.42), t: V(K, 0, 0.012, 0) }; K.lab.emit('look', { obj: o.bw.id }); await K.sleep(2.6); }, ev: { type: 'look' },
        see: X('The rim of the bowl hides the coin completely.'), why: X('Light travels in straight lines: the rim blocks the light going from the coin to your eye.') },
      { do: X('Ask a friend to pour water gently into the bowl without moving the coin. Keep looking from the same place.'), target: 'bk', act: (K, o) => K.pour(o.bk, o.bw, 400), ev: { type: 'pour' },
        see: X('As the water rises, the coin comes into view again!'), why: X('Light from the coin bends away from the normal as it leaves the water. Your eye follows the bent ray back in a straight line, so the coin appears raised and can be seen over the rim.') },
      { do: X('Now look at the coin from straight above the bowl.'), target: 'cn', act: async (K, o) => { o.bw.camView = { p: V(K, 0, 0.4, 0.07), t: V(K, 0, 0.01, 0) }; await K.sleep(2.4); const d = o.bw.levelWorld() - o.cn.g.position.y; await K.showTag(`${tl(K, X('Real depth'))} ≈ ${f1(d * 100)} cm · ${tl(K, X('apparent depth'))} ≈ ${f1((d / 1.33) * 100)} cm`, o.bw.g.position.clone().add(V(K, 0, 0.06, 0)), V(K, 0.08, 0.06, 0), 3); }, ev: { type: 'look' },
        see: X('Seen from above, the coin looks nearer than it is: the bottom of the bowl appears raised.'), why: X('Apparent depth = real depth ÷ refractive index of water (1.33), so water looks shallower than it really is.') },
    ],
    eq: { word: 'Apparent depth of an object under water', sym: 'apparent depth = real depth / n · n (water) = 1.33 → a coin 3.6 cm deep appears about 2.7 cm deep from above' },
    result: { obs: X('The coin hidden behind the rim became visible again when water was poured into the bowl, and it appeared raised. From above, the bowl looked shallower than it is.'),
      concl: X('Light bends (refracts) when it passes from water into air. Because of refraction, objects under water appear raised, nearer the surface than they really are.'),
      safety: X('Pour the water gently so that the coin does not move. Wipe up any spilled water.'),
      viva: [{ q: X('Why does a swimming pool look shallower than it is?'), a: X('Refraction at the water surface makes its bottom appear raised.') }, { q: X('Does light bend towards or away from the normal when it goes from water into air?'), a: X('Away from the normal.') }, { q: X('What is the refractive index of water?'), a: X('About 1.33.') }] },
  },
  {
    id: 'p10_components', subj: 'physics', cls: 10, ch: P11, title: X('Current through different components'),
    aim: X('To compare the currents through different components connected one by one to the same battery.'),
    kind: X('Current and resistance (Activity)'),
    setup(K) {
      const bat = K.add(K.A4.cellPack(4), -0.42, -0.6); const key = K.add(K.A4.plugKey(), -0.28, -0.5); const am = K.add(K.EL.meter('A', 1.5), -0.12, -0.5);
      const nw = K.add(K.EL.resistorBoard(5, { name: X('Nichrome wire') }), 0.04, -0.62); const tb = K.add(K.A4.bulb(), 0.18, -0.5); tb.Rb = 20; tb.Prated = 1.8; const lb = K.add(K.EL.lampBulb(), 0.3, -0.62);
      const [, , wX, wY] = K.wires([[[bat, '+'], [key, 'a'], red], [[key, 'b'], [am, '+'], red], [[am, '-'], [nw, 'a'], red], [[nw, 'b'], [bat, '-'], blk]]);
      return { bat, key, am, nw, tb, lb, wX, wY };
    },
    steps: [
      { do: X('The circuit has 4 cells (6 V), a plug key and an ammeter in series, with a gap XY. A nichrome wire is connected in the gap.'), target: 'nw', act: (K) => K.sleep(1.4), see: X('The free ends X and Y are clipped to the two terminals of the nichrome wire.') },
      { do: X('Insert the key and note the ammeter reading. Then remove the key.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(1.6); o.I1 = o.am.read(); await meterTag(K, o.am, `I = ${f2(o.I1)} A`); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The ammeter reads about 1.05 A for the nichrome wire.') },
      { do: X('Replace the nichrome wire with the torch bulb: clip X and Y to its terminals. Insert the key and note the current.'), target: 'tb', act: async (K, o) => { await Promise.all([K.moveLead(o.wX, 'b', o.tb.terms.a), K.moveLead(o.wY, 'a', o.tb.terms.b)]); await K.keyOn(o.key, true); await K.sleep(1.6); o.I2 = o.am.read(); await meterTag(K, o.am, `I = ${f2(o.I2)} A`); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The torch bulb glows brightly and the ammeter reads about 0.3 A.') },
      { do: X('Now connect the 12 V, 10 W bulb in the gap XY and note the current.'), target: 'lb', act: async (K, o) => { await Promise.all([K.moveLead(o.wX, 'b', o.lb.terms.a), K.moveLead(o.wY, 'a', o.lb.terms.b)]); await K.keyOn(o.key, true); await K.sleep(1.8); o.I3 = o.am.read(); await meterTag(K, o.am, `I = ${f2(o.I3)} A`); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The bigger bulb glows only dimly (it is made for 12 V), and the ammeter reads about 0.5 A.') },
      { do: X('Compare the three readings.'), target: 'am', act: async (K, o) => { await K.showTag(`${tl(K, X('Nichrome wire'))}: ${f2(o.I1 ?? 1.05)} A · ${tl(K, X('Torch bulb'))}: ${f2(o.I2 ?? 0.3)} A · ${tl(K, X('10 W bulb'))}: ${f2(o.I3 ?? 0.5)} A`, o.am.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0.12, 0.1, 0), 4); }, ev: { type: 'look' },
        see: X('The current is different for each component, although the battery is the same.'), why: X('Each component has a different resistance. For the same potential difference, the current is smaller through a component with more resistance (I = V/R).') },
    ],
    eq: { word: 'Current through a component', sym: 'I = V / R · same battery (6 V): larger R → smaller I' },
    result: { obs: X('With the same 6 V battery the current was about 1.05 A through the nichrome wire, 0.3 A through the torch bulb and 0.5 A through the 10 W bulb.'),
      concl: X('Different components allow different currents for the same potential difference, because they have different resistances.'),
      safety: X('Insert the key only while taking a reading. Do not touch the bulbs: they get hot.'),
      viva: [{ q: X('Which component here has the largest resistance?'), a: X('The torch bulb, because the least current flows through it.') }, { q: X('The voltage across the nichrome wire is 5.3 V and the current is 1.05 A. What is its resistance?'), a: X('R = V/I = 5.3/1.05 ≈ 5 Ω.') }, { q: X('Why does the 10 W bulb glow dimly here?'), a: X('It is made for 12 V; at 6 V it takes much less power than its rating.') }] },
  },
  {
    id: 'p10_resistance', subj: 'physics', cls: 10, ch: P11, title: X('Factors on which resistance depends'),
    aim: X('To study how the resistance of a wire depends on its length, its thickness and its material.'),
    kind: X('Length, thickness and material of a wire'),
    setup(K) {
      const bat = K.add(K.A4.cellPack(1), -0.4, -0.6); bat.rInt = 0.45; const key = K.add(K.A4.plugKey(), -0.28, -0.5); const am = K.add(K.EL.meter('A', 3, { lc: 0.05 }), -0.12, -0.5);
      const W = (len, d, mat, label, z) => K.add(K.EL.wireSample({ len, d, mat, label }), 0.2, z);
      const s1 = W(0.15, 0.274, 'nichrome', '(1) Nichrome · l', -0.46), s2 = W(0.3, 0.274, 'nichrome', '(2) Nichrome · 2l', -0.53), s3 = W(0.15, 0.457, 'nichrome', '(3) Nichrome · l · thick', -0.6), s4 = W(0.15, 0.274, 'copper', '(4) Copper · l', -0.67);
      const [, , wX, wY] = K.wires([[[bat, '+'], [key, 'a'], red], [[key, 'b'], [am, '+'], red], [[am, '-'], [s1, 'a'], red], [[s1, 'b'], [bat, '-'], blk]]);
      return { bat, key, am, s1, s2, s3, s4, wX, wY };
    },
    steps: [
      { do: X('The circuit has one cell (1.5 V), a plug key, an ammeter and a gap XY. Wire (1), nichrome of length l, is connected in the gap. Insert the key and note the current.'), target: 'key',
        act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(1.6); o.I = [o.am.read()]; await meterTag(K, o.am, `(1): I = ${f2(o.I[0])} A`); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('The ammeter reads about 0.45 A.') },
      ...[['s2', X('Replace it with wire (2): the same nichrome wire, but twice as long (2l). Note the current.'), X('The current falls to about 0.25 A, roughly half: doubling the length doubles the resistance.'), null],
        ['s3', X('Now connect wire (3): nichrome of length l, but thicker. Note the current.'), X('The current rises to about 1.0 A: the thicker wire, with its larger area of cross-section, has less resistance.'), null],
        ['s4', X('Finally connect wire (4): copper, of the same length and thickness as wire (1). Take the reading quickly and remove the key.'), X('The current jumps to about 2.75 A, far more than with the nichrome wire of the same size.'), X('Copper has a much smaller resistivity than nichrome (about 65 times smaller), so its resistance is tiny. The cell is nearly short-circuited, so remove the key at once.')]].map(([k, d, s, why], i) => ({
        do: d, target: k, act: async (K, o) => { const w = o[k]; await Promise.all([K.moveLead(o.wX, 'b', w.terms.a), K.moveLead(o.wY, 'a', w.terms.b)]); await K.keyOn(o.key, true); await K.sleep(1.6); (o.I = o.I || [])[i + 1] = o.am.read(); await meterTag(K, o.am, `(${i + 2}): I = ${f2(o.I[i + 1])} A`); await K.keyOn(o.key, false); }, ev: { type: 'key' }, see: s, ...(why ? { why } : {}) })),
      { do: X('Compare the four readings.'), target: 'am', act: async (K, o) => { const I = o.I || []; await K.showTag(I.map((v, i) => `(${i + 1}) ${f2(v ?? 0)} A`).join(' · '), o.am.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0.12, 0.1, 0), 4); }, ev: { type: 'look' },
        see: X('Resistance increases with length, decreases with thickness, and depends on the material.'), why: X('R = ρ l / A: the resistance is proportional to the length, inversely proportional to the area of cross-section, and depends on the resistivity ρ of the material.') },
    ],
    eq: { word: 'Resistance of a wire', sym: 'R = ρ l / A · ρ (nichrome) ≈ 1.1 × 10⁻⁶ Ω m, ρ (copper) ≈ 1.7 × 10⁻⁸ Ω m' },
    result: { obs: X('Wire (1): 0.45 A. Wire (2), twice as long: 0.25 A. Wire (3), thicker: 1.0 A. Wire (4), copper of the same size: 2.75 A.'),
      concl: X('The resistance of a conductor is directly proportional to its length, inversely proportional to its area of cross-section, and depends on its material: R = ρ l / A.'),
      safety: X('Insert the key only for a moment while reading, especially with the copper wire, which nearly short-circuits the cell.'),
      viva: [{ q: X('How does the resistance change if the length of a wire is doubled?'), a: X('It doubles.') }, { q: X('Why are heating elements made of nichrome?'), a: X('Nichrome has a high resistivity and does not burn (oxidise) easily when red hot.') }, { q: X('Why are connecting wires made of copper?'), a: X('Copper has a very low resistivity, so very little energy is wasted in the wires.') }] },
  },
  {
    id: 'p10_series_iv', subj: 'physics', cls: 10, ch: P11, title: X('Current and voltage in a series circuit'),
    aim: X('To show that the current is the same everywhere in a series circuit and that the total potential difference is the sum of the potential differences across the resistors.'),
    kind: X('Series circuit: I and V'),
    setup(K) {
      const bat = K.add(K.A4.cellPack(4), -0.44, -0.6); const key = K.add(K.A4.plugKey(), -0.3, -0.5); const am = K.add(K.EL.meter('A', 1.5), -0.14, -0.48);
      const R1 = K.add(K.EL.resistorBoard(1), 0.0, -0.66), R2 = K.add(K.EL.resistorBoard(2), 0.14, -0.66), R3 = K.add(K.EL.resistorBoard(3), 0.28, -0.66); const vm = K.add(K.EL.meter('V', 6, { lc: 0.1 }), 0.14, -0.5);
      const [wA, wB, wC, wD, wE, wF, wV1, wV2] = K.wires([[[bat, '+'], [key, 'a'], red], [[key, 'b'], [am, '+'], red], [[am, '-'], [R1, 'a'], red], [[R1, 'b'], [R2, 'a'], red], [[R2, 'b'], [R3, 'a'], red], [[R3, 'b'], [bat, '-'], blk], [[vm, '+'], [R1, 'a'], yel], [[vm, '-'], [R3, 'b'], yel]]);
      void wA; void wD; void wF; return { bat, key, am, vm, R1, R2, R3, wB, wC, wE, wV1, wV2 };
    },
    steps: [
      { do: X('Resistors of 1 Ω, 2 Ω and 3 Ω are joined end to end (in series) with the battery (6 V), the key and the ammeter. The voltmeter is across the whole combination XY.'), target: 'R2', act: (K) => K.sleep(1.4), see: X('The meters read zero: the key is open.') },
      { do: X('Insert the key. Note the ammeter reading I and the voltmeter reading V across the combination.'), target: 'key', act: async (K, o) => { await K.keyOn(o.key, true); await K.sleep(1.6); o.I = o.am.read(); o.V = o.vm.read(); await meterTag(K, o.am, `I = ${f2(o.I)} A`); await meterTag(K, o.vm, `V = ${f1(o.V)} V`); }, ev: { type: 'key' },
        see: X('I ≈ 0.9 A and V ≈ 5.4 V.') },
      { do: X('Remove the key. Connect the ammeter between the 2 Ω and the 3 Ω resistors instead, and insert the key again.'), target: 'am',
        act: async (K, o) => { await K.keyOn(o.key, false); await K.moveLead(o.wB, 'b', o.R1.terms.a); await K.moveLead(o.wE, 'b', o.am.terms['+']); await K.moveLead(o.wC, 'b', o.R3.terms.a); await K.keyOn(o.key, true); await K.sleep(1.6); await meterTag(K, o.am, `I = ${f2(o.am.read())} A`); }, ev: { type: 'key' },
        see: X('The ammeter shows the same current, about 0.9 A.'), why: X('In a series circuit the same current flows through every part of the circuit.') },
      { do: X('Now connect the voltmeter across the 1 Ω resistor only, then across the 2 Ω and then the 3 Ω resistor. Note V₁, V₂ and V₃.'), target: 'vm',
        act: async (K, o) => { o.Vs = []; const pairs = [[o.R1, o.R1], [o.R2, o.R2], [o.R3, o.R3]]; for (let i = 0; i < 3; i++) { const [a, b] = pairs[i]; await Promise.all([K.moveLead(o.wV1, 'b', a.terms.a), K.moveLead(o.wV2, 'b', b.terms.b)]); await K.sleep(1.4); o.Vs.push(o.vm.read()); await meterTag(K, o.vm, `V${'₁₂₃'[i]} = ${f1(o.Vs[i])} V`, 1.8); } }, ev: { type: 'lead' },
        see: X('V₁ ≈ 0.9 V, V₂ ≈ 1.8 V and V₃ ≈ 2.7 V.') },
      { do: X('Compare V with V₁ + V₂ + V₃, and find V/I. Then remove the key.'), target: 'key',
        act: async (K, o) => { const s = (o.Vs || [0.9, 1.8, 2.7]).reduce((a, b) => a + b, 0); await K.showTag(`V₁ + V₂ + V₃ = ${f1(s)} V ≈ V = ${f1(o.V ?? 5.4)} V · V/I = ${f1((o.V ?? 5.4) / Math.max(0.01, o.I ?? 0.9))} Ω`, o.vm.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0.1, 0.1, 0), 4); await K.keyOn(o.key, false); }, ev: { type: 'key' },
        see: X('V₁ + V₂ + V₃ = V. V/I ≈ 6 Ω, which is the sum of the three resistances.'), why: X('In series the battery’s potential difference is shared between the resistors in proportion to their resistances, and the total resistance is Rs = R₁ + R₂ + R₃.') },
    ],
    eq: { word: 'Resistors in series', sym: 'the same I everywhere · V = V₁ + V₂ + V₃ · Rs = R₁ + R₂ + R₃ = 6 Ω' },
    result: { obs: X('I ≈ 0.9 A at both positions of the ammeter. V₁ ≈ 0.9 V, V₂ ≈ 1.8 V, V₃ ≈ 2.7 V and V ≈ 5.4 V. V/I ≈ 6 Ω.'),
      concl: X('In a series circuit the same current flows through each resistor, the total potential difference is the sum of the potential differences across the resistors, and Rs = R₁ + R₂ + R₃.'),
      safety: X('Always remove the key before changing any connection. Join the + terminals of the meters towards the + terminal of the battery.'),
      viva: [{ q: X('Is the current the same through each resistor in series?'), a: X('Yes, the same current flows through all of them.') }, { q: X('Which resistor has the largest potential difference across it?'), a: X('The 3 Ω resistor, because V = IR.') }, { q: X('What happens to the other bulbs in a series circuit if one bulb fuses?'), a: X('They all go off, because the circuit is broken.') }] },
  },
];
