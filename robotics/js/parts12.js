// DUET Robotics Lab 360, batch 12: two new parts for the Class 1 battery circuits (circuits.js), as data (same shape as parts.js).
//   sample    a thing to test between two crocodile clips: a steel spoon, a coin, a pencil (its graphite core), a plastic ruler,
//             a rubber eraser or a wooden ice-cream stick. Metals and graphite conduct; plastic, rubber and wood do not.
//             Its callout has a list to swap the thing (ctl.select), as a child swaps it between the clips.
//   buzzwire  the steady-hand game: a wavy steel wire between two posts, and a ring on a handle around it. The ring touching
//             the wire closes the loop (a switch between W and R). Move the ring with its slider or by dragging it: slow and
//             steady through the bends and it never touches; hurry through a bend and it does.
// The motor gets a new look too: props { disc: true } puts Newton's colour disc on it in place of the fan (models12.js), and
// the heavier disc spins up and down more slowly (sim.js: MOTOR.J × 4).
import { tx } from './i18n.js';
const P = 2.54;
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t3 = (en, hi, hg) => ({ en, hi, hg });

// what each sample is, its resistance between the clips, and its name
export const SAMPLES = {
  spoon: { r: 0.05, ok: true, name: t3('Steel spoon', 'स्टील की चम्मच', 'Steel ki chammach') },
  coin: { r: 0.02, ok: true, name: t3('Coin', 'सिक्का', 'Sikka') },
  pencil: { r: 4, ok: true, name: t3('Pencil (graphite core)', 'पेंसिल (ग्रेफ़ाइट वाला बीच)', 'Pencil (graphite wala beech)') },
  ruler: { r: 1e12, ok: false, name: t3('Plastic ruler', 'प्लास्टिक का स्केल', 'Plastic ka scale') },
  eraser: { r: 1e12, ok: false, name: t3('Rubber eraser', 'रबड़', 'Rubber') },
  stick: { r: 1e12, ok: false, name: t3('Wooden ice-cream stick', 'लकड़ी की आइसक्रीम स्टिक', 'Lakdi ki ice-cream stick') },
};
// the three bends of the buzz wire, as parts of its length (0 = the start rest, 1 = the end rest)
export const BENDS = [[0.14, 0.3], [0.42, 0.58], [0.7, 0.86]];
const FAST = 0.16; // faster than this (lengths per second) through a bend, and the ring touches the wire

export const PARTS12 = {
  sample: {
    cat: 'basic', mount: 'bb', props: { mat: 'spoon' },
    name: t3('Test sample (conductor or insulator?)', 'जाँच की चीज़ (चालक या कुचालक?)', 'Jaanch ki cheez (chaalak ya kuchaalak?)'),
    pins: [{ id: '1', at: [0, 0], name: t3('Crocodile clip 1', 'मगरमच्छ क्लिप 1', 'Crocodile clip 1') }, { id: '2', at: [4 * P, 0], name: t3('Crocodile clip 2', 'मगरमच्छ क्लिप 2', 'Crocodile clip 2') }],
    elec: (p, N) => [{ type: 'R', a: N['1'], b: N['2'], r: (SAMPLES[p.props.mat] || SAMPLES.spoon).r, role: 'res' }],
    live: (p) => { const s = SAMPLES[p.props.mat] || SAMPLES.spoon; return s.ok ? '✓ conductor' : '✗ insulator'; },
    controls: (p) => `<div class="row"><label>${esc(tx(t3('Thing to test', 'जाँचने की चीज़', 'Jaanchne ki cheez')))}</label><select id="co-mat">${Object.keys(SAMPLES).map((k) => `<option value="${k}"${k === p.props.mat ? ' selected' : ''}>${esc(tx(SAMPLES[k].name))}</option>`).join('')}</select></div>`,
    bind: (p, el, app) => { const s = el.querySelector('#co-mat'); if (s) s.onchange = () => { app.lab.setProps(p, { mat: s.value }); app.renderCallout(); app.stage.kick(); }; },
    specs: (p) => [['what', (SAMPLES[p.props.mat] || SAMPLES.spoon).name.en], ['ohms', (SAMPLES[p.props.mat] || SAMPLES.spoon).ok ? 'a few Ω or less' : 'millions of MΩ']],
    info: t3('Two crocodile clips hold the thing you test. If it lets electricity through (a conductor: metals, and the graphite inside a pencil), the loop is closed and the LED glows. Plastic, rubber and wood are insulators: the LED stays dark. Tap it to swap the thing.',
      'दो मगरमच्छ क्लिप जाँचने वाली चीज़ को पकड़ते हैं। अगर वह बिजली जाने देती है (चालक: धातुएँ, और पेंसिल के अंदर का ग्रेफ़ाइट), तो रास्ता बंद होता है और एलईडी चमकती है। प्लास्टिक, रबड़ और लकड़ी कुचालक हैं: एलईडी बुझी रहती है। चीज़ बदलने के लिए इसे छूइए।',
      'Do crocodile clip jaanchne wali cheez ko pakadte hain. Agar woh bijli jaane deti hai (chaalak: dhaatuein, aur pencil ke andar ka graphite), to raasta band hota hai aur LED chamakti hai. Plastic, rubber aur lakdi kuchaalak hain: LED bujhi rehti hai. Cheez badalne ke liye ise touch karo.'),
  },
  buzzwire: {
    term: { y: 1.5 }, cat: 'in', mount: 'free', props: {}, state0: { pos: 0, touch: false, hits: 0, end: false, tt: 0, last: 0, v: 0 },
    name: t3('Buzz wire (steady-hand game)', 'बज़ वायर (स्थिर हाथ का खेल)', 'Buzz wire (steady haath ka khel)'),
    pins: [{ id: 'W', at: [0, 0], name: t3('The wavy wire', 'लहरदार तार', 'Lehardaar wire') }, { id: 'R', at: [2 * P, 0], name: t3('The ring on its handle', 'हैंडल वाला छल्ला', 'Handle wala chhalla') }],
    elec: (p, N) => [{ type: 'SW', a: N.W, b: N.R, on: !!p.state.touch, role: 'sw' }],
    dyn: (p, els, lab, dt) => {
      const s = p.state; const pos = Math.max(0, Math.min(1, s.pos || 0));
      const v = dt > 0 ? Math.abs(pos - (s.last || 0)) / dt : 0; s.last = pos;
      s.v = v > s.v ? v : s.v * Math.exp(-dt / 0.25); // the hand's speed, held a moment (a quick jerk still counts)
      const bend = BENDS.findIndex(([a, b]) => pos >= a && pos <= b); // past a bend, the ring is clear of the wire again
      if (bend >= 0 && s.v > FAST && pos < 0.98) { if (!s.touch || s.bend !== bend) s.hits = (s.hits || 0) + 1; s.touch = true; s.tt = 0.25; s.bend = bend; }
      else if (s.touch) { s.tt -= dt; if (s.tt <= 0 || bend < 0) s.touch = false; }
      if (pos >= 0.98) s.end = true;
      if (pos <= 0.02) s.end = false;
    },
    live: (p) => `${Math.round((p.state.pos || 0) * 100)}% · ${p.state.touch ? 'TOUCH!' : 'clear'} · ${p.state.hits || 0}`,
    controls: (p, T, R) => R('co-ring', tx(t3('Move the ring along', 'छल्ले को आगे बढ़ाइए', 'Chhalle ko aage badhaiye')), 0, 100, Math.round((p.state.pos || 0) * 100)),
    bind: (p, el, app) => { const r = el.querySelector('#co-ring'), o = el.querySelector('#co-ring-v'); const show = () => { if (o) o.textContent = r.value + '%'; }; if (r) { show(); r.oninput = () => { p.state.pos = +r.value / 100; show(); app.lab.stateV++; app.stage.kick(); }; } },
    specs: () => [['wire', 'bare steel, 3 bends'], ['ring', 'steel ring on a wooden handle'], ['rests', 'insulated tape at both ends']],
    info: t3('The fairground game. The wavy wire and the ring are two ends of an open loop: touch them together and the buzzer sounds. Drag the ring (or use the slider) from the start rest to the end rest. Slowly through the bends!',
      'मेले वाला खेल। लहरदार तार और छल्ला एक खुले रास्ते के दो सिरे हैं: इन्हें छुआइए और बज़र बजता है। छल्ले को खींचकर (या स्लाइडर से) शुरू वाले टिकाव से आख़िरी टिकाव तक ले जाइए। मोड़ों पर धीरे-धीरे!',
      'Mele wala khel. Lehardaar wire aur chhalla ek khule raaste ke do sire hain: inhe chhuaiye aur buzzer bajta hai. Chhalle ko kheench kar (ya slider se) shuru wale tikaav se aakhri tikaav tak le jaiye. Modon par dheere-dheere!'),
  },
};
export const DRAWER12 = ['sample', 'buzzwire'];
