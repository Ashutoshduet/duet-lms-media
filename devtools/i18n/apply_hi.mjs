// Put the spoken-Hindi rewrites (devtools/i18n/hi/*.py, exported as JSON) into the dictionaries the apps use.
// node devtools/i18n/apply_hi.mjs <science/js/exp_i18n_x.js> <overrides.json>
import fs from 'fs';
import path from 'path';
const [,, file, over] = process.argv;
const src = fs.readFileSync(file, 'utf8');
const mod = await import(path.resolve(file));
const [name, D] = Object.entries(mod)[0];
const O = JSON.parse(fs.readFileSync(over, 'utf8'));
let n = 0, miss = [];
for (const [k, hi] of Object.entries(O)) { if (!D[k]) { miss.push(k); continue; } if (D[k].hi !== hi) { D[k].hi = hi; n++; } }
const head = src.slice(0, src.indexOf('export const')).trimEnd();
const body = Object.entries(D).map(([k, v]) => '  ' + JSON.stringify(k) + ': { ' + Object.entries(v).map(([l, t]) => l + ': ' + JSON.stringify(t)).join(', ') + ' },').join('\n');
fs.writeFileSync(file, (head ? head + '\n' : '') + `export const ${name} = {\n${body}\n};\n`);
console.log(path.basename(file), 'changed', n, 'of', Object.keys(D).length, miss.length ? 'MISSING ' + JSON.stringify(miss) : '');
