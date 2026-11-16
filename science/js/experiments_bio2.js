// DUET Science Lab 360, biology at the bench, batch BIO2 (NCERT Classes 6-10: plants, nutrition, respiration, transport,
// reproduction): starch in a leaf (light, chlorophyll, carbon dioxide), food tests, saliva and starch, transpiration, water
// rising in xylem, oxygen from Hydrilla, seeds that germinate and breathe, osmosis in raisins,
// plants that grow towards light. The living things and special apparatus are in biobench2.js and biobench2b.js.
// Everything the student sees comes from what was done: the plant's leaf keeps a starch map that follows the light, the dark,
// the black paper, the white patches and the carbon dioxide it really got; the chemistry engine colours the tubes.
import * as THREE from 'three';
import { DICT } from './exp_i18n.js';
import { DICT_BIO2 } from './exp_i18n_bio2.js';
import * as B from './biobench2.js';
import * as B2 from './biobench2b.js';
import { tool } from './microscope.js';
import { handle } from './mathworld.js';
import { liveSign } from './mathworld4.js';
import { BENCH_Y } from './room.js';
import { canvasTex } from './mats.js';
Object.assign(DICT, DICT_BIO2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const T3 = (en, hi, hg) => ({ en, hi, hg });
const C6F = X('Ch 3 · Mindful Eating: A Path to a Healthy Body');
const C6L = X('Ch 10 · Living Creatures: Exploring their Characteristics');
const C7A = X('Ch 9 · Life Processes in Animals');
const C7P = X('Ch 10 · Life Processes in Plants');
const C9 = X('Ch 2 · Cell: The Building Block of Life');
const C10L = X('Ch 5 · Life Processes');
const C10C = X('Ch 6 · Control and Coordination');
const keepHome = (it) => { it.home = { p: it.g.position.clone(), q: it.g.quaternion.clone() }; return it; };
const qFlat = (ry = 0.4) => new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, ry));
// a camera anchor: while it has a view, the camera looks where the experiment wants (a close look at a leaf, a tube); null = follow the action
function camAnchor(K) { const it = new K.A.Item('bcam', { name: N('view', 'view') }); it.noGrab = true; it.noPhys = true; it.height = 0.001; it.radius = 0.001; K.add(it, 0, -0.6); it.g.visible = true; return it; }
function look(o, at, p, t = V(0, 0, 0)) { if (!at) { o.cam.camView = null; return; } o.cam.g.position.copy(at); o.cam.camView = { p, t }; }
// the liquids at the bottom of the tubes in a rack, seen through the gap under the rack's middle rail
function tubesLook(o, d = 0.4) { look(o, o.rk.g.position.clone().add(V(0, 0.03, 0)), V(0, 0.05, d)); }

// ============================================================================ the leaf bench: a potted plant, sunlight, a dark box, a clock,
// and the kit to test a leaf for starch (boiling water on a burner, a tube of alcohol, warm water, a dish, iodine)
function leafBench(K, cfg = {}) {
  const app = K.app; const o = {}; const varieg = cfg.kind === 'ovate';
  o.skin = new B.LeafSkin(varieg ? 'leaf_ovate' : 'testleaf', { starch: 1, variegated: varieg, seed: 4 });
  const plantSkin = varieg ? new B.LeafSkin('leaf_ovate', { variegated: true, seed: 4 }) : null; // the other leaves of the variegated plant
  o.plant = K.add(B.pottedPlant({ seed: cfg.seed ?? 11, kind: cfg.kind || 'sb', skin: o.skin, skinVar: plantSkin, h: 0.2, pairs: 6, flowers: varieg ? 0 : 2,
    name: varieg ? N('Potted plant with variegated leaves', 'चितकबरी (हरी-सफ़ेद) पत्तियों वाला गमले का पौधा', 'Chitkabri (hari-safed) pattiyon wala gamle ka paudha') : undefined }), -0.52, -0.62);
  keepHome(o.plant);
  o.sun = K.add(B.sunPatch({ w: 0.34, d: 0.3 }), -0.86, -0.7); o.box = K.add(B.darkBox({ w: 0.24, d: 0.22, h: 0.29 }), -0.16, -0.84); o.box.setOpen(1);
  o.S = B.timeSlider(app, { max: cfg.max ?? 60, ticks: 10, labels: cfg.labels || [[0, '0 h'], [0.4, '24 h'], [0.8, '48 h']] }); o.S.place(-0.3, -0.42); o.knob = o.S.knob;
  // where the plant stands decides its light: sunlight 1, the room 0.06, the closed box 0
  o.where = 'bench';
  o.setWhere = (w) => { if (w === 'sun' && o.where !== 'sun') o.sunAt = o.S.hours; o.where = w; o.plant.light = w === 'sun' ? 1 : w === 'box' ? 0 : 0.06; };
  let acc = 0; const grow = () => { if (acc <= 0) return; o.skin.grow(acc, o.plant.light, cfg.rate ? (u, v) => cfg.rate(o, u, v) : null); acc = 0; };
  o.S.onHours = (h, dh) => { acc += dh; if (acc >= 0.5) grow(); }; o.flush = grow;
  o.plant.noGrab = false; o.plant.dragLift = 0.04;
  o.plant.onRelease = () => { const p = o.plant.g.position; p.y = BENCH_Y + 0.0008; o.plant.g.quaternion.identity(); grow();
    if (o.box.inside(p)) { p.x = o.box.g.position.x; p.z = o.box.g.position.z; o.box.setOpen(0); o.setWhere('box'); K.lab.emit('in_box', { obj: o.plant.id }); }
    else { if (o.where === 'box') o.box.setOpen(1); o.setWhere(o.sun.inside(p) ? 'sun' : 'bench'); K.lab.emit('placed', { obj: o.plant.id, where: o.where }); }
    keepHome(o.plant); };
  // the kit on the right
  o.tp = K.tripod(0.3, -0.76); o.burner = K.burner(0.3, -0.76); o.burner.setLit(true);
  o.bath = K.add(K.A.beaker(250), 0.3, -0.76, { y: BENCH_Y + o.tp.top + 0.001 }); K.lab.fill(o.bath, 'water', 150); o.bath.mix.temp = 97; o.bath.onTripod = { over: o.burner }; o.bath.name = N('Beaker of boiling water (water bath)', 'उबलते पानी का बीकर (वॉटर बाथ)', 'Ubalte paani ka beaker (water bath)'); keepHome(o.bath);
  o.rk = K.rack(0.58, -0.84); o.tube = K.tube(o.rk, 2, 'spirit', 14, { boiling: true }); o.tube.name = N('Boiling tube with alcohol (spirit)', 'अल्कोहल (स्पिरिट) वाली बॉयलिंग ट्यूब', 'Alcohol (spirit) wali boiling tube'); keepHome(o.tube);
  B.spiritWatch(K, o.tube, o.burner, () => { o.fire = true; });
  B.bathOnRelease(K, o.tube, [o.bath]);
  o.warm = K.beaker(0.82, -0.78, 'water', 120, 250); o.warm.mix.temp = 50; o.warm.hold = 50; o.warm.name = N('Beaker of warm water', 'गुनगुने पानी का बीकर', 'Gungune paani ka beaker');
  const wu = o.warm.update.bind(o.warm); o.warm.update = (dt) => { wu(dt); o.warm.mix.temp += (50 - o.warm.mix.temp) * Math.min(1, dt); };
  o.tile = K.add(K.A4.whiteTile(0.16, 0.12), 0.6, -0.52); o.dish = K.add(K.A3.petriDish(), 0.6, -0.52, { y: BENCH_Y + 0.006 }); keepHome(o.dish);
  o.iod = K.bottle('iodine', 0.82, -0.56, { dropper: true });
  o.forceps = K.add(tool('forceps'), 0.36, -0.52); o.forceps.g.rotation.y = 0.5; keepHome(o.forceps);
  if (cfg.paper) { o.paper = K.add(B.paperStrip(), -0.36, -0.46); o.paper.g.rotation.y = 0.3; keepHome(o.paper); }
  if (cfg.moll) mollBottle(K, o);
  o.lf = null; // the plucked leaf
  o.cam = camAnchor(K);
  return o;
}
// clip the black paper on the test leaf (both sides), and take it off again
async function paperOn(K, o) {
  const lf = o.plant.testLeaf; const g = lf.mesh.geometry.userData; const at = o.plant.leafWorld(lf, 0.5).add(V(0, 0.02, 0));
  await K.moveTo(o.paper, at, null, 1); lf.mesh.attach(o.paper.g); o.paper.g.position.set(0, g.len * 0.5, -0.0012); o.paper.g.quaternion.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  o.paper.sheets[0].position.y = 0.0016; o.paper.sheets[1].position.set(0.002, -0.0012, 0.001); o.skin.setPaper(0.4, 0.62); o.paperOn = true; K.lab.emit('paper_on', { obj: o.paper.id });
}
async function paperOff(K, o) { if (!o.paperOn) return; K.app.scene.attach(o.paper.g); o.paperOn = false; await K.home(o.paper, 0.8); }
function paperByHand(K, o) {
  o.paper.onRelease = () => { const lf = o.plant.testLeaf; if (lf.plucked || o.paperOn) return; const p = o.paper.g.getWorldPosition(new THREE.Vector3()); if (p.distanceTo(o.plant.leafWorld(lf, 0.5)) < 0.06) { paperOn(K, o); } else { o.paper.g.position.y = BENCH_Y + 0.001; keepHome(o.paper); } };
}
async function plantTo(K, o, where) {
  const pl = o.plant; let p;
  if (where === 'box') { o.box.setOpen(1); await K.sleep(0.3); p = o.box.g.position.clone(); }
  else if (where === 'sun') { if (o.where === 'box') { o.box.setOpen(1); await K.sleep(0.3); } p = o.sun.g.position.clone(); }
  else { if (o.where === 'box') { o.box.setOpen(1); await K.sleep(0.3); } p = V(-0.52, 0, -0.62); }
  o.flush(); await K.moveTo(pl, V(p.x, BENCH_Y + 0.0008, p.z), new THREE.Quaternion(), 1.2); keepHome(pl);
  if (where === 'box') { await K.tween(0.5, (k) => o.box.setOpen(1 - k)); }
  o.setWhere(where); K.lab.emit(where === 'box' ? 'in_box' : 'placed', { obj: pl.id, where });
}
// the Moll's half-leaf set-up: a wide-mouthed bottle with potassium hydroxide pellets, lying on its side, half of the test leaf
// passed into it through a split cork (sealed with Vaseline)
function mollBottle(K, o) {
  const prof = [[0, 0], [0.028, 0], [0.032, 0.004], [0.032, 0.07], [0.022, 0.082], [0.019, 0.088], [0.0195, 0.092]];
  const bot = K.add(new K.A.Vessel('jar', prof, { wall: 0.0018, name: N('Wide-mouthed bottle with potassium hydroxide (KOH) pellets', 'पोटैशियम हाइड्रॉक्साइड (KOH) की गोलियों वाली चौड़े मुँह की बोतल', 'KOH pellets wali chaude muh ki bottle') }), 0.0, -0.5);
  o.moll = bot; bot.noGrab = true;
  const pel = new THREE.Group(); for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8), B.M(0xf3f2ec, 0.55)); m.scale.set(1, 0.55, 1); m.position.set((Math.random() - 0.5) * 0.03, 0.006, (Math.random() - 0.5) * 0.03 + 0.012); pel.add(m); } bot.g.add(pel); bot.pellets = pel;
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.018, 0.016, 20), B.M(0xb08850, 0.9)); cork.position.y = 0.093; cork.visible = false; bot.g.add(cork); bot.cork = cork;
  bot.g.visible = true;
}
async function mollOn(K, o) {
  // the bottle lies along the leaf: its mouth round the middle of the leaf, the tip half inside; a wooden block holds it up
  const lf = o.plant.testLeaf; const mid = o.plant.leafWorld(lf, 0.47); const dir = o.plant.leafWorld(lf, 1.0).sub(mid).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().negate()); const base = mid.clone().add(dir.clone().multiplyScalar(0.093));
  const c = mid.clone().add(dir.clone().multiplyScalar(0.046)); const bh = Math.max(0.02, c.y - 0.034 - BENCH_Y);
  if (!o.block) { o.block = K.add(K.A5.block(0.05, bh, 0.05), c.x, c.z + 0.2); o.block.g.visible = true; }
  await K.moveTo(o.block, V(c.x, BENCH_Y + 0.0008, c.z), null, 0.8);
  await K.moveTo(o.moll, base, q, 1.2); o.moll.cork.visible = true; o.mollOn = true; o.mollOnce = true;
  o.plant.g.attach(o.moll.g); o.plant.g.attach(o.block.g); K.lab.emit('moll_on', { obj: o.moll.id });
}
async function mollOff(K, o) { if (!o.mollOn) return; o.moll.cork.visible = false; K.app.scene.attach(o.moll.g); K.app.scene.attach(o.block.g); o.mollOn = false; await K.home(o.moll, 1); await K.moveTo(o.block, V(0.12, BENCH_Y + 0.0008, -0.46), new THREE.Quaternion(), 0.8); }
// the leaf off the plant and through the starch test, step by step (each also works by hand)
async function pluckLeaf(K, o) { if (o.lf) return o.lf; await paperOff(K, o); await mollOff(K, o);
  const at = o.plant.leafWorld(o.plant.testLeaf, 0.2); await K.moveTo(o.forceps, at.clone().add(V(0, 0.01, 0)), null, 0.8);
  o.lf = B.leafItem(K, o.plant); B.leafByHand(K, o.lf, [o.bath, o.tube, o.warm, o.dish]); await K.home(o.forceps, 0.6); K.lab.emit('pluck', { obj: o.lf.id }); return o.lf; }
async function boilLeaf(K, o) { look(o, null); const lf = await pluckLeaf(K, o); if (lf.in !== o.bath) await B.leafInto(K, lf, o.bath, 'flat'); await K.wait(3, 25); }
async function leafToAlcohol(K, o) {
  const lf = await pluckLeaf(K, o); if (lf.in && lf.in !== o.tube) { await B.leafOut(K, lf, lf.in.mouthWorld(new THREE.Vector3()).add(V(0, 0.08, 0))); }
  if (lf.in !== o.tube) await B.leafInto(K, lf, o.tube, 'roll');
  if (!o.tube.bath) { o.tube.busyMove = true; await K.moveTo(o.tube, o.bath.mouthWorld(new THREE.Vector3()).add(V(0, 0.12, 0)), new THREE.Quaternion(), 0.9); await tubeTo(K, o.tube, o.bath, 0); o.tube.busyMove = false; } // into the beaker of hot water on the tripod
}
async function rinseToDish(K, o) {
  look(o, null); const lf = await pluckLeaf(K, o); const up = (v) => v.mouthWorld(new THREE.Vector3()).add(V(0, 0.07, 0));
  if (lf.in === o.tube) { await B.leafOut(K, lf, up(o.tube), new THREE.Quaternion()); }
  if (lf.in !== o.warm) { if (lf.in) await B.leafOut(K, lf, up(lf.in)); await B.leafInto(K, lf, o.warm, 'flat'); await K.sleep(0.8); }
  await B.leafOut(K, lf, up(o.warm)); await B.leafInto(K, lf, o.dish, 'flat'); lf.skin.st.dry = 0; K.lab.emit('leaf_dish', { obj: lf.id });
}
// what the iodine shows, read from the leaf's own starch map
function starchCheck(kind) {
  return (K, o) => {
    const sk = o.skin; const lf = o.lf; if (!lf || lf.in !== o.dish || !(sk.st.iod > 0.3)) return null;
    if (sk.st.chl > 0.5) return { ok: false, see: T3('The leaf is still green: the iodine colour can hardly be seen on it.', 'पत्ती अब भी हरी है, इसलिए उस पर आयोडीन का रंग ठीक से दिखता ही नहीं।', 'Patti ab bhi hari hai, isliye us par iodine ka rang theek se dikhta hi nahi.'),
      why: T3('The green chlorophyll hides the blue-black colour. Boil the leaf in alcohol in a water bath until it turns pale, then test it.', 'हरा क्लोरोफ़िल नीले-काले रंग को छिपा देता है। पत्ती को वॉटर बाथ में अल्कोहल में तब तक उबालिए, जब तक वह फीकी न पड़ जाए, फिर जाँचिए।', 'Hara chlorophyll neele-kaale rang ko chhupa deta hai. Patti ko water bath mein alcohol mein tab tak ubaaliye, jab tak wo pheeki na pad jaaye, phir jaanchiye.') };
    const all = sk.mean(); const dk = (x) => x > 0.35;
    if (kind === 'light') {
      if (!o.skin.paper) return all > 0.35 ? { ok: false, see: T3('The whole leaf turns blue-black.', 'पूरी पत्ती नीली-काली हो गई।', 'Poori patti neeli-kaali ho gayi.'), why: T3('The black paper was never clipped on, so every part of the leaf got light and made starch. There is nothing to compare.', 'काला कागज़ लगाया ही नहीं गया, इसलिए पत्ती के हर हिस्से को रोशनी मिली और हर जगह स्टार्च बना। तुलना करने को कुछ बचा ही नहीं।', 'Kaala kaagaz lagaya hi nahi gaya, isliye patti ke har hisse ko roshni mili aur har jagah starch bana. Compare karne ko kuch bacha hi nahi.') } : null;
      const inP = sk.mean((u, v) => v > 0.43 && v < 0.59), out = sk.mean((u, v) => v < 0.3 || v > 0.72);
      if (dk(inP) && dk(out)) return { ok: false, see: T3('The whole leaf turns blue-black, even the part that was under the black paper.', 'पूरी पत्ती नीली-काली हो गई, वह हिस्सा भी जो काले कागज़ के नीचे था।', 'Poori patti neeli-kaali ho gayi, wo hissa bhi jo kaale kaagaz ke neeche tha.'),
        why: T3('The plant was not destarched in the dark first, so the starch it had made earlier was still in every part of the leaf.', 'पौधे को पहले अँधेरे में रखकर उसका स्टार्च ख़त्म नहीं किया गया (डीस्टार्च नहीं किया)। इसलिए पहले का बना स्टार्च पत्ती के हर हिस्से में बचा रहा।', 'Paudhe ko pehle andhere mein rakhkar uska starch khatam nahi kiya gaya (destarch nahi kiya). Isliye pehle ka bana starch patti ke har hisse mein bacha raha.') };
      if (!dk(out)) return { ok: false, see: T3('No part of the leaf turns blue-black: it is brown all over.', 'पत्ती का कोई भी हिस्सा नीला-काला नहीं हुआ, पूरी पत्ती भूरी है।', 'Patti ka koi bhi hissa neela-kaala nahi hua, poori patti bhoori hai.'),
        why: T3(`The plant did not get enough light to make starch (it stood ${o.where === 'box' ? 'in the dark box' : 'in the dim room'}). Leaves make starch only in light.`, `पौधे को स्टार्च बनाने लायक रोशनी नहीं मिली (वह ${o.where === 'box' ? 'अँधेरे डिब्बे में' : 'कमरे की धीमी रोशनी में'} रखा था)। पत्तियाँ सिर्फ़ रोशनी में ही स्टार्च बनाती हैं।`, `Paudhe ko starch banane layak roshni nahi mili (wo ${o.where === 'box' ? 'andhere dibbe mein' : 'kamre ki dheemi roshni mein'} rakha tha). Pattiyan sirf roshni mein hi starch banati hain.`) };
      return { ok: true };
    }
    if (kind === 'chl') {
      const vg = sk.vg; const green = sk.mean((u, v, i) => vg && vg[i] < 0.2), white = sk.mean((u, v, i) => vg && vg[i] > 0.8);
      if (dk(white)) return { ok: false, see: T3('The white parts also turn blue-black.', 'सफ़ेद हिस्से भी नीले-काले हो गए।', 'Safed hisse bhi neele-kaale ho gaye.'), why: T3('The plant still had the starch made before (it was not kept in the dark long enough), so the test cannot show where new starch was made.', 'पौधे में पहले का बना स्टार्च अब भी था (उसे काफ़ी देर अँधेरे में नहीं रखा गया)। इसलिए यह जाँच नहीं बता सकती कि नया स्टार्च कहाँ बना।', 'Paudhe mein pehle ka bana starch ab bhi tha (use kaafi der andhere mein nahi rakha gaya). Isliye ye test nahi bata sakta ki naya starch kahan bana.') };
      if (!dk(green)) return { ok: false, see: T3('No part of the leaf turns blue-black.', 'पत्ती का कोई भी हिस्सा नीला-काला नहीं हुआ।', 'Patti ka koi bhi hissa neela-kaala nahi hua.'), why: T3('The plant was not in sunlight long enough to make starch.', 'पौधे को स्टार्च बनाने लायक देर तक धूप नहीं मिली।', 'Paudhe ko starch banane layak der tak dhoop nahi mili.') };
      return { ok: true };
    }
    if (kind === 'co2') {
      const inB = sk.mean((u, v) => v > 0.6), out = sk.mean((u, v) => v < 0.38);
      if (dk(inB) && dk(out)) return { ok: false, see: T3('The whole leaf turns blue-black, also the part inside the bottle.', 'पूरी पत्ती नीली-काली हो गई, बोतल के अंदर वाला हिस्सा भी।', 'Poori patti neeli-kaali ho gayi, bottle ke andar wala hissa bhi.'),
        why: T3(o.mollOnce ? 'The plant was not destarched, so the old starch was still in the leaf.' : 'The bottle with potassium hydroxide was never put on, so all of the leaf had carbon dioxide.', o.mollOnce ? 'पौधे को डीस्टार्च नहीं किया गया था, इसलिए पुराना स्टार्च पत्ती में बचा था।' : 'पोटैशियम हाइड्रॉक्साइड वाली बोतल लगाई ही नहीं गई, इसलिए पूरी पत्ती को कार्बन डाइऑक्साइड मिलती रही।', o.mollOnce ? 'Paudhe ko destarch nahi kiya gaya tha, isliye purana starch patti mein bacha tha.' : 'KOH wali bottle lagayi hi nahi gayi, isliye poori patti ko carbon dioxide milti rahi.') };
      if (!dk(out)) return { ok: false, see: T3('No part of the leaf turns blue-black.', 'पत्ती का कोई भी हिस्सा नीला-काला नहीं हुआ।', 'Patti ka koi bhi hissa neela-kaala nahi hua.'), why: T3('The plant did not get enough sunlight to make starch.', 'पौधे को स्टार्च बनाने लायक धूप नहीं मिली।', 'Paudhe ko starch banane layak dhoop nahi mili.') };
      return { ok: true };
    }
    return null;
  };
}
// the steps every leaf test has
const L = {
  dark: (h, text, see, why) => [
    { do: X('Put the potted plant inside the dark box and close it.'), target: 'plant', act: (K, o) => plantTo(K, o, 'box'), ev: { type: 'in_box' }, see: X('The plant is in complete darkness.') },
    { do: text, target: 'knob', act: (K, o) => o.S.to(K, h, 4), ev: { type: 'time' }, until: (K, o) => o.S.hours >= h - 1, see, why },
  ],
  sun: (h0, h, text, see, why) => [
    { do: X('Take the plant out of the box and put it in the sunlight by the window.'), target: 'plant', act: (K, o) => plantTo(K, o, 'sun'), ev: { type: 'placed' }, until: (K, o) => o.where === 'sun', see: X('Bright sunlight falls on the plant.') },
    { do: text, target: 'knob', act: (K, o) => o.S.to(K, o.S.hours + h, 4), ev: { type: 'time' }, until: (K, o) => o.S.hours >= (o.sunAt ?? 0) + h - 0.5, see, why },
  ],
  boil: () => ({ do: X('Pluck the leaf. Dip it in the boiling water for a minute or two.'), target: 'bath', act: (K, o) => boilLeaf(K, o), ev: { type: 'leaf_in', in: 'bath' },
    see: X('The leaf goes limp and a little darker.'), why: X('Boiling kills the cells and softens the leaf, so that alcohol and iodine can get into it.') }),
  alcohol: () => ({ do: X('Put the leaf into the boiling tube of alcohol and stand the tube in the hot water bath. Never heat alcohol directly on the flame.'), target: 'tube', act: (K, o) => leafToAlcohol(K, o), ev: { type: 'bath', v: 'tube' },
    see: X('The alcohol warms up in the hot water and starts to boil gently.'), why: X('Alcohol catches fire easily, so it is heated only in a water bath.') }),
  decolour: () => ({ do: X('Leave it in the hot alcohol until the leaf loses its green colour (time-lapse).'), target: 'tube', act: async (K, o) => { look(o, o.tube.g.getWorldPosition(V(0, 0, 0)).add(V(0, 0.06, 0)), V(0.06, 0.08, 0.22)); await K.wait(8, 90); o.skin.draw(); }, noCheck: true,
    see: X('The leaf turns pale yellowish-white, and the alcohol turns green.'), why: X('Hot alcohol dissolves chlorophyll, the green pigment, out of the leaf. Now a colour change on the leaf will be easy to see.') }),
  rinse: () => ({ do: X('Take the leaf out with forceps, wash it in warm water and spread it flat in the petri dish.'), target: 'dish', act: (K, o) => rinseToDish(K, o), ev: { type: 'leaf_dish' },
    see: X('A pale, soft leaf lies flat in the dish.'), why: X('Alcohol makes the leaf brittle; warm water softens it again.') }),
  iodine: (see, why, kind) => ({ do: X('Put a few drops of iodine solution on the leaf.'), target: 'iod', act: async (K, o) => { look(o, o.dish.g.position.clone(), V(0.0, 0.2, 0.17)); await K.drops(o.iod, o.dish, 5); await K.sleep(2); o.skin.draw(); }, ev: { type: 'drops', from: 'iod', to: 'dish' },
    check: starchCheck(kind), see, why }),
};
function leafSteps(o2) { return o2; }

// ============================================================================ transpiration, xylem and growth helpers
async function bagOn(K, o, k) {
  const bag = k === 'a' ? o.bagA : o.bagB, p = k === 'a' ? o.a : o.b; if (bag.on) return;
  const at = p.g.localToWorld(V(0, p.pot.userData.soilY + 0.012, 0)); await K.moveTo(bag, at.clone().add(V(0, 0.28, 0.05)), new THREE.Quaternion(), 0.9);
  await K.tween(0.5, (q) => bag.g.scale.setScalar(0.45 + 0.55 * q)); await K.tween(0.8, (q) => bag.g.position.lerpVectors(at.clone().add(V(0, 0.28, 0.05)), at, B.ease(q)));
  p.g.attach(bag.g); bag.on = true; bag.noGrab = true; K.lab.emit('bag_on', { v: bag.id });
}
function transCheck(K, o) {
  if (!o.bagA.on) return { ok: false, see: T3('There is no bag on plant A, so nothing collects.', 'पौधे A पर थैली है ही नहीं, इसलिए कुछ जमा नहीं हुआ।', 'Paudhe A par thaili hai hi nahi, isliye kuch jama nahi hua.'), why: T3('Water vapour from the leaves escapes into the air unseen; the bag is needed to catch it.', 'पत्तियों से निकली भाप हवा में घुल जाती है और दिखती नहीं; उसे पकड़ने के लिए थैली ज़रूरी है।', 'Pattiyon se nikli bhaap hawa mein ghul jaati hai aur dikhti nahi; use pakadne ke liye thaili zaroori hai.') };
  if (o.mist.a < 0.45) return { ok: false, see: T3('Bag A has only a little mist inside.', 'थैली A के अंदर बस थोड़ी-सी भाप जमी है।', 'Thaili A ke andar bas thodi-si bhaap jami hai.'), why: T3('Plant A was not in sunlight (or not for long). Leaves transpire much faster in sunlight and warmth.', 'पौधा A धूप में नहीं था (या ज़्यादा देर नहीं रहा)। धूप और गरमी में पत्तियाँ बहुत तेज़ी से पानी छोड़ती हैं।', 'Paudha A dhoop mein nahi tha (ya zyada der nahi raha). Dhoop aur garmi mein pattiyan bahut tezi se paani chhodti hain.') };
  return { ok: true };
}
async function twigIn(K, o) {
  const g = o.glass; const at = g.g.localToWorld(V(-0.004, g.inner[0].y + 0.002, 0)); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0.1));
  await K.moveTo(o.twig, at.clone().add(V(0, 0.12, 0)), q, 1.1); await K.tween(0.7, (k) => o.twig.g.position.lerpVectors(at.clone().add(V(0, 0.12, 0)), at, B.ease(k)));
  o.twig.inWater = true; keepHome(o.twig); K.lab.emit('twig_in', { obj: o.twig.id });
}
function inkCheck(K, o) {
  if ((o.redK || 0) > 0.35) return { ok: true };
  const ink = (o.glass.mix.liq.redink || 0) > 1;
  return { ok: false, see: T3('The petals are still white and the leaves still green.', 'पंखुड़ियाँ अब भी सफ़ेद हैं और पत्तियाँ हरी।', 'Pankhudiyan ab bhi safed hain aur pattiyan hari.'),
    why: ink ? T3('The twig has not stood in the red water long enough (or not at all). The colour needs many hours to climb.', 'टहनी लाल पानी में काफ़ी देर नहीं रही (या रखी ही नहीं गई)। रंग को ऊपर चढ़ने में कई घंटे लगते हैं।', 'Tehni laal paani mein kaafi der nahi rahi (ya rakhi hi nahi gayi). Rang ko upar chadhne mein kai ghante lagte hain.')
      : T3('No red ink was put in the water, so the water that climbed up has no colour to show its path.', 'पानी में लाल स्याही डाली ही नहीं गई, इसलिए ऊपर चढ़े पानी का रास्ता दिखाने के लिए कोई रंग नहीं है।', 'Paani mein laal syahi daali hi nahi gayi, isliye upar chadhe paani ka raasta dikhane ke liye koi rang nahi hai.') };
}
async function cutSection(K, o) {
  look(o, null);
  // the twig is lifted out and held beside the slide; the blade takes a thin slice across the stem just above its cut end
  const held = V(0.2, BENCH_Y + 0.07, -0.6); o.twig.inWater = false;
  await K.moveTo(o.twig, held, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.5, 0)), 1.1);
  const base = o.twig.g.localToWorld(V(0, 0.012, 0)); await K.moveTo(o.blade, base.clone().add(V(0.03, 0, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), 0.8); await K.tween(0.6, (k) => { o.blade.g.position.x = base.x + 0.03 - 0.035 * k; o.blade.g.position.z = base.z + Math.sin(k * 14) * 0.004; }); await K.home(o.blade, 0.6);
  const inked = (o.redK || 0) > 0.3; const tx = B2.sectionTexture(inked);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0007, 24), [B.M(0x5f8a35, 0.6), B.M(0xffffff, 0.55, 0, { map: tx }), B.M(0xffffff, 0.55, 0, { map: tx })]);
  const sp = o.slide.g.localToWorld(V(0, 0.0025, 0)); disc.position.copy(sp); K.app.scene.add(disc); K.extras.push(disc);
  // the twig goes back into its water; the magnifying glass is held flat a few centimetres over the slice
  const g = o.glass; const at = g.g.localToWorld(V(-0.004, g.inner[0].y + 0.002, 0)); await K.moveTo(o.twig, at.clone().add(V(0, 0.12, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.4, 0.1)), 1); await K.tween(0.5, (k) => o.twig.g.position.lerpVectors(at.clone().add(V(0, 0.12, 0)), at, B.ease(k))); o.twig.inWater = true; keepHome(o.twig);
  await K.moveTo(o.lens, sp.clone().add(V(0, 0.04, 0)), new THREE.Quaternion(), 1);
  // what the eye sees through the lens: the slice, many times bigger, in a dark round field like the lens rim
  const view = new THREE.Mesh(new THREE.CircleGeometry(0.045, 48), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); view.position.copy(sp).add(V(0, 0.13, -0.03)); K.app.scene.add(view); K.extras.push(view); view.userData.noHit = true;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.05, 48), new THREE.MeshBasicMaterial({ color: 0x1c2026 })); view.add(ring); ring.position.z = 0.0005;
  look(o, view.position.clone(), V(0, 0.035, 0.24)); view.lookAt(view.position.clone().add(V(0, 0.035, 0.24))); o.sectionView = view; K.lab.emit('section', {}); await K.sleep(2);
}
async function waterPot(K, o, p) { await K.pour(o.jug, p, 50); if (!o.wat.get(p)) { o.wat.set(p, 1); K.lab.emit('watered', { obj: p.id }); } }
function growthCheck(K, o) {
  const st = (p) => p.state; const A = st(o.a), Bb = st(o.b), Cc = st(o.c);
  const said = []; const why = [];
  if (A.wilt > 0.4) { said.push(T3('Sapling A has wilted too.', 'पौधा A भी मुरझा गया।', 'Paudha A bhi murjha gaya.')); why.push(T3('A got no water.', 'A को पानी नहीं मिला।', 'A ko paani nahi mila.')); }
  if (Bb.wilt < 0.4) { said.push(T3('Sapling B did not wilt.', 'पौधा B नहीं मुरझाया।', 'Paudha B nahi murjhaya.')); why.push(T3('B was given water after all.', 'B को पानी दे दिया गया था।', 'B ko paani de diya gaya tha.')); }
  if (Cc.pale < 0.4) { said.push(T3('Sapling C stayed green.', 'पौधा C हरा ही रहा।', 'Paudha C hara hi raha.')); why.push(T3('C was not kept in the dark.', 'C को अँधेरे में नहीं रखा गया।', 'C ko andhere mein nahi rakha gaya.')); }
  if (!said.length) return { ok: true }; const j = (a, L) => a.map((x) => x[L]).join(' ');
  return { ok: false, see: T3(j(said, 'en'), j(said, 'hi'), j(said, 'hg')), why: T3(j(why, 'en'), j(why, 'hi'), j(why, 'hg')) };
}

// ============================================================================ food test helpers
function foodCheck(k) {
  return (K, o) => { const v = o[k]; if (!(v.stain > 0.2)) return { ok: false, see: T3('The iodine has not fallen on this food yet.', 'आयोडीन अभी इस खाने पर गिरा ही नहीं।', 'Iodine abhi is khaane par gira hi nahi.'), why: T3('Hold the dropper right above the food and squeeze gently.', 'ड्रॉपर को खाने के ठीक ऊपर रखकर हल्के से दबाइए।', 'Dropper ko khaane ke theek upar rakhkar halke se dabaiye.') }; return { ok: true }; };
}
async function rubOn(K, o, k, pk) {
  const it = o[k], p = o[pk]; const at = p.g.position.clone().add(V(0, 0.004, 0)); await K.moveTo(it, at.clone().add(V(0, 0.01, 0)), null, 0.9);
  await K.tween(1.2, (q) => { it.g.position.x = at.x + Math.sin(q * 18) * 0.008; it.g.position.z = at.z + Math.cos(q * 18) * 0.006; it.g.position.y = at.y; });
  p.oil = Math.max(p.oil, it.fat); p.wet = Math.max(p.wet, it.water); p.draw(); await K.home(it, 0.8); K.lab.emit('rub', { v: p.id });
}
async function oilDrops(K, o) {
  const p = o.pC; const top = p.g.position.clone().add(V(0, 0.09, 0)); const d = o.oil; const p0 = d.g.position.clone(); await K.moveTo(d, top, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 2.4)), 0.9);
  for (let i = 0; i < 2; i++) { await new Promise((r) => K.fx.drop(top.clone().add(V(-0.03, -0.02, 0)), p.g.position.clone().add(V(0, 0.001, 0)), d.color.clone(), r)); p.oil = Math.min(1, p.oil + 0.55); p.draw(); await K.sleep(0.3); }
  void p0; await K.home(d, 0.8); K.lab.emit('rub', { v: p.id });
}
async function backlight(K, o) {
  o.lamp.setOn(true); const bulb = o.lamp.g.localToWorld(o.lamp.bulbLocal.clone());
  for (const t of ['A', 'B', 'C', 'D']) { const p = o['p' + t]; const before = p.g.position.clone(), q0 = p.g.quaternion.clone(); const at = bulb.clone().add(V(0, 0.0, 0.1)); const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    await K.moveTo(p, at, q, 0.8); p.backlit(true); look(o, at, V(0.0, 0.02, 0.2)); await K.sleep(1.4); p.backlit(false); await K.moveTo(p, before, q0, 0.7); p.lit = false; p.seen = true; }
  look(o, V(0, BENCH_Y, -0.6), V(0, 0.22, 0.3)); K.lab.emit('backlit', {});
}
function fatCheck(K, o) {
  const bad = []; for (const t of ['A', 'B', 'C']) if (!(o['p' + t].oil > 0.3)) bad.push(t); const wetD = o.pD.wet > 0.2;
  if (!bad.length && !wetD) return { ok: true };
  return { ok: false, see: T3(`${bad.length ? `No oily patch on paper ${bad.join(', ')}.` : ''} ${wetD ? 'Paper D still has a wet patch, which also lets light through.' : ''}`.trim(), `${bad.length ? `कागज़ ${bad.join(', ')} पर तेल का कोई धब्बा नहीं है।` : ''} ${wetD ? 'कागज़ D पर अब भी गीला धब्बा है, उससे भी रोशनी आर-पार दिखती है।' : ''}`.trim(), `${bad.length ? `Kaagaz ${bad.join(', ')} par tel ka koi dhabba nahi hai.` : ''} ${wetD ? 'Kaagaz D par ab bhi geela dhabba hai, usse bhi roshni aar-paar dikhti hai.' : ''}`.trim()),
    why: T3(`${bad.length ? 'Nothing was rubbed on that paper.' : ''} ${wetD ? 'Let the papers dry first: water also makes paper translucent, but only until it dries.' : ''}`.trim(), `${bad.length ? 'उस कागज़ पर कुछ रगड़ा ही नहीं गया।' : ''} ${wetD ? 'पहले कागज़ सूखने दीजिए: पानी से भी कागज़ पारभासी हो जाता है, पर सिर्फ़ सूखने तक।' : ''}`.trim(), `${bad.length ? 'Us kaagaz par kuch ragda hi nahi gaya.' : ''} ${wetD ? 'Pehle kaagaz sookhne dijiye: paani se bhi kaagaz translucent ho jaata hai, par sirf sookhne tak.' : ''}`.trim()) };
}
function proteinCheck(K, o) {
  const viol = (v) => (v.mix.liq.biuret || 0) > 0.012; const blue = (v) => (v.mix.ppt.cuoh2 || 0) > 0.01;
  const res = { a: viol(o.a), b: viol(o.b), c: viol(o.c), d: viol(o.d) };
  if (!res.a && res.b && res.c && !res.d) return { ok: true };
  const noNa = ['a', 'b', 'c', 'd'].filter((k) => !(o[k].mix.inp.naoh > 0.2)), noCu = ['a', 'b', 'c', 'd'].filter((k) => !(o[k].mix.inp.cuso4 > 0.04)); const L = (a) => a.map((k) => k.toUpperCase()).join(', ');
  const vi = ['a', 'b', 'c', 'd'].filter((k) => res[k]);
  return { ok: false, see: T3(vi.length ? `Violet in tube ${L(vi)} only.` : 'No tube turns violet.', vi.length ? `सिर्फ़ ट्यूब ${L(vi)} बैंगनी हुई।` : 'कोई भी ट्यूब बैंगनी नहीं हुई।', vi.length ? `Sirf tube ${L(vi)} baingani hui.` : 'Koi bhi tube baingani nahi hui.'),
    why: T3(`${noCu.length ? `Tube ${L(noCu)} got no copper sulphate. ` : ''}${noNa.length ? `Tube ${L(noNa)} got no (or too little) sodium hydroxide: the violet colour forms only in an alkaline liquid.` : ''}` || 'Compare the amounts you added with the method.', `${noCu.length ? `ट्यूब ${L(noCu)} में कॉपर सल्फ़ेट नहीं डाला गया। ` : ''}${noNa.length ? `ट्यूब ${L(noNa)} में सोडियम हाइड्रॉक्साइड नहीं (या बहुत कम) डाला गया; बैंगनी रंग क्षारीय घोल में ही बनता है।` : ''}` || 'आपने जितना डाला, उसकी तुलना विधि से कीजिए।', `${noCu.length ? `Tube ${L(noCu)} mein copper sulphate nahi daala gaya. ` : ''}${noNa.length ? `Tube ${L(noNa)} mein sodium hydroxide nahi (ya bahut kam) daala gaya; baingani rang alkaline ghol mein hi banta hai.` : ''}` || 'Aapne jitna daala, uski tulna method se kijiye.') };
}
async function riceInto(K, o, t, chew) {
  const sp = o.spoon; await K.moveTo(sp, o.pile.g.position.clone().add(V(0, 0.02, 0)), null, 0.8);
  if (chew) { const cam = K.app.camera.position.clone(); await K.moveTo(sp, cam.clone().lerp(sp.g.position, 0.55), null, 0.9); await K.sleep(1.2); }
  const m = t.mouthWorld(new THREE.Vector3()); await K.moveTo(sp, m.clone().add(V(0, 0.03, 0)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.9)), 0.9);
  // two minutes of chewing in the warm mouth mixes in plenty of saliva, which has already turned part of the starch into sugar
  if (chew) { K.lab.fill(t, 'starch', 0.8); K.lab.fill(t, 'maltose', 1.2); K.lab.fill(t, 'saliva', 1.5); } else K.lab.fill(t, 'starch', 2); if (!t.riceG) { t.riceG = B2.riceInTube(t, chew, chew ? 9 : 4); t.g.add(t.riceG); } await K.home(sp, 0.8); K.lab.emit('rice', { v: t.id });
}
async function tubeTo(K, t, b, dx = -0.012) {
  const m = b.g.position.clone(); const y = m.y + b.inner[0].y + 0.004; // (a bath may stand on a tripod)
  await K.moveTo(t, V(m.x + dx, y + 0.13, m.z), new THREE.Quaternion(), 0.8); await K.tween(0.6, (k) => { t.g.position.y = y + 0.13 * (1 - B.ease(k)); }); t.g.position.x = m.x + dx;
  t.bath = b; t.home = { p: t.g.position.clone(), q: t.g.quaternion.clone() }; K.lab.emit('bath', { v: t.id, in: b.id });
}
// which tubes really turned blue-black (starch left), from their chemistry
function salivaCheck(wantBlue, wantBrown) {
  return (K, o) => { const blue = (v) => (v.mix.liq.sic || 0) > 0.02; const all = wantBlue.concat(wantBrown); if (!all.every((k) => (o[k].mix.inp.iodine || 0) > 0.05)) return null;
    const wrong = all.filter((k) => blue(o[k]) !== wantBlue.includes(k)); if (!wrong.length) return { ok: true };
    const bl = all.filter((k) => blue(o[k])).map((k) => k.toUpperCase()), br = all.filter((k) => !blue(o[k])).map((k) => k.toUpperCase());
    const msg = (L) => ({ en: `${bl.length ? `Blue-black: ${bl.join(', ')}.` : 'No tube turns blue-black.'} ${br.length ? `Yellowish-brown: ${br.join(', ')}.` : ''}`, hi: `${bl.length ? `नीली-काली: ${bl.join(', ')}।` : 'कोई ट्यूब नीली-काली नहीं हुई।'} ${br.length ? `पीली-भूरी: ${br.join(', ')}।` : ''}`, hg: `${bl.length ? `Neeli-kaali: ${bl.join(', ')}.` : 'Koi tube neeli-kaali nahi hui.'} ${br.length ? `Peeli-bhoori: ${br.join(', ')}.` : ''}` }[L]);
    return { ok: false, see: T3(msg('en').trim(), msg('hi').trim(), msg('hg').trim()),
      why: T3('A tube stays yellowish-brown only if its starch was digested: it needs saliva, a temperature near 37 °C and enough time. Check what each tube really got.', 'ट्यूब पीली-भूरी तभी रहती है जब उसका स्टार्च पच गया हो: इसके लिए लार, लगभग 37 °C का तापमान और काफ़ी समय चाहिए। देखिए कि हर ट्यूब को असल में क्या मिला।', 'Tube peeli-bhoori tabhi rehti hai jab uska starch pach gaya ho: iske liye laar, lagbhag 37 °C ka temperature aur kaafi time chahiye. Dekhiye ki har tube ko asal mein kya mila.') }; };
}

// ============================================================================ Hydrilla helpers
function B4sign(K, at) { const it = new K.A.Item('bboard', { name: N('Results', 'नतीजे', 'Results') }); const sp = liveSign(0.05, 4.2); it.g.add(sp); it.sp = sp; it.noGrab = true; it.noPhys = true; it.height = 0.001; it.radius = 0.001; K.add(it, at.x, at.z, { y: at.y }); return it; }
function liveCounter(K, o) {
  const it = new K.A.Item('bcount', { name: N('Bubble count', 'बुलबुलों की गिनती', 'Bubblon ki ginti') }); const sp = liveSign(0.026, 4.4); it.g.add(sp); it.noGrab = true; it.noPhys = true; it.height = 0.001; it.radius = 0.001; K.add(it, o.b.g.position.x, o.b.g.position.z + 0.06, { y: BENCH_Y + 0.27 }); sp.visible = false;
  it.t = 0; it.tick = (dt) => { it.t += dt * (K.app.chem.lapse || 1); const L = K.app.lang; const s = Math.min(60, Math.floor(it.t)); sp.set([{ en: `${s} s · ${o.b.counted} bubbles`, hi: `${s} सेकंड · ${o.b.counted} बुलबुले`, hg: `${s} sec · ${o.b.counted} bubbles` }[L] || `${s} s · ${o.b.counted}`], '#ffe7b0'); };
  it.start = () => { it.t = 0; o.b.counted = 0; o.b.counting = true; sp.visible = true; }; it.hide = () => { sp.visible = false; }; return it;
}
async function count(K, o, tag) {
  o.counter.start(); await K.wait(20, 3); o.b.counting = false; const n = o.b.counted; const d = Math.round(o.dist() * 100);
  o.rows.push(tag === 'off' ? { off: true, n } : { d, n }); o.lastCount = { d, n, off: tag === 'off' };
  const L = K.app.lang; const lines = o.rows.map((r) => (r.off ? { en: `Lamp off: ${r.n} per minute`, hi: `लैंप बंद: ${r.n} प्रति मिनट`, hg: `Lamp band: ${r.n} per minute` }[L] : { en: `${r.d} cm: ${r.n} per minute`, hi: `${r.d} cm: ${r.n} प्रति मिनट`, hg: `${r.d} cm: ${r.n} per minute` }[L]) || '');
  o.board.sp.set(lines.slice(-4), '#e8f4d8'); await K.sleep(0.8); o.counter.hide(); K.lab.emit('counted', { d, n });
}
function countStep(d, text) {
  const cm = Math.round(d * 100); const n = Math.round((1.2 + 46 * Math.min(1.4, Math.pow(0.1 / d, 2))) * 1.6);
  return { do: text, target: 'lamp', act: async (K, o) => { o.lamp.setOn(true); await K.moveTo(o.lamp, V(o.b.g.position.x + 0.045 + d, BENCH_Y + 0.0008, -0.7), null, 0.9); look(o, o.b.g.position.clone().add(V(0.05, 0.12, 0)), V(0.06, 0.08, 0.42)); await count(K, o, 'on'); },
    ev: { type: 'counted' }, until: (K, o) => o.lastCount && !o.lastCount.off && Math.abs(o.lastCount.d - cm) <= 3,
    check: (K, o) => { const r = o.lastCount; if (!r || r.off) return null; if (Math.abs(r.n - n) <= Math.max(3, n * 0.25)) return { ok: true };
      return { ok: false, see: T3(`${r.n} bubbles in one minute at ${r.d} cm.`, `${r.d} सेंटीमीटर पर एक मिनट में ${r.n} बुलबुले।`, `${r.d} cm par ek minute mein ${r.n} bubbles.`),
        why: o.co2 < 1.2 ? T3('No baking soda was added, so the water has less carbon dioxide and the plant photosynthesises more slowly.', 'पानी में खाने का सोडा नहीं डाला गया, इसलिए उसमें कार्बन डाइऑक्साइड कम है और पौधा धीरे प्रकाश संश्लेषण करता है।', 'Paani mein khaane ka soda nahi daala gaya, isliye usmein carbon dioxide kam hai aur paudha dheere photosynthesis karta hai.')
          : T3('The lamp was not at this distance (or was off) while you counted. The nearer and brighter the lamp, the more bubbles.', 'गिनते समय लैंप इस दूरी पर नहीं था (या बंद था)। लैंप जितना पास और तेज़, बुलबुले उतने ज़्यादा।', 'Ginte samay lamp is doori par nahi tha (ya band tha). Lamp jitna paas aur tez, bulbule utne zyada.') }; },
    see: X(`About ${n} bubbles in one minute.`), why: X(cm === 10 ? 'Bubbles stream from the cut ends of the twigs: the plant gives out a gas in light.' : 'Fewer bubbles: the light reaching the plant is weaker when the lamp is farther away.') };
}
async function splintTest(K, o) {
  const t = o.tube; const p0 = t.g.position.clone(); look(o, null);
  await K.tween(1, (k) => { t.g.position.y = p0.y + 0.1 * B.ease(k); }); const up = V(0.3, BENCH_Y + 0.11, -0.56); await K.moveTo(t, up, new THREE.Quaternion(), 1.1); // turned upright: the gas rises to the mouth, under the thumb
  o.b.setUpright(true); o.b.placeTube = () => {}; const mouth = up.clone().add(V(0, 0.15, 0));
  // the splint comes down at a slant, its glowing tip first just above the mouth, then pushed into the gas
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI - 0.3)); const dir = V(0, 1, 0).applyQuaternion(q); const at = (tip) => tip.clone().sub(dir.clone().multiplyScalar(0.152));
  const sp = o.splint; look(o, mouth.clone().add(V(0, 0.01, 0)), V(0.02, 0.05, 0.26));
  await K.moveTo(sp, at(mouth.clone().add(V(0.01, 0.035, 0))), q, 0.9); sp.setGlow(true); await K.sleep(0.8);
  await K.moveTo(sp, at(mouth.clone().add(V(0, -0.015, 0))), q, 0.7);
  if (o.b.gas > 1.5) { sp.setGlow(false); sp.setFlame(true); K.app.audio && K.app.audio.whoosh && K.app.audio.whoosh(); } await K.sleep(2); sp.setFlame(false); sp.setGlow(false); await K.home(sp, 0.8); K.lab.emit('splint', {});
}

// ============================================================================ seeds, raisins, respiration and tropism helpers
async function fridgeIn(K, o, byHand) {
  const fr = o.fr, d = o.d; if (!byHand) { await K.tween(0.6, (k) => fr.setOpen(k)); }
  const at = fr.g.localToWorld(V(0, fr.shelfY + 0.0008, 0)); fr.setOpen(1);
  await K.moveTo(d, at, new THREE.Quaternion(), byHand ? 0.4 : 1.1); d.inFridge = true; keepHome(d); await K.tween(0.6, (k) => fr.setOpen(1 - k)); K.lab.emit('in_fridge', { v: d.id });
}
async function fridgeOut(K, o) { const fr = o.fr, d = o.d; await K.tween(0.6, (k) => fr.setOpen(k)); await K.moveTo(d, V(0.17, BENCH_Y + 0.0008, -0.62), new THREE.Quaternion(), 1.1); d.inFridge = false; keepHome(d); await K.tween(0.5, (k) => fr.setOpen(1 - k)); }
function germCheck(K, o) {
  const spr = (v) => v.seeds.seeds.filter((s) => (s.L || 0) > 0.004).length; const n = { A: spr(o.a), B: spr(o.b), C: spr(o.c), D: spr(o.d) };
  if (n.B >= 6 && n.A === 0 && n.C <= 1 && n.D <= 1) return { ok: true };
  const sp = Object.keys(n).filter((k) => n[k] >= 3); const s = sp.length ? sp.join(', ') : '';
  return { ok: false, see: T3(sp.length ? `Seeds have sprouted in ${s}.` : 'No seeds have sprouted anywhere.', sp.length ? `${s} में बीज अंकुरित हुए हैं।` : 'कहीं भी बीज अंकुरित नहीं हुए।', sp.length ? `${s} mein beej ankurit hue hain.` : 'Kahin bhi beej ankurit nahi hue.'),
    why: T3('Each container got different conditions from the method: seeds sprout only where they have water, air and warmth together. Check which ones got water, which were under water, and which were cold.', 'हर बर्तन को विधि से अलग हालात मिले: बीज वहीं अंकुरित होते हैं जहाँ उन्हें पानी, हवा और गरमी, तीनों एक साथ मिलें। देखिए किसे पानी मिला, कौन पानी में डूबा था, और कौन ठंड में था।', 'Har bartan ko method se alag halaat mile: beej wahin ankurit hote hain jahan unhe paani, hawa aur garmi, teeno ek saath milein. Dekhiye kise paani mila, kaun paani mein dooba tha, aur kaun thand mein tha.') };
}
async function raisinsInto(K, r, v, dur = 1) {
  const m = v.mouthWorld(V(0, 0, 0)); if (r.in) { K.app.scene.attach(r.g); r.in = null; }
  await K.moveTo(r, m.clone().add(V(0, 0.05, 0)), null, dur); const bot = v.g.localToWorld(V(0, v.inner[0].y + 0.001, 0)); const p0 = r.g.position.clone(); await K.tween(0.8, (k) => r.g.position.lerpVectors(p0, bot, k * k));
  v.g.attach(r.g); r.in = v; r.home = null; const o = K.app.runner && K.app.runner.o; if (o && o.S && r === o.rA && v === o.wB) o.movedAt = o.S.hours; K.lab.emit('raisins_in', { obj: r.id, in: v.id });
}
function raisinCheck(stage) {
  return (K, o) => { const a = o.rA.k, b = o.rB.k; if (stage === 1) { if (a > 0.6 && b < 0.3) return { ok: true }; return { ok: false, see: T3(`Raisins from beaker A: ${a > 0.6 ? 'swollen' : 'still wrinkled'}; from beaker B: ${b > 0.3 ? 'swollen' : 'wrinkled'}.`, `बीकर A की किशमिश: ${a > 0.6 ? 'फूली हुई' : 'अब भी सिकुड़ी हुई'}; बीकर B की: ${b > 0.3 ? 'फूली हुई' : 'सिकुड़ी हुई'}।`, `Beaker A ki kishmish: ${a > 0.6 ? 'phooli hui' : 'ab bhi sikudi hui'}; beaker B ki: ${b > 0.3 ? 'phooli hui' : 'sikudi hui'}.`),
      why: T3('Raisins swell only if they lie long enough in a solution weaker than their own juice, such as plain water.', 'किशमिश तभी फूलती है जब वह अपने रस से पतले घोल, जैसे सादे पानी, में काफ़ी देर पड़ी रहे।', 'Kishmish tabhi phoolti hai jab wo apne ras se patle ghol, jaise saade paani, mein kaafi der padi rahe.') }; }
    if (a < 0.35) return { ok: true }; return { ok: false, see: T3('The raisins moved from water are still swollen.', 'पानी से निकाली गई किशमिश अब भी फूली हुई है।', 'Paani se nikaali gayi kishmish ab bhi phooli hui hai.'), why: T3('They must lie in the strong sugar solution for some hours to lose water.', 'पानी निकलने के लिए उन्हें कुछ घंटे गाढ़े चीनी के घोल में रहना होगा।', 'Paani nikalne ke liye unhe kuch ghante gaadhe cheeni ke ghol mein rehna hoga.') }; };
}
async function hangKoh(K, o, f, dur = 1) {
  const m = f.mouthWorld(V(0, 0, 0)); await K.moveTo(o.koh, m.clone().add(V(0, 0.06, 0)), new THREE.Quaternion(), dur); const at = f.g.localToWorld(V(0, f.rimY - 0.075, 0)); const p0 = o.koh.g.position.clone(); await K.tween(0.7, (k) => o.koh.g.position.lerpVectors(p0, at, B.ease(k)));
  f.g.attach(o.koh.g); f.kohIn = true; o.koh.noGrab = true;
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.0003, 0.0003, 0.012, 4), B.M(0xe8e2d0, 0.8)); th.position.y = 0.06 + 0.006; o.koh.g.add(th); K.lab.emit('koh_in', { v: f.id });
}
function co2Check(K, o) { const a = o.ta ? o.ta.rise : 0, b = o.tb ? o.tb.rise : 0; if (a > 0.03 && b < 0.01) return { ok: true };
  return { ok: false, see: T3(`Rise in tube A: ${Math.round(a * 100)} cm; in tube B: ${Math.round(b * 100)} cm.`, `ट्यूब A में पानी ${Math.round(a * 100)} सेंटीमीटर चढ़ा; ट्यूब B में ${Math.round(b * 100)} सेंटीमीटर।`, `Tube A mein paani ${Math.round(a * 100)} cm chadha; tube B mein ${Math.round(b * 100)} cm.`),
    why: T3(!o.fa.kohIn && !o.fb.kohIn ? 'Neither flask has potassium hydroxide: the carbon dioxide given out replaces the oxygen used, so the gas inside does not shrink.' : 'The water rises only in the flask that has potassium hydroxide to take up the carbon dioxide, and only after enough time.', !o.fa.kohIn && !o.fb.kohIn ? 'किसी फ़्लास्क में पोटैशियम हाइड्रॉक्साइड नहीं है: जितनी ऑक्सीजन ली गई, उतनी ही कार्बन डाइऑक्साइड निकलकर उसकी जगह भर देती है, इसलिए अंदर की गैस कम नहीं होती।' : 'पानी सिर्फ़ उसी फ़्लास्क की नली में चढ़ता है जिसमें कार्बन डाइऑक्साइड सोखने के लिए पोटैशियम हाइड्रॉक्साइड हो, और वह भी काफ़ी समय बाद।', !o.fa.kohIn && !o.fb.kohIn ? 'Kisi flask mein KOH nahi hai: jitni oxygen li gayi, utni hi carbon dioxide nikalkar uski jagah bhar deti hai, isliye andar ki gas kam nahi hoti.' : 'Paani sirf usi flask ki nali mein chadhta hai jismein CO₂ sokhne ke liye KOH ho, aur wo bhi kaafi time baad.') }; }
function tropCheck(stage) {
  return (K, o) => { const toL = o.f.bend(o.lightDir.clone().setY(0).normalize()); const down = o.f.rootDown();
    if (toL > 0.3 && down > 0.7) return { ok: true };
    if (!o.box.inside(o.f.g.position) && toL < 0.2) return { ok: false, see: T3('The shoots grow straight up; they do not bend.', 'तने सीधे ऊपर बढ़ रहे हैं; मुड़े नहीं।', 'Tane seedhe upar badh rahe hain; mude nahi.'), why: T3('Outside the box the light comes from all round, so there is no one side for the shoots to bend to.', 'डिब्बे के बाहर रोशनी चारों ओर से आती है, इसलिए तनों के मुड़ने के लिए कोई एक तरफ़ नहीं है।', 'Dibbe ke bahar roshni chaaron or se aati hai, isliye tanon ke mudne ke liye koi ek taraf nahi hai.') };
    return { ok: false, see: T3('The shoots have not yet bent towards the light.', 'तने अभी रोशनी की तरफ़ नहीं मुड़े।', 'Tane abhi roshni ki taraf nahi mude.'), why: T3('Bending needs growth: give the seedlings more time in one-sided light.', 'मुड़ने के लिए बढ़ना ज़रूरी है: पौधों को एक तरफ़ की रोशनी में और समय दीजिए।', 'Mudne ke liye badhna zaroori hai: paudhon ko ek taraf ki roshni mein aur time dijiye.') }; };
}

export const EXPERIMENTS_BIO2 = [
  // ============================================================================ Class 7 · Ch 10 · Life Processes in Plants
  {
    id: 'bio7_leaf_light', subj: 'biology', cls: 7, also: [10], ch: C7P, topic: 'plants',
    title: X('Do leaves need light to make starch?'),
    aim: X('To destarch a potted plant in the dark, cover part of one leaf with black paper, keep the plant in sunlight and test the leaf for starch with iodine.'),
    kind: X('Photosynthesis: light is needed'),
    setup(K) { const o = leafBench(K, { paper: true }); paperByHand(K, o); return o; },
    steps: leafSteps([
      ...L.dark(48, X('Leave it in the dark for two days: slide the clock on 48 hours.'), X('Two days pass. Nothing seems to change.'), X('In the dark the plant cannot make food. It uses up the starch already in its leaves. Such a plant is called destarched.')),
      { do: X('Take the plant out and clip a strip of black paper across the middle of one leaf, on both sides.'), target: 'paper', act: async (K, o) => { if (o.where === 'box') await plantTo(K, o, 'bench'); look(o, o.plant.leafWorld(o.plant.testLeaf, 0.5), V(0.06, 0.16, 0.24)); await paperOn(K, o); await K.sleep(1.5); }, ev: { type: 'paper_on' },
        see: X('The middle of the leaf is covered on both sides; its base and tip are open to light.'), why: X('The covered part gets no light. The rest of the same leaf is the comparison.') },
      ...L.sun(0, 6, X('Leave it in the sunlight for six hours: slide the clock on.'), X('Six hours of bright sunlight. The leaf looks just the same.'), X('Starch cannot be seen; we must test for it.')),
      L.boil(), L.alcohol(), L.decolour(), L.rinse(),
      L.iodine(X('The parts that were in the light turn blue-black. The band that was under the black paper stays brown-yellow, the colour of iodine.'), X('Starch turns blue-black with iodine. Starch was made only where light fell on the leaf: light is needed for photosynthesis.'), 'light'),
    ]),
    eq: { word: 'carbon dioxide + water → glucose (→ starch) + oxygen, in light, with chlorophyll', sym: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
    result: { obs: X('After destarching and six hours of sunlight, the uncovered parts of the leaf turned blue-black with iodine; the part under black paper did not.'),
      concl: X('Leaves make starch (food) only in the parts that get light. Sunlight is necessary for photosynthesis.'),
      safety: X('Never heat alcohol directly on a flame: it catches fire. Heat it only in a hot water bath, and keep the burner away.'),
      viva: [{ q: X('Why is the plant kept in the dark for two days first?'), a: X('To use up the starch already in its leaves (to destarch it).') }, { q: X('Why is the leaf boiled in alcohol?'), a: X('To remove the chlorophyll, so the colour of iodine can be seen.') }, { q: X('What colour does starch give with iodine?'), a: X('Blue-black.') }] },
  },
  {
    id: 'bio10_variegated_leaf', subj: 'biology', cls: 10, ch: C10L, topic: 'plants',
    title: X('Is chlorophyll needed to make starch? A variegated leaf'),
    aim: X('To destarch a plant with green-and-white leaves, keep it in sunlight, and see with iodine which parts of a leaf made starch.'),
    kind: X('Photosynthesis: chlorophyll is needed'),
    setup(K) { return leafBench(K, { kind: 'ovate', max: 84, labels: [[0, '0 h'], [0.286, '24 h'], [0.571, '48 h'], [0.857, '72 h']] }); },
    steps: [
      ...L.dark(72, X('Leave it in the dark for three days: slide the clock on 72 hours.'), X('Three days pass in the dark.'), X('In the dark the leaves use up the starch they had. Now any starch found later must be new.')),
      ...L.sun(0, 6, X('Leave it in the sunlight for six hours: slide the clock on.'), X('Six hours of sunlight on the green and white leaves.'), X('Light falls on every part of the leaf, the white parts too.')),
      { do: X('Look closely at the test leaf and note where it is green and where it is white.'), target: 'plant', act: async (K, o) => { look(o, o.plant.leafWorld(o.plant.testLeaf, 0.5), V(0.02, 0.15, 0.17)); K.lab.emit('look', {}); await K.sleep(2.5); }, ev: { type: 'look' },
        see: X('The leaf has a creamy-white border and some white patches; the rest is green.'), why: X('The white parts have no chlorophyll. Draw the pattern, so you can compare it after the test.') },
      L.boil(), L.alcohol(), L.decolour(), L.rinse(),
      L.iodine(X('Only the parts that were green turn blue-black. The white border and patches stay brownish-yellow.'), X('Starch was made only where there was chlorophyll. Chlorophyll is needed for photosynthesis.'), 'chl'),
    ],
    eq: { word: 'carbon dioxide + water → glucose + oxygen (in sunlight, only where there is chlorophyll)', sym: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
    result: { obs: X('After destarching and sunlight, iodine turned only the green parts of the leaf blue-black; the white parts did not change.'),
      concl: X('Chlorophyll is necessary for photosynthesis: only the green parts of a leaf make starch.'),
      safety: X('Heat alcohol only in a water bath, never on a naked flame. Iodine stains skin and clothes.'),
      viva: [{ q: X('Why do the white parts not turn blue-black?'), a: X('They have no chlorophyll, so they cannot make starch.') }, { q: X('Why is the plant kept in the dark for three days?'), a: X('To destarch it, so that any starch found is newly made.') }, { q: X('Name a plant with variegated leaves.'), a: X('Croton, or a variegated money plant.') }] },
  },
  {
    id: 'bio7_moll_leaf', subj: 'biology', cls: 7, also: [10], ch: C7P, topic: 'plants',
    title: X('Is carbon dioxide needed? Half a leaf in a bottle of potassium hydroxide'),
    aim: X('To pass half of a leaf of a destarched plant into a bottle with potassium hydroxide, which takes up carbon dioxide, keep it in sunlight and test the leaf for starch.'),
    kind: X('Photosynthesis: carbon dioxide is needed (Moll’s half-leaf experiment)'),
    setup(K) { const o = leafBench(K, { moll: true, rate: (o2, u, v) => (o2.mollOn && v > 0.5 ? 0.02 : 1) }); return o; },
    steps: [
      ...L.dark(48, X('Leave it in the dark for two days: slide the clock on 48 hours.'), X('Two days in the dark: the plant is destarched.'), X('The leaves used up their old starch.')),
      { do: X('Take the plant out. Pass the tip half of one leaf into the bottle through a split cork, without touching the potassium hydroxide, and seal the cork with Vaseline.'), target: 'moll',
        act: async (K, o) => { if (o.where === 'box') await plantTo(K, o, 'bench'); await mollOn(K, o); look(o, o.moll.g.getWorldPosition(V(0, 0, 0)), V(0.16, 0.14, 0.18)); await K.sleep(1.5); }, ev: { type: 'moll_on' },
        see: X('Half the leaf is inside the airtight bottle, half outside in the air.'), why: X('Potassium hydroxide takes up all the carbon dioxide from the air inside the bottle.') },
      ...L.sun(0, 6, X('Put the plant with the bottle in sunlight for six hours: slide the clock on.'), X('Both halves of the leaf get the same sunlight.'), X('The only difference between the two halves is the carbon dioxide.')),
      L.boil(), L.alcohol(), L.decolour(), L.rinse(),
      L.iodine(X('The half that was outside the bottle turns blue-black. The half inside the bottle stays brownish-yellow.'), X('Without carbon dioxide no starch was made. Carbon dioxide is needed for photosynthesis.'), 'co2'),
    ],
    eq: { word: 'carbon dioxide + water → glucose + oxygen; KOH removes CO₂ (2KOH + CO₂ → K₂CO₃ + H₂O)', sym: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' },
    result: { obs: X('Iodine turned the part of the leaf outside the bottle blue-black; the part inside the bottle, with no carbon dioxide, stayed brownish-yellow.'),
      concl: X('Carbon dioxide is necessary for photosynthesis.'),
      safety: X('Potassium hydroxide is caustic: do not touch it. Heat alcohol only in a water bath.'),
      viva: [{ q: X('What does potassium hydroxide do here?'), a: X('It absorbs the carbon dioxide inside the bottle.') }, { q: X('Why is the cork sealed with Vaseline?'), a: X('To make it airtight, so that air with carbon dioxide cannot get in.') }, { q: X('Which part of the leaf was the control?'), a: X('The half outside the bottle.') }] },
  },
  // ---------------------------------------------------------------------------- transpiration: a polythene bag over a shoot
  {
    id: 'bio10_transpiration', subj: 'biology', cls: 10, also: [7], ch: C10L, topic: 'plants',
    title: X('Plants give out water vapour: a polythene bag over a shoot'),
    aim: X('To cover a leafy shoot and a shoot without leaves with polythene bags, keep them in sunlight and see which bag collects water.'),
    kind: X('Transpiration'),
    setup(K) {
      const app = K.app; const o = {};
      o.a = K.add(B.pottedPlant({ seed: 21, h: 0.19, pairs: 6, flowers: 1, name: N('Plant A (with leaves)', 'पौधा A (पत्तियों वाला)', 'Paudha A (pattiyon wala)') }), -0.32, -0.62); keepHome(o.a);
      o.b = K.add(B.pottedPlant({ seed: 23, h: 0.19, pairs: 6, flowers: 0, branches: 1, name: N('Plant B (its leaves cut off)', 'पौधा B (इसकी पत्तियाँ काट दी गईं)', 'Paudha B (iski pattiyan kaat di gayin)') }), 0.02, -0.62); keepHome(o.b); o.b.removeLeaves();
      for (const [p, t] of [[o.a, 'A'], [o.b, 'B']]) { const c = K.add(B.card(t), p.g.position.x, -0.54); c.noGrab = true; p.g.attach(c.g); } // the label card goes where its pot goes
      o.sun = K.add(B.sunPatch({ w: 0.5, d: 0.32 }), -0.78, -0.72);
      o.bagA = K.add(B2.polyBag({ seed: 3, r: 0.085, h: 0.24 }), 0.3, -0.5); o.bagB = K.add(B2.polyBag({ seed: 7, r: 0.085, h: 0.24 }), 0.48, -0.5); for (const b of [o.bagA, o.bagB]) { b.g.scale.setScalar(0.45); keepHome(b); }
      o.S = B.timeSlider(app, { max: 6, ticks: 6, labels: [[0, '0 h'], [0.5, '3 h'], [1, '6 h']] }); o.S.place(0.25, -0.38); o.knob = o.S.knob;
      o.mist = { a: 0, b: 0 }; o.place = { a: 'bench', b: 'bench' };
      o.S.onHours = (h, dh) => { for (const k of ['a', 'b']) { const bag = k === 'a' ? o.bagA : o.bagB; if (!bag.on) continue; const L = o.place[k] === 'sun' ? 1 : 0.15; const rate = (k === 'a' ? 0.4 : 0.02) * L; o.mist[k] = Math.min(1.2, o.mist[k] + dh * rate); bag.setMist(Math.min(1, o.mist[k])); } };
      for (const [k, p] of [['a', o.a], ['b', o.b]]) { p.noGrab = false; p.dragLift = 0.04; p.onRelease = () => { p.g.position.y = BENCH_Y + 0.0008; p.g.quaternion.identity(); o.place[k] = o.sun.inside(p.g.position) ? 'sun' : 'bench'; keepHome(p); K.lab.emit('placed', { obj: p.id }); }; }
      for (const [k, bag, p] of [['a', o.bagA, o.a], ['b', o.bagB, o.b]]) bag.onRelease = () => { if (bag.on) return; if (bag.g.position.distanceTo(p.g.position.clone().setY(bag.g.position.y)) < 0.12) bagOn(K, o, k); else { bag.g.position.y = BENCH_Y + 0.001; keepHome(bag); } };
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Water both plants. Then slip a polythene bag over the leafy shoot of plant A and tie it round the stem.'), target: 'bagA', act: (K, o) => bagOn(K, o, 'a'), ev: { type: 'bag_on', v: 'bagA' },
        see: X('The bag covers all the leaves of plant A. It is clear and dry inside.'), why: X('Tying the bag round the stem keeps the water from the soil out: only water from the shoot can get in.') },
      { do: X('Do the same for plant B, whose leaves have been cut off.'), target: 'bagB', act: (K, o) => bagOn(K, o, 'b'), ev: { type: 'bag_on', v: 'bagB' },
        see: X('The bag over plant B covers only a bare stem.'), why: X('Plant B is the control: the same in every way except for the leaves.') },
      { do: X('Put both plants in the sunlight.'), target: 'a', act: async (K, o) => { for (const [k, p, dx] of [['a', o.a, -0.1], ['b', o.b, 0.1]]) { await K.moveTo(p, V(o.sun.g.position.x + dx, BENCH_Y + 0.0008, o.sun.g.position.z), new THREE.Quaternion(), 1.1); o.place[k] = 'sun'; keepHome(p); } K.lab.emit('placed', { obj: o.b.id }); }, ev: { type: 'placed' }, until: (K, o) => o.place.a === 'sun' && o.place.b === 'sun',
        see: X('Both plants stand in bright sunlight.') },
      { do: X('Leave them for three hours: slide the clock on.'), target: 'knob', act: (K, o) => o.S.to(K, 3, 5), ev: { type: 'time' }, until: (K, o) => o.S.hours >= 2.9,
        see: X('The inside of bag A becomes misty.'), why: X('Water vapour comes out of the leaves and condenses on the cooler bag.') },
      { do: X('Look closely at the inside of both bags.'), target: 'bagA', act: async (K, o) => { look(o, o.a.g.position.clone().add(V(0.1, 0.2, 0)), V(0.04, 0.12, 0.62)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: transCheck,
        see: X('Bag A is covered with drops of water inside. Bag B is almost dry.'), why: X('Plants lose water as vapour, mostly through the stomata of their leaves. This is transpiration.') },
    ],
    eq: { word: 'water from the roots → up the xylem → out of the stomata as water vapour', sym: 'H₂O(l) → H₂O(g)' },
    result: { obs: X('After three hours in sunlight, drops of water collected inside the bag over the leafy shoot; the bag over the leafless shoot stayed almost dry.'),
      concl: X('Plants give out water vapour from their leaves. This loss of water is called transpiration.'), safety: X('Do not leave the bags on for days: the leaves need air.'),
      viva: [{ q: X('Through which openings does a leaf lose water?'), a: X('Through the stomata.') }, { q: X('Why was the bag tied round the stem and not over the pot?'), a: X('So that water evaporating from the soil does not get into the bag.') }, { q: X('Name one use of transpiration to the plant.'), a: X('It pulls water up from the roots, and it cools the leaves.') }] },
  },
  // ---------------------------------------------------------------------------- water moves up the xylem: a white flower in red ink
  {
    id: 'bio7_xylem_ink', subj: 'biology', cls: 7, also: [10], ch: C7P, topic: 'plants',
    title: X('Water climbs the stem: a white sadabahar twig in red ink'),
    aim: X('To stand a twig of white sadabahar in red-coloured water and follow the colour up the stem into its leaves and flowers, then cut across the stem.'),
    kind: X('Transport of water in plants (xylem)'),
    setup(K) {
      const app = K.app; const o = {};
      o.glass = K.beaker(-0.2, -0.66, 'water', 100, 250); o.glass.name = N('Tumbler of water', 'पानी का गिलास', 'Paani ka gilaas');
      o.ink = K.bottle('redink', -0.42, -0.62, { ml: 40 }); o.ink.name = N('Red ink (safranin)', 'लाल स्याही (सैफ्रानिन)', 'Laal syahi (safranin)');
      // the twig waits in a beaker of plain water until it is moved into the red water
      o.wait = K.beaker(0.14, -0.66, 'water', 100, 250); o.wait.name = N('Beaker of plain water (the twig waits in it)', 'सादे पानी का बीकर (टहनी इसमें रखी है)', 'Saade paani ka beaker (tehni ismein rakhi hai)');
      o.twig = K.add(B.pottedPlant({ seed: 33, noPot: true, white: true, h: 0.24, pairs: 5, k0: 0.4, flowers: 2, branches: 1, name: N('Twig of white sadabahar', 'सफ़ेद सदाबहार की टहनी', 'Safed sadabahar ki tehni') }), 0.14, -0.66, { y: BENCH_Y + o.wait.inner[0].y + 0.002 });
      o.twig.g.rotation.set(0, -0.5, -0.08); keepHome(o.twig); o.twig.noPhys = true; o.twig.noGrab = false;
      o.twig.onRelease = () => { const p = o.twig.g.position; const m = o.glass.g.position; if (Math.hypot(p.x - m.x, p.z - m.z) < 0.06) twigIn(K, o); else { K.home(o.twig, 0.4); } };
      o.inkMat = B2.inkLeafMat(o.twig.mat); for (const l of o.twig.leaves) { if (!l.skin) { l.mesh.material = o.inkMat; l.mesh.customDepthMaterial = o.inkMat.userData.depth; } }
      o.white = B.whiteFlowers(); o.white.userData.red.value = 0;
      o.S = B.timeSlider(app, { max: 30, ticks: 6, labels: [[0, '0 h'], [0.4, '12 h'], [0.8, '24 h']] }); o.S.place(-0.1, -0.38); o.knob = o.S.knob;
      o.up = 0; o.S.onHours = (h, dh) => { if (!o.twig.inWater) return; const m = o.glass.mix; const inkF = (m.liq.redink || 0) / Math.max(1, m.ml()); const k = Math.min(1, inkF / 0.06); o.up = Math.min(1, o.up + dh / 20 * k * (0.4 + 0.6 * Math.min(1, inkF * 20))); const v = o.up;
        o.inkMat.userData.ink.value = B.smooth(0.2, 1, v) * Math.min(1, inkF * 12); o.white.userData.red.value = B.smooth(0.45, 1, v) * Math.min(1, inkF * 12); o.redK = v * Math.min(1, inkF * 12); };
      o.blade = K.add(B2.blade(), 0.3, -0.48); keepHome(o.blade); o.slide = K.add(K.A3.glassSlide(), 0.36, -0.6); o.lens = K.add(B.lens(), 0.5, -0.56); keepHome(o.lens);
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Pour about 10 mL of red ink into the tumbler of water.'), target: 'ink', act: (K, o) => K.pour(o.ink, o.glass, 10), ev: { type: 'pour', from: 'ink', to: 'glass', ml: 8 },
        see: X('The water turns deep red.') },
      { do: X('Cut the base of the twig slantwise under water, and stand the twig in the red water.'), target: 'twig', act: (K, o) => twigIn(K, o), ev: { type: 'twig_in' },
        see: X('The twig stands in the red water; its flowers are white.'), why: X('A slanting cut under water gives a large surface and keeps air bubbles out of the stem.') },
      { do: X('Leave it for a day: slide the clock on 24 hours.'), target: 'knob', act: (K, o) => o.S.to(K, 24, 5), ev: { type: 'time' }, until: (K, o) => o.S.hours >= 23,
        see: X('Slowly, red lines appear in the petals and the veins of the leaves.'), why: X('The red water has climbed up the stem and spread into the leaves and flowers.') },
      { do: X('Look closely at a flower and a leaf.'), target: 'twig', act: async (K, o) => { look(o, o.twig.g.position.clone().add(V(0, 0.21, 0)), V(0.05, 0.15, 0.2)); /* from above: the open flowers face up */ K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: inkCheck,
        see: X('The white petals have turned pink-red, darkest along their veins, and the leaf veins are red too.'), why: X('Water travels through narrow tubes, the xylem, from the stem into the veins of every leaf and petal.') },
      { do: X('Take the twig out, cut a thin slice across its stem with a blade and look at the slice through the magnifying glass.'), target: 'blade', act: (K, o) => cutSection(K, o), ev: { type: 'section' },
        see: X('A ring of red dots near the edge of the slice; the centre is pale.'), why: X('Each red dot is a bundle of xylem tubes that carried the red water. In a dicot stem they lie in a ring.') },
    ],
    eq: { word: 'roots → xylem in the stem → veins of leaves and petals', sym: 'water + dye rise together' },
    result: { obs: X('After a day in red water the white petals and the leaf veins turned red, and a slice of the stem showed a ring of red dots.'),
      concl: X('Water moves up a plant through the xylem tubes of the stem to the leaves and flowers.'), safety: X('Handle the blade carefully; cut away from your fingers.'),
      viva: [{ q: X('Which tissue carries water up the stem?'), a: X('Xylem.') }, { q: X('Why is the stem cut under water?'), a: X('So that air bubbles do not block the xylem tubes.') }, { q: X('How are the red dots arranged in the slice?'), a: X('In a ring.') }] },
  },
  // ---------------------------------------------------------------------------- what a plant needs: light and water
  {
    id: 'bio7_growth_needs', subj: 'biology', cls: 7, ch: C7P, topic: 'plants',
    title: X('What does a plant need to stay healthy? Light and water'),
    aim: X('To grow three saplings for two weeks, one with sunlight and water, one without water, one without light, and compare them.'),
    kind: X('Needs of plants: light and water'),
    setup(K) {
      const app = K.app; const o = {}; const mk = (seed, x, t) => { const p = K.add(B.pottedPlant({ seed, h: 0.13, pairs: 5, branches: 1, flowers: 0, potH: 0.085, leafK: 0.8, name: N(`Sapling ${t}`, `पौधा ${t}`, `Paudha ${t}`) }), x, -0.62); keepHome(p); p.noGrab = false; p.dragLift = 0.04; const cd = K.add(B.card(t), x, -0.545); cd.noGrab = true; p.g.attach(cd.g); return p; }; // the label card goes where its pot goes
      o.a = mk(41, -0.05, 'A'); o.b = mk(42, 0.12, 'B'); o.c = mk(43, 0.29, 'C');
      o.sun = K.add(B.sunPatch({ w: 0.52, d: 0.34 }), -0.84, -0.72); o.box = K.add(B.darkBox({ w: 0.24, d: 0.22, h: 0.29 }), 0.62, -0.82); o.box.setOpen(1);
      o.jug = K.beaker(0.45, -0.5, 'water', 220, 250); o.jug.name = N('Beaker of water', 'पानी का बीकर', 'Paani ka beaker');
      o.S = B.timeSlider(app, { max: 336, ticks: 14, labels: [[0, '0'], [0.5, '7 d'], [1, '14 d']], fmt: (h, L) => ({ en: `Day ${Math.floor(h / 24)}`, hi: `${Math.floor(h / 24)}वाँ दिन`, hg: `Din ${Math.floor(h / 24)}` }[L] || `Day ${Math.floor(h / 24)}`) }); o.S.place(-0.48, -0.4); o.knob = o.S.knob;
      o.where = new Map(); o.wat = new Map(); for (const p of [o.a, o.b, o.c]) { o.where.set(p, 'bench'); o.wat.set(p, 0); p.life = { thirst: 0, dark: 0, grow: 0 }; p.onWater = (ml) => { if (ml > 25 && !o.wat.get(p)) { o.wat.set(p, 1); K.lab.emit('watered', { obj: p.id }); } }; }
      const whereOf = (p) => (o.box.inside(p.g.position) ? 'box' : o.sun.inside(p.g.position) ? 'sun' : 'bench');
      for (const p of [o.a, o.b, o.c]) p.onRelease = () => { p.g.position.y = BENCH_Y + 0.0008; p.g.quaternion.identity(); o.where.set(p, whereOf(p)); if (o.where.get(p) === 'box') { p.g.position.x = o.box.g.position.x; p.g.position.z = o.box.g.position.z; } keepHome(p); K.lab.emit('placed', { obj: p.id }); };
      // every day each plant gets what it got on the first day: its water and the light where it stands
      o.S.onHours = (h, dh) => { for (const p of [o.a, o.b, o.c]) { const L = o.where.get(p) === 'sun' ? 1 : o.where.get(p) === 'box' ? 0 : 0.12; const W = o.wat.get(p) > 0;
        if (!W) p.life.thirst += dh / 24; else p.life.thirst = Math.max(0, p.life.thirst - dh / 12); if (L < 0.05) p.life.dark += dh / 24; if (W && L > 0.5) p.life.grow += dh / 24;
        const wilt = B.smooth(2, 4.5, p.life.thirst), dry = B.smooth(5, 9, p.life.thirst), pale = B.smooth(1.5, 9, p.life.dark), grow = B.smooth(0, 14, p.life.grow) * 0.9 + (W && L < 0.05 ? 0 : 0);
        p.setLook({ wilt, dry, pale: W ? pale : pale * 0.6, grow }); } };
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Put saplings A and B in the sunlight, and sapling C inside the dark box.'), target: 'c', act: async (K, o) => { for (const [p, dx] of [[o.a, -0.09], [o.b, 0.09]]) { await K.moveTo(p, V(o.sun.g.position.x + dx, BENCH_Y + 0.0008, o.sun.g.position.z), new THREE.Quaternion(), 1); o.where.set(p, 'sun'); keepHome(p); }
          await K.moveTo(o.c, V(o.box.g.position.x, BENCH_Y + 0.0008, o.box.g.position.z), new THREE.Quaternion(), 1.1); o.where.set(o.c, 'box'); keepHome(o.c); await K.tween(0.5, (k) => o.box.setOpen(1 - k)); K.lab.emit('placed', { obj: o.c.id }); },
        ev: { type: 'placed' }, until: (K, o) => o.where.get(o.a) === 'sun' && o.where.get(o.b) === 'sun' && o.where.get(o.c) === 'box', see: X('A and B stand in the sunlight; C is in the dark.') },
      { do: X('Give A and C 50 mL of water each. Give B no water.'), target: 'jug', act: async (K, o) => { for (const p of [o.a, o.c]) { await waterPot(K, o, p); } }, ev: { type: 'watered' }, until: (K, o) => o.wat.get(o.a) > 0 && o.wat.get(o.c) > 0,
        see: X('The soil of A and C is wet; B stays dry.'), why: X('A gets both light and water: it is the control.') },
      { do: X('Do the same every day for two weeks: slide the clock on 14 days.'), target: 'knob', act: async (K, o) => { if (o.where.get(o.c) === 'box') o.box.setOpen(0); await o.S.to(K, 336, 7); }, ev: { type: 'time' }, until: (K, o) => o.S.hours >= 330,
        see: X('Two weeks pass.') },
      { do: X('Take C out of the box and compare the three saplings.'), target: 'c', act: async (K, o) => { if (o.where.get(o.c) === 'box') { await K.tween(0.5, (k) => o.box.setOpen(k)); await K.moveTo(o.c, V(o.sun.g.position.x + 0.27, BENCH_Y + 0.0008, o.sun.g.position.z + 0.02), new THREE.Quaternion(), 1.2); o.where.set(o.c, 'bench'); keepHome(o.c); }
          look(o, V(o.sun.g.position.x + 0.09, BENCH_Y + 0.1, o.sun.g.position.z), V(0.02, 0.2, 0.62)); /* the three side by side */ K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: growthCheck,
        see: X('A is green, healthy and taller. B has wilted, its leaves dry and yellow-brown. C is tall and thin with small pale yellow leaves.'), why: X('A plant needs water and sunlight. Without water it wilts and dies; without light it cannot make food or chlorophyll, so it grows thin and pale.') },
    ],
    eq: { word: 'sunlight + water (+ carbon dioxide) → food → healthy growth', sym: '—' },
    result: { obs: X('With sunlight and water, sapling A grew green and tall. Without water, B wilted and dried. Without light, C grew long, thin and pale.'),
      concl: X('Plants need both water and sunlight to make food and stay healthy.'), safety: X('Water plants gently; do not flood the pot.'),
      viva: [{ q: X('Why did C turn pale yellow?'), a: X('Without light it could not make chlorophyll or food.') }, { q: X('Which sapling was the control?'), a: X('A, which got both sunlight and water.') }, { q: X('Why did B wilt?'), a: X('Without water its cells lost their firmness and the leaves drooped.') }] },
  },
  // ============================================================================ Class 6 · Ch 3 · Mindful Eating: tests for starch, fat and protein
  {
    id: 'bio6_starch_test', subj: 'biology', cls: 6, ch: C6F, topic: 'food',
    title: X('Which foods have starch? The iodine test'),
    aim: X('To put a few drops of dilute iodine solution on five foods and find out from the colour which of them contain starch.'),
    kind: X('Test for starch'),
    setup(K) {
      const o = {}; o.tile = K.add(K.A4.whiteTile(0.4, 0.1), 0.0, -0.66); const ks = ['potato', 'rice', 'bread', 'apple', 'cucumber'];
      ks.forEach((k, i) => { o[k] = K.add(B2.foodSample(k), -0.16 + i * 0.08, -0.66, { y: BENCH_Y + 0.006 }); });
      o.iod = K.bottle('iodine', 0.3, -0.56, { dropper: true }); o.iod.name = N('Dilute iodine solution', 'पतला आयोडीन घोल', 'Patla iodine ghol');
      o.cam = camAnchor(K); return o;
    },
    steps: ['potato', 'rice', 'bread', 'apple', 'cucumber'].map((k) => ({
      do: X({ potato: 'Put two or three drops of dilute iodine solution on the slice of raw potato.', rice: 'Now put two or three drops on the boiled rice.', bread: 'Put a few drops on the piece of bread.', apple: 'Put a few drops on the apple slice.', cucumber: 'Put a few drops on the cucumber slice.' }[k]),
      target: k, act: async (K, o) => { look(o, o[k].g.position.clone(), V(0.0, 0.15, 0.16)); await K.drops(o.iod, o[k], 3); await K.sleep(1.2); if (k === 'cucumber') { await K.sleep(0.6); look(o, o.tile.g.position.clone(), V(0.0, 0.26, 0.3)); } }, /* after the last food: all five side by side */ ev: { type: 'drops', from: 'iod', to: k }, check: foodCheck(k),
      see: X({ potato: 'The brown iodine turns blue-black on the potato.', rice: 'The rice grains turn blue-black.', bread: 'The bread turns blue-black.', apple: 'The iodine stays yellowish-brown on the apple (perhaps a faint dark tinge).', cucumber: 'The iodine stays yellowish-brown on the cucumber.' }[k]),
      why: X({ potato: 'A blue-black colour means starch is present. Potato stores a lot of starch.', rice: 'Rice is mostly starch, a carbohydrate that gives us energy.', bread: 'Bread is made from wheat flour, which is rich in starch.', apple: 'A ripe apple has turned almost all its starch into sugar, so there is little or no starch.', cucumber: 'Cucumber is mostly water; it has no starch.' }[k]),
    })),
    eq: { word: 'starch + iodine (brown) → blue-black', sym: 'no starch: iodine stays yellowish-brown' },
    result: { obs: X('Iodine turned blue-black on potato, boiled rice and bread; it stayed yellowish-brown on apple and cucumber.'),
      concl: X('Potato, rice and bread contain starch; ripe apple has very little and cucumber has none. Starch is a carbohydrate, an energy-giving nutrient.'),
      safety: X('Iodine stains skin and clothes and is not to be tasted. Do not eat food used in the lab.'),
      viva: [{ q: X('What colour does iodine give with starch?'), a: X('Blue-black.') }, { q: X('Name two foods rich in starch.'), a: X('Potato and rice (also wheat, bread).') }, { q: X('To which group of nutrients does starch belong?'), a: X('Carbohydrates.') }] },
  },
  {
    id: 'bio6_fat_test', subj: 'biology', cls: 6, ch: C6F, topic: 'food',
    title: X('Which foods have fat? The paper test'),
    aim: X('To press or rub foods on squares of white paper and look through them at a lamp: an oily patch shows fat.'),
    kind: X('Test for fats'),
    setup(K) {
      const o = {}; const xs = [-0.24, -0.08, 0.08, 0.24]; ['A', 'B', 'C', 'D'].forEach((t, i) => { const p = K.add(B2.paperSquare({ seed: i + 2 }), xs[i], -0.6); p.app = K.app; keepHome(p); o['p' + t] = p; K.add(B.card(t), xs[i], -0.52); });
      o.nut = K.add(B2.fatSample('nut'), -0.24, -0.72); o.butter = K.add(B2.fatSample('butter'), -0.08, -0.72); o.cuc = K.add(B2.fatSample('cucumber'), 0.24, -0.72); for (const k of ['nut', 'butter', 'cuc']) keepHome(o[k]);
      o.oil = K.bottle('moil', 0.08, -0.74, { dropper: true }); o.oil.name = N('Mustard oil', 'सरसों का तेल', 'Sarson ka tel');
      o.lamp = K.add(B2.deskLamp(), 0.0, -0.95); o.lamp.g.rotation.y = -Math.PI / 2; keepHome(o.lamp);
      for (const [k, pk] of [['nut', 'pA'], ['butter', 'pB'], ['cuc', 'pD']]) o[k].onRelease = () => { const p = o[pk]; const q = o[k].g.position; if (Math.hypot(q.x - p.g.position.x, q.z - p.g.position.z) < 0.05) rubOn(K, o, k, pk); else { q.y = BENCH_Y + 0.0008; keepHome(o[k]); } };
      o.S = B.timeSlider(K.app, { max: 10, ticks: 10, labels: [[0, '0 min'], [0.5, '5 min'], [1, '10 min']], fmt: (h, L) => ({ en: `${Math.round(h)} min`, hi: `${Math.round(h)} मिनट`, hg: `${Math.round(h)} minute` }[L] || `${Math.round(h)} min`) }); o.S.place(0.38, -0.4); o.knob = o.S.knob;
      o.S.onHours = (m, dm) => { for (const t of ['A', 'B', 'C', 'D']) { const p = o['p' + t]; if (p.wet > 0) { p.wet = Math.max(0, p.wet - dm / 5); p.draw(); } } };
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Put a few crushed groundnuts on paper A, fold the paper over them and press hard. Then take the nuts off.'), target: 'nut', act: (K, o) => rubOn(K, o, 'nut', 'pA'), ev: { type: 'rub', v: 'pA' }, see: X('A greasy-looking patch is left where the nuts were pressed.') },
      { do: X('Rub a little butter on paper B.'), target: 'butter', act: (K, o) => rubOn(K, o, 'butter', 'pB'), ev: { type: 'rub', v: 'pB' }, see: X('A greasy patch on paper B.') },
      { do: X('Put two drops of mustard oil on paper C.'), target: 'oil', act: (K, o) => oilDrops(K, o), ev: { type: 'rub', v: 'pC' }, see: X('The oil soaks in and leaves a patch.') },
      { do: X('Rub the cucumber slice on paper D.'), target: 'cuc', act: (K, o) => rubOn(K, o, 'cuc', 'pD'), ev: { type: 'rub', v: 'pD' }, see: X('A wet patch on paper D.') },
      { do: X('Let the papers dry for a few minutes: slide the clock on.'), target: 'knob', act: (K, o) => o.S.to(K, 6, 4), ev: { type: 'time' }, until: (K, o) => o.S.hours >= 5,
        see: X('The wet patch on D dries and disappears. The patches on A, B and C stay.'), why: X('Water evaporates; fat does not.') },
      { do: X('Hold each paper up against the lamp and look through it.'), target: 'lamp', act: (K, o) => backlight(K, o), ev: { type: 'backlit' }, check: fatCheck,
        see: X('Light shines through the patches on A, B and C: they look like translucent windows. Paper D looks the same everywhere.'), why: X('Fat (oil) leaves a lasting translucent patch on paper. Groundnuts, butter and mustard oil contain fat; cucumber does not.') },
    ],
    eq: { word: 'fat + paper → lasting oily, translucent patch', sym: 'water patch → dries up' },
    result: { obs: X('Groundnuts, butter and mustard oil left oily patches that let light through; the cucumber left a wet patch that dried away.'),
      concl: X('Groundnuts, butter and oil contain fats; cucumber does not. Fats give us a lot of energy.'), safety: X('Do not eat the food samples used in the lab.'),
      viva: [{ q: X('How does a fat show up on paper?'), a: X('As a translucent, oily patch that does not dry.') }, { q: X('Why do we let the paper dry before looking?'), a: X('So that a water patch, which also looks translucent, dries away.') }, { q: X('Name two foods rich in fat.'), a: X('Groundnuts and butter (also ghee, oil, coconut).') }] },
  },
  {
    id: 'bio6_protein_test', subj: 'biology', cls: 6, ch: C6F, topic: 'food',
    title: X('Which foods have protein? Copper sulphate and caustic soda'),
    aim: X('To add copper sulphate solution and then caustic soda (sodium hydroxide) to four samples and look for a violet colour, the sign of protein.'),
    kind: X('Test for proteins'),
    setup(K) {
      const o = {}; o.rk = K.rack(-0.05, -0.66);
      const smp = [['water', 'Test tube A — water'], ['milk', 'Test tube B — milk mixed with water'], ['besan', 'Test tube C — gram flour (besan) in water'], ['starch', 'Test tube D — rice water (starch)']];
      ['a', 'b', 'c', 'd'].forEach((k, i) => { o[k] = K.tube(o.rk, i + 1, smp[i][0], 3); o[k].name = X(smp[i][1]); });
      o.cu = K.bottle('cuso4', 0.24, -0.56, { dropper: true }); o.na = K.bottle('naoh', 0.36, -0.56, { dropper: true }); o.na.name = N('Sodium hydroxide (caustic soda) solution', 'सोडियम हाइड्रॉक्साइड (कास्टिक सोडा) का घोल', 'Sodium hydroxide (caustic soda) solution');
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Add two drops of copper sulphate solution to each of the four tubes.'), target: 'cu', act: async (K, o) => { for (const k of ['a', 'b', 'c', 'd']) await K.drops(o.cu, o[k], 2); }, ev: { type: 'drops', from: 'cu' }, until: (K, o) => ['a', 'b', 'c', 'd'].every((k) => o[k].mix.inp.cuso4 > 0.05),
        see: X('Each sample turns very slightly blue.') },
      { do: X('Now add ten drops of sodium hydroxide solution to each tube and shake gently.'), target: 'na', act: async (K, o) => { for (const k of ['a', 'b', 'c', 'd']) await K.drops(o.na, o[k], 10); }, ev: { type: 'drops', from: 'na' }, until: (K, o) => ['a', 'b', 'c', 'd'].every((k) => o[k].mix.inp.naoh > 0.3),
        see: X('Pale blue cloudiness appears in every tube.'), why: X('Copper sulphate and sodium hydroxide make light blue copper hydroxide.') },
      { do: X('Let the tubes stand for two or three minutes and compare their colours.'), target: 'rk', act: async (K, o) => { tubesLook(o); await K.wait(5, 30); }, check: proteinCheck,
        see: X('B (milk) and C (gram flour) turn violet. A (water) and D (rice water) stay light blue.'), why: X('A violet colour shows protein. Milk and pulses such as gram are rich in protein; water and rice water have hardly any.') },
    ],
    eq: { word: 'protein + copper sulphate + sodium hydroxide → violet', sym: 'no protein: light blue (copper hydroxide)' },
    result: { obs: X('With copper sulphate and sodium hydroxide, milk and gram flour turned violet; water and rice water stayed light blue.'),
      concl: X('Milk and gram (pulses) contain protein. Proteins are body-building foods.'), safety: X('Sodium hydroxide (caustic soda) burns skin and eyes: use a dropper, wear goggles, and wash off any splash with plenty of water.'),
      viva: [{ q: X('Which colour shows that protein is present?'), a: X('Violet (purple).') }, { q: X('Why is a tube of plain water tested too?'), a: X('As a control, to see the colour without protein.') }, { q: X('Name two protein-rich foods.'), a: X('Milk and pulses (dal), also eggs, paneer, soybean.') }] },
  },
  // ============================================================================ saliva digests starch
  {
    id: 'bio7_saliva_rice', subj: 'biology', cls: 7, ch: C7A, topic: 'food',
    title: X('What does saliva do to boiled rice?'),
    aim: X('To keep plain boiled rice and chewed boiled rice in water for ten minutes, then test both with iodine for starch.'),
    kind: X('Digestion begins in the mouth'),
    setup(K) {
      const o = {}; o.rk = K.rack(0.0, -0.68); o.a = K.tube(o.rk, 2, null, 0); o.a.name = X('Test tube A — boiled rice'); o.b = K.tube(o.rk, 4, null, 0); o.b.name = X('Test tube B — chewed boiled rice');
      o.rice = K.add(K.A3.steelPlate(), -0.3, -0.62); o.rice.name = N('Plate of boiled rice', 'उबले चावल की प्लेट', 'Ubale chawal ki plate'); const pile = B2.foodSample('rice'); pile.noGrab = true; K.add(pile, -0.3, -0.62, { y: BENCH_Y + 0.004 }); pile.g.scale.setScalar(1.6); o.pile = pile;
      o.spoon = K.add(K.A.spatula(), -0.18, -0.5); o.spoon.g.rotation.set(Math.PI / 2, 0, 0.5); o.spoon.g.position.y = BENCH_Y + 0.003; keepHome(o.spoon);
      o.water = K.beaker(0.28, -0.7, 'water', 60, 100); o.iod = K.bottle('iodine', 0.38, -0.56, { dropper: true }); o.iod.name = N('Dilute iodine solution', 'पतला आयोडीन घोल', 'Patla iodine ghol');
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Put a spoonful of boiled rice into test tube A, add 5 mL of water and shake.'), target: 'spoon', act: async (K, o) => { await riceInto(K, o, o.a, false); await K.pour(o.water, o.a, 5); await K.shake(o.a, 1); }, ev: { type: 'rice', v: 'a' },
        see: X('Rice grains in cloudy water.') },
      { do: X('Chew another spoonful of boiled rice for two minutes, then put it into test tube B. Add 5 mL of water and shake.'), target: 'spoon', act: async (K, o) => { await riceInto(K, o, o.b, true); await K.pour(o.water, o.b, 5); await K.shake(o.b, 1); }, ev: { type: 'rice', v: 'b' },
        see: X('Chewed rice in cloudy water.'), why: X('While chewing, the rice gets mixed with saliva from the salivary glands.') },
      { do: X('Leave both tubes for ten minutes (time-lapse).'), target: 'rk', act: (K) => K.wait(6, 100), noCheck: true, see: X('Ten minutes pass.') },
      { do: X('Add two drops of iodine solution to each tube.'), target: 'iod', act: async (K, o) => { tubesLook(o); await K.drops(o.iod, o.a, 2); await K.drops(o.iod, o.b, 2); await K.sleep(1); }, ev: { type: 'drops', from: 'iod' }, until: (K, o) => o.a.mix.inp.iodine > 0.05 && o.b.mix.inp.iodine > 0.05, check: salivaCheck(['a'], ['b']),
        see: X('Tube A turns blue-black. Tube B stays yellowish-brown, the colour of iodine.'), why: X('The starch in A is still there. In B the saliva has broken the starch down into sugar.') },
    ],
    eq: { word: 'starch —(salivary amylase, in saliva)→ sugar (maltose)', sym: '(C₆H₁₀O₅)ₙ + H₂O → maltose' },
    result: { obs: X('Plain boiled rice gave a blue-black colour with iodine; chewed rice did not.'), concl: X('Saliva breaks down starch into sugar. Digestion of starch begins in the mouth.'),
      safety: X('In a school lab, chew only clean food given by the teacher and never taste chemicals. Iodine stains.'),
      viva: [{ q: X('Which substance in saliva digests starch?'), a: X('The enzyme salivary amylase.') }, { q: X('Into what is starch broken down?'), a: X('Sugar (maltose).') }, { q: X('Why does boiled rice taste sweet if chewed for long?'), a: X('Saliva turns its starch into sugar.') }] },
  },
  {
    id: 'bio10_saliva_temp', subj: 'biology', cls: 10, also: [7], ch: C10L, topic: 'food',
    title: X('Saliva and starch at different temperatures'),
    aim: X('To mix starch solution with saliva, keep the tubes cold, at body temperature or in boiling water, and test them with iodine after twenty minutes.'),
    kind: X('Action of salivary amylase on starch; effect of temperature'),
    setup(K) {
      const o = {}; o.rk = K.rack(-0.16, -0.5); ['a', 'b', 'c', 'd'].forEach((k, i) => { o[k] = K.tube(o.rk, i + 1, 'starch', 3); });
      o.a.name = X('Test tube A — starch + saliva (37 °C)'); o.b.name = X('Test tube B — starch + saliva (ice)'); o.c.name = X('Test tube C — starch + water (37 °C)'); o.d.name = X('Test tube D — starch + saliva (boiling water)');
      o.sal = K.beaker(-0.42, -0.56, 'saliva', 12, 50); o.sal.name = N('Saliva (diluted with water)', 'लार (पानी मिलाकर पतली की गई)', 'Laar (paani milakar patli ki gayi)'); o.wat = K.beaker(-0.42, -0.7, 'water', 12, 50);
      o.warm = B.holdBath(K, 0.12, -0.72, 37, { name: N('Water bath at 37 °C (body temperature)', '37 °C का वॉटर बाथ (शरीर का तापमान)', '37 °C ka water bath (sharir ka temperature)') });
      o.ice = B.holdBath(K, 0.3, -0.76, 4, { ice: true, name: N('Ice bath (about 4 °C)', 'बर्फ़ वाला बाथ (लगभग 4 °C)', 'Barf wala bath (lagbhag 4 °C)') });
      o.tp = K.tripod(0.5, -0.78); o.burner = K.burner(0.5, -0.78); o.burner.setLit(true); o.hot = K.add(K.A.beaker(250), 0.5, -0.78, { y: BENCH_Y + o.tp.top + 0.001 }); K.lab.fill(o.hot, 'water', 150); o.hot.mix.temp = 99; o.hot.onTripod = { over: o.burner }; o.hot.name = N('Boiling water bath', 'उबलते पानी का बाथ', 'Ubalte paani ka bath');
      o.iod = K.bottle('iodine', 0.08, -0.5, { dropper: true }); o.iod.name = N('Dilute iodine solution', 'पतला आयोडीन घोल', 'Patla iodine ghol');
      for (const k of ['a', 'b', 'c', 'd']) B.bathOnRelease(K, o[k], [o.warm, o.ice, o.hot]);
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Add 1 mL of diluted saliva to tubes A, B and D, and 1 mL of plain water to tube C.'), target: 'sal', act: async (K, o) => { for (const k of ['a', 'b', 'd']) await K.pour(o.sal, o[k], 1); await K.pour(o.wat, o.c, 1); },
        ev: { type: 'pour' }, until: (K, o) => ['a', 'b', 'd'].every((k) => o[k].mix.inp.saliva > 0.5) && o.c.mix.inp.water > 0.5, see: X('All four tubes look the same: cloudy, colourless.') },
      { do: X('Stand tubes A and C in the water bath at 37 °C.'), target: 'a', act: async (K, o) => { await tubeTo(K, o.a, o.warm); await tubeTo(K, o.c, o.warm, 0.012); }, ev: { type: 'bath', in: 'warm' }, until: (K, o) => o.a.bath === o.warm && o.c.bath === o.warm,
        see: X('A and C warm up to body temperature.'), why: X('37 °C is the temperature inside our mouth.') },
      { do: X('Stand tube B in the ice bath and tube D in the boiling water bath.'), target: 'b', act: async (K, o) => { await tubeTo(K, o.b, o.ice); await tubeTo(K, o.d, o.hot); }, ev: { type: 'bath' }, until: (K, o) => o.b.bath === o.ice && o.d.bath === o.hot,
        see: X('B cools to about 4 °C; D heats up to nearly 100 °C.') },
      { do: X('Leave all four for twenty minutes (time-lapse).'), target: 'warm', act: (K) => K.wait(8, 150), noCheck: true, see: X('Twenty minutes pass.') },
      { do: X('Take the tubes out and add two drops of iodine solution to each.'), target: 'iod', act: async (K, o) => { for (const k of ['a', 'b', 'c', 'd']) { o[k].bath = null; await K.moveTo(o[k], V(o.rk.g.position.x + o.rk.slots[['a', 'b', 'c', 'd'].indexOf(k) + 1].x, BENCH_Y + o.rk.slots[1].y, o.rk.g.position.z + o.rk.slots[1].z), new THREE.Quaternion(), 0.7); keepHome(o[k]); }
          tubesLook(o); for (const k of ['a', 'b', 'c', 'd']) await K.drops(o.iod, o[k], 2); await K.sleep(1); },
        ev: { type: 'drops', from: 'iod' }, until: (K, o) => ['a', 'b', 'c', 'd'].every((k) => o[k].mix.inp.iodine > 0.05), check: salivaCheck(['b', 'c', 'd'], ['a']),
        see: X('Only tube A stays yellowish-brown. B (ice), C (no saliva) and D (boiled) turn blue-black.'), why: X('The enzyme in saliva digested the starch only at body temperature. In the cold it works too slowly, and boiling destroys it.') },
    ],
    eq: { word: 'starch —(salivary amylase, 37 °C)→ maltose', sym: 'cold: very slow · boiling: enzyme destroyed' },
    result: { obs: X('After twenty minutes, iodine stayed yellowish-brown only in tube A (saliva at 37 °C); tubes B, C and D turned blue-black.'),
      concl: X('Salivary amylase digests starch into sugar, and works best at body temperature. It hardly works in the cold, and heat destroys it.'),
      safety: X('Use your own saliva only, and never share it. Be careful with the boiling water bath.'),
      viva: [{ q: X('Which tube is the control?'), a: X('Tube C, with water instead of saliva.') }, { q: X('Why did tube D turn blue-black?'), a: X('Boiling destroyed the enzyme, so the starch was not digested.') }, { q: X('At what temperature does salivary amylase work best?'), a: X('About 37 °C, body temperature.') }] },
  },
  // ============================================================================ oxygen from a water plant, and the light it needs
  {
    id: 'bio7_hydrilla_o2', subj: 'biology', cls: 7, also: [10], ch: C7P, topic: 'plants',
    title: X('Bubbles of oxygen from Hydrilla: does more light give more bubbles?'),
    aim: X('To collect the gas given off by Hydrilla in light, count its bubbles with a lamp at different distances, and test the gas with a glowing splint.'),
    kind: X('Photosynthesis gives out oxygen; rate and light'),
    setup(K) {
      const o = {}; o.b = B2.hydrillaSet(K, -0.12, -0.7); o.funnel = o.b.funnel; o.tube = o.b.tube; o.funnel.noGrab = true;
      o.soda = K.solid('nahco3', -0.4, -0.6); o.soda.name = N('Baking soda (sodium hydrogencarbonate)', 'खाने का सोडा (सोडियम हाइड्रोजन कार्बोनेट)', 'Khaane ka soda (sodium hydrogencarbonate)');
      o.lamp = K.add(B2.deskLamp(), 0.22, -0.7); o.lamp.g.rotation.y = Math.PI; o.lamp.noGrab = false;
      // a metre scale on the bench from the beaker to the right; the lamp slides along it
      o.scale = K.add(B2.benchScale(0.5), -0.12, -0.645); o.scale.noGrab = true;
      const bx = o.b.g.position.x; const dist = () => Math.max(0.05, o.lamp.g.position.x - 0.045 - bx);
      o.dist = dist; o.board = B4sign(K, V(-0.12, BENCH_Y + 0.33, -0.86)); o.rows = [];
      handle(o.lamp, { path: () => [V(bx + 0.13, BENCH_Y, -0.7), V(bx + 0.55, BENCH_Y, -0.7)], active: () => true, keepVisible: () => true, at: () => o.lamp.g.position.clone(), move: (k, p) => { o.lamp.g.position.set(bx + 0.13 + k * 0.42, BENCH_Y + 0.0008, -0.7); } });
      o.lamp.onRelease0 = o.lamp.onRelease; o.lamp.onRelease = () => { o.lamp.onRelease0 && o.lamp.onRelease0(); K.lab.emit('lamp_moved', { obj: o.lamp.id }); };
      o.co2 = 1; o.counter = liveCounter(K, o);
      const tick = o.b.update.bind(o.b); o.b.update = (dt, t) => { tick(dt, t); if (t === undefined) return; /* a beaker is updated twice a frame (as item and as vessel): count once */ const L = o.lamp.on ? Math.min(1.4, Math.pow(0.1 / dist(), 2)) : 0; o.b.rate = (1.2 + 46 * L) * o.co2 * (o.lampPlaced ? 1 : o.lamp.on ? 1 : 1); o.b.bubbleTick(dt, K.app.chem.lapse || 1); if (o.b.counting) o.counter.tick(dt); };
      o.splint = K.splint(0.4, -0.48); o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Put a pinch of baking soda into the beaker of water with Hydrilla.'), target: 'soda', act: async (K, o) => { await K.addSolid(o.soda, o.b); o.co2 = 1.6; K.lab.emit('soda', {}); }, ev: { type: 'add', to: 'b' },
        see: X('The white powder dissolves.'), why: X('Baking soda gives the water more carbon dioxide, which the plant needs for photosynthesis.') },
      { do: X('Lower a glass funnel upside down over the Hydrilla.'), target: 'b', act: async (K, o) => { const f = o.funnel; const y = f.g.position.y; f.g.visible = true; f.g.position.y = y + 0.15; await K.tween(1, (k) => { f.g.position.y = y + 0.15 * (1 - B.ease(k)); }); K.lab.emit('funnel', {}); }, ev: { type: 'funnel' },
        see: X('The funnel covers the twigs; its stem points up, under water.') },
      { do: X('Fill a test tube with water, close it with your thumb, turn it upside down and slip it over the funnel’s stem.'), target: 'b', act: async (K, o) => { const t = o.tube; o.b.placeTube(); const y = t.g.position.y; t.g.visible = true; t.g.position.y = y + 0.12; await K.tween(1, (k) => { t.g.position.y = y + 0.12 * (1 - B.ease(k)); }); K.lab.emit('tube', {}); }, ev: { type: 'tube' },
        see: X('The tube stands full of water over the funnel, with no air in it.'), why: X('Any gas from the plant will rise into the tube and push the water down.') },
      countStep(0.1, X('Switch the lamp on and set it 10 cm from the beaker. Count the bubbles that rise in one minute.')),
      countStep(0.2, X('Move the lamp to 20 cm and count the bubbles for one minute again.')),
      countStep(0.3, X('Move the lamp to 30 cm and count again.')),
      { do: X('Switch the lamp off and count again.'), target: 'lamp', act: async (K, o) => { o.lamp.setOn(false); await count(K, o, 'off'); }, ev: { type: 'counted' }, until: (K, o) => o.lastCount && o.lastCount.off,
        see: X('Hardly any bubbles rise now.'), why: X('With little light the plant makes very little food and gives out very little oxygen.') },
      { do: X('Put the lamp close again and leave the set-up for three hours (time-lapse).'), target: 'lamp', act: async (K, o) => { o.lamp.setOn(true); await K.moveTo(o.lamp, V(o.b.g.position.x + 0.145, BENCH_Y + 0.0008, -0.7), null, 0.8); look(o, o.tube.g.getWorldPosition(V(0, 0, 0)).add(V(0, -0.035, 0)), V(0.04, 0.03, 0.26)); await K.wait(10, 1080); }, noCheck: true,
        see: X('Gas collects at the top of the test tube and pushes the water down.') },
      { do: X('Lift the tube out with your thumb over its mouth, turn it upright and push a glowing splint into it.'), target: 'splint', act: (K, o) => splintTest(K, o), ev: { type: 'splint' }, check: (K, o) => (o.b.gas > 1.5 ? { ok: true } : { ok: false, see: T3('The splint just goes on glowing; there was too little gas to test.', 'तीली बस सुलगती रही; जाँचने लायक गैस जमा ही नहीं हुई थी।', 'Teeli bas sulagti rahi; jaanchne layak gas jama hi nahi hui thi.'), why: T3('Little gas was collected: keep the lamp close and wait longer.', 'बहुत कम गैस जमा हुई: लैंप पास रखिए और ज़्यादा देर रुकिए।', 'Bahut kam gas jama hui: lamp paas rakhiye aur zyada der rukiye.') }),
        see: X('The glowing splint bursts into flame.'), why: X('The gas is oxygen: oxygen makes a glowing splint flare up. Green plants give out oxygen in photosynthesis.') },
    ],
    eq: { word: 'carbon dioxide + water → glucose + oxygen (bubbles), in light', sym: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂↑' },
    result: { obs: X('Bubbles rose fastest with the lamp close and fewer as it moved away; almost none with the lamp off. The gas collected made a glowing splint burst into flame.'),
      concl: X('Water plants give out oxygen in light. The brighter the light, the faster the photosynthesis.'), safety: X('The lamp bulb gets hot: do not touch it. Keep water away from the lamp’s wire.'),
      viva: [{ q: X('Which gas is in the bubbles?'), a: X('Oxygen.') }, { q: X('Why did the bubbles slow down when the lamp moved away?'), a: X('Less light reached the plant, so it photosynthesised more slowly.') }, { q: X('Why is baking soda added?'), a: X('It gives the water extra carbon dioxide.') }] },
  },
  // ============================================================================ Class 6 · Ch 10 · seeds need water, air and warmth to germinate
  {
    id: 'bio6_germination', subj: 'biology', cls: 6, ch: C6L, topic: 'plants',
    title: X('What do seeds need to sprout? Water, air and warmth'),
    aim: X('To keep moong seeds dry, on moist cotton, under water, and on moist cotton in a refrigerator, and see after three days which ones sprout.'),
    kind: X('Conditions for germination'),
    setup(K) {
      const app = K.app; const o = {}; const xs = [-0.34, -0.17, 0.0, 0.17];
      const dish = (k, x, t) => { const d = K.add(K.A3.petriDish(), x, -0.62); d.name = N(`Dish ${t}`, `डिश ${t}`, `Dish ${t}`); d.cot = B2.cottonBed(0.04); d.g.add(d.cot); d.seeds = B2.seedGroup(10, { seed: x * 100 + 7, R: 0.026 }); d.seeds.position.y = 0.005; d.g.add(d.seeds); K.add(B.card(t), x, -0.52); keepHome(d); return d; };
      o.a = dish('a', xs[0], 'A'); o.b = dish('b', xs[1], 'B'); o.d = dish('d', xs[3], 'D');
      o.c = K.beaker(xs[2], -0.62, null, 0, 250); o.c.name = N('Beaker C', 'बीकर C', 'Beaker C'); o.c.seeds = B2.seedGroup(10, { seed: 77, R: 0.024 }); o.c.seeds.position.y = o.c.inner[0].y; o.c.g.add(o.c.seeds); K.add(B.card('C'), xs[2], -0.52); keepHome(o.c);
      o.jug = K.beaker(0.36, -0.52, 'water', 230, 250); o.jug.name = N('Beaker of water', 'पानी का बीकर', 'Paani ka beaker');
      o.fr = K.add(B2.fridge(), 0.62, -0.8); o.fr.g.rotation.y = -0.35;
      o.S = B.timeSlider(app, { max: 96, ticks: 8, labels: [[0, '0 h'], [0.25, '1 d'], [0.5, '2 d'], [0.75, '3 d'], [1, '4 d']] }); o.S.place(-0.5, -0.4); o.knob = o.S.knob;
      o.d.noGrab = false; o.d.onRelease = () => { const p = o.d.g.position; if (o.fr.inside(p)) { fridgeIn(K, o, true); } else { p.y = BENCH_Y + 0.0008; o.d.inFridge = false; keepHome(o.d); } };
      const env = (v) => { const ml = v.ml; if (v === o.c) return { moist: ml > 2 ? 1 : 0, flooded: v.heightFor(ml) > v.inner[0].y + 0.006, T: 27 }; return { moist: Math.min(1, ml / 8), flooded: ml > 18, T: v.inFridge ? 4 : 27 }; };
      o.S.onHours = (h, dh) => { for (const v of [o.a, o.b, o.c, o.d]) { const e = env(v); B2.germinate(v.seeds, dh, e); if (v.cot) v.cot.setWet(Math.min(1, v.ml / 8)); } };
      for (const v of [o.a, o.b, o.d]) { const u0 = v.update.bind(v); v.update = (dt) => { u0(dt); if (v.cot) v.cot.setWet(Math.min(1, v.ml / 8)); }; }
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Dish A: leave the seeds on dry cotton. Dish B: pour a little water on the cotton, just enough to make it moist.'), target: 'jug', act: (K, o) => K.pour(o.jug, o.b, 8), ev: { type: 'pour', from: 'jug', to: 'b', ml: 4 },
        see: X('The cotton in B turns damp and grey; A stays dry.') },
      { do: X('Beaker C: pour in water until the seeds are completely under water.'), target: 'c', act: (K, o) => K.pour(o.jug, o.c, 120), ev: { type: 'pour', from: 'jug', to: 'c', ml: 30 }, until: (K, o) => o.c.ml > 40,
        see: X('The seeds lie at the bottom under a deep layer of water.'), why: X('Under water the seeds get very little air.') },
      { do: X('Dish D: moisten the cotton like B, then keep the dish in the refrigerator.'), target: 'd', act: async (K, o) => { await K.pour(o.jug, o.d, 8); await fridgeIn(K, o); }, ev: { type: 'in_fridge' },
        see: X('Dish D sits in the cold refrigerator.'), why: X('Inside the refrigerator it is about 4 °C: wet, airy, but cold.') },
      { do: X('Leave all four for three days: slide the clock on.'), target: 'knob', act: async (K, o) => { await o.S.to(K, 72, 6); }, ev: { type: 'time' }, until: (K, o) => o.S.hours >= 70,
        see: X('Three days pass.') },
      { do: X('Take D out of the refrigerator and compare the seeds in A, B, C and D.'), target: 'd', act: async (K, o) => { if (o.d.inFridge) await fridgeOut(K, o); look(o, V(-0.08, BENCH_Y + 0.02, -0.62), V(0.0, 0.3, 0.32)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: germCheck,
        see: X('Only the seeds in B have sprouted: a white root has come out of each. Those in A are dry and unchanged; those in C and D have swollen but not sprouted.'), why: X('Seeds need water, air and warmth to germinate. A had no water, C had no air, and D was too cold.') },
    ],
    eq: { word: 'water + air (oxygen) + warmth → germination', sym: '—' },
    result: { obs: X('After three days only the seeds on moist cotton at room temperature (B) sprouted. Dry seeds (A), seeds under water (C) and seeds in the refrigerator (D) did not.'),
      concl: X('Seeds need water, air and a suitable warm temperature to germinate.'), safety: X('Wash your hands after handling seeds; do not eat seeds kept in the lab.'),
      viva: [{ q: X('Why did the seeds in C not germinate?'), a: X('They were under water and got no air.') }, { q: X('Which dish was the control?'), a: X('B: water, air and warmth.') }, { q: X('What comes out of a seed first when it germinates?'), a: X('The root (radicle).') }] },
  },
  // ============================================================================ Class 9 · Ch 2 · osmosis in raisins
  {
    id: 'bio9_raisins', subj: 'biology', cls: 9, ch: C9, topic: 'cells',
    title: X('Raisins in water and in sugar solution: osmosis'),
    aim: X('To keep dry raisins in plain water and in a strong sugar solution, see which swell, and then move the swollen ones into the sugar solution.'),
    kind: X('Osmosis: endosmosis and exosmosis'),
    setup(K) {
      const app = K.app; const o = {};
      o.wA = K.beaker(-0.2, -0.66, 'water', 150, 250); o.wA.name = X('Beaker A — plain water'); o.wB = K.beaker(0.02, -0.66, 'sugar', 150, 250); o.wB.name = X('Beaker B — strong sugar solution');
      const grp = (x, z, seed) => { K.add(K.A.watchGlass(), x, z); const r = K.add(B2.raisins(6, { seed }), x, z, { y: BENCH_Y + 0.005 }); keepHome(r); return r; };
      o.rA = grp(-0.42, -0.58, 4); o.rB = grp(-0.42, -0.74, 9); o.rD = grp(-0.09, -0.55, 13); o.rD.name = N('Dry raisins (kept for comparison)', 'सूखी किशमिश (तुलना के लिए रखी)', 'Sookhi kishmish (tulna ke liye rakhi)');
      o.S = B.timeSlider(app, { max: 9, ticks: 9, labels: [[0, '0 h'], [0.444, '4 h'], [0.889, '8 h']] }); o.S.place(-0.5, -0.42); o.knob = o.S.knob;
      o.S.onHours = (h, dh) => { for (const r of [o.rA, o.rB]) { if (!r.in) continue; const tgt = B2.raisinTarget(r.in); r.setSwell(r.k + (tgt - r.k) * (1 - Math.exp(-dh / 1.5))); } };
      for (const r of [o.rA, o.rB]) { r.noGrab = false; r.onRelease = () => { for (const v of [o.wA, o.wB]) { const m = v.g.position; if (Math.hypot(r.g.position.x - m.x, r.g.position.z - m.z) < 0.05) { raisinsInto(K, r, v, 0.3); return; } } r.g.position.y = BENCH_Y + 0.005; keepHome(r); }; }
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Drop six raisins into beaker A, which has plain water.'), target: 'rA', act: (K, o) => raisinsInto(K, o.rA, o.wA), ev: { type: 'raisins_in', in: 'wA' }, see: X('The wrinkled raisins sink to the bottom.') },
      { do: X('Drop six raisins into beaker B, which has a strong sugar solution.'), target: 'rB', act: (K, o) => raisinsInto(K, o.rB, o.wB), ev: { type: 'raisins_in', in: 'wB' }, see: X('These raisins also sink.') },
      { do: X('Leave them for four hours: slide the clock on.'), target: 'knob', act: async (K, o) => { look(o, V(-0.09, BENCH_Y + 0.03, -0.66), V(0, 0.16, 0.3)); await o.S.to(K, 4, 5); }, ev: { type: 'time' }, until: (K, o) => o.S.hours >= 3.9,
        see: X('The raisins in water grow plump and smooth. Those in the sugar solution stay small and wrinkled.') },
      { do: X('Compare them with the dry raisins.'), target: 'rD', act: async (K, o) => { look(o, V(-0.09, BENCH_Y + 0.03, -0.62), V(0.0, 0.22, 0.3)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: raisinCheck(1),
        see: X('The raisins from water are nearly twice as big as the dry ones; the others look like the dry ones.'), why: X('Water passed into the raisins in plain water through their skins (endosmosis). The sugar solution outside was stronger than the juice inside, so no water went in.') },
      { do: X('Now move the swollen raisins from beaker A into the sugar solution and wait four more hours.'), target: 'rA', act: async (K, o) => { await raisinsInto(K, o.rA, o.wB); await o.S.to(K, o.S.hours + 4, 5); }, ev: { type: 'time' }, until: (K, o) => o.rA.in === o.wB && o.S.hours >= (o.movedAt ?? 99) + 3.9, check: raisinCheck(2),
        see: X('They shrink and wrinkle again.'), why: X('Now the solution outside is stronger: water leaves the raisins (exosmosis). Water always moves from where it is more to where it is less, through the skin.') },
    ],
    eq: { word: 'water moves through a membrane from a weaker solution to a stronger one (osmosis)', sym: 'in water → swell (endosmosis) · in sugar solution → shrink (exosmosis)' },
    result: { obs: X('Dry raisins swelled in plain water but not in strong sugar solution; the swollen ones shrank again in the sugar solution.'),
      concl: X('Water moves into or out of cells by osmosis, depending on whether the solution outside is weaker or stronger than the cell sap.'), safety: X('Do not eat the raisins used in the lab.'),
      viva: [{ q: X('What is osmosis?'), a: X('The movement of water through a membrane from a weaker to a stronger solution.') }, { q: X('Why did the raisins swell in water?'), a: X('Water entered them by endosmosis.') }, { q: X('What happened in the sugar solution?'), a: X('Water left the raisins (exosmosis), so they shrank.') }] },
  },
  // ============================================================================ Class 10 · respiration and tropism
  {
    id: 'bio10_seeds_co2', subj: 'biology', cls: 10, ch: C10L, topic: 'plants',
    title: X('Germinating seeds give out carbon dioxide'),
    aim: X('To close sprouting seeds in a flask with a small tube of potassium hydroxide, and see coloured water climb a bent tube as the gas is taken up.'),
    kind: X('Respiration in seeds'),
    setup(K) {
      const app = K.app; const o = {};
      const flask = (x, t) => { const f = K.add(K.A.conicalFlask(250), x, -0.7); f.name = N(`Flask ${t} — sprouting moong seeds on wet cotton`, `फ़्लास्क ${t} — गीली रुई पर अंकुरित मूँग`, `Flask ${t} — geeli rui par ankurit moong`); K.sticker(f, t); const c = B2.cottonBed(0.034); c.position.y = f.inner[0].y; c.setWet(1); f.g.add(c); const sd = B2.seedGroup(16, { seed: x * 50 + 3, R: 0.026 }); sd.position.y = f.inner[0].y + 0.005; f.g.add(sd); for (const q of sd.seeds) sd.setSeed(q, 1, 10 + Math.random() * 6); f.closed = false; return f; };
      o.fa = flask(-0.3, 'A'); o.fb = flask(0.05, 'B');
      o.ba = K.beaker(-0.12, -0.72, 'water', 120, 250); o.bb = K.beaker(0.23, -0.72, 'water', 120, 250); for (const b of [o.ba, o.bb]) { K.lab.fill(b, 'redink', 6); b.name = N('Beaker of coloured water', 'रंगीन पानी का बीकर', 'Rangeen paani ka beaker'); }
      o.koh = K.add(K.A.testTube({ r: 0.006, h: 0.06, name: N('Small test tube of potassium hydroxide (KOH)', 'पोटैशियम हाइड्रॉक्साइड (KOH) वाली छोटी टेस्ट ट्यूब', 'KOH wali chhoti test tube') }), -0.45, -0.52); K.lab.fill(o.koh, 'koh', 1.5); keepHome(o.koh); o.koh.noGrab = false;
      o.koh.onRelease = () => { for (const f of [o.fa, o.fb]) { const m = f.mouthWorld(V(0, 0, 0)); if (Math.hypot(o.koh.g.position.x - m.x, o.koh.g.position.z - m.z) < 0.04) { hangKoh(K, o, f, 0.3); return; } } o.koh.g.position.y = BENCH_Y + 0.0008; o.koh.g.quaternion.identity(); keepHome(o.koh); };
      o.S = B.timeSlider(app, { max: 3, ticks: 6, labels: [[0, '0 h'], [0.333, '1 h'], [0.667, '2 h'], [1, '3 h']] }); o.S.place(-0.5, -0.4); o.knob = o.S.knob;
      o.S.onHours = (h, dh) => { for (const [f, T] of [[o.fa, o.ta], [o.fb, o.tb]]) { if (!T) continue; const absorb = f.kohIn ? 1 : 0; T.set(Math.min(0.11, T.rise + dh * 0.032 * absorb)); } };
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Hang the small tube of potassium hydroxide inside flask A with a thread. Flask B gets none.'), target: 'koh', act: (K, o) => hangKoh(K, o, o.fa), ev: { type: 'koh_in' }, see: X('The small tube hangs above the seeds in flask A.'), why: X('Potassium hydroxide takes up carbon dioxide gas.') },
      { do: X('Close both flasks with corks carrying bent glass tubes, dip the free ends in the coloured water, and seal the corks with Vaseline.'), target: 'fb', act: async (K, o) => { o.ta = B2.bentTube(K, o.fa, o.ba); o.tb = B2.bentTube(K, o.fb, o.bb); o.fa.closed = true; o.fb.closed = true; for (const v of [o.fa, o.fb, o.ba, o.bb]) { v.noGrab = true; keepHome(v); } K.lab.emit('corked', {}); await K.sleep(0.8); }, ev: { type: 'corked' },
        see: X('Each flask is now airtight, joined by its tube to a beaker of coloured water.') },
      { do: X('Mark the level of the water in each bent tube.'), target: 'ba', act: async (K, o) => { o.ta.markAt(); o.tb.markAt(); look(o, V(0.05, BENCH_Y + 0.1, -0.72), V(0, 0.12, 0.45)); K.lab.emit('marked', {}); await K.sleep(1); }, ev: { type: 'marked' }, see: X('Both levels are marked.') },
      { do: X('Leave them for two hours: slide the clock on.'), target: 'knob', act: (K, o) => o.S.to(K, 2, 5), ev: { type: 'time' }, until: (K, o) => o.S.hours >= 1.9,
        see: X('The coloured water climbs up the tube from flask A. In the tube from flask B it stays at the mark.') },
      { do: X('Compare the two tubes.'), target: 'fa', act: async (K, o) => { look(o, o.ta.col.position.clone(), V(0.04, 0.05, 0.26)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: co2Check,
        see: X('In A the water has risen several centimetres; in B it has not moved.'), why: X('The seeds take in oxygen and give out the same amount of carbon dioxide. In A the potassium hydroxide removes that carbon dioxide, so the air inside shrinks and water is pushed in. In B the carbon dioxide stays, so nothing changes.') },
    ],
    eq: { word: 'glucose + oxygen → carbon dioxide + water + energy; KOH absorbs CO₂', sym: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy' },
    result: { obs: X('Water rose in the tube of the flask with potassium hydroxide, not in the flask without it.'), concl: X('Germinating seeds respire: they give out carbon dioxide.'),
      safety: X('Potassium hydroxide is caustic. Handle the small tube carefully and keep it upright.'),
      viva: [{ q: X('Why does the water rise in tube A?'), a: X('KOH absorbs the carbon dioxide given out, so the gas inside decreases.') }, { q: X('Why is flask B set up?'), a: X('As a control: without KOH the level does not change.') }, { q: X('Why are the corks sealed with Vaseline?'), a: X('To make the flasks airtight.') }] },
  },
  {
    id: 'bio10_phototropism', subj: 'biology', cls: 10, ch: C10C, topic: 'plants',
    title: X('Shoots bend towards light, roots grow down'),
    aim: X('To keep bean seedlings on a flask of water in a box open towards the light, watch the shoots bend, then turn the flask round.'),
    kind: X('Phototropism and geotropism'),
    setup(K) {
      const app = K.app; const o = {};
      o.sun = K.add(B.sunPatch({ w: 0.3, d: 0.3 }), -0.88, -0.72);
      o.box = K.add(B.darkBox({ w: 0.24, d: 0.24, h: 0.3, name: N('Cardboard box, open on one side', 'एक तरफ़ से खुला गत्ते का डिब्बा', 'Ek taraf se khula gatte ka dibba') }), -0.48, -0.74); o.box.g.rotation.y = -Math.PI / 2; o.box.setOpen(1);
      o.f = B2.seedlingFlask(K, -0.05, -0.62); keepHome(o.f); o.f.noGrab = false;
      for (let i = 0; i < 2; i++) { o.f.grow(10); } // the seeds have already sprouted
      o.S = B.timeSlider(app, { max: 96, ticks: 8, labels: [[0, '0 h'], [0.5, '2 d'], [1, '4 d']] }); o.S.place(-0.1, -0.4); o.knob = o.S.knob;
      o.f.light = null; o.lightDir = V(-1, 0.25, 0).normalize();
      o.S.onHours = (h, dh) => { o.f.light = o.box.inside(o.f.g.position) ? o.lightDir : null; o.f.grow(dh); };
      o.f.onRelease = () => { const p = o.f.g.position; p.y = BENCH_Y + 0.0008; o.f.g.quaternion.setFromEuler(new THREE.Euler(0, o.f.yaw || 0, 0)); keepHome(o.f); K.lab.emit(o.box.inside(p) ? 'in_box' : 'placed', { obj: o.f.id }); };
      o.cam = camAnchor(K); return o;
    },
    steps: [
      { do: X('Put the flask with the bean seedlings inside the box. The open side of the box faces the window.'), target: 'f', act: async (K, o) => { await K.moveTo(o.f, V(o.box.g.position.x, BENCH_Y + 0.0008, o.box.g.position.z), null, 1.2); keepHome(o.f); K.lab.emit('in_box', { obj: o.f.id }); }, ev: { type: 'in_box' },
        see: X('Light reaches the seedlings from one side only.') },
      { do: X('Leave it for two days: slide the clock on 48 hours.'), target: 'knob', act: (K, o) => o.S.to(K, 48, 5), ev: { type: 'time' }, until: (K, o) => o.S.hours >= 47,
        see: X('The shoots grow longer.') },
      { do: X('Look at the seedlings.'), target: 'f', act: async (K, o) => { look(o, o.f.g.position.clone().add(V(0, 0.15, 0)), V(-0.3, 0.06, 0.1)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: tropCheck(1),
        see: X('The shoots have bent towards the open side, where the light comes from. The roots grow straight down into the water.'), why: X('Shoots grow towards light (phototropism); roots grow towards the pull of gravity (geotropism).') },
      { do: X('Turn the flask round, so the shoots lean away from the light, and leave it for two more days.'), target: 'f', act: async (K, o) => { const y0 = o.f.yaw || 0; await K.tween(1.5, (k) => { o.f.g.rotation.y = y0 + Math.PI * B.ease(k); }); o.f.yaw = y0 + Math.PI; keepHome(o.f); o.turnedAt = o.S.hours; await o.S.to(K, o.S.hours + 48, 5); },
        ev: { type: 'time' }, until: (K, o) => o.turnedAt != null && o.S.hours >= o.turnedAt + 47, see: X('The shoots keep growing.') },
      { do: X('Look at the seedlings again.'), target: 'f', act: async (K, o) => { look(o, o.f.g.position.clone().add(V(0, 0.2, 0)), V(-0.38, 0.07, 0.16)); K.lab.emit('look', {}); await K.sleep(3); }, ev: { type: 'look' }, check: tropCheck(2),
        see: X('The new growth has bent back towards the light, so each shoot has an S-shaped curve. The roots still point down.'), why: X('The growing tip always turns towards light. Cells on the shaded side grow longer, so the shoot bends towards the light (the hormone auxin collects on the shaded side).') },
    ],
    eq: { word: 'shoot → towards light (positive phototropism) · root → down (positive geotropism)', sym: '—' },
    result: { obs: X('In light from one side the shoots bent towards the light; after turning the flask they bent back towards it. The roots always grew downwards.'),
      concl: X('Shoots respond to light by bending towards it, and roots respond to gravity by growing down. These growth movements are tropisms.'), safety: X('Handle the glass flask and wire mesh with care.'),
      viva: [{ q: X('What is phototropism?'), a: X('The bending of a plant part in response to light.') }, { q: X('Which hormone causes the bending?'), a: X('Auxin.') }, { q: X('How do roots respond to gravity?'), a: X('They grow downwards (positive geotropism).') }] },
  },
];
