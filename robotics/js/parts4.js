// DUET Robotics Lab 360, batch 4: the parts the new boards' lessons need. The same shape as parts.js (pins in mm in the
// part's own frame, mount, elec = the circuit elements it adds, specs, info in English, Hindi and Hinglish); `dyn` is the
// part's own work each frame (sim.js), `live` its line in the hover tip and the callout, `controls` / `bind` its callout.
//   bar10    10-segment LED bar graph (red, DIP-20): it straddles the breadboard's middle gap, anodes on row e, cathodes on f
//   sip10    resistor network 10 × 220 Ω, bussed (SIP-11): one leg common, so ten LEDs need one part and one wire to GND
//   touch4   touch plate: a square of copper on a little stand, with one pin for a jumper (the ESP32's touch sensors)
//   magnet4  a bar magnet held over the ESP32 (its Hall sensor): slide it closer, turn it over
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });

export const PARTS4 = {
  bar10: {
    cat: 'out', mount: 'bb', props: {}, state0: { segB: [], lit: 0 },
    name: t3('LED bar graph (10 segments)', 'एलईडी बार ग्राफ़ (10 खंड)', 'LED bar graph (10 segments)'),
    pins: [...Array(10)].flatMap((_, i) => [
      { id: 'A' + (i + 1), at: [i * P, 0], name: t3(`Anode ${i + 1} (+): to a pin`, `एनोड ${i + 1} (+): पिन की तरफ़`, `Anode ${i + 1} (+): pin ki taraf`) },
      { id: 'K' + (i + 1), at: [i * P, 3 * P], name: t3(`Cathode ${i + 1} (−): through a resistor to GND`, `कैथोड ${i + 1} (−): रेज़िस्टर से होकर GND`, `Cathode ${i + 1} (−): resistor se hokar GND`) },
    ]),
    elec: (p, N) => [...Array(10)].map((_, i) => i + 1).filter((k) => !(p.state.bad || []).includes(k)).map((k) => ({ type: 'D', a: N['A' + k], b: N['K' + k], vf: 1.82, rs: 13, role: 'led', ch: k })),
    dyn: (p, els, lab, dt) => {
      const s = p.state; if (!s.burnt) s.bad = [];
      let lit = 0, hot = false; s.segB = s.segB || [];
      for (let k = 1; k <= 10; k++) {
        const e = els.find((q) => q.ch === k); const I = e ? Math.max(0, e.iAvg || 0) : 0; const b = (s.bad || []).includes(k) ? 0 : Math.min(1.5, Math.pow(I / 0.015, 0.55));
        s.segB[k - 1] = b; if (b > 0.18) lit++; lab.trackLed(p.uid + ':' + k, b, I);
        if (I > 0.04) { hot = true; s.hot = (s.hot || 0) + dt; if (s.hot > 0.15) { s.bad = [...(s.bad || []), k]; s.burnt = true; lab.rebuildSoon = true; lab.obs.burnt++; lab.emit('burn', { part: p, mA: Math.round(I * 1000) }); } }
      }
      if (!hot) s.hot = 0;
      if (lit !== s.lit) { s.lit = lit; lab.stateV++; }
      (s.levels || (s.levels = new Set())).add(lit); // which bar lengths were shown (the lesson asks for full and empty)
    },
    specs: () => [['color', 'red, 625 nm'], ['vf', '1.8–2.0 V @ 20 mA'], ['imax', '20 mA each (max 30 mA)'], ['pkg', 'DIP-20, 25 × 10 mm']],
    info: t3('Ten small LEDs in one block, side by side. Each has its own anode (+, the row with the label) and cathode (−). Light more of them to show a bigger number: a level meter.',
      'एक ही ब्लॉक में दस छोटी एलईडी, एक के बगल में एक। हर एक का अपना एनोड (+, लेबल वाली कतार) और कैथोड (−) है। जितनी ज़्यादा जलेंगी, उतनी बड़ी संख्या: लेवल मीटर।',
      'Ek hi block mein das chhoti LED, ek ke bagal mein ek. Har ek ka apna anode (+, label wali line) aur cathode (−) hai. Jitni zyada jalengi, utna bada number: level meter.'),
    live: (p) => `${p.state.lit || 0} / 10 ` + '▮'.repeat(p.state.lit || 0) + '▯'.repeat(10 - (p.state.lit || 0)),
  },
  sip10: {
    cat: 'basic', mount: 'bb', props: { ohms: 220 },
    name: t3('Resistor network 10 × 220 Ω', 'रेज़िस्टर नेटवर्क 10 × 220 Ω', 'Resistor network 10 × 220 Ω'),
    pins: [{ id: 'C', at: [0, 0], name: t3('Pin 1 (the dot): common, to GND', 'पिन 1 (बिंदु वाला): कॉमन, GND से', 'Pin 1 (dot wala): common, GND se') },
      ...[...Array(10)].map((_, i) => ({ id: 'R' + (i + 1), at: [(i + 1) * P, 0], name: t3(`Pin ${i + 2}: resistor ${i + 1}`, `पिन ${i + 2}: रेज़िस्टर ${i + 1}`, `Pin ${i + 2}: resistor ${i + 1}`) }))],
    elec: (p, N) => [...Array(10)].map((_, i) => ({ type: 'R', a: N.C, b: N['R' + (i + 1)], r: p.props.ohms, role: 'res' })),
    specs: (p) => [['ohms', '10 × ' + p.props.ohms + ' Ω ±5%'], ['power', '0.125 W each'], ['pkg', 'SIP-11, bussed']],
    info: t3('Ten resistors in one thin black strip. One end of every resistor is joined to pin 1 (the dot), so one wire from pin 1 to GND serves all ten LEDs.',
      'एक पतली काली पट्टी में दस रेज़िस्टर। हर रेज़िस्टर का एक सिरा पिन 1 (बिंदु वाला) से जुड़ा है, इसलिए पिन 1 से GND तक एक ही वायर दसों एलईडी के काम आता है।',
      'Ek patli kaali patti mein das resistor. Har resistor ka ek end pin 1 (dot wala) se juda hai, isliye pin 1 se GND tak ek hi wire dason LED ke kaam aata hai.'),
  },
  touch4: {
    term: { y: 6 }, cat: 'in', mount: 'free', props: {}, state0: { pressed: false },
    name: t3('Touch plate (copper)', 'टच प्लेट (तांबा)', 'Touch plate (copper)'),
    pins: [{ id: 'PAD', at: [0, 0], up: true, y: 9, name: t3('PAD: to a touch pin (T0 = GPIO 4)', 'PAD: टच पिन से (T0 = GPIO 4)', 'PAD: touch pin se (T0 = GPIO 4)') }],
    elec: () => [],
    specs: () => [['size', '30 × 30 mm copper'], ['out', 'touchRead: ≈ 70 free, ≈ 15 touched']],
    info: t3('A square of copper joined to an ESP32 touch pin. Your finger adds a little electric charge storage (capacitance), and touchRead() gives a much smaller number. Press and hold it.',
      'ESP32 के टच पिन से जुड़ा तांबे का एक चौकोर टुकड़ा। आपकी उँगली थोड़ी बिजली जमा करने की क्षमता (कैपेसिटेंस) जोड़ती है, और touchRead() बहुत छोटी संख्या देता है। इसे दबाकर रखिए।',
      'ESP32 ke touch pin se juda copper ka ek square. Aapki ungli thodi capacitance jodti hai, aur touchRead() bahut chhota number deta hai. Ise daba kar rakhiye.'),
    live: (p) => (p.state.pressed ? '☝ touched' : '○ free'),
    controls: (p, T) => `<div class="row"><button class="btn" id="co-press">☝ ${T('press')}</button></div>`,
  },
  magnet4: {
    term: { y: 4 }, cat: 'in', mount: 'free', props: {}, state0: { dist: 40, pos: 1 / 3, pole: 'N' },
    name: t3('Bar magnet', 'छड़ चुंबक', 'Bar magnet'),
    pins: [],
    elec: () => [],
    specs: () => [['size', '40 × 10 × 6 mm, ferrite'], ['out', 'N pole: red · S pole: blue']],
    info: t3('A magnet held over the ESP32. The chip has a Hall sensor under its metal cover: hallRead() goes up as the north pole comes closer, and down for the south pole. Drag the magnet\'s lower half to move it; press its top to turn it over.',
      'ESP32 के ऊपर पकड़ा हुआ चुंबक। चिप के धातु के ढक्कन के नीचे एक हॉल सेंसर है: उत्तरी ध्रुव पास लाने पर hallRead() बढ़ता है, और दक्षिणी ध्रुव पर घटता है। चुंबक का निचला आधा हिस्सा खींचकर इसे हिलाइए; ऊपर दबाकर इसे पलटिए।',
      'ESP32 ke upar pakda hua magnet. Chip ke metal cover ke neeche ek Hall sensor hai: north pole paas laane par hallRead() badhta hai, aur south pole par ghatta hai. Magnet ka neeche wala aadha hissa kheench kar ise hilaiye; upar daba kar ise palatiye.'),
    live: (p) => `${p.state.pole === 'S' ? 'S' : 'N'} ↓ · ${Math.round(p.state.dist)} mm`,
    // drag its lower half up or down (a mouse, a finger, a headset's ray: as a knob), press its top to turn it over
    dyn: (p, els, lab) => {
      const s = p.state; if (s.pos !== s._pos) { s._pos = s.pos; s.dist = Math.round(60 * (1 - s.pos)); lab.stateV++; }
      if (s.pressed && !s._pr) { s.pole = s.pole === 'S' ? 'N' : 'S'; lab.stateV++; } s._pr = !!s.pressed;
    },
    controls: (p, T, R) => R('co-mdist', T('dist4'), 0, 60, Math.round(p.state.dist)) + `<div class="row"><button class="btn" id="co-flip">⇅ ${T('flip4')} (${p.state.pole === 'S' ? 'S' : 'N'})</button></div>`,
    bind: (p, el, app) => {
      const b = el.querySelector('#co-flip'); if (b) b.onclick = () => { p.state.pole = p.state.pole === 'S' ? 'N' : 'S'; app.lab.stateV++; app.renderCallout(); app.stage.kick(); };
      const r = el.querySelector('#co-mdist'), o = el.querySelector('#co-mdist-v'); const show = () => { if (o) o.textContent = r.value + ' mm'; };
      if (r) { show(); r.oninput = () => { p.state.dist = +r.value; p.state.pos = p.state._pos = 1 - p.state.dist / 60; show(); app.lab.stateV++; app.stage.kick(); }; }
    },
  },
};
export const DRAWER4 = ['bar10', 'sip10', 'touch4', 'magnet4'];
export const SPEC4 = {
  usb: t3('USB', 'USB', 'USB'), serial: t3('Serial ports', 'सीरियल पोर्ट', 'Serial ports'), wifi: t3('WiFi', 'WiFi', 'WiFi'), bt: t3('Bluetooth', 'ब्लूटूथ', 'Bluetooth'), touch: t3('Touch pins', 'टच पिन', 'Touch pins'),
};
