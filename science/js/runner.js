// Runs one experiment: builds the bench, shows each step (what to do → what you see → why),
// performs it on "Do it" / click / auto-play, or completes it when the student does it by hand in VR.
import * as THREE from 'three';
import { Kit } from './actions.js';
import { EXPERIMENTS, BY_ID } from './experiments.js';
import { I18N, DICT } from './exp_i18n.js';

export const tx = (o, L) => (o ? (o[L] || o.en || '') : '');

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
  judge() {
    const s = this.step(); if (!s) return; if (s.noCheck) { this.res[this.i] = null; return; } let chk = s.check; if (!chk && s.ev && s.ev.type === 'focus') chk = focusCheck; if (!chk && s.ev && s.ev.type === 'key') chk = circuitCheck;
    if (!chk) { this.res[this.i] = null; return; } try { const r = chk(this.K, this.o); this.res[this.i] = r && r.ok === false ? r : null; } catch (err) { console.warn('check', err); this.res[this.i] = null; }
    if (this.res[this.i]) this.app.lab.emit('mismatch', { step: this.i });
  }
  text(key, L) { // experiment text with translation
    const e = this.exp; if (!e) return '';
    const m = /^steps\.(\d+)\.(see|why)$/.exec(key); const rr = m && this.res && this.res[+m[1]];
    if (rr && rr[m[2]]) { const v = rr[m[2]]; const t = typeof v === 'string' ? v : v[L] || v.en; return m[2] === 'see' ? `⚠ ${t}` : t; }
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
    this.exp = BY_ID[id]; this.i = 0; this.state = 'todo'; this.done = new Set(); this.evAcc = 0; this.res = {};
    this.o = this.exp.setup(this.K); for (const k in this.o) { if (this.o[k] && this.o[k].g) this.o[k].key = k; }
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
  finish() {
    if (this.state === 'done' || this.state === 'finished') return;
    this.judge(); this.state = 'done'; this.done.add(this.i); this.changed();
    this.app.onStep && this.app.onStep(this, false, true);
    if (this.auto) this.autoNext();
  }
  next() {
    if (!this.exp) return;
    if (this.i < this.exp.steps.length - 1) { this.i++; this.state = this.done.has(this.i) ? 'done' : 'todo'; this.evAcc = 0; this.changed(); this.app.onStep && this.app.onStep(this, false); if (this.auto && this.state === 'todo') this.doStep(); }
    else { this.state = 'finished'; this.auto = false; this.changed(); this.app.onFinished && this.app.onFinished(this); }
  }
  async prev() { // rebuild the bench and fast-forward to the previous step
    if (!this.exp || this.i === 0) return;
    const target = this.i - 1; const id = this.exp.id;
    this.app.muted = true; await this.load(id); this.K.speed = 40; const gen = this.gen;
    for (let k = 0; k < target; k++) { const s = this.exp.steps[k]; this.state = 'doing'; this.i = k; this.changed(); if (s.act) await s.act(this.K, this.o); if (gen !== this.gen) return; this.done.add(k); this.i = k + 1; }
    this.K.speed = this.app.speed || 1; this.app.muted = false; this.state = 'todo'; this.changed(); this.app.onStep && this.app.onStep(this, false);
  }
  play() { this.auto = true; this.changed(); if (this.state === 'todo') this.doStep(); else if (this.state === 'done') this.autoNext(); }
  pause() { this.auto = false; this.changed(); }
  async autoNext() { await this.app.waitNarration(); if (this.auto && this.state === 'done') this.next(); }
  reset() { if (this.exp) this.load(this.exp.id); }
  // a student did something by hand: see if it completes the current step
  onLabEvent(e) {
    const s = this.step(); if (!s || !s.ev || this.state !== 'todo') return;
    const ev = s.ev; if (ev.type !== e.type) return;
    const id = (k) => this.o[k]?.id;
    if (ev.to && e.to !== id(ev.to)) return; if (ev.from && e.from !== id(ev.from)) return; if (ev.in && e.in !== id(ev.in)) return; if (ev.v && e.v !== id(ev.v)) return;
    if (ev.ml) { this.evAcc += e.ml || 0; if (this.evAcc < ev.ml) return; }
    if (ev.sec && (e.sec || 0) < ev.sec) return;
    this.finish();
  }
  update(dt, t) {
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
  if (blown) return { ok: false, see: { en: 'Nothing works: a lamp or LED in the circuit has burnt out.', hi: 'कुछ काम नहीं करता: परिपथ का एक लैंप या LED जल चुका है।', hg: 'Kuch kaam nahi karta: circuit ka ek lamp ya LED jal chuka hai.' },
    why: { en: 'Too much current melted its filament, so the circuit is now broken at that point. Replace it and use the correct cell voltage.', hi: 'अधिक धारा से उसका तंतु पिघल गया, इसलिए परिपथ वहाँ टूट गया है। उसे बदलिए और सही वोल्टता का सेल लगाइए।', hg: 'Zyada current se uska filament pighal gaya, isliye circuit wahan toot gaya hai. Use badliye aur sahi voltage ka cell lagaiye.' } };
  if (!am) return null; const I = am.Is ?? 0;
  if (I < -1e-4) return { ok: false, see: { en: 'The ammeter needle moves the wrong way, below zero.', hi: 'ऐमीटर की सुई उल्टी दिशा में, शून्य से नीचे जाती है।', hg: 'Ammeter ki sui ulti direction mein, zero se neeche jaati hai.' },
    why: { en: 'Its + and − terminals are connected the wrong way round. The + terminal of a meter must go towards the + terminal of the cell.', hi: 'उसके + और − टर्मिनल उल्टे जुड़े हैं। मीटर का + टर्मिनल सेल के + टर्मिनल की ओर जुड़ना चाहिए।', hg: 'Uske + aur − terminals ulte jude hain. Meter ka + terminal cell ke + terminal ki taraf judna chahiye.' } };
  if (Math.abs(I) < 1e-4) return { ok: false, see: { en: 'The ammeter reads zero: no current flows.', hi: 'ऐमीटर शून्य पढ़ता है: कोई धारा नहीं बहती।', hg: 'Ammeter zero padhta hai: koi current nahi behta.' },
    why: { en: 'The circuit is open somewhere — a loose wire, a wire on the wrong terminal, or a gap. Current flows only round a complete, closed path.', hi: 'परिपथ कहीं खुला है — कोई ढीला तार, ग़लत टर्मिनल पर लगा तार, या कोई खाली जगह। धारा केवल पूरे, बंद रास्ते में ही बहती है।', hg: 'Circuit kahin khula hai — koi loose wire, galat terminal par laga wire, ya koi gap. Current sirf poore, band raaste mein hi behta hai.' } };
  return { ok: true };
}
// a screen should show a sharp image after a "find the sharp image" step
function focusCheck(K, o) {
  const scr = Object.values(o).find((it) => it && it.g && it.sharp != null && it.img !== undefined); if (!scr) return null;
  if (!scr.img) return { ok: false, see: { en: 'No image forms on your screen: the light does not reach it from this position.', hi: 'आपके पर्दे पर कोई प्रतिबिंब नहीं बनता: इस जगह से प्रकाश उस तक नहीं पहुँचता।', hg: 'Aapke screen par koi image nahi banti: is jagah se light us tak nahi pahunchti.' },
    why: { en: 'A lens or mirror forms a real image only on one side and at one distance; for a virtual image there is nothing to catch on a screen.', hi: 'लेंस या दर्पण वास्तविक प्रतिबिंब केवल एक ओर और एक निश्चित दूरी पर बनाता है; आभासी प्रतिबिंब पर्दे पर नहीं आता।', hg: 'Lens ya mirror real image sirf ek taraf aur ek fixed distance par banata hai; virtual image screen par nahi aati.' } };
  if (scr.sharp >= 0.72) return { ok: true };
  const pc = Math.round(scr.sharp * 100); const v = scr.img.v != null && isFinite(scr.img.v) ? Math.abs(scr.img.v * 100).toFixed(1) : '—';
  return { ok: false, see: { en: `The image on your screen is blurred (sharpness ${pc} %).`, hi: `आपके पर्दे पर प्रतिबिंब धुँधला है (स्पष्टता ${pc} %)।`, hg: `Aapke screen par image blurred hai (sharpness ${pc} %).` },
    why: { en: `The sharp image forms about ${v} cm from the lens or mirror, and your screen is not there. Slide the screen slowly to and fro until the image is sharpest.`, hi: `स्पष्ट प्रतिबिंब लेंस या दर्पण से लगभग ${v} सेमी पर बनता है, और आपका पर्दा वहाँ नहीं है। पर्दे को धीरे-धीरे आगे-पीछे खिसकाइए जब तक प्रतिबिंब सबसे स्पष्ट न हो जाए।`, hg: `Sharp image lens ya mirror se lagbhag ${v} cm par banti hai, aur aapka screen wahan nahi hai. Screen ko dheere-dheere aage-peeche kijiye jab tak image sabse sharp na ho jaye.` } };
}
export { EXPERIMENTS };
