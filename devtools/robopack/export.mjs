// DUET Robotics projects pack: every Robotics Lab 360 project as a folder a school can copy from a pen drive.
//   node devtools/robopack/export.mjs <out dir>
// Each folder: README.md (English and Hindi: goal, parts, wiring table, steps), the code (sketch.ino or main.py),
// wiring.csv. At the top: index.html (search, class and board filter; works offline) and projects.csv.
// All content is DUET's own, taken from the lessons in robotics/js (the same text the app shows).
import fs from 'node:fs';
import path from 'node:path';

globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null, style: {} }), documentElement: { lang: 'en' } };
globalThis.localStorage = globalThis.localStorage || { getItem: () => null, setItem: () => {} };
globalThis.window = globalThis.window || globalThis;
const { LESSONS, LESSON_WORDS } = await import('../../robotics/js/lessons.js');
const { PARTS } = await import('../../robotics/js/parts.js');
const { MB_PARTS } = await import('../../robotics/js/microbit.js');
let all = LESSONS.slice();
if (!all.some((l) => l.batch === 'F')) { const { batchF } = await import('../../robotics/js/factory.js'); all = all.concat(batchF({ W: LESSON_WORDS }, all.length)); }
if (!all.some((l) => l.batch === 'C')) { const { batchC } = await import('../../robotics/js/circuits.js'); all = all.concat(batchC({ W: LESSON_WORDS }, all.length)); }
if (!all.some((l) => l.batch === 8)) { const t3 = (en, hi, hg) => ({ en, hi, hg }); for (const [f, b] of [['lessons8.js', 'batch8'], ['lessons9.js', 'batch9'], ['lessons10.js', 'batch10'], ['lessons11.js', 'batch11']]) { const x = await import('../../robotics/js/' + f); all = all.concat(x[b]({ t3 }, all.length)); } }

const out = path.resolve(process.argv[2] || '/tmp/robopack');
fs.mkdirSync(out, { recursive: true });
const BOARD = { none: 'Battery circuit (no board)', uno: 'Arduino Uno', nano: 'Arduino Nano', mega: 'Arduino Mega 2560', esp32: 'ESP32', pico: 'Raspberry Pi Pico', pi4: 'Raspberry Pi 4', microbit: 'BBC micro:bit' };
const boardOf = (l) => l.board || (l.lang === 'py' && (/^mb/.test(l.id) || (l.world && l.world.kind === 'mb')) ? 'microbit' : l.batch === 'C' ? 'none' : 'uno');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
const txt = (o, lg) => (o && typeof o === 'object' ? String(o[lg] || o.en || '') : String(o || ''));
const tagType = (l) => { const m = {}; for (const p of (l.world && l.world.parts) || []) m[p.tag] = p.type; for (const p of l.setup.parts || []) m[p.tag] = p.type; for (const s of l.steps) if (s.k === 'place') m[s.place.tag] = s.place.type; return m; };
const partName = (type, lg, mb) => (mb && MB_PARTS[type] ? txt(MB_PARTS[type].name, lg) : PARTS[type] ? txt(PARTS[type].name, lg) : type);
function endName(x, tt, lg) {
  const hi = lg === 'hi';
  if (x === 'GND' || /^GND\d?$/.test(x)) return 'GND';
  if (x === '5V' || x === '3V3' || x === 'VIN') return x;
  if (/^D\d+$/.test(x)) return (hi ? 'पिन ' : 'Pin ') + x.slice(1);
  if (/^A\d+$/.test(x)) return x;
  if (x.startsWith('rail:')) return { tp: hi ? 'पीछे की + रेल' : 'back + rail', tn: hi ? 'पीछे की − रेल' : 'back − rail', bp: hi ? 'आगे की + रेल' : 'front + rail', bn: hi ? 'आगे की − रेल' : 'front − rail' }[x.slice(5)] || x;
  if (x.startsWith('H:')) { const h = x.slice(2); const r = /^(tp|tn|bp|bn)(\d+)$/.exec(h); if (r) return endName('rail:' + r[1], tt, lg); return (hi ? 'ब्रेडबोर्ड ' : 'breadboard ') + h; }
  if (x.startsWith('T:')) { const [, tag, pin] = x.split(':'); return partName(tt[tag], lg) + ' ' + pin; }
  if (/^(\d:)?3V$/.test(x)) return 'micro:bit 3V';
  if (/^(\d:)?P[012]$/.test(x)) return (hi ? 'micro:bit पिन ' : 'micro:bit pin ') + x.replace(/^\d:/, '').replace(/^P/, '');
  if (x.includes('.')) { const [tag, pin] = x.split('.'); const mb = tt[tag] && MB_PARTS[tt[tag]]; return partName(tt[tag], lg, mb) + ' ' + (mb && MB_PARTS[tt[tag]].pin && MB_PARTS[tt[tag]].pin[pin] ? txt(MB_PARTS[tt[tag]].pin[pin], lg) : pin); }
  return x;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// the curriculum's class and session for each live lesson (robotics/js/curriculum.js), else the lesson's own class
let CUR = {}; try { CUR = (await import('../../robotics/js/curriculum.js')).CURRICULUM; } catch (e) { /* not built yet */ }
const IN_CUR = {}; for (const [k, list] of Object.entries(CUR)) for (const x of list) if (!IN_CUR[x.id]) IN_CUR[x.id] = { k, n: x.n };
const clsOf = (l) => (IN_CUR[l.id] ? IN_CUR[l.id].k : l.cls ? String(l.cls) : ({ basics: '6–7', robots: '7–8', boards: '8', modules: '7–9', microbit: '3–5', pi: '9–10', projects: '6–8', bank: '6–8' }[l.group] || ''));

const rows = [];
all.forEach((l, i) => {
  const n = String(i + 1).padStart(3, '0'); const dir = `${n}-${slug(txt(l.title, 'en'))}`; const d = path.join(out, dir); fs.mkdirSync(d, { recursive: true });
  const tt = tagType(l); const board = boardOf(l); const py = l.lang === 'py'; const codeFile = py ? 'main.py' : board === 'none' ? 'notes.txt' : 'sketch.ino';
  fs.writeFileSync(path.join(d, codeFile), l.code);
  const mbw = l.world && l.world.kind === 'mb'; const types = [...new Set([...((mbw && l.world.parts) || []).map((p) => p.type), ...(l.setup.parts || []).map((p) => p.type), ...l.steps.filter((s) => s.k === 'place').map((s) => s.place.type)])];
  const wires = [...(l.setup.wires || []).map(([a, b]) => [a, b, 'ready']), ...l.steps.filter((s) => s.k === 'wire').map((s) => [s.wire[0], s.wire[1], 'you']), ...l.steps.filter((s) => s.clip).map((s) => [s.clip[0], s.clip[1], 'you'])];
  fs.writeFileSync(path.join(d, 'wiring.csv'), 'from,to,who\n' + wires.map(([a, b, w]) => `"${endName(a, tt, 'en')}","${endName(b, tt, 'en')}",${w === 'ready' ? 'already on the bench' : 'student'}`).join('\n') + '\n');
  const md = [];
  for (const lg of ['en', 'hi']) {
    const H = lg === 'hi' ? { goal: 'लक्ष्य', parts: 'पुर्ज़े', wiring: 'वायरिंग', steps: 'चरण', code: 'कोड', board: 'बोर्ड', cls: 'कक्षा', ready: 'पहले से लगा', you: 'आप जोड़ेंगे', from: 'से', to: 'तक' }
      : { goal: 'Goal', parts: 'Parts', wiring: 'Wiring', steps: 'Steps', code: 'Code', board: 'Board', cls: 'Class', ready: 'already on the bench', you: 'you wire it', from: 'From', to: 'To' };
    md.push(`# ${txt(l.title, lg)}`, '', `**${H.board}:** ${BOARD[board] || board} · **${H.cls}:** ${clsOf(l)} · **${H.code}:** \`${codeFile}\``, '', `## ${H.goal}`, '', txt(l.goal, lg), '', `## ${H.parts}`, '');
    const two = mbw && l.world.boards === 2; md.push(...[(two ? '2 × ' : '') + (BOARD[board] || board), ...types.map((t) => partName(t, lg, mbw)), ...(mbw && wires.length ? [lg === 'hi' ? 'क्रोकोडाइल क्लिप वाले तार' : 'Crocodile clip leads'] : [])].map((x) => '- ' + x), '', `## ${H.wiring}`, '');
    if (wires.length) md.push(`| ${H.from} | ${H.to} | |`, '| --- | --- | --- |', ...wires.map(([a, b, w]) => `| ${endName(a, tt, lg)} | ${endName(b, tt, lg)} | ${w === 'ready' ? H.ready : H.you} |`));
    else md.push(lg === 'hi' ? 'कोई तार नहीं: सब कुछ बोर्ड पर ही है।' : (two ? 'No wires: the two boards talk by radio.' : 'No wires: everything is on the board.'));
    md.push('', `## ${H.steps}`, '');
    let k = 0; for (const s of l.steps) { const t = txt(s.do, lg).trim(); if (t) md.push(`${++k}. ${t}`); }
    md.push('', '---', '');
  }
  md.push('DUET STEM · Robotics Lab 360. Open the same project in the app to build it in 3D first: wrong wiring fails there just as it does on the bench.');
  fs.writeFileSync(path.join(d, 'README.md'), md.join('\n'));
  rows.push({ sess: IN_CUR[l.id] ? `Class ${IN_CUR[l.id].k} · session ${IN_CUR[l.id].n}` : '', n, dir, id: l.id, title: txt(l.title, 'en'), title_hi: txt(l.title, 'hi'), board: BOARD[board] || board, cls: clsOf(l), lang: py ? 'Python' : 'C++', group: l.group || (l.batch === 'F' ? 'bank' : '') });
});
fs.writeFileSync(path.join(out, 'projects.csv'), 'no,folder,id,title,title_hi,board,class,curriculum,language\n' + rows.map((r) => [r.n, r.dir, r.id, r.title, r.title_hi, r.board, r.cls, r.sess, r.lang].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n');
const boards = [...new Set(rows.map((r) => r.board))];
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DUET Robotics Projects</title>
<style>:root{--bg:#f6f7f9;--fg:#1d2330;--mut:#5b6474;--card:#fff;--line:#dde2ea;--acc:#1f6feb}@media (prefers-color-scheme:dark){:root{--bg:#12151b;--fg:#e8ebf1;--mut:#9aa3b2;--card:#1b1f27;--line:#2b313c;--acc:#5b9cff}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,Segoe UI,Roboto,sans-serif}header{padding:20px 16px 8px;max-width:1100px;margin:auto}h1{margin:0 0 4px;font-size:22px}p{margin:0;color:var(--mut)}
.bar{display:flex;flex-wrap:wrap;gap:8px;max-width:1100px;margin:8px auto;padding:0 16px}input,select{font:inherit;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--fg)}input{flex:1;min-width:180px}
table{border-collapse:collapse;width:calc(100% - 32px);max-width:1100px;margin:8px auto 40px;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:13px;color:var(--mut)}a{color:var(--acc);text-decoration:none}td small{color:var(--mut)}
@media (max-width:640px){td:nth-child(4),th:nth-child(4){display:none}}</style></head><body>
<header><h1>DUET Robotics Projects</h1><p>${rows.length} projects. Open a folder for its README (English and Hindi), code and wiring. Build each one in Robotics Lab 360 first.</p></header>
<div class="bar"><input id="q" placeholder="Search projects…"><select id="b"><option value="">All boards</option>${boards.map((b) => `<option>${esc(b)}</option>`).join('')}</select>
<select id="c"><option value="">All classes</option>${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Class ${i + 1}</option>`).join('')}</select></div>
<table><thead><tr><th>#</th><th>Project</th><th>Board</th><th>Class</th><th>Code</th></tr></thead><tbody id="t">
${rows.map((r) => `<tr data-b="${esc(r.board)}" data-c="${esc(r.cls)}"><td>${r.n}</td><td><a href="${encodeURI(r.dir)}/README.md">${esc(r.title)}</a><br><small>${esc(r.title_hi)}</small></td><td>${esc(r.board)}</td><td>${esc(r.cls)}${r.sess ? `<br><small>${esc(r.sess.replace(/^Class \d+ · /, ''))}</small>` : ''}</td><td><a href="${encodeURI(r.dir)}/${r.lang === 'Python' ? 'main.py' : 'sketch.ino'}">${r.lang}</a></td></tr>`).join('\n')}
</tbody></table>
<script>const q=document.getElementById('q'),b=document.getElementById('b'),c=document.getElementById('c');
const inCls=(s,k)=>{if(!k)return true;const m=String(s).match(/(\\d+)(?:\\D+(\\d+))?/);if(!m)return false;const lo=+m[1],hi=+(m[2]||m[1]);return k>=lo&&k<=hi;};
function f(){const t=q.value.toLowerCase();for(const r of document.querySelectorAll('#t tr')){r.style.display=(!t||r.textContent.toLowerCase().includes(t))&&(!b.value||r.dataset.b===b.value)&&inCls(r.dataset.c,+c.value)?'':'none';}}
q.oninput=b.onchange=c.onchange=f;</script></body></html>`);
console.log(`${rows.length} projects written to ${out}`);
