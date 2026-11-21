// DUET STEM subscription codes.
//   issue : node duetlic.mjs issue --name "School name" --until 2027-03-31 --apps science[,space,body,drone|*] [--n 1] [--count 40]
//           --n: devices each code works on (default 1; 0 = any number); --count: how many codes (e.g. one per tablet)
//           --pendrive: a code for one DUET STEM pen drive (one device, activates without the internet; the device takes
//           its place in the register when it is first online). Issue the codes BEFORE building the APKs and the drives.
//   devices: node duetlic.mjs devices CODE --n 5      (change how many devices a code works on)
//   setclaim: node duetlic.mjs setclaim https://script.google.com/macros/s/…/exec   (the register, see README.md)
//   setsync:  node duetlic.mjs setsync https://script.google.com/macros/s/…/exec    (live classes, see ../school-server/README.md)
//   revoke: node duetlic.mjs revoke CODE
//   list  : node duetlic.mjs list
// licences.json (public, in the repo) holds only hashes; the codes themselves go to the private register CSV.
import fs from 'fs'; import { webcrypto as crypto } from 'crypto';
const LIST = '/home/claude/duet-lms-media/licences.json'; const REG = '/root/work/licences/register.csv';
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const norm = (s) => { let t = String(s).toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); if (t.startsWith('DUET')) t = t.slice(4); return [...t].filter((c) => ALPHA.includes(c)).join(''); };
const sha = async (s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
const hex = (b) => Buffer.from(b).toString('hex');
const hash = async (code) => hex(await sha('duet-lic|' + norm(code)));
async function seal(code, name) { const key = await crypto.subtle.importKey('raw', await sha('duet-lic-name|' + norm(code)), 'AES-GCM', false, ['encrypt']); const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(name))); return Buffer.concat([Buffer.from(iv), Buffer.from(ct)]).toString('base64'); }
const newCode = () => { const r = crypto.getRandomValues(new Uint8Array(12)); const c = [...r].map((b) => ALPHA[b & 31]).join(''); return `DUET-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`; };
const load = () => { try { return JSON.parse(fs.readFileSync(LIST, 'utf8')); } catch (e) { return { v: 1, codes: {} }; } };
const store = (j) => { const codes = Object.fromEntries(Object.entries(j.codes).sort()); fs.writeFileSync(LIST, JSON.stringify({ v: 1, note: 'DUET STEM subscription codes: hashes only', ...(j.claim ? { claim: j.claim } : {}), ...(j.sync ? { sync: j.sync } : {}), codes }, null, 1) + '\n'); };
const csv = (a) => a.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',');
const [,, cmd, ...rest] = process.argv; const arg = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? rest[i + 1] : d; };
if (!fs.existsSync(REG)) fs.writeFileSync(REG, csv(['code', 'school', 'valid_until', 'apps', 'headsets', 'issued', 'status']) + '\n');
const j = load();
if (cmd === 'issue') {
  const name = arg('name'), until = arg('until'), apps = (arg('apps', 'science')).split(','), n = +arg('n', 1), count = +arg('count', 1), pen = rest.includes('--pendrive');
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(until || '')) { console.error('need --name and --until YYYY-MM-DD'); process.exit(1); }
  for (let i = 0; i < count; i++) { const code = newCode(); const h = await hash(code); j.codes[h] = { u: until, a: apps, n: pen ? 1 : n, e: await seal(code, name), ...(pen ? { o: 1 } : {}) };
    fs.appendFileSync(REG, csv([code, name, until, apps.join('+'), pen ? 1 : n, new Date().toISOString().slice(0, 10), pen ? 'pendrive' : 'active']) + '\n'); console.log(code); }
  store(j);
} else if (cmd === 'revoke') { const h = await hash(rest[0]); if (j.codes[h]) { j.codes[h].r = 1; store(j); fs.appendFileSync(REG, csv([rest[0], '', '', '', '', new Date().toISOString().slice(0, 10), 'revoked']) + '\n'); console.log('revoked'); } else console.log('not found'); }
else if (cmd === 'renew') { const h = await hash(rest[0]); const until = arg('until'); if (j.codes[h] && until) { j.codes[h].u = until; delete j.codes[h].r; store(j); fs.appendFileSync(REG, csv([rest[0], '', until, '', '', new Date().toISOString().slice(0, 10), 'renewed']) + '\n'); console.log('renewed to', until); } else console.log('not found / need --until'); }
else if (cmd === 'devices') { const h = await hash(rest[0]); const n = +arg('n', 1); if (j.codes[h]) { j.codes[h].n = n; store(j); fs.appendFileSync(REG, csv([rest[0], '', '', '', n, new Date().toISOString().slice(0, 10), 'devices'] ) + '\n'); console.log('devices', n); } else console.log('no such code'); }
else if (cmd === 'setclaim') { j.claim = rest[0] || ''; store(j); console.log('claim', j.claim || '(none)'); }
else if (cmd === 'setsync') { j.sync = rest[0] || ''; store(j); console.log('sync', j.sync || '(none)'); }
else if (cmd === 'list') { for (const [h, e] of Object.entries(j.codes)) console.log(h.slice(0, 10), e.u, e.a.join('+'), e.n, e.o ? 'PENDRIVE' : '', e.r ? 'REVOKED' : ''); }
else console.log('issue | revoke CODE | renew CODE --until D | list');
