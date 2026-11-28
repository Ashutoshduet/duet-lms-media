// DUET Science Lab 360, biology at the bench, batch BIO1: the microscope. Make a slide yourself (an onion peel, cheek
// cells, a leaf peel, a drop of curd, yeast or pond water), stain it, put it under the microscope and focus it from 4×
// to 40× (and 100× under oil); plasmolysis in a Rhoeo leaf; permanent slides of tissues, Amoeba dividing, bread mould
// and Hydra budding. The microscope, the slides and the view are in microscope.js.
import * as THREE from 'three';
import { DICT } from './exp_i18n.js';
import { DICT_BIO1 } from './exp_i18n_bio1.js';
import * as MS from './microscope.js';
import { handle } from './mathworld.js';
import { Item } from './apparatus.js';
Object.assign(DICT, DICT_BIO1);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BY = 0.9;
const B8 = X('Ch 2 · The Invisible Living World: Beyond Our Naked Eye');
const B9C = X('Ch 2 · Cell: The Building Block of Life');
const B9T = X('Ch 3 · Tissues in Action');
const B10L = X('Ch 5 · Life Processes');
const B10R = X('Ch 7 · How do Organisms Reproduce?');
const STAINS = { safranin: [0xc23a5a, N('Safranin', 'सैफ्रानिन', 'Safranin')], mblue: [0x2f56c8, N('Methylene blue', 'मेथिलीन ब्लू', 'Methylene blue')], iodine: [0x9a5a12, N('Iodine solution', 'आयोडीन घोल', 'Iodine solution')], glycerine: [0xe8e6d8, N('Glycerine', 'ग्लिसरीन', 'Glycerine')], salt: [0xdfe9ee, N('Salt solution', 'नमक का घोल', 'Namak ka ghol')], water: [0xcfe6ee, N('Water', 'पानी', 'Paani')], oil: [0xf0dc9a, N('Cedarwood oil', 'सीडरवुड तेल', 'Cedarwood oil')] };
const LB = { safranin: 'Safranin', mblue: 'Methylene blue', iodine: 'Iodine', glycerine: 'Glycerine', salt: 'Salt water', water: 'Water', oil: 'Oil' };

// ------------------------------------------------------------------------------------------------ the bench
// the microscope on the right with its view beside it; the slide in the middle; tools and the specimen on the left
function bench(K, o = {}) {
  const sc = K.add(MS.microscope({ viewSize: 0.3 }), 0.1, -0.7);
  sc.view.mesh.position.set(0.33, 0.24, 0.05);
  sc.caption = () => { const O = MS.OBJ[sc.obj]; const L = K.app.lang; const w = { en: 'objective', hi: 'ऑब्जेक्टिव', hg: 'objective' }; return `${O.name} ${w[L] || w.en} · ${O.x * 10}×`; };
  const r = { sc };
  r.slide = K.add(MS.slide({ spec: o.permanent ? o.spec : null, stain: o.stain, label: o.label, covered: !!o.permanent, slideKind: o.slideKind, name: o.permanent ? N('Permanent slide', 'स्थायी स्लाइड', 'Permanent slide') : undefined }), -0.14, -0.5);
  if (!o.permanent) {
    r.wg = K.add(MS.watchGlass({ color: o.salt ? 0xe6eef0 : 0xbfe3ea }), -0.3, -0.64);
    r.cover = K.add(MS.tool('coverslip'), 0.0, -0.46);
    r.needle = K.add(MS.tool('needle'), -0.04, -0.4); r.needle.g.rotation.y = 0.4;
    r.blot = K.add(MS.tool('blotter'), -0.18, -0.74);
    r.forceps = K.add(MS.tool('forceps'), -0.24, -0.42); r.forceps.g.rotation.y = -0.5;
    if (o.stain && o.stain !== 'none') { const [c, nm] = STAINS[o.stain]; r.stain = K.add(MS.dropperBottle({ color: c, name: nm, label: LB[o.stain] }), -0.44, -0.52); }
    if (o.src) r.src = K.add(MS.source(o.src), -0.46, -0.72);
  }
  for (const k of Object.keys(r)) { const it = r[k]; if (it && it.g && !it.home) it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; }
  grips(K, sc, r);
  sc.camView = { p: V(0.06, 0.46, 0.66), t: V(0.12, 0.15, 0) };
  return r;
}
// the coarse and fine focus knobs: take hold of one and move your hand up or down to turn it
function grips(K, sc, r) {
  const mk = (kind) => {
    const it = new Item('grip_' + kind, { name: kind === 'coarse' ? N('Coarse focus knob', 'मोटा फ़ोकस नॉब', 'Coarse focus knob') : N('Fine focus knob', 'बारीक फ़ोकस नॉब', 'Fine focus knob') });
    const R = sc.knobR(kind) + 0.003;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0022, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.55, depthWrite: false })); ring.rotation.y = Math.PI / 2; it.g.add(ring); it.ring = ring;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(R + 0.006, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); it.g.add(hit);
    sc.g.updateMatrixWorld(true); const P0 = sc.g.localToWorld(sc.knobAt(kind).add(V(0.004, 0, 0)));
    K.add(it, P0.x, P0.z, { y: P0.y }); it.height = 0.02; it.radius = 0.03;
    const path = () => [P0.clone(), P0.clone().add(V(0.12, 0, 0))]; // pull the ring out to the right to raise the stage, push it back to lower it
    const kNow = () => (kind === 'coarse' ? sc.coarse : (sc.fine + 1) / 2);
    let last = 0;
    handle(it, { path, active: () => true, at: () => { const [A, B] = path(); return A.clone().lerp(B, kNow()); },
      move: (k) => { if (kind === 'coarse') sc.setFocus(k); else sc.setFocus(sc.coarse, k * 2 - 1); const n = performance.now(); if (n - last > 120) { last = n; K.lab.emit('knob', { obj: sc.id }); } } });
    it.g.position.copy(it.g.position.clone().setY(P0.y)); const [A, B] = path(); it.g.position.copy(A.clone().lerp(B, kNow()));
    return it;
  };
  r.coarse = mk('coarse'); r.fine = mk('fine');
}
const sharp = (o, obj) => o.sc.obj === obj && o.sc.sharpness() > 0.85 && o.sc.slide && o.sc.slide.onStage;
// turn the focus slowly to the sharp place (as a student would: past it a little, then back)
async function focusTo(K, o, fine) {
  const sc = o.sc, goal = sc.sharpAt(); const c0 = sc.coarse, f0 = sc.fine;
  if (!fine) { const over = goal + 0.06; await K.tween(1.6, (k) => sc.setFocus(c0 + (over - c0) * k, 0)); await K.tween(0.9, (k) => sc.setFocus(over + (goal - over) * k, 0)); }
  else { const want = (goal - sc.coarse) / 0.04; await K.tween(1.1, (k) => sc.setFocus(sc.coarse, f0 + (Math.max(-1, Math.min(1, want)) - f0) * k)); if (Math.abs(sc.focus - goal) > 0.002) sc.setFocus(goal, 0); }
  K.lab.emit('knob', { obj: sc.id });
}
async function objective(K, o, i) { const sc = o.sc; const a0 = sc.obj; const n = MS.OBJ.length; const steps = (i - a0 + n) % n; for (let s = 1; s <= steps; s++) { sc.setObj(a0 + s); await K.sleep(0.25); } K.lab.emit('objective', { obj: sc.id, v: i }); }
// carry a tool to a point and back home
async function visit(K, it, P, hold = 0.4, q) { await K.moveTo(it, P, q || null, 0.7); await K.sleep(hold); await K.home(it, 0.6); }
const above = (it, dy = 0.03) => it.g.position.clone().add(V(0, dy, 0));
// the steps every hand-made slide has, put together as needed
const S = {
  peel: (what, see, why) => ({ do: what, target: 'src', act: async (K, o) => { await visit(K, o.forceps, above(o.src, 0.045), 0.5); o.film = o.film || filmOn(K, o.wg); o.film.visible = true; await visit(K, o.forceps, above(o.wg, 0.02), 0.3); K.lab.emit('peel', { obj: o.src.id }); }, ev: { type: 'peel' }, see, why }),
  scrape: (what, see, why) => ({ do: what, target: 'src', act: async (K, o) => { const tp = o.tp; await visit(K, tp, above(o.src, 0.05), 0.6); await visit(K, tp, above(o.slide, 0.01), 0.6); o.slide.setSpec(o.spec, 'none'); K.lab.emit('smear', { obj: o.slide.id }); }, ev: { type: 'smear' }, see, why }),
  drop: (what, see, why) => ({ do: what, target: 'src', act: async (K, o) => { await visit(K, o.dropper || o.forceps, above(o.src, 0.06), 0.4); await K.moveTo(o.dropper || o.forceps, above(o.slide, 0.05), null, 0.7); await new Promise((r) => MS.dropFx(K.app.scene, above(o.slide, 0.045), above(o.slide, 0.002), 0x9ab27a, r)); o.slide.setSpec(o.spec, 'none'); await K.home(o.dropper || o.forceps, 0.6); K.lab.emit('smear', { obj: o.slide.id }); }, ev: { type: 'smear' }, see, why }),
  onSlide: (what, see) => ({ do: what, target: 'slide', act: async (K, o) => { if (o.film) { await visit(K, o.forceps, above(o.slide, 0.01), 0.3); o.film.visible = false; } o.slide.setSpec(o.spec, 'none'); K.lab.emit('on_slide', { obj: o.slide.id }); }, ev: { type: 'on_slide' }, see }),
  stain: (what, stain, see, why) => ({ do: what, target: 'stain', act: async (K, o) => { await K.moveTo(o.stain, above(o.slide, 0.06), null, 0.7); for (let i = 0; i < 2; i++) { await new Promise((r) => MS.dropFx(K.app.scene, above(o.slide, 0.055), above(o.slide, 0.002), o.stain.color, r)); await K.sleep(0.25); } o.slide.setSpec(o.spec, stain, o.specSt || {}); await K.home(o.stain, 0.6); K.lab.emit('stain', { obj: o.slide.id }); }, ev: { type: 'stain' }, see, why }),
  cover: (what, see, why) => ({ do: what, target: 'cover', act: async (K, o) => { const P = above(o.slide, 0.012); await K.moveTo(o.cover, P, null, 0.7); await K.moveTo(o.needle, above(o.slide, 0.02), null, 0.5); await K.moveTo(o.cover, above(o.slide, 0.0016), null, 0.6); o.cover.g.visible = false; o.slide.cover.visible = true; await K.home(o.needle, 0.5); await visit(K, o.blot, o.slide.g.position.clone().add(V(0.02, 0.002, 0)), 0.4); K.lab.emit('cover', { obj: o.slide.id }); }, ev: { type: 'cover' }, see, why }),
  stage: (what, see) => ({ do: what, target: 'slide', act: async (K, o) => { await putOnStage(K, o); }, ev: { type: 'on_stage' }, see }),
  focus: (obj, what, see, why, fine) => ({ do: what, target: 'sc', act: async (K, o) => { if (o.sc.obj !== obj) await objective(K, o, obj); await focusTo(K, o, fine); }, ev: { type: 'knob' }, until: (K, o) => sharp(o, obj), see, why }),
  oil: (what, see, why) => ({ do: what, target: 'sc', act: async (K, o) => { const oil = o.oilB; if (oil) { await K.moveTo(oil, o.sc.stagePoint().add(V(0, 0.06, 0)), null, 0.7); await new Promise((r) => MS.dropFx(K.app.scene, o.sc.stagePoint().add(V(0, 0.055, 0)), o.sc.stagePoint().add(V(0, 0.003, 0)), 0xf0dc9a, r)); await K.home(oil, 0.6); } await objective(K, o, 3); await focusTo(K, o, true); }, ev: { type: 'knob' }, until: (K, o) => sharp(o, 3), see, why }),
};
// a thin film (the peel) floating in the watch glass
function filmOn(K, wg) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf3e6ef, transparent: true, opacity: 0.6, roughness: 0.3 })); m.position.y = 0.0075; wg.g.add(m); return m; }
async function putOnStage(K, o) {
  const sc = o.sc, sl = o.slide; await K.moveTo(sl, sc.stagePoint().add(V(0, 0.0005, 0)), null, 0.9);
  sl.onStage = true; sc.slide = sl; sc.look(true); K.lab.emit('on_stage', { obj: sl.id });
}
// a slide let go near the stage lands on it (by hand, in the headset)
function stageByHand(K, o) {
  const sl = o.slide, sc = o.sc; const r0 = sl.onRelease;
  sl.noGrab = false; sl.onRelease = () => { r0 && r0(); const P = sc.stagePoint(); if (sl.g.position.distanceTo(P) < 0.09 && !sl.onStage && sl.patch.visible) { sl.g.position.copy(P); sl.g.quaternion.identity(); sl.onStage = true; sc.slide = sl; sc.look(true); K.lab.emit('on_stage', { obj: sl.id }); } };
}
function common(K, o) { stageByHand(K, o); return o; }

export const EXPERIMENTS_BIO1 = [
  // ------------------------------------------------------------------ Class 8: cells and microorganisms
  {
    id: 'bio8_onion_peel', subj: 'biology', cls: 8, also: [9], ch: B8, topic: 'cells',
    title: X('Onion peel cells under the microscope'),
    aim: X('To make a slide of an onion peel yourself, stain it and see its cells, their cell walls and nuclei under the microscope.'),
    kind: X('Plant cells'),
    setup(K) { const o = bench(K, { src: 'onion', stain: 'safranin' }); o.spec = 'onion'; return common(K, o); },
    steps: [
      S.peel(X('Break a scale of the onion. With the forceps, peel off the thin, clear skin from its inner side and put it in the watch glass of water.'), X('A thin, almost transparent skin comes off. It is only one cell thick.'), X('It is kept in water so that it does not dry and curl up.')),
      S.onSlide(X('Lift the peel with the forceps and spread it flat in the middle of a clean slide.'), X('The peel lies flat on the slide.')),
      S.stain(X('Put two drops of safranin on the peel. Wait a minute.'), 'safranin', X('The peel turns pink.'), X('A stain makes the parts of a cell easy to see; safranin colours the cell walls and the nuclei more than the rest.')),
      S.cover(X('Lower a cover slip on it slowly, holding it up with the needle, so that no air bubbles are trapped. Soak up the extra stain at the edge with blotting paper.'), X('The peel is now flat under the cover slip, without bubbles.'), X('Air bubbles look like black rings and hide the cells.')),
      S.stage(X('Put the slide on the stage under the clips, with the peel over the hole. The lamp lights it from below.'), X('The view of the eyepiece is beside the microscope; it is blurred.')),
      S.focus(0, X('With the 4× objective, turn the coarse focus knob slowly until the picture is sharp.'), X('Many small brick-like boxes lie side by side in rows: these are cells.'), X('Always start with the lowest power: it shows the widest area and is easiest to focus.')),
      S.focus(1, X('Turn the nosepiece to the 10× objective, then sharpen the picture with the fine focus knob.'), X('Each cell is now bigger: a thick wall all round it and a dark dot inside, the nucleus.'), X('The fine knob moves the stage very little, so the picture can be made exactly sharp.'), true),
      S.focus(2, X('Now turn to the 40× objective and sharpen with the fine knob only.'), X('At 400 times, one cell fills a good part of the view: the cell wall, the pale cytoplasm and a round nucleus with a small dark spot in it, the nucleolus.'), X('Onion cells, like all plant cells, have a rigid cell wall outside the cell membrane.'), true),
    ],
    eq: { word: 'Onion peel → safranin → cover slip → 4× → 10× → 40×', sym: 'cell wall + cell membrane + cytoplasm + nucleus' },
    result: { obs: X('The onion peel was made of many brick-shaped cells in rows, each with a thick cell wall, cytoplasm and a nucleus.'),
      concl: X('Living things are made of cells. Plant cells such as onion cells have a cell wall, cytoplasm and a nucleus.'),
      safety: X('Handle the slide and cover slip by their edges: they are thin glass. Never turn the coarse knob down while looking at 40×: the objective can crack the slide.'),
      viva: [{ q: X('Why is a stain used?'), a: X('To make the cell wall and nucleus easy to see.') }, { q: X('Why is the cover slip lowered at an angle?'), a: X('So that no air bubbles are trapped under it.') }, { q: X('Which part of the onion cell is not found in animal cells?'), a: X('The cell wall.') }] },
  },
  {
    id: 'bio8_cheek_cells', subj: 'biology', cls: 8, also: [9], ch: B8, topic: 'cells',
    title: X('Cells from the inside of your cheek'),
    aim: X('To scrape a few cells from the inside of the cheek, stain them with methylene blue and compare them with plant cells.'),
    kind: X('Animal cells'),
    setup(K) { const o = bench(K, { src: null, stain: 'mblue' }); o.spec = 'cheek'; o.tp = K.add(MS.tool('toothpick'), -0.42, -0.66); o.tp.home = { p: o.tp.g.position.clone(), q: o.tp.g.quaternion.clone() }; o.src = o.tp; return common(K, o); },
    steps: [
      { do: X('Rinse your mouth. Gently scrape the inside of your cheek with the blunt end of a clean toothpick and spread what comes off in a drop of water on the slide.'), target: 'tp',
        act: async (K, o) => { const cam = K.app.camera.position.clone(); await K.moveTo(o.tp, cam.clone().lerp(o.tp.g.position, 0.55), null, 0.8); await K.sleep(0.4); await K.moveTo(o.tp, above(o.slide, 0.01), null, 0.8); o.slide.setSpec('cheek', 'none'); await K.home(o.tp, 0.6); K.lab.emit('smear', { obj: o.slide.id }); },
        ev: { type: 'smear' }, see: X('A little white, sticky material is spread on the slide.'), why: X('The inner lining of the cheek keeps shedding cells; scraping gently collects some of them. It does not hurt.') },
      S.stain(X('Add a drop of methylene blue and wait a minute.'), 'mblue', X('The smear turns light blue.'), X('Methylene blue colours the nucleus dark blue and the cytoplasm light blue.')),
      S.cover(X('Lower a cover slip without trapping bubbles and soak up the extra stain with blotting paper.'), X('The smear is flat under the cover slip.')),
      S.stage(X('Put the slide on the stage, the smear over the hole.'), X('The view is blurred.')),
      S.focus(0, X('With the 4× objective, focus with the coarse knob.'), X('Small blue specks are scattered about.')),
      S.focus(1, X('Turn to 10× and sharpen with the fine knob.'), X('Flat, irregular cells lie singly or in small groups, some folded.'), null, true),
      S.focus(2, X('Turn to 40× and sharpen with the fine knob.'), X('Each cell is a thin flat sheet with a dark blue nucleus near its middle. There is no thick wall around it, and the cells are not in rows.'), X('Animal cells have only a thin cell membrane outside; they have no cell wall. That is why they are irregular in shape.'), true),
    ],
    eq: { word: 'Cheek cells → methylene blue → 4× → 10× → 40×', sym: 'cell membrane + cytoplasm + nucleus (no cell wall)' },
    result: { obs: X('The cheek cells were flat and irregular, each with a dark blue nucleus, and they had no cell wall.'),
      concl: X('Animal cells have a cell membrane, cytoplasm and a nucleus but no cell wall, so their shape is not fixed like plant cells.'),
      safety: X('Use only the blunt end of a new toothpick and scrape gently; throw it away after use.'),
      viva: [{ q: X('Which stain is used for cheek cells?'), a: X('Methylene blue.') }, { q: X('Name one difference between cheek cells and onion cells.'), a: X('Cheek cells have no cell wall; onion cells have one.') }, { q: X('What colour does the nucleus take?'), a: X('Dark blue.') }] },
  },
  {
    id: 'bio8_yeast', subj: 'biology', cls: 8, also: [10], ch: B8, topic: 'micro',
    title: X('Yeast: a living fungus too small to see'),
    aim: X('To see yeast cells, a microorganism used to make bread rise, and the buds growing on them.'),
    kind: X('Microorganisms: fungi'),
    setup(K) { const o = bench(K, { src: 'yeast', stain: 'none' }); o.spec = 'yeast'; o.dropper = K.add(MS.dropperBottle({ color: 0xe9dcb8, name: N('Dropper', 'ड्रॉपर', 'Dropper') }), -0.3, -0.52); o.dropper.home = { p: o.dropper.g.position.clone(), q: o.dropper.g.quaternion.clone() };
      o.oilB = K.add(MS.dropperBottle({ color: 0xf0dc9a, name: STAINS.oil[1], label: 'Oil' }), -0.44, -0.52); o.oilB.home = { p: o.oilB.g.position.clone(), q: o.oilB.g.quaternion.clone() }; return common(K, o); },
    steps: [
      { do: X('Look at the jar: some dry yeast was put in warm sugar water an hour ago.'), target: 'src', act: async (K) => { await K.sleep(1.2); K.lab.emit('look', {}); }, ev: { type: 'look' }, see: X('The water is cloudy and frothy, and small bubbles keep rising.'), why: X('The yeast is alive: it feeds on the sugar and gives out carbon dioxide gas.') },
      S.drop(X('With the dropper, put one drop of it on a slide.'), X('A cloudy drop sits on the slide.')),
      S.cover(X('Lower a cover slip on it.'), X('The drop spreads into a thin layer.')),
      S.stage(X('Put the slide on the stage.'), X('The view is blurred.')),
      S.focus(1, X('Focus at 10×: first the coarse knob.'), X('Only tiny dots are seen; they are far smaller than cheek cells.')),
      S.focus(2, X('Turn to 40× and sharpen with the fine knob.'), X('Small oval cells; many have a smaller round cell stuck to one end.'), X('These small cells are buds. Yeast reproduces by budding: a bud grows out of the parent cell and later breaks off.'), true),
      S.oil(X('For the closest look, put a drop of cedarwood oil on the cover slip and turn to the 100× oil objective; sharpen with the fine knob.'), X('Each yeast cell is clearly oval with its bud; some buds have buds of their own, making short chains.'), X('Oil between the lens and the slide lets more light into the 100× lens, so the picture stays bright and sharp.')),
    ],
    eq: { word: 'Yeast + sugar → more yeast cells (budding) + carbon dioxide + alcohol', sym: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂' },
    result: { obs: X('Yeast cells were tiny ovals, many with buds and some in short chains.'), concl: X('Yeast is a single-celled fungus. It is a microorganism and reproduces by budding.'),
      safety: X('Wipe the oil off the 100× lens with lens paper after use.'),
      viva: [{ q: X('How does yeast reproduce?'), a: X('By budding.') }, { q: X('Which gas makes bread dough rise?'), a: X('Carbon dioxide, given out by yeast.') }, { q: X('Why is oil used with the 100× objective?'), a: X('It lets more light enter the lens, so the image is bright and sharp.') }] },
  },
  {
    id: 'bio8_curd_bacteria', subj: 'biology', cls: 8, ch: B8, topic: 'micro',
    title: X('Bacteria in curd'),
    aim: X('To see the bacteria that turn milk into curd, by staining a thin smear of curd water.'),
    kind: X('Microorganisms: bacteria'),
    setup(K) { const o = bench(K, { src: 'curd', stain: 'mblue' }); o.spec = 'curd'; o.tp = K.add(MS.tool('toothpick'), -0.3, -0.42); o.tp.home = { p: o.tp.g.position.clone(), q: o.tp.g.quaternion.clone() };
      o.oilB = K.add(MS.dropperBottle({ color: 0xf0dc9a, name: STAINS.oil[1], label: 'Oil' }), -0.36, -0.54); o.oilB.home = { p: o.oilB.g.position.clone(), q: o.oilB.g.quaternion.clone() }; return common(K, o); },
    steps: [
      S.scrape(X('Take a tiny bit of the watery part of curd on the toothpick and spread it thinly on the slide. Let it dry.'), X('A thin, dull film is left on the slide.')),
      S.stain(X('Add a drop of methylene blue, wait a minute, then rinse it gently with water.'), 'mblue', X('The film is faintly blue.'), X('Bacteria are almost transparent; the stain makes them visible.')),
      S.cover(X('Put on a cover slip.'), X('The smear is ready.')),
      S.stage(X('Put the slide on the stage.'), X('The view is blurred.')),
      S.focus(2, X('Focus at 40×.'), X('Only very fine blue specks; they are too small to make out.')),
      S.oil(X('Put a drop of cedarwood oil on the slide and turn to the 100× oil objective. Sharpen with the fine knob.'), X('Tiny blue rods, alone, in pairs and in short chains.'), X('These are Lactobacillus bacteria. They turn the sugar of milk into lactic acid, which sets the milk into curd.')),
    ],
    eq: { word: 'Milk sugar (lactose) → lactic acid (by Lactobacillus) → milk sets into curd', sym: 'C₁₂H₂₂O₁₁ + H₂O → 4 CH₃CH(OH)COOH' },
    result: { obs: X('The curd smear showed many tiny rod-shaped bacteria, single or in chains.'), concl: X('Curd contains useful bacteria (Lactobacillus) that change milk into curd. Bacteria are much smaller than yeast or our own cells.'),
      safety: X('Do not eat anything at the lab bench. Wipe the oil off the lens.'),
      viva: [{ q: X('Name the bacterium in curd.'), a: X('Lactobacillus.') }, { q: X('What does it make from milk sugar?'), a: X('Lactic acid.') }, { q: X('Which objective is needed to see bacteria?'), a: X('The 100× oil immersion objective.') }] },
  },
  {
    id: 'bio8_paramecium', subj: 'biology', cls: 8, ch: B8, topic: 'micro',
    title: X('Living things in a drop of pond water'),
    aim: X('To see Paramecium, a single-celled animal, swimming in a drop of pond water.'),
    kind: X('Microorganisms: protozoa'),
    setup(K) { const o = bench(K, { src: 'pond', stain: 'none' }); o.spec = 'paramecium'; o.dropper = K.add(MS.dropperBottle({ color: 0x8aa86a, name: N('Dropper', 'ड्रॉपर', 'Dropper') }), -0.3, -0.52); o.dropper.home = { p: o.dropper.g.position.clone(), q: o.dropper.g.quaternion.clone() }; return common(K, o); },
    steps: [
      S.drop(X('Take a drop of water from near the plants at the bottom of the jar and put it on a slide, with a few threads of cotton.'), X('A greenish drop with cotton threads in it.'), X('The cotton threads slow the fast swimmers down so that they stay in view.')),
      S.cover(X('Lower a cover slip on it.'), X('The drop spreads out.')),
      S.stage(X('Put the slide on the stage.'), X('The view is blurred.')),
      S.focus(0, X('Focus at 4× with the coarse knob.'), X('Tiny moving specks dart about.')),
      S.focus(1, X('Turn to 10× and sharpen with the fine knob. Watch for a while.'), X('Slipper-shaped cells swim fast, turn and come back; their edges shimmer.'), X('This is Paramecium. Its body is covered with tiny hair-like cilia that beat together and row it through the water.'), true),
    ],
    eq: { word: 'Pond water drop → Paramecium (one cell, moves with cilia)', sym: '—' },
    result: { obs: X('Slipper-shaped Paramecium swam about quickly, turning and reversing; a fringe of cilia shimmered around each.'), concl: X('A single cell can be a whole living animal: Paramecium moves, feeds and reproduces on its own.'),
      safety: X('Wash your hands after handling pond water.'), viva: [{ q: X('How does Paramecium move?'), a: X('By beating its cilia.') }, { q: X('Why are cotton threads added?'), a: X('To slow it down so it stays in view.') }, { q: X('What is the shape of Paramecium?'), a: X('Like a slipper.') }] },
  },
  // ------------------------------------------------------------------ Class 9: cells and tissues
  {
    id: 'bio9_plasmolysis', subj: 'biology', cls: 9, ch: B9C, topic: 'cells',
    title: X('Plasmolysis: a cell loses water in salt solution'),
    aim: X('To watch the coloured contents of Rhoeo leaf cells shrink in salt solution and swell back in water.'),
    kind: X('Osmosis in living cells'),
    setup(K) { const o = bench(K, { src: 'rhoeo', stain: 'none' }); o.spec = 'rhoeo'; o.saltB = K.add(MS.dropperBottle({ color: 0xdfe9ee, name: STAINS.salt[1], label: 'Salt water' }), -0.44, -0.52); o.saltB.home = { p: o.saltB.g.position.clone(), q: o.saltB.g.quaternion.clone() };
      o.water = K.add(MS.dropperBottle({ color: 0xcfe6ee, name: STAINS.water[1], label: 'Water' }), -0.38, -0.46); o.water.home = { p: o.water.g.position.clone(), q: o.water.g.quaternion.clone() }; return common(K, o); },
    steps: [
      S.peel(X('Peel the purple lower skin of a Rhoeo leaf with forceps and put it in the watch glass of water.'), X('A thin purple peel.')),
      S.onSlide(X('Spread the peel on a slide in a drop of water.'), X('The peel lies flat.')),
      S.cover(X('Put on a cover slip.'), X('The peel is ready.')),
      S.stage(X('Put the slide on the stage.'), X('The view is blurred.')),
      S.focus(2, X('Focus at 40×: coarse knob first, then the fine knob.'), X('The cells are full of purple sap, right up to their walls.'), X('In water each cell is full and firm: water has entered it by osmosis.')),
      { do: X('Put two drops of salt solution at one edge of the cover slip and draw it under with blotting paper at the other edge. Watch.'), target: 'sc',
        act: async (K, o) => { await K.moveTo(o.saltB, o.sc.stagePoint().add(V(0.012, 0.06, 0)), null, 0.7); await new Promise((r) => MS.dropFx(K.app.scene, o.sc.stagePoint().add(V(0.012, 0.055, 0)), o.sc.stagePoint().add(V(0.012, 0.003, 0)), 0xdfe9ee, r)); await K.home(o.saltB, 0.6); await K.tween(6, (k) => { o.slide.salt = k; }); K.lab.emit('salt', {}); },
        ev: { type: 'salt' }, see: X('The purple contents shrink away from the cell walls into a rounded lump; a clear space opens between them.'), why: X('The salt solution outside is more concentrated, so water leaves the cell by osmosis and the living contents shrink. This is plasmolysis. The cell wall stays as it was.') },
      { do: X('Now draw plain water under the cover slip in the same way. Watch.'), target: 'sc',
        act: async (K, o) => { await K.moveTo(o.water, o.sc.stagePoint().add(V(0.012, 0.06, 0)), null, 0.7); await new Promise((r) => MS.dropFx(K.app.scene, o.sc.stagePoint().add(V(0.012, 0.055, 0)), o.sc.stagePoint().add(V(0.012, 0.003, 0)), 0xcfe6ee, r)); await K.home(o.water, 0.6); await K.tween(6, (k) => { o.slide.salt = 1 - k; }); K.lab.emit('water', {}); },
        ev: { type: 'water' }, see: X('The contents swell again until they press against the walls.'), why: X('Water enters the cell again by osmosis. The cell was alive all the time: a dead cell would not take water back.') },
    ],
    eq: { word: 'Cell in salt solution → loses water → plasmolysis; back in water → takes in water', sym: 'water moves from less concentrated to more concentrated solution across the membrane' },
    result: { obs: X('In salt solution the purple contents of each cell shrank away from the wall; in water they swelled back.'), concl: X('The cell membrane lets water pass in and out by osmosis. A living plant cell loses water in a stronger solution (plasmolysis) and gains it back in water.'),
      safety: X('Keep the stage dry; wipe off any spilt salt solution.'), viva: [{ q: X('What is plasmolysis?'), a: X('The shrinking of the cell contents away from the cell wall when the cell loses water.') }, { q: X('By which process does water leave the cell?'), a: X('Osmosis.') }, { q: X('Does the cell wall shrink too?'), a: X('No, only the living contents shrink.') }] },
  },
  {
    id: 'bio9_spirogyra', subj: 'biology', cls: 9, ch: B9C, topic: 'cells',
    title: X('Spirogyra: green threads with spiral chloroplasts'),
    aim: X('To see the cells of the alga Spirogyra and its ribbon-shaped chloroplasts.'),
    kind: X('Plastids: chloroplasts'),
    setup(K) { const o = bench(K, { src: 'pond', stain: 'none' }); o.spec = 'spirogyra'; return common(K, o); },
    steps: [
      S.peel(X('Pick a few slimy green threads from the pond water with the forceps and put them in the watch glass.'), X('Fine, bright green, slippery threads.')),
      S.onSlide(X('Spread a few threads in a drop of water on the slide.'), X('The threads lie apart from one another.')),
      S.cover(X('Put on a cover slip.'), X('Ready.')),
      S.stage(X('Put the slide on the stage.'), X('Blurred.')),
      S.focus(1, X('Focus at 10×.'), X('Long green threads made of cells joined end to end, like a chain of boxes.')),
      S.focus(2, X('Turn to 40× and sharpen with the fine knob.'), X('Inside each cell a green ribbon winds round and round like a spring.'), X('The ribbon is a chloroplast, the plastid where the plant makes food from sunlight. Spirogyra is named for its spiral chloroplasts.'), true),
    ],
    eq: { word: 'Spirogyra cell: cell wall + cytoplasm + nucleus + spiral chloroplast', sym: 'chloroplast: photosynthesis' },
    result: { obs: X('Spirogyra threads were chains of cells, each with a spiral green chloroplast.'), concl: X('Plant cells have plastids; chloroplasts contain the green pigment chlorophyll and make food.'),
      safety: X('Wash hands after handling pond algae.'), viva: [{ q: X('What is the shape of the chloroplast in Spirogyra?'), a: X('A spiral ribbon.') }, { q: X('Which pigment makes it green?'), a: X('Chlorophyll.') }, { q: X('What does a chloroplast do?'), a: X('It makes food by photosynthesis.') }] },
  },
  {
    id: 'bio9_tissues', subj: 'biology', cls: 9, ch: B9T, topic: 'tissue',
    title: X('Permanent slides of plant and animal tissues'),
    aim: X('To look at ready-made slides of five tissues and see how the shape of their cells suits their work.'),
    kind: X('Plant and animal tissues'),
    setup(K) {
      const o = bench(K, { permanent: true, spec: 'tissue', slideKind: 'parenchyma', label: 'Parenchyma' });
      o.slides = ['xylem', 'muscle', 'neuron', 'blood'].map((k, i) => { const s = K.add(MS.slide({ spec: 'tissue', slideKind: k, covered: true, label: { xylem: 'Xylem', muscle: 'Muscle', neuron: 'Neuron', blood: 'Blood' }[k], name: N('Permanent slide', 'स्थायी स्लाइड', 'Permanent slide') }), -0.42 + i * 0.09, -0.5 - (i % 2) * 0.06); s.home = { p: s.g.position.clone(), q: s.g.quaternion.clone() }; return s; });
      o.oilB = K.add(MS.dropperBottle({ color: 0xf0dc9a, name: STAINS.oil[1], label: 'Oil' }), -0.3, -0.72); o.oilB.home = { p: o.oilB.g.position.clone(), q: o.oilB.g.quaternion.clone() };
      o.swap = async (K2, k) => { const sc = o.sc; const old = o.slide; await K2.home(old, 0.6); old.onStage = false; const nx = o.slides[k]; o.slide = nx; o.slides[k] = old; await putOnStage(K2, o); };
      return common(K, o);
    },
    steps: [
      S.stage(X('Put the slide of parenchyma (from a plant stem) on the stage.'), X('Blurred.')),
      S.focus(2, X('Focus at 40×: coarse knob, then fine knob.'), X('Round, thin-walled cells, loosely packed with small spaces between them.'), X('Parenchyma is simple living tissue that stores food; the spaces let air move between the cells.')),
      { do: X('Change to the slide of xylem and focus it.'), target: 'sc', act: async (K, o) => { await o.swap(K, 0); await focusTo(K, o, true); K.lab.emit('swap', {}); }, ev: { type: 'swap' }, see: X('Long tubes side by side, their walls thickened with rings and spirals.'), why: X('Xylem vessels are dead tubes joined end to end; the thick rings keep them open as they carry water up the plant.') },
      { do: X('Change to the slide of striated muscle and focus it.'), target: 'sc', act: async (K, o) => { await o.swap(K, 1); await focusTo(K, o, true); K.lab.emit('swap', {}); }, ev: { type: 'swap' }, see: X('Long fibres with fine light and dark cross-bands, and several nuclei along each fibre.'), why: X('These muscles move our arms and legs. The bands are the parts that slide past each other when the muscle contracts.') },
      { do: X('Change to the slide of a nerve cell (neuron) and focus it.'), target: 'sc', act: async (K, o) => { await o.swap(K, 2); await objective(K, o, 1); await focusTo(K, o, true); K.lab.emit('swap', {}); }, ev: { type: 'swap' }, see: X('A cell body with a nucleus, many short branches and one very long fibre.'), why: X('The short branches (dendrites) receive messages; the long axon carries them far, even a metre in our body.') },
      { do: X('Change to the slide of blood. Put a drop of oil and use the 100× objective.'), target: 'sc', act: async (K, o) => { await o.swap(K, 3); await K.moveTo(o.oilB, o.sc.stagePoint().add(V(0, 0.06, 0)), null, 0.6); await K.home(o.oilB, 0.5); await objective(K, o, 3); await focusTo(K, o, true); K.lab.emit('swap', {}); }, ev: { type: 'swap' }, see: X('Countless pink discs, paler in the middle, and here and there a bigger cell with a purple, lobed nucleus.'), why: X('The pink discs are red blood cells that carry oxygen; they have no nucleus. The bigger ones are white blood cells that fight germs.') },
    ],
    eq: { word: 'parenchyma (store) · xylem (carry water) · striated muscle (move) · neuron (carry messages) · blood (carry, defend)', sym: '—' },
    result: { obs: X('Parenchyma cells were round and loosely packed; xylem vessels were long tubes with rings; muscle fibres were banded with many nuclei; the neuron had branches and a long axon; blood had red discs and a few white cells.'),
      concl: X('A tissue is a group of similar cells doing one job, and the shape of the cells suits that job.'), safety: X('Hold permanent slides by the edges; wipe the oil off the 100× lens.'),
      viva: [{ q: X('Which tissue carries water in plants?'), a: X('Xylem.') }, { q: X('Why does a neuron have a long axon?'), a: X('To carry messages over long distances.') }, { q: X('Do red blood cells have a nucleus?'), a: X('No, mature red blood cells of humans have no nucleus.') }] },
  },
  {
    id: 'bio9_potato_starch', subj: 'biology', cls: 9, ch: B9T, topic: 'tissue',
    title: X('Starch grains stored in potato cells'),
    aim: X('To see the grains of starch that potato cells store, and test them with iodine.'),
    kind: X('Storage tissue'),
    setup(K) { const o = bench(K, { src: 'potato', stain: 'iodine' }); o.spec = 'potato'; o.tp = K.add(MS.tool('needle'), -0.3, -0.42); o.tp.home = { p: o.tp.g.position.clone(), q: o.tp.g.quaternion.clone() }; return common(K, o); },
    steps: [
      S.scrape(X('Scrape a little of the cut surface of the potato with the needle and spread it in a drop of water on the slide.'), X('A milky smear.')),
      S.cover(X('Put on a cover slip.'), X('Ready.')),
      S.stage(X('Put the slide on the stage.'), X('Blurred.')),
      S.focus(2, X('Focus at 40×.'), X('Clear, shining oval grains with faint rings, packed in large cells.'), X('These are starch grains: the potato stores food as starch in its cells.')),
      { do: X('Draw a drop of iodine solution under the cover slip and watch.'), target: 'stain', act: async (K, o) => { await K.moveTo(o.stain, o.sc.stagePoint().add(V(0.012, 0.06, 0)), null, 0.7); await new Promise((r) => MS.dropFx(K.app.scene, o.sc.stagePoint().add(V(0.012, 0.055, 0)), o.sc.stagePoint().add(V(0.012, 0.003, 0)), o.stain.color, r)); await K.home(o.stain, 0.6); o.slide.setSpec('potato', 'iodine'); K.lab.emit('stain', {}); }, ev: { type: 'stain' },
        see: X('The grains turn blue-black.'), why: X('Iodine turns starch blue-black: this is the test for starch.') },
    ],
    eq: { word: 'starch + iodine → blue-black colour', sym: '—' },
    result: { obs: X('Potato cells were packed with oval starch grains that turned blue-black with iodine.'), concl: X('Parenchyma cells of the potato store food as starch.'), safety: X('Iodine stains skin and clothes.'),
      viva: [{ q: X('Which test shows starch?'), a: X('It turns blue-black with iodine.') }, { q: X('In which tissue is starch stored in the potato?'), a: X('Parenchyma.') }, { q: X('What shape are the starch grains?'), a: X('Oval, with rings around a point.') }] },
  },
  // ------------------------------------------------------------------ Class 10: life processes and reproduction
  {
    id: 'bio10_stomata', subj: 'biology', cls: 10, ch: B10L, topic: 'cells',
    title: X('Stomata in a leaf peel'),
    aim: X('To make a slide of the lower skin of a leaf and see its stomata and guard cells.'),
    kind: X('Stomata and gaseous exchange'),
    setup(K) { const o = bench(K, { src: 'leaf', stain: 'safranin' }); o.spec = 'stomata'; o.specSt = { open: 0.85 }; return common(K, o); },
    steps: [
      S.peel(X('Fold a fresh leaf and tear it so that a thin, colourless skin is pulled from its lower side. Put the peel in the watch glass of water.'), X('A thin transparent strip of the leaf\'s lower skin (epidermis).'), X('The lower side of most leaves has more stomata than the upper side.')),
      S.onSlide(X('Spread the peel on a slide.'), X('Flat on the slide.')),
      S.stain(X('Add two drops of safranin.'), 'safranin', X('The peel turns pink.')),
      S.cover(X('Lower the cover slip with the needle, and blot the extra stain.'), X('Ready.')),
      S.stage(X('Put the slide on the stage.'), X('Blurred.')),
      S.focus(1, X('Focus at 10×.'), X('Wavy cells fitting together like a jigsaw, with small pairs of bean-shaped cells here and there.')),
      S.focus(2, X('Turn to 40× and sharpen with the fine knob.'), X('Each pair of bean-shaped guard cells has green chloroplasts and a small pore between them: a stoma.'), X('Gases go in and out of the leaf through stomata, and water vapour leaves through them. The guard cells open and close the pore.'), true),
    ],
    eq: { word: 'stoma = pore between two guard cells: CO₂ in, O₂ and water vapour out', sym: '—' },
    result: { obs: X('The leaf peel had wavy epidermal cells and many stomata, each a pore between two bean-shaped guard cells with chloroplasts.'), concl: X('Stomata on leaves let gases in and out for photosynthesis and respiration and let water evaporate (transpiration).'),
      safety: X('Handle the slide by its edges.'), viva: [{ q: X('What are stomata?'), a: X('Tiny pores in the skin of a leaf, each between two guard cells.') }, { q: X('What do guard cells do?'), a: X('They open and close the stoma.') }, { q: X('Why do guard cells look green?'), a: X('They have chloroplasts.') }] },
  },
  {
    id: 'bio10_amoeba_fission', subj: 'biology', cls: 10, also: [9], ch: B10R, topic: 'repro',
    title: X('Amoeba divides in two: binary fission'),
    aim: X('To watch an Amoeba moving with its false feet and then dividing into two daughter cells.'),
    kind: X('Asexual reproduction: binary fission'),
    setup(K) { const o = bench(K, { permanent: true, spec: 'amoeba', label: 'Amoeba' }); return common(K, o); },
    steps: [
      S.stage(X('Put the slide of Amoeba culture on the stage.'), X('Blurred.')),
      S.focus(1, X('Focus at 10×: coarse knob, then fine knob.'), X('A grey jelly-like cell keeps changing its shape, pushing out finger-like parts.'), X('These are pseudopodia (false feet). The Amoeba moves and catches food with them.')),
      S.focus(2, X('Turn to 40× to see it closely.'), X('Inside: a nucleus, small food vacuoles and a clear bubble that slowly fills and empties.'), X('The bubble is the contractile vacuole; it pushes extra water out of the cell.'), true),
      { do: X('Keep watching (time-lapse).'), target: 'sc', act: async (K, o) => { await K.tween(9, (k) => { o.slide.split = k; }); K.lab.emit('split', {}); }, ev: { type: 'split' },
        see: X('The nucleus divides into two, the cell narrows in the middle, and two smaller Amoebae move apart.'), why: X('This is binary fission: one parent cell divides into two equal daughter cells. There is no partner, so it is asexual reproduction.') },
    ],
    eq: { word: 'Amoeba → nucleus divides → cytoplasm divides → 2 daughter Amoebae', sym: '1 → 2' },
    result: { obs: X('The Amoeba moved by pseudopodia; then its nucleus divided and the cell split into two daughter Amoebae.'), concl: X('Amoeba reproduces by binary fission, a kind of asexual reproduction in single-celled organisms.'),
      safety: X('—'), viva: [{ q: X('What is binary fission?'), a: X('The division of one cell into two equal daughter cells.') }, { q: X('What divides first?'), a: X('The nucleus.') }, { q: X('How does Amoeba move?'), a: X('With pseudopodia (false feet).') }] },
  },
  {
    id: 'bio10_bread_mould', subj: 'biology', cls: 10, also: [8], ch: B10R, topic: 'repro',
    title: X('Bread mould: spores in tiny black heads'),
    aim: X('To see the threads of bread mould and the round spore cases at the tips of its stalks.'),
    kind: X('Asexual reproduction: spore formation'),
    setup(K) { const o = bench(K, { src: 'bread', stain: 'none' }); o.spec = 'mould'; return common(K, o); },
    steps: [
      { do: X('Look at the slice of bread kept moist and warm for a few days.'), target: 'src', act: async (K) => { await K.sleep(1.2); K.lab.emit('look', {}); }, ev: { type: 'look' }, see: X('White cottony threads with tiny black dots on them.'), why: X('This is Rhizopus, bread mould, a fungus. Its spores were in the air.') },
      S.peel(X('With the needle, lift a few threads with their black heads into the watch glass.'), X('A tuft of fine threads.')),
      S.onSlide(X('Spread them in a drop of water on a slide.'), X('Spread out.')),
      S.cover(X('Put on a cover slip.'), X('Ready.')),
      S.stage(X('Put the slide on the stage.'), X('Blurred.')),
      S.focus(0, X('Focus at 4×.'), X('A tangle of thin threads, and upright stalks with round black heads.'), X('The threads are hyphae. The black heads are sporangia: each is full of spores.')),
      S.focus(1, X('Turn to 10× and sharpen with the fine knob.'), X('Each black head is packed with tiny spores.'), X('When a sporangium bursts, the light spores float away; on moist food each grows into new mould.'), true),
    ],
    eq: { word: 'sporangium bursts → spores → each spore → new Rhizopus', sym: '—' },
    result: { obs: X('Bread mould had thin threads (hyphae) and upright stalks ending in round black sporangia full of spores.'), concl: X('Rhizopus reproduces by spore formation, an asexual way of reproduction.'), safety: X('Do not smell or eat mouldy bread; wash your hands.'),
      viva: [{ q: X('What are the black dots on bread mould?'), a: X('Sporangia full of spores.') }, { q: X('Name the threads of the mould.'), a: X('Hyphae.') }, { q: X('Why does mould grow on moist bread?'), a: X('Its spores need moisture and food to grow.') }] },
  },
  {
    id: 'bio10_hydra_budding', subj: 'biology', cls: 10, also: [9], ch: B10R, topic: 'repro',
    title: X('Hydra with a bud'),
    aim: X('To see a permanent slide of Hydra with a young Hydra growing from its side.'),
    kind: X('Asexual reproduction: budding'),
    setup(K) { const o = bench(K, { permanent: true, spec: 'hydra', label: 'Hydra' }); return common(K, o); },
    steps: [
      S.stage(X('Put the permanent slide of Hydra on the stage.'), X('Blurred.')),
      S.focus(0, X('Focus at 4×.'), X('A tube-like animal with a ring of tentacles at the top, and a smaller one growing out of its side.'), X('The small one is a bud: a new Hydra growing from the parent.')),
      S.focus(1, X('Turn to 10× and look at the bud.'), X('The bud already has its own small tentacles.'), X('When it is fully grown, the bud breaks away and lives on its own. Budding is asexual reproduction; yeast reproduces this way too.'), true),
    ],
    eq: { word: 'parent Hydra → bud grows → bud breaks away → new Hydra', sym: '—' },
    result: { obs: X('The Hydra had a bud with small tentacles growing from its side.'), concl: X('Hydra reproduces asexually by budding.'), safety: X('Hold the slide by its edges.'),
      viva: [{ q: X('How does Hydra reproduce asexually?'), a: X('By budding.') }, { q: X('Name a single-celled organism that also buds.'), a: X('Yeast.') }, { q: X('What does the bud do when it is mature?'), a: X('It separates and grows into a new Hydra.') }] },
  },
];
