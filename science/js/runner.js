// Runs one experiment: builds the bench, shows each step (what to do → what you see → why),
// performs it on "Do it" / click / auto-play, or completes it when the student does it by hand in VR.
import * as THREE from 'three';
import { BENCH_Y } from './room.js';
import * as A from './apparatus.js';
import { Kit } from './actions.js';
import { EXPERIMENTS, BY_ID, subjOf } from './experiments.js';
import { chemCheck, snapAll, loadExpect } from './chemcheck.js';
import { I18N, DICT } from './exp_i18n.js';

export const tx = (o, L) => (o ? (o[L] || o.en || '') : '');
const HANDS = new Set(['pouring', 'drop', 'add', 'spoon', 'stir', 'shake', 'swirl']); // things a student does to what is in a vessel

export class Runner {
  constructor(app) {
    this.app = app; this.K = new Kit(app); this.exp = null; this.o = {}; this.i = 0; this.state = 'idle'; this.auto = false;
    this.listeners = [];
    app.lab.listeners.push((e) => this.onLabEvent(e));
    // target marker: a soft ring + bobbing arrow over the item to use next
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 40), new THREE.MeshBasicMaterial({ color: 0xf0a65a, transparent: true, opacity: 0.85, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 11;
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 16), new THREE.MeshBasicMaterial({ color: 0xf0a65a, depthWrite: false })); arrow.rotation.x = Math.PI; arrow.renderOrder = 11;
    this.marker = new THREE.Group(); this.marker.add(ring, arrow); this.marker.visible = false; app.scene.add(this.marker); this.mRing = ring; this.mArrow = arrow;
  }
  on(f) { this.listeners.push(f); }
  changed() { for (const f of this.listeners) f(this); }
  list() { return EXPERIMENTS; }
  // what the student actually got: a step can look at the real state of the bench (check) and, if it differs from the
  // expected result, its "You see" and "Why" are replaced by what really happened and the reason
  isChem() { const e = this.exp; return !!e && subjOf(e) === 'chemistry' && !e.id.startsWith('open_'); }
  judge(i = this.i, partial) {
    const s = this.exp?.steps[i]; if (!s) return; if (s.noCheck) { this.res[i] = null; return; } let chk = s.check; if (!chk && s.ev && s.ev.type === 'focus') chk = focusCheck; if (!chk && s.ev && s.ev.type === 'key') chk = circuitCheck;
    if (!chk && this.isChem()) chk = () => chemCheck(this, i, partial); // chemistry: compare the bench with the method
    const prev = this.res[i];
    if (!chk) { this.res[i] = null; return; } try { const r = chk(this.K, this.o); this.res[i] = r && r.ok === false ? r : null; } catch (err) { console.warn('check', err); this.res[i] = null; }
    if (this.res[i] && (!prev || prev.see?.en !== this.res[i].see?.en)) this.app.lab.emit('mismatch', { step: i });
  }
  // a step finished by hand is judged once the pouring has stopped and things have settled
  settle(now) {
    const p = this.pend; if (!p) return; if (now != null && (now - p.t < 1.4 || now - (this.lastPour ?? -9) < 1.0)) return;
    const before = this.res[p.i]?.see?.en || ''; this.pend = null; this.judge(p.i, true);
    // done by hand but not as the method says (something else put in, something missing): the step stays open. What really
    // happened is shown; the student can put it right, or press Do it
    if (this.res[p.i] && this.hand.has(p.i) && this.done.has(p.i)) { this.done.delete(p.i); this.hand.delete(p.i); if (this.i === p.i && this.state === 'done') { this.state = 'todo'; this.evAcc = 0; } }
    this.changed();
    if (now != null && this.i === p.i && (p.first || before !== (this.res[p.i]?.see?.en || ''))) this.app.onStep && this.app.onStep(this, false, true); // now read out what really happened
  }
  // steps passed over with Next, and steps whose result differs from the method, do not count: the experiment is complete only without them
  incomplete() { const skipped = [], differ = []; (this.exp?.steps || []).forEach((st, i) => { if (!this.done.has(i)) skipped.push(i); else if (this.res && this.res[i]) differ.push(i); }); return { skipped, differ, ok: !skipped.length && !differ.length }; }
  text(key, L) { // experiment text with translation
    const e = this.exp; if (!e) return '';
    const m = /^steps\.(\d+)\.(see|why)$/.exec(key); const rr = m && this.res && this.res[+m[1]];
    if (rr && rr[m[2]]) { const v = rr[m[2]]; const t = typeof v === 'string' ? v : v[L] || v.en; return m[2] === 'see' ? `⚠ ${t}` : t; }
    if (m && this.pend && this.pend.i === +m[1]) return m[2] === 'see' ? ({ hi: 'देखते हैं क्या होता है…', hg: 'Dekhte hain kya hota hai…' }[L] || 'Watching what happens…') : '';
    return this.baseText(key, L);
  }
  baseText(key, L) { // the text as written in the experiment (the book's result)
    const e = this.exp; if (!e) return '';
    const tr = I18N[e.id] || {}; const parts = key.split('.');
    let base = e; for (const p of parts) base = base?.[p];
    let t = tr; for (const p of parts) t = t?.[p];
    if (typeof base === 'string') return (DICT[base] && DICT[base][L]) || base;
    return (t && t[L]) || (base && (base[L] || base.en)) || '';
  }
  async load(id, o = {}) {
    if (this.K) this.K.dispose();
    this.K = new Kit(this.app); this.K.speed = this.app.speed || 1; this.auto = false; // a fresh kit: actions of the old bench simply stop
    this.gen = (this.gen || 0) + 1; this.app.lab.clear(); this.app.fx.glow(null, false);
    this.exp = BY_ID[id]; this.i = 0; this.state = 'todo'; this.done = new Set(); this.hand = new Set(); this.evAcc = 0; this.res = {};
    if (this.app.places) { this.app.places.set(this.exp.place || 'room', { table: this.exp.table }); this.app.places.shadowBox(this.exp.shadowBox || 0); } // Maths Lab: the activity's real place
    this.o = this.exp.setup(this.K); for (const k in this.o) { if (this.o[k] && this.o[k].g) this.o[k].key = k; }
    // a real lab keeps its common reagents on the shelf: if this experiment leaves the shelves empty, stock them (they can be picked up and used too)
    if (this.isChem() && !id.startsWith('open_') && !this.app.lab.items.some((it) => it.g.position.y > BENCH_Y + 0.15)) {
      ['water', 'nacl', 'hcl', 'naoh', 'cuso4', 'limewater'].forEach((sub, i) => { const b = this.K.bottle(sub, -0.86 + i * 0.13, this.app.roomInfo.shelfZ, { shelf: 1, ml: 80 }); b.stock = true; });
    }
    // a lamp or burner on the bench: a box of matches beside it, to light it yourself
    const lamp = this.app.lab.items.find((it) => it.setLit && it.heatPoint);
    if (lamp && !this.app.lab.items.some((it) => it.kind === 'matchbox')) { const p = lamp.g.getWorldPosition(new THREE.Vector3()); this.K.add(A.matchbox(), Math.max(-1.15, Math.min(1.15, p.x + (p.x > 0.9 ? -0.13 : 0.13))), -0.45); }
    // compile the new apparatus' shaders in the background so the first frames with it do not stall (no freeze in the headset)
    // (without KHR_parallel_shader_compile, as in the Quest browser, compileAsync would poll for ever: there a plain compile
    // starts the work early instead)
    try { const R = this.app.renderer; if (R.extensions.has('KHR_parallel_shader_compile') && R.compileAsync) R.compileAsync(this.app.scene, this.app.camera).catch(() => {}); else R.compile(this.app.scene, this.app.camera); } catch (e) { /* older three */ }
    this.pend = null; this.base = snapAll(this.o); if (this.isChem()) loadExpect(); if (this.app.recHook) this.app.recHook(this, true);
    // vessels named "Beaker A — …" / "Test tube B — …" get a sticker with their letter
    for (const it of this.app.lab.vessels) { const n = it.name && it.name.en; const m = n && n.match(/^(?:Beaker|Test tube|Tube)\s+([A-E1-5])\b/); if (m && !it.stickerMesh) this.K.sticker(it, m[1]); else if (it.tag && !it.stickerMesh) this.K.sticker(it, it.tag); }
    this.app.chem.lapse = 1; this.app.boardFor(this.exp);
    this.changed(); this.app.onStep && this.app.onStep(this, true);
    if (o.auto) this.play();
  }
  step() { return this.exp?.steps[this.i]; }
  target() { const s = this.step(); return s && this.o[s.target]; }
  async doStep(o = {}) {
    if (!this.exp || this.state === 'doing') return;
    const s = this.step(); if (!s) return;
    if (this.state === 'done') { this.next(); return; }
    this.state = 'doing'; this.changed(); const gen = this.gen;
    try { if (s.act) await s.act(this.K, this.o); } catch (err) { console.warn('step failed', err); }
    if (gen === this.gen && this.state === 'doing') this.finish();
  }
  finish(byHand) {
    if (this.state === 'done' || this.state === 'finished') return;
    if (this.app.recHook) this.app.recHook(this);
    if (byHand && this.isChem()) { this.res[this.i] = null; this.pend = { i: this.i, t: this.app.lab.t ?? 0, first: true }; } else this.judge();
    this.state = 'done'; this.done.add(this.i); if (byHand) this.hand.add(this.i); else this.hand.delete(this.i); this.changed();
    if (!this.pend) this.app.onStep && this.app.onStep(this, false, true);
    if (this.auto) this.autoNext();
  }
  next() {
    if (!this.exp) return;
    this.settle(); this.base = snapAll(this.o); // judge a step left pending, then remember the bench as the next step starts
    if (this.i < this.exp.steps.length - 1) { this.i++; this.state = this.done.has(this.i) ? 'done' : 'todo'; this.evAcc = 0; this.changed(); this.app.onStep && this.app.onStep(this, false); if (this.auto && this.state === 'todo') this.doStep(); }
    else { this.state = 'finished'; this.auto = false; this.changed(); this.app.onFinished && this.app.onFinished(this); }
  }
  async prev() { // rebuild the bench and fast-forward to the previous step
    if (!this.exp || this.i === 0) return;
    const target = this.i - 1; const id = this.exp.id;
    this.app.muted = true; await this.load(id); this.K.speed = 40; const gen = this.gen;
    for (let k = 0; k < target; k++) { const s = this.exp.steps[k]; this.state = 'doing'; this.i = k; this.changed(); if (s.act) await s.act(this.K, this.o); if (gen !== this.gen) return; this.done.add(k); this.i = k + 1; }
    this.K.speed = this.app.speed || 1; this.app.muted = false; this.state = 'todo'; this.base = snapAll(this.o); this.changed(); this.app.onStep && this.app.onStep(this, false);
  }
  play() { this.auto = true; this.changed(); if (this.state === 'todo') this.doStep(); else if (this.state === 'done') this.autoNext(); }
  pause() { this.auto = false; this.changed(); }
  async autoNext() { await this.app.waitNarration(); if (this.auto && this.state === 'done') this.next(); }
  reset() { if (this.exp) this.load(this.exp.id); }
  // a student did something by hand: see if it completes the current step
  onLabEvent(e) {
    if (e.type === 'pouring' || e.type === 'drop') this.lastPour = this.app.lab.t ?? 0;
    // still working on a finished chemistry step (the second part of it, or something more): look again once the student stops
    if (this.state === 'done' && this.isChem() && HANDS.has(e.type) && (e.type !== 'pouring' || e.to)) this.pend = { i: this.i, t: this.app.lab.t ?? 0, first: !!(this.pend && this.pend.first) };
    const s = this.step(); if (!s || !s.ev || this.state !== 'todo') return;
    const ev = s.ev; let type = e.type;
    if (ev.type === 'pour' && e.type === 'pouring' && e.to) type = 'pour'; // pouring by hand counts as the step's pour
    if ((ev.type === 'drops' || ev.type === 'drop') && e.type === 'drop' && e.from) type = ev.type; // so do drops from a dropper bottle tilted by hand
    if (ev.type !== type) return;
    const id = (k) => this.o[k]?.id;
    if (ev.to && e.to !== id(ev.to)) return; if (ev.from && e.from !== id(ev.from)) return; if (ev.in && e.in !== id(ev.in)) return; if (ev.v && e.v !== id(ev.v)) return;
    const hand = type !== e.type;
    if (hand && ev.type === 'pour') { this.evAcc += e.ml || 0; if (this.evAcc < (ev.ml ? ev.ml * 0.5 : 1)) return; }
    else if (hand) { this.evAcc += 1; if (this.evAcc < (ev.n ?? 1)) return; }
    else if (ev.ml) { this.evAcc += e.ml || 0; if (this.evAcc < ev.ml) return; }
    if (ev.sec && (e.sec || 0) < ev.sec) return;
    if (s.until && !s.until(this.K, this.o)) return; // e.g. drop by drop until the pink just disappears
    this.finish(true);
  }
  update(dt, t) {
    if (this.pend) this.settle(this.app.lab.t ?? t);
    const tg = this.state === 'todo' ? this.target() : null;
    this.marker.visible = !!tg && !this.app.hideMarker;
    if (tg) {
      const b = new THREE.Box3().setFromObject(tg.g); const c = b.getCenter(new THREE.Vector3());
      this.mRing.position.set(c.x, b.min.y + 0.002, c.z); const r = Math.max(0.02, Math.min(0.09, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) * 0.62));
      this.mRing.scale.setScalar(r / 0.033 * (1 + Math.sin(t * 4) * 0.05)); this.mArrow.position.set(c.x, b.max.y + 0.04 + Math.sin(t * 4) * 0.01, c.z);
    }
  }
}
// after closing the key of a circuit with an ammeter, current should flow the right way through the meter
function circuitCheck(K, o) {
  const items = Object.values(o).filter((it) => it && it.g); const keys = items.filter((it) => it.kind === 'key'); if (!keys.length || !keys.some((k) => k.on)) return null;
  const am = items.find((it) => it.meterKind === 'A'); const blown = items.find((it) => it.fused || it.burnt);
  if (blown) return { ok: false, see: { en: 'Nothing works: a lamp or LED in the circuit has burnt out.', hi: 'कुछ भी काम नहीं कर रहा: सर्किट का कोई लैंप या LED फ़्यूज़ हो गया है।', hg: 'Kuch bhi kaam nahi kar raha: circuit ka koi lamp ya LED fuse ho gaya hai.' },
    why: { en: 'Too much current melted its filament, so the circuit is now broken at that point. Replace it and use the correct cell voltage.', hi: 'ज़्यादा करंट से उसका फ़िलामेंट पिघल गया, इसलिए सर्किट उस जगह से टूट गया है। उसे बदलिए और सही वोल्टेज वाला सेल लगाइए।', hg: 'Zyada current se uska filament pighal gaya, isliye circuit us jagah se toot gaya hai. Use badliye aur sahi voltage wala cell lagaiye.' } };
  if (!am) return null; const I = am.Is ?? 0;
  if (I < -1e-4) return { ok: false, see: { en: 'The ammeter needle moves the wrong way, below zero.', hi: 'ऐमीटर की सुई उल्टी तरफ़, ज़ीरो से नीचे जाती है।', hg: 'Ammeter ki sui ulti taraf, zero se neeche jaati hai.' },
    why: { en: 'Its + and − terminals are connected the wrong way round. The + terminal of a meter must go towards the + terminal of the cell.', hi: 'इसके + और − टर्मिनल उल्टे जुड़ गए हैं। मीटर का + टर्मिनल सेल के + टर्मिनल की तरफ़ जुड़ना चाहिए।', hg: 'Iske + aur − terminals ulte jud gaye hain. Meter ka + terminal cell ke + terminal ki taraf judna chahiye.' } };
  if (Math.abs(I) < 1e-4) return { ok: false, see: { en: 'The ammeter reads zero: no current flows.', hi: 'ऐमीटर ज़ीरो दिखा रहा है: कोई करंट नहीं बह रहा।', hg: 'Ammeter zero dikha raha hai: koi current nahi beh raha.' },
    why: { en: 'The circuit is open somewhere — a loose wire, a wire on the wrong terminal, or a gap. Current flows only round a complete, closed path.', hi: 'सर्किट कहीं से खुला है — कोई ढीला तार, ग़लत टर्मिनल पर लगा तार, या कहीं गैप। करंट सिर्फ़ पूरे, बंद रास्ते में ही बहता है।', hg: 'Circuit kahin se khula hai — koi dheela taar, galat terminal par laga taar, ya kahin gap. Current sirf poore, band raaste mein hi behta hai.' } };
  return { ok: true };
}
// a screen should show a sharp image after a "find the sharp image" step
function focusCheck(K, o) {
  const scr = Object.values(o).find((it) => it && it.g && it.sharp != null && it.img !== undefined); if (!scr) return null;
  if (!scr.img) return { ok: false, see: { en: 'No image forms on your screen: the light does not reach it from this position.', hi: 'आपके पर्दे पर कोई प्रतिबिंब नहीं बन रहा: इस जगह से रोशनी उस तक नहीं पहुँचती।', hg: 'Aapke screen par koi image nahi ban rahi: is jagah se light us tak nahi pahunchti.' },
    why: { en: 'A lens or mirror forms a real image only on one side and at one distance; for a virtual image there is nothing to catch on a screen.', hi: 'लेंस या दर्पण असली (वास्तविक) प्रतिबिंब सिर्फ़ एक तरफ़ और एक तय दूरी पर ही बनाता है; आभासी प्रतिबिंब को पर्दे पर पकड़ा ही नहीं जा सकता।', hg: 'Lens ya mirror real image sirf ek taraf aur ek fixed distance par hi banata hai; virtual image ko screen par pakda hi nahi ja sakta.' } };
  if (scr.sharp >= 0.72) return { ok: true };
  const pc = Math.round(scr.sharp * 100); const v = scr.img.v != null && isFinite(scr.img.v) ? Math.abs(scr.img.v * 100).toFixed(1) : '—';
  return { ok: false, see: { en: `The image on your screen is blurred (sharpness ${pc} %).`, hi: `आपके पर्दे पर प्रतिबिंब धुंधला बन रहा है (${pc} % साफ़)।`, hg: `Aapke screen par image dhundhli ban rahi hai (sharpness ${pc} %).` },
    why: { en: `The sharp image forms about ${v} cm from the lens or mirror, and your screen is not there. Slide the screen slowly to and fro until the image is sharpest.`, hi: `साफ़ प्रतिबिंब लेंस या दर्पण से लगभग ${v} cm दूर बनता है, और आपका पर्दा वहाँ नहीं है। पर्दे को धीरे-धीरे आगे-पीछे खिसकाइए, जब तक प्रतिबिंब सबसे साफ़ न दिखने लगे।`, hg: `Saaf image lens ya mirror se lagbhag ${v} cm door banti hai, aur aapka screen wahan nahi hai. Screen ko dheere-dheere aage-peeche khiskaiye, jab tak image sabse saaf na dikhne lage.` } };
}
export { EXPERIMENTS };
