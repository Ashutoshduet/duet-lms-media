// DUET Robotics Lab 360, batch 3: what happens in each project's scene next to the bench, without the 3D (so the tests
// run it too): the air around the DHT11, the plant's soil drying in the sun and the pump watering it, the room's lamp and
// fan, the thief who walks past the PIR, the door's latch, the locker, the kitchen's LPG leak, the pan-tilt laser, the
// turntable. A scene reads the bench's real parts (relay, pump, servo, stepper, LCD, OLED, buzzer) and writes its sensors
// (the soil's moisture, the air, the gas, the PIR's "someone moved"). Each keeps flags the lessons wait for, and the
// numbers the student really saw (res), for the lesson's own results. worlds3.js draws it; hud() is the panel.
import { tx } from './i18n.js';
import { lcdText, CARDS, uidText } from './libs3.js';
import { irSend, rfidShow, keyPress, KEYMAP } from './parts3.js';
import { set30 } from './parts30.js'; // (batch 35: the ration shop's scale)

const t3 = (en, hi, hg) => ({ en, hi, hg });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const CUR = { sim: null }; // the scene of the lesson that is open (the lessons' live results read it)
const nums = (s) => (String(s).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const W = {
  temp: t3('Temperature', 'तापमान', 'Temperature'), hum: t3('Humidity', 'नमी', 'Nami'), screen: t3('Screen', 'स्क्रीन', 'Screen'), room: t3('Room temperature', 'कमरे का तापमान', 'Room ka temperature'),
  roomHum: t3('Room humidity', 'कमरे की नमी', 'Room ki nami'), chai: t3('Cup of hot chai', 'गर्म चाय का कप', 'Garam chai ka cup'), away: t3('Away', 'दूर', 'Door'), near: t3('Next to the sensor', 'सेंसर के पास', 'Sensor ke paas'),
  breathe: t3('Breathe on the sensor', 'सेंसर पर साँस छोड़िए', 'Sensor par saans chhodiye'), soil: t3('Soil', 'मिट्टी', 'Mitti'), sensorSays: t3('Sensor (A0)', 'सेंसर (A0)', 'Sensor (A0)'), pump: t3('Pump', 'पंप', 'Pump'),
  tank: t3('Water tank', 'पानी की टंकी', 'Paani ki tanki'), plant: t3('Plant', 'पौधा', 'Paudha'), sun: t3('Sun', 'धूप', 'Dhoop'), on: t3('On', 'चालू', 'On'), off: t3('Off', 'बंद', 'Off'),
  dryIt: t3('A hot afternoon: dry the soil', 'तेज़ दोपहर: मिट्टी सुखाइए', 'Tez dopahar: mitti sukhaiye'), refill: t3('Refill the tank', 'टंकी भरिए', 'Tanki bhariye'), dry: t3('dry', 'सूखी', 'sookhi'), damp: t3('damp', 'नम', 'nam'), wet: t3('wet', 'गीली', 'geeli'),
  happy: t3('fresh', 'हरा-भरा', 'hara-bhara'), wilting: t3('wilting', 'मुरझा रहा', 'murjha raha'), lamp: t3('Lamp', 'बल्ब', 'Bulb'), fan: t3('Fan', 'पंखा', 'Pankha'), remote: t3('Remote', 'रिमोट', 'Remote'),
  last: t3('Last button', 'आख़िरी बटन', 'Aakhri button'), pir: t3('PIR output', 'पीआईआर आउटपुट', 'PIR output'), alarm: t3('Alarm', 'अलार्म', 'Alarm'), walk: t3('A thief walks in', 'एक चोर अंदर आता है', 'Ek chor andar aata hai'),
  cat: t3('The cat walks past', 'बिल्ली पास से गुज़रती है', 'Billi paas se guzarti hai'), learning: t3('learning the room…', 'कमरा समझ रहा है…', 'room samajh raha hai…'), door: t3('Door', 'दरवाज़ा', 'Darwaza'),
  latch: t3('Latch (servo)', 'कुंडी (सर्वो)', 'Kundi (servo)'), locked: t3('locked', 'बंद', 'band'), open: t3('open', 'खुला', 'khula'), card: t3('Hold the white card on the reader', 'सफ़ेद कार्ड रीडर पर रखिए', 'Safed card reader par rakhiye'),
  tag: t3('Hold the blue tag on the reader', 'नीला टैग रीडर पर रखिए', 'Neela tag reader par rakhiye'), fanW: t3('Fan', 'पंखा', 'Pankha'), growW: t3('Grow light', 'ग्रो लाइट', 'Grow light'), tankLevel: t3('Water in the tank', 'टंकी में पानी', 'Tanki mein paani'), sonarSees: t3('Sensor sees (air gap)', 'सेंसर देखता है (हवा की दूरी)', 'Sensor dekhta hai (hawa ki doori)'), pump: t3('Pump', 'पंप', 'Pump'), dryRunW: t3('running dry!', 'सूखा चल रहा है!', 'sookha chal raha hai!'), taps: t3('Taps in the house', 'घर के नल', 'Ghar ke nal'), sumpW: t3('Sump (underground tank)', 'संप (ज़मीन के नीचे की टंकी)', 'Sump (zameen ke neeche ki tanki)'), sumpFull: t3('Has water', 'पानी है', 'Paani hai'), sumpDry: t3('Empty', 'ख़ाली', 'Khaali'), cardAsha: t3('Asha taps her white card', 'आशा अपना सफ़ेद कार्ड लगाती है', 'Asha apna safed card lagati hai'), tagRavi: t3('Ravi taps his blue tag', 'रवि अपना नीला टैग लगाता है', 'Ravi apna neela tag lagata hai'), lastCard: t3('Last card', 'आख़िरी कार्ड', 'Aakhri card'), sky: t3('Weather outside', 'बाहर का मौसम', 'Bahar ka mausam'),
  sunny: t3('Sunny', 'धूप', 'Dhoop'), rainy: t3('Rainy', 'बारिश', 'Baarish'), night: t3('Winter night', 'सर्दी की रात', 'Sardi ki raat'), typed: t3('Typed', 'टाइप किया', 'Type kiya'), locker: t3('Locker', 'लॉकर', 'Locker'),
  gas: t3('LPG in the air', 'हवा में एलपीजी', 'Hawa mein LPG'), leak: t3('Gas knob left open', 'गैस का नॉब खुला रह गया', 'Gas ka knob khula reh gaya'), window: t3('Window', 'खिड़की', 'Khidki'), closed: t3('Closed', 'बंद', 'Band'),
  opened: t3('Open', 'खुली', 'Khuli'), warmUp: t3('warming up…', 'गर्म हो रहा है…', 'garam ho raha hai…'), pan: t3('Pan (left–right)', 'पैन (बाएँ–दाएँ)', 'Pan (left–right)'), tilt: t3('Tilt (up–down)', 'टिल्ट (ऊपर–नीचे)', 'Tilt (upar–neeche)'),
  target: t3('Laser on', 'लेज़र कहाँ', 'Laser kahan'), centre: t3('Back to the middle', 'बीच में वापस', 'Beech mein wapas'), turned: t3('Turned', 'घूमा', 'Ghooma'), speed: t3('Speed', 'रफ़्तार', 'Speed'), steps: t3('Steps', 'क़दम', 'Steps'),
  missed: t3('it hums: too fast!', 'यह गुनगुनाती है: बहुत तेज़!', 'yeh gungunati hai: bahut tez!'), keys: t3('Keypad', 'कीपैड', 'Keypad'), none: t3('none', 'कोई नहीं', 'koi nahi'),
};
export { W as SCENE_WORDS };
const bzOn = (lab) => lab.sounds.some((s) => s.kind === 'tone');
const ledOn = (lab, tag) => { const p = lab.byTag(tag); return !!p && (p.state.b || 0) > 0.18; };

class Scene {
  constructor(cfg) { this.cfg = cfg; this.kind = cfg.kind; this.flags = new Set(); this.res = {}; this.t = 0; CUR.sim = this; }
  flag(n) { return this.flags.has(n); }
  val(n) { return this[n]; }
  onRun() { this.runAt = this.t; }
  update() { return false; }
  control() {}
  hud() { return { title: t3('', '', ''), rows: [], controls: [] }; }
}

// ------------------------------------------------------------------ the air around the DHT11 (thermometer, weather station)
const SKY = { sunny: [34, 40], rainy: [24, 88], night: [9, 70] };
export class AirScene extends Scene {
  constructor(cfg) { super(cfg); this.room = 26; this.rh = 55; this.chai = 0; this.chaiPos = 0; this.breath = 0; this.sky = cfg.sky ? 'sunny' : null; if (this.sky) [this.room, this.rh] = SKY.sunny; this.seen = []; }
  update(dt, lab) {
    this.t += dt; this.chaiPos += clamp(this.chai - this.chaiPos, -dt * 1.2, dt * 1.2); this.breath = Math.max(0, this.breath - dt / 3.5);
    lab.env.temp = this.room + 17 * this.chaiPos + 5 * this.breath; lab.env.hum = clamp(this.rh + 14 * this.chaiPos + 32 * this.breath, 5, 95);
    // what the screen shows now
    const scr = this.screen(lab); const dht = lab.byTag('dht'); const R = this.res;
    const l0 = (this.lines(lab)[0] || '').trim(); if (l0 !== this.l0) { this.l0 = l0; this.l0t = this.t; } // a first line that stays for a while is a title, not a line being written
    if (l0.length >= 2 && this.t - this.l0t > 0.6 && !/DUET Thermometer|DUET Weather|Temp|Humid|\d\s*[CF%]/i.test(l0)) { this.flags.add('named'); R.name = l0; }
    const n = nums(scr); const F = /\d\s*F\b/.test(scr) && !/\d\s*C\b/.test(scr);
    if (n.length && dht && dht.state.powered) {
      const t = n[0], h = n.length > 1 ? n[1] : null;
      if (F) { if (t > 30 && t < 130) this.flags.add('fahrenheit'); R.tF = t; }
      else {
        if (R.t0 === undefined) { R.t0 = t; R.h0 = h; } R.tMax = Math.max(R.tMax ?? -99, t); R.tMin = Math.min(R.tMin ?? 999, t); if (h !== null) R.hMax = Math.max(R.hMax ?? -99, h);
        if (Math.abs(t - Math.round(dht.state.tS)) <= 2) this.flags.add('shown');
        if (t >= 35) this.flags.add('hot'); if (h !== null && h >= 75) this.flags.add('humid');
        if (this.sky && Math.abs(t - SKY[this.sky][0]) <= 2) { if (!this.seen.includes(this.sky)) this.seen.push(this.sky); R.skies = this.seen.slice(); if (Math.abs(t - R.t0) >= 6) this.flags.add('changed'); }
      }
    }
    return this.chaiPos > 0 && this.chaiPos < 1;
  }
  screen(lab) { return this.lines(lab).join(' '); }
  lines(lab) { const l = lab.byTag('lcd'); if (l) return lcdText(l); const o = lab.byTag('oled'); return o && o.state.powered && o.state.on && o.state.text ? o.state.text.split('\n') : []; }
  control(id, v) { if (id === 'chai') this.chai = +v; if (id === 'breathe') this.breath = 1; if (id === 'room') this.room = +v; if (id === 'rh') this.rh = +v; if (id === 'sky') { this.sky = v; [this.room, this.rh] = SKY[v]; } }
  hud(lab) {
    const dht = lab.byTag('dht'); const scr = this.screen(lab);
    const rows = [[tx(W.temp), `${lab.env.temp.toFixed(1)} °C`], [tx(W.hum), `${Math.round(lab.env.hum)} %`], [tx(W.screen), scr ? scr.replace(/\s+/g, ' ').trim().slice(0, 28) : '—']];
    void dht;
    const controls = this.sky ? [{ id: 'sky', kind: 'seg', label: W.sky, options: [['sunny', W.sunny], ['rainy', W.rainy], ['night', W.night]], value: this.sky }]
      : [{ id: 'chai', kind: 'seg', label: W.chai, options: [['0', W.away], ['1', W.near]], value: String(this.chai) }, { id: 'breathe', kind: 'button', label: W.breathe }, { id: 'room', kind: 'range', label: W.room, min: 10, max: 45, value: this.room, unit: '°C' }];
    return { title: this.sky ? t3('Weather station', 'मौसम केंद्र', 'Weather station') : t3('Room thermometer', 'कमरे का थर्मामीटर', 'Room ka thermometer'), rows, controls };
  }
}

// ------------------------------------------------------------------ the plant in its pot, the tank and the pump (smart irrigation)
export class GardenScene extends Scene {
  constructor(cfg) { super(cfg); this.m = 0.3; this.tank = 1500; this.health = 0.55; this.sun = true; this.ml = 0; this.run = null; this.cycles = 0; this.drip = 0; this.runs = 0; this.stopRun = -1; }
  onRun() { super.onRun(); this.runs++; }
  update(dt, lab) {
    this.t += dt; const soil = lab.byTag('soil'), pump = lab.byTag('pump'); const flow = pump && this.tank > 0 ? pump.state.flow : 0;
    const water = Math.min(this.tank, flow * dt); this.tank -= water; this.ml += water;
    this.m += water * 0.0045 - (this.sun ? 0.011 : 0.004) * dt * (0.4 + this.m);
    if (this.m > 0.92) { this.drip = Math.min(1, this.drip + dt); this.m = 0.92; this.flags.add('overflow'); } else this.drip = Math.max(0, this.drip - dt * 0.5);
    this.m = clamp(this.m, 0.05, 0.92);
    this.health = clamp(this.health + (this.m < 0.22 ? -0.03 : this.m > 0.4 ? 0.05 : 0) * dt, 0, 1);
    if (soil) soil.state.moist = this.m;
    const read = soil && soil.state.powered ? Math.round((soil.state.ao || 0) / 5 * 1023) : null; this.read = read;
    // a watering: the pump comes on while the soil is dry, and goes off again once it is wet
    const on = flow > 5;
    if (on && !this.run) { this.run = { m0: this.m, read0: read, ml0: this.ml }; this.flags.add('pumpOn'); }
    if (this.run && this.m < this.run.m0) { this.run.m0 = this.m; this.run.read0 = read; } // (dried while the pump was on: count from the driest)
    if (this.run && on && this.m - this.run.m0 > 0.15) this.flags.add('watered');
    if (this.run && !on) { if (this.m - this.run.m0 > 0.15) { this.cycles++; this.flags.add('stopped'); this.stopRun = this.runs; this.res.dry = this.run.read0; this.res.wet = read; this.res.ml = Math.round(this.ml - this.run.ml0); this.res.cycles = this.cycles; if (this.cycles >= 2) this.flags.add('cycle2'); } this.run = null; }
    return on || this.drip > 0;
  }
  control(id, v) { if (id === 'sun') this.sun = v === '1'; if (id === 'dry') this.m = Math.min(this.m, 0.2); if (id === 'refill') this.tank = 1500; }
  hud(lab) {
    const pump = lab.byTag('pump'); const st = this.m < 0.35 ? W.dry : this.m < 0.6 ? W.damp : W.wet;
    return { title: t3('Smart garden', 'स्मार्ट बगीचा', 'Smart garden'),
      rows: [[tx(W.soil), `${Math.round(this.m * 100)} % · ${tx(st)}`], [tx(W.sensorSays), this.read === null || this.read === undefined ? '—' : String(this.read)], [tx(W.pump), pump && pump.state.flow > 5 ? `${tx(W.on)} · ${Math.round(pump.state.flow)} mL/s` : tx(W.off)],
        [tx(W.tank), `${Math.round(this.tank)} mL`], [tx(W.plant), tx(this.health > 0.45 ? W.happy : W.wilting)]],
      controls: [{ id: 'sun', kind: 'seg', label: W.sun, options: [['1', W.on], ['0', W.off]], value: this.sun ? '1' : '0' }, { id: 'dry', kind: 'button', label: W.dryIt }, { id: 'refill', kind: 'button', label: W.refill }] };
  }
}

// ------------------------------------------------------------------ the room: a 230 V lamp and fan, switched by relays from the remote
const REMOTE_ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['*', '0', '#'], ['UP', 'LEFT', 'OK', 'RIGHT', 'DOWN']];
const KEYLABEL = { UP: '▲', DOWN: '▼', LEFT: '◀', RIGHT: '▶', OK: 'OK' };
export class RoomScene extends Scene {
  constructor(cfg) { super(cfg); this.presses = []; this.lastKey = null; }
  update(dt, lab) {
    this.t += dt; const lamp = lab.byTag('lamp'), fan = lab.byTag('fan');
    if (lamp && lamp.state.on) this.flags.add('lampOn'); if (lamp && this.flags.has('lampOn') && !lamp.state.on) this.flags.add('lampOff');
    if (fan && fan.state.on) this.flags.add('fanOn'); if (fan && this.flags.has('fanOn') && !fan.state.on) this.flags.add('fanOff');
    this.res.lampOn = this.flags.has('lampOn'); this.res.fanOn = this.flags.has('fanOn');
    return !!(fan && fan.state.w > 0.02) || this.flash > 0;
  }
  press(lab, key) { const n = irSend(lab, key); this.lastKey = key; this.presses.push(key); this.res.keys = this.presses.slice(-8); this.flash = 0.25; return n; }
  control(id, v, lab) { if (id.startsWith('rc')) this.press(lab, v); }
  hud(lab) {
    const lamp = lab.byTag('lamp'), fan = lab.byTag('fan');
    return { title: t3('Smart room', 'स्मार्ट कमरा', 'Smart room'),
      rows: [[tx(W.lamp), lamp && lamp.state.on ? tx(W.on) : tx(W.off)], [tx(W.fan), fan && fan.state.on ? tx(W.on) : fan && fan.state.w > 0.05 ? '…' : tx(W.off)], [tx(W.last), this.lastKey ? KEYLABEL[this.lastKey] || this.lastKey : '—']],
      controls: REMOTE_ROWS.map((r, i) => ({ id: 'rc' + i, kind: 'seg', label: i ? '' : W.remote, options: r.map((k) => [k, KEYLABEL[k] || k]), value: this.lastKey })) };
  }
}

// ------------------------------------------------------------------ the burglar: someone walks across the room in front of the PIR
export class BurglarScene extends Scene {
  constructor(cfg) { super(cfg); this.walk = null; this.alarmT = 0; }
  update(dt, lab) {
    this.t += dt; const pir = lab.byTag('pir');
    if (this.walk) { this.walk.t += dt; if (this.walk.t > this.walk.len) { this.res.lastWho = this.walk.who; this.walk = null; } }
    const moving = !!(this.walk && this.walk.t > 0.4 && this.walk.t < this.walk.len - 0.4);
    if (pir) pir.state.motion = moving;
    const sounding = bzOn(lab) || ledOn(lab, 'led1');
    if (pir && pir.state.out && pir.state.age > 2.5) this.flags.add('seen');
    if (this.flags.has('seen') && sounding && pir && pir.state.out && pir.state.age > 2.5) { this.flags.add('alarm'); this.alarmT += dt; if (this.res.delay === undefined && this.walkAt !== undefined) this.res.delay = +(this.t - this.walkAt).toFixed(1); }
    if (this.flags.has('alarm') && !this.walk && pir && !pir.state.out && !sounding) { this.flags.add('quiet'); this.res.alarmSecs = +this.alarmT.toFixed(1); }
    return !!this.walk;
  }
  onRun() { super.onRun(); for (const k of ['seen', 'alarm', 'quiet']) this.flags.delete(k); this.alarmT = 0; delete this.res.delay; }
  control(id) { if (id === 'walk' || id === 'cat') { this.walk = { who: id, t: 0, len: id === 'cat' ? 3.0 : 4.2 }; this.walkAt = this.t; this.alarmT = 0; delete this.res.delay; for (const k of ['quiet']) this.flags.delete(k); } }
  hud(lab) {
    const pir = lab.byTag('pir'); const learn = pir && pir.state.powered && pir.state.age < 2.5;
    return { title: t3('Burglar alarm', 'चोर अलार्म', 'Chor alarm'),
      rows: [[tx(W.pir), !pir || !pir.state.powered ? '—' : learn ? tx(W.learning) : pir.state.out ? 'HIGH' : 'LOW'], [tx(W.alarm), bzOn(lab) ? '🔔 ' + tx(W.on) : tx(W.off)]],
      controls: [{ id: 'walk', kind: 'button', label: W.walk }, { id: 'cat', kind: 'button', label: W.cat }] };
  }
}

// ------------------------------------------------------------------ the door with an RFID lock (the servo pulls the latch)
export class DoorScene extends Scene {
  constructor(cfg) { super(cfg); this.door = 0; this.shown = []; this.showing = null; }
  latch(lab) { const sv = lab.byTag('sv1'); return sv ? sv.state.angle : 0; }
  update(dt, lab) {
    this.t += dt; const a = this.latch(lab); const open = a > 75; const rf = lab.byTag('rf');
    this.door += clamp((open ? 1 : 0) - this.door, -dt * 0.9, dt * 1.4); // a spring pushes it open; it swings shut when the latch closes
    if (rf && rf.state.reads) this.flags.add('cardSeen');
    const c = this.showing; // a card held on the reader: did the latch open within 3 s? (shown while the door was still open: it counts from when it locks)
    if (c && !c.done) { if (c.wasOpen) { if (!open) { c.wasOpen = false; c.t = this.t; } } else if (open) { c.done = true; this.flags.add('opened'); this.res.openedBy = c.id; } else if (this.t - c.t > 3) { c.done = true; this.flags.add('denied'); this.res.deniedId = c.id; } }
    if (this.flags.has('opened') && !open && this.door < 0.05) this.flags.add('relocked');
    return Math.abs(this.door - (open ? 1 : 0)) > 0.001;
  }
  onRun() { super.onRun(); this.showing = null; for (const k of ['opened', 'denied', 'relocked']) this.flags.delete(k); }
  control(id, v, lab) { if (id === 'card' || id === 'tag') { rfidShow(lab, id); this.showing = { id, t: this.t, wasOpen: this.latch(lab) > 75 }; this.shown.push(id); this.res.shown = [...new Set(this.shown)]; } }
  hud(lab) {
    const rf = lab.byTag('rf'); const a = this.latch(lab);
    return { title: t3('RFID door lock', 'आरएफ़आईडी दरवाज़ा लॉक', 'RFID darwaza lock'),
      rows: [[tx(W.latch), `${Math.round(a)}° · ${tx(a > 75 ? W.open : W.locked)}`], [tx(W.door), tx(this.door > 0.1 ? W.open : W.locked)], [tx(W.lastCard), this.showing ? tx(CARDS[this.showing.id].name) + ' · ' + uidText(CARDS[this.showing.id].uid) : '—'], ['RC522', rf && rf.state.over ? '⚠ 5 V!' : rf && rf.state.powered ? '3.3 V ✓' : '—']],
      controls: [{ id: 'card', kind: 'button', label: W.card }, { id: 'tag', kind: 'button', label: W.tag }] };
  }
}

// ------------------------------------------------------------------ the classroom door's attendance register (batch 16)
// The same door, card and tag; no latch. The flags come from what the LCD really shows: "Tap your card" (ready),
// "<name> Present" (asha / ravi), "Unknown card", "Already marked", and the count on its second line (n1, n2, …).
export class AttendScene extends Scene {
  constructor(cfg) { super(cfg); this.door = 0; this.showing = null; this.marked = new Set(); this.res.count = 0; this.last = ''; }
  update(dt, lab) {
    this.t += dt; const rf = lab.byTag('rf'); if (rf && rf.state.reads) this.flags.add('cardSeen');
    const l = lab.byTag('lcd'); const ls = l ? lcdText(l).map((x) => String(x).trim()) : []; const s = ls.join('\n');
    if (s !== this.last) {
      this.last = s;
      if (/^tap your card/i.test(ls[0] || '')) this.flags.add('ready');
      if (/^unknown card/i.test(ls[0] || '')) { this.flags.add('unknown'); this.res.unknown = ls[1] || ''; }
      if (/^already/i.test(ls[1] || '')) { this.flags.add('already'); this.res.already = ls[0]; }
      const m = /^(\w+)\s+present$/i.exec(ls[0] || ''); if (m) { this.flags.add(m[1].toLowerCase()); this.marked.add(m[1]); this.res.names = [...this.marked]; }
      const c = /^(?:count|present)\s*:\s*(\d+)/i.exec(ls[1] || ''); if (c && +c[1] > 0) { this.flags.add('n' + c[1]); this.res.count = Math.max(this.res.count, +c[1]); }
    }
    return false;
  }
  onRun() { super.onRun(); this.showing = null; this.last = ''; this.marked = new Set(); this.res.count = 0; delete this.res.names; for (const k of [...this.flags]) if (k !== 'cardSeen') this.flags.delete(k); }
  control(id, v, lab) { if (id === 'card' || id === 'tag') { rfidShow(lab, id); this.showing = { id, t: this.t }; } }
  hud(lab) {
    const rf = lab.byTag('rf'); const l = lab.byTag('lcd'); const ls = l ? lcdText(l) : ['', ''];
    return { title: t3('Attendance register', 'हाज़िरी रजिस्टर', 'Attendance register'),
      rows: [[tx(W.screen), (ls[0] || '').trim() || '—'], ['', (ls[1] || '').trim() || '—'], [tx(W.lastCard), this.showing ? tx(CARDS[this.showing.id].name) + ' · ' + uidText(CARDS[this.showing.id].uid) : '—'], ['RC522', rf && rf.state.over ? '⚠ 5 V!' : rf && rf.state.powered ? '3.3 V ✓' : '—']],
      controls: [{ id: 'card', kind: 'button', label: W.cardAsha }, { id: 'tag', kind: 'button', label: W.tagRavi }] };
  }
}

// ------------------------------------------------------------------ the keypad locker (the servo pulls its latch)
export class LockerScene extends Scene {
  constructor(cfg) { super(cfg); this.door = 0; this.typed = ''; this.pend = null; }
  update(dt, lab) {
    this.t += dt; const sv = lab.byTag('sv1'); const a = sv ? sv.state.angle : 0; const open = a > 75;
    this.door += clamp((open ? 1 : 0) - this.door, -dt * 0.9, dt * 1.4);
    const P = this.pend;
    if (P && open) { this.flags.add('opened'); this.res.code = P.code; this.pend = null; }
    else if (P && this.t - P.t > 1.6) { if (P.beep) { this.flags.add('wrong'); this.res.wrongCode = P.code; } this.pend = null; }
    if (P && bzOn(lab) && this.t - P.t > 0.3) P.beep = true; // the long beep after # (a key's own beep is shorter)
    if (this.flags.has('opened') && !open && this.door < 0.05) this.flags.add('relocked');
    return Math.abs(this.door - (open ? 1 : 0)) > 0.001;
  }
  onRun() { super.onRun(); this.typed = ''; this.pend = null; for (const k of ['opened', 'wrong', 'relocked']) this.flags.delete(k); }
  press(lab, key) { const kp = lab.byTag('kp'); if (!kp) return; const r = KEYMAP.findIndex((row) => row.includes(key)); keyPress(lab, kp, r * 4 + KEYMAP[r].indexOf(key), 0.25); this.typedKey(key); }
  typedKey(key) { // a key the student pressed (the panel, the 3D keypad, the callout): what the locker has been told so far
    this.typed = (this.typed + key).slice(-12);
    if (key === '#') { this.pend = { t: this.t, code: this.typed.slice(0, -1).replace(/.*\*/, '') }; this.typed = ''; }
    if (key === '*') this.typed = '';
  }
  control(id, v, lab) { if (id.startsWith('kp')) this.press(lab, v); }
  hud(lab) {
    const sv = lab.byTag('sv1'); const a = sv ? sv.state.angle : 0;
    return { title: t3('Keypad locker', 'कीपैड लॉकर', 'Keypad locker'),
      rows: [[tx(W.typed), this.typed ? this.typed.replace(/./g, '•') : '—'], [tx(W.latch), `${Math.round(a)}° · ${tx(a > 75 ? W.open : W.locked)}`], [tx(W.locker), tx(this.door > 0.1 ? W.open : W.locked)]],
      controls: KEYMAP.map((r, i) => ({ id: 'kp' + i, kind: 'seg', label: i ? '' : W.keys, options: r.map((k) => [k, k]), value: null })) };
  }
}


// ------------------------------------------------------------------ the bank locker (batch 17): the locker, opened by a card AND a PIN
export class BankScene extends LockerScene {
  constructor(cfg) { super(cfg); this.showing = null; }
  update(dt, lab) { const r = super.update(dt, lab); const rf = lab.byTag('rf'); if (rf && rf.state.reads) this.flags.add('cardSeen'); return r; }
  control(id, v, lab) { if (id === 'card' || id === 'tag') { rfidShow(lab, id); this.showing = { id, t: this.t }; return; } super.control(id, v, lab); }
  hud(lab) {
    const h = super.hud(lab); const rf = lab.byTag('rf'); h.title = t3('Bank locker', 'बैंक लॉकर', 'Bank locker');
    h.rows.push([tx(W.lastCard), this.showing ? tx(CARDS[this.showing.id].name) + ' · ' + uidText(CARDS[this.showing.id].uid) : '—'], ['RC522', rf && rf.state.over ? '⚠ 5 V!' : rf && rf.state.powered ? '3.3 V ✓' : '—']);
    h.controls = [{ id: 'card', kind: 'button', label: W.card }, { id: 'tag', kind: 'button', label: W.tag }, ...h.controls]; return h;
  }
}

// ------------------------------------------------------------------ the rooftop water tank (batch 17): the pump fills it from the sump through
// the relay, the house's taps draw from it, and the HC-SR04 in its lid measures the air above the water (us1.state.dist,
// cm). 100 cm deep, the sensor 8 cm above the brim, so the level in % = 108 − the distance in cm.
export const TANK = { depth: 100, lid: 8, fill: 4, use: 1.6 }; // cm; cm; cm/s at the pump's full flow; cm/s with the tap open
export class TankScene extends Scene {
  constructor(cfg) { super(cfg); this.h = cfg.h0 === undefined ? 60 : cfg.h0; this.tap = false; this.sump = true; this.pumpWas = false; this.dryT = 0; this.cycles = 0; this.spill = 0; }
  flow(lab) { const p = lab.byTag('pump'); return p ? p.state.flow || 0 : 0; }
  update(dt, lab) {
    this.t += dt; const f = this.flow(lab); const on = f > 5; const lift = on && this.sump ? TANK.fill * Math.min(1, f / 30) : 0;
    this.h = clamp(this.h + (lift - (this.tap ? TANK.use : 0)) * dt, 0, TANK.depth);
    if (this.h >= TANK.depth && lift > 0) { this.spill = Math.min(1, this.spill + dt * 2); this.flags.add('overflow'); } else this.spill = Math.max(0, this.spill - dt);
    const us = lab.byTag('us1'); if (us) { const d = +(TANK.lid + TANK.depth - this.h).toFixed(1); if (us.state.dist !== d) us.state.dist = d; }
    const lv = Math.round(this.h); this.res.min = Math.min(this.res.min ?? lv, lv); this.res.max = Math.max(this.res.max ?? lv, lv);
    if (this.tap) this.flags.add('tapUsed');
    if (on && !this.pumpWas) { this.flags.add('pumpOn'); this.res.onAt = lv; if (lv < 60) this.flags.add('autoOn'); }
    if (!on && this.pumpWas) { this.res.offAt = lv; if (this.sump && lv >= 80 && lv < TANK.depth) { this.flags.add('full'); this.cycles++; this.res.cycles = this.cycles; } if (!this.sump) this.flags.add('dryOff'); }
    this.dryT = on && !this.sump ? this.dryT + dt : 0; if (this.dryT > 2) this.flags.add('dryRun');
    if (!this.sump && !on && this.flags.has('dryOff') && bzOn(lab)) this.flags.add('dryStop');
    this.pumpWas = on;
    return on || this.tap || this.spill > 0;
  }
  onRun() { super.onRun(); for (const k of ['pumpOn', 'autoOn', 'full', 'dryOff', 'dryRun', 'dryStop', 'overflow']) this.flags.delete(k); delete this.res.onAt; delete this.res.offAt; this.cycles = 0; delete this.res.cycles; }
  control(id, v) { if (id === 'tap') this.tap = v === '1'; if (id === 'sump') this.sump = v === '1'; }
  hud(lab) {
    const f = this.flow(lab); const us = lab.byTag('us1');
    return { title: t3('Rooftop water tank', 'छत की पानी की टंकी', 'Chhat ki paani ki tanki'),
      rows: [[tx(W.tankLevel), `${Math.round(this.h)} %`], [tx(W.sonarSees), us && us.state.powered ? `${us.state.dist.toFixed(0)} cm` : '—'], [tx(W.pump), f > 5 ? (this.sump ? '💧 ' + tx(W.on) : '⚠ ' + tx(W.dryRunW)) : tx(W.off)]],
      controls: [{ id: 'tap', kind: 'seg', label: W.taps, options: [['0', W.closed], ['1', W.opened]], value: this.tap ? '1' : '0' }, { id: 'sump', kind: 'seg', label: W.sumpW, options: [['1', W.sumpFull], ['0', W.sumpDry]], value: this.sump ? '1' : '0' }] };
  }
}

// ------------------------------------------------------------------ the polyhouse (batch 17): the garden's plant, soil, pump and tank, and now
// the air too. The sun heats it towards 39 °C (night: 24 °C); the fan (a DC motor through relay rl2) pulls it 9 °C cooler;
// the DHT11 reads that air (lab.env), the LDR on the bench sees the sun (its own lux), the grow light is led1.
export class GreenhouseScene extends GardenScene {
  constructor(cfg) { super(cfg); this.temp = 30; this.hum = 60; this.res.tMax = 30; }
  fanOn(lab) { const f = lab.byTag('fan'); return !!(f && Math.abs(f.state.w || 0) > 20); }
  update(dt, lab) {
    const r = super.update(dt, lab); const fan = this.fanOn(lab);
    const target = (this.sun ? 39 : 24) - (fan ? 9 : 0); this.temp += (target - this.temp) * Math.min(1, dt * 0.12);
    const hT = clamp(50 + (this.m - 0.4) * 70 - (fan ? 15 : 0) + (this.sun ? 0 : 12), 25, 95); this.hum += (hT - this.hum) * Math.min(1, dt * 0.1);
    lab.env.temp = Math.round(this.temp * 10) / 10; lab.env.hum = Math.round(this.hum);
    const ldr = lab.byTag('ldr1'); if (ldr) { ldr.state.ext = true; const lx = this.sun ? 20000 : 2; if (ldr.state.lux !== lx) { ldr.state.lux = lx; lab.stateV++; lab.instKey = null; } }
    this.res.tMax = Math.max(this.res.tMax, Math.round(this.temp));
    if (fan && !this.fanWas) { this.flags.add('fanOn'); this.res.fanAt = Math.round(this.temp); }
    if (fan && this.temp < (this.res.fanAt || 99) - 2) this.flags.add('cooled');
    if (!fan && this.fanWas) this.flags.add('fanOff');
    this.heldT = this.sun && fan && this.temp <= 31 ? (this.heldT || 0) + dt : 0; if (this.heldT > 8) { this.flags.add('held'); this.res.held = Math.round(this.temp); } // (the fan keeps a sunny house at 31 °C or less)
    this.fanWas = fan;
    const grow = ledOn(lab, 'led1'); if (grow && !this.sun) this.flags.add('growNight'); if (!grow && this.sun && this.flags.has('growNight')) this.flags.add('growOffDay');
    return r || fan || Math.abs(target - this.temp) > 0.1;
  }
  onRun() { super.onRun(); for (const k of ['fanOn', 'cooled', 'fanOff', 'growNight', 'growOffDay', 'held']) this.flags.delete(k); delete this.res.fanAt; delete this.res.held; this.fanWas = false; this.heldT = 0; }
  hud(lab) {
    const h = super.hud(lab); h.title = t3('Smart greenhouse', 'स्मार्ट ग्रीनहाउस', 'Smart greenhouse');
    h.rows.unshift([tx(W.temp), `${this.temp.toFixed(1)} °C`], [tx(W.hum), `${Math.round(this.hum)} %`], [tx(W.fanW), this.fanOn(lab) ? '🌀 ' + tx(W.on) : tx(W.off)], [tx(W.growW), ledOn(lab, 'led1') ? '💡 ' + tx(W.on) : tx(W.off)]);
    return h;
  }
}
// ------------------------------------------------------------------ the kitchen: an LPG cylinder, the stove's knob, the window
export class KitchenScene extends Scene {
  constructor(cfg) { super(cfg); this.ppm = 5; this.leak = 0; this.win = false; }
  update(dt, lab) {
    this.t += dt; this.ppm += this.leak / 100 * 1100 * dt - this.ppm * (this.win ? 0.55 : 0.035) * dt; this.ppm = clamp(this.ppm, 5, 20000);
    const mq = lab.byTag('mq'); if (mq) mq.state.ppm = this.ppm;
    const read = mq && mq.state.powered ? Math.round((mq.state.ao || 0) / 5 * 1023) : null; this.read = read;
    if (mq && mq.state.warm > 0.9) { this.flags.add('warm'); if (this.res.clean === undefined && this.ppm < 20) this.res.clean = read; }
    const sounding = bzOn(lab) && ledOn(lab, 'led1');
    if (sounding && this.ppm > 100) { this.flags.add('alarm'); if (this.res.alarmAt === undefined) this.res.alarmAt = read; }
    if (read !== null && this.flags.has('alarm')) this.res.max = Math.max(this.res.max || 0, read);
    if (this.flags.has('alarm') && this.ppm < 150 && !bzOn(lab) && !ledOn(lab, 'led1')) this.flags.add('safe');
    return this.leak > 0 || this.ppm > 20;
  }
  onRun() { super.onRun(); this.flags.delete('alarm'); delete this.res.alarmAt; }
  control(id, v) { if (id === 'leak') this.leak = +v; if (id === 'win') this.win = v === '1'; }
  hud(lab) {
    const mq = lab.byTag('mq');
    return { title: t3('Kitchen gas alarm', 'रसोई गैस अलार्म', 'Rasoi gas alarm'),
      rows: [[tx(W.gas), `${Math.round(this.ppm)} ppm`], lab.def && lab.def.id === 'pico' ? ['MQ-2 AO', mq && mq.state.powered ? (mq.state.warm < 0.9 ? tx(W.warmUp) + ' ' : '') + (mq.state.ao || 0).toFixed(2) + ' V' : '—'] : [tx(W.sensorSays), mq && mq.state.powered ? (mq.state.warm < 0.9 ? tx(W.warmUp) + ' ' : '') + (this.read ?? '—') : '—'], [tx(W.alarm), bzOn(lab) ? '🔔 ' + tx(W.on) : tx(W.off)]],
      controls: [{ id: 'leak', kind: 'range', label: W.leak, min: 0, max: 100, value: this.leak, unit: '%' }, { id: 'win', kind: 'seg', label: W.window, options: [['0', W.closed], ['1', W.opened]], value: this.win ? '1' : '0' }] };
  }
}

// ------------------------------------------------------------------ the pan-tilt head with a laser and a target board
export const PT_TARGETS = { A: [125, 65], B: [55, 112] }; // [pan°, tilt°] where each target is
export class PanTiltScene extends Scene {
  constructor(cfg) { super(cfg); this.pan = 90; this.tilt = 90; }
  update(dt, lab) {
    this.t += dt; const p = lab.byTag('svP'), q = lab.byTag('svT'); this.pan = p ? p.state.angle : 90; this.tilt = q ? q.state.angle : 90;
    for (const [k, [a, b]] of Object.entries(PT_TARGETS)) if (Math.hypot(this.pan - a, this.tilt - b) < 12 && (p && p.state.target != null)) { this.flags.add('hit' + k); this.res['hit' + k] = [Math.round(this.pan), Math.round(this.tilt)]; }
    this.res.panRange = [Math.min(this.res.panRange?.[0] ?? 999, this.pan), Math.max(this.res.panRange?.[1] ?? -999, this.pan)].map(Math.round);
    return false;
  }
  control(id, v, lab) { if (id === 'centre') { const js = lab.byTag('js'); if (js) { js.state.x = 0.5; js.state.y = 0.5; lab.stateV++; } } }
  hud() {
    const near = Object.entries(PT_TARGETS).find(([, [a, b]]) => Math.hypot(this.pan - a, this.tilt - b) < 12);
    return { title: t3('Pan-tilt laser', 'पैन-टिल्ट लेज़र', 'Pan-tilt laser'), rows: [[tx(W.pan), `${Math.round(this.pan)}°`], [tx(W.tilt), `${Math.round(this.tilt)}°`], [tx(W.target), near ? '🎯 ' + near[0] : '—']], controls: [] };
  }
}

// ------------------------------------------------------------------ the turntable on the stepper
export class TurnScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = 0; this.runs = []; }
  update(dt, lab) {
    this.t += dt; const st = lab.byTag('st'); if (!st) return false; const a = st.state.angle - this.a0; this.turn = a; const n = Math.round((st.state.steps || 0) - (this.s0 || 0)); this.res.steps = n; this.res.turn = +(n * 360 / 2048).toFixed(1);
    const still = Math.abs(st.state.rpm || 0) < 0.05;
    if (Math.abs(a) >= 88) this.flags.add('quarter'); if (Math.abs(a) >= 358 && still) this.flags.add('full'); if (Math.abs(a) >= 178 && Math.abs(a) <= 182) this.flags.add('half');
    if (this.flags.has('quarter') && this.maxA !== undefined && a < this.maxA - 85) this.flags.add('back');
    this.maxA = Math.max(this.maxA ?? -1e9, a); this.miss = st.state.missT && lab.mcu.t - st.state.missT < 3e5;
    return Math.abs(st.state.rpm || 0) > 0.05;
  }
  onRun(lab) { super.onRun(); const st = lab && lab.byTag('st'); this.a0 = st ? st.state.angle : 0; this.s0 = st ? st.state.steps || 0 : 0; this.maxA = undefined; for (const k of ['quarter', 'half', 'full', 'back']) this.flags.delete(k); }
  hud(lab) {
    const st = lab.byTag('st');
    return { title: t3('Stepper turntable', 'स्टेपर टर्नटेबल', 'Stepper turntable'), rows: [[tx(W.turned), `${(this.turn || 0).toFixed(1)}°`], [tx(W.steps), String(st ? Math.round(st.state.steps || 0) : 0)], [tx(W.speed), st ? (this.miss ? tx(W.missed) : `${Math.abs(st.state.rpm || 0).toFixed(1)} rpm`) : '—']], controls: [] };
  }
}

// ------------------------------------------------------------------ the water ATM (batch 24, Class 11): an RO kiosk
// A card or tag shown on the RC522 puts a fresh empty glass under the kiosk's tap; the pump (relay rl1) pours into it, and
// the scene measures what really went in (the pump's flow, mL/s): short (< 225 mL), full (225–275), over (> 275; a glass
// holds 300, the rest spills). The LCD tells the rest: "Tap your card" (ready), "Low balance" (low), "Unknown card", and
// "Bal: Rs n". A card refused: shown, "Low balance" on the LCD and nothing poured in the next 3 s.
const WA = {
  glass: t3('Glass under the tap', 'नल के नीचे गिलास', 'Nal ke neeche glass'), poured: t3('Last glass', 'पिछला गिलास', 'Pichhla glass'),
  title: t3('Water ATM', 'वॉटर एटीएम', 'Water ATM'), spill: t3('spilling!', 'छलक रहा है!', 'chhalak raha hai!'),
};
export const GLASS = { full: 250, lo: 225, hi: 275, cap: 300 };
export class AtmScene extends Scene {
  constructor(cfg) { super(cfg); this.ml = 0; this.showing = null; this.last = ''; this.pouring = false; this.res.glasses = []; this.res.bal = {}; }
  flow(lab) { const p = lab.byTag('pump'); return p ? p.state.flow || 0 : 0; }
  update(dt, lab) {
    this.t += dt; const f = this.flow(lab); const on = f > 5; const ml0 = this.ml;
    if (f > 0.2) this.ml += f * dt;
    if (on) this.pouring = true;
    else if (this.pouring && f < 0.5) { this.pouring = false; this.glassDone(); }
    const rf = lab.byTag('rf'); if (rf && rf.state.reads) this.flags.add('cardSeen');
    const l = lab.byTag('lcd'); const ls = l ? lcdText(l).map((x) => String(x).trim()) : []; const txt = ls.join('\n');
    if (txt !== this.last) {
      this.last = txt;
      if (/tap your card/i.test(txt)) this.flags.add('ready');
      if (/low balance/i.test(txt)) { this.flags.add('low'); if (this.showing) this.showing.low = true; }
      if (/unknown card/i.test(txt)) this.flags.add('unknown');
      const b = /bal\w*\s*:?\s*rs\.?\s*(\d+)/i.exec(txt); if (b && this.showing) { this.res.bal[this.showing.id] = +b[1]; this.flags.add('bal'); }
    }
    const c = this.showing; if (c && !c.done && this.t - c.t > 3) { c.done = true; if (c.low && !c.poured) { this.flags.add('refused'); this.res.refused = c.id; } }
    if (on && c) c.poured = true;
    return on || this.ml !== ml0;
  }
  glassDone() {
    const ml = Math.round(this.ml); this.res.glasses.push(ml); this.res.last = ml; this.flags.add('poured');
    this.flags.add(ml < GLASS.lo ? 'short' : ml <= GLASS.hi ? 'full' : 'over');
  }
  onRun() { super.onRun(); for (const k of ['poured', 'short', 'full', 'over', 'low', 'refused', 'ready', 'bal']) this.flags.delete(k); this.showing = null; this.pouring = false; this.ml = 0; }
  control(id, v, lab) {
    if (id !== 'card' && id !== 'tag') return;
    if (!this.pouring) this.ml = 0; // a fresh empty glass under the tap
    rfidShow(lab, id); this.showing = { id, t: this.t };
  }
  hud(lab) {
    const f = this.flow(lab);
    return { title: WA.title,
      rows: [[tx(WA.glass), `${Math.round(Math.min(this.ml, GLASS.cap))} / ${GLASS.full} mL${this.ml > GLASS.cap ? ' · ' + tx(WA.spill) : ''}`], [tx(W.pump), f > 5 ? '💧 ' + tx(W.on) : tx(W.off)],
        [tx(WA.poured), this.res.last !== undefined ? `${this.res.last} mL` : '—'], [tx(W.lastCard), this.showing ? tx(CARDS[this.showing.id].name) + ' · ' + uidText(CARDS[this.showing.id].uid) : '—']],
      controls: [{ id: 'card', kind: 'button', label: W.card }, { id: 'tag', kind: 'button', label: W.tag }] };
  }
}

// ------------------------------------------------------------------ the rotary vending machine (batch 24, Class 11)
// A round tray of 6 compartments on the stepper's shaft (60° apart, compartment 1 at the door at Run) under a cover with
// one door at the front. The student chooses on the 4×4 keypad (a digit, then #). Each move of the tray is measured from
// start to stop (res.moves: degrees); when it stops, the compartment at the door is the one within 6° of it, or none
// (jam: the tray stopped between two doors). Flags: jam, served (and served1…served6), wrong (another item than chosen),
// longway (one compartment away but the tray went most of the way round), shortway (6 → 1 in about 60°).
export const VEND = { slots: 6, items: ['Chips', 'Biscuits', 'Juice', 'Chocolate', 'Peanuts', 'Water'], prices: [20, 10, 30, 40, 15, 20] };
export class VendScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = 0; this.typed = ''; this.chosen = null; this.moving = false; this.stillT = 0; this.res.moves = []; }
  angle(lab) { const st = lab.byTag('st'); return st ? (st.state.angle || 0) - this.a0 : 0; }
  atDoor(a) { const k = ((Math.round(a / 60) % 6) + 6) % 6; const off = Math.abs(a - Math.round(a / 60) * 60); return off <= 6 ? k + 1 : 0; }
  update(dt, lab) {
    this.t += dt; const st = lab.byTag('st'); if (!st) return false; const a = this.angle(lab); this.ang = a;
    const mov = Math.abs(st.state.rpm || 0) > 0.05;
    if (mov) { if (!this.moving) { this.moving = true; this.from = { a: this.lastA ?? a, k: this.atDoor(this.lastA ?? a) }; } this.stillT = 0; }
    else if (this.moving) { this.stillT += dt; if (this.stillT > 0.3) { this.moving = false; this.stopped(a); } }
    if (!this.moving) this.lastA = a;
    return mov;
  }
  stopped(a) {
    const d = +(a - this.from.a).toFixed(1); const k = this.atDoor(a); this.res.moves.push(d); this.res.last = { d, k, at: +a.toFixed(1) };
    if (!k) { this.flags.add('jam'); this.res.jamAt = +a.toFixed(1); return; }
    this.flags.add('served'); this.flags.add('served' + k); this.res.served = k;
    if (this.chosen && this.chosen !== k) this.flags.add('wrong');
    const away = Math.min(Math.abs(k - this.from.k), 6 - Math.abs(k - this.from.k));
    if (this.from.k && away === 1 && Math.abs(d) > 200) this.flags.add('longway');
    if (this.from.k === 6 && k === 1 && Math.abs(d) < 90) this.flags.add('shortway');
  }
  onRun(lab) { super.onRun(); const st = lab && lab.byTag('st'); this.a0 = st ? st.state.angle || 0 : 0; this.lastA = 0; this.moving = false; this.typed = ''; this.chosen = null; for (const k of [...this.flags]) if (/^(jam|served\d?|wrong|longway|shortway)$/.test(k)) this.flags.delete(k); }
  press(lab, key) { const kp = lab.byTag('kp'); if (!kp) return; const r = KEYMAP.findIndex((row) => row.includes(key)); keyPress(lab, kp, r * 4 + KEYMAP[r].indexOf(key), 0.25); this.typedKey(key); }
  typedKey(key) { if (key === '#') { const m = /([1-6])$/.exec(this.typed); this.chosen = m ? +m[1] : null; this.typed = ''; } else if (key === '*') this.typed = ''; else this.typed = (this.typed + key).slice(-6); }
  control(id, v, lab) { if (id.startsWith('kp')) this.press(lab, v); }
  hud(lab) {
    const a = this.ang || 0; const k = this.atDoor(a);
    return { title: t3('Vending machine', 'वेंडिंग मशीन', 'Vending machine'),
      rows: [[tx(W.typed), this.typed || '—'], [tx(W.turned), `${a.toFixed(1)}°`], [tx(WV.door), k ? `${k} · ${VEND.items[k - 1]}` : tx(WV.between)]],
      controls: KEYMAP.map((r, i) => ({ id: 'kp' + i, kind: 'seg', label: i ? '' : W.keys, options: r.map((x) => [x, x]), value: null })) };
  }
}
const WV = { door: t3('At the door', 'दरवाज़े पर', 'Darwaze par'), between: t3('between two doors!', 'दो खानों के बीच!', 'do khaanon ke beech!') };

// ------------------------------------------------------------------ the dual-axis solar tracker (batch 24, Class 11)
// The sun crosses the sky (az +60° in the morning to −60° in the evening, up to 70° high at noon: SUN.day seconds a day
// when Play is on, still otherwise). The panel points where the pan servo (svP: az = angle − 90) and the tilt servo (svT:
// elevation = angle − 90) put it. The 4-LDR sensor's cross shades the LDRs away from the sun: each quadrant's light is
// 1000 lux × its share × cos(the panel's error), ±2 % flicker, + 25 lux of sky; it writes them to the ldr4 part (ext).
// Flags: runaway (the pan at an end while the sun is > 40° away), locked (within 5° for 2 s), hunting (≥ 6 reversals of a
// servo in 10 s while the sun stands still), calm (locked and < 2 reversals in 10 s), day (a whole day played), followed
// (the day played with the panel never > 12° off). Energy: the tracker's and a fixed panel's (az 0, 30° up), res.gain %.
export const SUN = { day: 60, fixed: { az: 0, el: 30 } };
const dirOf = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [-Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; };
const angBetween = (u, v) => Math.acos(clamp(u[0] * v[0] + u[1] * v[1] + u[2] * v[2], -1, 1)) * 180 / Math.PI;
export class TrackerScene extends Scene {
  constructor(cfg) { super(cfg); this.frac = 0.25; this.play = false; this.cloud = false; this.alT = 0; this.rev = []; this.res.eT = 0; this.res.eF = 0; this.maxErr = 0; this.sunPos(); }
  sunPos() { this.az = +(60 - 120 * this.frac).toFixed(2); this.el = +(15 + 55 * Math.sin(Math.PI * this.frac)).toFixed(2); }
  panel(lab) { const p = lab.byTag('svP'), t = lab.byTag('svT'); return { p: p ? p.state.angle : 90, t: t ? t.state.angle : 120 }; }
  update(dt, lab) {
    this.t += dt; const was = [this.az, this.el];
    if (this.play && this.frac < 1) { this.frac = Math.min(1, this.frac + dt / SUN.day); this.sunPos(); if (this.frac >= 1) { this.flags.add('day'); if (this.maxErr < 12) this.flags.add('followed'); this.res.maxErr = +this.maxErr.toFixed(1); this.res.gain = this.res.eF > 0 ? Math.round((this.res.eT / this.res.eF - 1) * 100) : 0; this.play = false; } }
    const { p, t } = this.panel(lab); const paz = p - 90, pel = t - 90; this.paz = paz; this.pel = pel;
    const sun = dirOf(this.az, this.el), nrm = dirOf(paz, pel); const err = angBetween(sun, nrm); this.err = err;
    const k = this.cloud ? 0.15 : 1; const dA = this.az - paz, dE = this.el - pel;
    const g = (d) => clamp(0.5 + d / 24, 0.04, 1); const gx = [g(-dA), g(dA)], gy = [g(dE), g(-dE)]; // [left, right], [top, bottom]
    const cosI = Math.max(0, Math.cos(err * Math.PI / 180));
    const lux = [gx[0] * gy[0], gx[1] * gy[0], gx[0] * gy[1], gx[1] * gy[1]].map((f, i) => 25 + 1000 * k * f * 4 * cosI * (1 + 0.02 * Math.sin(this.t * (31 + i * 7) + i * 1.9)));
    const s4 = lab.byTag('ldr4'); if (s4) { const old = s4.state.lux || []; if (!s4.state.ext || lux.some((v, i) => Math.abs(v - (old[i] || 0)) > Math.max(1, 0.004 * v))) { s4.state.ext = true; s4.state.lux = lux; lab.stateV = (lab.stateV || 0) + 1; } }
    this.lux = lux;
    // energy (sun strength × cos of the angle), the tracker's and a fixed panel's
    if (this.play) { const fx = dirOf(SUN.fixed.az, SUN.fixed.el); this.res.eT += k * cosI * dt; this.res.eF += k * Math.max(0, Math.cos(angBetween(sun, fx) * Math.PI / 180)) * dt; if (this.t - (this.playAt || 0) > 3) this.maxErr = Math.max(this.maxErr, err); }
    // the servos: locked, runaway, reversals while the sun stands still
    if (Math.abs(dA) < 5 && Math.abs(dE) < 5) { this.alT += dt; if (this.alT > 2) this.flags.add('locked'); } else this.alT = 0;
    if ((p <= 2 || p >= 178) && Math.abs(dA) > 40) { this.flags.add('runaway'); this.res.runawayAt = Math.round(p); }
    for (const [key, a] of [['p', p], ['t', t]]) { const prev = this['last' + key]; if (prev !== undefined && Math.abs(a - prev) > 0.2) { const dir = Math.sign(a - prev); if (this['dir' + key] && dir !== this['dir' + key]) this.rev.push(this.t); this['dir' + key] = dir; } this['last' + key] = a; }
    this.rev = this.rev.filter((x) => this.t - x < 10); this.res.rev10 = this.rev.length;
    if (!this.play && this.t - (this.runAt || 0) > 10 && this.flags.has('locked')) { if (this.rev.length >= 6) this.flags.add('hunting'); else if (this.rev.length < 2 && this.alT > 2) this.flags.add('calm'); }
    return this.play || was[0] !== this.az;
  }
  onRun() { super.onRun(); for (const k of ['runaway', 'locked', 'hunting', 'calm', 'day', 'followed']) this.flags.delete(k); this.alT = 0; this.rev = []; this.dirp = this.dirt = 0; }
  control(id, v) {
    if (id === 'day') { this.play = v === '1'; if (this.play) { if (this.frac >= 1) this.frac = 0; this.sunPos(); this.res.eT = 0; this.res.eF = 0; this.maxErr = 0; this.playAt = this.t; this.flags.delete('day'); this.flags.delete('followed'); } }
    if (id === 'cloud') this.cloud = v === '1';
  }
  hud() {
    const hh = 6 + 12 * this.frac; const time = `${Math.floor(hh)}:${String(Math.round((hh % 1) * 60) % 60).padStart(2, '0')}`; const L = this.lux || [0, 0, 0, 0];
    return { title: t3('Solar tracker', 'सोलर ट्रैकर', 'Solar tracker'),
      rows: [[tx(WT.sun), `${time} · ${tx(WT.az)} ${Math.round(this.az)}° · ${tx(WT.up)} ${Math.round(this.el)}°`], [tx(WT.panel), `${Math.round(this.paz || 0)}° · ${Math.round(this.pel || 0)}° · ${tx(WT.off)} ${(this.err || 0).toFixed(1)}°`],
        ['LDR', `TL ${Math.round(L[0])} · TR ${Math.round(L[1])} · BL ${Math.round(L[2])} · BR ${Math.round(L[3])}`], [tx(WT.energy), this.res.eF ? `${Math.round(this.res.eT / Math.max(1e-6, this.res.eF) * 100)} % ${tx(WT.ofFixed)}` : '—']],
      controls: [{ id: 'day', kind: 'seg', label: WT.day, options: [['0', WT.pause], ['1', WT.play]], value: this.play ? '1' : '0' }, { id: 'cloud', kind: 'seg', label: WT.cloud, options: [['0', WT.clear], ['1', WT.cloudy]], value: this.cloud ? '1' : '0' }] };
  }
}
const WT = { sun: t3('Sun', 'सूरज', 'Sooraj'), az: t3('az', 'दिशा', 'disha'), up: t3('up', 'ऊँचाई', 'unchaai'), panel: t3('Panel', 'पैनल', 'Panel'), off: t3('off by', 'अंतर', 'antar'),
  energy: t3('Energy', 'ऊर्जा', 'Urja'), ofFixed: t3('of a fixed panel', 'स्थिर पैनल का', 'fixed panel ka'), day: t3('The day', 'दिन', 'Din'), pause: t3('Paused', 'रुका', 'Ruka'), play: t3('Play (1 min)', 'चलाइए (1 मिनट)', 'Chalaiye (1 min)'),
  cloud: t3('Sky', 'आसमान', 'Aasmaan'), clear: t3('Clear', 'साफ़', 'Saaf'), cloudy: t3('Cloud', 'बादल', 'Baadal') };

// ------------------------------------------------------------------ the mini lift (batch 24, Class 11)
// A three-floor shaft (G, 1, 2: LIFT.floor mm apart). The 28BYJ-48 (st) winds the cable on a 20 mm pulley at the top: the
// car's height = h0 + (the stepper's turn) × π × 20 mm. After the power cut the car stopped LIFT.h0 mm above G. The limit
// switch at the bottom (the button lim, its legs on pin 5 and GND) is pressed by the car when it is down at G (h ≤ 0); below
// that the car sits on the buffer (crash). Floor calls: the buttons c0, c1, c2 (pins 2, 3, 4), pressed for 0.3 s from the
// panel. Flags when the car stops: floor0 / floor1 / floor2 (within 2 mm) or between; homed (the switch pressed after a
// Run, the car then still); crash.
export const LIFT = { floor: 60, h0: 25, pulley: 20 };
export class LiftScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = null; this.moving = false; this.stillT = 0; this.res.stops = []; }
  height(lab) { const st = lab.byTag('st'); if (!st) return LIFT.h0; if (this.a0 === null) this.a0 = st.state.angle || 0; return LIFT.h0 + ((st.state.angle || 0) - this.a0) / 360 * Math.PI * LIFT.pulley; }
  update(dt, lab) {
    this.t += dt; const st = lab.byTag('st'); let h = this.height(lab); if (h < -3) { this.flags.add('crash'); } h = Math.max(-4, h); this.h = h;
    const lim = lab.byTag('lim'); const down = h <= 0.5; if (lim && !!lim.state.pressed !== down) { lim.state.pressed = down; lab.rebuild(); }
    if (down && this.t - (this.runAt || 0) > 0.2) this.flags.add('hitSwitch');
    for (const k of [0, 1, 2]) { const b = lab.byTag('c' + k); const on = this.callUntil && this.callUntil[k] > this.t; if (b && !!b.state.pressed !== !!on) { b.state.pressed = !!on; lab.rebuild(); } }
    const mov = st && Math.abs(st.state.rpm || 0) > 0.05;
    if (mov) { this.moving = true; this.stillT = 0; } else if (this.moving) { this.stillT += dt; if (this.stillT > 0.3) { this.moving = false; this.stopped(h); } }
    return !!mov;
  }
  stopped(h) {
    const f = Math.round(h / LIFT.floor); const off = Math.abs(h - f * LIFT.floor); this.res.stops.push(+h.toFixed(1)); this.res.last = +h.toFixed(1);
    if (f >= 0 && f <= 2 && off <= 2) { this.flags.add('floor' + f); this.res.at = f; if (f === 0 && this.flags.has('hitSwitch')) this.flags.add('homed'); }
    else { this.flags.add('between'); this.res.between = +h.toFixed(1); }
  }
  onRun() { super.onRun(); for (const k of ['floor0', 'floor1', 'floor2', 'between', 'homed', 'crash', 'hitSwitch']) this.flags.delete(k); this.moving = false; this.callUntil = {}; }
  control(id, v) { if (id === 'call') { const k = +v; this.callUntil = this.callUntil || {}; this.callUntil[k] = this.t + 0.3; } }
  hud(lab) {
    const h = this.h ?? LIFT.h0; const f = Math.round(h / LIFT.floor); const at = Math.abs(h - f * LIFT.floor) <= 2 && f >= 0 && f <= 2 ? (f ? String(f) : 'G') : tx(WL.between);
    const lim = lab.byTag('lim');
    return { title: t3('Mini lift', 'मिनी लिफ़्ट', 'Mini lift'),
      rows: [[tx(WL.height), `${h.toFixed(1)} mm`], [tx(WL.at), at], [tx(WL.sw), lim && lim.state.pressed ? tx(WL.pressed) : tx(WL.free)]],
      controls: [{ id: 'call', kind: 'seg', label: WL.call, options: [['0', t3('G', 'G', 'G')], ['1', t3('1', '1', '1')], ['2', t3('2', '2', '2')]], value: null }] };
  }
}
const WL = { height: t3('Car height', 'कार की ऊँचाई', 'Car ki unchaai'), at: t3('Floor', 'मंज़िल', 'Manzil'), between: t3('between floors!', 'मंज़िलों के बीच!', 'manzilon ke beech!'), sw: t3('Limit switch (pin 5)', 'लिमिट स्विच (पिन 5)', 'Limit switch (pin 5)'),
  pressed: t3('pressed', 'दबा', 'daba'), free: t3('free', 'खुला', 'khula'), call: t3('Call the lift', 'लिफ़्ट बुलाइए', 'Lift bulaiye') };

// ------------------------------------------------------------------ the conveyor belt (batch 24, Class 11)
// A rubber belt on two 30 mm rollers, 240 mm between them. The 28BYJ-48 (st) turns the drive roller, so the belt moves
// π × 30 = 94.2 mm a turn (2.9 mm for 64 steps). Cardboard boxes (30 mm long) are put on the belt at the infeed end, 70 mm
// apart. The IR sensor (ir1) on the near rail, CONV.ir mm along, sees a box while any part of it is in front (the scene
// writes its distance, 1 cm or 40 cm). The stamp (sv: up at 0°, down on the belt at 90°) is CONV.stamp mm along: half a
// box before the sensor, so a box that has just reached the sensor is centred under it. A box under the stamp stops the
// servo at 36° (state.limit: it presses on the box). Flags: stall (the motor misses its steps and the belt has not moved),
// moving, stamped (a box got a stamp), belt (the stamp came down on the bare belt), multi (a box went past the sensor with
// more than one stamp: res.multi, with the belt's stamps so far), once (three boxes in a row went past stamped exactly once, and none twice), missed (one went past
// with none). res: stamps, beltN, passed (each box's stamps), offs (where each stamp landed, mm from the box's middle), rate.
export const CONV = { roller: 30, len: 240, box: 30, gap: 70, ir: 170, stamp: 155, first: 110, n: 12, boxH: 24, press: 36, travel: 40 };
export class ConveyorScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = null; this.s = 0; this.miss0 = 0; this.down = false; this.reset(); }
  reset() { this.boxes = Array.from({ length: CONV.n }, (_, i) => ({ i, x0: CONV.first - i * CONV.gap, st: [], done: false, gone: false })); this.marks = []; this.okRun = 0; this.res = { stamps: 0, beltN: 0, passed: [], offs: [], times: [] }; this.gen = (this.gen || 0) + 1; }
  belt(lab) { const st = lab.byTag('st'); if (!st) return this.s; if (this.a0 === null) this.a0 = st.state.angle || 0; return ((st.state.angle || 0) - this.a0) / 360 * Math.PI * CONV.roller; }
  front(b) { return b.x0 + this.s; }
  onBelt(b) { const f = this.front(b); return f - CONV.box >= 2 && f - CONV.box <= CONV.len; }
  update(dt, lab) {
    this.t += dt; const st = lab.byTag('st'); const was = this.s; this.s = this.belt(lab); if (Math.abs(this.s - was) > 0.01) this.turnT = this.t;
    const ran = this.runAt !== undefined;
    // the motor: turning, or humming (it misses its steps: too fast)
    this.hum = !!st && st.state.missT !== undefined && lab.mcu && lab.mcu.state === 'running' && lab.mcu.t - st.state.missT < 60000;
    if (ran && st && (st.state.miss || 0) - this.miss0 > 200 && Math.abs(this.s) < 1 && this.t - this.runAt > 1.5) this.flags.add('stall');
    if (ran && this.s > 5) this.flags.add('moving');
    // the IR sensor sees a box while any part of it is in front
    const near = this.boxes.some((b) => this.onBelt(b) && this.front(b) >= CONV.ir && this.front(b) - CONV.box <= CONV.ir); this.near = near;
    const ir = lab.byTag('ir1'); if (ir) { const d = near ? 1 : 40; if (!ir.state.ext || ir.state.dist !== d) { ir.state.ext = true; ir.state.dist = d; lab.stateV = (lab.stateV || 0) + 1; } }
    // the stamp: a box under it stops the servo (it presses); with none, it comes down on the belt
    const sv = lab.byTag('sv');
    if (sv && !ran && !this.rested) { sv.state.angle = 0; this.rested = true; } // (it was left up)
    const under = this.boxes.find((b) => this.onBelt(b) && this.front(b) >= CONV.stamp && this.front(b) - CONV.box <= CONV.stamp); this.under = under;
    if (sv) { const lim = under ? CONV.press : null; if (sv.state.limit !== lim) sv.state.limit = lim; }
    const a = sv ? sv.state.angle : 0; this.ang = a;
    if (!this.down && ran && ((under && a >= CONV.press - 3) || (!under && a >= 85))) {
      this.down = true;
      if (under) { const off = +(CONV.stamp - (this.front(under) - CONV.box / 2)).toFixed(1); under.st.push(off); this.res.offs.push(off); this.res.stamps++; this.flags.add('stamped'); }
      else { this.marks.push(CONV.stamp - this.s); this.res.beltN++; this.flags.add('belt'); }
    } else if (this.down && a < 20) this.down = false;
    // boxes past the stamp, and into the bin
    for (const b of this.boxes) {
      const f = this.front(b);
      if (!b.done && f - CONV.box > CONV.ir + 2) { // (past the sensor too: the program is done with it)
        b.done = true; const n = b.st.length; this.res.passed.push(n); this.res.times.push(this.t);
        if (n === 0) this.flags.add('missed');
        if (n > 1 && !this.res.multi) { this.res.multi = { n, belt: this.res.beltN }; this.flags.add('multi'); }
        this.okRun = n === 1 ? this.okRun + 1 : 0;
        if (this.okRun >= 3 && !this.flags.has('multi')) { this.flags.add('once'); const T = this.res.times.slice(-3); this.res.rate = Math.round(120 / Math.max(0.1, T[2] - T[0])); }
      }
      if (!b.gone && f - CONV.box > CONV.len) b.gone = true;
    }
    this.res.bin = this.boxes.filter((b) => b.gone).length;
    return Math.abs(this.s - was) > 0.01 || this.hum;
  }
  onRun(lab) {
    super.onRun(); const st = lab && lab.byTag('st'); this.a0 = st ? st.state.angle || 0 : 0; this.s = 0; this.miss0 = st ? st.state.miss || 0 : 0;
    this.reset(); const sv = lab && lab.byTag('sv'); this.down = !!sv && sv.state.angle >= 30;
    for (const k of ['stall', 'moving', 'stamped', 'belt', 'multi', 'once', 'missed']) this.flags.delete(k);
  }
  hud() {
    const motor = this.hum ? tx(WC.hum) : this.t - (this.turnT ?? -9) < 0.25 ? tx(WC.turning) : tx(WC.still);
    const last = this.boxes.filter((b) => b.done).slice(-4).map((b) => b.st.length).join(' · ');
    return { title: t3('Conveyor belt', 'कन्वेयर बेल्ट', 'Conveyor belt'),
      rows: [[tx(WC.moved), `${this.s.toFixed(1)} mm`], [tx(WC.motor), motor], [tx(WC.ir), this.near ? tx(WC.box) : tx(WC.clear)],
        [tx(WC.stamp), this.ang >= 30 ? (this.under ? tx(WC.onBox) : tx(WC.onBelt)) : tx(WC.up)], [tx(WC.perBox), last || '—']],
      controls: [] };
  }
}
const WC = { moved: t3('Belt moved', 'बेल्ट चली', 'Belt chali'), motor: t3('Motor', 'मोटर', 'Motor'), hum: t3('humming, not turning: too fast!', 'गुनगुना रही है, घूम नहीं रही: बहुत तेज़!', 'gunguna rahi hai, ghoom nahi rahi: bahut tez!'),
  turning: t3('turning', 'घूम रही है', 'ghoom rahi hai'), still: t3('still', 'रुकी', 'ruki'), ir: t3('IR sensor (pin 2)', 'आईआर सेंसर (पिन 2)', 'IR sensor (pin 2)'), box: t3('a box in front (LOW)', 'सामने डिब्बा (LOW)', 'saamne dabba (LOW)'),
  clear: t3('clear (HIGH)', 'खाली (HIGH)', 'khaali (HIGH)'), stamp: t3('Stamp (pin 6)', 'ठप्पा (पिन 6)', 'Thappa (pin 6)'), up: t3('up', 'ऊपर', 'upar'), onBox: t3('down on a box', 'डिब्बे पर', 'dabbe par'),
  onBelt: t3('down on the bare belt!', 'ख़ाली बेल्ट पर!', 'khaali belt par!'), perBox: t3('Stamps on each box', 'हर डिब्बे पर ठप्पे', 'Har dabbe par thappe') };

// ------------------------------------------------------------------ the camera slider (batch 24, Class 11)
// A 2020 aluminium rail, 220 mm of travel, with a carriage and a small camera on it, pulled by a GT2 belt: the 28BYJ-48 (st)
// at the left end turns a 20-tooth pulley, so the belt moves 20 × 2 mm = 40 mm a turn (2048 steps: 51.2 steps a mm). The
// carriage starts at 0 (at the motor end). When it stops, it rocks on the rail for a moment (SLIDE.wob mm at 9 Hz, dying
// away with a time constant of 0.15 s). The camera takes a photo when the shutter LED (led1, standing in for the opto-
// coupler on the camera's remote socket) lights: the photo is sharp if the camera moved less than 0.1 mm in its 1/30 s
// exposure (the rocking's speed × the exposure; or the carriage's own speed), else blurred. After SLIDE.n photos: short
// (they ended before 170 mm), far (170–190 mm: the 180 mm planned), sharp (far, and every photo sharp); blurred (any
// blurred photo); end (the carriage ran into the far end).
export const SLIDE = { len: 220, pulley: 40, wob: 0.6, tau: 0.15, hz: 9, exp: 1 / 30, sharp: 0.1, n: 12, plan: 180 };
export class SliderScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = null; this.x = 0; this.lastX = 0; this.stopT = null; this.flash = 0; this.reset(); }
  reset() { this.res = { photos: [] }; this.led = false; this.gen = (this.gen || 0) + 1; }
  pos(lab) { const st = lab.byTag('st'); if (!st) return this.x; if (this.a0 === null) this.a0 = st.state.angle || 0; return ((st.state.angle || 0) - this.a0) / 360 * SLIDE.pulley; }
  rock() { if (this.stopT === null) return 0; const t = this.t - this.stopT; return SLIDE.wob * Math.exp(-t / SLIDE.tau); } // (the rocking's size now)
  update(dt, lab) {
    this.t += dt; let x = this.pos(lab); const v = (x - this.lastX) / Math.max(dt, 1e-3);
    if (x > SLIDE.len) { this.flags.add('end'); } this.x = x;
    if (Math.abs(x - this.lastX) > 1e-4) { this.moving = true; this.stopT = null; this.v = Math.abs(v); }
    else if (this.moving) { this.moving = false; this.stopT = this.t; } // (it has just stopped: now it rocks)
    this.lastX = x; const amp = this.rock(); this.w = amp * Math.sin(2 * Math.PI * SLIDE.hz * (this.t - (this.stopT ?? this.t)));
    this.flash = Math.max(0, this.flash - dt * 4);
    // the shutter
    const led = lab.byTag('led1'); const on = !!led && (led.state.b || 0) > 0.18;
    if (on && !this.led && this.runAt !== undefined) {
      const rockMax = 2 * Math.PI * SLIDE.hz * SLIDE.wob * SLIDE.exp; // (moving in this very frame: it is stopping, or still going)
      const blur = this.moving ? Math.max((this.v || 0) * SLIDE.exp, rockMax) : 2 * Math.PI * SLIDE.hz * amp * SLIDE.exp; const ok = blur < SLIDE.sharp;
      const R = this.res; R.photos.push({ x: +x.toFixed(1), blur: +blur.toFixed(2), ok }); R.last = R.photos[R.photos.length - 1]; this.flash = 1; this.flags.add('photo');
      if (!ok) this.flags.add('blurred');
      if (R.photos.length === SLIDE.n) {
        R.end = +x.toFixed(1); R.sharpN = R.photos.filter((p) => p.ok).length;
        if (x < SLIDE.plan - 10) this.flags.add('short'); else if (x <= SLIDE.plan + 10) { this.flags.add('far'); if (R.sharpN === SLIDE.n) this.flags.add('sharp'); }
      }
    }
    this.led = on;
    return this.moving || amp > 0.01 || this.flash > 0;
  }
  onRun(lab) { super.onRun(); const st = lab && lab.byTag('st'); this.a0 = st ? st.state.angle || 0 : 0; this.x = 0; this.lastX = 0; this.stopT = null; this.moving = false; this.reset(); for (const k of ['photo', 'blurred', 'short', 'far', 'sharp', 'end']) this.flags.delete(k); }
  hud() {
    const R = this.res; const n = R.photos.length, ok = R.photos.filter((p) => p.ok).length;
    return { title: t3('Camera slider', 'कैमरा स्लाइडर', 'Camera slider'),
      rows: [[tx(WS.at), `${this.x.toFixed(1)} mm`], [tx(WS.photos), `${n} / ${SLIDE.n}`], [tx(WS.sharpN), n ? `${ok} / ${n}` : '—'], [tx(WS.last), R.last ? `${R.last.x} mm · ${R.last.ok ? tx(WS.sharp) : tx(WS.blur)}` : '—']],
      controls: [] };
  }
}
const WS = { at: t3('Camera at', 'कैमरा कहाँ', 'Camera kahan'), photos: t3('Photos', 'फ़ोटो', 'Photo'), sharpN: t3('Sharp photos', 'साफ़ फ़ोटो', 'Saaf photo'), last: t3('Last photo', 'आख़िरी फ़ोटो', 'Aakhri photo'),
  sharp: t3('sharp', 'साफ़', 'saaf'), blur: t3('blurred', 'धुँधली', 'dhundhli') };

// ------------------------------------------------------------------ the pen plotter (batch 24, Class 11)
// Two axes, each a 28BYJ-48 with a 20-tooth GT2 pulley (40 mm of belt a turn: 51.2 steps a mm): X (stX) moves the pen's
// carriage left–right along the gantry, Y (stY) moves the gantry towards and away from the student. The pen hangs on
// an SG90 (svP): down at 30° or less (it touches the paper), up above 60°. Paper 120 × 90 mm; (0, 0) is its back-left
// corner (where the pen starts), x to the right, y towards the student. The ink is every stretch the pen moved while down.
// The target drawing is a house: a 40 mm square with a roof (two diagonals) and a door. The drawing is judged when the pen
// has stayed up for a second: the worst distance of ink from the house's lines (res.dev), how much of the lines has ink
// (res.cover), the ink that belongs to no line (res.stray, mm: a line dragged with the pen down). Flags: stairs (the roof
// came out as steps: ink more than 6 mm from its slopes), drag (more than 15 mm of stray ink), house (all of it within
// 2 mm, at least 95 % covered, no stray ink).
export const PLOT = { mm: 40, w: 120, d: 90, down: 30,
  house: [[[30, 40], [70, 40], [70, 80], [30, 80], [30, 40]], [[30, 40], [50, 20], [70, 40]], [[45, 80], [45, 65], [55, 65], [55, 80]]] };
const segD = (q, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1]; const L2 = dx * dx + dz * dz; const t = L2 ? clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / L2, 0, 1) : 0; return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dz); };
export class PlotScene extends Scene {
  constructor(cfg) { super(cfg); this.ax = null; this.ay = null; this.x = 0; this.y = 0; this.reset(); }
  reset() { this.strokes = []; this.cur = null; this.ink = 0; this.res = {}; this.upT = 0; this.judged = 0; this.gen = (this.gen || 0) + 1; }
  pos(lab) { const X = lab.byTag('stX'), Y = lab.byTag('stY'); if (X && this.ax === null) this.ax = X.state.angle || 0; if (Y && this.ay === null) this.ay = Y.state.angle || 0;
    return [X ? ((X.state.angle || 0) - this.ax) / 360 * PLOT.mm : this.x, Y ? ((Y.state.angle || 0) - this.ay) / 360 * PLOT.mm : this.y]; }
  update(dt, lab) {
    this.t += dt; const [x, y] = this.pos(lab); const moved = Math.hypot(x - this.x, y - this.y) > 0.01; this.x = x; this.y = y;
    if (x < -2 || y < -2 || x > PLOT.w + 2 || y > PLOT.d + 2) this.flags.add('end'); // (past the end of an axis: it would crash into the frame)
    const sv = lab.byTag('svP'); const a = sv ? sv.state.angle : 90; this.penA = a; const down = a <= PLOT.down;
    if (sv && this.runAt === undefined && !this.rested) { sv.state.angle = 90; this.rested = true; } // (the pen was left up)
    if (down && this.runAt !== undefined) {
      const q = [+x.toFixed(2), +y.toFixed(2)]; this.upT = 0;
      if (!this.cur) { this.cur = [q]; this.strokes.push(this.cur); }
      else { const l = this.cur[this.cur.length - 1]; const d = Math.hypot(q[0] - l[0], q[1] - l[1]); if (d > 0.3) { const n = Math.ceil(d / 0.5); for (let k = 1; k <= n; k++) this.cur.push(k === n ? q : [l[0] + (q[0] - l[0]) * k / n, l[1] + (q[1] - l[1]) * k / n]); this.ink += d; } }
    } else { this.cur = null; this.upT += dt; if (this.upT > 1 && this.ink > 0 && this.judged !== this.ink) { this.judged = this.ink; this.judge(); } }
    return moved || down;
  }
  judge() {
    const P = this.strokes.flat(); if (!P.length) return; const segs = PLOT.house.flatMap((L) => L.slice(1).map((b, i) => [L[i], b])); const R = this.res;
    const roof = segs.slice(4, 6); let dev = 0, stray = 0, roofDev = 0;
    for (let i = 0; i < P.length; i++) { const q = P[i]; const d = Math.min(...segs.map(([a, b]) => segD(q, a, b))); if (d > 3) { if (i && Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]) < 2) stray += Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]); } else dev = Math.max(dev, d);
      if (q[1] < 40 - 1 && q[1] > 20 - 1) roofDev = Math.max(roofDev, Math.min(...roof.map(([a, b]) => segD(q, a, b)))); }
    let cov = 0, n = 0; for (const [a, b] of segs) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const k = Math.max(4, Math.round(L / 2)); for (let j = 0; j <= k; j++) { const x = a[0] + (b[0] - a[0]) * j / k, y = a[1] + (b[1] - a[1]) * j / k; n++; if (P.some((q) => Math.abs(q[0] - x) < 2.5 && Math.abs(q[1] - y) < 2.5)) cov++; } }
    R.dev = +dev.toFixed(1); R.cover = Math.round(cov / n * 100); R.stray = Math.round(stray); R.roofDev = +roofDev.toFixed(1); R.ink = Math.round(this.ink);
    if (roofDev > 6) this.flags.add('stairs');
    if (stray > 15) this.flags.add('drag');
    if (roofDev <= 2 && R.cover >= 95 && stray <= 5) this.flags.add('house');
  }
  onRun(lab) { super.onRun(); const X = lab && lab.byTag('stX'), Y = lab && lab.byTag('stY'); this.ax = X ? X.state.angle || 0 : 0; this.ay = Y ? Y.state.angle || 0 : 0; this.x = 0; this.y = 0; this.reset(); for (const k of ['stairs', 'drag', 'house', 'end']) this.flags.delete(k); }
  hud() {
    const R = this.res; const down = (this.penA ?? 90) <= PLOT.down;
    return { title: t3('Pen plotter', 'पेन प्लॉटर', 'Pen plotter'),
      rows: [[tx(WP.at), `x ${this.x.toFixed(1)} · y ${this.y.toFixed(1)} mm`], [tx(WP.pen), down ? tx(WP.down) : tx(WP.up)], [tx(WP.ink), `${Math.round(this.ink)} mm`],
        [tx(WP.roof), R.roofDev !== undefined ? `${R.roofDev} mm` : '—'], [tx(WP.stray), R.stray !== undefined ? `${R.stray} mm` : '—']],
      controls: [] };
  }
}
const WP = { at: t3('Pen at', 'पेन कहाँ', 'Pen kahan'), pen: t3('Pen', 'पेन', 'Pen'), down: t3('down: drawing', 'नीचे: बना रहा', 'neeche: bana raha'), up: t3('up', 'ऊपर', 'upar'), ink: t3('Ink drawn', 'स्याही की लाइन', 'Syaahi ki line'),
  roof: t3('Roof: worst distance from its slope', 'छत: ढलान से सबसे ज़्यादा दूरी', 'Chhat: dhalaan se sabse zyada doori'), stray: t3('Ink off the drawing', 'ड्रॉइंग के बाहर स्याही', 'Drawing ke bahar syaahi') };

// ------------------------------------------------------------------ the pick-and-place line (batch 24, Class 11)
// The conveyor of the stamp lesson (CONV: a 30 mm roller, 94.2 mm of belt a turn) now ends at a stop plate (PICK.stop):
// boxes stop against it while the belt slides under them, and queue behind each other. The IR sensor (ir1) looks across
// the belt 4 mm before the stop, so it sees a box that has (all but) arrived. Beside the end stands a two-servo arm with a suction
// cup: the swing servo (svS, an MG996R on pin 6) turns it from over the belt (0°) to over the crate (90°); the lift servo
// (svL, an SG90 on pin 5) lowers the cup: 90° up, 40° on a box's top, 0° down at the belt. The cup holds while the vacuum
// pump runs (relay rl1 on pin 4) and lets go 0.1 s after it stops (air leaks back in). A box under the cup stops the lift
// at 40° (state.limit): pushed further the servo strains and dents the box (press). A held box rides with the cup; let go
// within 10° of the crate it lands in it (placed), over the belt it drops back on the belt, anywhere between it falls on
// the floor (dropped). Flags: arrived, held, press, dropped, placed, placed3 (three boxes in the crate, none dropped or
// dented since Run).
export const PICK = { stop: 228, ir: 224, top: 40, crate: 90, n: 6, cupH: 64, arm: 72 };
export class PickScene extends Scene {
  constructor(cfg) { super(cfg); this.a0 = null; this.s = 0; this.reset(); }
  reset() { this.boxes = Array.from({ length: PICK.n }, (_, i) => ({ i, x0: 150 - i * 70, off: 0, st: 'belt', dent: false, f: 150 - i * 70 })); this.res = { placed: 0, dropped: 0, dents: 0 }; this.held = null; this.offT = null; this.gen = (this.gen || 0) + 1; }
  belt(lab) { const st = lab.byTag('st'); if (!st) return this.s; if (this.a0 === null) this.a0 = st.state.angle || 0; return ((st.state.angle || 0) - this.a0) / 360 * Math.PI * CONV.roller; }
  cupH(lift) { return Math.max(0, CONV.boxH + (lift - PICK.top) / (90 - PICK.top) * (PICK.cupH - CONV.boxH)); } // (mm above the belt)
  update(dt, lab) {
    this.t += dt; const ran = this.runAt !== undefined; const s = this.belt(lab); const ds = Math.max(0, s - this.s); this.s = s;
    let limit = PICK.stop; // the boxes on the belt: carried along, stopped by the plate and by the box ahead
    for (const b of this.boxes) { if (b.st !== 'belt') continue; b.f = Math.min(b.x0 + b.off + ds, limit); b.off = b.f - b.x0; limit = b.f - CONV.box - 0.5; }
    const atStop = this.boxes.find((b) => b.st === 'belt' && b.f >= PICK.stop - 6); this.atStop = atStop; // (within a few mm of the plate: the cup is wide enough)
    const ir = lab.byTag('ir1'); const near = this.boxes.some((b) => b.st === 'belt' && b.f >= PICK.ir && b.f - CONV.box <= PICK.ir);
    if (ir) { const d = near ? 1 : 40; if (!ir.state.ext || ir.state.dist !== d) { ir.state.ext = true; ir.state.dist = d; lab.stateV = (lab.stateV || 0) + 1; } }
    if (atStop && ran) this.flags.add('arrived');
    // the arm
    const sS = lab.byTag('svS'), sL = lab.byTag('svL'); const sw = sS ? sS.state.angle : 0, li = sL ? sL.state.angle : 90; this.sw = sw; this.li = li;
    if (sS && !ran && !this.rested) { sS.state.angle = 0; if (sL) sL.state.angle = 90; this.rested = true; } // (it was left over the belt, up)
    const over = sw <= 5 && !this.held ? atStop : null; this.under = over;
    if (sL) { const lim = over ? PICK.top : null; if (sL.state.limit !== lim) sL.state.limit = lim; }
    if (over && li < PICK.top + 0.5 && sL && sL.state.target !== null && sL.state.target !== undefined && sL.state.target < PICK.top - 3 && ran) { if (!over.dent) { over.dent = true; this.res.dents++; } this.flags.add('press'); }
    // the cup: holds while the pump runs
    const rl = lab.byTag('rl1'); const pump = !!(rl && rl.state.on); this.pump = pump;
    if (pump) this.offT = null; else if (this.offT === null) this.offT = this.t;
    const holding = pump || (this.offT !== null && this.t - this.offT < 0.1);
    if (!this.held && pump && over && li <= PICK.top + 1 && ran) { this.held = over; over.st = 'held'; this.flags.add('held'); }
    if (this.held && !holding) { // let go
      const b = this.held; this.held = null;
      if (Math.abs(sw - PICK.crate) <= 10) { b.st = 'crate'; this.res.placed++; this.flags.add('placed'); }
      else if (sw <= 5) { b.st = 'belt'; b.f = PICK.stop; b.off = b.f - b.x0; }
      else { b.st = 'floor'; b.at = sw; this.res.dropped++; this.flags.add('dropped'); }
      if (this.res.placed >= 3 && !this.res.dropped && !this.res.dents) this.flags.add('placed3');
    }
    const moved = ds > 0 || Math.abs(sw - (this._sw ?? sw)) > 0.01 || Math.abs(li - (this._li ?? li)) > 0.01; this._sw = sw; this._li = li; return moved;
  }
  onRun(lab) { super.onRun(); const st = lab && lab.byTag('st'); this.a0 = st ? st.state.angle || 0 : 0; this.s = 0; this.reset(); for (const k of ['arrived', 'held', 'press', 'dropped', 'placed', 'placed3']) this.flags.delete(k); }
  hud() {
    const R = this.res; return { title: t3('Pick-and-place line', 'पिक-एंड-प्लेस लाइन', 'Pick-and-place line'),
      rows: [[tx(WK.stop), this.atStop ? tx(WK.boxAt) : tx(WK.none)], [tx(WK.arm), `${Math.round(this.sw ?? 0)}° · ${Math.round(this.li ?? 90)}°`], [tx(WK.cup), this.held ? tx(WK.holding) : this.pump ? tx(WK.sucking) : tx(WK.off)],
        [tx(WK.crate), String(R.placed)], [tx(WK.floor), String(R.dropped)], [tx(WK.dents), String(R.dents)]], controls: [] };
  }
}
const WK = { stop: t3('At the stop', 'स्टॉप पर', 'Stop par'), boxAt: t3('a box', 'एक डिब्बा', 'ek dabba'), none: t3('nothing', 'कुछ नहीं', 'kuch nahi'), arm: t3('Arm: swing · lift', 'बाँह: घुमाव · ऊपर-नीचे', 'Baanh: ghumaav · upar-neeche'),
  cup: t3('Suction cup', 'सक्शन कप', 'Suction cup'), holding: t3('holding a box', 'डिब्बा पकड़े', 'dabba pakde'), sucking: t3('pump on', 'पंप चालू', 'pump on'), off: t3('pump off', 'पंप बंद', 'pump band'),
  crate: t3('In the crate', 'क्रेट में', 'Crate mein'), floor: t3('Dropped on the floor', 'फ़र्श पर गिरे', 'Farsh par gire'), dents: t3('Dented boxes', 'पिचके डिब्बे', 'Pichke dabbe') };

// ------------------------------------------------------------------ the self-stabilising gimbal (batch 33, Class 12)
// A hand-held two-axis gimbal: the roll servo (svR) on top of the grip, the pitch servo (svP) on its bracket, the camera
// platform on the pitch servo with the MPU-6050 (mpu) on it. The platform's tilt is the hand's plus the servos' turn from
// 90°: roll = hand roll + (svR − 90), pitch = hand pitch + (svP − 90). The hand: level, tilted right 25°, tipped forward
// 20°, or walking (it sways ±10° and ±6° and trembles a little); it turns at most 80°/s. Flags: wrongWay (a servo at its
// end stop with the platform more than 30° off), shaky (the platform swinging past ±2° the other way 4 times in 1.5 s),
// level (5 s of walking with the platform never more than 5° off).
export const GIMB = { tilt: 25, tip: 20, sway: [10, 6], hz: [0.5, 0.8], turn: 80, tol: 5 };
export class GimbalScene extends Scene {
  constructor(cfg) { super(cfg); this.mode = 'level'; this.hr = 0; this.hp = 0; this.pr = 0; this.pp = 0; this.walkT = 0; this.okT = 0; this.sw = [[], []]; this.sg = [0, 0]; this.res = { worst: 0 }; }
  aim() { const G = GIMB, t = this.t; if (this.mode === 'walk') return [G.sway[0] * Math.sin(2 * Math.PI * G.hz[0] * t), G.sway[1] * Math.sin(2 * Math.PI * G.hz[1] * t + 1)]; return { level: [0, 0], right: [G.tilt, 0], fwd: [0, G.tip] }[this.mode] || [0, 0]; }
  update(dt, lab) {
    this.t += dt; const [tr, tp] = this.aim(); const st = GIMB.turn * dt; const tw = 0.35 * Math.sin(2 * Math.PI * 8.3 * this.t);
    if (this.mode === 'walk') { this.hr = tr + tw; this.hp = tp + tw * 0.6; } else { this.hr += clamp(tr - this.hr, -st, st); this.hp += clamp(tp - this.hp, -st, st); }
    const R = lab.byTag('svR'), P = lab.byTag('svP'); const aR = R ? R.state.angle : 90, aP = P ? P.state.angle : 90; this.aR = aR; this.aP = aP;
    const pr = this.hr + (aR - 90), pp = this.hp + (aP - 90); const rr = dt > 0 ? (pr - this.pr) / dt : 0, rp = dt > 0 ? (pp - this.pp) / dt : 0; this.pr = pr; this.pp = pp;
    const m = lab.byTag('mpu'); if (m) { const s = m.state; s.ext = true; s.roll = pr; s.pitch = pp; s.to = [pr, pp, 0]; s.rate = [rr, rp, 0]; }
    if (this.t - (this.runAt ?? -1e9) < 0.4) return true; // (the servos are still finding 90° after a Run)
    const off = Math.max(Math.abs(pr), Math.abs(pp));
    if ((aR <= 2 || aR >= 178 || aP <= 2 || aP >= 178) && off > 30) { this.flags.add('wrongWay'); this.res.wrongAt = Math.round(off); }
    [pr, pp].forEach((v, i) => { const g = v > 2 ? 1 : v < -2 ? -1 : 0; if (g && g !== this.sg[i]) { if (this.sg[i]) this.sw[i].push(this.t); this.sg[i] = g; } this.sw[i] = this.sw[i].filter((x) => this.t - x < 1.5); const a = this.sw[i]; if (a.length >= 4) { this.flags.add('shaky'); this.res.hz = Math.max(this.res.hz || 0, +((a.length - 1) / (2 * Math.max(0.05, a[a.length - 1] - a[0]))).toFixed(1)); } }); // (hz: two crossings a swing)
    if (this.t - (this.runAt ?? -1e9) > 2 && this.mode !== 'walk') this.res.amp = Math.max(this.res.amp || 0, +off.toFixed(1));
    if (this.mode === 'walk') { this.walkT += dt; if (off > GIMB.tol) this.okT = 0; else this.okT += dt; if (this.walkT > 1) this.res.worst = Math.max(this.res.worst, +off.toFixed(1)); if (this.okT > 5 && !this.flags.has('wrongWay')) this.flags.add('level'); } else { this.walkT = 0; this.okT = 0; }
    return true;
  }
  onRun() { super.onRun(); for (const k of ['wrongWay', 'shaky', 'level']) this.flags.delete(k); this.sw = [[], []]; this.sg = [0, 0]; this.walkT = 0; this.okT = 0; this.res = { worst: 0 }; }
  control(id, v) { if (id === 'hand' && ['level', 'right', 'fwd', 'walk'].includes(v)) { this.mode = v; this.walkT = 0; this.okT = 0; this.res.worst = 0; } }
  hud() {
    const f = (a, b) => `${a >= 0 ? '+' : '−'}${Math.abs(a).toFixed(1)}° · ${b >= 0 ? '+' : '−'}${Math.abs(b).toFixed(1)}°`; const off = Math.max(Math.abs(this.pr), Math.abs(this.pp));
    const st = this.flags.has('wrongWay') ? WG.wrong : this.flags.has('level') ? WG.level : off <= GIMB.tol ? WG.steady : WG.tipped;
    return { title: t3('Self-stabilising gimbal', 'ख़ुद स्थिर रहने वाला गिम्बल', 'Khud sthir rehne wala gimbal'),
      rows: [[tx(WG.hand), f(this.hr, this.hp)], [tx(WG.plat), f(this.pr, this.pp)], [tx(WG.servos), `${Math.round(this.aR ?? 90)}° · ${Math.round(this.aP ?? 90)}°`], ['', tx(st)]],
      controls: [{ id: 'hand', kind: 'seg', label: WG.handC, options: [['level', WG.hLevel], ['right', WG.hRight], ['fwd', WG.hFwd], ['walk', WG.hWalk]], value: this.mode }] };
  }
}
const WG = { hand: t3('Your hand (roll · pitch)', 'आपका हाथ (रोल · पिच)', 'Aapka haath (roll · pitch)'), plat: t3('Camera platform', 'कैमरा प्लेटफ़ॉर्म', 'Camera platform'), servos: t3('Servos (roll · pitch)', 'सर्वो (रोल · पिच)', 'Servo (roll · pitch)'),
  wrong: t3('a servo hit its end: it turned the wrong way', 'सर्वो अपने छोर पर: यह उल्टा घूमा', 'servo apne chhor par: yeh ulta ghooma'), level: t3('steady while you walk', 'चलते हुए भी स्थिर', 'chalte hue bhi sthir'),
  steady: t3('level', 'सीधा', 'seedha'), tipped: t3('tipped', 'झुका हुआ', 'jhuka hua'), handC: t3('Your hand', 'आपका हाथ', 'Aapka haath'), hLevel: t3('Level', 'सीधा', 'Seedha'),
  hRight: t3('Tilt right', 'दाएँ झुकाइए', 'Right jhukaiye'), hFwd: t3('Tip forward', 'आगे झुकाइए', 'Aage jhukaiye'), hWalk: t3('Walk', 'चलिए', 'Chaliye') };

// ------------------------------------------------------------------ the ball-on-beam balancer (batch 34, Class 12)
// A 50 cm aluminium channel on a pivot in its middle; the servo (sv, its 25 mm horn) pushes a rod 10 cm from the pivot, so
// the beam tips a quarter of the servo's turn, about ±14° at most. The beam is level at 97° (the servo was fitted a few
// teeth off). A 40 mm ping-pong ball rolls in it: x'' = 5/7 g sin θ (a hollow ball: 3/5), a little rolling drag, soft
// rubber stops at both ends. The HC-SR04 (us) looks along the beam from the end at x = 0: it reads the ball's near side,
// x − 2 cm (±0.1 cm, and the echo's own ±0.1). Flags: hitEnd (the ball hits a stop), swinging (it rolls past the setpoint and back 4 times, more
// than 4 cm each way), offset (the ball rests 1.5 cm or more from the setpoint), held (4 s within 1.5 cm of it).
export const BEAM = { L: 50, r: 2, level: 97, k: 0.25, max: 14, sp: 25, drag: 0.15, hollow: 3 / 5 };
export class BeamScene extends Scene {
  constructor(cfg) { super(cfg); this.x = 40; this.v = 0; this.th = 0; this.res = {}; this.sw = 0; this.side = 0; this.restT = 0; this.inT = 0; this.peak = 0; }
  update(dt, lab) {
    this.t += dt; const B = BEAM; const sv = lab.byTag('sv'); const a = sv ? sv.state.angle : 90; this.servo = a;
    const th = clamp((a - B.level) * B.k, -B.max, B.max) * Math.PI / 180; this.th = th;
    const n = 4, h = dt / n; for (let i = 0; i < n; i++) { const acc = B.hollow * 981 * Math.sin(th) - B.drag * this.v; this.v += acc * h; this.x += this.v * h;
      if (this.x < B.r + 0.3) { if (this.v < -8) this.flags.add('hitEnd'); this.x = B.r + 0.3; this.v = Math.abs(this.v) * 0.35; } if (this.x > B.L - B.r) { if (this.v > 8) this.flags.add('hitEnd'); this.x = B.L - B.r; this.v = -Math.abs(this.v) * 0.35; } }
    const us = lab.byTag('us'); if (us) { us.state.ext = true; const d = +(Math.max(2, this.x - B.r + (Math.random() - 0.5) * 0.2)).toFixed(1); if (us.state.dist !== d) { us.state.dist = d; lab.stateV = (lab.stateV || 0) + 1; } }
    if (this.t - (this.runAt ?? -1e9) < 1.5) return true; // (Run: the hand lets the ball go)
    const e = this.x - B.sp; const g = e > 4 ? 1 : e < -4 ? -1 : 0; if (g && g !== this.side) { if (this.side) this.sw++; this.side = g; } if (this.sw >= 4) { this.flags.add('swinging'); this.res.swings = this.sw; }
    this.peak = Math.max(this.peak, Math.abs(e));
    this.hist = (this.hist || []).filter((q) => this.t - q[0] < 2); this.hist.push([this.t, this.x]); const moved = Math.abs(this.x - this.hist[0][1]); // (where it was 2 s ago)
    if (this.t - this.hist[0][0] > 1.9 && moved < 0.5 && Math.abs(e) >= 1.5 && this.x > B.r + 1 && this.x < B.L - B.r - 1) { this.flags.add('offset'); this.res.off = +e.toFixed(1); }
    if (Math.abs(e) < 1.5) this.inT += dt; else this.inT = 0; if (this.inT > 4) { this.flags.add('held'); this.res.err = +Math.abs(e).toFixed(1); }
    return true;
  }
  onRun() { super.onRun(); for (const k of ['hitEnd', 'swinging', 'offset', 'held']) this.flags.delete(k); this.x = 40; this.v = 0; this.sw = 0; this.side = 0; this.hist = []; this.inT = 0; this.peak = 0; this.res = {}; }
  control(id) { if (id === 'nudge') this.v += this.x < BEAM.sp ? 18 : -18; if (id === 'far') { this.x = 44; this.v = 0; } }
  hud(lab) {
    const us = lab && lab.byTag('us'); const B = BEAM;
    const st = this.flags.has('held') ? WB.held : Math.abs(this.v) < 0.5 ? WB.rest : WB.rolling;
    return { title: t3('Ball-on-beam balancer', 'बीम पर गेंद संतुलक', 'Beam par gend santulak'),
      rows: [[tx(WB.ball), `${(this.x - B.r).toFixed(1)} cm · ${tx(WB.target)} ${B.sp - B.r} cm`], [tx(WB.sensor), us && us.state.powered ? `${us.state.dist} cm` : '—'], [tx(WB.beam), `${(this.th * 180 / Math.PI >= 0 ? '+' : '−')}${Math.abs(this.th * 180 / Math.PI).toFixed(1)}° · ${tx(WB.servo)} ${Math.round(this.servo ?? 90)}°`], ['', tx(st)]],
      controls: [{ id: 'nudge', kind: 'button', label: WB.nudge }, { id: 'far', kind: 'button', label: WB.far }] };
  }
}
const WB = { ball: t3('Ball (from the sensor)', 'गेंद (सेंसर से)', 'Gend (sensor se)'), target: t3('target', 'लक्ष्य', 'lakshya'), sensor: t3('HC-SR04 reads', 'HC-SR04 पढ़ता है', 'HC-SR04 padhta hai'), beam: t3('Beam', 'बीम', 'Beam'),
  servo: t3('servo', 'सर्वो', 'servo'), held: t3('held at the target', 'लक्ष्य पर थमी हुई', 'lakshya par thami hui'), rest: t3('at rest', 'रुकी हुई', 'ruki hui'), rolling: t3('rolling', 'लुढ़क रही', 'ludhak rahi'),
  nudge: t3('👉 Flick the ball', '👉 गेंद को झटका', '👉 Gend ko jhatka'), far: t3('Put it at the far end', 'इसे दूर वाले छोर पर रखिए', 'Ise door wale chhor par rakhiye') };

// ------------------------------------------------------------------ the smart ration shop (batch 35, Class 12)
// A fair-price shop's counter: the RC522 (rf) reads a family's ration card, the scale (lc, a load cell with a bowl) weighs
// the rice the shopkeeper pours from the sack, the LCD (lcd) and the beeper (bz) talk. The panel taps the white card
// (Sunita's) or the blue tag (Ramesh's), pours (350 g a second; the shopkeeper stops 0.4 s after a beep), takes the bag
// away. A tap counts once the reader has really read the card (rf.state.reads went up). Flags: shown (the LCD shows a
// name and a quota in kg), stopped (STOP on the LCD), twice (a card that already got its rice got its quota shown
// again), refused (the LCD says Already).
export const RATION = { pour: 350, react: 0.4, names: { card: 'Sunita', tag: 'Ramesh' } };
export class RationScene extends Scene {
  constructor(cfg) { super(cfg); this.pour = false; this.res = {}; this.got = new Set(); this.wait = null; this.bzT = -1; }
  update(dt, lab) {
    this.t += dt; const lc = lab.byTag('lc'), rf = lab.byTag('rf'); const g0 = lc ? lc.state.grams || 0 : 0; let g = g0;
    const beep = bzOn(lab); if (beep && this.bzT < 0) this.bzT = this.t; if (!beep && this.bzT >= 0 && this.t - this.bzT > 1) this.bzT = -1;
    if (this.pour) { g += RATION.pour * dt; if (this.bzT >= 0 && this.t - this.bzT > RATION.react) { this.pour = false; this.res.given = Math.round(g); } }
    if (lc && Math.round(g) !== Math.round(g0)) set30(lab, lc, 'grams', Math.round(g));
    const [r0, r1] = lcdText(lab.byTag('lcd')); this.lcd = [r0, r1];
    const m = /(Sunita|Ramesh)\s+(\d+(?:\.\d)?)\s*kg/.exec(r0);
    if (m) { this.flags.add('shown'); this.cur = m[1]; this.res.quota = +m[2]; }
    if (/STOP/.test(r1)) { if (!this.flags.has('stopped')) this.res.stopAt = Math.round(g); this.flags.add('stopped'); if (this.cur) this.got.add(this.cur); }
    if (this.wait && rf && (rf.state.reads || 0) > this.wait.reads && this.t - this.wait.t > 0.6) { // (the reader has read the card, and the sketch has had time to answer)
      const nm = RATION.names[this.wait.id]; this.wait = null;
      if (/Already/.test(r0 + r1)) this.flags.add('refused'); else if (this.got.has(nm) && m && m[1] === nm) { this.flags.add('twice'); this.res.twiceName = nm; }
    }
    return true;
  }
  onRun() { super.onRun(); for (const k of ['shown', 'stopped', 'twice', 'refused']) this.flags.delete(k); this.got = new Set(); this.pour = false; this.res = {}; this.cur = null; this.wait = null; }
  control(id, v, lab) {
    if (id === 'tapS' || id === 'tapR') { const card = id === 'tapS' ? 'card' : 'tag'; if (lab) { rfidShow(lab, card); const rf = lab.byTag('rf'); this.wait = { id: card, reads: rf ? rf.state.reads || 0 : 0, t: this.t }; } }
    if (id === 'pour') this.pour = v === '1';
    if (id === 'away' && lab) { this.pour = false; const lc = lab.byTag('lc'); if (lc) set30(lab, lc, 'grams', 0); }
  }
  hud(lab) {
    const lc = lab && lab.byTag('lc'); const L = this.lcd || ['', ''];
    return { title: t3('Smart ration shop', 'स्मार्ट राशन दुकान', 'Smart ration dukaan'),
      rows: [[tx(WR.bowl), `${Math.round(lc ? lc.state.grams || 0 : 0)} g`], ['LCD', `${L[0].trimEnd() || '—'}`], ['', `${L[1].trimEnd()}`]],
      controls: [{ id: 'tapS', kind: 'button', label: WR.tapS }, { id: 'tapR', kind: 'button', label: WR.tapR }, { id: 'pour', kind: 'seg', label: WR.rice, options: [['0', WR.stop], ['1', WR.pourB]], value: this.pour ? '1' : '0' }, { id: 'away', kind: 'button', label: WR.away }] };
  }
}
const WR = { bowl: t3('Rice in the bowl', 'कटोरे में चावल', 'Katore mein chaawal'), tapS: t3('💳 Tap Sunita\'s card (white)', '💳 सुनीता का कार्ड छुआइए (सफ़ेद)', '💳 Sunita ka card chhuaaiye (safed)'), tapR: t3('🔑 Tap Ramesh\'s tag (blue)', '🔑 रमेश का टैग छुआइए (नीला)', '🔑 Ramesh ka tag chhuaaiye (neela)'),
  rice: t3('The shopkeeper', 'दुकानदार', 'Dukaandaar'), stop: t3('Stops', 'रुकता है', 'Rukta hai'), pourB: t3('Pours rice', 'चावल डालता है', 'Chaawal daalta hai'), away: t3('🛍 Take the bag away (empty bowl)', '🛍 थैला ले जाइए (कटोरा ख़ाली)', '🛍 Thaila le jaaiye (katora khaali)') };

export function makeScene(cfg) {
  switch (cfg && cfg.kind) {
    case 'air': return new AirScene(cfg); case 'garden': return new GardenScene(cfg); case 'room': return new RoomScene(cfg); case 'burglar': return new BurglarScene(cfg);
    case 'door': return new DoorScene(cfg); case 'atm': return new AtmScene(cfg); case 'vend': return new VendScene(cfg); case 'tracker': return new TrackerScene(cfg); case 'lift': return new LiftScene(cfg); case 'conveyor': return new ConveyorScene(cfg); case 'slider': return new SliderScene(cfg); case 'plot': return new PlotScene(cfg); case 'pick': return new PickScene(cfg); case 'gimbal': return new GimbalScene(cfg); case 'beam': return new BeamScene(cfg); case 'ration': return new RationScene(cfg); case 'attend': return new AttendScene(cfg); case 'bank': return new BankScene(cfg); case 'tank': return new TankScene(cfg); case 'greenhouse': return new GreenhouseScene(cfg); case 'locker': return new LockerScene(cfg); case 'kitchen': return new KitchenScene(cfg); case 'pantilt': return new PanTiltScene(cfg); case 'turn': return new TurnScene(cfg);
  }
  return null;
}
