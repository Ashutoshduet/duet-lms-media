// DUET Robotics Lab 360: the helper (🛟 Help on the step card), so a student is never stuck without a teacher.
// First it looks at the bench and the code for what is wrong right now (free, like "Check my circuit"):
//   no power · the board's fuse (a short) · burnt parts and why · a run-time error · the code changed but not run ·
//   the sketch not running · an LED the wrong way round · a part with both legs in one strip · the Serial Monitor's speed ·
//   the lesson's own circuit check
// Then three hints for the step in hand, each a little more (the 2nd and 3rd count as hints in the score):
//   1 what to do · 2 exactly where (the hole, the two pins, the line to change) · 3 do it for me (place the part, make the
//   wire, change the code), so the student sees the answer and goes on.
// In a 🏁 Challenge the helper is off.
import { tx, msg } from './i18n.js';
import { PARTS } from './parts.js';
import { sheet, closeSheet, esc, t3 } from './schoolkit.js';

const S = {
  btn: t3('🛟 Help', '🛟 मदद', '🛟 Madad'), title: t3('Help: what is wrong?', 'मदद: क्या ग़लत है?', 'Madad: kya galat hai?'),
  allGood: t3('Nothing looks wrong on the bench. Here is help for this step:', 'बेंच पर कुछ ग़लत नहीं दिखता। इस क़दम के लिए मदद:', 'Bench par kuch galat nahi dikhta. Is step ke liye madad:'),
  found: t3('I found this:', 'मुझे यह मिला:', 'Mujhe ye mila:'),
  h1: t3('Hint 1', 'संकेत 1', 'Hint 1'), h2: t3('Hint 2: show me where', 'संकेत 2: कहाँ, यह दिखाइए', 'Hint 2: kahan, ye dikhaiye'), h3: t3('Hint 3: do it for me', 'संकेत 3: मेरे लिए कर दीजिए', 'Hint 3: mere liye kar dijiye'),
  costs: t3('(a hint lowers the score a little)', '(संकेत से अंक थोड़े घटते हैं)', '(hint se score thoda kam hota hai)'),
  off: t3('🏁 This is a challenge: no help. You can do it!', '🏁 यह चुनौती है: मदद नहीं। आप कर सकते हैं!', '🏁 Ye challenge hai: madad nahi. Aap kar sakte ho!'),
  noPower: t3('The board has no power: its USB cable (or battery) is not connected.', 'बोर्ड को बिजली नहीं: उसका USB केबल (या बैटरी) नहीं जुड़ा।', 'Board ko power nahi: uska USB cable (ya battery) nahi juda.'),
  fuse: t3('The board switched itself off: too much current. A wire joins 5V (or 3.3V) straight to GND somewhere: find it and take it out, then press Replace burnt parts.', 'बोर्ड ने ख़ुद को बंद कर दिया: बहुत ज़्यादा करंट। कहीं कोई तार 5V (या 3.3V) को सीधे GND से जोड़ रहा है: उसे ढूँढकर निकालिए, फिर "जले पुर्ज़े बदलिए" दबाइए।', 'Board ne khud ko band kar diya: bahut zyada current. Kahin koi wire 5V (ya 3.3V) ko seedhe GND se jod raha hai: use dhoondh ke nikaliye, phir Replace burnt parts dabaiye.'),
  burnt: t3('{p} burnt out: too much current went through it. {why} Fix the circuit, then press "Replace burnt parts".', '{p} जल गया: इसमें से बहुत करंट गया। {why} सर्किट ठीक कीजिए, फिर "जले पुर्ज़े बदलिए" दबाइए।', '{p} jal gaya: isme se bahut current gaya. {why} Circuit theek kijiye, phir "Replace burnt parts" dabaiye.'),
  ledWhy: t3('An LED always needs a resistor (220 Ω) in its path.', 'LED के रास्ते में हमेशा एक रेज़िस्टर (220 Ω) चाहिए।', 'LED ke raaste me hamesha ek resistor (220 Ω) chahiye.'),
  runtime: t3('The program stopped with an error: {m}', 'प्रोग्राम एक त्रुटि के साथ रुक गया: {m}', 'Program ek error ke saath ruk gaya: {m}'),
  edited: t3('You changed the code but did not upload it: press Run so the board gets the new program.', 'आपने कोड बदला पर अपलोड नहीं किया: Run दबाइए ताकि बोर्ड को नया प्रोग्राम मिले।', 'Aapne code badla par upload nahi kiya: Run dabaiye taki board ko naya program mile.'),
  notRunning: t3('The program is not running: press the green Run button.', 'प्रोग्राम नहीं चल रहा: हरा Run बटन दबाइए।', 'Program nahi chal raha: hara Run button dabaiye.'),
  reversed: t3('The {p} is the wrong way round: its long leg (+) must go towards the pin, the short leg (−) towards GND. Turn it round (R while dragging).', '{p} उल्टी लगी है: लंबा पैर (+) पिन की ओर, छोटा पैर (−) GND की ओर होना चाहिए। उसे घुमाइए (खींचते समय R)।', '{p} ulti lagi hai: lamba pair (+) pin ki taraf, chhota pair (−) GND ki taraf hona chahiye. Use ghumaiye (drag karte waqt R).'),
  sameStrip: t3('Both legs of the {p} are in the same row of 5 holes, so they touch each other and nothing flows through it. Put the legs in two different rows.', '{p} के दोनों पैर 5 छेदों की एक ही पंक्ति में हैं, इसलिए आपस में छू रहे हैं और इसमें से कुछ नहीं बहता। पैरों को दो अलग पंक्तियों में लगाइए।', '{p} ke dono pair 5 chhedon ki ek hi row me hain, isliye aapas me chhoo rahe hain aur isme se kuch nahi behta. Pairon ko do alag rows me lagaiye.'),
  baud: t3('The Serial Monitor listens at {a} baud but the program talks at {b}: choose {b} under the Serial Monitor.', 'Serial Monitor {a} बॉड पर सुन रहा है पर प्रोग्राम {b} पर बोलता है: Serial Monitor के नीचे {b} चुनिए।', 'Serial Monitor {a} baud par sun raha hai par program {b} par bolta hai: Serial Monitor ke neeche {b} chuniye.'),
  check: t3('Circuit check: {m}', 'सर्किट जाँच: {m}', 'Circuit check: {m}'),
  compile: t3('The code has an error on line {n}: {m}', 'कोड की पंक्ति {n} में त्रुटि है: {m}', 'Code ki line {n} me error hai: {m}'),
  // the step in hand
  placeDo: t3('Find the {p} in the Parts list on the left and drag it onto the breadboard, where its blue ghost shows.', 'बाईं ओर पुर्ज़ों की सूची में {p} ढूँढिए और उसे ब्रेडबोर्ड पर, जहाँ नीली परछाईं दिख रही है, वहाँ खींचकर लाइए।', 'Left side Parts list me {p} dhoondhiye aur use breadboard par, jahan neeli parchhai dikh rahi hai, wahan kheench ke laiye.'),
  placeWhere: t3('Its first leg goes in hole {h} (row {r}, column {c}).', 'उसका पहला पैर छेद {h} में जाता है (पंक्ति {r}, कॉलम {c})।', 'Uska pehla pair chhed {h} me jaata hai (row {r}, column {c}).'),
  placeDone: t3('Placed it for you. Look where it sits, then go on.', 'आपके लिए लगा दिया। देखिए यह कहाँ लगा है, फिर आगे बढ़िए।', 'Aapke liye laga diya. Dekhiye ye kahan laga hai, phir aage badhiye.'),
  wireDo: t3('Take the Wire tool (〰), then join the two places this step names with one wire.', 'तार वाला औज़ार (〰) लीजिए, फिर इस क़दम में बताई दो जगहों को एक तार से जोड़िए।', 'Wire tool (〰) lijiye, phir is step me batayi do jagahon ko ek wire se jodiye.'),
  wireWhere: t3('Click {a}, then click {b}. The dotted line on the bench shows the way.', 'पहले {a} पर क्लिक कीजिए, फिर {b} पर। बेंच पर बिंदुदार रेखा रास्ता दिखाती है।', 'Pehle {a} par click kijiye, phir {b} par. Bench par dotted line raasta dikhati hai.'),
  wireDone: t3('Made the wire for you: {a} → {b}.', 'आपके लिए तार जोड़ दिया: {a} → {b}।', 'Aapke liye wire jod diya: {a} → {b}.'),
  editWhere: t3('Change these lines (marked yellow in the code): {l}', 'ये पंक्तियाँ बदलिए (कोड में पीली): {l}', 'Ye lines badaliye (code me peeli): {l}'),
  editDone: t3('Changed the code for you. Now press Run.', 'आपके लिए कोड बदल दिया। अब Run दबाइए।', 'Aapke liye code badal diya. Ab Run dabaiye.'),
  runDo: t3('Press the green Run button: the code is checked and sent to the board.', 'हरा Run बटन दबाइए: कोड जाँचा जाता है और बोर्ड में भेजा जाता है।', 'Hara Run button dabaiye: code check hota hai aur board me bheja jata hai.'),
  checkDo: t3('Press "Check my circuit": it names the first wire or part that is not right.', '"मेरा सर्किट जाँचिए" दबाइए: यह पहला ग़लत तार या पुर्ज़ा बताता है।', '"Check my circuit" dabaiye: ye pehla galat wire ya part batata hai.'),
  actDo: t3('Use the controls in the part\'s panel (click the part) or the robot\'s panel on the left to do what the step asks.', 'जो क़दम कहता है वह करने के लिए पुर्ज़े के पैनल (पुर्ज़े पर क्लिक) या बाईं ओर रोबोट के पैनल के बटन इस्तेमाल कीजिए।', 'Jo step kehta hai wo karne ke liye part ke panel (part par click) ya left me robot ke panel ke controls use kijiye.'),
  card: t3('📋 See the whole project card', '📋 पूरा प्रोजेक्ट कार्ड देखिए', '📋 Poora project card dekhiye'),
};
const name = (p) => (p ? tx(PARTS[p.type].name).split(' (')[0] : '');

// ------------------------------------------------------------ what is wrong right now
export function diagnose(app) {
  const lab = app.lab, rt = app.rt, out = []; const add = (text, act) => out.push({ text, act });
  if (!(lab.board.usb || lab.board.battery)) add(tx(S.noPower));
  if (lab.board.tripped) add(tx(S.fuse), 'repair');
  for (const p of lab.parts) if (p.state.burnt) add(tx(S.burnt, { p: name(p), why: p.type === 'led' ? tx(S.ledWhy) : '' }), 'repair');
  const m = lab.mcu;
  if (m.state === 'error' && m.err) add(tx(S.runtime, { m: msg(m.err) }));
  for (const p of lab.parts) {
    if (p.type !== 'led' || p.state.burnt) continue;
    try { if (rt.sameStrip(p.uid + '.A', p.uid + '.K')) { add(tx(S.sameStrip, { p: name(p) })); continue; } } catch (e) { /* */ }
    const a = lab.voltageAt('T:' + p.uid + ':A'), k = lab.voltageAt('T:' + p.uid + ':K');
    if (a != null && k != null && k - a > 1.2) add(tx(S.reversed, { p: name(p) }));
  }
  const src = app.code(); const run = m.state === 'running';
  if (run && app.ranSrc !== null && src !== app.ranSrc) add(tx(S.edited));
  const bm = /Serial\.begin\(\s*(\d+)/.exec(src); const sb = document.querySelector('#ser-baud');
  if (run && bm && sb && +sb.value !== +bm[1]) add(tx(S.baud, { a: sb.value, b: bm[1] }));
  if (rt.lesson) { const c = rt.runCheck(); if (c) { const args = {}; for (const [k, v] of Object.entries(c[1] || {})) args[k] = typeof v === 'object' ? tx(v) : v; add(tx(S.check, { m: tx(c[0], args) })); } }
  return out;
}
// ------------------------------------------------------------ the step in hand: three hints
function hints(app) {
  const rt = app.rt, s = rt.step, lab = app.lab; if (!s) return [];
  const doTxt = tx(s.do);
  if (s.k === 'place') {
    const at = s.place.at || {}; const h = at.hole || '';
    return [{ text: tx(S.placeDo, { p: tx(PARTS[s.place.type].name).split(' (')[0] }) }, { text: h ? tx(S.placeWhere, { h: h.replace(/^([a-j])(\d+)$/, '$2$1'), r: h.replace(/^[a-j]/, ''), c: h[0] }) : doTxt },
      { text: tx(S.placeDone), act: () => { const p = s.place; if (!lab.byTag(p.tag)) lab.addPart(p.type, Object.assign({}, p.props), Object.assign({}, p.at), p.rot || 0, p.tag); app.stage.kick(); } }];
  }
  if (s.k === 'wire') {
    const g = rt.ghostWire(s.wire); const a = g ? app.epName(g[0]) : s.wire[0], b = g ? app.epName(g[1]) : s.wire[1];
    return [{ text: tx(S.wireDo) + ' ' + doTxt }, { text: tx(S.wireWhere, { a, b }) }, { text: tx(S.wireDone, { a, b }), act: () => { const w = rt.ghostWire(s.wire); if (w) lab.addWire(w[0], w[1]); app.stage.kick(); } }];
  }
  if (s.k === 'edit') {
    const lines = (s.code || []).map((x) => (Array.isArray(x) ? x.join('–') : x)).join(', ');
    return [{ text: doTxt }, { text: lines ? tx(S.editWhere, { l: lines }) : doTxt },
      { text: tx(S.editDone), act: () => { let c = app.code(); for (const [re, rep] of s.set || []) { try { c = c.replace(re, rep); } catch (e) { /* */ } } app.editor.value = c; app.onEdit && app.onEdit(c); } }];
  }
  if (s.k === 'run') { const r = (() => { try { return app.world && app.world.compile ? app.world.compile(app.code()) : null; } catch (e) { return null; } })(); return [{ text: tx(S.runDo) }, { text: doTxt }]; }
  if (s.k === 'check') return [{ text: tx(S.checkDo) }, { text: doTxt }];
  return [{ text: doTxt }, { text: tx(S.actDo) }];
}
export function openHelp(app) {
  if (app.school && app.school.challenge && app.school.challenge()) { app.toast(tx(S.off)); return; }
  const found = diagnose(app); const H = hints(app); let level = 0;
  const render = () => `<h2>🛟 ${esc(tx(S.title))}</h2>
    ${found.length ? `<p><b>${esc(tx(S.found))}</b></p>${found.map((f, i) => `<div class="card"><span>⚠ ${esc(f.text)}</span>${f.act === 'repair' ? `<button class="btn sm" data-fx="${i}">⟲</button>` : ''}</div>`).join('')}` : `<p class="mute">${esc(tx(S.allGood))}</p>`}
    <h3>${esc(tx(app.rt.lesson ? app.rt.lesson.title : S.title))} · ${app.rt.i + 1}</h3>
    ${H.slice(0, level + 1).map((h, i) => `<div class="card"><b>💡 ${esc(tx([S.h1, S.h2, S.h3][i]))}</b><p style="margin:4px 0 0">${esc(h.text)}</p></div>`).join('')}
    <div class="row">${level + 1 < H.length ? `<button class="btn pri" id="hp-more">${esc(tx([S.h2, S.h3][level]))}</button> <span class="mute">${esc(tx(S.costs))}</span>` : ''}<button class="btn" id="hp-card">${esc(tx(S.card))}</button></div>`;
  const box = sheet(render());
  const bind = () => {
    const more = box.querySelector('#hp-more'); if (more) more.onclick = () => { level++; if (app.school && app.school.hint) app.school.hint(); const h = H[level]; if (h && h.act) { try { h.act(); } catch (e) { console.warn(e); } } box.innerHTML = '<button class="x" aria-label="Close">×</button>' + render(); box.querySelector('.x').onclick = closeSheet; bind(); };
    const card = box.querySelector('#hp-card'); if (card) card.onclick = () => { closeSheet(); if (app.projectCard) app.projectCard(); };
    for (const b of box.querySelectorAll('[data-fx]')) b.onclick = () => { app.lab.repair(); closeSheet(); app.toast('✓'); };
  };
  bind();
}
export function installHelper(app) {
  const bar = document.querySelector('#c-b'); if (!bar) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'b-help'; b.onclick = () => openHelp(app);
  bar.insertBefore(b, bar.querySelector('#b-check'));
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  W('renderCard', (o) => { o(); b.textContent = tx(S.btn); b.style.display = app.school && app.school.challenge && app.school.challenge() ? 'none' : ''; });
  app.help = () => openHelp(app);
}
