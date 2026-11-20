// DUET Robotics Lab 360, batch 31: the SIM800L GSM module (the red "V2.0" board for 5 V), as data (same shape as
// parts.js). gsm31.js speaks its AT commands; libs3.js's SoftwareSerial carries them.
//   sim800l  5V, GND, TXD, RXD. It sends SMS (and could call) through a SIM card on the mobile network. Its radio pulls
//            2 A for a moment each time it transmits, so it needs its own 5 V 2 A adapter, with its − joined to the
//            board's GND; on the Arduino's 5V pin it browns out and restarts for ever (it never finds the network).
//            The NET light: a blink every second while it looks for the network, every 3 s once it has it.
const t3 = (en, hi, hg) => ({ en, hi, hg });
const P = 2.54;
const touch = (lab) => { lab.stateV = (lab.stateV || 0) + 1; lab.instKey = null; };
const pin = (id, x, en, hi, hg) => ({ id, at: [x, 0], name: t3(en, hi, hg) });
import { registered, GSM } from './gsm31.js';

export const PARTS31 = {
  sim800l: {
    term: { y: 4.5 }, cat: 'out', mount: 'free', props: { warm: false }, state0: {},
    name: t3('GSM module SIM800L (SMS)', 'GSM मॉड्यूल SIM800L (SMS)', 'GSM module SIM800L (SMS)'),
    pins: [pin('VCC', -1.5 * P, '5V: from its own 5 V 2 A adapter', '5V: अपने 5 V 2 A एडैप्टर से', '5V: apne 5 V 2 A adapter se'), pin('GND', -0.5 * P, 'GND (join it to the board\'s GND too)', 'GND (इसे बोर्ड के GND से भी जोड़िए)', 'GND (ise board ke GND se bhi jodiye)'),
      pin('TXD', 0.5 * P, 'TXD: what the module says, to the board\'s RX pin', 'TXD: मॉड्यूल जो कहता है, बोर्ड के RX पिन पर', 'TXD: module jo kehta hai, board ke RX pin par'), pin('RXD', 1.5 * P, 'RXD: what the board says, from its TX pin', 'RXD: बोर्ड जो कहता है, उसके TX पिन से', 'RXD: board jo kehta hai, uske TX pin se')],
    elec: (p, N) => [{ type: 'R', a: N.VCC, b: N.GND, r: 25, role: 'gsm' }],
    dyn: (p, els, lab, dt, vAt) => {
      const s = p.state; const on = vAt(p.N.VCC) - vAt(p.N.GND) > 4.3;
      if (on !== !!s.powered) { s.powered = on; if (on) { s.onAt = (lab.clock || 0) - (p.props.warm ? 60 : 0); s.echo = true; s.cmgf = 0; s.mode = null; s.line = ''; } touch(lab); }
      const weak = on && lab.conn(p.ep.VCC, 'B:5V'); if (weak !== !!s.weak) { s.weak = weak; touch(lab); }
      if (weak) s.onAt = lab.clock || 0; // (on the Arduino's 5V it browns out at every transmit and starts again: never registered)
      const reg = registered(lab, p); if (reg !== !!s.reg) { s.reg = reg; touch(lab); }
    },
    specs: () => [['bands', 'GSM 850/900/1800/1900 MHz (2G)'], ['power', '5 V board; up to 2 A for a moment while transmitting'], ['serial', 'AT commands, 9600 baud (it learns the speed from the first AT)'], ['sim', 'micro SIM']],
    info: t3('A mobile phone without a screen: the board sends it AT commands on a serial line, and it sends SMS through its SIM card. It needs its own 5 V 2 A adapter (its radio pulls 2 A in bursts), the two GNDs joined, and about 10 s to find the network. Text mode first: AT+CMGF=1.',
      'बिना स्क्रीन का मोबाइल फ़ोन: बोर्ड सीरियल लाइन पर इसे AT कमांड भेजता है, और यह अपने SIM कार्ड से SMS भेजता है। इसे अपना 5 V 2 A एडैप्टर चाहिए (इसका रेडियो झटकों में 2 A खींचता है), दोनों GND जुड़े होने चाहिए, और नेटवर्क ढूँढने में लगभग 10 s लगते हैं। पहले टेक्स्ट मोड: AT+CMGF=1।',
      'Bina screen ka mobile phone: board serial line par ise AT command bhejta hai, aur yeh apne SIM card se SMS bhejta hai. Ise apna 5 V 2 A adapter chahiye (iska radio jhatkon mein 2 A kheenchta hai), dono GND jude hone chahiye, aur network dhoondhne mein lagbhag 10 s lagte hain. Pehle text mode: AT+CMGF=1.'),
    live: (p, lab) => { const s = p.state; if (!s.powered) return 'no power'; if (s.weak) return 'restarting again and again: it needs its own 5 V 2 A adapter'; return s.reg ? `network ${GSM.op} · SIM ${GSM.sim}` : `looking for the network… ${Math.max(0, Math.ceil(GSM.regS - ((lab && lab.clock) || 0) + (s.onAt ?? 0)))} s`; },
  },
};
export const DRAWER31 = ['sim800l'];
