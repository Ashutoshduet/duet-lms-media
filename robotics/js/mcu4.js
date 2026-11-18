// DUET Robotics Lab 360, batch 4: the Nano's and the Mega's microcontrollers. Both are the classic AVR (mcu.js) with their
// own pin numbers; the Mega (ATmega2560) also has 16 analog inputs (A0 = pin 54) and three more serial ports.
// Serial1–3 send on their TX pin: the bytes reach whatever RX pin is wired to it (a loopback wire, or another port).
import { MCU, RtError, SerialPort } from './mcu.js';
import { BOARDS4 } from './boards4.js';

// hardware serial ports other than the USB one: [{ ser, tx: board pin id, rx: board pin id }]. Called after each run().
export function routeSerial(m, ports) {
  const lab = m.lab; if (!lab) return;
  for (const P of ports) {
    if (!P.ser) continue; P.ser.flushTo(m.t); const out = P.ser.take(); if (!out.length) continue;
    P.ser.sent = (P.ser.sent || 0) + out.reduce((n, o) => n + o.bytes.length, 0);
    for (const Q of ports) {
      if (!Q.ser || !Q.ser.on || !lab.conn('B:' + P.tx, 'B:' + Q.rx)) continue;
      for (const o of out) for (const b of o.bytes) Q.ser.rx.push(o.baud === Q.ser.baud ? b : (b * 7 + o.baud) & 255); // the wrong speed: rubbish, as on a real port
    }
  }
}

export class NanoMCU extends MCU {
  pin(p, fn) { if (!(p >= 0 && p < 22) || p !== Math.floor(p)) throw new RtError('R_PIN_NANO', { pin: p, fn }, this.L); return super.pin(p, fn); }
}

export class MegaMCU extends MCU {
  reset() {
    super.reset();
    this.adcMin = new Array(16).fill(1024); this.adcMax = new Array(16).fill(-1); this.g4 = {};
    this.sers = [this.ser, new SerialPort(this), new SerialPort(this), new SerialPort(this)];
  }
  pin(p, fn) { if (!(p >= 0 && p < 70) || p !== Math.floor(p)) throw new RtError('R_PIN_MEGA', { pin: p, fn }, this.L); return super.pin(p, fn); }
  // analogRead(A0) = analogRead(54) = analogRead(0): channel 0 (as the Mega's core does it)
  ar(p) {
    const ch = p >= 54 ? p - 54 : p;
    if (!(ch >= 0 && ch < 16) || ch !== Math.floor(ch)) throw new RtError('R_ANALOG_MEGA', { pin: p }, this.L);
    this.t += 112; const g = 54 + ch;
    const v = this.io.read ? this.io.read(g, this.t, true) : NaN;
    if (Number.isNaN(v)) return Math.max(0, Math.min(1023, Math.round(this.hum(g) / 5 * 1023 * 0.7 + 150)));
    const n = Math.max(0, Math.min(1023, Math.round(v / 5 * 1023 + (Math.random() - 0.5) * 1.6)));
    if (n < this.adcMin[ch]) this.adcMin[ch] = n; if (n > this.adcMax[ch]) this.adcMax[ch] = n;
    return n;
  }
  lib4(type, args, line) {
    const k = /^@Serial([123])$/.exec(type); if (k) return this.sers[+k[1]];
    throw new RtError('R_INTERNAL', { msg: 'no library ' + type }, line);
  }
  run(ms) {
    const r = super.run(ms);
    routeSerial(this, [{ ser: this.sers[1], tx: 'D18', rx: 'D19' }, { ser: this.sers[2], tx: 'D16', rx: 'D17' }, { ser: this.sers[3], tx: 'D14', rx: 'D15' }]);
    return r;
  }
}
BOARDS4.nano.mcuClass = NanoMCU;
BOARDS4.mega.mcuClass = MegaMCU;
