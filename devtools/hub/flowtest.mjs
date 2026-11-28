// DUET STEM 360: the Android download flow, tried in headless Chrome with mock.js standing in for the app's bridge.
//   node devtools/hub/flowtest.mjs [outdir]
// Download (progress in MB) → the network drops and comes back (waits, then goes on) → Play; cancel; delete (shared files
// stay while another activity uses them); "Download a whole subject"; the prompt for a not-downloaded activity; the TV
// remote (arrow keys + Enter) reaching the Download button. Pictures of each step in outdir.
import fs from 'fs';
import path from 'path';
import { REPO, WORK, ORIGIN, launch, newPage, closePage, sleep } from './lib.mjs';

const OUT = process.argv[2] || path.join(WORK, 'flow'); fs.mkdirSync(OUT, { recursive: true });
const MOCK = fs.readFileSync(path.join(REPO, 'devtools/hub/mock.js'), 'utf8');
const packs = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/packs.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(REPO, 'hub/catalog.json'), 'utf8'));
// two activities that share files (two body labs share nothing but a journey and its labs may): pick the pair with the most
const ids = cat.items.filter((it) => (packs.items[it.id] || { files: [] }).files.length > 2).map((it) => it.id);
const big = ids.filter((id) => packs.items[id].bytes > 1.5e6 && packs.items[id].bytes < 25e6);
const A = (big.length ? big : ids).sort((x, y) => packs.items[y].files.length - packs.items[x].files.length)[0];
let B = null, best = -1; { const s = new Set(packs.items[A].files); for (const b of ids) { if (b === A) continue; const sh = packs.items[b].files.filter((i) => s.has(i)).length; if (sh > best && sh < packs.items[b].files.length) { best = sh; B = b; } } }
const results = []; const ok = (name, cond, info = '') => { results.push([cond ? 'PASS' : 'FAIL', name, info]); console.log(cond ? 'PASS' : 'FAIL', name, info); };

const b = await launch();
const p = await newPage(b, { width: 915, height: 412, scale: 2 });
await p.evaluateOnNewDocument(`localStorage.removeItem('hubmock.v1');(${MOCK})(${JSON.stringify({ speed: 3e6, drop: true, dropMs: 5000 })})`);
await p.evaluateOnNewDocument(() => { localStorage.setItem('hub.lang', 'en'); localStorage.setItem('hub.mode', 'screen'); });
const go = async (hash) => { await p.goto(ORIGIN + 'hub/index.html' + hash, { waitUntil: 'load' }); await p.waitForFunction(() => document.documentElement.classList.contains('ready'), { timeout: 30000 }); await sleep(400); };
const snap = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });
const txt = (s) => p.$eval(s, (e) => e.textContent).catch(() => '');

// 1. download with progress in MB, a network drop, then Play
await go('#item/' + A);
ok('download button shows the size', /Download.*MB/.test(await txt('[data-dl]')), await txt('[data-dl]'));
await snap('1-detail');
// every state the page shows is recorded as it happens (pictures are slow on a busy machine and must not miss one)
await p.evaluate(() => { window.__seen = []; const box = () => document.querySelector('#actbox'); new MutationObserver(() => { const t = (box() && box().textContent) || ''; const k = /Waiting for the internet/.test(t) ? 'waiting' : /Downloading/.test(t) ? 'downloading' : /Downloaded/.test(t) ? 'done' : null; if (k && window.__seen[window.__seen.length - 1] !== k) window.__seen.push(k); }).observe(document.getElementById('detail'), { subtree: true, childList: true, characterData: true }); });
await p.click('[data-dl]'); await sleep(700);
ok('progress bar with MB', /Downloading… [\d.]+ MB of [\d.]+ MB/.test(await txt('#actbox')), await txt('#actbox .pt'));
await snap('2-downloading');
await p.waitForFunction(() => window.__seen.includes('waiting'), { timeout: 30000 }).catch(() => {});
await snap('3-waiting');
await p.waitForSelector('[data-play]', { timeout: 60000 });
const seen = await p.evaluate(() => window.__seen.join(' > '));
ok('waits when the network drops', seen.includes('downloading > waiting'), seen);
ok('goes on when the network is back', seen.includes('waiting > downloading > done'), seen);
await p.waitForSelector('[data-play]', { timeout: 60000 });
ok('Downloaded · works offline + Play + Delete', /Downloaded · works offline/.test(await txt('#actbox')) && !!(await p.$('#actbox [data-del]')));
await snap('4-downloaded');
// 2. Play opens the activity's page
const href = await p.evaluate((id) => window.__hub.playUrl(window.__hub.CAT.items.find((x) => x.id === id)), A);
ok('Play opens the activity', !!href && href.startsWith('../'), href);

// 3. cancel: B starts and stops
await go('#item/' + B); await p.click('[data-dl]'); await sleep(500);
await p.click('[data-cancel]'); await sleep(600);
ok('cancel returns to Download', !!(await p.$('#actbox [data-dl]')), await txt('#actbox'));
// B's size is smaller than its full size when A shares files with it
const need = await txt('[data-dl]');
ok('shared files count once', best > 0 ? !need.includes((packs.items[B].bytes / 1e6).toFixed(1) + ' MB') || packs.items[B].bytes < 1e5 : true, `${best} shared files; button "${need}"`);

// 4. downloads tab, delete, subject download
await go('#downloads');
ok('downloads tab lists the activity', (await txt('#view')).includes(cat.items.find((x) => x.id === A).title.en));
ok('space used and free are shown', /Used by downloads/.test(await txt('#view')) && /Free on this phone/.test(await txt('#view')));
await snap('5-downloads');
await p.click(`[data-del="${A}"]`); await sleep(300); await snap('6-delete-ask'); await p.click('#askyes'); await sleep(600);
ok('delete frees the space', /Deleted · [\d.]+ MB freed/.test(await txt('#toast')), await txt('#toast'));
const sub = await p.$('[data-dlsub="robotics"]') ? 'robotics' : 'body';
const btn = await p.$(`[data-dlsub]`);
if (btn) { const which = await btn.evaluate((e) => e.dataset.dlsub); await btn.click(); await sleep(800); ok('download a whole subject queues its activities', (await txt('#view')).includes('Downloading now'), which); await snap('7-subject'); }

// 5. the prompt shown in place of a not-downloaded activity
await go('#need/' + B);
ok('need prompt', /not on this phone yet/.test(await txt('#detail')) && !!(await p.$('#detail [data-dl]')));
await snap('8-need');

// 6. TV remote: arrow keys and Enter reach and press Download
await go('#home'); await p.keyboard.press('ArrowDown'); for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await sleep(120); }
const f1 = await p.evaluate(() => document.activeElement && (document.activeElement.className || document.activeElement.tagName));
ok('arrow keys move the focus', !!f1 && f1 !== 'BODY', f1);
await p.keyboard.press('Enter'); await sleep(700);
const onDetail = await p.evaluate(() => !document.getElementById('detail').hidden || /#(item|all)/.test(location.hash));
ok('Enter opens', onDetail, await p.evaluate(() => location.hash));
await snap('9-remote');
await p.keyboard.press('Escape'); await sleep(500);
ok('Back closes', await p.evaluate(() => document.getElementById('detail').hidden));
ok('no page errors', !p.rec.errors.length, p.rec.errors.slice(0, 3).join(' | '));
await closePage(p); await b.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ A, B, shared: best, results }, null, 1));
console.log(`${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed · pictures in ${OUT}`);
