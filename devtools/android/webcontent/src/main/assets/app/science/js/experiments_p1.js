// Physics experiments, batch 1 (Class 10): light — focal length of a concave mirror and a convex lens, images formed by a convex
// lens, refraction through a glass slab and a prism; electricity — Ohm's law, resistors in series and in parallel.
import { DICT } from './exp_i18n.js';
import { BENCH_Y } from './room.js';
import './actions_phys.js';
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const tl = (K, x) => x[K.app.lang] || x.en;
const P9 = N('Ch 9 · Light – Reflection and Refraction', 'अध्याय 9 · प्रकाश – परावर्तन तथा अपवर्तन', 'Ch 9 · Light – Reflection aur Refraction');
const P11 = N('Ch 11 · Electricity', 'अध्याय 11 · विद्युत', 'Ch 11 · Electricity');
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
// a far-away window as the object (its rays are nearly parallel)
const windowObj = (K) => { const w = K.solver(() => {}); w.lightSource = true; w.far = true; return w; };
// the lit candle as the object on the bench: flame centred on the optical axis
const benchCandle = (K, b, cm) => { const c = K.onBench(K.A3.candle({ h: 0.135 }), b, cm); c.lightSource = true; c.objH = 0.03; c.objY = 0.139 - K.OP.AXIS_Y; return c; };
const tagAt = (K, it, txt) => K.showTag(txt, it.g.position.clone().add(V(K, 0, 0.24, 0)), V(K, 0, 0.04, 0), 2.2);

export const EXPERIMENTS_P1 = [
  {
    id: 'p10_mirror_f', subj: 'physics', cls: 10, ch: P9, title: X('Focal length of a concave mirror'),
    aim: X('To find the focal length of a concave mirror by obtaining the image of a distant object.'),
    kind: X('Concave mirror, distant object (CBSE practical)'),
    setup(K) { const b = K.bench(0, -0.64); const w = windowObj(K); const m = K.onBench(K.OP.mirrorOnStand(-0.15), b, 70); const s = K.onBench(K.OP.screenOnStand(), b, 40); return { b, w, m, s }; },
    steps: [
      { do: X('Turn the concave mirror towards a window far away (a distant object) and hold the white screen in front of the mirror.'), target: 'm', act: (K) => K.sleep(1.2), see: X('A patch of light reflected by the mirror falls on the screen.') },
      { do: X('Move the screen slowly towards and away from the mirror until a sharp image of the window forms on it.'), target: 's', act: async (K, o) => { o.c1 = await K.focus(o.s, 40, 62, 1); }, ev: { type: 'focus' },
        see: X('A small, inverted, sharp image of the window appears on the screen.'), why: X('Rays from a very distant object are nearly parallel. A concave mirror brings parallel rays together at its principal focus, so the sharp image is at the focus.') },
      { do: X('Read the positions of the mirror and the screen on the scale. Their difference is the focal length.'), target: 'b', act: async (K, o) => { const m = K.cmOf(o.m), s = K.cmOf(o.s); o.fA = m - s; await tagAt(K, o.m, `${tl(K, X('Mirror'))}: ${f1(m)} cm`); await tagAt(K, o.s, `${tl(K, X('Screen'))}: ${f1(s)} cm · f = ${f1(m - s)} cm`); },
        see: X('Mirror at 70.0 cm, screen at about 55.0 cm: f ≈ 15.0 cm.') },
      { do: X('Repeat with the mirror at the 85 cm mark and take the mean of the two values.'), target: 'm', act: async (K, o) => { await K.slide(o.m, 85); await K.slide(o.s, 60, 0.6); const c = await K.focus(o.s, 60, 78, 1); const f = K.cmOf(o.m) - c; await tagAt(K, o.s, `f = ${f1(f)} cm · ${tl(K, X('mean'))} = ${f1((o.fA + f) / 2)} cm`); }, ev: { type: 'focus' },
        see: X('Again the sharp image is about 15 cm from the mirror. The focal length of the mirror is about 15 cm.') },
    ],
    eq: { word: 'Focal length f = distance between the mirror and the sharp image of a distant object', sym: 'f = (mirror reading) − (screen reading) ≈ 15 cm; R = 2f' },
    result: { obs: X('A sharp, diminished, inverted image of the distant window formed about 15 cm in front of the mirror.'),
      concl: X('The focal length of the given concave mirror is about 15 cm (its radius of curvature is about 30 cm).'),
      safety: X('Never use the Sun as the object for a long time: the focused sunlight can burn paper or your skin. Handle the mirror by its edges.'),
      viva: [{ q: X('Why is a distant object used?'), a: X('Its rays are almost parallel to each other, so they meet at the principal focus.') }, { q: X('What is the nature of the image?'), a: X('Real, inverted and highly diminished.') }, { q: X('How is the radius of curvature related to the focal length?'), a: X('R = 2f.') }] },
  },
  {
    id: 'p10_lens_f', subj: 'physics', cls: 10, ch: P9, title: X('Focal length of a convex lens'),
    aim: X('To find the focal length of a convex lens by obtaining the image of a distant object.'),
    kind: X('Convex lens, distant object (CBSE practical)'),
    setup(K) { const b = K.bench(0, -0.64); const w = windowObj(K); const l = K.onBench(K.OP.lensOnStand(0.15), b, 30); const s = K.onBench(K.OP.screenOnStand(), b, 62); return { b, w, l, s }; },
    steps: [
      { do: X('Turn the lens towards a distant window and put the screen on the other side of the lens.'), target: 'l', act: (K) => K.sleep(1.2), see: X('A blurred patch of light falls on the screen.') },
      { do: X('Move the screen until a sharp image of the window forms on it.'), target: 's', act: async (K, o) => { o.c1 = await K.focus(o.s, 62, 38, 1); }, ev: { type: 'focus' },
        see: X('A small, inverted, sharp image of the window appears on the screen.'), why: X('A convex lens converges parallel rays from a distant object to its principal focus.') },
      { do: X('Read the positions of the lens and the screen; their difference is the focal length.'), target: 'b', act: async (K, o) => { const l = K.cmOf(o.l), s = K.cmOf(o.s); await tagAt(K, o.l, `${tl(K, X('Lens'))}: ${f1(l)} cm`); await tagAt(K, o.s, `${tl(K, X('Screen'))}: ${f1(s)} cm · f = ${f1(s - l)} cm`); },
        see: X('Lens at 30.0 cm, screen at about 45.0 cm: f ≈ 15.0 cm.') },
    ],
    eq: { word: 'Focal length f = distance between the lens and the sharp image of a distant object', sym: 'f = (screen reading) − (lens reading) ≈ 15 cm' },
    result: { obs: X('A sharp, diminished, inverted image of the distant window formed about 15 cm behind the lens.'),
      concl: X('The focal length of the given convex lens is about 15 cm.'),
      safety: X('Do not look at the Sun through a lens. Hold the lens by its edge and keep it clean.'),
      viva: [{ q: X('Why is a convex lens called a converging lens?'), a: X('It bends parallel rays so that they meet at a point (the focus).') }, { q: X('What is the power of a lens with f = 15 cm?'), a: X('P = 1/f = 1/0.15 m ≈ +6.7 D.') }, { q: X('Can a concave lens form a real image of a distant object on a screen?'), a: X('No, it always forms a virtual image.') }] },
  },
  {
    id: 'p10_lens_images', subj: 'physics', cls: 10, ch: P9, title: X('Images formed by a convex lens'),
    aim: X('To find the position, nature and size of the image formed by a convex lens for different positions of the object.'),
    kind: X('Image formation by a convex lens'),
    setup(K) { const b = K.bench(0, -0.64); const l = K.onBench(K.OP.lensOnStand(0.15), b, 50); const c = benchCandle(K, b, 5); const s = K.onBench(K.OP.screenOnStand(), b, 64); return { b, l, c, s }; },
    steps: [
      { do: X('Light the candle. The convex lens (f = 15 cm) is at the 50 cm mark; put the candle at the 5 cm mark, beyond 2F₁.'), target: 'c', act: async (K, o) => { o.c.setLit(true); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); await K.sleep(1); }, see: X('The candle burns steadily, 45 cm from the lens.') },
      { do: X('Move the screen behind the lens until the image of the flame is sharp.'), target: 's', act: async (K, o) => { const c = await K.focus(o.s, 62, 86, 1); await tagAt(K, o.s, `v = ${f1(c - 50)} cm`); }, ev: { type: 'focus' },
        see: X('A small, inverted, real image forms between F₂ and 2F₂ (about 22.5 cm behind the lens).') },
      { do: X('Move the candle to the 20 cm mark (at 2F₁) and find the sharp image again.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 20); const c = await K.focus(o.s, 70, 92, 1); await tagAt(K, o.s, `v = ${f1(c - 50)} cm`); }, ev: { type: 'focus' },
        see: X('The image is at 2F₂ (30 cm behind the lens), inverted and the same size as the flame.') },
      { do: X('Move the candle to the 27 cm mark (between F₁ and 2F₁) and find the image.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 27); const c = await K.focus(o.s, 82, 99, 1); await tagAt(K, o.s, `v = ${f1(c - 50)} cm`); }, ev: { type: 'focus' },
        see: X('The image is beyond 2F₂ (about 43 cm behind the lens), inverted and enlarged.') },
      { do: X('Move the candle to the 35 cm mark (at F₁) and look for an image with the screen.'), target: 'c', act: async (K, o) => { await K.slide(o.c, 35); await K.slide(o.s, 99, 1.2); await K.slide(o.s, 60, 1.6); }, ev: { type: 'slide' },
        see: X('No sharp image forms anywhere: there is only a large patch of light.'), why: X('Rays from an object at the focus come out of the lens parallel; the image would be at infinity.') },
      { do: X('Move the candle to the 42 cm mark (between F₁ and the lens) and look through the lens from the other side.'), target: 'l', act: async (K, o) => { await K.slide(o.c, 42); await K.slide(o.s, 99, 1.2); await tagAt(K, o.l, tl(K, X('Seen through the lens: an enlarged, upright image'))); }, ev: { type: 'slide' },
        see: X('No image on the screen. Through the lens you see an enlarged, upright (virtual) image of the flame, on the same side as the candle.'), why: X('This is how a convex lens works as a magnifying glass.') },
    ],
    eq: { word: 'Lens formula and magnification', sym: '1/v − 1/u = 1/f · m = v/u · e.g. u = −45 cm, f = 15 cm → v = +22.5 cm, m = −0.5' },
    result: { obs: X('u = −45 cm: v ≈ 22.5 cm, inverted, smaller. u = −30 cm (2F): v ≈ 30 cm, inverted, same size. u = −23 cm: v ≈ 43 cm, inverted, larger. At F: no image (infinity). Between F and O: virtual, upright, enlarged image seen through the lens.'),
      concl: X('As the object comes closer to a convex lens, its real image moves farther away and becomes larger; inside the focus the image is virtual, upright and magnified. The results agree with 1/v − 1/u = 1/f.'),
      safety: X('Keep the candle flame away from paper and hair; do not touch the hot wax.'),
      viva: [{ q: X('Where should the object be for a real image of the same size?'), a: X('At 2F₁, i.e. at twice the focal length.') }, { q: X('When does a convex lens act as a magnifying glass?'), a: X('When the object is between the optical centre and the focus.') }, { q: X('What does a negative magnification mean?'), a: X('The image is real and inverted.') }] },
  },
  {
    id: 'p10_slab', subj: 'physics', cls: 10, ch: P9, title: X('Refraction through a rectangular glass slab'),
    aim: X('To trace the path of a ray of light through a rectangular glass slab for different angles of incidence and to measure the angles of incidence, refraction and emergence.'),
    kind: X('Refraction through a glass slab (CBSE practical)'),
    setup(K) {
      const bd = K.add(K.RF.drawingBoard(), -0.05, -0.66); const sl = K.add(K.RF.glassSlab(), 0.3, -0.5); const pc = K.lay(K.RF.pencil(), 0.22, -0.44, 0.4); const pr = K.add(K.RF.protractor(), 0.34, -0.72);
      const pins = [0xc0392b, 0xc0392b, 0x2d6fcf, 0x2d6fcf].map((c, i) => K.add(K.RF.pinItem(c), 0.24 + i * 0.03, -0.62)); pins.forEach((p, i) => { p.name = X(['Pin P', 'Pin Q', 'Pin R', 'Pin S'][i]); });
      return { bd, sl, pc, pr, P: pins[0], Q: pins[1], R: pins[2], S: pins[3] };
    },
    steps: [
      { do: X('Place the glass slab in the middle of the sheet and draw its outline ABCD with a pencil.'), target: 'sl',
        act: async (K, o) => { const w = o.bd.g.localToWorld(o.bd.toLocal(0, 0)); await K.moveTo(o.sl, w, new K.THREE.Quaternion(), 1); o.sl.home = { p: o.sl.g.position.clone(), q: o.sl.g.quaternion.clone() }; const a = 0.0375 + 0.001, d = 0.025 + 0.001; const c = [[-a, -d], [a, -d], [a, d], [-a, d]]; for (let i = 0; i < 4; i++) await K.pencil(o.pc, o.bd, c[i], c[(i + 1) % 4], { fast: true }); },
        ev: { type: 'draw' }, see: X('The outline ABCD of the slab is drawn on the sheet.') },
      { do: X('Draw a normal at point E on side AB and a line at 30° to it (the incident ray). Fix pins P and Q upright on this line.'), target: 'P',
        act: async (K, o) => { const RF = K.RF, D = RF.D; o.E = [-0.02, -0.025]; const i = 30 * D; o.dir = [Math.sin(i), Math.cos(i)]; await K.pencil(o.pc, o.bd, [o.E[0], o.E[1] - 0.06], [o.E[0], o.E[1] + 0.06], { dash: true, col: '#555' }); const P0 = [o.E[0] - o.dir[0] * 0.09, o.E[1] - o.dir[1] * 0.09]; await K.pencil(o.pc, o.bd, P0, o.E); o.bd.dot(o.E, 'E');
          await K.pinAt(o.P, o.bd, o.E[0] - o.dir[0] * 0.075, o.E[1] - o.dir[1] * 0.075); await K.pinAt(o.Q, o.bd, o.E[0] - o.dir[0] * 0.035, o.E[1] - o.dir[1] * 0.035); }, ev: { type: 'pin' },
        see: X('Pins P and Q stand on the incident ray.') },
      { do: X('Look at the images of P and Q through side CD. Fix pins R and S so that R, S and the images of P and Q all appear in one straight line.'), target: 'R',
        act: async (K, o) => { const a = 0.0375, d = 0.025; o.t = K.RF.traceThrough([[-a, -d], [a, -d], [a, d], [-a, d]], [o.E[0] - o.dir[0] * 0.1, o.E[1] - o.dir[1] * 0.1], o.dir); const F = o.t.F, e = o.t.dout; await K.pinAt(o.R, o.bd, F[0] + e[0] * 0.035, F[1] + e[1] * 0.035); await K.pinAt(o.S, o.bd, F[0] + e[0] * 0.075, F[1] + e[1] * 0.075); }, ev: { type: 'pin' },
        see: X('Seen through the glass, the pins R and S hide the images of Q and P exactly.') },
      { do: X('Remove the slab and the pins, mark their positions, join S and R to meet CD at F, and join E and F.'), target: 'sl',
        act: async (K, o) => { await K.lift(o.sl, 0.3, -0.5); for (const p of [o.P, o.Q, o.R, o.S]) { o.bd.dot(p.uv, p.name.en.slice(-1), { dx: 8 }); await K.lift(p, p.g.position.x + 0.0, -0.46); } const F = o.t.F, e = o.t.dout; await K.pencil(o.pc, o.bd, [F[0] + e[0] * 0.09, F[1] + e[1] * 0.09], F); o.bd.dot(F, 'F'); await K.pencil(o.pc, o.bd, o.E, F, { col: '#c0392b' }); await K.pencil(o.pc, o.bd, [F[0], F[1] - 0.04], [F[0], F[1] + 0.05], { dash: true, col: '#555' }); }, ev: { type: 'draw' },
        see: X('The path of the ray is complete: incident ray PQE, refracted ray EF inside the glass, and emergent ray FRS.') },
      { do: X('Measure the angle of incidence (i), the angle of refraction (r) and the angle of emergence (e) with the protractor.'), target: 'pr',
        act: async (K, o) => { const D = K.RF.D, E = o.E, F = o.t.F; const w = o.bd.g.localToWorld(o.bd.toLocal(E[0], E[1])); await K.moveTo(o.pr, w.clone().add(V(K, 0, 0.0005, 0)), null, 0.9);
          o.bd.arc(E, 0.022, -Math.PI / 2, -Math.PI / 2 - 30 * D, `i = ${Math.round(o.t.i)}°`); o.bd.arc(E, 0.016, Math.PI / 2, Math.PI / 2 - o.t.r * D, `r = ${f1(o.t.r)}°`); o.bd.arc(F, 0.02, Math.PI / 2, Math.PI / 2 - o.t.e * D, `e = ${Math.round(o.t.e)}°`);
          await K.sleep(1.2); await K.home(o.pr, 0.8); await K.showTag(`i = ${Math.round(o.t.i)}°   r = ${f1(o.t.r)}°   e = ${Math.round(o.t.e)}°`, o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 3); }, ev: { type: 'draw' },
        see: X('i = 30°, r ≈ 19.5°, e = 30°. The emergent ray is parallel to the incident ray but shifted sideways.'), why: X('Light bends towards the normal on entering glass (denser) and away from the normal on leaving it. The two faces are parallel, so the angle of emergence equals the angle of incidence.') },
      { do: X('Repeat for angles of incidence of 45° and 60° on fresh lines.'), target: 'bd',
        act: async (K, o) => { const D = K.RF.D, a = 0.0375, d = 0.025; const res = []; for (const [deg, x0] of [[45, -0.002], [60, 0.016]]) { const E = [x0, -d]; const dir = [Math.sin(deg * D), Math.cos(deg * D)]; const t = K.RF.traceThrough([[-a, -d], [a, -d], [a, d], [-a, d]], [E[0] - dir[0] * 0.1, E[1] - dir[1] * 0.1], dir); if (!t || !t.dout) continue; await K.pencil(o.pc, o.bd, [E[0] - dir[0] * 0.07, E[1] - dir[1] * 0.07], E, { fast: true, col: '#2d6fcf' }); await K.pencil(o.pc, o.bd, E, t.F, { fast: true, col: '#2d6fcf' }); const F = t.F, e = t.dout; await K.pencil(o.pc, o.bd, F, [F[0] + e[0] * 0.07, F[1] + e[1] * 0.07], { fast: true, col: '#2d6fcf' }); res.push(`i = ${deg}°: r = ${f1(t.r)}°, e = ${Math.round(t.e)}°`); }
          await K.showTag(res.join('   '), o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 3.5); }, ev: { type: 'draw' },
        see: X('i = 45°: r ≈ 28°, e = 45°. i = 60°: r ≈ 35°, e = 60°. Each time e = i, and r is smaller than i.') },
    ],
    eq: { word: "Snell's law of refraction", sym: 'sin i / sin r = n (glass) ≈ 1.5 · e = i' },
    result: { obs: X('i = 30°, 45°, 60° gave r ≈ 19.5°, 28°, 35° and e = 30°, 45°, 60°. sin i / sin r ≈ 1.5 each time.'),
      concl: X('Light bends towards the normal when it enters the glass and away from it when it leaves. The emergent ray is parallel to the incident ray (e = i) but laterally displaced.'),
      safety: X('Keep the pins vertical and handle them with care. Use a sharp pencil and fine lines; draw the normal accurately.'),
      viva: [{ q: X('Why is the emergent ray parallel to the incident ray?'), a: X('The opposite faces of the slab are parallel, so the bending at the two faces is equal and opposite.') }, { q: X('What is lateral displacement?'), a: X('The sideways shift between the incident ray (extended) and the emergent ray.') }, { q: X('What is the refractive index of the glass from these readings?'), a: X('n = sin 30° / sin 19.5° ≈ 1.5.') }] },
  },
  {
    id: 'p10_prism', subj: 'physics', cls: 10, ch: N('Ch 10 · The Human Eye and the Colourful World', 'अध्याय 10 · मानव नेत्र तथा रंगबिरंगा संसार', 'Ch 10 · Human Eye aur Colourful World'), title: X('Refraction through a glass prism'),
    aim: X('To trace the path of a ray of light through a glass prism and to find the angle of deviation.'),
    kind: X('Refraction through a prism (CBSE practical)'),
    setup(K) {
      const bd = K.add(K.RF.drawingBoard(), -0.05, -0.66); const pm = K.add(K.RF.glassPrism(), 0.3, -0.5); const pc = K.lay(K.RF.pencil(), 0.22, -0.44, 0.4); const pr = K.add(K.RF.protractor(), 0.34, -0.74);
      const pins = [0xc0392b, 0xc0392b, 0x2d6fcf, 0x2d6fcf].map((c, i) => K.add(K.RF.pinItem(c), 0.24 + i * 0.03, -0.64)); pins.forEach((p, i) => { p.name = X(['Pin P', 'Pin Q', 'Pin R', 'Pin S'][i]); });
      return { bd, pm, pc, pr, P: pins[0], Q: pins[1], R: pins[2], S: pins[3] };
    },
    steps: [
      { do: X('Place the prism on the sheet with one face (the base) towards you and draw its outline ABC.'), target: 'pm',
        act: async (K, o) => { const w = o.bd.g.localToWorld(o.bd.toLocal(0, 0)); await K.moveTo(o.pm, w, new K.THREE.Quaternion(), 1); o.pm.home = { p: o.pm.g.position.clone(), q: o.pm.g.quaternion.clone() }; const c = o.pm.corners.map(([x, y]) => [x, y]); o.poly = c; for (let i = 0; i < 3; i++) await K.pencil(o.pc, o.bd, c[i], c[(i + 1) % 3], { fast: true }); }, ev: { type: 'draw' },
        see: X('The triangular outline of the prism is drawn.') },
      { do: X('Draw a normal on face AB and a ray PE at 40° to it; fix pins P and Q on it.'), target: 'P',
        act: async (K, o) => { const RF = K.RF, D = RF.D; const [A, B] = [o.poly[0], o.poly[1]]; const ab = RF.norm(RF.sub(B, A)); o.E = RF.add(A, RF.mul(RF.sub(B, A), 0.5)); let nrm = [ab[1], -ab[0]]; if (RF.dot(nrm, o.E) < 0) nrm = RF.mul(nrm, -1); // outward normal of face AB
          const inw = RF.mul(nrm, -1); const ang = 40 * D; const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)]; o.dir = rot(inw, ang); if (RF.dot(o.dir, [0, 1]) < -2) o.dir = rot(inw, -ang);
          await K.pencil(o.pc, o.bd, RF.add(o.E, RF.mul(nrm, 0.05)), RF.add(o.E, RF.mul(nrm, -0.02)), { dash: true, col: '#555' }); await K.pencil(o.pc, o.bd, RF.sub(o.E, RF.mul(o.dir, 0.1)), o.E); o.bd.dot(o.E, 'E');
          const Pp = RF.sub(o.E, RF.mul(o.dir, 0.085)), Qp = RF.sub(o.E, RF.mul(o.dir, 0.045)); await K.pinAt(o.P, o.bd, ...Pp); await K.pinAt(o.Q, o.bd, ...Qp); }, ev: { type: 'pin' },
        see: X('Pins P and Q stand on the incident ray.') },
      { do: X('Looking through face AC, fix pins R and S in line with the images of P and Q.'), target: 'R',
        act: async (K, o) => { const RF = K.RF; o.t = RF.traceThrough(o.poly, RF.sub(o.E, RF.mul(o.dir, 0.1)), o.dir); const F = o.t.F, e = o.t.dout; await K.pinAt(o.R, o.bd, ...RF.add(F, RF.mul(e, 0.04))); await K.pinAt(o.S, o.bd, ...RF.add(F, RF.mul(e, 0.085))); }, ev: { type: 'pin' },
        see: X('Pins R and S line up with the images of P and Q seen through the prism; the line of sight is bent towards the base.') },
      { do: X('Remove the prism and pins; join S and R to F and join E to F. Extend the incident and emergent rays to meet, and measure the angle of deviation.'), target: 'pm',
        act: async (K, o) => { const RF = K.RF, D = RF.D; await K.lift(o.pm, 0.3, -0.5); for (const p of [o.P, o.Q, o.R, o.S]) await K.lift(p, p.g.position.x, -0.46); const F = o.t.F, e = o.t.dout;
          await K.pencil(o.pc, o.bd, RF.add(F, RF.mul(e, 0.1)), F); await K.pencil(o.pc, o.bd, o.E, F, { col: '#c0392b' }); await K.pencil(o.pc, o.bd, o.E, RF.add(o.E, RF.mul(o.dir, 0.08)), { dash: true, col: '#777' }); await K.pencil(o.pc, o.bd, F, RF.sub(F, RF.mul(e, 0.06)), { dash: true, col: '#777' });
          o.dev = Math.acos(Math.max(-1, Math.min(1, RF.dot(o.dir, e)))) / D; await K.showTag(`i = 40°   e = ${Math.round(o.t.e)}°   D = ${f1(o.dev)}°`, o.bd.g.position.clone().add(V(K, 0, 0.05, 0)), V(K, 0, 0.08, 0), 3.5); }, ev: { type: 'draw' },
        see: X('The ray bends towards the base twice. For i = 40° the angle of emergence is about 58° and the angle of deviation D is about 38°.'), why: X('A prism has inclined faces, so the bending at the two faces adds up: the emergent ray is deviated towards the base. D = i + e − A (A = 60°).') },
    ],
    eq: { word: 'Angle of deviation for a prism of angle A', sym: 'D = i + e − A · A = r₁ + r₂ · sin i = n sin r₁' },
    result: { obs: X('For i = 40° on a 60° glass prism: e ≈ 58°, angle of deviation D ≈ 38°. The ray bent towards the base at both faces.'),
      concl: X('Light passing through a prism bends towards its base; the emergent ray is deviated from the incident direction by the angle of deviation D = i + e − A.'),
      safety: X('Keep the pins vertical and at least 5 cm apart; place the prism exactly on its outline.'),
      viva: [{ q: X('Why does a ray bend towards the base of a prism?'), a: X('At both faces it bends in the same sense because the faces are inclined to each other.') }, { q: X('What is the angle of the prism here?'), a: X('60°.') }, { q: X('What happens to white light passing through a prism?'), a: X('It splits into its colours (dispersion), violet bending the most.') }] },
  },
  ...['ohm', 'series', 'parallel'].map((mode) => ({
    id: { ohm: 'p10_ohm', series: 'p10_series', parallel: 'p10_parallel' }[mode], subj: 'physics', cls: 10, ch: P11,
    title: X({ ohm: "Ohm's law: V–I graph of a resistor", series: 'Resistors in series', parallel: 'Resistors in parallel' }[mode]),
    aim: X({ ohm: 'To study the dependence of the potential difference (V) across a resistor on the current (I) through it, and to find its resistance from a V–I graph.', series: 'To find the equivalent resistance of two resistors connected in series.', parallel: 'To find the equivalent resistance of two resistors connected in parallel.' }[mode]),
    kind: X({ ohm: "Ohm's law (CBSE practical)", series: 'Equivalent resistance in series (CBSE practical)', parallel: 'Equivalent resistance in parallel (CBSE practical)' }[mode]),
    setup(K) {
      const bat = K.add(K.A4.cellPack(4), -0.42, -0.62); const key = K.add(K.A4.plugKey(), -0.28, -0.5); const am = K.add(K.EL.meter('A', 1.5), -0.1, -0.5); const rh = K.add(K.EL.rheostat(20), 0.02, -0.82);
      const vm = K.add(K.EL.meter('V', 5, { lc: 0.1 }), 0.28, -0.48); const gp = K.add(K.EL.graphPaper({ xmax: mode === 'parallel' ? 1.5 : 1, ymax: 5 }), 0.42, -0.74);
      const R1 = K.add(K.EL.resistorBoard(mode === 'ohm' ? 5 : 4), 0.14, -0.62); let R2 = null; if (mode !== 'ohm') R2 = K.add(K.EL.resistorBoard(6), mode === 'series' ? 0.28 : 0.14, mode === 'series' ? -0.62 : -0.7);
      const red = 0xc62828, blk = 0x222222, yel = 0xd4a017;
      const L = [[[bat, '+'], [key, 'a'], red], [[key, 'b'], [am, '+'], red], [[am, '-'], [rh, 'a'], red], [[rh, 'c'], [R1, 'a'], red]];
      if (mode === 'ohm') L.push([[R1, 'b'], [bat, '-'], blk], [[vm, '+'], [R1, 'a'], yel], [[vm, '-'], [R1, 'b'], yel]);
      if (mode === 'series') L.push([[R1, 'b'], [R2, 'a'], red], [[R2, 'b'], [bat, '-'], blk], [[vm, '+'], [R1, 'a'], yel], [[vm, '-'], [R2, 'b'], yel]);
      if (mode === 'parallel') L.push([[R1, 'b'], [bat, '-'], blk], [[R2, 'a'], [R1, 'a'], red], [[R2, 'b'], [R1, 'b'], blk], [[vm, '+'], [R1, 'a'], yel], [[vm, '-'], [R1, 'b'], yel]);
      K.wires(L); rh.setK(1); rh.kShown = 1;
      return { bat, key, am, rh, vm, gp, R1, R2 };
    },
    steps: [
      { do: X({ ohm: 'The circuit is connected: cells, key, ammeter, rheostat and the resistance wire in series, and the voltmeter across the wire. Check the + and − terminals of the meters.', series: 'The circuit is connected: the 4 Ω and 6 Ω resistors are joined end to end (in series); the voltmeter is across both of them together.', parallel: 'The circuit is connected: the 4 Ω and 6 Ω resistors are joined between the same two points (in parallel); the voltmeter is across them.' }[mode]), target: 'am', act: (K) => K.sleep(1.4),
        see: X('The + terminal of each meter is joined towards the + terminal of the battery. The needles show zero: no current yet.') },
      { do: X('Insert the plug in the key to close the circuit.'), target: 'key', act: (K, o) => K.keyOn(o.key, true), ev: { type: 'key' }, see: X('The needles of the ammeter and the voltmeter move: a current flows.') },
      { do: X('Note the ammeter and voltmeter readings. Then move the rheostat slider in steps and note both readings each time (5 readings).'), target: 'rh',
        act: async (K, o) => { o.rows = []; for (const k of [1, 0.6, 0.4, 0.25, 0.1]) { await K.rheo(o.rh, k, 0.8); await K.sleep(1.2); const I = o.am.read(), Vv = o.vm.read(); o.rows.push([I, Vv]); o.gp.plot(I, Vv); await K.showTag(`I = ${I.toFixed(2)} A   V = ${Vv.toFixed(1)} V   V/I = ${(Vv / Math.max(0.01, I)).toFixed(1)} Ω`, o.am.g.position.clone().add(V(K, 0, 0.06, 0)), V(K, 0.06, 0.05, 0), 2); } }, ev: { type: 'rheostat' },
        see: X({ ohm: 'As the current increases, the potential difference increases in the same proportion: V/I stays about 5 Ω.', series: 'For every reading V/I is about 10 Ω.', parallel: 'For every reading V/I is about 2.4 Ω.' }[mode]) },
      { do: X('Plot V against I on the graph paper and draw the best straight line.'), target: 'gp', act: async (K, o) => { o.R = o.gp.fit(); await K.showTag(`R = V/I ≈ ${o.R.toFixed(1)} Ω`, o.gp.g.position.clone(), V(K, 0, 0.1, 0), 3); }, ev: { type: 'plot' },
        see: X({ ohm: 'The points lie on a straight line through the origin. Its slope (V/I) is the resistance, about 5 Ω.', series: 'A straight line through the origin with slope about 10 Ω = 4 Ω + 6 Ω.', parallel: 'A straight line through the origin with slope about 2.4 Ω, which is less than either resistor.' }[mode]),
        why: X({ ohm: "Ohm's law: at constant temperature the current through a conductor is proportional to the potential difference across it, V = IR.", series: 'In series the same current flows through both resistors and their voltages add: Rs = R₁ + R₂.', parallel: 'In parallel the voltage is the same across both and the currents add: 1/Rp = 1/R₁ + 1/R₂ = 1/4 + 1/6, so Rp = 2.4 Ω.' }[mode]) },
      { do: X('Take the plug out of the key when you have finished.'), target: 'key', act: (K, o) => K.keyOn(o.key, false), ev: { type: 'key' }, see: X('The needles return to zero.'), why: X('Do not leave the key closed for long: the wire heats up and its resistance changes.') },
    ],
    eq: { word: { ohm: "Ohm's law", series: 'Series combination', parallel: 'Parallel combination' }[mode], sym: { ohm: 'V = IR · R = V/I ≈ 5 Ω', series: 'Rs = R₁ + R₂ = 4 Ω + 6 Ω = 10 Ω', parallel: '1/Rp = 1/R₁ + 1/R₂ → Rp = (4 × 6)/(4 + 6) = 2.4 Ω' }[mode] },
    result: { obs: X({ ohm: 'Five pairs of readings gave V/I ≈ 5 Ω each time; the V–I graph is a straight line through the origin.', series: 'V/I for the series combination was about 10 Ω for all readings.', parallel: 'V/I for the parallel combination was about 2.4 Ω for all readings.' }[mode]),
      concl: X({ ohm: 'V is directly proportional to I (Ohm’s law). The resistance of the wire is about 5 Ω.', series: 'The equivalent resistance of resistors in series is the sum of their resistances: Rs = R₁ + R₂.', parallel: 'The equivalent resistance of resistors in parallel is less than the smallest resistance: 1/Rp = 1/R₁ + 1/R₂.' }[mode]),
      safety: X('Connect the ammeter in series and the voltmeter in parallel, + to +. Start with the rheostat at maximum resistance and close the key only while taking readings.'),
      viva: [{ q: X('How is an ammeter connected in a circuit?'), a: X('In series, so that the whole current passes through it.') }, { q: X('How is a voltmeter connected?'), a: X('In parallel (across) the component.') }, { q: X({ ohm: 'What does the slope of the V–I graph give?', series: 'What is the equivalent resistance of 4 Ω and 6 Ω in series?', parallel: 'What is the equivalent resistance of 4 Ω and 6 Ω in parallel?' }[mode]), a: X({ ohm: 'The resistance of the conductor.', series: '10 Ω.', parallel: '2.4 Ω.' }[mode]) }] },
  })),
];
void BENCH_Y;
