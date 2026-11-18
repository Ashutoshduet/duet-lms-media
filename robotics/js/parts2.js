// DUET Robotics Lab 360, batch 2: the robot parts. The same shape as parts.js (pins in mm in the part's own frame, mount,
// elec = the circuit elements it adds, specs, info in English, Hindi and Hinglish), plus, for free parts with terminals at
// different places: a pin's own height (y), the way its wire leaves (dir [x, z] in the part frame, or up: a header pin).
// Robot parts that are built into a robot next to the bench (the arm's servos, the dustbin's sensor) are shown on the mat
// only as their cable's plug (props.mount); the robot itself is drawn by worlds.js.
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// BO gear motor (the yellow "TT" motor, 1:48) with a 65 mm wheel, at 6 V: about 185 rpm with no load, 0.12 A; 1.1 A stalled
// J: the rotor plus the car's own weight seen through the gears (m·r²/48² per wheel): a wheel stops in about 0.15 s
export const BO = { r: 5.2, ke: 0.0054, J: 2.2e-7, b: 4e-7, tf: 6.5e-4, gear: 48, rw: 32.5 };
// the L298N's two transistors in the path drop about 2 V in all (it is an old bipolar driver: this is why it gets warm)
export const L298 = { drop: 1.0, rOn: 0.6 };

export const PARTS2 = {
  l298n: {
    term: { y: 9 }, cat: 'move', mount: 'free', props: {}, state0: { a: 0, b: 0 },
    name: t3('Motor driver L298N', 'मोटर ड्राइवर L298N', 'Motor driver L298N'),
    pins: [
      { id: 'OUT1', at: [-23.5, -8.5], dir: [-1, 0], y: 9.5, name: t3('OUT1: motor A, first wire', 'OUT1: मोटर A का पहला तार', 'OUT1: motor A ka pehla wire') },
      { id: 'OUT2', at: [-23.5, -3.4], dir: [-1, 0], y: 9.5, name: t3('OUT2: motor A, second wire', 'OUT2: मोटर A का दूसरा तार', 'OUT2: motor A ka doosra wire') },
      { id: 'OUT3', at: [23.5, -3.4], dir: [1, 0], y: 9.5, name: t3('OUT3: motor B, first wire', 'OUT3: मोटर B का पहला तार', 'OUT3: motor B ka pehla wire') },
      { id: 'OUT4', at: [23.5, -8.5], dir: [1, 0], y: 9.5, name: t3('OUT4: motor B, second wire', 'OUT4: मोटर B का दूसरा तार', 'OUT4: motor B ka doosra wire') },
      { id: 'VS', at: [-15.2, 23.5], dir: [0, 1], y: 9.5, multi: true, name: t3('12V: battery + (5–35 V)', '12V: बैटरी का + (5–35 V)', '12V: battery ka + (5–35 V)') },
      { id: 'GND', at: [-10.1, 23.5], dir: [0, 1], y: 9.5, multi: true, name: t3('GND: battery − and the Arduino\'s GND', 'GND: बैटरी का − और Arduino का GND', 'GND: battery ka − aur Arduino ka GND') },
      { id: 'V5', at: [-5.0, 23.5], dir: [0, 1], y: 9.5, multi: true, name: t3('5V: out, from its own regulator', '5V: बाहर, इसके अपने रेगुलेटर से', '5V: bahar, iske apne regulator se') },
      { id: 'ENA', at: [3.2, 18.2], up: true, y: 12.5, name: t3('ENA: motor A on/off and speed (PWM)', 'ENA: मोटर A चालू/बंद और रफ़्तार (PWM)', 'ENA: motor A on/off aur speed (PWM)') },
      { id: 'IN1', at: [3.2 + P, 18.2], up: true, y: 12.5, name: t3('IN1: motor A direction', 'IN1: मोटर A की दिशा', 'IN1: motor A ki disha') },
      { id: 'IN2', at: [3.2 + 2 * P, 18.2], up: true, y: 12.5, name: t3('IN2: motor A direction', 'IN2: मोटर A की दिशा', 'IN2: motor A ki disha') },
      { id: 'IN3', at: [3.2 + 3 * P, 18.2], up: true, y: 12.5, name: t3('IN3: motor B direction', 'IN3: मोटर B की दिशा', 'IN3: motor B ki disha') },
      { id: 'IN4', at: [3.2 + 4 * P, 18.2], up: true, y: 12.5, name: t3('IN4: motor B direction', 'IN4: मोटर B की दिशा', 'IN4: motor B ki disha') },
      { id: 'ENB', at: [3.2 + 5 * P, 18.2], up: true, y: 12.5, name: t3('ENB: motor B on/off and speed (PWM)', 'ENB: मोटर B चालू/बंद और रफ़्तार (PWM)', 'ENB: motor B on/off aur speed (PWM)') },
    ],
    // two H-bridges. IN1/IN2 set motor A's direction (HIGH/LOW forward, LOW/HIGH back, equal: brake); ENA switches it on,
    // and its PWM sets the speed. The inputs only mean something when the L298N and the Arduino share the same GND.
    elec: (p, N, env, V) => {
      const v = (n) => (V && n < V.length ? V[n] : 0);
      const els = [{ type: 'R', a: N.VS, b: N.GND, r: 420, role: 'l298q' }];
      const vs = v(N.VS) - v(N.GND), logic = N.GND === 0;
      if (vs > 6.8) els.push({ type: 'V', a: N.V5, b: N.GND, v: 5.0, r: 0.6, role: 'reg' });
      for (const k of ['ENA', 'ENB', 'IN1', 'IN2', 'IN3', 'IN4']) els.push({ type: 'R', a: N[k], b: N.GND, r: 47000 });
      const st = p.state; st.logic = logic; st.vs = vs;
      for (const [en, ia, ib, oa, ob, key] of [['ENA', 'IN1', 'IN2', 'OUT1', 'OUT2', 'a'], ['ENB', 'IN3', 'IN4', 'OUT3', 'OUT4', 'b']]) {
        const d = logic ? clamp01((v(N[en]) - 0.4) / 4.4) : 0; const ha = logic && v(N[ia]) > 2.3, hb = logic && v(N[ib]) > 2.3;
        st[key] = d > 0.02 && vs > 4 && ha !== hb ? (ha ? d : -d) : 0;
        if (d < 0.02 || vs < 4) { els.push({ type: 'R', a: N[oa], b: N.GND, r: 1e5 }, { type: 'R', a: N[ob], b: N.GND, r: 1e5 }); continue; }
        // PWM on EN: the motor gets the average, so the high side drops (1 − d) of the rest as well
        const extra = (1 - d) * Math.max(0, vs - 2 * L298.drop);
        for (const [o, hi] of [[oa, ha], [ob, hb]]) els.push(hi ? { type: 'V', a: N.VS, b: N[o], v: L298.drop + extra, r: L298.rOn, role: 'hbridge' } : { type: 'V', a: N[o], b: N.GND, v: L298.drop * 0.5, r: L298.rOn, role: 'hbridge' });
      }
      return els;
    },
    specs: () => [['chan', '2 × DC motor (or 1 stepper)'], ['volt', '5–35 V (motors) · 5 V logic'], ['imax', '2 A per channel'], ['drop', '≈ 2 V (bipolar H-bridge)'], ['size', '43 × 43 × 27 mm']],
    info: t3('Two H-bridges in one chip. The Arduino\'s small signals (IN1–IN4) choose each motor\'s direction, ENA and ENB switch them on, and PWM on ENA/ENB sets the speed. The big current for the motors comes from the battery on the 12V terminal, never from the Arduino.',
      'एक ही चिप में दो H-ब्रिज। Arduino के छोटे सिग्नल (IN1–IN4) हर मोटर की दिशा चुनते हैं, ENA और ENB उन्हें चालू करते हैं, और ENA/ENB पर PWM रफ़्तार तय करता है। मोटरों का बड़ा करंट 12V टर्मिनल पर लगी बैटरी से आता है, Arduino से कभी नहीं।',
      'Ek hi chip mein do H-bridge. Arduino ke chhote signals (IN1–IN4) har motor ki disha chunte hain, ENA aur ENB unhe on karte hain, aur ENA/ENB par PWM speed set karta hai. Motors ka bada current 12V terminal par lagi battery se aata hai, Arduino se kabhi nahi.'),
  },
  bomotor: {
    term: { y: 34 }, cat: 'move', mount: 'free', props: { side: 'L' }, state0: { w: 0, a: 0 },
    name: t3('BO gear motor with wheel', 'BO गियर मोटर (पहिये के साथ)', 'BO gear motor (wheel ke saath)'),
    pins: [{ id: 'P', at: [-3.2, 0], dir: [0, 1], name: t3('Red wire (+): forward when it is the + side', 'लाल तार (+): यह + हो तो आगे', 'Red wire (+): yeh + ho to aage') },
      { id: 'N', at: [3.2, 0], dir: [0, 1], name: t3('Black wire (−)', 'काला तार (−)', 'Black wire (−)') }],
    elec: (p, N) => [{ type: 'M', a: N.P, b: N.N, r: BO.r, emf: BO.ke * p.state.w, role: 'bomotor' }],
    specs: () => [['volt', '3–6 V (works up to 9 V)'], ['gear', '1 : 48'], ['noload', '≈ 185 rpm, 0.12 A (6 V)'], ['stall', '≈ 1.1 A'], ['wheel', '65 mm, rubber tyre']],
    info: t3('A small DC motor with a plastic gearbox: the gears trade speed for force, so the wheel turns about 48 times slower than the motor but much more strongly. Swap its two wires and it turns the other way.',
      'प्लास्टिक गियरबॉक्स वाली छोटी डीसी मोटर: गियर रफ़्तार के बदले ताक़त देते हैं, इसलिए पहिया मोटर से लगभग 48 गुना धीमा पर कहीं ज़्यादा ज़ोर से घूमता है। इसके दोनों तार अदल-बदल दीजिए, तो यह उल्टा घूमेगी।',
      'Plastic gearbox wali chhoti DC motor: gears speed ke badle taakat dete hain, isliye wheel motor se lagbhag 48 guna dheema par kahin zyada zor se ghoomta hai. Iske dono wire badal dijiye, to yeh ulta ghoomegi.'),
  },
  bat18650: {
    term: { y: 3 }, cat: 'power', mount: 'free', props: {},
    name: t3('Battery: 2 × 18650 Li-ion (7.4 V)', 'बैटरी: 2 × 18650 लिथियम-आयन (7.4 V)', 'Battery: 2 × 18650 Li-ion (7.4 V)'),
    pins: [{ id: 'P', at: [0, 0], dir: [0, 1], name: t3('Red wire: + 7.4 V', 'लाल तार: + 7.4 V', 'Red wire: + 7.4 V') }, { id: 'N', at: [P * 2, 0], dir: [0, 1], name: t3('Black wire: −', 'काला तार: −', 'Black wire: −') }],
    elec: (p, N) => [{ type: 'V', a: N.P, b: N.N, v: 7.6, r: 0.25, role: 'battery' }],
    specs: () => [['volt', '7.4 V (8.4 V full, 6 V empty)'], ['cap', '≈ 2000 mAh'], ['imax', '3 A or more']],
    info: t3('Two rechargeable lithium cells in series: 3.7 V + 3.7 V = 7.4 V. They give the big currents that motors need. Join the battery\'s − to the Arduino\'s GND through the driver, so all the parts share one 0 V.',
      'श्रेणी में जुड़े दो रिचार्ज होने वाले लिथियम सेल: 3.7 V + 3.7 V = 7.4 V। ये मोटरों को चाहिए बड़ा करंट देते हैं। बैटरी का − ड्राइवर से होकर Arduino के GND से जोड़िए, ताकि सब पुर्ज़ों का 0 V एक ही रहे।',
      'Series mein jude do rechargeable lithium cell: 3.7 V + 3.7 V = 7.4 V. Yeh motors ko chahiye bada current dete hain. Battery ka − driver se hokar Arduino ke GND se jodiye, taaki sab parts ka 0 V ek hi rahe.'),
  },
  hc05: {
    cat: 'in', mount: 'bb', props: {}, state0: { paired: false },
    name: t3('Bluetooth module HC-05', 'ब्लूटूथ मॉड्यूल HC-05', 'Bluetooth module HC-05'),
    pins: [{ id: 'EN', at: [0, 0], name: t3('EN (KEY): leave free', 'EN (KEY): खाली छोड़िए', 'EN (KEY): khaali chhodiye') }, { id: 'VCC', at: [P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') },
      { id: 'GND', at: [2 * P, 0], name: t3('GND', 'GND', 'GND') }, { id: 'TXD', at: [3 * P, 0], name: t3('TXD: sends what the phone says → to the Arduino\'s RX (pin 0)', 'TXD: फ़ोन जो कहता है वह भेजता है → Arduino के RX (पिन 0) तक', 'TXD: phone jo kehta hai woh bhejta hai → Arduino ke RX (pin 0) tak') },
      { id: 'RXD', at: [4 * P, 0], name: t3('RXD: listens (3.3 V) ← the Arduino\'s TX (pin 1), through a divider', 'RXD: सुनता है (3.3 V) ← Arduino का TX (पिन 1), डिवाइडर से होकर', 'RXD: sunta hai (3.3 V) ← Arduino ka TX (pin 1), divider se hokar') },
      { id: 'STATE', at: [5 * P, 0], name: t3('STATE: HIGH when a phone is connected', 'STATE: फ़ोन जुड़ा हो तो HIGH', 'STATE: phone juda ho to HIGH') }],
    elec: (p, N, env, V) => {
      const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 125, role: 'hc05' }, { type: 'R', a: N.RXD, b: N.GND, r: 1e6 }, { type: 'R', a: N.EN, b: N.GND, r: 1e6 }];
      if (p.state.powered) { els.push({ type: 'V', a: N.TXD, b: N.GND, v: 3.3, r: 300, role: 'bttx' }); els.push({ type: 'V', a: N.STATE, b: N.GND, v: p.state.paired ? 3.3 : 0, r: 1000 }); }
      return els;
    },
    specs: () => [['range', '≈ 10 m'], ['baud', '9600 (default)'], ['volt', '3.6–6 V in · 3.3 V logic'], ['pin', '1234']],
    info: t3('A radio that turns Bluetooth into Serial. Whatever the phone app sends comes out of TXD as Serial letters at 9600 baud, so the Arduino reads it with Serial.read(). Its TXD goes to the Arduino\'s RX (pin 0): sender to listener.',
      'यह रेडियो ब्लूटूथ को सीरियल में बदलता है। फ़ोन का ऐप जो भेजता है, वह TXD से 9600 बॉड पर सीरियल अक्षरों में निकलता है, और Arduino उसे Serial.read() से पढ़ता है। इसका TXD, Arduino के RX (पिन 0) पर जाता है: भेजने वाला, सुनने वाले तक।',
      'Yeh radio Bluetooth ko Serial mein badalta hai. Phone ka app jo bhejta hai, woh TXD se 9600 baud par Serial letters mein nikalta hai, aur Arduino use Serial.read() se padhta hai. Iska TXD, Arduino ke RX (pin 0) par jaata hai: bhejne wala, sunne wale tak.'),
  },
  joystick: {
    term: { y: 5 }, cat: 'in', mount: 'free', props: {}, state0: { x: 0.5, y: 0.5, pressed: false },
    name: t3('Joystick module (two knobs in one)', 'जॉयस्टिक मॉड्यूल (एक में दो नॉब)', 'Joystick module (ek mein do knob)'),
    pins: [{ id: 'GND', at: [-2 * P, 0], name: t3('GND', 'GND', 'GND') }, { id: 'V5', at: [-P, 0], name: t3('+5V', '+5V', '+5V') },
      { id: 'VRX', at: [0, 0], name: t3('VRx: left–right, 0–5 V', 'VRx: बाएँ–दाएँ, 0–5 V', 'VRx: left–right, 0–5 V') }, { id: 'VRY', at: [P, 0], name: t3('VRy: up–down, 0–5 V', 'VRy: ऊपर–नीचे, 0–5 V', 'VRy: upar–neeche, 0–5 V') },
      { id: 'SW', at: [2 * P, 0], name: t3('SW: LOW when you press the stick', 'SW: स्टिक दबाने पर LOW', 'SW: stick dabane par LOW') }],
    elec: (p, N) => {
      const r = 10000, s = p.state;
      return [{ type: 'R', a: N.V5, b: N.VRX, r: r * (1 - s.x) + 0.5 }, { type: 'R', a: N.VRX, b: N.GND, r: r * s.x + 0.5 },
        { type: 'R', a: N.V5, b: N.VRY, r: r * (1 - s.y) + 0.5 }, { type: 'R', a: N.VRY, b: N.GND, r: r * s.y + 0.5 }, { type: 'SW', a: N.SW, b: N.GND, on: !!s.pressed, role: 'sw' }];
    },
    specs: () => [['ohms', '2 × 10 kΩ'], ['out', '≈ 512 in the middle'], ['volt', '5 V']],
    info: t3('Two potentiometers at right angles under one stick, and a push switch. Push the stick right and VRx goes towards 5 V (1023); push it up and VRy does. Drag the black cap to move it.',
      'एक स्टिक के नीचे आपस में समकोण पर दो पोटेंशियोमीटर, और एक पुश स्विच। स्टिक दाईं ओर करें तो VRx 5 V (1023) की ओर जाता है; ऊपर करें तो VRy। काली टोपी को खींचकर हिलाइए।',
      'Ek stick ke neeche aapas mein right angle par do potentiometer, aur ek push switch. Stick right karein to VRx 5 V (1023) ki taraf jaata hai; upar karein to VRy. Kaali topi ko kheench kar hilaiye.'),
  },
  psu5: {
    term: { y: 7 }, cat: 'power', mount: 'free', props: {},
    name: t3('5 V 3 A adapter (servo supply)', '5 V 3 A एडैप्टर (सर्वो की सप्लाई)', '5 V 3 A adapter (servo supply)'),
    pins: [{ id: 'P', at: [0, 0], dir: [0, 1], name: t3('+ 5 V', '+ 5 V', '+ 5 V') }, { id: 'N', at: [P * 2, 0], dir: [0, 1], name: t3('− (join it to the Arduino\'s GND)', '− (इसे Arduino के GND से जोड़िए)', '− (ise Arduino ke GND se jodiye)') }],
    elec: (p, N) => [{ type: 'V', a: N.P, b: N.N, v: 5.1, r: 0.06, role: 'psu' }],
    specs: () => [['volt', '5 V DC'], ['imax', '3 A'], ['plug', '5.5 × 2.1 mm jack → screw terminal']],
    info: t3('A wall adapter for the servos. Four servos can pull more than 2 A when they push hard, but the USB port gives only 0.5 A: the board would reset. So the servos get their own 5 V, and its − is joined to the Arduino\'s GND so the signals mean the same thing.',
      'सर्वो के लिए दीवार वाला एडैप्टर। चार सर्वो ज़ोर लगाते समय 2 A से ज़्यादा खींच सकते हैं, पर USB पोर्ट सिर्फ़ 0.5 A देता है: बोर्ड रीसेट हो जाएगा। इसलिए सर्वो को अपना 5 V मिलता है, और इसका − Arduino के GND से जुड़ता है ताकि सिग्नल का मतलब एक ही रहे।',
      'Servos ke liye deewar wala adapter. Chaar servo zor lagate waqt 2 A se zyada kheench sakte hain, par USB port sirf 0.5 A deta hai: board reset ho jayega. Isliye servos ko apna 5 V milta hai, aur iska − Arduino ke GND se judta hai taaki signal ka matlab ek hi rahe.'),
  },
  mg996r: {
    term: { y: 1.5 }, cat: 'move', mount: 'free', props: {}, state0: { angle: 90 }, servo: true, rate: 360,
    name: t3('Servo motor MG996R (metal gears)', 'सर्वो मोटर MG996R (धातु के गियर)', 'Servo motor MG996R (metal gears)'),
    pins: [{ id: 'GND', at: [-P, 0], name: t3('Brown: GND', 'भूरा: GND', 'Brown: GND') }, { id: 'VP', at: [0, 0], name: t3('Red: 5V (from the adapter)', 'लाल: 5V (एडैप्टर से)', 'Red: 5V (adapter se)') }, { id: 'SIG', at: [P, 0], name: t3('Orange: signal', 'नारंगी: सिग्नल', 'Orange: signal') }],
    elec: (p, N) => [{ type: 'R', a: N.VP, b: N.GND, r: p.state.moving ? 14 : p.state.load ? 9 : 380, role: 'servo' }],
    specs: () => [['turn', '0° – 180°'], ['speed', '0.17 s / 60°'], ['torque', '9.4 kg·cm (4.8 V)'], ['stall', '2.5 A'], ['volt', '4.8–7.2 V']],
    info: t3('A strong servo with metal gears, for the arm\'s heavy joints. It works like the SG90 (a pulse every 20 ms sets the angle) but it can pull 2.5 A, so it must have its own 5 V supply, never the Arduino\'s 5V pin.',
      'धातु के गियर वाला ताक़तवर सर्वो, बाँह के भारी जोड़ों के लिए। यह SG90 की तरह ही काम करता है (हर 20 ms की पल्स कोण तय करती है), पर यह 2.5 A तक खींच सकता है, इसलिए इसे अपनी अलग 5 V सप्लाई चाहिए, Arduino का 5V पिन कभी नहीं।',
      'Dhaatu ke gear wala taakatwar servo, baanh ke bhaari joints ke liye. Yeh SG90 ki tarah hi kaam karta hai (har 20 ms ki pulse angle set karti hai), par yeh 2.5 A tak kheench sakta hai, isliye ise apni alag 5 V supply chahiye, Arduino ka 5V pin kabhi nahi.'),
  },
  hcsr04f: {
    term: { y: 4 }, cat: 'in', mount: 'free', props: {}, state0: { dist: 60 }, us: true,
    name: t3('Ultrasonic sensor HC-SR04 (on the robot)', 'अल्ट्रासोनिक सेंसर HC-SR04 (रोबोट पर)', 'Ultrasonic sensor HC-SR04 (robot par)'),
    pins: [{ id: 'VCC', at: [-1.5 * P, 0], name: t3('VCC: 5V', 'VCC: 5V', 'VCC: 5V') }, { id: 'TRIG', at: [-0.5 * P, 0], name: t3('Trig', 'Trig', 'Trig') },
      { id: 'ECHO', at: [0.5 * P, 0], name: t3('Echo', 'Echo', 'Echo') }, { id: 'GND', at: [1.5 * P, 0], name: t3('GND', 'GND', 'GND') }],
    elec: null, specs: null, info: null, // the same as the HC-SR04 (filled in below)
  },
};
// the HC-SR04 on a robot works as the one on the breadboard; only its plug is on the mat
PARTS2.hcsr04f.elec = (p, N, env, V, t) => {
  const els = [{ type: 'R', a: N.VCC, b: N.GND, r: 330 }];
  if (p.state.powered) { const e = p.state.echo; const hi = e && t >= e.start && t < e.end; els.push({ type: 'V', a: N.ECHO, b: N.GND, v: hi ? 5 : 0, r: 100, role: 'echo' }); }
  return els;
};
export const DRAWER2 = ['l298n', 'bomotor', 'bat18650', 'hc05', 'joystick', 'psu5', 'mg996r'];
// what each new spec key is called (i18n SPEC)
export const SPEC2 = {
  chan: t3('Channels', 'चैनल', 'Channels'), drop: t3('Voltage drop', 'वोल्टेज ड्रॉप', 'Voltage drop'), gear: t3('Gear ratio', 'गियर अनुपात', 'Gear ratio'),
  wheel: t3('Wheel', 'पहिया', 'Wheel'), baud: t3('Speed (baud)', 'रफ़्तार (बॉड)', 'Speed (baud)'), pin: t3('Pairing PIN', 'पेयरिंग पिन', 'Pairing PIN'), plug: t3('Plug', 'प्लग', 'Plug'),
};
