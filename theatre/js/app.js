// "Kyun?" theatre page: the list of stories (home) and the player's buttons, keys and cards.
import { Player, LANGS, store, QUEST, PHONE, linkHref } from './player.js';

const Q = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);
const T = {
  theatre: { en: 'Kyun? Theatre', hi: 'क्यों? थिएटर', hg: 'Kyun? Theatre' },
  heroT: { en: 'Every <em>why</em> has a story.', hi: 'हर <em>क्यों</em> की एक कहानी है।', hg: 'Har <em>kyun</em> ki ek kahani hai.' },
  heroP: { en: 'Short narrated 3D stories about everyday questions, in real places. Pause any time and turn the scene around, look inside with the zoom window, then try it yourself.', hi: 'रोज़ के सवालों पर छोटी 3D कहानियाँ, असली जगहों में। कभी भी रोको और दृश्य को घुमाकर देखो, ज़ूम खिड़की से अंदर झाँको, फिर खुद करके देखो।', hg: 'Roz ke sawalon par chhoti 3D kahaniyan, asli jagahon mein. Kabhi bhi roko aur scene ghuma kar dekho, zoom window se andar jhaanko, phir khud karke dekho.' },
  all: { en: 'All', hi: 'सभी', hg: 'Sab' },
  physics: { en: 'Physics', hi: 'भौतिकी', hg: 'Physics' }, chemistry: { en: 'Chemistry', hi: 'रसायन', hg: 'Chemistry' }, biology: { en: 'Biology', hi: 'जीव विज्ञान', hg: 'Biology' }, space: { en: 'Space', hi: 'अंतरिक्ष', hg: 'Space' },
  cls: { en: 'Class', hi: 'कक्षा', hg: 'Class' }, sec: { en: 's', hi: 'सेकंड', hg: 's' },
  play: { en: 'Play', hi: 'चलाओ', hg: 'Play karo' }, again: { en: 'Watch again', hi: 'फिर से देखो', hg: 'Phir se dekho' }, next: { en: 'Next story', hi: 'अगली कहानी', hg: 'Agli kahani' },
  loading: { en: 'Getting the scene ready…', hi: 'दृश्य तैयार हो रहा है…', hg: 'Scene taiyaar ho raha hai…' },
  kyun: { en: 'Kyun? · Why?', hi: 'क्यों?', hg: 'Kyun?' },
  nowtry: { en: 'Now try it yourself', hi: 'अब खुद करके देखो', hg: 'Ab khud karke dekho' },
  open: { en: 'Open the activity', hi: 'गतिविधि खोलो', hg: 'Activity kholo' },
  credits: { en: 'Credits and licences', hi: 'श्रेय और लाइसेंस', hg: 'Credits aur licences' },
  hint: { en: 'Pause any time and drag to turn the scene. Space or OK = pause, arrows = back or forward, Back = close.', hi: 'कभी भी रोको और दृश्य को खींचकर घुमाओ। Space या OK = रोको, तीर = पीछे या आगे, Back = बंद करो।', hg: 'Kabhi bhi roko aur scene ko kheench kar ghumao. Space ya OK = pause, arrows = peeche ya aage, Back = band karo.' },
  hintBox: { en: 'VR box: put the phone in the box after you press Play. Tap the screen or press OK on the remote to pause.', hi: 'VR बॉक्स: Play दबाकर फ़ोन को बॉक्स में रखो। रोकने के लिए स्क्रीन छुओ या रिमोट का OK दबाओ।', hg: 'VR box: Play dabaakar phone ko box mein rakho. Pause ke liye screen touch karo ya remote ka OK dabao.' },
  screen: { en: 'Screen', hi: 'स्क्रीन', hg: 'Screen' }, box: { en: 'VR box', hi: 'VR बॉक्स', hg: 'VR box' }, quest: { en: 'Quest', hi: 'क्वेस्ट', hg: 'Quest' },
  paused: { en: 'Paused', hi: 'रुका हुआ', hg: 'Paused' }, okPlay: { en: 'OK / trigger: play', hi: 'OK / ट्रिगर: चलाओ', hg: 'OK / trigger: play' }, okTry: { en: 'OK / trigger: open the activity', hi: 'OK / ट्रिगर: गतिविधि खोलो', hg: 'OK / trigger: activity kholo' },
  offline: { en: 'Plays offline after the first visit', hi: 'पहली बार के बाद बिना इंटरनेट चलता है', hg: 'Pehli baar ke baad bina internet chalta hai' },
};
let lang = LANGS.includes(Q.get('lang')) ? Q.get('lang') : (store.get('lang') || ((navigator.language || '').startsWith('hi') ? 'hi' : 'en'));
if (!LANGS.includes(lang)) lang = 'en';
const tr = (k) => (T[k] ? T[k][lang] || T[k].en : k);
const L = (o) => (o ? (typeof o === 'string' ? o : o[lang] || o.en) : '');
let CAT = null, filter = 'all', P = null;

// ------------------------------------------------------------------ home
async function home() {
  if (!CAT) { try { CAT = await (await fetch('catalog.json')).json(); } catch (e) { CAT = { stories: [] }; } }
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  for (const b of document.querySelectorAll('[data-t]')) b.textContent = tr(b.dataset.t);
  $('#heroT').innerHTML = tr('heroT'); $('#heroP').textContent = tr('heroP'); $('#offl').textContent = tr('offline');
  for (const b of document.querySelectorAll('#langH button')) b.classList.toggle('on', b.dataset.l === lang);
  const subs = ['all', ...new Set(CAT.stories.map((s) => s.subject))];
  $('#pills').innerHTML = subs.map((s) => `<button data-f="${s}" class="${s === filter ? 'on' : ''}">${tr(s)}</button>`).join('');
  const col = { physics: 'var(--phys)', chemistry: 'var(--chem)', biology: 'var(--bio)', space: 'var(--space)' };
  $('#grid').innerHTML = CAT.stories.filter((s) => filter === 'all' || s.subject === filter).map((s) => `
    <button class="card" data-s="${s.id}">
      <div class="pic" style="background-image:url(${s.thumb})"><span class="len">${Math.round(s.length[lang === 'en' ? 'en' : 'hi'])} ${tr('sec')}</span><span class="play">▶</span></div>
      <div class="txt"><h3>${esc(L(s.title))}</h3><div class="sub">${esc(L(s.chapter))}</div>
      <div class="meta"><span class="tag s" style="background:${col[s.subject] || '#999'}">${tr(s.subject)}</span><span class="tag">${tr('cls')} ${s.classes.join(', ')}</span><span class="tag">${tr('screen')} · ${tr('box')} · ${tr('quest')}</span></div></div>
    </button>`).join('');
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
$('#pills').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { filter = b.dataset.f; home(); } });
$('#grid').addEventListener('click', (e) => { const b = e.target.closest('.card'); if (b) openStory(b.dataset.s, true); });
$('#langH').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { lang = b.dataset.l; store.set('lang', lang); home(); } });

// ------------------------------------------------------------------ player
function player() {
  if (P) return P;
  P = new Player({ stage: $('#stage') });
  P.ui = ui;
  if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-vr').then((ok) => { if (ok) for (const b of document.querySelectorAll('[data-m="quest"]')) b.hidden = false; }).catch(() => {});
  return P;
}
async function openStory(id, push) {
  if (push) history.pushState({ kt: 'player', id }, '', '?s=' + id + (Q.has('ff') ? '&ff=' + Q.get('ff') : ''));
  document.body.classList.add('playing'); if (Q.has('shot')) document.body.classList.add('shot');
  const p = player(); const meta = CAT && CAT.stories.find((s) => s.id === id); cur = meta;
  $('#ptitle').textContent = meta ? L(meta.title) : '';
  try { await p.open(id, { lang }); } catch (e) { console.error(e); toast('Could not open this story: ' + e.message); }
}
let cur = null;
function closeStory() { if (P) { P.setMode('screen'); P.close(); } document.body.classList.remove('playing', 'kt-box'); }

const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function over(id) { for (const o of document.querySelectorAll('.over')) o.classList.toggle('on', o.id === id); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.k); toast.k = setTimeout(() => { t.style.display = 'none'; }, 3500); }

function ui(kind, arg) {
  const p = P; if (!p) return;
  switch (kind) {
    case 'loading': over('load'); $('#cap').textContent = ''; break;
    case 'ready': {
      over('startc'); const S = p.story;
      $('#sq').textContent = L(S.q); $('#ptitle').textContent = L(S.q);
      $('#smeta').textContent = `${Math.round(p.dur)} ${tr('sec')} · ${tr('cls')} ${S.classes.join(', ')} · ${tr(S.subject)}`;
      $('#smodes').innerHTML = '';
      $('#shint').textContent = p.mode === 'box' ? tr('hintBox') : tr('hint');
      langButtons(); modeButtons(); scrubMarks(); time(); mid(); break;
    }
    case 'count': over('countc'); mid(); break;
    case 'countTick': { const n = Math.max(1, 3 - Math.floor(p.countK / 0.9)); if ($('#count').textContent !== String(n)) { $('#count').textContent = n; mid(); } break; }
    case 'play': over(null); $('#pplay').textContent = '❚❚'; mid(); break;
    case 'pause': $('#pplay').textContent = '▶'; mid(); break;
    case 'time': time(); break;
    case 'caption': $('#cap').textContent = p.capText || ''; break;
    case 'lang': langButtons(); $('#ptitle').textContent = L(p.story && p.story.q); scrubMarks(); time(); if (p.state === 'ready') ui('ready'); if (p.state === 'end') ui('end'); break;
    case 'mode': modeButtons(); mid(); break;
    case 'end': endCard(); $('#pplay').textContent = '↺'; mid(); break;
    case 'golink': { const l = p.links()[0]; if (l) go(l.href); break; }
    case 'ok': if (p.state === 'end') ui('golink'); else p.toggle(); break;
    case 'back': history.back(); break;
    case 'toast': toast(arg); break;
    case 'closed': break;
  }
}
function go(href) { if (P && P.xrSession) P.xrSession.end().catch(() => {}); location.href = href; }
function langButtons() { for (const b of document.querySelectorAll('#langP button')) b.classList.toggle('on', b.dataset.l === P.lang); }
function modeButtons() {
  for (const b of document.querySelectorAll('#modes button')) { b.classList.toggle('on', b.dataset.m === P.mode); b.textContent = tr(b.dataset.m); }
}
function scrubMarks() {
  const s = $('#scrub'); for (const i of s.querySelectorAll('i')) i.remove();
  if (!P.beats) return; for (const b of P.beats.slice(1)) { const i = document.createElement('i'); i.style.left = (b.t0 / P.dur * 100) + '%'; s.appendChild(i); }
}
function time() { if (!P.dur) return; const k = P.t / P.dur * 100; $('#scrub .fill').style.width = k + '%'; $('#scrub .knob').style.left = k + '%'; $('#time').textContent = fmt(P.t) + ' / ' + fmt(P.dur); }
function endCard() {
  over('endc'); const S = P.story, links = P.links();
  $('#etry').textContent = tr('nowtry'); $('#eact').textContent = links[0] ? L(links[0].title) : '';
  $('#elinks').innerHTML = links.map((l, i) => `<a class="${i ? 'ghost' : 'big'}" href="${l.href}">${i ? '' : '▶ '}${esc(i ? L(l.title) : tr('open'))}</a>`).join('');
  const ids = CAT ? CAT.stories.map((s) => s.id) : []; const nx = ids[(ids.indexOf(S.id) + 1) % ids.length];
  const nm = CAT && CAT.stories.find((s) => s.id === nx); $('#enext').textContent = tr('next') + ' →'; $('#enext').title = nm ? L(nm.title) : ''; $('#enext').dataset.s = nx || '';
}
// the card in the middle of a VR box / headset view
function mid() {
  if (!P || !P.midP) return; const st = P.state; let lines = null;
  if (st === 'ready') lines = [L(P.story.q), tr('okPlay')];
  else if (st === 'count') lines = [$('#count').textContent, ''];
  else if (st === 'pause') lines = [tr('paused'), tr('okPlay')];
  else if (st === 'end') { const l = P.links()[0]; lines = [tr('nowtry'), l ? L(l.title) : '', tr('okTry')]; }
  P.midP.mesh.visible = !!lines; if (!lines) return;
  P.midP.draw((g, w, h) => { g.fillStyle = 'rgba(14,17,25,0.9)'; g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 40); g.fill(); g.strokeStyle = 'rgba(240,166,90,0.8)'; g.lineWidth = 5; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f4efe6';
    const big = st === 'count'; g.font = `700 ${big ? 260 : 58}px "Noto Sans Devanagari", system-ui`; fit(g, lines[0], w / 2, big ? h / 2 : h * 0.3, w - 80);
    g.font = '600 40px "Noto Sans Devanagari", system-ui'; g.fillStyle = '#ffd79c'; if (lines[1]) fit(g, lines[1], w / 2, h * 0.56, w - 80);
    g.fillStyle = '#a69e92'; g.font = '600 34px "Noto Sans Devanagari", system-ui'; if (lines[2]) fit(g, lines[2], w / 2, h * 0.78, w - 80); });
}
function fit(g, t, x, y, mw) { let f = g.font; let px = parseInt(/(\d+)px/.exec(f)[1], 10); while (g.measureText(t).width > mw && px > 20) { px -= 2; g.font = f.replace(/\d+px/, px + 'px'); } g.fillText(t, x, y); }

$('#sgo').addEventListener('click', () => P.start());
$('#pplay').addEventListener('click', () => P.toggle());
$('#pback5').addEventListener('click', () => P.skip(-5));
$('#pfwd5').addEventListener('click', () => P.skip(5));
$('#pmute').addEventListener('click', () => { P.muted = !P.muted; $('#pmute').textContent = P.muted ? '🔇' : '🔊'; P.stopAudio(); });
$('#pclose').addEventListener('click', () => history.back());
$('#boxx').addEventListener('click', () => history.back());
$('#eagain').addEventListener('click', () => { P.t = 0; P.start(); });
$('#enext').addEventListener('click', (e) => { const id = e.currentTarget.dataset.s; if (id) { history.replaceState({ kt: 'player', id }, '', '?s=' + id); openStory(id, false); } });
$('#langP').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { lang = b.dataset.l; store.set('lang', lang); P.setLang(lang); } });
$('#modes').addEventListener('click', async (e) => { const b = e.target.closest('button'); if (!b) return; const ok = await P.setMode(b.dataset.m); if (ok && b.dataset.m !== 'screen' && P.state === 'ready') P.start(); });
// the scrub bar: tap or drag
{
  const s = $('#scrub'); let on = false;
  const at = (e) => { const r = s.getBoundingClientRect(); P.seek((e.clientX - r.left) / r.width * P.dur); };
  s.addEventListener('pointerdown', (e) => { on = true; s.setPointerCapture(e.pointerId); at(e); });
  s.addEventListener('pointermove', (e) => { if (on) at(e); });
  s.addEventListener('pointerup', () => { on = false; });
}
// Bluetooth remotes and keyboards: Enter / Space = pause or play, arrows = back or forward 5 s, Back = close
addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('playing') || !P) return;
  const k = e.key;
  if (k === 'Enter' || k === ' ' || k === 'MediaPlayPause' || k === 'MediaPlay' || k === 'MediaPause' || e.code === 'Space') {
    if (e.target && e.target.tagName === 'BUTTON' && k === 'Enter' && P.mode === 'screen') return; // the focused button handles it
    e.preventDefault(); ui('ok');
  } else if (k === 'ArrowLeft' || k === 'MediaRewind') { e.preventDefault(); P.skip(-5); }
  else if (k === 'ArrowRight' || k === 'MediaFastForward') { e.preventDefault(); P.skip(5); }
  else if (k === 'Escape' || k === 'Backspace' || k === 'BrowserBack' || k === 'GoBack') { e.preventDefault(); history.back(); }
});
// the Android back key (and the browser's): leaves the VR box first, then closes the story
addEventListener('popstate', (e) => {
  const st = e.state || {};
  if (P && P.mode === 'box' && st.kt !== 'box') { P.setMode('screen'); if (st.kt === 'player') return; }
  if (st.kt === 'player' && st.id) { if (!P || P.id !== st.id) openStory(st.id, false); return; }
  closeStory(); home();
});

// ------------------------------------------------------------------ start
(async () => {
  await home();
  const id = Q.get('s');
  if (id) {
    // opened straight on a story (from the hub): the back key closes it to the list
    history.replaceState({ kt: 'home' }, '', location.pathname + (Q.has('lang') ? '?lang=' + lang : ''));
    history.pushState({ kt: 'player', id }, '', '?s=' + id + [...Q.entries()].filter(([k]) => k !== 's').map(([k, v]) => '&' + k + (v ? '=' + v : '')).join(''));
    await openStory(id, false);
    if (Q.get('mode') === 'box') P.setMode('box');
  } else history.replaceState({ kt: 'home' }, '', location.href);
  document.title = Q.has('test') && !id ? 'READY' : document.title;
})();
window.KT = { home, openStory, get P() { return P; }, linkHref };
