// DUET Robotics Lab 360, batch 24: the MCP3008, an 8-channel 10-bit analog-to-digital converter in a 16-pin DIP. The
// Raspberry Pi has no analog inputs at all, so every Pi project with a knob, an LDR, an LM35 or a soil sensor reads it
// through this chip over SPI (gpiozero's MCP3008 class, pi24.js). From the Microchip datasheet (DS21295):
//   pins 1–8   CH0–CH7, the analog inputs (0 V to VREF; above VDD + 0.6 V is outside the absolute maximum)
//   pin 9      DGND          pin 10  CS/SHDN (the Pi's CE0, GPIO 8)     pin 11  DIN  (the Pi's MOSI, GPIO 10)
//   pin 12     DOUT (MISO, GPIO 9)   pin 13  CLK (SCLK, GPIO 11)        pin 14  AGND
//   pin 15     VREF (what full scale means: 3.3 V here)                 pin 16  VDD (2.7–5.5 V; 3.3 V with a Pi)
// It straddles the breadboard's middle gap: pin 1 at row f (towards the student), pins 1–8 to the right along row f,
// pins 16–9 above them on row e (the notch at the left end, by pins 1 and 16). Supplied from 5 V, its DOUT would put 5 V
// on the Pi's GPIO 9: pi24.js warns about it.
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; };

const NAMES = {
  VDD: t3('VDD: + supply, 3.3 V for a Pi', 'VDD: + सप्लाई, Pi के लिए 3.3 V', 'VDD: + supply, Pi ke liye 3.3 V'),
  VREF: t3('VREF: full scale (1023) means this voltage; join it to VDD', 'VREF: पूरा पैमाना (1023) यही वोल्टेज है; इसे VDD से जोड़िए', 'VREF: poora scale (1023) yahi voltage hai; ise VDD se jodiye'),
  AGND: t3('AGND: analog ground', 'AGND: एनालॉग ग्राउंड', 'AGND: analog ground'),
  CLK: t3('CLK: the SPI clock, from the Pi\'s SCLK (GPIO 11)', 'CLK: SPI क्लॉक, Pi के SCLK (GPIO 11) से', 'CLK: SPI clock, Pi ke SCLK (GPIO 11) se'),
  DOUT: t3('DOUT: the readings out, to the Pi\'s MISO (GPIO 9)', 'DOUT: रीडिंग बाहर, Pi के MISO (GPIO 9) पर', 'DOUT: readings bahar, Pi ke MISO (GPIO 9) par'),
  DIN: t3('DIN: which channel to read, from the Pi\'s MOSI (GPIO 10)', 'DIN: कौन सा चैनल पढ़ना है, Pi के MOSI (GPIO 10) से', 'DIN: kaun sa channel padhna hai, Pi ke MOSI (GPIO 10) se'),
  CS: t3('CS/SHDN: chip select, from the Pi\'s CE0 (GPIO 8)', 'CS/SHDN: चिप सिलेक्ट, Pi के CE0 (GPIO 8) से', 'CS/SHDN: chip select, Pi ke CE0 (GPIO 8) se'),
  DGND: t3('DGND: digital ground', 'DGND: डिजिटल ग्राउंड', 'DGND: digital ground'),
};
const chName = (k) => t3(`CH${k}: analog input ${k} (0 V to VREF)`, `CH${k}: एनालॉग इनपुट ${k} (0 V से VREF तक)`, `CH${k}: analog input ${k} (0 V se VREF tak)`);
const MCP3008 = {
  cat: 'in', mount: 'bb', props: {}, state0: { powered: false },
  name: t3('MCP3008 ADC chip (8 channels, 10-bit, SPI)', 'MCP3008 ADC चिप (8 चैनल, 10-बिट, SPI)', 'MCP3008 ADC chip (8 channel, 10-bit, SPI)'),
  pins: [
    ...Array.from({ length: 8 }, (_, k) => ({ id: 'CH' + k, at: [k * P, 0], name: chName(k) })), // pins 1–8 along row f
    ...['VDD', 'VREF', 'AGND', 'CLK', 'DOUT', 'DIN', 'CS', 'DGND'].map((id, k) => ({ id, at: [k * P, -3 * P], name: NAMES[id] })), // pins 16–9 along row e
  ],
  elec: (p, N) => [{ type: 'R', a: N.VDD, b: N.DGND, r: 6600, role: 'chip' }, { type: 'R', a: N.VREF, b: N.AGND, r: 33000 }], // ≈ 0.5 mA, and the reference's own input
  dyn: (p, els, lab, dt, vAt) => { const v = vAt(p.N.VDD) - vAt(p.N.DGND); p.state.vdd = v; const on = v > 2.6; if (on !== !!p.state.powered) { p.state.powered = on; touch(lab); } },
  live: (p) => (p.state.powered ? `powered, VDD ${(p.state.vdd || 0).toFixed(1)} V${p.state.last ? ` · last reading CH${p.state.last.ch}: ${p.state.last.raw}` : ''}` : 'no power on VDD'),
  specs: () => [['res', '10-bit: 0 to 1023'], ['chan', '8 single-ended inputs (CH0–CH7)'], ['volt', '2.7–5.5 V (3.3 V beside a Raspberry Pi)'], ['bus', 'SPI, up to 1.35 MHz at 2.7 V'], ['pkg', 'DIP-16, 0.3" wide']],
  info: t3('The Raspberry Pi can only tell on from off: it has no analog pins. This chip measures up to eight voltages between 0 V and VREF and sends each one as a number from 0 to 1023 over four SPI wires. With VREF at 3.3 V, 1.65 V reads about 512.',
    'Raspberry Pi सिर्फ़ चालू और बंद पहचानता है: उसमें कोई एनालॉग पिन नहीं। यह चिप 0 V से VREF तक के आठ वोल्टेज तक नापती है और हर एक को 0 से 1023 तक की संख्या बनाकर चार SPI तारों से भेजती है। VREF 3.3 V हो, तो 1.65 V करीब 512 पढ़ता है।',
    'Raspberry Pi sirf on aur off pehchanta hai: usmein koi analog pin nahi. Yeh chip 0 V se VREF tak ke aath voltage tak naapti hai aur har ek ko 0 se 1023 tak ka number bana kar chaar SPI wires se bhejti hai. VREF 3.3 V ho, to 1.65 V kareeb 512 padhta hai.'),
};

export const PARTS24 = { mcp3008: MCP3008 };
export const DRAWER24 = ['mcp3008'];
