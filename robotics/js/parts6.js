// DUET Robotics Lab 360, batch 6: the one new part the Raspberry Pi lessons need, as data (same shape as parts.js).
//   abuzz  an active buzzer (12 mm, it has its own oscillator): it beeps by itself at about 2.3 kHz whenever its + leg gets
//          2.5 V or more, so a Pi's 3.3 V GPIO pin switches it on and off with gpiozero's Buzzer. Draws about 15 mA at 3.3 V.
const P = 2.54;
const t3 = (en, hi, hg) => ({ en, hi, hg });

export const PARTS6 = {
  abuzz: {
    cat: 'out', mount: 'bb', props: {}, state0: { on: false },
    name: t3('Active buzzer (beeps by itself)', 'एक्टिव बज़र (ख़ुद बीप करता है)', 'Active buzzer (khud beep karta hai)'),
    pins: [{ id: 'P', at: [0, 0], name: t3('+ (long leg): to the GPIO pin', '+ (लंबा पैर): GPIO पिन से', '+ (lamba pair): GPIO pin se') }, { id: 'N', at: [3 * P, 0], name: t3('− (short leg): to GND', '− (छोटा पैर): GND से', '− (chhota pair): GND se') }],
    elec: (p, N) => [{ type: 'R', a: N.P, b: N.N, r: 200, role: 'abuzz' }],
    dyn: (p, els, lab, dt, vAt) => {
      const v = vAt(p.N.P) - vAt(p.N.N); const on = v > 2.5;
      if (on !== !!p.state.on) { p.state.on = on; p.state.beeps = (p.state.beeps || 0) + (on ? 1 : 0); }
      if (on) { lab.sounds.push({ id: p.uid, kind: 'tone', f: 2300, amp: Math.min(0.7, v / 5) }); lab.obs.tones.add(2300); }
    },
    live: (p, lab) => { const e = lab.els.find((q) => q.part === p); return p.state.on ? `♪ 2.3 kHz · ${((e ? Math.abs(e.iAvg) : 0) * 1000).toFixed(1)} mA` : '—'; },
    specs: () => [['freq', '≈ 2300 Hz (its own oscillator)'], ['volt', '3–5 V, about 15 mA at 3.3 V'], ['size', '12 mm, the + leg is longer']],
    info: t3('An active buzzer has its own little oscillator inside: give it a voltage and it beeps, no tone() needed. That is why a plain on / off pin (gpiozero\'s Buzzer) can sound it. The + leg is the long one, and there is a + on its top.',
      'एक्टिव बज़र के अंदर अपना छोटा ऑसिलेटर होता है: इसे वोल्टेज दीजिए और यह बीप करने लगता है, tone() की ज़रूरत नहीं। इसीलिए एक सीधा चालू / बंद पिन (gpiozero का Buzzer) इसे बजा सकता है। + वाला पैर लंबा है, और इसके ऊपर + लिखा है।',
      'Active buzzer ke andar apna chhota oscillator hota hai: ise voltage dijiye aur yeh beep karne lagta hai, tone() ki zaroorat nahi. Isiliye ek seedha on / off pin (gpiozero ka Buzzer) ise baja sakta hai. + wala pair lamba hai, aur iske upar + likha hai.'),
  },
};
export const DRAWER6 = ['abuzz'];
