// DUET AR viewer page (ar/index.html): the model list, the card scanner and the viewer for one model in every mode.
//   ?scan=1            scan the DUET AR Cards (each card brings up its own model, standing on the card)
//   ?c=<id>            the same, opened from a card's QR code: that card's model is loaded at once
//   ?model=<id or a .glb path relative to ar/>&mode=<mode>   one model in a mode (screen, pad, cube, anaglyph, gyro360, vrbox…)
//   &lang=en|hi|hg     &debug=1 shows the tracker numbers     &print=1 a see-through picture for the printed cards
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { startMode, MODES, MODE_INFO, modeText } from './modes.js';
import { loadItem } from './models.js';
import { BtPad, HELP } from './btpad.js';
import { S, t, pick, LANGS, getLang, setLang } from './i18n.js';
import { loadInfo, partFor, itemSay, Narrator } from './info.js';
import { CARD_ID0 } from './markers.js';

const Q = new URLSearchParams(location.search);
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MC = { scan: '#f26b1d', screen: '#8fb4ff', pad: '#f26b1d', cube: '#ffb547', anaglyph: '#ff5d6c', 'anaglyph-pad': '#ff5d6c', gyro360: '#4fd1c5', vrbox: '#b28dff' };
const I = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.8" y="5.5" width="3.8" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.4" y="5.5" width="3.8" height="13" rx="1" fill="currentColor" stroke="none"/>',
  spin: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  recenter: '<circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r="7.6"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4"/>',
  next: '<path d="M6 6l8.5 6L6 18z"/><path d="M18 6v12"/>',
  prev: '<path d="M18 6l-8.5 6L18 18z"/><path d="M6 6v12"/>',
  help: '<path d="M7.2 8.6h9.6a4.2 4.2 0 0 1 4.1 5.1l-.7 3.2a2.3 2.3 0 0 1-4 1L14.4 16H9.6l-1.8 1.9a2.3 2.3 0 0 1-4-1l-.7-3.2a4.2 4.2 0 0 1 4.1-5.1z"/><path d="M8 11v3.4M6.3 12.7h3.4"/><circle cx="15.6" cy="11.6" r=".7" fill="currentColor"/><circle cx="17.4" cy="13.6" r=".7" fill="currentColor"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3" y="8" width="18" height="8.5" rx="2"/><path d="M7 13.5h10v7H7z"/>',
  screen: '<rect x="6.3" y="2.5" width="11.4" height="19" rx="2.4"/><path d="M12 8.3l3 1.7v3.5l-3 1.7-3-1.7V10z M9 10l3 1.7 3-1.7 M12 11.7v3.5"/>',
  pad: '<path d="M2.5 18.5l3.6-6h11.8l3.6 6z"/><path d="M5 17l1.2-2M19 17l-1.2-2" /><path d="M12 3.2l3.2 1.8v3.6L12 10.4 8.8 8.6V5z M8.8 5L12 6.8 15.2 5 M12 6.8v3.6"/>',
  cube: '<path d="M12 2.8l8 4.5v9.4l-8 4.5-8-4.5V7.3z M4 7.3l8 4.5 8-4.5 M12 11.8v9.4"/><path d="M14.2 14.2l3-1.7v3l-3 1.7z" fill="currentColor"/>',
  glasses: '<path d="M2 9.5h20"/><rect x="2.8" y="9.5" width="7.8" height="6" rx="2.2" fill="#ff3b3b" fill-opacity=".55"/><rect x="13.4" y="9.5" width="7.8" height="6" rx="2.2" fill="#18c8ff" fill-opacity=".55"/><path d="M10.6 11.5c.9-.8 1.9-.8 2.8 0"/>',
  gyro: '<rect x="8.3" y="5" width="7.4" height="14" rx="1.8"/><path d="M4.2 7.5a9.5 9.5 0 0 0 0 9M19.8 7.5a9.5 9.5 0 0 1 0 9"/><path d="M2.6 14.6l1.6 1.9 1.9-1.6M21.4 14.6l-1.6 1.9-1.9-1.6"/>',
  vrbox: '<path d="M2.8 8h18.4v8.2a1.6 1.6 0 0 1-1.6 1.6h-4.3l-2-2.6h-2.6l-2 2.6H4.4a1.6 1.6 0 0 1-1.6-1.6z"/><circle cx="8" cy="12.6" r="2"/><circle cx="16" cy="12.6" r="2"/><path d="M6 8V6.2h12V8"/>',
  credits: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.4a3.6 3.6 0 1 0 0 5.2"/>',
  card: '<rect x="5" y="2.8" width="14" height="18.4" rx="2"/><rect x="7.6" y="12.2" width="5.6" height="5.6" fill="currentColor" stroke="none"/><path d="M8 6.4h8M8 9h5"/>',
  scan: '<path d="M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16"/><path d="M12 7.2l4 2.3v4.7l-4 2.3-4-2.3V9.5z M8 9.5l4 2.3 4-2.3 M12 11.8v4.7"/>',
  sound: '<path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/>',
  apart: '<path d="M12 3.5l3.6 2v4L12 11.5l-3.6-2v-4z"/><path d="M6 13.2l3.6 2v4L6 21.2l-3.6-2v-4zM18 13.2l3.6 2v4l-3.6 2-3.6-2v-4z"/>',
  together: '<path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z M4.5 7.3L12 11.6l7.5-4.3 M12 11.6V21"/>',
  g360: '<ellipse cx="12" cy="12" rx="9" ry="3.6"/><path d="M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18"/><path d="M19.4 14.4l1.6-1.8 1.4 2"/>',
  mr: '<path d="M2.5 16.5h19"/><path d="M5 16.5l1.5-4h11l1.5 4"/><path d="M12 4l3 1.7v3.5L12 11 9 9.2V5.7z"/>',
};
const icon = (k) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k] || ''}</svg>`;

const MODE_ICON = { scan: 'card', screen: 'screen', pad: 'pad', cube: 'cube', anaglyph: 'glasses', 'anaglyph-pad': 'glasses', gyro360: 'gyro', vrbox: 'vrbox' };
const CAPTURE_VOLUME = new Set(['scan', 'pad', 'cube', 'anaglyph-pad', 'vrbox']);   // the remote's volume keys zoom here (DUET app)
const PRINT = [['body', 'duet-ar-cards-body'], ['space', 'duet-ar-cards-space'], ['science', 'duet-ar-cards-science'], ['robotics', 'duet-ar-cards-robotics'], ['maths', 'duet-ar-cards-maths']];

const app = {
  lang: getLang(), catalog: null, group: 'all', homeMode: 'screen', mode: 'screen', item: null, model: null, ctl: null,
  playing: false, token: 0, clock: new THREE.Clock(), errors: [], narr: new Narrator(), label: null, back: null, xr: false,
};
window.__ar = app;   // for the tests and for debugging on a phone (chrome://inspect)

// ---------------------------------------------------------------------------------------------- start
async function boot() {
  document.documentElement.lang = app.lang === 'en' ? 'en' : 'hi';
  try { app.catalog = await (await fetch('catalog.json')).json(); } catch (e) { app.catalog = { groups: [], items: [] }; }
  loadInfo().catch(() => {});
  const m = Q.get('mode'); if (MODES.includes(m) && m !== 'scan') app.homeMode = m;
  addEventListener('popstate', route);
  app.pad = new BtPad({ onAction: onPad, onConnect: (on) => on && toast(t('remoteOn', app.lang)) });
  app.pad.start();
  app.narr.onstate = () => updateDock();
  if (Q.get('thumb') || Q.get('print')) document.body.classList.add('thumb');
  if (Q.get('print')) document.body.classList.add('print');
  // Meta Quest (and other headsets): no camera for web pages, but mixed reality: the model goes on the real table
  if (Q.has('iwer')) {   // tests only: an emulated Meta Quest 3 (the Science Lab's copy of IWER, never shipped)
    try { const { XRDevice, metaQuest3 } = await import('../../science/test/iwer.module.js'); const d = new XRDevice(metaQuest3); d.installRuntime({ forceInstall: true }); d.stereoEnabled = false; d.position.set(0, 1.5, 0); window.xrdev = d; } catch (e) { app.errors.push('iwer: ' + e.message); }
  }
  if (navigator.xr && navigator.xr.isSessionSupported && !Q.get('thumb') && !Q.get('print')) {
    app.xr = await Promise.race([navigator.xr.isSessionSupported('immersive-ar').catch(() => false), new Promise((r) => setTimeout(() => r(false), 1500))]);
  }
  route();
}

function route() {
  const q = new URLSearchParams(location.search), id = q.get('model'), c = q.get('c');
  if (app.sheet && !(history.state && history.state.sheet)) closeSheet(true);
  if (c || q.get('scan')) {
    const it = c ? findItem(c) || byCard(+c) : null;
    if (app.xr && it) { app.mrItem = it; showHome(); return; }   // a headset: the tap on the "put it on my table" button starts it
    openScan(it); return;
  }
  if (id) {
    const it = findItem(id); const mode = MODES.includes(q.get('mode')) ? q.get('mode') : 'screen';
    if (!it) { showHome(); return; }
    openViewer(it, mode);
  } else { closeViewer(); showHome(); }
}
function findItem(id) {
  const it = app.catalog.items.find((x) => x.id === id);
  if (it) return it;
  if (/\.glb$/i.test(id)) return { id, src: id, group: 'other', name: { en: decodeURIComponent(id.split('/').pop().replace(/\.glb$/i, '').replace(/[_-]+/g, ' ')) } };
  return null;
}
const byCard = (n) => app.catalog.items.find((x) => x.card === n) || null;
const urlFor = (it, mode) => (mode === 'scan' ? `?scan=1${it ? '&c=' + encodeURIComponent(it.id) : ''}` : `?model=${encodeURIComponent(it.id)}&mode=${mode}`) + (Q.get('debug') ? '&debug=1' : '');
const groupName = (it) => pick((app.catalog.groups.find((g) => g.id === (it && it.group)) || {}).name, app.lang);

// ---------------------------------------------------------------------------------------------- home
function showHome() {
  const L = app.lang, home = $('#home'), cat = app.catalog;
  $('#viewer').hidden = true; home.hidden = false; document.title = 'DUET AR'; document.body.classList.add('home');
  const groups = [{ id: 'all', name: S.all }, ...cat.groups];
  const items = cat.items.filter((x) => app.group === 'all' || x.group === app.group);
  const homeModes = ['screen', 'pad', 'cube', 'anaglyph', 'gyro360', 'vrbox'];
  const anaPad = app.homeMode === 'anaglyph-pad';
  home.innerHTML = `
    <header class="hd">
      <img class="logo" src="../science/brand/duet-stem-logo-light.png" alt="DUET STEM"><span class="tag">AR</span><span class="sp"></span>
      <div class="seg" role="group" aria-label="Language">${LANGS.map(([k, n]) => `<button data-lang="${k}" aria-pressed="${k === L}">${n}</button>`).join('')}</div>
      <a class="lnk" href="credits.html">${esc(t('credits', L))}</a>
    </header>
    <section class="hero">
      ${app.xr ? `<div class="quest"><span class="mi">${icon('mr')}</span><div><b>${esc(t('questTitle', L))}</b><p>${esc(t('questText', L))}</p>${app.mrItem ? `<button class="btn acc" id="b-mr" style="margin-top:10px">${icon('mr')}${esc(t('mr', L))}: ${esc(pick(app.mrItem.name, L))}</button>` : ''}</div></div>`
    : `<button class="scanbtn" id="b-scan">${icon('scan')}<span><b>${esc(t('scan', L))}</b><small>${esc(t('scanSub', L))}</small></span></button>`}
    </section>
    <h2>${esc(t('pickModel', L))} · ${items.length} ${esc(t('models', L))}</h2>
    <div class="chips" role="group">${groups.map((g) => `<button class="chip" data-group="${g.id}" aria-pressed="${g.id === app.group}">${esc(pick(g.name, L))}</button>`).join('')}</div>
    ${app.xr ? '' : `<div class="modes" role="group">${homeModes.map((m) => {
      const on = app.homeMode === m || (m === 'anaglyph' && anaPad);
      return `<button class="mcard" data-mode="${m}" aria-pressed="${on}" style="--mc:${MC[m]}"><span class="mi">${icon(MODE_ICON[m])}</span><b>${esc(modeText(m, 'badge', L))}</b><small>${esc(modeText(m, 'hint', L))}</small>${m === 'anaglyph' ? `<label class="opt"><input type="checkbox" id="anapad" ${anaPad ? 'checked' : ''}>${esc(t('onPad', L))}</label>` : ''}</button>`;
    }).join('')}</div>`}
    <div class="grid">${items.map((it) => `<button class="card" data-id="${it.id}"><img class="th" loading="lazy" src="thumbs/${it.id}.webp" alt="" onerror="this.style.visibility='hidden'">${it.card != null ? `<span class="cardno">${esc(t('card', L))} ${it.card + 1}</span>` : ''}<span class="nm">${esc(pick(it.name, L))}</span><span class="gp">${esc(groupName(it))}</span></button>`).join('')}</div>
    <section class="print">
      <img src="print/duet-ar-cards-cover.png" alt="DUET AR Cards" onerror="this.src='print/duet-pad-a4.png'">
      <div><b>${esc(t('cardsTitle', L))}</b><p>${esc(t('cardsText', L))}</p>
      <div class="btns"><a class="btn acc" href="print/duet-ar-cards-all.pdf" target="_blank" rel="noopener">${icon('print')}${esc(t('allCards', L))}</a>${PRINT.map(([g, f]) => `<a class="btn" href="print/${f}.pdf" target="_blank" rel="noopener">${esc(pick((cat.groups.find((x) => x.id === g) || {}).name, L))}</a>`).join('')}</div>
      <p style="margin-top:12px">${esc(t('printText', L))}</p>
      <div class="btns"><a class="btn" href="print/duet-pad-a4.pdf" target="_blank" rel="noopener">${icon('pad')}${esc(t('padA4', L))}</a><a class="btn" href="print/duet-pad-a3.pdf" target="_blank" rel="noopener">${esc(t('padA3', L))}</a><a class="btn" href="print/duet-cube.pdf" target="_blank" rel="noopener">${icon('cube')}${esc(t('cubeSheet', L))}</a></div></div>
    </section>
    <footer class="foot"><span>DUET STEM · DUET AR</span><a class="lnk" href="credits.html">${esc(t('credits', L))}</a></footer>`;
  home.querySelectorAll('[data-lang]').forEach((b) => b.onclick = () => { app.lang = b.dataset.lang; setLang(app.lang); showHome(); });
  home.querySelectorAll('[data-group]').forEach((b) => b.onclick = () => { app.group = b.dataset.group; showHome(); });
  home.querySelectorAll('[data-mode]').forEach((b) => b.onclick = (e) => {
    if (e.target.id === 'anapad') { app.homeMode = e.target.checked ? 'anaglyph-pad' : 'anaglyph'; showHome(); return; }
    app.homeMode = b.dataset.mode === 'anaglyph' && $('#anapad').checked ? 'anaglyph-pad' : b.dataset.mode; showHome();
  });
  const mb = $('#b-mr'); if (mb) mb.onclick = () => openMR(app.mrItem);
  const sb = $('#b-scan'); if (sb) sb.onclick = () => { history.pushState({ ar: 'view', from: 'home' }, '', urlFor(null, 'scan')); openScan(null); };
  home.querySelectorAll('[data-id]').forEach((b) => b.onclick = () => {
    const it = findItem(b.dataset.id);
    if (app.xr) { openMR(it); return; }
    history.pushState({ ar: 'view', from: 'home' }, '', urlFor(it, app.homeMode)); openViewer(it, app.homeMode);
  });
}

// ---------------------------------------------------------------------------------------------- Meta Quest: mixed reality
async function openMR(item) {
  try {
    const { startMR } = await import('./xr.js');
    await startMR(item, { lang: app.lang, onEnd: () => { app.mr = null; } });
  } catch (e) { app.errors.push('mr: ' + e.message); console.error(e); toast(t('loadFail', app.lang) + ' ' + (e.message || '')); }
}

// ---------------------------------------------------------------------------------------------- viewer
function ensureRenderer() {
  if (app.renderer) return;
  const canvas = $('#c');
  const r = app.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!(Q.get('thumb') || Q.get('print')) });
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0;
  r.setClearColor(0x000000, 0);
  const scene = app.scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  scene.environmentIntensity = 0.9;
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-1.2, 2.4, 1.6); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2018, 0.45));
  app.camera = new THREE.PerspectiveCamera(40, 1, 0.02, 100);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); app.errors.push('webgl context lost'); });
  addEventListener('resize', resize);
  r.setAnimationLoop(frame);
}
function resize() {
  if (!app.renderer) return;
  const w = innerWidth, h = innerHeight, cam = app.ctl && app.ctl.info.camera;
  app.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cam || app.mode === 'vrbox' ? 1.5 : 2));
  app.renderer.setSize(w, h, false);
  if (app.ctl) app.ctl.resize(w, h);
}
function frame() {
  const dt = Math.min(0.1, app.clock.getDelta());
  app.pad && app.pad.update(dt);
  if (!app.ctl) return;
  if (app.mixer && app.playing) app.mixer.update(dt);
  if (app.spinObj && app.playing) app.spinObj.rotation.y += dt * 0.35;
  app.ctl.update(dt); app.ctl.render();
  placeLabel();
  app.frames = (app.frames || 0) + 1;
  if (app.dbg) dbgTick();
}

function buildUI() {
  const ui = $('#ui');
  ui.innerHTML = `
    <div class="vrsplit"></div>
    <div class="bar">
      <button class="ib" id="b-back" aria-label="Back">${icon('back')}</button>
      <div class="ttl"><b id="v-name"></b><small id="v-group"></small></div>
      <span class="badge" id="v-badge"></span>
      <button class="ib" id="b-help" aria-label="Controller">${icon('help')}</button>
    </div>
    <div class="status" id="v-status" hidden><i></i><span></span></div>
    <div class="scan" id="v-scan" hidden></div>
    <div class="tag" id="v-tag" hidden><b></b><span></span></div>
    <div class="hint" id="v-hint"></div>
    <div class="dock">
      <button class="db" id="b-say">${icon('sound')}<span></span></button>
      <button class="db" id="b-apart">${icon('apart')}<span></span></button>
      <button class="db" id="b-play">${icon('spin')}<span></span></button>
      <button class="db" id="b-360">${icon('g360')}<span></span></button>
      <button class="db" id="b-vr">${icon('vrbox')}<span></span></button>
      <span class="sep"></span>
      <button class="db" id="b-mode">${icon('screen')}<span></span></button>
    </div>
    <div class="vrx"><button class="ib" id="b-vrx" aria-label="Back">${icon('x')}</button><button class="ib" id="b-vrc" aria-label="Recenter">${icon('recenter')}</button></div>
    <div class="center" id="v-center"></div>
    <div class="toast" id="v-toast" style="opacity:0"></div>
    <div id="v-sheet"></div>
    ${Q.get('debug') ? '<div class="dbg" id="v-dbg"></div>' : ''}`;
  $('#b-back').onclick = goBack; $('#b-vrx').onclick = goBack;
  $('#b-help').onclick = () => openSheet('help');
  $('#b-mode').onclick = () => openSheet('modes');
  $('#b-say').onclick = () => { if (app.narr.playing) app.narr.stop(); else sayItem(); };
  $('#b-apart').onclick = () => { if (app.ctl && app.ctl.canExplode) { app.ctl.action('explode'); updateDock(); } };
  $('#b-play').onclick = togglePlay;
  $('#b-360').onclick = () => switchMode('gyro360');
  $('#b-vr').onclick = () => switchMode('vrbox');
  $('#b-vrc').onclick = () => app.ctl && app.ctl.recenter();
  $('#c').addEventListener('click', () => { if (app.mode === 'vrbox') { document.body.classList.add('ui-on'); clearTimeout(app.uiT); app.uiT = setTimeout(() => document.body.classList.remove('ui-on'), 4000); } });
  app.dbg = $('#v-dbg');
  app.built = true;
}

function texts() {
  const L = app.lang, it = app.item, m = app.mode;
  $('#v-name').textContent = it ? pick(it.name, L) : t('scan', L);
  $('#v-group').textContent = it ? groupName(it) + (it.card != null ? ` · ${t('card', L)} ${it.card + 1}` : '') : 'DUET AR';
  const b = $('#v-badge'); b.style.setProperty('--mc', MC[m]); b.className = 'badge' + (m.startsWith('anaglyph') ? ' ana' : '');
  b.innerHTML = icon(MODE_ICON[m]) + `<span>${esc(modeText(m, 'badge', L))}</span>`;
  $('#v-hint').textContent = app.noSensor ? modeText(m, 'noSensor', L) : (it && (m === 'scan' || m === 'pad') && app.ctl && app.ctl.trackState === 'tracking') ? pick(it.about, L) : modeText(m, 'hint', L);
  updateDock();
}
function updateDock() {
  const L = app.lang, set = (id, ic, label, on, show = true) => { const b = $('#' + id); if (!b) return; b.hidden = !show; b.innerHTML = icon(ic) + `<span>${esc(label)}</span>`; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', label); };
  const has = !!(app.item && app.model), ctl = app.ctl;
  set('b-say', 'sound', app.narr.playing ? t('stopTalk', L) : t('listen', L), app.narr.playing, has);
  set('b-apart', ctl && ctl.explodeTo ? 'together' : 'apart', ctl && ctl.explodeTo ? t('together', L) : t('apart', L), ctl && ctl.explodeTo, has && ctl && ctl.canExplode);
  const what = app.mixer ? (app.playing ? 'pause' : 'play') : 'spin';
  set('b-play', what, what === 'spin' ? t('turn', L) : t(what, L), app.mixer ? app.playing : ctl && ctl.spin, has);
  const back = app.back && (app.mode === 'gyro360' || app.mode === 'vrbox');
  set('b-360', back && app.mode === 'gyro360' ? MODE_ICON[app.back] : 'g360', back && app.mode === 'gyro360' ? t('ar', L) : t('g360', L), app.mode === 'gyro360', has);
  set('b-vr', 'vrbox', t('vr', L), app.mode === 'vrbox', has && app.mode !== 'vrbox');
  set('b-mode', MODE_ICON[app.mode], t('modes', L), false, true);
  const bm = $('#b-mode'); if (bm) bm.style.setProperty('--mc', MC[app.mode]);
}

/** the card scanner: no model until a card is seen; each card seen brings its own model */
async function openScan(item) {
  ensureRenderer(); if (!app.built) buildUI();
  $('#home').hidden = true; $('#viewer').hidden = false; document.body.classList.remove('home');
  const tok = ++app.token; closeMsg(); hideLabel(); app.narr.stop();
  if (item && (!app.item || app.item.id !== item.id || !app.model)) {
    if (app.ctl) { app.ctl.stop(); app.ctl = null; }
    disposeModel(); app.item = item;
    // a card's QR code brought us here: its model is loaded now, so it is there the moment the card is seen
    try { app.model = await loadItem(item, { base: location.href, renderer: app.renderer }); setupAnim(); } catch (e) { app.errors.push('load ' + item.id + ': ' + e.message); app.model = null; }
    if (tok !== app.token) return;
  } else if (!item && app.mode !== 'scan') { if (app.ctl) { app.ctl.stop(); app.ctl = null; } }
  document.title = 'DUET AR · ' + t('scan', app.lang);
  await setMode('scan');
}

async function openViewer(item, mode) {
  ensureRenderer(); if (!app.built) buildUI();
  $('#home').hidden = true; $('#viewer').hidden = false; document.body.classList.remove('home');
  const tok = ++app.token;
  closeMsg(); hideLabel(); app.narr.stop();
  if (!app.model || !app.item || app.item.id !== item.id) {
    if (app.ctl) { app.ctl.stop(); app.ctl = null; }
    disposeModel();
    app.item = item; app.mode = mode; texts();
    document.title = pick(item.name, app.lang) + ' · DUET AR';
    showLoading(0);
    const slow = setTimeout(() => { if (tok === app.token) showLoading(-1); }, 15000);
    try {
      app.model = await loadItem(item, { onProgress: (p) => tok === app.token && showLoading(p), base: location.href, renderer: app.renderer });
    } catch (e) {
      clearTimeout(slow); if (tok !== app.token) return;
      app.errors.push('load ' + item.id + ': ' + e.message); console.error(e);
      showMsg(t('loadFail', app.lang), String(e.message || e), [[t('back', app.lang), goBack], [t('next', app.lang), () => step(1)]]);
      return;
    }
    clearTimeout(slow);
    if (tok !== app.token) { disposeModel(); return; }
    setupAnim();
  }
  await setMode(mode);
}
function setupAnim() {
  const clips = app.model.clips; app.spinObj = app.model.root.userData.spinTarget || (app.model.root.children[0] && app.model.root.children[0].userData.spinTarget) || null;
  if (clips.length) { app.mixer = new THREE.AnimationMixer(app.model.root); app.mixer.clipAction(clips[0]).play(); app.playing = true; }
  else { app.mixer = null; app.playing = !!app.spinObj; }
}

function disposeModel() {
  if (!app.model) return;
  const root = app.model.root;
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) m.dispose();
  });
  if (app.mixer) app.mixer.stopAllAction(); app.mixer = null; app.model = null; app.spinObj = null;
}

/** a card was seen (scan mode), or laid on the pad (pad modes): bring up its model */
async function onCard(markerId, ctl) {
  const it = byCard(markerId - CARD_ID0); if (!it) return;
  if (app.item && app.item.id === it.id && app.model) { if (ctl.ctx.root !== app.model.root) { ctl.setModel(app.model.root, it); texts(); } return; }
  const tok = app.cardTok = (app.cardTok || 0) + 1;
  toast(`${t('loadingCard', app.lang)}: ${pick(it.name, app.lang)}…`, 1500);
  let model;
  try { model = await loadItem(it, { base: location.href, renderer: app.renderer }); } catch (e) { app.errors.push('load ' + it.id + ': ' + e.message); return; }
  if (tok !== app.cardTok || app.ctl !== ctl) { disposeOne(model); return; }
  app.narr.stop(); hideLabel();
  const old = app.model; app.model = model; app.item = it;
  ctl.setModel(model.root, it);
  if (old && old !== model) disposeOne(old);
  if (app.mixer) app.mixer.stopAllAction(); setupAnim();
  if (!app.mixer && !app.spinObj && app.playing) ctl.action('spin', true);
  history.replaceState(history.state, '', app.mode === 'scan' ? urlFor(it, 'scan') : urlFor(it, app.mode));
  document.title = pick(it.name, app.lang) + ' · DUET AR';
  texts();
}
function disposeOne(m) { m.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const x of ms) x.dispose(); }); }

async function setMode(mode) {
  const tok = app.token;
  if (app.ctl) { app.ctl.stop(); app.ctl = null; }
  hideLabel();
  app.mode = mode; app.noSensor = false;
  const info = MODE_INFO[mode];
  document.body.classList.toggle('cam', !!info.camera);
  document.body.classList.toggle('vr', mode === 'vrbox');
  if (app.item || mode === 'scan') history.replaceState(history.state, '', urlFor(app.item, mode));
  texts(); resize();
  app.pad.captureVolume(CAPTURE_VOLUME.has(mode));
  if (info.camera) { showLoading(1); setStatus('searching'); } else setStatus(null);
  let ctl;
  try {
    ctl = await startMode(mode, {
      canvas: $('#c'), renderer: app.renderer, scene: app.scene, camera: app.camera, root: app.model ? app.model.root : new THREE.Group(), overlay: $('#stage'),
      item: app.item || {}, pano: app.item && app.item.pano ? new URL(app.item.pano, location.href).href : null,
      onState: (s) => { setStatus(s); texts(); }, onCard, onTap,
      test: +Q.get('testvideo') || 0, procWidth: +Q.get('proc') || undefined, hfov: +Q.get('fov') || undefined, roi: Q.get('roi') === '0' ? false : undefined,
      distortion: Q.get('distort') === '1',
    });
  } catch (e) {
    if (tok !== app.token) return;
    hideLoading(); app.errors.push('mode ' + mode + ': ' + e.message);
    if (e.code === 'camera') showMsg(t('camFail', app.lang), t('camWhy', app.lang), [[t('tryAgain', app.lang), () => { closeMsg(); setMode(mode); }], ...(app.item ? [[t('useScreen', app.lang), () => { closeMsg(); setMode('screen'); }]] : [[t('back', app.lang), goBack]])], true);
    else showMsg(t('loadFail', app.lang), e.message, [[t('back', app.lang), goBack]]);
    setStatus(null); return;
  }
  if (tok !== app.token) { ctl.stop(); return; }
  app.ctl = ctl; resize(); hideLoading();
  if (ctl.spin !== undefined && app.item && !app.mixer && !app.spinObj && app.playing) ctl.action('spin', true);
  if (mode === 'gyro360' || mode === 'vrbox') {
    if (ctl.needsTap) showMsg(t('tapMotion', app.lang), '', [[t('tapMotion', app.lang), async () => { closeMsg(); await ctl.permitMotion(); }]]);
    clearTimeout(app.sensorT); app.sensorT = setTimeout(() => { if (app.ctl === ctl && !ctl.state().sensor) { app.noSensor = true; texts(); } }, 1500);
  }
  if (mode === 'vrbox') { toast(t('vrStart', app.lang), 5000); try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not allowed */ } }
  texts();
  if (Q.get('thumb') || Q.get('print')) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); document.title = 'READY'; }
}
/** 360° and VR from AR: the same model; pressing the button again (or back) returns to the camera */
function switchMode(m) {
  if (!app.item || !app.model) return;
  if (app.mode === m) { const b = app.back || 'screen'; app.back = null; setMode(b); return; }
  if (app.mode !== 'gyro360' && app.mode !== 'vrbox') app.back = app.mode;
  setMode(m);
}

function closeViewer() {
  app.token++;
  if (app.ctl) { app.ctl.stop(); app.ctl = null; }
  app.pad && app.pad.captureVolume(false); app.narr.stop(); hideLabel();
  closeSheet(true); closeMsg(); setStatus(null);
  document.body.classList.remove('cam', 'vr', 'ui-on');
  $('#viewer').hidden = true;
}

function goBack() {
  if (app.sheet) { history.back(); return; }
  if (app.back && (app.mode === 'gyro360' || app.mode === 'vrbox')) { const b = app.back; app.back = null; setMode(b); return; }
  const st = history.state;
  if (st && st.from === 'home') { history.back(); return; }
  if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) { history.back(); return; }
  history.replaceState(null, '', location.pathname); route();
}

function step(d) {
  if (app.mode === 'scan') return;   // the cards choose the model
  const list = app.catalog.items; if (!list.length || !app.item) return;
  const i = list.findIndex((x) => x.id === app.item.id), it = list[(i + d + list.length) % list.length];
  history.replaceState(history.state, '', urlFor(it, app.mode)); openViewer(it, app.mode);
}

function togglePlay() {
  if (app.mixer || app.spinObj) app.playing = !app.playing;
  else if (app.ctl) { app.ctl.action('spin'); app.playing = app.ctl.spin; }
  updateDock();
}

// ---------------------------------------------------------------------------------------------- tap a part, listen
function sayItem() {
  if (!app.item) return;
  const s = itemSay(app.item, app.lang);
  app.narr.say(s.clip, s.text, app.lang);
  showLabel(s.title, pick(app.item.about, app.lang), null);
}
function onTap(x, y, ctl) {
  if (!app.item || !app.model) return;
  const hit = ctl.pick(x, y);
  if (!hit) { hideLabel(); return; }
  const part = partFor(app.item, hit.mesh, app.lang);
  glow(hit.mesh);
  if (part) { showLabel(part.name, part.text, hit); app.narr.say(part.clip, part.name + '. ' + part.text, app.lang); }
  else { showLabel(pick(app.item.name, app.lang), pick(app.item.about, app.lang), hit); const s = itemSay(app.item, app.lang); app.narr.say(s.clip, s.text, app.lang); }
}
function glow(mesh) {
  const ms = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter((m) => m && m.emissive);
  for (const m of ms) { if (!m.userData.glow0) m.userData.glow0 = m.emissive.clone(); m.emissive.setRGB(0.32, 0.2, 0.04); clearTimeout(m.userData.glowT); m.userData.glowT = setTimeout(() => m.emissive.copy(m.userData.glow0), 1400); }
}
function showLabel(title, text, hit) {
  const el = $('#v-tag'); if (!el) return;
  el.querySelector('b').textContent = title; el.querySelector('span').textContent = text || '';
  el.hidden = false; el.classList.toggle('free', !hit);
  app.label = hit ? { mesh: hit.mesh, local: hit.mesh.worldToLocal(hit.point.clone()) } : null;
  clearTimeout(app.labelT); app.labelT = setTimeout(hideLabel, 9000);
  placeLabel();
}
function hideLabel() { const el = $('#v-tag'); if (el) el.hidden = true; app.label = null; }
function placeLabel() {
  const el = $('#v-tag'); if (!el || el.hidden) return;
  if (!app.label || app.mode === 'vrbox') { el.style.left = '50%'; el.style.top = ''; el.classList.add('free'); return; }
  const p = app.label.mesh.localToWorld(app.label.local.clone()).project(app.camera);
  const vis = app.ctl && app.ctl.anchor.visible !== false && p.z < 1;
  el.style.opacity = vis ? 1 : 0;
  el.style.left = ((p.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - p.y) / 2 * innerHeight) + 'px';
}

/** the Bluetooth remote / gamepad / keyboard */
function onPad(name, value) {
  if ($('#viewer').hidden) return;   // on the list: the arrows are for the page
  if (name === 'back') { if (app.sheet) history.back(); else goBack(); return; }
  if (name === 'help') { if (app.sheet === 'help') history.back(); else openSheet('help'); return; }
  if (name === 'next') return step(1);
  if (name === 'prev') return step(-1);
  if (name === 'play') return togglePlay();
  if (app.ctl) app.ctl.action(name, value);
}

// ---------------------------------------------------------------------------------------------- overlays
function openSheet(kind) {
  if (app.sheet) closeSheet(true);
  const L = app.lang, el = $('#v-sheet');
  if (kind === 'modes') {
    const list = app.item ? MODES : ['scan'];
    el.innerHTML = `<div class="sheet" role="dialog"><h3>${icon(MODE_ICON[app.mode])}${esc(t('modes', L))}<span class="sp"></span><button class="ib" data-x aria-label="Close">${icon('x')}</button></h3>
      <div class="modes">${list.map((m) => `<button class="mcard" data-m="${m}" aria-pressed="${m === app.mode}" style="--mc:${MC[m]}"><span class="mi">${icon(MODE_ICON[m])}</span><b>${esc(modeText(m, 'badge', L))}</b><small>${esc(modeText(m, 'hint', L))}</small></button>`).join('')}</div>
      <div class="seg" role="group" style="margin:12px 4px 0">${LANGS.map(([k, n]) => `<button data-lang="${k}" aria-pressed="${k === L}">${n}</button>`).join('')}</div></div>`;
    el.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { const m = b.dataset.m; app.back = null; history.back(); setTimeout(() => setMode(m), 0); });
    el.querySelectorAll('[data-lang]').forEach((b) => b.onclick = () => { app.lang = b.dataset.lang; setLang(app.lang); app.narr.stop(); history.back(); setTimeout(texts, 0); });
  } else {
    el.innerHTML = `<div class="sheet" role="dialog"><h3>${icon('help')}${esc(t('helpTitle', L))}<span class="sp"></span><button class="ib" data-x aria-label="Close">${icon('x')}</button></h3>
      <p class="fine" style="margin-top:0">${esc(t('tapPart', L))}</p>
      <dl class="keys">${HELP.map((h) => `<dt>${esc(pick(h.act, L))}</dt><dd>${esc(h.how)}</dd>`).join('')}</dl>
      <p class="fine">${esc(t('helpNote', L))}</p><div class="pad-live">${icon('help')}<span id="v-last">—</span></div></div>`;
  }
  el.querySelector('[data-x]').onclick = () => history.back();
  app.sheet = kind; history.pushState({ ...(history.state || {}), sheet: kind }, '');
}
function closeSheet() { if (!app.sheet) return; app.sheet = null; $('#v-sheet').innerHTML = ''; }

function showLoading(p) {
  const L = app.lang, c = 2 * Math.PI * 25, pr = p < 0 ? 0.9 : Math.max(0.04, Math.min(1, p));
  $('#v-center').innerHTML = `<div class="loading"><svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,.12)"/><circle cx="29" cy="29" r="25" stroke="#f26b1d" stroke-linecap="round" stroke-dasharray="${c * pr} ${c}" transform="rotate(-90 29 29)"/></svg>
    <span>${esc(t('opening', L))}${p > 0 && p < 1 ? ' ' + Math.round(p * 100) + '%' : ''}</span>${p < 0 ? `<p style="max-width:300px;text-align:center;margin:0">${esc(t('slow', L))}</p><button class="btn" id="b-slow">${esc(t('back', L))}</button>` : ''}</div>`;
  const b = $('#b-slow'); if (b) b.onclick = goBack;
}
function hideLoading() { $('#v-center').innerHTML = ''; }
function showMsg(title, text, buttons) {
  $('#v-center').innerHTML = `<div class="card-msg"><b>${esc(title)}</b>${text ? `<p>${esc(text)}</p>` : '<p></p>'}<div class="btns">${buttons.map(([n], i) => `<button class="btn ${i === buttons.length - 1 ? 'acc' : ''}" data-i="${i}">${esc(n)}</button>`).join('')}</div></div>`;
  $('#v-center').querySelectorAll('[data-i]').forEach((b) => b.onclick = buttons[+b.dataset.i][1]);
}
function closeMsg() { const c = $('#v-center'); if (c) c.innerHTML = ''; }
function toast(text, ms = 2200) {
  const el = $('#v-toast'); if (!el) return;
  el.textContent = text; el.style.opacity = 1; clearTimeout(app.toastT); app.toastT = setTimeout(() => { el.style.opacity = 0; }, ms);
}
function setStatus(s) {
  const el = $('#v-status'), sc = $('#v-scan'); if (!el) return;
  const info = MODE_INFO[app.mode], L = app.lang, isCube = info.board === 'cube', isCards = app.mode === 'scan';
  if (!s || !info.camera) { el.hidden = true; sc.hidden = true; return; }
  el.hidden = false; clearTimeout(app.stT); el.style.opacity = 1;
  if (s === 'tracking') { el.className = 'status ok'; el.lastChild.textContent = app.ctl && app.ctl.onPad ? t('onPadNow', L) : t('found', L); sc.hidden = true; app.stT = setTimeout(() => { el.style.opacity = 0; }, 1600); }
  else if (s === 'holding' || s === 'fading') { el.className = 'status hold'; el.lastChild.textContent = t(isCube ? 'lostCube' : isCards ? 'lostCard' : 'lostPad', L); }
  else { el.className = 'status'; el.lastChild.textContent = modeText(app.mode, 'searching', L); sc.hidden = false; sc.classList.toggle('cube', isCube); sc.classList.toggle('cards', isCards); }
}
function dbgTick() {
  const now = performance.now(); if (now - (app.dbgT || 0) < 250) return;
  const fps = app.dbgT ? ((app.frames - (app.dbgF || 0)) * 1000 / (now - app.dbgT)) : 0; app.dbgT = now; app.dbgF = app.frames;
  const s = app.ctl.state(), r = app.renderer.info.render;
  app.dbg.textContent = `${s.mode}  draw ${fps.toFixed(0)} fps${s.track ? `  track ${s.track}${s.card ? ' card ' + s.card : ''}${s.onPad ? ' (pad)' : ''}\ntracker ${s.fps.toFixed(1)} fps  ${s.ms.toFixed(1)} ms  ${s.worker ? 'worker' : 'page'}  ${s.px || 0} px  roi ${s.roi}\nfound ${s.found}/${s.frames}` : ''}\ndraw calls ${r.calls}  tris ${r.triangles}`;
}

// a key name for the help sheet's "last pressed" line
addEventListener('keydown', (e) => { const el = $('#v-last'); if (el) el.textContent = `${e.key}  (${app.pad.last || '—'})`; }, false);

// thumbnails (devtools/ar/make_thumbs.mjs) and the pictures on the printed cards (make_cards.mjs): one model, posed
window.__thumb = async (id, o = {}) => {
  const it = findItem(id); await openViewer(it, 'screen');
  const c = app.camera, oc = app.ctl.controls, d = c.position.distanceTo(oc.target) * (o.zoom || it.thumbZoom || 0.86);
  const az = THREE.MathUtils.degToRad(o.az ?? it.thumbAz ?? 32), el = THREE.MathUtils.degToRad(o.el ?? it.thumbEl ?? 16);
  c.position.set(oc.target.x + d * Math.sin(az) * Math.cos(el), oc.target.y + d * Math.sin(el), oc.target.z + d * Math.cos(az) * Math.cos(el));
  oc.update(); oc.enableDamping = false; oc.update();
  if (app.mixer) { app.playing = false; app.mixer.setTime(it.thumbT ?? 0.6); }
  if (o.noShadow && app.ctl.shadow) app.ctl.shadow.visible = false;
  app.ctl.update(0); app.ctl.render();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};

boot().catch((e) => { app.errors.push('boot: ' + e.message); console.error(e); });
// offline: the first open saves the page, its models and its narration on the device (sw.js; duetoffline.js shows the progress)
if ('serviceWorker' in navigator && !Q.has('thumb') && !Q.has('print') && !Q.has('test') && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(() => {});
