// DUET Robotics Lab 360, batch 31: the SIM800L GSM module's side of the conversation (AT commands), and the SMS network
// as far as the bench's phone. No imports: libs3.js (SoftwareSerial) feeds it, phone4.js shows the messages.
//   What a real SIM800L does: it echoes what it is sent (ATE0 stops that); it finds the network about 10 s after power-up
//   (its NET light blinks every second until then, every 3 s after); it starts in PDU mode, so AT+CMGS="number" needs
//   AT+CMGF=1 first or it answers ERROR; after AT+CMGS it prompts "> ", takes the text, and sends it on Ctrl+Z (26) with
//   "+CMGS: n" and OK about 3 s later (ESC cancels); before it has the network the send ends in "+CMS ERROR: 500". The SMS
//   reaches a phone a few seconds after that, if the number is the phone's own (with or without +91).
export const GSM = { phone: '+919000012345', sim: '+919000054321', regS: 10, op: 'DUET-NET' };
const t3 = (en, hi, hg) => ({ en, hi, hg });
export const SMSW = { app: t3('Messages', 'संदेश', 'Messages'), none: t3('No messages yet.', 'अभी कोई संदेश नहीं।', 'Abhi koi sandesh nahi.'), from: t3('From', 'से', 'Se') };
export const smsBox = (lab) => lab.sms || (lab.sms = { inbox: [], mr: 0, sent: 0, lost: 0 });
// the module and the board share a ground (else the serial bits have no reference and nothing gets through)
export const sameGround = (lab, p) => ['GND', 'GND1', 'GND2', 'GND3'].some((g) => lab.def.pins.some((q) => q.id === g) && lab.conn(p.ep.GND, 'B:' + g));
export const registered = (lab, p) => !!p.state.powered && !p.state.weak && (lab.clock || 0) - (p.state.onAt ?? 0) >= GSM.regS;
const digits = (s) => String(s).replace(/[^\d]/g, '');
const samePhone = (num) => { const d = digits(num); const me = digits(GSM.phone); return d === me || '91' + d === me || d === me.slice(2); };

// bytes from the sketch (its TX on the module's RXD) at MCU time tUs; reply(tUs, text) puts the module's answer on its TXD
export function gsmIn(lab, p, bytes, tUs, reply) {
  const s = p.state; if (!s.powered) return; if (s.echo === undefined) s.echo = true; if (s.cmgf === undefined) s.cmgf = 0; s.line = s.line || ''; s.rx = (s.rx || 0) + bytes.length;
  for (const b of bytes) {
    if (s.mode === 'text') { // typing the SMS
      if (b === 26) { const text = s.text || ''; s.mode = null; s.text = ''; if (s.echo) reply(tUs, text);
        if (!registered(lab, p)) { reply(tUs + 1.5e6, '\r\n+CMS ERROR: 500\r\n'); continue; }
        const B = smsBox(lab); B.mr++; B.sent++; reply(tUs + 3e6, `\r\n+CMGS: ${B.mr}\r\n\r\nOK\r\n`);
        const at = (lab.clock || 0) + 3 + 3 + (B.mr % 3); if (samePhone(s.num)) B.inbox.push({ from: GSM.sim, text, at, t0: lab.clock || 0 }); else { B.lost++; B.lastLost = { to: s.num, text }; }
        continue; }
      if (b === 27) { s.mode = null; s.text = ''; reply(tUs, '\r\nOK\r\n'); continue; }
      if (b === 10 && !s.text) continue; // (the LF of println("AT+CMGS=…") right after the prompt)
      s.text = (s.text || '') + String.fromCharCode(b); continue;
    }
    if (b === 10) continue;
    if (b !== 13) { s.line += String.fromCharCode(b); continue; }
    const cmd = s.line.trim(); s.line = ''; if (!cmd) continue;
    const out = (txt, ms = 30) => reply(tUs + ms * 1000, (s.echo ? cmd + '\r' : '') + txt);
    const u = cmd.toUpperCase();
    if (!u.startsWith('AT')) { out('\r\nERROR\r\n'); continue; }
    if (u === 'AT') out('\r\nOK\r\n');
    else if (u === 'ATE0') { out('\r\nOK\r\n'); s.echo = false; }
    else if (u === 'ATE1') { s.echo = true; out('\r\nOK\r\n'); }
    else if (/^AT\+CMGF=([01])$/.test(u)) { s.cmgf = +u.slice(-1); out('\r\nOK\r\n'); }
    else if (u === 'AT+CMGF?') out(`\r\n+CMGF: ${s.cmgf}\r\n\r\nOK\r\n`);
    else if (u === 'AT+CSQ') out(registered(lab, p) ? '\r\n+CSQ: 18,0\r\n\r\nOK\r\n' : '\r\n+CSQ: 0,0\r\n\r\nOK\r\n');
    else if (u === 'AT+CREG?') out(`\r\n+CREG: 0,${registered(lab, p) ? 1 : 2}\r\n\r\nOK\r\n`);
    else if (u === 'AT+COPS?') out(registered(lab, p) ? `\r\n+COPS: 0,0,"${GSM.op}"\r\n\r\nOK\r\n` : '\r\n+COPS: 0\r\n\r\nOK\r\n');
    else if (u === 'AT+CCID') out('\r\n8991000900123456789F\r\n\r\nOK\r\n');
    else if (/^AT\+CNMI=/.test(u) || /^AT\+CSCS=/.test(u) || u === 'AT&W' || /^AT\+IPR=/.test(u)) out('\r\nOK\r\n');
    else if (/^AT\+CMGS="?([^"]*)"?$/.test(cmd.replace(/^at/i, 'AT'))) { if (s.cmgf !== 1) { out('\r\nERROR\r\n', 60); continue; } s.num = /^AT\+CMGS="?([^"]*)"?$/i.exec(cmd)[1]; s.mode = 'text'; s.text = ''; out('\r\n> ', 80); }
    else if (/^ATD/.test(u)) out(registered(lab, p) ? '\r\nOK\r\n' : '\r\nNO CARRIER\r\n', 200);
    else out('\r\nERROR\r\n');
  }
}
// the messages the phone has, newest last
export const smsDelivered = (lab) => smsBox(lab).inbox.filter((m) => (lab.clock || 0) >= m.at);
